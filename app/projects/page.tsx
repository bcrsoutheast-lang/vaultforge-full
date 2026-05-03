"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Deal = {
  id: string;
  title: string;
  state: string;
  property_type: string;
  strategy: string | null;
  price: number | null;
  description: string | null;
  status: string;
  buy_bucket_count: number | null;
  ai_summary: string | null;
  created_at: string;
};

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "#071326",
  color: "white",
  padding: "34px",
  fontFamily: "Arial, sans-serif",
};

const navStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "14px",
  marginBottom: "34px",
};

const pillStyle: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,0.25)",
  borderRadius: "999px",
  padding: "14px 20px",
  color: "white",
  textDecoration: "none",
  background: "rgba(255,255,255,0.04)",
};

const heroStyle: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,0.18)",
  borderRadius: "28px",
  padding: "28px",
  background: "rgba(255,255,255,0.045)",
  marginBottom: "24px",
};

const cardStyle: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,0.16)",
  borderRadius: "24px",
  padding: "22px",
  background: "rgba(255,255,255,0.055)",
  marginBottom: "16px",
};

const mutedStyle: React.CSSProperties = {
  color: "rgba(255,255,255,0.72)",
};

function money(value: number | null) {
  if (value === null || Number.isNaN(Number(value))) return "Price not listed";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(value));
}

function dateLabel(value: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function buildAiSummary(deal: Deal) {
  if (deal.ai_summary) return deal.ai_summary;

  const strategy = deal.strategy || "Opportunity";
  const state = deal.state || "selected market";
  const propertyType = deal.property_type || "property";

  return `${strategy} ${propertyType.toLowerCase()} deal in ${state}. Review pricing, condition, and buyer/lender fit before moving forward.`;
}

export default function ProjectsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [workingId, setWorkingId] = useState("");

  async function loadDeals() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/deal/list", { cache: "no-store" });
      const data = await response.json();

      if (!response.ok) {
        setError(data?.error || "Could not load deals.");
        setDeals([]);
        return;
      }

      setDeals(Array.isArray(data.deals) ? data.deals : []);
    } catch (err) {
      setError("Could not load deals. Check connection and redeploy status.");
      setDeals([]);
    } finally {
      setLoading(false);
    }
  }

  async function archiveDeal(id: string, title: string) {
    const confirmed = window.confirm(`Archive this deal?\n\n${title}`);
    if (!confirmed) return;

    setWorkingId(id);
    setError("");

    try {
      const response = await fetch("/api/deal/archive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data?.error || "Could not archive deal.");
        return;
      }

      setDeals((current) => current.filter((deal) => deal.id !== id));
    } catch (err) {
      setError("Could not archive deal. Try again after redeploy.");
    } finally {
      setWorkingId("");
    }
  }

  useEffect(() => {
    loadDeals();
  }, []);

  const activeCount = deals.length;
  const totalValue = useMemo(
    () => deals.reduce((sum, deal) => sum + (Number(deal.price) || 0), 0),
    [deals]
  );

  return (
    <main style={pageStyle}>
      <nav style={navStyle}>
        <Link href="/dashboard" style={pillStyle}>Dashboard</Link>
        <Link href="/submit" style={pillStyle}>Create Deal</Link>
        <Link href="/projects" style={{ ...pillStyle, borderColor: "#a7f3d0" }}>Projects</Link>
        <Link href="/network" style={pillStyle}>Network</Link>
      </nav>

      <section style={heroStyle}>
        <p style={{ color: "#a7f3d0", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 12 }}>
          VaultForge Projects
        </p>
        <h1 style={{ fontSize: "52px", lineHeight: 1, margin: "0 0 18px" }}>Saved Deals</h1>
        <p style={{ ...mutedStyle, fontSize: "22px", lineHeight: 1.45, margin: 0 }}>
          Clean card view for real deals saved in Supabase. Archive keeps the system organized without destroying data.
        </p>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "14px", marginBottom: "24px" }}>
        <div style={cardStyle}>
          <div style={mutedStyle}>Active Deals</div>
          <strong style={{ fontSize: "34px" }}>{activeCount}</strong>
        </div>
        <div style={cardStyle}>
          <div style={mutedStyle}>Pipeline Value</div>
          <strong style={{ fontSize: "34px" }}>{money(totalValue)}</strong>
        </div>
      </section>

      {error && (
        <div style={{ ...cardStyle, borderColor: "#f87171", color: "#fecaca" }}>
          {error}
        </div>
      )}

      {loading && <div style={cardStyle}>Loading saved deals...</div>}

      {!loading && deals.length === 0 && !error && (
        <div style={cardStyle}>
          <h2 style={{ marginTop: 0 }}>No active deals yet.</h2>
          <p style={mutedStyle}>Create your first deal and it will show here after saving.</p>
          <Link href="/submit" style={pillStyle}>Create Deal</Link>
        </div>
      )}

      {!loading && deals.map((deal) => (
        <article key={deal.id} style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", alignItems: "flex-start", flexWrap: "wrap" }}>
            <div>
              <div style={{ color: "#a7f3d0", fontWeight: 700, marginBottom: "8px" }}>
                {deal.state} • {deal.property_type} • {deal.strategy || "No bucket"}
              </div>
              <h2 style={{ fontSize: "32px", lineHeight: 1.1, margin: "0 0 10px" }}>{deal.title}</h2>
              <div style={{ ...mutedStyle, fontSize: "18px" }}>{money(deal.price)} • {dateLabel(deal.created_at)}</div>
            </div>
            <span style={{ border: "1px solid rgba(167,243,208,0.4)", color: "#a7f3d0", borderRadius: "999px", padding: "8px 12px" }}>
              {deal.status || "active"}
            </span>
          </div>

          {deal.description && (
            <p style={{ ...mutedStyle, fontSize: "18px", lineHeight: 1.5 }}>{deal.description}</p>
          )}

          <div style={{ border: "1px solid rgba(167,243,208,0.22)", borderRadius: "18px", padding: "16px", background: "rgba(167,243,208,0.06)", marginTop: "16px" }}>
            <strong style={{ color: "#a7f3d0" }}>AI routing note</strong>
            <p style={{ ...mutedStyle, marginBottom: 0 }}>{buildAiSummary(deal)}</p>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginTop: "18px" }}>
            <button
              type="button"
              onClick={() => alert("Buy Bucket is next. This button is intentionally staged so we do not break the saved-deal flow.")}
              style={{ ...pillStyle, color: "#071326", background: "#a7f3d0", fontWeight: 700 }}
            >
              Add to Buy Bucket
            </button>
            <button
              type="button"
              onClick={() => archiveDeal(deal.id, deal.title)}
              disabled={workingId === deal.id}
              style={{ ...pillStyle, color: workingId === deal.id ? "rgba(255,255,255,0.5)" : "white" }}
            >
              {workingId === deal.id ? "Archiving..." : "Archive"}
            </button>
          </div>
        </article>
      ))}
    </main>
  );
}
