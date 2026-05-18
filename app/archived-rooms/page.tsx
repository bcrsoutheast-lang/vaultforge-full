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
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
};

const TARGET: RoomState = "archived";
const LABEL = "Archived";

const DEAL_KEYS = [
  "vaultforge_clean_deal_rooms",
  "vaultforge_deal_rooms",
  "vaultforge_rooms_deals",
  "vf_deal_rooms",
];

const PAIN_KEYS = [
  "vaultforge_clean_pain_rooms_v1",
  "vaultforge_clean_pain_rooms",
  "vaultforge_pain_rooms",
  "vaultforge_rooms_pain",
  "vf_pain_rooms",
];

const ROOM_STATE_KEYS = [
  "vaultforge_clean_room_states",
  "vaultforge_room_states",
  "vaultforge_deal_room_states",
  "vaultforge_pain_room_states",
  "vaultforge_5s_room_states",
];

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

function readArray(key: string): RoomRecord[] {
  if (!hasBrowser()) return [];
  const parsed = parseJson<unknown>(window.localStorage.getItem(key), []);
  return Array.isArray(parsed) ? (parsed as RoomRecord[]) : [];
}

function readStates(): Record<string, RoomState> {
  if (!hasBrowser()) return {};

  const merged: Record<string, RoomState> = {};

  for (const key of ROOM_STATE_KEYS) {
    Object.assign(
      merged,
      parseJson<Record<string, RoomState>>(window.localStorage.getItem(key), {})
    );
  }

  return merged;
}

function writeStates(states: Record<string, RoomState>) {
  if (!hasBrowser()) return;

  for (const key of ROOM_STATE_KEYS) {
    window.localStorage.setItem(key, JSON.stringify(states));
  }
}

function roomState(room: RoomRecord, kind: RoomKind): RoomState {
  const states = readStates();
  const id = roomId(room);
  const status =
    states[`${kind}:${id}`] ||
    states[id] ||
    room.roomState ||
    room.cleanupState ||
    room.stateStatus ||
    "active";

  if (status === "saved" || status === "archived" || status === "deleted") {
    return status;
  }

  return "active";
}

function readRooms(kind: RoomKind) {
  if (!hasBrowser()) return [];

  const keys = kind === "deal" ? DEAL_KEYS : PAIN_KEYS;
  const map = new Map<string, RoomRecord>();

  for (const key of keys) {
    for (const room of readArray(key)) {
      const id = roomId(room);
      if (id && !map.has(id)) {
        map.set(id, { ...room, id });
      }
    }
  }

  for (let i = 0; i < window.localStorage.length; i += 1) {
    const key = window.localStorage.key(i) || "";

    const isDeal =
      kind === "deal" &&
      (key.startsWith("vaultforge_clean_deal_room_") ||
        key.startsWith("vaultforge_deal_room_"));

    const isPain =
      kind === "pain" &&
      (key.startsWith("vaultforge_clean_pain_room_") ||
        key.startsWith("vaultforge_pain_room_"));

    if (!isDeal && !isPain) continue;

    const room = parseJson<RoomRecord | null>(
      window.localStorage.getItem(key),
      null
    );

    const id = roomId(room);
    if (room && id && !map.has(id)) {
      map.set(id, { ...room, id });
    }
  }

  return Array.from(map.values()).filter((room) => roomState(room, kind) === TARGET);
}

function syncState(room: RoomRecord, kind: RoomKind, state: RoomState) {
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

  const keys = kind === "deal" ? DEAL_KEYS : PAIN_KEYS;

  window.localStorage.setItem(`vaultforge_clean_${kind}_room_${id}`, JSON.stringify(next));
  window.localStorage.setItem(`vaultforge_${kind}_room_${id}`, JSON.stringify(next));

  for (const key of keys) {
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

function deleteForever(room: RoomRecord, kind: RoomKind) {
  if (!hasBrowser()) return;

  const ok = window.confirm(
    `Delete "${cleanText(room.title || room.name, "room")}" forever from local storage?`
  );

  if (!ok) return;

  const id = roomId(room);
  if (!id) return;

  const keys = kind === "deal" ? DEAL_KEYS : PAIN_KEYS;

  window.localStorage.removeItem(`vaultforge_clean_${kind}_room_${id}`);
  window.localStorage.removeItem(`vaultforge_${kind}_room_${id}`);

  for (const key of keys) {
    const rows = readArray(key).filter((item) => roomId(item) !== id);
    window.localStorage.setItem(key, JSON.stringify(rows));
  }

  const states = readStates();
  delete states[id];
  delete states[`${kind}:${id}`];
  writeStates(states);

  window.dispatchEvent(new Event("storage"));
  window.dispatchEvent(new Event("vaultforge-room-state-change"));
  window.dispatchEvent(new Event(kind === "deal" ? "vaultforge-deal-change" : "vaultforge-pain-change"));
}

function href(kind: RoomKind, room: RoomRecord) {
  return kind === "deal"
    ? `/deal-rooms/${encodeURIComponent(roomId(room))}`
    : `/pain-rooms/${encodeURIComponent(roomId(room))}`;
}

function location(room: RoomRecord) {
  return [cleanText(room.city), cleanText(room.county), cleanText(room.state)]
    .filter(Boolean)
    .join(", ") || "Market not listed";
}

export default function RoomFolderPage() {
  const [loaded, setLoaded] = useState(false);
  const [deals, setDeals] = useState<RoomRecord[]>([]);
  const [pains, setPains] = useState<RoomRecord[]>([]);

  function load() {
    if (!hasBrowser()) return;
    setDeals(readRooms("deal"));
    setPains(readRooms("pain"));
    setLoaded(true);
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

  return (
    <main style={page}>
      <div style={wrap}>
        <nav style={nav}>
          <Link href="/command" style={btn}>Command</Link>
          <Link href="/deal-rooms" style={btn}>Deal Rooms</Link>
          <Link href="/pain-rooms" style={btn}>Pain Rooms</Link>
          <Link href="/messages" style={btn}>Messages</Link>
          <Link href="/saved-rooms" style={TARGET === "saved" ? goldBtn : btn}>Saved</Link>
          <Link href="/archived-rooms" style={TARGET === "archived" ? goldBtn : btn}>Archived</Link>
          <Link href="/deleted-rooms" style={TARGET === "deleted" ? goldBtn : btn}>Deleted</Link>
          <Link href="/logout" style={redBtn}>Logout</Link>
        </nav>

        <section style={card}>
          <div style={eyebrow}>{LABEL}</div>
          <h1 style={h1}>{LABEL} rooms.</h1>
          <p style={sub}>
            Deal and Pain rooms moved out of Active stay here until restored or deleted forever.
          </p>
        </section>

        {!loaded ? (
          <section style={card}>
            <p style={sub}>Loading local room folder...</p>
          </section>
        ) : null}

        <RoomSection
          title="Deal Rooms"
          kind="deal"
          rooms={deals}
          onMove={(room, kind, state) => {
            syncState(room, kind, state);
            load();
          }}
          onDeleteForever={(room, kind) => {
            deleteForever(room, kind);
            load();
          }}
        />

        <RoomSection
          title="Pain Rooms"
          kind="pain"
          rooms={pains}
          onMove={(room, kind, state) => {
            syncState(room, kind, state);
            load();
          }}
          onDeleteForever={(room, kind) => {
            deleteForever(room, kind);
            load();
          }}
        />
      </div>
    </main>
  );
}

function RoomSection({
  title,
  kind,
  rooms,
  onMove,
  onDeleteForever,
}: {
  title: string;
  kind: RoomKind;
  rooms: RoomRecord[];
  onMove: (room: RoomRecord, kind: RoomKind, state: RoomState) => void;
  onDeleteForever: (room: RoomRecord, kind: RoomKind) => void;
}) {
  return (
    <section style={card}>
      <div style={eyebrow}>
        {title} ({rooms.length})
      </div>

      {!rooms.length ? (
        <p style={sub}>No {title.toLowerCase()} in this folder.</p>
      ) : null}

      <div style={grid}>
        {rooms.map((room) => (
          <article key={`${kind}-${roomId(room)}`} style={roomCard}>
            <div style={miniEyebrow}>
              {kind === "deal" ? "Deal Room" : "Pain Room"}
            </div>

            <h2 style={roomTitle}>
              {cleanText(
                room.title || room.name,
                kind === "deal" ? "Untitled Deal" : "Untitled Pain"
              )}
            </h2>

            <p style={muted}>{location(room)}</p>

            <div style={actionRow}>
              <Link href={href(kind, room)} style={goldBtn}>Open Room</Link>
              <button type="button" onClick={() => onMove(room, kind, "active")} style={btn}>Restore Active</button>
              <button type="button" onClick={() => onMove(room, kind, "saved")} style={btn}>Save</button>
              <button type="button" onClick={() => onMove(room, kind, "archived")} style={btn}>Archive</button>
              <button type="button" onClick={() => onMove(room, kind, "deleted")} style={redBtn}>Delete</button>
              {TARGET === "deleted" ? (
                <button type="button" onClick={() => onDeleteForever(room, kind)} style={dangerBtn}>
                  Delete Forever
                </button>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

const page: React.CSSProperties = {
  minHeight: "100vh",
  background: "#05070d",
  color: "#f7f7fb",
  padding: 18,
  fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
};

const wrap: React.CSSProperties = {
  maxWidth: 1180,
  margin: "0 auto",
  paddingBottom: 70,
};

const nav: React.CSSProperties = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  marginBottom: 18,
};

const card: React.CSSProperties = {
  background: "linear-gradient(180deg,#080d19,#050816)",
  border: "1px solid rgba(245,197,66,.28)",
  borderRadius: 26,
  padding: 28,
  marginBottom: 22,
};

const eyebrow: React.CSSProperties = {
  color: "#ffd45a",
  textTransform: "uppercase",
  letterSpacing: 8,
  fontWeight: 900,
  fontSize: 19,
  marginBottom: 14,
};

const miniEyebrow: React.CSSProperties = {
  color: "#ffd45a",
  textTransform: "uppercase",
  letterSpacing: 5,
  fontWeight: 900,
  fontSize: 13,
  marginBottom: 10,
};

const h1: React.CSSProperties = {
  fontSize: "clamp(42px,7vw,76px)",
  lineHeight: 0.92,
  letterSpacing: -4,
  margin: "0 0 18px",
  fontWeight: 950,
};

const sub: React.CSSProperties = {
  color: "#c9d0dc",
  fontSize: 22,
  lineHeight: 1.35,
  margin: 0,
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

const goldBtn: React.CSSProperties = {
  ...btn,
  border: 0,
  background: "#ffdc68",
  color: "#10131a",
};

const redBtn: React.CSSProperties = {
  ...btn,
  background: "#271016",
  borderColor: "rgba(255,70,70,.48)",
  color: "#ffaaaa",
};

const dangerBtn: React.CSSProperties = {
  ...btn,
  background: "#3a080d",
  borderColor: "rgba(255,30,30,.75)",
  color: "#ffc9c9",
};

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))",
  gap: 16,
};

const roomCard: React.CSSProperties = {
  background: "#121724",
  border: "1px solid rgba(207,216,230,.14)",
  borderRadius: 22,
  padding: 22,
};

const roomTitle: React.CSSProperties = {
  fontSize: 30,
  margin: "0 0 10px",
  lineHeight: 1,
};

const muted: React.CSSProperties = {
  color: "#aeb7c7",
  margin: "0 0 14px",
};

const actionRow: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 10,
};
