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

function requestEmail(request: Request, body: AnyRow = {}) {
  const url = new URL(request.url);
  const cookie = request.headers.get("cookie") || "";

  return cleanEmail(
    request.headers.get("x-vf-email") ||
      url.searchParams.get("email") ||
      body.email ||
      body.from_email ||
      body.sender_email ||
      body.member_email ||
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

  const fromEmail = cleanEmail(
    first(
      row.from_email,
      row.sender_email,
      row.member_email,
      row.email,
      metadata.from_email,
      metadata.sender_email,
      metadata.member_email,
      metadata.email
    )
  );

  const toEmail = cleanEmail(
    first(
      row.to_email,
      row.recipient_email,
      row.target_email,
      row.owner_email,
      metadata.to_email,
      metadata.recipient_email,
      metadata.target_email,
      metadata.owner_email
    )
  );

  return {
    id: first(row.id, row.message_id, row.event_id, `${table}-${row.created_at || ""}-${fromEmail}`),
    thread_id: first(row.thread_id, metadata.thread_id, row.threadId),
    from_email: fromEmail,
    to_email: toEmail,
    sender_email: fromEmail,
    recipient_email: toEmail,
    subject: first(row.subject, row.title, row.event_title, metadata.subject, "VaultForge message"),
    body: first(row.body, row.message, row.note, row.event_description, metadata.body, metadata.message, metadata.note),
    message: first(row.message, row.body, row.note, row.event_description, metadata.message, metadata.body, metadata.note),
    signal_id: first(row.signal_id, row.related_signal_id, metadata.signal_id),
    item_id: first(row.item_id, row.pain_id, row.deal_id, row.project_id, metadata.item_id, metadata.pain_id, metadata.deal_id, metadata.project_id),
    status: first(row.status, metadata.status, "open"),
    created_at: first(row.created_at, metadata.created_at, row.updated_at, new Date().toISOString()),
    updated_at: first(row.updated_at, row.created_at, metadata.updated_at),
    source_table: table,
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

      if (!error && Array.isArray(data)) {
        return data;
      }
    } catch {
      // Try next column/table shape.
    }
  }

  try {
    const { data, error } = await supabase.from(table).select("*").limit(250);

    if (!error && Array.isArray(data)) {
      return data;
    }
  } catch {
    // No-op.
  }

  return [];
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

async function saveMessage(supabase: any, request: Request, body: AnyRow) {
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
  const threadId = stableThreadId(signalId, itemId, fromEmail, toEmail, body.thread_id || body.threadId);
  const now = new Date().toISOString();
  const selfMessage = fromEmail === toEmail;

  if (!fromEmail) return { ok: false, status: 400, error: "Sender email required." };
  if (!toEmail) return { ok: false, status: 400, error: "Recipient email required." };
  if (!messageBody) return { ok: false, status: 400, error: "Message body required." };

  const metadata = {
    source: "api/messages/root",
    from_email: fromEmail,
    to_email: toEmail,
    subject,
    body: messageBody,
    signal_id: signalId,
    item_id: itemId,
    thread_id: threadId,
    self_message: selfMessage,
  };

  const payloads = [
    {
      thread_id: threadId,
      from_email: fromEmail,
      to_email: toEmail,
      subject,
      body: messageBody,
      created_at: now,
      metadata,
    },
    {
      thread_id: threadId,
      sender_email: fromEmail,
      recipient_email: toEmail,
      subject,
      message: messageBody,
      created_at: now,
      metadata,
    },
    {
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
      message_type: selfMessage ? "owner_note" : "connection_request",
      signal_id: signalId || null,
      item_id: itemId || null,
      status: "open",
      created_at: now,
      updated_at: now,
      metadata,
    },
    {
      email: fromEmail,
      subject,
      message: messageBody,
      created_at: now,
      metadata,
    },
  ];

  const tables = ["vf_messages", "messages", "member_messages", "deal_messages"];
  const attempts: AnyRow[] = [];

  for (const table of tables) {
    for (const payload of payloads) {
      const result = await insertOne(supabase, table, payload);
      attempts.push(result);

      if (result.ok) {
        const saved = result.data || {};

        return {
          ok: true,
          status: 200,
          table: result.table,
          message: saved,
          thread_id: threadId,
          from_email: fromEmail,
          to_email: toEmail,
          self_message: selfMessage,
          links: {
            thread: `/messages/${encodeURIComponent(threadId)}?email=${encodeURIComponent(fromEmail)}`,
            signal: signalId ? `/signals/${encodeURIComponent(signalId)}` : "",
            inbox: "/messages",
          },
        };
      }
    }
  }

  return {
    ok: false,
    status: 500,
    error: "Message could not be saved.",
    from_email: fromEmail,
    to_email: toEmail,
    thread_id: threadId,
    signal_id: signalId,
    item_id: itemId,
    attempts,
  };
}

export async function GET(request: Request) {
  try {
    const email = requestEmail(request);
    const owner = isOwnerRequest(request, email);

    if (!email && !owner) {
      return NextResponse.json({ ok: false, error: "Login email required." }, { status: 401 });
    }

    const supabase = supabaseClient();
    const tables = ["vf_messages", "messages", "member_messages", "deal_messages", "vf_activity_events", "activity_events"];
    const messages: AnyRow[] = [];

    for (const table of tables) {
      const rows = await selectRecent(supabase, table);

      for (const row of rows) {
        if (!canSee(row, email, owner)) continue;
        messages.push(normalizeMessage(row, table));
      }
    }

    const seen = new Set<string>();
    const unique = messages
      .filter((message) => {
        const key = `${message.source_table}-${message.id}-${message.created_at}-${message.body}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
      .slice(0, 100);

    return NextResponse.json({
      ok: true,
      email,
      owner,
      messages: unique,
      count: unique.length,
      tables_checked: tables,
      source: "api/messages/root",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: "Could not load messages.",
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as AnyRow;
    const supabase = supabaseClient();
    const result = await saveMessage(supabase, request, body);

    return NextResponse.json(result, { status: Number(result.status || 200) });
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
