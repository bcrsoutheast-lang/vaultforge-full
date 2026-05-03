"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getVaultForgeEmail, vaultForgeHeaders } from "../lib/vaultforge-client-auth";

type Deal = { id: string; title: string; state: string; property_type: string; strategy: string; price: number | string | null; description: string; status: string; ai_summary?: string; created_at: string };

const shellStyle: React.CSSProperties = { minHeight: "100vh", background: "#071326", color: "white", padding: "36px 22px 80px", fontFamily: "Arial, sans-serif" };
const navStyle: React.CSSProperties = { display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 24 };
const navLinkStyle: React.CSSProperties = { color: "white", textDecoration: "none", border: "1px solid rgba(255,255,255,.25)", borderRadius: 999, padding: "11px 15px", fontSize: 15 };
const heroStyle: React.CSSProperties = { border: "1px solid rgba(255,255,255,.2)", background: "rgba(255,255,255,.05)", borderRadius: 28, padding: 28, marginBottom: 22 };
const cardStyle: React.CSSProperties = { border: "1px solid rgba(255,255,255,.18)", background: "rgba(255,255,255,.04)", borderRadius: 24, padding: 22, marginBottom: 16 };
const pillStyle: React.CSSProperties = { display: "inline-block", color: "#9df3bf", border: "1px solid rgba(157,243,191,.35)", borderRadius: 999, padding: "7px 11px", fontSize: 12, letterSpacing: 1.1, marginRight: 7, marginBottom: 8 };
const buttonStyle: React.CSSProperties = { border: 0, background: "#9df3bf", color: "#071326", borderRadius: 999, padding: "12px 15px", fontWeight: 800, cursor: "pointer", marginRight: 8, marginTop: 10 };
const archiveButtonStyle: React.CSSProperties = { ...buttonStyle, background: "transparent", color: "#ffd0d0", border: "1px solid rgba(255,107,107,.55)" };

function Nav() { return <nav style={navStyle}><Link href="/dashboard" style={navLinkStyle}>Dashboard</Link><Link href="/profile" style={navLinkStyle}>Profile</Link><Link href="/submit" style={navLinkStyle}>Create Deal</Link><Link href="/buy-bucket" style={navLinkStyle}>Buy Bucket</Link><Link href="/alerts" style={navLinkStyle}>Alerts</Link><Link href="/messages" style={navLinkStyle}>Messages</Link><Link href="/network" style={navLinkStyle}>Network</Link></nav>; }
function formatPrice(price: Deal["price"]) { if (price === null || price === undefined || price === "") return "No price listed"; const num = Number(price); if (Number.isNaN(num)) return String(price); return `$${num.toLocaleString()}`; }

export default function ProjectsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState("");

  async function loadDeals() {
    setLoading(true); setMessage("");
    try {
      const res = await fetch("/api/deal/list", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) { setMessage(data?.error || "Could not load deals."); setDeals([]); }
      else setDeals(data.deals || []);
    } catch { setMessage("Could not load deals. Refresh and try again."); setDeals([]); }
    setLoading(false);
  }

  async function addToBucket(dealId: string) {
    setMessage(""); setBusyId(dealId);
    if (!getVaultForgeEmail()) { setMessage("Session missing. Go to Login and enter your email again."); setBusyId(""); return; }
    try {
      const res = await fetch("/api/deal/buy-bucket", { method: "POST", headers: vaultForgeHeaders(), body: JSON.stringify({ deal_id: dealId }) });
      const data = await res.json();
      if (!res.ok) setMessage(data?.error || "Could not add to Buy Bucket.");
      else setMessage(data.status === "already_saved" ? "Already saved in your Buy Bucket." : "Saved to your Buy Bucket.");
    } catch { setMessage("Could not add to Buy Bucket. Refresh and try again."); }
    setBusyId("");
  }

  async function archiveDeal(dealId: string) {
    const ok = window.confirm("Archive this deal? It will be hidden from Projects but kept safely.");
    if (!ok) return;
    setMessage(""); setBusyId(dealId);
    if (!getVaultForgeEmail()) { setMessage("Session missing. Go to Login and enter your email again."); setBusyId(""); return; }
    try {
      const res = await fetch("/api/deal/archive", { method: "POST", headers: vaultForgeHeaders(), body: JSON.stringify({ deal_id: dealId }) });
      const data = await res.json();
      if (!res.ok) setMessage(data?.error || "Could not archive deal.");
      else { setMessage("Deal archived."); await loadDeals(); }
    } catch { setMessage("Could not archive deal. Refresh and try again."); }
    setBusyId("");
  }

  useEffect(() => { loadDeals(); }, []);

  return (
    <main style={shellStyle}>
      <Nav />
      <section style={heroStyle}><p style={{ color: "#9df3bf", letterSpacing: 4, fontWeight: 800 }}>VAULTFORGE PROJECTS</p><h1 style={{ fontSize: 50, lineHeight: 1, margin: "10px 0 18px" }}>Saved Deals</h1><p style={{ color: "rgba(255,255,255,.72)", fontSize: 20, lineHeight: 1.45 }}>Open deal rooms, read AI analysis, save opportunities, message owners, or archive clutter safely.</p></section>
      {message && <section style={{ ...cardStyle, color: message.toLowerCase().includes("could") || message.toLowerCase().includes("missing") ? "#ffd0d0" : "#9df3bf" }}>{message}</section>}
      {loading && <section style={cardStyle}>Loading deals...</section>}
      {!loading && deals.length === 0 && <section style={cardStyle}><h2>No active deals yet.</h2><p style={{ color: "rgba(255,255,255,.68)" }}>Create the first deal to start routing opportunities.</p><Link href="/submit" style={navLinkStyle}>Create Deal</Link></section>}
      {!loading && deals.map((deal) => (
        <section key={deal.id} style={cardStyle}>
          <p style={{ color: "#9df3bf", letterSpacing: 4, fontWeight: 800 }}>{deal.state || "Unknown"} • {deal.property_type || "Deal"}</p>
          <h2 style={{ fontSize: 36, margin: "0 0 12px" }}>{deal.title}</h2>
          <h3 style={{ fontSize: 28, margin: "0 0 18px" }}>{formatPrice(deal.price)}</h3>
          <p style={{ color: "rgba(255,255,255,.72)", fontSize: 19, lineHeight: 1.45 }}>{deal.description || "No description."}</p>
          <div style={{ marginTop: 18 }}>{deal.strategy && <span style={pillStyle}>{deal.strategy}</span>}<span style={pillStyle}>{deal.status || "Active"}</span></div>
          <Link href={`/projects/${deal.id}`} style={{ ...buttonStyle, display: "inline-block", textDecoration: "none" }}>View Deal Room</Link>
          <button style={buttonStyle} onClick={() => addToBucket(deal.id)} disabled={busyId === deal.id}>{busyId === deal.id ? "Working..." : "Add to Buy Bucket"}</button>
          <button style={archiveButtonStyle} onClick={() => archiveDeal(deal.id)} disabled={busyId === deal.id}>Archive</button>
        </section>
      ))}
    </main>
  );
}
