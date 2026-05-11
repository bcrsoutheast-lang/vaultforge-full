"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import VaultForgeMemberNav from "../../components/VaultForgeMemberNav";

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

function getStoredEmail() {
  if (typeof window === "undefined") return "";

  const url = new URL(window.location.href);
  const fromUrl = cleanEmail(url.searchParams.get("email"));
  if (fromUrl.includes("@")) return fromUrl;

  const keys = ["vf_email", "vf_member_email", "vf_admin_email", "email", "member_email", "memberEmail"];
  for (const key of keys) {
    const value = cleanEmail(window.localStorage.getItem(key));
    if (value.includes("@")) return value;
  }

  return cleanEmail(readCookie("vf_email") || readCookie("vf_admin_email") || readCookie("vf_member_email"));
}

function isOwner(email: string) {
  return email === OWNER_EMAIL || readCookie("vf_admin") === "1" || readCookie("isAdmin") === "true";
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

function messageBody(message: Message) {
  return first(message.body, message.message, message.text, message.note, message.content, "No message body.");
}

function messageSubject(message: Message) {
  return first(message.subject, message.title, "VaultForge message");
}

function fromEmail(message: Message) {
  return cleanEmail(message.from_email || message.sender_email || message.email || message.member_email || message.created_by_email);
}

function toEmail(message: Message) {
  return cleanEmail(message.to_email || message.recipient_email || message.target_email || message.owner_email || message.visible_to_email);
}

function signalIdOf(message: Message) {
  return first(message.signal_id, message.related_signal_id, message.alert_id, message.metadata?.signal_id);
}

function itemIdOf(message: Message) {
  return first(message.item_id, message.deal_id, message.project_id, message.pain_id, message.metadata?.item_id);
}

async function safeJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(232,196,107,.14), transparent 30%), radial-gradient(circle at bottom right, rgba(148,163,184,.10), transparent 30%), linear-gradient(180deg,#030509,#071326 55%,#030509)",
  color: "white",
  padding: "28px 18px 90px",
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
};

const shell: React.CSSProperties = { maxWidth: 1060, margin: "0 auto" };

const panel: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.24)",
  borderRadius: 28,
  background: "linear-gradient(135deg,rgba(20,18,12,.9),rgba(8,14,28,.92))",
  boxShadow: "0 24px 90px rgba(0,0,0,.35)",
  padding: 24,
  marginBottom: 18,
};

const eyebrow: React.CSSProperties = {
  color: "#e8c46b",
  letterSpacing: ".26em",
  textTransform: "uppercase",
  fontWeight: 900,
  fontSize: 12,
};

const muted: React.CSSProperties = { color: "rgba(255,255,255,.68)", lineHeight: 1.55 };

const chip: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  border: "1px solid rgba(232,196,107,.24)",
  color: "#f8e7b0",
  background: "rgba(232,196,107,.07)",
  borderRadius: 999,
  padding: "7px 10px",
  fontWeight: 850,
  fontSize: 12,
  margin: "0 7px 7px 0",
};

const button: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 46,
  padding: "0 16px",
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,.14)",
  color: "white",
  textDecoration: "none",
  fontWeight: 900,
  background: "rgba(255,255,255,.06)",
  cursor: "pointer",
};

const goldButton: React.CSSProperties = {
  ...button,
  color: "#111827",
  background: "linear-gradient(135deg,#f8e7b0,#e8c46b)",
  border: "1px solid rgba(232,196,107,.6)",
};

const textarea: React.CSSProperties = {
  width: "100%",
  minHeight: 140,
  borderRadius: 18,
  border: "1px solid rgba(255,255,255,.14)",
  background: "rgba(255,255,255,.065)",
  color: "white",
  padding: 16,
  fontSize: 15,
  resize: "vertical",
  boxSizing: "border-box",
};

export default function MessageThreadPage() {
  const params = useParams();
  const threadId = decodeURIComponent(String(params?.threadId || ""));

  const [email, setEmail] = useState("");
  const [owner, setOwner] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("Loading thread...");
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);

  const latest = useMemo(() => messages[messages.length - 1] || {}, [messages]);
  const firstMessage = useMemo(() => messages[0] || {}, [messages]);

  const otherEmail = useMemo(() => {
    const active = email.toLowerCase();
    const found =
      messages.find((message) => fromEmail(message) && fromEmail(message) !== active) ||
      messages.find((message) => toEmail(message) && toEmail(message) !== active) ||
      firstMessage;

    const from = fromEmail(found);
    const to = toEmail(found);

    if (from && from !== active) return from;
    if (to && to !== active) return to;
    return OWNER_EMAIL;
  }, [messages, email, firstMessage]);

  const signalId = signalIdOf(latest) || signalIdOf(firstMessage);
  const itemId = itemIdOf(latest) || itemIdOf(firstMessage);
  const subject = messageSubject(latest) || messageSubject(firstMessage);

  async function loadThread() {
    if (!threadId) return;

    const activeEmail = getStoredEmail();
    const ownerView = isOwner(activeEmail);

    setEmail(activeEmail);
    setOwner(ownerView);
    setLoading(true);
    setStatus("Loading thread...");

    if (!activeEmail) {
      setMessages([]);
      setStatus("Login email not found. Please log in again.");
      setLoading(false);
      return;
    }

    try {
      const ownerParam = ownerView ? "&owner=1" : "";
      const response = await fetch(
        `/api/messages/thread?threadId=${encodeURIComponent(threadId)}&thread_id=${encodeURIComponent(threadId)}&email=${encodeURIComponent(activeEmail)}${ownerParam}`,
        {
          cache: "no-store",
          headers: {
            "x-vf-email": activeEmail,
            "x-vf-admin": ownerView ? "1" : "0",
          },
        }
      );

      const data = await safeJson(response);

      if (!response.ok || data?.ok === false) {
        throw new Error(data?.error || data?.details || "Thread load failed.");
      }

      const rows = Array.isArray(data.messages) ? data.messages : [];
      setMessages(rows);
      setStatus(rows.length ? "" : "No messages found in this thread yet.");
    } catch (error: any) {
      setMessages([]);
      setStatus(error?.message || "Thread load failed.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadThread();
  }, [threadId]);

  async function sendReply() {
    const text = reply.trim();

    if (!text) {
      setStatus("Write a reply first.");
      return;
    }

    if (!threadId || !email) {
      setStatus("Thread or login email missing.");
      return;
    }

    setSending(true);
    setStatus("Saving reply...");

    try {
      const response = await fetch("/api/messages/new", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-vf-email": email,
          "x-vf-admin": owner ? "1" : "0",
        },
        body: JSON.stringify({
          from_email: email,
          sender_email: email,
          to_email: otherEmail,
          recipient_email: otherEmail,
          subject: subject || "VaultForge message reply",
          body: text,
          message: text,
          thread_id: threadId,
          signal_id: signalId || "",
          item_id: itemId || "",
          deal_id: itemId || "",
          source: "messages_thread_reply",
        }),
      });

      const data = await safeJson(response);

      if (!response.ok || data?.ok === false) {
        throw new Error(data?.error || data?.details || "Reply could not be saved.");
      }

      setReply("");
      setStatus("Reply saved to thread.");
      await loadThread();
    } catch (error: any) {
      setStatus(error?.message || "Reply could not be saved.");
    } finally {
      setSending(false);
    }
  }

  return (
    <main style={page}>
      <style>{`
        a:hover, button:hover { transform: translateY(-1px); transition: all .18s ease; filter: brightness(1.06); }
        textarea::placeholder { color: rgba(255,255,255,.48); }
        @media (max-width: 760px) { .vf-actions { display: grid !important; grid-template-columns: 1fr !important; } .vf-actions > * { width: 100%; box-sizing: border-box; } }
      `}</style>

      <div style={shell}>
        <VaultForgeMemberNav title="Message Thread" subtitle="Controlled conversation tied to signals, projects, and execution" />

        <section style={panel}>
          <div style={eyebrow}>VaultForge Message Thread</div>
          <h1 style={{ fontSize: "clamp(44px,9vw,82px)", lineHeight: .9, margin: "12px 0 18px", letterSpacing: "-.06em" }}>
            Execution conversation.
          </h1>
          <p style={{ ...muted, fontSize: 19, maxWidth: 780 }}>
            Controlled owner/member thread for requests, replies, routing updates, and introductions before private contact details are released.
          </p>

          <div style={{ marginTop: 16 }}>
            <span style={chip}>Signed in: {email || "unknown"}</span>
            <span style={chip}>{owner ? "Owner/Admin View" : "Member View"}</span>
            <span style={chip}>Thread: {threadId || "loading"}</span>
            <span style={chip}>With: {otherEmail || "unknown"}</span>
            {signalId ? <span style={chip}>Signal: {signalId}</span> : null}
            {itemId ? <span style={chip}>Item: {itemId}</span> : null}
          </div>

          <div className="vf-actions" style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 16 }}>
            <button type="button" style={goldButton} onClick={loadThread}>{loading ? "Refreshing..." : "Refresh Thread"}</button>
            <Link href="/messages" style={button}>All Messages</Link>
            {signalId ? <Link href={`/signals/${encodeURIComponent(signalId)}`} style={button}>Signal Room</Link> : null}
            <Link href="/signals" style={button}>Signals</Link>
            <Link href="/pain-feed" style={button}>Pain Feed</Link>
            <Link href="/dashboard" style={button}>Dashboard</Link>
          </div>
        </section>

        {status ? (
          <section style={panel}>
            <p style={{ ...muted, margin: 0 }}>{status}</p>
          </section>
        ) : null}

        <section style={panel}>
          <div style={eyebrow}>Thread Messages</div>
          <div style={{ display: "grid", gap: 14, marginTop: 18 }}>
            {messages.map((message, index) => {
              const sender = fromEmail(message);
              const mine = sender && sender === email;

              return (
                <article
                  key={`${message._source_table || "msg"}-${message.id || index}-${message.created_at || index}`}
                  style={{
                    maxWidth: 760,
                    justifySelf: mine ? "end" : "start",
                    border: "1px solid rgba(255,255,255,.12)",
                    borderRadius: 24,
                    background: mine ? "rgba(232,196,107,.10)" : "rgba(255,255,255,.055)",
                    padding: 18,
                  }}
                >
                  <strong style={{ color: mine ? "#f8e7b0" : "#fff" }}>{messageSubject(message)}</strong>
                  <p style={{ ...muted, margin: "8px 0 12px", fontSize: 16 }}>{messageBody(message)}</p>
                  <div>
                    <span style={chip}>From: {sender || "unknown"}</span>
                    <span style={chip}>To: {toEmail(message) || "unknown"}</span>
                    <span style={chip}>{fmtDate(message.created_at || message.updated_at)}</span>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section style={panel}>
          <div style={eyebrow}>Reply</div>
          <textarea
            style={{ ...textarea, marginTop: 16 }}
            value={reply}
            onChange={(event) => setReply(event.target.value)}
            placeholder="Write a controlled VaultForge reply..."
          />
          <div className="vf-actions" style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 14 }}>
            <button type="button" style={goldButton} onClick={sendReply} disabled={sending || !reply.trim()}>
              {sending ? "Saving..." : "Send Reply"}
            </button>
            <Link href="/messages" style={button}>Back to Inbox</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
