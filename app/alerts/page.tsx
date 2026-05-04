"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Item = Record<string, any>;

const shell: React.CSSProperties = { minHeight: "100vh", background: "linear-gradient(180deg,#071326,#030509)", color: "white", padding: "28px 18px 100px", fontFamily: "Arial, sans-serif" };
const wrap: React.CSSProperties = { maxWidth: 1060, margin: "0 auto" };
const panel: React.CSSProperties = { border: "1px solid rgba(255,255,255,.16)", borderRadius: 32, background: "rgba(255,255,255,.045)", padding: 24, marginBottom: 22 };
const button: React.CSSProperties = { display: "inline-block", padding: "14px 22px", borderRadius: 999, background: "#9df3bf", color: "#071326", fontWeight: 900, textDecoration: "none", border: 0, margin: "0 10px 10px 0" };
const eyebrow: React.CSSProperties = { color: "#9df3bf", letterSpacing: 5, fontSize: 12, fontWeight: 900, textTransform: "uppercase", marginBottom: 12 };
const muted: React.CSSProperties = { color: "rgba(255,255,255,.70)", fontSize: 18, lineHeight: 1.45 };

function getEmail() {
  if (typeof window === "undefined") return "";
  return (window.localStorage.getItem("vf_email") || window.sessionStorage.getItem("vf_email") || "").trim().toLowerCase();
}

function headers() {
  return { "Content-Type": "application/json", "x-vf-email": getEmail() };
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

function getDeal(item: any) {
  return item?.deal || item?.vf_deals || item?.deals || item;
}

function titleOf(deal: any) {
  return deal?.title || deal?.deal_title || deal?.name || "Saved Deal";
}

export default function AlertsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [status, setStatus] = useState("Loading alerts...");

  async function loadAlerts() {
    setStatus("Loading alerts...");
    try {
      const res = await fetch("/api/deal/my-bucket", { cache: "no-store", headers: headers() });
      const data = await res.json();
      if (!res.ok || data?.ok === false) {
        setStatus(data?.error || data?.details || "Could not load alerts.");
        setItems([]);
        return;
      }
      const rows = Array.isArray(data?.items) ? data.items : Array.isArray(data?.deals) ? data.deals : [];
      setItems(rows);
      setStatus(rows.length ? "" : "No activity yet. Save a deal from Projects to create an alert.");
    } catch (error: any) {
      setStatus(error?.message || "Could not load alerts.");
    }
  }

  useEffect(() => { loadAlerts(); }, []);

  return (
    <main style={shell}>
      <div style={wrap}>
        <section style={panel}>
          <div style={eyebrow}>VAULTFORGE ALERTS</div>
          <h1 style={{ fontSize: "clamp(58px, 14vw, 104px)", lineHeight: .9, margin: "0 0 22px", letterSpacing: -3 }}>Activity Feed</h1>
          <p style={muted}>Match alerts, buy bucket activity, and routing signals.</p>
          <button type="button" onClick={loadAlerts} style={{ ...button, cursor: "pointer", marginTop: 18 }}>Refresh Alerts</button>
          <Link href="/dashboard" style={button}>Dashboard</Link>
          <Link href="/buy-bucket" style={button}>Buy Bucket</Link>
        </section>

        {status && <section style={{ ...panel, color: "#b7ffc9", fontSize: 20 }}>{status}</section>}

        {items.map((item, index) => {
          const deal = getDeal(item) || {};
          const dealId = String(item?.deal_id || deal?.id || "");
          const photos = normalizePhotos(deal?.photo_urls);
          const mainPhoto = deal?.main_photo_url || photos[0] || "";

          return (
            <section key={item?.bucket_id || item?.id || `${dealId}-${index}`} style={panel}>
              <div style={eyebrow}>Buy Bucket</div>
              <h2 style={{ fontSize: 42, lineHeight: 1.05, margin: "0 0 14px" }}>{titleOf(deal)} saved to Buy Bucket</h2>
              {mainPhoto ? <img src={mainPhoto} alt={titleOf(deal)} style={{ width: "100%", maxHeight: 280, objectFit: "cover", borderRadius: 24, marginBottom: 16 }} /> : null}
              <p style={muted}>You added this opportunity to your Buy Bucket for review and follow-up.</p>
              <p style={{ ...muted, fontSize: 15 }}>{item?.created_at ? new Date(item.created_at).toLocaleString() : "Recent activity"}</p>
              {dealId ? <Link href={`/deal/${dealId}`} style={button}>Deal Room</Link> : null}
            </section>
          );
        })}
      </div>
    </main>
  );
}
