import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const BUCKET = "vaultforge-deal-photos";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    "";

  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function safeName(name: string) {
  const clean = String(name || "deal-photo")
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
  return clean || "deal-photo.jpg";
}

export async function POST(request: Request) {
  try {
    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ ok: false, error: "Missing Supabase environment variables." }, { status: 500 });
    }

    const form = await request.formData();
    const file = form.get("file");
    const roomId = String(form.get("roomId") || `deal_${Date.now()}`);

    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, error: "No image file received." }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ ok: false, error: "Only image files are allowed." }, { status: 400 });
    }

    if (file.size > 12 * 1024 * 1024) {
      return NextResponse.json({ ok: false, error: "Image is larger than 12MB. Choose a smaller photo." }, { status: 400 });
    }

    const ext = file.type.includes("png") ? "png" : file.type.includes("webp") ? "webp" : "jpg";
    const path = `deals/${roomId}/${Date.now()}-${safeName(file.name || `photo.${ext}`)}`;
    const arrayBuffer = await file.arrayBuffer();

    const { error } = await supabase.storage.from(BUCKET).upload(path, arrayBuffer, {
      contentType: file.type || `image/${ext}`,
      upsert: true,
    });

    if (error) {
      return NextResponse.json({ ok: false, error: error.message, bucket: BUCKET, path }, { status: 500 });
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    const publicUrl = data?.publicUrl || "";

    if (!publicUrl) {
      return NextResponse.json({ ok: false, error: "Upload succeeded but no public URL was returned.", bucket: BUCKET, path }, { status: 500 });
    }

    return NextResponse.json({ ok: true, photoUrl: publicUrl, publicUrl, path, bucket: BUCKET });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unknown upload error." }, { status: 500 });
  }
}
