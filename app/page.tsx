"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const DEADLINE = "2026-05-22T23:59:59-04:00";
const FOUNDER_LIMIT = 50;

function countdown() {
  const target = new Date(DEADLINE).getTime();
  const now = Date.now();
  const diff = Math.max(0, target - now);

  return {
    expired: diff <= 0,
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

const signals = [
  "Funding pressure detected · Atlanta",
  "Buyer route matched · Cartersville",
  "Operator requested · Tampa",
  "Land development signal · Nashville",
  "Distress seller routed · Charlotte",
  "Capital stack needed · Dallas",
];

export default function HomePage() {
  const [time, setTime] = useState(countdown());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(countdown());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const founderOpen = !time.expired;

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, rgba(232,196,107,.20), transparent 28%), radial-gradient(circle at top right, rgba(255,50,50,.14), transparent 22%), linear-gradient(180deg,#010101 0%,#071326 50%,#020202 100%)",
        color: "white",
        fontFamily: "Arial, sans-serif",
        padding: "20px 16px 120px",
      }}
    >
      <style>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        .ticker-track {
          display:flex;
          width:max-content;
          animation:ticker 35s linear infinite;
        }

        .glass {
          border:1px solid rgba(232,196,107,.18);
          background:linear-gradient(145deg,rgba(255,255,255,.05),rgba(255,255,255,.02));
          backdrop-filter: blur(12px);
          box-shadow:0 24px 90px rgba(0,0,0,.34);
        }

        .btn:hover {
          transform:translateY(-1px);
          filter:brightness(1.06);
        }

        @media (max-width: 900px) {
          .hero-grid,
          .preview-grid,
          .stats-grid,
          .lock-grid {
            grid-template-columns:1fr !important;
          }

          .action-grid {
            grid-template-columns:1fr !important;
          }

          .logo-main {
            width:90vw !important;
          }
        }
      `}</style>

      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div
          className="glass"
          style={{
            borderRadius: 999,
            overflow: "hidden",
            marginBottom: 18,
            padding: "10px 0",
          }}
        >
          <div className="ticker-track">
            {[...signals, ...signals].map((signal, index) => (
              <div
                key={index}
                style={{
                  whiteSpace: "nowrap",
                  padding: "0 34px",
                  color: index % 2 ? "#e8c46b" : "#9df3bf",
                  fontWeight: 900,
                  letterSpacing: ".08em",
                  textTransform: "uppercase",
                  fontSize: 12,
                }}
              >
                ● {signal}
              </div>
            ))}
          </div>
        </div>

        <section
          className="glass"
          style={{
            borderRadius: 40,
            padding: 30,
            marginBottom: 22,
          }}
        >
          <div
            className="hero-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "1.1fr .9fr",
              gap: 24,
              alignItems: "center",
            }}
          >
            <div>
              <div
                style={{
                  color: "#e8c46b",
                  letterSpacing: ".28em",
                  fontWeight: 900,
                  fontSize: 12,
                  textTransform: "uppercase",
                }}
              >
                Private AI Real Estate Intelligence Network
              </div>

              <img
                className="logo-main"
                src="/vaultforge-logo.png"
                alt="VaultForge"
                style={{
                  width: 500,
                  maxWidth: "100%",
                  marginTop: 18,
                  marginBottom: 12,
                  borderRadius: 30,
                }}
              />

              <h1
                style={{
                  fontSize: "clamp(52px,10vw,118px)",
                  lineHeight: .88,
                  margin: "10px 0",
                  letterSpacing: "-.06em",
                }}
              >
                Signals.
                <br />
                Routing.
                <br />
                Execution.
              </h1>

              <p
                style={{
                  color: "rgba(255,255,255,.78)",
                  fontSize: 22,
                  lineHeight: 1.5,
                  maxWidth: 760,
                }}
              >
                VaultForge transforms deals, distress, capital gaps, operators,
                contractors, lenders, and investor demand into one AI-powered
                execution ecosystem.
              </p>

              <div
                className="action-grid"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3,minmax(0,1fr))",
                  gap: 12,
                  marginTop: 24,
                }}
              >
                <Link
                  href="/profile"
                  className="btn"
                  style={{
                    display: "grid",
                    placeItems: "center",
                    minHeight: 62,
                    borderRadius: 999,
                    textDecoration: "none",
                    fontWeight: 1000,
                    background:
                      "linear-gradient(135deg,#ff4d3d,#e8c46b,#9df3bf)",
                    color: "#07100a",
                  }}
                >
                  Founding Member Access
                </Link>

                <Link
                  href="/login"
                  className="btn"
                  style={{
                    display: "grid",
                    placeItems: "center",
                    minHeight: 62,
                    borderRadius: 999,
                    textDecoration: "none",
                    fontWeight: 900,
                    background: "rgba(255,255,255,.06)",
                    border: "1px solid rgba(255,255,255,.16)",
                    color: "white",
                  }}
                >
                  Member Login
                </Link>

                <a
                  href="#preview"
                  className="btn"
                  style={{
                    display: "grid",
                    placeItems: "center",
                    minHeight: 62,
                    borderRadius: 999,
                    textDecoration: "none",
                    fontWeight: 900,
                    background: "rgba(255,255,255,.06)",
                    border: "1px solid rgba(255,255,255,.16)",
                    color: "white",
                  }}
                >
                  Preview Command Center
                </a>
              </div>
            </div>

            <div
              style={{
                border: "1px solid rgba(255,72,58,.24)",
                borderRadius: 34,
                padding: 24,
                background:
                  "linear-gradient(145deg,rgba(255,72,58,.08),rgba(232,196,107,.08),rgba(255,255,255,.03))",
              }}
            >
              <div
                style={{
                  color: "#ff5c54",
                  letterSpacing: ".24em",
                  fontWeight: 900,
                  fontSize: 12,
                  textTransform: "uppercase",
                }}
              >
                Founder Window
              </div>

              <h2
                style={{
                  fontSize: 52,
                  lineHeight: .9,
                  margin: "16px 0",
                }}
              >
                First 50 founders
                <br />
                or May 22.
              </h2>

              <div
                className="stats-grid"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4,1fr)",
                  gap: 10,
                  marginBottom: 18,
                }}
              >
                {[
                  ["Days", time.days],
                  ["Hours", time.hours],
                  ["Min", time.minutes],
                  ["Sec", time.seconds],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    style={{
                      borderRadius: 20,
                      padding: 14,
                      textAlign: "center",
                      background: "rgba(255,255,255,.05)",
                      border: "1px solid rgba(255,255,255,.10)",
                    }}
                  >
                    <div style={{ fontSize: 38, fontWeight: 1000 }}>
                      {String(value).padStart(2, "0")}
                    </div>
                    <div
                      style={{
                        color: "rgba(255,255,255,.64)",
                        fontSize: 12,
                        fontWeight: 900,
                      }}
                    >
                      {label}
                    </div>
                  </div>
                ))}
              </div>

              <div
                style={{
                  borderRadius: 24,
                  padding: 18,
                  background: "rgba(0,0,0,.20)",
                  border: "1px solid rgba(255,255,255,.10)",
                }}
              >
                <div
                  style={{
                    color: "#9df3bf",
                    fontWeight: 1000,
                    fontSize: 18,
                  }}
                >
                  {founderOpen
                    ? "$49 for first 2 months"
                    : "$99 for first 2 months"}
                </div>

                <div
                  style={{
                    color: "rgba(255,255,255,.72)",
                    marginTop: 6,
                  }}
                >
                  Then $299/month after official launch.
                </div>

                <div
                  style={{
                    marginTop: 14,
                    color: "#f8e7b0",
                    fontWeight: 900,
                  }}
                >
                  Founder seats remaining: {FOUNDER_LIMIT}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          className="stats-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4,1fr)",
            gap: 16,
            marginBottom: 22,
          }}
        >
          {[
            ["Members", "50"],
            ["Deal Rooms", "128"],
            ["Pain Signals", "312"],
            ["AI Routes", "1,940"],
          ].map(([title, value]) => (
            <div
              key={title}
              className="glass"
              style={{
                borderRadius: 28,
                padding: 22,
              }}
            >
              <div
                style={{
                  color: "#9df3bf",
                  letterSpacing: ".18em",
                  fontWeight: 900,
                  fontSize: 12,
                  textTransform: "uppercase",
                }}
              >
                {title}
              </div>

              <div
                style={{
                  fontSize: 58,
                  lineHeight: 1,
                  marginTop: 14,
                  fontWeight: 1000,
                }}
              >
                {value}
              </div>
            </div>
          ))}
        </section>

        <section
          id="preview"
          className="glass"
          style={{
            borderRadius: 40,
            padding: 30,
            marginBottom: 22,
          }}
        >
          <div
            style={{
              color: "#e8c46b",
              letterSpacing: ".28em",
              fontWeight: 900,
              fontSize: 12,
              textTransform: "uppercase",
            }}
          >
            Preview Members Command Center
          </div>

          <h2
            style={{
              fontSize: "clamp(46px,8vw,90px)",
              lineHeight: .9,
              margin: "14px 0",
            }}
          >
            See the machine before
            <br />
            you enter it.
          </h2>

          <p
            style={{
              color: "rgba(255,255,255,.74)",
              fontSize: 20,
              maxWidth: 900,
              lineHeight: 1.5,
            }}
          >
            Public preview only. Real members gain access after profile
            training and activation.
          </p>

          <div
            className="preview-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 18,
              marginTop: 24,
            }}
          >
            <div
              style={{
                borderRadius: 30,
                overflow: "hidden",
                border: "1px solid rgba(232,196,107,.18)",
                background:
                  "linear-gradient(145deg,rgba(255,255,255,.06),rgba(255,255,255,.02))",
              }}
            >
              <div
                style={{
                  padding: 18,
                  borderBottom: "1px solid rgba(255,255,255,.08)",
                }}
              >
                <div
                  style={{
                    color: "#9df3bf",
                    fontWeight: 900,
                    fontSize: 12,
                    letterSpacing: ".18em",
                    textTransform: "uppercase",
                  }}
                >
                  Smart AI Workstations
                </div>

                <div
                  style={{
                    marginTop: 10,
                    fontSize: 34,
                    fontWeight: 1000,
                  }}
                >
                  Live deal routing
                </div>
              </div>

              <div style={{ padding: 18 }}>
                {[1,2,3].map((item) => (
                  <div
                    key={item}
                    style={{
                      borderRadius: 22,
                      padding: 18,
                      marginBottom: 14,
                      background:
                        "linear-gradient(145deg,rgba(232,196,107,.09),rgba(255,255,255,.03))",
                      border: "1px solid rgba(255,255,255,.08)",
                    }}
                  >
                    <div
                      style={{
                        color: "#e8c46b",
                        fontWeight: 900,
                        fontSize: 12,
                        letterSpacing: ".18em",
                        textTransform: "uppercase",
                      }}
                    >
                      AI Background Intelligence
                    </div>

                    <div
                      style={{
                        marginTop: 10,
                        fontSize: 28,
                        fontWeight: 1000,
                      }}
                    >
                      Cartersville Retail Redevelopment
                    </div>

                    <div
                      style={{
                        marginTop: 12,
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 8,
                      }}
                    >
                      {["Funding Gap","Buyer Route","High Pressure"].map((chip) => (
                        <div
                          key={chip}
                          style={{
                            padding: "8px 12px",
                            borderRadius: 999,
                            background: "rgba(157,243,191,.08)",
                            border: "1px solid rgba(157,243,191,.18)",
                            color: "#9df3bf",
                            fontSize: 12,
                            fontWeight: 900,
                          }}
                        >
                          {chip}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div
              style={{
                borderRadius: 30,
                padding: 22,
                border: "1px solid rgba(255,255,255,.08)",
                background:
                  "linear-gradient(145deg,rgba(255,72,58,.08),rgba(255,255,255,.03))",
              }}
            >
              <div
                style={{
                  color: "#ff5c54",
                  letterSpacing: ".18em",
                  fontWeight: 900,
                  fontSize: 12,
                  textTransform: "uppercase",
                }}
              >
                Locked Member Area
              </div>

              <div
                style={{
                  marginTop: 12,
                  fontSize: 40,
                  lineHeight: .92,
                  fontWeight: 1000,
                }}
              >
                Members can see
                <br />
                the ecosystem.
              </div>

              <div
                style={{
                  color: "rgba(255,255,255,.74)",
                  marginTop: 14,
                  fontSize: 18,
                  lineHeight: 1.5,
                }}
              >
                Before activation, the command center stays visually visible
                but functionally locked. Only profile training and payment are active.
              </div>

              <div
                className="lock-grid"
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                  marginTop: 22,
                }}
              >
                {[
                  "Smart AI",
                  "Messages",
                  "Projects",
                  "Pain Feed",
                  "Signals",
                  "Routing",
                ].map((item) => (
                  <div
                    key={item}
                    style={{
                      borderRadius: 18,
                      padding: 18,
                      background: "rgba(255,255,255,.04)",
                      border: "1px solid rgba(255,255,255,.10)",
                      opacity: .55,
                    }}
                  >
                    🔒 {item}
                  </div>
                ))}
              </div>

              <div
                style={{
                  display: "grid",
                  gap: 12,
                  marginTop: 22,
                }}
              >
                <div
                  style={{
                    borderRadius: 999,
                    minHeight: 56,
                    display: "grid",
                    placeItems: "center",
                    fontWeight: 1000,
                    background:
                      "linear-gradient(135deg,#e8c46b,#9df3bf)",
                    color: "#07100a",
                  }}
                >
                  Train Your Signal Profile
                </div>

                <div
                  style={{
                    borderRadius: 999,
                    minHeight: 56,
                    display: "grid",
                    placeItems: "center",
                    fontWeight: 1000,
                    background:
                      "linear-gradient(135deg,#ff4d3d,#8f1111)",
                    color: "white",
                  }}
                >
                  Activate Access
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
