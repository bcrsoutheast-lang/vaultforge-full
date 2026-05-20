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
  severity?: string;
  timePressure?: string;
  capitalPressure?: string;
  painTypes?: string[] | string;
  needs?: string[] | string;
  routingNeeds?: string[] | string;
  routeTo?: string[] | string;
  strategy?: string[] | string;
  blockers?: string[] | string;
  risks?: string[] | string;
  riskTypes?: string[] | string;
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

type MessageThread = {
  id?: string;
  subject?: string;
  lane?: string;
  state?: string;
  roomState?: string;
  status?: string;
  unread?: boolean;
  isUnread?: boolean;
  updatedAt?: string;
  createdAt?: string;
  messages?: unknown[];
  [key: string]: unknown;
};

const STATES = ["GA", "TN", "AL", "FL", "NC", "SC", "TX"];
const DEAL_KEYS = ["vaultforge_clean_deal_rooms", "vaultforge_deal_rooms", "vaultforge_rooms_deals", "vf_deal_rooms"];
const PAIN_KEYS = ["vaultforge_clean_pain_rooms_v2", "vaultforge_clean_pain_rooms_v1", "vaultforge_clean_pain_rooms", "vaultforge_pain_rooms", "vaultforge_rooms_pain", "vf_pain_rooms"];
const MESSAGE_KEYS = ["vaultforge_message_threads_v2", "vaultforge_message_command_messages", "vf_message_threads"];
const STATE_KEYS = ["vaultforge_deal_room_state_v2", "vaultforge_pain_room_state_v2", "vaultforge_clean_room_states", "vaultforge_room_states", "vaultforge_deal_room_states", "vaultforge_pain_room_states"];
const READ_KEY = "vaultforge_room_alert_read_v1";

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

function roomTitle(room: Room, kind: RoomKind) {
  return txt(room.title || room.name, kind === "deal" ? "Untitled Deal Room" : "Untitled Pain Room");
}

function loc(room: Room) {
  return [txt(room.city), txt(room.county), txt(room.state)].filter(Boolean).join(", ") || "Market not listed";
}

function keysFor(kind: RoomKind) {
  return kind === "deal" ? DEAL_KEYS : PAIN_KEYS;
}

function arr<T>(key: string): T[] {
  if (!ok()) return [];
  const parsed = j<unknown>(localStorage.getItem(key), []);
  return Array.isArray(parsed) ? (parsed as T[]) : [];
}

function stateMap() {
  const map: Record<string, RoomState> = {};
  if (!ok()) return map;
  STATE_KEYS.forEach((key) => Object.assign(map, j<Record<string, RoomState>>(localStorage.getItem(key), {})));
  return map;
}

function roomState(room: Room): RoomState {
  const state = txt(room.roomState || room.cleanupState || room.stateStatus, "active");
  return state === "saved" || state === "archived" || state === "deleted" ? state : "active";
}

function normalizeRoom(row: any, kind: RoomKind): Room {
  const id = txt(row?.id || row?.roomId || row?.painId || row?.dealId || row?.signalId);
  const photos = list(row?.photos || row?.photoUrls);
  const cover = txt(row?.coverPhoto || row?.photoUrl || row?.imageUrl || photos[0]);
  return {
    ...row,
    id,
    roomId: id,
    title: txt(row?.title || row?.name || row?.painTitle || row?.dealTitle || row?.problemTitle, kind === "deal" ? "Untitled Deal Room" : "Untitled Pain Room"),
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

function getThreads() {
  if (!ok()) return [] as MessageThread[];
  const out: MessageThread[] = [];
  const seen = new Set<string>();

  for (const key of MESSAGE_KEYS) {
    const rows = arr<any>(key);
    for (const row of rows) {
      const id = txt(row?.id || row?.threadKey || row?.thread_id || row?.message_id);
      if (!id || seen.has(id)) continue;
      seen.add(id);
      out.push({
        ...row,
        id,
        subject: txt(row?.subject || row?.title || row?.lane, "Message Thread"),
        lane: txt(row?.lane || row?.type, "general"),
        state: txt(row?.state || row?.roomState || ""),
        status: txt(row?.status, "active"),
        unread: Boolean(row?.unread || row?.isUnread),
        updatedAt: txt(row?.updatedAt || row?.createdAt),
        createdAt: txt(row?.createdAt || row?.updatedAt),
        messages: Array.isArray(row?.messages) ? row.messages : [],
      });
    }
  }

  return out.filter((thread) => thread.status !== "deleted" && thread.status !== "archived");
}

function firstPhoto(room: Room) {
  const possible = [txt(room.coverPhoto), txt(room.photoUrl), txt(room.imageUrl), ...list(room.photos), ...list(room.photoUrls)].filter(Boolean);
  return possible.find((src) => src.startsWith("data:image") || src.startsWith("http") || src.startsWith("/") || src.startsWith("blob:")) || "";
}

function activeDeals() {
  return allRooms("deal").filter((room) => roomState(room) === "active");
}

function activePains() {
  return allRooms("pain").filter((room) => roomState(room) === "active");
}

function painScore(room: Room) {
  let score = 20;
  const sev = txt(room.severity);
  if (sev === "Medium") score += 12;
  if (sev === "High") score += 28;
  if (sev === "Critical") score += 42;
  if (sev === "Emergency") score += 52;
  if (txt(room.timePressure).includes("24") || txt(room.timePressure).includes("72")) score += 20;
  if (list(room.blockers).includes("Capital")) score += 10;
  if (txt(room.capitalPressure) !== "Unknown" && txt(room.capitalPressure)) score += 7;
  return Math.max(0, Math.min(100, score));
}

function dealScore(room: Room) {
  let score = 25;
  if (txt(room.assetClass)) score += 10;
  if (txt(room.propertyType)) score += 8;
  if (list(room.routeTo).length) score += 12;
  if (list(room.strategy).length) score += 12;
  if (txt(room.city)) score += 8;
  return Math.max(0, Math.min(100, score));
}

function stateStats(state: string, deals: Room[], pains: Room[], threads: MessageThread[]) {
  const stateDeals = deals.filter((room) => txt(room.state, "GA") === state);
  const statePains = pains.filter((room) => txt(room.state, "GA") === state);
  const unreadDeals = unreadRooms("deal", stateDeals);
  const unreadPains = unreadRooms("pain", statePains);
  const stateMessages = threads.filter((thread) => txt(thread.state) === state || txt(thread.subject).includes(state));
  const unreadMessages = stateMessages.filter((thread) => thread.unread);
  const pressure = statePains.length
    ? Math.round(statePains.reduce((sum, room) => sum + painScore(room), 0) / statePains.length)
    : 0;
  const opportunity = stateDeals.length
    ? Math.round(stateDeals.reduce((sum, room) => sum + dealScore(room), 0) / stateDeals.length)
    : 0;
  const hot = unreadDeals.length + unreadPains.length + unreadMessages.length;
  return { stateDeals, statePains, unreadDeals, unreadPains, stateMessages, unreadMessages, pressure, opportunity, hot };
}

function tickerItems(deals: Room[], pains: Room[], threads: MessageThread[]) {
  const out: string[] = [];
  for (const state of STATES) {
    const s = stateStats(state, deals, pains, threads);
    if (s.pressure) out.push(`${state} PRESSURE ${s.pressure}% • ${s.statePains.length} PAIN`);
    if (s.opportunity) out.push(`${state} OPPORTUNITY ${s.opportunity}% • ${s.stateDeals.length} DEALS`);
    if (s.unreadMessages.length) out.push(`${state} MESSAGES • ${s.unreadMessages.length} UNREAD`);
  }
  return out.length ? out : ["STATE MAP LIVE • SUBMIT DEALS • SUBMIT PAIN • WATCH PRESSURE"];
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
@keyframes vfTicker {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
`;

const page: React.CSSProperties = { minHeight: "100vh", background: "#05070d", color: "#f7f7fb", padding: 18, fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" };
const wrap: React.CSSProperties = { maxWidth: 1280, margin: "0 auto", paddingBottom: 90 };
const nav: React.CSSProperties = { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 18 };
const brand: React.CSSProperties = { color: "#ffd45a", fontSize: 27, fontWeight: 950, letterSpacing: -1, marginRight: 10 };
const btn: React.CSSProperties = { border: "1px solid rgba(207,216,230,.18)", background: "#171c29", color: "#f7f7fb", borderRadius: 999, padding: "13px 18px", fontWeight: 950, textDecoration: "none", display: "inline-block", cursor: "pointer" };
const goldBtn: React.CSSProperties = { ...btn, border: 0, background: "#ffdc68", color: "#10131a" };
const redBtn: React.CSSProperties = { ...btn, background: "#271016", borderColor: "rgba(255,70,70,.48)", color: "#ffaaaa" };
const hero: React.CSSProperties = { border: "1px solid rgba(245,197,66,.28)", borderRadius: 28, padding: 30, marginBottom: 20, background: "radial-gradient(circle at top right, rgba(245,197,66,.16), transparent 32%), linear-gradient(180deg,#080d19,#050816)" };
const card: React.CSSProperties = { background: "linear-gradient(180deg,#080d19,#050816)", border: "1px solid rgba(245,197,66,.28)", borderRadius: 26, padding: 26, marginBottom: 22 };
const panel: React.CSSProperties = { background: "#121724", border: "1px solid rgba(207,216,230,.16)", borderRadius: 22, padding: 22, color: "#f7f7fb", textDecoration: "none", display: "block" };
const pulseRed: React.CSSProperties = { ...panel, borderColor: "rgba(255,70,70,.70)", animation: "vfPulseRed 2.1s ease-in-out infinite" };
const pulseGold: React.CSSProperties = { ...panel, borderColor: "rgba(255,220,104,.70)", animation: "vfPulseGold 2.3s ease-in-out infinite" };
const activePanel: React.CSSProperties = { ...panel, borderColor: "rgba(245,197,66,.75)", boxShadow: "0 0 26px rgba(245,197,66,.18)" };
const eyebrow: React.CSSProperties = { color: "#ffd45a", textTransform: "uppercase", letterSpacing: 7, fontWeight: 950, fontSize: 15, marginBottom: 12 };
const h1: React.CSSProperties = { fontSize: "clamp(44px,8vw,86px)", lineHeight: 0.9, letterSpacing: -4, margin: "0 0 18px", fontWeight: 950 };
const h2: React.CSSProperties = { fontSize: "clamp(30px,5vw,52px)", lineHeight: 0.95, letterSpacing: -2, margin: "0 0 14px", fontWeight: 950 };
const sub: React.CSSProperties = { color: "#c9d0dc", fontSize: 21, lineHeight: 1.35, margin: 0 };
const muted: React.CSSProperties = { color: "#aeb7c7", margin: "8px 0 0", lineHeight: 1.35 };
const grid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(245px,1fr))", gap: 16 };
const row: React.CSSProperties = { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" };
const tickerOuter: React.CSSProperties = { overflow: "hidden", border: "1px solid rgba(245,197,66,.28)", borderRadius: 20, background: "#090e1a", marginBottom: 18 };
const tickerInner: React.CSSProperties = { display: "inline-flex", minWidth: "200%", whiteSpace: "nowrap", animation: "vfTicker 42s linear infinite" };
const tickerItem: React.CSSProperties = { padding: "14px 28px", borderRight: "1px solid rgba(245,197,66,.18)", color: "#ffd45a", fontWeight: 950, letterSpacing: 1 };
const photoStyle: React.CSSProperties = { width: "100%", height: 140, objectFit: "cover", borderRadius: 18, border: "1px solid rgba(245,197,66,.25)", marginBottom: 12 };

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

function RoomCard({ room, kind }: { room: Room; kind: RoomKind }) {
  const href = kind === "deal" ? `/deal-rooms/${encodeURIComponent(rid(room))}` : `/pain-rooms/${encodeURIComponent(rid(room))}`;
  const img = firstPhoto(room);
  return (
    <Link href={href} style={kind === "pain" ? pulseRed : pulseGold}>
      {img ? <img src={img} alt={roomTitle(room, kind)} style={photoStyle} /> : null}
      <div style={eyebrow}>{kind === "deal" ? "Opportunity" : "Pain"}</div>
      <h2 style={h2}>{roomTitle(room, kind)}</h2>
      <p style={sub}>{loc(room)}</p>
      <p style={muted}>{kind === "deal" ? `${txt(room.assetClass, "Asset")} • ${txt(room.propertyType, "Type")}` : `${list(room.painTypes).join(", ") || "Pain"} • ${txt(room.severity, "High")}`}</p>
    </Link>
  );
}

function Nav() {
  return (
    <nav style={nav}>
      <div style={brand}>VAULTFORGE</div>
      <Link href="/command" style={btn}>Command</Link>
      <Link href="/my-rooms" style={btn}>My Rooms</Link>
      <Link href="/state-map" style={btn}>State Map</Link>
      <Link href="/members" style={btn}>Members</Link>
      <Link href="/network" style={goldBtn}>Network</Link>
      <Link href="/alerts" style={btn}>Alerts</Link>
      <Link href="/messages" style={btn}>Messages</Link>
      <Link href="/deal-create" style={btn}>Create Deal</Link>
      <Link href="/pain-intake" style={btn}>Pain Intake</Link>
      <Link href="/logout" style={redBtn}>Logout</Link>
    </nav>
  );
}

export default function NetworkPage() {
  const [tick, setTick] = useState(0);
  const [openDealState, setOpenDealState] = useState("");
  const [openPainState, setOpenPainState] = useState("");

  useEffect(() => {
    const refresh = () => setTick((x) => x + 1);
    ["storage", "vaultforge-deal-change", "vaultforge-pain-change", "vaultforge-room-state-change", "vaultforge-room-read-change", "vaultforge-messages-change", "vaultforge-alert-change"].forEach((event) => window.addEventListener(event, refresh));
    return () => ["storage", "vaultforge-deal-change", "vaultforge-pain-change", "vaultforge-room-state-change", "vaultforge-room-read-change", "vaultforge-messages-change", "vaultforge-alert-change"].forEach((event) => window.removeEventListener(event, refresh));
  }, []);

  const deals = useMemo(() => activeDeals(), [tick]);
  const pains = useMemo(() => activePains(), [tick]);
  const threads = useMemo(() => getThreads(), [tick]);

  return (
    <main style={page}>
      <style>{styleTag}</style>
      <div style={wrap}>
        <Nav />

        <section style={hero}>
          <div style={eyebrow}>Network</div>
          <h1 style={h1}>State project network.</h1>
          <p style={sub}>Opportunity and Pain remain separate. Use State Map for combined pressure intelligence.</p>
          <div style={{ ...row, marginTop: 18 }}>
            <Link href="/state-map" style={goldBtn}>Open State Pressure Map</Link>
          </div>
        </section>

        <Section title="Opportunity State Cards">
          <div style={grid}>
            {STATES.map((state) => {
              const s = stateStats(state, deals, pains, threads);
              const isOpen = openDealState === state;
              return (
                <button key={state} type="button" onClick={() => { setOpenDealState(isOpen ? "" : state); setOpenPainState(""); }} style={isOpen || s.unreadDeals.length ? pulseGold : panel}>
                  <div style={eyebrow}>{state}</div>
                  <h2 style={h2}>{s.stateDeals.length}</h2>
                  <p style={muted}>Opportunity cards • unread {s.unreadDeals.length}</p>
                  <p style={muted}>Opportunity score {s.opportunity}%</p>
                </button>
              );
            })}
          </div>
        </Section>

        {openDealState ? (
          <Section title={`${openDealState} Opportunity Cards`}>
            {deals.filter((room) => txt(room.state, "GA") === openDealState).length ? (
              <div style={grid}>{deals.filter((room) => txt(room.state, "GA") === openDealState).map((room) => <RoomCard key={rid(room)} room={room} kind="deal" />)}</div>
            ) : <p style={sub}>No active opportunity cards in {openDealState}.</p>}
          </Section>
        ) : null}

        <Section title="Pain State Cards">
          <div style={grid}>
            {STATES.map((state) => {
              const s = stateStats(state, deals, pains, threads);
              const isOpen = openPainState === state;
              return (
                <button key={state} type="button" onClick={() => { setOpenPainState(isOpen ? "" : state); setOpenDealState(""); }} style={isOpen || s.unreadPains.length ? pulseRed : panel}>
                  <div style={eyebrow}>{state}</div>
                  <h2 style={h2}>{s.statePains.length}</h2>
                  <p style={muted}>Pain cards • unread {s.unreadPains.length}</p>
                  <p style={muted}>Pressure score {s.pressure}%</p>
                </button>
              );
            })}
          </div>
        </Section>

        {openPainState ? (
          <Section title={`${openPainState} Pain Cards`}>
            {pains.filter((room) => txt(room.state, "GA") === openPainState).length ? (
              <div style={grid}>{pains.filter((room) => txt(room.state, "GA") === openPainState).map((room) => <RoomCard key={rid(room)} room={room} kind="pain" />)}</div>
            ) : <p style={sub}>No active pain cards in {openPainState}.</p>}
          </Section>
        ) : null}
      </div>
    </main>
  );
}
