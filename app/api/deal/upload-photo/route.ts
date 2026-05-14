import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const PRIMARY_BUCKET = "vaultforge-deal-photos";
const FALLBACK_BUCKETS = [
  "vaultforge-deal-photos",
  "vaultforge-project-photos",
  "vaultforge-pain-photos",
  "deal-photos",
  "project-photos",
  "photos",
];

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

  if (!url || !key) {
    return null;
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

function safeFileName(name: string) {
  const fallback = "deal-photo";
  const cleaned = clean(name)
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return cleaned || fallback;
}

function extensionFromType(type: string) {
  const lower = clean(type).toLowerCase();

  if (lower.includes("png")) return "png";
  if (lower.includes("webp")) return "webp";
  if (lower.includes("gif")) return "gif";
  if (lower.includes("heic")) return "heic";
  if (lower.includes("heif")) return "heif";
  if (lower.includes("jpeg") || lower.includes("jpg")) return "jpg";

  return "jpg";
}

async function ensureBucket(client: any, bucket: string) {
  try {
    const { data } = await client.storage.getBucket(bucket);
    if (data?.name) return { ok: true, created: false, error: null };
  } catch {
    // Continue and try to create. This only works with service role.
  }

  try {
    const { error } = await client.storage.createBucket(bucket, {
      public: true,
      fileSizeLimit: 10485760,
      allowedMimeTypes: [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
        "image/gif",
        "image/heic",
        "image/heif",
      ],
    });

    if (!error) return { ok: true, created: true, error: null };

    const text = `${error?.message || ""}`.toLowerCase();
    if (text.includes("already exists") || text.includes("duplicate")) {
      return { ok: true, created: false, error: null };
    }

    return { ok: false, created: false, error: error?.message || "Bucket could not be created." };
  } catch (error: any) {
    return { ok: false, created: false, error: error?.message || String(error) };
  }
}

async function uploadToBucket(client: any, bucket: string, path: string, buffer: Buffer, contentType: string) {
  const { data, error } = await client.storage.from(bucket).upload(path, buffer, {
    contentType,
    upsert: true,
    cacheControl: "3600",
  });

  if (error) {
    return { ok: false, data: null, url: "", error: error.message || "Upload failed." };
  }

  const publicUrl = client.storage.from(bucket).getPublicUrl(data?.path || path)?.data?.publicUrl || "";

  return {
    ok: Boolean(publicUrl),
    data,
    url: publicUrl,
    error: publicUrl ? null : "Upload saved, but public URL could not be generated.",
  };
}

export async function GET() {
  return json({
    ok: true,
    route: "/api/deal/upload-photo",
    method: "POST multipart/form-data",
    expected_fields: ["file", "email"],
    primary_bucket: PRIMARY_BUCKET,
    message: "Deal photo upload route is live.",
  });
}

export async function POST(request: Request) {
  const client = supabaseAdmin();

  if (!client) {
    return json(
      {
        ok: false,
        error: "Supabase environment variables are missing.",
        details: "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY or a publishable Supabase key.",
      },
      500
    );
  }

  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return json({ ok: false, error: "Invalid upload body. Expected multipart form data." }, 400);
  }

  const fileValue = formData.get("file");
  const email =
    cleanEmail(request.headers.get("x-vf-email")) ||
    cleanEmail(formData.get("email")) ||
    "unknown";

  if (!(fileValue instanceof File)) {
    return json({ ok: false, error: "No photo file received." }, 400);
  }

  const file = fileValue;

  if (!file.size) {
    return json({ ok: false, error: "Photo file is empty." }, 400);
  }

  if (file.size > 10 * 1024 * 1024) {
    return json({ ok: false, error: "Photo is too large. Max size is 10MB." }, 400);
  }

  const contentType = clean(file.type) || "image/jpeg";

  if (!contentType.startsWith("image/")) {
    return json({ ok: false, error: "Only image uploads are allowed." }, 400);
  }

  const ext = extensionFromType(contentType);
  const originalName = safeFileName(file.name || `deal-photo.${ext}`);
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 10);
  const emailFolder = cleanEmail(email).replace(/[^a-z0-9._-]+/g, "-") || "unknown";
  const path = `${emailFolder}/${timestamp}_${random}_${originalName.includes(".") ? originalName : `${originalName}.${ext}`}`;

  let buffer: Buffer;

  try {
    const arrayBuffer = await file.arrayBuffer();
    buffer = Buffer.from(arrayBuffer);
  } catch {
    return json({ ok: false, error: "Could not read uploaded photo." }, 400);
  }

  const attempted: Array<Record<string, any>> = [];

  for (const bucket of FALLBACK_BUCKETS) {
    const ensured = await ensureBucket(client, bucket);
    attempted.push({
      bucket,
      bucket_ready: ensured.ok,
      bucket_created: ensured.created,
      bucket_error: ensured.error,
    });

    if (!ensured.ok) {
      continue;
    }

    const uploaded = await uploadToBucket(client, bucket, path, buffer, contentType);
    attempted[attempted.length - 1].uploaded = uploaded.ok;
    attempted[attempted.length - 1].upload_error = uploaded.error;

    if (uploaded.ok && uploaded.url) {
      return json({
        ok: true,
        url: uploaded.url,
        publicUrl: uploaded.url,
        public_url: uploaded.url,
        bucket,
        path,
        filename: originalName,
        content_type: contentType,
        size: file.size,
      });
    }
  }

  return json(
    {
      ok: false,
      error: "Photo upload failed.",
      details:
        "No usable Supabase Storage bucket accepted the upload. Check that the storage bucket exists and upload policies allow this route.",
      attempted,
      expected_primary_bucket: PRIMARY_BUCKET,
    },
    500
  );
}
