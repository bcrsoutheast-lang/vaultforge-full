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
    stat: "Active",
    statValue: "LIVE",
    copy: "Buyer demand, capital paths, operator execution, and deal-room movement.",
  },
  {
    label: "FIX",
    title: "Pressure Rooms",
    href: "/pressure-rooms",
    pulse: "Problem Flow",
    color: "#fb7185",
    stat: "Distress",
    statValue: "WATCH",
    copy: "Funding gaps, stuck projects, seller pressure, contractor gaps, and rescue paths.",
  },
  {
    label: "5S",
    title: "Workstations",
    href: "/workstations",
    pulse: "Execution Cells",
    color: "#facc15",
    stat: "Workflow",
    statValue: "CLEAN",
    copy: "Sort, set, shine, standardize, and sustain room execution discipline.",
  },
  {
    label: "AI",
    title: "Intelligence",
    href: "/intelligence",
    pulse: "Signal Reads",
    color: "#67e8f9",
    stat: "AI",
    statValue: "ONLINE",
    copy: "Risk, next move, worst move, liquidity, fit, and execution intelligence.",
  },
  {
    label: "OPS",
    title: "Alerts",
    href: "/alerts?lane=new",
    pulse: "Triggers",
    color: "#39ff14",
    stat: "Triggers",
    statValue: "ARMED",
    copy: "Operational alerts that open the right room and stop noise from spreading.",
  },
  {
    label: "COMMS",
    title: "Messages",
    href: "/message-command",
    pulse: "Threads",
    color: "#a78bfa",
    stat: "Context",
    statValue: "LOCKED",
    copy: "Room-aware messaging, intro requests, and internal execution context.",
  },
];

const metrics = [
  ["Deal Flow", "Opportunity rooms", "UP"],
  ["Pressure", "Problems surfaced", "WATCH"],
  ["Capital", "Routing paths", "LIVE"],
  ["Operators", "Execution fit", "READY"],
];

const panel: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.26)",
  borderRadius: 34,
  padding: 26,
  background:
    "radial-gradient(circle at top left, rgba(232,196,107,.13), transparent 36%), linear-gradient(145deg,rgba(15,23,42,.96),rgba(2,6,23,.96))",
  boxShadow: "0 28px 90px rgba(0,0,0,.38)",
  marginBottom: 18,
};

const label: React.CSSProperties = {
  color: "#e8c46b",
  letterSpacing: ".20em",
  textTransform: "uppercase",
  fontWeight: 950,
  fontSize: 12,
};

export default function DashboardPage() {
  return (
    <VaultForgeCommandShell
      active="dashboard"
      title="Private market command center."
      subtitle="Money, intelligence, synergy, and execution in one operating surface."
    >
      <section style={panel}>
        <div style={label}>VaultForge Bloomberg Command</div>
        <h2
          style={{
            fontSize: "clamp(52px,10vw,118px)",
            lineHeight: 0.82,
            letterSpacing: "-.085em",
            margin: "12px 0 18px",
            maxWidth: 1080,
          }}
        >
          Find the signal. Move the money. Execute the room.
        </h2>

        <p
          style={{
            color: "#cbd5e1",
            fontSize: 20,
            lineHeight: 1.65,
            maxWidth: 980,
            marginTop: 0,
          }}
        >
          Dashboard is radar, not storage. Rooms hold work. Folders keep flow clean.
          Intelligence tells you the next highest-value move.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))",
            gap: 12,
            marginTop: 20,
          }}
        >
          {metrics.map(([name, sub, value]) => (
            <div
              key={name}
              style={{
                border: "1px solid rgba(255,255,255,.12)",
                borderRadius: 22,
                padding: 16,
                background:
                  "linear-gradient(180deg,rgba(255,255,255,.065),rgba(255,255,255,.026))",
              }}
            >
              <div
                style={{
                  color: "#94a3b8",
                  letterSpacing: ".16em",
                  textTransform: "uppercase",
                  fontWeight: 950,
                  fontSize: 11,
                }}
              >
                {name}
              </div>
              <div
                style={{
                  color: "#f8e7b0",
                  fontSize: 30,
                  fontWeight: 1000,
                  letterSpacing: "-.05em",
                  marginTop: 6,
                }}
              >
                {value}
              </div>
              <div style={{ color: "#cbd5e1", fontSize: 13, marginTop: 4 }}>
                {sub}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
          gap: 18,
          marginBottom: 18,
        }}
      >
        {tiles.map((tile) => (
          <Link
            key={tile.title}
            href={tile.href}
            style={{
              minHeight: 250,
              border: `1px solid ${tile.color}66`,
              borderRadius: 32,
              padding: 22,
              background:
                "radial-gradient(circle at top left, rgba(255,255,255,.10), transparent 34%), linear-gradient(180deg,rgba(15,23,42,.97),rgba(2,6,23,.99))",
              boxShadow: `0 0 42px ${tile.color}18, inset 0 1px 0 rgba(255,255,255,.06)`,
              color: "white",
              textDecoration: "none",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              overflow: "hidden",
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: "0 0 auto",
                height: 4,
                background: `linear-gradient(90deg,${tile.color},transparent)`,
                opacity: .85,
              }}
            />

            <div>
              <div
                style={{
                  color: tile.color,
                  letterSpacing: ".20em",
                  textTransform: "uppercase",
                  fontWeight: 950,
                  fontSize: 12,
                  marginBottom: 14,
                }}
              >
                {tile.label} • {tile.pulse}
              </div>

              <h3
                style={{
                  fontSize: "clamp(34px,6vw,62px)",
                  lineHeight: 0.88,
                  letterSpacing: "-.06em",
                  margin: 0,
                }}
              >
                {tile.title}
              </h3>

              <p style={{ color: "#cbd5e1", lineHeight: 1.55, marginTop: 14 }}>
                {tile.copy}
              </p>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
              <span
                style={{
                  border: `1px solid ${tile.color}66`,
                  background: `${tile.color}14`,
                  color: tile.color,
                  borderRadius: 999,
                  padding: "8px 12px",
                  fontWeight: 950,
                }}
              >
                ● {tile.stat}
              </span>

              <span
                style={{
                  color: "#f8e7b0",
                  fontWeight: 1000,
                  letterSpacing: ".10em",
                  fontSize: 13,
                }}
              >
                {tile.statValue}
              </span>
            </div>
          </Link>
        ))}
      </section>

      <section
        style={{
          ...panel,
          borderColor: "rgba(57,255,20,.36)",
          background:
            "radial-gradient(circle at top left, rgba(57,255,20,.15), transparent 34%), linear-gradient(145deg,rgba(2,30,14,.82),rgba(2,6,23,.96))",
        }}
      >
        <div style={{ ...label, color: "#39ff14" }}>Kaizen Operating Rule</div>
        <h2
          style={{
            fontSize: "clamp(34px,7vw,72px)",
            lineHeight: 0.88,
            letterSpacing: "-.06em",
            margin: "10px 0 12px",
          }}
        >
          Every room must earn its place.
        </h2>
        <p style={{ color: "#d9ffd0", lineHeight: 1.7, fontSize: 18, fontWeight: 750 }}>
          Move it forward, save it for follow-up, archive it when done, or hide it when it no longer belongs in active workflow.
        </p>
      </section>
    </VaultForgeCommandShell>
  );
}
