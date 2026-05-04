"use client";

import Link from "next/link";

const shell = {
  minHeight: "100vh",
  background: "#071326",
  color: "white",
  padding: "30px 20px",
  fontFamily: "Arial",
};

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: 18,
};

const card = {
  border: "1px solid rgba(255,255,255,.15)",
  borderRadius: 18,
  padding: 22,
  background: "rgba(255,255,255,.03)",
  textDecoration: "none",
  color: "white",
};

const section = {
  marginBottom: 30,
};

export default function Dashboard() {
  return (
    <main style={shell}>
      {/* HEADER */}
      <div style={{ textAlign: "center", marginBottom: 30 }}>
        <img
          src="/vaultforge-logo.png"
          style={{ width: 260, maxWidth: "100%" }}
        />
        <h1 style={{ fontSize: 42, marginTop: 10 }}>
          Command Center
        </h1>
      </div>

      {/* CORE ACTIONS */}
      <section style={section}>
        <h2 style={{ marginBottom: 10 }}>Core Actions</h2>
        <div style={grid}>
          <Link href="/submit" style={card}>
            <h3>Create Deal</h3>
            <p style={{ opacity: 0.6 }}>
              Add opportunity + trigger AI routing
            </p>
          </Link>

          <Link href="/projects" style={card}>
            <h3>Active Deals</h3>
            <p style={{ opacity: 0.6 }}>
              View and manage opportunities
            </p>
          </Link>

          <Link href="/buy-bucket" style={card}>
            <h3>Buy Bucket</h3>
            <p style={{ opacity: 0.6 }}>
              Saved deals for action
            </p>
          </Link>
        </div>
      </section>

      {/* NETWORK */}
      <section style={section}>
        <h2 style={{ marginBottom: 10 }}>Network</h2>
        <div style={grid}>
          <Link href="/network" style={card}>
            <h3>Members</h3>
            <p style={{ opacity: 0.6 }}>
              Buyers, lenders, operators
            </p>
          </Link>

          <Link href="/messages" style={card}>
            <h3>Messages</h3>
            <p style={{ opacity: 0.6 }}>
              Deal + network communication
            </p>
          </Link>

          <Link href="/alerts" style={card}>
            <h3>Alerts</h3>
            <p style={{ opacity: 0.6 }}>
              Matches and signals
            </p>
          </Link>
        </div>
      </section>

      {/* PROFILE */}
      <section style={section}>
        <h2 style={{ marginBottom: 10 }}>Account</h2>
        <div style={grid}>
          <Link href="/profile" style={card}>
            <h3>Profile</h3>
            <p style={{ opacity: 0.6 }}>
              Configure buy box + role
            </p>
          </Link>

          <Link href="/logout" style={card}>
            <h3>Logout</h3>
            <p style={{ opacity: 0.6 }}>
              Exit session
            </p>
          </Link>
        </div>
      </section>
    </main>
  );
}
