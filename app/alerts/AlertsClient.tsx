"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Item = Record<string, any>;
const shell: React.CSSProperties = { minHeight: "100vh", background: "#061120", color: "white", padding: "28px 18px 100px", fontFamily: "Arial, sans-serif" };
const wrap: React.CSSProperties = { maxWidth: 1100, margin: "0 auto" };
const hero: React.CSSProperties = { border: "1px solid rgba(255,255,255,.18)", borderRadius: 34, padding: 28, background: "rgba(255,255,255,.035)", marginBottom: 24 };
const btn: React.CSSProperties = { display: "inline-block", background: "#9df3bf", color: "#071326", borderRadius: 999, padding: "14px 24px", fontWeight: 900, textDecoration: "none", margin: "8px 8px 0 0", border: 0 };
const card: React.CSSProperties = { border: "1px solid rgba(255,255,255,.18)", borderRadius: 28, padding: 24, background: "rgba(255,255,255,.03)", marginBottom: 18 };
function getEmail() { if (typeof window === "undefined") return ""; return (localStorage.getItem("vf_email") || sessionStorage.getItem("vf_email") || "").trim().toLowerCase(); }
function firstPhoto(item: Item) { const photos = Array.isArray(item.photo_urls) ? item.photo_urls : Array.isArray(item.deal?.photo_urls) ? item.deal.photo_urls : []; return item.main_photo_url || item.deal?.main_photo_url || photos[0] || ""; }

export default function AlertsClient() {
  const [items, setItems] = useState<Item[]>([]);
  const [status, setStatus] = useState("Loading alerts...");
  async function load() {
    setStatus("Loading alerts...");
    try {
      const email = getEmail();
      const res = await fetch(`/api/deal/my-bucket?email=${encodeURIComponent(email)}`, { cache: "no-store", headers: { "x-vf-email": email } });
      const data = await res.json();
      if (!res.ok || data.ok === false) throw new Error(data.error || "Could not load alerts.");
      const list = data.items || data.deals || [];
      setItems(list);
      setStatus(list.length ? "" : "No activity yet.");
    } catch (e: any) { setStatus(e.message || "Could not load alerts."); }
  }
  useEffect(() => { load(); }, []);

  return <main style={shell}><div style={wrap}>
    <section style={hero}><div style={{ color: "#9df3bf", letterSpacing: 5, fontWeight: 900 }}>VAULTFORGE ALERTS</div><h1 style={{ fontSize: "clamp(56px,13vw,96px)", lineHeight: .9, margin: "18px 0" }}>Activity Feed</h1><p style={{ color: "rgba(255,255,255,.7)", fontSize: 23 }}>Match alerts, buy bucket activity, and routing signals.</p><button onClick={load} style={btn}>Refresh Alerts</button><Link href="/dashboard" style={btn}>Dashboard</Link><Link href="/buy-bucket" style={btn}>Buy Bucket</Link></section>
    {status && <section style={{ ...card, color: "#b9ffc9", fontSize: 22 }}>{status}</section>}
    {items.map((item) => { const id = item.deal?.id || item.deal_id || item.id; const photo = firstPhoto(item); return <section key={`${item.id}-${id}`} style={card}>{photo && <img src={photo} alt="Deal" style={{ width: "100%", maxHeight: 260, objectFit: "cover", borderRadius: 22, marginBottom: 18 }} />}<div style={{ color: "#9df3bf", border: "1px solid rgba(157,243,191,.35)", display: "inline-block", borderRadius: 999, padding: "8px 14px", marginBottom: 14 }}>Buy Bucket</div><h2 style={{ fontSize: 36, margin: "8px 0" }}>{item.title || item.deal?.title || "Deal saved to Buy Bucket"}</h2><p style={{ color: "rgba(255,255,255,.7)", fontSize: 21 }}>You added this opportunity to your Buy Bucket for tracking.</p><p style={{ color: "rgba(255,255,255,.45)" }}>{item.created_at ? new Date(item.created_at).toLocaleString() : ""}</p><Link href={`/deal/${id}`} style={btn}>Open Deal Room</Link></section>; })}
  </div></main>;
}
