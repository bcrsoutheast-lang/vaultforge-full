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

function cleanLower(value: unknown) {
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

function slug(value: unknown) {
  return clean(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
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

function makeId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function field(body: AnyRecord, ...keys: string[]) {
  const metadata = body && typeof body.metadata === "object" && body.metadata ? body.metadata : {};
  const raw = body && typeof body.raw_form_snapshot === "object" && body.raw_form_snapshot ? body.raw_form_snapshot : {};
  const values: unknown[] = [];

  for (const key of keys) {
    values.push(body[key]);
    values.push(metadata[key]);
    values.push(raw[key]);
  }

  return first(...values);
}

function makeDirectLinks(baseUrl: string, dealId: string, signalId: string, routingId: string, activityId: string) {
  const base = baseUrl.replace(/\/$/, "");

  return {
    deal_detail: `${base}/deal/detail?id=${encodeURIComponent(dealId)}`,
    projects: `${base}/projects`,
    signal_room: `${base}/signals/${encodeURIComponent(signalId)}`,
    routing_room: `${base}/routing-room/${encodeURIComponent(routingId || signalId)}`,
    activity_room: `${base}/activity/deal/${encodeURIComponent(activityId)}`,
    alerts: `${base}/alerts`,
    routing_inbox: `${base}/routing-inbox`,
    dashboard: `${base}/dashboard`,
  };
}

function buildSummary(body: AnyRecord) {
  const supplied = field(body, "ai_route_summary", "route_summary", "routing_summary");
  if (supplied) return supplied;

  const title = field(body, "title", "deal_title", "project_title") || "Deal";
  const type = field(body, "property_type", "deal_type", "asset_type") || "Deal";
  const city = field(body, "city");
  const state = field(body, "state");
  const strategy = field(body, "strategy", "exit_strategy", "deal_strategy") || "Strategy not listed";
  const exit = field(body, "exit_strategy", "strategy") || "Exit not listed";
  const needs = field(body, "routing_needs", "deal_needs", "needs", "route_context");
  const signals = field(body, "distress_signals", "seller_pressure", "pain_signals");
  const ask = field(body, "asking_price", "price", "ask", "purchase_price");
  const arv = field(body, "arv", "arv_value", "estimated_value", "after_repair_value");
  const repairs = field(body, "repair_estimate", "repairs_needed", "estimated_repairs", "rehab_budget", "repair_budget");

  return [
    `Deal: ${title}`,
    `Type: ${type}`,
    `Market: ${[city, state].filter(Boolean).join(", ") || "Market not listed"}`,
    `Strategy: ${strategy}`,
    `Exit: ${exit}`,
    ask ? `Ask: ${ask}` : "",
    arv ? `ARV: ${arv}` : "",
    repairs ? `Repairs: ${repairs}` : "",
    needs ? `Needs: ${needs}` : "",
    signals ? `Signals: ${signals}` : "",
  ]
    .filter(Boolean)
    .join(" | ");
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

async function adaptiveInsert(client: any, table: string, payloads: AnyRecord[]) {
  const attempts: AnyRecord[] = [];

  for (const variant of payloads) {
    let payload = { ...variant };
    const removedColumns: string[] = [];

    for (let i = 0; i < 60; i += 1) {
      const { data, error } = await client.from(table).insert(payload).select("*").single();

      attempts.push({
        ok: !error,
        error: error?.message || null,
        removed_columns: [...removedColumns],
        keys: Object.keys(payload),
      });

      if (!error && data) {
        return { ok: true, data, attempts, removedColumns };
      }

      if (!isMissingColumnError(error)) break;

      const missing = missingColumnFromError(error);
      if (!missing || !Object.prototype.hasOwnProperty.call(payload, missing)) break;

      delete payload[missing];
      removedColumns.push(missing);
    }
  }

  return {
    ok: false,
    data: null,
    attempts,
    error: attempts.find((attempt) => attempt.error)?.error || "Insert failed.",
  };
}

function buildPayload(body: AnyRecord, email: string, signalId: string, routingId: string, activityId: string, directLinks: AnyRecord) {
  const photos = Array.from(
    new Set([
      ...arrayFromAny(body.photo_urls),
      ...arrayFromAny(body.photos),
      ...arrayFromAny(body.photoUrls),
      field(body, "main_photo_url", "image_url", "photo_url", "primary_photo_url"),
    ].filter(Boolean))
  );

  const firstPhoto = field(body, "main_photo_url", "image_url", "photo_url", "primary_photo_url") || photos[0] || "";
  const title = field(body, "title", "deal_title", "project_title", "name") || "Untitled Deal";
  const type = field(body, "property_type", "deal_type", "asset_type") || "Residential";
  const city = field(body, "city") || "Unknown City";
  const state = field(body, "state") || "Unknown State";
  const market = [city, state].filter(Boolean).join(", ");
  const address = field(body, "address", "property_address", "location");
  const ask = field(body, "asking_price", "price", "ask", "purchase_price");
  const arv = field(body, "arv", "arv_value", "estimated_value", "after_repair_value");
  const repairs = field(body, "repair_estimate", "repairs_needed", "estimated_repairs", "rehab_budget", "repair_budget");
  const routeSummary = buildSummary(body);
  const routingNeeds = field(body, "routing_needs", "deal_needs", "needs", "route_context");
  const distress = field(body, "distress_signals", "seller_pressure", "pain_signals");
  const sellerSituation = field(body, "seller_situation") || [field(body, "access_notes", "private_notes"), distress].filter(Boolean).join(" | ");
  const now = new Date().toISOString();
  const canonicalProjectKey = [
    "deal",
    slug(title),
    slug(market),
    slug(email),
    slug(address || firstPhoto.split("?")[0].split("/").slice(-2).join("-")),
    slug(ask || arv),
  ]
    .filter(Boolean)
    .join("|");

  const canonical: AnyRecord = {
    owner_email: email,
    member_email: email,
    submitted_by: email,
    submitted_by_email: email,
    user_email: email,
    created_by_email: email,

    title,
    deal_title: title,
    project_title: title,
    description: field(body, "description", "notes") || routeSummary,
    notes: field(body, "notes", "description") || routeSummary,
    status: "active",

    property_type: type,
    deal_type: type,
    asset_type: type,

    strategy: field(body, "strategy", "deal_strategy"),
    deal_strategy: field(body, "deal_strategy", "strategy"),
    exit_strategy: field(body, "exit_strategy", "strategy"),

    city,
    state,
    market,
    address,
    property_address: address,
    location: address,

    asking_price: ask,
    price: ask,
    ask,
    purchase_price: ask,

    arv,
    arv_value: arv,
    estimated_value: arv,
    after_repair_value: arv,

    repair_estimate: repairs,
    repairs_needed: repairs,
    estimated_repairs: repairs,
    rehab_budget: repairs,
    repair_budget: repairs,

    beds: field(body, "beds", "bedrooms"),
    bedrooms: field(body, "bedrooms", "beds"),
    baths: field(body, "baths", "bathrooms"),
    bathrooms: field(body, "bathrooms", "baths"),
    square_feet: field(body, "square_feet", "sqft", "building_sqft"),
    sqft: field(body, "sqft", "square_feet", "building_sqft"),
    building_sqft: field(body, "building_sqft", "square_feet", "sqft"),
    year_built: field(body, "year_built", "built_year"),
    built_year: field(body, "built_year", "year_built"),
    occupancy: field(body, "occupancy", "occupancy_status", "tenant_status"),
    occupancy_status: field(body, "occupancy_status", "occupancy", "tenant_status"),
    tenant_status: field(body, "tenant_status", "occupancy", "occupancy_status"),
    zoning: field(body, "zoning", "zoning_type"),
    zoning_type: field(body, "zoning_type", "zoning"),
    acres: field(body, "acres", "land_acres"),
    land_acres: field(body, "land_acres", "acres"),
    utilities: field(body, "utilities", "utility_access", "access_notes"),
    utility_access: field(body, "utility_access", "utilities", "access_notes"),
    road_access: field(body, "road_access", "access", "frontage", "road_frontage"),
    access: field(body, "access", "road_access", "frontage", "road_frontage"),
    noi: field(body, "noi", "net_operating_income"),
    net_operating_income: field(body, "net_operating_income", "noi"),
    cap_rate: field(body, "cap_rate"),

    routing_needs: routingNeeds,
    deal_needs: field(body, "deal_needs") || routingNeeds,
    needs: field(body, "needs") || routingNeeds,
    route_context: field(body, "route_context") || routingNeeds,
    distress_signals: distress,
    seller_pressure: field(body, "seller_pressure") || distress,
    pain_signals: field(body, "pain_signals") || distress,
    seller_situation: sellerSituation,
    access_notes: field(body, "access_notes", "private_notes"),
    private_notes: field(body, "private_notes", "access_notes"),

    urgency: field(body, "urgency", "urgency_level"),
    urgency_level: field(body, "urgency_level", "urgency"),

    target_buyer: field(body, "target_buyer"),
    capital_needed: field(body, "capital_needed"),
    ideal_lender: field(body, "ideal_lender"),
    contractor_scope: field(body, "contractor_scope"),
    operator_scope: field(body, "operator_scope"),
    jv_structure: field(body, "jv_structure"),
    title_issue: field(body, "title_issue"),

    ai_route_summary: routeSummary,
    route_summary: routeSummary,
    routing_summary: routeSummary,

    signal_id: signalId,
    routing_id: routingId,
    activity_id: activityId,
    canonical_event_id: signalId,
    canonical_project_key: canonicalProjectKey,

    image_url: firstPhoto,
    photo_url: firstPhoto,
    main_photo_url: firstPhoto,
    primary_photo_url: firstPhoto,
    photo_urls: photos,
    photos,

    direct_links: directLinks,
    archived: false,
    deleted: false,
    created_at: now,
    updated_at: now,
  };

  const metadata = {
    ...body,
    ...(typeof body.metadata === "object" && body.metadata ? body.metadata : {}),
    ...canonical,
    raw_form_snapshot: typeof body.raw_form_snapshot === "object" ? body.raw_form_snapshot : {},
    canonical_kind: "deal",
    source: "deal_create_full_field_capture",
    source_table: DEAL_TABLE,
  };

  return {
    full: {
      ...canonical,
      metadata,
    },
    core: {
      owner_email: email,
      member_email: email,
      submitted_by: email,
      user_email: email,
      title,
      property_type: type,
      city,
      state,
      market,
      status: "active",
      image_url: firstPhoto,
      main_photo_url: firstPhoto,
      photo_urls: photos,
      photos,
      canonical_event_id: signalId,
      canonical_project_key: canonicalProjectKey,
      metadata,
      created_at: now,
      updated_at: now,
    },
    metadata,
    photos,
    summary: routeSummary,
    canonical,
  };
}

export async function GET() {
  return json({
    ok: true,
    route: "/api/deal/create",
    table: DEAL_TABLE,
    message: "Deal create route is live.",
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

  const cookieHeader = request.headers.get("cookie") || "";
  const cookieMatch = cookieHeader.match(/vf_email=([^;]+)/);
  const cookieEmail = cookieMatch?.[1] ? decodeURIComponent(cookieMatch[1]) : "";

  const email =
    cleanLower(request.headers.get("x-vf-email")) ||
    cleanLower(field(body, "owner_email", "member_email", "submitted_by", "submitted_by_email", "user_email", "email")) ||
    cleanLower(cookieEmail) ||
    "unknown";

  const title = field(body, "title", "deal_title", "project_title");
  const city = field(body, "city");

  if (!title) return json({ ok: false, error: "Deal title is required." }, 400);
  if (!city) return json({ ok: false, error: "City is required." }, 400);

  const url = new URL(request.url);
  const baseUrl = `${url.protocol}//${url.host}`;
  const signalId = field(body, "signal_id", "signalId", "canonical_event_id") || makeId("deal_signal");
  const routingId = field(body, "routing_id", "routingId") || signalId;
  const activityId = field(body, "activity_id", "activityId") || makeId("deal_activity");
  const pendingLinks = makeDirectLinks(baseUrl, "pending", signalId, routingId, activityId);
  const built = buildPayload(body, email, signalId, routingId, activityId, pendingLinks);

  const inserted = await adaptiveInsert(client, DEAL_TABLE, [built.full, built.core]);

  if (!inserted.ok || !inserted.data) {
    return json(
      {
        ok: false,
        error: "Deal could not be saved.",
        table: DEAL_TABLE,
        supabase_error: inserted.error,
        attempts: inserted.attempts,
      },
      500
    );
  }

  const saved = inserted.data;
  const dealId = clean(saved.id) || clean(saved.deal_id) || signalId;
  const directLinks = makeDirectLinks(baseUrl, dealId, signalId, routingId, activityId);

  return json({
    ok: true,
    saved: true,
    table: DEAL_TABLE,
    id: dealId,
    deal_id: dealId,
    signal_id: signalId,
    routing_id: routingId,
    activity_id: activityId,
    canonical_event_id: signalId,
    canonical_project_key: built.canonical.canonical_project_key,
    photos_saved: built.photos.length,
    direct_links: directLinks,
    record: saved,
    field_check: {
      title: built.canonical.title,
      city: built.canonical.city,
      state: built.canonical.state,
      asking_price: built.canonical.asking_price,
      arv: built.canonical.arv,
      repair_estimate: built.canonical.repair_estimate,
      beds: built.canonical.beds,
      baths: built.canonical.baths,
      square_feet: built.canonical.square_feet,
      year_built: built.canonical.year_built,
      routing_needs: built.canonical.routing_needs,
      distress_signals: built.canonical.distress_signals,
    },
    message: "Deal saved with full field capture.",
  });
}
