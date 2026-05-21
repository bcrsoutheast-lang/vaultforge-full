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
const INVESTOR_LIST_KEY = "vaultforge_investor_applications_v1";

function readApp() {
  try { return JSON.parse(localStorage.getItem(INVESTOR_APP_KEY) || "{}"); } catch { return {}; }
}

function saveApplication(app: any) {
  const now = new Date().toISOString();
  const record = { ...readApp(), ...app, status: "pending", approvedForPayment: false, paymentStatus: "unpaid", accessStatus: "pending_approval", updatedAt: now, createdAt: app.createdAt || now };
  localStorage.setItem(INVESTOR_APP_KEY, JSON.stringify(record));

  let rows: any[] = [];
  try { const parsed = JSON.parse(localStorage.getItem(INVESTOR_LIST_KEY) || "[]"); rows = Array.isArray(parsed) ? parsed : []; } catch { rows = []; }
  const key = String(record.email || record.company || Date.now()).toLowerCase();
  const next = [record, ...rows.filter((row) => String(row.email || row.company || "").toLowerCase() !== key)];
  localStorage.setItem(INVESTOR_LIST_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event("vaultforge-investor-change"));
}

export default function InvestorApplicationPage() {
  const [form, setForm] = useState<any>({ email: "", contactName: "", company: "", phone: "", statesInterested: "", assetTypes: "", minDeal: "", maxDeal: "", capitalSource: "", notes: "" });
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const existing = readApp();
    setForm((value: any) => ({ ...value, ...existing }));
  }, []);

  function update(key: string, value: string) {
    setForm((current: any) => ({ ...current, [key]: value }));
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    saveApplication(form);
    setNotice("Investor application submitted. Admin approval required before payment unlocks.");
  }

  return (
    <main style={page}>
      <div style={wrap}>
        <section style={hero}>
          <div style={eyebrow}>Investor Application</div>
          <h1 style={h1}>Request investor room access.</h1>
          <p style={sub}>This does not grant private member network access. It only requests the investor visitor lane.</p>

          <form onSubmit={submit} style={{ marginTop: 18 }}>
            <div style={wideGrid}>
              <label style={field}><span style={eyebrow}>Contact Name</span><input style={input} value={form.contactName} onChange={(e) => update("contactName", e.target.value)} /></label>
              <label style={field}><span style={eyebrow}>Company</span><input style={input} value={form.company} onChange={(e) => update("company", e.target.value)} /></label>
              <label style={field}><span style={eyebrow}>Email</span><input style={input} type="email" value={form.email} onChange={(e) => update("email", e.target.value)} /></label>
              <label style={field}><span style={eyebrow}>Phone</span><input style={input} value={form.phone} onChange={(e) => update("phone", e.target.value)} /></label>
              <label style={field}><span style={eyebrow}>States Interested In</span><input style={input} value={form.statesInterested} onChange={(e) => update("statesInterested", e.target.value)} placeholder="GA, FL, TN..." /></label>
              <label style={field}><span style={eyebrow}>Asset Types</span><input style={input} value={form.assetTypes} onChange={(e) => update("assetTypes", e.target.value)} placeholder="Residential, commercial, land..." /></label>
              <label style={field}><span style={eyebrow}>Minimum Deal Size</span><input style={input} value={form.minDeal} onChange={(e) => update("minDeal", e.target.value)} /></label>
              <label style={field}><span style={eyebrow}>Maximum Deal Size</span><input style={input} value={form.maxDeal} onChange={(e) => update("maxDeal", e.target.value)} /></label>
            </div>
            <label style={field}><span style={eyebrow}>Capital / Buying Source</span><input style={input} value={form.capitalSource} onChange={(e) => update("capitalSource", e.target.value)} placeholder="cash, lender, fund, private capital..." /></label>
            <label style={field}><span style={eyebrow}>Notes</span><textarea style={{ ...input, minHeight: 150 }} value={form.notes} onChange={(e) => update("notes", e.target.value)} /></label>
            <div style={{ ...row, marginTop: 18 }}>
              <button type="submit" style={goldBtn}>Submit Investor Application</button>
              <Link href="/investor-payment" style={btn}>Investor Payment</Link>
            </div>
          </form>
          {notice ? <p style={{ ...sub, marginTop: 18 }}>{notice}</p> : null}
        </section>
      </div>
    </main>
  );
}
