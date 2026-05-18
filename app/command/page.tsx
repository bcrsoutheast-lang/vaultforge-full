import Link from "next/link";
import VaultForgeLiveAlertEngine from "../components/VaultForgeLiveAlertEngine";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function CommandPage() {
  return (
    <main style={page}>
      <div style={wrap}>
        <nav style={nav}>
          <div style={brand}>VAULTFORGE</div>
          <Link href="/command" style={goldBtn}>Command</Link>
          <Link href="/deal-rooms" style={btn}>Deal Rooms</Link>
          <Link href="/deal-create" style={btn}>Create Deal</Link>
          <Link href="/pain-intake" style={btn}>Pain Intake</Link>
          <Link href="/pain-rooms" style={btn}>Pain Rooms</Link>
          <Link href="/messages" style={btn}>Messages</Link>
          <Link href="/profile" style={btn}>Profile</Link>
          <Link href="/" style={redBtn}>Exit</Link>
        </nav>

        <section style={hero}>
          <div>
            <div style={eyebrow}>Command Center</div>
            <h1 style={h1}>Live intelligence first.</h1>
            <p style={sub}>
              Clean sequence: alerts pulse first, tickets show the pressure, rooms carry the work, messages close the loop.
            </p>
          </div>
        </section>

        <VaultForgeLiveAlertEngine />

        <section style={laneGrid}>
          <CommandLane
            eyebrow="Step 1"
            title="Create / Open Deal"
            copy="New deal creates a room, alert card, message card, and execution ticket."
            primaryHref="/deal-create"
            primaryLabel="Create Deal"
            secondaryHref="/deal-rooms"
            secondaryLabel="Deal Rooms"
          />
          <CommandLane
            eyebrow="Step 2"
            title="Submit / Open Pain"
            copy="New pain creates a solution room, pressure alert, routing need, and message thread."
            primaryHref="/pain-intake"
            primaryLabel="Submit Pain"
            secondaryHref="/pain-rooms"
            secondaryLabel="Pain Rooms"
            red
          />
          <CommandLane
            eyebrow="Step 3"
            title="Message Rooms"
            copy="Deal messages and Pain messages stay separate. Each room keeps its own thread."
            primaryHref="/messages"
            primaryLabel="Open Messages"
            secondaryHref="/profile"
            secondaryLabel="Profile"
          />
        </section>
      </div>
    </main>
  );
}

function CommandLane({
  eyebrow,
  title,
  copy,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
  red = false,
}: {
  eyebrow: string;
  title: string;
  copy: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref: string;
  secondaryLabel: string;
  red?: boolean;
}) {
  return (
    <section style={{ ...lane, ...(red ? redLane : {}) }}>
      <div style={{ ...smallEyebrow, ...(red ? { color: "#ff9b9b" } : {}) }}>{eyebrow}</div>
      <h2 style={h2}>{title}</h2>
      <p style={laneCopy}>{copy}</p>
      <div style={row}>
        <Link href={primaryHref} style={goldBtn}>{primaryLabel}</Link>
        <Link href={secondaryHref} style={btn}>{secondaryLabel}</Link>
      </div>
    </section>
  );
}

const page: React.CSSProperties = { minHeight: "100vh", background: "#05070d", color: "#f7f7fb", padding: 18, fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" };
const wrap: React.CSSProperties = { maxWidth: 1280, margin: "0 auto", paddingBottom: 80 };
const nav: React.CSSProperties = { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 18 };
const brand: React.CSSProperties = { color: "#ffd45a", fontSize: 27, fontWeight: 950, letterSpacing: -1, marginRight: 10 };
const btn: React.CSSProperties = { border: "1px solid rgba(207,216,230,.18)", background: "#171c29", color: "#f7f7fb", borderRadius: 999, padding: "13px 18px", fontWeight: 950, textDecoration: "none", display: "inline-block" };
const goldBtn: React.CSSProperties = { ...btn, border: 0, background: "#ffdc68", color: "#10131a" };
const redBtn: React.CSSProperties = { ...btn, background: "#271016", borderColor: "rgba(255,70,70,.48)", color: "#ffaaaa" };
const hero: React.CSSProperties = { border: "1px solid rgba(245,197,66,.28)", borderRadius: 28, padding: 30, marginBottom: 20, background: "radial-gradient(circle at top right, rgba(245,197,66,.16), transparent 32%), linear-gradient(180deg,#080d19,#050816)" };
const eyebrow: React.CSSProperties = { color: "#ffd45a", textTransform: "uppercase", letterSpacing: 8, fontWeight: 950, fontSize: 17, marginBottom: 12 };
const smallEyebrow: React.CSSProperties = { color: "#ffd45a", textTransform: "uppercase", letterSpacing: 5, fontWeight: 950, fontSize: 13, marginBottom: 12 };
const h1: React.CSSProperties = { fontSize: "clamp(44px,8vw,86px)", lineHeight: .9, letterSpacing: -4, margin: "0 0 18px", fontWeight: 950 };
const h2: React.CSSProperties = { fontSize: "clamp(32px,5vw,54px)", lineHeight: .95, letterSpacing: -2, margin: "0 0 14px", fontWeight: 950 };
const sub: React.CSSProperties = { color: "#c9d0dc", fontSize: 23, lineHeight: 1.35, maxWidth: 860, margin: 0 };
const laneGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 18, marginTop: 20 };
const lane: React.CSSProperties = { border: "1px solid rgba(245,197,66,.26)", borderRadius: 26, padding: 26, background: "linear-gradient(180deg,#080d19,#050816)" };
const redLane: React.CSSProperties = { borderColor: "rgba(255,70,70,.34)", background: "linear-gradient(180deg,#17070d,#050816)" };
const laneCopy: React.CSSProperties = { color: "#c9d0dc", fontSize: 18, lineHeight: 1.4, margin: "0 0 18px" };
const row: React.CSSProperties = { display: "flex", gap: 12, flexWrap: "wrap" };
