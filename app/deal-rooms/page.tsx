import Link from "next/link";
import VaultForgeDealRoomsClient from "../components/VaultForgeDealRoomsClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const page: React.CSSProperties = {
  minHeight: "100vh",
  background: "#05070d",
  color: "#f7f7fb",
  padding: 18,
  fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
};

const wrap: React.CSSProperties = { maxWidth: 1180, margin: "0 auto", paddingBottom: 70 };
const navBtn: React.CSSProperties = { border: "1px solid rgba(207,216,230,.18)", background: "#171c29", color: "#f7f7fb", borderRadius: 999, padding: "13px 18px", fontWeight: 950, textDecoration: "none", display: "inline-block" };
const goldBtn: React.CSSProperties = { ...navBtn, border: 0, background: "#ffdc68", color: "#10131a" };
const redBtn: React.CSSProperties = { ...navBtn, background: "#271016", borderColor: "rgba(255,70,70,.48)", color: "#ffaaaa" };

export default function DealRoomsPage() {
  return (
    <main style={page}>
      <div style={wrap}>
        <nav style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 18 }}>
          <Link href="/command" style={navBtn}>Command</Link>
          <Link href="/deal-create" style={goldBtn}>Create Deal</Link>
          <Link href="/pain-intake" style={navBtn}>Pain Intake</Link>
          <Link href="/profile" style={navBtn}>Profile</Link>
          <Link href="/" style={redBtn}>Exit</Link>
        </nav>
        <VaultForgeDealRoomsClient />
      </div>
    </main>
  );
}
