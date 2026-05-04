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
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function cleanString(value: unknown) {
  return String(value || "").trim();
}

function cleanNumber(value: unknown) {
  const raw = String(value || "").replace(/[^\d.]/g, "");
  if (!raw) return null;
  const number = Number(raw);
  return Number.isFinite(number) ? number : null;
}

function photoArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => String(item || "").trim()).filter(Boolean);
  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.map((item) => String(item || "").trim()).filter(Boolean);
    } catch {
      return [value.trim()];
    }
  }
  return [];
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email =
      cleanString(request.headers.get("x-vf-email")) ||
      cleanString(body.owner_email) ||
      cleanString(body.member_email) ||
      "text@text.com";

    const photos = photoArray(body.photo_urls);

    const insertable: Record<string, any> = {
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
      bedrooms: cleanString(body.bedrooms),
      bathrooms: cleanString(body.bathrooms),
      building_sqft: cleanString(body.building_sqft),
      year_built: cleanString(body.year_built),
      occupancy: cleanString(body.occupancy),
      condition: cleanString(body.condition),
      commercial_type: cleanString(body.commercial_type),
      units: cleanString(body.units),
      noi: cleanString(body.noi),
      cap_rate: cleanString(body.cap_rate),
      zoning: cleanString(body.zoning),
      tenant_status: cleanString(body.tenant_status),
      land_acres: cleanString(body.land_acres),
      frontage: cleanString(body.frontage),
      utilities: cleanString(body.utilities),
      road_access: cleanString(body.road_access),
      topography: cleanString(body.topography),
      parcel_id: cleanString(body.parcel_id),
      seller_situation: cleanString(body.seller_situation),
      access_notes: cleanString(body.access_notes),
      private_notes: cleanString(body.private_notes),
    };

    const supabase = supabaseClient();

    let { data, error } = await supabase
      .from("vf_deals")
      .insert(insertable)
      .select("*")
      .single();

    if (error && /column .* does not exist|schema cache/i.test(error.message || "")) {
      const fallback: Record<string, any> = {
        owner_email: email,
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
