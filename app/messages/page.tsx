"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Message = Record<string, any>;

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

function getEmail() {
  if (typeof window === "undefined") return "";

  const keys = ["vf_email", "vf_member_email", "vf_admin_email", "email", "memberEmail"];

  for (const key of keys) {
    const localValue = cleanEmail(window.localStorage.getItem(key));
    if (localValue.includes("@")) return localValue;

    const sessionValue = cleanEmail(window.sessionStorage.getItem(key));
    if (sessionValue.includes("@")) return sessionValue;
  }

  return cleanEmail(readCookie("vf_email") || readCookie("vf_member_email") || readCookie("vf_admin_email"));
}

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

function fmt(value: unknown) {
  const date = new Date(String(value || ""));
  if (Number.isNaN(date.getTime())) return "Recent";
  return date.toLocaleString();
}

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(232,196,107,.13), transparent 30%), linear-gradient(180deg,#020303,#071326 55%,#020303)",
  color: "white",
  padding: "22px 16px 82px",
  fontFamily: "Arial, sans-serif",
};

const wrap: React.CSSProperties = { width: "min(1040px,100%)", margin: "0 auto" };

const card: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.28)",
  borderRadius: 28,
  padding: 24,
  background: "rgba(255,255,255,.06)",
  marginBottom: 16,
};

const eyebrow: React.CSSProperties = {
  color: "#e8c46b",
  letterSpacing: ".18em",
  textTransform: "uppercase",
  fontWeight: 950,
  fontSize: 12,
};

const muted: React.CSSProperties = { color: "#cbd5e1", lineHeight: 1.55 };

const btn: React.CSSProperties = {
  display: "inline-flex",
  justifyContent: "center",
  alignItems: "center",
  minHeight: 46,
  borderRadius: 999,
  padding: "12px 16px",
  border: 0,
  background: "#e8c46b",
  color: "#06100a",
  fontWeight: 950,
  textDecoration: "none",
  cursor: "pointer",
};

const ghost: React.CSSProperties = {
  ...btn,
  background: "rgba(255,255,255,.06)",
  border: "1px solid rgba(255,255,255,.16)",
  color: "white",
};

const danger: React.CSSProperties = {
  ...ghost,
  border: "1px solid rgba(255,120,120,.35)",
  color: "#ffd0d0",
};

const input: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,.18)",
  background: "rgba(255,255,255,.08)",
  color: "white",
  padding: 14,
  fontSize: 16,
};

export default function SimpleMessagesInbox() {
  const [email, setEmail] = useState("");
  const [threads, setThreads] = useState<Message[]>([]);
  const [status, setStatus] = useState("Loading messages...");
  const [busyThread, setBusyThread] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [search, setSearch] = useState("");

  async function load(nextShowArchived = showArchived) {
    const viewer = getEmail();
    setEmail(viewer);
    setStatus("Loading messages...");

    if (!viewer) {
      setThreads([]);
      setStatus("Login email not found. Please log in again.");
      return;
    }

    try {
      const query = new URLSearchParams();
      query.set("email", viewer);
      if (nextShowArchived) query.set("include_archived", "1");

      const res = await fetch(`/api/simple-messages?${query.toString()}`, {
        cache: "no-store",
        headers: { "x-vf-email": viewer },
      });

      const data = await safeJson(res);

      if (!res.ok || data?.ok === false) throw new Error(data?.error || "Could not load messages.");

      setThreads(Array.isArray(data.threads) ? data.threads : []);
      setStatus("");
    } catch (error: any) {
      setStatus(error?.message || "Could not load messages.");
    }
  }

  async function cleanup(threadId: string, action: "archive" | "restore" | "delete") {
    if (!threadId) return;

    setBusyThread(threadId);
    setStatus("");

    try {
      const endpoint =
        action === "delete"
          ? `/api/simple-messages?thread_id=${encodeURIComponent(threadId)}`
          : "/api/simple-messages";

      const res = await fetch(endpoint, {
        method: action === "delete" ? "DELETE" : "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-vf-email": email,
        },
        body: JSON.stringify({
          email,
          thread_id: threadId,
          action,
        }),
      });

      const data = await safeJson(res);

      if (!res.ok || data?.ok === false) throw new Error(data?.error || `Could not ${action} thread.`);

      await load(showArchived);
    } catch (error: any) {
      setStatus(error?.message || `Could not ${action} thread.`);
    } finally {
      setBusyThread("");
    }
  }

  useEffect(() => {
    load(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return threads;

    return threads.filter((thread) =>
      [
        thread.subject,
        thread.body,
        thread.from_email,
        thread.to_email,
        thread.thread_id,
        thread.signal_id,
        thread.item_id,
        thread.status,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [threads, search]);

  const activeCount = threads.filter((thread) => thread.status !== "archived" && thread.status !== "deleted").length;
  const archivedCount = threads.filter((thread) => thread.status === "archived").length;

  return (
    <main style={page}>
      <style>{`
        a:hover, button:hover {
          transform: translateY(-1px);
          transition: all .18s ease;
          filter: brightness(1.06);
        }

        input::placeholder {
          color: rgba(255,255,255,.42);
        }

        @media (max-width: 760px) {
          .vf-actions {
            display: grid !important;
            grid-template-columns: 1fr !important;
            gap: 10px !important;
          }

          .vf-actions > * {
            width: 100%;
            box-sizing: border-box;
            justify-content: center;
            margin: 0 !important;
          }
        }
      `}</style>

      <div style={wrap}>
        <section style={card}>
          <p style={eyebrow}>VaultForge Simple Messages</p>
          <h1 style={{ fontSize: "clamp(48px,11vw,86px)", lineHeight: 0.9, margin: "10px 0 18px" }}>
            Inbox cleanup.
          </h1>
          <p style={muted}>Simple owner/member communication with clean-up buttons. Archive, restore, or delete old threads.</p>
          <p style={muted}>Signed in: {email || "unknown"}</p>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
            <span style={{ ...ghost, minHeight: 34, padding: "8px 12px" }}>Visible: {filtered.length}</span>
            <span style={{ ...ghost, minHeight: 34, padding: "8px 12px" }}>Active: {activeCount}</span>
            <span style={{ ...ghost, minHeight: 34, padding: "8px 12px" }}>Archived: {archivedCount}</span>
          </div>

          <div className="vf-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
            <button type="button" onClick={() => load(showArchived)} style={btn}>
              Refresh
            </button>
            <button
              type="button"
              onClick={() => {
                const next = !showArchived;
                setShowArchived(next);
                load(next);
              }}
              style={ghost}
            >
              {showArchived ? "Hide Archived" : "Show Archived"}
            </button>
            <Link href="/pain-feed" style={ghost}>Pain Feed</Link>
            <Link href="/signals" style={ghost}>Signals</Link>
            <Link href="/dashboard" style={ghost}>Dashboard</Link>
          </div>
        </section>

        <section style={card}>
          <p style={eyebrow}>Search</p>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search sender, owner, subject, signal id, thread id..."
            style={input}
          />
        </section>

        {status ? <section style={card}>{status}</section> : null}

        {filtered.length === 0 && !status ? <section style={card}>No messages found.</section> : null}

        {filtered.map((thread) => {
          const archived = thread.status === "archived";
          const threadId = clean(thread.thread_id);
          const busy = busyThread === threadId;

          return (
            <article
              key={threadId}
              style={{
                ...card,
                opacity: archived ? 0.72 : 1,
                borderColor: archived ? "rgba(148,163,184,.32)" : "rgba(232,196,107,.28)",
              }}
            >
              <p style={eyebrow}>{archived ? "Archived Thread" : "Thread"}</p>
              <h2 style={{ marginBottom: 8 }}>{thread.subject || "VaultForge message"}</h2>
              <p style={muted}>{thread.body || "Open conversation."}</p>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "12px 0" }}>
                <span style={{ ...ghost, minHeight: 32, padding: "7px 10px", fontSize: 13 }}>From: {thread.from_email}</span>
                <span style={{ ...ghost, minHeight: 32, padding: "7px 10px", fontSize: 13 }}>To: {thread.to_email}</span>
                <span style={{ ...ghost, minHeight: 32, padding: "7px 10px", fontSize: 13 }}>Status: {thread.status || "open"}</span>
                <span style={{ ...ghost, minHeight: 32, padding: "7px 10px", fontSize: 13 }}>{fmt(thread.created_at)}</span>
              </div>

              <div className="vf-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
                <Link href={`/messages/${encodeURIComponent(threadId)}?email=${encodeURIComponent(email)}`} style={btn}>
                  Open Thread
                </Link>
                {archived ? (
                  <button type="button" disabled={busy} onClick={() => cleanup(threadId, "restore")} style={ghost}>
                    {busy ? "Working..." : "Restore"}
                  </button>
                ) : (
                  <button type="button" disabled={busy} onClick={() => cleanup(threadId, "archive")} style={ghost}>
                    {busy ? "Working..." : "Archive"}
                  </button>
                )}
                <button type="button" disabled={busy} onClick={() => cleanup(threadId, "delete")} style={danger}>
                  {busy ? "Working..." : "Delete"}
                </button>
                {thread.signal_id ? (
                  <Link href={`/signals/${encodeURIComponent(thread.signal_id)}`} style={ghost}>
                    Signal
                  </Link>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}
