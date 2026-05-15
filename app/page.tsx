"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const DEADLINE = "2026-05-22T23:59:59-04:00";
const FOUNDER_LIMIT = 50;

function getClock() {
  const end = new Date(DEADLINE).getTime();
  const now = Date.now();
  const diff = Math.max(0, end - now);

  return {
    expired: diff <= 0,
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  };
}

const signalFeed = [
  "AI detected distressed seller pressure in Georgia",
  "Private lender route opened for funding gap",
  "Operator match created for stalled project",
  "Buyer demand signal active in Southeast markets",
  "Off-market land opportunity entered command queue",
  "Contractor execution need surfaced from pain intake",
  "Capital partner fit score updated",
  "Member profile trained against live routing signals",
];

const previewCards = [
  {
    title: "Command Dashboard",
    tag: "AI OS",
    body: "Live operating desk for deals, pain, routes, messages, and next-best action.",
  },
  {
    title: "Smart AI Workstations",
    tag: "INTEL",
    body: "AI-ranked deal and pain rooms scored against member profiles and market reach.",
  },
  {
    title: "Signal Routing Map",
    tag: "ROUTE",
    body: "Pain, capital gaps, stalled execution, buyers, lenders, and operators routed into rooms.",
  },
  {
    title: "Member Network",
    tag: "NETWORK",
    body: "Profiles organized by base state, markets served, capabilities, needs, and execution fit.",
  },
  {
    title: "Execution Messages",
    tag: "COMMS",
    body: "Deal, pain, and route conversations stay attached to the right opportunity room.",
  },
];

export default function HomePage() {
  const [clock, setClock] = useState(getClock());
  const [founders] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setClock(getClock()), 1000);
    return () => clearInterval(timer);
  }, []);

  const founderOpen = !clock.expired && founders < FOUNDER_LIMIT;
  const founderLeft = Math.max(0, FOUNDER_LIMIT - founders);

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at 50% -10%, rgba(232,196,107,.20), transparent 30%), radial-gradient(circle at 88% 20%, rgba(255,0,0,.18), transparent 28%), radial-gradient(circle at 20% 55%, rgba(157,243,191,.08), transparent 24%), linear-gradient(180deg,#000 0%,#03070c 42%,#050100 100%)",
        color: "white",
        fontFamily: "Arial, sans-serif",
        overflow: "hidden",
      }}
    >
      <style>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        @keyframes glow {
          0%, 100% { opacity:.55; filter: blur(0px); }
          50% { opacity:1; filter: blur(.4px); }
        }

        @keyframes scan {
          0% { transform: translateY(-120%); opacity:0; }
          25% { opacity:.18; }
          100% { transform: translateY(240%); opacity:0; }
        }

        .glass {
          background: linear-gradient(145deg, rgba(255,255,255,.09), rgba(255,255,255,.025));
          border: 1px solid rgba(232,196,107,.18);
          box-shadow: inset 0 1px 0 rgba(255,255,255,.08), 0 35px 120px rgba(0,0,0,.44);
          backdrop-filter: blur(18px);
        }

        .mirror {
          background:
            linear-gradient(135deg, rgba(255,255,255,.22), rgba(255,255,255,.03) 32%, rgba(232,196,107,.08) 62%, rgba(255,255,255,.035));
          border: 1px solid rgba(255,255,255,.16);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,.20),
            inset 0 -40px 90px rgba(255,255,255,.025),
            0 30px 90px rgba(0,0,0,.42);
          backdrop-filter: blur(18px);
        }

        .ticker-track {
          display:flex;
          width:max-content;
          animation:ticker 38s linear infinite;
        }

        .network-bg {
          position:absolute;
          inset:0;
          background-image:
            radial-gradient(circle, rgba(232,196,107,.9) 0 1px, transparent 2px),
            linear-gradient(75deg, transparent 0%, rgba(232,196,107,.18) 50%, transparent 100%);
          background-size: 92px 92px, 100% 100%;
          mask-image: radial-gradient(circle at 68% 45%, black 0%, transparent 66%);
          opacity:.45;
          pointer-events:none;
        }

        .scanline {
          position:absolute;
          left:0;
          right:0;
          height:120px;
          background: linear-gradient(180deg, transparent, rgba(232,196,107,.22), transparent);
          animation: scan 5s ease-in-out infinite;
          pointer-events:none;
        }

        .btn:hover {
          transform: translateY(-1px);
          filter: brightness(1.08);
        }

        .preview-card:hover {
          transform: translateY(-3px);
          border-color: rgba(232,196,107,.45) !important;
        }

        @media (max-width: 900px) {
          .hero-grid,
          .metrics,
          .preview-grid,
          .founder-grid,
          .flow-grid {
            grid-template-columns:1fr !important;
          }
          .nav {
            flex-direction:column;
            align-items:flex-start !important;
          }
          .actions {
            grid-template-columns:1fr !important;
          }
          .logo-hero {
            width:86vw !important;
          }
        }
      `}</style>

      <section style={{ minHeight: "100vh", position: "relative", padding: "28px 18px 80px" }}>
        <div className="network-bg" />
        <div className="scanline" />

        <div style={{ maxWidth: 1400, margin: "0 auto", position: "relative", zIndex: 2 }}>
          <nav
            className="nav"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 18,
              marginBottom: 26,
            }}
          >
            <Link href="/" style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none", color: "white" }}>
              <img
                src="/vaultforge-logo.png"
                alt="VaultForge"
                style={{
                  width: 72,
                  height: 54,
                  objectFit: "contain",
                  borderRadius: 14,
                  background: "rgba(0,0,0,.35)",
                  border: "1px solid rgba(232,196,107,.25)",
                }}
              />
              <div>
                <div style={{ fontSize: 18, fontWeight: 1000, letterSpacing: ".14em" }}>VAULTFORGE</div>
                <div style={{ color: "rgba(255,255,255,.58)", fontSize: 12, letterSpacing: ".18em" }}>
                  INTELLIGENT. DRIVEN.
                </div>
              </div>
            </Link>

            <div style={{ display: "flex", gap: 26, alignItems: "center", flexWrap: "wrap", fontSize: 12, fontWeight: 900, letterSpacing: ".12em" }}>
              <a href="#intelligence" style={{ color: "white", textDecoration: "none" }}>INTELLIGENCE</a>
              <a href="#network" style={{ color: "white", textDecoration: "none" }}>NETWORK</a>
              <a href="#founders" style={{ color: "white", textDecoration: "none" }}>FOUNDER ACCESS</a>
              <Link href="/login" style={{ color: "#f8e7b0", textDecoration: "none" }}>MEMBER LOGIN</Link>
            </div>

            <Link
              href="/profile"
              className="btn"
              style={{
                padding: "13px 18px",
                borderRadius: 8,
                background: "linear-gradient(135deg,#ff2b22,#b70c0c)",
                color: "white",
                textDecoration: "none",
                fontWeight: 1000,
                letterSpacing: ".08em",
                boxShadow: "0 0 32px rgba(255,0,0,.22)",
              }}
            >
              APPLY FOR ACCESS
            </Link>
          </nav>

          <section
            className="hero-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "1.02fr .98fr",
              gap: 28,
              alignItems: "center",
              minHeight: "calc(100vh - 130px)",
            }}
          >
            <div>
              <div style={{ color: "#ff332b", fontWeight: 1000, letterSpacing: ".22em", fontSize: 13, marginBottom: 18 }}>
                PRIVATE REAL ESTATE INTELLIGENCE NETWORK
              </div>

              <h1
                style={{
                  fontSize: "clamp(54px,8.8vw,118px)",
                  lineHeight: .86,
                  letterSpacing: "-.07em",
                  margin: 0,
                }}
              >
                Intelligence <span style={{ color: "#ff332b" }}>Driven.</span>
                <br />
                Opportunity <span style={{ color: "#e8c46b" }}>Delivered.</span>
              </h1>

              <p
                style={{
                  color: "rgba(255,255,255,.76)",
                  maxWidth: 720,
                  fontSize: 20,
                  lineHeight: 1.55,
                  marginTop: 22,
                }}
              >
                VaultForge is the AI-powered command network for real estate operators.
                It turns deals, distressed situations, capital gaps, contractors, lenders,
                buyers, sellers, and operator demand into live routes, rooms, and execution.
              </p>

              <div className="flow-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginTop: 24 }}>
                {[
                  ["AI Intelligence", "Market signals, pain, deal pressure, opportunity scoring."],
                  ["Private Network", "Vetted members, operators, capital, buyers, and service partners."],
                  ["Real Execution", "Rooms, routes, messages, introductions, and next-best moves."],
                ].map(([title, body]) => (
                  <div key={title} className="mirror" style={{ borderRadius: 18, padding: 16 }}>
                    <div style={{ color: "#e8c46b", fontSize: 12, fontWeight: 1000, letterSpacing: ".16em", marginBottom: 8 }}>
                      {title}
                    </div>
                    <div style={{ color: "rgba(255,255,255,.68)", lineHeight: 1.45, fontSize: 13 }}>{body}</div>
                  </div>
                ))}
              </div>

              <div className="actions" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, maxWidth: 620, marginTop: 26 }}>
                <Link
                  href="/profile"
                  className="btn"
                  style={{
                    minHeight: 58,
                    display: "grid",
                    placeItems: "center",
                    borderRadius: 8,
                    background: "linear-gradient(135deg,#ff352c,#b30000)",
                    color: "white",
                    textDecoration: "none",
                    fontWeight: 1000,
                    letterSpacing: ".08em",
                  }}
                >
                  APPLY FOR ACCESS
                </Link>

                <a
                  href="#preview"
                  className="btn"
                  style={{
                    minHeight: 58,
                    display: "grid",
                    placeItems: "center",
                    borderRadius: 8,
                    border: "1px solid rgba(232,196,107,.55)",
                    color: "#f8e7b0",
                    textDecoration: "none",
                    fontWeight: 1000,
                    letterSpacing: ".08em",
                    background: "rgba(0,0,0,.30)",
                  }}
                >
                  PREVIEW COMMAND CENTER
                </a>
              </div>
            </div>

            <div style={{ position: "relative", minHeight: 520 }}>
              <div
                style={{
                  position: "absolute",
                  inset: "6% 0 0 0",
                  background:
                    "radial-gradient(circle at 50% 50%, rgba(232,196,107,.36), transparent 38%), radial-gradient(circle at 50% 50%, rgba(255,0,0,.22), transparent 48%)",
                  filter: "blur(24px)",
                  animation: "glow 4s ease-in-out infinite",
                }}
              />

              <div
                className="glass"
                style={{
                  position: "relative",
                  borderRadius: 40,
                  padding: 28,
                  overflow: "hidden",
                  minHeight: 520,
                }}
              >
                <img
                  className="logo-hero"
                  src="/vaultforge-logo.png"
                  alt="VaultForge"
                  style={{
                    width: "min(620px,100%)",
                    display: "block",
                    margin: "40px auto 10px",
                    objectFit: "contain",
                    filter: "drop-shadow(0 0 28px rgba(232,196,107,.24))",
                  }}
                />

                <div
                  className="mirror"
                  style={{
                    position: "absolute",
                    right: 28,
                    bottom: 28,
                    borderRadius: 18,
                    padding: 18,
                    minWidth: 210,
                  }}
                >
                  <div style={{ color: "#ff332b", fontSize: 11, letterSpacing: ".22em", fontWeight: 1000 }}>
                    NETWORK ACTIVITY <span style={{ color: "#ff332b" }}>● LIVE</span>
                  </div>
                  <div style={{ fontSize: 44, fontWeight: 1000, marginTop: 8 }}>{founderOpen ? founderLeft : "OPEN"}</div>
                  <div style={{ color: "rgba(255,255,255,.62)", fontWeight: 900 }}>
                    {founderOpen ? "Founder Spots Left" : "Launch Access"}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="metrics" style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 1, marginTop: -20 }}>
            {[
              ["Active Deal Flow", "1,247", "Live opportunities"],
              ["Capital Watched", "$423M+", "Access to capital"],
              ["Markets Monitored", "32", "High-pressure markets"],
              ["Routes Generated", "3,891", "AI routing events"],
              ["Network Quality", "98%", "Vetted and verified"],
            ].map(([label, value, sub]) => (
              <div key={label} className="mirror" style={{ padding: 18, borderRadius: 0 }}>
                <div style={{ color: "#e8c46b", textTransform: "uppercase", letterSpacing: ".12em", fontSize: 11, fontWeight: 1000 }}>
                  {label}
                </div>
                <div style={{ fontSize: 34, fontWeight: 1000, marginTop: 8 }}>{value}</div>
                <div style={{ color: "rgba(255,255,255,.58)", fontSize: 12 }}>{sub}</div>
              </div>
            ))}
          </section>

          <section id="preview" style={{ padding: "54px 0 20px", textAlign: "center" }}>
            <div style={{ color: "#ff332b", fontSize: 12, letterSpacing: ".22em", fontWeight: 1000 }}>
              LIVE PLATFORM PREVIEW
            </div>
            <h2 style={{ fontSize: "clamp(34px,5.5vw,70px)", margin: "10px 0 8px", lineHeight: .95 }}>
              Inside the VaultForge Command Center
            </h2>
            <p style={{ color: "rgba(255,255,255,.66)", marginTop: 0 }}>
              See the intelligence. Feel the advantage. Experience the network.
            </p>

            <div className="preview-grid" style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 14, marginTop: 26 }}>
              {previewCards.map((card, index) => (
                <div
                  key={card.title}
                  className="mirror preview-card"
                  style={{
                    borderRadius: 14,
                    padding: 14,
                    textAlign: "left",
                    minHeight: 230,
                    transition: "all .2s ease",
                  }}
                >
                  <div
                    style={{
                      height: 112,
                      borderRadius: 10,
                      background:
                        "linear-gradient(145deg,rgba(10,20,35,.95),rgba(0,0,0,.70)), radial-gradient(circle at 70% 20%, rgba(232,196,107,.35), transparent 30%)",
                      border: "1px solid rgba(255,255,255,.08)",
                      position: "relative",
                      overflow: "hidden",
                      marginBottom: 14,
                    }}
                  >
                    <div style={{ position: "absolute", inset: 12, display: "grid", gap: 6 }}>
                      {[0, 1, 2, 3].map((line) => (
                        <div
                          key={line}
                          style={{
                            height: line === index % 4 ? 18 : 10,
                            width: `${55 + line * 10}%`,
                            background: line === index % 4 ? "rgba(232,196,107,.45)" : "rgba(255,255,255,.10)",
                            borderRadius: 999,
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  <div style={{ color: "#e8c46b", fontSize: 11, fontWeight: 1000, letterSpacing: ".18em" }}>
                    {card.tag}
                  </div>
                  <div style={{ fontSize: 19, fontWeight: 1000, marginTop: 8 }}>{card.title}</div>
                  <div style={{ color: "rgba(255,255,255,.62)", fontSize: 13, lineHeight: 1.45, marginTop: 8 }}>
                    {card.body}
                  </div>
                </div>
              ))}
            </div>

            <a
              href="#founders"
              className="btn"
              style={{
                display: "inline-grid",
                placeItems: "center",
                marginTop: 28,
                minWidth: 380,
                maxWidth: "100%",
                minHeight: 54,
                borderRadius: 8,
                border: "1px solid rgba(232,196,107,.55)",
                color: "#f8e7b0",
                background: "rgba(0,0,0,.38)",
                textDecoration: "none",
                fontWeight: 1000,
                letterSpacing: ".10em",
              }}
            >
              ENTER THE COMMAND CENTER PREVIEW
            </a>
          </section>

          <section id="intelligence" className="glass" style={{ borderRadius: 28, padding: 24, marginTop: 34, overflow: "hidden" }}>
            <div style={{ color: "#e8c46b", letterSpacing: ".22em", fontSize: 12, fontWeight: 1000, marginBottom: 14 }}>
              LIVE SIGNAL FEED
            </div>
            <div style={{ overflow: "hidden" }}>
              <div className="ticker-track">
                {[...signalFeed, ...signalFeed].map((item, i) => (
                  <div
                    key={i}
                    style={{
                      whiteSpace: "nowrap",
                      padding: "0 26px",
                      color: i % 3 === 0 ? "#ff332b" : i % 3 === 1 ? "#e8c46b" : "#9df3bf",
                      fontWeight: 1000,
                      letterSpacing: ".08em",
                      textTransform: "uppercase",
                      fontSize: 13,
                    }}
                  >
                    ● {item}
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section id="network" className="glass" style={{ borderRadius: 34, padding: 28, marginTop: 28 }}>
            <div style={{ color: "#ff332b", letterSpacing: ".22em", fontSize: 12, fontWeight: 1000 }}>
              WHAT VAULTFORGE IS
            </div>
            <h2 style={{ fontSize: "clamp(40px,6.5vw,88px)", lineHeight: .92, letterSpacing: "-.05em", margin: "12px 0" }}>
              Not a listing site. Not a CRM. An AI execution network.
            </h2>
            <p style={{ color: "rgba(255,255,255,.72)", fontSize: 20, lineHeight: 1.55, maxWidth: 1000 }}>
              VaultForge reads problems and opportunities like signals. A funding gap is not just a form submission.
              A stalled project is not just a note. A buyer request is not just a lead. Each one becomes an intelligence
              object routed through people, capital, geography, urgency, capability, and execution fit.
            </p>
          </section>

          <section id="founders" className="founder-grid" style={{ display: "grid", gridTemplateColumns: "1fr .85fr", gap: 20, marginTop: 28, paddingBottom: 40 }}>
            <div className="glass" style={{ borderRadius: 34, padding: 28 }}>
              <div style={{ color: "#e8c46b", letterSpacing: ".22em", fontSize: 12, fontWeight: 1000 }}>
                FOUNDING MEMBER ACCESS
              </div>
              <h2 style={{ fontSize: "clamp(42px,7vw,88px)", lineHeight: .9, margin: "12px 0" }}>
                The first 50 get the inside track.
              </h2>
              <p style={{ color: "rgba(255,255,255,.72)", fontSize: 20, lineHeight: 1.55 }}>
                Founder access closes when 50 members are in or May 22 hits — whichever comes first.
                Founders get $49 for the first 2 months, then $299/month. After launch, access moves to $99 for the first 2 months, then $299/month.
              </p>

              <div className="actions" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 22 }}>
                <Link
                  href="/profile"
                  className="btn"
                  style={{
                    display: "grid",
                    placeItems: "center",
                    minHeight: 58,
                    borderRadius: 8,
                    background: "linear-gradient(135deg,#ff332b,#b30000)",
                    color: "white",
                    textDecoration: "none",
                    fontWeight: 1000,
                    letterSpacing: ".08em",
                  }}
                >
                  SECURE FOUNDER ACCESS
                </Link>
                <Link
                  href="/login"
                  className="btn"
                  style={{
                    display: "grid",
                    placeItems: "center",
                    minHeight: 58,
                    borderRadius: 8,
                    border: "1px solid rgba(232,196,107,.45)",
                    background: "rgba(0,0,0,.35)",
                    color: "#f8e7b0",
                    textDecoration: "none",
                    fontWeight: 1000,
                    letterSpacing: ".08em",
                  }}
                >
                  MEMBER LOGIN
                </Link>
              </div>
            </div>

            <div className="mirror" style={{ borderRadius: 34, padding: 26 }}>
              <div style={{ color: "#ff332b", letterSpacing: ".22em", fontSize: 12, fontWeight: 1000 }}>
                FOUNDER CLOCK
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12, marginTop: 18 }}>
                {[
                  ["Days", clock.days],
                  ["Hours", clock.hours],
                  ["Minutes", clock.minutes],
                  ["Seconds", clock.seconds],
                ].map(([label, value]) => (
                  <div key={label} className="glass" style={{ borderRadius: 20, padding: 18, textAlign: "center" }}>
                    <div style={{ fontSize: 50, fontWeight: 1000, color: "#f8e7b0" }}>{String(value).padStart(2, "0")}</div>
                    <div style={{ color: "rgba(255,255,255,.62)", fontWeight: 900 }}>{label}</div>
                  </div>
                ))}
              </div>

              <div className="glass" style={{ borderRadius: 22, padding: 18, marginTop: 14 }}>
                <div style={{ color: "#9df3bf", fontSize: 40, fontWeight: 1000 }}>{founderOpen ? founderLeft : "OPEN"}</div>
                <div style={{ color: "rgba(255,255,255,.70)", fontWeight: 900 }}>
                  {founderOpen ? "Founder spots remaining" : "Launch access available"}
                </div>
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
