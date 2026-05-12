"use client";

import { useEffect, useState } from "react";
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
  if (typeof window === "undefined") return;

  const existing = readLocalMessages();
  const next = [row, ...existing].slice(0, 250);
  window.localStorage.setItem(LOCAL_KEY, JSON.stringify(next));
}

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return {};
  }
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

function subject(row: Row) {
  return first(row.subject, row.title, meta(row).subject, "VaultForge thread");
}

function body(row: Row) {
  return first(row.message, row.body, row.note, meta(row).message, "Message ready.");
}

function from(row: Row) {
  return cleanEmail(first(row.from_email, row.sender_email, row.member_email, meta(row).from_email));
}

function to(row: Row) {
  return cleanEmail(first(row.to_email, row.recipient_email, row.target_email, row.owner_email, meta(row).to_email));
}

function signal(row: Row) {
  return first(row.signal_id, row.signalId, meta(row).signal_id);
}

function item(row: Row) {
  return first(row.item_id, row.itemId, meta(row).item_id);
}

function source(row: Row) {
  return first(row.source, row.message_type, row.type, meta(row).source, "message");
}

function created(row: Row) {
  return first(row.created_at, row.updated_at, meta(row).created_at);
}

function param(name: string) {
  if (typeof window === "undefined") return "";
  return clean(new URLSearchParams(window.location.search || "").get(name));
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
  const [status, setStatus] = useState("Loading thread...");
  const [busy, setBusy] = useState(false);

  function seedFromUrl(viewer: string) {
    const urlSignal = param("signal_id");
    const urlItem = param("item_id");
    const urlSource = param("source") || "message";
    const urlTo = cleanEmail(param("to")) || "owner@vaultforge.local";
    const urlSubject = param("subject") || `${urlSource} message`;
    const urlMessage = param("message");

    if (!urlSignal && !urlItem && !urlMessage) return null;

    return {
      id: `local-seed-${threadId}`,
      thread_id: threadId,
      from_email: viewer,
      to_email: urlTo,
      subject: urlSubject,
      title: urlSubject,
      message: urlMessage || "Message thread opened.",
      body: urlMessage || "Message thread opened.",
      source: urlSource,
      message_type: urlSource,
      signal_id: urlSignal || null,
      item_id: urlItem || null,
      status: "open",
      created_at: new Date().toISOString(),
      metadata: {
        thread_id: threadId,
        signal_id: urlSignal || null,
        item_id: urlItem || null,
        source: urlSource,
      },
    };
  }

  async function load() {
    const viewer = currentEmail();
    setEmail(viewer);
    setStatus("Loading thread...");

    const localRows = readLocalMessages().filter((row) => first(row.thread_id, meta(row).thread_id) === threadId);

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
      ].filter((row: Row) => first(row.thread_id, meta(row).thread_id) === threadId);
    } catch {
      apiRows = [];
    }

    const seed = seedFromUrl(viewer);
    const rows = [...(seed ? [seed] : []), ...localRows, ...apiRows];

    const seen = new Set<string>();
    const unique = rows.filter((row) => {
      const key = `${first(row.id, row.created_at)}-${body(row)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    unique.sort((a, b) => clean(created(a)).localeCompare(clean(created(b))));

    setMessages(unique);
    setStatus(unique.length ? "" : "No messages in this thread yet.");
  }

  useEffect(() => {
    load();
  }, [threadId]);

  async function sendReply() {
    if (busy) return;

    setBusy(true);
    setStatus("Saving message...");

    try {
      const viewer = email || currentEmail();

      if (!viewer.includes("@")) throw new Error("Missing sender email.");
      if (!clean(reply)) throw new Error("Write a message first.");

      const firstMessage = messages[0] || seedFromUrl(viewer) || {};
      const otherEmail = from(firstMessage) === viewer ? to(firstMessage) : from(firstMessage);

      const payload = {
        id: `local-${Date.now()}`,
        thread_id: threadId,
        from_email: viewer,
        sender_email: viewer,
        to_email: otherEmail || "owner@vaultforge.local",
        recipient_email: otherEmail || "owner@vaultforge.local",
        subject: `Re: ${subject(firstMessage)}`,
        title: `Re: ${subject(firstMessage)}`,
        message: reply,
        body: reply,
        note: reply,
        source: source(firstMessage),
        message_type: source(firstMessage),
        signal_id: signal(firstMessage) || null,
        item_id: item(firstMessage) || null,
        status: "open",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: {
          thread_id: threadId,
          signal_id: signal(firstMessage) || null,
          item_id: item(firstMessage) || null,
          source: source(firstMessage),
        },
      };

      writeLocalMessage(payload);

      try {
        await fetch("/api/simple-messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-vf-email": viewer,
          },
          body: JSON.stringify(payload),
        });
      } catch {
        // Local visible message still works.
      }

      setReply("");
      await load();
      setStatus("Message saved.");
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
        <VaultForgeMemberNav title="Message Thread" subtitle="Owner/member replies." active="messages" />

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
            <span style={chip}>Messages: {messages.length}</span>
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
            {messages.map((row, index) => (
              <article
                key={`${clean(row.id)}-${index}`}
                style={{
                  border: "1px solid rgba(255,255,255,.12)",
                  borderRadius: 22,
                  padding: 16,
                  background: "rgba(255,255,255,.045)",
                }}
              >
                <h3 style={{ margin: "0 0 8px" }}>{subject(row)}</h3>
                <p style={{ color: "#cbd5e1", lineHeight: 1.55 }}>{body(row)}</p>

                <div>
                  {from(row) ? <span style={chip}>From: {from(row)}</span> : null}
                  {to(row) ? <span style={chip}>To: {to(row)}</span> : null}
                  {signal(row) ? <span style={chip}>Signal: {signal(row)}</span> : null}
                  {item(row) ? <span style={chip}>Item: {item(row)}</span> : null}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section style={card}>
          <h2 style={{ marginTop: 0 }}>Reply / Message</h2>
          <textarea
            value={reply}
            onChange={(event) => setReply(event.target.value)}
            placeholder="Write a message..."
            style={{ ...input, minHeight: 160, resize: "vertical" }}
          />

          <button
            type="button"
            onClick={sendReply}
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
