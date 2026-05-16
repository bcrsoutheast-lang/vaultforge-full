"use client";

import Link from "next/link";
import VaultForgeCommandShell from "../components/VaultForgeCommandShell";

const panel: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.22)",
  borderRadius: 30,
  padding: 24,
  background: "linear-gradient(145deg,rgba(255,255,255,.070),rgba(255,255,255,.030))",
  boxShadow: "0 24px 80px rgba(0,0,0,.30)",
  marginBottom: 18,
};

const label: React.CSSProperties = {
  color: "#e8c46b",
  letterSpacing: ".18em",
  textTransform: "uppercase",
  fontWeight: 950,
  fontSize: 12,
};

const button: React.CSSProperties = {
  display: "inline-flex",
  justifyContent: "center",
  alignItems: "center",
  minHeight: 46,
  borderRadius: 999,
  padding: "11px 16px",
  textDecoration: "none",
  fontWeight: 950,
  background: "linear-gradient(135deg,#f8e7b0,#e8c46b)",
  color: "#06100a",
};

const ghost: React.CSSProperties = {
  ...button,
  background: "rgba(255,255,255,.06)",
  border: "1px solid rgba(255,255,255,.16)",
  color: "white",
};

export default function LanePage() {
  return (
    <VaultForgeCommandShell
      active="routing"
      title="Routing Queue."
      subtitle="Member-fit paths, intro opportunities, execution lanes, and who-should-see-this logic live here."
    >
      <section style={panel}>
        <div style={label}>VaultForge Routing Center</div>

        <h2
          style={{
            fontSize: "clamp(42px,8vw,82px)",
            lineHeight: 0.9,
            letterSpacing: "-.06em",
            margin: "12px 0 16px",
          }}
        >
          Execution coordination lane.
        </h2>

        <p
          style={{
            color: "#cbd5e1",
            lineHeight: 1.65,
            fontSize: 19,
            marginTop: 0,
            maxWidth: 920,
          }}
        >
          Routing is not the deal room. Routing shows who fits, why they fit, and which intro path should happen. Open the routing room for member-fit logic, then open the actual deal or pressure room when needed.
        </p>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 10,
            marginTop: 16,
          }}
        >
            <Link href="/introductions" style=button>
              Introductions
            </Link>
            <Link href="/message-command" style=ghost>
              Messages
            </Link>
            <Link href="/saved-rooms" style=ghost>
              Saved Rooms
            </Link>
            <Link href="/dashboard" style=ghost>
              Command
            </Link>
        </div>
      </section>

      <section style={panel}>
        <div style={label}>Room Identity Rule</div>
        <p style={{ color: "#cbd5e1", lineHeight: 1.65, fontSize: 17, margin: 0 }}>
          This lane has one job only. Dashboard is radar. Rooms hold work. Alerts trigger action. Intelligence explains meaning. Routing moves execution. Cleanup folders keep clutter out of active workflow.
        </p>
      </section>
    </VaultForgeCommandShell>
  );
}
