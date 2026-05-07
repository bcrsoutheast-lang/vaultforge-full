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

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
  gap: 20,
  alignItems: "stretch",
};

const card: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.14)",
  background:
    "linear-gradient(135deg, rgba(181,92,255,.18), rgba(157,243,191,.08), rgba(255,255,255,.03))",
  borderRadius: 32,
  padding: 24,
  boxShadow: "0 24px 80px rgba(0,0,0,.38)",
};

const goldCard: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.30)",
  background:
    "linear-gradient(145deg, rgba(232,196,107,.14), rgba(181,92,255,.10), rgba(255,255,255,.03))",
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
  textTransform: "uppercase",
};

const greenEyebrow: React.CSSProperties = {
  ...eyebrow,
  color: "#9df3bf",
};

const title: React.CSSProperties = {
  fontSize: "clamp(44px, 10vw, 84px)",
  lineHeight: 0.9,
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
  background: "linear-gradient(135deg,#f5d978,#9df3bf 55%,#b55cff)",
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
  background: "linear-gradient(135deg, rgba(181,92,255,.18), rgba(255,255,255,.05))",
  color: "white",
  fontWeight: 900,
  fontSize: 17,
  cursor: "pointer",
};

const linkButton: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  color: "white",
  textDecoration: "none",
  border: "1px solid rgba(255,255,255,.18)",
  borderRadius: 999,
  padding: "13px 18px",
  fontWeight: 900,
  background: "linear-gradient(135deg, rgba(181,92,255,.18), rgba(255,255,255,.05))",
  margin: "8px 8px 0 0",
};

const stepGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))",
  gap: 12,
  marginTop: 18,
};

const stepCard: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.12)",
  background: "linear-gradient(145deg, rgba(0,0,0,.28), rgba(181,92,255,.08))",
  borderRadius: 20,
  padding: 16,
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
      const endpoint = mode === "signup" ? "/api/member/signup" : "/api/member/login";
      const normalizedEmail = cleanEmail(email);

      if (!normalizedEmail || !normalizedEmail.includes("@")) {
        throw new Error("Enter a valid email.");
      }

      if (!password || password.length < 6) {
        throw new Error("Password must be at least 6 characters.");
      }

      if (mode === "signup" && !fullName.trim()) {
        throw new Error("Enter your full name.");
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: normalizedEmail,
          password,
          full_name: fullName.trim(),
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

      if (mode === "signup") {
        window.location.href = data?.redirect_to || "/profile";
        return;
      }

      window.location.href = data?.redirect_to || "/dashboard";
    } catch (err: any) {
      setError(err?.message || "Could not sign in.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={page}>
      <style>{`
        a:hover,
        button:hover {
          transform: translateY(-1px);
          transition: all .18s ease;
          filter: brightness(1.06);
        }

        input:focus {
          border-color: rgba(181,92,255,.45);
          box-shadow: 0 0 0 3px rgba(181,92,255,.14);
        }

        @media (max-width: 760px) {
          a,
          button,
          input {
            box-sizing: border-box;
          }
        }
      `}</style>
      <style>{`
        @media (max-width: 760px) {
          .vf-login-actions {
            display: grid !important;
            grid-template-columns: 1fr !important;
            gap: 10px !important;
          }

          .vf-login-actions > * {
            width: 100%;
            margin: 0 !important;
            box-sizing: border-box;
          }
        }
      `}</style>

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
            <Link href="/apply" style={navBtn}>Access</Link>{" "}
            <Link href="/terms" style={navBtn}>Terms</Link>
          </div>
        </header>

        <section style={grid}>
          <div style={goldCard}>
            <div style={greenEyebrow}>MEMBER ACCESS FLOW</div>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 10,
                marginBottom: 16,
              }}
            >
              <span
                style={{
                  border: "1px solid rgba(181,92,255,.36)",
                  color: "#dcb8ff",
                  borderRadius: 999,
                  padding: "9px 13px",
                  fontWeight: 900,
                  background: "rgba(181,92,255,.12)",
                }}
              >
                AI Routing Access
              </span>

              <span
                style={{
                  border: "1px solid rgba(157,243,191,.36)",
                  color: "#9df3bf",
                  borderRadius: 999,
                  padding: "9px 13px",
                  fontWeight: 900,
                  background: "rgba(157,243,191,.10)",
                }}
              >
                Founder Intelligence Network
              </span>

              <span
                style={{
                  border: "1px solid rgba(245,217,120,.36)",
                  color: "#f5d978",
                  borderRadius: 999,
                  padding: "9px 13px",
                  fontWeight: 900,
                  background: "rgba(245,217,120,.10)",
                }}
              >
                Bloomberg-Style Login
              </span>
            </div>

            <h1 style={title}>
              Create access first. Then train your AI profile.
            </h1>

            <p style={{ ...muted, fontSize: 19 }}>
              VaultForge profiles should be built after account creation. Your login connects your profile,
              markets, buy box, needs, provider abilities, smart alerts, and future payment status to one member record.
            </p>

            <div style={stepGrid}>
              <div style={stepCard}>
                <div style={greenEyebrow}>STEP 1</div>
                <strong>Create Login</strong>
                <p style={{ ...muted, marginBottom: 0, fontSize: 14 }}>
                  Start with email, password, and name.
                </p>
              </div>

              <div style={stepCard}>
                <div style={greenEyebrow}>STEP 2</div>
                <strong>Train Profile</strong>
                <p style={{ ...muted, marginBottom: 0, fontSize: 14 }}>
                  Add markets, roles, buy box, strategy, and alerts.
                </p>
              </div>

              <div style={stepCard}>
                <div style={greenEyebrow}>STEP 3</div>
                <strong>Unlock Access</strong>
                <p style={{ ...muted, marginBottom: 0, fontSize: 14 }}>
                  Payment unlocks full access when Stripe goes live.
                </p>
              </div>
            </div>

            <div
              style={{
                border: "1px solid rgba(232,196,107,.24)",
                background: "rgba(232,196,107,.08)",
                borderRadius: 24,
                padding: 18,
                marginTop: 18,
              }}
            >
              <div style={eyebrow}>FOUNDING ACCESS</div>
              <p style={{ ...muted, margin: 0 }}>
                First 50 founders or May 15 — whichever comes first. Founding access is
                <strong style={{ color: "#9df3bf" }}> $49 for the first month</strong>, then
                <strong style={{ color: "#e8c46b" }}> $199/month</strong>. After that, standard access is
                <strong style={{ color: "#e8c46b" }}> $99 to join</strong>, then
                <strong style={{ color: "#e8c46b" }}> $199/month</strong>.
              </p>
            </div>

            <div className="vf-login-actions" style={{ marginTop: 16 }}>
              <Link href="/apply" style={linkButton}>Back To Access Page</Link>
              <Link href="/dashboard" style={linkButton}>Preview Command Center</Link>
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
              <div
                style={{
                  border: "1px solid rgba(157,243,191,.35)",
                  background: "rgba(157,243,191,.08)",
                  color: "#9df3bf",
                  borderRadius: 18,
                  padding: 14,
                  marginBottom: 14,
                  fontWeight: 900,
                }}
              >
                {message}
              </div>
            )}

            {error && (
              <div
                style={{
                  border: "1px solid rgba(255,110,110,.35)",
                  background: "rgba(255,110,110,.08)",
                  color: "#ffd0d0",
                  borderRadius: 18,
                  padding: 14,
                  marginBottom: 14,
                  fontWeight: 900,
                }}
              >
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

            <button
              type="button"
              onClick={submit}
              disabled={busy}
              style={{ ...primary, opacity: busy ? 0.65 : 1 }}
            >
              {busy
                ? "Working..."
                : mode === "signup"
                ? "Create Member Access"
                : "Enter Member Command Center"}
            </button>

            <p style={{ ...muted, fontSize: 14, marginTop: 16 }}>
              After signup, go to Profile to train the AI routing engine. After profile completion,
              payment activation unlocks full member access when Stripe is connected.
            </p>

            <div className="vf-login-actions" style={{ marginTop: 16 }}>
              <Link href="/profile" style={linkButton}>Profile After Login</Link>
              <Link href="/payment" style={linkButton}>Payment Step</Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}