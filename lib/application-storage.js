"use client";

import { createClient } from "@/lib/supabase/client";

/** Nama bucket Supabase Storage untuk berkas lamaran (sama persis dengan di dashboard, huruf besar D). */
export const APPLICATION_BUCKET = "Documents";

const safeName = (name) =>
  String(name ?? "file")
    .normalize("NFKD")
    .replace(/[^A-Za-z0-9._-]+/g, "_")
    .slice(-80) || "file";

/** Hapus berkas yang sudah terunggah (dipakai bila lamaran gagal disimpan). Kegagalan hapus diabaikan. */
export async function removeApplicationFiles(paths) {
  if (!paths?.length) return;
  try {
    await createClient().storage.from(APPLICATION_BUCKET).remove(paths);
  } catch {
    // berkas yatim bisa dibersihkan manual di dashboard
  }
}

/**
 * Unggah CV (opsional) dan portofolio baru ke bucket Documents.
 * Lokasi: <user_id>/<job_id>/<jenis>-<waktu>-<nomor>-<nama aman>. Awalan user_id dipakai kebijakan Storage.
 *
 * @param {{ jobId: string, cvFile?: File|null, portfolioFiles?: { id: string, name: string, file: File }[] }} input
 * @returns {Promise<{ ok: true, cvPath: string|null, portfolioPaths: Record<string,string>, uploaded: string[] } | { ok: false, error: "auth"|"storage" }>}
 */
export async function uploadApplicationFiles({ jobId, cvFile = null, portfolioFiles = [] }) {
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();
  const user = data?.user;
  if (!user) return { ok: false, error: "auth" };

  const stamp = Date.now();
  const prefix = `${user.id}/${jobId}`;
  const uploaded = [];

  async function put(kind, index, file) {
    const path = `${prefix}/${kind}-${stamp}-${index}-${safeName(file.name)}`;
    const { error } = await supabase.storage
      .from(APPLICATION_BUCKET)
      .upload(path, file, { contentType: file.type || "application/octet-stream", upsert: false });
    if (error) {
      console.error("[uploadApplicationFiles]", error.message);
      throw new Error(error.message);
    }
    uploaded.push(path);
    return path;
  }

  try {
    const cvPath = cvFile ? await put("cv", 0, cvFile) : null;
    const portfolioPaths = {};
    for (const [i, p] of portfolioFiles.entries()) portfolioPaths[p.id] = await put("portfolio", i, p.file);
    return { ok: true, cvPath, portfolioPaths, uploaded };
  } catch {
    await removeApplicationFiles(uploaded);
    return { ok: false, error: "storage" };
  }
}
