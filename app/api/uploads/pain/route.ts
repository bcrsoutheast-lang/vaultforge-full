import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    "";

  if (!url || !key) {
    throw new Error("Missing Supabase environment variables for pain photo upload.");
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function safeName(name: string) {
  const clean = String(name || "pain-photo")
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 90);
  return clean || "pain-photo.jpg";
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, error: "No image file received." }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ ok: false, error: "Only image files are allowed." }, { status: 400 });
    }

    const maxBytes = 7 * 1024 * 1024;
    if (file.size > maxBytes) {
      return NextResponse.json({ ok: false, error: "Image is too large. Use a smaller photo under 7MB." }, { status: 413 });
    }

    const supabase = getSupabase();
    const bucket = "vaultforge-pain-photos";
    const ext = safeName(file.name).split(".").pop() || "jpg";
    const path = `pain/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;
    const bytes = await file.arrayBuffer();

    const { error } = await supabase.storage.from(bucket).upload(path, bytes, {
      contentType: file.type || "image/jpeg",
      upsert: false,
    });

    if (error) {
      return NextResponse.json(
        {
          ok: false,
          error: error.message || "Supabase Storage upload failed.",
          bucket,
          note: "Confirm bucket vaultforge-pain-photos exists and upload policy allows this key.",
        },
        { status: 500 }
      );
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    const publicUrl = data?.publicUrl || "";

    return NextResponse.json({ ok: true, photoUrl: publicUrl, path, bucket });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown upload error.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
