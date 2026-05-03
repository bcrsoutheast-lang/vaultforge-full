"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const STATES = ["Georgia", "Tennessee", "Florida", "North Carolina", "South Carolina", "Texas"];
const ROLES = ["Buyer", "Lender", "Contractor", "Developer", "Partner"];
const PROPERTY_TYPES = ["Residential", "Commercial", "Land"];
const STRATEGIES = ["Fix & Flip", "Rental", "Wholesale", "Development"];

const shellStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "#071326",
  color: "white",
  padding: "36px 22px",
  fontFamily: "Arial, sans-serif",
};

const navStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 12,
  marginBottom: 28,
};

const navLinkStyle: React.CSSProperties = {
  color: "white",
  textDecoration: "none",
  border: "1px solid rgba(255,255,255,.25)",
  borderRadius: 999,
  padding: "12px 18px",
  fontSize: 16,
};

const heroStyle: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.2)",
  background: "rgba(255,255,255,.05)",
  borderRadius: 28,
  padding: 28,
  marginBottom: 22,
};

const cardStyle: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.18)",
  background: "rgba(255,255,255,.04)",
  borderRadius: 24,
  padding: 22,
  marginBottom: 16,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  background: "rgba(255,255,255,.08)",
  color: "white",
  border: "1px solid rgba(255,255,255,.25)",
  borderRadius: 16,
  padding: "14px 16px",
  fontSize: 18,
  marginBottom: 14,
};

const buttonStyle: React.CSSProperties = {
  border: 0,
  background: "#9df3bf",
  color: "#071326",
  borderRadius: 999,
  padding: "14px 18px",
  fontWeight: 800,
  cursor: "pointer",
};

const checkboxGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
  gap: 10,
  marginBottom: 16,
};

type Profile = {
  name?: string;
  email?: string;
  state?: string;
  role?: string;
  company?: string;
  bio?: string;
  buy_box_states?: string[];
  buy_box_types?: string[];
  buy_box_strategies?: string[];
  min_price?: number | null;
  max_price?: number | null;
};

function toggleValue(current: string[], value: string) {
  if (current.includes(value)) {
    return current.filter((item) => item !== value);
  }
  return [...current, value];
}

function CheckboxGroup({
  label,
  values,
  selected,
  onChange,
}: {
  label: string;
  values: string[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: "block", fontWeight: 800, marginBottom: 10 }}>{label}</label>
      <div style={checkboxGridStyle}>
        {values.map((value) => (
          <label
            key={value}
            style={{
              border: "1px solid rgba(255,255,255,.2)",
              borderRadius: 16,
              padding: 12,
              display: "flex",
              gap: 10,
              alignItems: "center",
            }}
          >
            <input
              type="checkbox"
              checked={selected.includes(value)}
              onChange={() => onChange(toggleValue(selected, value))}
            />
            {value}
          </label>
        ))}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("Buyer");
  const [state, setState] = useState("Georgia");
  const [bio, setBio] = useState("");
  const [buyBoxStates, setBuyBoxStates] = useState<string[]>(["Georgia"]);
  const [buyBoxTypes, setBuyBoxTypes] = useState<string[]>(["Residential"]);
  const [buyBoxStrategies, setBuyBoxStrategies] = useState<string[]>(["Fix & Flip"]);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadProfile() {
    setLoading(true);
    setStatus("");

    try {
      const res = await fetch("/api/profile/me", { cache: "no-store" });
      const data = await res.json();

      if (!res.ok) {
        setStatus(data?.error || "Could not load profile.");
        return;
      }

      setEmail(data.email || "");

      const profile: Profile | null = data.profile;
      if (profile) {
        setName(profile.name || "");
        setCompany(profile.company || "");
        setRole(profile.role || "Buyer");
        setState(profile.state || "Georgia");
        setBio(profile.bio || "");
        setBuyBoxStates(profile.buy_box_states?.length ? profile.buy_box_states : ["Georgia"]);
        setBuyBoxTypes(profile.buy_box_types?.length ? profile.buy_box_types : ["Residential"]);
        setBuyBoxStrategies(profile.buy_box_strategies?.length ? profile.buy_box_strategies : ["Fix & Flip"]);
        setMinPrice(profile.min_price ? String(profile.min_price) : "");
        setMaxPrice(profile.max_price ? String(profile.max_price) : "");
      }
    } catch (err) {
      setStatus("Could not load profile.");
    } finally {
      setLoading(false);
    }
  }

  async function saveProfile() {
    setStatus("");

    const res = await fetch("/api/profile/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        company,
        role,
        state,
        bio,
        buy_box_states: buyBoxStates,
        buy_box_types: buyBoxTypes,
        buy_box_strategies: buyBoxStrategies,
        min_price: minPrice,
        max_price: maxPrice,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setStatus(data?.error || data?.details || "Could not save profile.");
      return;
    }

    setStatus("Profile saved. Your network card and buy box are updated.");
  }

  useEffect(() => {
    loadProfile();
  }, []);

  return (
    <main style={shellStyle}>
      <nav style={navStyle}>
        <Link href="/dashboard" style={navLinkStyle}>Dashboard</Link>
        <Link href="/submit" style={navLinkStyle}>Create Deal</Link>
        <Link href="/projects" style={navLinkStyle}>Projects</Link>
        <Link href="/buy-bucket" style={navLinkStyle}>Buy Bucket</Link>
        <Link href="/alerts" style={navLinkStyle}>Alerts</Link>
        <Link href="/messages" style={navLinkStyle}>Messages</Link>
        <Link href="/network" style={navLinkStyle}>Network</Link>
      </nav>

      <section style={heroStyle}>
        <p style={{ color: "#9df3bf", letterSpacing: 4, fontWeight: 800 }}>
          VAULTFORGE PROFILE
        </p>
        <h1 style={{ fontSize: 54, lineHeight: 1, margin: "10px 0 18px" }}>
          Profile + Buy Box
        </h1>
        <p style={{ color: "rgba(255,255,255,.72)", fontSize: 22, lineHeight: 1.45 }}>
          This powers routing, network visibility, alerts, and future AI matching.
        </p>
      </section>

      {loading && <section style={cardStyle}>Loading profile...</section>}

      {!loading && (
        <section style={cardStyle}>
          <p style={{ color: "rgba(255,255,255,.62)" }}>
            Logged in as: <strong>{email || "unknown"}</strong>
          </p>

          <label style={{ display: "block", fontWeight: 800, marginBottom: 8 }}>Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" style={inputStyle} />

          <label style={{ display: "block", fontWeight: 800, marginBottom: 8 }}>Company</label>
          <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Company / brand" style={inputStyle} />

          <label style={{ display: "block", fontWeight: 800, marginBottom: 8 }}>Primary Role</label>
          <select value={role} onChange={(e) => setRole(e.target.value)} style={inputStyle}>
            {ROLES.map((item) => <option key={item}>{item}</option>)}
          </select>

          <label style={{ display: "block", fontWeight: 800, marginBottom: 8 }}>Primary State</label>
          <select value={state} onChange={(e) => setState(e.target.value)} style={inputStyle}>
            {STATES.map((item) => <option key={item}>{item}</option>)}
          </select>

          <CheckboxGroup label="Buy Box States" values={STATES} selected={buyBoxStates} onChange={setBuyBoxStates} />
          <CheckboxGroup label="Buy Box Property Types" values={PROPERTY_TYPES} selected={buyBoxTypes} onChange={setBuyBoxTypes} />
          <CheckboxGroup label="Buy Box Strategies" values={STRATEGIES} selected={buyBoxStrategies} onChange={setBuyBoxStrategies} />

          <label style={{ display: "block", fontWeight: 800, marginBottom: 8 }}>Minimum Price</label>
          <input value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder="Example: 100000" style={inputStyle} />

          <label style={{ display: "block", fontWeight: 800, marginBottom: 8 }}>Maximum Price</label>
          <input value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="Example: 750000" style={inputStyle} />

          <label style={{ display: "block", fontWeight: 800, marginBottom: 8 }}>Bio / What you do</label>
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={5} placeholder="Tell members what you buy, lend on, build, fix, or partner on." style={inputStyle} />

          <button style={buttonStyle} onClick={saveProfile}>Save Profile</button>
        </section>
      )}

      {status && (
        <section
          style={{
            ...cardStyle,
            color: status.toLowerCase().includes("could") || status.toLowerCase().includes("required")
              ? "#ffd0d0"
              : "#9df3bf",
          }}
        >
          {status}
        </section>
      )}
    </main>
  );
}
