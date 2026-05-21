"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const INVESTOR_SESSION_KEY = "vaultforge_investor_session_v1";
const INVESTOR_LOGIN_KEY = "vaultforge_investor_login_v1";
const INVESTOR_APP_KEY = "vaultforge_investor_application_v1";
const INVESTOR_LIST_KEY = "vaultforge_investor_applications_v1";

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

function emailKey(value: string) {
  return String(value || "").trim().toLowerCase();
}

function saveInvestorLogin(email: string, password: string) {
  const cleanEmail = emailKey(email);
  const existing = readJson<any>(INVESTOR_APP_KEY, {});
  const now = new Date().toISOString();

  const login = {
    email: cleanEmail,
    passwordSet: Boolean(password),
    role: "investor",
    createdAt: existing.createdAt || now,
    updatedAt: now,
  };

  const app = {
    ...existing,
    email: cleanEmail,
    status: existing.status || "login_created",
    approvedForPayment: Boolean(existing.approvedForPayment),
    paymentStatus: existing.paymentStatus || "unpaid",
    accessStatus: existing.accessStatus || "profile_required",
    access: existing.access || "locked",
    investorSession: true,
    updatedAt: now,
    createdAt: existing.createdAt || now,
  };

  writeJson(INVESTOR_LOGIN_KEY, login);
  writeJson(INVESTOR_APP_KEY, app);
  writeJson(INVESTOR_SESSION_KEY, { email: cleanEmail, role: "investor", loggedIn: true, updatedAt: now });
  localStorage.setItem("vaultforge_investor_email", cleanEmail);

  const rows = readJson<any[]>(INVESTOR_LIST_KEY, []);
  const next = [app, ...rows.filter((row) => emailKey(row?.email) !== cleanEmail)];
  writeJson(INVESTOR_LIST_KEY, next);

  window.dispatchEvent(new Event("vaultforge-investor-change"));
}

const page: React.CSSProperties = {
  minHeight: "100vh",
  background: "#05070d",
  color: "#f7f7fb",
  padding: 18,
  fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
};

const wrap: React.CSSProperties = { maxWidth: 920, margin: "0 auto", paddingBottom: 90 };
const hero: React.CSSProperties = {
  border: "1px solid rgba(245,197,66,.28)",
  borderRadius: 30,
  padding: 30,
  marginBottom: 20,
  background: "radial-gradient(circle at top right, rgba(245,197,66,.16), transparent 34%), linear-gradient(180deg,#080d19,#050816)",
};
const panel: React.CSSProperties = { background: "#121724", border: "1px solid rgba(207,216,230,.16)", borderRadius: 24, padding: 22 };
const row: React.CSSProperties = { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" };
const eyebrow: React.CSSProperties = { color: "#ffd45a", textTransform: "uppercase", letterSpacing: 6, fontWeight: 950, fontSize: 13, marginBottom: 12 };
const h1: React.CSSProperties = { fontSize: "clamp(42px,7vw,78px)", lineHeight: .9, letterSpacing: -4, margin: "0 0 18px", fontWeight: 950 };
const sub: React.CSSProperties = { color: "#c9d0dc", fontSize: 20, lineHeight: 1.35, margin: 0 };
const muted: React.CSSProperties = { color: "#aeb7c7", margin: "8px 0 0", lineHeight: 1.4 };
const btn: React.CSSProperties = { border: "1px solid rgba(207,216,230,.18)", background: "#171c29", color: "#f7f7fb", borderRadius: 999, padding: "13px 18px", fontWeight: 950, textDecoration: "none", display: "inline-block", cursor: "pointer" };
const goldBtn: React.CSSProperties = { ...btn, border: 0, background: "#ffdc68", color: "#10131a" };
const input: React.CSSProperties = { width: "100%", boxSizing: "border-box", border: "1px solid rgba(207,216,230,.18)", background: "#111823", color: "#f8fafc", borderRadius: 16, padding: "14px 15px", fontSize: 16 };
const field: React.CSSProperties = { display: "grid", gap: 8, marginTop: 14 };

export default function InvestorLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [notice, setNotice] = useState("");
  const [sessionEmail, setSessionEmail] = useState("");

  useEffect(() => {
    const session = readJson<any>(INVESTOR_SESSION_KEY, {});
    setSessionEmail(session?.email || "");
  }, []);

  function submit(event: React.FormEvent) {
    event.preventDefault();

    if (!email.trim()) {
      setNotice("Enter investor email.");
      return;
    }

    if (!password.trim() || password !== confirm) {
      setNotice("Passwords must match.");
      return;
    }

    saveInvestorLogin(email, password);
    setSessionEmail(emailKey(email));
    setNotice("Investor login created. Next step: complete investor buyer profile.");
  }

  function logoutInvestor() {
    localStorage.removeItem(INVESTOR_SESSION_KEY);
    localStorage.removeItem("vaultforge_investor_email");
    window.dispatchEvent(new Event("vaultforge-investor-change"));
    setSessionEmail("");
    setNotice("Investor logged out.");
  }

  return (
    <main style={page}>
      <div style={wrap}>
        <section style={hero}>
          <div style={eyebrow}>Investor Login</div>
          <h1 style={h1}>Create investor access.</h1>
          <p style={sub}>Investor access is separate from the private member network and requires profile approval before payment unlocks.</p>

          {sessionEmail ? (
            <div style={{ ...panel, marginTop: 18 }}>
              <div style={eyebrow}>Current Investor Session</div>
              <p style={sub}>{sessionEmail}</p>
              <div style={{ ...row, marginTop: 16 }}>
                <Link href="/investor-application" style={goldBtn}>Continue Profile</Link>
                <Link href="/investor-payment" style={btn}>Payment Gate</Link>
                <Link href="/investor-room" style={btn}>Investor Room</Link>
                <button type="button" style={btn} onClick={logoutInvestor}>Logout Investor</button>
              </div>
            </div>
          ) : null}

          <form onSubmit={submit} style={{ marginTop: 18 }}>
            <label style={field}><span style={eyebrow}>Investor Email</span><input style={input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
            <label style={field}><span style={eyebrow}>Password</span><input style={input} type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
            <label style={field}><span style={eyebrow}>Confirm Password</span><input style={input} type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} /></label>

            <div style={{ ...row, marginTop: 18 }}>
              <button type="submit" style={goldBtn}>Make Investor Login</button>
              <Link href="/investor-application" style={btn}>Investor Profile</Link>
              <Link href="/investor-access" style={btn}>Back</Link>
            </div>
          </form>

          <div style={{ ...panel, marginTop: 18 }}>
            <div style={eyebrow}>Forgot / Reset Password</div>
            <p style={muted}>Reset password will be connected during real auth hardening. For now, create/login is local investor testing flow.</p>
          </div>

          {notice ? <p style={{ ...sub, marginTop: 18 }}>{notice}</p> : null}
        </section>
      </div>
    </main>
  );
}
