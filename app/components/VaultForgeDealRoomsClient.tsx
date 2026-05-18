"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type RoomState = "active" | "saved" | "archived" | "deleted";
type DealRoom = Record<string, any> & { id: string; roomState?: RoomState };

type ProfileData = Record<string, any> & {
  profilePhoto?: string;
  companyLogo?: string;
  fullName?: string;
  company?: string;
  email?: string;
  phone?: string;
  preferredContact?: string[];
  memberTypes?: string[];
  buyStates?: string[];
  operateStates?: string[];
  alertStates?: string[];
  countiesByState?: Record<string, string[]>;
  markets?: string[];
  assetTypes?: string[];
  dealTypes?: string[];
  executionCapabilities?: string[];
  capitalRoles?: string[];
  routingRules?: string[];
};

const ROOM_KEYS = ["vaultforge_clean_deal_rooms", "vaultforge_deal_rooms", "vaultforge_rooms_deals", "vf_deal_rooms"];
const DETAIL_PREFIXES = ["vaultforge_clean_deal_room_", "vaultforge_deal_room_", "vf_deal_room_"];
const STATE_KEY = "vaultforge_clean_room_states";
const PROFILE_KEY = "vaultforge_profile_v2";

const card: React.CSSProperties = { background: "linear-gradient(180deg,#080d19,#050816)", border: "1px solid rgba(245,197,66,.28)", borderRadius: 26, padding: 28, marginBottom: 22 };
const eyebrow: React.CSSProperties = { color: "#ffd45a", textTransform: "uppercase", letterSpacing: 8, fontWeight: 900, fontSize: 20, marginBottom: 14 };
const h1: React.CSSProperties = { fontSize: "clamp(42px,7vw,72px)", lineHeight: .92, letterSpacing: -4, margin: "0 0 18px", fontWeight: 950 };
const sub: React.CSSProperties = { color: "#c9d0dc", fontSize: 22, lineHeight: 1.35, margin: 0 };
const btn: React.CSSProperties = { border: "1px solid rgba(207,216,230,.18)", background: "#171c29", color: "#f7f7fb", borderRadius: 999, padding: "13px 18px", fontWeight: 950, textDecoration: "none", display: "inline-block", cursor: "pointer" };
const goldBtn: React.CSSProperties = { ...btn, border: 0, background: "#ffdc68", color: "#10131a" };
const redBtn: React.CSSProperties = { ...btn, background: "#271016", borderColor: "rgba(255,70,70,.48)", color: "#ffaaaa" };

function readArray(key: string): DealRoom[] {
  try {
    const raw = window.localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getStates(): Record<string, RoomState> {
  try { return JSON.parse(window.localStorage.getItem(STATE_KEY) || "{}"); } catch { return {}; }
}

function writeStates(states: Record<string, RoomState>) {
  window.localStorage.setItem(STATE_KEY, JSON.stringify(states));
}

function dealId(deal: DealRoom) {
  return String(deal.id || deal.roomId || deal.dealId || "");
}

function val(deal: DealRoom, keys: string[], fallback = "") {
  for (const key of keys) {
    const raw = deal?.[key];
    if (raw !== undefined && raw !== null && String(raw).trim()) return String(raw);
  }
  return fallback;
}

function arr(deal: DealRoom, keys: string[]) {
  for (const key of keys) {
    const raw = deal?.[key];
    if (Array.isArray(raw)) return raw.map(String).filter(Boolean);
    if (typeof raw === "string" && raw.trim()) return raw.split(",").map((item) => item.trim()).filter(Boolean);
  }
  return [];
}

function photo(deal: DealRoom) {
  return val(deal, ["photoUrl", "imageUrl", "publicUrl", "photo", "photoDataUrl", "image", "url"], "");
}

function money(raw: string) {
  const clean = String(raw || "").replace(/[^0-9.]/g, "");
  if (!clean) return "Not listed";
  const num = Number(clean);
  return Number.isNaN(num) ? raw : `$${num.toLocaleString()}`;
}

function readProfile(): ProfileData | null {
  try {
    const raw = window.localStorage.getItem(PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function normalizeAsset(assetClass: string) {
  const value = String(assetClass || "").toLowerCase();
  if (value.includes("residential")) return "SFR";
  if (value.includes("commercial")) return "Commercial";
  if (value.includes("land")) return "Land";
  return assetClass;
}

function getProfileFit(deal: DealRoom, profile: ProfileData | null) {
  if (!profile) return null;
  const routeTargets = arr(deal, ["routeTo", "routedTo"]);
  const state = val(deal, ["state"], "");
  const county = val(deal, ["county"], "");
  const asset = normalizeAsset(val(deal, ["assetClass", "asset_class"], ""));
  const memberTypes = Array.isArray(profile.memberTypes) ? profile.memberTypes.map(String) : [];
  const profileStates = [profile.buyStates, profile.operateStates, profile.alertStates].flat().filter(Boolean).map(String);
  const countyList = state && profile.countiesByState ? profile.countiesByState[state] || [] : [];
  const assetTypes = Array.isArray(profile.assetTypes) ? profile.assetTypes.map(String) : [];
  const roleFit = routeTargets.some((target) => memberTypes.map((x) => x.toLowerCase()).includes(target.toLowerCase())) || routeTargets.some((target) => target === "Buyer" && memberTypes.includes("Investor"));
  const stateFit = state ? profileStates.includes(state) : false;
  const countyFit = county ? countyList.includes(county) : false;
  const assetFit = asset ? assetTypes.map((x) => x.toLowerCase()).includes(String(asset).toLowerCase()) || (asset === "SFR" && assetTypes.includes("Residential")) : false;
  const score = [roleFit, stateFit, countyFit, assetFit].filter(Boolean).length * 25;
  return {
    score,
    roleFit,
    stateFit,
    countyFit,
    assetFit,
    reason: [roleFit ? "role lane" : "role needs review", stateFit ? "state match" : "state not confirmed", countyFit ? "county match" : "county not selected", assetFit ? "asset fit" : "asset fit not confirmed"].join(" • "),
  };
}

function loadDeals(): DealRoom[] {
  const states = getStates();
  const map = new Map<string, DealRoom>();
  ROOM_KEYS.forEach((key) => {
    readArray(key).forEach((deal) => {
      const id = dealId(deal);
      if (!id) return;
      const existing = map.get(id) || {};
      map.set(id, { ...existing, ...deal, id, roomState: states[id] || deal.roomState || "active" });
    });
  });
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i) || "";
    const prefix = DETAIL_PREFIXES.find((item) => key.startsWith(item));
    if (!prefix) continue;
    try {
      const raw = window.localStorage.getItem(key);
      const deal = raw ? JSON.parse(raw) : null;
      const id = dealId(deal || {}) || key.replace(prefix, "");
      if (!id) continue;
      const existing = map.get(id) || {};
      map.set(id, { ...existing, ...deal, id, roomState: states[id] || deal?.roomState || "active" });
    } catch {}
  }
  return Array.from(map.values())
    .filter((deal) => deal.roomState !== "deleted" && deal.roomState !== "archived")
    .sort((a, b) => String(b.createdAt || b.updatedAt || "").localeCompare(String(a.createdAt || a.updatedAt || "")));
}

function syncDeal(deal: DealRoom) {
  const id = dealId(deal);
  if (!id) return;
  DETAIL_PREFIXES.forEach((prefix) => window.localStorage.setItem(`${prefix}${id}`, JSON.stringify({ ...deal, id })));
  ROOM_KEYS.forEach((key) => {
    const rows = readArray(key).filter((item) => dealId(item) !== id);
    window.localStorage.setItem(key, JSON.stringify([{ ...deal, id }, ...rows]));
  });
}

function DealCard({ deal, profile, onChanged }: { deal: DealRoom; profile: ProfileData | null; onChanged: () => void }) {
  const id = dealId(deal);
  const img = photo(deal);
  const routeTargets = arr(deal, ["routeTo", "routedTo"]);
  const fit = getProfileFit(deal, profile);
  const profileName = profile ? String(profile.company || profile.fullName || "Saved Profile") : "No saved profile";

  function setRoomState(state: RoomState) {
    const states = getStates();
    states[id] = state;
    writeStates(states);
    syncDeal({ ...deal, id, roomState: state, updatedAt: new Date().toISOString() });
    onChanged();
  }

  return (
    <article style={{ ...card, marginBottom: 0, padding: 24 }}>
      {img ? (
        <img src={img} alt={val(deal, ["title", "name"], "Deal photo")} style={{ width: "100%", height: 220, objectFit: "cover", borderRadius: 22, border: "1px solid rgba(207,216,230,.18)", marginBottom: 20 }} />
      ) : (
        <div style={{ height: 170, display: "grid", placeItems: "center", border: "1px dashed rgba(207,216,230,.22)", borderRadius: 22, color: "#c9d0dc", marginBottom: 20 }}>No photo saved</div>
      )}
      <div style={eyebrow}>{val(deal, ["assetClass", "asset_class"], "Deal")}</div>
      <h2 style={{ fontSize: 34, margin: "0 0 10px", letterSpacing: -2 }}>{val(deal, ["title", "name"], "Untitled Deal")}</h2>
      <p style={{ ...sub, fontSize: 18 }}>{[val(deal,["city"]), val(deal,["county"]), val(deal,["state"])].filter(Boolean).join(", ")}</p>
      <p style={{ ...sub, fontSize: 20, marginTop: 20 }}>Ask: {money(val(deal,["askingPrice","ask"]))}<br />ARV/Value: {money(val(deal,["arv","value"]))}<br />Repairs: {money(val(deal,["repairs"]))}<br />Route: {routeTargets.join(", ") || "Not selected"}</p>
      <div style={{ marginTop: 18, border: "1px solid rgba(245,197,66,.22)", background: "rgba(245,197,66,.05)", borderRadius: 18, padding: 16 }}>
        <div style={{ ...eyebrow, fontSize: 14, letterSpacing: 4 }}>AI Routed Profile</div>
        {profile ? <p style={{ ...sub, fontSize: 16 }}>{profileName}<br />Fit: {fit?.score || 0}% — {fit?.reason || "needs profile data"}</p> : <p style={{ ...sub, fontSize: 16 }}>No profile saved yet. Save Profile first so AI can route.</p>}
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
        <Link href={`/deal-rooms/${encodeURIComponent(id)}`} style={goldBtn}>Open Room</Link>
        <button type="button" onClick={() => setRoomState("saved")} style={btn}>Save</button>
        <button type="button" onClick={() => setRoomState("archived")} style={btn}>Archive</button>
        <button type="button" onClick={() => setRoomState("deleted")} style={redBtn}>Delete</button>
      </div>
    </article>
  );
}

export default function VaultForgeDealRoomsClient() {
  const [rooms, setRooms] = useState<DealRoom[]>([]);
  const [profile, setProfile] = useState<ProfileData | null>(null);

  function refresh() {
    setRooms(loadDeals());
    setProfile(readProfile());
  }

  useEffect(() => {
    refresh();
    window.addEventListener("vaultforge-deals-change", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("vaultforge-deals-change", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const stateCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    rooms.forEach((room) => {
      const state = val(room, ["state"], "Unknown") || "Unknown";
      counts[state] = (counts[state] || 0) + 1;
    });
    return counts;
  }, [rooms]);

  return (
    <>
      <section style={card}>
        <div style={eyebrow}>Deal Rooms</div>
        <h1 style={h1}>Clean deal room board.</h1>
        <p style={sub}>Photos, routing targets, AI matched profile cards, state count, and room controls stay synced from the intake.</p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 22 }}>
          <button type="button" style={btn} onClick={refresh}>Refresh Rooms</button>
          <Link href="/deal-create" style={goldBtn}>Create Deal</Link>
        </div>
      </section>

      <section style={card}>
        <div style={eyebrow}>State Count</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          {Object.keys(stateCounts).length ? Object.entries(stateCounts).map(([state, count]) => <span key={state} style={btn}>{state}: {count}</span>) : <p style={sub}>No active deal rooms yet.</p>}
        </div>
      </section>

      {!rooms.length ? <section style={card}><p style={sub}>No saved Deal Rooms yet. Create a deal and it will appear here.</p></section> : null}

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(310px, 1fr))", gap: 22 }}>
        {rooms.map((deal) => <DealCard key={dealId(deal)} deal={deal} profile={profile} onChanged={refresh} />)}
      </section>
    </>
  );
}
