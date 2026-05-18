import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  "";

const BUCKET = "vaultforge-pain-photos";

function cleanName(name: string) {
  return String(name || "pain-photo")
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 90);
}

function extensionFromType(type: string, fallbackName: string) {
  const lower = String(type || "").toLowerCase();
  if (lower.includes("png")) return "png";
  if (lower.includes("webp")) return "webp";
  if (lower.includes("gif")) return "gif";
  const match = fallbackName.match(/\.([a-zA-Z0-9]+)$/);
  return match?.[1]?.toLowerCase() || "jpg";
}

export async function POST(request: NextRequest) {
  try {
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      return NextResponse.json(
        { ok: false, error: "Missing Supabase upload environment variables." },
        { status: 500 }
      );
    }

    const form = await request.formData();
    const files = form.getAll("files").filter((item): item is File => item instanceof File);

    if (!files.length) {
      return NextResponse.json({ ok: false, error: "No files were uploaded." }, { status: 400 });
    }

    if (files.length > 10) {
      return NextResponse.json({ ok: false, error: "Maximum 10 photos allowed." }, { status: 400 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const uploaded: string[] = [];
    const errors: string[] = [];

    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        errors.push(`${file.name || "file"} is not an image.`);
        continue;
      }

      if (file.size > 8 * 1024 * 1024) {
        errors.push(`${file.name || "file"} is larger than 8MB.`);
        continue;
      }

      const ext = extensionFromType(file.type, file.name);
      const path = `pain/${Date.now()}-${Math.random().toString(36).slice(2, 10)}-${cleanName(file.name || `photo.${ext}`)}`;

      const bytes = await file.arrayBuffer();

      const { error } = await supabase.storage.from(BUCKET).upload(path, bytes, {
        contentType: file.type || `image/${ext}`,
        cacheControl: "3600",
        upsert: false,
      });

      if (error) {
        errors.push(error.message);
        continue;
      }

      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      if (data?.publicUrl) uploaded.push(data.publicUrl);
    }

    if (!uploaded.length) {
      return NextResponse.json(
        { ok: false, error: errors.join(" | ") || "No photos uploaded." },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true, urls: uploaded, photoUrls: uploaded, errors });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Pain photo upload failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
