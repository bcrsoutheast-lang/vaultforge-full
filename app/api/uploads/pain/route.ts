import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const BUCKETS = ["vaultforge-pain-photos", "vf-pain-photos", "pain-photos", "uploads"];

function clean(value: unknown) {
  return String(value || "").trim();
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
  return clean(name)
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90) || "pain-photo.jpg";
}

async function tryCreateBucket(client: any, bucket: string) {
  try {
    await client.storage.createBucket(bucket, {
      public: true,
      fileSizeLimit: 10485760,
      allowedMimeTypes: ["image/png", "image/jpeg", "image/webp", "image/gif", "image/heic", "image/heif"],
    });
  } catch {
    // Bucket may already exist or key may not have bucket-create permission.
  }
}

export async function POST(request: Request) {
  const client = supabaseAdmin();

  if (!client) {
    return json(
      {
        ok: false,
        error: "Supabase upload is not configured. Pain record can still save without photos.",
      },
      200
    );
  }

  let form: FormData;

  try {
    form = await request.formData();
  } catch {
    return json({ ok: false, error: "Invalid upload form. Pain record can still save without photos." }, 200);
  }

  const file = form.get("file");

  if (!(file instanceof File)) {
    return json({ ok: false, error: "Missing file. Pain record can still save without photos." }, 200);
  }

  if (!file.type.startsWith("image/")) {
    return json({ ok: false, error: "Only image uploads are supported. Pain record can still save without this file." }, 200);
  }

  const email = clean(form.get("email") || request.headers.get("x-vf-email") || "unknown")
    .toLowerCase()
    .replace(/[^a-z0-9@._-]+/g, "-");

  const ext = file.type.includes("png")
    ? "png"
    : file.type.includes("webp")
    ? "webp"
    : file.type.includes("gif")
    ? "gif"
    : file.type.includes("heic") || file.type.includes("heif")
    ? "heic"
    : "jpg";

  const bytes = new Uint8Array(await file.arrayBuffer());
  const filePath = `${email || "unknown"}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}-${safeName(file.name || `pain.${ext}`)}`;
  const attempts: Record<string, any>[] = [];

  for (const bucket of BUCKETS) {
    await tryCreateBucket(client, bucket);

    try {
      const { error } = await client.storage.from(bucket).upload(filePath, bytes, {
        contentType: file.type || `image/${ext}`,
        upsert: true,
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
          bucket,
          path: filePath,
          attempts,
        });
      }
    } catch (error: any) {
      attempts.push({ bucket, ok: false, error: error?.message || String(error) });
    }
  }

  return json(
    {
      ok: false,
      error: "Photo upload failed because Supabase Storage bucket or policy is not allowing upload. Pain record can still save without photos.",
      attempts,
    },
    200
  );
}
