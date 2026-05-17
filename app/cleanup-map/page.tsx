import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(239, 68, 68, 0.16), transparent 28%), radial-gradient(circle at top right, rgba(245, 158, 11, 0.15), transparent 28%), linear-gradient(180deg, #02040a 0%, #071018 48%, #02040a 100%)",
  color: "#f8fafc",
  padding: "28px 18px 80px",
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
};

const wrap: React.CSSProperties = {
  width: "100%",
  maxWidth: 1180,
  margin: "0 auto",
};

const topBar: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 14,
  alignItems: "center",
  marginBottom: 22,
  flexWrap: "wrap",
};

const badge: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  border: "1px solid rgba(245, 197, 91, 0.34)",
  background: "rgba(245, 197, 91, 0.08)",
  color: "#f5c55b",
  borderRadius: 999,
  padding: "9px 13px",
  fontSize: 12,
  fontWeight: 900,
  letterSpacing: "0.11em",
  textTransform: "uppercase",
};

const button: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  border: "1px solid rgba(245, 197, 91, 0.38)",
  background: "linear-gradient(180deg, rgba(245,197,91,.16), rgba(245,197,91,.06))",
  color: "#f8fafc",
  borderRadius: 14,
  padding: "12px 15px",
  textDecoration: "none",
  fontSize: 13,
  fontWeight: 900,
};

const hero: React.CSSProperties = {
  border: "1px solid rgba(245, 197, 91, 0.28)",
  background:
    "linear-gradient(145deg, rgba(16, 24, 36, 0.96), rgba(7, 10, 17, 0.98))",
  boxShadow: "0 24px 80px rgba(0,0,0,.42)",
  borderRadius: 28,
  padding: "28px",
  marginBottom: 18,
};

const eyebrow: React.CSSProperties = {
  color: "#f5c55b",
  fontWeight: 950,
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  fontSize: 12,
  marginBottom: 12,
};

const title: React.CSSProperties = {
  fontSize: "clamp(38px, 8vw, 82px)",
  lineHeight: 0.92,
  letterSpacing: "-0.07em",
  margin: "0 0 16px",
  fontWeight: 950,
};

const sub: React.CSSProperties = {
  maxWidth: 850,
  color: "#cbd5e1",
  fontSize: "clamp(17px, 3vw, 25px)",
  lineHeight: 1.45,
  margin: 0,
};

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(255px, 1fr))",
  gap: 14,
};

const card: React.CSSProperties = {
  border: "1px solid rgba(148, 163, 184, 0.18)",
  background:
    "linear-gradient(145deg, rgba(15, 23, 42, 0.94), rgba(2, 6, 23, 0.96))",
  borderRadius: 22,
  padding: 18,
};

const cardTitle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 950,
  margin: "0 0 8px",
};

const cardText: React.CSSProperties = {
  color: "#cbd5e1",
  lineHeight: 1.55,
  margin: 0,
  fontSize: 14,
};

const lane: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  padding: "14px 0",
  borderTop: "1px solid rgba(148, 163, 184, 0.14)",
};

const statusGood: React.CSSProperties = {
  color: "#22c55e",
  fontWeight: 950,
  fontSize: 12,
  letterSpacing: ".08em",
};

const statusWarn: React.CSSProperties = {
  color: "#f59e0b",
  fontWeight: 950,
  fontSize: 12,
  letterSpacing: ".08em",
};

export default function CleanupMapPage() {
  return (
    <main style={page}>
      <div style={wrap}>
        <div style={topBar}>
          <div style={badge}>VAULTFORGE 5S COMMAND MAP</div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link href="/dashboard" style={button}>
              Dashboard
            </Link>
            <Link href="/opportunity-rooms" style={button}>
              Opportunity Rooms
            </Link>
            <Link href="/pressure-rooms" style={button}>
              Pain Rooms
            </Link>
          </div>
        </div>

        <section style={hero}>
          <div style={eyebrow}>SORT · SET IN ORDER · SHINE · STANDARDIZE · SUSTAIN</div>
          <h1 style={title}>5S cleanup law.</h1>
          <p style={sub}>
            Every room follows the same reaction system: Save, Archive, Hide,
            Restore. Opportunity rooms and Pain rooms stay as the only true room
            types. Alerts, routing, intelligence, and messages operate as
            background layers attached to those rooms.
          </p>
        </section>

        <section style={grid}>
          <div style={card}>
            <h2 style={cardTitle}>Opportunity Rooms</h2>
            <p style={cardText}>
              Deals, projects, acquisitions, capital targets, and execution
              opportunities. These rooms carry the business case and execution
              context.
            </p>

            <div style={lane}>
              <span>Active / Saved / Archived / Hidden</span>
              <span style={statusGood}>ROOM STATE</span>
            </div>
            <div style={lane}>
              <span>Alerts, routing, intelligence attached behind the scenes</span>
              <span style={statusGood}>CORRECT</span>
            </div>
          </div>

          <div style={card}>
            <h2 style={cardTitle}>Pain Rooms</h2>
            <p style={cardText}>
              Distress, funding gaps, operator problems, stalled construction,
              buyer needs, seller pressure, and execution pain.
            </p>

            <div style={lane}>
              <span>Active / Saved / Archived / Hidden</span>
              <span style={statusGood}>ROOM STATE</span>
            </div>
            <div style={lane}>
              <span>Signals and urgency layers attach to pain</span>
              <span style={statusGood}>CORRECT</span>
            </div>
          </div>

          <div style={card}>
            <h2 style={cardTitle}>Alerts</h2>
            <p style={cardText}>
              Alerts should not become separate rooms long-term. They are the
              urgency and notification layer that points back into an
              Opportunity room or Pain room.
            </p>

            <div style={lane}>
              <span>Current role</span>
              <span style={statusWarn}>LAYER</span>
            </div>
            <div style={lane}>
              <span>Do not create alert-room sprawl</span>
              <span style={statusGood}>LOCKED</span>
            </div>
          </div>

          <div style={card}>
            <h2 style={cardTitle}>Routing</h2>
            <p style={cardText}>
              Routing is the execution-matching layer: buyers, operators,
              lenders, capital, intros, and next actions. It belongs behind
              Opportunity and Pain rooms.
            </p>

            <div style={lane}>
              <span>Current role</span>
              <span style={statusWarn}>LAYER</span>
            </div>
            <div style={lane}>
              <span>Long-term room type?</span>
              <span style={statusGood}>NO</span>
            </div>
          </div>

          <div style={card}>
            <h2 style={cardTitle}>Intelligence</h2>
            <p style={cardText}>
              Intelligence is the market analysis layer: county heat, distress
              movement, demand spikes, lender pullbacks, and AI summaries.
            </p>

            <div style={lane}>
              <span>Current role</span>
              <span style={statusWarn}>LAYER</span>
            </div>
            <div style={lane}>
              <span>Terminal visibility</span>
              <span style={statusGood}>YES</span>
            </div>
          </div>

          <div style={card}>
            <h2 style={cardTitle}>Messages</h2>
            <p style={cardText}>
              Messages should carry room context. They should connect members
              around Opportunity and Pain rooms instead of creating disconnected
              conversations.
            </p>

            <div style={lane}>
              <span>Room-context messaging</span>
              <span style={statusGood}>TARGET</span>
            </div>
            <div style={lane}>
              <span>Separate room type?</span>
              <span style={statusGood}>NO</span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}