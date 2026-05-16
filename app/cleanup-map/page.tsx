"use client";

import Link from "next/link";
import VaultForgeCommandShell from "../components/VaultForgeCommandShell";

export default function CleanupMapPage() {
  return (
    <VaultForgeCommandShell
      active="dashboard"
      title="5S cleanup law."
      subtitle="Every room follows the same reaction system: Save, Archive, Delete/Hide, Restore, Message, Route."
    >
      <section
        style={{
          border: "1px solid rgba(232,196,107,.22)",
          borderRadius: 28,
          padding: 24,
          background: "rgba(255,255,255,.05)",
        }}
      >
        <h2 style={{ fontSize: 42, marginTop: 0 }}>For every action, there is a reaction.</h2>
        <p style={{ color: "#cbd5e1", lineHeight: 1.65, fontSize: 18 }}>
          Save keeps a room for follow-up. Archive removes it from active workflow. Delete/Hide removes it from normal view. Restore brings it back. Request Info / Intro creates a room-aware thread.
        </p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          {[
            ["Saved Rooms", "/saved-rooms"],
            ["Archived Rooms", "/archived-rooms"],
            ["Deleted Rooms", "/deleted-rooms"],
            ["Command", "/dashboard"],
          ].map(([name, href]) => (
            <Link
              key={name}
              href={href}
              style={{
                minHeight: 44,
                borderRadius: 999,
                padding: "10px 14px",
                background: "linear-gradient(135deg,#f8e7b0,#e8c46b)",
                color: "#06100a",
                fontWeight: 950,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {name}
            </Link>
          ))}
        </div>
      </section>
    </VaultForgeCommandShell>
  );
}
