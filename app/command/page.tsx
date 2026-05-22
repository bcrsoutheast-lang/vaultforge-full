"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type RoomKind = "deal" | "pain";
type RoomStatus =
  | "active"
  | "saved"
  | "archived"
  | "deleted"
  | "sold"
  | "resolved";

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
  ownerEmail?: string;
  memberEmail?: string;
  createdBy?: string;
  createdByEmail?: string;
  assignedTo?: string[] | string;
  assignedToIds?: string[] | string;
  assignedToEmail?: string[] | string;
  assignedToEmails?: string[] | string;
  routedTo?: string[] | string;
  routedToIds?: string[] | string;
  routedToEmail?: string[] | string;
  routedToEmails?: string[] | string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
};

type MemberDisplay = {
  displayName: string;
  company: string;
  email: string;
  memberType: string;
  states: string;
};

const DEAL_KEYS = [
  "vaultforge_clean_deal_rooms",
  "vaultforge_deal_rooms",
  "vaultforge_rooms_deals",
  "vf_deal_rooms",
];
const PAIN_KEYS = [
  "vaultforge_clean_pain_rooms_v2",
  "vaultforge_clean_pain_rooms_v1",
  "vaultforge_clean_pain_rooms",
  "vaultforge_pain_rooms",
  "vaultforge_rooms_pain",
  "vf_pain_rooms",
];
const STATE_KEYS = [
  "vaultforge_deal_room_state_v2",
  "vaultforge_pain_room_state_v2",
  "vaultforge_clean_room_states",
  "vaultforge_room_states",
  "vaultforge_deal_room_states",
  "vaultforge_pain_room_states",
];
const MEMBER_STATE_KEY = "vaultforge_my_room_status_v1";
const ROUTE_STATUS_KEY = "vaultforge_route_status_v1";
const MESSAGE_KEYS = [
  "vaultforge_message_command_threads_v1",
  "vaultforge_messages_v1",
  "vf_messages",
  "vaultforge_threads",
];
const ALERT_KEYS = [
  "vaultforge_alerts_v1",
  "vaultforge_smart_alerts",
  "vf_alerts",
  "vaultforge_room_alerts",
];
const OWNER_EMAIL = "bcrsoutheast@gmail.com";
const CONTROLLED_THREADS_KEY = "vaultforge_controlled_intro_threads_v1";

function ok() {
  return (
    typeof window !== "undefined" && typeof window.localStorage !== "undefined"
  );
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
  if (Array.isArray(value))
    return value.map((item) => String(item).trim()).filter(Boolean);
  if (typeof value === "string" && value.trim())
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
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
  return txt(
    room.title || room.name,
    kind === "deal" ? "Untitled Deal Room" : "Untitled Pain Room",
  );
}

function loc(room: Room) {
  return (
    [txt(room.city), txt(room.county), txt(room.state)]
      .filter(Boolean)
      .join(", ") || "Market not listed"
  );
}

function keysFor(kind: RoomKind) {
  return kind === "deal" ? DEAL_KEYS : PAIN_KEYS;
}

function normalizeRoom(row: any, kind: RoomKind): Room {
  const id = txt(
    row?.id || row?.roomId || row?.painId || row?.dealId || row?.signalId,
  );
  return {
    ...row,
    id,
    roomId: id,
    title: txt(
      row?.title ||
        row?.name ||
        row?.painTitle ||
        row?.dealTitle ||
        row?.problemTitle,
      kind === "deal" ? "Untitled Deal Room" : "Untitled Pain Room",
    ),
    state: txt(row?.state, "GA"),
    city: txt(row?.city),
    county: txt(row?.county),
  };
}

function rawStatus(room: Room): RoomStatus {
  const state = txt(
    room.memberRoomStatus ||
      room.roomState ||
      room.cleanupState ||
      room.stateStatus,
    "active",
  );
  if (
    state === "saved" ||
    state === "archived" ||
    state === "deleted" ||
    state === "sold" ||
    state === "resolved"
  )
    return state;
  return "active";
}

function stateMap() {
  const map: Record<string, RoomStatus> = {};
  if (!ok()) return map;
  STATE_KEYS.forEach((key) =>
    Object.assign(
      map,
      j<Record<string, RoomStatus>>(localStorage.getItem(key), {}),
    ),
  );
  Object.assign(
    map,
    j<Record<string, RoomStatus>>(localStorage.getItem(MEMBER_STATE_KEY), {}),
  );
  return map;
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
    const match =
      kind === "deal"
        ? key.includes("deal_room") || key.includes("deal_rooms")
        : key.includes("pain_room") || key.includes("pain_rooms");
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
      return {
        ...room,
        memberRoomStatus: status,
        roomState: status,
        cleanupState: status,
        stateStatus: status,
      };
    })
    .sort((a, b) =>
      String(b.createdAt || b.updatedAt || "").localeCompare(
        String(a.createdAt || a.updatedAt || ""),
      ),
    );
}

function currentMemberIdentity() {
  if (!ok()) return { id: "", email: "", hasIdentity: false };

  let profile: any = {};
  for (const key of [
    "vaultforge_profile",
    "vaultforge_member_profile",
    "vf_profile",
    "member_profile",
    "profile",
  ]) {
    try {
      const raw = localStorage.getItem(key);
      if (raw && raw.startsWith("{"))
        profile = { ...profile, ...JSON.parse(raw) };
    } catch {
      // ignore bad profile cache
    }
  }

  const email = txt(
    profile.email ||
      profile.memberEmail ||
      profile.member_email ||
      localStorage.getItem("vf_email") ||
      localStorage.getItem("member_email") ||
      localStorage.getItem("email"),
  ).toLowerCase();

  const id = txt(
    profile.id ||
      profile.memberId ||
      profile.member_id ||
      profile.auth_user_id ||
      profile.user_id ||
      email ||
      "local_member",
  ).toLowerCase();

  return { id, email, hasIdentity: Boolean(id || email) };
}

function safeProfileText(value: unknown, fallback: string) {
  const clean = String(value || "").trim();
  return clean && clean !== "undefined" && clean !== "null" ? clean : fallback;
}

function readMemberDisplay(): MemberDisplay {
  if (!ok()) {
    return {
      displayName: "Member Workspace",
      company: "Company not listed",
      email: "Email not listed",
      memberType: "Private Member",
      states: "States not listed",
    };
  }

  let profile: any = {};
  for (const key of [
    "vaultforge_profile",
    "vaultforge_member_profile",
    "vf_profile",
    "member_profile",
    "profile",
  ]) {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw && raw.startsWith("{"))
        profile = { ...profile, ...JSON.parse(raw) };
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
    "Email not listed",
  );

  const displayName = safeProfileText(
    profile.fullName ||
      profile.full_name ||
      profile.name ||
      profile.ownerName ||
      window.localStorage.getItem("vf_name") ||
      window.localStorage.getItem("member_name"),
    email.includes("@") ? email.split("@")[0] : "Member Workspace",
  );

  const company = safeProfileText(
    profile.company ||
      profile.companyName ||
      profile.company_name ||
      profile.businessName ||
      window.localStorage.getItem("vf_company") ||
      window.localStorage.getItem("member_company"),
    "Company not listed",
  );

  const memberType = safeProfileText(
    profile.memberType ||
      profile.member_type ||
      profile.role ||
      profile.investorType,
    "Private Member",
  );
  const statesRaw =
    profile.states ||
    profile.operatingStates ||
    profile.statesOperated ||
    profile.serviceStates ||
    profile.markets;
  const states = Array.isArray(statesRaw)
    ? statesRaw.join(" • ")
    : safeProfileText(statesRaw, "States not listed");

  return { displayName, company, email, memberType, states };
}

function roomAssignedIds(room: Room) {
  return [
    ...list(room.assignedTo),
    ...list(room.assignedToIds),
    ...list(room.routedTo),
    ...list(room.routedToIds),
  ].map((value) => value.toLowerCase());
}

function roomAssignedEmails(room: Room) {
  return [
    ...list(room.assignedToEmail),
    ...list(room.assignedToEmails),
    ...list(room.routedToEmail),
    ...list(room.routedToEmails),
  ].map((value) => value.toLowerCase());
}

function roomAssignedToCurrentMember(room: Room) {
  const current = currentMemberIdentity();
  if (!current.id && !current.email) return false;
  return Boolean(
    (current.id && roomAssignedIds(room).includes(current.id.toLowerCase())) ||
      (current.email && roomAssignedEmails(room).includes(current.email)),
  );
}

function roomBelongsToCurrentMember(room: Room) {
  const current = currentMemberIdentity();
  const ownerId = txt(
    room.ownerId || room.createdBy || room.memberId || room.createdById,
  ).toLowerCase();
  const ownerEmail = txt(
    room.ownerEmail || room.createdByEmail || room.memberEmail,
  ).toLowerCase();

  const assignedIds = roomAssignedIds(room);
  const assignedEmails = roomAssignedEmails(room);
  const hasOwnershipData =
    Boolean(ownerId) ||
    Boolean(ownerEmail) ||
    assignedIds.length > 0 ||
    assignedEmails.length > 0;

  if (!hasOwnershipData) return true;
  if (current.id && ownerId && ownerId === current.id.toLowerCase())
    return true;
  if (current.email && ownerEmail && ownerEmail === current.email) return true;
  if (current.id && assignedIds.includes(current.id.toLowerCase())) return true;
  if (current.email && assignedEmails.includes(current.email)) return true;

  return false;
}

function routeStatusMap() {
  return ok()
    ? j<
        Record<
          string,
          {
            status: string;
            at: string;
            memberName: string;
            memberEmail: string;
            roomId: string;
            kind: string;
          }
        >
      >(localStorage.getItem(ROUTE_STATUS_KEY), {})
    : {};
}

function routedCount(deals: Room[], pains: Room[]) {
  const current = currentMemberIdentity();
  const routeMap = routeStatusMap();

  const local = [...deals, ...pains].filter(roomAssignedToCurrentMember).length;
  const routed = Object.entries(routeMap).filter(([key, value]) => {
    const keyLower = key.toLowerCase();
    return Boolean(
      (current.id && keyLower.includes(current.id.toLowerCase())) ||
        (current.email && keyLower.includes(current.email.toLowerCase())) ||
        (current.email &&
          txt(value.memberEmail).toLowerCase() === current.email),
    );
  }).length;

  return Math.max(local, routed);
}

function isOpenDealRoom(room: Room) {
  const status = rawStatus(room);
  return status === "active";
}

function isOpenPainRoom(room: Room) {
  const status = rawStatus(room);
  return status === "active";
}

function countStoredItems(keys: string[]) {
  if (!ok()) return 0;
  let total = 0;
  for (const key of keys) {
    const parsed = j<unknown>(localStorage.getItem(key), []);
    if (Array.isArray(parsed)) total += parsed.length;
    else if (parsed && typeof parsed === "object")
      total += Object.keys(parsed as Record<string, unknown>).length;
  }
  return total;
}

function recentRooms(deals: Room[], pains: Room[]) {
  return [
    ...deals.slice(0, 3).map((room) => ({ kind: "deal" as RoomKind, room })),
    ...pains.slice(0, 3).map((room) => ({ kind: "pain" as RoomKind, room })),
  ].slice(0, 5);
}

const page: React.CSSProperties = {
  minHeight: "100vh",
  background: "#05070d",
  color: "#f7f7fb",
  padding: 18,
  fontFamily:
    "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
};

const wrap: React.CSSProperties = {
  maxWidth: 1320,
  margin: "0 auto",
  paddingBottom: 90,
};
const nav: React.CSSProperties = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  alignItems: "center",
  marginBottom: 18,
};
const brand: React.CSSProperties = {
  color: "#ffd45a",
  fontSize: 27,
  fontWeight: 950,
  letterSpacing: -1,
  marginRight: 10,
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
const hero: React.CSSProperties = {
  border: "1px solid rgba(245,197,66,.28)",
  borderRadius: 30,
  padding: 30,
  marginBottom: 20,
  background:
    "radial-gradient(circle at top right, rgba(245,197,66,.16), transparent 32%), linear-gradient(180deg,#080d19,#050816)",
};
const panel: React.CSSProperties = {
  background: "#121724",
  border: "1px solid rgba(207,216,230,.16)",
  borderRadius: 24,
  padding: 22,
  color: "#f7f7fb",
  textDecoration: "none",
  display: "block",
};
const goldPanel: React.CSSProperties = {
  ...panel,
  borderColor: "rgba(245,197,66,.55)",
  boxShadow: "0 0 28px rgba(245,197,66,.12)",
};
const redPanel: React.CSSProperties = {
  ...panel,
  borderColor: "rgba(255,70,70,.56)",
  boxShadow: "0 0 28px rgba(255,70,70,.10)",
};
const eyebrow: React.CSSProperties = {
  color: "#ffd45a",
  textTransform: "uppercase",
  letterSpacing: 6,
  fontWeight: 950,
  fontSize: 13,
  marginBottom: 12,
};
const h1: React.CSSProperties = {
  fontSize: "clamp(44px,8vw,86px)",
  lineHeight: 0.9,
  letterSpacing: -4,
  margin: "0 0 18px",
  fontWeight: 950,
};
const h2: React.CSSProperties = {
  fontSize: "clamp(30px,5vw,52px)",
  lineHeight: 0.95,
  letterSpacing: -2,
  margin: "0 0 14px",
  fontWeight: 950,
};
const sub: React.CSSProperties = {
  color: "#c9d0dc",
  fontSize: 20,
  lineHeight: 1.35,
  margin: 0,
};
const muted: React.CSSProperties = {
  color: "#aeb7c7",
  margin: "8px 0 0",
  lineHeight: 1.35,
};
const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))",
  gap: 16,
};
const row: React.CSSProperties = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  alignItems: "center",
};
const logoWrap: React.CSSProperties = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  margin: "6px 0 22px",
};
const logoShell: React.CSSProperties = {
  width: "min(520px,92vw)",
  border: "1px solid rgba(245,197,66,.32)",
  borderRadius: 34,
  background:
    "radial-gradient(circle at top, rgba(245,197,66,.18), transparent 38%), linear-gradient(180deg,#0b101d,#050816)",
  boxShadow: "0 0 42px rgba(245,197,66,.13)",
  padding: 22,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexDirection: "column",
  textAlign: "center",
};
const logoImg: React.CSSProperties = {
  maxWidth: "min(390px,78vw)",
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

function readControlledThreads() {
  if (!ok()) return [] as any[];
  const rows = j<any[]>(localStorage.getItem(CONTROLLED_THREADS_KEY), []);
  return Array.isArray(rows) ? rows : [];
}

function threadStatus(thread: any) {
  return txt(
    thread?.status || thread?.memberStatus || thread?.stage || "new",
  ).toLowerCase();
}

function threadKind(thread: any) {
  const text =
    `${thread?.type || ""} ${thread?.requestType || ""} ${thread?.requestTitle || ""} ${thread?.kind || ""} ${thread?.roomKind || ""} ${thread?.roomType || ""} ${thread?.roomHeader || ""} ${thread?.title || ""}`.toLowerCase();
  if (text.includes("pain") || text.includes("problem")) return "pain";
  if (
    text.includes("execution") ||
    text.includes("lender") ||
    text.includes("hard money") ||
    text.includes("hard_money") ||
    text.includes("contractor") ||
    text.includes("title") ||
    text.includes("closing") ||
    text.includes("operator") ||
    text.includes("insurance") ||
    text.includes("jv") ||
    text.includes("equity") ||
    text.includes("boots")
  )
    return "execution";
  if (text.includes("deal") || text.includes("opportunity")) return "deal";
  return "request";
}

function threadMessages(thread: any) {
  return Array.isArray(thread?.messages) ? thread.messages : [];
}

function threadHasAdminReply(thread: any) {
  return (
    Boolean(thread?.adminReply || thread?.adminNote || thread?.ownerReply) ||
    threadMessages(thread).some((message: any) =>
      `${message?.role || ""} ${message?.from || ""}`
        .toLowerCase()
        .includes("admin"),
    )
  );
}

function threadHasInvestorReply(thread: any) {
  return (
    Boolean(thread?.investorReply || thread?.investorMessage) ||
    threadMessages(thread).some((message: any) =>
      `${message?.role || ""} ${message?.from || ""}`
        .toLowerCase()
        .includes("investor"),
    )
  );
}

function threadVisibleToCurrentMember(thread: any) {
  const current = currentMemberIdentity();
  const email = current.email.toLowerCase();
  const id = current.id.toLowerCase();
  if (!email && !id) return true;
  if (email === OWNER_EMAIL.toLowerCase()) return true;

  const rawTargets = [
    thread?.memberEmail,
    thread?.assignedMemberEmail,
    thread?.assignedToEmail,
    thread?.assignedToEmails,
    thread?.routedToEmail,
    thread?.routedToEmails,
    thread?.memberEmails,
    thread?.assignedMembers,
    thread?.matchedMemberEmails,
    thread?.routedMembers,
    thread?.memberId,
    thread?.assignedMemberId,
    thread?.assignedToId,
    thread?.routedToId,
    thread?.memberIds,
    thread?.assignedMemberIds,
    thread?.routedMemberIds,
  ];

  const targets = rawTargets
    .flatMap((item) => list(item))
    .map((item) => item.toLowerCase());
  rawTargets.forEach((item) => {
    if (typeof item === "string" && item.trim())
      targets.push(item.trim().toLowerCase());
  });

  if (!targets.length) return true;
  return Boolean(
    (email && targets.includes(email)) || (id && targets.includes(id)),
  );
}

function activeThreadCount(threads: any[]) {
  return threads.filter((thread) => {
    const status = threadStatus(thread);
    return ![
      "deleted",
      "removed",
      "trash",
      "archived",
      "passed",
      "declined",
      "denied",
    ].includes(status);
  }).length;
}

function newThreadCount(threads: any[]) {
  return threads.filter((thread) =>
    ["new", "open", "routed", "approved", "pending", "sent_to_member"].includes(
      threadStatus(thread),
    ),
  ).length;
}

function isOwnerEmail(email: unknown) {
  return (
    String(email || "")
      .trim()
      .toLowerCase() === OWNER_EMAIL.toLowerCase()
  );
}

function currentOwnerEmail() {
  if (!ok()) return "";
  let profile: any = {};

  for (const key of [
    "vaultforge_profile",
    "vaultforge_member_profile",
    "vf_profile",
    "member_profile",
    "profile",
  ]) {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw && raw.startsWith("{"))
        profile = { ...profile, ...JSON.parse(raw) };
    } catch {
      // ignore local profile errors
    }
  }

  return String(
    profile.email ||
      profile.memberEmail ||
      profile.member_email ||
      window.localStorage.getItem("vf_email") ||
      window.localStorage.getItem("member_email") ||
      window.localStorage.getItem("email") ||
      "",
  )
    .trim()
    .toLowerCase();
}

function OwnerCommandBadge({ email }: { email: string }) {
  if (!isOwnerEmail(email)) return null;

  return (
    <section
      style={{
        ...goldPanel,
        marginBottom: 20,
        background: "linear-gradient(180deg,#1b1608,#080d19)",
      }}
    >
      <div style={eyebrow}>Owner Mode</div>
      <h2 style={h2}>Admin Command access detected.</h2>
      <p style={sub}>
        You are signed in as {email}. Admin controls are available without
        changing the member command center.
      </p>
      <div style={{ ...row, marginTop: 16 }}>
        <Link href="/admin" style={goldBtn}>
          Open Admin Command
        </Link>
      </div>
    </section>
  );
}

function Nav({ ownerEmail }: { ownerEmail: string }) {
  return (
    <nav style={nav}>
      <div style={brand}>VAULTFORGE</div>
      <Link href="/command" style={goldBtn}>
        Command
      </Link>
      <Link href="/my-rooms" style={btn}>
        My Rooms
      </Link>
      <Link href="/routing" style={btn}>
        Routing
      </Link>
      <Link href="/members" style={btn}>
        Members
      </Link>
      <Link href="/network" style={btn}>
        Network
      </Link>
      <Link href="/state-map" style={btn}>
        State Map
      </Link>
      <Link href="/alerts" style={btn}>
        Alerts
      </Link>
      <Link href="/messages" style={btn}>
        Messages
      </Link>
      <Link href="/deal-create" style={btn}>
        Create Deal
      </Link>
      <Link href="/pain-intake" style={btn}>
        Pain Intake
      </Link>
      <Link href="/profile" style={btn}>
        Profile
      </Link>
      {isOwnerEmail(ownerEmail) ? (
        <Link href="/admin" style={redBtn}>
          Admin Command
        </Link>
      ) : null}
      <Link href="/logout" style={redBtn}>
        Logout
      </Link>
    </nav>
  );
}

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
        <p style={{ ...muted, marginTop: 12 }}>
          Private real estate execution intelligence network
        </p>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  note,
  href,
  danger,
}: {
  title: string;
  value: number | string;
  note: string;
  href: string;
  danger?: boolean;
}) {
  return (
    <Link href={href} style={danger ? redPanel : goldPanel}>
      <div style={eyebrow}>{title}</div>
      <h2 style={h2}>{value}</h2>
      <p style={muted}>{note}</p>
      <p style={muted}>Open</p>
    </Link>
  );
}

function LaneCard({
  title,
  note,
  href,
  badge,
  danger,
}: {
  title: string;
  note: string;
  href: string;
  badge: string;
  danger?: boolean;
}) {
  return (
    <Link href={href} style={danger ? redPanel : panel}>
      <div style={eyebrow}>{badge}</div>
      <h2 style={{ ...h2, fontSize: "clamp(26px,4vw,42px)" }}>{title}</h2>
      <p style={muted}>{note}</p>
    </Link>
  );
}

function MemberIdentity({ member }: { member: MemberDisplay }) {
  return (
    <section
      style={{
        ...panel,
        borderColor: "rgba(245,197,66,.32)",
        marginBottom: 20,
      }}
    >
      <div style={eyebrow}>Member Command Identity</div>
      <h2 style={h2}>{member.displayName}</h2>
      <p style={sub}>{member.company}</p>
      <p style={muted}>
        {member.email} • {member.memberType}
      </p>
      <p style={muted}>{member.states}</p>
    </section>
  );
}

function RecentRoomCard({ kind, room }: { kind: RoomKind; room: Room }) {
  const id = rid(room);
  const href =
    kind === "deal"
      ? `/deal-rooms/${encodeURIComponent(id)}`
      : `/pain-rooms/${encodeURIComponent(id)}`;
  const status = rawStatus(room);

  return (
    <Link href={href} style={panel}>
      <div style={eyebrow}>
        {kind === "deal" ? "Deal Room" : "Pain Room"} • {status}
      </div>
      <h2 style={{ ...h2, fontSize: "clamp(24px,4vw,38px)" }}>
        {roomTitle(room, kind)}
      </h2>
      <p style={sub}>{loc(room)}</p>
      <p style={muted}>
        {kind === "deal"
          ? `${txt(room.assetClass, "Asset")} • ${txt(room.propertyType, "Type")} • ${list(room.strategy).join(", ") || "Strategy open"}`
          : `${list(room.painTypes).join(", ") || "Pain"} • ${txt(room.severity, "Severity open")} • ${txt(room.timePressure, "Timeline open")}`}
      </p>
    </Link>
  );
}

export default function CommandPage() {
  const [tick, setTick] = useState(0);
  const [member, setMember] = useState<MemberDisplay>({
    displayName: "Member Workspace",
    company: "Company not listed",
    email: "Email not listed",
    memberType: "Private Member",
    states: "States not listed",
  });
  const [ownerEmail, setOwnerEmail] = useState("");

  useEffect(() => {
    setMember(readMemberDisplay());
    setOwnerEmail(currentOwnerEmail());

    const refresh = () => {
      setOwnerEmail(currentOwnerEmail());
      setTick((value) => value + 1);
    };
    window.addEventListener("storage", refresh);
    window.addEventListener("vaultforge-room-state-change", refresh);
    window.addEventListener("vaultforge-my-rooms-change", refresh);
    window.addEventListener("vaultforge-route-status-change", refresh);
    window.addEventListener("vaultforge-deal-change", refresh);
    window.addEventListener("vaultforge-pain-change", refresh);
    window.addEventListener("vaultforge-controlled-thread-change", refresh);
    window.addEventListener("vaultforge-member-thread-change", refresh);

    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("vaultforge-room-state-change", refresh);
      window.removeEventListener("vaultforge-my-rooms-change", refresh);
      window.removeEventListener("vaultforge-route-status-change", refresh);
      window.removeEventListener("vaultforge-deal-change", refresh);
      window.removeEventListener("vaultforge-pain-change", refresh);
      window.removeEventListener(
        "vaultforge-controlled-thread-change",
        refresh,
      );
      window.removeEventListener("vaultforge-member-thread-change", refresh);
    };
  }, []);

  const allDealRooms = useMemo(() => allRooms("deal"), [tick]);
  const allPainRooms = useMemo(() => allRooms("pain"), [tick]);
  const deals = useMemo(
    () => allDealRooms.filter(roomBelongsToCurrentMember),
    [allDealRooms],
  );
  const pains = useMemo(
    () => allPainRooms.filter(roomBelongsToCurrentMember),
    [allPainRooms],
  );

  const activeDeals = deals.filter(isOpenDealRoom).length;
  const activePain = pains.filter(isOpenPainRoom).length;
  const routed = routedCount(deals, pains);
  const saved = [...deals, ...pains].filter(
    (room) => rawStatus(room) === "saved",
  ).length;
  const archived = [...deals, ...pains].filter(
    (room) => rawStatus(room) === "archived",
  ).length;
  const deleted = [...deals, ...pains].filter(
    (room) => rawStatus(room) === "deleted",
  ).length;
  const messages = countStoredItems(MESSAGE_KEYS);
  const alerts = countStoredItems(ALERT_KEYS);
  const memberThreads = useMemo(
    () => readControlledThreads().filter(threadVisibleToCurrentMember),
    [tick],
  );
  const newRequests = newThreadCount(memberThreads);
  const activeRequests = activeThreadCount(memberThreads);
  const adminReplies = memberThreads.filter(threadHasAdminReply).length;
  const investorReplies = memberThreads.filter(threadHasInvestorReply).length;
  const dealRequests = memberThreads.filter(
    (thread) => threadKind(thread) === "deal",
  ).length;
  const painRequests = memberThreads.filter(
    (thread) => threadKind(thread) === "pain",
  ).length;
  const executionRequests = memberThreads.filter(
    (thread) => threadKind(thread) === "execution",
  ).length;
  const savedRequests = memberThreads.filter(
    (thread) => threadStatus(thread) === "saved" || Boolean(thread?.saved),
  ).length;
  const archivedRequests = memberThreads.filter(
    (thread) => threadStatus(thread) === "archived",
  ).length;
  const deletedRequests = memberThreads.filter(
    (thread) => threadStatus(thread) === "deleted",
  ).length;
  const recent = recentRooms(deals, pains);

  return (
    <main style={page}>
      <div style={wrap}>
        <Nav ownerEmail={ownerEmail} />
        <VaultForgeBrandLogo />
        <OwnerCommandBadge email={ownerEmail} />

        <section style={hero}>
          <div style={eyebrow}>VaultForge Member Command</div>
          <h1 style={h1}>Execution intelligence desk.</h1>
          <p style={sub}>
            Your member command center for rooms, routing, pressure, messages,
            alerts, and operational execution.
          </p>

          <div style={{ ...row, marginTop: 18 }}>
            <Link href="/my-rooms" style={goldBtn}>
              Open My Rooms
            </Link>
            <Link href="/deal-create" style={goldBtn}>
              Create Deal
            </Link>
            <Link href="/pain-intake" style={goldBtn}>
              Create Pain
            </Link>
            <Link href="/messages" style={btn}>
              Messages
            </Link>
          </div>
        </section>

        <MemberIdentity member={member} />

        <section
          style={{
            ...hero,
            borderColor:
              newRequests || adminReplies || investorReplies
                ? "rgba(255,212,90,.78)"
                : "rgba(245,197,66,.28)",
          }}
        >
          <div style={eyebrow}>Member Request Command</div>
          <h2 style={h2}>Routed investor requests and replies.</h2>
          <p style={sub}>
            This is the member request inbox. Open it to accept, pass, reply,
            request more info, release contact, or clean up routed investor
            requests.
          </p>
          <div style={{ ...row, marginTop: 18 }}>
            <Link href="/member-controlled-threads" style={goldBtn}>
              Open Request Inbox
            </Link>
            <Link href="/controlled-threads" style={btn}>
              Controlled Threads
            </Link>
            <Link href="/member-threads" style={btn}>
              Member Threads
            </Link>
          </div>
          <div style={{ ...grid, marginTop: 18 }}>
            <MetricCard
              title="New Requests"
              value={newRequests}
              note="routed investor requests needing review"
              href="/member-controlled-threads"
              danger={newRequests > 0}
            />
            <MetricCard
              title="Active Threads"
              value={activeRequests}
              note="accepted/open request conversations"
              href="/member-controlled-threads"
              danger={activeRequests > 0}
            />
            <MetricCard
              title="Admin Replies"
              value={adminReplies}
              note="admin notes attached to routed requests"
              href="/member-controlled-threads"
              danger={adminReplies > 0}
            />
            <MetricCard
              title="Investor Replies"
              value={investorReplies}
              note="investor messages attached to request threads"
              href="/member-controlled-threads"
              danger={investorReplies > 0}
            />
            <MetricCard
              title="Execution Requests"
              value={executionRequests}
              note="lender/title/contractor/operator/JV requests"
              href="/member-controlled-threads"
              danger={executionRequests > 0}
            />
            <MetricCard
              title="Deal Requests"
              value={dealRequests}
              note="deal opportunity requests routed to members"
              href="/member-controlled-threads"
              danger={dealRequests > 0}
            />
            <MetricCard
              title="Pain Requests"
              value={painRequests}
              note="problem-solving requests routed to members"
              href="/member-controlled-threads"
              danger={painRequests > 0}
            />
            <MetricCard
              title="Saved / Archive / Trash"
              value={savedRequests + archivedRequests + deletedRequests}
              note="member request cleanup folders"
              href="/member-controlled-threads"
              danger={deletedRequests > 0}
            />
          </div>
        </section>

        <section style={{ marginBottom: 20 }}>
          <div style={grid}>
            <MetricCard
              title="Active Deal Rooms"
              value={activeDeals}
              note="open opportunity rooms tied to this workspace"
              href="/my-rooms"
            />
            <MetricCard
              title="Active Pain Rooms"
              value={activePain}
              note="open pressure/problem rooms tied to this workspace"
              href="/my-rooms"
              danger={activePain > 0}
            />
            <MetricCard
              title="Routed / Assigned"
              value={routed}
              note="rooms requiring member response or execution"
              href="/my-rooms"
              danger={routed > 0}
            />
            <MetricCard
              title="Messages"
              value={messages}
              note="stored message threads and room communication"
              href="/messages"
            />
          </div>
        </section>

        <section style={{ marginBottom: 20 }}>
          <div style={grid}>
            <LaneCard
              title="My Rooms"
              badge="Operating Queue"
              note="active, saved, archived, sold, resolved, and deleted room folders."
              href="/my-rooms"
            />
            <LaneCard
              title="Routing"
              badge="Route Queue"
              note="review routed rooms, accept/pass/claim execution, and track route response."
              href="/routing"
              danger={routed > 0}
            />
            <LaneCard
              title="Intelligence Alerts"
              badge="Signal Feed"
              note={`${alerts} alert record(s) found locally. Open alerts for market pressure and route signals.`}
              href="/alerts"
              danger={alerts > 0}
            />
            <LaneCard
              title="Member Network"
              badge="Network"
              note="find buyers, lenders, operators, developers, and execution partners."
              href="/network"
            />
          </div>
        </section>

        <section style={{ ...panel, marginBottom: 20 }}>
          <div style={eyebrow}>Workspace Cleanup State</div>
          <div style={grid}>
            <MetricCard
              title="Saved"
              value={saved}
              note="rooms kept for review"
              href="/my-rooms"
            />
            <MetricCard
              title="Archived"
              value={archived}
              note="hidden from active workspace but preserved"
              href="/my-rooms"
            />
            <MetricCard
              title="Deleted"
              value={deleted}
              note="cleanup folder for hidden rooms"
              href="/my-rooms"
              danger={deleted > 0}
            />
            <MetricCard
              title="Total Rooms"
              value={deals.length + pains.length}
              note="member-visible rooms across deal and pain lanes"
              href="/my-rooms"
            />
          </div>
        </section>

        <section style={{ ...panel, marginBottom: 20 }}>
          <div style={eyebrow}>Recent Room Activity</div>
          {recent.length ? (
            <div style={grid}>
              {recent.map((item) => (
                <RecentRoomCard
                  key={`${item.kind}-${rid(item.room)}`}
                  kind={item.kind}
                  room={item.room}
                />
              ))}
            </div>
          ) : (
            <div style={panel}>
              <h2 style={h2}>No room activity yet.</h2>
              <p style={sub}>
                Create a Deal or Pain room to start the execution system.
              </p>
              <div style={{ ...row, marginTop: 16 }}>
                <Link href="/deal-create" style={goldBtn}>
                  Create Deal
                </Link>
                <Link href="/pain-intake" style={goldBtn}>
                  Create Pain
                </Link>
              </div>
            </div>
          )}
        </section>

        <section style={hero}>
          <div style={eyebrow}>VaultForge Intelligence</div>
          <h2 style={h2}>
            The command center is the front door. Rooms are the operating
            system.
          </h2>
          <p style={sub}>
            Keep Command clean. Use My Rooms for execution. Use room
            intelligence for underwriting, root cause, route fit, and
            operational next moves.
          </p>
        </section>
      </div>
    </main>
  );
}
