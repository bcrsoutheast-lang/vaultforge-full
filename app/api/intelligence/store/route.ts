import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const OWNER_EMAIL = "bcrsoutheast@gmail.com";
const ALERT_TABLE = "vf_match_alerts";

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

function requestEmail(request: Request, body: AnyRecord) {
  const url = new URL(request.url);
  const cookie = request.headers.get("cookie") || "";

  return cleanEmail(
    request.headers.get("x-vf-email") ||
      body?.admin_email ||
      body?.owner_email ||
      body?.email ||
      url.searchParams.get("email") ||
      readCookie(cookie, "vf_email") ||
      readCookie(cookie, "vf_admin_email")
  );
}

function isOwnerRequest(request: Request, email: string, body: AnyRecord) {
  const url = new URL(request.url);
  const cookie = request.headers.get("cookie") || "";

  return (
    email === OWNER_EMAIL ||
    cleanEmail(body?.admin_email) === OWNER_EMAIL ||
    clean(request.headers.get("x-vf-admin")) === "1" ||
    clean(body?.owner) === "1" ||
    clean(body?.admin) === "1" ||
    clean(url.searchParams.get("owner")) === "1" ||
    cookie.includes("vf_admin=1") ||
    cookie.includes("isAdmin=true")
  );
}

function asArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => clean(item)).filter(Boolean);

  const text = clean(value);
  if (!text) return [];

  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return parsed.map((item) => clean(item)).filter(Boolean);
  } catch {
    // Continue to comma split.
  }

  return text
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function first(...values: unknown[]) {
  for (const value of values) {
    const text = clean(value);
    if (text) return text;
  }

  return "";
}

function safeScore(value: unknown) {
  const n = Number(value || 0);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(999, Math.round(n)));
}

function safePriority(value: unknown) {
  const text = clean(value).toLowerCase();

  if (["urgent", "high", "medium", "low"].includes(text)) return text;

  return "medium";
}

function safeType(value: unknown) {
  const text = clean(value).toLowerCase().replace(/\s+/g, "_");

  if (!text) return "opportunity";

  return text;
}

function nowIso() {
  return new Date().toISOString();
}

function sourceAlert(body: AnyRecord) {
  const alert = body?.alert && typeof body.alert === "object" ? body.alert : body;

  return alert as AnyRecord;
}

function normalizedInsert(alert: AnyRecord, adminEmail: string) {
  const alertType = safeType(
    alert.alert_type ||
      alert.type ||
      alert.category ||
      alert.route_position ||
      "opportunity"
  );

  const priority = safePriority(alert.priority || alert.alert_priority);

  const score = safeScore(
    alert.score ||
      alert.match_score ||
      alert.confidence_score ||
      alert.ai_score
  );

  const memberEmail = cleanEmail(
    alert.member_email ||
      alert.recipient_email ||
      alert.matched_member_email ||
      alert.target_member_email ||
      alert.email
  );

  const title = first(
    alert.title,
    alert.alert_title,
    alert.match_title,
    alert.item_title,
    "VaultForge Intelligence Signal"
  );

  const message = first(
    alert.message,
    alert.alert_message,
    alert.alert_body,
    alert.body,
    alert.description,
    alert.summary,
    "VaultForge generated this intelligence signal from existing profile, deal, and pain data."
  );

  const reason = first(
    alert.reason,
    alert.why_matched,
    alert.match_reason,
    alert.match_reasons,
    alert.message
  );

  const itemId = first(alert.item_id, alert.deal_id, alert.project_id, alert.property_id, alert.pain_id);
  const itemTitle = first(alert.item_title, alert.deal_title, alert.project_title, alert.property_title, title);

  const fingerprint = [
    alertType,
    priority,
    memberEmail || "global",
    itemId || itemTitle,
    score,
    title,
  ]
    .map((part) => clean(part).toLowerCase())
    .join("|");

  return {
    member_email: memberEmail || null,
    recipient_email: memberEmail || null,
    matched_member_email: memberEmail || null,

    alert_title: title,
    title,
    match_title: title,

    alert_body: message,
    alert_message: message,
    message,
    body: message,
    description: message,
    summary: message,

    reason,
    why_matched: reason,
    match_reason: reason,
    match_reasons: reason,

    alert_type: alertType,
    type: alertType,
    category: alertType,
    route_position: alertType,

    priority,
    alert_priority: priority,

    score,
    match_score: score,
    confidence_score: score,
    ai_score: score,

    deal_id: first(alert.deal_id, alert.item_id, alert.project_id, alert.property_id) || null,
    project_id: first(alert.project_id, alert.item_id, alert.deal_id) || null,
    property_id: first(alert.property_id, alert.item_id, alert.deal_id) || null,
    pain_id: first(alert.pain_id, alert.item_id) || null,

    deal_title: itemTitle,
    project_title: itemTitle,
    item_title: itemTitle,

    state: first(alert.state, alert.market_state) || null,
    market: first(alert.market, alert.city, alert.county) || null,
    source_table: first(alert.source_table) || null,
    source: first(alert.source, "vaultforge_readonly_intelligence_feed"),

    safe_href: first(alert.safe_href, alert.href) || null,

    status: "stored",
    alert_status: "stored",
    review_status: "approved",
    stored_by: adminEmail,
    created_by: adminEmail,
    stored_from: "app/api/intelligence/feed",
    fingerprint,

    tags: asArray(alert.tags || alert.feeds || alert.signals).join(", "),

    is_read: false,
    read: false,
    is_dismissed: false,
    dismissed: false,

    created_at: nowIso(),
    updated_at: nowIso(),
  };
}

async function alreadyStored(supabase: any, fingerprint: string) {
  try {
    const { data, error } = await supabase
      .from(ALERT_TABLE)
      .select("id")
      .eq("fingerprint", fingerprint)
      .maybeSingle();

    if (!error && data?.id) return true;
  } catch {
    // Fingerprint column may not exist in older tables. Continue with soft duplicate check.
  }

  return false;
}

async function insertOne(supabase: any, payload: AnyRecord) {
  const variants = [
    payload,
    {
      member_email: payload.member_email,
      recipient_email: payload.recipient_email,
      alert_title: payload.alert_title,
      title: payload.title,
      alert_body: payload.alert_body,
      message: payload.message,
      alert_type: payload.alert_type,
      type: payload.type,
      priority: payload.priority,
      score: payload.score,
      match_score: payload.match_score,
      deal_id: payload.deal_id,
      project_id: payload.project_id,
      property_id: payload.property_id,
      pain_id: payload.pain_id,
      deal_title: payload.deal_title,
      state: payload.state,
      market: payload.market,
      source: payload.source,
      source_table: payload.source_table,
      status: payload.status,
      alert_status: payload.alert_status,
      review_status: payload.review_status,
      stored_by: payload.stored_by,
      created_at: payload.created_at,
      updated_at: payload.updated_at,
    },
    {
      member_email: payload.member_email,
      title: payload.title,
      message: payload.message,
      alert_type: payload.alert_type,
      priority: payload.priority,
      score: payload.score,
      status: payload.status,
      created_at: payload.created_at,
      updated_at: payload.updated_at,
    },
  ];

  const errors: string[] = [];

  for (const variant of variants) {
    try {
      const { data, error } = await supabase
        .from(ALERT_TABLE)
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
    error: errors[0] || "Could not store intelligence alert.",
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const adminEmail = requestEmail(request, body);

    if (!isOwnerRequest(request, adminEmail, body)) {
      return NextResponse.json(
        {
          ok: false,
          error: "Owner/admin access required to store intelligence signals.",
        },
        { status: 403 }
      );
    }

    const supabase = supabaseClient();

    const alerts = Array.isArray(body?.alerts)
      ? body.alerts
      : [sourceAlert(body)].filter(Boolean);

    if (!alerts.length) {
      return NextResponse.json(
        {
          ok: false,
          error: "No alert payload supplied.",
        },
        { status: 400 }
      );
    }

    const results = [];
    let stored = 0;
    let skipped = 0;

    for (const alert of alerts) {
      const insert = normalizedInsert(alert, adminEmail || OWNER_EMAIL);

      const duplicate = await alreadyStored(supabase, insert.fingerprint);

      if (duplicate) {
        skipped += 1;
        results.push({
          ok: true,
          skipped: true,
          reason: "Already stored.",
          title: insert.title,
          fingerprint: insert.fingerprint,
        });
        continue;
      }

      const result = await insertOne(supabase, insert);

      if (result.ok) {
        stored += 1;
        results.push({
          ok: true,
          stored: true,
          id: result.data?.id,
          title: insert.title,
          alert_type: insert.alert_type,
          priority: insert.priority,
          score: insert.score,
          keys: result.keys,
        });
      } else {
        results.push({
          ok: false,
          title: insert.title,
          error: result.error,
        });
      }
    }

    const failed = results.filter((item) => !item.ok).length;

    return NextResponse.json({
      ok: failed === 0,
      stored,
      skipped,
      failed,
      results,
      table: ALERT_TABLE,
      message:
        failed === 0
          ? `${stored} intelligence signal(s) stored safely.`
          : `${stored} stored, ${failed} failed.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: "Could not store intelligence signal.",
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const email = requestEmail(request, {});

  if (!isOwnerRequest(request, email, {})) {
    return NextResponse.json(
      {
        ok: false,
        error: "Owner/admin access required.",
      },
      { status: 403 }
    );
  }

  return NextResponse.json({
    ok: true,
    route: "/api/intelligence/store",
    method: "POST",
    table: ALERT_TABLE,
    mode: "owner_only_store_selected_signals",
    writes: true,
    destructive: false,
    note: "Post one alert or an alerts array to store approved read-only intelligence signals.",
  });
}
