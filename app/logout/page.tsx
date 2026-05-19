"use client";

import { useEffect } from "react";
import Link from "next/link";

const PRESERVE_PREFIXES = [
  "vaultforge_clean_deal_room_",
  "vaultforge_deal_room_",
  "vf_deal_room_",
  "vaultforge_clean_pain_room_",
  "vaultforge_pain_room_",
  "vf_pain_room_",
];

const PRESERVE_KEYS = [
  "vaultforge_clean_deal_rooms",
  "vaultforge_deal_rooms",
  "vaultforge_rooms_deals",
  "vf_deal_rooms",
  "vaultforge_clean_pain_rooms_v1",
  "vaultforge_clean_pain_rooms",
  "vaultforge_pain_rooms",
  "vaultforge_rooms_pain",
  "vf_pain_rooms",
  "vaultforge_clean_room_states",
  "vaultforge_room_states",
  "vaultforge_deal_room_states",
  "vaultforge_pain_room_states",
  "vaultforge_5s_room_states",
  "vaultforge_room_alert_read_v1",
  "vaultforge_profile",
  "vaultforge_member_profile",
  "vaultforge_clean_profile",
];

function shouldPreserve(key: string) {
  return PRESERVE_KEYS.includes(key) || PRESERVE_PREFIXES.some((prefix) => key.startsWith(prefix));
}

export default function LogoutPage() {
  useEffect(() => {
    try {
      const preserved: Record<string, string> = {};

      for (let i = 0; i < window.localStorage.length; i += 1) {
        const key = window.localStorage.key(i) || "";
        if (shouldPreserve(key)) {
          const value = window.localStorage.getItem(key);
          if (value !== null) preserved[key] = value;
        }
      }

      window.localStorage.clear();

      Object.entries(preserved).forEach(([key, value]) => {
        window.localStorage.setItem(key, value);
      });

      document.cookie.split(";").forEach((cookie) => {
        const name = cookie.split("=")[0]?.trim();
        if (!name) return;
        document.cookie = `${name}=; Max-Age=0; path=/`;
      });
    } catch {
      // Keep logout safe even if browser storage is blocked.
    }

    window.location.href = "/login";
  }, []);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#05070d",
        color: "#f7f7fb",
        padding: 24,
        fontFamily:
          "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
      }}
    >
      <section
        style={{
          maxWidth: 900,
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
          Logout
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
          Signing out.
        </h1>
        <p style={{ color: "#c9d0dc", fontSize: 21, lineHeight: 1.35 }}>
          Room data is preserved. You are being sent back to login.
        </p>
        <Link
          href="/login"
          style={{
            marginTop: 22,
            display: "inline-block",
            border: 0,
            background: "#ffdc68",
            color: "#10131a",
            borderRadius: 999,
            padding: "13px 18px",
            fontWeight: 950,
            textDecoration: "none",
          }}
        >
          Continue
        </Link>
      </section>
    </main>
  );
}
