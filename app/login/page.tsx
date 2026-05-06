"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(232,196,107,.16), transparent 32%), radial-gradient(circle at top right, rgba(157,243,191,.10), transparent 30%), linear-gradient(180deg, #030509 0%, #071326 55%, #030509 100%)",
  color: "white",
  fontFamily: "Arial, sans-serif",
  padding: "28px 18px 90px",
};

const wrap: React.CSSProperties = {
  maxWidth: 1040,
  margin: "0 auto",
};

const topBar: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 14,
  marginBottom: 30,
};

const navBtn: React.CSSProperties = {
  color: "white",
  textDecoration: "none",
  border: "1px solid rgba(255,255,255,.18)",
  borderRadius: 999,
  padding: "11px 16px",
  fontSize: 14,
  background: "rgba(255,255,255,.04)",
};

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
  gap: 20,
  alignItems: "stretch",
};

const card: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.14)",
  background:
    "linear-gradient(135deg, rgba(255,255,255,.08), rgba(255,255,255,.025))",
  borderRadius: 32,
  padding: 24,
  boxShadow: "0 24px 80px rgba(0,0,0,.38)",
};

const eyebrow: React.CSSProperties = {
  color: "#e8c46b",
  letterSpacing: 5,
  fontWeight: 900,
  fontSize: 12,
  marginBottom: 12,
};

const title: React.CSSProperties = {
  fontSize: "clamp(44px, 10vw, 84px)",
  lineHeight: .9,
  letterSpacing: -3,
  margin: "0 0 16px",
};

const muted: React.CSSProperties = {
  color: "rgba(255,255,255,.70)",
  lineHeight: 1.55,
  fontSize: 17,
};

const label: React.CSSProperties = {
  display: "block",
  color: "rgba(255,255,255,.86)",
  fontWeight: 900,
  marginBottom: 8,
  fontSize: 15,
};

const input: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  borderRadius: 18,
  border: "1px solid rgba(255,255,255,.18)",
  background: "rgba(255,255,255,.075)",
  color: "white",
  padding: "15px 15px",
  fontSize: 16,
  outline: "none",
  marginBottom: 14,
};

const primary: React.CSSProperties = {
  width: "100%",
  border: 0,
  borderRadius: 999,
  padding: "16px 22px",
  background: "linear-gradient(135deg, #f4d47b, #9df3bf)",
  color: "#06101e",
  fontWeight: 950,
  fontSize: 17,
  cursor: "pointer",
};

const ghost: React.CSSProperties = {
  width: "100%",
  border: "1px solid rgba(255,255,255,.22)",
  borderRadius: 999,
  padding: "16px 22px",
  background: "rgba(255,255,255,.04)",
  color: "white",
  fontWeight: 900,
  fontSize: 17,
  cursor: "pointer",
};

function cleanEmail(value: string) {
  return value.trim().toLowerCase();
}

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("created") === "1") {
      setMessage("Account created. Log in with your email and password.");
    }
  }, []);

  async function submit() {
    if (busy) return;

    setBusy(true);
    setError("");
    setMessage("");

    try {
      const endpoint = mode === "signup" ? "/api/member/signup" : "/api/member/login";
      const normalizedEmail = cleanEmail(email);

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: normalizedEmail,
          password,
          full_name: fullName,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || data?.details || "Authentication failed.");
      }

      window.localStorage.setItem("vf_email", normalizedEmail);
      window.sessionStorage.setItem("vf_email", normalizedEmail);
      window.localStorage.setItem("vf_member_login", "1");
      window.sessionStorage.setItem("vf_member_login", "1");

      setMessage(data?.message || "Success.");

      window.location.href = data?.redirect_to || "/dashboard";
    } catch (err: any) {
      setError(err?.message || "Could not sign in.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={page}>
      <div style={wrap}>
        <header style={topBar}>
          <Link href="/" style={{ color: "#e8c46b", fontWeight: 900, letterSpacing: 4, textDecoration: "none" }}>
            VAULTFORGE
          </Link>
          <div>
            <Link href="/" style={navBtn}>Home</Link>{" "}
            <Link href="/terms" style={navBtn}>Terms</Link>
          </div>
        </header>

        <section style={grid}>
          <div style={card}>
            <div style={eyebrow}>SECURE MEMBER ACCESS</div>
            <h1 style={title}>
              Enter the private command network.
            </h1>
            <p style={muted}>
              VaultForge access is moving to real Supabase Auth. This is step one of securing the platform:
              real accounts, verified sessions, profile gating, and payment unlock.
            </p>

            <div style={{
              border: "1px solid rgba(232,196,107,.24)",
              background: "rgba(232,196,107,.08)",
              borderRadius: 24,
              padding: 18,
              marginTop: 18,
            }}>
              <div style={eyebrow}>FOUNDING ACCESS</div>
              <p style={{ ...muted, margin: 0 }}>
                Founding Member Access is $49 for the first month, then renews at $149/month unless canceled before renewal.
              </p>
            </div>
          </div>

          <div style={card}>
            <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
              <button
                type="button"
                onClick={() => setMode("login")}
                style={mode === "login" ? primary : ghost}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => setMode("signup")}
                style={mode === "signup" ? primary : ghost}
              >
                Create Login
              </button>
            </div>

            {message && (
              <div style={{
                border: "1px solid rgba(157,243,191,.35)",
                background: "rgba(157,243,191,.08)",
                color: "#9df3bf",
                borderRadius: 18,
                padding: 14,
                marginBottom: 14,
                fontWeight: 900,
              }}>
                {message}
              </div>
            )}

            {error && (
              <div style={{
                border: "1px solid rgba(255,110,110,.35)",
                background: "rgba(255,110,110,.08)",
                color: "#ffd0d0",
                borderRadius: 18,
                padding: 14,
                marginBottom: 14,
                fontWeight: 900,
              }}>
                {error}
              </div>
            )}

            {mode === "signup" && (
              <>
                <label style={label}>Full Name</label>
                <input
                  style={input}
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="Your name"
                  autoComplete="name"
                />
              </>
            )}

            <label style={label}>Email</label>
            <input
              style={input}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              type="email"
              autoComplete="email"
            />

            <label style={label}>Password</label>
            <input
              style={input}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Minimum 6 characters"
              type="password"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              onKeyDown={(event) => {
                if (event.key === "Enter") submit();
              }}
            />

            <button type="button" onClick={submit} disabled={busy} style={{ ...primary, opacity: busy ? .65 : 1 }}>
              {busy ? "Working..." : mode === "signup" ? "Create Secure Login" : "Enter Members Area"}
            </button>

            <p style={{ ...muted, fontSize: 14, marginTop: 16 }}>
              After login, the next security step is profile completion, then payment activation, then full member unlock.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}