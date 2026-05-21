"use client";

import Link from "next/link";
import { useState } from "react";

const OWNER_EMAIL = "bcrsoutheast@gmail.com";
const LOGIN_KEY = "vaultforge_member_login_v1";
const PROFILE_KEY = "vaultforge_profile";

function clean(value: string) { return value.trim().toLowerCase(); }

function saveLogin(email: string, password: string) {
  const existingRaw = localStorage.getItem(PROFILE_KEY);
  let existing: any = {};
  try { existing = existingRaw ? JSON.parse(existingRaw) : {}; } catch { existing = {}; }

  const isOwner = clean(email) === OWNER_EMAIL;
  const patch = {
    email: clean(email),
    updatedAt: new Date().toISOString(),
    approvedForPayment: isOwner || Boolean(existing.approvedForPayment),
    paymentStatus: isOwner ? "comped" : existing.paymentStatus || "unpaid",
    accessStatus: isOwner ? "active" : existing.accessStatus || "profile_required",
    passwordSet: Boolean(password),
  };

  localStorage.setItem(LOGIN_KEY, JSON.stringify({ ...patch, createdAt: existing.createdAt || new Date().toISOString() }));
  localStorage.setItem("vf_email", clean(email));
  localStorage.setItem("member_email", clean(email));
  localStorage.setItem(PROFILE_KEY, JSON.stringify({ ...existing, ...patch }));
}

const page: React.CSSProperties = { minHeight: "100vh", background: "#05070d", color: "#f7f7fb", padding: 18, fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" };
const wrap: React.CSSProperties = { maxWidth: 720, margin: "0 auto", paddingBottom: 80 };
const hero: React.CSSProperties = { border: "1px solid rgba(245,197,66,.28)", borderRadius: 30, padding: 30, marginBottom: 20, background: "linear-gradient(180deg,#080d19,#050816)" };
const eyebrow: React.CSSProperties = { color: "#ffd45a", textTransform: "uppercase", letterSpacing: 6, fontWeight: 950, fontSize: 13, marginBottom: 12 };
const h1: React.CSSProperties = { fontSize: "clamp(42px,7vw,72px)", lineHeight: 0.9, letterSpacing: -4, margin: "0 0 18px", fontWeight: 950 };
const sub: React.CSSProperties = { color: "#c9d0dc", fontSize: 20, lineHeight: 1.35, margin: 0 };
const field: React.CSSProperties = { display: "grid", gap: 8, marginTop: 16 };
const input: React.CSSProperties = { width: "100%", boxSizing: "border-box", border: "1px solid rgba(207,216,230,.18)", background: "#111823", color: "#f8fafc", borderRadius: 16, padding: "14px 15px", fontSize: 16 };
const row: React.CSSProperties = { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginTop: 18 };
const btn: React.CSSProperties = { border: "1px solid rgba(207,216,230,.18)", background: "#171c29", color: "#f7f7fb", borderRadius: 999, padding: "13px 18px", fontWeight: 950, textDecoration: "none", display: "inline-block", cursor: "pointer" };
const goldBtn: React.CSSProperties = { ...btn, border: 0, background: "#ffdc68", color: "#10131a" };

export default function CreateLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [saved, setSaved] = useState(false);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!email.trim() || !password.trim()) return;
    saveLogin(email, password);
    setSaved(true);
  }

  return (
    <main style={page}>
      <div style={wrap}>
        <section style={hero}>
          <div style={eyebrow}>VaultForge Access</div>
          <h1 style={h1}>Create login.</h1>
          <p style={sub}>After login creation, complete your profile. Admin approval unlocks the payment button.</p>
          <form onSubmit={submit}>
            <label style={field}><span style={eyebrow}>Email</span><input style={input} value={email} onChange={(event) => setEmail(event.target.value)} placeholder="member@email.com" type="email" /></label>
            <label style={field}><span style={eyebrow}>Password</span><input style={input} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Create password" type="password" /></label>
            <div style={row}><button type="submit" style={goldBtn}>Create Login</button><Link href="/member-access" style={btn}>Back</Link></div>
          </form>
          {saved ? (
            <div style={{ marginTop: 22, border: "1px solid rgba(245,197,66,.36)", borderRadius: 20, padding: 18, background: "#111823" }}>
              <div style={eyebrow}>Login Saved</div>
              <p style={sub}>Next step: complete profile.</p>
              <div style={row}><Link href="/profile" style={goldBtn}>Complete Profile</Link><Link href="/command" style={btn}>Preview Member Area</Link></div>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
