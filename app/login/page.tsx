"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(181,92,255,.24), transparent 28%), radial-gradient(circle at top right, rgba(157,243,191,.18), transparent 24%), radial-gradient(circle at bottom right, rgba(232,196,107,.16), transparent 28%), linear-gradient(180deg,#02040a 0%,#071326 45%,#030509 100%)",
  color: "white",
  fontFamily: "Arial, sans-serif",
  padding: "28px 18px 90px",
};

const wrap: React.CSSProperties = {
  maxWidth: 1080,
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
  background: "linear-gradient(135deg, rgba(181,92,255,.18), rgba(255,255,255,.05))",
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
    try {
      localStorage.removeItem("test_email");
      localStorage.removeItem("demo_email");
      localStorage.removeItem("vf_demo_email");
      localStorage.removeItem("vf_test_email");

      const existing = localStorage.getItem("vf_email");

      if (existing && existing.toLowerCase() === "test@test.com") {
        localStorage.removeItem("vf_email");
        sessionStorage.removeItem("vf_email");
      }
    } catch {}

    const params = new URLSearchParams(window.location.search);

    if (params.get("created") === "1") {
      setMessage("Account created. Log in with your email and password.");
      setMode("login");
    }

    if (params.get("signup") === "1" || params.get("create") === "1") {
      setMode("signup");
    }
  }, []);

  async function submit() {
    if (busy) return;

    setBusy(true);
    setError("");
    setMessage("");

    try {
      const endpoint =
        mode === "signup"
          ? "/api/member/signup"
          : "/api/member/login";

      const normalizedEmail = cleanEmail(email);

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email: normalizedEmail,
          password,
          full_name: fullName.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data?.ok) {
        throw new Error(data?.error || "Authentication failed.");
      }

      const realEmail = cleanEmail(
        data?.email || normalizedEmail
      );

      localStorage.clear();
      sessionStorage.clear();

      localStorage.setItem("vf_email", realEmail);
      sessionStorage.setItem("vf_email", realEmail);

      localStorage.setItem("vf_member_login", "1");
      sessionStorage.setItem("vf_member_login", "1");

      if (data?.auth_user_id) {
        localStorage.setItem(
          "vf_auth_user_id",
          String(data.auth_user_id)
        );

        sessionStorage.setItem(
          "vf_auth_user_id",
          String(data.auth_user_id)
        );
      }

      setMessage("Authentication successful.");

      window.location.href = data?.redirect_to || "/dashboard";
    } catch (err: any) {
      setError(err?.message || "Could not authenticate.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={page}>
      <div style={wrap}>
        <header style={topBar}>
          <Link
            href="/"
            style={{
              color: "#e8c46b",
              fontWeight: 900,
              letterSpacing: 4,
              textDecoration: "none",
            }}
          >
            VAULTFORGE
          </Link>

          <div>
            <Link href="/" style={navBtn}>Home</Link>{" "}
            <Link href="/apply" style={navBtn}>Access</Link>
          </div>
        </header>

        <div
          style={{
            maxWidth: 520,
            margin: "0 auto",
            border: "1px solid rgba(255,255,255,.14)",
            borderRadius: 32,
            padding: 28,
            background:
              "linear-gradient(135deg, rgba(181,92,255,.18), rgba(157,243,191,.08), rgba(255,255,255,.03))",
          }}
        >
          <h1
            style={{
              fontSize: 44,
              marginBottom: 18,
            }}
          >
            {mode === "signup"
              ? "Create Member Access"
              : "Enter VaultForge"}
          </h1>

          {message && (
            <div
              style={{
                marginBottom: 14,
                padding: 14,
                borderRadius: 18,
                background: "rgba(157,243,191,.10)",
                border: "1px solid rgba(157,243,191,.24)",
                color: "#9df3bf",
              }}
            >
              {message}
            </div>
          )}

          {error && (
            <div
              style={{
                marginBottom: 14,
                padding: 14,
                borderRadius: 18,
                background: "rgba(255,110,110,.10)",
                border: "1px solid rgba(255,110,110,.24)",
                color: "#ffd0d0",
              }}
            >
              {error}
            </div>
          )}

          {mode === "signup" && (
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Full Name"
              style={{
                width: "100%",
                marginBottom: 14,
                padding: 16,
                borderRadius: 16,
                border: "1px solid rgba(255,255,255,.14)",
                background: "rgba(255,255,255,.06)",
                color: "white",
              }}
            />
          )}

          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            type="email"
            style={{
              width: "100%",
              marginBottom: 14,
              padding: 16,
              borderRadius: 16,
              border: "1px solid rgba(255,255,255,.14)",
              background: "rgba(255,255,255,.06)",
              color: "white",
            }}
          />

          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            type="password"
            style={{
              width: "100%",
              marginBottom: 18,
              padding: 16,
              borderRadius: 16,
              border: "1px solid rgba(255,255,255,.14)",
              background: "rgba(255,255,255,.06)",
              color: "white",
            }}
          />

          <button
            onClick={submit}
            disabled={busy}
            style={{
              width: "100%",
              border: 0,
              borderRadius: 999,
              padding: "16px 22px",
              background:
                "linear-gradient(135deg,#f5d978,#9df3bf 55%,#b55cff)",
              color: "#06101e",
              fontWeight: 900,
              cursor: "pointer",
            }}
          >
            {busy
              ? "Working..."
              : mode === "signup"
              ? "Create Access"
              : "Login"}
          </button>

          <button
            onClick={() =>
              setMode(mode === "login" ? "signup" : "login")
            }
            style={{
              width: "100%",
              marginTop: 12,
              borderRadius: 999,
              padding: "14px 18px",
              border: "1px solid rgba(255,255,255,.14)",
              background: "rgba(255,255,255,.06)",
              color: "white",
              cursor: "pointer",
            }}
          >
            {mode === "login"
              ? "Need an account?"
              : "Already have an account?"}
          </button>
        </div>
      </div>
    </main>
  );
}
