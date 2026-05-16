"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import VaultForgeMemberNav from "../components/VaultForgeMemberNav";

type MemberProfile = Record<string, any>;

const STATES = [
  "Georgia",
  "Tennessee",
  "Alabama",
  "Florida",
  "North Carolina",
  "South Carolina",
  "Texas",
];

const ROLES = [
  "Buyer",
  "Investor",
  "Wholesaler",
  "Lender",
  "Private Money",
  "Contractor",
  "Operator",
  "Developer",
  "Realtor",
  "Broker",
  "Property Manager",
  "Capital Partner",
  "JV Partner",
  "Deal Source",
];

function clean(value: unknown) {
  return String(value || "").trim();
}

function cleanEmail(value: unknown) {
  return clean(value).toLowerCase();
}

function parseList(value: unknown) {
  if (Array.isArray(value)) return value.map(clean).filter(Boolean);

  const text = clean(value);
  if (!text) return [];

  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return parsed.map(clean).filter(Boolean);
  } catch {
    // continue
  }

  return text
    .split(/[,\n|;]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function uniq(items: string[]) {
  return Array.from(new Set(items.map(clean).filter(Boolean)));
}

function readAllLocalProfiles() {
  if (typeof window === "undefined") return [];

  const profiles: MemberProfile[] = [];

  try {
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index) || "";

      if (!key.startsWith("vaultforge_final_member_profile_")) continue;

      const raw = window.localStorage.getItem(key);
      if (!raw) continue;

      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        profiles.push(parsed);
      }
    }
  } catch {
    // ignore local parse issues
  }

  return profiles;
}

function normalizeProfile(row: MemberProfile): MemberProfile {
  const intelligence = row.profile_intelligence || row.intelligence_profile || row.metadata || {};

  const email = cleanEmail(
    row.email ||
      row.member_email ||
      row.user_email ||
      intelligence.email ||
      intelligence.member_email
  );

  const stateFrom = clean(
    row.state_from ||
      row.home_state ||
      row.based_state ||
      intelligence.state_from ||
      intelligence.home_state
  );

  const statesOperated = uniq([
    ...parseList(row.states_operated),
    ...parseList(row.operating_states),
    ...parseList(row.service_states),
    ...parseList(intelligence.states_operated),
    ...parseList(intelligence.operating_states),
  ]);

  return {
    ...row,
    email,
    photo_url: clean(row.photo_url || row.avatar_url || intelligence.photo_url || intelligence.avatar_url),
    full_name: clean(row.full_name || row.name || row.display_name || intelligence.full_name || intelligence.name || email),
    company: clean(row.company || row.company_name || intelligence.company || intelligence.company_name),
    phone: clean(row.phone || row.phone_number || intelligence.phone),
    website: clean(row.website || intelligence.website),
    bio: clean(row.bio || row.description || intelligence.bio),
    state_from: stateFrom,
    city_from: clean(row.city_from || row.city || intelligence.city_from || intelligence.city),
    states_operated: statesOperated,
    counties_operated: clean(row.counties_operated || intelligence.counties_operated || row.counties || row.markets),
    roles: uniq([...parseList(row.roles), ...parseList(row.member_type), ...parseList(intelligence.roles)]),
    buy_box: uniq([...parseList(row.buy_box), ...parseList(row.asset_types), ...parseList(intelligence.buy_box)]),
    strategies: uniq([...parseList(row.strategies), ...parseList(row.strategy), ...parseList(intelligence.strategies)]),
    capabilities: uniq([...parseList(row.capabilities), ...parseList(row.execution), ...parseList(intelligence.capabilities), ...parseList(intelligence.execution)]),
    pressure_solutions: uniq([...parseList(row.pressure_solutions), ...parseList(row.pressure), ...parseList(intelligence.pressure_solutions), ...parseList(intelligence.pressure)]),
  };
}

function initials(value: string) {
  const text = clean(value);
  if (!text) return "VF";
  const name = text.includes("@") ? text.split("@")[0] : text;
  const parts = name.split(/[\s._-]+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0] || "V"}${parts[1][0] || "F"}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function memberFit(profile: MemberProfile) {
  if ((profile.roles || []).includes("Lender") || (profile.roles || []).includes("Private Money")) {
    return "Capital route";
  }

  if ((profile.roles || []).includes("Contractor") || (profile.roles || []).includes("Operator")) {
    return "Execution route";
  }

  if ((profile.roles || []).includes("Buyer") || (profile.roles || []).includes("Investor")) {
    return "Opportunity route";
  }

  if ((profile.pressure_solutions || []).length) {
    return "Pressure solver";
  }

  return "Network member";
}

function aiMatchPreview(profile: MemberProfile) {
  const roles = profile.roles || [];
  const states = profile.states_operated || [];
  const capabilities = profile.capabilities || [];
  const pressure = profile.pressure_solutions || [];
  const strategies = profile.strategies || [];
  const buyBox = profile.buy_box || [];
  const stateFrom = clean(profile.state_from);

  const reasons: string[] = [];

  if (stateFrom) {
    reasons.push(`listed in ${stateFrom} for member lookup`);
  }

  if (states.length) {
    reasons.push(`operates in ${states.slice(0, 3).join(", ")}${states.length > 3 ? " +" : ""}`);
  }

  if (roles.includes("Lender") || roles.includes("Private Money") || roles.includes("Capital Partner")) {
    reasons.push("capital-side member for funding gaps and private-money routes");
  }

  if (roles.includes("Buyer") || roles.includes("Investor")) {
    reasons.push("buyer/investor profile for opportunity routing");
  }

  if (roles.includes("Contractor") || roles.includes("Operator")) {
    reasons.push("operator/execution profile for pressure and rehab rooms");
  }

  if (capabilities.includes("Title Problem Solving")) {
    reasons.push("can help with title/problem-solving pressure");
  }

  if (capabilities.includes("Contractor Crew") || capabilities.includes("Full Rehab")) {
    reasons.push("can support rehab, contractor failure, or execution breakdowns");
  }

  if (pressure.length) {
    reasons.push(`pressure fit: ${pressure.slice(0, 2).join(", ")}`);
  }

  if (strategies.includes("Distressed") || buyBox.includes("Residential")) {
    reasons.push("usable for distressed/residential opportunity matching");
  }

  if (!reasons.length) {
    return "AI needs more profile data before confident matching.";
  }

  return `AI match: ${reasons.slice(0, 4).join(" · ")}.`;
}

function matchScore(profile: MemberProfile) {
  const roles = profile.roles || [];
  const states = profile.states_operated || [];
  const capabilities = profile.capabilities || [];
  const pressure = profile.pressure_solutions || [];
  const strategies = profile.strategies || [];
  const buyBox = profile.buy_box || [];

  let score = 0;

  if (clean(profile.state_from)) score += 15;
  if (states.length) score += 20;
  if (roles.length) score += 20;
  if (capabilities.length) score += 15;
  if (pressure.length) score += 10;
  if (strategies.length) score += 10;
  if (buyBox.length) score += 10;

  return Math.min(100, score);
}

function bestRoomRoutes(profile: MemberProfile) {
  const roles = profile.roles || [];
  const capabilities = profile.capabilities || [];
  const pressure = profile.pressure_solutions || [];
  const routes: [string, string][] = [];

  if (roles.includes("Buyer") || roles.includes("Investor")) {
    routes.push(["/opportunity-rooms/hot", "Hot Opportunities"]);
    routes.push(["/opportunity-rooms/needs-buyer", "Needs Buyer"]);
  }

  if (roles.includes("Lender") || roles.includes("Private Money") || capabilities.includes("Private Lending")) {
    routes.push(["/opportunity-rooms/needs-capital", "Needs Capital"]);
    routes.push(["/pressure-rooms/funding-gap", "Funding Gap"]);
  }

  if (roles.includes("Contractor") || roles.includes("Operator") || capabilities.includes("Contractor Crew")) {
    routes.push(["/opportunity-rooms/needs-operator", "Needs Operator"]);
    routes.push(["/pressure-rooms/needs-operator", "Pressure Operator"]);
  }

  if (pressure.length) {
    routes.push(["/pressure-rooms/urgent", "Critical Pressure"]);
  }

  if (!routes.length) {
    routes.push(["/room-folders", "Room Folders"]);
  }

  return routes.slice(0, 4);
}

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(232,196,107,.15), transparent 28%), radial-gradient(circle at 88% 8%, rgba(86,216,255,.10), transparent 26%), linear-gradient(180deg,#020303,#071326 55%,#020303)",
  color: "white",
  padding: "22px 16px 100px",
  fontFamily: "Arial, sans-serif",
};

const wrap: React.CSSProperties = {
  width: "min(1280px,100%)",
  margin: "0 auto",
};

const card: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.22)",
  borderRadius: 28,
  background: "linear-gradient(145deg,rgba(255,255,255,.065),rgba(255,255,255,.025))",
  padding: 20,
  marginBottom: 16,
  boxShadow: "0 22px 70px rgba(0,0,0,.28)",
};

const label: React.CSSProperties = {
  color: "#e8c46b",
  letterSpacing: ".16em",
  textTransform: "uppercase",
  fontWeight: 950,
  fontSize: 11,
};

const muted: React.CSSProperties = {
  color: "#cbd5e1",
  lineHeight: 1.5,
};

const input: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  borderRadius: 15,
  border: "1px solid rgba(255,255,255,.14)",
  background: "rgba(0,0,0,.24)",
  color: "white",
  padding: 12,
  fontSize: 14,
  outline: "none",
};

const button: React.CSSProperties = {
  minHeight: 42,
  borderRadius: 999,
  padding: "10px 14px",
  background: "linear-gradient(135deg,#f8e7b0,#e8c46b)",
  color: "#06100a",
  fontWeight: 950,
  textDecoration: "none",
  border: 0,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
};

const ghost: React.CSSProperties = {
  ...button,
  border: "1px solid rgba(255,255,255,.14)",
  background: "rgba(255,255,255,.060)",
  color: "white",
};

function Chip({
  active,
  children,
  onClick,
  tone = "#9df3bf",
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
  tone?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        border: active ? `1px solid ${tone}` : "1px solid rgba(255,255,255,.13)",
        background: active ? "rgba(157,243,191,.10)" : "rgba(255,255,255,.035)",
        color: active ? tone : "#cbd5e1",
        borderRadius: 999,
        padding: "8px 11px",
        fontWeight: 900,
        fontSize: 13,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

function MemberCard({ profile }: { profile: MemberProfile }) {
  const name = clean(profile.full_name) || clean(profile.email) || "VaultForge Member";
  const state = clean(profile.state_from) || "State not listed";
  const city = clean(profile.city_from);
  const roles = profile.roles || [];
  const states = profile.states_operated || [];
  const capabilities = profile.capabilities || [];
  const pressure = profile.pressure_solutions || [];
  const email = clean(profile.email);

  const contactHref = `/messages/new?to=${encodeURIComponent(email)}&subject=${encodeURIComponent(`VaultForge Network: ${name}`)}&source=network&type=member&title=${encodeURIComponent(name)}`;

  return (
    <article style={card}>
      <div style={{ display: "grid", gridTemplateColumns: "86px 1fr", gap: 14, alignItems: "start" }}>
        <div
          style={{
            width: 78,
            height: 78,
            borderRadius: 24,
            border: "1px solid rgba(232,196,107,.34)",
            display: "grid",
            placeItems: "center",
            overflow: "hidden",
            background: "rgba(255,255,255,.05)",
            color: "#f8e7b0",
            fontWeight: 1000,
            fontSize: 24,
          }}
        >
          {profile.photo_url ? (
            <img src={profile.photo_url} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            initials(name)
          )}
        </div>

        <section>
          <div style={label}>{memberFit(profile)}</div>
          <h2 style={{ margin: "6px 0 6px", fontSize: 28, lineHeight: 1 }}>{name}</h2>
          <p style={{ ...muted, margin: 0 }}>
            {profile.company ? `${profile.company} · ` : ""}
            Based in {city ? `${city}, ` : ""}{state}
          </p>
          <p style={{ ...muted, marginTop: 8, fontSize: 14 }}>
            AI routing markets: {states.length ? states.join(", ") : "Not listed"}
          </p>
        </section>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 14 }}>
        {roles.slice(0, 8).map((item: string) => (
          <span key={item} style={{ border: "1px solid rgba(157,243,191,.24)", borderRadius: 999, padding: "6px 9px", color: "#9df3bf", background: "rgba(157,243,191,.06)", fontWeight: 800, fontSize: 12 }}>
            {item}
          </span>
        ))}
        {capabilities.slice(0, 6).map((item: string) => (
          <span key={item} style={{ border: "1px solid rgba(86,216,255,.24)", borderRadius: 999, padding: "6px 9px", color: "#56d8ff", background: "rgba(86,216,255,.06)", fontWeight: 800, fontSize: 12 }}>
            {item}
          </span>
        ))}
        {pressure.slice(0, 5).map((item: string) => (
          <span key={item} style={{ border: "1px solid rgba(248,113,113,.24)", borderRadius: 999, padding: "6px 9px", color: "#fecaca", background: "rgba(248,113,113,.06)", fontWeight: 800, fontSize: 12 }}>
            {item}
          </span>
        ))}
      </div>

      <section
        style={{
          border: "1px solid rgba(232,196,107,.22)",
          borderRadius: 18,
          padding: 13,
          background: "rgba(232,196,107,.055)",
          marginTop: 14,
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 12, alignItems: "center" }}>
          <div
            style={{
              width: 58,
              height: 58,
              borderRadius: 18,
              border: "1px solid rgba(232,196,107,.34)",
              display: "grid",
              placeItems: "center",
              color: "#f8e7b0",
              fontWeight: 1000,
              background: "rgba(0,0,0,.20)",
            }}
          >
            {matchScore(profile)}%
          </div>
          <div>
            <div style={{ ...label, color: "#f8e7b0" }}>AI Match Preview</div>
            <p style={{ ...muted, margin: "6px 0 0", fontSize: 14 }}>
              {aiMatchPreview(profile)}
            </p>
          </div>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
          {bestRoomRoutes(profile).map(([href, text]) => (
            <Link
              key={href}
              href={href}
              style={{
                border: "1px solid rgba(232,196,107,.22)",
                borderRadius: 999,
                padding: "7px 10px",
                color: "#f8e7b0",
                textDecoration: "none",
                background: "rgba(232,196,107,.06)",
                fontWeight: 850,
                fontSize: 12,
              }}
            >
              {text}
            </Link>
          ))}
        </div>
      </section>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 9, marginTop: 16 }}>
        <Link href={contactHref} style={button}>Message / Request Intro</Link>
        <Link href={`/members?state=${encodeURIComponent(state)}`} style={ghost}>View {state}</Link>
      </div>
    </article>
  );
}

export default function MembersPage() {
  const [members, setMembers] = useState<MemberProfile[]>([]);
  const [query, setQuery] = useState("");
  const [stateFrom, setStateFrom] = useState("All");
  const [operatingState, setOperatingState] = useState("All");
  const [role, setRole] = useState("All");
  const [status, setStatus] = useState("Loading network...");

  useEffect(() => {
    async function loadMembers() {
      const local = readAllLocalProfiles().map(normalizeProfile);

      try {
        const response = await fetch("/api/admin/members", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        const data = await response.json().catch(() => ({}));
        const rows = [
          ...(Array.isArray(data.members) ? data.members : []),
          ...(Array.isArray(data.profiles) ? data.profiles : []),
          ...(Array.isArray(data.items) ? data.items : []),
          ...(Array.isArray(data.data) ? data.data : []),
        ].map(normalizeProfile);

        const byEmail = new Map<string, MemberProfile>();

        [...rows, ...local].forEach((profile) => {
          const key = cleanEmail(profile.email) || `${profile.full_name}-${profile.state_from}-${Math.random()}`;
          if (!key) return;
          byEmail.set(key, { ...(byEmail.get(key) || {}), ...profile });
        });

        const finalMembers = Array.from(byEmail.values()).filter((profile) => clean(profile.full_name) || clean(profile.email));

        setMembers(finalMembers);
        setStatus(finalMembers.length ? "" : "No member profiles found yet. Fill out Profile to populate the Network.");
      } catch {
        setMembers(local);
        setStatus(local.length ? "" : "No member profiles found yet. Fill out Profile to populate the Network.");
      }
    }

    loadMembers();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const requestedState = clean(params.get("state"));
    if (requestedState) setStateFrom(requestedState);
  }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();

    return members.filter((profile) => {
      const haystack = [
        profile.full_name,
        profile.company,
        profile.email,
        profile.phone,
        profile.state_from,
        profile.city_from,
        profile.counties_operated,
        ...(profile.states_operated || []),
        ...(profile.roles || []),
        ...(profile.buy_box || []),
        ...(profile.strategies || []),
        ...(profile.capabilities || []),
        ...(profile.pressure_solutions || []),
      ]
        .join(" ")
        .toLowerCase();

      if (q && !haystack.includes(q)) return false;
      if (stateFrom !== "All" && profile.state_from !== stateFrom) return false;
      if (operatingState !== "All" && !(profile.states_operated || []).includes(operatingState)) return false;
      if (role !== "All" && !(profile.roles || []).includes(role)) return false;

      return true;
    });
  }, [members, query, stateFrom, operatingState, role]);

  const counts = useMemo(() => {
    return {
      total: filtered.length,
      buyers: filtered.filter((profile) => (profile.roles || []).includes("Buyer") || (profile.roles || []).includes("Investor")).length,
      capital: filtered.filter((profile) => (profile.roles || []).includes("Lender") || (profile.roles || []).includes("Private Money")).length,
      operators: filtered.filter((profile) => (profile.roles || []).includes("Operator") || (profile.roles || []).includes("Contractor")).length,
    };
  }, [filtered]);

  return (
    <main style={page}>
      <style>{`
        a:hover, button:hover {
          transform: translateY(-1px);
          transition: all .18s ease;
          filter: brightness(1.06);
        }

        input::placeholder {
          color: rgba(255,255,255,.45);
        }

        @media(max-width:760px) {
          .vf-grid,
          .vf-filters {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      <div style={wrap}>
        <VaultForgeMemberNav
          title="Network"
          subtitle="Find members by State From, role, operating states, capabilities, pressure-solving fit, and AI match preview."
          active="members"
        />

        <section style={card}>
          <div style={label}>VaultForge Network Directory</div>
          <h1 style={{ fontSize: "clamp(52px,10vw,98px)", lineHeight: 0.88, letterSpacing: "-.07em", margin: "10px 0 14px" }}>
            Find the right operator.
          </h1>
          <p style={{ ...muted, fontSize: 19, margin: 0 }}>
            State From controls member lookup. States Operated In and capabilities power AI Match Preview.
          </p>

          <div className="vf-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 12, marginTop: 16 }}>
            <Mini title="Showing" value={counts.total} />
            <Mini title="Buyer / Investor" value={counts.buyers} />
            <Mini title="Capital" value={counts.capital} />
            <Mini title="Operator" value={counts.operators} />
          </div>
        </section>

        <section style={card}>
          <div style={label}>Search / Filter</div>
          <div className="vf-filters" style={{ display: "grid", gridTemplateColumns: "1.3fr repeat(3,1fr)", gap: 10, marginTop: 12 }}>
            <input
              style={input}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search name, company, county, role, capability..."
            />
            <select style={input} value={stateFrom} onChange={(event) => setStateFrom(event.target.value)}>
              <option value="All">State From: All</option>
              {STATES.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
            <select style={input} value={operatingState} onChange={(event) => setOperatingState(event.target.value)}>
              <option value="All">Operates In: All</option>
              {STATES.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
            <select style={input} value={role} onChange={(event) => setRole(event.target.value)}>
              <option value="All">Role: All</option>
              {ROLES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
            {STATES.map((state) => (
              <Chip key={state} active={stateFrom === state} tone="#56d8ff" onClick={() => setStateFrom(stateFrom === state ? "All" : state)}>
                {state}
              </Chip>
            ))}
          </div>
        </section>

        {status ? <section style={card}><p style={{ ...muted, margin: 0 }}>{status}</p></section> : null}

        <section className="vf-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 16 }}>
          {filtered.map((profile, index) => (
            <MemberCard key={`${profile.email || profile.full_name || "member"}-${index}`} profile={profile} />
          ))}
        </section>
      </div>
    </main>
  );
}

function Mini({ title, value }: { title: string; value: unknown }) {
  return (
    <section
      style={{
        border: "1px solid rgba(255,255,255,.12)",
        borderRadius: 18,
        padding: 14,
        background: "rgba(255,255,255,.045)",
      }}
    >
      <div style={label}>{title}</div>
      <div style={{ fontSize: 28, fontWeight: 1000, marginTop: 8 }}>{clean(value)}</div>
    </section>
  );
}
