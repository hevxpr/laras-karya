/**
 * Memisahkan keahlian lowongan menjadi keterampilan teknis (job_skills.is_required = true atau kosong)
 * dan keterampilan pendukung (is_required = false).
 * Kesepakatan tim: is_required kosong dianggap WAJIB, sama dengan rumus skor dan skill gap di database.
 * `structured` hanya true bila datanya membawa penanda itu (lowongan dari database);
 * data contoh (id 1–15) tidak punya, jadi tampilannya tetap seperti sebelumnya.
 *
 * @param {Array<{ status: string, required?: boolean|null }>} skills
 */
export function groupSkills(skills = []) {
  const structured = skills.some((s) => typeof s.required === "boolean");
  if (!structured) {
    return { structured: false, technical: [], supporting: [], technicalMissing: [], supportingMissing: [] };
  }
  const missing = (s) => s.status !== "dimiliki";
  const technical = skills.filter((s) => s.required !== false);
  const supporting = skills.filter((s) => s.required === false);
  return {
    structured: true,
    technical,
    supporting,
    technicalMissing: technical.filter(missing),
    supportingMissing: supporting.filter(missing),
  };
}
