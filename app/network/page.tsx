"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Member = {
  id: string;
  name: string;
  email: string;
  state: string;
  role: string;
  company: string;
  bio: string;
  buy_box_states: string[] | null;
  buy_box_types: string[] | null;
  buy_box_strategies: string[] | null;
};

const STATES = ["All", "Georgia", "Tennessee", "Florida", "North Carolina", "South Carolina", "Texas"];
const ROLES = ["All", "Buyer", "Lender", "Contractor", "Developer", "Partner"];


const shellStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "#071326",
  color: "white",
  padding: "32px 18px 80px",
  fontFamily: "Arial, sans-serif",
};

const navStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 10,
  marginBottom: 24,
};

const navLinkStyle: React.CSSProperties = {
  color: "white",
  textDecoration: "none",
  border: "1px solid rgba(255,255,255,.25)",
  borderRadius: 999,
  padding: "11px 15px",
  fontSize: 15,
};

const heroStyle: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.2)",
  background: "rgba(255,255,255,.05)",
  borderRadius: 26,
  padding: 24,
  marginBottom: 20,
};

const cardStyle: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.18)",
  background: "rgba(255,255,255,.04)",
  borderRadius: 22,
  padding: 20,
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
  fontSize: 17,
  marginBottom: 14,
};

const buttonStyle: React.CSSProperties = {
  border: 0,
  background: "#9df3bf",
  color: "#071326",
  borderRadius: 999,
  padding: "12px 15px",
  fontWeight: 800,
  cursor: "pointer",
  marginRight: 8,
  marginTop: 10,
};

const archiveButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  background: "transparent",
  color: "#ffd0d0",
  border: "1px solid rgba(255,107,107,.55)",
};

const pillStyle: React.CSSProperties = {
  display: "inline-block",
  color: "#9df3bf",
  border: "1px solid rgba(157,243,191,.35)",
  borderRadius: 999,
  padding: "7px 11px",
  fontSize: 12,
  letterSpacing: 1.1,
  marginRight: 7,
  marginBottom: 8,
};

function cleanError(value: string) {
  if (!value) return "";
  const lower = value.toLowerCase();
  if (lower.includes("supabase") || lower.includes("pgrst") || lower.includes("violates") || lower.includes("schema") || lower.includes("failed to fetch")) {
    return "Something did not save correctly. Refresh and try again.";
  }
  return value;
}


function Nav() {
  return (
    <nav style={navStyle}>
      <Link href="/dashboard" style={navLinkStyle}>Dashboard</Link>
      <Link href="/profile" style={navLinkStyle}>Profile</Link>
      <Link href="/submit" style={navLinkStyle}>Create Deal</Link>
      <Link href="/projects" style={navLinkStyle}>Projects</Link>
      <Link href="/buy-bucket" style={navLinkStyle}>Buy Bucket</Link>
      <Link href="/alerts" style={navLinkStyle}>Alerts</Link>
      <Link href="/messages" style={navLinkStyle}>Messages</Link>
      <Link href="/network" style={navLinkStyle}>Network</Link>
    </nav>
  );
}


function TagList({ values }: { values?: string[] | null }) {
  if (!values || values.length === 0) return null;
  return <div style={{ marginTop: 10 }}>{values.map((v) => <span key={v} style={pillStyle}>{v}</span>)}</div>;
}

export default function NetworkPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [stateFilter, setStateFilter] = useState("All");
  const [roleFilter, setRoleFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadMembers(nextState = stateFilter, nextRole = roleFilter) {
    setLoading(true);
    setError("");

    const params = new URLSearchParams();
    if (nextState !== "All") params.set("state", nextState);
    if (nextRole !== "All") params.set("role", nextRole);

    try {
      const res = await fetch(`/api/network/list?${params.toString()}`, { cache: "no-store" });
      const data = await res.json();

      if (!res.ok) {
        setError(cleanError(data?.error || data?.details || "Could not load network."));
        setMembers([]);
      } else {
        setMembers(data.members || []);
      }
    } catch {
      setError("Could not load network. Refresh and try again.");
      setMembers([]);
    }

    setLoading(false);
  }

  useEffect(() => { loadMembers(); }, []);

  return (
    <main style={shellStyle}>
      <Nav />

      <section style={heroStyle}>
        <p style={{ color: "#9df3bf", letterSpacing: 4, fontWeight: 800 }}>VAULTFORGE NETWORK</p>
        <h1 style={{ fontSize: 50, lineHeight: 1, margin: "10px 0 18px" }}>Member Directory</h1>
        <p style={{ color: "rgba(255,255,255,.72)", fontSize: 20, lineHeight: 1.45 }}>
          Buyers, lenders, contractors, developers, and partners across your locked states.
        </p>
      </section>

      <section style={cardStyle}>
        <label style={{ display: "block", fontWeight: 800, marginBottom: 8 }}>State</label>
        <select value={stateFilter} onChange={(e) => { setStateFilter(e.target.value); loadMembers(e.target.value, roleFilter); }} style={inputStyle}>
          {STATES.map((s) => <option key={s}>{s}</option>)}
        </select>

        <label style={{ display: "block", fontWeight: 800, marginBottom: 8 }}>Role</label>
        <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); loadMembers(stateFilter, e.target.value); }} style={inputStyle}>
          {ROLES.map((r) => <option key={r}>{r}</option>)}
        </select>
      </section>

      {loading && <section style={cardStyle}>Loading network...</section>}
      {error && <section style={{ ...cardStyle, color: "#ffd0d0" }}>{error}</section>}

      {!loading && !error && members.length === 0 && (
        <section style={cardStyle}>
          <h2>No matching members yet.</h2>
          <p style={{ color: "rgba(255,255,255,.68)" }}>Try another state or role, or complete your profile to add yourself to the network.</p>
          <Link href="/profile" style={navLinkStyle}>Complete Profile</Link>
        </section>
      )}

      {!loading && !error && members.map((m) => (
        <section key={m.id} style={cardStyle}>
          <p style={{ color: "#9df3bf", letterSpacing: 4, fontWeight: 800 }}>{m.state || "Unknown"} • {m.role || "Member"}</p>
          <h2 style={{ fontSize: 34, margin: "0 0 8px" }}>{m.name || "Unnamed Member"}</h2>
          {m.company && <h3 style={{ color: "rgba(255,255,255,.7)", margin: "0 0 14px" }}>{m.company}</h3>}
          <p style={{ color: "rgba(255,255,255,.72)", fontSize: 18, lineHeight: 1.45 }}>{m.bio || "No bio yet."}</p>
          <TagList values={m.buy_box_states} />
          <TagList values={m.buy_box_types} />
          <TagList values={m.buy_box_strategies} />
          <a href={`mailto:${m.email}`} style={{ ...buttonStyle, display: "inline-block", textDecoration: "none" }}>Message</a>
        </section>
      ))}
    </main>
  );
}
