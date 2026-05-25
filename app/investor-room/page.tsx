"use client";

import Link from "next/link";
import React from "react";

const page: React.CSSProperties = {
  minHeight: "100vh",
  background: "#05070d",
  color: "#f7f7fb",
  padding: 24,
  fontFamily: "Inter, sans-serif",
};

const wrap: React.CSSProperties = {
  maxWidth: 1000,
  margin: "0 auto",
};

const hero: React.CSSProperties = {
  border: "1px solid rgba(245,197,66,.28)",
  borderRadius: 28,
  padding: 40,
  background:
    "radial-gradient(circle at top right, rgba(245,197,66,.12), transparent 35%), linear-gradient(180deg,#080d19,#050816)",
};

const title: React.CSSProperties = {
  fontSize: "clamp(48px,8vw,88px)",
  lineHeight: 0.92,
  fontWeight: 950,
  letterSpacing: -4,
  margin: "0 0 18px",
};

const sub: React.CSSProperties = {
  color: "#c7ced9",
  fontSize: 22,
  lineHeight: 1.45,
  marginBottom: 30,
};

const row: React.CSSProperties = {
  display: "flex",
  gap: 14,
  flexWrap: "wrap",
};

const button: React.CSSProperties = {
  border: "1px solid rgba(207,216,230,.18)",
  background: "#151b2a",
  color: "#f8fafc",
  borderRadius: 999,
  padding: "14px 22px",
  fontWeight: 900,
  textDecoration: "none",
  display: "inline-block",
};

const goldButton: React.CSSProperties = {
  ...button,
  background: "#ffdc68",
  color: "#10131a",
  border: 0,
};

export default function InvestorRoomRetiredPage() {
  return (
    <main style={page}>
      <div style={wrap}>
        <section style={hero}>
          <div
            style={{
              color: "#ffdc68",
              textTransform: "uppercase",
              letterSpacing: 7,
              fontWeight: 900,
              marginBottom: 16,
            }}
          >
            VaultForge Investor Room
          </div>

          <h1 style={title}>Investor Room retired.</h1>

          <p style={sub}>
            The previous Investor Room implementation has been removed while the
            investor workspace is rebuilt correctly with clean canonical routing,
            room separation, and stable messaging.
          </p>

          <div style={row}>
            <Link href="/" style={goldButton}>
              Home
            </Link>

            <Link href="/command" style={button}>
              Command
            </Link>

            <Link href="/messages" style={button}>
              Messages
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
