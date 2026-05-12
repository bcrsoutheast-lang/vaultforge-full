import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Row = Record<string, any>;

const COMMAND_TABLE = "vf_message_command_messages";
const LEGACY_READ_TABLES = ["vf_messages", "simple_messages", "messages"];

function clean(value: unknown) {
  return String(value || "").trim();
}

function lower(value: unknown) {
  return clean(value).toLowerCase();
}

function first(...values: unknown[]) {
  for (const value of values) {
    const text = clean(value);
    if (text) return text;
  }

  return "";
}

function meta(row: Row) {
  return typeof row?.metadata === "object" && row.metadata ? row.metadata : {};
}

function env(name: string) {
  return process.env[name] || "";
}

function db() {
  const url = env("NEXT_PUBLIC_SUPABASE_URL");
  const key =
    env("SUPABASE_SERVICE_ROLE_KEY") ||
    env("NEXT_PUBLIC_SUPABASE_ANON_KEY") ||
    env("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");

  if (!url || !key) return null;

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function safePart(value: string) {
  return lower(value)
    .replace(/[^a-z0-9:_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 140);
}

function normalizeSource(value: unknown, row: Row = {}) {
  const m = meta(row);
  const text = lower(
    [
      value,
      row.source,
      row.origin,
      row.message_type,
      row.folder,
      row.folder_key,
      row.subject,
      row.title,
      row.thread_id,
      row.thread_key,
      m.source,
      m.folder,
      m.subject,
    ].join(" ")
  );

  if (text.includes("alert") || text.includes("message-owner") || text.includes("request-info") || text.includes("need-more")) return "alert";
  if (text.includes("pain") || text.includes("distress") || text.includes("funding")) return "pain";
  if (text.includes("signal")) return "signal";
  if (text.includes("routing") || text.includes("route")) return "routing";
  if (text.includes("intro")) return "introduction";
  if (text.includes("project") || text.includes("deal") || text.includes("property")) return "project";
  if (text.includes("member") || text.includes("connect")) return "member";
  if (text.includes("activity") || text.includes("event")) return "activity";

  return lower(value) || "message";
}

function folderForSource(source: string) {
  if (source === "alert") return "alerts";
  if (source === "pain") return "pain";
  if (source === "signal") return "signals";
  if (source === "routing") return "routing";
  if (source === "introduction") return "introductions";
  if (source === "project") return "projects";
  if (source === "member") return "members";
  if (source === "activity") return "activity";

  return "general";
}

function laneLabel(source: string) {
  if (source === "alert") return "ALERTS";
  if (source === "pain") return "PAIN";
  if (source === "signal") return "SIGNALS";
  if (source === "routing") return "ROUTING";
  if (source === "introduction") return "INTRO";
  if (source === "project") return "PROJECTS";
  if (source === "member") return "MEMBERS";
  if (source === "activity") return "ACTIVITY";

  return "GENERAL";
}

function fromOf(row: Row) {
  const m = meta(row);
  return lower(first(row.from_email, row.sender_email, row.member_email, row.email, m.from_email));
}

function toOf(row: Row) {
  const m = meta(row);
  return lower(first(row.to_email, row.recipient_email, row.target_email, row.owner_email, m.to_email));
}

function titleOf(row: Row) {
  const m = meta(row);

  return (
    first(row.subject, row.title, m.subject, "VaultForge message")
      .replace(/^(re:\s*)+/gi, "")
      .replace(/\s+/g, " ")
      .trim() || "VaultForge message"
  );
}

function bodyOf(row: Row) {
  const m = meta(row);
  return first(row.message, row.body, row.note, row.content, m.message);
}

function createdOf(row: Row) {
  const m = meta(row);
  return first(row.created_at, row.updated_at, m.created_at, new Date().toISOString());
}

function updatedOf(row: Row) {
  const m = meta(row);
  return first(row.updated_at, row.created_at, m.updated_at, m.created_at, new Date().toISOString());
}

function statusOf(row: Row) {
  const m = meta(row);
  return lower(first(row.status, m.status, "sent"));
}

function isHidden(row: Row) {
  const status = statusOf(row);

  return (
    row?.is_deleted === true ||
    row?.deleted === true ||
    row?.is_archived === true ||
    row?.archived === true ||
    status === "deleted" ||
    status === "archived"
  );
}

function cleanupThreadKey(row: Row) {
  const m = meta(row);

  return clean(
    row.cleanup_thread_key ||
      row.hidden_thread_key ||
      m.cleanup_thread_key ||
      m.hidden_thread_key
  );
}

function isThreadCleanupMarker(row: Row) {
  const m = meta(row);

  return (
    cleanupThreadKey(row) ||
    row.kind === "thread_cleanup" ||
    m.kind === "thread_cleanup" ||
    m.action_scope === "thread"
  );
}

function cleanupActionOf(row: Row) {
  const m = meta(row);
  return lower(row.cleanup_action || m.cleanup_action || row.status || m.status);
}

function buildSuppressedThreads(rows: Row[]) {
  const archived = new Set<string>();
  const deleted = new Set<string>();
  const saved = new Set<string>();

  for (const raw of rows) {
    if (!isThreadCleanupMarker(raw)) continue;

    const key = cleanupThreadKey(raw) || canonicalThreadKey(raw);
    if (!key) continue;

    const action = cleanupActionOf(raw);

    if (action === "delete" || action === "deleted") {
      deleted.add(key);
      archived.delete(key);
      saved.delete(key);
    } else if (action === "archive" || action === "archived") {
      archived.add(key);
    } else if (action === "save" || action === "saved") {
      saved.add(key);
    } else if (action === "unsave" || action === "unsaved") {
      saved.delete(key);
    } else if (action === "restore" || action === "sent") {
      archived.delete(key);
      deleted.delete(key);
    }
  }

  return { archived, deleted, saved };
}

function idOf(row: Row) {
  const m = meta(row);
  return first(row.id, m.id);
}

function itemIdOf(row: Row) {
  const m = meta(row);
  return first(row.item_id, row.itemId, row.deal_id, row.project_id, row.pain_id, m.item_id, m.deal_id, m.project_id, m.pain_id);
}

function signalIdOf(row: Row) {
  const m = meta(row);
  return first(row.signal_id, row.signalId, m.signal_id);
}

function threadIdOf(row: Row) {
  const m = meta(row);
  return first(row.thread_id, row.threadId, m.thread_id);
}

function rawThreadKeyOf(row: Row) {
  const m = meta(row);
  return first(row.thread_key, row.threadKey, m.thread_key);
}

function inferIdentityFromOldThreadKey(raw: string) {
  let value = clean(raw);
  if (!value) return "";

  if (value.includes("__")) value = value.split("__")[0];

  if (value.includes(":")) {
    const pieces = value.split(":").filter(Boolean);
    value = pieces[pieces.length - 1] || value;
  }

  return value;
}

function stripRoutePrefix(value: string, source: string) {
  let text = clean(value);

  if (!text) return "";

  const prefix = `${source}-`;
  if (text.toLowerCase().startsWith(prefix)) {
    text = text.slice(prefix.length);
  }

  if (text.includes("__")) {
    text = text.split("__")[0];
  }

  if (text.includes(":")) {
    const pieces = text.split(":").filter(Boolean);
    text = pieces[pieces.length - 1] || text;
  }

  return text;
}

function canonicalThreadKey(row: Row) {
  const source = normalizeSource(row.source || row.message_type || row.folder, row);
  const signalId = signalIdOf(row);
  const itemId = itemIdOf(row);
  const oldThreadKey = inferIdentityFromOldThreadKey(rawThreadKeyOf(row));
  const threadId = stripRoutePrefix(threadIdOf(row), source);

  const identity = signalId || itemId || oldThreadKey || threadId || "general";

  return `${source}:${safePart(identity) || "general"}`;
}

function normalize(row: Row) {
  const source = normalizeSource(row.source || row.message_type || row.folder, row);
  const folder = clean(row.folder || row.folder_key || folderForSource(source));
  const threadKey = canonicalThreadKey(row);
  const from = fromOf(row);
  const to = toOf(row);
  const now = new Date().toISOString();

  return {
    ...row,
    id: idOf(row),
    canonical_thread_key: threadKey,
    thread_key: rawThreadKeyOf(row) || threadKey,
    thread_id: threadIdOf(row) || safePart(threadKey),
    source,
    origin: source,
    message_type: source,
    folder,
    folder_key: folder,
    lane: folder,
    lane_label: laneLabel(source),
    from_email: from,
    sender_email: from,
    to_email: to,
    recipient_email: to,
    target_email: to,
    owner_email: to,
    subject: titleOf(row),
    title: titleOf(row),
    message: bodyOf(row),
    body: bodyOf(row),
    note: bodyOf(row),
    created_at: createdOf(row),
    updated_at: updatedOf(row),
    status: statusOf(row) || "sent",
    is_archived: row?.is_archived === true || row?.archived === true || statusOf(row) === "archived",
    is_deleted: row?.is_deleted === true || row?.deleted === true || statusOf(row) === "deleted",
    metadata: {
      ...meta(row),
      canonical_thread_key: threadKey,
      thread_key: rawThreadKeyOf(row) || threadKey,
      source,
      folder,
      folder_key: folder,
      from_email: from,
      to_email: to,
      subject: titleOf(row),
      updated_at: updatedOf(row) || now,
    },
  };
}

function visibleTo(row: Row, email: string) {
  if (!email) return true;

  const from = fromOf(row);
  const to = toOf(row);
  const m = meta(row);
  const visible = lower(first(row.visible_to_email, row.email, m.visible_to_email));

  return (
    email === "bcrsoutheast@gmail.com" ||
    from === email ||
    to === email ||
    visible === email ||
    to === "owner@vaultforge.local" ||
    to === "bcrsoutheast@gmail.com"
  );
}

function dedupe(rows: Row[]) {
  const seen = new Set<string>();
  const out: Row[] = [];

  for (const raw of rows) {
    const row = normalize(raw);
    const key =
      idOf(row) ||
      [
        row.canonical_thread_key,
        row.from_email,
        row.to_email,
        row.message,
        row.created_at,
      ].join("|");

    if (seen.has(key)) continue;
    seen.add(key);
    out.push(row);
  }

  return out;
}

async function selectFromTable(client: NonNullable<ReturnType<typeof db>>, table: string) {
  const { data, error } = await client
    .from(table)
    .select("*")
    .order("created_at", { ascending: false })
    .limit(900);

  if (error) return { rows: [] as Row[], error: error.message || String(error) };
  return { rows: Array.isArray(data) ? data : [], error: "" };
}

async function readRows() {
  const client = db();

  if (!client) {
    return { rows: [] as Row[], error: "No Supabase client" };
  }

  let rows: Row[] = [];
  let lastError = "";

  const command = await selectFromTable(client, COMMAND_TABLE);
  rows = rows.concat(command.rows);
  if (command.error) lastError = command.error;

  for (const table of LEGACY_READ_TABLES) {
    const result = await selectFromTable(client, table);
    rows = rows.concat(result.rows);
    if (result.error) lastError = result.error;
  }

  return { rows, error: lastError };
}

function groupConversations(rows: Row[]) {
  const map = new Map<string, any>();

  for (const row of rows) {
    const key = row.canonical_thread_key;
    const existing = map.get(key);

    if (!existing) {
      map.set(key, {
        thread_key: key,
        thread_id: row.thread_id || safePart(key),
        source: row.source,
        folder: row.folder,
        lane_label: row.lane_label,
        title: row.title,
        latest_message: row.message,
        latest_at: row.updated_at || row.created_at,
        count: 1,
        from_email: row.from_email,
        to_email: row.to_email,
        participants: Array.from(new Set([row.from_email, row.to_email].filter(Boolean))),
        message_ids: row.id ? [row.id] : [],
      });

      continue;
    }

    existing.count += 1;
    if (row.id) existing.message_ids.push(row.id);

    existing.participants = Array.from(
      new Set([...existing.participants, row.from_email, row.to_email].filter(Boolean))
    );

    const rowTime = row.updated_at || row.created_at;
    if (rowTime > existing.latest_at) {
      existing.latest_at = rowTime;
      existing.latest_message = row.message;
      existing.title = row.title;
      existing.from_email = row.from_email;
      existing.to_email = row.to_email;
    }
  }

  return Array.from(map.values()).sort((a, b) => String(b.latest_at).localeCompare(String(a.latest_at)));
}

function folderCounts(conversations: any[]) {
  const counts: Record<string, number> = {
    alerts: 0,
    pain: 0,
    signals: 0,
    routing: 0,
    introductions: 0,
    projects: 0,
    members: 0,
    activity: 0,
    general: 0,
    saved: 0,
  };

  for (const convo of conversations) {
    counts[convo.folder || "general"] = (counts[convo.folder || "general"] || 0) + Number(convo.count || 0);

    if (convo.is_saved === true) {
      counts.saved += Number(convo.count || 0);
    }
  }

  return counts;
}

function buildMessageRow(input: Row) {
  const source = normalizeSource(input.source || input.type || input.context || input.folder, input);
  const folder = clean(input.folder || input.folder_key || folderForSource(source));
  const from = lower(first(input.from_email, input.sender_email, input.email, input.member_email, input.user_email));
  const to = lower(first(input.to_email, input.recipient_email, input.target_email, input.owner_email, input.reply_to_email, "bcrsoutheast@gmail.com"));
  const signalId = first(input.signal_id, input.signalId);
  const itemId = first(input.item_id, input.itemId, input.deal_id, input.project_id, input.pain_id);
  const explicitThreadKey = inferIdentityFromOldThreadKey(first(input.thread_key, input.threadKey));
  const threadIdIdentity = stripRoutePrefix(first(input.thread_id, input.threadId), source);
  const identity = signalId || itemId || explicitThreadKey || threadIdIdentity || "general";
  const canonical = `${source}:${safePart(identity.replace(`${source}:`, "")) || "general"}`;
  const now = new Date().toISOString();
  const subject = clean(first(input.subject, input.title, `${laneLabel(source)} message`));
  const message = clean(first(input.message, input.body, input.note, input.content));

  return {
    thread_id: first(input.thread_id, input.threadId) || safePart(canonical),
    thread_key: canonical,
    source,
    folder,
    folder_key: folder,
    from_email: from,
    sender_email: from,
    to_email: to,
    recipient_email: to,
    target_email: to,
    owner_email: to,
    subject,
    title: subject,
    message,
    body: message,
    note: message,
    signal_id: signalId || null,
    item_id: itemId || null,
    deal_id: itemId || null,
    project_id: first(input.project_id) || null,
    pain_id: first(input.pain_id) || null,
    status: "sent",
    read: false,
    archived: false,
    is_archived: false,
    is_deleted: false,
    created_at: now,
    updated_at: now,
    metadata: {
      canonical_thread_key: canonical,
      thread_key: canonical,
      source,
      folder,
      folder_key: folder,
      signal_id: signalId || null,
      item_id: itemId || null,
      from_email: from,
      to_email: to,
      subject,
      created_at: now,
      updated_at: now,
    },
  };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const email = lower(url.searchParams.get("email") || request.headers.get("x-vf-email"));
  const mode = lower(url.searchParams.get("mode") || "list");
  const folder = lower(url.searchParams.get("folder") || "");
  const threadKey = clean(url.searchParams.get("thread_key") || url.searchParams.get("threadKey"));
  const includeHidden = lower(url.searchParams.get("include_hidden")) === "1";

  const result = await readRows();

  const normalizedAllRows = dedupe(result.rows);
  const suppressed = buildSuppressedThreads(normalizedAllRows);

  let rows = normalizedAllRows
    .filter((row) => !isThreadCleanupMarker(row))
    .filter((row) => {
      const key = row.canonical_thread_key || canonicalThreadKey(row);
      if (suppressed.deleted.has(key)) return false;
      if (!includeHidden && suppressed.archived.has(key)) return false;
      return true;
    })
    .filter((row) => includeHidden || !isHidden(row))
    .filter((row) => visibleTo(row, email));

  if (folder) rows = rows.filter((row) => row.folder === folder || row.folder_key === folder);

  if (threadKey || mode === "thread") {
    const key = threadKey;
    rows = rows.filter((row) => row.canonical_thread_key === key || row.thread_key === key);

    rows.sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)));

    return NextResponse.json({
      ok: true,
      table: COMMAND_TABLE,
      mode: "thread",
      thread_key: key,
      messages: rows,
      count: rows.length,
      read_error: result.error || "",
    });
  }

  const conversations = groupConversations(rows).map((conversation) => ({
    ...conversation,
    is_saved: suppressed.saved.has(conversation.thread_key),
  }));

  return NextResponse.json({
    ok: true,
    table: COMMAND_TABLE,
    mode: "list",
    messages: rows,
    conversations,
    counts: folderCounts(conversations),
    count: rows.length,
    read_error: result.error || "",
  });
}

export async function POST(request: Request) {
  let input: Row = {};

  try {
    input = await request.json();
  } catch {
    input = {};
  }

  const row = buildMessageRow(input);

  if (!row.from_email) {
    return NextResponse.json({ ok: false, error: "Missing sender email." }, { status: 400 });
  }

  if (!row.to_email) {
    return NextResponse.json({ ok: false, error: "Missing recipient email." }, { status: 400 });
  }

  if (!row.message) {
    return NextResponse.json({ ok: false, error: "Missing message." }, { status: 400 });
  }

  const client = db();

  if (!client) {
    return NextResponse.json({
      ok: false,
      error: "Supabase client missing.",
      thread_key: row.thread_key,
    }, { status: 500 });
  }

  const { error } = await client.from(COMMAND_TABLE).insert(row);

  if (error) {
    return NextResponse.json({
      ok: false,
      error: "Message could not be saved.",
      details: error.message || String(error),
      table: COMMAND_TABLE,
      attempted_thread_key: row.thread_key,
      attempted_source: row.source,
      attempted_folder: row.folder,
    }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    saved: true,
    table: COMMAND_TABLE,
    row: normalize(row),
    data: normalize(row),
    thread_key: row.thread_key,
  });
}

export async function PATCH(request: Request) {
  let input: Row = {};

  try {
    input = await request.json();
  } catch {
    input = {};
  }

  const action = lower(input.action);
  const threadKey = clean(input.thread_key || input.threadKey);
  const actionScope = lower(input.action_scope || input.scope);
  const ids = Array.isArray(input.ids) ? input.ids.map(clean).filter(Boolean) : [];
  const id = clean(input.id);
  if (id) ids.push(id);

  if (!ids.length && !threadKey) {
    return NextResponse.json({ ok: false, error: "Missing message ids or thread_key." }, { status: 400 });
  }

  const patch: Row = {
    updated_at: new Date().toISOString(),
  };

  if (action === "archive") {
    patch.archived = true;
    patch.is_archived = true;
    patch.status = "archived";
  } else if (action === "delete") {
    patch.is_deleted = true;
    patch.status = "deleted";
  } else if (action === "restore") {
    patch.archived = false;
    patch.is_archived = false;
    patch.is_deleted = false;
    patch.status = "sent";
  } else if (action === "save" || action === "unsave") {
    patch.status = "sent";
  } else {
    return NextResponse.json({ ok: false, error: "Unknown action." }, { status: 400 });
  }

  const client = db();

  if (!client) {
    return NextResponse.json({ ok: false, error: "Supabase client missing." }, { status: 500 });
  }

  let updated = 0;
  let updateError = "";

  if (ids.length) {
    const { data, error } = await client
      .from(COMMAND_TABLE)
      .update(patch)
      .in("id", ids)
      .select("*");

    if (error) {
      updateError = error.message || String(error);
    } else {
      updated = Array.isArray(data) ? data.length : 0;
    }
  }

  /*
    Critical:
    Legacy rows from vf_messages cannot always be updated from this new system.
    For whole-thread cleanup we create a cleanup marker in the command table.
    GET reads this marker and suppresses old legacy rows from counts/cards.
  */
  if (threadKey && (actionScope === "thread" || !ids.length || action === "archive" || action === "delete" || action === "save" || action === "unsave")) {
    const now = new Date().toISOString();
    const source = normalizeSource(threadKey);
    const folder = folderForSource(source);

    const marker = {
      thread_id: `cleanup-${safePart(threadKey)}`,
      thread_key: `cleanup:${safePart(threadKey)}:${Date.now()}`,
      source,
      folder,
      folder_key: folder,
      from_email: lower(input.email || input.viewer_email || "system@vaultforge.local"),
      sender_email: lower(input.email || input.viewer_email || "system@vaultforge.local"),
      to_email: lower(input.email || input.viewer_email || "system@vaultforge.local"),
      recipient_email: lower(input.email || input.viewer_email || "system@vaultforge.local"),
      target_email: lower(input.email || input.viewer_email || "system@vaultforge.local"),
      owner_email: lower(input.email || input.viewer_email || "system@vaultforge.local"),
      subject: `Thread ${action}`,
      title: `Thread ${action}`,
      message: `Thread ${threadKey} marked ${action}.`,
      body: `Thread ${threadKey} marked ${action}.`,
      note: `Thread ${threadKey} marked ${action}.`,
      status: action === "restore" ? "sent" : action === "archive" ? "archived" : "deleted",
      read: true,
      archived: action === "archive",
      is_archived: action === "archive",
      is_deleted: action === "delete",
      created_at: now,
      updated_at: now,
      metadata: {
        kind: "thread_cleanup",
        action_scope: "thread",
        cleanup_action: action,
        cleanup_thread_key: threadKey,
        hidden_thread_key: threadKey,
        created_at: now,
        updated_at: now,
      },
    };

    const { error } = await client.from(COMMAND_TABLE).insert(marker);

    if (error) {
      return NextResponse.json({
        ok: false,
        error: "Cleanup marker failed.",
        details: error.message || String(error),
        update_error: updateError,
        thread_key: threadKey,
      }, { status: 500 });
    }
  }

  if (updateError && !threadKey) {
    return NextResponse.json({
      ok: false,
      error: "Cleanup failed.",
      details: updateError,
    }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    table: COMMAND_TABLE,
    action,
    scope: threadKey ? "thread" : "message",
    updated,
    thread_key: threadKey,
  });
}
