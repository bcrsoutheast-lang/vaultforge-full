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

function requestEmail(request: Request) {
  const url = new URL(request.url);
  const cookie = request.headers.get("cookie") || "";
  return cleanEmail(
    request.headers.get("x-vf-email") ||
      url.searchParams.get("email") ||
      readCookie(cookie, "vf_email") ||
      readCookie(cookie, "vf_member_email") ||
      readCookie(cookie, "vf_admin_email")
  );
}

function isOwnerRequest(request: Request, email: string) {
  const url = new URL(request.url);
  const cookie = request.headers.get("cookie") || "";
  return (
    email === OWNER_EMAIL ||
    clean(request.headers.get("x-vf-admin")) === "1" ||
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

function asObject(value: unknown): AnyRow {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? (value as AnyRow) : {};
}

function messageEmails(row: AnyRow) {
  const metadata = asObject(row.metadata);
  return [
    row.from_email,
    row.sender_email,
    row.member_email,
    row.email,
    row.to_email,
    row.recipient_email,
    row.target_email,
    row.owner_email,
    row.created_by_email,
    metadata.from_email,
    metadata.sender_email,
    metadata.member_email,
    metadata.email,
    metadata.to_email,
    metadata.recipient_email,
    metadata.target_email,
    metadata.owner_email,
  ]
    .map(cleanEmail)
    .filter(Boolean);
}

function canSee(row: AnyRow, email: string, owner: boolean) {
  if (owner) return true;
  const emails = messageEmails(row);
  if (emails.length === 0) return true;
  return emails.includes(email);
}

function normalize(row: AnyRow, table: string) {
  const metadata = asObject(row.metadata);
  const id = first(row.id, row.message_id, row.uuid, metadata.id, metadata.message_id);
  const threadId = first(
    row.thread_id,
    row.thread,
    row.conversation_id,
    row.parent_id,
    metadata.thread_id,
    metadata.thread,
    row.signal_id,
    row.item_id,
    id
  );
  const fromEmail = cleanEmail(first(row.from_email, row.sender_email, row.member_email, row.email, metadata.from_email, metadata.sender_email, metadata.member_email, metadata.email));
  const toEmail = cleanEmail(first(row.to_email, row.recipient_email, row.target_email, row.owner_email, metadata.to_email, metadata.recipient_email, metadata.target_email, metadata.owner_email, OWNER_EMAIL));
  const subject = first(row.subject, row.title, row.message_subject, metadata.subject, metadata.title, "VaultForge message");
  const body = first(row.body, row.message, row.content, row.note, row.notes, row.description, metadata.body, metadata.message, metadata.note);
  const createdAt = first(row.created_at, row.sent_at, row.updated_at, metadata.created_at, new Date().toISOString());

  return {
    ...row,
    id,
    message_id: id,
    thread_id: threadId,
    from_email: fromEmail,
    to_email: toEmail,
    subject,
    body,
    preview: body.length > 180 ? `${body.slice(0, 180)}...` : body,
    signal_id: first(row.signal_id, row.related_signal_id, metadata.signal_id),
    item_id: first(row.item_id, row.related_item_id, metadata.item_id),
    status: first(row.status, row.message_status, metadata.status, "open"),
    created_at: createdAt,
    _source_table: table,
    metadata,
  };
}

async function selectRecent(supabase: any, table: string) {
  const orders = ["created_at", "sent_at", "updated_at", "id"];
  for (const column of orders) {
    try {
      const { data, error } = await supabase.from(table).select("*").order(column, { ascending: false }).limit(250);
      if (!error && Array.isArray(data)) return data;
    } catch {
      // try next
    }
  }
  try {
    const { data, error } = await supabase.from(table).select("*").limit(250);
    if (!error && Array.isArray(data)) return data;
  } catch {
    // ignore
  }
  return [];
}

function compactThreads(messages: AnyRow[]) {
  const byThread = new Map<string, AnyRow[]>();
  for (const message of messages) {
    const threadId = first(message.thread_id, message.id);
    if (!threadId) continue;
    const list = byThread.get(threadId) || [];
    list.push(message);
    byThread.set(threadId, list);
  }

  return Array.from(byThread.entries())
    .map(([threadId, list]) => {
      const sorted = [...list].sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
      const latest = sorted[0] || {};
      return {
        thread_id: threadId,
        subject: latest.subject || "VaultForge message",
        preview: latest.preview || latest.body || "",
        from_email: latest.from_email || "",
        to_email: latest.to_email || "",
        signal_id: latest.signal_id || "",
        item_id: latest.item_id || "",
        status: latest.status || "open",
        created_at: latest.created_at || "",
        message_count: list.length,
        latest,
      };
    })
    .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const email = requestEmail(request);
    const owner = isOwnerRequest(request, email);
    const threadId = clean(url.searchParams.get("threadId") || url.searchParams.get("thread_id") || "");

    if (!email) {
      return NextResponse.json({ ok: false, error: "Login email required." }, { status: 401 });
    }

    const supabase = supabaseClient();
    const tables = ["vf_messages", "messages", "member_messages", "deal_messages"];
    const all: AnyRow[] = [];

    for (const table of tables) {
      const rows = await selectRecent(supabase, table);
      for (const row of rows) {
        if (!canSee(row, email, owner)) continue;
        const message = normalize(row, table);
        if (threadId && message.thread_id !== threadId && message.id !== threadId) continue;
        all.push(message);
      }
    }

    const seen = new Set<string>();
    const messages = all
      .filter((message) => {
        const key = first(message._source_table, message.id, message.thread_id, message.created_at, message.body);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime());

    const threads = compactThreads(messages);

    return NextResponse.json({
      ok: true,
      email,
      owner,
      threads: threadId ? [] : threads,
      messages,
      thread: threadId ? { thread_id: threadId, messages } : null,
      count: threadId ? messages.length : threads.length,
      source: "api/messages/thread",
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: "Could not load messages.", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}
