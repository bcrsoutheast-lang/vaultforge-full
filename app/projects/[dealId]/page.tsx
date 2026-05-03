"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Deal = {
  id: string;
  owner_email: string;
  title: string;
  state: string;
  property_type: string;
  strategy: string;
  price: number | string | null;
  description: string;
  status: string;
  archived: boolean;
  ai_summary?: string;
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
  padding: "7px 12px",
  fontSize: 13,
  letterSpacing: 1.2,
  marginRight: 8,
  marginBottom: 8,
};

function formatPrice(price: Deal["price"]) {
  if (price === null || price === undefined || price === "") return "No price listed";
  const num = Number(price);
  if (Number.isNaN(num)) return String(price);
  return `$${num.toLocaleString()}`;
}

function formatDate(value: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString();
}

export default function DealDetailPage({ params }: { params: { dealId: string } }) {
  const [deal, setDeal] = useState<Deal | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [viewerEmail, setViewerEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [messageText, setMessageText] = useState("");

  async function loadDeal() {
    setLoading(true);
    setStatus("");

    const res = await fetch(`/api/deal/detail?deal_id=${encodeURIComponent(params.dealId)}`, {
      cache: "no-store",
    });
    const data = await res.json();

    if (!res.ok) {
      setStatus(data?.error || data?.details || "Could not load deal.");
      setDeal(null);
    } else {
      setDeal(data.deal || null);
      setIsOwner(Boolean(data.is_owner));
      setViewerEmail(data.viewer_email || "");
    }

    setLoading(false);
  }

  async function addToBucket() {
    if (!deal) return;
    setStatus("");

    const res = await fetch("/api/deal/buy-bucket", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deal_id: deal.id }),
    });

    const data = await res.json();

    if (!res.ok) {
      setStatus(data?.error || data?.details || "Could not add to Buy Bucket.");
      return;
    }

    setStatus(data.status === "already_saved" ? "Already in your Buy Bucket." : "Added to Buy Bucket.");
  }

  async function archiveDeal() {
    if (!deal) return;

    const ok = window.confirm("Archive this deal? It will be hidden from the main projects page.");
    if (!ok) return;

    setStatus("");

    const res = await fetch("/api/deal/archive", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deal_id: deal.id }),
    });

    const data = await res.json();

    if (!res.ok) {
      setStatus(data?.error || data?.details || "Could not archive deal.");
      return;
    }

    setStatus("Deal archived.");
    loadDeal();
  }

  async function messageOwner() {
    if (!deal) return;

    const text = messageText.trim();
    if (!text) {
      setStatus("Write a message first.");
      return;
    }

    setStatus("");

    const res = await fetch("/api/messages/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipient_email: deal.owner_email,
        subject: `Interested in ${deal.title}`,
        message: text,
        deal_id: deal.id,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setStatus(data?.error || data?.details || "Could not send message.");
      return;
    }

    setMessageText("");
    setStatus("Message sent to deal owner.");
  }

  useEffect(() => {
    loadDeal();
  }, [params.dealId]);

  return (
    <main style={shellStyle}>
      <nav style={navStyle}>
        <Link href="/dashboard" style={navLinkStyle}>Dashboard</Link>
        <Link href="/projects" style={navLinkStyle}>Projects</Link>
        <Link href="/buy-bucket" style={navLinkStyle}>Buy Bucket</Link>
        <Link href="/messages" style={navLinkStyle}>Messages</Link>
        <Link href="/alerts" style={navLinkStyle}>Alerts</Link>
        <Link href="/network" style={navLinkStyle}>Network</Link>
      </nav>

      {loading && <section style={cardStyle}>Loading deal...</section>}

      {status && (
        <section
          style={{
            ...cardStyle,
            color: status.toLowerCase().includes("could") || status.toLowerCase().includes("first")
              ? "#ffd0d0"
              : "#9df3bf",
          }}
        >
          {status}
        </section>
      )}

      {!loading && !deal && (
        <section style={cardStyle}>
          <h1>Deal not found</h1>
          <Link href="/projects" style={navLinkStyle}>Back to Projects</Link>
        </section>
      )}

      {!loading && deal && (
        <>
          <section style={heroStyle}>
            <p style={{ color: "#9df3bf", letterSpacing: 4, fontWeight: 800 }}>
              {deal.state} • {deal.property_type}
            </p>
            <h1 style={{ fontSize: 54, lineHeight: 1, margin: "10px 0 18px" }}>
              {deal.title}
            </h1>
            <h2 style={{ fontSize: 34, margin: "0 0 18px" }}>{formatPrice(deal.price)}</h2>
            <div>
              {deal.strategy && <span style={pillStyle}>{deal.strategy}</span>}
              <span style={pillStyle}>{deal.status}</span>
              {isOwner && <span style={pillStyle}>Your Deal</span>}
            </div>
          </section>

          <section style={cardStyle}>
            <h2>Description</h2>
            <p style={{ color: "rgba(255,255,255,.72)", fontSize: 20, lineHeight: 1.5 }}>
              {deal.description || "No description."}
            </p>
            <p style={{ color: "rgba(255,255,255,.45)" }}>
              Posted {formatDate(deal.created_at)}
            </p>
          </section>

          {deal.ai_summary && (
            <section style={cardStyle}>
              <p style={{ color: "#9df3bf", letterSpacing: 4, fontWeight: 800 }}>
                AI ANALYSIS
              </p>
              <p style={{ color: "rgba(255,255,255,.78)", fontSize: 20, lineHeight: 1.5 }}>
                {deal.ai_summary}
              </p>
            </section>
          )}

          <section style={cardStyle}>
            <h2>Actions</h2>
            <button style={buttonStyle} onClick={addToBucket}>Add to Buy Bucket</button>
            {isOwner && <button style={archiveButtonStyle} onClick={archiveDeal}>Archive</button>}
          </section>

          {!isOwner && (
            <section style={cardStyle}>
              <h2>Message Deal Owner</h2>
              <p style={{ color: "rgba(255,255,255,.62)" }}>
                Owner: {deal.owner_email}
              </p>
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                rows={5}
                placeholder="Tell them why you are interested..."
                style={inputStyle}
              />
              <button style={buttonStyle} onClick={messageOwner}>
                Send Message
              </button>
            </section>
          )}

          {isOwner && (
            <section style={cardStyle}>
              <h2>Owner Controls</h2>
              <p style={{ color: "rgba(255,255,255,.72)" }}>
                You posted this deal as {viewerEmail}. Other members can message you when interested.
              </p>
            </section>
          )}
        </>
      )}
    </main>
  );
}
