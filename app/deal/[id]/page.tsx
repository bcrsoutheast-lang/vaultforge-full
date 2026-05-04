"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

type Deal = Record<string, any>;
const shell: React.CSSProperties = { minHeight: "100vh", background: "linear-gradient(180deg,#030509,#071326 55%,#030509)", color: "white", padding: "28px 18px 100px", fontFamily: "Arial, sans-serif" };
const wrap: React.CSSProperties = { maxWidth: 1180, margin: "0 auto" };
const hero: React.CSSProperties = { border: "1px solid rgba(255,255,255,.16)", background: "rgba(255,255,255,.045)", borderRadius: 34, padding: 28, marginBottom: 22 };
const btn: React.CSSProperties = { display: "inline-block", background: "#ffe08a", color: "#071326", padding: "13px 21px", borderRadius: 999, fontWeight: 900, textDecoration: "none", margin: "0 8px 10px 0" };
const card: React.CSSProperties = { border: "1px solid rgba(255,255,255,.13)", background: "rgba(255,255,255,.035)", borderRadius: 28, padding: 22, marginBottom: 18 };
const grid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 16 };
const pill: React.CSSProperties = { display: "inline-block", color: "#9df3bf", border: "1px solid rgba(157,243,191,.35)", borderRadius: 999, padding: "8px 12px", margin: "4px", fontWeight: 900 };
function money(v: any) { const n = Number(v || 0); if (!n) return "Price not listed"; return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }); }
function Field({ label, value }: { label: string; value: any }) { if (value === null || value === undefined || value === "") return null; return <section style={card}><div style={{ color: "#ffe08a", letterSpacing: 4, fontWeight: 900 }}>{label}</div><p style={{ color: "rgba(255,255,255,.78)", fontSize: 22 }}>{String(value)}</p></section>; }

export default function DealRoomPage() {
  const params = useParams();
  const id = String(params?.id || "");
  const [deal, setDeal] = useState<Deal | null>(null);
  const [status, setStatus] = useState("Loading deal room...");

  async function load() {
    setStatus("Loading deal room...");
    try {
      const res = await fetch(`/api/deal/detail?id=${encodeURIComponent(id)}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok || data.ok === false) throw new Error(data.error || "Could not load deal.");
      setDeal(data.deal || null);
      setStatus("");
    } catch (e: any) { setStatus(e.message || "Could not load deal."); }
  }
  useEffect(() => { if (id) load(); }, [id]);

  const photos = Array.isArray(deal?.photo_urls) ? deal!.photo_urls : [];
  return <main style={shell}><div style={wrap}>
    <nav><Link href="/projects" style={btn}>Projects</Link><Link href="/buy-bucket" style={btn}>Buy Bucket</Link><Link href="/dashboard" style={btn}>Dashboard</Link></nav>
    {status && <section style={{ ...card, color: "#ffd0d0", fontSize: 22 }}>{status}</section>}
    {deal && <>
      <section style={hero}><div style={{ color: "#ffe08a", letterSpacing: 5, fontWeight: 900 }}>VAULTFORGE DEAL ROOM</div><h1 style={{ fontSize: "clamp(52px,12vw,96px)", lineHeight: .9, margin: "18px 0" }}>{deal.title || deal.deal_title || "Untitled Deal"}</h1><h2 style={{ fontSize: 34, color: "#ffe08a" }}>{money(deal.asking_price || deal.price)}</h2><span style={pill}>{deal.city || "Unknown City"}</span><span style={pill}>{deal.state || "Unknown State"}</span><span style={pill}>{deal.property_type || "Deal"}</span><span style={pill}>{deal.strategy || "Strategy Needed"}</span><p style={{ color: "rgba(255,255,255,.72)", fontSize: 21, lineHeight: 1.45 }}>{deal.description || "No description."}</p></section>
      <section style={card}><div style={{ color: "#ffe08a", letterSpacing: 5, fontWeight: 900, marginBottom: 18 }}>PHOTO GALLERY</div>{photos.length ? <div style={grid}>{photos.map((src: string, i: number) => <img key={`${src}-${i}`} src={src} alt="Deal" style={{ width: "100%", height: i === 0 ? 360 : 240, objectFit: "cover", borderRadius: 22 }} />)}</div> : <p style={{ color: "rgba(255,255,255,.65)", fontSize: 20 }}>No photos uploaded for this deal.</p>}</section>
      <section style={grid}><Field label="ARV" value={deal.arv ? money(deal.arv) : ""} /><Field label="REPAIRS" value={(deal.repairs || deal.repair_estimate) ? money(deal.repairs || deal.repair_estimate) : ""} /><Field label="STATUS" value={deal.status} /><Field label="OWNER" value={deal.owner_email || deal.member_email} /></section>
    </>}
  </div></main>;
}
