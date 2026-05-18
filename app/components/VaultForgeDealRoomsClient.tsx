"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type DealRoom = Record<string, any>;
type RoomState = "active" | "saved" | "archived" | "deleted";

const DEAL_ARRAY_KEYS = [
  "vaultforge_clean_deal_rooms",
  "vaultforge_deal_rooms",
  "vf_deal_rooms",
  "deal_rooms",
  "vaultforge_rooms_deal",
  "vaultforge_clean_rooms",
];

const page: React.CSSProperties = { background: "#05070d", color: "#f7f7fb", padding: "18px", fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" };
const card: React.CSSProperties = { background: "linear-gradient(180deg,#080d19,#050816)", border: "1px solid rgba(245,197,66,.28)", borderRadius: 26, padding: 28, marginBottom: 22, boxShadow: "0 18px 60px rgba(0,0,0,.3)" };
const eyebrow: React.CSSProperties = { color: "#ffd45a", textTransform: "uppercase", letterSpacing: 8, fontWeight: 950, fontSize: 18, marginBottom: 14 };
const h1: React.CSSProperties = { fontSize: "clamp(40px,7vw,72px)", lineHeight: .92, letterSpacing: -4, margin: "0 0 18px", fontWeight: 950 };
const sub: React.CSSProperties = { color: "#c9d0dc", fontSize: "clamp(18px,2.4vw,25px)", lineHeight: 1.35, margin: 0 };
const button: React.CSSProperties = { display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: 18, padding: "14px 18px", fontWeight: 950, textDecoration: "none", border: "1px solid rgba(207,216,230,.18)", background: "#171c29", color: "#f7f7fb", cursor: "pointer" };
const goldButton: React.CSSProperties = { ...button, background: "#ffdc68", color: "#111319", borderColor: "#ffdc68" };
const redButton: React.CSSProperties = { ...button, background: "#2b1015", color: "#ff9b9b", borderColor: "rgba(255,78,78,.45)" };
const grid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 18 };

function clean(value: any, fallback = "Not listed") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function arr(value: any): string[] {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === "string" && value.includes(",")) return value.split(",").map((v) => v.trim()).filter(Boolean);
  if (typeof value === "string" && value.trim()) return [value.trim()];
  return [];
}

function money(value: any) {
  const text = String(value ?? "").replace(/[^0-9.]/g, "");
  if (!text) return "Not listed";
  const num = Number(text);
  if (Number.isNaN(num)) return String(value);
  return `$${num.toLocaleString()}`;
}

function readJson(key: string) {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeJson(key: string, value: any) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

function getPhoto(deal: DealRoom) {
  return clean(deal.photoDataUrl || deal.photo_url || deal.photoUrl || deal.image_url || deal.imageUrl || deal.coverPhoto || deal.photo, "");
}

function roomId(deal: DealRoom) {
  return String(deal.id || deal.roomId || deal.deal_id || deal.dealId || "");
}

function loadDeals(): DealRoom[] {
  const byId = new Map<string, DealRoom>();

  for (const key of DEAL_ARRAY_KEYS) {
    const data = readJson(key);
    const list = Array.isArray(data) ? data : [];
    for (const item of list) {
      if (!item || typeof item !== "object") continue;
      const id = roomId(item);
      if (!id) continue;
      if (!byId.has(id)) byId.set(id, item);
    }
  }

  for (let i = 0; i < window.localStorage.length; i += 1) {
    const key = window.localStorage.key(i) || "";
    if (!key.startsWith("vaultforge_clean_deal_room_") && !key.startsWith("vaultforge_deal_room_") && !key.startsWith("vf_deal_room_")) continue;
    const item = readJson(key);
    if (!item || typeof item !== "object") continue;
    const id = roomId(item) || key.split("_").pop() || "";
    if (!id) continue;
    byId.set(id, { ...item, id });
  }

  const states = readJson("vaultforge_clean_room_states") || {};
  return Array.from(byId.values())
    .map((deal) => ({ ...deal, id: roomId(deal), roomState: states[roomId(deal)] || deal.roomState || "active" }))
    .filter((deal) => deal.roomState !== "deleted" && deal.roomState !== "archived")
    .sort((a, b) => String(b.createdAt || b.updatedAt || "").localeCompare(String(a.createdAt || a.updatedAt || "")));
}

function updateRoomState(id: string, state: RoomState, deal: DealRoom) {
  const states = readJson("vaultforge_clean_room_states") || {};
  states[id] = state;
  writeJson("vaultforge_clean_room_states", states);

  const folders = readJson("vaultforge_room_folders") || {};
  folders[id] = { id, type: "deal", state, title: clean(deal.title || deal.name, "Deal Room"), updatedAt: new Date().toISOString() };
  writeJson("vaultforge_room_folders", folders);

  const nextDeal = { ...deal, roomState: state, updatedAt: new Date().toISOString() };
  writeJson(`vaultforge_clean_deal_room_${id}`, nextDeal);

  for (const key of DEAL_ARRAY_KEYS) {
    const list = readJson(key);
    if (!Array.isArray(list)) continue;
    writeJson(key, list.map((item: any) => roomId(item) === id ? nextDeal : item));
  }
}

export default function VaultForgeDealRoomsClient() {
  const [deals, setDeals] = useState<DealRoom[]>([]);
  const [notice, setNotice] = useState("");

  function refresh() {
    setDeals(loadDeals());
  }

  useEffect(() => {
    refresh();
    const onStorage = () => refresh();
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const stateCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const deal of deals) {
      const state = clean(deal.state, "NA").toUpperCase();
      counts[state] = (counts[state] || 0) + 1;
    }
    return counts;
  }, [deals]);

  function moveDeal(deal: DealRoom, state: RoomState) {
    const id = roomId(deal);
    if (!id) return;
    updateRoomState(id, state, deal);
    refresh();
    setNotice(state === "saved" ? "Saved to Saved Rooms." : state === "archived" ? "Archived." : "Moved to Deleted Rooms.");
    window.setTimeout(() => setNotice(""), 2200);
  }

  return (
    <div style={page}>
      {notice ? <section style={{ ...card, background: "#102818", borderColor: "rgba(101,255,151,.5)" }}>{notice}</section> : null}

      <section style={card}>
        <div style={eyebrow}>Deal Rooms</div>
        <h1 style={h1}>Clean deal room board.</h1>
        <p style={sub}>Saved opportunities from the Bloomberg intake appear here as clean Deal Room cards.</p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 20 }}>
          <button type="button" style={button} onClick={refresh}>Refresh Rooms</button>
          <Link href="/deal-create" style={goldButton}>Create Deal</Link>
          <Link href="/command" style={button}>Back to Command</Link>
        </div>
      </section>

      <section style={card}>
        <div style={eyebrow}>State Count</div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {Object.keys(stateCounts).length ? Object.entries(stateCounts).map(([state, count]) => <span key={state} style={button}>{state}: {count}</span>) : <p style={sub}>No saved deal rooms yet.</p>}
        </div>
      </section>

      <section style={grid}>
        {deals.length ? deals.map((deal) => {
          const id = roomId(deal);
          const photo = getPhoto(deal);
          const route = arr(deal.routeTo || deal.routingNeeds || deal.route_to).join(", ") || "Not routed";
          return (
            <article key={id} style={card}>
              <div style={eyebrow}>{clean(deal.assetClass || deal.asset_class, "Deal")}</div>
              {photo ? <img src={photo} alt="Deal room" style={{ width: "100%", height: 210, objectFit: "cover", borderRadius: 22, border: "1px solid rgba(207,216,230,.22)", marginBottom: 16 }} /> : null}
              <h2 style={{ fontSize: 36, lineHeight: 1, letterSpacing: -1.6, margin: "0 0 10px", fontWeight: 950 }}>{clean(deal.title || deal.name, "Untitled Deal")}</h2>
              <p style={{ ...sub, fontSize: 18 }}>{[deal.city, deal.county, deal.state].filter(Boolean).join(", ") || "Market not listed"}</p>
              <p style={{ ...sub, fontSize: 22, marginTop: 16 }}>Ask: {money(deal.askingPrice || deal.ask || deal.price)}</p>
              <p style={{ ...sub, fontSize: 22 }}>ARV/Value: {money(deal.arv || deal.value)}</p>
              <p style={{ ...sub, fontSize: 22 }}>Repairs: {money(deal.repairs || deal.work)}</p>
              <p style={{ ...sub, fontSize: 20 }}>Route: {route}</p>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
                <Link href={`/deal-rooms/${id}`} style={goldButton}>Open Room</Link>
                <button type="button" style={button} onClick={() => moveDeal(deal, "saved")}>Save</button>
                <button type="button" style={button} onClick={() => moveDeal(deal, "archived")}>Archive</button>
                <button type="button" style={redButton} onClick={() => moveDeal(deal, "deleted")}>Delete</button>
              </div>
            </article>
          );
        }) : (
          <article style={card}>
            <div style={eyebrow}>No Deal Rooms</div>
            <h1 style={h1}>Create the first room.</h1>
            <Link href="/deal-create" style={goldButton}>Create Deal Opportunity</Link>
          </article>
        )}
      </section>
    </div>
  );
}
