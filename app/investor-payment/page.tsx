"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";


const page: React.CSSProperties = {
  minHeight: "100vh",
  background: "#05070d",
  color: "#f7f7fb",
  padding: 18,
  fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
};

const wrap: React.CSSProperties = { maxWidth: 1320, margin: "0 auto", paddingBottom: 90 };
const hero: React.CSSProperties = {
  border: "1px solid rgba(245,197,66,.28)",
  borderRadius: 30,
  padding: 30,
  marginBottom: 20,
  background: "radial-gradient(circle at top right, rgba(245,197,66,.16), transparent 34%), linear-gradient(180deg,#080d19,#050816)",
};
const panel: React.CSSProperties = { background: "#121724", border: "1px solid rgba(207,216,230,.16)", borderRadius: 24, padding: 22 };
const goldPanel: React.CSSProperties = { ...panel, borderColor: "rgba(245,197,66,.48)", boxShadow: "0 0 26px rgba(245,197,66,.10)" };
const redPanel: React.CSSProperties = { ...panel, borderColor: "rgba(255,70,70,.52)", boxShadow: "0 0 26px rgba(255,70,70,.10)" };
const grid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: 16 };
const wideGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 18 };
const row: React.CSSProperties = { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" };
const eyebrow: React.CSSProperties = { color: "#ffd45a", textTransform: "uppercase", letterSpacing: 6, fontWeight: 950, fontSize: 13, marginBottom: 12 };
const h1: React.CSSProperties = { fontSize: "clamp(42px,7vw,78px)", lineHeight: .9, letterSpacing: -4, margin: "0 0 18px", fontWeight: 950 };
const h2: React.CSSProperties = { fontSize: "clamp(28px,5vw,48px)", lineHeight: .96, letterSpacing: -2, margin: "0 0 14px", fontWeight: 950 };
const h3: React.CSSProperties = { fontSize: 26, margin: "0 0 10px", fontWeight: 950 };
const sub: React.CSSProperties = { color: "#c9d0dc", fontSize: 20, lineHeight: 1.35, margin: 0 };
const muted: React.CSSProperties = { color: "#aeb7c7", margin: "8px 0 0", lineHeight: 1.4 };
const btn: React.CSSProperties = { border: "1px solid rgba(207,216,230,.18)", background: "#171c29", color: "#f7f7fb", borderRadius: 999, padding: "13px 18px", fontWeight: 950, textDecoration: "none", display: "inline-block", cursor: "pointer" };
const goldBtn: React.CSSProperties = { ...btn, border: 0, background: "#ffdc68", color: "#10131a" };
const redBtn: React.CSSProperties = { ...btn, background: "#271016", borderColor: "rgba(255,70,70,.48)", color: "#ffaaaa" };
const input: React.CSSProperties = { width: "100%", boxSizing: "border-box", border: "1px solid rgba(207,216,230,.18)", background: "#111823", color: "#f8fafc", borderRadius: 16, padding: "14px 15px", fontSize: 16 };
const field: React.CSSProperties = { display: "grid", gap: 8, marginTop: 14 };

const INVESTOR_APP_KEY = "vaultforge_investor_application_v1";

function readInvestor() {
  try { return JSON.parse(localStorage.getItem(INVESTOR_APP_KEY) || "{}"); } catch { return {}; }
}

function markInvestorPaid() {
  const current = readInvestor();
  const patch = { ...current, paymentStatus: "paid", accessStatus: "active", paidAt: new Date().toISOString() };
  localStorage.setItem(INVESTOR_APP_KEY, JSON.stringify(patch));
  window.dispatchEvent(new Event("vaultforge-investor-change"));
}

export default function InvestorPaymentPage() {
  const [investor, setInvestor] = useState<any>({});
  useEffect(() => {
    setInvestor(readInvestor());
    const refresh = () => setInvestor(readInvestor());
    window.addEventListener("storage", refresh);
    window.addEventListener("vaultforge-investor-change", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("vaultforge-investor-change", refresh);
    };
  }, []);

  const approved = Boolean(investor.approvedForPayment);
  const paid = investor.paymentStatus === "paid" || investor.accessStatus === "active";

  return (
    <main style={page}>
      <div style={wrap}>
        <section style={hero}>
          <div style={eyebrow}>Investor Payment</div>
          <h1 style={h1}>Investor access gate.</h1>
          <p style={sub}>$49 first month. Then $149/month. Payment unlocks only after admin approval.</p>

          {!approved ? (
            <div style={{ ...redPanel, marginTop: 20 }}>
              <div style={eyebrow}>Payment Locked</div>
              <p style={sub}>Admin has not approved this investor application for payment yet.</p>
              <div style={{ ...row, marginTop: 16 }}><Link href="/investor-application" style={goldBtn}>Update Application</Link></div>
            </div>
          ) : paid ? (
            <div style={{ ...goldPanel, marginTop: 20 }}>
              <div style={eyebrow}>Investor Access Active</div>
              <p style={sub}>Investor room is unlocked.</p>
              <div style={{ ...row, marginTop: 16 }}><Link href="/investor-room" style={goldBtn}>Open Investor Room</Link></div>
            </div>
          ) : (
            <div style={{ ...goldPanel, marginTop: 20 }}>
              <div style={eyebrow}>Payment Approved</div>
              <p style={sub}>Stripe connects later. This button simulates investor paid access for testing.</p>
              <button type="button" style={goldBtn} onClick={() => { markInvestorPaid(); setInvestor(readInvestor()); }}>Activate Investor Access</button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
