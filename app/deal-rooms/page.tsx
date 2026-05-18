"use client";

import Link from "next/link";
import { useEffect, useState } from "react";


type RoomState = "active" | "saved" | "archived" | "deleted";
type RoomKind = "deal" | "pain";

type RoomRecord = {
  id?: string;
  roomId?: string;
  dealId?: string;
  painId?: string;
  roomState?: RoomState;
  cleanupState?: RoomState;
  stateStatus?: RoomState;
  title?: string;
  name?: string;
  state?: string;
  city?: string;
  county?: string;
  assetClass?: string;
  photoUrls?: string[];
  photos?: string[];
  photoUrl?: string;
  imageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
};

const DEAL_KEYS = ["vaultforge_clean_deal_rooms", "vaultforge_deal_rooms", "vaultforge_rooms_deals", "vf_deal_rooms"];
const PAIN_KEYS = ["vaultforge_clean_pain_rooms_v1", "vaultforge_clean_pain_rooms", "vaultforge_pain_rooms", "vaultforge_rooms_pain", "vf_pain_rooms"];
const ROOM_STATE_KEYS = ["vaultforge_clean_room_states", "vaultforge_room_states", "vaultforge_deal_room_states", "vaultforge_pain_room_states", "vaultforge_5s_room_states"];

function hasBrowser() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function parseJson<T>(raw: string | null, fallback: T): T {
  try {
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function cleanText(value: unknown, fallback = "") {
  const clean = String(value || "").trim();
  return clean || fallback;
}

function roomId(room: RoomRecord | null | undefined) {
  return cleanText(room?.id || room?.roomId || room?.dealId || room?.painId, "");
}

function keysFor(kind: RoomKind) {
  return kind === "deal" ? DEAL_KEYS : PAIN_KEYS;
}

function directKeysFor(kind: RoomKind, id: string) {
  return [
    `vaultforge_clean_${kind}_room_${id}`,
    `vaultforge_${kind}_room_${id}`,
    `vf_${kind}_room_${id}`,
  ];
}

function readArray(key: string): RoomRecord[] {
  if (!hasBrowser()) return [];
  const parsed = parseJson<unknown>(window.localStorage.getItem(key), []);
  return Array.isArray(parsed) ? (parsed as RoomRecord[]) : [];
}

function readStates(): Record<string, RoomState> {
  if (!hasBrowser()) return {};
  const merged: Record<string, RoomState> = {};
  for (const key of ROOM_STATE_KEYS) {
    Object.assign(merged, parseJson<Record<string, RoomState>>(window.localStorage.getItem(key), {}));
  }
  return merged;
}

function writeStates(states: Record<string, RoomState>) {
  if (!hasBrowser()) return;
  for (const key of ROOM_STATE_KEYS) {
    window.localStorage.setItem(key, JSON.stringify(states));
  }
}

function getRoomState(room: RoomRecord, kind: RoomKind): RoomState {
  const states = readStates();
  const id = roomId(room);
  const status = states[`${kind}:${id}`] || states[id] || room.roomState || room.cleanupState || room.stateStatus || "active";
  if (status === "saved" || status === "archived" || status === "deleted") return status;
  return "active";
}

function readRooms(kind: RoomKind): RoomRecord[] {
  if (!hasBrowser()) return [];
  const map = new Map<string, RoomRecord>();

  for (const key of keysFor(kind)) {
    for (const room of readArray(key)) {
      const id = roomId(room);
      if (id && !map.has(id)) map.set(id, { ...room, id });
    }
  }

  for (let i = 0; i < window.localStorage.length; i += 1) {
    const key = window.localStorage.key(i) || "";
    const isDeal = kind === "deal" && (key.startsWith("vaultforge_clean_deal_room_") || key.startsWith("vaultforge_deal_room_") || key.startsWith("vf_deal_room_"));
    const isPain = kind === "pain" && (key.startsWith("vaultforge_clean_pain_room_") || key.startsWith("vaultforge_pain_room_") || key.startsWith("vf_pain_room_"));

    if (!isDeal && !isPain) continue;

    const room = parseJson<RoomRecord | null>(window.localStorage.getItem(key), null);
    const id = roomId(room);
    if (room && id && !map.has(id)) map.set(id, { ...room, id });
  }

  return Array.from(map.values()).map((room) => ({ ...room, roomState: getRoomState(room, kind) }));
}

function syncRoomState(room: RoomRecord, kind: RoomKind, state: RoomState) {
  if (!hasBrowser()) return;
  const id = roomId(room);
  if (!id) return;

  const next = {
    ...room,
    id,
    roomState: state,
    cleanupState: state,
    stateStatus: state,
    updatedAt: new Date().toISOString(),
  };

  for (const key of directKeysFor(kind, id)) {
    window.localStorage.setItem(key, JSON.stringify(next));
  }

  for (const key of keysFor(kind)) {
    const rows = readArray(key).filter((item) => roomId(item) !== id);
    window.localStorage.setItem(key, JSON.stringify([next, ...rows]));
  }

  const states = readStates();
  states[id] = state;
  states[`${kind}:${id}`] = state;
  writeStates(states);

  window.dispatchEvent(new Event("storage"));
  window.dispatchEvent(new Event("vaultforge-room-state-change"));
  window.dispatchEvent(new Event(kind === "deal" ? "vaultforge-deal-change" : "vaultforge-pain-change"));
}

function locationFor(room: RoomRecord) {
  return [cleanText(room.city), cleanText(room.county), cleanText(room.state)].filter(Boolean).join(", ") || "Market not listed";
}

function titleFor(room: RoomRecord, kind: RoomKind) {
  return cleanText(room.title || room.name, kind === "deal" ? "Untitled Deal Room" : "Untitled Pain Room");
}

function hrefFor(kind: RoomKind, room: RoomRecord) {
  const id = encodeURIComponent(roomId(room));
  return kind === "deal" ? `/deal-rooms/${id}` : `/pain-rooms/${id}`;
}

function folderPath(state: RoomState) {
  if (state === "saved") return "/saved-rooms";
  if (state === "archived") return "/archived-rooms";
  if (state === "deleted") return "/deleted-rooms";
  return "/command";
}

function firstPhoto(room: RoomRecord) {
  const list = [
    ...(Array.isArray(room.photoUrls) ? room.photoUrls : []),
    ...(Array.isArray(room.photos) ? room.photos : []),
    room.photoUrl,
    room.imageUrl,
  ].map((item) => cleanText(item)).filter(Boolean);
  return list[0] || "";
}


const KIND: RoomKind = "deal";

export default function RoomListPage() {
  const [rooms, setRooms] = useState<RoomRecord[]>([]);

  function load() {
    setRooms(readRooms(KIND).filter((room) => getRoomState(room, KIND) === "active"));
  }

  useEffect(() => {
    load();
    window.addEventListener("storage", load);
    window.addEventListener("vaultforge-room-state-change", load);
    window.addEventListener(KIND === "deal" ? "vaultforge-deal-change" : "vaultforge-pain-change", load);
    return () => {
      window.removeEventListener("storage", load);
      window.removeEventListener("vaultforge-room-state-change", load);
      window.removeEventListener(KIND === "deal" ? "vaultforge-deal-change" : "vaultforge-pain-change", load);
    };
  }, []);

  return (
    <main style={page}>
      <div style={wrap}>
        <nav style={nav}>
          <Link href="/command" style={btn}>Command</Link>
          <Link href="/deal-rooms" style={KIND === "deal" ? goldBtn : btn}>Deal Rooms</Link>
          <Link href="/pain-rooms" style={KIND === "pain" ? goldBtn : btn}>Pain Rooms</Link>
          <Link href="/messages" style={btn}>Messages</Link>
          <Link href="/saved-rooms" style={btn}>Saved</Link>
          <Link href="/archived-rooms" style={btn}>Archived</Link>
          <Link href="/deleted-rooms" style={btn}>Deleted</Link>
          <Link href="/logout" style={redBtn}>Logout</Link>
        </nav>

        <section style={card}>
          <div style={eyebrow}>{KIND === "deal" ? "Deal Rooms" : "Pain Rooms"}</div>
          <h1 style={h1}>{KIND === "deal" ? "Active deal rooms." : "Active pain rooms."}</h1>
          <p style={sub}>Saved, archived, and deleted rooms are removed from this active board.</p>
        </section>

        <section style={grid}>
          {rooms.length ? rooms.map((room) => (
            <article key={roomId(room)} style={roomCard}>
              {firstPhoto(room) ? <img src={firstPhoto(room)} alt="" style={photo} /> : null}
              <div style={eyebrow}>{cleanText(room.assetClass, KIND === "deal" ? "Deal" : "Pain")}</div>
              <h2 style={roomTitle}>{titleFor(room, KIND)}</h2>
              <p style={muted}>{locationFor(room)}</p>
              <div style={row}>
                <Link href={hrefFor(KIND, room)} style={goldBtn}>Open Room</Link>
                <button type="button" onClick={() => { syncRoomState(room, KIND, "saved"); load(); }} style={btn}>Save</button>
                <button type="button" onClick={() => { syncRoomState(room, KIND, "archived"); load(); }} style={btn}>Archive</button>
                <button type="button" onClick={() => { syncRoomState(room, KIND, "deleted"); load(); }} style={redBtn}>Delete</button>
              </div>
            </article>
          )) : (
            <section style={card}>
              <p style={sub}>No active {KIND === "deal" ? "deal" : "pain"} rooms.</p>
            </section>
          )}
        </section>
      </div>
    </main>
  );
}


const page: React.CSSProperties = {
  minHeight: "100vh",
  background: "#05070d",
  color: "#f7f7fb",
  padding: 18,
  fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
};

const wrap: React.CSSProperties = { maxWidth: 1280, margin: "0 auto", paddingBottom: 80 };
const nav: React.CSSProperties = { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 18 };
const brand: React.CSSProperties = { color: "#ffd45a", fontSize: 27, fontWeight: 950, letterSpacing: -1, marginRight: 10 };

const card: React.CSSProperties = {
  background: "linear-gradient(180deg,#080d19,#050816)",
  border: "1px solid rgba(245,197,66,.28)",
  borderRadius: 26,
  padding: 28,
  marginBottom: 22,
};

const btn: React.CSSProperties = {
  border: "1px solid rgba(207,216,230,.18)",
  background: "#171c29",
  color: "#f7f7fb",
  borderRadius: 999,
  padding: "13px 18px",
  fontWeight: 950,
  textDecoration: "none",
  display: "inline-block",
  cursor: "pointer",
};

const goldBtn: React.CSSProperties = { ...btn, border: 0, background: "#ffdc68", color: "#10131a" };
const redBtn: React.CSSProperties = { ...btn, background: "#271016", borderColor: "rgba(255,70,70,.48)", color: "#ffaaaa" };
const eyebrow: React.CSSProperties = { color: "#ffd45a", textTransform: "uppercase", letterSpacing: 7, fontWeight: 950, fontSize: 15, marginBottom: 12 };
const h1: React.CSSProperties = { fontSize: "clamp(42px,8vw,82px)", lineHeight: .9, letterSpacing: -4, margin: "0 0 18px", fontWeight: 950 };
const h2: React.CSSProperties = { fontSize: "clamp(28px,5vw,50px)", lineHeight: .95, letterSpacing: -2, margin: "0 0 14px", fontWeight: 950 };
const sub: React.CSSProperties = { color: "#c9d0dc", fontSize: 22, lineHeight: 1.35, margin: 0 };
const grid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 18 };
const row: React.CSSProperties = { display: "flex", flexWrap: "wrap", gap: 10 };
const roomCard: React.CSSProperties = { background: "#121724", border: "1px solid rgba(207,216,230,.14)", borderRadius: 22, padding: 22 };
const roomTitle: React.CSSProperties = { fontSize: 30, margin: "0 0 10px", lineHeight: 1 };
const muted: React.CSSProperties = { color: "#aeb7c7", margin: "0 0 14px", lineHeight: 1.35 };
const photo: React.CSSProperties = { width: "100%", height: 170, objectFit: "cover", borderRadius: 18, marginBottom: 14, border: "1px solid rgba(207,216,230,.18)" };

