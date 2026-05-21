"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type MemberStatus = "pending" | "approved" | "denied" | "suspended";
type PaymentStatus = "unpaid" | "paid" | "comped" | "trial" | "past_due";

type MemberRecord = {
  id: string;
  email: string;
  name: string;
  company: string;
  phone: string;
  memberType: string;
  states: string;
  status: MemberStatus;
  paymentStatus: PaymentStatus;
  access: "locked" | "active";
  createdAt: string;
  updatedAt: string;
  source: string;
  raw?: any;
};

const OWNER_EMAIL = "bcrsoutheast@gmail.com";
const ADMIN_MEMBERS_KEY = "vaultforge_admin_members_v1";

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
    window.dispatchEvent(new Event("vaultforge-admin-members-change"));
    return true;
  } catch {
    return false;
  }
}

function clean(value: unknown, fallback = "") {
  const text = String(value || "").trim();
  return text && text !== "undefined" && text !== "null" ? text : fallback;
}

function cleanEmail(value: unknown) {
  return clean(value).toLowerCase();
}

function makeId(email: string, fallback: unknown) {
  const raw = clean(fallback || email || Date.now());
  return raw.toLowerCase().replace(/[^a-z0-9@._-]+/g, "-") || `member-${Date.now()}`;
}

function statusFrom(value: unknown): MemberStatus {
  const s = clean(value).toLowerCase();
  if (s === "approved" || s === "active") return "approved";
  if (s === "denied" || s === "rejected") return "denied";
  if (s === "suspended") return "suspended";
  return "pending";
}

function paymentFrom(value: unknown): PaymentStatus {
  const s = clean(value).toLowerCase();
  if (s === "paid") return "paid";
  if (s === "comped" || s === "free" || s === "free_access") return "comped";
  if (s === "trial") return "trial";
  if (s === "past_due" || s === "past due") return "past_due";
  return "unpaid";
}

function arrayText(value: unknown, fallback: string) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean).join(" • ") || fallback;
  return clean(value, fallback);
}

function normalizeMember(row: any, source: string): MemberRecord {
  const email = cleanEmail(row?.email || row?.memberEmail || row?.member_email || row?.userEmail || row?.user_email);
  const name = clean(row?.name || row?.fullName || row?.full_name || row?.memberName || row?.member_name, email ? email.split("@")[0] : "Unnamed Member");
  const company = clean(row?.company || row?.companyName || row?.company_name || row?.businessName || row?.business_name, "Company not listed");
  const phone = clean(row?.phone || row?.phoneNumber || row?.phone_number || row?.mobile, "Phone not listed");
  const memberType = clean(row?.memberType || row?.member_type || row?.role || row?.investorType || row?.operatorType, "Private Member");
  const states = arrayText(row?.states || row?.operatingStates || row?.statesOperated || row?.serviceStates || row?.markets, "States not listed");
  const status = statusFrom(row?.status || row?.memberStatus || row?.member_status || row?.accessStatus || row?.access_status);
  const paymentStatus = paymentFrom(row?.paymentStatus || row?.payment_status || row?.billingStatus || row?.billing_status);
  const activePayment = paymentStatus === "paid" || paymentStatus === "comped" || paymentStatus === "trial";

  return {
    id: makeId(email, row?.id || row?.memberId || row?.member_id || row?.auth_user_id),
    email: email || "email-not-listed",
    name,
    company,
    phone,
    memberType,
    states,
    status,
    paymentStatus,
    access: row?.access === "active" || row?.isActive || row?.is_active || (status === "approved" && activePayment) ? "active" : "locked",
    createdAt: clean(row?.createdAt || row?.created_at, new Date().toISOString()),
    updatedAt: clean(row?.updatedAt || row?.updated_at, new Date().toISOString()),
    source,
    raw: row,
  };
}

function getCurrentUserEmail() {
  if (!ok()) return "";
  let profile: any = {};
  for (const key of PROFILE_KEYS) {
    try {
      const raw = localStorage.getItem(key);
      if (raw && raw.startsWith("{")) profile = { ...profile, ...JSON.parse(raw) };
    } catch {
      // ignore bad cache
    }
  }

  return cleanEmail(
    profile.email ||
      profile.memberEmail ||
      profile.member_email ||
      localStorage.getItem("vf_email") ||
      localStorage.getItem("member_email") ||
      localStorage.getItem("email")
  );
}

function readMembers(): MemberRecord[] {
  if (!ok()) return [];
  const found = new Map<string, MemberRecord>();

  for (const key of MEMBER_SOURCE_KEYS) {
    const parsed = j<unknown>(localStorage.getItem(key), []);
    const rows = Array.isArray(parsed)
      ? parsed
      : parsed && typeof parsed === "object"
        ? Object.values(parsed as Record<string, unknown>)
        : [];

    for (const row of rows) {
      if (!row || typeof row !== "object") continue;
      const member = normalizeMember(row, key);
      const mapKey = member.email !== "email-not-listed" ? member.email : member.id;
      found.set(mapKey, { ...found.get(mapKey), ...member });
    }
  }

  for (const key of PROFILE_KEYS) {
    const profile = j<any>(localStorage.getItem(key), null);
    if (profile && typeof profile === "object") {
      const member = normalizeMember(profile, key);
      const mapKey = member.email !== "email-not-listed" ? member.email : member.id;
      found.set(mapKey, { ...found.get(mapKey), ...member });
    }
  }

  const ownerEmail = OWNER_EMAIL.toLowerCase();
  found.set(ownerEmail, {
    id: "owner-admin",
    email: ownerEmail,
    name: "Dmoney",
    company: "VaultForge",
    phone: "Owner",
    memberType: "Owner / Admin",
    states: "Owner workspace",
    status: "approved",
    paymentStatus: "comped",
    access: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    source: "owner-default",
  });

  return Array.from(found.values()).sort((a, b) => {
    const order: Record<MemberStatus, number> = { pending: 0, approved: 1, suspended: 2, denied: 3 };
    return order[a.status] - order[b.status] || a.name.localeCompare(b.name);
  });
}

function persistMembers(members: MemberRecord[]) {
  writeJson(ADMIN_MEMBERS_KEY, members);
}

function canViewAdmin(email: string) {
  return cleanEmail(email) === OWNER_EMAIL.toLowerCase();
}

function updateMember(members: MemberRecord[], targetId: string, patch: Partial<MemberRecord>) {
  const now = new Date().toISOString();
  return members.map((member) => {
    if (member.id !== targetId) return member;
    const next = { ...member, ...patch, updatedAt: now };
    const activePayment = next.paymentStatus === "paid" || next.paymentStatus === "comped" || next.paymentStatus === "trial";
    next.access = next.status === "approved" && activePayment ? "active" : "locked";
    return next;
  });
}

const page: React.CSSProperties = {
  minHeight: "100vh",
  background: "#080b10",
  color: "#f6f7fb",
  padding: 18,
  fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
};

const wrap: React.CSSProperties = { maxWidth: 1320, margin: "0 auto", paddingBottom: 90 };
const topbar: React.CSSProperties = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  alignItems: "center",
  justifyContent: "space-between",
  border: "1px solid rgba(255,255,255,.10)",
  background: "#0c1119",
  borderRadius: 18,
  padding: 14,
  marginBottom: 18,
};

const brand: React.CSSProperties = { color: "#ffd45a", fontSize: 24, fontWeight: 950, letterSpacing: -1 };
const navRight: React.CSSProperties = { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" };
const btn: React.CSSProperties = { border: "1px solid rgba(207,216,230,.18)", background: "#171c29", color: "#f7f7fb", borderRadius: 999, padding: "11px 15px", fontWeight: 900, textDecoration: "none", display: "inline-block", cursor: "pointer" };
const goldBtn: React.CSSProperties = { ...btn, border: 0, background: "#ffdc68", color: "#10131a" };
const redBtn: React.CSSProperties = { ...btn, background: "#251015", borderColor: "rgba(255,70,70,.52)", color: "#ffaaaa" };
const greenBtn: React.CSSProperties = { ...btn, background: "#0e2518", borderColor: "rgba(80,220,130,.55)", color: "#9cffbc" };

const hero: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.10)",
  borderRadius: 22,
  padding: 28,
  marginBottom: 18,
  background: "linear-gradient(180deg,#0e1420,#090d14)",
};

const card: React.CSSProperties = {
  background: "#0d121b",
  border: "1px solid rgba(255,255,255,.10)",
  borderRadius: 20,
  padding: 18,
  marginBottom: 18,
};

const panel: React.CSSProperties = {
  background: "#111823",
  border: "1px solid rgba(207,216,230,.14)",
  borderRadius: 18,
  padding: 18,
};

const alertPanel: React.CSSProperties = { ...panel, borderColor: "rgba(255,70,70,.55)" };
const activePanel: React.CSSProperties = { ...panel, borderColor: "rgba(245,197,66,.50)" };
const eyebrow: React.CSSProperties = { color: "#ffd45a", textTransform: "uppercase", letterSpacing: 5, fontWeight: 950, fontSize: 12, marginBottom: 10 };
const h1: React.CSSProperties = { fontSize: "clamp(36px,6vw,64px)", lineHeight: 0.95, letterSpacing: -3, margin: "0 0 14px", fontWeight: 950 };
const h2: React.CSSProperties = { fontSize: "clamp(24px,4vw,38px)", lineHeight: 1, letterSpacing: -1.5, margin: "0 0 12px", fontWeight: 950 };
const sub: React.CSSProperties = { color: "#c9d0dc", fontSize: 18, lineHeight: 1.35, margin: 0 };
const muted: React.CSSProperties = { color: "#aeb7c7", margin: "7px 0 0", lineHeight: 1.35 };
const grid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: 14 };
const row: React.CSSProperties = { display: "flex", gap: 9, flexWrap: "wrap", alignItems: "center" };

function AdminNav() {
  return (
    <div style={topbar}>
      <div>
        <div style={brand}>VAULTFORGE ADMIN</div>
        <div style={{ ...muted, marginTop: 2 }}>Owner Control Desk • Member Access</div>
      </div>
      <div style={navRight}>
        <Link href="/admin" style={goldBtn}>Admin</Link>
        <Link href="/command" style={btn}>Member View</Link>
        <Link href="/profile" style={btn}>Profile</Link>
        <Link href="/logout" style={redBtn}>Logout</Link>
      </div>
    </div>
  );
}

function Metric({ title, count, note }: { title: string; count: number; note: string }) {
  return (
    <div style={panel}>
      <div style={eyebrow}>{title}</div>
      <h2 style={h2}>{count}</h2>
      <p style={muted}>{note}</p>
    </div>
  );
}

function StatusPill({ text }: { text: string }) {
  const lower = text.toLowerCase();
  let style = btn;
  if (lower.includes("approved") || lower.includes("active") || lower.includes("paid") || lower.includes("comped")) style = greenBtn;
  if (lower.includes("pending") || lower.includes("trial")) style = goldBtn;
  if (lower.includes("denied") || lower.includes("suspended") || lower.includes("unpaid") || lower.includes("locked") || lower.includes("past")) style = redBtn;
  return <span style={{ ...style, padding: "7px 11px", fontSize: 12 }}>{text}</span>;
}

function MemberCard({
  member,
  onPatch,
}: {
  member: MemberRecord;
  onPatch: (patch: Partial<MemberRecord>) => void;
}) {
  const isOwner = member.email === OWNER_EMAIL.toLowerCase();

  return (
    <div style={member.status === "pending" ? activePanel : member.status === "suspended" || member.status === "denied" ? alertPanel : panel}>
      <div style={eyebrow}>{member.status} • {member.paymentStatus} • {member.access}</div>
      <h2 style={h2}>{member.name}</h2>
      <p style={sub}>{member.company}</p>
      <p style={muted}>{member.email}</p>
      <p style={muted}>{member.phone}</p>
      <p style={muted}>{member.memberType}</p>
      <p style={muted}>{member.states}</p>

      <div style={{ ...row, marginTop: 12 }}>
        <StatusPill text={member.status} />
        <StatusPill text={member.paymentStatus} />
        <StatusPill text={member.access} />
      </div>

      <div style={{ ...row, marginTop: 15 }}>
        <button type="button" style={greenBtn} onClick={() => onPatch({ status: "approved" })}>Approve</button>
        <button type="button" style={redBtn} onClick={() => onPatch({ status: "denied", access: "locked" })} disabled={isOwner}>Deny</button>
        <button type="button" style={greenBtn} onClick={() => onPatch({ paymentStatus: "paid" })}>Mark Paid</button>
        <button type="button" style={btn} onClick={() => onPatch({ paymentStatus: "unpaid", access: "locked" })} disabled={isOwner}>Mark Unpaid</button>
        <button type="button" style={goldBtn} onClick={() => onPatch({ paymentStatus: "comped", status: "approved", access: "active" })}>Grant Free Access</button>
        <button type="button" style={redBtn} onClick={() => onPatch({ status: "suspended", access: "locked" })} disabled={isOwner}>Suspend</button>
        <button type="button" style={btn} onClick={() => onPatch({ status: "approved" })}>Restore</button>
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

export default function AdminPage() {
  const [currentEmail, setCurrentEmail] = useState("");
  const [members, setMembers] = useState<MemberRecord[]>([]);

  useEffect(() => {
    setCurrentEmail(getCurrentUserEmail());
    setMembers(readMembers());

    const refresh = () => {
      setCurrentEmail(getCurrentUserEmail());
      setMembers(readMembers());
    };

    window.addEventListener("storage", refresh);
    window.addEventListener("vaultforge-admin-members-change", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("vaultforge-admin-members-change", refresh);
    };
  }, []);

  const allowed = canViewAdmin(currentEmail);
  const pending = useMemo(() => members.filter((member) => member.status === "pending"), [members]);
  const active = useMemo(() => members.filter((member) => member.status === "approved" && member.access === "active"), [members]);
  const locked = useMemo(() => members.filter((member) => member.paymentStatus === "unpaid" || member.access === "locked"), [members]);
  const comped = useMemo(() => members.filter((member) => member.paymentStatus === "comped"), [members]);
  const blocked = useMemo(() => members.filter((member) => member.status === "suspended" || member.status === "denied"), [members]);

  function patchMember(id: string, patch: Partial<MemberRecord>) {
    const next = updateMember(members, id, patch);
    setMembers(next);
    persistMembers(next);
  }

  if (!allowed) {
    return (
      <main style={page}>
        <div style={wrap}>
          <AdminNav />
          <section style={hero}>
            <div style={eyebrow}>Owner Only</div>
            <h1 style={h1}>Admin locked.</h1>
            <p style={sub}>This control desk is only visible to {OWNER_EMAIL}.</p>
            <p style={muted}>Detected email: {currentEmail || "not detected"}</p>
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
      <div style={wrap}>
        <AdminNav />

        <section style={hero}>
          <div style={eyebrow}>Owner Control Desk</div>
          <h1 style={h1}>Member Access Desk.</h1>
          <p style={sub}>
            Simple admin screen for member approval, paid/unpaid status, free comp access, suspensions, and restored access.
          </p>
          <p style={muted}>Signed in as owner: {currentEmail}</p>
        </section>

        <section style={{ marginBottom: 18 }}>
          <div style={grid}>
            <Metric title="Pending" count={pending.length} note="waiting for owner review" />
            <Metric title="Active" count={active.length} note="approved and unlocked" />
            <Metric title="Unpaid / Locked" count={locked.length} note="not yet activated" />
            <Metric title="Comped" count={comped.length} note="free owner-granted access" />
            <Metric title="Denied / Suspended" count={blocked.length} note="blocked from access" />
          </div>
        </section>

        <Section title="Pending Members">
          {pending.length ? (
            <div style={grid}>{pending.map((member) => <MemberCard key={member.id} member={member} onPatch={(patch) => patchMember(member.id, patch)} />)}</div>
          ) : (
            <div style={panel}><h2 style={h2}>No pending members.</h2><p style={sub}>New members waiting for review will appear here.</p></div>
          )}
        </Section>

        <Section title="Active Members">
          {active.length ? (
            <div style={grid}>{active.map((member) => <MemberCard key={member.id} member={member} onPatch={(patch) => patchMember(member.id, patch)} />)}</div>
          ) : (
            <div style={panel}><h2 style={h2}>No active members yet.</h2><p style={sub}>Approve members and mark paid or comped to activate access.</p></div>
          )}
        </Section>

        <Section title="Unpaid / Locked">
          {locked.length ? (
            <div style={grid}>{locked.map((member) => <MemberCard key={member.id} member={member} onPatch={(patch) => patchMember(member.id, patch)} />)}</div>
          ) : (
            <div style={panel}><h2 style={h2}>No unpaid or locked members.</h2><p style={sub}>All visible approved members are active or comped.</p></div>
          )}
        </Section>

        <Section title="Denied / Suspended">
          {blocked.length ? (
            <div style={grid}>{blocked.map((member) => <MemberCard key={member.id} member={member} onPatch={(patch) => patchMember(member.id, patch)} />)}</div>
          ) : (
            <div style={panel}><h2 style={h2}>No denied or suspended members.</h2><p style={sub}>Blocked members will appear here.</p></div>
          )}
        </Section>
      </div>
    </main>
  );
}
