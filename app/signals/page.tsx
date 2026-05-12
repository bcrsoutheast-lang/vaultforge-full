"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import VaultForgeMemberNav from "../components/VaultForgeMemberNav";

function clean(value: unknown) {
  return String(value || "").trim();
}

function cleanEmail(value: unknown) {
  return clean(value).toLowerCase();
}

function readCookie(name: string) {
  if (typeof document === "undefined") return "";

  const match = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));

  if (!match) return "";

  try {
    return decodeURIComponent(match.slice(name.length + 1));
  } catch {
    return match.slice(name.length + 1);
  }
}

function getEmail() {
  if (typeof window === "undefined") return "";

  const keys = ["vf_email", "vf_member_email", "vf_admin_email", "email", "memberEmail"];

  for (const key of keys) {
    const localValue = cleanEmail(window.localStorage.getItem(key));
    if (localValue.includes("@")) return localValue;

    const sessionValue = cleanEmail(window.sessionStorage.getItem(key));
    if (sessionValue.includes("@")) return sessionValue;
  }

  return cleanEmail(readCookie("vf_email") || readCookie("vf_member_email") || readCookie("vf_admin_email"));
}

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(232,196,107,.15), transparent 30%), radial-gradient(circle at 85% 10%, rgba(157,243,191,.10), transparent 28%), linear-gradient(180deg,#020303,#071326 55%,#020303)",
  color: "white",
  padding: "22px 16px 92px",
  fontFamily: "Arial, sans-serif",
};

const wrap: React.CSSProperties = {
  width: "min(1180px,100%)",
  margin: "0 auto",
};

const card: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.28)",
  borderRadius: 28,
  padding: 24,
  background: "rgba(255,255,255,.06)",
  marginBottom: 16,
  boxShadow: "0 24px 80px rgba(0,0,0,.28)",
};

const button: React.CSSProperties = {
  display: "inline-flex",
  justifyContent: "center",
  alignItems: "center",
  minHeight: 50,
  borderRadius: 999,
  padding: "12px 18px",
  border: 0,
  background: "linear-gradient(135deg,#f8e7b0,#e8c46b)",
  color: "#06100a",
  fontWeight: 950,
  textDecoration: "none",
};

const ghost: React.CSSProperties = {
  ...button,
  background: "rgba(255,255,255,.06)",
  border: "1px solid rgba(255,255,255,.16)",
  color: "white",
};

export default function SignalsPage() {
  const [email, setEmail] = useState("");

  useEffect(() => {
    setEmail(getEmail());
  }, []);

  return (
    <main style={page}>
      <style>{`
        a:hover {
          transform: translateY(-1px);
          transition: all .18s ease;
          filter: brightness(1.06);
        }

        @media (max-width: 760px) {
          .vf-actions {
            display: grid !important;
            grid-template-columns: 1fr !important;
            gap: 10px !important;
          }

          .vf-actions > * {
            width: 100%;
            box-sizing: border-box;
            justify-content: center;
          }
        }
      `}</style>

      <div style={wrap}>
        <VaultForgeMemberNav
          title="Signals"
          subtitle="Signal index, operational rooms, and routing intelligence."
          active="signals"
        />

        <section style={card}>
          <p
            style={{
              color: "#e8c46b",
              letterSpacing: ".18em",
              textTransform: "uppercase",
              fontWeight: 950,
              fontSize: 12,
            }}
          >
            VaultForge Signals
          </p>

          <h1
            style={{
              fontSize: "clamp(52px,10vw,92px)",
              lineHeight: 0.88,
              margin: "10px 0 18px",
              letterSpacing: "-.06em",
            }}
          >
            Signal command.
          </h1>

          <p style={{ color: "#cbd5e1", fontSize: 18, lineHeight: 1.5 }}>
            Open exact signal rooms from Pain Feed, Activity, Alerts, or Routing.
            This page is the safe signal index and command bridge.
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
            <span
              style={{
                border: "1px solid rgba(157,243,191,.22)",
                borderRadius: 999,
                padding: "7px 10px",
                color: "#9df3bf",
                background: "rgba(157,243,191,.07)",
                fontSize: 12,
                fontWeight: 850,
              }}
            >
              Signed in: {email || "unknown"}
            </span>
          </div>

          <div className="vf-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
            <Link href="/dashboard" style={button}>
              Dashboard
            </Link>
            <Link href="/pain-feed" style={ghost}>
              Pain Feed
            </Link>
            <Link href="/activity" style={ghost}>
              Activity
            </Link>
            <Link href="/routing-inbox" style={ghost}>
              Routing
            </Link>
            <Link href="/messages" style={ghost}>
              Messages
            </Link>
          </div>
        </section>

        <section style={card}>
          <h2 style={{ marginTop: 0 }}>How to use signals</h2>
          <p style={{ color: "#cbd5e1", fontSize: 18, lineHeight: 1.5 }}>
            Submit a Pain item or open a card from the feed. Each card opens its
            exact Signal Room at <strong>/signals/[signalId]</strong>.
          </p>
        </section>
      </div>
    </main>
  );
}
