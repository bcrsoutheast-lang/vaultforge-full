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

type MemberProfile = {
  id?: string;
  name?: string;
  company?: string;
  email?: string;
  phone?: string;
  profilePhoto?: string;
  memberType?: string;
  basedState?: string;
  basedCity?: string;
  basedCounty?: string;
  statesOperated?: string[];
  markets?: string[];
  assetClasses?: string[];
  strategies?: string[];
  specialties?: string[];
  needs?: string[];
  canProvide?: string[];
  capitalPosition?: string;
  proofOfFunds?: string;
  fundingRange?: string;
  contactPreference?: string;
  directContact?: string;
  bio?: string;
  updatedAt?: string;
  [key: string]: unknown;
};

type MessageThread = {
  id: string;
  lane: "deal" | "pain" | "network" | "general";
  subject: string;
  roomId?: string;
  roomType?: string;
  to?: string;
  from?: string;
  status: "active" | "archived" | "deleted";
  unread: boolean;
  saved: boolean;
  createdAt: string;
  updatedAt: string;
  messages: {
    id: string;
    body: string;
    author: string;
    createdAt: string;
  }[];
};

const STATES = ["GA", "TN", "AL", "FL", "NC", "SC", "TX"];

const DEAL_KEYS = ["vaultforge_clean_deal_rooms", "vaultforge_deal_rooms", "vaultforge_rooms_deals", "vf_deal_rooms"];
const PAIN_KEYS = ["vaultforge_clean_pain_rooms_v1", "vaultforge_clean_pain_rooms", "vaultforge_pain_rooms", "vaultforge_rooms_pain", "vf_pain_rooms"];
const STATE_KEYS = ["vaultforge_clean_room_states", "vaultforge_room_states", "vaultforge_deal_room_states", "vaultforge_pain_room_states", "vaultforge_5s_room_states"];
const READ_KEY = "vaultforge_room_alert_read_v1";
const PROFILE_KEYS = ["vaultforge_profile", "vaultforge_member_profile", "vaultforge_clean_profile"];
const MEMBER_DIRECTORY_KEY = "vaultforge_member_directory_v1";
const MESSAGE_KEY = "vaultforge_message_threads_v2";

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
    .sort((a, b) => String(b.createdAt || b.updatedAt || "").localeCompare(String(a.createdAt || a.updatedAt || "")));
}

function readMap() {
  return ok() ? j<Record<string, string>>(localStorage.getItem(READ_KEY), {}) : {};
}

function unreadRooms(kind: RoomKind, rooms: Room[]) {
  const reads = readMap();
  return rooms.filter((room) => {
    const id = rid(room);
    if (roomState(room) !== "active") return false;
    return !room.alertRead && !room.viewedAt && !reads[id] && !reads[`${kind}:${id}`];
  });
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

function profileId(profile: MemberProfile) {
  return txt(profile.id) || txt(profile.email).toLowerCase() || "local_member";
}

function normalizeProfile(profile: MemberProfile): MemberProfile {
  return {
    ...profile,
    id: profileId(profile),
    name: txt(profile.name, "VaultForge Member"),
    basedState: txt(profile.basedState, "GA"),
    statesOperated: list(profile.statesOperated).length ? list(profile.statesOperated) : ["GA"],
    markets: list(profile.markets),
    assetClasses: list(profile.assetClasses),
    strategies: list(profile.strategies),
    specialties: list(profile.specialties),
    needs: list(profile.needs),
    canProvide: list(profile.canProvide),
  };
}

function getProfile(): MemberProfile {
  if (!ok()) return {};
  for (const key of PROFILE_KEYS) {
    const found = j<MemberProfile | null>(localStorage.getItem(key), null);
    if (found && typeof found === "object") return normalizeProfile(found);
  }
  return normalizeProfile({ id: "local_member", name: "VaultForge Member", basedState: "GA", statesOperated: ["GA"], memberType: "Investor" });
}

function getDirectory(): MemberProfile[] {
  if (!ok()) return [];
  const directory = j<MemberProfile[]>(localStorage.getItem(MEMBER_DIRECTORY_KEY), []);
  const current = getProfile();
  const currentId = profileId(current);
  const merged = [current, ...directory.filter((member) => profileId(member) !== currentId)];
  const seen = new Set<string>();

  return merged.map(normalizeProfile).filter((member) => {
    const id = profileId(member);
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

function getThreads() {
  if (!ok()) return [] as MessageThread[];
  return j<MessageThread[]>(localStorage.getItem(MESSAGE_KEY), []).sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
}

function saveThreads(threads: MessageThread[]) {
  if (!ok()) return;
  localStorage.setItem(MESSAGE_KEY, JSON.stringify(threads));
  window.dispatchEvent(new Event("vaultforge-messages-change"));
}

function messageCounts() {
  const active = getThreads().filter((thread) => thread.status === "active");
  return {
    total: active.length,
    unread: active.filter((thread) => thread.unread).length,
    deal: active.filter((thread) => thread.lane === "deal").length,
    pain: active.filter((thread) => thread.lane === "pain").length,
    network: active.filter((thread) => thread.lane === "network").length,
    dealUnread: active.filter((thread) => thread.lane === "deal" && thread.unread).length,
    painUnread: active.filter((thread) => thread.lane === "pain" && thread.unread).length,
    networkUnread: active.filter((thread) => thread.lane === "network" && thread.unread).length,
  };
}

function createOrOpenThread(params: URLSearchParams) {
  if (!ok()) return "";
  const type = txt(params.get("type"));
  const room = txt(params.get("room"));
  const to = txt(params.get("to"));
  const subjectParam = txt(params.get("subject"));

  const lane: MessageThread["lane"] =
    type === "deal" ? "deal" :
    type === "pain" ? "pain" :
    to ? "network" :
    "general";

  const subject =
    subjectParam ||
    (lane === "deal" ? `Deal Room: ${room || "New thread"}` :
    lane === "pain" ? `Pain Room: ${room || "New thread"}` :
    lane === "network" ? `Network Contact: ${to || "Member"}` :
    "General Message");

  const now = new Date().toISOString();
  const existing = getThreads();
  const existingThread = existing.find((thread) =>
    thread.status !== "deleted" &&
    thread.lane === lane &&
    txt(thread.roomId) === room &&
    txt(thread.to) === to &&
    txt(thread.subject) === subject
  );

  if (existingThread) {
    const updated = existing.map((thread) => thread.id === existingThread.id ? { ...thread, unread: false, updatedAt: now } : thread);
    saveThreads(updated);
    return existingThread.id;
  }

  const id = `thread_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const thread: MessageThread = {
    id,
    lane,
    subject,
    roomId: room,
    roomType: type,
    to,
    from: "me",
    status: "active",
    unread: false,
    saved: false,
    createdAt: now,
    updatedAt: now,
    messages: [
      {
        id: `msg_${Date.now()}`,
        author: "VaultForge",
        body: lane === "network"
          ? "Network contact thread opened."
          : "Room message thread opened.",
        createdAt: now,
      },
    ],
  };

  saveThreads([thread, ...existing]);
  return id;
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
const input: React.CSSProperties = { width: "100%", boxSizing: "border-box", border: "1px solid rgba(207,216,230,.18)", background: "#151b2a", color: "#f8fafc", borderRadius: 18, padding: "15px 16px", fontSize: 16 };
const textarea: React.CSSProperties = { ...input, minHeight: 120, resize: "vertical" };
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
      <Link href="/logout" style={redBtn}>Logout</Link>
    </nav>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section style={card}><div style={eyebrow}>{title}</div>{children}</section>;
}

function RoomCard({ room, kind }: { room: Room; kind: RoomKind }) {
  const img = firstPhoto(room);
  const href = kind === "deal" ? `/deal-rooms/${encodeURIComponent(rid(room))}` : `/pain-rooms/${encodeURIComponent(rid(room))}`;
  const unread = unreadRooms(kind, [room]).length > 0;

  return (
    <div style={unread ? activePanel : panel}>
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
        <Link href={`/messages?type=${kind}&room=${encodeURIComponent(rid(room))}&subject=${encodeURIComponent((kind === "deal" ? "Deal Room: " : "Pain Room: ") + titleFor(room, kind))}`} style={btn}>Messages</Link>
      </div>
    </div>
  );
}

export default function CommandPage() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const refresh = () => setTick((x) => x + 1);
    ["storage", "vaultforge-profile-change", "vaultforge-network-change", "vaultforge-room-state-change", "vaultforge-room-read-change", "vaultforge-deal-change", "vaultforge-pain-change", "vaultforge-messages-change"].forEach((event) => window.addEventListener(event, refresh));
    return () => ["storage", "vaultforge-profile-change", "vaultforge-network-change", "vaultforge-room-state-change", "vaultforge-room-read-change", "vaultforge-deal-change", "vaultforge-pain-change", "vaultforge-messages-change"].forEach((event) => window.removeEventListener(event, refresh));
  }, []);

  const profile = useMemo(() => getDirectory()[0] || {}, [tick]);
  const members = useMemo(() => getDirectory(), [tick]);
  const deals = useMemo(() => allRooms("deal").filter((room) => roomState(room) === "active"), [tick]);
  const pains = useMemo(() => allRooms("pain").filter((room) => roomState(room) === "active"), [tick]);
  const unreadDeals = unreadRooms("deal", deals);
  const unreadPains = unreadRooms("pain", pains);
  const counts = useMemo(() => messageCounts(), [tick]);

  return (
    <main style={page}>
      <div style={wrap}>
        <Nav active="command" />

        <section style={hero}>
          <div style={eyebrow}>Member Command Center</div>
          <h1 style={h1}>Action creates reaction.</h1>
          <p style={sub}>{txt(profile.name, "Member")} • Based {txt(profile.basedCity, "City not set")}, {txt(profile.basedState, "GA")} • Every message button now creates or opens a tracked thread.</p>
          <div style={{ ...row, marginTop: 22 }}>
            <Link href="/members" style={goldBtn}>Members</Link>
            <Link href="/network" style={goldBtn}>Network</Link>
            <Link href="/messages" style={goldBtn}>Messages</Link>
            <Link href="/deal-create" style={btn}>Create Deal</Link>
            <Link href="/pain-intake" style={btn}>Submit Pain</Link>
          </div>
        </section>

        <Section title="Live Counts">
          <div style={grid}>
            <Link href="/members" style={panel}><div style={eyebrow}>Members</div><h2 style={h2}>{members.length}</h2><p style={muted}>profile cards</p></Link>
            <Link href="/network" style={unreadDeals.length ? activePanel : panel}><div style={eyebrow}>Opportunity Cards</div><h2 style={h2}>{deals.length}</h2><p style={muted}>{unreadDeals.length} unread</p></Link>
            <Link href="/network" style={unreadPains.length ? activePanel : panel}><div style={eyebrow}>Pain Cards</div><h2 style={h2}>{pains.length}</h2><p style={muted}>{unreadPains.length} unread</p></Link>
            <Link href="/messages" style={counts.unread ? activePanel : panel}><div style={eyebrow}>Messages</div><h2 style={h2}>{counts.unread}</h2><p style={muted}>{counts.total} active thread(s)</p></Link>
          </div>
        </Section>

        <Section title="Message Reaction Counts">
          <div style={grid}>
            <Link href="/messages?type=deal" style={counts.dealUnread ? activePanel : panel}><div style={eyebrow}>Deal Messages</div><h2 style={h2}>{counts.dealUnread}</h2><p style={muted}>{counts.deal} active</p></Link>
            <Link href="/messages?type=pain" style={counts.painUnread ? activePanel : panel}><div style={eyebrow}>Pain Messages</div><h2 style={h2}>{counts.painUnread}</h2><p style={muted}>{counts.pain} active</p></Link>
            <Link href="/messages" style={counts.networkUnread ? activePanel : panel}><div style={eyebrow}>Network Messages</div><h2 style={h2}>{counts.networkUnread}</h2><p style={muted}>{counts.network} active</p></Link>
          </div>
        </Section>

        <Section title="Active Opportunity Cards">
          {deals.length ? <div style={grid}>{deals.slice(0, 4).map((room) => <RoomCard key={rid(room)} room={room} kind="deal" />)}</div> : <p style={sub}>No active opportunity cards.</p>}
        </Section>

        <Section title="Active Pain Cards">
          {pains.length ? <div style={grid}>{pains.slice(0, 4).map((room) => <RoomCard key={rid(room)} room={room} kind="pain" />)}</div> : <p style={sub}>No active pain cards.</p>}
        </Section>
      </div>
    </main>
  );
}
