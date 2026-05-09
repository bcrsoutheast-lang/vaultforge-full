
"use client";

import Link from "next/link";
import VaultForgeMemberNav from "../components/VaultForgeMemberNav";

export default function DashboardPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, rgba(178,24,24,.22), transparent 28%), radial-gradient(circle at 85% 10%, rgba(232,196,107,.16), transparent 24%), linear-gradient(180deg,#020202 0%,#070707 55%,#020202 100%)",
        color: "white",
        fontFamily: "Arial, sans-serif",
        padding: "24px 18px 90px",
      }}
    >
      <div style={{ maxWidth: 1400, margin: "0 auto" }}>
        <VaultForgeMemberNav
          title="Member Command Center"
          subtitle="Private real estate intelligence network"
        />

        <section style={hero}>
          <div style={gridBg}></div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))",
              gap: 24,
              position: "relative",
              zIndex: 1,
            }}
          >
            <div>
              <div style={eyebrow}>LIVE INTELLIGENCE NETWORK</div>

              <h2
                style={{
                  fontSize: "clamp(44px,8vw,86px)",
                  lineHeight: .9,
                  letterSpacing: -3,
                  margin: "0 0 20px",
                }}
              >
                Signals. Routes.
                <span style={{ color: "#e8c46b" }}>
                  {" "}Execution.
                </span>
              </h2>

              <p
                style={{
                  color: "rgba(255,255,255,.74)",
                  fontSize: 21,
                  lineHeight: 1.6,
                  maxWidth: 760,
                }}
              >
                Your command center tracks active opportunities, strategic introductions,
                routing activity, intelligence pressure, and network movement across
                the VaultForge ecosystem.
              </p>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
                  gap: 14,
                  marginTop: 26,
                }}
              >
                <StatCard label="ACTIVE SIGNALS" value="29" />
                <StatCard label="LIVE ROUTES" value="14" />
                <StatCard label="INTRODUCTIONS" value="6" />
                <StatCard label="MARKET PRESSURE" value="HIGH" />
              </div>
            </div>

            <div style={terminal}>
              <div style={terminalHeader}>
                <div>
                  <div style={eyebrow}>LIVE NETWORK</div>
                  <h3 style={{ margin: 0, fontSize: 26 }}>
                    Activity Pulse
                  </h3>
                </div>

                <div style={pill}>ACTIVE</div>
              </div>

              <Signal title="ATLANTA • DISTRESS SIGNAL" text="Multifamily acquisition route requested by operator network." />
              <Signal title="TAMPA • CAPITAL ROUTE OPENED" text="Land development matched with lender and JV capital profile." />
              <Signal title="NASHVILLE • BUYER PRESSURE" text="Value-add residential inventory demand increasing." />
              <Signal title="CHARLOTTE • INTRO RESPONSE" text="Execution operator accepted controlled introduction." />
            </div>
          </div>
        </section>

        <section style={section}>
          <div style={eyebrow}>COMMAND PANELS</div>

          <h2 style={sectionTitle}>
            Built around
            <span style={{ color: "#e8c46b" }}>
              {" "}actionable intelligence.
            </span>
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))",
              gap: 18,
              marginTop: 26,
            }}
          >
            <Panel title="Alerts" desc="Track live opportunity signals, urgency, routing activity, and market movement." href="/alerts" />
            <Panel title="Routing Inbox" desc="See opportunities routed to your profile based on strategy, geography, and execution fit." href="/routing-inbox" />
            <Panel title="Introductions" desc="Manage controlled strategic introductions between buyers, lenders, operators, and partners." href="/introductions" />
            <Panel title="Activity" desc="Monitor network movement, intro responses, route creation, and pressure changes." href="/activity" />
            <Panel title="Intelligence" desc="View intelligence signals, routing confidence, opportunity heat, and execution pressure." href="/intelligence" />
            <Panel title="Member Network" desc="Identify who buys, funds, operates, sources, or solves specific opportunity categories." href="/members" />
          </div>
        </section>
      </div>
    </main>
  );
}

function Panel({ title, desc, href }: { title: string; desc: string; href: string }) {
  return (
    <Link href={href} style={{ textDecoration: "none", color: "white" }}>
      <div
        style={{
          border: "1px solid rgba(232,196,107,.14)",
          borderRadius: 26,
          padding: 22,
          background:
            "linear-gradient(180deg, rgba(255,255,255,.05), rgba(255,255,255,.015))",
          minHeight: 220,
        }}
      >
        <div
          style={{
            color: "#d33a2c",
            letterSpacing: 4,
            fontWeight: 900,
            fontSize: 12,
            marginBottom: 12,
          }}
        >
          COMMAND PANEL
        </div>

        <h3 style={{ fontSize: 30, margin: "0 0 12px" }}>{title}</h3>

        <p
          style={{
            color: "rgba(255,255,255,.72)",
            lineHeight: 1.6,
            fontSize: 17,
          }}
        >
          {desc}
        </p>

        <div style={{ marginTop: 18, color: "#e8c46b", fontWeight: 900 }}>
          Open →
        </div>
      </div>
    </Link>
  );
}

function Signal({ title, text }: { title: string; text: string }) {
  return (
    <div
      style={{
        border: "1px solid rgba(255,255,255,.08)",
        borderLeft: "3px solid #d33a2c",
        borderRadius: 18,
        padding: 16,
        background: "rgba(255,255,255,.03)",
        marginTop: 12,
      }}
    >
      <div style={{ color: "#e8c46b", fontWeight: 900, marginBottom: 8 }}>
        {title}
      </div>
      <div style={{ color: "rgba(255,255,255,.70)", lineHeight: 1.5 }}>
        {text}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        border: "1px solid rgba(232,196,107,.14)",
        borderRadius: 22,
        padding: 18,
        background:
          "linear-gradient(180deg, rgba(255,255,255,.05), rgba(255,255,255,.015))",
      }}
    >
      <div
        style={{
          color: "#d33a2c",
          fontWeight: 900,
          letterSpacing: 3,
          fontSize: 12,
          marginBottom: 8,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 42, fontWeight: 950 }}>{value}</div>
    </div>
  );
}

const hero: React.CSSProperties = {
  position: "relative",
  overflow: "hidden",
  border: "1px solid rgba(232,196,107,.18)",
  borderRadius: 36,
  padding: "36px 28px",
  background:
    "radial-gradient(circle at top, rgba(232,196,107,.10), transparent 40%), linear-gradient(145deg, rgba(255,255,255,.05), rgba(255,255,255,.015))",
  boxShadow: "0 35px 120px rgba(0,0,0,.7)",
};

const gridBg: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  opacity: .12,
  backgroundImage:
    "linear-gradient(rgba(232,196,107,.16) 1px, transparent 1px), linear-gradient(90deg, rgba(232,196,107,.12) 1px, transparent 1px)",
  backgroundSize: "42px 42px",
};

const eyebrow: React.CSSProperties = {
  color: "#d33a2c",
  letterSpacing: 4,
  fontWeight: 900,
  fontSize: 12,
  marginBottom: 14,
};

const terminal: React.CSSProperties = {
  border: "1px solid rgba(211,58,44,.22)",
  borderRadius: 28,
  padding: 20,
  background:
    "radial-gradient(circle at top right, rgba(232,196,107,.10), transparent 30%), linear-gradient(180deg, rgba(0,0,0,.64), rgba(0,0,0,.34))",
};

const terminalHeader: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 10,
  borderBottom: "1px solid rgba(232,196,107,.12)",
  paddingBottom: 14,
  marginBottom: 14,
};

const pill: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.20)",
  borderRadius: 999,
  padding: "7px 10px",
  color: "#e8c46b",
  fontWeight: 900,
  fontSize: 12,
};

const section: React.CSSProperties = {
  marginTop: 28,
  border: "1px solid rgba(232,196,107,.14)",
  borderRadius: 34,
  padding: 28,
  background:
    "linear-gradient(180deg, rgba(255,255,255,.04), rgba(255,255,255,.015))",
};

const sectionTitle: React.CSSProperties = {
  fontSize: "clamp(34px,6vw,68px)",
  lineHeight: .95,
  letterSpacing: -2,
  margin: 0,
};
