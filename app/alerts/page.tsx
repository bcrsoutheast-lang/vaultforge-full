"use client";

import Link from "next/link";

export default function AlertsNoticeBlock() {
  return (
    <section
      style={{
        marginTop: 16,
        border: "1px solid rgba(57,255,20,.34)",
        background: "rgba(57,255,20,.08)",
        borderRadius: 18,
        padding: 16,
        boxShadow: "0 0 24px rgba(57,255,20,.14)",
      }}
    >
      <div
        style={{
          color: "#39ff14",
          fontWeight: 900,
          letterSpacing: ".12em",
          textTransform: "uppercase",
          fontSize: 12,
          marginBottom: 8,
        }}
      >
        Routing Intelligence Notice
      </div>

      <p
        style={{
          margin: 0,
          color: "#d9ffd0",
          lineHeight: 1.65,
          fontSize: 15,
          fontWeight: 600,
        }}
      >
        VaultForge may route the same signal into multiple operational lanes when
        the opportunity matches several execution categories, pressure conditions,
        routing triggers, or member fit profiles. This intentional overlap helps
        ensure high-value opportunities are not missed across active workflows.
      </p>

      <div
        style={{
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          marginTop: 14,
        }}
      >
        <Link
          href="/dashboard"
          style={{
            display: "inline-flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: 42,
            borderRadius: 999,
            padding: "10px 14px",
            textDecoration: "none",
            fontWeight: 900,
            background: "linear-gradient(135deg,#f8e7b0,#e8c46b)",
            color: "#06100a",
          }}
        >
          Back To Command
        </Link>
      </div>
    </section>
  );
}
