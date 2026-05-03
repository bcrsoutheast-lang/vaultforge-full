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
  created_at: string;
};

const STATES = ["All", "Georgia", "Tennessee", "Florida", "North Carolina", "South Carolina", "Texas"];
const ROLES = ["All", "Buyer", "Lender", "Contractor", "Developer", "Partner"];

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
  background: "rgba(255,255,255,.08)",
  color: "white",
  border: "1px solid rgba(255,255,255,.25)",
  borderRadius: 16,
  padding: "14px 16px",
  fontSize: 18,
  marginBottom: 14,
};

const pillStyle: React.CSSProperties = {
  display: "inline-block",
  color: "#9df3bf",
  border: "1px solid rgba(157,243,191,.35)",
  borderRadius: 999,
  padding: "7px 12px",
  fontSize: 13,
  letterSpacing: 1.2,
  marginRight: 8,
  marginBottom: 8,
};

const buttonStyle: React.CSSProperties = {
  display: "inline-block",
  background: "#9df3bf",
  color: "#071326",
  borderRadius: 999,
  padding: "12px 16px",
  fontWeight: 800,
  textDecoration: "none",
  marginTop: 12,
  border: 0,
};

function TagList({ values }: { values?: string[] | null }) {
  if (!values || values.length === 0) return null;

  return (
    <div style={{ marginTop: 10 }}>
      {values.map((value) => (
        <span key={value} style={pillStyle}>{value}</span>
      ))}
    </div>
  );
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
      const res = await fetch(`/api/network/list?${params.toString()}`, {
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || data?.details || "Could not load network.");
        setMembers([]);
        return;
      }

      setMembers(data.members || []);
    } catch (err) {
      setError("Could not load network.");
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMembers();
  }, []);

  function updateState(value: string) {
    setStateFilter(value);
    loadMembers(value, roleFilter);
  }

  function updateRole(value: string) {
    setRoleFilter(value);
    loadMembers(stateFilter, value);
  }

  return (
    <main style={shellStyle}>
      <nav style={navStyle}>
        <Link href="/dashboard" style={navLinkStyle}>Dashboard</Link>
        <Link href="/submit" style={navLinkStyle}>Create Deal</Link>
        <Link href="/projects" style={navLinkStyle}>Projects</Link>
        <Link href="/buy-bucket" style={navLinkStyle}>Buy Bucket</Link>
        <Link href="/alerts" style={navLinkStyle}>Alerts</Link>
      </nav>

      <section style={heroStyle}>
        <p style={{ color: "#9df3bf", letterSpacing: 4, fontWeight: 800 }}>
          VAULTFORGE NETWORK
        </p>
        <h1 style={{ fontSize: 54, lineHeight: 1, margin: "10px 0 18px" }}>
          Member Directory
        </h1>
        <p style={{ color: "rgba(255,255,255,.72)", fontSize: 22, lineHeight: 1.45 }}>
          Buyers, lenders, contractors, developers, and partners across your locked states.
        </p>
      </section>

      <section style={cardStyle}>
        <label style={{ display: "block", fontWeight: 800, marginBottom: 8 }}>State</label>
        <select value={stateFilter} onChange={(e) => updateState(e.target.value)} style={inputStyle}>
          {STATES.map((state) => <option key={state}>{state}</option>)}
        </select>

        <label style={{ display: "block", fontWeight: 800, marginBottom: 8 }}>Role</label>
        <select value={roleFilter} onChange={(e) => updateRole(e.target.value)} style={inputStyle}>
          {ROLES.map((role) => <option key={role}>{role}</option>)}
        </select>
      </section>

      {loading && <section style={cardStyle}>Loading network...</section>}

      {error && (
        <section style={{ ...cardStyle, borderColor: "rgba(255,107,107,.55)", color: "#ffd0d0" }}>
          {error}
        </section>
      )}

      {!loading && !error && members.length === 0 && (
        <section style={cardStyle}>
          <h2>No members found yet.</h2>
          <p style={{ color: "rgba(255,255,255,.68)" }}>
            Add starter member rows in Supabase to test the network.
          </p>
        </section>
      )}

      {!loading && !error && members.map((member) => (
        <section key={member.id} style={cardStyle}>
          <p style={{ color: "#9df3bf", letterSpacing: 4, fontWeight: 800 }}>
            {member.state || "Unknown"} • {member.role || "Member"}
          </p>
          <h2 style={{ fontSize: 36, margin: "0 0 8px" }}>{member.name || "Unnamed Member"}</h2>
          {member.company && (
            <h3 style={{ color: "rgba(255,255,255,.7)", margin: "0 0 14px" }}>{member.company}</h3>
          )}
          <p style={{ color: "rgba(255,255,255,.72)", fontSize: 19, lineHeight: 1.45 }}>
            {member.bio || "No bio yet."}
          </p>

          <TagList values={member.buy_box_states} />
          <TagList values={member.buy_box_types} />
          <TagList values={member.buy_box_strategies} />

          <a href={`mailto:${member.email}`} style={buttonStyle}>Message</a>
        </section>
      ))}
    </main>
  );
}
