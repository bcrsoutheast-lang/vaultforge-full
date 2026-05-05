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

function firstDefined(...values: any[]) {
  for (const value of values) {
    if (value !== null && value !== undefined && value !== "") return value;
  }
  return null;
}

function normalizeDeal(row: any) {
  if (!row) return null;

  const photos = normalizePhotos(row.photo_urls);
  const main = String(row.main_photo_url || photos[0] || "").trim();

  const price = firstDefined(row.price, row.asking_price);
  const askingPrice = firstDefined(row.asking_price, row.price);
  const propertyType = firstDefined(row.property_type, row.deal_type, "Deal");
  const dealType = firstDefined(row.deal_type, row.property_type, "Deal");
  const bedrooms = firstDefined(row.bedrooms, row.beds);
  const bathrooms = firstDefined(row.bathrooms, row.baths);
  const buildingSqft = firstDefined(row.building_sqft, row.sqft);
  const ownerName = firstDefined(row.owner_name, row.contact_name, row.seller_name, "");
  const ownerPhone = firstDefined(row.owner_phone, row.contact_phone, row.seller_phone, "");
  const ownerContactEmail = firstDefined(
    row.owner_contact_email,
    row.contact_email,
    row.seller_email,
    row.owner_email,
    row.member_email,
    ""
  );

  return {
    ...row,

    price,
    asking_price: askingPrice,

    property_type: propertyType,
    deal_type: dealType,

    bedrooms,
    bathrooms,
    beds: firstDefined(row.beds, row.bedrooms),
    baths: firstDefined(row.baths, row.bathrooms),
    building_sqft: buildingSqft,
    sqft: firstDefined(row.sqft, row.building_sqft),

    photo_urls: main && !photos.includes(main) ? [main, ...photos] : photos,
    main_photo_url: main || photos[0] || "",

    owner_name: ownerName,
    owner_phone: ownerPhone,
    owner_contact_email: ownerContactEmail,
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

    return NextResponse.json({ ok: true, deals: (data || []).map(normalizeDeal).filter(Boolean) });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Could not load deals.", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}
