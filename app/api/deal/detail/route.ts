import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const TABLE = "vf_deals";

type Row = Record<string, any>;

function supabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
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
      detectSessionInUrl: false,
    },
  });
}

function clean(value: unknown) {
  return String(value || "").trim();
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

function json(data: Record<string, any>, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}

function metadataOf(row: Row | null | undefined) {
  return row && typeof row.metadata === "object" && row.metadata ? row.metadata : {};
}

function field(row: Row, ...keys: string[]) {
  const m = metadataOf(row);
  const values: unknown[] = [];

  for (const key of keys) {
    values.push(row[key]);
    values.push(m[key]);
  }

  return first(...values);
}

function parseArray(value: unknown): string[] {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value
      .map((item: any) => {
        if (typeof item === "string") return clean(item);
        if (item && typeof item === "object") {
          return clean(
            item.url ||
              item.publicUrl ||
              item.public_url ||
              item.photo_url ||
              item.image_url ||
              item.main_photo_url
          );
        }
        return "";
      })
      .filter(Boolean);
  }

  const text = clean(value);
  if (!text) return [];

  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return parseArray(parsed);
  } catch {
    // Continue.
  }

  return text
    .split(/[,\n|;]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function photoUrls(row: Row) {
  const m = metadataOf(row);

  const values = [
    row.main_photo_url,
    row.image_url,
    row.photo_url,
    row.primary_photo_url,
    m.main_photo_url,
    m.image_url,
    m.photo_url,
    m.primary_photo_url,
    ...parseArray(row.photo_urls),
    ...parseArray(row.photos),
    ...parseArray(m.photo_urls),
    ...parseArray(m.photos),
  ];

  return Array.from(new Set(values.map(clean).filter((url) => url.startsWith("http"))));
}

function normalizeDeal(row: Row) {
  const photos = photoUrls(row);

  const id = field(row, "id", "deal_id", "project_id", "item_id");
  const signalId = field(row, "signal_id", "signalId", "canonical_event_id");
  const routingId = field(row, "routing_id", "routingId") || signalId;
  const activityId = field(row, "activity_id", "activityId");

  const title = field(row, "title", "deal_title", "project_title", "headline", "name", "address") || "VaultForge Deal";
  const propertyType = field(row, "property_type", "deal_type", "asset_type") || "Deal";

  const city = field(row, "city");
  const state = field(row, "state");
  const market =
    [city, state].filter(Boolean).join(", ") ||
    field(row, "market", "location", "address", "property_address");

  const asking = field(row, "asking_price", "price", "ask", "purchase_price");
  const arv = field(row, "arv", "arv_value", "estimated_value", "value", "after_repair_value");
  const repairs = field(row, "repair_estimate", "repairs_needed", "estimated_repairs", "rehab_budget", "repair_budget");

  const strategy = field(row, "strategy", "exit_strategy", "deal_strategy");
  const exitStrategy = field(row, "exit_strategy", "strategy");

  const routingNeeds = field(row, "routing_needs", "deal_needs", "needs", "route_context");
  const distress = field(row, "distress_signals", "seller_pressure", "pain_signals");
  const sellerSituation = field(row, "seller_situation", "private_notes", "access_notes", "distress_signals", "description");

  const routeSummary = first(
    field(row, "ai_route_summary"),
    field(row, "route_summary"),
    field(row, "routing_summary"),
    field(row, "urgency_reason"),
    field(row, "routing_reason"),
    field(row, "description"),
    sellerSituation
  );

  return {
    ...metadataOf(row),
    ...row,

    id,
    deal_id: field(row, "deal_id") || id,
    item_id: field(row, "item_id") || id,
    project_id: field(row, "project_id") || id,
    related_deal_id: field(row, "related_deal_id") || id,

    signal_id: signalId,
    routing_id: routingId,
    activity_id: activityId,
    canonical_event_id: field(row, "canonical_event_id") || signalId,

    title,
    deal_title: field(row, "deal_title") || title,
    project_title: field(row, "project_title") || title,
    status: field(row, "status", "project_status", "routing_status") || "active",

    property_type: propertyType,
    deal_type: field(row, "deal_type") || propertyType,
    asset_type: field(row, "asset_type") || propertyType,

    city,
    state,
    market,
    address: field(row, "address", "property_address", "location"),
    property_address: field(row, "property_address", "address", "location"),
    location: field(row, "location", "address", "property_address"),

    asking_price: asking,
    price: field(row, "price") || asking,
    ask: field(row, "ask") || asking,
    purchase_price: field(row, "purchase_price") || asking,

    arv,
    arv_value: field(row, "arv_value") || arv,
    estimated_value: field(row, "estimated_value") || arv,
    after_repair_value: field(row, "after_repair_value") || arv,

    repair_estimate: repairs,
    repairs_needed: field(row, "repairs_needed") || repairs,
    estimated_repairs: field(row, "estimated_repairs") || repairs,
    rehab_budget: field(row, "rehab_budget") || repairs,
    repair_budget: field(row, "repair_budget") || repairs,

    strategy,
    exit_strategy: exitStrategy,
    deal_strategy: field(row, "deal_strategy") || strategy,

    beds: field(row, "beds", "bedrooms"),
    bedrooms: field(row, "bedrooms", "beds"),
    baths: field(row, "baths", "bathrooms"),
    bathrooms: field(row, "bathrooms", "baths"),
    square_feet: field(row, "square_feet", "sqft", "building_sqft"),
    sqft: field(row, "sqft", "square_feet", "building_sqft"),
    building_sqft: field(row, "building_sqft", "square_feet", "sqft"),

    year_built: field(row, "year_built", "built_year"),
    built_year: field(row, "built_year", "year_built"),

    occupancy: field(row, "occupancy", "occupancy_status", "tenant_status"),
    occupancy_status: field(row, "occupancy_status", "occupancy", "tenant_status"),
    tenant_status: field(row, "tenant_status", "occupancy", "occupancy_status"),

    zoning: field(row, "zoning", "zoning_type"),
    zoning_type: field(row, "zoning_type", "zoning"),

    acres: field(row, "acres", "land_acres"),
    land_acres: field(row, "land_acres", "acres"),

    utilities: field(row, "utilities", "utility_access", "access_notes"),
    utility_access: field(row, "utility_access", "utilities", "access_notes"),

    road_access: field(row, "road_access", "access", "access_notes"),
    access: field(row, "access", "road_access", "access_notes"),

    noi: field(row, "noi", "net_operating_income"),
    net_operating_income: field(row, "net_operating_income", "noi"),
    cap_rate: field(row, "cap_rate"),

    target_buyer: field(row, "target_buyer"),
    capital_needed: field(row, "capital_needed"),
    ideal_lender: field(row, "ideal_lender"),
    contractor_scope: field(row, "contractor_scope"),
    operator_scope: field(row, "operator_scope"),
    jv_structure: field(row, "jv_structure"),
    title_issue: field(row, "title_issue"),

    routing_needs: routingNeeds,
    deal_needs: field(row, "deal_needs") || routingNeeds,
    needs: field(row, "needs") || routingNeeds,
    route_context: field(row, "route_context") || routingNeeds,

    distress_signals: distress,
    seller_pressure: field(row, "seller_pressure") || distress,
    seller_situation: sellerSituation,
    access_notes: field(row, "access_notes", "private_notes", "seller_situation"),
    private_notes: field(row, "private_notes", "access_notes", "seller_situation"),

    description: field(row, "description", "notes") || routeSummary,
    notes: field(row, "notes", "description") || routeSummary,
    ai_route_summary: field(row, "ai_route_summary") || routeSummary,
    route_summary: field(row, "route_summary") || routeSummary,
    routing_summary: field(row, "routing_summary") || routeSummary,

    image_url: photos[0] || "",
    photo_url: photos[0] || "",
    main_photo_url: photos[0] || "",
    primary_photo_url: photos[0] || "",
    photo_urls: photos,
    photos: photos.map((url) => ({ url })),

    owner_email: field(row, "owner_email", "submitted_by", "user_email", "member_email", "email"),
    member_email: field(row, "member_email", "owner_email", "submitted_by", "user_email", "email"),
    submitted_by: field(row, "submitted_by", "owner_email", "member_email", "user_email", "email"),
    user_email: field(row, "user_email", "owner_email", "member_email", "submitted_by", "email"),

    source_table: TABLE,
    metadata: metadataOf(row),
  };
}

function matchesId(row: Row, id: string) {
  return [
    field(row, "id"),
    field(row, "deal_id"),
    field(row, "project_id"),
    field(row, "item_id"),
    field(row, "related_deal_id"),
    field(row, "signal_id"),
    field(row, "routing_id"),
    field(row, "activity_id"),
    field(row, "canonical_event_id"),
  ]
    .map(clean)
    .includes(id);
}

async function findDeal(supabase: any, id: string) {
  const columns = [
    "id",
    "deal_id",
    "project_id",
    "item_id",
    "related_deal_id",
    "signal_id",
    "routing_id",
    "activity_id",
    "canonical_event_id",
  ];

  for (const column of columns) {
    try {
      const { data, error } = await supabase
        .from(TABLE)
        .select("*")
        .eq(column, id)
        .maybeSingle();

      if (!error && data) return data;
    } catch {
      // Column may not exist.
    }
  }

  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);

    if (!error && Array.isArray(data)) {
      return data.find((row: Row) => matchesId(row, id)) || null;
    }
  } catch {
    // Fall through.
  }

  try {
    const { data, error } = await supabase.from(TABLE).select("*").limit(500);

    if (!error && Array.isArray(data)) {
      return data.find((row: Row) => matchesId(row, id)) || null;
    }
  } catch {
    // Fail below.
  }

  return null;
}

export async function GET(request: Request) {
  try {
    const id = clean(new URL(request.url).searchParams.get("id") || "");

    if (!id) {
      return json({ ok: false, error: "Missing deal id." }, 400);
    }

    const supabase = supabaseClient();
    const deal = await findDeal(supabase, id);

    if (!deal) {
      return json({ ok: false, error: "Deal not found.", id }, 404);
    }

    return json({
      ok: true,
      deal: normalizeDeal(deal),
      source: "api/deal/detail",
      table: TABLE,
    });
  } catch (error: any) {
    return json(
      {
        ok: false,
        error: "Could not load deal.",
        details: error?.message || String(error),
      },
      500
    );
  }
}
