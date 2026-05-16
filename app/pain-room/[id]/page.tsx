"use client";

import Link from "next/link";
import { useMemo } from "react";
import VaultForgeRoomCleanupControls from "../../components/VaultForgeRoomCleanupControls";


function clean(value: unknown) {
  return String(value || "").trim();
}

function getRoomId() {
  if (typeof window === "undefined") return "";
  const parts = window.location.pathname.split("/").filter(Boolean); return decodeURIComponent(clean(parts[parts.length - 1]));
}

const page: React.CSSProperties = {
  minHeight: "100vh",
  background: "radial-gradient(circle at top left, rgba(232,196,107,.13), transparent 30%), linear-gradient(180deg,#020617,#071326 55%,#020617)",
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

export default function RoomPage() {
  const id = useMemo(getRoomId, []);
  const title = "Pressure Room " + (id || "");
  const sourceRoute = `/pain-room/${encodeURIComponent(id)}`;

  return (
    <main style={page}>
      <div style={wrap}>
        <section style={panel}>
          <div style={label}>VaultForge Pressure Room</div>
          <h1 style={{ fontSize: "clamp(52px,10vw,104px)", lineHeight: .88, letterSpacing: "-.075em", margin: "12px 0 18px" }}>
            {title}
          </h1>
          <p style={{ color: "#cbd5e1", lineHeight: 1.65, fontSize: 20, marginTop: 0 }}>
            Pressure is the problem-solving workspace. It should not act like opportunity, routing, or alerts.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 16 }}>
            <Link href="/pressure-rooms" style={ghost}>Back To Lane</Link>
            <Link href="/dashboard" style={ghost}>Command</Link>
          </div>
        </section>

        <VaultForgeRoomCleanupControls
          roomId={id}
          roomTitle={title}
          roomType="Pressure Room"
          kind="pressure"
          folder="pressure"
          sourceRoute={sourceRoute}
          laneHref="/pressure-rooms"
        />

        

        <section style={panel}>
          <div style={label}>Room Identity Locked</div>
          <p style={{ color: "#cbd5e1", lineHeight: 1.55 }}>
            This room uses the shared 5S cleanup controls. Save, archive, delete/hide, request intro, and internal thread all carry the same room title/type/id context.
          </p>
        </section>
      </div>
    </main>
  );
}
