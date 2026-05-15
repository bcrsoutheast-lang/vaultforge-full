"use client";

import { useEffect } from "react";

export default function WorkstationsRedirectPage() {
  useEffect(() => {
    const query = window.location.search || "";
    window.location.replace(`/projects${query}`);
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
          VaultForge Workstations
        </div>

        <h1 style={{ fontSize: 56, lineHeight: 0.95, margin: "12px 0" }}>
          Opening Workstations...
        </h1>

        <p style={{ color: "#cbd5e1", lineHeight: 1.6 }}>
          Redirecting to the workstation folder command desk.
        </p>
      </section>
    </main>
  );
}
