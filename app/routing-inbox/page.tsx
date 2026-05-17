"use client";

import Link from "next/link";
import VaultForgeCommandShell from "../components/VaultForgeCommandShell";

const panel = {
  border: "1px solid rgba(232,196,107,.22)",
  borderRadius: 30,
  padding: 24,
  background: "linear-gradient(145deg,rgba(255,255,255,.07),rgba(255,255,255,.03))",
  boxShadow: "0 24px 80px rgba(0,0,0,.30)",
  marginBottom: 18,
};

const label = {
  color: "#e8c46b",
  letterSpacing: ".18em",
  textTransform: "uppercase",
  fontWeight: 950,
  fontSize: 12,
};

export default function RoutingInboxPage() {
  return (
    <VaultForgeCommandShell
      active="routing"
      title="Routing Queue."
      subtitle="SUBRouting Queue."
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
          Routing shows who fits, why they fit, and which intro path should happen. Open the routing room for member-fit logic.
        </p>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 10,
            marginTop: 16,
          }}
        >
          <Link
            href="/dashboard"
            style={{
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
            }}
          >
            Command
          </Link>
        </div>
      </section>
    </VaultForgeCommandShell>
  );
}
