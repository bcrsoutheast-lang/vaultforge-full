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

function firstText(body: AnyRecord, keys: string[]) {
  for (const key of keys) {
    const text = clean(body?.[key]);
    if (text) return text;
  }
  return "";
}

function arrayFromAny(value: unknown): string[] {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value.map(clean).filter(Boolean);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed.map(clean).filter(Boolean);
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

function roleFromText(text: string) {
  const lower = text.toLowerCase();

  if (lower.includes("lender") || lower.includes("capital") || lower.includes("fund")) return "Lender / Capital";
  if (lower.includes("operator") || lower.includes("jv") || lower.includes("partner")) return "Operator / JV";
  if (lower.includes("contractor") || lower.includes("repair") || lower.includes("construction")) return "Contractor";
  if (lower.includes("buyer") || lower.includes("acquisition")) return "Buyer";

  return "Owner Review";
}

function actionFromRole(role: string) {
  const lower = role.toLowerCase();

  if (lower.includes("lender") || lower.includes("capital")) return "route_to_lender";
  if (lower.includes("operator") || lower.includes("jv")) return "route_to_operator";
  if (lower.includes("contractor")) return "route_to_contractor";
  if (lower.includes("buyer")) return "route_to_buyer";

  return "needs_review";
}

function priorityFromBody(body: AnyRecord) {
  const text = [
    body.urgency_level,
    body.urgency,
    body.distress_signals,
    body.description,
    body.seller_situation,
    body.ai_route_summary,
    body.route_summary,
  ]
    .map(clean)
    .join(" ")
    .toLowerCase();

  if (
    text.includes("emergency") ||
    text.includes("urgent") ||
    text.includes("foreclosure") ||
    text.includes("deadline") ||
    text.includes("fast close")
  ) {
    return "urgent";
  }

  if (
    text.includes("needs review this week") ||
    text.includes("funding gap") ||
    text.includes("stalled") ||
    text.includes("behind")
  ) {
    return "high";
  }

  return "medium";
}

function moneyText(value: unknown) {
  return clean(value);
}

function buildDealSummary(body: AnyRecord) {
  const supplied = firstText(body, ["ai_route_summary", "route_summary", "routing_summary"]);
  if (supplied) return supplied;

  const title = firstText(body, ["title", "deal_title", "headline", "name"]) || "Deal";
  const type = firstText(body, ["property_type", "deal_type", "asset_type"]) || "Deal";
  const city = firstText(body, ["city"]);
  const state = firstText(body, ["state"]);
  const market = [city, state].filter(Boolean).join(", ") || "Market not listed";
  const strategy = firstText(body, ["strategy", "exit_strategy"]) || "Strategy not listed";
  const exit = firstText(body, ["exit_strategy", "strategy"]) || "Exit not listed";
  const ask = moneyText(firstText(body, ["asking_price", "price"]));
  const arv = moneyText(firstText(body, ["arv", "arv_value", "estimated_value"]));
  const repairs = moneyText(firstText(body, ["repair_estimate", "repairs_needed", "estimated_repairs"]));
  const needs = firstText(body, ["routing_needs", "deal_needs", "needs"]);
  const signals = firstText(body, ["distress_signals"]);
  const capital = firstText(body, ["capital_needed"]);
  const contractor = firstText(body, ["contractor_scope"]);
  const operator = firstText(body, ["operator_scope"]);
  const seller = firstText(body, ["seller_situation"]);
  const desc = firstText(body, ["description", "notes"]);

  return [
    `Deal: ${title}`,
    `Type: ${type}`,
    `Market: ${market}`,
    `Strategy: ${strategy}`,
    `Exit: ${exit}`,
    ask ? `Ask: ${ask}` : "",
    arv ? `ARV: ${arv}` : "",
    repairs ? `Repairs: ${repairs}` : "",
    needs ? `Needs: ${needs}` : "",
    signals ? `Signals: ${signals}` : "",
    capital ? `Capital: ${capital}` : "",
    contractor ? `Contractor Scope: ${contractor}` : "",
    operator ? `Operator Scope: ${operator}` : "",
    seller ? `Seller/Situation: ${seller}` : "",
    desc ? `Notes: ${desc}` : "",
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

async function adaptiveInsert(client: any, table: string, variants: AnyRecord[]) {
  const attempts: AnyRecord[] = [];

  for (const variant of variants) {
    let payload = { ...variant };
    const removed_columns: string[] = [];

    for (let i = 0; i < 24; i += 1) {
      try {
        const { data, error } = await client.from(table).insert(payload).select("*").single();

        attempts.push({
          table,
          ok: !error,
          error: error?.message || null,
          keys: Object.keys(payload),
          removed_columns: [...removed_columns],
        });

        if (!error && data) {
          return { ok: true, data, error: null, attempts, removed_columns };
        }

        if (!isMissingColumnError(error)) break;

        const missing = missingColumnFromError(error);
        if (!missing || !Object.prototype.hasOwnProperty.call(payload, missing)) break;

        delete payload[missing];
        removed_columns.push(missing);
      } catch (error: any) {
        attempts.push({
          table,
          ok: false,
          error: error?.message || String(error),
          keys: Object.keys(payload),
          removed_columns: [...removed_columns],
        });
        break;
      }
    }
  }

  return {
    ok: false,
    data: null,
    error: attempts.find((attempt) => attempt.error)?.error || `${table} insert failed.`,
    attempts,
    removed_columns: [],
  };
}

function buildDealPayloads(body: AnyRecord, email: string, signalId: string, routingId: string, activityId: string, directLinksPending: AnyRecord) {
  const photoUrls = Array.from(
    new Set([
      ...arrayFromAny(body.photo_urls),
      ...arrayFromAny(body.photoUrls),
      ...arrayFromAny(body.photos),
      ...arrayFromAny(body.files),
    ].filter(Boolean))
  );

  const firstPhoto = firstText(body, ["main_photo_url", "image_url", "photo_url"]) || photoUrls[0] || "";
  const title = firstText(body, ["title", "deal_title", "headline", "name"]) || "Untitled Deal";
  const propertyType = firstText(body, ["property_type", "deal_type", "asset_type"]) || "Deal";
  const strategy = firstText(body, ["strategy", "exit_strategy"]) || "Strategy Needed";
  const exitStrategy = firstText(body, ["exit_strategy", "strategy"]);
  const routeSummary = buildDealSummary(body);
  const routingNeeds = firstText(body, ["routing_needs", "deal_needs", "needs"]);
  const distressSignals = firstText(body, ["distress_signals"]);
  const sellerSituation = [firstText(body, ["seller_situation"]), distressSignals].filter(Boolean).join(" | ");
  const now = new Date().toISOString();

  const metadata = {
    ...body,
    canonical_kind: "deal",
    source: "deal_create_single_canonical_signal",
    source_table: DEAL_TABLE,
    owner_email: email,
    member_email: email,
    submitted_by: email,
    user_email: email,
    title,
    property_type: propertyType,
    deal_type: propertyType,
    asset_type: propertyType,
    strategy,
    exit_strategy: exitStrategy,
    asking_price: firstText(body, ["asking_price", "price"]),
    price: firstText(body, ["price", "asking_price"]),
    arv: firstText(body, ["arv", "arv_value", "estimated_value"]),
    arv_value: firstText(body, ["arv_value", "arv", "estimated_value"]),
    repair_estimate: firstText(body, ["repair_estimate", "repairs_needed", "estimated_repairs"]),
    repairs_needed: firstText(body, ["repairs_needed", "repair_estimate", "estimated_repairs"]),
    route_summary: routeSummary,
    ai_route_summary: routeSummary,
    routing_summary: routeSummary,
    routing_needs: routingNeeds,
    deal_needs: firstText(body, ["deal_needs"]) || routingNeeds,
    needs: firstText(body, ["needs"]) || routingNeeds,
    distress_signals: distressSignals,
    seller_situation: sellerSituation,
    city: firstText(body, ["city"]),
    state: firstText(body, ["state"]),
    market: [firstText(body, ["city"]), firstText(body, ["state"])].filter(Boolean).join(", "),
    address: firstText(body, ["address", "property_address", "location"]),
    photo_urls: photoUrls,
    photos: photoUrls,
    main_photo_url: firstPhoto,
    signal_id: signalId,
    routing_id: routingId,
    activity_id: activityId,
    canonical_event_id: signalId,
    direct_links: directLinksPending,
    created_at: now,
    updated_at: now,
  };

  const full = {
    owner_email: email,
    member_email: email,
    submitted_by: email,
    user_email: email,

    title,
    description: firstText(body, ["description", "notes", "seller_situation"]) || routeSummary,
    status: "active",

    property_type: propertyType,
    deal_type: propertyType,
    asset_type: propertyType,
    strategy,
    exit_strategy: exitStrategy,

    city: firstText(body, ["city"]) || "Unknown City",
    state: firstText(body, ["state"]) || "Unknown State",
    market: metadata.market,
    address: metadata.address,

    asking_price: metadata.asking_price,
    price: metadata.price,
    arv: metadata.arv,
    arv_value: metadata.arv_value,
    repair_estimate: metadata.repair_estimate,
    repairs_needed: metadata.repairs_needed,

    beds: firstText(body, ["beds", "bedrooms"]),
    bedrooms: firstText(body, ["bedrooms", "beds"]),
    baths: firstText(body, ["baths", "bathrooms"]),
    bathrooms: firstText(body, ["bathrooms", "baths"]),
    square_feet: firstText(body, ["square_feet", "sqft", "building_sqft"]),
    sqft: firstText(body, ["sqft", "square_feet", "building_sqft"]),
    building_sqft: firstText(body, ["building_sqft", "square_feet", "sqft"]),
    year_built: firstText(body, ["year_built"]),
    occupancy: firstText(body, ["occupancy"]),
    zoning: firstText(body, ["zoning"]),
    acres: firstText(body, ["acres", "land_acres"]),
    land_acres: firstText(body, ["land_acres", "acres"]),
    utilities: firstText(body, ["utilities", "access_notes"]),
    road_access: firstText(body, ["road_access", "occupancy"]),
    noi: firstText(body, ["noi"]),
    cap_rate: firstText(body, ["cap_rate"]),

    target_buyer: firstText(body, ["target_buyer"]),
    capital_needed: firstText(body, ["capital_needed"]),
    ideal_lender: firstText(body, ["ideal_lender"]),
    contractor_scope: firstText(body, ["contractor_scope"]),
    operator_scope: firstText(body, ["operator_scope"]),
    jv_structure: firstText(body, ["jv_structure"]),
    title_issue: firstText(body, ["title_issue"]),

    route_summary: routeSummary,
    ai_route_summary: routeSummary,
    routing_summary: routeSummary,
    routing_needs: routingNeeds,
    deal_needs: metadata.deal_needs,
    needs: metadata.needs,
    distress_signals: distressSignals,
    seller_situation: sellerSituation,
    access_notes: firstText(body, ["access_notes"]),
    private_notes: firstText(body, ["private_notes", "access_notes"]),

    signal_id: signalId,
    routing_id: routingId,
    activity_id: activityId,
    canonical_event_id: signalId,

    image_url: firstPhoto,
    photo_url: firstPhoto,
    main_photo_url: firstPhoto,
    photo_urls: photoUrls,
    photos: photoUrls,

    direct_links: directLinksPending,
    archived: false,
    deleted: false,
    metadata,
    created_at: now,
    updated_at: now,
  };

  const core = {
    owner_email: email,
    member_email: email,
    title,
    description: full.description,
    status: full.status,
    property_type: propertyType,
    strategy,
    city: full.city,
    state: full.state,
    address: full.address,
    asking_price: full.asking_price,
    arv: full.arv,
    repair_estimate: full.repair_estimate,
    main_photo_url: firstPhoto,
    photo_urls: photoUrls,
    route_summary: routeSummary,
    routing_needs: routingNeeds,
    distress_signals: distressSignals,
    signal_id: signalId,
    routing_id: routingId,
    metadata,
    created_at: now,
    updated_at: now,
  };

  const minimal = {
    owner_email: email,
    member_email: email,
    title,
    property_type: propertyType,
    city: full.city,
    state: full.state,
    status: full.status,
    photo_urls: photoUrls,
    main_photo_url: firstPhoto,
    metadata,
    created_at: now,
    updated_at: now,
  };

  return { full, core, minimal, metadata, photoUrls, routeSummary, propertyType, title };
}

export async function GET() {
  const client = supabaseAdmin();

  if (!client) {
    return json({ ok: false, error: "Supabase environment variables are missing." }, 500);
  }

  return json({
    ok: true,
    route: "/api/deal/create",
    writes_to: DEAL_TABLE,
    mirrors: "/api/pain/create",
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
  const url = new URL(request.url);
  const baseUrl = `${url.protocol}//${url.host}`;

  const submittedBy =
    cleanLower(request.headers.get("x-vf-email")) ||
    firstText(body, ["submitted_by", "submittedBy", "user_email", "member_email", "memberEmail", "owner_email", "email"]) ||
    cleanLower(cookieHeader.match(/vf_email=([^;]+)/)?.[1] ? decodeURIComponent(cookieHeader.match(/vf_email=([^;]+)/)?.[1] || "") : "") ||
    "unknown";

  const title = firstText(body, ["title", "deal_title", "headline", "name"]);
  const city = firstText(body, ["city"]);

  if (!title) return json({ ok: false, error: "Deal title is required." }, 400);
  if (!city) return json({ ok: false, error: "City is required." }, 400);

  const signalId = firstText(body, ["signal_id", "signalId"]) || makeId("deal_signal");
  const routingId = firstText(body, ["routing_id", "routingId"]) || signalId;
  const activityId = firstText(body, ["activity_id", "activityId"]) || makeId("deal_activity");
  const pendingLinks = makeDirectLinks(baseUrl, "pending", signalId, routingId, activityId);

  const built = buildDealPayloads(body, submittedBy, signalId, routingId, activityId, pendingLinks);
  const dealInsert = await adaptiveInsert(client, DEAL_TABLE, [built.full, built.core, built.minimal]);

  if (!dealInsert.ok || !dealInsert.data) {
    return json(
      {
        ok: false,
        error: "Deal could not be saved.",
        table: DEAL_TABLE,
        supabase_error: dealInsert.error,
        attempts: dealInsert.attempts,
      },
      500
    );
  }

  const saved = dealInsert.data || {};
  const dealId = clean(saved.id) || clean(saved.deal_id) || signalId;
  const savedLinks = makeDirectLinks(baseUrl, dealId, signalId, routingId, activityId);
  const role = roleFromText([built.routeSummary, built.full.routing_needs, built.full.distress_signals].map(clean).join(" "));
  const action = actionFromRole(role);
  const priority = priorityFromBody(body);
  const now = new Date().toISOString();

  const sharedMeta = {
    ...built.metadata,
    deal_id: dealId,
    item_id: dealId,
    signal_id: signalId,
    routing_id: routingId,
    activity_id: activityId,
    direct_links: savedLinks,
    generated_by: "deal_create_single_canonical_signal",
    canonical_event_id: signalId,
  };

  const activityInsert = await adaptiveInsert(client, "vf_activity_events", [
    {
      event_type: "deal_created",
      event_id: activityId,
      item_id: dealId,
      related_deal_id: dealId,
      deal_id: dealId,
      signal_id: signalId,
      member_email: submittedBy,
      owner_email: submittedBy,
      title: built.title,
      event_title: built.title,
      description: built.routeSummary,
      event_description: built.routeSummary,
      status: "new",
      visibility: "owner",
      source: "deal",
      metadata: sharedMeta,
      created_at: now,
      updated_at: now,
    },
    {
      event_type: "deal_created",
      event_title: built.title,
      event_description: built.routeSummary,
      member_email: submittedBy,
      metadata: sharedMeta,
    },
  ]);

  const routingInsert = await adaptiveInsert(client, "vf_routing_actions", [
    {
      action_type: "deal_routing_needed",
      action,
      routing_action: action,
      signal_id: signalId,
      alert_id: signalId,
      routing_id: routingId,
      item_id: dealId,
      deal_id: dealId,
      member_email: submittedBy,
      owner_email: submittedBy,
      title: built.title,
      note: built.routeSummary,
      notes: built.routeSummary,
      reason: built.routeSummary,
      route_summary: built.routeSummary,
      routing_summary: built.routeSummary,
      status: "new",
      routing_status: "new",
      priority,
      role_match: role,
      target_role: role,
      route_context: built.full.routing_needs || role,
      source: "deal",
      source_table: DEAL_TABLE,
      canonical_event_id: signalId,
      metadata: sharedMeta,
      created_at: now,
      updated_at: now,
    },
    {
      signal_id: signalId,
      item_id: dealId,
      title: built.title,
      note: built.routeSummary,
      action,
      priority,
      metadata: sharedMeta,
    },
  ]);

  const signalInsert = await adaptiveInsert(client, "vf_routing_signals", [
    {
      signal_id: signalId,
      routing_id: routingId,
      item_id: dealId,
      deal_id: dealId,
      member_email: submittedBy,
      owner_email: submittedBy,
      title: built.title,
      signal_type: "deal",
      type: "deal",
      status: "new",
      priority,
      market: built.full.market,
      city: built.full.city,
      state: built.full.state,
      asset_type: built.full.asset_type,
      property_type: built.full.property_type,
      note: built.routeSummary,
      notes: built.routeSummary,
      description: built.routeSummary,
      route_summary: built.routeSummary,
      routing_summary: built.routeSummary,
      ai_route_summary: built.routeSummary,
      source: "deal",
      source_table: DEAL_TABLE,
      canonical_event_id: signalId,
      metadata: sharedMeta,
      created_at: now,
      updated_at: now,
    },
    {
      signal_id: signalId,
      item_id: dealId,
      member_email: submittedBy,
      title: built.title,
      signal_type: "deal",
      status: "new",
      note: built.routeSummary,
      metadata: sharedMeta,
    },
  ]);

  return json({
    ok: true,
    saved: true,
    table: DEAL_TABLE,
    id: dealId,
    deal_id: dealId,
    signal_id: signalId,
    routing_id: routingId,
    activity_id: activityId,
    photos_saved: built.photoUrls.length,
    direct_links: savedLinks,
    saved_to: {
      deal: Boolean(dealInsert.ok),
      activity: Boolean(activityInsert.ok),
      routing_action: Boolean(routingInsert.ok),
      routing_signal: Boolean(signalInsert.ok),
    },
    secondary_errors: {
      activity: activityInsert.ok ? null : activityInsert.error,
      routing_action: routingInsert.ok ? null : routingInsert.error,
      routing_signal: signalInsert.ok ? null : signalInsert.error,
    },
    record: saved,
    message: "Deal saved and routed into VaultForge.",
  });
}
