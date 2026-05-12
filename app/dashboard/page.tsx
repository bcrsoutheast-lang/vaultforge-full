import Link from "next/link";

export const dynamic = "force-dynamic";

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(232,196,107,.12), transparent 30%), linear-gradient(180deg,#02040a,#071326 55%,#02040a)",
  color: "white",
  padding: "24px 16px 90px",
  fontFamily: "Arial, sans-serif",
};

const wrap: React.CSSProperties = {
  width: "min(1280px,100%)",
  margin: "0 auto",
};

const section: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.22)",
  borderRadius: 30,
  background: "rgba(255,255,255,.04)",
  padding: 24,
  marginBottom: 20,
  boxShadow: "0 30px 80px rgba(0,0,0,.32)",
};

const executionGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))",
  gap: 16,
  marginTop: 22,
};

const executionCard: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.1)",
  borderRadius: 24,
  padding: 22,
  background:
    "linear-gradient(180deg, rgba(255,255,255,.04), rgba(255,255,255,.02))",
  minHeight: 210,
  position: "relative",
  overflow: "hidden",
};

const chip = {
  display: "inline-flex",
  alignItems: "center",
  borderRadius: 999,
  padding: "6px 10px",
  fontSize: 12,
  fontWeight: 900,
  letterSpacing: ".08em",
  textTransform: "uppercase" as const,
};

export default function DashboardPage() {
  return (
    <main style={page}>
      <div style={wrap}>
        <section style={section}>
          <div
            style={{
              color: "#e8c46b",
              letterSpacing: ".18em",
              textTransform: "uppercase",
              fontWeight: 900,
              fontSize: 12,
              marginBottom: 10,
            }}
          >
            Member Execution Layer
          </div>

          <h2
            style={{
              fontSize: "clamp(42px,7vw,72px)",
              lineHeight: 0.94,
              letterSpacing: "-.06em",
              margin: "0 0 14px",
            }}
          >
            Live execution queue.
          </h2>

          <p
            style={{
              color: "#cbd5e1",
              fontSize: 18,
              lineHeight: 1.6,
              maxWidth: 980,
            }}
          >
            One operating layer for signals, communication, routing,
            introductions, and execution pressure across the VaultForge network.
          </p>

          <div style={executionGrid}>
            <div style={executionCard}>
              <div
                style={{
                  ...chip,
                  border: "1px solid rgba(56,189,248,.35)",
                  color: "#38bdf8",
                  background: "rgba(56,189,248,.08)",
                }}
              >
                Active
              </div>

              <div
                style={{
                  fontSize: 64,
                  fontWeight: 1000,
                  marginTop: 18,
                  color: "#f8fafc",
                }}
              >
                5
              </div>

              <div
                style={{
                  fontSize: 30,
                  fontWeight: 900,
                  marginTop: 6,
                }}
              >
                Active Signals
              </div>

              <p
                style={{
                  color: "#cbd5e1",
                  lineHeight: 1.5,
                  marginTop: 12,
                }}
              >
                New distress signals, capital requests, and active opportunities
                entering your network.
              </p>

              <Link
                href="/signals"
                style={{
                  position: "absolute",
                  bottom: 20,
                  left: 22,
                  color: "white",
                  fontWeight: 900,
                  textDecoration: "none",
                }}
              >
                Open Signals →
              </Link>
            </div>

            <div style={executionCard}>
              <div
                style={{
                  ...chip,
                  border: "1px solid rgba(74,222,128,.35)",
                  color: "#4ade80",
                  background: "rgba(74,222,128,.08)",
                }}
              >
                Communication
              </div>

              <div
                style={{
                  fontSize: 64,
                  fontWeight: 1000,
                  marginTop: 18,
                  color: "#f8fafc",
                }}
              >
                9
              </div>

              <div
                style={{
                  fontSize: 30,
                  fontWeight: 900,
                  marginTop: 6,
                }}
              >
                Conversations
              </div>

              <p
                style={{
                  color: "#cbd5e1",
                  lineHeight: 1.5,
                  marginTop: 12,
                }}
              >
                Member communication, owner replies, and operational follow-up
                activity.
              </p>

              <Link
                href="/messages"
                style={{
                  position: "absolute",
                  bottom: 20,
                  left: 22,
                  color: "white",
                  fontWeight: 900,
                  textDecoration: "none",
                }}
              >
                Open Messages →
              </Link>
            </div>

            <div style={executionCard}>
              <div
                style={{
                  ...chip,
                  border: "1px solid rgba(232,196,107,.35)",
                  color: "#e8c46b",
                  background: "rgba(232,196,107,.08)",
                }}
              >
                Routing
              </div>

              <div
                style={{
                  fontSize: 64,
                  fontWeight: 1000,
                  marginTop: 18,
                  color: "#f8fafc",
                }}
              >
                1
              </div>

              <div
                style={{
                  fontSize: 30,
                  fontWeight: 900,
                  marginTop: 6,
                }}
              >
                Introductions
              </div>

              <p
                style={{
                  color: "#cbd5e1",
                  lineHeight: 1.5,
                  marginTop: 12,
                }}
              >
                Controlled introductions, routing actions, and member-fit
                execution paths.
              </p>

              <Link
                href="/introductions"
                style={{
                  position: "absolute",
                  bottom: 20,
                  left: 22,
                  color: "white",
                  fontWeight: 900,
                  textDecoration: "none",
                }}
              >
                Open Introductions →
              </Link>
            </div>

            <div style={executionCard}>
              <div
                style={{
                  ...chip,
                  border: "1px solid rgba(248,113,113,.35)",
                  color: "#f87171",
                  background: "rgba(248,113,113,.08)",
                }}
              >
                Priority
              </div>

              <div
                style={{
                  fontSize: 64,
                  fontWeight: 1000,
                  marginTop: 18,
                  color: "#f8fafc",
                }}
              >
                4
              </div>

              <div
                style={{
                  fontSize: 30,
                  fontWeight: 900,
                  marginTop: 6,
                }}
              >
                Execution Queue
              </div>

              <p
                style={{
                  color: "#cbd5e1",
                  lineHeight: 1.5,
                  marginTop: 12,
                }}
              >
                Urgent follow-up, pending replies, and operational items waiting
                on action.
              </p>

              <Link
                href="/activity"
                style={{
                  position: "absolute",
                  bottom: 20,
                  left: 22,
                  color: "white",
                  fontWeight: 900,
                  textDecoration: "none",
                }}
              >
                Open Activity →
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
