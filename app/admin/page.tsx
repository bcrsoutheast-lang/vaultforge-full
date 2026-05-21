"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type MemberStatus = "pending" | "approved" | "denied" | "suspended" | "deleted";
type PaymentStatus = "unpaid" | "paid" | "comped" | "trial" | "past_due";
type AdminFilter = "all" | "new" | "pending" | "approvedUnpaid" | "paid" | "active" | "locked" | "comped" | "blocked" | "deleted";
type StateCode = "GA" | "TN" | "AL" | "FL" | "NC" | "SC" | "TX";
type StateFilter = "all" | "notListed" | StateCode;
type RoomKind = "deal" | "pain";
type RoomView = "active" | "saved" | "archived" | "deleted" | "sold" | "resolved";
type QueueTab = "overview" | "members" | "investors" | "dealRequests" | "painRequests" | "rooms" | "saved" | "archived" | "deleted";

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
  access: "locked" | "active";
  approvedForPayment: boolean;
  createdAt: string;
  updatedAt: string;
  raw?: any;
};

type InvestorStatus = "pending" | "approved" | "denied" | "suspended" | "deleted";
type InvestorPaymentStatus = "unpaid" | "paid" | "comped" | "trial" | "past_due";

type InvestorRecord = {
  id: string;
  email: string;
  contactName: string;
  company: string;
  phone: string;
  statesInterested: string;
  assetTypes: string;
  minDeal: string;
  maxDeal: string;
  yearlyVolume: string;
  monthlyVolume: string;
  buyingStrategy: string;
  closeSpeed: string;
  proofFunds: boolean;
  directBuyer: string;
  fundingNeeded: string;
  openToJV: string;
  notes: string;
  status: InvestorStatus;
  paymentStatus: InvestorPaymentStatus;
  approvedForPayment: boolean;
  access: "locked" | "active";
  createdAt: string;
  updatedAt: string;
  raw?: any;
};

type InvestorRequest = {
  id: string;
  kind: string;
  itemId: string;
  title: string;
  state: string;
  investorEmail: string;
  investorCompany: string;
  investorName: string;
  message: string;
  status: string;
  createdAt: string;
};

type RoomRecord = {
  id: string;
  title: string;
  kind: RoomKind;
  state: string;
  status: string;
  saved: boolean;
  archived: boolean;
  deleted: boolean;
  sold: boolean;
  resolved: boolean;
  source: string;
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

type RoomSelection = { title: string; rooms: RoomRecord[] } | null;

const OWNER_EMAIL = "bcrsoutheast@gmail.com";
const ADMIN_MEMBERS_KEY = "vaultforge_admin_members_v1";
const ADMIN_MESSAGES_KEY = "vaultforge_admin_messages_v1";
const MEMBER_MESSAGES_KEY = "vaultforge_admin_member_broadcasts_v1";
const INVESTOR_APP_KEY = "vaultforge_investor_application_v1";
const INVESTOR_LIST_KEY = "vaultforge_investor_applications_v1";
const INVESTOR_REQUESTS_KEY = "vaultforge_investor_requests_v1";

const STATE_CODES: StateCode[] = ["GA", "TN", "AL", "FL", "NC", "SC", "TX"];

const ADMIN_LOGO_CANDIDATES = [
  "/vaultforge-logo.png",
  "/VaultForge-logo.png",
  "/vaultforge-logo.jpg",
  "/vaultforge-logo.jpeg",
  "/logo.png",
  "/logo.jpg",
  "/vf-logo.png",
  "/VF-logo.png",
  "/vaultforge.png",
  "/VaultForge.png",
];

const PROFILE_KEYS = ["vaultforge_profile", "vaultforge_member_profile", "vf_profile", "member_profile", "profile"];
const MEMBER_SOURCE_KEYS = ["vaultforge_admin_members_v1", "vaultforge_members", "vaultforge_member_profiles", "vaultforge_profiles", "vf_profiles", "members", "profiles"];

const DEAL_ROOM_KEYS = [
  "vaultforge_clean_deal_rooms",
  "vaultforge_deal_rooms",
  "vaultforge_rooms_deals",
  "vf_deal_rooms",
  "deal_rooms",
  "vaultforge_saved_rooms_v1",
  "vaultforge_archived_rooms_v1",
  "vaultforge_deleted_rooms_v1",
];

const PAIN_ROOM_KEYS = [
  "vaultforge_clean_pain_rooms_v2",
  "vaultforge_clean_pain_rooms_v1",
  "vaultforge_clean_pain_rooms",
  "vaultforge_pain_rooms",
  "vaultforge_rooms_pain",
  "vf_pain_rooms",
  "pain_rooms",
  "vaultforge_saved_rooms_v1",
  "vaultforge_archived_rooms_v1",
  "vaultforge_deleted_rooms_v1",
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

function currentEmail() {
  if (!ok()) return "";
  let profile: any = {};
  for (const key of PROFILE_KEYS) {
    const next = readJson<any>(key, {});
    if (next && typeof next === "object" && !Array.isArray(next)) profile = { ...profile, ...next };
  }
  return lower(profile.email || profile.memberEmail || profile.member_email || localStorage.getItem("vf_email") || localStorage.getItem("member_email") || localStorage.getItem("email"));
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

function normalizeMember(row: any): MemberRecord {
  const email = lower(row?.email || row?.memberEmail || row?.member_email || row?.userEmail || row?.user_email);
  const status = memberStatus(row);
  const pay = paymentStatus(row);
  const paidLike = pay === "paid" || pay === "comped" || pay === "trial";
  const approvedForPayment = Boolean(row?.approvedForPayment || row?.approved_for_payment || row?.paymentApproved || row?.payment_approved);
  const baseState = primaryHomeState(row, email);
  const operatingStates = listText(row?.operatingStates || row?.operating_states || row?.statesOperated || row?.states_operated || row?.serviceStates || row?.service_states || row?.states || row?.markets, "Operating states not listed");

  return {
    id: clean(row?.id || row?.memberId || row?.member_id || row?.auth_user_id || email || Date.now()).toLowerCase().replace(/[^a-z0-9@._-]+/g, "-"),
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
    raw: row,
  };
}

function readMembers(): MemberRecord[] {
  if (!ok()) return [];
  const map = new Map<string, MemberRecord>();

  for (const key of MEMBER_SOURCE_KEYS) {
    const parsed = readJson<unknown>(key, []);
    const rows = Array.isArray(parsed) ? parsed : parsed && typeof parsed === "object" ? Object.values(parsed as Record<string, unknown>) : [];
    rows.forEach((row) => {
      if (!row || typeof row !== "object") return;
      const member = normalizeMember(row);
      const id = member.email !== "email-not-listed" ? member.email : member.id;
      map.set(id, { ...map.get(id), ...member });
    });
  }

  for (const key of PROFILE_KEYS) {
    const row = readJson<any>(key, null);
    if (row && typeof row === "object" && !Array.isArray(row)) {
      const member = normalizeMember(row);
      const id = member.email !== "email-not-listed" ? member.email : member.id;
      map.set(id, { ...map.get(id), ...member });
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
    raw: owner?.raw || {},
  });

  const order: Record<MemberStatus, number> = { pending: 0, approved: 1, suspended: 2, denied: 3, deleted: 4 };
  return Array.from(map.values()).sort((a, b) => order[a.status] - order[b.status] || a.name.localeCompare(b.name));
}

function investorStatus(row: any): InvestorStatus {
  const value = lower(row?.status || row?.investorStatus || row?.investor_status);
  if (value === "approved" || value === "active") return "approved";
  if (value === "denied" || value === "rejected") return "denied";
  if (value === "suspended") return "suspended";
  if (value === "deleted" || value === "removed") return "deleted";
  return "pending";
}

function investorPaymentStatus(row: any): InvestorPaymentStatus {
  const value = lower(row?.paymentStatus || row?.payment_status || row?.billingStatus || row?.billing_status);
  if (value === "paid") return "paid";
  if (value === "comped" || value === "free" || value === "free_access") return "comped";
  if (value === "trial") return "trial";
  if (value === "past_due" || value === "past due") return "past_due";
  return "unpaid";
}

function normalizeInvestor(row: any): InvestorRecord {
  const email = lower(row?.email || row?.investorEmail || row?.investor_email);
  const status = investorStatus(row);
  const pay = investorPaymentStatus(row);
  const paidLike = pay === "paid" || pay === "comped" || pay === "trial";
  const approvedForPayment = Boolean(row?.approvedForPayment || row?.approved_for_payment || row?.paymentApproved || row?.payment_approved);

  return {
    id: clean(row?.id || row?.investorId || row?.investor_id || email || `investor-${Date.now()}`).toLowerCase().replace(/[^a-z0-9@._-]+/g, "-"),
    email: email || "email-not-listed",
    contactName: clean(row?.contactName || row?.contact_name || row?.name || row?.fullName || row?.full_name, email ? email.split("@")[0] : "Unnamed Investor"),
    company: clean(row?.company || row?.companyName || row?.company_name || row?.businessName || row?.business_name, "Company not listed"),
    phone: clean(row?.phone || row?.phoneNumber || row?.phone_number || row?.mobile, "Phone not listed"),
    statesInterested: listText(row?.statesInterested || row?.states_interested || row?.states || row?.markets, "States not listed"),
    assetTypes: listText(row?.assetTypes || row?.asset_types || row?.assetClass || row?.asset_class, "Asset types not listed"),
    minDeal: clean(row?.minDeal || row?.min_deal || row?.minimumDeal || row?.minimum_deal, "Not listed"),
    maxDeal: clean(row?.maxDeal || row?.max_deal || row?.maximumDeal || row?.maximum_deal, "Not listed"),
    yearlyVolume: clean(row?.yearlyVolume || row?.yearly_volume || row?.dealsPerYear || row?.deals_per_year, "Not listed"),
    monthlyVolume: clean(row?.monthlyVolume || row?.monthly_volume, "Not listed"),
    buyingStrategy: listText(row?.buyingStrategy || row?.buying_strategy || row?.strategy || row?.strategies, "Not listed"),
    closeSpeed: clean(row?.closeSpeed || row?.close_speed || row?.averageCloseTime || row?.average_close_time, "Not listed"),
    proofFunds: Boolean(row?.proofFunds || row?.proof_funds || row?.proofOfFunds || row?.proof_of_funds),
    directBuyer: clean(row?.directBuyer || row?.direct_buyer || row?.buyerStatus || row?.buyer_status, "Not listed"),
    fundingNeeded: clean(row?.fundingNeeded || row?.funding_needed, "Not listed"),
    openToJV: clean(row?.openToJV || row?.open_to_jv || row?.jointVenture || row?.joint_venture, "Not listed"),
    notes: clean(row?.notes || row?.message || row?.description, ""),
    status,
    paymentStatus: pay,
    approvedForPayment,
    access: row?.access === "active" || row?.accessStatus === "active" || row?.access_status === "active" || (status === "approved" && paidLike) ? "active" : "locked",
    createdAt: clean(row?.createdAt || row?.created_at, new Date().toISOString()),
    updatedAt: clean(row?.updatedAt || row?.updated_at, new Date().toISOString()),
    raw: row,
  };
}

function readInvestors(): InvestorRecord[] {
  if (!ok()) return [];
  const map = new Map<string, InvestorRecord>();
  const rows = readJson<any[]>(INVESTOR_LIST_KEY, []);

  if (Array.isArray(rows)) {
    rows.forEach((row) => {
      if (!row || typeof row !== "object") return;
      const investor = normalizeInvestor(row);
      map.set(investor.email !== "email-not-listed" ? investor.email : investor.id, investor);
    });
  }

  const single = readJson<any>(INVESTOR_APP_KEY, null);
  if (single && typeof single === "object" && !Array.isArray(single)) {
    const investor = normalizeInvestor(single);
    const key = investor.email !== "email-not-listed" ? investor.email : investor.id;
    map.set(key, { ...map.get(key), ...investor });
  }

  const order: Record<InvestorStatus, number> = { pending: 0, approved: 1, suspended: 2, denied: 3, deleted: 4 };
  return Array.from(map.values()).sort((a, b) => order[a.status] - order[b.status] || a.company.localeCompare(b.company));
}

function saveInvestors(investors: InvestorRecord[], updatedInvestor?: InvestorRecord) {
  writeJson(INVESTOR_LIST_KEY, investors);
  const currentSingle = readJson<any>(INVESTOR_APP_KEY, {});
  const singleEmail = lower(currentSingle?.email || currentSingle?.investorEmail || currentSingle?.investor_email);
  const viewerEmail = currentEmail();
  const matching = updatedInvestor || investors.find((investor) => investor.email === singleEmail) || investors.find((investor) => investor.email === viewerEmail);
  if (matching) writeJson(INVESTOR_APP_KEY, { ...currentSingle, ...matching });
  window.dispatchEvent(new Event("vaultforge-investor-change"));
  window.dispatchEvent(new Event("vaultforge-admin-investor-change"));
}

function recalcInvestorAccess(investor: InvestorRecord): InvestorRecord {
  const paidLike = investor.paymentStatus === "paid" || investor.paymentStatus === "comped" || investor.paymentStatus === "trial";
  return {
    ...investor,
    access: investor.status === "approved" && paidLike ? "active" : "locked",
    updatedAt: new Date().toISOString(),
  };
}

function readInvestorRequests(): InvestorRequest[] {
  const rows = readJson<InvestorRequest[]>(INVESTOR_REQUESTS_KEY, []);
  return Array.isArray(rows) ? rows : [];
}

function readMessages(): AdminMessage[] {
  const rows = readJson<AdminMessage[]>(ADMIN_MESSAGES_KEY, []);
  return Array.isArray(rows) ? rows : [];
}

function roomKindFrom(row: any, fallback: RoomKind): RoomKind {
  const text = lower(row?.kind || row?.type || row?.roomType || row?.room_type || row?.category);
  if (text.includes("pain")) return "pain";
  if (text.includes("deal") || text.includes("opportunity") || text.includes("project")) return "deal";
  return fallback;
}

function normalizeRoom(row: any, source: string, fallbackKind: RoomKind, index: number): RoomRecord {
  const kind = roomKindFrom(row, fallbackKind);
  const id = clean(row?.id || row?.roomId || row?.dealId || row?.painId || row?.signalId || `${source}-${kind}-${index}`);
  const title = clean(row?.title || row?.name || row?.propertyName || row?.headline || row?.summary, kind === "deal" ? "Deal Room" : "Pain Room");
  const state = stateCode(row?.propertyState || row?.property_state || row?.dealState || row?.deal_state || row?.painState || row?.pain_state || row?.homeState || row?.home_state || row?.baseState || row?.base_state || row?.marketState || row?.market_state || row?.locationState || row?.location_state || row?.addressState || row?.address_state || row?.state) || "Not listed";
  const status = lower(row?.status || row?.roomStatus || row?.room_status || row?.folder || row?.roomFolder || row?.room_folder || "active");
  const saved = Boolean(row?.saved || row?.isSaved || row?.is_saved || status.includes("saved") || source.includes("saved"));
  const archived = Boolean(row?.archived || row?.isArchived || row?.is_archived || status.includes("archived") || source.includes("archived"));
  const deleted = Boolean(row?.deleted || row?.isDeleted || row?.is_deleted || status.includes("deleted") || source.includes("deleted"));
  const sold = Boolean(row?.sold || row?.isSold || row?.is_sold || status.includes("sold"));
  const resolved = Boolean(row?.resolved || row?.isResolved || row?.is_resolved || status.includes("resolved"));

  return { id, title, kind, state, status, saved, archived, deleted, sold, resolved, source };
}

function readRooms(kind: RoomKind) {
  if (!ok()) return [];
  const keys = kind === "deal" ? DEAL_ROOM_KEYS : PAIN_ROOM_KEYS;
  const map = new Map<string, RoomRecord>();

  for (const key of keys) {
    const parsed = readJson<unknown>(key, []);
    const rows = Array.isArray(parsed) ? parsed : parsed && typeof parsed === "object" ? Object.values(parsed as Record<string, unknown>) : [];
    rows.forEach((row: any, index) => {
      if (!row || typeof row !== "object") return;
      const room = normalizeRoom(row, key, kind, index);
      if (room.kind !== kind) return;
      map.set(room.id, room);
    });
  }

  return Array.from(map.values());
}

function inRoomView(room: RoomRecord, view: RoomView) {
  if (view === "saved") return room.saved && !room.deleted;
  if (view === "archived") return room.archived && !room.deleted;
  if (view === "deleted") return room.deleted;
  if (view === "sold") return room.sold && !room.deleted;
  if (view === "resolved") return room.resolved && !room.deleted;
  return !room.saved && !room.archived && !room.deleted && !room.sold && !room.resolved;
}

function stateMemberCount(members: MemberRecord[], state: StateFilter) {
  if (state === "all") return members.filter((member) => member.status !== "deleted").length;
  if (state === "notListed") return members.filter((member) => member.status !== "deleted" && member.baseState === "Not listed").length;
  return members.filter((member) => member.status !== "deleted" && member.baseState === state).length;
}

function stateRoomCount(rooms: RoomRecord[], state: StateCode) {
  return rooms.filter((room) => room.state === state && !room.deleted).length;
}

function isNewMember(member: MemberRecord) {
  if (member.status !== "pending") return false;
  const age = Date.now() - new Date(member.createdAt).getTime();
  return Number.isFinite(age) ? age < 1000 * 60 * 60 * 24 * 7 : true;
}

function isApprovedUnpaid(member: MemberRecord) {
  return member.status === "approved" && member.approvedForPayment && member.paymentStatus === "unpaid";
}

function memberSearchText(member: MemberRecord) {
  return [member.name, member.company, member.email, member.phone, member.memberType, member.baseState, member.operatingStates, JSON.stringify(member.raw || {})].join(" ").toLowerCase();
}

function saveBroadcastMessage(recipients: MemberRecord[], subject: string, body: string) {
  const cleanSubject = clean(subject, "Admin Command Message");
  const cleanBody = clean(body);
  if (!cleanBody || !recipients.length) return false;

  const existing = readJson<any[]>(MEMBER_MESSAGES_KEY, []);
  const now = new Date().toISOString();
  const rows = recipients.map((member) => ({
    id: `admin-broadcast-${Date.now()}-${member.id}`,
    threadKey: `admin-${member.email}`,
    lane: "admin",
    subject: cleanSubject,
    body: cleanBody,
    from: OWNER_EMAIL,
    to: member.email,
    memberName: member.name,
    memberCompany: member.company,
    status: "unread",
    createdAt: now,
    source: "admin-broadcast",
  }));

  writeJson(MEMBER_MESSAGES_KEY, [...rows, ...(Array.isArray(existing) ? existing : [])]);

  const adminLog: AdminMessage = {
    id: `admin-sent-${Date.now()}`,
    topic: `Broadcast sent to ${recipients.length} member(s)`,
    body: `${cleanSubject}: ${cleanBody}`,
    email: OWNER_EMAIL,
    status: "sent",
    priority: "normal",
    createdAt: now,
  };
  writeJson(ADMIN_MESSAGES_KEY, [adminLog, ...readMessages()]);
  window.dispatchEvent(new Event("vaultforge-admin-message-change"));
  window.dispatchEvent(new Event("vaultforge-message-command-change"));
  return true;
}

const page: React.CSSProperties = { minHeight: "100vh", background: "#080b10", color: "#f6f7fb", padding: 18, fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" };
const wrap: React.CSSProperties = { maxWidth: 1500, margin: "0 auto", paddingBottom: 110 };
const topbar: React.CSSProperties = { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", border: "1px solid rgba(255,255,255,.10)", background: "#0c1119", borderRadius: 18, padding: 14, marginBottom: 18 };
const brand: React.CSSProperties = { color: "#ffd45a", fontSize: 24, fontWeight: 950, letterSpacing: -1 };
const navRight: React.CSSProperties = { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" };
const btn: React.CSSProperties = { border: "1px solid rgba(207,216,230,.18)", background: "#171c29", color: "#f7f7fb", borderRadius: 999, padding: "11px 15px", fontWeight: 900, textDecoration: "none", display: "inline-block", cursor: "pointer" };
const goldBtn: React.CSSProperties = { ...btn, border: 0, background: "#ffdc68", color: "#10131a" };
const redBtn: React.CSSProperties = { ...btn, background: "#251015", borderColor: "rgba(255,70,70,.52)", color: "#ffaaaa" };
const greenBtn: React.CSSProperties = { ...btn, background: "#0e2518", borderColor: "rgba(80,220,130,.55)", color: "#9cffbc" };
const hero: React.CSSProperties = { border: "1px solid rgba(245,197,66,.28)", borderRadius: 26, padding: 30, marginBottom: 18, background: "radial-gradient(circle at top right, rgba(245,197,66,.14), transparent 30%), linear-gradient(180deg,#0e1420,#090d14)" };
const card: React.CSSProperties = { background: "#0d121b", border: "1px solid rgba(255,255,255,.10)", borderRadius: 20, padding: 18, marginBottom: 18 };
const panel: React.CSSProperties = { background: "#111823", border: "1px solid rgba(207,216,230,.14)", borderRadius: 18, padding: 18 };
const alertPanel: React.CSSProperties = { ...panel, borderColor: "rgba(255,70,70,.55)", boxShadow: "0 0 28px rgba(255,70,70,.12)" };
const activePanel: React.CSSProperties = { ...panel, borderColor: "rgba(245,197,66,.50)", boxShadow: "0 0 28px rgba(245,197,66,.12)" };
const modalBackdrop: React.CSSProperties = { position: "fixed", inset: 0, background: "rgba(0,0,0,.76)", zIndex: 80, padding: 18, overflow: "auto" };
const modal: React.CSSProperties = { maxWidth: 900, margin: "45px auto", background: "#0d121b", border: "1px solid rgba(245,197,66,.35)", borderRadius: 26, padding: 24, boxShadow: "0 0 60px rgba(0,0,0,.5)" };
const eyebrow: React.CSSProperties = { color: "#ffd45a", textTransform: "uppercase", letterSpacing: 5, fontWeight: 950, fontSize: 12, marginBottom: 10 };
const h1: React.CSSProperties = { fontSize: "clamp(38px,7vw,76px)", lineHeight: 0.9, letterSpacing: -3.5, margin: "0 0 14px", fontWeight: 950 };
const h2: React.CSSProperties = { fontSize: "clamp(24px,4vw,38px)", lineHeight: 1, letterSpacing: -1.5, margin: "0 0 12px", fontWeight: 950 };
const h3: React.CSSProperties = { fontSize: 24, margin: "0 0 10px", fontWeight: 950 };
const sub: React.CSSProperties = { color: "#c9d0dc", fontSize: 18, lineHeight: 1.35, margin: 0 };
const muted: React.CSSProperties = { color: "#aeb7c7", margin: "7px 0 0", lineHeight: 1.35 };
const grid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: 14 };
const smallGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 12 };
const row: React.CSSProperties = { display: "flex", gap: 9, flexWrap: "wrap", alignItems: "center" };
const input: React.CSSProperties = { width: "100%", boxSizing: "border-box", border: "1px solid rgba(207,216,230,.18)", background: "#111823", color: "#f8fafc", borderRadius: 16, padding: "14px 15px", fontSize: 16 };


function AdminLogoBlock() {
  const [index, setIndex] = useState(0);
  const src = ADMIN_LOGO_CANDIDATES[index];

  return (
    <div style={{ display: "flex", justifyContent: "center", margin: "0 0 22px" }}>
      <div
        style={{
          width: "min(420px, 88vw)",
          border: "1px solid rgba(245,197,66,.28)",
          borderRadius: 26,
          padding: 16,
          background: "radial-gradient(circle, rgba(245,197,66,.13), transparent 68%), #070b14",
          boxShadow: "0 0 50px rgba(245,197,66,.14)",
        }}
      >
        {src ? (
          <img
            src={src}
            alt="VaultForge"
            style={{ width: "100%", height: "auto", display: "block", borderRadius: 16 }}
            onError={() => setIndex((value) => (value + 1 < ADMIN_LOGO_CANDIDATES.length ? value + 1 : ADMIN_LOGO_CANDIDATES.length))}
          />
        ) : (
          <div style={{ minHeight: 160, display: "grid", placeItems: "center", color: "#ffd45a", fontSize: 52, fontWeight: 950 }}>
            VAULTFORGE
          </div>
        )}
      </div>
    </div>
  );
}

function AdminNav() {
  return (
    <div style={topbar}>
      <div>
        <div style={brand}>VAULTFORGE ADMIN COMMAND</div>
        <div style={{ ...muted, marginTop: 2 }}>Owner control • members • investors • Deal/Pain intelligence</div>
      </div>
      <div style={navRight}>
        <Link href="/" style={btn}>Home</Link>
        <Link href="/admin" style={goldBtn}>Admin Command</Link>
        <Link href="/command" style={btn}>Member View</Link>
        <Link href="/investor-room" style={btn}>Investor Room</Link>
        <Link href="/logout" style={redBtn}>Logout</Link>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section style={card}><div style={eyebrow}>{title}</div>{children}</section>;
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

function Pill({ text }: { text: string }) {
  const value = text.toLowerCase();
  let style = btn;
  if (value.includes("approved") || value.includes("active") || value.includes("paid") || value.includes("comped")) style = greenBtn;
  if (value.includes("pending") || value.includes("new") || value.includes("trial")) style = goldBtn;
  if (value.includes("denied") || value.includes("suspended") || value.includes("unpaid") || value.includes("locked") || value.includes("deleted")) style = redBtn;
  return <span style={{ ...style, padding: "7px 11px", fontSize: 12 }}>{text}</span>;
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

function RoomCard({ title, count, active, pulse, onClick }: { title: string; count: number; active?: boolean; pulse?: boolean; onClick?: () => void }) {
  return (
    <button type="button" className={pulse ? "vf-pulse" : ""} style={{ ...(active ? activePanel : panel), width: "100%", textAlign: "left", cursor: onClick ? "pointer" : "default" }} onClick={onClick}>
      <div style={eyebrow}>{title}</div>
      <h2 style={h2}>{count}</h2>
      <p style={muted}>room(s)</p>
    </button>
  );
}

function MemberCard({ member, onOpen, onPatch, onDeleteForever }: { member: MemberRecord; onOpen: () => void; onPatch: (patch: Partial<MemberRecord>) => void; onDeleteForever: () => void }) {
  const owner = member.email === OWNER_EMAIL.toLowerCase();
  const pulse = isNewMember(member) || isApprovedUnpaid(member);
  const specialPanel = member.status === "deleted" || member.status === "denied" || member.status === "suspended" ? alertPanel : isApprovedUnpaid(member) || member.status === "pending" ? activePanel : panel;

  return (
    <div className={pulse ? "vf-pulse" : ""} style={specialPanel}>
      <button type="button" onClick={onOpen} style={{ all: "unset", cursor: "pointer", display: "block", width: "100%" }}>
        <div style={eyebrow}>{isNewMember(member) ? "NEW MEMBER • " : ""}{member.status} • {member.paymentStatus} • {member.access}</div>
        <h2 style={h2}>{member.name}</h2>
        <p style={sub}>{member.company}</p>
        <p style={muted}>{member.email}</p>
        <p style={muted}>{member.phone}</p>
        <p style={muted}>{member.memberType}</p>
        <p style={muted}>Home/Base State: {member.baseState}</p>
        <p style={muted}>Operating States: {member.operatingStates}</p>
      </button>

      <div style={{ ...row, marginTop: 12 }}>
        <Pill text={member.status} /><Pill text={member.paymentStatus} /><Pill text={member.access} /><Pill text={member.approvedForPayment ? "payment approved" : "payment locked"} />
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

function InvestorCard({ investor, onPatch, onDeleteForever }: { investor: InvestorRecord; onPatch: (patch: Partial<InvestorRecord>) => void; onDeleteForever: () => void }) {
  const needsPayment = investor.status === "approved" && investor.approvedForPayment && investor.paymentStatus === "unpaid";
  const specialPanel = investor.status === "pending" || needsPayment ? activePanel : investor.status === "denied" || investor.status === "suspended" || investor.status === "deleted" ? alertPanel : panel;

  return (
    <div className={investor.status === "pending" || needsPayment ? "vf-pulse" : ""} style={specialPanel}>
      <div style={eyebrow}>{investor.status} • {investor.paymentStatus} • {investor.access}</div>
      <h2 style={h2}>{investor.company}</h2>
      <p style={sub}>{investor.contactName}</p>
      <p style={muted}>{investor.email}</p>
      <p style={muted}>{investor.phone}</p>
      <p style={muted}>Markets: {investor.statesInterested}</p>
      <p style={muted}>Investor Type / Assets: {investor.assetTypes}</p>
      <p style={muted}>Buy Box: {investor.minDeal} - {investor.maxDeal}</p>
      <p style={muted}>Yearly Volume: {investor.yearlyVolume}</p>
      <p style={muted}>Buying Strategy: {investor.buyingStrategy}</p>
      <p style={muted}>Close Speed: {investor.closeSpeed}</p>
      <p style={muted}>Proof of Funds: {investor.proofFunds ? "Yes" : "Not listed"}</p>
      <p style={muted}>Direct Buyer: {investor.directBuyer}</p>
      <p style={muted}>Funding Needed: {investor.fundingNeeded}</p>
      <p style={muted}>Open To JV: {investor.openToJV}</p>
      {investor.notes ? <p style={muted}>Notes: {investor.notes}</p> : null}

      <div style={{ ...row, marginTop: 15 }}>
        <button type="button" style={greenBtn} onClick={() => onPatch({ status: "approved" })}>Approve Investor</button>
        <button type="button" style={goldBtn} onClick={() => onPatch({ approvedForPayment: true, status: "approved" })}>Approve Payment Button</button>
        <button type="button" style={greenBtn} onClick={() => onPatch({ paymentStatus: "paid", status: "approved", approvedForPayment: true })}>Mark Paid</button>
        <button type="button" style={goldBtn} onClick={() => onPatch({ paymentStatus: "comped", status: "approved", approvedForPayment: true, access: "active" })}>Grant Free Access</button>
        <button type="button" style={redBtn} onClick={() => onPatch({ status: "suspended", access: "locked" })}>Suspend</button>
        <button type="button" style={redBtn} onClick={() => onPatch({ status: "denied", access: "locked", approvedForPayment: false })}>Deny</button>
        <button type="button" style={redBtn} onClick={() => onPatch({ status: "deleted", access: "locked" })}>Delete Investor</button>
        {investor.status === "deleted" ? <button type="button" style={redBtn} onClick={onDeleteForever}>Delete Forever</button> : null}
        <button type="button" style={btn} onClick={() => onPatch({ status: "approved" })}>Restore</button>
        <Link href="/investor-payment" style={goldBtn}>Investor Payment</Link>
      </div>
    </div>
  );
}

function InvestorRequestCard({ request }: { request: InvestorRequest }) {
  const isPain = lower(request.kind).includes("pain");
  return (
    <div style={isPain ? alertPanel : activePanel}>
      <div style={eyebrow}>{request.kind || "Request"} • {request.state || "Unknown State"} • {request.status}</div>
      <h2 style={h2}>{request.title}</h2>
      <p style={sub}>{request.investorCompany || request.investorName || request.investorEmail}</p>
      <p style={muted}>{request.investorEmail}</p>
      <p style={muted}>{request.message}</p>
      <p style={muted}>Room ID: {request.itemId || "Not listed"}</p>
      <div style={{ ...row, marginTop: 14 }}>
        <button type="button" style={goldBtn}>Approve Intro</button>
        <button type="button" style={btn}>Save</button>
        <button type="button" style={btn}>Archive</button>
        <button type="button" style={redBtn}>Delete</button>
      </div>
    </div>
  );
}

function MemberModal({ member, onClose }: { member: MemberRecord | null; onClose: () => void }) {
  if (!member) return null;
  return (
    <div style={modalBackdrop}>
      <div style={modal}>
        <button type="button" style={goldBtn} onClick={onClose}>Close Window</button>
        <div style={{ marginTop: 18 }}>
          <div style={eyebrow}>Member Profile Window</div>
          <h1 style={h1}>{member.name}</h1>
          <p style={sub}>{member.company}</p>
          <div style={grid}>
            <div style={panel}><div style={eyebrow}>Email</div><p style={sub}>{member.email}</p></div>
            <div style={panel}><div style={eyebrow}>Phone</div><p style={sub}>{member.phone}</p></div>
            <div style={panel}><div style={eyebrow}>Type</div><p style={sub}>{member.memberType}</p></div>
            <div style={panel}><div style={eyebrow}>Home State</div><p style={sub}>{member.baseState}</p></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RoomModal({ selection, onClose }: { selection: RoomSelection; onClose: () => void }) {
  if (!selection) return null;
  return (
    <div style={modalBackdrop}>
      <div style={modal}>
        <button type="button" style={goldBtn} onClick={onClose}>Close Projects Window</button>
        <div style={{ marginTop: 18 }}>
          <div style={eyebrow}>Admin Project / Room Window</div>
          <h1 style={h1}>{selection.title}</h1>
          <p style={sub}>{selection.rooms.length} matching room(s)</p>
          <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
            {selection.rooms.length ? selection.rooms.map((room) => (
              <div key={`${room.kind}-${room.id}-${room.source}`} style={panel}>
                <div style={eyebrow}>{room.kind} • {room.state} • {room.status || "active"}</div>
                <h2 style={h2}>{room.title}</h2>
                <p style={muted}>Room ID: {room.id}</p>
                <p style={muted}>Source: {room.source}</p>
                <div style={{ ...row, marginTop: 12 }}>
                  <button type="button" style={goldBtn}>Save</button>
                  <button type="button" style={btn}>Archive</button>
                  <button type="button" style={redBtn}>Delete</button>
                  <button type="button" style={redBtn}>Delete Forever</button>
                </div>
                <p style={{ ...muted, marginTop: 8 }}>Admin Room Cleanup Controls</p>
              </div>
            )) : (
              <div style={panel}><h2 style={h2}>No rooms found.</h2><p style={sub}>No matching projects/rooms exist yet.</p></div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


function CollapseBar({ label, onCollapse }: { label: string; onCollapse: () => void }) {
  return (
    <div style={{ ...row, justifyContent: "space-between", marginBottom: 14 }}>
      <div style={eyebrow}>{label}</div>
      <button type="button" style={btn} onClick={onCollapse}>
        Collapse / Done
      </button>
    </div>
  );
}


export default function AdminPage() {
  const [email, setEmail] = useState("");
  const [members, setMembers] = useState<MemberRecord[]>([]);
  const [investors, setInvestors] = useState<InvestorRecord[]>([]);
  const [investorRequests, setInvestorRequests] = useState<InvestorRequest[]>([]);
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [deals, setDeals] = useState<RoomRecord[]>([]);
  const [pains, setPains] = useState<RoomRecord[]>([]);
  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");
  const [broadcastSubject, setBroadcastSubject] = useState("");
  const [broadcastBody, setBroadcastBody] = useState("");
  const [broadcastNotice, setBroadcastNotice] = useState("");
  const [filter, setFilter] = useState<AdminFilter>("all");
  const [stateFilter, setStateFilter] = useState<StateFilter>("all");
  const [tab, setTab] = useState<QueueTab>("overview");
  const [selectedMember, setSelectedMember] = useState<MemberRecord | null>(null);
  const [roomSelection, setRoomSelection] = useState<RoomSelection>(null);
  const [activeRoomCard, setActiveRoomCard] = useState("");

  useEffect(() => {
    const refresh = () => {
      setEmail(currentEmail());
      setMembers(readMembers());
      setInvestors(readInvestors());
      setInvestorRequests(readInvestorRequests());
      setMessages(readMessages());
      setDeals(readRooms("deal"));
      setPains(readRooms("pain"));
    };
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener("vaultforge-admin-members-change", refresh);
    window.addEventListener("vaultforge-admin-message-change", refresh);
    window.addEventListener("vaultforge-investor-change", refresh);
    window.addEventListener("vaultforge-investor-request-change", refresh);
    window.addEventListener("vaultforge-my-rooms-change", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("vaultforge-admin-members-change", refresh);
      window.removeEventListener("vaultforge-admin-message-change", refresh);
      window.removeEventListener("vaultforge-investor-change", refresh);
      window.removeEventListener("vaultforge-investor-request-change", refresh);
      window.removeEventListener("vaultforge-my-rooms-change", refresh);
    };
  }, []);

  const allowed = email === OWNER_EMAIL.toLowerCase();
  const visibleMembers = useMemo(() => members.filter((member) => member.status !== "deleted"), [members]);
  const newMembers = useMemo(() => members.filter(isNewMember), [members]);
  const pending = useMemo(() => members.filter((member) => member.status === "pending"), [members]);
  const approvedUnpaid = useMemo(() => members.filter(isApprovedUnpaid), [members]);
  const paid = useMemo(() => members.filter((member) => member.paymentStatus === "paid"), [members]);
  const comped = useMemo(() => members.filter((member) => member.paymentStatus === "comped"), [members]);
  const deleted = useMemo(() => members.filter((member) => member.status === "deleted"), [members]);
  const archivedMembers = useMemo(() => members.filter((member) => member.status === "suspended" || member.status === "denied"), [members]);
  const activeMembers = useMemo(() => members.filter((member) => member.status === "approved" && member.access === "active"), [members]);
  const openMessages = useMemo(() => messages.filter((message) => message.status !== "resolved" && message.status !== "deleted"), [messages]);

  const newInvestors = useMemo(() => investors.filter((investor) => investor.status === "pending"), [investors]);
  const approvedInvestors = useMemo(() => investors.filter((investor) => investor.status === "approved"), [investors]);
  const pendingInvestorPayment = useMemo(() => investors.filter((investor) => investor.status === "approved" && investor.approvedForPayment && investor.paymentStatus === "unpaid"), [investors]);
  const paidInvestors = useMemo(() => investors.filter((investor) => investor.paymentStatus === "paid" || investor.paymentStatus === "comped"), [investors]);
  const blockedInvestors = useMemo(() => investors.filter((investor) => investor.status === "denied" || investor.status === "suspended"), [investors]);
  const deletedInvestors = useMemo(() => investors.filter((investor) => investor.status === "deleted"), [investors]);
  const dealRequests = useMemo(() => investorRequests.filter((request) => lower(request.kind).includes("deal")), [investorRequests]);
  const painRequests = useMemo(() => investorRequests.filter((request) => lower(request.kind).includes("pain")), [investorRequests]);

  const filteredMembers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return members.filter((member) => {
      if (stateFilter !== "all") {
        if (stateFilter === "notListed" && member.baseState !== "Not listed") return false;
        if (stateFilter !== "notListed" && member.baseState !== stateFilter) return false;
      }
      if (q && !memberSearchText(member).includes(q)) return false;
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
      const pay = patch.paymentStatus || member.paymentStatus;
      const status = patch.status || member.status;
      const paidLike = pay === "paid" || pay === "comped" || pay === "trial";
      const nextAccess: "active" | "locked" = status === "approved" && paidLike ? "active" : "locked";
      return { ...member, ...patch, access: nextAccess, updatedAt: new Date().toISOString() };
    });
    saveMembers(next);
  }

  function deleteMemberForever(id: string) {
    saveMembers(members.filter((member) => member.id !== id));
  }

  function patchInvestor(id: string, patch: Partial<InvestorRecord>) {
    let updatedInvestor: InvestorRecord | undefined;
    const next = investors.map((investor) => {
      if (investor.id !== id) return investor;
      updatedInvestor = recalcInvestorAccess({ ...investor, ...patch, updatedAt: new Date().toISOString() });
      return updatedInvestor;
    });
    setInvestors(next);
    saveInvestors(next, updatedInvestor);
  }

  function deleteInvestorForever(id: string) {
    const next = investors.filter((investor) => investor.id !== id);
    setInvestors(next);
    saveInvestors(next);
  }

  function runSearch(event?: React.FormEvent) {
    if (event) event.preventDefault();
    const next = searchDraft.trim();
    setSearch(next);
    if (next) {
      setFilter("all");
      setStateFilter("all");
      setTab("members");
    }
  }

  function broadcastToMembers(target: "filtered" | "all") {
    const recipients = target === "filtered" ? filteredMembers.filter((member) => member.status !== "deleted") : visibleMembers;
    const success = saveBroadcastMessage(recipients, broadcastSubject, broadcastBody);
    if (!success) {
      setBroadcastNotice("Add a message and make sure there is at least one member selected.");
      return;
    }
    setBroadcastNotice(`Message saved for ${recipients.length} member(s).`);
    setBroadcastSubject("");
    setBroadcastBody("");
    setMessages(readMessages());
  }

  function openRoomSelection(title: string, rooms: RoomRecord[], key: string) {
    setActiveRoomCard(key);
    setRoomSelection({ title, rooms });
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
          0% { box-shadow: 0 0 0 rgba(255,220,104,.00); transform: scale(1); }
          50% { box-shadow: 0 0 34px rgba(255,220,104,.24); transform: scale(1.005); }
          100% { box-shadow: 0 0 0 rgba(255,220,104,.00); transform: scale(1); }
        }
        .vf-pulse { animation: vfPulse 1.7s ease-in-out infinite; }
      `}</style>

      <MemberModal member={selectedMember} onClose={() => setSelectedMember(null)} />
      <RoomModal selection={roomSelection} onClose={() => setRoomSelection(null)} />

      <div style={wrap}>
        <AdminNav />

        <section style={hero}>
          <AdminLogoBlock />
          <div style={eyebrow}>VaultForge Admin Command</div>
          <h1 style={h1}>Control tower restored.</h1>
          <p style={sub}>Manage members, investor approvals, Deal/Pain rooms, investor requests, state balance, cleanup folders, and admin broadcasts.</p>
        </section>

        <section style={{ marginBottom: 18 }}>
          <div style={grid}>
            <Metric title="New Members" count={newMembers.length} note="new/pending applications" pulse={newMembers.length > 0} onClick={() => { setFilter("new"); setTab("members"); }} />
            <Metric title="Approved Not Paid" count={approvedUnpaid.length} note="payment approved but unpaid" pulse={approvedUnpaid.length > 0} onClick={() => { setFilter("approvedUnpaid"); setTab("members"); }} />
            <Metric title="New Investors" count={newInvestors.length} note="pending investor approvals" pulse={newInvestors.length > 0} onClick={() => setTab("investors")} />
            <Metric title="Investor Payments" count={pendingInvestorPayment.length} note="investor payment unlocked but unpaid" pulse={pendingInvestorPayment.length > 0} onClick={() => setTab("investors")} />
            <Metric title="Deal Requests" count={dealRequests.length} note="investor deal interest" pulse={dealRequests.length > 0} onClick={() => setTab("dealRequests")} />
            <Metric title="Pain Requests" count={painRequests.length} note="investor pain interest" pulse={painRequests.length > 0} onClick={() => setTab("painRequests")} />
            <Metric title="Paid Members" count={paid.length} note="paid members" onClick={() => { setFilter("paid"); setTab("members"); }} />
            <Metric title="Paid Investors" count={paidInvestors.length} note="active investor access" onClick={() => setTab("investors")} />
          </div>
        </section>

        <Section title="Admin Queues">
          <div style={row}>
            {[
              ["overview", "Overview"],
              ["members", "Members"],
              ["investors", "Investors"],
              ["dealRequests", "Deal Requests"],
              ["painRequests", "Pain Requests"],
              ["rooms", "Rooms"],
              ["saved", "Saved"],
              ["archived", "Archived"],
              ["deleted", "Deleted"],
            ].map(([key, label]) => (
              <button key={key} type="button" style={tab === key ? goldBtn : btn} onClick={() => setTab(key as QueueTab)}>
                {label}
              </button>
            ))}
          </div>
        </Section>

        {tab === "overview" ? (
          <>
            <Section title="Investor Intelligence Lane">
              <div style={grid}>
                <div style={activePanel}>
                  <div style={eyebrow}>Separate Buyer-Intelligence Network</div>
                  <h3 style={h3}>Investor Access stays separate.</h3>
                  <p style={muted}>Investors see teaser Deal/Pain cards only. They do not see member directory, private routing, seller data, or full rooms.</p>
                </div>
                <div style={panel}>
                  <div style={eyebrow}>Investor Profile Depth</div>
                  <h3 style={h3}>Better profiles create better routing.</h3>
                  <p style={muted}>Buy box, markets, volume, strategy, close speed, proof of funds, and asset class drive investor matching.</p>
                </div>
                <div style={panel}>
                  <div style={eyebrow}>One Stop Shop</div>
                  <h3 style={h3}>Funding and execution stay inside members.</h3>
                  <p style={muted}>Investors request info. Members/admin approve deeper access and can connect them to lenders, title, contractors, and operators through the private network.</p>
                </div>
              </div>
            </Section>

            <Section title="Room Snapshot">
              <div style={grid}>
                {(["active", "saved", "archived", "deleted", "sold"] as RoomView[]).map((view) => (
                  <RoomCard key={`deal-${view}`} title={`Deal ${view}`} count={deals.filter((room) => inRoomView(room, view)).length} onClick={() => openRoomSelection(`Deal ${view}`, deals.filter((room) => inRoomView(room, view)), `deal-${view}`)} />
                ))}
                {(["active", "saved", "archived", "deleted", "resolved"] as RoomView[]).map((view) => (
                  <RoomCard key={`pain-${view}`} title={`Pain ${view}`} count={pains.filter((room) => inRoomView(room, view)).length} onClick={() => openRoomSelection(`Pain ${view}`, pains.filter((room) => inRoomView(room, view)), `pain-${view}`)} />
                ))}
              </div>
            </Section>
          </>
        ) : null}

        {tab === "members" ? (
          <>
            <CollapseBar label="Members Control" onCollapse={() => setTab("overview")} />
            <Section title="Search / Filter Members">
              <form onSubmit={runSearch} style={{ display: "grid", gap: 14 }}>
                <input style={input} value={searchDraft} onChange={(event) => setSearchDraft(event.target.value)} placeholder="Search name, company, email, phone, type, home state..." />
                <div style={row}>
                  <button type="submit" style={goldBtn}>Submit Search</button>
                  <button type="button" style={btn} onClick={() => { setSearchDraft(""); setSearch(""); setFilter("all"); setStateFilter("all"); }}>Reset</button>
                </div>
                <p style={muted}>Current search: {search || "none"} • Results: {filteredMembers.length}</p>
              </form>
              <div style={{ ...grid, marginTop: 14 }}>
                <Metric title="All" count={visibleMembers.length} note="visible members" active={filter === "all"} onClick={() => setFilter("all")} />
                <Metric title="Pending" count={pending.length} note="not reviewed" active={filter === "pending"} onClick={() => setFilter("pending")} />
                <Metric title="Approved Not Paid" count={approvedUnpaid.length} note="needs payment" active={filter === "approvedUnpaid"} pulse={approvedUnpaid.length > 0} onClick={() => setFilter("approvedUnpaid")} />
                <Metric title="Paid" count={paid.length} note="paid" active={filter === "paid"} onClick={() => setFilter("paid")} />
                <Metric title="Comped" count={comped.length} note="free access" active={filter === "comped"} onClick={() => setFilter("comped")} />
                <Metric title="Deleted" count={deleted.length} note="cleanup" active={filter === "deleted"} onClick={() => setFilter("deleted")} />
              </div>
            </Section>

            <Section title="Member Home State Balance">
              <div style={grid}>
                <StateCard state="all" label="All" count={visibleMembers.length} active={stateFilter === "all"} onClick={() => setStateFilter("all")} />
                {STATE_CODES.map((state) => <StateCard key={state} state={state} label={state} count={stateMemberCount(members, state)} active={stateFilter === state} onClick={() => setStateFilter(state)} />)}
                <StateCard state="notListed" label="Not Listed" count={stateMemberCount(members, "notListed")} active={stateFilter === "notListed"} onClick={() => setStateFilter("notListed")} />
              </div>
            </Section>


            <Section title="Member Cleanup Folders">
              <div style={grid}>
                <Metric title="Active Members" count={activeMembers.length} note="approved and active" />
                <Metric title="Archived / Suspended" count={archivedMembers.length} note="suspended or denied members" />
                <Metric title="Deleted Members" count={deleted.length} note="deleted member cleanup folder" pulse={deleted.length > 0} onClick={() => setFilter("deleted")} />
              </div>
              <div style={{ ...panel, marginTop: 14 }}>
                <div style={eyebrow}>Delete / Delete Forever</div>
                <p style={muted}>Delete Member moves the member into the deleted cleanup folder. Open Deleted filter to use Delete Forever. Owner/admin cannot be deleted.</p>
              </div>
            </Section>

            <Section title="Filtered Member Results">
              {filteredMembers.length ? (
                <div style={grid}>
                  {filteredMembers.map((member) => (
                    <MemberCard key={member.id} member={member} onOpen={() => setSelectedMember(member)} onPatch={(patch) => patchMember(member.id, patch)} onDeleteForever={() => deleteMemberForever(member.id)} />
                  ))}
                </div>
              ) : (
                <div style={panel}><h2 style={h2}>No matching members.</h2><p style={sub}>Try another name, company, email, phone, member type, home state, or reset filters.</p></div>
              )}
            </Section>

            <Section title="Admin Message Center">
              <p style={muted}>Send to all members or only the currently filtered member results.</p>
              <div style={{ display: "grid", gap: 14, marginTop: 14 }}>
                <input style={input} value={broadcastSubject} onChange={(event) => setBroadcastSubject(event.target.value)} placeholder="Subject..." />
                <textarea style={{ ...input, minHeight: 130 }} value={broadcastBody} onChange={(event) => setBroadcastBody(event.target.value)} placeholder="Write admin message..." />
                <div style={row}>
                  <button type="button" style={goldBtn} onClick={() => broadcastToMembers("filtered")}>Message Filtered Members</button>
                  <button type="button" style={btn} onClick={() => broadcastToMembers("all")}>Message All Members</button>
                </div>
                {broadcastNotice ? <p style={sub}>{broadcastNotice}</p> : null}
              </div>
            </Section>
          </>
        ) : null}

        {tab === "investors" ? (
          <>
            <CollapseBar label="Investor Control" onCollapse={() => setTab("overview")} />
          <Section title="Investor Access Command">
            <div style={grid}>
              <Metric title="New Investors" count={newInvestors.length} note="waiting approval" pulse={newInvestors.length > 0} />
              <Metric title="Approved Investors" count={approvedInvestors.length} note="approved investor accounts" />
              <Metric title="Pending Investor Payment" count={pendingInvestorPayment.length} note="payment unlocked but unpaid" pulse={pendingInvestorPayment.length > 0} />
              <Metric title="Paid Investors" count={paidInvestors.length} note="active investor access" />
              <Metric title="Blocked Investors" count={blockedInvestors.length} note="denied/suspended" />
              <Metric title="Deleted Investors" count={deletedInvestors.length} note="cleanup folder" />
            </div>
            <div style={{ ...panel, marginTop: 18 }}>
              <div style={eyebrow}>Investor Access Structure</div>
              <p style={muted}>$49 first month then $149/month. Separate investor login/application flow. Teaser Deal/Pain cards only. No direct member info exposed.</p>
            </div>
            <div style={{ marginTop: 18 }}>
              {investors.length ? (
                <div style={grid}>
                  {investors.map((investor) => (
                    <InvestorCard key={investor.id} investor={investor} onPatch={(patch) => patchInvestor(investor.id, patch)} onDeleteForever={() => deleteInvestorForever(investor.id)} />
                  ))}
                </div>
              ) : (
                <div style={panel}><h2 style={h2}>No investor applications yet.</h2><p style={sub}>Investor applications appear after /investor-application.</p></div>
              )}
            </div>
          </Section>
          </>
        ) : null}

        {tab === "dealRequests" ? (
          <>
            <CollapseBar label="Deal Requests" onCollapse={() => setTab("overview")} />
          <Section title="Investor Deal Requests">
            {dealRequests.length ? <div style={grid}>{dealRequests.map((request) => <InvestorRequestCard key={request.id} request={request} />)}</div> : <div style={panel}><h2 style={h2}>No deal requests yet.</h2></div>}
          </Section>
          </>
        ) : null}

        {tab === "painRequests" ? (
          <>
            <CollapseBar label="Pain Requests" onCollapse={() => setTab("overview")} />
          <Section title="Investor Pain Requests">
            {painRequests.length ? <div style={grid}>{painRequests.map((request) => <InvestorRequestCard key={request.id} request={request} />)}</div> : <div style={panel}><h2 style={h2}>No pain requests yet.</h2></div>}
          </Section>
          </>
        ) : null}

        {tab === "rooms" ? (
          <>
            <CollapseBar label="Deal / Pain Rooms" onCollapse={() => setTab("overview")} />
            <Section title="Deal Room Folders">
              <div style={grid}>
                {(["active", "saved", "archived", "deleted", "sold"] as RoomView[]).map((view) => {
                  const matching = deals.filter((room) => inRoomView(room, view));
                  const key = `deal-${view}`;
                  return <RoomCard key={key} title={`Deal ${view}`} count={matching.length} active={activeRoomCard === key} pulse={activeRoomCard === key} onClick={() => openRoomSelection(`Deal ${view}`, matching, key)} />;
                })}
              </div>
            </Section>
            <Section title="Pain Room Folders">
              <div style={grid}>
                {(["active", "saved", "archived", "deleted", "resolved"] as RoomView[]).map((view) => {
                  const matching = pains.filter((room) => inRoomView(room, view));
                  const key = `pain-${view}`;
                  return <RoomCard key={key} title={`Pain ${view}`} count={matching.length} active={activeRoomCard === key} pulse={activeRoomCard === key} onClick={() => openRoomSelection(`Pain ${view}`, matching, key)} />;
                })}
              </div>
            </Section>
            <Section title="Deal Rooms By State">
              <div style={smallGrid}>
                {STATE_CODES.map((state) => {
                  const matching = deals.filter((room) => room.state === state);
                  return <RoomCard key={`deal-state-${state}`} title={state} count={stateRoomCount(deals, state)} onClick={() => openRoomSelection(`Deal Rooms • ${state}`, matching, `deal-state-${state}`)} />;
                })}
              </div>
            </Section>
            <Section title="Pain Rooms By State">
              <div style={smallGrid}>
                {STATE_CODES.map((state) => {
                  const matching = pains.filter((room) => room.state === state);
                  return <RoomCard key={`pain-state-${state}`} title={state} count={stateRoomCount(pains, state)} onClick={() => openRoomSelection(`Pain Rooms • ${state}`, matching, `pain-state-${state}`)} />;
                })}
              </div>
            </Section>
          </>
        ) : null}

        {tab === "saved" ? (
          <>
            <CollapseBar label="Saved Queue" onCollapse={() => setTab("overview")} />
            <Section title="Saved Queue"><div style={panel}><h2 style={h2}>Saved admin cleanup queue.</h2><p style={sub}>Saved investors, requests, and rooms will be wired to persistent cleanup later.</p></div></Section>
          </>
        ) : null}
        {tab === "archived" ? (
          <>
            <CollapseBar label="Archived Queue" onCollapse={() => setTab("overview")} />
            <Section title="Archived Queue"><div style={panel}><h2 style={h2}>Archived admin queue.</h2><p style={sub}>Archived investors, requests, and rooms will be wired to persistent cleanup later.</p></div></Section>
          </>
        ) : null}
        {tab === "deleted" ? (
          <>
            <CollapseBar label="Deleted Queue" onCollapse={() => setTab("overview")} />
            <Section title="Deleted Queue"><div style={alertPanel}><h2 style={h2}>Delete forever control layer.</h2><p style={sub}>Admin-only destructive cleanup queue.</p></div></Section>
          </>
        ) : null}
      </div>
    </main>
  );
}
