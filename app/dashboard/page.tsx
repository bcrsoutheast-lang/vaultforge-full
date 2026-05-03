"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Summary = {
  email: string;
  profileComplete: boolean;
  counts: {
    activeDeals: number;
    myDeals: number;
    buyBucket: number;
    alerts: number;
    messages: number;
    members: number;
  };
};

const shellStyle: React.CSSProperties = { minHeight: "100vh", background: "#071326", color: "white", padding: "36px 22px 80px", fontFamily: "Arial, sans-serif" };
const navStyle: React.CSSProperties = { display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 24 };
const navLinkStyle: React.CSSProperties = { color: "white", textDecoration: "none", border: "1px solid rgba(255,255,255,.25)", borderRadius: 999, padding: "11px 15px", fontSize: 15 };
const heroStyle: React.CSSProperties = { border: "1px solid rgba(255,255,255,.2)", background: "rgba(255,255,255,.05)", borderRadius: 28, padding: 28, marginBottom: 22 };
const gridStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 16 };
const cardStyle: React.CSSProperties = { border: "1px solid rgba(255,255,255,.18)", background: "rgba(255,255,255,.04)", borderRadius: 24, padding: 22, textDecoration: "none", color: "white" };
const countStyle: React.CSSProperties = { fontSize: 44, fontWeight: 900, lineHeight: 1, margin: "12px 0" };
const pillStyle: React.CSSProperties = { display: "inline-block", color: "#9df3bf", border: "1px solid rgba(157,243,191,.35)", borderRadius: 999, padding: "7px 12px", fontSize: 13, letterSpacing: 1.2, marginBottom: 12 };

function getClientEmail() {
  return (
    window.localStorage.getItem("vf_user_email") ||
    window.sessionStorage.getItem("vf_user_email") ||
    ""
  ).trim().toLowerCase();
}

function ActionCard({ href, label, title, description, count }: { href: string; label: string; title: string; description: string; count?: number | string }) {
  return (
    <Link href={href} style={cardStyle}>
      <span style={pillStyle}>{label}</span>
      <h2 style={{ fontSize: 28, margin: "0 0 8px" }}>{title}</h2>
      {count !== undefined && <div style={countStyle}>{count}</div>}
      <p style={{ color: "rgba(255,255,255,.68)", fontSize: 17, lineHeight: 1.45 }}>{description}</p>
    </Link>
  );
}

export default function Dashboard() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadSummary() {
    setLoading(true);
    setError("");

    const email = getClientEmail();

    if (!email) {
      setError("Session missing. Go to Login and enter your email again.");
      setSummary(null);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/dashboard/summary", {
        cache: "no-store",
        credentials: "same-origin",
        headers: { "x-vf-user-email": email },
      });
      const data = await res.json();

      if (!res.ok) {
        setError("Session is missing. Log out, log back in, then try again.");
        setSummary(null);
        return;
      }

      setSummary(data);
    } catch {
      setError("Could not load dashboard. Refresh and try again.");
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadSummary(); }, []);

  return (
    <main style={shellStyle}>
      <nav style={navStyle}>
        <Link href="/profile" style={navLinkStyle}>Profile</Link>
        <Link href="/submit" style={navLinkStyle}>Create Deal</Link>
        <Link href="/projects" style={navLinkStyle}>Projects</Link>
        <Link href="/buy-bucket" style={navLinkStyle}>Buy Bucket</Link>
        <Link href="/alerts" style={navLinkStyle}>Alerts</Link>
        <Link href="/messages" style={navLinkStyle}>Messages</Link>
        <Link href="/network" style={navLinkStyle}>Network</Link>
        <Link href="/terms" style={navLinkStyle}>Terms</Link>
        <Link href="/logout" style={navLinkStyle}>Logout</Link>
      </nav>

      <section style={heroStyle}>
        <div style={{ textAlign: "center", marginBottom: 18 }}>
          <img src="/vaultforge-logo.png" alt="VaultForge" style={{ width: "100%", maxWidth: 420, borderRadius: 18 }} />
        </div>

        <p style={{ color: "#9df3bf", letterSpacing: 4, fontWeight: 800 }}>VAULTFORGE COMMAND CENTER</p>
        <h1 style={{ fontSize: 54, lineHeight: 1, margin: "10px 0 18px" }}>Dashboard</h1>
        <p style={{ color: "rgba(255,255,255,.72)", fontSize: 22, lineHeight: 1.45 }}>Your member workspace for deals, buy box routing, messages, alerts, and network activity.</p>
        {summary?.email && <p style={{ color: "rgba(255,255,255,.52)", marginTop: 18 }}>Logged in as {summary.email}</p>}
      </section>

      {loading && <section style={cardStyle}>Loading dashboard...</section>}

      {error && (
        <section style={{ ...cardStyle, color: "#ffd0d0", borderColor: "rgba(255,107,107,.55)" }}>
          {error}
          <div style={{ marginTop: 16 }}>
            <Link href="/login" style={navLinkStyle}>Login again</Link>
          </div>
        </section>
      )}

      {!loading && !error && summary && (
        <>
          {!summary.profileComplete && (
            <section style={{ ...heroStyle, borderColor: "rgba(157,243,191,.45)", background: "rgba(157,243,191,.07)" }}>
              <p style={{ color: "#9df3bf", letterSpacing: 4, fontWeight: 800 }}>NEXT BEST ACTION</p>
              <h2 style={{ fontSize: 34, margin: "0 0 14px" }}>Complete Profile + Buy Box</h2>
              <p style={{ color: "rgba(255,255,255,.72)", fontSize: 19, lineHeight: 1.45 }}>This powers AI routing, network visibility, lender matching, and alert quality.</p>
              <Link href="/profile" style={navLinkStyle}>Open Profile</Link>
            </section>
          )}

          <section style={gridStyle}>
            <ActionCard href="/profile" label={summary.profileComplete ? "READY" : "NEEDS SETUP"} title="Profile + Buy Box" description="Control your role, states, price range, strategies, and matching preferences." count={summary.profileComplete ? "✓" : "!"} />
            <ActionCard href="/submit" label="CREATE" title="Submit Deal" description="Create a structured opportunity and trigger AI analysis plus match alerts." />
            <ActionCard href="/projects" label="DEALS" title="Active Deals" description="Open deal rooms, view AI analysis, save opportunities, and message owners." count={summary.counts.activeDeals} />
            <ActionCard href="/projects" label="YOUR DEALS" title="My Deals" description="Deals you posted into the VaultForge network." count={summary.counts.myDeals} />
            <ActionCard href="/buy-bucket" label="SAVED" title="Buy Bucket" description="Opportunities you marked as interesting for tracking and routing." count={summary.counts.buyBucket} />
            <ActionCard href="/alerts" label="SIGNALS" title="Alerts" description="Matched deals, buy bucket activity, and routing notifications." count={summary.counts.alerts} />
            <ActionCard href="/messages" label="COMMS" title="Messages" description="Deal-based and general member conversations." count={summary.counts.messages} />
            <ActionCard href="/network" label="NETWORK" title="Members" description="Buyers, lenders, contractors, developers, and partners." count={summary.counts.members} />
          </section>
        </>
      )}
    </main>
  );
}
