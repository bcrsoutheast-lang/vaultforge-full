"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Deal = {
  id: string;
  owner_email?: string;
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

export default function ProjectsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadDeals() {
    setLoading(true);
    const res = await fetch("/api/deal/list", { cache: "no-store" });
    const data = await res.json();
    setDeals(data.deals || []);
    setLoading(false);
  }

  async function archiveDeal(id: string) {
    if (!confirm("Archive this deal? It will be hidden from the main project list.")) return;
    const res = await fetch("/api/deal/archive", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error || "Archive failed.");
      return;
    }
    setMessage("Deal archived.");
    loadDeals();
  }

  async function addToBucket(id: string) {
    const email = getEmail();
    if (!email) {
      setMessage("Login required before saving to Buy Bucket.");
      return;
    }
    const res = await fetch("/api/deal/buy-bucket", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deal_id: id, email }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error || "Could not add to Buy Bucket.");
      return;
    }
    setMessage("Added to Buy Bucket.");
  }

  useEffect(() => {
    loadDeals();
  }, []);

  return (
    <main style={{ minHeight: "100vh", background: "#071326", color: "white", padding: 28, fontFamily: "Arial" }}>
      <nav style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 28 }}>
        <Link href="/dashboard"><button style={pill}>Dashboard</button></Link>
        <Link href="/submit"><button style={pill}>Create Deal</button></Link>
        <Link href="/buy-bucket"><button style={pill}>Buy Bucket</button></Link>
        <Link href="/network"><button style={pill}>Network</button></Link>
      </nav>

      <section style={hero}>
        <p style={eyebrow}>VAULTFORGE PROJECTS</p>
        <h1 style={{ fontSize: 48, margin: "10px 0" }}>Saved Deals</h1>
        <p style={{ color: "#cbd5e1", fontSize: 20, lineHeight: 1.5 }}>
          Real deals from Supabase. Add opportunities to your Buy Bucket or archive clutter safely.
        </p>
      </section>

      {message && <div style={notice}>{message}</div>}
      {loading && <p>Loading deals...</p>}
      {!loading && deals.length === 0 && <div style={emptyBox}>No active deals yet. Create one from the Submit page.</div>}

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
              <span style={tag}>Active</span>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
              <button style={primaryButton} onClick={() => addToBucket(deal.id)}>Add to Buy Bucket</button>
              <button style={dangerButton} onClick={() => archiveDeal(deal.id)}>Archive</button>
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
const primaryButton = { border: 0, borderRadius: 999, padding: "12px 16px", fontWeight: 800, background: "#9ff3c6", color: "#071326" };
const dangerButton = { border: "1px solid rgba(248,113,113,.65)", borderRadius: 999, padding: "12px 16px", fontWeight: 800, background: "rgba(248,113,113,.12)", color: "#fecaca" };
const notice = { border: "1px solid rgba(159,243,198,.35)", borderRadius: 16, padding: 16, color: "#9ff3c6", marginBottom: 18 };
const emptyBox = { border: "1px solid rgba(255,255,255,.2)", borderRadius: 16, padding: 22, color: "#cbd5e1" };
