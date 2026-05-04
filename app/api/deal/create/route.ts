import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

function cleanNumber(v: any) {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(String(v).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function normalizePhotos(v: any): string[] {
  if (Array.isArray(v)) return v.filter(Boolean);
  if (typeof v === "string") {
    try {
      const parsed = JSON.parse(v);
      return Array.isArray(parsed) ? parsed.filter(Boolean) : v ? [v] : [];
    } catch {
      return v ? [v] : [];
    }
  }
  return [];
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = (request.headers.get("x-vf-email") || body.owner_email || body.member_email || body.email || "").trim().toLowerCase();
    const photos = normalizePhotos(body.photo_urls || body.photos || body.image_urls);

    const payload: Record<string, any> = {
      owner_email: email || null,
      title: body.title || body.deal_title || body.name || "Untitled Deal",
      property_type: body.property_type || body.type || "Deal",
      strategy: body.strategy || "Strategy Needed",
      city: body.city || null,
      state: body.state || null,
      asking_price: cleanNumber(body.asking_price || body.price || body.ask),
      arv: cleanNumber(body.arv),
      repairs: cleanNumber(body.repairs || body.repair_estimate),
      description: body.description || body.summary || null,
      status: body.status || "active",
      photo_urls: photos,
      main_photo_url: body.main_photo_url || photos[0] || null,
    };

    Object.keys(payload).forEach((key) => payload[key] === undefined && delete payload[key]);

    const supabase = getSupabase();
    const { data, error } = await supabase.from("vf_deals").insert(payload).select("*").single();

    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, deal: data });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Failed to create deal." }, { status: 500 });
  }
}
