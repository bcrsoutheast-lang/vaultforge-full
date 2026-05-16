"use client";

import Link from "next/link";
import VaultForgeCommandShell from "../components/VaultForgeCommandShell";

const tiles = [
  {
    title: "Opportunity Rooms",
    value: "Deal flow",
    href: "/opportunity-rooms",
    color: "#56d8ff",
    copy: "Upside rooms, buyer demand, capital fit, operator lanes.",
  },
  {
    title: "Pressure Rooms",
    value: "Problem flow",
    href: "/pressure-rooms",
    color: "#fb7185",
    copy: "Distress, funding gaps, stalled projects, urgent problem-solving.",
  },
  {
    title: "Intelligence",
    value: "Analysis",
    href: "/intelligence",
    color: "#e8c46b",
    copy: "Risk, rewrite, best move, worst move, and signal meaning.",
  },
  {
    title: "Routing",
    value: "Execution",
    href: "/routing-inbox",
    color: "#9df3bf",
    copy: "Who fits, why they fit, and who should get the intro.",
  },
  {
    title: "Alerts",
    value: "Triggers",
    href: "/alerts?lane=new",
    color: "#39ff14",
    copy: "Unread operational triggers that open the correct room.",
  },
  {
    title: "Messages",
    value: "Threads",
    href: "/message-command",
    color: "#facc15",
    copy: "Room-aware communication, intro requests, internal execution.",
  },
];

export default function DashboardPage() {
  return (
    <VaultForgeCommandShell
      active="dashboard"
      title="Live operational radar."
      subtitle="VaultForge is the money, intelligence, synergy, and execution layer for private real-estate opportunities."
    >
      <section
        className="vf-shell-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3,minmax(0,1fr))",
          gap: 18,
          marginBottom: 18,
        }}
      >
        {tiles.map((tile) => (
          <Link
            key={tile.title}
            href={tile.href}
            style={{
              minHeight: 190,
              border: `1px solid ${tile.color}55`,
              borderRadius: 28,
              padding: 22,
              background:
                "linear-gradient(180deg,rgba(15,23,42,.92),rgba(2,6,23,.96))",
              boxShadow: `0 0 30px ${tile.color}18`,
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
                  marginBottom: 12,
                }}
              >
                Live Signal
              </div>

              <h2
                style={{
                  fontSize: "clamp(30px,5vw,46px)",
                  lineHeight: 0.95,
                  letterSpacing: "-.045em",
                  margin: "0 0 12px",
                }}
              >
                {tile.title}
              </h2>

              <p style={{ color: "#cbd5e1", lineHeight: 1.5, margin: 0 }}>
                {tile.copy}
              </p>
            </div>

            <div
              style={{
                marginTop: 18,
                display: "inline-flex",
                alignSelf: "flex-start",
                border: `1px solid ${tile.color}55`,
                color: tile.color,
                background: `${tile.color}10`,
                borderRadius: 999,
                padding: "8px 12px",
                fontWeight: 950,
              }}
            >
              ● {tile.value}
            </div>
          </Link>
        ))}
      </section>

      <section
        style={{
          border: "1px solid rgba(57,255,20,.30)",
          background: "rgba(57,255,20,.065)",
          borderRadius: 24,
          padding: 18,
          boxShadow: "0 0 28px rgba(57,255,20,.10)",
        }}
      >
        <div
          style={{
            color: "#39ff14",
            letterSpacing: ".14em",
            textTransform: "uppercase",
            fontWeight: 950,
            fontSize: 12,
            marginBottom: 8,
          }}
        >
          Routing Intelligence Notice
        </div>

        <p
          style={{
            margin: 0,
            color: "#d9ffd0",
            lineHeight: 1.65,
            fontWeight: 700,
          }}
        >
          VaultForge may route the same signal into multiple operational lanes when an opportunity matches several execution categories, pressure conditions, routing triggers, or member-fit profiles. The overlap is intentional so high-value money, intelligence, synergy, and execution paths are not missed.
        </p>
      </section>
    </VaultForgeCommandShell>
  );
}
