"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import VaultForgeMemberNav from "../components/VaultForgeMemberNav";
import {
  VaultForgePulseStrip,
  VaultForgeSignalBar,
  VaultForgeCommandFooter,
  VaultForgeStatGrid,
} from "../components/VaultForgeVisualLayer";

type Member = Record<string, any>;

const OWNER_EMAIL = "bcrsoutheast@gmail.com";
const LOGO_SRC = "/vaultforge-logo.png";

const NETWORK_STATES = [
  { label: "Georgia", short: "GA", keys: ["georgia", "ga"] },
  { label: "Tennessee", short: "TN", keys: ["tennessee", "tn"] },
  { label: "Alabama", short: "AL", keys: ["alabama", "al"] },
  { label: "Florida", short: "FL", keys: ["florida", "fl"] },
  { label: "Texas", short: "TX", keys: ["texas", "tx"] },
  { label: "North Carolina", short: "NC", keys: ["north carolina", "nc", "n.c."] },
  { label: "South Carolina", short: "SC", keys: ["south carolina", "sc", "s.c."] },
];

function cleanEmail(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

function asText(value: unknown, fallback = "") {
  const text = String(value || "").trim();
  return text || fallback;
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
  if (b === "active") return "#22c55e";
  if (b === "pending") return "#e8c46b";
  if (b === "suspended" || b === "deleted") return "#ef4444";
  return "#cbd5e1";
}

function hasRealEmail(member: Member) {
  const email = cleanEmail(member.email || member.member_email);
  return email.includes("@") && !email.endsWith("@example.com") && email !== "test@test.com";
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
    return value.map((item) => asText(item)).filter(Boolean).slice(0, 8);
  }

  const text = asText(value);
  if (!text) return [];

  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => asText(item)).filter(Boolean).slice(0, 8);
    }
  } catch {
    // Continue.
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

function stateMatchesMember(member: Member, stateKeys: string[]) {
  const text = [
    member.markets,
    member.market_states,
    member.buy_box_states,
    member.states,
    member.state,
    member.service_states,
    member.location,
    member.market,
    ...memberMarkets(member),
  ]
    .join(" ")
    .toLowerCase();

  return stateKeys.some((key) => text.includes(key.toLowerCase()));
}

function messageHrefFor(email: string) {
  const encoded = encodeURIComponent(email);
  return `/messages/new?to=${encoded}&recipient=${encoded}&owner_email=${encoded}&member_email=${encoded}`;
}

function aiMatchScore(member: Member) {
  let score = 42;
  if (memberRoles(member).length) score += 12;
  if (memberMarkets(member).length) score += 12;
  if (memberStrategies(member).length) score += 10;
  if (memberNeeds(member).length) score += 10;
  if (memberProvides(member).length) score += 10;
  if (asText(member.profile_complete).toLowerCase() === "true" || member.profile_complete === true) score += 4;
  return Math.max(0, Math.min(100, score));
}

function aiStrategy(member: Member) {
  const roles = memberRoles(member).join(" ").toLowerCase();
  const needs = memberNeeds(member).join(" ").toLowerCase();
  const provides = memberProvides(member).join(" ").toLowerCase();
  const strategies = memberStrategies(member).join(" ").toLowerCase();

  if (roles.includes("lender") || provides.includes("capital") || needs.includes("capital")) {
    return "Route capital requests, funding gaps, and bridge/JV opportunities here first.";
  }

  if (roles.includes("contractor") || roles.includes("operator") || provides.includes("construction") || provides.includes("operator")) {
    return "Best fit for stalled construction, boots-on-ground checks, inspections, repairs, and execution problems.";
  }

  if (roles.includes("buyer") || strategies.includes("buy") || needs.includes("deals")) {
    return "Route off-market opportunities, distressed seller signals, and buyer-needed cards for fast review.";
  }

  return "Use as a network node. Match by state, strategy, asset type, and stated needs before routing.";
}

function routeSuggestion(member: Member) {
  const markets = memberMarkets(member);
  const roles = memberRoles(member);
  const needs = memberNeeds(member);

  const market = markets[0] || "their active market";
  const role = roles[0] || "member role";
  const need = needs[0] || "current stated need";

  return `Prioritize ${market} signals where ${role} fit and ${need} overlap.`;
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
      <div style={styles.smallEyebrow}>{title}</div>
      {values.length ? (
        <div>
          {values.map((value) => (
            <span key={`${title}-${value}`} style={styles.chip}>
              {value}
            </span>
          ))}
        </div>
      ) : (
        <p style={{ ...styles.muted, margin: 0 }}>{empty}</p>
      )}
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
  const [stateFilter, setStateFilter] = useState("");
  const [workspaceFilter, setWorkspaceFilter] = useState("all");

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
    };
  }, [realMembers]);

  const stateCounts = useMemo(() => {
    return NETWORK_STATES.map((state) => ({
      ...state,
      count: realMembers.filter((member) => stateMatchesMember(member, state.keys)).length,
    }));
  }, [realMembers]);

  const filteredMembers = useMemo(() => {
    const q = search.trim().toLowerCase();
    const selectedState = NETWORK_STATES.find((state) => state.short === stateFilter || state.label === stateFilter);

    return realMembers.filter((member) => {
      const stateOk = selectedState ? stateMatchesMember(member, selectedState.keys) : true;
      if (!stateOk) return false;

      const bucket = asText(member.admin_bucket, "network").toLowerCase();

      if (workspaceFilter === "active" && bucket !== "active") return false;
      if (workspaceFilter === "pending" && bucket !== "pending") return false;
      if (workspaceFilter === "needs-routing" && memberNeeds(member).length === 0) return false;
      if (workspaceFilter === "providers" && memberProvides(member).length === 0) return false;

      if (!q) return true;

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
  }, [realMembers, search, stateFilter, workspaceFilter]);

  const urgent = counts.pending + counts.suspended;
  const high = realMembers.filter((member) => aiMatchScore(member) >= 75).length;
  const normal = Math.max(0, counts.total - urgent - high);

  return (
    <main style={styles.page}>
      <style>{`
        a:hover,
        button:hover {
          transform: translateY(-1px);
          transition: all .18s ease;
          filter: brightness(1.06);
        }

        input::placeholder {
          color: rgba(255,255,255,.42);
        }

        @media (max-width: 760px) {
          .vf-actions,
          .vf-logo-row {
            display: grid !important;
            grid-template-columns: 1fr !important;
          }

          .vf-actions > *,
          .vf-logo-row > * {
            width: 100%;
            box-sizing: border-box;
          }

          a,
          button {
            width: 100%;
            box-sizing: border-box;
          }
        }
      `}</style>

      <div style={styles.wrap}>
        <section style={styles.logoHeader}>
          <div className="vf-logo-row" style={styles.logoRow}>
            <Link href="/dashboard" style={styles.logoLink}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={LOGO_SRC} alt="VaultForge" style={styles.logo} />
            </Link>

            <div style={{ minWidth: 0 }}>
              <p style={styles.eyebrow}>VAULTFORGE PRIVATE NETWORK</p>
              <h1 style={styles.logoTitle}>Member command network.</h1>
              <p style={styles.muted}>
                State coverage, member needs, provider capability, AI routing notes, and clean workstation controls.
              </p>
            </div>
          </div>
        </section>

        <VaultForgeMemberNav
          title="Members"
          subtitle={ownerView ? "Owner member management" : "Private member network directory"}
        />

        <VaultForgePulseStrip
          items={[
            { label: "MEMBERS", value: counts.total || "READY", tone: "gold" },
            { label: "ACTIVE", value: counts.active, tone: "green" },
            { label: "PENDING", value: counts.pending, tone: "gold" },
            { label: "ROUTING FIT", value: high, tone: "silver" },
          ]}
        />

        <VaultForgeSignalBar urgent={urgent} high={high} normal={normal} active={counts.active} routed={high} messages={0} />

        <section style={styles.hero}>
          <p style={styles.eyebrow}>VaultForge Members · Private Execution Network</p>
          <h2 style={styles.heroTitle}>
            {ownerView ? "Real member management." : "Private network directory."}
          </h2>
          <p style={{ ...styles.muted, fontSize: 18 }}>
            {ownerView
              ? "Owner view: manage access, activation, payment state, and routing intelligence without mixing admin controls into member workflow."
              : "Member view: search the private network by state, strategy, needs, and what each member can provide."}
          </p>

          <div style={{ marginTop: 16 }}>
            <span style={styles.chip}>Signed in: {currentEmail || "unknown"}</span>
            <span style={styles.chip}>{ownerView ? "Owner Controls Active" : "Member Directory View"}</span>
            <span style={styles.chip}>API: {rawSource || "loading"}</span>
            <span style={styles.chip}>Fake records hidden: {demoMembers.length}</span>
          </div>

          <div className="vf-actions" style={styles.actionRow}>
            {ownerView && <Link href="/admin" style={styles.primaryBtn}>Admin Home</Link>}
            <Link href="/profile" style={styles.ghostBtn}>Edit Profile</Link>
            <Link href="/dashboard" style={styles.ghostBtn}>Dashboard</Link>
            <Link href="/intelligence" style={styles.ghostBtn}>Intelligence</Link>
            <Link href="/routing-inbox" style={styles.ghostBtn}>Routing Inbox</Link>
            <Link href="/messages" style={styles.ghostBtn}>Messages</Link>
            <Link href="/logout" style={styles.dangerBtn}>Logout</Link>
            <button type="button" onClick={load} style={styles.primaryBtn}>Refresh Members</button>
          </div>
        </section>

        {toast && (
          <section
            style={{
              ...styles.hero,
              color:
                toast.toLowerCase().includes("failed") || toast.toLowerCase().includes("cannot")
                  ? "#ffd0d0"
                  : "#bbf7d0",
            }}
          >
            {toast}
          </section>
        )}

        <VaultForgeStatGrid
          stats={[
            { label: "Real Members", value: counts.total, detail: "Real emails only. Fake examples hidden.", tone: "gold" },
            { label: "Active", value: counts.active, detail: "Approved/active network users.", tone: "green" },
            { label: "Pending", value: counts.pending, detail: "Waiting activation or payment.", tone: "gold" },
            { label: "High-Fit Nodes", value: high, detail: "Profiles with stronger routing data.", tone: "silver" },
          ]}
        />

        <section style={styles.hero}>
          <p style={styles.eyebrow}>Member Network by State</p>
          <h2 style={styles.sectionTitle}>Southeast operator map.</h2>
          <p style={{ ...styles.muted, fontSize: 17 }}>
            Click a state to filter the private member network by market coverage.
          </p>

          <div style={styles.stateGrid}>
            <button
              type="button"
              onClick={() => setStateFilter("")}
              style={{
                ...styles.stateCard,
                borderColor: !stateFilter ? "rgba(232,196,107,.75)" : "rgba(255,255,255,.14)",
              }}
            >
              <p style={styles.smallEyebrow}>ALL</p>
              <strong style={styles.stateNumber}>{realMembers.length}</strong>
              <span style={styles.muted}>All member markets</span>
            </button>

            {stateCounts.map((state) => (
              <button
                key={state.short}
                type="button"
                onClick={() => setStateFilter(state.short)}
                style={{
                  ...styles.stateCard,
                  borderColor: stateFilter === state.short ? "rgba(232,196,107,.75)" : "rgba(255,255,255,.14)",
                }}
              >
                <p style={styles.smallEyebrow}>{state.short}</p>
                <strong style={styles.stateNumber}>{state.count}</strong>
                <span style={styles.muted}>{state.label}</span>
              </button>
            ))}
          </div>
        </section>

        <section style={styles.hero}>
          <p style={styles.eyebrow}>Workspace Filters</p>

          <div className="vf-actions" style={styles.actionRow}>
            {[
              ["all", "All Members"],
              ["active", "Active"],
              ["pending", "Pending"],
              ["needs-routing", "Has Needs"],
              ["providers", "Can Provide"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setWorkspaceFilter(value)}
                style={workspaceFilter === value ? styles.primaryBtn : styles.ghostBtn}
              >
                {label}
              </button>
            ))}
          </div>

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search members by name, role, market, strategy, needs, or what they provide..."
            style={styles.input}
          />

          <p style={styles.muted}>
            Showing {filteredMembers.length} of {realMembers.length} members
            {stateFilter ? ` · State filter: ${stateFilter}` : ""} · Workspace filter: {workspaceFilter}.
          </p>
        </section>

        {status && <section style={styles.hero}>{status}</section>}

        {!status && realMembers.length === 0 && (
          <section style={styles.hero}>
            <strong>No real members found.</strong>
            <p style={styles.muted}>
              If you created a new login and filled a profile, profile save is not writing into a member/profile table with a real email.
            </p>
          </section>
        )}

        {!status && filteredMembers.length === 0 && realMembers.length > 0 && (
          <section style={styles.hero}>
            <strong>No members match this filter.</strong>
            <p style={styles.muted}>Clear the state filter or search term to see the full private network.</p>
          </section>
        )}

        <section style={{ display: "grid", gap: 16 }}>
          {filteredMembers.map((member) => {
            const email = cleanEmail(member.email || member.member_email);
            const bucket = asText(member.admin_bucket, "network");
            const tone = bucketTone(bucket);
            const key = memberKey(member);
            const score = aiMatchScore(member);

            return (
              <article key={key} style={{ ...styles.memberCard, borderColor: `${tone}66` }}>
                <div style={styles.memberTop}>
                  <div>
                    <p style={{ ...styles.smallEyebrow, color: tone }}>{bucket}</p>
                    <h2 style={styles.memberName}>{memberName(member)}</h2>
                    <p style={{ ...styles.muted, fontSize: 16 }}>
                      {memberCompany(member) ? (
                        <>
                          <strong style={{ color: "#f8e7b0" }}>{memberCompany(member)}</strong>
                          <br />
                        </>
                      ) : null}
                      <strong style={{ color: "#e5e7eb" }}>{email}</strong>
                    </p>
                  </div>

                  <div style={styles.scoreBox}>
                    <p style={styles.smallEyebrow}>AI FIT</p>
                    <strong style={styles.score}>{score}</strong>
                    <span style={styles.muted}>Routing score</span>
                  </div>
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                  <span style={styles.chip}>{asText(member._source_table, "member directory")}</span>
                  <span style={styles.chip}>Profile: {member.profile_complete ? "Complete" : "Incomplete"}</span>
                  {ownerView && <span style={styles.chip}>Payment: {asText(member.payment_status, "unpaid")}</span>}
                  <span style={styles.chip}>Access: {asText(member.access_status, "member")}</span>
                  {ownerView && <span style={styles.chip}>Updated: {formatDate(member.updated_at)}</span>}
                </div>

                <section style={styles.aiPanel}>
                  <p style={styles.smallEyebrow}>AI Strategy / Routing Note</p>
                  <p style={{ ...styles.muted, fontSize: 16, marginTop: 0 }}>{aiStrategy(member)}</p>
                  <p style={{ ...styles.muted, marginBottom: 0 }}>
                    <strong style={{ color: "#f8e7b0" }}>Suggested route:</strong> {routeSuggestion(member)}
                  </p>
                </section>

                <section style={styles.intelPanel}>
                  <p style={styles.smallEyebrow}>Network Intelligence</p>
                  <p style={{ ...styles.muted, fontSize: 16, marginTop: 0 }}>
                    {memberHeadline(member)}
                  </p>

                  <ChipList title="Roles / Member Type" values={memberRoles(member)} empty="No roles listed yet." />
                  <ChipList title="Markets" values={memberMarkets(member)} empty="No markets listed yet." />
                  <ChipList title="Strategies" values={memberStrategies(member)} empty="No strategies listed yet." />
                  <ChipList title="Asset Focus" values={memberAssetTypes(member)} empty="No asset focus listed yet." />
                  <ChipList title="Needs" values={memberNeeds(member)} empty="No needs listed yet." />
                  <ChipList title="Can Provide" values={memberProvides(member)} empty="No provider abilities listed yet." />
                </section>

                <section style={styles.workspacePanel}>
                  <p style={styles.smallEyebrow}>Workspace Controls</p>
                  <div className="vf-actions" style={styles.actionRow}>
                    <Link href={messageHrefFor(email)} style={styles.primaryBtn}>Message / Request Connection</Link>
                    <Link href={`/routing-inbox?member=${encodeURIComponent(email)}`} style={styles.ghostBtn}>Route / Match</Link>
                    <Link href="/introductions" style={styles.ghostBtn}>Introductions</Link>
                    <Link href="/intelligence" style={styles.ghostBtn}>Find Signals</Link>
                    <button type="button" style={styles.ghostBtn} onClick={() => setToast(`Saved ${memberName(member)} to workstation watchlist.`)}>
                      Save / Watch
                    </button>
                    <button type="button" style={styles.ghostBtn} onClick={() => setToast(`${memberName(member)} pinned for routing review.`)}>
                      Pin Review
                    </button>
                    <button type="button" style={styles.ghostBtn} onClick={() => setToast(`${memberName(member)} archived from this workstation view only.`)}>
                      Archive View
                    </button>
                  </div>
                </section>

                {ownerView ? (
                  <section style={styles.adminPanel}>
                    <p style={styles.smallEyebrow}>Owner Controls</p>
                    <div className="vf-actions" style={styles.actionRow}>
                      <button type="button" disabled={busyKey === `${email}-activate`} onClick={() => memberAction(member, "activate")} style={styles.primaryBtn}>
                        Activate
                      </button>
                      <button type="button" disabled={busyKey === `${email}-mark_paid`} onClick={() => memberAction(member, "mark_paid")} style={styles.primaryBtn}>
                        Mark Paid
                      </button>
                      <button type="button" disabled={busyKey === `${email}-mark_unpaid`} onClick={() => memberAction(member, "mark_unpaid")} style={styles.ghostBtn}>
                        Mark Unpaid
                      </button>
                      <button type="button" disabled={busyKey === `${email}-lock`} onClick={() => memberAction(member, "lock")} style={styles.ghostBtn}>
                        Lock
                      </button>
                      <button type="button" disabled={busyKey === `${email}-suspend`} onClick={() => memberAction(member, "suspend")} style={styles.dangerBtn}>
                        Suspend
                      </button>
                      <button type="button" disabled={busyKey === `${email}-restore`} onClick={() => memberAction(member, "restore")} style={styles.ghostBtn}>
                        Restore
                      </button>
                      <button type="button" disabled={busyKey === `${email}-delete`} onClick={() => memberAction(member, "delete")} style={styles.dangerBtn}>
                        Delete
                      </button>
                    </div>
                  </section>
                ) : null}
              </article>
            );
          })}
        </section>

        <VaultForgeCommandFooter />
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at top left, rgba(232,196,107,.14), transparent 30%), radial-gradient(circle at bottom right, rgba(148,163,184,.10), transparent 32%), linear-gradient(180deg,#020303,#07090d 50%,#020303)",
    color: "white",
    padding: "22px 16px 82px",
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  wrap: { width: "min(1240px,100%)", margin: "0 auto" },
  logoHeader: {
    border: "1px solid rgba(232,196,107,.24)",
    borderRadius: 28,
    padding: 18,
    background: "linear-gradient(135deg,rgba(255,255,255,.07),rgba(255,255,255,.025))",
    boxShadow: "0 24px 80px rgba(0,0,0,.34)",
    marginBottom: 16,
  },
  logoRow: {
    display: "grid",
    gridTemplateColumns: "230px minmax(0,1fr)",
    gap: 20,
    alignItems: "center",
  },
  logoLink: {
    display: "block",
    borderRadius: 22,
    overflow: "hidden",
    border: "1px solid rgba(232,196,107,.22)",
    background: "rgba(0,0,0,.45)",
    boxShadow: "0 0 42px rgba(232,196,107,.14)",
  },
  logo: {
    width: "100%",
    height: 138,
    display: "block",
    objectFit: "cover",
    objectPosition: "center",
  },
  logoTitle: {
    fontSize: "clamp(34px,7vw,72px)",
    lineHeight: 0.9,
    margin: "0 0 12px",
    letterSpacing: "-.055em",
  },
  hero: {
    border: "1px solid rgba(232,196,107,.28)",
    borderRadius: 30,
    padding: 24,
    background: "linear-gradient(135deg,rgba(255,255,255,.075),rgba(255,255,255,.026))",
    boxShadow: "0 28px 90px rgba(0,0,0,.38)",
    marginBottom: 16,
  },
  eyebrow: {
    color: "#e8c46b",
    fontSize: 12,
    letterSpacing: ".18em",
    textTransform: "uppercase",
    fontWeight: 950,
    margin: "0 0 10px",
  },
  smallEyebrow: {
    color: "#e8c46b",
    fontSize: 11,
    letterSpacing: ".16em",
    textTransform: "uppercase",
    fontWeight: 950,
    margin: "0 0 8px",
  },
  heroTitle: {
    fontSize: "clamp(44px,8vw,88px)",
    lineHeight: 0.88,
    margin: 0,
    letterSpacing: "-.06em",
  },
  sectionTitle: {
    fontSize: "clamp(34px,7vw,62px)",
    lineHeight: 0.95,
    margin: "0 0 12px",
  },
  muted: { color: "#cbd5e1", lineHeight: 1.55 },
  chip: {
    display: "inline-flex",
    border: "1px solid rgba(255,255,255,.14)",
    color: "#e5e7eb",
    background: "rgba(255,255,255,.055)",
    borderRadius: 999,
    padding: "8px 11px",
    fontWeight: 850,
    fontSize: 12,
    margin: "0 7px 7px 0",
  },
  actionRow: { display: "flex", flexWrap: "wrap", gap: 10, marginTop: 14 },
  primaryBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#101010",
    background: "linear-gradient(135deg,#f8e7b0,#e8c46b)",
    border: "1px solid rgba(232,196,107,.7)",
    textDecoration: "none",
    borderRadius: 15,
    padding: "12px 15px",
    fontWeight: 950,
    minHeight: 45,
    cursor: "pointer",
  },
  ghostBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    color: "white",
    background: "rgba(255,255,255,.055)",
    border: "1px solid rgba(255,255,255,.14)",
    textDecoration: "none",
    borderRadius: 15,
    padding: "12px 15px",
    fontWeight: 850,
    minHeight: 45,
    cursor: "pointer",
  },
  dangerBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fecaca",
    background: "rgba(127,29,29,.16)",
    border: "1px solid rgba(239,68,68,.34)",
    textDecoration: "none",
    borderRadius: 15,
    padding: "12px 15px",
    fontWeight: 850,
    minHeight: 45,
    cursor: "pointer",
  },
  stateGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(145px,1fr))",
    gap: 12,
    marginTop: 16,
  },
  stateCard: {
    border: "1px solid rgba(255,255,255,.14)",
    borderRadius: 22,
    padding: 16,
    background: "rgba(255,255,255,.045)",
    color: "white",
    textAlign: "left",
    cursor: "pointer",
  },
  stateNumber: {
    display: "block",
    fontSize: 42,
    lineHeight: 1,
    color: "#f8e7b0",
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    minHeight: 54,
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,.16)",
    background: "rgba(255,255,255,.07)",
    color: "white",
    padding: "0 16px",
    fontSize: 16,
    outline: "none",
    marginTop: 14,
  },
  memberCard: {
    border: "1px solid rgba(232,196,107,.18)",
    borderRadius: 26,
    padding: 20,
    background: "linear-gradient(180deg,rgba(255,255,255,.065),rgba(255,255,255,.026))",
    boxShadow: "0 20px 70px rgba(0,0,0,.25)",
  },
  memberTop: {
    display: "grid",
    gridTemplateColumns: "minmax(0,1fr) 130px",
    gap: 16,
    alignItems: "start",
  },
  memberName: {
    fontSize: "clamp(30px,7vw,52px)",
    lineHeight: 1,
    margin: "0 0 10px",
    letterSpacing: "-.04em",
  },
  scoreBox: {
    border: "1px solid rgba(232,196,107,.22)",
    borderRadius: 20,
    padding: 14,
    background: "rgba(0,0,0,.28)",
    textAlign: "center",
  },
  score: {
    display: "block",
    fontSize: 44,
    lineHeight: 1,
    color: "#f8e7b0",
  },
  aiPanel: {
    border: "1px solid rgba(232,196,107,.18)",
    background: "rgba(232,196,107,.055)",
    borderRadius: 22,
    padding: 16,
    margin: "14px 0",
  },
  intelPanel: {
    border: "1px solid rgba(255,255,255,.10)",
    background: "rgba(255,255,255,.035)",
    borderRadius: 22,
    padding: 16,
    margin: "14px 0",
  },
  workspacePanel: {
    border: "1px solid rgba(255,255,255,.10)",
    background: "rgba(255,255,255,.025)",
    borderRadius: 22,
    padding: 16,
    marginTop: 14,
  },
  adminPanel: {
    border: "1px solid rgba(239,68,68,.22)",
    background: "rgba(127,29,29,.10)",
    borderRadius: 22,
    padding: 16,
    marginTop: 14,
  },
};
