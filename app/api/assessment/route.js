import { NextResponse } from "next/server";

import { loadMyAssessment, saveAssessment } from "@/app/assessment/actions";

/**
 * API asesmen: POST /api/assessment dan GET /api/assessment.
 * Memakai logika yang sama dengan Server Action (validasi ulang di server, sesi user, RLS),
 * jadi data asesmen tersimpan ke assessments dan juga ke profil user (profiles, educations, user_skills).
 */

// Pemetaan hasil saveAssessment -> status HTTP
const STATUS_BY_ERROR = { auth: 401, invalid: 422, db: 500 };

/**
 * POST /api/assessment
 * Body: { step_1, step_2, step_3 } (bentuk sama dengan context/assessment-store.js)
 * Sukses: 200 { ok: true, skippedSkills }
 * Gagal : 400 body bukan JSON | 401 belum masuk | 422 jawaban tidak valid | 500 gagal menyimpan
 */
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  const result = await saveAssessment(body);
  if (result.ok) return NextResponse.json(result);

  return NextResponse.json(result, { status: STATUS_BY_ERROR[result.error] ?? 500 });
}

/**
 * GET /api/assessment
 * Selalu 200 { ok: true, answers }. answers = null jika user belum masuk atau belum pernah mengisi asesmen.
 */
export async function GET() {
  const answers = await loadMyAssessment();
  return NextResponse.json({ ok: true, answers }, { headers: { "Cache-Control": "no-store" } });
}