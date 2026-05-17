"use client";

export type RoomRecord = {
  room_id: string;
  room_title: string;
  room_type: string;
  room_kind: string;
  folder: string;
  source_route: string;
  status: string;
  saved: boolean;
  archived: boolean;
  deleted: boolean;
  updated_at: string;
};

const STORAGE_KEY = "vaultforge-room-state-v2";

export function clean(value: unknown) {
  return String(value || "").trim();
}

export function roomKind(value: unknown) {
  const raw = clean(value).toLowerCase();

  if (raw.includes("opportunity")) return "opportunity";
  if (raw.includes("pressure")) return "pressure";
  if (raw.includes("pain")) return "pressure";
  if (raw.includes("signal")) return "signal";
  if (raw.includes("routing")) return "routing";
  if (raw.includes("alert")) return "alert";
  if (raw.includes("intelligence")) return "intelligence";

  return "general";
}

export function roomType(kind: string) {
  switch (roomKind(kind)) {
    case "opportunity":
      return "Opportunity Room";

    case "pressure":
      return "Pressure Room";

    case "signal":
      return "Signal Room";

    case "routing":
      return "Routing Room";

    case "alert":
      return "Alert Room";

    case "intelligence":
      return "Intelligence Room";

    default:
      return "VaultForge Room";
  }
}

export function roomFolder(kind: string) {
  switch (roomKind(kind)) {
    case "opportunity":
      return "opportunity-active";

    case "pressure":
      return "pressure-active";

    case "signal":
      return "signal-active";

    case "routing":
      return "routing-active";

    case "alert":
      return "alert-active";

    case "intelligence":
      return "intelligence-active";

    default:
      return "general-active";
  }
}

export function roomRoute(kind: string, id: string) {
  const normalized = clean(id);

  switch (roomKind(kind)) {
    case "opportunity":
      return `/deal-room/${normalized}`;

    case "pressure":
      return `/pain-room/${normalized}`;

    case "signal":
      return `/signals/${normalized}`;

    case "routing":
      return `/routing-room/${normalized}`;

    case "alert":
      return `/alerts`;

    case "intelligence":
      return `/intelligence`;

    default:
      return `/dashboard`;
  }
}

export function loadRoomState(): Record<string, RoomRecord> {
  if (typeof window === "undefined") return {};

  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) return {};

    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function saveRoomState(state: Record<string, RoomRecord>) {
  if (typeof window === "undefined") return;

  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function upsertRoom(input: Partial<RoomRecord>): RoomRecord {
  const state = loadRoomState();

  const room_id = clean(input.room_id || "unknown-room");

  const existing = state[room_id];

  const next: RoomRecord = {
    room_id,
    room_title: clean(input.room_title || existing?.room_title || "VaultForge Room"),
    room_type: clean(input.room_type || existing?.room_type || "VaultForge Room"),
    room_kind: roomKind(input.room_kind || existing?.room_kind || "general"),
    folder: clean(input.folder || existing?.folder || "general-active"),
    source_route: clean(input.source_route || existing?.source_route || "/dashboard"),
    status: clean(input.status || existing?.status || "active"),
    saved: Boolean(input.saved ?? existing?.saved ?? false),
    archived: Boolean(input.archived ?? existing?.archived ?? false),
    deleted: Boolean(input.deleted ?? existing?.deleted ?? false),
    updated_at: new Date().toISOString(),
  };

  state[room_id] = next;

  saveRoomState(state);

  return next;
}

export function applyRoomAction(
  room: RoomRecord,
  action: "save" | "unsave" | "archive" | "unarchive" | "delete" | "restore"
) {
  const next: RoomRecord = {
    ...room,
    updated_at: new Date().toISOString(),
  };

  switch (action) {
    case "save":
      next.saved = true;
      next.folder = "saved";
      break;

    case "unsave":
      next.saved = false;
      next.folder = roomFolder(next.room_kind);
      break;

    case "archive":
      next.archived = true;
      next.deleted = false;
      next.folder = "archived";
      next.status = "archived";
      break;

    case "unarchive":
      next.archived = false;
      next.folder = roomFolder(next.room_kind);
      next.status = "active";
      break;

    case "delete":
      next.deleted = true;
      next.archived = false;
      next.folder = "deleted";
      next.status = "deleted";
      break;

    case "restore":
      next.deleted = false;
      next.archived = false;
      next.folder = roomFolder(next.room_kind);
      next.status = "active";
      break;
  }

  return upsertRoom(next);
}

export function getRoomsByFolder(folder: string) {
  const state = loadRoomState();

  return Object.values(state).filter(
    (room) => clean(room.folder).toLowerCase() === clean(folder).toLowerCase()
  );
}

export function getAllRooms() {
  return Object.values(loadRoomState());
}

export function deleteRoomForever(roomId: string) {
  const normalized = clean(roomId);

  if (!normalized || typeof window === "undefined") return;

  const state = loadRoomState();

  if (state[normalized]) {
    delete state[normalized];
    saveRoomState(state);
  }
}


