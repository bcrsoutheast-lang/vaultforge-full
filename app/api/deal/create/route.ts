import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type AnyRecord = Record<string, any>;

const DEAL_TABLE = "vf_deals";

function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    "";

  if (!url || !key) return null;

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function cleanEmail(value: unknown) {
  return clean(value).toLowerCase();
}

function first(...values: unknown[]) {
  for (const value of values) {
    if (Array.isArray(value)) {
      const found = value.find((item) => clean(item));
      if (found !== undefined) return clean(found);
      continue;
    }

    const text = clean(value);
    if (text) return text;
  }

  return "";
}

function json(data: AnyRecord, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}

function arrayFromAny(value: unknown): string[] {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value
      .map((item: any) => {
        if (typeof item === "string") return clean(item);
        if (item && typeof item === "object") {
          return clean(item.url || item.publicUrl || item.public_url || item.photo_url || item.image_url || item.main_photo_url);
        }
        return "";
      })
      .filter(Boolean);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return arrayFromAny(parsed);
    } catch {
      return trimmed
        .split(/[,\n|;]/)
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }

  return [];
}

function field(body: AnyRecord, ...keys: string[]) {
  for (const key of keys) {
    const text = clean(body?.[key]);
    if (text) return text;
  }

  const raw = body?.raw_form_snapshot;
  if (raw && typeof raw === "object") {
    for (const key of keys) {
      const text = clean(raw?.[key]);
      if (text) return text;
    }
  }

  return "";
}

function makeSummary(body: AnyRecord) {
  const supplied = field(body, "ai_summary", "ai_route_summary", "route_summary", "routing_summary");
  if (supplied) return supplied;

  const title = field(body, "title", "deal_title", "project_title") || "Deal";
  const type = field(body, "property_type", "deal_type", "asset_type") || "Residential";
  const city = field(body, "city");
  const state = field(body, "state");
  const market = [city, state].filter(Boolean).join(", ") || "Market not listed";
  const strategy = field(body, "strategy") || "Strategy not listed";
  const exit = field(body, "exit_strategy") || "Exit not listed";
  const ask = field(body, "asking_price", "price", "ask", "purchase_price");
  const arv = field(body, "arv", "arv_value", "estimated_value", "after_repair_value");
  const repairs = field(body, "repair_estimate", "repairs_needed", "estimated_repairs", "rehab_budget", "repair_budget");
  const beds = field(body, "beds", "bedrooms");
  const baths = field(body, "baths", "bathrooms");
  const sqft = field(body, "sqft", "square_feet", "building_sqft");
  const needs = field(body, "deal_needs", "routing_needs", "needs", "route_context");
  const pressure = field(body, "distress_signals", "seller_pressure", "pain_signals");

  return [
    `${title}: ${type} opportunity in ${market}.`,
    `Strategy: ${strategy}.`,
    `Exit: ${exit}.`,
    ask ? `Ask: ${ask}.` : "",
    arv ? `ARV: ${arv}.` : "",
    repairs ? `Repairs: ${repairs}.` : "",
    [beds ? `${beds} beds` : "", baths ? `${baths} baths` : "", sqft ? `${sqft} sqft` : ""].filter(Boolean).length
      ? `Asset: ${[beds ? `${beds} beds` : "", baths ? `${baths} baths` : "", sqft ? `${sqft} sqft` : ""].filter(Boolean).join(" / ")}.`
      : "",
    needs ? `Routing need: ${needs}.` : "",
    pressure ? `Pressure: ${pressure}.` : "",
  ]
    .filter(Boolean)
    .join(" ");
}

function buildVfDealsPayload(body: AnyRecord, email: string) {
  const photos = Array.from(
    new Set([
      ...arrayFromAny(body.photo_urls),
      ...arrayFromAny(body.photos),
      ...arrayFromAny(body.photoUrls),
      field(body, "main_photo_url", "image_url", "photo_url", "primary_photo_url"),
    ].filter(Boolean))
  );

  const firstPhoto = field(body, "main_photo_url", "image_url", "photo_url", "primary_photo_url") || photos[0] || "";

  const title = field(body, "title", "deal_title", "project_title") || "Untitled Deal";
  const propertyType = field(body, "property_type", "deal_type", "asset_type") || "Residential";
  const city = field(body, "city");
  const state = field(body, "state") || "Georgia";

  const askingPrice = field(body, "asking_price", "price", "ask", "purchase_price");
  const arv = field(body, "arv", "arv_value", "estimated_value", "after_repair_value");
  const repairEstimate = field(body, "repair_estimate", "repairs_needed", "estimated_repairs", "rehab_budget", "repair_budget");

  const beds = field(body, "beds", "bedrooms");
  const baths = field(body, "baths", "bathrooms");
  const sqft = field(body, "sqft", "square_feet", "building_sqft");

  const dealNeeds = field(body, "deal_needs", "routing_needs", "needs", "route_context");
  const distress = field(body, "distress_signals", "seller_pressure", "pain_signals");
  const sellerSituation = field(body, "seller_situation") || distress;
  const aiSummary = makeSummary(body);

  /*
    IMPORTANT:
    This payload intentionally uses only columns confirmed in the live vf_deals table screenshots.
    No metadata.
    No square_feet.
    No ai_route_summary.
    No canonical fields.
    No alias-only columns that do not exist in the table.
  */
  return {
    owner_email: email,
    title,
    state,
    property_type: propertyType,
    strategy: field(body, "strategy", "deal_strategy"),
    price: askingPrice,
    description: field(body, "description", "notes") || aiSummary,
    status: "active",
    archived: false,
    buy_bucket_count: 0,
    ai_summary: aiSummary,
    created_at: new Date().toISOString(),

    city,
    county: field(body, "county"),
    address: field(body, "address", "property_address", "location"),
    asking_price: askingPrice,
    arv,
    repair_estimate: repairEstimate,
    equity: field(body, "equity"),
    debt_balance: field(body, "debt_balance"),
    rent_estimate: field(body, "rent_estimate"),
    noi: field(body, "noi", "net_operating_income"),
    cap_rate: field(body, "cap_rate"),
    lot_size: field(body, "lot_size"),
    building_sqft: field(body, "building_sqft") || sqft,
    land_acres: field(body, "land_acres", "acres"),
    units: field(body, "units"),
    bedrooms: field(body, "bedrooms") || beds,
    bathrooms: field(body, "bathrooms") || baths,
    year_built: field(body, "year_built", "built_year"),
    occupancy: field(body, "occupancy", "occupancy_status", "tenant_status"),
    condition: field(body, "condition"),
    timeline: field(body, "timeline"),
    seller_situation: sellerSituation,
    access_notes: field(body, "access_notes"),
    private_notes: field(body, "private_notes"),
    deal_needs: dealNeeds,
    photo_urls: photos,
    main_photo_url: firstPhoto,
    zoning: field(body, "zoning", "zoning_type"),
    utilities: field(body, "utilities", "utility_access"),
    road_frontage: field(body, "road_frontage", "frontage", "road_access"),
    parcel_id: field(body, "parcel_id"),
    in_buy_bucket: false,
    member_email: email,
    commercial_type: field(body, "commercial_type"),
    tenant_status: field(body, "tenant_status", "occupancy"),
    frontage: field(body, "frontage", "road_frontage", "road_access"),
    road_access: field(body, "road_access", "frontage", "road_frontage"),
    topography: field(body, "topography"),
    owner_name: field(body, "owner_name"),
    owner_phone: field(body, "owner_phone"),
    owner_contact_email: field(body, "owner_contact_email"),
    preferred_contact: field(body, "preferred_contact"),
    deleted: false,
    folder: "Active",
    contact_name: field(body, "contact_name"),
    contact_phone: field(body, "contact_phone"),
    contact_email: field(body, "contact_email"),
    seller_name: field(body, "seller_name"),
    seller_phone: field(body, "seller_phone"),
    seller_email: field(body, "seller_email"),

    deal_type: propertyType,
    beds,
    baths,
    sqft,
  };
}

function extractEmail(request: Request, body: AnyRecord) {
  const cookieHeader = request.headers.get("cookie") || "";
  const cookieMatch = cookieHeader.match(/vf_email=([^;]+)/);
  const cookieEmail = cookieMatch?.[1] ? decodeURIComponent(cookieMatch[1]) : "";

  return (
    cleanEmail(request.headers.get("x-vf-email")) ||
    cleanEmail(field(body, "owner_email", "member_email", "submitted_by", "submitted_by_email", "user_email", "email")) ||
    cleanEmail(cookieEmail) ||
    "unknown"
  );
}

export async function GET() {
  return json({
    ok: true,
    route: "/api/deal/create",
    table: DEAL_TABLE,
    mode: "vf_deals_exact_live_schema",
  });
}

export async function POST(request: Request) {
  const client = supabaseAdmin();

  if (!client) {
    return json({ ok: false, error: "Supabase environment variables are missing." }, 500);
  }

  let body: AnyRecord = {};

  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "Invalid JSON body." }, 400);
  }

  const email = extractEmail(request, body);
  const payload = buildVfDealsPayload(body, email);

  if (!payload.title) return json({ ok: false, error: "Deal title is required." }, 400);
  if (!payload.city) return json({ ok: false, error: "City is required." }, 400);

  const { data, error } = await client.from(DEAL_TABLE).insert(payload).select("*").single();

  if (error) {
    return json(
      {
        ok: false,
        error: "Deal could not be saved to vf_deals.",
        supabase_error: error.message,
        code: error.code,
        payload_preview: {
          title: payload.title,
          city: payload.city,
          state: payload.state,
          asking_price: payload.asking_price,
          arv: payload.arv,
          repair_estimate: payload.repair_estimate,
          beds: payload.beds,
          baths: payload.baths,
          sqft: payload.sqft,
          year_built: payload.year_built,
          strategy: payload.strategy,
          deal_needs: payload.deal_needs,
          ai_summary: payload.ai_summary,
          photo_count: payload.photo_urls.length,
        },
      },
      500
    );
  }

  return json({
    ok: true,
    saved: true,
    table: DEAL_TABLE,
    id: data?.id || null,
    deal_id: data?.id || null,
    record: data,
    field_check: {
      title: data?.title,
      city: data?.city,
      state: data?.state,
      property_type: data?.property_type,
      strategy: data?.strategy,
      asking_price: data?.asking_price,
      price: data?.price,
      arv: data?.arv,
      repair_estimate: data?.repair_estimate,
      beds: data?.beds,
      baths: data?.baths,
      bedrooms: data?.bedrooms,
      bathrooms: data?.bathrooms,
      sqft: data?.sqft,
      building_sqft: data?.building_sqft,
      year_built: data?.year_built,
      deal_needs: data?.deal_needs,
      ai_summary: data?.ai_summary,
      photo_count: Array.isArray(data?.photo_urls) ? data.photo_urls.length : 0,
    },
    message: "Deal saved to exact vf_deals columns.",
  });
}
