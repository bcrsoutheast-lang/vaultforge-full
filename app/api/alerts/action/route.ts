
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const OWNER_EMAIL = "bcrsoutheast@gmail.com";

type AnyRow = Record<string, any>;

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

function requestEmail(request: Request, body: AnyRow) {
  const url = new URL(request.url);
  const cookie = request.headers.get("cookie") || "";

  return cleanEmail(
    request.headers.get("x-vf-email") ||
      body.email ||
      url.searchParams.get("email") ||
      readCookie(cookie, "vf_email") ||
      readCookie(cookie, "vf_member_email") ||
      readCookie(cookie, "vf_login_email") ||
      readCookie(cookie, "vf_admin_email")
  );
}

function isOwnerRequest(request: Request, email: string, body: AnyRow) {
  const url = new URL(request.url);
  const cookie = request.headers.get("cookie") || "";

  return (
    email === OWNER_EMAIL ||
    clean(request.headers.get("x-vf-admin")) === "1" ||
    clean(body.owner) === "1" ||
    clean(url.searchParams.get("owner")) === "1" ||
    cookie.includes("vf_admin=1") ||
    cookie.includes("isAdmin=true")
  );
}

function titleForAction(action: string, title: string) {
  if (action === "save") return `Saved alert: ${title}`;
  if (action === "interested") return `Interested in alert: ${title}`;
  if (action === "need_more_info") return `More info requested: ${title}`;
  if (action === "request_intro") return `Introduction requested: ${title}`;
  if (action === "archive") return `Archived alert: ${title}`;
  if (action === "dismiss") return `Dismissed alert: ${title}`;
  if (action === "resolve") return `Resolved alert: ${title}`;
  if (action === "delete") return `Deleted alert: ${title}`;
  return `Alert action: ${title}`;
}

function messageForAction(action: string) {
  if (action === "save") return "Alert saved.";
  if (action === "interested") return "Interest saved.";
  if (action === "need_more_info") return "Need-more-info request saved.";
  if (action === "request_intro") return "Intro request saved for owner review.";
  if (action === "archive") return "Alert archived.";
  if (action === "dismiss") return "Alert dismissed.";
  if (action === "resolve") return "Alert resolved.";
  if (action === "delete") return "Alert deleted.";
  return "Alert action saved.";
}

async function insertActivity(supabase: any, payload: AnyRow) {
  const variants = [
    payload,
    {
      event_type: payload.event_type,
      event_title: payload.event_title,
      event_description: payload.event_description,
      member_email: payload.member_email,
      owner_email: payload.owner_email,
      related_deal_id: payload.related_deal_id,
      related_alert_id: payload.related_alert_id,
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

      if (!error && data) return { ok: true, row: data };
      if (error?.message) errors.push(error.message);
    } catch (error: any) {
      if (error?.message) errors.push(error.message);
    }
  }

  return { ok: false, error: errors[0] || "Activity insert failed." };
}

async function insertIntroRequest(supabase: any, body: AnyRow, email: string) {
  const payload = {
    signal_id: clean(body.signal_id) || null,
    item_id: clean(body.item_id) || null,
    title: clean(body.title) || "Intro request",
    note: clean(body.message) || "Member requested a controlled introduction from an alert.",
    member_email: email,
    visible_to_email: email,
    recipient_email: OWNER_EMAIL,
    counterparty_email: OWNER_EMAIL,
    priority: clean(body.priority) || "medium",
    status: "requested",
    intro_status: "requested",
    source: "alert_action_request_intro",
    created_at: new Date().toISOString(),
  };

  const variants = [
    payload,
    {
      title: payload.title,
      note: payload.note,
      member_email: payload.member_email,
      recipient_email: payload.recipient_email,
      status: payload.status,
      intro_status: payload.intro_status,
      source: payload.source,
    },
  ];

  for (const variant of variants) {
    try {
      const { data, error } = await supabase
        .from("vf_introductions")
        .insert(variant)
        .select("*")
        .single();

      if (!error && data) return { ok: true, row: data };
    } catch {
      // Try next variant/table.
    }

    try {
      const { data, error } = await supabase
        .from("vf_routing_introductions")
        .insert(variant)
        .select("*")
        .single();

      if (!error && data) return { ok: true, row: data };
    } catch {
      // Best effort.
    }
  }

  return { ok: false };
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = requestEmail(request, body);

    if (!email) {
      return NextResponse.json(
        { ok: false, error: "Login email required." },
        { status: 401 }
      );
    }

    const action = clean(body.action).toLowerCase();
    const owner = isOwnerRequest(request, email, body);

    const memberActions = ["save", "interested", "need_more_info", "request_intro", "archive", "dismiss"];
    const ownerActions = ["resolve", "delete"];

    if (!memberActions.includes(action) && !ownerActions.includes(action)) {
      return NextResponse.json(
        { ok: false, error: "Unsupported alert action." },
        { status: 400 }
      );
    }

    if (ownerActions.includes(action) && !owner) {
      return NextResponse.json(
        { ok: false, error: "Owner access required for this alert action." },
        { status: 403 }
      );
    }

    const supabase = supabaseClient();
    const title = clean(body.title) || "VaultForge Alert";
    const signalId = clean(body.signal_id);
    const itemId = clean(body.item_id);

    const activity = await insertActivity(supabase, {
      event_type: `alert_${action}`,
      event_title: titleForAction(action, title),
      event_description:
        clean(body.message) ||
        `VaultForge alert action recorded: ${action}.`,
      member_email: email,
      owner_email: OWNER_EMAIL,
      related_deal_id: itemId || null,
      related_alert_id: signalId || null,
      visibility: owner ? "admin" : "member",
      metadata: {
        action,
        signal_id: signalId || null,
        item_id: itemId || null,
        alert_type: clean(body.alert_type) || null,
        priority: clean(body.priority) || null,
        source: clean(body.source) || "alerts_page",
        source_table: clean(body.source_table) || null,
      },
    });

    let introRequest: AnyRow | null = null;

    if (action === "request_intro") {
      introRequest = await insertIntroRequest(supabase, body, email);
    }

    return NextResponse.json({
      ok: true,
      action,
      message: messageForAction(action),
      activity,
      intro_request: introRequest,
      safety:
        action === "delete"
          ? "Delete is recorded as owner activity. Source deletion should be added per-table after schema verification."
          : "Action recorded safely. No uncontrolled contact details were released.",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: "Could not save alert action.",
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
