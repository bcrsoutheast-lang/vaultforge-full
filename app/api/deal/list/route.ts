import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function normalizePhotos(value: any): string[] {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
    } catch {
      return [value.trim()];
    }
    return [value.trim()];
  }
  return [];
}

function normalizeDeal(row: any) {
  const photos = normalizePhotos(row.photo_urls);
  const main = row.main_photo_url || photos[0] || "";

  return {
    ...row,
    photo_urls: main && !photos.includes(main) ? [main, ...photos] : photos,
    main_photo_url: main,
  };
}

export async function GET() {
  try {
    const supabase = supabaseClient();

    const { data, error } = await supabase
      .from("vf_deals")
      .select("*")
      .or("archived.is.null,archived.eq.false")
      .or("deleted.is.null,deleted.eq.false")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      return NextResponse.json({ error: error.message, details: error }, { status: 500 });
    }

    return NextResponse.json({ ok: true, deals: (data || []).map(normalizeDeal) });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Could not load deals.", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}
