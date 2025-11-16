import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { promises as fs } from "node:fs";

const UPLOAD_ROOT = process.env.SHARED_UPLOAD_DIR
  ? path.resolve(process.cwd(), process.env.SHARED_UPLOAD_DIR)
  : path.join(process.cwd(), "shared_uploads");

const sanitizeFileName = (name: string): string => {
  if (!name) return "upload";
  return name.replace(/[^a-zA-Z0-9.\-_]/g, "_").slice(-180);
};

const detectCategory = (mimeType: string | undefined, name: string): "document" | "audio" | "unknown" => {
  const safeMime = mimeType ?? "";
  const lowerMime = safeMime.toLowerCase();
  const lowerName = (name || "").toLowerCase();
  if (lowerMime.startsWith("audio/") || /\.(wav|mp3|m4a|aac|flac|ogg)$/.test(lowerName)) {
    return "audio";
  }
  if (
    lowerMime.startsWith("text/") ||
    lowerMime === "application/pdf" ||
    /\.(txt|md|markdown|rtf|pdf|docx?)$/.test(lowerName)
  ) {
    return "document";
  }
  return "unknown";
};

const ensureUploadDir = async () => {
  await fs.mkdir(UPLOAD_ROOT, { recursive: true });
};

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }
    const arrayBuffer = await file.arrayBuffer();
    const id = randomUUID();
    const sanitized = sanitizeFileName(file.name);
    await ensureUploadDir();
    const storedName = `${id}-${sanitized || "upload"}`;
    const absolutePath = path.join(UPLOAD_ROOT, storedName);
    await fs.writeFile(absolutePath, Buffer.from(arrayBuffer));
    const relativePath = path.relative(process.cwd(), absolutePath);
    const metadata = {
      id,
      originalName: file.name || storedName,
      mimeType: file.type || "application/octet-stream",
      size: file.size,
      storagePath: relativePath,
      uploadedAt: new Date().toISOString(),
      category: detectCategory(file.type, storedName),
    };
    return NextResponse.json({ ok: true, file: metadata });
  } catch (error) {
    console.error("[upload] Failed to save file", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const storagePath = body?.storagePath;
    if (!storagePath || typeof storagePath !== "string") {
      return NextResponse.json({ error: "storagePath is required" }, { status: 400 });
    }
    const resolved = path.resolve(process.cwd(), storagePath);
    if (!resolved.startsWith(UPLOAD_ROOT)) {
      return NextResponse.json({ error: "Invalid storage path" }, { status: 400 });
    }
    await fs.rm(resolved, { force: true });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[upload] Failed to delete file", error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
