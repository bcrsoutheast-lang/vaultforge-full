"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

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
    const value = cleanEmail(window.localStorage.getItem(key) || window.sessionStorage.getItem(key));
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
    "radial-gradient(circle at top left, rgba(232,196,107,.14), transparent 30%), radial-gradient(circle at bottom right, rgba(148,163,184,.10), transparent 32%), linear-gradient(180deg,#020303,#07090d 50%,#020303)",
  color: "white",
  padding: "22px 16px 82px",
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
};

const shell: React.CSSProperties = {
  width: "min(1180px,100%)",
  margin: "0 auto",
};

const nav: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.24)",
  borderRadius: 26,
  padding: 18,
  background: "linear-gradient(135deg,rgba(255,255,255,.07),rgba(255,255,255,.025))",
  marginBottom: 16,
};

const navGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))",
  gap: 10,
  marginTop: 14,
};

const navLink: React.CSSProperties = {
  color: "white",
  textDecoration: "none",
  border: "1px solid rgba(255,255,255,.14)",
  background: "rgba(255,255,255,.055)",
  borderRadius: 15,
  padding: "13px 14px",
  fontWeight: 900,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
};

const hero: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.28)",
  borderRadius: 30,
  background:
    "linear-gradient(135deg,rgba(255,255,255,.075),rgba(255,255,255,.026))",
  boxShadow: "0 28px 90px rgba(0,0,0,.38)",
  padding: 24,
  marginBottom: 16,
};

const eyebrow: React.CSSProperties = {
  color: "#e8c46b",
  fontSize: 12,
  letterSpacing: ".18em",
  textTransform: "uppercase",
  fontWeight: 950,
  margin: "0 0 10px",
};

const title: React.CSSProperties = {
  fontSize: "clamp(44px,8vw,92px)",
  lineHeight: 0.88,
  margin: 0,
  letterSpacing: "-.06em",
};

const muted: React.CSSProperties = {
  color: "#cbd5e1",
  lineHeight: 1.55,
};

const action: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 46,
  padding: "0 16px",
  borderRadius: 15,
  border: "1px solid rgba(255,255,255,.14)",
  color: "white",
  textDecoration: "none",
  fontWeight: 900,
  background: "rgba(255,255,255,.055)",
  cursor: "pointer",
};

const goldAction: React.CSSProperties = {
  ...action,
  color: "#101010",
  background: "linear-gradient(135deg,#f8e7b0,#e8c46b)",
  border: "1px solid rgba(232,196,107,.7)",
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
  background: "linear-gradient(180deg,rgba(255,255,255,.065),rgba(255,255,255,.026))",
  boxShadow: "0 20px 70px rgba(0,0,0,.25)",
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
          filter: brightness(1.06);
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
        <section style={nav}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div>
              <p style={eyebrow}>VAULTFORGE COMMUNICATION</p>
              <strong style={{ fontSize: 24 }}>Messages</strong>
              <p style={{ ...muted, margin: "6px 0 0" }}>
                Requests, replies, owner communication, and controlled introductions.
              </p>
            </div>
            <span style={goldAction}>Signed in: {email || "not detected"}</span>
          </div>

          <div style={navGrid}>
            <Link href="/dashboard" style={navLink}>Dashboard <span>→</span></Link>
            <Link href="/intelligence" style={navLink}>Intelligence <span>→</span></Link>
            <Link href="/signals" style={navLink}>Signals <span>→</span></Link>
            <Link href="/pain-feed" style={navLink}>Pain Feed <span>→</span></Link>
            <Link href="/routing-inbox" style={navLink}>Routing <span>→</span></Link>
            <Link href="/alerts" style={navLink}>Alerts <span>→</span></Link>
            <Link href="/members" style={navLink}>Members <span>→</span></Link>
            <Link href="/logout" style={{ ...navLink, color: "#fecaca", border: "1px solid rgba(239,68,68,.34)" }}>Logout <span>→</span></Link>
          </div>
        </section>

        <section style={hero}>
          <p style={eyebrow}>MESSAGE COMMAND CENTER</p>
          <h1 style={title}>Controlled conversations.</h1>
          <p style={{ ...muted, maxWidth: 780, fontSize: 18, marginTop: 16 }}>
            One inbox for signal requests, project owner messages, routing follow-ups, and execution conversations.
          </p>

          <div className="vf-message-actions" style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 20 }}>
            <span style={action}>Threads: {filtered.length}</span>
            <button type="button" style={goldAction} onClick={loadMessages}>
              {loading ? "Refreshing..." : "Refresh Messages"}
            </button>
            <Link href="/dashboard" style={action}>Dashboard</Link>
            <Link href="/intelligence" style={action}>Intelligence</Link>
            <Link href="/signals" style={action}>Signals</Link>
          </div>
        </section>

        <section style={hero}>
          <p style={eyebrow}>SEARCH MESSAGES</p>
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
                <p style={eyebrow}>Thread · {fmtDate(row.created_at || row.updated_at)}</p>
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
