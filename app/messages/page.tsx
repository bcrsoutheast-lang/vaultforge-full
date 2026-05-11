"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Message = Record<string, any>;

type PageProps = { params: Promise<{ threadId: string }> | { threadId: string } };

const OWNER_EMAIL = "bcrsoutheast@gmail.com";

function getStoredEmail() {
  if (typeof window === "undefined") return "";
  const url = new URL(window.location.href);
  const fromUrl = String(url.searchParams.get("email") || "").trim().toLowerCase();
  if (fromUrl.includes("@")) return fromUrl;
  const keys = ["vf_email", "vf_member_email", "vf_admin_email", "email", "member_email"];
  for (const key of keys) {
    const value = String(window.localStorage.getItem(key) || "").trim().toLowerCase();
    if (value && value.includes("@")) return value;
  }
  return "";
}

function fmtDate(value: any) {
  const date = new Date(value || "");
  if (Number.isNaN(date.getTime())) return "Recent";
  return date.toLocaleString();
}

const page: React.CSSProperties = { minHeight: "100vh", background: "radial-gradient(circle at top left, rgba(232,196,107,.14), transparent 30%), linear-gradient(180deg,#030509,#071326 55%,#030509)", color: "white", padding: "28px 18px 90px", fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" };
const shell: React.CSSProperties = { maxWidth: 1050, margin: "0 auto" };
const card: React.CSSProperties = { border: "1px solid rgba(232,196,107,.28)", borderRadius: 28, background: "linear-gradient(135deg,rgba(45,35,24,.86),rgba(24,21,57,.84) 45%,rgba(5,17,31,.9))", boxShadow: "0 24px 90px rgba(0,0,0,.35)", padding: 28, marginBottom: 24 };
const h1: React.CSSProperties = { fontSize: "clamp(48px,9vw,96px)", lineHeight: .9, margin: "12px 0 20px", letterSpacing: "-0.075em" };
const eyebrow: React.CSSProperties = { color: "#9ff5bd", letterSpacing: ".34em", textTransform: "uppercase", fontWeight: 900, fontSize: 14 };
const muted: React.CSSProperties = { color: "rgba(255,255,255,.68)", lineHeight: 1.55 };
const button: React.CSSProperties = { display: "inline-flex", alignItems: "center", justifyContent: "center", minHeight: 52, padding: "0 20px", borderRadius: 999, border: "1px solid rgba(255,255,255,.14)", color: "white", textDecoration: "none", fontWeight: 900, background: "rgba(255,255,255,.07)" };
const goldButton: React.CSSProperties = { ...button, color: "#06110d", background: "linear-gradient(135deg,#f7e779,#8ff0b6 55%,#b266ff)", border: 0 };
const input: React.CSSProperties = { width: "100%", minHeight: 56, borderRadius: 18, border: "1px solid rgba(255,255,255,.16)", background: "rgba(255,255,255,.08)", color: "white", padding: "0 18px", fontSize: 16, outline: "none", boxSizing: "border-box" };
const textarea: React.CSSProperties = { ...input, minHeight: 160, padding: 18, resize: "vertical" };

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
    const active = email.toLowerCase();
    const found = messages.find((message) => message.from_email && message.from_email !== active)?.from_email || messages.find((message) => message.to_email && message.to_email !== active)?.to_email;
    return found || OWNER_EMAIL;
  }, [messages, email]);

  async function load(activeThread = threadId, nextEmail = email) {
    if (!activeThread) return;
    const activeEmail = String(nextEmail || getStoredEmail() || "").trim().toLowerCase();
    setEmail(activeEmail);
    setLoading(true);
    setError("");
    try {
      const owner = activeEmail === OWNER_EMAIL ? "&owner=1" : "";
      const res = await fetch(`/api/messages/thread?threadId=${encodeURIComponent(activeThread)}&email=${encodeURIComponent(activeEmail)}${owner}`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || json.details || "Thread load failed.");
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
        headers: { "Content-Type": "application/json", "x-vf-email": email },
        body: JSON.stringify({
          from_email: email,
          to_email: otherEmail,
          subject: latest.subject || "VaultForge message reply",
          body: text,
          thread_id: threadId,
          signal_id: latest.signal_id || "",
          item_id: latest.item_id || "",
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || json.details || "Reply could not be saved.");
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
      <div style={shell}>
        <section style={card}>
          <div style={eyebrow}>VaultForge Message Thread</div>
          <h1 style={h1}>Execution conversation.</h1>
          <p style={{ ...muted, maxWidth: 760, fontSize: 20 }}>Controlled thread for requests, owner replies, routing updates, and introductions before private contact details are released.</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 22 }}>
            <span style={button}>Signed in: {email || "not detected"}</span>
            <span style={button}>Thread: {threadId || "loading"}</span>
            <button style={goldButton} onClick={() => load(threadId, email)}>Refresh Thread</button>
            <Link href="/messages" style={button}>All Messages</Link>
            <Link href="/pain-feed" style={button}>Pain Feed</Link>
            <Link href="/dashboard" style={button}>Dashboard</Link>
          </div>
        </section>

        {loading ? (
          <section style={card}><p style={muted}>Loading thread...</p></section>
        ) : error ? (
          <section style={card}><h2 style={{ color: "#ffd0d0" }}>Thread failed to load.</h2><p style={muted}>{error}</p></section>
        ) : messages.length === 0 ? (
          <section style={card}><p style={muted}>No messages found in this thread yet.</p></section>
        ) : (
          <section style={card}>
            <div style={eyebrow}>Thread Messages</div>
            <div style={{ display: "grid", gap: 14, marginTop: 20 }}>
              {messages.map((message) => {
                const mine = String(message.from_email || "").toLowerCase() === email;
                return (
                  <article key={`${message._source_table || "msg"}-${message.id}-${message.created_at}`} style={{ maxWidth: 760, justifySelf: mine ? "end" : "start", border: "1px solid rgba(255,255,255,.12)", borderRadius: 24, background: mine ? "rgba(159,245,189,.12)" : "rgba(255,255,255,.06)", padding: 20 }}>
                    <strong>{message.subject || "VaultForge message"}</strong>
                    <p style={{ ...muted, margin: "8px 0 12px" }}>{message.body || message.message || "No message body."}</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      <span style={{ ...button, minHeight: 32, padding: "0 10px", fontSize: 12 }}>From: {message.from_email || "unknown"}</span>
                      <span style={{ ...button, minHeight: 32, padding: "0 10px", fontSize: 12 }}>{fmtDate(message.created_at)}</span>
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
            <textarea style={textarea} value={reply} onChange={(event) => setReply(event.target.value)} placeholder="Write a controlled VaultForge reply..." />
            <button style={goldButton} onClick={sendReply} disabled={sending || !reply.trim()}>{sending ? "Saving..." : "Send Reply"}</button>
            {toast ? <p style={muted}>{toast}</p> : null}
          </div>
        </section>
      </div>
    </main>
  );
}
