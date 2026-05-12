"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import VaultForgeMemberNav from "../components/VaultForgeMemberNav";

export const dynamic = "force-dynamic";

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
  padding: "22px 16px 100px",
  fontFamily: "Arial, sans-serif",
};

const wrap: React.CSSProperties = {
  width: "min(1280px,100%)",
  margin: "0 auto",
};

const section: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.24)",
  borderRadius: 30,
  background:
    "linear-gradient(145deg,rgba(255,255,255,.070),rgba(255,255,255,.030))",
  padding: 24,
  marginBottom: 20,
  boxShadow: "0 28px 86px rgba(0,0,0,.30)",
};

const buttonGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))",
  gap: 14,
};

const navButton: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.14)",
  borderRadius: 20,
  background: "rgba(255,255,255,.055)",
  color: "white",
  minHeight: 76,
  padding: "18px 20px",
  textDecoration: "none",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  fontWeight: 950,
  fontSize: 18,
};

const goldButton: React.CSSProperties = {
  ...navButton,
  background: "linear-gradient(135deg,#f8e7b0,#9df3bf,#b55cff)",
  color: "#06100a",
  border: "1px solid rgba(232,196,107,.70)",
};

const metricGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))",
  gap: 16,
};

const metricCard: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.12)",
  borderRadius: 24,
  padding: 22,
  background:
    "linear-gradient(180deg, rgba(255,255,255,.050), rgba(255,255,255,.020))",
  minHeight: 214,
  position: "relative",
  overflow: "hidden",
};

const chipBase: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  borderRadius: 999,
  padding: "6px 10px",
  fontSize: 12,
  fontWeight: 950,
  letterSpacing: ".08em",
  textTransform: "uppercase",
};

const muted: React.CSSProperties = {
  color: "#cbd5e1",
  lineHeight: 1.55,
};

const pill: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,.14)",
  background: "rgba(255,255,255,.055)",
  color: "#cbd5e1",
  padding: "8px 12px",
  fontWeight: 850,
  margin: "0 8px 8px 0",
};

function MetricCard({
  label,
  number,
  title,
  text,
  href,
  linkLabel,
  tone,
}: {
  label: string;
  number: string;
  title: string;
  text: string;
  href: string;
  linkLabel: string;
  tone: "blue" | "green" | "gold" | "red";
}) {
  const colors =
    tone === "blue"
      ? { color: "#38bdf8", border: "rgba(56,189,248,.35)", bg: "rgba(56,189,248,.08)" }
      : tone === "green"
      ? { color: "#4ade80", border: "rgba(74,222,128,.35)", bg: "rgba(74,222,128,.08)" }
      : tone === "red"
      ? { color: "#f87171", border: "rgba(248,113,113,.35)", bg: "rgba(248,113,113,.08)" }
      : { color: "#e8c46b", border: "rgba(232,196,107,.35)", bg: "rgba(232,196,107,.08)" };

  return (
    <article style={metricCard}>
      <div
        style={{
          ...chipBase,
          border: `1px solid ${colors.border}`,
          color: colors.color,
          background: colors.bg,
        }}
      >
        {label}
      </div>

      <div style={{ fontSize: 64, fontWeight: 1000, marginTop: 18, color: "#f8fafc" }}>
        {number}
      </div>

      <h3 style={{ fontSize: 30, lineHeight: 1.02, fontWeight: 950, margin: "8px 0 10px" }}>
        {title}
      </h3>

      <p style={{ ...muted, marginBottom: 48 }}>{text}</p>

      <Link
        href={href}
        style={{
          position: "absolute",
          bottom: 20,
          left: 22,
          color: "white",
          fontWeight: 950,
          textDecoration: "none",
        }}
      >
        {linkLabel} →
      </Link>
    </article>
  );
}

export default function DashboardPage() {
  const [email, setEmail] = useState("");

  useEffect(() => {
    setEmail(getEmail());
  }, []);

  return (
    <main style={page}>
      <style>{`
        a:hover, button:hover {
          transform: translateY(-1px);
          transition: all .18s ease;
          filter: brightness(1.06);
        }

        @media (max-width: 760px) {
          .vf-grid,
          .vf-actions {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      <div style={wrap}>
        <VaultForgeMemberNav
          title="Dashboard"
          subtitle="Command center, operating counts, and fast access to the VaultForge execution loop."
          active="dashboard"
        />

        <section style={section}>
          <div
            style={{
              color: "#e8c46b",
              letterSpacing: ".18em",
              textTransform: "uppercase",
              fontWeight: 950,
              fontSize: 12,
              marginBottom: 10,
            }}
          >
            VaultForge Command Center
          </div>

          <h1
            style={{
              fontSize: "clamp(52px,10vw,96px)",
              lineHeight: 0.88,
              letterSpacing: "-.06em",
              margin: "0 0 18px",
            }}
          >
            Everything starts here.
          </h1>

          <p style={{ ...muted, fontSize: 18, maxWidth: 980 }}>
            One clean operating view for intelligence, pain, projects, routing, messages, alerts,
            members, and execution.
          </p>

          <div style={{ marginTop: 16 }}>
            <span style={pill}>Signed in: {email || "unknown"}</span>
            <span style={pill}>Member View</span>
            <span style={pill}>Signals: 5</span>
            <span style={pill}>Messages: 9</span>
            <span style={pill}>Routing: 1</span>
          </div>

          <div className="vf-grid" style={{ ...buttonGrid, marginTop: 22 }}>
            <Link href="/pain" style={goldButton}>
              <span>Pain Button</span>
              <span>FORM</span>
            </Link>
            <Link href="/pain-feed" style={navButton}>
              <span>Pain Feed</span>
              <span>FEED</span>
            </Link>
            <Link href="/signals" style={navButton}>
              <span>Signals</span>
              <span>SIG</span>
            </Link>
            <Link href="/activity" style={navButton}>
              <span>Activity</span>
              <span>LIVE</span>
            </Link>
            <Link href="/alerts" style={navButton}>
              <span>Alerts</span>
              <span>ALERT</span>
            </Link>
            <Link href="/routing-inbox" style={navButton}>
              <span>Routing</span>
              <span>FLOW</span>
            </Link>
            <Link href="/introductions" style={navButton}>
              <span>Introductions</span>
              <span>INTRO</span>
            </Link>
            <Link href="/messages" style={navButton}>
              <span>Messages</span>
              <span>MSG</span>
            </Link>
            <Link href="/members" style={navButton}>
              <span>Members</span>
              <span>NET</span>
            </Link>
            <Link href="/projects" style={navButton}>
              <span>Projects</span>
              <span>DEAL</span>
            </Link>
            <Link href="/profile" style={navButton}>
              <span>Profile</span>
              <span>ID</span>
            </Link>
            <Link href="/logout" style={{ ...navButton, color: "#ffd0d0", borderColor: "rgba(255,120,120,.24)" }}>
              <span>Logout</span>
              <span>EXIT</span>
            </Link>
          </div>
        </section>

        <section style={section}>
          <div
            style={{
              color: "#e8c46b",
              letterSpacing: ".18em",
              textTransform: "uppercase",
              fontWeight: 950,
              fontSize: 12,
              marginBottom: 10,
            }}
          >
            Live Pressure
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <h2 style={{ fontSize: 34, lineHeight: 1, margin: 0 }}>Signal bars</h2>
            <span
              style={{
                borderRadius: 999,
                background: "#f8e7b0",
                color: "#06100a",
                padding: "10px 16px",
                fontWeight: 950,
              }}
            >
              Operational
            </span>
          </div>

          <div style={{ marginTop: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#cbd5e1", fontWeight: 850 }}>
              <span>Priority pressure</span>
              <span>81 urgent · 6 high · 43 normal</span>
            </div>
            <div style={{ height: 14, borderRadius: 999, background: "rgba(255,255,255,.14)", overflow: "hidden", marginTop: 8 }}>
              <div style={{ width: "64%", height: "100%", background: "#ff4d4d", float: "left" }} />
              <div style={{ width: "10%", height: "100%", background: "#e8c46b", float: "left" }} />
              <div style={{ width: "26%", height: "100%", background: "#cbd5e1", float: "left" }} />
            </div>
          </div>

          <div style={{ marginTop: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#cbd5e1", fontWeight: 850 }}>
              <span>Execution movement</span>
              <span>130 active · 1 routed · 9 messages</span>
            </div>
            <div style={{ height: 14, borderRadius: 999, background: "rgba(255,255,255,.14)", overflow: "hidden", marginTop: 8 }}>
              <div style={{ width: "86%", height: "100%", background: "#e8c46b", float: "left" }} />
              <div style={{ width: "2%", height: "100%", background: "#4ade80", float: "left" }} />
              <div style={{ width: "12%", height: "100%", background: "#38bdf8", float: "left" }} />
            </div>
          </div>
        </section>

        <section style={section}>
          <div
            style={{
              color: "#e8c46b",
              letterSpacing: ".18em",
              textTransform: "uppercase",
              fontWeight: 950,
              fontSize: 12,
              marginBottom: 10,
            }}
          >
            Member Execution Layer
          </div>

          <h2
            style={{
              fontSize: "clamp(42px,7vw,72px)",
              lineHeight: 0.94,
              letterSpacing: "-.06em",
              margin: "0 0 14px",
            }}
          >
            Live execution queue.
          </h2>

          <p style={{ ...muted, fontSize: 18, maxWidth: 980 }}>
            One operating layer for signals, communication, routing, introductions, and execution
            pressure across the VaultForge network.
          </p>

          <div className="vf-grid" style={{ ...metricGrid, marginTop: 22 }}>
            <MetricCard
              label="Active"
              number="5"
              title="Active Signals"
              text="New distress signals, capital requests, and active opportunities entering your network."
              href="/signals"
              linkLabel="Open Signals"
              tone="blue"
            />
            <MetricCard
              label="Communication"
              number="9"
              title="Conversations"
              text="Member communication, owner replies, and operational follow-up activity."
              href="/messages"
              linkLabel="Open Messages"
              tone="green"
            />
            <MetricCard
              label="Routing"
              number="1"
              title="Introductions"
              text="Controlled introductions, routing actions, and member-fit execution paths."
              href="/introductions"
              linkLabel="Open Introductions"
              tone="gold"
            />
            <MetricCard
              label="Priority"
              number="4"
              title="Execution Queue"
              text="Urgent follow-up, pending replies, and operational items waiting on action."
              href="/activity"
              linkLabel="Open Activity"
              tone="red"
            />
          </div>
        </section>

        <section style={section}>
          <div
            style={{
              color: "#e8c46b",
              letterSpacing: ".18em",
              textTransform: "uppercase",
              fontWeight: 950,
              fontSize: 12,
              marginBottom: 10,
            }}
          >
            Operating Map
          </div>

          <h2 style={{ fontSize: 34, lineHeight: 1, margin: "0 0 18px" }}>Clean execution path.</h2>

          <div className="vf-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 14 }}>
            {[
              ["1. Submit", "Pain form and Create form feed the signal engine."],
              ["2. Signal", "Pain, projects, alerts, and routing open the clean Signal Room first."],
              ["3. Communicate", "Message Owner routes to the real owner/submitter with admin fallback only."],
              ["4. Execute", "Routing, intros, messages, and activity move the deal/problem toward resolution."],
            ].map(([title, text]) => (
              <div
                key={title}
                style={{
                  border: "1px solid rgba(255,255,255,.12)",
                  borderRadius: 20,
                  padding: 18,
                  background: "rgba(0,0,0,.18)",
                }}
              >
                <strong style={{ color: "#f8e7b0" }}>{title}</strong>
                <p style={muted}>{text}</p>
              </div>
            ))}
          </div>
        </section>

        <footer
          style={{
            borderTop: "1px solid rgba(255,255,255,.10)",
            color: "#94a3b8",
            padding: "20px 0",
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
            letterSpacing: ".18em",
            fontSize: 12,
            textTransform: "uppercase",
          }}
        >
          <span>VaultForge OS</span>
          <span>Pain → Signal → Routing → Intro → Message → Execution</span>
          <span>Private Real Estate Intelligence Network</span>
        </footer>
      </div>
    </main>
  );
}
