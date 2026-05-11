"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

function clean(value: unknown) {
  return String(value || "").trim();
}

function firstParam(params: URLSearchParams, names: string[]) {
  for (const name of names) {
    const value = clean(params.get(name));
    if (value) return value;
  }

  return "";
}

export default function MessagesNewBridgePage() {
  const [target, setTarget] = useState("");
  const [reason, setReason] = useState("Resolving old message link...");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const signalId = firstParam(params, ["signal_id", "signalId", "alert_id"]);
    const email = firstParam(params, ["email", "from", "viewer"]);
    const itemId = firstParam(params, ["item_id", "itemId", "pain_id", "deal_id", "project_id"]);

    if (signalId) {
      const next = new URL(`/connect/${encodeURIComponent(signalId)}`, window.location.origin);
      if (email) next.searchParams.set("email", email);
      if (itemId) next.searchParams.set("item_id", itemId);

      setTarget(next.pathname + next.search);
      setReason("Redirecting old message link into new Connect V1 system...");

      window.location.replace(next.pathname + next.search);
      return;
    }

    setReason("This old message route needs a signal_id. Open Connect from a Signal, Pain card, or Alert action.");
  }, []);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg,#020303,#071326)",
        color: "white",
        padding: 24,
        fontFamily:
          'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <section
        style={{
          maxWidth: 880,
          margin: "0 auto",
          border: "1px solid rgba(232,196,107,.28)",
          borderRadius: 28,
          padding: 24,
          background: "rgba(255,255,255,.06)",
        }}
      >
        <p style={{ color: "#e8c46b", letterSpacing: ".18em", fontWeight: 950 }}>VAULTFORGE CONNECT BRIDGE</p>
        <h1 style={{ fontSize: 56, lineHeight: 0.95, margin: "0 0 16px" }}>Moving to clean connect.</h1>
        <p style={{ color: "#cbd5e1", fontSize: 18 }}>{reason}</p>

        {target ? (
          <Link
            href={target}
            style={{
              display: "inline-flex",
              marginTop: 18,
              color: "#101010",
              background: "linear-gradient(135deg,#f8e7b0,#e8c46b)",
              textDecoration: "none",
              borderRadius: 14,
              padding: "14px 18px",
              fontWeight: 950,
            }}
          >
            Open Connect
          </Link>
        ) : (
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
            <Link href="/pain-feed" style={{ color: "white" }}>Pain Feed</Link>
            <Link href="/signals" style={{ color: "white" }}>Signals</Link>
            <Link href="/dashboard" style={{ color: "white" }}>Dashboard</Link>
          </div>
        )}
      </section>
    </main>
  );
}
