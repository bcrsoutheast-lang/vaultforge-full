import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Payload = Record<string, any>;

const TABLES = ["vf_messages", "simple_messages", "messages"];

function clean(value: unknown) {
  return String(value || "").trim();
}

function cleanEmail(value: unknown) {
  return clean(value).toLowerCase();
}

function env(name: string) {
  return process.env[name] || "";
}

function supabase() {
  const url = env("NEXT_PUBLIC_SUPABASE_URL");
  const key =
    env("SUPABASE_SERVICE_ROLE_KEY") ||
    env("NEXT_PUBLIC_SUPABASE_ANON_KEY") ||
    env("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");

  if (!url || !key) return null;

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function safePart(value: string) {
  return clean(value)
    .toLowerCase()
    .replace(/[^a-z0-9@._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 110);
}

function meta(input: Payload) {
  return typeof input?.metadata === "object" && input.metadata ? input.metadata : {};
}

function first(...values: unknown[]) {
  for (const value of values) {
    const text = clean(value);
    if (text) return text;
  }

  return "";
}

function normalizeSource(input: Payload) {
  const m = meta(input);
  const raw = clean(input.source || input.message_type || input.type || input.context || m.source || "message").toLowerCase();

  const text = [
    raw,
    input.folder,
    input.folder_key,
    input.subject,
    input.title,
    input.thread_id,
    input.thread_key,
    input.message,
    input.body,
    input.note,
    m.source,
    m.folder,
    m.subject,
  ]
    .join(" ")
    .toLowerCase();

  if (text.includes("alert") || text.includes("need-more") || text.includes("request-info") || text.includes("message-owner")) return "alert";
  if (text.includes("pain") || text.includes("distress") || text.includes("funding gap")) return "pain";
  if (text.includes("signal")) return "signal";
  if (text.includes("routing") || text.includes("route")) return "routing";
  if (text.includes("intro")) return "introduction";
  if (text.includes("project") || text.includes("deal") || text.includes("property")) return "project";
  if (text.includes("member") || text.includes("connect") || text.includes("profile")) return "member";
  if (text.includes("activity") || text.includes("event")) return "activity";

  return raw || "message";
}

function folderForSource(source: string, input: Payload = {}) {
  const m = meta(input);
  const override = clean(input.folder || input.folder_key || m.folder || m.folder_key).toLowerCase();
  const allowed = ["alerts", "pain", "activity", "routing", "introductions", "projects", "members", "signals", "general"];

  if (allowed.includes(override)) return override;

  if (source === "alert") return "alerts";
  if (source === "pain") return "pain";
  if (source === "activity") return "activity";
  if (source === "routing") return "routing";
  if (source === "introduction") return "introductions";
  if (source === "project") return "projects";
  if (source === "member") return "members";
  if (source === "signal") return "signals";

  return "general";
}

function cleanSubject(value: unknown, fallback = "VaultForge message") {
  return (
    clean(value || fallback)
      .replace(/^(re:\s*)+/gi, "")
      .replace(/\s+/g, " ")
      .trim() || fallback
  );
}

function labelForSource(source: string) {
  if (source === "alert") return "Alert message";
  if (source === "pain") return "Pain message";
  if (source === "activity") return "Activity message";
  if (source === "routing") return "Routing message";
  if (source === "introduction") return "Introduction message";
  if (source === "project") return "Project message";
  if (source === "member") return "Member message";
  if (source === "signal") return "Signal message";
  return "VaultForge message";
}

function makeThreadKey(payload: Payload) {
  const m = meta(payload);

  const existing = clean(
    payload.thread_key ||
      payload.threadKey ||
      m.thread_key
  );

  if (existing) return existing;

  const source = normalizeSource(payload);

  const signalId = clean(
    payload.signal_id ||
      payload.signalId ||
      m.signal_id
  );

  const itemId = clean(
    payload.item_id ||
      payload.itemId ||
      payload.pain_id ||
      payload.project_id ||
      payload.deal_id ||
      m.item_id
  );

  const threadId = clean(
    payload.thread_id ||
      payload.threadId ||
      m.thread_id
  );

  const identity =
    signalId ||
    itemId ||
    threadId ||
    "general";

  return `${source}:${identity}`;
}

function makeThreadId(payload: Payload) {
  const m = meta(payload);
  const existing = clean(payload.thread_id || payload.threadId || m.thread_id);
  if (existing) return existing;

  const source = normalizeSource(payload);
  const signalId = clean(payload.signal_id || payload.signalId || m.signal_id);
  const itemId = clean(payload.item_id || payload.itemId || payload.pain_id || payload.project_id || payload.deal_id || m.item_id);
  const threadKey = makeThreadKey(payload);
  const identity = signalId || itemId || safePart(threadKey) || "general";

  return safePart(`${source}-${identity}`) || `general-${Date.now()}`;
}

function normalize(input: Payload, mode: "read" | "write" = "read") {
  const m = meta(input);
  const source = normalizeSource(input);
  const folder = folderForSource(source, input);
  const fromEmail = cleanEmail(input.from_email || input.sender_email || input.email || input.member_email || input.user_email || m.from_email);
  const toEmail = cleanEmail(input.to_email || input.recipient_email || input.target_email || input.owner_email || input.reply_to_email || m.to_email || "owner@vaultforge.local");
  const signalId = clean(input.signal_id || input.signalId || m.signal_id);
  const itemId = clean(input.item_id || input.itemId || input.pain_id || input.project_id || input.deal_id || m.item_id);
  const threadKey = makeThreadKey({ ...input, source, from_email: fromEmail, to_email: toEmail, signal_id: signalId, item_id: itemId, folder });
  const threadId = makeThreadId({ ...input, thread_key: threadKey, source, from_email: fromEmail, to_email: toEmail, signal_id: signalId, item_id: itemId, folder });
  const subject = cleanSubject(input.subject || input.title || m.subject, labelForSource(source));
  const message = clean(input.message || input.body || input.note || input.content || m.message);
  const now = new Date().toISOString();
  const createdAt = clean(input.created_at || m.created_at) || now;
  const updatedAt = mode === "write" ? now : clean(input.updated_at || m.updated_at) || createdAt;
  const status = clean(input.status || m.status || "sent").toLowerCase();

  return {
    ...input,
    id: input.id || m.id,
    thread_id: threadId,
    thread_key: threadKey,
    from_email: fromEmail,
    sender_email: fromEmail,
    to_email: toEmail,
    recipient_email: toEmail,
    target_email: toEmail,
    owner_email: toEmail,
    signal_id: signalId || null,
    item_id: itemId || null,
    deal_id: clean(input.deal_id || itemId) || null,
    source,
    origin: clean(input.origin || m.origin || source),
    message_type: source,
    folder,
    folder_key: folder,
    subject,
    title: subject,
    message,
    body: message,
    note: message,
    status,
    read: input.read === true,
    archived: input.archived === true || input.is_archived === true || status === "archived",
    is_archived: input.is_archived === true || input.archived === true || status === "archived",
    is_deleted: input.is_deleted === true || input.deleted === true || status === "deleted",
    created_at: createdAt,
    updated_at: updatedAt,
    metadata: {
      ...m,
      thread_id: threadId,
      thread_key: threadKey,
      signal_id: signalId || null,
      item_id: itemId || null,
      source,
      origin: clean(input.origin || m.origin || source),
      folder,
      folder_key: folder,
      from_email: fromEmail,
      to_email: toEmail,
      subject,
      created_at: createdAt,
      updated_at: updatedAt,
    },
  };
}

function visibleTo(row: Payload, email: string) {
  if (!email) return true;

  const from = cleanEmail(row.from_email || row.sender_email || row.member_email || meta(row).from_email);
  const to = cleanEmail(row.to_email || row.recipient_email || row.target_email || row.owner_email || meta(row).to_email);
  const visible = cleanEmail(row.visible_to_email || row.email || meta(row).visible_to_email);

  return (
    from === email ||
    to === email ||
    visible === email ||
    to === "owner@vaultforge.local" ||
    to === "bcrsoutheast@gmail.com" ||
    email === "bcrsoutheast@gmail.com"
  );
}

function hidden(row: Payload) {
  const status = clean(row.status || meta(row).status).toLowerCase();

  return (
    row?.is_deleted === true ||
    row?.deleted === true ||
    row?.is_archived === true ||
    row?.archived === true ||
    status === "deleted" ||
    status === "archived"
  );
}

function dedupe(rows: Payload[]) {
  const seen = new Set<string>();
  const out: Payload[] = [];

  for (const raw of rows) {
    const row = normalize(raw, "read");
    const key = clean(row.id) || [row.thread_key, row.thread_id, row.from_email, row.to_email, row.message, row.created_at].join("|").toLowerCase();

    if (seen.has(key)) continue;
    seen.add(key);
    out.push(row);
  }

  return out;
}

async function readFromFirstAvailableTable(client: ReturnType<typeof supabase>, tableFilter?: string) {
  if (!client) return { table: "", rows: [] as Payload[], error: "No Supabase client." };

  let lastError = "";

  const tables = tableFilter ? [tableFilter] : TABLES;

  for (const table of tables) {
    try {
      const { data, error } = await client.from(table).select("*").order("created_at", { ascending: false }).limit(500);

      if (error) {
        lastError = error.message || String(error);
        continue;
      }

      return { table, rows: Array.isArray(data) ? data : [], error: "" };
    } catch (error: any) {
      lastError = error?.message || String(error);
    }
  }

  return { table: "", rows: [], error: lastError };
}

function fallbackRows(email: string) {
  const now = new Date().toISOString();

  return [
    normalize(
      {
        id: "local-welcome",
        thread_id: "general-welcome-system",
        thread_key: `general:welcome__${email || "member@vaultforge.local"}__system@vaultforge.local`,
        from_email: "system@vaultforge.local",
        to_email: email || "member@vaultforge.local",
        subject: "VaultForge message center ready",
        message: "Messages will appear here when you contact an owner, request information, or reply to a signal.",
        source: "message",
        folder: "general",
        status: "sent",
        created_at: now,
        updated_at: now,
      },
      "read"
    ),
  ];
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const email = cleanEmail(url.searchParams.get("email") || request.headers.get("x-vf-email"));
  const threadId = clean(url.searchParams.get("thread_id") || url.searchParams.get("threadId"));
  const threadKey = clean(url.searchParams.get("thread_key") || url.searchParams.get("threadKey"));
  const folder = clean(url.searchParams.get("folder") || url.searchParams.get("lane")).toLowerCase();
  const sourceParam = clean(url.searchParams.get("source"));
  const source = sourceParam ? normalizeSource({ source: sourceParam }) : "";
  const client = supabase();

  if (!client) {
    const rows = fallbackRows(email);

    return NextResponse.json({
      ok: true,
      source: "fallback-no-supabase",
      table: "",
      messages: rows,
      threads: [],
      count: rows.length,
    });
  }

  const result = await readFromFirstAvailableTable(client);

  if (!result.table) {
    const rows = fallbackRows(email);

    return NextResponse.json({
      ok: true,
      source: "fallback-empty",
      details: result.error,
      messages: rows,
      threads: [],
      count: rows.length,
    });
  }

  let rows = dedupe(result.rows)
    .filter((row: any) => !hidden(row))
    .filter((row: any) => visibleTo(row, email));

  if (threadId) rows = rows.filter((row: any) => row.thread_id === threadId);
  if (threadKey) rows = rows.filter((row: any) => row.thread_key === threadKey);
  if (folder) rows = rows.filter((row: any) => row.folder === folder || row.folder_key === folder);
  if (source) rows = rows.filter((row: any) => row.source === source || row.message_type === source);

  return NextResponse.json({
    ok: true,
    table: result.table,
    messages: rows,
    threads: [],
    count: rows.length,
  });
}

export async function POST(request: Request) {
  let body: Payload = {};

  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const row = normalize(body, "write");

  if (!row.from_email) {
    return NextResponse.json({ ok: false, error: "Missing sender email." }, { status: 400 });
  }

  if (!row.to_email) {
    return NextResponse.json({ ok: false, error: "Missing recipient email." }, { status: 400 });
  }

  if (!row.message) {
    return NextResponse.json({ ok: false, error: "Missing message." }, { status: 400 });
  }

  const client = supabase();

  if (!client) {
    return NextResponse.json({
      ok: true,
      saved: false,
      fallback: true,
      message: "Message accepted locally. Supabase client not configured.",
      thread_id: row.thread_id,
      thread_key: row.thread_key,
      row,
      data: row,
    });
  }

  let lastError = "";

  for (const table of TABLES) {
    try {
      const { data, error } = await client.from(table).insert(row).select("*").single();

      if (!error) {
        const savedRow = normalize(data || row, "read");

        return NextResponse.json({
          ok: true,
          table,
          message: "Message saved.",
          thread_id: savedRow.thread_id,
          thread_key: savedRow.thread_key,
          data: savedRow,
          row: savedRow,
        });
      }

      lastError = error.message || String(error);
    } catch (error: any) {
      lastError = error?.message || String(error);
    }
  }

  return NextResponse.json({
    ok: true,
    saved: false,
    fallback: true,
    message: "Message accepted but could not save to existing message tables.",
    details: lastError,
    thread_id: row.thread_id,
    thread_key: row.thread_key,
    row,
    data: row,
  });
}

export async function PATCH(request: Request) {
  let body: Payload = {};

  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const email = cleanEmail(body.email || body.viewer_email || body.from_email || "");
  const id = clean(body.id);
  const threadKey = clean(body.thread_key);
  const threadId = clean(body.thread_id);
  const action = clean(body.action).toLowerCase();

  if (!id && !threadKey && !threadId) {
    return NextResponse.json({ ok: false, error: "Missing id, thread_key, or thread_id." }, { status: 400 });
  }

  const patch: Payload = {
    updated_at: new Date().toISOString(),
  };

  if (action === "archive") {
    patch.archived = true;
    patch.is_archived = true;
    patch.status = "archived";
  } else if (action === "delete") {
    patch.is_deleted = true;
    patch.deleted = true;
    patch.status = "deleted";
  } else if (action === "restore") {
    patch.archived = false;
    patch.is_archived = false;
    patch.is_deleted = false;
    patch.deleted = false;
    patch.status = "sent";
  } else if (body.folder || body.folder_key) {
    const folder = clean(body.folder || body.folder_key).toLowerCase();
    patch.folder = folder;
    patch.folder_key = folder;
  } else {
    return NextResponse.json({ ok: false, error: "Unknown cleanup action." }, { status: 400 });
  }

  const client = supabase();

  if (!client) {
    return NextResponse.json({ ok: true, saved: false, fallback: true, patch });
  }

  let lastError = "";

  for (const table of TABLES) {
    try {
      let query = client.from(table).update(patch).select("*");

      if (id) query = query.eq("id", id);
      else if (threadKey) query = query.eq("thread_key", threadKey);
      else query = query.eq("thread_id", threadId);

      const { data, error } = await query;

      if (!error) {
        const rows = dedupe(Array.isArray(data) ? data : []).filter((row: any) => visibleTo(row, email));

        return NextResponse.json({
          ok: true,
          table,
          action,
          updated: rows.length,
          messages: rows,
        });
      }

      lastError = error.message || String(error);
    } catch (error: any) {
      lastError = error?.message || String(error);
    }
  }

  return NextResponse.json({
    ok: false,
    error: "Could not update message cleanup state.",
    details: lastError,
  }, { status: 500 });
}