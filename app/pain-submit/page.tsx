"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function PainSubmitRedirectPage() {
  useEffect(() => {
    window.location.replace("/pain?v=adaptive");
  }, []);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg,#02040a,#071326,#030509)",
        color: "white",
        fontFamily: "Arial, sans-serif",
        padding: 24,
        display: "grid",
        placeItems: "center",
        textAlign: "center",
      }}
    >
      <section
        style={{
          maxWidth: 720,
          border: "1px solid rgba(232,196,107,.32)",
          borderRadius: 28,
          padding: 28,
          background: "rgba(255,255,255,.05)",
        }}
      >
        <h1 style={{ fontSize: "clamp(42px,10vw,82px)", lineHeight: 0.9, margin: "0 0 16px" }}>
          Opening Pain Intelligence.
        </h1>
        <p style={{ color: "rgba(255,255,255,.72)", fontSize: 18 }}>
          The old pain-submit route has been replaced by the adaptive Pain Button.
        </p>
        <Link
          href="/pain?v=adaptive"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 48,
            borderRadius: 999,
            padding: "13px 20px",
            fontWeight: 950,
            textDecoration: "none",
            color: "#06100a",
            background: "linear-gradient(135deg,#f5d978,#9df3bf 55%,#b55cff)",
          }}
        >
          Open Pain Button
        </Link>
      </section>
    </main>
  );
}
