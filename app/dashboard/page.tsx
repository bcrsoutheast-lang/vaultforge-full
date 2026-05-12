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
    "radial-gradient(circle at top left, rgba(232,196,107,.14), transparent 28%), radial-gradient(circle at 88% 8%, rgba(56,189,248,.10), transparent 26%), radial-gradient(circle at 60% 52%, rgba(157,243,191,.07), transparent 28%), linear-gradient(180deg,#020303,#071326 55%,#020303)",
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

const glass: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.12)",
  borderRadius: 24,
  padding: 20,
  background:
    "linear-gradient(180deg,rgba(255,255,255,.052),rgba(255,255,255,.020))",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,.06)",
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

const goldButton: React.CSSProperties = {
  minHeight: 54,
  borderRadius: 999,
  padding: "14px 20px",
  background: "linear-gradient(135deg,#f8e7b0,#e8c46b)",
  color: "#06100a",
  fontWeight: 950,
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};

const ghostButton: React.CSSProperties = {
  ...goldButton,
  border: "1px solid rgba(255,255,255,.14)",
  background: "rgba(255,255,255,.060)",
  color: "white",
};

const eyebrow: React.CSSProperties = {
  color: "#e8c46b",
  letterSpacing: ".18em",
  textTransform: "uppercase",
  fontWeight: 950,
  fontSize: 12,
};

function Metric({
  label,
  value,
  sub,
  tone = "gold",
}: {
  label: string;
  value: string;
  sub: string;
  tone?: "gold" | "blue" | "green" | "red";
}) {
  const color =
    tone === "blue" ? "#38bdf8" : tone === "green" ? "#4ade80" : tone === "red" ? "#f87171" : "#e8c46b";

  return (
    <div style={glass}>
      <div
        style={{
          color,
          fontWeight: 950,
          letterSpacing: ".14em",
          textTransform: "uppercase",
          fontSize: 12,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 56, fontWeight: 1000, lineHeight: 1, marginTop: 14 }}>
        {value}
      </div>
      <div style={{ ...muted, marginTop: 10 }}>{sub}</div>
    </div>
  );
}

function QueueCard({
  title,
  body,
  href,
  tag,
  tone = "gold",
}: {
  title: string;
  body: string;
  href: string;
  tag: string;
  tone?: "gold" | "blue" | "green" | "red";
}) {
  const color =
    tone === "blue" ? "#38bdf8" : tone === "green" ? "#4ade80" : tone === "red" ? "#f87171" : "#e8c46b";

  return (
    <Link
      href={href}
      style={{
        ...glass,
        minHeight: 172,
        textDecoration: "none",
        color: "white",
        display: "block",
        borderColor: `color-mix(in srgb, ${color} 40%, rgba(255,255,255,.12))`,
      }}
    >
      <div
        style={{
          display: "inline-flex",
          border: `1px solid ${color}`,
          color,
          background: "rgba(255,255,255,.04)",
          borderRadius: 999,
          padding: "6px 10px",
          fontSize: 11,
          fontWeight: 950,
          letterSpacing: ".10em",
          textTransform: "uppercase",
          marginBottom: 14,
        }}
      >
        {tag}
      </div>

      <h3 style={{ margin: "0 0 10px", fontSize: 26, lineHeight: 1.05 }}>{title}</h3>
      <p style={{ ...muted, margin: 0 }}>{body}</p>
      <div style={{ marginTop: 18, fontWeight: 950 }}>Open →</div>
    </Link>
  );
}

function Bar({
  label,
  value,
  right,
}: {
  label: string;
  value: number;
  right: string;
}) {
  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, color: "#cbd5e1", fontWeight: 850 }}>
        <span>{label}</span>
        <span>{right}</span>
      </div>
      <div
        style={{
          height: 14,
          borderRadius: 999,
          background: "rgba(255,255,255,.14)",
          overflow: "hidden",
          marginTop: 8,
          border: "1px solid rgba(255,255,255,.08)",
        }}
      >
        <div
          style={{
            width: `${value}%`,
            height: "100%",
            background: "linear-gradient(90deg,#ff4d4d,#e8c46b,#4ade80,#38bdf8)",
          }}
        />
      </div>
    </div>
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
          .vf-two,
          .vf-three,
          .vf-four,
          .vf-actions {
            grid-template-columns: 1fr !important;
          }

          .vf-actions {
            display: grid !important;
            gap: 10px !important;
          }

          .vf-actions > * {
            width: 100%;
            box-sizing: border-box;
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
          <div className="vf-two" style={{ display: "grid", gridTemplateColumns: "1.25fr .75fr", gap: 20, alignItems: "stretch" }}>
            <div>
              <div style={eyebrow}>VaultForge Command Center</div>
              <h1
                style={{
                  fontSize: "clamp(54px,10vw,104px)",
                  lineHeight: 0.88,
                  letterSpacing: "-.07em",
                  margin: "12px 0 18px",
                }}
              >
                Member intelligence desk.
              </h1>

              <p style={{ ...muted, fontSize: 20, maxWidth: 860 }}>
                One clean operating view for live signals, member communication, routing pressure,
                introductions, projects, and execution movement.
              </p>

              <div style={{ marginTop: 18 }}>
                <span style={pill}>Signed in: {email || "unknown"}</span>
                <span style={pill}>Member View</span>
                <span style={pill}>Live OS</span>
                <span style={pill}>Private Network</span>
              </div>

              <div className="vf-actions" style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 22 }}>
                <Link href="/pain" style={goldButton}>Submit Pain Signal</Link>
                <Link href="/signals" style={ghostButton}>Open Signals</Link>
                <Link href="/messages" style={ghostButton}>Messages</Link>
                <Link href="/profile" style={ghostButton}>Profile</Link>
              </div>
            </div>

            <div style={{ ...glass, background: "rgba(0,0,0,.20)" }}>
              <div style={eyebrow}>Today’s Operating Tape</div>
              <div style={{ display: "grid", gap: 13, marginTop: 16 }}>
                {[
                  ["Signals", "5 active records"],
                  ["Messages", "9 communication threads"],
                  ["Routing", "1 routed path"],
                  ["Alerts", "81 active alerts"],
                  ["Introductions", "ready for controlled routing"],
                ].map(([left, right]) => (
                  <div
                    key={left}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 10,
                      borderBottom: "1px solid rgba(255,255,255,.08)",
                      paddingBottom: 12,
                      color: "#cbd5e1",
                      fontWeight: 850,
                    }}
                  >
                    <span style={{ color: "white" }}>{left}</span>
                    <span>{right}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="vf-four" style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 16, marginBottom: 20 }}>
          <Metric label="Signals" value="5" sub="Active opportunities, pain, and deal signals." tone="blue" />
          <Metric label="Messages" value="9" sub="Controlled conversations and replies." tone="green" />
          <Metric label="Routing" value="1" sub="Member-fit execution path generated." tone="gold" />
          <Metric label="Alerts" value="81" sub="Live network pressure and movement." tone="red" />
        </section>

        <section style={section}>
          <div style={eyebrow}>Live Pressure Board</div>
          <h2 style={{ fontSize: 42, lineHeight: 1, margin: "10px 0 8px", letterSpacing: "-.04em" }}>
            Market movement and execution pressure.
          </h2>
          <Bar label="Priority pressure" value={81} right="81 urgent · 6 high · 43 normal" />
          <Bar label="Execution movement" value={72} right="130 active · 1 routed · 9 messages" />
          <Bar label="Member response velocity" value={58} right="messages, intros, and routing activity" />
        </section>

        <section style={section}>
          <div style={eyebrow}>Member Execution Layer</div>
          <h2
            style={{
              fontSize: "clamp(42px,7vw,72px)",
              lineHeight: 0.94,
              letterSpacing: "-.06em",
              margin: "10px 0 14px",
            }}
          >
            Everything has a place.
          </h2>

          <p style={{ ...muted, fontSize: 18, maxWidth: 980 }}>
            Your dashboard is not a duplicate menu. It is the operating desk: what needs attention,
            where to go next, and what is moving inside the network.
          </p>

          <div className="vf-four" style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 16, marginTop: 22 }}>
            <QueueCard
              tag="Active"
              title="Active Signals"
              body="Distress, capital, buyer, operator, land, commercial, and residential opportunities."
              href="/signals"
              tone="blue"
            />
            <QueueCard
              tag="Communication"
              title="Conversations"
              body="Owner/member communication, follow-up, and controlled request threads."
              href="/messages"
              tone="green"
            />
            <QueueCard
              tag="Routing"
              title="Introductions"
              body="Controlled introductions, member-fit routing, and next-step execution paths."
              href="/introductions"
              tone="gold"
            />
            <QueueCard
              tag="Priority"
              title="Execution Queue"
              body="Urgent follow-up, pending replies, and operational items waiting on action."
              href="/activity"
              tone="red"
            />
          </div>
        </section>

        <section style={section}>
          <div style={eyebrow}>Operating Map</div>
          <h2 style={{ fontSize: 36, lineHeight: 1, margin: "10px 0 18px", letterSpacing: "-.035em" }}>
            Pain → Signal → Routing → Intro → Message → Execution.
          </h2>

          <div className="vf-four" style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 14 }}>
            {[
              ["1. Submit", "Pain and project records feed the signal engine."],
              ["2. Signal", "Signals become clean rooms with photos, summary, risks, and route suggestions."],
              ["3. Communicate", "Message Owner keeps communication controlled and tied to the record."],
              ["4. Execute", "Routing, intros, messages, and activity move work toward resolution."],
            ].map(([title, text]) => (
              <div key={title} style={glass}>
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
