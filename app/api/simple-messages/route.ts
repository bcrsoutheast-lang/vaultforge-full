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
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
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

function normalizeSource(value: unknown, input: Payload = {}) {
  const raw = clean(value || input.source || input.message_type || input.type || input.context || meta(input).source || "message").toLowerCase();
  const text = [raw, input.subject, input.title, input.message, input.body, input.note, meta(input).subject, meta(input).message]
    .join(" ")
    .toLowerCase();

  if (
    text.includes("alert") ||
    text.includes("need-more") ||
    text.includes("need_more") ||
    text.includes("request-info") ||
    text.includes("message-owner") ||
    text.includes("urgent") ||
    text.includes("priority")
  ) {
    return "alert";
  }

  if (text.includes("pain") || text.includes("distress") || text.includes("funding gap")) return "pain";
  if (text.includes("activity") || text.includes("event")) return "activity";
  if (text.includes("routing") || text.includes("route")) return "routing";
  if (text.includes("intro")) return "introduction";
  if (text.includes("project") || text.includes("deal") || text.includes("property")) return "project";
  if (text.includes("member") || text.includes("connect") || text.includes("profile")) return "member";
  if (text.includes("signal")) return "signal";

  return raw || "message";
}

function folderForSource(source: string, input: Payload = {}) {
  const override = clean(input.folder || input.folder_key || meta(input).folder || meta(input).folder_key).toLowerCase();
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

function makeThreadId(payload: Payload) {
  const existing = clean(payload.thread_id || payload.threadId || meta(payload).thread_id);
  if (existing) return safePart(existing) || existing;

  const source = normalizeSource(payload.source || payload.message_type || payload.type || payload.context, payload);
  const signalId = clean(payload.signal_id || payload.signalId || meta(payload).signal_id);
  const itemId = clean(payload.item_id || payload.itemId || payload.pain_id || payload.project_id || payload.deal_id || meta(payload).item_id);
  const fromEmail = cleanEmail(payload.from_email || payload.sender_email || payload.email || payload.member_email || payload.user_email || meta(payload).from_email);
  const toEmail = cleanEmail(payload.to_email || payload.recipient_email || payload.target_email || payload.owner_email || payload.reply_to_email || meta(payload).to_email);

  const identity = signalId || itemId || "general";
  const participant = fromEmail ? safePart(fromEmail.split("@")[0] || fromEmail) : toEmail ? safePart(toEmail.split("@")[0] || toEmail) : "member";

  return safePart(`${source}-${identity}-${participant}`) || `general-${Date.now()}`;
}

function normalize(input: Payload, mode: "read" | "write" = "read") {
  const m = meta(input);
  const fromEmail = cleanEmail(input.from_email || input.sender_email || input.email || input.member_email || input.user_email || m.from_email);
  const toEmail = cleanEmail(input.to_email || input.recipient_email || input.target_email || input.owner_email || input.reply_to_email || m.to_email || "owner@vaultforge.local");
  const signalId = clean(input.signal_id || input.signalId || m.signal_id);
  const itemId = clean(input.item_id || input.itemId || input.pain_id || input.project_id || input.deal_id || m.item_id);
  const source = normalizeSource(input.source || input.message_type || input.type || input.context || m.source, input);
  const folder = folderForSource(source, input);
  const subject = clean(input.subject || input.title || m.subject || labelForSource(source));
  const message = clean(input.message || input.body || input.note || input.content || m.message);
  const threadId = makeThreadId({ ...input, from_email: fromEmail, to_email: toEmail, signal_id: signalId, item_id: itemId, source });
  const now = new Date().toISOString();
  const createdAt = clean(input.created_at || m.created_at) || now;
  const updatedAt = mode === "write" ? now : clean(input.updated_at || m.updated_at) || createdAt;
  const status = clean(input.status || m.status || "open").toLowerCase();

  return {
    ...input,
    id: input.id || m.id || `${safePart(threadId)}-${createdAt}`,
    thread_id: threadId,
    from_email: fromEmail,
    sender_email: fromEmail,
    to_email: toEmail,
    recipient_email: toEmail,
    target_email: toEmail,
    owner_email: toEmail,
    signal_id: signalId || null,
    item_id: itemId || null,
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
    is_archived: input.is_archived === true || status === "archived",
    is_deleted: input.is_deleted === true || status === "deleted",
    created_at: createdAt,
    updated_at: updatedAt,
    metadata: {
      ...m,
      thread_id: threadId,
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

function visibleTo(row: Payload, email: string) {
  if (!email) return true;

  const from = cleanEmail(row.from_email || row.sender_email || row.member_email || meta(row).from_email);
  const to = cleanEmail(row.to_email || row.recipient_email || row.target_email || row.owner_email || meta(row).to_email);
  const visible = cleanEmail(row.visible_to_email || row.email || meta(row).visible_to_email);

  return from === email || to === email || visible === email || to === "owner@vaultforge.local";
}

function hidden(row: Payload) {
  const status = clean(row.status || meta(row).status).toLowerCase();
  return row?.is_deleted === true || row?.is_archived === true || status === "deleted" || status === "archived";
}

function fallbackRows(email: string) {
  const now = new Date().toISOString();
  return [
    normalize(
      {
        id: "local-welcome",
        thread_id: "general-welcome-system",
        from_email: "system@vaultforge.local",
        to_email: email || "member@vaultforge.local",
        subject: "VaultForge message center ready",
        message:
          "Messages will appear here when you contact an owner, request information, or reply to a signal.",
        source: "message",
        folder: "general",
        status: "open",
        signal_id: null,
        item_id: null,
        created_at: now,
        updated_at: now,
        metadata: {},
      },
      "read"
    ),
  ];
}

function dedupe(rows: Payload[]) {
  const seen = new Set<string>();
  const out: Payload[] = [];

  for (const raw of rows) {
    const row = normalize(raw, "read");
    const key = [row.thread_id, row.from_email, row.to_email, row.message, row.created_at].join("|").toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(row);
  }

  return out;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const email = cleanEmail(url.searchParams.get("email") || request.headers.get("x-vf-email"));
  const threadId = clean(url.searchParams.get("thread_id") || url.searchParams.get("threadId"));
  const source = normalizeSource(url.searchParams.get("source") || "");
  const client = supabase();

  if (!client) {
    return NextResponse.json({
      ok: true,
      source: "fallback-no-supabase",
      messages: fallbackRows(email),
      threads: fallbackRows(email),
    });
  }

  let lastError = "";

  for (const table of TABLES) {
    try {
      let query = client.from(table).select("*").order("created_at", { ascending: false }).limit(250);
      if (threadId) query = query.eq("thread_id", threadId);
      if (source && source !== "message") query = query.eq("source", source);

      const { data, error } = await query;
      if (error) {
        lastError = error.message || String(error);
        continue;
      }

      if (Array.isArray(data)) {
        const rows = dedupe(data)
          .filter((row: any) => !hidden(row))
          .filter((row: any) => visibleTo(row, email));

        return NextResponse.json({ ok: true, table, messages: rows, threads: rows, count: rows.length });
      }
    } catch (error: any) {
      lastError = error?.message || String(error);
    }
  }

  return NextResponse.json({
    ok: true,
    source: "fallback-empty",
    details: lastError,
    messages: fallbackRows(email),
    threads: fallbackRows(email),
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
      row,
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
    row,
  });
}
