"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";

export const dynamic = "force-dynamic";

type LaneKey =
  | "saved"
  | "alerts"
  | "pain"
  | "signals"
  | "routing"
  | "introductions"
  | "projects"
  | "members"
  | "general";

type Conversation = {
  id?: string | number;
  thread_key?: string;
  threadKey?: string;
  canonical_thread_key?: string;
  lane?: string;
  route_lane?: string;
  folder?: string;
  folder_key?: string;
  source?: string;
  title?: string;
  subject?: string;
  body?: string;
  message?: string;
  latest_message?: string;
  preview?: string;
  from_email?: string;
  sender_email?: string;
  to_email?: string;
  recipient_email?: string;
  created_at?: string;
  updated_at?: string;
  last_message_at?: string;
  latest_at?: string;
  unread_count?: number;
  count?: number;
  is_saved?: boolean;
  is_archived?: boolean;
  is_deleted?: boolean;
  archived?: boolean;
  deleted?: boolean;
  read?: boolean;
  [key: string]: unknown;
};

type Toast = {
  type: "success" | "error" | "info";
  text: string;
};

const LANES: Array<{ key: LaneKey; title: string; subtitle: string }> = [
  { key: "saved", title: "Saved Bucket", subtitle: "Pinned conversations and saved requests." },
  { key: "alerts", title: "Alerts", subtitle: "Alert-driven outreach and responses." },
  { key: "pain", title: "Pain", subtitle: "Pain requests, owner questions, and execution follow-up." },
  { key: "signals", title: "Signals", subtitle: "Signal-room message threads and source intelligence." },
  { key: "routing", title: "Routing", subtitle: "Routing action conversations and match context." },
  { key: "introductions", title: "Introductions", subtitle: "Controlled introductions and response tracking." },
  { key: "projects", title: "Projects", subtitle: "Project-room and deal execution messages." },
  { key: "members", title: "Members", subtitle: "Member-to-member network conversations." },
  { key: "general", title: "General", subtitle: "Direct platform messages and uncategorized threads." },
];

function clean(value: unknown) {
  return String(value || "").trim();
}

function cleanLower(value: unknown) {
  return clean(value).toLowerCase();
}

function currentEmail() {
  if (typeof window === "undefined") return "";

  const keys = ["vf_email", "vaultforge_email", "email", "memberEmail"];
  for (const key of keys) {
    const value = window.localStorage.getItem(key) || window.sessionStorage.getItem(key);
    if (value) return value.trim().toLowerCase();
  }

  const cookieMatch = document.cookie.match(/(?:^|;\s*)vf_email=([^;]+)/);
  if (cookieMatch?.[1]) return decodeURIComponent(cookieMatch[1]).trim().toLowerCase();

  return "";
}

function safeTitle(value: unknown) {
  return clean(value) || "VaultForge message thread";
}

function safePreview(row: Conversation) {
  return clean(row.preview || row.latest_message || row.body || row.message || row.subject || "No preview available yet.");
}

function getThreadKey(row: Conversation) {
  return clean(row.thread_key || row.threadKey || row.canonical_thread_key || row.id || "");
}

function normalizeLane(value: unknown): LaneKey {
  const raw = cleanLower(value);
  if (raw.includes("save") || raw.includes("bucket")) return "saved";
  if (raw.includes("alert")) return "alerts";
  if (raw.includes("pain")) return "pain";
  if (raw.includes("signal")) return "signals";
  if (raw.includes("route") || raw.includes("routing")) return "routing";
  if (raw.includes("intro")) return "introductions";
  if (raw.includes("project") || raw.includes("deal") || raw.includes("property")) return "projects";
  if (raw.includes("member") || raw.includes("network")) return "members";
  return "general";
}

function inferLane(row: Conversation): LaneKey {
  if (row.is_saved) return "saved";

  const explicit = normalizeLane(row.lane || row.route_lane || row.folder || row.folder_key || row.source);
  if (explicit !== "general") return explicit;

  const threadKey = cleanLower(getThreadKey(row));
  if (threadKey.startsWith("saved:")) return "saved";
  if (threadKey.startsWith("alert:")) return "alerts";
  if (threadKey.startsWith("pain:")) return "pain";
  if (threadKey.startsWith("signal:")) return "signals";
  if (threadKey.startsWith("routing:") || threadKey.startsWith("route:")) return "routing";
  if (threadKey.startsWith("intro:") || threadKey.startsWith("introduction:")) return "introductions";
  if (threadKey.startsWith("project:") || threadKey.startsWith("deal:") || threadKey.startsWith("property:")) return "projects";
  if (threadKey.startsWith("member:")) return "members";

  return "general";
}

function formatDate(value: unknown) {
  const raw = clean(value);
  if (!raw) return "No timestamp";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;
  return date.toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

async function readJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function getConversations(payload: unknown): Conversation[] {
  if (Array.isArray(payload)) return payload as Conversation[];
  const data = payload as Record<string, unknown> | null;
  if (!data) return [];
  if (Array.isArray(data.conversations)) return data.conversations as Conversation[];
  if (Array.isArray(data.threads)) return data.threads as Conversation[];
  if (Array.isArray(data.messages)) return data.messages as Conversation[];
  if (Array.isArray(data.rows)) return data.rows as Conversation[];
  if (Array.isArray(data.data)) return data.data as Conversation[];
  return [];
}

export default function MessageCommandPage() {
  const [email, setEmail] = useState("");
  const [activeLane, setActiveLane] = useState<LaneKey | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState("");
  const [toast, setToast] = useState<Toast | null>(null);

  const showToast = useCallback((type: Toast["type"], text: string) => {
    setToast({ type, text });
    window.setTimeout(() => setToast(null), 3200);
  }, []);

  const loadConversations = useCallback(async () => {
    setLoading(true);
    try {
      const me = currentEmail();
      setEmail(me);
      const params = new URLSearchParams();
      if (me) params.set("email", me);
      params.set("mode", "list");

      const response = await fetch(`/api/message-command?${params.toString()}`, { method: "GET", cache: "no-store" });
      const payload = await readJson(response);
      if (!response.ok) {
        const errorText = clean((payload as Record<string, unknown> | null)?.error) || "Message Command failed to load.";
        throw new Error(errorText);
      }
      setConversations(getConversations(payload));
    } catch (error) {
      showToast("error", error instanceof Error ? error.message : "Message Command failed to load.");
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  const visibleConversations = useMemo(() => {
    return conversations.filter((row) => !row.is_archived && !row.archived && !row.is_deleted && !row.deleted && getThreadKey(row));
  }, [conversations]);

  const lanes = useMemo(() => {
    return LANES.map((lane) => {
      const rows = visibleConversations.filter((row) => inferLane(row) === lane.key);
      const unread = rows.reduce((total, row) => total + Number(row.unread_count || 0), 0);
      return { ...lane, count: rows.length, unread, rows };
    });
  }, [visibleConversations]);

  const activeLaneData = lanes.find((lane) => lane.key === activeLane) || null;

  async function runThreadAction(threadKey: string, action: string) {
    if (!threadKey) return;
    setBusyKey(`${action}:${threadKey}`);
    try {
      const response = await fetch("/api/message-command", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, thread_key: threadKey, threadKey, email: email || currentEmail() }),
      });
      const payload = await readJson(response);
      if (!response.ok) {
        const errorText = clean((payload as Record<string, unknown> | null)?.error) || `Unable to ${action}.`;
        throw new Error(errorText);
      }
      showToast("success", `Thread ${action.replace(/_/g, " ")} saved.`);
      await loadConversations();
    } catch (error) {
      showToast("error", error instanceof Error ? error.message : `Unable to ${action}.`);
    } finally {
      setBusyKey("");
    }
  }

  async function markLaneRead(laneKey: LaneKey) {
    const rows = visibleConversations.filter((row) => inferLane(row) === laneKey);
    setBusyKey(`mark_lane_read:${laneKey}`);
    try {
      for (const row of rows) {
        const threadKey = getThreadKey(row);
        if (threadKey) {
          await runThreadAction(threadKey, "read");
        }
      }
      showToast("success", "Lane marked read.");
      await loadConversations();
    } finally {
      setBusyKey("");
    }
  }

  return (
    <main style={styles.page}>
      <section style={styles.shell}>
        <header style={styles.header}>
          <div>
            <p style={styles.eyebrow}>VaultForge Message Command</p>
            <h1 style={styles.title}>Message Command</h1>
            <p style={styles.subtitle}>
              Secure command hub for saved requests, alerts, pain, signals, routing, introductions, projects, members, and general messages.
            </p>
          </div>
          <div style={styles.headerActions}>
            <button type="button" onClick={() => void loadConversations()} style={styles.secondaryButton}>
              Refresh
            </button>
            <Link href="/members" style={styles.secondaryLink}>
              Members
            </Link>
          </div>
        </header>

        {toast ? <div style={toast.type === "error" ? styles.toastError : styles.toast}>{toast.text}</div> : null}

        <div style={styles.statusBar}>
          <span>Signed context: {email || "browser session"}</span>
          <span>{visibleConversations.length} active thread{visibleConversations.length === 1 ? "" : "s"}</span>
        </div>

        {!activeLane ? (
          <section style={styles.grid}>
            {lanes.map((lane) => (
              <button key={lane.key} type="button" onClick={() => setActiveLane(lane.key)} style={styles.card}>
                <span style={styles.cardTopline}>{lane.title}</span>
                <strong style={styles.cardCount}>{loading ? "…" : lane.count}</strong>
                <span style={styles.cardSubtitle}>{lane.subtitle}</span>
                <span style={styles.cardFooter}>{lane.unread > 0 ? `${lane.unread} unread` : "No unread"}</span>
              </button>
            ))}
          </section>
        ) : (
          <section style={styles.panel}>
            <div style={styles.panelHeader}>
              <div>
                <p style={styles.eyebrow}>Lane</p>
                <h2 style={styles.panelTitle}>{activeLaneData?.title || "Messages"}</h2>
                <p style={styles.panelSubtitle}>{activeLaneData?.subtitle || "Conversation lane."}</p>
              </div>
              <div style={styles.headerActions}>
                <button
                  type="button"
                  onClick={() => void markLaneRead(activeLane)}
                  style={styles.secondaryButton}
                  disabled={busyKey.startsWith("mark_lane_read") || loading}
                >
                  Mark Lane Read
                </button>
                <button type="button" onClick={() => setActiveLane(null)} style={styles.goldButton}>
                  Back to Cards
                </button>
              </div>
            </div>

            {loading ? <div style={styles.empty}>Loading Message Command…</div> : null}
            {!loading && activeLaneData && activeLaneData.rows.length === 0 ? <div style={styles.empty}>No conversations in this lane yet.</div> : null}

            <div style={styles.list}>
              {(activeLaneData?.rows || []).map((row) => {
                const threadKey = getThreadKey(row);
                const busy = busyKey.endsWith(threadKey);
                return (
                  <article key={threadKey} style={styles.threadCard}>
                    <div style={styles.threadMain}>
                      <p style={styles.threadMeta}>{formatDate(row.last_message_at || row.latest_at || row.updated_at || row.created_at)}</p>
                      <h3 style={styles.threadTitle}>{safeTitle(row.title || row.subject || threadKey)}</h3>
                      <p style={styles.threadPreview}>{safePreview(row)}</p>
                      <p style={styles.threadSubline}>
                        {clean(row.from_email || row.sender_email) || "VaultForge"}
                        {clean(row.to_email || row.recipient_email) ? ` → ${clean(row.to_email || row.recipient_email)}` : ""}
                      </p>
                    </div>
                    <div style={styles.threadActions}>
                      <Link href={`/message-command/${encodeURIComponent(threadKey)}`} style={styles.openLink}>
                        Open Messages
                      </Link>
                      <button type="button" style={styles.smallButton} disabled={busy} onClick={() => void runThreadAction(threadKey, row.is_saved ? "unsave" : "save")}>
                        {row.is_saved ? "Unsave" : "Save"}
                      </button>
                      <button type="button" style={styles.smallButton} disabled={busy} onClick={() => void runThreadAction(threadKey, "read")}>
                        Mark Read
                      </button>
                      <button type="button" style={styles.smallButton} disabled={busy} onClick={() => void runThreadAction(threadKey, "unread")}>
                        Mark Unread
                      </button>
                      <button type="button" style={styles.dangerButton} disabled={busy} onClick={() => void runThreadAction(threadKey, "archive")}>
                        Archive
                      </button>
                      <button type="button" style={styles.dangerButton} disabled={busy} onClick={() => void runThreadAction(threadKey, "delete")}>
                        Delete
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}
      </section>
    </main>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at top left, rgba(220, 38, 38, 0.16), transparent 28%), radial-gradient(circle at top right, rgba(234, 179, 8, 0.14), transparent 26%), linear-gradient(180deg, #030509 0%, #07111f 48%, #020308 100%)",
    color: "#f8fafc",
    padding: "28px 16px 88px",
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
  },
  shell: { width: "min(1180px, 100%)", margin: "0 auto" },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 18,
    flexWrap: "wrap",
    padding: 22,
    border: "1px solid rgba(234,179,8,0.25)",
    borderRadius: 24,
    background: "rgba(2,6,23,0.72)",
    boxShadow: "0 24px 80px rgba(0,0,0,0.32)",
  },
  eyebrow: { margin: 0, color: "#facc15", fontSize: 12, fontWeight: 800, letterSpacing: "0.16em", textTransform: "uppercase" },
  title: { margin: "8px 0 8px", fontSize: "clamp(34px, 7vw, 76px)", lineHeight: 0.92, letterSpacing: "-0.06em" },
  subtitle: { margin: 0, maxWidth: 760, color: "#cbd5e1", fontSize: 16, lineHeight: 1.6 },
  headerActions: { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" },
  secondaryButton: {
    border: "1px solid rgba(148,163,184,0.28)",
    borderRadius: 999,
    background: "rgba(15,23,42,0.78)",
    color: "#e2e8f0",
    padding: "11px 15px",
    fontWeight: 800,
    cursor: "pointer",
  },
  secondaryLink: {
    border: "1px solid rgba(148,163,184,0.28)",
    borderRadius: 999,
    background: "rgba(15,23,42,0.78)",
    color: "#e2e8f0",
    padding: "11px 15px",
    fontWeight: 800,
    textDecoration: "none",
  },
  goldButton: {
    border: "1px solid rgba(250,204,21,0.58)",
    borderRadius: 999,
    background: "linear-gradient(135deg, #facc15, #b45309)",
    color: "#111827",
    padding: "11px 15px",
    fontWeight: 900,
    cursor: "pointer",
  },
  toast: {
    marginTop: 14,
    padding: "12px 14px",
    borderRadius: 16,
    border: "1px solid rgba(34,197,94,0.35)",
    background: "rgba(22,101,52,0.22)",
    color: "#dcfce7",
    fontWeight: 800,
  },
  toastError: {
    marginTop: 14,
    padding: "12px 14px",
    borderRadius: 16,
    border: "1px solid rgba(248,113,113,0.35)",
    background: "rgba(127,29,29,0.28)",
    color: "#fee2e2",
    fontWeight: 800,
  },
  statusBar: { marginTop: 14, display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", color: "#94a3b8", fontSize: 13, fontWeight: 700 },
  grid: { marginTop: 20, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 14 },
  card: {
    textAlign: "left",
    border: "1px solid rgba(234,179,8,0.22)",
    borderRadius: 22,
    padding: 18,
    minHeight: 190,
    background: "linear-gradient(180deg, rgba(15,23,42,0.92), rgba(2,6,23,0.86))",
    color: "#f8fafc",
    cursor: "pointer",
    boxShadow: "0 18px 55px rgba(0,0,0,0.28)",
  },
  cardTopline: { display: "block", color: "#facc15", fontSize: 13, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em" },
  cardCount: { display: "block", marginTop: 16, fontSize: 48, lineHeight: 1, letterSpacing: "-0.06em" },
  cardSubtitle: { display: "block", marginTop: 10, color: "#cbd5e1", lineHeight: 1.45 },
  cardFooter: { display: "inline-block", marginTop: 16, border: "1px solid rgba(248,113,113,0.28)", borderRadius: 999, padding: "7px 10px", color: "#fecaca", fontSize: 12, fontWeight: 900 },
  panel: { marginTop: 20, border: "1px solid rgba(234,179,8,0.22)", borderRadius: 24, padding: 18, background: "rgba(2,6,23,0.78)" },
  panelHeader: { display: "flex", justifyContent: "space-between", gap: 14, flexWrap: "wrap", alignItems: "flex-start", borderBottom: "1px solid rgba(148,163,184,0.16)", paddingBottom: 16 },
  panelTitle: { margin: "6px 0", fontSize: 32, letterSpacing: "-0.04em" },
  panelSubtitle: { margin: 0, color: "#cbd5e1", lineHeight: 1.5 },
  empty: { marginTop: 16, padding: 18, border: "1px dashed rgba(148,163,184,0.28)", borderRadius: 18, color: "#cbd5e1" },
  list: { display: "grid", gap: 12, marginTop: 16 },
  threadCard: { display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", gap: 16, border: "1px solid rgba(148,163,184,0.18)", borderRadius: 20, padding: 16, background: "rgba(15,23,42,0.72)" },
  threadMain: { minWidth: 0 },
  threadMeta: { margin: 0, color: "#94a3b8", fontSize: 12, fontWeight: 800 },
  threadTitle: { margin: "6px 0", fontSize: 20, letterSpacing: "-0.03em" },
  threadPreview: { margin: 0, color: "#cbd5e1", lineHeight: 1.5 },
  threadSubline: { margin: "9px 0 0", color: "#94a3b8", fontSize: 13, fontWeight: 700 },
  threadActions: { display: "flex", flexDirection: "column", gap: 8, minWidth: 150 },
  openLink: { textAlign: "center", borderRadius: 999, background: "linear-gradient(135deg, #facc15, #b45309)", color: "#111827", padding: "10px 12px", fontWeight: 900, textDecoration: "none" },
  smallButton: { border: "1px solid rgba(148,163,184,0.24)", borderRadius: 999, background: "rgba(15,23,42,0.86)", color: "#e2e8f0", padding: "9px 11px", fontWeight: 800, cursor: "pointer" },
  dangerButton: { border: "1px solid rgba(248,113,113,0.26)", borderRadius: 999, background: "rgba(127,29,29,0.24)", color: "#fecaca", padding: "9px 11px", fontWeight: 900, cursor: "pointer" },
};
