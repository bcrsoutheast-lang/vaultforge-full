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
  assetClass?: string;
  propertyType?: string;
  askingPrice?: string;
  propertyValue?: string;
  repairs?: string;
  routeTo?: string[] | string;
  routingNeeds?: string[] | string;
  painTypes?: string[] | string;
  strategy?: string[] | string;
  severity?: string;
  timePressure?: string;
  capitalPressure?: string;
  roomState?: RoomState;
  cleanupState?: RoomState;
  stateStatus?: RoomState;
  alertRead?: boolean;
  viewedAt?: string;
  coverPhoto?: string;
  photoUrl?: string;
  imageUrl?: string;
  photos?: string[];
  photoUrls?: string[];
  createdAt?: string;
  updatedAt?: string;
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

const STATES = ["GA", "TN", "AL", "FL", "NC", "SC", "TX"];

const DEAL_KEYS = ["vaultforge_clean_deal_rooms", "vaultforge_deal_rooms", "vaultforge_rooms_deals", "vf_deal_rooms"];
const PAIN_KEYS = ["vaultforge_clean_pain_rooms_v1", "vaultforge_clean_pain_rooms", "vaultforge_pain_rooms", "vaultforge_rooms_pain", "vf_pain_rooms"];
const STATE_KEYS = ["vaultforge_clean_room_states", "vaultforge_room_states", "vaultforge_deal_room_states", "vaultforge_pain_room_states", "vaultforge_5s_room_states"];
const READ_KEY = "vaultforge_room_alert_read_v1";
const PROFILE_KEYS = ["vaultforge_profile", "vaultforge_member_profile", "vaultforge_clean_profile"];
const MEMBER_DIRECTORY_KEY = "vaultforge_member_directory_v1";
const SAVED_PROFILES_KEY = "vaultforge_saved_member_profiles_v1";

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
  return out
    .map((room) => {
      const id = rid(room);
      const state = states[id] || states[`${kind}:${id}`] || roomState(room);
      return { ...room, roomState: state, cleanupState: state, stateStatus: state };
    })
    .sort((a, b) => String(b.createdAt || b.updatedAt || "").localeCompare(String(a.createdAt || a.updatedAt || "")));
}

function readMap() {
  return ok() ? j<Record<string, string>>(localStorage.getItem(READ_KEY), {}) : {};
}

function unreadRooms(kind: RoomKind, rooms: Room[]) {
  const reads = readMap();
  return rooms.filter((room) => {
    const id = rid(room);
    if (roomState(room) !== "active") return false;
    return !room.alertRead && !room.viewedAt && !reads[id] && !reads[`${kind}:${id}`];
  });
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

function savedIds() {
  if (!ok()) return [];
  return j<string[]>(localStorage.getItem(SAVED_PROFILES_KEY), []);
}

function saveSavedIds(ids: string[]) {
  if (!ok()) return;
  localStorage.setItem(SAVED_PROFILES_KEY, JSON.stringify(Array.from(new Set(ids))));
  window.dispatchEvent(new Event("vaultforge-saved-profiles-change"));
}

function membersBasedInState(state: string, members: MemberProfile[]) {
  return members.filter((member) => txt(member.basedState, "GA") === state);
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
    score += 30;
    reasons.push("state fit");
  }

  if (overlap(member.assetClasses, [txt(room.assetClass)])) {
    score += 20;
    reasons.push("asset fit");
  }

  if (kind === "deal") {
    if (overlap(member.strategies, room.strategy)) {
      score += 20;
      reasons.push("strategy fit");
    }
    if (overlap(member.canProvide, room.routeTo)) {
      score += 25;
      reasons.push("route fit");
    }
  } else {
    if (overlap(member.canProvide, room.routingNeeds)) {
      score += 30;
      reasons.push("solver fit");
    }
    if (overlap(member.specialties, room.painTypes)) {
      score += 25;
      reasons.push("pain specialty");
    }
  }

  return { member, score: Math.max(0, Math.min(100, score)), reasons };
}

function bestMatchForRoom(room: Room, kind: RoomKind, members: MemberProfile[]) {
  const matches = members
    .map((member) => scoreMemberForRoom(member, room, kind))
    .filter((match) => match.score > 0)
    .sort((a, b) => b.score - a.score);

  return matches[0] || null;
}

function matchCountForRooms(rooms: Room[], kind: RoomKind, members: MemberProfile[]) {
  return rooms.filter((room) => Boolean(bestMatchForRoom(room, kind, members))).length;
}

const page: React.CSSProperties = { minHeight: "100vh", background: "#05070d", color: "#f7f7fb", padding: 18, fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" };
const wrap: React.CSSProperties = { maxWidth: 1280, margin: "0 auto", paddingBottom: 90 };
const nav: React.CSSProperties = { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 18 };
const brand: React.CSSProperties = { color: "#ffd45a", fontSize: 27, fontWeight: 950, letterSpacing: -1, marginRight: 10 };
const btn: React.CSSProperties = { border: "1px solid rgba(207,216,230,.18)", background: "#171c29", color: "#f7f7fb", borderRadius: 999, padding: "13px 18px", fontWeight: 950, textDecoration: "none", display: "inline-block", cursor: "pointer" };
const goldBtn: React.CSSProperties = { ...btn, border: 0, background: "#ffdc68", color: "#10131a" };
const redBtn: React.CSSProperties = { ...btn, background: "#271016", borderColor: "rgba(255,70,70,.48)", color: "#ffaaaa" };
const hero: React.CSSProperties = { border: "1px solid rgba(245,197,66,.28)", borderRadius: 28, padding: 30, marginBottom: 20, background: "radial-gradient(circle at top right, rgba(245,197,66,.16), transparent 32%), linear-gradient(180deg,#080d19,#050816)" };
const card: React.CSSProperties = { background: "linear-gradient(180deg,#080d19,#050816)", border: "1px solid rgba(245,197,66,.28)", borderRadius: 26, padding: 26, marginBottom: 22 };
const panel: React.CSSProperties = { background: "#121724", border: "1px solid rgba(207,216,230,.16)", borderRadius: 22, padding: 22 };
const activePanel: React.CSSProperties = { ...panel, borderColor: "rgba(255,70,70,.70)", boxShadow: "0 0 26px rgba(255,50,70,.22)" };
const eyebrow: React.CSSProperties = { color: "#ffd45a", textTransform: "uppercase", letterSpacing: 7, fontWeight: 950, fontSize: 15, marginBottom: 12 };
const h1: React.CSSProperties = { fontSize: "clamp(44px,8vw,86px)", lineHeight: 0.9, letterSpacing: -4, margin: "0 0 18px", fontWeight: 950 };
const h2: React.CSSProperties = { fontSize: "clamp(30px,5vw,52px)", lineHeight: 0.95, letterSpacing: -2, margin: "0 0 14px", fontWeight: 950 };
const sub: React.CSSProperties = { color: "#c9d0dc", fontSize: 21, lineHeight: 1.35, margin: 0 };
const muted: React.CSSProperties = { color: "#aeb7c7", margin: "8px 0 0", lineHeight: 1.35 };
const grid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(245px,1fr))", gap: 16 };
const row: React.CSSProperties = { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" };
const photoStyle: React.CSSProperties = { width: "100%", height: 170, objectFit: "cover", borderRadius: 18, border: "1px solid rgba(245,197,66,.25)", marginBottom: 12 };

function Nav({ active }: { active: string }) {
  const item = (href: string, label: string, key: string) => (
    <Link href={href} style={active === key ? goldBtn : btn}>{label}</Link>
  );

  return (
    <nav style={nav}>
      <div style={brand}>VAULTFORGE</div>
      {item("/command", "Command", "command")}
      {item("/members", "Members", "members")}
      {item("/network", "Network", "network")}
      {item("/deal-rooms", "Deal Rooms", "deals")}
      {item("/pain-rooms", "Pain Rooms", "pain")}
      {item("/deal-create", "Create Deal", "deal-create")}
      {item("/pain-intake", "Pain Intake", "pain-intake")}
      {item("/messages", "Messages", "messages")}
      {item("/profile", "Profile", "profile")}
      <Link href="/logout" style={redBtn}>Logout</Link>
    </nav>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section style={card}><div style={eyebrow}>{title}</div>{children}</section>;
}

function RoomCard({ room, kind, members }: { room: Room; kind: RoomKind; members: MemberProfile[] }) {
  const img = firstPhoto(room);
  const href = kind === "deal" ? `/deal-rooms/${encodeURIComponent(rid(room))}` : `/pain-rooms/${encodeURIComponent(rid(room))}`;
  const unread = unreadRooms(kind, [room]).length > 0;
  const match = bestMatchForRoom(room, kind, members);

  return (
    <div style={unread ? activePanel : panel}>
      {img ? <img src={img} alt={titleFor(room, kind)} style={photoStyle} /> : null}
      <div style={eyebrow}>{kind === "deal" ? "Opportunity" : "Pain"} • {roomState(room)}</div>
      <h2 style={h2}>{titleFor(room, kind)}</h2>
      <p style={sub}>{loc(room)}</p>
      <p style={muted}>
        {kind === "deal"
          ? `${txt(room.assetClass, "Asset")} • ${txt(room.propertyType, "Type")} • Route: ${list(room.routeTo).join(", ") || "Buyer"}`
          : `${list(room.painTypes).join(", ") || "Problem"} • Needs: ${list(room.routingNeeds).join(", ") || "Solver"} • Severity: ${txt(room.severity, "N/A")}`}
      </p>
      <p style={muted}>
        {kind === "deal"
          ? `Ask ${txt(room.askingPrice, "N/A")} • Value ${txt(room.propertyValue, "N/A")} • Repairs ${txt(room.repairs, "N/A")}`
          : `Time ${txt(room.timePressure, "N/A")} • Capital ${txt(room.capitalPressure, "N/A")}`}
      </p>
      <p style={muted}>
        Best fit: {match ? `${txt(match.member.name, "Member")} • ${match.score}% • ${match.reasons.join(", ")}` : "No profile match yet"}
      </p>
      <div style={{ ...row, marginTop: 16 }}>
        <Link href={href} style={goldBtn}>Open</Link>
        <Link href={`/messages?type=${kind}&room=${encodeURIComponent(rid(room))}`} style={btn}>Messages</Link>
        {match ? <Link href={`/messages?to=${encodeURIComponent(txt(match.member.email, profileId(match.member)))}&subject=${encodeURIComponent("Network Match: " + titleFor(room, kind))}`} style={btn}>Contact Fit</Link> : null}
      </div>
    </div>
  );
}

function MemberCard({ member, saved, onSave, onUnsave }: { member: MemberProfile; saved: boolean; onSave: () => void; onUnsave: () => void }) {
  return (
    <div style={saved ? activePanel : panel}>
      {txt(member.profilePhoto) ? <img src={txt(member.profilePhoto)} alt={txt(member.name, "Member")} style={photoStyle} /> : null}
      <div style={eyebrow}>{txt(member.memberType, "Member")} • From {txt(member.basedState, "N/A")}</div>
      <h2 style={h2}>{txt(member.name, "VaultForge Member")}</h2>
      <p style={sub}>{txt(member.company, "Company not listed")}</p>
      <p style={muted}>Profile state: {[txt(member.basedCity), txt(member.basedCounty), txt(member.basedState)].filter(Boolean).join(", ") || "Not listed"}</p>
      <p style={muted}>Operates in: {list(member.statesOperated).join(", ") || "No operating states selected"}</p>
      <p style={muted}>Can provide: {list(member.canProvide).join(", ") || "Not listed"}</p>
      <p style={muted}>Needs: {list(member.needs).join(", ") || "Not listed"}</p>
      <p style={muted}>Capital: {txt(member.capitalPosition, "Unknown")} • {txt(member.fundingRange, "Unknown")}</p>
      <div style={{ ...row, marginTop: 18 }}>
        <Link href={`/messages?to=${encodeURIComponent(txt(member.email, profileId(member)))}&subject=${encodeURIComponent("Network Contact: " + txt(member.name, "VaultForge Member"))}`} style={goldBtn}>Contact</Link>
        {saved ? <button type="button" style={redBtn} onClick={onUnsave}>Unsave Profile</button> : <button type="button" style={btn} onClick={onSave}>Save Profile</button>}
      </div>
    </div>
  );
}


export default function NetworkPage() {
  const [tick, setTick] = useState(0);
  const [openState, setOpenState] = useState("");

  useEffect(() => {
    const refresh = () => setTick((x) => x + 1);
    window.addEventListener("storage", refresh);
    window.addEventListener("vaultforge-room-state-change", refresh);
    window.addEventListener("vaultforge-room-read-change", refresh);
    window.addEventListener("vaultforge-deal-change", refresh);
    window.addEventListener("vaultforge-pain-change", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("vaultforge-room-state-change", refresh);
      window.removeEventListener("vaultforge-room-read-change", refresh);
      window.removeEventListener("vaultforge-deal-change", refresh);
      window.removeEventListener("vaultforge-pain-change", refresh);
    };
  }, []);

  const deals = useMemo(() => allRooms("deal").filter((room) => roomState(room) === "active"), [tick]);
  const pains = useMemo(() => allRooms("pain").filter((room) => roomState(room) === "active"), [tick]);
  const members = useMemo(() => getDirectory(), [tick]);

  const openDeals = openState ? deals.filter((room) => txt(room.state, "GA") === openState) : [];
  const openPains = openState ? pains.filter((room) => txt(room.state, "GA") === openState) : [];

  return (
    <main style={page}>
      <div style={wrap}>
        <Nav active="network" />

        <section style={hero}>
          <div style={eyebrow}>Network</div>
          <h1 style={h1}>State project network.</h1>
          <p style={sub}>Click a state card to open its Opportunity cards and Pain cards. Nothing shows until you choose a state.</p>
        </section>

        <Section title="Project State Cards">
          <div style={grid}>
            {STATES.map((state) => {
              const stateDeals = deals.filter((room) => txt(room.state, "GA") === state);
              const statePains = pains.filter((room) => txt(room.state, "GA") === state);
              const unreadDeals = unreadRooms("deal", stateDeals).length;
              const unreadPains = unreadRooms("pain", statePains).length;
              const dealMatches = matchCountForRooms(stateDeals, "deal", members);
              const painMatches = matchCountForRooms(statePains, "pain", members);
              const hasPulse = unreadDeals + unreadPains > 0;
              const isOpen = openState === state;

              return (
                <button
                  key={state}
                  type="button"
                  onClick={() => setOpenState(isOpen ? "" : state)}
                  style={isOpen || hasPulse ? activePanel : panel}
                >
                  <div style={eyebrow}>{state}</div>
                  <h2 style={h2}>{stateDeals.length + statePains.length}</h2>
                  <p style={muted}>Opportunities: {stateDeals.length} • unread {unreadDeals} • matches {dealMatches}</p>
                  <p style={muted}>Pain: {statePains.length} • unread {unreadPains} • matches {painMatches}</p>
                  <p style={muted}>{isOpen ? "Click to collapse" : "Click to open"}</p>
                </button>
              );
            })}
          </div>
        </Section>

        {openState ? (
          <>
            <Section title={`${openState} Opportunity Cards`}>
              {openDeals.length ? (
                <div style={grid}>{openDeals.map((room) => <RoomCard key={rid(room)} room={room} kind="deal" members={members} />)}</div>
              ) : (
                <p style={sub}>No active opportunity cards in {openState}.</p>
              )}
            </Section>

            <Section title={`${openState} Pain Cards`}>
              {openPains.length ? (
                <div style={grid}>{openPains.map((room) => <RoomCard key={rid(room)} room={room} kind="pain" members={members} />)}</div>
              ) : (
                <p style={sub}>No active pain cards in {openState}.</p>
              )}
            </Section>
          </>
        ) : null}
      </div>
    </main>
  );
}
