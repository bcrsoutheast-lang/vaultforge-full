"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const INVESTOR_APP_KEY = "vaultforge_investor_application_v1";
const INVESTOR_LIST_KEY = "vaultforge_investor_applications_v1";

function clean(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

function readInvestor() {
  const single = readJson<any>(INVESTOR_APP_KEY, {});
  const rows = readJson<any[]>(INVESTOR_LIST_KEY, []);
  const email = clean(single?.email || localStorage.getItem("vaultforge_investor_email"));

  if (Array.isArray(rows) && email) {
    const match = rows.find((row) => clean(row?.email || row?.investorEmail || row?.investor_email) === email);
    if (match) return { ...single, ...match };
  }

  return single || {};
}

function saveInvestor(next: any) {
  const rows = readJson<any[]>(INVESTOR_LIST_KEY, []);
  const email = clean(next?.email || next?.investorEmail || next?.investor_email);

  if (Array.isArray(rows) && email) {
    const updated = rows.map((row) => {
      const rowEmail = clean(row?.email || row?.investorEmail || row?.investor_email);
      return rowEmail === email ? { ...row, ...next } : row;
    });
    writeJson(INVESTOR_LIST_KEY, updated);
  }

  writeJson(INVESTOR_APP_KEY, next);
  window.dispatchEvent(new Event("vaultforge-investor-change"));
  window.dispatchEvent(new Event("vaultforge-admin-investor-change"));
}

function markInvestorPaid() {
  const current = readInvestor();
  const patch = {
    ...current,
    status: "approved",
    approvedForPayment: true,
    paymentStatus: "paid",
    accessStatus: "active",
    access: "active",
    paidAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  saveInvestor(patch);
  return patch;
}

const page: React.CSSProperties = {
  minHeight: "100vh",
  background: "#05070d",
  color: "#f7f7fb",
  padding: 18,
  fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
};

const wrap: React.CSSProperties = { maxWidth: 900, margin: "0 auto", paddingBottom: 90 };
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
const row: React.CSSProperties = { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" };
const eyebrow: React.CSSProperties = { color: "#ffd45a", textTransform: "uppercase", letterSpacing: 6, fontWeight: 950, fontSize: 13, marginBottom: 12 };
const h1: React.CSSProperties = { fontSize: "clamp(42px,7vw,78px)", lineHeight: .9, letterSpacing: -4, margin: "0 0 18px", fontWeight: 950 };
const sub: React.CSSProperties = { color: "#c9d0dc", fontSize: 20, lineHeight: 1.35, margin: 0 };
const muted: React.CSSProperties = { color: "#aeb7c7", margin: "8px 0 0", lineHeight: 1.4 };
const btn: React.CSSProperties = { border: "1px solid rgba(207,216,230,.18)", background: "#171c29", color: "#f7f7fb", borderRadius: 999, padding: "13px 18px", fontWeight: 950, textDecoration: "none", display: "inline-block", cursor: "pointer" };
const goldBtn: React.CSSProperties = { ...btn, border: 0, background: "#ffdc68", color: "#10131a" };

export default function InvestorPaymentPage() {
  const [investor, setInvestor] = useState<any>({});

  useEffect(() => {
    const refresh = () => setInvestor(readInvestor());
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener("vaultforge-investor-change", refresh);
    window.addEventListener("vaultforge-admin-investor-change", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("vaultforge-investor-change", refresh);
      window.removeEventListener("vaultforge-admin-investor-change", refresh);
    };
  }, []);

  const approved = Boolean(investor?.approvedForPayment || investor?.approved_for_payment);
  const paid = investor?.paymentStatus === "paid" || investor?.payment_status === "paid" || investor?.accessStatus === "active" || investor?.access === "active";

  return (
    <main style={page}>
      <div style={wrap}>
        <section style={hero}>
          <div style={eyebrow}>Investor Payment</div>
          <h1 style={h1}>Investor access gate.</h1>
          <p style={sub}>$49 first month. Then $149/month. Payment unlocks only after admin approval.</p>
          <p style={muted}>Detected investor: {investor?.email || "not detected"}</p>

          {!approved ? (
            <div style={{ ...redPanel, marginTop: 20 }}>
              <div style={eyebrow}>Payment Locked</div>
              <p style={sub}>Admin has not approved this investor application for payment yet.</p>
              <div style={{ ...row, marginTop: 16 }}>
                <Link href="/investor-application" style={goldBtn}>Update Application</Link>
                <Link href="/admin" style={btn}>Admin Command</Link>
              </div>
            </div>
          ) : paid ? (
            <div style={{ ...goldPanel, marginTop: 20 }}>
              <div style={eyebrow}>Investor Access Active</div>
              <p style={sub}>Investor room is unlocked.</p>
              <div style={{ ...row, marginTop: 16 }}>
                <Link href="/investor-room" style={goldBtn}>Open Investor Room</Link>
                <Link href="/admin" style={btn}>Admin Command</Link>
              </div>
            </div>
          ) : (
            <div style={{ ...goldPanel, marginTop: 20 }}>
              <div style={eyebrow}>Payment Approved</div>
              <p style={sub}>Stripe connects later. This button simulates investor paid access for testing.</p>
              <div style={{ ...row, marginTop: 16 }}>
                <button type="button" style={goldBtn} onClick={() => setInvestor(markInvestorPaid())}>Activate Investor Access</button>
                <Link href="/investor-room" style={btn}>Investor Room</Link>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
