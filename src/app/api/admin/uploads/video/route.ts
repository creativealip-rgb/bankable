import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import crypto from "crypto";
import { enforceRateLimit } from "@/lib/rate-limit";
import { logError } from "@/lib/logger";

const MAX_UPLOAD_SIZE = 500 * 1024 * 1024; // 500MB

export async function POST(request: NextRequest) {
  const limited = enforceRateLimit(request, { namespace: "admin:upload-video", limit: 10, windowMs: 60_000 });
  if (limited) return limited;

  try {
    await requireAdmin();
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }
    if (file.size <= 0 || file.size > MAX_UPLOAD_SIZE) {
      return NextResponse.json({ error: "Invalid file size. Max 500MB." }, { status: 400 });
    }
    if (!file.type.startsWith("video/")) {
      return NextResponse.json({ error: "Only video uploads are allowed" }, { status: 400 });
    }

    const ext = file.name.includes(".") ? file.name.slice(file.name.lastIndexOf(".")) : ".mp4";
    const safeName = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}${ext}`;
    const uploadDir = join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    const bytes = await file.arrayBuffer();
    await writeFile(join(uploadDir, safeName), Buffer.from(bytes));

    return NextResponse.json({ url: `/uploads/${safeName}`, name: file.name, size: file.size });
  } catch (error) {
    if (error instanceof Response) throw error;
    logError("admin.upload_video.failed", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

