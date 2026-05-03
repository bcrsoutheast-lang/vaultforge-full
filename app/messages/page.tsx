"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Message = {
  id: string;
  sender_email: string;
  recipient_email: string;
  subject: string;
  message: string;
  deal_id: string | null;
  read: boolean;
  archived: boolean;
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
  marginRight: 10,
};

const archiveButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  background: "transparent",
  color: "#ffd0d0",
  border: "1px solid rgba(255,107,107,.55)",
};

function formatDate(value: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString();
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [messageText, setMessageText] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadMessages() {
    setLoading(true);
    setStatus("");

    const res = await fetch("/api/messages/list", { cache: "no-store" });
    const data = await res.json();

    if (!res.ok) {
      setStatus(data?.error || data?.details || "Could not load messages.");
      setMessages([]);
    } else {
      setMessages(data.messages || []);
    }

    setLoading(false);
  }

  async function sendMessage() {
    setStatus("");

    const res = await fetch("/api/messages/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipient_email: recipientEmail,
        subject,
        message: messageText,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setStatus(data?.error || data?.details || "Could not send message.");
      return;
    }

    setRecipientEmail("");
    setSubject("");
    setMessageText("");
    setStatus("Message sent.");
    loadMessages();
  }

  async function archiveMessage(messageId: string) {
    const ok = window.confirm("Archive this message?");
    if (!ok) return;

    const res = await fetch("/api/messages/archive", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message_id: messageId }),
    });

    const data = await res.json();

    if (!res.ok) {
      setStatus(data?.error || data?.details || "Could not archive message.");
      return;
    }

    setStatus("Message archived.");
    loadMessages();
  }

  useEffect(() => {
    loadMessages();
  }, []);

  return (
    <main style={shellStyle}>
      <nav style={navStyle}>
        <Link href="/dashboard" style={navLinkStyle}>Dashboard</Link>
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
          Member Communication
        </h1>
        <p style={{ color: "rgba(255,255,255,.72)", fontSize: 22, lineHeight: 1.45 }}>
          Send and track direct member messages. Deal-linked threads come next.
        </p>
      </section>

      <section style={cardStyle}>
        <h2 style={{ marginTop: 0 }}>Send Message</h2>
        <label style={{ display: "block", fontWeight: 800, marginBottom: 8 }}>
          Recipient Email
        </label>
        <input
          value={recipientEmail}
          onChange={(e) => setRecipientEmail(e.target.value)}
          placeholder="member@example.com"
          style={inputStyle}
        />

        <label style={{ display: "block", fontWeight: 800, marginBottom: 8 }}>
          Subject
        </label>
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Interested in your deal"
          style={inputStyle}
        />

        <label style={{ display: "block", fontWeight: 800, marginBottom: 8 }}>
          Message
        </label>
        <textarea
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          placeholder="Write message..."
          rows={5}
          style={inputStyle}
        />

        <button style={buttonStyle} onClick={sendMessage}>
          Send Message
        </button>
      </section>

      {status && (
        <section
          style={{
            ...cardStyle,
            color: status.toLowerCase().includes("could") || status.toLowerCase().includes("failed")
              ? "#ffd0d0"
              : "#9df3bf",
          }}
        >
          {status}
        </section>
      )}

      <section style={cardStyle}>
        <h2 style={{ marginTop: 0 }}>Inbox / Sent</h2>
        <button style={buttonStyle} onClick={loadMessages}>
          Refresh
        </button>
      </section>

      {loading && <section style={cardStyle}>Loading messages...</section>}

      {!loading && messages.length === 0 && (
        <section style={cardStyle}>No messages yet.</section>
      )}

      {!loading &&
        messages.map((item) => (
          <section key={item.id} style={cardStyle}>
            <p style={{ color: "#9df3bf", letterSpacing: 2, fontWeight: 800 }}>
              FROM {item.sender_email} → TO {item.recipient_email}
            </p>
            <h2 style={{ fontSize: 30, margin: "0 0 12px" }}>
              {item.subject || "VaultForge message"}
            </h2>
            <p style={{ color: "rgba(255,255,255,.72)", fontSize: 19, lineHeight: 1.45 }}>
              {item.message}
            </p>
            <p style={{ color: "rgba(255,255,255,.45)", fontSize: 14 }}>
              {formatDate(item.created_at)}
            </p>
            <button style={archiveButtonStyle} onClick={() => archiveMessage(item.id)}>
              Archive
            </button>
          </section>
        ))}
    </main>
  );
}
