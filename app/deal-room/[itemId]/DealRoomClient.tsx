"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(232,196,107,.16), transparent 30%), linear-gradient(180deg,#020814,#071326 52%,#020814)",
  color: "white",
  padding: "28px 18px 90px",
  fontFamily:
    "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Arial, sans-serif",
};

const card: React.CSSProperties = {
  width: "min(960px,100%)",
  margin: "0 auto",
  border: "1px solid rgba(232,196,107,.28)",
  borderRadius: 30,
  padding: 28,
  background:
    "radial-gradient(circle at top left, rgba(232,196,107,.14), transparent 36%), linear-gradient(145deg,rgba(15,23,42,.96),rgba(2,6,23,.96))",
  boxShadow: "0 28px 90px rgba(0,0,0,.38)",
};

const label: React.CSSProperties = {
  color: "#e8c46b",
  letterSpacing: ".2em",
  textTransform: "uppercase",
  fontWeight: 950,
  fontSize: 12,
};

const btn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 48,
  borderRadius: 999,
  padding: "12px 16px",
  background: "linear-gradient(135deg,#f8e7b0,#e8c46b)",
  color: "#06100a",
  textDecoration: "none",
  fontWeight: 950,
};

const ghost: React.CSSProperties = {
  ...btn,
  background: "rgba(255,255,255,.06)",
  border: "1px solid rgba(255,255,255,.16)",
  color: "white",
};

export default function DealRoomClient() {
  const params = useParams();
  const id = String(params?.id || "").trim();

  useEffect(() => {
    if (!id) return;

    const next = `/deal/detail?id=${encodeURIComponent(id)}`;
    window.location.replace(next);
  }, [id]);

  const href = id ? `/deal/detail?id=${encodeURIComponent(id)}` : "/projects";

  return (
    <main style={page}>
      <section style={card}>
        <div style={label}>VaultForge Room OS Redirect</div>

        <h1
          style={{
            fontSize: "clamp(44px,9vw,90px)",
            lineHeight: 0.84,
            letterSpacing: "-.08em",
            margin: "12px 0 18px",
          }}
        >
          Opening unified deal room.
        </h1>

        <p style={{ color: "#cbd5e1", fontSize: 20, lineHeight: 1.6 }}>
          Old deal room routes now open the unified VaultForge command room.
        </p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 20 }}>
          <Link href={href} style={btn}>Open Command Room</Link>
          <Link href="/projects" style={ghost}>Projects</Link>
          <Link href="/dashboard" style={ghost}>Dashboard</Link>
        </div>
      </section>
    </main>
  );
}
