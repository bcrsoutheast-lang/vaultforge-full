import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const BUCKETS = ["vaultforge-pain-photos", "pain-photos", "vf-pain-photos", "uploads"];

function clean(value: unknown) {
  return String(value || "").trim();
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

function safeName(name: string) {
  return clean(name)
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90) || "pain-photo.jpg";
}

async function ensureBucket(client: any, bucket: string) {
  try {
    await client.storage.createBucket(bucket, {
      public: true,
      fileSizeLimit: 10485760,
      allowedMimeTypes: ["image/png", "image/jpeg", "image/webp", "image/gif"],
    });
  } catch {
    // Bucket may already exist or current key may not allow creation.
  }
}

export async function POST(request: Request) {
  const client = supabaseAdmin();

  if (!client) {
    return json({ ok: false, error: "Supabase environment variables are missing." }, 500);
  }

  let form: FormData;

  try {
    form = await request.formData();
  } catch {
    return json({ ok: false, error: "Invalid upload form." }, 400);
  }

  const file = form.get("file");

  if (!(file instanceof File)) {
    return json({ ok: false, error: "Missing file." }, 400);
  }

  if (!file.type.startsWith("image/")) {
    return json({ ok: false, error: "Only image uploads are supported for pain photos." }, 400);
  }

  const email = clean(form.get("email") || request.headers.get("x-vf-email") || "unknown")
    .toLowerCase()
    .replace(/[^a-z0-9@._-]+/g, "-");

  const buffer = await file.arrayBuffer();
  const ext = file.type.includes("png")
    ? "png"
    : file.type.includes("webp")
    ? "webp"
    : file.type.includes("gif")
    ? "gif"
    : "jpg";

  const filePath = `${email || "unknown"}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}-${safeName(file.name || `pain.${ext}`)}`;

  const attempts: Record<string, any>[] = [];

  for (const bucket of BUCKETS) {
    await ensureBucket(client, bucket);

    try {
      const { error } = await client.storage.from(bucket).upload(filePath, buffer, {
        contentType: file.type || `image/${ext}`,
        upsert: true,
      });

      attempts.push({ bucket, ok: !error, error: error?.message || null });

      if (error) continue;

      const { data } = client.storage.from(bucket).getPublicUrl(filePath);
      const publicUrl = clean(data?.publicUrl);

      if (!publicUrl) continue;

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
      });
    } catch (error: any) {
      attempts.push({ bucket, ok: false, error: error?.message || String(error) });
    }
  }

  return json(
    {
      ok: false,
      error: "Photo upload failed. Check Supabase Storage bucket permissions.",
      attempts,
    },
    500
  );
}
