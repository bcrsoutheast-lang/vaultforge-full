import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const DEAL_TABLE = "vf_deals";

type Row = Record<string, any>;

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
      detectSessionInUrl: false,
    },
  });
}

function clean(value: unknown) {
  return String(value || "").trim();
}

function cleanEmail(value: unknown) {
  return clean(value).toLowerCase();
}

function cleanNumber(value: unknown) {
  const text = clean(value);
  if (!text) return null;
  const n = Number(text.replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function nullable(value: unknown) {
  const text = clean(value);
  return text ? text : null;
}

function first(...values: unknown[]) {
  for (const value of values) {
    const text = clean(value);
    if (text) return text;
  }
  return "";
}

function photoArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(clean).filter(Boolean);

  const text = clean(value);
  if (!text) return [];

  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return parsed.map(clean).filter(Boolean);
  } catch {
    // Use as one URL.
  }

  return [text];
}

function removeUndefined(row: Row) {
  const cleaned: Row = {};
  for (const [key, value] of Object.entries(row)) {
    if (value !== undefined) cleaned[key] = value;
  }
  return cleaned;
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

function routingRole(body: Row) {
  const text = [
    body.routing_needs,
    body.deal_needs,
    body.needs,
    body.ai_route_summary,
    body.route_summary,
    body.description,
    body.seller_situation,
    body.distress_signals,
  ]
    .map(clean)
    .join(" ")
    .toLowerCase();

  if (text.includes("lender") || text.includes("capital") || text.includes("fund")) return "Lender / Capital";
  if (text.includes("operator") || text.includes("jv") || text.includes("partner")) return "Operator / JV";
  if (text.includes("contractor") || text.includes("repair") || text.includes("construction")) return "Contractor";
  if (text.includes("buyer") || text.includes("acquisition")) return "Buyer";

  return "Owner Review";
}

function routingAction(role: string) {
  const text = role.toLowerCase();
  if (text.includes("lender") || text.includes("capital")) return "route_to_lender";
  if (text.includes("operator") || text.includes("jv")) return "route_to_operator";
  if (text.includes("contractor")) return "route_to_contractor";
  if (text.includes("buyer")) return "route_to_buyer";
  return "needs_review";
}

function priority(body: Row) {
  const text = [
    body.urgency_level,
    body.distress_signals,
    body.description,
    body.seller_situation,
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

function buildRouteSummary(body: Row) {
  return first(
    body.ai_route_summary,
    body.route_summary,
    [
      `Type: ${first(body.property_type, body.deal_type, body.asset_type, "Deal")}`,
      `Strategy: ${first(body.strategy, body.exit_strategy, "Not listed")}`,
      `Exit: ${first(body.exit_strategy, body.strategy, "Not listed")}`,
      `Market: ${[first(body.city), first(body.state)].filter(Boolean).join(", ") || "Not listed"}`,
      first(body.routing_needs, body.deal_needs, body.needs) ? `Needs: ${first(body.routing_needs, body.deal_needs, body.needs)}` : "",
      first(body.distress_signals) ? `Signals: ${first(body.distress_signals)}` : "",
      first(body.urgency_level) ? `Urgency: ${first(body.urgency_level)}` : "",
      first(body.capital_needed) ? `Capital: ${first(body.capital_needed)}` : "",
      first(body.contractor_scope) ? `Contractor Scope: ${first(body.contractor_scope)}` : "",
      first(body.operator_scope) ? `Operator Scope: ${first(body.operator_scope)}` : "",
    ]
      .filter(Boolean)
      .join(" | ")
  );
}

function buildRows(body: Row, email: string) {
  const photos = photoArray(body.photo_urls || body.photos);
  const propertyType = first(body.property_type, body.deal_type, body.asset_type, "Deal");
  const strategy = first(body.strategy, body.exit_strategy, "Strategy Needed");
  const exitStrategy = first(body.exit_strategy, body.strategy);
  const asking = cleanNumber(body.asking_price ?? body.price);
  const arv = cleanNumber(body.arv ?? body.arv_value ?? body.estimated_value);
  const repairs = cleanNumber(body.repair_estimate ?? body.repairs_needed ?? body.estimated_repairs);
  const squareFeet = first(body.square_feet, body.sqft, body.building_sqft);
  const acres = first(body.acres, body.land_acres);
  const routingNeeds = first(body.routing_needs, body.deal_needs, body.needs);
  const distressSignals = first(body.distress_signals);
  const sellerSituation = [body.seller_situation, distressSignals].map(clean).filter(Boolean).join(" | ");
  const summary = buildRouteSummary(body);
  const now = new Date().toISOString();

  const metadata = removeUndefined({
    ...body,
    source: "api_deal_create_signal_route_fix",
    owner_email: email,
    member_email: email,
    property_type: propertyType,
    deal_type: propertyType,
    asset_type: propertyType,
    strategy,
    exit_strategy: exitStrategy,
    asking_price: asking,
    price: asking,
    arv,
    arv_value: arv,
    repair_estimate: repairs,
    repairs_needed: repairs,
    photo_urls: photos,
    main_photo_url: photos[0] || first(body.main_photo_url),
    route_summary: summary,
    ai_route_summary: summary,
    routing_summary: summary,
    routing_needs: routingNeeds,
    deal_needs: first(body.deal_needs, routingNeeds),
    needs: first(body.needs, routingNeeds),
    distress_signals: distressSignals,
    seller_situation: sellerSituation,
    beds: first(body.beds, body.bedrooms),
    bedrooms: first(body.bedrooms, body.beds),
    baths: first(body.baths, body.bathrooms),
    bathrooms: first(body.bathrooms, body.baths),
    square_feet: squareFeet,
    sqft: squareFeet,
    building_sqft: squareFeet,
    year_built: first(body.year_built),
    occupancy: first(body.occupancy),
    zoning: first(body.zoning),
    acres,
    land_acres: acres,
    utilities: first(body.utilities, body.access_notes),
    road_access: first(body.road_access, body.occupancy),
    noi: first(body.noi),
    cap_rate: first(body.cap_rate),
    target_buyer: first(body.target_buyer),
    capital_needed: first(body.capital_needed),
    ideal_lender: first(body.ideal_lender),
    contractor_scope: first(body.contractor_scope),
    operator_scope: first(body.operator_scope),
    jv_structure: first(body.jv_structure),
    title_issue: first(body.title_issue),
    saved_at: now,
  });

  const core = removeUndefined({
    owner_email: email,
    member_email: email,
    title: first(body.title, body.deal_title, "Untitled Deal"),
    property_type: propertyType,
    strategy,
    city: first(body.city, "Unknown City"),
    state: first(body.state, "Unknown State"),
    address: nullable(body.address),
    asking_price: asking,
    arv,
    repair_estimate: repairs,
    description: nullable(body.description),
    status: first(body.status, "active"),
    photo_urls: photos,
    main_photo_url: photos[0] || nullable(body.main_photo_url),
    route_summary: summary,
    ai_route_summary: summary,
    routing_summary: summary,
    routing_needs: routingNeeds,
    deal_needs: first(body.deal_needs, routingNeeds),
    needs: routingNeeds,
    distress_signals: distressSignals,
    seller_situation: sellerSituation,
    metadata,
    created_at: now,
    updated_at: now,
  });

  const expanded = removeUndefined({
    ...core,
    deal_type: propertyType,
    asset_type: propertyType,
    exit_strategy: exitStrategy,
    price: asking,
    beds: nullable(body.beds ?? body.bedrooms),
    baths: nullable(body.baths ?? body.bathrooms),
    bedrooms: nullable(body.bedrooms ?? body.beds),
    bathrooms: nullable(body.bathrooms ?? body.baths),
    square_feet: nullable(squareFeet),
    sqft: nullable(squareFeet),
    building_sqft: nullable(squareFeet),
    year_built: nullable(body.year_built),
    occupancy: nullable(body.occupancy),
    zoning: nullable(body.zoning),
    acres: nullable(acres),
    land_acres: nullable(acres),
    utilities: nullable(body.utilities ?? body.access_notes),
    road_access: nullable(body.road_access ?? body.occupancy),
    noi: nullable(body.noi),
    cap_rate: nullable(body.cap_rate),
    target_buyer: nullable(body.target_buyer),
    capital_needed: nullable(body.capital_needed),
    ideal_lender: nullable(body.ideal_lender),
    contractor_scope: nullable(body.contractor_scope),
    operator_scope: nullable(body.operator_scope),
    jv_structure: nullable(body.jv_structure),
    title_issue: nullable(body.title_issue),
    private_notes: nullable(body.private_notes ?? body.access_notes),
    access_notes: nullable(body.access_notes),
  });

  const minimalWithMetadata = removeUndefined({
    owner_email: email,
    member_email: email,
    title: core.title,
    property_type: propertyType,
    strategy,
    city: core.city,
    state: core.state,
    address: core.address,
    asking_price: asking,
    arv,
    repair_estimate: repairs,
    description: core.description,
    status: core.status,
    photo_urls: photos,
    main_photo_url: core.main_photo_url,
    metadata,
    created_at: now,
    updated_at: now,
  });

  return { expanded, core, minimalWithMetadata };
}

async function adaptiveInsert(supabase: any, candidates: Row[]) {
  const errors: string[] = [];

  for (const candidate of candidates) {
    let row = { ...candidate };

    for (let attempt = 0; attempt < 24; attempt += 1) {
      const { data, error } = await supabase.from(DEAL_TABLE).insert(row).select("*").single();

      if (!error && data) return { data, error: null };

      if (error?.message) errors.push(error.message);

      if (!isMissingColumnError(error)) break;

      const missing = missingColumnFromError(error);

      if (!missing || !Object.prototype.hasOwnProperty.call(row, missing)) break;

      delete row[missing];
    }
  }

  return {
    data: null,
    error: { message: errors[0] || "Could not create deal." },
  };
}

async function insertAdaptive(supabase: any, table: string, variants: Row[]) {
  const errors: string[] = [];

  for (const original of variants) {
    let row = { ...original };

    for (let attempt = 0; attempt < 18; attempt += 1) {
      try {
        const { data, error } = await supabase.from(table).insert(row).select("*").single();

        if (!error && data) return { ok: true, data };

        if (error?.message) errors.push(error.message);

        if (!isMissingColumnError(error)) break;

        const missing = missingColumnFromError(error);
        if (!missing || !Object.prototype.hasOwnProperty.call(row, missing)) break;
        delete row[missing];
      } catch (error: any) {
        if (error?.message) errors.push(error.message);
        break;
      }
    }
  }

  return { ok: false, error: errors[0] || `${table} insert failed.` };
}

async function createDealSignal(supabase: any, deal: Row, body: Row, email: string) {
  const dealId = first(deal.id, deal.deal_id, deal.project_id, deal.item_id);
  const signalId = `deal-${dealId || crypto.randomUUID()}`;
  const role = routingRole(body);
  const action = routingAction(role);
  const summary = buildRouteSummary(body);
  const p = priority(body);
  const now = new Date().toISOString();

  const metadata = removeUndefined({
    owner_email: email,
    member_email: email,
    deal_id: dealId,
    item_id: dealId,
    signal_id: signalId,
    source: "deal_create_signal",
    property_type: first(body.property_type, body.deal_type, body.asset_type),
    strategy: first(body.strategy, body.exit_strategy),
    market: [first(body.city), first(body.state)].filter(Boolean).join(", "),
    routing_needs: first(body.routing_needs, body.deal_needs, body.needs),
    distress_signals: first(body.distress_signals),
    route_summary: summary,
    asking_price: cleanNumber(body.asking_price ?? body.price),
    arv: cleanNumber(body.arv ?? body.arv_value),
    repair_estimate: cleanNumber(body.repair_estimate ?? body.repairs_needed),
  });

  const signalPayload = {
    signal_id: signalId,
    item_id: dealId || null,
    deal_id: dealId || null,
    title: first(body.title, deal.title, "New Deal Signal"),
    signal_type: "Deal Signal",
    type: "deal",
    priority: p,
    urgency: p,
    status: "active",
    market: [first(body.city), first(body.state)].filter(Boolean).join(", "),
    city: first(body.city),
    state: first(body.state),
    asset_type: first(body.property_type, body.asset_type, body.deal_type),
    property_type: first(body.property_type, body.asset_type, body.deal_type),
    note: summary,
    notes: summary,
    description: summary,
    route_summary: summary,
    routing_summary: summary,
    ai_route_summary: summary,
    owner_email: email,
    member_email: email,
    created_by_email: email,
    submitted_by_email: email,
    source: "deal_create_pipeline",
    source_table: DEAL_TABLE,
    metadata,
    created_at: now,
    updated_at: now,
  };

  const signalResult = await insertAdaptive(supabase, "vf_intelligence_signals", [
    signalPayload,
    {
      signal_id: signalPayload.signal_id,
      item_id: signalPayload.item_id,
      title: signalPayload.title,
      signal_type: signalPayload.signal_type,
      priority: signalPayload.priority,
      status: signalPayload.status,
      market: signalPayload.market,
      note: signalPayload.note,
      owner_email: signalPayload.owner_email,
      member_email: signalPayload.member_email,
      source: signalPayload.source,
      metadata: signalPayload.metadata,
      created_at: signalPayload.created_at,
      updated_at: signalPayload.updated_at,
    },
    {
      signal_id: signalPayload.signal_id,
      title: signalPayload.title,
      note: signalPayload.note,
      owner_email: signalPayload.owner_email,
      metadata: signalPayload.metadata,
      created_at: signalPayload.created_at,
    },
  ]);

  const routingPayload = {
    signal_id: signalId,
    alert_id: signalId,
    item_id: dealId || null,
    deal_id: dealId || null,
    title: first(body.title, deal.title, "New Deal Routing"),
    note: summary || "New deal created and routed for review.",
    notes: summary || "New deal created and routed for review.",
    reason: summary || "New deal created and routed for review.",
    route_summary: summary,
    routing_summary: summary,
    action,
    routing_action: action,
    priority: p,
    status: "generated",
    routing_status: "generated",
    state_match: first(body.state, deal.state) || null,
    market_match: first(body.city, deal.city, body.state, deal.state) || null,
    strategy_match: first(body.strategy, body.exit_strategy, deal.strategy) || null,
    role_match: role,
    target_role: role,
    confidence_score: 72,
    match_score: 72,
    owner_email: email,
    admin_email: email,
    created_by: email,
    routed_by_email: email,
    source: "deal_create_pipeline",
    source_table: DEAL_TABLE,
    metadata,
    created_at: now,
    updated_at: now,
  };

  const routingResult = await insertAdaptive(supabase, "vf_routing_actions", [
    routingPayload,
    {
      signal_id: routingPayload.signal_id,
      item_id: routingPayload.item_id,
      deal_id: routingPayload.deal_id,
      title: routingPayload.title,
      note: routingPayload.note,
      action: routingPayload.action,
      priority: routingPayload.priority,
      role_match: routingPayload.role_match,
      target_role: routingPayload.target_role,
      routing_status: routingPayload.routing_status,
      owner_email: routingPayload.owner_email,
      source: routingPayload.source,
      metadata: routingPayload.metadata,
      created_at: routingPayload.created_at,
      updated_at: routingPayload.updated_at,
    },
    {
      signal_id: routingPayload.signal_id,
      item_id: routingPayload.item_id,
      title: routingPayload.title,
      note: routingPayload.note,
      action: routingPayload.action,
      priority: routingPayload.priority,
      owner_email: routingPayload.owner_email,
      metadata: routingPayload.metadata,
      created_at: routingPayload.created_at,
    },
  ]);

  const activityPayload = {
    event_type: "deal_created",
    event_title: first(body.title, deal.title, "New Deal Created"),
    title: first(body.title, deal.title, "New Deal Created"),
    event_description: summary,
    note: summary,
    message: summary,
    member_email: email,
    owner_email: email,
    related_deal_id: dealId || null,
    item_id: dealId || null,
    signal_id: signalId,
    visibility: "owner",
    metadata,
    created_at: now,
    updated_at: now,
  };

  const activityResult = await insertAdaptive(supabase, "vf_activity_events", [
    activityPayload,
    {
      event_type: activityPayload.event_type,
      event_title: activityPayload.event_title,
      event_description: activityPayload.event_description,
      member_email: activityPayload.member_email,
      related_deal_id: activityPayload.related_deal_id,
      metadata: activityPayload.metadata,
      created_at: activityPayload.created_at,
    },
    {
      event_type: activityPayload.event_type,
      event_title: activityPayload.event_title,
      event_description: activityPayload.event_description,
      member_email: activityPayload.member_email,
    },
  ]);

  return {
    signal_id: signalId,
    signal: signalResult,
    routing: routingResult,
    activity: activityResult,
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));

    const email =
      cleanEmail(request.headers.get("x-vf-email")) ||
      cleanEmail(body.owner_email) ||
      cleanEmail(body.member_email);

    if (!email) {
      return NextResponse.json(
        {
          ok: false,
          error: "Login required to create a deal.",
        },
        { status: 401 }
      );
    }

    const rows = buildRows(body, email);

    if (!clean(rows.core.title) || rows.core.title === "Untitled Deal") {
      return NextResponse.json({ ok: false, error: "Deal title is required." }, { status: 400 });
    }

    if (!clean(rows.core.city) || rows.core.city === "Unknown City") {
      return NextResponse.json({ ok: false, error: "City is required." }, { status: 400 });
    }

    const supabase = supabaseClient();
    const result = await adaptiveInsert(supabase, [rows.expanded, rows.core, rows.minimalWithMetadata]);

    if (result.error || !result.data) {
      return NextResponse.json(
        {
          ok: false,
          error: result.error?.message || "Could not create deal.",
        },
        { status: 500 }
      );
    }

    const pipeline = await createDealSignal(supabase, result.data, body, email);
    const dealId = first(result.data.id, result.data.deal_id, result.data.project_id, result.data.item_id);

    return NextResponse.json({
      ok: true,
      deal: result.data,
      deal_id: dealId,
      id: dealId,
      signal_id: pipeline.signal_id,
      signal: pipeline.signal,
      routing: pipeline.routing,
      activity: pipeline.activity,
      direct_links: {
        deal_detail: dealId ? `/deal/detail?id=${encodeURIComponent(dealId)}` : "",
        projects: "/projects",
        dashboard: "/dashboard",
        signal_room: pipeline.signal_id ? `/signals/${encodeURIComponent(pipeline.signal_id)}` : "",
        routing_room: pipeline.signal_id ? `/routing-room/${encodeURIComponent(pipeline.signal_id)}` : "",
        activity: "/activity",
      },
      saved_to: {
        deal_table: DEAL_TABLE,
        deal_detail: Boolean(dealId),
        intelligence_signal: Boolean(pipeline.signal.ok),
        routing_action: Boolean(pipeline.routing.ok),
        activity_event: Boolean(pipeline.activity.ok),
      },
      message: "Deal created, signal generated, and routing action created.",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: "Could not create deal.",
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
