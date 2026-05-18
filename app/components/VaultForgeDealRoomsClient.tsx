"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type RoomState = "active" | "saved" | "archived" | "deleted";
type DealRoom = Record<string, any> & { id: string; roomState?: RoomState; routeTo?: string[]; routedProfiles?: any[]; photoUrl?: string; photoDataUrl?: string; photoName?: string; createdAt?: string; updatedAt?: string };

const DEAL_KEYS = ["vaultforge_clean_deal_rooms", "vaultforge_deal_rooms", "vaultforge_rooms_deals", "vf_deal_rooms"];
const stateKey = "vaultforge_clean_room_states";
const page: React.CSSProperties = { minHeight: "100vh", background: "#05070d", color: "#f7f7fb", padding: 18, fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" };
const wrap: React.CSSProperties = { maxWidth: 1180, margin: "0 auto", paddingBottom: 80 };
const card: React.CSSProperties = { background: "linear-gradient(180deg,#080d19,#050816)", border: "1px solid rgba(245,197,66,.28)", borderRadius: 26, padding: 28, marginBottom: 22, boxShadow: "0 18px 60px rgba(0,0,0,.3)" };
const eyebrow: React.CSSProperties = { color: "#ffd45a", textTransform: "uppercase", letterSpacing: 8, fontWeight: 950, fontSize: 18, marginBottom: 14 };
const h1: React.CSSProperties = { fontSize: "clamp(40px,7vw,78px)", lineHeight: .92, letterSpacing: -4, margin: "0 0 18px", fontWeight: 950 };
const sub: React.CSSProperties = { color: "#c9d0dc", fontSize: "clamp(18px,2.6vw,25px)", lineHeight: 1.35, margin: 0 };
const button: React.CSSProperties = { border: 0, borderRadius: 18, padding: "14px 18px", fontWeight: 950, cursor: "pointer", fontSize: 16, textDecoration: "none", display: "inline-flex", alignItems: "center", justifyContent: "center" };
const primaryButton: React.CSSProperties = { ...button, background: "#ffdc68", color: "#111319" };
const darkButton: React.CSSProperties = { ...button, background: "#171c29", color: "#f7f7fb", border: "1px solid rgba(207,216,230,.18)" };
const dangerButton: React.CSSProperties = { ...button, background: "#2a1117", color: "#ff9b9b", border: "1px solid rgba(255,78,78,.45)" };

function parseArray(raw: string | null): DealRoom[] { try { const data = raw ? JSON.parse(raw) : []; return Array.isArray(data) ? data.filter((x) => x && typeof x === "object") : []; } catch { return []; } }
function getId(deal: DealRoom) { return String(deal.id || deal.roomId || deal.item_id || deal.createdAt || Math.random()); }
function photoOf(deal: DealRoom) { return String(deal.photoUrl || deal.photo_url || deal.image_url || deal.imageUrl || deal.photoDataUrl || deal.photo_data_url || ""); }
function money(value: any) { const cleaned = String(value || "").replace(/[^0-9.]/g, ""); if (!cleaned) return "Not listed"; const n = Number(cleaned); return Number.isNaN(n) ? String(value) : `$${n.toLocaleString()}`; }
function stateOf(deal: DealRoom): RoomState { return (deal.roomState || "active") as RoomState; }
function readRoomStates(): Record<string, RoomState> { try { return JSON.parse(localStorage.getItem(stateKey) || "{}"); } catch { return {}; } }
function writeRoomState(id: string, state: RoomState) { const states = readRoomStates(); states[id] = state; localStorage.setItem(stateKey, JSON.stringify(states)); }
function routeList(deal: DealRoom) { const r = deal.routeTo || deal.route_to || deal.routes || []; return Array.isArray(r) ? r : String(r || "").split(",").map((x) => x.trim()).filter(Boolean); }
function routedCount(deal: DealRoom) { const profiles = deal.routedProfiles || deal.routed_profiles || []; return Array.isArray(profiles) ? profiles.length : routeList(deal).length; }

function loadDeals(): DealRoom[] {
  const states = readRoomStates();
  const map = new Map<string, DealRoom>();
  for (const key of DEAL_KEYS) for (const deal of parseArray(localStorage.getItem(key))) {
    const id = getId(deal);
    const merged = { ...deal, id, roomState: states[id] || deal.roomState || "active" };
    if (!map.has(id) || photoOf(merged)) map.set(id, merged);
  }
  for (const key of Object.keys(localStorage)) {
    if (key.startsWith("vaultforge_clean_deal_room_") || key.startsWith("vaultforge_deal_room_") || key.startsWith("vf_deal_room_")) {
      try {
        const deal = JSON.parse(localStorage.getItem(key) || "{}");
        const id = getId(deal);
        const current = map.get(id);
        map.set(id, { ...current, ...deal, id, roomState: states[id] || deal.roomState || current?.roomState || "active" });
      } catch {}
    }
  }
  const deals = Array.from(map.values()).filter((d) => stateOf(d) !== "deleted" && stateOf(d) !== "archived");
  deals.sort((a, b) => String(b.createdAt || b.updatedAt || "").localeCompare(String(a.createdAt || a.updatedAt || "")));
  return deals;
}

function persistUpdatedDeal(deal: DealRoom) {
  for (const key of DEAL_KEYS) {
    const array = parseArray(localStorage.getItem(key));
    const id = getId(deal);
    const without = array.filter((item) => getId(item) !== id);
    localStorage.setItem(key, JSON.stringify([deal, ...without]));
  }
  localStorage.setItem(`vaultforge_clean_deal_room_${deal.id}`, JSON.stringify(deal));
  localStorage.setItem(`vaultforge_deal_room_${deal.id}`, JSON.stringify(deal));
  localStorage.setItem(`vf_deal_room_${deal.id}`, JSON.stringify(deal));
}

export default function VaultForgeDealRoomsClient() {
  const [deals, setDeals] = useState<DealRoom[]>([]);
  function refresh() { setDeals(loadDeals()); }
  useEffect(() => { refresh(); }, []);
  function setRoomState(deal: DealRoom, state: RoomState) { const updated = { ...deal, roomState: state, updatedAt: new Date().toISOString() }; writeRoomState(getId(deal), state); persistUpdatedDeal(updated); refresh(); }
  const counts = useMemo(() => deals.reduce((acc: Record<string, number>, deal) => { const st = String(deal.state || "NA").toUpperCase(); acc[st] = (acc[st] || 0) + 1; return acc; }, {}), [deals]);
  return <main style={page}><div style={wrap}>
    <nav style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 18 }}><Link href="/command" style={darkButton}>Command</Link><Link href="/deal-create" style={primaryButton}>Create Deal</Link><Link href="/pain-intake" style={darkButton}>Pain Intake</Link><Link href="/profile" style={darkButton}>Profile</Link><Link href="/" style={dangerButton}>Exit</Link></nav>
    <section style={card}><div style={eyebrow}>Deal Rooms</div><h1 style={h1}>Clean deal room board.</h1><p style={sub}>Photos, AI-routed profile lanes, state count, and room controls stay synced from the intake.</p><div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 22 }}><button style={darkButton} onClick={refresh}>Refresh Rooms</button><Link href="/deal-create" style={primaryButton}>Create Deal</Link></div></section>
    <section style={card}><div style={eyebrow}>State Count</div><div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>{Object.keys(counts).length ? Object.entries(counts).map(([k, v]) => <span key={k} style={darkButton}>{k}: {v}</span>) : <p style={sub}>No active deal rooms yet.</p>}</div></section>
    <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 22 }}>{deals.map((deal) => { const photo = photoOf(deal); return <article key={getId(deal)} style={card}>{photo ? <img src={photo} alt={deal.title || "Deal photo"} style={{ width: "100%", height: 220, objectFit: "cover", borderRadius: 22, border: "1px solid rgba(207,216,230,.18)", marginBottom: 20 }} /> : <div style={{ height: 190, border: "1px dashed rgba(207,216,230,.24)", borderRadius: 22, display: "grid", placeItems: "center", color: "#cbd3df", marginBottom: 20 }}>No photo saved</div>}<div style={eyebrow}>{deal.assetClass || "Deal"}</div><h2 style={{ fontSize: 34, lineHeight: 1, margin: "0 0 10px", letterSpacing: -1.5 }}>{deal.title || "Untitled Deal"}</h2><p style={{ color: "#cbd3df", fontSize: 18 }}>{deal.city || "City"}, {deal.county || "County"}, {deal.state || "State"}</p><p style={{ color: "#dce4ef", fontSize: 20, lineHeight: 1.4 }}>Ask: {money(deal.askingPrice)}<br />ARV/Value: {money(deal.arv)}<br />Repairs: {money(deal.repairs)}<br />Route: {routeList(deal).join(", ") || "Not routed"}<br />AI routed profiles: {routedCount(deal)}</p><div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}><Link href={`/deal-rooms/${getId(deal)}`} style={primaryButton}>Open Room</Link><button onClick={() => setRoomState(deal, "saved")} style={darkButton}>Save</button><button onClick={() => setRoomState(deal, "archived")} style={darkButton}>Archive</button><button onClick={() => setRoomState(deal, "deleted")} style={dangerButton}>Delete</button></div></article>; })}</section>
  </div></main>;
}
