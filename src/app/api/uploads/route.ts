import { randomBytes } from "crypto";
import { mkdir, readdir, stat, writeFile } from "fs/promises";
import { join } from "path";
import { ok, fail, BadRequestError } from "@/server/api-helpers";

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

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      throw new BadRequestError("Tidak ada file yang diunggah.");
    }
    const ext = MIME_TO_EXT[file.type];
    if (!ext) {
      throw new BadRequestError("Format file harus JPG, PNG, WebP, atau GIF.");
    }
    if (file.size <= 0) {
      throw new BadRequestError("File kosong — pilih gambar yang valid.");
    }
    if (file.size > MAX_BYTES) {
      throw new BadRequestError("Ukuran file maksimal 5 MB.");
    }

    const name = `${Date.now()}-${randomBytes(8).toString("hex")}${ext}`;
    const dir = join(process.cwd(), "public", "uploads");
    await mkdir(dir, { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
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
