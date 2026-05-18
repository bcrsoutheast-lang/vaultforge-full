import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function supabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";
  if (!url || !key) throw new Error("Missing Supabase environment variables.");
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

function safeName(name: string) {
  return String(name || "pain-photo").toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/-+/g, "-").slice(0, 90);
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const files = form.getAll("files").filter((item): item is File => item instanceof File);
    const single = form.get("file");
    if (single instanceof File) files.push(single);

    if (!files.length) return NextResponse.json({ ok: false, error: "No files received." }, { status: 400 });

    const db = supabase();
    const bucket = "vaultforge-pain-photos";
    const uploaded: string[] = [];
    const errors: string[] = [];

    for (const file of files.slice(0, 5)) {
      if (!file.type.startsWith("image/")) {
        errors.push(`${file.name} is not an image.`);
        continue;
      }
      const ext = safeName(file.name).split(".").pop() || "jpg";
      const path = `pain/${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`;
      const bytes = await file.arrayBuffer();
      const { error } = await db.storage.from(bucket).upload(path, bytes, { contentType: file.type || "image/jpeg", upsert: false });
      if (error) {
        errors.push(error.message);
        continue;
      }
      const { data } = db.storage.from(bucket).getPublicUrl(path);
      if (data?.publicUrl) uploaded.push(data.publicUrl);
    }

    return NextResponse.json({ ok: uploaded.length > 0, urls: uploaded, photoUrls: uploaded, errors });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
