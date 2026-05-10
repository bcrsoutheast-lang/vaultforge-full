
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export const dynamic = "force-dynamic";

function clearCookie(name: string) {
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
}

export default function ResetIdentityPage() {
  const [done, setDone] = useState(false);

  useEffect(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();

      [
        "vf_email",
        "vf_member_email",
        "vf_login_email",
        "vf_member_login",
        "vf_admin",
        "vf_admin_email",
        "isAdmin",
        "vf_auth_user_id",
        "vf_auth_access_token",
        "vf_auth_refresh_token",
        "test_email",
        "demo_email",
        "vf_demo_email",
        "vf_test_email",
      ].forEach(clearCookie);
    } catch {}

    setDone(true);
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
          Browser identity cleared.
        </h1>

        <p style={{ color: "rgba(255,255,255,.72)", lineHeight: 1.6 }}>
          {done
            ? "Local storage, session storage, and VaultForge identity cookies were cleared in this browser."
            : "Clearing browser identity..."}
        </p>

        <Link
          href="/login"
          style={{
            display: "inline-flex",
            marginTop: 18,
            borderRadius: 999,
            padding: "14px 18px",
            background: "linear-gradient(135deg,#f5d978,#9df3bf 55%,#b55cff)",
            color: "#06101e",
            textDecoration: "none",
            fontWeight: 950,
          }}
        >
          Go To Clean Login
        </Link>
      </section>
    </main>
  );
}
