import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function supabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";
  if (!url || !key) throw new Error("Missing Supabase environment values.");
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

function text(v: unknown) { return String(v || "").trim(); }
function money(v: unknown) {
  const raw = String(v || "").replace(/[^\d.]/g, "");
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}
function photoArray(v: unknown) {
  if (Array.isArray(v)) return v.map(x => String(x || "").trim()).filter(Boolean);
  if (typeof v === "string" && v.trim()) {
    try {
      const p = JSON.parse(v);
      if (Array.isArray(p)) return p.map(x => String(x || "").trim()).filter(Boolean);
    } catch {}
    return [v.trim()];
  }
  return [];
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = text(request.headers.get("x-vf-email")) || text(body.owner_email) || text(body.member_email) || "text@text.com";
    const photos = photoArray(body.photo_urls);

    const row: Record<string, any> = {
      owner_email: email,
      member_email: email,
      title: text(body.title) || "Untitled Deal",
      property_type: text(body.property_type) || "Deal",
      strategy: text(body.strategy) || "Strategy Needed",
      city: text(body.city),
      state: text(body.state),
      address: text(body.address),
      asking_price: money(body.asking_price),
      arv: money(body.arv),
      repair_estimate: money(body.repair_estimate),
      description: text(body.description),
      status: text(body.status) || "active",
      photo_urls: photos,
      main_photo_url: text(body.main_photo_url) || photos[0] || "",
      bedrooms: text(body.bedrooms),
      bathrooms: text(body.bathrooms),
      building_sqft: text(body.building_sqft),
      year_built: text(body.year_built),
      occupancy: text(body.occupancy),
      condition: text(body.condition),
      commercial_type: text(body.commercial_type),
      units: text(body.units),
      noi: text(body.noi),
      cap_rate: text(body.cap_rate),
      zoning: text(body.zoning),
      tenant_status: text(body.tenant_status),
      land_acres: text(body.land_acres),
      frontage: text(body.frontage),
      utilities: text(body.utilities),
      road_access: text(body.road_access),
      topography: text(body.topography),
      parcel_id: text(body.parcel_id),
      seller_situation: text(body.seller_situation),
      access_notes: text(body.access_notes),
      private_notes: text(body.private_notes),
      owner_name: text(body.owner_name),
      owner_phone: text(body.owner_phone),
      owner_contact_email: text(body.owner_contact_email),
      preferred_contact: text(body.preferred_contact),
    };

    const supabase = supabaseClient();
    const { data, error } = await supabase.from("vf_deals").insert(row).select("*").single();

    if (error) return NextResponse.json({ error: error.message, details: error }, { status: 500 });
    return NextResponse.json({ ok: true, deal: data });
  } catch (error: any) {
    return NextResponse.json({ error: "Could not create deal.", details: error?.message || String(error) }, { status: 500 });
  }
}
