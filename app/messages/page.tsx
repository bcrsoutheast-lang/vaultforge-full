"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import VaultForgeMemberNav from "../components/VaultForgeMemberNav";

type Row = Record<string, any>;

const LOCAL_KEY = "vf_simple_messages_local_v1";

const FOLDERS = [
  { key: "alerts", title: "Alerts", label: "ALERT", href: "/alerts", description: "Alert follow-up, Need More Info, Message Owner, and owner/member alert responses." },
  { key: "pain", title: "Pain", label: "PAIN", href: "/pain-feed", description: "Pain requests, distress signals, urgent help, and opportunity follow-up." },
  { key: "activity", title: "Activity", label: "LIVE", href: "/activity", description: "Execution activity, follow-up windows, and operational movement." },
  { key: "routing", title: "Routing", label: "ROUTE", href: "/routing-inbox", description: "Routing actions, member-fit messages, and match follow-up." },
  { key: "introductions", title: "Introductions", label: "INTRO", href: "/introductions", description: "Controlled introductions and intro response threads." },
  { key: "projects", title: "Projects", label: "DEAL", href: "/projects", description: "Project/deal-room communication and asset context." },
  { key: "members", title: "Members", label: "NET", href: "/members", description: "Member-to-member connection requests and network conversations." },
  { key: "signals", title: "Signals", label: "SIG", href: "/signals", description: "Only explicit signal-room messages. Alert messages with signal IDs stay under Alerts." },
  { key: "general", title: "General", label: "MSG", href: "/messages", description: "General/member-to-member messages not tied to a specific operational lane." },
];

function clean(value: unknown) { return String(value || "").trim(); }
function cleanEmail(value: unknown) { return clean(value).toLowerCase(); }

function readCookie(name: string) {
  if (typeof document === "undefined") return "";
  const match = document.cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  if (!match) return "";
  try { return decodeURIComponent(match.slice(name.length + 1)); } catch { return match.slice(name.length + 1); }
}

function currentEmail() {
  if (typeof window === "undefined") return "";
  const keys = ["vf_email", "vf_member_email", "vf_admin_email", "email", "memberEmail"];
  for (const key of keys) {
    const local = cleanEmail(window.localStorage.getItem(key));
    if (local.includes("@")) return local;
    const session = cleanEmail(window.sessionStorage.getItem(key));
    if (session.includes("@")) return session;
  }
  return cleanEmail(readCookie("vf_email") || readCookie("vf_member_email") || readCookie("vf_admin_email"));
}

function readLocalMessages() {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(LOCAL_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

function writeLocalMessages(rows: Row[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LOCAL_KEY, JSON.stringify(rows.slice(0, 400)));
}

function meta(row: Row) { return typeof row?.metadata === "object" && row.metadata ? row.metadata : {}; }
function first(...values: unknown[]) { for (const value of values) { const text = clean(value); if (text) return text; } return ""; }

function normalizeSource(value: unknown, row: Row = {}) {
  const raw = first(value, row.source, row.message_type, row.type, meta(row).source, "message").toLowerCase();
  const text = [raw, row.subject, row.title, row.message, row.body, row.note, meta(row).subject, meta(row).message].join(" ").toLowerCase();
  if (text.includes("alert") || text.includes("need-more") || text.includes("need_more") || text.includes("request-info") || text.includes("message-owner") || text.includes("urgent") || text.includes("priority")) return "alert";
  if (text.includes("pain") || text.includes("distress") || text.includes("funding gap")) return "pain";
  if (text.includes("activity") || text.includes("event")) return "activity";
  if (text.includes("routing") || text.includes("route")) return "routing";
  if (text.includes("intro")) return "introduction";
  if (text.includes("project") || text.includes("deal") || text.includes("property")) return "project";
  if (text.includes("member") || text.includes("connect") || text.includes("profile")) return "member";
  if (text.includes("signal")) return "signal";
  return raw || "message";
}

function folderForSource(source: string, row: Row = {}) {
  const override = first(row.folder, row.folder_key, meta(row).folder, meta(row).folder_key).toLowerCase();
  if (FOLDERS.some((folder) => folder.key === override)) return override;
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

function threadId(row: Row) { return first(row.thread_id, row.threadId, meta(row).thread_id, row.id, "general"); }
function sourceOf(row: Row) { return normalizeSource(first(row.source, row.message_type, row.type, meta(row).source, "message"), row); }
function subjectOf(row: Row) { return first(row.subject, row.title, meta(row).subject, "VaultForge message"); }
function bodyOf(row: Row) { return first(row.message, row.body, row.note, meta(row).message, "Message thread ready."); }
function fromOf(row: Row) { return cleanEmail(first(row.from_email, row.sender_email, row.member_email, meta(row).from_email)); }
function toOf(row: Row) { return cleanEmail(first(row.to_email, row.recipient_email, row.target_email, row.owner_email, meta(row).to_email)); }
function signalOf(row: Row) { return first(row.signal_id, row.signalId, meta(row).signal_id); }
function itemOf(row: Row) { return first(row.item_id, row.itemId, meta(row).item_id); }
function createdOf(row: Row) { return first(row.created_at, row.updated_at, meta(row).created_at); }
function rowKey(row: Row) { return [threadId(row), fromOf(row), toOf(row), bodyOf(row), createdOf(row)].join("|").toLowerCase(); }
function isArchivedOrDeleted(row: Row) { const status = first(row.status, meta(row).status).toLowerCase(); return row?.is_deleted === true || row?.is_archived === true || status === "deleted" || status === "archived"; }
function groupKey(row: Row) { return folderForSource(sourceOf(row), row); }

function normalizeRow(row: Row) {
  const source = sourceOf(row);
  const folder = folderForSource(source, row);
  const createdAt = createdOf(row) || new Date().toISOString();
  return {
    ...row,
    thread_id: threadId(row),
    source,
    origin: first(row.origin, meta(row).origin, source),
    message_type: source,
    folder,
    folder_key: folder,
    subject: subjectOf(row),
    title: subjectOf(row),
    message: bodyOf(row),
    body: bodyOf(row),
    note: bodyOf(row),
    from_email: fromOf(row),
    sender_email: fromOf(row),
    to_email: toOf(row),
    recipient_email: toOf(row),
    signal_id: signalOf(row) || null,
    item_id: itemOf(row) || null,
    created_at: createdAt,
    updated_at: first(row.updated_at, meta(row).updated_at, createdAt),
    metadata: { ...meta(row), thread_id: threadId(row), source, origin: first(row.origin, meta(row).origin, source), folder, folder_key: folder, signal_id: signalOf(row) || null, item_id: itemOf(row) || null, from_email: fromOf(row), to_email: toOf(row) },
  };
}

async function safeJson(res: Response) { try { return await res.json(); } catch { return {}; } }

const page: React.CSSProperties = { minHeight: "100vh", background: "radial-gradient(circle at top left, rgba(232,196,107,.15), transparent 28%), radial-gradient(circle at 90% 10%, rgba(181,92,255,.11), transparent 26%), linear-gradient(180deg,#020303,#071326 55%,#020303)", color: "white", padding: "22px 16px 96px", fontFamily: "Arial, sans-serif" };
const wrap: React.CSSProperties = { width: "min(1220px,100%)", margin: "0 auto" };
const card: React.CSSProperties = { border: "1px solid rgba(232,196,107,.24)", borderRadius: 30, padding: 24, background: "linear-gradient(145deg,rgba(255,255,255,.075),rgba(255,255,255,.032))", boxShadow: "0 28px 86px rgba(0,0,0,.30)", marginBottom: 18 };
const folderCard: React.CSSProperties = { border: "1px solid rgba(255,255,255,.13)", borderRadius: 26, padding: 20, background: "linear-gradient(145deg,rgba(255,255,255,.070),rgba(255,255,255,.030))", boxShadow: "0 18px 54px rgba(0,0,0,.22)" };
const threadCard: React.CSSProperties = { border: "1px solid rgba(255,255,255,.13)", borderRadius: 22, padding: 18, background: "rgba(255,255,255,.045)" };
const chip: React.CSSProperties = { border: "1px solid rgba(157,243,191,.22)", borderRadius: 999, padding: "7px 10px", color: "#9df3bf", background: "rgba(157,243,191,.07)", margin: "0 7px 7px 0", fontSize: 12, fontWeight: 850, display: "inline-flex" };
const goldChip: React.CSSProperties = { ...chip, color: "#f8e7b0", border: "1px solid rgba(232,196,107,.28)", background: "rgba(232,196,107,.08)" };
const button: React.CSSProperties = { display: "inline-flex", justifyContent: "center", alignItems: "center", minHeight: 46, borderRadius: 999, padding: "10px 15px", border: 0, background: "linear-gradient(135deg,#f8e7b0,#e8c46b)", color: "#06100a", fontWeight: 950, textDecoration: "none", cursor: "pointer" };
const ghost: React.CSSProperties = { ...button, background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.16)", color: "white" };
const danger: React.CSSProperties = { ...button, background: "rgba(248,113,113,.12)", border: "1px solid rgba(248,113,113,.28)", color: "#fecaca" };

function ThreadRow({ row, onMove, onArchive, onDelete }: { row: Row; onMove: (row: Row, folder: string) => void; onArchive: (row: Row) => void; onDelete: (row: Row) => void; }) {
  const id = threadId(row);
  const folder = groupKey(row);
  return (
    <article style={threadCard}>
      <div>
        <span style={goldChip}>{folder.toUpperCase()}</span>
        <span style={chip}>Source: {sourceOf(row)}</span>
        {signalOf(row) ? <span style={chip}>Signal: {signalOf(row)}</span> : null}
        {itemOf(row) ? <span style={chip}>Item: {itemOf(row)}</span> : null}
      </div>
      <h3 style={{ fontSize: 24, margin: "10px 0 8px", letterSpacing: "-.03em" }}>{subjectOf(row)}</h3>
      <p style={{ color: "#cbd5e1", lineHeight: 1.55, marginTop: 0 }}>{bodyOf(row)}</p>
      <div>
        {fromOf(row) ? <span style={chip}>From: {fromOf(row)}</span> : null}
        {toOf(row) ? <span style={chip}>To: {toOf(row)}</span> : null}
        {createdOf(row) ? <span style={chip}>{createdOf(row).slice(0, 19).replace("T", " ")}</span> : null}
      </div>
      <div className="vf-actions" style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
        <Link href={`/messages/${encodeURIComponent(id)}`} style={button}>Open Thread</Link>
        <button type="button" onClick={() => onMove(row, "alerts")} style={ghost}>Move Alerts</button>
        <button type="button" onClick={() => onMove(row, "signals")} style={ghost}>Move Signals</button>
        <button type="button" onClick={() => onMove(row, "general")} style={ghost}>Move General</button>
        <button type="button" onClick={() => onArchive(row)} style={ghost}>Archive</button>
        <button type="button" onClick={() => onDelete(row)} style={danger}>Delete</button>
      </div>
    </article>
  );
}

function FolderBlock({ folder, items, onMove, onArchive, onDelete }: { folder: (typeof FOLDERS)[number]; items: Row[]; onMove: (row: Row, folder: string) => void; onArchive: (row: Row) => void; onDelete: (row: Row) => void; }) {
  const [open, setOpen] = useState(items.length > 0);
  useEffect(() => { if (items.length > 0) setOpen(true); }, [items.length]);
  return (
    <section style={folderCard}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
        <div>
          <div style={{ color: "#e8c46b", letterSpacing: ".18em", textTransform: "uppercase", fontWeight: 950, fontSize: 12 }}>{folder.label}</div>
          <h2 style={{ fontSize: 34, margin: "8px 0 8px", letterSpacing: "-.045em" }}>{folder.title}</h2>
          <p style={{ color: "#cbd5e1", lineHeight: 1.45, margin: 0 }}>{folder.description}</p>
        </div>
        <div style={{ fontSize: 48, fontWeight: 1000, color: "#f8e7b0", lineHeight: 1 }}>{items.length}</div>
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
        <button type="button" onClick={() => setOpen((value) => !value)} style={items.length ? button : ghost}>{open ? "Hide" : "Open"} Folder</button>
        <Link href={folder.href} style={ghost}>Go to {folder.title}</Link>
      </div>
      {open ? <div style={{ display: "grid", gap: 12, marginTop: 16 }}>{items.length ? items.map((row, index) => <ThreadRow key={`${rowKey(row)}-${index}`} row={row} onMove={onMove} onArchive={onArchive} onDelete={onDelete} />) : <div style={threadCard}>No {folder.title.toLowerCase()} messages yet.</div>}</div> : null}
    </section>
  );
}

export default function MessagesPage() {
  const [viewerEmail, setViewerEmail] = useState("");
  const [items, setItems] = useState<Row[]>([]);
  const [status, setStatus] = useState("Loading messages...");
  const [query, setQuery] = useState("");

  async function load() {
    const viewer = currentEmail();
    setViewerEmail(viewer);
    setStatus("Loading messages...");
    let apiRows: Row[] = [];
    try {
      const res = await fetch(`/api/simple-messages?email=${encodeURIComponent(viewer)}`, { cache: "no-store", headers: { "x-vf-email": viewer } });
      const data = await safeJson(res);
      apiRows = [ ...(Array.isArray(data.messages) ? data.messages : []), ...(Array.isArray(data.threads) ? data.threads : []), ...(Array.isArray(data.items) ? data.items : []), ...(Array.isArray(data.data) ? data.data : []) ];
    } catch { apiRows = []; }

    const rows = [...apiRows, ...readLocalMessages()].map(normalizeRow).filter((row) => {
      if (isArchivedOrDeleted(row)) return false;
      if (!viewer) return true;
      const rowFrom = fromOf(row); const rowTo = toOf(row); const visible = cleanEmail(first(row.visible_to_email, row.email, meta(row).visible_to_email));
      return rowFrom === viewer || rowTo === viewer || visible === viewer || rowTo === "owner@vaultforge.local";
    });

    const seen = new Set<string>();
    const unique = rows.filter((row) => { const key = rowKey(row); if (seen.has(key)) return false; seen.add(key); return true; });
    unique.sort((a, b) => clean(createdOf(b)).localeCompare(clean(createdOf(a))));
    setItems(unique);
    setStatus(unique.length ? "" : "No messages yet.");
  }

  useEffect(() => { load(); }, []);

  function saveRows(nextRows: Row[]) {
    const normalized = nextRows.map(normalizeRow);
    setItems(normalized.filter((row) => !isArchivedOrDeleted(row)));
    writeLocalMessages(normalized);
  }

  function updateRow(row: Row, patch: Row) {
    const key = rowKey(row);
    const local = readLocalMessages().map(normalizeRow);
    const updated = normalizeRow({ ...row, ...patch, metadata: { ...meta(row), ...meta(patch) }, updated_at: new Date().toISOString() });
    const exists = local.some((item) => rowKey(item) === key);
    const next = exists ? local.map((item) => (rowKey(item) === key ? updated : item)) : [updated, ...local];
    saveRows(next);
  }

  function moveRow(row: Row, folder: string) {
    updateRow(row, { folder, folder_key: folder, metadata: { ...meta(row), folder, folder_key: folder } });
  }

  function archiveRow(row: Row) {
    updateRow(row, { is_archived: true, status: "archived", metadata: { ...meta(row), status: "archived" } });
  }

  function deleteRow(row: Row) {
    updateRow(row, { is_deleted: true, status: "deleted", metadata: { ...meta(row), status: "deleted" } });
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((row) => [threadId(row), sourceOf(row), subjectOf(row), bodyOf(row), fromOf(row), toOf(row), signalOf(row), itemOf(row), groupKey(row)].join(" ").toLowerCase().includes(q));
  }, [items, query]);

  const grouped = useMemo(() => {
    const map: Record<string, Row[]> = {};
    FOLDERS.forEach((folder) => (map[folder.key] = []));
    filtered.forEach((row) => { const key = groupKey(row); map[key] = map[key] || []; map[key].push(row); });
    return map;
  }, [filtered]);

  const activeCount = filtered.length;
  const foldersWithMessages = FOLDERS.filter((folder) => (grouped[folder.key] || []).length > 0).length;

  return (
    <main style={page}>
      <style>{`
        a:hover, button:hover { transform: translateY(-1px); transition: all .18s ease; filter: brightness(1.06); }
        input::placeholder { color: rgba(255,255,255,.45); }
        @media (max-width: 820px) { .vf-grid, .vf-actions { grid-template-columns: 1fr !important; } .vf-actions { display: grid !important; gap: 10px !important; } .vf-actions > * { width: 100%; box-sizing: border-box; justify-content: center; } }
      `}</style>
      <div style={wrap}>
        <VaultForgeMemberNav title="Messages" subtitle="All owner, member, alert, pain, signal, activity, and project conversations." active="messages" />
        <section style={card}>
          <div style={{ color: "#9df3bf", letterSpacing: ".18em", textTransform: "uppercase", fontWeight: 950, fontSize: 12 }}>VaultForge Message Command</div>
          <h1 style={{ fontSize: "clamp(54px,10vw,104px)", lineHeight: 0.88, letterSpacing: "-.075em", margin: "12px 0 18px" }}>All messages.</h1>
          <p style={{ color: "#cbd5e1", fontSize: 20, lineHeight: 1.55 }}>Alert messages stay in Alerts. Signal-room messages stay in Signals. Folder moves no longer rewrite the original source.</p>
          <div style={{ marginTop: 16 }}>
            <span style={chip}>Signed in: {viewerEmail || "unknown"}</span><span style={chip}>Messages: {activeCount}</span><span style={chip}>Active folders: {foldersWithMessages}</span><span style={goldChip}>Alerts: {(grouped.alerts || []).length}</span><span style={goldChip}>Signals: {(grouped.signals || []).length}</span><span style={goldChip}>General: {(grouped.general || []).length}</span>
          </div>
          <div className="vf-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 20 }}>
            <button type="button" onClick={load} style={button}>Refresh Messages</button><Link href="/dashboard" style={ghost}>Dashboard</Link><Link href="/alerts" style={ghost}>Alerts</Link><Link href="/signals" style={ghost}>Signals</Link>
          </div>
        </section>
        <section style={card}>
          <div style={{ color: "#e8c46b", letterSpacing: ".18em", textTransform: "uppercase", fontWeight: 950, fontSize: 12, marginBottom: 12 }}>Search Threads</div>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by message, email, signal, item, source..." style={{ width: "100%", boxSizing: "border-box", borderRadius: 18, border: "1px solid rgba(255,255,255,.16)", background: "rgba(255,255,255,.08)", color: "white", padding: 16, fontSize: 16, outline: "none" }} />
        </section>
        <section className="vf-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 16 }}>
          {FOLDERS.map((folder) => <FolderBlock key={folder.key} folder={folder} items={grouped[folder.key] || []} onMove={moveRow} onArchive={archiveRow} onDelete={deleteRow} />)}
        </section>
        {status ? <section style={card}>{status}</section> : null}
      </div>
    </main>
  );
}
