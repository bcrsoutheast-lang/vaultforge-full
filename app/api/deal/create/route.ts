import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const DEAL_TABLE = "vf_deals";
const MAX_SCHEMA_RETRIES = 20;

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

function cleanString(value: unknown) {
  return String(value || "").trim();
}

function cleanEmail(value: unknown) {
  return cleanString(value).toLowerCase();
}

function cleanNumber(value: unknown) {
  const raw = String(value ?? "").trim();
  if (!raw) return null;

  const cleaned = raw.replace(/[^\d.-]/g, "");
  if (!cleaned || cleaned === "." || cleaned === "-" || cleaned === "-.") return null;

  const number = Number(cleaned);
  return Number.isFinite(number) ? number : null;
}

function cleanTextOrNull(value: unknown) {
  const text = cleanString(value);
  return text ? text : null;
}

function firstText(...values: unknown[]) {
  for (const value of values) {
    const cleaned = cleanString(value);
    if (cleaned) return cleaned;
  }

  return "";
}

function firstNumber(...values: unknown[]) {
  for (const value of values) {
    const cleaned = cleanNumber(value);
    if (cleaned !== null) return cleaned;
  }

  return null;
}

function photoArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => cleanString(item)).filter(Boolean);
  }

  const text = cleanString(value);
  if (!text) return [];

  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => cleanString(item)).filter(Boolean);
    }
  } catch {
    // Use the text as one image URL.
  }

  return [text];
}

function removeNullish(row: Record<string, any>) {
  const cleaned: Record<string, any> = {};

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
    text.includes("column") && text.includes("does not exist") ||
    text.includes("could not find") && text.includes("column") ||
    text.includes("schema cache")
  );
}

function buildRows(body: Record<string, any>, email: string) {
  const photos = photoArray(body.photo_urls);
  const propertyType = firstText(body.property_type, body.deal_type, body.asset_type, "Deal");
  const strategy = firstText(body.strategy, body.exit_strategy, "Strategy Needed");
  const askingPrice = firstNumber(body.asking_price, body.price);
  const price = firstNumber(body.price, body.asking_price);
  const squareFeet = firstText(body.square_feet, body.sqft, body.building_sqft);
  const acres = firstText(body.acres, body.land_acres);

  const core = removeNullish({
    owner_email: email,
    member_email: email,

    title: firstText(body.title, body.deal_title, "Untitled Deal"),
    property_type: propertyType,
    strategy,

    city: firstText(body.city, "Unknown City"),
    state: firstText(body.state, "Unknown State"),
    address: cleanTextOrNull(body.address),

    asking_price: askingPrice,
    arv: cleanNumber(body.arv),
    repair_estimate: cleanNumber(body.repair_estimate),

    description: cleanTextOrNull(body.description),
    status: firstText(body.status, "active"),

    photo_urls: photos,
    main_photo_url: photos[0] || cleanTextOrNull(body.main_photo_url),
  });

  const expanded = removeNullish({
    ...core,

    deal_type: propertyType,
    asset_type: propertyType,
    exit_strategy: strategy,

    price,

    beds: cleanTextOrNull(body.beds ?? body.bedrooms),
    baths: cleanTextOrNull(body.baths ?? body.bathrooms),
    bedrooms: cleanTextOrNull(body.bedrooms ?? body.beds),
    bathrooms: cleanTextOrNull(body.bathrooms ?? body.baths),

    square_feet: cleanTextOrNull(squareFeet),
    sqft: cleanTextOrNull(squareFeet),
    building_sqft: cleanTextOrNull(squareFeet),
    year_built: cleanTextOrNull(body.year_built),
    occupancy: cleanTextOrNull(body.occupancy),
    condition: cleanTextOrNull(body.condition),

    commercial_type: cleanTextOrNull(body.commercial_type),
    units: cleanTextOrNull(body.units),
    noi: cleanTextOrNull(body.noi),
    cap_rate: cleanTextOrNull(body.cap_rate),
    zoning: cleanTextOrNull(body.zoning),
    tenant_status: cleanTextOrNull(body.tenant_status),

    acres: cleanTextOrNull(acres),
    land_acres: cleanTextOrNull(acres),
    frontage: cleanTextOrNull(body.frontage),
    utilities: cleanTextOrNull(body.utilities),
    road_access: cleanTextOrNull(body.road_access),
    topography: cleanTextOrNull(body.topography),
    parcel_id: cleanTextOrNull(body.parcel_id),

    deal_needs: cleanTextOrNull(body.deal_needs),
    needs: cleanTextOrNull(body.needs ?? body.deal_needs),
    routing_needs: cleanTextOrNull(body.routing_needs ?? body.deal_needs),

    seller_situation: cleanTextOrNull(body.seller_situation),
    access_notes: cleanTextOrNull(body.access_notes),
    private_notes: cleanTextOrNull(body.private_notes ?? body.access_notes),

    owner_name: cleanTextOrNull(body.owner_name ?? body.contact_name ?? body.seller_name),
    contact_name: cleanTextOrNull(body.contact_name ?? body.owner_name ?? body.seller_name),
    seller_name: cleanTextOrNull(body.seller_name ?? body.owner_name ?? body.contact_name),
    owner_phone: cleanTextOrNull(body.owner_phone ?? body.contact_phone ?? body.seller_phone),
    contact_phone: cleanTextOrNull(body.contact_phone ?? body.owner_phone ?? body.seller_phone),
    seller_phone: cleanTextOrNull(body.seller_phone ?? body.owner_phone ?? body.contact_phone),
    owner_contact_email: cleanTextOrNull(body.owner_contact_email ?? body.contact_email ?? body.seller_email),
    contact_email: cleanTextOrNull(body.contact_email ?? body.owner_contact_email ?? body.seller_email),
    seller_email: cleanTextOrNull(body.seller_email ?? body.owner_contact_email ?? body.contact_email),
    preferred_contact: cleanTextOrNull(body.preferred_contact),
  });

  return { core, expanded };
}

async function adaptiveInsert(supabase: any, firstRow: Record<string, any>, fallbackRow: Record<string, any>) {
  let row = { ...firstRow };
  const removedColumns: string[] = [];

  for (let attempt = 0; attempt < MAX_SCHEMA_RETRIES; attempt += 1) {
    const { data, error } = await supabase
      .from(DEAL_TABLE)
      .insert(row)
      .select("*")
      .single();

    if (!error) {
      return { data, error: null, removedColumns };
    }

    if (!isMissingColumnError(error)) {
      if (row !== fallbackRow) {
        row = { ...fallbackRow };
        continue;
      }

      return { data: null, error, removedColumns };
    }

    const missing = missingColumnFromError(error);

    if (missing && Object.prototype.hasOwnProperty.call(row, missing)) {
      delete row[missing];
      removedColumns.push(missing);
      continue;
    }

    if (JSON.stringify(row) !== JSON.stringify(fallbackRow)) {
      row = { ...fallbackRow };
      continue;
    }

    return { data: null, error, removedColumns };
  }

  return {
    data: null,
    error: {
      message: "Could not create deal after schema compatibility retries.",
      details: { removedColumns },
    },
    removedColumns,
  };
}


async function findAssignedMemberEmail(supabase: any, ownerEmail: string) {
  const tables = ["vf_profiles", "profiles", "member_profiles"];

  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select("*")
        .limit(50);

      if (error || !Array.isArray(data)) continue;

      const liveMembers = data
        .map((row: Record<string, any>) => ({
          email: cleanEmail(row.email || row.member_email || row.user_email),
          row,
        }))
        .filter((item) => {
          if (!item.email || !item.email.includes("@")) return false;
          if (item.email === ownerEmail) return false;
          if (item.email === "bcrsoutheast@gmail.com") return false;
          if (item.email.endsWith("@example.com")) return false;
          if (item.email === "test@test.com") return false;

          const status = cleanString(
            item.row.access_status ||
              item.row.member_status ||
              item.row.status
          ).toLowerCase();

          return !["deleted", "removed", "suspended", "disabled"].includes(status);
        });

      if (liveMembers.length > 0) {
        return liveMembers[0].email;
      }
    } catch {
      // Try next profile table.
    }
  }

  return "";
}

function inferPrimaryRole(body: Record<string, any>) {
  const text = [
    body.routing_needs,
    body.deal_needs,
    body.needs,
    body.ai_route_summary,
    body.route_summary,
    body.description,
    body.seller_situation,
  ]
    .map(cleanString)
    .join(" ")
    .toLowerCase();

  if (text.includes("lender") || text.includes("capital") || text.includes("fund")) {
    return "Lender / Capital";
  }

  if (text.includes("operator") || text.includes("jv") || text.includes("partner")) {
    return "Operator";
  }

  if (text.includes("contractor") || text.includes("repair") || text.includes("construction")) {
    return "Contractor";
  }

  if (text.includes("buyer") || text.includes("acquisition")) {
    return "Buyer";
  }

  return "Owner Review";
}

function inferRoutingAction(role: string) {
  const lower = role.toLowerCase();

  if (lower.includes("lender") || lower.includes("capital")) return "route_to_lender";
  if (lower.includes("operator")) return "route_to_operator";
  if (lower.includes("contractor")) return "route_to_contractor";
  if (lower.includes("buyer")) return "route_to_buyer";

  return "needs_review";
}

function inferPriority(body: Record<string, any>) {
  const text = [
    body.urgency_level,
    body.distress_signals,
    body.description,
    body.seller_situation,
    body.ai_route_summary,
    body.route_summary,
  ]
    .map(cleanString)
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

async function createRoutingActionForDeal(
  supabase: any,
  deal: Record<string, any>,
  body: Record<string, any>,
  ownerEmail: string
) {
  const assignedMemberEmail = await findAssignedMemberEmail(supabase, ownerEmail);
  const dealId = cleanString(deal.id || deal.deal_id || deal.project_id || deal.property_id);
  const role = inferPrimaryRole(body);
  const action = inferRoutingAction(role);
  const priority = inferPriority(body);
  const now = new Date().toISOString();

  const payload = {
    signal_id: `deal-${dealId || crypto.randomUUID()}`,
    alert_id: `deal-${dealId || crypto.randomUUID()}`,
    item_id: dealId || null,
    deal_id: dealId || null,

    title: cleanString(deal.title || body.title || "New VaultForge Deal"),
    note:
      cleanString(body.ai_route_summary || body.route_summary || body.description || body.seller_situation) ||
      "New deal created and routed for member review.",
    notes:
      cleanString(body.ai_route_summary || body.route_summary || body.description || body.seller_situation) ||
      "New deal created and routed for member review.",
    reason:
      cleanString(body.ai_route_summary || body.route_summary || body.description || body.seller_situation) ||
      "New deal created and routed for member review.",

    action,
    routing_action: action,
    priority,
    status: "generated",
    routing_status: "generated",

    state_match: cleanString(body.state || deal.state) || null,
    market_match: cleanString(body.state || deal.state || body.city || deal.city) || null,
    strategy_match: cleanString(body.strategy || body.exit_strategy || deal.strategy) || null,
    role_match: role,
    target_role: role,

    urgency_reason:
      cleanString(body.ai_route_summary || body.route_summary) ||
      `Deal created with routing need: ${role}.`,
    routing_reason:
      cleanString(body.ai_route_summary || body.route_summary) ||
      `Deal created with routing need: ${role}.`,
    routing_summary:
      cleanString(body.ai_route_summary || body.route_summary) ||
      `Market: ${cleanString(body.city || deal.city)}, ${cleanString(body.state || deal.state)} · Role: ${role}`,

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
      state_match: payload.state_match,
      strategy_match: payload.strategy_match,
      role_match: payload.role_match,
      target_role: payload.target_role,
      target_email: payload.target_email,
      target_member_email: payload.target_member_email,
      member_email: payload.member_email,
      routing_status: payload.routing_status,
      source: payload.source,
      source_table: payload.source_table,
      created_by: payload.created_by,
      routed_by_email: payload.routed_by_email,
      owner_email: payload.owner_email,
      admin_email: payload.admin_email,
      created_at: payload.created_at,
      updated_at: payload.updated_at,
      metadata: payload.metadata,
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
      const { data, error } = await supabase
        .from("vf_routing_actions")
        .insert(variant)
        .select("*")
        .single();

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

async function createActivityForDeal(
  supabase: any,
  deal: Record<string, any>,
  body: Record<string, any>,
  ownerEmail: string,
  assignedMemberEmail: string | null
) {
  const dealId = cleanString(deal.id || deal.deal_id || deal.project_id || deal.property_id);
  const title = cleanString(deal.title || body.title || "New deal created");

  const payload = {
    event_type: "deal_created",
    event_title: title,
    event_description:
      cleanString(body.ai_route_summary || body.route_summary || body.description) ||
      "A new VaultForge deal was created and moved into routing review.",
    member_email: assignedMemberEmail || ownerEmail,
    owner_email: ownerEmail,
    related_deal_id: dealId || null,
    visibility: assignedMemberEmail ? "member" : "owner",
    metadata: {
      deal_id: dealId || null,
      source_table: DEAL_TABLE,
      assigned_member_email: assignedMemberEmail || null,
      created_from: "api_deal_create",
    },
  };

  const variants = [
    payload,
    {
      event_type: payload.event_type,
      event_title: payload.event_title,
      event_description: payload.event_description,
      member_email: payload.member_email,
      related_deal_id: payload.related_deal_id,
      visibility: payload.visibility,
      metadata: payload.metadata,
    },
    {
      event_type: payload.event_type,
      event_title: payload.event_title,
      event_description: payload.event_description,
      member_email: payload.member_email,
    },
  ];

  const errors: string[] = [];

  for (const variant of variants) {
    try {
      const { data, error } = await supabase
        .from("vf_activity_events")
        .insert(variant)
        .select("*")
        .single();

      if (!error && data) {
        return {
          ok: true,
          activity: data,
        };
      }

      if (error?.message) errors.push(error.message);
    } catch (error: any) {
      if (error?.message) errors.push(error.message);
    }
  }

  return {
    ok: false,
    error: errors[0] || "Activity insert failed.",
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
          details: "No VaultForge member email was found.",
        },
        { status: 401 }
      );
    }

    const { core, expanded } = buildRows(body, email);

    if (!cleanString(core.title) || core.title === "Untitled Deal") {
      return NextResponse.json(
        { ok: false, error: "Deal title is required." },
        { status: 400 }
      );
    }

    if (!cleanString(core.city) || core.city === "Unknown City") {
      return NextResponse.json(
        { ok: false, error: "City is required." },
        { status: 400 }
      );
    }

    const supabase = supabaseClient();
    const result = await adaptiveInsert(supabase, expanded, core);

    if (result.error) {
      return NextResponse.json(
        {
          ok: false,
          error: result.error.message || "Could not create deal.",
          details: result.error,
          removed_columns_before_failure: result.removedColumns,
        },
        { status: 500 }
      );
    }

    const routingResult = await createRoutingActionForDeal(
      supabase,
      result.data,
      body,
      email
    );

    const activityResult = await createActivityForDeal(
      supabase,
      result.data,
      body,
      email,
      routingResult.assigned_member_email || null
    );

    return NextResponse.json({
      ok: true,
      deal: result.data,
      removed_schema_columns: result.removedColumns,
      routing: routingResult,
      activity: activityResult,
      message: routingResult.ok
        ? "Deal room created and routed into VaultForge."
        : "Deal room created. Routing action still needs review.",
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