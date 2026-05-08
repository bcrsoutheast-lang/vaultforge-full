import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const OWNER_EMAIL = "bcrsoutheast@gmail.com";
const ACTION_TABLE = "vf_routing_actions";

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
      body.admin_email ||
      body.owner_email ||
      body.email ||
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

function safeAction(value: unknown) {
  const text = clean(value).toLowerCase().replace(/\s+/g, "_");

  const allowed = [
    "watch",
    "route_to_buyer",
    "route_to_lender",
    "route_to_operator",
    "route_to_contractor",
    "route_to_jv",
    "needs_review",
    "high_priority",
    "archive",
    "manual_note",
  ];

  if (allowed.includes(text)) return text;

  return text || "manual_note";
}

function nowIso() {
  return new Date().toISOString();
}

function normalizedAction(body: AnyRecord, adminEmail: string) {
  const signalId = first(body.signal_id, body.signalId, body.alert_id, body.alertId);
  const itemId = first(body.item_id, body.itemId, body.deal_id, body.project_id, body.property_id, body.pain_id);
  const action = safeAction(body.action || body.routing_action);
  const note = first(body.note, body.notes, body.message, body.reason);
  const targetRole = first(body.target_role, body.targetRole, body.role);
  const targetEmail = cleanEmail(body.target_email || body.targetEmail || body.member_email || body.recipient_email);

  const title = first(
    body.title,
    body.signal_title,
    body.alert_title,
    body.deal_title,
    body.item_title,
    `${action.replace(/_/g, " ")}${signalId ? ` for ${signalId}` : ""}`
  );

  const fingerprint = [
    signalId,
    itemId,
    action,
    targetRole,
    targetEmail,
    title,
  ]
    .map((part) => clean(part).toLowerCase())
    .join("|");

  return {
    signal_id: signalId || null,
    alert_id: signalId || null,
    item_id: itemId || null,
    deal_id: first(body.deal_id, itemId) || null,
    project_id: first(body.project_id) || null,
    property_id: first(body.property_id) || null,
    pain_id: first(body.pain_id) || null,

    action,
    routing_action: action,
    status: "logged",
    routing_status: "logged",

    title,
    note,
    notes: note,
    reason: note,

    target_role: targetRole || null,
    target_email: targetEmail || null,
    member_email: targetEmail || null,

    priority: first(body.priority, "medium"),
    source: first(body.source, "routing_room"),
    source_table: first(body.source_table) || null,

    created_by: adminEmail,
    admin_email: adminEmail,
    owner_email: adminEmail,

    fingerprint,

    created_at: nowIso(),
    updated_at: nowIso(),
  };
}

async function insertAction(supabase: any, payload: AnyRecord) {
  const variants = [
    payload,
    {
      signal_id: payload.signal_id,
      item_id: payload.item_id,
      action: payload.action,
      status: payload.status,
      title: payload.title,
      note: payload.note,
      target_role: payload.target_role,
      target_email: payload.target_email,
      priority: payload.priority,
      source: payload.source,
      created_by: payload.created_by,
      created_at: payload.created_at,
      updated_at: payload.updated_at,
    },
    {
      signal_id: payload.signal_id,
      action: payload.action,
      title: payload.title,
      note: payload.note,
      created_by: payload.created_by,
      created_at: payload.created_at,
    },
  ];

  const errors: string[] = [];

  for (const variant of variants) {
    try {
      const { data, error } = await supabase
        .from(ACTION_TABLE)
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
    error: errors[0] || "Could not log routing action.",
  };
}

function normalizeRow(row: AnyRecord) {
  return {
    id: row.id,
    signal_id: first(row.signal_id, row.alert_id),
    item_id: first(row.item_id, row.deal_id, row.project_id, row.property_id, row.pain_id),
    action: first(row.action, row.routing_action),
    status: first(row.status, row.routing_status),
    title: first(row.title),
    note: first(row.note, row.notes, row.reason),
    target_role: first(row.target_role),
    target_email: first(row.target_email, row.member_email),
    priority: first(row.priority),
    source: first(row.source),
    created_by: first(row.created_by, row.admin_email, row.owner_email),
    created_at: first(row.created_at),
    updated_at: first(row.updated_at),
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
          error: "Owner/admin access required to log routing actions.",
        },
        { status: 403 }
      );
    }

    const supabase = supabaseClient();
    const payload = normalizedAction(body, adminEmail || OWNER_EMAIL);

    const result = await insertAction(supabase, payload);

    if (!result.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: result.error,
          table: ACTION_TABLE,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      action: normalizeRow(result.data),
      table: ACTION_TABLE,
      keys: result.keys,
      message: "Routing action logged safely.",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: "Could not log routing action.",
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const email = requestEmail(request);

    if (!email) {
      return NextResponse.json(
        {
          ok: false,
          error: "Login email required.",
        },
        { status: 401 }
      );
    }

    const owner = isOwnerRequest(request, email);
    const url = new URL(request.url);
    const signalId = first(url.searchParams.get("signal_id"), url.searchParams.get("signalId"));
    const itemId = first(url.searchParams.get("item_id"), url.searchParams.get("itemId"));
    const supabase = supabaseClient();

    let query = supabase
      .from(ACTION_TABLE)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(owner ? 200 : 50);

    if (signalId) {
      query = query.eq("signal_id", signalId);
    }

    if (itemId) {
      query = query.eq("item_id", itemId);
    }

    if (!owner) {
      query = query.or(`target_email.eq.${email},member_email.eq.${email}`);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        {
          ok: false,
          error: error.message,
          table: ACTION_TABLE,
        },
        { status: 500 }
      );
    }

    const actions = Array.isArray(data) ? data.map(normalizeRow) : [];

    return NextResponse.json({
      ok: true,
      owner,
      email,
      table: ACTION_TABLE,
      actions,
      counts: {
        actions: actions.length,
      },
      note: owner
        ? "Owner/global routing action log."
        : "Member-safe routing actions tied to this email.",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: "Could not load routing actions.",
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
