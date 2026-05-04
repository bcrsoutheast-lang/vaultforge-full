"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Deal = Record<string, any>;

const shell: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(232,196,107,.16), transparent 30%), radial-gradient(circle at top right, rgba(157,243,191,.10), transparent 28%), linear-gradient(180deg, #06130b 0%, #071326 55%, #030509 100%)",
  color: "#fffdf1",
  padding: "26px 18px 90px",
  fontFamily: "Arial, sans-serif",
};

const wrap: React.CSSProperties = { maxWidth: 1180, margin: "0 auto" };
const nav: React.CSSProperties = { display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 24 };
const navLink: React.CSSProperties = {
  color: "#08120b",
  textDecoration: "none",
  borderRadius: 999,
  padding: "13px 18px",
  fontSize: 15,
  background: "#f5d978",
  fontWeight: 900,
};
const hero: React.CSSProperties = {
  border: "1px solid rgba(245,217,120,.30)",
  background: "linear-gradient(135deg, rgba(245,217,120,.10), rgba(157,243,191,.035))",
  borderRadius: 34,
  padding: "32px 24px",
  marginBottom: 22,
  boxShadow: "0 30px 90px rgba(0,0,0,.45)",
};
const card: React.CSSProperties = {
  border: "1px solid rgba(245,217,120,.24)",
  background: "rgba(255,255,255,.045)",
  borderRadius: 28,
  padding: 18,
  boxShadow: "0 20px 70px rgba(0,0,0,.30)",
};
const grid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(270px, 1fr))", gap: 16 };
const muted: React.CSSProperties = { color: "rgba(255,255,255,.68)", lineHeight: 1.5, fontSize: 16 };
const eyebrow: React.CSSProperties = { color: "#f5d978", letterSpacing: 5, fontWeight: 900, fontSize: 13, marginBottom: 12 };
const pill: React.CSSProperties = {
  display: "inline-block",
  color: "#9df3bf",
  border: "1px solid rgba(157,243,191,.35)",
  borderRadius: 999,
  padding: "7px 12px",
  fontSize: 12,
  letterSpacing: 1.2,
  margin: "0 7px 9px 0",
  fontWeight: 900,
};
const button: React.CSSProperties = {
  border: 0,
  borderRadius: 999,
  padding: "12px 15px",
  background: "#f5d978",
  color: "#08120b",
  fontWeight: 900,
  cursor: "pointer",
  fontSize: 14,
};

function getEmail() {
  if (typeof window === "undefined") return "";
  return (
    window.localStorage.getItem("vf_email") ||
    window.sessionStorage.getItem("vf_email") ||
    window.localStorage.getItem("vf_member_email") ||
    window.sessionStorage.getItem("vf_member_email") ||
    ""
  )
    .trim()
    .toLowerCase();
}

function apiHeaders() {
  return { "Content-Type": "application/json", "x-vf-email": getEmail() };
}

function money(value: unknown) {
  const n = Number(value || 0);
  if (!n) return "Price not listed";
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function photosFromDeal(deal: Deal): string[] {
  const raw = deal?.photo_urls;
  let photos: string[] = [];

  if (Array.isArray(raw)) photos = raw.filter(Boolean).map(String);
  else if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) photos = parsed.filter(Boolean).map(String);
      else if (raw.startsWith("http")) photos = [raw];
    } catch {
      if (raw.startsWith("http")) photos = [raw];
    }
  }

  if (deal?.main_photo_url && !photos.includes(String(deal.main_photo_url))) {
    photos.unshift(String(deal.main_photo_url));
  }

  return photos;
}

function normalizeDeals(payload: any): Deal[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.deals)) return payload.deals;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.bucket)) return payload.bucket;
  if (Array.isArray(payload?.savedDeals)) return payload.savedDeals;
  return [];
}

export default function BuyBucketPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");

  async function loadBucket() {
    setLoading(true);
    setStatus("");
    try {
      const email = getEmail();
      const url = email ? `/api/deal/my-bucket?email=${encodeURIComponent(email)}` : "/api/deal/my-bucket";
      const res = await fetch(url, { cache: "no-store", headers: apiHeaders() });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setStatus(data?.error || data?.details || "Could not load Buy Bucket.");
        setDeals([]);
      } else {
        setDeals(normalizeDeals(data));
      }
    } catch (error: any) {
      setStatus(error?.message || "Could not load Buy Bucket.");
      setDeals([]);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadBucket();
  }, []);

  return (
    <main style={shell}>
      <div style={wrap}>
        <section style={hero}>
          <div style={eyebrow}>BUY BUCKET</div>
          <h1 style={{ fontSize: "clamp(54px, 13vw, 102px)", lineHeight: .88, letterSpacing: -4, margin: "0 0 20px" }}>
            Saved acquisition targets.
          </h1>
          <p style={{ ...muted, fontSize: 22, maxWidth: 720 }}>
            Deals you save from Projects land here for review and follow-up.
          </p>
          <nav style={nav}>
            <Link href="/dashboard" style={navLink}>Dashboard</Link>
            <Link href="/projects" style={navLink}>Projects</Link>
            <Link href="/submit" style={navLink}>Create</Link>
            <button style={button} onClick={loadBucket}>Refresh</button>
          </nav>
        </section>

        {loading && <section style={card}>Loading Buy Bucket...</section>}
        {status && <section style={{ ...card, color: "#9df3bf" }}>{status}</section>}

        {!loading && !status && deals.length === 0 && (
          <section style={card}>
            <p style={{ ...muted, color: "#9df3bf", fontSize: 20, margin: 0 }}>
              Your Buy Bucket is empty. Open Projects and add a deal.
            </p>
          </section>
        )}

        {!loading && deals.length > 0 && (
          <section style={grid}>
            {deals.map((deal) => {
              const id = deal?.deal_id || deal?.id || deal?.vf_deal_id;
              const photos = photosFromDeal(deal);
              const firstPhoto = photos[0] || "";
              return (
                <article key={String(id || deal?.title || Math.random())} style={card}>
                  {firstPhoto ? (
                    <img
                      src={firstPhoto}
                      alt={deal?.title || "Deal photo"}
                      style={{ width: "100%", height: 210, objectFit: "cover", borderRadius: 22, border: "1px solid rgba(255,255,255,.14)", marginBottom: 16 }}
                    />
                  ) : (
                    <div style={{ height: 210, borderRadius: 22, border: "1px solid rgba(255,255,255,.14)", marginBottom: 16, display: "grid", placeItems: "center", color: "rgba(255,255,255,.55)" }}>
                      No photo
                    </div>
                  )}

                  <div style={eyebrow}>SAVED DEAL</div>
                  <h2 style={{ fontSize: 28, lineHeight: 1.05, margin: "0 0 10px" }}>{deal?.title || "Untitled Deal"}</h2>
                  <h3 style={{ fontSize: 22, margin: "0 0 12px", color: "#f5d978" }}>{money(deal?.price || deal?.asking_price)}</h3>

                  <div>
                    <span style={pill}>{deal?.city || "Unknown City"}</span>
                    <span style={pill}>{deal?.state || "Unknown State"}</span>
                    <span style={pill}>{deal?.property_type || "Deal"}</span>
                    <span style={pill}>{deal?.strategy || "Strategy Needed"}</span>
                  </div>

                  <p style={muted}>{deal?.description || "No description saved."}</p>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 16 }}>
                    {id ? <Link href={`/deal/${encodeURIComponent(String(id))}`} style={navLink}>View Deal</Link> : null}
                    <Link href="/projects" style={navLink}>Back to Projects</Link>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}
