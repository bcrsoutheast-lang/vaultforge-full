"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Message = Record<string, any>;
function clean(value: unknown) { return String(value || "").trim(); }
function cleanEmail(value: unknown) { return clean(value).toLowerCase(); }
function readCookie(name: string) { if (typeof document === "undefined") return ""; const match = document.cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`)); if (!match) return ""; try { return decodeURIComponent(match.slice(name.length + 1)); } catch { return match.slice(name.length + 1); } }
function getEmail() { if (typeof window === "undefined") return ""; return cleanEmail(localStorage.getItem("vf_email") || sessionStorage.getItem("vf_email") || readCookie("vf_email") || readCookie("vf_member_email") || readCookie("vf_admin_email")); }
async function safeJson(res: Response) { try { return await res.json(); } catch { return {}; } }

const page: React.CSSProperties = { minHeight: "100vh", background: "linear-gradient(180deg,#020303,#071326 55%,#020303)", color: "white", padding: "22px 16px 82px", fontFamily: "Arial, sans-serif" };
const wrap: React.CSSProperties = { width: "min(980px,100%)", margin: "0 auto" };
const card: React.CSSProperties = { border: "1px solid rgba(232,196,107,.28)", borderRadius: 28, padding: 24, background: "rgba(255,255,255,.06)", marginBottom: 16 };
const eyebrow: React.CSSProperties = { color: "#e8c46b", letterSpacing: ".18em", textTransform: "uppercase", fontWeight: 950, fontSize: 12 };
const muted: React.CSSProperties = { color: "#cbd5e1", lineHeight: 1.55 };
const btn: React.CSSProperties = { display: "inline-flex", justifyContent: "center", alignItems: "center", minHeight: 46, borderRadius: 999, padding: "12px 16px", border: 0, background: "#e8c46b", color: "#06100a", fontWeight: 950, textDecoration: "none", cursor: "pointer" };
const ghost: React.CSSProperties = { ...btn, background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.16)", color: "white" };

export default function SimpleMessagesInbox() {
  const [email, setEmail] = useState("");
  const [threads, setThreads] = useState<Message[]>([]);
  const [status, setStatus] = useState("Loading messages...");

  async function load() {
    const viewer = getEmail();
    setEmail(viewer);
    setStatus("Loading messages...");
    try {
      const res = await fetch(`/api/simple-messages?email=${encodeURIComponent(viewer)}`, { cache: "no-store", headers: { "x-vf-email": viewer } });
      const data = await safeJson(res);
      if (!res.ok || data?.ok === false) throw new Error(data?.error || "Could not load messages.");
      setThreads(Array.isArray(data.threads) ? data.threads : []);
      setStatus("");
    } catch (error: any) {
      setStatus(error?.message || "Could not load messages.");
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <main style={page}><div style={wrap}>
      <section style={card}><p style={eyebrow}>VaultForge Simple Messages</p><h1 style={{ fontSize: "clamp(48px,11vw,86px)", lineHeight: 0.9, margin: "10px 0 18px" }}>Inbox.</h1><p style={muted}>Simple owner/member communication. Message and reply.</p><p style={muted}>Signed in: {email || "unknown"}</p><div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}><button type="button" onClick={load} style={btn}>Refresh</button><Link href="/pain-feed" style={ghost}>Pain Feed</Link><Link href="/signals" style={ghost}>Signals</Link><Link href="/dashboard" style={ghost}>Dashboard</Link></div></section>
      {status ? <section style={card}>{status}</section> : null}
      {threads.length === 0 && !status ? <section style={card}>No messages yet.</section> : null}
      {threads.map((thread) => <Link key={thread.thread_id} href={`/messages/${encodeURIComponent(thread.thread_id)}?email=${encodeURIComponent(email)}`} style={{ ...card, display: "block", textDecoration: "none", color: "white" }}><p style={eyebrow}>Thread</p><h2>{thread.subject || "VaultForge message"}</h2><p style={muted}>{thread.body || "Open conversation."}</p><p style={{ color: "#94a3b8", fontSize: 13 }}>From {thread.from_email} to {thread.to_email}</p></Link>)}
    </div></main>
  );
}
