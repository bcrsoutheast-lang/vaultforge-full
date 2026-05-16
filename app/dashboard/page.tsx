"use client";

import Link from "next/link";
import VaultForgeMemberNav from "../components/VaultForgeMemberNav";
import VaultForgeHiddenOwnerBar from "../components/VaultForgeHiddenOwnerBar";

const page: React.CSSProperties = {
  minHeight: "100vh",
  background: "linear-gradient(180deg,#020303,#071326 55%,#020303)",
  color: "white",
  padding: "22px 16px 96px",
  fontFamily: "Arial, sans-serif",
};

const card: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.24)",
  borderRadius: 30,
  padding: 24,
  background: "linear-gradient(145deg,rgba(255,255,255,.07),rgba(255,255,255,.03))",
};

export default function DashboardPage() {
  return (
    <main style={page}>
      <div style={{ width: "min(1180px,100%)", margin: "0 auto" }}>
        <VaultForgeMemberNav
          title="Command Center"
          subtitle="Members get the full VaultForge experience. Owner controls stay hidden."
          active="dashboard"
        />

        <VaultForgeHiddenOwnerBar />

        <section style={card}>
          <div
            style={{
              color: "#e8c46b",
              letterSpacing: ".18em",
              textTransform: "uppercase",
              fontWeight: 950,
              fontSize: 12,
            }}
          >
            VaultForge Command
          </div>

          <h1
            style={{
              fontSize: "clamp(56px,10vw,108px)",
              lineHeight: 0.88,
              letterSpacing: "-.07em",
              margin: "12px 0 18px",
            }}
          >
            Private market operating system.
          </h1>

          <p
            style={{
              color: "#cbd5e1",
              fontSize: 20,
              lineHeight: 1.55,
            }}
          >
            Opportunity Rooms, Pressure Rooms, intelligence routing, workstations, messaging, and execution flow all operate inside one clean system.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))",
              gap: 14,
              marginTop: 22,
            }}
          >
            {[
              ["/opportunity-rooms", "Opportunity Rooms"],
              ["/pressure-rooms", "Pressure Rooms"],
              ["/workstations", "Workstations"],
              ["/intelligence", "Intelligence"],
              ["/messages", "Messages"],
              ["/members", "Network"],
            ].map(([href, label]) => (
              <Link
                key={href}
                href={href}
                style={{
                  border: "1px solid rgba(232,196,107,.24)",
                  borderRadius: 22,
                  padding: 18,
                  color: "white",
                  textDecoration: "none",
                  background: "rgba(255,255,255,.045)",
                  fontWeight: 950,
                }}
              >
                {label}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
