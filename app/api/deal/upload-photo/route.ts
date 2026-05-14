import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const BUCKET = "vaultforge-deal-photos";

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

function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  return {
    url: clean(url),
    serviceRoleKey: clean(serviceRoleKey),
    hasUrl: Boolean(clean(url)),
    hasServiceRoleKey: Boolean(clean(serviceRoleKey)),
  };
}

function supabaseAdmin() {
  const env = getSupabaseEnv();

  if (!env.url || !env.serviceRoleKey) {
    return null;
  }

  return createClient(env.url, env.serviceRoleKey, {
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

function errorDetails(error: any) {
  return {
    message: error?.message || String(error || ""),
    statusCode: error?.statusCode || error?.status || null,
    name: error?.name || null,
    details: error?.details || null,
    hint: error?.hint || null,
    code: error?.code || null,
  };
}

async function ensureBucket(client: any) {
  try {
    const { data, error } = await client.storage.getBucket(BUCKET);

    if (!error && data?.name) {
      return { ok: true, bucket_exists: true, bucket_created: false, error: null };
    }

    if (error) {
      const message = `${error?.message || ""}`.toLowerCase();

      if (!message.includes("not found") && !message.includes("does not exist")) {
        return {
          ok: false,
          bucket_exists: false,
          bucket_created: false,
          error: errorDetails(error),
        };
      }
    }
  } catch (error: any) {
    return {
      ok: false,
      bucket_exists: false,
      bucket_created: false,
      error: errorDetails(error),
    };
  }

  try {
    const { data, error } = await client.storage.createBucket(BUCKET, {
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

    if (!error) {
      return {
        ok: true,
        bucket_exists: true,
        bucket_created: true,
        data,
        error: null,
      };
    }

    const message = `${error?.message || ""}`.toLowerCase();

    if (message.includes("already exists") || message.includes("duplicate")) {
      return {
        ok: true,
        bucket_exists: true,
        bucket_created: false,
        error: null,
      };
    }

    return {
      ok: false,
      bucket_exists: false,
      bucket_created: false,
      error: errorDetails(error),
    };
  } catch (error: any) {
    return {
      ok: false,
      bucket_exists: false,
      bucket_created: false,
      error: errorDetails(error),
    };
  }
}

async function uploadToBucket(client: any, path: string, buffer: Buffer, contentType: string) {
  try {
    const { data, error } = await client.storage.from(BUCKET).upload(path, buffer, {
      contentType,
      upsert: true,
      cacheControl: "3600",
    });

    if (error) {
      return {
        ok: false,
        data: null,
        url: "",
        error: errorDetails(error),
      };
    }

    const publicUrl =
      client.storage.from(BUCKET).getPublicUrl(data?.path || path)?.data?.publicUrl || "";

    if (!publicUrl) {
      return {
        ok: false,
        data,
        url: "",
        error: {
          message: "Upload saved, but public URL could not be generated.",
        },
      };
    }

    return {
      ok: true,
      data,
      url: publicUrl,
      error: null,
    };
  } catch (error: any) {
    return {
      ok: false,
      data: null,
      url: "",
      error: errorDetails(error),
    };
  }
}

export async function GET() {
  const env = getSupabaseEnv();

  return json({
    ok: true,
    route: "/api/deal/upload-photo",
    method: "POST multipart/form-data",
    expected_fields: ["file", "email"],
    bucket: BUCKET,
    env: {
      has_url: env.hasUrl,
      has_service_role_key: env.hasServiceRoleKey,
      service_role_key_required: true,
    },
    message: "Deal photo upload route is live.",
  });
}

export async function POST(request: Request) {
  const env = getSupabaseEnv();

  if (!env.hasUrl || !env.hasServiceRoleKey) {
    return json(
      {
        ok: false,
        error: "Supabase service role environment is missing.",
        details:
          "This route requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel. Do not use anon or publishable key for server photo uploads.",
        env: {
          has_url: env.hasUrl,
          has_service_role_key: env.hasServiceRoleKey,
        },
      },
      500
    );
  }

  const client = supabaseAdmin();

  if (!client) {
    return json(
      {
        ok: false,
        error: "Supabase admin client could not be created.",
        env: {
          has_url: env.hasUrl,
          has_service_role_key: env.hasServiceRoleKey,
        },
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

  const fileValue = formData.get("file") || formData.get("photo") || formData.get("image");
  const email =
    cleanEmail(request.headers.get("x-vf-email")) ||
    cleanEmail(formData.get("email")) ||
    cleanEmail(formData.get("owner_email")) ||
    cleanEmail(formData.get("member_email")) ||
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
  const fileName = originalName.includes(".") ? originalName : `${originalName}.${ext}`;
  const path = `${emailFolder}/${timestamp}_${random}_${fileName}`;

  let buffer: Buffer;

  try {
    const arrayBuffer = await file.arrayBuffer();
    buffer = Buffer.from(arrayBuffer);
  } catch {
    return json({ ok: false, error: "Could not read uploaded photo." }, 400);
  }

  const bucketStatus = await ensureBucket(client);

  if (!bucketStatus.ok) {
    return json(
      {
        ok: false,
        error: "Storage bucket is not usable.",
        bucket: BUCKET,
        bucket_status: bucketStatus,
      },
      500
    );
  }

  const uploaded = await uploadToBucket(client, path, buffer, contentType);

  if (!uploaded.ok || !uploaded.url) {
    return json(
      {
        ok: false,
        error: "Photo upload failed.",
        bucket: BUCKET,
        path,
        upload_error: uploaded.error,
        bucket_status: bucketStatus,
        env: {
          has_url: env.hasUrl,
          has_service_role_key: env.hasServiceRoleKey,
        },
      },
      500
    );
  }

  return json({
    ok: true,
    url: uploaded.url,
    publicUrl: uploaded.url,
    public_url: uploaded.url,
    image_url: uploaded.url,
    photo_url: uploaded.url,
    main_photo_url: uploaded.url,
    bucket: BUCKET,
    path,
    filename: originalName,
    content_type: contentType,
    size: file.size,
  });
}
