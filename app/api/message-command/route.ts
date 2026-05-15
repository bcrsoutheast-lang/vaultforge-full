import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Row = Record<string, any>;

type ViewerState = {
  archived: Set<string>;
  deleted: Set<string>;
  saved: Set<string>;
  read: Set<string>;
  readAt: Map<string, string>;
  unreadAt: Map<string, string>;
};

type ConversationSummary = {
  thread_key: string;
  thread_id: string;
  source: string;
  folder: string;
  lane_label: string;
  title: string;
  latest_message: string;
  latest_at: string;
  count: number;
  unread_count: number;
  is_read: boolean;
  is_saved: boolean;
  from_email: string;
  to_email: string;
  message_ids: string[];
};

const TABLE = "vf_message_command_messages";
const OWNER_EMAIL = "bcrsoutheast@gmail.com";

function clean(v: unknown): string {
  return String(v || "").trim();
}

function lower(v: unknown): string {
  return clean(v).toLowerCase();
}

function first(...vals: unknown[]): string {
  for (const v of vals) {
    const t = clean(v);
    if (t) return t;
  }
  return "";
}

function meta(r: Row): Row {
  return r && typeof r.metadata === "object" && r.metadata ? r.metadata : {};
}

function safePart(v: string): string {
  return lower(v)
    .replace(/[^a-z0-9:_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 150);
}

function db() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    "";

  if (!url || !key) return null;

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function isOwner(email: string): boolean {
  return lower(email) === OWNER_EMAIL;
}

function sourceOfValue(v: unknown): string {
  const s = lower(v);
  if (s.includes("alert")) return "alert";
  if (s.includes("pain")) return "pain";
  if (s.includes("signal")) return "signal";
  if (s.includes("routing") || s.includes("route")) return "routing";
  if (s.includes("intro")) return "introduction";
  if (s.includes("project") || s.includes("deal") || s.includes("property")) return "project";
  if (s.includes("member")) return "member";
  if (s.includes("activity")) return "activity";
  return s || "general";
}

function folderForSource(s: string): string {
  if (s === "alert") return "alerts";
  if (s === "pain") return "pain";
  if (s === "signal") return "signals";
  if (s === "routing") return "routing";
  if (s === "introduction") return "introductions";
  if (s === "project") return "projects";
  if (s === "member") return "members";
  if (s === "activity") return "activity";
  return "general";
}

function sourceFromFolder(f: string): string {
  if (f === "alerts") return "alert";
  if (f === "pain") return "pain";
  if (f === "signals") return "signal";
  if (f === "routing") return "routing";
  if (f === "introductions") return "introduction";
  if (f === "projects") return "project";
  if (f === "members") return "member";
  if (f === "activity") return "activity";
  return "general";
}

function label(s: string): string {
  if (s === "alert") return "ALERTS";
  if (s === "pain") return "PAIN";
  if (s === "signal") return "SIGNALS";
  if (s === "routing") return "ROUTING";
  if (s === "introduction") return "INTRO";
  if (s === "project") return "PROJECTS";
  if (s === "member") return "MEMBERS";
  if (s === "activity") return "ACTIVITY";
  return "GENERAL";
}

function fromOf(r: Row): string {
  const m = meta(r);
  return lower(first(r.from_email, r.sender_email, r.email, r.member_email, m.from_email));
}

function toOf(r: Row): string {
  const m = meta(r);
  return lower(first(r.to_email, r.recipient_email, r.target_email, r.owner_email, m.to_email));
}

function participantsOf(r: Row): string[] {
  const m = meta(r);
  const raw = [
    fromOf(r),
    toOf(r),
    lower(first(r.owner_email, m.owner_email)),
    lower(first(r.target_email, m.target_email)),
    lower(first(r.recipient_email, m.recipient_email)),
    lower(first(r.member_email, m.member_email)),
    lower(first(r.viewer_email, m.viewer_email)),
    lower(first(r.participant_email, m.participant_email)),
    lower(first(r.created_by_email, m.created_by_email)),
  ];

  const metadataParticipants = Array.isArray(m.participants)
    ? m.participants.map(lower)
    : [];

  return Array.from(
    new Set([...raw, ...metadataParticipants].filter((v) => v.includes("@")))
  );
}

function titleOf(r: Row): string {
  const m = meta(r);
  return first(r.subject, r.title, m.subject, "VaultForge message")
    .replace(/^(re:\s*)+/gi, "")
    .trim();
}

function bodyOf(r: Row): string {
  const m = meta(r);
  return first(r.message, r.body, r.note, r.content, m.message);
}

function sourceOf(r: Row): string {
  const m = meta(r);
  return sourceOfValue(first(r.source, r.origin, r.message_type, r.folder, m.source, m.folder, "general"));
}

function folderOf(r: Row): string {
  const m = meta(r);
  return lower(first(r.folder, r.folder_key, m.folder, folderForSource(sourceOf(r))));
}

function rawThread(r: Row): string {
  const m = meta(r);
  return first(r.thread_key, r.threadKey, m.thread_key);
}

function canonical(r: Row): string {
  const existing = rawThread(r);
  if (existing && !existing.startsWith("marker:") && !existing.startsWith("cleanup:")) {
    return existing.includes("__") ? existing.split("__")[0] : existing;
  }

  const s = sourceOf(r);
  const m = meta(r);
  const id = first(
    r.signal_id,
    r.item_id,
    r.deal_id,
    r.project_id,
    r.pain_id,
    m.signal_id,
    m.item_id,
    r.thread_id,
    "general"
  );

  return `${s}:${safePart(String(id).replace(`${s}:`, "")) || "general"}`;
}

function created(r: Row): string {
  return first(r.created_at, r.updated_at, new Date().toISOString());
}

function updated(r: Row): string {
  return first(r.updated_at, r.created_at, new Date().toISOString());
}

function markerTime(r: Row): string {
  const m = meta(r);
  return first(r.created_at, r.updated_at, m.created_at, m.updated_at, new Date().toISOString());
}

function status(r: Row): string {
  return lower(first(r.status, meta(r).status, "sent"));
}

function markerKind(r: Row): string {
  return lower(first(meta(r).kind, r.kind));
}

function markerKey(r: Row): string {
  const m = meta(r);
  return first(m.cleanup_thread_key, m.hidden_thread_key, m.read_thread_key, m.saved_thread_key, r.cleanup_thread_key);
}

function markerViewer(r: Row): string {
  const m = meta(r);
  return lower(first(m.viewer_email, m.actor_email, m.from_email, r.viewer_email, r.actor_email, r.from_email));
}

function markerAction(r: Row): string {
  const m = meta(r);
  return lower(first(m.cleanup_action, m.marker_action, r.cleanup_action, r.status));
}

function isMarker(r: Row): boolean {
  const k = markerKind(r);
  return k === "thread_cleanup" || k === "thread_read" || k === "thread_saved";
}

function isHidden(r: Row): boolean {
  const s = status(r);
  return r.is_deleted === true || r.deleted === true || r.is_archived === true || r.archived === true || s === "deleted" || s === "archived";
}

function later(a: string, b: string): string {
  if (!a) return b;
  if (!b) return a;
  return String(a) >= String(b) ? a : b;
}

function viewerState(rows: Row[], viewerEmail: string): ViewerState {
  const archived = new Set<string>();
  const deleted = new Set<string>();
  const saved = new Set<string>();
  const read = new Set<string>();
  const readAt = new Map<string, string>();
  const unreadAt = new Map<string, string>();
  const viewer = lower(viewerEmail);

  for (const r of rows) {
    if (!isMarker(r)) continue;

    const key = markerKey(r);
    if (!key) continue;

    const actor = markerViewer(r);

    if (viewer && actor && actor !== viewer) continue;

    const a = markerAction(r);
    const at = markerTime(r);

    if (a === "delete" || a === "deleted") {
      deleted.add(key);
      archived.delete(key);
      saved.delete(key);
    } else if (a === "archive" || a === "archived") {
      archived.add(key);
    } else if (a === "save" || a === "saved") {
      saved.add(key);
    } else if (a === "unsave" || a === "unsaved") {
      saved.delete(key);
    } else if (a === "read") {
      read.add(key);
      readAt.set(key, later(readAt.get(key) || "", at));
    } else if (a === "unread") {
      read.delete(key);
      unreadAt.set(key, later(unreadAt.get(key) || "", at));
    } else if (a === "restore") {
      archived.delete(key);
      deleted.delete(key);
    }
  }

  return { archived, deleted, saved, read, readAt, unreadAt };
}

function normalize(r: Row): Row {
  const s = sourceOf(r);
  const f = folderOf(r);
  const key = canonical(r);
  const from = fromOf(r);
  const to = toOf(r);
  const participants = participantsOf(r);

  return {
    ...r,
    canonical_thread_key: key,
    thread_key: key,
    source: s,
    folder: f,
    folder_key: f,
    lane_label: label(s),
    from_email: from,
    to_email: to,
    // participants moved into metadata only,
    subject: titleOf(r),
    title: titleOf(r),
    message: bodyOf(r),
    body: bodyOf(r),
    created_at: created(r),
    updated_at: updated(r),
    status: status(r),
    read: r.read === true,
  };
}

function visible(r: Row, email: string): boolean {
  const viewer = lower(email);

  if (isOwner(viewer)) return true;
  if (!viewer) return false;

  const participants = participantsOf(r);

  return participants.includes(viewer);
}

function readCutoffForThread(key: string, marks: ViewerState): string {
  const readAt = marks.readAt.get(key) || "";
  const unreadAt = marks.unreadAt.get(key) || "";

  if (!readAt) return "";
  if (unreadAt && unreadAt >= readAt) return "";

  return readAt;
}

function forcedUnreadForThread(key: string, marks: ViewerState): boolean {
  const readAt = marks.readAt.get(key) || "";
  const unreadAt = marks.unreadAt.get(key) || "";
  return Boolean(unreadAt && unreadAt >= readAt);
}

function messageUnread(r: Row, key: string, marks: ViewerState, viewerEmail: string): boolean {
  const viewer = lower(viewerEmail);
  const from = fromOf(r);
  const cutoff = readCutoffForThread(key, marks);
  const messageAt = first(r.created_at, r.updated_at, new Date().toISOString());

  if (viewer && from === viewer) return false;
  if (cutoff && messageAt <= cutoff) return false;

  return r.read !== true;
}

function group(rows: Row[], marks: ViewerState, viewerEmail: string): ConversationSummary[] {
  const map = new Map<string, ConversationSummary>();

  for (const raw of rows) {
    const r = normalize(raw);
    const key = clean(r.canonical_thread_key);
    if (!key) continue;
    if (marks.deleted.has(key) || marks.archived.has(key)) continue;

    const existing = map.get(key);
    const latestAt = first(r.updated_at, r.created_at, new Date().toISOString());
    const messageId = clean(r.id);
    const unread = messageUnread(r, key, marks, viewerEmail);

    if (!existing) {
      map.set(key, {
        thread_key: key,
        thread_id: first(r.thread_id, safePart(key)),
        source: first(r.source, "general"),
        folder: first(r.folder, "general"),
        lane_label: first(r.lane_label, label(first(r.source, "general"))),
        title: first(r.title, r.subject, "VaultForge message"),
        latest_message: first(r.message, r.body, ""),
        latest_at: latestAt,
        count: 1,
        unread_count: unread ? 1 : 0,
        is_read: !unread,
        is_saved: marks.saved.has(key),
        from_email: first(r.from_email),
        to_email: first(r.to_email),
        message_ids: messageId ? [messageId] : [],
      });
    } else {
      existing.count += 1;
      if (messageId) existing.message_ids.push(messageId);
      if (unread) existing.unread_count += 1;

      if (String(latestAt) > String(existing.latest_at)) {
        existing.latest_at = latestAt;
        existing.latest_message = first(r.message, r.body, "");
        existing.title = first(r.title, r.subject, existing.title);
        existing.from_email = first(r.from_email, existing.from_email);
        existing.to_email = first(r.to_email, existing.to_email);
      }

      existing.is_saved = marks.saved.has(key);
    }
  }

  const conversations = Array.from(map.values()).map((conversation) => {
    if (forcedUnreadForThread(conversation.thread_key, marks) && conversation.unread_count <= 0) {
      conversation.unread_count = 1;
    }

    conversation.is_read = conversation.unread_count <= 0;
    conversation.is_saved = marks.saved.has(conversation.thread_key);

    return conversation;
  });

  return conversations.sort((a, b) => String(b.latest_at).localeCompare(String(a.latest_at)));
}

function counts(convos: ConversationSummary[]) {
  const c: Record<string, number> = {
    saved: 0,
    alerts: 0,
    pain: 0,
    signals: 0,
    routing: 0,
    introductions: 0,
    projects: 0,
    members: 0,
    activity: 0,
    general: 0,
  };
  const u: Record<string, number> = {
    saved: 0,
    alerts: 0,
    pain: 0,
    signals: 0,
    routing: 0,
    introductions: 0,
    projects: 0,
    members: 0,
    activity: 0,
    general: 0,
  };

  for (const x of convos) {
    const f = first(x.folder, "general");
    c[f] = (c[f] || 0) + Number(x.count || 0);
    u[f] = (u[f] || 0) + Number(x.unread_count || 0);

    if (x.is_saved) {
      c.saved += Number(x.count || 0);
      u.saved += Number(x.unread_count || 0);
    }
  }

  return { counts: c, unread: u };
}

function insertRow(input: Row): Row {
  const s = sourceOfValue(first(input.source, input.type, input.context, sourceFromFolder(first(input.folder, input.folder_key))));
  const f = lower(first(input.folder, input.folder_key, folderForSource(s)));
  const from = lower(first(input.from_email, input.sender_email, input.email, input.member_email));
  const to = lower(first(input.to_email, input.recipient_email, input.target_email, input.owner_email, OWNER_EMAIL));
  const signalId = first(input.signal_id, input.signalId);
  const itemId = first(input.item_id, input.itemId, input.deal_id, input.project_id, input.pain_id);
  const incoming = first(input.thread_key, input.threadKey);
  const identity = signalId || itemId || incoming.replace(`${s}:`, "") || first(input.thread_id, input.threadId) || "general";
  const key = incoming && !incoming.includes("__") ? incoming : `${s}:${safePart(identity) || "general"}`;
  const now = new Date().toISOString();
  const subject = first(input.subject, input.title, `${label(s)} message`);
  const message = first(input.message, input.body, input.note, input.content);
  const participants = Array.from(new Set([from, to].filter((v) => v.includes("@"))));

  return {
    thread_id: first(input.thread_id, input.threadId) || safePart(key),
    thread_key: key,
    source: s,
    folder: f,
    folder_key: f,
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
    deal_id: first(input.deal_id, itemId) || null,
    project_id: first(input.project_id) || null,
    pain_id: first(input.pain_id) || null,
    status: "sent",
    read: false,
    archived: false,
    is_archived: false,
    is_deleted: false,
    created_at: now,
    updated_at: now,
    // participants moved into metadata only,
    metadata: {
      thread_key: key,
      source: s,
      folder: f,
      from_email: from,
      to_email: to,
      subject,
      signal_id: signalId || null,
      item_id: itemId || null,
      // participants moved into metadata only,
      created_at: now,
      updated_at: now,
    },
  };
}

function marker(action: string, threadKey: string, email: string): Row {
  const now = new Date().toISOString();
  const s = sourceOfValue(threadKey.split(":")[0] || "general");
  const f = folderForSource(s);
  const e = lower(email || "system@vaultforge.local");
  const kind = action === "read" || action === "unread" ? "thread_read" : action === "save" || action === "unsave" ? "thread_saved" : "thread_cleanup";

  return {
    thread_id: `${kind}-${Date.now()}`,
    thread_key: `marker:${safePart(threadKey)}:${Date.now()}`,
    source: s,
    folder: f,
    folder_key: f,
    from_email: e,
    sender_email: e,
    to_email: e,
    recipient_email: e,
    target_email: e,
    owner_email: e,
    subject: `Thread ${action}`,
    title: `Thread ${action}`,
    message: `Thread ${threadKey} marked ${action}.`,
    body: `Thread ${threadKey} marked ${action}.`,
    note: `Thread ${threadKey} marked ${action}.`,
    status: action === "delete" ? "deleted" : action === "archive" ? "archived" : "sent",
    read: true,
    archived: action === "archive",
    is_archived: action === "archive",
    is_deleted: action === "delete",
    created_at: now,
    updated_at: now,
    metadata: {
      kind,
      cleanup_action: action,
      marker_action: action,
      cleanup_thread_key: threadKey,
      hidden_thread_key: threadKey,
      read_thread_key: threadKey,
      saved_thread_key: threadKey,
      viewer_email: e,
      actor_email: e,
      action_scope: "viewer_thread",
      created_at: now,
      updated_at: now,
    },
  };
}

export async function GET(request: Request) {
  const client = db();
  if (!client) return NextResponse.json({ ok: false, error: "Supabase missing." }, { status: 500 });

  const url = new URL(request.url);
  const email = lower(url.searchParams.get("email") || request.headers.get("x-vf-email"));
  const mode = lower(url.searchParams.get("mode") || "list");
  const threadKey = clean(url.searchParams.get("thread_key") || url.searchParams.get("threadKey"));
  const includeHidden = lower(url.searchParams.get("include_hidden")) === "1";

  const { data, error } = await client.from(TABLE).select("*").order("created_at", { ascending: false }).limit(1000);
  if (error) return NextResponse.json({ ok: false, error: error.message || String(error) }, { status: 500 });

  const all: Row[] = Array.isArray(data) ? (data as Row[]) : [];
  const marks = viewerState(all, email);

  let rows: Row[] = all
    .filter((r) => !isMarker(r))
    .filter((r) => includeHidden || !isHidden(r))
    .filter((r) => visible(r, email))
    .map(normalize)
    .filter((r) => !marks.deleted.has(clean(r.canonical_thread_key)))
    .filter((r) => includeHidden || !marks.archived.has(clean(r.canonical_thread_key)));

  if (mode === "thread" || threadKey) {
    rows = rows
      .filter((r) => clean(r.canonical_thread_key) === threadKey || clean(r.thread_key) === threadKey)
      .sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)));

    return NextResponse.json({
      ok: true,
      mode: "thread",
      viewer: email,
      owner_view: isOwner(email),
      thread_key: threadKey,
      messages: rows.map((r) => {
        const key = clean(r.canonical_thread_key);
        return { ...r, read: !messageUnread(r, key, marks, email) };
      }),
      count: rows.length,
    });
  }

  const conversations = group(rows, marks, email);
  const counted = counts(conversations);

  return NextResponse.json({
    ok: true,
    mode: "list",
    viewer: email,
    owner_view: isOwner(email),
    conversations,
    messages: rows,
    counts: counted.counts,
    unread_counts: counted.unread,
    count: rows.length,
  });
}

export async function POST(request: Request) {
  const client = db();
  if (!client) return NextResponse.json({ ok: false, error: "Supabase missing." }, { status: 500 });

  let input: Row = {};
  try {
    input = await request.json();
  } catch {}

  const row = insertRow(input);
  if (!row.from_email) return NextResponse.json({ ok: false, error: "Missing sender email." }, { status: 400 });
  if (!row.to_email) return NextResponse.json({ ok: false, error: "Missing recipient email." }, { status: 400 });
  if (!row.message) return NextResponse.json({ ok: false, error: "Missing message." }, { status: 400 });

  const { error } = await client.from(TABLE).insert(row);
  if (error) {
    return NextResponse.json(
      { ok: false, error: "Message could not be saved.", details: error.message || String(error), thread_key: row.thread_key },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, saved: true, row: normalize(row), thread_key: row.thread_key });
}

export async function PATCH(request: Request) {
  const client = db();
  if (!client) return NextResponse.json({ ok: false, error: "Supabase missing." }, { status: 500 });

  let input: Row = {};
  try {
    input = await request.json();
  } catch {}

  const action = lower(input.action);
  const threadKey = clean(input.thread_key || input.threadKey);
  const ids = Array.isArray(input.ids) ? input.ids.map(clean).filter(Boolean) : [];
  const email = lower(input.email || input.viewer_email || request.headers.get("x-vf-email") || "system@vaultforge.local");

  if (!["archive", "delete", "save", "unsave", "read", "unread", "restore"].includes(action)) {
    return NextResponse.json({ ok: false, error: "Unknown action." }, { status: 400 });
  }

  if (!threadKey && !ids.length) {
    return NextResponse.json({ ok: false, error: "Missing thread_key or ids." }, { status: 400 });
  }

  if (ids.length && ["archive", "delete", "read", "unread", "restore"].includes(action)) {
    const patch: Row = { updated_at: new Date().toISOString() };
    if (action === "archive") {
      patch.archived = true;
      patch.is_archived = true;
      patch.status = "archived";
    }
    if (action === "delete") {
      patch.is_deleted = true;
      patch.status = "deleted";
    }
    if (action === "read") patch.read = true;
    if (action === "unread") patch.read = false;
    if (action === "restore") {
      patch.archived = false;
      patch.is_archived = false;
      patch.is_deleted = false;
      patch.status = "sent";
    }

    await client.from(TABLE).update(patch).in("id", ids);
  }

  if (threadKey) {
    const { error } = await client.from(TABLE).insert(marker(action, threadKey, email));
    if (error) return NextResponse.json({ ok: false, error: "Marker failed.", details: error.message || String(error) }, { status: 500 });
  }

  return NextResponse.json({ ok: true, action, thread_key: threadKey, ids, viewer: email });
}
