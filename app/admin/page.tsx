"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type MemberStatus = "pending" | "approved" | "denied" | "suspended" | "deleted";
type PaymentStatus = "unpaid" | "paid" | "comped" | "trial" | "past_due";
type AccessStatus = "locked" | "active";
type AdminFilter =
  | "all"
  | "new"
  | "pending"
  | "approvedUnpaid"
  | "paid"
  | "active"
  | "locked"
  | "comped"
  | "blocked"
  | "deleted";
type StateCode = "GA" | "TN" | "AL" | "FL" | "NC" | "SC" | "TX";
type StateFilter = "all" | "notListed" | StateCode;

type MemberRecord = {
  id: string;
  email: string;
  name: string;
  company: string;
  phone: string;
  memberType: string;
  baseState: string;
  operatingStates: string;
  status: MemberStatus;
  paymentStatus: PaymentStatus;
  access: AccessStatus;
  approvedForPayment: boolean;
  createdAt: string;
  updatedAt: string;
  source: string;
  raw?: any;
};

type AdminMessage = {
  id: string;
  topic: string;
  body: string;
  email: string;
  status: string;
  priority: string;
  createdAt: string;
};

type RoomRecord = {
  id: string;
  title: string;
  kind: "deal" | "pain";
  state: string;
  status: string;
  source: string;
};

const OWNER_EMAIL = "bcrsoutheast@gmail.com";
const ADMIN_MEMBERS_KEY = "vaultforge_admin_members_v1";
const ADMIN_MESSAGES_KEY = "vaultforge_admin_messages_v1";
const PROFILE_KEY = "vaultforge_profile";
const LOGIN_KEY = "vaultforge_member_login_v1";

const STATE_CODES: StateCode[] = ["GA", "TN", "AL", "FL", "NC", "SC", "TX"];

const PROFILE_KEYS = [
  "vaultforge_profile",
  "vaultforge_member_profile",
  "vf_profile",
  "member_profile",
  "profile",
];

const MEMBER_SOURCE_KEYS = [
  "vaultforge_admin_members_v1",
  "vaultforge_members",
  "vaultforge_member_profiles",
  "vaultforge_profiles",
  "vf_profiles",
  "members",
  "profiles",
];

const DEAL_ROOM_KEYS = [
  "vaultforge_clean_deal_rooms",
  "vaultforge_deal_rooms",
  "vaultforge_rooms_deals",
  "vf_deal_rooms",
  "deal_rooms",
];

const PAIN_ROOM_KEYS = [
  "vaultforge_clean_pain_rooms_v2",
  "vaultforge_clean_pain_rooms_v1",
  "vaultforge_clean_pain_rooms",
  "vaultforge_pain_rooms",
  "vaultforge_rooms_pain",
  "vf_pain_rooms",
  "pain_rooms",
];

function ok() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readJson<T>(key: string, fallback: T): T {
  if (!ok()) return fallback;

  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  if (!ok()) return;
  localStorage.setItem(key, JSON.stringify(value));
}

function clean(value: unknown, fallback = "") {
  const text = String(value || "").trim();
  return text && text !== "undefined" && text !== "null" ? text : fallback;
}

function lower(value: unknown) {
  return clean(value).toLowerCase();
}

function stateCode(value: unknown) {
  const raw = clean(value).toUpperCase();

  const map: Record<string, StateCode> = {
    GEORGIA: "GA",
    TENNESSEE: "TN",
    ALABAMA: "AL",
    FLORIDA: "FL",
    "NORTH CAROLINA": "NC",
    "SOUTH CAROLINA": "SC",
    TEXAS: "TX",
  };

  if (STATE_CODES.includes(raw as StateCode)) return raw;
  return map[raw] || "";
}

function listText(value: unknown, fallback: string) {
  if (Array.isArray(value)) {
    const joined = value.map((item) => clean(item)).filter(Boolean).join(" • ");
    return joined || fallback;
  }

  return clean(value, fallback);
}

function splitStates(text: string) {
  return text
    .split(/[,|•;/]+/g)
    .map((item) => stateCode(item))
    .filter(Boolean);
}

function primaryHomeState(row: any, email: string) {
  if (email === OWNER_EMAIL.toLowerCase()) return "GA";

  return stateCode(
    row?.homeState ||
      row?.home_state ||
      row?.baseState ||
      row?.base_state ||
      row?.memberHomeState ||
      row?.member_home_state ||
      row?.profileHomeState ||
      row?.profile_home_state ||
      row?.companyState ||
      row?.company_state ||
      row?.primaryState ||
      row?.primary_state ||
      row?.stateFrom ||
      row?.state_from ||
      row?.locationState ||
      row?.location_state ||
      row?.addressState ||
      row?.address_state ||
      row?.state
  );
}

function memberId(row: any, email: string) {
  const raw = clean(row?.id || row?.memberId || row?.member_id || row?.auth_user_id || email || Date.now());
  return raw.toLowerCase().replace(/[^a-z0-9@._-]+/g, "-") || `member-${Date.now()}`;
}

function memberStatus(row: any): MemberStatus {
  const text = lower(row?.status || row?.memberStatus || row?.member_status || row?.accessStatus || row?.access_status);
  if (text === "approved" || text === "active") return "approved";
  if (text === "denied" || text === "rejected") return "denied";
  if (text === "suspended") return "suspended";
  if (text === "deleted" || text === "removed") return "deleted";
  return "pending";
}

function paymentStatus(row: any): PaymentStatus {
  const text = lower(row?.paymentStatus || row?.payment_status || row?.billingStatus || row?.billing_status);
  if (text === "paid") return "paid";
  if (text === "comped" || text === "free" || text === "free_access") return "comped";
  if (text === "trial") return "trial";
  if (text === "past_due" || text === "past due") return "past_due";
  return "unpaid";
}

function normalizeMember(row: any, source: string): MemberRecord {
  const email = lower(row?.email || row?.memberEmail || row?.member_email || row?.userEmail || row?.user_email);
  const status = memberStatus(row);
  const pay = paymentStatus(row);
  const paidLike = pay === "paid" || pay === "comped" || pay === "trial";
  const approvedForPayment = Boolean(row?.approvedForPayment || row?.approved_for_payment || row?.paymentApproved || row?.payment_approved);
  const baseState = primaryHomeState(row, email);

  const operatingStates = listText(
    row?.operatingStates ||
      row?.operating_states ||
      row?.statesOperated ||
      row?.states_operated ||
      row?.serviceStates ||
      row?.service_states ||
      row?.states ||
      row?.markets,
    "Operating states not listed"
  );

  return {
    id: memberId(row, email),
    email: email || "email-not-listed",
    name: clean(row?.name || row?.fullName || row?.full_name || row?.memberName || row?.member_name, email ? email.split("@")[0] : "Unnamed Member"),
    company: clean(row?.company || row?.companyName || row?.company_name || row?.businessName || row?.business_name, "Company not listed"),
    phone: clean(row?.phone || row?.phoneNumber || row?.phone_number || row?.mobile, "Phone not listed"),
    memberType: clean(row?.memberType || row?.member_type || row?.role || row?.investorType || row?.operatorType, "Private Member"),
    baseState: baseState || "Not listed",
    operatingStates,
    status,
    paymentStatus: pay,
    approvedForPayment,
    access: row?.access === "active" || row?.isActive || row?.is_active || (status === "approved" && paidLike) ? "active" : "locked",
    createdAt: clean(row?.createdAt || row?.created_at, new Date().toISOString()),
    updatedAt: clean(row?.updatedAt || row?.updated_at, new Date().toISOString()),
    source,
    raw: row,
  };
}

function currentEmail() {
  if (!ok()) return "";

  let profile: any = {};
  for (const key of PROFILE_KEYS) {
    const next = readJson<any>(key, {});
    if (next && typeof next === "object" && !Array.isArray(next)) {
      profile = { ...profile, ...next };
    }
  }

  return lower(profile.email || profile.memberEmail || profile.member_email || localStorage.getItem("vf_email") || localStorage.getItem("member_email") || localStorage.getItem("email"));
}

function readMembers(): MemberRecord[] {
  if (!ok()) return [];

  const map = new Map<string, MemberRecord>();

  for (const key of MEMBER_SOURCE_KEYS) {
    const parsed = readJson<unknown>(key, []);
    const rows = Array.isArray(parsed)
      ? parsed
      : parsed && typeof parsed === "object"
        ? Object.values(parsed as Record<string, unknown>)
        : [];

    for (const row of rows) {
      if (!row || typeof row !== "object") continue;
      const normalized = normalizeMember(row, key);
      const id = normalized.email !== "email-not-listed" ? normalized.email : normalized.id;
      map.set(id, { ...map.get(id), ...normalized });
    }
  }

  for (const key of PROFILE_KEYS) {
    const row = readJson<any>(key, null);
    if (row && typeof row === "object" && !Array.isArray(row)) {
      const normalized = normalizeMember(row, key);
      const id = normalized.email !== "email-not-listed" ? normalized.email : normalized.id;
      map.set(id, { ...map.get(id), ...normalized });
    }
  }

  const ownerEmail = OWNER_EMAIL.toLowerCase();
  const owner = map.get(ownerEmail);

  map.set(ownerEmail, {
    ...(owner || {}),
    id: "owner-admin",
    email: ownerEmail,
    name: owner?.name || "Dmoney",
    company: owner?.company || "VaultForge",
    phone: owner?.phone || "Owner",
    memberType: owner?.memberType || "Owner / Admin",
    baseState: "GA",
    operatingStates: owner?.operatingStates || "GA • TN • AL • FL • NC • SC • TX",
    status: "approved",
    paymentStatus: "comped",
    approvedForPayment: true,
    access: "active",
    createdAt: owner?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    source: "owner-admin",
  });

  const order: Record<MemberStatus, number> = {
    pending: 0,
    approved: 1,
    suspended: 2,
    denied: 3,
    deleted: 4,
  };

  return Array.from(map.values()).sort((a, b) => order[a.status] - order[b.status] || a.name.localeCompare(b.name));
}

function readMessages(): AdminMessage[] {
  const rows = readJson<AdminMessage[]>(ADMIN_MESSAGES_KEY, []);
  return Array.isArray(rows) ? rows : [];
}

function normalizeRoom(row: any, source: string, kind: "deal" | "pain", index: number): RoomRecord {
  const id = clean(row?.id || row?.roomId || row?.dealId || row?.painId || row?.signalId || `${source}-${index}`);
  const title = clean(row?.title || row?.name || row?.propertyName || row?.headline || row?.summary, kind === "deal" ? "Deal Room" : "Pain Room");
  const state =
    stateCode(
      row?.propertyState ||
        row?.property_state ||
        row?.dealState ||
        row?.deal_state ||
        row?.painState ||
        row?.pain_state ||
        row?.homeState ||
        row?.home_state ||
        row?.baseState ||
        row?.base_state ||
        row?.marketState ||
        row?.market_state ||
        row?.locationState ||
        row?.location_state ||
        row?.addressState ||
        row?.address_state ||
        row?.state
    ) || "Not listed";

  return {
    id,
    title,
    kind,
    state,
    status: lower(row?.status || row?.roomStatus || row?.room_status || "active"),
    source,
  };
}

function readRooms(kind: "deal" | "pain") {
  if (!ok()) return [];

  const keys = kind === "deal" ? DEAL_ROOM_KEYS : PAIN_ROOM_KEYS;
  const map = new Map<string, RoomRecord>();

  for (const key of keys) {
    const parsed = readJson<unknown>(key, []);
    const rows = Array.isArray(parsed)
      ? parsed
      : parsed && typeof parsed === "object"
        ? Object.values(parsed as Record<string, unknown>)
        : [];

    rows.forEach((row: any, index) => {
      if (!row || typeof row !== "object") return;
      const room = normalizeRoom(row, key, kind, index);
      map.set(room.id, room);
    });
  }

  return Array.from(map.values());
}

function stateMemberCount(members: MemberRecord[], state: StateFilter) {
  if (state === "all") return members.filter((member) => member.status !== "deleted").length;
  if (state === "notListed") return members.filter((member) => member.status !== "deleted" && member.baseState === "Not listed").length;
  return members.filter((member) => member.status !== "deleted" && member.baseState === state).length;
}

function stateRoomCount(rooms: RoomRecord[], state: StateCode) {
  return rooms.filter((room) => room.state === state && room.status !== "deleted").length;
}

function isNewMember(member: MemberRecord) {
  if (member.status !== "pending") return false;
  const age = Date.now() - new Date(member.createdAt).getTime();
  return Number.isFinite(age) ? age < 1000 * 60 * 60 * 24 * 7 : true;
}

function isApprovedUnpaid(member: MemberRecord) {
  return member.status === "approved" && member.approvedForPayment && member.paymentStatus === "unpaid";
}

function updateProfileForSelf(member: MemberRecord) {
  if (!ok()) return;
  const viewer = currentEmail();
  if (viewer !== member.email) return;

  const profile = readJson<any>(PROFILE_KEY, {});
  const login = readJson<any>(LOGIN_KEY, {});
  const patch = {
    email: member.email,
    approvedForPayment: member.approvedForPayment,
    paymentStatus: member.paymentStatus,
    accessStatus: member.access,
    memberStatus: member.status,
    baseState: member.baseState,
    updatedAt: new Date().toISOString(),
  };

  writeJson(PROFILE_KEY, { ...profile, ...patch });
  writeJson(LOGIN_KEY, { ...login, ...patch });
  window.dispatchEvent(new Event("vaultforge-access-change"));
}

function recalcAccess(member: MemberRecord): MemberRecord {
  const paidLike = member.paymentStatus === "paid" || member.paymentStatus === "comped" || member.paymentStatus === "trial";
  return {
    ...member,
    access: member.status === "approved" && paidLike ? "active" : "locked",
    updatedAt: new Date().toISOString(),
  };
}

const page: React.CSSProperties = { minHeight: "100vh", background: "#080b10", color: "#f6f7fb", padding: 18, fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" };
const wrap: React.CSSProperties = { maxWidth: 1320, margin: "0 auto", paddingBottom: 90 };
const topbar: React.CSSProperties = { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", border: "1px solid rgba(255,255,255,.10)", background: "#0c1119", borderRadius: 18, padding: 14, marginBottom: 18 };
const brand: React.CSSProperties = { color: "#ffd45a", fontSize: 24, fontWeight: 950, letterSpacing: -1 };
const navRight: React.CSSProperties = { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" };
const btn: React.CSSProperties = { border: "1px solid rgba(207,216,230,.18)", background: "#171c29", color: "#f7f7fb", borderRadius: 999, padding: "11px 15px", fontWeight: 900, textDecoration: "none", display: "inline-block", cursor: "pointer" };
const goldBtn: React.CSSProperties = { ...btn, border: 0, background: "#ffdc68", color: "#10131a" };
const redBtn: React.CSSProperties = { ...btn, background: "#251015", borderColor: "rgba(255,70,70,.52)", color: "#ffaaaa" };
const greenBtn: React.CSSProperties = { ...btn, background: "#0e2518", borderColor: "rgba(80,220,130,.55)", color: "#9cffbc" };
const hero: React.CSSProperties = { border: "1px solid rgba(255,255,255,.10)", borderRadius: 22, padding: 28, marginBottom: 18, background: "linear-gradient(180deg,#0e1420,#090d14)" };
const card: React.CSSProperties = { background: "#0d121b", border: "1px solid rgba(255,255,255,.10)", borderRadius: 20, padding: 18, marginBottom: 18 };
const panel: React.CSSProperties = { background: "#111823", border: "1px solid rgba(207,216,230,.14)", borderRadius: 18, padding: 18 };
const alertPanel: React.CSSProperties = { ...panel, borderColor: "rgba(255,70,70,.55)", boxShadow: "0 0 28px rgba(255,70,70,.12)" };
const activePanel: React.CSSProperties = { ...panel, borderColor: "rgba(245,197,66,.50)", boxShadow: "0 0 28px rgba(245,197,66,.12)" };
const eyebrow: React.CSSProperties = { color: "#ffd45a", textTransform: "uppercase", letterSpacing: 5, fontWeight: 950, fontSize: 12, marginBottom: 10 };
const h1: React.CSSProperties = { fontSize: "clamp(36px,6vw,64px)", lineHeight: 0.95, letterSpacing: -3, margin: "0 0 14px", fontWeight: 950 };
const h2: React.CSSProperties = { fontSize: "clamp(24px,4vw,38px)", lineHeight: 1, letterSpacing: -1.5, margin: "0 0 12px", fontWeight: 950 };
const sub: React.CSSProperties = { color: "#c9d0dc", fontSize: 18, lineHeight: 1.35, margin: 0 };
const muted: React.CSSProperties = { color: "#aeb7c7", margin: "7px 0 0", lineHeight: 1.35 };
const grid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: 14 };
const smallGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12 };
const row: React.CSSProperties = { display: "flex", gap: 9, flexWrap: "wrap", alignItems: "center" };
const input: React.CSSProperties = { width: "100%", boxSizing: "border-box", border: "1px solid rgba(207,216,230,.18)", background: "#111823", color: "#f8fafc", borderRadius: 16, padding: "14px 15px", fontSize: 16 };

function AdminNav() {
  return (
    <div style={topbar}>
      <div>
        <div style={brand}>VAULTFORGE ADMIN COMMAND</div>
        <div style={{ ...muted, marginTop: 2 }}>Owner control • member approval • payment unlock • state balance</div>
      </div>
      <div style={navRight}>
        <Link href="/admin" style={goldBtn}>Admin Command</Link>
        <Link href="/admin-messages" style={btn}>Admin Messages</Link>
        <Link href="/command" style={btn}>Member View</Link>
        <Link href="/logout" style={redBtn}>Logout</Link>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={card}>
      <div style={eyebrow}>{title}</div>
      {children}
    </section>
  );
}

function Metric({ title, count, note, active, pulse, onClick }: { title: string; count: number | string; note: string; active?: boolean; pulse?: boolean; onClick?: () => void }) {
  return (
    <button type="button" className={pulse ? "vf-pulse" : ""} style={{ ...(active ? activePanel : panel), width: "100%", textAlign: "left", cursor: onClick ? "pointer" : "default" }} onClick={onClick}>
      <div style={eyebrow}>{title}</div>
      <h2 style={h2}>{count}</h2>
      <p style={muted}>{note}</p>
    </button>
  );
}

function StateCard({ state, label, count, active, onClick }: { state: StateFilter; label: string; count: number; active: boolean; onClick: () => void }) {
  return (
    <button type="button" style={{ ...(active ? activePanel : panel), width: "100%", textAlign: "left", cursor: "pointer" }} onClick={onClick}>
      <div style={eyebrow}>{label}</div>
      <h2 style={h2}>{count}</h2>
      <p style={muted}>member(s) based here</p>
    </button>
  );
}

function RoomStateCard({ title, dealCount, painCount }: { title: string; dealCount: number; painCount: number }) {
  return (
    <div style={panel}>
      <div style={eyebrow}>{title}</div>
      <div style={grid}>
        <div>
          <h2 style={h2}>{dealCount}</h2>
          <p style={muted}>deal room(s)</p>
        </div>
        <div>
          <h2 style={h2}>{painCount}</h2>
          <p style={muted}>pain room(s)</p>
        </div>
      </div>
    </div>
  );
}

function Pill({ text }: { text: string }) {
  const value = text.toLowerCase();
  let style = btn;
  if (value.includes("approved") || value.includes("active") || value.includes("paid") || value.includes("comped")) style = greenBtn;
  if (value.includes("pending") || value.includes("new") || value.includes("trial")) style = goldBtn;
  if (value.includes("denied") || value.includes("suspended") || value.includes("unpaid") || value.includes("locked") || value.includes("deleted")) style = redBtn;

  return <span style={{ ...style, padding: "7px 11px", fontSize: 12 }}>{text}</span>;
}

function MemberCard({ member, onPatch, onDeleteForever }: { member: MemberRecord; onPatch: (patch: Partial<MemberRecord>) => void; onDeleteForever: () => void }) {
  const owner = member.email === OWNER_EMAIL.toLowerCase();
  const pulse = isNewMember(member) || isApprovedUnpaid(member);
  const specialPanel = member.status === "deleted" || member.status === "denied" || member.status === "suspended" ? alertPanel : isApprovedUnpaid(member) || member.status === "pending" ? activePanel : panel;

  return (
    <div className={pulse ? "vf-pulse" : ""} style={specialPanel}>
      <div style={eyebrow}>{isNewMember(member) ? "NEW MEMBER • " : ""}{member.status} • {member.paymentStatus} • {member.access}</div>
      <h2 style={h2}>{member.name}</h2>
      <p style={sub}>{member.company}</p>
      <p style={muted}>{member.email}</p>
      <p style={muted}>{member.phone}</p>
      <p style={muted}>{member.memberType}</p>
      <p style={muted}>Home/Base State: {member.baseState}</p>
      <p style={muted}>Operating States: {member.operatingStates}</p>

      <div style={{ ...row, marginTop: 12 }}>
        <Pill text={member.status} />
        <Pill text={member.paymentStatus} />
        <Pill text={member.access} />
        <Pill text={member.approvedForPayment ? "payment approved" : "payment locked"} />
      </div>

      <div style={{ ...row, marginTop: 15 }}>
        <button type="button" style={greenBtn} onClick={() => onPatch({ status: "approved" })}>Approve</button>
        <button type="button" style={goldBtn} onClick={() => onPatch({ approvedForPayment: true, status: "approved" })}>Approve Payment Button</button>
        <button type="button" style={greenBtn} onClick={() => onPatch({ paymentStatus: "paid", status: "approved", approvedForPayment: true })}>Mark Paid</button>
        <button type="button" style={btn} onClick={() => onPatch({ paymentStatus: "unpaid" })} disabled={owner}>Mark Unpaid</button>
        <button type="button" style={goldBtn} onClick={() => onPatch({ paymentStatus: "comped", status: "approved", approvedForPayment: true, access: "active" })}>Grant Free Access</button>
        <button type="button" style={redBtn} onClick={() => onPatch({ status: "suspended", access: "locked" })} disabled={owner}>Suspend</button>
        <button type="button" style={redBtn} onClick={() => onPatch({ status: "denied", access: "locked", approvedForPayment: false })} disabled={owner}>Deny</button>
        <button type="button" style={redBtn} onClick={() => onPatch({ status: "deleted", access: "locked" })} disabled={owner}>Delete Member</button>
        {member.status === "deleted" ? <button type="button" style={redBtn} onClick={onDeleteForever} disabled={owner}>Delete Forever</button> : null}
        <button type="button" style={btn} onClick={() => onPatch({ status: "approved" })}>Restore</button>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [email, setEmail] = useState("");
  const [members, setMembers] = useState<MemberRecord[]>([]);
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [deals, setDeals] = useState<RoomRecord[]>([]);
  const [pains, setPains] = useState<RoomRecord[]>([]);
  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<AdminFilter>("all");
  const [stateFilter, setStateFilter] = useState<StateFilter>("all");

  useEffect(() => {
    const refresh = () => {
      setEmail(currentEmail());
      setMembers(readMembers());
      setMessages(readMessages());
      setDeals(readRooms("deal"));
      setPains(readRooms("pain"));
    };

    refresh();

    window.addEventListener("storage", refresh);
    window.addEventListener("vaultforge-admin-members-change", refresh);
    window.addEventListener("vaultforge-admin-message-change", refresh);
    window.addEventListener("vaultforge-my-rooms-change", refresh);

    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("vaultforge-admin-members-change", refresh);
      window.removeEventListener("vaultforge-admin-message-change", refresh);
      window.removeEventListener("vaultforge-my-rooms-change", refresh);
    };
  }, []);

  const allowed = email === OWNER_EMAIL.toLowerCase();

  const visibleMembers = useMemo(() => members.filter((member) => member.status !== "deleted"), [members]);
  const newMembers = useMemo(() => members.filter(isNewMember), [members]);
  const pending = useMemo(() => members.filter((member) => member.status === "pending"), [members]);
  const approvedUnpaid = useMemo(() => members.filter(isApprovedUnpaid), [members]);
  const paid = useMemo(() => members.filter((member) => member.paymentStatus === "paid"), [members]);
  const active = useMemo(() => members.filter((member) => member.status === "approved" && member.access === "active"), [members]);
  const locked = useMemo(() => members.filter((member) => member.status !== "deleted" && (member.paymentStatus === "unpaid" || member.access === "locked")), [members]);
  const comped = useMemo(() => members.filter((member) => member.paymentStatus === "comped"), [members]);
  const blocked = useMemo(() => members.filter((member) => member.status === "suspended" || member.status === "denied"), [members]);
  const deleted = useMemo(() => members.filter((member) => member.status === "deleted"), [members]);
  const openMessages = useMemo(() => messages.filter((message) => message.status !== "resolved" && message.status !== "deleted"), [messages]);

  const filteredMembers = useMemo(() => {
    const q = search.trim().toLowerCase();

    return members.filter((member) => {
      if (stateFilter !== "all") {
        if (stateFilter === "notListed" && member.baseState !== "Not listed") return false;
        if (stateFilter !== "notListed" && member.baseState !== stateFilter) return false;
      }

      const text = `${member.name} ${member.company} ${member.email} ${member.phone} ${member.memberType} ${member.baseState} ${member.operatingStates}`.toLowerCase();
      if (q && !text.includes(q)) return false;

      if (filter === "all") return member.status !== "deleted";
      if (filter === "new") return isNewMember(member);
      if (filter === "pending") return member.status === "pending";
      if (filter === "approvedUnpaid") return isApprovedUnpaid(member);
      if (filter === "paid") return member.paymentStatus === "paid";
      if (filter === "active") return member.status === "approved" && member.access === "active";
      if (filter === "locked") return member.status !== "deleted" && (member.paymentStatus === "unpaid" || member.access === "locked");
      if (filter === "comped") return member.paymentStatus === "comped";
      if (filter === "blocked") return member.status === "suspended" || member.status === "denied";
      if (filter === "deleted") return member.status === "deleted";

      return true;
    });
  }, [members, search, filter, stateFilter]);

  function saveMembers(next: MemberRecord[]) {
    setMembers(next);
    writeJson(ADMIN_MEMBERS_KEY, next);
    window.dispatchEvent(new Event("vaultforge-admin-members-change"));
  }

  function patchMember(id: string, patch: Partial<MemberRecord>) {
    const next = members.map((member) => {
      if (member.id !== id) return member;
      const updated = recalcAccess({ ...member, ...patch, updatedAt: new Date().toISOString() });
      updateProfileForSelf(updated);
      return updated;
    });
    saveMembers(next);
  }

  function deleteForever(id: string) {
    saveMembers(members.filter((member) => member.id !== id));
  }

  function runSearch(event?: React.FormEvent) {
    if (event) event.preventDefault();
    setSearch(searchDraft);
  }

  if (!allowed) {
    return (
      <main style={page}>
        <div style={wrap}>
          <AdminNav />
          <section style={hero}>
            <div style={eyebrow}>Owner Only</div>
            <h1 style={h1}>Admin Command locked.</h1>
            <p style={sub}>Admin Command is only visible to {OWNER_EMAIL}.</p>
            <p style={muted}>Detected email: {email || "not detected"}</p>
            <div style={{ ...row, marginTop: 18 }}>
              <Link href="/command" style={goldBtn}>Back to Member Area</Link>
              <Link href="/profile" style={btn}>Profile</Link>
              <Link href="/logout" style={redBtn}>Logout</Link>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main style={page}>
      <style>{`
        @keyframes vfPulse {
          0% { box-shadow: 0 0 0 rgba(255,220,104,.00); }
          50% { box-shadow: 0 0 34px rgba(255,220,104,.28); }
          100% { box-shadow: 0 0 0 rgba(255,220,104,.00); }
        }
        .vf-pulse {
          animation: vfPulse 1.6s ease-in-out infinite;
        }
      `}</style>

      <div style={wrap}>
        <AdminNav />

        <section style={hero}>
          <div style={eyebrow}>Admin Command</div>
          <h1 style={h1}>Owner Control Desk.</h1>
          <p style={sub}>Manage member approvals, payment unlocks, paid members, deleted members, state balance, admin messages, Deal/Pain state distribution, suspensions, and restored access.</p>
          <p style={muted}>ADMIN COMMAND MODE • Signed in as owner: {email}</p>
        </section>

        <section style={{ marginBottom: 18 }}>
          <div style={grid}>
            <Metric title="New Members" count={newMembers.length} note="new/pending member applications" pulse={newMembers.length > 0} onClick={() => setFilter("new")} />
            <Metric title="Pending" count={pending.length} note="waiting for owner review" pulse={pending.length > 0} onClick={() => setFilter("pending")} />
            <Metric title="Approved Not Paid" count={approvedUnpaid.length} note="payment button approved, not paid yet" pulse={approvedUnpaid.length > 0} onClick={() => setFilter("approvedUnpaid")} />
            <Metric title="Paid" count={paid.length} note="paid active/paid members" onClick={() => setFilter("paid")} />
            <Metric title="Active" count={active.length} note="approved and unlocked" onClick={() => setFilter("active")} />
            <Metric title="Locked" count={locked.length} note="not yet active" onClick={() => setFilter("locked")} />
            <Metric title="Comped" count={comped.length} note="free owner-granted access" onClick={() => setFilter("comped")} />
            <Metric title="Blocked" count={blocked.length} note="denied or suspended" onClick={() => setFilter("blocked")} />
            <Metric title="Deleted" count={deleted.length} note="admin cleanup folder" onClick={() => setFilter("deleted")} />
            <Metric title="Admin Messages" count={openMessages.length} note="member support and escalation" pulse={openMessages.length > 0} onClick={() => { window.location.href = "/admin-messages"; }} />
          </div>
        </section>

        <Section title="Search / Filter Members">
          <form onSubmit={runSearch} style={{ display: "grid", gap: 14 }}>
            <label>
              <div style={eyebrow}>Search</div>
              <input
                style={input}
                value={searchDraft}
                onChange={(event) => setSearchDraft(event.target.value)}
                placeholder="Search name, company, email, phone, type, home state, or operating state..."
              />
            </label>

            <div style={row}>
              <button type="submit" style={goldBtn}>Submit Search</button>
              <button type="button" style={btn} onClick={() => { setSearchDraft(""); setSearch(""); setFilter("all"); setStateFilter("all"); }}>Reset</button>
              <Link href="/admin-messages" style={btn}>Open Admin Messages</Link>
            </div>

            <div style={grid}>
              <Metric title="All" count={visibleMembers.length} note="active admin member list" active={filter === "all"} onClick={() => setFilter("all")} />
              <Metric title="New" count={newMembers.length} note="new applications" active={filter === "new"} pulse={newMembers.length > 0} onClick={() => setFilter("new")} />
              <Metric title="Pending" count={pending.length} note="not reviewed" active={filter === "pending"} onClick={() => setFilter("pending")} />
              <Metric title="Approved Not Paid" count={approvedUnpaid.length} note="needs payment" active={filter === "approvedUnpaid"} pulse={approvedUnpaid.length > 0} onClick={() => setFilter("approvedUnpaid")} />
              <Metric title="Paid" count={paid.length} note="paid members" active={filter === "paid"} onClick={() => setFilter("paid")} />
              <Metric title="Deleted" count={deleted.length} note="cleanup folder" active={filter === "deleted"} onClick={() => setFilter("deleted")} />
            </div>
          </form>
        </Section>

        <Section title="Member Home State Balance">
          <p style={muted}>These counts use each member’s profile home/base state only. Operating states do not inflate these numbers.</p>
          <div style={{ ...grid, marginTop: 14 }}>
            <StateCard state="all" label="All" count={visibleMembers.length} active={stateFilter === "all"} onClick={() => setStateFilter("all")} />
            {STATE_CODES.map((state) => (
              <StateCard key={state} state={state} label={state} count={stateMemberCount(members, state)} active={stateFilter === state} onClick={() => setStateFilter(state)} />
            ))}
            <StateCard state="notListed" label="Not Listed" count={stateMemberCount(members, "notListed")} active={stateFilter === "notListed"} onClick={() => setStateFilter("notListed")} />
          </div>
        </Section>

        <Section title="Deal Rooms By State">
          <div style={smallGrid}>
            {STATE_CODES.map((state) => (
              <div key={`deal-${state}`} style={panel}>
                <div style={eyebrow}>{state}</div>
                <h2 style={h2}>{stateRoomCount(deals, state)}</h2>
                <p style={muted}>deal room(s)</p>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Pain Rooms By State">
          <div style={smallGrid}>
            {STATE_CODES.map((state) => (
              <div key={`pain-${state}`} style={panel}>
                <div style={eyebrow}>{state}</div>
                <h2 style={h2}>{stateRoomCount(pains, state)}</h2>
                <p style={muted}>pain room(s)</p>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Deal / Pain State Overview">
          <div style={grid}>
            {STATE_CODES.map((state) => (
              <RoomStateCard key={`overview-${state}`} title={state} dealCount={stateRoomCount(deals, state)} painCount={stateRoomCount(pains, state)} />
            ))}
          </div>
        </Section>

        <Section title="Filtered Member Results">
          {filteredMembers.length ? (
            <div style={grid}>
              {filteredMembers.map((member) => (
                <MemberCard
                  key={member.id}
                  member={member}
                  onPatch={(patch) => patchMember(member.id, patch)}
                  onDeleteForever={() => deleteForever(member.id)}
                />
              ))}
            </div>
          ) : (
            <div style={panel}>
              <h2 style={h2}>No matching members.</h2>
              <p style={sub}>Try another search, home state, or status filter.</p>
            </div>
          )}
        </Section>
      </div>
    </main>
  );
}
