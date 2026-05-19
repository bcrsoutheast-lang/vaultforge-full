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
  routeTo?: string[] | string;
  routingNeeds?: string[] | string;
  painTypes?: string[] | string;
  severity?: string;
  timePressure?: string;
  capitalPressure?: string;
  roomState?: RoomState;
  cleanupState?: RoomState;
  stateStatus?: RoomState;
  alertRead?: boolean;
  viewedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
};

type MessageThread = {
  id: string;
  lane: "deal" | "pain" | "network" | "general";
  subject: string;
  roomId?: string;
  status: "active" | "archived" | "deleted";
  unread: boolean;
  saved: boolean;
  updatedAt: string;
  messages: { id: string; body: string; author: string; createdAt: string }[];
};

const DEAL_KEYS = ["vaultforge_clean_deal_rooms", "vaultforge_deal_rooms", "vaultforge_rooms_deals", "vf_deal_rooms"];
const PAIN_KEYS = ["vaultforge_clean_pain_rooms_v1", "vaultforge_clean_pain_rooms", "vaultforge_pain_rooms", "vaultforge_rooms_pain", "vf_pain_rooms"];
const STATE_KEYS = ["vaultforge_clean_room_states", "vaultforge_room_states", "vaultforge_deal_room_states", "vaultforge_pain_room_states", "vaultforge_5s_room_states"];
const READ_KEY = "vaultforge_room_alert_read_v1";
const MESSAGE_KEY = "vaultforge_message_threads_v2";
const ALERT_SEEN_KEY = "vaultforge_alert_seen_v1";
const ALERT_DISMISSED_KEY = "vaultforge_alert_dismissed_v1";
const ALERT_WATCHLIST_KEY = "vaultforge_alert_watchlist_v1";

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
  return out.map((room) => {
    const id = rid(room);
    const state = states[id] || states[`${kind}:${id}`] || roomState(room);
    return { ...room, roomState: state, cleanupState: state, stateStatus: state };
  });
}

function getThreads() {
  if (!ok()) return [] as MessageThread[];
  return j<MessageThread[]>(localStorage.getItem(MESSAGE_KEY), []).filter((thread) => thread.status === "active");
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

function idList(key: string) {
  if (!ok()) return [] as string[];
  return j<string[]>(localStorage.getItem(key), []);
}

function setIdList(key: string, ids: string[]) {
  if (!ok()) return;
  localStorage.setItem(key, JSON.stringify(Array.from(new Set(ids))));
  window.dispatchEvent(new Event("vaultforge-alerts-change"));
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

function Nav() {
  return (
    <nav style={nav}>
      <div style={brand}>VAULTFORGE</div>
      <Link href="/command" style={btn}>Command</Link>
      <Link href="/alerts" style={goldBtn}>Alerts</Link>
      <Link href="/members" style={btn}>Members</Link>
      <Link href="/network" style={btn}>Network</Link>
      <Link href="/messages" style={btn}>Messages</Link>
      <Link href="/profile" style={btn}>Profile</Link>
      <Link href="/logout" style={redBtn}>Logout</Link>
    </nav>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section style={card}><div style={eyebrow}>{title}</div>{children}</section>;
}

type AlertItem = {
  id: string;
  kind: "deal" | "pain" | "message";
  title: string;
  subtitle: string;
  href: string;
};

export default function AlertsPage() {
  const [tick, setTick] = useState(0);
  const [openLane, setOpenLane] = useState<"active" | "watchlist" | "history">("active");

  useEffect(() => {
    const refresh = () => setTick((x) => x + 1);
    ["storage", "vaultforge-room-read-change", "vaultforge-room-state-change", "vaultforge-messages-change", "vaultforge-alerts-change"].forEach((event) => window.addEventListener(event, refresh));
    return () => ["storage", "vaultforge-room-read-change", "vaultforge-room-state-change", "vaultforge-messages-change", "vaultforge-alerts-change"].forEach((event) => window.removeEventListener(event, refresh));
  }, []);

  const seen = useMemo(() => idList(ALERT_SEEN_KEY), [tick]);
  const dismissed = useMemo(() => idList(ALERT_DISMISSED_KEY), [tick]);
  const watchlist = useMemo(() => idList(ALERT_WATCHLIST_KEY), [tick]);

  const dealAlerts: AlertItem[] = useMemo(() => unreadRooms("deal", allRooms("deal")).map((room) => ({
    id: alertId("deal", rid(room)),
    kind: "deal",
    title: titleFor(room, "deal"),
    subtitle: loc(room),
    href: `/deal-rooms/${encodeURIComponent(rid(room))}`,
  })), [tick]);

  const painAlerts: AlertItem[] = useMemo(() => unreadRooms("pain", allRooms("pain")).map((room) => ({
    id: alertId("pain", rid(room)),
    kind: "pain",
    title: titleFor(room, "pain"),
    subtitle: loc(room),
    href: `/pain-rooms/${encodeURIComponent(rid(room))}`,
  })), [tick]);

  const messageAlerts: AlertItem[] = useMemo(() => getThreads().filter((thread) => thread.unread).map((thread) => ({
    id: alertId("message", thread.id),
    kind: "message",
    title: thread.subject,
    subtitle: `${thread.lane} • ${thread.messages.length} message(s)`,
    href: "/messages",
  })), [tick]);

  const allAlerts = [...dealAlerts, ...painAlerts, ...messageAlerts];
  const activeAlerts = allAlerts.filter((alert) => !seen.includes(alert.id) && !dismissed.includes(alert.id));
  const watchedAlerts = allAlerts.filter((alert) => watchlist.includes(alert.id));
  const historyAlerts = allAlerts.filter((alert) => seen.includes(alert.id) || dismissed.includes(alert.id));

  const visible = openLane === "active" ? activeAlerts : openLane === "watchlist" ? watchedAlerts : historyAlerts;

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
      <div style={wrap}>
        <Nav />

        <section style={hero}>
          <div style={eyebrow}>Alerts</div>
          <h1 style={h1}>Action alerts.</h1>
          <p style={sub}>New Deal, Pain, and Message alerts live here. Mark seen, dismiss, or save to Watchlist.</p>
        </section>

        <Section title="Alert Cards">
          <div style={grid}>
            <button type="button" style={openLane === "active" || activeAlerts.length ? activePanel : panel} onClick={() => setOpenLane("active")}>
              <div style={eyebrow}>Active Alerts</div>
              <h2 style={h2}>{activeAlerts.length}</h2>
              <p style={muted}>deal, pain, message</p>
            </button>

            <button type="button" style={openLane === "watchlist" || watchedAlerts.length ? activePanel : panel} onClick={() => setOpenLane("watchlist")}>
              <div style={eyebrow}>Watchlist</div>
              <h2 style={h2}>{watchedAlerts.length}</h2>
              <p style={muted}>saved alert(s)</p>
            </button>

            <button type="button" style={openLane === "history" ? activePanel : panel} onClick={() => setOpenLane("history")}>
              <div style={eyebrow}>History</div>
              <h2 style={h2}>{historyAlerts.length}</h2>
              <p style={muted}>seen or dismissed</p>
            </button>
          </div>
        </Section>

        <Section title={openLane === "active" ? "Active Alerts" : openLane === "watchlist" ? "Watchlist" : "Alert History"}>
          {visible.length ? (
            <div style={grid}>
              {visible.map((alert) => (
                <div key={alert.id} style={activeAlerts.some((item) => item.id === alert.id) ? activePanel : panel}>
                  <div style={eyebrow}>{alert.kind}</div>
                  <h2 style={h2}>{alert.title}</h2>
                  <p style={sub}>{alert.subtitle}</p>
                  <div style={{ ...row, marginTop: 16 }}>
                    <Link href={alert.href} style={goldBtn} onClick={() => markSeen(alert.id)}>Open</Link>
                    <button type="button" style={btn} onClick={() => markSeen(alert.id)}>Mark Seen</button>
                    <button type="button" style={watchlist.includes(alert.id) ? goldBtn : btn} onClick={() => toggleWatch(alert.id)}>{watchlist.includes(alert.id) ? "Saved" : "Save Watch"}</button>
                    <button type="button" style={redBtn} onClick={() => dismiss(alert.id)}>Dismiss</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={sub}>No alerts in this lane.</p>
          )}
        </Section>
      </div>
    </main>
  );
}
