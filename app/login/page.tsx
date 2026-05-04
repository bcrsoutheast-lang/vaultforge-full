"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const shellStyle: React.CSSProperties = { minHeight: "100vh", background: "#071326", color: "white", padding: "36px 22px 80px", fontFamily: "Arial, sans-serif" };
const cardStyle: React.CSSProperties = { maxWidth: 520, margin: "0 auto", border: "1px solid rgba(255,255,255,.18)", background: "rgba(255,255,255,.04)", borderRadius: 28, padding: 28 };
const inputStyle: React.CSSProperties = { width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,.08)", color: "white", border: "1px solid rgba(255,255,255,.25)", borderRadius: 16, padding: "14px 16px", fontSize: 18, marginBottom: 14 };
const buttonStyle: React.CSSProperties = { border: 0, background: "#9df3bf", color: "#071326", borderRadius: 999, padding: "14px 18px", fontWeight: 900, cursor: "pointer", width: "100%", fontSize: 18 };

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("vf_email") || "";
    if (saved) setEmail(saved);
  }, []);

  async function login() {
    const cleanEmail = email.trim().toLowerCase();
    setStatus("");

    if (!cleanEmail || !cleanEmail.includes("@")) {
      setStatus("Enter a valid email.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/member/login", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-vf-email": cleanEmail },
        body: JSON.stringify({ email: cleanEmail }),
      });

      const data = await res.json();

      if (!res.ok || !data?.ok) {
        setStatus(data?.error || "Login failed. Try again.");
        setLoading(false);
        return;
      }

      window.localStorage.setItem("vf_email", cleanEmail);
      window.sessionStorage.setItem("vf_email", cleanEmail);
      window.location.href = data.redirectTo || "/dashboard";
    } catch {
      setStatus("Login failed. Refresh and try again.");
      setLoading(false);
    }
  }

  return (
    <main style={shellStyle}>
      <section style={cardStyle}>
        <div style={{ textAlign: "center", marginBottom: 22 }}>
          <img src="/vaultforge-logo.png" alt="VaultForge" style={{ width: "100%", maxWidth: 340, borderRadius: 18 }} />
        </div>
        <p style={{ color: "#9df3bf", letterSpacing: 4, fontWeight: 900 }}>MEMBER LOGIN</p>
        <h1 style={{ fontSize: 46, lineHeight: 1, margin: "10px 0 18px" }}>Enter VaultForge</h1>
        <p style={{ color: "rgba(255,255,255,.72)", lineHeight: 1.5 }}>This login uses device storage, not fragile mobile cookies.</p>
        <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} inputMode="email" autoCapitalize="none" />
        <button onClick={login} disabled={loading} style={buttonStyle}>{loading ? "Logging in..." : "Login"}</button>
        {status && <p style={{ color: "#ffd0d0", marginTop: 16 }}>{status}</p>}
        <p style={{ color: "rgba(255,255,255,.55)", marginTop: 18 }}><Link href="/terms" style={{ color: "#9df3bf" }}>Terms & disclaimers</Link></p>
      </section>
    </main>
  );
}
