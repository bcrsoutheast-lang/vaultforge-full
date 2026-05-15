"use client";

import { useEffect } from "react";

function clean(value: unknown) {
  return String(value || "").trim();
}

export default function PressureRoomRedirect() {
  useEffect(() => {
    const parts = window.location.pathname.split("/").filter(Boolean);
    const id = decodeURIComponent(clean(parts[parts.length - 1]));

    if (id) {
      window.location.replace(`/pain-room/${encodeURIComponent(id)}`);
      return;
    }

    window.location.replace("/pain-feed");
  }, []);

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, rgba(248,113,113,.16), transparent 28%), linear-gradient(180deg,#020303,#071326 55%,#020303)",
        color: "white",
        padding: "28px 18px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <section
        style={{
          maxWidth: 900,
          margin: "0 auto",
          border: "1px solid rgba(248,113,113,.24)",
          borderRadius: 28,
          padding: 24,
          background: "rgba(255,255,255,.05)",
        }}
      >
        <div
          style={{
            color: "#fecaca",
            letterSpacing: ".18em",
            textTransform: "uppercase",
            fontWeight: 950,
            fontSize: 12,
          }}
        >
          VaultForge Pressure Room
        </div>

        <h1 style={{ fontSize: 56, lineHeight: 0.95, margin: "12px 0" }}>
          Opening Pressure Room...
        </h1>

        <p style={{ color: "#cbd5e1", lineHeight: 1.6 }}>
          Routing into the dedicated pressure intelligence room.
        </p>
      </section>
    </main>
  );
}
