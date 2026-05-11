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

function makeId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2, 10)}`;
}

async function tryInsert(supabase: any, table: string, payloads: AnyRow[]) {
  const errors: string[] = [];

  for (const payload of payloads) {
    try {
      const { data, error } = await supabase.from(table).insert(payload).select("*").single();

      if (!error && data) {
        return { ok: true, table, data, keys: Object.keys(payload) };
      }

      if (error?.message) errors.push(`${table}: ${error.message}`);
    } catch (error: any) {
      errors.push(`${table}: ${error?.message || String(error)}`);
    }
  }

  return { ok: false, table, error: errors.join(" | ") || `Insert failed for ${table}` };
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
    const messageId = makeId("msg");
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
      self_message: selfMessage,
      raw: body,
    };

    const fullPayload = {
      id: messageId,
      message_id: messageId,
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
      pain_id: clean(body.pain_id) || (source.includes("pain") ? itemId || null : null),
      deal_id: clean(body.deal_id) || null,
      project_id: clean(body.project_id) || null,
      status: "open",
      archived: false,
      read: false,
      created_at: now,
      updated_at: now,
      metadata,
    };

    const safePayload = {
      thread_id: threadId,
      from_email: fromEmail,
      to_email: toEmail,
      subject,
      body: messageBody,
      message: messageBody,
      signal_id: signalId || null,
      item_id: itemId || null,
      status: "open",
      metadata,
      created_at: now,
      updated_at: now,
    };

    const simplePayload = {
      email: fromEmail,
      subject,
      message: messageBody,
      metadata,
      created_at: now,
    };

    const supabase = supabaseClient();

    const tables = ["vf_messages", "messages", "member_messages", "deal_messages"];
    const attempts: AnyRow[] = [];

    for (const table of tables) {
      const result = await tryInsert(supabase, table, [fullPayload, safePayload, simplePayload]);
      attempts.push(result);

      if (result.ok) {
        return NextResponse.json({
          ok: true,
          saved: true,
          table: result.table,
          message: result.data,
          thread_id: threadId,
          message_id: result.data.id || result.data.message_id || messageId,
          from_email: fromEmail,
          to_email: toEmail,
          self_message: selfMessage,
          links: {
            inbox: "/messages",
            thread: `/messages/${encodeURIComponent(threadId)}`,
            signal: signalId ? `/signals/${encodeURIComponent(signalId)}` : "",
          },
          note: selfMessage
            ? "Saved as an owner note because sender and recipient are the same."
            : "Connection request saved.",
        });
      }
    }

    return NextResponse.json(
      {
        ok: false,
        error: "Message could not be saved.",
        attempts,
        expected_fields: ["thread_id", "from_email", "to_email", "subject", "body", "signal_id", "item_id"],
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
