"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type BucketItem = Record<string, any>;

const shell: React.CSSProperties = {
  minHeight: "100vh",
  background: "radial-gradient(circle at top left, rgba(232,196,107,.14), transparent 30%), linear-gradient(180deg, #07130d 0%, #061006 100%)",
  color: "#fffdf0",
  padding: "28px 18px 100px",
  fontFamily: "Arial, sans-serif",
};
const wrap: React.CSSProperties = { maxWidth: 1120, margin: "0 auto" };
const panel: React.CSSProperties = { border: "1px solid rgba(232,196,107,.28)", borderRadius: 32, background: "rgba(255,255,255,.035)", padding: 24, marginBottom: 22 };
const navButton: React.CSSProperties = { display: "inline-block", margin: "0 10px 10px 0", padding: "14px 22px", borderRadius: 999, background: "#ffe187", color: "#071006", textDecoration: "none", fontWeight: 900, border: "0" };
const card: React.CSSProperties = { border: "1px solid rgba(232,196,107,.22)", borderRadius: 30, background: "rgba(255,255,255,.035)", overflow: "hidden", marginBottom: 22 };
const body: React.CSSProperties = { padding: 22 };
const eyebrow: React.CSSProperties = { color: "#ffe187", letterSpacing: 5, fontSize: 12, fontWeight: 900, textTransform: "uppercase", marginBottom: 12 };
const muted: React.CSSProperties = { color: "rgba(255,255,255,.68)", fontSize: 18, lineHeight: 1.45 };
const pill: React.CSSProperties = { display: "inline-block", margin: "0 8px 8px 0", padding: "8px 12px", borderRadius: 999, border: "1px solid rgba(157,243,191,.35)", color: "#9df3bf", fontWeight: 900, letterSpacing: 2, fontSize: 12 };

function getEmail() {
  if (typeof window === "undefined") return "";
  return (
    window.localStorage.getItem("vf_email") ||
    window.sessionStorage.getItem("vf_email") ||
    window.localStorage.getItem("vf_member_email") ||
    window.sessionStorage.getItem("vf_member_email") ||
    ""
  ).trim().toLowerCase();
}

function headers() {
  return { "Content-Type": "application/json", "x-vf-email": getEmail() };
}

function money(value: any) {
  const n = Number(value || 0);
  if (!n) return "Price not listed";
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function normalizePhotos(value: any): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
    } catch {}
    return value ? [value] : [];
  }
  return [];
}

function getDeal(item: BucketItem) {
  return item?.deal || item?.vf_deals || item?.deals || item;
}

function titleOf(deal: any) {
  return deal?.title || deal?.deal_title || deal?.name || "Untitled Deal";
}

function cityOf(deal: any) {
  return deal?.city || deal?.market_city || deal?.property_city || "Unknown City";
}

function stateOf(deal: any) {
  return deal?.state || deal?.market_state || deal?.property_state || "Unknown State";
}

function priceOf(deal: any) {
  return deal?.asking_price || deal?.price || deal?.ask_price || deal?.purchase_price;
}

export default function BuyBucketPage() {
  const [items, setItems] = useState<BucketItem[]>([]);
  const [status, setStatus] = useState("Loading Buy Bucket...");

  async function loadBucket() {
    setStatus("Loading Buy Bucket...");
    try {
      const res = await fetch("/api/deal/my-bucket", { cache: "no-store", headers: headers() });
      const data = await res.json();
      if (!res.ok || data?.ok === false) {
        setStatus(data?.error || data?.details || "Could not load Buy Bucket.");
        setItems([]);
        return;
      }
      const rows = Array.isArray(data?.items) ? data.items : Array.isArray(data?.deals) ? data.deals : [];
      setItems(rows);
      setStatus(rows.length ? "" : "Your Buy Bucket is empty. Open Projects and save a deal.");
    } catch (error: any) {
      setStatus(error?.message || "Could not load Buy Bucket.");
      setItems([]);
    }
  }

  useEffect(() => {
    loadBucket();
  }, []);

  return (
    <main style={shell}>
      <div style={wrap}>
        <section style={panel}>
          <div style={eyebrow}>BUY BUCKET</div>
          <h1 style={{ fontSize: "clamp(54px, 13vw, 96px)", lineHeight: .9, margin: "0 0 22px", letterSpacing: -3 }}>Saved acquisition targets.</h1>
          <p style={muted}>Deals you save from Projects land here with the real project title, photos, numbers, and Deal Room link.</p>
          <div style={{ marginTop: 24 }}>
            <Link href="/dashboard" style={navButton}>Dashboard</Link>
            <Link href="/projects" style={navButton}>Projects</Link>
            <Link href="/submit" style={navButton}>Create</Link>
            <button type="button" onClick={loadBucket} style={{ ...navButton, cursor: "pointer" }}>Refresh</button>
          </div>
        </section>

        {status && <section style={{ ...panel, color: "#b7ffc9", fontSize: 20 }}>{status}</section>}

        {items.map((item, index) => {
          const deal = getDeal(item) || {};
          const dealId = String(item?.deal_id || deal?.id || "");
          const photos = normalizePhotos(deal?.photo_urls);
          const mainPhoto = deal?.main_photo_url || photos[0] || "";

          return (
            <section key={item?.bucket_id || item?.id || `${dealId}-${index}`} style={card}>
              {mainPhoto ? (
                <img src={mainPhoto} alt={titleOf(deal)} style={{ width: "100%", height: 280, objectFit: "cover", display: "block" }} />
              ) : (
                <div style={{ height: 250, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,.55)", borderBottom: "1px solid rgba(255,255,255,.1)" }}>No photo</div>
              )}
              <div style={body}>
                <div style={eyebrow}>SAVED DEAL</div>
                <h2 style={{ fontSize: 42, lineHeight: 1, margin: "0 0 14px" }}>{titleOf(deal)}</h2>
                <h3 style={{ fontSize: 28, margin: "0 0 16px", color: "#ffe187" }}>{money(priceOf(deal))}</h3>
                <p style={muted}>{cityOf(deal)}, {stateOf(deal)}</p>
                <div>
                  <span style={pill}>{deal?.property_type || "Deal"}</span>
                  <span style={pill}>{deal?.strategy || "Strategy Needed"}</span>
                  <span style={pill}>Saved {item?.created_at ? new Date(item.created_at).toLocaleString() : "recently"}</span>
                </div>
                <div style={{ marginTop: 18 }}>
                  {dealId ? <Link href={`/deal/${dealId}`} style={navButton}>Deal Room</Link> : null}
                  <Link href="/projects" style={navButton}>Back to Projects</Link>
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}
