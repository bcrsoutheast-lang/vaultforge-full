import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function client() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function safeName(name: string) {
  return String(name || "deal-photo.jpg").toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/-+/g, "-").slice(0, 90);
}

export async function POST(request: Request) {
  try {
    const supabase = client();
    if (!supabase) return NextResponse.json({ ok: false, error: "Missing Supabase environment variables." }, { status: 500 });

    const form = await request.formData();
    const file = form.get("file");
    const roomId = String(form.get("roomId") || `deal_${Date.now()}`);
    if (!(file instanceof File)) return NextResponse.json({ ok: false, error: "No image file received." }, { status: 400 });
    if (!file.type.startsWith("image/")) return NextResponse.json({ ok: false, error: "Only image uploads are allowed." }, { status: 400 });

    const bucket = process.env.NEXT_PUBLIC_SUPABASE_DEAL_BUCKET || "vaultforge-deal-photos";
    const ext = file.name.includes(".") ? file.name.split(".").pop() : "jpg";
    const path = `${roomId}/${Date.now()}-${safeName(file.name || `photo.${ext}`)}`;
    const bytes = await file.arrayBuffer();

    const { error } = await supabase.storage.from(bucket).upload(path, bytes, { contentType: file.type, upsert: true });
    if (error) return NextResponse.json({ ok: false, error: error.message, bucket, path }, { status: 500 });

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return NextResponse.json({ ok: true, photoUrl: data.publicUrl, bucket, path, name: file.name, size: file.size, type: file.type });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Upload failed." }, { status: 500 });
  }
}
