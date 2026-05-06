"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Member = Record<string, any>;

const OWNER_EMAIL = "bcrsoutheast@gmail.com";

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(157,243,191,.12), transparent 30%), radial-gradient(circle at top right, rgba(232,196,107,.12), transparent 28%), linear-gradient(180deg,#030509,#071326 55%,#030509)",
  color: "white",
  padding: "28px 18px 100px",
  fontFamily: "Arial, sans-serif",
};

const wrap: React.CSSProperties = {
  maxWidth: 1180,
  margin: "0 auto",
};

const hero: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.14)",
  background:
    "linear-gradient(145deg, rgba(255,255,255,.07), rgba(255,255,255,.025))",
  borderRadius: 34,
  padding: 26,
  marginBottom: 22,
};

const card: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.13)",
  background:
    "linear-gradient(145deg, rgba(255,255,255,.06), rgba(255,255,255,.025))",
  borderRadius: 28,
  padding: 22,
};

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(285px,1fr))",
  gap: 18,
};

const statGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
  gap: 14,
  marginBottom: 22,
};

const btn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#9df3bf",
  color: "#061120",
  border: "none",
  borderRadius: 999,
  padding: "13px 18px",
  fontWeight: 950,
  textDecoration: "none",
  cursor: "pointer",
  margin: "6px 6px 0 0",
};

const goldBtn: React.CSSProperties = {
  ...btn,
  background: "#f5d978",
};

const ghost: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  color: "white",
  border: "1px solid rgba(255,255,255,.18)",
  background: "rgba(255,255,255,.04)",
  borderRadius: 999,
  padding: "13px 18px",
  fontWeight: 900,
  textDecoration: "none",
  cursor: "pointer",
  margin: "6px 6px 0 0",
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
  color: "rgba(255,255,255,.68)",
  lineHeight: 1.5,
};

const chip: React.CSSProperties = {
  display: "inline-flex",
  border: "1px solid rgba(157,243,191,.25)",
  color: "#9df3bf",
  background: "rgba(157,243,191,.07)",
  borderRadius: 999,
  padding: "8px 11px",
  fontWeight: 800,
  fontSize: 13,
  margin: "0 7px 7px 0",
};

const select: React.CSSProperties = {
  width: "100%",
  borderRadius: 18,
  border: "1px solid rgba(255,255,255,.18)",
  background: "rgba(255,255,255,.075)",
  color: "white",
  padding: 14,
  fontSize: 16,
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
  "Contractor",
  "Wholesaler",
  "Investor",
  "Developer",
  "Operator",
  "Partner",
  "Realtor",
  "Broker",
];

function getEmail() {
  if (typeof window === "undefined") return "";
  return (
    localStorage.getItem("vf_email") ||
    sessionStorage.getItem("vf_email") ||
    ""
  )
    .trim()
    .toLowerCase();
}

function asText(value: unknown) {
  return String(value || "").trim();
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
    // fall through
  }

  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function memberName(member: Member) {
  return first(
    member.full_name,
    member.name,
    member.display_name,
    member.company,
    member.email,
    "Member"
  );
}

function memberEmail(member: Member) {
  return first(member.email, member.member_email, member.owner_email);
}

function memberRole(member: Member) {
  return first(
    member.role,
    member.primary_role,
    member.member_type,
    asArray(member.member_types)[0],
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
    "VaultForge member profile."
  );
}

function isOwner() {
  return getEmail() === OWNER_EMAIL;
}

function memberStatus(member: Member) {
  return lower(
    first(
      member.member_status,
      member.access_status,
      member.status,
      member.payment_status,
      member.profile_status,
      member.account_status
    )
  );
}

function isSuspended(member: Member) {
  const status = memberStatus(member);

  return (
    status === "suspended" ||
    status === "locked" ||
    status === "disabled" ||
    member.suspended === true ||
    lower(member.suspended) === "true"
  );
}

function isRemoved(member: Member) {
  const status = memberStatus(member);

  return (
    status === "removed" ||
    status === "deleted" ||
    status === "trash" ||
    status === "inactive_removed" ||
    lower(member.removed) === "true" ||
    member.removed === true
  );
}

function isActive(member: Member) {
  if (isRemoved(member) || isSuspended(member)) return false;

  const status = memberStatus(member);

  return (
    status === "active" ||
    lower(member.payment_status) === "active" ||
    lower(member.access_status) === "active" ||
    lower(member.member_status) === "active" ||
    member.is_active === true
  );
}

function isProfileRequired(member: Member) {
  const status = memberStatus(member);
  return status === "profile_required" || status === "incomplete" || lower(member.profile_complete) === "false";
}

function isPaymentRequired(member: Member) {
  const status = memberStatus(member);
  return (
    status === "payment_required" ||
    status === "unpaid" ||
    lower(member.payment_status) === "unpaid" ||
    lower(member.payment_status) === "past_due"
  );
}

function memberId(member: Member) {
  return first(member.id, member.profile_id, member.member_id, member.email);
}

function memberTypes(member: Member) {
  return asArray(
    member.member_types ||
      member.buy_box_types ||
      member.roles ||
      member.role ||
      member.primary_role ||
      member.member_type
  );
}

function memberMarkets(member: Member) {
  return asArray(member.markets || member.buy_box_states || member.state || member.primary_state);
}

function memberProjectTypes(member: Member) {
  return asArray(member.project_types || member.buy_box_project_types || member.buy_box_types || member.property_types);
}

function memberStrategies(member: Member) {
  return asArray(member.strategies || member.buy_box_strategies || member.strategy);
}

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div style={card}>
      <div style={greenEyebrow}>{label}</div>
      <div style={{ fontSize: 48, fontWeight: 950, lineHeight: 1 }}>{value}</div>
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

export default function NetworkPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [stateFilter, setStateFilter] = useState("All");
  const [roleFilter, setRoleFilter] = useState("All");
  const [loading, setLoading] = useState("Loading member network...");
  const [toast, setToast] = useState("");
  const [showRemoved, setShowRemoved] = useState(false);

  async function loadMembers() {
    setLoading("Loading member network...");
    setToast("");

    try {
      const params = new URLSearchParams();

      if (stateFilter && stateFilter !== "All") params.set("state", stateFilter);
      if (roleFilter && roleFilter !== "All") params.set("role", roleFilter);

      const email = getEmail();

      const res = await fetch(`/api/network/list?${params.toString()}`, {
        cache: "no-store",
        headers: {
          "x-vf-email": email,
          "x-vf-admin": isOwner() ? "1" : "0",
        },
      });

      const data = await safeJson(res);

      if (!res.ok || data?.ok === false) {
        throw new Error(data?.error || data?.details || "Could not load member network.");
      }

      const list = Array.isArray(data?.members)
        ? data.members
        : Array.isArray(data)
        ? data
        : [];

      setMembers(list);
      setLoading("");
    } catch (error: any) {
      setLoading(error?.message || "Could not load member network.");
    }
  }

  useEffect(() => {
    loadMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stateFilter, roleFilter]);

  async function updateStatus(member: Member, action: "active" | "suspended" | "payment_required" | "profile_required") {
    setToast("Saving member status...");

    try {
      const email = getEmail();

      const res = await fetch("/api/member/status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-vf-email": email,
          "x-vf-admin": isOwner() ? "1" : "0",
        },
        body: JSON.stringify({
          id: memberId(member),
          member_id: memberId(member),
          email: memberEmail(member),
          member_email: memberEmail(member),
          action,
          admin_email: email,
        }),
      });

      const data = await safeJson(res);

      if (!res.ok || data?.ok === false) {
        throw new Error(data?.error || data?.details || "Could not update member.");
      }

      setToast(data?.message || "Member updated.");
      await loadMembers();
    } catch (error: any) {
      setToast(error?.message || "Could not update member.");
    }
  }

  async function removeMember(member: Member) {
    const ok = window.confirm(`Remove ${memberName(member)} from active network?`);

    if (!ok) return;

    setToast("Removing member...");

    try {
      const email = getEmail();

      const res = await fetch("/api/member/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-vf-email": email,
          "x-vf-admin": isOwner() ? "1" : "0",
        },
        body: JSON.stringify({
          id: memberId(member),
          member_id: memberId(member),
          email: memberEmail(member),
          member_email: memberEmail(member),
          admin_email: email,
        }),
      });

      const data = await safeJson(res);

      if (!res.ok || data?.ok === false) {
        throw new Error(data?.error || data?.details || "Could not remove member.");
      }

      setToast(data?.message || "Member removed.");
      await loadMembers();
    } catch (error: any) {
      setToast(error?.message || "Could not remove member.");
    }
  }

  const rawMembers = members;

  const visibleMembers = useMemo(() => {
    return rawMembers.filter((member) => {
      if (!showRemoved && isRemoved(member)) return false;

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
  }, [rawMembers, showRemoved, stateFilter, roleFilter]);

  const activeCount = rawMembers.filter(isActive).length;
  const suspendedCount = rawMembers.filter(isSuspended).length;
  const removedCount = rawMembers.filter(isRemoved).length;
  const profileRequiredCount = rawMembers.filter(isProfileRequired).length;
  const paymentRequiredCount = rawMembers.filter(isPaymentRequired).length;

  return (
    <main style={page}>
      <style>{`
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
          <div style={greenEyebrow}>VaultForge Network</div>

          <h1 style={{ fontSize: "clamp(54px,12vw,100px)", lineHeight: 0.88, margin: "0 0 18px" }}>
            Member Command Directory
          </h1>

          <p style={{ ...muted, fontSize: 21 }}>
            Buyers, lenders, contractors, developers, operators, and partners across your target states and deal-flow network.
          </p>

          {isOwner() && (
            <div
              style={{
                border: "1px solid rgba(232,196,107,.35)",
                color: "#e8c46b",
                background: "rgba(232,196,107,.08)",
                borderRadius: 22,
                padding: 16,
                fontWeight: 900,
                marginTop: 18,
              }}
            >
              Owner controls are active on this browser. This is still soft-admin mode, not hard auth.
            </div>
          )}

          <div className="vf-network-actions" style={{ marginTop: 18 }}>
            <Link href="/dashboard" style={ghost}>Dashboard</Link>
            <Link href="/profile" style={goldBtn}>Edit Profile / Alerts</Link>
            <Link href="/alerts" style={ghost}>Alerts</Link>
            <button type="button" onClick={loadMembers} style={btn}>Refresh Members</button>
          </div>
        </section>

        {toast && (
          <section
            style={{
              ...hero,
              color: toast.toLowerCase().includes("could not") || toast.toLowerCase().includes("error")
                ? "#ffd0d0"
                : "#9df3bf",
            }}
          >
            <strong>{toast}</strong>
          </section>
        )}

        <section style={statGrid}>
          <StatCard label="Displayed" value={visibleMembers.length} />
          <StatCard label="Raw Members" value={rawMembers.length} />
          <StatCard label="Active" value={activeCount} />
          <StatCard label="Suspended" value={suspendedCount} />
          <StatCard label="Removed" value={removedCount} />
          <StatCard label="Profile Required" value={profileRequiredCount} />
          <StatCard label="Payment Required" value={paymentRequiredCount} />
        </section>

        <section style={hero}>
          <h2 style={{ fontSize: 36, margin: "0 0 16px" }}>Target States</h2>

          <div style={{ marginBottom: 22 }}>
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

          <h2 style={{ fontSize: 34, margin: "0 0 12px" }}>Filter By Role</h2>

          <select
            style={select}
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value)}
          >
            {roleOptions.map((role) => (
              <option key={role} value={role} style={{ color: "#111" }}>
                {role}
              </option>
            ))}
          </select>

          {isOwner() && (
            <div style={{ marginTop: 18 }}>
              <button
                type="button"
                onClick={() => setShowRemoved((value) => !value)}
                style={showRemoved ? goldBtn : ghost}
              >
                {showRemoved ? "Hide Removed" : "Show Removed"}
              </button>
            </div>
          )}
        </section>

        {loading && (
          <section style={hero}>
            <strong>{loading}</strong>
          </section>
        )}

        {!loading && visibleMembers.length === 0 && (
          <section style={hero}>
            <strong>No members found for this filter.</strong>
          </section>
        )}

        <section style={grid}>
          {visibleMembers.map((member, index) => {
            const name = memberName(member);
            const email = memberEmail(member);
            const role = memberRole(member);
            const state = memberState(member);
            const suspended = isSuspended(member);
            const removed = isRemoved(member);
            const active = isActive(member);
            const status = memberStatus(member) || (active ? "active" : suspended ? "suspended" : "profile_required");
            const photo = first(member.profile_photo_url, member.photo_url, member.avatar_url);

            return (
              <article
                key={`${memberId(member)}-${index}`}
                style={{
                  ...card,
                  opacity: removed ? 0.58 : 1,
                  borderColor: suspended
                    ? "rgba(255,120,120,.38)"
                    : active
                    ? "rgba(157,243,191,.28)"
                    : "rgba(255,255,255,.13)",
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
                    <p style={{ ...muted, margin: 0 }}>{email}</p>
                  </div>
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

                <div
                  style={{
                    border: "1px solid rgba(255,255,255,.12)",
                    background: "rgba(0,0,0,.18)",
                    borderRadius: 18,
                    padding: 14,
                    marginTop: 18,
                  }}
                >
                  <strong>Status:</strong> {status || "unknown"} ·{" "}
                  <strong>Payment:</strong> {first(member.payment_status, "unpaid")}
                </div>

                <div className="vf-network-actions" style={{ marginTop: 18 }}>
                  {email && (
                    <a href={`mailto:${email}`} style={btn}>
                      Email Member
                    </a>
                  )}

                  {isOwner() && (
                    <>
                      <button type="button" style={goldBtn} onClick={() => updateStatus(member, "active")}>
                        Activate
                      </button>

                      <button type="button" style={danger} onClick={() => updateStatus(member, "suspended")}>
                        Suspend
                      </button>

                      <button type="button" style={ghost} onClick={() => updateStatus(member, "payment_required")}>
                        Payment Required
                      </button>

                      <button type="button" style={danger} onClick={() => removeMember(member)}>
                        Remove
                      </button>
                    </>
                  )}
                </div>
              </article>
            );
          })}
        </section>
      </div>
    </main>
  );
}
