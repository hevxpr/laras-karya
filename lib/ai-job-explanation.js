import { buildFacts, buildPrompt, hashFacts, validateExplanation } from "@/lib/ai-explain-core";
import { isUuid } from "@/lib/is-uuid";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

/**
 * Penjelasan AI untuk kartu "Mengapa lowongan ini cocok untuk Anda". HANYA untuk server:
 * GEMINI_API_KEY tidak boleh sampai ke browser, jadi jangan impor file ini dari komponen client.
 *
 * Alur: susun fakta -> cek cache (ai_job_explanations) -> ambil jatah harian (consume_ai_quota) -> panggil Gemini
 * (maks 10 detik) -> periksa jawaban -> simpan ke cache. Setiap langkah yang gagal mengembalikan null,
 * dan pemanggil menampilkan kartu versi biasa. Fungsi ini tidak pernah melempar error.
 *
 * Environment: GEMINI_API_KEY (wajib), GEMINI_MODEL (bawaan gemini-3.5-flash-lite, ikuti nilai di Vercel),
 * AI_EXPLAIN_DAILY_LIMIT (bawaan 30 penjelasan baru per pengguna per hari).
 */

const MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
const TIMEOUT_MS = 10_000;
const FEATURE = "job_explanation";
const DAILY_LIMIT = Number(process.env.AI_EXPLAIN_DAILY_LIMIT) > 0 ? Number(process.env.AI_EXPLAIN_DAILY_LIMIT) : 30;

async function callGemini(prompt) {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY },
    body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }] }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
    cache: "no-store",
  });
  if (!res.ok) {
    const detail = (await res.text().catch(() => "")).replace(/\s+/g, " ").slice(0, 300);
    throw new Error(`HTTP ${res.status} (model ${MODEL}): ${detail}`);
  }
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
}

/** Data profil tambahan yang dibutuhkan fakta (level pengalaman, provinsi, jenjang pendidikan). */
async function loadExtra(supabase, userId) {
  const [profileRes, eduRes] = await Promise.all([
    supabase.from("profiles").select("experience_level,province").eq("id", userId).maybeSingle(),
    supabase.from("educations").select("degree_level").eq("user_id", userId),
  ]);
  return {
    experienceLevel: profileRes.data?.experience_level ?? null,
    province: profileRes.data?.province ?? null,
    degreeLevels: (eduRes.data ?? []).map((e) => e.degree_level).filter(Boolean),
  };
}

/**
 * @param {import("@/lib/job-detail-data").JobDetail} job  detail lowongan dari fetchJobDetail
 * @param {{ id: string }} user                           user yang sedang masuk (getCurrentUser)
 * @returns {Promise<string | null>} ringkasan 2-3 kalimat, atau null (pakai tampilan biasa)
 */
export async function getJobExplanation(job, user) {
  try {
    if (!isSupabaseConfigured || !process.env.GEMINI_API_KEY) return null;
    if (!user?.id || !isUuid(job?.id)) return null;

    const supabase = await createClient();
    const facts = buildFacts(job, await loadExtra(supabase, user.id));
    const hash = hashFacts(facts, MODEL);

    const { data: cached, error: cacheError } = await supabase
      .from("ai_job_explanations")
      .select("input_hash,explanation")
      .eq("user_id", user.id)
      .eq("job_id", job.id)
      .maybeSingle();
    if (cacheError) {
      // Tabel belum dibuat (migrasi belum dijalankan) atau gagal dibaca: jangan memanggil AI tanpa cache dan batas.
      console.warn("[ai-job-explanation] cache:", cacheError.message);
      return null;
    }
    if (cached?.input_hash === hash) return cached.explanation;

    const { data: allowed, error: quotaError } = await supabase.rpc("consume_ai_quota", {
      p_feature: FEATURE,
      p_limit: DAILY_LIMIT,
    });
    if (quotaError) {
      console.warn("[ai-job-explanation] quota:", quotaError.message);
      return null;
    }
    if (allowed !== true) return null; // jatah hari ini habis

    const explanation = validateExplanation(await callGemini(buildPrompt(facts)), facts);
    if (!explanation) {
      console.warn("[ai-job-explanation] jawaban Gemini tidak lolos pemeriksaan");
      return null;
    }

    const { error: saveError } = await supabase.from("ai_job_explanations").upsert(
      {
        user_id: user.id,
        job_id: job.id,
        input_hash: hash,
        explanation,
        model: MODEL,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,job_id" },
    );
    if (saveError) console.warn("[ai-job-explanation] simpan cache:", saveError.message);
    return explanation;
  } catch (error) {
    console.warn("[ai-job-explanation]", error?.message ?? error);
    return null;
  }
}
