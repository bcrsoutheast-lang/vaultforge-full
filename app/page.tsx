"use client";

import Link from "next/link";

export default function HomePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, rgba(214,170,62,.20), transparent 34%), radial-gradient(circle at 80% 10%, rgba(157,243,191,.13), transparent 26%), linear-gradient(180deg, #030509 0%, #071326 58%, #030509 100%)",
        color: "white",
        fontFamily: "Arial, sans-serif",
        padding: "28px 18px 90px",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 14,
            marginBottom: 34,
          }}
        >
          <div style={{ color: "#e8c46b", fontWeight: 900, letterSpacing: 4 }}>
            VAULTFORGE
          </div>

          <div>
            <Link
              href="/login"
              style={{
                color: "white",
                textDecoration: "none",
                border: "1px solid rgba(255,255,255,.18)",
                borderRadius: 999,
                padding: "11px 16px",
                background: "rgba(255,255,255,.04)",
              }}
            >
              Member Login
            </Link>
          </div>
        </header>

        <section
          style={{
            textAlign: "center",
            border: "1px solid rgba(255,255,255,.16)",
            borderRadius: 34,
            padding: "34px 18px 42px",
            background:
              "linear-gradient(135deg, rgba(255,255,255,.08), rgba(255,255,255,.025))",
            boxShadow: "0 30px 90px rgba(0,0,0,.45)",
          }}
        >
          <img
            src="/vaultforge-logo.png"
            alt="VaultForge"
            style={{
              width: "100%",
              maxWidth: 620,
              borderRadius: 26,
              boxShadow: "0 25px 80px rgba(0,0,0,.55)",
              marginBottom: 30,
            }}
          />

          <div
            style={{
              color: "#9df3bf",
              letterSpacing: 5,
              fontWeight: 900,
              fontSize: 13,
              marginBottom: 14,
            }}
          >
            PRIVATE AI REAL ESTATE INTELLIGENCE NETWORK
          </div>

          <h1
            style={{
              fontSize: "clamp(48px, 11vw, 106px)",
              lineHeight: 0.88,
              letterSpacing: -3,
              margin: "0 auto 22px",
              maxWidth: 1020,
            }}
          >
            The command center for deals, capital, operators, and private opportunity.
          </h1>

          <p
            style={{
              color: "rgba(255,255,255,.76)",
              fontSize: "clamp(20px, 4vw, 29px)",
              lineHeight: 1.35,
              maxWidth: 920,
              margin: "0 auto 28px",
            }}
          >
            VaultForge uses AI-powered routing, smart match scoring, member buy boxes,
            deal rooms, and private network intelligence to move serious real estate
            opportunities to the people who can actually act on them.
          </p>

          <div>
            <Link
              href="/apply"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                background: "linear-gradient(135deg, #f4d47b, #9df3bf)",
                color: "#06101e",
                textDecoration: "none",
                borderRadius: 999,
                padding: "16px 24px",
                fontWeight: 950,
                fontSize: 17,
                margin: "8px",
              }}
            >
              Create Member Access
            </Link>

            <Link
              href="/dashboard"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                textDecoration: "none",
                border: "1px solid rgba(255,255,255,.22)",
                borderRadius: 999,
                padding: "16px 24px",
                fontWeight: 800,
                fontSize: 17,
                margin: "8px",
                background: "rgba(255,255,255,.04)",
              }}
            >
              Preview Member Command Center
            </Link>
          </div>
        </section>

        <section
          style={{
            marginTop: 26,
            border: "1px solid rgba(157,243,191,.24)",
            background:
              "linear-gradient(145deg, rgba(157,243,191,.08), rgba(255,255,255,.035))",
            borderRadius: 30,
            padding: 24,
          }}
        >
          <div
            style={{
              color: "#9df3bf",
              letterSpacing: 5,
              fontWeight: 900,
              fontSize: 13,
              marginBottom: 14,
            }}
          >
            WHAT VAULTFORGE IS
          </div>

          <h2
            style={{
              fontSize: "clamp(36px, 8vw, 76px)",
              lineHeight: 0.95,
              letterSpacing: -2,
              margin: "0 0 14px",
            }}
          >
            Not a listing site. A private real estate operating system.
          </h2>

          <p
            style={{
              color: "rgba(255,255,255,.68)",
              lineHeight: 1.55,
              fontSize: 20,
            }}
          >
            Members create deal rooms, train profiles, save acquisition targets,
            receive smart routing alerts, and connect with buyers, lenders,
            operators, contractors, developers, sellers, and partners.
          </p>
        </section>
      </div>
    </main>
  );
}
