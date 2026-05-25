"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type RoomKind = "deal" | "pain";
type RoomStatus = "active" | "saved" | "archived" | "sold" | "resolved" | "deleted";
type View = RoomStatus | "all" | "deal" | "pain" | "cleanup" | "dealSaved" | "dealArchived" | "dealDeleted" | "painSaved" | "painArchived" | "painDeleted";

type Room = {
  id: string;
  kind: RoomKind;
  title: string;
  city: string;
  county: string;
  state: string;
  asset: string;
  strategy: string;
  status: RoomStatus;
  message: string;
  updatedAt: string;
  source: string;
};

const ROOM_STORE = "vaultforge_my_rooms_clean_v2";
const MEMBER_ROOMS_STORE = "vaultforge_member_rooms_v1";
const COMMAND_ROOMS_STORE = "vaultforge_command_rooms_v1";
const FOREVER_STORE = "vaultforge_my_rooms_deleted_forever_v2";

const CANONICAL_MEMBER_ROOM_STORES = [
  ROOM_STORE,
  MEMBER_ROOMS_STORE,
  COMMAND_ROOMS_STORE,
  "vaultforge_command_deal_rooms_v1",
  "vaultforge_command_pain_rooms_v1",
  "vaultforge_owned_rooms_v1",
  "vaultforge_owned_deal_rooms_v1",
  "vaultforge_owned_pain_rooms_v1",
];

const wrap: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at 18% 10%, rgba(245,197,66,.12), transparent 32%), radial-gradient(circle at 86% 8%, rgba(120,0,30,.18), transparent 34%), #05070b",
  color: "#f7f8ff",
  padding: "28px 20px 84px",
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
};

const shell: React.CSSProperties = { maxWidth: 1180, margin: "0 auto" };

const nav: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 12,
  alignItems: "center",
  marginBottom: 22,
};

const brand: React.CSSProperties = {
  color: "#ffda5e",
  fontWeight: 1000,
  fontSize: 28,
  letterSpacing: "-.04em",
  marginRight: 10,
};

const btn: React.CSSProperties = {
  border: "1px solid rgba(207,216,230,.18)",
  background: "rgba(18,24,38,.92)",
  color: "#f7f8ff",
  borderRadius: 999,
  padding: "12px 18px",
  fontWeight: 900,
  textDecoration: "none",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};

const goldBtn: React.CSSProperties = {
  ...btn,
  background: "linear-gradient(135deg,#ffe16a,#f4bf37)",
  color: "#080a10",
  border: "1px solid rgba(255,220,90,.65)",
};

const redBtn: React.CSSProperties = {
  ...btn,
  background: "rgba(90,10,18,.72)",
  color: "#ffb2b2",
  border: "1px solid rgba(255,65,65,.65)",
};

const card: React.CSSProperties = {
  border: "1px solid rgba(207,216,230,.16)",
  borderRadius: 26,
  background: "rgba(15,21,34,.88)",
  padding: 24,
  boxShadow: "0 18px 50px rgba(0,0,0,.24)",
  marginBottom: 20,
};

const goldCard: React.CSSProperties = {
  ...card,
  borderColor: "rgba(245,197,66,.42)",
  background:
    "linear-gradient(135deg,rgba(22,25,37,.96),rgba(33,31,20,.82))",
};

const panel: React.CSSProperties = {
  border: "1px solid rgba(207,216,230,.15)",
  borderRadius: 22,
  background: "rgba(17,23,36,.78)",
  padding: 20,
};

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))",
  gap: 14,
};

const row: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 12,
  alignItems: "center",
};

const eyebrow: React.CSSProperties = {
  color: "#ffda5e",
  textTransform: "uppercase",
  letterSpacing: ".34em",
  fontSize: 12,
  fontWeight: 1000,
};

const h1: React.CSSProperties = {
  fontSize: "clamp(42px,7vw,82px)",
  lineHeight: ".92",
  letterSpacing: "-.08em",
  margin: "12px 0",
  fontWeight: 1000,
};

const h2: React.CSSProperties = {
  fontSize: "clamp(30px,4.5vw,54px)",
  lineHeight: ".95",
  letterSpacing: "-.065em",
  margin: "10px 0",
  fontWeight: 1000,
};

const h3: React.CSSProperties = {
  fontSize: 28,
  lineHeight: 1,
  letterSpacing: "-.05em",
  margin: "8px 0",
  fontWeight: 1000,
};

const sub: React.CSSProperties = {
  color: "rgba(235,240,255,.78)",
  fontSize: 20,
  lineHeight: 1.45,
  margin: "8px 0",
};

const muted: React.CSSProperties = {
  color: "rgba(235,240,255,.68)",
  fontSize: 15,
  lineHeight: 1.45,
  margin: "6px 0",
};

function parse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function clean(value: unknown, fallback = "") {
  const text = String(value || "")
    .replace(/\\n/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text || fallback;
}

function cleanLower(value: unknown) {
  return clean(value).toLowerCase();
}

function badText(value: unknown) {
  const text = cleanLower(value);
  return (
    !text ||
    text === "na" ||
    text === "n/a" ||
    text === "not listed" ||
    text === "untitled" ||
    text === "untitled room" ||
    text === "undefined" ||
    text === "null"
  );
}

function statusFrom(raw: unknown): RoomStatus {
  const value = String(raw || "active").toLowerCase();
  if (value.includes("save")) return "saved";
  if (value.includes("archive")) return "archived";
  if (value.includes("sold")) return "sold";
  if (value.includes("resolve")) return "resolved";
  if (value.includes("delete") || value.includes("trash")) return "deleted";
  return "active";
}

function kindFrom(item: any): RoomKind {
  const text = `${item?.kind || ""} ${item?.roomType || ""} ${item?.source || ""} ${item?.problemType || ""} ${item?.need || ""}`.toLowerCase();
  if (text.includes("pain") || text.includes("problem") || text.includes("distress")) return "pain";
  return "deal";
}

function foreverIds() {
  if (typeof window === "undefined") return [];
  return parse<string[]>(window.localStorage.getItem(FOREVER_STORE), []);
}

function saveForeverIds(ids: string[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(FOREVER_STORE, JSON.stringify(Array.from(new Set(ids))));
}

function collect(value: any): any[] {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== "object") return [];
  const rows: any[] = [];
  Object.values(value).forEach((item) => {
    if (Array.isArray(item)) rows.push(...item);
  });
  if (value.id || value.roomId || value.title || value.name || value.subject) rows.push(value);
  return rows;
}

function listText(value: unknown) {
  if (Array.isArray(value)) return value.map((item) => clean(item)).filter(Boolean).join(" • ");
  return clean(value);
}

function isValidMemberRoom(item: any) {
  if (!item || typeof item !== "object") return false;

  const id = clean(item.id || item.roomId || item.slug);
  const title = clean(item.title || item.name || item.projectName || item.propertyName || item.subject || item.address);
  const city = clean(item.city || item.market || item.propertyCity);
  const state = clean(item.state || item.propertyState || item.marketState);
  const message = clean(item.message || item.summary || item.notes || item.description || item.analyzer || item.problem);
  const workspace = cleanLower(item.workspace);
  const visibility = cleanLower(item.visibility);
  const source = cleanLower(item.source);
  const owner = clean(item.ownerEmail || item.createdByEmail || item.memberEmail || item.ownerId || item.createdBy);
  const correctWorkspace =
    workspace === "member-command" ||
    workspace === "member" ||
    visibility === "member" ||
    source === "deal-create" ||
    source === "pain-intake" ||
    source.includes("my-rooms") ||
    source.includes("member");

  if (!id) return false;
  if (badText(title)) return false;
  if (!correctWorkspace) return false;
  if (!owner && !message) return false;
  if (badText(city) && badText(state) && !message) return false;

  return true;
}

function roomFrom(item: any, source: string): Room | null {
  if (!isValidMemberRoom(item)) return null;

  const id = clean(item.id || item.roomId || item.slug);
  const title = clean(item.title || item.name || item.projectName || item.propertyName || item.subject || item.address);
  const kind = kindFrom(item);
  const status = statusFrom(item.status || item.folder || item.roomStatus || item.workspaceStatus || item.memberRoomStatus);

  return {
    id,
    kind,
    title,
    city: clean(item.city || item.market || item.propertyCity),
    county: clean(item.county || item.propertyCounty),
    state: clean(item.state || item.propertyState || item.marketState),
    asset: clean(item.asset || item.assetClass || item.assetType || item.propertyType || item.category || item.problemType, "Not listed"),
    strategy: listText(item.strategy || item.dealStrategy || item.need || item.problemType) || "Not listed",
    status,
    message: clean(item.message || item.summary || item.notes || item.description || item.analyzer || item.problem, "No room notes listed."),
    updatedAt: clean(item.updatedAt || item.updated_at || item.createdAt || item.created_at || new Date().toISOString(), new Date().toISOString()),
    source,
  };
}

function readRows(key: string) {
  if (typeof window === "undefined") return [] as any[];
  const parsed = parse<any>(window.localStorage.getItem(key), []);
  return collect(parsed);
}

function writeRows(key: string, rows: any[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(rows));
}

function loadRooms(): Room[] {
  if (typeof window === "undefined") return [];

  const deletedForever = new Set(foreverIds());
  const rooms: Room[] = [];

  CANONICAL_MEMBER_ROOM_STORES.forEach((key) => {
    const sourceRows = readRows(key);

    const validRows = sourceRows.filter((item) => {
      const id = clean(item?.id || item?.roomId || item?.slug);
      return id && !deletedForever.has(id) && isValidMemberRoom(item);
    });

    if (validRows.length !== sourceRows.length) {
      writeRows(key, validRows);
    }

    validRows.forEach((item) => {
      const room = roomFrom(item, key);
      if (room) rooms.push(room);
    });
  });

  const unique = new Map<string, Room>();
  rooms.forEach((room) => {
    const previous = unique.get(room.id);
    if (!previous || previous.updatedAt < room.updatedAt) {
      unique.set(room.id, room);
    }
  });

  return Array.from(unique.values()).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

function saveRooms(rooms: Room[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ROOM_STORE, JSON.stringify(rooms));
}

function updateCanonicalRoomStatus(id: string, status: RoomStatus) {
  if (typeof window === "undefined") return;

  CANONICAL_MEMBER_ROOM_STORES.forEach((key) => {
    const rows = readRows(key);
    let changed = false;
    const next = rows.map((item) => {
      const itemId = clean(item?.id || item?.roomId || item?.slug);
      if (itemId !== id) return item;
      changed = true;
      return {
        ...item,
        status,
        roomStatus: status,
        memberRoomStatus: status,
        workspaceStatus: status,
        updatedAt: new Date().toISOString(),
      };
    });
    if (changed) writeRows(key, next);
  });
}

function statusLabel(status: RoomStatus) {
  if (status === "active") return "Active";
  if (status === "saved") return "Saved";
  if (status === "archived") return "Archived";
  if (status === "sold") return "Sold";
  if (status === "resolved") return "Resolved";
  return "Deleted";
}

function roomLocation(room: Room) {
  return [room.city, room.county, room.state].filter(Boolean).join(", ") || "Location not listed";
}

function roomHref(room: Room) {
  const encoded = encodeURIComponent(room.id);
  return room.kind === "pain" ? `/pain-rooms/${encoded}` : `/deal-rooms/${encoded}`;
}

function Tile({
  title,
  count,
  note,
  active,
  danger,
  onClick,
}: {
  title: string;
  count: number;
  note: string;
  active: boolean;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...panel,
        minHeight: 154,
        cursor: "pointer",
        textAlign: "left",
        borderColor: active
          ? danger
            ? "rgba(255,65,65,.70)"
            : "rgba(245,197,66,.72)"
          : "rgba(207,216,230,.15)",
      }}
    >
      <div style={eyebrow}>{title}</div>
      <h2 style={{ ...h2, color: count ? "#1e90ff" : "#f7f8ff" }}>{count}</h2>
      <p style={muted}>{note}</p>
      <p style={{ ...muted, color: "#ffd45a", fontWeight: 950 }}>Open</p>
    </button>
  );
}

function RoomCard({
  room,
  moveRoom,
  deleteForever,
}: {
  room: Room;
  moveRoom: (id: string, status: RoomStatus) => void;
  deleteForever: (id: string) => void;
}) {
  return (
    <article style={{ ...panel, borderColor: room.status === "deleted" ? "rgba(255,65,65,.58)" : "rgba(245,197,66,.42)" }}>
      <div style={eyebrow}>
        {room.kind === "deal" ? "Deal Room" : "Pain Room"} • {statusLabel(room.status)}
      </div>

      <h3 style={h3}>{room.title}</h3>
      <p style={sub}>{roomLocation(room)}</p>
      <p style={muted}>
        {room.asset} • {room.strategy}
      </p>
      <p style={muted}>{room.message}</p>
      <p style={muted}>Last updated: {room.updatedAt}</p>

      <div style={{ ...row, marginTop: 14 }}>
        <Link href={roomHref(room)} style={goldBtn}>
          Open Room
        </Link>
        <button type="button" style={goldBtn} onClick={() => moveRoom(room.id, "active")}>
          Restore Active
        </button>
        <button type="button" style={btn} onClick={() => moveRoom(room.id, "saved")}>
          Save
        </button>
        <button type="button" style={btn} onClick={() => moveRoom(room.id, "archived")}>
          Archive
        </button>
        <button type="button" style={btn} onClick={() => moveRoom(room.id, "sold")}>
          Mark Sold
        </button>
        <button type="button" style={btn} onClick={() => moveRoom(room.id, "resolved")}>
          Resolve
        </button>
        <button type="button" style={redBtn} onClick={() => moveRoom(room.id, "deleted")}>
          Delete
        </button>
        {room.status === "deleted" ? (
          <button type="button" style={redBtn} onClick={() => deleteForever(room.id)}>
            Delete Forever
          </button>
        ) : null}
      </div>
    </article>
  );
}

export default function MyRoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [view, setView] = useState<View>("all");

  useEffect(() => {
    const loaded = loadRooms();
    setRooms(loaded);
    saveRooms(loaded);

    function refresh() {
      const next = loadRooms();
      setRooms(next);
      saveRooms(next);
    }

    window.addEventListener("storage", refresh);
    window.addEventListener("vaultforge-command-room-change", refresh);
    window.addEventListener("vaultforge-room-state-change", refresh);
    window.addEventListener("vaultforge-deal-change", refresh);
    window.addEventListener("vaultforge-pain-change", refresh);

    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("vaultforge-command-room-change", refresh);
      window.removeEventListener("vaultforge-room-state-change", refresh);
      window.removeEventListener("vaultforge-deal-change", refresh);
      window.removeEventListener("vaultforge-pain-change", refresh);
    };
  }, []);

  const grouped = useMemo(() => {
    return {
      all: rooms,
      deal: rooms.filter((room) => room.kind === "deal" && room.status === "active"),
      pain: rooms.filter((room) => room.kind === "pain" && room.status === "active"),
      active: rooms.filter((room) => room.status === "active"),
      saved: rooms.filter((room) => room.status === "saved"),
      archived: rooms.filter((room) => room.status === "archived"),
      sold: rooms.filter((room) => room.status === "sold"),
      resolved: rooms.filter((room) => room.status === "resolved"),
      deleted: rooms.filter((room) => room.status === "deleted"),
      cleanup: rooms.filter((room) => ["saved", "archived", "sold", "resolved", "deleted"].includes(room.status)),
      dealSaved: rooms.filter((room) => room.kind === "deal" && room.status === "saved"),
      dealArchived: rooms.filter((room) => room.kind === "deal" && room.status === "archived"),
      dealDeleted: rooms.filter((room) => room.kind === "deal" && room.status === "deleted"),
      painSaved: rooms.filter((room) => room.kind === "pain" && room.status === "saved"),
      painArchived: rooms.filter((room) => room.kind === "pain" && room.status === "archived"),
      painDeleted: rooms.filter((room) => room.kind === "pain" && room.status === "deleted"),
    };
  }, [rooms]);

  const visible =
    view === "all"
      ? grouped.active
      : view === "deal"
        ? grouped.deal
        : view === "pain"
          ? grouped.pain
          : view === "cleanup"
            ? grouped.cleanup
            : view === "dealSaved"
              ? grouped.dealSaved
              : view === "dealArchived"
                ? grouped.dealArchived
                : view === "dealDeleted"
                  ? grouped.dealDeleted
                  : view === "painSaved"
                    ? grouped.painSaved
                    : view === "painArchived"
                      ? grouped.painArchived
                      : view === "painDeleted"
                        ? grouped.painDeleted
                        : grouped[view];

  function moveRoom(id: string, status: RoomStatus) {
    updateCanonicalRoomStatus(id, status);

    const next = loadRooms();
    setRooms(next);
    saveRooms(next);

    if (["saved", "archived", "sold", "resolved", "deleted"].includes(status)) {
      setView(status);
    } else {
      setView("active");
    }
  }

  function deleteForever(id: string) {
    saveForeverIds([...foreverIds(), id]);

    const next = loadRooms().filter((room) => room.id !== id);
    setRooms(next);
    saveRooms(next);
    setView("deleted");
  }

  return (
    <main style={wrap}>
      <div style={shell}>
        <nav style={nav}>
          <div style={brand}>VAULTFORGE</div>
          <Link href="/command" style={btn}>Command</Link>
          <Link href="/member-controlled-threads" style={btn}>Request Desk</Link>
          <Link href="/messages" style={btn}>Messages</Link>
          <Link href="/network" style={btn}>Network</Link>
          <Link href="/profile" style={btn}>Profile</Link>
          <Link href="/logout" style={redBtn}>Logout</Link>
        </nav>

        <section style={goldCard}>
          <div style={eyebrow}>My Rooms</div>
          <h1 style={h1}>Member workspace cleanup.</h1>
          <p style={sub}>
            My Rooms now reads only canonical member-room stores. Legacy duplicate Untitled/NA cards are ignored and cleaned out.
          </p>
          <div style={{ ...row, marginTop: 16 }}>
            <Link href="/deal-create" style={goldBtn}>Create Deal</Link>
            <Link href="/pain-intake" style={goldBtn}>Create Pain</Link>
            <Link href="/state-map" style={btn}>State Map</Link>
          </div>
        </section>

        <section style={card}>
          <div style={eyebrow}>Room Groups</div>
          <h2 style={h2}>Clean groups. No mixed cards.</h2>

          <div style={{ ...grid, marginTop: 18 }}>
            <Tile title="Active Deal Rooms" count={grouped.deal.length} note="open deal opportunity rooms" active={view === "deal"} onClick={() => setView("deal")} />
            <Tile title="Active Pain Rooms" count={grouped.pain.length} note="open problem-solving rooms" active={view === "pain"} danger onClick={() => setView("pain")} />
            <Tile title="All Active Rooms" count={grouped.active.length} note="all rooms currently active" active={view === "active" || view === "all"} onClick={() => setView("active")} />
            <Tile title="Cleanup" count={grouped.cleanup.length} note="saved, archived, sold, resolved, and deleted" active={view === "cleanup"} onClick={() => setView("cleanup")} />
          </div>
        </section>

        <section style={card}>
          <div style={eyebrow}>Cleanup Folders</div>
          <h2 style={h2}>One place for inactive rooms.</h2>

          <div style={{ ...grid, marginTop: 18 }}>
            <Tile title="Deal Saved" count={grouped.dealSaved.length} note="saved deal rooms" active={view === "dealSaved"} onClick={() => setView("dealSaved")} />
            <Tile title="Deal Archived" count={grouped.dealArchived.length} note="archived deal rooms" active={view === "dealArchived"} onClick={() => setView("dealArchived")} />
            <Tile title="Deal Deleted" count={grouped.dealDeleted.length} note="deleted deal rooms" active={view === "dealDeleted"} danger onClick={() => setView("dealDeleted")} />
            <Tile title="Pain Saved" count={grouped.painSaved.length} note="saved pain rooms" active={view === "painSaved"} onClick={() => setView("painSaved")} />
            <Tile title="Pain Archived" count={grouped.painArchived.length} note="archived pain rooms" active={view === "painArchived"} onClick={() => setView("painArchived")} />
            <Tile title="Pain Deleted" count={grouped.painDeleted.length} note="deleted pain rooms" active={view === "painDeleted"} danger onClick={() => setView("painDeleted")} />
          </div>

          <div style={{ ...row, marginTop: 14 }}>
            <button type="button" style={view === "cleanup" ? goldBtn : btn} onClick={() => setView("cleanup")}>All Cleanup</button>
            <button type="button" style={view === "saved" ? goldBtn : btn} onClick={() => setView("saved")}>All Saved</button>
            <button type="button" style={view === "archived" ? goldBtn : btn} onClick={() => setView("archived")}>All Archived</button>
            <button type="button" style={view === "deleted" ? goldBtn : btn} onClick={() => setView("deleted")}>All Deleted</button>
          </div>
        </section>

        <section style={card}>
          <div style={eyebrow}>Selected Room Group</div>
          <h2 style={h2}>
            {view === "deal"
              ? "Active Deal Rooms"
              : view === "pain"
                ? "Active Pain Rooms"
                : view === "cleanup"
                  ? "Cleanup"
                  : view === "dealSaved"
                    ? "Saved Deal Rooms"
                    : view === "dealArchived"
                      ? "Archived Deal Rooms"
                      : view === "dealDeleted"
                        ? "Deleted Deal Rooms"
                        : view === "painSaved"
                          ? "Saved Pain Rooms"
                          : view === "painArchived"
                            ? "Archived Pain Rooms"
                            : view === "painDeleted"
                              ? "Deleted Pain Rooms"
                              : `${String(view).charAt(0).toUpperCase()}${String(view).slice(1)} Rooms`}
          </h2>

          {visible.length ? (
            <div style={grid}>
              {visible.map((room) => (
                <RoomCard key={room.id} room={room} moveRoom={moveRoom} deleteForever={deleteForever} />
              ))}
            </div>
          ) : (
            <div style={panel}>
              <h2 style={h2}>No rooms in this group.</h2>
              <p style={sub}>
                Only valid member-owned canonical rooms appear here. Old Untitled/NA duplicate rows are intentionally ignored.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
