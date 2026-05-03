"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type AlertItem = {
  id: string;
  type: string;
  title: string;
  message: string;
  href: string;
  created_at: string;
};


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


function formatDate(value: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString();
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadAlerts() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/alerts/list", { cache: "no-store" });
      const data = await res.json();

      if (!res.ok) {
        setError(cleanError(data?.error || data?.details || "Could not load alerts."));
        setAlerts([]);
      } else {
        setAlerts(data.alerts || []);
      }
    } catch {
      setError("Could not load alerts. Refresh and try again.");
      setAlerts([]);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadAlerts();
  }, []);

  return (
    <main style={shellStyle}>
      <Nav />

      <section style={heroStyle}>
        <p style={{ color: "#9df3bf", letterSpacing: 4, fontWeight: 800 }}>VAULTFORGE ALERTS</p>
        <h1 style={{ fontSize: 50, lineHeight: 1, margin: "10px 0 18px" }}>Activity Feed</h1>
        <p style={{ color: "rgba(255,255,255,.72)", fontSize: 20, lineHeight: 1.45 }}>
          Match alerts, buy bucket activity, and routing signals.
        </p>
      </section>

      <button onClick={loadAlerts} style={{ ...buttonStyle, marginBottom: 18 }}>Refresh Alerts</button>

      {loading && <section style={cardStyle}>Loading alerts...</section>}
      {error && <section style={{ ...cardStyle, color: "#ffd0d0" }}>{error}</section>}

      {!loading && !error && alerts.length === 0 && (
        <section style={cardStyle}>
          <h2>No alerts yet.</h2>
          <p style={{ color: "rgba(255,255,255,.68)" }}>Complete your profile and create or save deals to generate routing alerts.</p>
        </section>
      )}

      {!loading && !error && alerts.map((alert) => (
        <section key={alert.id} style={cardStyle}>
          <span style={pillStyle}>{alert.type}</span>
          <h2 style={{ fontSize: 28, margin: "0 0 10px" }}>{alert.title}</h2>
          <p style={{ color: "rgba(255,255,255,.72)", fontSize: 18, lineHeight: 1.45 }}>{alert.message}</p>
          <p style={{ color: "rgba(255,255,255,.45)", fontSize: 14 }}>{formatDate(alert.created_at)}</p>
          <Link href={alert.href} style={{ ...buttonStyle, display: "inline-block", textDecoration: "none" }}>View</Link>
        </section>
      ))}
    </main>
  );
}
