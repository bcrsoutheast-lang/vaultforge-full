"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type RoomKind = "deal" | "pain";
type RoomStatus = "active" | "saved" | "archived" | "sold" | "resolved" | "deleted";

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
const FOREVER_STORE = "vaultforge_my_rooms_deleted_forever_v2";

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

function clean(value: unknown, fallback = "Not listed") {
  const text = String(value || "").trim();
  return text || fallback;
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

function kindFrom(item: any, key: string): RoomKind {
  const text = `${key} ${JSON.stringify(item || {})}`.toLowerCase();
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
  if (value.id || value.title || value.name || value.subject) rows.push(value);
  return rows;
}

function loadRooms(): Room[] {
  if (typeof window === "undefined") return [];

  const deletedForever = new Set(foreverIds());

  const keys = new Set<string>([
    ROOM_STORE,
    "vaultforge_rooms_v1",
    "vaultforge_deal_rooms_v1",
    "vaultforge_pain_rooms_v1",
    "vaultforge_member_rooms_v1",
    "vaultforge_property_cards_v1",
    "vaultforge_projects_v1",
    "vaultforge_deals_v1",
    "vaultforge_pain_requests_v1",
  ]);

  for (let i = 0; i < window.localStorage.length; i += 1) {
    const key = window.localStorage.key(i) || "";
    const lower = key.toLowerCase();
    if (
      lower.includes("room") ||
      lower.includes("deal") ||
      lower.includes("pain") ||
      lower.includes("project") ||
      lower.includes("property")
    ) {
      keys.add(key);
    }
  }

  const rows: Room[] = [];

  Array.from(keys).forEach((key) => {
    if (key === FOREVER_STORE) return;
    const parsed = parse<any>(window.localStorage.getItem(key), null);

    collect(parsed).forEach((item, index) => {
      if (!item || typeof item !== "object") return;

      const text = `${key} ${JSON.stringify(item)}`.toLowerCase();
      if (
        !text.includes("deal") &&
        !text.includes("room") &&
        !text.includes("pain") &&
        !text.includes("property") &&
        !text.includes("project")
      ) {
        return;
      }

      const id = clean(item.id || item.roomId || item.slug || `${key}-${index}`, `${key}-${index}`);
      if (deletedForever.has(id)) return;

      rows.push({
        id,
        kind: kindFrom(item, key),
        title: clean(item.title || item.name || item.projectName || item.propertyName || item.subject || "Untitled Room", "Untitled Room"),
        city: clean(item.city || item.market || item.propertyCity || "NA", "NA"),
        county: clean(item.county || item.propertyCounty || "", ""),
        state: clean(item.state || item.propertyState || item.marketState || "NA", "NA"),
        asset: clean(item.asset || item.assetType || item.propertyType || item.category || "Not listed", "Not listed"),
        strategy: clean(item.strategy || item.dealStrategy || item.need || item.problemType || "Not listed", "Not listed"),
        status: statusFrom(item.status || item.folder || item.roomStatus || item.workspaceStatus),
        message: clean(item.message || item.summary || item.notes || item.description || "No room notes listed.", "No room notes listed."),
        updatedAt: clean(item.updatedAt || item.updated_at || item.createdAt || item.created_at || new Date().toISOString(), new Date().toISOString()),
        source: key,
      });
    });
  });

  const unique = new Map<string, Room>();
  rows.forEach((room) => unique.set(room.id, room));

  return Array.from(unique.values()).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

function saveRooms(rooms: Room[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ROOM_STORE, JSON.stringify(rooms));
}

function statusLabel(status: RoomStatus) {
  if (status === "active") return "Active";
  if (status === "saved") return "Saved";
  if (status === "archived") return "Archived";
  if (status === "sold") return "Sold";
  if (status === "resolved") return "Resolved";
  return "Deleted";
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
      <p style={sub}>
        {[room.city, room.county, room.state].filter(Boolean).join(", ")}
      </p>
      <p style={muted}>
        {room.asset} • {room.strategy}
      </p>
      <p style={muted}>{room.message}</p>
      <p style={muted}>Last updated: {room.updatedAt}</p>

      <div style={{ ...row, marginTop: 14 }}>
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
  const [view, setView] = useState<RoomStatus | "all" | "deal" | "pain" | "cleanup">("all");

  useEffect(() => {
    const loaded = loadRooms();
    setRooms(loaded);
    saveRooms(loaded);
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
            : grouped[view];

  function moveRoom(id: string, status: RoomStatus) {
    const next = rooms.map((room) => (room.id === id ? { ...room, status, updatedAt: new Date().toISOString() } : room));
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

    const next = rooms.filter((room) => room.id !== id);
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
            Deal rooms and Pain rooms are separate. Cleanup is one operating area with saved, archived, sold, resolved, deleted, and delete forever.
          </p>
          <div style={{ ...row, marginTop: 16 }}>
            <Link href="/create-deal" style={goldBtn}>Create Deal</Link>
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
            <Tile title="Saved" count={grouped.saved.length} note="rooms kept for follow-up" active={view === "saved"} onClick={() => setView("saved")} />
            <Tile title="Archived" count={grouped.archived.length} note="hidden from active work but preserved" active={view === "archived"} onClick={() => setView("archived")} />
            <Tile title="Sold / Resolved" count={grouped.sold.length + grouped.resolved.length} note="closed outcome folders" active={view === "sold" || view === "resolved"} onClick={() => setView("sold")} />
            <Tile title="Deleted" count={grouped.deleted.length} note="trash folder with delete forever" active={view === "deleted"} danger onClick={() => setView("deleted")} />
          </div>

          <div style={{ ...row, marginTop: 14 }}>
            <button type="button" style={view === "cleanup" ? goldBtn : btn} onClick={() => setView("cleanup")}>All Cleanup</button>
            <button type="button" style={view === "saved" ? goldBtn : btn} onClick={() => setView("saved")}>Saved</button>
            <button type="button" style={view === "archived" ? goldBtn : btn} onClick={() => setView("archived")}>Archived</button>
            <button type="button" style={view === "sold" ? goldBtn : btn} onClick={() => setView("sold")}>Sold</button>
            <button type="button" style={view === "resolved" ? goldBtn : btn} onClick={() => setView("resolved")}>Resolved</button>
            <button type="button" style={view === "deleted" ? goldBtn : btn} onClick={() => setView("deleted")}>Deleted</button>
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
                Move a room with Save, Archive, Sold, Resolve, Delete, or Delete Forever and it will update immediately.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
