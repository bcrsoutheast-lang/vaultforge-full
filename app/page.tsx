import Link from "next/link";

const shellStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "#071326",
  color: "white",
  padding: "36px 22px 80px",
  fontFamily: "Arial, sans-serif",
};

const navStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 10,
  marginBottom: 24,
};

const navLinkStyle: React.CSSProperties = {
  color: "white",
  textDecoration: "none",
  border: "1px solid rgba(255,255,255,.25)",
  borderRadius: 999,
  padding: "11px 15px",
  fontSize: 15,
};

const heroStyle: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.2)",
  background: "linear-gradient(135deg, rgba(157,243,191,.10), rgba(255,255,255,.04))",
  borderRadius: 30,
  padding: 28,
  marginBottom: 20,
};

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
  gap: 16,
};

const cardStyle: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.18)",
  background: "rgba(255,255,255,.04)",
  borderRadius: 22,
  padding: 20,
};

const primaryButtonStyle: React.CSSProperties = {
  display: "inline-block",
  background: "#9df3bf",
  color: "#071326",
  borderRadius: 999,
  padding: "14px 18px",
  fontWeight: 900,
  textDecoration: "none",
  marginRight: 10,
  marginTop: 12,
};

export default function HomePage() {
  return (
    <main style={shellStyle}>
      <nav style={navStyle}>
        <Link href="/login" style={navLinkStyle}>Login</Link>
        <Link href="/dashboard" style={navLinkStyle}>Member Area</Link>
        <Link href="/terms" style={navLinkStyle}>Terms</Link>
      </nav>

      <section style={heroStyle}>
        <p style={{ color: "#9df3bf", letterSpacing: 4, fontWeight: 900 }}>
          VAULTFORGE
        </p>
        <h1 style={{ fontSize: 58, lineHeight: 0.95, margin: "12px 0 18px" }}>
          Private Real Estate Deal Routing Network
        </h1>
        <p style={{ color: "rgba(255,255,255,.76)", fontSize: 22, lineHeight: 1.45, maxWidth: 820 }}>
          VaultForge connects buyers, lenders, contractors, developers, and partners through structured deal flow,
          buy boxes, AI summaries, routing alerts, and member communication.
        </p>
        <Link href="/login" style={primaryButtonStyle}>Enter Member Area</Link>
        <Link href="/terms" style={navLinkStyle}>Read Terms</Link>
      </section>

      <section style={gridStyle}>
        <div style={cardStyle}>
          <p style={{ color: "#9df3bf", letterSpacing: 3, fontWeight: 800 }}>DEAL FLOW</p>
          <h2>Submit structured opportunities</h2>
          <p style={{ color: "rgba(255,255,255,.68)", lineHeight: 1.5 }}>
            Deals are captured with state, property type, strategy, price, description, and AI analysis.
          </p>
        </div>

        <div style={cardStyle}>
          <p style={{ color: "#9df3bf", letterSpacing: 3, fontWeight: 800 }}>BUY BOX</p>
          <h2>Match demand to supply</h2>
          <p style={{ color: "rgba(255,255,255,.68)", lineHeight: 1.5 }}>
            Member profiles define states, roles, strategies, and price ranges for routing.
          </p>
        </div>

        <div style={cardStyle}>
          <p style={{ color: "#9df3bf", letterSpacing: 3, fontWeight: 800 }}>COMMUNICATION</p>
          <h2>Message around deals</h2>
          <p style={{ color: "rgba(255,255,255,.68)", lineHeight: 1.5 }}>
            Members can save opportunities, open deal rooms, and communicate through message threads.
          </p>
        </div>

        <div style={cardStyle}>
          <p style={{ color: "#9df3bf", letterSpacing: 3, fontWeight: 800 }}>ALERTS</p>
          <h2>Routing signals</h2>
          <p style={{ color: "rgba(255,255,255,.68)", lineHeight: 1.5 }}>
            Matching logic turns deal submissions and buy boxes into alerts and action.
          </p>
        </div>
      </section>
    </main>
  );
}
