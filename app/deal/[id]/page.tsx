"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

type Deal = Record<string, any>;

const shell: React.CSSProperties = { minHeight: "100vh", background: "radial-gradient(circle at top left, rgba(232,196,107,.16), transparent 30%), linear-gradient(180deg, #030509 0%, #071326 55%, #030509 100%)", color: "white", padding: "26px 18px 100px", fontFamily: "Arial, sans-serif" };
const wrap: React.CSSProperties = { maxWidth: 1180, margin: "0 auto" };
const navLink: React.CSSProperties = { display: "inline-block", color: "#071326", textDecoration: "none", borderRadius: 999, padding: "13px 18px", fontSize: 15, background: "#ffe187", fontWeight: 900, margin: "0 10px 10px 0" };
const hero: React.CSSProperties = { border: "1px solid rgba(255,255,255,.16)", background: "linear-gradient(135deg, rgba(255,255,255,.08), rgba(255,255,255,.025))", borderRadius: 34, padding: "28px 22px", marginBottom: 22, boxShadow: "0 30px 90px rgba(0,0,0,.45)" };
const section: React.CSSProperties = { border: "1px solid rgba(255,255,255,.13)", background: "rgba(255,255,255,.035)", borderRadius: 30, padding: 22, marginBottom: 20 };
const grid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 };
const muted: React.CSSProperties = { color: "rgba(255,255,255,.66)", lineHeight: 1.5, fontSize: 16 };
const eyebrow: React.CSSProperties = { color: "#e8c46b", letterSpacing: 5, fontWeight: 900, fontSize: 12, marginBottom: 12, textTransform: "uppercase" };
const pill: React.CSSProperties = { display: "inline-block", color: "#9df3bf", border: "1px solid rgba(157,243,191,.35)", borderRadius: 999, padding: "7px 12px", fontSize: 12, letterSpacing: 1.4, margin: "0 8px 10px 0", fontWeight: 900 };

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

function photosFrom(deal: any): string[] {
  const list: string[] = [];
  const raw = deal?.photo_urls;
  if (Array.isArray(raw)) list.push(...raw.map(String).filter(Boolean));
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) list.push(...parsed.map(String).filter(Boolean));
      else if (raw) list.push(raw);
    } catch {
      if (raw) list.push(raw);
    }
  }
  if (deal?.main_photo_url && !list.includes(deal.main_photo_url)) list.unshift(deal.main_photo_url);
  return list.filter(Boolean);
}

function val(deal: any, keys: string[]) {
  for (const key of keys) {
    if (deal?.[key] !== null && deal?.[key] !== undefined && deal?.[key] !== "") return deal[key];
  }
  return "";
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
    if (!id) return;
    setLoading(true);
    setStatus("");
    try {
      const res = await fetch(`/api/deal/detail?id=${encodeURIComponent(id)}`, { cache: "no-store", headers: headers() });
      const data = await res.json();
      if (!res.ok || data?.ok === false) setStatus(data?.error || data?.details || "Could not load deal.");
      else setDeal(data?.deal || null);
    } catch {
      setStatus("Could not load deal. Refresh and try again.");
    }
    setLoading(false);
  }

  useEffect(() => { loadDeal(); }, [id]);

  const photos = photosFrom(deal);
  const title = val(deal, ["title", "deal_title", "name"]) || "Untitled Deal";
  const asking = val(deal, ["asking_price", "price", "ask_price", "purchase_price"]);
  const city = val(deal, ["city", "market_city", "property_city"]) || "Unknown City";
  const state = val(deal, ["state", "market_state", "property_state"]) || "Unknown State";

  return (
    <main style={shell}>
      <div style={wrap}>
        <nav style={{ marginBottom: 24 }}>
          <Link href="/dashboard" style={navLink}>Dashboard</Link>
          <Link href="/projects" style={navLink}>Projects</Link>
          <Link href="/buy-bucket" style={navLink}>Buy Bucket</Link>
          <Link href="/alerts" style={navLink}>Alerts</Link>
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
              <h1 style={{ fontSize: "clamp(52px, 12vw, 96px)", lineHeight: .9, letterSpacing: -4, margin: "0 0 18px" }}>{title}</h1>
              <h2 style={{ fontSize: 34, margin: "0 0 16px" }}>{money(asking)}</h2>
              <div>
                <span style={pill}>{city}</span>
                <span style={pill}>{state}</span>
                <span style={pill}>{val(deal, ["property_type", "asset_type"]) || "Deal"}</span>
                <span style={pill}>{val(deal, ["strategy"]) || "Strategy Needed"}</span>
                <span style={pill}>{deal.status || "active"}</span>
              </div>
              <p style={{ ...muted, fontSize: 20 }}>{deal.description || deal.summary || "No description."}</p>
            </section>

            <section style={section}>
              <div style={eyebrow}>PHOTO GALLERY</div>
              {photos.length === 0 ? (
                <p style={muted}>No photos uploaded for this deal.</p>
              ) : (
                <div style={grid}>
                  {photos.map((src, index) => (
                    <img key={`${src}-${index}`} src={src} alt={`Deal photo ${index + 1}`} style={{ width: "100%", height: index === 0 ? 360 : 240, objectFit: "cover", borderRadius: 24, border: "1px solid rgba(255,255,255,.12)" }} />
                  ))}
                </div>
              )}
            </section>

            <section style={grid}>
              <Field label="ARV / VALUE" value={val(deal, ["arv", "after_repair_value"]) ? money(val(deal, ["arv", "after_repair_value"])) : ""} />
              <Field label="REPAIR ESTIMATE" value={val(deal, ["repairs", "repair_estimate", "estimated_repairs"]) ? money(val(deal, ["repairs", "repair_estimate", "estimated_repairs"])) : ""} />
              <Field label="BEDROOMS" value={val(deal, ["beds", "bedrooms"])} />
              <Field label="BATHROOMS" value={val(deal, ["baths", "bathrooms"])} />
              <Field label="SQFT" value={val(deal, ["sqft", "building_sqft"])} />
              <Field label="ADDRESS" value={val(deal, ["address", "property_address"])} />
              <Field label="DEAL NEEDS" value={val(deal, ["deal_needs", "needs"])} />
              <Field label="TIMELINE" value={val(deal, ["timeline"])} />
            </section>

            <Field label="AI ANALYSIS" value={val(deal, ["ai_summary", "analysis"])} />
            <Field label="SELLER SITUATION" value={val(deal, ["seller_situation"])} />
            <Field label="ACCESS NOTES" value={val(deal, ["access_notes"])} />
            <Field label="PRIVATE NOTES" value={val(deal, ["private_notes"])} />
          </>
        )}
      </div>
    </main>
  );
}
