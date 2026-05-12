"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type MessageRow = Record<string, any>;

type Conversation = {
  key: string;
  threadKey: string;
  threadId: string;
  title: string;
  lane: LaneKey;
  from: string;
  to: string;
  latestMessage: string;
  latestAt: string;
  count: number;
};

type LaneKey =
  | "alerts"
  | "pain"
  | "signals"
  | "routing"
  | "introductions"
  | "projects"
  | "members"
  | "general";

const LANES: {
  key: LaneKey;
  title: string;
  label: string;
  description: string;
  href?: string;
}[] = [
  {
    key: "alerts",
    title: "Alerts",
    label: "ALERTS",
    description: "Alert follow-up, owner requests, and urgent message traffic.",
    href: "/alerts",
  },
  {
    key: "pain",
    title: "Pain",
    label: "PAIN",
    description: "Pain signal conversations and problem-routing follow-up.",
    href: "/pain-feed",
  },
  {
    key: "signals",
    title: "Signals",
    label: "SIGNALS",
    description: "Signal-room messages and intelligence follow-up.",
    href: "/signals",
  },
  {
    key: "routing",
    title: "Routing",
    label: "ROUTING",
    description: "Routing requests, member-fit paths, and execution handoffs.",
    href: "/routing-inbox",
  },
  {
    key: "introductions",
    title: "Introductions",
    label: "INTRO",
    description: "Controlled introduction conversations.",
    href: "/introductions",
  },
  {
    key: "projects",
    title: "Projects",
    label: "PROJECTS",
    description: "Project and deal-room communication.",
    href: "/projects",
  },
  {
    key: "members",
    title: "Members",
    label: "MEMBERS",
    description: "Member-to-member and network messages.",
    href: "/members",
  },
  {
    key: "general",
    title: "General",
    label: "GENERAL",
    description: "General messages that are not tied to a lane yet.",
    href: "/messages",
  },
];

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

  const keys = ["vf_email", "vf_member_email", "vf_admin_email", "email", "memberEmail"];

  for (const key of keys) {
    const local = lower(window.localStorage.getItem(key));
    if (local.includes("@")) return local;

    const session = lower(window.sessionStorage.getItem(key));
    if (session.includes("@")) return session;
  }

  return lower(readCookie("vf_email") || readCookie("vf_member_email") || readCookie("vf_admin_email"));
}

function threadKeyOf(row: MessageRow) {
  return first(row.thread_key, row.metadata?.thread_key);
}

function threadIdOf(row: MessageRow) {
  return first(row.thread_id, row.metadata?.thread_id);
}

function titleOf(row: MessageRow) {
  return (
    first(row.subject, row.title, "VaultForge message")
      .replace(/^(re:\s*)+/gi, "")
      .replace(/\s+/g, " ")
      .trim() || "VaultForge message"
  );
}

function bodyOf(row: MessageRow) {
  return first(row.message, row.body, row.note);
}

function createdOf(row: MessageRow) {
  return first(row.updated_at, row.created_at);
}

function fromOf(row: MessageRow) {
  return first(row.from_email, row.sender_email, row.member_email);
}

function toOf(row: MessageRow) {
  return first(row.to_email, row.recipient_email, row.target_email, row.owner_email);
}

function laneOf(row: MessageRow): LaneKey {
  const text = lower(
    [
      row.folder,
      row.folder_key,
      row.source,
      row.origin,
      row.message_type,
      row.thread_id,
      row.thread_key,
      row.subject,
      row.title,
    ].join(" ")
  );

  if (text.includes("alert")) return "alerts";
  if (text.includes("pain")) return "pain";
  if (text.includes("signal")) return "signals";
  if (text.includes("routing") || text.includes("route")) return "routing";
  if (text.includes("intro")) return "introductions";
  if (text.includes("project") || text.includes("deal")) return "projects";
  if (text.includes("member") || text.includes("connect")) return "members";

  return "general";
}

function laneMeta(key: LaneKey) {
  return LANES.find((lane) => lane.key === key) || LANES[LANES.length - 1];
}

function conversationKey(row: MessageRow) {
  const threadKey = threadKeyOf(row);
  if (threadKey) return `thread_key:${threadKey}`;

  const threadId = threadIdOf(row);
  if (threadId) return `thread_id:${threadId}`;

  return `fallback:${titleOf(row)}|${fromOf(row)}|${toOf(row)}`.toLowerCase();
}

async function safeJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

export default function MessagesPage() {
  const [rows, setRows] = useState<MessageRow[]>([]);
  const [query, setQuery] = useState("");
  const [viewer, setViewer] = useState("");
  const [status, setStatus] = useState("Loading conversations...");
  const [selectedLane, setSelectedLane] = useState<LaneKey | "all">("all");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const folder = lower(params.get("folder") || params.get("lane") || "");

    if (LANES.some((lane) => lane.key === folder)) {
      setSelectedLane(folder as LaneKey);
    }
  }, []);

  async function load() {
    const email = currentEmail();
    setViewer(email);

    try {
      const response = await fetch(`/api/simple-messages?email=${encodeURIComponent(email)}`, {
        cache: "no-store",
        headers: {
          "x-vf-email": email,
        },
      });

      const data = await safeJson(response);

      /*
        IMPORTANT:
        Use ONLY data.messages.
        data.threads duplicates the same message records.
      */
      const nextRows = Array.isArray(data.messages) ? data.messages : [];

      setRows(nextRows);
      setStatus(nextRows.length ? "" : "No conversations found.");
    } catch (error) {
      console.error(error);
      setStatus("Could not load messages.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  const conversations = useMemo(() => {
    const grouped = new Map<string, Conversation>();

    rows.forEach((row) => {
      const key = conversationKey(row);
      const threadKey = threadKeyOf(row);
      const threadId = threadIdOf(row);
      const lane = laneOf(row);

      if (!key) return;

      const existing = grouped.get(key);

      if (!existing) {
        grouped.set(key, {
          key,
          threadKey,
          threadId,
          title: titleOf(row),
          lane,
          from: fromOf(row),
          to: toOf(row),
          latestMessage: bodyOf(row),
          latestAt: createdOf(row),
          count: 1,
        });

        return;
      }

      existing.count += 1;

      if (createdOf(row) > existing.latestAt) {
        existing.latestAt = createdOf(row);
        existing.latestMessage = bodyOf(row);
        existing.title = titleOf(row);
        existing.lane = lane;
        existing.from = fromOf(row);
        existing.to = toOf(row);
      }
    });

    return Array.from(grouped.values()).sort((a, b) =>
      b.latestAt.localeCompare(a.latestAt)
    );
  }, [rows]);

  const laneCounts = useMemo(() => {
    const counts: Record<LaneKey, number> = {
      alerts: 0,
      pain: 0,
      signals: 0,
      routing: 0,
      introductions: 0,
      projects: 0,
      members: 0,
      general: 0,
    };

    conversations.forEach((conversation) => {
      counts[conversation.lane] += conversation.count;
    });

    return counts;
  }, [conversations]);

  const visibleConversations = useMemo(() => {
    const q = lower(query);

    return conversations.filter((conversation) => {
      if (selectedLane !== "all" && conversation.lane !== selectedLane) {
        return false;
      }

      if (!q) return true;

      return lower(
        [
          conversation.title,
          conversation.latestMessage,
          conversation.from,
          conversation.to,
          conversation.lane,
        ].join(" ")
      ).includes(q);
    });
  }, [conversations, query, selectedLane]);

  const totalMessages = rows.length;
  const totalConversations = conversations.length;
  const activeLaneTitle = selectedLane === "all" ? "All Messages" : laneMeta(selectedLane).title;

  return (
    <main style={page}>
      <style>{`
        a:hover, button:hover {
          transform: translateY(-1px);
          filter: brightness(1.06);
          transition: all .18s ease;
        }

        input::placeholder {
          color: rgba(255,255,255,.45);
        }

        @media (max-width: 780px) {
          .vf-two-col {
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
          <Link href="/network" style={navButton}>Network</Link>
          <Link href="/members" style={navButton}>Members</Link>
          <Link href="/messages" style={navButtonActive}>Messages</Link>
        </nav>

        <section className="vf-two-col" style={heroGrid}>
          <div>
            <div style={eyebrow}>VaultForge Command Center</div>

            <h1 style={heroTitle}>Message intelligence desk.</h1>

            <p style={lead}>
              One clean operating view for alert replies, pain conversations, signal messages,
              routing follow-up, member communication, and project threads.
            </p>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 22 }}>
              <span style={chip}>Signed in: {viewer || "unknown"}</span>
              <span style={chip}>Conversations: {totalConversations}</span>
              <span style={chip}>Messages: {totalMessages}</span>
            </div>

            <div className="vf-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button type="button" onClick={load} style={button}>Refresh</button>
              <Link href="/dashboard" style={ghostButton}>Dashboard</Link>
              <Link href="/alerts" style={ghostButton}>Alerts</Link>
              <Link href="/pain-feed" style={ghostButton}>Pain Feed</Link>
            </div>
          </div>

          <aside style={tape}>
            <div style={tapeTitle}>Today&apos;s Message Tape</div>

            {LANES.slice(0, 6).map((lane) => (
              <button
                key={lane.key}
                type="button"
                onClick={() => setSelectedLane(lane.key)}
                style={tapeRow}
              >
                <span>{lane.title}</span>
                <strong>{laneCounts[lane.key] || 0}</strong>
              </button>
            ))}
          </aside>
        </section>

        <section style={sectionHeader}>
          <div>
            <div style={eyebrow}>Message Lanes</div>
            <h2 style={sectionTitle}>Open by category.</h2>
          </div>

          <button type="button" onClick={() => setSelectedLane("all")} style={selectedLane === "all" ? button : ghostButton}>
            All Messages
          </button>
        </section>

        <section className="vf-two-col" style={laneGrid}>
          {LANES.map((lane) => {
            const count = laneCounts[lane.key] || 0;
            const active = selectedLane === lane.key;

            return (
              <button
                key={lane.key}
                type="button"
                onClick={() => setSelectedLane(lane.key)}
                style={active ? laneCardActive : laneCard}
              >
                <div style={laneSmall}>{lane.label}</div>
                <div style={laneNumber}>{count}</div>
                <h3 style={laneTitle}>{lane.title}</h3>
                <p style={laneDescription}>{lane.description}</p>
              </button>
            );
          })}
        </section>

        <section style={filterPanel}>
          <div>
            <div style={eyebrow}>Selected Lane</div>
            <h2 style={sectionTitle}>{activeLaneTitle}</h2>
          </div>

          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search selected messages..."
            style={input}
          />
        </section>

        <section style={{ display: "grid", gap: 18 }}>
          {visibleConversations.map((conversation) => {
            const href = `/messages/${encodeURIComponent(
              conversation.threadId || conversation.threadKey
            )}?thread_key=${encodeURIComponent(conversation.threadKey)}`;

            return (
              <article key={conversation.key} style={conversationCard}>
                <div style={laneChip}>{laneMeta(conversation.lane).label}</div>

                <div style={countBadge}>{conversation.count}</div>

                <h2 style={conversationTitle}>{conversation.title}</h2>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <span style={chip}>From: {conversation.from || "unknown"}</span>
                  <span style={chip}>To: {conversation.to || "unknown"}</span>
                  <span style={chip}>Messages: {conversation.count}</span>
                </div>

                <p style={messagePreview}>
                  {conversation.latestMessage || "No preview available."}
                </p>

                <div className="vf-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
                  <Link href={href} style={button}>
                    Open Messages
                  </Link>
                  {laneMeta(conversation.lane).href ? (
                    <Link href={laneMeta(conversation.lane).href || "/messages"} style={ghostButton}>
                      Open {laneMeta(conversation.lane).title}
                    </Link>
                  ) : null}
                </div>
              </article>
            );
          })}
        </section>

        {status ? <section style={filterPanel}>{status}</section> : null}
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
  width: "min(1180px,100%)",
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

const heroGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0,1.55fr) minmax(280px,.8fr)",
  gap: 22,
  border: "1px solid rgba(232,196,107,.18)",
  borderRadius: 30,
  padding: 28,
  marginBottom: 22,
  background: "linear-gradient(145deg,rgba(255,255,255,.06),rgba(255,255,255,.025))",
  boxShadow: "0 28px 86px rgba(0,0,0,.30)",
};

const eyebrow: React.CSSProperties = {
  color: "#e8c46b",
  fontWeight: 950,
  letterSpacing: ".18em",
  textTransform: "uppercase",
  fontSize: 12,
};

const heroTitle: React.CSSProperties = {
  fontSize: "clamp(54px,10vw,104px)",
  lineHeight: .88,
  letterSpacing: "-.075em",
  margin: "12px 0 22px",
};

const lead: React.CSSProperties = {
  color: "#cbd5e1",
  fontSize: 20,
  lineHeight: 1.55,
  maxWidth: 760,
};

const tape: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.12)",
  borderRadius: 26,
  padding: 20,
  background: "rgba(0,0,0,.18)",
};

const tapeTitle: React.CSSProperties = {
  color: "#e8c46b",
  letterSpacing: ".16em",
  textTransform: "uppercase",
  fontWeight: 950,
  fontSize: 12,
  marginBottom: 12,
};

const tapeRow: React.CSSProperties = {
  width: "100%",
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  padding: "13px 0",
  color: "white",
  background: "transparent",
  border: 0,
  borderBottom: "1px solid rgba(255,255,255,.09)",
  textAlign: "left",
  fontWeight: 850,
  cursor: "pointer",
};

const sectionHeader: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 16,
  flexWrap: "wrap",
  margin: "26px 0 14px",
};

const sectionTitle: React.CSSProperties = {
  fontSize: "clamp(34px,6vw,54px)",
  letterSpacing: "-.055em",
  lineHeight: 1,
  margin: "8px 0 0",
};

const laneGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2,minmax(0,1fr))",
  gap: 16,
  marginBottom: 22,
};

const laneCard: React.CSSProperties = {
  position: "relative",
  minHeight: 190,
  border: "1px solid rgba(255,255,255,.12)",
  borderRadius: 28,
  padding: 22,
  background: "rgba(255,255,255,.035)",
  color: "white",
  textAlign: "left",
  cursor: "pointer",
};

const laneCardActive: React.CSSProperties = {
  ...laneCard,
  border: "1px solid rgba(232,196,107,.38)",
  background: "linear-gradient(145deg,rgba(232,196,107,.12),rgba(255,255,255,.035))",
};

const laneSmall: React.CSSProperties = {
  color: "#38bdf8",
  letterSpacing: ".16em",
  textTransform: "uppercase",
  fontWeight: 950,
  fontSize: 12,
};

const laneNumber: React.CSSProperties = {
  position: "absolute",
  top: 22,
  right: 22,
  fontSize: 58,
  fontWeight: 1000,
  color: "#f8e7b0",
  lineHeight: 1,
};

const laneTitle: React.CSSProperties = {
  fontSize: 34,
  letterSpacing: "-.045em",
  margin: "42px 0 10px",
};

const laneDescription: React.CSSProperties = {
  color: "#cbd5e1",
  lineHeight: 1.5,
  margin: 0,
  maxWidth: 520,
};

const filterPanel: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.18)",
  borderRadius: 28,
  padding: 22,
  marginBottom: 18,
  background: "rgba(255,255,255,.035)",
};

const input: React.CSSProperties = {
  width: "100%",
  marginTop: 18,
  boxSizing: "border-box",
  borderRadius: 18,
  border: "1px solid rgba(255,255,255,.14)",
  background: "#081224",
  color: "white",
  padding: 16,
  fontSize: 16,
  outline: "none",
};

const conversationCard: React.CSSProperties = {
  position: "relative",
  border: "1px solid rgba(255,255,255,.12)",
  borderRadius: 28,
  padding: 24,
  background: "rgba(255,255,255,.035)",
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

const countBadge: React.CSSProperties = {
  position: "absolute",
  top: 24,
  right: 24,
  fontSize: 58,
  fontWeight: 1000,
  color: "#f8e7b0",
  lineHeight: 1,
};

const conversationTitle: React.CSSProperties = {
  fontSize: "clamp(30px,5vw,52px)",
  lineHeight: 1,
  margin: "18px 74px 16px 0",
};

const messagePreview: React.CSSProperties = {
  color: "#dbeafe",
  fontSize: 21,
  lineHeight: 1.5,
  marginTop: 18,
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

const ghostButton: React.CSSProperties = {
  ...button,
  background: "rgba(255,255,255,.06)",
  border: "1px solid rgba(255,255,255,.14)",
  color: "white",
};
