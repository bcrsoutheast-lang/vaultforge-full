"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import VaultForgeMemberNav from "../components/VaultForgeMemberNav";

type MessageRow = Record<string, any>;

const OWNER_EMAIL = "bcrsoutheast@gmail.com";

function clean(value: unknown) {
  return String(value || "").trim();
}

function cleanEmail(value: unknown) {
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

function getStoredEmail() {
  if (typeof window === "undefined") return "";

  const url = new URL(window.location.href);
  const urlEmail = cleanEmail(url.searchParams.get("email"));
  if (urlEmail.includes("@")) return urlEmail;

  const keys = ["vf_email", "vf_member_email", "vf_admin_email", "email", "member_email"];

  for (const key of keys) {
    const value = cleanEmail(window.localStorage.getItem(key));
    if (value.includes("@")) return value;
  }

  return cleanEmail(readCookie("vf_email") || readCookie("vf_admin_email"));
}

function fmtDate(value: unknown) {
  const date = new Date(String(value || ""));
  if (Number.isNaN(date.getTime())) return "Recent";
  return date.toLocaleString();
}

function first(...values: unknown[]) {
  for (const value of values) {
    const text = clean(value);
    if (text) return text;
  }
  return "";
}

function threadIdOf(row: MessageRow) {
  return first(row.thread_id, row.threadId, row.id, row.message_thread_id);
}

function fromEmailOf(row: MessageRow) {
  return cleanEmail(row.from_email || row.sender_email || row.email || row.member_email);
}

function toEmailOf(row: MessageRow) {
  return cleanEmail(row.to_email || row.recipient_email || row.target_email || row.owner_email);
}

function subjectOf(row: MessageRow) {
  return first(row.subject, row.title, "VaultForge message");
}

function bodyOf(row: MessageRow) {
  return first(row.body, row.message, row.note, row.description, "No message preview.");
}

function signalIdOf(row: MessageRow) {
  return first(row.signal_id, row.signalId, row.related_signal_id);
}

function itemIdOf(row: MessageRow) {
  return first(row.item_id, row.itemId, row.deal_id, row.project_id, row.pain_id);
}

function counterpart(row: MessageRow, activeEmail: string) {
  const from = fromEmailOf(row);
  const to = toEmailOf(row);

  if (from && from !== activeEmail) return from;
  if (to && to !== activeEmail) return to;
  return to || from || OWNER_EMAIL;
}

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(232,196,107,.16), transparent 30%), linear-gradient(180deg,#030509,#071326 55%,#030509)",
  color: "white",
  padding: "28px 18px 90px",
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
};

const shell: React.CSSProperties = {
  maxWidth: 1180,
  margin: "0 auto",
};

const hero: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.28)",
  borderRadius: 30,
  background:
    "linear-gradient(135deg,rgba(45,35,24,.82),rgba(12,19,32,.92) 55%,rgba(3,5,9,.95))",
  boxShadow: "0 26px 90px rgba(0,0,0,.36)",
  padding: 26,
  marginBottom: 22,
};

const eyebrow: React.CSSProperties = {
  color: "#e8c46b",
  letterSpacing: ".28em",
  textTransform: "uppercase",
  fontWeight: 900,
  fontSize: 13,
};

const title: React.CSSProperties = {
  fontSize: "clamp(46px,8vw,92px)",
  lineHeight: 0.9,
  margin: "12px 0 18px",
  letterSpacing: "-0.075em",
};

const muted: React.CSSProperties = {
  color: "rgba(255,255,255,.68)",
  lineHeight: 1.55,
};

const action: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 48,
  padding: "0 18px",
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,.14)",
  color: "white",
  textDecoration: "none",
  fontWeight: 900,
  background: "rgba(255,255,255,.06)",
  cursor: "pointer",
};

const goldAction: React.CSSProperties = {
  ...action,
  color: "#08111f",
  background: "linear-gradient(135deg,#fff1a8,#e8c46b)",
  border: 0,
};

const input: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  minHeight: 54,
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,.16)",
  background: "rgba(255,255,255,.07)",
  color: "white",
  padding: "0 16px",
  fontSize: 16,
  outline: "none",
};

const card: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.18)",
  borderRadius: 24,
  background: "linear-gradient(135deg,rgba(255,255,255,.07),rgba(255,255,255,.03))",
  boxShadow: "0 20px 70px rgba(0,0,0,.28)",
  padding: 20,
  color: "white",
  textDecoration: "none",
};

export default function MessagesPage() {
  const [email, setEmail] = useState("");
  const [rows, setRows] = useState<MessageRow[]>([]);
  const [status, setStatus] = useState("Loading messages...");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  async function loadMessages() {
    setLoading(true);
    setStatus("Loading messages...");

    const activeEmail = getStoredEmail();
    setEmail(activeEmail);

    if (!activeEmail) {
      setRows([]);
      setStatus("Login email not detected. Please log in again.");
      setLoading(false);
      return;
    }

    try {
      const owner = activeEmail === OWNER_EMAIL ? "&owner=1" : "";
      const res = await fetch(`/api/messages/thread?email=${encodeURIComponent(activeEmail)}${owner}`, {
        cache: "no-store",
        headers: {
          "x-vf-email": activeEmail,
          "x-vf-admin": activeEmail === OWNER_EMAIL ? "1" : "0",
        },
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok || json?.ok === false) {
        throw new Error(json?.error || json?.details || "Could not load messages.");
      }

      const raw = Array.isArray(json.threads)
        ? json.threads
        : Array.isArray(json.messages)
        ? json.messages
        : Array.isArray(json.data)
        ? json.data
        : [];

      const grouped = new Map<string, MessageRow>();

      for (const row of raw) {
        const threadId = threadIdOf(row);
        if (!threadId) continue;

        const existing = grouped.get(threadId);
        const existingTime = new Date(existing?.created_at || existing?.updated_at || 0).getTime();
        const rowTime = new Date(row.created_at || row.updated_at || 0).getTime();

        if (!existing || rowTime >= existingTime) {
          grouped.set(threadId, row);
        }
      }

      const sorted = Array.from(grouped.values()).sort(
        (a, b) =>
          new Date(b.created_at || b.updated_at || 0).getTime() -
          new Date(a.created_at || a.updated_at || 0).getTime()
      );

      setRows(sorted);
      setStatus(sorted.length ? "" : "No message threads found yet.");
    } catch (error: any) {
      setRows([]);
      setStatus(error?.message || "Could not load messages.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMessages();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;

    return rows.filter((row) =>
      [
        subjectOf(row),
        bodyOf(row),
        fromEmailOf(row),
        toEmailOf(row),
        signalIdOf(row),
        itemIdOf(row),
        threadIdOf(row),
      ]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [rows, search]);

  return (
    <main style={page}>
      <style>{`
        a:hover,
        button:hover {
          transform: translateY(-1px);
          transition: all .18s ease;
          filter: brightness(1.05);
        }

        input::placeholder {
          color: rgba(255,255,255,.42);
        }

        @media (max-width: 760px) {
          .vf-message-actions {
            display: grid !important;
            grid-template-columns: 1fr !important;
          }

          .vf-message-actions > * {
            width: 100%;
            box-sizing: border-box;
          }
        }
      `}</style>

      <div style={shell}>
        <VaultForgeMemberNav title="Messages" subtitle="Requests, replies, owner communication, and controlled introductions." />

        <section style={hero}>
          <div style={eyebrow}>VaultForge Communication</div>
          <h1 style={title}>Message command center.</h1>
          <p style={{ ...muted, maxWidth: 780, fontSize: 19 }}>
            One inbox for signal requests, project owner messages, routing follow-ups, and execution conversations.
          </p>

          <div className="vf-message-actions" style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 20 }}>
            <span style={action}>Signed in: {email || "not detected"}</span>
            <span style={action}>Threads: {filtered.length}</span>
            <button type="button" style={goldAction} onClick={loadMessages}>
              {loading ? "Refreshing..." : "Refresh Messages"}
            </button>
            <Link href="/dashboard" style={action}>Dashboard</Link>
            <Link href="/signals" style={action}>Signals</Link>
            <Link href="/pain-feed" style={action}>Pain Feed</Link>
          </div>
        </section>

        <section style={hero}>
          <div style={eyebrow}>Search Messages</div>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by owner, signal, project, subject, or message..."
            style={input}
          />
        </section>

        {status ? (
          <section style={hero}>
            <p style={{ ...muted, margin: 0 }}>{status}</p>
          </section>
        ) : null}

        <section style={{ display: "grid", gap: 14 }}>
          {filtered.map((row) => {
            const threadId = threadIdOf(row);
            const signalId = signalIdOf(row);
            const itemId = itemIdOf(row);
            const other = counterpart(row, email);

            return (
              <Link key={threadId} href={`/messages/${encodeURIComponent(threadId)}`} style={card}>
                <div style={eyebrow}>Thread · {fmtDate(row.created_at || row.updated_at)}</div>
                <h2 style={{ fontSize: 28, lineHeight: 1.05, margin: "10px 0 8px" }}>{subjectOf(row)}</h2>
                <p style={{ ...muted, fontSize: 16, margin: "0 0 14px" }}>{bodyOf(row)}</p>

                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  <span style={action}>With: {other || "unknown"}</span>
                  {signalId ? <span style={action}>Signal: {signalId}</span> : null}
                  {itemId ? <span style={action}>Item: {itemId}</span> : null}
                  <span style={goldAction}>Open Thread →</span>
                </div>
              </Link>
            );
          })}
        </section>
      </div>
    </main>
  );
}
