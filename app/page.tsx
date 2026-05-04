"use client";

import Link from "next/link";

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top, rgba(214,170,62,.18), transparent 34%), linear-gradient(180deg, #030509 0%, #071326 58%, #030509 100%)",
  color: "white",
  fontFamily: "Arial, sans-serif",
  padding: "28px 18px 90px",
};

const wrap: React.CSSProperties = {
  maxWidth: 1180,
  margin: "0 auto",
};

const topBar: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 14,
  marginBottom: 34,
};

const navBtn: React.CSSProperties = {
  color: "white",
  textDecoration: "none",
  border: "1px solid rgba(255,255,255,.18)",
  borderRadius: 999,
  padding: "11px 16px",
  fontSize: 14,
  background: "rgba(255,255,255,.04)",
};

const hero: React.CSSProperties = {
  textAlign: "center",
  border: "1px solid rgba(255,255,255,.16)",
  borderRadius: 34,
  padding: "34px 18px 42px",
  background:
    "linear-gradient(135deg, rgba(255,255,255,.08), rgba(255,255,255,.025))",
  boxShadow: "0 30px 90px rgba(0,0,0,.45)",
};

const logo: React.CSSProperties = {
  width: "100%",
  maxWidth: 640,
  borderRadius: 26,
  boxShadow: "0 25px 80px rgba(0,0,0,.55)",
  marginBottom: 30,
};

const eyebrow: React.CSSProperties = {
  color: "#e8c46b",
  letterSpacing: 5,
  fontWeight: 900,
  fontSize: 13,
  marginBottom: 14,
};

const title: React.CSSProperties = {
  fontSize: "clamp(46px, 11vw, 96px)",
  lineHeight: 0.9,
  letterSpacing: -3,
  margin: "0 auto 22px",
  maxWidth: 980,
};

const subtitle: React.CSSProperties = {
  color: "rgba(255,255,255,.72)",
  fontSize: "clamp(20px, 4vw, 28px)",
  lineHeight: 1.35,
  maxWidth: 860,
  margin: "0 auto 28px",
};

const primary: React.CSSProperties = {
  display: "inline-block",
  background: "linear-gradient(135deg, #f4d47b, #9df3bf)",
  color: "#06101e",
  textDecoration: "none",
  borderRadius: 999,
  padding: "16px 24px",
  fontWeight: 950,
  fontSize: 17,
  margin: "8px",
};

const secondary: React.CSSProperties = {
  display: "inline-block",
  color: "white",
  textDecoration: "none",
  border: "1px solid rgba(255,255,255,.22)",
  borderRadius: 999,
  padding: "16px 24px",
  fontWeight: 800,
  fontSize: 17,
  margin: "8px",
  background: "rgba(255,255,255,.04)",
};

const statRow: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
  gap: 14,
  marginTop: 30,
};

const stat: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.14)",
  background: "rgba(0,0,0,.18)",
  borderRadius: 22,
  padding: 18,
};

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(245px, 1fr))",
  gap: 18,
  marginTop: 22,
};

const section: React.CSSProperties = {
  marginTop: 26,
  border: "1px solid rgba(255,255,255,.13)",
  background: "rgba(255,255,255,.04)",
  borderRadius: 30,
  padding: 24,
};

const card: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.13)",
  background:
    "linear-gradient(180deg, rgba(255,255,255,.055), rgba(255,255,255,.02))",
  borderRadius: 24,
  padding: 22,
};

const cardTitle: React.CSSProperties = {
  fontSize: 24,
  margin: "0 0 10px",
};

const muted: React.CSSProperties = {
  color: "rgba(255,255,255,.66)",
  lineHeight: 1.55,
  fontSize: 16,
};

const bigLine: React.CSSProperties = {
  fontSize: "clamp(34px, 8vw, 70px)",
  lineHeight: 0.95,
  letterSpacing: -2,
  margin: "0 0 14px",
};

const gold: React.CSSProperties = {
  color: "#e8c46b",
};

const green: React.CSSProperties = {
  color: "#9df3bf",
};

const listItem: React.CSSProperties = {
  borderBottom: "1px solid rgba(255,255,255,.1)",
  padding: "14px 0",
  color: "rgba(255,255,255,.76)",
  fontSize: 17,
  lineHeight: 1.45,
};

export default function HomePage() {
  return (
    <main style={page}>
      <div style={wrap}>
        <header style={topBar}>
          <div style={{ color: "#e8c46b", fontWeight: 900, letterSpacing: 4 }}>
            VAULTFORGE
          </div>
          <div>
            <Link href="/terms" style={navBtn}>Terms</Link>{" "}
            <Link href="/login" style={navBtn}>Member Login</Link>
          </div>
        </header>

        <section style={hero}>
          <img src="/vaultforge-logo.png" alt="VaultForge" style={logo} />

          <div style={eyebrow}>PRIVATE REAL ESTATE COMMAND NETWORK</div>

          <h1 style={title}>
            Deals. Capital. Operators. <span style={gold}>One private system.</span>
          </h1>

          <p style={subtitle}>
            VaultForge is the members-only command center for serious real estate players
            who need private deal flow, funding routes, execution partners, and fast
            connection to the right people.
          </p>

          <div>
            <Link href="/login" style={primary}>Enter Members Area</Link>
            <Link href="/terms" style={secondary}>Read Member Rules</Link>
          </div>

          <div style={statRow}>
            <div style={stat}>
              <div style={{ ...eyebrow, marginBottom: 8 }}>DEAL FLOW</div>
              <div style={{ fontSize: 28, fontWeight: 950 }}>Private</div>
              <p style={muted}>Structured opportunities routed by need, market, and strategy.</p>
            </div>
            <div style={stat}>
              <div style={{ ...eyebrow, marginBottom: 8 }}>CAPITAL</div>
              <div style={{ fontSize: 28, fontWeight: 950 }}>Targeted</div>
              <p style={muted}>Lenders and capital partners connected to real opportunities.</p>
            </div>
            <div style={stat}>
              <div style={{ ...eyebrow, marginBottom: 8 }}>EXECUTION</div>
              <div style={{ fontSize: 28, fontWeight: 950 }}>Operators</div>
              <p style={muted}>Contractors, buyers, developers, wholesalers, and partners in one place.</p>
            </div>
            <div style={stat}>
              <div style={{ ...eyebrow, marginBottom: 8 }}>SIGNALS</div>
              <div style={{ fontSize: 28, fontWeight: 950 }}>AI Routed</div>
              <p style={muted}>Buy boxes, deal needs, alerts, and member demand organized.</p>
            </div>
          </div>
        </section>

        <section style={section}>
          <div style={eyebrow}>WHY VAULTFORGE EXISTS</div>
          <h2 style={bigLine}>
            Real estate is messy. <span style={green}>VaultForge makes it executable.</span>
          </h2>
          <p style={{ ...muted, fontSize: 20 }}>
            Most opportunities die because the right buyer, lender, operator, or partner
            never sees them at the right time. VaultForge turns scattered relationships
            into a private command system: submit the opportunity, define the need,
            route it to the right members, and move toward execution.
          </p>

          <div style={grid}>
            <div style={card}>
              <h3 style={cardTitle}>For Buyers</h3>
              <p style={muted}>
                Build your buy box, save opportunities, track markets, and get matched
                to deals that fit your strategy.
              </p>
            </div>

            <div style={card}>
              <h3 style={cardTitle}>For Lenders</h3>
              <p style={muted}>
                See who needs capital, what the asset is, what the strategy is, and where
                funding can move the deal forward.
              </p>
            </div>

            <div style={card}>
              <h3 style={cardTitle}>For Operators</h3>
              <p style={muted}>
                Contractors, developers, and execution partners can connect where real
                projects need work, speed, and problem solving.
              </p>
            </div>

            <div style={card}>
              <h3 style={cardTitle}>For Deal Makers</h3>
              <p style={muted}>
                Wholesalers, investors, and partners can push opportunities into a system
                built for routing instead of random texting.
              </p>
            </div>
          </div>
        </section>

        <section style={section}>
          <div style={eyebrow}>INSIDE THE MEMBER AREA</div>
          <h2 style={bigLine}>A command center built for action.</h2>

          <div style={grid}>
            <div style={card}>
              <h3 style={cardTitle}>Create Deals</h3>
              <p style={muted}>
                Submit residential, commercial, and land opportunities with structured fields
                built for routing and decision making.
              </p>
            </div>

            <div style={card}>
              <h3 style={cardTitle}>Buy Bucket</h3>
              <p style={muted}>
                Save opportunities you want to track. Your saves become demand signals for
                matching and network intelligence.
              </p>
            </div>

            <div style={card}>
              <h3 style={cardTitle}>Alerts</h3>
              <p style={muted}>
                Get notified when a deal, member, market, or need lines up with your profile
                and business focus.
              </p>
            </div>

            <div style={card}>
              <h3 style={cardTitle}>Messages</h3>
              <p style={muted}>
                Keep deal conversations organized instead of buried across texts, DMs, and calls.
              </p>
            </div>
          </div>
        </section>

        <section style={section}>
          <div style={eyebrow}>MEMBER NETWORK</div>
          <h2 style={bigLine}>
            Built for <span style={gold}>Georgia, Tennessee, Florida, North Carolina, South Carolina, and Texas.</span>
          </h2>

          <div style={grid}>
            <div style={card}>
              <h3 style={cardTitle}>Current Focus States</h3>
              <p style={muted}>
                GA • TN • FL • NC • SC • TX
              </p>
            </div>
            <div style={card}>
              <h3 style={cardTitle}>Core Buckets</h3>
              <p style={muted}>
                Buyers • Lenders • Contractors • Developers • Operators • Deal Sources
              </p>
            </div>
            <div style={card}>
              <h3 style={cardTitle}>Deal Types</h3>
              <p style={muted}>
                Residential • Commercial • Land • Distress • Capital Needs • Partner Needs
              </p>
            </div>
          </div>
        </section>

        <section style={section}>
          <div style={eyebrow}>THE VAULTFORGE DIFFERENCE</div>
          <div style={listItem}>Private member access instead of public noise.</div>
          <div style={listItem}>Structured deal intake instead of scattered screenshots.</div>
          <div style={listItem}>Buy boxes and needs that help route the right opportunity to the right person.</div>
          <div style={listItem}>AI-assisted summaries and alerts to speed up action.</div>
          <div style={listItem}>Built around real execution: deals, capital, connections, results.</div>
        </section>

        <section style={{ ...hero, marginTop: 26 }}>
          <div style={eyebrow}>PRIVATE ACCESS</div>
          <h2 style={bigLine}>This is not another listing site.</h2>
          <p style={subtitle}>
            VaultForge is being built as a private deal-flow and execution operating system.
            Members do not just browse — they create opportunities, define needs, route signals,
            and connect with people who can move deals forward.
          </p>
          <Link href="/login" style={primary}>Enter Members Area</Link>
        </section>
      </div>
    </main>
  );
}
