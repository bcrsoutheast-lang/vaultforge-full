import Link from "next/link";

const shellStyle: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(181,92,255,.24), transparent 28%), radial-gradient(circle at top right, rgba(157,243,191,.18), transparent 24%), radial-gradient(circle at bottom right, rgba(232,196,107,.16), transparent 28%), linear-gradient(180deg,#02040a 0%,#071326 45%,#030509 100%)",
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
  background: "linear-gradient(135deg, rgba(181,92,255,.18), rgba(255,255,255,.05))",
};

const heroStyle: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.24)",
  background:
    "linear-gradient(145deg, rgba(181,92,255,.18), rgba(157,243,191,.08), rgba(255,255,255,.03))",
  borderRadius: 30,
  padding: 28,
  marginBottom: 20,
  boxShadow: "0 30px 90px rgba(0,0,0,.42)",
};

const cardStyle: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.18)",
  background:
    "linear-gradient(145deg, rgba(181,92,255,.12), rgba(157,243,191,.07), rgba(255,255,255,.03))",
  borderRadius: 24,
  padding: 22,
  marginBottom: 16,
};

const chip: React.CSSProperties = {
  display: "inline-flex",
  border: "1px solid rgba(157,243,191,.25)",
  color: "#9df3bf",
  background: "rgba(157,243,191,.07)",
  borderRadius: 999,
  padding: "8px 11px",
  fontWeight: 800,
  fontSize: 13,
  margin: "0 7px 7px 0",
};

export default function TermsPage() {
  return (
    <main style={shellStyle}>
      <style>{`
        a:hover {
          transform: translateY(-1px);
          transition: all .18s ease;
          filter: brightness(1.06);
        }

        @media (max-width: 760px) {
          a {
            box-sizing: border-box;
          }
        }
      `}</style>

      <nav style={navStyle}>
        <Link href="/" style={navLinkStyle}>Home</Link>
        <Link href="/login" style={navLinkStyle}>Login</Link>
        <Link href="/dashboard" style={navLinkStyle}>Dashboard</Link>
      </nav>

      <section style={heroStyle}>
        <p style={{ color: "#9df3bf", letterSpacing: 4, fontWeight: 800 }}>
          VAULTFORGE TERMS
        </p>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 10,
            marginBottom: 16,
          }}
        >
          <span style={chip}>Private Intelligence Network</span>
          <span style={chip}>AI Routing Platform</span>
          <span style={chip}>Bloomberg-Style Real Estate System</span>
        </div>

        <h1 style={{ fontSize: 48, lineHeight: 1, margin: "10px 0 18px" }}>
          Terms, Disclaimers & Member Rules
        </h1>

        <p style={{ color: "rgba(255,255,255,.72)", fontSize: 20, lineHeight: 1.45 }}>
          This is starter legal framing for testing. Have a qualified attorney review before public launch.
        </p>
      </section>

      <section style={cardStyle}>
        <h2>No Investment, Legal, Tax, or Financial Advice</h2>
        <p style={{ color: "rgba(255,255,255,.72)", lineHeight: 1.6 }}>
          VaultForge is a private real-estate networking, routing, and information platform. Content, AI summaries,
          deal cards, member messages, alerts, and routing suggestions are provided for informational purposes only.
          VaultForge does not provide investment, legal, tax, lending, brokerage, appraisal, or financial advice.
        </p>
      </section>

      <section style={cardStyle}>
        <h2>Member Responsibility</h2>
        <p style={{ color: "rgba(255,255,255,.72)", lineHeight: 1.6 }}>
          Members are responsible for their own due diligence, underwriting, inspections, verification of ownership,
          title review, financing, licensing, local compliance, and professional advice. Members should independently
          verify all deal information before making decisions.
        </p>
      </section>

      <section style={cardStyle}>
        <h2>No Guarantee of Results</h2>
        <p style={{ color: "rgba(255,255,255,.72)", lineHeight: 1.6 }}>
          VaultForge does not guarantee deal availability, profits, funding, buyer interest, lender approval,
          closing, or member performance. Past activity or platform routing does not guarantee future results.
        </p>
      </section>

      <section style={cardStyle}>
        <h2>Member Conduct</h2>
        <p style={{ color: "rgba(255,255,255,.72)", lineHeight: 1.6 }}>
          Members should submit accurate information, communicate professionally, avoid spam, avoid bypassing agreed
          platform processes, and respect confidentiality where applicable. VaultForge may restrict access for misuse.
        </p>
      </section>

      <section style={cardStyle}>
        <h2>AI and Routing Disclaimer</h2>
        <p style={{ color: "rgba(255,255,255,.72)", lineHeight: 1.6 }}>
          AI summaries and routing suggestions are automated estimates based on structured inputs. They may be incomplete,
          incorrect, or outdated. Members must not rely on AI output as a substitute for independent analysis.
        </p>
      </section>
    </main>
  );
}
