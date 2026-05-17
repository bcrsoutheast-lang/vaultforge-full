"use client";

import Link from "next/link";
import { useMemo } from "react";
import VaultForgeRoomCleanupControls from "../../components/VaultForgeRoomCleanupControls";


function clean(value: unknown) {
  return String(value || "").trim();
}

function shortId(value: string) {
  const text = clean(value);
  if (!text) return "Not listed";
  if (text.length <= 18) return text;
  return `${text.slice(0, 8)}...${text.slice(-6)}`;
}

function getPathId() {
  if (typeof window === "undefined") return "";
  const parts = window.location.pathname.split("/").filter(Boolean);
  return decodeURIComponent(clean(parts[parts.length - 1]));
}

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(232,196,107,.13), transparent 30%), linear-gradient(180deg,#020617,#071326 55%,#020617)",
  color: "white",
  padding: "22px 16px 96px",
  fontFamily: "Arial, sans-serif",
};

const wrap: React.CSSProperties = {
  width: "min(1180px,100%)",
  margin: "0 auto",
};

const panel: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.22)",
  borderRadius: 30,
  padding: 24,
  background: "linear-gradient(145deg,rgba(255,255,255,.070),rgba(255,255,255,.030))",
  boxShadow: "0 28px 86px rgba(0,0,0,.30)",
  marginBottom: 18,
};

const label: React.CSSProperties = {
  color: "#e8c46b",
  letterSpacing: ".18em",
  textTransform: "uppercase",
  fontWeight: 950,
  fontSize: 12,
};

const ghost: React.CSSProperties = {
  display: "inline-flex",
  justifyContent: "center",
  alignItems: "center",
  minHeight: 44,
  borderRadius: 999,
  padding: "10px 14px",
  textDecoration: "none",
  fontWeight: 950,
  background: "rgba(255,255,255,.06)",
  border: "1px solid rgba(255,255,255,.16)",
  color: "white",
};


export default function PainRoomPage() {
  const painId = useMemo(getPathId, []);
  const title = `Pressure Room: ${shortId(painId)}`;

  return (
    <main style={page}>
      <div style={wrap}>
        <section style={panel}>
          <div style={label}>VaultForge Pressure Execution Room</div>

          <h1
            style={{
              fontSize: "clamp(44px,9vw,86px)",
              lineHeight: 0.9,
              letterSpacing: "-.065em",
              margin: "12px 0 18px",
              overflowWrap: "anywhere",
            }}
          >
            {title}
          </h1>

          <p style={{ color: "#cbd5e1", lineHeight: 1.65, fontSize: 20, marginTop: 0 }}>
            This is the problem-solving room. It should move toward capital, buyer demand, operator help, contractor help, legal/title clarity, or owner resolution.
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 16 }}>
            <Link href="/pressure-rooms" style={ghost}>Back To Pressure Rooms</Link>
            <Link href="/pain-feed" style={ghost}>Pain Feed</Link>
            <Link href="/dashboard" style={ghost}>Command</Link>
          </div>
        </section>

        <VaultForgeRoomCleanupControls
          roomId={painId}
          roomTitle={title}
          roomType="Pressure Room"
          kind="pressure"
          folder="pressure"
          sourceRoute={`/pain-room/${encodeURIComponent(painId)}`}
          laneHref="/pressure-rooms"
        />

        <section style={panel}>
          <div style={label}>Pressure Command</div>
          <h2 style={{ fontSize: 40, margin: "10px 0", letterSpacing: "-.04em" }}>
            Solve the bottleneck.
          </h2>
          <p style={{ color: "#cbd5e1", lineHeight: 1.6, margin: 0 }}>
            Use this room to decide what the pressure needs: buyer, capital, operator, contractor, city/permit help, title/legal cleanup, or escalation.
          </p>
        </section>
      </div>
    </main>
  );
}
