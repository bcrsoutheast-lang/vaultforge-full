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
  return lower(first(row.source, row.origin, row.message_type, row.metadata?.source, "message"));
}

function folderOf(row: MessageRow) {
  return lower(first(row.folder, row.folder_key, row.metadata?.folder, "general"));
}

function itemOf(row: MessageRow) {
  return first(row.item_id, row.itemId, row.deal_id, row.metadata?.item_id);
}

function signalOf(row: MessageRow) {
  return first(row.signal_id, row.signalId, row.metadata?.signal_id);
}

function normalizeSource(value: string) {
  const raw = lower(value);

  if (raw.includes("alert")) return "alert";
  if (raw.includes("pain")) return "pain";
  if (raw.includes("signal")) return "signal";
  if (raw.includes("routing")) return "routing";
  if (raw.includes("intro")) return "introduction";
  if (raw.includes("project") || raw.includes("deal")) return "project";
  if (raw.includes("member")) return "member";

  return raw || "message";
}

function folderForSource(source: string) {
  if (source === "alert") return "alerts";
  if (source === "pain") return "pain";
  if (source === "signal") return "signals";
  if (source === "routing") return "routing";
  if (source === "introduction") return "introductions";
  if (source === "project") return "projects";
  if (source === "member") return "members";

  return "general";
}

function rowKey(row: MessageRow) {
  const id = first(row.id);
  if (id) return id;

  return [
    threadKeyOf(row),
    threadIdOf(row),
    fromOf(row),
    toOf(row),
    titleOf(row),
    bodyOf(row),
    createdOf(row),
  ].join("|");
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

  /*
    CRITICAL FIX:
    Read URL params INSIDE useMemo on client only.
    We preserve source/folder/thread_key instead of falling back to "message/general".
  */
  const urlContext = useMemo(() => {
    if (typeof window === "undefined") {
      return {
        threadKey: "",
        source: "message",
        folder: "general",
        to: "",
        subject: "",
        message: "",
        itemId: "",
        signalId: "",
      };
    }

    const search = new URLSearchParams(window.location.search || "");

    const source = normalizeSource(
      clean(
        search.get("source") ||
          search.get("type") ||
          search.get("context") ||
          "message"
      )
    );

    return {
      threadKey: clean(search.get("thread_key") || ""),
      source,
      folder: clean(search.get("folder") || search.get("folder_key") || folderForSource(source)),
      to: lower(
        search.get("to") ||
          search.get("recipient_email") ||
          search.get("owner_email") ||
          ""
      ),
      subject: clean(search.get("subject") || search.get("title") || ""),
      message: clean(search.get("message") || search.get("body") || search.get("note") || ""),
      itemId: clean(
        search.get("item_id") ||
          search.get("itemId") ||
          search.get("deal_id") ||
          search.get("project_id") ||
          ""
      ),
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

      const response = await fetch(
        `/api/simple-messages?email=${encodeURIComponent(email)}&${query}`,
        {
          cache: "no-store",
          headers: {
            "x-vf-email": email,
          },
        }
      );

      const data = await safeJson(response);
      const rows = Array.isArray(data.messages) ? data.messages : [];

      const seen = new Set<string>();

      const unique = rows.filter((row: MessageRow) => {
        const key = rowKey(row);

        if (seen.has(key)) return false;

        seen.add(key);
        return true;
      });

      unique.sort((a: MessageRow, b: MessageRow) =>
        createdOf(a).localeCompare(createdOf(b))
      );

      setMessages(unique);

      if (!unique.length) {
        setStatus("No messages in this conversation yet.");
      } else {
        setStatus("");
      }

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
      /*
        CRITICAL FIX:
        DO NOT fallback to generic "message".
        Preserve alert/pain/signal routing.
      */
      const source =
        normalizeSource(urlContext.source) ||
        normalizeSource(sourceOf(firstMessage)) ||
        "message";

      const folder =
        clean(urlContext.folder) ||
        folderOf(firstMessage) ||
        folderForSource(source);

      const threadKey =
        urlContext.threadKey ||
        threadKeyOf(firstMessage);

      const threadId =
        routeThreadId ||
        threadIdOf(firstMessage);

      const toEmail =
        urlContext.to ||
        (fromOf(latestMessage) === email
          ? toOf(latestMessage)
          : fromOf(latestMessage)) ||
        toOf(firstMessage) ||
        "bcrsoutheast@gmail.com";

      const title =
        urlContext.subject ||
        titleOf(firstMessage) ||
        "VaultForge message";

      const itemId =
        urlContext.itemId ||
        itemOf(firstMessage) ||
        null;

      const signalId =
        urlContext.signalId ||
        signalOf(firstMessage) ||
        null;

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
      setStatus(`Message sent to ${folder}.`);
    } catch (error: any) {
      console.error(error);
      setStatus(error?.message || "Message could not be sent.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={page}>
      <div style={wrap}>
        <nav style={nav}>
          <Link href="/dashboard" style={navButton}>Dashboard</Link>
          <Link href="/alerts" style={navButton}>Alerts</Link>
          <Link href="/pain-feed" style={navButton}>Pain Feed</Link>
          <Link href="/messages" style={navButtonActive}>Messages</Link>
        </nav>

        <section style={hero}>
          <div style={eyebrow}>VaultForge Thread</div>

          <h1 style={heroTitle}>Message Room.</h1>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span style={chip}>Source: {urlContext.source}</span>
            <span style={chip}>Folder: {urlContext.folder}</span>
            <span style={chip}>Thread: {urlContext.threadKey || "none"}</span>
          </div>
        </section>

        <section style={{ display: "grid", gap: 16 }}>
          {messages.map((message, index) => (
            <article key={`${rowKey(message)}-${index}`} style={card}>
              <h2 style={title}>{titleOf(message)}</h2>

              <p style={body}>{bodyOf(message)}</p>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <span style={chip}>From: {fromOf(message)}</span>
                <span style={chip}>To: {toOf(message)}</span>
                <span style={chip}>{sourceOf(message)}</span>
                <span style={chip}>{folderOf(message)}</span>
              </div>
            </article>
          ))}
        </section>

        <section style={hero}>
          <h2 style={{ marginTop: 0 }}>Reply</h2>

          <textarea
            value={reply}
            onChange={(event) => setReply(event.target.value)}
            placeholder="Write your message..."
            style={textarea}
          />

          <button
            type="button"
            onClick={sendReply}
            disabled={busy}
            style={{
              ...button,
              opacity: busy ? 0.65 : 1,
            }}
          >
            {busy ? "Sending..." : "Send Message"}
          </button>
        </section>

        {status ? <section style={hero}>{status}</section> : null}
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

const wrap: React.CSSProperties = {
  width: "min(980px,100%)",
  margin: "0 auto",
};

const nav: React.CSSProperties = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  marginBottom: 18,
};

const navButton: React.CSSProperties = {
  display: "inline-flex",
  justifyContent: "center",
  alignItems: "center",
  borderRadius: 999,
  padding: "12px 16px",
  background: "rgba(255,255,255,.06)",
  border: "1px solid rgba(255,255,255,.14)",
  color: "white",
  textDecoration: "none",
  fontWeight: 800,
};

const navButtonActive: React.CSSProperties = {
  ...navButton,
  background: "rgba(232,196,107,.14)",
  border: "1px solid rgba(232,196,107,.28)",
  color: "#f8e7b0",
};

const hero: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.18)",
  borderRadius: 28,
  padding: 24,
  marginBottom: 22,
  background: "rgba(255,255,255,.03)",
};

const eyebrow: React.CSSProperties = {
  color: "#e8c46b",
  fontWeight: 900,
  letterSpacing: ".18em",
  textTransform: "uppercase",
  fontSize: 12,
};

const heroTitle: React.CSSProperties = {
  fontSize: "clamp(48px,10vw,90px)",
  lineHeight: .9,
  margin: "12px 0",
};

const card: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.12)",
  borderRadius: 24,
  padding: 20,
  background: "rgba(255,255,255,.03)",
};

const title: React.CSSProperties = {
  fontSize: 28,
  marginBottom: 12,
};

const body: React.CSSProperties = {
  color: "#dbeafe",
  lineHeight: 1.5,
  fontSize: 18,
};

const chip: React.CSSProperties = {
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,.12)",
  padding: "8px 12px",
  fontSize: 12,
  color: "#dbeafe",
  display: "inline-flex",
};

const textarea: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  minHeight: 160,
  borderRadius: 18,
  background: "#081224",
  color: "white",
  padding: 16,
  border: "1px solid rgba(255,255,255,.12)",
  marginBottom: 16,
  outline: "none",
  fontSize: 16,
};

const button: React.CSSProperties = {
  display: "inline-flex",
  justifyContent: "center",
  alignItems: "center",
  borderRadius: 999,
  padding: "14px 20px",
  background: "linear-gradient(135deg,#f8e7b0,#e8c46b)",
  color: "#06100a",
  textDecoration: "none",
  fontWeight: 900,
  border: 0,
  cursor: "pointer",
};
