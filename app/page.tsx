
"use client";

import Link from "next/link";

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top, rgba(180,20,20,.22), transparent 25%), radial-gradient(circle at 80% 10%, rgba(232,196,107,.16), transparent 24%), linear-gradient(180deg,#020202 0%,#06080d 45%,#020202 100%)",
  color: "white",
  overflow: "hidden",
  fontFamily: "Arial, sans-serif",
};

const wrap: React.CSSProperties = {
  maxWidth: 1400,
  margin: "0 auto",
  padding: "28px 20px 100px",
};

const topBar: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 40,
};

const brand: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 900,
  letterSpacing: 6,
  color: "#e8c46b",
};

const nav: React.CSSProperties = {
  display: "flex",
  gap: 12,
  flexWrap: "wrap",
};

const navBtn: React.CSSProperties = {
  color: "white",
  textDecoration: "none",
  border: "1px solid rgba(255,255,255,.12)",
  background: "rgba(255,255,255,.04)",
  padding: "12px 16px",
  borderRadius: 999,
  fontWeight: 700,
};

const hero: React.CSSProperties = {
  position: "relative",
  border: "1px solid rgba(255,255,255,.08)",
  borderRadius: 40,
  overflow: "hidden",
  padding: "60px 40px",
  background:
    "linear-gradient(145deg, rgba(255,255,255,.05), rgba(255,255,255,.015))",
  boxShadow: "0 40px 140px rgba(0,0,0,.65)",
};

const glow: React.CSSProperties = {
  position: "absolute",
  width: 500,
  height: 500,
  borderRadius: "50%",
  background: "radial-gradient(circle, rgba(232,196,107,.22), transparent 70%)",
  top: -200,
  right: -100,
  filter: "blur(20px)",
};

const redGlow: React.CSSProperties = {
  position: "absolute",
  width: 400,
  height: 400,
  borderRadius: "50%",
  background: "radial-gradient(circle, rgba(180,20,20,.20), transparent 70%)",
  bottom: -180,
  left: -120,
  filter: "blur(20px)",
};

const heroGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1.2fr 1fr",
  gap: 30,
  alignItems: "center",
};

const eyebrow: React.CSSProperties = {
  color: "#9f1c1c",
  letterSpacing: 4,
  fontWeight: 900,
  fontSize: 13,
  marginBottom: 18,
};

const title: React.CSSProperties = {
  fontSize: "clamp(56px, 10vw, 108px)",
  lineHeight: .9,
  margin: 0,
  letterSpacing: -4,
};

const gold: React.CSSProperties = {
  color: "#e8c46b",
};

const subtitle: React.CSSProperties = {
  fontSize: 22,
  lineHeight: 1.6,
  color: "rgba(255,255,255,.74)",
  maxWidth: 760,
  marginTop: 24,
};

const actionRow: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 14,
  marginTop: 34,
};

const primary: React.CSSProperties = {
  background: "linear-gradient(135deg,#e8c46b,#a56a00)",
  color: "#050505",
  textDecoration: "none",
  padding: "16px 22px",
  borderRadius: 999,
  fontWeight: 900,
};

const secondary: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.16)",
  background: "rgba(255,255,255,.04)",
  color: "white",
  textDecoration: "none",
  padding: "16px 22px",
  borderRadius: 999,
  fontWeight: 800,
};

const terminal: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.18)",
  borderRadius: 30,
  background:
    "linear-gradient(180deg, rgba(0,0,0,.88), rgba(15,15,15,.72))",
  padding: 24,
  minHeight: 520,
  position: "relative",
};

const terminalHeader: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: 22,
};

const chip: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.24)",
  borderRadius: 999,
  padding: "7px 12px",
  color: "#e8c46b",
  fontSize: 12,
  fontWeight: 800,
};

const signal: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.08)",
  borderLeft: "3px solid #9f1c1c",
  background: "rgba(255,255,255,.03)",
  borderRadius: 20,
  padding: 18,
  marginBottom: 16,
};

const statGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
  gap: 16,
  marginTop: 24,
};

const stat: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.08)",
  borderRadius: 22,
  padding: 20,
  background: "rgba(255,255,255,.03)",
};

const section: React.CSSProperties = {
  marginTop: 34,
  border: "1px solid rgba(255,255,255,.08)",
  borderRadius: 34,
  background:
    "linear-gradient(180deg, rgba(255,255,255,.03), rgba(255,255,255,.015))",
  padding: 30,
};

const sectionTitle: React.CSSProperties = {
  fontSize: "clamp(34px,6vw,70px)",
  lineHeight: .95,
  letterSpacing: -2,
  marginBottom: 18,
};

const previewGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))",
  gap: 22,
  marginTop: 28,
};

const previewCard: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.08)",
  borderRadius: 28,
  overflow: "hidden",
  background:
    "linear-gradient(180deg, rgba(255,255,255,.04), rgba(255,255,255,.015))",
};

const previewTop: React.CSSProperties = {
  padding: 18,
  borderBottom: "1px solid rgba(255,255,255,.06)",
};

const previewBody: React.CSSProperties = {
  padding: 20,
  minHeight: 240,
  background:
    "radial-gradient(circle at top right, rgba(232,196,107,.08), transparent 30%), linear-gradient(180deg,#090909,#111)",
};

export default function HomePage() {
  return (
    <main style={page}>
      <div style={wrap}>
        <header style={topBar}>
          <div style={brand}>VAULTFORGE</div>

          <div style={nav}>
            <Link href="/login" style={navBtn}>Member Login</Link>
            <Link href="/apply" style={navBtn}>Founder Access</Link>
          </div>
        </header>

        <section style={hero}>
          <div style={glow}></div>
          <div style={redGlow}></div>

          <div style={heroGrid}>
            <div>
              <div style={eyebrow}>
                PRIVATE REAL ESTATE INTELLIGENCE NETWORK
              </div>

              <h1 style={title}>
                The <span style={gold}>Bloomberg Sidekick</span><br />
                for Real Estate Operators.
              </h1>

              <p style={subtitle}>
                VaultForge is a private intelligence-driven operating system
                built to route opportunity between capital providers,
                acquisition operators, lenders, developers, contractors,
                and strategic real estate players.
              </p>

              <div style={actionRow}>
                <Link href="/apply" style={primary}>
                  Create Founder Access
                </Link>

                <Link href="/member-preview" style={secondary}>
                  Preview Command Center
                </Link>
              </div>

              <div style={statGrid}>
                <div style={stat}>
                  <div style={{ color:"#9f1c1c", fontWeight:900 }}>
                    LIVE SIGNALS
                  </div>
                  <div style={{ fontSize:40, fontWeight:900 }}>247</div>
                </div>

                <div style={stat}>
                  <div style={{ color:"#e8c46b", fontWeight:900 }}>
                    ACTIVE ROUTES
                  </div>
                  <div style={{ fontSize:40, fontWeight:900 }}>89</div>
                </div>

                <div style={stat}>
                  <div style={{ color:"#9f1c1c", fontWeight:900 }}>
                    CAPITAL NEEDS
                  </div>
                  <div style={{ fontSize:40, fontWeight:900 }}>$14.2M</div>
                </div>

                <div style={stat}>
                  <div style={{ color:"#e8c46b", fontWeight:900 }}>
                    FOUNDING ACCESS
                  </div>
                  <div style={{ fontSize:40, fontWeight:900 }}>50</div>
                </div>
              </div>
            </div>

            <div style={terminal}>
              <div style={terminalHeader}>
                <div style={{ fontWeight:900 }}>LIVE MARKET INTELLIGENCE</div>
                <div style={chip}>PRIVATE NETWORK ACTIVE</div>
              </div>

              <div style={signal}>
                <div style={{ color:"#e8c46b", fontWeight:900 }}>
                  ATLANTA • DISTRESS SIGNAL ↑
                </div>
                <div style={{ marginTop:8, color:"rgba(255,255,255,.72)" }}>
                  Multifamily acquisition pressure increasing. Operator and
                  bridge capital route requested.
                </div>
              </div>

              <div style={signal}>
                <div style={{ color:"#e8c46b", fontWeight:900 }}>
                  TAMPA • CAPITAL GAP DETECTED
                </div>
                <div style={{ marginTop:8, color:"rgba(255,255,255,.72)" }}>
                  Land development route matched with lender profile.
                  Confidence score: 92%.
                </div>
              </div>

              <div style={signal}>
                <div style={{ color:"#e8c46b", fontWeight:900 }}>
                  NASHVILLE • BUYER ROUTE ACTIVE
                </div>
                <div style={{ marginTop:8, color:"rgba(255,255,255,.72)" }}>
                  Off-market value-add signal routed to strategic acquisition
                  members.
                </div>
              </div>

              <div style={signal}>
                <div style={{ color:"#e8c46b", fontWeight:900 }}>
                  ORLANDO • EXECUTION OPERATOR FOUND
                </div>
                <div style={{ marginTop:8, color:"rgba(255,255,255,.72)" }}>
                  Construction and capital profiles aligned inside the
                  routing engine.
                </div>
              </div>
            </div>
          </div>
        </section>

        <section style={section}>
          <div style={eyebrow}>PREVIEW THE NETWORK</div>

          <div style={sectionTitle}>
            A command center built for
            <span style={gold}> serious operators.</span>
          </div>

          <div style={previewGrid}>
            <div style={previewCard}>
              <div style={previewTop}>
                <div style={{ color:"#e8c46b", fontWeight:900 }}>
                  MEMBER COMMAND CENTER
                </div>
              </div>

              <div style={previewBody}>
                <div style={signal}>
                  <div style={{ color:"#9f1c1c", fontWeight:900 }}>
                    ACTIVE ROUTING
                  </div>
                  <div style={{ marginTop:10 }}>
                    Buyer, lender, and operator matches flowing through
                    the intelligence engine.
                  </div>
                </div>

                <div style={signal}>
                  <div style={{ color:"#e8c46b", fontWeight:900 }}>
                    LIVE OPPORTUNITY FEED
                  </div>
                  <div style={{ marginTop:10 }}>
                    Distress signals, capital requests, land opportunities,
                    and acquisition routes.
                  </div>
                </div>
              </div>
            </div>

            <div style={previewCard}>
              <div style={previewTop}>
                <div style={{ color:"#e8c46b", fontWeight:900 }}>
                  ROUTING INTELLIGENCE
                </div>
              </div>

              <div style={previewBody}>
                <div style={signal}>
                  <div style={{ color:"#9f1c1c", fontWeight:900 }}>
                    MATCH CONFIDENCE
                  </div>
                  <div style={{ marginTop:10 }}>
                    AI-driven routing based on strategy, geography,
                    buy box, capital fit, and execution capability.
                  </div>
                </div>

                <div style={signal}>
                  <div style={{ color:"#e8c46b", fontWeight:900 }}>
                    PRIVATE INTRODUCTIONS
                  </div>
                  <div style={{ marginTop:10 }}>
                    Strategic member introductions staged inside
                    controlled routing rooms.
                  </div>
                </div>
              </div>
            </div>

            <div style={previewCard}>
              <div style={previewTop}>
                <div style={{ color:"#e8c46b", fontWeight:900 }}>
                  LIVE NETWORK PRESSURE
                </div>
              </div>

              <div style={previewBody}>
                <div style={signal}>
                  <div style={{ color:"#9f1c1c", fontWeight:900 }}>
                    CAPITAL MOVEMENT
                  </div>
                  <div style={{ marginTop:10 }}>
                    Monitor operator demand, funding gaps, distressed
                    pressure, and market activity.
                  </div>
                </div>

                <div style={signal}>
                  <div style={{ color:"#e8c46b", fontWeight:900 }}>
                    MARKET INTELLIGENCE
                  </div>
                  <div style={{ marginTop:10 }}>
                    Live strategic signals across residential,
                    commercial, and land opportunities.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
