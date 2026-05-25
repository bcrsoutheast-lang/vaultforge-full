"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Folder = "active" | "unread" | "saved" | "archived" | "deleted";
type Lane = "Admin" | "Member" | "Deal" | "Pain" | "Project" | "Network" | "General";

type ProfileSnapshot = {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  memberType: string;
  basedState: string;
  basedCity: string;
  basedCounty: string;
  profilePhoto: string;
};

type RoomSnapshot = {
  id: string;
  kind: string;
  title: string;
  city: string;
  state: string;
  ownerName: string;
  ownerEmail: string;
};

type ThreadMessage = {
  id: string;
  from: string;
  recipient: string;
  message: string;
  createdAt: string;
  senderProfile?: Partial<ProfileSnapshot>;
};

type MessageThread = {
  id: string;
  lane: Lane;
  from: string;
  recipient: string;
  title: string;
  room: string;
  roomId: string;
  message: string;
  folder: Folder;
  unread: boolean;
  createdAt: string;
  updatedAt: string;
  senderProfile: ProfileSnapshot;
  recipientProfile: Partial<ProfileSnapshot>;
  roomSnapshot?: RoomSnapshot;
  messages: ThreadMessage[];
};

const THREADS_KEY = "vf_message_center_threads_v1";
const DELETED_FOREVER_KEY = "vf_message_center_deleted_forever_v1";
const PROFILE_KEYS = ["vaultforge_profile", "vaultforge_member_profile", "vaultforge_clean_profile"];
const PROFILE_PHOTO_BACKUP_KEY = "vaultforge_member_profile_photo_v1";
const ADMIN_NAME = "VaultForge Admin";
const ADMIN_EMAIL = "bcrsoutheast@gmail.com";

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at 18% 10%, rgba(245,197,66,.12), transparent 32%), radial-gradient(circle at 86% 8%, rgba(120,0,30,.18), transparent 34%), #05070b",
  color: "#f7f8ff",
  padding: "28px 20px 90px",
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
};

const shell: React.CSSProperties = { maxWidth: 1180, margin: "0 auto" };
const row: React.CSSProperties = { display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" };
const nav: React.CSSProperties = { ...row, marginBottom: 20 };
const brand: React.CSSProperties = { color: "#ffda5e", fontWeight: 1000, fontSize: 28, letterSpacing: "-.04em", marginRight: 8 };
const button: React.CSSProperties = { border: "1px solid rgba(207,216,230,.18)", background: "rgba(18,24,38,.92)", color: "#f7f8ff", borderRadius: 999, padding: "12px 18px", fontWeight: 900, textDecoration: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" };
const goldButton: React.CSSProperties = { ...button, background: "linear-gradient(135deg,#ffe16a,#f4bf37)", color: "#080a10", border: "1px solid rgba(255,220,90,.65)" };
const redButton: React.CSSProperties = { ...button, background: "rgba(90,10,18,.72)", color: "#ffb2b2", border: "1px solid rgba(255,65,65,.65)" };
const card: React.CSSProperties = { border: "1px solid rgba(207,216,230,.16)", borderRadius: 26, background: "rgba(15,21,34,.88)", padding: 24, marginBottom: 20, boxShadow: "0 18px 50px rgba(0,0,0,.24)" };
const goldCard: React.CSSProperties = { ...card, borderColor: "rgba(245,197,66,.42)", background: "linear-gradient(135deg,rgba(22,25,37,.96),rgba(33,31,20,.82))" };
const tile: React.CSSProperties = { border: "1px solid rgba(245,197,66,.35)", borderRadius: 22, background: "rgba(17,23,36,.78)", padding: 20, color: "#f7f8ff", textAlign: "left" };
const grid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 14 };
const threadGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(285px,1fr))", gap: 14 };
const input: React.CSSProperties = { width: "100%", border: "1px solid rgba(207,216,230,.18)", background: "rgba(18,24,38,.92)", color: "#f7f8ff", borderRadius: 18, padding: "14px 16px", fontSize: 16, outline: "none", boxSizing: "border-box" };
const label: React.CSSProperties = { color: "#ffda5e", textTransform: "uppercase", letterSpacing: ".34em", fontSize: 12, fontWeight: 1000, display: "block", marginBottom: 8 };
const eyebrow: React.CSSProperties = { color: "#ffda5e", textTransform: "uppercase", letterSpacing: ".34em", fontSize: 12, fontWeight: 1000 };
const h1: React.CSSProperties = { fontSize: "clamp(42px,7vw,82px)", lineHeight: ".92", letterSpacing: "-.08em", margin: "12px 0", fontWeight: 1000 };
const h2: React.CSSProperties = { fontSize: "clamp(30px,4.5vw,54px)", lineHeight: ".95", letterSpacing: "-.065em", margin: "10px 0", fontWeight: 1000 };
const h3: React.CSSProperties = { fontSize: 28, lineHeight: 1, letterSpacing: "-.05em", margin: "8px 0", fontWeight: 1000 };
const sub: React.CSSProperties = { color: "rgba(235,240,255,.78)", fontSize: 20, lineHeight: 1.45, margin: "8px 0" };
const muted: React.CSSProperties = { color: "rgba(235,240,255,.68)", fontSize: 15, lineHeight: 1.45, margin: "6px 0" };
const avatar: React.CSSProperties = { width: 54, height: 54, objectFit: "cover", borderRadius: 999, border: "1px solid rgba(245,197,66,.45)", background: "rgba(0,0,0,.35)" };

function parseJson<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function clean(value: unknown, fallback = "") {
  const text = String(value || "").replace(/\\n/g, " ").replace(/\s+/g, " ").trim();
  return text || fallback;
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
    phone: "",
    memberType: "Member",
    basedState: "",
    basedCity: "",
    basedCounty: "",
    profilePhoto: "",
  };

  if (typeof window === "undefined") return fallback;

  const backupPhoto = clean(window.localStorage.getItem(PROFILE_PHOTO_BACKUP_KEY));
  for (const key of PROFILE_KEYS) {
    const profile = parseJson<any | null>(window.localStorage.getItem(key), null);
    if (profile && typeof profile === "object") {
      const email = clean(profile.email || fallback.email);
      return {
        id: clean(profile.id || email || fallback.id, fallback.id),
        name: clean(profile.name || profile.fullName || profile.full_name || fallback.name, fallback.name),
        company: clean(profile.company || profile.companyName || fallback.company, fallback.company),
        email,
        phone: clean(profile.phone || profile.phoneNumber),
        memberType: clean(profile.memberType || profile.member_type || fallback.memberType, fallback.memberType),
        basedState: clean(profile.basedState || profile.state || profile.homeState),
        basedCity: clean(profile.basedCity || profile.city),
        basedCounty: clean(profile.basedCounty || profile.county),
        profilePhoto: clean(profile.profilePhoto || profile.photoUrl || profile.avatar || backupPhoto),
      };
    }
  }

  return { ...fallback, profilePhoto: backupPhoto };
}

const ROOM_LOOKUP_KEYS = [
  "vaultforge_my_rooms_clean_v2",
  "vaultforge_member_rooms_v1",
  "vaultforge_command_rooms_v1",
  "vaultforge_command_deal_rooms_v1",
  "vaultforge_command_pain_rooms_v1",
  "vaultforge_owned_rooms_v1",
  "vaultforge_owned_deal_rooms_v1",
  "vaultforge_owned_pain_rooms_v1",
  "vaultforge_investor_deal_rooms_v1",
  "vaultforge_investor_pain_rooms_v1",
  "vaultforge_clean_deal_rooms",
];

function collectRows(value: any): any[] {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== "object") return [];
  const rows: any[] = [];

  Object.values(value).forEach((item) => {
    if (Array.isArray(item)) rows.push(...item);
  });

  if (value.id || value.roomId || value.title || value.name || value.subject) rows.push(value);
  return rows;
}

function roomOwnerEmail(row: any) {
  return clean(
    row?.ownerEmail ||
      row?.createdByEmail ||
      row?.contactEmail ||
      row?.memberEmail ||
      row?.submittedByEmail ||
      ""
  );
}

function roomOwnerName(row: any) {
  return clean(
    row?.ownerName ||
      row?.contactName ||
      row?.submittedByName ||
      row?.createdBy ||
      row?.ownerId ||
      "Room Owner"
  );
}

function roomTitle(row: any) {
  return clean(
    row?.title ||
      row?.dealTitle ||
      row?.painTitle ||
      row?.projectName ||
      row?.propertyName ||
      row?.subject ||
      row?.address ||
      ""
  );
}

function findRoomById(roomId: string, roomName = "") {
  if (typeof window === "undefined") return null;
  const targetId = clean(roomId);
  const targetName = clean(roomName).toLowerCase();

  const directKeys = targetId
    ? [`vaultforge_deal_room_${targetId}`, `vaultforge_pain_room_${targetId}`, `vaultforge_room_${targetId}`]
    : [];

  for (const key of directKeys) {
    const direct = parseJson<any | null>(window.localStorage.getItem(key), null);
    if (direct && typeof direct === "object") return direct;
  }

  for (const key of ROOM_LOOKUP_KEYS) {
    const parsed = parseJson<any>(window.localStorage.getItem(key), []);
    const rows = collectRows(parsed);
    const found = rows.find((row) => {
      const id = clean(row?.id || row?.roomId || row?.slug);
      const title = roomTitle(row).toLowerCase();
      return (targetId && id === targetId) || (targetName && title === targetName);
    });

    if (found) return found;
  }

  return null;
}

function snapshotFromRoom(row: any, fallbackRoomId = ""): RoomSnapshot | undefined {
  if (!row || typeof row !== "object") return undefined;

  const id = clean(row.id || row.roomId || fallbackRoomId);
  const title = roomTitle(row);
  if (!id && !title) return undefined;

  return {
    id: id || title,
    kind: clean(row.kind || row.roomType || row.problemType || "Room"),
    title: title || id,
    city: clean(row.city || row.propertyCity || row.marketCity),
    state: clean(row.state || row.propertyState || row.marketState),
    ownerName: roomOwnerName(row),
    ownerEmail: roomOwnerEmail(row),
  };
}

function recipientFromRoom(row: any, fallback = ADMIN_EMAIL) {
  return roomOwnerEmail(row) || fallback;
}

function titleFromRoom(row: any, fallback = "") {
  const title = roomTitle(row);
  return title ? `Message about ${title}` : fallback;
}



function deletedForeverIds(): string[] {
  if (typeof window === "undefined") return [];
  return parseJson<string[]>(window.localStorage.getItem(DELETED_FOREVER_KEY), []);
}

function saveDeletedForever(id: string) {
  if (typeof window === "undefined") return;
  const ids = Array.from(new Set([...deletedForeverIds(), id]));
  window.localStorage.setItem(DELETED_FOREVER_KEY, JSON.stringify(ids));
}

function normalizeFolder(value: unknown): Folder {
  const text = clean(value || "active").toLowerCase();
  if (text.includes("unread")) return "unread";
  if (text.includes("save")) return "saved";
  if (text.includes("archive")) return "archived";
  if (text.includes("delete") || text.includes("trash")) return "deleted";
  return "active";
}

function normalizeLane(value: unknown): Lane {
  const text = clean(value || "General").toLowerCase();
  if (text.includes("admin") || text.includes("owner")) return "Admin";
  if (text.includes("member") || text.includes("profile")) return "Member";
  if (text.includes("deal")) return "Deal";
  if (text.includes("pain") || text.includes("problem")) return "Pain";
  if (text.includes("project") || text.includes("room")) return "Project";
  if (text.includes("network")) return "Network";
  return "General";
}

function profileLine(profile?: Partial<ProfileSnapshot>) {
  if (!profile) return "Profile not attached";
  return [profile.name, profile.company, profile.email, profile.memberType, profile.basedState].filter(Boolean).join(" • ") || "Profile not attached";
}

function threadFromAny(row: any, fallbackProfile: ProfileSnapshot): MessageThread {
  const base = row?.thread && typeof row.thread === "object" ? row.thread : row || {};
  const messages = Array.isArray(base.messages) ? base.messages : Array.isArray(row?.messages) ? row.messages : [];
  const last = messages[messages.length - 1];

  const senderProfile = {
    ...fallbackProfile,
    ...(base.senderProfile && typeof base.senderProfile === "object" ? base.senderProfile : {}),
  };

  const recipientProfile = base.recipientProfile && typeof base.recipientProfile === "object" ? base.recipientProfile : {};

  const id = clean(base.id || row?.id || `thread-${Date.now()}-${Math.random().toString(16).slice(2)}`);

  return {
    id,
    lane: normalizeLane(base.lane || base.roomSnapshot?.kind || row?.room_kind),
    from: clean(base.from || senderProfile.email || senderProfile.name || last?.from || "Not listed", "Not listed"),
    recipient: clean(base.recipient || last?.recipient || row?.recipient_email || ADMIN_EMAIL, ADMIN_EMAIL),
    title: clean(base.title || row?.title || "Untitled Message", "Untitled Message"),
    room: clean(base.room || base.roomSnapshot?.title || row?.room || "General", "General"),
    roomId: clean(base.roomId || base.roomSnapshot?.id || row?.room_id),
    message: clean(base.message || last?.message || "No message entered.", "No message entered."),
    folder: normalizeFolder(base.folder || row?.folder),
    unread: Boolean(base.unread ?? row?.unread),
    createdAt: clean(base.createdAt || row?.created_at || new Date().toLocaleString(), new Date().toLocaleString()),
    updatedAt: clean(base.updatedAt || row?.updated_at || base.createdAt || row?.created_at || new Date().toLocaleString(), new Date().toLocaleString()),
    senderProfile,
    recipientProfile,
    roomSnapshot: base.roomSnapshot,
    messages: messages.length
      ? messages.map((item: any) => ({
          id: clean(item.id || `msg-${Date.now()}-${Math.random().toString(16).slice(2)}`),
          from: clean(item.from || base.from || senderProfile.email || senderProfile.name),
          recipient: clean(item.recipient || base.recipient || ADMIN_EMAIL),
          message: clean(item.message || base.message || "No message entered."),
          createdAt: clean(item.createdAt || base.createdAt || new Date().toLocaleString()),
          senderProfile: item.senderProfile || senderProfile,
        }))
      : [
          {
            id: `msg-${Date.now()}-${Math.random().toString(16).slice(2)}`,
            from: clean(base.from || senderProfile.email || senderProfile.name, "Not listed"),
            recipient: clean(base.recipient || ADMIN_EMAIL, ADMIN_EMAIL),
            message: clean(base.message || "No message entered.", "No message entered."),
            createdAt: clean(base.createdAt || new Date().toLocaleString()),
            senderProfile,
          },
        ],
  };
}

function readLocalThreads(profile: ProfileSnapshot): MessageThread[] {
  if (typeof window === "undefined") return [];
  const deleted = new Set(deletedForeverIds());
  const rows = parseJson<any[]>(window.localStorage.getItem(THREADS_KEY), []);

  if (!Array.isArray(rows)) return [];

  return rows
    .map((row) => threadFromAny(row, profile))
    .filter((thread) => thread.id && !deleted.has(thread.id) && thread.title !== "Untitled Message");
}

function saveThreads(threads: MessageThread[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(THREADS_KEY, JSON.stringify(threads));
  window.dispatchEvent(new Event("vaultforge-message-change"));
}

async function loadRemoteThreads(profile: ProfileSnapshot) {
  try {
    const params = new URLSearchParams();
    if (profile.email) params.set("email", profile.email);
    if (profile.name) params.set("name", profile.name);

    const response = await fetch(`/api/messages/list?${params.toString()}`, { cache: "no-store" });
    const data = await response.json();

    if (!data?.ok || !Array.isArray(data.threads)) return [] as MessageThread[];

    return data.threads.map((thread: any) => threadFromAny(thread, profile));
  } catch {
    return [] as MessageThread[];
  }
}

function laneForQuery(kind: string, room: string, recipient: string): Lane {
  const text = `${kind} ${room} ${recipient}`.toLowerCase();
  if (text.includes("admin") || text.includes("owner")) return "Admin";
  if (text.includes("deal")) return "Deal";
  if (text.includes("pain")) return "Pain";
  if (text.includes("project") || text.includes("room")) return "Project";
  if (text.includes("network") || text.includes("member")) return "Network";
  return "General";
}

function folderTitle(folder: Folder) {
  if (folder === "active") return "Active Messages";
  if (folder === "unread") return "Unread Messages";
  if (folder === "saved") return "Saved Messages";
  if (folder === "archived") return "Archived Messages";
  return "Deleted Messages";
}

function StatCard({ label, count, active, onClick }: { label: string; count: number; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...tile,
        cursor: "pointer",
        minHeight: 145,
        borderColor: active ? "rgba(245,197,66,.75)" : "rgba(245,197,66,.35)",
      }}
    >
      <div style={eyebrow}>{label}</div>
      <div style={{ color: "#1e90ff", fontSize: 44, fontWeight: 1000, margin: "8px 0" }}>{count}</div>
      <p style={muted}>message thread(s)</p>
      <p style={{ ...muted, color: "#ffda5e", fontWeight: 950 }}>Tap to open</p>
    </button>
  );
}

export default function MessagesPage() {
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [profile, setProfile] = useState<ProfileSnapshot>(() => ({
    id: "local_member",
    name: "VaultForge Member",
    company: "Company not listed",
    email: "",
    phone: "",
    memberType: "Member",
    basedState: "",
    basedCity: "",
    basedCounty: "",
    profilePhoto: "",
  }));
  const [folder, setFolder] = useState<Folder>("active");
  const [selected, setSelected] = useState<MessageThread | null>(null);
  const [syncStatus, setSyncStatus] = useState("Message center ready.");

  const [lane, setLane] = useState<Lane>("Admin");
  const [from, setFrom] = useState("");
  const [recipient, setRecipient] = useState(ADMIN_EMAIL);
  const [title, setTitle] = useState("");
  const [room, setRoom] = useState("");
  const [roomId, setRoomId] = useState("");
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState("");

  useEffect(() => {
    const currentProfile = readProfile();
    setProfile(currentProfile);
    setFrom(currentProfile.email || currentProfile.name || "");

    const params = new URLSearchParams(window.location.search);
    const incomingRecipient =
      clean(params.get("recipient")) ||
      clean(params.get("email")) ||
      clean(params.get("memberEmail")) ||
      clean(params.get("ownerEmail")) ||
      ADMIN_EMAIL;
    const incomingName =
      clean(params.get("name")) ||
      clean(params.get("memberName")) ||
      clean(params.get("owner")) ||
      clean(params.get("ownerName")) ||
      (incomingRecipient === ADMIN_EMAIL ? ADMIN_NAME : incomingRecipient);
    const incomingRoom = clean(params.get("room")) || clean(params.get("project")) || clean(params.get("title"));
    const incomingTitle = clean(params.get("title")) || (incomingRoom ? `Message about ${incomingRoom}` : "");
    const incomingKind = clean(params.get("kind")) || clean(params.get("lane"));
    const incomingRoomId = clean(params.get("roomId")) || clean(params.get("projectId")) || clean(params.get("id"));
    const attachedRoom = findRoomById(incomingRoomId, incomingRoom);
    const attachedSnapshot = snapshotFromRoom(attachedRoom, incomingRoomId);

    const resolvedRoomTitle = attachedSnapshot?.title || incomingRoom;
    const resolvedRecipient = attachedSnapshot?.ownerEmail || incomingRecipient;
    const resolvedRecipientName = attachedSnapshot?.ownerName || incomingName;
    const resolvedTitle = titleFromRoom(attachedRoom, incomingTitle || (resolvedRoomTitle ? `Message about ${resolvedRoomTitle}` : ""));

    if (resolvedRecipient) setRecipient(resolvedRecipient);
    if (resolvedTitle) setTitle(resolvedTitle);
    if (resolvedRoomTitle) setRoom(resolvedRoomTitle);
    if (incomingRoomId || attachedSnapshot?.id) setRoomId(incomingRoomId || attachedSnapshot?.id || "");
    setLane(laneForQuery(incomingKind, resolvedRoomTitle, resolvedRecipient || resolvedRecipientName));

    const local = readLocalThreads(currentProfile);
    setThreads(local);

    loadRemoteThreads(currentProfile).then((remote) => {
      const map = new Map<string, MessageThread>();
      [...remote, ...local].forEach((thread) => {
        if (!map.has(thread.id)) map.set(thread.id, thread);
      });
      const next = Array.from(map.values()).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      setThreads(next);
      saveThreads(next);
      setSyncStatus(remote.length ? "Supabase message sync active." : "Local message center active.");
    });
  }, []);

  const grouped = useMemo(() => ({
    active: threads.filter((thread) => thread.folder === "active"),
    unread: threads.filter((thread) => thread.unread && thread.folder !== "deleted"),
    saved: threads.filter((thread) => thread.folder === "saved"),
    archived: threads.filter((thread) => thread.folder === "archived"),
    deleted: threads.filter((thread) => thread.folder === "deleted"),
  }), [threads]);

  const visible = folder === "unread" ? grouped.unread : grouped[folder];

  function persist(next: MessageThread[]) {
    const sorted = next.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    setThreads(sorted);
    saveThreads(sorted);
  }

  async function pushToSupabase(thread: MessageThread) {
    try {
      const response = await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(thread),
      });
      const data = await response.json();

      if (data?.ok && data?.thread) {
        setSyncStatus("Message saved to Supabase.");
        return threadFromAny(data.thread, profile);
      }

      setSyncStatus(data?.error || "Message saved locally. Supabase did not accept it.");
      return thread;
    } catch {
      setSyncStatus("Message saved locally. Supabase unavailable.");
      return thread;
    }
  }

  async function createThread() {
    const cleanMessage = message.trim();
    const cleanTitle = title.trim();
    if (!cleanMessage && !cleanTitle) return;

    const now = new Date().toISOString();
    const senderProfile = readProfile();
    const attachedRoom = findRoomById(roomId, room);
    const attachedSnapshot = snapshotFromRoom(attachedRoom, roomId);

    const finalRecipient = recipientFromRoom(attachedRoom, recipient.trim() || ADMIN_EMAIL);
    const finalRoom = attachedSnapshot?.title || room.trim() || (lane === "Admin" ? "Admin" : "General");
    const finalTitle = cleanTitle || titleFromRoom(attachedRoom, `Message about ${finalRoom}`);

    const entry: ThreadMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      from: from.trim() || senderProfile.email || senderProfile.name || "Not listed",
      recipient: finalRecipient,
      message: cleanMessage || "No message entered.",
      createdAt: now,
      senderProfile,
    };

    const thread: MessageThread = {
      id: `thread-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      lane,
      from: entry.from,
      recipient: finalRecipient,
      title: finalTitle,
      room: finalRoom,
      roomId,
      message: entry.message,
      folder: "active",
      unread: true,
      createdAt: now,
      updatedAt: now,
      senderProfile,
      recipientProfile: {
        name: finalRecipient === ADMIN_EMAIL ? ADMIN_NAME : finalRecipient,
        email: finalRecipient.includes("@") ? finalRecipient : "",
        memberType: finalRecipient === ADMIN_EMAIL ? "Admin" : "Member",
      },
      roomSnapshot: attachedSnapshot || (roomId || finalRoom !== "General" ? {
        id: roomId || finalRoom,
        kind: lane,
        title: finalRoom,
        city: "",
        state: "",
        ownerName: finalRecipient === ADMIN_EMAIL ? ADMIN_NAME : finalRecipient,
        ownerEmail: finalRecipient.includes("@") ? finalRecipient : "",
      } : undefined),
      messages: [entry],
    };

    const saved = await pushToSupabase(thread);
    const next = [saved, ...threads.filter((item) => item.id !== saved.id)];
    persist(next);
    setSelected(saved);
    setFolder("active");
    setMessage("");
  }

  async function sendReply() {
    if (!selected || !reply.trim()) return;

    const senderProfile = readProfile();
    const now = new Date().toISOString();
    const latestSender = selected.messages[selected.messages.length - 1]?.from || selected.from;
    const replyRecipient =
      latestSender === (senderProfile.email || senderProfile.name)
        ? selected.recipient
        : latestSender;

    const entry: ThreadMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      from: senderProfile.email || senderProfile.name || "Not listed",
      recipient: replyRecipient || selected.recipient,
      message: reply.trim(),
      createdAt: now,
      senderProfile,
    };

    const updated: MessageThread = {
      ...selected,
      from: entry.from,
      recipient: entry.recipient,
      message: entry.message,
      folder: "active",
      unread: true,
      updatedAt: now,
      senderProfile,
      messages: [...selected.messages, entry],
    };

    const saved = await pushToSupabase(updated);
    persist(threads.map((thread) => thread.id === saved.id ? saved : thread));
    setSelected(saved);
    setReply("");
    setFolder("active");
  }

  function moveThread(id: string, nextFolder: Folder) {
    const next = threads.map((thread) =>
      thread.id === id
        ? { ...thread, folder: nextFolder, unread: nextFolder === "unread" ? true : thread.unread, updatedAt: new Date().toISOString() }
        : thread
    );
    persist(next);
    if (selected?.id === id) setSelected({ ...selected, folder: nextFolder });
    setFolder(nextFolder);
  }

  function markRead(id: string, unread: boolean) {
    const next = threads.map((thread) =>
      thread.id === id ? { ...thread, unread, updatedAt: new Date().toISOString() } : thread
    );
    persist(next);
    if (selected?.id === id) setSelected({ ...selected, unread });
  }

  function deleteForever(id: string) {
    saveDeletedForever(id);
    const next = threads.filter((thread) => thread.id !== id);
    persist(next);
    setSelected(null);
    setFolder("deleted");
  }

  return (
    <main style={page}>
      <div style={shell}>
        <nav style={nav}>
          <div style={brand}>VAULTFORGE</div>
          <Link href="/command" style={button}>Command</Link>
          <Link href="/my-rooms" style={button}>My Rooms</Link>
          <Link href="/network" style={button}>Network</Link>
          <Link href="/messages" style={goldButton}>Messages</Link>
          <Link href="/deal-create" style={button}>Create Deal</Link>
          <Link href="/pain-intake" style={button}>Pain Intake</Link>
          <Link href="/profile" style={button}>Profile</Link>
          <Link href="/logout" style={redButton}>Logout</Link>
        </nav>

        <section style={goldCard}>
          <div style={eyebrow}>VaultForge Message Center</div>
          <h1 style={h1}>Messages for admin, members, and rooms.</h1>
          <p style={sub}>
            Send Admin messages, message members from Network profiles, and keep Deal/Pain/Project conversations tied to the right room with sender and recipient profiles attached.
          </p>
          <p style={{ ...muted, color: syncStatus.includes("Supabase") ? "#7dff9b" : "#ffda5e", fontWeight: 900 }}>{syncStatus}</p>
        </section>

        <section style={card}>
          <div style={eyebrow}>Current Sender Profile</div>
          <div style={{ ...row, marginTop: 14 }}>
            {profile.profilePhoto ? <img src={profile.profilePhoto} alt="Profile" style={avatar} /> : null}
            <div>
              <h3 style={h3}>{profile.name}</h3>
              <p style={muted}>{profile.company} • {profile.email || "Email not listed"} • {profile.memberType}</p>
              <p style={muted}>{[profile.basedCity, profile.basedCounty, profile.basedState].filter(Boolean).join(", ") || "Location not listed"}</p>
            </div>
          </div>
        </section>

        <section style={card}>
          <div style={eyebrow}>Message Folders</div>
          <div style={{ ...grid, marginTop: 16 }}>
            <StatCard label="Active" count={grouped.active.length} active={folder === "active"} onClick={() => setFolder("active")} />
            <StatCard label="Unread" count={grouped.unread.length} active={folder === "unread"} onClick={() => setFolder("unread")} />
            <StatCard label="Saved" count={grouped.saved.length} active={folder === "saved"} onClick={() => setFolder("saved")} />
            <StatCard label="Archived" count={grouped.archived.length} active={folder === "archived"} onClick={() => setFolder("archived")} />
            <StatCard label="Deleted" count={grouped.deleted.length} active={folder === "deleted"} onClick={() => setFolder("deleted")} />
          </div>
        </section>

        <section style={card}>
          <div style={eyebrow}>Create Message</div>
          <div style={{ ...grid, marginTop: 16 }}>
            <label>
              <span style={label}>Message Type</span>
              <select value={lane} onChange={(event) => setLane(event.target.value as Lane)} style={input}>
                <option>Admin</option>
                <option>Member</option>
                <option>Deal</option>
                <option>Pain</option>
                <option>Project</option>
                <option>Network</option>
                <option>General</option>
              </select>
            </label>

            <label>
              <span style={label}>From</span>
              <input value={from} onChange={(event) => setFrom(event.target.value)} placeholder="sender email/name" style={input} />
            </label>

            <label>
              <span style={label}>Recipient</span>
              <input value={recipient} onChange={(event) => setRecipient(event.target.value)} placeholder="admin/member email or name" style={input} />
            </label>

            <label>
              <span style={label}>Title</span>
              <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="message title" style={input} />
            </label>

            <label>
              <span style={label}>Deal / Pain / Project Room</span>
              <input value={room} onChange={(event) => setRoom(event.target.value)} placeholder="room title auto-fills from saved room" style={input} />
            </label>
          </div>

          <label style={{ display: "block", marginTop: 16 }}>
            <span style={label}>Message</span>
            <textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Write the message here" rows={5} style={{ ...input, resize: "vertical" }} />
          </label>

          <div style={{ ...row, marginTop: 16 }}>
            <button type="button" onClick={createThread} style={goldButton}>
              Send Message
            </button>
            <button type="button" onClick={() => { setLane("Admin"); setRecipient(ADMIN_EMAIL); setTitle("Message Admin"); setRoom("Admin"); }} style={button}>
              Message Admin
            </button>
          </div>
        </section>

        {selected ? (
          <section style={card}>
            <div style={eyebrow}>{selected.lane} • {selected.folder}</div>
            <h2 style={h2}>{selected.title}</h2>

            <div style={{ ...grid, marginTop: 14 }}>
              <div style={tile}>
                <div style={eyebrow}>Sender Profile</div>
                <p style={sub}>{selected.senderProfile?.name || selected.from}</p>
                <p style={muted}>{profileLine(selected.senderProfile)}</p>
              </div>

              <div style={tile}>
                <div style={eyebrow}>Recipient Profile</div>
                <p style={sub}>{selected.recipientProfile?.name || selected.recipient}</p>
                <p style={muted}>{profileLine(selected.recipientProfile)}</p>
              </div>

              <div style={tile}>
                <div style={eyebrow}>Room / Project</div>
                <p style={sub}>{selected.room}</p>
                <p style={muted}>{selected.roomId ? `Room ID: ${selected.roomId}` : "No room ID attached"}</p>
              </div>
            </div>

            <div style={{ ...tile, marginTop: 14 }}>
              <div style={eyebrow}>Conversation</div>
              {selected.messages.map((item) => (
                <div key={item.id} style={{ borderTop: "1px solid rgba(207,216,230,.12)", paddingTop: 12, marginTop: 12 }}>
                  <p style={muted}><strong style={{ color: "#f7f8ff" }}>{item.senderProfile?.name || item.from}</strong> → {item.recipient}</p>
                  <p style={sub}>{item.message}</p>
                  <p style={muted}>{item.createdAt}</p>
                </div>
              ))}
            </div>

            <div style={{ ...tile, marginTop: 14 }}>
              <div style={eyebrow}>Reply</div>
              <textarea value={reply} onChange={(event) => setReply(event.target.value)} placeholder="Write reply here" rows={4} style={{ ...input, resize: "vertical" }} />
              <div style={{ ...row, marginTop: 12 }}>
                <button type="button" style={goldButton} onClick={sendReply}>Send Reply</button>
              </div>
            </div>

            <div style={{ ...row, marginTop: 16 }}>
              <button type="button" style={goldButton} onClick={() => moveThread(selected.id, "active")}>Active</button>
              <button type="button" style={button} onClick={() => markRead(selected.id, false)}>Mark Read</button>
              <button type="button" style={button} onClick={() => markRead(selected.id, true)}>Mark Unread</button>
              <button type="button" style={button} onClick={() => moveThread(selected.id, "saved")}>Save</button>
              <button type="button" style={button} onClick={() => moveThread(selected.id, "archived")}>Archive</button>
              <button type="button" style={redButton} onClick={() => moveThread(selected.id, "deleted")}>Delete</button>
              {selected.folder === "deleted" ? <button type="button" style={redButton} onClick={() => deleteForever(selected.id)}>Delete Forever</button> : null}
              <button type="button" style={button} onClick={() => setSelected(null)}>Close</button>
            </div>
          </section>
        ) : null}

        <section style={card}>
          <div style={eyebrow}>{folderTitle(folder)}</div>
          <h2 style={h2}>Message Threads</h2>

          {visible.length ? (
            <div style={threadGrid}>
              {visible.map((thread) => (
                <button
                  key={thread.id}
                  type="button"
                  onClick={() => {
                    setSelected(thread);
                    markRead(thread.id, false);
                  }}
                  style={{
                    ...tile,
                    cursor: "pointer",
                    borderColor: thread.unread ? "rgba(245,197,66,.78)" : "rgba(245,197,66,.35)",
                  }}
                >
                  <div style={eyebrow}>{thread.lane} • {thread.folder}</div>
                  <h3 style={h3}>{thread.title}</h3>
                  <p style={muted}><strong style={{ color: "#f7f8ff" }}>From:</strong> {thread.senderProfile?.name || thread.from}</p>
                  <p style={muted}><strong style={{ color: "#f7f8ff" }}>Recipient:</strong> {thread.recipientProfile?.name || thread.recipient}</p>
                  <p style={muted}><strong style={{ color: "#f7f8ff" }}>Room:</strong> {thread.room}</p>
                  <p style={muted}>{thread.message}</p>
                  <p style={{ ...muted, color: "#ffda5e", fontWeight: 950 }}>Open Thread</p>
                </button>
              ))}
            </div>
          ) : (
            <div style={tile}>
              <h3 style={h3}>No messages here.</h3>
              <p style={sub}>Send Admin, member, network, deal, pain, or project messages from this page.</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
