"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Conversation = Record<string, any>;

const LANES = [
  {
    key: "alerts",
    label: "ALERTS",
    title: "Alerts",
    note: "Alert follow-up, owner requests, and urgent message traffic.",
  },
  {
    key: "pain",
    label: "PAIN",
    title: "Pain",
    note: "Pain signal conversations and problem-routing follow-up.",
  },
  {
    key: "signals",
    label: "SIGNALS",
    title: "Signals",
    note: "Signal-room messages and intelligence follow-up.",
  },
  {
    key: "routing",
    label: "ROUTING",
    title: "Routing",
    note: "Routing requests, member-fit paths, and execution handoffs.",
  },
  {
    key: "introductions",
    label: "INTRO",
    title: "Introductions",
    note: "Controlled introduction conversations.",
  },
  {
    key: "projects",
    label: "PROJECTS",
    title: "Projects",
    note: "Project and deal-room communication.",
  },
  {
    key: "members",
    label: "MEMBERS",
    title: "Members",
    note: "Member-to-member and private network messages.",
  },
  {
    key: "general",
    label: "GENERAL",
    title: "General",
    note: "Messages not tied to a specific route yet.",
  },
];

function clean(value: unknown) {
  return String(value || "").trim();
}

function lower(value: unknown) {
  return clean(value).toLowerCase();
}

function readCookie(name: string) {
  if (typeof document === "undefined") return "";

  const match = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));

  if (!match) return "";

  try {
    return decodeURIComponent(match.slice(name.length + 1));
  } catch {
    return match.slice(name.length + 1);
  }
}

function currentEmail() {
  if (typeof window === "undefined") return "";

  for (const key of ["vf_email", "vf_member_email", "vf_admin_email", "email", "memberEmail"]) {
    const local = lower(window.localStorage.getItem(key));
    if (local.includes("@")) return local;

    const session = lower(window.sessionStorage.getItem(key));
    if (session.includes("@")) return session;
  }

  return lower(readCookie("vf_email") || readCookie("vf_member_email") || readCookie("vf_admin_email"));
}

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

function laneMeta(key: string) {
  return LANES.find((lane) => lane.key === key) || LANES[LANES.length - 1];
}

function safeTitle(value: unknown) {
  return clean(value || "VaultForge message")
    .replace(/^(re:\s*)+/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

export default function MessageCommandPage() {
  const [email, setEmail] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [selected, setSelected] = useState("all");
  const [query, setQuery] = useState("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [status, setStatus] = useState("Loading message command...");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search || "");
    const route = lower(params.get("route") || params.get("folder") || params.get("lane"));

    if (route && LANES.some((lane) => lane.key === route)) {
      setSelected(route);
    }
  }, []);

  async function load() {
    const viewer = currentEmail();
    setEmail(viewer);
    setStatus("Loading message command...");

    try {
      const res = await fetch(`/api/message-command?email=${encodeURIComponent(viewer)}`, {
        cache: "no-store",
        headers: { "x-vf-email": viewer },
      });

      const data = await safeJson(res);

      setConversations(Array.isArray(data.conversations) ? data.conversations : []);
      setCounts(data.counts || {});
      setStatus("");
    } catch (error: any) {
      setStatus(error?.message || "Could not load message command.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  const laneTotals = useMemo(() => {
    const next: Record<string, { conversations: number; messages: number }> = {};

    for (const lane of LANES) {
      next[lane.key] = {
        conversations: 0,
        messages: Number(counts[lane.key] || 0),
      };
    }

    for (const convo of conversations) {
      const folder = clean(convo.folder || "general");
      if (!next[folder]) next[folder] = { conversations: 0, messages: 0 };
      next[folder].conversations += 1;
    }

    return next;
  }, [conversations, counts]);

  const visible = useMemo(() => {
    const q = lower(query);

    return conversations.filter((item) => {
      const folder = clean(item.folder || "general");

      if (selected !== "all" && folder !== selected) return false;

      if (!q) return true;

      return lower(
        [
          item.title,
          item.latest_message,
          item.from_email,
          item.to_email,
          item.thread_key,
          item.folder,
          item.lane_label,
        ].join(" ")
      ).includes(q);
    });
  }, [conversations, query, selected]);

  const totalMessages = conversations.reduce((sum, item) => sum + Number(item.count || 0), 0);
  const selectedMeta = selected === "all" ? null : laneMeta(selected);
  const selectedCount = selected === "all" ? totalMessages : Number(counts[selected] || 0);
  const selectedConversationCount =
    selected === "all" ? conversations.length : visible.length;

  async function cleanup(convo: Conversation, action: "archive" | "delete") {
    const ids = Array.isArray(convo.message_ids) ? convo.message_ids : [];

    if (!ids.length) {
      setStatus("No message IDs found for cleanup.");
      return;
    }

    setStatus(action === "archive" ? "Archiving conversation..." : "Deleting conversation...");

    try {
      const res = await fetch("/api/message-command", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-vf-email": email,
        },
        body: JSON.stringify({ action, ids, email }),
      });

      const data = await safeJson(res);

      if (!res.ok || data?.ok === false) {
        throw new Error(data?.error || "Cleanup failed.");
      }

      setConversations((current) => current.filter((item) => item.thread_key !== convo.thread_key));
      setStatus(action === "archive" ? "Conversation archived." : "Conversation deleted.");
    } catch (error: any) {
      setStatus(error?.message || "Cleanup failed.");
    }
  }

  function selectLane(lane: string) {
    setSelected(lane);

    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (lane === "all") {
        url.searchParams.delete("route");
      } else {
        url.searchParams.set("route", lane);
      }
      window.history.replaceState(null, "", url.toString());
    }
  }

  return (
    <main style={page}>
      <style>{`
        a:hover, button:hover {
          transform: translateY(-1px);
          filter: brightness(1.06);
          transition: all .16s ease;
        }

        input::placeholder {
          color: rgba(255,255,255,.45);
        }

        @media (max-width: 880px) {
          .vf-shell {
            grid-template-columns: 1fr !important;
          }

          .vf-route-pane {
            position: static !important;
          }

          .vf-actions {
            display: grid !important;
            grid-template-columns: 1fr !important;
          }

          .vf-actions > * {
            width: 100%;
            box-sizing: border-box;
            justify-content: center;
          }
        }
      `}</style>

      <div style={wrap}>
        <nav style={nav}>
          <Link href="/dashboard" style={navButton}>Dashboard</Link>
          <Link href="/alerts" style={navButton}>Alerts</Link>
          <Link href="/pain-feed" style={navButton}>Pain Feed</Link>
          <Link href="/projects" style={navButton}>Projects</Link>
          <Link href="/routing-inbox" style={navButton}>Routing</Link>
          <Link href="/message-command" style={navButtonActive}>Message Command</Link>
        </nav>

        <section style={hero}>
          <div>
            <div style={eyebrow}>VaultForge Message OS</div>
            <h1 style={heroTitle}>Message command center.</h1>
            <p style={lead}>
              Route windows for every message lane. Click a window to see only
              that lane&apos;s conversations, counts, cleanup, and replies.
            </p>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
              <span style={chip}>Signed in: {email || "unknown"}</span>
              <span style={chip}>Conversations: {conversations.length}</span>
              <span style={chip}>Messages: {totalMessages}</span>
              <span style={chip}>Selected: {selected === "all" ? "All Routes" : laneMeta(selected).title}</span>
            </div>

            <div className="vf-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 22 }}>
              <button type="button" onClick={load} style={button}>Refresh</button>
              <button type="button" onClick={() => selectLane("all")} style={selected === "all" ? button : ghost}>All Messages</button>
            </div>
          </div>

          <aside style={tape}>
            <div style={eyebrow}>Live Message Tape</div>
            {LANES.slice(0, 7).map((lane) => (
              <button key={lane.key} type="button" onClick={() => selectLane(lane.key)} style={tapeRow}>
                <span>{lane.title}</span>
                <strong>{laneTotals[lane.key]?.messages || 0}</strong>
              </button>
            ))}
          </aside>
        </section>

        <section className="vf-shell" style={shell}>
          <aside className="vf-route-pane" style={routePane}>
            <div style={eyebrow}>Route Windows</div>
            <h2 style={paneTitle}>Designated lanes.</h2>

            <button
              type="button"
              onClick={() => selectLane("all")}
              style={selected === "all" ? routeWindowActive : routeWindow}
            >
              <span style={routeWindowLabel}>ALL</span>
              <strong style={routeWindowNumber}>{totalMessages}</strong>
              <span style={routeWindowTitle}>All Messages</span>
              <small style={routeWindowNote}>{conversations.length} conversations</small>
            </button>

            {LANES.map((lane) => {
              const active = selected === lane.key;
              const totals = laneTotals[lane.key] || { conversations: 0, messages: 0 };

              return (
                <button
                  key={lane.key}
                  type="button"
                  onClick={() => selectLane(lane.key)}
                  style={active ? routeWindowActive : routeWindow}
                >
                  <span style={routeWindowLabel}>{lane.label}</span>
                  <strong style={routeWindowNumber}>{totals.messages}</strong>
                  <span style={routeWindowTitle}>{lane.title}</span>
                  <small style={routeWindowNote}>{totals.conversations} conversations</small>
                </button>
              );
            })}
          </aside>

          <section style={mainPanel}>
            <section style={selectedPanel}>
              <div>
                <div style={eyebrow}>Selected Route</div>
                <h2 style={selectedTitle}>
                  {selected === "all" ? "All Messages" : selectedMeta?.title}
                </h2>
                <p style={muted}>
                  {selected === "all"
                    ? "Every conversation across every route."
                    : selectedMeta?.note}
                </p>
              </div>

              <div style={selectedStats}>
                <div>
                  <strong>{selectedConversationCount}</strong>
                  <span>conversations</span>
                </div>
                <div>
                  <strong>{selectedCount}</strong>
                  <span>messages</span>
                </div>
              </div>
            </section>

            <section style={searchPanel}>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search names, titles, route, message, thread..."
                style={input}
              />
            </section>

            <section style={{ display: "grid", gap: 16 }}>
              {visible.map((convo) => {
                const isCollapsed = collapsed[convo.thread_key] === true;
                const href = `/message-command/${encodeURIComponent(convo.thread_key)}?title=${encodeURIComponent(convo.title || "Message Room")}`;
                const folderMeta = laneMeta(clean(convo.folder || "general"));

                return (
                  <article key={convo.thread_key} style={conversation}>
                    <div style={countBadge}>{convo.count}</div>

                    <div style={laneChip}>{convo.lane_label || folderMeta.label}</div>

                    <h2 style={conversationTitle}>{safeTitle(convo.title)}</h2>

                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <span style={chip}>Route: {folderMeta.title}</span>
                      <span style={chip}>From: {convo.from_email || "unknown"}</span>
                      <span style={chip}>To: {convo.to_email || "unknown"}</span>
                      <span style={chip}>Messages: {convo.count}</span>
                    </div>

                    {!isCollapsed ? (
                      <p style={preview}>{convo.latest_message || "No preview available."}</p>
                    ) : null}

                    <div className="vf-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
                      <Link href={href} style={button}>Open Messages</Link>

                      <button
                        type="button"
                        onClick={() =>
                          setCollapsed((old) => ({
                            ...old,
                            [convo.thread_key]: !isCollapsed,
                          }))
                        }
                        style={ghost}
                      >
                        {isCollapsed ? "Expand" : "Collapse"}
                      </button>

                      <button type="button" onClick={() => cleanup(convo, "archive")} style={ghost}>
                        Archive
                      </button>

                      <button type="button" onClick={() => cleanup(convo, "delete")} style={danger}>
                        Delete
                      </button>
                    </div>
                  </article>
                );
              })}
            </section>

            {!visible.length ? (
              <section style={emptyPanel}>
                <h3 style={{ marginTop: 0 }}>No messages in this route yet.</h3>
                <p style={muted}>
                  When messages are sent into {selected === "all" ? "VaultForge" : laneMeta(selected).title},
                  they will show here with their count and route window.
                </p>
              </section>
            ) : null}

            {status ? <section style={emptyPanel}>{status}</section> : null}
          </section>
        </section>
      </div>
    </main>
  );
}

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(232,196,107,.14), transparent 28%), linear-gradient(180deg,#020303,#071326 55%,#020303)",
  color: "white",
  padding: "22px 16px 96px",
  fontFamily: "Arial, sans-serif",
};

const wrap: React.CSSProperties = {
  width: "min(1260px,100%)",
  margin: "0 auto",
};

const nav: React.CSSProperties = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  marginBottom: 18,
};

const navButton: React.CSSProperties = {
  display: "inline-flex",
  justifyContent: "center",
  alignItems: "center",
  borderRadius: 999,
  padding: "12px 16px",
  background: "rgba(255,255,255,.06)",
  border: "1px solid rgba(255,255,255,.14)",
  color: "white",
  textDecoration: "none",
  fontWeight: 800,
};

const navButtonActive: React.CSSProperties = {
  ...navButton,
  background: "rgba(232,196,107,.14)",
  border: "1px solid rgba(232,196,107,.28)",
  color: "#f8e7b0",
};

const hero: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0,1.5fr) minmax(280px,.8fr)",
  gap: 22,
  border: "1px solid rgba(232,196,107,.22)",
  borderRadius: 30,
  padding: 28,
  marginBottom: 24,
  background: "linear-gradient(145deg,rgba(255,255,255,.07),rgba(255,255,255,.025))",
  boxShadow: "0 30px 90px rgba(0,0,0,.34)",
};

const eyebrow: React.CSSProperties = {
  color: "#e8c46b",
  letterSpacing: ".18em",
  textTransform: "uppercase",
  fontWeight: 950,
  fontSize: 12,
};

const heroTitle: React.CSSProperties = {
  fontSize: "clamp(52px,10vw,98px)",
  lineHeight: .86,
  letterSpacing: "-.075em",
  margin: "12px 0 20px",
};

const lead: React.CSSProperties = {
  color: "#cbd5e1",
  fontSize: 20,
  lineHeight: 1.55,
  maxWidth: 820,
};

const tape: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.12)",
  borderRadius: 26,
  padding: 20,
  background: "rgba(0,0,0,.18)",
};

const tapeRow: React.CSSProperties = {
  width: "100%",
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  padding: "14px 0",
  color: "white",
  background: "transparent",
  border: 0,
  borderBottom: "1px solid rgba(255,255,255,.09)",
  textAlign: "left",
  fontWeight: 850,
  cursor: "pointer",
};

const shell: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "320px minmax(0,1fr)",
  gap: 18,
  alignItems: "start",
};

const routePane: React.CSSProperties = {
  position: "sticky",
  top: 18,
  border: "1px solid rgba(232,196,107,.18)",
  borderRadius: 28,
  padding: 18,
  background: "rgba(255,255,255,.035)",
};

const paneTitle: React.CSSProperties = {
  fontSize: 34,
  lineHeight: 1,
  letterSpacing: "-.055em",
  margin: "10px 0 16px",
};

const routeWindow: React.CSSProperties = {
  width: "100%",
  position: "relative",
  display: "grid",
  gap: 8,
  border: "1px solid rgba(255,255,255,.12)",
  borderRadius: 22,
  padding: 16,
  marginBottom: 12,
  background: "rgba(255,255,255,.035)",
  color: "white",
  textAlign: "left",
  cursor: "pointer",
};

const routeWindowActive: React.CSSProperties = {
  ...routeWindow,
  border: "1px solid rgba(232,196,107,.42)",
  background: "linear-gradient(145deg,rgba(232,196,107,.15),rgba(255,255,255,.04))",
};

const routeWindowLabel: React.CSSProperties = {
  color: "#38bdf8",
  letterSpacing: ".16em",
  textTransform: "uppercase",
  fontWeight: 950,
  fontSize: 12,
};

const routeWindowNumber: React.CSSProperties = {
  position: "absolute",
  top: 14,
  right: 16,
  color: "#f8e7b0",
  fontSize: 34,
  lineHeight: 1,
};

const routeWindowTitle: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 950,
};

const routeWindowNote: React.CSSProperties = {
  color: "#cbd5e1",
};

const mainPanel: React.CSSProperties = {
  minWidth: 0,
};

const selectedPanel: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 18,
  flexWrap: "wrap",
  border: "1px solid rgba(232,196,107,.18)",
  borderRadius: 28,
  padding: 22,
  marginBottom: 18,
  background: "rgba(255,255,255,.035)",
};

const selectedTitle: React.CSSProperties = {
  fontSize: "clamp(36px,6vw,56px)",
  lineHeight: 1,
  letterSpacing: "-.055em",
  margin: "8px 0 8px",
};

const selectedStats: React.CSSProperties = {
  display: "flex",
  gap: 12,
  flexWrap: "wrap",
};

const searchPanel: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.10)",
  borderRadius: 24,
  padding: 16,
  marginBottom: 18,
  background: "rgba(255,255,255,.025)",
};

const input: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  borderRadius: 18,
  border: "1px solid rgba(255,255,255,.14)",
  background: "#081224",
  color: "white",
  padding: 16,
  fontSize: 16,
  outline: "none",
};

const conversation: React.CSSProperties = {
  position: "relative",
  border: "1px solid rgba(255,255,255,.12)",
  borderRadius: 28,
  padding: 24,
  background: "rgba(255,255,255,.035)",
};

const countBadge: React.CSSProperties = {
  position: "absolute",
  top: 24,
  right: 24,
  fontSize: 58,
  fontWeight: 1000,
  color: "#f8e7b0",
  lineHeight: 1,
};

const laneChip: React.CSSProperties = {
  display: "inline-flex",
  borderRadius: 999,
  border: "1px solid rgba(232,196,107,.24)",
  color: "#f8e7b0",
  padding: "8px 12px",
  fontSize: 12,
  fontWeight: 900,
};

const conversationTitle: React.CSSProperties = {
  fontSize: "clamp(30px,5vw,52px)",
  lineHeight: 1,
  margin: "18px 74px 16px 0",
};

const preview: React.CSSProperties = {
  color: "#dbeafe",
  fontSize: 21,
  lineHeight: 1.5,
  marginTop: 18,
};

const muted: React.CSSProperties = {
  color: "#cbd5e1",
  lineHeight: 1.5,
  margin: 0,
};

const chip: React.CSSProperties = {
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,.12)",
  padding: "8px 12px",
  fontSize: 12,
  color: "#dbeafe",
  display: "inline-flex",
};

const button: React.CSSProperties = {
  display: "inline-flex",
  justifyContent: "center",
  alignItems: "center",
  borderRadius: 999,
  padding: "14px 20px",
  background: "linear-gradient(135deg,#f8e7b0,#e8c46b)",
  color: "#06100a",
  textDecoration: "none",
  fontWeight: 950,
  border: 0,
  cursor: "pointer",
};

const ghost: React.CSSProperties = {
  ...button,
  background: "rgba(255,255,255,.06)",
  border: "1px solid rgba(255,255,255,.14)",
  color: "white",
};

const danger: React.CSSProperties = {
  ...button,
  background: "rgba(248,113,113,.12)",
  border: "1px solid rgba(248,113,113,.28)",
  color: "#fecaca",
};

const emptyPanel: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.18)",
  borderRadius: 28,
  padding: 22,
  marginTop: 18,
  background: "rgba(255,255,255,.035)",
};
