-- Dokumen profil (sertifikat & portofolio).
-- Jalankan di Supabase -> SQL Editor. Aman diulang (idempotent).
--
-- Sebelum menjalankan: buat bucket Storage bernama "Documents" (Private). Di pengaturan bucket isi
-- "Restrict file upload size" = 2 MB dan "Allowed MIME types" = application/pdf.
-- ID bucket membedakan huruf besar/kecil: nama di bawah harus sama dengan BUCKET di lib/documents.js.

-- 1. Tabel metadata ---------------------------------------------------------------------------------
create table if not exists public.documents (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind       text not null check (kind in ('certificate', 'portfolio')),
  title      text not null check (char_length(title) between 1 and 200),
  issuer     text check (issuer is null or char_length(issuer) <= 120),
  year       smallint check (year is null or year between 1950 and 2100),
  file_path  text not null unique,
  file_name  text not null,
  file_size  integer not null check (file_size > 0 and file_size <= 2097152),  -- maks. 2 MB
  created_at timestamptz not null default now(),
  -- file harus berada di folder milik user sendiri: {user_id}/xxxx.pdf
  constraint documents_path_in_own_folder check (file_path like user_id::text || '/%')
);

create index if not exists documents_user_created_idx on public.documents (user_id, created_at desc);

alter table public.documents enable row level security;

drop policy if exists "documents: baca milik sendiri" on public.documents;
create policy "documents: baca milik sendiri"
  on public.documents for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "documents: tambah milik sendiri" on public.documents;
create policy "documents: tambah milik sendiri"
  on public.documents for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "documents: hapus milik sendiri" on public.documents;
create policy "documents: hapus milik sendiri"
  on public.documents for delete to authenticated
  using (user_id = auth.uid());

-- 2. Policy Storage: hanya folder milik sendiri ------------------------------------------------------
drop policy if exists "documents: baca file sendiri" on storage.objects;
create policy "documents: baca file sendiri"
  on storage.objects for select to authenticated
  using (bucket_id = 'Documents' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "documents: unggah ke folder sendiri" on storage.objects;
create policy "documents: unggah ke folder sendiri"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'Documents' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "documents: hapus file sendiri" on storage.objects;
create policy "documents: hapus file sendiri"
  on storage.objects for delete to authenticated
  using (bucket_id = 'Documents' and (storage.foldername(name))[1] = auth.uid()::text);
