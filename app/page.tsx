"use client";

import Link from "next/link";

export default function HomePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, rgba(245,197,66,.16), transparent 30%), radial-gradient(circle at top right, rgba(190,18,60,.18), transparent 26%), linear-gradient(180deg,#02040a,#071018 48%,#02040a)",
        color: "#f8fafc",
        fontFamily: "Inter, Arial, sans-serif",
        padding: 20,
      }}
    >
      <div style={{ maxWidth: 1440, margin: "0 auto" }}>
        <nav
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
            marginBottom: 24,
          }}
        >
          <div
            style={{
              color: "#ffdc68",
              fontWeight: 900,
              fontSize: 30,
            }}
          >
            VAULTFORGE
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link href="/member-access" style={goldBtn}>
              Request Member Access
            </Link>

            <Link href="/investor-access" style={goldBtn}>
              Investor Room Access
            </Link>

            <Link href="/login" style={btn}>
              Members Login
            </Link>

            <Link href="/admin" style={btn}>
              Admin
            </Link>
          </div>
        </nav>

        <section
          style={{
            border: "1px solid rgba(245,197,66,.28)",
            borderRadius: 34,
            padding: "56px 32px",
            background:
              "radial-gradient(circle at top right, rgba(245,197,66,.18), transparent 34%), radial-gradient(circle at bottom left, rgba(255,45,60,.12), transparent 32%), linear-gradient(180deg,#080d19,#050816)",
            boxShadow: "0 0 55px rgba(245,197,66,.08)",
            marginBottom: 24,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: 34,
            }}
          >
            <img
              src="/vaultforge-logo.png"
              alt="VaultForge"
              style={{
                width: "100%",
                maxWidth: 520,
                height: "auto",
                objectFit: "contain",
                display: "block",
                filter: "drop-shadow(0 0 30px rgba(245,197,66,.25))",
              }}
            />
          </div>

          <div
            style={{
              color: "#ffdc68",
              textTransform: "uppercase",
              letterSpacing: 6,
              fontWeight: 900,
              fontSize: 12,
              marginBottom: 14,
            }}
          >
            VaultForge Intelligence
          </div>

          <h1
            style={{
              fontSize: "clamp(48px,8vw,104px)",
              lineHeight: ".9",
              letterSpacing: "-5px",
              margin: "0 0 22px",
              fontWeight: 950,
              maxWidth: 1100,
            }}
          >
            Private real estate intelligence.
          </h1>

          <p
            style={{
              color: "#cbd5e1",
              fontSize: "clamp(20px,2vw,28px)",
              lineHeight: 1.35,
              maxWidth: 1100,
            }}
          >
            VaultForge is a private real estate execution network where approved members post Deal Opportunities and Pain Signals, and approved investors can request information, funding help, owner contact, or routed execution without seeing the private member directory.
          </p>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 28 }}>
            <Link href="/member-access" style={goldBtn}>
              Request Member Access
            </Link>

            <Link href="/investor-access" style={goldBtn}>
              Investor Room Access
            </Link>

            <Link href="/login" style={btn}>
              Members Login
            </Link>

            <Link href="/investor-login" style={btn}>
              Investor Login
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

const btn = {
  border: "1px solid rgba(207,216,230,.18)",
  background: "#171c29",
  color: "#f7f7fb",
  borderRadius: 999,
  padding: "13px 18px",
  fontWeight: 900,
  textDecoration: "none",
};

const goldBtn = {
  ...btn,
  background: "#ffdc68",
  color: "#10131a",
  border: 0,
};
