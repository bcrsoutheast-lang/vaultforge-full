"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import Link from "next/link";
import VaultForgeMemberNav from "../components/VaultForgeMemberNav";

export const dynamic = "force-dynamic";

type Member = Record<string, any>;

const OWNER_EMAIL = "bcrsoutheast@gmail.com";

const STATES = [
  "Georgia",
  "Florida",
  "North Carolina",
  "South Carolina",
  "Tennessee",
  "Alabama",
  "Texas",
];

const ROLE_OPTIONS = [
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

const STATE_ALIASES: Record<string, string> = {
  ga: "Georgia",
  georgia: "Georgia",
  fl: "Florida",
  florida: "Florida",
  nc: "North Carolina",
  "north carolina": "North Carolina",
  sc: "South Carolina",
  "south carolina": "South Carolina",
  tn: "Tennessee",
  tennessee: "Tennessee",
  al: "Alabama",
  alabama: "Alabama",
  tx: "Texas",
  texas: "Texas",
};

function clean(value: unknown) {
  return String(value || "").trim();
}

function cleanEmail(value: unknown) {
  return clean(value).toLowerCase();
}

function normalizeState(value: unknown) {
  const raw = clean(value).toLowerCase();
  if (!raw || raw === "all") return "";
  return STATE_ALIASES[raw] || "";
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
    return cleanEmail(
      window.localStorage.getItem("vf_email") ||
        window.sessionStorage.getItem("vf_email") ||
        readCookie("vf_email") ||
        readCookie("vf_admin_email") ||
        ""
    );
  } catch {
    return cleanEmail(readCookie("vf_email") || readCookie("vf_admin_email") || "");
  }
}

function isOwnerMode(email: string) {
  return (
    cleanEmail(email) === OWNER_EMAIL ||
    readCookie("vf_admin") === "1" ||
    readCookie("isAdmin") === "true" ||
    cleanEmail(readCookie("vf_admin_email")) === OWNER_EMAIL
  );
}

function first(...values: unknown[]) {
  for (const value of values) {
    const text = clean(value);
    if (text) return text;
  }
  return "";
}

function asArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(clean).filter(Boolean);

  const raw = clean(value);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.map(clean).filter(Boolean);
  } catch {
    // Keep going and split the raw value.
  }

  return raw
    .split(/[,\\n|;]/)
    .map(clean)
    .filter(Boolean);
}

function meta(member: Member) {
  return typeof member?.metadata === "object" && member.metadata ? member.metadata : {};
}

function unique(values: string[]) {
  return Array.from(new Set(values.map(clean).filter(Boolean)));
}

function memberId(member: Member) {
  const m = meta(member);
  return first(member.id, member.profile_id, member.member_id, member._source_id, member.auth_user_id, member.email, m.id, m.profile_id);
}

function memberEmail(member: Member) {
  const m = meta(member);
  return cleanEmail(first(member.email, member.member_email, member.owner_email, m.email, m.member_email, m.owner_email));
}

function memberName(member: Member) {
  const m = meta(member);
  return first(member.full_name, member.name, member.display_name, member.company, member.member_name, m.full_name, m.name, m.display_name, memberEmail(member), "VaultForge Member");
}

function companyOf(member: Member) {
  const m = meta(member);
  return first(member.company, member.company_name, member.business_name, m.company, m.company_name, m.business_name, "VaultForge");
}

function hasRealEmail(member: Member) {
  const email = memberEmail(member);
  return email.includes("@") && !email.endsWith("@example.com");
}

function memberRoles(member: Member) {
  const m = meta(member);
  return unique([
    ...asArray(member.member_types),
    ...asArray(member.member_type),
    ...asArray(member.roles),
    ...asArray(member.role),
    ...asArray(member.primary_role),
    ...asArray(m.member_types),
    ...asArray(m.member_type),
    ...asArray(m.roles),
    ...asArray(m.role),
  ]);
}

function memberBaseState(member: Member) {
  const m = meta(member);

  const raw = first(
    member.home_state,
    member.based_state,
    member.base_state,
    member.from_state,
    member.member_state,
    member.state,
    member.primary_state,
    member.location_state,
    m.home_state,
    m.based_state,
    m.base_state,
    m.from_state,
    m.member_state,
    m.state,
    m.primary_state,
    m.location_state
  );

  return normalizeState(raw);
}

function memberMarkets(member: Member) {
  const m = meta(member);

  return unique([
    ...asArray(member.markets),
    ...asArray(member.operating_states),
    ...asArray(member.buy_box_states),
    ...asArray(member.market_states),
    ...asArray(member.service_states),
    ...asArray(member.target_states),
    ...asArray(m.markets),
    ...asArray(m.operating_states),
    ...asArray(m.buy_box_states),
    ...asArray(m.market_states),
    ...asArray(m.service_states),
    ...asArray(m.target_states),
    memberBaseState(member),
  ].map(normalizeState).filter(Boolean));
}

function memberStrategies(member: Member) {
  const m = meta(member);
  return unique([...asArray(member.strategies), ...asArray(member.strategy), ...asArray(member.asset_focus), ...asArray(m.strategies), ...asArray(m.strategy), ...asArray(m.asset_focus)]).slice(0, 10);
}

function memberProvides(member: Member) {
  const m = meta(member);
  return unique([...asArray(member.can_provide), ...asArray(member.what_i_provide), ...asArray(member.provides), ...asArray(member.capabilities), ...asArray(m.can_provide), ...asArray(m.what_i_provide), ...asArray(m.provides), ...asArray(m.capabilities)]).slice(0, 10);
}

function memberNeeds(member: Member) {
  const m = meta(member);
  return unique([...asArray(member.needs), ...asArray(member.deal_needs), ...asArray(member.what_i_need), ...asArray(member.looking_for), ...asArray(m.needs), ...asArray(m.deal_needs), ...asArray(m.what_i_need), ...asArray(m.looking_for)]).slice(0, 10);
}

function memberBio(member: Member) {
  const m = meta(member);
  return first(member.bio, member.description, member.strategy_summary, member.buy_box, member.notes, m.bio, m.description, m.strategy_summary, m.buy_box, "Private member profile ready for opportunity alignment.");
}

function statusOf(member: Member) {
  return first(member.access_status, member.member_status, member.status, member.payment_status, "member").toLowerCase();
}

function accepted(member: Member) {
  const text = `${statusOf(member)} ${first(member.network_status, member.accepted_network, meta(member).network_status, meta(member).accepted_network)}`.toLowerCase();
  return text.includes("active") || text.includes("accepted") || text.includes("member") || text.includes("paid");
}

function scoreOf(member: Member) {
  let score = Number(member.alignment_score || member.match_score || member.score || 0);
  if (!Number.isFinite(score) || score <= 0) score = 50;
  if (memberBaseState(member)) score += 12;
  if (memberMarkets(member).length) score += 10;
  if (memberRoles(member).length) score += 8;
  if (memberProvides(member).length) score += 8;
  if (memberNeeds(member).length) score += 6;
  if (accepted(member)) score += 8;
  return Math.min(100, Math.max(0, Math.round(score)));
}

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

const page: CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(232,196,107,.14), transparent 28%), radial-gradient(circle at 88% 10%, rgba(74,222,128,.10), transparent 26%), linear-gradient(180deg,#020303,#071326 55%,#020303)",
  color: "white",
  padding: "22px 16px 96px",
  fontFamily: "Arial, sans-serif",
};

const wrap: CSSProperties = { width: "min(1220px,100%)", margin: "0 auto" };

const panel: CSSProperties = {
  border: "1px solid rgba(232,196,107,.24)",
  borderRadius: 30,
  padding: 24,
  background: "linear-gradient(145deg,rgba(255,255,255,.070),rgba(255,255,255,.030))",
  boxShadow: "0 28px 86px rgba(0,0,0,.30)",
  marginBottom: 18,
};

const glass: CSSProperties = {
  border: "1px solid rgba(255,255,255,.12)",
  borderRadius: 22,
  padding: 18,
  background: "rgba(255,255,255,.045)",
};

const eyebrow: CSSProperties = {
  color: "#e8c46b",
  letterSpacing: ".18em",
  textTransform: "uppercase",
  fontWeight: 950,
  fontSize: 12,
};

const muted: CSSProperties = { color: "#cbd5e1", lineHeight: 1.55 };

const button: CSSProperties = {
  display: "inline-flex",
  justifyContent: "center",
  alignItems: "center",
  minHeight: 50,
  borderRadius: 999,
  padding: "12px 18px",
  border: 0,
  background: "linear-gradient(135deg,#f8e7b0,#e8c46b)",
  color: "#06100a",
  fontWeight: 950,
  textDecoration: "none",
  cursor: "pointer",
};

const ghost: CSSProperties = {
  ...button,
  background: "rgba(255,255,255,.06)",
  border: "1px solid rgba(255,255,255,.16)",
  color: "white",
};

const chip: CSSProperties = {
  border: "1px solid rgba(157,243,191,.22)",
  borderRadius: 999,
  padding: "7px 10px",
  color: "#9df3bf",
  background: "rgba(157,243,191,.07)",
  margin: "0 7px 7px 0",
  fontSize: 12,
  fontWeight: 850,
  display: "inline-flex",
};

const blueChip: CSSProperties = {
  ...chip,
  color: "#8fd3ff",
  borderColor: "rgba(56,189,248,.30)",
  background: "rgba(56,189,248,.08)",
};

const input: CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  borderRadius: 18,
  border: "1px solid rgba(255,255,255,.16)",
  background: "rgba(255,255,255,.08)",
  color: "white",
  padding: 15,
  fontSize: 16,
  outline: "none",
};

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <section style={glass}>
      <div style={eyebrow}>{label}</div>
      <div style={{ fontSize: 48, fontWeight: 1000, lineHeight: 1, marginTop: 12 }}>{value}</div>
    </section>
  );
}

function MemberCard({ member, viewer }: { member: Member; viewer: string }) {
  const email = memberEmail(member);
  const baseState = memberBaseState(member);
  const markets = memberMarkets(member);
  const roles = memberRoles(member);
  const strategies = memberStrategies(member);
  const provides = memberProvides(member);
  const needs = memberNeeds(member);
  const score = scoreOf(member);
  const connectHref = `/connect/member-${encodeURIComponent(memberId(member) || email || memberName(member))}?email=${encodeURIComponent(viewer)}${email ? `&to=${encodeURIComponent(email)}` : ""}&source=member&subject=${encodeURIComponent("VaultForge member connection request")}`;

  return (
    <article style={glass}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div>
          <div style={eyebrow}>Member Profile</div>
          <h3 style={{ fontSize: 38, lineHeight: 1.02, margin: "8px 0" }}>{memberName(member)}</h3>
          <p style={{ ...muted, margin: "0 0 8px", fontWeight: 900, color: "white" }}>{companyOf(member)}</p>
          {email ? <p style={{ ...muted, margin: 0, fontWeight: 850 }}>{email}</p> : null}
        </div>

        <div style={{ border: "1px solid rgba(232,196,107,.28)", borderRadius: 20, minWidth: 86, padding: 14, textAlign: "center", background: "rgba(232,196,107,.06)" }}>
          <div style={{ fontSize: 42, lineHeight: 1, fontWeight: 1000, color: "#f8e7b0" }}>{score}</div>
          <div style={{ color: "#cbd5e1", fontSize: 12, marginTop: 6, fontWeight: 850 }}>Network fit</div>
        </div>
      </div>

      <div style={{ marginTop: 14 }}>
        <span style={chip}>Network: {accepted(member) ? "Accepted" : "Pending"}</span>
        {(roles.length ? roles : ["Member"]).map((role) => <span key={role} style={chip}>{role}</span>)}
      </div>

      <div style={{ marginTop: 14 }}>
        <div style={eyebrow}>Based In</div>
        <span style={baseState ? blueChip : chip}>{baseState || "Base state not listed"}</span>
      </div>

      <div style={{ marginTop: 14 }}>
        <div style={eyebrow}>Markets / Reach</div>
        {(markets.length ? markets : ["No markets listed"]).map((state) => (
          <span key={state} style={markets.length ? blueChip : chip}>{state}</span>
        ))}
      </div>

      {strategies.length ? (
        <div style={{ marginTop: 14 }}>
          <div style={eyebrow}>Strategy / Asset Focus</div>
          {strategies.map((item) => <span key={item} style={chip}>{item}</span>)}
        </div>
      ) : null}

      <p style={{ ...muted, marginTop: 16 }}>{memberBio(member)}</p>

      <div className="vf-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 16 }}>
        <div style={glass}>
          <div style={eyebrow}>Can Provide</div>
          <div style={{ marginTop: 10 }}>
            {(provides.length ? provides : ["No provider abilities listed yet."]).map((item) => <span key={item} style={chip}>{item}</span>)}
          </div>
        </div>

        <div style={glass}>
          <div style={eyebrow}>Needs / Watches</div>
          <div style={{ marginTop: 10 }}>
            {(needs.length ? needs : ["No needs listed yet."]).map((item) => <span key={item} style={chip}>{item}</span>)}
          </div>
        </div>
      </div>

      <div className="vf-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
        <Link href={connectHref} style={button}>Message / Request Connection</Link>
        <Link href="/projects" style={ghost}>View Projects</Link>
        <Link href="/dashboard" style={ghost}>Dashboard</Link>
      </div>
    </article>
  );
}

export default function MembersPage() {
  const [email, setEmail] = useState("");
  const [owner, setOwner] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [status, setStatus] = useState("Loading member network...");
  const [query, setQuery] = useState("");
  const [stateFilter, setStateFilter] = useState("All");
  const [roleFilter, setRoleFilter] = useState("All");
  const [rawSource, setRawSource] = useState("");

  async function load() {
    setStatus("Loading member network...");

    try {
      const viewer = getEmail();
      const ownerMode = isOwnerMode(viewer);

      setEmail(viewer);
      setOwner(ownerMode);

      if (!viewer) {
        setMembers([]);
        setRawSource("not logged in");
        setStatus("Log in to view the member network.");
        return;
      }

      const urls = [
        `/api/admin/members?email=${encodeURIComponent(viewer)}&owner=${ownerMode ? "1" : "0"}`,
        `/api/members?email=${encodeURIComponent(viewer)}&owner=${ownerMode ? "1" : "0"}`,
        `/api/profile/me?email=${encodeURIComponent(viewer)}`,
      ];

      for (const url of urls) {
        try {
          const res = await fetch(url, {
            cache: "no-store",
            headers: {
              "x-vf-email": viewer,
              "x-vf-admin": ownerMode ? "1" : "0",
            },
          });

          const data = await safeJson(res);

          const list = [
            ...(Array.isArray(data.members) ? data.members : []),
            ...(Array.isArray(data.profiles) ? data.profiles : []),
            ...(Array.isArray(data.items) ? data.items : []),
            ...(Array.isArray(data.data) ? data.data : []),
            ...(data.profile ? [data.profile] : []),
          ];

          if (list.length) {
            setMembers(list.filter(hasRealEmail));
            setRawSource(url);
            setStatus("");
            return;
          }
        } catch {
          // Try next source.
        }
      }

      setMembers([]);
      setRawSource("no records returned");
      setStatus("No member records loaded yet.");
    } catch (error: any) {
      setStatus(error?.message || "Could not load member network.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const selectedState = normalizeState(stateFilter);
    const selectedRole = roleFilter.toLowerCase();

    return members.filter((member) => {
      const baseState = memberBaseState(member);
      const markets = memberMarkets(member);
      const roles = memberRoles(member).map((role) => role.toLowerCase());

      const matchesState = !selectedState || baseState === selectedState;
      const matchesRole = selectedRole === "all" || roles.includes(selectedRole);

      const searchable = [
        memberName(member),
        companyOf(member),
        memberEmail(member),
        memberBio(member),
        baseState,
        ...markets,
        ...roles,
        ...memberStrategies(member),
        ...memberProvides(member),
        ...memberNeeds(member),
      ].join(" ").toLowerCase();

      const matchesQuery = !q || searchable.includes(q);

      return matchesState && matchesRole && matchesQuery;
    });
  }, [members, query, stateFilter, roleFilter]);

  const counts = useMemo(() => {
    return {
      total: members.length,
      displayed: filtered.length,
      baseReady: members.filter((member) => memberBaseState(member)).length,
      accepted: members.filter(accepted).length,
    };
  }, [members, filtered]);

  return (
    <main style={page}>
      <style>{`
        a:hover, button:hover {
          transform: translateY(-1px);
          transition: all .18s ease;
          filter: brightness(1.06);
        }

        input, select {
          color-scheme: dark;
        }

        @media (max-width: 820px) {
          .vf-grid,
          .vf-four,
          .vf-actions {
            grid-template-columns: 1fr !important;
          }

          .vf-actions {
            display: grid !important;
            gap: 10px !important;
          }

          .vf-actions > * {
            width: 100%;
            box-sizing: border-box;
            justify-content: center;
          }
        }
      `}</style>

      <div style={wrap}>
        <VaultForgeMemberNav
          title="Members"
          subtitle="Private operator network by base state, capability, execution style, and market reach."
          active="members"
        />

        <section style={panel}>
          <div style={eyebrow}>VaultForge Network</div>
          <h1 style={{ fontSize: "clamp(52px,10vw,96px)", lineHeight: 0.88, letterSpacing: "-.07em", margin: "12px 0 18px" }}>
            Private operator network.
          </h1>

          <p style={{ ...muted, fontSize: 20, maxWidth: 980 }}>
            State buttons filter only by where a member is based. Markets and operating states stay visible as AI routing context.
          </p>

          <div style={{ marginTop: 16 }}>
            <span style={chip}>Signed in: {email || "unknown"}</span>
            <span style={chip}>{owner ? "Owner view" : "Member view"}</span>
            <span style={chip}>Members: {counts.total}</span>
            <span style={chip}>Showing: {counts.displayed}</span>
            <span style={chip}>Base state ready: {counts.baseReady}</span>
            <span style={chip}>Source: {rawSource || "loading"}</span>
          </div>

          <div className="vf-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 20 }}>
            <button type="button" onClick={load} style={button}>Refresh Members</button>
            <Link href="/profile" style={ghost}>Edit Profile</Link>
            <Link href="/messages" style={ghost}>Messages</Link>
            <Link href="/dashboard" style={ghost}>Dashboard</Link>
          </div>
        </section>

        <section className="vf-four" style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 16, marginBottom: 18 }}>
          <Metric label="Members" value={counts.total} />
          <Metric label="Showing" value={counts.displayed} />
          <Metric label="Base State" value={counts.baseReady} />
          <Metric label="Accepted" value={counts.accepted} />
        </section>

        <section style={panel}>
          <div style={eyebrow}>Search / Filter</div>

          <div className="vf-grid" style={{ display: "grid", gridTemplateColumns: "1.15fr .85fr", gap: 14, marginTop: 16 }}>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search members, base state, markets, roles, strategies..."
              style={input}
            />

            <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} style={input}>
              {ROLE_OPTIONS.map((role) => (
                <option key={role} value={role} style={{ color: "#111" }}>{role}</option>
              ))}
            </select>
          </div>

          <div style={{ marginTop: 14 }}>
            <button type="button" onClick={() => setStateFilter("All")} style={stateFilter === "All" ? button : ghost}>
              All
            </button>

            {STATES.map((state) => (
              <button
                key={state}
                type="button"
                onClick={() => setStateFilter(state)}
                style={stateFilter === state ? button : ghost}
              >
                {state}
              </button>
            ))}
          </div>

          {stateFilter !== "All" ? (
            <p style={{ ...muted, marginTop: 14 }}>
              Showing members based in <strong style={{ color: "#f8e7b0" }}>{stateFilter}</strong>.
            </p>
          ) : null}
        </section>

        {status ? <section style={panel}>{status}</section> : null}

        {!status && filtered.length === 0 ? (
          <section style={panel}>
            <h3 style={{ marginTop: 0 }}>No members match this filter.</h3>
            <p style={muted}>
              The selected state may not be saved as a base/from state on any profile yet. Markets still display as context, but the state buttons only match Based In.
            </p>
          </section>
        ) : null}

        <section style={{ display: "grid", gap: 14 }}>
          {filtered.map((member, index) => (
            <MemberCard key={memberId(member) || memberEmail(member) || index} member={member} viewer={email} />
          ))}
        </section>
      </div>
    </main>
  );
}
