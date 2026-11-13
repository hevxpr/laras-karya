import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";

/*
  Dokumen profil (sertifikat & portofolio): file PDF di Supabase Storage, metadata di tabel `documents`.
  Dipakai dari komponen client. Keamanan ada di database: RLS tabel `documents` dan policy storage.objects
  (lihat docs/supabase/documents.sql). Pengecekan di sini hanya untuk pesan kesalahan yang ramah.

  Fungsi menerima `client` opsional (default: klien browser) supaya mudah diuji.
  Hasil selalu { ok: true, ... } atau { ok: false, error: "pesan untuk user" }, tidak melempar error.
*/

/** ID bucket di Supabase Storage. Harus sama persis (huruf besar/kecil dibedakan). */
export const BUCKET = "Documents";
export const MAX_FILE_BYTES = 2 * 1024 * 1024;
const SIGNED_URL_SECONDS = 600;
const COLUMNS = "id, type, title, issuer, year, file_path, file_name, file_size, created_at";

export function formatSize(bytes) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toLocaleString("id-ID", { maximumFractionDigits: 1 })} MB`;
}

/** Pesan kesalahan untuk file yang dipilih, atau "" jika file boleh dipakai. */
export function validatePdf(file) {
  if (!file) return "Pilih file PDF terlebih dahulu.";
  const isPdf = file.type ? file.type === "application/pdf" : /\.pdf$/i.test(file.name);
  if (!isPdf) return "Hanya file PDF yang diperbolehkan.";
  if (file.size > MAX_FILE_BYTES) return `Ukuran file ${formatSize(file.size)} melebihi batas 2 MB.`;
  return "";
}

const toDoc = (row) => ({
  id: row.id,
  kind: row.type,
  title: row.title,
  issuer: row.issuer ?? "",
  year: row.year ? String(row.year) : "",
  filePath: row.file_path,
  fileName: row.file_name,
  fileSize: row.file_size,
  createdAt: row.created_at,
});

function storageMessage(error) {
  const text = String(error?.message ?? "").toLowerCase();
  if (text.includes("maximum allowed size") || text.includes("too large")) return "Ukuran file melebihi batas 2 MB.";
  if (text.includes("mime")) return "Hanya file PDF yang diperbolehkan.";
  if (text.includes("row-level security") || text.includes("not authorized") || text.includes("unauthorized")) {
    return "Tidak punya izin mengunggah. Masuk ulang ke akun Anda, lalu coba lagi.";
  }
  return "Gagal mengunggah file. Coba lagi.";
}

/** Dokumen milik user yang sedang masuk, terbaru dulu. Tanpa Supabase / belum masuk -> daftar kosong. */
export async function listDocuments(client) {
  if (!isSupabaseConfigured) return { ok: true, docs: [] };
  try {
    const supabase = client ?? createClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) return { ok: true, docs: [] };

    const { data, error } = await supabase.from("documents").select(COLUMNS).order("created_at", { ascending: false });
    if (error) throw error;
    return { ok: true, docs: (data ?? []).map(toDoc) };
  } catch (error) {
    console.error("[listDocuments]", error?.message ?? error);
    return { ok: false, error: "Dokumen tidak dapat dimuat." };
  }
}

/**
 * Unggah file ke Storage ({user_id}/{uuid}.pdf), lalu simpan barisnya di `documents`.
 * Jika penyimpanan baris gagal, file yang sudah terunggah dihapus lagi supaya tidak jadi file yatim.
 */
export async function uploadDocument({ kind, file, title, issuer, year }, client) {
  const problem = validatePdf(file);
  if (problem) return { ok: false, error: problem };
  if (!isSupabaseConfigured) return { ok: false, error: "Penyimpanan dokumen belum dikonfigurasi." };

  try {
    const supabase = client ?? createClient();
    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;
    if (!user) return { ok: false, error: "Masuk ke akun Anda untuk mengunggah dokumen." };

    const path = `${user.id}/${crypto.randomUUID()}.pdf`;
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { contentType: "application/pdf", upsert: false });
    if (uploadError) {
      console.error("[uploadDocument:storage]", uploadError.message ?? uploadError);
      return { ok: false, error: storageMessage(uploadError) };
    }

    const { data, error: insertError } = await supabase
      .from("documents")
      .insert({
      profile_id: user.id,
      type: kind,
      title,
      issuer: issuer || null,
      year: year ? Number(year) : null,
      file_path: path,
      file_name: file.name,
      file_size: file.size,
    })
      .select(COLUMNS)
      .single();
    if (insertError) {
      console.error("[uploadDocument:insert]", insertError.message ?? insertError);
      await supabase.storage.from(BUCKET).remove([path]);
      return { ok: false, error: "Gagal menyimpan dokumen. Coba lagi." };
    }
    return { ok: true, doc: toDoc(data) };
  } catch (error) {
    console.error("[uploadDocument]", error?.message ?? error);
    return { ok: false, error: "Gagal mengunggah dokumen. Periksa koneksi Anda, lalu coba lagi." };
  }
}

/**
 * Hapus dokumen: baris dulu, lalu file. Kalau penghapusan file gagal, yang tersisa hanya file yatim
 * (user tidak melihatnya lagi); kebalikannya akan menyisakan baris yang menunjuk file hilang.
 */
export async function deleteDocument(doc, client) {
  try {
    const supabase = client ?? createClient();
    const { error } = await supabase.from("documents").delete().eq("id", doc.id);
    if (error) throw error;

    const { error: removeError } = await supabase.storage.from(BUCKET).remove([doc.filePath]);
    if (removeError) console.error("[deleteDocument:storage]", removeError.message ?? removeError);
    return { ok: true };
  } catch (error) {
    console.error("[deleteDocument]", error?.message ?? error);
    return { ok: false, error: "Gagal menghapus dokumen. Coba lagi." };
  }
}

/** Tautan sementara (10 menit) untuk membuka file di bucket privat. */
export async function createDocumentUrl(filePath, client) {
  try {
    const supabase = client ?? createClient();
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(filePath, SIGNED_URL_SECONDS);
    if (error || !data?.signedUrl) throw error ?? new Error("Tautan kosong");
    return { ok: true, url: data.signedUrl };
  } catch (error) {
    console.error("[createDocumentUrl]", error?.message ?? error);
    return { ok: false, error: "File tidak dapat dibuka. Coba lagi." };
  }
}
