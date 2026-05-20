"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { RoomInsideIntelligence } from "../../components/VaultForgeRoomIntelligence";

type RoomState = "active" | "saved" | "archived" | "deleted";
type RoomKind = "deal" | "pain";

type Room = {
  id?: string;
  roomId?: string;
  title?: string;
  name?: string;
  state?: string;
  city?: string;
  county?: string;
  address?: string;
  assetClass?: string;
  propertyType?: string;
  strategy?: string[] | string;
  routeTo?: string[] | string;
  painTypes?: string[] | string;
  needs?: string[] | string;
  routingNeeds?: string[] | string;
  blockers?: string[] | string;
  risks?: string[] | string;
  riskTypes?: string[] | string;
  severity?: string;
  timePressure?: string;
  capitalPressure?: string;
  controlStatus?: string;
  currentStatus?: string;
  ownerSituation?: string;
  accessStatus?: string;
  titleStatus?: string;
  permitStatus?: string;
  insuranceStatus?: string;
  legalStatus?: string;
  askingPrice?: string;
  askPrice?: string;
  propertyValue?: string;
  value?: string;
  repairs?: string;
  monthlyBurn?: string;
  monthlyBurnRate?: string;
  moneyNeededNow?: string;
  deadline?: string;
  rootCause?: string;
  bestOutcome?: string;
  worstCase?: string;
  desiredSolution?: string;
  condition?: string;
  occupancy?: string;
  beds?: string;
  baths?: string;
  sqft?: string;
  units?: string;
  noi?: string;
  capRate?: string;
  acres?: string;
  zoning?: string;
  roadFrontage?: string;
  utilities?: string;
  entitlementStatus?: string;
  contactName?: string;
  contactPhone?: string;
  phone?: string;
  contactEmail?: string;
  email?: string;
  bestContact?: string;
  notes?: string;
  analyzer?: string;
  photos?: string[];
  photoUrls?: string[];
  coverPhoto?: string;
  photoUrl?: string;
  imageUrl?: string;
  roomState?: RoomState;
  cleanupState?: RoomState;
  stateStatus?: RoomState;
  alertRead?: boolean;
  viewedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
};

type MemberProfile = {
  id?: string;
  name?: string;
  company?: string;
  email?: string;
  memberType?: string;
  basedState?: string;
  statesOperated?: string[];
  assetClasses?: string[];
  strategies?: string[];
  specialties?: string[];
  needs?: string[];
  canProvide?: string[];
  capitalPosition?: string;
  fundingRange?: string;
  [key: string]: unknown;
};

const DEAL_KEYS = ["vaultforge_clean_deal_rooms", "vaultforge_deal_rooms", "vaultforge_rooms_deals", "vf_deal_rooms"];
const PAIN_KEYS = ["vaultforge_clean_pain_rooms_v2", "vaultforge_clean_pain_rooms_v1", "vaultforge_clean_pain_rooms", "vaultforge_pain_rooms", "vaultforge_rooms_pain", "vf_pain_rooms"];
const STATE_KEYS = ["vaultforge_deal_room_state_v2", "vaultforge_pain_room_state_v2", "vaultforge_clean_room_states", "vaultforge_room_states", "vaultforge_deal_room_states", "vaultforge_pain_room_states"];
const PROFILE_KEYS = ["vaultforge_profile", "vaultforge_member_profile", "vaultforge_clean_profile"];
const MEMBER_DIRECTORY_KEY = "vaultforge_member_directory_v1";
const ACTIVITY_KEY = "vaultforge_room_activity_v1";
const WATCH_KEY = "vaultforge_room_watchlist_v1";
const ROOM_ACTIVITY_KEY = "vaultforge_room_activity_v2";
const ROUTE_STATUS_KEY = "vaultforge_route_status_v1";

function ok() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function j<T>(raw: string | null, fallback: T): T {
  try {
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function txt(value: unknown, fallback = "") {
  const clean = String(value || "").trim();
  return clean || fallback;
}

function list(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((x) => String(x).trim()).filter(Boolean);
  if (typeof value === "string" && value.trim()) return value.split(",").map((x) => x.trim()).filter(Boolean);
  return [];
}

function moneyNum(value: unknown) {
  const n = Number(String(value || "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function rid(room: Room | null | undefined) {
  return txt(room?.id || room?.roomId);
}

function titleFor(room: Room, kind: RoomKind) {
  return txt(room.title || room.name, kind === "deal" ? "Untitled Deal Room" : "Untitled Pain Room");
}

function loc(room: Room) {
  return [txt(room.city), txt(room.county), txt(room.state)].filter(Boolean).join(", ") || "Market not listed";
}

function roomState(room: Room): RoomState {
  const state = txt(room.roomState || room.cleanupState || room.stateStatus, "active");
  return state === "saved" || state === "archived" || state === "deleted" ? state : "active";
}

function arr<T>(key: string): T[] {
  if (!ok()) return [];
  const parsed = j<unknown>(localStorage.getItem(key), []);
  return Array.isArray(parsed) ? (parsed as T[]) : [];
}

function keysFor(kind: RoomKind) {
  return kind === "deal" ? DEAL_KEYS : PAIN_KEYS;
}

function normalizeRoom(row: any, kind: RoomKind): Room {
  const id = txt(row?.id || row?.roomId || row?.dealId || row?.painId || row?.signalId);
  const photos = list(row?.photos || row?.photoUrls);
  const cover = txt(row?.coverPhoto || row?.photoUrl || row?.imageUrl || photos[0]);
  return {
    ...row,
    id,
    roomId: id,
    title: txt(row?.title || row?.name || row?.dealTitle || row?.painTitle || row?.problemTitle, kind === "deal" ? "Untitled Deal Room" : "Untitled Pain Room"),
    state: txt(row?.state, "GA"),
    city: txt(row?.city),
    county: txt(row?.county),
    photos,
    photoUrls: photos,
    coverPhoto: cover,
    photoUrl: cover,
    imageUrl: cover,
  };
}

function stateMap() {
  const map: Record<string, RoomState> = {};
  if (!ok()) return map;
  STATE_KEYS.forEach((key) => Object.assign(map, j<Record<string, RoomState>>(localStorage.getItem(key), {})));
  return map;
}

function allRooms(kind: RoomKind): Room[] {
  if (!ok()) return [];
  const out: Room[] = [];
  const seen = new Set<string>();

  for (const key of keysFor(kind)) {
    for (const row of arr<any>(key)) {
      const room = normalizeRoom(row, kind);
      const id = rid(room);
      if (!id || seen.has(id)) continue;
      seen.add(id);
      out.push(room);
    }
  }

  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i) || "";
    const match = kind === "deal" ? key.includes("deal_room") || key.includes("deal_rooms") : key.includes("pain_room") || key.includes("pain_rooms");
    if (!match) continue;
    const value = j<any>(localStorage.getItem(key), null);
    if (Array.isArray(value)) {
      for (const row of value) {
        const room = normalizeRoom(row, kind);
        const id = rid(room);
        if (!id || seen.has(id)) continue;
        seen.add(id);
        out.push(room);
      }
    } else if (value && typeof value === "object") {
      const room = normalizeRoom(value, kind);
      const id = rid(room);
      if (id && !seen.has(id)) {
        seen.add(id);
        out.push(room);
      }
    }
  }

  const states = stateMap();
  return out.map((room) => {
    const id = rid(room);
    const state = states[id] || states[`${kind}:${id}`] || roomState(room);
    return { ...room, roomState: state, cleanupState: state, stateStatus: state };
  });
}

function getRoom(kind: RoomKind, id: string) {
  if (!ok()) return null as Room | null;
  const directKeys = kind === "deal"
    ? [`vaultforge_deal_room_${id}`, `vaultforge_clean_deal_room_${id}`, `vf_deal_room_${id}`]
    : [`vaultforge_pain_room_${id}`, `vaultforge_clean_pain_room_${id}`, `vf_pain_room_${id}`];

  for (const key of directKeys) {
    const found = j<any | null>(localStorage.getItem(key), null);
    if (found) return normalizeRoom(found, kind);
  }

  return allRooms(kind).find((room) => rid(room) === id) || null;
}

function writeJson(key: string, value: unknown) {
  if (!ok()) return false;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function saveRoom(kind: RoomKind, room: Room) {
  if (!ok()) return;
  const id = rid(room);
  if (!id) return;
  const next = { ...room, id, roomId: id, updatedAt: new Date().toISOString() };
  const directKey = kind === "deal" ? `vaultforge_deal_room_${id}` : `vaultforge_pain_room_${id}`;
  writeJson(directKey, next);
  for (const key of keysFor(kind)) {
    const rows = allRooms(kind).filter((item) => rid(item) !== id);
    writeJson(key, [next, ...rows]);
  }
  window.dispatchEvent(new Event("vaultforge-room-state-change"));
}

function setRoomState(kind: RoomKind, room: Room, state: RoomState) {
  const next = { ...room, roomState: state, cleanupState: state, stateStatus: state, updatedAt: new Date().toISOString() };
  const id = rid(next);
  const states = stateMap();
  states[id] = state;
  states[`${kind}:${id}`] = state;
  for (const key of STATE_KEYS) writeJson(key, states);
  saveRoom(kind, next);
  addActivity(kind, id, `${state.toUpperCase()} room`);
  addPersistentActivity(kind, id, "Status Change", `Room moved to ${state}.`);
}

function firstPhoto(room: Room) {
  const possible = [txt(room.coverPhoto), txt(room.photoUrl), txt(room.imageUrl), ...list(room.photos), ...list(room.photoUrls)].filter(Boolean);
  return possible.find((src) => src.startsWith("data:image") || src.startsWith("http") || src.startsWith("/") || src.startsWith("blob:")) || "";
}

function profileId(profile: MemberProfile) {
  return txt(profile.id) || txt(profile.email).toLowerCase() || "local_member";
}

function normalizeProfile(profile: MemberProfile): MemberProfile {
  return {
    ...profile,
    id: profileId(profile),
    name: txt(profile.name, "VaultForge Member"),
    memberType: txt(profile.memberType, "Investor"),
    basedState: txt(profile.basedState, "GA"),
    statesOperated: list(profile.statesOperated).length ? list(profile.statesOperated) : ["GA"],
    assetClasses: list(profile.assetClasses),
    strategies: list(profile.strategies),
    specialties: list(profile.specialties),
    needs: list(profile.needs),
    canProvide: list(profile.canProvide),
  };
}

function getProfile(): MemberProfile {
  if (!ok()) return {};
  for (const key of PROFILE_KEYS) {
    const found = j<MemberProfile | null>(localStorage.getItem(key), null);
    if (found && typeof found === "object") return normalizeProfile(found);
  }
  return normalizeProfile({ id: "local_member", name: "VaultForge Member", basedState: "GA", statesOperated: ["GA"], memberType: "Investor" });
}

function getDirectory(): MemberProfile[] {
  if (!ok()) return [];
  const directory = j<MemberProfile[]>(localStorage.getItem(MEMBER_DIRECTORY_KEY), []);
  const current = getProfile();
  const currentId = profileId(current);
  const merged = [current, ...directory.filter((member) => profileId(member) !== currentId)];
  const seen = new Set<string>();
  return merged.map(normalizeProfile).filter((member) => {
    const id = profileId(member);
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

function overlap(a: unknown, b: unknown) {
  const aa = list(a).map((x) => x.toLowerCase());
  const bb = list(b).map((x) => x.toLowerCase());
  return aa.filter((x) => bb.includes(x)).length;
}

function scoreMemberForRoom(member: MemberProfile, room: Room, kind: RoomKind) {
  let score = 0;
  const reasons: string[] = [];

  if (list(member.statesOperated).includes(txt(room.state))) {
    score += 30;
    reasons.push("state");
  }

  if (overlap(member.assetClasses, [txt(room.assetClass)])) {
    score += 18;
    reasons.push("asset");
  }

  if (kind === "deal") {
    if (overlap(member.strategies, room.strategy)) {
      score += 22;
      reasons.push("strategy");
    }
    if (overlap(member.canProvide, room.routeTo)) {
      score += 25;
      reasons.push("route");
    }
    if (txt(member.memberType).toLowerCase().includes("lender") && list(room.routeTo).join(" ").toLowerCase().includes("lender")) {
      score += 20;
      reasons.push("lender");
    }
  } else {
    if (overlap(member.canProvide, room.needs || room.routingNeeds)) {
      score += 32;
      reasons.push("solver");
    }
    if (overlap(member.specialties, room.painTypes)) {
      score += 25;
      reasons.push("specialty");
    }
    if (txt(member.memberType).toLowerCase().includes("attorney") && list(room.needs || room.routingNeeds).join(" ").toLowerCase().includes("attorney")) {
      score += 20;
      reasons.push("legal");
    }
  }

  return { member, score: Math.max(0, Math.min(100, score)), reasons };
}

function bestMatches(room: Room, kind: RoomKind) {
  return getDirectory()
    .map((member) => scoreMemberForRoom(member, room, kind))
    .filter((match) => match.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);
}

function dealIntel(room: Room) {
  const ask = moneyNum(room.askingPrice || room.askPrice);
  const value = moneyNum(room.propertyValue || room.value);
  const repairs = moneyNum(room.repairs);
  const spread = value && ask ? value - ask - repairs : 0;
  const equity = value && ask ? Math.round(((value - ask) / value) * 100) : 0;
  let score = 42;
  if (spread > 25000) score += 12;
  if (spread > 75000) score += 18;
  if (spread > 150000) score += 14;
  if (txt(room.controlStatus).includes("Controlled")) score += 10;
  if (list(room.routeTo).length) score += 8;
  if (txt(room.condition).includes("Full") || txt(room.condition).includes("Fire")) score -= 10;
  score = Math.max(0, Math.min(100, score));
  const urgency = txt(room.timeline).includes("24") || txt(room.timeline).includes("72") ? 90 : txt(room.timeline).includes("7") ? 76 : 45;
  const risk = txt(room.condition).includes("Full") || txt(room.condition).includes("Fire") ? 78 : txt(room.occupancy).includes("Squatter") ? 82 : 42;
  const confidence = Math.max(20, Math.min(100, score - (risk > 70 ? 10 : 0) + (ask && value ? 12 : 0)));
  return {
    score,
    spread,
    equity,
    urgency,
    risk,
    confidence,
    signal: score >= 75 ? "Strong opportunity" : score >= 55 ? "Workable, verify facts" : "Needs more proof",
    next: "Verify control, title, access, photos, and numbers. Then route to the highest-fit buyer/capital/operator profile.",
    exit: list(room.strategy).length ? list(room.strategy).join(", ") : "Wholesale, flip, hold, or JV depending on margin and control.",
  };
}

function painIntel(room: Room) {
  let severity = 40;
  if (txt(room.severity) === "Medium") severity += 10;
  if (txt(room.severity) === "High") severity += 25;
  if (txt(room.severity) === "Critical") severity += 38;
  if (txt(room.severity) === "Emergency") severity += 48;
  if (txt(room.timePressure).includes("24") || txt(room.timePressure).includes("72")) severity += 18;
  if (list(room.blockers).includes("Capital")) severity += 10;
  if (list(room.blockers).includes("Title") || list(room.risks || room.riskTypes).includes("Legal")) severity += 10;
  severity = Math.max(0, Math.min(100, severity));
  const capital = txt(room.capitalPressure) !== "Unknown" || list(room.painTypes).includes("Funding Gap") ? 80 : 36;
  const collapse = Math.max(15, Math.min(100, severity + (txt(room.timePressure).includes("24") ? 12 : 0) + (list(room.risks || room.riskTypes).length * 4)));
  const blocker = Math.max(10, Math.min(100, list(room.blockers).length * 13 + list(room.risks || room.riskTypes).length * 8));
  return {
    severity,
    capital,
    collapse,
    blocker,
    signal: severity >= 85 ? "Immediate pressure signal" : severity >= 70 ? "High-priority execution problem" : severity >= 50 ? "Active problem needing routing" : "Monitor until facts improve",
    next: txt(room.controlStatus) === "No Control Yet" ? "Secure authority/control first, then route to solver network." : list(room.blockers).includes("Capital") ? "Confirm money needed now, collateral, payoff, and deadline, then route to private capital/lender." : list(room.blockers).includes("Title") ? "Collect title facts and route to legal/title specialist before spending more capital." : "Identify the single blocker stopping execution and route to the highest-fit solver.",
    consequence: txt(room.worstCase, "Delay, cost increase, failed closing, loss of control, or legal/financial escalation."),
  };
}


function addPersistentActivity(kind: RoomKind, id: string, action: string, note: string) {
  if (!ok()) return;
  const key = `${kind}:${id}`;
  const all = j<Record<string, { at: string; action: string; note: string }[]>>(localStorage.getItem(ROOM_ACTIVITY_KEY), {});
  all[key] = [{ at: new Date().toISOString(), action, note }, ...(all[key] || [])].slice(0, 75);
  writeJson(ROOM_ACTIVITY_KEY, all);
  window.dispatchEvent(new Event("vaultforge-room-activity-change"));
}

function persistentActivity(kind: RoomKind, id: string) {
  if (!ok()) return [] as { at: string; action: string; note: string }[];
  const all = j<Record<string, { at: string; action: string; note: string }[]>>(localStorage.getItem(ROOM_ACTIVITY_KEY), {});
  return all[`${kind}:${id}`] || [];
}


function activityList(kind: RoomKind, id: string) {
  if (!ok()) return [] as { at: string; text: string }[];
  const map = j<Record<string, { at: string; text: string }[]>>(localStorage.getItem(ACTIVITY_KEY), {});
  const key = `${kind}:${id}`;
  const base = map[key] || [];
  if (base.length) return base;
  return [{ at: new Date().toISOString(), text: "Room created / opened" }];
}

function addActivity(kind: RoomKind, id: string, text: string) {
  if (!ok()) return;
  const map = j<Record<string, { at: string; text: string }[]>>(localStorage.getItem(ACTIVITY_KEY), {});
  const key = `${kind}:${id}`;
  map[key] = [{ at: new Date().toISOString(), text }, ...(map[key] || [])].slice(0, 30);
  writeJson(ACTIVITY_KEY, map);
}


function watchingCount(kind: RoomKind, id: string) {
  if (!ok()) return 0;
  const key = `${kind}:${id}`;
  const current = j<string[]>(localStorage.getItem(WATCH_KEY), []);
  const room = getRoom(kind, id);
  let count = current.includes(key) ? 1 : 0;
  if (room) {
    count += list(room.watchers).length + list(room.watcherIds).length + list(room.watcherEmails).length;
  }
  return count;
}

function isWatched(kind: RoomKind, id: string) {
  if (!ok()) return false;
  return j<string[]>(localStorage.getItem(WATCH_KEY), []).includes(`${kind}:${id}`);
}

function toggleWatch(kind: RoomKind, id: string) {
  if (!ok()) return false;
  const key = `${kind}:${id}`;
  const listIds = j<string[]>(localStorage.getItem(WATCH_KEY), []);
  const next = listIds.includes(key) ? listIds.filter((item) => item !== key) : [key, ...listIds];
  writeJson(WATCH_KEY, next);
  const actionText = listIds.includes(key) ? "Unwatch" : "Watch";
  addActivity(kind, id, listIds.includes(key) ? "Removed from watchlist" : "Added to watchlist");
  addPersistentActivity(kind, id, actionText, listIds.includes(key) ? "Stopped following this room." : "Started following this room.");
  window.dispatchEvent(new Event("vaultforge-room-watch-change"));
  window.dispatchEvent(new Event("vaultforge-alert-change"));
  return !listIds.includes(key);
}

const page: React.CSSProperties = { minHeight: "100vh", background: "#05070d", color: "#f7f7fb", padding: 18, fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" };
const wrap: React.CSSProperties = { maxWidth: 1280, margin: "0 auto", paddingBottom: 90 };
const nav: React.CSSProperties = { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 18 };
const brand: React.CSSProperties = { color: "#ffd45a", fontSize: 27, fontWeight: 950, letterSpacing: -1, marginRight: 10 };
const btn: React.CSSProperties = { border: "1px solid rgba(207,216,230,.18)", background: "#171c29", color: "#f7f7fb", borderRadius: 999, padding: "13px 18px", fontWeight: 950, textDecoration: "none", display: "inline-block", cursor: "pointer" };
const goldBtn: React.CSSProperties = { ...btn, border: 0, background: "#ffdc68", color: "#10131a" };
const redBtn: React.CSSProperties = { ...btn, background: "#271016", borderColor: "rgba(255,70,70,.48)", color: "#ffaaaa" };
const hero: React.CSSProperties = { border: "1px solid rgba(245,197,66,.28)", borderRadius: 28, padding: 30, marginBottom: 20, background: "radial-gradient(circle at top right, rgba(245,197,66,.16), transparent 32%), linear-gradient(180deg,#080d19,#050816)" };
const dangerHero: React.CSSProperties = { ...hero, borderColor: "rgba(255,70,70,.62)", background: "radial-gradient(circle at top right, rgba(255,30,60,.22), transparent 35%), linear-gradient(180deg,#170812,#050816)" };
const card: React.CSSProperties = { background: "linear-gradient(180deg,#080d19,#050816)", border: "1px solid rgba(245,197,66,.28)", borderRadius: 26, padding: 26, marginBottom: 22 };
const panel: React.CSSProperties = { background: "#121724", border: "1px solid rgba(207,216,230,.16)", borderRadius: 22, padding: 22 };
const activePanel: React.CSSProperties = { ...panel, borderColor: "rgba(245,197,66,.75)", boxShadow: "0 0 26px rgba(245,197,66,.18)" };
const eyebrow: React.CSSProperties = { color: "#ffd45a", textTransform: "uppercase", letterSpacing: 7, fontWeight: 950, fontSize: 15, marginBottom: 12 };
const h1: React.CSSProperties = { fontSize: "clamp(44px,8vw,86px)", lineHeight: 0.9, letterSpacing: -4, margin: "0 0 18px", fontWeight: 950 };
const h2: React.CSSProperties = { fontSize: "clamp(30px,5vw,52px)", lineHeight: 0.95, letterSpacing: -2, margin: "0 0 14px", fontWeight: 950 };
const sub: React.CSSProperties = { color: "#c9d0dc", fontSize: 21, lineHeight: 1.35, margin: 0 };
const muted: React.CSSProperties = { color: "#aeb7c7", margin: "8px 0 0", lineHeight: 1.35 };
const grid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(245px,1fr))", gap: 16 };
const row: React.CSSProperties = { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" };
const photoStyle: React.CSSProperties = { width: "100%", maxHeight: 330, objectFit: "cover", borderRadius: 18, border: "1px solid rgba(245,197,66,.25)", marginBottom: 12 };

function Nav({ active }: { active: RoomKind }) {
  return (
    <nav style={nav}>
      <div style={brand}>VAULTFORGE</div>
      <Link href="/command" style={btn}>Command</Link>
      <Link href="/my-rooms" style={btn}>My Rooms</Link>
      <Link href="/routing" style={btn}>Routing</Link>
      <Link href="/network" style={btn}>Network</Link>
      <Link href="/deal-rooms" style={active === "deal" ? goldBtn : btn}>Deal Rooms</Link>
      <Link href="/pain-rooms" style={active === "pain" ? goldBtn : btn}>Pain Rooms</Link>
      <Link href="/messages" style={btn}>Messages</Link>
      <Link href="/profile" style={btn}>Profile</Link>
      <Link href="/logout" style={redBtn}>Logout</Link>
    </nav>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section style={card}><div style={eyebrow}>{title}</div>{children}</section>;
}

function Meter({ title, value }: { title: string; value: number }) {
  return (
    <div style={panel}>
      <div style={eyebrow}>{title}</div>
      <h2 style={h2}>{value}%</h2>
      <div style={{ height: 10, background: "#070a12", borderRadius: 999, overflow: "hidden" }}>
        <div style={{ width: `${Math.max(0, Math.min(100, value))}%`, height: "100%", background: "#ffdc68" }} />
      </div>
    </div>
  );
}

function Value({ title, value }: { title: string; value: unknown }) {
  return <div style={panel}><div style={eyebrow}>{title}</div><p style={sub}>{txt(value, "Not listed")}</p></div>;
}

function MatchCard({ match }: { match: { member: MemberProfile; score: number; reasons: string[] } }) {
  return (
    <div style={activePanel}>
      <div style={eyebrow}>Best Fit</div>
      <h2 style={h2}>{txt(match.member.name, "Member")}</h2>
      <p style={sub}>{match.score}% match</p>
      <p style={muted}>{txt(match.member.memberType, "Member")} • {match.reasons.join(", ") || "profile fit"}</p>
      <div style={{ ...row, marginTop: 14 }}>
        <Link href={`/messages?to=${encodeURIComponent(txt(match.member.email, profileId(match.member)))}&subject=${encodeURIComponent("VaultForge Room Match")}`} style={goldBtn}>Contact</Link>
      </div>
    </div>
  );
}


function routeStatusMap() {
  return ok() ? j<Record<string, { status: string; at: string; memberName: string; memberEmail: string; roomId: string; kind: string }>>(localStorage.getItem(ROUTE_STATUS_KEY), {}) : {};
}

function routeEntriesForRoom(kind: RoomKind, id: string) {
  return Object.entries(routeStatusMap())
    .filter(([, value]) => value.kind === kind && value.roomId === id)
    .map(([key, value]) => ({ key, ...value }))
    .sort((a, b) => String(b.at).localeCompare(String(a.at)));
}

function routeCountsForRoom(kind: RoomKind, id: string) {
  const entries = routeEntriesForRoom(kind, id);
  return {
    pending: entries.filter((entry) => entry.status === "pending").length,
    accepted: entries.filter((entry) => entry.status === "accepted").length,
    passed: entries.filter((entry) => entry.status === "passed").length,
    claimed: entries.filter((entry) => entry.status === "claimed").length,
  };
}

function roomRoutedMembers(room: Room) {
  return Array.from(new Set([...list(room.routedToEmails), ...list(room.routedToIds), ...list(room.routedTo), ...list(room.assignedToEmails), ...list(room.assignedToIds)]));
}

function RouteHistoryPanel({ kind, id, room }: { kind: RoomKind; id: string; room: Room }) {
  const entries = routeEntriesForRoom(kind, id);
  const counts = routeCountsForRoom(kind, id);
  const members = roomRoutedMembers(room);

  return (
    <Section title="Routing History">
      <div style={grid}>
        <div style={panel}><div style={eyebrow}>Pending</div><h2 style={h2}>{counts.pending}</h2><p style={muted}>awaiting response</p></div>
        <div style={activePanel}><div style={eyebrow}>Accepted</div><h2 style={h2}>{counts.accepted}</h2><p style={muted}>member accepted</p></div>
        <div style={panel}><div style={eyebrow}>Passed</div><h2 style={h2}>{counts.passed}</h2><p style={muted}>member passed</p></div>
        <div style={activePanel}><div style={eyebrow}>Claimed</div><h2 style={h2}>{counts.claimed}</h2><p style={muted}>execution claimed</p></div>
      </div>

      <div style={{ ...row, marginTop: 18 }}>
        <Link href="/routing" style={goldBtn}>Open Routing</Link>
        <Link href={`/messages?type=${kind}&room=${encodeURIComponent(id)}&subject=${encodeURIComponent("Routing: " + titleFor(room, kind))}`} style={btn}>Message Routed Member</Link>
      </div>

      <div style={{ marginTop: 22 }}>
        <div style={eyebrow}>Routed / Assigned Members</div>
        {members.length ? (
          <div style={grid}>
            {members.map((member) => (
              <div key={member} style={panel}>
                <p style={sub}>{member}</p>
                <div style={{ ...row, marginTop: 12 }}>
                  <Link href={`/messages?type=${kind}&room=${encodeURIComponent(id)}&to=${encodeURIComponent(member)}&subject=${encodeURIComponent("Routing: " + titleFor(room, kind))}`} style={goldBtn}>Message</Link>
                </div>
              </div>
            ))}
          </div>
        ) : <p style={sub}>No routed or assigned members yet.</p>}
      </div>

      <div style={{ marginTop: 22 }}>
        <div style={eyebrow}>Route Timeline</div>
        {entries.length ? (
          <div style={grid}>
            {entries.map((entry) => (
              <div key={entry.key} style={entry.status === "passed" ? panel : activePanel}>
                <div style={eyebrow}>{entry.status}</div>
                <h2 style={h2}>{entry.memberName || entry.memberEmail || "Member"}</h2>
                <p style={muted}>{entry.memberEmail || "No email listed"}</p>
                <p style={muted}>{new Date(entry.at).toLocaleString()}</p>
              </div>
            ))}
          </div>
        ) : <p style={sub}>No route responses logged yet.</p>}
      </div>
    </Section>
  );
}


function ActivityStream({ kind, id }: { kind: RoomKind; id: string }) {
  const activity = [...persistentActivity(kind, id).map((event) => ({ at: event.at, text: `${event.action}: ${event.note}` })), ...activityList(kind, id)].slice(0, 40);
  return (
    <div style={grid}>
      {activity.map((item, index) => (
        <div key={`${item.at}-${index}`} style={panel}>
          <div style={eyebrow}>{new Date(item.at).toLocaleString()}</div>
          <p style={sub}>{item.text}</p>
        </div>
      ))}
    </div>
  );
}

export default function PainRoomPage({ params }: { params: { id: string } }) {
  const id = decodeURIComponent(params.id || "");
  const [room, setRoom] = useState<Room | null>(null);
  const [panelKey, setPanelKey] = useState<"intel" | "problem" | "pressure" | "matches" | "routing" | "activity" | "messages" | "notes">("intel");
  const [watched, setWatched] = useState(false);
  const [watchCount, setWatchCount] = useState(0);

  useEffect(() => {
    const found = getRoom("pain", id);
    setRoom(found);
    setWatched(isWatched("pain", id));
    setWatchCount(watchingCount("pain", id));
    if (found) {
      addActivity("pain", id, "Room viewed");
      addPersistentActivity("pain", id, "Viewed", "Room opened.");
    }
  }, [id]);

  const intel = useMemo(() => room ? painIntel(room) : null, [room]);
  const matches = useMemo(() => room ? bestMatches(room, "pain") : [], [room]);
  const img = room ? firstPhoto(room) : "";

  if (!room || !intel) {
    return (
      <main style={page}>
        <div style={wrap}>
          <Nav active="pain" />
          <section style={hero}>
            <div style={eyebrow}>Pain Room</div>
            <h1 style={h1}>Room not found.</h1>
            <p style={sub}>Go back to Pain Rooms and open a current room.</p>
            <div style={{ ...row, marginTop: 20 }}><Link href="/pain-rooms" style={goldBtn}>Back to Pain Rooms</Link></div>
          </section>
        </div>
      </main>
    );
  }

  function move(state: RoomState) {
    setRoomState("pain", room!, state);
    setRoom({ ...room!, roomState: state, cleanupState: state, stateStatus: state });
  }

  function watch() {
    const next = toggleWatch("pain", id);
    setWatched(next);
    setWatchCount(watchingCount("pain", id));
  }

  return (
    <main style={page}>
      <div style={wrap}>
        <Nav active="pain" />

        <section style={intel.severity >= 80 ? dangerHero : hero}>
          {img ? <img src={img} alt={titleFor(room, "pain")} style={photoStyle} /> : null}
          <div style={eyebrow}>Pain Room • {roomState(room)}</div>
          <h1 style={h1}>{titleFor(room, "pain")}</h1>
          <p style={sub}>{loc(room)}</p>
          <p style={muted}>{list(room.painTypes).join(", ") || "Problem not classified"} • Needs {list(room.needs || room.routingNeeds).join(", ") || "Solver"}</p>
        </section>

        <Section title="Room Actions">
          <div style={row}>
            <button type="button" style={goldBtn} onClick={watch}>{watched ? `Following (${watchCount})` : `Watch (${watchCount})`}</button>
            <Link href={`/messages?type=pain&room=${encodeURIComponent(id)}&subject=${encodeURIComponent("Pain Room: " + titleFor(room, "pain"))}`} style={goldBtn}>Message</Link>
            <Link href={`/messages?type=pain&room=${encodeURIComponent(id)}&subject=${encodeURIComponent("Solver Request: " + titleFor(room, "pain"))}`} style={btn}>Request Solver</Link>
            <button type="button" style={btn} onClick={() => move("saved")}>Save</button>
            <button type="button" style={btn} onClick={() => move("archived")}>Archive</button>
            <button type="button" style={redBtn} onClick={() => move("deleted")}>Delete</button>
            <Link href="/pain-rooms" style={btn}>Back</Link>
          </div>
        </Section>

        
        <RoomInsideIntelligence kind="pain" room={room} />

        <Section title="Intelligence Tabs">
          <div style={grid}>
            <button type="button" style={panelKey === "intel" ? activePanel : panel} onClick={() => setPanelKey("intel")}><div style={eyebrow}>AI Diagnosis</div><h2 style={h2}>{intel.severity}%</h2><p style={muted}>{intel.signal}</p></button>
            <button type="button" style={panelKey === "problem" ? activePanel : panel} onClick={() => setPanelKey("problem")}><div style={eyebrow}>Problem</div><h2 style={h2}>{list(room.painTypes).length}</h2><p style={muted}>pain type(s)</p></button>
            <button type="button" style={panelKey === "pressure" ? activePanel : panel} onClick={() => setPanelKey("pressure")}><div style={eyebrow}>Pressure</div><h2 style={h2}>{intel.collapse}%</h2><p style={muted}>collapse risk</p></button>
            <button type="button" style={panelKey === "matches" ? activePanel : panel} onClick={() => setPanelKey("matches")}><div style={eyebrow}>Solvers</div><h2 style={h2}>{matches.length}</h2><p style={muted}>member fits</p></button>
            <button type="button" style={panelKey === "routing" ? activePanel : panel} onClick={() => setPanelKey("routing")}><div style={eyebrow}>Routing</div><h2 style={h2}>{routeEntriesForRoom("pain", id).length}</h2><p style={muted}>route history</p></button>
            <button type="button" style={panelKey === "activity" ? activePanel : panel} onClick={() => setPanelKey("activity")}><div style={eyebrow}>Activity</div><h2 style={h2}>{activityList("pain", id).length}</h2><p style={muted}>room events</p></button>
            <button type="button" style={panelKey === "messages" ? activePanel : panel} onClick={() => setPanelKey("messages")}><div style={eyebrow}>Messages</div><h2 style={h2}>Open</h2><p style={muted}>thread context</p></button>
          </div>
        </Section>

        {panelKey === "intel" ? (
          <Section title="AI Pain Intelligence">
            <div style={grid}>
              
              
              
              
              <Value title="Signal" value={intel.signal} />
              <Value title="Best Next Move" value={intel.next} />
              <Value title="If Nothing Happens" value={intel.consequence} />
            </div>
          </Section>
        ) : null}

        {panelKey === "problem" ? (
          <Section title="Problem Facts">
            <div style={grid}>
              <Value title="Pain Type" value={list(room.painTypes).join(", ")} />
              <Value title="Needs" value={list(room.needs || room.routingNeeds).join(", ")} />
              <Value title="Severity" value={room.severity} />
              <Value title="Time Pressure" value={room.timePressure} />
              <Value title="Control Status" value={room.controlStatus} />
              <Value title="Current Status" value={room.currentStatus} />
              <Value title="Owner / Seller Situation" value={room.ownerSituation} />
              <Value title="Access Status" value={room.accessStatus} />
            </div>
          </Section>
        ) : null}

        {panelKey === "pressure" ? (
          <>
            <Section title="Blockers + Risk">
              <div style={grid}>
                <Value title="Blockers" value={list(room.blockers).join(", ")} />
                <Value title="Risks" value={list(room.risks || room.riskTypes).join(", ")} />
                <Value title="Root Cause" value={room.rootCause} />
                <Value title="Title Status" value={room.titleStatus} />
                <Value title="Permit Status" value={room.permitStatus} />
                <Value title="Insurance Status" value={room.insuranceStatus} />
                <Value title="Legal Status" value={room.legalStatus} />
              </div>
            </Section>
            <Section title="Money + Deadline">
              <div style={grid}>
                <Value title="Ask Price" value={txt(room.askingPrice || room.askPrice)} />
                <Value title="Value / ARV" value={txt(room.propertyValue || room.value)} />
                <Value title="Repairs / Work" value={room.repairs} />
                <Value title="Monthly Burn" value={txt(room.monthlyBurn || room.monthlyBurnRate)} />
                <Value title="Money Needed Now" value={room.moneyNeededNow} />
                <Value title="Deadline" value={room.deadline} />
              </div>
            </Section>
          </>
        ) : null}

        {panelKey === "matches" ? (
          <Section title="Best Solver Matches">
            {matches.length ? <div style={grid}>{matches.map((match) => <MatchCard key={profileId(match.member)} match={match} />)}</div> : <p style={sub}>No matching member profiles yet. Complete Profile to power matching.</p>}
          </Section>
        ) : null}

        {panelKey === "routing" ? <RouteHistoryPanel kind="pain" id={id} room={room} /> : null}

        {panelKey === "activity" ? (
          <Section title="Room Activity Stream">
            <ActivityStream kind="pain" id={id} />
          </Section>
        ) : null}

        {panelKey === "messages" ? (
          <Section title="Message Context">
            <p style={sub}>Messages opened from here carry this pain room title, state, and severity context.</p>
            <div style={{ ...row, marginTop: 18 }}>
              <Link href={`/messages?type=pain&room=${encodeURIComponent(id)}&subject=${encodeURIComponent("Pain Room: " + titleFor(room, "pain"))}`} style={goldBtn}>Open Message Thread</Link>
              <Link href={`/messages?type=pain&room=${encodeURIComponent(id)}&subject=${encodeURIComponent("Route Solver: " + titleFor(room, "pain"))}`} style={btn}>Route Solver Request</Link>
            </div>
          </Section>
        ) : null}

        {panelKey === "notes" ? (
          <Section title="Notes">
            <p style={sub}>{txt(room.notes, "No notes added.")}</p>
            <p style={muted}>{txt(room.analyzer)}</p>
          </Section>
        ) : null}
      </div>
    </main>
  );
}
