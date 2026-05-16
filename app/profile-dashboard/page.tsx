"use client";

import Link from "next/link";
import VaultForgeMemberNav from "../components/VaultForgeMemberNav";

export default function ProfileDashboardPage() {
  return (
    <main style={{
      minHeight: "100vh",
      background: "linear-gradient(180deg,#020303,#071326 55%,#020303)",
      color: "white",
      padding: "22px 16px 96px",
      fontFamily: "Arial, sans-serif"
    }}>
      <div style={{ width: "min(1000px,100%)", margin: "0 auto" }}>
        <VaultForgeMemberNav
          title="Profile"
          subtitle="Minimal member identity. Full VaultForge value is in rooms, intelligence, messages, and network."
          active="profile"
        />

        <section style={{
          border: "1px solid rgba(232,196,107,.24)",
          borderRadius: 30,
          padding: 24,
          background: "linear-gradient(145deg,rgba(255,255,255,.07),rgba(255,255,255,.03))"
        }}>
          <div style={{
            color: "#e8c46b",
            letterSpacing: ".18em",
            textTransform: "uppercase",
            fontWeight: 950,
            fontSize: 12
          }}>
            VaultForge Profile
          </div>

          <h1 style={{
            fontSize: "clamp(52px,10vw,96px)",
            lineHeight: .88,
            letterSpacing: "-.07em",
            margin: "12px 0 18px"
          }}>
            Keep it simple.
          </h1>

          <p style={{
            color: "#cbd5e1",
            fontSize: 20,
            lineHeight: 1.55
          }}>
            Profile is no longer a major workflow. Members get the full VaultForge product through Opportunity Rooms, Pressure Rooms, Workstations, Intelligence, Messages, and Network.
          </p>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
            gap: 12,
            marginTop: 22
          }}>
            {[
              ["/dashboard", "Dashboard"],
              ["/opportunity-rooms", "Opportunity Rooms"],
              ["/pressure-rooms", "Pressure Rooms"],
              ["/workstations", "Workstations"],
              ["/messages", "Messages"],
              ["/members", "Network"]
            ].map(([href, label]) => (
              <Link key={href} href={href} style={{
                border: "1px solid rgba(232,196,107,.24)",
                borderRadius: 20,
                padding: 16,
                color: "white",
                textDecoration: "none",
                background: "rgba(255,255,255,.045)",
                fontWeight: 950
              }}>
                {label}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
