"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type PainRoom = Record<string, any> & { id: string; photoUrls?: string[]; roomState?: string };

const STORAGE_KEY = "vaultforge_clean_pain_rooms_v1";
const STATE_KEY = "vaultforge_clean_room_states";

function readRooms(): PainRoom[] { try { const raw = window.localStorage.getItem(STORAGE_KEY); const parsed = raw ? JSON.parse(raw) : []; return Array.isArray(parsed) ? parsed : []; } catch { return []; } }
function readStates(): Record<string, string> { try { return JSON.parse(window.localStorage.getItem(STATE_KEY) || "{}"); } catch { return {}; } }
function writeStates(states: Record<string, string>) { window.localStorage.setItem(STATE_KEY, JSON.stringify(states)); }
function arr(room: PainRoom, key: string) { const v = room?.[key]; return Array.isArray(v) ? v.map(String) : typeof v === "string" && v ? v.split(",").map((x) => x.trim()).filter(Boolean) : []; }
function val(room: PainRoom, key: string, fallback = "Not listed") { const v = room?.[key]; return v === undefined || v === null || !String(v).trim() ? fallback : String(v); }
function money(v: string) { const clean = String(v || "").replace(/[^0-9.]/g, ""); if (!clean) return "Not listed"; const n = Number(clean); return Number.isFinite(n) ? `$${n.toLocaleString()}` : v; }
function photo(room: PainRoom) { const urls = arr(room, "photoUrls"); if (urls.length) return urls[0]; const photos = room?.photos; if (Array.isArray(photos) && photos[0]?.url) return String(photos[0].url); return String(room?.photoUrl || room?.photo || ""); }

const card: React.CSSProperties = { background: "linear-gradient(180deg,#150808,#070810)", border: "1px solid rgba(255,90,90,.30)", borderRadius: 26, padding: 20, marginBottom: 16 };
const eyebrow: React.CSSProperties = { color: "#ffaaaa", textTransform: "uppercase", letterSpacing: 5, fontWeight: 950, fontSize: 13, marginBottom: 10 };
const btn: React.CSSProperties = { border: "1px solid rgba(207,216,230,.18)", background: "#171c29", color: "#f7f7fb", borderRadius: 999, padding: "12px 15px", fontWeight: 950, textDecoration: "none", display: "inline-block", cursor: "pointer" };
const goldBtn: React.CSSProperties = { ...btn, border: 0, background: "#ffdc68", color: "#10131a" };
const redBtn: React.CSSProperties = { ...btn, background: "#2b1015", borderColor: "rgba(255,88,88,.55)", color: "#ffb4b4" };

export default function VaultForgePainRoomsClient() {
  const [rooms, setRooms] = useState<PainRoom[]>([]);
  const [states, setStates] = useState<Record<string, string>>({});

  function refresh() { setRooms(readRooms()); setStates(readStates()); }
  useEffect(() => { refresh(); window.addEventListener("vaultforge-pain-change", refresh); return () => window.removeEventListener("vaultforge-pain-change", refresh); }, []);

  function setRoomState(id: string, state: string) { const next = { ...states, [`pain:${id}`]: state, [id]: state }; writeStates(next); setStates(next); }

  const metrics = useMemo(() => ({ active: rooms.length, emergency: rooms.filter((r) => arr(r, "urgency").includes("Emergency")).length, high: rooms.filter((r) => arr(r, "urgency").includes("High")).length, capital: rooms.filter((r) => arr(r, "blockers").includes("Capital")).length }), [rooms]);

  return <>
    <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 14, marginBottom: 18 }}>{Object.entries(metrics).map(([k,v]) => <div key={k} style={card}><div style={eyebrow}>{k}</div><div style={{ fontSize: 42, fontWeight: 950 }}>{v}</div></div>)}</section>
    <section style={card}><div style={eyebrow}>Active Solution Rooms</div>{!rooms.length ? <p style={{ color: "#c9d0dc", fontSize: 19 }}>No saved Pain Rooms yet. Use Pain Intake to create the first solution room.</p> : null}<div style={{ display: "grid", gap: 16 }}>{rooms.map((room) => { const img = photo(room); const state = states[`pain:${room.id}`] || states[room.id] || "active"; return <article key={room.id} style={{ border: "1px solid rgba(255,255,255,.12)", background: "rgba(255,255,255,.04)", borderRadius: 24, padding: 14, display: "grid", gridTemplateColumns: "minmax(160px,220px) 1fr", gap: 16 }}><div style={{ minHeight: 165, borderRadius: 20, overflow: "hidden", background: "#220d12", display: "grid", placeItems: "center", color: "#ffaaaa", fontSize: 44, fontWeight: 950 }}>{img ? <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "!"}</div><div><div style={eyebrow}>{val(room,"assetClass","Pain Room")} • Pressure {val(room,"pressureScore","--")}/100</div><h2 style={{ fontSize: 31, lineHeight: 1, margin: "0 0 8px", letterSpacing: -1 }}>{val(room,"title","Untitled Pain Room")}</h2><p style={{ color: "#c9d0dc", marginTop: 0 }}>{[room.city, room.county, room.state].filter(Boolean).join(" • ") || "Market not listed"}</p><div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "10px 0" }}>{[...arr(room,"painTypes"), ...arr(room,"routingNeeds")].slice(0,7).map((x) => <span key={x} style={{ border: "1px solid rgba(255,90,90,.25)", background: "rgba(255,90,90,.08)", borderRadius: 999, padding: "7px 10px", fontWeight: 850, fontSize: 12 }}>{x}</span>)}</div><p style={{ color: "#c9d0dc" }}>Need {money(val(room,"amountNeeded",""))}. Blockers: {arr(room,"blockers").join(", ") || "not selected"}. DMAIC: {arr(room,"processStage").join(", ") || "Define"}.</p><div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}><Link href={`/pain-rooms/${encodeURIComponent(room.id)}`} style={goldBtn}>Open Room</Link><Link href={`/messages?room=${encodeURIComponent(room.id)}&subject=${encodeURIComponent(`Pain Room: ${val(room,"title","Untitled Pain Room")}`)}`} style={btn}>Message Owner</Link><button type="button" onClick={() => setRoomState(room.id,"saved")} style={btn}>Save</button><button type="button" onClick={() => setRoomState(room.id,"archived")} style={btn}>Archive</button><button type="button" onClick={() => setRoomState(room.id,"deleted")} style={redBtn}>Delete</button><span style={btn}>Current: {state}</span></div></div></article>; })}</div></section>
  </>;
}
