"use client";

import Link from "next/link";
import VaultForgeCommandShell from "../components/VaultForgeCommandShell";

const tiles = [
  {
    label: "UPSIDE",
    title: "Opportunity Rooms",
    href: "/opportunity-rooms",
    pulse: "Deal Flow",
    color: "#38bdf8",
    copy: "Buyer demand, capital paths, operator execution, and deal-room movement.",
  },
  {
    label: "FIX",
    title: "Pressure Rooms",
    href: "/pressure-rooms",
    pulse: "Problem Flow",
    color: "#fb7185",
    copy: "Distress, funding gaps, stuck projects, contractor gaps, and rescue paths.",
  },
  {
    label: "5S",
    title: "Workstations",
    href: "/workstations",
    pulse: "Execution Cells",
    color: "#facc15",
    copy: "Kaizen discipline for rooms, folders, action queues, and clean workflow.",
  },
  {
    label: "AI",
    title: "Intelligence",
    href: "/intelligence",
    pulse: "Signal Reads",
    color: "#67e8f9",
    copy: "Risk, best move, worst move, liquidity, routing, and execution intelligence.",
  },
  {
    label: "OPS",
    title: "Alerts",
    href: "/alerts",
    pulse: "Triggers",
    color: "#39ff14",
    copy: "Live triggers that open the right room and stop clutter from spreading.",
  },
  {
    label: "COMMS",
    title: "Messages",
    href: "/message-command",
    pulse: "Threads",
    color: "#a78bfa",
    copy: "Room-aware communication, intro requests, and internal execution context.",
  },
];

const panel: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.24)",
  borderRadius: 30,
  padding: 24,
  background:
    "radial-gradient(circle at top left, rgba(232,196,107,.12), transparent 36%), linear-gradient(145deg,rgba(15,23,42,.94),rgba(2,6,23,.94))",
  boxShadow: "0 24px 80px rgba(0,0,0,.34)",
  marginBottom: 18,
};

const label: React.CSSProperties = {
  color: "#e8c46b",
  letterSpacing: ".18em",
  textTransform: "uppercase",
  fontWeight: 950,
  fontSize: 12,
};

export default function DashboardPage() {
  return (
    <VaultForgeCommandShell
      active="dashboard"
      title="Live operational radar."
      subtitle="A private-market execution command center where money, intelligence, synergy, and disciplined action meet."
    >
      <section style={panel}>
        <div style={label}>VaultForge 5S Command</div>
        <h2
          style={{
            fontSize: "clamp(50px,10vw,112px)",
            lineHeight: 0.82,
            letterSpacing: "-.08em",
            margin: "12px 0 18px",
          }}
        >
          Sort the noise. Route the money. Execute faster.
        </h2>
        <p style={{ color: "#cbd5e1", fontSize: 20, lineHeight: 1.6, maxWidth: 980 }}>
          Dashboard is radar, not storage. Rooms hold work. Folders keep flow clean. Intelligence tells you the next highest-value move.
        </p>
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))",
          gap: 18,
          marginBottom: 18,
        }}
      >
        {tiles.map((tile) => (
          <Link
            key={tile.title}
            href={tile.href}
            style={{
              minHeight: 220,
              border: `1px solid ${tile.color}55`,
              borderRadius: 28,
              padding: 22,
              background:
                "radial-gradient(circle at top left, rgba(255,255,255,.08), transparent 35%), linear-gradient(180deg,rgba(15,23,42,.96),rgba(2,6,23,.98))",
              boxShadow: `0 0 36px ${tile.color}18`,
              color: "white",
              textDecoration: "none",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div
                style={{
                  color: tile.color,
                  letterSpacing: ".18em",
                  textTransform: "uppercase",
                  fontWeight: 950,
                  fontSize: 12,
                  marginBottom: 14,
                }}
              >
                {tile.label}
              </div>

              <h3
                style={{
                  fontSize: "clamp(34px,6vw,58px)",
                  lineHeight: 0.9,
                  letterSpacing: "-.055em",
                  margin: 0,
                }}
              >
                {tile.title}
              </h3>

              <p style={{ color: "#cbd5e1", lineHeight: 1.55, marginTop: 14 }}>
                {tile.copy}
              </p>
            </div>

            <span
              style={{
                alignSelf: "flex-start",
                border: `1px solid ${tile.color}66`,
                background: `${tile.color}13`,
                color: tile.color,
                borderRadius: 999,
                padding: "8px 12px",
                fontWeight: 950,
              }}
            >
              ● {tile.pulse}
            </span>
          </Link>
        ))}
      </section>

      <section
        style={{
          ...panel,
          borderColor: "rgba(57,255,20,.30)",
          background:
            "radial-gradient(circle at top left, rgba(57,255,20,.12), transparent 34%), rgba(2,20,12,.78)",
        }}
      >
        <div style={{ ...label, color: "#39ff14" }}>Kaizen Operating Rule</div>
        <p style={{ color: "#d9ffd0", lineHeight: 1.7, fontSize: 18, fontWeight: 750 }}>
          Every room must either move forward, get saved for follow-up, get archived when done, or get deleted/hidden when it no longer belongs in active workflow.
        </p>
      </section>
    </VaultForgeCommandShell>
  );
}
