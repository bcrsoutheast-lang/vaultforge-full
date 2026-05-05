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
  if (!cleaned || cleaned === "." || cleaned === "-" || cleaned === "-.") return null;

  const number = Number(cleaned);
  return Number.isFinite(number) ? number : null;
}

function cleanTextOrNull(value: unknown) {
  const text = cleanString(value);
  return text ? text : null;
}

function firstText(...values: unknown[]) {
  for (const value of values) {
    const cleaned = cleanString(value);
    if (cleaned) return cleaned;
  }
  return "";
}

function firstNumber(...values: unknown[]) {
  for (const value of values) {
    const cleaned = cleanNumber(value);
    if (cleaned !== null) return cleaned;
  }
  return null;
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

    return [value.trim()];
  }

  return [];
}

function removeUndefined(row: Record<string, any>) {
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
    const priceValue = firstNumber(body.price, body.asking_price);
    const askingPriceValue = firstNumber(body.asking_price, body.price);
    const propertyType = firstText(body.property_type, body.deal_type, "Deal");

    const insertable = removeUndefined({
      owner_email: email,
      member_email: email,

      title: firstText(body.title, "Untitled Deal"),
      property_type: propertyType,
      deal_type: propertyType,
      strategy: firstText(body.strategy, "Strategy Needed"),

      city: firstText(body.city, "Unknown City"),
      state: firstText(body.state, "Unknown State"),
      address: cleanTextOrNull(body.address),

      price: priceValue,
      asking_price: askingPriceValue,
      arv: cleanNumber(body.arv),
      repair_estimate: cleanNumber(body.repair_estimate),

      description: cleanTextOrNull(body.description),
      status: firstText(body.status, "active"),

      photo_urls: photos,
      main_photo_url: photos[0] || cleanTextOrNull(body.main_photo_url),

      bedrooms: cleanTextOrNull(body.bedrooms ?? body.beds),
      bathrooms: cleanTextOrNull(body.bathrooms ?? body.baths),
      beds: cleanTextOrNull(body.beds ?? body.bedrooms),
      baths: cleanTextOrNull(body.baths ?? body.bathrooms),
      building_sqft: cleanTextOrNull(body.building_sqft ?? body.sqft),
      sqft: cleanTextOrNull(body.sqft ?? body.building_sqft),
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

      seller_situation: cleanTextOrNull(body.seller_situation),
      access_notes: cleanTextOrNull(body.access_notes),
      private_notes: cleanTextOrNull(body.private_notes),

      owner_name: cleanTextOrNull(body.owner_name ?? body.contact_name ?? body.seller_name),
      contact_name: cleanTextOrNull(body.contact_name ?? body.owner_name ?? body.seller_name),
      seller_name: cleanTextOrNull(body.seller_name ?? body.owner_name ?? body.contact_name),
      owner_phone: cleanTextOrNull(body.owner_phone ?? body.contact_phone ?? body.seller_phone),
      contact_phone: cleanTextOrNull(body.contact_phone ?? body.owner_phone ?? body.seller_phone),
      seller_phone: cleanTextOrNull(body.seller_phone ?? body.owner_phone ?? body.contact_phone),
      owner_contact_email: cleanTextOrNull(body.owner_contact_email ?? body.contact_email ?? body.seller_email),
      contact_email: cleanTextOrNull(body.contact_email ?? body.owner_contact_email ?? body.seller_email),
      seller_email: cleanTextOrNull(body.seller_email ?? body.owner_contact_email ?? body.contact_email),
      preferred_contact: cleanTextOrNull(body.preferred_contact),
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
