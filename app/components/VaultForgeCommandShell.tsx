"use client";

import Link from "next/link";
import { ReactNode } from "react";

type Props = {
  title?: string;
  subtitle?: string;
  active?: string;
  children: ReactNode;
};

const navItems = [
  ["Command", "/dashboard", "dashboard"],
  ["Opportunity", "/opportunity-rooms", "opportunity"],
  ["Pressure", "/pressure-rooms", "pressure"],
  ["Intelligence", "/intelligence", "intelligence"],
  ["Routing", "/routing-inbox", "routing"],
  ["Alerts", "/alerts?lane=new", "alerts"],
  ["Messages", "/message-command", "messages"],
  ["Network", "/network", "network"],
  ["Profile", "/profile", "profile"],
];

const tickerItems = [
  "CAPITAL SIGNALS ACTIVE",
  "PRESSURE ROOMS MONITORED",
  "BUYER FIT ENGINE ONLINE",
  "OPERATOR GAPS TRACKED",
  "PRIVATE MARKET INTELLIGENCE LIVE",
  "ROUTING OVERLAP IS INTENTIONAL",
  "MONEY • INTELLIGENCE • SYNERGY • EXECUTION",
];

export default function VaultForgeCommandShell({
  title = "VaultForge Command",
  subtitle = "Private market intelligence, routing, and execution infrastructure.",
  active = "dashboard",
  children,
}: Props) {
  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, rgba(232,196,107,.13), transparent 30%), radial-gradient(circle at 88% 8%, rgba(248,113,113,.10), transparent 25%), radial-gradient(circle at 50% 45%, rgba(86,216,255,.08), transparent 36%), linear-gradient(180deg,#020617,#071326 55%,#020617)",
        color: "white",
        padding: "18px 14px 96px",
        fontFamily: "Arial, sans-serif",
        overflowX: "hidden",
      }}
    >
      <style>{`
        a:hover, button:hover {
          transform: translateY(-1px);
          transition: all .18s ease;
          filter: brightness(1.08);
        }

        @keyframes vfTicker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        @keyframes vfPulse {
          0% { box-shadow: 0 0 0 0 rgba(57,255,20,.32); }
          55% { box-shadow: 0 0 0 9px rgba(57,255,20,0); }
          100% { box-shadow: 0 0 0 0 rgba(57,255,20,0); }
        }

        @media(max-width:760px) {
          .vf-shell-grid {
            grid-template-columns: 1fr !important;
          }

          .vf-shell-nav {
            display: grid !important;
            grid-template-columns: repeat(2,minmax(0,1fr)) !important;
          }

          .vf-shell-nav a {
            width: 100%;
            box-sizing: border-box;
          }

          .vf-shell-title {
            font-size: 52px !important;
          }
        }
      `}</style>

      <div style={{ width: "min(1240px,100%)", margin: "0 auto" }}>
        <section
          style={{
            border: "1px solid rgba(232,196,107,.24)",
            borderRadius: 30,
            overflow: "hidden",
            background:
              "linear-gradient(145deg,rgba(255,255,255,.075),rgba(255,255,255,.030))",
            boxShadow: "0 30px 90px rgba(0,0,0,.38)",
            marginBottom: 18,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "18px 18px 12px",
              borderBottom: "1px solid rgba(255,255,255,.08)",
              flexWrap: "wrap",
            }}
          >
            <Link
              href="/dashboard"
              style={{
                width: 58,
                height: 58,
                borderRadius: 18,
                border: "1px solid rgba(232,196,107,.42)",
                display: "grid",
                placeItems: "center",
                color: "#e8c46b",
                textDecoration: "none",
                fontWeight: 1000,
                letterSpacing: "-.08em",
                fontSize: 22,
                background:
                  "radial-gradient(circle at 30% 20%, rgba(232,196,107,.28), transparent 34%), rgba(2,6,23,.72)",
                boxShadow: "0 0 28px rgba(232,196,107,.12)",
              }}
            >
              VF
            </Link>

            <div style={{ flex: 1, minWidth: 240 }}>
              <div
                style={{
                  color: "#e8c46b",
                  letterSpacing: ".22em",
                  textTransform: "uppercase",
                  fontWeight: 950,
                  fontSize: 12,
                }}
              >
                VaultForge Private Intelligence Network
              </div>

              <div
                style={{
                  color: "#cbd5e1",
                  fontSize: 13,
                  marginTop: 4,
                  lineHeight: 1.45,
                }}
              >
                Money • Intelligence • Synergy • Execution
              </div>
            </div>

            <div
              style={{
                border: "1px solid rgba(57,255,20,.26)",
                color: "#39ff14",
                background: "rgba(57,255,20,.07)",
                borderRadius: 999,
                padding: "9px 12px",
                fontWeight: 950,
                animation: "vfPulse 1.8s ease-in-out infinite",
                fontSize: 13,
              }}
            >
              LIVE COMMAND
            </div>
          </div>

          <div
            style={{
              overflow: "hidden",
              borderBottom: "1px solid rgba(255,255,255,.08)",
              background: "rgba(2,6,23,.55)",
              whiteSpace: "nowrap",
            }}
          >
            <div
              style={{
                display: "inline-flex",
                gap: 34,
                padding: "10px 0",
                animation: "vfTicker 30s linear infinite",
                minWidth: "200%",
              }}
            >
              {[...tickerItems, ...tickerItems, ...tickerItems, ...tickerItems].map((item, index) => (
                <span
                  key={`${item}-${index}`}
                  style={{
                    color: index % 3 === 0 ? "#39ff14" : index % 3 === 1 ? "#f8e7b0" : "#56d8ff",
                    fontSize: 12,
                    fontWeight: 950,
                    letterSpacing: ".16em",
                    textTransform: "uppercase",
                  }}
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div
            className="vf-shell-nav"
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              padding: 14,
            }}
          >
            {navItems.map(([name, href, key]) => (
              <Link
                key={key}
                href={href}
                style={{
                  border:
                    active === key
                      ? "1px solid rgba(232,196,107,.72)"
                      : "1px solid rgba(255,255,255,.12)",
                  borderRadius: 999,
                  padding: "10px 12px",
                  color: active === key ? "#06100a" : "white",
                  background:
                    active === key
                      ? "linear-gradient(135deg,#f8e7b0,#e8c46b)"
                      : "rgba(255,255,255,.045)",
                  textDecoration: "none",
                  fontWeight: 950,
                  fontSize: 13,
                }}
              >
                {name}
              </Link>
            ))}
          </div>
        </section>

        <section
          style={{
            border: "1px solid rgba(232,196,107,.22)",
            borderRadius: 30,
            padding: 24,
            background:
              "linear-gradient(145deg,rgba(255,255,255,.070),rgba(255,255,255,.030))",
            boxShadow: "0 24px 80px rgba(0,0,0,.30)",
            marginBottom: 18,
          }}
        >
          <div
            style={{
              color: "#e8c46b",
              letterSpacing: ".18em",
              textTransform: "uppercase",
              fontWeight: 950,
              fontSize: 12,
            }}
          >
            Institutional Command Layer
          </div>

          <h1
            className="vf-shell-title"
            style={{
              fontSize: "clamp(56px,10vw,112px)",
              lineHeight: 0.86,
              letterSpacing: "-.078em",
              margin: "12px 0 16px",
            }}
          >
            {title}
          </h1>

          <p
            style={{
              color: "#cbd5e1",
              lineHeight: 1.65,
              fontSize: 20,
              margin: 0,
              maxWidth: 980,
            }}
          >
            {subtitle}
          </p>
        </section>

        {children}
      </div>
    </main>
  );
}
