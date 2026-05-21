"use client";

import Link from "next/link";

const page: React.CSSProperties = { minHeight: "100vh", background: "#05070d", color: "#f7f7fb", padding: 18, fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" };
const wrap: React.CSSProperties = { maxWidth: 1120, margin: "0 auto", paddingBottom: 80 };
const hero: React.CSSProperties = { border: "1px solid rgba(245,197,66,.28)", borderRadius: 30, padding: 30, marginBottom: 20, background: "radial-gradient(circle at top right, rgba(245,197,66,.16), transparent 32%), linear-gradient(180deg,#080d19,#050816)" };
const panel: React.CSSProperties = { background: "#121724", border: "1px solid rgba(207,216,230,.16)", borderRadius: 24, padding: 24 };
const grid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: 16 };
const row: React.CSSProperties = { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" };
const eyebrow: React.CSSProperties = { color: "#ffd45a", textTransform: "uppercase", letterSpacing: 6, fontWeight: 950, fontSize: 13, marginBottom: 12 };
const h1: React.CSSProperties = { fontSize: "clamp(44px,8vw,86px)", lineHeight: 0.9, letterSpacing: -4, margin: "0 0 18px", fontWeight: 950 };
const h2: React.CSSProperties = { fontSize: "clamp(30px,5vw,46px)", lineHeight: 0.95, letterSpacing: -2, margin: "0 0 14px", fontWeight: 950 };
const sub: React.CSSProperties = { color: "#c9d0dc", fontSize: 20, lineHeight: 1.35, margin: 0 };
const muted: React.CSSProperties = { color: "#aeb7c7", margin: "8px 0 0", lineHeight: 1.35 };
const btn: React.CSSProperties = { border: "1px solid rgba(207,216,230,.18)", background: "#171c29", color: "#f7f7fb", borderRadius: 999, padding: "13px 18px", fontWeight: 950, textDecoration: "none", display: "inline-block" };
const goldBtn: React.CSSProperties = { ...btn, border: 0, background: "#ffdc68", color: "#10131a" };

export default function MemberAccessPage() {
  return (
    <main style={page}>
      <div style={wrap}>
        <section style={hero}>
          <div style={eyebrow}>VaultForge Member Access</div>
          <h1 style={h1}>Request private access.</h1>
          <p style={sub}>Create a login, complete your profile, wait for owner approval, then activate payment access when approved.</p>
          <div style={{ ...row, marginTop: 20 }}>
            <Link href="/create-login" style={goldBtn}>Create Login</Link>
            <Link href="/command" style={btn}>Existing Member Command</Link>
            <Link href="/" style={btn}>Home</Link>
          </div>
        </section>

        <section style={grid}>
          <div style={panel}><div style={eyebrow}>Step 1</div><h2 style={h2}>Create Login</h2><p style={muted}>Member starts with email and password.</p></div>
          <div style={panel}><div style={eyebrow}>Step 2</div><h2 style={h2}>Complete Profile</h2><p style={muted}>Profile tells VaultForge who they are and what lanes they operate in.</p></div>
          <div style={panel}><div style={eyebrow}>Step 3</div><h2 style={h2}>Owner Approval</h2><p style={muted}>Admin Command approves payment access or holds the member.</p></div>
          <div style={panel}><div style={eyebrow}>Step 4</div><h2 style={h2}>Pay / Unlock</h2><p style={muted}>Payment button lights up after approval. Paid members unlock full access.</p></div>
        </section>
      </div>
    </main>
  );
}
