"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

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
  askingPrice?: string;
  propertyValue?: string;
  repairs?: string;
  timeline?: string;
  timePressure?: string;
  severity?: string;
  capitalPressure?: string;
  controlStatus?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  notes?: string;
  routeTo?: string[] | string;
  routingNeeds?: string[] | string;
  painTypes?: string[] | string;
  strategy?: string[] | string;
  motivation?: string[] | string;
  condition?: string;
  occupancy?: string;
  dealStrength?: string;
  beds?: string;
  baths?: string;
  sqft?: string;
  units?: string;
  acres?: string;
  zoning?: string;
  monthlyRent?: string;
  monthlyBurnRate?: string;
  moneyNeededNow?: string;
  deadline?: string;
  rootCause?: string;
  bestOutcome?: string;
  worstCase?: string;
  desiredSolution?: string;
  blockers?: string[] | string;
  riskTypes?: string[] | string;
  roomState?: RoomState;
  cleanupState?: RoomState;
  stateStatus?: RoomState;
  alertRead?: boolean;
  viewedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  coverPhoto?: string;
  photoUrl?: string;
  imageUrl?: string;
  photos?: string[];
  photoUrls?: string[];
  analyzer?: string;
  [key: string]: unknown;
};

type MemberProfile = {
  id?: string;
  name?: string;
  company?: string;
  email?: string;
  phone?: string;
  profilePhoto?: string;
  memberType?: string;
  basedState?: string;
  basedCity?: string;
  basedCounty?: string;
  statesOperated?: string[];
  markets?: string[];
  assetClasses?: string[];
  strategies?: string[];
  specialties?: string[];
  needs?: string[];
  canProvide?: string[];
  capitalPosition?: string;
  proofOfFunds?: string;
  fundingRange?: string;
  contactPreference?: string;
  directContact?: string;
  bio?: string;
  updatedAt?: string;
  [key: string]: unknown;
};

const DEAL_KEYS = ["vaultforge_clean_deal_rooms", "vaultforge_deal_rooms", "vaultforge_rooms_deals", "vf_deal_rooms"];
const PAIN_KEYS = ["vaultforge_clean_pain_rooms_v1", "vaultforge_clean_pain_rooms", "vaultforge_pain_rooms", "vaultforge_rooms_pain", "vf_pain_rooms"];
const STATE_KEYS = ["vaultforge_clean_room_states", "vaultforge_room_states", "vaultforge_deal_room_states", "vaultforge_pain_room_states", "vaultforge_5s_room_states"];
const READ_KEY = "vaultforge_room_alert_read_v1";
const PROFILE_KEYS = ["vaultforge_profile", "vaultforge_member_profile", "vaultforge_clean_profile"];
const MEMBER_DIRECTORY_KEY = "vaultforge_member_directory_v1";

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

function money(value: unknown) {
  const raw = txt(value);
  const num = Number(raw.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(num) ? num : 0;
}

function pct(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
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
  return txt(room.roomState || room.cleanupState || room.stateStatus, "active") as RoomState;
}

function arr<T>(key: string): T[] {
  if (!ok()) return [];
  const parsed = j<unknown>(localStorage.getItem(key), []);
  return Array.isArray(parsed) ? (parsed as T[]) : [];
}

function keysFor(kind: RoomKind) {
  return kind === "deal" ? DEAL_KEYS : PAIN_KEYS;
}

function singleKeys(kind: RoomKind, id: string) {
  return [`vaultforge_clean_${kind}_room_${id}`, `vaultforge_${kind}_room_${id}`, `vf_${kind}_room_${id}`];
}

function saveSafe(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
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
    for (const row of arr<Room>(key)) {
      const id = rid(row);
      if (!id || seen.has(id)) continue;
      seen.add(id);
      out.push({ ...row, id, roomId: id });
    }
  }

  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i) || "";
    const match = kind === "deal" ? key.includes("deal_room") || key.includes("deal_rooms") : key.includes("pain_room") || key.includes("pain_rooms");
    if (!match) continue;

    const value = j<any>(localStorage.getItem(key), null);
    if (Array.isArray(value)) {
      for (const row of value) {
        const id = rid(row);
        if (!id || seen.has(id)) continue;
        seen.add(id);
        out.push({ ...row, id, roomId: id });
      }
    } else if (value && typeof value === "object") {
      const id = rid(value);
      if (id && !seen.has(id)) {
        seen.add(id);
        out.push({ ...value, id, roomId: id });
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
  return allRooms(kind).find((room) => rid(room) === id) || null;
}

function readMap() {
  return ok() ? j<Record<string, string>>(localStorage.getItem(READ_KEY), {}) : {};
}

function markRead(kind: RoomKind, room: Room) {
  if (!ok()) return;
  const id = rid(room);
  if (!id) return;
  const reads = readMap();
  const now = new Date().toISOString();
  reads[id] = now;
  reads[`${kind}:${id}`] = now;
  localStorage.setItem(READ_KEY, JSON.stringify(reads));

  const next = { ...room, alertRead: true, viewedAt: now, updatedAt: now };
  singleKeys(kind, id).forEach((key) => saveSafe(key, next));
  keysFor(kind).forEach((key) => saveSafe(key, [next, ...arr<Room>(key).filter((row) => rid(row) !== id)]));
  window.dispatchEvent(new Event("vaultforge-room-read-change"));
}

function setRoomState(kind: RoomKind, room: Room, state: RoomState) {
  if (!ok()) return;
  const id = rid(room);
  const next: Room = { ...room, roomState: state, cleanupState: state, stateStatus: state, updatedAt: new Date().toISOString() };
  singleKeys(kind, id).forEach((key) => saveSafe(key, next));
  keysFor(kind).forEach((key) => saveSafe(key, [next, ...arr<Room>(key).filter((row) => rid(row) !== id)]));

  const map = stateMap();
  map[id] = state;
  map[`${kind}:${id}`] = state;
  STATE_KEYS.forEach((key) => saveSafe(key, map));

  window.dispatchEvent(new Event("vaultforge-room-state-change"));
}

function firstPhoto(room: Room) {
  const possible = [
    txt(room.coverPhoto),
    txt(room.photoUrl),
    txt(room.imageUrl),
    ...list(room.photoUrls),
    ...list(room.photos),
  ].filter(Boolean);
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
    basedState: txt(profile.basedState, "GA"),
    statesOperated: list(profile.statesOperated).length ? list(profile.statesOperated) : ["GA"],
    markets: list(profile.markets),
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
    score += 25;
    reasons.push("operates in room state");
  }

  const assetHits = overlap(member.assetClasses, [txt(room.assetClass)]);
  if (assetHits) {
    score += 15;
    reasons.push("asset class fit");
  }

  if (kind === "deal") {
    const strategyHits = overlap(member.strategies, room.strategy);
    if (strategyHits) {
      score += 15;
      reasons.push("strategy fit");
    }
    const provideHits = overlap(member.canProvide, room.routeTo);
    if (provideHits) {
      score += 25;
      reasons.push("can provide requested route");
    }
    if (txt(member.capitalPosition).toLowerCase().includes("cash") || txt(member.capitalPosition).toLowerCase().includes("capital")) {
      score += 10;
      reasons.push("capital-capable profile");
    }
  } else {
    const provideHits = overlap(member.canProvide, room.routingNeeds);
    if (provideHits) {
      score += 30;
      reasons.push("can provide needed solver type");
    }
    const specialtyHits = overlap(member.specialties, room.painTypes);
    if (specialtyHits) {
      score += 20;
      reasons.push("pain specialty fit");
    }
    if (txt(room.capitalPressure) !== "Unknown" && (txt(member.capitalPosition).toLowerCase().includes("capital") || txt(member.capitalPosition).toLowerCase().includes("cash"))) {
      score += 10;
      reasons.push("capital pressure fit");
    }
  }

  return { member, score: pct(score), reasons };
}

function dealIntelligence(room: Room) {
  const ask = money(room.askingPrice);
  const value = money(room.propertyValue);
  const repairs = money(room.repairs);
  const spread = value - ask - repairs;
  const spreadPct = value ? (spread / value) * 100 : 0;
  const hasNumbers = ask > 0 && value > 0;
  const urgency = txt(room.timeline || room.timePressure).includes("24") ? 95 : txt(room.timeline || room.timePressure).includes("72") ? 80 : txt(room.timeline || room.timePressure).includes("7") ? 65 : 45;
  const risk = txt(room.condition).toLowerCase().includes("gut") || txt(room.condition).toLowerCase().includes("fire") ? 75 : txt(room.occupancy).toLowerCase().includes("tenant") || txt(room.occupancy).toLowerCase().includes("squatter") ? 70 : 45;
  const strength = pct((hasNumbers ? 35 : 10) + Math.max(0, Math.min(35, spreadPct)) + (list(room.routeTo).length ? 15 : 5) + (list(room.strategy).length ? 15 : 5));

  return {
    spread,
    spreadPct: Math.round(spreadPct),
    urgency,
    risk,
    strength,
    nextMove: hasNumbers
      ? "Verify control, confirm access, validate photos/condition, route to the strongest capital or buyer profile, then move the conversation into Messages."
      : "Numbers are incomplete. Collect ask, value, repair estimate, occupancy, and access before routing this as a serious opportunity.",
    banner: urgency >= 80 ? "Immediate action required" : strength >= 70 ? "Strong opportunity signal" : "Needs verification before routing",
  };
}

function painIntelligence(room: Room) {
  const severityBase = txt(room.severity) === "Emergency" ? 100 : txt(room.severity) === "Critical" ? 92 : txt(room.severity) === "High" ? 78 : txt(room.severity) === "Medium" ? 55 : 35;
  const timeBoost = txt(room.timePressure).includes("24") ? 15 : txt(room.timePressure).includes("72") ? 10 : txt(room.timePressure).includes("7") ? 6 : 0;
  const blockerBoost = Math.min(20, list(room.blockers).length * 4);
  const riskBoost = Math.min(15, list(room.riskTypes).length * 5);
  const capitalBoost = txt(room.capitalPressure) !== "Unknown" ? 8 : 0;
  const severityScore = pct(severityBase + timeBoost + blockerBoost + riskBoost + capitalBoost);
  const moneyNeeded = money(room.moneyNeededNow);
  const value = money(room.propertyValue);
  const ask = money(room.askingPrice);

  return {
    severityScore,
    capitalNeedScore: pct((moneyNeeded ? 40 : 0) + (txt(room.capitalPressure) !== "Unknown" ? 35 : 0) + (value || ask ? 15 : 0)),
    executionBlockScore: pct(list(room.blockers).length * 12 + list(room.riskTypes).length * 10),
    nextMove: "Define the root cause, verify control, identify the one blocker that stops execution, route to the highest-fit solver, and move the active conversation into Messages.",
    consequence: txt(room.worstCase) || "If nothing happens, time pressure increases, leverage drops, cost rises, and fewer clean exits remain.",
    banner: severityScore >= 85 ? "Emergency pressure signal" : severityScore >= 70 ? "High priority solution room" : "Monitor and route when facts are complete",
  };
}

const page: React.CSSProperties = { minHeight: "100vh", background: "#05070d", color: "#f7f7fb", padding: 18, fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" };
const wrap: React.CSSProperties = { maxWidth: 1280, margin: "0 auto", paddingBottom: 90 };
const nav: React.CSSProperties = { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 18 };
const brand: React.CSSProperties = { color: "#ffd45a", fontSize: 27, fontWeight: 950, letterSpacing: -1, marginRight: 10 };
const btn: React.CSSProperties = { border: "1px solid rgba(207,216,230,.18)", background: "#171c29", color: "#f7f7fb", borderRadius: 999, padding: "13px 18px", fontWeight: 950, textDecoration: "none", display: "inline-block", cursor: "pointer" };
const goldBtn: React.CSSProperties = { ...btn, border: 0, background: "#ffdc68", color: "#10131a" };
const redBtn: React.CSSProperties = { ...btn, background: "#271016", borderColor: "rgba(255,70,70,.48)", color: "#ffaaaa" };
const hero: React.CSSProperties = { border: "1px solid rgba(245,197,66,.28)", borderRadius: 28, padding: 30, marginBottom: 20, background: "radial-gradient(circle at top right, rgba(245,197,66,.16), transparent 32%), linear-gradient(180deg,#080d19,#050816)" };
const redHero: React.CSSProperties = { ...hero, borderColor: "rgba(255,70,70,.42)", background: "radial-gradient(circle at top right, rgba(255,50,80,.22), transparent 35%), linear-gradient(180deg,#120611,#050816)" };
const card: React.CSSProperties = { background: "linear-gradient(180deg,#080d19,#050816)", border: "1px solid rgba(245,197,66,.28)", borderRadius: 26, padding: 26, marginBottom: 22 };
const panel: React.CSSProperties = { background: "#121724", border: "1px solid rgba(207,216,230,.16)", borderRadius: 22, padding: 22 };
const pulsePanel: React.CSSProperties = { ...panel, borderColor: "rgba(255,70,70,.65)", boxShadow: "0 0 26px rgba(255,50,70,.22)" };
const eyebrow: React.CSSProperties = { color: "#ffd45a", textTransform: "uppercase", letterSpacing: 7, fontWeight: 950, fontSize: 15, marginBottom: 12 };
const h1: React.CSSProperties = { fontSize: "clamp(44px,8vw,86px)", lineHeight: 0.9, letterSpacing: -4, margin: "0 0 18px", fontWeight: 950 };
const h2: React.CSSProperties = { fontSize: "clamp(30px,5vw,52px)", lineHeight: 0.95, letterSpacing: -2, margin: "0 0 14px", fontWeight: 950 };
const sub: React.CSSProperties = { color: "#c9d0dc", fontSize: 21, lineHeight: 1.35, margin: 0 };
const muted: React.CSSProperties = { color: "#aeb7c7", margin: "8px 0 0", lineHeight: 1.35 };
const grid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(245px,1fr))", gap: 16 };
const row: React.CSSProperties = { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" };
const photoStyle: React.CSSProperties = { width: "100%", height: 290, objectFit: "cover", borderRadius: 18, border: "1px solid rgba(245,197,66,.25)", marginBottom: 18 };

function Nav({ active }: { active: string }) {
  const item = (href: string, label: string, key: string) => <Link href={href} style={active === key ? goldBtn : btn}>{label}</Link>;
  return <nav style={nav}><div style={brand}>VAULTFORGE</div>{item("/command","Command","command")}{item("/deal-rooms","Deal Rooms","deals")}{item("/deal-create","Create Deal","deal-create")}{item("/pain-intake","Pain Intake","pain-intake")}{item("/pain-rooms","Pain Rooms","pain")}{item("/network","Network","network")}{item("/messages","Messages","messages")}{item("/profile","Profile","profile")}<Link href="/logout" style={redBtn}>Logout</Link></nav>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section style={card}><div style={eyebrow}>{title}</div>{children}</section>;
}

function Value({ label, value }: { label: string; value: unknown }) {
  return <div style={panel}><div style={eyebrow}>{label}</div><p style={sub}>{txt(value, "Not listed")}</p></div>;
}

function Meter({ label, value }: { label: string; value: number }) {
  return <div style={panel}><div style={eyebrow}>{label}</div><h2 style={h2}>{pct(value)}%</h2><div style={{ height: 10, borderRadius: 99, background: "#252b3a", overflow: "hidden" }}><div style={{ width: `${pct(value)}%`, height: "100%", background: "#ffdc68" }} /></div></div>;
}

function MatchCard({ match }: { match: { member: MemberProfile; score: number; reasons: string[] } }) {
  return <div style={match.score >= 65 ? pulsePanel : panel}>
    <div style={eyebrow}>Match Score {match.score}%</div>
    <h2 style={h2}>{txt(match.member.name, "VaultForge Member")}</h2>
    <p style={sub}>{txt(match.member.company, "Company not listed")}</p>
    <p style={muted}>From {txt(match.member.basedState, "N/A")} • Operates {list(match.member.statesOperated).join(", ") || "Not listed"}</p>
    <p style={muted}>Can provide: {list(match.member.canProvide).join(", ") || "Not listed"}</p>
    <p style={muted}>Why: {match.reasons.join(", ") || "Profile needs more routing data"}</p>
    <div style={{ ...row, marginTop: 14 }}>
      <Link href={`/messages?to=${encodeURIComponent(txt(match.member.email, profileId(match.member)))}&subject=${encodeURIComponent("Room Match Contact: " + txt(match.member.name, "VaultForge Member"))}`} style={goldBtn}>Contact</Link>
      <Link href="/network" style={btn}>Network</Link>
    </div>
  </div>;
}

export default function PainRoomPage({ params }: { params: { id: string } }) {
  const id = decodeURIComponent(params.id || "");
  const [room, setRoom] = useState<Room | null>(null);

  useEffect(() => {
    const found = getRoom("pain", id);
    setRoom(found);
    if (found) markRead("pain", found);
  }, [id]);

  const members = useMemo(() => getDirectory(), [room?.id]);
  const intelligence = room ? painIntelligence(room) : null;
  const matches = room ? members.map((member) => scoreMemberForRoom(member, room, "pain")).sort((a, b) => b.score - a.score).slice(0, 5) : [];

  if (!room || !intelligence) {
    return <main style={page}><div style={wrap}><Nav active="pain" /><section style={hero}><h1 style={h1}>Room not found.</h1><p style={sub}>Go back to Pain Rooms and open a current room.</p></section></div></main>;
  }

  const img = firstPhoto(room);

  function move(state: RoomState) {
    setRoomState("pain", room!, state);
    setRoom({ ...room!, roomState: state, cleanupState: state, stateStatus: state });
  }

  return <main style={page}><div style={wrap}><Nav active="pain" />

    <section style={intelligence.severityScore >= 80 ? redHero : hero}>
      {img ? <img src={img} alt={titleFor(room, "pain")} style={photoStyle} /> : null}
      <div style={eyebrow}>Pain Room • {roomState(room)}</div>
      <h1 style={h1}>{titleFor(room, "pain")}</h1>
      <p style={sub}>{loc(room)}</p>
      <p style={muted}>{list(room.painTypes).join(", ") || "Problem not classified"} • Needs {list(room.routingNeeds).join(", ") || "solver"}</p>
      <div style={{ ...row, marginTop: 18 }}>
        <Link href={`/messages?type=pain&room=${encodeURIComponent(id)}&subject=${encodeURIComponent("Pain Room: " + titleFor(room, "pain"))}`} style={goldBtn}>Message Room</Link>
        <Link href="/network" style={btn}>Find Solvers</Link>
      </div>
    </section>

    <Section title="Action Controls">
      <p style={sub}>Current state: {roomState(room)}. Every action changes Command visibility and folder placement.</p>
      <div style={{ ...row, marginTop: 18 }}>
        <button type="button" style={goldBtn} onClick={() => move("saved")}>Save</button>
        <button type="button" style={btn} onClick={() => move("archived")}>Archive</button>
        <button type="button" style={redBtn} onClick={() => move("deleted")}>Delete</button>
      </div>
    </Section>

    <Section title="Pain Intelligence Snapshot">
      <div style={grid}>
        <Meter label="Distress Severity" value={intelligence.severityScore} />
        <Meter label="Capital Need" value={intelligence.capitalNeedScore} />
        <Meter label="Execution Blockers" value={intelligence.executionBlockScore} />
        <Value label="Signal" value={intelligence.banner} />
      </div>
    </Section>

    <Section title="Problem Facts">
      <div style={grid}>
        <Value label="Pain Type" value={list(room.painTypes).join(", ")} />
        <Value label="Severity" value={room.severity} />
        <Value label="Time Pressure" value={room.timePressure} />
        <Value label="Capital Pressure" value={room.capitalPressure} />
        <Value label="Control Status" value={room.controlStatus} />
        <Value label="Needs" value={list(room.routingNeeds).join(", ")} />
      </div>
    </Section>

    <Section title="Blockers + Risk">
      <div style={grid}>
        <Value label="Blockers" value={list(room.blockers).join(", ")} />
        <Value label="Risk Types" value={list(room.riskTypes).join(", ")} />
        <Value label="Root Cause" value={room.rootCause} />
        <Value label="If Nothing Happens" value={intelligence.consequence} />
      </div>
    </Section>

    <Section title="Numbers + Pressure">
      <div style={grid}>
        <Value label="Ask Price" value={room.askingPrice} />
        <Value label="Value / ARV" value={room.propertyValue} />
        <Value label="Repairs / Work" value={room.repairs} />
        <Value label="Monthly Burn" value={room.monthlyBurnRate} />
        <Value label="Money Needed Now" value={room.moneyNeededNow} />
        <Value label="Deadline" value={room.deadline} />
      </div>
    </Section>

    <Section title="AI Best Next Move">
      <p style={sub}>{intelligence.nextMove}</p>
    </Section>

    <Section title="Best Solver Matches">
      {matches.length ? <div style={grid}>{matches.map((match) => <MatchCard key={profileId(match.member)} match={match} />)}</div> : <p style={sub}>No member profiles available yet. Build profiles to activate solver matching.</p>}
    </Section>

    <Section title="Room Notes">
      <p style={sub}>{txt(room.notes, "No notes added.")}</p>
    </Section>

  </div></main>;
}
