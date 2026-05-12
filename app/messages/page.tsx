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

function writeLocalMessages(rows: Row[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LOCAL_KEY, JSON.stringify(rows.slice(0, 400)));
}

function upsertLocalMessage(row: Row) {
  const existing = readLocalMessages();
  const key = stableKey(row);
  const next = existing.some((item) => stableKey(item) === key)
    ? existing.map((item) => (stableKey(item) === key ? { ...item, ...row } : item))
    : [row, ...existing];

  writeLocalMessages(next);
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

function normalizeSource(value: unknown, row: Row = {}) {
  const raw = first(value, row.source, row.message_type, row.type, meta(row).source, "message").toLowerCase();
  const text = [raw, row.subject, row.title, row.message, row.body, row.note, meta(row).subject, meta(row).message]
    .join(" ")
    .toLowerCase();

  if (text.includes("alert") || text.includes("need-more") || text.includes("need_more") || text.includes("request-info") || text.includes("message-owner") || text.includes("urgent")) return "alert";
  if (text.includes("pain") || text.includes("distress") || text.includes("funding gap")) return "pain";
  if (text.includes("activity") || text.includes("event")) return "activity";
  if (text.includes("routing") || text.includes("route")) return "routing";
  if (text.includes("intro")) return "introduction";
  if (text.includes("project") || text.includes("deal") || text.includes("property")) return "project";
  if (text.includes("member") || text.includes("connect") || text.includes("profile")) return "member";
  if (text.includes("signal")) return "signal";

  return raw || "message";
}

function folderForSource(source: string) {
  if (source === "alert") return "alerts";
  if (source === "pain") return "pain";
  if (source === "activity") return "activity";
  if (source === "routing") return "routing";
  if (source === "introduction") return "introductions";
  if (source === "project") return "projects";
  if (source === "member") return "members";
  if (source === "signal") return "signals";
  return "general";
}

function subjectOf(row: Row) {
  return first(row.subject, row.title, meta(row).subject, label(row.source || row.message_type || meta(row).source || "message"));
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
  return normalizeSource(first(row.source, row.message_type, row.type, meta(row).source, "message"), row);
}

function signalOf(row: Row) {
  return first(row.signal_id, row.signalId, meta(row).signal_id);
}

function itemOf(row: Row) {
  return first(row.item_id, row.itemId, meta(row).item_id);
}

function createdOf(row: Row) {
  return first(row.created_at, meta(row).created_at);
}

function stableKey(row: Row) {
  return [first(row.thread_id, meta(row).thread_id), fromOf(row), toOf(row), bodyOf(row), createdOf(row)].join("|").toLowerCase();
}

function isHidden(row: Row) {
  const status = first(row.status, meta(row).status).toLowerCase();
  return row?.is_deleted === true || row?.is_archived === true || status === "deleted" || status === "archived";
}

function label(source: string) {
  const s = normalizeSource(source);
  if (s === "alert") return "Alert message";
  if (s === "pain") return "Pain message";
  if (s === "activity") return "Activity message";
  if (s === "routing") return "Routing message";
  if (s === "introduction") return "Introduction message";
  if (s === "project") return "Project message";
  if (s === "member") return "Member message";
  if (s === "signal") return "Signal message";
  return "VaultForge message";
}

function defaultBody(source: string) {
  const s = normalizeSource(source);
  if (s === "alert") return "I need more information about this VaultForge alert.";
  if (s === "pain") return "I need more information about this pain request or opportunity.";
  if (s === "activity") return "I am following up on this VaultForge activity item.";
  if (s === "routing") return "I am following up on this routing opportunity.";
  if (s === "introduction") return "I am responding to this controlled introduction.";
  if (s === "project") return "I need more information about this project or deal room.";
  if (s === "member") return "I saw this member profile and would like to connect.";
  if (s === "signal") return "I need more information about this VaultForge signal.";
  return "I need more information about this VaultForge opportunity.";
}

function normalizeRow(row: Row, threadId: string) {
  const source = sourceOf(row);
  const folder = first(row.folder, row.folder_key, meta(row).folder, meta(row).folder_key, folderForSource(source));
  const createdAt = createdOf(row) || new Date().toISOString();

  return {
    ...row,
    thread_id: first(row.thread_id, meta(row).thread_id, threadId),
    source,
    origin: first(row.origin, meta(row).origin, source),
    message_type: source,
    folder,
    folder_key: folder,
    subject: subjectOf(row),
    title: subjectOf(row),
    message: bodyOf(row),
    body: bodyOf(row),
    note: bodyOf(row),
    from_email: fromOf(row),
    sender_email: fromOf(row),
    to_email: toOf(row),
    recipient_email: toOf(row),
    signal_id: signalOf(row) || null,
    item_id: itemOf(row) || null,
    created_at: createdAt,
    updated_at: first(row.updated_at, meta(row).updated_at, createdAt),
    metadata: {
      ...meta(row),
      thread_id: first(row.thread_id, meta(row).thread_id, threadId),
      source,
      origin: first(row.origin, meta(row).origin, source),
      folder,
      folder_key: folder,
      signal_id: signalOf(row) || null,
      item_id: itemOf(row) || null,
      from_email: fromOf(row),
      to_email: toOf(row),
    },
  };
}

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(232,196,107,.14), transparent 28%), radial-gradient(circle at 88% 10%, rgba(74,222,128,.10), transparent 26%), linear-gradient(180deg,#020303,#071326 55%,#020303)",
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
  margin: "0 7px 7px 0",
  fontSize: 12,
  fontWeight: 850,
  display: "inline-flex",
};

const goldChip: React.CSSProperties = {
  ...chip,
  color: "#f8e7b0",
  border: "1px solid rgba(232,196,107,.28)",
  background: "rgba(232,196,107,.08)",
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

export default function ThreadPage({ params }: { params: { threadId: string } }) {
  const threadId = decodeURIComponent(params.threadId || "");

  const [email, setEmail] = useState("");
  const [messages, setMessages] = useState<Row[]>([]);
  const [reply, setReply] = useState("");
  const [source, setSource] = useState("message");
  const [folder, setFolder] = useState("general");
  const [signalId, setSignalId] = useState("");
  const [itemId, setItemId] = useState("");
  const [toEmail, setToEmail] = useState("");
  const [status, setStatus] = useState("Loading thread...");
  const [busy, setBusy] = useState(false);

  const sortedMessages = useMemo(() => {
    return [...messages].sort((a, b) => first(createdOf(a), "").localeCompare(first(createdOf(b), "")));
  }, [messages]);

  function applyUrlContext() {
    const params = new URLSearchParams(window.location.search || "");
    const nextSource = normalizeSource(first(params.get("source"), params.get("origin"), "message"));
    const nextFolder = first(params.get("folder"), folderForSource(nextSource));
    const nextSignal = first(params.get("signal_id"), params.get("signalId"), "");
    const nextItem = first(params.get("item_id"), params.get("itemId"), "");
    const nextTo = cleanEmail(first(params.get("to"), params.get("recipient_email"), params.get("owner_email"), "owner@vaultforge.local"));
    const nextMessage = first(params.get("message"), params.get("body"), params.get("note"), "");

    setSource(nextSource);
    setFolder(nextFolder);
    setSignalId(nextSignal);
    setItemId(nextItem);
    setToEmail(nextTo);

    setReply((current) => current || nextMessage || defaultBody(nextSource));
  }

  async function load() {
    const viewer = currentEmail();
    setEmail(viewer);
    applyUrlContext();
    setStatus("Loading thread...");

    const localRows = readLocalMessages()
      .filter((row) => first(row.thread_id, meta(row).thread_id) === threadId)
      .filter((row) => !isHidden(row))
      .map((row) => normalizeRow(row, threadId));

    let apiRows: Row[] = [];

    try {
      const res = await fetch(`/api/simple-messages?thread_id=${encodeURIComponent(threadId)}&email=${encodeURIComponent(viewer)}`, {
        cache: "no-store",
        headers: { "x-vf-email": viewer },
      });

      const data = await safeJson(res);

      apiRows = [
        ...(Array.isArray(data.messages) ? data.messages : []),
        ...(Array.isArray(data.threads) ? data.threads : []),
        ...(Array.isArray(data.data) ? data.data : []),
      ]
        .filter((row: Row) => first(row.thread_id, meta(row).thread_id) === threadId)
        .filter((row: Row) => !isHidden(row))
        .map((row: Row) => normalizeRow(row, threadId));
    } catch {
      apiRows = [];
    }

    const seen = new Set<string>();
    const unique = [...apiRows, ...localRows].filter((row) => {
      const key = stableKey(row);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    setMessages(unique);
    setStatus(unique.length ? "" : "No messages in this thread yet. Write and send below.");
  }

  useEffect(() => {
    load();
  }, [threadId]);

  async function sendMessage() {
    if (busy) return;

    setBusy(true);
    setStatus("Saving message...");

    try {
      const viewer = email || currentEmail();
      if (!viewer.includes("@")) throw new Error("Missing sender email.");
      if (!clean(reply)) throw new Error("Write a message first.");

      const firstMessage = messages[0] || {};
      const finalTo = toEmail || (fromOf(firstMessage) === viewer ? toOf(firstMessage) : fromOf(firstMessage)) || "owner@vaultforge.local";
      const finalSource = normalizeSource(source || sourceOf(firstMessage) || "message");
      const finalFolder = folder || folderForSource(finalSource);
      const finalSignal = signalId || signalOf(firstMessage) || null;
      const finalItem = itemId || itemOf(firstMessage) || null;
      const finalSubject = label(finalSource);
      const now = new Date().toISOString();

      const row = normalizeRow(
        {
          id: `local-${Date.now()}`,
          thread_id: threadId,
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
          folder: finalFolder,
          folder_key: finalFolder,
          signal_id: finalSignal,
          item_id: finalItem,
          status: "open",
          created_at: now,
          updated_at: now,
          metadata: {
            thread_id: threadId,
            signal_id: finalSignal,
            item_id: finalItem,
            source: finalSource,
            origin: finalSource,
            folder: finalFolder,
            folder_key: finalFolder,
            from_email: viewer,
            to_email: finalTo,
          },
        },
        threadId
      );

      const res = await fetch("/api/simple-messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-vf-email": viewer,
        },
        body: JSON.stringify(row),
      });

      const data = await safeJson(res);
      const savedRow = data?.row || data?.data || row;
      upsertLocalMessage(normalizeRow(savedRow, threadId));

      setReply("");
      await load();
      setStatus(data?.saved === false ? "Message saved locally. API table fallback was used." : "Message sent.");
    } catch (error: any) {
      setStatus(error?.message || "Message could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={page}>
      <style>{`
        a:hover, button:hover { transform: translateY(-1px); transition: all .18s ease; filter: brightness(1.06); }
        textarea::placeholder { color: rgba(255,255,255,.42); }
        @media (max-width: 760px) {
          .vf-actions { display: grid !important; gap: 10px !important; }
          .vf-actions > * { width: 100%; box-sizing: border-box; justify-content: center; }
        }
      `}</style>

      <div style={wrap}>
        <VaultForgeMemberNav title="Message Thread" subtitle="Owner/member communication." active="messages" />

        <section style={card}>
          <div style={{ color: "#e8c46b", letterSpacing: ".18em", textTransform: "uppercase", fontWeight: 950, fontSize: 12 }}>
            VaultForge Thread
          </div>
          <h1 style={{ fontSize: "clamp(52px,10vw,92px)", lineHeight: 0.88, letterSpacing: "-.07em", margin: "12px 0 18px" }}>
            Conversation room.
          </h1>

          <div>
            <span style={chip}>Thread: {threadId}</span>
            <span style={chip}>Signed in: {email || "unknown"}</span>
            <span style={chip}>Messages: {sortedMessages.length}</span>
            <span style={goldChip}>Folder: {folder}</span>
            {source ? <span style={chip}>Type: {source}</span> : null}
            {signalId ? <span style={chip}>Signal: {signalId}</span> : null}
            {itemId ? <span style={chip}>Item: {itemId}</span> : null}
          </div>

          <div className="vf-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
            <Link href="/messages" style={ghost}>All Messages</Link>
            <Link href="/dashboard" style={ghost}>Dashboard</Link>
            <button type="button" onClick={load} style={button}>Refresh</button>
          </div>
        </section>

        <section style={card}>
          <h2 style={{ marginTop: 0 }}>Messages</h2>

          <div style={{ display: "grid", gap: 12 }}>
            {sortedMessages.length ? (
              sortedMessages.map((row, index) => (
                <article key={`${stableKey(row)}-${index}`} style={{ border: "1px solid rgba(255,255,255,.12)", borderRadius: 22, padding: 16, background: "rgba(255,255,255,.045)" }}>
                  <h3 style={{ margin: "0 0 8px" }}>{subjectOf(row)}</h3>
                  <p style={{ color: "#cbd5e1", lineHeight: 1.55 }}>{bodyOf(row)}</p>
                  <div>
                    {fromOf(row) ? <span style={chip}>From: {fromOf(row)}</span> : null}
                    {toOf(row) ? <span style={chip}>To: {toOf(row)}</span> : null}
                    <span style={chip}>Source: {sourceOf(row)}</span>
                    {signalOf(row) ? <span style={chip}>Signal: {signalOf(row)}</span> : null}
                    {itemOf(row) ? <span style={chip}>Item: {itemOf(row)}</span> : null}
                    {createdOf(row) ? <span style={chip}>{createdOf(row).slice(0, 19).replace("T", " ")}</span> : null}
                  </div>
                </article>
              ))
            ) : (
              <p style={{ color: "#cbd5e1", lineHeight: 1.55 }}>No messages in this thread yet. Write the first message below.</p>
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

          <button type="button" onClick={sendMessage} disabled={busy} style={{ ...button, width: "100%", marginTop: 16, opacity: busy ? 0.65 : 1 }}>
            {busy ? "Saving..." : "Send Message"}
          </button>
        </section>

        {status ? <section style={card}>{status}</section> : null}
      </div>
    </main>
  );
}
