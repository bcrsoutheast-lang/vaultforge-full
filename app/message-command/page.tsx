"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";

export const dynamic = "force-dynamic";

type LaneKey =
  | "priority"
  | "saved"
  | "signals"
  | "execution"
  | "network"
  | "general";

type Conversation = Record<string, any>;

type CommandLane = {
  key: LaneKey;
  title: string;
  subtitle: string;
  label: string;
  purpose: string;
  statusEmpty: string;
};

const COMMAND_LANES: CommandLane[] = [
  {
    key: "priority",
    title: "Priority",
    subtitle: "Urgent active threads, unread pressure, and owner attention.",
    label: "Mission Control",
    purpose: "Unread, saved, or high-attention threads that need action first.",
    statusEmpty: "No priority pressure.",
  },
  {
    key: "saved",
    title: "Saved Bucket",
    subtitle: "Pinned opportunities, operators, and high-value conversations.",
    label: "Working Memory",
    purpose: "Important conversations you intentionally saved for follow-up.",
    statusEmpty: "No saved conversations.",
  },
  {
    key: "signals",
    title: "Signals",
    subtitle: "Signals, alerts, routing, and introduction intelligence.",
    label: "Intelligence Flow",
    purpose: "Messages created from alerts, signal rooms, routing, and introductions.",
    statusEmpty: "No signal messages.",
  },
  {
    key: "execution",
    title: "Execution",
    subtitle: "Pain requests, projects, and active operational work.",
    label: "Active Work",
    purpose: "Pain requests, deal rooms, projects, and work that needs execution.",
    statusEmpty: "No execution threads.",
  },
  {
    key: "network",
    title: "Network",
    subtitle: "Member communication and relationship conversations.",
    label: "People Layer",
    purpose: "Member-to-member, operator, buyer, lender, and partner conversations.",
    statusEmpty: "No network conversations.",
  },
  {
    key: "general",
    title: "General",
    subtitle: "Unsorted or uncategorized communication.",
    label: "Fallback Inbox",
    purpose: "Messages that are not attached to a signal, pain request, project, or member lane.",
    statusEmpty: "No general messages.",
  },
];

function clean(value: unknown) {
  return String(value || "").trim();
}

function lower(value: unknown) {
  return clean(value).toLowerCase();
}

function currentEmail() {
  if (typeof window === "undefined") return "";

  const keys = ["vf_email", "vaultforge_email", "email", "memberEmail"];

  for (const key of keys) {
    const value =
      window.localStorage.getItem(key) ||
      window.sessionStorage.getItem(key);

    if (value) return value.trim().toLowerCase();
  }

  const cookieMatch = document.cookie.match(/(?:^|;\s*)vf_email=([^;]+)/);

  if (cookieMatch?.[1]) {
    return decodeURIComponent(cookieMatch[1]).trim().toLowerCase();
  }

  return "";
}

function getThreadKey(row: Conversation) {
  return clean(
    row.thread_key ||
      row.threadKey ||
      row.canonical_thread_key ||
      row.id ||
      "",
  );
}

function sourceOf(row: Conversation) {
  return lower(
    row.source ||
      row.folder ||
      row.folder_key ||
      row.route_lane ||
      row.lane ||
      getThreadKey(row),
  );
}

function isSaved(row: Conversation) {
  return row.is_saved === true || sourceOf(row).includes("saved");
}

function isUnread(row: Conversation) {
  return Number(row.unread_count || 0) > 0 || row.read === false;
}

function inferLane(row: Conversation): LaneKey {
  const source = sourceOf(row);
  const threadKey = lower(getThreadKey(row));

  if (isSaved(row)) return "saved";

  if (
    source.includes("signal") ||
    source.includes("alert") ||
    source.includes("routing") ||
    source.includes("route") ||
    source.includes("intro") ||
    threadKey.startsWith("signal:") ||
    threadKey.startsWith("alert:") ||
    threadKey.startsWith("routing:") ||
    threadKey.startsWith("introduction:")
  ) {
    return "signals";
  }

  if (
    source.includes("pain") ||
    source.includes("project") ||
    source.includes("deal") ||
    source.includes("property") ||
    threadKey.startsWith("pain:") ||
    threadKey.startsWith("project:") ||
    threadKey.startsWith("deal:") ||
    threadKey.startsWith("property:")
  ) {
    return "execution";
  }

  if (
    source.includes("member") ||
    source.includes("network") ||
    threadKey.startsWith("member:")
  ) {
    return "network";
  }

  if (isUnread(row)) return "priority";

  return "general";
}

function timestampOf(row: Conversation) {
  return row.latest_at || row.last_message_at || row.updated_at || row.created_at;
}

function formatDate(value: unknown) {
  const raw = clean(value);

  if (!raw) return "No timestamp";

  const date = new Date(raw);

  if (Number.isNaN(date.getTime())) return raw;

  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function relativeTime(value: unknown) {
  const raw = clean(value);
  if (!raw) return "No activity";

  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return formatDate(raw);

  const diff = Date.now() - date.getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) return "Just now";
  if (diff < hour) return `${Math.max(1, Math.round(diff / minute))}m ago`;
  if (diff < day) return `${Math.round(diff / hour)}h ago`;
  if (diff < day * 7) return `${Math.round(diff / day)}d ago`;

  return formatDate(raw);
}

async function safeJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

function conversationTitle(row: Conversation) {
  return clean(row.title || row.subject || getThreadKey(row) || "VaultForge message");
}

function conversationPreview(row: Conversation) {
  return clean(
    row.latest_message ||
      row.preview ||
      row.body ||
      row.message ||
      "No message preview available.",
  );
}

function senderOf(row: Conversation) {
  return clean(row.from_email || row.sender_email || row.member_email || "VaultForge");
}

function receiverOf(row: Conversation) {
  return clean(row.to_email || row.recipient_email || row.target_email || "");
}

function urgencyForLane(lane: LaneKey, count: number, unread: number, latest?: Conversation) {
  if (unread > 0) return "Review Now";
  if (lane === "priority" && count > 0) return "Active Watch";
  if (lane === "signals" && count > 0) return "Intel Live";
  if (lane === "execution" && count > 0) return "Work Active";
  if (lane === "saved" && count > 0) return "Follow-Up";
  if (lane === "network" && count > 0) return "Relationship Active";
  if (latest) return "Monitoring";
  return "Clear";
}

function operationalSummary(lane: LaneKey, count: number, unread: number) {
  if (count === 0) {
    if (lane === "priority") return "No unread or saved pressure is currently hitting mission control.";
    if (lane === "signals") return "No signal, alert, routing, or intro conversations are active.";
    if (lane === "execution") return "No pain, project, or deal execution message threads are active.";
    if (lane === "saved") return "No saved follow-up threads are pinned right now.";
    if (lane === "network") return "No member or network communication threads are active.";
    return "No uncategorized messages are waiting.";
  }

  if (unread > 0) {
    return `${unread} unread thread${unread === 1 ? "" : "s"} need review across ${count} active conversation${count === 1 ? "" : "s"}.`;
  }

  return `${count} active conversation${count === 1 ? "" : "s"} connected and current.`;
}

export default function MessageCommandPage() {
  const [email, setEmail] = useState("");
  const [activeLane, setActiveLane] = useState<LaneKey | null>(null);
  const [rows, setRows] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState("");

  const showNotice = useCallback((text: string) => {
    setNotice(text);
    window.setTimeout(() => setNotice(""), 3200);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const viewer = currentEmail();

      setEmail(viewer);

      const params = new URLSearchParams();

      if (viewer) params.set("email", viewer);

      params.set("mode", "list");

      const response = await fetch(`/api/message-command?${params.toString()}`, {
        method: "GET",
        cache: "no-store",
      });

      const data = await safeJson(response);

      if (!response.ok) {
        throw new Error(clean(data?.error) || "Message Command failed to load.");
      }

      const conversations = Array.isArray(data?.conversations)
        ? data.conversations
        : [];

      setRows(conversations);
    } catch (error: any) {
      setRows([]);
      showNotice(error?.message || "Message Command failed to load.");
    } finally {
      setLoading(false);
    }
  }, [showNotice]);

  useEffect(() => {
    void load();
  }, [load]);

  async function threadAction(threadKey: string, action: string) {
    if (!threadKey) return;

    setBusy(`${action}:${threadKey}`);

    try {
      const response = await fetch("/api/message-command", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          thread_key: threadKey,
          email: email || currentEmail(),
        }),
      });

      const data = await safeJson(response);

      if (!response.ok || data?.ok === false) {
        throw new Error(clean(data?.error) || `Unable to ${action}.`);
      }

      await load();

      showNotice(`Thread ${action.replace(/_/g, " ")} complete.`);
    } catch (error: any) {
      showNotice(error?.message || `Unable to ${action}.`);
    } finally {
      setBusy("");
    }
  }

  const laneData = useMemo(() => {
    return COMMAND_LANES.map((lane) => {
      let filtered = rows.filter((row) => inferLane(row) === lane.key);

      if (lane.key === "priority") {
        filtered = rows.filter((row) => isUnread(row) || isSaved(row));
      }

      const sorted = filtered
        .slice()
        .sort((a, b) => String(timestampOf(b)).localeCompare(String(timestampOf(a))));

      const unread = sorted.reduce(
        (sum, row) => sum + Number(row.unread_count || (row.read === false ? 1 : 0)),
        0,
      );

      const latest = sorted[0];

      return {
        ...lane,
        rows: sorted,
        count: sorted.length,
        unread,
        latest,
        urgency: urgencyForLane(lane.key, sorted.length, unread, latest),
        summary: operationalSummary(lane.key, sorted.length, unread),
      };
    });
  }, [rows]);

  const active = laneData.find((lane) => lane.key === activeLane) || null;

  const totalThreads = rows.length;
  const totalUnread = rows.reduce(
    (sum, row) => sum + Number(row.unread_count || (row.read === false ? 1 : 0)),
    0,
  );
  const savedTotal = rows.filter(isSaved).length;
  const latestOverall = rows
    .slice()
    .sort((a, b) => String(timestampOf(b)).localeCompare(String(timestampOf(a))))[0];

  return (
    <main style={styles.page}>
      <section style={styles.shell}>
        <header style={styles.hero}>
          <div>
            <div style={styles.eyebrow}>VaultForge Intelligence Inbox</div>
            <h1 style={styles.title}>Message Command</h1>
            <p style={styles.subtitle}>
              Bloomberg-style command dashboard for operational messages, intelligence flow, saved follow-up, and execution conversations.
            </p>
          </div>

          <div style={styles.topRight}>
            <div style={styles.context}>{email || "browser session"}</div>
            <button type="button" style={styles.refresh} onClick={() => void load()}>
              Refresh
            </button>
            <Link href="/dashboard" style={styles.dashboardLink}>
              Dashboard
            </Link>
          </div>
        </header>

        {notice ? <div style={styles.notice}>{notice}</div> : null}

        <section style={styles.dashboard}>
          <div style={styles.metric}>
            <span style={styles.metricLabel}>Active Threads</span>
            <strong style={styles.metricValue}>{loading ? "…" : totalThreads}</strong>
          </div>

          <div style={styles.metric}>
            <span style={styles.metricLabel}>Unread Pressure</span>
            <strong style={styles.metricValue}>{loading ? "…" : totalUnread}</strong>
          </div>

          <div style={styles.metric}>
            <span style={styles.metricLabel}>Saved Follow-Up</span>
            <strong style={styles.metricValue}>{loading ? "…" : savedTotal}</strong>
          </div>

          <div style={styles.metricWide}>
            <span style={styles.metricLabel}>Latest Pulse</span>
            <strong style={styles.metricText}>
              {loading
                ? "Scanning message lanes…"
                : latestOverall
                  ? `${conversationTitle(latestOverall)} • ${relativeTime(timestampOf(latestOverall))}`
                  : "No active conversations found for this account."}
            </strong>
          </div>
        </section>

        {!activeLane ? (
          <section style={styles.grid}>
            {laneData.map((lane) => (
              <button
                key={lane.key}
                type="button"
                onClick={() => setActiveLane(lane.key)}
                style={styles.card}
              >
                <div style={styles.cardTop}>
                  <div>
                    <div style={styles.cardLabel}>{lane.label}</div>
                    <div style={styles.cardTitle}>{lane.title}</div>
                  </div>
                  <span style={lane.urgency === "Clear" ? styles.clearBadge : styles.liveBadge}>
                    {lane.urgency}
                  </span>
                </div>

                <div style={styles.cardCount}>{loading ? "…" : lane.count}</div>

                <div style={styles.cardSection}>
                  <span style={styles.sectionLabel}>Operational read</span>
                  <p style={styles.cardText}>{lane.summary}</p>
                </div>

                <div style={styles.cardSection}>
                  <span style={styles.sectionLabel}>What is here</span>
                  <p style={styles.cardText}>{lane.purpose}</p>
                </div>

                {lane.latest ? (
                  <div style={styles.latestBox}>
                    <span style={styles.sectionLabel}>Latest activity</span>
                    <p style={styles.latestTitle}>{conversationTitle(lane.latest)}</p>
                    <p style={styles.latestPreview}>{conversationPreview(lane.latest)}</p>
                    <p style={styles.latestTime}>
                      {senderOf(lane.latest)}
                      {receiverOf(lane.latest) ? ` → ${receiverOf(lane.latest)}` : ""} • {relativeTime(timestampOf(lane.latest))}
                    </p>
                  </div>
                ) : (
                  <div style={styles.latestBox}>
                    <span style={styles.sectionLabel}>Latest activity</span>
                    <p style={styles.latestTitle}>{lane.statusEmpty}</p>
                    <p style={styles.latestTime}>Standing by</p>
                  </div>
                )}
              </button>
            ))}
          </section>
        ) : (
          <section style={styles.panel}>
            <div style={styles.panelTop}>
              <div>
                <div style={styles.eyebrow}>Command Lane</div>
                <h2 style={styles.panelTitle}>{active?.title}</h2>
                <p style={styles.panelSubtitle}>{active?.summary}</p>
              </div>

              <button type="button" onClick={() => setActiveLane(null)} style={styles.back}>
                Back to Command
              </button>
            </div>

            {active && active.rows.length === 0 ? (
              <div style={styles.empty}>{active.statusEmpty}</div>
            ) : null}

            <div style={styles.threadList}>
              {(active?.rows || []).map((row) => {
                const threadKey = getThreadKey(row);
                const isBusy = busy.endsWith(threadKey);
                const unread = Number(row.unread_count || (row.read === false ? 1 : 0));

                return (
                  <article key={threadKey} style={styles.thread}>
                    <div style={styles.threadMain}>
                      <div style={styles.threadMeta}>
                        {unread > 0 ? `${unread} unread • ` : ""}
                        {formatDate(timestampOf(row))}
                      </div>
                      <h3 style={styles.threadTitle}>{conversationTitle(row)}</h3>
                      <p style={styles.threadBody}>{conversationPreview(row)}</p>
                      <div style={styles.threadMeta}>
                        {senderOf(row)}
                        {receiverOf(row) ? ` → ${receiverOf(row)}` : ""}
                      </div>
                    </div>

                    <div style={styles.actions}>
                      <Link href={`/message-command/${encodeURIComponent(threadKey)}`} style={styles.open}>
                        Open
                      </Link>

                      <button
                        type="button"
                        disabled={isBusy}
                        style={styles.action}
                        onClick={() => void threadAction(threadKey, row.is_saved ? "unsave" : "save")}
                      >
                        {row.is_saved ? "Unsave" : "Save"}
                      </button>

                      <button
                        type="button"
                        disabled={isBusy}
                        style={styles.action}
                        onClick={() => void threadAction(threadKey, "read")}
                      >
                        Read
                      </button>

                      <button
                        type="button"
                        disabled={isBusy}
                        style={styles.warn}
                        onClick={() => void threadAction(threadKey, "archive")}
                      >
                        Archive
                      </button>

                      <button
                        type="button"
                        disabled={isBusy}
                        style={styles.danger}
                        onClick={() => void threadAction(threadKey, "delete")}
                      >
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
      "radial-gradient(circle at top left, rgba(232,196,107,.12), transparent 28%), linear-gradient(180deg,#020303,#071326 55%,#020303)",
    color: "white",
    padding: "24px 16px 90px",
    fontFamily: "Inter, Arial, sans-serif",
  },
  shell: {
    width: "min(1220px,100%)",
    margin: "0 auto",
  },
  hero: {
    border: "1px solid rgba(232,196,107,.20)",
    borderRadius: 28,
    padding: 24,
    display: "flex",
    justifyContent: "space-between",
    gap: 20,
    flexWrap: "wrap",
    background:
      "linear-gradient(145deg,rgba(255,255,255,.05),rgba(255,255,255,.02))",
  },
  eyebrow: {
    color: "#e8c46b",
    fontSize: 12,
    fontWeight: 900,
    letterSpacing: ".18em",
    textTransform: "uppercase",
  },
  title: {
    margin: "10px 0",
    fontSize: "clamp(44px,9vw,88px)",
    lineHeight: ".9",
    letterSpacing: "-.07em",
  },
  subtitle: {
    margin: 0,
    color: "#cbd5e1",
    maxWidth: 760,
    lineHeight: 1.6,
  },
  topRight: {
    display: "flex",
    gap: 12,
    alignItems: "center",
    flexWrap: "wrap",
  },
  context: {
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,.10)",
    padding: "10px 14px",
    color: "#dbeafe",
    fontWeight: 700,
  },
  refresh: {
    borderRadius: 999,
    border: "1px solid rgba(232,196,107,.28)",
    background: "rgba(232,196,107,.12)",
    color: "#f8e7b0",
    padding: "12px 18px",
    fontWeight: 900,
    cursor: "pointer",
  },
  dashboardLink: {
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,.14)",
    background: "rgba(255,255,255,.06)",
    color: "white",
    padding: "12px 18px",
    fontWeight: 900,
    textDecoration: "none",
  },
  notice: {
    marginTop: 16,
    borderRadius: 18,
    padding: 14,
    background: "rgba(22,101,52,.22)",
    border: "1px solid rgba(34,197,94,.28)",
    color: "#dcfce7",
    fontWeight: 800,
  },
  dashboard: {
    marginTop: 18,
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))",
    gap: 12,
  },
  metric: {
    border: "1px solid rgba(255,255,255,.10)",
    borderRadius: 20,
    padding: 16,
    background: "rgba(2,6,23,.72)",
  },
  metricWide: {
    border: "1px solid rgba(232,196,107,.18)",
    borderRadius: 20,
    padding: 16,
    background: "rgba(232,196,107,.07)",
  },
  metricLabel: {
    display: "block",
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: 900,
    textTransform: "uppercase",
    letterSpacing: ".08em",
  },
  metricValue: {
    display: "block",
    marginTop: 8,
    fontSize: 34,
    lineHeight: 1,
  },
  metricText: {
    display: "block",
    marginTop: 8,
    color: "#f8e7b0",
    lineHeight: 1.35,
  },
  grid: {
    marginTop: 20,
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))",
    gap: 16,
  },
  card: {
    textAlign: "left",
    border: "1px solid rgba(232,196,107,.18)",
    borderRadius: 24,
    padding: 22,
    background: "linear-gradient(180deg, rgba(15,23,42,.92), rgba(2,6,23,.88))",
    color: "white",
    minHeight: 360,
    cursor: "pointer",
  },
  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "flex-start",
  },
  cardLabel: {
    color: "#e8c46b",
    fontWeight: 900,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: ".14em",
  },
  cardTitle: {
    marginTop: 10,
    fontSize: 24,
    fontWeight: 950,
    letterSpacing: "-.04em",
  },
  cardCount: {
    marginTop: 14,
    fontSize: 50,
    fontWeight: 950,
    letterSpacing: "-.08em",
  },
  liveBadge: {
    borderRadius: 999,
    border: "1px solid rgba(248,113,113,.28)",
    background: "rgba(248,113,113,.11)",
    color: "#fecaca",
    padding: "7px 10px",
    fontSize: 11,
    fontWeight: 950,
    whiteSpace: "nowrap",
  },
  clearBadge: {
    borderRadius: 999,
    border: "1px solid rgba(34,197,94,.24)",
    background: "rgba(34,197,94,.10)",
    color: "#bbf7d0",
    padding: "7px 10px",
    fontSize: 11,
    fontWeight: 950,
    whiteSpace: "nowrap",
  },
  cardSection: {
    marginTop: 14,
  },
  sectionLabel: {
    display: "block",
    color: "#94a3b8",
    fontSize: 11,
    fontWeight: 900,
    textTransform: "uppercase",
    letterSpacing: ".10em",
  },
  cardText: {
    margin: "6px 0 0",
    color: "#cbd5e1",
    lineHeight: 1.45,
    fontSize: 13,
  },
  latestBox: {
    marginTop: 14,
    borderTop: "1px solid rgba(255,255,255,.08)",
    paddingTop: 12,
  },
  latestTitle: {
    margin: "6px 0 0",
    color: "#f8e7b0",
    fontWeight: 900,
  },
  latestPreview: {
    margin: "6px 0 0",
    color: "#cbd5e1",
    fontSize: 13,
    lineHeight: 1.45,
  },
  latestTime: {
    margin: "7px 0 0",
    color: "#94a3b8",
    fontSize: 12,
    lineHeight: 1.35,
  },
  panel: {
    marginTop: 20,
    border: "1px solid rgba(232,196,107,.18)",
    borderRadius: 26,
    padding: 22,
    background: "rgba(2,6,23,.78)",
  },
  panelTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 20,
    flexWrap: "wrap",
    alignItems: "flex-start",
    borderBottom: "1px solid rgba(255,255,255,.08)",
    paddingBottom: 18,
  },
  panelTitle: {
    margin: "8px 0",
    fontSize: 38,
    letterSpacing: "-.05em",
  },
  panelSubtitle: {
    margin: 0,
    color: "#cbd5e1",
  },
  back: {
    borderRadius: 999,
    border: "1px solid rgba(232,196,107,.30)",
    background: "linear-gradient(135deg,#f8e7b0,#e8c46b)",
    color: "#081018",
    padding: "12px 18px",
    fontWeight: 900,
    cursor: "pointer",
  },
  empty: {
    marginTop: 18,
    borderRadius: 18,
    border: "1px dashed rgba(255,255,255,.14)",
    padding: 18,
    color: "#cbd5e1",
  },
  threadList: {
    display: "grid",
    gap: 14,
    marginTop: 18,
  },
  thread: {
    display: "grid",
    gridTemplateColumns: "minmax(0,1fr) auto",
    gap: 18,
    border: "1px solid rgba(255,255,255,.08)",
    borderRadius: 22,
    padding: 18,
    background: "rgba(15,23,42,.68)",
  },
  threadMain: {
    minWidth: 0,
  },
  threadMeta: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: 800,
  },
  threadTitle: {
    margin: "8px 0",
    fontSize: 22,
    letterSpacing: "-.03em",
  },
  threadBody: {
    margin: 0,
    color: "#dbeafe",
    lineHeight: 1.55,
  },
  actions: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    minWidth: 140,
  },
  open: {
    textAlign: "center",
    borderRadius: 999,
    background: "linear-gradient(135deg,#f8e7b0,#e8c46b)",
    color: "#06100a",
    padding: "11px 14px",
    fontWeight: 900,
    textDecoration: "none",
  },
  action: {
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,.12)",
    background: "rgba(255,255,255,.05)",
    color: "white",
    padding: "10px 12px",
    fontWeight: 800,
    cursor: "pointer",
  },
  warn: {
    borderRadius: 999,
    border: "1px solid rgba(232,196,107,.22)",
    background: "rgba(232,196,107,.10)",
    color: "#f8e7b0",
    padding: "10px 12px",
    fontWeight: 900,
    cursor: "pointer",
  },
  danger: {
    borderRadius: 999,
    border: "1px solid rgba(248,113,113,.22)",
    background: "rgba(248,113,113,.10)",
    color: "#fecaca",
    padding: "10px 12px",
    fontWeight: 900,
    cursor: "pointer",
  },
};
