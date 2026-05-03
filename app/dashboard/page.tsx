import Link from "next/link";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const shellStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "#071326",
  color: "white",
  padding: "36px 22px",
  fontFamily: "Arial, sans-serif",
};

const navStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 12,
  marginBottom: 28,
};

const navLinkStyle: React.CSSProperties = {
  color: "white",
  textDecoration: "none",
  border: "1px solid rgba(255,255,255,.25)",
  borderRadius: 999,
  padding: "12px 18px",
  fontSize: 16,
};

const heroStyle: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.2)",
  background: "rgba(255,255,255,.05)",
  borderRadius: 28,
  padding: 28,
  marginBottom: 22,
};

export default function Dashboard() {
  const user = cookies().get("vf_user")?.value;

  if (!user) {
    return (
      <main style={shellStyle}>
        <h1>Not logged in</h1>
        <Link href="/login" style={navLinkStyle}>Go to Login</Link>
      </main>
    );
  }

  return (
    <main style={shellStyle}>
      <nav style={navStyle}>
        <Link href="/submit" style={navLinkStyle}>Create Deal</Link>
        <Link href="/projects" style={navLinkStyle}>Projects</Link>
        <Link href="/buy-bucket" style={navLinkStyle}>Buy Bucket</Link>
        <Link href="/alerts" style={navLinkStyle}>Alerts</Link>
        <Link href="/messages" style={navLinkStyle}>Messages</Link>
        <Link href="/network" style={navLinkStyle}>Network</Link>
      </nav>

      <section style={heroStyle}>
        <p style={{ color: "#9df3bf", letterSpacing: 4, fontWeight: 800 }}>
          VAULTFORGE MEMBER AREA
        </p>
        <h1 style={{ fontSize: 54, lineHeight: 1, margin: "10px 0 18px" }}>
          Dashboard
        </h1>
        <p style={{ color: "rgba(255,255,255,.72)", fontSize: 22, lineHeight: 1.45 }}>
          Create deals, track projects, save opportunities, send messages, and watch alerts.
        </p>
      </section>
    </main>
  );
}
