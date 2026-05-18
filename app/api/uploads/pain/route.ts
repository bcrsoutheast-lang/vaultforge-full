import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const BUCKET = "vaultforge-pain-photos";
const MAX_FILES = 5;
const MAX_BYTES = 8 * 1024 * 1024;

function json(status: number, payload: Record<string, unknown>) {
  return NextResponse.json(payload, { status });
}

function safeName(name: string) {
  const clean = String(name || "pain-photo")
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 90);
  return clean || "pain-photo.jpg";
}

export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      "";

    if (!supabaseUrl || !supabaseKey) {
      return json(500, {
        ok: false,
        error: "Missing Supabase environment variables for pain photo upload.",
        photos: [],
      });
    }

    const form = await request.formData();
    const files = form.getAll("photos").filter((item): item is File => item instanceof File);

    if (!files.length) return json(400, { ok: false, error: "No photos received.", photos: [] });
    if (files.length > MAX_FILES) return json(400, { ok: false, error: "Upload up to 5 photos only.", photos: [] });

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const uploaded: Array<{ url: string; path: string; name: string }> = [];

    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        return json(400, { ok: false, error: `${file.name} is not an image file.`, photos: uploaded });
      }
      if (file.size > MAX_BYTES) {
        return json(400, { ok: false, error: `${file.name} is too large. Keep each photo under 8MB.`, photos: uploaded });
      }

      const ext = safeName(file.name).split(".").pop() || "jpg";
      const path = `pain/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;
      const bytes = await file.arrayBuffer();

      const { error } = await supabase.storage.from(BUCKET).upload(path, bytes, {
        contentType: file.type || "image/jpeg",
        upsert: false,
      });

      if (error) {
        return json(500, {
          ok: false,
          error: error.message || "Pain photo upload failed.",
          bucket: BUCKET,
          photos: uploaded,
        });
      }

      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      uploaded.push({ url: data.publicUrl, path, name: file.name });
    }

    return json(200, { ok: true, photos: uploaded });
  } catch (error) {
    return json(500, {
      ok: false,
      error: error instanceof Error ? error.message : "Unknown pain photo upload error.",
      photos: [],
    });
  }
}
