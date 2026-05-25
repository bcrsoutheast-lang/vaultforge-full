"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type RoomKind = "deal" | "pain";
type RoomStatus = "active" | "saved" | "archived" | "deleted";
type MessageFolder = "active" | "unread" | "saved" | "archived" | "deleted";

type ProfileSnapshot = {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  title: string;
  memberType: string;
  basedState: string;
  basedCity: string;
  basedCounty: string;
  verifiedStatus: string;
  contactPreference: string;
  responseSpeed: string;
  profilePhoto: string;
  companyLogo: string;
};

type MessageThread = {
  id: string;
  lane?: string;
  from: string;
  recipient: string;
  title: string;
  room: string;
  message: string;
  folder: MessageFolder;
  unread: boolean;
  createdAt: string;
  senderProfile?: Partial<ProfileSnapshot>;
  recipientProfile?: Partial<ProfileSnapshot>;
  roomSnapshot?: { id: string; kind: string; title: string; owner: string; source: string };
  messages?: Array<{ id: string; from: string; recipient: string; message: string; createdAt: string; senderProfile?: Partial<ProfileSnapshot> }>;
};

type RoomCard = {
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

const COMMAND_ROOMS_KEY = "vaultforge_command_rooms_v1";
const COMMAND_DELETED_FOREVER_KEY = "vaultforge_command_deleted_forever_v1";
const THREADS_KEY = "vf_message_center_threads_v1";
const FOREVER_KEY = "vf_message_center_deleted_forever_v1";
const PROFILE_KEYS = ["vaultforge_profile", "vaultforge_member_profile", "vaultforge_clean_profile"];
const PROFILE_PHOTO_BACKUP_KEY = "vaultforge_member_profile_photo_v1";
const COMPANY_LOGO_BACKUP_KEY = "vaultforge_member_company_logo_v1";

const page: React.CSSProperties = { minHeight: "100vh", background: "radial-gradient(circle at 16% 10%, rgba(245,197,66,.12), transparent 30%), radial-gradient(circle at 88% 8%, rgba(120,0,30,.18), transparent 34%), #05070b", color: "#f7f8ff", padding: "26px 20px 90px", fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' };
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

function parse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
}

function clean(value: unknown, fallback = "Not listed") {
  const text = String(value || "").trim();
  return text || fallback;
}

function currentEmail() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem("vf_email") || window.localStorage.getItem("vaultforge_email") || window.localStorage.getItem("email") || window.localStorage.getItem("vf_member_email") || window.localStorage.getItem("vf_current_email") || "";
}

function normalizeProfile(row: any): ProfileSnapshot {
  const backupPhoto = typeof window !== "undefined" ? clean(window.localStorage.getItem(PROFILE_PHOTO_BACKUP_KEY), "") : "";
  const backupLogo = typeof window !== "undefined" ? clean(window.localStorage.getItem(COMPANY_LOGO_BACKUP_KEY), "") : "";
  const email = clean(row?.email || currentEmail(), currentEmail());
  return {
    id: clean(row?.id || email || "local_member", "local_member"),
    name: clean(row?.name || row?.fullName || row?.full_name || "VaultForge Member", "VaultForge Member"),
    company: clean(row?.company || row?.companyName || "Company not listed", "Company not listed"),
    email,
    phone: clean(row?.phone || row?.phoneNumber || "", ""),
    title: clean(row?.title || row?.roleTitle || "", ""),
    memberType: clean(row?.memberType || row?.member_type || "Member", "Member"),
    basedState: clean(row?.basedState || row?.state || row?.homeState || "", ""),
    basedCity: clean(row?.basedCity || row?.city || "", ""),
    basedCounty: clean(row?.basedCounty || row?.county || "", ""),
    verifiedStatus: clean(row?.verifiedStatus || "Unverified", "Unverified"),
    contactPreference: clean(row?.contactPreference || "VaultForge Message", "VaultForge Message"),
    responseSpeed: clean(row?.responseSpeed || "24 Hours", "24 Hours"),
    profilePhoto: clean(row?.profilePhoto || row?.photoUrl || row?.avatar || backupPhoto, ""),
    companyLogo: clean(row?.companyLogo || row?.logoUrl || backupLogo, ""),
  };
}

function readProfile(): ProfileSnapshot {
  if (typeof window === "undefined") return normalizeProfile({});
  for (const key of PROFILE_KEYS) {
    const found = parse<any | null>(window.localStorage.getItem(key), null);
    if (found && typeof found === "object") return normalizeProfile(found);
  }
  return normalizeProfile({});
}

function collect(value: unknown): any[] {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== "object") return [];
  const obj = value as Record<string, unknown>;
  const rows: any[] = [];
  Object.values(obj).forEach((item) => { if (Array.isArray(item)) rows.push(...item); });
  if (obj.id || obj.title || obj.name || obj.subject || obj.propertyName) rows.push(obj);
  return rows;
}

function statusFrom(value: unknown): RoomStatus {
  const raw = String(value || "active").toLowerCase();
  if (raw.includes("save")) return "saved";
  if (raw.includes("archive")) return "archived";
  if (raw.includes("delete") || raw.includes("trash")) return "deleted";
  return "active";
}

function kindFrom(key: string, item: any): RoomKind {
  const text = `${key} ${JSON.stringify(item || {})}`.toLowerCase();
  if (text.includes("pain") || text.includes("problem") || text.includes("pressure") || text.includes("distress")) return "pain";
  return "deal";
}

function foreverIds() {
  if (typeof window === "undefined") return [];
  return parse<string[]>(window.localStorage.getItem(COMMAND_DELETED_FOREVER_KEY), []);
}

function saveForeverIds(ids: string[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(COMMAND_DELETED_FOREVER_KEY, JSON.stringify(Array.from(new Set(ids))));
}

function loadRooms(): RoomCard[] {
  if (typeof window === "undefined") return [];
  const deletedForever = new Set(foreverIds());
  const keys = new Set<string>([
    COMMAND_ROOMS_KEY,
    "vaultforge_member_rooms_v1",
    "vaultforge_my_rooms_clean_v2",
    "vaultforge_command_deal_rooms_v1",
    "vaultforge_command_pain_rooms_v1",
    "vaultforge_owned_rooms_v1",
    "vaultforge_owned_deal_rooms_v1",
    "vaultforge_owned_pain_rooms_v1"
  ]);

  // Member Command is not Investor Room. Do not scan every deal/property/project key.
  // Investor/public opportunity pools belong only in /investor-room.
  // Command should stay focused on member-owned/command-owned workspace records.

  const rooms: RoomCard[] = [];
  Array.from(keys).forEach((key) => {
    if (key === COMMAND_DELETED_FOREVER_KEY) return;
    const parsed = parse<any>(window.localStorage.getItem(key), null);
    collect(parsed).forEach((item, index) => {
      if (!item || typeof item !== "object") return;
      const text = `${key} ${JSON.stringify(item)}`.toLowerCase();
      if (!text.includes("deal") && !text.includes("room") && !text.includes("pain") && !text.includes("project") && !text.includes("property") && !text.includes("title")) return;
      const id = clean(item.id || item.roomId || item.slug || `${key}-${index}`, `${key}-${index}`);
      if (deletedForever.has(id)) return;
      rooms.push({
        id,
        kind: kindFrom(key, item),
        title: clean(item.title || item.name || item.projectName || item.propertyName || item.subject || "Untitled Room", "Untitled Room"),
        city: clean(item.city || item.market || item.propertyCity || "NA", "NA"),
        county: clean(item.county || item.propertyCounty || "", ""),
        state: clean(item.state || item.propertyState || item.marketState || "NA", "NA"),
        asset: clean(item.asset || item.assetType || item.propertyType || item.category || "Not listed", "Not listed"),
        strategy: clean(item.strategy || item.dealStrategy || item.need || item.problemType || "Not listed", "Not listed"),
        status: statusFrom(item.status || item.folder || item.roomStatus || item.workspaceStatus),
        message: clean(item.message || item.summary || item.notes || item.description || "Review numbers, photos, routing, and next action.", "Review numbers, photos, routing, and next action."),
        updatedAt: clean(item.updatedAt || item.updated_at || item.createdAt || item.created_at || new Date().toISOString(), new Date().toISOString()),
        source: key,
      });
    });
  });
  const unique = new Map<string, RoomCard>();
  rooms.forEach((room) => unique.set(room.id, room));
  return Array.from(unique.values()).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

function saveRooms(rooms: RoomCard[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(COMMAND_ROOMS_KEY, JSON.stringify(rooms));
}

function deletedMessageForeverIds(): string[] {
  if (typeof window === "undefined") return [];
  return parse<string[]>(window.localStorage.getItem(FOREVER_KEY), []);
}

function normalizeThread(thread: any): MessageThread {
  const messages = Array.isArray(thread?.messages) ? thread.messages : [];
  return {
    ...thread,
    id: clean(thread?.id || `thread-${Date.now()}`, `thread-${Date.now()}`),
    from: clean(thread?.from || thread?.senderProfile?.email || thread?.senderProfile?.name || "Not listed", "Not listed"),
    recipient: clean(thread?.recipient || "VaultForge Owner", "VaultForge Owner"),
    title: clean(thread?.title || "Untitled Message", "Untitled Message"),
    room: clean(thread?.room || thread?.roomSnapshot?.title || "General", "General"),
    message: clean(thread?.message || messages[messages.length - 1]?.message || "No message entered.", "No message entered."),
    folder: thread?.folder || "active",
    unread: Boolean(thread?.unread),
    createdAt: clean(thread?.createdAt || "", ""),
    messages,
  };
}

function loadLocalMessages(): MessageThread[] {
  if (typeof window === "undefined") return [];
  const forever = new Set(deletedMessageForeverIds());
  const rows = parse<any[]>(window.localStorage.getItem(THREADS_KEY), []);
  if (!Array.isArray(rows)) return [];
  return rows.filter((thread) => thread && typeof thread === "object" && !forever.has(String(thread.id || ""))).map(normalizeThread);
}

function saveLocalMessages(threads: MessageThread[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(THREADS_KEY, JSON.stringify(threads));
  window.dispatchEvent(new Event("vaultforge-message-change"));
}

function isProfileRelated(thread: MessageThread, profile: ProfileSnapshot) {
  const email = profile.email.toLowerCase();
  const name = profile.name.toLowerCase();
  const blob = JSON.stringify(thread).toLowerCase();
  if (!email && !name) return true;
  return Boolean((email && blob.includes(email)) || (name && blob.includes(name)) || blob.includes("vaultforge owner") || blob.includes("bcrsoutheast@gmail.com"));
}

async function loadMessagesForProfile(profile: ProfileSnapshot) {
  const local = loadLocalMessages();

  try {
    const params = new URLSearchParams();
    if (profile.email) params.set("email", profile.email);
    if (profile.name) params.set("name", profile.name);

    const response = await fetch(`/api/messages/list?${params.toString()}`, { cache: "no-store" });
    const data = await response.json();

    if (!data?.ok) return local;

    const remote = Array.isArray(data.threads) ? data.threads.map(normalizeThread) : [];
    const merged = new Map<string, MessageThread>();
    [...remote, ...local].forEach((thread) => {
      if (!merged.has(thread.id)) merged.set(thread.id, thread);
    });

    const next = Array.from(merged.values());
    saveLocalMessages(next);
    return next;
  } catch {
    return local;
  }
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

function MessageCard({ thread }: { thread: MessageThread }) {
  return (
    <article style={{ ...panel, borderColor: thread.unread ? "rgba(245,197,66,.72)" : "rgba(207,216,230,.15)" }}>
      <div style={eyebrow}>{thread.lane || "Message"} • {thread.folder}</div>
      <h3 style={h3}>{thread.title}</h3>
      <p style={muted}><strong style={{ color: "#f7f8ff" }}>From:</strong> {thread.senderProfile?.name || thread.from}</p>
      <p style={muted}><strong style={{ color: "#f7f8ff" }}>Company:</strong> {thread.senderProfile?.company || "Not attached"}</p>
      <p style={muted}><strong style={{ color: "#f7f8ff" }}>Recipient:</strong> {thread.recipient}</p>
      <p style={muted}><strong style={{ color: "#f7f8ff" }}>Room:</strong> {thread.room}</p>
      <p style={muted}>{thread.message}</p>
      <div style={{ ...row, marginTop: 12 }}><Link href={`/messages?thread=${encodeURIComponent(thread.id)}`} style={goldBtn}>Open / Reply</Link></div>
    </article>
  );
}

function Room({ room, moveRoom, deleteForever }: { room: RoomCard; moveRoom: (id: string, status: RoomStatus) => void; deleteForever: (id: string) => void }) {
  const location = [room.city, room.county, room.state].filter(Boolean).join(", ");
  return (
    <article style={{ ...panel, borderColor: room.status === "deleted" ? "rgba(255,65,65,.56)" : "rgba(245,197,66,.42)" }}>
      <div style={eyebrow}>{room.kind === "deal" ? "Deal Room" : "Pain Room"} • {room.status}</div>
      <h3 style={h3}>{room.title}</h3>
      <p style={sub}>{location}</p>
      <p style={muted}>{room.asset} • {room.strategy}</p>
      <div style={{ margin: "16px 0" }}>
        <div style={eyebrow}>{room.kind === "deal" ? "Deal Momentum" : "Pain Pressure"} • {room.status}</div>
        <div style={{ height: 12, background: "rgba(0,0,0,.45)", borderRadius: 999, overflow: "hidden", marginTop: 10 }}>
          <div style={{ width: room.status === "active" ? "68%" : room.status === "saved" ? "42%" : "18%", height: "100%", background: room.kind === "pain" ? "linear-gradient(90deg,#ff365d,#ff9f43)" : "linear-gradient(90deg,#ffe16a,#1e90ff)" }} />
        </div>
      </div>
      <p style={muted}>{room.message}</p>
      <p style={muted}>Last updated: {room.updatedAt}</p>
      <div style={{ ...row, marginTop: 14 }}>
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
  const [rooms, setRooms] = useState<RoomCard[]>([]);
  const [messages, setMessages] = useState<MessageThread[]>([]);
  const [profile, setProfile] = useState<ProfileSnapshot>(() => normalizeProfile({}));
  const [view, setView] = useState<"active" | "deal" | "pain" | "messages" | "saved" | "archived" | "deleted">("active");

  useEffect(() => {
    const loaded = loadRooms();
    const loadedProfile = readProfile();
    setRooms(loaded);
    setProfile(loadedProfile);
    saveRooms(loaded);

    loadMessagesForProfile(loadedProfile).then(setMessages);

    function refresh() {
      const nextProfile = readProfile();
      setProfile(nextProfile);
      loadMessagesForProfile(nextProfile).then(setMessages);
    }

    window.addEventListener("storage", refresh);
    window.addEventListener("vaultforge-message-change", refresh);
    window.addEventListener("vaultforge-profile-change", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
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

  const profileMessages = useMemo(() => messages.filter((thread) => isProfileRelated(thread, profile)), [messages, profile]);
  const activeMessages = profileMessages.filter((thread) => thread.folder === "active");
  const unreadMessages = profileMessages.filter((thread) => thread.unread && thread.folder !== "deleted");
  const visible = view === "messages" ? [] : grouped[view];

  function moveRoom(id: string, status: RoomStatus) {
    const next = rooms.map((room) => room.id === id ? { ...room, status, updatedAt: new Date().toISOString() } : room);
    setRooms(next);
    saveRooms(next);
    setView(status);
  }

  function deleteForever(id: string) {
    saveForeverIds([...foreverIds(), id]);
    const next = rooms.filter((room) => room.id !== id);
    setRooms(next);
    saveRooms(next);
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
          <Link href="/create" style={btn}>Create</Link>
          <Link href="/profile" style={btn}>Profile</Link>
          <Link href="/logout" style={redBtn}>Logout</Link>
        </nav>

        <section style={card}>
          <div style={eyebrow}>Member Alerts • {grouped.active.length} Active • {activeMessages.length} Messages</div>
          <div style={{ ...grid, marginTop: 16 }}>
            <AlertTile label="Deals" count={grouped.deal.length} note="active deal rooms" active={view === "deal"} onClick={() => setView("deal")} />
            <AlertTile label="Pain" count={grouped.pain.length} note="active pain rooms" active={view === "pain"} onClick={() => setView("pain")} />
            <AlertTile label="Messages" count={activeMessages.length} note={`${unreadMessages.length} unread synced thread(s)`} active={view === "messages"} onClick={() => setView("messages")} />
            <AlertTile label="Saved" count={grouped.saved.length} note="saved room cards" active={view === "saved"} onClick={() => setView("saved")} />
            <AlertTile label="Deleted" count={grouped.deleted.length} note="delete / delete forever" active={view === "deleted"} onClick={() => setView("deleted")} />
          </div>
        </section>

        <section style={goldCard}>
          <div style={eyebrow}>VaultForge Member Command</div>
          <h1 style={h1}>Execution intelligence desk.</h1>
          <p style={sub}>Member Command is now separated from Investor Room. It reads member-owned command rooms plus synced message threads, not investor opportunity cards.</p>
          <div style={{ ...row, marginTop: 16 }}>
            <button type="button" style={goldBtn} onClick={() => setView("active")}>Open Active Rooms</button>
            <button type="button" style={view === "messages" ? goldBtn : btn} onClick={() => setView("messages")}>Messages ({activeMessages.length})</button>
            <Link href="/create" style={goldBtn}>Create</Link>
            <Link href="/messages" style={btn}>Open Message Center</Link>
          </div>
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
            <div style={eyebrow}>Profile Messages</div>
            <h2 style={h2}>Message threads attached to this member profile.</h2>
            {profileMessages.length ? (
              <div style={roomGrid}>{profileMessages.map((thread) => <MessageCard key={thread.id} thread={thread} />)}</div>
            ) : (
              <div style={panel}><h2 style={h2}>No messages for this profile yet.</h2><p style={sub}>Messages sent from Investor Room or Message Center will show here after they are created.</p></div>
            )}
          </section>
        ) : (
          <section style={card}>
            <div style={eyebrow}>Selected Cards • {view}</div>
            <h2 style={h2}>{view === "deal" ? "Active Deal Rooms" : view === "pain" ? "Active Pain Rooms" : view === "deleted" ? "Deleted Rooms" : `${view.charAt(0).toUpperCase()}${view.slice(1)} Rooms`}</h2>
            {visible.length ? (
              <div style={roomGrid}>{visible.map((room) => <Room key={room.id} room={room} moveRoom={moveRoom} deleteForever={deleteForever} />)}</div>
            ) : (
              <div style={panel}><h2 style={h2}>No cards in this folder.</h2><p style={sub}>Create or restore a Deal/Pain room and it will show here.</p></div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
