"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const PROFILE_KEY = "vaultforge_profile";
const LOGIN_KEY = "vaultforge_member_login_v1";

type AccessState = { email: string; approvedForPayment: boolean; paymentStatus: string; accessStatus: string; };

function readAccess(): AccessState {
  let profile: any = {};
  let login: any = {};
  try { profile = JSON.parse(localStorage.getItem(PROFILE_KEY) || "{}"); } catch { profile = {}; }
  try { login = JSON.parse(localStorage.getItem(LOGIN_KEY) || "{}"); } catch { login = {}; }
  return {
    email: profile.email || login.email || localStorage.getItem("vf_email") || "",
    approvedForPayment: Boolean(profile.approvedForPayment || login.approvedForPayment),
    paymentStatus: profile.paymentStatus || login.paymentStatus || "unpaid",
    accessStatus: profile.accessStatus || login.accessStatus || "profile_required",
  };
}

function markPaid() {
  const access = readAccess();
  let profile: any = {};
  let login: any = {};
  try { profile = JSON.parse(localStorage.getItem(PROFILE_KEY) || "{}"); } catch { profile = {}; }
  try { login = JSON.parse(localStorage.getItem(LOGIN_KEY) || "{}"); } catch { login = {}; }
  const patch = { paymentStatus: "paid", accessStatus: "active", paidAt: new Date().toISOString(), email: access.email };
  localStorage.setItem(PROFILE_KEY, JSON.stringify({ ...profile, ...patch }));
  localStorage.setItem(LOGIN_KEY, JSON.stringify({ ...login, ...patch }));
  window.dispatchEvent(new Event("vaultforge-access-change"));
}

const page: React.CSSProperties = { minHeight: "100vh", background: "#05070d", color: "#f7f7fb", padding: 18, fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" };
const wrap: React.CSSProperties = { maxWidth: 820, margin: "0 auto", paddingBottom: 80 };
const hero: React.CSSProperties = { border: "1px solid rgba(245,197,66,.28)", borderRadius: 30, padding: 30, marginBottom: 20, background: "linear-gradient(180deg,#080d19,#050816)" };
const locked: React.CSSProperties = { border: "1px solid rgba(255,70,70,.48)", borderRadius: 24, padding: 22, background: "#1c0e14", marginTop: 20 };
const open: React.CSSProperties = { border: "1px solid rgba(245,197,66,.48)", borderRadius: 24, padding: 22, background: "#171406", marginTop: 20 };
const eyebrow: React.CSSProperties = { color: "#ffd45a", textTransform: "uppercase", letterSpacing: 6, fontWeight: 950, fontSize: 13, marginBottom: 12 };
const h1: React.CSSProperties = { fontSize: "clamp(42px,7vw,76px)", lineHeight: 0.9, letterSpacing: -4, margin: "0 0 18px", fontWeight: 950 };
const sub: React.CSSProperties = { color: "#c9d0dc", fontSize: 20, lineHeight: 1.35, margin: 0 };
const row: React.CSSProperties = { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginTop: 18 };
const btn: React.CSSProperties = { border: "1px solid rgba(207,216,230,.18)", background: "#171c29", color: "#f7f7fb", borderRadius: 999, padding: "13px 18px", fontWeight: 950, textDecoration: "none", display: "inline-block", cursor: "pointer" };
const goldBtn: React.CSSProperties = { ...btn, border: 0, background: "#ffdc68", color: "#10131a" };

export default function PaymentPage() {
  const [access, setAccess] = useState<AccessState>({ email: "", approvedForPayment: false, paymentStatus: "unpaid", accessStatus: "profile_required" });

  useEffect(() => {
    setAccess(readAccess());
    const refresh = () => setAccess(readAccess());
    window.addEventListener("storage", refresh);
    window.addEventListener("vaultforge-access-change", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("vaultforge-access-change", refresh);
    };
  }, []);

  const paid = access.paymentStatus === "paid" || access.paymentStatus === "comped" || access.accessStatus === "active";
  const approved = access.approvedForPayment || paid;

  return (
    <main style={page}>
      <div style={wrap}>
        <section style={hero}>
          <div style={eyebrow}>VaultForge Payment Access</div>
          <h1 style={h1}>Activation gate.</h1>
          <p style={sub}>Profile must be approved by Admin Command before the payment button unlocks.</p>
          {!approved ? (
            <div style={locked}><div style={eyebrow}>Payment Locked</div><p style={sub}>Admin has not approved this profile for payment yet.</p><div style={row}><Link href="/profile" style={goldBtn}>Update Profile</Link><Link href="/contact-admin?topic=payment-approval" style={btn}>Contact Admin</Link><Link href="/command" style={btn}>Member Preview</Link></div></div>
          ) : paid ? (
            <div style={open}><div style={eyebrow}>Access Active</div><p style={sub}>Payment/access is active. Member area is unlocked.</p><div style={row}><Link href="/command" style={goldBtn}>Open Member Command</Link></div></div>
          ) : (
            <div style={open}><div style={eyebrow}>Payment Approved</div><p style={sub}>Admin approved payment access. Click below to activate. Stripe connection comes later.</p><div style={row}><button type="button" style={goldBtn} onClick={() => { markPaid(); setAccess(readAccess()); }}>Activate Paid Access</button><Link href="/command" style={btn}>Back to Preview</Link></div></div>
          )}
        </section>
      </div>
    </main>
  );
}
