"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import VaultForgeMemberNav from "../../components/VaultForgeMemberNav";

type Row = Record<string, any>;

const LOCAL_KEY = "vf_simple_messages_local_v1";

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

function meta(row: Row) {
  return typeof row?.metadata === "object" && row.metadata ? row.metadata : {};
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

  const params = new URLSearchParams(window.location.search || "");
  const queryEmail = lower(params.get("email") || params.get("from") || params.get("from_email"));
  if (queryEmail.includes("@")) return queryEmail;

  const keys = ["vf_email", "vf_member_email", "vf_admin_email", "email", "memberEmail"];

  for (const key of keys) {
    const local = lower(window.localStorage.getItem(key));
    if (local.includes("@")) return local;

    const session = lower(window.sessionStorage.getItem(key));
    if (session.includes("@")) return session;
  }

  return lower(readCookie("vf_email") || readCookie("vf_member_email") || readCookie("vf_admin_email"));
}

function readLocalMessages() {
  if (typeof window === "undefined") return [];

  try {
    const parsed = JSON.parse(window.localStorage.getItem(LOCAL_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocalMessage(row: Row) {
  const existing = readLocalMessages();
  window.localStorage.setItem(LOCAL_KEY, JSON.stringify([row, ...existing].slice(0, 600)));
}

function threadIdOf(row: Row) {
  return first(row.thread_id, row.threadId, meta(row).thread_id);
}

function threadKeyOf(row: Row) {
  return first(row.thread_key, meta(row).thread_key);
}

function titleOf(row: Row) {
  return (
    first(row.subject, row.title, meta(row).subject, "VaultForge message")
      .replace(/^(re:\s*)+/gi, "")
      .replace(/\s+/g, " ")
      .trim() || "VaultForge message"
  );
}

function bodyOf(row: Row) {
  return first(row.message, row.body, row.note, row.content, meta(row).message, "");
}

function fromOf(row: Row) {
  return lower(first(row.from_email, row.sender_email, row.member_email, meta(row).from_email));
}

function toOf(row: Row) {
  return lower(first(row.to_email, row.recipient_email, row.target_email, row.owner_email, meta(row).to_email));
}

function sourceOf(row: Row) {
  return lower(first(row.source, row.message_type, row.type, meta(row).source, "message"));
}

function itemOf(row: Row) {
  return first(row.item_id, row.itemId, row.deal_id, meta(row).item_id);
}

function createdOf(row: Row) {
  return first(row.created_at, row.updated_at, meta(row).created_at);
}

function rowKey(row: Row) {
  const id = first(row.id, meta(row).id);
  if (id) return id;

  return [threadKeyOf(row), threadIdOf(row), fromOf(row), toOf(row), bodyOf(row), createdOf(row)].join("|");
}

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

export default function ThreadPage({ params }: { params: { threadId: string } }) {
  const routeThreadId = decodeURIComponent(params.threadId || "");

  const [email, setEmail] = useState("");
  const [messages, setMessages] = useState<Row[]>([]);
  const [reply, setReply] = useState("");
  const [status, setStatus] = useState("Loading thread...");
  const [busy, setBusy] = useState(false);
  const [threadKey, setThreadKey] = useState("");
  const [toEmail, setToEmail] = useState("");
  const [source, setSource] = useState("message");

  function applyUrlContext() {
    const params = new URLSearchParams(window.location.search || "");

    setThreadKey(first(params.get("thread_key"), ""));
    setToEmail(lower(first(params.get("to"), params.get("recipient_email"), params.get("owner_email"), "")));
    setSource(first(params.get("source"), "message"));

    const nextMessage = first(params.get("message"), params.get("body"), params.get("note"), "");
    if (nextMessage && !reply) setReply(nextMessage);
  }

  async function load() {
    const viewer = currentEmail();
    setEmail(viewer);
    applyUrlContext();
    setStatus("Loading thread...");

    const params = new URLSearchParams(window.location.search || "");
    const activeThreadKey = first(params.get("thread_key"), "");
    const activeThreadId = routeThreadId;

    const localRows = readLocalMessages().filter((row) => {
      if (activeThreadKey) return threadKeyOf(row) === activeThreadKey;
      return threadIdOf(row) === activeThreadId;
    });

    let apiRows: Row[] = [];

    try {
      const res = await fetch(`/api/simple-messages?email=${encodeURIComponent(viewer)}`, {
        cache: "no-store",
        headers: { "x-vf-email": viewer },
      });

      const data = await safeJson(res);
      const rows = Array.isArray(data.messages) ? data.messages : [];

      apiRows = rows.filter((row: Row) => {
        if (activeThreadKey) return threadKeyOf(row) === activeThreadKey;
        return threadIdOf(row) === activeThreadId;
      });
    } catch {
      apiRows = [];
    }

    const seen = new Set<string>();
    const unique = [...localRows, ...apiRows].filter((row) => {
      const key = rowKey(row);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    unique.sort((a, b) => clean(createdOf(a)).localeCompare(clean(createdOf(b))));

    setMessages(unique);
    setStatus(unique.length ? "" : "No messages in this conversation yet. Write and send below.");
  }

  useEffect(() => {
    load();
  }, [routeThreadId]);

  const firstMessage = useMemo(() => messages[0] || {}, [messages]);

  async function sendMessage() {
    if (busy) return;

    setBusy(true);
    setStatus("Saving message...");

    try {
      const viewer = email || currentEmail();
      if (!viewer.includes("@")) throw new Error("Missing sender email.");
      if (!clean(reply)) throw new Error("Write a message first.");

      const finalTo = toEmail || (fromOf(firstMessage) === viewer ? toOf(firstMessage) : fromOf(firstMessage)) || "owner@vaultforge.local";
      const finalSource = source || sourceOf(firstMessage) || "message";
      const finalSubject = titleOf(firstMessage);
      const finalThreadKey = threadKey || threadKeyOf(firstMessage);
      const finalItem = itemOf(firstMessage) || null;
      const now = new Date().toISOString();

      const row = {
        id: `local-${Date.now()}`,
        thread_id: routeThreadId,
        thread_key: finalThreadKey,
        from_email: viewer,
        sender_email: viewer,
        to_email: finalTo,
        recipient_email: finalTo,
        target_email: finalTo,
        owner_email: finalTo,
        subject: finalSubject,
        title: finalSubject,
        message: reply,
        body: reply,
        note: reply,
        source: finalSource,
        origin: finalSource,
        message_type: finalSource,
        folder: finalSource === "pain" ? "pain" : "general",
        folder_key: finalSource === "pain" ? "pain" : "general",
        item_id: finalItem,
        deal_id: finalItem,
        status: "sent",
        created_at: now,
        updated_at: now,
        metadata: {
          thread_id: routeThreadId,
          thread_key: finalThreadKey,
          item_id: finalItem,
          source: finalSource,
          from_email: viewer,
          to_email: finalTo,
          subject: finalSubject,
          created_at: now,
          updated_at: now,
        },
      };

      writeLocalMessage(row);

      try {
        await fetch("/api/simple-messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-vf-email": viewer,
          },
          body: JSON.stringify(row),
        });
      } catch {
        // Local visible fallback.
      }

      setReply("");
      await load();
      setStatus("Message sent.");
    } catch (error: any) {
      setStatus(error?.message || "Message could not be saved.");
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
            gap: 10px !important;
          }

          .vf-actions > * {
            width: 100%;
            box-sizing: border-box;
            justify-content: center;
          }
        }
      `}</style>

      <div style={wrap}>
        <VaultForgeMemberNav title="Message Thread" subtitle="Related conversation messages." active="messages" />

        <section style={card}>
          <div style={eyebrow}>VaultForge Conversation</div>
          <h1 style={heroTitle}>Message room.</h1>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span style={chip}>Thread ID: {routeThreadId}</span>
            {threadKey ? <span style={chip}>Thread Key: {threadKey}</span> : null}
            <span style={chip}>Signed in: {email || "unknown"}</span>
            <span style={chip}>Messages: {messages.length}</span>
          </div>

          <div className="vf-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
            <Link href="/messages" style={ghost}>All Messages</Link>
            <Link href="/dashboard" style={ghost}>Dashboard</Link>
            <button type="button" onClick={load} style={button}>Refresh</button>
          </div>
        </section>

        <section style={card}>
          <h2 style={{ marginTop: 0 }}>Messages in this conversation</h2>

          <div style={{ display: "grid", gap: 12 }}>
            {messages.length ? (
              messages.map((row, index) => (
                <article key={`${rowKey(row)}-${index}`} style={messageCard}>
                  <h3 style={{ margin: "0 0 8px", fontSize: 24 }}>{titleOf(row)}</h3>
                  <p style={{ color: "#cbd5e1", lineHeight: 1.55, fontSize: 18 }}>{bodyOf(row)}</p>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {fromOf(row) ? <span style={chip}>From: {fromOf(row)}</span> : null}
                    {toOf(row) ? <span style={chip}>To: {toOf(row)}</span> : null}
                    {createdOf(row) ? <span style={chip}>{createdOf(row).slice(0, 19).replace("T", " ")}</span> : null}
                  </div>
                </article>
              ))
            ) : (
              <p style={{ color: "#cbd5e1", lineHeight: 1.55 }}>
                No messages in this conversation yet. Write the first message below.
              </p>
            )}
          </div>
        </section>

        <section style={card}>
          <h2 style={{ marginTop: 0 }}>Send Message</h2>
          <textarea
            value={reply}
            onChange={(event) => setReply(event.target.value)}
            placeholder="Write a message..."
            style={{ ...input, minHeight: 170, resize: "vertical" }}
          />

          <button
            type="button"
            onClick={sendMessage}
            disabled={busy}
            style={{ ...button, width: "100%", marginTop: 16, opacity: busy ? 0.65 : 1 }}
          >
            {busy ? "Saving..." : "Send Message"}
          </button>
        </section>

        {status ? <section style={card}>{status}</section> : null}
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

const wrap: React.CSSProperties = { width: "min(980px,100%)", margin: "0 auto" };

const card: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.24)",
  borderRadius: 30,
  padding: 24,
  background: "linear-gradient(145deg,rgba(255,255,255,.070),rgba(255,255,255,.030))",
  boxShadow: "0 28px 86px rgba(0,0,0,.30)",
  marginBottom: 18,
};

const messageCard: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.12)",
  borderRadius: 22,
  padding: 16,
  background: "rgba(255,255,255,.045)",
};

const input: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  borderRadius: 18,
  border: "1px solid rgba(255,255,255,.16)",
  background: "rgba(255,255,255,.08)",
  color: "white",
  padding: 14,
  fontSize: 16,
  outline: "none",
};

const chip: React.CSSProperties = {
  border: "1px solid rgba(157,243,191,.22)",
  borderRadius: 999,
  padding: "7px 10px",
  color: "#9df3bf",
  background: "rgba(157,243,191,.07)",
  fontSize: 12,
  fontWeight: 850,
  display: "inline-flex",
};

const button: React.CSSProperties = {
  display: "inline-flex",
  justifyContent: "center",
  alignItems: "center",
  minHeight: 50,
  borderRadius: 999,
  padding: "12px 18px",
  border: 0,
  background: "linear-gradient(135deg,#f8e7b0,#e8c46b)",
  color: "#06100a",
  fontWeight: 950,
  textDecoration: "none",
  cursor: "pointer",
};

const ghost: React.CSSProperties = {
  ...button,
  background: "rgba(255,255,255,.06)",
  border: "1px solid rgba(255,255,255,.16)",
  color: "white",
};

const eyebrow: React.CSSProperties = {
  color: "#e8c46b",
  letterSpacing: ".18em",
  textTransform: "uppercase",
  fontWeight: 950,
  fontSize: 12,
};

const heroTitle: React.CSSProperties = {
  fontSize: "clamp(52px,10vw,92px)",
  lineHeight: .88,
  letterSpacing: "-.07em",
  margin: "12px 0 18px",
};
