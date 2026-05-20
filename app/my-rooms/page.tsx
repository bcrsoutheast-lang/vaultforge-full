"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type RoomKind = "deal" | "pain";
type RoomStatus = "active" | "saved" | "archived" | "deleted" | "sold" | "resolved";

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
  roomState?: string;
  cleanupState?: string;
  stateStatus?: string;
  memberRoomStatus?: RoomStatus;
  ownerEmail?: string;
  memberEmail?: string;
  createdBy?: string;
  createdByEmail?: string;
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

type ViewKey =
  | "activeDeals"
  | "activePain"
  | "savedDeals"
  | "savedPain"
  | "archived"
  | "sold"
  | "resolved"
  | "deleted";

const DEAL_KEYS = ["vaultforge_clean_deal_rooms", "vaultforge_deal_rooms", "vaultforge_rooms_deals", "vf_deal_rooms"];
const PAIN_KEYS = ["vaultforge_clean_pain_rooms_v2", "vaultforge_clean_pain_rooms_v1", "vaultforge_clean_pain_rooms", "vaultforge_pain_rooms", "vaultforge_rooms_pain", "vf_pain_rooms"];
const STATE_KEYS = ["vaultforge_deal_room_state_v2", "vaultforge_pain_room_state_v2", "vaultforge_clean_room_states", "vaultforge_room_states", "vaultforge_deal_room_states", "vaultforge_pain_room_states"];
const MEMBER_STATE_KEY = "vaultforge_my_room_status_v1";
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

function arr<T>(key: string): T[] {
  if (!ok()) return [];
  const parsed = j<unknown>(localStorage.getItem(key), []);
  return Array.isArray(parsed) ? (parsed as T[]) : [];
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

function firstPhoto(room: Room) {
  const possible = [txt(room.coverPhoto), txt(room.photoUrl), txt(room.imageUrl), ...list(room.photos), ...list(room.photoUrls)].filter(Boolean);
  return possible.find((src) => src.startsWith("data:image") || src.startsWith("http") || src.startsWith("/") || src.startsWith("blob:")) || "";
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

function rawStatus(room: Room): RoomStatus {
  const state = txt(room.memberRoomStatus || room.roomState || room.cleanupState || room.stateStatus, "active");
  if (state === "saved" || state === "archived" || state === "deleted" || state === "sold" || state === "resolved") return state;
  return "active";
}

function stateMap() {
  const map: Record<string, RoomStatus> = {};
  if (!ok()) return map;
  STATE_KEYS.forEach((key) => Object.assign(map, j<Record<string, RoomStatus>>(localStorage.getItem(key), {})));
  Object.assign(map, j<Record<string, RoomStatus>>(localStorage.getItem(MEMBER_STATE_KEY), {}));
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

  return out
    .map((room) => {
      const id = rid(room);
      const status = states[id] || states[`${kind}:${id}`] || rawStatus(room);
      return { ...room, memberRoomStatus: status, roomState: status, cleanupState: status, stateStatus: status };
    })
    .sort((a, b) => String(b.createdAt || b.updatedAt || "").localeCompare(String(a.createdAt || a.updatedAt || "")));
}

function readMap() {
  return ok() ? j<Record<string, string>>(localStorage.getItem(READ_KEY), {}) : {};
}

function unread(kind: RoomKind, room: Room) {
  const reads = readMap();
  const id = rid(room);
  return !room.alertRead && !room.viewedAt && !reads[id] && !reads[`${kind}:${id}`];
}

function saveRoomStatus(kind: RoomKind, room: Room, status: RoomStatus) {
  if (!ok()) return;

  const id = rid(room);
  if (!id) return;

  const states = stateMap();
  states[id] = status;
  states[`${kind}:${id}`] = status;
  writeJson(MEMBER_STATE_KEY, states);

  const next = {
    ...room,
    memberRoomStatus: status,
    roomState: status,
    cleanupState: status,
    stateStatus: status,
    updatedAt: new Date().toISOString(),
  };

  const directKey = kind === "deal" ? `vaultforge_deal_room_${id}` : `vaultforge_pain_room_${id}`;
  writeJson(directKey, next);

  for (const key of keysFor(kind)) {
    const rows = allRooms(kind).filter((item) => rid(item) !== id);
    writeJson(key, [next, ...rows]);
  }

  window.dispatchEvent(new Event("vaultforge-room-state-change"));
  window.dispatchEvent(new Event("vaultforge-my-rooms-change"));
  window.dispatchEvent(new Event(kind === "deal" ? "vaultforge-deal-change" : "vaultforge-pain-change"));
}


function num(value: unknown) {
  const parsed = Number(String(value || "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function daysOld(room: Room) {
  const date = txt(room.updatedAt || room.createdAt);
  if (!date) return 0;
  const time = new Date(date).getTime();
  if (!Number.isFinite(time)) return 0;
  return Math.max(0, Math.floor((Date.now() - time) / 86400000));
}

function roomHealth(kind: RoomKind, room: Room) {
  const status = rawStatus(room);
  const age = daysOld(room);
  let score = 70;
  let label = "Healthy";
  let next = "Keep monitoring and move the room through the execution path.";
  let warning = "";

  if (status === "sold") {
    return {
      score: 100,
      label: "Sold",
      warning: "Completed deal room.",
      next: "Keep as performance history. Later this can feed close-rate and member trust scores.",
      attention: false,
    };
  }

  if (status === "resolved") {
    return {
      score: 100,
      label: "Resolved",
      warning: "Problem handled.",
      next: "Keep as resolution history. Later this can feed solver performance and routing intelligence.",
      attention: false,
    };
  }

  if (status === "deleted") {
    return {
      score: 10,
      label: "Deleted",
      warning: "Hidden from active workspace.",
      next: "Restore active only if this room needs work again.",
      attention: false,
    };
  }

  if (status === "archived") {
    return {
      score: 45,
      label: "Archived",
      warning: "Not active right now.",
      next: "Restore active if execution resumes, or leave archived for records.",
      attention: false,
    };
  }

  if (status === "saved") score += 8;

  if (kind === "deal") {
    const ask = num(room.askingPrice || room.askPrice);
    const value = num(room.propertyValue || room.value);
    const repairs = num(room.repairs);
    const spread = value && ask ? value - ask - repairs : 0;
    const hasPhotos = list(room.photos || room.photoUrls).length > 0 || firstPhoto(room);

    if (!ask || !value) {
      score -= 18;
      warning = "Missing deal numbers.";
      next = "Add ask price, value/ARV, repairs, control status, and proof before routing hard.";
    }

    if (spread > 25000) score += 8;
    if (spread > 75000) score += 12;
    if (spread <= 0 && ask && value) {
      score -= 15;
      warning = "Weak or unclear spread.";
      next = "Verify numbers before sending this to buyers or capital.";
    }

    if (!hasPhotos) {
      score -= 8;
      if (!warning) warning = "No room photos.";
    }

    if (age >= 7 && status === "active") {
      score -= 12;
      warning = "Stale active deal.";
      next = "Update status, message a fit, archive it, or mark sold if done.";
    }

    if (score >= 85) label = "High Momentum";
    else if (score >= 65) label = "Working";
    else if (score >= 45) label = "Needs Proof";
    else label = "Needs Attention";
  } else {
    let severity = 35;
    const sev = txt(room.severity);
    if (sev === "Medium") severity = 50;
    if (sev === "High") severity = 70;
    if (sev === "Critical") severity = 88;
    if (sev === "Emergency") severity = 96;
    if (txt(room.timePressure).includes("24") || txt(room.timePressure).includes("72")) severity += 8;
    severity = Math.min(100, severity);

    score = 100 - Math.round(severity * 0.45);

    if (severity >= 85) {
      warning = "Critical pressure.";
      next = "Message or route this to a solver now. Do not let it sit in active.";
    } else if (severity >= 70) {
      warning = "High pressure.";
      next = "Confirm blocker, money needed, deadline, and route to a fit.";
    }

    if (age >= 3 && status === "active" && severity >= 70) {
      score -= 12;
      warning = "High pressure and stale.";
      next = "Update, route, message, resolve, or archive. This needs action.";
    }

    if (list(room.blockers).length === 0 && list(room.painTypes).length === 0) {
      score -= 10;
      if (!warning) warning = "Missing problem classification.";
      next = "Add pain type, blockers, risk, deadline, and next required solver.";
    }

    if (score >= 75) label = "Controlled";
    else if (score >= 55) label = "Active Pressure";
    else if (score >= 35) label = "Needs Solver";
    else label = "Needs Attention";
  }

  score = Math.max(0, Math.min(100, score));
  const attention = status === "active" && (score < 55 || Boolean(warning));

  return {
    score,
    label,
    warning: warning || "No urgent warning.",
    next,
    attention,
  };
}

function healthColor(score: number) {
  if (score >= 75) return "#ffdc68";
  if (score >= 50) return "#f5a742";
  return "#ff4b5c";
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
const wrap: React.CSSProperties = { maxWidth: 1280, margin: "0 auto", paddingBottom: 90 };
const nav: React.CSSProperties = { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 18 };
const brand: React.CSSProperties = { color: "#ffd45a", fontSize: 27, fontWeight: 950, letterSpacing: -1, marginRight: 10 };
const btn: React.CSSProperties = { border: "1px solid rgba(207,216,230,.18)", background: "#171c29", color: "#f7f7fb", borderRadius: 999, padding: "13px 18px", fontWeight: 950, textDecoration: "none", display: "inline-block", cursor: "pointer" };
const goldBtn: React.CSSProperties = { ...btn, border: 0, background: "#ffdc68", color: "#10131a" };
const redBtn: React.CSSProperties = { ...btn, background: "#271016", borderColor: "rgba(255,70,70,.48)", color: "#ffaaaa" };
const hero: React.CSSProperties = { border: "1px solid rgba(245,197,66,.28)", borderRadius: 28, padding: 30, marginBottom: 20, background: "radial-gradient(circle at top right, rgba(245,197,66,.16), transparent 32%), linear-gradient(180deg,#080d19,#050816)" };
const card: React.CSSProperties = { background: "linear-gradient(180deg,#080d19,#050816)", border: "1px solid rgba(245,197,66,.28)", borderRadius: 26, padding: 26, marginBottom: 22 };
const panel: React.CSSProperties = { background: "#121724", border: "1px solid rgba(207,216,230,.16)", borderRadius: 22, padding: 22, color: "#f7f7fb", textDecoration: "none", display: "block" };
const activePanel: React.CSSProperties = { ...panel, borderColor: "rgba(245,197,66,.75)", boxShadow: "0 0 26px rgba(245,197,66,.18)" };
const pulseRed: React.CSSProperties = { ...panel, borderColor: "rgba(255,70,70,.70)", animation: "vfPulseRed 2.1s ease-in-out infinite" };
const pulseGold: React.CSSProperties = { ...panel, borderColor: "rgba(255,220,104,.70)", animation: "vfPulseGold 2.3s ease-in-out infinite" };
const eyebrow: React.CSSProperties = { color: "#ffd45a", textTransform: "uppercase", letterSpacing: 7, fontWeight: 950, fontSize: 15, marginBottom: 12 };
const h1: React.CSSProperties = { fontSize: "clamp(44px,8vw,86px)", lineHeight: 0.9, letterSpacing: -4, margin: "0 0 18px", fontWeight: 950 };
const h2: React.CSSProperties = { fontSize: "clamp(30px,5vw,52px)", lineHeight: 0.95, letterSpacing: -2, margin: "0 0 14px", fontWeight: 950 };
const sub: React.CSSProperties = { color: "#c9d0dc", fontSize: 21, lineHeight: 1.35, margin: 0 };
const muted: React.CSSProperties = { color: "#aeb7c7", margin: "8px 0 0", lineHeight: 1.35 };
const grid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(245px,1fr))", gap: 16 };
const row: React.CSSProperties = { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" };
const imgStyle: React.CSSProperties = { width: "100%", height: 150, objectFit: "cover", borderRadius: 18, border: "1px solid rgba(245,197,66,.25)", marginBottom: 12 };

function Nav() {
  return (
    <nav style={nav}>
      <div style={brand}>VAULTFORGE</div>
      <Link href="/command" style={btn}>Command</Link>
      <Link href="/my-rooms" style={goldBtn}>My Rooms</Link>
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

function countFor(view: ViewKey, deals: Room[], pains: Room[]) {
  if (view === "activeDeals") return deals.filter((room) => rawStatus(room) === "active").length;
  if (view === "activePain") return pains.filter((room) => rawStatus(room) === "active").length;
  if (view === "savedDeals") return deals.filter((room) => rawStatus(room) === "saved").length;
  if (view === "savedPain") return pains.filter((room) => rawStatus(room) === "saved").length;
  if (view === "archived") return [...deals, ...pains].filter((room) => rawStatus(room) === "archived").length;
  if (view === "sold") return deals.filter((room) => rawStatus(room) === "sold").length;
  if (view === "resolved") return pains.filter((room) => rawStatus(room) === "resolved").length;
  if (view === "deleted") return [...deals, ...pains].filter((room) => rawStatus(room) === "deleted").length;
  return 0;
}


function attentionCount(deals: Room[], pains: Room[]) {
  return [
    ...deals.map((room) => ({ kind: "deal" as RoomKind, room })),
    ...pains.map((room) => ({ kind: "pain" as RoomKind, room })),
  ].filter((item) => roomHealth(item.kind, item.room).attention).length;
}

function roomsFor(view: ViewKey, deals: Room[], pains: Room[]) {
  if (view === "activeDeals") return deals.filter((room) => rawStatus(room) === "active").map((room) => ({ kind: "deal" as RoomKind, room }));
  if (view === "activePain") return pains.filter((room) => rawStatus(room) === "active").map((room) => ({ kind: "pain" as RoomKind, room }));
  if (view === "savedDeals") return deals.filter((room) => rawStatus(room) === "saved").map((room) => ({ kind: "deal" as RoomKind, room }));
  if (view === "savedPain") return pains.filter((room) => rawStatus(room) === "saved").map((room) => ({ kind: "pain" as RoomKind, room }));
  if (view === "archived") return [...deals.map((room) => ({ kind: "deal" as RoomKind, room })), ...pains.map((room) => ({ kind: "pain" as RoomKind, room }))].filter((item) => rawStatus(item.room) === "archived");
  if (view === "sold") return deals.filter((room) => rawStatus(room) === "sold").map((room) => ({ kind: "deal" as RoomKind, room }));
  if (view === "resolved") return pains.filter((room) => rawStatus(room) === "resolved").map((room) => ({ kind: "pain" as RoomKind, room }));
  if (view === "deleted") return [...deals.map((room) => ({ kind: "deal" as RoomKind, room })), ...pains.map((room) => ({ kind: "pain" as RoomKind, room }))].filter((item) => rawStatus(item.room) === "deleted");
  return [];
}

function ViewCard({ view, title, note, count, active, onClick }: { view: ViewKey; title: string; note: string; count: number; active: boolean; onClick: () => void }) {
  const style = active ? activePanel : count ? (view.includes("Pain") || view === "resolved" ? pulseRed : pulseGold) : panel;

  return (
    <button type="button" style={{ ...style, textAlign: "left", cursor: "pointer" }} onClick={onClick}>
      <div style={eyebrow}>{title}</div>
      <h2 style={h2}>{count}</h2>
      <p style={muted}>{note}</p>
    </button>
  );
}

function RoomCard({ kind, room, refresh }: { kind: RoomKind; room: Room; refresh: () => void }) {
  const id = rid(room);
  const status = rawStatus(room);
  const img = firstPhoto(room);
  const href = kind === "deal" ? `/deal-rooms/${encodeURIComponent(id)}` : `/pain-rooms/${encodeURIComponent(id)}`;
  const hot = unread(kind, room);
  const health = roomHealth(kind, room);
  const style = health.attention ? (kind === "pain" ? pulseRed : pulseGold) : hot ? (kind === "pain" ? pulseRed : pulseGold) : panel;

  return (
    <div style={style}>
      {img ? <img src={img} alt={roomTitle(room, kind)} style={imgStyle} /> : null}
      <div style={eyebrow}>{kind === "deal" ? "Deal Room" : "Pain Room"} • {status}</div>
      <h2 style={h2}>{roomTitle(room, kind)}</h2>
      <p style={sub}>{loc(room)}</p>
      <p style={muted}>
        {kind === "deal"
          ? `${txt(room.assetClass, "Asset")} • ${txt(room.propertyType, "Type")} • ${list(room.strategy).join(", ") || "Strategy open"}`
          : `${list(room.painTypes).join(", ") || "Pain"} • ${txt(room.severity, "High")} • ${txt(room.timePressure, "Timeline open")}`}
      </p>

      <div style={{ marginTop: 16 }}>
        <div style={eyebrow}>{kind === "deal" ? "Deal Momentum" : "Pain Health"} • {health.label}</div>
        <div style={{ height: 11, background: "#070a12", borderRadius: 999, overflow: "hidden", border: "1px solid rgba(207,216,230,.12)" }}>
          <div style={{ width: `${health.score}%`, height: "100%", background: healthColor(health.score) }} />
        </div>
        <p style={health.attention ? { ...muted, color: "#ffb8b8" } : muted}>{health.warning}</p>
        <p style={muted}>{health.next}</p>
      </div>

      <div style={{ ...row, marginTop: 16 }}>
        <Link href={href} style={goldBtn}>Open</Link>
        <Link href={`/messages?type=${kind}&room=${encodeURIComponent(id)}&subject=${encodeURIComponent((kind === "deal" ? "Deal Room: " : "Pain Room: ") + roomTitle(room, kind))}`} style={btn}>Message</Link>

        {status !== "saved" ? <button type="button" style={btn} onClick={() => { saveRoomStatus(kind, room, "saved"); refresh(); }}>Save</button> : null}
        {status !== "archived" ? <button type="button" style={btn} onClick={() => { saveRoomStatus(kind, room, "archived"); refresh(); }}>Archive</button> : null}
        {kind === "deal" && status !== "sold" ? <button type="button" style={goldBtn} onClick={() => { saveRoomStatus(kind, room, "sold"); refresh(); }}>Mark Sold</button> : null}
        {kind === "pain" && status !== "resolved" ? <button type="button" style={goldBtn} onClick={() => { saveRoomStatus(kind, room, "resolved"); refresh(); }}>Mark Resolved</button> : null}
        {status !== "deleted" ? <button type="button" style={redBtn} onClick={() => { saveRoomStatus(kind, room, "deleted"); refresh(); }}>Delete</button> : null}
        {status !== "active" ? <button type="button" style={btn} onClick={() => { saveRoomStatus(kind, room, "active"); refresh(); }}>Restore Active</button> : null}
      </div>
    </div>
  );
}

export default function MyRoomsPage() {
  const [tick, setTick] = useState(0);
  const [view, setView] = useState<ViewKey>("activeDeals");

  useEffect(() => {
    const refresh = () => setTick((value) => value + 1);
    window.addEventListener("storage", refresh);
    window.addEventListener("vaultforge-room-state-change", refresh);
    window.addEventListener("vaultforge-my-rooms-change", refresh);
    window.addEventListener("vaultforge-deal-change", refresh);
    window.addEventListener("vaultforge-pain-change", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("vaultforge-room-state-change", refresh);
      window.removeEventListener("vaultforge-my-rooms-change", refresh);
      window.removeEventListener("vaultforge-deal-change", refresh);
      window.removeEventListener("vaultforge-pain-change", refresh);
    };
  }, []);

  const deals = useMemo(() => allRooms("deal"), [tick]);
  const pains = useMemo(() => allRooms("pain"), [tick]);
  const visible = useMemo(() => roomsFor(view, deals, pains), [view, deals, pains]);
  const refresh = () => setTick((value) => value + 1);

  const needsAttention = attentionCount(deals, pains);

  const cards: { view: ViewKey; title: string; note: string }[] = [
    { view: "activeDeals", title: "Active Deals", note: "my open opportunity rooms" },
    { view: "activePain", title: "Active Pain", note: "my open pressure rooms" },
    { view: "savedDeals", title: "Saved Deals", note: "kept opportunity rooms" },
    { view: "savedPain", title: "Saved Pain", note: "kept pain rooms" },
    { view: "archived", title: "Archived", note: "not active, not deleted" },
    { view: "sold", title: "Sold Deals", note: "completed opportunity rooms" },
    { view: "resolved", title: "Resolved Pain", note: "handled problem rooms" },
    { view: "deleted", title: "Deleted", note: "hidden cleanup folder" },
  ];

  return (
    <main style={page}>
      <style>{styleTag}</style>
      <div style={wrap}>
        <Nav />

        <section style={hero}>
          <div style={eyebrow}>My Rooms</div>
          <h1 style={h1}>Member workspace cleanup.</h1>
          <p style={sub}>
            Keep your own rooms clean without destroying the intelligence system. Mark sold, resolved, archived, saved, deleted, or restore active.
          </p>
          <div style={{ ...row, marginTop: 18 }}>
            <Link href="/deal-create" style={goldBtn}>Create Deal</Link>
            <Link href="/pain-intake" style={goldBtn}>Create Pain</Link>
            <Link href="/network" style={btn}>Network</Link>
            <Link href="/state-map" style={btn}>State Map</Link>
          </div>
        </section>

        <Section title="Needs Attention">
          <div style={needsAttention ? pulseRed : activePanel}>
            <div style={eyebrow}>AI Room Health</div>
            <h2 style={h2}>{needsAttention}</h2>
            <p style={sub}>{needsAttention ? "room(s) need action, update, routing, sold/resolved status, or cleanup." : "No urgent room health warnings."}</p>
            <p style={muted}>This keeps member rooms from piling up stale, unsold, unresolved, or unfinished.</p>
          </div>
        </Section>

        <Section title="Folder Cards">
          <div style={grid}>
            {cards.map((cardItem) => (
              <ViewCard
                key={cardItem.view}
                view={cardItem.view}
                title={cardItem.title}
                note={cardItem.note}
                count={countFor(cardItem.view, deals, pains)}
                active={view === cardItem.view}
                onClick={() => setView(cardItem.view)}
              />
            ))}
          </div>
        </Section>

        <Section title={cards.find((item) => item.view === view)?.title || "Rooms"}>
          {visible.length ? (
            <div style={grid}>
              {visible.map((item) => (
                <RoomCard key={`${item.kind}-${rid(item.room)}`} kind={item.kind} room={item.room} refresh={refresh} />
              ))}
            </div>
          ) : (
            <div style={panel}>
              <h2 style={h2}>No rooms here.</h2>
              <p style={sub}>Create a Deal or Pain room, or open another folder card.</p>
              <div style={{ ...row, marginTop: 16 }}>
                <Link href="/deal-create" style={goldBtn}>Create Deal</Link>
                <Link href="/pain-intake" style={goldBtn}>Create Pain</Link>
              </div>
            </div>
          )}
        </Section>

        <Section title="How This Works">
          <div style={grid}>
            <div style={panel}>
              <div style={eyebrow}>Member Cleanup</div>
              <p style={sub}>Delete hides from your workspace.</p>
              <p style={muted}>It does not have to destroy the global intelligence history.</p>
            </div>
            <div style={panel}>
              <div style={eyebrow}>Sold / Resolved</div>
              <p style={sub}>Deals become Sold. Pain becomes Resolved.</p>
              <p style={muted}>This later powers performance history and AI follow-up.</p>
            </div>
            <div style={panel}>
              <div style={eyebrow}>Restore</div>
              <p style={sub}>Any folder can restore back to Active.</p>
              <p style={muted}>This keeps the member area clean without panic deletes.</p>
            </div>
          </div>
        </Section>
      </div>
    </main>
  );
}
