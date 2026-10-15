import { randomBytes } from "crypto";
import { mkdir, readdir, stat, writeFile } from "fs/promises";
import { join } from "path";
import { ok, fail, BadRequestError, requireAdminSession, unauthorized } from "@/server/api-helpers";

// Unggah gambar (mis. banner hero) dari halaman /admin.
// Disimpan lokal di `public/uploads/` sehingga bisa dipakai offline,
// tanpa layanan pihak ketiga. Batas 5 MB, hanya jpeg/png/webp/gif.

const MAX_BYTES = 5 * 1024 * 1024;

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

// Sniff magic-byte agar polyglot `fake.png` (tipe dikontrol klien) ditolak.
// Tidak mengandalkan `file.type` saja.
function sniffImageExt(buf: Buffer, claimedMime: string): string | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return claimedMime === "image/jpeg" ? ".jpg" : null;
  }
  if (
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a
  ) {
    return claimedMime === "image/png" ? ".png" : null;
  }
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38) {
    return claimedMime === "image/gif" ? ".gif" : null;
  }
  if (
    buf[0] === 0x52 &&
    buf[1] === 0x49 &&
    buf[2] === 0x46 &&
    buf[3] === 0x46 &&
    buf[8] === 0x57 &&
    buf[9] === 0x45 &&
    buf[10] === 0x42 &&
    buf[11] === 0x50
  ) {
    return claimedMime === "image/webp" ? ".webp" : null;
  }
  return null;
}

export async function POST(req: Request) {
  try {
    if (!(await requireAdminSession(req))) return unauthorized();
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      throw new BadRequestError("Tidak ada file yang diunggah.");
    }
    const claimedExt = MIME_TO_EXT[file.type];
    if (!claimedExt) {
      throw new BadRequestError("Format file harus JPG, PNG, WebP, atau GIF.");
    }
    if (file.size <= 0) {
      throw new BadRequestError("File kosong — pilih gambar yang valid.");
    }
    if (file.size > MAX_BYTES) {
      throw new BadRequestError("Ukuran file maksimal 5 MB.");
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const realExt = sniffImageExt(buffer, file.type);
    if (!realExt) {
      throw new BadRequestError("Isi file bukan gambar valid (terdeteksi tipe palsu).");
    }

    const name = `${Date.now()}-${randomBytes(8).toString("hex")}${realExt}`;
    const dir = join(process.cwd(), "public", "uploads");
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, name), buffer);

    return ok({ url: `/uploads/${name}` }, 201);
  } catch (e) {
    return fail(e);
  }
}

// Daftar foto yang sudah pernah diunggah (terbaru dulu) — dipakai
// pemilih gambar di form admin agar tak perlu mengunggah ulang.
export async function GET() {
  try {
    if (!(await requireAdminSession())) return unauthorized();
    const dir = join(process.cwd(), "public", "uploads");
    await mkdir(dir, { recursive: true });
    const names = await readdir(dir);
    const files: Array<{ url: string; mtime: number }> = [];
    for (const name of names) {
      if (!/\.(jpe?g|png|webp|gif)$/i.test(name)) continue;
      const st = await stat(join(dir, name));
      if (!st.isFile()) continue;
      files.push({ url: `/uploads/${name}`, mtime: st.mtimeMs });
    }
    files.sort((a, b) => b.mtime - a.mtime);
    return ok({ files: files.map((f) => f.url) });
  } catch (e) {
    return fail(e);
  }
}
