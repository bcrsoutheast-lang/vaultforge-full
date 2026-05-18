import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function safeName(value: string) {
  return String(value || "deal-photo").toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/-+/g, "-").slice(0, 80);
}

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function POST(request: Request) {
  try {
    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ ok: false, error: "Supabase environment variables are missing." }, { status: 200 });
    }

    const form = await request.formData();
    const file = form.get("file");
    const dealId = String(form.get("dealId") || `deal_${Date.now()}`);

    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, error: "No file received." }, { status: 200 });
    }

    const ext = file.type.includes("png") ? "png" : file.type.includes("webp") ? "webp" : "jpg";
    const path = `${safeName(dealId)}/${Date.now()}-${safeName(file.name || `photo.${ext}`)}`;
    const bucket = "vaultforge-deal-photos";

    const upload = await supabase.storage.from(bucket).upload(path, file, {
      contentType: file.type || `image/${ext}`,
      upsert: true,
    });

    if (upload.error) {
      return NextResponse.json({ ok: false, error: upload.error.message, bucket, path }, { status: 200 });
    }

    const publicUrl = supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
    return NextResponse.json({ ok: true, url: publicUrl, path, bucket });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Unknown upload error." }, { status: 200 });
  }
}
