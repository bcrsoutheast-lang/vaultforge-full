"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Member = Record<string, any>;

const OWNER_EMAIL = "bcrsoutheast@gmail.com";

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(232,196,107,.16), transparent 30%), radial-gradient(circle at top right, rgba(157,243,191,.13), transparent 28%), radial-gradient(circle at bottom right, rgba(181,92,255,.16), transparent 28%), linear-gradient(180deg,#02040a 0%,#071326 48%,#030509 100%)",
  color: "white",
  padding: "28px 18px 100px",
  fontFamily: "Arial, sans-serif",
};

const wrap: React.CSSProperties = {
  maxWidth: 1220,
  margin: "0 auto",
};

const hero: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.34)",
  background:
    "linear-gradient(145deg, rgba(232,196,107,.11), rgba(181,92,255,.09), rgba(255,255,255,.035))",
  borderRadius: 34,
  padding: 26,
  marginBottom: 22,
  boxShadow: "0 30px 90px rgba(0,0,0,.30)",
};

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(285px,1fr))",
  gap: 18,
};

const statGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))",
  gap: 14,
  marginBottom: 22,
};

const card: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.13)",
  background:
    "linear-gradient(145deg, rgba(181,92,255,.10), rgba(232,196,107,.055), rgba(255,255,255,.03))",
  borderRadius: 28,
  padding: 22,
  boxShadow: "0 26px 80px rgba(0,0,0,.34)",
};

const btn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "linear-gradient(135deg,#f5d978,#9df3bf 55%,#b55cff)",
  color: "#06100a",
  border: "none",
  borderRadius: 999,
  padding: "13px 18px",
  fontWeight: 950,
  textDecoration: "none",
  cursor: "pointer",
  margin: "6px 6px 0 0",
  minHeight: 46,
};

const ghost: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  color: "white",
  border: "1px solid rgba(255,255,255,.18)",
  background: "rgba(255,255,255,.055)",
  borderRadius: 999,
  padding: "13px 18px",
  fontWeight: 900,
  textDecoration: "none",
  cursor: "pointer",
  margin: "6px 6px 0 0",
  minHeight: 46,
};

const danger: React.CSSProperties = {
  ...ghost,
  color: "#ffd0d0",
  border: "1px solid rgba(255,120,120,.38)",
};

const eyebrow: React.CSSProperties = {
  color: "#e8c46b",
  letterSpacing: 5,
  fontWeight: 950,
  fontSize: 12,
  marginBottom: 12,
  textTransform: "uppercase",
};

const greenEyebrow: React.CSSProperties = {
  ...eyebrow,
  color: "#9df3bf",
};

const muted: React.CSSProperties = {
  color: "rgba(255,255,255,.70)",
  lineHeight: 1.55,
};

const chip: React.CSSProperties = {
  display: "inline-flex",
  border: "1px solid rgba(157,243,191,.25)",
  color: "#9df3bf",
  background: "rgba(157,243,191,.07)",
  borderRadius: 999,
  padding: "8px 11px",
  fontWeight: 850,
  fontSize: 13,
  margin: "0 7px 7px 0",
};

const field: React.CSSProperties = {
  width: "100%",
  borderRadius: 18,
  border: "1px solid rgba(255,255,255,.18)",
  background: "rgba(255,255,255,.075)",
  color: "white",
  padding: 14,
  fontSize: 16,
  boxSizing: "border-box",
};

const states = [
  "All",
  "Georgia",
  "Tennessee",
  "Florida",
  "North Carolina",
  "South Carolina",
  "Alabama",
  "Texas",
  "National",
];

const roleOptions = [
  "All",
  "Buyer",
  "Seller",
  "Lender",
  "Private Money",
  "Contractor",
  "Wholesaler",
  "Investor",
  "Developer",
  "Operator",
  "Partner",
  "Realtor",
  "Broker",
];

function clean(value: unknown) {
  return String(value || "").trim();
}

function cleanEmail(value: unknown) {
  return clean(value).toLowerCase();
}

function readCookie(name: string) {
  if (typeof document === "undefined") return "";

  const match = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));

  if (!match) return "";

  try {
    return decodeURIComponent(match.slice(name.length + 1));
  } catch {
    return match.slice(name.length + 1);
  }
}

function asText(value: unknown, fallback = "") {
  const text = clean(value);
  return text || fallback;
}

function lower(value: unknown) {
  return asText(value).toLowerCase();
}

function first(...values: unknown[]) {
  for (const value of values) {
    const cleaned = asText(value);
    if (cleaned) return cleaned;
  }
  return "";
}

function asArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => asText(item)).filter(Boolean);

  const raw = asText(value);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.map((item) => asText(item)).filter(Boolean);
  } catch {
    // Keep going and split the raw value below.
  }

  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function getEmail() {
  if (typeof window === "undefined") return "";

  try {
    return (
      localStorage.getItem("vf_email") ||
      sessionStorage.getItem("vf_email") ||
      readCookie("vf_email") ||
      readCookie("vf_admin_email") ||
      ""
    )
      .trim()
      .toLowerCase();
  } catch {
    return readCookie("vf_email") || readCookie("vf_admin_email") || "";
  }
}

function isOwnerEmail(email: string) {
  return cleanEmail(email) === OWNER_EMAIL;
}

function hasAdminCookie() {
  if (typeof document === "undefined") return false;

  return (
    readCookie("vf_admin") === "1" ||
    readCookie("isAdmin") === "true" ||
    readCookie("vf_email").toLowerCase() === OWNER_EMAIL ||
    readCookie("vf_admin_email").toLowerCase() === OWNER_EMAIL
  );
}

function isOwnerMode(email: string) {
  return isOwnerEmail(email) || hasAdminCookie();
}

function hasRealEmail(member: Member) {
  const email = cleanEmail(member.email || member.member_email || member.owner_email);
  return email.includes("@") && !email.endsWith("@example.com");
}

function memberName(member: Member) {
  return first(
    member.full_name,
    member.name,
    member.display_name,
    member.company,
    member.member_name,
    member.email,
    "Unnamed Member"
  );
}

function memberEmail(member: Member) {
  return first(member.email, member.member_email, member.owner_email);
}

function memberRole(member: Member) {
  return first(
    member.role,
    member.primary_role,
    member.member_role,
    member.member_type,
    asArray(member.member_types)[0],
    asArray(member.roles)[0],
    "Member"
  );
}

function memberState(member: Member) {
  return first(
    member.state,
    member.primary_state,
    asArray(member.markets)[0],
    asArray(member.buy_box_states)[0],
    "National"
  );
}

function memberBio(member: Member) {
  return first(
    member.bio,
    member.description,
    member.strategy_summary,
    member.needs,
    member.what_you_do,
    member.buy_box,
    "VaultForge member profile."
  );
}

function memberId(member: Member) {
  return first(member.id, member.profile_id, member.member_id, member._source_id, member.auth_user_id, member.email);
}

function memberTypes(member: Member) {
  return asArray(
    member.member_types ||
      member.buy_box_types ||
      member.roles ||
      member.role ||
      member.primary_role ||
      member.member_role ||
      member.member_type
  );
}

function memberMarkets(member: Member) {
  return asArray(member.markets || member.buy_box_states || member.market_states || member.state || member.primary_state);
}

function memberProjectTypes(member: Member) {
  return asArray(member.project_types || member.buy_box_project_types || member.buy_box_types || member.property_types || member.asset_types);
}

function memberStrategies(member: Member) {
  return asArray(member.strategies || member.buy_box_strategies || member.strategy);
}

function memberNeeds(member: Member) {
  return asArray(member.needs || member.deal_needs || member.what_i_need);
}

function memberProvides(member: Member) {
  return asArray(member.can_provide || member.what_i_provide);
}

function profileComplete(member: Member) {
  return (
    member.profile_complete === true ||
    lower(member.profile_complete) === "true" ||
    lower(member.profile_status) === "complete"
  );
}

function bucket(member: Member) {
  const explicit = lower(member.admin_bucket);
  if (explicit) return explicit;

  if (lower(member.is_suspended) === "true" || member.is_suspended === true) return "suspended";
  if (lower(member.member_status) === "suspended") return "suspended";
  if (lower(member.access_status) === "suspended") return "suspended";
  if (lower(member.member_status) === "deleted") return "deleted";
  if (lower(member.access_status) === "deleted") return "deleted";
  if (lower(member.access_status) === "active" || lower(member.member_status) === "active" || member.is_active === true) return "active";
  if (lower(member.payment_status) === "paid" || lower(member.payment_status) === "active") return "active";
  if (!profileComplete(member)) return "pending";
  return "locked";
}

function isActive(member: Member) {
  return bucket(member) === "active";
}

function isPending(member: Member) {
  return bucket(member) === "pending";
}

function isSuspended(member: Member) {
  return bucket(member) === "suspended";
}

function isDeleted(member: Member) {
  return bucket(member) === "deleted";
}

function isLocked(member: Member) {
  return bucket(member) === "locked";
}

function bucketTone(value: string) {
  const b = value.toLowerCase();
  if (b === "active") return "#9df3bf";
  if (b === "pending") return "#f5d978";
  if (b === "suspended" || b === "deleted") return "#ff9f9f";
  return "#dcb8ff";
}

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

function StatCard({ label, value, detail }: { label: string; value: number | string; detail: string }) {
  return (
    <div style={card}>
      <div style={greenEyebrow}>{label}</div>
      <div style={{ fontSize: 48, fontWeight: 950, lineHeight: 1 }}>{value}</div>
      <p style={{ ...muted, marginBottom: 0 }}>{detail}</p>
    </div>
  );
}

function Chips({ items }: { items: string[] }) {
  if (!items.length) return null;

  return (
    <div>
      {items.map((item) => (
        <span key={item} style={chip}>
          {item}
        </span>
      ))}
    </div>
  );
}

function StatusChip({ value }: { value: string }) {
  const tone = bucketTone(value);

  return (
    <span
      style={{
        ...chip,
        color: tone,
        borderColor: `${tone}88`,
        background: "rgba(0,0,0,.18)",
        textTransform: "capitalize",
      }}
    >
      {value || "locked"}
    </span>
  );
}

function MemberCard({
  member,
  owner,
  busyKey,
  memberAction,
}: {
  member: Member;
  owner: boolean;
  busyKey: string;
  memberAction: (member: Member, action: "activate" | "mark_paid" | "mark_unpaid" | "lock" | "suspend" | "restore" | "delete") => void;
}) {
  const name = memberName(member);
  const email = memberEmail(member);
  const role = memberRole(member);
  const state = memberState(member);
  const status = bucket(member);
  const tone = bucketTone(status);
  const photo = first(member.profile_photo_url, member.photo_url, member.avatar_url);
  const id = memberId(member);
  const keyBase = cleanEmail(email) || id;

  return (
    <article
      style={{
        ...card,
        opacity: isDeleted(member) ? 0.58 : 1,
        borderColor: `${tone}66`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 18 }}>
        {photo ? (
          <img
            src={photo}
            alt={name}
            style={{
              width: 82,
              height: 82,
              objectFit: "cover",
              borderRadius: 999,
              border: "2px solid rgba(157,243,191,.30)",
            }}
          />
        ) : (
          <div
            style={{
              width: 82,
              height: 82,
              borderRadius: 999,
              display: "grid",
              placeItems: "center",
              background: "rgba(157,243,191,.12)",
              border: "2px solid rgba(157,243,191,.25)",
              color: "#9df3bf",
              fontSize: 34,
              fontWeight: 950,
              flexShrink: 0,
            }}
          >
            {name.slice(0, 1).toUpperCase()}
          </div>
        )}

        <div>
          <div style={greenEyebrow}>{role} · {state}</div>
          <h2 style={{ fontSize: 34, lineHeight: 1, margin: "0 0 8px" }}>
            {name}
          </h2>
          {owner ? (
            <p style={{ ...muted, margin: 0 }}>{email}</p>
          ) : (
            <p style={{ ...muted, margin: 0 }}>Private member profile</p>
          )}
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <StatusChip value={status} />
        <span style={chip}>Profile: {profileComplete(member) ? "Complete" : "Incomplete"}</span>
        {owner && <span style={chip}>Payment: {first(member.payment_status, "unpaid")}</span>}
        {owner && <span style={chip}>Access: {first(member.access_status, "locked")}</span>}
        {owner && <span style={chip}>{first(member._source_table, "unknown table")}</span>}
      </div>

      <p style={{ ...muted, fontSize: 18 }}>{memberBio(member)}</p>

      <div style={{ marginTop: 16 }}>
        <div style={greenEyebrow}>Member Types</div>
        <Chips items={memberTypes(member)} />
      </div>

      <div style={{ marginTop: 16 }}>
        <div style={greenEyebrow}>Markets</div>
        <Chips items={memberMarkets(member)} />
      </div>

      <div style={{ marginTop: 16 }}>
        <div style={greenEyebrow}>Project Types</div>
        <Chips items={memberProjectTypes(member)} />
      </div>

      <div style={{ marginTop: 16 }}>
        <div style={greenEyebrow}>Strategies</div>
        <Chips items={memberStrategies(member)} />
      </div>

      <div style={{ marginTop: 16 }}>
        <div style={greenEyebrow}>Needs</div>
        <Chips items={memberNeeds(member)} />
      </div>

      <div style={{ marginTop: 16 }}>
        <div style={greenEyebrow}>Can Provide</div>
        <Chips items={memberProvides(member)} />
      </div>

      {owner && (
        <div
          style={{
            border: "1px solid rgba(255,255,255,.12)",
            background: "rgba(0,0,0,.18)",
            borderRadius: 18,
            padding: 14,
            marginTop: 18,
          }}
        >
          <strong>ID:</strong> {id || "—"}
          <br />
          <strong>Created:</strong> {first(member.created_at, "—")}
          <br />
          <strong>Updated:</strong> {first(member.updated_at, "—")}
        </div>
      )}

      <div className="vf-network-actions" style={{ marginTop: 18 }}>
        {owner && email && (
          <a href={`mailto:${email}`} style={btn}>
            Email Member
          </a>
        )}

        {owner && (
          <>
            <button
              type="button"
              style={btn}
              disabled={busyKey === `${keyBase}-activate`}
              onClick={() => memberAction(member, "activate")}
            >
              Activate
            </button>

            <button
              type="button"
              style={btn}
              disabled={busyKey === `${keyBase}-mark_paid`}
              onClick={() => memberAction(member, "mark_paid")}
            >
              Mark Paid
            </button>

            <button
              type="button"
              style={ghost}
              disabled={busyKey === `${keyBase}-mark_unpaid`}
              onClick={() => memberAction(member, "mark_unpaid")}
            >
              Mark Unpaid
            </button>

            <button
              type="button"
              style={ghost}
              disabled={busyKey === `${keyBase}-lock`}
              onClick={() => memberAction(member, "lock")}
            >
              Lock
            </button>

            <button
              type="button"
              style={danger}
              disabled={busyKey === `${keyBase}-suspend`}
              onClick={() => memberAction(member, "suspend")}
            >
              Suspend
            </button>

            <button
              type="button"
              style={ghost}
              disabled={busyKey === `${keyBase}-restore`}
              onClick={() => memberAction(member, "restore")}
            >
              Restore
            </button>

            <button
              type="button"
              style={danger}
              disabled={busyKey === `${keyBase}-delete`}
              onClick={() => memberAction(member, "delete")}
            >
              Delete
            </button>
          </>
        )}
      </div>
    </article>
  );
}

export default function NetworkPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [stateFilter, setStateFilter] = useState("All");
  const [roleFilter, setRoleFilter] = useState("All");
  const [loading, setLoading] = useState("Loading real member network...");
  const [toast, setToast] = useState("");
  const [showDeleted, setShowDeleted] = useState(false);
  const [busyKey, setBusyKey] = useState("");
  const [rawSource, setRawSource] = useState("");
  const [rawCount, setRawCount] = useState(0);
  const [fakeHiddenCount, setFakeHiddenCount] = useState(0);
  const [email, setEmail] = useState("");
  const [owner, setOwner] = useState(false);

  async function loadFallbackSelf(currentEmail: string) {
    if (!currentEmail) return [];

    try {
      const res = await fetch(`/api/profile/me?email=${encodeURIComponent(currentEmail)}`, {
        cache: "no-store",
        headers: {
          "x-vf-email": currentEmail,
        },
      });

      const data = await safeJson(res);
      const profile = data?.profile;

      if (!profile?.email) return [];

      return [
        {
          ...profile,
          _source_table: data.table || "profile_me",
          admin_bucket: profile.access_status === "active" || profile.payment_status === "paid" ? "active" : "member",
        },
      ];
    } catch {
      return [];
    }
  }

  async function loadMembers() {
    setLoading("Loading real member network...");
    setToast("");

    try {
      const currentEmail = getEmail();
      const currentOwner = isOwnerMode(currentEmail);

      setEmail(currentEmail);
      setOwner(currentOwner);

      if (!currentEmail) {
        setMembers([]);
        setRawCount(0);
        setFakeHiddenCount(0);
        setRawSource("not logged in");
        setLoading("Log in to view the member network.");
        return;
      }

      const res = await fetch(`/api/admin/members?email=${encodeURIComponent(currentEmail)}&owner=${currentOwner ? "1" : "0"}`, {
        cache: "no-store",
        headers: {
          "x-vf-email": currentEmail,
          "x-vf-admin": currentOwner ? "1" : "0",
        },
      });

      const data = await safeJson(res);

      if (!res.ok || data?.ok === false) {
        const fallback = await loadFallbackSelf(currentEmail);
        setMembers(fallback);
        setRawCount(fallback.length);
        setFakeHiddenCount(0);
        setRawSource(currentOwner ? "admin API blocked" : "member self profile");
        setLoading("");
        setToast(currentOwner ? data?.error || "Owner/admin member API is blocked." : "Member view loaded. Admin controls are locked.");
        return;
      }

      const list = Array.isArray(data?.members)
        ? data.members
        : Array.isArray(data)
        ? data
        : [];

      const realOnly = list.filter(hasRealEmail);
      const fakeOnly = list.filter((member: Member) => !hasRealEmail(member));

      setRawCount(list.length);
      setFakeHiddenCount(fakeOnly.length);
      setMembers(realOnly);
      setRawSource(data.source || data.sources_checked?.join(", ") || "/api/admin/members");
      setLoading("");
    } catch (error: any) {
      const currentEmail = getEmail();
      const fallback = await loadFallbackSelf(currentEmail);

      setEmail(currentEmail);
      setOwner(isOwnerMode(currentEmail));
      setMembers(fallback);
      setRawCount(fallback.length);
      setFakeHiddenCount(0);
      setRawSource("fallback profile");
      setLoading("");
      setToast(error?.message || "Member network fallback view loaded.");
    }
  }

  useEffect(() => {
    loadMembers();
  }, []);

  async function memberAction(member: Member, action: "activate" | "mark_paid" | "mark_unpaid" | "lock" | "suspend" | "restore" | "delete") {
    if (!owner) {
      setToast("Admin controls are locked in member view.");
      return;
    }

    const targetEmail = cleanEmail(memberEmail(member));
    const id = memberId(member);
    const key = `${targetEmail || id}-${action}`;

    if (!targetEmail && !id) {
      setToast("Cannot update this record because it has no email or id.");
      return;
    }

    setBusyKey(key);
    setToast("Saving member action...");

    try {
      const adminEmail = getEmail();
      const adminOwner = isOwnerMode(adminEmail);

      const res = await fetch("/api/admin/members", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-vf-email": adminEmail,
          "x-vf-admin": adminOwner ? "1" : "0",
        },
        body: JSON.stringify({
          email: targetEmail,
          id,
          action,
          admin_email: adminEmail,
          owner: adminOwner ? "1" : "0",
        }),
      });

      const data = await safeJson(res);

      if (!res.ok || data?.ok === false) {
        throw new Error(data?.error || data?.details || "Member action failed.");
      }

      setToast(data?.message || `Member ${action} complete.`);
      await loadMembers();
    } catch (error: any) {
      setToast(error?.message || "Member action failed.");
    } finally {
      setBusyKey("");
    }
  }

  const visibleMembers = useMemo(() => {
    return members.filter((member) => {
      if (!showDeleted && isDeleted(member)) return false;

      if (stateFilter !== "All") {
        const markets = memberMarkets(member).map((item) => item.toLowerCase());
        const state = memberState(member).toLowerCase();

        if (!markets.includes(stateFilter.toLowerCase()) && state !== stateFilter.toLowerCase()) {
          return false;
        }
      }

      if (roleFilter !== "All") {
        const roles = memberTypes(member).map((item) => item.toLowerCase());
        const role = memberRole(member).toLowerCase();

        if (!roles.includes(roleFilter.toLowerCase()) && role !== roleFilter.toLowerCase()) {
          return false;
        }
      }

      return true;
    });
  }, [members, showDeleted, stateFilter, roleFilter]);

  const counts = useMemo(() => {
    return {
      total: members.length,
      displayed: visibleMembers.length,
      active: members.filter(isActive).length,
      pending: members.filter(isPending).length,
      suspended: members.filter(isSuspended).length,
      locked: members.filter(isLocked).length,
      deleted: members.filter(isDeleted).length,
    };
  }, [members, visibleMembers]);

  return (
    <main style={page}>
      <style>{`
        a:hover,
        button:hover {
          transform: translateY(-1px);
          transition: all .18s ease;
          filter: brightness(1.06);
        }

        @media (max-width: 760px) {
          .vf-network-actions {
            display: grid !important;
            grid-template-columns: 1fr !important;
            gap: 10px !important;
          }

          .vf-network-actions > * {
            width: 100%;
            margin: 0 !important;
            box-sizing: border-box;
          }
        }
      `}</style>

      <div style={wrap}>
        <section style={hero}>
          <div style={greenEyebrow}>VaultForge Network · {owner ? "Owner Mode" : "Member Mode"}</div>

          <h1 style={{ fontSize: "clamp(54px,12vw,100px)", lineHeight: 0.88, margin: "0 0 18px" }}>
            Real member network.
          </h1>

          <p style={{ ...muted, fontSize: 21 }}>
            This page is the private member-network intelligence layer. Members can view network context.
            Owner/admin controls stay locked unless the owner session is active.
          </p>

          <div className="vf-network-actions" style={{ marginTop: 18 }}>
            <Link href="/dashboard" style={ghost}>Dashboard</Link>
            {owner && <Link href="/admin" style={btn}>Admin Home</Link>}
            {owner && <Link href="/members" style={ghost}>Members Admin View</Link>}
            <Link href="/profile" style={ghost}>Edit Profile</Link>
            <Link href="/messages" style={ghost}>Messages</Link>
            <Link href="/alerts" style={ghost}>Alerts</Link>
            <Link href="/logout" style={danger}>Logout</Link>
            <button type="button" onClick={loadMembers} style={btn}>Refresh Real Members</button>
          </div>

          <div
            style={{
              border: owner
                ? "1px solid rgba(232,196,107,.35)"
                : "1px solid rgba(157,243,191,.30)",
              color: owner ? "#e8c46b" : "#9df3bf",
              background: owner ? "rgba(232,196,107,.08)" : "rgba(157,243,191,.08)",
              borderRadius: 22,
              padding: 16,
              fontWeight: 900,
              marginTop: 18,
            }}
          >
            {owner
              ? `Owner controls are active for ${email || OWNER_EMAIL}.`
              : `Member view is active${email ? ` for ${email}` : ""}. Admin actions are locked.`}
          </div>
        </section>

        {toast && (
          <section
            style={{
              ...hero,
              color:
                toast.toLowerCase().includes("failed") ||
                toast.toLowerCase().includes("cannot") ||
                toast.toLowerCase().includes("blocked")
                  ? "#ffd0d0"
                  : "#9df3bf",
            }}
          >
            <strong>{toast}</strong>
          </section>
        )}

        <section style={statGrid}>
          <StatCard label="Displayed" value={counts.displayed} detail="Visible after filters." />
          <StatCard label="Real Members" value={counts.total} detail={owner ? "Real emails only." : "Visible private records."} />
          <StatCard label="Active" value={counts.active} detail="Approved or active access." />
          <StatCard label="Pending" value={counts.pending} detail="Profile/payment/admin review." />
          <StatCard label="Locked" value={counts.locked} detail="Access not active yet." />
          <StatCard label="Suspended" value={counts.suspended} detail="Temporarily disabled." />
          {owner && <StatCard label="Deleted" value={counts.deleted} detail="Soft-deleted records." />}
        </section>

        <section style={{ ...hero, borderColor: "rgba(157,243,191,.22)" }}>
          <div style={greenEyebrow}>API Source Check</div>
          <p style={muted}>
            Source: {rawSource || "not loaded yet"}
            <br />
            Raw records returned: {rawCount}
            <br />
            Fake/example records hidden: {fakeHiddenCount}
            <br />
            Mode: {owner ? "owner/admin controls enabled" : "member view only"}
          </p>
        </section>

        <section style={hero}>
          <h2 style={{ fontSize: 34, margin: "0 0 16px" }}>Filters</h2>

          <div style={{ marginBottom: 22 }}>
            <div style={greenEyebrow}>Target States</div>
            {states.map((state) => (
              <button
                key={state}
                type="button"
                style={stateFilter === state ? btn : ghost}
                onClick={() => setStateFilter(state)}
              >
                {state}
              </button>
            ))}
          </div>

          <div>
            <div style={greenEyebrow}>Role</div>
            <select
              style={field}
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value)}
            >
              {roleOptions.map((role) => (
                <option key={role} value={role} style={{ color: "#111" }}>
                  {role}
                </option>
              ))}
            </select>
          </div>

          {owner && (
            <div style={{ marginTop: 18 }}>
              <button
                type="button"
                onClick={() => setShowDeleted((value) => !value)}
                style={showDeleted ? btn : ghost}
              >
                {showDeleted ? "Hide Deleted" : "Show Deleted"}
              </button>
            </div>
          )}
        </section>

        {loading && (
          <section style={hero}>
            <strong>{loading}</strong>
          </section>
        )}

        {!loading && members.length === 0 && (
          <section style={hero}>
            <strong>No member records loaded yet.</strong>
            <p style={muted}>
              In member mode this page can still show your own private profile. In owner mode this should load
              all real members from <strong>/api/admin/members</strong>. Use Refresh Real Members after login.
            </p>
          </section>
        )}

        {!loading && members.length > 0 && visibleMembers.length === 0 && (
          <section style={hero}>
            <strong>No members match this filter.</strong>
          </section>
        )}

        <section style={grid}>
          {visibleMembers.map((member, index) => (
            <MemberCard
              key={`${memberId(member)}-${index}`}
              member={member}
              owner={owner}
              busyKey={busyKey}
              memberAction={memberAction}
            />
          ))}
        </section>
      </div>
    </main>
  );
}
