"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Status = "pending" | "approved" | "suspended" | "denied" | "deleted";
type PaymentStatus = "unpaid" | "ready" | "paid" | "comped";
type AccessStatus = "locked" | "active";

type MemberCard = {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  memberType: string;
  baseState: string;
  operatingStates: string;
  status: Status;
  paymentStatus: PaymentStatus;
  approvedForPayment: boolean;
  access: AccessStatus;
  updatedAt: string;
  raw?: any;
};

type InvestorCard = {
  id: string;
  contactName: string;
  company: string;
  email: string;
  phone: string;
  statesInterested: string;
  assetTypes: string;
  status: Status;
  paymentStatus: PaymentStatus;
  approvedForPayment: boolean;
  access: AccessStatus;
  updatedAt: string;
  raw?: any;
};

const OWNER_EMAIL = "bcrsoutheast@gmail.com";

const ADMIN_MEMBERS_KEY = "vaultforge_admin_members_v1";
const INVESTOR_LIST_KEY = "vaultforge_investor_admin_list_v1";
const INVESTOR_APP_KEY = "vaultforge_investor_application_v1";
const PROFILE_KEYS = ["vaultforge_profile", "vaultforge_member_profile", "vaultforge_clean_profile"];
const MEMBER_LOGIN_KEY = "vaultforge_member_login_v1";
const MOCK_ACCESS_KEY = "vaultforge_mock_access_approvals_v1";
const ADMIN_QUEUE_KEY = "vaultforge_admin_profile_approval_queue_v1";
const HARD_DELETED_MEMBERS_KEY = "vaultforge_admin_deleted_member_ids_v1";
const HARD_DELETED_INVESTORS_KEY = "vaultforge_admin_deleted_investor_ids_v1";

const page: React.CSSProperties = { minHeight: "100vh", background: "#05070d", color: "#f7f7fb", padding: 18, fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" };
const wrap: React.CSSProperties = { maxWidth: 1320, margin: "0 auto", paddingBottom: 100 };
const shell: React.CSSProperties = { border: "1px solid rgba(207,216,230,.16)", borderRadius: 24, padding: 20, background: "#0b101b", marginBottom: 18 };
const hero: React.CSSProperties = { border: "1px solid rgba(245,197,66,.30)", borderRadius: 28, padding: 28, marginBottom: 18, background: "radial-gradient(circle at top right, rgba(245,197,66,.15), transparent 35%), linear-gradient(180deg,#10131a,#070b14)" };
const panel: React.CSSProperties = { background: "#121724", border: "1px solid rgba(207,216,230,.16)", borderRadius: 22, padding: 20 };
const goldPanel: React.CSSProperties = { ...panel, borderColor: "rgba(255,220,104,.85)", boxShadow: "0 0 32px rgba(255,220,104,.25)" };
const redPanel: React.CSSProperties = { ...panel, borderColor: "rgba(255,70,70,.55)", boxShadow: "0 0 22px rgba(255,70,70,.12)" };
const grid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 16 };
const row: React.CSSProperties = { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" };
const eyebrow: React.CSSProperties = { color: "#ffd45a", textTransform: "uppercase", letterSpacing: 6, fontSize: 13, fontWeight: 950, marginBottom: 10 };
const h1: React.CSSProperties = { fontSize: "clamp(42px,7vw,78px)", lineHeight: .9, letterSpacing: -4, margin: "0 0 16px", fontWeight: 950 };
const h2: React.CSSProperties = { fontSize: "clamp(28px,5vw,48px)", lineHeight: .95, letterSpacing: -2, margin: "0 0 10px", fontWeight: 950 };
const h3: React.CSSProperties = { fontSize: 24, margin: "0 0 8px", fontWeight: 950 };
const sub: React.CSSProperties = { color: "#c9d0dc", fontSize: 20, lineHeight: 1.35, margin: 0 };
const muted: React.CSSProperties = { color: "#aeb7c7", lineHeight: 1.35, margin: "7px 0 0" };
const btn: React.CSSProperties = { border: "1px solid rgba(207,216,230,.18)", background: "#171c29", color: "#f7f7fb", borderRadius: 999, padding: "12px 16px", fontWeight: 950, textDecoration: "none", display: "inline-block", cursor: "pointer" };
const goldBtn: React.CSSProperties = { ...btn, border: 0, background: "#ffdc68", color: "#10131a" };
const redBtn: React.CSSProperties = { ...btn, background: "#271016", borderColor: "rgba(255,70,70,.55)", color: "#ffb3b3" };
const greenBtn: React.CSSProperties = { ...btn, background: "#062716", borderColor: "rgba(48,255,135,.46)", color: "#9fffc1" };
const input: React.CSSProperties = { width: "100%", boxSizing: "border-box", border: "1px solid rgba(207,216,230,.18)", background: "#111823", color: "#f8fafc", borderRadius: 16, padding: "13px 14px", fontSize: 16 };

function ok() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function clean(value: unknown, fallback = "") {
  const text = String(value || "").trim();
  return text && text !== "undefined" && text !== "null" ? text : fallback;
}

function lower(value: unknown) {
  return clean(value).toLowerCase();
}

function listText(value: unknown, fallback = "Not listed") {
  if (Array.isArray(value)) return value.map((item) => clean(item)).filter(Boolean).join(" • ") || fallback;
  return clean(value, fallback);
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

function readDeletedSet(key: string) {
  return new Set(readJson<string[]>(key, []));
}

function writeDeletedSet(key: string, set: Set<string>) {
  writeJson(key, Array.from(set));
}

function markHardDeleted(key: string, id: string) {
  const set = readDeletedSet(key);
  set.add(id);
  writeDeletedSet(key, set);
}

function currentEmail() {
  if (!ok()) return "";
  return lower(localStorage.getItem("vf_email") || localStorage.getItem("member_email") || localStorage.getItem("email") || localStorage.getItem("vaultforge_investor_email"));
}

function statusFrom(row: any): Status {
  const value = lower(row?.status || row?.memberStatus || row?.member_status || row?.accessStatus || row?.access_status);
  if (value.includes("approved") || value === "active") return "approved";
  if (value.includes("suspend")) return "suspended";
  if (value.includes("denied") || value.includes("reject")) return "denied";
  if (value.includes("deleted") || value.includes("removed")) return "deleted";
  return "pending";
}

function paymentFrom(row: any): PaymentStatus {
  const value = lower(row?.paymentStatus || row?.payment_status || row?.billingStatus || row?.billing_status);
  if (value === "paid") return "paid";
  if (value === "comped" || value === "free" || value === "free_access") return "comped";
  if (value === "ready" || value === "payment_ready") return "ready";
  return "unpaid";
}

function safeId(value: string, fallback: string) {
  return clean(value || fallback).toLowerCase().replace(/[^a-z0-9@._-]+/g, "-");
}

function normalizeMember(row: any): MemberCard {
  const email = lower(row?.email || row?.memberEmail || row?.member_email);
  const status = statusFrom(row);
  const pay = paymentFrom(row);
  const approvedForPayment = Boolean(row?.approvedForPayment || row?.approved_for_payment || row?.paymentApproved || row?.payment_approved || pay === "ready");
  const paidLike = pay === "paid" || pay === "comped";
  return {
    id: safeId(row?.id || row?.auth_user_id || email, `member-${Date.now()}`),
    name: clean(row?.name || row?.fullName || row?.full_name || row?.contactName, email ? email.split("@")[0] : "Member"),
    company: clean(row?.company || row?.companyName || row?.company_name, "Company not listed"),
    email: email || "email-not-listed",
    phone: clean(row?.phone || row?.phoneNumber || row?.phone_number, "Phone not listed"),
    memberType: clean(row?.memberType || row?.member_type || row?.type, "Investor"),
    baseState: clean(row?.baseState || row?.basedState || row?.state || row?.homeState, "Not listed"),
    operatingStates: listText(row?.operatingStates || row?.statesOperated || row?.states_served || row?.states || ["GA"]),
    status,
    paymentStatus: pay,
    approvedForPayment,
    access: row?.access === "active" || row?.accessStatus === "active" || (status === "approved" && paidLike) ? "active" : "locked",
    updatedAt: clean(row?.updatedAt || row?.updated_at, new Date().toISOString()),
    raw: row,
  };
}

function normalizeInvestor(row: any): InvestorCard {
  const email = lower(row?.email || row?.investorEmail || row?.investor_email);
  const status = statusFrom(row);
  const pay = paymentFrom(row);
  const approvedForPayment = Boolean(row?.approvedForPayment || row?.approved_for_payment || row?.paymentApproved || row?.payment_approved || pay === "ready");
  const paidLike = pay === "paid" || pay === "comped";
  return {
    id: safeId(row?.id || row?.investorId || row?.investor_id || email, `investor-${Date.now()}`),
    contactName: clean(row?.contactName || row?.contact_name || row?.name || row?.fullName, email ? email.split("@")[0] : "Investor"),
    company: clean(row?.company || row?.companyName || row?.businessName, "Company not listed"),
    email: email || "email-not-listed",
    phone: clean(row?.phone || row?.phoneNumber || row?.mobile, "Phone not listed"),
    statesInterested: listText(row?.statesInterested || row?.states_interested || row?.states || row?.markets, "GA"),
    assetTypes: listText(row?.assetTypes || row?.asset_types || row?.assetClass || row?.investorTypes, "Asset types not listed"),
    status,
    paymentStatus: pay,
    approvedForPayment,
    access: row?.access === "active" || row?.accessStatus === "active" || (status === "approved" && paidLike) ? "active" : "locked",
    updatedAt: clean(row?.updatedAt || row?.updated_at, new Date().toISOString()),
    raw: row,
  };
}

function readMembers(): MemberCard[] {
  const hardDeleted = readDeletedSet(HARD_DELETED_MEMBERS_KEY);
  const map = new Map<string, MemberCard>();

  // Profile/login are raw submissions. Saved admin list is read LAST so admin actions win.
  for (const key of PROFILE_KEYS) {
    const row = readJson<any>(key, null);
    if (row && typeof row === "object" && !Array.isArray(row)) {
      const member = normalizeMember(row);
      const mapKey = member.email !== "email-not-listed" ? member.email : member.id;
      const existing = map.get(mapKey);
      map.set(mapKey, { ...(existing || member), ...member, id: existing?.id || member.id });
    }
  }

  const login = readJson<any>(MEMBER_LOGIN_KEY, null);
  if (login && typeof login === "object" && !Array.isArray(login)) {
    const member = normalizeMember(login);
    const mapKey = member.email !== "email-not-listed" ? member.email : member.id;
    const existing = map.get(mapKey);
    map.set(mapKey, { ...(existing || member), ...member, id: existing?.id || member.id });
  }

  const stored = readJson<any[]>(ADMIN_MEMBERS_KEY, []);
  if (Array.isArray(stored)) stored.forEach((row) => {
    const member = normalizeMember(row);
    const mapKey = member.email !== "email-not-listed" ? member.email : member.id;
    const existing = map.get(mapKey);
    map.set(mapKey, { ...(existing || member), ...member, id: existing?.id || member.id });
  });

  const owner = normalizeMember({
    id: "owner-admin",
    email: OWNER_EMAIL,
    name: "Dmoney",
    company: "VaultForge",
    phone: "Owner",
    memberType: "Owner / Admin",
    state: "GA",
    operatingStates: ["GA", "TN", "AL", "FL", "NC", "SC", "TX"],
    status: "approved",
    paymentStatus: "comped",
    approvedForPayment: true,
    accessStatus: "active",
  });
  map.set(OWNER_EMAIL, { ...map.get(OWNER_EMAIL), ...owner });

  return Array.from(map.values())
    .filter((member) => !hardDeleted.has(member.id))
    .sort((a, b) => {
      const order: Record<Status, number> = { pending: 0, approved: 1, suspended: 2, denied: 3, deleted: 4 };
      return order[a.status] - order[b.status] || a.name.localeCompare(b.name);
    });
}

function readInvestors(): InvestorCard[] {
  const hardDeleted = readDeletedSet(HARD_DELETED_INVESTORS_KEY);
  const map = new Map<string, InvestorCard>();

  // Raw investor submission first. Saved admin list is read LAST so admin actions win.
  const single = readJson<any>(INVESTOR_APP_KEY, null);
  if (single && typeof single === "object" && !Array.isArray(single) && (single.email || single.company || single.contactName || single.name)) {
    const investor = normalizeInvestor(single);
    const mapKey = investor.email !== "email-not-listed" ? investor.email : investor.id;
    const existing = map.get(mapKey);
    map.set(mapKey, { ...(existing || investor), ...investor, id: existing?.id || investor.id });
  }

  const queue = readJson<any[]>(ADMIN_QUEUE_KEY, []);
  if (Array.isArray(queue)) {
    queue.filter((item) => lower(item?.type) === "investor").forEach((item) => {
      const investor = normalizeInvestor({ ...(item?.profile || {}), ...item });
      const mapKey = investor.email !== "email-not-listed" ? investor.email : investor.id;
      const existing = map.get(mapKey);
      map.set(mapKey, { ...(existing || investor), ...investor, id: existing?.id || investor.id });
    });
  }

  const stored = readJson<any[]>(INVESTOR_LIST_KEY, []);
  if (Array.isArray(stored)) stored.forEach((row) => {
    const investor = normalizeInvestor(row);
    const mapKey = investor.email !== "email-not-listed" ? investor.email : investor.id;
    const existing = map.get(mapKey);
    map.set(mapKey, { ...(existing || investor), ...investor, id: existing?.id || investor.id });
  });

  return Array.from(map.values())
    .filter((investor) => !hardDeleted.has(investor.id))
    .sort((a, b) => {
      const order: Record<Status, number> = { pending: 0, approved: 1, suspended: 2, denied: 3, deleted: 4 };
      return order[a.status] - order[b.status] || a.company.localeCompare(b.company);
    });
}

function saveMembers(rows: MemberCard[]) {
  writeJson(ADMIN_MEMBERS_KEY, rows);
  window.dispatchEvent(new Event("vaultforge-admin-members-change"));
  window.dispatchEvent(new Event("vaultforge-admin-action-change"));
}

function saveInvestors(rows: InvestorCard[]) {
  writeJson(INVESTOR_LIST_KEY, rows);
  const email = currentEmail();
  const current = readJson<any>(INVESTOR_APP_KEY, {});
  const match = rows.find((investor) => investor.email === lower(current?.email || current?.investorEmail)) || rows.find((investor) => investor.email === email);
  if (match) writeJson(INVESTOR_APP_KEY, { ...current, ...match });
  window.dispatchEvent(new Event("vaultforge-investor-change"));
  window.dispatchEvent(new Event("vaultforge-admin-investor-change"));
  window.dispatchEvent(new Event("vaultforge-admin-action-change"));
}

function writeMockAccess(email: string, kind: "member" | "investor", patch: any) {
  const cleanEmail = lower(email);
  if (!cleanEmail || cleanEmail === "email-not-listed") return;
  const key = `${kind}:${cleanEmail}`;
  const current = readJson<Record<string, any>>(MOCK_ACCESS_KEY, {});
  current[key] = { ...(current[key] || {}), email: cleanEmail, kind, ...patch, updatedAt: new Date().toISOString() };
  writeJson(MOCK_ACCESS_KEY, current);
  window.dispatchEvent(new Event("vaultforge-mock-access-change"));
}

function syncMemberToProfileKeys(member: MemberCard) {
  const statusPatch = {
    status: member.status,
    memberStatus: member.status,
    accessStatus: member.access,
    paymentStatus: member.paymentStatus,
    approvedForPayment: member.approvedForPayment,
    paymentApproved: member.approvedForPayment,
    updatedAt: member.updatedAt,
  };

  for (const key of PROFILE_KEYS) {
    const current = readJson<any>(key, null);
    if (current && typeof current === "object" && !Array.isArray(current)) {
      const currentEmail = lower(current?.email || current?.memberEmail || current?.member_email);
      if (!currentEmail || currentEmail === member.email) {
        writeJson(key, { ...current, ...statusPatch });
      }
    }
  }

  const login = readJson<any>(MEMBER_LOGIN_KEY, null);
  if (login && typeof login === "object" && !Array.isArray(login)) {
    const loginEmail = lower(login?.email || login?.memberEmail || login?.member_email);
    if (!loginEmail || loginEmail === member.email) {
      writeJson(MEMBER_LOGIN_KEY, { ...login, ...statusPatch });
    }
  }
}

function syncInvestorToApplication(investor: InvestorCard) {
  const current = readJson<any>(INVESTOR_APP_KEY, {});
  const currentEmail = lower(current?.email || current?.investorEmail || current?.investor_email);

  if (!currentEmail || currentEmail === investor.email) {
    writeJson(INVESTOR_APP_KEY, {
      ...current,
      ...investor,
      name: investor.contactName,
      contactName: investor.contactName,
      company: investor.company,
      email: investor.email,
      status: investor.status,
      accessStatus: investor.access,
      paymentStatus: investor.paymentStatus,
      approvedForPayment: investor.approvedForPayment,
      paymentApproved: investor.approvedForPayment,
      updatedAt: investor.updatedAt,
    });
  }
}

function Metric({ title, count, note, active, onClick }: { title: string; count: number; note: string; active?: boolean; onClick?: () => void }) {
  return (
    <button type="button" onClick={onClick} style={{ ...(active ? goldPanel : panel), textAlign: "left", cursor: "pointer", width: "100%" }}>
      <div style={eyebrow}>{title}</div>
      <h2 style={{ ...h2, color: "#1688ff" }}>{count}</h2>
      <p style={muted}>{note}</p>
    </button>
  );
}

function Pill({ text }: { text: string }) {
  return <span style={{ border: "1px solid rgba(245,197,66,.28)", borderRadius: 999, padding: "7px 10px", color: "#ffd45a", fontWeight: 950, fontSize: 12 }}>{text}</span>;
}

export default function AdminPage() {
  const [members, setMembers] = useState<MemberCard[]>([]);
  const [investors, setInvestors] = useState<InvestorCard[]>([]);
  const [tab, setTab] = useState<"overview" | "members" | "investors">("overview");
  const [memberFilter, setMemberFilter] = useState<"all" | "pending" | "approved" | "deleted">("all");
  const [investorFilter, setInvestorFilter] = useState<"all" | "pending" | "approved" | "deleted">("all");
  const [notice, setNotice] = useState("");

  function refresh() {
    setMembers(readMembers());
    setInvestors(readInvestors());
  }

  useEffect(() => {
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener("vaultforge-admin-action-change", refresh);
    window.addEventListener("vaultforge-admin-members-change", refresh);
    window.addEventListener("vaultforge-admin-investor-change", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("vaultforge-admin-action-change", refresh);
      window.removeEventListener("vaultforge-admin-members-change", refresh);
      window.removeEventListener("vaultforge-admin-investor-change", refresh);
    };
  }, []);

  const visibleMembers = members.filter((item) => item.status !== "deleted");
  const visibleInvestors = investors.filter((item) => item.status !== "deleted");
  const pendingMembers = members.filter((item) => item.status === "pending");
  const activeMembers = members.filter((item) => item.status === "approved" && item.access === "active");
  const deletedMembers = members.filter((item) => item.status === "deleted");
  const paymentReadyMembers = members.filter((item) => item.status === "approved" && item.approvedForPayment && item.paymentStatus !== "paid" && item.paymentStatus !== "comped");

  const pendingInvestors = investors.filter((item) => item.status === "pending");
  const paidInvestors = investors.filter((item) => item.status === "approved" && item.access === "active");
  const deletedInvestors = investors.filter((item) => item.status === "deleted");
  const paymentReadyInvestors = investors.filter((item) => item.status === "approved" && item.approvedForPayment && item.paymentStatus !== "paid" && item.paymentStatus !== "comped");

  const filteredMembers = useMemo(() => {
    if (memberFilter === "all") return visibleMembers;
    return members.filter((member) => member.status === memberFilter);
  }, [members, memberFilter]);

  const filteredInvestors = useMemo(() => {
    if (investorFilter === "all") return visibleInvestors;
    return investors.filter((investor) => investor.status === investorFilter);
  }, [investors, investorFilter]);

  function patchMember(id: string, patch: Partial<MemberCard>) {
    const now = new Date().toISOString();
    const next = members.map((member) => {
      if (member.id !== id) return member;
      const merged = { ...member, ...patch, updatedAt: now };
      const paidLike = merged.paymentStatus === "paid" || merged.paymentStatus === "comped";
      merged.access = merged.status === "approved" && paidLike ? "active" : "locked";
      if (patch.access) merged.access = patch.access;
      return merged;
    });
    setMembers(next);
    saveMembers(next);

    const updated = next.find((member) => member.id === id);
    if (updated) {
      syncMemberToProfileKeys(updated);
      writeMockAccess(updated.email, "member", {
        approved: updated.status === "approved",
        adminApproved: updated.status === "approved",
        approvedForPayment: updated.approvedForPayment,
        paymentStatus: updated.paymentStatus === "unpaid" && updated.approvedForPayment ? "ready" : updated.paymentStatus,
        accessStatus: updated.access,
        paid: updated.paymentStatus === "paid" || updated.paymentStatus === "comped",
        unlocked: updated.access === "active",
      });
    }

    if (patch.status === "deleted") {
      setMemberFilter("deleted");
      setNotice("Member moved to Deleted Members. Use Delete Forever there.");
    } else {
      setNotice("Member updated.");
    }
  }

  function patchInvestor(id: string, patch: Partial<InvestorCard>) {
    const now = new Date().toISOString();
    const next = investors.map((investor) => {
      if (investor.id !== id) return investor;
      const merged = { ...investor, ...patch, updatedAt: now };
      const paidLike = merged.paymentStatus === "paid" || merged.paymentStatus === "comped";
      merged.access = merged.status === "approved" && paidLike ? "active" : "locked";
      if (patch.access) merged.access = patch.access;
      return merged;
    });
    setInvestors(next);
    saveInvestors(next);

    const updated = next.find((investor) => investor.id === id);
    if (updated) {
      syncInvestorToApplication(updated);
      writeMockAccess(updated.email, "investor", {
        approved: updated.status === "approved",
        adminApproved: updated.status === "approved",
        approvedForPayment: updated.approvedForPayment,
        paymentStatus: updated.paymentStatus === "unpaid" && updated.approvedForPayment ? "ready" : updated.paymentStatus,
        accessStatus: updated.access,
        paid: updated.paymentStatus === "paid" || updated.paymentStatus === "comped",
        unlocked: updated.access === "active",
      });
    }

    if (patch.status === "deleted") {
      setInvestorFilter("deleted");
      setNotice("Investor moved to Deleted Investors. Use Delete Forever there.");
    } else {
      setNotice("Investor updated.");
    }
  }

  function deleteMemberForever(id: string) {
    markHardDeleted(HARD_DELETED_MEMBERS_KEY, id);
    const next = members.filter((member) => member.id !== id);
    setMembers(next);
    saveMembers(next);
    setNotice("Member deleted forever.");
  }

  function deleteInvestorForever(id: string) {
    markHardDeleted(HARD_DELETED_INVESTORS_KEY, id);
    const next = investors.filter((investor) => investor.id !== id);
    setInvestors(next);
    saveInvestors(next);
    setNotice("Investor deleted forever.");
  }

  function clearDeletedMembers() {
    const set = readDeletedSet(HARD_DELETED_MEMBERS_KEY);
    members.filter((member) => member.status === "deleted").forEach((member) => set.add(member.id));
    writeDeletedSet(HARD_DELETED_MEMBERS_KEY, set);
    const next = members.filter((member) => member.status !== "deleted");
    setMembers(next);
    saveMembers(next);
    setNotice("Deleted members cleared.");
  }

  function clearDeletedInvestors() {
    const set = readDeletedSet(HARD_DELETED_INVESTORS_KEY);
    investors.filter((investor) => investor.status === "deleted").forEach((investor) => set.add(investor.id));
    writeDeletedSet(HARD_DELETED_INVESTORS_KEY, set);
    const next = investors.filter((investor) => investor.status !== "deleted");
    setInvestors(next);
    saveInvestors(next);
    setNotice("Deleted investors cleared.");
  }

  function MemberCardView({ member }: { member: MemberCard }) {
    const pulse = member.status === "pending" || (member.status === "approved" && member.approvedForPayment && member.access !== "active");
    return (
      <div className={pulse ? "vf-pulse" : ""} style={member.status === "deleted" ? redPanel : pulse ? goldPanel : panel}>
        <div style={eyebrow}>{member.status} • {member.paymentStatus} • {member.access}</div>
        <h3 style={h3}>{member.name}</h3>
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
          <button type="button" style={greenBtn} onClick={() => patchMember(member.id, { status: "approved" })}>Approve</button>
          <button type="button" style={goldBtn} onClick={() => patchMember(member.id, { status: "approved", approvedForPayment: true, paymentStatus: "ready" })}>Approve Payment Button</button>
          <button type="button" style={greenBtn} onClick={() => patchMember(member.id, { status: "approved", approvedForPayment: true, paymentStatus: "paid", access: "active" })}>Mark Paid</button>
          <button type="button" style={goldBtn} onClick={() => patchMember(member.id, { status: "approved", approvedForPayment: true, paymentStatus: "comped", access: "active" })}>Grant Free Access</button>
          <button type="button" style={btn} onClick={() => patchMember(member.id, { paymentStatus: "unpaid", access: "locked" })}>Mark Unpaid</button>
          <button type="button" style={redBtn} onClick={() => patchMember(member.id, { status: "suspended", access: "locked" })}>Suspend</button>
          <button type="button" style={redBtn} onClick={() => patchMember(member.id, { status: "denied", approvedForPayment: false, access: "locked" })}>Deny</button>
          <button type="button" style={redBtn} onClick={() => patchMember(member.id, { status: "deleted", access: "locked" })}>Delete Member</button>
          {member.status === "deleted" ? <button type="button" style={redBtn} onClick={() => deleteMemberForever(member.id)}>Delete Forever</button> : null}
          {member.status !== "pending" ? <button type="button" style={btn} onClick={() => patchMember(member.id, { status: "pending", paymentStatus: "unpaid", approvedForPayment: false, access: "locked" })}>Restore</button> : null}
        </div>
      </div>
    );
  }

  function InvestorCardView({ investor }: { investor: InvestorCard }) {
    const pulse = investor.status === "pending" || (investor.status === "approved" && investor.approvedForPayment && investor.access !== "active");
    return (
      <div className={pulse ? "vf-pulse" : ""} style={investor.status === "deleted" ? redPanel : pulse ? goldPanel : panel}>
        <div style={eyebrow}>{investor.status} • {investor.paymentStatus} • {investor.access}</div>
        <h3 style={h3}>{investor.company}</h3>
        <p style={sub}>{investor.contactName}</p>
        <p style={muted}>{investor.email}</p>
        <p style={muted}>{investor.phone}</p>
        <p style={muted}>Markets: {investor.statesInterested}</p>
        <p style={muted}>Asset Types: {investor.assetTypes}</p>
        <div style={{ ...row, marginTop: 12 }}>
          <Pill text={investor.status} />
          <Pill text={investor.paymentStatus} />
          <Pill text={investor.access} />
          <Pill text={investor.approvedForPayment ? "payment approved" : "payment locked"} />
        </div>
        <div style={{ ...row, marginTop: 15 }}>
          <button type="button" style={greenBtn} onClick={() => patchInvestor(investor.id, { status: "approved" })}>Approve Investor</button>
          <button type="button" style={goldBtn} onClick={() => patchInvestor(investor.id, { status: "approved", approvedForPayment: true, paymentStatus: "ready" })}>Approve Payment Button</button>
          <button type="button" style={greenBtn} onClick={() => patchInvestor(investor.id, { status: "approved", approvedForPayment: true, paymentStatus: "paid", access: "active" })}>Mark Paid</button>
          <button type="button" style={goldBtn} onClick={() => patchInvestor(investor.id, { status: "approved", approvedForPayment: true, paymentStatus: "comped", access: "active" })}>Grant Free Access</button>
          <button type="button" style={redBtn} onClick={() => patchInvestor(investor.id, { status: "suspended", access: "locked" })}>Suspend</button>
          <button type="button" style={redBtn} onClick={() => patchInvestor(investor.id, { status: "denied", approvedForPayment: false, access: "locked" })}>Deny</button>
          <button type="button" style={redBtn} onClick={() => patchInvestor(investor.id, { status: "deleted", access: "locked" })}>Delete Investor</button>
          {investor.status === "deleted" ? <button type="button" style={redBtn} onClick={() => deleteInvestorForever(investor.id)}>Delete Forever</button> : null}
          {investor.status !== "pending" ? <button type="button" style={btn} onClick={() => patchInvestor(investor.id, { status: "pending", paymentStatus: "unpaid", approvedForPayment: false, access: "locked" })}>Restore</button> : null}
        </div>
      </div>
    );
  }

  return (
    <main style={page}>
      <style>{`
        @keyframes vfPulse {
          0% { box-shadow: 0 0 0 0 rgba(255,220,104,.00), 0 0 0 rgba(255,220,104,.00); transform: scale(1); outline: 1px solid rgba(245,197,66,.35); }
          35% { box-shadow: 0 0 0 8px rgba(255,220,104,.25), 0 0 44px rgba(255,220,104,.55); transform: scale(1.018); outline: 3px solid rgba(245,197,66,.85); }
          70% { box-shadow: 0 0 0 3px rgba(255,220,104,.10), 0 0 24px rgba(255,220,104,.28); transform: scale(1.006); outline: 2px solid rgba(245,197,66,.62); }
          100% { box-shadow: 0 0 0 0 rgba(255,220,104,.00), 0 0 0 rgba(255,220,104,.00); transform: scale(1); outline: 1px solid rgba(245,197,66,.35); }
        }
        .vf-pulse { animation: vfPulse .95s ease-in-out infinite; border-color: rgba(255,220,104,.95) !important; }
      `}</style>

      <div style={wrap}>
        <section style={shell}>
          <div style={eyebrow}>VaultForge Admin Command</div>
          <p style={sub}>Owner control • members • investors • payment approval • cleanup</p>
          <div style={{ ...row, marginTop: 16 }}>
            <Link href="/" style={btn}>Home</Link>
            <button type="button" style={tab === "overview" ? goldBtn : btn} onClick={() => setTab("overview")}>Admin Command</button>
            <button type="button" style={tab === "members" ? goldBtn : btn} onClick={() => setTab("members")}>Members</button>
            <button type="button" style={tab === "investors" ? goldBtn : btn} onClick={() => setTab("investors")}>Investors</button>
            <Link href="/member-controlled-threads" style={btn}>Controlled Threads</Link>
            <Link href="/investor-room" style={btn}>Investor Room</Link>
            <Link href="/logout" style={redBtn}>Logout</Link>
          </div>
        </section>

        <section style={hero}>
          <div style={eyebrow}>VaultForge Admin Command</div>
          <h1 style={h1}>Admin command center.</h1>
          <p style={sub}>Buttons are direct controls. No card click layer. No nested button conflict.</p>
        </section>

        {notice ? (
          <section style={goldPanel}>
            <div style={eyebrow}>Admin Action</div>
            <h3 style={h3}>{notice}</h3>
          </section>
        ) : null}

        {tab === "overview" ? (
          <section style={shell}>
            <div style={grid}>
              <Metric title="Profile Approvals" count={pendingMembers.length + pendingInvestors.length} note="submitted profiles waiting on approval" active={pendingMembers.length + pendingInvestors.length > 0} onClick={() => { setTab("members"); setMemberFilter("pending"); }} />
              <Metric title="Member Payment Ready" count={paymentReadyMembers.length} note="approved payment button but not paid/comped" active={paymentReadyMembers.length > 0} onClick={() => { setTab("members"); setMemberFilter("approved"); }} />
              <Metric title="New Members" count={pendingMembers.length} note="pending member approvals" active={pendingMembers.length > 0} onClick={() => { setTab("members"); setMemberFilter("pending"); }} />
              <Metric title="Active Members" count={activeMembers.length} note="approved and active members" onClick={() => { setTab("members"); setMemberFilter("approved"); }} />
              <Metric title="Deleted Members" count={deletedMembers.length} note="member cleanup folder" active={deletedMembers.length > 0} onClick={() => { setTab("members"); setMemberFilter("deleted"); }} />
              <Metric title="New Investors" count={pendingInvestors.length} note="pending investor approvals" active={pendingInvestors.length > 0} onClick={() => { setTab("investors"); setInvestorFilter("pending"); }} />
              <Metric title="Investor Payment Ready" count={paymentReadyInvestors.length} note="approved payment button but not paid/comped" active={paymentReadyInvestors.length > 0} onClick={() => { setTab("investors"); setInvestorFilter("approved"); }} />
              <Metric title="Paid Investors" count={paidInvestors.length} note="active investor access" onClick={() => { setTab("investors"); setInvestorFilter("approved"); }} />
              <Metric title="Deleted Investors" count={deletedInvestors.length} note="investor cleanup folder" active={deletedInvestors.length > 0} onClick={() => { setTab("investors"); setInvestorFilter("deleted"); }} />
            </div>
          </section>
        ) : null}

        {tab === "members" ? (
          <section style={shell}>
            <div style={eyebrow}>Member Control</div>
            <h2 style={h2}>Member cards.</h2>
            <div style={{ ...row, marginBottom: 18 }}>
              {(["all", "pending", "approved", "deleted"] as const).map((item) => (
                <button key={item} type="button" style={memberFilter === item ? goldBtn : btn} onClick={() => setMemberFilter(item)}>{item}</button>
              ))}
              <button type="button" style={redBtn} onClick={clearDeletedMembers}>Clear Deleted Members</button>
              <button type="button" style={btn} onClick={refresh}>Refresh</button>
            </div>
            <div style={grid}>
              {filteredMembers.length ? filteredMembers.map((member) => <MemberCardView key={member.id} member={member} />) : (
                <div style={panel}><h3 style={h3}>No member cards in this lane.</h3></div>
              )}
            </div>
          </section>
        ) : null}

        {tab === "investors" ? (
          <section style={shell}>
            <div style={eyebrow}>Investor Control</div>
            <h2 style={h2}>Investor cards.</h2>
            <div style={{ ...row, marginBottom: 18 }}>
              {(["all", "pending", "approved", "deleted"] as const).map((item) => (
                <button key={item} type="button" style={investorFilter === item ? goldBtn : btn} onClick={() => setInvestorFilter(item)}>{item}</button>
              ))}
              <button type="button" style={redBtn} onClick={clearDeletedInvestors}>Clear Deleted Investors</button>
              <button type="button" style={btn} onClick={refresh}>Refresh</button>
            </div>
            <div style={grid}>
              {filteredInvestors.length ? filteredInvestors.map((investor) => <InvestorCardView key={investor.id} investor={investor} />) : (
                <div style={panel}><h3 style={h3}>No investor cards in this lane.</h3></div>
              )}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}