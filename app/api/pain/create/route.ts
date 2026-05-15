import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type AnyRecord = Record<string, any>;

const PAIN_TABLES = [
  "vf_pain_submissions",
  "vf_pain_requests",
  "pain_requests",
  "vf_pain_signals",
  "pain_signals",
];

const PAYLOAD_START = "VF_PAIN_PAYLOAD_START";
const PAYLOAD_END = "VF_PAIN_PAYLOAD_END";

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
    const text = clean(value);
    if (text) return text;
  }
  return "";
}

function makeId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
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
    return value.map(clean).filter(Boolean);
  }

  if (typeof value === "string") {
    const text = value.trim();
    if (!text) return [];

    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) return parsed.map(clean).filter(Boolean);
    } catch {
      return text
        .split(/[,\n|;]/)
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }

  return [];
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

async function adaptiveInsert(client: any, table: string, variants: AnyRecord[]) {
  const attempts: AnyRecord[] = [];

  for (const variant of variants) {
    let payload: AnyRecord = { ...variant };
    const removedColumns: string[] = [];

    for (let i = 0; i < 60; i += 1) {
      const { data, error } = await client.from(table).insert(payload).select("*").single();

      attempts.push({
        table,
        ok: !error,
        error: error?.message || null,
        kept_columns: Object.keys(payload),
        removed_columns: [...removedColumns],
      });

      if (!error && data) {
        return { ok: true, table, data, error: null, attempts };
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
    table,
    data: null,
    error: attempts.find((attempt) => attempt.error)?.error || `${table} insert failed.`,
    attempts,
  };
}

async function insertIntoPainTable(client: any, variants: AnyRecord[]) {
  const allAttempts: AnyRecord[] = [];

  for (const table of PAIN_TABLES) {
    try {
      const result = await adaptiveInsert(client, table, variants);
      allAttempts.push(...(result.attempts || []));

      if (result.ok) return { ...result, allAttempts };
    } catch (error: any) {
      allAttempts.push({ table, ok: false, error: error?.message || String(error) });
    }
  }

  return {
    ok: false,
    table: "",
    data: null,
    error: "Could not save Pain record into any known pain table.",
    allAttempts,
  };
}

function assetSpecific(body: AnyRecord) {
  return body.asset_specific && typeof body.asset_specific === "object"
    ? (body.asset_specific as AnyRecord)
    : {};
}

function buildAssetClass(body: AnyRecord) {
  const raw = first(body.asset_type, body.property_type, body.asset_class, body.pain_type, body.problem_type);
  const lower = raw.toLowerCase();

  if (lower.includes("multi")) return "Multifamily";
  if (lower.includes("commercial")) return "Commercial";
  if (lower.includes("land") || lower.includes("acre")) return "Land";
  if (lower.includes("residential") || lower.includes("house") || lower.includes("single")) return "Residential";

  return raw || "Not listed";
}

function buildBottleneck(body: AnyRecord) {
  const text = [
    body.help_requested,
    body.requested_help,
    body.routing_needs,
    body.needs,
    body.notes,
    body.description,
    body.pain_type,
    body.problem_type,
    body.distress_signals,
    body.capital_needed,
    body.repairs_needed,
    body.repair_scope,
  ]
    .map(clean)
    .join(" ")
    .toLowerCase();

  if (text.includes("capital") || text.includes("fund") || text.includes("lender") || text.includes("gap")) return "Capital / Funding Gap";
  if (text.includes("contractor") || text.includes("repair") || text.includes("roof") || text.includes("construction")) return "Contractor / Execution Gap";
  if (text.includes("buyer") || text.includes("sell") || text.includes("exit") || text.includes("disposition")) return "Buyer / Exit Gap";
  if (text.includes("tenant") || text.includes("occupancy")) return "Tenant / Occupancy Issue";
  if (text.includes("permit") || text.includes("city") || text.includes("code")) return "Permit / City Issue";
  if (text.includes("partner") || text.includes("jv")) return "Partner / Operator Gap";

  return "Owner Review Needed";
}

function buildFastestPath(bottleneck: string) {
  if (bottleneck.includes("Capital")) return "Verify the numbers, confirm the exact funding gap, then route to private lender or JV capital.";
  if (bottleneck.includes("Contractor")) return "Confirm scope/photos, price the repair work, then route to contractor or operator.";
  if (bottleneck.includes("Buyer")) return "Package the asset facts, confirm seller timeline, then route to qualified buyer.";
  if (bottleneck.includes("Tenant")) return "Clarify occupancy, lease, access, and legal constraints before routing.";
  if (bottleneck.includes("Permit")) return "Identify municipality, permit/code issue, timeline, then route to local operator.";
  if (bottleneck.includes("Partner")) return "Define role, capital, control, and profit split before introduction.";

  return "Clarify missing details, then route to the best operator type.";
}

function buildWhoShouldSee(body: AnyRecord) {
  const text = [
    body.help_requested,
    body.requested_help,
    body.routing_needs,
    body.needs,
    body.notes,
    body.description,
    body.pain_type,
    body.problem_type,
    body.distress_signals,
    body.capital_needed,
    body.repairs_needed,
    body.repair_scope,
  ]
    .map(clean)
    .join(" ")
    .toLowerCase();

  const stack: string[] = [];

  if (text.includes("buyer") || text.includes("sell") || text.includes("exit") || text.includes("fast close")) stack.push("Buyer");
  if (text.includes("capital") || text.includes("fund") || text.includes("lender") || text.includes("gap")) stack.push("Lender");
  if (text.includes("contractor") || text.includes("repair") || text.includes("roof") || text.includes("construction")) stack.push("Contractor");
  if (text.includes("jv") || text.includes("partner") || text.includes("operator")) stack.push("Operator / JV Partner");
  if (text.includes("permit") || text.includes("city") || text.includes("tenant") || text.includes("code")) stack.push("Local Operator");
  if (text.includes("attorney") || text.includes("probate") || text.includes("title")) stack.push("Attorney / Title");

  if (!stack.length) stack.push("Owner Review", "Operator", "Buyer");

  return Array.from(new Set(stack));
}

function buildRows(body: AnyRecord, email: string, baseUrl: string) {
  const now = new Date().toISOString();
  const a = assetSpecific(body);

  const painId = first(body.pain_id, body.id, body.item_id) || makeId("pain");
  const signalId = first(body.signal_id, body.signalId) || `pain_signal_${painId}`;
  const title = first(body.title, body.pain_title, body.problem_title, body.headline, "Pain Request");

  const photoUrls = Array.from(
    new Set([
      ...arrayFromAny(body.photo_urls),
      ...arrayFromAny(body.photoUrls),
      ...arrayFromAny(body.photos),
      ...arrayFromAny(body.files),
      ...arrayFromAny(body.uploads),
    ])
  ).filter((url) => clean(url).startsWith("http"));

  const mainPhoto = first(body.main_photo_url, body.image_url, body.photo_url, photoUrls[0]);

  const assetClass = buildAssetClass(body);
  const problemType = first(body.problem_type, body.pain_type, body.asset_type, body.property_type, assetClass);
  const bottleneck = buildBottleneck(body);
  const fastestPath = buildFastestPath(bottleneck);
  const whoShouldSee = buildWhoShouldSee(body);
  const city = first(body.city);
  const state = first(body.state, body.operating_state);
  const market = [city, state].filter(Boolean).join(", ") || first(body.market, body.location);

  const directLinks = {
    pain_room: `${baseUrl}/pain-room/${encodeURIComponent(painId)}`,
    pain_feed: `${baseUrl}/pain-feed`,
    dashboard: `${baseUrl}/dashboard`,
  };

  const canonical: AnyRecord = {
    pain_id: painId,
    item_id: painId,
    request_id: painId,
    signal_id: signalId,
    canonical_event_id: signalId,

    owner_email: email,
    member_email: email,
    user_email: email,
    submitted_by: email,
    submitted_by_email: email,
    email,

    owner_name: first(body.owner_name, body.contact_name, body.seller_name, body.source_name),
    owner_phone: first(body.owner_phone, body.contact_phone, body.seller_phone, body.source_phone, body.phone),
    owner_contact_email: first(body.owner_contact_email, body.contact_email, body.seller_email, body.source_email),
    contact_name: first(body.contact_name, body.owner_name, body.seller_name, body.source_name),
    contact_phone: first(body.contact_phone, body.owner_phone, body.seller_phone, body.source_phone, body.phone),
    contact_email: first(body.contact_email, body.owner_contact_email, body.seller_email, body.source_email),
    preferred_contact: first(body.preferred_contact, body.best_contact_method, body.contact_method),
    contact_notes: first(body.contact_notes, body.seller_contact_notes, body.source_notes),
    seller_name: first(body.seller_name, body.owner_name, body.contact_name),
    seller_phone: first(body.seller_phone, body.owner_phone, body.contact_phone),
    seller_email: first(body.seller_email, body.owner_contact_email, body.contact_email),

    title,
    pain_title: title,
    problem_title: title,
    headline: title,

    pain_type: first(body.pain_type, problemType),
    problem_type: problemType,
    asset_type: first(body.asset_type, body.property_type, assetClass),
    asset_class: assetClass,
    property_type: first(body.property_type, body.asset_type, assetClass),

    city,
    state,
    county: first(body.county, body.county_name, body.market_county),
    county_name: first(body.county_name, body.county, body.market_county),
    market_county: first(body.market_county, body.county, body.county_name),
    operating_state: first(body.operating_state, body.state),
    market,
    area: first(body.area, body.submarket),
    address: first(body.address, body.property_address, body.location),
    location: first(body.location, body.address, body.property_address),
    confidentiality: first(body.confidentiality),

    urgency: first(body.urgency, body.urgency_level, body.priority),
    urgency_level: first(body.urgency_level, body.urgency, body.priority),
    priority: first(body.priority, body.urgency, body.urgency_level, "new"),
    status: "new",
    pain_status: "new",

    help_requested: first(body.help_requested, body.requested_help, body.routing_needs, body.needs),
    requested_help: first(body.requested_help, body.help_requested, body.routing_needs, body.needs),
    routing_needs: first(body.routing_needs, body.needs, body.help_requested, body.requested_help),
    needs: first(body.needs, body.routing_needs, body.help_requested, body.requested_help),

    notes: first(body.notes, body.note, body.description, body.message),
    note: first(body.note, body.notes, body.description, body.message),
    message: first(body.message, body.notes, body.description),
    description: first(body.problem_description, body.pain_description, body.description, body.notes, body.note, body.message),
    problem_description: first(body.problem_description, body.description, body.notes, body.note, body.message),
    pain_description: first(body.pain_description, body.description, body.notes, body.note, body.message),

    asking_price: first(body.asking_price, body.price, body.target_price),
    price: first(body.price, body.asking_price, body.target_price),
    target_price: first(body.target_price, body.asking_price, body.price),
    arv: first(body.arv, body.arv_value, body.estimated_value, body.property_value),
    arv_value: first(body.arv_value, body.arv, body.estimated_value, body.property_value),
    estimated_value: first(body.estimated_value, body.arv_value, body.arv, body.property_value),
    repairs_needed: first(body.repairs_needed, body.repair_estimate, body.estimated_repairs, body.repair_budget, body.repair_scope, a.repair_scope),
    repair_estimate: first(body.repair_estimate, body.repairs_needed, body.estimated_repairs, body.repair_budget, body.repair_scope, a.repair_scope),
    repair_scope: first(body.repair_scope, body.repairs_needed, body.repair_estimate, a.repair_scope),
    capital_needed: first(body.capital_needed, body.funding_needed, body.gap_amount),
    funding_needed: first(body.funding_needed, body.capital_needed, body.gap_amount),
    gap_amount: first(body.gap_amount, body.capital_needed, body.funding_needed),

    beds: first(body.beds, body.bedrooms, a.beds),
    bedrooms: first(body.bedrooms, body.beds, a.beds),
    baths: first(body.baths, body.bathrooms, a.baths),
    bathrooms: first(body.bathrooms, body.baths, a.baths),
    sqft: first(body.sqft, body.square_feet, body.building_sqft, a.sqft, a.units_or_sqft),
    square_feet: first(body.square_feet, body.sqft, body.building_sqft, a.sqft, a.units_or_sqft),
    building_sqft: first(body.building_sqft, body.square_feet, body.sqft, a.sqft, a.units_or_sqft),
    units_or_sqft: first(body.units_or_sqft, a.units_or_sqft),
    acres: first(body.acres, body.land_acres, a.acres),
    land_acres: first(body.land_acres, body.acres, a.acres),
    year_built: first(body.year_built, a.year_built),
    occupancy: first(body.occupancy, body.tenant_status, body.vacancy_status, a.occupancy, a.tenant_status),
    tenant_status: first(body.tenant_status, a.tenant_status, body.occupancy),
    zoning: first(body.zoning, body.land_use, a.zoning),
    land_use: first(body.land_use, body.zoning, a.zoning),
    utilities: first(body.utilities, a.utilities),
    road_access: first(body.road_access, a.road_access),
    access_status: first(body.access_status, a.access_status),
    access_notes: first(body.access_notes, body.access_status, a.access_status),
    timeline: first(body.timeline, body.deadline, body.desired_timeline),
    deadline: first(body.deadline, body.timeline, body.desired_timeline),
    desired_timeline: first(body.desired_timeline, body.timeline, body.deadline),
    owner_goal: first(body.owner_goal, body.goal, body.desired_outcome, body.exit_strategy, body.strategy, body.help_requested),
    exit_strategy: first(body.exit_strategy, body.strategy, a.exit_strategy),
    strategy: first(body.strategy, body.exit_strategy, a.exit_strategy),

    commercial_property_type: first(body.commercial_property_type, a.commercial_property_type),
    noi: first(body.noi, body.noi_or_rent, a.noi_or_rent),
    rent: first(body.rent, body.noi_or_rent, a.noi_or_rent),
    monthly_rent: first(body.monthly_rent, body.noi_or_rent, a.noi_or_rent),
    cap_rate: first(body.cap_rate, a.cap_rate),
    lease_status: first(body.lease_status, a.lease_status),
    parking_access: first(body.parking_access, a.parking_access),
    entitlement_status: first(body.entitlement_status, a.entitlement_status),
    topography: first(body.topography, a.topography),
    frontage: first(body.frontage, a.frontage),

    primary_bottleneck: bottleneck,
    fastest_path: fastestPath,
    who_should_see: whoShouldSee,
    suggested_resolution_stack: whoShouldSee,
    asset_specific: a,

    image_url: mainPhoto,
    photo_url: mainPhoto,
    main_photo_url: mainPhoto,
    primary_photo_url: mainPhoto,
    photo_urls: photoUrls,
    photos: photoUrls.map((url) => ({ url })),
    files: photoUrls.map((url) => ({ url })),
    uploads: photoUrls.map((url) => ({ url })),
    photo_upload_warning: first(body.photo_upload_warning),
    photo_upload_failed_count: first(body.photo_upload_failed_count),

    direct_links: directLinks,
    archived: false,
    deleted: false,
    created_at: now,
    updated_at: now,
  };

  const summaryParts = [
    `Pain: ${title}`,
    `Type: ${canonical.problem_type}`,
    `Asset: ${canonical.asset_class}`,
    `Market: ${canonical.market || "Market not listed"}`,
    `Urgency: ${canonical.urgency || "Not listed"}`,
    canonical.help_requested ? `Help Needed: ${canonical.help_requested}` : "",
    canonical.asking_price ? `Asking/Target: ${canonical.asking_price}` : "",
    canonical.arv_value || canonical.arv ? `ARV/Value: ${canonical.arv_value || canonical.arv}` : "",
    canonical.repairs_needed ? `Repairs/Scope: ${canonical.repairs_needed}` : "",
    canonical.capital_needed ? `Capital Needed: ${canonical.capital_needed}` : "",
    canonical.timeline ? `Timeline: ${canonical.timeline}` : "",
    canonical.notes ? `Details: ${canonical.notes}` : canonical.description ? `Details: ${canonical.description}` : "",
    `Primary Bottleneck: ${bottleneck}`,
    `Fastest Path: ${fastestPath}`,
    `Who Should See This: ${whoShouldSee.join(", ")}`,
  ].filter(Boolean);

  const summary = summaryParts.join(" | ");

  canonical.summary = summary;
  canonical.ai_summary = summary;
  canonical.route_summary = summary;
  canonical.ai_route_summary = summary;
  canonical.routing_summary = summary;
  canonical.ai_problem_summary = summary;
  canonical.description = canonical.description || summary;
  canonical.problem_description = canonical.problem_description || summary;
  canonical.pain_description = canonical.pain_description || summary;
  canonical.notes = canonical.notes || summary;

  const embeddedPayload = `${PAYLOAD_START}\n${JSON.stringify(canonical)}\n${PAYLOAD_END}`;

  const metadata: AnyRecord = {
    ...body,
    ...canonical,
    canonical_kind: "pain",
    source: "pain_payload_hard_fix",
    source_table: PAIN_TABLES[0],
  };

  const full: AnyRecord = {
    id: painId,
    ...canonical,
    metadata,
    summary: `${summary}\n\n${embeddedPayload}`,
    description: `${canonical.description}\n\n${embeddedPayload}`,
    notes: `${canonical.notes}\n\n${embeddedPayload}`,
  };

  const core: AnyRecord = {
    pain_id: painId,
    item_id: painId,
    signal_id: signalId,
    owner_email: email,
    member_email: email,
    user_email: email,
    title,
    pain_title: title,
    description: `${canonical.description}\n\n${embeddedPayload}`,
    summary: `${summary}\n\n${embeddedPayload}`,
    ai_summary: `${summary}\n\n${embeddedPayload}`,
    status: "new",
    pain_status: "new",
    pain_type: canonical.pain_type,
    problem_type: canonical.problem_type,
    asset_type: canonical.asset_type,
    asset_class: canonical.asset_class,
    urgency: canonical.urgency,
    urgency_level: canonical.urgency_level,
    requested_help: canonical.requested_help,
    help_requested: canonical.help_requested,
    city,
    state,
    county: canonical.county,
    county_name: canonical.county_name,
    market_county: canonical.market_county,
    market,
    image_url: mainPhoto,
    photo_url: mainPhoto,
    main_photo_url: mainPhoto,
    photo_urls: photoUrls,
    photos: photoUrls.map((url) => ({ url })),
    metadata,
    created_at: now,
    updated_at: now,
  };

  const minimal: AnyRecord = {
    pain_id: painId,
    item_id: painId,
    signal_id: signalId,
    owner_email: email,
    member_email: email,
    title,
    summary: `${summary}\n\n${embeddedPayload}`,
    ai_summary: `${summary}\n\n${embeddedPayload}`,
    description: `${canonical.description}\n\n${embeddedPayload}`,
    status: "new",
    metadata,
    created_at: now,
    updated_at: now,
  };

  return { painId, signalId, directLinks, full, core, minimal };
}

export async function GET() {
  return json({
    ok: true,
    route: "/api/pain/create",
    mode: "payload_hard_fix",
    writes_to: PAIN_TABLES,
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
  const url = new URL(request.url);
  const baseUrl = `${url.protocol}//${url.host}`;

  const email =
    cleanEmail(request.headers.get("x-vf-email")) ||
    cleanEmail(first(body.owner_email, body.member_email, body.user_email, body.email, body.submitted_by, body.submitted_by_email)) ||
    cleanEmail(readCookie(cookieHeader, "vf_email")) ||
    "unknown";

  const title = first(body.title, body.pain_title, body.problem_title, body.headline);

  if (!title) {
    return json({ ok: false, error: "Pain title is required." }, 400);
  }

  const built = buildRows(body, email, baseUrl);
  const result = await insertIntoPainTable(client, [built.full, built.core, built.minimal]);

  if (!result.ok || !result.data) {
    return json(
      {
        ok: false,
        error: "Pain could not be saved.",
        supabase_error: result.error,
        attempts: result.allAttempts,
      },
      500
    );
  }

  const saved = result.data;
  const savedId = clean(saved.id || saved.pain_id || saved.item_id || built.painId);

  const directLinks = {
    pain_room: `${baseUrl}/pain-room/${encodeURIComponent(savedId)}`,
    pain_feed: `${baseUrl}/pain-feed`,
    dashboard: `${baseUrl}/dashboard`,
  };

  return json({
    ok: true,
    saved: true,
    table: result.table,
    id: savedId,
    pain_id: savedId,
    item_id: savedId,
    signal_id: built.signalId,
    direct_links: directLinks,
    saved_to: {
      pain_record: true,
      pain_room: true,
      pain_feed: true,
    },
    record: saved,
    message: "Pain saved to Pain Room.",
  });
}