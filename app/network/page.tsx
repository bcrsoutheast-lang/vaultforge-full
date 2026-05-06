"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Member = Record<string, any>;
type Toast = { type: "success" | "error" | "info"; text: string };

const OWNER_EMAIL = "bcrsoutheast@gmail.com";

const STATE_OPTIONS = [
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

const ROLE_OPTIONS = [
  "All",
  "Buyer",
  "Seller",
  "Lender",
  "Private Money",
  "Wholesaler",
  "Contractor",
  "Developer",
  "Operator",
  "Realtor",
  "Broker",
  "Property Manager",
  "JV Partner",
  "Investor",
  "Deal Source",
];

const shell: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(157,243,191,.10), transparent 30%), linear-gradient(180deg,#030509,#071326 58%,#030509)",
  color: "white",
  padding: "28px 18px 100px",
  fontFamily: "Arial, sans-serif",
};

const wrap: React.CSSProperties = {
  maxWidth: 1180,
  margin: "0 auto",
};

const hero: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.16)",
  background:
    "linear-gradient(145deg, rgba(255,255,255,.065), rgba(255,255,255,.025))",
  borderRadius: 34,
  padding: 28,
  marginBottom: 22,
};

const pane: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.13)",
  background: "rgba(255,255,255,.04)",
  borderRadius: 28,
  padding: 22,
  marginBottom: 18,
};

const card: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.14)",
  background:
    "linear-gradient(145deg, rgba(255,255,255,.055), rgba(255,255,255,.022))",
  borderRadius: 28,
  padding: 22,
  marginBottom: 18,
};

const btn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#9df3bf",
  color: "#071326",
  borderRadius: 999,
  padding: "13px 17px",
  fontWeight: 900,
  textDecoration: "none",
  margin: "8px 8px 0 0",
  border: 0,
  cursor: "pointer",
  minHeight: 46,
};

const goldBtn: React.CSSProperties = {
  ...btn,
  background: "#f5d978",
  color: "#061120",
};

const ghost: React.CSSProperties = {
  ...btn,
  background: "rgba(255,255,255,.05)",
  color: "white",
  border: "1px solid rgba(255,255,255,.18)",
};

const danger: React.CSSProperties = {
  ...ghost,
  color: "#ffd0d0",
  border: "1px solid rgba(255,120,120,.35)",
};

const input: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  borderRadius: 18,
  border: "1px solid rgba(255,255,255,.18)",
  background: "rgba(255,255,255,.075)",
  color: "white",
  padding: 14,
  fontSize: 16,
};

const statGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
  gap: 14,
  marginBottom: 22,
};

const statCard: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.13)",
  borderRadius: 24,
  padding: 18,
  background: "rgba(255,255,255,.04)",
};

const muted: React.CSSProperties = {
  color: "rgba(255,255,255,.70)",
  lineHeight: 1.5,
};

const eyebrow: React.CSSProperties = {
  color: "#9df3bf",
  letterSpacing: 5,
  fontWeight: 900,
  fontSize: 12,
  marginBottom: 12,
  textTransform: "uppercase",
};

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

function getEmail() {
  if (typeof window === "undefined") return "";
  return (
    localStorage.getItem("vf_email") ||
    sessionStorage.getItem("vf_email") ||
    readCookie("vf_email") ||
    ""
  )
    .trim()
    .toLowerCase();
}

function isOwner() {
  return getEmail() === OWNER_EMAIL || readCookie("vf_admin") === "1" || readCookie("isAdmin") === "true";
}

function asList(value: any): string[] {
  if (Array.isArray(value)) return value.map(String).map((x) => x.trim()).filter(Boolean);

  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.map(String).map((x) => x.trim()).filter(Boolean);
    } catch {
      // continue
    }

    return value
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
  }

  return [];
}

function display(value: any, fallback = "Not listed") {
  const text = String(value || "").trim();
  return text || fallback;
}

function memberName(member: Member) {
  return display(member.name || member.full_name || member.company || member.email || member.member_email, "VaultForge Member");
}

function memberEmail(member: Member) {
  return String(member.email || member.member_email || member.user_email || "").trim().toLowerCase();
}

function memberRole(member: Member) {
  return display(member.role || member.member_role || asList(member.member_types)[0], "Member");
}

function memberState(member: Member) {
  return display(member.state || asList(member.buy_box_states)[0], "Not listed");
}

function memberStatus(member: Member) {
  if (member.is_deleted) return "Removed";
  if (member.is_suspended) return "Suspended";
  return display(member.member_status || member.status, "active");
}

function ChipList({ label, items }: { label: string; items: any }) {
  const list = asList(items).slice(0, 8);

  if (!list.length) return null;

  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ color: "#9df3bf", fontWeight: 900, marginBottom: 8 }}>{label}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {list.map((item) => (
          <span
            key={item}
            style={{
              border: "1px solid rgba(157,243,191,.25)",
              background: "rgba(157,243,191,.07)",
              color: "#b9ffc9",
              borderRadius: 999,
              padding: "8px 11px",
              fontWeight: 800,
              fontSize: 13,
            }}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function ToastBox({ toast }: { toast: Toast | null }) {
  if (!toast) return null;

  const border =
    toast.type === "success"
      ? "rgba(157,243,191,.55)"
      : toast.type === "error"
      ? "rgba(255,120,120,.45)"
      : "rgba(232,196,107,.45)";

  const color =
    toast.type === "success"
      ? "#9df3bf"
      : toast.type === "error"
      ? "#ffd0d0"
      : "#e8c46b";

  return (
    <div
      style={{
        position: "fixed",
        top: 18,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9999,
        width: "calc(100% - 32px)",
        maxWidth: 640,
        border: `1px solid ${border}`,
        background: "rgba(3,5,9,.94)",
        boxShadow: "0 24px 80px rgba(0,0,0,.45)",
        borderRadius: 24,
        padding: "16px 18px",
        color,
        fontWeight: 900,
        textAlign: "center",
      }}
    >
      {toast.text}
    </div>
  );
}

export default function NetworkPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [status, setStatus] = useState("Loading member network...");
  const [stateFilter, setStateFilter] = useState("All");
  const [roleFilter, setRoleFilter] = useState("All");
  const [owner, setOwner] = useState(false);
  const [workingId, setWorkingId] = useState("");
  const [toast, setToast] = useState<Toast | null>(null);
  const [rawCount, setRawCount] = useState(0);

  function showToast(next: Toast) {
    setToast(next);
    window.setTimeout(() => setToast(null), 2000);
  }

  async function load(nextState = stateFilter, nextRole = roleFilter) {
    setStatus("Loading member network...");

    try {
      const params = new URLSearchParams({
        state: nextState,
        role: nextRole,
        includeInactive: isOwner() ? "1" : "",
      });

      const res = await fetch(`/api/network/list?${params.toString()}`, {
        cache: "no-store",
        headers: { "x-vf-email": getEmail() },
      });

      const data = await res.json();

      if (!res.ok || data?.ok === false) {
        throw new Error(data?.error || data?.details || "Could not load member network.");
      }

      const list = Array.isArray(data.members) ? data.members : [];
      setMembers(list);
      setRawCount(Number(data.counts?.raw || list.length));
      setStatus("");
    } catch (error: any) {
      setMembers([]);
      setStatus(error?.message || "Could not load member network.");
      showToast({ type: "error", text: error?.message || "Could not load member network." });
    }
  }

  async function runMemberAction(id: string, action: string, done: string) {
    if (!id) {
      showToast({ type: "error", text: "Missing member id." });
      return;
    }

    setWorkingId(id);

    try {
      const res = await fetch(action === "remove" ? "/api/member/delete" : "/api/member/status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-vf-email": getEmail(),
        },
        body: JSON.stringify({ id, action }),
      });

      const data = await res.json();

      if (!res.ok || data?.ok === false) {
        throw new Error(data?.error || data?.details || "Member action failed.");
      }

      showToast({ type: "success", text: done });
      await load();
    } catch (error: any) {
      showToast({ type: "error", text: error?.message || "Member action failed." });
    } finally {
      setWorkingId("");
    }
  }

  async function removeMember(id: string) {
    const yes = window.confirm("Soft-remove this member from active network?");
    if (!yes) return;

    await runMemberAction(id, "remove", "Member removed ✓");
  }

  useEffect(() => {
    setOwner(isOwner());
    load("All", "All");
  }, []);

  const activeCount = useMemo(
    () => members.filter((m) => !m.is_deleted && !m.is_suspended).length,
    [members]
  );

  const suspendedCount = useMemo(
    () => members.filter((m) => m.is_suspended).length,
    [members]
  );

  return (
    <main style={shell}>
      <style>{`
        .vf-member-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(310px, 1fr));
          gap: 18px;
          align-items: start;
        }

        @media (max-width: 760px) {
          .vf-member-grid {
            grid-template-columns: 1fr;
          }

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

      <ToastBox toast={toast} />

      <div style={wrap}>
        <section style={hero}>
          <div style={eyebrow}>VaultForge Network</div>
          <h1 style={{ fontSize: "clamp(56px,13vw,92px)", lineHeight: 0.9, margin: "0 0 18px" }}>
            Member Command Directory
          </h1>
          <p style={{ ...muted, fontSize: 22 }}>
            Buyers, lenders, contractors, developers, operators, and partners across your target states and deal-flow network.
          </p>

          {owner && (
            <div
              style={{
                border: "1px solid rgba(232,196,107,.30)",
                color: "#f5d978",
                borderRadius: 22,
                padding: 16,
                fontWeight: 900,
                marginTop: 18,
                background: "rgba(232,196,107,.07)",
              }}
            >
              Owner controls are active on this browser. Still soft-admin mode, not hard auth.
            </div>
          )}

          <Link href="/dashboard" style={ghost}>Dashboard</Link>
          <Link href="/profile" style={goldBtn}>Edit Profile / Alerts</Link>
          <Link href="/alerts" style={ghost}>Alerts</Link>
          <button type="button" onClick={() => load()} style={btn}>Refresh Members</button>
        </section>

        <section style={statGrid}>
          <div style={statCard}>
            <div style={{ color: "#9df3bf", fontWeight: 900 }}>Displayed</div>
            <div style={{ fontSize: 44, fontWeight: 900 }}>{members.length}</div>
          </div>

          <div style={statCard}>
            <div style={{ color: "#9df3bf", fontWeight: 900 }}>Raw Members</div>
            <div style={{ fontSize: 44, fontWeight: 900 }}>{rawCount}</div>
          </div>

          <div style={statCard}>
            <div style={{ color: "#9df3bf", fontWeight: 900 }}>Active</div>
            <div style={{ fontSize: 44, fontWeight: 900 }}>{activeCount}</div>
          </div>

          <div style={statCard}>
            <div style={{ color: "#9df3bf", fontWeight: 900 }}>Suspended</div>
            <div style={{ fontSize: 44, fontWeight: 900 }}>{suspendedCount}</div>
          </div>
        </section>

        <section style={pane}>
          <h2 style={{ marginTop: 0, fontSize: 30 }}>Target States</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 18 }}>
            {STATE_OPTIONS.map((state) => (
              <button
                key={state}
                type="button"
                onClick={() => {
                  setStateFilter(state);
                  load(state, roleFilter);
                }}
                style={{
                  ...ghost,
                  border: stateFilter === state ? "1px solid rgba(157,243,191,.65)" : ghost.border,
                  color: stateFilter === state ? "#9df3bf" : "white",
                }}
              >
                {state}
              </button>
            ))}
          </div>

          <h2 style={{ fontSize: 30 }}>Filter By Role</h2>
          <select
            value={roleFilter}
            onChange={(event) => {
              setRoleFilter(event.target.value);
              load(stateFilter, event.target.value);
            }}
            style={input}
          >
            {ROLE_OPTIONS.map((role) => (
              <option key={role} value={role} style={{ color: "#111" }}>
                {role}
              </option>
            ))}
          </select>
        </section>

        {status && (
          <section
            style={{
              ...pane,
              color: status.toLowerCase().includes("could") || status.toLowerCase().includes("failed") ? "#ffd0d0" : "#b9ffc9",
              fontSize: 22,
            }}
          >
            {status}
          </section>
        )}

        {!status && members.length === 0 && (
          <section style={{ ...pane, color: "#b9ffc9", fontSize: 22 }}>
            No members matched this filter. Try All states and All roles.
          </section>
        )}

        <section className="vf-member-grid">
          {!status &&
            members.map((member) => {
              const id = String(member.id || "");
              const email = memberEmail(member);
              const busy = workingId === id;

              return (
                <article key={id || email} style={card}>
                  <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 14 }}>
                    {member.profile_photo_url ? (
                      <img
                        src={member.profile_photo_url}
                        alt={memberName(member)}
                        style={{
                          width: 74,
                          height: 74,
                          borderRadius: 999,
                          objectFit: "cover",
                          border: "2px solid rgba(157,243,191,.45)",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 74,
                          height: 74,
                          borderRadius: 999,
                          display: "grid",
                          placeItems: "center",
                          background: "rgba(157,243,191,.10)",
                          border: "2px solid rgba(157,243,191,.25)",
                          color: "#9df3bf",
                          fontWeight: 900,
                          fontSize: 26,
                        }}
                      >
                        {memberName(member).charAt(0).toUpperCase()}
                      </div>
                    )}

                    <div>
                      <div style={{ color: "#9df3bf", fontWeight: 900 }}>
                        {memberRole(member)} · {memberState(member)}
                      </div>
                      <h2 style={{ margin: "6px 0", fontSize: 30 }}>
                        {memberName(member)}
                      </h2>
                      <div style={{ color: "rgba(255,255,255,.58)" }}>
                        {email || "No email listed"}
                      </div>
                    </div>
                  </div>

                  <p style={{ ...muted, fontSize: 18 }}>
                    {display(member.bio || member.buy_box || member.strategy, "No network notes listed yet.")}
                  </p>

                  <ChipList label="Member Types" items={member.member_types} />
                  <ChipList label="Markets" items={member.buy_box_states || member.markets} />
                  <ChipList label="Project Types" items={member.buy_box_types} />
                  <ChipList label="Strategies" items={member.buy_box_strategies} />
                  <ChipList label="Needs" items={member.needs} />
                  <ChipList label="Can Provide" items={member.can_provide} />

                  {member.funding_capacity && (
                    <div style={{ marginTop: 14 }}>
                      <div style={{ color: "#f5d978", fontWeight: 900 }}>Funding Capacity</div>
                      <p style={{ ...muted, marginTop: 6 }}>{member.funding_capacity}</p>
                    </div>
                  )}

                  <div
                    style={{
                      border: "1px solid rgba(255,255,255,.10)",
                      background: "rgba(0,0,0,.15)",
                      borderRadius: 18,
                      padding: 13,
                      marginTop: 16,
                    }}
                  >
                    <strong>Status:</strong> {memberStatus(member)} · <strong>Payment:</strong>{" "}
                    {display(member.payment_status, "unpaid")}
                  </div>

                  <div className="vf-network-actions" style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
                    {email && (
                      <a href={`mailto:${email}`} style={btn}>
                        Email Member
                      </a>
                    )}

                    {owner && (
                      <>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => runMemberAction(id, "activate", "Member activated ✓")}
                          style={ghost}
                        >
                          {busy ? "Working..." : "Activate"}
                        </button>

                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => runMemberAction(id, "suspend", "Member suspended ✓")}
                          style={danger}
                        >
                          {busy ? "Working..." : "Suspend"}
                        </button>

                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => removeMember(id)}
                          style={danger}
                        >
                          {busy ? "Working..." : "Remove"}
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
