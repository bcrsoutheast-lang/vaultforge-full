"use client";

import { useEffect, useMemo, useState } from "react";
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

function splitValues(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(clean).filter(Boolean);
  }

  const raw = clean(value);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map(clean).filter(Boolean);
    }
  } catch {
    // Not JSON. Keep going.
  }

  return raw
    .replaceAll("\\n", ",")
    .replaceAll("|", ",")
    .replaceAll(";", ",")
    .split(",")
    .map(clean)
    .filter(Boolean);
}

function unique(values: string[]) {
  return Array.from(new Set(values.map(clean).filter(Boolean)));
}

function first(...values: unknown[]) {
  for (const value of values) {
    if (Array.isArray(value)) {
      const found = value.find((item) => clean(item));
      if (found !== undefined) return clean(found);
      continue;
    }

    const text = clean(value);
    if (text) return text;
  }

  return "";
}

function meta(member: Member) {
  return typeof member?.metadata === "object" && member.metadata ? member.metadata : {};
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

function viewerEmail() {
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

function isOwner(email: string) {
  return (
    cleanEmail(email) === OWNER_EMAIL ||
    readCookie("vf_admin") === "1" ||
    readCookie("isAdmin") === "true" ||
    cleanEmail(readCookie("vf_admin_email")) === OWNER_EMAIL
  );
}

function hasRealEmail(member: Member) {
  const email = memberEmail(member);
  return email.includes("@") && !email.endsWith("@example.com");
}

function memberId(member: Member) {
  const m = meta(member);
  return first(member.id, member.profile_id, member.member_id, member.auth_user_id, member.email, m.id, m.profile_id, m.member_id);
}

function memberEmail(member: Member) {
  const m = meta(member);
  return cleanEmail(first(member.email, member.member_email, member.user_email, member.owner_email, m.email, m.member_email, m.user_email, m.owner_email));
}

function memberName(member: Member) {
  const m = meta(member);
  return first(member.full_name, member.name, member.display_name, member.username, member.company, m.full_name, m.name, m.display_name, m.username, memberEmail(member), "VaultForge Member");
}

function companyName(member: Member) {
  const m = meta(member);
  return first(member.company, member.company_name, member.business_name, m.company, m.company_name, m.business_name, "VaultForge Member");
}

function memberPhoto(member: Member) {
  const m = meta(member);
  return first(member.profile_photo_url, member.avatar_url, member.photo_url, member.image_url, m.profile_photo_url, m.avatar_url, m.photo_url, m.image_url);
}

function memberRoles(member: Member) {
  const m = meta(member);
  return unique([
    ...splitValues(member.member_types),
    ...splitValues(member.member_type),
    ...splitValues(member.roles),
    ...splitValues(member.role),
    ...splitValues(member.primary_role),
    ...splitValues(m.member_types),
    ...splitValues(m.member_type),
    ...splitValues(m.roles),
    ...splitValues(m.role),
    ...splitValues(m.primary_role),
  ]).slice(0, 8);
}

function baseState(member: Member) {
  const m = meta(member);

  const raw = first(
    member.home_state,
    member.based_state,
    member.base_state,
    member.from_state,
    member.member_state,
    member.primary_state,
    member.location_state,
    member.state,
    m.home_state,
    m.based_state,
    m.base_state,
    m.from_state,
    m.member_state,
    m.primary_state,
    m.location_state,
    m.state
  );

  return normalizeState(raw);
}

function marketStates(member: Member) {
  const m = meta(member);

  const values = unique([
    ...splitValues(member.markets),
    ...splitValues(member.operating_states),
    ...splitValues(member.market_states),
    ...splitValues(member.buy_box_states),
    ...splitValues(member.service_states),
    ...splitValues(member.target_states),
    ...splitValues(member.work_states),
    ...splitValues(m.markets),
    ...splitValues(m.operating_states),
    ...splitValues(m.market_states),
    ...splitValues(m.buy_box_states),
    ...splitValues(m.service_states),
    ...splitValues(m.target_states),
    ...splitValues(m.work_states),
    baseState(member),
  ])
    .map(normalizeState)
    .filter(Boolean);

  return unique(values);
}

function strategies(member: Member) {
  const m = meta(member);
  return unique([
    ...splitValues(member.strategies),
    ...splitValues(member.strategy),
    ...splitValues(member.asset_focus),
    ...splitValues(member.property_types),
    ...splitValues(m.strategies),
    ...splitValues(m.strategy),
    ...splitValues(m.asset_focus),
    ...splitValues(m.property_types),
  ]).slice(0, 10);
}

function provides(member: Member) {
  const m = meta(member);
  return unique([
    ...splitValues(member.can_provide),
    ...splitValues(member.provides),
    ...splitValues(member.capabilities),
    ...splitValues(member.skills),
    ...splitValues(member.what_i_provide),
    ...splitValues(m.can_provide),
    ...splitValues(m.provides),
    ...splitValues(m.capabilities),
    ...splitValues(m.skills),
    ...splitValues(m.what_i_provide),
  ]).slice(0, 10);
}

function needs(member: Member) {
  const m = meta(member);
  return unique([
    ...splitValues(member.needs),
    ...splitValues(member.looking_for),
    ...splitValues(member.what_i_need),
    ...splitValues(member.deal_needs),
    ...splitValues(m.needs),
    ...splitValues(m.looking_for),
    ...splitValues(m.what_i_need),
    ...splitValues(m.deal_needs),
  ]).slice(0, 10);
}

function memberBio(member: Member) {
  const m = meta(member);
  return first(member.bio, member.description, member.strategy_summary, member.buy_box, member.notes, m.bio, m.description, m.strategy_summary, m.buy_box, m.notes, "Private member profile ready for network alignment.");
}

function accepted(member: Member) {
  const status = [
    member.access_status,
    member.member_status,
    member.status,
    member.payment_status,
    member.network_status,
    member.is_active,
    meta(member).access_status,
    meta(member).member_status,
    meta(member).status,
    meta(member).payment_status,
  ]
    .map((item) => String(item || "").toLowerCase())
    .join(" ");

  return status.includes("active") || status.includes("accepted") || status.includes("paid") || status.includes("true");
}

function fitScore(member: Member) {
  let score = Number(member.score || member.match_score || member.alignment_score || 0);

  if (!Number.isFinite(score) || score <= 0) score = 50;
  if (baseState(member)) score += 15;
  if (marketStates(member).length) score += 10;
  if (memberRoles(member).length) score += 8;
  if (strategies(member).length) score += 6;
  if (provides(member).length) score += 8;
  if (needs(member).length) score += 5;
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

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(232,196,107,.14), transparent 28%), radial-gradient(circle at 88% 10%, rgba(74,222,128,.10), transparent 26%), linear-gradient(180deg,#020303,#071326 55%,#020303)",
  color: "white",
  padding: "22px 16px 96px",
  fontFamily: "Arial, sans-serif",
};

const wrap: React.CSSProperties = {
  width: "min(1220px,100%)",
  margin: "0 auto",
};

const panel: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.24)",
  borderRadius: 30,
  padding: 24,
  background: "linear-gradient(145deg,rgba(255,255,255,.070),rgba(255,255,255,.030))",
  boxShadow: "0 28px 86px rgba(0,0,0,.30)",
  marginBottom: 18,
};

const card: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.12)",
  borderRadius: 24,
  padding: 20,
  background: "rgba(255,255,255,.045)",
};

const eyebrow: React.CSSProperties = {
  color: "#e8c46b",
  letterSpacing: ".18em",
  textTransform: "uppercase",
  fontWeight: 950,
  fontSize: 12,
};

const muted: React.CSSProperties = {
  color: "#cbd5e1",
  lineHeight: 1.55,
};

const button: React.CSSProperties = {
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

const ghost: React.CSSProperties = {
  ...button,
  background: "rgba(255,255,255,.06)",
  border: "1px solid rgba(255,255,255,.16)",
  color: "white",
};

const chip: React.CSSProperties = {
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

const blueChip: React.CSSProperties = {
  ...chip,
  color: "#8fd3ff",
  borderColor: "rgba(56,189,248,.30)",
  background: "rgba(56,189,248,.08)",
};

const input: React.CSSProperties = {
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

function PillList({ items, empty, blue = false }: { items: string[]; empty: string; blue?: boolean }) {
  const list = items.length ? items : [empty];

  return (
    <>
      {list.map((item) => (
        <span key={item} style={blue && items.length ? blueChip : chip}>
          {item}
        </span>
      ))}
    </>
  );
}

function MemberCard({ member, viewer }: { member: Member; viewer: string }) {
  const email = memberEmail(member);
  const home = baseState(member);
  const markets = marketStates(member);
  const roles = memberRoles(member);
  const photo = memberPhoto(member);
  const score = fitScore(member);
  const connectHref = `/connect/member-${encodeURIComponent(memberId(member) || email || memberName(member))}?email=${encodeURIComponent(viewer)}${email ? `&to=${encodeURIComponent(email)}` : ""}&source=member&subject=${encodeURIComponent("VaultForge member connection request")}`;

  return (
    <article style={card}>
      <div style={{ display: "grid", gridTemplateColumns: "150px 1fr", gap: 18 }}>
        <div
          style={{
            minHeight: 150,
            borderRadius: 22,
            overflow: "hidden",
            border: "1px solid rgba(232,196,107,.18)",
            background: "rgba(0,0,0,.20)",
            display: "grid",
            placeItems: "center",
            color: "#94a3b8",
            fontWeight: 850,
            textAlign: "center",
          }}
        >
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt={memberName(member)} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          ) : (
            <>Member<br />Profile</>
          )}
        </div>

        <div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
            <div>
              <div style={eyebrow}>Member Profile</div>
              <h3 style={{ fontSize: 36, lineHeight: 1.02, margin: "8px 0" }}>{memberName(member)}</h3>
              <p style={{ ...muted, margin: "0 0 8px", fontWeight: 900, color: "white" }}>{companyName(member)}</p>
              {email ? <p style={{ ...muted, margin: 0, fontWeight: 850 }}>{email}</p> : null}
            </div>

            <div style={{ border: "1px solid rgba(232,196,107,.28)", borderRadius: 20, minWidth: 86, padding: 14, textAlign: "center", background: "rgba(232,196,107,.06)" }}>
              <div style={{ fontSize: 42, lineHeight: 1, fontWeight: 1000, color: "#f8e7b0" }}>{score}</div>
              <div style={{ color: "#cbd5e1", fontSize: 12, marginTop: 6, fontWeight: 850 }}>Network fit</div>
            </div>
          </div>

          <div style={{ marginTop: 14 }}>
            <span style={chip}>Network: {accepted(member) ? "Accepted" : "Pending"}</span>
            <PillList items={roles} empty="Member" />
          </div>

          <div style={{ marginTop: 14 }}>
            <div style={eyebrow}>Based In</div>
            <span style={home ? blueChip : chip}>{home || "Base state not listed"}</span>
          </div>

          <div style={{ marginTop: 14 }}>
            <div style={eyebrow}>Markets / Reach</div>
            <PillList items={markets} empty="No markets listed" blue />
          </div>

          <div style={{ marginTop: 14 }}>
            <div style={eyebrow}>Strategy / Asset Focus</div>
            <PillList items={strategies(member)} empty="No strategy listed" />
          </div>

          <p style={{ ...muted, marginTop: 16 }}>{memberBio(member)}</p>

          <div className="vf-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 16 }}>
            <div style={card}>
              <div style={eyebrow}>Can Provide</div>
              <div style={{ marginTop: 10 }}>
                <PillList items={provides(member)} empty="No provider abilities listed yet." />
              </div>
            </div>

            <div style={card}>
              <div style={eyebrow}>Needs / Watches</div>
              <div style={{ marginTop: 10 }}>
                <PillList items={needs(member)} empty="No needs listed yet." />
              </div>
            </div>
          </div>

          <div className="vf-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
            <Link href={connectHref} style={button}>Message / Request Connection</Link>
            <Link href="/projects" style={ghost}>View Projects</Link>
            <Link href="/dashboard" style={ghost}>Dashboard</Link>
          </div>
        </div>
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
  const [source, setSource] = useState("");

  async function load() {
    setStatus("Loading member network...");

    try {
      const viewer = viewerEmail();
      const ownerMode = isOwner(viewer);

      setEmail(viewer);
      setOwner(ownerMode);

      if (!viewer) {
        setMembers([]);
        setSource("not logged in");
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
          const response = await fetch(url, {
            cache: "no-store",
            headers: {
              "x-vf-email": viewer,
              "x-vf-admin": ownerMode ? "1" : "0",
            },
          });

          const data = await safeJson(response);

          const list = [
            ...(Array.isArray(data.members) ? data.members : []),
            ...(Array.isArray(data.profiles) ? data.profiles : []),
            ...(Array.isArray(data.items) ? data.items : []),
            ...(Array.isArray(data.data) ? data.data : []),
            ...(data.profile ? [data.profile] : []),
          ];

          if (list.length) {
            setMembers(list.filter(hasRealEmail));
            setSource(url);
            setStatus("");
            return;
          }
        } catch {
          // Try next source.
        }
      }

      setMembers([]);
      setSource("no source returned records");
      setStatus("No member records loaded yet.");
    } catch (error: any) {
      setStatus(error?.message || "Could not load member network.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const selectedState = normalizeState(stateFilter);
    const selectedRole = roleFilter.toLowerCase();
    const q = query.trim().toLowerCase();

    return members.filter((member) => {
      const home = baseState(member);
      const roles = memberRoles(member);
      const roleMatches =
        selectedRole === "all" ||
        roles.some((role) => role.toLowerCase() === selectedRole);

      const stateMatches = !selectedState || home === selectedState;

      const searchable = [
        memberName(member),
        companyName(member),
        memberEmail(member),
        memberBio(member),
        home,
        ...marketStates(member),
        ...roles,
        ...strategies(member),
        ...provides(member),
        ...needs(member),
      ]
        .join(" ")
        .toLowerCase();

      const queryMatches = !q || searchable.includes(q);

      return stateMatches && roleMatches && queryMatches;
    });
  }, [members, query, stateFilter, roleFilter]);

  const counts = useMemo(() => {
    return {
      total: members.length,
      showing: filtered.length,
      baseReady: members.filter((member) => baseState(member)).length,
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
          .vf-actions,
          article > div {
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
            State buttons filter only by where each member is based. Markets and operating states stay visible for AI routing context.
          </p>

          <div style={{ marginTop: 16 }}>
            <span style={chip}>Signed in: {email || "unknown"}</span>
            <span style={chip}>{owner ? "Owner view" : "Member view"}</span>
            <span style={chip}>Members: {counts.total}</span>
            <span style={chip}>Showing: {counts.showing}</span>
            <span style={chip}>Base state ready: {counts.baseReady}</span>
            <span style={chip}>Source: {source || "loading"}</span>
          </div>

          <div className="vf-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 20 }}>
            <button type="button" onClick={load} style={button}>Refresh Members</button>
            <Link href="/profile" style={ghost}>Edit Profile</Link>
            <Link href="/messages" style={ghost}>Messages</Link>
            <Link href="/dashboard" style={ghost}>Dashboard</Link>
          </div>
        </section>

        <section className="vf-four" style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 16, marginBottom: 18 }}>
          <section style={card}><div style={eyebrow}>Members</div><div style={{ fontSize: 48, fontWeight: 1000 }}>{counts.total}</div></section>
          <section style={card}><div style={eyebrow}>Showing</div><div style={{ fontSize: 48, fontWeight: 1000 }}>{counts.showing}</div></section>
          <section style={card}><div style={eyebrow}>Base State</div><div style={{ fontSize: 48, fontWeight: 1000 }}>{counts.baseReady}</div></section>
          <section style={card}><div style={eyebrow}>Accepted</div><div style={{ fontSize: 48, fontWeight: 1000 }}>{counts.accepted}</div></section>
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
              <option value="All" style={{ color: "#111" }}>All Roles</option>
              {["Buyer", "Seller", "Lender", "Private Money", "Contractor", "Wholesaler", "Investor", "Developer", "Operator", "Partner", "Realtor", "Broker"].map((role) => (
                <option key={role} value={role} style={{ color: "#111" }}>{role}</option>
              ))}
            </select>
          </div>

          <div style={{ marginTop: 14 }}>
            <button type="button" onClick={() => setStateFilter("All")} style={stateFilter === "All" ? button : ghost}>All</button>
            {STATES.map((state) => (
              <button key={state} type="button" onClick={() => setStateFilter(state)} style={stateFilter === state ? button : ghost}>
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
              The selected state is not saved as a Based In field on any loaded member profile. Markets still display, but they do not control the state buttons.
            </p>
          </section>
        ) : null}

        <section style={{ display: "grid", gap: 14 }}>
          {filtered.map((member, index) => (
            <MemberCard key={memberId(member) || memberEmail(member) || String(index)} member={member} viewer={email} />
          ))}
        </section>
      </div>
    </main>
  );
}
