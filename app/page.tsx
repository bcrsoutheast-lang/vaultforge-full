"use client";

import Link from "next/link";

const page: React.CSSProperties = {
  minHeight: "100vh",
  background: "#05070d",
  color: "#f7f7fb",
  padding: 18,
  fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
};

const wrap: React.CSSProperties = { maxWidth: 1280, margin: "0 auto", paddingBottom: 90 };
const hero: React.CSSProperties = {
  border: "1px solid rgba(245,197,66,.32)",
  borderRadius: 30,
  padding: 34,
  marginBottom: 20,
  background: "radial-gradient(circle at top right, rgba(245,197,66,.18), transparent 34%), linear-gradient(180deg,#10131a,#070b14)",
};
const card: React.CSSProperties = {
  background: "#111724",
  border: "1px solid rgba(207,216,230,.16)",
  borderRadius: 24,
  padding: 24,
};
const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
  gap: 16,
};
const row: React.CSSProperties = { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" };
const eyebrow: React.CSSProperties = {
  color: "#ffd45a",
  textTransform: "uppercase",
  letterSpacing: 5,
  fontWeight: 950,
  fontSize: 13,
  marginBottom: 12,
};
const h1: React.CSSProperties = {
  fontSize: "clamp(44px,8vw,86px)",
  lineHeight: .9,
  letterSpacing: -4,
  margin: "0 0 18px",
  fontWeight: 950,
};
const h2: React.CSSProperties = {
  fontSize: "clamp(28px,5vw,48px)",
  lineHeight: .95,
  letterSpacing: -2,
  margin: "0 0 12px",
  fontWeight: 950,
};
const sub: React.CSSProperties = { color: "#c9d0dc", fontSize: 21, lineHeight: 1.35, margin: 0 };
const muted: React.CSSProperties = { color: "#aeb7c7", margin: "8px 0 0", lineHeight: 1.35 };
const btn: React.CSSProperties = {
  border: "1px solid rgba(207,216,230,.18)",
  background: "#171c29",
  color: "#f7f7fb",
  borderRadius: 999,
  padding: "13px 18px",
  fontWeight: 950,
  textDecoration: "none",
  display: "inline-block",
};
const goldBtn: React.CSSProperties = { ...btn, border: 0, background: "#ffdc68", color: "#10131a" };

export default function HomePage() {
  return (
    <main style={page}>
      <div style={wrap}>
        <section style={hero}>
          <div style={eyebrow}>VaultForge</div>
          <h1 style={h1}>Private real estate intelligence network.</h1>
          <p style={sub}>
            VaultForge connects investors, members, deal opportunities, and pain/problem submissions inside a controlled private workspace.
          </p>

          <div style={{ ...row, marginTop: 22 }}>
            <Link href="/investor-room" style={goldBtn}>Investor Room</Link>
            <Link href="/member-access" style={goldBtn}>Members Access</Link>
            <Link href="/admin" style={btn}>Admin Login</Link>
          </div>
        </section>

        <section style={{ ...grid, marginBottom: 18 }}>
          <div style={card}>
            <div style={eyebrow}>Investor Room</div>
            <h2 style={h2}>Find deals and opportunities.</h2>
            <p style={muted}>
              Investors do not see the private member directory. They can view limited deal and pain postings, request contact, ask for funding,
              request execution help, and work opportunities through controlled VaultForge channels.
            </p>
          </div>

          <div style={card}>
            <div style={eyebrow}>Private Members Site</div>
            <h2 style={h2}>Operators, lenders, buyers, and specialists.</h2>
            <p style={muted}>
              Members use the private workspace for routed requests, deal/pain rooms, alerts, messaging, and execution support.
              Access is approved before payment unlocks the full room experience.
            </p>
          </div>

          <div style={card}>
            <div style={eyebrow}>Launch Access</div>
            <h2 style={h2}>Founders access opens June 1.</h2>
            <p style={muted}>
              Investor founders price: $79 first month, then $149/month. Profiles are reviewed first. Once approved, payment unlocks the room.
            </p>
          </div>
        </section>

        <section style={card}>
          <div style={eyebrow}>Test Sequence</div>
          <p style={sub}>Investor: Investor Room → submit profile → Admin approves → payment pulses → mock pay unlocks.</p>
          <p style={muted}>Member: Members Access → create login/profile → Admin approves → payment pulses → mock pay unlocks.</p>
        </section>
      </div>
    </main>
  );
}
