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


function formatPrice(price: Deal["price"]) {
  if (price === null || price === undefined || price === "") return "No price listed";
  const num = Number(price);
  if (Number.isNaN(num)) return String(price);
  return `$${num.toLocaleString()}`;
}

export default function BuyBucketPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function loadBucket() {
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/deal/my-bucket", { cache: "no-store" });
      const data = await res.json();

      if (!res.ok) {
        setMessage(cleanError(data?.error || data?.details || "Could not load Buy Bucket."));
        setDeals([]);
      } else {
        setDeals(data.deals || []);
      }
    } catch {
      setMessage("Could not load Buy Bucket. Refresh and try again.");
      setDeals([]);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadBucket();
  }, []);

  return (
    <main style={shellStyle}>
      <Nav />

      <section style={heroStyle}>
        <p style={{ color: "#9df3bf", letterSpacing: 4, fontWeight: 800 }}>VAULTFORGE BUY BUCKET</p>
        <h1 style={{ fontSize: 50, lineHeight: 1, margin: "10px 0 18px" }}>Saved Opportunities</h1>
        <p style={{ color: "rgba(255,255,255,.72)", fontSize: 20, lineHeight: 1.45 }}>
          Deals you marked as interesting. This becomes the buyer demand signal for routing.
        </p>
      </section>

      {message && <section style={{ ...cardStyle, color: "#ffd0d0" }}>{message}</section>}
      {loading && <section style={cardStyle}>Loading Buy Bucket...</section>}

      {!loading && !message && deals.length === 0 && (
        <section style={cardStyle}>
          <h2>No saved opportunities yet.</h2>
          <p style={{ color: "rgba(255,255,255,.68)" }}>Open Projects and tap “Add to Buy Bucket” on any deal you want to track.</p>
          <Link href="/projects" style={navLinkStyle}>Browse Projects</Link>
        </section>
      )}

      {!loading && !message && deals.map((deal) => (
        <section key={deal.id} style={cardStyle}>
          <p style={{ color: "#9df3bf", letterSpacing: 4, fontWeight: 800 }}>{deal.state} • {deal.property_type}</p>
          <h2 style={{ fontSize: 34, margin: "0 0 12px" }}>{deal.title}</h2>
          <h3 style={{ fontSize: 26, margin: "0 0 18px" }}>{formatPrice(deal.price)}</h3>
          <p style={{ color: "rgba(255,255,255,.72)", fontSize: 18, lineHeight: 1.45 }}>{deal.description || "No description."}</p>
          <Link href={`/projects/${deal.id}`} style={{ ...buttonStyle, display: "inline-block", textDecoration: "none" }}>Open Deal Room</Link>
        </section>
      ))}
    </main>
  );
}
