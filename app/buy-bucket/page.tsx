"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Item = Record<string, any>;

const shell: React.CSSProperties = { minHeight: "100vh", background: "linear-gradient(180deg,#071326,#06140d)", color: "#fff", padding: "28px 18px 100px", fontFamily: "Arial, sans-serif" };
const wrap: React.CSSProperties = { maxWidth: 1120, margin: "0 auto" };
const hero: React.CSSProperties = { border: "1px solid rgba(255,222,140,.25)", background: "rgba(255,255,255,.035)", borderRadius: 34, padding: 28, marginBottom: 22 };
const btn: React.CSSProperties = { display: "inline-block", background: "#ffe08a", color: "#071326", padding: "14px 24px", borderRadius: 999, fontWeight: 900, textDecoration: "none", margin: "8px 8px 0 0", border: 0 };
const card: React.CSSProperties = { border: "1px solid rgba(255,222,140,.22)", background: "rgba(255,255,255,.035)", borderRadius: 28, overflow: "hidden", marginBottom: 22 };
const imageWrap: React.CSSProperties = { height: 280, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,.04)", color: "rgba(255,255,255,.55)", fontSize: 22 };
const pill: React.CSSProperties = { display: "inline-block", border: "1px solid rgba(157,243,191,.35)", color: "#9df3bf", borderRadius: 999, padding: "8px 12px", margin: "4px", fontWeight: 800, letterSpacing: 1 };

function getEmail() {
  if (typeof window === "undefined") return "";
  return (localStorage.getItem("vf_email") || sessionStorage.getItem("vf_email") || "").trim().toLowerCase();
}
function money(v: any) {
  const n = Number(v || 0);
  if (!n) return "Price not listed";
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}
function firstPhoto(item: Item) {
  const photos = Array.isArray(item.photo_urls) ? item.photo_urls : Array.isArray(item.deal?.photo_urls) ? item.deal.photo_urls : [];
  return item.main_photo_url || item.deal?.main_photo_url || photos[0] || "";
}

export default function BuyBucketPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [status, setStatus] = useState("Loading Buy Bucket...");

  async function load() {
    setStatus("Loading Buy Bucket...");
    try {
      const email = getEmail();
      const res = await fetch(`/api/deal/my-bucket?email=${encodeURIComponent(email)}`, { cache: "no-store", headers: { "x-vf-email": email } });
      const data = await res.json();
      if (!res.ok || data.ok === false) throw new Error(data.error || "Could not load Buy Bucket.");
      const list = data.items || data.deals || [];
      setItems(list);
      setStatus(list.length ? "" : "Your Buy Bucket is empty. Open Projects and add a deal.");
    } catch (e: any) {
      setStatus(e.message || "Could not load Buy Bucket.");
    }
  }

  useEffect(() => { load(); }, []);

  return <main style={shell}><div style={wrap}>
    <section style={hero}>
      <div style={{ color: "#ffe08a", letterSpacing: 6, fontWeight: 900 }}>BUY BUCKET</div>
      <h1 style={{ fontSize: "clamp(52px,12vw,92px)", lineHeight: .9, margin: "18px 0" }}>Saved acquisition targets.</h1>
      <p style={{ color: "rgba(255,255,255,.7)", fontSize: 22, lineHeight: 1.45 }}>Deals you save from Projects land here with the real project title, photos, numbers, and Deal Room link.</p>
      <Link href="/dashboard" style={btn}>Dashboard</Link><Link href="/projects" style={btn}>Projects</Link><Link href="/submit" style={btn}>Create</Link><button onClick={load} style={btn}>Refresh</button>
    </section>

    {status && <section style={{ ...hero, color: "#b9ffc9", fontSize: 22 }}>{status}</section>}

    {items.map((item) => {
      const id = item.deal?.id || item.deal_id || item.id;
      const photo = firstPhoto(item);
      return <section key={`${item.id}-${id}`} style={card}>
        <div style={imageWrap}>{photo ? <img src={photo} alt="Deal" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "No photo"}</div>
        <div style={{ padding: 24 }}>
          <div style={{ color: "#ffe08a", letterSpacing: 5, fontWeight: 900 }}>SAVED DEAL</div>
          <h2 style={{ fontSize: 44, margin: "14px 0 8px" }}>{item.title || item.deal?.title || "Untitled Deal"}</h2>
          <h3 style={{ color: "#ffe08a", fontSize: 30, margin: "0 0 12px" }}>{money(item.asking_price || item.deal?.asking_price || item.price)}</h3>
          <p style={{ color: "rgba(255,255,255,.72)", fontSize: 22 }}>{item.city || item.deal?.city || "Unknown City"}, {item.state || item.deal?.state || "Unknown State"}</p>
          <span style={pill}>{item.property_type || item.deal?.property_type || "Deal"}</span><span style={pill}>{item.strategy || item.deal?.strategy || "Strategy Needed"}</span>
          <div style={{ marginTop: 18 }}><Link href={`/deal/${id}`} style={btn}>Open Deal Room</Link></div>
        </div>
      </section>;
    })}
  </div></main>;
}
