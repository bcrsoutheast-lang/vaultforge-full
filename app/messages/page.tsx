"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";

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

function getEmail(urlEmail = "") {
  const direct = cleanEmail(urlEmail);
  if (direct.includes("@")) return direct;
  if (typeof window === "undefined") return "";
  return cleanEmail(
    localStorage.getItem("vf_email") ||
      sessionStorage.getItem("vf_email") ||
      readCookie("vf_email") ||
      readCookie("vf_member_email") ||
      readCookie("vf_admin_email")
  );
}

function fmt(value: unknown) {
  const date = new Date(String(value || ""));
  if (Number.isNaN(date.getTime())) return "Recent";
  return date.toLocaleString();
}

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(232,196,107,.13), transparent 30%), linear-gradient(180deg,#020303,#071326 55%,#020303)",
  color: "white",
  padding: "22px 16px 82px",
  fontFamily: "Arial, sans-serif",
};
const wrap: React.CSSProperties = { width: "min(980px,100%)", margin: "0 auto" };
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

export default function SimpleThreadPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const threadId = decodeURIComponent(String(params?.threadId || ""));

  const [email, setEmail] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [reply, setReply] = useState("");
  const [status, setStatus] = useState("Loading thread...");
  const [busy, setBusy] = useState(false);
  const [cleanupBusy, setCleanupBusy] = useState(false);

  async function load() {
    const viewer = getEmail(searchParams.get("email") || "");
    setEmail(viewer);
    setStatus("Loading thread...");

    try {
      const query = new URLSearchParams();
      query.set("thread_id", threadId);
      query.set("email", viewer);
      query.set("include_archived", "1");

      const res = await fetch(`/api/simple-messages?${query.toString()}`, {
        cache: "no-store",
        headers: { "x-vf-email": viewer },
      });

      const data = await safeJson(res);

      if (!res.ok || data?.ok === false) throw new Error(data?.error || "Could not load thread.");

      setMessages(Array.isArray(data.messages) ? data.messages : []);
      setStatus("");
    } catch (error: any) {
      setStatus(error?.message || "Could not load thread.");
      setMessages([]);
    }
  }

  async function cleanup(action: "archive" | "restore" | "delete") {
    setCleanupBusy(true);
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

      if (action === "delete") {
        window.location.href = "/messages";
        return;
      }

      await load();
    } catch (error: any) {
      setStatus(error?.message || `Could not ${action} thread.`);
    } finally {
      setCleanupBusy(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId]);

  const latest = messages[messages.length - 1] || {};
  const archived = messages.length > 0 && messages.every((message) => clean(message.status) === "archived");

  const otherEmail = useMemo(() => {
    return cleanEmail(
      messages.find((message) => cleanEmail(message.from_email) && cleanEmail(message.from_email) !== cleanEmail(email))?.from_email ||
        messages.find((message) => cleanEmail(message.to_email) && cleanEmail(message.to_email) !== cleanEmail(email))?.to_email ||
        latest.to_email ||
        ""
    );
  }, [messages, email, latest]);

  async function sendReply() {
    if (!reply.trim()) return;
    setBusy(true);
    setStatus("");

    try {
      const res = await fetch("/api/simple-messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-vf-email": email },
        body: JSON.stringify({
          thread_id: threadId,
          from_email: email,
          to_email: otherEmail,
          signal_id: latest.signal_id || "",
          item_id: latest.item_id || "",
          subject: latest.subject || "VaultForge reply",
          body: reply,
        }),
      });

      const data = await safeJson(res);

      if (!res.ok || data?.ok === false) throw new Error(data?.error || "Reply could not be saved.");

      setReply("");
      await load();
    } catch (error: any) {
      setStatus(error?.message || "Reply could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={page}>
      <style>{`
        a:hover, button:hover {
          transform: translateY(-1px);
          transition: all .18s ease;
          filter: brightness(1.06);
        }

        textarea::placeholder {
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
          <p style={eyebrow}>VaultForge Simple Thread</p>
          <h1 style={{ fontSize: "clamp(48px,11vw,86px)", lineHeight: 0.9, margin: "10px 0 18px" }}>
            Conversation.
          </h1>
          <p style={muted}>You: {email || "unknown"} · With: {otherEmail || "unknown"}</p>
          <p style={muted}>Thread status: {archived ? "Archived" : clean(latest.status || "open")}</p>

          <div className="vf-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
            <button type="button" onClick={load} style={btn}>Refresh</button>
            <Link href="/messages" style={ghost}>Inbox</Link>
            <Link href="/pain-feed" style={ghost}>Pain Feed</Link>
            {latest.signal_id ? <Link href={`/signals/${encodeURIComponent(latest.signal_id)}`} style={ghost}>Signal</Link> : null}
            {archived ? (
              <button type="button" disabled={cleanupBusy} onClick={() => cleanup("restore")} style={ghost}>
                {cleanupBusy ? "Working..." : "Restore Thread"}
              </button>
            ) : (
              <button type="button" disabled={cleanupBusy} onClick={() => cleanup("archive")} style={ghost}>
                {cleanupBusy ? "Working..." : "Archive Thread"}
              </button>
            )}
            <button type="button" disabled={cleanupBusy} onClick={() => cleanup("delete")} style={danger}>
              {cleanupBusy ? "Working..." : "Delete Thread"}
            </button>
          </div>
        </section>

        {status ? <section style={card}>{status}</section> : null}

        <section style={card}>
          <p style={eyebrow}>Messages</p>
          {messages.length === 0 ? <p style={muted}>No messages yet.</p> : null}
          {messages.map((message) => {
            const mine = cleanEmail(message.from_email) === cleanEmail(email);
            return (
              <article
                key={message.id}
                style={{
                  border: "1px solid rgba(255,255,255,.12)",
                  background: mine ? "rgba(232,196,107,.12)" : "rgba(255,255,255,.05)",
                  borderRadius: 20,
                  padding: 16,
                  marginBottom: 12,
                  marginLeft: mine ? 30 : 0,
                  marginRight: mine ? 0 : 30,
                  opacity: message.status === "archived" ? 0.72 : 1,
                }}
              >
                <strong>{message.subject}</strong>
                <p style={muted}>{message.body}</p>
                <p style={{ color: "#94a3b8", fontSize: 13 }}>
                  From {message.from_email} to {message.to_email} · {fmt(message.created_at)} · {message.status || "open"}
                </p>
              </article>
            );
          })}
        </section>

        {!archived ? (
          <section style={card}>
            <p style={eyebrow}>Reply</p>
            <textarea
              value={reply}
              onChange={(event) => setReply(event.target.value)}
              style={{ ...input, minHeight: 150 }}
              placeholder="Write a reply..."
            />
            <button
              type="button"
              disabled={busy || !reply.trim()}
              onClick={sendReply}
              style={{ ...btn, width: "100%", marginTop: 16, opacity: busy || !reply.trim() ? 0.55 : 1 }}
            >
              {busy ? "Saving..." : "Send Reply"}
            </button>
          </section>
        ) : (
          <section style={card}>
            <p style={muted}>This thread is archived. Restore it before replying.</p>
          </section>
        )}
      </div>
    </main>
  );
}
