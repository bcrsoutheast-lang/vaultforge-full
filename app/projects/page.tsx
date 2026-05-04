"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Deal = Record<string, any>;
const shell: React.CSSProperties = { minHeight: "100vh", background: "linear-gradient(180deg,#06100a,#102015 55%,#06100a)", color: "white", padding: "28px 18px 90px", fontFamily: "Arial, sans-serif" };
const wrap: React.CSSProperties = { maxWidth: 1180, margin: "0 auto" };
const hero: React.CSSProperties = { border: "1px solid rgba(232,196,107,.28)", background: "rgba(255,255,255,.045)", borderRadius: 34, padding: 24, marginBottom: 22 };
const grid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 18 };
const card: React.CSSProperties = { border: "1px solid rgba(232,196,107,.22)", background: "rgba(255,255,255,.04)", borderRadius: 28, overflow: "hidden" };
const body: React.CSSProperties = { padding: 20 };
const btn: React.CSSProperties = { display: "inline-block", background: "#f5d978", color: "#06100a", textDecoration: "none", borderRadius: 999, padding: "12px 15px", fontWeight: 900, border: "none", margin: "6px 6px 0 0" };
const ghost: React.CSSProperties = { display: "inline-block", color: "white", textDecoration: "none", borderRadius: 999, padding: "12px 15px", fontWeight: 900, border: "1px solid rgba(255,255,255,.16)", background: "rgba(255,255,255,.04)", margin: "6px 6px 0 0" };
const eyebrow: React.CSSProperties = { color: "#e8c46b", letterSpacing: 5, fontWeight: 900, fontSize: 12, marginBottom: 12 };
const muted: React.CSSProperties = { color: "rgba(255,255,255,.68)", lineHeight: 1.5 };
function getEmail() { if (typeof window === "undefined") return ""; return (localStorage.getItem("vf_email") || sessionStorage.getItem("vf_email") || "text@text.com").trim().toLowerCase(); }
function money(v: any) { const n = Number(v || 0); if (!n) return "Price not listed"; return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }); }
function photos(deal: Deal) { const arr = Array.isArray(deal.photo_urls) ? deal.photo_urls.filter(Boolean) : []; if (deal.main_photo_url && !arr.includes(deal.main_photo_url)) arr.unshift(deal.main_photo_url); return arr; }
function detailLine(deal: Deal) { return [deal.bedrooms ? `${deal.bedrooms} bed` : "", deal.bathrooms ? `${deal.bathrooms} bath` : "", deal.building_sqft ? `${deal.building_sqft} sqft` : "", deal.land_acres ? `${deal.land_acres} acres` : "", deal.commercial_type || "", deal.condition || ""].filter(Boolean).join(" · "); }

export default function ProjectsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [status, setStatus] = useState("Loading projects...");
  async function load() {
    setStatus("Loading projects...");
    try {
      const res = await fetch("/api/deal/list", { cache: "no-store", headers: { "x-vf-email": getEmail() } });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Could not load deals.");
      setDeals(data?.deals || []);
      setStatus("");
    } catch (err: any) { setStatus(err?.message || "Could not load projects."); }
  }
  async function saveDeal(id: string) {
    try {
      const res = await fetch("/api/deal/buy-bucket", { method: "POST", headers: { "Content-Type": "application/json", "x-vf-email": getEmail() }, body: JSON.stringify({ deal_id: id }) });
      const data = await res.json();
      if (!res.ok && !String(data?.error || "").toLowerCase().includes("duplicate")) throw new Error(data?.error || "Save failed.");
      alert("Saved to Buy Bucket.");
    } catch (err: any) { alert(err?.message || "Could not save."); }
  }
  useEffect(() => { load(); }, []);
  return <main style={shell}><div style={wrap}>
    <section style={hero}><div style={eyebrow}>PROJECTS</div><h1 style={{ fontSize: "clamp(56px,12vw,96px)", lineHeight: .9, margin: "0 0 18px" }}>Deal rooms.</h1><Link href="/dashboard" style={ghost}>Dashboard</Link><Link href="/submit" style={btn}>Create</Link><Link href="/buy-bucket" style={ghost}>Buy Bucket</Link><button onClick={load} style={btn}>Refresh</button></section>
    {status && <section style={hero}>{status}</section>}
    <section style={grid}>{deals.map((deal) => { const img = photos(deal)[0]; return <article key={deal.id} style={card}>
      {img ? <img src={img} alt={deal.title || "Deal"} style={{ width: "100%", height: 230, objectFit: "cover", display: "block" }} /> : <div style={{ height: 230, display: "grid", placeItems: "center", color: "rgba(255,255,255,.55)", borderBottom: "1px solid rgba(255,255,255,.10)" }}>No photo</div>}
      <div style={body}><div style={eyebrow}>{deal.property_type || "Deal"} · {deal.strategy || "Strategy Needed"}</div><h2 style={{ fontSize: 34, margin: "0 0 8px" }}>{deal.title || "Untitled Deal"}</h2><p style={{ ...muted, fontSize: 19, margin: "0 0 10px" }}>{deal.city || "Unknown City"}, {deal.state || "Unknown State"}</p><p style={{ margin: "0 0 8px", fontSize: 20 }}>Ask: {money(deal.asking_price || deal.price)}</p><p style={{ margin: "0 0 8px", fontSize: 20 }}>ARV: {money(deal.arv)}</p><p style={{ ...muted, margin: "0 0 10px" }}>{detailLine(deal) || "Additional details in Deal Room"}</p><p style={{ ...muted, margin: "0 0 10px" }}>{deal.seller_situation || deal.description || ""}</p><Link href={`/deal/${deal.id}`} style={btn}>Deal Room</Link><button type="button" onClick={() => saveDeal(deal.id)} style={ghost}>Save to Buy Bucket</button></div>
    </article>})}</section>
  </div></main>;
}
