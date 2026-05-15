import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const BUCKETS = ["vaultforge-deal-photos", "vf-deal-photos", "deal-photos", "uploads"];

function clean(value: unknown) {
  return String(value || "").trim();
}

function cleanEmail(value: unknown) {
  return clean(value).toLowerCase();
}

function json(data: Record<string, any>, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}

function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    "";

  if (!url || !key) return null;

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

function safeName(name: string) {
  return (
    clean(name)
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 90) || "deal-photo.jpg"
  );
}

function extensionFromType(type: string) {
  const lower = clean(type).toLowerCase();

  if (lower.includes("png")) return "png";
  if (lower.includes("webp")) return "webp";
  if (lower.includes("gif")) return "gif";
  if (lower.includes("heic")) return "heic";
  if (lower.includes("heif")) return "heif";
  return "jpg";
}

async function tryCreateBucket(client: any, bucket: string) {
  try {
    await client.storage.createBucket(bucket, {
      public: true,
      fileSizeLimit: 10485760,
      allowedMimeTypes: ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif", "image/heic", "image/heif"],
    });
  } catch {
    // Bucket may already exist or current key may not be allowed to create buckets.
  }
}

export async function GET() {
  return json({
    ok: true,
    route: "/api/deal/upload-photo",
    method: "POST multipart/form-data",
    expected_fields: ["file", "photo", "image", "email"],
    buckets: BUCKETS,
    mode: "pain_style_non_blocking_deal_upload",
  });
}

export async function POST(request: Request) {
  const client = supabaseAdmin();

  if (!client) {
    return json(
      {
        ok: false,
        error: "Supabase upload is not configured. Deal record can still save without photos.",
      },
      200
    );
  }

  let form: FormData;

  try {
    form = await request.formData();
  } catch {
    return json({ ok: false, error: "Invalid upload form. Deal record can still save without photos." }, 200);
  }

  const file = form.get("file") || form.get("photo") || form.get("image");

  if (!(file instanceof File)) {
    return json({ ok: false, error: "Missing file. Deal record can still save without photos." }, 200);
  }

  if (!file.size) {
    return json({ ok: false, error: "Photo file is empty. Deal record can still save without photos." }, 200);
  }

  if (file.size > 10 * 1024 * 1024) {
    return json({ ok: false, error: "Photo is too large. Max size is 10MB. Deal record can still save without this photo." }, 200);
  }

  const contentType = clean(file.type) || "image/jpeg";

  if (!contentType.startsWith("image/")) {
    return json({ ok: false, error: "Only image uploads are supported. Deal record can still save without this file." }, 200);
  }

  const email = cleanEmail(form.get("email") || form.get("owner_email") || form.get("member_email") || request.headers.get("x-vf-email") || "unknown")
    .replace(/[^a-z0-9@._-]+/g, "-");

  const ext = extensionFromType(contentType);
  const originalName = safeName(file.name || `deal-photo.${ext}`);
  const fileName = originalName.includes(".") ? originalName : `${originalName}.${ext}`;
  const filePath = `${email || "unknown"}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}-${fileName}`;
  const attempts: Record<string, any>[] = [];

  let buffer: ArrayBuffer;

  try {
    buffer = await file.arrayBuffer();
  } catch {
    return json({ ok: false, error: "Could not read uploaded photo. Deal record can still save without this photo." }, 200);
  }

  for (const bucket of BUCKETS) {
    await tryCreateBucket(client, bucket);

    try {
      const { error } = await client.storage.from(bucket).upload(filePath, buffer, {
        contentType,
        upsert: true,
        cacheControl: "3600",
      });

      attempts.push({ bucket, ok: !error, error: error?.message || null });

      if (error) continue;

      const { data } = client.storage.from(bucket).getPublicUrl(filePath);
      const publicUrl = clean(data?.publicUrl);

      if (publicUrl) {
        return json({
          ok: true,
          url: publicUrl,
          publicUrl,
          public_url: publicUrl,
          photo_url: publicUrl,
          image_url: publicUrl,
          main_photo_url: publicUrl,
          primary_photo_url: publicUrl,
          bucket,
          path: filePath,
          filename: originalName,
          content_type: contentType,
          size: file.size,
        });
      }
    } catch (error: any) {
      attempts.push({ bucket, ok: false, error: error?.message || String(error) });
    }
  }

  return json(
    {
      ok: false,
      error: "Photo upload failed because Supabase Storage bucket or policy is not allowing upload. Deal record can still save without photos.",
      attempts,
    },
    200
  );
}
