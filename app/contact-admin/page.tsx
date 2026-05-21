"use client";

import Link from "next/link";
import { useState } from "react";

const ADMIN_MESSAGES_KEY = "vaultforge_admin_messages_v1";

function clean(value: unknown, fallback = "") { const text = String(value || "").trim(); return text || fallback; }
function currentEmail() {
  try { const profile = JSON.parse(localStorage.getItem("vaultforge_profile") || "{}"); return clean(profile.email || localStorage.getItem("vf_email") || localStorage.getItem("member_email")); }
  catch { return clean(localStorage.getItem("vf_email") || localStorage.getItem("member_email")); }
}
function saveAdminMessage(topic: string, body: string) {
  let rows: any[] = [];
  try { const parsed = JSON.parse(localStorage.getItem(ADMIN_MESSAGES_KEY) || "[]"); rows = Array.isArray(parsed) ? parsed : []; } catch { rows = []; }
  rows.unshift({ id: `admin-msg-${Date.now()}`, topic, body, email: currentEmail() || "email-not-listed", status: "open", priority: topic.includes("Payment") || topic.includes("Access") ? "high" : "normal", createdAt: new Date().toISOString() });
  localStorage.setItem(ADMIN_MESSAGES_KEY, JSON.stringify(rows));
  window.dispatchEvent(new Event("vaultforge-admin-message-change"));
}

const page: React.CSSProperties = { minHeight: "100vh", background: "#05070d", color: "#f7f7fb", padding: 18, fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" };
const wrap: React.CSSProperties = { maxWidth: 760, margin: "0 auto", paddingBottom: 80 };
const hero: React.CSSProperties = { border: "1px solid rgba(245,197,66,.28)", borderRadius: 30, padding: 30, marginBottom: 20, background: "linear-gradient(180deg,#080d19,#050816)" };
const eyebrow: React.CSSProperties = { color: "#ffd45a", textTransform: "uppercase", letterSpacing: 6, fontWeight: 950, fontSize: 13, marginBottom: 12 };
const h1: React.CSSProperties = { fontSize: "clamp(42px,7vw,76px)", lineHeight: 0.9, letterSpacing: -4, margin: "0 0 18px", fontWeight: 950 };
const sub: React.CSSProperties = { color: "#c9d0dc", fontSize: 20, lineHeight: 1.35, margin: 0 };
const input: React.CSSProperties = { width: "100%", boxSizing: "border-box", border: "1px solid rgba(207,216,230,.18)", background: "#111823", color: "#f8fafc", borderRadius: 16, padding: "14px 15px", fontSize: 16 };
const field: React.CSSProperties = { display: "grid", gap: 8, marginTop: 16 };
const row: React.CSSProperties = { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginTop: 18 };
const btn: React.CSSProperties = { border: "1px solid rgba(207,216,230,.18)", background: "#171c29", color: "#f7f7fb", borderRadius: 999, padding: "13px 18px", fontWeight: 950, textDecoration: "none", display: "inline-block", cursor: "pointer" };
const goldBtn: React.CSSProperties = { ...btn, border: 0, background: "#ffdc68", color: "#10131a" };

export default function ContactAdminPage() {
  const [topic, setTopic] = useState("Access / Payment");
  const [body, setBody] = useState("");
  const [sent, setSent] = useState(false);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!body.trim()) return;
    saveAdminMessage(topic, body);
    setSent(true);
    setBody("");
  }

  return (
    <main style={page}>
      <div style={wrap}>
        <section style={hero}>
          <div style={eyebrow}>Contact Admin</div>
          <h1 style={h1}>Message Admin Command.</h1>
          <p style={sub}>Use this for access, payment approval, account issues, deal escalation, pain escalation, or platform support.</p>
          <form onSubmit={submit}>
            <label style={field}><span style={eyebrow}>Topic</span><select style={input} value={topic} onChange={(event) => setTopic(event.target.value)}><option>Access / Payment</option><option>Profile Review</option><option>Deal Escalation</option><option>Pain Escalation</option><option>Technical Problem</option><option>General Admin Support</option></select></label>
            <label style={field}><span style={eyebrow}>Message</span><textarea style={{ ...input, minHeight: 170 }} value={body} onChange={(event) => setBody(event.target.value)} placeholder="Tell admin what you need..." /></label>
            <div style={row}><button type="submit" style={goldBtn}>Send to Admin</button><Link href="/command" style={btn}>Back to Command</Link></div>
          </form>
          {sent ? <p style={{ ...sub, marginTop: 18 }}>Sent to Admin Command.</p> : null}
        </section>
      </div>
    </main>
  );
}
