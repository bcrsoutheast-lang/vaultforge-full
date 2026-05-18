"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type RoomState = "active" | "saved" | "archived" | "deleted";

type DealRoom = {
  id?: string;
  kind?: string;
  assetClass?: string;
  title?: string;
  state?: string;
  city?: string;
  county?: string;
  address?: string;
  askingPrice?: string;
  arv?: string;
  repairs?: string;
  equitySpread?: string;
  beds?: string;
  baths?: string;
  sqft?: string;
  acres?: string;
  units?: string;
  buildingSize?: string;
  zoning?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  bestContact?: string;
  submitterRole?: string;
  routeTo?: string[];
  urgency?: string;
  occupancy?: string;
  knownIssues?: string[];
  access?: string;
  docs?: string[];
  assignmentFee?: string;
  deadline?: string;
  notes?: string;
  aiRead?: string;
  photoName?: string;
  photoDataUrl?: string;
  image?: string;
  photo?: string;
  createdAt?: string;
  updatedAt?: string;
  roomState?: RoomState;
};

const DEAL_KEYS = [
  "vaultforge_clean_deal_rooms",
  "vaultforge_deal_rooms",
  "vaultforge_rooms_deals",
  "vf_deal_rooms",
  "deal_rooms",
];

const STATE_KEY = "vaultforge_clean_room_states";

const page: React.CSSProperties = {
  minHeight: "100vh",
  background: "#05070d",
  color: "#f7f7fb",
  padding: "18px",
  fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
};
const wrap: React.CSSProperties = { maxWidth: 1180, margin: "0 auto", paddingBottom: 60 };
const card: React.CSSProperties = { background: "linear-gradient(180deg,#080d19,#050816)", border: "1px solid rgba(245,197,66,.28)", borderRadius: 26, padding: 28, marginBottom: 22, boxShadow: "0 18px 60px rgba(0,0,0,.3)" };
const eyebrow: React.CSSProperties = { color: "#ffd45a", textTransform: "uppercase", letterSpacing: 8, fontWeight: 900, fontSize: 18, marginBottom: 14 };
const h1: React.CSSProperties = { fontSize: "clamp(42px,7vw,76px)", lineHeight: .92, letterSpacing: -4, margin: "0 0 18px", fontWeight: 950 };
const sub: React.CSSProperties = { color: "#c9d0dc", fontSize: "clamp(18px,2.4vw,25px)", lineHeight: 1.35, margin: 0 };
const navBtn: React.CSSProperties = { display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: 999, padding: "13px 17px", background: "#171c29", color: "#f7f7fb", border: "1px solid rgba(207,216,230,.18)", fontWeight: 900, textDecoration: "none" };
const primaryBtn: React.CSSProperties = { ...navBtn, background: "#ffdc68", color: "#111319", borderColor: "#ffdc68" };
const dangerBtn: React.CSSProperties = { ...navBtn, background: "#2b1015", color: "#ffb4b4", borderColor: "rgba(255,88,88,.45)", cursor: "pointer" };
const ghostButton: React.CSSProperties = { ...navBtn, cursor: "pointer" };
const grid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 18 };

function safeArray(value: unknown): DealRoom[] {
  return Array.isArray(value) ? value.filter((item) => item && typeof item === "object") as DealRoom[] : [];
}

function readJson(key: string): unknown {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function roomId(deal: DealRoom, index = 0) {
  return String(deal.id || `deal_${deal.title || "room"}_${deal.city || "market"}_${index}`).replace(/[^a-zA-Z0-9_\-]/g, "_");
}

function getRoomStates(): Record<string, RoomState> {
  const raw = readJson(STATE_KEY);
  return raw && typeof raw === "object" && !Array.isArray(raw) ? raw as Record<string, RoomState> : {};
}

function readAllDeals(): DealRoom[] {
  const byId = new Map<string, DealRoom>();
  DEAL_KEYS.forEach((key) => {
    safeArray(readJson(key)).forEach((deal, index) => {
      const id = roomId(deal, index);
      byId.set(id, { ...deal, id });
    });
  });
  for (let i = 0; i < window.localStorage.length; i += 1) {
    const key = window.localStorage.key(i) || "";
    if (key.startsWith("vaultforge_clean_deal_room_") || key.startsWith("vaultforge_deal_room_")) {
      const deal = readJson(key) as DealRoom | null;
      if (deal && typeof deal === "object") {
        const id = roomId(deal);
        byId.set(id, { ...deal, id });
      }
    }
  }
  const states = getRoomStates();
  return Array.from(byId.values())
    .map((deal) => ({ ...deal, id: roomId(deal), roomState: states[roomId(deal)] || deal.roomState || "active" }))
    .filter((deal) => deal.roomState !== "deleted" && deal.roomState !== "archived")
    .sort((a, b) => String(b.createdAt || b.updatedAt || "").localeCompare(String(a.createdAt || a.updatedAt || "")));
}

function syncDeals(deals: DealRoom[]) {
  try {
    const clean = deals.map((deal) => ({ ...deal, id: roomId(deal) }));
    DEAL_KEYS.forEach((key) => window.localStorage.setItem(key, JSON.stringify(clean)));
    clean.forEach((deal) => window.localStorage.setItem(`vaultforge_clean_deal_room_${roomId(deal)}`, JSON.stringify(deal)));
  } catch {
    // Keep page usable even if browser storage refuses a sync.
  }
}

function money(value?: string) {
  const text = String(value || "").trim();
  return text || "Not listed";
}

export default function VaultForgeDealRoomsClient() {
  const [deals, setDeals] = useState<DealRoom[]>([]);

  function refresh() {
    const loaded = readAllDeals();
    syncDeals(loaded);
    setDeals(loaded);
  }

  useEffect(() => {
    refresh();
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const stateCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    deals.forEach((deal) => {
      const state = String(deal.state || "Unknown").toUpperCase();
      counts[state] = (counts[state] || 0) + 1;
    });
    return counts;
  }, [deals]);

  function updateState(id: string, state: RoomState) {
    const current = getRoomStates();
    current[id] = state;
    window.localStorage.setItem(STATE_KEY, JSON.stringify(current));
    refresh();
  }

  return (
    <main style={page}>
      <div style={wrap}>
        <nav style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 18 }}>
          <Link href="/command" style={navBtn}>Command</Link>
          <Link href="/deal-create" style={primaryBtn}>Create Deal</Link>
          <Link href="/pain-intake" style={navBtn}>Pain Intake</Link>
          <Link href="/profile" style={navBtn}>Profile</Link>
          <Link href="/" style={{ ...navBtn, color: "#ffb4b4", borderColor: "rgba(255,88,88,.45)" }}>Exit</Link>
        </nav>

        <section style={card}>
          <div style={eyebrow}>Deal Rooms</div>
          <h1 style={h1}>Clean deal room board.</h1>
          <p style={sub}>Saved opportunities from the intake appear here as clean Deal Room cards with photos, routing, state count, and cleanup controls.</p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 20 }}>
            <button type="button" style={ghostButton} onClick={refresh}>Refresh Rooms</button>
            <Link href="/deal-create" style={primaryBtn}>Create Deal</Link>
          </div>
        </section>

        <section style={card}>
          <div style={eyebrow}>State Count</div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {Object.keys(stateCounts).length ? Object.entries(stateCounts).map(([state, count]) => (
              <span key={state} style={navBtn}>{state}: {count}</span>
            )) : <p style={sub}>No active deal rooms saved yet.</p>}
          </div>
        </section>

        <section style={grid}>
          {deals.map((deal) => {
            const id = roomId(deal);
            const photo = deal.photoDataUrl || deal.image || deal.photo || "";
            return (
              <article key={id} style={card}>
                {photo ? <img src={photo} alt={deal.title || "Deal photo"} style={{ width: "100%", height: 220, objectFit: "cover", borderRadius: 22, border: "1px solid rgba(207,216,230,.18)", marginBottom: 18 }} /> : null}
                <div style={eyebrow}>{deal.assetClass || "Deal"}</div>
                <h2 style={{ fontSize: 34, lineHeight: 1, margin: "0 0 10px", letterSpacing: -1 }}>{deal.title || "Untitled Deal"}</h2>
                <p style={{ ...sub, fontSize: 18 }}>{[deal.city, deal.county, deal.state].filter(Boolean).join(", ") || "Market not listed"}</p>
                <div style={{ color: "#dfe6f2", fontSize: 22, lineHeight: 1.35, marginTop: 20 }}>
                  <div>Ask: {money(deal.askingPrice)}</div>
                  <div>ARV/Value: {money(deal.arv)}</div>
                  <div>Repairs: {money(deal.repairs)}</div>
                  <div>Route: {(deal.routeTo || []).join(", ") || "Not selected"}</div>
                </div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 22 }}>
                  <Link href={`/deal-rooms/${encodeURIComponent(id)}`} style={primaryBtn}>Open Room</Link>
                  <button type="button" onClick={() => updateState(id, "saved")} style={ghostButton}>Save</button>
                  <button type="button" onClick={() => updateState(id, "archived")} style={ghostButton}>Archive</button>
                  <button type="button" onClick={() => updateState(id, "deleted")} style={dangerBtn}>Delete</button>
                </div>
              </article>
            );
          })}
        </section>
      </div>
    </main>
  );
}
