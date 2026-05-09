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

function safeStatus(value: unknown) {
  const text = clean(value).toLowerCase().replace(/\s+/g, "_");

  const allowed = [
    "draft",
    "needs_review",
    "approved",
    "ready",
    "paused",
    "declined",
    "sent",
  ];

  if (allowed.includes(text)) return text;

  return "needs_review";
}

function first(...values: unknown[]) {
  for (const value of values) {
    const text = clean(value);
    if (text) return text;
  }

  return "";
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

async function updateIntro(supabase: any, id: string, payload: AnyRecord) {
  const variants = [
    payload,
    {
      status: payload.status,
      intro_status: payload.intro_status,
      review_status: payload.review_status,
      note: payload.note,
      notes: payload.notes,
      updated_at: payload.updated_at,
    },
    {
      status: payload.status,
      note: payload.note,
      updated_at: payload.updated_at,
    },
  ];

  const errors: string[] = [];

  for (const variant of variants) {
    try {
      const { data, error } = await supabase
        .from(INTRO_TABLE)
        .update(variant)
        .eq("id", id)
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
    error: errors[0] || "Could not update introduction status.",
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
          error: "Owner/admin access required to update introduction status.",
        },
        { status: 403 }
      );
    }

    const id = first(body.id, body.introduction_id, body.introductionId);

    if (!id) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing introduction id.",
        },
        { status: 400 }
      );
    }

    const status = safeStatus(body.status || body.intro_status || body.review_status);
    const note = first(body.note, body.notes, body.message);

    const payload = {
      status,
      intro_status: status,
      review_status: status,
      note,
      notes: note,
      message: note,
      reviewed_by: adminEmail,
      updated_by: adminEmail,
      updated_at: new Date().toISOString(),
      ...(status === "sent" ? { sent_at: new Date().toISOString() } : {}),
    };

    const supabase = supabaseClient();
    const result = await updateIntro(supabase, id, payload);

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
      message: `Introduction marked ${status}. No notification was sent.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: "Could not update introduction status.",
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
