import Link from "next/link";
import MessagesClient from "./MessagesClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(181,92,255,.22), transparent 28%), radial-gradient(circle at top right, rgba(157,243,191,.14), transparent 24%), linear-gradient(180deg,#02040a 0%,#071326 52%,#030509 100%)",
  color: "white",
  padding: "28px 18px 100px",
  fontFamily: "Arial, sans-serif",
};

const wrap: React.CSSProperties = {
  maxWidth: 1180,
  margin: "0 auto",
};

const hero: React.CSSProperties = {
  border: "1px solid rgba(157,243,191,.28)",
  background:
    "linear-gradient(145deg, rgba(181,92,255,.14), rgba(157,243,191,.06), rgba(255,255,255,.035))",
  borderRadius: 34,
  padding: 26,
  marginBottom: 22,
};

const btn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "linear-gradient(135deg,#f5d978,#9df3bf 55%,#b55cff)",
  color: "#06100a",
  textDecoration: "none",
  borderRadius: 999,
  padding: "13px 18px",
  fontWeight: 950,
  border: "none",
  margin: "7px 7px 0 0",
  minHeight: 46,
};

const ghost: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  color: "white",
  textDecoration: "none",
  borderRadius: 999,
  padding: "13px 18px",
  fontWeight: 900,
  border: "1px solid rgba(255,255,255,.18)",
  background: "rgba(255,255,255,.06)",
  margin: "7px 7px 0 0",
  minHeight: 46,
};

const eyebrow: React.CSSProperties = {
  color: "#9df3bf",
  letterSpacing: 5,
  fontWeight: 950,
  fontSize: 12,
  marginBottom: 12,
  textTransform: "uppercase",
};

const muted: React.CSSProperties = {
  color: "rgba(255,255,255,.72)",
  lineHeight: 1.55,
};

export default function MessagesPage() {
  return (
    <main style={page}>
      <style>{`
        a:hover {
          transform: translateY(-1px);
          transition: all .18s ease;
          filter: brightness(1.06);
        }

        @media (max-width: 760px) {
          a {
            width: 100%;
            box-sizing: border-box;
          }
        }
      `}</style>

      <div style={wrap}>
        <section style={hero}>
          <div style={eyebrow}>VaultForge Message Center</div>
          <h1 style={{ fontSize: "clamp(52px,11vw,98px)", lineHeight: 0.9, margin: "0 0 18px" }}>
            Conversations tied to execution.
          </h1>
          <p style={{ ...muted, fontSize: 20 }}>
            Use Pain Messages for problem-specific conversations, or continue into the existing message inbox below.
          </p>

          <Link href="/pain-messages" style={btn}>Pain Messages</Link>
          <Link href="/pain" style={ghost}>Pain Feed</Link>
          <Link href="/routing" style={ghost}>Routing</Link>
          <Link href="/alerts" style={ghost}>Alerts</Link>
          <Link href="/dashboard" style={ghost}>Dashboard</Link>
        </section>

        <MessagesClient />
      </div>
    </main>
  );
}
