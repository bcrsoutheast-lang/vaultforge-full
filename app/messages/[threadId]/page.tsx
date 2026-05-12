"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import VaultForgeMemberNav from "../../components/VaultForgeMemberNav";

type Row = Record<string, any>;

const LOCAL_KEY = "vf_simple_messages_local_v1";

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

function currentEmail() {
  if (typeof window === "undefined") return "";

  const params = new URLSearchParams(window.location.search || "");
  const queryEmail = cleanEmail(params.get("email") || params.get("from") || params.get("from_email"));
  if (queryEmail.includes("@")) return queryEmail;

  const keys = ["vf_email", "vf_member_email", "vf_admin_email", "email", "memberEmail"];

  for (const key of keys) {
    const local = cleanEmail(window.localStorage.getItem(key));
    if (local.includes("@")) return local;

    const session = cleanEmail(window.sessionStorage.getItem(key));
    if (session.includes("@")) return session;
  }

  return cleanEmail(readCookie("vf_email") || readCookie("vf_member_email") || readCookie("vf_admin_email"));
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
  window.localStorage.setItem(LOCAL_KEY, JSON.stringify([row, ...existing].slice(0, 500)));
}

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

function meta(row: Row) {
  return typeof row?.metadata === "object" && row.metadata ? row.metadata : {};
}

function first(...values: unknown[]) {
  for (const value of values) {
    const text = clean(value);
    if (text) return text;
  }

  return "";
}

function threadOf(row: Row) {
  return first(row.thread_id, row.threadId, meta(row).thread_id, row.id);
}

function subjectOf(row: Row) {
  return first(row.subject, row.title, meta(row).subject, "VaultForge message");
}

function bodyOf(row: Row) {
  return first(row.message, row.body, row.note, meta(row).message, "");
}

function fromOf(row: Row) {
  return cleanEmail(first(row.from_email, row.sender_email, row.member_email, meta(row).from_email));
}

function toOf(row: Row) {
  return cleanEmail(first(row.to_email, row.recipient_email, row.target_email, row.owner_email, meta(row).to_email));
}

function sourceOf(row: Row) {
  return first(row.source, row.message_type, row.type, meta(row).source, "message");
}

function signalOf(row: Row) {
  return first(row.signal_id, row.signalId, meta(row).signal_id);
}

function itemOf(row: Row) {
  return first(row.item_id, row.itemId, meta(row).item_id);
}

function createdOf(row: Row) {
  return first(row.created_at, row.updated_at, meta(row).created_at);
}

function normalizeSubject(value: string) {
  return clean(value).replace(/^(re:\s*)+/gi, "").replace(/\s+/g, " ") || "VaultForge message";
}

function label(source: string) {
  const s = source.toLowerCase();

  if (s.includes("alert")) return "Alert message";
  if (s.includes("pain")) return "Pain message";
  if (s.includes("activity")) return "Activity message";
  if (s.includes("routing")) return "Routing message";
  if (s.includes("intro")) return "Introduction message";
  if (s.includes("project")) return "Project message";
  if (s.includes("member")) return "Member message";
  if (s.includes("signal")) return "Signal message";

  return "VaultForge message";
}

function defaultBody(source: string) {
  const s = source.toLowerCase();

  if (s.includes("alert")) return "I need more information about this VaultForge alert.";
  if (s.includes("pain")) return "I need more information about this pain request or opportunity.";
  if (s.includes("activity")) return "I am following up on this VaultForge activity item.";
  if (s.includes("routing")) return "I am following up on this routing opportunity.";
  if (s.includes("intro")) return "I am responding to this controlled introduction.";
  if (s.includes("project")) return "I need more information about this project or deal room.";
  if (s.includes("member")) return "I saw this member profile and would like to connect.";
  if (s.includes("signal")) return "I need more information about this VaultForge signal.";

  return "I need more information about this VaultForge opportunity.";
}

function rowKey(row: Row) {
  return [
    threadOf(row),
    fromOf(row),
    toOf(row),
    normalizeSubject(subjectOf(row)),
    bodyOf(row),
    createdOf(row).slice(0, 19),
  ].join("|");
}

export default function ThreadPage({ params }: { params: { threadId: string } }) {
  const primaryThreadId = decodeURIComponent(params.threadId || "");

  const [email, setEmail] = useState("");
  const [messages, setMessages] = useState<Row[]>([]);
  const [reply, setReply] = useState("");
  const [source, setSource] = useState("message");
  const [signalId, setSignalId] = useState("");
  const [itemId, setItemId] = useState("");
  const [toEmail, setToEmail] = useState("");
  const [status, setStatus] = useState("Loading thread...");
  const [busy, setBusy] = useState(false);
  const [threadIds, setThreadIds] = useState<string[]>([primaryThreadId]);

  function applyUrlContext() {
    const params = new URLSearchParams(window.location.search || "");
    const nextSource = first(params.get("source"), "message");
    const nextSignal = first(params.get("signal_id"), params.get("signalId"), "");
    const nextItem = first(params.get("item_id"), params.get("itemId"), "");
    const nextTo = cleanEmail(first(params.get("to"), params.get("recipient_email"), params.get("owner_email"), "owner@vaultforge.local"));
    const nextMessage = first(params.get("message"), params.get("body"), params.get("note"), "");
    const relatedThreads = first(params.get("threads"), "");

    const ids = relatedThreads
      ? relatedThreads.split(",").map((item) => decodeURIComponent(clean(item))).filter(Boolean)
      : [primaryThreadId];

    if (!ids.includes(primaryThreadId)) ids.unshift(primaryThreadId);

    setThreadIds(Array.from(new Set(ids)));
    setSource(nextSource);
    setSignalId(nextSignal);
    setItemId(nextItem);
    setToEmail(nextTo);

    if (nextMessage && !reply) setReply(nextMessage);
    if (!nextMessage && !reply) setReply(defaultBody(nextSource));
  }

  async function load() {
    const viewer = currentEmail();
    setEmail(viewer);
    applyUrlContext();
    setStatus("Loading thread...");

    const params = new URLSearchParams(window.location.search || "");
    const relatedThreads = first(params.get("threads"), "");
    const ids = relatedThreads
      ? relatedThreads.split(",").map((item) => decodeURIComponent(clean(item))).filter(Boolean)
      : [primaryThreadId];

    if (!ids.includes(primaryThreadId)) ids.unshift(primaryThreadId);

    const idSet = new Set(ids);

    const localRows = readLocalMessages().filter((row) => idSet.has(threadOf(row)));

    let apiRows: Row[] = [];

    for (const id of ids) {
      try {
        const res = await fetch(`/api/simple-messages?thread_id=${encodeURIComponent(id)}&email=${encodeURIComponent(viewer)}`, {
          cache: "no-store",
          headers: { "x-vf-email": viewer },
        });

        const data = await safeJson(res);

        const nextRows = [
          ...(Array.isArray(data.messages) ? data.messages : []),
          ...(Array.isArray(data.threads) ? data.threads : []),
          ...(Array.isArray(data.data) ? data.data : []),
        ].filter((row: Row) => idSet.has(threadOf(row)));

        apiRows = [...apiRows, ...nextRows];
      } catch {
        apiRows = [];
      }
    }

    const rows = [...localRows, ...apiRows];

    const seen = new Set<string>();
    const unique = rows.filter((row) => {
      const key = rowKey(row);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    unique.sort((a, b) => first(a.created_at, "").localeCompare(first(b.created_at, "")));

    setMessages(unique);
    setStatus(unique.length ? "" : "No messages in this thread yet. Write and send below.");
  }

  useEffect(() => {
    load();
  }, [primaryThreadId]);

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
      const finalSignal = signalId || signalOf(firstMessage) || null;
      const finalItem = itemId || itemOf(firstMessage) || null;
      const finalSubject = normalizeSubject(subjectOf(firstMessage) || label(finalSource));
      const now = new Date().toISOString();

      const row = {
        id: `local-${Date.now()}`,
        thread_id: primaryThreadId,
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
        message_type: finalSource,
        signal_id: finalSignal,
        item_id: finalItem,
        status: "open",
        created_at: now,
        updated_at: now,
        metadata: {
          thread_id: primaryThreadId,
          signal_id: finalSignal,
          item_id: finalItem,
          source: finalSource,
          from_email: viewer,
          to_email: finalTo,
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
        // Local visible message still works.
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
            <span style={chip}>Primary thread: {primaryThreadId}</span>
            <span style={chip}>Related threads: {threadIds.length}</span>
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
                  <h3 style={{ margin: "0 0 8px", fontSize: 24 }}>{normalizeSubject(subjectOf(row))}</h3>
                  <p style={{ color: "#cbd5e1", lineHeight: 1.55, fontSize: 18 }}>{bodyOf(row)}</p>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {fromOf(row) ? <span style={chip}>From: {fromOf(row)}</span> : null}
                    {toOf(row) ? <span style={chip}>To: {toOf(row)}</span> : null}
                    {threadOf(row) ? <span style={chip}>Thread: {threadOf(row)}</span> : null}
                    {signalOf(row) ? <span style={chip}>Signal: {signalOf(row)}</span> : null}
                    {itemOf(row) ? <span style={chip}>Item: {itemOf(row)}</span> : null}
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
