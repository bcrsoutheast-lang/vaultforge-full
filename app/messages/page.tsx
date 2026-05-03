"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Thread = {
  thread_id: string;
  subject: string;
  deal_id: string | null;
  other_email: string;
  latest_message: string;
  latest_sender: string;
  latest_recipient: string;
  latest_at: string;
  unread_count: number;
};

const shellStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "#071326",
  color: "white",
  padding: "36px 22px",
  fontFamily: "Arial, sans-serif",
};

const navStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 12,
  marginBottom: 28,
};

const navLinkStyle: React.CSSProperties = {
  color: "white",
  textDecoration: "none",
  border: "1px solid rgba(255,255,255,.25)",
  borderRadius: 999,
  padding: "12px 18px",
  fontSize: 16,
};

const heroStyle: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.2)",
  background: "rgba(255,255,255,.05)",
  borderRadius: 28,
  padding: 28,
  marginBottom: 22,
};

const cardStyle: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.18)",
  background: "rgba(255,255,255,.04)",
  borderRadius: 24,
  padding: 22,
  marginBottom: 16,
};

const buttonStyle: React.CSSProperties = {
  display: "inline-block",
  background: "#9df3bf",
  color: "#071326",
  borderRadius: 999,
  padding: "12px 16px",
  fontWeight: 800,
  textDecoration: "none",
  marginTop: 12,
};

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

    const res = await fetch("/api/messages/list", { cache: "no-store" });
    const data = await res.json();

    if (!res.ok) {
      setStatus(data?.error || data?.details || "Could not load messages.");
      setThreads([]);
    } else {
      setThreads(data.threads || []);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadThreads();
  }, []);

  return (
    <main style={shellStyle}>
      <nav style={navStyle}>
        <Link href="/dashboard" style={navLinkStyle}>Dashboard</Link>
        <Link href="/profile" style={navLinkStyle}>Profile</Link>
        <Link href="/submit" style={navLinkStyle}>Create Deal</Link>
        <Link href="/projects" style={navLinkStyle}>Projects</Link>
        <Link href="/buy-bucket" style={navLinkStyle}>Buy Bucket</Link>
        <Link href="/alerts" style={navLinkStyle}>Alerts</Link>
        <Link href="/network" style={navLinkStyle}>Network</Link>
      </nav>

      <section style={heroStyle}>
        <p style={{ color: "#9df3bf", letterSpacing: 4, fontWeight: 800 }}>
          VAULTFORGE MESSAGES
        </p>
        <h1 style={{ fontSize: 54, lineHeight: 1, margin: "10px 0 18px" }}>
          Inbox
        </h1>
        <p style={{ color: "rgba(255,255,255,.72)", fontSize: 22, lineHeight: 1.45 }}>
          General and deal-based conversations grouped into clean threads.
        </p>
      </section>

      <button
        onClick={loadThreads}
        style={{ ...buttonStyle, border: 0, cursor: "pointer", marginBottom: 18 }}
      >
        Refresh Inbox
      </button>

      {status && (
        <section style={{ ...cardStyle, color: "#ffd0d0" }}>
          {status}
        </section>
      )}

      {loading && <section style={cardStyle}>Loading messages...</section>}

      {!loading && !status && threads.length === 0 && (
        <section style={cardStyle}>
          <h2>No message threads yet.</h2>
          <p style={{ color: "rgba(255,255,255,.68)" }}>
            Message a deal owner from a deal room to start a thread.
          </p>
        </section>
      )}

      {!loading && !status && threads.map((thread) => (
        <section key={thread.thread_id} style={cardStyle}>
          <p style={{ color: "#9df3bf", letterSpacing: 3, fontWeight: 800 }}>
            {thread.deal_id ? "DEAL THREAD" : "GENERAL THREAD"}
            {thread.unread_count > 0 ? ` • ${thread.unread_count} unread` : ""}
          </p>
          <h2 style={{ fontSize: 28, margin: "0 0 8px" }}>{thread.subject}</h2>
          <p style={{ color: "rgba(255,255,255,.62)" }}>
            With: {thread.other_email || "Unknown member"}
          </p>
          <p style={{ color: "rgba(255,255,255,.72)", fontSize: 18, lineHeight: 1.45 }}>
            {thread.latest_message}
          </p>
          <p style={{ color: "rgba(255,255,255,.45)", fontSize: 14 }}>
            {formatDate(thread.latest_at)}
          </p>
          <Link href={`/messages/${thread.thread_id}`} style={buttonStyle}>
            Open Thread
          </Link>
        </section>
      ))}
    </main>
  );
}
