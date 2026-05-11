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

  if (!url || !key) throw new Error("Missing Supabase environment values.");

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

function metadataOf(row: AnyRow) {
  return typeof row.metadata === "object" && row.metadata ? row.metadata : {};
}

function normalizeMessage(row: AnyRow, table: string) {
  const metadata = metadataOf(row);

  const fromEmail = cleanEmail(first(row.from_email, row.sender_email, row.member_email, row.email, metadata.from_email, metadata.sender_email, metadata.member_email));
  const toEmail = cleanEmail(first(row.to_email, row.recipient_email, row.target_email, row.owner_email, metadata.to_email, metadata.recipient_email, metadata.target_email, metadata.owner_email));

  return {
    ...row,
    id: first(row.id, row.message_id, metadata.message_id, `${table}-${row.created_at || ""}-${fromEmail}`),
    message_id: first(row.message_id, row.id, metadata.message_id),
    thread_id: first(row.thread_id, metadata.thread_id, row.threadId),
    from_email: fromEmail,
    to_email: toEmail,
    sender_email: fromEmail,
    recipient_email: toEmail,
    subject: first(row.subject, row.title, metadata.subject, "VaultForge message"),
    body: first(row.body, row.message, row.note, metadata.body, metadata.message, metadata.note),
    message: first(row.message, row.body, row.note, metadata.message, metadata.body, metadata.note),
    signal_id: first(row.signal_id, row.related_signal_id, metadata.signal_id),
    item_id: first(row.item_id, row.pain_id, row.deal_id, row.project_id, metadata.item_id, metadata.pain_id, metadata.deal_id, metadata.project_id),
    created_at: first(row.created_at, metadata.created_at, row.updated_at, new Date().toISOString()),
    updated_at: first(row.updated_at, row.created_at, metadata.updated_at),
    _source_table: table,
    metadata,
  };
}

function canSee(row: AnyRow, email: string, owner: boolean) {
  if (owner) return true;

  const normalized = normalizeMessage(row, "check");
  const emails = [
    normalized.from_email,
    normalized.to_email,
    row.visible_to_email,
    metadataOf(row).visible_to_email,
  ]
    .map(cleanEmail)
    .filter(Boolean);

  if (emails.length === 0) return true;
  return emails.includes(email);
}

async function selectRecent(supabase: any, table: string) {
  const orderColumns = ["created_at", "updated_at", "id"];

  for (const column of orderColumns) {
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
    // no-op
  }

  return [];
}

function messageMatches(row: AnyRow, threadId: string, signalId: string, itemId: string) {
  const message = normalizeMessage(row, "match");
  const metadata = metadataOf(row);

  const values = [
    message.thread_id,
    message.signal_id,
    message.item_id,
    row.threadId,
    row.signalId,
    row.itemId,
    row.pain_id,
    row.deal_id,
    row.project_id,
    metadata.thread_id,
    metadata.signal_id,
    metadata.item_id,
    metadata.pain_id,
    metadata.deal_id,
    metadata.project_id,
  ].map(clean);

  return (
    (threadId && values.includes(threadId)) ||
    (signalId && values.includes(signalId)) ||
    (itemId && values.includes(itemId))
  );
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const email = requestEmail(request);
    const owner = isOwnerRequest(request, email);

    const threadId = clean(url.searchParams.get("thread_id") || url.searchParams.get("threadId") || "");
    const signalId = clean(url.searchParams.get("signal_id") || url.searchParams.get("signalId") || "");
    const itemId = clean(url.searchParams.get("item_id") || url.searchParams.get("itemId") || "");
    const limit = Math.min(250, Math.max(1, Number(url.searchParams.get("limit") || 100)));

    if (!email && !owner) {
      return NextResponse.json({ ok: false, error: "Login email required." }, { status: 401 });
    }

    if (!threadId && !signalId && !itemId) {
      return NextResponse.json({ ok: false, error: "thread_id, signal_id, or item_id required." }, { status: 400 });
    }

    const supabase = supabaseClient();
    const tables = ["vf_messages", "messages", "member_messages", "deal_messages"];
    const found: AnyRow[] = [];

    for (const table of tables) {
      const rows = await selectRecent(supabase, table);

      for (const row of rows) {
        if (!messageMatches(row, threadId, signalId, itemId)) continue;
        if (!canSee(row, email, owner)) continue;
        found.push(normalizeMessage(row, table));
      }
    }

    const seen = new Set<string>();
    const messages = found
      .filter((message) => {
        const key = `${message._source_table}-${message.id}-${message.created_at}-${message.body}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime())
      .slice(0, limit);

    const latest = messages[messages.length - 1] || {};
    const viewerEmail = email;
    const otherEmail =
      messages.find((message) => message.from_email && message.from_email !== viewerEmail)?.from_email ||
      messages.find((message) => message.to_email && message.to_email !== viewerEmail)?.to_email ||
      latest.to_email ||
      latest.from_email ||
      "";

    return NextResponse.json({
      ok: true,
      thread_id: threadId || latest.thread_id || "",
      signal_id: signalId || latest.signal_id || "",
      item_id: itemId || latest.item_id || "",
      messages,
      count: messages.length,
      viewer_email: viewerEmail,
      other_email: otherEmail,
      source: "api/messages/thread",
      tables_checked: tables,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: "Could not load message thread.",
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
