"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const INVESTOR_APP_KEY = "vaultforge_investor_application_v1";
const INVESTOR_LIST_KEY = "vaultforge_investor_applications_v1";

const STATES = ["GA", "TN", "AL", "FL", "NC", "SC", "TX"];
const INVESTOR_TYPES = [
  "Flipper",
  "Buy & Hold",
  "Landlord",
  "Cash Buyer",
  "Finance Buyer",
  "Commercial Buyer",
  "Multifamily Buyer",
  "Land Buyer",
  "Wholesaler Buyer",
  "Distressed Asset Buyer",
  "Development Buyer",
  "Private Investor",
  "Fund / Institutional",
];
const STRATEGIES = [
  "Fix & Flip",
  "Buy To Rent",
  "BRRRR",
  "Wholesale Friendly",
  "Creative Finance",
  "Seller Finance",
  "JV / Partnership",
  "Value Add",
  "Long-Term Hold",
  "Quick Close",
  "Portfolio Buyer",
];
const ASSETS = [
  "Single Family",
  "Small Multifamily",
  "Large Multifamily",
  "Commercial",
  "Land",
  "Retail",
  "Office",
  "Industrial",
  "Self Storage",
  "Mobile Home Park",
  "Hospitality",
  "Mixed Use",
];

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

function clean(value: unknown) {
  return String(value || "").trim();
}

function listToggle(list: string[], value: string) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function saveApplication(app: any) {
  const now = new Date().toISOString();
  const existing = readJson<any>(INVESTOR_APP_KEY, {});
  const record = {
    ...existing,
    ...app,
    status: existing.status === "approved" ? "approved" : "pending",
    approvedForPayment: Boolean(existing.approvedForPayment),
    paymentStatus: existing.paymentStatus || "unpaid",
    accessStatus: existing.accessStatus || "pending_approval",
    access: existing.access || "locked",
    profileComplete: true,
    updatedAt: now,
    createdAt: existing.createdAt || now,
  };

  writeJson(INVESTOR_APP_KEY, record);
  localStorage.setItem("vaultforge_investor_email", String(record.email || "").toLowerCase());
  writeJson("vaultforge_investor_session_v1", { email: String(record.email || "").toLowerCase(), role: "investor", loggedIn: true, updatedAt: now });

  const rows = readJson<any[]>(INVESTOR_LIST_KEY, []);
  const key = String(record.email || record.company || Date.now()).toLowerCase();
  const next = [record, ...rows.filter((row) => String(row.email || row.company || "").toLowerCase() !== key)];
  writeJson(INVESTOR_LIST_KEY, next);

  window.dispatchEvent(new Event("vaultforge-investor-change"));
  return record;
}

const page: React.CSSProperties = {
  minHeight: "100vh",
  background: "#05070d",
  color: "#f7f7fb",
  padding: 18,
  fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
};

const wrap: React.CSSProperties = { maxWidth: 1200, margin: "0 auto", paddingBottom: 90 };
const hero: React.CSSProperties = {
  border: "1px solid rgba(245,197,66,.28)",
  borderRadius: 30,
  padding: 30,
  marginBottom: 20,
  background: "radial-gradient(circle at top right, rgba(245,197,66,.16), transparent 34%), linear-gradient(180deg,#080d19,#050816)",
};
const panel: React.CSSProperties = { background: "#121724", border: "1px solid rgba(207,216,230,.16)", borderRadius: 24, padding: 22 };
const goldPanel: React.CSSProperties = { ...panel, borderColor: "rgba(245,197,66,.48)", boxShadow: "0 0 26px rgba(245,197,66,.10)" };
const grid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 16 };
const row: React.CSSProperties = { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" };
const eyebrow: React.CSSProperties = { color: "#ffd45a", textTransform: "uppercase", letterSpacing: 6, fontWeight: 950, fontSize: 13, marginBottom: 12 };
const h1: React.CSSProperties = { fontSize: "clamp(42px,7vw,78px)", lineHeight: .9, letterSpacing: -4, margin: "0 0 18px", fontWeight: 950 };
const h2: React.CSSProperties = { fontSize: "clamp(28px,5vw,48px)", lineHeight: .96, letterSpacing: -2, margin: "0 0 14px", fontWeight: 950 };
const sub: React.CSSProperties = { color: "#c9d0dc", fontSize: 20, lineHeight: 1.35, margin: 0 };
const muted: React.CSSProperties = { color: "#aeb7c7", margin: "8px 0 0", lineHeight: 1.4 };
const btn: React.CSSProperties = { border: "1px solid rgba(207,216,230,.18)", background: "#171c29", color: "#f7f7fb", borderRadius: 999, padding: "12px 16px", fontWeight: 950, textDecoration: "none", display: "inline-block", cursor: "pointer" };
const goldBtn: React.CSSProperties = { ...btn, border: 0, background: "#ffdc68", color: "#10131a" };
const input: React.CSSProperties = { width: "100%", boxSizing: "border-box", border: "1px solid rgba(207,216,230,.18)", background: "#111823", color: "#f8fafc", borderRadius: 16, padding: "14px 15px", fontSize: 16 };
const field: React.CSSProperties = { display: "grid", gap: 8, marginTop: 14 };
const chip: React.CSSProperties = { ...btn, padding: "10px 13px", fontSize: 13 };

export default function InvestorApplicationPage() {
  const [form, setForm] = useState<any>({
    email: "",
    contactName: "",
    company: "",
    phone: "",
    website: "",
    photoUrl: "",
    investorTypes: [],
    buyingStrategies: [],
    assetTypes: [],
    statesInterested: [],
    countiesInterested: "",
    citiesInterested: "",
    zipFocus: "",
    minDeal: "",
    maxDeal: "",
    monthlyVolume: "",
    yearlyVolume: "",
    targetHoldTime: "",
    closeSpeed: "",
    proofFunds: "",
    directBuyer: "",
    fundingNeeded: "",
    openToJV: "",
    openToWholesalers: "",
    buyingExperience: "",
    capitalSource: "",
    notes: "",
  });
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const existing = readJson<any>(INVESTOR_APP_KEY, {});
    if (existing && typeof existing === "object") {
      setForm((value: any) => ({ ...value, ...existing }));
    }
  }, []);

  function update(key: string, value: any) {
    setForm((current: any) => ({ ...current, [key]: value }));
  }

  async function uploadPhoto(file: File | null) {
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    update("photoUrl", dataUrl);
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const record = saveApplication(form);
    setNotice(`Investor profile submitted for ${record.company || record.email}. Admin approval required before payment unlocks.`);
  }

  return (
    <main style={page}>
      <div style={wrap}>
        <section style={hero}>
          <div style={eyebrow}>Investor Buyer Profile</div>
          <h1 style={h1}>Build your buyer intelligence profile.</h1>
          <p style={sub}>
            When you request info on a Deal or Pain card, this profile is attached so members/admin can understand who is asking before approving deeper access.
          </p>

          <div style={{ ...row, marginTop: 18 }}>
            <Link href="/investor-access" style={btn}>Investor Access</Link>
            <Link href="/investor-payment" style={btn}>Payment</Link>
            <Link href="/investor-room" style={goldBtn}>Investor Room</Link>
          </div>
        </section>

        <form onSubmit={submit}>
          <section style={goldPanel}>
            <div style={eyebrow}>Identity / Photo</div>
            <div style={grid}>
              <div>
                <label style={field}><span style={eyebrow}>Profile Photo / Logo</span><input style={input} type="file" accept="image/*" onChange={(e) => uploadPhoto(e.target.files?.[0] || null)} /></label>
                {form.photoUrl ? <img src={form.photoUrl} alt="Investor profile" style={{ width: 150, height: 150, objectFit: "cover", borderRadius: 26, marginTop: 14, border: "1px solid rgba(245,197,66,.35)" }} /> : <p style={muted}>Photo helps members know who is requesting info.</p>}
              </div>

              <div>
                <label style={field}><span style={eyebrow}>Full Name</span><input style={input} value={form.contactName} onChange={(e) => update("contactName", e.target.value)} /></label>
                <label style={field}><span style={eyebrow}>Company</span><input style={input} value={form.company} onChange={(e) => update("company", e.target.value)} /></label>
              </div>

              <div>
                <label style={field}><span style={eyebrow}>Email</span><input style={input} type="email" value={form.email} onChange={(e) => update("email", e.target.value)} /></label>
                <label style={field}><span style={eyebrow}>Phone</span><input style={input} value={form.phone} onChange={(e) => update("phone", e.target.value)} /></label>
                <label style={field}><span style={eyebrow}>Website / Social</span><input style={input} value={form.website} onChange={(e) => update("website", e.target.value)} /></label>
              </div>
            </div>
          </section>

          <section style={{ ...panel, marginTop: 18 }}>
            <div style={eyebrow}>Investor Type</div>
            <div style={row}>
              {INVESTOR_TYPES.map((item) => (
                <button key={item} type="button" style={form.investorTypes?.includes(item) ? goldBtn : chip} onClick={() => update("investorTypes", listToggle(form.investorTypes || [], item))}>{item}</button>
              ))}
            </div>
          </section>

          <section style={{ ...panel, marginTop: 18 }}>
            <div style={eyebrow}>Buying Strategy</div>
            <div style={row}>
              {STRATEGIES.map((item) => (
                <button key={item} type="button" style={form.buyingStrategies?.includes(item) ? goldBtn : chip} onClick={() => update("buyingStrategies", listToggle(form.buyingStrategies || [], item))}>{item}</button>
              ))}
            </div>
          </section>

          <section style={{ ...panel, marginTop: 18 }}>
            <div style={eyebrow}>Asset Preferences</div>
            <div style={row}>
              {ASSETS.map((item) => (
                <button key={item} type="button" style={form.assetTypes?.includes(item) ? goldBtn : chip} onClick={() => update("assetTypes", listToggle(form.assetTypes || [], item))}>{item}</button>
              ))}
            </div>
          </section>

          <section style={{ ...panel, marginTop: 18 }}>
            <div style={eyebrow}>Markets</div>
            <div style={row}>
              {STATES.map((item) => (
                <button key={item} type="button" style={form.statesInterested?.includes(item) ? goldBtn : chip} onClick={() => update("statesInterested", listToggle(form.statesInterested || [], item))}>{item}</button>
              ))}
            </div>
            <div style={grid}>
              <label style={field}><span style={eyebrow}>Counties Interested</span><input style={input} value={form.countiesInterested} onChange={(e) => update("countiesInterested", e.target.value)} /></label>
              <label style={field}><span style={eyebrow}>Cities Interested</span><input style={input} value={form.citiesInterested} onChange={(e) => update("citiesInterested", e.target.value)} /></label>
              <label style={field}><span style={eyebrow}>Zip Focus</span><input style={input} value={form.zipFocus} onChange={(e) => update("zipFocus", e.target.value)} /></label>
            </div>
          </section>

          <section style={{ ...panel, marginTop: 18 }}>
            <div style={eyebrow}>Buy Box / Execution</div>
            <div style={grid}>
              <label style={field}><span style={eyebrow}>Minimum Purchase</span><input style={input} value={form.minDeal} onChange={(e) => update("minDeal", e.target.value)} /></label>
              <label style={field}><span style={eyebrow}>Maximum Purchase</span><input style={input} value={form.maxDeal} onChange={(e) => update("maxDeal", e.target.value)} /></label>
              <label style={field}><span style={eyebrow}>Deals Per Month</span><input style={input} value={form.monthlyVolume} onChange={(e) => update("monthlyVolume", e.target.value)} /></label>
              <label style={field}><span style={eyebrow}>Deals Per Year</span><input style={input} value={form.yearlyVolume} onChange={(e) => update("yearlyVolume", e.target.value)} /></label>
              <label style={field}><span style={eyebrow}>Target Hold Time</span><input style={input} value={form.targetHoldTime} onChange={(e) => update("targetHoldTime", e.target.value)} /></label>
              <label style={field}><span style={eyebrow}>Average Close Speed</span><input style={input} value={form.closeSpeed} onChange={(e) => update("closeSpeed", e.target.value)} /></label>
            </div>
          </section>

          <section style={{ ...panel, marginTop: 18 }}>
            <div style={eyebrow}>Verification / Fit</div>
            <div style={grid}>
              <label style={field}><span style={eyebrow}>Proof Of Funds Available?</span><select style={input} value={form.proofFunds} onChange={(e) => update("proofFunds", e.target.value)}><option value="">Select</option><option>Yes</option><option>No</option><option>Can provide on request</option></select></label>
              <label style={field}><span style={eyebrow}>Direct Buyer Or Intermediary?</span><select style={input} value={form.directBuyer} onChange={(e) => update("directBuyer", e.target.value)}><option value="">Select</option><option>Direct Buyer</option><option>Broker / Intermediary</option><option>Fund Representative</option><option>Wholesaler Buyer</option></select></label>
              <label style={field}><span style={eyebrow}>Need Funding Introductions?</span><select style={input} value={form.fundingNeeded} onChange={(e) => update("fundingNeeded", e.target.value)}><option value="">Select</option><option>Yes</option><option>No</option><option>Depends on deal</option></select></label>
              <label style={field}><span style={eyebrow}>Open To JV?</span><select style={input} value={form.openToJV} onChange={(e) => update("openToJV", e.target.value)}><option value="">Select</option><option>Yes</option><option>No</option><option>Case by case</option></select></label>
              <label style={field}><span style={eyebrow}>Open To Wholesalers?</span><select style={input} value={form.openToWholesalers} onChange={(e) => update("openToWholesalers", e.target.value)}><option value="">Select</option><option>Yes</option><option>No</option><option>Case by case</option></select></label>
              <label style={field}><span style={eyebrow}>Capital Source</span><input style={input} value={form.capitalSource} onChange={(e) => update("capitalSource", e.target.value)} placeholder="Cash, lender, private capital, fund..." /></label>
            </div>
            <label style={field}><span style={eyebrow}>Buying Experience / Notes</span><textarea style={{ ...input, minHeight: 140 }} value={form.buyingExperience} onChange={(e) => update("buyingExperience", e.target.value)} /></label>
            <label style={field}><span style={eyebrow}>Additional Notes</span><textarea style={{ ...input, minHeight: 140 }} value={form.notes} onChange={(e) => update("notes", e.target.value)} /></label>
          </section>

          <section style={{ ...hero, marginTop: 18 }}>
            <div style={eyebrow}>VaultForge Intelligence</div>
            <h2 style={h2}>Your profile travels with requests.</h2>
            <p style={sub}>When you request deal or pain information, VaultForge attaches this buyer profile snapshot so members can evaluate whether to approve deeper access.</p>
            <div style={{ ...row, marginTop: 18 }}>
              <button type="submit" style={goldBtn}>Submit Investor Profile</button>
              <Link href="/investor-room" style={btn}>Investor Room</Link>
            </div>
            {notice ? <p style={{ ...sub, marginTop: 18 }}>{notice}</p> : null}
          </section>
        </form>
      </div>
    </main>
  );
}
