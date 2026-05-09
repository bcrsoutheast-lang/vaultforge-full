import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const OWNER_EMAIL = "bcrsoutheast@gmail.com";
const INTRO_TABLE = "vf_routing_introductions";

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

function safeIntroStatus(value: unknown) {
  const text = clean(value).toLowerCase().replace(/\s+/g, "_");

  const allowed = [
    "draft",
    "approved",
    "ready",
    "sent",
    "declined",
    "paused",
    "needs_review",
  ];

  if (allowed.includes(text)) return text;

  return "draft";
}

function nowIso() {
  return new Date().toISOString();
}

function normalizeIntro(body: AnyRecord, adminEmail: string) {
  const responseId = first(body.response_id, body.responseId);
  const signalId = first(body.signal_id, body.signalId, body.alert_id, body.alertId);
  const actionId = first(body.action_id, body.actionId, body.routing_action_id);
  const itemId = first(body.item_id, body.itemId, body.deal_id, body.project_id, body.property_id, body.pain_id);

  const memberEmail = cleanEmail(
    body.member_email ||
      body.responding_member_email ||
      body.target_email ||
      body.recipient_email
  );

  const introToEmail = cleanEmail(
    body.intro_to_email ||
      body.counterparty_email ||
      body.owner_contact_email ||
      body.deal_contact_email
  );

  const introType = first(body.intro_type, body.type, body.route_type, "controlled_intro");
  const status = safeIntroStatus(body.status || body.intro_status);
  const title = first(body.title, body.signal_title, body.deal_title, "VaultForge controlled introduction");
  const note = first(body.note, body.notes, body.message, body.reason);

  const fingerprint = [
    responseId,
    signalId,
    actionId,
    itemId,
    memberEmail,
    introToEmail,
    introType,
  ]
    .map((part) => clean(part).toLowerCase())
    .join("|");

  return {
    response_id: responseId || null,
    routing_response_id: responseId || null,
    signal_id: signalId || null,
    alert_id: signalId || null,
    action_id: actionId || null,
    routing_action_id: actionId || null,
    item_id: itemId || null,
    deal_id: first(body.deal_id, itemId) || null,
    project_id: first(body.project_id) || null,
    property_id: first(body.property_id) || null,
    pain_id: first(body.pain_id) || null,

    member_email: memberEmail || null,
    responding_member_email: memberEmail || null,
    intro_to_email: introToEmail || null,
    counterparty_email: introToEmail || null,

    intro_type: introType,
    type: introType,
    status,
    intro_status: status,
    review_status: status,

    title,
    intro_title: title,
    note,
    notes: note,
    message: note,

    source: first(body.source, "admin_routing_responses"),
    priority: first(body.priority, "medium"),

    created_by: adminEmail,
    admin_email: adminEmail,
    owner_email: adminEmail,

    sent_at: null,
    dispatched_at: null,
    fingerprint,

    created_at: nowIso(),
    updated_at: nowIso(),
  };
}

async function insertIntro(supabase: any, payload: AnyRecord) {
  const variants = [
    payload,
    {
      response_id: payload.response_id,
      signal_id: payload.signal_id,
      action_id: payload.action_id,
      item_id: payload.item_id,
      member_email: payload.member_email,
      intro_to_email: payload.intro_to_email,
      intro_type: payload.intro_type,
      status: payload.status,
      title: payload.title,
      note: payload.note,
      source: payload.source,
      priority: payload.priority,
      created_by: payload.created_by,
      created_at: payload.created_at,
      updated_at: payload.updated_at,
    },
    {
      signal_id: payload.signal_id,
      member_email: payload.member_email,
      intro_type: payload.intro_type,
      status: payload.status,
      title: payload.title,
      note: payload.note,
      created_at: payload.created_at,
    },
  ];

  const errors: string[] = [];

  for (const variant of variants) {
    try {
      const { data, error } = await supabase
        .from(INTRO_TABLE)
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
    error: errors[0] || "Could not create controlled introduction.",
  };
}

function normalizeRow(row: AnyRecord) {
  return {
    id: row.id,
    response_id: first(row.response_id, row.routing_response_id),
    signal_id: first(row.signal_id, row.alert_id),
    action_id: first(row.action_id, row.routing_action_id),
    item_id: first(row.item_id, row.deal_id, row.project_id, row.property_id, row.pain_id),
    member_email: first(row.member_email, row.responding_member_email),
    intro_to_email: first(row.intro_to_email, row.counterparty_email),
    intro_type: first(row.intro_type, row.type),
    status: first(row.status, row.intro_status, row.review_status),
    title: first(row.title, row.intro_title),
    note: first(row.note, row.notes, row.message),
    source: first(row.source),
    priority: first(row.priority),
    created_by: first(row.created_by, row.admin_email, row.owner_email),
    sent_at: first(row.sent_at, row.dispatched_at),
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
          error: "Owner/admin access required to create controlled introductions.",
        },
        { status: 403 }
      );
    }

    const supabase = supabaseClient();
    const payload = normalizeIntro(body, adminEmail || OWNER_EMAIL);
    const result = await insertIntro(supabase, payload);

    if (!result.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: result.error,
          table: INTRO_TABLE,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      introduction: normalizeRow(result.data),
      table: INTRO_TABLE,
      keys: result.keys,
      message: "Controlled introduction drafted safely. No notification was sent.",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: "Could not create controlled introduction.",
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
    const responseId = first(url.searchParams.get("response_id"), url.searchParams.get("responseId"));
    const itemId = first(url.searchParams.get("item_id"), url.searchParams.get("itemId"));

    const supabase = supabaseClient();

    let query = supabase
      .from(INTRO_TABLE)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(owner ? 200 : 75);

    if (signalId) query = query.eq("signal_id", signalId);
    if (responseId) query = query.eq("response_id", responseId);
    if (itemId) query = query.eq("item_id", itemId);

    if (!owner) {
      query = query.or(`member_email.eq.${email},responding_member_email.eq.${email},intro_to_email.eq.${email},counterparty_email.eq.${email}`);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        {
          ok: false,
          error: error.message,
          table: INTRO_TABLE,
        },
        { status: 500 }
      );
    }

    const introductions = Array.isArray(data) ? data.map(normalizeRow) : [];

    return NextResponse.json({
      ok: true,
      owner,
      email,
      table: INTRO_TABLE,
      introductions,
      counts: {
        introductions: introductions.length,
        draft: introductions.filter((item) => item.status === "draft").length,
        approved: introductions.filter((item) => item.status === "approved").length,
        ready: introductions.filter((item) => item.status === "ready").length,
        sent: introductions.filter((item) => item.status === "sent").length,
      },
      note: owner
        ? "Owner/global controlled introductions."
        : "Member-safe controlled introductions tied to this email.",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: "Could not load controlled introductions.",
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
