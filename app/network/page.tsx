"use client";

import { useEffect, useMemo, useState } from "react";
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

const STATES = [
  "All",
  "Georgia",
  "Tennessee",
  "Florida",
  "North Carolina",
  "South Carolina",
  "Texas",
];

const ROLES = [
  "All",
  "Buyer",
  "Lender",
  "Contractor",
  "Developer",
  "Partner",
];

const shellStyle: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(157,243,191,.08), transparent 24%), linear-gradient(180deg,#030509,#071326 60%,#030509)",
  color: "white",
  padding: "32px 18px 90px",
  fontFamily: "Arial, sans-serif",
};

const wrapStyle: React.CSSProperties = {
  maxWidth: 1250,
  margin: "0 auto",
};

const navStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 10,
  marginBottom: 22,
};

const navLinkStyle: React.CSSProperties = {
  color: "white",
  textDecoration: "none",
  border: "1px solid rgba(255,255,255,.20)",
  borderRadius: 999,
  padding: "11px 16px",
  fontSize: 14,
  background: "rgba(255,255,255,.04)",
};

const heroStyle: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.15)",
  background: "linear-gradient(135deg, rgba(255,255,255,.06), rgba(255,255,255,.03))",
  borderRadius: 34,
  padding: 30,
  marginBottom: 24,
};

const statGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
  gap: 14,
  marginBottom: 22,
};

const statCard: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.14)",
  borderRadius: 24,
  padding: 20,
  background: "rgba(255,255,255,.04)",
};

const cardStyle: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.14)",
  background: "rgba(255,255,255,.04)",
  borderRadius: 28,
  padding: 24,
  marginBottom: 18,
};

const stateGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))",
  gap: 12,
  marginBottom: 22,
};

const stateButtonStyle: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.16)",
  background: "rgba(255,255,255,.05)",
  borderRadius: 20,
  padding: "16px 12px",
  cursor: "pointer",
  color: "white",
  fontWeight: 800,
  textAlign: "center",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  background: "rgba(255,255,255,.08)",
  color: "white",
  border: "1px solid rgba(255,255,255,.20)",
  borderRadius: 18,
  padding: "15px 16px",
  fontSize: 16,
  marginBottom: 14,
};

const pillStyle: React.CSSProperties = {
  display: "inline-block",
  color: "#9df3bf",
  border: "1px solid rgba(157,243,191,.35)",
  borderRadius: 999,
  padding: "7px 12px",
  fontSize: 12,
  letterSpacing: 1,
  marginRight: 8,
  marginBottom: 8,
};

const actionStyle: React.CSSProperties = {
  display: "inline-block",
  background: "#9df3bf",
  color: "#071326",
  textDecoration: "none",
  borderRadius: 999,
  padding: "13px 18px",
  fontWeight: 900,
  marginTop: 14,
};

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
      <Link href="/logout" style={navLinkStyle}>Logout</Link>
    </nav>
  );
}

function TagList({ values }: { values?: string[] | null }) {
  if (!values || values.length === 0) return null;

  return (
    <div style={{ marginTop: 12 }}>
      {values.map((value) => (
        <span key={value} style={pillStyle}>{value}</span>
      ))}
    </div>
  );
}

function cleanError(value: string) {
  if (!value) return "";

  const lower = value.toLowerCase();

  if (
    lower.includes("supabase") ||
    lower.includes("schema") ||
    lower.includes("failed")
  ) {
    return "Could not load member network.";
  }

  return value;
}

export default function NetworkPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stateFilter, setStateFilter] = useState("All");
  const [roleFilter, setRoleFilter] = useState("All");

  async function loadMembers(nextState = stateFilter, nextRole = roleFilter) {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();

      if (nextState !== "All") {
        params.set("state", nextState);
      }

      if (nextRole !== "All") {
        params.set("role", nextRole);
      }

      const res = await fetch(`/api/network/list?${params.toString()}`, {
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || data?.details || "Could not load members.");
      }

      setMembers(data?.members || []);
    } catch (error: any) {
      setMembers([]);
      setError(cleanError(error?.message || "Could not load network."));
    }

    setLoading(false);
  }

  useEffect(() => {
    loadMembers();
  }, []);

  const totalMembers = useMemo(() => members.length, [members]);

  return (
    <main style={shellStyle}>
      <div style={wrapStyle}>
        <Nav />

        <section style={heroStyle}>
          <div
            style={{
              color: "#9df3bf",
              letterSpacing: 5,
              fontWeight: 900,
              marginBottom: 12,
            }}
          >
            VAULTFORGE NETWORK
          </div>

          <h1
            style={{
              fontSize: "clamp(54px,10vw,96px)",
              lineHeight: 0.9,
              margin: "0 0 16px",
            }}
          >
            Member Command Directory
          </h1>

          <p
            style={{
              color: "rgba(255,255,255,.72)",
              fontSize: 22,
              lineHeight: 1.5,
              maxWidth: 900,
            }}
          >
            Buyers, lenders, contractors, developers, operators, and partners
            across your target states and deal flow network.
          </p>
        </section>

        <section style={statGrid}>
          <div style={statCard}>
            <div style={{ color: "#9df3bf", fontWeight: 900 }}>Members</div>
            <div style={{ fontSize: 46, fontWeight: 900 }}>{totalMembers}</div>
          </div>

          <div style={statCard}>
            <div style={{ color: "#9df3bf", fontWeight: 900 }}>Current State</div>
            <div style={{ fontSize: 26, fontWeight: 900 }}>{stateFilter}</div>
          </div>

          <div style={statCard}>
            <div style={{ color: "#9df3bf", fontWeight: 900 }}>Role Filter</div>
            <div style={{ fontSize: 26, fontWeight: 900 }}>{roleFilter}</div>
          </div>
        </section>

        <section style={cardStyle}>
          <h2 style={{ marginTop: 0 }}>Target States</h2>

          <div style={stateGrid}>
            {STATES.map((state) => (
              <button
                key={state}
                type="button"
                style={{
                  ...stateButtonStyle,
                  border:
                    stateFilter === state
                      ? "1px solid rgba(157,243,191,.65)"
                      : stateButtonStyle.border,
                  background:
                    stateFilter === state
                      ? "rgba(157,243,191,.12)"
                      : stateButtonStyle.background,
                }}
                onClick={() => {
                  setStateFilter(state);
                  loadMembers(state, roleFilter);
                }}
              >
                {state}
              </button>
            ))}
          </div>

          <label style={{ display: "block", fontWeight: 800, marginBottom: 8 }}>
            Filter By Role
          </label>

          <select
            value={roleFilter}
            onChange={(event) => {
              setRoleFilter(event.target.value);
              loadMembers(stateFilter, event.target.value);
            }}
            style={inputStyle}
          >
            {ROLES.map((role) => (
              <option key={role}>{role}</option>
            ))}
          </select>
        </section>

        {loading && (
          <section style={cardStyle}>
            Loading member network...
          </section>
        )}

        {error && (
          <section style={{ ...cardStyle, color: "#ffd0d0" }}>
            {error}
          </section>
        )}

        {!loading && !error && members.length === 0 && (
          <section style={cardStyle}>
            <h2>No matching members yet.</h2>

            <p style={{ color: "rgba(255,255,255,.72)" }}>
              Try another state or role filter.
            </p>
          </section>
        )}

        {!loading &&
          !error &&
          members.map((member) => (
            <section key={member.id} style={cardStyle}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 18,
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <div
                    style={{
                      color: "#9df3bf",
                      fontWeight: 900,
                      letterSpacing: 3,
                      marginBottom: 8,
                    }}
                  >
                    {member.state || "Unknown"} • {member.role || "Member"}
                  </div>

                  <h2
                    style={{
                      fontSize: 38,
                      margin: "0 0 8px",
                    }}
                  >
                    {member.name || "Unnamed Member"}
                  </h2>

                  {member.company && (
                    <h3
                      style={{
                        color: "rgba(255,255,255,.68)",
                        margin: "0 0 14px",
                      }}
                    >
                      {member.company}
                    </h3>
                  )}

                  <p
                    style={{
                      color: "rgba(255,255,255,.74)",
                      lineHeight: 1.5,
                      fontSize: 18,
                    }}
                  >
                    {member.bio || "No bio yet."}
                  </p>

                  <TagList values={member.buy_box_states} />
                  <TagList values={member.buy_box_types} />
                  <TagList values={member.buy_box_strategies} />

                  <a
                    href={`mailto:${member.email}`}
                    style={actionStyle}
                  >
                    Contact Member
                  </a>
                </div>
              </div>
            </section>
          ))}
      </div>
    </main>
  );
}
