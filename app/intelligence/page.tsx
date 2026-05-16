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
      active="intelligence"
      title="Intelligence."
      subtitle="Risk, best move, worst move, signal meaning, rewrite logic, and private-market analysis live here."
    >
      <section style={panel}>
        <div style={label}>VaultForge Intelligence Desk</div>

        <h2
          style={{
            fontSize: "clamp(42px,8vw,82px)",
            lineHeight: 0.9,
            letterSpacing: "-.06em",
            margin: "12px 0 16px",
          }}
        >
          Analysis lane.
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
          Intelligence is not storage. It explains what the signal means, where the money is, what can go wrong, what should happen next, and whether the room deserves routing attention.
        </p>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 10,
            marginTop: 16,
          }}
        >
            <Link href="/signals" style=button>
              Signals
            </Link>
            <Link href="/routing-inbox" style=ghost>
              Routing
            </Link>
            <Link href="/alerts?lane=new" style=ghost>
              Alerts
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
