
import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(178,24,24,.24), transparent 28%), radial-gradient(circle at 85% 10%, rgba(232,196,107,.18), transparent 26%), linear-gradient(180deg,#020202 0%,#070707 52%,#020202 100%)",
  color: "white",
  fontFamily: "Arial, sans-serif",
  padding: "28px 18px 90px",
};

const wrap: React.CSSProperties = {
  maxWidth: 1260,
  margin: "0 auto",
};

const topBar: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 14,
  marginBottom: 28,
};

const brand: React.CSSProperties = {
  color: "#e8c46b",
  fontWeight: 950,
  letterSpacing: 5,
  fontSize: 16,
};

const nav: React.CSSProperties = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
};

const navBtn: React.CSSProperties = {
  color: "white",
  textDecoration: "none",
  border: "1px solid rgba(232,196,107,.22)",
  borderRadius: 999,
  padding: "11px 15px",
  fontSize: 14,
  background: "rgba(255,255,255,.035)",
  fontWeight: 800,
};

const hero: React.CSSProperties = {
  position: "relative",
  overflow: "hidden",
  border: "1px solid rgba(232,196,107,.20)",
  borderRadius: 38,
  padding: "34px 22px",
  background:
    "radial-gradient(circle at top, rgba(232,196,107,.12), transparent 40%), linear-gradient(135deg, rgba(255,255,255,.065), rgba(255,255,255,.018))",
  boxShadow: "0 35px 120px rgba(0,0,0,.72), inset 0 0 80px rgba(232,196,107,.035)",
  textAlign: "center",
};

const signalGrid: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  opacity: .14,
  backgroundImage:
    "linear-gradient(rgba(232,196,107,.18) 1px, transparent 1px), linear-gradient(90deg, rgba(232,196,107,.14) 1px, transparent 1px)",
  backgroundSize: "44px 44px",
  pointerEvents: "none",
};

const logo: React.CSSProperties = {
  width: "100%",
  maxWidth: 420,
  borderRadius: 28,
  border: "1px solid rgba(232,196,107,.20)",
  boxShadow:
    "0 30px 95px rgba(0,0,0,.70), 0 0 80px rgba(232,196,107,.18), 0 0 60px rgba(178,24,24,.11)",
  marginBottom: 24,
  position: "relative",
  zIndex: 1,
};

const eyebrow: React.CSSProperties = {
  color: "#d33a2c",
  letterSpacing: 5,
  fontWeight: 950,
  fontSize: 13,
  marginBottom: 14,
  textTransform: "uppercase",
};

const goldEyebrow: React.CSSProperties = {
  ...eyebrow,
  color: "#e8c46b",
};

const title: React.CSSProperties = {
  fontSize: "clamp(44px, 9vw, 92px)",
  lineHeight: .9,
  letterSpacing: -3,
  margin: "0 auto 18px",
  maxWidth: 1050,
  position: "relative",
  zIndex: 1,
};

const subtitle: React.CSSProperties = {
  color: "rgba(255,255,255,.76)",
  fontSize: "clamp(19px, 3vw, 26px)",
  lineHeight: 1.42,
  maxWidth: 900,
  margin: "0 auto 26px",
  position: "relative",
  zIndex: 1,
};

const gold: React.CSSProperties = {
  color: "#e8c46b",
};

const red: React.CSSProperties = {
  color: "#d33a2c",
};

const primary: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "linear-gradient(135deg, #f4d47b, #a96d02)",
  color: "#050505",
  textDecoration: "none",
  borderRadius: 999,
  padding: "16px 24px",
  fontWeight: 950,
  fontSize: 17,
  margin: "8px",
  minHeight: 50,
  boxShadow: "0 12px 34px rgba(232,196,107,.22)",
};

const secondary: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  color: "white",
  textDecoration: "none",
  border: "1px solid rgba(232,196,107,.24)",
  borderRadius: 999,
  padding: "16px 24px",
  fontWeight: 850,
  fontSize: 17,
  margin: "8px",
  background: "rgba(255,255,255,.035)",
  minHeight: 50,
};

const section: React.CSSProperties = {
  marginTop: 26,
  border: "1px solid rgba(232,196,107,.14)",
  background:
    "linear-gradient(180deg, rgba(255,255,255,.04), rgba(255,255,255,.015))",
  borderRadius: 30,
  padding: 24,
  boxShadow: "0 24px 70px rgba(0,0,0,.34)",
};

const bigLine: React.CSSProperties = {
  fontSize: "clamp(34px, 7vw, 70px)",
  lineHeight: .95,
  letterSpacing: -2,
  margin: "0 0 14px",
};

const muted: React.CSSProperties = {
  color: "rgba(255,255,255,.70)",
  lineHeight: 1.55,
  fontSize: 16,
};

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(285px, 1fr))",
  gap: 18,
  marginTop: 22,
};

const card: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.13)",
  background:
    "linear-gradient(180deg, rgba(255,255,255,.052), rgba(255,255,255,.018))",
  borderRadius: 26,
  padding: 20,
  overflow: "hidden",
};

const terminal: React.CSSProperties = {
  border: "1px solid rgba(211,58,44,.25)",
  background:
    "radial-gradient(circle at top right, rgba(232,196,107,.10), transparent 34%), linear-gradient(180deg, rgba(0,0,0,.62), rgba(0,0,0,.30))",
  borderRadius: 26,
  padding: 20,
  minHeight: 310,
};

const miniTop: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 10,
  borderBottom: "1px solid rgba(232,196,107,.12)",
  paddingBottom: 14,
  marginBottom: 16,
};

const pill: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.24)",
  borderRadius: 999,
  padding: "7px 10px",
  color: "#e8c46b",
  background: "rgba(232,196,107,.06)",
  fontSize: 12,
  fontWeight: 900,
};

const signal: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.09)",
  borderLeft: "3px solid #d33a2c",
  borderRadius: 18,
  padding: 14,
  background: "rgba(255,255,255,.028)",
  marginTop: 12,
};

const metricGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: 10,
  marginTop: 14,
};

const metric: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.08)",
  borderRadius: 16,
  padding: 12,
  background: "rgba(255,255,255,.025)",
};

const blurBar: React.CSSProperties = {
  height: 14,
  borderRadius: 999,
  background:
    "linear-gradient(90deg, rgba(232,196,107,.46), rgba(211,58,44,.28), rgba(255,255,255,.08))",
  marginTop: 12,
};

const listItem: React.CSSProperties = {
  borderBottom: "1px solid rgba(232,196,107,.12)",
  padding: "14px 0",
  color: "rgba(255,255,255,.78)",
  fontSize: 17,
  lineHeight: 1.45,
};

function PreviewPanel({
  label,
  title,
  children,
}: {
  label: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div style={terminal}>
      <div style={miniTop}>
        <div>
          <div style={eyebrow}>{label}</div>
          <h3 style={{ margin: 0, fontSize: 24 }}>{title}</h3>
        </div>
        <div style={pill}>PREVIEW</div>
      </div>
      {children}
    </div>
  );
}

export default function MemberPreviewPage() {
  return (
    <main style={page}>
      <style>{`
        @media (max-width: 760px) {
          .vf-actions {
            display: grid !important;
            grid-template-columns: 1fr !important;
            gap: 10px !important;
          }

          .vf-actions > * {
            width: 100%;
            margin: 0 !important;
            box-sizing: border-box;
          }

          .vf-topbar {
            align-items: flex-start !important;
            flex-direction: column !important;
          }

          .vf-metrics {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      <div style={wrap}>
        <header style={topBar} className="vf-topbar">
          <Link href="/" style={{ ...brand, textDecoration: "none" }}>
            VAULTFORGE
          </Link>

          <nav style={nav}>
            <Link href="/" style={navBtn}>
              Home
            </Link>
            <Link href="/login" style={navBtn}>
              Member Login
            </Link>
            <Link href="/apply" style={navBtn}>
              Founder Access
            </Link>
          </nav>
        </header>

        <section style={hero}>
          <div style={signalGrid}></div>
          <img src="/vaultforge-logo.png" alt="VaultForge" style={logo} />

          <div style={eyebrow}>LIVE COMMAND CENTER PREVIEW</div>

          <h1 style={title}>
            Step inside the <span style={gold}>private intelligence layer</span>
            <br /> behind real estate opportunity.
          </h1>

          <p style={subtitle}>
            This is a controlled preview of the VaultForge Member Command Center:
            signals, routing, introductions, activity, and private network intelligence
            built for serious real estate players.
          </p>

          <div className="vf-actions" style={{ position: "relative", zIndex: 1 }}>
            <Link href="/apply" style={primary}>
              Create Founder Access
            </Link>
            <Link href="/login" style={secondary}>
              Member Login
            </Link>
          </div>
        </section>

        <section style={section}>
          <div style={goldEyebrow}>WHAT MEMBERS SEE</div>
          <h2 style={bigLine}>
            The dashboard is not a feed. <span style={gold}>It is an operating terminal.</span>
          </h2>
          <p style={{ ...muted, fontSize: 20 }}>
            VaultForge is designed to help members see what matters: where pressure is building,
            what needs capital, who can execute, what routes are active, and where strategic
            introductions are ready.
          </p>

          <div style={grid}>
            <PreviewPanel label="COMMAND" title="Member Command Center">
              <div style={metricGrid} className="vf-metrics">
                <div style={metric}>
                  <div style={{ color: "#d33a2c", fontWeight: 950 }}>ACTIVE ROUTES</div>
                  <div style={{ fontSize: 34, fontWeight: 950 }}>14</div>
                </div>
                <div style={metric}>
                  <div style={{ color: "#e8c46b", fontWeight: 950 }}>INTROS</div>
                  <div style={{ fontSize: 34, fontWeight: 950 }}>6</div>
                </div>
                <div style={metric}>
                  <div style={{ color: "#d33a2c", fontWeight: 950 }}>SIGNALS</div>
                  <div style={{ fontSize: 34, fontWeight: 950 }}>29</div>
                </div>
              </div>

              <div style={signal}>
                <strong style={gold}>Priority Route Opened</strong>
                <p style={muted}>
                  Atlanta value-add opportunity matched to capital, operator, and acquisition profile.
                </p>
              </div>

              <div style={signal}>
                <strong style={gold}>Member Action Needed</strong>
                <p style={muted}>
                  Review controlled introduction request inside the routing room.
                </p>
              </div>
            </PreviewPanel>

            <PreviewPanel label="INTELLIGENCE" title="Signal Map">
              <div style={signal}>
                <strong style={gold}>TAMPA • CAPITAL GAP DETECTED</strong>
                <p style={muted}>
                  Land development route matched to lender and JV capital categories.
                </p>
              </div>

              <div style={signal}>
                <strong style={gold}>NASHVILLE • BUYER PRESSURE RISING</strong>
                <p style={muted}>
                  Acquisition demand increasing around value-add residential inventory.
                </p>
              </div>

              <div style={signal}>
                <strong style={gold}>CHARLOTTE • OPERATOR MATCH FOUND</strong>
                <p style={muted}>
                  Execution provider aligned to project scope and member market.
                </p>
              </div>
            </PreviewPanel>

            <PreviewPanel label="ROUTING" title="Match Confidence">
              <div style={metricGrid} className="vf-metrics">
                <div style={metric}>
                  <div style={{ color: "#e8c46b", fontWeight: 950 }}>MARKET FIT</div>
                  <div style={{ fontSize: 30, fontWeight: 950 }}>94%</div>
                </div>
                <div style={metric}>
                  <div style={{ color: "#e8c46b", fontWeight: 950 }}>CAPITAL FIT</div>
                  <div style={{ fontSize: 30, fontWeight: 950 }}>88%</div>
                </div>
                <div style={metric}>
                  <div style={{ color: "#e8c46b", fontWeight: 950 }}>EXECUTION</div>
                  <div style={{ fontSize: 30, fontWeight: 950 }}>91%</div>
                </div>
              </div>

              <div style={blurBar}></div>
              <div style={blurBar}></div>
              <div style={blurBar}></div>

              <p style={muted}>
                The routing engine compares member profiles, markets, roles, buy boxes,
                capital needs, and provider abilities before surfacing an opportunity.
              </p>
            </PreviewPanel>
          </div>
        </section>

        <section style={section}>
          <div style={goldEyebrow}>PRIVATE WORKFLOW</div>
          <h2 style={bigLine}>
            From signal to route to introduction. <span style={red}>Controlled. Trackable. Private.</span>
          </h2>

          <div style={grid}>
            <div style={card}>
              <div style={eyebrow}>01</div>
              <h3 style={{ fontSize: 25, margin: "0 0 10px" }}>Signal Appears</h3>
              <p style={muted}>
                A deal, project, capital need, market pressure, or member request becomes a signal
                inside the intelligence layer.
              </p>
            </div>

            <div style={card}>
              <div style={eyebrow}>02</div>
              <h3 style={{ fontSize: 25, margin: "0 0 10px" }}>Route Generated</h3>
              <p style={muted}>
                The system identifies who may be a fit based on geography, strategy, capital,
                execution ability, and member profile data.
              </p>
            </div>

            <div style={card}>
              <div style={eyebrow}>03</div>
              <h3 style={{ fontSize: 25, margin: "0 0 10px" }}>Intro Staged</h3>
              <p style={muted}>
                Controlled introductions are staged so real operators, lenders, buyers, and partners
                can engage without turning the network into noise.
              </p>
            </div>
          </div>
        </section>

        <section style={section}>
          <div style={goldEyebrow}>INSIDE VAULTFORGE</div>
          <h2 style={bigLine}>
            The member area is built around <span style={gold}>actionable intelligence.</span>
          </h2>

          <div style={listItem}>Alerts show active signals, urgency, opportunity pressure, and why something matters.</div>
          <div style={listItem}>Routing Inbox shows opportunities routed to members based on profile fit and network value.</div>
          <div style={listItem}>Introductions organize controlled connections instead of random direct messages.</div>
          <div style={listItem}>Activity tracks routing actions, intro responses, network movement, and opportunity changes.</div>
          <div style={listItem}>Deal Rooms keep opportunity context, routing logic, and member action together.</div>
          <div style={listItem}>Member Intelligence helps identify who buys, funds, operates, sources, or solves specific problems.</div>
        </section>

        <section style={{ ...hero, marginTop: 26 }}>
          <div style={signalGrid}></div>
          <div style={eyebrow}>FOUNDER ACCESS</div>
          <h2 style={bigLine}>
            This preview is public. <span style={gold}>The real network is private.</span>
          </h2>
          <p style={subtitle}>
            Founder access is for serious members who want to be part of the early VaultForge
            intelligence network before wider rollout.
          </p>

          <div className="vf-actions" style={{ position: "relative", zIndex: 1 }}>
            <Link href="/apply" style={primary}>
              Create Founder Access
            </Link>
            <Link href="/" style={secondary}>
              Back to Homepage
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
