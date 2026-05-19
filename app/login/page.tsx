"use client";

import Link from "next/link";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");

  function enter() {
    try {
      const cleanEmail = String(email || "member@vaultforge.local").trim().toLowerCase();
      window.localStorage.setItem("vaultforge_current_email", cleanEmail);
      window.localStorage.setItem("vaultforge_member_email", cleanEmail);
      window.localStorage.setItem("vaultforge_logged_in", "true");
    } catch {
      // Keep login usable even if localStorage is blocked.
    }
    window.location.href = "/command";
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#05070d",
        color: "#f7f7fb",
        padding: 18,
        fontFamily:
          "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
      }}
    >
      <section
        style={{
          maxWidth: 920,
          margin: "0 auto",
          border: "1px solid rgba(245,197,66,.28)",
          borderRadius: 28,
          padding: 30,
          background:
            "radial-gradient(circle at top right, rgba(245,197,66,.16), transparent 32%), linear-gradient(180deg,#080d19,#050816)",
        }}
      >
        <div
          style={{
            color: "#ffd45a",
            textTransform: "uppercase",
            letterSpacing: 7,
            fontWeight: 950,
            fontSize: 15,
            marginBottom: 12,
          }}
        >
          VaultForge Login
        </div>
        <h1
          style={{
            fontSize: "clamp(44px,8vw,86px)",
            lineHeight: 0.9,
            letterSpacing: -4,
            margin: "0 0 18px",
            fontWeight: 950,
          }}
        >
          Member access.
        </h1>
        <p style={{ color: "#c9d0dc", fontSize: 21, lineHeight: 1.35 }}>
          Login now routes directly to the rescued Command Center.
        </p>

        <div
          style={{
            marginTop: 26,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(245px,1fr))",
            gap: 16,
          }}
        >
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email"
            style={{
              width: "100%",
              boxSizing: "border-box",
              border: "1px solid rgba(207,216,230,.18)",
              background: "#151b2a",
              color: "#f8fafc",
              borderRadius: 18,
              padding: "15px 16px",
              fontSize: 16,
              outline: "none",
            }}
          />
          <button
            type="button"
            onClick={enter}
            style={{
              border: 0,
              background: "#ffdc68",
              color: "#10131a",
              borderRadius: 999,
              padding: "13px 18px",
              fontWeight: 950,
              cursor: "pointer",
            }}
          >
            Enter Command
          </button>
        </div>

        <div style={{ marginTop: 18 }}>
          <Link
            href="/command"
            style={{
              border: "1px solid rgba(207,216,230,.18)",
              background: "#171c29",
              color: "#f7f7fb",
              borderRadius: 999,
              padding: "13px 18px",
              fontWeight: 950,
              textDecoration: "none",
              display: "inline-block",
            }}
          >
            Open Command
          </Link>
        </div>
      </section>
    </main>
  );
}
