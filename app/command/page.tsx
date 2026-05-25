"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type View = "active" | "deal" | "pain" | "messages" | "saved" | "archived" | "deleted";
type RoomKind = "deal" | "pain";
type RoomStatus = "active" | "saved" | "archived" | "deleted";

type ProfileSnapshot = {
  id: string;
  name: string;
  company: string;
  email: string;
  memberType: string;
  basedState: string;
  basedCity: string;
  basedCounty: string;
  profilePhoto: string;
  companyLogo: string;
};

type CanonicalMemberRoom = {
  id: string;
  roomId: string;
  kind: RoomKind;
  roomType: RoomKind;
  workspace: "member-command";
  visibility: "member";
  title: string;
  status: RoomStatus;
  roomStatus: RoomStatus;
  city: string;
  county: string;
  state: string;
  assetClass: string;
  propertyType: string;
  strategy: string[];
  message: string;
  summary: string;
  ownerId: string;
  ownerEmail: string;
  createdBy: string;
  createdByEmail: string;
  source: string;
  updatedAt: string;
  imageUrl: string;
  photoUrl: string;
  coverPhoto: string;
  photos: string[];
  raw: Record<string, any>;
};

type CanonicalMessage = {
  id: string;
  lane?: string;
  from: string;
  recipient: string;
  title: string;
  room: string;
  message: string;
  folder: "active" | "saved" | "archived" | "deleted" | "unread";
  unread: boolean;
  createdAt: string;
  senderWorkspace?: string;
  recipientWorkspace?: string;
  origin?: string;
  senderProfile?: Partial<ProfileSnapshot>;
  recipientProfile?: Partial<ProfileSnapshot>;
  roomSnapshot?: Record<string, any>;
};

const MEMBER_ROOMS_KEY = "vaultforge_member_rooms_v1";
const MEMBER_COMMAND_DEAL_ROOMS_KEY = "vaultforge_command_deal_rooms_v1";
const MEMBER_COMMAND_PAIN_ROOMS_KEY = "vaultforge_command_pain_rooms_v1";
const MEMBER_STATUS_KEY = "vf_member_command_room_status_v1";
const MEMBER_DELETED_FOREVER_KEY = "vf_member_command_deleted_forever_v1";

const THREADS_KEY = "vf_message_center_threads_v1";
const MESSAGE_DELETED_FOREVER_KEY = "vf_message_center_deleted_forever_v1";
const PROFILE_KEYS = ["vaultforge_profile", "vaultforge_member_profile", "vaultforge_clean_profile"];
const PROFILE_PHOTO_BACKUP_KEY = "vaultforge_member_profile_photo_v1";
const COMPANY_LOGO_BACKUP_KEY = "vaultforge_member_company_logo_v1";

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at 16% 10%, rgba(245,197,66,.12), transparent 30%), radial-gradient(circle at 88% 8%, rgba(120,0,30,.18), transparent 34%), #05070b",
  color: "#f7f8ff",
  padding: "26px 20px 90px",
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
};

const shell: React.CSSProperties = { maxWidth: 1180, margin: "0 auto" };
const nav: React.CSSProperties = { display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, marginBottom: 20 };
const brand: React.CSSProperties = { color: "#ffda5e", fontWeight: 1000, fontSize: 28, letterSpacing: "-.04em", marginRight: 10 };
const btn: React.CSSProperties = { display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: 999, border: "1px solid rgba(207,216,230,.18)", background: "rgba(18,24,38,.92)", color: "#f7f8ff", padding: "12px 18px", fontWeight: 900, textDecoration: "none", cursor: "pointer" };
const goldBtn: React.CSSProperties = { ...btn, background: "linear-gradient(135deg,#ffe16a,#f4bf37)", color: "#080a10", border: "1px solid rgba(255,220,90,.65)" };
const redBtn: React.CSSProperties = { ...btn, background: "rgba(90,10,18,.72)", color: "#ffb2b2", border: "1px solid rgba(255,65,65,.65)" };
const card: React.CSSProperties = { border: "1px solid rgba(207,216,230,.16)", borderRadius: 26, background: "rgba(15,21,34,.88)", padding: 24, boxShadow: "0 18px 50px rgba(0,0,0,.24)", marginBottom: 20 };
const goldCard: React.CSSProperties = { ...card, borderColor: "rgba(245,197,66,.42)", background: "linear-gradient(135deg,rgba(22,25,37,.96),rgba(33,31,20,.82))" };
const panel: React.CSSProperties = { border: "1px solid rgba(207,216,230,.15)", borderRadius: 22, background: "rgba(17,23,36,.78)", padding: 20 };
const grid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(235px,1fr))", gap: 14 };
const roomGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(285px,1fr))", gap: 14 };
const row: React.CSSProperties = { display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" };
const eyebrow: React.CSSProperties = { color: "#ffda5e", textTransform: "uppercase", letterSpacing: ".34em", fontSize: 12, fontWeight: 1000 };
const h1: React.CSSProperties = { fontSize: "clamp(42px,7vw,82px)", lineHeight: ".92", letterSpacing: "-.08em", margin: "12px 0", fontWeight: 1000 };
const h2: React.CSSProperties = { fontSize: "clamp(30px,4.5vw,54px)", lineHeight: ".95", letterSpacing: "-.065em", margin: "10px 0", fontWeight: 1000 };
const h3: React.CSSProperties = { fontSize: 30, lineHeight: 1, letterSpacing: "-.05em", margin: "8px 0", fontWeight: 1000 };
const sub: React.CSSProperties = { color: "rgba(235,240,255,.78)", fontSize: 20, lineHeight: 1.45, margin: "8px 0" };
const muted: React.CSSProperties = { color: "rgba(235,240,255,.68)", fontSize: 15, lineHeight: 1.45, margin: "6px 0" };
const avatar: React.CSSProperties = { width: 64, height: 64, objectFit: "cover", borderRadius: 999, border: "1px solid rgba(245,197,66,.45)", background: "rgba(0,0,0,.35)" };
const imageStyle: React.CSSProperties = { width: "100%", height: 190, objectFit: "cover", borderRadius: 18, border: "1px solid rgba(245,197,66,.22)", marginBottom: 12, background: "rgba(0,0,0,.35)" };
const brandLogoStyle: React.CSSProperties = { width: "100%", maxWidth: 420, height: 210, objectFit: "contain", borderRadius: 22, border: "1px solid rgba(245,197,66,.28)", background: "rgba(0,0,0,.35)", padding: 18 };

function parseJson<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function readImageBackup(key: string) {
  if (typeof window === "undefined") return "";
  const raw = window.localStorage.getItem(key);
  if (!raw) return "";
  const parsed = parseJson<string | null>(raw, null);
  return String(parsed || raw).trim().replace(/^"|"$/g, "");
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

function isBadText(value: unknown) {
  const text = cleanLower(value);
  return !text || text === "na" || text === "n/a" || text === "not listed" || text === "untitled" || text === "untitled room" || text === "undefined" || text === "null";
}

function list(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => clean(item)).filter(Boolean);
  if (typeof value === "string" && value.trim()) return value.split(",").map((item) => item.trim()).filter(Boolean);
  return [];
}

function listText(value: unknown) {
  return list(value).join(" • ");
}

function currentEmail() {
  if (typeof window === "undefined") return "";
  return (
    window.localStorage.getItem("vf_email") ||
    window.localStorage.getItem("vaultforge_email") ||
    window.localStorage.getItem("email") ||
    window.localStorage.getItem("vf_member_email") ||
    window.localStorage.getItem("vf_current_email") ||
    ""
  );
}

function readProfile(): ProfileSnapshot {
  const fallback: ProfileSnapshot = {
    id: currentEmail() || "local_member",
    name: "VaultForge Member",
    company: "Company not listed",
    email: currentEmail(),
    memberType: "Member",
    basedState: "",
    basedCity: "",
    basedCounty: "",
    profilePhoto: "",
    companyLogo: "",
  };

  if (typeof window === "undefined") return fallback;

  const backupPhoto = readImageBackup(PROFILE_PHOTO_BACKUP_KEY);
  const backupLogo = readImageBackup(COMPANY_LOGO_BACKUP_KEY);
  for (const key of PROFILE_KEYS) {
    const profile = parseJson<any | null>(window.localStorage.getItem(key), null);
    if (profile && typeof profile === "object") {
      const email = clean(profile.email || fallback.email);
      return {
        id: clean(profile.id || email || fallback.id, fallback.id),
        name: clean(profile.name || profile.fullName || profile.full_name || fallback.name, fallback.name),
        company: clean(profile.company || profile.companyName || fallback.company, fallback.company),
        email,
        memberType: clean(profile.memberType || profile.member_type || fallback.memberType, fallback.memberType),
        basedState: clean(profile.basedState || profile.state || profile.homeState),
        basedCity: clean(profile.basedCity || profile.city),
        basedCounty: clean(profile.basedCounty || profile.county),
        profilePhoto: clean(profile.profilePhoto || profile.photoUrl || profile.avatar || backupPhoto),
        companyLogo: clean(profile.companyLogo || profile.logoUrl || backupLogo),
      };
    }
  }

  return { ...fallback, profilePhoto: backupPhoto, companyLogo: backupLogo };
}

function statusOverrides(): Record<string, RoomStatus> {
  if (typeof window === "undefined") return {};
  return parseJson<Record<string, RoomStatus>>(window.localStorage.getItem(MEMBER_STATUS_KEY), {});
}

function writeStatus(id: string, status: RoomStatus) {
  if (typeof window === "undefined") return;
  const current = statusOverrides();
  current[id] = status;
  window.localStorage.setItem(MEMBER_STATUS_KEY, JSON.stringify(current));
}

function deletedForeverIds() {
  if (typeof window === "undefined") return [] as string[];
  return parseJson<string[]>(window.localStorage.getItem(MEMBER_DELETED_FOREVER_KEY), []);
}

function writeDeletedForever(id: string) {
  if (typeof window === "undefined") return;
  const ids = Array.from(new Set([...deletedForeverIds(), id]));
  window.localStorage.setItem(MEMBER_DELETED_FOREVER_KEY, JSON.stringify(ids));
}

function statusFrom(row: any): RoomStatus {
  const raw = cleanLower(row?.roomStatus || row?.status || row?.folder || "active");
  if (raw.includes("delete") || raw.includes("trash")) return "deleted";
  if (raw.includes("archive")) return "archived";
  if (raw.includes("save")) return "saved";
  return "active";
}

function kindFrom(row: any): RoomKind {
  const raw = `${row?.kind || ""} ${row?.roomType || ""} ${row?.source || ""} ${row?.problemType || ""}`.toLowerCase();
  return raw.includes("pain") ? "pain" : "deal";
}

function validMemberRoom(row: any) {
  if (!row || typeof row !== "object") return false;

  const id = clean(row.id || row.roomId);
  const title = clean(row.title || row.dealTitle || row.painTitle || row.propertyName || row.address);
  const workspace = cleanLower(row.workspace);
  const visibility = cleanLower(row.visibility);
  const source = cleanLower(row.source);
  const ownerEmail = clean(row.ownerEmail || row.createdByEmail || row.memberEmail);
  const summary = clean(row.message || row.summary || row.analyzer || row.notes || row.problem || row.description);

  if (!id) return false;
  if (isBadText(title)) return false;
  if (!ownerEmail && !summary) return false;

  return (
    workspace === "member-command" ||
    visibility === "member" ||
    source === "deal-create" ||
    source === "pain-intake"
  );
}

function normalizeMemberRoom(row: any, overrides: Record<string, RoomStatus>): CanonicalMemberRoom | null {
  if (!validMemberRoom(row)) return null;

  const id = clean(row.id || row.roomId);
  const kind = kindFrom(row);
  const status = overrides[id] || statusFrom(row);

  return {
    id,
    roomId: id,
    kind,
    roomType: kind,
    workspace: "member-command",
    visibility: "member",
    title: clean(row.title || row.dealTitle || row.painTitle || row.propertyName || row.address),
    status,
    roomStatus: status,
    city: clean(row.city || row.propertyCity || row.marketCity),
    county: clean(row.county || row.propertyCounty || row.marketCounty),
    state: clean(row.state || row.propertyState || row.marketState),
    assetClass: clean(row.assetClass || row.asset || row.problemType),
    propertyType: clean(row.propertyType || row.category),
    strategy: list(row.strategy || row.strategies),
    message: clean(row.message || row.summary || row.analyzer || row.notes || row.problem || row.description, "No room notes listed."),
    summary: clean(row.summary || row.message || row.analyzer || row.notes || row.problem || row.description),
    ownerId: clean(row.ownerId || row.createdBy || row.memberId),
    ownerEmail: clean(row.ownerEmail || row.createdByEmail || row.memberEmail),
    createdBy: clean(row.createdBy || row.ownerId),
    createdByEmail: clean(row.createdByEmail || row.ownerEmail),
    source: clean(row.source || MEMBER_ROOMS_KEY),
    updatedAt: clean(row.updatedAt || row.updated_at || row.createdAt || row.created_at || new Date().toISOString()),
    imageUrl: clean(row.imageUrl || row.coverPhoto || row.photoUrl || row.photos?.[0] || row.photoUrls?.[0]),
    photoUrl: clean(row.photoUrl || row.imageUrl || row.coverPhoto || row.photos?.[0] || row.photoUrls?.[0]),
    coverPhoto: clean(row.coverPhoto || row.imageUrl || row.photoUrl || row.photos?.[0] || row.photoUrls?.[0]),
    photos: list(row.photos || row.photoUrls),
    raw: row,
  };
}

function readRoomRows(key: string) {
  if (typeof window === "undefined") return [] as any[];
  const rows = parseJson<any[]>(window.localStorage.getItem(key), []);
  return Array.isArray(rows) ? rows : [];
}

function writeCleanRows(key: string, rows: any[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(rows));
}

function loadMemberRooms() {
  if (typeof window === "undefined") return [] as CanonicalMemberRoom[];

  const keys = [MEMBER_ROOMS_KEY, MEMBER_COMMAND_DEAL_ROOMS_KEY, MEMBER_COMMAND_PAIN_ROOMS_KEY];
  const deleted = new Set(deletedForeverIds());
  const overrides = statusOverrides();
  const rooms: CanonicalMemberRoom[] = [];

  keys.forEach((key) => {
    const rows = readRoomRows(key);
    const cleanRows = rows.filter((row) => {
      const id = clean(row?.id || row?.roomId);
      return id && !deleted.has(id) && validMemberRoom(row);
    });

    if (cleanRows.length !== rows.length) writeCleanRows(key, cleanRows);

    cleanRows.forEach((row) => {
      const normalized = normalizeMemberRoom(row, overrides);
      if (normalized) rooms.push(normalized);
    });
  });

  const map = new Map<string, CanonicalMemberRoom>();
  rooms.forEach((room) => {
    const old = map.get(room.id);
    if (!old || old.updatedAt < room.updatedAt) map.set(room.id, room);
  });

  return Array.from(map.values()).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

function saveRoomBack(room: CanonicalMemberRoom) {
  if (typeof window === "undefined") return;

  [MEMBER_ROOMS_KEY, MEMBER_COMMAND_DEAL_ROOMS_KEY, MEMBER_COMMAND_PAIN_ROOMS_KEY].forEach((key) => {
    const rows = readRoomRows(key);
    const next = rows.map((row) => {
      const id = clean(row?.id || row?.roomId);
      if (id !== room.id) return row;
      return { ...row, status: room.status, roomStatus: room.status, updatedAt: new Date().toISOString() };
    });
    writeCleanRows(key, next);
  });
}

function deletedMessageIds() {
  if (typeof window === "undefined") return [] as string[];
  return parseJson<string[]>(window.localStorage.getItem(MESSAGE_DELETED_FOREVER_KEY), []);
}

function isCanonicalMemberMessage(row: any, profile: ProfileSnapshot) {
  if (!row || typeof row !== "object") return false;

  const senderWorkspace = cleanLower(row.senderWorkspace || row.thread?.senderWorkspace);
  const recipientWorkspace = cleanLower(row.recipientWorkspace || row.thread?.recipientWorkspace);
  const origin = cleanLower(row.origin || row.thread?.origin);
  const blob = JSON.stringify(row).toLowerCase();
  const email = profile.email.toLowerCase();

  const canonicalWorkspace =
    senderWorkspace === "member" ||
    senderWorkspace === "member-command" ||
    senderWorkspace === "investor" ||
    recipientWorkspace === "member-owner" ||
    recipientWorkspace === "member" ||
    recipientWorkspace === "member-command" ||
    origin === "investor-room" ||
    origin === "message-center";

  if (!canonicalWorkspace) return false;
  if (!email) return blob.includes("member-owner") || blob.includes("bcrsoutheast@gmail.com");
  return blob.includes(email) || blob.includes("member-owner") || blob.includes("bcrsoutheast@gmail.com");
}

function normalizeMessage(row: any): CanonicalMessage {
  const thread = row.thread && typeof row.thread === "object" ? row.thread : row;
  const messages = Array.isArray(thread.messages) ? thread.messages : Array.isArray(row.messages) ? row.messages : [];
  const last = messages[messages.length - 1];

  return {
    id: clean(thread.id || row.id || `thread-${Date.now()}`),
    lane: clean(thread.lane || "Message"),
    from: clean(thread.from || thread.senderProfile?.email || thread.senderProfile?.name || last?.from || "Not listed", "Not listed"),
    recipient: clean(thread.recipient || last?.recipient || "VaultForge Owner", "VaultForge Owner"),
    title: clean(thread.title || row.title || "Untitled Message", "Untitled Message"),
    room: clean(thread.room || thread.roomSnapshot?.title || row.room || "General", "General"),
    message: clean(thread.message || last?.message || "No message entered.", "No message entered."),
    folder: clean(thread.folder || row.folder || "active", "active") as CanonicalMessage["folder"],
    unread: Boolean(thread.unread ?? row.unread),
    createdAt: clean(thread.createdAt || row.created_at || ""),
    senderWorkspace: clean(thread.senderWorkspace || row.sender_workspace),
    recipientWorkspace: clean(thread.recipientWorkspace || row.recipient_workspace),
    origin: clean(thread.origin || row.origin),
    senderProfile: thread.senderProfile,
    recipientProfile: thread.recipientProfile,
    roomSnapshot: thread.roomSnapshot,
  };
}

function loadLocalCanonicalMessages(profile: ProfileSnapshot) {
  if (typeof window === "undefined") return [] as CanonicalMessage[];

  const deleted = new Set(deletedMessageIds());
  const rows = parseJson<any[]>(window.localStorage.getItem(THREADS_KEY), []);
  if (!Array.isArray(rows)) return [];

  return rows
    .filter((row) => {
      const id = clean(row?.id || row?.thread?.id);
      return id && !deleted.has(id) && isCanonicalMemberMessage(row, profile);
    })
    .map(normalizeMessage);
}

async function loadMessages(profile: ProfileSnapshot) {
  const local = loadLocalCanonicalMessages(profile);

  try {
    const params = new URLSearchParams();
    if (profile.email) params.set("email", profile.email);
    if (profile.name) params.set("name", profile.name);

    const response = await fetch(`/api/messages/list?${params.toString()}`, { cache: "no-store" });
    const data = await response.json();

    if (!data?.ok || !Array.isArray(data.threads)) return local;

    const remote = data.threads
      .filter((row: any) => isCanonicalMemberMessage(row, profile))
      .map(normalizeMessage);

    const map = new Map<string, CanonicalMessage>();
    [...remote, ...local].forEach((message) => {
      if (!map.has(message.id)) map.set(message.id, message);
    });

    return Array.from(map.values());
  } catch {
    return local;
  }
}

function locationLine(room: CanonicalMemberRoom) {
  return [room.city, room.county, room.state].filter(Boolean).join(", ") || "Location not listed";
}

function assetLine(room: CanonicalMemberRoom) {
  return [room.assetClass, room.propertyType, ...room.strategy].filter(Boolean).join(" • ") || "Details not listed";
}

function roomHref(room: CanonicalMemberRoom) {
  const encoded = encodeURIComponent(room.id);
  return room.kind === "pain" ? `/pain-rooms/${encoded}` : `/deal-rooms/${encoded}`;
}

function roomImage(room: CanonicalMemberRoom) {
  return room.imageUrl || room.coverPhoto || room.photoUrl || room.photos[0] || "";
}

function shortRoomMessage(room: CanonicalMemberRoom) {
  const location = locationLine(room);
  const asset = assetLine(room);
  const base = room.kind === "deal" ? "Deal room" : "Pain room";
  const summary = room.summary || room.message;

  if (summary && summary.length <= 240) return summary;

  return `${base}: ${room.title}. ${asset}. ${location}. Open the room for photos, numbers, notes, routing, messages, and next steps.`;
}

function profileLine(profile: ProfileSnapshot) {
  return [profile.email, profile.memberType, profile.basedState].filter(Boolean).join(" • ");
}

function AlertTile({ label, count, note, active, onClick }: { label: string; count: number; note: string; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} style={{ ...panel, minHeight: 148, textAlign: "left", cursor: "pointer", borderColor: active ? "rgba(245,197,66,.72)" : "rgba(207,216,230,.15)" }}>
      <div style={eyebrow}>{label}</div>
      <h2 style={{ ...h2, color: count ? "#1e90ff" : "#f7f8ff" }}>{count}</h2>
      <p style={muted}>{note}</p>
      <p style={{ ...muted, color: "#ffd45a", fontWeight: 950 }}>Tap to open</p>
    </button>
  );
}

function MessageCard({ thread }: { thread: CanonicalMessage }) {
  return (
    <article style={{ ...panel, borderColor: thread.unread ? "rgba(245,197,66,.72)" : "rgba(207,216,230,.15)" }}>
      <div style={eyebrow}>{thread.lane || "Message"} • {thread.folder}</div>
      <h3 style={h3}>{thread.title}</h3>
      <p style={muted}><strong style={{ color: "#f7f8ff" }}>From:</strong> {thread.senderProfile?.name || thread.from}</p>
      <p style={muted}><strong style={{ color: "#f7f8ff" }}>Recipient:</strong> {thread.recipient}</p>
      <p style={muted}><strong style={{ color: "#f7f8ff" }}>Room:</strong> {thread.room}</p>
      <p style={muted}>{thread.message}</p>
      <div style={{ ...row, marginTop: 12 }}><Link href={`/messages?thread=${encodeURIComponent(thread.id)}`} style={goldBtn}>Open / Reply</Link></div>
    </article>
  );
}

function RoomCard({ room, moveRoom, deleteForever }: { room: CanonicalMemberRoom; moveRoom: (id: string, status: RoomStatus) => void; deleteForever: (id: string) => void }) {
  return (
    <article style={{ ...panel, borderColor: room.status === "deleted" ? "rgba(255,65,65,.56)" : "rgba(245,197,66,.42)" }}>
      {roomImage(room) ? <img src={roomImage(room)} alt={room.title} style={imageStyle} /> : null}
      <div style={eyebrow}>{room.kind === "deal" ? "Deal Room" : "Pain Room"} • {room.status}</div>
      <h3 style={h3}>{room.title}</h3>
      <p style={sub}>{locationLine(room)}</p>
      <p style={muted}>{assetLine(room)}</p>

      <div style={{ margin: "16px 0" }}>
        <div style={eyebrow}>{room.kind === "deal" ? "Deal Momentum" : "Pain Pressure"} • {room.status}</div>
        <div style={{ height: 12, background: "rgba(0,0,0,.45)", borderRadius: 999, overflow: "hidden", marginTop: 10 }}>
          <div style={{ width: room.status === "active" ? "68%" : room.status === "saved" ? "42%" : "18%", height: "100%", background: room.kind === "pain" ? "linear-gradient(90deg,#ff365d,#ff9f43)" : "linear-gradient(90deg,#ffe16a,#1e90ff)" }} />
        </div>
      </div>

      <p style={muted}>{shortRoomMessage(room)}</p>
      <p style={muted}>Last updated: {room.updatedAt}</p>

      <div style={{ ...row, marginTop: 14 }}>
        <Link href={roomHref(room)} style={goldBtn}>Open Room</Link>
        <button type="button" style={goldBtn} onClick={() => moveRoom(room.id, "active")}>Restore Active</button>
        <button type="button" style={btn} onClick={() => moveRoom(room.id, "saved")}>Save</button>
        <button type="button" style={btn} onClick={() => moveRoom(room.id, "archived")}>Archive</button>
        <button type="button" style={redBtn} onClick={() => moveRoom(room.id, "deleted")}>Delete</button>
        {room.status === "deleted" ? <button type="button" style={redBtn} onClick={() => deleteForever(room.id)}>Delete Forever</button> : null}
      </div>
    </article>
  );
}

export default function CommandPage() {
  const [rooms, setRooms] = useState<CanonicalMemberRoom[]>([]);
  const [messages, setMessages] = useState<CanonicalMessage[]>([]);
  const [profile, setProfile] = useState<ProfileSnapshot>(() => readProfile());
  const [view, setView] = useState<View>("active");

  useEffect(() => {
    const nextProfile = readProfile();
    setProfile(nextProfile);
    setRooms(loadMemberRooms());
    loadMessages(nextProfile).then(setMessages);

    function refresh() {
      const refreshedProfile = readProfile();
      setProfile(refreshedProfile);
      setRooms(loadMemberRooms());
      loadMessages(refreshedProfile).then(setMessages);
    }

    window.addEventListener("storage", refresh);
    window.addEventListener("vaultforge-command-room-change", refresh);
    window.addEventListener("vaultforge-room-state-change", refresh);
    window.addEventListener("vaultforge-message-change", refresh);
    window.addEventListener("vaultforge-profile-change", refresh);

    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("vaultforge-command-room-change", refresh);
      window.removeEventListener("vaultforge-room-state-change", refresh);
      window.removeEventListener("vaultforge-message-change", refresh);
      window.removeEventListener("vaultforge-profile-change", refresh);
    };
  }, []);

  const grouped = useMemo(() => ({
    active: rooms.filter((room) => room.status === "active"),
    deal: rooms.filter((room) => room.kind === "deal" && room.status === "active"),
    pain: rooms.filter((room) => room.kind === "pain" && room.status === "active"),
    saved: rooms.filter((room) => room.status === "saved"),
    archived: rooms.filter((room) => room.status === "archived"),
    deleted: rooms.filter((room) => room.status === "deleted"),
  }), [rooms]);

  const activeMessages = messages.filter((message) => message.folder === "active");
  const unreadMessages = messages.filter((message) => message.unread && message.folder !== "deleted");
  const visible = view === "messages" ? [] : grouped[view];

  function moveRoom(id: string, status: RoomStatus) {
    writeStatus(id, status);

    const next = rooms.map((room) => {
      if (room.id !== id) return room;
      const updated = { ...room, status, roomStatus: status, updatedAt: new Date().toISOString() };
      saveRoomBack(updated);
      return updated;
    });

    setRooms(next);
    setView(status);
  }

  function deleteForever(id: string) {
    writeDeletedForever(id);
    setRooms((current) => current.filter((room) => room.id !== id));
    setView("deleted");
  }

  return (
    <main style={page}>
      <div style={shell}>
        <nav style={nav}>
          <div style={brand}>VAULTFORGE</div>
          <Link href="/command" style={goldBtn}>Command</Link>
          <Link href="/my-rooms" style={btn}>My Rooms</Link>
          <Link href="/members" style={btn}>Members</Link>
          <Link href="/network" style={btn}>Network</Link>
          <Link href="/messages" style={btn}>Messages</Link>
          <Link href="/deal-create" style={btn}>Create Deal</Link>
          <Link href="/profile" style={btn}>Profile</Link>
          <Link href="/logout" style={redBtn}>Logout</Link>
        </nav>

        <section style={card}>
          <div style={eyebrow}>Member Alerts • {grouped.active.length} Active • {activeMessages.length} Messages</div>
          <div style={{ ...grid, marginTop: 16 }}>
            <AlertTile label="Deals" count={grouped.deal.length} note="canonical member deal rooms" active={view === "deal"} onClick={() => setView("deal")} />
            <AlertTile label="Pain" count={grouped.pain.length} note="canonical member pain rooms" active={view === "pain"} onClick={() => setView("pain")} />
            <AlertTile label="Messages" count={activeMessages.length} note={`${unreadMessages.length} unread canonical thread(s)`} active={view === "messages"} onClick={() => setView("messages")} />
            <AlertTile label="Saved" count={grouped.saved.length} note="saved projects and rooms" active={view === "saved"} onClick={() => setView("saved")} />
            <AlertTile label="Archived" count={grouped.archived.length} note="hidden but preserved" active={view === "archived"} onClick={() => setView("archived")} />
            <AlertTile label="Deleted" count={grouped.deleted.length} note="restore or delete forever" active={view === "deleted"} onClick={() => setView("deleted")} />
          </div>
        </section>

        <section style={goldCard}>
          <div style={eyebrow}>VaultForge Member Command</div>
          <h1 style={h1}>Canonical member workspace only.</h1>
          <p style={sub}>
            Member Command shows clean member rooms, saved projects, and room messages. Open a saved deal or pain room to see full project details, photos, messages, and next steps.
          </p>
          <div style={{ ...row, marginTop: 16 }}>
            <button type="button" style={goldBtn} onClick={() => setView("active")}>Open Active Rooms</button>
            <button type="button" style={view === "messages" ? goldBtn : btn} onClick={() => setView("messages")}>Messages ({activeMessages.length})</button>
            <Link href="/deal-create" style={goldBtn}>Create Deal</Link>
            <Link href="/messages" style={btn}>Open Message Center</Link>
          </div>
        </section>

        <section style={card}>
          <div style={eyebrow}>Member Brand Center</div>
          <div style={{ display: "flex", justifyContent: "center", textAlign: "center" }}>
            {profile.companyLogo ? (
              <img src={profile.companyLogo} alt={`${profile.company || profile.name || "Member"} company logo`} style={brandLogoStyle} />
            ) : profile.profilePhoto ? (
              <img src={profile.profilePhoto} alt={`${profile.name || "Member"} profile`} style={brandLogoStyle} />
            ) : (
              <div style={{ ...brandLogoStyle, display: "flex", alignItems: "center", justifyContent: "center", color: "#ffda5e", fontSize: 36, fontWeight: 1000, letterSpacing: "-.06em" }}>
                VAULTFORGE
              </div>
            )}
          </div>
          <p style={{ ...muted, textAlign: "center", marginTop: 12 }}>
            {profile.companyLogo ? "Company logo active." : "Upload a company logo in Profile to replace this member center logo."}
          </p>
        </section>

        <section style={card}>
          <div style={eyebrow}>Member Command Identity</div>
          <div style={row}>
            {profile.profilePhoto ? <img src={profile.profilePhoto} alt="Profile" style={avatar} /> : null}
            <div>
              <h2 style={h2}>{profile.name}</h2>
              <p style={sub}>{profile.company}</p>
              <p style={sub}>{profileLine(profile)}</p>
              <p style={sub}>{[profile.basedCity, profile.basedCounty, profile.basedState].filter(Boolean).join(", ") || "Location not listed"}</p>
            </div>
          </div>
        </section>

        <section style={card}>
          <div style={eyebrow}>Room Folders</div>
          <h2 style={h2}>Deal, Pain, and Message cards.</h2>
          <div style={{ ...row, marginTop: 14 }}>
            <button type="button" style={view === "active" ? goldBtn : btn} onClick={() => setView("active")}>Active ({grouped.active.length})</button>
            <button type="button" style={view === "deal" ? goldBtn : btn} onClick={() => setView("deal")}>Deals ({grouped.deal.length})</button>
            <button type="button" style={view === "pain" ? goldBtn : btn} onClick={() => setView("pain")}>Pain ({grouped.pain.length})</button>
            <button type="button" style={view === "messages" ? goldBtn : btn} onClick={() => setView("messages")}>Messages ({activeMessages.length})</button>
            <button type="button" style={view === "saved" ? goldBtn : btn} onClick={() => setView("saved")}>Saved ({grouped.saved.length})</button>
            <button type="button" style={view === "archived" ? goldBtn : btn} onClick={() => setView("archived")}>Archived ({grouped.archived.length})</button>
            <button type="button" style={view === "deleted" ? goldBtn : btn} onClick={() => setView("deleted")}>Deleted ({grouped.deleted.length})</button>
          </div>
        </section>

        {view === "messages" ? (
          <section style={card}>
            <div style={eyebrow}>Canonical Member Messages</div>
            <h2 style={h2}>Message threads attached to this member workspace.</h2>
            {messages.length ? (
              <div style={roomGrid}>{messages.map((thread) => <MessageCard key={thread.id} thread={thread} />)}</div>
            ) : (
              <div style={panel}><h2 style={h2}>No canonical messages yet.</h2><p style={sub}>Old legacy message records are ignored. New investor/member messages tied to canonical workspaces will show here.</p></div>
            )}
          </section>
        ) : (
          <section style={card}>
            <div style={eyebrow}>Selected Cards • {view}</div>
            <h2 style={h2}>{view === "deal" ? "Canonical Deal Rooms" : view === "pain" ? "Canonical Pain Rooms" : view === "deleted" ? "Deleted Rooms" : `${view.charAt(0).toUpperCase()}${view.slice(1)} Rooms`}</h2>
            {visible.length ? (
              <div style={roomGrid}>{visible.map((room) => <RoomCard key={room.id} room={room} moveRoom={moveRoom} deleteForever={deleteForever} />)}</div>
            ) : (
              <div style={panel}><h2 style={h2}>No canonical cards in this folder.</h2><p style={sub}>Legacy Untitled/NA rooms are ignored. Create a new canonical room and it will appear here.</p></div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}