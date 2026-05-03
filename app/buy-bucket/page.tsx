"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Deal = {
  id: string;
  title: string;
  state: string;
  property_type: string;
  strategy?: string;
  price?: number;
  description?: string;
  created_at?: string;
};

function getEmail() {
  if (typeof document === "undefined") return "";
  const found = document.cookie
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith("vf_user="));
  return found ? decodeURIComponent(found.split("=")[1] || "") : "";
}

function money(value: unknown) {
  const num = Number(value || 0);
  if (!num) return "Price not listed";
  return num.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export default function BuyBucketPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    const email = getEmail();
    if (!email) {
      setError("Login required.");
      setLoading(false);
      return;
    }

    const res = await fetch(`/api/deal/my-bucket?email=${encodeURIComponent(email)}`, { cache: "no-store" });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Could not load buy bucket.");
    } else {
      setDeals(data.deals || []);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <main style={{ minHeight: "100vh", background: "#071326", color: "white", padding: 28, fontFamily: "Arial" }}>
      <nav style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 28 }}>
        <Link href="/dashboard"><button style={pill}>Dashboard</button></Link>
        <Link href="/submit"><button style={pill}>Create Deal</button></Link>
        <Link href="/projects"><button style={pill}>Projects</button></Link>
        <Link href="/network"><button style={pill}>Network</button></Link>
      </nav>

      <section style={hero}>
        <p style={eyebrow}>VAULTFORGE BUY BUCKET</p>
        <h1 style={{ fontSize: 48, margin: "10px 0" }}>Saved Opportunities</h1>
        <p style={{ color: "#cbd5e1", fontSize: 20, lineHeight: 1.5 }}>
          Deals you marked as interesting. This becomes the buyer demand signal for routing later.
        </p>
      </section>

      {loading && <p>Loading...</p>}
      {error && <div style={errorBox}>{error}</div>}
      {!loading && !error && deals.length === 0 && <div style={emptyBox}>No saved deals yet. Go to Projects and tap Add to Buy Bucket.</div>}

      <section style={{ display: "grid", gap: 18 }}>
        {deals.map((deal) => (
          <article key={deal.id} style={card}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div>
                <p style={eyebrow}>{deal.state} • {deal.property_type}</p>
                <h2 style={{ fontSize: 30, margin: "6px 0" }}>{deal.title}</h2>
              </div>
              <strong style={{ fontSize: 24 }}>{money(deal.price)}</strong>
            </div>
            <p style={{ color: "#cbd5e1", fontSize: 18 }}>{deal.description || "No description provided."}</p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
              <span style={tag}>{deal.strategy || "General"}</span>
              <span style={tag}>Saved</span>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}

const pill = {
  border: "1px solid rgba(255,255,255,.25)",
  borderRadius: 999,
  padding: "12px 18px",
  background: "transparent",
  color: "white",
  fontSize: 16,
};

const hero = {
  border: "1px solid rgba(255,255,255,.2)",
  borderRadius: 24,
  padding: 28,
  background: "rgba(255,255,255,.05)",
  marginBottom: 24,
};

const card = {
  border: "1px solid rgba(255,255,255,.2)",
  borderRadius: 22,
  padding: 24,
  background: "rgba(15,23,42,.86)",
};

const eyebrow = { color: "#9ff3c6", letterSpacing: 3, fontSize: 13, fontWeight: 700 };
const tag = { border: "1px solid rgba(159,243,198,.35)", color: "#9ff3c6", borderRadius: 999, padding: "8px 12px" };
const errorBox = { border: "1px solid #ef4444", borderRadius: 16, padding: 18, background: "rgba(239,68,68,.14)", marginBottom: 20 };
const emptyBox = { border: "1px solid rgba(255,255,255,.2)", borderRadius: 16, padding: 22, color: "#cbd5e1" };
