"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import VaultForgeMemberNav from "../components/VaultForgeMemberNav";

type Message = Record<string, any>;
type Thread = {
  thread_id: string;
  subject: string;
  preview: string;
  last_message_at: string;
  count: number;
  from_email: string;
  to_email: string;
  other_email: string;
  signal_id: string;
  item_id: string;
  status: string;
  source_table?: string;
};

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

function messageThreadId(message: Message) {
  return first(
    message.thread_id,
    message.threadId,
    message.conversation_id,
    message.id,
    [message.signal_id, message.item_id, message.subject].filter(Boolean).join("-")
  );
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

function normalizeThreads(messages: Message[], activeEmail: string): Thread[] {
  const byThread = new Map<string, Message[]>();

  for (const message of messages) {
    const threadId = messageThreadId(message);
    if (!threadId) continue;
    const list = byThread.get(threadId) || [];
    list.push(message);
    byThread.set(threadId, list);
  }

  const threads: Thread[] = [];

  for (const [threadId, list] of byThread.entries()) {
    const sorted = [...list].sort(
      (a, b) => new Date(first(a.created_at, a.updated_at, 0)).getTime() - new Date(first(b.created_at, b.updated_at, 0)).getTime()
    );
    const firstMessage = sorted[0] || {};
    const latest = sorted[sorted.length - 1] || {};
    const from = fromEmail(latest) || fromEmail(firstMessage);
    const to = toEmail(latest) || toEmail(firstMessage);
    const other = from && from !== activeEmail ? from : to && to !== activeEmail ? to : fromEmail(firstMessage) || toEmail(firstMessage) || OWNER_EMAIL;

    threads.push({
      thread_id: threadId,
      subject: messageSubject(latest) || messageSubject(firstMessage),
      preview: messageBody(latest),
      last_message_at: first(latest.created_at, latest.updated_at, firstMessage.created_at, new Date().toISOString()),
      count: sorted.length,
      from_email: from,
      to_email: to,
      other_email: other,
      signal_id: signalIdOf(latest) || signalIdOf(firstMessage),
      item_id: itemIdOf(latest) || itemIdOf(firstMessage),
      status: first(latest.status, firstMessage.status, "active"),
      source_table: first(latest._source_table, firstMessage._source_table),
    });
  }

  return threads.sort((a, b) => new Date(b.last_message_at || 0).getTime() - new Date(a.last_message_at || 0).getTime());
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

const shell: React.CSSProperties = { maxWidth: 1160, margin: "0 auto" };

const panel: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.24)",
  borderRadius: 28,
  background: "linear-gradient(135deg,rgba(20,18,12,.9),rgba(8,14,28,.92))",
  boxShadow: "0 24px 90px rgba(0,0,0,.35)",
  padding: 24,
  marginBottom: 18,
};

const card: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.12)",
  borderRadius: 24,
  background: "rgba(255,255,255,.045)",
  padding: 18,
  textDecoration: "none",
  color: "white",
  display: "block",
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

const input: React.CSSProperties = {
  width: "100%",
  minHeight: 50,
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,.14)",
  background: "rgba(255,255,255,.065)",
  color: "white",
  padding: "0 16px",
  fontSize: 15,
  boxSizing: "border-box",
};

export default function MessagesPage() {
  const [email, setEmail] = useState("");
  const [owner, setOwner] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState("Loading messages...");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  async function loadMessages() {
    const activeEmail = getStoredEmail();
    const ownerView = isOwner(activeEmail);

    setEmail(activeEmail);
    setOwner(ownerView);
    setLoading(true);
    setStatus("Loading messages...");

    if (!activeEmail) {
      setMessages([]);
      setStatus("Login email not found. Please log in again.");
      setLoading(false);
      return;
    }

    try {
      const ownerParam = ownerView ? "&owner=1" : "";
      const response = await fetch(`/api/messages/thread?email=${encodeURIComponent(activeEmail)}${ownerParam}`, {
        cache: "no-store",
        headers: {
          "x-vf-email": activeEmail,
          "x-vf-admin": ownerView ? "1" : "0",
        },
      });

      const data = await safeJson(response);

      if (!response.ok || data?.ok === false) {
        throw new Error(data?.error || data?.details || "Could not load messages.");
      }

      const rows = Array.isArray(data.messages)
        ? data.messages
        : Array.isArray(data.threads)
        ? data.threads
        : [];

      setMessages(rows);
      setStatus(rows.length ? "" : "No messages yet. Requests and replies will appear here.");
    } catch (error: any) {
      setMessages([]);
      setStatus(error?.message || "Could not load messages.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMessages();
  }, []);

  const threads = useMemo(() => normalizeThreads(messages, email), [messages, email]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return threads;

    return threads.filter((thread) =>
      [thread.subject, thread.preview, thread.other_email, thread.signal_id, thread.item_id, thread.status]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [threads, search]);

  const signalLinked = threads.filter((thread) => thread.signal_id).length;
  const direct = threads.length - signalLinked;

  return (
    <main style={page}>
      <style>{`
        a:hover, button:hover { transform: translateY(-1px); transition: all .18s ease; filter: brightness(1.06); }
        input::placeholder { color: rgba(255,255,255,.48); }
        @media (max-width: 760px) { .vf-actions { display: grid !important; grid-template-columns: 1fr !important; } .vf-actions > * { width: 100%; box-sizing: border-box; } }
      `}</style>

      <div style={shell}>
        <VaultForgeMemberNav title="Messages" subtitle="Controlled owner, member, routing, and signal conversations" />

        <section style={panel}>
          <div style={eyebrow}>VaultForge Message Center</div>
          <h1 style={{ fontSize: "clamp(46px,9vw,86px)", lineHeight: .9, margin: "12px 0 18px", letterSpacing: "-.06em" }}>
            Controlled communication.
          </h1>
          <p style={{ ...muted, fontSize: 19, maxWidth: 780 }}>
            Every request, owner reply, intro, and routing conversation should live in one organized thread system.
          </p>

          <div style={{ marginTop: 16 }}>
            <span style={chip}>Signed in: {email || "unknown"}</span>
            <span style={chip}>{owner ? "Owner/Admin View" : "Member View"}</span>
            <span style={chip}>Threads: {threads.length}</span>
            <span style={chip}>Signal-linked: {signalLinked}</span>
            <span style={chip}>Direct: {direct}</span>
          </div>

          <div className="vf-actions" style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 16 }}>
            <button type="button" style={goldButton} onClick={loadMessages}>{loading ? "Refreshing..." : "Refresh Messages"}</button>
            <Link href="/signals" style={button}>Signals</Link>
            <Link href="/pain-feed" style={button}>Pain Feed</Link>
            <Link href="/projects" style={button}>Projects</Link>
            <Link href="/routing-inbox" style={button}>Routing</Link>
            <Link href="/dashboard" style={button}>Dashboard</Link>
          </div>
        </section>

        <section style={panel}>
          <div style={eyebrow}>Search Threads</div>
          <input
            style={input}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search subject, owner, signal id, project id, message preview..."
          />
        </section>

        {status ? (
          <section style={panel}>
            <p style={{ ...muted, margin: 0 }}>{status}</p>
          </section>
        ) : null}

        <section style={{ display: "grid", gap: 14 }}>
          {filtered.map((thread) => (
            <Link key={thread.thread_id} href={`/messages/${encodeURIComponent(thread.thread_id)}`} style={card}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
                <div style={{ minWidth: 0, flex: "1 1 420px" }}>
                  <div style={eyebrow}>{thread.signal_id ? "Signal Conversation" : "Direct Conversation"}</div>
                  <h2 style={{ fontSize: 28, lineHeight: 1.08, margin: "8px 0 10px" }}>{thread.subject}</h2>
                  <p style={{ ...muted, fontSize: 16, margin: 0 }}>{thread.preview}</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <strong style={{ color: "#f8e7b0", fontSize: 24 }}>{thread.count}</strong>
                  <p style={{ ...muted, margin: "4px 0 0", fontSize: 13 }}>messages</p>
                </div>
              </div>

              <div style={{ marginTop: 14 }}>
                <span style={chip}>With: {thread.other_email || "unknown"}</span>
                {thread.signal_id ? <span style={chip}>Signal: {thread.signal_id}</span> : null}
                {thread.item_id ? <span style={chip}>Item: {thread.item_id}</span> : null}
                <span style={chip}>Updated: {fmtDate(thread.last_message_at)}</span>
              </div>

              <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 8 }}>
                <span style={{ ...button, minHeight: 36, padding: "0 12px", fontSize: 13 }}>Open Thread →</span>
                {thread.signal_id ? <span style={{ ...button, minHeight: 36, padding: "0 12px", fontSize: 13 }}>Signal Room Available</span> : null}
              </div>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}
