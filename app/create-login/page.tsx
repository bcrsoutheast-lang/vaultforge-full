"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

const OWNER_EMAIL = "bcrsoutheast@gmail.com";
const MEMBER_LOGIN_KEY = "vaultforge_member_login_v1";
const MEMBER_PROFILE_KEY = "vaultforge_profile";
const INVESTOR_LOGIN_KEY = "vaultforge_investor_login_v1";
const INVESTOR_SESSION_KEY = "vaultforge_investor_session_v1";
const INVESTOR_APP_KEY = "vaultforge_investor_application_v1";
const MOCK_APPROVALS_KEY = "vaultforge_mock_access_approvals_v1";

type AccessType = "member" | "investor";

function clean(value: string) {
  return value.trim().toLowerCase();
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

function setMockAccessRecord(email: string, kind: AccessType, patch: any) {
  const approvals = readJson<Record<string, any>>(MOCK_APPROVALS_KEY, {});
  const key = `${kind}:${clean(email)}`;
  approvals[key] = { ...(approvals[key] || {}), ...patch, updatedAt: new Date().toISOString() };
  writeJson(MOCK_APPROVALS_KEY, approvals);
  window.dispatchEvent(new Event("vaultforge-mock-access-change"));
  window.dispatchEvent(new Event("vaultforge-access-change"));
}

function saveMemberLogin(email: string, password: string) {
  const existing = readJson<any>(MEMBER_PROFILE_KEY, {});
  const isOwner = clean(email) === OWNER_EMAIL;

  const patch = {
    email: clean(email),
    updatedAt: new Date().toISOString(),
    approvedForPayment: isOwner || Boolean(existing.approvedForPayment),
    paymentStatus: isOwner ? "comped" : existing.paymentStatus || "unpaid",
    accessStatus: isOwner ? "active" : existing.accessStatus || "profile_required",
    passwordSet: Boolean(password),
    accountType: "member",
  };

  writeJson(MEMBER_LOGIN_KEY, { ...patch, createdAt: existing.createdAt || new Date().toISOString() });
  localStorage.setItem("vf_email", clean(email));
  localStorage.setItem("member_email", clean(email));
  localStorage.setItem("email", clean(email));
  writeJson(MEMBER_PROFILE_KEY, { ...existing, ...patch });

  setMockAccessRecord(clean(email), "member", {
    approved: isOwner,
    adminApproved: isOwner,
    paid: isOwner,
    unlocked: isOwner,
    paymentStatus: isOwner ? "paid" : "unpaid",
    accessStatus: isOwner ? "active" : "profile_required",
  });
}

function saveInvestorLogin(email: string, password: string) {
  const existing = readJson<any>(INVESTOR_APP_KEY, {});
  const isOwner = clean(email) === OWNER_EMAIL;

  const patch = {
    email: clean(email),
    investorEmail: clean(email),
    updatedAt: new Date().toISOString(),
    approvedForPayment: isOwner || Boolean(existing.approvedForPayment),
    paymentStatus: isOwner ? "comped" : existing.paymentStatus || "unpaid",
    accessStatus: isOwner ? "active" : existing.accessStatus || "profile_required",
    passwordSet: Boolean(password),
    accountType: "investor",
  };

  writeJson(INVESTOR_LOGIN_KEY, { ...patch, createdAt: existing.createdAt || new Date().toISOString() });
  writeJson(INVESTOR_SESSION_KEY, { ...patch, createdAt: existing.createdAt || new Date().toISOString() });
  writeJson(INVESTOR_APP_KEY, { ...existing, ...patch });
  localStorage.setItem("vaultforge_investor_email", clean(email));
  localStorage.setItem("vf_email", clean(email));

  setMockAccessRecord(clean(email), "investor", {
    approved: isOwner,
    adminApproved: isOwner,
    paid: isOwner,
    unlocked: isOwner,
    paymentStatus: isOwner ? "paid" : "unpaid",
    accessStatus: isOwner ? "active" : "profile_required",
  });
}

function saveLogin(type: AccessType, email: string, password: string) {
  if (type === "member") saveMemberLogin(email, password);
  else saveInvestorLogin(email, password);
}

const page: React.CSSProperties = { minHeight: "100vh", background: "#05070d", color: "#f7f7fb", padding: 18, fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" };
const wrap: React.CSSProperties = { maxWidth: 980, margin: "0 auto", paddingBottom: 80 };
const hero: React.CSSProperties = { border: "1px solid rgba(245,197,66,.28)", borderRadius: 30, padding: 30, marginBottom: 20, background: "radial-gradient(circle at top right, rgba(245,197,66,.15), transparent 34%), linear-gradient(180deg,#080d19,#050816)" };
const panel: React.CSSProperties = { background: "#121724", border: "1px solid rgba(207,216,230,.16)", borderRadius: 24, padding: 22 };
const goldPanel: React.CSSProperties = { ...panel, borderColor: "rgba(245,197,66,.55)", boxShadow: "0 0 28px rgba(245,197,66,.12)" };
const eyebrow: React.CSSProperties = { color: "#ffd45a", textTransform: "uppercase", letterSpacing: 6, fontWeight: 950, fontSize: 13, marginBottom: 12 };
const h1: React.CSSProperties = { fontSize: "clamp(42px,7vw,72px)", lineHeight: 0.95, letterSpacing: -3, margin: "0 0 18px", fontWeight: 950 };
const h2: React.CSSProperties = { fontSize: "clamp(28px,5vw,46px)", lineHeight: 1, letterSpacing: -2, margin: "0 0 14px", fontWeight: 950 };
const h3: React.CSSProperties = { fontSize: 24, margin: "0 0 10px", fontWeight: 950 };
const sub: React.CSSProperties = { color: "#c9d0dc", fontSize: 20, lineHeight: 1.35, margin: 0 };
const muted: React.CSSProperties = { color: "#aeb7c7", margin: "8px 0 0", lineHeight: 1.4 };
const field: React.CSSProperties = { display: "grid", gap: 8, marginTop: 16 };
const input: React.CSSProperties = { width: "100%", boxSizing: "border-box", border: "1px solid rgba(207,216,230,.18)", background: "#111823", color: "#f8fafc", borderRadius: 16, padding: "14px 15px", fontSize: 16 };
const row: React.CSSProperties = { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginTop: 18 };
const grid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 16 };
const btn: React.CSSProperties = { border: "1px solid rgba(207,216,230,.18)", background: "#171c29", color: "#f7f7fb", borderRadius: 999, padding: "13px 18px", fontWeight: 950, textDecoration: "none", display: "inline-block", cursor: "pointer" };
const goldBtn: React.CSSProperties = { ...btn, border: 0, background: "#ffdc68", color: "#10131a" };

function AccessCard({ type, active, title, note, price, onClick }: { type: AccessType; active: boolean; title: string; note: string; price: string; onClick: () => void }) {
  return (
    <button type="button" style={{ ...(active ? goldPanel : panel), textAlign: "left", cursor: "pointer", width: "100%" }} onClick={onClick}>
      <div style={eyebrow}>{type === "member" ? "Private Member" : "Investor Room"}</div>
      <h3 style={h3}>{title}</h3>
      <p style={muted}>{note}</p>
      <p style={{ ...muted, color: "#ffd45a", fontWeight: 950 }}>{price}</p>
    </button>
  );
}

export default function CreateLoginPage() {
  const [type, setType] = useState<AccessType>("member");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [savedType, setSavedType] = useState<AccessType | null>(null);
  const [error, setError] = useState("");

  const loginHref = type === "member" ? "/login" : "/investor-login";

  const selectedCopy = useMemo(() => {
    if (type === "member") {
      return {
        title: "Create private member login.",
        note: "Members complete a profile, land in locked member preview, wait for admin approval, then the payment button lights up.",
        price: "Member founder lane: $49 activation, $49 second month, then $299/month.",
      };
    }

    return {
      title: "Create Investor Room login.",
      note: "Investors complete an investor profile, land in locked Investor Room preview, wait for admin approval, then mock/Stripe payment unlocks the room.",
      price: "Investor Room: $79 first month, then $149/month.",
    };
  }, [type]);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Email and password are required.");
      return;
    }

    if (password.trim().length < 6) {
      setError("Password needs at least 6 characters for testing.");
      return;
    }

    saveLogin(type, email, password);
    setSavedType(type);
  }

  return (
    <main style={page}>
      <div style={wrap}>
        <section style={hero}>
          <div style={eyebrow}>VaultForge Access</div>
          <h1 style={h1}>Create login.</h1>
          <p style={sub}>Choose Member or Investor Room. Create login/password, complete the right profile, preview the locked room, wait for admin approval, then the payment button lights up.</p>

          <div style={{ ...grid, marginTop: 22 }}>
            <AccessCard type="member" active={type === "member"} title="Private Members Site" note="For operators, buyers, lenders, contractors, title, insurance, wholesalers, capital partners, and execution members." price="Founder member access starts at $49." onClick={() => { setType("member"); setSavedType(null); }} />
            <AccessCard type="investor" active={type === "investor"} title="Investor Room" note="For investors who want controlled access to Deal Opportunities, Pain Signals, requests, and routed execution without seeing the private directory." price="$79 first month, then $149/month." onClick={() => { setType("investor"); setSavedType(null); }} />
          </div>

          <form onSubmit={submit} style={{ marginTop: 24 }}>
            <div style={goldPanel}>
              <div style={eyebrow}>{selectedCopy.title}</div>
              <p style={sub}>{selectedCopy.note}</p>
              <p style={muted}>{selectedCopy.price}</p>

              <label style={field}>
                <span style={eyebrow}>Email</span>
                <input style={input} value={email} onChange={(event) => setEmail(event.target.value)} placeholder={type === "member" ? "member@email.com" : "investor@email.com"} type="email" />
              </label>

              <label style={field}>
                <span style={eyebrow}>Password</span>
                <input style={input} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Create password" type="password" />
              </label>

              {error ? <p style={{ ...muted, color: "#ffaaaa" }}>{error}</p> : null}

              <div style={row}>
                <button type="submit" style={goldBtn}>Create {type === "member" ? "Member" : "Investor"} Login</button>
                <Link href="/" style={btn}>Back Home</Link>
                <Link href={loginHref} style={btn}>{type === "member" ? "Members Login" : "Investor Room Login"}</Link>
              </div>
            </div>
          </form>

          {savedType ? (
            <div style={{ marginTop: 22, border: "1px solid rgba(245,197,66,.36)", borderRadius: 20, padding: 18, background: "#111823" }}>
              <div style={eyebrow}>{savedType === "member" ? "Member Login Saved" : "Investor Login Saved"}</div>
              <h2 style={h2}>Next step: complete profile.</h2>
              <p style={sub}>After profile submission, admin can approve it. Then the payment button lights up and the room unlocks after mock/real payment.</p>
              <div style={row}>
                <Link href={savedType === "member" ? "/profile" : "/investor-application"} style={goldBtn}>Complete {savedType === "member" ? "Member Profile" : "Investor Profile"}</Link>
                <Link href={savedType === "member" ? "/member-controlled-threads" : "/investor-room"} style={btn}>Preview Locked {savedType === "member" ? "Member Room" : "Investor Room"}</Link>
              </div>
            </div>
          ) : null}

          <section style={{ ...panel, marginTop: 22 }}>
            <div style={eyebrow}>Test Flow</div>
            <p style={muted}>1. Create login/password.</p>
            <p style={muted}>2. Complete profile.</p>
            <p style={muted}>3. Admin approves profile.</p>
            <p style={muted}>4. Payment button pulses.</p>
            <p style={muted}>5. Mock Pay unlocks room.</p>
            <p style={muted}>This is local test mode. It does not touch real Stripe, middleware, or Supabase auth.</p>
          </section>
        </section>
      </div>
    </main>
  );
}
