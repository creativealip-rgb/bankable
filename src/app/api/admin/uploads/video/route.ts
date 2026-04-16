import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
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
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

