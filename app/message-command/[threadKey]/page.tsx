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

function readCookie(name: string) {
  if (typeof document === "undefined") return "";
  const match = document.cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  if (!match) return "";
  try { return decodeURIComponent(match.slice(name.length + 1)); } catch { return match.slice(name.length + 1); }
}

function currentEmail() {
  if (typeof window === "undefined") return "";

  for (const key of ["vf_email", "vf_member_email", "vf_admin_email", "email", "memberEmail"]) {
    const local = lower(window.localStorage.getItem(key));
    if (local.includes("@")) return local;

    const session = lower(window.sessionStorage.getItem(key));
    if (session.includes("@")) return session;
  }

  return lower(readCookie("vf_email") || readCookie("vf_member_email") || readCookie("vf_admin_email"));
}

async function safeJson(res: Response) {
  try { return await res.json(); } catch { return {}; }
}

function titleOf(row: MessageRow) {
  return clean(row.title || row.subject || "VaultForge message").replace(/^(re:\s*)+/gi, "");
}

function bodyOf(row: MessageRow) {
  return clean(row.message || row.body || row.note || "");
}

function sourceOfThread(threadKey: string) {
  const key = lower(threadKey);
  if (key.includes(":")) return key.split(":")[0] || "message";
  return "message";
}

function folderForSource(source: string) {
  if (source === "alert") return "alerts";
  if (source === "pain") return "pain";
  if (source === "signal") return "signals";
  if (source === "routing") return "routing";
  if (source === "introduction") return "introductions";
  if (source === "project") return "projects";
  if (source === "member") return "members";
  if (source === "activity") return "activity";
  return "general";
}

function routeFromFolder(folder: string) {
  return folder || "general";
}

export default function MessageThreadPage({ params }: { params: { threadKey: string } }) {
  const threadKey = decodeURIComponent(params.threadKey || "");
  const source = sourceOfThread(threadKey);
  const folder = folderForSource(source);

  const [email, setEmail] = useState("");
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [reply, setReply] = useState("");
  const [status, setStatus] = useState("Loading message room...");
  const [busy, setBusy] = useState(false);
  const [busyAction, setBusyAction] = useState("");

  const title = useMemo(() => {
    if (typeof window === "undefined") return "Message Room";
    return clean(new URLSearchParams(window.location.search).get("title") || "Message Room");
  }, []);

  const backHref = `/message-command?route=${encodeURIComponent(routeFromFolder(folder))}`;

  async function load() {
    const viewer = currentEmail();
    setEmail(viewer);
    setStatus("Loading message room...");

    try {
      const res = await fetch(`/api/message-command?mode=thread&thread_key=${encodeURIComponent(threadKey)}&email=${encodeURIComponent(viewer)}`, {
        cache: "no-store",
        headers: { "x-vf-email": viewer },
      });

      const data = await safeJson(res);
      setMessages(Array.isArray(data.messages) ? data.messages : []);
      setStatus("");
    } catch (error: any) {
      setStatus(error?.message || "Could not load message room.");
    }
  }

  useEffect(() => {
    load();
  }, [threadKey]);

  async function sendReply() {
    const text = clean(reply);

    if (!text) {
      setStatus("Write a message first.");
      return;
    }

    const viewer = email || currentEmail();

    if (!viewer.includes("@")) {
      setStatus("Missing signed-in email.");
      return;
    }

    const latest = messages[messages.length - 1] || {};
    const latestFrom = lower(latest.from_email);
    const latestTo = lower(latest.to_email || latest.owner_email);
    const toEmail = latestFrom && latestFrom !== viewer ? latestFrom : latestTo || "bcrsoutheast@gmail.com";

    setBusy(true);
    setStatus("Sending reply...");

    try {
      const res = await fetch("/api/message-command", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-vf-email": viewer,
        },
        body: JSON.stringify({
          thread_key: threadKey,
          source,
          folder,
          from_email: viewer,
          to_email: toEmail,
          subject: titleOf(latest) || title,
          title: titleOf(latest) || title,
          message: text,
          body: text,
          note: text,
        }),
      });

      const data = await safeJson(res);

      if (!res.ok || data?.ok === false) {
        throw new Error(data?.details || data?.error || "Message could not be sent.");
      }

      setReply("");
      await load();
      setStatus("Reply sent.");
    } catch (error: any) {
      setStatus(error?.message || "Message could not be sent.");
    } finally {
      setBusy(false);
    }
  }

  async function cleanup(ids: string[], action: "archive" | "delete") {
    const cleanIds = ids.map(clean).filter(Boolean);

    if (!cleanIds.length) {
      setStatus("No saved message IDs found.");
      return;
    }

    setBusyAction(action);
    setStatus(action === "archive" ? "Archiving..." : "Deleting...");

    try {
      const res = await fetch("/api/message-command", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-vf-email": email,
        },
        body: JSON.stringify({
          action,
          ids: cleanIds,
          email,
          thread_key: cleanIds.length === messages.length ? threadKey : "",
          action_scope: cleanIds.length === messages.length ? "thread" : "message",
        }),
      });

      const data = await safeJson(res);

      if (!res.ok || data?.ok === false) {
        throw new Error(data?.details || data?.error || "Cleanup failed.");
      }

      if (cleanIds.length === messages.length) {
        window.location.href = backHref;
        return;
      }

      setMessages((current) => current.filter((row) => !cleanIds.includes(clean(row.id))));
      setStatus(action === "archive" ? "Archived." : "Deleted.");
    } catch (error: any) {
      setStatus(error?.message || "Cleanup failed.");
    } finally {
      setBusyAction("");
    }
  }

  const allIds = messages.map((message) => clean(message.id)).filter(Boolean);

  return (
    <main style={page}>
      <style>{`
        a:hover, button:hover { transform: translateY(-1px); filter: brightness(1.06); transition: all .16s ease; }
        textarea::placeholder { color: rgba(255,255,255,.45); }
        @media (max-width: 760px) {
          .vf-actions { display: grid !important; grid-template-columns: 1fr !important; }
          .vf-actions > * { width: 100%; box-sizing: border-box; justify-content: center; }
        }
      `}</style>

      <div style={wrap}>
        <nav style={nav}>
          <Link href={backHref} style={navButtonActive}>Back to {folder}</Link>
          <Link href="/message-command" style={navButton}>All Cards</Link>
          <Link href="/dashboard" style={navButton}>Dashboard</Link>
          <Link href="/alerts" style={navButton}>Alerts</Link>
          <Link href="/pain-feed" style={navButton}>Pain Feed</Link>
        </nav>

        <section style={hero}>
          <div style={eyebrow}>VaultForge Message Room</div>
          <h1 style={heroTitle}>{title}</h1>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span style={chip}>Thread: {threadKey}</span>
            <span style={chip}>Lane: {folder}</span>
            <span style={chip}>Messages: {messages.length}</span>
          </div>

          <div className="vf-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
            <Link href={backHref} style={button}>Close / Back to Lane</Link>
            <button type="button" onClick={load} style={ghost}>Refresh</button>
            <button type="button" onClick={() => cleanup(allIds, "archive")} disabled={!!busyAction || !allIds.length} style={ghost}>
              {busyAction === "archive" ? "Archiving..." : "Archive Thread"}
            </button>
            <button type="button" onClick={() => cleanup(allIds, "delete")} disabled={!!busyAction || !allIds.length} style={danger}>
              {busyAction === "delete" ? "Deleting..." : "Delete Thread"}
            </button>
          </div>
        </section>

        <section style={{ display: "grid", gap: 16 }}>
          {messages.map((message) => (
            <article key={message.id || `${message.created_at}-${message.message}`} style={card}>
              <h2 style={msgTitle}>{titleOf(message)}</h2>
              <p style={body}>{bodyOf(message)}</p>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <span style={chip}>From: {message.from_email || "unknown"}</span>
                <span style={chip}>To: {message.to_email || "unknown"}</span>
                <span style={chip}>{message.created_at || ""}</span>
              </div>

              {message.id ? (
                <div className="vf-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
                  <button type="button" onClick={() => cleanup([message.id], "archive")} disabled={!!busyAction} style={ghost}>Archive Message</button>
                  <button type="button" onClick={() => cleanup([message.id], "delete")} disabled={!!busyAction} style={danger}>Delete Message</button>
                </div>
              ) : null}
            </article>
          ))}
        </section>

        <section style={hero}>
          <h2 style={{ marginTop: 0 }}>Reply</h2>

          <textarea
            value={reply}
            onChange={(event) => setReply(event.target.value)}
            placeholder="Write your reply..."
            style={textarea}
          />

          <button type="button" onClick={sendReply} disabled={busy} style={{ ...button, opacity: busy ? .65 : 1 }}>
            {busy ? "Sending..." : "Send Reply"}
          </button>
        </section>

        {status ? <section style={hero}>{status}</section> : null}
      </div>
    </main>
  );
}

const page: React.CSSProperties = { minHeight: "100vh", background: "radial-gradient(circle at top left, rgba(232,196,107,.14), transparent 28%), linear-gradient(180deg,#020303,#071326 55%,#020303)", color: "white", padding: "22px 16px 96px", fontFamily: "Arial, sans-serif" };
const wrap: React.CSSProperties = { width: "min(980px,100%)", margin: "0 auto" };
const nav: React.CSSProperties = { display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 18 };
const navButton: React.CSSProperties = { display: "inline-flex", justifyContent: "center", alignItems: "center", borderRadius: 999, padding: "12px 16px", background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.14)", color: "white", textDecoration: "none", fontWeight: 800 };
const navButtonActive: React.CSSProperties = { ...navButton, background: "rgba(232,196,107,.14)", border: "1px solid rgba(232,196,107,.28)", color: "#f8e7b0" };
const hero: React.CSSProperties = { border: "1px solid rgba(232,196,107,.22)", borderRadius: 30, padding: 24, marginBottom: 18, background: "linear-gradient(145deg,rgba(255,255,255,.07),rgba(255,255,255,.025))" };
const eyebrow: React.CSSProperties = { color: "#e8c46b", letterSpacing: ".18em", textTransform: "uppercase", fontWeight: 950, fontSize: 12 };
const heroTitle: React.CSSProperties = { fontSize: "clamp(48px,10vw,92px)", lineHeight: .88, letterSpacing: "-.07em", margin: "12px 0 18px" };
const card: React.CSSProperties = { border: "1px solid rgba(255,255,255,.12)", borderRadius: 24, padding: 20, background: "rgba(255,255,255,.035)" };
const msgTitle: React.CSSProperties = { fontSize: 28, margin: "0 0 12px" };
const body: React.CSSProperties = { color: "#dbeafe", fontSize: 19, lineHeight: 1.55 };
const chip: React.CSSProperties = { borderRadius: 999, border: "1px solid rgba(255,255,255,.12)", padding: "8px 12px", fontSize: 12, color: "#dbeafe", display: "inline-flex" };
const textarea: React.CSSProperties = { width: "100%", boxSizing: "border-box", minHeight: 170, borderRadius: 18, background: "#081224", color: "white", padding: 16, border: "1px solid rgba(255,255,255,.12)", marginBottom: 16, outline: "none", fontSize: 16 };
const button: React.CSSProperties = { display: "inline-flex", justifyContent: "center", alignItems: "center", borderRadius: 999, padding: "14px 20px", background: "linear-gradient(135deg,#f8e7b0,#e8c46b)", color: "#06100a", textDecoration: "none", fontWeight: 950, border: 0, cursor: "pointer" };
const ghost: React.CSSProperties = { ...button, background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.14)", color: "white" };
const danger: React.CSSProperties = { ...button, background: "rgba(248,113,113,.12)", border: "1px solid rgba(248,113,113,.28)", color: "#fecaca" };
