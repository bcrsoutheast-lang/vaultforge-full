import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const BUCKET_NAME = "vaultforge-pain-photos";

type UploadFile = {
  name?: string;
  size?: number;
  type?: string;
  data_url?: string;
  dataUrl?: string;
};

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

function requestEmail(request: Request, body: Record<string, any>) {
  const cookie = request.headers.get("cookie") || "";

  return cleanEmail(
    request.headers.get("x-vf-email") ||
      body.email ||
      body.member_email ||
      readCookie(cookie, "vf_email") ||
      readCookie(cookie, "vf_member_email") ||
      readCookie(cookie, "vf_admin_email")
  );
}

function safeFileName(name: string) {
  const base = clean(name || "pain-photo")
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return base || "pain-photo";
}

function extensionFromType(type: string, name: string) {
  const lowerName = name.toLowerCase();
  const existing = lowerName.match(/\.[a-z0-9]+$/)?.[0]?.replace(".", "");

  if (existing) return existing;
  if (type.includes("png")) return "png";
  if (type.includes("webp")) return "webp";
  if (type.includes("gif")) return "gif";
  if (type.includes("pdf")) return "pdf";
  return "jpg";
}

function parseDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);

  if (!match) {
    throw new Error("Invalid file data.");
  }

  return {
    contentType: match[1],
    buffer: Buffer.from(match[2], "base64"),
  };
}

async function ensureBucket(supabase: any) {
  try {
    await supabase.storage.createBucket(BUCKET_NAME, {
      public: true,
      fileSizeLimit: 8 * 1024 * 1024,
      allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"],
    });
  } catch {
    // Bucket likely already exists, or the available key cannot create buckets.
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = requestEmail(request, body);
    const files: UploadFile[] = Array.isArray(body.files) ? body.files.slice(0, 8) : [];

    if (!email || !email.includes("@")) {
      return NextResponse.json({ ok: false, error: "Login email required." }, { status: 401 });
    }

    if (!files.length) {
      return NextResponse.json({ ok: true, files: [], urls: [] });
    }

    const supabase = supabaseClient();
    await ensureBucket(supabase);

    const folderEmail = email.replace(/[^a-z0-9._-]+/g, "_");
    const uploaded: Record<string, any>[] = [];
    const errors: string[] = [];

    for (let index = 0; index < files.length; index += 1) {
      const file = files[index];
      const rawData = clean(file.data_url || file.dataUrl);
      const originalName = clean(file.name || `pain-photo-${index + 1}`);
      const typeHint = clean(file.type || "");

      if (!rawData) continue;

      try {
        const parsed = parseDataUrl(rawData);
        const contentType = typeHint || parsed.contentType;
        const ext = extensionFromType(contentType, originalName);
        const name = safeFileName(originalName.replace(/\.[a-z0-9]+$/i, ""));
        const path = `${folderEmail}/${Date.now()}-${index + 1}-${name}.${ext}`;

        const { error } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(path, parsed.buffer, {
            contentType,
            upsert: false,
          });

        if (error) {
          errors.push(`${originalName}: ${error.message}`);
          continue;
        }

        const publicResult = supabase.storage.from(BUCKET_NAME).getPublicUrl(path);
        const publicUrl = publicResult?.data?.publicUrl || "";

        uploaded.push({
          name: originalName,
          size: Number(file.size || 0),
          type: contentType,
          path,
          url: publicUrl,
          public_url: publicUrl,
          bucket: BUCKET_NAME,
        });
      } catch (error: any) {
        errors.push(`${originalName}: ${error?.message || "upload failed"}`);
      }
    }

    return NextResponse.json({
      ok: true,
      bucket: BUCKET_NAME,
      files: uploaded,
      urls: uploaded.map((file) => file.url).filter(Boolean),
      errors,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: "Pain photo upload failed.",
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
