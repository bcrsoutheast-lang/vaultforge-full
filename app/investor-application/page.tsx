"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

const INVESTOR_APP_KEY = "vaultforge_investor_application_v1";
const INVESTOR_QUEUE_KEY = "vaultforge_admin_profile_approval_queue_v1";
const MOCK_APPROVALS_KEY = "vaultforge_mock_access_approvals_v1";

function clean(value: unknown, fallback = "") {
  const text = String(value || "").trim();
  return text || fallback;
}

function lower(value: unknown) {
  return clean(value).toLowerCase();
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
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

const page: React.CSSProperties = {
  minHeight: "100vh",
  background: "#05070d",
  color: "#f7f7fb",
  padding: 18,
  fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
};

const wrap: React.CSSProperties = { maxWidth: 1040, margin: "0 auto", paddingBottom: 90 };
const hero: React.CSSProperties = {
  border: "1px solid rgba(245,197,66,.28)",
  borderRadius: 30,
  padding: 30,
  marginBottom: 20,
  background: "radial-gradient(circle at top right, rgba(245,197,66,.16), transparent 34%), linear-gradient(180deg,#080d19,#050816)",
};
const panel: React.CSSProperties = { background: "#121724", border: "1px solid rgba(207,216,230,.16)", borderRadius: 24, padding: 22 };
const goldPanel: React.CSSProperties = { ...panel, borderColor: "rgba(245,197,66,.55)", boxShadow: "0 0 28px rgba(245,197,66,.12)" };
const eyebrow: React.CSSProperties = { color: "#ffd45a", textTransform: "uppercase", letterSpacing: 6, fontWeight: 950, fontSize: 13, marginBottom: 12 };
const h1: React.CSSProperties = { fontSize: "clamp(42px,7vw,72px)", lineHeight: .95, letterSpacing: -3, margin: "0 0 18px", fontWeight: 950 };
const h2: React.CSSProperties = { fontSize: "clamp(28px,5vw,48px)", lineHeight: 1, letterSpacing: -2, margin: "0 0 14px", fontWeight: 950 };
const sub: React.CSSProperties = { color: "#c9d0dc", fontSize: 20, lineHeight: 1.35, margin: 0 };
const muted: React.CSSProperties = { color: "#aeb7c7", margin: "8px 0 0", lineHeight: 1.4 };
const grid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 16 };
const row: React.CSSProperties = { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginTop: 18 };
const input: React.CSSProperties = { width: "100%", boxSizing: "border-box", border: "1px solid rgba(207,216,230,.18)", background: "#111823", color: "#f8fafc", borderRadius: 16, padding: "14px 15px", fontSize: 16 };
const btn: React.CSSProperties = { border: "1px solid rgba(207,216,230,.18)", background: "#171c29", color: "#f7f7fb", borderRadius: 999, padding: "13px 18px", fontWeight: 950, textDecoration: "none", display: "inline-block", cursor: "pointer" };
const goldBtn: React.CSSProperties = { ...btn, border: 0, background: "#ffdc68", color: "#10131a" };

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return (
    <label style={{ display: "grid", gap: 8 }}>
      <span style={eyebrow}>{label}</span>
      <input style={input} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder || label} />
    </label>
  );
}

function TextArea({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return (
    <label style={{ display: "grid", gap: 8 }}>
      <span style={eyebrow}>{label}</span>
      <textarea style={{ ...input, minHeight: 130 }} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder || label} />
    </label>
  );
}

export default function InvestorApplicationPage() {
  const existing = useMemo(() => readJson<any>(INVESTOR_APP_KEY, {}), []);
  const [form, setForm] = useState<any>({
    contactName: existing.contactName || existing.name || "",
    company: existing.company || "",
    email: existing.email || existing.investorEmail || (typeof window !== "undefined" ? localStorage.getItem("vaultforge_investor_email") || "" : ""),
    phone: existing.phone || "",
    statesInterested: Array.isArray(existing.statesInterested) ? existing.statesInterested.join(", ") : existing.statesInterested || "GA",
    investorTypes: Array.isArray(existing.investorTypes) ? existing.investorTypes.join(", ") : existing.investorTypes || "",
    buyingStrategies: Array.isArray(existing.buyingStrategies) ? existing.buyingStrategies.join(", ") : existing.buyingStrategies || "",
    minDeal: existing.minDeal || "",
    maxDeal: existing.maxDeal || "",
    proofFunds: existing.proofFunds || "",
    closeSpeed: existing.closeSpeed || "",
    notes: existing.notes || "",
    profilePhoto: existing.profilePhoto || "",
    companyLogo: existing.companyLogo || "",
  });
  const [banner, setBanner] = useState("");

  function update(key: string, value: string) {
    setForm((current: any) => ({ ...current, [key]: value }));
  }


  function uploadFile(key: string, file?: File | null) {
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      setForm((current: any) => ({
        ...current,
        [key]: String(reader.result || ""),
      }));
    };

    reader.readAsDataURL(file);
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();

    const email = lower(form.email);
    const now = new Date().toISOString();
    const profile = {
      ...form,
      email,
      investorEmail: email,
      name: form.contactName,
      statesInterested: String(form.statesInterested || "").split(",").map((x) => x.trim()).filter(Boolean),
      investorTypes: String(form.investorTypes || "").split(",").map((x) => x.trim()).filter(Boolean),
      buyingStrategies: String(form.buyingStrategies || "").split(",").map((x) => x.trim()).filter(Boolean),
      status: "pending_admin_approval",
      accessStatus: "pending_admin_approval",
      paymentStatus: "unpaid",
      submittedAt: now,
      updatedAt: now,
    };

    writeJson(INVESTOR_APP_KEY, profile);
    localStorage.setItem("vaultforge_investor_email", email);
    localStorage.setItem("vf_email", email);

    const queue = readJson<any[]>(INVESTOR_QUEUE_KEY, []);
    const row = {
      id: `investor-profile-${email || Date.now()}`,
      type: "investor",
      status: "pending_admin_approval",
      title: `${form.contactName || "Investor"} Profile Approval`,
      email,
      name: form.contactName,
      company: form.company,
      profile,
      createdAt: now,
      updatedAt: now,
    };
    writeJson(INVESTOR_QUEUE_KEY, [row, ...queue.filter((item) => String(item?.id || "") !== row.id && String(item?.email || "").toLowerCase() !== email)]);

    const approvals = readJson<Record<string, any>>(MOCK_APPROVALS_KEY, {});
    approvals[`investor:${email}`] = {
      ...(approvals[`investor:${email}`] || {}),
      email,
      kind: "investor",
      submitted: true,
      approved: Boolean(approvals[`investor:${email}`]?.approved),
      adminApproved: Boolean(approvals[`investor:${email}`]?.adminApproved),
      paymentStatus: approvals[`investor:${email}`]?.paymentStatus || "unpaid",
      accessStatus: approvals[`investor:${email}`]?.accessStatus || "pending_admin_approval",
      updatedAt: now,
    };
    writeJson(MOCK_APPROVALS_KEY, approvals);

    window.dispatchEvent(new Event("vaultforge-admin-profile-queue-change"));
    window.dispatchEvent(new Event("vaultforge-investor-change"));
    window.dispatchEvent(new Event("vaultforge-mock-access-change"));

    const message = "Investor profile saved into the VaultForge investor intelligence network and admin review queue.";
    setBanner(message);
    window.alert(message);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <main style={page}>
      <div style={wrap}>
        {banner ? (
          <section style={goldPanel}>
            <div style={eyebrow}>Saved</div>
            <h2 style={h2}>{banner}</h2>
            <div style={row}>
              <Link href="/investor-room" style={goldBtn}>Preview Locked Investor Room</Link>
              <Link href="/create-login" style={btn}>Back To Login</Link>
            </div>
          </section>
        ) : null}

        <section style={hero}>
          <div style={eyebrow}>Investor Room Application</div>
          <h1 style={h1}>Submit investor profile.</h1>
          <p style={sub}>Build a real investor profile with strategies, capital, markets, proof of funds, profile photo, branding, and execution details. This routes into the VaultForge intelligence network and admin review queue.</p>
        </section>

        <form onSubmit={submit}>
          <section style={panel}>
            <div style={grid}>
              <Field label="Contact Name" value={form.contactName} onChange={(value) => update("contactName", value)} />
              <Field label="Company" value={form.company} onChange={(value) => update("company", value)} />
              <Field label="Email" value={form.email} onChange={(value) => update("email", value)} />
              <Field label="Phone" value={form.phone} onChange={(value) => update("phone", value)} />
              <Field label="States Interested" value={form.statesInterested} onChange={(value) => update("statesInterested", value)} placeholder="GA, TN, FL..." />
              <Field label="Investor Type" value={form.investorTypes} onChange={(value) => update("investorTypes", value)} placeholder="Cash buyer, lender, JV partner..." />
              <Field label="Buying Strategies" value={form.buyingStrategies} onChange={(value) => update("buyingStrategies", value)} placeholder="Flip, rental, land, commercial..." />
              <Field label="Min Deal" value={form.minDeal} onChange={(value) => update("minDeal", value)} />
              <Field label="Max Deal" value={form.maxDeal} onChange={(value) => update("maxDeal", value)} />
              <Field label="Proof / Capital" value={form.proofFunds} onChange={(value) => update("proofFunds", value)} />
              <Field label="Close Speed" value={form.closeSpeed} onChange={(value) => update("closeSpeed", value)} />


              <Field label="Preferred Asset Types" value={form.assetTypes || ""} onChange={(value) => update("assetTypes", value)} placeholder="SFR, multifamily, land, industrial..." />
              <Field label="Target Counties / Markets" value={form.targetCounties || ""} onChange={(value) => update("targetCounties", value)} placeholder="Fulton, Cobb, Gwinnett..." />
              <Field label="Funding Type" value={form.fundingType || ""} onChange={(value) => update("fundingType", value)} placeholder="Cash, hard money, JV, debt..." />
              <Field label="Monthly Deal Volume Goal" value={form.volumeGoal || ""} onChange={(value) => update("volumeGoal", value)} placeholder="2 deals/month..." />
            </div>


            <div style={{ marginTop: 22 }}>
              <div style={grid}>
                <label style={{ display: "grid", gap: 8 }}>
                  <span style={eyebrow}>Profile Photo</span>

                  {form.profilePhoto ? (
                    <img
                      src={form.profilePhoto}
                      alt="Profile"
                      style={{
                        width: 120,
                        height: 120,
                        objectFit: "cover",
                        borderRadius: 18,
                        border: "1px solid rgba(245,197,66,.35)",
                      }}
                    />
                  ) : null}

                  <input
                    type="file"
                    accept="image/*"
                    style={input}
                    onChange={(event) =>
                      uploadFile("profilePhoto", event.target.files?.[0])
                    }
                  />
                </label>

                <label style={{ display: "grid", gap: 8 }}>
                  <span style={eyebrow}>Company Logo</span>

                  {form.companyLogo ? (
                    <img
                      src={form.companyLogo}
                      alt="Logo"
                      style={{
                        width: 160,
                        height: 120,
                        objectFit: "contain",
                        background: "#0b1020",
                        borderRadius: 18,
                        border: "1px solid rgba(245,197,66,.35)",
                        padding: 12,
                      }}
                    />
                  ) : null}

                  <input
                    type="file"
                    accept="image/*"
                    style={input}
                    onChange={(event) =>
                      uploadFile("companyLogo", event.target.files?.[0])
                    }
                  />
                </label>
              </div>
            </div>


            <div style={{ marginTop: 16 }}>
              <TextArea label="Investor Notes" value={form.notes} onChange={(value) => update("notes", value)} placeholder="What do you want access to? What are you looking for? How do you move?" />
            </div>

            <div style={row}>
              <button type="submit" style={goldBtn}>Submit Investor Profile For Approval</button>
              <Link href="/investor-room" style={btn}>Preview Investor Room</Link>
              <Link href="/" style={btn}>Home</Link>
            </div>
          </section>
        </form>
      </div>
    </main>
  );
}