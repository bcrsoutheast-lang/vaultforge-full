"use client";

import { useEffect } from "react";

function clean(value: unknown) {
  return String(value || "").trim();
}

export default function OpportunityRoomRedirect() {
  useEffect(() => {
    const parts = window.location.pathname.split("/").filter(Boolean);
    const id = decodeURIComponent(clean(parts[parts.length - 1]));
    const query = new URLSearchParams(window.location.search);
    const finalId = clean(query.get("id")) || id;

    if (finalId) {
      window.location.replace(`/deal/detail?id=${encodeURIComponent(finalId)}`);
      return;
    }

    window.location.replace("/projects");
  }, []);

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, rgba(232,196,107,.16), transparent 28%), linear-gradient(180deg,#020303,#071326 55%,#020303)",
        color: "white",
        padding: "28px 18px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <section
        style={{
          maxWidth: 900,
          margin: "0 auto",
          border: "1px solid rgba(232,196,107,.24)",
          borderRadius: 28,
          padding: 24,
          background: "rgba(255,255,255,.05)",
        }}
      >
        <div
          style={{
            color: "#e8c46b",
            letterSpacing: ".18em",
            textTransform: "uppercase",
            fontWeight: 950,
            fontSize: 12,
          }}
        >
          VaultForge Opportunity Room
        </div>

        <h1 style={{ fontSize: 56, lineHeight: 0.95, margin: "12px 0" }}>
          Opening Opportunity Room...
        </h1>

        <p style={{ color: "#cbd5e1", lineHeight: 1.6 }}>
          Routing into the dedicated opportunity intelligence room.
        </p>
      </section>
    </main>
  );
}
