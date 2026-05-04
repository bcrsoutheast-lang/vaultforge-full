"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

type Deal = Record<string, any>;

const shell: React.CSSProperties = { minHeight: "100vh", background: "radial-gradient(circle at top left, rgba(232,196,107,.16), transparent 30%), radial-gradient(circle at top right, rgba(157,243,191,.10), transparent 28%), linear-gradient(180deg, #030509 0%, #071326 55%, #030509 100%)", color: "white", padding: "26px 18px 90px", fontFamily: "Arial, sans-serif" };
const wrap: React.CSSProperties = { maxWidth: 1180, margin: "0 auto" };
const nav: React.CSSProperties = { display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 24 };
const navLink: React.CSSProperties = { color: "white", textDecoration: "none", border: "1px solid rgba(255,255,255,.18)", borderRadius: 999, padding: "11px 15px", fontSize: 14, background: "rgba(255,255,255,.04)" };
const hero: React.CSSProperties = { border: "1px solid rgba(255,255,255,.16)", background: "linear-gradient(135deg, rgba(255,255,255,.08), rgba(255,255,255,.025))", borderRadius: 34, padding: "28px 22px", marginBottom: 22, boxShadow: "0 30px 90px rgba(0,0,0,.45)" };
const section: React.CSSProperties = { border: "1px solid rgba(255,255,255,.13)", background: "rgba(255,255,255,.035)", borderRadius: 30, padding: 22, marginBottom: 20 };
const grid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 };
const muted: React.CSSProperties = { color: "rgba(255,255,255,.66)", lineHeight: 1.5, fontSize: 16 };
const eyebrow: React.CSSProperties = { color: "#e8c46b", letterSpacing: 5, fontWeight: 900, fontSize: 12, marginBottom: 12 };
const pill: React.CSSProperties = { display: "inline-block", color: "#9df3bf", border: "1px solid rgba(157,243,191,.35)", borderRadius: 999, padding: "7px 12px", fontSize: 12, letterSpacing: 1.4, margin: "0 8px 10px 0", fontWeight: 900 };
const image: React.CSSProperties = { width: "100%", borderRadius: 24, display: "block", border: "1px solid rgba(255,255,255,.12)", objectFit: "cover" };

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

function Field({ label, value }: { label: string; value: any }) {
  if (value === null || value === undefined || value === "" || (Array.isArray(value) && value.length === 0)) return null;
  return (
    <div style={section}>
      <div style={eyebrow}>{label}</div>
      <p style={{ ...muted, fontSize: 20, margin: 0 }}>{Array.isArray(value) ? value.join(", ") : String(value)}</p>
    </div>
  );
}

export default function DealRoomPage() {
  const params = useParams();
  const id = String(params?.id || "");
  const [deal, setDeal] = useState<Deal | null>(null);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadDeal() {
    setLoading(true);
    setStatus("");
    try {
      const res = await fetch(`/api/deal/detail?id=${encodeURIComponent(id)}`, { cache: "no-store", headers: headers() });
      const data = await res.json();
      if (!res.ok) {
        setStatus(data?.error || data?.details || "Could not load deal.");
      } else {
        setDeal(data?.deal || null);
      }
    } catch {
      setStatus("Could not load deal. Refresh and try again.");
    }
    setLoading(false);
  }

  useEffect(() => { if (id) loadDeal(); }, [id]);

  const photos: string[] = Array.isArray(deal?.photo_urls) ? deal.photo_urls.filter(Boolean) : [];
  if (deal?.main_photo_url && !photos.includes(deal.main_photo_url)) photos.unshift(deal.main_photo_url);

  return (
    <main style={shell}>
      <div style={wrap}>
        <nav style={nav}>
          <Link href="/dashboard" style={navLink}>Dashboard</Link>
          <Link href="/projects" style={navLink}>Back to Projects</Link>
          <Link href="/submit" style={navLink}>Create Deal</Link>
          <Link href="/buy-bucket" style={navLink}>Buy Bucket</Link>
        </nav>

        {loading && <section style={section}>Loading deal room...</section>}
        {status && <section style={{ ...section, color: "#ffd0d0" }}>{status}</section>}

        {!loading && !status && !deal && (
          <section style={section}>
            <h1>Deal not found.</h1>
            <Link href="/projects" style={navLink}>Back to Projects</Link>
          </section>
        )}

        {deal && (
          <>
            <section style={hero}>
              <div style={eyebrow}>VAULTFORGE DEAL ROOM</div>
              <h1 style={{ fontSize: "clamp(52px, 12vw, 96px)", lineHeight: .9, letterSpacing: -4, margin: "0 0 18px" }}>{deal.title || "Untitled Deal"}</h1>
              <h2 style={{ fontSize: 34, margin: "0 0 16px" }}>{money(deal.price || deal.asking_price)}</h2>
              <div>
                <span style={pill}>{deal.state || "Unknown State"}</span>
                <span style={pill}>{deal.city || "Unknown City"}</span>
                <span style={pill}>{deal.property_type || "Deal"}</span>
                <span style={pill}>{deal.strategy || "No strategy"}</span>
                <span style={pill}>{deal.status || "active"}</span>
              </div>
              <p style={{ ...muted, fontSize: 20 }}>{deal.description || "No description."}</p>
            </section>

            <section style={section}>
              <div style={eyebrow}>PHOTO GALLERY</div>
              {photos.length === 0 ? (
                <p style={muted}>No photos uploaded for this deal.</p>
              ) : (
                <div style={grid}>
                  {photos.map((src, index) => (
                    <img key={`${src}-${index}`} src={src} alt={`Deal photo ${index + 1}`} style={{ ...image, height: index === 0 ? 360 : 240 }} />
                  ))}
                </div>
              )}
            </section>

            <section style={grid}>
              <Field label="ARV / VALUE" value={deal.arv ? money(deal.arv) : ""} />
              <Field label="REPAIR ESTIMATE" value={deal.repair_estimate ? money(deal.repair_estimate) : ""} />
              <Field label="EQUITY" value={deal.equity ? money(deal.equity) : ""} />
              <Field label="DEAL NEEDS" value={deal.deal_needs} />
              <Field label="BEDROOMS" value={deal.bedrooms} />
              <Field label="BATHROOMS" value={deal.bathrooms} />
              <Field label="BUILDING SQFT" value={deal.building_sqft} />
              <Field label="ACRES" value={deal.land_acres} />
              <Field label="OCCUPANCY" value={deal.occupancy} />
              <Field label="CONDITION" value={deal.condition} />
              <Field label="TIMELINE" value={deal.timeline} />
              <Field label="ZONING" value={deal.zoning} />
            </section>

            <Field label="AI ANALYSIS" value={deal.ai_summary} />
            <Field label="SELLER SITUATION" value={deal.seller_situation} />
            <Field label="ACCESS NOTES" value={deal.access_notes} />
            <Field label="PRIVATE NOTES" value={deal.private_notes} />
          </>
        )}
      </div>
    </main>
  );
}
