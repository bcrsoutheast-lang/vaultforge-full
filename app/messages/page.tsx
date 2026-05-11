"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Thread = Record<string, any>;

const OWNER_EMAIL = "bcrsoutheast@gmail.com";

function getStoredEmail() {
  if (typeof window === "undefined") return "";
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

const page: React.CSSProperties = {
  minHeight: "100vh",
  background: "radial-gradient(circle at top left, rgba(232,196,107,.14), transparent 30%), linear-gradient(180deg,#030509,#071326 55%,#030509)",
  color: "white",
  padding: "28px 18px 90px",
  fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
};

const shell: React.CSSProperties = { maxWidth: 1180, margin: "0 auto" };
const card: React.CSSProperties = { border: "1px solid rgba(232,196,107,.28)", borderRadius: 28, background: "linear-gradient(135deg,rgba(45,35,24,.86),rgba(24,21,57,.84) 45%,rgba(5,17,31,.9))", boxShadow: "0 24px 90px rgba(0,0,0,.35)", padding: 28, marginBottom: 24 };
const h1: React.CSSProperties = { fontSize: "clamp(52px,10vw,112px)", lineHeight: .9, margin: "12px 0 20px", letterSpacing: "-0.075em" };
const eyebrow: React.CSSProperties = { color: "#9ff5bd", letterSpacing: ".34em", textTransform: "uppercase", fontWeight: 900, fontSize: 14 };
const muted: React.CSSProperties = { color: "rgba(255,255,255,.68)", lineHeight: 1.55 };
const button: React.CSSProperties = { display: "inline-flex", alignItems: "center", justifyContent: "center", minHeight: 52, padding: "0 20px", borderRadius: 999, border: "1px solid rgba(255,255,255,.14)", color: "white", textDecoration: "none", fontWeight: 900, background: "rgba(255,255,255,.07)" };
const goldButton: React.CSSProperties = { ...button, color: "#06110d", background: "linear-gradient(135deg,#f7e779,#8ff0b6 55%,#b266ff)", border: 0 };
const input: React.CSSProperties = { width: "100%", minHeight: 56, borderRadius: 18, border: "1px solid rgba(255,255,255,.16)", background: "rgba(255,255,255,.08)", color: "white", padding: "0 18px", fontSize: 16, outline: "none" };
const threadCard: React.CSSProperties = { display: "grid", gap: 12, border: "1px solid rgba(255,255,255,.12)", borderRadius: 24, background: "rgba(255,255,255,.055)", padding: 22, marginBottom: 14 };

export default function MessagesPage() {
  const [email, setEmail] = useState("");
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  async function load(nextEmail = email) {
    const activeEmail = String(nextEmail || getStoredEmail() || "").trim().toLowerCase();
    setEmail(activeEmail);
    setLoading(true);
    setError("");

    try {
      const owner = activeEmail === OWNER_EMAIL ? "&owner=1" : "";
      const res = await fetch(`/api/messages/thread?email=${encodeURIComponent(activeEmail)}${owner}`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || json.details || "Message load failed.");
      setThreads(Array.isArray(json.threads) ? json.threads : []);
    } catch (err: any) {
      setError(err?.message || String(err));
      setThreads([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(getStoredEmail());
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return threads;
    return threads.filter((thread) => [thread.subject, thread.preview, thread.from_email, thread.to_email, thread.signal_id, thread.item_id, thread.status].join(" ").toLowerCase().includes(q));
  }, [threads, query]);

  return (
    <main style={page}>
      <div style={shell}>
        <section style={card}>
          <div style={eyebrow}>VaultForge Message Center</div>
          <h1 style={h1}>Controlled message threads.</h1>
          <p style={{ ...muted, maxWidth: 860, fontSize: 20 }}>
            Every request for info, intro, owner follow-up, alert response, and Pain signal message should land here before private contact details are released.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 22 }}>
            <span style={button}>Signed in: {email || "not detected"}</span>
            <span style={button}>Threads: {threads.length}</span>
            <button style={goldButton} onClick={() => load(email)}>Refresh Inbox</button>
            <Link href="/pain-feed" style={button}>Pain Feed</Link>
            <Link href="/alerts" style={button}>Alerts</Link>
            <Link href="/dashboard" style={button}>Dashboard</Link>
            <Link href="/logout" style={{ ...button, borderColor: "rgba(255,120,120,.45)", color: "#ffd0d0" }}>Logout</Link>
          </div>
        </section>

        <section style={card}>
          <div style={eyebrow}>Search Messages</div>
          <div style={{ marginTop: 18 }}>
            <input style={input} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search subject, signal, member email, message preview..." />
          </div>
        </section>

        {loading ? (
          <section style={card}><p style={muted}>Loading message threads...</p></section>
        ) : error ? (
          <section style={card}><h2 style={{ color: "#ffd0d0" }}>Messages failed to load.</h2><p style={muted}>{error}</p></section>
        ) : filtered.length === 0 ? (
          <section style={card}><p style={muted}>No message threads found yet. Send a request from a Pain Room, Alert, Member card, or Project.</p></section>
        ) : (
          <section style={card}>
            <div style={eyebrow}>Inbox</div>
            <div style={{ marginTop: 18 }}>
              {filtered.map((thread) => (
                <article key={thread.thread_id} style={threadCard}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                    <h2 style={{ margin: 0, fontSize: 26 }}>{thread.subject || "VaultForge message"}</h2>
                    <span style={{ ...button, minHeight: 36, padding: "0 12px" }}>{thread.message_count || 1} message{Number(thread.message_count || 1) === 1 ? "" : "s"}</span>
                  </div>
                  <p style={{ ...muted, margin: 0 }}>{thread.preview || "No preview available."}</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    <span style={{ ...button, minHeight: 34, padding: "0 12px" }}>From: {thread.from_email || "unknown"}</span>
                    <span style={{ ...button, minHeight: 34, padding: "0 12px" }}>To: {thread.to_email || "unknown"}</span>
                    {thread.signal_id ? <span style={{ ...button, minHeight: 34, padding: "0 12px" }}>Signal: {thread.signal_id}</span> : null}
                    {thread.item_id ? <span style={{ ...button, minHeight: 34, padding: "0 12px" }}>Item: {thread.item_id}</span> : null}
                    <span style={{ ...button, minHeight: 34, padding: "0 12px" }}>{fmtDate(thread.created_at)}</span>
                  </div>
                  <div>
                    <Link href={`/messages/${encodeURIComponent(thread.thread_id)}?email=${encodeURIComponent(email)}`} style={goldButton}>Open Thread</Link>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
