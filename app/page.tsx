"use client";

import Link from "next/link";

const founderRoles = [
  { role: "Buyers", limit: 25, current: 0 },
  { role: "Lenders", limit: 15, current: 0 },
  { role: "Operators", limit: 20, current: 0 },
  { role: "Wholesalers", limit: 20, current: 0 },
  { role: "Contractors", limit: 20, current: 0 },
  { role: "Agents", limit: 15, current: 0 },
];

export default function HomePage() {
  const totalCurrent = founderRoles.reduce((a, b) => a + b.current, 0);
  const totalLimit = founderRoles.reduce((a, b) => a + b.limit, 0);

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, #0d1b3d 0%, #05070d 45%, #02040a 100%)",
        color: "white",
        paddingBottom: 120,
      }}
    >
      <section
        style={{
          maxWidth: 1400,
          margin: "0 auto",
          padding: "28px 20px 0",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 14,
            marginBottom: 28,
          }}
        >
          <div
            style={{
              fontSize: 40,
              fontWeight: 900,
              color: "#f4c842",
              letterSpacing: 1,
            }}
          >
            VAULTFORGE
          </div>

          <div
            style={{
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <Link href="/login" style={navBtn}>
              Member Access
            </Link>

            <Link href="/admin-command" style={goldBtn}>
              Admin Command
            </Link>
          </div>
        </div>

        <div
          style={{
            border: "1px solid rgba(244,200,66,.25)",
            borderRadius: 28,
            padding: 36,
            background:
              "linear-gradient(145deg, rgba(8,12,24,.96), rgba(3,5,10,.98))",
            marginBottom: 26,
            boxShadow: "0 0 40px rgba(244,200,66,.08)",
          }}
        >
          <div
            style={{
              color: "#f4c842",
              fontWeight: 800,
              letterSpacing: 6,
              fontSize: 14,
              marginBottom: 16,
            }}
          >
            PRIVATE REAL ESTATE INTELLIGENCE NETWORK
          </div>

          <h1
            style={{
              fontSize: "clamp(54px, 9vw, 112px)",
              lineHeight: ".92",
              fontWeight: 900,
              marginBottom: 24,
              maxWidth: 1000,
            }}
          >
            Pain. Signals. Routing. Execution.
          </h1>

          <p
            style={{
              maxWidth: 980,
              fontSize: 24,
              lineHeight: 1.5,
              color: "rgba(255,255,255,.82)",
              marginBottom: 28,
            }}
          >
            VaultForge is not a listing site. VaultForge Intelligence routes
            Deal Opportunities, Pain Signals, capital needs, execution problems,
            distressed situations, and operator opportunities to approved
            members based on profile intelligence, geography, strategy, and
            operational fit.
          </p>

          <div
            style={{
              display: "flex",
              gap: 16,
              flexWrap: "wrap",
              marginBottom: 34,
            }}
          >
            <Link href="/login" style={goldBtn}>
              Request Member Access
            </Link>

            <Link href="/profile" style={navBtn}>
              Build Intelligence Profile
            </Link>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
              gap: 18,
            }}
          >
            <div style={statCard}>
              <div style={statLabel}>Founder Members</div>
              <div style={statNumber}>
                {totalCurrent}/{totalLimit}
              </div>
              <div style={statNote}>
                Founder access closes May 30 or when allocations are filled.
              </div>
            </div>

            <div style={statCard}>
              <div style={statLabel}>Deal Signals</div>
              <div style={statNumber}>0</div>
              <div style={statNote}>
                Live opportunity routing signals.
              </div>
            </div>

            <div style={statCard}>
              <div style={statLabel}>Pain Signals</div>
              <div style={statNumber}>0</div>
              <div style={statNote}>
                Live execution and pressure routing signals.
              </div>
            </div>

            <div style={statCard}>
              <div style={statLabel}>Execution Network</div>
              <div style={statNumber}>Private</div>
              <div style={statNote}>
                Approved member-to-member intelligence routing.
              </div>
            </div>
          </div>
        </div>

        <section style={sectionCard}>
          <div style={sectionEyebrow}>FOUNDER ACCESS</div>

          <h2 style={sectionTitle}>
            Balanced network. Limited founder allocations.
          </h2>

          <p style={sectionText}>
            VaultForge is intentionally balanced. Founder allocations are capped
            by role so the network does not become overloaded with only buyers,
            only wholesalers, or only operators. The goal is a functioning
            execution ecosystem.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))",
              gap: 18,
              marginTop: 28,
            }}
          >
            {founderRoles.map((item) => (
              <div key={item.role} style={roleCard}>
                <div style={roleTitle}>{item.role}</div>

                <div style={roleNumber}>
                  {item.current}/{item.limit}
                </div>

                <div style={roleProgressWrap}>
                  <div
                    style={{
                      ...roleProgress,
                      width: `${(item.current / item.limit) * 100}%`,
                    }}
                  />
                </div>

                <div style={roleNote}>
                  Founder allocation remaining:{" "}
                  {item.limit - item.current}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section style={sectionCard}>
          <div style={sectionEyebrow}>HOW VAULTFORGE WORKS</div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
              gap: 18,
            }}
          >
            {[
              {
                title: "Build Profile",
                text: "Members build detailed intelligence profiles including geography, strategies, pain specialties, capital focus, and execution abilities.",
              },
              {
                title: "Submit Deal or Pain",
                text: "Members submit opportunities, problems, execution issues, distressed situations, funding gaps, or operational needs.",
              },
              {
                title: "VaultForge Intelligence",
                text: "VaultForge Intelligence creates signals and routes those opportunities to members based on fit, geography, experience, and operational relevance.",
              },
              {
                title: "Execution Network",
                text: "Approved members connect privately inside room-based execution workflows and operational communication lanes.",
              },
            ].map((item) => (
              <div key={item.title} style={howCard}>
                <div style={howTitle}>{item.title}</div>
                <div style={howText}>{item.text}</div>
              </div>
            ))}
          </div>
        </section>

        <section style={sectionCard}>
          <div style={sectionEyebrow}>FOUNDING MEMBER ACCESS</div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))",
              gap: 18,
            }}
          >
            <div style={pricingCard}>
              <div style={pricingTitle}>Founder Access</div>

              <div style={pricingPrice}>$49</div>

              <div style={pricingText}>
                First payment today.
                <br />
                Second payment: $49.
                <br />
                Then $299/month beginning month three.
              </div>

              <div style={pricingSmall}>
                Founder pricing closes May 30 or once allocations fill.
              </div>
            </div>

            <div style={pricingCard}>
              <div style={pricingTitle}>Standard Access</div>

              <div style={pricingPrice}>$99</div>

              <div style={pricingText}>
                Access payment after founder phase closes.
                <br />
                Then $299/month ongoing membership.
              </div>

              <div style={pricingSmall}>
                Applied automatically after founder allocations close.
              </div>
            </div>
          </div>
        </section>

        <section style={sectionCard}>
          <div style={sectionEyebrow}>IMPORTANT</div>

          <div style={legalText}>
            VaultForge is a private intelligence and execution network.
            Membership is subject to approval. VaultForge is not acting as a
            broker, lender, attorney, advisor, or fiduciary. Opportunities,
            signals, pain submissions, and member interactions are not
            guaranteed. Members are responsible for their own due diligence,
            legal review, underwriting, negotiations, and execution decisions.
            Membership fees are non-refundable after activation. Cancellation
            stops future renewals only.
          </div>
        </section>
      </section>
    </main>
  );
}

const navBtn: React.CSSProperties = {
  padding: "14px 22px",
  borderRadius: 16,
  background: "#111827",
  color: "white",
  textDecoration: "none",
  border: "1px solid rgba(255,255,255,.12)",
  fontWeight: 700,
};

const goldBtn: React.CSSProperties = {
  padding: "14px 22px",
  borderRadius: 16,
  background: "#f4c842",
  color: "black",
  textDecoration: "none",
  fontWeight: 900,
};

const statCard: React.CSSProperties = {
  borderRadius: 22,
  border: "1px solid rgba(255,255,255,.08)",
  background: "rgba(10,16,32,.85)",
  padding: 22,
};

const statLabel: React.CSSProperties = {
  color: "#f4c842",
  fontWeight: 800,
  letterSpacing: 3,
  fontSize: 12,
  marginBottom: 10,
};

const statNumber: React.CSSProperties = {
  fontSize: 40,
  fontWeight: 900,
  marginBottom: 8,
};

const statNote: React.CSSProperties = {
  color: "rgba(255,255,255,.65)",
  lineHeight: 1.5,
};

const sectionCard: React.CSSProperties = {
  border: "1px solid rgba(244,200,66,.15)",
  borderRadius: 28,
  padding: 32,
  background:
    "linear-gradient(145deg, rgba(8,12,24,.96), rgba(3,5,10,.98))",
  marginBottom: 26,
};

const sectionEyebrow: React.CSSProperties = {
  color: "#f4c842",
  letterSpacing: 6,
  fontWeight: 800,
  fontSize: 13,
  marginBottom: 16,
};

const sectionTitle: React.CSSProperties = {
  fontSize: 42,
  fontWeight: 900,
  marginBottom: 18,
};

const sectionText: React.CSSProperties = {
  color: "rgba(255,255,255,.78)",
  lineHeight: 1.7,
  fontSize: 18,
};

const roleCard: React.CSSProperties = {
  borderRadius: 22,
  border: "1px solid rgba(255,255,255,.08)",
  background: "rgba(10,16,32,.85)",
  padding: 22,
};

const roleTitle: React.CSSProperties = {
  color: "#f4c842",
  fontWeight: 800,
  letterSpacing: 3,
  marginBottom: 14,
};

const roleNumber: React.CSSProperties = {
  fontSize: 34,
  fontWeight: 900,
  marginBottom: 14,
};

const roleProgressWrap: React.CSSProperties = {
  height: 10,
  borderRadius: 999,
  background: "rgba(255,255,255,.08)",
  overflow: "hidden",
  marginBottom: 12,
};

const roleProgress: React.CSSProperties = {
  height: "100%",
  borderRadius: 999,
  background: "#f4c842",
};

const roleNote: React.CSSProperties = {
  color: "rgba(255,255,255,.7)",
};

const howCard: React.CSSProperties = {
  borderRadius: 22,
  border: "1px solid rgba(255,255,255,.08)",
  background: "rgba(10,16,32,.85)",
  padding: 24,
};

const howTitle: React.CSSProperties = {
  fontSize: 24,
  fontWeight: 900,
  marginBottom: 14,
};

const howText: React.CSSProperties = {
  color: "rgba(255,255,255,.72)",
  lineHeight: 1.7,
};

const pricingCard: React.CSSProperties = {
  borderRadius: 24,
  border: "1px solid rgba(244,200,66,.2)",
  padding: 28,
  background: "rgba(10,16,32,.9)",
};

const pricingTitle: React.CSSProperties = {
  color: "#f4c842",
  fontWeight: 900,
  letterSpacing: 4,
  marginBottom: 16,
};

const pricingPrice: React.CSSProperties = {
  fontSize: 64,
  fontWeight: 900,
  marginBottom: 16,
};

const pricingText: React.CSSProperties = {
  color: "rgba(255,255,255,.78)",
  lineHeight: 1.8,
  fontSize: 18,
  marginBottom: 18,
};

const pricingSmall: React.CSSProperties = {
  color: "#f4c842",
  fontWeight: 700,
};

const legalText: React.CSSProperties = {
  color: "rgba(255,255,255,.68)",
  lineHeight: 1.9,
  fontSize: 15,
};

