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

function readCookie(cookieHeader: string, name: string) {
  const parts = cookieHeader.split(";").map((part) => part.trim());

  for (const part of parts) {
    if (!part.startsWith(`${name}=`)) continue;

    try {
      return decodeURIComponent(part.slice(name.length + 1));
    } catch {
      return part.slice(name.length + 1);
    }
  }

  return "";
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

function moneyLike(body: AnyRecord, ...keys: string[]) {
  const value = field(body, ...keys);
  if (!value) return "";

  const cleaned = value.replace(/[$,\s]/g, "");
  return cleaned || value;
}

function missingColumnFromError(error: any) {
  const text = `${error?.message || ""} ${error?.details || ""} ${error?.hint || ""}`;

  const patterns = [
    /column ["']?([a-zA-Z0-9_]+)["']? of relation ["']?[a-zA-Z0-9_]+["']? does not exist/i,
    /Could not find the ["']?([a-zA-Z0-9_]+)["']? column/i,
    /schema cache.*["']?([a-zA-Z0-9_]+)["']?/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return match[1];
  }

  return "";
}

function isMissingColumnError(error: any) {
  const text = `${error?.code || ""} ${error?.message || ""} ${error?.details || ""}`.toLowerCase();

  return (
    error?.code === "42703" ||
    (text.includes("column") && text.includes("does not exist")) ||
    (text.includes("could not find") && text.includes("column")) ||
    text.includes("schema cache")
  );
}

function prunePayload(payload: AnyRecord) {
  const next: AnyRecord = {};

  for (const [key, value] of Object.entries(payload)) {
    if (value === undefined || value === null) continue;
    if (typeof value === "string" && !value.trim()) continue;
    if (Array.isArray(value) && value.length === 0) continue;
    next[key] = value;
  }

  return next;
}

async function adaptiveInsert(client: any, table: string, variants: AnyRecord[]) {
  const attempts: AnyRecord[] = [];

  for (const variant of variants) {
    let payload: AnyRecord = prunePayload({ ...variant });
    const removedColumns: string[] = [];

    for (let i = 0; i < 80; i += 1) {
      const { data, error } = await client.from(table).insert(payload).select("*").single();

      attempts.push({
        table,
        ok: !error,
        code: error?.code || null,
        error: error?.message || null,
        details: error?.details || null,
        hint: error?.hint || null,
        kept_columns: Object.keys(payload),
        removed_columns: [...removedColumns],
      });

      if (!error && data) {
        return { ok: true, table, data, error: null, attempts, final_payload: payload };
      }

      if (!isMissingColumnError(error)) {
        return { ok: false, table, data: null, error, attempts, final_payload: payload };
      }

      const missing = missingColumnFromError(error);
      if (!missing || !Object.prototype.hasOwnProperty.call(payload, missing)) {
        return { ok: false, table, data: null, error, attempts, final_payload: payload };
      }

      delete payload[missing];
      removedColumns.push(missing);
    }
  }

  return {
    ok: false,
    table,
    data: null,
    error: { message: `${table} insert failed.`, code: "ADAPTIVE_INSERT_FAILED" },
    attempts,
    final_payload: null,
  };
}

function makeSummary(body: AnyRecord) {
  const supplied = field(body, "ai_summary", "ai_route_summary", "route_summary", "routing_summary");
  if (supplied) return supplied;

  const title = field(body, "title", "deal_title", "project_title") || "Deal";
  const type = field(body, "property_type", "deal_type", "asset_type") || "Residential";
  const city = field(body, "city");
  const state = field(body, "state");
  const market = [city, state].filter(Boolean).join(", ") || field(body, "market") || "Market not listed";
  const strategy = field(body, "strategy") || "Strategy not listed";
  const exit = field(body, "exit_strategy") || "Exit not listed";
  const ask = moneyLike(body, "asking_price", "price", "purchase_price");
  const arv = moneyLike(body, "arv", "arv_value", "estimated_value", "after_repair_value");
  const repairs = moneyLike(body, "repair_estimate", "repairs_needed", "estimated_repairs", "rehab_budget", "repair_budget");
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

function buildRows(body: AnyRecord, email: string) {
  const photos = Array.from(
    new Set(
      [
        ...arrayFromAny(body.photo_urls),
        ...arrayFromAny(body.photos),
        ...arrayFromAny(body.photoUrls),
        field(body, "main_photo_url", "image_url", "photo_url", "primary_photo_url"),
      ].filter(Boolean)
    )
  );

  const firstPhoto = field(body, "main_photo_url", "image_url", "photo_url", "primary_photo_url") || photos[0] || "";
  const now = new Date().toISOString();

  const title = field(body, "title", "deal_title", "project_title") || "Untitled Deal";
  const propertyType = field(body, "property_type", "deal_type", "asset_type") || "Residential";
  const city = field(body, "city");
  const state = field(body, "state") || "Georgia";

  const askingPrice = moneyLike(body, "asking_price", "price", "purchase_price");
  const arv = moneyLike(body, "arv", "arv_value", "estimated_value", "after_repair_value");
  const repairEstimate = moneyLike(body, "repair_estimate", "repairs_needed", "estimated_repairs", "rehab_budget", "repair_budget");
  const beds = field(body, "beds", "bedrooms");
  const baths = field(body, "baths", "bathrooms");
  const sqft = field(body, "sqft", "square_feet", "building_sqft");
  const dealNeeds = field(body, "deal_needs", "routing_needs", "needs", "route_context");
  const distress = field(body, "distress_signals", "seller_pressure", "pain_signals");
  const sellerSituation = field(body, "seller_situation") || distress;
  const aiSummary = makeSummary(body);
  const description = field(body, "description", "notes") || aiSummary;

  const full: AnyRecord = {
    owner_email: email,
    member_email: email,
    user_email: email,
    submitted_by: email,
    submitted_by_email: email,
    created_by_email: email,
    email,

    title,
    deal_title: title,
    project_title: title,
    headline: title,

    state,
    city,
    market: [city, state].filter(Boolean).join(", "),
    county: field(body, "county"),
    address: field(body, "address", "property_address", "location"),
    location: field(body, "location", "address", "property_address"),

    property_type: propertyType,
    deal_type: propertyType,
    asset_type: propertyType,
    strategy: field(body, "strategy", "deal_strategy"),
    exit_strategy: field(body, "exit_strategy"),

    price: askingPrice,
    asking_price: askingPrice,
    purchase_price: askingPrice,
    arv,
    arv_value: arv,
    estimated_value: arv,
    after_repair_value: arv,
    repair_estimate: repairEstimate,
    repairs_needed: repairEstimate,
    estimated_repairs: repairEstimate,
    rehab_budget: repairEstimate,
    repair_budget: repairEstimate,
    equity: moneyLike(body, "equity"),
    debt_balance: moneyLike(body, "debt_balance"),
    rent_estimate: moneyLike(body, "rent_estimate"),
    noi: moneyLike(body, "noi", "net_operating_income"),
    cap_rate: field(body, "cap_rate"),

    beds,
    baths,
    bedrooms: field(body, "bedrooms") || beds,
    bathrooms: field(body, "bathrooms") || baths,
    sqft,
    square_feet: sqft,
    building_sqft: field(body, "building_sqft") || sqft,
    lot_size: field(body, "lot_size"),
    land_acres: field(body, "land_acres", "acres"),
    acres: field(body, "acres", "land_acres"),
    units: field(body, "units"),
    year_built: field(body, "year_built", "built_year"),
    occupancy: field(body, "occupancy", "occupancy_status", "tenant_status"),
    occupancy_status: field(body, "occupancy_status", "occupancy", "tenant_status"),
    tenant_status: field(body, "tenant_status", "occupancy"),
    condition: field(body, "condition"),
    timeline: field(body, "timeline"),

    zoning: field(body, "zoning", "zoning_type"),
    zoning_type: field(body, "zoning_type", "zoning"),
    utilities: field(body, "utilities", "utility_access"),
    utility_access: field(body, "utility_access", "utilities"),
    road_frontage: field(body, "road_frontage", "frontage", "road_access"),
    frontage: field(body, "frontage", "road_frontage", "road_access"),
    road_access: field(body, "road_access", "frontage", "road_frontage"),
    parcel_id: field(body, "parcel_id"),
    topography: field(body, "topography"),
    commercial_type: field(body, "commercial_type"),

    seller_situation: sellerSituation,
    access_notes: field(body, "access_notes"),
    private_notes: field(body, "private_notes"),
    distress_signals: distress,
    seller_pressure: distress,
    pain_signals: distress,
    urgency: field(body, "urgency", "urgency_level") || "Normal",
    urgency_level: field(body, "urgency_level", "urgency") || "Normal",
    capital_needed: moneyLike(body, "capital_needed"),
    target_buyer: field(body, "target_buyer"),
    ideal_lender: field(body, "ideal_lender"),
    contractor_scope: field(body, "contractor_scope"),
    operator_scope: field(body, "operator_scope"),
    jv_structure: field(body, "jv_structure"),
    title_issue: field(body, "title_issue"),

    description,
    notes: field(body, "notes") || description,
    ai_summary: aiSummary,
    ai_route_summary: aiSummary,
    route_summary: aiSummary,
    routing_summary: aiSummary,

    photo_urls: photos,
    photos,
    main_photo_url: firstPhoto,
    image_url: firstPhoto,
    photo_url: firstPhoto,
    primary_photo_url: firstPhoto,

    status: field(body, "status") || "active",
    folder: field(body, "folder") || "Active",
    archived: false,
    deleted: false,
    in_buy_bucket: false,
    buy_bucket_count: 0,

    owner_name: field(body, "owner_name"),
    owner_phone: field(body, "owner_phone"),
    owner_contact_email: field(body, "owner_contact_email"),
    preferred_contact: field(body, "preferred_contact"),
    contact_name: field(body, "contact_name"),
    contact_phone: field(body, "contact_phone"),
    contact_email: field(body, "contact_email"),
    seller_name: field(body, "seller_name"),
    seller_phone: field(body, "seller_phone"),
    seller_email: field(body, "seller_email"),

    raw_form_snapshot: body.raw_form_snapshot && typeof body.raw_form_snapshot === "object" ? body.raw_form_snapshot : undefined,
    created_at: now,
    updated_at: now,
  };

  const core: AnyRecord = {
    owner_email: email,
    member_email: email,
    title,
    city,
    state,
    county: full.county,
    market: full.market,
    property_type: propertyType,
    deal_type: propertyType,
    strategy: full.strategy,
    price: askingPrice,
    asking_price: askingPrice,
    arv,
    repair_estimate: repairEstimate,
    beds,
    baths,
    bedrooms: full.bedrooms,
    bathrooms: full.bathrooms,
    sqft,
    building_sqft: full.building_sqft,
    year_built: full.year_built,
    occupancy: full.occupancy,
    condition: full.condition,
    distress_signals: distress,
    seller_situation: sellerSituation,
    access_notes: full.access_notes,
    private_notes: full.private_notes,
    description,
    ai_summary: aiSummary,
    photo_urls: photos,
    main_photo_url: firstPhoto,
    status: "active",
    folder: "Active",
    archived: false,
    deleted: false,
    in_buy_bucket: false,
    created_at: now,
    updated_at: now,
  };

  const minimal: AnyRecord = {
    owner_email: email,
    member_email: email,
    title,
    city,
    state,
    county: full.county,
    market: full.market,
    property_type: propertyType,
    strategy: full.strategy,
    price: askingPrice,
    asking_price: askingPrice,
    arv,
    repair_estimate: repairEstimate,
    beds,
    baths,
    sqft,
    year_built: full.year_built,
    description,
    ai_summary: aiSummary,
    photo_urls: photos,
    main_photo_url: firstPhoto,
    status: "active",
    archived: false,
    created_at: now,
  };

  return { full, core, minimal, preview: core };
}

function extractEmail(request: Request, body: AnyRecord) {
  const cookieHeader = request.headers.get("cookie") || "";

  return (
    cleanEmail(request.headers.get("x-vf-email")) ||
    cleanEmail(field(body, "owner_email", "member_email", "submitted_by", "submitted_by_email", "user_email", "email")) ||
    cleanEmail(readCookie(cookieHeader, "vf_email")) ||
    "unknown"
  );
}

function fieldCheck(data: AnyRecord) {
  return {
    title: data?.title,
    city: data?.city,
    state: data?.state,
    property_type: data?.property_type || data?.deal_type,
    strategy: data?.strategy,
    asking_price: data?.asking_price || data?.price,
    price: data?.price || data?.asking_price,
    arv: data?.arv,
    repair_estimate: data?.repair_estimate,
    beds: data?.beds || data?.bedrooms,
    baths: data?.baths || data?.bathrooms,
    bedrooms: data?.bedrooms || data?.beds,
    bathrooms: data?.bathrooms || data?.baths,
    sqft: data?.sqft || data?.square_feet || data?.building_sqft,
    square_feet: data?.square_feet || data?.sqft || data?.building_sqft,
    building_sqft: data?.building_sqft || data?.sqft || data?.square_feet,
    year_built: data?.year_built,
    occupancy: data?.occupancy || data?.tenant_status,
    condition: data?.condition,
    deal_needs: data?.deal_needs || data?.routing_needs,
    ai_summary: data?.ai_summary || data?.route_summary || data?.routing_summary,
    photo_count: Array.isArray(data?.photo_urls) ? data.photo_urls.length : 0,
  };
}

export async function GET() {
  return json({
    ok: true,
    route: "/api/deal/create",
    table: DEAL_TABLE,
    mode: "vf_deals_adaptive_safe_no_array_needs",
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
  const built = buildRows(body, email);

  if (!clean(built.preview.title)) return json({ ok: false, error: "Deal title is required." }, 400);
  if (!clean(built.preview.city)) return json({ ok: false, error: "City is required." }, 400);

  const result = await adaptiveInsert(client, DEAL_TABLE, [built.full, built.core, built.minimal]);

  if (!result.ok || !result.data) {
    const lastAttempt = result.attempts?.[result.attempts.length - 1] || null;
    const error = result.error || {};

    return json(
      {
        ok: false,
        error: "Deal could not be saved to vf_deals.",
        supabase_error: error?.message || lastAttempt?.error || "Unknown Supabase error.",
        code: error?.code || lastAttempt?.code || null,
        details: error?.details || lastAttempt?.details || null,
        hint: error?.hint || lastAttempt?.hint || null,
        attempts: result.attempts,
        payload_preview: {
          title: built.preview.title,
          city: built.preview.city,
          state: built.preview.state,
          property_type: built.preview.property_type,
          asking_price: built.preview.asking_price,
          arv: built.preview.arv,
          repair_estimate: built.preview.repair_estimate,
          beds: built.preview.beds,
          baths: built.preview.baths,
          sqft: built.preview.sqft,
          year_built: built.preview.year_built,
          strategy: built.preview.strategy,
          deal_needs: built.preview.deal_needs,
          ai_summary: built.preview.ai_summary,
          photo_count: Array.isArray(built.preview.photo_urls) ? built.preview.photo_urls.length : 0,
        },
      },
      500
    );
  }

  return json({
    ok: true,
    saved: true,
    table: DEAL_TABLE,
    id: result.data?.id || null,
    deal_id: result.data?.id || null,
    record: result.data,
    field_check: fieldCheck(result.data),
    attempts: result.attempts,
    message: "Deal saved to vf_deals with safe non-array routing fields preserved in AI summary.",
  });
}