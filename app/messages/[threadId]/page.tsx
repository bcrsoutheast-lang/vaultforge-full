"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type MessageRow = Record<string, any>;

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

function threadKeyOf(row: MessageRow) {
  return first(row.thread_key, row.metadata?.thread_key);
}

function threadIdOf(row: MessageRow) {
  return first(row.thread_id, row.metadata?.thread_id);
}

function titleOf(row: MessageRow) {
  return (
    first(row.subject, row.title, "VaultForge message")
      .replace(/^(re:\s*)+/gi, "")
      .trim() || "VaultForge message"
  );
}

function bodyOf(row: MessageRow) {
  return first(row.message, row.body, row.note, row.content);
}

function createdOf(row: MessageRow) {
  return first(row.created_at, row.updated_at);
}

function fromOf(row: MessageRow) {
  return lower(first(row.from_email, row.sender_email, row.member_email));
}

function toOf(row: MessageRow) {
  return lower(first(row.to_email, row.recipient_email, row.target_email, row.owner_email));
}

function sourceOf(row: MessageRow) {
  return lower(first(row.source, row.origin, row.message_type, "message"));
}

function folderOf(row: MessageRow) {
  return lower(first(row.folder, row.folder_key));
}

function itemOf(row: MessageRow) {
  return first(row.item_id, row.itemId, row.deal_id, row.metadata?.item_id);
}

function signalOf(row: MessageRow) {
  return first(row.signal_id, row.signalId, row.metadata?.signal_id);
}

function laneFolder(source: string) {
  const s = lower(source);

  if (s.includes("alert")) return "alerts";
  if (s.includes("pain")) return "pain";
  if (s.includes("signal")) return "signals";
  if (s.includes("routing") || s.includes("route")) return "routing";
  if (s.includes("intro")) return "introductions";
  if (s.includes("project") || s.includes("deal")) return "projects";
  if (s.includes("member") || s.includes("connect")) return "members";

  return "general";
}

function rowKey(row: MessageRow) {
  const id = first(row.id);
  if (id) return id;

  return [threadKeyOf(row), threadIdOf(row), fromOf(row), toOf(row), bodyOf(row), createdOf(row)].join("|");
}

async function safeJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

export default function ThreadPage({
  params,
}: {
  params: { threadId: string };
}) {
  const routeThreadId = decodeURIComponent(params.threadId || "");

  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [reply, setReply] = useState("");
  const [status, setStatus] = useState("Loading thread...");
  const [busy, setBusy] = useState(false);
  const [viewer, setViewer] = useState("");
  const [busyMessage, setBusyMessage] = useState("");

  const urlContext = useMemo(() => {
    if (typeof window === "undefined") {
      return { threadKey: "", source: "message", to: "", subject: "", message: "", itemId: "", signalId: "" };
    }

    const search = new URLSearchParams(window.location.search || "");

    return {
      threadKey: clean(search.get("thread_key") || ""),
      source: clean(search.get("source") || search.get("type") || search.get("context") || "message"),
      to: lower(search.get("to") || search.get("recipient_email") || search.get("owner_email") || ""),
      subject: clean(search.get("subject") || search.get("title") || ""),
      message: clean(search.get("message") || search.get("body") || search.get("note") || ""),
      itemId: clean(search.get("item_id") || search.get("itemId") || search.get("deal_id") || search.get("project_id") || ""),
      signalId: clean(search.get("signal_id") || search.get("signalId") || ""),
    };
  }, []);

  async function load() {
    const email = currentEmail();
    setViewer(email);
    setStatus("Loading thread...");

    try {
      const query = urlContext.threadKey
        ? `thread_key=${encodeURIComponent(urlContext.threadKey)}`
        : `thread_id=${encodeURIComponent(routeThreadId)}`;

      const response = await fetch(`/api/simple-messages?email=${encodeURIComponent(email)}&${query}`, {
        cache: "no-store",
        headers: { "x-vf-email": email },
      });

      const data = await safeJson(response);
      const rows = Array.isArray(data.messages) ? data.messages : [];

      const seen = new Set<string>();
      const unique = rows.filter((row: MessageRow) => {
        const key = rowKey(row);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      unique.sort((a: MessageRow, b: MessageRow) => createdOf(a).localeCompare(createdOf(b)));

      setMessages(unique);
      setStatus(unique.length ? "" : "No messages in this conversation yet.");

      if (!reply && urlContext.message) {
        setReply(urlContext.message);
      }
    } catch (error) {
      console.error(error);
      setStatus("Could not load thread.");
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeThreadId, urlContext.threadKey]);

  const firstMessage = messages[0] || {};
  const latestMessage = messages[messages.length - 1] || firstMessage || {};

  async function sendReply() {
    if (busy) return;

    const text = clean(reply);

    if (!text) {
      setStatus("Write a message first.");
      return;
    }

    const email = viewer || currentEmail();

    if (!email.includes("@")) {
      setStatus("Missing signed-in email.");
      return;
    }

    setBusy(true);
    setStatus("Sending message...");

    try {
      const source = urlContext.source || sourceOf(firstMessage) || "message";
      const folder = folderOf(firstMessage) || laneFolder(source);
      const threadKey = urlContext.threadKey || threadKeyOf(firstMessage);
      const threadId = routeThreadId || threadIdOf(firstMessage);
      const toEmail =
        urlContext.to ||
        (fromOf(latestMessage) === email ? toOf(latestMessage) : fromOf(latestMessage)) ||
        toOf(firstMessage) ||
        "bcrsoutheast@gmail.com";

      const title = urlContext.subject || titleOf(firstMessage) || "VaultForge message";
      const itemId = urlContext.itemId || itemOf(firstMessage) || null;
      const signalId = urlContext.signalId || signalOf(firstMessage) || null;
      const now = new Date().toISOString();

      const payload = {
        thread_id: threadId,
        thread_key: threadKey,
        from_email: email,
        sender_email: email,
        to_email: toEmail,
        recipient_email: toEmail,
        target_email: toEmail,
        owner_email: toEmail,
        subject: title,
        title,
        message: text,
        body: text,
        note: text,
        source,
        origin: source,
        message_type: source,
        folder,
        folder_key: folder,
        signal_id: signalId,
        item_id: itemId,
        deal_id: itemId,
        status: "sent",
        created_at: now,
        updated_at: now,
        metadata: {
          thread_id: threadId,
          thread_key: threadKey,
          source,
          origin: source,
          folder,
          folder_key: folder,
          signal_id: signalId,
          item_id: itemId,
          from_email: email,
          to_email: toEmail,
          subject: title,
          created_at: now,
          updated_at: now,
        },
      };

      const response = await fetch("/api/simple-messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-vf-email": email,
        },
        body: JSON.stringify(payload),
      });

      const result = await safeJson(response);

      if (!response.ok || result?.ok === false) {
        throw new Error(result?.error || "Message could not be saved.");
      }

      setReply("");
      await load();
      setStatus("Message sent.");
    } catch (error: any) {
      console.error(error);
      setStatus(error?.message || "Message could not be sent.");
    } finally {
      setBusy(false);
    }
  }

  async function cleanupMessage(message: MessageRow, action: "archive" | "delete") {
    const email = viewer || currentEmail();
    const id = clean(message.id);
    const threadKey = threadKeyOf(message);
    const threadId = threadIdOf(message);

    setBusyMessage(`${action}:${id || rowKey(message)}`);
    setStatus(action === "archive" ? "Archiving message..." : "Deleting message...");

    try {
      const response = await fetch("/api/simple-messages", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-vf-email": email,
        },
        body: JSON.stringify({
          action,
          email,
          id,
          thread_key: threadKey,
          thread_id: threadId,
        }),
      });

      const result = await safeJson(response);

      if (!response.ok || result?.ok === false) {
        throw new Error(result?.error || "Cleanup failed.");
      }

      setMessages((current) => current.filter((row) => rowKey(row) !== rowKey(message)));
      setStatus(action === "archive" ? "Message archived." : "Message deleted.");
    } catch (error: any) {
      console.error(error);
      setStatus(error?.message || "Cleanup failed.");
    } finally {
      setBusyMessage("");
    }
  }

  return (
    <main style={page}>
      <style>{`
        a:hover, button:hover {
          transform: translateY(-1px);
          filter: brightness(1.06);
          transition: all .18s ease;
        }

        textarea::placeholder {
          color: rgba(255,255,255,.45);
        }

        @media (max-width: 760px) {
          .vf-actions {
            display: grid !important;
            grid-template-columns: 1fr !important;
          }

          .vf-actions > * {
            width: 100%;
            box-sizing: border-box;
            justify-content: center;
          }
        }
      `}</style>

      <div style={wrap}>
        <nav style={nav}>
          <Link href="/dashboard" style={navButton}>Dashboard</Link>
          <Link href="/alerts" style={navButton}>Alerts</Link>
          <Link href="/pain-feed" style={navButton}>Pain Feed</Link>
          <Link href="/projects" style={navButton}>Projects</Link>
          <Link href="/routing-inbox" style={navButton}>Routing</Link>
          <Link href="/network" style={navButton}>Network</Link>
          <Link href="/members" style={navButton}>Members</Link>
          <Link href="/messages" style={navButtonActive}>Messages</Link>
        </nav>

        <section style={hero}>
          <div style={eyebrow}>VaultForge Thread</div>
          <h1 style={heroTitle}>Message Room.</h1>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span style={chip}>Signed in: {viewer || "unknown"}</span>
            <span style={chip}>Thread Key: {urlContext.threadKey || threadKeyOf(firstMessage) || "none"}</span>
            <span style={chip}>Messages: {messages.length}</span>
          </div>

          <div className="vf-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
            <Link href="/messages" style={button}>Back to Messages</Link>
            <button type="button" onClick={load} style={ghostButton}>Refresh</button>
          </div>
        </section>

        <section style={{ display: "grid", gap: 16 }}>
          {messages.map((message, index) => {
            const key = rowKey(message);
            const isArchiving = busyMessage === `archive:${clean(message.id) || key}`;
            const isDeleting = busyMessage === `delete:${clean(message.id) || key}`;

            return (
              <article key={`${key}-${index}`} style={card}>
                <h2 style={title}>{titleOf(message)}</h2>

                <p style={body}>{bodyOf(message)}</p>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <span style={chip}>From: {fromOf(message) || "unknown"}</span>
                  <span style={chip}>To: {toOf(message) || "unknown"}</span>
                  <span style={chip}>{createdOf(message)}</span>
                </div>

                <div className="vf-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
                  <button type="button" onClick={() => cleanupMessage(message, "archive")} disabled={!!busyMessage} style={ghostButton}>
                    {isArchiving ? "Archiving..." : "Archive"}
                  </button>

                  <button type="button" onClick={() => cleanupMessage(message, "delete")} disabled={!!busyMessage} style={dangerButton}>
                    {isDeleting ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </article>
            );
          })}
        </section>

        <section style={hero}>
          <h2 style={{ marginTop: 0 }}>Reply</h2>

          <textarea
            value={reply}
            onChange={(event) => setReply(event.target.value)}
            placeholder="Write your message..."
            style={textarea}
          />

          <button type="button" onClick={sendReply} disabled={busy} style={{ ...button, opacity: busy ? 0.65 : 1 }}>
            {busy ? "Sending..." : "Send Message"}
          </button>
        </section>

        {status ? <section style={hero}>{status}</section> : null}
      </div>
    </main>
  );
}

/* styles */
const page: React.CSSProperties = { minHeight: "100vh", background: "radial-gradient(circle at top left, rgba(232,196,107,.14), transparent 28%), linear-gradient(180deg,#020303,#071326 55%,#020303)", color: "white", padding: "22px 16px 96px", fontFamily: "Arial, sans-serif" };
const wrap: React.CSSProperties = { width: "min(980px,100%)", margin: "0 auto" };
const nav: React.CSSProperties = { display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 18 };
const navButton: React.CSSProperties = { display: "inline-flex", justifyContent: "center", alignItems: "center", borderRadius: 999, padding: "12px 16px", background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.14)", color: "white", textDecoration: "none", fontWeight: 800 };
const navButtonActive: React.CSSProperties = { ...navButton, background: "rgba(232,196,107,.14)", border: "1px solid rgba(232,196,107,.28)", color: "#f8e7b0" };
const hero: React.CSSProperties = { border: "1px solid rgba(232,196,107,.18)", borderRadius: 28, padding: 24, marginBottom: 22, background: "rgba(255,255,255,.03)" };
const eyebrow: React.CSSProperties = { color: "#e8c46b", fontWeight: 900, letterSpacing: ".18em", textTransform: "uppercase", fontSize: 12 };
const heroTitle: React.CSSProperties = { fontSize: "clamp(48px,10vw,90px)", lineHeight: .9, margin: "12px 0" };
const card: React.CSSProperties = { border: "1px solid rgba(255,255,255,.12)", borderRadius: 24, padding: 20, background: "rgba(255,255,255,.03)" };
const title: React.CSSProperties = { fontSize: 28, marginBottom: 12 };
const body: React.CSSProperties = { color: "#dbeafe", lineHeight: 1.5, fontSize: 18 };
const chip: React.CSSProperties = { borderRadius: 999, border: "1px solid rgba(255,255,255,.12)", padding: "8px 12px", fontSize: 12, color: "#dbeafe", display: "inline-flex" };
const textarea: React.CSSProperties = { width: "100%", boxSizing: "border-box", minHeight: 160, borderRadius: 18, background: "#081224", color: "white", padding: 16, border: "1px solid rgba(255,255,255,.12)", marginBottom: 16, outline: "none", fontSize: 16 };
const button: React.CSSProperties = { display: "inline-flex", justifyContent: "center", alignItems: "center", borderRadius: 999, padding: "14px 20px", background: "linear-gradient(135deg,#f8e7b0,#e8c46b)", color: "#06100a", textDecoration: "none", fontWeight: 900, border: 0, cursor: "pointer" };
const ghostButton: React.CSSProperties = { ...button, background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.14)", color: "white" };
const dangerButton: React.CSSProperties = { ...button, background: "rgba(248,113,113,.12)", border: "1px solid rgba(248,113,113,.28)", color: "#fecaca" };
