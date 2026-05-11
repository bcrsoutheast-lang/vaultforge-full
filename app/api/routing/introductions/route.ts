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

function nowIso() {
  return new Date().toISOString();
}

function metadataOf(row: AnyRecord) {
  return typeof row.metadata === "object" && row.metadata ? row.metadata : {};
}

function resolveOwnerEmail(row: AnyRecord, fallbackEmail = "") {
  const metadata = metadataOf(row);
  const candidates = [
    row.owner_email,
    row.created_by_email,
    row.submitted_by_email,
    row.creator_email,
    row.submitted_by,
    row.user_email,
    row.member_email,
    row.email,
    metadata.owner_email,
    metadata.created_by_email,
    metadata.submitted_by_email,
    metadata.creator_email,
    metadata.submitted_by,
    metadata.user_email,
    metadata.member_email,
    metadata.email,
    fallbackEmail,
  ]
    .map(cleanEmail)
    .filter((email) => email.includes("@"));

  return candidates.find((email) => email !== OWNER_EMAIL) || candidates[0] || OWNER_EMAIL;
}

function normalizeIntro(row: AnyRecord) {
  const metadata = metadataOf(row);
  const id = first(row.id, row.introduction_id, row.intro_id);
  const signalId = first(row.signal_id, row.alert_id, metadata.signal_id, metadata.alert_id);
  const itemId = first(row.item_id, row.deal_id, row.project_id, row.property_id, row.pain_id, metadata.item_id, metadata.deal_id, metadata.project_id, metadata.property_id, metadata.pain_id);
  const status = first(row.intro_status, row.status, "staged");

  const visibleTo = cleanEmail(first(row.visible_to_email, row.member_email, row.recipient_email, row.intro_to_email, row.responding_member_email, metadata.visible_to_email, metadata.member_email, metadata.recipient_email, metadata.intro_to_email, metadata.responding_member_email));

  const ownerEmail = resolveOwnerEmail(row);

  const counterparty = cleanEmail(first(row.counterparty_email, row.owner_email, row.created_by_email, row.submitted_by_email, row.sender_email, row.recipient_email, row.intro_to_email, row.member_email, metadata.counterparty_email, metadata.owner_email, metadata.created_by_email, metadata.submitted_by_email, metadata.sender_email, metadata.recipient_email, metadata.intro_to_email, metadata.member_email, ownerEmail));

  return {
    id,
    introduction_id: id,
    intro_id: id,
    routing_action_id: first(row.routing_action_id),
    signal_id: signalId,
    alert_id: signalId,
    item_id: itemId,
    deal_id: first(row.deal_id, itemId),
    project_id: first(row.project_id),
    property_id: first(row.property_id),
    pain_id: first(row.pain_id),

    title: first(row.title, "Controlled introduction"),
    note: first(row.note, row.notes, row.message),
    notes: first(row.notes, row.note),
    message: first(row.message, row.note),

    intro_type: first(row.intro_type, row.type, "controlled_intro"),
    intro_status: status,
    status,

    priority: first(row.priority, "medium"),
    source: first(row.source, "controlled_introduction"),

    sender_email: cleanEmail(first(row.sender_email, ownerEmail)),
    recipient_email: cleanEmail(first(row.recipient_email, visibleTo)),
    member_email: cleanEmail(first(row.member_email, visibleTo)),
    intro_to_email: cleanEmail(first(row.intro_to_email, row.recipient_email, visibleTo)),
    visible_to_email: visibleTo,
    responding_member_email: cleanEmail(row.responding_member_email),
    counterparty_email: counterparty,

    staged_by_email: cleanEmail(first(row.staged_by_email, row.created_by, row.admin_email, row.owner_email, ownerEmail)),
    created_by: cleanEmail(first(row.created_by, ownerEmail)),
    owner_email: ownerEmail,
    admin_email: cleanEmail(first(row.admin_email, row.staged_by_email, OWNER_EMAIL)),

    approved: Boolean(row.approved),
    paused: Boolean(row.paused),
    sent: Boolean(row.sent),
    sent_at: first(row.sent_at),

    metadata: row.metadata || {},

    created_at: first(row.created_at),
    updated_at: first(row.updated_at),
  };
}

function makeIntroPayload(body: AnyRecord, ownerEmail: string) {
  const now = nowIso();

  const id = first(body.introduction_id, body.intro_id);
  const signalId = first(body.signal_id, body.signalId, body.alert_id, body.alertId);
  const itemId = first(body.item_id, body.itemId, body.deal_id, body.project_id, body.property_id, body.pain_id);
  const visibleTo = cleanEmail(first(body.visible_to_email, body.member_email, body.recipient_email, body.intro_to_email, body.target_email));

  const resolvedOwner = resolveOwnerEmail(body, ownerEmail);
  const counterparty = cleanEmail(first(body.counterparty_email, body.owner_email, body.created_by_email, body.submitted_by_email, body.sender_email, resolvedOwner));

  const title = first(body.title, body.subject, signalId ? `Controlled introduction for ${signalId}` : "Controlled introduction");
  const note = first(body.note, body.notes, body.message, "Owner-staged controlled introduction. No notification has been sent.");
  const status = first(body.status, body.intro_status, "staged");

  return {
    ...(id ? { id } : {}),

    routing_action_id: first(body.routing_action_id, body.routingActionId) || null,

    signal_id: signalId || null,
    alert_id: signalId || null,
    item_id: itemId || null,
    deal_id: first(body.deal_id, itemId) || null,
    project_id: first(body.project_id) || null,
    property_id: first(body.property_id) || null,
    pain_id: first(body.pain_id) || null,

    title,
    note,
    notes: note,
    message: note,

    intro_type: first(body.intro_type, body.type, "controlled_intro"),
    intro_status: status,
    status,

    priority: first(body.priority, "medium"),
    source: first(body.source, "owner_staged_intro"),

    sender_email: resolvedOwner || ownerEmail || null,
    recipient_email: visibleTo || null,
    member_email: visibleTo || null,
    intro_to_email: visibleTo || null,
    visible_to_email: visibleTo || null,
    responding_member_email: cleanEmail(body.responding_member_email) || null,
    counterparty_email: counterparty || null,

    staged_by_email: ownerEmail || OWNER_EMAIL,
    created_by: ownerEmail || OWNER_EMAIL,
    owner_email: resolvedOwner || ownerEmail || OWNER_EMAIL,
    admin_email: ownerEmail || OWNER_EMAIL,

    approved: Boolean(body.approved),
    paused: Boolean(body.paused),
    sent: Boolean(body.sent),
    sent_at: body.sent ? now : null,

    metadata: {
      ...(body.metadata && typeof body.metadata === "object" ? body.metadata : {}),
      owner_email: resolvedOwner || ownerEmail || OWNER_EMAIL,
      counterparty_email: counterparty || null,
      safety: "staged_only_no_notification",
    },

    created_at: now,
    updated_at: now,
  };
}

async function insertIntro(supabase: any, payload: AnyRecord) {
  const variants = [
    payload,
    {
      routing_action_id: payload.routing_action_id,
      signal_id: payload.signal_id,
      item_id: payload.item_id,
      title: payload.title,
      note: payload.note,
      intro_type: payload.intro_type,
      intro_status: payload.intro_status,
      status: payload.status,
      priority: payload.priority,
      source: payload.source,
      sender_email: payload.sender_email,
      recipient_email: payload.recipient_email,
      member_email: payload.member_email,
      intro_to_email: payload.intro_to_email,
      visible_to_email: payload.visible_to_email,
      counterparty_email: payload.counterparty_email,
      staged_by_email: payload.staged_by_email,
      created_by: payload.created_by,
      owner_email: payload.owner_email,
      admin_email: payload.admin_email,
      approved: payload.approved,
      paused: payload.paused,
      sent: payload.sent,
      metadata: payload.metadata,
      created_at: payload.created_at,
      updated_at: payload.updated_at,
    },
    {
      signal_id: payload.signal_id,
      item_id: payload.item_id,
      title: payload.title,
      note: payload.note,
      intro_status: payload.intro_status,
      visible_to_email: payload.visible_to_email,
      member_email: payload.member_email,
      counterparty_email: payload.counterparty_email,
      staged_by_email: payload.staged_by_email,
      owner_email: payload.owner_email,
      created_at: payload.created_at,
      updated_at: payload.updated_at,
    },
  ];

  const errors: string[] = [];

  for (const variant of variants) {
    try {
      const { data, error } = await supabase.from(INTRO_TABLE).insert(variant).select("*").single();

      if (!error && data) return { ok: true, data, keys: Object.keys(variant) };
      if (error?.message) errors.push(error.message);
    } catch (error: any) {
      if (error?.message) errors.push(error.message);
    }
  }

  return { ok: false, error: errors[0] || "Could not stage controlled introduction." };
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = requestEmail(request, body);

    if (!isOwnerRequest(request, email, body)) {
      return NextResponse.json({ ok: false, error: "Owner/admin access required to stage controlled introductions." }, { status: 403 });
    }

    const ownerEmail = email || OWNER_EMAIL;
    const payload = makeIntroPayload(body, ownerEmail);

    if (!payload.visible_to_email && !payload.recipient_email && !payload.member_email) {
      return NextResponse.json({ ok: false, error: "A visible/member/recipient email is required to stage an introduction." }, { status: 400 });
    }

    const supabase = supabaseClient();
    const result = await insertIntro(supabase, payload);

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error, table: INTRO_TABLE }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      table: INTRO_TABLE,
      introduction: normalizeIntro(result.data),
      keys: result.keys,
      message: "Controlled introduction staged safely.",
      note: "No notification was sent. No auto-dispatch occurred.",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: "Could not stage controlled introduction.",
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
      return NextResponse.json({ ok: false, error: "Login email required." }, { status: 401 });
    }

    const owner = isOwnerRequest(request, email);
    const url = new URL(request.url);
    const signalId = first(url.searchParams.get("signal_id"), url.searchParams.get("signalId"));
    const itemId = first(url.searchParams.get("item_id"), url.searchParams.get("itemId"));
    const introId = first(url.searchParams.get("intro_id"), url.searchParams.get("introduction_id"));

    const supabase = supabaseClient();

    let query = supabase.from(INTRO_TABLE).select("*").order("created_at", { ascending: false }).limit(owner ? 250 : 100);

    if (signalId) query = query.eq("signal_id", signalId);
    if (itemId) query = query.eq("item_id", itemId);
    if (introId) query = query.eq("id", introId);

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ ok: false, error: error.message, table: INTRO_TABLE }, { status: 500 });
    }

    let introductions = Array.isArray(data) ? data.map(normalizeIntro) : [];

    if (!owner) {
      introductions = introductions.filter((intro: AnyRecord) => {
        const emails = [
          intro.visible_to_email,
          intro.member_email,
          intro.recipient_email,
          intro.intro_to_email,
          intro.responding_member_email,
          intro.counterparty_email,
          intro.owner_email,
        ]
          .map(cleanEmail)
          .filter(Boolean);

        return emails.includes(email);
      });
    }

    return NextResponse.json({
      ok: true,
      owner,
      email,
      table: INTRO_TABLE,
      introductions,
      counts: {
        introductions: introductions.length,
        staged: introductions.filter((item: AnyRecord) => item.status === "staged").length,
        ready: introductions.filter((item: AnyRecord) => item.status === "ready").length,
        approved: introductions.filter((item: AnyRecord) => item.approved === true || item.status === "approved").length,
        sent: introductions.filter((item: AnyRecord) => item.sent === true || item.status === "sent").length,
        paused: introductions.filter((item: AnyRecord) => item.paused === true || item.status === "paused").length,
      },
      resolver: "universal_owner_counterparty_visible_to",
      note: owner ? "Owner/global controlled introductions." : "Member-safe controlled introductions visible to this email.",
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
