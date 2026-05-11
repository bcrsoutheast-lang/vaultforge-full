import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function clean(value: unknown) {
  return String(value || "").trim();
}

function cleanEmail(value: unknown) {
  return clean(value).toLowerCase();
}

function readCookie(cookieHeader: string, name: string) {
  const parts = cookieHeader.split(";").map((part) => part.trim());

  for (const part of parts) {
    if (!part.startsWith(`${name}=`)) continue;

    try {
      return decodeURIComponent(part.slice(name.length + 1));
    } catch {
      return part.slice(name.length + 1);
    }
  }

  return "";
}

function getEmail(request: Request, formData: FormData) {
  const cookie = request.headers.get("cookie") || "";

  return cleanEmail(
    request.headers.get("x-vf-email") ||
      formData.get("email") ||
      readCookie(cookie, "vf_email") ||
      readCookie(cookie, "vf_member_email") ||
      readCookie(cookie, "vf_admin_email")
  );
}

function supabaseClient() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    "";

  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    "";

  if (!url || !key) {
    throw new Error("Missing Supabase environment variables.");
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
  return name
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

async function ensureBucket(db: ReturnType<typeof supabaseClient>, bucket: string) {
  try {
    await db.storage.createBucket(bucket, {
      public: true,
      fileSizeLimit: 8 * 1024 * 1024,
      allowedMimeTypes: ["image/png", "image/jpeg", "image/webp", "image/gif"],
    });
  } catch {
    // Bucket may already exist or anon key may not have bucket-create rights.
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const email = getEmail(request, formData);
    const file = formData.get("file");

    if (!email) {
      return NextResponse.json(
        { ok: false, error: "Login email required before profile photo upload." },
        { status: 401 }
      );
    }

    if (!(file instanceof File)) {
      return NextResponse.json(
        { ok: false, error: "Profile photo file required." },
        { status: 400 }
      );
    }

    const allowed = ["image/png", "image/jpeg", "image/webp", "image/gif"];

    if (!allowed.includes(file.type)) {
      return NextResponse.json(
        { ok: false, error: "Only PNG, JPG, WEBP, or GIF images are allowed." },
        { status: 400 }
      );
    }

    if (file.size > 8 * 1024 * 1024) {
      return NextResponse.json(
        { ok: false, error: "Profile photo must be under 8MB." },
        { status: 400 }
      );
    }

    const db = supabaseClient();
    const buckets = ["vaultforge-profile-photos", "vaultforge-pain-photos"];
    const folder = email.replace(/[^a-zA-Z0-9._-]/g, "_");
    const ext = safeFileName(file.name || "profile-photo").split(".").pop() || "jpg";
    const objectPath = `${folder}/${Date.now()}-profile.${ext}`;

    const attempts: any[] = [];

    for (const bucket of buckets) {
      await ensureBucket(db, bucket);

      const upload = await db.storage.from(bucket).upload(objectPath, file, {
        upsert: true,
        contentType: file.type || "image/jpeg",
      });

      attempts.push({
        bucket,
        ok: !upload.error,
        error: upload.error?.message || null,
      });

      if (!upload.error) {
        const publicUrl = db.storage.from(bucket).getPublicUrl(objectPath).data.publicUrl;

        return NextResponse.json({
          ok: true,
          bucket,
          path: objectPath,
          url: publicUrl,
          profile_photo_url: publicUrl,
          photo_url: publicUrl,
          attempts,
        });
      }
    }

    return NextResponse.json(
      {
        ok: false,
        error: "Profile photo could not be uploaded to available storage buckets.",
        attempts,
      },
      { status: 500 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: "Profile photo upload failed.",
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
