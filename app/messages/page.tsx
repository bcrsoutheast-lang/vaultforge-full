"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";

type Message = Record<string, any>;

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

function getStoredEmail(urlEmail = "") {
  const direct = cleanEmail(urlEmail);
  if (direct.includes("@")) return direct;

  if (typeof window === "undefined") return "";

  const params = new URLSearchParams(window.location.search);
  const queryEmail = cleanEmail(params.get("email") || params.get("from") || params.get("viewer") || "");
  if (queryEmail.includes("@")) return queryEmail;

  const keys = ["vf_email", "vf_member_email", "vf_admin_email", "email", "memberEmail", "vf_member"];

  for (const key of keys) {
    try {
      const localValue = cleanEmail(window.localStorage.getItem(key));
      if (localValue.includes("@")) return localValue;

      const sessionValue = cleanEmail(window.sessionStorage.getItem(key));
      if (sessionValue.includes("@")) return sessionValue;
    } catch {
      // Continue.
    }
  }

  return cleanEmail(
    readCookie("vf_email") ||
      readCookie("vf_member_email") ||
      readCookie("vf_admin_email") ||
      readCookie("email")
  );
}

function first(...values: unknown[]) {
  for (const value of values) {
    const text = clean(value);
    if (text) return text;
  }
  return "";
}

function fmtDate(value: unknown) {
  const date = new Date(String(value || ""));
  if (Number.isNaN(date.getTime())) return "Recent";
  return date.toLocaleString();
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

const shell: React.CSSProperties = { width: "min(1080px,100%)", margin: "0 auto" };
const card: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.28)",
  borderRadius: 30,
  padding: 24,
  background: "linear-gradient(135deg,rgba(255,255,255,.075),rgba(255,255,255,.026))",
  boxShadow: "0 28px 90px rgba(0,0,0,.38)",
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
const muted: React.CSSProperties = { color: "#cbd5e1", lineHeight: 1.55 };
const button: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  color: "white",
  background: "rgba(255,255,255,.055)",
  border: "1px solid rgba(255,255,255,.14)",
  textDecoration: "none",
  borderRadius: 15,
  padding: "12px 15px",
  fontWeight: 850,
  minHeight: 45,
  cursor: "pointer",
};
const goldButton: React.CSSProperties = {
  ...button,
  color: "#101010",
  background: "linear-gradient(135deg,#f8e7b0,#e8c46b)",
  border: "1px solid rgba(232,196,107,.7)",
  fontWeight: 950,
};
const input: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  minHeight: 56,
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,.16)",
  background: "rgba(255,255,255,.07)",
  color: "white",
  padding: "0 16px",
  fontSize: 16,
  outline: "none",
};

export default function MessageThreadPage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const resolvedThreadId = decodeURIComponent(String(params?.threadId || ""));

  const [email, setEmail] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [reply, setReply] = useState("");
  const [toast, setToast] = useState("");

  const latest = useMemo(() => messages[messages.length - 1] || {}, [messages]);

  const otherEmail = useMemo(() => {
    const active = cleanEmail(email);
    const found =
      messages.find((message) => cleanEmail(message.from_email) && cleanEmail(message.from_email) !== active)?.from_email ||
      messages.find((message) => cleanEmail(message.to_email) && cleanEmail(message.to_email) !== active)?.to_email ||
      latest.to_email ||
      latest.recipient_email ||
      latest.owner_email ||
      "";

    return cleanEmail(found);
  }, [messages, email, latest]);

  async function load(activeThread = resolvedThreadId) {
    if (!activeThread) {
      setError("Thread ID missing from URL.");
      setLoading(false);
      return;
    }

    const activeEmail = getStoredEmail(searchParams.get("email") || "");
    setEmail(activeEmail);
    setLoading(true);
    setError("");

    try {
      const query = new URLSearchParams();
      query.set("thread_id", activeThread);
      query.set("threadId", activeThread);
      if (activeEmail) query.set("email", activeEmail);
      if (activeEmail === OWNER_EMAIL) query.set("owner", "1");

      const res = await fetch(`/api/messages/thread?${query.toString()}`, {
        cache: "no-store",
        headers: {
          "x-vf-email": activeEmail,
          "x-vf-admin": activeEmail === OWNER_EMAIL ? "1" : "0",
        },
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok || json?.ok === false) {
        throw new Error(json.error || json.details || "Thread load failed.");
      }

      setMessages(Array.isArray(json.messages) ? json.messages : []);
    } catch (err: any) {
      setError(err?.message || String(err));
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(resolvedThreadId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedThreadId]);

  async function sendReply() {
    const text = reply.trim();
    if (!text || !resolvedThreadId) return;

    const activeEmail = cleanEmail(email || getStoredEmail(searchParams.get("email") || ""));
    const replyTo = otherEmail || cleanEmail(latest.to_email) || cleanEmail(latest.recipient_email) || OWNER_EMAIL;

    if (!activeEmail) {
      setToast("Signed-in email not detected. Go back to the message form or login again.");
      return;
    }

    setSending(true);
    setToast("");

    try {
      const res = await fetch("/api/messages/new", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-vf-email": activeEmail,
        },
        body: JSON.stringify({
          from_email: activeEmail,
          to_email: replyTo,
          recipient_email: replyTo,
          subject: latest.subject || "VaultForge message reply",
          body: text,
          message: text,
          thread_id: resolvedThreadId,
          signal_id: latest.signal_id || latest.metadata?.signal_id || "",
          item_id: latest.item_id || latest.metadata?.item_id || "",
          source: "message_thread_reply",
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok || json?.ok === false) {
        throw new Error(json.error || json.details || "Reply could not be saved.");
      }

      setReply("");
      setToast("Reply saved to thread.");
      await load(resolvedThreadId);
    } catch (err: any) {
      setToast(err?.message || String(err));
    } finally {
      setSending(false);
    }
  }

  const signalId = first(latest.signal_id, latest.metadata?.signal_id);
  const itemId = first(latest.item_id, latest.metadata?.item_id);

  return (
    <main style={page}>
      <style>{`
        a:hover, button:hover { transform: translateY(-1px); transition: all .18s ease; filter: brightness(1.06); }
        textarea::placeholder { color: rgba(255,255,255,.48); }
        @media (max-width: 760px) { a, button { width: 100%; box-sizing: border-box; justify-content: center; } }
      `}</style>

      <div style={shell}>
        <section style={card}>
          <p style={eyebrow}>VaultForge Message Thread</p>
          <h1 style={{ fontSize: "clamp(48px,10vw,84px)", lineHeight: .9, margin: "0 0 18px" }}>
            Execution conversation.
          </h1>
          <p style={{ ...muted, maxWidth: 760, fontSize: 20 }}>
            Controlled thread for requests, owner replies, routing updates, and introductions before private contact details are released.
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 22 }}>
            <span style={button}>Signed in: {email || "not detected"}</span>
            <span style={button}>Thread: {resolvedThreadId || "missing"}</span>
            <span style={button}>With: {otherEmail || "unknown"}</span>
            <button style={goldButton} onClick={() => load(resolvedThreadId)}>Refresh Thread</button>
            <Link href="/messages" style={button}>All Messages</Link>
            {signalId ? <Link href={`/signals/${encodeURIComponent(signalId)}`} style={button}>Signal</Link> : null}
            <Link href="/pain-feed" style={button}>Pain Feed</Link>
            <Link href="/dashboard" style={button}>Dashboard</Link>
          </div>
        </section>

        {loading ? (
          <section style={card}><p style={muted}>Loading thread...</p></section>
        ) : error ? (
          <section style={card}>
            <h2 style={{ color: "#ffd0d0" }}>Thread failed to load.</h2>
            <p style={muted}>{error}</p>
          </section>
        ) : messages.length === 0 ? (
          <section style={card}><p style={muted}>No messages found in this thread yet.</p></section>
        ) : (
          <section style={card}>
            <p style={eyebrow}>Thread Messages</p>
            <div style={{ display: "grid", gap: 14, marginTop: 20 }}>
              {messages.map((message, index) => {
                const mine = cleanEmail(message.from_email) === cleanEmail(email);

                return (
                  <article
                    key={`${message._source_table || "msg"}-${message.id || index}-${message.created_at || index}`}
                    style={{
                      maxWidth: 760,
                      justifySelf: mine ? "end" : "start",
                      border: "1px solid rgba(255,255,255,.12)",
                      borderRadius: 24,
                      background: mine ? "rgba(232,196,107,.13)" : "rgba(255,255,255,.06)",
                      padding: 20,
                    }}
                  >
                    <strong>{message.subject || "VaultForge message"}</strong>
                    <p style={{ ...muted, margin: "8px 0 12px", fontSize: 17 }}>{message.body || message.message || "No message body."}</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      <span style={{ ...button, minHeight: 32, padding: "0 10px", fontSize: 12 }}>From: {message.from_email || "unknown"}</span>
                      <span style={{ ...button, minHeight: 32, padding: "0 10px", fontSize: 12 }}>To: {message.to_email || "unknown"}</span>
                      <span style={{ ...button, minHeight: 32, padding: "0 10px", fontSize: 12 }}>{fmtDate(message.created_at)}</span>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        <section style={card}>
          <p style={eyebrow}>Reply</p>
          <div style={{ display: "grid", gap: 14, marginTop: 18 }}>
            <textarea
              style={{ ...input, minHeight: 160, padding: 18, resize: "vertical" }}
              value={reply}
              onChange={(event) => setReply(event.target.value)}
              placeholder="Write a controlled VaultForge reply..."
            />
            <button style={goldButton} onClick={sendReply} disabled={sending || !reply.trim()}>
              {sending ? "Saving..." : "Send Reply"}
            </button>
            {toast ? <p style={muted}>{toast}</p> : null}
          </div>
        </section>
      </div>
    </main>
  );
}
