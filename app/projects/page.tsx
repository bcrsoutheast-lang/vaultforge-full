"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Deal = {
  id: string;
  title: string;
  state: string;
  property_type: string;
  strategy: string;
  price: number | string | null;
  description: string;
  status: string;
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

const pillStyle: React.CSSProperties = {
  display: "inline-block",
  color: "#9df3bf",
  border: "1px solid rgba(157,243,191,.35)",
  borderRadius: 999,
  padding: "7px 12px",
  fontSize: 13,
  letterSpacing: 1.2,
  marginRight: 8,
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

function formatPrice(price: Deal["price"]) {
  if (price === null || price === undefined || price === "") return "No price listed";
  const num = Number(price);
  if (Number.isNaN(num)) return String(price);
  return `$${num.toLocaleString()}`;
}

export default function ProjectsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function loadDeals() {
    setLoading(true);
    setMessage("");

    const res = await fetch("/api/deal/list", { cache: "no-store" });
    const data = await res.json();

    if (!res.ok) {
      setMessage(data?.error || data?.details || "Could not load deals.");
      setDeals([]);
    } else {
      setDeals(data.deals || []);
    }

    setLoading(false);
  }

  async function addToBucket(dealId: string) {
    setMessage("");

    const res = await fetch("/api/deal/buy-bucket", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deal_id: dealId }),
    });

    const data = await res.json();

    if (!res.ok) {
      setMessage(data?.error || data?.details || "Could not add to Buy Bucket.");
      return;
    }

    if (data.status === "already_saved") {
      setMessage("Already in your Buy Bucket.");
    } else {
      setMessage("Added to Buy Bucket.");
    }
  }

  async function archiveDeal(dealId: string) {
    const ok = window.confirm("Archive this deal? It will be hidden from the main projects page.");
    if (!ok) return;

    setMessage("");

    const res = await fetch("/api/deal/archive", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deal_id: dealId }),
    });

    const data = await res.json();

    if (!res.ok) {
      setMessage(data?.error || data?.details || "Could not archive deal.");
      return;
    }

    setMessage("Deal archived.");
    loadDeals();
  }

  useEffect(() => {
    loadDeals();
  }, []);

  return (
    <main style={shellStyle}>
      <nav style={navStyle}>
        <Link href="/dashboard" style={navLinkStyle}>Dashboard</Link>
        <Link href="/submit" style={navLinkStyle}>Create Deal</Link>
        <Link href="/buy-bucket" style={navLinkStyle}>Buy Bucket</Link>
        <Link href="/alerts" style={navLinkStyle}>Alerts</Link>
        <Link href="/network" style={navLinkStyle}>Network</Link>
      </nav>

      <section style={heroStyle}>
        <p style={{ color: "#9df3bf", letterSpacing: 4, fontWeight: 800 }}>
          VAULTFORGE PROJECTS
        </p>
        <h1 style={{ fontSize: 54, lineHeight: 1, margin: "10px 0 18px" }}>
          Saved Deals
        </h1>
        <p style={{ color: "rgba(255,255,255,.72)", fontSize: 22, lineHeight: 1.45 }}>
          Real deals from Supabase. Add opportunities to your Buy Bucket or archive clutter safely.
        </p>
      </section>

      {message && (
        <section style={{ ...cardStyle, color: "#9df3bf", borderColor: "rgba(157,243,191,.35)" }}>
          {message}
        </section>
      )}

      {loading && <section style={cardStyle}>Loading deals...</section>}

      {!loading && deals.length === 0 && (
        <section style={cardStyle}>
          <p>No active deals yet.</p>
          <Link href="/submit" style={navLinkStyle}>Create your first deal</Link>
        </section>
      )}

      {!loading &&
        deals.map((deal) => (
          <section key={deal.id} style={cardStyle}>
            <p style={{ color: "#9df3bf", letterSpacing: 4, fontWeight: 800 }}>
              {deal.state || "Unknown"} • {deal.property_type || "Deal"}
            </p>
            <h2 style={{ fontSize: 38, margin: "0 0 12px" }}>{deal.title}</h2>
            <h3 style={{ fontSize: 28, margin: "0 0 18px" }}>{formatPrice(deal.price)}</h3>
            <p style={{ color: "rgba(255,255,255,.72)", fontSize: 20, lineHeight: 1.45 }}>
              {deal.description || "No description."}
            </p>
            <div style={{ marginTop: 18 }}>
              {deal.strategy && <span style={pillStyle}>{deal.strategy}</span>}
              <span style={pillStyle}>{deal.status || "Active"}</span>
            </div>
            <button style={buttonStyle} onClick={() => addToBucket(deal.id)}>
              Add to Buy Bucket
            </button>
            <button style={archiveButtonStyle} onClick={() => archiveDeal(deal.id)}>
              Archive
            </button>
          </section>
        ))}
    </main>
  );
}
