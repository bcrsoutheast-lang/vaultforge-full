"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Deal = Record<string, any>;

function clean(value: unknown) { return String(value || "").trim(); }
function meta(row: Deal | null) { return row && typeof row.metadata === "object" && row.metadata ? row.metadata : {}; }
function first(...values: unknown[]) {
  for (const value of values) {
    if (Array.isArray(value)) {
      const found = value.find((item) => clean(item));
      if (found !== undefined) return clean(found);
      continue;
    }
    const text = clean(value);
    if (text) return text;
  }
  return "";
}
function from(deal: Deal | null, ...keys: string[]) {
  if (!deal) return "";
  const m = meta(deal);
  const values: unknown[] = [];
  for (const key of keys) {
    values.push(deal[key]);
    values.push(m[key]);
  }
  return first(...values);
}
function parseArray(value: unknown): any[] {
  if (Array.isArray(value)) return value;
  const text = clean(value);
  if (!text) return [];
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return parsed;
  } catch {}
  return text.split(/[,\n|;]/).map((item) => item.trim()).filter(Boolean);
}
function photosOf(deal: Deal) {
  const m = meta(deal);
  const values = [
    deal.main_photo_url, deal.image_url, deal.photo_url, deal.primary_photo_url,
    m.main_photo_url, m.image_url, m.photo_url, m.primary_photo_url,
    ...parseArray(deal.photo_urls), ...parseArray(m.photo_urls),
    ...parseArray(deal.photos), ...parseArray(m.photos),
  ];
  return Array.from(new Set(values.map((item: any) => {
    if (typeof item === "string") return clean(item);
    if (item && typeof item === "object") return clean(item.url || item.publicUrl || item.public_url || item.photo_url || item.image_url);
    return "";
  }).filter((url) => url.startsWith("http"))));
}
function money(value: unknown) {
  const text = clean(value);
  if (!text) return "Not listed";
  const number = Number(text.replace(/[^\d.-]/g, ""));
  if (!Number.isFinite(number)) return text;
  return number.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}
function display(value: unknown) { return clean(value) || "Not listed"; }
function numberValue(value: unknown) {
  const text = clean(value);
  if (!text) return NaN;
  const number = Number(text.replace(/[^\d.-]/g, ""));
  return Number.isFinite(number) ? number : NaN;
}
function spreadText(deal: Deal | null) {
  const ask = numberValue(from(deal, "asking_price", "price"));
  const arv = numberValue(from(deal, "arv", "arv_value", "estimated_value"));
  const repairs = numberValue(from(deal, "repair_estimate", "repairs_needed", "estimated_repairs"));
  if (!Number.isFinite(ask) || !Number.isFinite(arv)) return "";
  const spread = arv - ask - (Number.isFinite(repairs) ? repairs : 0);
  const formatted = spread.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  if (spread > 0) return `Estimated room before soft costs: ${formatted}.`;
  if (spread < 0) return `Pricing pressure before soft costs: ${formatted}.`;
  return "Estimated spread is neutral before soft costs.";
}
function bestFit(deal: Deal | null) {
  const asset = from(deal, "asset_type", "property_type", "deal_type").toLowerCase();
  const strategy = from(deal, "strategy", "exit_strategy").toLowerCase();
  const needs = from(deal, "routing_needs", "deal_needs", "needs").toLowerCase();
  const contractor = from(deal, "contractor_scope");
  const capital = from(deal, "capital_needed");
  if (needs.includes("buyer") || strategy.includes("flip")) return contractor ? "cash buyer or flip operator with contractor capacity" : "cash buyer or flip operator";
  if (capital || needs.includes("capital") || needs.includes("lender")) return "private lender, capital partner, or JV operator";
  if (asset.includes("land")) return "land buyer, builder, or entitlement operator";
  if (asset.includes("commercial")) return "commercial operator or capitalized sponsor";
  return "local operator with execution capacity";
}
function smartBrief(deal: Deal | null) {
  if (!deal) return "VaultForge execution intelligence layer.";
  const asset = display(from(deal, "asset_type", "property_type", "deal_type")).toLowerCase();
  const strategy = from(deal, "strategy", "exit_strategy");
  const market = first([from(deal, "city"), from(deal, "state", "market")].filter(Boolean).join(", "), from(deal, "market", "location", "address"));
  const ask = money(from(deal, "asking_price", "price"));
  const arv = money(from(deal, "arv", "arv_value", "estimated_value"));
  const repairs = money(from(deal, "repair_estimate", "repairs_needed", "estimated_repairs"));
  const needs = from(deal, "routing_needs", "deal_needs", "needs");
  const signals = from(deal, "distress_signals", "seller_pressure");
  const urgency = from(deal, "urgency", "priority");
  const contractor = from(deal, "contractor_scope");
  const lead = [`Route this ${asset}`, strategy ? `as a ${strategy} opportunity` : "as an operator-reviewed opportunity", market ? `in ${market}` : ""].filter(Boolean).join(" ");
  const economics = [ask !== "Not listed" ? `${ask} ask` : "", arv !== "Not listed" ? `${arv} ARV` : "", repairs !== "Not listed" ? `${repairs} repairs` : ""].filter(Boolean);
  const execution = [needs ? `needs ${needs}` : "", signals ? `pressure signal: ${signals}` : "", urgency ? `urgency: ${urgency}` : "", contractor ? `contractor scope: ${contractor}` : ""].filter(Boolean);
  return [`${lead}.`, economics.length ? `Economics: ${economics.join(" / ")}. ${spreadText(deal)}`.trim() : "", execution.length ? `Execution read: ${execution.join(" / ")}.` : "", `Best-fit route: ${bestFit(deal)}.`].filter(Boolean).join(" ");
}

const page: React.CSSProperties = { minHeight: "100vh", background: "radial-gradient(circle at top left, rgba(232,196,107,.16), transparent 30%), linear-gradient(180deg,#02040a,#071326 55%,#02040a)", color: "white", padding: "24px 16px 100px", fontFamily: "Arial, sans-serif" };
const wrap: React.CSSProperties = { width: "min(1180px,100%)", margin: "0 auto" };
const card: React.CSSProperties = { border: "1px solid rgba(232,196,107,.22)", borderRadius: 28, padding: 22, background: "rgba(255,255,255,.04)", marginBottom: 18 };
const label: React.CSSProperties = { color: "#e8c46b", fontWeight: 900, fontSize: 12, letterSpacing: ".18em", textTransform: "uppercase", marginBottom: 8 };
const button: React.CSSProperties = { display: "inline-flex", justifyContent: "center", alignItems: "center", minHeight: 48, padding: "12px 18px", borderRadius: 999, textDecoration: "none", fontWeight: 900, border: "1px solid rgba(255,255,255,.14)", color: "white", background: "rgba(255,255,255,.06)" };
const primary: React.CSSProperties = { ...button, background: "linear-gradient(135deg,#f8e7b0,#e8c46b)", color: "#071326", border: "none" };
function Info({ title, value }: { title: string; value: unknown }) {
  return <div style={card}><div style={label}>{title}</div><div style={{ fontSize: 28, fontWeight: 900 }}>{display(value)}</div></div>;
}

export default function DealDetailPage() {
  const [deal, setDeal] = useState<Deal | null>(null);
  const [status, setStatus] = useState("Loading deal...");
  const [dealId, setDealId] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const params = new URLSearchParams(window.location.search);
        const id = clean(params.get("id"));
        setDealId(id);
        if (!id) {
          setStatus("Missing deal id.");
          return;
        }
        const response = await fetch(`/api/deal/detail?id=${encodeURIComponent(id)}`, { cache: "no-store", credentials: "include" });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || data?.ok === false) throw new Error(data?.error || "Could not load deal.");
        setDeal(data.deal || null);
        setStatus("");
      } catch (error: any) {
        setStatus(error?.message || "Could not load deal.");
      }
    }
    load();
  }, []);

  const photos = useMemo(() => (deal ? photosOf(deal) : []), [deal]);
  const signalId = from(deal, "signal_id");
  const detailTitle = first(from(deal, "title", "deal_title", "project_title"), from(deal, "address", "property_address"), "Deal Detail");
  const market = first([from(deal, "city"), from(deal, "state", "market")].filter(Boolean).join(", "), from(deal, "market", "location", "address"));

  return <main style={page}>
    <style>{`
      .vf-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}
      .vf-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:20px}
      .vf-photo-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px}
      @media(max-width:820px){.vf-grid{grid-template-columns:1fr!important}.vf-actions{display:grid!important;grid-template-columns:1fr!important}.vf-actions a{width:100%;box-sizing:border-box}}
    `}</style>
    <div style={wrap}>
      <section style={card}>
        <div style={label}>VaultForge Deal Detail</div>
        <h1 style={{ fontSize: "clamp(48px,10vw,90px)", lineHeight: .9, margin: "10px 0 14px", letterSpacing: "-.07em" }}>{detailTitle}</h1>
        <p style={{ color: "#cbd5e1", fontSize: 18 }}>{status || smartBrief(deal)}</p>
        <div className="vf-actions">
          <Link href="/projects" style={primary}>Projects</Link>
          <Link href="/dashboard" style={button}>Dashboard</Link>
          <Link href="/submit" style={button}>Create Deal</Link>
          {signalId ? <Link href={`/signals/${encodeURIComponent(signalId)}`} style={button}>Signal Room</Link> : null}
          {signalId ? <Link href={`/routing-room/${encodeURIComponent(signalId)}`} style={button}>Routing Room</Link> : null}
        </div>
      </section>

      {deal ? <>
        {photos.length ? <section style={card}><div style={label}>Photos</div><div className="vf-photo-grid">{photos.map((photo) => <img key={photo} src={photo} alt="Deal" style={{ width: "100%", height: 240, objectFit: "cover", borderRadius: 20, border: "1px solid rgba(232,196,107,.18)" }} />)}</div></section> : null}
        <section className="vf-grid">
          <Info title="Property Type" value={from(deal, "property_type", "deal_type", "asset_type")} />
          <Info title="Market" value={market} />
          <Info title="Strategy" value={from(deal, "strategy", "exit_strategy")} />
          <Info title="Asking Price" value={money(from(deal, "asking_price", "price"))} />
          <Info title="ARV" value={money(from(deal, "arv", "arv_value", "estimated_value"))} />
          <Info title="Repairs" value={money(from(deal, "repair_estimate", "repairs_needed", "estimated_repairs"))} />
          <Info title="Beds" value={from(deal, "beds", "bedrooms")} />
          <Info title="Baths" value={from(deal, "baths", "bathrooms")} />
          <Info title="Sqft / Acres" value={from(deal, "square_feet", "sqft", "building_sqft", "acres", "land_acres")} />
          <Info title="Year Built" value={from(deal, "year_built", "built_year")} />
          <Info title="Occupancy" value={from(deal, "occupancy", "occupancy_status", "tenant_status")} />
          <Info title="Zoning" value={from(deal, "zoning", "zoning_type")} />
          <Info title="Utilities" value={from(deal, "utilities", "utility_access")} />
          <Info title="Road Access" value={from(deal, "road_access", "access")} />
          <Info title="NOI / Cap Rate" value={[from(deal, "noi"), from(deal, "cap_rate")].filter(Boolean).join(" / ")} />
        </section>
        <section style={card}><div style={label}>Bloomberg AI Brief</div><div style={{ fontSize: 22, lineHeight: 1.45 }}>{smartBrief(deal)}</div></section>
        <section style={card}><div style={label}>Routing Needs</div><div style={{ fontSize: 22 }}>{display(from(deal, "routing_needs", "deal_needs", "needs"))}</div></section>
        <section style={card}><div style={label}>Distress / Pain Signals</div><div style={{ fontSize: 22 }}>{display(from(deal, "distress_signals", "seller_pressure"))}</div></section>
        <section style={card}><div style={label}>Seller / Situation</div><div style={{ fontSize: 22 }}>{display(from(deal, "seller_situation", "private_notes", "access_notes", "distress_signals"))}</div></section>
        <section style={card}><div style={label}>Project / Routing IDs</div><div style={{ fontSize: 20 }}>Deal ID: {dealId || from(deal, "id", "deal_id")}<br />Signal ID: {signalId || "Not created on this older record"}</div></section>
      </> : null}
    </div>
  </main>;
}
