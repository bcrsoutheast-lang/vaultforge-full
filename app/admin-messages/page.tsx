"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const OWNER_EMAIL = "bcrsoutheast@gmail.com";
const ADMIN_MESSAGES_KEY = "vaultforge_admin_messages_v1";

type AdminMessage = { id: string; topic: string; body: string; email: string; status: string; priority: string; createdAt: string; };

function clean(value: unknown) { return String(value || "").trim().toLowerCase(); }
function currentEmail() {
  try { const profile = JSON.parse(localStorage.getItem("vaultforge_profile") || "{}"); return clean(profile.email || localStorage.getItem("vf_email") || localStorage.getItem("member_email")); }
  catch { return clean(localStorage.getItem("vf_email") || localStorage.getItem("member_email")); }
}
function readMessages(): AdminMessage[] {
  try { const parsed = JSON.parse(localStorage.getItem(ADMIN_MESSAGES_KEY) || "[]"); return Array.isArray(parsed) ? parsed : []; } catch { return []; }
}
function writeMessages(rows: AdminMessage[]) { localStorage.setItem(ADMIN_MESSAGES_KEY, JSON.stringify(rows)); window.dispatchEvent(new Event("vaultforge-admin-message-change")); }

const page: React.CSSProperties = { minHeight: "100vh", background: "#080b10", color: "#f6f7fb", padding: 18, fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" };
const wrap: React.CSSProperties = { maxWidth: 1200, margin: "0 auto", paddingBottom: 80 };
const hero: React.CSSProperties = { border: "1px solid rgba(255,255,255,.10)", borderRadius: 22, padding: 28, marginBottom: 18, background: "linear-gradient(180deg,#0e1420,#090d14)" };
const panel: React.CSSProperties = { background: "#111823", border: "1px solid rgba(207,216,230,.14)", borderRadius: 18, padding: 18, marginBottom: 14 };
const urgent: React.CSSProperties = { ...panel, borderColor: "rgba(255,70,70,.55)" };
const eyebrow: React.CSSProperties = { color: "#ffd45a", textTransform: "uppercase", letterSpacing: 5, fontWeight: 950, fontSize: 12, marginBottom: 10 };
const h1: React.CSSProperties = { fontSize: "clamp(36px,6vw,64px)", lineHeight: 0.95, letterSpacing: -3, margin: "0 0 14px", fontWeight: 950 };
const h2: React.CSSProperties = { fontSize: "clamp(24px,4vw,38px)", lineHeight: 1, letterSpacing: -1.5, margin: "0 0 12px", fontWeight: 950 };
const sub: React.CSSProperties = { color: "#c9d0dc", fontSize: 18, lineHeight: 1.35, margin: 0 };
const muted: React.CSSProperties = { color: "#aeb7c7", margin: "7px 0 0", lineHeight: 1.35 };
const row: React.CSSProperties = { display: "flex", gap: 9, flexWrap: "wrap", alignItems: "center", marginTop: 12 };
const btn: React.CSSProperties = { border: "1px solid rgba(207,216,230,.18)", background: "#171c29", color: "#f7f7fb", borderRadius: 999, padding: "11px 15px", fontWeight: 900, textDecoration: "none", display: "inline-block", cursor: "pointer" };
const goldBtn: React.CSSProperties = { ...btn, border: 0, background: "#ffdc68", color: "#10131a" };
const redBtn: React.CSSProperties = { ...btn, background: "#251015", borderColor: "rgba(255,70,70,.52)", color: "#ffaaaa" };

export default function AdminMessagesPage() {
  const [email, setEmail] = useState("");
  const [messages, setMessages] = useState<AdminMessage[]>([]);

  useEffect(() => {
    setEmail(currentEmail());
    setMessages(readMessages());
    const refresh = () => setMessages(readMessages());
    window.addEventListener("storage", refresh);
    window.addEventListener("vaultforge-admin-message-change", refresh);
    return () => { window.removeEventListener("storage", refresh); window.removeEventListener("vaultforge-admin-message-change", refresh); };
  }, []);

  const allowed = email === OWNER_EMAIL;
  const open = useMemo(() => messages.filter((message) => message.status !== "resolved" && message.status !== "deleted"), [messages]);

  function patch(id: string, status: string) {
    const next = messages.map((message) => message.id === id ? { ...message, status } : message);
    setMessages(next);
    writeMessages(next);
  }

  if (!allowed) {
    return <main style={page}><div style={wrap}><section style={hero}><div style={eyebrow}>Admin Messages Locked</div><h1 style={h1}>Owner only.</h1><p style={sub}>Detected email: {email || "not detected"}</p><div style={row}><Link href="/command" style={goldBtn}>Back to Command</Link></div></section></div></main>;
  }

  return (
    <main style={page}>
      <div style={wrap}>
        <section style={hero}><div style={eyebrow}>Admin Command Messages</div><h1 style={h1}>Member support inbox.</h1><p style={sub}>Access requests, payment issues, deal escalation, pain escalation, and support messages.</p><div style={row}><Link href="/admin" style={goldBtn}>Admin Command</Link><Link href="/command" style={btn}>Member View</Link></div></section>
        <section style={hero}><div style={eyebrow}>Open Messages</div><h2 style={h2}>{open.length}</h2><p style={muted}>unresolved admin message(s)</p></section>
        {messages.length ? messages.map((message) => (
          <article key={message.id} style={message.priority === "high" && message.status !== "resolved" ? urgent : panel}>
            <div style={eyebrow}>{message.topic} • {message.priority} • {message.status}</div>
            <h2 style={h2}>{message.email}</h2>
            <p style={sub}>{message.body}</p>
            <p style={muted}>{new Date(message.createdAt).toLocaleString()}</p>
            <div style={row}><button type="button" style={goldBtn} onClick={() => patch(message.id, "open")}>Open</button><button type="button" style={btn} onClick={() => patch(message.id, "reviewing")}>Reviewing</button><button type="button" style={btn} onClick={() => patch(message.id, "resolved")}>Resolved</button><button type="button" style={redBtn} onClick={() => patch(message.id, "deleted")}>Delete</button></div>
          </article>
        )) : <section style={panel}><h2 style={h2}>No admin messages yet.</h2><p style={sub}>Member Contact Admin messages will appear here.</p></section>}
      </div>
    </main>
  );
}
