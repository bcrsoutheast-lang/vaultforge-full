import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const DEAL_TABLE = "vf_deals";
const MAX_SCHEMA_RETRIES = 24;

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
  const raw = clean(value);
  if (!raw) return null;

  const n = Number(raw.replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function cleanTextOrNull(value: unknown) {
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
    // Use as one value.
  }

  return [text];
}

function removeUndefined(row: Row) {
  const cleaned: Row = {};

  for (const [key, value] of Object.entries(row)) {
    if (value === undefined) continue;
    cleaned[key] = value;
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

function inferPrimaryRole(body: Row) {
  const text = [
    body.routing_needs,
    body.deal_needs,
    body.needs,
    body.ai_route_summary,
    body.route_summary,
    body.description,
    body.seller_situation,
  ]
    .map(clean)
    .join(" ")
    .toLowerCase();

  if (text.includes("lender") || text.includes("capital") || text.includes("fund")) return "Lender / Capital";
  if (text.includes("operator") || text.includes("jv") || text.includes("partner")) return "Operator";
  if (text.includes("contractor") || text.includes("repair") || text.includes("construction")) return "Contractor";
  if (text.includes("buyer") || text.includes("acquisition")) return "Buyer";

  return "Owner Review";
}

function inferRoutingAction(role: string) {
  const text = role.toLowerCase();

  if (text.includes("lender") || text.includes("capital")) return "route_to_lender";
  if (text.includes("operator")) return "route_to_operator";
  if (text.includes("contractor")) return "route_to_contractor";
  if (text.includes("buyer")) return "route_to_buyer";

  return "needs_review";
}

function inferPriority(body: Row) {
  const text = [
    body.urgency_level,
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

function buildRouteSummary(body: Row) {
  return first(
    body.ai_route_summary,
    body.route_summary,
    [
      `Type: ${first(body.property_type, body.deal_type, body.asset_type, "Deal")}`,
      `Strategy: ${first(body.strategy, body.exit_strategy) || "Not listed"}`,
      `Exit: ${first(body.exit_strategy, body.strategy) || "Not listed"}`,
      `Market: ${[first(body.city), first(body.state)].filter(Boolean).join(", ") || "Not listed"}`,
      first(body.routing_needs, body.deal_needs, body.needs) ? `Needs: ${first(body.routing_needs, body.deal_needs, body.needs)}` : "",
      first(body.distress_signals) ? `Signals: ${first(body.distress_signals)}` : "",
      first(body.urgency_level) ? `Urgency: ${first(body.urgency_level)}` : "",
      first(body.capital_needed) ? `Capital: ${first(body.capital_needed)}` : "",
      first(body.contractor_scope) ? `Contractor Scope: ${first(body.contractor_scope)}` : "",
      first(body.operator_scope) ? `Operator Scope: ${first(body.operator_scope)}` : "",
    ].filter(Boolean).join(" | ")
  );
}

function buildRows(body: Row, email: string) {
  const photos = photoArray(body.photo_urls || body.photos);
  const propertyType = first(body.property_type, body.deal_type, body.asset_type, "Deal");
  const strategy = first(body.strategy, body.exit_strategy, "Strategy Needed");
  const exitStrategy = first(body.exit_strategy, body.strategy);
  const askingPrice = cleanNumber(body.asking_price ?? body.price);
  const arv = cleanNumber(body.arv ?? body.arv_value ?? body.estimated_value);
  const repairs = cleanNumber(body.repair_estimate ?? body.repairs_needed ?? body.estimated_repairs);
  const squareFeet = first(body.square_feet, body.sqft, body.building_sqft);
  const acres = first(body.acres, body.land_acres);
  const routeSummary = buildRouteSummary(body);
  const routingNeeds = first(body.routing_needs, body.deal_needs, body.needs);
  const distressSignals = first(body.distress_signals);
  const sellerSituation = [body.seller_situation, distressSignals].map(clean).filter(Boolean).join(" | ");
  const now = new Date().toISOString();

  const fullMetadata = removeUndefined({
    ...body,
    source: "api_deal_create_full_field_persistence",
    owner_email: email,
    member_email: email,
    property_type: propertyType,
    deal_type: propertyType,
    asset_type: propertyType,
    strategy,
    exit_strategy: exitStrategy,
    asking_price: askingPrice,
    price: askingPrice,
    arv,
    arv_value: arv,
    repair_estimate: repairs,
    repairs_needed: repairs,
    photo_urls: photos,
    main_photo_url: photos[0] || first(body.main_photo_url),
    route_summary: routeSummary,
    ai_route_summary: routeSummary,
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
    address: cleanTextOrNull(body.address),
    asking_price: askingPrice,
    arv,
    repair_estimate: repairs,
    description: cleanTextOrNull(body.description),
    status: first(body.status, "active"),
    photo_urls: photos,
    main_photo_url: photos[0] || cleanTextOrNull(body.main_photo_url),
    route_summary: routeSummary,
    ai_route_summary: routeSummary,
    routing_needs: routingNeeds,
    deal_needs: first(body.deal_needs, routingNeeds),
    distress_signals: distressSignals,
    seller_situation: sellerSituation,
    metadata: fullMetadata,
    created_at: now,
    updated_at: now,
  });

  const expanded = removeUndefined({
    ...core,
    deal_type: propertyType,
    asset_type: propertyType,
    exit_strategy: exitStrategy,
    price: askingPrice,
    beds: cleanTextOrNull(body.beds ?? body.bedrooms),
    baths: cleanTextOrNull(body.baths ?? body.bathrooms),
    bedrooms: cleanTextOrNull(body.bedrooms ?? body.beds),
    bathrooms: cleanTextOrNull(body.bathrooms ?? body.baths),
    square_feet: cleanTextOrNull(squareFeet),
    sqft: cleanTextOrNull(squareFeet),
    building_sqft: cleanTextOrNull(squareFeet),
    year_built: cleanTextOrNull(body.year_built),
    occupancy: cleanTextOrNull(body.occupancy),
    zoning: cleanTextOrNull(body.zoning),
    acres: cleanTextOrNull(acres),
    land_acres: cleanTextOrNull(acres),
    utilities: cleanTextOrNull(body.utilities ?? body.access_notes),
    road_access: cleanTextOrNull(body.road_access ?? body.occupancy),
    noi: cleanTextOrNull(body.noi),
    cap_rate: cleanTextOrNull(body.cap_rate),
    target_buyer: cleanTextOrNull(body.target_buyer),
    capital_needed: cleanTextOrNull(body.capital_needed),
    ideal_lender: cleanTextOrNull(body.ideal_lender),
    contractor_scope: cleanTextOrNull(body.contractor_scope),
    operator_scope: cleanTextOrNull(body.operator_scope),
    jv_structure: cleanTextOrNull(body.jv_structure),
    title_issue: cleanTextOrNull(body.title_issue),
    needs: cleanTextOrNull(routingNeeds),
    private_notes: cleanTextOrNull(body.private_notes ?? body.access_notes),
    access_notes: cleanTextOrNull(body.access_notes),
    owner_name: cleanTextOrNull(body.owner_name ?? body.contact_name ?? body.seller_name),
    contact_name: cleanTextOrNull(body.contact_name ?? body.owner_name ?? body.seller_name),
    seller_name: cleanTextOrNull(body.seller_name ?? body.owner_name ?? body.contact_name),
    owner_phone: cleanTextOrNull(body.owner_phone ?? body.contact_phone ?? body.seller_phone),
    contact_phone: cleanTextOrNull(body.contact_phone ?? body.owner_phone ?? body.seller_phone),
    seller_phone: cleanTextOrNull(body.seller_phone ?? body.owner_phone ?? body.contact_phone),
    owner_contact_email: cleanTextOrNull(body.owner_contact_email ?? body.contact_email ?? body.seller_email),
    contact_email: cleanTextOrNull(body.contact_email ?? body.owner_contact_email ?? body.seller_email),
    seller_email: cleanTextOrNull(body.seller_email ?? body.owner_contact_email ?? body.contact_email),
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
    asking_price: askingPrice,
    arv,
    repair_estimate: repairs,
    description: core.description,
    status: core.status,
    photo_urls: photos,
    main_photo_url: core.main_photo_url,
    metadata: fullMetadata,
    created_at: now,
    updated_at: now,
  });

  const minimalNoMetadata = removeUndefined({
    owner_email: email,
    member_email: email,
    title: core.title,
    property_type: propertyType,
    strategy,
    city: core.city,
    state: core.state,
    address: core.address,
    asking_price: askingPrice,
    arv,
    repair_estimate: repairs,
    description: core.description,
    status: core.status,
    photo_urls: photos,
    main_photo_url: core.main_photo_url,
    created_at: now,
    updated_at: now,
  });

  return {
    core,
    expanded,
    minimalWithMetadata,
    minimalNoMetadata,
    metadata: fullMetadata,
  };
}

async function adaptiveInsert(supabase: any, candidates: Row[]) {
  const attempts: Row[] = [];

  for (const candidate of candidates) {
    let row = { ...candidate };
    const removedColumns: string[] = [];

    for (let attempt = 0; attempt < MAX_SCHEMA_RETRIES; attempt += 1) {
      const { data, error } = await supabase.from(DEAL_TABLE).insert(row).select("*").single();

      attempts.push({
        ok: !error,
        error: error?.message || null,
        keys: Object.keys(row),
        removedColumns: [...removedColumns],
      });

      if (!error) {
        return { data, error: null, removedColumns, attempts };
      }

      if (!isMissingColumnError(error)) break;

      const missing = missingColumnFromError(error);

      if (missing && Object.prototype.hasOwnProperty.call(row, missing)) {
        delete row[missing];
        removedColumns.push(missing);
        continue;
      }

      break;
    }
  }

  return {
    data: null,
    error: { message: "Could not create deal after compatible schema attempts." },
    removedColumns: [],
    attempts,
  };
}

async function findAssignedMemberEmail(supabase: any, ownerEmail: string) {
  const tables = ["vf_profiles", "profiles", "member_profiles"];

  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select("*").limit(50);
      if (error || !Array.isArray(data)) continue;

      const liveMembers = data
        .map((row: Row) => ({
          email: cleanEmail(row.email || row.member_email || row.user_email),
          row,
        }))
        .filter((item) => {
          if (!item.email || !item.email.includes("@")) return false;
          if (item.email === ownerEmail) return false;
          if (item.email === "bcrsoutheast@gmail.com") return false;
          if (item.email.endsWith("@example.com")) return false;
          if (item.email === "test@test.com") return false;

          const status = clean(item.row.access_status || item.row.member_status || item.row.status).toLowerCase();
          return !["deleted", "removed", "suspended", "disabled"].includes(status);
        });

      if (liveMembers.length > 0) return liveMembers[0].email;
    } catch {
      // Try next.
    }
  }

  return "";
}

async function createRoutingActionForDeal(supabase: any, deal: Row, body: Row, ownerEmail: string) {
  const assignedMemberEmail = await findAssignedMemberEmail(supabase, ownerEmail);
  const dealId = clean(deal.id || deal.deal_id || deal.project_id || deal.property_id);
  const role = inferPrimaryRole(body);
  const action = inferRoutingAction(role);
  const priority = inferPriority(body);
  const summary = buildRouteSummary(body);
  const signalId = `deal-${dealId || crypto.randomUUID()}`;
  const now = new Date().toISOString();

  const payload = {
    signal_id: signalId,
    alert_id: signalId,
    item_id: dealId || null,
    deal_id: dealId || null,
    title: first(deal.title, body.title, "New VaultForge Deal"),
    note: summary || "New deal created and routed for member review.",
    notes: summary || "New deal created and routed for member review.",
    reason: summary || "New deal created and routed for member review.",
    route_summary: summary,
    routing_summary: summary,
    action,
    routing_action: action,
    priority,
    status: "generated",
    routing_status: "generated",
    state_match: first(body.state, deal.state) || null,
    market_match: first(body.state, deal.state, body.city, deal.city) || null,
    strategy_match: first(body.strategy, body.exit_strategy, deal.strategy) || null,
    role_match: role,
    target_role: role,
    urgency_reason: summary || `Deal created with routing need: ${role}.`,
    routing_reason: summary || `Deal created with routing need: ${role}.`,
    confidence_score: 72,
    match_score: 72,
    target_email: assignedMemberEmail || null,
    target_member_email: assignedMemberEmail || null,
    member_email: assignedMemberEmail || null,
    source: "deal_create_pipeline",
    source_table: DEAL_TABLE,
    metadata: {
      generated_by: "deal_create_pipeline",
      owner_email: ownerEmail,
      created_from: "api_deal_create",
      assigned_member_email: assignedMemberEmail || null,
      routing_needs: body.routing_needs || null,
      distress_signals: body.distress_signals || null,
      deal_id: dealId || null,
      signal_id: signalId,
    },
    created_by: ownerEmail,
    routed_by_email: ownerEmail,
    owner_email: ownerEmail,
    admin_email: ownerEmail,
    created_at: now,
    updated_at: now,
  };

  const variants = [
    payload,
    {
      signal_id: payload.signal_id,
      item_id: payload.item_id,
      deal_id: payload.deal_id,
      title: payload.title,
      note: payload.note,
      action: payload.action,
      priority: payload.priority,
      role_match: payload.role_match,
      target_role: payload.target_role,
      target_email: payload.target_email,
      target_member_email: payload.target_member_email,
      member_email: payload.member_email,
      routing_status: payload.routing_status,
      source: payload.source,
      source_table: payload.source_table,
      owner_email: payload.owner_email,
      metadata: payload.metadata,
      created_at: payload.created_at,
      updated_at: payload.updated_at,
    },
    {
      signal_id: payload.signal_id,
      item_id: payload.item_id,
      title: payload.title,
      note: payload.note,
      action: payload.action,
      priority: payload.priority,
      member_email: payload.member_email,
      target_email: payload.target_email,
      routing_status: payload.routing_status,
      created_by: payload.created_by,
      created_at: payload.created_at,
      updated_at: payload.updated_at,
    },
  ];

  const errors: string[] = [];

  for (const variant of variants) {
    try {
      const { data, error } = await supabase.from("vf_routing_actions").insert(variant).select("*").single();

      if (!error && data) {
        return {
          ok: true,
          action: data,
          assigned_member_email: assignedMemberEmail || null,
          signal_id: payload.signal_id,
        };
      }

      if (error?.message) errors.push(error.message);
    } catch (error: any) {
      if (error?.message) errors.push(error.message);
    }
  }

  return {
    ok: false,
    error: errors[0] || "Routing action insert failed.",
    assigned_member_email: assignedMemberEmail || null,
    signal_id: payload.signal_id,
  };
}

async function createActivityForDeal(supabase: any, deal: Row, body: Row, ownerEmail: string, assignedMemberEmail: string | null) {
  const dealId = clean(deal.id || deal.deal_id || deal.project_id || deal.property_id);
  const title = first(deal.title, body.title, "New deal created");
  const summary = buildRouteSummary(body);

  const variants = [
    {
      event_type: "deal_created",
      event_title: title,
      title,
      event_description: summary || "A new VaultForge deal was created and moved into routing review.",
      note: summary,
      message: summary,
      member_email: assignedMemberEmail || ownerEmail,
      owner_email: ownerEmail,
      related_deal_id: dealId || null,
      item_id: dealId || null,
      visibility: assignedMemberEmail ? "member" : "owner",
      metadata: {
        deal_id: dealId || null,
        source_table: DEAL_TABLE,
        assigned_member_email: assignedMemberEmail || null,
        created_from: "api_deal_create",
      },
    },
    {
      event_type: "deal_created",
      event_title: title,
      event_description: summary,
      member_email: assignedMemberEmail || ownerEmail,
      related_deal_id: dealId || null,
      metadata: { deal_id: dealId || null },
    },
    {
      event_type: "deal_created",
      event_title: title,
      event_description: summary,
      member_email: assignedMemberEmail || ownerEmail,
    },
  ];

  const errors: string[] = [];

  for (const variant of variants) {
    try {
      const { data, error } = await supabase.from("vf_activity_events").insert(variant).select("*").single();

      if (!error && data) {
        return { ok: true, activity: data };
      }

      if (error?.message) errors.push(error.message);
    } catch (error: any) {
      if (error?.message) errors.push(error.message);
    }
  }

  return { ok: false, error: errors[0] || "Activity insert failed." };
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
          details: "No VaultForge member email was found.",
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
    const result = await adaptiveInsert(supabase, [
      rows.expanded,
      rows.core,
      rows.minimalWithMetadata,
      rows.minimalNoMetadata,
    ]);

    if (result.error || !result.data) {
      return NextResponse.json(
        {
          ok: false,
          error: result.error?.message || "Could not create deal.",
          details: result.error,
          attempts: result.attempts,
        },
        { status: 500 }
      );
    }

    const routingResult = await createRoutingActionForDeal(supabase, result.data, body, email);
    const activityResult = await createActivityForDeal(
      supabase,
      result.data,
      body,
      email,
      routingResult.assigned_member_email || null
    );

    const dealId = clean(result.data.id || result.data.deal_id || result.data.project_id || result.data.item_id);

    return NextResponse.json({
      ok: true,
      deal: result.data,
      deal_id: dealId,
      id: dealId,
      removed_schema_columns: result.removedColumns,
      routing: routingResult,
      activity: activityResult,
      direct_links: {
        deal_detail: dealId ? `/deal/detail?id=${encodeURIComponent(dealId)}` : "",
        projects: "/projects",
        dashboard: "/dashboard",
        routing_room: routingResult.signal_id ? `/routing-room/${encodeURIComponent(routingResult.signal_id)}` : "",
        activity: "/activity",
      },
      saved_to: {
        deal_table: DEAL_TABLE,
        deal_detail: Boolean(dealId),
        routing_action: Boolean(routingResult.ok),
        activity_event: Boolean(activityResult.ok),
      },
      message: "Deal created. Open Deal Detail or Projects to review the saved record.",
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
