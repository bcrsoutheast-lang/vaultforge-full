"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type RoomKind = "deal" | "pain";
type RoomStatus = "active" | "saved" | "archived" | "deleted" | "sold" | "resolved";
type RoomStage = "New" | "Reviewing" | "Diagnosing" | "Routed" | "Under Contract" | "In Progress" | "Sold" | "Resolved";

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
  painTypes?: string[] | string;
  needs?: string[] | string;
  routingNeeds?: string[] | string;
  routeTo?: string[] | string;
  strategy?: string[] | string;
  roomState?: string;
  cleanupState?: string;
  stateStatus?: string;
  memberRoomStatus?: RoomStatus;
  executionStage?: RoomStage;
  dealStage?: RoomStage;
  painStage?: RoomStage;
  ownerEmail?: string;
  memberEmail?: string;
  createdBy?: string;
  createdByEmail?: string;
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

type ViewKey =
  | "activeDeals"
  | "activePain"
  | "savedDeals"
  | "savedPain"
  | "assignedToMe"
  | "routedToMe"
  | "following"
  | "archived"
  | "sold"
  | "resolved"
  | "deleted";

const DEAL_KEYS = ["vaultforge_clean_deal_rooms", "vaultforge_deal_rooms", "vaultforge_rooms_deals", "vf_deal_rooms"];
const PAIN_KEYS = ["vaultforge_clean_pain_rooms_v2", "vaultforge_clean_pain_rooms_v1", "vaultforge_clean_pain_rooms", "vaultforge_pain_rooms", "vaultforge_rooms_pain", "vf_pain_rooms"];
const STATE_KEYS = ["vaultforge_deal_room_state_v2", "vaultforge_pain_room_state_v2", "vaultforge_clean_room_states", "vaultforge_room_states", "vaultforge_deal_room_states", "vaultforge_pain_room_states"];
const MEMBER_STATE_KEY = "vaultforge_my_room_status_v1";
const WATCH_KEY = "vaultforge_room_watchlist_v1";
const WATCH_META_KEY = "vaultforge_room_watch_meta_v1";
const ROOM_ACTIVITY_KEY = "vaultforge_room_activity_v2";
const ROUTE_STATUS_KEY = "vaultforge_route_status_v1";
const READ_KEY = "vaultforge_room_alert_read_v1";
const STAGE_KEY = "vaultforge_room_execution_stage_v1";
const DEAL_STAGES: RoomStage[] = ["New", "Reviewing", "Routed", "Under Contract", "Sold"];
const PAIN_STAGES: RoomStage[] = ["New", "Diagnosing", "Routed", "In Progress", "Resolved"];

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

function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function txt(value: unknown, fallback = "") {
  const clean = String(value || "").trim();
  return clean || fallback;
}

function list(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  if (typeof value === "string" && value.trim()) return value.split(",").map((item) => item.trim()).filter(Boolean);
  return [];
}

function arr<T>(key: string): T[] {
  if (!ok()) return [];
  const parsed = j<unknown>(localStorage.getItem(key), []);
  return Array.isArray(parsed) ? (parsed as T[]) : [];
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

function firstPhoto(room: Room) {
  const possible = [txt(room.coverPhoto), txt(room.photoUrl), txt(room.imageUrl), ...list(room.photos), ...list(room.photoUrls)].filter(Boolean);
  return possible.find((src) => src.startsWith("data:image") || src.startsWith("http") || src.startsWith("/") || src.startsWith("blob:")) || "";
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

function rawStatus(room: Room): RoomStatus {
  const state = txt(room.memberRoomStatus || room.roomState || room.cleanupState || room.stateStatus, "active");
  if (state === "saved" || state === "archived" || state === "deleted" || state === "sold" || state === "resolved") return state;
  return "active";
}

function stateMap() {
  const map: Record<string, RoomStatus> = {};
  if (!ok()) return map;
  STATE_KEYS.forEach((key) => Object.assign(map, j<Record<string, RoomStatus>>(localStorage.getItem(key), {})));
  Object.assign(map, j<Record<string, RoomStatus>>(localStorage.getItem(MEMBER_STATE_KEY), {}));
  return map;
}


function stageMap() {
  return ok() ? j<Record<string, RoomStage>>(localStorage.getItem(STAGE_KEY), {}) : {};
}

function defaultStage(kind: RoomKind, room: Room): RoomStage {
  const status = rawStatus(room);
  if (kind === "deal" && status === "sold") return "Sold";
  if (kind === "pain" && status === "resolved") return "Resolved";
  const existing = txt(room.executionStage || room.dealStage || room.painStage);
  if (kind === "deal" && DEAL_STAGES.includes(existing as RoomStage)) return existing as RoomStage;
  if (kind === "pain" && PAIN_STAGES.includes(existing as RoomStage)) return existing as RoomStage;
  return "New";
}

function roomStage(kind: RoomKind, room: Room): RoomStage {
  const id = rid(room);
  const stages = stageMap();
  const mapped = stages[id] || stages[`${kind}:${id}`];
  if (mapped) return mapped;
  return defaultStage(kind, room);
}

function saveRoomStage(kind: RoomKind, room: Room, stage: RoomStage) {
  if (!ok()) return;
  const id = rid(room);
  if (!id) return;

  const stages = stageMap();
  stages[id] = stage;
  stages[`${kind}:${id}`] = stage;
  writeJson(STAGE_KEY, stages);

  const finalStatus =
    kind === "deal" && stage === "Sold" ? "sold"
    : kind === "pain" && stage === "Resolved" ? "resolved"
    : rawStatus(room) === "sold" || rawStatus(room) === "resolved" ? "active"
    : rawStatus(room);

  const next = {
    ...room,
    executionStage: stage,
    dealStage: kind === "deal" ? stage : room.dealStage,
    painStage: kind === "pain" ? stage : room.painStage,
    memberRoomStatus: finalStatus,
    roomState: finalStatus,
    cleanupState: finalStatus,
    stateStatus: finalStatus,
    updatedAt: new Date().toISOString(),
  };

  const directKey = kind === "deal" ? `vaultforge_deal_room_${id}` : `vaultforge_pain_room_${id}`;
  writeJson(directKey, next);

  for (const key of keysFor(kind)) {
    const rows = allRooms(kind).filter((item) => rid(item) !== id);
    writeJson(key, [next, ...rows]);
  }

  addRoomActivity(kind, room, "Stage Change", `Execution stage moved to ${stage}.`);

  if (stage === "Sold" || stage === "Resolved") {
    saveRoomStatus(kind, next, stage === "Sold" ? "sold" : "resolved");
  }

  window.dispatchEvent(new Event("vaultforge-room-stage-change"));
  window.dispatchEvent(new Event("vaultforge-my-rooms-change"));
}

function nextActionFor(kind: RoomKind, room: Room) {
  const stage = roomStage(kind, room);
  const health = roomHealth(kind, room);
  if (stage === "Sold") return "Keep this deal as performance history.";
  if (stage === "Resolved") return "Keep this pain room as resolution history.";
  if (stage === "New") return kind === "deal" ? "Review numbers, proof, photos, control, and routing target." : "Diagnose blocker, deadline, money need, risk, and solver type.";
  if (stage === "Reviewing") return "Move this deal to Routed once a buyer/capital/operator target is chosen.";
  if (stage === "Diagnosing") return "Move this pain room to Routed once the right solver lane is clear.";
  if (stage === "Routed") return "Message or intro the best-fit member and track response.";
  if (stage === "Under Contract") return "Track close path. Mark Sold when complete.";
  if (stage === "In Progress") return "Track solver progress. Mark Resolved when handled.";
  return health.next;
}

function stageCounts(deals: Room[], pains: Room[]) {
  const out: Record<string, number> = {};
  for (const stage of [...DEAL_STAGES, ...PAIN_STAGES]) out[stage] = 0;
  for (const room of deals) out[roomStage("deal", room)] = (out[roomStage("deal", room)] || 0) + 1;
  for (const room of pains) out[roomStage("pain", room)] = (out[roomStage("pain", room)] || 0) + 1;
  return out;
}


function allRooms(kind: RoomKind): Room[] {
  if (!ok()) return [];
  const out: Room[] = [];
  const seen = new Set<string>();

  for (const key of keysFor(kind)) {
    for (const row of arr<any>(key)) {
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
      const status = states[id] || states[`${kind}:${id}`] || rawStatus(room);
      return { ...room, memberRoomStatus: status, roomState: status, cleanupState: status, stateStatus: status, executionStage: roomStage(kind, { ...room, memberRoomStatus: status, roomState: status, cleanupState: status, stateStatus: status }) };
    })
    .sort((a, b) => String(b.createdAt || b.updatedAt || "").localeCompare(String(a.createdAt || a.updatedAt || "")));
}

function readMap() {
  return ok() ? j<Record<string, string>>(localStorage.getItem(READ_KEY), {}) : {};
}

function unread(kind: RoomKind, room: Room) {
  const reads = readMap();
  const id = rid(room);
  return !room.alertRead && !room.viewedAt && !reads[id] && !reads[`${kind}:${id}`];
}

function saveRoomStatus(kind: RoomKind, room: Room, status: RoomStatus) {
  if (!ok()) return;

  const id = rid(room);
  if (!id) return;

  const states = stateMap();
  states[id] = status;
  states[`${kind}:${id}`] = status;
  writeJson(MEMBER_STATE_KEY, states);

  const next = {
    ...room,
    memberRoomStatus: status,
    roomState: status,
    cleanupState: status,
    stateStatus: status,
    updatedAt: new Date().toISOString(),
  };

  const directKey = kind === "deal" ? `vaultforge_deal_room_${id}` : `vaultforge_pain_room_${id}`;
  writeJson(directKey, next);

  for (const key of keysFor(kind)) {
    const rows = allRooms(kind).filter((item) => rid(item) !== id);
    writeJson(key, [next, ...rows]);
  }

  addRoomActivity(kind, room, "Status Change", `Room moved to ${status}.`);
  window.dispatchEvent(new Event("vaultforge-room-state-change"));
  window.dispatchEvent(new Event("vaultforge-my-rooms-change"));
  window.dispatchEvent(new Event(kind === "deal" ? "vaultforge-deal-change" : "vaultforge-pain-change"));
}


function num(value: unknown) {
  const parsed = Number(String(value || "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function daysOld(room: Room) {
  const date = txt(room.updatedAt || room.createdAt);
  if (!date) return 0;
  const time = new Date(date).getTime();
  if (!Number.isFinite(time)) return 0;
  return Math.max(0, Math.floor((Date.now() - time) / 86400000));
}

function roomHealth(kind: RoomKind, room: Room) {
  const status = rawStatus(room);
  const age = daysOld(room);
  let score = 70;
  let label = "Healthy";
  let next = "Keep monitoring and move the room through the execution path.";
  let warning = "";

  if (status === "sold") {
    return {
      score: 100,
      label: "Sold",
      warning: "Completed deal room.",
      next: "Keep as performance history. Later this can feed close-rate and member trust scores.",
      attention: false,
    };
  }

  if (status === "resolved") {
    return {
      score: 100,
      label: "Resolved",
      warning: "Problem handled.",
      next: "Keep as resolution history. Later this can feed solver performance and routing intelligence.",
      attention: false,
    };
  }

  if (status === "deleted") {
    return {
      score: 10,
      label: "Deleted",
      warning: "Hidden from active workspace.",
      next: "Restore active only if this room needs work again.",
      attention: false,
    };
  }

  if (status === "archived") {
    return {
      score: 45,
      label: "Archived",
      warning: "Not active right now.",
      next: "Restore active if execution resumes, or leave archived for records.",
      attention: false,
    };
  }

  if (status === "saved") score += 8;

  if (kind === "deal") {
    const ask = num(room.askingPrice || room.askPrice);
    const value = num(room.propertyValue || room.value);
    const repairs = num(room.repairs);
    const spread = value && ask ? value - ask - repairs : 0;
    const hasPhotos = list(room.photos || room.photoUrls).length > 0 || firstPhoto(room);

    if (!ask || !value) {
      score -= 18;
      warning = "Missing deal numbers.";
      next = "Add ask price, value/ARV, repairs, control status, and proof before routing hard.";
    }

    if (spread > 25000) score += 8;
    if (spread > 75000) score += 12;
    if (spread <= 0 && ask && value) {
      score -= 15;
      warning = "Weak or unclear spread.";
      next = "Verify numbers before sending this to buyers or capital.";
    }

    if (!hasPhotos) {
      score -= 8;
      if (!warning) warning = "No room photos.";
    }

    if (age >= 7 && status === "active") {
      score -= 12;
      warning = "Stale active deal.";
      next = "Update status, message a fit, archive it, or mark sold if done.";
    }

    if (score >= 85) label = "High Momentum";
    else if (score >= 65) label = "Working";
    else if (score >= 45) label = "Needs Proof";
    else label = "Needs Attention";
  } else {
    let severity = 35;
    const sev = txt(room.severity);
    if (sev === "Medium") severity = 50;
    if (sev === "High") severity = 70;
    if (sev === "Critical") severity = 88;
    if (sev === "Emergency") severity = 96;
    if (txt(room.timePressure).includes("24") || txt(room.timePressure).includes("72")) severity += 8;
    severity = Math.min(100, severity);

    score = 100 - Math.round(severity * 0.45);

    if (severity >= 85) {
      warning = "Critical pressure.";
      next = "Message or route this to a solver now. Do not let it sit in active.";
    } else if (severity >= 70) {
      warning = "High pressure.";
      next = "Confirm blocker, money needed, deadline, and route to a fit.";
    }

    if (age >= 3 && status === "active" && severity >= 70) {
      score -= 12;
      warning = "High pressure and stale.";
      next = "Update, route, message, resolve, or archive. This needs action.";
    }

    if (list(room.blockers).length === 0 && list(room.painTypes).length === 0) {
      score -= 10;
      if (!warning) warning = "Missing problem classification.";
      next = "Add pain type, blockers, risk, deadline, and next required solver.";
    }

    if (score >= 75) label = "Controlled";
    else if (score >= 55) label = "Active Pressure";
    else if (score >= 35) label = "Needs Solver";
    else label = "Needs Attention";
  }

  score = Math.max(0, Math.min(100, score));
  const attention = status === "active" && (score < 55 || Boolean(warning));

  return {
    score,
    label,
    warning: warning || "No urgent warning.",
    next,
    attention,
  };
}

function healthColor(score: number) {
  if (score >= 75) return "#ffdc68";
  if (score >= 50) return "#f5a742";
  return "#ff4b5c";
}




function activityKey(kind: RoomKind, room: Room) {
  return `${kind}:${rid(room)}`;
}

function readRoomActivity(kind: RoomKind, room: Room) {
  if (!ok()) return [] as { at: string; action: string; note: string }[];
  const all = j<Record<string, { at: string; action: string; note: string }[]>>(localStorage.getItem(ROOM_ACTIVITY_KEY), {});
  return all[activityKey(kind, room)] || [];
}

function addRoomActivity(kind: RoomKind, room: Room, action: string, note: string) {
  if (!ok()) return;
  const key = activityKey(kind, room);
  const all = j<Record<string, { at: string; action: string; note: string }[]>>(localStorage.getItem(ROOM_ACTIVITY_KEY), {});
  all[key] = [{ at: new Date().toISOString(), action, note }, ...(all[key] || [])].slice(0, 75);
  writeJson(ROOM_ACTIVITY_KEY, all);
  window.dispatchEvent(new Event("vaultforge-room-activity-change"));
}



function routeStatusMap() {
  return ok() ? j<Record<string, { status: string; at: string; memberName: string; memberEmail: string; roomId: string; kind: string }>>(localStorage.getItem(ROUTE_STATUS_KEY), {}) : {};
}

function currentRouteEntriesForRoom(kind: RoomKind, room: Room) {
  const id = rid(room);
  const current = currentMemberIdentity();
  return Object.entries(routeStatusMap()).filter(([key, value]) => {
    if (value.kind !== kind || value.roomId !== id) return false;
    const keyLower = key.toLowerCase();
    return Boolean(
      (current.id && keyLower.includes(current.id.toLowerCase())) ||
      (current.email && keyLower.includes(current.email.toLowerCase())) ||
      roomAssignedToCurrentMember(room) ||
      roomRoutedToCurrentMember(room)
    );
  });
}

function currentRouteStatusForRoom(kind: RoomKind, room: Room) {
  const entries = currentRouteEntriesForRoom(kind, room);
  const ranked = ["claimed", "accepted", "pending", "passed"];
  for (const status of ranked) {
    if (entries.some(([, value]) => value.status === status)) return status;
  }
  return entries[0]?.[1]?.status || "";
}

function setCurrentRouteStatus(kind: RoomKind, room: Room, status: "accepted" | "passed" | "claimed") {
  if (!ok()) return;
  const id = rid(room);
  const current = currentMemberIdentity();
  const map = routeStatusMap();
  let touched = false;

  for (const [key, value] of Object.entries(map)) {
    if (value.kind !== kind || value.roomId !== id) continue;
    const keyLower = key.toLowerCase();
    const belongs =
      (current.id && keyLower.includes(current.id.toLowerCase())) ||
      (current.email && keyLower.includes(current.email.toLowerCase()));

    if (belongs || roomAssignedToCurrentMember(room) || roomRoutedToCurrentMember(room)) {
      map[key] = { ...value, status, at: new Date().toISOString() };
      touched = true;
    }
  }

  if (!touched) {
    const routeKey = `${kind}:${id}:${current.id || current.email || "local_member"}`;
    map[routeKey] = {
      status,
      at: new Date().toISOString(),
      memberName: current.id || "local_member",
      memberEmail: current.email,
      roomId: id,
      kind,
    };
  }

  writeJson(ROUTE_STATUS_KEY, map);
  addRoomActivity(kind, room, "Route Response", `Route marked ${status}.`);
  window.dispatchEvent(new Event("vaultforge-route-status-change"));
  window.dispatchEvent(new Event("vaultforge-alert-change"));
}


function watchKey(kind: RoomKind, room: Room) {
  return `${kind}:${rid(room)}`;
}

function watchList() {
  return ok() ? j<string[]>(localStorage.getItem(WATCH_KEY), []) : [];
}

function watchMeta() {
  return ok() ? j<Record<string, { at: string; updates: number }>>(localStorage.getItem(WATCH_META_KEY), {}) : {};
}

function isWatchingRoom(kind: RoomKind, room: Room) {
  return watchList().includes(watchKey(kind, room));
}

function toggleWatchRoom(kind: RoomKind, room: Room) {
  if (!ok()) return false;
  const key = watchKey(kind, room);
  const current = watchList();
  const meta = watchMeta();

  let next: string[];
  let watching: boolean;

  if (current.includes(key)) {
    next = current.filter((item) => item !== key);
    delete meta[key];
    watching = false;
  } else {
    next = [key, ...current];
    meta[key] = { at: new Date().toISOString(), updates: 0 };
    watching = true;
  }

  writeJson(WATCH_KEY, next);
  writeJson(WATCH_META_KEY, meta);
  addRoomActivity(kind, room, watching ? "Watch" : "Unwatch", watching ? "Started following this room." : "Stopped following this room.");
  window.dispatchEvent(new Event("vaultforge-room-watch-change"));
  window.dispatchEvent(new Event("vaultforge-alert-change"));
  return watching;
}

function watchingCount(kind: RoomKind, room: Room) {
  const key = watchKey(kind, room);
  let count = isWatchingRoom(kind, room) ? 1 : 0;
  count += list(room.watchers).length + list(room.watcherIds).length + list(room.watcherEmails).length;
  return count;
}

function roomIsFollowedByCurrentMember(kind: RoomKind, room: Room) {
  const current = currentMemberIdentity();
  if (isWatchingRoom(kind, room)) return true;
  const ids = list(room.watchers).concat(list(room.watcherIds)).map((value) => value.toLowerCase());
  const emails = list(room.watcherEmails).map((value) => value.toLowerCase());
  return Boolean((current.id && ids.includes(current.id.toLowerCase())) || (current.email && emails.includes(current.email)));
}


function roomAssignedIds(room: Room) {
  return [
    ...list(room.assignedTo),
    ...list(room.assignedToIds),
    ...list(room.routedTo),
    ...list(room.routedToIds),
    ...list(room.watchers),
    ...list(room.collaborators),
  ].map((value) => value.toLowerCase());
}

function roomAssignedEmails(room: Room) {
  return [
    ...list(room.assignedToEmail),
    ...list(room.assignedToEmails),
    ...list(room.routedToEmail),
    ...list(room.routedToEmails),
    ...list(room.watcherEmails),
    ...list(room.collaboratorEmails),
  ].map((value) => value.toLowerCase());
}

function roomBelongsToCurrentMember(room: Room) {
  const current = currentMemberIdentity();

  const ownerId = txt(room.ownerId || room.createdBy || room.memberId || room.createdById).toLowerCase();
  const ownerEmail = txt(room.ownerEmail || room.createdByEmail || room.memberEmail).toLowerCase();

  const assignedIds = roomAssignedIds(room);
  const assignedEmails = roomAssignedEmails(room);

  const hasOwnershipData =
    Boolean(ownerId) ||
    Boolean(ownerEmail) ||
    assignedIds.length > 0 ||
    assignedEmails.length > 0;

  if (!hasOwnershipData) {
    return true;
  }

  if (current.id && ownerId && ownerId === current.id.toLowerCase()) return true;
  if (current.email && ownerEmail && ownerEmail === current.email) return true;
  if (current.id && assignedIds.includes(current.id.toLowerCase())) return true;
  if (current.email && assignedEmails.includes(current.email)) return true;

  return false;
}

function ownershipLabel(room: Room) {
  const current = currentMemberIdentity();
  const ownerId = txt(room.ownerId || room.createdBy || room.memberId || room.createdById);
  const ownerEmail = txt(room.ownerEmail || room.createdByEmail || room.memberEmail);

  if (!ownerId && !ownerEmail) return "Local/demo room";
  if ((current.id && ownerId.toLowerCase() === current.id.toLowerCase()) || (current.email && ownerEmail.toLowerCase() === current.email)) return "Owned by me";
  if (roomAssignedIds(room).includes(current.id.toLowerCase()) || roomAssignedEmails(room).includes(current.email)) return "Assigned/routed to me";
  return "Other member room";
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
const panel: React.CSSProperties = { background: "#121724", border: "1px solid rgba(207,216,230,.16)", borderRadius: 22, padding: 22, color: "#f7f7fb", textDecoration: "none", display: "block" };
const activePanel: React.CSSProperties = { ...panel, borderColor: "rgba(245,197,66,.75)", boxShadow: "0 0 26px rgba(245,197,66,.18)" };
const pulseRed: React.CSSProperties = { ...panel, borderColor: "rgba(255,70,70,.70)", animation: "vfPulseRed 2.1s ease-in-out infinite" };
const pulseGold: React.CSSProperties = { ...panel, borderColor: "rgba(255,220,104,.70)", animation: "vfPulseGold 2.3s ease-in-out infinite" };
const eyebrow: React.CSSProperties = { color: "#ffd45a", textTransform: "uppercase", letterSpacing: 7, fontWeight: 950, fontSize: 15, marginBottom: 12 };
const h1: React.CSSProperties = { fontSize: "clamp(44px,8vw,86px)", lineHeight: 0.9, letterSpacing: -4, margin: "0 0 18px", fontWeight: 950 };
const h2: React.CSSProperties = { fontSize: "clamp(30px,5vw,52px)", lineHeight: 0.95, letterSpacing: -2, margin: "0 0 14px", fontWeight: 950 };
const sub: React.CSSProperties = { color: "#c9d0dc", fontSize: 21, lineHeight: 1.35, margin: 0 };
const muted: React.CSSProperties = { color: "#aeb7c7", margin: "8px 0 0", lineHeight: 1.35 };
const grid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(245px,1fr))", gap: 16 };
const row: React.CSSProperties = { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" };

const logoWrap: React.CSSProperties = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  margin: "8px 0 24px",
};

const logoShell: React.CSSProperties = {
  width: "min(520px, 92vw)",
  border: "1px solid rgba(245,197,66,.32)",
  borderRadius: 34,
  background: "radial-gradient(circle at top, rgba(245,197,66,.18), transparent 38%), linear-gradient(180deg,#0b101d,#050816)",
  boxShadow: "0 0 42px rgba(245,197,66,.13)",
  padding: 22,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexDirection: "column",
  textAlign: "center",
};

const logoImg: React.CSSProperties = {
  maxWidth: "min(390px, 78vw)",
  maxHeight: 140,
  width: "auto",
  height: "auto",
  objectFit: "contain",
  display: "block",
};

const logoFallback: React.CSSProperties = {
  color: "#ffd45a",
  fontSize: "clamp(40px,9vw,82px)",
  fontWeight: 950,
  letterSpacing: -4,
  lineHeight: 0.9,
};

const imgStyle: React.CSSProperties = { width: "100%", height: 150, objectFit: "cover", borderRadius: 18, border: "1px solid rgba(245,197,66,.25)", marginBottom: 12 };


function VaultForgeBrandLogo() {
  const logoPaths = [
    "/vaultforge-logo.png",
    "/VaultForge-logo.png",
    "/vaultforge-logo.jpg",
    "/vaultforge-logo.webp",
    "/logo.png",
    "/logo.jpg",
    "/logo.webp",
    "/vf-logo.png",
    "/brand/logo.png",
  ];

  const [index, setIndex] = useState(0);
  const [failed, setFailed] = useState(false);
  const src = logoPaths[index];

  return (
    <div style={logoWrap}>
      <div style={logoShell}>
        {!failed && src ? (
          <img
            src={src}
            alt="VaultForge"
            style={logoImg}
            onError={() => {
              const next = index + 1;
              if (next < logoPaths.length) setIndex(next);
              else setFailed(true);
            }}
          />
        ) : (
          <div style={logoFallback}>VaultForge</div>
        )}
        <p style={{ ...muted, marginTop: 12 }}>Private real estate execution intelligence network</p>
      </div>
    </div>
  );
}

function safeProfileText(value: unknown, fallback: string) {
  const clean = String(value || "").trim();
  return clean && clean !== "undefined" && clean !== "null" ? clean : fallback;
}

function readMemberDisplay() {
  if (typeof window === "undefined") {
    return {
      displayName: "Member Workspace",
      company: "Company not listed",
      email: "Email not listed",
      memberType: "Private Member",
      states: "States not listed",
    };
  }

  let profile: any = {};
  const keys = ["vaultforge_profile", "vaultforge_member_profile", "vf_profile", "member_profile", "profile"];

  for (const key of keys) {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw && raw.startsWith("{")) profile = { ...profile, ...JSON.parse(raw) };
    } catch {
      // ignore local storage parse errors
    }
  }

  const email = safeProfileText(
    profile.email ||
      profile.memberEmail ||
      profile.member_email ||
      window.localStorage.getItem("vf_email") ||
      window.localStorage.getItem("member_email") ||
      window.localStorage.getItem("email"),
    "Email not listed"
  );

  const displayName = safeProfileText(
    profile.fullName ||
      profile.full_name ||
      profile.name ||
      profile.ownerName ||
      window.localStorage.getItem("vf_name") ||
      window.localStorage.getItem("member_name"),
    email.includes("@") ? email.split("@")[0] : "Member Workspace"
  );

  const company = safeProfileText(
    profile.company ||
      profile.companyName ||
      profile.company_name ||
      profile.businessName ||
      window.localStorage.getItem("vf_company") ||
      window.localStorage.getItem("member_company"),
    "Company not listed"
  );

  const memberType = safeProfileText(profile.memberType || profile.member_type || profile.role || profile.investorType, "Private Member");

  const statesRaw = profile.states || profile.operatingStates || profile.statesOperated || profile.serviceStates || profile.markets;
  const states = Array.isArray(statesRaw) ? statesRaw.join(" • ") : safeProfileText(statesRaw, "States not listed");

  return { displayName, company, email, memberType, states };
}

function MemberDisplayCard() {
  const [member, setMember] = useState(() => ({
    displayName: "Member Workspace",
    company: "Company not listed",
    email: "Email not listed",
    memberType: "Private Member",
    states: "States not listed",
  }));

  useEffect(() => {
    setMember(readMemberDisplay());
  }, []);

  return (
    <section style={{ ...panel, borderColor: "rgba(245,197,66,.32)", marginBottom: 22 }}>
      <div style={eyebrow}>Member Command Identity</div>
      <h2 style={h2}>{member.displayName}</h2>
      <p style={sub}>{member.company}</p>
      <p style={muted}>{member.email} • {member.memberType}</p>
      <p style={muted}>{member.states}</p>
    </section>
  );
}


function Nav() {
  return (
    <nav style={nav}>
      <div style={brand}>VAULTFORGE</div>
      <Link href="/command" style={btn}>Command</Link>
      <Link href="/my-rooms" style={goldBtn}>My Rooms</Link>
      <Link href="/routing" style={btn}>Routing</Link>
      <Link href="/members" style={btn}>Members</Link>
      <Link href="/network" style={btn}>Network</Link>
      <Link href="/state-map" style={btn}>State Map</Link>
      <Link href="/alerts" style={btn}>Alerts</Link>
      <Link href="/messages" style={btn}>Messages</Link>
      <Link href="/deal-create" style={btn}>Create Deal</Link>
      <Link href="/pain-intake" style={btn}>Pain Intake</Link>
      <Link href="/profile" style={btn}>Profile</Link>
      <Link href="/logout" style={redBtn}>Logout</Link>
    </nav>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section style={card}><div style={eyebrow}>{title}</div>{children}</section>;
}


function roomAssignedToCurrentMember(room: Room) {
  const current = currentMemberIdentity();
  if (!current.id && !current.email) return false;
  const ids = roomAssignedIds(room);
  const emails = roomAssignedEmails(room);
  return Boolean(
    (current.id && ids.includes(current.id.toLowerCase())) ||
    (current.email && emails.includes(current.email))
  );
}

function roomRoutedToCurrentMember(room: Room) {
  const current = currentMemberIdentity();
  if (!current.id && !current.email) return false;

  const routedIds = [
    ...list(room.routedTo),
    ...list(room.routedToIds),
    ...list(room.routingMemberIds),
  ].map((value) => value.toLowerCase());

  const routedEmails = [
    ...list(room.routedToEmail),
    ...list(room.routedToEmails),
    ...list(room.routingMemberEmails),
  ].map((value) => value.toLowerCase());

  return Boolean(
    (current.id && routedIds.includes(current.id.toLowerCase())) ||
    (current.email && routedEmails.includes(current.email))
  );
}


function countFor(view: ViewKey, deals: Room[], pains: Room[]) {
  if (view === "activeDeals") return deals.filter(isOpenDealRoom).length;
  if (view === "activePain") return pains.filter(isOpenPainRoom).length;
  if (view === "savedDeals") return deals.filter((room) => rawStatus(room) === "saved").length;
  if (view === "savedPain") return pains.filter((room) => rawStatus(room) === "saved").length;
  if (view === "assignedToMe") return [...deals, ...pains].filter(roomAssignedToCurrentMember).length;
  if (view === "routedToMe") return [...deals, ...pains].filter(roomRoutedToCurrentMember).length;
  if (view === "following") return [...deals.map((room) => ({ kind: "deal" as RoomKind, room })), ...pains.map((room) => ({ kind: "pain" as RoomKind, room }))].filter((item) => roomIsFollowedByCurrentMember(item.kind, item.room)).length;
  if (view === "archived") return [...deals, ...pains].filter((room) => rawStatus(room) === "archived").length;
  if (view === "sold") return deals.filter((room) => rawStatus(room) === "sold").length;
  if (view === "resolved") return pains.filter((room) => rawStatus(room) === "resolved").length;
  if (view === "deleted") return [...deals, ...pains].filter((room) => rawStatus(room) === "deleted").length;
  return 0;
}


function attentionCount(deals: Room[], pains: Room[]) {
  return [
    ...deals.map((room) => ({ kind: "deal" as RoomKind, room })),
    ...pains.map((room) => ({ kind: "pain" as RoomKind, room })),
  ].filter((item) => roomHealth(item.kind, item.room).attention).length;
}

function roomsFor(view: ViewKey, deals: Room[], pains: Room[]) {
  if (view === "activeDeals") return deals.filter(isOpenDealRoom).map((room) => ({ kind: "deal" as RoomKind, room }));
  if (view === "activePain") return pains.filter(isOpenPainRoom).map((room) => ({ kind: "pain" as RoomKind, room }));
  if (view === "savedDeals") return deals.filter((room) => rawStatus(room) === "saved").map((room) => ({ kind: "deal" as RoomKind, room }));
  if (view === "savedPain") return pains.filter((room) => rawStatus(room) === "saved").map((room) => ({ kind: "pain" as RoomKind, room }));
  if (view === "assignedToMe") return [...deals.map((room) => ({ kind: "deal" as RoomKind, room })), ...pains.map((room) => ({ kind: "pain" as RoomKind, room }))].filter((item) => roomAssignedToCurrentMember(item.room));
  if (view === "routedToMe") return [...deals.map((room) => ({ kind: "deal" as RoomKind, room })), ...pains.map((room) => ({ kind: "pain" as RoomKind, room }))].filter((item) => roomRoutedToCurrentMember(item.room));
  if (view === "following") return [...deals.map((room) => ({ kind: "deal" as RoomKind, room })), ...pains.map((room) => ({ kind: "pain" as RoomKind, room }))].filter((item) => roomIsFollowedByCurrentMember(item.kind, item.room));
  if (view === "archived") return [...deals.map((room) => ({ kind: "deal" as RoomKind, room })), ...pains.map((room) => ({ kind: "pain" as RoomKind, room }))].filter((item) => rawStatus(item.room) === "archived");
  if (view === "sold") return deals.filter((room) => rawStatus(room) === "sold").map((room) => ({ kind: "deal" as RoomKind, room }));
  if (view === "resolved") return pains.filter((room) => rawStatus(room) === "resolved").map((room) => ({ kind: "pain" as RoomKind, room }));
  if (view === "deleted") return [...deals.map((room) => ({ kind: "deal" as RoomKind, room })), ...pains.map((room) => ({ kind: "pain" as RoomKind, room }))].filter((item) => rawStatus(item.room) === "deleted");
  return [];
}


function isOpenDealRoom(room: Room) {
  const status = rawStatus(room);
  const stage = roomStage("deal", room);
  return status === "active" && stage !== "Sold";
}

function isOpenPainRoom(room: Room) {
  const status = rawStatus(room);
  const stage = roomStage("pain", room);
  return status === "active" && stage !== "Resolved";
}

function openAssignedOrRoutedCount(deals: Room[], pains: Room[]) {
  return [
    ...deals.map((room) => ({ kind: "deal" as RoomKind, room })),
    ...pains.map((room) => ({ kind: "pain" as RoomKind, room })),
  ].filter((item) => {
    const status = rawStatus(item.room);
    if (status !== "active") return false;
    return roomAssignedToCurrentMember(item.room) || roomRoutedToCurrentMember(item.room);
  }).length;
}


function ViewCard({ view, title, note, count, active, onClick }: { view: ViewKey; title: string; note: string; count: number; active: boolean; onClick: () => void }) {
  const style = active ? activePanel : count ? (view.includes("Pain") || view === "resolved" ? pulseRed : pulseGold) : panel;

  return (
    <button type="button" style={{ ...style, textAlign: "left", cursor: "pointer" }} onClick={onClick}>
      <div style={eyebrow}>{title}</div>
      <h2 style={h2}>{count}</h2>
      <p style={muted}>{note}</p>
    </button>
  );
}

function RoomCard({ kind, room, refresh }: { kind: RoomKind; room: Room; refresh: () => void }) {
  const id = rid(room);
  const status = rawStatus(room);
  const img = firstPhoto(room);
  const href = kind === "deal" ? `/deal-rooms/${encodeURIComponent(id)}` : `/pain-rooms/${encodeURIComponent(id)}`;
  const hot = unread(kind, room);
  const health = roomHealth(kind, room);
  const stage = roomStage(kind, room);
  const stages = kind === "deal" ? DEAL_STAGES : PAIN_STAGES;
  const age = daysOld(room);
  const watching = isWatchingRoom(kind, room);
  const watchCount = watchingCount(kind, room);
  const routeStatus = currentRouteStatusForRoom(kind, room);
  const style = routeStatus === "pending" ? pulseRed : routeStatus === "accepted" || routeStatus === "claimed" ? pulseGold : watching ? pulseGold : health.attention ? (kind === "pain" ? pulseRed : pulseGold) : hot ? (kind === "pain" ? pulseRed : pulseGold) : panel;

  return (
    <div style={style}>
      {img ? <img src={img} alt={roomTitle(room, kind)} style={imgStyle} /> : null}
      <div style={eyebrow}>{kind === "deal" ? "Deal Room" : "Pain Room"} • {status}</div>
      <h2 style={h2}>{roomTitle(room, kind)}</h2>
      <p style={sub}>{loc(room)}</p>
      <p style={muted}>
        {kind === "deal"
          ? `${txt(room.assetClass, "Asset")} • ${txt(room.propertyType, "Type")} • ${list(room.strategy).join(", ") || "Strategy open"}`
          : `${list(room.painTypes).join(", ") || "Pain"} • ${txt(room.severity, "High")} • ${txt(room.timePressure, "Timeline open")}`}
      </p>
      <p style={muted}>Workspace: {ownershipLabel(room)} • Watching {watchCount} • Route Status: {routeStatus || "none"}</p>

      <div style={{ marginTop: 16 }}>
        <div style={eyebrow}>{kind === "deal" ? "Deal Momentum" : "Pain Health"} • {health.label}</div>
        <div style={{ height: 11, background: "#070a12", borderRadius: 999, overflow: "hidden", border: "1px solid rgba(207,216,230,.12)" }}>
          <div style={{ width: `${health.score}%`, height: "100%", background: healthColor(health.score) }} />
        </div>
        <p style={health.attention ? { ...muted, color: "#ffb8b8" } : muted}>{health.warning}</p>
        <p style={muted}>{health.next}</p>
      </div>

      <div style={{ marginTop: 16 }}>
        <div style={eyebrow}>Execution Stage • {stage}</div>
        <div style={row}>
          {stages.map((item) => (
            <button
              key={item}
              type="button"
              style={stage === item ? goldBtn : btn}
              onClick={() => {
                saveRoomStage(kind, room, item);
                refresh();
              }}
            >
              {item}
            </button>
          ))}
        </div>
        <p style={muted}>Last updated: {txt(room.updatedAt || room.createdAt, "Not listed")} • Age: {age} day(s)</p>
        <p style={muted}>Next action: {nextActionFor(kind, room)}</p>
      </div>

      <div style={{ marginTop: 16 }}>
        <div style={eyebrow}>Recent Activity</div>
        {readRoomActivity(kind, room).slice(0, 3).length ? (
          readRoomActivity(kind, room).slice(0, 3).map((event, index) => (
            <p key={`${event.at}-${index}`} style={muted}>
              {new Date(event.at).toLocaleString()} • {event.action}: {event.note}
            </p>
          ))
        ) : (
          <p style={muted}>No room activity logged yet.</p>
        )}
      </div>

      <div style={{ ...row, marginTop: 16 }}>
        <Link href={href} style={goldBtn}>Open</Link>
        <button type="button" style={watching ? goldBtn : btn} onClick={() => { toggleWatchRoom(kind, room); refresh(); }}>{watching ? "Following" : "Watch"}</button>
        <Link href={`/messages?type=${kind}&room=${encodeURIComponent(id)}&subject=${encodeURIComponent((kind === "deal" ? "Deal Room: " : "Pain Room: ") + roomTitle(room, kind))}`} style={btn}>Message</Link>

        {(roomAssignedToCurrentMember(room) || roomRoutedToCurrentMember(room) || routeStatus) && routeStatus !== "accepted" && routeStatus !== "claimed" ? (
          <button type="button" style={goldBtn} onClick={() => { setCurrentRouteStatus(kind, room, "accepted"); refresh(); }}>Accept Route</button>
        ) : null}
        {(roomAssignedToCurrentMember(room) || roomRoutedToCurrentMember(room) || routeStatus) && routeStatus !== "passed" ? (
          <button type="button" style={btn} onClick={() => { setCurrentRouteStatus(kind, room, "passed"); refresh(); }}>Pass</button>
        ) : null}
        {(roomAssignedToCurrentMember(room) || roomRoutedToCurrentMember(room) || routeStatus) && routeStatus !== "claimed" ? (
          <button type="button" style={goldBtn} onClick={() => { setCurrentRouteStatus(kind, room, "claimed"); refresh(); }}>Claim Execution</button>
        ) : null}

        {status !== "saved" ? <button type="button" style={btn} onClick={() => { saveRoomStatus(kind, room, "saved"); refresh(); }}>Save</button> : null}
        {status !== "archived" ? <button type="button" style={btn} onClick={() => { saveRoomStatus(kind, room, "archived"); refresh(); }}>Archive</button> : null}
        {kind === "deal" && status !== "sold" ? <button type="button" style={goldBtn} onClick={() => { saveRoomStatus(kind, room, "sold"); refresh(); }}>Mark Sold</button> : null}
        {kind === "pain" && status !== "resolved" ? <button type="button" style={goldBtn} onClick={() => { saveRoomStatus(kind, room, "resolved"); refresh(); }}>Mark Resolved</button> : null}
        {status !== "deleted" ? <button type="button" style={redBtn} onClick={() => { saveRoomStatus(kind, room, "deleted"); refresh(); }}>Delete</button> : null}
        {status !== "active" ? <button type="button" style={btn} onClick={() => { saveRoomStatus(kind, room, "active"); refresh(); }}>Restore Active</button> : null}
      </div>
    </div>
  );
}

export default function MyRoomsPage() {
  const [tick, setTick] = useState(0);
  const [view, setView] = useState<ViewKey>("activeDeals");

  useEffect(() => {
    const refresh = () => setTick((value) => value + 1);
    window.addEventListener("storage", refresh);
    window.addEventListener("vaultforge-room-state-change", refresh);
    window.addEventListener("vaultforge-my-rooms-change", refresh);
    window.addEventListener("vaultforge-room-watch-change", refresh);
    window.addEventListener("vaultforge-room-activity-change", refresh);
    window.addEventListener("vaultforge-route-status-change", refresh);
    window.addEventListener("vaultforge-deal-change", refresh);
    window.addEventListener("vaultforge-pain-change", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("vaultforge-room-state-change", refresh);
      window.removeEventListener("vaultforge-my-rooms-change", refresh);
      window.removeEventListener("vaultforge-room-watch-change", refresh);
      window.removeEventListener("vaultforge-room-activity-change", refresh);
      window.removeEventListener("vaultforge-route-status-change", refresh);
      window.removeEventListener("vaultforge-deal-change", refresh);
      window.removeEventListener("vaultforge-pain-change", refresh);
    };
  }, []);

  const allDealRooms = useMemo(() => allRooms("deal"), [tick]);
  const allPainRooms = useMemo(() => allRooms("pain"), [tick]);
  const deals = useMemo(() => allDealRooms.filter(roomBelongsToCurrentMember), [allDealRooms]);
  const pains = useMemo(() => allPainRooms.filter(roomBelongsToCurrentMember), [allPainRooms]);
  const visible = useMemo(() => roomsFor(view, deals, pains), [view, deals, pains]);
  const stages = useMemo(() => stageCounts(deals, pains), [deals, pains]);
  const refresh = () => setTick((value) => value + 1);

  const needsAttention = attentionCount(deals, pains);

  const cards: { view: ViewKey; title: string; note: string }[] = [
    { view: "activeDeals", title: "Active Deals", note: "my open opportunity rooms" },
    { view: "activePain", title: "Active Pain", note: "my open pressure rooms" },
    { view: "savedDeals", title: "Saved Deals", note: "kept opportunity rooms" },
    { view: "savedPain", title: "Saved Pain", note: "kept pain rooms" },
    { view: "assignedToMe", title: "Assigned To Me", note: "rooms assigned into my workspace" },
    { view: "routedToMe", title: "Routed To Me", note: "rooms routed for action" },
    { view: "following", title: "Following", note: "rooms I am watching" },
    { view: "archived", title: "Archived", note: "not active, not deleted" },
    { view: "sold", title: "Sold Deals", note: "completed opportunity rooms" },
    { view: "resolved", title: "Resolved Pain", note: "handled problem rooms" },
    { view: "deleted", title: "Deleted", note: "hidden cleanup folder" },
  ];

  return (
    <main style={page}>
      <style>{styleTag}</style>
      <div style={wrap}>
        <Nav />
        <VaultForgeBrandLogo />
        <MemberDisplayCard />

        <section style={hero}>
          <div style={eyebrow}>My Rooms</div>
          <h1 style={h1}>Member workspace cleanup.</h1>
          <p style={sub}>
            Keep your own rooms clean without destroying the intelligence system. Mark sold, resolved, archived, saved, deleted, or restore active.
          </p>
          <div style={{ ...row, marginTop: 18 }}>
            <Link href="/deal-create" style={goldBtn}>Create Deal</Link>
            <Link href="/pain-intake" style={goldBtn}>Create Pain</Link>
            <Link href="/network" style={btn}>Network</Link>
            <Link href="/state-map" style={btn}>State Map</Link>
          </div>
        </section>

        <Section title="Workspace Ownership">
          <div style={grid}>
            <div style={activePanel}>
              <div style={eyebrow}>My Deal Rooms</div>
              <h2 style={h2}>{deals.filter(isOpenDealRoom).length}</h2>
              <p style={muted}>open active opportunity rooms only</p>
            </div>
            <div style={activePanel}>
              <div style={eyebrow}>My Pain Rooms</div>
              <h2 style={h2}>{pains.filter(isOpenPainRoom).length}</h2>
              <p style={muted}>open active pressure rooms only</p>
            </div>
            <div style={panel}>
              <div style={eyebrow}>Assigned / Routed</div>
              <h2 style={h2}>{openAssignedOrRoutedCount(deals, pains)}</h2>
              <p style={muted}>open rooms sent to this member for action</p>
            </div>
            <div style={panel}>
              <div style={eyebrow}>Global Hidden</div>
              <h2 style={h2}>{Math.max(0, allDealRooms.length + allPainRooms.length - deals.length - pains.length)}</h2>
              <p style={muted}>rooms not tied to this member identity</p>
            </div>
          </div>
        </Section>

        <Section title="Needs Attention">
          <div style={needsAttention ? pulseRed : activePanel}>
            <div style={eyebrow}>AI Room Health</div>
            <h2 style={h2}>{needsAttention}</h2>
            <p style={sub}>{needsAttention ? "room(s) need action, update, routing, sold/resolved status, or cleanup." : "No urgent room health warnings."}</p>
            <p style={muted}>This keeps member rooms from piling up stale, unsold, unresolved, or unfinished.</p>
          </div>
        </Section>

        <Section title="Execution Timeline">
          <div style={grid}>
            <div style={panel}><div style={eyebrow}>Deal New / Reviewing</div><h2 style={h2}>{(stages["New"] || 0) + (stages["Reviewing"] || 0)}</h2><p style={muted}>deals needing review</p></div>
            <div style={panel}><div style={eyebrow}>Deal Routed / Contract</div><h2 style={h2}>{(stages["Routed"] || 0) + (stages["Under Contract"] || 0)}</h2><p style={muted}>rooms in execution</p></div>
            <div style={activePanel}><div style={eyebrow}>Sold Deals</div><h2 style={h2}>{stages["Sold"] || 0}</h2><p style={muted}>completed opportunity rooms</p></div>
            <div style={panel}><div style={eyebrow}>Pain Diagnosing / Routed</div><h2 style={h2}>{(stages["Diagnosing"] || 0) + (stages["Routed"] || 0)}</h2><p style={muted}>pressure rooms moving</p></div>
            <div style={pulseRed}><div style={eyebrow}>Pain In Progress</div><h2 style={h2}>{stages["In Progress"] || 0}</h2><p style={muted}>solver work underway</p></div>
            <div style={activePanel}><div style={eyebrow}>Resolved Pain</div><h2 style={h2}>{stages["Resolved"] || 0}</h2><p style={muted}>handled problem rooms</p></div>
          </div>
        </Section>

        <Section title="Route Response Board">
          <div style={grid}>
            <div style={pulseRed}><div style={eyebrow}>Pending Routes</div><h2 style={h2}>{[...deals.map((room) => ({ kind: "deal" as RoomKind, room })), ...pains.map((room) => ({ kind: "pain" as RoomKind, room }))].filter((item) => currentRouteStatusForRoom(item.kind, item.room) === "pending").length}</h2><p style={muted}>waiting on accept/pass/claim</p></div>
            <div style={activePanel}><div style={eyebrow}>Accepted</div><h2 style={h2}>{[...deals.map((room) => ({ kind: "deal" as RoomKind, room })), ...pains.map((room) => ({ kind: "pain" as RoomKind, room }))].filter((item) => currentRouteStatusForRoom(item.kind, item.room) === "accepted").length}</h2><p style={muted}>accepted by this workspace</p></div>
            <div style={panel}><div style={eyebrow}>Passed</div><h2 style={h2}>{[...deals.map((room) => ({ kind: "deal" as RoomKind, room })), ...pains.map((room) => ({ kind: "pain" as RoomKind, room }))].filter((item) => currentRouteStatusForRoom(item.kind, item.room) === "passed").length}</h2><p style={muted}>not a fit / rejected</p></div>
            <div style={pulseGold}><div style={eyebrow}>Claimed</div><h2 style={h2}>{[...deals.map((room) => ({ kind: "deal" as RoomKind, room })), ...pains.map((room) => ({ kind: "pain" as RoomKind, room }))].filter((item) => currentRouteStatusForRoom(item.kind, item.room) === "claimed").length}</h2><p style={muted}>member claimed execution</p></div>
          </div>
        </Section>

        <Section title="Folder Cards">
          <div style={grid}>
            {cards.map((cardItem) => (
              <ViewCard
                key={cardItem.view}
                view={cardItem.view}
                title={cardItem.title}
                note={cardItem.note}
                count={countFor(cardItem.view, deals, pains)}
                active={view === cardItem.view}
                onClick={() => setView(cardItem.view)}
              />
            ))}
          </div>
        </Section>

        <Section title={cards.find((item) => item.view === view)?.title || "Rooms"}>
          {visible.length ? (
            <div style={grid}>
              {visible.map((item) => (
                <RoomCard key={`${item.kind}-${rid(item.room)}`} kind={item.kind} room={item.room} refresh={refresh} />
              ))}
            </div>
          ) : (
            <div style={panel}>
              <h2 style={h2}>No rooms here.</h2>
              <p style={sub}>Create a Deal or Pain room, or open another folder card.</p>
              <div style={{ ...row, marginTop: 16 }}>
                <Link href="/deal-create" style={goldBtn}>Create Deal</Link>
                <Link href="/pain-intake" style={goldBtn}>Create Pain</Link>
              </div>
            </div>
          )}
        </Section>

        <Section title="How This Works">
          <div style={grid}>
            <div style={panel}>
              <div style={eyebrow}>Member Cleanup</div>
              <p style={sub}>Delete hides from your workspace.</p>
              <p style={muted}>It does not have to destroy the global intelligence history.</p>
            </div>
            <div style={panel}>
              <div style={eyebrow}>Sold / Resolved</div>
              <p style={sub}>Deals become Sold. Pain becomes Resolved.</p>
              <p style={muted}>This later powers performance history and AI follow-up.</p>
            </div>
            <div style={panel}>
              <div style={eyebrow}>Restore</div>
              <p style={sub}>Any folder can restore back to Active.</p>
              <p style={muted}>This keeps the member area clean without panic deletes.</p>
            </div>
          </div>
        </Section>
      </div>
    </main>
  );
}