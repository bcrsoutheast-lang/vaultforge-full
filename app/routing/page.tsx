"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Member = {
  id: string;
  name: string;
  email: string;
  company: string;
  state: string;
  states: string[];
  counties: string[];
  memberType: string;
  strategies: string[];
  painFocus: string[];
  capitalRange: string;
  score: number;
};

type Room = {
  id?: string;
  roomId?: string;
  title?: string;
  state?: string;
  city?: string;
  county?: string;
  assetClass?: string;
  propertyType?: string;
  strategy?: string[] | string;
  routeTo?: string[] | string;
  severity?: string;
  painTypes?: string[] | string;
  needs?: string[] | string;
  routingNeeds?: string[] | string;
  roomState?: string;
  cleanupState?: string;
  stateStatus?: string;
  ownerEmail?: string;
  ownerId?: string;
  routedToIds?: string[] | string;
  routedToEmails?: string[] | string;
  assignedToIds?: string[] | string;
  assignedToEmails?: string[] | string;
  updatedAt?: string;
  createdAt?: string;
  [key: string]: unknown;
};

const PROFILE_KEYS = ["vaultforge_profile", "vaultforge_member_profile", "vaultforge_clean_profile"];
const MEMBER_DIRECTORY_KEYS = ["vaultforge_member_directory", "vaultforge_members", "vf_members"];
const DEAL_KEYS = ["vaultforge_clean_deal_rooms", "vaultforge_deal_rooms", "vaultforge_rooms_deals", "vf_deal_rooms"];
const PAIN_KEYS = ["vaultforge_clean_pain_rooms_v2", "vaultforge_clean_pain_rooms_v1", "vaultforge_clean_pain_rooms", "vaultforge_pain_rooms", "vaultforge_rooms_pain", "vf_pain_rooms"];
const THREAD_KEY = "vaultforge_message_threads_v2";
const ACTIVITY_KEY = "vaultforge_room_activity_v2";
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
  if (Array.isArray(value)) return value.map((x) => String(x).trim()).filter(Boolean);
  if (typeof value === "string" && value.trim()) return value.split(",").map((x) => x.trim()).filter(Boolean);
  return [];
}

function arr<T>(key: string): T[] {
  if (!ok()) return [];
  const parsed = j<unknown>(localStorage.getItem(key), []);
  return Array.isArray(parsed) ? (parsed as T[]) : [];
}

function rid(room: Room) {
  return txt(room.id || room.roomId);
}

function loc(room: Room) {
  return [txt(room.city), txt(room.county), txt(room.state)].filter(Boolean).join(", ") || "Market not listed";
}

function roomTitle(room: Room, kind: "deal" | "pain") {
  return txt(room.title, kind === "deal" ? "Untitled Deal Room" : "Untitled Pain Room");
}

function normalizeRoom(raw: any): Room {
  const id = txt(raw?.id || raw?.roomId || raw?.dealId || raw?.painId || raw?.signalId);
  return {
    ...raw,
    id,
    roomId: id,
    title: txt(raw?.title || raw?.name || raw?.dealTitle || raw?.painTitle || raw?.problemTitle),
  };
}

function readRooms(kind: "deal" | "pain") {
  if (!ok()) return [];
  const keys = kind === "deal" ? DEAL_KEYS : PAIN_KEYS;
  const out: Room[] = [];
  const seen = new Set<string>();

  for (const key of keys) {
    for (const row of arr<any>(key)) {
      const room = normalizeRoom(row);
      const id = rid(room);
      if (!id || seen.has(id)) continue;
      seen.add(id);
      out.push(room);
    }
  }

  return out.filter((room) => {
    const status = txt(room.roomState || room.cleanupState || room.stateStatus, "active");
    return !["deleted", "archived"].includes(status);
  });
}

function defaultMembers(): Member[] {
  return [
    {
      id: "ga_buyer",
      name: "Georgia Buyer Group",
      email: "ga@vaultforge.local",
      company: "Atlanta Acquisitions",
      state: "GA",
      states: ["GA", "TN"],
      counties: ["Cobb", "Fulton", "Cherokee"],
      memberType: "Buyer",
      strategies: ["Fix & Flip", "Rental"],
      painFocus: ["Distress", "Foreclosure"],
      capitalRange: "$500k-$5M",
      score: 91,
    },
    {
      id: "fl_operator",
      name: "Florida Operator",
      email: "fl@vaultforge.local",
      company: "Sunbelt Operations",
      state: "FL",
      states: ["FL", "GA"],
      counties: ["Miami-Dade", "Orange"],
      memberType: "Operator",
      strategies: ["Multifamily", "Value Add"],
      painFocus: ["Construction", "Capital"],
      capitalRange: "$1M-$10M",
      score: 87,
    },
    {
      id: "capital_partner",
      name: "Capital Partner",
      email: "capital@vaultforge.local",
      company: "Forge Capital",
      state: "TX",
      states: ["TX", "GA", "FL"],
      counties: [],
      memberType: "Lender",
      strategies: ["Bridge", "Equity"],
      painFocus: ["Capital", "Liquidity"],
      capitalRange: "$5M-$50M",
      score: 94,
    },
  ];
}

function readMembers(): Member[] {
  if (!ok()) return defaultMembers();

  const out: Member[] = [];
  const seen = new Set<string>();

  for (const key of MEMBER_DIRECTORY_KEYS) {
    for (const raw of arr<any>(key)) {
      const email = txt(raw?.email).toLowerCase();
      const id = txt(raw?.id || email || raw?.name);
      if (!id || seen.has(id)) continue;
      seen.add(id);

      out.push({
        id,
        name: txt(raw?.name || raw?.fullName || raw?.full_name || raw?.company, "VaultForge Member"),
        email,
        company: txt(raw?.company || raw?.businessName || raw?.name, "VaultForge"),
        state: txt(raw?.state, "GA"),
        states: list(raw?.states || raw?.statesOperatedIn || raw?.markets || raw?.operatingStates),
        counties: list(raw?.counties || raw?.markets),
        memberType: txt(raw?.memberType || raw?.role || raw?.type, "Operator"),
        strategies: list(raw?.strategies || raw?.buyBox || raw?.focus),
        painFocus: list(raw?.painFocus || raw?.painTypes || raw?.problemsSolved),
        capitalRange: txt(raw?.capitalRange || raw?.capital || raw?.fundSize, "Not listed"),
        score: Number(raw?.score || 70),
      });
    }
  }

  for (const key of PROFILE_KEYS) {
    const raw = j<any | null>(localStorage.getItem(key), null);
    if (!raw || typeof raw !== "object") continue;

    const email = txt(raw?.email).toLowerCase();
    const id = txt(raw?.id || email || raw?.name);
    if (!id || seen.has(id)) continue;
    seen.add(id);

    out.push({
      id,
      name: txt(raw?.name || raw?.fullName || raw?.full_name || raw?.company, "Me"),
      email,
      company: txt(raw?.company || raw?.businessName || raw?.name, "VaultForge"),
      state: txt(raw?.state, "GA"),
      states: list(raw?.states || raw?.statesOperatedIn || raw?.markets || raw?.operatingStates),
      counties: list(raw?.counties || raw?.markets),
      memberType: txt(raw?.memberType || raw?.role || raw?.type, "Operator"),
      strategies: list(raw?.strategies || raw?.buyBox || raw?.focus),
      painFocus: list(raw?.painFocus || raw?.painTypes || raw?.problemsSolved),
      capitalRange: txt(raw?.capitalRange || raw?.capital || raw?.fundSize, "Not listed"),
      score: Number(raw?.score || 88),
    });
  }

  return out.length ? out : defaultMembers();
}

function scoreDeal(room: Room, member: Member) {
  let score = member.score;

  if (member.states.includes(txt(room.state))) score += 18;
  if (member.counties.includes(txt(room.county))) score += 12;

  const strategies = list(room.strategy);
  for (const strat of strategies) {
    if (member.strategies.some((item) => item.toLowerCase().includes(strat.toLowerCase()))) score += 10;
  }

  if (member.memberType.toLowerCase().includes("buyer")) score += 8;
  if (member.memberType.toLowerCase().includes("lender")) score += 4;

  return Math.min(99, score);
}

function scorePain(room: Room, member: Member) {
  let score = member.score;

  if (member.states.includes(txt(room.state))) score += 18;
  if (member.counties.includes(txt(room.county))) score += 10;

  const pain = list(room.painTypes);
  for (const p of pain) {
    if (member.painFocus.some((item) => item.toLowerCase().includes(p.toLowerCase()))) score += 12;
  }

  if (member.memberType.toLowerCase().includes("operator")) score += 7;
  if (member.memberType.toLowerCase().includes("lender") && txt(room.severity).includes("Capital")) score += 6;

  return Math.min(99, score);
}


function routeKey(kind: "deal" | "pain", roomId: string, member: Member) {
  return `${kind}:${roomId}:${member.id || member.email}`;
}

function routeStatusMap() {
  return ok() ? j<Record<string, { status: string; at: string; memberName: string; memberEmail: string; roomId: string; kind: string }>>(localStorage.getItem(ROUTE_STATUS_KEY), {}) : {};
}

function setRouteStatus(kind: "deal" | "pain", roomId: string, member: Member, status: "pending" | "accepted" | "passed" | "claimed") {
  const map = routeStatusMap();
  map[routeKey(kind, roomId, member)] = {
    status,
    at: new Date().toISOString(),
    memberName: member.name,
    memberEmail: member.email,
    roomId,
    kind,
  };
  writeJson(ROUTE_STATUS_KEY, map);
  window.dispatchEvent(new Event("vaultforge-route-status-change"));
}

function countRouteStatuses() {
  const map = routeStatusMap();
  const values = Object.values(map);
  return {
    pending: values.filter((item) => item.status === "pending").length,
    accepted: values.filter((item) => item.status === "accepted").length,
    passed: values.filter((item) => item.status === "passed").length,
    claimed: values.filter((item) => item.status === "claimed").length,
  };
}


function routeEntries() {
  return Object.entries(routeStatusMap()).map(([key, value]) => ({ key, ...value }));
}

function routeEntriesByStatus(status: string) {
  return routeEntries().filter((entry) => entry.status === status);
}

function roomRouteEntries(kind: "deal" | "pain", roomId: string) {
  return routeEntries().filter((entry) => entry.kind === kind && entry.roomId === roomId);
}

function roomHasRoute(kind: "deal" | "pain", roomId: string) {
  return roomRouteEntries(kind, roomId).length > 0;
}

function routeRoomTitle(kind: "deal" | "pain", roomId: string) {
  const room = kind === "deal"
    ? readRooms("deal").find((item) => rid(item) === roomId)
    : readRooms("pain").find((item) => rid(item) === roomId);

  return room ? roomTitle(room, kind) : `${kind.toUpperCase()} ROOM ${roomId.slice(0, 8)}`;
}

function routeRoomLocation(kind: "deal" | "pain", roomId: string) {
  const room = kind === "deal"
    ? readRooms("deal").find((item) => rid(item) === roomId)
    : readRooms("pain").find((item) => rid(item) === roomId);

  return room ? loc(room) : "Room context";
}

function unmatchedRooms(kind: "deal" | "pain") {
  return readRooms(kind).filter((room) => !roomHasRoute(kind, rid(room)));
}


function routeAgeDays(entry: { at: string }) {
  const time = new Date(entry.at).getTime();
  if (!Number.isFinite(time)) return 0;
  return Math.max(0, Math.floor((Date.now() - time) / 86400000));
}

function isUrgentPainRoom(room: Room | undefined) {
  if (!room) return false;
  const severity = txt(room.severity);
  const timePressure = txt(room.timePressure);
  return severity === "Critical" || severity === "Emergency" || timePressure.includes("24") || timePressure.includes("72");
}

function escalationRoutes() {
  return routeEntries().filter((entry) => {
    const kind = entry.kind === "pain" ? "pain" : "deal";
    const room = kind === "deal"
      ? readRooms("deal").find((item) => rid(item) === entry.roomId)
      : readRooms("pain").find((item) => rid(item) === entry.roomId);

    const stalePending = entry.status === "pending" && routeAgeDays(entry) >= 3;
    const urgentPainPending = kind === "pain" && entry.status === "pending" && isUrgentPainRoom(room);
    return stalePending || urgentPainPending;
  });
}

function rerouteEntry(entry: { status: string; at: string; memberName: string; memberEmail: string; roomId: string; kind: string }) {
  const kind = entry.kind === "pain" ? "pain" : "deal";
  const room = kind === "deal"
    ? readRooms("deal").find((item) => rid(item) === entry.roomId)
    : readRooms("pain").find((item) => rid(item) === entry.roomId);

  const members = readMembers();
  const ranked = members
    .filter((member) => member.email !== entry.memberEmail)
    .map((member) => ({ member, score: kind === "deal" ? scoreDeal(room || {}, member) : scorePain(room || {}, member) }))
    .sort((a, b) => b.score - a.score);

  const nextMember = ranked[0]?.member;
  if (!nextMember) return;

  routeRoom(kind, entry.roomId, nextMember);
  messageMember(kind, entry.roomId, nextMember);
}

function followUpEntry(entry: { status: string; at: string; memberName: string; memberEmail: string; roomId: string; kind: string }) {
  const kind = entry.kind === "pain" ? "pain" : "deal";
  const room = kind === "deal"
    ? readRooms("deal").find((item) => rid(item) === entry.roomId)
    : readRooms("pain").find((item) => rid(item) === entry.roomId);

  const member: Member = {
    id: entry.memberEmail || entry.memberName || "member",
    name: entry.memberName || entry.memberEmail || "Member",
    email: entry.memberEmail || "",
    company: "VaultForge",
    state: txt(room?.state, "GA"),
    states: [txt(room?.state, "GA")],
    counties: [txt(room?.county)],
    memberType: "Routed Member",
    strategies: [],
    painFocus: [],
    capitalRange: "Not listed",
    score: 70,
  };

  messageMember(kind, entry.roomId, member);
}



function memberRouteStatus(kind: "deal" | "pain", roomId: string, member: Member) {
  return routeStatusMap()[routeKey(kind, roomId, member)]?.status || "";
}


function routeRoom(kind: "deal" | "pain", roomId: string, member: Member) {
  if (!ok()) return;

  const keys = kind === "deal" ? DEAL_KEYS : PAIN_KEYS;

  for (const key of keys) {
    const rooms = arr<any>(key);
    const next = rooms.map((raw) => {
      const room = normalizeRoom(raw);
      if (rid(room) !== roomId) return raw;

      const ids = new Set(list(room.routedToIds).concat(list(room.assignedToIds)));
      const emails = new Set(list(room.routedToEmails).concat(list(room.assignedToEmails)));

      ids.add(member.id);
      emails.add(member.email);

      return {
        ...room,
        routedToIds: Array.from(ids),
        assignedToIds: Array.from(ids),
        routedToEmails: Array.from(emails),
        assignedToEmails: Array.from(emails),
        updatedAt: new Date().toISOString(),
      };
    });

    writeJson(key, next);
  }

  const activity = j<Record<string, { at: string; action: string; note: string }[]>>(localStorage.getItem(ACTIVITY_KEY), {});
  const activityKey = `${kind}:${roomId}`;
  activity[activityKey] = [
    {
      at: new Date().toISOString(),
      action: "Routed",
      note: `Room routed to ${member.name}.`,
    },
    ...(activity[activityKey] || []),
  ].slice(0, 75);

  writeJson(ACTIVITY_KEY, activity);
  setRouteStatus(kind, roomId, member, "pending");

  window.dispatchEvent(new Event("vaultforge-room-activity-change"));
  window.dispatchEvent(new Event("vaultforge-my-rooms-change"));
  window.dispatchEvent(new Event("vaultforge-alert-change"));
}

function messageMember(kind: "deal" | "pain", roomId: string, member: Member) {
  if (!ok()) return;

  const room = kind === "deal"
    ? readRooms("deal").find((item) => rid(item) === roomId)
    : readRooms("pain").find((item) => rid(item) === roomId);

  const threads = arr<any>(THREAD_KEY);

  threads.unshift({
    id: `route_${kind}_${roomId}_${Date.now()}`,
    lane: kind,
    roomId,
    roomType: kind,
    subject: `${kind === "deal" ? "Deal Route" : "Pain Route"} • ${roomTitle(room || {}, kind)}`,
    state: txt(room?.state),
    roomTitle: roomTitle(room || {}, kind),
    roomSubtitle: loc(room || {}),
    participants: [member.email],
    toEmail: member.email,
    status: "active",
    unread: true,
    saved: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messages: [
      {
        id: `msg_${Date.now()}`,
        body: `VaultForge routing request sent to ${member.name}.`,
        from: "VaultForge",
        fromEmail: "",
        at: new Date().toISOString(),
        read: false,
        attachments: [],
      },
    ],
  });

  writeJson(THREAD_KEY, threads);

  window.dispatchEvent(new Event("vaultforge-messages-change"));
  window.dispatchEvent(new Event("vaultforge-alert-change"));
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
const wrap: React.CSSProperties = { maxWidth: 1400, margin: "0 auto", paddingBottom: 90 };
const nav: React.CSSProperties = { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 18 };
const brand: React.CSSProperties = { color: "#ffd45a", fontSize: 27, fontWeight: 950, letterSpacing: -1, marginRight: 10 };
const btn: React.CSSProperties = { border: "1px solid rgba(207,216,230,.18)", background: "#171c29", color: "#f7f7fb", borderRadius: 999, padding: "13px 18px", fontWeight: 950, textDecoration: "none", display: "inline-block", cursor: "pointer" };
const goldBtn: React.CSSProperties = { ...btn, border: 0, background: "#ffdc68", color: "#10131a" };
const redBtn: React.CSSProperties = { ...btn, background: "#271016", borderColor: "rgba(255,70,70,.48)", color: "#ffaaaa" };
const hero: React.CSSProperties = { border: "1px solid rgba(245,197,66,.28)", borderRadius: 28, padding: 30, marginBottom: 20, background: "radial-gradient(circle at top right, rgba(245,197,66,.16), transparent 32%), linear-gradient(180deg,#080d19,#050816)" };
const card: React.CSSProperties = { background: "linear-gradient(180deg,#080d19,#050816)", border: "1px solid rgba(245,197,66,.28)", borderRadius: 26, padding: 26, marginBottom: 22 };
const panel: React.CSSProperties = { background: "#121724", border: "1px solid rgba(207,216,230,.16)", borderRadius: 22, padding: 22 };
const activePanel: React.CSSProperties = { ...panel, borderColor: "rgba(245,197,66,.75)", boxShadow: "0 0 26px rgba(245,197,66,.18)" };
const pulseRed: React.CSSProperties = { ...panel, borderColor: "rgba(255,70,70,.70)", animation: "vfPulseRed 2.1s ease-in-out infinite" };
const pulseGold: React.CSSProperties = { ...panel, borderColor: "rgba(255,220,104,.70)", animation: "vfPulseGold 2.3s ease-in-out infinite" };
const eyebrow: React.CSSProperties = { color: "#ffd45a", textTransform: "uppercase", letterSpacing: 7, fontWeight: 950, fontSize: 15, marginBottom: 12 };
const h1: React.CSSProperties = { fontSize: "clamp(44px,8vw,86px)", lineHeight: 0.9, letterSpacing: -4, margin: "0 0 18px", fontWeight: 950 };
const h2: React.CSSProperties = { fontSize: "clamp(26px,5vw,44px)", lineHeight: 0.95, letterSpacing: -2, margin: "0 0 14px", fontWeight: 950 };
const sub: React.CSSProperties = { color: "#c9d0dc", fontSize: 18, lineHeight: 1.35, margin: 0 };
const muted: React.CSSProperties = { color: "#aeb7c7", margin: "8px 0 0", lineHeight: 1.35 };
const grid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 16 };
const row: React.CSSProperties = { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" };

function Nav() {
  return (
    <nav style={nav}>
      <div style={brand}>VAULTFORGE</div>
      <Link href="/command" style={btn}>Command</Link>
      <Link href="/my-rooms" style={btn}>My Rooms</Link>
      <Link href="/state-map" style={btn}>State Map</Link>
      <Link href="/alerts" style={btn}>Alerts</Link>
      <Link href="/messages" style={btn}>Messages</Link>
      <Link href="/routing" style={goldBtn}>Routing</Link>
      <Link href="/network" style={btn}>Network</Link>
      <Link href="/logout" style={redBtn}>Logout</Link>
    </nav>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section style={card}><div style={eyebrow}>{title}</div>{children}</section>;
}

function MemberCard({ member, score, routeStatus, onRoute, onMessage }: { member: Member; score: number; routeStatus: string; onRoute: () => void; onMessage: () => void }) {
  return (
    <div style={score >= 92 ? pulseGold : activePanel}>
      <div style={eyebrow}>Match Score • {score}</div>
      <h2 style={h2}>{member.name}</h2>
      <p style={sub}>{member.company}</p>
      <p style={muted}>{member.memberType} • {member.capitalRange}</p>
      <p style={muted}>States: {member.states.join(", ") || member.state}</p>
      <p style={muted}>Strategies: {member.strategies.join(", ") || "Not listed"}</p>
      <p style={muted}>Pain Focus: {member.painFocus.join(", ") || "Not listed"}</p>
      <p style={muted}>Route Status: {routeStatus || "not routed"}</p>

      <div style={{ ...row, marginTop: 16 }}>
        <button type="button" style={routeStatus ? btn : goldBtn} onClick={onRoute}>{routeStatus ? "Re-Route" : "Route"}</button>
        <button type="button" style={btn} onClick={onMessage}>Message</button>
      </div>
    </div>
  );
}



function EscalationEntryCard({ entry, refresh }: { entry: { key: string; status: string; at: string; memberName: string; memberEmail: string; roomId: string; kind: string }; refresh: () => void }) {
  const kind = entry.kind === "pain" ? "pain" : "deal";
  const roomHref = kind === "deal" ? `/deal-rooms/${encodeURIComponent(entry.roomId)}` : `/pain-rooms/${encodeURIComponent(entry.roomId)}`;
  const age = routeAgeDays(entry);
  const room = kind === "deal"
    ? readRooms("deal").find((item) => rid(item) === entry.roomId)
    : readRooms("pain").find((item) => rid(item) === entry.roomId);
  const urgent = kind === "pain" && isUrgentPainRoom(room);

  return (
    <div style={urgent ? pulseRed : pulseGold}>
      <div style={eyebrow}>Escalation • {urgent ? "Urgent Pain" : "Stale Pending"}</div>
      <h2 style={h2}>{routeRoomTitle(kind, entry.roomId)}</h2>
      <p style={sub}>{routeRoomLocation(kind, entry.roomId)}</p>
      <p style={muted}>Member: {entry.memberName || entry.memberEmail || "Member"}</p>
      <p style={muted}>Pending age: {age} day(s) • Status: {entry.status}</p>
      <p style={muted}>{urgent ? "High-pressure pain route needs response." : "Route has been pending too long."}</p>
      <div style={{ ...row, marginTop: 14 }}>
        <Link href={roomHref} style={goldBtn}>Open Room</Link>
        <button type="button" style={btn} onClick={() => { followUpEntry(entry); refresh(); }}>Message Follow-Up</button>
        <button type="button" style={goldBtn} onClick={() => { rerouteEntry(entry); refresh(); }}>Reroute Best Fit</button>
      </div>
    </div>
  );
}


function RouteEntryCard({ entry }: { entry: { key: string; status: string; at: string; memberName: string; memberEmail: string; roomId: string; kind: string } }) {
  const kind = entry.kind === "pain" ? "pain" : "deal";
  const roomHref = kind === "deal" ? `/deal-rooms/${encodeURIComponent(entry.roomId)}` : `/pain-rooms/${encodeURIComponent(entry.roomId)}`;

  return (
    <div style={entry.status === "passed" ? panel : entry.status === "pending" ? pulseGold : activePanel}>
      <div style={eyebrow}>{entry.status}</div>
      <h2 style={h2}>{routeRoomTitle(kind, entry.roomId)}</h2>
      <p style={sub}>{routeRoomLocation(kind, entry.roomId)}</p>
      <p style={muted}>Member: {entry.memberName || entry.memberEmail || "Member"}</p>
      <p style={muted}>{new Date(entry.at).toLocaleString()}</p>
      <div style={{ ...row, marginTop: 14 }}>
        <Link href={roomHref} style={goldBtn}>Open Room</Link>
        <Link href={`/messages?type=${kind}&room=${encodeURIComponent(entry.roomId)}&to=${encodeURIComponent(entry.memberEmail || "")}&subject=${encodeURIComponent("Route Follow Up: " + routeRoomTitle(kind, entry.roomId))}`} style={btn}>Message</Link>
      </div>
    </div>
  );
}

function UnmatchedRoomCard({ kind, room }: { kind: "deal" | "pain"; room: Room }) {
  const href = kind === "deal" ? `/deal-rooms/${encodeURIComponent(rid(room))}` : `/pain-rooms/${encodeURIComponent(rid(room))}`;

  return (
    <div style={kind === "pain" ? pulseRed : pulseGold}>
      <div style={eyebrow}>{kind === "deal" ? "Unmatched Deal" : "Unmatched Pain"}</div>
      <h2 style={h2}>{roomTitle(room, kind)}</h2>
      <p style={sub}>{loc(room)}</p>
      <p style={muted}>
        {kind === "deal"
          ? `${txt(room.assetClass, "Deal")} • ${txt(room.propertyType, "Type")}`
          : `${list(room.painTypes).join(", ") || "Pain"} • ${txt(room.severity, "High")}`}
      </p>
      <div style={{ ...row, marginTop: 14 }}>
        <Link href={href} style={goldBtn}>Open Room</Link>
      </div>
    </div>
  );
}


export default function RoutingPage() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const refresh = () => setTick((value) => value + 1);

    window.addEventListener("storage", refresh);
    window.addEventListener("vaultforge-room-activity-change", refresh);
    window.addEventListener("vaultforge-messages-change", refresh);
    window.addEventListener("vaultforge-route-status-change", refresh);

    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("vaultforge-room-activity-change", refresh);
      window.removeEventListener("vaultforge-messages-change", refresh);
      window.removeEventListener("vaultforge-route-status-change", refresh);
    };
  }, []);

  const deals = useMemo(() => readRooms("deal"), [tick]);
  const pains = useMemo(() => readRooms("pain"), [tick]);
  const members = useMemo(() => readMembers(), [tick]);
  const routeCounts = useMemo(() => countRouteStatuses(), [tick]);
  const pendingRoutes = useMemo(() => routeEntriesByStatus("pending"), [tick]);
  const acceptedRoutes = useMemo(() => routeEntriesByStatus("accepted"), [tick]);
  const passedRoutes = useMemo(() => routeEntriesByStatus("passed"), [tick]);
  const claimedRoutes = useMemo(() => routeEntriesByStatus("claimed"), [tick]);
  const unmatchedDeals = useMemo(() => unmatchedRooms("deal"), [deals, tick]);
  const unmatchedPains = useMemo(() => unmatchedRooms("pain"), [pains, tick]);
  const escalations = useMemo(() => escalationRoutes(), [tick, deals, pains]);

  return (
    <main style={page}>
      <style>{styleTag}</style>

      <div style={wrap}>
        <Nav />

        <section style={hero}>
          <div style={eyebrow}>Routing Engine</div>
          <h1 style={h1}>AI member matching.</h1>
          <p style={sub}>Best fit members, operators, lenders, and buyers for each room. Route directly into their workspace.</p>
        </section>

        <Section title="Route Status Board">
          <div style={grid}>
            <div style={pulseGold}><div style={eyebrow}>Pending</div><h2 style={h2}>{routeCounts.pending}</h2><p style={muted}>sent routes awaiting member action</p></div>
            <div style={activePanel}><div style={eyebrow}>Accepted</div><h2 style={h2}>{routeCounts.accepted}</h2><p style={muted}>members accepted route</p></div>
            <div style={panel}><div style={eyebrow}>Passed</div><h2 style={h2}>{routeCounts.passed}</h2><p style={muted}>members passed or rejected</p></div>
            <div style={pulseGold}><div style={eyebrow}>Claimed</div><h2 style={h2}>{routeCounts.claimed}</h2><p style={muted}>execution claimed</p></div>
          </div>
        </Section>

        <Section title="Route Queues">
          <div style={grid}>
            <button type="button" style={pendingRoutes.length ? pulseGold : panel}>
              <div style={eyebrow}>Pending Routes</div>
              <h2 style={h2}>{pendingRoutes.length}</h2>
              <p style={muted}>sent, waiting on member action</p>
            </button>
            <button type="button" style={acceptedRoutes.length ? activePanel : panel}>
              <div style={eyebrow}>Accepted Routes</div>
              <h2 style={h2}>{acceptedRoutes.length}</h2>
              <p style={muted}>member accepted route</p>
            </button>
            <button type="button" style={passedRoutes.length ? panel : panel}>
              <div style={eyebrow}>Passed Routes</div>
              <h2 style={h2}>{passedRoutes.length}</h2>
              <p style={muted}>not a fit / rejected</p>
            </button>
            <button type="button" style={claimedRoutes.length ? pulseGold : panel}>
              <div style={eyebrow}>Claimed Execution</div>
              <h2 style={h2}>{claimedRoutes.length}</h2>
              <p style={muted}>member claimed execution</p>
            </button>
            <button type="button" style={unmatchedDeals.length ? pulseGold : panel}>
              <div style={eyebrow}>Unmatched Deals</div>
              <h2 style={h2}>{unmatchedDeals.length}</h2>
              <p style={muted}>deal rooms needing route</p>
            </button>
            <button type="button" style={unmatchedPains.length ? pulseRed : panel}>
              <div style={eyebrow}>Unmatched Pain</div>
              <h2 style={h2}>{unmatchedPains.length}</h2>
              <p style={muted}>pain rooms needing solver</p>
            </button>
            <button type="button" style={escalations.length ? pulseRed : panel}>
              <div style={eyebrow}>Escalations</div>
              <h2 style={h2}>{escalations.length}</h2>
              <p style={muted}>stale or urgent routes</p>
            </button>
          </div>
        </Section>

        <Section title="Escalation Queue">
          {escalations.length ? (
            <div style={grid}>
              {escalations.map((entry) => <EscalationEntryCard key={entry.key} entry={entry} refresh={() => setTick((value) => value + 1)} />)}
            </div>
          ) : <p style={sub}>No stale or urgent route escalations.</p>}
        </Section>

        <Section title="Pending Route Queue">
          {pendingRoutes.length ? <div style={grid}>{pendingRoutes.map((entry) => <RouteEntryCard key={entry.key} entry={entry} />)}</div> : <p style={sub}>No pending routes.</p>}
        </Section>

        <Section title="Accepted / Claimed Queue">
          {[...acceptedRoutes, ...claimedRoutes].length ? <div style={grid}>{[...acceptedRoutes, ...claimedRoutes].map((entry) => <RouteEntryCard key={entry.key} entry={entry} />)}</div> : <p style={sub}>No accepted or claimed routes yet.</p>}
        </Section>

        <Section title="Unmatched Deal Rooms">
          {unmatchedDeals.length ? <div style={grid}>{unmatchedDeals.map((room) => <UnmatchedRoomCard key={rid(room)} kind="deal" room={room} />)}</div> : <p style={sub}>All active deal rooms have route history.</p>}
        </Section>

        <Section title="Unmatched Pain Rooms">
          {unmatchedPains.length ? <div style={grid}>{unmatchedPains.map((room) => <UnmatchedRoomCard key={rid(room)} kind="pain" room={room} />)}</div> : <p style={sub}>All active pain rooms have route history.</p>}
        </Section>

        <Section title="Deal Routing Lane">
          {deals.length ? (
            <div style={{ display: "grid", gap: 24 }}>
              {deals.map((room) => {
                const ranked = members
                  .map((member) => ({ member, score: scoreDeal(room, member) }))
                  .sort((a, b) => b.score - a.score)
                  .slice(0, 3);

                return (
                  <div key={rid(room)} style={activePanel}>
                    <div style={eyebrow}>Deal Room</div>
                    <h2 style={h2}>{roomTitle(room, "deal")}</h2>
                    <p style={sub}>{loc(room)}</p>
                    <p style={muted}>
                      {txt(room.assetClass, "Deal")} • {txt(room.propertyType, "Type")} • Strategy {list(room.strategy).join(", ") || "open"}
                    </p>
                    <p style={muted}>
                      Routed: {list(room.routedToIds).length} • Assigned: {list(room.assignedToIds).length}
                    </p>

                    <div style={{ ...row, marginTop: 14, marginBottom: 18 }}>
                      <Link href={`/deal-rooms/${encodeURIComponent(rid(room))}`} style={goldBtn}>Open Deal Room</Link>
                    </div>

                    <div style={grid}>
                      {ranked.map(({ member, score }) => (
                        <MemberCard
                          key={`${rid(room)}_${member.id}`}
                          member={member}
                          score={score}
                          routeStatus={memberRouteStatus("deal", rid(room), member)}
                          onRoute={() => {
                            routeRoom("deal", rid(room), member);
                            setTick((value) => value + 1);
                          }}
                          onMessage={() => {
                            messageMember("deal", rid(room), member);
                            setTick((value) => value + 1);
                          }}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={panel}>
              <h2 style={h2}>No active deal rooms.</h2>
              <p style={sub}>Create deal rooms to generate routing matches.</p>
            </div>
          )}
        </Section>

        <Section title="Pain Solver Lane">
          {pains.length ? (
            <div style={{ display: "grid", gap: 24 }}>
              {pains.map((room) => {
                const ranked = members
                  .map((member) => ({ member, score: scorePain(room, member) }))
                  .sort((a, b) => b.score - a.score)
                  .slice(0, 3);

                return (
                  <div key={rid(room)} style={txt(room.severity).includes("Critical") || txt(room.severity).includes("Emergency") ? pulseRed : activePanel}>
                    <div style={eyebrow}>Pain Room</div>
                    <h2 style={h2}>{roomTitle(room, "pain")}</h2>
                    <p style={sub}>{loc(room)}</p>
                    <p style={muted}>
                      {list(room.painTypes).join(", ") || "Pain"} • {txt(room.severity, "High")} • Needs {list(room.needs || room.routingNeeds).join(", ") || "solver"}
                    </p>
                    <p style={muted}>
                      Routed: {list(room.routedToIds).length} • Assigned: {list(room.assignedToIds).length}
                    </p>

                    <div style={{ ...row, marginTop: 14, marginBottom: 18 }}>
                      <Link href={`/pain-rooms/${encodeURIComponent(rid(room))}`} style={goldBtn}>Open Pain Room</Link>
                    </div>

                    <div style={grid}>
                      {ranked.map(({ member, score }) => (
                        <MemberCard
                          key={`${rid(room)}_${member.id}`}
                          member={member}
                          score={score}
                          routeStatus={memberRouteStatus("pain", rid(room), member)}
                          onRoute={() => {
                            routeRoom("pain", rid(room), member);
                            setTick((value) => value + 1);
                          }}
                          onMessage={() => {
                            messageMember("pain", rid(room), member);
                            setTick((value) => value + 1);
                          }}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={panel}>
              <h2 style={h2}>No active pain rooms.</h2>
              <p style={sub}>Create pain rooms to generate solver matches.</p>
            </div>
          )}
        </Section>
      </div>
    </main>
  );
}
