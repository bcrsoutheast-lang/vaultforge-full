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

  if (!url || !key) throw new Error("Missing Supabase environment values.");

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
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

function makeId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

async function tryInsert(supabase: any, table: string, payloads: AnyRow[]) {
  const errors: string[] = [];

  for (const payload of payloads) {
    try {
      const { data, error } = await supabase.from(table).insert(payload).select("*").single();
      if (!error) return { table, data, payload };
      errors.push(`${table}: ${error.message}`);
    } catch (error: any) {
      errors.push(`${table}: ${error?.message || String(error)}`);
    }
  }

  return { table, error: errors.join(" | ") };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as AnyRow;
    const fromEmail = requestEmail(request, body);
    const toEmail = cleanEmail(body.to_email || body.recipient_email || body.target_email || body.owner_email || OWNER_EMAIL);
    const subject = clean(body.subject || body.title || "VaultForge connection request");
    const messageBody = clean(body.body || body.message || body.note || body.notes || "I need more information about this VaultForge signal/opportunity.");
    const signalId = clean(body.signal_id || body.related_signal_id || "");
    const itemId = clean(body.item_id || body.related_item_id || body.pain_id || body.deal_id || "");
    const threadId = clean(body.thread_id || body.threadId || signalId || itemId || makeId("thread"));
    const messageId = makeId("msg");
    const now = new Date().toISOString();

    if (!fromEmail) {
      return NextResponse.json({ ok: false, error: "Sender email required." }, { status: 400 });
    }

    const metadata = {
      source: "api/messages/new",
      from_email: fromEmail,
      to_email: toEmail,
      subject,
      body: messageBody,
      signal_id: signalId,
      item_id: itemId,
      thread_id: threadId,
      raw: body,
    };

    const fullPayload = {
      id: messageId,
      thread_id: threadId,
      from_email: fromEmail,
      to_email: toEmail,
      sender_email: fromEmail,
      recipient_email: toEmail,
      member_email: fromEmail,
      owner_email: toEmail,
      subject,
      body: messageBody,
      message: messageBody,
      note: messageBody,
      signal_id: signalId,
      item_id: itemId,
      status: "open",
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
      signal_id: signalId,
      item_id: itemId,
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
      if (result.data) {
        return NextResponse.json({
          ok: true,
          message: result.data,
          table: result.table,
          thread_id: threadId,
          message_id: result.data.id || messageId,
          links: {
            inbox: "/messages",
            thread: `/messages/${encodeURIComponent(threadId)}`,
          },
        });
      }
    }

    return NextResponse.json(
      { ok: false, error: "Message could not be saved.", attempts },
      { status: 500 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: "Message request failed.", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}
