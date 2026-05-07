import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const BUCKETS = ["deal-photos", "deal-photo", "project-images"];
const MAX_FILE_SIZE_BYTES = 12 * 1024 * 1024;

function clean(value: unknown) {
  return String(value || "").trim();
}

function cleanEmail(value: unknown) {
  return clean(value).toLowerCase();
}

function supabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    "";

  if (!url || !key) {
    throw new Error("Missing Supabase environment values.");
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}

function safeFileName(name: string) {
  return clean(name)
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120) || "photo.jpg";
}

function contentTypeFor(file: File) {
  return file.type && file.type.startsWith("image/") ? file.type : "image/jpeg";
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    const email =
      cleanEmail(request.headers.get("x-vf-email")) ||
      cleanEmail(form.get("email"));

    if (!email) {
      return NextResponse.json(
        { ok: false, error: "Login required before uploading photos." },
        { status: 401 }
      );
    }

    if (!(file instanceof File)) {
      return NextResponse.json(
        { ok: false, error: "No photo file was received." },
        { status: 400 }
      );
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { ok: false, error: "Only image uploads are allowed." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { ok: false, error: "Photo is too large. Use an image under 12MB." },
        { status: 400 }
      );
    }

    const supabase = supabaseClient();
    const safeEmail = email.replace(/[^a-z0-9@._-]+/gi, "-");
    const path = `${safeEmail}/${Date.now()}-${Math.random()
      .toString(16)
      .slice(2)}-${safeFileName(file.name)}`;

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const contentType = contentTypeFor(file);

    let lastError: any = null;

    for (const bucket of BUCKETS) {
      const { error } = await supabase.storage
        .from(bucket)
        .upload(path, buffer, {
          contentType,
          upsert: true,
        });

      if (!error) {
        const { data } = supabase.storage.from(bucket).getPublicUrl(path);

        return NextResponse.json({
          ok: true,
          bucket,
          path,
          url: data.publicUrl,
        });
      }

      lastError = error;
    }

    return NextResponse.json(
      {
        ok: false,
        error: "Photo upload failed.",
        details: lastError?.message || lastError || "No configured storage bucket accepted the upload.",
      },
      { status: 500 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: "Photo upload failed.",
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
