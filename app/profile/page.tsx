"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const STATES = ["Georgia", "Tennessee", "Florida", "North Carolina", "South Carolina", "Texas"];
const MEMBER_TYPES = ["Buyer", "Lender", "Contractor", "Developer", "Wholesaler", "Operator", "Partner", "Agent", "Seller"];
const ASSET_TYPES = ["Residential", "Commercial", "Land", "Multifamily", "Industrial", "Mixed Use"];
const STRATEGIES = ["Fix & Flip", "Rental", "Wholesale", "Development", "BRRRR", "Buy & Hold", "Creative Finance", "Private Lending"];
const SERVICES = ["Capital", "Hard Money", "Private Lending", "Construction", "Development", "Disposition", "Acquisition", "Property Management", "Legal", "Title", "Insurance", "Appraisal", "Project Management"];
const NEEDS = ["Deals", "Capital", "Lenders", "Buyers", "Contractors", "JV Partners", "Disposition", "Acquisition Help", "Due Diligence", "Project Management", "Off-Market Supply"];

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
  full_name: string;
  display_name: string;
  company_name: string;
  phone: string;
  website_url: string;
  profile_photo_url: string;
  logo_url: string;
  bio: string;
  contact_preference: string;
  primary_role: string;
  member_types: string[];
  states: string[];
  markets: string[];
  preferred_markets: string[];
  asset_types: string[];
  strategies: string[];
  buy_box_states: string[];
  buy_box_types: string[];
  buy_box_strategies: string[];
  sell_box_types: string[];
  services_offered: string[];
  needs: string[];
  funding_sources: string[];
  capital_available: string;
  capital_needed: string;
  min_price: string;
  max_price: string;
  min_arv: string;
  max_arv: string;
  experience_level: string;
  deals_done: string;
  proof_of_funds_available: boolean;
  licensed_agent: boolean;
  contractor_license: string;
  notes: string;
};

const emptyForm: FormState = {
  full_name: "",
  display_name: "",
  company_name: "",
  phone: "",
  website_url: "",
  profile_photo_url: "",
  logo_url: "",
  bio: "",
  contact_preference: "",
  primary_role: "Buyer",
  member_types: [],
  states: [],
  markets: [],
  preferred_markets: [],
  asset_types: [],
  strategies: [],
  buy_box_states: [],
  buy_box_types: [],
  buy_box_strategies: [],
  sell_box_types: [],
  services_offered: [],
  needs: [],
  funding_sources: [],
  capital_available: "",
  capital_needed: "",
  min_price: "",
  max_price: "",
  min_arv: "",
  max_arv: "",
  experience_level: "",
  deals_done: "0",
  proof_of_funds_available: false,
  licensed_agent: false,
  contractor_license: "",
  notes: "",
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

function ChipGroup({
  label,
  options,
  values,
  onChange,
}: {
  label: string;
  options: string[];
  values: string[];
  onChange: (next: string[]) => void;
}) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontWeight: 900, marginBottom: 8 }}>{label}</div>
      <div>
        {options.map((option) => {
          const active = values.includes(option);
          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(toggle(values, option))}
              style={{
                ...pillStyle,
                background: active ? "rgba(157,243,191,.16)" : "rgba(255,255,255,.04)",
                color: active ? "#9df3bf" : "white",
                borderColor: active ? "rgba(157,243,191,.5)" : "rgba(255,255,255,.18)",
              }}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
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
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        type={type}
        style={inputStyle}
      />
    </label>
  );
}

export default function ProfilePage() {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function loadProfile() {
    setLoading(true);
    setStatus("");

    const email = getEmail();
    if (!email) {
      setStatus("Session missing. Go to Login and enter your email again.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/profile/me", {
        cache: "no-store",
        headers: authHeaders(),
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus(data?.error || "Could not load profile.");
      } else if (data.profile) {
        const p = data.profile;
        setForm({
          ...emptyForm,
          full_name: p.full_name || p.name || "",
          display_name: p.display_name || p.name || "",
          company_name: p.company_name || p.company || "",
          phone: p.phone || "",
          website_url: p.website_url || "",
          profile_photo_url: p.profile_photo_url || "",
          logo_url: p.logo_url || "",
          bio: p.bio || "",
          contact_preference: p.contact_preference || "",
          primary_role: p.primary_role || p.role || "Buyer",
          member_types: p.member_types || (p.role ? [p.role] : []),
          states: p.states || (p.state ? [p.state] : []),
          markets: p.markets || (p.state ? [p.state] : []),
          preferred_markets: p.preferred_markets || [],
          asset_types: p.asset_types || p.buy_box_types || [],
          strategies: p.strategies || p.buy_box_strategies || [],
          buy_box_states: p.buy_box_states || p.states || [],
          buy_box_types: p.buy_box_types || p.asset_types || [],
          buy_box_strategies: p.buy_box_strategies || p.strategies || [],
          sell_box_types: p.sell_box_types || [],
          services_offered: p.services_offered || [],
          needs: p.needs || [],
          funding_sources: p.funding_sources || [],
          capital_available: p.capital_available ? String(p.capital_available) : "",
          capital_needed: p.capital_needed ? String(p.capital_needed) : "",
          min_price: p.min_price ? String(p.min_price) : "",
          max_price: p.max_price ? String(p.max_price) : "",
          min_arv: p.min_arv ? String(p.min_arv) : "",
          max_arv: p.max_arv ? String(p.max_arv) : "",
          experience_level: p.experience_level || "",
          deals_done: p.deals_done !== null && p.deals_done !== undefined ? String(p.deals_done) : "0",
          proof_of_funds_available: Boolean(p.proof_of_funds_available),
          licensed_agent: Boolean(p.licensed_agent),
          contractor_license: p.contractor_license || "",
          notes: p.notes || "",
        });
      }
    } catch {
      setStatus("Could not load profile. Refresh and try again.");
    }

    setLoading(false);
  }

  async function saveProfile() {
    setSaving(true);
    setStatus("");

    if (!getEmail()) {
      setStatus("Session missing. Go to Login and enter your email again.");
      setSaving(false);
      return;
    }

    try {
      const res = await fetch("/api/profile/save", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus(data?.error || data?.details || "Could not save profile.");
      } else if (data.profile_complete) {
        setStatus("Profile complete. Next step: payment unlock.");
      } else {
        setStatus("Profile saved. Add required role, states, asset types, and strategies to complete.");
      }
    } catch {
      setStatus("Could not save profile. Refresh and try again.");
    }

    setSaving(false);
  }

  useEffect(() => {
    loadProfile();
  }, []);

  return (
    <main style={shellStyle}>
      <div style={wrapStyle}>
        <nav style={navStyle}>
          <Link href="/dashboard" style={navLinkStyle}>Dashboard</Link>
          <Link href="/payment" style={navLinkStyle}>Payment</Link>
          <Link href="/terms" style={navLinkStyle}>Terms</Link>
        </nav>

        <section style={heroStyle}>
          <div style={{ textAlign: "center", marginBottom: 18 }}>
            <img src="/vaultforge-logo.png" alt="VaultForge" style={{ width: "100%", maxWidth: 360, borderRadius: 22 }} />
          </div>
          <div style={eyebrowStyle}>OPERATING PROFILE</div>
          <h1 style={{ fontSize: "clamp(44px, 10vw, 82px)", lineHeight: .9, letterSpacing: -3, margin: "0 0 16px" }}>
            Build your VaultForge identity.
          </h1>
          <p style={{ ...mutedStyle, fontSize: 20 }}>
            This is not a basic profile. This tells VaultForge who you are, what you buy,
            what you offer, what you need, and how deals should route to you.
          </p>
        </section>

        {loading && <section style={sectionStyle}>Loading profile...</section>}

        {status && (
          <section style={{ ...sectionStyle, color: status.toLowerCase().includes("could") || status.toLowerCase().includes("missing") ? "#ffd0d0" : "#9df3bf" }}>
            {status}
            {status.includes("payment") && (
              <div style={{ marginTop: 15 }}>
                <Link href="/payment" style={navLinkStyle}>Go to Payment</Link>
              </div>
            )}
          </section>
        )}

        {!loading && (
          <>
            <section style={sectionStyle}>
              <div style={eyebrowStyle}>IDENTITY</div>
              <div style={gridStyle}>
                <TextField label="Full Name *" value={form.full_name} onChange={(v) => update("full_name", v)} placeholder="Your name" />
                <TextField label="Display Name" value={form.display_name} onChange={(v) => update("display_name", v)} placeholder="Public/member display name" />
                <TextField label="Company Name" value={form.company_name} onChange={(v) => update("company_name", v)} placeholder="Company or brand" />
                <TextField label="Phone" value={form.phone} onChange={(v) => update("phone", v)} placeholder="Best phone" />
                <TextField label="Website URL" value={form.website_url} onChange={(v) => update("website_url", v)} placeholder="https://..." />
                <TextField label="Profile Photo URL" value={form.profile_photo_url} onChange={(v) => update("profile_photo_url", v)} placeholder="Paste image URL for now" />
                <TextField label="Company Logo URL" value={form.logo_url} onChange={(v) => update("logo_url", v)} placeholder="Paste image URL for now" />
                <TextField label="Contact Preference" value={form.contact_preference} onChange={(v) => update("contact_preference", v)} placeholder="Text, email, phone, app message" />
              </div>

              <label style={labelStyle}>
                Bio / Member Summary
                <textarea
                  value={form.bio}
                  onChange={(e) => update("bio", e.target.value)}
                  placeholder="Who you are, what you do, and what kind of opportunities you want."
                  rows={6}
                  style={inputStyle}
                />
              </label>
            </section>

            <section style={sectionStyle}>
              <div style={eyebrowStyle}>ROLE + MARKETS</div>
              <div style={gridStyle}>
                <label style={labelStyle}>
                  Primary Role *
                  <select value={form.primary_role} onChange={(e) => update("primary_role", e.target.value)} style={inputStyle}>
                    {MEMBER_TYPES.map((item) => <option key={item}>{item}</option>)}
                  </select>
                </label>
                <TextField label="Experience Level" value={form.experience_level} onChange={(v) => update("experience_level", v)} placeholder="New, active, experienced, institutional" />
                <TextField label="Deals Done" value={form.deals_done} onChange={(v) => update("deals_done", v)} placeholder="0" type="number" />
                <TextField label="Contractor License" value={form.contractor_license} onChange={(v) => update("contractor_license", v)} placeholder="If applicable" />
              </div>

              <ChipGroup label="Member Types *" options={MEMBER_TYPES} values={form.member_types} onChange={(v) => update("member_types", v)} />
              <ChipGroup label="States / Markets *" options={STATES} values={form.states} onChange={(v) => update("states", v)} />
              <ChipGroup label="Preferred Markets" options={STATES} values={form.preferred_markets} onChange={(v) => update("preferred_markets", v)} />
            </section>

            <section style={sectionStyle}>
              <div style={eyebrowStyle}>BUY BOX + DEAL FOCUS</div>
              <ChipGroup label="Asset Types *" options={ASSET_TYPES} values={form.asset_types} onChange={(v) => update("asset_types", v)} />
              <ChipGroup label="Strategies *" options={STRATEGIES} values={form.strategies} onChange={(v) => update("strategies", v)} />
              <ChipGroup label="Buy Box States" options={STATES} values={form.buy_box_states} onChange={(v) => update("buy_box_states", v)} />
              <ChipGroup label="Buy Box Asset Types" options={ASSET_TYPES} values={form.buy_box_types} onChange={(v) => update("buy_box_types", v)} />
              <ChipGroup label="Buy Box Strategies" options={STRATEGIES} values={form.buy_box_strategies} onChange={(v) => update("buy_box_strategies", v)} />
              <ChipGroup label="Sell Box / Deal Supply Types" options={ASSET_TYPES} values={form.sell_box_types} onChange={(v) => update("sell_box_types", v)} />

              <div style={gridStyle}>
                <TextField label="Min Purchase Price" value={form.min_price} onChange={(v) => update("min_price", v)} placeholder="50000" type="number" />
                <TextField label="Max Purchase Price" value={form.max_price} onChange={(v) => update("max_price", v)} placeholder="1000000" type="number" />
                <TextField label="Min ARV / Value" value={form.min_arv} onChange={(v) => update("min_arv", v)} placeholder="100000" type="number" />
                <TextField label="Max ARV / Value" value={form.max_arv} onChange={(v) => update("max_arv", v)} placeholder="2000000" type="number" />
              </div>
            </section>

            <section style={sectionStyle}>
              <div style={eyebrowStyle}>CAPITAL + SERVICES + NEEDS</div>
              <ChipGroup label="Services Offered" options={SERVICES} values={form.services_offered} onChange={(v) => update("services_offered", v)} />
              <ChipGroup label="Current Needs" options={NEEDS} values={form.needs} onChange={(v) => update("needs", v)} />

              <div style={gridStyle}>
                <TextField label="Capital Available" value={form.capital_available} onChange={(v) => update("capital_available", v)} placeholder="Cash/capital available" type="number" />
                <TextField label="Capital Needed" value={form.capital_needed} onChange={(v) => update("capital_needed", v)} placeholder="Funding needed" type="number" />
              </div>

              <div style={gridStyle}>
                <label style={labelStyle}>
                  <input
                    type="checkbox"
                    checked={form.proof_of_funds_available}
                    onChange={(e) => update("proof_of_funds_available", e.target.checked)}
                    style={{ marginRight: 10 }}
                  />
                  Proof of funds available
                </label>
                <label style={labelStyle}>
                  <input
                    type="checkbox"
                    checked={form.licensed_agent}
                    onChange={(e) => update("licensed_agent", e.target.checked)}
                    style={{ marginRight: 10 }}
                  />
                  Licensed agent / broker
                </label>
              </div>

              <label style={labelStyle}>
                Private Notes / Routing Notes
                <textarea
                  value={form.notes}
                  onChange={(e) => update("notes", e.target.value)}
                  placeholder="Anything VaultForge should know for routing: capital needs, partner needs, deal flow, strengths, restrictions."
                  rows={6}
                  style={inputStyle}
                />
              </label>
            </section>

            <section style={{ ...sectionStyle, borderColor: "rgba(157,243,191,.38)" }}>
              <button onClick={saveProfile} disabled={saving} style={buttonStyle}>
                {saving ? "Saving Profile..." : "Save Profile"}
              </button>
              <p style={mutedStyle}>
                Required to complete profile: full name, role, member type, state, asset type, and strategy.
                After completion, the next screen highlights payment unlock.
              </p>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
