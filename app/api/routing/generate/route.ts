import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const OWNER_EMAIL = "bcrsoutheast@gmail.com";
const ROUTING_TABLE = "vf_routing_actions";

type AnyRecord = Record<string, any>;

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

function requestEmail(request: Request, body: AnyRecord = {}) {
  const url = new URL(request.url);
  const cookie = request.headers.get("cookie") || "";

  return cleanEmail(
    request.headers.get("x-vf-email") ||
      body.email ||
      body.admin_email ||
      body.owner_email ||
      url.searchParams.get("email") ||
      readCookie(cookie, "vf_email") ||
      readCookie(cookie, "vf_admin_email")
  );
}

function isOwnerRequest(request: Request, email: string, body: AnyRecord = {}) {
  const url = new URL(request.url);
  const cookie = request.headers.get("cookie") || "";

  return (
    email === OWNER_EMAIL ||
    cleanEmail(body.admin_email) === OWNER_EMAIL ||
    clean(request.headers.get("x-vf-admin")) === "1" ||
    clean(body.owner) === "1" ||
    clean(body.admin) === "1" ||
    clean(url.searchParams.get("owner")) === "1" ||
    cookie.includes("vf_admin=1") ||
    cookie.includes("isAdmin=true")
  );
}

function first(...values: unknown[]) {
  for (const value of values) {
    const text = clean(value);
    if (text) return text;
  }

  return "";
}

function normalizeAction(value: unknown) {
  const text = clean(value).toLowerCase().replace(/\s+/g, "_");

  if (text.includes("lender") || text.includes("capital") || text.includes("fund")) {
    return "route_to_lender";
  }

  if (text.includes("operator") || text.includes("jv") || text.includes("partner")) {
    return "route_to_operator";
  }

  if (text.includes("contractor") || text.includes("repair") || text.includes("construction")) {
    return "route_to_contractor";
  }

  if (text.includes("review")) {
    return "needs_review";
  }

  if (text.includes("watch")) {
    return "watch";
  }

  if (text.includes("buyer") || text.includes("acquisition")) {
    return "route_to_buyer";
  }

  return text || "needs_review";
}

function inferRole(action: string, source: string) {
  if (action.includes("lender")) return "Lender / Capital";
  if (action.includes("operator")) return "Operator";
  if (action.includes("contractor")) return "Contractor";
  if (action.includes("buyer")) return "Buyer";

  if (source.includes("capital") || source.includes("funding") || source.includes("loan")) return "Lender / Capital";
  if (source.includes("repair") || source.includes("contractor") || source.includes("construction")) return "Contractor";
  if (source.includes("operator") || source.includes("jv") || source.includes("partner")) return "Operator";
  if (source.includes("buyer") || source.includes("sell") || source.includes("dispo")) return "Buyer";

  return "Owner Review";
}

function inferPriority(source: string) {
  if (
    source.includes("urgent") ||
    source.includes("distress") ||
    source.includes("foreclosure") ||
    source.includes("deadline") ||
    source.includes("emergency")
  ) {
    return "urgent";
  }

  if (
    source.includes("high") ||
    source.includes("hot") ||
    source.includes("strong") ||
    source.includes("margin") ||
    source.includes("spread")
  ) {
    return "high";
  }

  return "medium";
}

function inferStrategy(source: string) {
  if (source.includes("flip") || source.includes("rehab") || source.includes("renovation")) return "Fix & Flip";
  if (source.includes("rental") || source.includes("hold")) return "Buy & Hold";
  if (source.includes("brrrr")) return "BRRRR";
  if (source.includes("private money") || source.includes("loan") || source.includes("lender")) return "Private Money";
  if (source.includes("land") || source.includes("acre")) return "Land";
  if (source.includes("commercial")) return "Commercial";
  return "";
}

function inferConfidence({
  stateMatch,
  strategyMatch,
  roleMatch,
  priority,
  source,
}: {
  stateMatch: string;
  strategyMatch: string;
  roleMatch: string;
  priority: string;
  source: string;
}) {
  let score = 42;

  if (stateMatch) score += 14;
  if (strategyMatch) score += 14;
  if (roleMatch && roleMatch !== "Owner Review") score += 16;
  if (priority === "urgent") score += 12;
  if (priority === "high") score += 8;
  if (source.includes("spread") || source.includes("margin") || source.includes("arv")) score += 6;

  return Math.max(20, Math.min(98, score));
}

function makeSignalId(body: AnyRecord, email: string) {
  const existing = first(body.signal_id, body.signalId, body.alert_id, body.alertId);

  if (existing) return existing;

  const itemId = first(body.item_id, body.itemId, body.deal_id, body.project_id, body.property_id, body.pain_id);
  const cleanItem = itemId || crypto.randomUUID();

  return `deal-${cleanItem}-${email || "owner"}`;
}

function makeRoutingPayload(body: AnyRecord, ownerEmail: string) {
  const sourceText = [
    body.title,
    body.name,
    body.description,
    body.note,
    body.message,
    body.seller_situation,
    body.problem,
    body.strategy,
    body.property_type,
    body.asset_type,
    body.market,
    body.city,
    body.state,
    body.role_needed,
    body.deal_need,
  ]
    .map(clean)
    .join(" ")
    .toLowerCase();

  const action = normalizeAction(first(body.action, body.routing_action, body.role_needed, body.deal_need, sourceText));
  const priority = first(body.priority, inferPriority(sourceText));
  const stateMatch = first(body.state_match, body.market_match, body.state, body.market);
  const strategyMatch = first(body.strategy_match, body.strategy, body.asset_strategy, inferStrategy(sourceText));
  const roleMatch = first(body.role_match, body.target_role, inferRole(action, sourceText));
  const itemId = first(body.item_id, body.itemId, body.deal_id, body.project_id, body.property_id, body.pain_id);
  const signalId = makeSignalId(body, ownerEmail);

  const title = first(
    body.title,
    body.signal_title,
    body.deal_title,
    body.project_title,
    body.property_title,
    `${roleMatch} routing signal`
  );

  const note = first(
    body.note,
    body.description,
    body.message,
    body.seller_situation,
    `Routing generated from ${title}.`
  );

  const urgencyReason = first(
    body.urgency_reason,
    body.routing_reason,
    priority === "urgent"
      ? "Urgent opportunity pressure detected from source context."
      : priority === "high"
      ? "High-value routing opportunity identified from source context."
      : "Normal routing review generated from source context."
  );

  const confidenceScore = inferConfidence({
    stateMatch,
    strategyMatch,
    roleMatch,
    priority,
    source: sourceText,
  });

  const routingSummary = [
    stateMatch ? `State fit: ${stateMatch}` : "",
    strategyMatch ? `Strategy fit: ${strategyMatch}` : "",
    roleMatch ? `Role fit: ${roleMatch}` : "",
  ]
    .filter(Boolean)
    .join(" · ") || "Routing context generated for owner review.";

  const now = new Date().toISOString();

  return {
    signal_id: signalId,
    alert_id: signalId,
    item_id: itemId || null,
    deal_id: first(body.deal_id, itemId) || null,
    project_id: first(body.project_id) || null,
    property_id: first(body.property_id) || null,
    pain_id: first(body.pain_id) || null,

    title,
    note,
    notes: note,
    reason: note,

    action,
    routing_action: action,
    priority,
    status: "generated",
    routing_status: "generated",

    state_match: stateMatch || null,
    market_match: stateMatch || null,
    strategy_match: strategyMatch || null,
    role_match: roleMatch || null,
    target_role: roleMatch || null,

    urgency_reason: urgencyReason,
    routing_reason: urgencyReason,
    routing_summary: routingSummary,

    confidence_score: confidenceScore,
    match_score: confidenceScore,

    target_email: cleanEmail(body.target_email || body.member_email || body.recipient_email) || null,
    target_member_email: cleanEmail(body.target_member_email || body.target_email || body.member_email) || null,
    member_email: cleanEmail(body.member_email || body.target_email) || null,

    source: first(body.source, "routing_generator"),
    source_table: first(body.source_table) || null,
    metadata: {
      generated_by: "vaultforge_routing_generator",
      original_source: body.source || null,
      item_kind: body.item_kind || body.kind || null,
    },

    created_by: ownerEmail,
    routed_by_email: ownerEmail,
    owner_email: ownerEmail,
    admin_email: ownerEmail,

    created_at: now,
    updated_at: now,
  };
}

async function insertRoutingAction(supabase: any, payload: AnyRecord) {
  const variants = [
    payload,
    {
      signal_id: payload.signal_id,
      item_id: payload.item_id,
      title: payload.title,
      note: payload.note,
      action: payload.action,
      priority: payload.priority,
      state_match: payload.state_match,
      strategy_match: payload.strategy_match,
      role_match: payload.role_match,
      urgency_reason: payload.urgency_reason,
      routing_summary: payload.routing_summary,
      confidence_score: payload.confidence_score,
      target_role: payload.target_role,
      target_email: payload.target_email,
      member_email: payload.member_email,
      routing_status: payload.routing_status,
      source: payload.source,
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
        .from(ROUTING_TABLE)
        .insert(variant)
        .select("*")
        .single();

      if (!error && data) {
        return {
          ok: true,
          data,
          keys: Object.keys(variant),
        };
      }

      if (error?.message) errors.push(error.message);
    } catch (error: any) {
      if (error?.message) errors.push(error.message);
    }
  }

  return {
    ok: false,
    error: errors[0] || "Could not generate routing action.",
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = requestEmail(request, body);

    if (!isOwnerRequest(request, email, body)) {
      return NextResponse.json(
        {
          ok: false,
          error: "Owner/admin access required to generate routing actions.",
        },
        { status: 403 }
      );
    }

    const ownerEmail = email || OWNER_EMAIL;
    const supabase = supabaseClient();
    const payload = makeRoutingPayload(body, ownerEmail);

    const result = await insertRoutingAction(supabase, payload);

    if (!result.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: result.error,
          table: ROUTING_TABLE,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      table: ROUTING_TABLE,
      routing_action: result.data,
      signal_id: payload.signal_id,
      item_id: payload.item_id,
      confidence_score: payload.confidence_score,
      routing_summary: payload.routing_summary,
      keys: result.keys,
      message: "Routing action generated safely for owner review.",
      note: "This generated a routing record only. It did not notify members, create introductions, or execute automation.",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: "Could not generate routing action.",
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    message: "Use POST as owner/admin to generate a routing action from deal/project/pain/signal context.",
    safety: "No notifications, no introductions, no automatic dispatch.",
    example: {
      title: "Mountain Lion",
      item_id: "example-item-id",
      state: "Georgia",
      strategy: "Fix & Flip",
      role_needed: "Buyer",
      priority: "high",
    },
  });
}
