"use client";

import { useState } from "react";
import Link from "next/link";

const STATES = ["Georgia", "Tennessee", "Florida", "North Carolina", "South Carolina", "Texas"];
const PROPERTY_TYPES = ["Residential", "Commercial", "Land"];
const STRATEGIES = ["Fix & Flip", "Rental", "Wholesale", "Development", "BRRRR", "Buy & Hold", "Creative Finance", "Private Lending"];
const DEAL_NEEDS = ["Buyer Needed", "Capital Needed", "Lender Needed", "Contractor Needed", "JV Partner Needed", "Disposition Help", "Due Diligence Help", "Project Management Needed"];

const shellStyle: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(232,196,107,.16), transparent 30%), radial-gradient(circle at top right, rgba(157,243,191,.10), transparent 28%), linear-gradient(180deg, #030509 0%, #071326 55%, #030509 100%)",
  color: "white",
  padding: "26px 18px 90px",
  fontFamily: "Arial, sans-serif",
};

const wrapStyle: React.CSSProperties = { maxWidth: 1180, margin: "0 auto" };
const navStyle: React.CSSProperties = { display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 24 };
const navLinkStyle: React.CSSProperties = { color: "white", textDecoration: "none", border: "1px solid rgba(255,255,255,.18)", borderRadius: 999, padding: "11px 15px", fontSize: 14, background: "rgba(255,255,255,.04)" };
const heroStyle: React.CSSProperties = { border: "1px solid rgba(255,255,255,.16)", background: "linear-gradient(135deg, rgba(255,255,255,.08), rgba(255,255,255,.025))", borderRadius: 34, padding: "28px 22px", marginBottom: 22, boxShadow: "0 30px 90px rgba(0,0,0,.45)" };
const sectionStyle: React.CSSProperties = { border: "1px solid rgba(255,255,255,.13)", background: "rgba(255,255,255,.035)", borderRadius: 30, padding: 22, marginBottom: 20 };
const gridStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 };
const inputStyle: React.CSSProperties = { width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,.08)", color: "white", border: "1px solid rgba(255,255,255,.22)", borderRadius: 16, padding: "14px 16px", fontSize: 17, marginTop: 8 };
const labelStyle: React.CSSProperties = { fontWeight: 900, color: "rgba(255,255,255,.86)", display: "block", marginBottom: 14 };
const buttonStyle: React.CSSProperties = { border: 0, background: "linear-gradient(135deg, #f4d47b, #9df3bf)", color: "#06101e", borderRadius: 999, padding: "15px 20px", fontWeight: 950, cursor: "pointer", fontSize: 16 };
const mutedStyle: React.CSSProperties = { color: "rgba(255,255,255,.66)", lineHeight: 1.5, fontSize: 16 };
const eyebrowStyle: React.CSSProperties = { color: "#e8c46b", letterSpacing: 5, fontWeight: 900, fontSize: 12, marginBottom: 12 };
const pillStyle: React.CSSProperties = { border: "1px solid rgba(255,255,255,.18)", borderRadius: 999, padding: "10px 13px", cursor: "pointer", display: "inline-block", margin: "5px", fontSize: 14 };

type FormState = {
  title: string;
  property_type: string;
  strategy: string;
  state: string;
  city: string;
  county: string;
  address: string;
  price: string;
  asking_price: string;
  arv: string;
  repair_estimate: string;
  equity: string;
  debt_balance: string;
  rent_estimate: string;
  noi: string;
  cap_rate: string;
  lot_size: string;
  building_sqft: string;
  land_acres: string;
  units: string;
  bedrooms: string;
  bathrooms: string;
  year_built: string;
  occupancy: string;
  condition: string;
  timeline: string;
  seller_situation: string;
  access_notes: string;
  private_notes: string;
  description: string;
  deal_needs: string[];
  photo_urls: string[];
  zoning: string;
  utilities: string;
  road_frontage: string;
  parcel_id: string;
};

const emptyForm: FormState = {
  title: "",
  property_type: "Residential",
  strategy: "Fix & Flip",
  state: "Georgia",
  city: "",
  county: "",
  address: "",
  price: "",
  asking_price: "",
  arv: "",
  repair_estimate: "",
  equity: "",
  debt_balance: "",
  rent_estimate: "",
  noi: "",
  cap_rate: "",
  lot_size: "",
  building_sqft: "",
  land_acres: "",
  units: "",
  bedrooms: "",
  bathrooms: "",
  year_built: "",
  occupancy: "",
  condition: "",
  timeline: "",
  seller_situation: "",
  access_notes: "",
  private_notes: "",
  description: "",
  deal_needs: [],
  photo_urls: ["", "", "", "", ""],
  zoning: "",
  utilities: "",
  road_frontage: "",
  parcel_id: "",
};

function getEmail() {
  if (typeof window === "undefined") return "";
  return (
    window.localStorage.getItem("vf_email") ||
    window.sessionStorage.getItem("vf_email") ||
    ""
  ).trim().toLowerCase();
}

function authHeaders() {
  return {
    "Content-Type": "application/json",
    "x-vf-email": getEmail(),
  };
}

function toggle(list: string[], value: string) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label style={labelStyle}>
      {label}
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} type={type} style={inputStyle} />
    </label>
  );
}

function NeedChips({ values, onChange }: { values: string[]; onChange: (next: string[]) => void }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontWeight: 900, marginBottom: 8 }}>What does this deal need?</div>
      {DEAL_NEEDS.map((need) => {
        const active = values.includes(need);
        return (
          <button
            key={need}
            type="button"
            onClick={() => onChange(toggle(values, need))}
            style={{
              ...pillStyle,
              background: active ? "rgba(157,243,191,.16)" : "rgba(255,255,255,.04)",
              color: active ? "#9df3bf" : "white",
              borderColor: active ? "rgba(157,243,191,.5)" : "rgba(255,255,255,.18)",
            }}
          >
            {need}
          </button>
        );
      })}
    </div>
  );
}

export default function SubmitPage() {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [status, setStatus] = useState("");
  const [aiSummary, setAiSummary] = useState("");
  const [routingMessage, setRoutingMessage] = useState("");
  const [saving, setSaving] = useState(false);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updatePhoto(index: number, value: string) {
    setForm((prev) => {
      const next = [...prev.photo_urls];
      next[index] = value;
      return { ...prev, photo_urls: next };
    });
  }

  async function saveDeal() {
    setStatus("");
    setAiSummary("");
    setRoutingMessage("");

    if (!getEmail()) {
      setStatus("Session missing. Go to Login and enter your email again.");
      return;
    }

    setSaving(true);

    try {
      const res = await fetch("/api/deal/create", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus(data?.error || data?.details || "Could not save deal.");
      } else {
        setStatus("Deal saved with AI analysis and routing.");
        setAiSummary(data?.ai?.ai_summary || "");
        setRoutingMessage(`Routing complete: ${data?.routing?.matched || 0} matching member alert(s) created.`);
        setForm(emptyForm);
      }
    } catch {
      setStatus("Could not save deal. Refresh and try again.");
    }

    setSaving(false);
  }

  return (
    <main style={shellStyle}>
      <div style={wrapStyle}>
        <nav style={navStyle}>
          <Link href="/dashboard" style={navLinkStyle}>Dashboard</Link>
          <Link href="/profile" style={navLinkStyle}>Profile</Link>
          <Link href="/projects" style={navLinkStyle}>Projects</Link>
          <Link href="/buy-bucket" style={navLinkStyle}>Buy Bucket</Link>
          <Link href="/messages" style={navLinkStyle}>Messages</Link>
          <Link href="/alerts" style={navLinkStyle}>Alerts</Link>
          <Link href="/network" style={navLinkStyle}>Network</Link>
        </nav>

        <section style={heroStyle}>
          <div style={{ textAlign: "center", marginBottom: 18 }}>
            <img src="/vaultforge-logo.png" alt="VaultForge" style={{ width: "100%", maxWidth: 360, borderRadius: 22 }} />
          </div>
          <div style={eyebrowStyle}>PROFESSIONAL DEAL INTAKE</div>
          <h1 style={{ fontSize: "clamp(44px, 10vw, 82px)", lineHeight: .9, letterSpacing: -3, margin: "0 0 16px" }}>
            Create a deal room.
          </h1>
          <p style={{ ...mutedStyle, fontSize: 20 }}>
            Submit structured residential, commercial, or land opportunities with photos,
            numbers, needs, and AI routing context.
          </p>
        </section>

        {status && (
          <section style={{ ...sectionStyle, color: status.toLowerCase().includes("could") || status.toLowerCase().includes("missing") || status.toLowerCase().includes("required") ? "#ffd0d0" : "#9df3bf" }}>
            {status}
          </section>
        )}

        <section style={sectionStyle}>
          <div style={eyebrowStyle}>DEAL BASICS</div>
          <div style={gridStyle}>
            <TextField label="Deal Title *" value={form.title} onChange={(v) => update("title", v)} placeholder="Example: Atlanta value-add flip" />

            <label style={labelStyle}>
              Property Type *
              <select value={form.property_type} onChange={(e) => update("property_type", e.target.value)} style={inputStyle}>
                {PROPERTY_TYPES.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>

            <label style={labelStyle}>
              Strategy
              <select value={form.strategy} onChange={(e) => update("strategy", e.target.value)} style={inputStyle}>
                {STRATEGIES.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>

            <label style={labelStyle}>
              State *
              <select value={form.state} onChange={(e) => update("state", e.target.value)} style={inputStyle}>
                {STATES.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>

            <TextField label="City *" value={form.city} onChange={(v) => update("city", v)} placeholder="City" />
            <TextField label="County" value={form.county} onChange={(v) => update("county", v)} placeholder="County" />
            <TextField label="Address / Private Location" value={form.address} onChange={(v) => update("address", v)} placeholder="Optional/private" />
            <TextField label="Timeline" value={form.timeline} onChange={(v) => update("timeline", v)} placeholder="ASAP, 30 days, 90 days..." />
          </div>
        </section>

        <section style={sectionStyle}>
          <div style={eyebrowStyle}>NUMBERS</div>
          <div style={gridStyle}>
            <TextField label="Price" value={form.price} onChange={(v) => update("price", v)} placeholder="250000" type="number" />
            <TextField label="Asking Price" value={form.asking_price} onChange={(v) => update("asking_price", v)} placeholder="250000" type="number" />
            <TextField label="ARV / Value" value={form.arv} onChange={(v) => update("arv", v)} placeholder="380000" type="number" />
            <TextField label="Repair Estimate" value={form.repair_estimate} onChange={(v) => update("repair_estimate", v)} placeholder="50000" type="number" />
            <TextField label="Equity" value={form.equity} onChange={(v) => update("equity", v)} placeholder="100000" type="number" />
            <TextField label="Debt Balance" value={form.debt_balance} onChange={(v) => update("debt_balance", v)} placeholder="Optional" type="number" />
            <TextField label="Rent Estimate" value={form.rent_estimate} onChange={(v) => update("rent_estimate", v)} placeholder="Optional" type="number" />
            <TextField label="NOI" value={form.noi} onChange={(v) => update("noi", v)} placeholder="Commercial optional" type="number" />
            <TextField label="Cap Rate" value={form.cap_rate} onChange={(v) => update("cap_rate", v)} placeholder="Commercial optional" type="number" />
          </div>
        </section>

        {form.property_type === "Residential" && (
          <section style={sectionStyle}>
            <div style={eyebrowStyle}>RESIDENTIAL DETAILS</div>
            <div style={gridStyle}>
              <TextField label="Bedrooms" value={form.bedrooms} onChange={(v) => update("bedrooms", v)} placeholder="3" type="number" />
              <TextField label="Bathrooms" value={form.bathrooms} onChange={(v) => update("bathrooms", v)} placeholder="2" type="number" />
              <TextField label="Year Built" value={form.year_built} onChange={(v) => update("year_built", v)} placeholder="1985" type="number" />
              <TextField label="Lot Size" value={form.lot_size} onChange={(v) => update("lot_size", v)} placeholder="0.25 acre" />
              <TextField label="Occupancy" value={form.occupancy} onChange={(v) => update("occupancy", v)} placeholder="Vacant, tenant, owner occupied" />
              <TextField label="Condition" value={form.condition} onChange={(v) => update("condition", v)} placeholder="Light, medium, heavy rehab" />
            </div>
          </section>
        )}

        {form.property_type === "Commercial" && (
          <section style={sectionStyle}>
            <div style={eyebrowStyle}>COMMERCIAL DETAILS</div>
            <div style={gridStyle}>
              <TextField label="Building SQFT" value={form.building_sqft} onChange={(v) => update("building_sqft", v)} placeholder="10000" type="number" />
              <TextField label="Units / Tenants" value={form.units} onChange={(v) => update("units", v)} placeholder="12" type="number" />
              <TextField label="Occupancy" value={form.occupancy} onChange={(v) => update("occupancy", v)} placeholder="Vacant, partially occupied, occupied" />
              <TextField label="Zoning" value={form.zoning} onChange={(v) => update("zoning", v)} placeholder="Commercial zoning" />
              <TextField label="Condition" value={form.condition} onChange={(v) => update("condition", v)} placeholder="Condition notes" />
              <TextField label="Year Built" value={form.year_built} onChange={(v) => update("year_built", v)} placeholder="1985" type="number" />
            </div>
          </section>
        )}

        {form.property_type === "Land" && (
          <section style={sectionStyle}>
            <div style={eyebrowStyle}>LAND DETAILS</div>
            <div style={gridStyle}>
              <TextField label="Acres" value={form.land_acres} onChange={(v) => update("land_acres", v)} placeholder="5" type="number" />
              <TextField label="Zoning" value={form.zoning} onChange={(v) => update("zoning", v)} placeholder="Residential, commercial, agricultural..." />
              <TextField label="Utilities" value={form.utilities} onChange={(v) => update("utilities", v)} placeholder="Water, sewer, power, septic..." />
              <TextField label="Road Frontage" value={form.road_frontage} onChange={(v) => update("road_frontage", v)} placeholder="Paved, gravel, frontage feet..." />
              <TextField label="Parcel ID" value={form.parcel_id} onChange={(v) => update("parcel_id", v)} placeholder="Optional parcel number" />
              <TextField label="Lot Size" value={form.lot_size} onChange={(v) => update("lot_size", v)} placeholder="Lot dimensions" />
            </div>
          </section>
        )}

        <section style={sectionStyle}>
          <div style={eyebrowStyle}>PHOTOS</div>
          <p style={mutedStyle}>
            Add up to 5 photo URLs for now. Real direct upload is the next step after this form saves clean.
          </p>
          <div style={gridStyle}>
            {form.photo_urls.map((url, index) => (
              <TextField
                key={index}
                label={`Photo URL ${index + 1}`}
                value={url}
                onChange={(v) => updatePhoto(index, v)}
                placeholder="https://..."
              />
            ))}
          </div>
        </section>

        <section style={sectionStyle}>
          <div style={eyebrowStyle}>SITUATION + NEEDS</div>
          <NeedChips values={form.deal_needs} onChange={(v) => update("deal_needs", v)} />

          <label style={labelStyle}>
            Seller Situation
            <textarea value={form.seller_situation} onChange={(e) => update("seller_situation", e.target.value)} placeholder="Motivation, deadline, problem, background..." rows={4} style={inputStyle} />
          </label>

          <label style={labelStyle}>
            Public Deal Description
            <textarea value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="Describe the deal, condition, numbers, strategy, and opportunity." rows={7} style={inputStyle} />
          </label>

          <label style={labelStyle}>
            Access Notes
            <textarea value={form.access_notes} onChange={(e) => update("access_notes", e.target.value)} placeholder="Showing instructions, lockbox, contact notes, private access info." rows={4} style={inputStyle} />
          </label>

          <label style={labelStyle}>
            Private Notes
            <textarea value={form.private_notes} onChange={(e) => update("private_notes", e.target.value)} placeholder="Internal/private notes for your records or routing." rows={4} style={inputStyle} />
          </label>
        </section>

        <section style={{ ...sectionStyle, borderColor: "rgba(157,243,191,.38)" }}>
          <button style={buttonStyle} onClick={saveDeal} disabled={saving}>
            {saving ? "Saving Deal..." : "Save Deal + AI Route"}
          </button>
          <p style={mutedStyle}>
            Required: title, state, city, and property type. Photos are optional but recommended.
          </p>
        </section>

        {routingMessage && <section style={{ ...sectionStyle, color: "#9df3bf" }}>{routingMessage}</section>}
        {aiSummary && (
          <section style={sectionStyle}>
            <div style={eyebrowStyle}>AI DEAL ANALYSIS</div>
            <p style={{ ...mutedStyle, fontSize: 20 }}>{aiSummary}</p>
          </section>
        )}
      </div>
    </main>
  );
}
