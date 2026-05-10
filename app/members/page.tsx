"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import VaultForgeMemberNav from "../components/VaultForgeMemberNav";

type Member = Record<string, any>;

const OWNER_EMAIL = "bcrsoutheast@gmail.com";

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(232,196,107,.18), transparent 28%), radial-gradient(circle at top right, rgba(181,92,255,.20), transparent 24%), radial-gradient(circle at bottom right, rgba(157,243,191,.14), transparent 28%), linear-gradient(180deg,#02040a 0%,#071326 50%,#030509 100%)",
  color: "white",
  padding: "28px 18px 100px",
  fontFamily: "Arial, sans-serif",
};

const wrap: React.CSSProperties = { maxWidth: 1220, margin: "0 auto" };

const hero: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.34)",
  background:
    "linear-gradient(145deg, rgba(232,196,107,.12), rgba(181,92,255,.10), rgba(255,255,255,.035))",
  borderRadius: 34,
  padding: 26,
  marginBottom: 22,
};

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(245px,1fr))",
  gap: 16,
};

const card: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.14)",
  background:
    "linear-gradient(145deg, rgba(181,92,255,.13), rgba(232,196,107,.06), rgba(255,255,255,.035))",
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
  textDecoration: "none",
  borderRadius: 999,
  padding: "13px 18px",
  fontWeight: 950,
  border: "none",
  margin: "7px 7px 0 0",
  minHeight: 46,
  cursor: "pointer",
};

const ghost: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  color: "white",
  textDecoration: "none",
  borderRadius: 999,
  padding: "13px 18px",
  fontWeight: 900,
  border: "1px solid rgba(255,255,255,.18)",
  background: "rgba(255,255,255,.06)",
  margin: "7px 7px 0 0",
  minHeight: 46,
  cursor: "pointer",
};

const danger: React.CSSProperties = {
  ...ghost,
  border: "1px solid rgba(255,120,120,.38)",
  color: "#ffd0d0",
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
  color: "rgba(255,255,255,.72)",
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

function cleanEmail(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

function asText(value: unknown, fallback = "") {
  const text = String(value || "").trim();
  return text || fallback;
}

function getEmail() {
  if (typeof window === "undefined") return "";

  try {
    return (
      localStorage.getItem("vf_email") ||
      sessionStorage.getItem("vf_email") ||
      ""
    )
      .trim()
      .toLowerCase();
  } catch {
    return "";
  }
}

function isOwnerEmail(email: string) {
  return cleanEmail(email) === OWNER_EMAIL;
}

function formatDate(value: unknown) {
  const text = asText(value);
  if (!text) return "—";
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return text;
  return date.toLocaleString();
}

function bucketTone(bucket: string) {
  const b = bucket.toLowerCase();
  if (b === "active") return "#9df3bf";
  if (b === "pending") return "#f5d978";
  if (b === "suspended" || b === "deleted") return "#ff9f9f";
  return "#dcb8ff";
}

function hasRealEmail(member: Member) {
  const email = cleanEmail(member.email || member.member_email);
  return email.includes("@") && !email.endsWith("@example.com");
}

function memberName(member: Member) {
  return asText(
    member.full_name || member.name || member.member_name || member.display_name,
    "Unnamed Member"
  );
}

function memberKey(member: Member) {
  return cleanEmail(member.email || member.member_email) || asText(member.id || member._source_id || member.auth_user_id);
}


function splitList(value: unknown) {
  if (Array.isArray(value)) {
    return value
      .map((item) => asText(item))
      .filter(Boolean)
      .slice(0, 8);
  }

  const text = asText(value);
  if (!text) return [];

  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) {
      return parsed
        .map((item) => asText(item))
        .filter(Boolean)
        .slice(0, 8);
    }
  } catch {
    // Continue to comma split.
  }

  return text
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 8);
}

function firstText(...values: unknown[]) {
  for (const value of values) {
    const text = asText(value);
    if (text) return text;
  }
  return "";
}

function memberCompany(member: Member) {
  return firstText(
    member.company,
    member.company_name,
    member.business_name,
    member.organization,
    member.firm,
    member.team
  );
}

function memberHeadline(member: Member) {
  return firstText(
    member.headline,
    member.tagline,
    member.bio,
    member.about,
    member.summary,
    member.notes,
    "VaultForge member profile. More network details will appear as the profile is completed."
  );
}

function memberRoles(member: Member) {
  return splitList(
    member.member_types ||
      member.member_type ||
      member.roles ||
      member.role ||
      member.member_role ||
      member.primary_role
  );
}

function memberMarkets(member: Member) {
  return splitList(
    member.buy_box_states ||
      member.market_states ||
      member.markets ||
      member.states ||
      member.state ||
      member.service_states
  );
}

function memberStrategies(member: Member) {
  return splitList(
    member.buy_box_strategies ||
      member.strategies ||
      member.strategy ||
      member.exit_strategy ||
      member.investment_strategy
  );
}

function memberAssetTypes(member: Member) {
  return splitList(
    member.buy_box_types ||
      member.property_types ||
      member.asset_types ||
      member.property_type ||
      member.deal_type ||
      member.asset_type
  );
}

function memberNeeds(member: Member) {
  return splitList(
    member.needs ||
      member.deal_needs ||
      member.what_i_need ||
      member.routing_needs ||
      member.help_needed ||
      member.capital_needs
  );
}

function memberProvides(member: Member) {
  return splitList(
    member.can_provide ||
      member.what_i_provide ||
      member.provides ||
      member.services ||
      member.capabilities ||
      member.can_help_with
  );
}

function ChipList({
  title,
  values,
  empty,
}: {
  title: string;
  values: string[];
  empty: string;
}) {
  return (
    <div style={{ marginTop: 14 }}>
      <div style={greenEyebrow}>{title}</div>
      {values.length ? (
        <div>
          {values.map((value) => (
            <span key={`${title}-${value}`} style={chip}>
              {value}
            </span>
          ))}
        </div>
      ) : (
        <p style={{ ...muted, margin: 0 }}>{empty}</p>
      )}
    </div>
  );
}


function StatCard({ label, value, detail }: { label: string; value: number; detail: string }) {
  return (
    <div style={card}>
      <div style={greenEyebrow}>{label}</div>
      <div style={{ fontSize: 54, fontWeight: 950, lineHeight: 1 }}>{value}</div>
      <p style={muted}>{detail}</p>
    </div>
  );
}

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [status, setStatus] = useState("Loading real members...");
  const [toast, setToast] = useState("");
  const [busyKey, setBusyKey] = useState("");
  const [rawSource, setRawSource] = useState("");
  const [currentEmail, setCurrentEmail] = useState("");
  const [ownerView, setOwnerView] = useState(false);
  const [search, setSearch] = useState("");

  async function load() {
    setStatus("Loading real members...");
    setToast("");

    try {
      const email = getEmail();
      const isOwner = isOwnerEmail(email);

      setCurrentEmail(email);
      setOwnerView(isOwner);

      if (!email) {
        throw new Error("Login email not found. Please log in again.");
      }

      const res = await fetch(`/api/admin/members?email=${encodeURIComponent(email)}&owner=${isOwner ? "1" : "0"}`, {
        cache: "no-store",
        headers: {
          "x-vf-email": email,
          "x-vf-admin": isOwner ? "1" : "0",
        },
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || data?.ok === false) {
        throw new Error(data?.error || data?.details || "Could not load members.");
      }

      setMembers(Array.isArray(data.members) ? data.members : []);
      setRawSource(data.source || data.sources_checked?.join(", ") || "api/admin/members");
      setStatus("");
    } catch (error: any) {
      setMembers([]);
      setStatus(error?.message || "Could not load real members.");
    }
  }

  async function memberAction(member: Member, action: string) {
    const adminEmail = getEmail();

    if (!isOwnerEmail(adminEmail)) {
      setToast("Owner access required. Member accounts cannot manage, activate, suspend, restore, or delete members.");
      return;
    }

    const email = cleanEmail(member.email || member.member_email);
    const id = asText(member.id || member._source_id || member.auth_user_id);
    const key = `${email || id}-${action}`;

    if (!email && !id) {
      setToast("Cannot update this record because it has no email or id.");
      return;
    }

    setBusyKey(key);
    setToast("");

    try {
      const res = await fetch("/api/admin/members", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-vf-email": adminEmail,
          "x-vf-admin": "1",
        },
        body: JSON.stringify({ email, id, action, admin_email: adminEmail }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || data?.ok === false) {
        throw new Error(data?.error || data?.details || "Member action failed.");
      }

      setToast(data?.message || `Member ${action} complete.`);
      await load();
    } catch (error: any) {
      setToast(error?.message || "Member action failed.");
    } finally {
      setBusyKey("");
    }
  }

  useEffect(() => {
    load();
  }, []);

  const realMembers = useMemo(() => members.filter(hasRealEmail), [members]);
  const demoMembers = useMemo(() => members.filter((member) => !hasRealEmail(member)), [members]);

  const counts = useMemo(() => {
    return {
      total: realMembers.length,
      pending: realMembers.filter((member) => asText(member.admin_bucket).toLowerCase() === "pending").length,
      active: realMembers.filter((member) => asText(member.admin_bucket).toLowerCase() === "active").length,
      suspended: realMembers.filter((member) => asText(member.admin_bucket).toLowerCase() === "suspended").length,
      deleted: realMembers.filter((member) => asText(member.admin_bucket).toLowerCase() === "deleted").length,
      locked: realMembers.filter((member) => asText(member.admin_bucket).toLowerCase() === "locked").length,
    };
  }, [realMembers]);

  const filteredMembers = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) return realMembers;

    return realMembers.filter((member) => {
      return [
        memberName(member),
        memberCompany(member),
        memberHeadline(member),
        cleanEmail(member.email || member.member_email),
        ...memberRoles(member),
        ...memberMarkets(member),
        ...memberStrategies(member),
        ...memberAssetTypes(member),
        ...memberNeeds(member),
        ...memberProvides(member),
      ]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [realMembers, search]);

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
          a,
          button {
            width: 100%;
            box-sizing: border-box;
          }
        }
      `}</style>

      <div style={wrap}>
        <VaultForgeMemberNav
          title="Members"
          subtitle={ownerView ? "Owner member management" : "Private member network directory"}
        />

        <section style={hero}>
          <div style={eyebrow}>VaultForge Members · Real Admin Bridge</div>
          <h1 style={{ fontSize: "clamp(56px,12vw,104px)", lineHeight: 0.88, margin: "0 0 18px" }}>
            {ownerView ? "Real member management." : "Private network directory."}
          </h1>
          <p style={{ ...muted, fontSize: 20 }}>
            {ownerView
              ? "Owner view: real member management controls are available only to the VaultForge owner account."
              : "Member view: read-only network directory. Admin controls are hidden and blocked for regular members."}
          </p>

          <div>
            <span style={chip}>Signed in: {currentEmail || "unknown"}</span>
            <span style={chip}>{ownerView ? "Owner Controls Active" : "Member Directory View"}</span>
          </div>

          {ownerView && <Link href="/admin" style={btn}>Admin Home</Link>}
          <Link href="/profile" style={ghost}>Edit Profile / Alerts</Link>
          <Link href="/dashboard" style={ghost}>Dashboard</Link>
          <Link href="/alerts" style={ghost}>Alerts</Link>
          <Link href="/routing-inbox" style={ghost}>Routing Inbox</Link>
          <Link href="/logout" style={danger}>Logout</Link>
          <button type="button" onClick={load} style={btn}>Refresh Members</button>
        </section>

        {toast && (
          <section
            style={{
              ...hero,
              color:
                toast.toLowerCase().includes("failed") || toast.toLowerCase().includes("cannot")
                  ? "#ffd0d0"
                  : "#9df3bf",
            }}
          >
            {toast}
          </section>
        )}

        <section style={{ ...grid, marginBottom: 22 }}>
          <StatCard label="Real Members" value={counts.total} detail="Real emails only. Fake @example.com hidden." />
          <StatCard label="Pending" value={counts.pending} detail="Waiting activation or payment." />
          <StatCard label="Active" value={counts.active} detail="Approved/active members." />
          <StatCard label="Suspended" value={counts.suspended} detail="Disabled records." />
          <StatCard label="Deleted" value={counts.deleted} detail="Soft-deleted records." />
        </section>

        <section style={{ ...hero, borderColor: "rgba(157,243,191,.22)" }}>
          <div style={greenEyebrow}>API Source</div>
          <p style={muted}>
            Source: {rawSource || "not loaded yet"} · Mode: {ownerView ? "Owner management" : "Member read-only"}
            <br />
            Raw records returned: {members.length}
            <br />
            Demo/fake records hidden: {demoMembers.length}
          </p>
        </section>


        <section style={{ ...hero, borderColor: "rgba(232,196,107,.22)" }}>
          <div style={greenEyebrow}>Network Search</div>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search members by name, role, market, strategy, needs, or what they provide..."
            style={{
              width: "100%",
              boxSizing: "border-box",
              borderRadius: 18,
              border: "1px solid rgba(255,255,255,.18)",
              background: "rgba(255,255,255,.075)",
              color: "white",
              padding: 14,
              fontSize: 15,
            }}
          />
        </section>

        {status && <section style={hero}>{status}</section>}

        {!status && realMembers.length === 0 && (
          <section style={hero}>
            <strong>No real members found.</strong>
            <p style={muted}>
              If you created a new login and filled a profile, the profile save route is not writing into
              <strong> vf_profiles / profiles / member_profiles / vf_members</strong> with a real email.
            </p>
            <p style={muted}>
              Next fix after this is <strong>app/api/profile/route.ts</strong>.
            </p>
          </section>
        )}

        <section style={{ display: "grid", gap: 18 }}>
          {filteredMembers.map((member) => {
            const email = cleanEmail(member.email || member.member_email);
            const bucket = asText(member.admin_bucket, "locked");
            const tone = bucketTone(bucket);
            const key = memberKey(member);

            return (
              <article key={key} style={{ ...card, borderColor: `${tone}66` }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                  <span style={{ ...chip, color: tone, borderColor: `${tone}88` }}>{bucket}</span>
                  <span style={chip}>{asText(member._source_table, "unknown table")}</span>
                  <span style={chip}>Profile: {member.profile_complete ? "Complete" : "Incomplete"}</span>
                  <span style={chip}>Payment: {asText(member.payment_status, "unpaid")}</span>
                  <span style={chip}>Access: {asText(member.access_status, "locked")}</span>
                </div>

                <h2 style={{ fontSize: "clamp(30px,7vw,52px)", lineHeight: 1, margin: "0 0 10px" }}>
                  {memberName(member)}
                </h2>

                <p style={{ ...muted, fontSize: 18 }}>
                  {memberCompany(member) && (
                    <>
                      <strong style={{ color: "#e8c46b" }}>{memberCompany(member)}</strong>
                      <br />
                    </>
                  )}
                  <strong style={{ color: "#9df3bf" }}>{email}</strong>
                  {ownerView && (
                    <>
                      <br />
                      ID: {asText(member.id || member._source_id || member.auth_user_id, "—")}
                      <br />
                      Created: {formatDate(member.created_at)}
                      <br />
                      Updated: {formatDate(member.updated_at)}
                    </>
                  )}
                </p>

                <section
                  style={{
                    border: "1px solid rgba(255,255,255,.10)",
                    background: "rgba(255,255,255,.035)",
                    borderRadius: 22,
                    padding: 16,
                    margin: "14px 0",
                  }}
                >
                  <div style={greenEyebrow}>Network Intelligence</div>
                  <p style={{ ...muted, fontSize: 17, marginTop: 0 }}>
                    {memberHeadline(member)}
                  </p>

                  <ChipList
                    title="Roles / Member Type"
                    values={memberRoles(member)}
                    empty="No roles listed yet."
                  />

                  <ChipList
                    title="Markets"
                    values={memberMarkets(member)}
                    empty="No markets listed yet."
                  />

                  <ChipList
                    title="Strategies"
                    values={memberStrategies(member)}
                    empty="No strategies listed yet."
                  />

                  <ChipList
                    title="Asset Focus"
                    values={memberAssetTypes(member)}
                    empty="No asset focus listed yet."
                  />

                  <ChipList
                    title="Needs"
                    values={memberNeeds(member)}
                    empty="No needs listed yet."
                  />

                  <ChipList
                    title="Can Provide"
                    values={memberProvides(member)}
                    empty="No provider abilities listed yet."
                  />
                </section>

                {ownerView ? (
                  <div>
                    <button type="button" disabled={busyKey === `${email}-activate`} onClick={() => memberAction(member, "activate")} style={btn}>
                      Activate
                    </button>
                    <button type="button" disabled={busyKey === `${email}-mark_paid`} onClick={() => memberAction(member, "mark_paid")} style={btn}>
                      Mark Paid
                    </button>
                    <button type="button" disabled={busyKey === `${email}-mark_unpaid`} onClick={() => memberAction(member, "mark_unpaid")} style={ghost}>
                      Mark Unpaid
                    </button>
                    <button type="button" disabled={busyKey === `${email}-lock`} onClick={() => memberAction(member, "lock")} style={ghost}>
                      Lock
                    </button>
                    <button type="button" disabled={busyKey === `${email}-suspend`} onClick={() => memberAction(member, "suspend")} style={danger}>
                      Suspend
                    </button>
                    <button type="button" disabled={busyKey === `${email}-restore`} onClick={() => memberAction(member, "restore")} style={ghost}>
                      Restore
                    </button>
                    <button type="button" disabled={busyKey === `${email}-delete`} onClick={() => memberAction(member, "delete")} style={danger}>
                      Delete
                    </button>
                  </div>
                ) : (
                  <div>
                    <Link href={`/messages/new?to=${encodeURIComponent(email)}`} style={btn}>Message / Request Connection</Link>
                    <Link href="/introductions" style={ghost}>Introductions</Link>
                    <Link href="/routing-inbox" style={ghost}>View Routing</Link>
                  </div>
                )}
              </article>
            );
          })}
        </section>
      </div>
    </main>
  );
}