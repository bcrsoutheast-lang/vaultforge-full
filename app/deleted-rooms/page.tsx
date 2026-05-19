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
  coverPhoto?: string;
  photoUrl?: string;
  imageUrl?: string;
  photos?: string[];
  photoUrls?: string[];
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
};

const DEAL_KEYS = ["vaultforge_clean_deal_rooms", "vaultforge_deal_rooms", "vaultforge_rooms_deals", "vf_deal_rooms"];
const PAIN_KEYS = ["vaultforge_clean_pain_rooms_v1", "vaultforge_clean_pain_rooms", "vaultforge_pain_rooms", "vaultforge_rooms_pain", "vf_pain_rooms"];
const STATE_KEYS = ["vaultforge_clean_room_states", "vaultforge_room_states", "vaultforge_deal_room_states", "vaultforge_pain_room_states", "vaultforge_5s_room_states"];

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
  return out
    .map((room) => {
      const id = rid(room);
      const state = states[id] || states[`${kind}:${id}`] || roomState(room);
      return { ...room, roomState: state, cleanupState: state, stateStatus: state };
    })
    .sort((a, b) => String(b.updatedAt || b.createdAt || "").localeCompare(String(a.updatedAt || a.createdAt || "")));
}

function setRoomState(kind: RoomKind, room: Room, state: RoomState) {
  if (!ok()) return;
  const id = rid(room);
  if (!id) return;
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
      {item("/saved-rooms", "Saved", "saved")}
      {item("/archived-rooms", "Archived", "archived")}
      {item("/deleted-rooms", "Deleted", "deleted")}
      <Link href="/logout" style={redBtn}>Logout</Link>
    </nav>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section style={card}><div style={eyebrow}>{title}</div>{children}</section>;
}

function RoomCard({ room, kind, refresh }: { room: Room; kind: RoomKind; refresh: () => void }) {
  const img = firstPhoto(room);
  const href = kind === "deal" ? `/deal-rooms/${encodeURIComponent(rid(room))}` : `/pain-rooms/${encodeURIComponent(rid(room))}`;

  return (
    <div style={panel}>
      {img ? <img src={img} alt={titleFor(room, kind)} style={photoStyle} /> : null}
      <div style={eyebrow}>{kind === "deal" ? "Opportunity" : "Pain"} • {roomState(room)}</div>
      <h2 style={h2}>{titleFor(room, kind)}</h2>
      <p style={sub}>{loc(room)}</p>
      <p style={muted}>
        {kind === "deal"
          ? `${txt(room.assetClass, "Asset")} • ${txt(room.propertyType, "Type")} • Route: ${list(room.routeTo).join(", ") || "Buyer"}`
          : `${list(room.painTypes).join(", ") || "Problem"} • Needs: ${list(room.routingNeeds).join(", ") || "Solver"} • Severity: ${txt(room.severity, "N/A")}`}
      </p>
      <div style={{ ...row, marginTop: 16 }}>
        <Link href={href} style={goldBtn}>Open</Link>
        <button type="button" style={btn} onClick={() => { setRoomState(kind, room, "active"); refresh(); }}>Restore Active</button>
        <button type="button" style={btn} onClick={() => { setRoomState(kind, room, "saved"); refresh(); }}>Save</button>
        <button type="button" style={btn} onClick={() => { setRoomState(kind, room, "archived"); refresh(); }}>Archive</button>
        <button type="button" style={redBtn} onClick={() => { setRoomState(kind, room, "deleted"); refresh(); }}>Delete</button>
      </div>
    </div>
  );
}

const TARGET_STATE: RoomState = "deleted" as RoomState;
const PAGE_TITLE = "Deleted";

export default function FolderPage() {
  const [tick, setTick] = useState(0);
  const [openKind, setOpenKind] = useState<RoomKind | "">("");

  useEffect(() => {
    const refresh = () => setTick((x) => x + 1);
    window.addEventListener("storage", refresh);
    window.addEventListener("vaultforge-room-state-change", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("vaultforge-room-state-change", refresh);
    };
  }, []);

  const deals = useMemo(() => allRooms("deal").filter((room) => roomState(room) === TARGET_STATE), [tick]);
  const pains = useMemo(() => allRooms("pain").filter((room) => roomState(room) === TARGET_STATE), [tick]);
  const shownRooms = openKind === "deal" ? deals : openKind === "pain" ? pains : [];

  function refresh() {
    setTick((x) => x + 1);
  }

  return (
    <main style={page}>
      <div style={wrap}>
        <Nav active={TARGET_STATE} />

        <section style={hero}>
          <div style={eyebrow}>{PAGE_TITLE}</div>
          <h1 style={h1}>{PAGE_TITLE} rooms.</h1>
          <p style={sub}>Count cards first. Click Deal or Pain to open only that folder.</p>
        </section>

        <Section title="Folder Cards">
          <div style={grid}>
            <button type="button" onClick={() => setOpenKind(openKind === "deal" ? "" : "deal")} style={openKind === "deal" ? activePanel : panel}>
              <div style={eyebrow}>Deal {PAGE_TITLE}</div>
              <h2 style={h2}>{deals.length}</h2>
              <p style={muted}>{openKind === "deal" ? "Click to collapse" : "Click to open"}</p>
            </button>

            <button type="button" onClick={() => setOpenKind(openKind === "pain" ? "" : "pain")} style={openKind === "pain" ? activePanel : panel}>
              <div style={eyebrow}>Pain {PAGE_TITLE}</div>
              <h2 style={h2}>{pains.length}</h2>
              <p style={muted}>{openKind === "pain" ? "Click to collapse" : "Click to open"}</p>
            </button>
          </div>
        </Section>

        {openKind ? (
          <Section title={`${openKind === "deal" ? "Deal" : "Pain"} ${PAGE_TITLE}`}>
            {shownRooms.length ? (
              <div style={grid}>{shownRooms.map((room) => <RoomCard key={rid(room)} room={room} kind={openKind} refresh={refresh} />)}</div>
            ) : (
              <p style={sub}>No {openKind} rooms in {PAGE_TITLE}.</p>
            )}
          </Section>
        ) : null}
      </div>
    </main>
  );
}
