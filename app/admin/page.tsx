"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Status = "pending" | "approved" | "suspended" | "denied" | "deleted";
type PaymentStatus = "unpaid" | "ready" | "paid" | "comped";
type AccessStatus = "locked" | "active";

type PersonKind = "member" | "investor";

type AdminPerson = {
  id: string;
  kind: PersonKind;
  name: string;
  company: string;
  email: string;
  phone: string;
  role: string;
  markets: string;
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
const PROFILE_KEYS = ["vaultforge_profile", "vaultforge_member_profile", "vaultforge_clean_profile", "vf_profile", "member_profile", "profile"];
const MEMBER_LOGIN_KEY = "vaultforge_member_login_v1";
const MOCK_ACCESS_KEY = "vaultforge_mock_access_approvals_v1";
const ADMIN_QUEUE_KEY = "vaultforge_admin_profile_approval_queue_v1";
const HARD_DELETED_MEMBERS_KEY = "vaultforge_admin_deleted_member_ids_v1";
const HARD_DELETED_INVESTORS_KEY = "vaultforge_admin_deleted_investor_ids_v1";
const ADMIN_MESSAGES_KEY = "vaultforge_admin_messages_v1";
const ADMIN_INBOX_KEY = "vaultforge_admin_investor_inbox_v1";
const INVESTOR_ADMIN_MESSAGES_KEY = "vaultforge_investor_admin_messages_v1";
const INVESTOR_REQUESTS_KEY = "vaultforge_investor_requests_v1";
const CONTROLLED_THREADS_KEY = "vaultforge_controlled_intro_threads_v1";

const page: React.CSSProperties = {
  minHeight: "100vh",
  background: "#05070d",
  color: "#f7f7fb",
  padding: 18,
  fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
};

const wrap: React.CSSProperties = { maxWidth: 1280, margin: "0 auto", paddingBottom: 110 };
const shell: React.CSSProperties = { border: "1px solid rgba(207,216,230,.16)", borderRadius: 24, padding: 20, background: "#0b101b", marginBottom: 18 };
const hero: React.CSSProperties = { border: "1px solid rgba(245,197,66,.30)", borderRadius: 28, padding: 26, marginBottom: 18, background: "radial-gradient(circle at top right, rgba(245,197,66,.14), transparent 35%), linear-gradient(180deg,#10131a,#070b14)" };
const panel: React.CSSProperties = { background: "#121724", border: "1px solid rgba(207,216,230,.16)", borderRadius: 22, padding: 18 };
const goldPanel: React.CSSProperties = { ...panel, borderColor: "rgba(255,220,104,.75)", boxShadow: "0 0 30px rgba(255,220,104,.15)" };
const redPanel: React.CSSProperties = { ...panel, borderColor: "rgba(255,70,70,.55)", boxShadow: "0 0 22px rgba(255,70,70,.12)" };
const grid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(275px,1fr))", gap: 14 };
const row: React.CSSProperties = { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" };
const eyebrow: React.CSSProperties = { color: "#ffd45a", textTransform: "uppercase", letterSpacing: 5, fontSize: 12, fontWeight: 950, marginBottom: 10 };
const h1: React.CSSProperties = { fontSize: "clamp(42px,7vw,74px)", lineHeight: .9, letterSpacing: -4, margin: "0 0 14px", fontWeight: 950 };
const h2: React.CSSProperties = { fontSize: "clamp(28px,5vw,48px)", lineHeight: .95, letterSpacing: -2, margin: "0 0 10px", fontWeight: 950 };
const h3: React.CSSProperties = { fontSize: 24, margin: "0 0 8px", fontWeight: 950 };
const sub: React.CSSProperties = { color: "#c9d0dc", fontSize: 19, lineHeight: 1.35, margin: 0 };
const muted: React.CSSProperties = { color: "#aeb7c7", lineHeight: 1.35, margin: "7px 0 0" };
const btn: React.CSSProperties = { border: "1px solid rgba(207,216,230,.18)", background: "#171c29", color: "#f7f7fb", borderRadius: 999, padding: "11px 14px", fontWeight: 950, textDecoration: "none", display: "inline-block", cursor: "pointer" };
const goldBtn: React.CSSProperties = { ...btn, border: 0, background: "#ffdc68", color: "#10131a" };
const redBtn: React.CSSProperties = { ...btn, background: "#271016", borderColor: "rgba(255,70,70,.55)", color: "#ffb3b3" };
const greenBtn: React.CSSProperties = { ...btn, background: "#062716", borderColor: "rgba(48,255,135,.46)", color: "#9fffc1" };

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

function safeId(value: string, fallback: string) {
  return clean(value || fallback).toLowerCase().replace(/[^a-z0-9@._-]+/g, "-");
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


function accessOverrideFor(kind: PersonKind, email: string) {
  const cleanEmail = lower(email);
  if (!cleanEmail || cleanEmail === "email-not-listed") return null;

  const approvals = readJson<Record<string, any>>(MOCK_ACCESS_KEY, {});
  const key = `${kind}:${cleanEmail}`;
  const record = approvals[key] || {};

  const paymentKey = kind === "member" ? "vaultforge_mock_member_payment_v1" : "vaultforge_mock_investor_payment_v1";
  const direct = readJson<any>(paymentKey, {});
  const directEmail = lower(direct?.email || "");

  const combined = {
    ...record,
    ...(directEmail === cleanEmail || !directEmail ? direct : {}),
  };

  if (!Object.keys(combined).length) return null;

  const paid = Boolean(combined.paid || combined.unlocked || combined.paymentStatus === "paid" || combined.accessStatus === "active");
  const ready = Boolean(combined.approved || combined.adminApproved || combined.approvedForPayment || combined.paymentStatus === "ready" || combined.accessStatus === "payment_ready");

  return {
    paid,
    ready,
    paymentStatus: paid ? "paid" as PaymentStatus : ready ? "ready" as PaymentStatus : undefined,
    access: paid ? "active" as AccessStatus : "locked" as AccessStatus,
    approvedForPayment: ready || paid,
    updatedAt: clean(combined.updatedAt || combined.paidAt || ""),
  };
}



function normalizeMember(row: any): AdminPerson {
  const email = lower(row?.email || row?.memberEmail || row?.member_email);
  const status = statusFrom(row);
  const pay = paymentFrom(row);
  const approvedForPayment = Boolean(row?.approvedForPayment || row?.approved_for_payment || row?.paymentApproved || row?.payment_approved || pay === "ready");
  const paidLike = pay === "paid" || pay === "comped";
  const override = accessOverrideFor("member", email);
  return {
    id: safeId(row?.id || row?.auth_user_id || email, `member-${Date.now()}`),
    kind: "member",
    name: clean(row?.name || row?.fullName || row?.full_name || row?.contactName, email ? email.split("@")[0] : "Member"),
    company: clean(row?.company || row?.companyName || row?.company_name, "Company not listed"),
    email: email || "email-not-listed",
    phone: clean(row?.phone || row?.phoneNumber || row?.phone_number, "Phone not listed"),
    role: clean(row?.memberType || row?.member_type || row?.type, "Member"),
    markets: listText(row?.operatingStates || row?.statesOperated || row?.states_served || row?.states || row?.state || "Not listed"),
    status,
    paymentStatus: override?.paymentStatus || pay,
    approvedForPayment: override?.approvedForPayment || approvedForPayment,
    access: override?.access || (row?.access === "active" || row?.accessStatus === "active" || (status === "approved" && paidLike) ? "active" : "locked"),
    updatedAt: clean(override?.updatedAt || row?.updatedAt || row?.updated_at, new Date().toISOString()),
    raw: row,
  };
}

function normalizeInvestor(row: any): AdminPerson {
  const email = lower(row?.email || row?.investorEmail || row?.investor_email);
  const status = statusFrom(row);
  const pay = paymentFrom(row);
  const approvedForPayment = Boolean(row?.approvedForPayment || row?.approved_for_payment || row?.paymentApproved || row?.payment_approved || pay === "ready");
  const paidLike = pay === "paid" || pay === "comped";
  const override = accessOverrideFor("investor", email);
  return {
    id: safeId(row?.id || row?.investorId || row?.investor_id || email, `investor-${Date.now()}`),
    kind: "investor",
    name: clean(row?.contactName || row?.contact_name || row?.name || row?.fullName, email ? email.split("@")[0] : "Investor"),
    company: clean(row?.company || row?.companyName || row?.businessName, "Company not listed"),
    email: email || "email-not-listed",
    phone: clean(row?.phone || row?.phoneNumber || row?.mobile, "Phone not listed"),
    role: listText(row?.investorTypes || row?.assetTypes || row?.asset_types || row?.assetClass || "Investor"),
    markets: listText(row?.statesInterested || row?.states_interested || row?.states || row?.markets, "Not listed"),
    status,
    paymentStatus: override?.paymentStatus || pay,
    approvedForPayment: override?.approvedForPayment || approvedForPayment,
    access: override?.access || (row?.access === "active" || row?.accessStatus === "active" || (status === "approved" && paidLike) ? "active" : "locked"),
    updatedAt: clean(override?.updatedAt || row?.updatedAt || row?.updated_at, new Date().toISOString()),
    raw: row,
  };
}

function readMembers(): AdminPerson[] {
  const hardDeleted = readDeletedSet(HARD_DELETED_MEMBERS_KEY);
  const map = new Map<string, AdminPerson>();

  for (const key of PROFILE_KEYS) {
    const row = readJson<any>(key, null);
    if (row && typeof row === "object" && !Array.isArray(row)) {
      const item = normalizeMember(row);
      map.set(item.email !== "email-not-listed" ? item.email : item.id, item);
    }
  }

  const login = readJson<any>(MEMBER_LOGIN_KEY, null);
  if (login && typeof login === "object" && !Array.isArray(login)) {
    const item = normalizeMember(login);
    map.set(item.email !== "email-not-listed" ? item.email : item.id, { ...(map.get(item.email) || item), ...item });
  }

  const stored = readJson<any[]>(ADMIN_MEMBERS_KEY, []);
  if (Array.isArray(stored)) {
    stored.forEach((row) => {
      const item = normalizeMember(row);
      map.set(item.email !== "email-not-listed" ? item.email : item.id, { ...(map.get(item.email) || item), ...item });
    });
  }

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
  map.set(OWNER_EMAIL, owner);

  return Array.from(map.values()).filter((item) => !hardDeleted.has(item.id));
}

function readInvestors(): AdminPerson[] {
  const hardDeleted = readDeletedSet(HARD_DELETED_INVESTORS_KEY);
  const map = new Map<string, AdminPerson>();

  const single = readJson<any>(INVESTOR_APP_KEY, null);
  if (single && typeof single === "object" && !Array.isArray(single) && (single.email || single.company || single.contactName || single.name)) {
    const item = normalizeInvestor(single);
    map.set(item.email !== "email-not-listed" ? item.email : item.id, item);
  }

  const queue = readJson<any[]>(ADMIN_QUEUE_KEY, []);
  if (Array.isArray(queue)) {
    queue.filter((item) => lower(item?.type) === "investor").forEach((item) => {
      const investor = normalizeInvestor({ ...(item?.profile || {}), ...item });
      map.set(investor.email !== "email-not-listed" ? investor.email : investor.id, { ...(map.get(investor.email) || investor), ...investor });
    });
  }

  const stored = readJson<any[]>(INVESTOR_LIST_KEY, []);
  if (Array.isArray(stored)) {
    stored.forEach((row) => {
      const item = normalizeInvestor(row);
      map.set(item.email !== "email-not-listed" ? item.email : item.id, { ...(map.get(item.email) || item), ...item });
    });
  }

  return Array.from(map.values()).filter((item) => !hardDeleted.has(item.id));
}

function readRequests() {
  const keys = [ADMIN_MESSAGES_KEY, ADMIN_INBOX_KEY, INVESTOR_ADMIN_MESSAGES_KEY, INVESTOR_REQUESTS_KEY, CONTROLLED_THREADS_KEY];
  const rows: any[] = [];

  keys.forEach((key) => {
    const value = readJson<any>(key, []);
    if (Array.isArray(value)) {
      value.forEach((row) => rows.push({ ...row, sourceKey: key }));
    } else if (value && typeof value === "object") {
      Object.values(value).forEach((row: any) => rows.push({ ...row, sourceKey: key }));
    }
  });

  return rows
    .filter((row) => row && typeof row === "object")
    .sort((a, b) => String(b?.createdAt || b?.updatedAt || "").localeCompare(String(a?.createdAt || a?.updatedAt || "")))
    .slice(0, 40);
}

function savePeople(members: AdminPerson[], investors: AdminPerson[]) {
  writeJson(ADMIN_MEMBERS_KEY, members);
  writeJson(INVESTOR_LIST_KEY, investors);
  window.dispatchEvent(new Event("vaultforge-admin-action-change"));
  window.dispatchEvent(new Event("vaultforge-mock-access-change"));
  window.dispatchEvent(new Event("vaultforge-investor-change"));
}

function syncAccess(item: AdminPerson) {
  if (!item.email || item.email === "email-not-listed") return;
  const key = `${item.kind}:${item.email}`;
  const current = readJson<Record<string, any>>(MOCK_ACCESS_KEY, {});
  current[key] = {
    ...(current[key] || {}),
    email: item.email,
    kind: item.kind,
    approved: item.status === "approved",
    adminApproved: item.status === "approved",
    approvedForPayment: item.approvedForPayment,
    paymentStatus: item.paymentStatus === "unpaid" && item.approvedForPayment ? "ready" : item.paymentStatus,
    accessStatus: item.access,
    paid: item.paymentStatus === "paid" || item.paymentStatus === "comped",
    unlocked: item.access === "active",
    updatedAt: new Date().toISOString(),
  };
  writeJson(MOCK_ACCESS_KEY, current);

  if (item.kind === "investor") {
    const app = readJson<any>(INVESTOR_APP_KEY, {});
    const appEmail = lower(app?.email || app?.investorEmail);
    if (!appEmail || appEmail === item.email) {
      writeJson(INVESTOR_APP_KEY, {
        ...app,
        contactName: item.name,
        name: item.name,
        company: item.company,
        email: item.email,
        investorEmail: item.email,
        phone: item.phone,
        status: item.status,
        paymentStatus: item.paymentStatus,
        approvedForPayment: item.approvedForPayment,
        accessStatus: item.access,
        updatedAt: item.updatedAt,
      });
    }
  }

  if (item.kind === "member") {
    for (const keyName of PROFILE_KEYS) {
      const profile = readJson<any>(keyName, null);
      if (profile && typeof profile === "object" && !Array.isArray(profile)) {
        const email = lower(profile?.email || profile?.memberEmail || profile?.member_email);
        if (!email || email === item.email) {
          writeJson(keyName, {
            ...profile,
            status: item.status,
            memberStatus: item.status,
            paymentStatus: item.paymentStatus,
            approvedForPayment: item.approvedForPayment,
            accessStatus: item.access,
            updatedAt: item.updatedAt,
          });
        }
      }
    }
  }
}

function Pill({ text }: { text: string }) {
  return <span style={{ border: "1px solid rgba(245,197,66,.28)", borderRadius: 999, padding: "7px 10px", color: "#ffd45a", fontWeight: 950, fontSize: 12 }}>{text}</span>;
}

function Metric({ title, count, active, onClick }: { title: string; count: number; active?: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} style={{ ...(active ? goldPanel : panel), width: "100%", textAlign: "left", cursor: "pointer" }}>
      <div style={eyebrow}>{title}</div>
      <h2 style={{ ...h2, color: active ? "#10131a" : "#1688ff" }}>{count}</h2>
    </button>
  );
}

export default function AdminPage() {
  const [members, setMembers] = useState<AdminPerson[]>([]);
  const [investors, setInvestors] = useState<AdminPerson[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [section, setSection] = useState<"new" | "payment" | "active" | "cleanup" | "requests">("new");
  const [notice, setNotice] = useState("");

  function refresh() {
    setMembers(readMembers());
    setInvestors(readInvestors());
    setRequests(readRequests());
  }

  useEffect(() => {
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener("vaultforge-admin-action-change", refresh);
    window.addEventListener("vaultforge-mock-access-change", refresh);
    window.addEventListener("vaultforge-investor-change", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("vaultforge-admin-action-change", refresh);
      window.removeEventListener("vaultforge-mock-access-change", refresh);
      window.removeEventListener("vaultforge-investor-change", refresh);
    };
  }, []);

  const people = [...members, ...investors];

  const buckets = useMemo(() => {
    const newProfiles = people.filter((p) => p.status === "pending");
    const payment = people.filter((p) => p.status === "approved" && (p.approvedForPayment || p.paymentStatus === "ready") && p.access !== "active");
    const active = people.filter((p) => p.status === "approved" && (p.access === "active" || p.paymentStatus === "paid" || p.paymentStatus === "comped"));
    const cleanup = people.filter((p) => ["deleted", "denied", "suspended"].includes(p.status));
    return { newProfiles, payment, active, cleanup };
  }, [people]);

  function setOne(nextItem: AdminPerson) {
    const updated = {
      ...nextItem,
      updatedAt: new Date().toISOString(),
    };

    const paidLike = updated.paymentStatus === "paid" || updated.paymentStatus === "comped";
    updated.access = updated.status === "approved" && paidLike ? "active" : updated.access;

    const nextMembers = members.map((m) => m.id === updated.id && m.kind === updated.kind ? updated : m);
    const nextInvestors = investors.map((i) => i.id === updated.id && i.kind === updated.kind ? updated : i);

    setMembers(nextMembers);
    setInvestors(nextInvestors);
    savePeople(nextMembers, nextInvestors);
    syncAccess(updated);
  }

  function patch(item: AdminPerson, updates: Partial<AdminPerson>, message: string) {
    const next = { ...item, ...updates, updatedAt: new Date().toISOString() };
    const paidLike = next.paymentStatus === "paid" || next.paymentStatus === "comped";
    if (next.status === "approved" && paidLike) next.access = "active";
    if (next.status !== "approved") next.access = "locked";
    setOne(next);
    setNotice(message);

    if (next.status === "approved" && next.access === "active") {
      setSection("active");
    } else if (next.status === "approved" && next.access !== "active") {
      setSection("payment");
    } else if (["deleted", "denied", "suspended"].includes(next.status)) {
      setSection("cleanup");
    } else {
      setSection("new");
    }
  }

  function deleteForever(item: AdminPerson) {
    const key = item.kind === "member" ? HARD_DELETED_MEMBERS_KEY : HARD_DELETED_INVESTORS_KEY;
    const set = readDeletedSet(key);
    set.add(item.id);
    writeDeletedSet(key, set);

    const nextMembers = members.filter((m) => !(m.id === item.id && m.kind === item.kind));
    const nextInvestors = investors.filter((i) => !(i.id === item.id && i.kind === item.kind));
    setMembers(nextMembers);
    setInvestors(nextInvestors);
    savePeople(nextMembers, nextInvestors);
    setNotice(`${item.kind === "member" ? "Member" : "Investor"} deleted forever.`);
  }

  function PersonCard({ item }: { item: AdminPerson }) {
    const tone = item.status === "deleted" || item.status === "denied" || item.status === "suspended" ? redPanel : item.status === "pending" || item.paymentStatus === "ready" ? goldPanel : panel;

    return (
      <div style={tone}>
        <div style={eyebrow}>{item.kind} • {item.status} • {item.paymentStatus} • {item.access}</div>

        {(item.raw?.profilePhoto || item.raw?.photoUrl || item.raw?.companyLogo || item.raw?.logoUrl) ? (
          <div style={{ ...row, alignItems: "center", marginBottom: 12 }}>
            {item.raw?.profilePhoto || item.raw?.photoUrl ? (
              <img
                src={item.raw?.profilePhoto || item.raw?.photoUrl}
                alt="Profile"
                style={{
                  width: 70,
                  height: 70,
                  objectFit: "cover",
                  borderRadius: 18,
                  border: "1px solid rgba(245,197,66,.35)",
                }}
              />
            ) : null}

            {item.raw?.companyLogo || item.raw?.logoUrl ? (
              <img
                src={item.raw?.companyLogo || item.raw?.logoUrl}
                alt="Company"
                style={{
                  width: 110,
                  height: 70,
                  objectFit: "contain",
                  borderRadius: 18,
                  border: "1px solid rgba(245,197,66,.35)",
                  background: "#080d19",
                  padding: 8,
                }}
              />
            ) : null}
          </div>
        ) : null}

        <h3 style={h3}>{item.company}</h3>
        <p style={sub}>{item.name}</p>
        <p style={muted}>{item.email}</p>
        <p style={muted}>{item.phone}</p>
        <p style={muted}>Role: {item.role}</p>
        <p style={muted}>Markets: {item.markets}</p>

        <div style={{ ...row, marginTop: 12 }}>
          <Pill text={item.kind} />
          <Pill text={item.status} />
          <Pill text={item.paymentStatus} />
          <Pill text={item.access} />
          {item.paymentStatus === "paid" ? <Pill text="PAYMENT ALERT" /> : null}
        </div>

        <div style={{ ...row, marginTop: 15 }}>
          <button
            type="button"
            style={greenBtn}
            onClick={() =>
              patch(
                item,
                { status: "approved", approvedForPayment: true, paymentStatus: "ready", access: "locked" },
                `${item.kind === "investor" ? "Investor" : "Member"} approved. Waiting on payment.`
              )
            }
          >
            Approve Profile
          </button>
          <button type="button" style={redBtn} onClick={() => patch(item, { status: "denied", access: "locked", approvedForPayment: false }, "Denied.")}>Deny</button>
          {item.kind === "member" ? (
            <button type="button" style={goldBtn} onClick={() => patch(item, { status: "approved", approvedForPayment: true, paymentStatus: "ready", access: "locked" }, "Member payment marked ready.")}>
              Payment Ready
            </button>
          ) : null}
          <button type="button" style={greenBtn} onClick={() => patch(item, { status: "approved", approvedForPayment: true, paymentStatus: "paid", access: "active" }, "Marked paid and active.")}>Verify Payment / Activate</button>
          <button type="button" style={goldBtn} onClick={() => patch(item, { status: "approved", approvedForPayment: true, paymentStatus: "comped", access: "active" }, "Free access granted.")}>Free Access</button>
          <button type="button" style={redBtn} onClick={() => patch(item, { status: "suspended", access: "locked" }, "Suspended.")}>Suspend</button>
          <button type="button" style={redBtn} onClick={() => patch(item, { status: "deleted", access: "locked" }, "Moved to cleanup. Open Cleanup to restore or delete forever.")}>Delete</button>
          {item.status !== "pending" ? <button type="button" style={btn} onClick={() => patch(item, { status: "pending", paymentStatus: "unpaid", approvedForPayment: false, access: "locked" }, "Restored to new profiles.")}>Restore</button> : null}
          {item.status === "deleted" ? <button type="button" style={redBtn} onClick={() => deleteForever(item)}>Delete Forever</button> : null}
        </div>
      </div>
    );
  }

  function RequestCard({ item, index }: { item: any; index: number }) {
    const title = clean(item?.requestTitle || item?.title || item?.subject || item?.topic, "Request / Message");
    const body = clean(item?.body || item?.message || item?.notes || item?.roomHeader, "No message body listed.");
    const email = clean(item?.email || item?.investorEmail || item?.memberEmail || item?.investorProfile?.email, "No email listed");
    const source = clean(item?.source || item?.type || item?.sourceKey || item?.kind, "request");

    return (
      <div style={panel}>
        <div style={eyebrow}>{source}</div>
        <h3 style={h3}>{title}</h3>
        <p style={muted}>{email}</p>
        <p style={muted}>{body}</p>
      </div>
    );
  }

  const currentRows =
    section === "new" ? buckets.newProfiles :
    section === "payment" ? buckets.payment :
    section === "active" ? buckets.active :
    section === "cleanup" ? buckets.cleanup :
    [];

  return (
    <main style={page}>
      <div style={wrap}>
        <section style={shell}>
          <div style={eyebrow}>VaultForge Admin</div>
          <div style={{ ...row, marginTop: 12 }}>
            <Link href="/" style={btn}>Home</Link>
            <Link href="/member-controlled-threads" style={goldBtn}>Members Area</Link>
            <Link href="/command" style={btn}>Member Command</Link>
            <Link href="/investor-room" style={btn}>Investor Room</Link>
            <button type="button" style={goldBtn} onClick={refresh}>Refresh</button>
            <Link href="/logout" style={redBtn}>Logout</Link>
          </div>
        </section>

        <section style={hero}>
          <div style={eyebrow}>Owner Control Center</div>
          <h1 style={h1}>Simple admin.</h1>
          <p style={sub}>Approve profile sends the user to Payment / Access. When payment is made, admin gets a payment alert and the card moves to Active Users.</p>

          <div style={{ ...row, marginTop: 18 }}>
            <Link href="/member-controlled-threads" style={goldBtn}>Open Members Area</Link>
            <Link href="/command" style={btn}>Open Member Command</Link>
            <Link href="/investor-room" style={btn}>Open Investor Room</Link>
          </div>
        </section>

        {notice ? (
          <section style={goldPanel}>
            <div style={eyebrow}>Admin Action</div>
            <h3 style={h3}>{notice}</h3>
          </section>
        ) : null}

        <section style={shell}>
          <div style={grid}>
            <Metric title="New Profiles" count={buckets.newProfiles.length} active={section === "new"} onClick={() => setSection("new")} />
            <Metric title="Payment / Access" count={buckets.payment.length} active={section === "payment"} onClick={() => setSection("payment")} />
            <Metric title="Active Users" count={buckets.active.length} active={section === "active"} onClick={() => setSection("active")} />
            <Metric title="Cleanup" count={buckets.cleanup.length} active={section === "cleanup"} onClick={() => setSection("cleanup")} />
            <Metric title="Requests / Messages" count={requests.length} active={section === "requests"} onClick={() => setSection("requests")} />
          </div>
        </section>

        <section style={shell}>
          <div style={{ ...row, marginBottom: 16 }}>
            <button type="button" style={section === "new" ? goldBtn : btn} onClick={() => setSection("new")}>New Profiles</button>
            <button type="button" style={section === "payment" ? goldBtn : btn} onClick={() => setSection("payment")}>Payment / Access</button>
            <button type="button" style={section === "active" ? goldBtn : btn} onClick={() => setSection("active")}>Active Users</button>
            <button type="button" style={section === "cleanup" ? goldBtn : btn} onClick={() => setSection("cleanup")}>Cleanup</button>
            <button type="button" style={section === "requests" ? goldBtn : btn} onClick={() => setSection("requests")}>Requests / Messages</button>
          </div>

          <div style={eyebrow}>
            {section === "new" ? "New Profiles" :
             section === "payment" ? "Payment / Access" :
             section === "active" ? "Active Users" :
             section === "cleanup" ? "Cleanup" :
             "Requests / Messages"}
          </div>

          {section !== "requests" ? (
            <>
              <h2 style={h2}>
                {currentRows.length
                  ? section === "active"
                    ? "Active user cards."
                    : section === "payment"
                      ? "Payment/access cards."
                      : section === "cleanup"
                        ? "Cleanup cards."
                        : "New profile cards."
                  : "Nothing in this section."}
              </h2>
              <div style={grid}>
                {currentRows.length ? currentRows.map((item) => <PersonCard key={`${item.kind}-${item.id}`} item={item} />) : (
                  <div style={panel}><p style={sub}>This lane is empty.</p></div>
                )}
              </div>
            </>
          ) : (
            <>
              <h2 style={h2}>{requests.length ? "Request/message inbox." : "No requests or messages."}</h2>
              <div style={grid}>
                {requests.length ? requests.map((item, index) => <RequestCard key={`${item?.id || index}-${index}`} item={item} index={index} />) : (
                  <div style={panel}><p style={sub}>No investor/member/admin messages found.</p></div>
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
