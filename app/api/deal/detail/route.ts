import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function supabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";
  if (!url || !key) throw new Error("Missing Supabase environment values.");
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

function photos(v: any): string[] {
  if (Array.isArray(v)) return v.map(String).filter(Boolean);
  if (typeof v === "string" && v.trim()) {
    try { const p = JSON.parse(v); if (Array.isArray(p)) return p.map(String).filter(Boolean); } catch {}
    return [v.trim()];
  }
  return [];
}

function normalize(row: any) {
  const p = photos(row.photo_urls);
  const main = String(row.main_photo_url || p[0] || "").trim();
  return {
    ...row,
    photo_urls: main && !p.includes(main) ? [main, ...p] : p,
    main_photo_url: main || p[0] || "",
    owner_name: row.owner_name || row.contact_name || row.seller_name || "",
    owner_phone: row.owner_phone || row.contact_phone || row.seller_phone || "",
    owner_contact_email: row.owner_contact_email || row.contact_email || row.seller_email || row.owner_email || row.member_email || "",
  };
}

export async function GET(request: Request) {
  try {
    const id = new URL(request.url).searchParams.get("id") || "";
    if (!id) return NextResponse.json({ error: "Missing deal id." }, { status: 400 });

    const { data, error } = await supabaseClient().from("vf_deals").select("*").eq("id", id).maybeSingle();
    if (error) return NextResponse.json({ error: error.message, details: error }, { status: 500 });
    if (!data) return NextResponse.json({ error: "Deal not found." }, { status: 404 });

    return NextResponse.json({ ok: true, deal: normalize(data) });
  } catch (error: any) {
    return NextResponse.json({ error: "Could not load deal.", details: error?.message || String(error) }, { status: 500 });
  }
}
