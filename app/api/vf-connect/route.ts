import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const OWNER_EMAIL = "bcrsoutheast@gmail.com";

type AnyRow = Record<string, any>;

function supabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
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

function first(...values: unknown[]) {
  for (const value of values) {
    const text = clean(value);
    if (text) return text;
  }
  return "";
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
      body.from_email ||
      body.member_email ||
      body.email ||
      url.searchParams.get("email") ||
      readCookie(cookie, "vf_email") ||
      readCookie(cookie, "vf_member_email") ||
      readCookie(cookie, "vf_admin_email")
  );
}

function stripNulls(row: AnyRow) {
  const next: AnyRow = {};

  for (const [key, value] of Object.entries(row)) {
    if (value === undefined || value === null) continue;
    if (typeof value === "string" && value.trim() === "") continue;
    next[key] = value;
  }

  return next;
}

async function insertOne(supabase: any, table: string, payload: AnyRow): Promise<AnyRow> {
  try {
    const cleanPayload = stripNulls(payload);
    const { data, error } = await supabase.from(table).insert(cleanPayload).select("*").single();

    if (!error && data) {
      return { ok: true, table, data, keys: Object.keys(cleanPayload) };
    }

    return {
      ok: false,
      table,
      data: null,
      error: error?.message || `Insert failed for ${table}`,
      keys: Object.keys(cleanPayload),
    };
  } catch (error: any) {
    return {
      ok: false,
      table,
      data: null,
      error: error?.message || String(error),
      keys: Object.keys(stripNulls(payload)),
    };
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    route: "api/vf-connect",
    method: "POST",
    purpose: "New clean VaultForge controlled connection request system. Does not use broken legacy message tables.",
    expected: ["from_email", "to_email", "signal_id", "message"],
  });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as AnyRow;

    const fromEmail = requestEmail(request, body);
    const toEmail = cleanEmail(first(body.to_email, body.recipient_email, body.owner_email, body.target_email));
    const signalId = clean(first(body.signal_id, body.signalId, body.alert_id));
    const itemId = clean(first(body.item_id, body.itemId, body.pain_id, body.deal_id, body.project_id));
    const title = clean(first(body.title, body.subject, "VaultForge connection request"));
    const message = clean(first(body.message, body.body, body.note, "I need more information about this VaultForge signal/opportunity."));
    const contextTitle = clean(first(body.context_title, body.contextTitle, title));
    const now = new Date().toISOString();

    if (!fromEmail) {
      return NextResponse.json({ ok: false, error: "Sender email required." }, { status: 400 });
    }

    if (!toEmail) {
      return NextResponse.json({ ok: false, error: "Recipient email required." }, { status: 400 });
    }

    if (!signalId) {
      return NextResponse.json({ ok: false, error: "Signal ID required." }, { status: 400 });
    }

    if (!message) {
      return NextResponse.json({ ok: false, error: "Message required." }, { status: 400 });
    }

    const connectId = `connect_${Date.now()}_${Math.random().toString(16).slice(2, 9)}`;
    const selfMessage = fromEmail === toEmail;

    const metadata = {
      connect_id: connectId,
      connection_system: "vf_connect_v1",
      from_email: fromEmail,
      to_email: toEmail,
      owner_email: toEmail,
      member_email: fromEmail,
      signal_id: signalId,
      item_id: itemId,
      title,
      context_title: contextTitle,
      message,
      self_message: selfMessage,
      safety: "controlled_request_no_private_contact_release",
    };

    const fullActivityPayload = {
      event_type: selfMessage ? "owner_note" : "connection_request",
      type: selfMessage ? "owner_note" : "connection_request",
      title,
      event_title: title,
      note: message,
      event_description: message,
      message,
      priority: "medium",
      status: "open",
      member_email: fromEmail,
      sender_email: fromEmail,
      from_email: fromEmail,
      recipient_email: toEmail,
      to_email: toEmail,
      target_email: toEmail,
      owner_email: toEmail,
      visible_to_email: fromEmail,
      signal_id: signalId,
      item_id: itemId || null,
      source: "vf_connect_v1",
      metadata,
      created_at: now,
      updated_at: now,
    };

    const mediumActivityPayload = {
      event_type: selfMessage ? "owner_note" : "connection_request",
      title,
      note: message,
      member_email: fromEmail,
      recipient_email: toEmail,
      owner_email: toEmail,
      signal_id: signalId,
      item_id: itemId || null,
      source: "vf_connect_v1",
      metadata,
      created_at: now,
    };

    const simpleActivityPayload = {
      event_type: selfMessage ? "owner_note" : "connection_request",
      title,
      note: message,
      member_email: fromEmail,
      signal_id: signalId,
      metadata,
      created_at: now,
    };

    const supabase = supabaseClient();
    const tables = ["vf_activity_events", "activity_events"];
    const attempts: AnyRow[] = [];

    for (const table of tables) {
      for (const payload of [fullActivityPayload, mediumActivityPayload, simpleActivityPayload]) {
        const result = await insertOne(supabase, table, payload);
        attempts.push(result);

        if (result.ok) {
          return NextResponse.json({
            ok: true,
            saved: true,
            table: result.table,
            connect_id: connectId,
            event: result.data,
            from_email: fromEmail,
            to_email: toEmail,
            signal_id: signalId,
            item_id: itemId,
            self_message: selfMessage,
            links: {
              signal: `/signals/${encodeURIComponent(signalId)}`,
              activity: "/activity",
              messages: "/messages",
              pain_feed: "/pain-feed",
            },
            message: selfMessage
              ? "Owner note saved to operational activity."
              : "Connection request saved to operational activity.",
            note: "New connect system bypassed legacy broken message tables.",
          });
        }
      }
    }

    return NextResponse.json(
      {
        ok: false,
        error: "Connection request could not be saved.",
        attempts,
        from_email: fromEmail,
        to_email: toEmail,
        signal_id: signalId,
        item_id: itemId,
        likely_causes: [
          "vf_activity_events missing expected columns",
          "activity_events missing or blocked",
          "Supabase service role key missing in Vercel env",
          "RLS blocking all inserts",
        ],
      },
      { status: 500 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: "Connection request failed.",
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
