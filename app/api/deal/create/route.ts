import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

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
    },
  });
}

function cleanString(value: unknown) {
  return String(value || "").trim();
}

function cleanEmail(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

function cleanNumber(value: unknown) {
  const raw = String(value ?? "").trim();

  if (!raw) return null;

  const cleaned = raw.replace(/[^\d.-]/g, "");

  if (!cleaned || cleaned === "." || cleaned === "-" || cleaned === "-.") {
    return null;
  }

  const number = Number(cleaned);

  return Number.isFinite(number) ? number : null;
}

function cleanTextOrNull(value: unknown) {
  const text = cleanString(value);
  return text ? text : null;
}

function photoArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || "").trim()).filter(Boolean);
  }

  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item || "").trim()).filter(Boolean);
      }
    } catch {
      return [value.trim()];
    }
  }

  return [];
}

function removeUndefinedAndEmptyNumeric(row: Record<string, any>) {
  const cleaned: Record<string, any> = {};

  for (const [key, value] of Object.entries(row)) {
    if (value === undefined) continue;
    cleaned[key] = value;
  }

  return cleaned;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const email =
      cleanEmail(request.headers.get("x-vf-email")) ||
      cleanEmail(body.owner_email) ||
      cleanEmail(body.member_email) ||
      "text@text.com";

    const photos = photoArray(body.photo_urls);

    const insertable = removeUndefinedAndEmptyNumeric({
      owner_email: email,
      member_email: email,

      title: cleanString(body.title) || "Untitled Deal",
      property_type: cleanString(body.property_type) || "Deal",
      strategy: cleanString(body.strategy) || "Strategy Needed",

      city: cleanString(body.city),
      state: cleanString(body.state),
      address: cleanString(body.address),

      asking_price: cleanNumber(body.asking_price),
      arv: cleanNumber(body.arv),
      repair_estimate: cleanNumber(body.repair_estimate),

      description: cleanString(body.description),
      status: cleanString(body.status) || "active",

      photo_urls: photos,
      main_photo_url: cleanString(body.main_photo_url) || photos[0] || "",

      bedrooms: cleanTextOrNull(body.bedrooms),
      bathrooms: cleanTextOrNull(body.bathrooms),
      building_sqft: cleanTextOrNull(body.building_sqft),
      year_built: cleanTextOrNull(body.year_built),
      occupancy: cleanTextOrNull(body.occupancy),
      condition: cleanTextOrNull(body.condition),

      commercial_type: cleanTextOrNull(body.commercial_type),
      units: cleanTextOrNull(body.units),
      noi: cleanTextOrNull(body.noi),
      cap_rate: cleanTextOrNull(body.cap_rate),
      zoning: cleanTextOrNull(body.zoning),
      tenant_status: cleanTextOrNull(body.tenant_status),

      land_acres: cleanTextOrNull(body.land_acres),
      frontage: cleanTextOrNull(body.frontage),
      utilities: cleanTextOrNull(body.utilities),
      road_access: cleanTextOrNull(body.road_access),
      topography: cleanTextOrNull(body.topography),
      parcel_id: cleanTextOrNull(body.parcel_id),

      seller_situation: cleanString(body.seller_situation),
      access_notes: cleanString(body.access_notes),
      private_notes: cleanString(body.private_notes),

      owner_name: cleanString(body.owner_name),
      owner_phone: cleanString(body.owner_phone),
      owner_contact_email: cleanString(body.owner_contact_email),
      preferred_contact: cleanString(body.preferred_contact),
    });

    const supabase = supabaseClient();

    let { data, error } = await supabase
      .from("vf_deals")
      .insert(insertable)
      .select("*")
      .single();

    if (error && /column .* does not exist|schema cache/i.test(error.message || "")) {
      const fallback: Record<string, any> = {
        owner_email: email,
        member_email: email,
        title: insertable.title,
        property_type: insertable.property_type,
        strategy: insertable.strategy,
        city: insertable.city,
        state: insertable.state,
        address: insertable.address,
        asking_price: insertable.asking_price,
        arv: insertable.arv,
        repair_estimate: insertable.repair_estimate,
        description: insertable.description,
        status: insertable.status,
        photo_urls: insertable.photo_urls,
        main_photo_url: insertable.main_photo_url,
      };

      const retry = await supabase
        .from("vf_deals")
        .insert(fallback)
        .select("*")
        .single();

      data = retry.data;
      error = retry.error;
    }

    if (error) {
      return NextResponse.json({ error: error.message, details: error }, { status: 500 });
    }

    return NextResponse.json({ ok: true, deal: data });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Could not create deal.", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}
