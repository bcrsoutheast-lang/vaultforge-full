"use client";

import Link from "next/link";

export default function PainMessagesRedirectPage() {
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
          maxWidth: 760,
          border: "1px solid rgba(232,196,107,.32)",
          borderRadius: 28,
          padding: 28,
          background: "rgba(255,255,255,.05)",
        }}
      >
        <div
          style={{
            color: "#9df3bf",
            letterSpacing: 5,
            fontWeight: 950,
            fontSize: 12,
            marginBottom: 12,
            textTransform: "uppercase",
          }}
        >
          Route moved
        </div>

        <h1 style={{ fontSize: "clamp(42px,10vw,82px)", lineHeight: 0.9, margin: "0 0 16px" }}>
          Pain Feed moved.
        </h1>

        <p style={{ color: "rgba(255,255,255,.72)", fontSize: 18, lineHeight: 1.55 }}>
          Pain Button form lives at <strong>/pain</strong>. Pain Feed lives at <strong>/pain-feed</strong>.
        </p>

        <Link
          href="/pain-feed"
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
            margin: 8,
          }}
        >
          Open Pain Feed
        </Link>

        <Link
          href="/pain"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 48,
            borderRadius: 999,
            padding: "13px 20px",
            fontWeight: 950,
            textDecoration: "none",
            color: "white",
            background: "rgba(255,255,255,.07)",
            border: "1px solid rgba(255,255,255,.18)",
            margin: 8,
          }}
        >
          Open Pain Button Form
        </Link>
      </section>
    </main>
  );
}
