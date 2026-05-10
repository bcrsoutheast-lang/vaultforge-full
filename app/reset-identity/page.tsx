
"use client";

import { useEffect } from "react";

export const dynamic = "force-dynamic";

export default function ResetIdentityPage() {
  useEffect(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {}

    window.location.href = "/api/identity/reset";
  }, []);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg,#02040a,#071326,#030509)",
        color: "white",
        fontFamily: "Arial, sans-serif",
        padding: 24,
      }}
    >
      <section
        style={{
          maxWidth: 720,
          margin: "80px auto",
          border: "1px solid rgba(232,196,107,.25)",
          borderRadius: 28,
          padding: 24,
          background: "rgba(255,255,255,.04)",
        }}
      >
        <div
          style={{
            color: "#e8c46b",
            letterSpacing: 4,
            fontWeight: 900,
            fontSize: 12,
            marginBottom: 12,
          }}
        >
          VAULTFORGE IDENTITY RESET
        </div>

        <h1 style={{ fontSize: 44, margin: "0 0 14px" }}>
          Clearing browser identity...
        </h1>

        <p style={{ color: "rgba(255,255,255,.72)", lineHeight: 1.6 }}>
          This clears local storage, session storage, and then calls the server-side cookie purge.
        </p>
      </section>
    </main>
  );
}
