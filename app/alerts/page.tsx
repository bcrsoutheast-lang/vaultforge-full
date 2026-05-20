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
  status?: string;
  unread?: boolean;
  saved?: boolean;
  updatedAt?: string;
  messages?: unknown[];
};

const DEAL_KEYS = ["vaultforge_clean_deal_rooms", "vaultforge_deal_rooms", "vaultforge_rooms_deals", "vf_deal_rooms"];
const PAIN_KEYS = ["vaultforge_clean_pain_rooms_v2", "vaultforge_clean_pain_rooms_v1", "vaultforge_clean_pain_rooms", "vaultforge_pain_rooms", "vaultforge_rooms_pain", "vf_pain_rooms"];
const MESSAGE_KEYS = ["vaultforge_message_threads_v2", "vaultforge_message_command_messages", "vf_message_threads"];
const STATE_KEYS = ["vaultforge_clean_room_states", "vaultforge_room_states", "vaultforge_deal_room_states", "vaultforge_pain_room_states", "vaultforge_5s_room_states", "vaultforge_deal_room_state_v2", "vaultforge_pain_room_state_v2"];
const READ_KEY = "vaultforge_room_alert_read_v1";
const ALERT_SEEN_KEY = "vaultforge_alert_seen_v2";
const ALERT_DISMISSED_KEY = "vaultforge_alert_dismissed_v2";
const ALERT_WATCHLIST_KEY = "vaultforge_alert_watchlist_v2";

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
    const rows = arr<any>(key);
    for (const row of rows) {
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
        id,
        subject: txt(row?.subject || row?.title || row?.lane, "Message Thread"),
        lane: txt(row?.lane || row?.type, "general"),
        status: txt(row?.status, "active"),
        unread: Boolean(row?.unread || row?.isUnread),
        saved: Boolean(row?.saved),
        updatedAt: txt(row?.updatedAt || row?.createdAt),
        messages: Array.isArray(row?.messages) ? row.messages : [],
      });
    }
  }

  return out.filter((thread) => thread.status !== "deleted" && thread.status !== "archived");
}

function idList(key: string) {
  if (!ok()) return [] as string[];
  return j<string[]>(localStorage.getItem(key), []);
}

function setIdList(key: string, ids: string[]) {
  if (!ok()) return;
  localStorage.setItem(key, JSON.stringify(Array.from(new Set(ids))));
  window.dispatchEvent(new Event("vaultforge-alert-change"));
}

function alertId(kind: string, id: string) {
  return `${kind}:${id}`;
}

function addId(key: string, id: string) {
  setIdList(key, [...idList(key), id]);
}

function removeId(key: string, id: string) {
  setIdList(key, idList(key).filter((item) => item !== id));
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
@keyframes vfBannerGlow {
  0%,100% { opacity: .82; }
  50% { opacity: 1; }
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
const panel: React.CSSProperties = { background: "#121724", border: "1px solid rgba(207,216,230,.16)", borderRadius: 22, padding: 22, textDecoration: "none", color: "#f7f7fb", display: "block" };
const pulseRed: React.CSSProperties = { ...panel, borderColor: "rgba(255,70,70,.70)", animation: "vfPulseRed 2.1s ease-in-out infinite" };
const pulseGold: React.CSSProperties = { ...panel, borderColor: "rgba(255,220,104,.70)", animation: "vfPulseGold 2.3s ease-in-out infinite" };
const eyebrow: React.CSSProperties = { color: "#ffd45a", textTransform: "uppercase", letterSpacing: 7, fontWeight: 950, fontSize: 15, marginBottom: 12 };
const h1: React.CSSProperties = { fontSize: "clamp(44px,8vw,86px)", lineHeight: 0.9, letterSpacing: -4, margin: "0 0 18px", fontWeight: 950 };
const h2: React.CSSProperties = { fontSize: "clamp(30px,5vw,52px)", lineHeight: 0.95, letterSpacing: -2, margin: "0 0 14px", fontWeight: 950 };
const sub: React.CSSProperties = { color: "#c9d0dc", fontSize: 21, lineHeight: 1.35, margin: 0 };
const muted: React.CSSProperties = { color: "#aeb7c7", margin: "8px 0 0", lineHeight: 1.35 };
const grid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(245px,1fr))", gap: 16 };
const row: React.CSSProperties = { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" };
const tickerOuter: React.CSSProperties = { overflow: "hidden", border: "1px solid rgba(245,197,66,.28)", borderRadius: 20, background: "#090e1a", marginBottom: 18 };
const tickerInner: React.CSSProperties = { display: "inline-flex", minWidth: "200%", whiteSpace: "nowrap", animation: "vfTicker 38s linear infinite" };
const tickerItem: React.CSSProperties = { padding: "14px 28px", borderRight: "1px solid rgba(245,197,66,.18)", color: "#ffd45a", fontWeight: 950, letterSpacing: 1 };
const bannerRail: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 12, marginBottom: 18 };
const banner: React.CSSProperties = { ...panel, padding: 18, animation: "vfBannerGlow 2.5s ease-in-out infinite" };
const photoStyle: React.CSSProperties = { width: "100%", height: 150, objectFit: "cover", borderRadius: 18, border: "1px solid rgba(245,197,66,.25)", marginBottom: 12 };


type AlertItem = {
  id: string;
  kind: "deal" | "pain" | "message";
  title: string;
  subtitle: string;
  href: string;
  severity: "red" | "gold";
};

function Nav() {
  return (
    <nav style={nav}>
      <div style={brand}>VAULTFORGE</div>
      <Link href="/command" style={btn}>Command</Link>
      <Link href="/alerts" style={goldBtn}>Alerts</Link>
      <Link href="/network" style={btn}>Network</Link>
      <Link href="/pain-rooms" style={btn}>Pain Rooms</Link>
      <Link href="/deal-rooms" style={btn}>Deal Rooms</Link>
      <Link href="/messages" style={btn}>Messages</Link>
      <Link href="/logout" style={redBtn}>Logout</Link>
    </nav>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section style={card}><div style={eyebrow}>{title}</div>{children}</section>;
}

export default function AlertsPage() {
  const [tick, setTick] = useState(0);
  const [lane, setLane] = useState<"active" | "watchlist" | "history">("active");

  useEffect(() => {
    const refresh = () => setTick((x) => x + 1);
    ["storage", "vaultforge-deal-change", "vaultforge-pain-change", "vaultforge-room-state-change", "vaultforge-room-read-change", "vaultforge-messages-change", "vaultforge-alert-change"].forEach((event) => window.addEventListener(event, refresh));
    return () => ["storage", "vaultforge-deal-change", "vaultforge-pain-change", "vaultforge-room-state-change", "vaultforge-room-read-change", "vaultforge-messages-change", "vaultforge-alert-change"].forEach((event) => window.removeEventListener(event, refresh));
  }, []);

  const deals = useMemo(() => activeDeals(), [tick]);
  const pains = useMemo(() => activePains(), [tick]);
  const threads = useMemo(() => getThreads(), [tick]);
  const seen = useMemo(() => idList(ALERT_SEEN_KEY), [tick]);
  const dismissed = useMemo(() => idList(ALERT_DISMISSED_KEY), [tick]);
  const watchlist = useMemo(() => idList(ALERT_WATCHLIST_KEY), [tick]);

  const dealAlerts: AlertItem[] = useMemo(() => unreadRooms("deal", deals).map((room) => ({
    id: alertId("deal", rid(room)),
    kind: "deal",
    title: roomTitle(room, "deal"),
    subtitle: `${loc(room)} • ${txt(room.assetClass, "Deal")}`,
    href: `/deal-rooms/${encodeURIComponent(rid(room))}`,
    severity: "gold",
  })), [deals]);

  const painAlerts: AlertItem[] = useMemo(() => unreadRooms("pain", pains).map((room) => ({
    id: alertId("pain", rid(room)),
    kind: "pain",
    title: roomTitle(room, "pain"),
    subtitle: `${loc(room)} • ${list(room.painTypes).join(", ") || "Pain"} • ${txt(room.severity, "High")}`,
    href: `/pain-rooms/${encodeURIComponent(rid(room))}`,
    severity: txt(room.severity).includes("Critical") || txt(room.severity).includes("Emergency") || txt(room.timePressure).includes("24") || txt(room.timePressure).includes("72") ? "red" : "gold",
  })), [pains]);

  const messageAlerts: AlertItem[] = useMemo(() => threads.filter((thread) => thread.unread).map((thread) => ({
    id: alertId("message", txt(thread.id)),
    kind: "message",
    title: txt(thread.subject, "Unread Message"),
    subtitle: `${txt(thread.lane, "general")} • ${Array.isArray(thread.messages) ? thread.messages.length : 0} message(s)`,
    href: "/messages",
    severity: "red",
  })), [threads]);

  const allAlerts = [...painAlerts, ...dealAlerts, ...messageAlerts];
  const activeAlerts = allAlerts.filter((alert) => !seen.includes(alert.id) && !dismissed.includes(alert.id));
  const watchedAlerts = allAlerts.filter((alert) => watchlist.includes(alert.id));
  const historyAlerts = allAlerts.filter((alert) => seen.includes(alert.id) || dismissed.includes(alert.id));
  const visible = lane === "active" ? activeAlerts : lane === "watchlist" ? watchedAlerts : historyAlerts;

  function markSeen(id: string) {
    addId(ALERT_SEEN_KEY, id);
    setTick((x) => x + 1);
  }

  function dismiss(id: string) {
    addId(ALERT_DISMISSED_KEY, id);
    setTick((x) => x + 1);
  }

  function toggleWatch(id: string) {
    if (watchlist.includes(id)) removeId(ALERT_WATCHLIST_KEY, id);
    else addId(ALERT_WATCHLIST_KEY, id);
    setTick((x) => x + 1);
  }

  return (
    <main style={page}>
      <style>{styleTag}</style>
      <div style={wrap}>
        <Nav />

        <div style={tickerOuter}>
          <div style={tickerInner}>
            {[...activeAlerts, ...activeAlerts, ...activeAlerts].length ? [...activeAlerts, ...activeAlerts, ...activeAlerts].map((alert, index) => <span key={`${alert.id}-${index}`} style={tickerItem}>{alert.kind.toUpperCase()} ALERT • {alert.title} • {alert.subtitle}</span>) : <span style={tickerItem}>NO ACTIVE ALERTS • SYSTEM WATCHING DEALS • PAIN • MESSAGES</span>}
          </div>
        </div>

        <section style={hero}>
          <div style={eyebrow}>Alert Center</div>
          <h1 style={h1}>Pulsing signal board.</h1>
          <p style={sub}>Active alerts pulse until marked seen, dismissed, or opened.</p>
        </section>

        <div style={bannerRail}>
          <button type="button" style={lane === "active" || activeAlerts.length ? pulseRed : banner} onClick={() => setLane("active")}>
            <div style={eyebrow}>Active Alerts</div>
            <h2 style={h2}>{activeAlerts.length}</h2>
            <p style={muted}>unread operational signals</p>
          </button>
          <button type="button" style={lane === "watchlist" || watchedAlerts.length ? pulseGold : banner} onClick={() => setLane("watchlist")}>
            <div style={eyebrow}>Watchlist</div>
            <h2 style={h2}>{watchedAlerts.length}</h2>
            <p style={muted}>saved alerts</p>
          </button>
          <button type="button" style={lane === "history" ? panel : banner} onClick={() => setLane("history")}>
            <div style={eyebrow}>History</div>
            <h2 style={h2}>{historyAlerts.length}</h2>
            <p style={muted}>seen or dismissed</p>
          </button>
        </div>

        <Section title={lane === "active" ? "Active Alert Cards" : lane === "watchlist" ? "Watchlist Cards" : "Alert History"}>
          {visible.length ? (
            <div style={grid}>
              {visible.map((alert) => (
                <div key={alert.id} style={alert.severity === "red" && lane === "active" ? pulseRed : alert.severity === "gold" && lane === "active" ? pulseGold : panel}>
                  <div style={eyebrow}>{alert.kind}</div>
                  <h2 style={h2}>{alert.title}</h2>
                  <p style={sub}>{alert.subtitle}</p>
                  <div style={{ ...row, marginTop: 16 }}>
                    <Link href={alert.href} style={goldBtn} onClick={() => markSeen(alert.id)}>Open</Link>
                    <button type="button" style={btn} onClick={() => markSeen(alert.id)}>Mark Seen</button>
                    <button type="button" style={watchlist.includes(alert.id) ? goldBtn : btn} onClick={() => toggleWatch(alert.id)}>{watchlist.includes(alert.id) ? "Watching" : "Watch"}</button>
                    <button type="button" style={redBtn} onClick={() => dismiss(alert.id)}>Dismiss</button>
                  </div>
                </div>
              ))}
            </div>
          ) : <p style={sub}>No alerts in this lane.</p>}
        </Section>
      </div>
    </main>
  );
}
