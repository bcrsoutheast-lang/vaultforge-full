import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const BUCKETS = ["vaultforge-deal-photos", "deal-photos", "property-photos"];
const MAX_BYTES = 7 * 1024 * 1024;

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    "";

  if (!url || !key) {
    throw new Error("Missing Supabase URL or key. Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY or anon key.");
  }

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function safeName(name: string) {
  return String(name || "deal-photo.jpg")
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 90);
}

async function ensureBucket(client: ReturnType<typeof getSupabase>, bucket: string) {
  const { data } = await client.storage.getBucket(bucket);
  if (data?.name) return true;

  const { error } = await client.storage.createBucket(bucket, {
    public: true,
    fileSizeLimit: `${MAX_BYTES}`,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
  });

  return !error;
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    const dealId = String(form.get("dealId") || `deal_${Date.now()}`);

    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, error: "No image file was received." }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ ok: false, error: "The selected file is not an image." }, { status: 400 });
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { ok: false, error: "Image is still too large after browser compression. Choose a smaller image or screenshot." },
        { status: 413 },
      );
    }

    const client = getSupabase();
    const ext = file.type.includes("png") ? "png" : file.type.includes("webp") ? "webp" : "jpg";
    const path = `${dealId}/${Date.now()}-${safeName(file.name || `photo.${ext}`)}`;

    let lastError = "";

    for (const bucket of BUCKETS) {
      await ensureBucket(client, bucket);
      const { error } = await client.storage.from(bucket).upload(path, file, {
        cacheControl: "3600",
        upsert: true,
        contentType: file.type || `image/${ext}`,
      });

      if (error) {
        lastError = error.message;
        continue;
      }

      const { data } = client.storage.from(bucket).getPublicUrl(path);
      return NextResponse.json({
        ok: true,
        bucket,
        path,
        url: data.publicUrl,
        publicUrl: data.publicUrl,
        fileName: file.name,
        size: file.size,
      });
    }

    return NextResponse.json(
      { ok: false, error: lastError || "Photo upload failed. Check Supabase Storage bucket permissions." },
      { status: 500 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown photo upload error.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
