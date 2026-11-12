"use client";

import { useEffect, useRef, useState } from "react";
import {
  Award,
  Briefcase,
  CircleX,
  Download,
  FileText,
  Globe,
  GraduationCap,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  SlidersHorizontal,
  Sparkles,
  Star,
  Trash2,
  UploadCloud,
  User,
} from "lucide-react";

import {
  addCertification,
  addEducation,
  addExperience,
  addLanguage,
  addSkill,
  cancelProfile,
  deleteCertification,
  deleteEducation,
  deleteExperience,
  deleteResume,
  deleteSkill,
  downloadResume,
  editCertification,
  editBio,
  editContact,
  editEducation,
  editExperience,
  editPreferences,
  editProfileHeader,
  generateResume,
  parseLocation,
} from "./actions";
import { loadMyProfile, saveMyProfile } from "./data-actions";
import { suggestSkillsFromCertificate } from "./skill-actions";

import { LinkedinIcon } from "@/components/icons";
import { Footer } from "@/components/layout/footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PROFILE, PROFILE_REMAINING } from "@/lib/profile-data";
import {
  EXPERIENCE_LEVELS,
  INDUSTRIES,
  PROVINCES,
  SKILL_OPTIONS,
  WORK_ARRANGEMENTS,
} from "@/lib/profile-options";

const CARD = "rounded-3xl border border-line bg-white p-6 md:p-8";
const CARD_TITLE = "flex items-center gap-3 text-xl font-semibold text-ink";
const CARD_ICON = "grid size-10 place-items-center rounded-xl bg-brand-light text-brand";
const PILL_BUTTON =
  "h-10 gap-1.5 rounded-full border-brand bg-white px-4 text-sm font-semibold text-brand hover:bg-brand-light hover:text-brand";
const EDIT_LINK =
  "inline-flex min-h-9 items-center gap-1.5 text-brand hover:underline focus-visible:ring-3 focus-visible:ring-brand/30 focus-visible:outline-none";
const DELETE_LINK =
  "inline-flex min-h-9 items-center gap-1.5 text-red-600 hover:underline focus-visible:ring-3 focus-visible:ring-red-300 focus-visible:outline-none";
const INPUT =
  "w-full rounded-xl border border-line bg-white px-4 text-sm text-ink outline-none placeholder:text-subtle/80 focus:border-brand focus:ring-3 focus:ring-brand/20";

// Isi formulir dialog untuk tiap tombol Tambah / Edit.
const FORMS = {
  header: {
    title: { edit: "Ubah Profil" },
    fields: [
      { name: "name", label: "Nama Lengkap", required: true },
      { name: "headline", label: "Posisi Saat Ini" },
      { name: "status", label: "Status Karier" },
    ],
  },
  experience: {
    title: { add: "Tambah Pengalaman", edit: "Ubah Pengalaman" },
    fields: [
      { name: "role", label: "Jabatan", required: true },
      { name: "company", label: "Perusahaan", required: true },
      { name: "period", label: "Periode", placeholder: "Jan 2022 — Sekarang" },
      { name: "description", label: "Deskripsi", type: "textarea" },
    ],
  },
  education: {
    title: { add: "Tambah Pendidikan", edit: "Ubah Pendidikan" },
    fields: [
      { name: "degree", label: "Jenjang dan Jurusan", required: true, placeholder: "S1 Ilmu Lingkungan" },
      { name: "school", label: "Institusi", required: true },
      { name: "period", label: "Periode", placeholder: "2016 — 2020" },
      { name: "gpa", label: "IPK", placeholder: "IPK: 3.72 / 4.00" },
    ],
  },
  certification: {
    title: { add: "Tambah Sertifikasi", edit: "Ubah Sertifikasi" },
    fields: [
      { name: "name", label: "Nama Sertifikasi", required: true },
      { name: "issuer", label: "Penerbit", required: true },
      { name: "year", label: "Tahun", inputMode: "numeric", placeholder: "2023" },
    ],
  },
  bio: {
    title: { edit: "Ubah Bio" },
    fields: [
      {
        name: "bio",
        label: "Bio",
        type: "textarea",
        rows: 6,
        maxLength: 500,
        placeholder: "Ceritakan singkat latar belakang, keahlian, dan tujuan karier Anda.",
      },
    ],
  },
  preferences: {
    title: { edit: "Ubah Preferensi Karier" },
    fields: [
      { name: "workArrangement", label: "Pola kerja yang Anda inginkan", type: "radio", options: WORK_ARRANGEMENTS, required: true },
      { name: "industries", label: "Bidang industri yang Anda minati (pilih satu atau lebih)", type: "checkboxes", options: INDUSTRIES, required: true },
      { name: "experienceLevel", label: "Tingkat pengalaman kerja", type: "select", options: EXPERIENCE_LEVELS, placeholder: "Pilih tingkat pengalaman", required: true },
    ],
  },
  contact: {
    title: { edit: "Ubah Informasi Kontak" },
    fields: [
      { name: "email", label: "Email", type: "email", required: true },
      { name: "phone", label: "Nomor HP", type: "tel" },
      { name: "city", label: "Kota", required: true, placeholder: "Banjarbaru" },
      { name: "province", label: "Provinsi", type: "select", options: PROVINCES, placeholder: "Pilih provinsi", required: true },
      { name: "linkedin", label: "LinkedIn", placeholder: "linkedin.com/in/namaanda" },
    ],
  },
  skill: {
    title: { add: "Tambah Skill" },
    fields: [{ name: "label", label: "Nama Skill", type: "skill-select", required: true }],
  },
  language: {
    title: { add: "Tambah Bahasa" },
    fields: [
      { name: "name", label: "Bahasa", required: true },
      // Daftar level harus sama dengan LANGUAGE_LEVELS di actions.js
      { name: "level", label: "Tingkat", type: "select", options: ["Native", "Profesional", "Menengah", "Dasar"], defaultValue: "Profesional" },
    ],
  },
};

// Aksi yang dipanggil saat formulir dialog dikirim.
const ACTIONS = {
  header: { edit: editProfileHeader },
  bio: { edit: editBio },
  preferences: { edit: editPreferences },
  experience: { add: addExperience, edit: editExperience },
  education: { add: addEducation, edit: editEducation },
  certification: { add: addCertification, edit: editCertification },
  contact: { edit: editContact },
  skill: { add: addSkill },
  language: { add: addLanguage },
};

function formatAddedAt(iso) {
  return new Date(iso).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getValues(profile, type, id) {
  if (type === "header") return profile;
  if (type === "bio") return { bio: profile.bio ?? "" };
  if (type === "preferences") {
    return {
      workArrangement: profile.workArrangement ?? "",
      industries: profile.industries ?? [],
      experienceLevel: profile.experienceLevel ?? "",
    };
  }
  if (type === "contact") return { ...profile.contact, ...parseLocation(profile.contact.location) };
  const lists = {
    experience: profile.experiences,
    education: profile.education,
    certification: profile.certifications,
  };
  return lists[type]?.find((item) => item.id === id) ?? {};
}

// Dropdown skill: pilih dari daftar (skill yang sudah dimiliki disembunyikan).
// Daftar mengikuti katalog keahlian; tidak ada ketik bebas.
function SkillSelectField({ field, ownedSkills }) {
  const [value, setValue] = useState("");
  const owned = new Set(ownedSkills.map((skill) => skill.label.toLowerCase()));
  const options = SKILL_OPTIONS.filter((option) => !owned.has(option.toLowerCase()));

  return (
    <>
      <select
        id={`field-${field.name}`}
        name={field.name}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        required={field.required}
        className={`${INPUT} h-11`}
      >
        <option value="" disabled>
          Pilih skill
        </option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </>
  );
}

// Pilih satu (pola kerja), ditampilkan sebagai kartu seperti di halaman onboarding.
function RadioCards({ field, defaultValue }) {
  return (
    <div role="radiogroup" aria-labelledby={`label-${field.name}`} className="grid grid-cols-3 gap-3">
      {field.options.map((option) => (
        <label
          key={option}
          className="flex min-h-11 cursor-pointer items-center justify-center rounded-full border border-line bg-white px-3 text-sm font-semibold text-ink transition-colors has-[:checked]:border-brand has-[:checked]:bg-brand-light has-[:checked]:text-brand has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-brand/30"
        >
          <input
            type="radio"
            name={field.name}
            value={option}
            defaultChecked={defaultValue === option}
            required={field.required}
            className="sr-only"
          />
          {option}
        </label>
      ))}
    </div>
  );
}

// Pilih satu atau lebih (bidang industri), ditampilkan sebagai chip.
function CheckboxChips({ field, defaultValue = [] }) {
  return (
    <div role="group" aria-labelledby={`label-${field.name}`} className="flex flex-wrap gap-2.5">
      {field.options.map((option) => (
        <label
          key={option}
          className="inline-flex min-h-9 cursor-pointer items-center rounded-full border border-line bg-white px-4 text-sm text-ink transition-colors has-[:checked]:border-brand has-[:checked]:bg-brand-light has-[:checked]:font-semibold has-[:checked]:text-brand has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-brand/30"
        >
          <input
            type="checkbox"
            name={field.name}
            value={option}
            defaultChecked={defaultValue.includes(option)}
            className="sr-only"
          />
          {option}
        </label>
      ))}
    </div>
  );
}

export default function ProfilePage() {
  // `saved` = data terakhir di database, `draft` = data yang sedang diubah di layar.
  // null = masih dimuat dari Supabase. PROFILE (tokoh contoh) hanya dipakai bila Supabase belum dikonfigurasi.
  const [saved, setSaved] = useState(null);
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const [dialog, setDialog] = useState(null);
  const [toast, setToast] = useState("");
  const [resumes, setResumes] = useState([]);
  const [generating, setGenerating] = useState(false);
  // Saran keahlian AI dari sertifikat yang baru ditambahkan: { status: "idle" | "loading" | "done", source, labels }.
  const [aiSkills, setAiSkills] = useState({ status: "idle", source: "", labels: [] });
  const aiRequestRef = useRef(0);
  const dialogRef = useRef(null);

  const p = draft;

  // Tombol Simpan Perubahan hanya aktif kalau ada tambah / edit / hapus yang belum disimpan.
  const hasChanges = JSON.stringify(draft) !== JSON.stringify(saved);

  // Muat profil user yang sedang masuk dari Supabase.
  useEffect(() => {
    let alive = true;
    loadMyProfile().then((loaded) => {
      if (!alive) return;
      const data = loaded ?? PROFILE;
      setSaved(data);
      setDraft(data);
    });
    return () => {
      alive = false;
    };
  }, []);

  // Buka / tutup dialog bawaan browser mengikuti state `dialog`.
  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (dialog && !el.open) el.showModal();
    if (!dialog && el.open) el.close();
  }, [dialog]);

  // Pesan singkat hilang sendiri setelah 3 detik.
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  function openDialog(type, mode, id) {
    setDialog({ type, mode, id, key: Date.now(), values: mode === "edit" ? getValues(draft, type, id) : {} });
  }

  function handleDialogSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const { type, mode, id } = dialog;

    // Checkbox tidak bisa memakai `required` bawaan browser, jadi dicek di sini.
    if (type === "preferences" && formData.getAll("industries").length === 0) {
      setDialog((current) => ({ ...current, error: "Pilih minimal satu bidang industri." }));
      return;
    }

    setDraft((current) => ACTIONS[type][mode](current, formData, id));
    setDialog(null);

    if (type === "certification" && mode === "add") {
      suggestSkillsForCertificate(String(formData.get("name") ?? ""), String(formData.get("issuer") ?? ""));
    }
  }

  // Minta saran keahlian dari nama sertifikat. Jika gagal, diam saja: sertifikat tetap tertambah.
  // Penghitung permintaan memastikan jawaban lama tidak menimpa yang lebih baru.
  async function suggestSkillsForCertificate(name, issuer) {
    const requestId = ++aiRequestRef.current;
    setAiSkills({ status: "loading", source: name, labels: [] });
    let labels = [];
    try {
      const res = await suggestSkillsFromCertificate({ name, issuer });
      if (res.ok) labels = res.labels;
    } catch {
      // abaikan
    }
    if (requestId !== aiRequestRef.current) return;
    setAiSkills(labels.length > 0 ? { status: "done", source: name, labels } : { status: "idle", source: "", labels: [] });
  }

  function addSuggestedSkill(label) {
    const formData = new FormData();
    formData.set("label", label);
    setDraft((current) => addSkill(current, formData));
  }

  function dismissAiSkills() {
    aiRequestRef.current += 1;
    setAiSkills({ status: "idle", source: "", labels: [] });
  }

  function handleDelete(deleteAction, id, label) {
    if (!window.confirm(`Hapus "${label}"?`)) return;
    setDraft((current) => deleteAction(current, id));
  }

  async function handleSave() {
    if (!hasChanges || saving) return;
    setSaving(true);
    const res = await saveMyProfile(draft);
    setSaving(false);
    if (!res.ok) {
      setToast(res.error);
      return;
    }
    setSaved(res.profile);
    setDraft(res.profile);
    setToast("Perubahan profil tersimpan.");
  }

  function handleCancel() {
    setDraft(cancelProfile(saved));
    setToast("Perubahan dibatalkan.");
  }

  // Buat PDF dari profil yang sedang tampil di layar; hasilnya ditaruh paling atas dan jadi Default.
  async function handleCreateResume() {
    setGenerating(true);
    try {
      const resume = await generateResume(draft, resumes);
      setResumes((list) => [resume, ...list]);
      setToast("Resume berhasil dibuat.");
    } catch {
      setToast("Resume gagal dibuat. Coba lagi.");
    } finally {
      setGenerating(false);
    }
  }

  function handleDeleteResume(resume) {
    if (!window.confirm(`Hapus "${resume.name}"?`)) return;
    setResumes((list) => deleteResume(list, resume.id));
    setToast("Resume dihapus.");
  }

  const form = dialog ? FORMS[dialog.type] : null;

  if (!p) {
    return (
      <main className="flex-1 bg-surface" aria-busy="true">
        <div className="mx-auto max-w-[1200px] space-y-6 px-4 py-8 md:px-6 md:py-10 xl:px-8">
          <p className="sr-only">Memuat profil…</p>
          <div className="h-48 animate-pulse rounded-3xl bg-white motion-reduce:animate-none" />
          <div className="h-72 animate-pulse rounded-3xl bg-white motion-reduce:animate-none" />
        </div>
      </main>
    );
  }

  // Saran AI yang belum dimiliki user (skill yang sudah ada tidak ditawarkan lagi).
  const ownedSkills = new Set(p.skills.map((skill) => skill.label.toLowerCase()));
  const freshAiSkills = aiSkills.labels.filter((label) => !ownedSkills.has(label.toLowerCase()));

  return (
    <main className="flex-1 bg-surface">
      <div className="mx-auto max-w-[1200px] px-4 py-8 md:px-6 md:py-10 xl:px-8">
        {/* Identitas */}
        <section className="flex flex-col gap-6 rounded-3xl border border-line bg-white p-6 md:flex-row md:items-center md:justify-between md:p-10">
          <div className="flex items-center gap-5 md:gap-6">
            <div
              aria-hidden="true"
              className="grid size-20 shrink-0 place-items-center rounded-full bg-brand text-3xl font-bold text-white md:size-[104px] md:text-4xl"
            >
              {p.initials}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <h1 className="text-2xl font-bold tracking-tight text-ink md:text-3xl">{p.name}</h1>
                <button
                  type="button"
                  aria-label="Edit profil"
                  onClick={() => openDialog("header", "edit")}
                  className="inline-flex min-h-9 items-center gap-1.5 text-sm font-semibold text-brand hover:underline focus-visible:ring-3 focus-visible:ring-brand/30 focus-visible:outline-none"
                >
                  <Pencil className="size-4" aria-hidden="true" />
                  Edit
                </button>
              </div>
              <p className="mt-1 text-base text-ink/70">{p.headline}</p>
              {p.status && (
                <Badge tone="brand" outline className="mt-2 border-brand px-3 py-1 text-sm font-semibold">
                  {p.status}
                </Badge>
              )}
            </div>
          </div>

          <div className="md:w-[44%] md:max-w-[560px]">
            <div className="flex items-center justify-between text-base">
              <span id="kelengkapan-label" className="font-semibold text-brand">
                Kelengkapan Profil
              </span>
              <span className="font-bold text-brand">{p.completeness}%</span>
            </div>
            <div
              role="progressbar"
              aria-labelledby="kelengkapan-label"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={p.completeness}
              className="mt-2 h-2.5 overflow-hidden rounded-full bg-line"
            >
              <div className="h-full rounded-full bg-brand" style={{ width: `${p.completeness}%` }} />
            </div>
            <p className="mt-2 text-sm text-ink/70">{(p.remaining ?? PROFILE_REMAINING) || "Profil Anda sudah lengkap"}</p>
          </div>
        </section>

        <p className="mt-6 flex items-center gap-4 rounded-2xl bg-brand-light px-5 py-3.5 text-sm text-ink">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white text-accent">
            <Sparkles className="size-4" aria-hidden="true" />
          </span>
          Setiap perubahan pada profil Anda akan otomatis memperbarui rekomendasi karier dan tingkat kecocokan AI.
        </p>

        <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
          <div className="space-y-6">
            {/* Bio */}
            <section aria-labelledby="bio-title" className={CARD}>
              <header className="flex flex-wrap items-center justify-between gap-3">
                <h2 id="bio-title" className={CARD_TITLE}>
                  <span className={CARD_ICON}>
                    <User className="size-5" aria-hidden="true" />
                  </span>
                  Bio
                </h2>
                <Button
                  type="button"
                  variant="outline"
                  aria-label="Edit bio"
                  onClick={() => openDialog("bio", "edit")}
                  className={PILL_BUTTON}
                >
                  <Pencil className="size-4" aria-hidden="true" />
                  Edit
                </Button>
              </header>
              <div className="mt-6">
                {p.bio ? (
                  <p className="whitespace-pre-line text-base leading-relaxed text-ink">{p.bio}</p>
                ) : (
                  <p className="text-sm text-ink/70">Belum ada bio. Ceritakan singkat tentang diri Anda.</p>
                )}
              </div>
            </section>

            {/* Preferensi karier */}
            <section aria-labelledby="preferensi-title" className={CARD}>
              <header className="flex flex-wrap items-center justify-between gap-3">
                <h2 id="preferensi-title" className={CARD_TITLE}>
                  <span className={CARD_ICON}>
                    <SlidersHorizontal className="size-5" aria-hidden="true" />
                  </span>
                  Preferensi Karier
                </h2>
                <Button
                  type="button"
                  variant="outline"
                  aria-label="Edit preferensi karier"
                  onClick={() => openDialog("preferences", "edit")}
                  className={PILL_BUTTON}
                >
                  <Pencil className="size-4" aria-hidden="true" />
                  Edit
                </Button>
              </header>
              <dl className="mt-6 space-y-5 text-sm">
                <div>
                  <dt className="font-semibold text-ink">Tingkat pengalaman kerja</dt>
                  <dd className="mt-1 text-ink/70">{p.experienceLevel || "Belum diisi"}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-ink">Pola kerja</dt>
                  <dd className="mt-1.5">
                    {p.workArrangement ? (
                      <Badge tone="brand" outline className="border-brand px-3 py-1 text-sm font-semibold">
                        {p.workArrangement}
                      </Badge>
                    ) : (
                      <span className="text-ink/70">Belum diisi</span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-ink">Bidang industri yang diminati</dt>
                  <dd className="mt-1.5">
                    {p.industries?.length > 0 ? (
                      <ul className="flex flex-wrap gap-2">
                        {p.industries.map((industry) => (
                          <li
                            key={industry}
                            className="inline-flex min-h-8 items-center rounded-full border border-brand bg-brand-light px-3 text-sm font-medium text-brand"
                          >
                            {industry}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-ink/70">Belum diisi</span>
                    )}
                  </dd>
                </div>
              </dl>
            </section>

            {/* Pengalaman kerja */}
            <section aria-labelledby="pengalaman-title" className={CARD}>
              <header className="flex flex-wrap items-center justify-between gap-3">
                <h2 id="pengalaman-title" className={CARD_TITLE}>
                  <span className={CARD_ICON}>
                    <Briefcase className="size-5" aria-hidden="true" />
                  </span>
                  Pengalaman Kerja
                </h2>
                <Button type="button" variant="outline" onClick={() => openDialog("experience", "add")} className={PILL_BUTTON}>
                  <Plus className="size-4" aria-hidden="true" />
                  Tambah Pengalaman
                </Button>
              </header>
              <div className="mt-6">
                {p.experiences.length > 0 ? (
                  <ul className="divide-y divide-line">
                    {p.experiences.map((exp) => (
                      <li key={exp.id} className="py-5 first:pt-0 last:pb-0">
                        <div className="flex items-start justify-between gap-4">
                          <h3 className="text-lg font-semibold text-ink">{exp.role}</h3>
                          <div className="flex shrink-0 items-center gap-4 text-sm font-semibold">
                            <button
                              type="button"
                              aria-label={`Edit ${exp.role}`}
                              onClick={() => openDialog("experience", "edit", exp.id)}
                              className={EDIT_LINK}
                            >
                              <Pencil className="size-4" aria-hidden="true" />
                              Edit
                            </button>
                            <button
                              type="button"
                              aria-label={`Hapus ${exp.role}`}
                              onClick={() => handleDelete(deleteExperience, exp.id, exp.role)}
                              className={DELETE_LINK}
                            >
                              <Trash2 className="size-4" aria-hidden="true" />
                              Hapus
                            </button>
                          </div>
                        </div>
                        <p className="mt-0.5 text-sm text-ink/70">
                          <span className="font-medium text-brand">{exp.company}</span>
                          {exp.period && (
                            <>
                              <span className="mx-2 text-ink/30" aria-hidden="true">
                                •
                              </span>
                              {exp.period}
                            </>
                          )}
                        </p>
                        {exp.description && <p className="mt-2 text-sm text-ink">{exp.description}</p>}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-ink/70">Belum ada pengalaman kerja.</p>
                )}
              </div>
            </section>

            {/* Pendidikan */}
            <section aria-labelledby="pendidikan-title" className={CARD}>
              <header className="flex flex-wrap items-center justify-between gap-3">
                <h2 id="pendidikan-title" className={CARD_TITLE}>
                  <span className={CARD_ICON}>
                    <GraduationCap className="size-5" aria-hidden="true" />
                  </span>
                  Pendidikan
                </h2>
                <Button type="button" variant="outline" onClick={() => openDialog("education", "add")} className={PILL_BUTTON}>
                  <Plus className="size-4" aria-hidden="true" />
                  Tambah Pendidikan
                </Button>
              </header>
              <div className="mt-6">
                {p.education.length > 0 ? (
                  <ul className="divide-y divide-line">
                    {p.education.map((edu) => (
                      <li key={edu.id} className="py-5 first:pt-0 last:pb-0">
                        <div className="flex items-start justify-between gap-4">
                          <h3 className="text-lg font-semibold text-ink">{edu.degree}</h3>
                          <div className="flex shrink-0 items-center gap-4 text-sm font-semibold">
                            <button
                              type="button"
                              aria-label={`Edit ${edu.degree}`}
                              onClick={() => openDialog("education", "edit", edu.id)}
                              className={EDIT_LINK}
                            >
                              <Pencil className="size-4" aria-hidden="true" />
                              Edit
                            </button>
                            <button
                              type="button"
                              aria-label={`Hapus ${edu.degree}`}
                              onClick={() => handleDelete(deleteEducation, edu.id, edu.degree)}
                              className={DELETE_LINK}
                            >
                              <Trash2 className="size-4" aria-hidden="true" />
                              Hapus
                            </button>
                          </div>
                        </div>
                        <p className="mt-0.5 text-sm text-ink/70">
                          <span className="font-medium text-brand">{edu.school}</span>
                          {edu.period && (
                            <>
                              <span className="mx-2 text-ink/30" aria-hidden="true">
                                •
                              </span>
                              {edu.period}
                            </>
                          )}
                        </p>
                        {edu.gpa && <p className="mt-2 text-sm text-ink">{edu.gpa}</p>}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-ink/70">Belum ada riwayat pendidikan.</p>
                )}
              </div>
            </section>

            {/* Sertifikasi & portofolio */}
            <section aria-labelledby="sertifikasi-title" className={CARD}>
              <header className="flex flex-wrap items-center justify-between gap-3">
                <h2 id="sertifikasi-title" className={CARD_TITLE}>
                  <span className={CARD_ICON}>
                    <Award className="size-5" aria-hidden="true" />
                  </span>
                  Sertifikasi &amp; Portofolio
                </h2>
                <Button type="button" variant="outline" onClick={() => openDialog("certification", "add")} className={PILL_BUTTON}>
                  <Plus className="size-4" aria-hidden="true" />
                  Tambah Sertifikasi
                </Button>
              </header>
              <div className="mt-6">
                {p.certifications.length > 0 && (
                  <ul className="divide-y divide-line">
                    {p.certifications.map((cert) => (
                      <li key={cert.id} className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 py-4 first:pt-0">
                        <div className="min-w-0">
                          <h3 className="text-base font-semibold text-ink">{cert.name}</h3>
                          <p className="text-sm text-ink/70">
                            {cert.issuer}
                            {cert.year && ` • ${cert.year}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-4 text-sm font-semibold">
                          <a href="#" className="inline-flex min-h-9 items-center gap-1.5 text-brand underline underline-offset-2">
                            <FileText className="size-4" aria-hidden="true" />
                            Lihat Sertifikat
                          </a>
                          <button
                            type="button"
                            aria-label={`Edit ${cert.name}`}
                            onClick={() => openDialog("certification", "edit", cert.id)}
                            className={EDIT_LINK}
                          >
                            <Pencil className="size-4" aria-hidden="true" />
                            Edit
                          </button>
                          <button
                            type="button"
                            aria-label={`Hapus ${cert.name}`}
                            onClick={() => handleDelete(deleteCertification, cert.id, cert.name)}
                            className={DELETE_LINK}
                          >
                            <Trash2 className="size-4" aria-hidden="true" />
                            Hapus
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}

                <label className="mt-4 flex cursor-pointer flex-col items-center gap-3 rounded-2xl border border-dashed border-brand bg-white px-6 py-8 text-center text-sm text-ink/80 transition-colors focus-within:ring-3 focus-within:ring-brand/30 hover:bg-brand-light/50">
                  <UploadCloud className="size-6 text-brand" aria-hidden="true" />
                  <span>Seret file PDF atau klik untuk mengunggah portofolio</span>
                  <input type="file" accept="application/pdf" className="sr-only" />
                </label>
              </div>
            </section>
          </div>

          <div className="space-y-6">
            {/* Informasi kontak */}
            <section aria-labelledby="kontak-title" className={CARD}>
              <header className="flex flex-wrap items-center justify-between gap-3">
                <h2 id="kontak-title" className={CARD_TITLE}>
                  <span className={CARD_ICON}>
                    <User className="size-5" aria-hidden="true" />
                  </span>
                  Informasi Kontak
                </h2>
                <Button
                  type="button"
                  variant="outline"
                  aria-label="Edit informasi kontak"
                  onClick={() => openDialog("contact", "edit")}
                  className={PILL_BUTTON}
                >
                  <Pencil className="size-4" aria-hidden="true" />
                  Edit
                </Button>
              </header>
              <ul className="mt-6 space-y-4 text-base text-ink">
                <li className="flex items-center gap-3">
                  <Mail className="size-5 shrink-0 text-ink/60" aria-hidden="true" />
                  {p.contact.email}
                </li>
                <li className="flex items-center gap-3">
                  <Phone className="size-5 shrink-0 text-ink/60" aria-hidden="true" />
                  {p.contact.phone}
                </li>
                <li className="flex items-center gap-3">
                  <MapPin className="size-5 shrink-0 text-ink/60" aria-hidden="true" />
                  {p.contact.location}
                </li>
                <li className="flex items-center gap-3">
                  <LinkedinIcon className="size-5 shrink-0 text-ink/60" />
                  {p.contact.linkedin && (
                    <a
                      href={p.contact.linkedin.startsWith("http") ? p.contact.linkedin : `https://${p.contact.linkedin}`}
                      className="font-medium text-brand underline underline-offset-2"
                    >
                      {p.contact.linkedin}
                    </a>
                  )}
                </li>
              </ul>
            </section>

            {/* Keahlian */}
            <section aria-labelledby="keahlian-title" className={CARD}>
              <header className="flex flex-wrap items-center justify-between gap-3">
                <h2 id="keahlian-title" className={CARD_TITLE}>
                  <span className={CARD_ICON}>
                    <Star className="size-5" aria-hidden="true" />
                  </span>
                  Keahlian
                </h2>
                <Button type="button" variant="outline" onClick={() => openDialog("skill", "add")} className={PILL_BUTTON}>
                  <Plus className="size-4" aria-hidden="true" />
                  Tambah Skill
                </Button>
              </header>
              <div className="mt-6">
                {p.skills.length > 0 ? (
                  <ul className="flex flex-wrap gap-2.5">
                    {p.skills.map((skill) => (
                      <li key={skill.id}>
                        <span
                          className={
                            skill.highlight
                              ? "inline-flex min-h-9 items-center gap-2 rounded-full border border-brand bg-brand px-4 text-sm font-medium text-white"
                              : "inline-flex min-h-9 items-center gap-2 rounded-full border border-brand bg-white px-4 text-sm font-medium text-brand"
                          }
                        >
                          {skill.label}
                          <button
                            type="button"
                            aria-label={`Hapus keahlian ${skill.label}`}
                            onClick={() => setDraft((current) => deleteSkill(current, skill.id))}
                            className="grid size-5 place-items-center rounded-full focus-visible:ring-2 focus-visible:ring-current focus-visible:outline-none"
                          >
                            <CircleX className="size-4" aria-hidden="true" />
                          </button>
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-ink/70">Belum ada keahlian. Tambahkan untuk meningkatkan rekomendasi AI.</p>
                )}

                {aiSkills.status === "loading" && (
                  <p className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-ai" role="status">
                    <Sparkles className="size-3.5 motion-safe:animate-pulse" aria-hidden="true" />
                    AI sedang membaca sertifikat “{aiSkills.source}”…
                  </p>
                )}
                {aiSkills.status === "done" && freshAiSkills.length > 0 && (
                  <div className="mt-4">
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-ai">
                        <Sparkles className="size-3.5" aria-hidden="true" />
                        Disarankan AI dari sertifikat “{aiSkills.source}”:
                      </p>
                      <button
                        type="button"
                        onClick={dismissAiSkills}
                        className="text-xs font-semibold text-ink/70 hover:underline focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none"
                      >
                        Tutup
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {freshAiSkills.map((label) => (
                        <button
                          key={label}
                          type="button"
                          onClick={() => addSuggestedSkill(label)}
                          className="inline-flex items-center gap-1 rounded-full border border-ai/40 bg-pink-50 px-3 py-1.5 text-[13px] hover:border-ai"
                        >
                          <Plus className="size-3.5" aria-hidden="true" />
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Bahasa */}
            <section aria-labelledby="bahasa-title" className={CARD}>
              <header className="flex flex-wrap items-center justify-between gap-3">
                <h2 id="bahasa-title" className={CARD_TITLE}>
                  <span className={CARD_ICON}>
                    <Globe className="size-5" aria-hidden="true" />
                  </span>
                  Bahasa
                </h2>
                <Button type="button" variant="outline" onClick={() => openDialog("language", "add")} className={PILL_BUTTON}>
                  <Plus className="size-4" aria-hidden="true" />
                  Tambah Bahasa
                </Button>
              </header>
              <ul className="mt-6 space-y-5">
                {p.languages.map((lang) => (
                  <li key={lang.id}>
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold text-ink">{lang.name}</span>
                      <Badge tone={lang.tone} className="px-2.5 py-0.5">
                        {lang.level}
                      </Badge>
                    </div>
                    <div
                      role="progressbar"
                      aria-label={`Kemahiran ${lang.name}: ${lang.level}`}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={lang.percent}
                      className="mt-2 h-2 overflow-hidden rounded-full bg-line"
                    >
                      <div className="h-full rounded-full bg-brand" style={{ width: `${lang.percent}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            {/* Resume */}
            <section aria-labelledby="resume-title" className={CARD}>
              <header className="flex flex-wrap items-center justify-between gap-3">
                <h2 id="resume-title" className={CARD_TITLE}>
                  <span className={CARD_ICON}>
                    <FileText className="size-5" aria-hidden="true" />
                  </span>
                  Resume
                </h2>
              </header>
              <div className="mt-6">
                {resumes.length > 0 && (
                  <ul className="space-y-4">
                    {resumes.map((resume, index) => (
                      <li key={resume.id} className="rounded-2xl border border-line p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            {index === 0 && (
                              <Badge tone="neutral" className="mb-2">
                                Default
                              </Badge>
                            )}
                            <p className="break-words text-base font-semibold text-ink">{resume.name}</p>
                            <p className="mt-1 text-sm text-ink/70">Ditambahkan {formatAddedAt(resume.createdAt)}</p>
                          </div>
                          <div className="flex shrink-0 items-center gap-1">
                            <button
                              type="button"
                              title="Unduh"
                              aria-label={`Unduh ${resume.name}`}
                              onClick={() => downloadResume(resume)}
                              className="grid size-10 place-items-center rounded-full text-ink hover:bg-brand-light hover:text-brand focus-visible:ring-3 focus-visible:ring-brand/30 focus-visible:outline-none"
                            >
                              <Download className="size-5" aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              title="Hapus"
                              aria-label={`Hapus ${resume.name}`}
                              onClick={() => handleDeleteResume(resume)}
                              className="grid size-10 place-items-center rounded-full text-red-600 hover:bg-red-50 focus-visible:ring-3 focus-visible:ring-red-300 focus-visible:outline-none"
                            >
                              <Trash2 className="size-5" aria-hidden="true" />
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}

                <div className={resumes.length > 0 ? "mt-6 border-t border-line pt-6" : ""}>
                  <p className="text-base text-ink">Buat resume baru dari Profil Laras Karya Anda</p>
                  <Button
                    type="button"
                    onClick={handleCreateResume}
                    disabled={generating}
                    className="mt-4 h-12 rounded-full bg-brand px-6 text-sm font-semibold hover:bg-brand/90"
                  >
                    {generating ? "Membuat resume..." : "Buat resume"}
                  </Button>
                </div>
              </div>
            </section>
          </div>
        </div>

        <section
          aria-label="Simpan perubahan"
          className="mt-6 flex flex-col gap-4 rounded-3xl border border-line bg-white px-6 py-5 sm:flex-row sm:items-center sm:justify-between md:px-8"
        >
          <p className="text-lg font-semibold text-ink">Sudah selesai memperbarui profil?</p>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="h-12 rounded-full border-brand bg-white px-6 text-sm font-semibold text-brand hover:bg-brand-light hover:text-brand"
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={!hasChanges || saving}
              className="h-12 rounded-full bg-brand px-6 text-sm font-semibold hover:bg-brand/90"
            >
              {saving ? "Menyimpan…" : "Simpan Perubahan"}
            </Button>
          </div>
        </section>
      </div>

      {/* Dialog tambah / edit */}
      <dialog
        ref={dialogRef}
        aria-labelledby="dialog-title"
        onClose={() => setDialog(null)}
        onClick={(e) => {
          if (e.target === dialogRef.current) setDialog(null);
        }}
        className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-3xl border border-line bg-white p-0 shadow-xl backdrop:bg-black/40"
      >
        {dialog && (
          <form key={dialog.key} onSubmit={handleDialogSubmit} className="p-6 md:p-8">
            <h2 id="dialog-title" className="text-xl font-semibold text-ink">
              {form.title[dialog.mode]}
            </h2>

            <div className="mt-6 space-y-4">
              {form.fields.map((field) => (
                <div key={field.name}>
                  {field.type === "radio" || field.type === "checkboxes" ? (
                    <p id={`label-${field.name}`} className="mb-2 block text-sm font-semibold text-ink">
                      {field.label}
                    </p>
                  ) : (
                    <label htmlFor={`field-${field.name}`} className="mb-1.5 block text-sm font-semibold text-ink">
                      {field.label}
                    </label>
                  )}
                  {field.type === "textarea" ? (
                    <textarea
                      id={`field-${field.name}`}
                      name={field.name}
                      defaultValue={dialog.values[field.name] ?? ""}
                      required={field.required}
                      placeholder={field.placeholder}
                      maxLength={field.maxLength}
                      rows={field.rows ?? 4}
                      className={`${INPUT} py-3`}
                    />
                  ) : field.type === "skill-select" ? (
                    <SkillSelectField field={field} ownedSkills={draft.skills} />
                  ) : field.type === "radio" ? (
                    <RadioCards field={field} defaultValue={dialog.values[field.name]} />
                  ) : field.type === "checkboxes" ? (
                    <CheckboxChips field={field} defaultValue={dialog.values[field.name]} />
                  ) : field.type === "select" ? (
                    <select
                      id={`field-${field.name}`}
                      name={field.name}
                      defaultValue={dialog.values[field.name] || field.defaultValue || ""}
                      required={field.required}
                      className={`${INPUT} h-11`}
                    >
                      {field.placeholder && (
                        <option value="" disabled>
                          {field.placeholder}
                        </option>
                      )}
                      {field.options.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      id={`field-${field.name}`}
                      name={field.name}
                      type={field.type ?? "text"}
                      inputMode={field.inputMode}
                      defaultValue={dialog.values[field.name] ?? ""}
                      required={field.required}
                      placeholder={field.placeholder}
                      className={`${INPUT} h-11`}
                    />
                  )}
                </div>
              ))}
            </div>

            {dialog.error && (
              <p role="alert" className="mt-4 text-sm font-medium text-red-600">
                {dialog.error}
              </p>
            )}

            <div className="mt-8 flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialog(null)}
                className="h-11 rounded-full border-brand bg-white px-6 text-sm font-semibold text-brand hover:bg-brand-light hover:text-brand"
              >
                Batal
              </Button>
              <Button type="submit" className="h-11 rounded-full bg-brand px-6 text-sm font-semibold hover:bg-brand/90">
                Simpan
              </Button>
            </div>
          </form>
        )}
      </dialog>

      {toast && (
        <p
          role="status"
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white shadow-lg"
        >
          {toast}
        </p>
      )}

      <Footer />
    </main>
  );
}