"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type MessageRow = Record<string, any>;

type Conversation = {
  threadKey: string;
  threadId: string;
  title: string;
  lane: string;
  from: string;
  to: string;
  latestMessage: string;
  latestAt: string;
  count: number;
};

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

function currentEmail() {
  if (typeof window === "undefined") return "";

  const local =
    window.localStorage.getItem("vf_email") ||
    window.localStorage.getItem("email") ||
    "";

  if (local.includes("@")) return lower(local);

  const cookieMatch = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("vf_email="));

  if (!cookieMatch) return "";

  try {
    return lower(decodeURIComponent(cookieMatch.split("=")[1] || ""));
  } catch {
    return lower(cookieMatch.split("=")[1] || "");
  }
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
      .trim() || "VaultForge message"
  );
}

function bodyOf(row: MessageRow) {
  return first(row.message, row.body, row.note);
}

function createdOf(row: MessageRow) {
  return first(row.updated_at, row.created_at);
}

function laneOf(row: MessageRow) {
  const text = lower(
    [
      row.folder,
      row.folder_key,
      row.source,
      row.origin,
      row.thread_key,
      row.subject,
    ].join(" ")
  );

  if (text.includes("alert")) return "ALERTS";
  if (text.includes("pain")) return "PAIN";
  if (text.includes("signal")) return "SIGNALS";
  if (text.includes("routing")) return "ROUTING";
  if (text.includes("intro")) return "INTRO";
  if (text.includes("project") || text.includes("deal")) return "PROJECTS";
  if (text.includes("member") || text.includes("connect")) return "MEMBERS";

  return "GENERAL";
}

export default function MessagesPage() {
  const [rows, setRows] = useState<MessageRow[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("Loading conversations...");
  const [viewer, setViewer] = useState("");

  async function load() {
    const email = currentEmail();
    setViewer(email);

    try {
      const response = await fetch(
        `/api/simple-messages?email=${encodeURIComponent(email)}`,
        {
          cache: "no-store",
          headers: {
            "x-vf-email": email,
          },
        }
      );

      const data = await response.json();

      /*
        IMPORTANT:
        Use ONLY data.messages.
        data.threads duplicates the same records.
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
      const threadKey = threadKeyOf(row);
      const threadId = threadIdOf(row);

      /*
        REAL conversation identity:
        1. thread_key
        2. thread_id fallback
      */
      const key = threadKey || threadId;

      if (!key) return;

      const searchText = lower(
        [
          titleOf(row),
          bodyOf(row),
          row.from_email,
          row.to_email,
          row.thread_key,
          laneOf(row),
        ].join(" ")
      );

      if (query && !searchText.includes(lower(query))) {
        return;
      }

      const existing = grouped.get(key);

      if (!existing) {
        grouped.set(key, {
          threadKey,
          threadId,
          title: titleOf(row),
          lane: laneOf(row),
          from: first(row.from_email, row.sender_email),
          to: first(row.to_email, row.recipient_email),
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
        existing.lane = laneOf(row);
      }
    });

    return Array.from(grouped.values()).sort((a, b) =>
      b.latestAt.localeCompare(a.latestAt)
    );
  }, [rows, query]);

  return (
    <main style={page}>
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

        <section style={hero}>
          <div style={eyebrow}>VaultForge Messaging</div>

          <h1 style={heroTitle}>Conversation Command.</h1>

          <p style={lead}>
            One card equals one real thread-key conversation.
          </p>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <span style={chip}>Signed in: {viewer || "unknown"}</span>
            <span style={chip}>Conversations: {conversations.length}</span>
            <span style={chip}>Messages: {rows.length}</span>
          </div>

          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search conversations..."
            style={input}
          />

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
            <button type="button" onClick={load} style={button}>
              Refresh Messages
            </button>
            <Link href="/dashboard" style={ghostButton}>Back to Dashboard</Link>
          </div>
        </section>

        <section style={{ display: "grid", gap: 18 }}>
          {conversations.map((conversation) => {
            const href = `/messages/${encodeURIComponent(
              conversation.threadId || conversation.threadKey
            )}?thread_key=${encodeURIComponent(conversation.threadKey)}`;

            return (
              <article
                key={conversation.threadKey || conversation.threadId}
                style={card}
              >
                <div style={laneChip}>{conversation.lane}</div>

                <div style={count}>{conversation.count}</div>

                <h2 style={title}>{conversation.title}</h2>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <span style={chip}>
                    From: {conversation.from || "unknown"}
                  </span>

                  <span style={chip}>
                    To: {conversation.to || "unknown"}
                  </span>

                  <span style={chip}>
                    Messages: {conversation.count}
                  </span>
                </div>

                <p style={messagePreview}>
                  {conversation.latestMessage || "No preview"}
                </p>

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
                  <Link href={href} style={button}>
                    Open Messages
                  </Link>
                </div>
              </article>
            );
          })}
        </section>

        {status ? <section style={hero}>{status}</section> : null}
      </div>
    </main>
  );
}

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "linear-gradient(180deg,#020303,#071326 55%,#020303)",
  color: "white",
  padding: "22px 16px 96px",
  fontFamily: "Arial, sans-serif",
};

const wrap: React.CSSProperties = {
  width: "min(1100px,100%)",
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
  border: "1px solid rgba(232,196,107,.18)",
  borderRadius: 28,
  padding: 24,
  marginBottom: 22,
  background: "rgba(255,255,255,.03)",
};

const eyebrow: React.CSSProperties = {
  color: "#e8c46b",
  fontWeight: 900,
  letterSpacing: ".18em",
  textTransform: "uppercase",
  fontSize: 12,
};

const heroTitle: React.CSSProperties = {
  fontSize: "clamp(48px,10vw,90px)",
  lineHeight: .9,
  margin: "12px 0",
};

const lead: React.CSSProperties = {
  color: "#cbd5e1",
  marginBottom: 18,
  fontSize: 18,
  lineHeight: 1.5,
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
};

const card: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.12)",
  borderRadius: 28,
  padding: 24,
  position: "relative",
  background: "rgba(255,255,255,.03)",
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

const count: React.CSSProperties = {
  position: "absolute",
  top: 24,
  right: 24,
  fontSize: 58,
  fontWeight: 900,
  color: "#f8e7b0",
};

const title: React.CSSProperties = {
  fontSize: "clamp(30px,5vw,52px)",
  lineHeight: 1,
  margin: "18px 0 16px",
  paddingRight: 74,
};

const messagePreview: React.CSSProperties = {
  color: "#dbeafe",
  fontSize: 22,
  lineHeight: 1.5,
  marginTop: 18,
};

const chip: React.CSSProperties = {
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,.12)",
  padding: "8px 12px",
  fontSize: 12,
  color: "#dbeafe",
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
  fontWeight: 900,
  border: 0,
  cursor: "pointer",
};

const ghostButton: React.CSSProperties = {
  ...button,
  background: "rgba(255,255,255,.06)",
  border: "1px solid rgba(255,255,255,.14)",
  color: "white",
};
