"use client";

export type RoomStatus = "active" | "saved" | "archived" | "deleted";
export type RoomKind = "opportunity" | "pressure" | "routing" | "signal" | "intelligence" | "alert" | "general";

export type RoomRecord = {
  room_id: string;
  room_title: string;
  room_type: string;
  room_kind: RoomKind;
  source_route: string;
  folder: string;
  status: RoomStatus;
  saved: boolean;
  archived: boolean;
  deleted: boolean;
  updated_at: string;
};

const KEY = "vaultforge_5s_room_registry_v1";

export function clean(value: unknown) {
  return String(value || "").trim();
}

export function roomKind(value: unknown): RoomKind {
  const text = clean(value).toLowerCase();
  if (text.includes("deal") || text.includes("opportunity")) return "opportunity";
  if (text.includes("pain") || text.includes("pressure")) return "pressure";
  if (text.includes("routing")) return "routing";
  if (text.includes("signal")) return "signal";
  if (text.includes("intelligence")) return "intelligence";
  if (text.includes("alert")) return "alert";
  return "general";
}

export function roomType(kind: RoomKind) {
  if (kind === "opportunity") return "Opportunity Room";
  if (kind === "pressure") return "Pressure Room";
  if (kind === "routing") return "Routing Room";
  if (kind === "signal") return "Signal Room";
  if (kind === "intelligence") return "Intelligence Room";
  if (kind === "alert") return "Alert Room";
  return "VaultForge Room";
}

export function roomFolder(kind: RoomKind) {
  if (kind === "opportunity") return "opportunity";
  if (kind === "pressure") return "pressure";
  if (kind === "routing") return "routing";
  if (kind === "signal") return "signals";
  if (kind === "intelligence") return "intelligence";
  if (kind === "alert") return "alerts";
  return "general";
}

export function roomRoute(kind: RoomKind, id: string) {
  const safe = encodeURIComponent(clean(id));
  if (kind === "opportunity") return `/deal/detail?id=${safe}`;
  if (kind === "pressure") return `/pain-room/${safe}`;
  if (kind === "routing") return `/routing-room/${safe}`;
  if (kind === "signal") return `/signals/${safe}`;
  if (kind === "intelligence") return "/intelligence";
  if (kind === "alert") return "/alerts";
  return "/dashboard";
}

function readAll(): Record<string, RoomRecord> {
  if (typeof window === "undefined") return {};
  try {
    const parsed = JSON.parse(window.localStorage.getItem(KEY) || "{}");
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function writeAll(rows: Record<string, RoomRecord>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(rows));
  window.dispatchEvent(new CustomEvent("vaultforge-5s-room-change"));
}

export function roomKey(kind: RoomKind, id: string) {
  return `${kind}:${clean(id) || "unknown"}`;
}

export function upsertRoom(input: Partial<RoomRecord> & { room_id: string }) {
  const kind = roomKind(input.room_kind || input.room_type || input.folder);
  const id = clean(input.room_id) || "unknown";
  const rows = readAll();
  const old = rows[roomKey(kind, id)];

  const next: RoomRecord = {
    room_id: id,
    room_title: clean(input.room_title) || old?.room_title || roomType(kind),
    room_type: clean(input.room_type) || old?.room_type || roomType(kind),
    room_kind: kind,
    source_route: clean(input.source_route) || old?.source_route || roomRoute(kind, id),
    folder: clean(input.folder) || old?.folder || roomFolder(kind),
    status: input.status || old?.status || "active",
    saved: Boolean(input.saved ?? old?.saved ?? false),
    archived: Boolean(input.archived ?? old?.archived ?? false),
    deleted: Boolean(input.deleted ?? old?.deleted ?? false),
    updated_at: new Date().toISOString(),
  };

  rows[roomKey(kind, id)] = next;
  writeAll(rows);
  return next;
}

export function applyRoomAction(input: Partial<RoomRecord> & { room_id: string }, action: "save" | "unsave" | "archive" | "unarchive" | "delete" | "restore") {
  const next = upsertRoom(input);

  if (action === "save") {
    next.saved = true;
    next.archived = false;
    next.deleted = false;
    next.status = "saved";
  }

  if (action === "unsave") {
    next.saved = false;
    next.status = next.archived ? "archived" : "active";
  }

  if (action === "archive") {
    next.archived = true;
    next.saved = false;
    next.deleted = false;
    next.status = "archived";
  }

  if (action === "unarchive") {
    next.archived = false;
    next.status = next.saved ? "saved" : "active";
  }

  if (action === "delete") {
    next.deleted = true;
    next.saved = false;
    next.archived = false;
    next.status = "deleted";
  }

  if (action === "restore") {
    next.deleted = false;
    next.archived = false;
    next.status = next.saved ? "saved" : "active";
  }

  next.updated_at = new Date().toISOString();

  const rows = readAll();
  rows[roomKey(next.room_kind, next.room_id)] = next;
  writeAll(rows);

  return next;
}

export function listRooms(status: RoomStatus | "all") {
  const rows = Object.values(readAll());

  if (status === "all") return rows;
  if (status === "saved") return rows.filter((row) => row.saved && !row.deleted);
  if (status === "archived") return rows.filter((row) => row.archived && !row.deleted);
  if (status === "deleted") return rows.filter((row) => row.deleted);

  return rows.filter((row) => !row.saved && !row.archived && !row.deleted);
}
