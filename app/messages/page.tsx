"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Thread = Record<string, any>;
type Message = Record<string, any>;
type Toast = { type: "success" | "error" | "info"; text: string };

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(232,196,107,.16), transparent 30%), linear-gradient(180deg,#030509,#071326 55%,#030509)",
  color: "white",
  padding: "28px 18px 90px",
  fontFamily: "Arial, sans-serif",
};

const wrap: React.CSSProperties = { maxWidth: 1180, margin: "0 auto" };
const nav: React.CSSProperties = { display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 20 };
const btn: React.CSSProperties = { display: "inline-block", background: "#f5d978", color: "#06100a", border: "none", borderRadius: 999, padding: "12px 16px", fontWeight: 900, textDecoration: "none", margin: "6px 6px 0 0", cursor: "pointer" };
const ghost: React.CSSProperties = { display: "inline-block", background: "rgba(255,255,255,.04)", color: "white", border: "1px solid rgba(255,255,255,.16)", borderRadius: 999, padding: "12px 16px", fontWeight: 900, textDecoration: "none", margin: "6px 6px 0 0", cursor: "pointer" };
const hero: React.CSSProperties = { border: "1px solid rgba(232,196,107,.28)", background: "rgba(255,255,255,.045)", borderRadius: 34, padding: 24, marginBottom: 22 };
const layout: React.CSSProperties = { display: "grid", gridTemplateColumns: "minmax(280px, 420px) 1fr", gap: 18 };
const panel: React.CSSProperties = { border: "1px solid rgba(255,255,255,.13)", background: "rgba(255,255,255,.04)", borderRadius: 28, padding: 18 };
const threadCard: React.CSSProperties = { border: "1px solid rgba(255,255,255,.12)", background: "rgba(0,0,0,.18)", borderRadius: 22, padding: 16, marginBottom: 12, cursor: "pointer" };
const activeThread: React.CSSProperties = { ...threadCard, borderColor: "rgba(157,243,191,.55)", background: "rgba(157,243,191,.08)" };
const input: React.CSSProperties = { width: "100%", boxSizing: "border-box", borderRadius: 18, border: "1px solid rgba(255,255,255,.16)", background: "rgba(255,255,255,.075)", color: "white", padding: 14, fontSize: 16 };
const eyebrow: React.CSSProperties = { color: "#e8c46b", letterSpacing: 5, fontWeight: 900, fontSize: 12, marginBottom: 12, textTransform: "uppercase" };
const muted: React.CSSProperties = { color: "rgba(255,255,255,.68)", lineHeight: 1.5 };

function getEmail() {
  if (typeof window === "undefined") return "";
  return (localStorage.getItem("vf_email") || sessionStorage.getItem("vf_email") || "text@text.com").trim().toLowerCase();
}

function money(value: any) {
  const n = Number(value || 0);
  if (!n) return "";
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function preview(thread: Thread) {
  const msg = thread.latest_message || {};
  return String(msg.body || msg.message || msg.subject || "No message yet").slice(0, 120);
}

function ToastBox({ toast }: { toast: Toast | null }) {
  if (!toast) return null;
  const border = toast.type === "success" ? "rgba(157,243,191,.55)" : toast.type === "error" ? "rgba(255,120,120,.45)" : "rgba(232,196,107,.45)";
  const color = toast.type === "success" ? "#9df3bf" : toast.type === "error" ? "#ffd0d0" : "#e8c46b";
  return (
    <div style={{ position: "fixed", top: 18, left: "50%", transform: "translateX(-50%)", zIndex: 50, width: "calc(100% - 32px)", maxWidth: 620, border: `1px solid ${border}`, background: "rgba(3,5,9,.94)", boxShadow: "0 24px 80px rgba(0,0,0,.45)", borderRadius: 24, padding: "16px 18px", color, fontWeight: 900, textAlign: "center" }}>
      {toast.text}
    </div>
  );
}

export default function MessagesPage() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selected, setSelected] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [deal, setDeal] = useState<any>(null);
  const [reply, setReply] = useState("");
  const [status, setStatus] = useState("Loading messages...");
  const [threadStatus, setThreadStatus] = useState("");
  const [toast, setToast] = useState<Toast | null>(null);

  const email = useMemo(() => getEmail(), []);

  function showToast(next: Toast) {
    setToast(next);
    window.setTimeout(() => setToast(null), 1800);
  }

  async function loadThreads() {
    setStatus("Loading messages...");
    try {
      const res = await fetch("/api/messages/list", { cache: "no-store", headers: { "x-vf-email": getEmail() } });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || data?.details || "Could not load messages.");
      setThreads(data?.threads || []);
      setStatus("");
    } catch (err: any) {
      setStatus(err?.message || "Could not load messages.");
      showToast({ type: "error", text: err?.message || "Could not load messages." });
    }
  }

  async function openThread(thread: Thread) {
    setSelected(thread);
    setThreadStatus("Loading thread...");
    setMessages([]);
    setDeal(thread.deal || null);

    try {
      const res = await fetch(`/api/messages/thread?thread_key=${encodeURIComponent(thread.thread_key)}`, { cache: "no-store", headers: { "x-vf-email": getEmail() } });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || data?.details || "Could not load thread.");
      setMessages(data?.messages || []);
      setDeal(data?.deal || thread.deal || null);
      setThreadStatus("");
      loadThreads();
    } catch (err: any) {
      setThreadStatus(err?.message || "Could not load thread.");
      showToast({ type: "error", text: err?.message || "Could not load thread." });
    }
  }

  async function sendReply() {
    if (!selected || !reply.trim()) return;
    setThreadStatus("Sending reply...");

    try {
      const other = messages.find((m) => m.sender_email !== email)?.sender_email || messages.find((m) => m.recipient_email !== email)?.recipient_email || selected.latest_message?.sender_email || selected.latest_message?.recipient_email;
      const res = await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-vf-email": getEmail() },
        body: JSON.stringify({ deal_id: selected.deal_id, thread_key: selected.thread_key, recipient_email: other, subject: `RE: ${selected.latest_message?.subject || "VaultForge Deal Inquiry"}`, body: reply.trim(), message: reply.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || data?.details || "Could not send reply.");

      setReply("");
      showToast({ type: "success", text: "Reply sent ✓" });
      await openThread(selected);
    } catch (err: any) {
      setThreadStatus(err?.message || "Could not send reply.");
      showToast({ type: "error", text: err?.message || "Could not send reply." });
    }
  }

  async function archiveThread() {
    if (!selected) return;
    const yes = window.confirm("Archive this message thread?");
    if (!yes) return;

    try {
      const res = await fetch("/api/messages/thread", { method: "PATCH", headers: { "Content-Type": "application/json", "x-vf-email": getEmail() }, body: JSON.stringify({ thread_key: selected.thread_key, archived: true }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || data?.details || "Could not archive thread.");
      setSelected(null);
      setMessages([]);
      setDeal(null);
      showToast({ type: "success", text: "Thread archived ✓" });
      await loadThreads();
    } catch (err: any) {
      setThreadStatus(err?.message || "Could not archive thread.");
      showToast({ type: "error", text: err?.message || "Could not archive thread." });
    }
  }

  useEffect(() => { loadThreads(); }, []);

  return (
    <main style={page}>
      <ToastBox toast={toast} />
      <div style={wrap}>
        <nav style={nav}>
          <Link href="/dashboard" style={ghost}>Dashboard</Link>
          <Link href="/projects" style={ghost}>Projects</Link>
          <Link href="/buy-bucket" style={ghost}>Buy Bucket</Link>
          <Link href="/submit" style={btn}>Create Deal</Link>
        </nav>

        <section style={hero}>
          <div style={eyebrow}>Messages</div>
          <h1 style={{ fontSize: "clamp(56px, 12vw, 96px)", lineHeight: .9, margin: "0 0 16px" }}>Deal-tied inbox.</h1>
          <p style={muted}>Messages stay connected to the property/deal room so follow-up does not get buried.</p>
          <button style={btn} onClick={loadThreads}>Refresh Inbox</button>
        </section>

        {status && <section style={hero}>{status}</section>}
        {!status && threads.length === 0 && <section style={hero}>No messages yet. Open a Deal Room and click Message Owner to start a thread.</section>}

        {!status && threads.length > 0 && (
          <section style={layout}>
            <aside style={panel}>
              <div style={eyebrow}>Threads</div>
              {threads.map((thread) => {
                const dealTitle = thread.deal?.title || "Untitled Deal";
                const latest = thread.latest_message || {};
                const isActive = selected?.thread_key === thread.thread_key;
                return (
                  <div key={thread.thread_key} style={isActive ? activeThread : threadCard} onClick={() => openThread(thread)}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                      <strong>{dealTitle}</strong>
                      {thread.unread_count > 0 && <span style={{ background: "#9df3bf", color: "#06100a", borderRadius: 999, padding: "3px 8px", fontWeight: 900, fontSize: 12 }}>{thread.unread_count}</span>}
                    </div>
                    <p style={{ ...muted, margin: "8px 0" }}>{preview(thread)}</p>
                    <small style={{ color: "rgba(255,255,255,.52)" }}>{latest.created_at ? new Date(latest.created_at).toLocaleString() : ""}</small>
                  </div>
                );
              })}
            </aside>

            <section style={panel}>
              {!selected && <div><div style={eyebrow}>Select thread</div><p style={muted}>Choose a thread from the left to read and reply.</p></div>}

              {selected && (
                <>
                  <div style={eyebrow}>Active thread</div>
                  <h2 style={{ fontSize: 38, margin: "0 0 10px" }}>{deal?.title || selected.deal?.title || "Untitled Deal"}</h2>
                  {deal && (
                    <div style={{ border: "1px solid rgba(255,255,255,.12)", background: "rgba(0,0,0,.16)", borderRadius: 22, padding: 14, marginBottom: 16 }}>
                      <p style={{ margin: "0 0 8px", fontWeight: 900 }}>{deal.city || "Unknown City"}, {deal.state || "Unknown State"} {deal.asking_price ? `• ${money(deal.asking_price)}` : ""}</p>
                      <Link href={`/deal/${deal.id || selected.deal_id}`} style={btn}>Open Deal Room</Link>
                    </div>
                  )}

                  {threadStatus && <p style={{ color: threadStatus.includes("Sending") || threadStatus.includes("Loading") ? "#e8c46b" : "#ffd0d0", fontWeight: 900 }}>{threadStatus}</p>}

                  <div style={{ display: "grid", gap: 12, marginBottom: 18 }}>
                    {messages.map((message) => {
                      const mine = message.sender_email === email;
                      return (
                        <div key={message.id} style={{ border: "1px solid rgba(255,255,255,.12)", background: mine ? "rgba(157,243,191,.08)" : "rgba(255,255,255,.04)", borderRadius: 22, padding: 16, marginLeft: mine ? "auto" : 0, maxWidth: "82%" }}>
                          <div style={{ color: mine ? "#9df3bf" : "#e8c46b", fontWeight: 900, marginBottom: 8 }}>{mine ? "You" : message.sender_email}</div>
                          <p style={{ ...muted, margin: 0, color: "rgba(255,255,255,.82)" }}>{message.body || message.message}</p>
                          <small style={{ color: "rgba(255,255,255,.45)" }}>{message.created_at ? new Date(message.created_at).toLocaleString() : ""}</small>
                        </div>
                      );
                    })}
                  </div>

                  <textarea value={reply} onChange={(event) => setReply(event.target.value)} placeholder="Write a reply..." style={{ ...input, minHeight: 120, resize: "vertical" }} />
                  <div style={{ marginTop: 12 }}>
                    <button style={btn} onClick={sendReply}>Send Reply</button>
                    <button style={ghost} onClick={archiveThread}>Archive Thread</button>
                  </div>
                </>
              )}
            </section>
          </section>
        )}
      </div>
    </main>
  );
}
