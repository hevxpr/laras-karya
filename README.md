# Laras Karya

Platform karier untuk membantu perempuan menemukan pekerjaan di sektor hijau (green jobs). Pengguna mendapat rekomendasi lowongan beserta alasan kecocokannya, mengetahui skill yang masih kurang dan jalur belajar untuk menutupnya, lalu melamar dan memantau status lamaran di satu tempat.

- **Situs:** https://laras-karya.vercel.app
- **Kelompok:** Ratu Zaleha, Bootcamp Perempuan Inovasi 2026 (Final Project AI Full Stack Web Development)
- **Tantangan:** Lapangan Pekerjaan dan Green Jobs

## Daftar isi

1. [Masalah dan solusi](#masalah-dan-solusi)
2. [Fitur](#fitur)
3. [Fitur AI](#fitur-ai)
4. [Teknologi](#teknologi)
5. [Menjalankan di komputer sendiri](#menjalankan-di-komputer-sendiri)
6. [Database dan keamanan](#database-dan-keamanan)
7. [API](#api)
8. [Data dan keterbatasan](#data-dan-keterbatasan)
9. [Alur Git](#alur-git)

## Masalah dan solusi

Perempuan yang ingin berpindah karier, kembali bekerja, atau memulai dari nol di bidang hijau sulit tahu pekerjaan mana yang cocok, skill apa yang kurang, dan harus belajar apa. Informasi lowongan, pelatihan, dan proses melamar tersebar di banyak tempat.

Laras Karya menyatukannya dalam satu alur: **Temukan, Siapkan, Melangkah**. Pengguna mengisi asesmen singkat, menerima rekomendasi lowongan dengan alasan yang bisa dibaca, melihat skill yang kurang beserta rencana belajarnya, menyiapkan lamaran, lalu memantau statusnya.

## Fitur

**Untuk pencari kerja**

- Pendaftaran dan masuk dengan verifikasi email (Supabase Auth).
- Asesmen empat langkah: situasi karier, sektor minat, pola kerja, keahlian, dan tingkat pengalaman.
- Rekomendasi lowongan dengan skor kecocokan, urutan menurut kecocokan, dan filter (termasuk fasilitas ramah perempuan).
- Detail lowongan dengan alasan kecocokan, skill yang kurang, dan rencana belajar.
- Jalur belajar: pelatihan yang terkait dengan skill yang kurang; bila belum ada, tersedia tautan pencarian di luar platform.
- Simpan lowongan.
- Persiapan lamaran: profil, CV yang dibuat dari profil (atau unggahan sendiri), sertifikat, portofolio, dan draf surat lamaran otomatis.
- Pelacak lamaran dengan riwayat perubahan status.
- Profil lengkap: pengalaman kerja, pendidikan, keahlian, bahasa, dan dokumen.

**Untuk admin**

- Panel admin: kelola lowongan (tambah, ubah, hapus), lihat lamaran, dan lihat pengguna.

## Fitur AI

Fitur AI memakai Google Gemini (model bawaan `gemini-3.5-flash-lite`, dapat diganti lewat `GEMINI_MODEL`). Kunci API hanya dipakai di server dan tidak pernah dikirim ke browser.

| Fitur | Cara kerja | Pengaman |
|---|---|---|
| **Saran keahlian di asesmen** | Gemini membaca cerita pengalaman pengguna dan memilih keahlian dari katalog yang sudah ada. | Hasil disaring ke kode keahlian di katalog; isi cerita diperlakukan sebagai data, bukan perintah. Pengguna memilih sendiri saran yang dipakai. |
| **Penjelasan "Mengapa lowongan ini cocok untuk Anda"** | Fakta (keahlian, sektor, pengalaman, pola kerja, pendidikan, lokasi) dihitung oleh kode dan database; Gemini hanya menyusun kalimat dari fakta itu. | Jawaban divalidasi sebelum ditampilkan (misalnya angka harus ditulis sebagai angka); bila tidak lolos, teks AI tidak ditampilkan. Data yang dikirim ke Gemini tidak memuat nama, telepon, email, atau deskripsi lowongan. Hasil disimpan sebagai cache dan ada kuota harian per pengguna (`AI_EXPLAIN_DAILY_LIMIT`, bawaan 30). |

**Rekomendasi lowongan tidak memakai AI generatif.** Skor kecocokan dihitung oleh fungsi SQL dengan skor berbobot dari kecocokan profil pengguna dengan lowongan (antara lain keahlian dan sektor). Dengan begitu skor dapat dijelaskan dan diperiksa ulang.

Untuk mencoba fitur AI secara lokal, buat kunci API di [Google AI Studio](https://aistudio.google.com/) dan isi `GEMINI_API_KEY`. Tanpa kunci ini, penjelasan AI tidak tampil dan saran keahlian dari AI tidak tersedia; pengguna tetap dapat memilih keahlian secara manual dari daftar.

## Teknologi

- **Framework:** Next.js 16 (App Router, Server Actions, Route Handlers) dan React 19
- **Tampilan:** Tailwind CSS 4, shadcn/ui (dengan `@base-ui/react`), lucide-react, font Plus Jakarta Sans dan Inter (`@fontsource`)
- **Backend dan database:** Supabase (PostgreSQL, Auth, Storage, RLS) lewat `@supabase/ssr` dan `@supabase/supabase-js`
- **AI:** Google Gemini API
- **Lain-lain:** jsPDF (membuat PDF), PWA

## Menjalankan di komputer sendiri

**Prasyarat:** Node.js 20.9 atau lebih baru, npm, dan sebuah proyek Supabase.

```bash
git clone https://github.com/hevxpr/laras-karya.git
cd laras-karya
npm install
cp .env.example .env.local   # lalu isi nilainya (lihat tabel di bawah)
npm run dev
```

Buka http://localhost:3000.

**Variabel lingkungan** (jangan pernah di-commit; `.env.local` sudah diabaikan Git):

| Variabel | Fungsi |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL proyek Supabase |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Kunci publik (anon/publishable) Supabase. `NEXT_PUBLIC_SUPABASE_ANON_KEY` juga dikenali. |
| `GEMINI_API_KEY` | Kunci Google Gemini (opsional; tanpanya fitur AI tidak aktif) |
| `GEMINI_MODEL` | Model Gemini (opsional, bawaan `gemini-3.5-flash-lite`) |
| `AI_EXPLAIN_DAILY_LIMIT` | Batas penjelasan AI per pengguna per hari (opsional, bawaan 30) |
| `NEXT_PUBLIC_SITE_URL` | Alamat situs untuk tautan verifikasi email (opsional di lokal) |

Skrip lain: `npm run build` (build produksi), `npm run start` (menjalankan hasil build), `npm run lint`.

**Catatan:** untuk menjalankan semua fitur, proyek Supabase harus memiliki skema Laras Karya (tabel, fungsi, kebijakan RLS, dan bucket penyimpanan, lihat bagian berikut). Skema dan data lowongan hasil scraping tidak disertakan di repositori ini, jadi hubungi tim untuk mendapatkannya.

## Database dan keamanan

- **PostgreSQL di Supabase.** Tabel utama: `profiles`, `assessments`, `sectors`, `skills`, `user_skills`, `work_experiences`, `educations`, `jobs`, `job_skills`, `job_recommendations`, `saved_jobs`, `applications` (dengan riwayat status), `documents`, `courses`, `course_skills`, `user_course_progress`, `ai_job_explanations`, dan `ai_usage_daily`.
- **Row Level Security (RLS) aktif** pada tabel-tabel tersebut: data pribadi pengguna hanya dapat diakses pemiliknya; peran admin dibaca dari `profiles.role` di server, bukan dari data browser.
- **Fungsi database (RPC):** `refresh_my_recommendations` (menghitung ulang rekomendasi), `guest_jobs_preview` (pratinjau untuk tamu), dan `consume_ai_quota` (kuota AI).
- **Penyimpanan dokumen:** bucket privat `Documents` untuk CV, sertifikat, dan portofolio (PDF, maksimal 2 MB per berkas).
- Satu lamaran per pengguna per lowongan (`UNIQUE (user_id, job_id)`), dan perubahan status lamaran otomatis tercatat lewat trigger.

## API

Semua rute di bawah `app/api/` membutuhkan sesi masuk (Supabase Auth). Rute `/api/admin/*` hanya untuk peran admin (401 bila belum masuk, 403 bila bukan admin). Respons berbentuk `{ ok: true, ... }` atau `{ ok: false, error }`.

| Rute | Metode | Fungsi |
|---|---|---|
| `/api/profile` | GET, PUT | Baca dan ubah profil |
| `/api/profile/experiences`, `/api/profile/experiences/[id]` | GET, POST / PUT, DELETE | Pengalaman kerja |
| `/api/profile/education`, `/api/profile/education/[id]` | GET, POST / PUT, DELETE | Pendidikan |
| `/api/profile/languages`, `/api/profile/languages/[id]` | GET, POST / PUT, DELETE | Bahasa |
| `/api/profile/skills`, `/api/profile/skills/[id]` | GET, POST / DELETE | Keahlian |
| `/api/profile/sectors` | GET, PUT | Sektor minat |
| `/api/assessment` | GET, POST | Hasil asesmen |
| `/api/recommended-jobs` | GET | Rekomendasi lowongan |
| `/api/bookmarks` | GET, POST | Lowongan tersimpan |
| `/api/applications` | GET, POST | Lamaran |
| `/api/learning-path` | GET, POST | Jalur belajar |
| `/api/admin/jobs`, `/api/admin/jobs/[id]` | GET, POST / GET, PUT, PATCH, DELETE | Kelola lowongan (admin) |
| `/api/admin/jobs/options` | GET | Pilihan isian lowongan (admin) |

## Data dan keterbatasan

Dicatat apa adanya agar penilaian tidak menyesatkan:

- **Data lowongan** berasal dari hasil scraping portal lowongan, sekitar seratus lowongan. Sebagian kecil saja yang bertanda green job, dan fasilitas ramah perempuan jarang tercantum, sehingga beberapa filter terlihat kosong.
- **Bias data.** Portal lowongan formal cenderung memuat posisi yang mensyaratkan pendidikan tinggi. Lowongan yang menerima lulusan SMA/SMK sedikit, sehingga pengguna dengan latar itu mendapat skor kecocokan yang lebih rendah. Ini temuan dari data, bukan dari aturan skor.
- **Katalog pelatihan terbatas.** Tidak semua skill yang kurang memiliki pelatihan di platform; untuk itu disediakan tautan pencarian di luar.
- **Mode demo (`/demo`)** memakai data contoh dan tidak mencerminkan data asli pengguna.
- Fitur AI bergantung pada layanan Gemini; bila layanan tidak tersedia atau kuota harian habis, penjelasan AI tidak ditampilkan.

## Alur Git

- `master`: versi produksi.
- `development`: cabang pengembangan bersama.
- Setiap tugas dikerjakan di cabang sendiri yang diturunkan dari `development`, lalu digabungkan lewat Pull Request. Hindari mengubah `development` dan `master` langsung.
- Berkas `.env`, dataset, dan berkas besar tidak di-commit.

<!-- Tambahkan di sini bila sudah siap: tautan ERD, dokumentasi database, dokumentasi evaluasi AI, deck, dan video demo. -->
