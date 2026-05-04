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
function email(v: unknown) { return String(v || "").trim().toLowerCase(); }
function photos(v: any): string[] {
  if (Array.isArray(v)) return v.map(String).filter(Boolean);
  if (typeof v === "string" && v.trim()) {
    try { const p = JSON.parse(v); if (Array.isArray(p)) return p.map(String).filter(Boolean); } catch {}
    return [v.trim()];
  }
  return [];
}
function norm(row: any) {
  if (!row) return null;
  const p = photos(row.photo_urls);
  const main = row.main_photo_url || p[0] || "";
  return { ...row, photo_urls: main && !p.includes(main) ? [main, ...p] : p, main_photo_url: main };
}

export async function GET(request: Request) {
  try {
    const who = email(request.headers.get("x-vf-email")) || email(new URL(request.url).searchParams.get("email")) || "text@text.com";
    const supabase = supabaseClient();
    const { data: rows, error } = await supabase
      .from("vf_buy_bucket")
      .select("*")
      .or(`buyer_email.eq.${who},member_email.eq.${who}`)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const ids = Array.from(new Set((rows || []).map((r: any) => r.deal_id).filter(Boolean)));
    if (ids.length === 0) return NextResponse.json({ ok: true, deals: [] });

    const { data: deals, error: dealError } = await supabase.from("vf_deals").select("*").in("id", ids);
    if (dealError) return NextResponse.json({ error: dealError.message }, { status: 500 });

    const map = new Map((deals || []).map((d: any) => [d.id, norm(d)]));
    const merged = (rows || []).map((r: any) => ({ ...r, deal: map.get(r.deal_id) || null })).filter((r: any) => r.deal);

    return NextResponse.json({ ok: true, deals: merged });
  } catch (error: any) {
    return NextResponse.json({ error: "Could not load Buy Bucket.", details: error?.message || String(error) }, { status: 500 });
  }
}
