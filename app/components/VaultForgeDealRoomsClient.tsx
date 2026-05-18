"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";

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
  routeTo?: string[] | string;
  urgency?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  photoDataUrl?: string;
  imageDataUrl?: string;
  photoUrl?: string;
  imageUrl?: string;
  photos?: string[];
  createdAt?: string;
  updatedAt?: string;
  roomState?: RoomState;
  alertedMembers?: unknown[];
  [key: string]: unknown;
};

const DEAL_LIST_KEYS = [
  "vaultforge_clean_deal_rooms",
  "vaultforge_deal_rooms",
  "vaultforge_deals",
  "vf_deal_rooms",
  "deal_rooms",
];

const ROOM_STATE_KEY = "vaultforge_room_states";

const shell: React.CSSProperties = {
  minHeight: "100vh",
  background: "#05070d",
  color: "#f7f7fb",
  padding: "22px",
  fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
};

const wrap: React.CSSProperties = { maxWidth: 1180, margin: "0 auto", paddingBottom: 80 };
const card: React.CSSProperties = {
  background: "linear-gradient(180deg,#080d19,#050816)",
  border: "1px solid rgba(245,197,66,.28)",
  borderRadius: 26,
  padding: 28,
  marginBottom: 22,
  boxShadow: "0 18px 60px rgba(0,0,0,.32)",
};
const eyebrow: React.CSSProperties = { color: "#ffd45a", textTransform: "uppercase", letterSpacing: 8, fontWeight: 950, fontSize: 18, marginBottom: 14 };
const h1: React.CSSProperties = { fontSize: "clamp(42px,7vw,78px)", lineHeight: .92, letterSpacing: -4, margin: "0 0 18px", fontWeight: 950 };
const h2: React.CSSProperties = { fontSize: "clamp(30px,5vw,52px)", lineHeight: 1, letterSpacing: -2, margin: "0 0 14px", fontWeight: 950 };
const sub: React.CSSProperties = { color: "#c9d0dc", fontSize: "clamp(18px,2.6vw,25px)", lineHeight: 1.35, margin: 0 };
const navButton: React.CSSProperties = { display: "inline-flex", alignItems: "center", justifyContent: "center", textDecoration: "none", borderRadius: 999, padding: "13px 18px", fontWeight: 950, background: "#171c29", color: "#f7f7fb", border: "1px solid rgba(207,216,230,.18)" };
const goldButton: React.CSSProperties = { ...navButton, background: "#ffdc68", color: "#111319", borderColor: "#ffdc68" };
const redButton: React.CSSProperties = { ...navButton, background: "#261016", color: "#ffaaaa", borderColor: "rgba(255,75,75,.45)" };
const chip: React.CSSProperties = { border: "1px solid rgba(207,216,230,.18)", background: "#171c29", color: "#f9fbff", borderRadius: 999, padding: "10px 14px", fontWeight: 900, display: "inline-flex", margin: "4px 6px 4px 0" };

function safeJson(value: string | null) {
  if (!value) return null;
  try { return JSON.parse(value); } catch { return null; }
}

function getString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function roomId(deal: DealRoom, fallback: number) {
  return getString(deal.id) || `deal_${fallback}`;
}

function money(value: unknown) {
  const raw = getString(value);
  if (!raw) return "Not listed";
  const cleaned = raw.replace(/[^0-9.]/g, "");
  if (!cleaned) return raw;
  const num = Number(cleaned);
  return Number.isFinite(num) ? `$${num.toLocaleString()}` : raw;
}

function routeText(value: unknown) {
  if (Array.isArray(value)) return value.filter(Boolean).join(", ");
  return getString(value) || "Not selected";
}

function photoFor(deal: DealRoom) {
  const photos = Array.isArray(deal.photos) ? deal.photos : [];
  return getString(deal.photoDataUrl) || getString(deal.imageDataUrl) || getString(deal.photoUrl) || getString(deal.imageUrl) || getString(photos[0]);
}

function readRoomStates(): Record<string, RoomState> {
  const parsed = safeJson(window.localStorage.getItem(ROOM_STATE_KEY));
  return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, RoomState> : {};
}

function writeRoomState(id: string, state: RoomState) {
  const states = readRoomStates();
  states[id] = state;
  window.localStorage.setItem(ROOM_STATE_KEY, JSON.stringify(states));
}

function readAlertedCount(id: string, deal: DealRoom) {
  const local = safeJson(window.localStorage.getItem(`vaultforge_deal_alerted_members_${id}`));
  if (Array.isArray(local)) return local.length;
  return Array.isArray(deal.alertedMembers) ? deal.alertedMembers.length : 0;
}

function normalizeDeal(raw: unknown, fallback: number, states: Record<string, RoomState>): DealRoom | null {
  if (!raw || typeof raw !== "object") return null;
  const source = raw as DealRoom;
  const id = roomId(source, fallback);
  return { ...source, id, roomState: states[id] || source.roomState || "active" };
}

function readAllDeals(): DealRoom[] {
  const states = readRoomStates();
  const seen = new Map<string, DealRoom>();

  DEAL_LIST_KEYS.forEach((key) => {
    const parsed = safeJson(window.localStorage.getItem(key));
    if (Array.isArray(parsed)) {
      parsed.forEach((item, index) => {
        const deal = normalizeDeal(item, index, states);
        if (deal?.id) seen.set(deal.id, deal);
      });
    }
  });

  for (let i = 0; i < window.localStorage.length; i += 1) {
    const key = window.localStorage.key(i) || "";
    if (!key.includes("deal_room") && !key.includes("deal_rooms")) continue;
    const parsed = safeJson(window.localStorage.getItem(key));
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      const deal = normalizeDeal(parsed, i + 1000, states);
      if (deal?.id) seen.set(deal.id, deal);
    }
  }

  const deals = Array.from(seen.values()).filter((deal) => deal.roomState !== "archived" && deal.roomState !== "deleted");
  return deals.sort((a, b) => String(b.createdAt || b.updatedAt || "").localeCompare(String(a.createdAt || a.updatedAt || "")));
}

function resyncDealKeys(deals: DealRoom[]) {
  const active = deals.filter((deal) => deal.roomState !== "archived" && deal.roomState !== "deleted");
  DEAL_LIST_KEYS.forEach((key) => window.localStorage.setItem(key, JSON.stringify(active)));
  deals.forEach((deal) => {
    if (!deal.id) return;
    window.localStorage.setItem(`vaultforge_clean_deal_room_${deal.id}`, JSON.stringify(deal));
    window.localStorage.setItem(`vaultforge_deal_room_${deal.id}`, JSON.stringify(deal));
  });
}

export default function VaultForgeDealRoomsClient() {
  const [deals, setDeals] = useState<DealRoom[]>([]);
  const [loaded, setLoaded] = useState(false);

  function refresh() {
    const next = readAllDeals();
    resyncDealKeys(next);
    setDeals(next);
    setLoaded(true);
  }

  useEffect(() => { refresh(); }, []);

  const stateCounts = useMemo(() => {
    return deals.reduce<Record<string, number>>((acc, deal) => {
      const state = getString(deal.state) || "NA";
      acc[state] = (acc[state] || 0) + 1;
      return acc;
    }, {});
  }, [deals]);

  function setStateForDeal(deal: DealRoom, state: RoomState) {
    const id = getString(deal.id);
    if (!id) return;
    writeRoomState(id, state);
    refresh();
  }

  return (
    <main style={shell}>
      <div style={wrap}>
        <nav style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 18 }}>
          <Link href="/command" style={navButton}>Command</Link>
          <Link href="/deal-create" style={goldButton}>Create Deal</Link>
          <Link href="/pain-intake" style={navButton}>Pain Intake</Link>
          <Link href="/profile" style={navButton}>Profile</Link>
          <Link href="/" style={redButton}>Exit</Link>
        </nav>

        <section style={card}>
          <div style={eyebrow}>Deal Rooms</div>
          <h1 style={h1}>Clean deal room board.</h1>
          <p style={sub}>Photos, routing targets, alert counts, and room controls stay synced from the intake.</p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 22 }}>
            <button type="button" onClick={refresh} style={navButton}>Refresh Rooms</button>
            <Link href="/deal-create" style={goldButton}>Create Deal</Link>
          </div>
        </section>

        <section style={card}>
          <div style={eyebrow}>State Count</div>
          {Object.keys(stateCounts).length ? Object.entries(stateCounts).map(([state, count]) => <span key={state} style={chip}>{state}: {count}</span>) : <p style={sub}>No active deal rooms yet.</p>}
        </section>

        {!loaded ? <section style={card}><p style={sub}>Loading deal rooms...</p></section> : null}

        {loaded && !deals.length ? (
          <section style={card}>
            <h2 style={h2}>No active deal rooms.</h2>
            <p style={sub}>Create a deal, save it, then return here.</p>
          </section>
        ) : null}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 18 }}>
          {deals.map((deal, index) => {
            const id = roomId(deal, index);
            const photo = photoFor(deal);
            const alertedCount = readAlertedCount(id, deal);
            return (
              <article key={id} style={card}>
                {photo ? <img src={photo} alt={getString(deal.title) || "Deal photo"} style={{ width: "100%", height: 220, objectFit: "cover", borderRadius: 20, border: "1px solid rgba(207,216,230,.2)", marginBottom: 18 }} /> : (
                  <div style={{ height: 140, borderRadius: 20, border: "1px dashed rgba(207,216,230,.28)", display: "flex", alignItems: "center", justifyContent: "center", color: "#c9d0dc", marginBottom: 18 }}>No photo saved</div>
                )}
                <div style={eyebrow}>{getString(deal.assetClass) || "Deal"}</div>
                <h2 style={{ ...h2, fontSize: 34 }}>{getString(deal.title) || "Untitled Deal"}</h2>
                <p style={{ ...sub, fontSize: 18 }}>{[deal.city, deal.county, deal.state].map(getString).filter(Boolean).join(", ") || "Location not listed"}</p>
                <div style={{ marginTop: 16, color: "#dfe6f1", fontSize: 18, lineHeight: 1.5 }}>
                  <div>Ask: {money(deal.askingPrice)}</div>
                  <div>ARV/Value: {money(deal.arv)}</div>
                  <div>Repairs: {money(deal.repairs)}</div>
                  <div>Route: {routeText(deal.routeTo)}</div>
                  <div>Alerted members: {alertedCount}</div>
                </div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
                  <Link href={`/deal-rooms/${encodeURIComponent(id)}`} style={goldButton}>Open Room</Link>
                  <button type="button" onClick={() => setStateForDeal(deal, "saved")} style={navButton}>Save</button>
                  <button type="button" onClick={() => setStateForDeal(deal, "archived")} style={navButton}>Archive</button>
                  <button type="button" onClick={() => setStateForDeal(deal, "deleted")} style={redButton}>Delete</button>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </main>
  );
}
