import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const OWNER_EMAIL = "bcrsoutheast@gmail.com";
const RESPONSE_TABLE = "vf_routing_responses";

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
      body.member_email ||
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

function safeResponse(value: unknown) {
  const text = clean(value).toLowerCase().replace(/\s+/g, "_");

  const allowed = [
    "interested",
    "need_more_info",
    "pass",
    "watch",
    "request_call",
    "request_intro",
  ];

  if (allowed.includes(text)) return text;

  return text || "interested";
}

function nowIso() {
  return new Date().toISOString();
}

function normalizedResponse(body: AnyRecord, memberEmail: string) {
  const signalId = first(body.signal_id, body.signalId, body.alert_id, body.alertId);
  const actionId = first(body.action_id, body.actionId, body.routing_action_id);
  const itemId = first(body.item_id, body.itemId, body.deal_id, body.project_id, body.property_id, body.pain_id);
  const response = safeResponse(body.response || body.member_response || body.status);
  const note = first(body.note, body.notes, body.message);
  const title = first(body.title, body.signal_title, body.action_title, body.deal_title, "VaultForge routing response");

  const fingerprint = [
    memberEmail,
    signalId,
    actionId,
    itemId,
    response,
  ]
    .map((part) => clean(part).toLowerCase())
    .join("|");

  return {
    member_email: memberEmail,
    email: memberEmail,
    signal_id: signalId || null,
    alert_id: signalId || null,
    action_id: actionId || null,
    routing_action_id: actionId || null,
    item_id: itemId || null,
    deal_id: first(body.deal_id, itemId) || null,
    project_id: first(body.project_id) || null,
    property_id: first(body.property_id) || null,
    pain_id: first(body.pain_id) || null,

    response,
    member_response: response,
    status: response,
    response_status: response,

    title,
    note,
    notes: note,
    message: note,

    source: first(body.source, "routing_inbox"),
    priority: first(body.priority, "medium"),
    fingerprint,

    created_at: nowIso(),
    updated_at: nowIso(),
  };
}

async function insertResponse(supabase: any, payload: AnyRecord) {
  const variants = [
    payload,
    {
      member_email: payload.member_email,
      signal_id: payload.signal_id,
      action_id: payload.action_id,
      item_id: payload.item_id,
      response: payload.response,
      status: payload.status,
      title: payload.title,
      note: payload.note,
      source: payload.source,
      created_at: payload.created_at,
      updated_at: payload.updated_at,
    },
    {
      member_email: payload.member_email,
      signal_id: payload.signal_id,
      response: payload.response,
      title: payload.title,
      note: payload.note,
      created_at: payload.created_at,
    },
  ];

  const errors: string[] = [];

  for (const variant of variants) {
    try {
      const { data, error } = await supabase
        .from(RESPONSE_TABLE)
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
    error: errors[0] || "Could not save routing response.",
  };
}

function normalizeRow(row: AnyRecord) {
  return {
    id: row.id,
    member_email: first(row.member_email, row.email),
    signal_id: first(row.signal_id, row.alert_id),
    action_id: first(row.action_id, row.routing_action_id),
    item_id: first(row.item_id, row.deal_id, row.project_id, row.property_id, row.pain_id),
    response: first(row.response, row.member_response, row.status, row.response_status),
    title: first(row.title),
    note: first(row.note, row.notes, row.message),
    source: first(row.source),
    priority: first(row.priority),
    created_at: first(row.created_at),
    updated_at: first(row.updated_at),
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const memberEmail = requestEmail(request, body);

    if (!memberEmail) {
      return NextResponse.json(
        {
          ok: false,
          error: "Member email required.",
        },
        { status: 401 }
      );
    }

    const supabase = supabaseClient();
    const payload = normalizedResponse(body, memberEmail);
    const result = await insertResponse(supabase, payload);

    if (!result.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: result.error,
          table: RESPONSE_TABLE,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      response: normalizeRow(result.data),
      table: RESPONSE_TABLE,
      keys: result.keys,
      message: "Routing response saved safely.",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: "Could not save routing response.",
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
    const actionId = first(url.searchParams.get("action_id"), url.searchParams.get("actionId"));
    const itemId = first(url.searchParams.get("item_id"), url.searchParams.get("itemId"));

    const supabase = supabaseClient();

    let query = supabase
      .from(RESPONSE_TABLE)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(owner ? 200 : 75);

    if (signalId) query = query.eq("signal_id", signalId);
    if (actionId) query = query.eq("action_id", actionId);
    if (itemId) query = query.eq("item_id", itemId);

    if (!owner) {
      query = query.eq("member_email", email);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        {
          ok: false,
          error: error.message,
          table: RESPONSE_TABLE,
        },
        { status: 500 }
      );
    }

    const responses = Array.isArray(data) ? data.map(normalizeRow) : [];

    return NextResponse.json({
      ok: true,
      owner,
      email,
      table: RESPONSE_TABLE,
      responses,
      counts: {
        responses: responses.length,
        interested: responses.filter((item) => item.response === "interested").length,
        need_more_info: responses.filter((item) => item.response === "need_more_info").length,
        pass: responses.filter((item) => item.response === "pass").length,
        request_intro: responses.filter((item) => item.response === "request_intro").length,
        request_call: responses.filter((item) => item.response === "request_call").length,
      },
      note: owner
        ? "Owner/global routing responses."
        : "Member-safe routing responses tied to this email.",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: "Could not load routing responses.",
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
