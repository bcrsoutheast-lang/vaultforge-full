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
function norm(row: any) {
  const p = photos(row.photo_urls);
  const main = row.main_photo_url || p[0] || "";
  return { ...row, photo_urls: main && !p.includes(main) ? [main, ...p] : p, main_photo_url: main };
}

export async function GET() {
  try {
    const { data, error } = await supabaseClient()
      .from("vf_deals")
      .select("*")
      .neq("status", "deleted")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, deals: (data || []).map(norm) });
  } catch (error: any) {
    return NextResponse.json({ error: "Could not load deals.", details: error?.message || String(error) }, { status: 500 });
  }
}
