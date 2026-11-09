#!/usr/bin/env python3
"""
build_jobs_sql.py
=================
Membuat file SQL INSERT untuk tabel `jobs` di Supabase, disesuaikan dengan
struktur & aturan (check constraint) tabelmu:

  employment_type   : full_time | part_time | contract | internship
  experience_level  : entry | junior | mid | senior
  min_education     : sma | d3 | s1 | s2 | s3
  status            : draft | published | closed
  work_arrangement  : onsite | hybrid | remote
  benefits          : text[]  (array)
  deadline          : date

Kolom created_at, updated_at (default now()) dan verified_at (kosong semua)
sengaja tidak ikut di-INSERT.

Pemakaian:
  python build_jobs_sql.py jobs_final_uuid.csv --out jobs_insert_supabase.sql
"""

import argparse
import csv
import re
import sys

# ---- Pemetaan nilai CSV -> nilai yang diizinkan database ----------------------
EMPLOYMENT_MAP = {
    "full-time": "full_time", "full time": "full_time", "full_time": "full_time",
    "part-time": "part_time", "part time": "part_time", "part_time": "part_time",
    "contract": "contract", "kontrak": "contract",
    "internship": "internship", "magang": "internship",
    "other": "full_time",  # 'Other' dari LinkedIn = tidak dirinci -> default tabel
}
# Standarisasi sebelumnya (fresh graduate / menengah) dikembalikan ke kode database.
# Label tampilan ("Fresh Graduate", "Menengah") sebaiknya dibuat di aplikasi.
EXPERIENCE_MAP = {
    "entry": "entry", "fresh graduate": "entry",
    "junior": "junior",
    "mid": "mid", "menengah": "mid",
    "senior": "senior",
}
WORK_MAP = {"on-site": "onsite", "onsite": "onsite", "hybrid": "hybrid", "remote": "remote"}
# 'Tidak disebutkan' -> NULL (kolom boleh kosong)
STATUS_MAP = {"active": "published", "published": "published", "draft": "draft", "closed": "closed", "expired": "closed"}

ALLOWED = {
    "employment_type": {"full_time", "part_time", "contract", "internship"},
    "experience_level": {"entry", "junior", "mid", "senior"},
    "min_education": {"sma", "d3", "s1", "s2", "s3"},
    "status": {"draft", "published", "closed"},
    "work_arrangement": {"onsite", "hybrid", "remote"},
}

SKIP_COLS = {"created_at", "updated_at", "verified_at"}
NO_INFO = {"", "tidak disebutkan"}


def fix_date(v):
    """dd/mm/yyyy -> yyyy-mm-dd (kolom bertipe date). Kosong -> None."""
    v = (v or "").strip()
    if not v:
        return None
    m = re.fullmatch(r"(\d{1,2})/(\d{1,2})/(\d{4})", v)
    if m:
        d, mo, y = m.groups()
        v = f"{y}-{int(mo):02d}-{int(d):02d}"
    if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", v):
        sys.exit(f"Format tanggal tidak dikenal: {v!r}")
    return v


UUID_RE = re.compile(r"[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}")
TS_RE = re.compile(r"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z")


def q(v):
    return "'" + v.replace("'", "''") + "'"


def lit(v):
    return "NULL" if v is None or v.strip() == "" else q(v)


def to_array(v):
    items = [re.sub(r"^[\s•\-\*]+", "", line).strip() for line in v.splitlines()]
    items = [i for i in items if i]
    if not items or (len(items) == 1 and items[0].lower() in NO_INFO):
        return "'{}'::text[]"
    return "ARRAY[" + ", ".join(q(i) for i in items) + "]::text[]"


def mapped(row, col, mapping, nullable_no_info=False):
    raw = (row[col] or "").strip()
    if raw.lower() in NO_INFO:
        return None
    key = raw.lower()
    if key not in mapping:
        sys.exit(f"Nilai tak dikenal di kolom {col}: {raw!r} (id {row['id']})")
    return mapping[key]


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawTextHelpFormatter)
    ap.add_argument("input_csv")
    ap.add_argument("--out", default="jobs_insert_supabase.sql")
    ap.add_argument("--sectors", help="sectors.csv (code,label,sort_order); wajib kalau --sector-value code")
    ap.add_argument(
        "--sector-value",
        choices=["code", "label"],
        default="code",
        help="isi kolom jobs.sector: 'code' (default, mis. oil_gas) atau 'label' (mis. Minyak & Gas)",
    )
    args = ap.parse_args()

    with open(args.input_csv, newline="", encoding="utf-8-sig") as f:
        rows = list(csv.DictReader(f))
    cols = [c for c in rows[0].keys() if c not in SKIP_COLS]

    # Kolom jobs.sector punya foreign key ke tabel sectors
    label_to_code = {}
    if args.sector_value == "code":
        if not args.sectors:
            sys.exit("Tambahkan --sectors data/sectors.csv (atau pakai --sector-value label).")
        with open(args.sectors, newline="", encoding="utf-8-sig") as f:
            label_to_code = {s["label"].strip(): s["code"].strip() for s in csv.DictReader(f)}

    prepared = []
    for r in rows:
        r = dict(r)
        emp = mapped(r, "employment_type", EMPLOYMENT_MAP)
        r["employment_type"] = emp or "full_time"          # kolom NOT NULL, default full_time
        r["experience_level"] = mapped(r, "experience_level", EXPERIENCE_MAP)
        r["work_arrangement"] = mapped(r, "work_arrangement", WORK_MAP)
        r["status"] = mapped(r, "status", STATUS_MAP) or "draft"
        r["min_education"] = (r["min_education"] or "").strip().lower() or None
        r["deadline"] = fix_date(r["deadline"])
        if args.sector_value == "code" and r["sector"].strip():
            label = r["sector"].strip()
            if label not in label_to_code:
                sys.exit(f"Sektor {label!r} (id {r['id']}) tidak ada di {args.sectors}")
            r["sector"] = label_to_code[label]
        prepared.append(r)

    # Pengecekan terhadap aturan database sebelum file ditulis
    for r in prepared:
        for col, ok in ALLOWED.items():
            v = r[col]
            if v is not None and v not in ok:
                sys.exit(f"Nilai {v!r} di {col} (id {r['id']}) tidak diizinkan: {sorted(ok)}")

    # Pengecekan format kolom bertipe khusus (uuid, integer, boolean, date, timestamptz)
    for r in prepared:
        bad = []
        if not UUID_RE.fullmatch(r["id"]):
            bad.append("id")
        for c in ("salary_min", "salary_max"):
            if r[c].strip() and not r[c].strip().isdigit():
                bad.append(c)
        if r["is_green_job"].strip().upper() not in ("TRUE", "FALSE"):
            bad.append("is_green_job")
        if r["published_at"].strip() and not TS_RE.fullmatch(r["published_at"].strip()):
            bad.append("published_at")
        if r["deadline"] and not re.fullmatch(r"\d{4}-\d{2}-\d{2}", r["deadline"]):
            bad.append("deadline")
        for c in ("title", "company_name"):
            if not r[c].strip():
                bad.append(c + " (NOT NULL)")
        if bad:
            sys.exit(f"Format tidak valid pada id {r['id']}: {bad}")

    def cell(r, c):
        if c == "benefits":
            return to_array(r["benefits"])
        return lit(r[c])

    parts = ["BEGIN;\n"]
    for i in range(0, len(prepared), 25):
        chunk = prepared[i:i + 25]
        vals = ",\n".join("(" + ", ".join(cell(r, c) for c in cols) + ")" for r in chunk)
        parts.append(f"INSERT INTO public.jobs ({', '.join(cols)}) VALUES\n{vals}\nON CONFLICT DO NOTHING;\n")
    parts.append("COMMIT;\n")
    sql = "\n".join(parts)
    with open(args.out, "w", encoding="utf-8") as f:
        f.write(sql)

    from collections import Counter
    print(f"{len(prepared)} baris -> {args.out}")
    for col in ALLOWED:
        print(f"  {col:<17}", dict(Counter(r[col] for r in prepared)))


if __name__ == "__main__":
    main()
