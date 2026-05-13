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

const COMMAND_LANES: Array<{
  key: LaneKey;
  title: string;
  subtitle: string;
}> = [
  {
    key: "priority",
    title: "Priority",
    subtitle: "Urgent active threads, unread pressure, and owner attention.",
  },
  {
    key: "saved",
    title: "Saved Bucket",
    subtitle: "Pinned opportunities, operators, and high-value conversations.",
  },
  {
    key: "signals",
    title: "Signals",
    subtitle: "Signals, alerts, routing, and introduction intelligence.",
  },
  {
    key: "execution",
    title: "Execution",
    subtitle: "Pain requests, projects, and active operational work.",
  },
  {
    key: "network",
    title: "Network",
    subtitle: "Member communication and relationship conversations.",
  },
  {
    key: "general",
    title: "General",
    subtitle: "Unsorted or uncategorized communication.",
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

  const cookieMatch = document.cookie.match(
    /(?:^|;\s*)vf_email=([^;]+)/,
  );

  if (cookieMatch?.[1]) {
    return decodeURIComponent(cookieMatch[1])
      .trim()
      .toLowerCase();
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
      row.lane,
  );
}

function inferLane(row: Conversation): LaneKey {
  const source = sourceOf(row);
  const threadKey = lower(getThreadKey(row));

  if (
    row.is_saved === true ||
    source.includes("saved") ||
    threadKey.startsWith("saved:")
  ) {
    return "saved";
  }

  if (
    source.includes("signal") ||
    source.includes("alert") ||
    source.includes("routing") ||
    source.includes("route") ||
    source.includes("intro")
  ) {
    return "signals";
  }

  if (
    source.includes("pain") ||
    source.includes("project") ||
    source.includes("deal") ||
    source.includes("property")
  ) {
    return "execution";
  }

  if (
    source.includes("member") ||
    source.includes("network")
  ) {
    return "network";
  }

  const unread = Number(row.unread_count || 0);

  if (unread > 0) return "priority";

  return "general";
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

async function safeJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

export default function MessageCommandPage() {
  const [email, setEmail] = useState("");
  const [activeLane, setActiveLane] =
    useState<LaneKey | null>(null);

  const [rows, setRows] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [toast, setToast] = useState("");

  const showToast = useCallback((text: string) => {
    setToast(text);
    window.setTimeout(() => setToast(""), 3200);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const viewer = currentEmail();

      setEmail(viewer);

      const params = new URLSearchParams();

      if (viewer) params.set("email", viewer);

      params.set("mode", "list");

      const response = await fetch(
        `/api/message-command?${params.toString()}`,
        {
          method: "GET",
          cache: "no-store",
        },
      );

      const data = await safeJson(response);

      if (!response.ok) {
        throw new Error(
          clean(data?.error) ||
            "Message Command failed to load.",
        );
      }

      const conversations = Array.isArray(data?.conversations)
        ? data.conversations
        : [];

      setRows(conversations);
    } catch (error: any) {
      setRows([]);
      showToast(
        error?.message ||
          "Message Command failed to load.",
      );
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void load();
  }, [load]);

  async function threadAction(
    threadKey: string,
    action: string,
  ) {
    if (!threadKey) return;

    setBusy(`${action}:${threadKey}`);

    try {
      const response = await fetch(
        "/api/message-command",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action,
            thread_key: threadKey,
            email: email || currentEmail(),
          }),
        },
      );

      const data = await safeJson(response);

      if (!response.ok || data?.ok === false) {
        throw new Error(
          clean(data?.error) ||
            `Unable to ${action}.`,
        );
      }

      await load();

      showToast(
        `Thread ${action.replace(/_/g, " ")} complete.`,
      );
    } catch (error: any) {
      showToast(
        error?.message ||
          `Unable to ${action}.`,
      );
    } finally {
      setBusy("");
    }
  }

  const laneData = useMemo(() => {
    return COMMAND_LANES.map((lane) => {
      let filtered = rows.filter(
        (row) => inferLane(row) === lane.key,
      );

      if (lane.key === "priority") {
        filtered = rows.filter((row) => {
          const unread =
            Number(row.unread_count || 0) > 0;

          return unread || row.is_saved;
        });
      }

      return {
        ...lane,
        rows: filtered,
        count: filtered.length,
        unread: filtered.reduce(
          (sum, row) =>
            sum + Number(row.unread_count || 0),
          0,
        ),
      };
    });
  }, [rows]);

  const active =
    laneData.find((lane) => lane.key === activeLane) ||
    null;

  return (
    <main style={styles.page}>
      <section style={styles.shell}>
        <header style={styles.hero}>
          <div>
            <div style={styles.eyebrow}>
              VaultForge Intelligence Inbox
            </div>

            <h1 style={styles.title}>
              Message Command
            </h1>

            <p style={styles.subtitle}>
              Bloomberg-style operational messaging
              and intelligence routing command center.
            </p>
          </div>

          <div style={styles.topRight}>
            <div style={styles.context}>
              {email || "browser session"}
            </div>

            <button
              type="button"
              style={styles.refresh}
              onClick={() => void load()}
            >
              Refresh
            </button>
          </div>
        </header>

        {toast ? (
          <div style={styles.toast}>{toast}</div>
        ) : null}

        {!activeLane ? (
          <section style={styles.grid}>
            {laneData.map((lane) => (
              <button
                key={lane.key}
                type="button"
                onClick={() =>
                  setActiveLane(lane.key)
                }
                style={styles.card}
              >
                <div style={styles.cardLabel}>
                  {lane.title}
                </div>

                <div style={styles.cardCount}>
                  {loading ? "…" : lane.count}
                </div>

                <div style={styles.cardSubtitle}>
                  {lane.subtitle}
                </div>

                <div style={styles.cardFooter}>
                  {lane.unread > 0
                    ? `${lane.unread} unread`
                    : "No unread"}
                </div>
              </button>
            ))}
          </section>
        ) : (
          <section style={styles.panel}>
            <div style={styles.panelTop}>
              <div>
                <div style={styles.eyebrow}>
                  Command Lane
                </div>

                <h2 style={styles.panelTitle}>
                  {active?.title}
                </h2>

                <p style={styles.panelSubtitle}>
                  {active?.subtitle}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setActiveLane(null)
                }
                style={styles.back}
              >
                Back to Command
              </button>
            </div>

            <div style={styles.threadList}>
              {(active?.rows || []).map((row) => {
                const threadKey =
                  getThreadKey(row);

                const isBusy =
                  busy.endsWith(threadKey);

                return (
                  <article
                    key={threadKey}
                    style={styles.thread}
                  >
                    <div style={styles.threadMain}>
                      <div style={styles.threadMeta}>
                        {formatDate(
                          row.latest_at ||
                            row.updated_at ||
                            row.created_at,
                        )}
                      </div>

                      <h3 style={styles.threadTitle}>
                        {clean(
                          row.title ||
                            row.subject ||
                            threadKey,
                        )}
                      </h3>

                      <p style={styles.threadBody}>
                        {clean(
                          row.latest_message ||
                            row.body ||
                            row.message ||
                            "No message preview.",
                        )}
                      </p>

                      <div style={styles.threadMeta}>
                        {clean(
                          row.from_email,
                        ) || "VaultForge"}
                        {clean(row.to_email)
                          ? ` → ${clean(
                              row.to_email,
                            )}`
                          : ""}
                      </div>
                    </div>

                    <div style={styles.actions}>
                      <Link
                        href={`/message-command/${encodeURIComponent(
                          threadKey,
                        )}`}
                        style={styles.open}
                      >
                        Open
                      </Link>

                      <button
                        type="button"
                        disabled={isBusy}
                        style={styles.action}
                        onClick={() =>
                          void threadAction(
                            threadKey,
                            row.is_saved
                              ? "unsave"
                              : "save",
                          )
                        }
                      >
                        {row.is_saved
                          ? "Unsave"
                          : "Save"}
                      </button>

                      <button
                        type="button"
                        disabled={isBusy}
                        style={styles.action}
                        onClick={() =>
                          void threadAction(
                            threadKey,
                            "read",
                          )
                        }
                      >
                        Read
                      </button>

                      <button
                        type="button"
                        disabled={isBusy}
                        style={styles.warn}
                        onClick={() =>
                          void threadAction(
                            threadKey,
                            "archive",
                          )
                        }
                      >
                        Archive
                      </button>

                      <button
                        type="button"
                        disabled={isBusy}
                        style={styles.danger}
                        onClick={() =>
                          void threadAction(
                            threadKey,
                            "delete",
                          )
                        }
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
    fontFamily:
      "Inter, Arial, sans-serif",
  },
  shell: {
    width: "min(1200px,100%)",
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
    fontSize:
      "clamp(46px,9vw,88px)",
    lineHeight: ".9",
    letterSpacing: "-.07em",
  },
  subtitle: {
    margin: 0,
    color: "#cbd5e1",
    maxWidth: 700,
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
    border:
      "1px solid rgba(255,255,255,.10)",
    padding: "10px 14px",
    color: "#dbeafe",
    fontWeight: 700,
  },
  refresh: {
    borderRadius: 999,
    border:
      "1px solid rgba(232,196,107,.28)",
    background:
      "rgba(232,196,107,.12)",
    color: "#f8e7b0",
    padding: "12px 18px",
    fontWeight: 900,
    cursor: "pointer",
  },
  toast: {
    marginTop: 16,
    borderRadius: 18,
    padding: 14,
    background:
      "rgba(22,101,52,.22)",
    border:
      "1px solid rgba(34,197,94,.28)",
    color: "#dcfce7",
    fontWeight: 800,
  },
  grid: {
    marginTop: 20,
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(260px,1fr))",
    gap: 16,
  },
  card: {
    textAlign: "left",
    border:
      "1px solid rgba(232,196,107,.18)",
    borderRadius: 24,
    padding: 22,
    background:
      "linear-gradient(180deg, rgba(15,23,42,.92), rgba(2,6,23,.88))",
    color: "white",
    minHeight: 220,
    cursor: "pointer",
  },
  cardLabel: {
    color: "#e8c46b",
    fontWeight: 900,
    fontSize: 14,
    textTransform: "uppercase",
    letterSpacing: ".08em",
  },
  cardCount: {
    marginTop: 18,
    fontSize: 54,
    fontWeight: 900,
    letterSpacing: "-.08em",
  },
  cardSubtitle: {
    marginTop: 10,
    color: "#cbd5e1",
    lineHeight: 1.5,
  },
  cardFooter: {
    marginTop: 18,
    color: "#fecaca",
    fontWeight: 900,
    fontSize: 12,
  },
  panel: {
    marginTop: 20,
    border:
      "1px solid rgba(232,196,107,.18)",
    borderRadius: 26,
    padding: 22,
    background:
      "rgba(2,6,23,.78)",
  },
  panelTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 20,
    flexWrap: "wrap",
    alignItems: "flex-start",
    borderBottom:
      "1px solid rgba(255,255,255,.08)",
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
    border:
      "1px solid rgba(232,196,107,.30)",
    background:
      "linear-gradient(135deg,#f8e7b0,#e8c46b)",
    color: "#081018",
    padding: "12px 18px",
    fontWeight: 900,
    cursor: "pointer",
  },
  threadList: {
    display: "grid",
    gap: 14,
    marginTop: 18,
  },
  thread: {
    display: "grid",
    gridTemplateColumns:
      "minmax(0,1fr) auto",
    gap: 18,
    border:
      "1px solid rgba(255,255,255,.08)",
    borderRadius: 22,
    padding: 18,
    background:
      "rgba(15,23,42,.68)",
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
    background:
      "linear-gradient(135deg,#f8e7b0,#e8c46b)",
    color: "#06100a",
    padding: "11px 14px",
    fontWeight: 900,
    textDecoration: "none",
  },
  action: {
    borderRadius: 999,
    border:
      "1px solid rgba(255,255,255,.12)",
    background:
      "rgba(255,255,255,.05)",
    color: "white",
    padding: "10px 12px",
    fontWeight: 800,
    cursor: "pointer",
  },
  warn: {
    borderRadius: 999,
    border:
      "1px solid rgba(232,196,107,.22)",
    background:
      "rgba(232,196,107,.10)",
    color: "#f8e7b0",
    padding: "10px 12px",
    fontWeight: 900,
    cursor: "pointer",
  },
  danger: {
    borderRadius: 999,
    border:
      "1px solid rgba(248,113,113,.22)",
    background:
      "rgba(248,113,113,.10)",
    color: "#fecaca",
    padding: "10px 12px",
    fontWeight: 900,
    cursor: "pointer",
  },
};
