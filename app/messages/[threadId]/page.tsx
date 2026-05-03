"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Message = {
  id: string;
  thread_id: string;
  sender_email: string;
  recipient_email: string;
  subject: string;
  message: string;
  deal_id: string | null;
  created_at: string;
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

const cardStyle: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.18)",
  background: "rgba(255,255,255,.04)",
  borderRadius: 24,
  padding: 22,
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
  fontSize: 18,
  marginBottom: 14,
};

const buttonStyle: React.CSSProperties = {
  border: 0,
  background: "#9df3bf",
  color: "#071326",
  borderRadius: 999,
  padding: "12px 16px",
  fontWeight: 800,
  cursor: "pointer",
};

function formatDate(value: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString();
}

export default function MessageThreadPage({ params }: { params: { threadId: string } }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [viewerEmail, setViewerEmail] = useState("");
  const [otherEmail, setOtherEmail] = useState("");
  const [reply, setReply] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadThread() {
    setLoading(true);
    setStatus("");

    const res = await fetch(`/api/messages/thread?thread_id=${encodeURIComponent(params.threadId)}`, {
      cache: "no-store",
    });

    const data = await res.json();

    if (!res.ok) {
      setStatus(data?.error || data?.details || "Could not load thread.");
      setMessages([]);
    } else {
      setMessages(data.messages || []);
      setViewerEmail(data.viewer_email || "");
      setOtherEmail(data.other_email || "");
    }

    setLoading(false);
  }

  async function sendReply() {
    const text = reply.trim();
    if (!text) {
      setStatus("Write a reply first.");
      return;
    }

    const first = messages[0];
    const subject = first?.subject || "VaultForge message";
    const dealId = first?.deal_id || null;

    const res = await fetch("/api/messages/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        thread_id: params.threadId,
        recipient_email: otherEmail,
        subject,
        message: text,
        deal_id: dealId,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setStatus(data?.error || data?.details || "Could not send reply.");
      return;
    }

    setReply("");
    setStatus("Reply sent.");
    loadThread();
  }

  useEffect(() => {
    loadThread();
  }, [params.threadId]);

  return (
    <main style={shellStyle}>
      <nav style={navStyle}>
        <Link href="/messages" style={navLinkStyle}>Inbox</Link>
        <Link href="/dashboard" style={navLinkStyle}>Dashboard</Link>
        <Link href="/projects" style={navLinkStyle}>Projects</Link>
        <Link href="/network" style={navLinkStyle}>Network</Link>
      </nav>

      <section style={cardStyle}>
        <p style={{ color: "#9df3bf", letterSpacing: 4, fontWeight: 800 }}>
          MESSAGE THREAD
        </p>
        <h1 style={{ fontSize: 42, lineHeight: 1, margin: "10px 0 18px" }}>
          Conversation
        </h1>
        <p style={{ color: "rgba(255,255,255,.68)" }}>
          You: {viewerEmail || "unknown"}<br />
          Other member: {otherEmail || "unknown"}
        </p>
      </section>

      {status && (
        <section
          style={{
            ...cardStyle,
            color: status.toLowerCase().includes("could") || status.toLowerCase().includes("write")
              ? "#ffd0d0"
              : "#9df3bf",
          }}
        >
          {status}
        </section>
      )}

      {loading && <section style={cardStyle}>Loading thread...</section>}

      {!loading && messages.map((item) => {
        const mine = item.sender_email?.toLowerCase() === viewerEmail?.toLowerCase();
        return (
          <section
            key={item.id}
            style={{
              ...cardStyle,
              marginLeft: mine ? 40 : 0,
              marginRight: mine ? 0 : 40,
              borderColor: mine ? "rgba(157,243,191,.35)" : "rgba(255,255,255,.18)",
            }}
          >
            <p style={{ color: "#9df3bf", letterSpacing: 2, fontWeight: 800 }}>
              {mine ? "YOU" : item.sender_email}
            </p>
            <p style={{ color: "rgba(255,255,255,.78)", fontSize: 19, lineHeight: 1.5 }}>
              {item.message}
            </p>
            <p style={{ color: "rgba(255,255,255,.45)", fontSize: 14 }}>
              {formatDate(item.created_at)}
            </p>
          </section>
        );
      })}

      {!loading && messages.length > 0 && (
        <section style={cardStyle}>
          <h2>Reply</h2>
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            rows={5}
            placeholder="Write your reply..."
            style={inputStyle}
          />
          <button style={buttonStyle} onClick={sendReply}>Send Reply</button>
        </section>
      )}
    </main>
  );
}
