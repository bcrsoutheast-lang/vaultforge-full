"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const OWNER_EMAIL = "bcrsoutheast@gmail.com";

type CookieMap = Record<string, string>;

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(232,196,107,.18), transparent 28%), radial-gradient(circle at top right, rgba(157,243,191,.13), transparent 25%), radial-gradient(circle at bottom right, rgba(181,92,255,.18), transparent 28%), linear-gradient(180deg,#02040a 0%,#071326 48%,#030509 100%)",
  color: "white",
  padding: "28px 18px 100px",
  fontFamily: "Arial, sans-serif",
};

const wrap: React.CSSProperties = { maxWidth: 1120, margin: "0 auto" };

const hero: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.34)",
  background:
    "linear-gradient(145deg, rgba(232,196,107,.12), rgba(181,92,255,.10), rgba(255,255,255,.035))",
  borderRadius: 34,
  padding: 26,
  marginBottom: 22,
  boxShadow: "0 30px 90px rgba(0,0,0,.34)",
};

const card: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.13)",
  background:
    "linear-gradient(145deg, rgba(181,92,255,.10), rgba(232,196,107,.055), rgba(255,255,255,.03))",
  borderRadius: 28,
  padding: 22,
  boxShadow: "0 26px 80px rgba(0,0,0,.34)",
};

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
  gap: 18,
};

const chip: React.CSSProperties = {
  display: "inline-flex",
  border: "1px solid rgba(157,243,191,.25)",
  color: "#9df3bf",
  background: "rgba(157,243,191,.07)",
  borderRadius: 999,
  padding: "8px 11px",
  fontWeight: 850,
  fontSize: 13,
  margin: "0 7px 7px 0",
};

const btn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "linear-gradient(135deg,#f5d978,#9df3bf 55%,#b55cff)",
  color: "#06100a",
  border: "none",
  borderRadius: 999,
  padding: "13px 18px",
  fontWeight: 950,
  textDecoration: "none",
  cursor: "pointer",
  margin: "6px 6px 0 0",
  minHeight: 46,
};

const ghost: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  color: "white",
  border: "1px solid rgba(255,255,255,.18)",
  background: "rgba(255,255,255,.055)",
  borderRadius: 999,
  padding: "13px 18px",
  fontWeight: 900,
  textDecoration: "none",
  cursor: "pointer",
  margin: "6px 6px 0 0",
  minHeight: 46,
};

const danger: React.CSSProperties = {
  ...ghost,
  color: "#ffd0d0",
  border: "1px solid rgba(255,120,120,.38)",
};

function clean(value: unknown) {
  return String(value || "").trim();
}

function parseCookies() {
  if (typeof document === "undefined") return {};

  const map: CookieMap = {};

  for (const part of document.cookie.split(";")) {
    const [rawKey, ...rawValue] = part.trim().split("=");
    if (!rawKey) continue;

    try {
      map[rawKey] = decodeURIComponent(rawValue.join("="));
    } catch {
      map[rawKey] = rawValue.join("=");
    }
  }

  return map;
}

function readCookie(name: string) {
  return parseCookies()[name] || "";
}

function getEmail() {
  if (typeof window === "undefined") return "";

  return (
    localStorage.getItem("vf_email") ||
    sessionStorage.getItem("vf_email") ||
    readCookie("vf_email") ||
    readCookie("vf_admin_email") ||
    ""
  ).trim().toLowerCase();
}

function isOwner(email: string, cookies: CookieMap) {
  return (
    email === OWNER_EMAIL ||
    cookies.vf_admin === "1" ||
    cookies.isAdmin === "true" ||
    cookies.vf_admin_email === OWNER_EMAIL
  );
}

function StatusCard({
  title,
  value,
  detail,
  good,
}: {
  title: string;
  value: string;
  detail: string;
  good: boolean;
}) {
  return (
    <article style={{ ...card, borderColor: good ? "rgba(157,243,191,.50)" : "rgba(255,179,179,.45)" }}>
      <div
        style={{
          color: good ? "#9df3bf" : "#ffb3b3",
          letterSpacing: 4,
          fontWeight: 900,
          fontSize: 11,
          marginBottom: 10,
          textTransform: "uppercase",
        }}
      >
        {title}
      </div>
      <h2 style={{ fontSize: 28, lineHeight: 1.05, margin: "0 0 10px" }}>{value}</h2>
      <p style={{ color: "rgba(255,255,255,.72)", lineHeight: 1.55, margin: 0 }}>{detail}</p>
    </article>
  );
}

export default function OwnerControlCheckPage() {
  const [email, setEmail] = useState("");
  const [cookies, setCookies] = useState<CookieMap>({});
  const [ownerDetected, setOwnerDetected] = useState(false);

  function refresh() {
    const nextCookies = parseCookies();
    const nextEmail = getEmail();
    setCookies(nextCookies);
    setEmail(nextEmail);
    setOwnerDetected(isOwner(nextEmail, nextCookies));
  }

  useEffect(() => {
    refresh();
  }, []);

  return (
    <main style={page}>
      <style>{`
        a:hover,
        button:hover {
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
            margin: 0 !important;
            box-sizing: border-box;
          }
        }
      `}</style>

      <div style={wrap}>
        <section style={hero}>
          <div
            style={{
              color: ownerDetected ? "#9df3bf" : "#ffb3b3",
              letterSpacing: 5,
              fontWeight: 950,
              fontSize: 12,
              marginBottom: 12,
              textTransform: "uppercase",
            }}
          >
            VaultForge Owner Control Check
          </div>

          <h1 style={{ fontSize: "clamp(54px,11vw,104px)", lineHeight: 0.86, margin: "0 0 18px" }}>
            {ownerDetected ? "Owner controls active." : "Owner controls hidden."}
          </h1>

          <p style={{ color: "rgba(255,255,255,.72)", fontSize: 22, lineHeight: 1.55 }}>
            This page explains why Generate Routing and Stage Controlled Intro buttons do or do not appear.
          </p>

          <div>
            <span style={chip}>Current Email: {email || "none"}</span>
            <span style={chip}>Owner Email: {OWNER_EMAIL}</span>
            <span style={chip}>vf_admin: {cookies.vf_admin || "none"}</span>
            <span style={chip}>isAdmin: {cookies.isAdmin || "none"}</span>
          </div>

          <div className="vf-actions" style={{ marginTop: 14 }}>
            <button type="button" style={btn} onClick={refresh}>
              Refresh Check
            </button>
            <Link href="/logout" style={danger}>
              Logout
            </Link>
            <Link href="/admin-login" style={ghost}>
              Admin Login
            </Link>
            <Link href="/alerts" style={ghost}>
              Alerts
            </Link>
            <Link href="/intelligence" style={ghost}>
              Intelligence
            </Link>
            <Link href="/activity" style={ghost}>
              Activity
            </Link>
          </div>
        </section>

        <section style={grid}>
          <StatusCard
            title="Email Match"
            value={email === OWNER_EMAIL ? "Yes" : "No"}
            detail={
              email === OWNER_EMAIL
                ? "You are logged in with the hard-coded owner email."
                : "The page does not see the owner email. Owner-only buttons stay hidden."
            }
            good={email === OWNER_EMAIL}
          />

          <StatusCard
            title="Admin Cookie"
            value={cookies.vf_admin === "1" ? "Active" : "Missing"}
            detail={
              cookies.vf_admin === "1"
                ? "The vf_admin cookie is active."
                : "The vf_admin cookie is not active. Admin-only buttons may stay hidden unless owner email matches."
            }
            good={cookies.vf_admin === "1"}
          />

          <StatusCard
            title="Owner Controls"
            value={ownerDetected ? "Visible" : "Hidden"}
            detail={
              ownerDetected
                ? "Generate Routing and Stage Controlled Intro controls should appear on owner-enabled pages."
                : "You are in member/read-only mode. This is correct for regular members."
            }
            good={ownerDetected}
          />
        </section>

        <section style={{ ...hero, marginTop: 22 }}>
          <div
            style={{
              color: "#9df3bf",
              letterSpacing: 5,
              fontWeight: 950,
              fontSize: 12,
              marginBottom: 12,
              textTransform: "uppercase",
            }}
          >
            Where Owner Buttons Should Appear
          </div>

          <p style={{ color: "rgba(255,255,255,.72)", fontSize: 19, lineHeight: 1.6 }}>
            When owner controls are active, these pages should show Generate Routing / Stage Controlled Intro controls:
          </p>

          <div className="vf-actions">
            <Link href="/alerts" style={btn}>
              Alerts
            </Link>
            <Link href="/intelligence" style={btn}>
              Intelligence
            </Link>
            <Link href="/routing-inbox" style={ghost}>
              Routing Inbox
            </Link>
            <Link href="/introductions" style={ghost}>
              Introductions
            </Link>
            <Link href="/admin-intelligence" style={ghost}>
              Owner Intelligence
            </Link>
          </div>
        </section>

        <section style={{ ...hero, marginTop: 22 }}>
          <div
            style={{
              color: "#9df3bf",
              letterSpacing: 5,
              fontWeight: 950,
              fontSize: 12,
              marginBottom: 12,
              textTransform: "uppercase",
            }}
          >
            Current Safety Mode
          </div>

          <p style={{ color: "rgba(255,255,255,.72)", fontSize: 19, lineHeight: 1.6 }}>
            This page only reads browser session values. It does not grant admin access, modify data, generate routing, or stage introductions.
          </p>
        </section>
      </div>
    </main>
  );
}
