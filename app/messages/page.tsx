"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Thread = {
  thread_id: string;
  subject: string;
  deal_id: string | null;
  other_email: string;
  latest_message: string;
  latest_at: string;
  unread_count: number;
};


const shellStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "#071326",
  color: "white",
  padding: "32px 18px 80px",
  fontFamily: "Arial, sans-serif",
};

const navStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 10,
  marginBottom: 24,
};

const navLinkStyle: React.CSSProperties = {
  color: "white",
  textDecoration: "none",
  border: "1px solid rgba(255,255,255,.25)",
  borderRadius: 999,
  padding: "11px 15px",
  fontSize: 15,
};

const heroStyle: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.2)",
  background: "rgba(255,255,255,.05)",
  borderRadius: 26,
  padding: 24,
  marginBottom: 20,
};

const cardStyle: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.18)",
  background: "rgba(255,255,255,.04)",
  borderRadius: 22,
  padding: 20,
  marginBottom: 16,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  background: "rgba(255,255,255,.08)",
  color: "white",
  border: "1px solid rgba(255,255,255,.25)",
  borderRadius: 16,
  padding: "14px 16px",
  fontSize: 17,
  marginBottom: 14,
};

const buttonStyle: React.CSSProperties = {
  border: 0,
  background: "#9df3bf",
  color: "#071326",
  borderRadius: 999,
  padding: "12px 15px",
  fontWeight: 800,
  cursor: "pointer",
  marginRight: 8,
  marginTop: 10,
};

const archiveButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  background: "transparent",
  color: "#ffd0d0",
  border: "1px solid rgba(255,107,107,.55)",
};

const pillStyle: React.CSSProperties = {
  display: "inline-block",
  color: "#9df3bf",
  border: "1px solid rgba(157,243,191,.35)",
  borderRadius: 999,
  padding: "7px 11px",
  fontSize: 12,
  letterSpacing: 1.1,
  marginRight: 7,
  marginBottom: 8,
};

function cleanError(value: string) {
  if (!value) return "";
  const lower = value.toLowerCase();
  if (lower.includes("supabase") || lower.includes("pgrst") || lower.includes("violates") || lower.includes("schema") || lower.includes("failed to fetch")) {
    return "Something did not save correctly. Refresh and try again.";
  }
  return value;
}


function Nav() {
  return (
    <nav style={navStyle}>
      <Link href="/dashboard" style={navLinkStyle}>Dashboard</Link>
      <Link href="/profile" style={navLinkStyle}>Profile</Link>
      <Link href="/submit" style={navLinkStyle}>Create Deal</Link>
      <Link href="/projects" style={navLinkStyle}>Projects</Link>
      <Link href="/buy-bucket" style={navLinkStyle}>Buy Bucket</Link>
      <Link href="/alerts" style={navLinkStyle}>Alerts</Link>
      <Link href="/messages" style={navLinkStyle}>Messages</Link>
      <Link href="/network" style={navLinkStyle}>Network</Link>
    </nav>
  );
}


function formatDate(value: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString();
}

export default function MessagesPage() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");

  async function loadThreads() {
    setLoading(true);
    setStatus("");

    try {
      const res = await fetch("/api/messages/list", { cache: "no-store" });
      const data = await res.json();

      if (!res.ok) {
        setStatus(cleanError(data?.error || data?.details || "Could not load messages."));
        setThreads([]);
      } else {
        setThreads(data.threads || []);
      }
    } catch {
      setStatus("Could not load messages. Refresh and try again.");
      setThreads([]);
    }

    setLoading(false);
  }

  useEffect(() => { loadThreads(); }, []);

  return (
    <main style={shellStyle}>
      <Nav />

      <section style={heroStyle}>
        <p style={{ color: "#9df3bf", letterSpacing: 4, fontWeight: 800 }}>VAULTFORGE MESSAGES</p>
        <h1 style={{ fontSize: 50, lineHeight: 1, margin: "10px 0 18px" }}>Inbox</h1>
        <p style={{ color: "rgba(255,255,255,.72)", fontSize: 20, lineHeight: 1.45 }}>
          General and deal-based conversations grouped into clean threads.
        </p>
      </section>

      <button onClick={loadThreads} style={{ ...buttonStyle, marginBottom: 18 }}>Refresh Inbox</button>

      {status && <section style={{ ...cardStyle, color: "#ffd0d0" }}>{status}</section>}
      {loading && <section style={cardStyle}>Loading messages...</section>}

      {!loading && !status && threads.length === 0 && (
        <section style={cardStyle}>
          <h2>No message threads yet.</h2>
          <p style={{ color: "rgba(255,255,255,.68)" }}>Open a deal room and message the deal owner to start a conversation.</p>
          <Link href="/projects" style={navLinkStyle}>Browse Projects</Link>
        </section>
      )}

      {!loading && !status && threads.map((thread) => (
        <section key={thread.thread_id} style={cardStyle}>
          <span style={pillStyle}>{thread.deal_id ? "DEAL THREAD" : "GENERAL THREAD"}{thread.unread_count > 0 ? ` • ${thread.unread_count} unread` : ""}</span>
          <h2 style={{ fontSize: 28, margin: "0 0 8px" }}>{thread.subject}</h2>
          <p style={{ color: "rgba(255,255,255,.62)" }}>With: {thread.other_email || "Unknown member"}</p>
          <p style={{ color: "rgba(255,255,255,.72)", fontSize: 18, lineHeight: 1.45 }}>{thread.latest_message}</p>
          <p style={{ color: "rgba(255,255,255,.45)", fontSize: 14 }}>{formatDate(thread.latest_at)}</p>
          <Link href={`/messages/${thread.thread_id}`} style={{ ...buttonStyle, display: "inline-block", textDecoration: "none" }}>Open Thread</Link>
        </section>
      ))}
    </main>
  );
}
