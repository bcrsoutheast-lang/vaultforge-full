"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Conversation = Record<string, any>;

const LANES = [
  { key: "alerts", label: "ALERTS", title: "Alerts", note: "Alert follow-up, owner requests, and urgent message traffic." },
  { key: "pain", label: "PAIN", title: "Pain", note: "Pain signal conversations and problem-routing follow-up." },
  { key: "signals", label: "SIGNALS", title: "Signals", note: "Signal-room messages and intelligence follow-up." },
  { key: "routing", label: "ROUTING", title: "Routing", note: "Routing requests, member-fit paths, and execution handoffs." },
  { key: "introductions", label: "INTRO", title: "Introductions", note: "Controlled introduction conversations." },
  { key: "projects", label: "PROJECTS", title: "Projects", note: "Project and deal-room communication." },
  { key: "members", label: "MEMBERS", title: "Members", note: "Member-to-member and private network messages." },
  { key: "general", label: "GENERAL", title: "General", note: "Messages not tied to a specific route yet." },
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
  const [openLane, setOpenLane] = useState<string>("");
  const [query, setQuery] = useState("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [status, setStatus] = useState("Loading message command...");
  const [busyKey, setBusyKey] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search || "");
    const route = lower(params.get("route") || params.get("folder") || params.get("lane"));

    if (route && LANES.some((lane) => lane.key === route)) {
      setOpenLane(route);
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
      next[lane.key] = { conversations: 0, messages: Number(counts[lane.key] || 0) };
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

    if (!openLane) return [];

    return conversations.filter((item) => {
      const folder = clean(item.folder || "general");

      if (folder !== openLane) return false;

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
  }, [conversations, query, openLane]);

  const totalMessages = conversations.reduce((sum, item) => sum + Number(item.count || 0), 0);
  const activeMeta = openLane ? laneMeta(openLane) : null;
  const activeCount = openLane ? Number(counts[openLane] || 0) : totalMessages;

  function openRoute(lane: string) {
    setOpenLane(lane);

    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("route", lane);
      window.history.replaceState(null, "", url.toString());
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function closeRoute() {
    setOpenLane("");
    setQuery("");

    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("route");
      window.history.replaceState(null, "", url.toString());
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  async function cleanup(convo: Conversation, action: "archive" | "delete") {
    const ids = Array.isArray(convo.message_ids) ? convo.message_ids.filter(Boolean) : [];

    if (!ids.length) {
      setStatus("No message IDs found for cleanup.");
      return;
    }

    setBusyKey(`${action}:${convo.thread_key}`);
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
    } finally {
      setBusyKey("");
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
          .vf-card-grid {
            grid-template-columns: 1fr !important;
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
          <div style={eyebrow}>VaultForge Message OS</div>
          <h1 style={heroTitle}>{openLane ? `${activeMeta?.title} messages.` : "Message command center."}</h1>
          <p style={lead}>
            {openLane
              ? `${activeMeta?.note || "Selected route messages."} Use Close to collapse this lane back into the card overview.`
              : "Every message route starts as a clean card. Tap a card to expose that lane’s conversations, then close it to return to overview."}
          </p>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
            <span style={chip}>Signed in: {email || "unknown"}</span>
            <span style={chip}>Total conversations: {conversations.length}</span>
            <span style={chip}>Total messages: {totalMessages}</span>
            {openLane ? <span style={chip}>Open lane: {activeMeta?.title}</span> : null}
          </div>

          <div className="vf-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 22 }}>
            <button type="button" onClick={load} style={button}>Refresh</button>
            {openLane ? <button type="button" onClick={closeRoute} style={danger}>Close Lane / Back to Cards</button> : null}
          </div>
        </section>

        {!openLane ? (
          <>
            <section style={sectionTop}>
              <div>
                <div style={eyebrow}>Message Route Cards</div>
                <h2 style={sectionTitle}>Everything has a lane.</h2>
              </div>
            </section>

            <section className="vf-card-grid" style={cardGrid}>
              {LANES.map((lane) => {
                const totals = laneTotals[lane.key] || { conversations: 0, messages: 0 };

                return (
                  <button
                    key={lane.key}
                    type="button"
                    onClick={() => openRoute(lane.key)}
                    style={routeCard}
                  >
                    <div style={routeLabel}>{lane.label}</div>
                    <div style={routeNumber}>{totals.messages}</div>
                    <h3 style={routeTitle}>{lane.title}</h3>
                    <p style={muted}>{lane.note}</p>

                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 18 }}>
                      <span style={smallPill}>{totals.conversations} conversations</span>
                      <span style={smallPill}>{totals.messages} messages</span>
                    </div>

                    <div style={openHint}>Open →</div>
                  </button>
                );
              })}
            </section>
          </>
        ) : (
          <>
            <section style={laneOpenPanel}>
              <div>
                <div style={eyebrow}>Open Route</div>
                <h2 style={sectionTitle}>{activeMeta?.title}</h2>
                <p style={muted}>{activeMeta?.note}</p>
              </div>

              <div style={laneStats}>
                <div style={statBox}>
                  <strong style={statNumber}>{visible.length}</strong>
                  <span>conversations</span>
                </div>
                <div style={statBox}>
                  <strong style={statNumber}>{activeCount}</strong>
                  <span>messages</span>
                </div>
              </div>

              <div className="vf-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap", width: "100%" }}>
                <button type="button" onClick={closeRoute} style={danger}>Close / Back to Cards</button>
                <Link href="/message-command" style={ghost}>Overview Link</Link>
              </div>
            </section>

            <section style={searchPanel}>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={`Search ${activeMeta?.title || "route"} messages...`}
                style={input}
              />
            </section>

            <section style={{ display: "grid", gap: 16 }}>
              {visible.map((convo) => {
                const isCollapsed = collapsed[convo.thread_key] === true;
                const href = `/message-command/${encodeURIComponent(convo.thread_key)}?title=${encodeURIComponent(convo.title || "Message Room")}&route=${encodeURIComponent(openLane)}`;
                const archiving = busyKey === `archive:${convo.thread_key}`;
                const deleting = busyKey === `delete:${convo.thread_key}`;

                return (
                  <article key={convo.thread_key} style={conversation}>
                    <div style={countBadge}>{convo.count}</div>

                    <div style={laneChip}>{convo.lane_label || activeMeta?.label}</div>

                    <h2 style={conversationTitle}>{safeTitle(convo.title)}</h2>

                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <span style={chip}>Route: {activeMeta?.title}</span>
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

                      <button type="button" onClick={() => cleanup(convo, "archive")} disabled={!!busyKey} style={ghost}>
                        {archiving ? "Archiving..." : "Archive"}
                      </button>

                      <button type="button" onClick={() => cleanup(convo, "delete")} disabled={!!busyKey} style={danger}>
                        {deleting ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </section>

            {!visible.length ? (
              <section style={emptyPanel}>
                <h3 style={{ marginTop: 0 }}>No messages in {activeMeta?.title} yet.</h3>
                <p style={muted}>
                  When conversations are routed to this lane, they will expose here.
                  Close this lane to return to the card overview.
                </p>
                <button type="button" onClick={closeRoute} style={button}>Back to Cards</button>
              </section>
            ) : null}
          </>
        )}

        {status ? <section style={emptyPanel}>{status}</section> : null}
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
  maxWidth: 920,
};

const sectionTop: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 16,
  flexWrap: "wrap",
  margin: "26px 0 14px",
};

const sectionTitle: React.CSSProperties = {
  fontSize: "clamp(36px,6vw,58px)",
  lineHeight: 1,
  letterSpacing: "-.055em",
  margin: "8px 0 8px",
};

const cardGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2,minmax(0,1fr))",
  gap: 16,
};

const routeCard: React.CSSProperties = {
  position: "relative",
  minHeight: 235,
  border: "1px solid rgba(255,255,255,.12)",
  borderRadius: 30,
  padding: 24,
  background: "linear-gradient(145deg,rgba(255,255,255,.055),rgba(255,255,255,.025))",
  color: "white",
  textAlign: "left",
  cursor: "pointer",
  overflow: "hidden",
};

const routeLabel: React.CSSProperties = {
  color: "#38bdf8",
  letterSpacing: ".18em",
  textTransform: "uppercase",
  fontWeight: 950,
  fontSize: 13,
};

const routeNumber: React.CSSProperties = {
  position: "absolute",
  top: 24,
  right: 24,
  color: "#f8e7b0",
  fontSize: 64,
  fontWeight: 1000,
  lineHeight: 1,
};

const routeTitle: React.CSSProperties = {
  fontSize: 38,
  lineHeight: 1,
  letterSpacing: "-.045em",
  margin: "56px 0 12px",
};

const smallPill: React.CSSProperties = {
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,.12)",
  padding: "8px 10px",
  color: "#dbeafe",
  fontSize: 12,
};

const openHint: React.CSSProperties = {
  marginTop: 18,
  fontWeight: 950,
  color: "#f8e7b0",
};

const laneOpenPanel: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 18,
  flexWrap: "wrap",
  border: "1px solid rgba(232,196,107,.22)",
  borderRadius: 30,
  padding: 24,
  marginBottom: 18,
  background: "linear-gradient(145deg,rgba(232,196,107,.10),rgba(255,255,255,.035))",
};

const laneStats: React.CSSProperties = {
  display: "flex",
  gap: 12,
  flexWrap: "wrap",
};

const statBox: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.12)",
  borderRadius: 22,
  padding: 16,
  minWidth: 145,
  background: "rgba(0,0,0,.16)",
};

const statNumber: React.CSSProperties = {
  display: "block",
  fontSize: 34,
  lineHeight: 1,
  color: "#f8e7b0",
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
