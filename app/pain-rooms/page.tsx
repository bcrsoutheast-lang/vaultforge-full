import Link from "next/link";
import VaultForgePainRoomsClient from "../components/VaultForgePainRoomsClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const page: React.CSSProperties = { minHeight: "100vh", background: "#05070d", color: "#f7f7fb", padding: 18, fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" };
const wrap: React.CSSProperties = { maxWidth: 1180, margin: "0 auto", paddingBottom: 70 };
const card: React.CSSProperties = { background: "linear-gradient(180deg,#150808,#070810)", border: "1px solid rgba(255,90,90,.30)", borderRadius: 26, padding: 28, marginBottom: 22 };
const eyebrow: React.CSSProperties = { color: "#ffaaaa", textTransform: "uppercase", letterSpacing: 8, fontWeight: 950, fontSize: 16, marginBottom: 14 };
const h1: React.CSSProperties = { fontSize: "clamp(42px,7vw,78px)", lineHeight: .92, letterSpacing: -4, margin: "0 0 18px", fontWeight: 950 };
const sub: React.CSSProperties = { color: "#c9d0dc", fontSize: 21, lineHeight: 1.35, margin: 0 };
const btn: React.CSSProperties = { border: "1px solid rgba(207,216,230,.18)", background: "#171c29", color: "#f7f7fb", borderRadius: 999, padding: "14px 18px", fontWeight: 950, textDecoration: "none", display: "inline-block" };
const goldBtn: React.CSSProperties = { ...btn, border: 0, background: "#ffdc68", color: "#10131a" };
const redBtn: React.CSSProperties = { ...btn, background: "#2b1015", borderColor: "rgba(255,88,88,.55)", color: "#ffb4b4" };

export default function PainRoomsPage() {
  return <main style={page}><div style={wrap}>
    <nav style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 18 }}><Link href="/command" style={btn}>Command</Link><Link href="/pain-intake" style={goldBtn}>Create Pain Room</Link><Link href="/deal-rooms" style={btn}>Deal Rooms</Link><Link href="/messages" style={btn}>Messages</Link><Link href="/" style={redBtn}>Exit</Link></nav>
    <section style={card}><div style={eyebrow}>Pain Rooms</div><h1 style={h1}>Solution command board.</h1><p style={sub}>Every Pain Room is a controlled execution file: pressure, root cause, DMAIC stage, blockers, routing needs, owner contact, photos, and next actions.</p></section>
    <VaultForgePainRoomsClient />
  </div></main>;
}
