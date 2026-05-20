"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type RoomKind = "deal" | "pain";
type RouteFilter = "active" | "urgent" | "capital" | "operator" | "buyer" | "legal" | "closed";
type RouteStatus = "pending" | "accepted" | "passed" | "claimed" | "closed";

type Room = {
  id?: string;
  roomId?: string;
  title?: string;
  name?: string;
  state?: string;
  city?: string;
  county?: string;
  assetClass?: string;
  propertyType?: string;
  severity?: string;
  timePressure?: string;
  painTypes?: string[] | string;
  needs?: string[] | string;
  routingNeeds?: string[] | string;
  routeTo?: string[] | string;
  strategy?: string[] | string;
  blockers?: string[] | string;
  risks?: string[] | string;
  riskTypes?: string[] | string;
  roomState?: string;
  cleanupState?: string;
  stateStatus?: string;
  memberRoomStatus?: string;
  executionStage?: string;
  dealStage?: string;
  painStage?: string;
  askingPrice?: string;
  askPrice?: string;
  propertyValue?: string;
  value?: string;
  repairs?: string;
  capitalPressure?: string;
  moneyNeededNow?: string;
  ownerEmail?: string;
  memberEmail?: string;
  createdBy?: string;
  createdByEmail?: string;
  assignedTo?: string[] | string;
  assignedToIds?: string[] | string;
  assignedToEmail?: string[] | string;
  assignedToEmails?: string[] | string;
  routedTo?: string[] | string;
  routedToIds?: string[] | string;
  routedToEmail?: string[] | string;
  routedToEmails?: string[] | string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
};

type RouteEntry = {
  id: string;
  kind: RoomKind;
  room: Room;
  status: RouteStatus;
  score: number;
  urgency: number;
  requiredParty: string;
  bestNextMove: string;
  pressure: string;
  lastMovement: string;
};

const DEAL_KEYS = ["vaultforge_clean_deal_rooms", "vaultforge_deal_rooms", "vaultforge_rooms_deals", "vf_deal_rooms"];
const PAIN_KEYS = ["vaultforge_clean_pain_rooms_v2", "vaultforge_clean_pain_rooms_v1", "vaultforge_clean_pain_rooms", "vaultforge_pain_rooms", "vaultforge_rooms_pain", "vf_pain_rooms"];
const STATE_KEYS = ["vaultforge_deal_room_state_v2", "vaultforge_pain_room_state_v2", "vaultforge_clean_room_states", "vaultforge_room_states", "vaultforge_deal_room_states", "vaultforge_pain_room_states"];
const MEMBER_STATE_KEY = "vaultforge_my_room_status_v1";
const ROUTE_STATUS_KEY = "vaultforge_route_status_v1";
const ACTIVITY_KEY = "vaultforge_room_activity_v2";

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

function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function txt(value: unknown, fallback = "") {
  const clean = String(value || "").trim();
  return clean || fallback;
}

function list(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  if (typeof value === "string" && value.trim()) return value.split(",").map((item) => item.trim()).filter(Boolean);
  return [];
}

function num(value: unknown) {
  const parsed = Number(String(value || "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function arr<T>(key: string): T[] {
  if (!ok()) return [];
  const parsed = j<unknown>(localStorage.getItem(key), []);
  return Array.isArray(parsed) ? (parsed as T[]) : [];
}

function rid(room: Room | null | undefined) {
  return txt(room?.id || room?.roomId);
}

function keysFor(kind: RoomKind) {
  return kind === "deal" ? DEAL_KEYS : PAIN_KEYS;
}

function roomTitle(room: Room, kind: RoomKind) {
  return txt(room.title || room.name, kind === "deal" ? "Untitled Deal Room" : "Untitled Pain Room");
}

function loc(room: Room) {
  return [txt(room.city), txt(room.county), txt(room.state)].filter(Boolean).join(", ") || "Market not listed";
}

function normalizeRoom(row: any, kind: RoomKind): Room {
  const id = txt(row?.id || row?.roomId || row?.dealId || row?.painId || row?.signalId);
  return {
    ...row,
    id,
    roomId: id,
    title: txt(row?.title || row?.name || row?.dealTitle || row?.painTitle || row?.problemTitle, kind === "deal" ? "Untitled Deal Room" : "Untitled Pain Room"),
    state: txt(row?.state, "GA"),
    city: txt(row?.city),
    county: txt(row?.county),
  };
}

function stateMap() {
  const map: Record<string, string> = {};
  if (!ok()) return map;
  STATE_KEYS.forEach((key) => Object.assign(map, j<Record<string, string>>(localStorage.getItem(key), {})));
  Object.assign(map, j<Record<string, string>>(localStorage.getItem(MEMBER_STATE_KEY), {}));
  return map;
}

function rawStatus(room: Room) {
  const state = txt(room.memberRoomStatus || room.roomState || room.cleanupState || room.stateStatus, "active");
  if (state === "saved" || state === "archived" || state === "deleted" || state === "sold" || state === "resolved") return state;
  return "active";
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

  return out
    .map((room) => {
      const id = rid(room);
      const status = states[id] || states[`${kind}:${id}`] || rawStatus(room);
      return { ...room, memberRoomStatus: status, roomState: status, cleanupState: status, stateStatus: status };
    })
    .filter((room) => rawStatus(room) !== "deleted")
    .sort((a, b) => String(b.updatedAt || b.createdAt || "").localeCompare(String(a.updatedAt || a.createdAt || "")));
}

function currentMemberIdentity() {
  if (!ok()) return { id: "", email: "", hasIdentity: false };

  let profile: any = {};
  for (const key of ["vaultforge_profile", "vaultforge_member_profile", "vf_profile", "member_profile", "profile"]) {
    try {
      const raw = localStorage.getItem(key);
      if (raw && raw.startsWith("{")) profile = { ...profile, ...JSON.parse(raw) };
    } catch {
      // ignore bad cache
    }
  }

  const email = txt(
    profile.email ||
      profile.memberEmail ||
      profile.member_email ||
      localStorage.getItem("vf_email") ||
      localStorage.getItem("member_email") ||
      localStorage.getItem("email")
  ).toLowerCase();

  const id = txt(
    profile.id ||
      profile.memberId ||
      profile.member_id ||
      profile.auth_user_id ||
      profile.user_id ||
      email ||
      "local_member"
  ).toLowerCase();

  return { id, email, hasIdentity: Boolean(id || email) };
}

function routeStatusMap() {
  return ok() ? j<Record<string, { status: string; at: string; memberName: string; memberEmail: string; roomId: string; kind: string }>>(localStorage.getItem(ROUTE_STATUS_KEY), {}) : {};
}

function routeKey(kind: RoomKind, room: Room) {
  const current = currentMemberIdentity();
  const id = rid(room);
  return `${kind}:${id}:${current.id || current.email || "local_member"}`;
}

function routeStatusFor(kind: RoomKind, room: Room): RouteStatus {
  const id = rid(room);
  const current = currentMemberIdentity();
  const map = routeStatusMap();

  const entries = Object.entries(map).filter(([key, value]) => {
    if (value.kind !== kind || value.roomId !== id) return false;
    const keyLower = key.toLowerCase();
    return Boolean(
      (current.id && keyLower.includes(current.id.toLowerCase())) ||
      (current.email && keyLower.includes(current.email.toLowerCase())) ||
      txt(value.memberEmail).toLowerCase() === current.email
    );
  });

  for (const status of ["claimed", "accepted", "pending", "passed", "closed"]) {
    if (entries.some(([, value]) => value.status === status)) return status as RouteStatus;
  }

  const roomStatus = rawStatus(room);
  if (roomStatus === "sold" || roomStatus === "resolved" || roomStatus === "archived") return "closed";
  return entries[0]?.[1]?.status as RouteStatus || "pending";
}

function setRouteStatus(kind: RoomKind, room: Room, status: RouteStatus) {
  if (!ok()) return;
  const map = routeStatusMap();
  const current = currentMemberIdentity();
  const id = rid(room);
  const key = routeKey(kind, room);

  map[key] = {
    status,
    at: new Date().toISOString(),
    memberName: current.id || "local_member",
    memberEmail: current.email,
    roomId: id,
    kind,
  };

  writeJson(ROUTE_STATUS_KEY, map);
  addRouteActivity(kind, room, "Route Status", `Route marked ${status}.`);
  window.dispatchEvent(new Event("vaultforge-route-status-change"));
  window.dispatchEvent(new Event("vaultforge-alert-change"));
  window.dispatchEvent(new Event("vaultforge-my-rooms-change"));
}

function addRouteActivity(kind: RoomKind, room: Room, action: string, note: string) {
  if (!ok()) return;
  const id = rid(room);
  if (!id) return;
  const key = `${kind}:${id}`;
  const all = j<Record<string, { at: string; action: string; note: string }[]>>(localStorage.getItem(ACTIVITY_KEY), {});
  all[key] = [{ at: new Date().toISOString(), action, note }, ...(all[key] || [])].slice(0, 75);
  writeJson(ACTIVITY_KEY, all);
  window.dispatchEvent(new Event("vaultforge-room-activity-change"));
}

function lastMovement(kind: RoomKind, room: Room) {
  if (!ok()) return txt(room.updatedAt || room.createdAt, "Not listed");
  const id = rid(room);
  const activity = j<Record<string, { at: string; action: string; note: string }[]>>(localStorage.getItem(ACTIVITY_KEY), {});
  const events = activity[`${kind}:${id}`] || [];
  return events[0]?.at || txt(room.updatedAt || room.createdAt, "Not listed");
}

function pressureLabel(kind: RoomKind, room: Room) {
  if (kind === "pain") {
    const sev = txt(room.severity, "High");
    const time = txt(room.timePressure, "Timeline open");
    return `${sev} • ${time}`;
  }

  const ask = num(room.askingPrice || room.askPrice);
  const value = num(room.propertyValue || room.value);
  const repairs = num(room.repairs);
  const spread = value && ask ? value - ask - repairs : 0;
  if (!ask || !value) return "Numbers incomplete";
  if (spread > 150000) return "High spread";
  if (spread > 50000) return "Working spread";
  if (spread <= 0) return "Margin weak";
  return "Verify spread";
}

function urgencyScore(kind: RoomKind, room: Room) {
  if (kind === "pain") {
    let score = 40;
    const severity = txt(room.severity).toLowerCase();
    const time = txt(room.timePressure).toLowerCase();
    if (severity.includes("medium")) score += 10;
    if (severity.includes("high")) score += 25;
    if (severity.includes("critical")) score += 38;
    if (severity.includes("emergency")) score += 48;
    if (time.includes("24")) score += 18;
    if (time.includes("72")) score += 14;
    if (list(room.blockers).length) score += 8;
    return Math.max(0, Math.min(100, score));
  }

  let score = 35;
  const ask = num(room.askingPrice || room.askPrice);
  const value = num(room.propertyValue || room.value);
  const repairs = num(room.repairs);
  const spread = value && ask ? value - ask - repairs : 0;
  if (!ask || !value) score += 18;
  if (spread > 50000) score += 15;
  if (spread > 150000) score += 15;
  if (list(room.routeTo).length) score += 10;
  if (txt(room.timePressure).includes("24") || txt(room.timePressure).includes("72")) score += 14;
  return Math.max(0, Math.min(100, score));
}

function routeFitScore(kind: RoomKind, room: Room) {
  let score = 40;
  if (kind === "deal") {
    if (list(room.routeTo).length) score += 20;
    if (txt(room.assetClass)) score += 10;
    if (txt(room.propertyType)) score += 10;
    if (num(room.askingPrice || room.askPrice) && num(room.propertyValue || room.value)) score += 15;
    if (txt(room.state)) score += 5;
  } else {
    if (list(room.needs || room.routingNeeds).length) score += 25;
    if (list(room.painTypes).length) score += 15;
    if (txt(room.severity)) score += 10;
    if (txt(room.timePressure)) score += 10;
  }
  return Math.max(0, Math.min(100, score));
}

function requiredParty(kind: RoomKind, room: Room) {
  const combined = [
    ...list(room.routeTo),
    ...list(room.needs),
    ...list(room.routingNeeds),
    ...list(room.blockers),
    ...list(room.painTypes),
    txt(room.assetClass),
    txt(room.propertyType),
  ].join(" ").toLowerCase();

  if (combined.includes("capital") || combined.includes("lender") || combined.includes("money") || combined.includes("fund")) return "Capital / Lender";
  if (combined.includes("buyer") || combined.includes("dispo")) return "Buyer / Disposition";
  if (combined.includes("legal") || combined.includes("title") || combined.includes("attorney")) return "Legal / Title";
  if (combined.includes("contractor") || combined.includes("operator") || combined.includes("rehab") || combined.includes("construction")) return "Operator / Contractor";
  if (combined.includes("developer") || combined.includes("land") || combined.includes("zoning")) return "Developer / Land";
  return kind === "deal" ? "Buyer / Capital / Operator" : "Solver / Operator / Capital";
}

function bestNextMove(kind: RoomKind, room: Room) {
  const party = requiredParty(kind, room);
  const status = routeStatusFor(kind, room);

  if (status === "claimed") return "Execution claimed. Track follow-through and next movement.";
  if (status === "accepted") return "Accepted. Send next room context and request firm action window.";
  if (status === "passed") return "Passed. Re-route to a better-fit member or archive if stale.";
  if (status === "closed") return "Closed route. Keep for performance/history.";

  if (kind === "deal") {
    if (!num(room.askingPrice || room.askPrice) || !num(room.propertyValue || room.value)) return "Collect ask, value/ARV, repairs, photos, control, and access before pushing hard.";
    return `Route to ${party}. Ask for decision, proof review, and execution response.`;
  }

  if (!list(room.needs || room.routingNeeds).length && !list(room.blockers).length) return "Classify blocker, solver type, deadline, and money need before routing.";
  return `Route to ${party}. Confirm blocker owner, deadline, and required fix.`;
}

function buildRouteEntries(deals: Room[], pains: Room[]): RouteEntry[] {
  return [
    ...deals.map((room) => ({ kind: "deal" as RoomKind, room })),
    ...pains.map((room) => ({ kind: "pain" as RoomKind, room })),
  ].map((item) => ({
    id: `${item.kind}:${rid(item.room)}`,
    kind: item.kind,
    room: item.room,
    status: routeStatusFor(item.kind, item.room),
    score: routeFitScore(item.kind, item.room),
    urgency: urgencyScore(item.kind, item.room),
    requiredParty: requiredParty(item.kind, item.room),
    bestNextMove: bestNextMove(item.kind, item.room),
    pressure: pressureLabel(item.kind, item.room),
    lastMovement: lastMovement(item.kind, item.room),
  }));
}

function filterEntries(entries: RouteEntry[], filter: RouteFilter) {
  if (filter === "active") return entries.filter((entry) => entry.status !== "closed");
  if (filter === "urgent") return entries.filter((entry) => entry.urgency >= 70 && entry.status !== "closed");
  if (filter === "capital") return entries.filter((entry) => entry.requiredParty.toLowerCase().includes("capital") || entry.requiredParty.toLowerCase().includes("lender"));
  if (filter === "operator") return entries.filter((entry) => entry.requiredParty.toLowerCase().includes("operator") || entry.requiredParty.toLowerCase().includes("contractor"));
  if (filter === "buyer") return entries.filter((entry) => entry.requiredParty.toLowerCase().includes("buyer"));
  if (filter === "legal") return entries.filter((entry) => entry.requiredParty.toLowerCase().includes("legal") || entry.requiredParty.toLowerCase().includes("title"));
  if (filter === "closed") return entries.filter((entry) => entry.status === "closed" || entry.status === "passed");
  return entries;
}

function dateText(value: string) {
  if (!value || value === "Not listed") return "Not listed";
  const time = new Date(value).getTime();
  if (!Number.isFinite(time)) return value;
  return new Date(value).toLocaleString();
}

const styleTag = `
@keyframes vfPulseRed {
  0% { box-shadow: 0 0 0 rgba(255,60,70,.0); transform: translateY(0); }
  50% { box-shadow: 0 0 34px rgba(255,60,70,.34); transform: translateY(-1px); }
  100% { box-shadow: 0 0 0 rgba(255,60,70,.0); transform: translateY(0); }
}
@keyframes vfPulseGold {
  0% { box-shadow: 0 0 0 rgba(255,220,104,.0); transform: translateY(0); }
  50% { box-shadow: 0 0 34px rgba(255,220,104,.28); transform: translateY(-1px); }
  100% { box-shadow: 0 0 0 rgba(255,220,104,.0); transform: translateY(0); }
}
`;

const page: React.CSSProperties = { minHeight: "100vh", background: "#05070d", color: "#f7f7fb", padding: 18, fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" };
const wrap: React.CSSProperties = { maxWidth: 1320, margin: "0 auto", paddingBottom: 90 };
const nav: React.CSSProperties = { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 18 };
const brand: React.CSSProperties = { color: "#ffd45a", fontSize: 27, fontWeight: 950, letterSpacing: -1, marginRight: 10 };
const btn: React.CSSProperties = { border: "1px solid rgba(207,216,230,.18)", background: "#171c29", color: "#f7f7fb", borderRadius: 999, padding: "13px 18px", fontWeight: 950, textDecoration: "none", display: "inline-block", cursor: "pointer" };
const goldBtn: React.CSSProperties = { ...btn, border: 0, background: "#ffdc68", color: "#10131a" };
const redBtn: React.CSSProperties = { ...btn, background: "#271016", borderColor: "rgba(255,70,70,.48)", color: "#ffaaaa" };
const hero: React.CSSProperties = { border: "1px solid rgba(245,197,66,.28)", borderRadius: 30, padding: 30, marginBottom: 20, background: "radial-gradient(circle at top right, rgba(245,197,66,.16), transparent 32%), linear-gradient(180deg,#080d19,#050816)" };
const card: React.CSSProperties = { background: "linear-gradient(180deg,#080d19,#050816)", border: "1px solid rgba(245,197,66,.28)", borderRadius: 26, padding: 26, marginBottom: 22 };
const panel: React.CSSProperties = { background: "#121724", border: "1px solid rgba(207,216,230,.16)", borderRadius: 22, padding: 22, color: "#f7f7fb", textDecoration: "none", display: "block" };
const activePanel: React.CSSProperties = { ...panel, borderColor: "rgba(245,197,66,.75)", boxShadow: "0 0 26px rgba(245,197,66,.18)" };
const pulseRed: React.CSSProperties = { ...panel, borderColor: "rgba(255,70,70,.70)", animation: "vfPulseRed 2.1s ease-in-out infinite" };
const pulseGold: React.CSSProperties = { ...panel, borderColor: "rgba(255,220,104,.70)", animation: "vfPulseGold 2.3s ease-in-out infinite" };
const eyebrow: React.CSSProperties = { color: "#ffd45a", textTransform: "uppercase", letterSpacing: 7, fontWeight: 950, fontSize: 14, marginBottom: 12 };
const h1: React.CSSProperties = { fontSize: "clamp(44px,8vw,86px)", lineHeight: 0.9, letterSpacing: -4, margin: "0 0 18px", fontWeight: 950 };
const h2: React.CSSProperties = { fontSize: "clamp(30px,5vw,52px)", lineHeight: 0.95, letterSpacing: -2, margin: "0 0 14px", fontWeight: 950 };
const sub: React.CSSProperties = { color: "#c9d0dc", fontSize: 20, lineHeight: 1.35, margin: 0 };
const muted: React.CSSProperties = { color: "#aeb7c7", margin: "8px 0 0", lineHeight: 1.35 };
const grid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: 16 };
const row: React.CSSProperties = { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" };
const meterBg: React.CSSProperties = { height: 11, background: "#070a12", borderRadius: 999, overflow: "hidden", border: "1px solid rgba(207,216,230,.12)" };

function Nav() {
  return (
    <nav style={nav}>
      <div style={brand}>VAULTFORGE</div>
      <Link href="/command" style={btn}>Command</Link>
      <Link href="/my-rooms" style={btn}>My Rooms</Link>
      <Link href="/routing" style={goldBtn}>Routing</Link>
      <Link href="/members" style={btn}>Members</Link>
      <Link href="/network" style={btn}>Network</Link>
      <Link href="/state-map" style={btn}>State Map</Link>
      <Link href="/alerts" style={btn}>Alerts</Link>
      <Link href="/messages" style={btn}>Messages</Link>
      <Link href="/deal-create" style={btn}>Create Deal</Link>
      <Link href="/pain-intake" style={btn}>Pain Intake</Link>
      <Link href="/profile" style={btn}>Profile</Link>
      <Link href="/logout" style={redBtn}>Logout</Link>
    </nav>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section style={card}><div style={eyebrow}>{title}</div>{children}</section>;
}

function MetricCard({ title, count, note, danger }: { title: string; count: number; note: string; danger?: boolean }) {
  return (
    <div style={danger && count ? pulseRed : count ? pulseGold : panel}>
      <div style={eyebrow}>{title}</div>
      <h2 style={h2}>{count}</h2>
      <p style={muted}>{note}</p>
    </div>
  );
}

function FilterButton({ filter, current, title, count, onClick }: { filter: RouteFilter; current: RouteFilter; title: string; count: number; onClick: () => void }) {
  return (
    <button type="button" style={current === filter ? activePanel : count ? pulseGold : panel} onClick={onClick}>
      <div style={eyebrow}>{title}</div>
      <h2 style={h2}>{count}</h2>
      <p style={muted}>route item(s)</p>
    </button>
  );
}

function RouteCard({ entry, refresh }: { entry: RouteEntry; refresh: () => void }) {
  const room = entry.room;
  const id = rid(room);
  const href = entry.kind === "deal" ? `/deal-rooms/${encodeURIComponent(id)}` : `/pain-rooms/${encodeURIComponent(id)}`;
  const style = entry.status === "pending" && entry.urgency >= 70 ? pulseRed : entry.status === "accepted" || entry.status === "claimed" ? pulseGold : panel;
  const meterColor = entry.urgency >= 75 ? "#ff4b5c" : entry.score >= 70 ? "#ffdc68" : "#f5a742";

  return (
    <div style={style}>
      <div style={eyebrow}>{entry.kind === "deal" ? "Deal Route" : "Pain Route"} • {entry.status}</div>
      <h2 style={h2}>{roomTitle(room, entry.kind)}</h2>
      <p style={sub}>{loc(room)}</p>
      <p style={muted}>
        {entry.kind === "deal"
          ? `${txt(room.assetClass, "Asset")} • ${txt(room.propertyType, "Type")} • ${list(room.strategy).join(", ") || "Strategy open"}`
          : `${list(room.painTypes).join(", ") || "Pain"} • ${txt(room.severity, "Severity open")} • ${txt(room.timePressure, "Timeline open")}`}
      </p>

      <div style={{ ...grid, marginTop: 16 }}>
        <div style={panel}>
          <div style={eyebrow}>Fit Score</div>
          <h2 style={{ ...h2, fontSize: "clamp(26px,4vw,40px)" }}>{entry.score}%</h2>
          <div style={meterBg}><div style={{ width: `${entry.score}%`, height: "100%", background: "#ffdc68" }} /></div>
        </div>
        <div style={panel}>
          <div style={eyebrow}>Urgency</div>
          <h2 style={{ ...h2, fontSize: "clamp(26px,4vw,40px)" }}>{entry.urgency}%</h2>
          <div style={meterBg}><div style={{ width: `${entry.urgency}%`, height: "100%", background: meterColor }} /></div>
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <div style={eyebrow}>VaultForge Route Read</div>
        <p style={sub}>{entry.bestNextMove}</p>
        <p style={muted}>Required party: {entry.requiredParty}</p>
        <p style={muted}>Pressure: {entry.pressure}</p>
        <p style={muted}>Last movement: {dateText(entry.lastMovement)}</p>
      </div>

      <div style={{ ...row, marginTop: 18 }}>
        <Link href={href} style={goldBtn}>Open Room</Link>
        <Link href={`/messages?type=${entry.kind}&room=${encodeURIComponent(id)}&subject=${encodeURIComponent((entry.kind === "deal" ? "Deal Route: " : "Pain Route: ") + roomTitle(room, entry.kind))}`} style={btn}>Message</Link>
        {entry.status !== "accepted" ? <button type="button" style={goldBtn} onClick={() => { setRouteStatus(entry.kind, room, "accepted"); refresh(); }}>Accept</button> : null}
        {entry.status !== "claimed" ? <button type="button" style={goldBtn} onClick={() => { setRouteStatus(entry.kind, room, "claimed"); refresh(); }}>Claim</button> : null}
        {entry.status !== "passed" ? <button type="button" style={btn} onClick={() => { setRouteStatus(entry.kind, room, "passed"); refresh(); }}>Pass</button> : null}
        {entry.status !== "closed" ? <button type="button" style={btn} onClick={() => { setRouteStatus(entry.kind, room, "closed"); refresh(); }}>Close</button> : null}
      </div>
    </div>
  );
}

export default function RoutingPage() {
  const [tick, setTick] = useState(0);
  const [filter, setFilter] = useState<RouteFilter>("active");

  useEffect(() => {
    const refresh = () => setTick((value) => value + 1);
    window.addEventListener("storage", refresh);
    window.addEventListener("vaultforge-route-status-change", refresh);
    window.addEventListener("vaultforge-my-rooms-change", refresh);
    window.addEventListener("vaultforge-room-activity-change", refresh);
    window.addEventListener("vaultforge-deal-change", refresh);
    window.addEventListener("vaultforge-pain-change", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("vaultforge-route-status-change", refresh);
      window.removeEventListener("vaultforge-my-rooms-change", refresh);
      window.removeEventListener("vaultforge-room-activity-change", refresh);
      window.removeEventListener("vaultforge-deal-change", refresh);
      window.removeEventListener("vaultforge-pain-change", refresh);
    };
  }, []);

  const deals = useMemo(() => allRooms("deal"), [tick]);
  const pains = useMemo(() => allRooms("pain"), [tick]);
  const entries = useMemo(() => buildRouteEntries(deals, pains), [deals, pains]);
  const visible = useMemo(() => filterEntries(entries, filter), [entries, filter]);
  const refresh = () => setTick((value) => value + 1);

  const active = entries.filter((entry) => entry.status !== "closed").length;
  const urgent = entries.filter((entry) => entry.urgency >= 70 && entry.status !== "closed").length;
  const pending = entries.filter((entry) => entry.status === "pending").length;
  const claimed = entries.filter((entry) => entry.status === "claimed").length;

  const filters: { key: RouteFilter; title: string; count: number }[] = [
    { key: "active", title: "Active", count: active },
    { key: "urgent", title: "Urgent", count: urgent },
    { key: "capital", title: "Capital", count: filterEntries(entries, "capital").length },
    { key: "operator", title: "Operator", count: filterEntries(entries, "operator").length },
    { key: "buyer", title: "Buyer", count: filterEntries(entries, "buyer").length },
    { key: "legal", title: "Legal", count: filterEntries(entries, "legal").length },
    { key: "closed", title: "Closed", count: filterEntries(entries, "closed").length },
  ];

  return (
    <main style={page}>
      <style>{styleTag}</style>
      <div style={wrap}>
        <Nav />

        <section style={hero}>
          <div style={eyebrow}>VaultForge Routing</div>
          <h1 style={h1}>Execution route board.</h1>
          <p style={sub}>
            Route deals and pain rooms to the right buyer, capital, operator, legal, developer, or solver lane. Keep routing tight, accountable, and execution driven.
          </p>
          <div style={{ ...row, marginTop: 18 }}>
            <Link href="/my-rooms" style={goldBtn}>My Rooms</Link>
            <Link href="/messages" style={btn}>Messages</Link>
            <Link href="/network" style={btn}>Network</Link>
            <Link href="/state-map" style={btn}>State Map</Link>
          </div>
        </section>

        <section style={{ marginBottom: 20 }}>
          <div style={grid}>
            <MetricCard title="Active Routes" count={active} note="routes not closed" />
            <MetricCard title="Urgent Routes" count={urgent} note="high pressure rooms" danger />
            <MetricCard title="Pending" count={pending} note="waiting on accept/pass/claim" danger />
            <MetricCard title="Claimed" count={claimed} note="execution owned by a member" />
          </div>
        </section>

        <Section title="Route Filters">
          <div style={grid}>
            {filters.map((item) => (
              <FilterButton key={item.key} filter={item.key} current={filter} title={item.title} count={item.count} onClick={() => setFilter(item.key)} />
            ))}
          </div>
        </Section>

        <Section title={`${filters.find((item) => item.key === filter)?.title || "Active"} Route Queue`}>
          {visible.length ? (
            <div style={grid}>
              {visible.map((entry) => (
                <RouteCard key={entry.id} entry={entry} refresh={refresh} />
              ))}
            </div>
          ) : (
            <div style={panel}>
              <h2 style={h2}>No routes here.</h2>
              <p style={sub}>Create rooms, route rooms, or open a different filter.</p>
              <div style={{ ...row, marginTop: 16 }}>
                <Link href="/deal-create" style={goldBtn}>Create Deal</Link>
                <Link href="/pain-intake" style={goldBtn}>Create Pain</Link>
                <Link href="/my-rooms" style={btn}>My Rooms</Link>
              </div>
            </div>
          )}
        </Section>

        <Section title="Routing Doctrine">
          <div style={grid}>
            <div style={panel}>
              <div style={eyebrow}>Tight Routing</div>
              <p style={sub}>Do not broadcast weak rooms.</p>
              <p style={muted}>Classify the constraint first, then route to the smallest team that can remove it.</p>
            </div>
            <div style={panel}>
              <div style={eyebrow}>Execution Response</div>
              <p style={sub}>Accept, pass, claim, or close.</p>
              <p style={muted}>Every route should create movement or be removed from the active board.</p>
            </div>
            <div style={panel}>
              <div style={eyebrow}>VaultForge Intelligence</div>
              <p style={sub}>Route by problem fit, not just state.</p>
              <p style={muted}>Capital, operator, buyer, legal, developer, and solver lanes all need different facts.</p>
            </div>
          </div>
        </Section>
      </div>
    </main>
  );
}
