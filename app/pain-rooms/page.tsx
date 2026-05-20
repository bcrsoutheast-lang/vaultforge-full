"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { locationFor, markPainRoomRead, painIntelligence, readPainRooms, safeText, setPainRoomState, type PainRoom } from "../lib/vaultforgePain";
import { RoomFrontIntelligence } from "../components/VaultForgeRoomIntelligence";

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
      <p style={muted}>{room.painTypes.join(", ")} • Needs: {room.needs.join(", ")} • Severity {room.severity}</p>
      <RoomFrontIntelligence kind="pain" room={room} />
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
          <p style={sub}>Pain rooms carry pressure, AI diagnosis, routing needs, messages, photos, and execution next steps.</p>
        </section>

        <section style={card}>
          <div style={eyebrow}>Active Pain Cards</div>
          {rooms.length ? <div style={grid}>{rooms.map((room) => <PainCard key={room.id} room={room} refresh={() => setTick((value) => value + 1)} />)}</div> : <p style={sub}>No active pain rooms.</p>}
        </section>
      </div>
    </main>
  );
}
