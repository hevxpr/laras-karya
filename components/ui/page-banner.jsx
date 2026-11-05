// Banner judul halaman: foto di belakang gradien hijau.
// Tanpa foto pun tetap tampil (hijau polos). Foto bersifat dekoratif.
// imagePosition: titik fokus foto (nilai background-position), mis. "center 15%" agar kepala tidak terpotong.
export function PageBanner({ image, imagePosition = "center", badge, title, children }) {
  return (
    <section className="relative overflow-hidden rounded-2xl bg-brand">
      {image && (
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-cover"
          style={{ backgroundImage: `url('${image}')`, backgroundPosition: imagePosition }}
        />
      )}
      {/* Di HP teks memenuhi lebar banner, jadi gradien dibuat lebih pekat agar tetap terbaca */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-r from-brand/95 via-brand/85 to-brand/60 md:via-brand/80 md:to-brand/10"
      />
      <div className="relative max-w-2xl px-6 py-8 md:px-10 md:py-10">
        {badge}
        <h1 className="mt-3 text-3xl font-bold leading-tight text-white md:text-4xl">
          {title}
        </h1>
        {children && <p className="mt-3 text-white/90">{children}</p>}
      </div>
    </section>
  );
}
