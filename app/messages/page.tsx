"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import VaultForgeMemberNav from "../../components/VaultForgeMemberNav";

type Message = Record<string, any>;

type PageProps = { params: Promise<{ threadId: string }> | { threadId: string } };

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
  const fromUrl = cleanEmail(url.searchParams.get("email"));
  if (fromUrl.includes("@")) return fromUrl;

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

function fromEmailOf(row: Message) {
  return cleanEmail(row.from_email || row.sender_email || row.email || row.member_email);
}

function toEmailOf(row: Message) {
  return cleanEmail(row.to_email || row.recipient_email || row.target_email || row.owner_email);
}

function subjectOf(row: Message) {
  return first(row.subject, row.title, "VaultForge message");
}

function bodyOf(row: Message) {
  return first(row.body, row.message, row.note, row.description, "No message body.");
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

const shell: React.CSSProperties = { maxWidth: 1050, margin: "0 auto" };

const card: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.28)",
  borderRadius: 28,
  background:
    "linear-gradient(135deg,rgba(45,35,24,.86),rgba(12,19,32,.92) 55%,rgba(3,5,9,.95))",
  boxShadow: "0 24px 90px rgba(0,0,0,.35)",
  padding: 28,
  marginBottom: 24,
};

const h1: React.CSSProperties = {
  fontSize: "clamp(48px,9vw,96px)",
  lineHeight: 0.9,
  margin: "12px 0 20px",
  letterSpacing: "-0.075em",
};

const eyebrow: React.CSSProperties = {
  color: "#e8c46b",
  letterSpacing: ".28em",
  textTransform: "uppercase",
  fontWeight: 900,
  fontSize: 13,
};

const muted: React.CSSProperties = {
  color: "rgba(255,255,255,.68)",
  lineHeight: 1.55,
};

const button: React.CSSProperties = {
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
  background: "rgba(255,255,255,.07)",
  cursor: "pointer",
};

const goldButton: React.CSSProperties = {
  ...button,
  color: "#08111f",
  background: "linear-gradient(135deg,#fff1a8,#e8c46b)",
  border: 0,
};

const textarea: React.CSSProperties = {
  width: "100%",
  minHeight: 160,
  borderRadius: 18,
  border: "1px solid rgba(255,255,255,.16)",
  background: "rgba(255,255,255,.08)",
  color: "white",
  padding: 18,
  fontSize: 16,
  outline: "none",
  boxSizing: "border-box",
  resize: "vertical",
};

export default function MessageThreadPage({ params }: PageProps) {
  const [threadId, setThreadId] = useState("");
  const [email, setEmail] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [reply, setReply] = useState("");
  const [toast, setToast] = useState("");

  useEffect(() => {
    Promise.resolve(params as any).then((resolved) => setThreadId(String(resolved?.threadId || "")));
  }, [params]);

  const latest = useMemo(() => messages[messages.length - 1] || {}, [messages]);

  const otherEmail = useMemo(() => {
    const active = cleanEmail(email);
    const found =
      messages.find((message) => fromEmailOf(message) && fromEmailOf(message) !== active) ||
      messages.find((message) => toEmailOf(message) && toEmailOf(message) !== active);

    if (!found) return OWNER_EMAIL;

    const from = fromEmailOf(found);
    const to = toEmailOf(found);

    if (from && from !== active) return from;
    if (to && to !== active) return to;
    return OWNER_EMAIL;
  }, [messages, email]);

  async function load(activeThread = threadId, nextEmail = email) {
    if (!activeThread) return;

    const activeEmail = cleanEmail(nextEmail || getStoredEmail());
    setEmail(activeEmail);
    setLoading(true);
    setError("");

    try {
      const owner = activeEmail === OWNER_EMAIL ? "&owner=1" : "";
      const res = await fetch(
        `/api/messages/thread?threadId=${encodeURIComponent(activeThread)}&thread_id=${encodeURIComponent(activeThread)}&email=${encodeURIComponent(activeEmail)}${owner}`,
        {
          cache: "no-store",
          headers: {
            "x-vf-email": activeEmail,
            "x-vf-admin": activeEmail === OWNER_EMAIL ? "1" : "0",
          },
        }
      );

      const json = await res.json().catch(() => ({}));

      if (!res.ok || json?.ok === false) {
        throw new Error(json?.error || json?.details || "Thread load failed.");
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
    if (threadId) load(threadId, getStoredEmail());
  }, [threadId]);

  async function sendReply() {
    const text = reply.trim();
    if (!text || !threadId || !email) return;

    setSending(true);
    setToast("");

    try {
      const res = await fetch("/api/messages/new", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-vf-email": email,
        },
        body: JSON.stringify({
          from_email: email,
          to_email: otherEmail,
          subject: subjectOf(latest) || "VaultForge message reply",
          body: text,
          message: text,
          thread_id: threadId,
          signal_id: latest.signal_id || "",
          item_id: latest.item_id || "",
          source: "message_thread_reply",
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok || json?.ok === false) {
        throw new Error(json?.error || json?.details || "Reply could not be saved.");
      }

      setReply("");
      setToast("Reply saved to thread.");
      await load(threadId, email);
    } catch (err: any) {
      setToast(err?.message || String(err));
    } finally {
      setSending(false);
    }
  }

  return (
    <main style={page}>
      <style>{`
        a:hover,
        button:hover {
          transform: translateY(-1px);
          transition: all .18s ease;
          filter: brightness(1.05);
        }

        textarea::placeholder {
          color: rgba(255,255,255,.42);
        }

        @media (max-width: 760px) {
          .vf-thread-actions {
            display: grid !important;
            grid-template-columns: 1fr !important;
          }

          .vf-thread-actions > * {
            width: 100%;
            box-sizing: border-box;
          }
        }
      `}</style>

      <div style={shell}>
        <VaultForgeMemberNav title="Message Thread" subtitle="Controlled owner/member communication before private contact is released." />

        <section style={card}>
          <div style={eyebrow}>VaultForge Message Thread</div>
          <h1 style={h1}>Execution conversation.</h1>
          <p style={{ ...muted, maxWidth: 760, fontSize: 20 }}>
            Controlled thread for requests, owner replies, routing updates, and introductions.
          </p>

          <div className="vf-thread-actions" style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 22 }}>
            <span style={button}>Signed in: {email || "not detected"}</span>
            <span style={button}>Thread: {threadId || "loading"}</span>
            <button type="button" style={goldButton} onClick={() => load(threadId, email)}>
              Refresh Thread
            </button>
            <Link href="/messages" style={button}>All Messages</Link>
            <Link href="/signals" style={button}>Signals</Link>
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
            <div style={eyebrow}>Thread Messages</div>
            <div style={{ display: "grid", gap: 14, marginTop: 20 }}>
              {messages.map((message, index) => {
                const mine = fromEmailOf(message) === cleanEmail(email);

                return (
                  <article
                    key={`${message._source_table || "msg"}-${message.id || index}-${message.created_at || index}`}
                    style={{
                      maxWidth: 760,
                      justifySelf: mine ? "end" : "start",
                      border: mine ? "1px solid rgba(232,196,107,.36)" : "1px solid rgba(255,255,255,.12)",
                      borderRadius: 24,
                      background: mine ? "rgba(232,196,107,.11)" : "rgba(255,255,255,.06)",
                      padding: 20,
                    }}
                  >
                    <strong>{subjectOf(message)}</strong>
                    <p style={{ ...muted, margin: "8px 0 12px" }}>{bodyOf(message)}</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      <span style={{ ...button, minHeight: 32, padding: "0 10px", fontSize: 12 }}>
                        From: {fromEmailOf(message) || "unknown"}
                      </span>
                      <span style={{ ...button, minHeight: 32, padding: "0 10px", fontSize: 12 }}>
                        {fmtDate(message.created_at)}
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        <section style={card}>
          <div style={eyebrow}>Reply</div>
          <div style={{ display: "grid", gap: 14, marginTop: 18 }}>
            <textarea
              style={textarea}
              value={reply}
              onChange={(event) => setReply(event.target.value)}
              placeholder="Write a controlled VaultForge reply..."
            />
            <button type="button" style={goldButton} onClick={sendReply} disabled={sending || !reply.trim()}>
              {sending ? "Saving..." : "Send Reply"}
            </button>
            {toast ? <p style={muted}>{toast}</p> : null}
          </div>
        </section>
      </div>
    </main>
  );
}
