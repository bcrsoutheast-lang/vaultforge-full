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
  "PRIVATE MARKET INTELLIGENCE LIVE",
  "MONEY • INTELLIGENCE • SYNERGY • EXECUTION",
  "BUYER DEMAND MONITORED",
  "CAPITAL SIGNALS ACTIVE",
  "PRESSURE ROOMS TRACKED",
  "OPERATOR GAPS IDENTIFIED",
  "AI ROUTING LAYER ONLINE",
  "5S WORKFLOW DISCIPLINE ACTIVE",
  "EXECUTION VELOCITY MATTERS",
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
          "radial-gradient(circle at 12% 4%, rgba(232,196,107,.20), transparent 28%), radial-gradient(circle at 92% 10%, rgba(248,45,45,.14), transparent 26%), radial-gradient(circle at 50% 38%, rgba(56,189,248,.10), transparent 42%), linear-gradient(180deg,#020305,#050b14 46%,#020305)",
        color: "white",
        padding: "18px 14px 96px",
        fontFamily:
          "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Arial, sans-serif",
        overflowX: "hidden",
      }}
    >
      <style>{`
        a, button {
          -webkit-tap-highlight-color: transparent;
        }

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

        @keyframes vfScan {
          0% { opacity: .12; transform: translateY(-20%); }
          50% { opacity: .25; }
          100% { opacity: .12; transform: translateY(20%); }
        }

        .vf-shell-glass {
          position: relative;
          isolation: isolate;
        }

        .vf-shell-glass:before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: inherit;
          pointer-events: none;
          background:
            linear-gradient(120deg,rgba(255,255,255,.08),transparent 24%,transparent 72%,rgba(232,196,107,.08)),
            repeating-linear-gradient(180deg,rgba(255,255,255,.025) 0,rgba(255,255,255,.025) 1px,transparent 1px,transparent 7px);
          mix-blend-mode: screen;
          opacity: .55;
          z-index: -1;
        }

        @media(max-width:760px) {
          .vf-shell-nav {
            display: grid !important;
            grid-template-columns: repeat(2,minmax(0,1fr)) !important;
          }

          .vf-shell-nav a {
            width: 100%;
            box-sizing: border-box;
            justify-content: center;
          }

          .vf-shell-title {
            font-size: 50px !important;
            letter-spacing: -.07em !important;
          }

          .vf-shell-top {
            align-items: flex-start !important;
          }

          .vf-shell-brand-logo {
            width: 72px !important;
            height: 72px !important;
          }
        }
      `}</style>

      <div style={{ width: "min(1240px,100%)", margin: "0 auto" }}>
        <section
          className="vf-shell-glass"
          style={{
            border: "1px solid rgba(232,196,107,.32)",
            borderRadius: 34,
            overflow: "hidden",
            background:
              "linear-gradient(145deg,rgba(255,255,255,.080),rgba(255,255,255,.026))",
            boxShadow:
              "0 36px 120px rgba(0,0,0,.50), inset 0 1px 0 rgba(255,255,255,.08)",
            marginBottom: 18,
          }}
        >
          <div
            className="vf-shell-top"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              padding: "18px",
              borderBottom: "1px solid rgba(255,255,255,.09)",
              flexWrap: "wrap",
              background:
                "radial-gradient(circle at top left,rgba(232,196,107,.18),transparent 34%),rgba(2,6,23,.50)",
            }}
          >
            <Link
              href="/dashboard"
              className="vf-shell-brand-logo"
              style={{
                width: 86,
                height: 86,
                borderRadius: 24,
                border: "1px solid rgba(232,196,107,.50)",
                display: "grid",
                placeItems: "center",
                color: "#e8c46b",
                textDecoration: "none",
                fontWeight: 1000,
                letterSpacing: "-.09em",
                fontSize: 32,
                background:
                  "radial-gradient(circle at 30% 20%, rgba(232,196,107,.34), transparent 34%), linear-gradient(145deg,#080b10,#020305)",
                boxShadow:
                  "0 0 34px rgba(232,196,107,.16), inset 0 0 26px rgba(232,196,107,.09)",
              }}
            >
              VF
            </Link>

            <div style={{ flex: 1, minWidth: 245 }}>
              <div
                style={{
                  color: "#e8c46b",
                  letterSpacing: ".24em",
                  textTransform: "uppercase",
                  fontWeight: 950,
                  fontSize: 12,
                }}
              >
                VaultForge Private Intelligence Network
              </div>

              <div
                style={{
                  color: "#f8fafc",
                  fontSize: 22,
                  marginTop: 6,
                  fontWeight: 900,
                  letterSpacing: "-.03em",
                }}
              >
                Money. Intelligence. Synergy. Execution.
              </div>

              <div
                style={{
                  color: "#94a3b8",
                  fontSize: 13,
                  marginTop: 5,
                  lineHeight: 1.45,
                  maxWidth: 700,
                }}
              >
                Private deal flow command center for operators, capital, pressure, routing, and execution discipline.
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gap: 8,
                justifyItems: "end",
              }}
            >
              <div
                style={{
                  border: "1px solid rgba(57,255,20,.32)",
                  color: "#39ff14",
                  background: "rgba(57,255,20,.08)",
                  borderRadius: 999,
                  padding: "10px 14px",
                  fontWeight: 950,
                  animation: "vfPulse 1.8s ease-in-out infinite",
                  fontSize: 13,
                  whiteSpace: "nowrap",
                }}
              >
                LIVE COMMAND
              </div>

              <div
                style={{
                  border: "1px solid rgba(232,196,107,.22)",
                  color: "#f8e7b0",
                  background: "rgba(232,196,107,.07)",
                  borderRadius: 999,
                  padding: "8px 12px",
                  fontWeight: 900,
                  fontSize: 12,
                  whiteSpace: "nowrap",
                }}
              >
                Bloomberg-sidekick mode
              </div>
            </div>
          </div>

          <div
            style={{
              overflow: "hidden",
              borderBottom: "1px solid rgba(255,255,255,.09)",
              background: "linear-gradient(90deg,rgba(2,6,23,.72),rgba(9,14,24,.82),rgba(2,6,23,.72))",
              whiteSpace: "nowrap",
            }}
          >
            <div
              style={{
                display: "inline-flex",
                gap: 40,
                padding: "11px 0",
                animation: "vfTicker 32s linear infinite",
                minWidth: "200%",
              }}
            >
              {[...tickerItems, ...tickerItems, ...tickerItems, ...tickerItems].map((item, index) => (
                <span
                  key={`${item}-${index}`}
                  style={{
                    color:
                      index % 4 === 0
                        ? "#39ff14"
                        : index % 4 === 1
                          ? "#f8e7b0"
                          : index % 4 === 2
                            ? "#56d8ff"
                            : "#fb7185",
                    fontSize: 12,
                    fontWeight: 950,
                    letterSpacing: ".17em",
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
              gap: 9,
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
                      ? "1px solid rgba(232,196,107,.78)"
                      : "1px solid rgba(255,255,255,.13)",
                  borderRadius: 999,
                  padding: "11px 13px",
                  color: active === key ? "#06100a" : "white",
                  background:
                    active === key
                      ? "linear-gradient(135deg,#f8e7b0,#e8c46b)"
                      : "linear-gradient(180deg,rgba(255,255,255,.060),rgba(255,255,255,.028))",
                  textDecoration: "none",
                  fontWeight: 950,
                  fontSize: 13,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  boxShadow:
                    active === key ? "0 0 24px rgba(232,196,107,.20)" : "none",
                }}
              >
                {active === key ? "●" : "○"} {name}
              </Link>
            ))}
          </div>
        </section>

        <section
          className="vf-shell-glass"
          style={{
            border: "1px solid rgba(232,196,107,.25)",
            borderRadius: 34,
            padding: 26,
            background:
              "radial-gradient(circle at top left, rgba(232,196,107,.13), transparent 34%), linear-gradient(145deg,rgba(255,255,255,.072),rgba(255,255,255,.030))",
            boxShadow: "0 28px 90px rgba(0,0,0,.36)",
            marginBottom: 18,
          }}
        >
          <div
            style={{
              color: "#e8c46b",
              letterSpacing: ".20em",
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
              fontSize: "clamp(56px,10vw,118px)",
              lineHeight: 0.84,
              letterSpacing: "-.082em",
              margin: "12px 0 16px",
              maxWidth: 1080,
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
