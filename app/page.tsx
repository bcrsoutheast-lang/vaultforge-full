"use client";

import Link from "next/link";

const shell = {
  minHeight: "100vh",
  background: "#05070d",
  color: "white",
  fontFamily: "Arial",
  padding: "40px 20px",
};

const center = {
  maxWidth: 1100,
  margin: "0 auto",
  textAlign: "center" as const,
};

const button = {
  display: "inline-block",
  marginTop: 20,
  padding: "14px 22px",
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,.2)",
  textDecoration: "none",
  color: "white",
};

export default function Home() {
  return (
    <main style={shell}>
      <div style={center}>
        <img
          src="/vaultforge-logo.png"
          style={{ width: 420, maxWidth: "100%", marginBottom: 30 }}
        />

        <h1 style={{ fontSize: 48, marginBottom: 20 }}>
          Private Deal Flow. Real Execution.
        </h1>

        <p style={{ opacity: 0.7, fontSize: 20, lineHeight: 1.5 }}>
          VaultForge is a private real estate command center connecting deals,
          capital, operators, and execution partners in one system.
        </p>

        <div>
          <Link href="/login" style={button}>
            Enter Members Area
          </Link>
        </div>
      </div>
    </main>
  );
}
