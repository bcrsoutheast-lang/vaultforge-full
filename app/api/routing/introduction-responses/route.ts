import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const OWNER_EMAIL = "bcrsoutheast@gmail.com";
const RESPONSE_TABLE = "vf_introduction_responses";

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
      body.member_email ||
      body.responder_email ||
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

function normalizeResponse(value: unknown) {
  const text = clean(value).toLowerCase().replace(/\s+/g, "_");

  const allowed = [
    "interested",
    "not_interested",
    "need_more_info",
    "call_requested",
    "reviewing",
    "maybe",
  ];

  if (allowed.includes(text)) return text;

  if (text.includes("more")) return "need_more_info";
  if (text.includes("call")) return "call_requested";
  if (text.includes("no") || text.includes("not")) return "not_interested";
  if (text.includes("yes") || text.includes("interested")) return "interested";

  return text || "reviewing";
}

function normalizeRow(row: AnyRecord) {
  const introId = first(row.introduction_id, row.intro_id);
  const memberEmail = cleanEmail(first(row.member_email, row.responder_email, row.responding_member_email));
  const counterparty = cleanEmail(first(row.counterparty_email, row.owner_email, row.admin_email));

  return {
    id: first(row.id),
    introduction_id: introId,
    intro_id: first(row.intro_id, introId),
    signal_id: first(row.signal_id),
    item_id: first(row.item_id),
    title: first(row.title, "Introduction response"),
    note: first(row.note, row.notes),
    notes: first(row.notes, row.note),
    response: normalizeResponse(row.response),
    responder_email: cleanEmail(first(row.responder_email, memberEmail)),
    responding_member_email: cleanEmail(first(row.responding_member_email, memberEmail)),
    member_email: memberEmail,
    counterparty_email: counterparty,
    owner_email: cleanEmail(row.owner_email),
    admin_email: cleanEmail(row.admin_email),
    priority: first(row.priority, "medium"),
    source: first(row.source, "intro_response"),
    metadata: row.metadata || {},
    created_at: first(row.created_at),
    updated_at: first(row.updated_at),
  };
}

function makePayload(body: AnyRecord, email: string, owner: boolean) {
  const now = new Date().toISOString();

  const introId = first(body.introduction_id, body.intro_id, body.introId);
  const response = normalizeResponse(body.response);
  const responderEmail = cleanEmail(first(body.responder_email, body.member_email, email));
  const counterpartyEmail = cleanEmail(first(body.counterparty_email, body.owner_email, body.admin_email, OWNER_EMAIL));

  return {
    introduction_id: introId || null,
    intro_id: introId || null,
    signal_id: first(body.signal_id, body.signalId) || null,
    item_id: first(body.item_id, body.itemId, body.deal_id, body.project_id, body.property_id, body.pain_id) || null,

    title: first(body.title, `Introduction response: ${response}`),
    note: first(body.note, body.notes, body.message),
    notes: first(body.notes, body.note, body.message),

    response,
    responder_email: responderEmail,
    responding_member_email: responderEmail,
    member_email: responderEmail,

    counterparty_email: counterpartyEmail || null,
    owner_email: cleanEmail(first(body.owner_email, owner ? email : OWNER_EMAIL)) || null,
    admin_email: cleanEmail(first(body.admin_email, owner ? email : "")) || null,

    priority: first(body.priority, "medium"),
    source: first(body.source, "member_intro_response"),

    metadata: {
      ...(body.metadata && typeof body.metadata === "object" ? body.metadata : {}),
      safety: "response_record_only_no_notification",
    },

    created_at: now,
    updated_at: now,
  };
}

async function insertResponse(supabase: any, payload: AnyRecord) {
  const variants = [
    payload,
    {
      introduction_id: payload.introduction_id,
      intro_id: payload.intro_id,
      signal_id: payload.signal_id,
      item_id: payload.item_id,
      title: payload.title,
      note: payload.note,
      response: payload.response,
      responder_email: payload.responder_email,
      responding_member_email: payload.responding_member_email,
      member_email: payload.member_email,
      counterparty_email: payload.counterparty_email,
      owner_email: payload.owner_email,
      admin_email: payload.admin_email,
      priority: payload.priority,
      source: payload.source,
      metadata: payload.metadata,
      created_at: payload.created_at,
      updated_at: payload.updated_at,
    },
    {
      introduction_id: payload.introduction_id,
      response: payload.response,
      responder_email: payload.responder_email,
      member_email: payload.member_email,
      notes: payload.notes,
      created_at: payload.created_at,
      updated_at: payload.updated_at,
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
        return { ok: true, data, keys: Object.keys(variant) };
      }

      if (error?.message) errors.push(error.message);
    } catch (error: any) {
      if (error?.message) errors.push(error.message);
    }
  }

  return {
    ok: false,
    error: errors[0] || "Could not save introduction response.",
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = requestEmail(request, body);

    if (!email) {
      return NextResponse.json(
        {
          ok: false,
          error: "Login email required.",
        },
        { status: 401 }
      );
    }

    const owner = isOwnerRequest(request, email, body);
    const payload = makePayload(body, email, owner);

    if (!payload.introduction_id) {
      return NextResponse.json(
        {
          ok: false,
          error: "Introduction ID is required.",
        },
        { status: 400 }
      );
    }

    if (!payload.member_email && !owner) {
      return NextResponse.json(
        {
          ok: false,
          error: "Member email is required.",
        },
        { status: 400 }
      );
    }

    const supabase = supabaseClient();
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
      table: RESPONSE_TABLE,
      response: normalizeRow(result.data),
      keys: result.keys,
      message: "Introduction response saved safely.",
      note: "No notification was sent. No deal/member data was mutated.",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: "Could not save introduction response.",
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
    const introId = first(url.searchParams.get("intro_id"), url.searchParams.get("introduction_id"));
    const signalId = first(url.searchParams.get("signal_id"), url.searchParams.get("signalId"));
    const itemId = first(url.searchParams.get("item_id"), url.searchParams.get("itemId"));

    const supabase = supabaseClient();

    let query = supabase
      .from(RESPONSE_TABLE)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(owner ? 250 : 100);

    if (introId) {
      query = query.or(`introduction_id.eq.${introId},intro_id.eq.${introId}`);
    }

    if (signalId) {
      query = query.eq("signal_id", signalId);
    }

    if (itemId) {
      query = query.eq("item_id", itemId);
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

    let responses = Array.isArray(data) ? data.map(normalizeRow) : [];

    if (!owner) {
      responses = responses.filter((row: AnyRecord) => {
        const emails = [
          row.member_email,
          row.responder_email,
          row.responding_member_email,
          row.counterparty_email,
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
      table: RESPONSE_TABLE,
      responses,
      counts: {
        responses: responses.length,
        interested: responses.filter((row: AnyRecord) => row.response === "interested").length,
        need_more_info: responses.filter((row: AnyRecord) => row.response === "need_more_info").length,
        call_requested: responses.filter((row: AnyRecord) => row.response === "call_requested").length,
        not_interested: responses.filter((row: AnyRecord) => row.response === "not_interested").length,
      },
      note: owner
        ? "Owner/global introduction responses."
        : "Member-safe introduction responses visible to this email.",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: "Could not load introduction responses.",
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
