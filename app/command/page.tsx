"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";


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


type Counts = {
  dealActive: number;
  painActive: number;
  dealSaved: number;
  painSaved: number;
  dealArchived: number;
  painArchived: number;
  dealDeleted: number;
  painDeleted: number;
};

function emptyCounts(): Counts {
  return {
    dealActive: 0,
    painActive: 0,
    dealSaved: 0,
    painSaved: 0,
    dealArchived: 0,
    painArchived: 0,
    dealDeleted: 0,
    painDeleted: 0,
  };
}

export default function CommandPage() {
  const [deals, setDeals] = useState<RoomRecord[]>([]);
  const [pains, setPains] = useState<RoomRecord[]>([]);

  function load() {
    setDeals(readRooms("deal"));
    setPains(readRooms("pain"));
  }

  useEffect(() => {
    load();
    window.addEventListener("storage", load);
    window.addEventListener("vaultforge-room-state-change", load);
    window.addEventListener("vaultforge-deal-change", load);
    window.addEventListener("vaultforge-pain-change", load);
    return () => {
      window.removeEventListener("storage", load);
      window.removeEventListener("vaultforge-room-state-change", load);
      window.removeEventListener("vaultforge-deal-change", load);
      window.removeEventListener("vaultforge-pain-change", load);
    };
  }, []);

  const counts = useMemo(() => {
    const c = emptyCounts();
    for (const deal of deals) {
      const state = getRoomState(deal, "deal");
      if (state === "active") c.dealActive += 1;
      if (state === "saved") c.dealSaved += 1;
      if (state === "archived") c.dealArchived += 1;
      if (state === "deleted") c.dealDeleted += 1;
    }
    for (const pain of pains) {
      const state = getRoomState(pain, "pain");
      if (state === "active") c.painActive += 1;
      if (state === "saved") c.painSaved += 1;
      if (state === "archived") c.painArchived += 1;
      if (state === "deleted") c.painDeleted += 1;
    }
    return c;
  }, [deals, pains]);

  const activeDeals = deals.filter((room) => getRoomState(room, "deal") === "active").slice(0, 5);
  const activePains = pains.filter((room) => getRoomState(room, "pain") === "active").slice(0, 5);

  return (
    <main style={page}>
      <div style={wrap}>
        <nav style={nav}>
          <div style={brand}>VAULTFORGE</div>
          <Link href="/command" style={goldBtn}>Command</Link>
          <Link href="/deal-rooms" style={btn}>Deal Rooms</Link>
          <Link href="/deal-create" style={btn}>Create Deal</Link>
          <Link href="/pain-intake" style={btn}>Pain Intake</Link>
          <Link href="/pain-rooms" style={btn}>Pain Rooms</Link>
          <Link href="/messages" style={btn}>Messages</Link>
          <Link href="/profile" style={btn}>Profile</Link>
          <Link href="/logout" style={redBtn}>Logout</Link>
        </nav>

        <section style={card}>
          <div style={eyebrow}>Command Center</div>
          <h1 style={h1}>Live intelligence first.</h1>
          <p style={sub}>Active rooms stay on the desk. Saved, archived, and deleted rooms move into clean folders.</p>
        </section>

        <section style={card}>
          <div style={eyebrow}>VaultForge Alert Desk</div>
          <h2 style={h2}>Active work only.</h2>
          <div style={grid}>
            <Summary title="New Deals" count={counts.dealActive} href="/deal-rooms" />
            <Summary title="New Pain" count={counts.painActive} href="/pain-rooms" />
            <Summary title="Messages" count={0} href="/messages" />
          </div>
        </section>

        <section style={card}>
          <div style={eyebrow}>5S Room Folders</div>
          <h2 style={h2}>Saved, archived, deleted.</h2>
          <div style={grid}>
            <FolderCard title="Saved Rooms" dealCount={counts.dealSaved} painCount={counts.painSaved} href="/saved-rooms" />
            <FolderCard title="Archived Rooms" dealCount={counts.dealArchived} painCount={counts.painArchived} href="/archived-rooms" />
            <FolderCard title="Deleted Rooms" dealCount={counts.dealDeleted} painCount={counts.painDeleted} href="/deleted-rooms" />
          </div>
        </section>

        <section style={grid}>
          <section style={card}>
            <div style={eyebrow}>Active Deal Alerts</div>
            {activeDeals.length ? activeDeals.map((room) => (
              <RoomMini key={roomId(room)} kind="deal" room={room} />
            )) : <p style={sub}>No active deal alerts.</p>}
          </section>

          <section style={card}>
            <div style={eyebrow}>Active Pain Alerts</div>
            {activePains.length ? activePains.map((room) => (
              <RoomMini key={roomId(room)} kind="pain" room={room} />
            )) : <p style={sub}>No active pain alerts.</p>}
          </section>
        </section>
      </div>
    </main>
  );
}

function Summary({ title, count, href }: { title: string; count: number; href: string }) {
  return (
    <Link href={href} style={{...roomCard, textDecoration: "none", color: "#f7f7fb"}}>
      <div style={eyebrow}>{title}</div>
      <div style={{fontSize: 52, fontWeight: 950}}>{count}</div>
      <p style={muted}>active total</p>
    </Link>
  );
}

function FolderCard({ title, dealCount, painCount, href }: { title: string; dealCount: number; painCount: number; href: string }) {
  return (
    <Link href={href} style={{...roomCard, textDecoration: "none", color: "#f7f7fb"}}>
      <div style={eyebrow}>{title}</div>
      <h2 style={roomTitle}>{dealCount + painCount} total</h2>
      <p style={muted}>Deals: {dealCount} • Pain: {painCount}</p>
      <span style={goldBtn}>Open Folder</span>
    </Link>
  );
}

function RoomMini({ room, kind }: { room: RoomRecord; kind: RoomKind }) {
  return (
    <Link href={hrefFor(kind, room)} style={{...roomCard, display: "block", textDecoration: "none", color: "#f7f7fb", marginBottom: 14}}>
      <div style={eyebrow}>{kind === "deal" ? "New Deal" : "New Pain"}</div>
      <h3 style={roomTitle}>{titleFor(room, kind)}</h3>
      <p style={muted}>{locationFor(room)}</p>
    </Link>
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

