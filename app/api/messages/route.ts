import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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
      body.sender_email ||
      body.member_email ||
      body.email ||
      url.searchParams.get("email") ||
      readCookie(cookie, "vf_email") ||
      readCookie(cookie, "vf_member_email") ||
      readCookie(cookie, "vf_admin_email")
  );
}

function recipientEmail(body: AnyRow) {
  return cleanEmail(
    first(
      body.to_email,
      body.recipient_email,
      body.target_email,
      body.owner_email,
      body.counterparty_email,
      body.member_email,
      body.to,
      body.recipient
    )
  );
}

function stableThreadId(signalId: string, itemId: string, fromEmail: string, toEmail: string, supplied = "") {
  const existing = clean(supplied);
  if (existing) return existing;

  const basis = signalId || itemId || "general";
  const participants = [fromEmail, toEmail].map((email) => cleanEmail(email)).sort().join("__");
  const raw = `${basis}__${participants}`;
  return `thread_${raw.replace(/[^a-zA-Z0-9_@.-]/g, "_").slice(0, 150)}`;
}

function makeMessageId() {
  return `msg_${Date.now()}_${Math.random().toString(16).slice(2, 10)}`;
}

function stripNulls(row: AnyRow) {
  const next: AnyRow = {};

  for (const [key, value] of Object.entries(row)) {
    if (value === undefined) continue;
    if (value === null) continue;
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

    return { ok: false, table, data: null, error: error?.message || `Insert failed for ${table}`, keys: Object.keys(cleanPayload) };
  } catch (error: any) {
    return { ok: false, table, data: null, error: error?.message || String(error), keys: Object.keys(stripNulls(payload)) };
  }
}

async function insertWithVariants(supabase: any, table: string, variants: AnyRow[]): Promise<AnyRow> {
  const attempts: AnyRow[] = [];

  for (const variant of variants) {
    const result = await insertOne(supabase, table, variant);
    attempts.push(result);

    if (result.ok) return { ...result, attempts };
  }

  return { ok: false, table, data: null, attempts, error: attempts.map((item) => `${item.table}: ${item.error}`).join(" | ") };
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    route: "api/messages/new",
    method: "POST required to save messages",
    expected_minimum: ["from_email", "to_email or recipient_email", "body or message"],
    note: "This route saves to available message tables using schema-safe fallback payloads.",
  });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as AnyRow;

    const fromEmail = requestEmail(request, body);
    const toEmail = recipientEmail(body);
    const subject = clean(body.subject || body.title || "VaultForge connection request");
    const messageBody = clean(
      body.body ||
        body.message ||
        body.note ||
        body.notes ||
        "I need more information about this VaultForge signal/opportunity."
    );

    const signalId = clean(body.signal_id || body.signalId || body.related_signal_id || "");
    const itemId = clean(body.item_id || body.itemId || body.related_item_id || body.pain_id || body.deal_id || body.project_id || "");
    const source = clean(body.source || "vaultforge_message");
    const recipientSource = clean(body.recipient_source || body.recipientSource || "");
    const contextTitle = clean(body.context_title || body.contextTitle || "");
    const threadId = stableThreadId(signalId, itemId, fromEmail, toEmail, body.thread_id || body.threadId);
    const messageId = makeMessageId();
    const now = new Date().toISOString();

    if (!fromEmail) {
      return NextResponse.json({ ok: false, error: "Sender email required." }, { status: 400 });
    }

    if (!toEmail) {
      return NextResponse.json({ ok: false, error: "Recipient email required." }, { status: 400 });
    }

    if (!messageBody) {
      return NextResponse.json({ ok: false, error: "Message body required." }, { status: 400 });
    }

    const selfMessage = fromEmail === toEmail;

    const metadata = {
      source: "api/messages/new",
      request_source: source,
      recipient_source: recipientSource,
      context_title: contextTitle,
      from_email: fromEmail,
      to_email: toEmail,
      subject,
      body: messageBody,
      signal_id: signalId,
      item_id: itemId,
      thread_id: threadId,
      message_id: messageId,
      self_message: selfMessage,
    };

    const minimalThreadPayload = {
      thread_id: threadId,
      from_email: fromEmail,
      to_email: toEmail,
      subject,
      body: messageBody,
      created_at: now,
      metadata,
    };

    const minimalMessagePayload = {
      thread_id: threadId,
      sender_email: fromEmail,
      recipient_email: toEmail,
      subject,
      message: messageBody,
      created_at: now,
      metadata,
    };

    const mediumPayload = {
      thread_id: threadId,
      from_email: fromEmail,
      to_email: toEmail,
      sender_email: fromEmail,
      recipient_email: toEmail,
      target_email: toEmail,
      member_email: fromEmail,
      owner_email: toEmail,
      subject,
      body: messageBody,
      message: messageBody,
      note: messageBody,
      message_type: selfMessage ? "owner_note" : first(body.message_type, "connection_request"),
      source,
      signal_id: signalId || null,
      item_id: itemId || null,
      pain_id: clean(body.pain_id) || null,
      deal_id: clean(body.deal_id) || null,
      project_id: clean(body.project_id) || null,
      status: "open",
      created_at: now,
      updated_at: now,
      metadata,
    };

    const legacyPayload = {
      email: fromEmail,
      subject,
      message: messageBody,
      deal_id: itemId || null,
      created_at: now,
      metadata,
    };

    const activityFallbackPayload = {
      event_type: selfMessage ? "owner_note" : "message_request",
      type: selfMessage ? "owner_note" : "message_request",
      title: subject,
      event_title: subject,
      note: messageBody,
      event_description: messageBody,
      message: messageBody,
      priority: "medium",
      member_email: fromEmail,
      sender_email: fromEmail,
      recipient_email: toEmail,
      owner_email: toEmail,
      visible_to_email: fromEmail,
      signal_id: signalId || null,
      item_id: itemId || null,
      source: "messages_new_fallback",
      metadata,
      created_at: now,
      updated_at: now,
    };

    const supabase = supabaseClient();

    const messageTables = ["vf_messages", "messages", "member_messages", "deal_messages"];
    const allAttempts: AnyRow[] = [];

    for (const table of messageTables) {
      const result: AnyRow = await insertWithVariants(supabase, table, [
        minimalThreadPayload,
        minimalMessagePayload,
        mediumPayload,
        legacyPayload,
      ]);

      allAttempts.push({
        table,
        ok: result.ok,
        error: result.error || "",
        attempts: result.attempts,
      });

      if (result.ok) {
        const saved = result.data || {};

        return NextResponse.json({
          ok: true,
          saved: true,
          table: result.table,
          message: saved,
          thread_id: threadId,
          message_id: saved.id || saved.message_id || messageId,
          from_email: fromEmail,
          to_email: toEmail,
          self_message: selfMessage,
          links: {
            inbox: "/messages",
            thread: `/messages/${encodeURIComponent(threadId)}?email=${encodeURIComponent(fromEmail)}`,
            signal: signalId ? `/signals/${encodeURIComponent(signalId)}` : "",
          },
          note: selfMessage
            ? "Saved as an owner note because sender and recipient are the same."
            : "Connection request saved.",
          insert_model: "schema_safe_message_insert",
        });
      }
    }

    const fallbackTables = ["vf_activity_events", "activity_events"];

    for (const table of fallbackTables) {
      const result: AnyRow = await insertWithVariants(supabase, table, [activityFallbackPayload]);

      allAttempts.push({
        table,
        ok: result.ok,
        error: result.error || "",
        attempts: result.attempts,
      });

      if (result.ok) {
        const saved = result.data || {};

        return NextResponse.json({
          ok: true,
          saved: true,
          fallback: true,
          table: result.table,
          message: saved,
          thread_id: threadId,
          message_id: saved.id || saved.event_id || messageId,
          from_email: fromEmail,
          to_email: toEmail,
          self_message: selfMessage,
          links: {
            inbox: "/messages",
            thread: `/messages/${encodeURIComponent(threadId)}?email=${encodeURIComponent(fromEmail)}`,
            signal: signalId ? `/signals/${encodeURIComponent(signalId)}` : "",
          },
          note: "Message request saved as an activity fallback because message tables rejected the insert.",
          insert_model: "activity_fallback_insert",
        });
      }
    }

    return NextResponse.json(
      {
        ok: false,
        error: "Message could not be saved.",
        from_email: fromEmail,
        to_email: toEmail,
        thread_id: threadId,
        signal_id: signalId,
        item_id: itemId,
        attempts: allAttempts,
        likely_causes: [
          "Message tables do not have expected columns.",
          "RLS/policies are blocking insert.",
          "API lacks service role key in Vercel env.",
          "All fallback activity tables rejected insert.",
        ],
      },
      { status: 500 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: "Message request failed.",
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
