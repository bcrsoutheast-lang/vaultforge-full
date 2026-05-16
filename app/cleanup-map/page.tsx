"use client";

import Link from "next/link";

export default function CleanupMapPage() {
  return (
    <main style={{ minHeight: "100vh", background: "linear-gradient(180deg,#020617,#071326 55%,#020617)", color: "white", padding: 24, fontFamily: "Arial, sans-serif" }}>
      <section style={{ border: "1px solid rgba(232,196,107,.25)", borderRadius: 28, padding: 24, background: "rgba(255,255,255,.05)", maxWidth: 1000, margin: "0 auto" }}>
        <div style={{ color: "#e8c46b", letterSpacing: ".18em", textTransform: "uppercase", fontWeight: 950, fontSize: 12 }}>
          VaultForge 5S Cleanup Map
        </div>
        <h1 style={{ fontSize: "clamp(48px,9vw,92px)", lineHeight: 0.9, margin: "12px 0" }}>
          Save. Archive. Delete. Restore.
        </h1>
        <p style={{ color: "#cbd5e1", lineHeight: 1.65, fontSize: 18 }}>
          Every room should use the same cleanup law. Saved means keep. Archived means remove from active. Deleted/hidden means out of normal workflow. Restore brings it back.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 18 }}>
          <Link href="/saved-rooms" style={link}>Saved Rooms</Link>
          <Link href="/archived-rooms" style={link}>Archived Rooms</Link>
          <Link href="/deleted-rooms" style={link}>Deleted Rooms</Link>
          <Link href="/dashboard" style={link}>Command</Link>
        </div>
      </section>
    </main>
  );
}

const link: React.CSSProperties = {
  display: "inline-flex",
  justifyContent: "center",
  alignItems: "center",
  minHeight: 44,
  borderRadius: 999,
  padding: "10px 14px",
  textDecoration: "none",
  fontWeight: 950,
  background: "linear-gradient(135deg,#f8e7b0,#e8c46b)",
  color: "#06100a",
};
