"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Deal = {
  id: string;
  title?: string;
  state?: string;
  city?: string;
  property_type?: string;
  strategy?: string;
  price?: number | string | null;
  asking_price?: number | string | null;
  description?: string | null;
  status?: string | null;
  archived?: boolean | null;
  photo_urls?: string[] | null;
  main_photo_url?: string | null;
};

const shell: React.CSSProperties = { minHeight: "100vh", background: "radial-gradient(circle at top left, rgba(232,196,107,.16), transparent 30%), radial-gradient(circle at top right, rgba(157,243,191,.10), transparent 28%), linear-gradient(180deg, #030509 0%, #071326 55%, #030509 100%)", color: "white", padding: "26px 18px 90px", fontFamily: "Arial, sans-serif" };
const wrap: React.CSSProperties = { maxWidth: 1180, margin: "0 auto" };
const nav: React.CSSProperties = { display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 24 };
const navLink: React.CSSProperties = { color: "white", textDecoration: "none", border: "1px solid rgba(255,255,255,.18)", borderRadius: 999, padding: "11px 15px", fontSize: 14, background: "rgba(255,255,255,.04)" };
const hero: React.CSSProperties = { border: "1px solid rgba(255,255,255,.16)", background: "linear-gradient(135deg, rgba(255,255,255,.08), rgba(255,255,255,.025))", borderRadius: 34, padding: "28px 22px", marginBottom: 22, boxShadow: "0 30px 90px rgba(0,0,0,.45)" };
const grid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(310px, 1fr))", gap: 18 };
const card: React.CSSProperties = { border: "1px solid rgba(255,255,255,.15)", background: "linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.025))", borderRadius: 30, padding: 22, color: "white", boxShadow: "0 20px 60px rgba(0,0,0,.22)" };
const btn: React.CSSProperties = { display: "inline-block", background: "linear-gradient(135deg, #f4d47b, #9df3bf)", color: "#06101e", borderRadius: 999, padding: "13px 16px", textDecoration: "none", fontWeight: 950, margin: "6px 8px 6px 0", border: 0, cursor: "pointer" };
const danger: React.CSSProperties = { ...btn, background: "rgba(255,107,107,.12)", color: "#ffd0d0", border: "1px solid rgba(255,107,107,.5)" };
const muted: React.CSSProperties = { color: "rgba(255,255,255,.66)", lineHeight: 1.5, fontSize: 16 };
const eyebrow: React.CSSProperties = { color: "#e8c46b", letterSpacing: 5, fontWeight: 900, fontSize: 12, marginBottom: 12 };
const pill: React.CSSProperties = { display: "inline-block", color: "#9df3bf", border: "1px solid rgba(157,243,191,.35)", borderRadius: 999, padding: "7px 12px", fontSize: 12, letterSpacing: 1.4, margin: "0 8px 10px 0", fontWeight: 900 };
const img: React.CSSProperties = { width: "100%", height: 230, objectFit: "cover", borderRadius: 22, display: "block", marginBottom: 18, border: "1px solid rgba(255,255,255,.12)" };

function getEmail() {
  if (typeof window === "undefined") return "";
  return (window.localStorage.getItem("vf_email") || window.sessionStorage.getItem("vf_email") || "").trim().toLowerCase();
}

function headers() {
  return { "Content-Type": "application/json", "x-vf-email": getEmail() };
}

function money(value: unknown) {
  const n = Number(value || 0);
  if (!n) return "No price listed";
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function firstPhoto(deal: Deal) {
  if (deal.main_photo_url) return deal.main_photo_url;
  if (Array.isArray(deal.photo_urls) && deal.photo_urls.length > 0) return deal.photo_urls[0];
  return "";
}

export default function ProjectsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadDeals() {
    setLoading(true);
    setStatus("");
    try {
      const res = await fetch("/api/deal/list", { cache: "no-store", headers: headers() });
      const data = await res.json();
      if (!res.ok) {
        setStatus(data?.error || data?.details || "Could not load deals.");
        setDeals([]);
      } else {
        setDeals(data?.deals || []);
      }
    } catch {
      setStatus("Could not load deals. Refresh and try again.");
    }
    setLoading(false);
  }

  async function addToBucket(id: string) {
    const res = await fetch("/api/deal/buy-bucket", { method: "POST", headers: headers(), body: JSON.stringify({ deal_id: id }) });
    const data = await res.json();
    setStatus(res.ok ? "Added to Buy Bucket." : data?.error || "Failed to add to Buy Bucket.");
  }

  async function archiveDeal(id: string) {
    const res = await fetch("/api/deal/archive", { method: "POST", headers: headers(), body: JSON.stringify({ deal_id: id }) });
    const data = await res.json();
    if (res.ok) {
      setStatus("Deal archived.");
      loadDeals();
    } else {
      setStatus(data?.error || "Failed to archive deal.");
    }
  }

  useEffect(() => { loadDeals(); }, []);

  return (
    <main style={shell}>
      <div style={wrap}>
        <nav style={nav}>
          <Link href="/dashboard" style={navLink}>Dashboard</Link>
          <Link href="/submit" style={navLink}>Create Deal</Link>
          <Link href="/buy-bucket" style={navLink}>Buy Bucket</Link>
          <Link href="/alerts" style={navLink}>Alerts</Link>
          <Link href="/messages" style={navLink}>Messages</Link>
          <Link href="/network" style={navLink}>Network</Link>
        </nav>

        <section style={hero}>
          <div style={eyebrow}>VAULTFORGE PROJECTS</div>
          <h1 style={{ fontSize: "clamp(54px, 13vw, 96px)", lineHeight: .9, letterSpacing: -4, margin: "0 0 18px" }}>Saved Deals</h1>
          <p style={{ ...muted, fontSize: 22 }}>Open deal rooms, view photos, read AI analysis, save opportunities, message owners, or archive clutter safely.</p>
        </section>

        {status && <section style={{ ...card, color: status.toLowerCase().includes("fail") || status.toLowerCase().includes("could") ? "#ffd0d0" : "#9df3bf", marginBottom: 18 }}>{status}</section>}
        {loading && <section style={card}>Loading deals...</section>}

        {!loading && deals.length === 0 && (
          <section style={card}>
            <h2>No deals yet.</h2>
            <p style={muted}>Create your first deal room and upload photos.</p>
            <Link href="/submit" style={btn}>Create Deal</Link>
          </section>
        )}

        <section style={grid}>
          {deals.map((deal) => {
            const image = firstPhoto(deal);
            return (
              <article key={deal.id} style={card}>
                {image ? (
                  <img src={image} alt={deal.title || "Deal photo"} style={img} />
                ) : (
                  <div style={{ ...img, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,.035)", color: "rgba(255,255,255,.45)" }}>No photo uploaded</div>
                )}

                <div>
                  <span style={pill}>{deal.state || "Unknown State"}</span>
                  <span style={pill}>{deal.property_type || "Deal"}</span>
                  {Array.isArray(deal.photo_urls) && deal.photo_urls.length > 0 && <span style={pill}>{deal.photo_urls.length} photo{deal.photo_urls.length === 1 ? "" : "s"}</span>}
                </div>

                <h2 style={{ fontSize: 42, lineHeight: 1, margin: "8px 0 14px" }}>{deal.title || "Untitled Deal"}</h2>
                <h3 style={{ fontSize: 30, margin: "0 0 14px" }}>{money(deal.price || deal.asking_price)}</h3>
                <p style={{ ...muted, fontSize: 18 }}>{deal.description || "No description."}</p>

                <div style={{ marginTop: 16 }}>
                  <span style={pill}>{deal.strategy || "No strategy"}</span>
                  <span style={pill}>{deal.status || "active"}</span>
                </div>

                <div style={{ marginTop: 18 }}>
                  <Link href={`/deal/${deal.id}`} style={btn}>View Deal Room</Link>
                  <button type="button" onClick={() => addToBucket(deal.id)} style={btn}>Add to Buy Bucket</button>
                  <button type="button" onClick={() => archiveDeal(deal.id)} style={danger}>Archive</button>
                </div>
              </article>
            );
          })}
        </section>
      </div>
    </main>
  );
}
