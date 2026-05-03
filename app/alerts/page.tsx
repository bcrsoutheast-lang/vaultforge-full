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

const pillStyle: React.CSSProperties = {
  display: "inline-block",
  color: "#9df3bf",
  border: "1px solid rgba(157,243,191,.35)",
  borderRadius: 999,
  padding: "7px 12px",
  fontSize: 13,
  letterSpacing: 1.2,
  marginBottom: 12,
};

const buttonStyle: React.CSSProperties = {
  display: "inline-block",
  background: "#9df3bf",
  color: "#071326",
  borderRadius: 999,
  padding: "11px 16px",
  fontWeight: 800,
  textDecoration: "none",
  marginTop: 12,
};

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
        setError(data?.error || "Could not load alerts.");
        setAlerts([]);
        return;
      }

      setAlerts(data.alerts || []);
    } catch (err) {
      setError("Could not load alerts.");
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAlerts();
  }, []);

  return (
    <main style={shellStyle}>
      <nav style={navStyle}>
        <Link href="/dashboard" style={navLinkStyle}>Dashboard</Link>
        <Link href="/submit" style={navLinkStyle}>Create Deal</Link>
        <Link href="/projects" style={navLinkStyle}>Projects</Link>
        <Link href="/buy-bucket" style={navLinkStyle}>Buy Bucket</Link>
        <Link href="/network" style={navLinkStyle}>Network</Link>
      </nav>

      <section style={heroStyle}>
        <p style={{ color: "#9df3bf", letterSpacing: 4, fontWeight: 800 }}>
          VAULTFORGE ALERTS
        </p>
        <h1 style={{ fontSize: 54, lineHeight: 1, margin: "10px 0 18px" }}>
          Activity Feed
        </h1>
        <p style={{ color: "rgba(255,255,255,.72)", fontSize: 22, lineHeight: 1.45 }}>
          Deal activity, Buy Bucket updates, and market signals will show here.
        </p>
      </section>

      <button
        onClick={loadAlerts}
        style={{
          ...buttonStyle,
          border: 0,
          cursor: "pointer",
          marginBottom: 20,
        }}
      >
        Refresh Alerts
      </button>

      {loading && (
        <section style={cardStyle}>
          <p>Loading alerts...</p>
        </section>
      )}

      {error && (
        <section
          style={{
            ...cardStyle,
            borderColor: "rgba(255,107,107,.55)",
            color: "#ffd0d0",
          }}
        >
          {error}
        </section>
      )}

      {!loading && !error && alerts.length === 0 && (
        <section style={cardStyle}>
          <p style={{ fontSize: 22 }}>No alerts yet.</p>
          <p style={{ color: "rgba(255,255,255,.68)" }}>
            Create a deal or add one to your Buy Bucket to start generating alerts.
          </p>
        </section>
      )}

      {!loading &&
        !error &&
        alerts.map((alert) => (
          <section key={alert.id} style={cardStyle}>
            <span style={pillStyle}>{alert.type}</span>
            <h2 style={{ fontSize: 28, margin: "0 0 10px" }}>{alert.title}</h2>
            <p style={{ color: "rgba(255,255,255,.72)", fontSize: 18, lineHeight: 1.45 }}>
              {alert.message}
            </p>
            <p style={{ color: "rgba(255,255,255,.45)", fontSize: 14 }}>
              {formatDate(alert.created_at)}
            </p>
            <Link href={alert.href} style={buttonStyle}>View</Link>
          </section>
        ))}
    </main>
  );
}
