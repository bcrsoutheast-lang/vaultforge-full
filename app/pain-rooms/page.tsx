"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { locationFor, markPainRoomRead, painIntelligence, readPainRooms, safeText, setPainRoomState, type PainRoom } from "../lib/vaultforgePain";

const page: React.CSSProperties = { minHeight: "100vh", background: "#05070d", color: "#f7f7fb", padding: 18, fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" };
const wrap: React.CSSProperties = { maxWidth: 1280, margin: "0 auto", paddingBottom: 90 };
const nav: React.CSSProperties = { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 18 };
const brand: React.CSSProperties = { color: "#ffd45a", fontSize: 27, fontWeight: 950, letterSpacing: -1, marginRight: 10 };
const btn: React.CSSProperties = { border: "1px solid rgba(207,216,230,.18)", background: "#171c29", color: "#f7f7fb", borderRadius: 999, padding: "13px 18px", fontWeight: 950, textDecoration: "none", display: "inline-block", cursor: "pointer" };
const goldBtn: React.CSSProperties = { ...btn, border: 0, background: "#ffdc68", color: "#10131a" };
const redBtn: React.CSSProperties = { ...btn, background: "#271016", borderColor: "rgba(255,70,70,.48)", color: "#ffaaaa" };
const hero: React.CSSProperties = { border: "1px solid rgba(245,197,66,.28)", borderRadius: 28, padding: 30, marginBottom: 20, background: "radial-gradient(circle at top right, rgba(245,197,66,.16), transparent 32%), linear-gradient(180deg,#080d19,#050816)" };
const card: React.CSSProperties = { background: "linear-gradient(180deg,#080d19,#050816)", border: "1px solid rgba(245,197,66,.28)", borderRadius: 26, padding: 26, marginBottom: 22 };
const panel: React.CSSProperties = { background: "#121724", border: "1px solid rgba(207,216,230,.16)", borderRadius: 22, padding: 22 };
const activePanel: React.CSSProperties = { ...panel, borderColor: "rgba(255,70,70,.70)", boxShadow: "0 0 26px rgba(255,50,70,.22)" };
const eyebrow: React.CSSProperties = { color: "#ffd45a", textTransform: "uppercase", letterSpacing: 7, fontWeight: 950, fontSize: 15, marginBottom: 12 };
const h1: React.CSSProperties = { fontSize: "clamp(44px,8vw,86px)", lineHeight: 0.9, letterSpacing: -4, margin: "0 0 18px", fontWeight: 950 };
const h2: React.CSSProperties = { fontSize: "clamp(30px,5vw,52px)", lineHeight: 0.95, letterSpacing: -2, margin: "0 0 14px", fontWeight: 950 };
const sub: React.CSSProperties = { color: "#c9d0dc", fontSize: 21, lineHeight: 1.35, margin: 0 };
const muted: React.CSSProperties = { color: "#aeb7c7", margin: "8px 0 0", lineHeight: 1.35 };
const grid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(245px,1fr))", gap: 16 };
const row: React.CSSProperties = { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" };
const photoStyle: React.CSSProperties = { width: "100%", height: 170, objectFit: "cover", borderRadius: 18, border: "1px solid rgba(245,197,66,.25)", marginBottom: 12 };


function numValue(value: unknown) {
  const parsed = Number(String(value || "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function valueList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  if (typeof value === "string" && value.trim()) return value.split(",").map((item) => item.trim()).filter(Boolean);
  return [];
}

function fieldValue(room: any, key: string, fallback = "Not listed") {
  const value = room?.[key];
  if (Array.isArray(value)) return value.length ? value.join(", ") : fallback;
  const clean = String(value || "").trim();
  return clean || fallback;
}

function dealFrontSnapshot(room: any) {
  const asset = fieldValue(room, "assetClass", "Asset");
  const type = fieldValue(room, "propertyType", "Type");
  const isCommercial = asset.toLowerCase().includes("commercial");
  const isLand = asset.toLowerCase().includes("land");

  if (isLand) {
    return [
      ["Asset", asset],
      ["Land Type", type],
      ["Acres", fieldValue(room, "acres")],
      ["Zoning", fieldValue(room, "zoning")],
      ["Utilities", fieldValue(room, "utilities")],
      ["Road", fieldValue(room, "roadFrontage")],
    ];
  }

  if (isCommercial) {
    return [
      ["Asset", asset],
      ["Use", type],
      ["Units", fieldValue(room, "units")],
      ["NOI", fieldValue(room, "noi")],
      ["Cap", fieldValue(room, "capRate")],
      ["Occupancy", fieldValue(room, "occupancy")],
    ];
  }

  return [
    ["Asset", asset],
    ["Type", type],
    ["Beds", fieldValue(room, "beds")],
    ["Baths", fieldValue(room, "baths")],
    ["Sqft", fieldValue(room, "sqft")],
    ["Occupancy", fieldValue(room, "occupancy")],
  ];
}

function dealEinstein(room: any) {
  const ask = numValue(room?.askingPrice || room?.askPrice);
  const arv = numValue(room?.propertyValue || room?.value);
  const repairs = numValue(room?.repairs);
  const spread = arv && ask ? arv - ask - repairs : 0;
  let score = 38;
  if (spread > 25000) score += 12;
  if (spread > 75000) score += 18;
  if (spread > 150000) score += 15;
  if (fieldValue(room, "controlStatus", "").toLowerCase().includes("controlled")) score += 10;
  if (valueList(room?.routeTo).length) score += 7;
  if (!ask || !arv) score -= 8;
  score = Math.max(0, Math.min(100, score));

  const risk = Math.max(10, Math.min(100,
    (!ask || !arv ? 22 : 0) +
    (fieldValue(room, "condition", "").toLowerCase().includes("full") ? 24 : 0) +
    (fieldValue(room, "occupancy", "").toLowerCase().includes("squatter") ? 28 : 0) +
    (fieldValue(room, "controlStatus", "").toLowerCase().includes("no") ? 18 : 0) +
    28
  ));

  return {
    score,
    risk,
    spread,
    signal: score >= 75 ? "Strong opportunity signal" : score >= 55 ? "Workable deal — verify proof" : "Needs stronger facts before hard routing",
    next: !ask || !arv ? "Collect ask, ARV/value, repairs, control, photos, and access before routing hard." : "Verify control, title/access, photos, and numbers, then route to the highest-fit buyer/capital/operator.",
    hidden: spread > 75000 ? "Margin may support buyer spread, capital stack, or JV route." : "Upside depends on cleaner numbers, control, and execution path.",
    killer: !ask || !arv ? "Missing underwriting values." : risk > 70 ? "Risk stack may kill buyer confidence." : "No major killer detected yet.",
  };
}

function painFrontSnapshot(room: any) {
  return [
    ["Pain", valueList(room?.painTypes).join(", ") || "Problem"],
    ["Needs", valueList(room?.needs || room?.routingNeeds).join(", ") || "Solver"],
    ["Severity", fieldValue(room, "severity", "High")],
    ["Time", fieldValue(room, "timePressure")],
    ["Capital", fieldValue(room, "capitalPressure")],
    ["Blocker", valueList(room?.blockers).join(", ") || "Not listed"],
  ];
}

function painEinstein(room: any) {
  let severity = 35;
  const sev = fieldValue(room, "severity", "").toLowerCase();
  if (sev.includes("medium")) severity += 10;
  if (sev.includes("high")) severity += 25;
  if (sev.includes("critical")) severity += 38;
  if (sev.includes("emergency")) severity += 48;
  const pressure = fieldValue(room, "timePressure", "").toLowerCase();
  if (pressure.includes("24") || pressure.includes("72")) severity += 15;
  if (valueList(room?.blockers).some((b) => ["capital", "title", "legal", "city"].includes(b.toLowerCase()))) severity += 10;
  severity = Math.max(0, Math.min(100, severity));
  const collapse = Math.max(10, Math.min(100, severity + valueList(room?.riskTypes || room?.risks).length * 5));
  const solver = Math.max(35, Math.min(98, 100 - Math.round(collapse * .35) + valueList(room?.needs || room?.routingNeeds).length * 6));

  return {
    severity,
    collapse,
    solver,
    signal: severity >= 85 ? "Immediate pressure signal" : severity >= 70 ? "High-priority execution problem" : "Active problem needing routing",
    next: valueList(room?.blockers).includes("Capital") ? "Confirm money needed now, collateral, payoff, and deadline, then route to private capital/lender." : valueList(room?.blockers).includes("Title") ? "Collect title facts and route to title/legal specialist before more capital is burned." : "Identify the single blocker stopping execution and route to the highest-fit solver.",
    consequence: fieldValue(room, "worstCase", "Delay, cost increase, failed closing, loss of control, or legal/financial escalation."),
    fix: fieldValue(room, "desiredSolution", "Triage blocker, assign solver, message route fit, and track response until resolved."),
  };
}

function IntelligenceStrip({ items }: { items: [string, string][] }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(110px,1fr))", gap: 10, marginTop: 14 }}>
      {items.map(([label, value]) => (
        <div key={label} style={{ background: "#070a12", border: "1px solid rgba(245,197,66,.18)", borderRadius: 16, padding: 12 }}>
          <div style={{ ...eyebrow, fontSize: 11, letterSpacing: 4, marginBottom: 6 }}>{label}</div>
          <div style={{ color: "#f7f7fb", fontWeight: 900 }}>{value}</div>
        </div>
      ))}
    </div>
  );
}

function Meter({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ ...row, justifyContent: "space-between" }}>
        <div style={{ ...eyebrow, marginBottom: 6 }}>{label}</div>
        <strong>{value}%</strong>
      </div>
      <div style={{ height: 10, borderRadius: 999, overflow: "hidden", background: "#05070d", border: "1px solid rgba(207,216,230,.12)" }}>
        <div style={{ width: `${Math.max(0, Math.min(100, value))}%`, height: "100%", background: value > 75 ? "#ff4b5c" : "#ffdc68" }} />
      </div>
    </div>
  );
}

function Nav() {
  return (
    <nav style={nav}>
      <div style={brand}>VAULTFORGE</div>
      <Link href="/command" style={btn}>Command</Link>
      <Link href="/network" style={btn}>Network</Link>
      <Link href="/deal-rooms" style={btn}>Deal Rooms</Link>
      <Link href="/pain-rooms" style={goldBtn}>Pain Rooms</Link>
      <Link href="/pain-intake" style={btn}>Pain Intake</Link>
      <Link href="/messages" style={btn}>Messages</Link>
      <Link href="/logout" style={redBtn}>Logout</Link>
    </nav>
  );
}

function PainCard({ room, refresh }: { room: PainRoom; refresh: () => void }) {
  const intel = painIntelligence(room);
  const isHot = !room.alertRead && !room.viewedAt;

  return (
    <div style={isHot ? activePanel : panel}>
      {room.coverPhoto ? <img src={room.coverPhoto} alt={room.title} style={photoStyle} /> : null}
      <div style={eyebrow}>Pain • {room.roomState}</div>
      <h2 style={h2}>{room.title}</h2>
      <p style={sub}>{locationFor(room)}</p>
      <IntelligenceStrip items={painFrontSnapshot(room)} />
      <p style={muted}>AI: {painEinstein(room).signal} • Severity {painEinstein(room).severity}% • Collapse {painEinstein(room).collapse}%</p>
      <Meter label="Solver Fit" value={painEinstein(room).solver} />
      <p style={muted}>Next: {painEinstein(room).next}</p>
      <div style={{ ...row, marginTop: 16 }}>
        <Link href={`/pain-rooms/${encodeURIComponent(room.id)}`} style={goldBtn} onClick={() => markPainRoomRead(room.id)}>Open Room</Link>
        <Link href={`/messages?type=pain&room=${encodeURIComponent(room.id)}&subject=${encodeURIComponent("Pain Room: " + room.title)}`} style={btn}>Messages</Link>
        <button type="button" style={btn} onClick={() => { setPainRoomState(room.id, "saved"); refresh(); }}>Save</button>
        <button type="button" style={btn} onClick={() => { setPainRoomState(room.id, "archived"); refresh(); }}>Archive</button>
        <button type="button" style={redBtn} onClick={() => { setPainRoomState(room.id, "deleted"); refresh(); }}>Delete</button>
      </div>
    </div>
  );
}

export default function PainRoomsPage() {
  const [tick, setTick] = useState(0);
  const rooms = useMemo(() => readPainRooms().filter((room) => room.roomState === "active"), [tick]);

  useEffect(() => {
    const refresh = () => setTick((value) => value + 1);
    window.addEventListener("storage", refresh);
    window.addEventListener("vaultforge-pain-change", refresh);
    window.addEventListener("vaultforge-room-state-change", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("vaultforge-pain-change", refresh);
      window.removeEventListener("vaultforge-room-state-change", refresh);
    };
  }, []);

  return (
    <main style={page}>
      <div style={wrap}>
        <Nav />
        <section style={hero}>
          <div style={eyebrow}>Pain Rooms</div>
          <h1 style={h1}>Active problem board.</h1>
          <p style={sub}>Pain rooms are AI problem-solving command centers: triage pressure, identify blockers, route solvers, and track the next move.</p>
        </section>

        <section style={card}>
          <div style={eyebrow}>Active Pain Cards</div>
          {rooms.length ? <div style={grid}>{rooms.map((room) => <PainCard key={room.id} room={room} refresh={() => setTick((value) => value + 1)} />)}</div> : <p style={sub}>No active pain rooms.</p>}
        </section>
      </div>
    </main>
  );
}