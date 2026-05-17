import Link from "next/link";
import VaultForgeCommandShell from "../components/VaultForgeCommandShell";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const laneCard: React.CSSProperties = {
  border: "1px solid rgba(245,197,91,.22)",
  background: "linear-gradient(145deg,rgba(16,24,36,.92),rgba(2,6,23,.98))",
  borderRadius: 24,
  padding: 18,
  boxShadow: "0 22px 60px rgba(0,0,0,.26)",
};

const redLaneCard: React.CSSProperties = {
  ...laneCard,
  border: "1px solid rgba(239,68,68,.28)",
  background: "linear-gradient(145deg,rgba(35,8,8,.94),rgba(2,6,23,.98))",
};

const button: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  textDecoration: "none",
  color: "#111827",
  background: "linear-gradient(135deg,#fde68a,#e8c46b)",
  borderRadius: 999,
  padding: "12px 15px",
  fontWeight: 950,
};

const ghost: React.CSSProperties = {
  ...button,
  color: "#f8fafc",
  background: "rgba(255,255,255,.06)",
  border: "1px solid rgba(255,255,255,.14)",
};

export default function DashboardPage() {
  return (
    <VaultForgeCommandShell
      active="dashboard"
      eyebrow="VAULTFORGE MEMBER COMMAND"
      title="Two lanes. No clutter."
      subtitle="Deal Rooms handle opportunities. Pain is the intake. Pain Rooms handle execution problems. Alerts, routing, intelligence, profiles, and messages attach inside rooms."
    >
      <section style={{ display: "grid", gap: 14 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
            gap: 14,
          }}
        >
          <article style={laneCard}>
            <div
              style={{
                color: "#f5c55b",
                fontSize: 12,
                fontWeight: 950,
                letterSpacing: ".16em",
                textTransform: "uppercase",
              }}
            >
              DEAL LANE
            </div>

            <h2
              style={{
                fontSize: "clamp(36px,7vw,64px)",
                lineHeight: ".9",
                letterSpacing: "-.07em",
                margin: "12px 0",
              }}
            >
              Deal Rooms
            </h2>

            <p style={{ color: "#cbd5e1", lineHeight: 1.55 }}>
              One lane for all deals, projects, opportunities, properties, underwriting, buyer fit,
              capital fit, and operator routing.
            </p>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 16 }}>
              <Link href="/deal-rooms" style={button}>
                Open Deal Rooms
              </Link>

              <Link href="/submit" style={ghost}>
                Create Deal
              </Link>
            </div>
          </article>

          <article style={redLaneCard}>
            <div
              style={{
                color: "#fca5a5",
                fontSize: 12,
                fontWeight: 950,
                letterSpacing: ".16em",
                textTransform: "uppercase",
              }}
            >
              PAIN EXECUTION
            </div>

            <h2
              style={{
                fontSize: "clamp(36px,7vw,64px)",
                lineHeight: ".9",
                letterSpacing: "-.07em",
                margin: "12px 0",
              }}
            >
              Pain + Pain Rooms
            </h2>

            <p style={{ color: "#fee2e2", lineHeight: 1.55 }}>
              Pain is the intake form. Pain Rooms are the execution lane for distress, funding gaps,
              operator problems, stalled projects, and urgent pressure.
            </p>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 16 }}>
              <Link href="/pain" style={button}>
                Submit Pain
              </Link>

              <Link href="/pain-rooms" style={ghost}>
                Open Pain Rooms
              </Link>
            </div>
          </article>
        </div>

        <article style={laneCard}>
          <div
            style={{
              color: "#f5c55b",
              fontSize: 12,
              fontWeight: 950,
              letterSpacing: ".16em",
              textTransform: "uppercase",
            }}
          >
            5S OPERATING RULE
          </div>

          <h2
            style={{
              fontSize: "clamp(32px,6vw,54px)",
              lineHeight: ".95",
              letterSpacing: "-.06em",
              margin: "12px 0",
            }}
          >
            No Opportunity. No Projects. No Pain Feed.
          </h2>

          <p style={{ color: "#cbd5e1", lineHeight: 1.6 }}>
            Those old lanes are retired from the member product. They redirect into Deal Rooms or Pain Rooms.
            Alerts, routing, intelligence, signals, scoring, and profiles are not separate lanes. They live inside rooms.
          </p>
        </article>
      </section>
    </VaultForgeCommandShell>
  );
}