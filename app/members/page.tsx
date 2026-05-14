"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import VaultForgeMemberNav from "../components/VaultForgeMemberNav";

type Row = Record<string, any>;

const OPERATING_STATES = [
  "Georgia",
  "Florida",
  "North Carolina",
  "South Carolina",
  "Tennessee",
  "Alabama",
  "Texas",
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

function getEmail() {
  if (typeof window === "undefined") return "";

  const keys = ["vf_email", "vf_member_email", "vf_admin_email", "email", "memberEmail"];

  for (const key of keys) {
    const localValue = cleanEmail(window.localStorage.getItem(key));
    if (localValue.includes("@")) return localValue;

    const sessionValue = cleanEmail(window.sessionStorage.getItem(key));
    if (sessionValue.includes("@")) return sessionValue;
  }

  return cleanEmail(readCookie("vf_email") || readCookie("vf_member_email") || readCookie("vf_admin_email"));
}

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

function meta(row: Row) {
  return typeof row?.metadata === "object" && row.metadata ? row.metadata : {};
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

function splitList(value: unknown) {
  if (Array.isArray(value)) return value.map(clean).filter(Boolean);
  if (typeof value === "string") {
    return value
      .split(/[,\n|;]/)
      .map(clean)
      .filter(Boolean);
  }
  return [];
}

function unique(values: string[]) {
  return Array.from(new Set(values.map(clean).filter(Boolean)));
}

function memberId(row: Row) {
  const m = meta(row);
  return first(row.id, row.profile_id, row.member_id, row.auth_user_id, m.id, m.profile_id, m.member_id);
}

function emailOf(row: Row) {
  const m = meta(row);
  return cleanEmail(first(row.email, row.member_email, row.user_email, m.email, m.member_email, m.user_email));
}

function nameOf(row: Row) {
  const m = meta(row);
  return first(row.full_name, row.name, row.display_name, row.username, m.full_name, m.name, m.display_name, emailOf(row), "VaultForge Member");
}

function companyOf(row: Row) {
  const m = meta(row);
  return first(row.company, row.company_name, row.business_name, m.company, m.company_name, m.business_name, "VaultForge");
}

function statusOf(row: Row) {
  const m = meta(row);
  return first(row.access_status, row.member_status, row.status, row.payment_status, m.access_status, m.member_status, m.status, "member");
}

function photoOf(row: Row) {
  const m = meta(row);
  return first(row.profile_photo_url, row.avatar_url, row.photo_url, row.image_url, m.profile_photo_url, m.avatar_url, m.photo_url, m.image_url);
}

function statesOf(row: Row) {
  const m = meta(row);

  const raw = unique([
    ...splitList(row.states),
    ...splitList(row.operating_states),
    ...splitList(row.deal_states),
    ...splitList(row.markets),
    ...splitList(row.service_states),
    ...splitList(row.work_states),
    ...splitList(row.preferred_states),
    ...splitList(row.target_states),
    ...splitList(m.states),
    ...splitList(m.operating_states),
    ...splitList(m.deal_states),
    ...splitList(m.markets),
    ...splitList(m.service_states),
    ...splitList(m.work_states),
    ...splitList(m.preferred_states),
    ...splitList(m.target_states),
    first(row.state, row.home_state, row.operating_state, m.state, m.home_state, m.operating_state),
  ]);

  const normalized = raw
    .map((state) => {
      const found = OPERATING_STATES.find((allowed) => allowed.toLowerCase() === state.toLowerCase());
      return found || "";
    })
    .filter(Boolean);

  return unique(normalized);
}

function rolesOf(row: Row) {
  const m = meta(row);
  return unique([
    ...splitList(row.member_types),
    ...splitList(row.member_type),
    ...splitList(row.roles),
    ...splitList(row.role),
    ...splitList(m.member_types),
    ...splitList(m.member_type),
    ...splitList(m.roles),
    ...splitList(m.role),
  ]).slice(0, 8);
}

function strategiesOf(row: Row) {
  const m = meta(row);
  return unique([
    ...splitList(row.strategies),
    ...splitList(row.strategy),
    ...splitList(row.asset_focus),
    ...splitList(m.strategies),
    ...splitList(m.strategy),
    ...splitList(m.asset_focus),
  ]).slice(0, 10);
}

function capabilitiesOf(row: Row) {
  const m = meta(row);
  return unique([
    ...splitList(row.can_provide),
    ...splitList(row.provides),
    ...splitList(row.capabilities),
    ...splitList(row.skills),
    ...splitList(m.can_provide),
    ...splitList(m.provides),
    ...splitList(m.capabilities),
    ...splitList(m.skills),
  ]).slice(0, 10);
}

function needsOf(row: Row) {
  const m = meta(row);
  return unique([
    ...splitList(row.needs),
    ...splitList(row.looking_for),
    ...splitList(row.pain_signals),
    ...splitList(m.needs),
    ...splitList(m.looking_for),
    ...splitList(m.pain_signals),
  ]).slice(0, 10);
}

function strategyNote(row: Row) {
  const m = meta(row);
  return first(row.strategy_notes, row.buy_box, row.notes, row.description, m.strategy_notes, m.buy_box, m.notes, "Network profile ready for alignment.");
}

function accepted(row: Row) {
  const text = `${statusOf(row)} ${first(row.network_status, row.accepted_network, meta(row).network_status, meta(row).accepted_network)}`.toLowerCase();
  return text.includes("accepted") || text.includes("active") || text.includes("member");
}

function scoreOf(row: Row) {
  const m = meta(row);
  let score = Number(row.alignment_score || row.match_score || row.score || m.alignment_score || m.match_score || 0);

  if (!Number.isFinite(score) || score <= 0) score = 50;
  if (statesOf(row).length) score += 12;
  if (rolesOf(row).length) score += 8;
  if (capabilitiesOf(row).length) score += 10;
  if (needsOf(row).length) score += 6;
  if (photoOf(row)) score += 4;
  if (accepted(row)) score += 10;

  return Math.min(100, Math.max(0, Math.round(score)));
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

const card: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.24)",
  borderRadius: 30,
  padding: 24,
  background: "linear-gradient(145deg,rgba(255,255,255,.070),rgba(255,255,255,.030))",
  boxShadow: "0 28px 86px rgba(0,0,0,.30)",
  marginBottom: 18,
};

const glass: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.12)",
  borderRadius: 22,
  padding: 18,
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

const stateChip: React.CSSProperties = {
  ...chip,
  color: "#8fd3ff",
  borderColor: "rgba(56,189,248,.30)",
  background: "rgba(56,189,248,.08)",
};

function Metric({ label, value, tone }: { label: string; value: string; tone: "blue" | "green" | "gold" | "red" }) {
  const color = tone === "blue" ? "#38bdf8" : tone === "green" ? "#4ade80" : tone === "red" ? "#f87171" : "#e8c46b";

  return (
    <section style={glass}>
      <div style={{ color, fontWeight: 950, letterSpacing: ".14em", textTransform: "uppercase", fontSize: 12 }}>{label}</div>
      <div style={{ fontSize: 52, fontWeight: 1000, lineHeight: 1, marginTop: 12 }}>{value}</div>
    </section>
  );
}

function MemberCard({ row, viewer }: { row: Row; viewer: string }) {
  const id = memberId(row);
  const email = emailOf(row);
  const photo = photoOf(row);
  const score = scoreOf(row);
  const roles = rolesOf(row);
  const states = statesOf(row);
  const capabilities = capabilitiesOf(row);
  const needs = needsOf(row);
  const strategies = strategiesOf(row);
  const connectHref = `/connect/member-${encodeURIComponent(id || email || nameOf(row))}?email=${encodeURIComponent(viewer)}${email ? `&to=${encodeURIComponent(email)}` : ""}&source=member&subject=${encodeURIComponent("VaultForge member connection request")}`;

  return (
    <article style={glass}>
      <div style={{ display: "grid", gridTemplateColumns: "170px 1fr", gap: 18 }}>
        <div
          style={{
            borderRadius: 22,
            overflow: "hidden",
            border: "1px solid rgba(232,196,107,.18)",
            background: "rgba(0,0,0,.20)",
            minHeight: 170,
          }}
        >
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt="Member profile" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          ) : (
            <div style={{ height: 170, display: "grid", placeItems: "center", color: "#94a3b8", fontWeight: 850, textAlign: "center" }}>
              Member<br />Profile
            </div>
          )}
        </div>

        <div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 14, flexWrap: "wrap", alignItems: "flex-start" }}>
            <div>
              <div style={eyebrow}>Member Profile</div>
              <h3 style={{ fontSize: 38, lineHeight: 1.02, margin: "8px 0 8px" }}>{nameOf(row)}</h3>
              <p style={{ ...muted, margin: "0 0 8px", fontWeight: 900, color: "white" }}>{companyOf(row)}</p>
              {email ? <p style={{ color: "#cbd5e1", fontWeight: 850, margin: 0 }}>{email}</p> : null}
            </div>

            <div
              style={{
                border: "1px solid rgba(232,196,107,.28)",
                borderRadius: 20,
                minWidth: 86,
                padding: 14,
                textAlign: "center",
                background: "rgba(232,196,107,.06)",
              }}
            >
              <div style={{ fontSize: 42, lineHeight: 1, fontWeight: 1000, color: "#f8e7b0" }}>{score}</div>
              <div style={{ color: "#cbd5e1", fontSize: 12, marginTop: 6, fontWeight: 850 }}>Network fit</div>
            </div>
          </div>

          <div style={{ marginTop: 14 }}>
            <span style={{ ...chip, color: accepted(row) ? "#9df3bf" : "#f8e7b0" }}>
              Network: {accepted(row) ? "Accepted" : "Pending"}
            </span>
            {(roles.length ? roles : ["Member"]).map((role) => <span key={role} style={chip}>{role}</span>)}
          </div>

          <div style={{ marginTop: 12 }}>
            <div style={{ color: "#94a3b8", fontSize: 12, textTransform: "uppercase", letterSpacing: ".12em", fontWeight: 950, marginBottom: 8 }}>
              Operating states
            </div>
            {(states.length ? states : ["No states selected"]).map((state) => (
              <span key={state} style={states.length ? stateChip : chip}>{state}</span>
            ))}
          </div>

          {strategies.length ? (
            <div style={{ marginTop: 12 }}>
              <div style={{ color: "#94a3b8", fontSize: 12, textTransform: "uppercase", letterSpacing: ".12em", fontWeight: 950, marginBottom: 8 }}>
                Strategy / asset focus
              </div>
              {strategies.map((item) => <span key={item} style={chip}>{item}</span>)}
            </div>
          ) : null}

          <p style={{ ...muted, marginTop: 14 }}>{strategyNote(row)}</p>

          <div className="vf-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 14 }}>
            <div style={glass}>
              <div style={eyebrow}>Can Provide</div>
              <div style={{ marginTop: 10 }}>
                {(capabilities.length ? capabilities : ["No provider abilities listed yet."]).map((item) => (
                  <span key={item} style={chip}>{item}</span>
                ))}
              </div>
            </div>

            <div style={glass}>
              <div style={eyebrow}>Needs / Watches</div>
              <div style={{ marginTop: 10 }}>
                {(needs.length ? needs : ["No needs listed yet."]).map((item) => (
                  <span key={item} style={chip}>{item}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="vf-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
            <Link href={connectHref} style={button}>Message / Request Connection</Link>
            <Link href="/signals" style={ghost}>View Opportunities</Link>
            <Link href="/alignment-inbox" style={ghost}>Open Network</Link>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function MembersPage() {
  const [email, setEmail] = useState("");
  const [items, setItems] = useState<Row[]>([]);
  const [status, setStatus] = useState("Loading member network...");
  const [query, setQuery] = useState("");
  const [stateFilter, setStateFilter] = useState("");

  async function load() {
    const viewer = getEmail();
    setEmail(viewer);
    setStatus("Loading member network...");

    try {
      const urls = [
        `/api/admin/members?email=${encodeURIComponent(viewer)}&owner=0`,
        `/api/members?email=${encodeURIComponent(viewer)}&owner=0`,
      ];

      for (const url of urls) {
        try {
          const res = await fetch(url, {
            cache: "no-store",
            headers: { "x-vf-email": viewer || "", "x-vf-admin": "0" },
          });

          const data = await safeJson(res);
          const list = [
            ...(Array.isArray(data.members) ? data.members : []),
            ...(Array.isArray(data.profiles) ? data.profiles : []),
            ...(Array.isArray(data.items) ? data.items : []),
            ...(Array.isArray(data.data) ? data.data : []),
          ];

          if (list.length) {
            setItems(list);
            setStatus("");
            return;
          }
        } catch {
          // Try next source.
        }
      }

      setItems([]);
      setStatus("No member profiles connected yet.");
    } catch (error: any) {
      setStatus(error?.message || "Could not load member network.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();

    return items.filter((item) => {
      const searchable = [
        nameOf(item),
        companyOf(item),
        emailOf(item),
        statusOf(item),
        strategyNote(item),
        ...rolesOf(item),
        ...statesOf(item),
        ...strategiesOf(item),
        ...capabilitiesOf(item),
        ...needsOf(item),
      ].join(" ").toLowerCase();

      const matchesQuery = !q || searchable.includes(q);
      const matchesState = !stateFilter || statesOf(item).some((state) => state.toLowerCase() === stateFilter.toLowerCase());

      return matchesQuery && matchesState;
    });
  }, [items, query, stateFilter]);

  const counts = useMemo(() => {
    const acceptedCount = items.filter((item) => accepted(item)).length;
    const withStates = items.filter((item) => statesOf(item).length).length;
    const withCapabilities = items.filter((item) => capabilitiesOf(item).length).length;

    return { total: items.length, accepted: acceptedCount, withStates, withCapabilities };
  }, [items]);

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
          subtitle="Private operator network organized by markets, capabilities, execution style, and opportunity alignment."
          active="members"
        />

        <section style={card}>
          <div style={eyebrow}>VaultForge Network</div>
          <h1 style={{ fontSize: "clamp(52px,10vw,96px)", lineHeight: 0.88, letterSpacing: "-.07em", margin: "12px 0 18px" }}>
            Private operator network.
          </h1>
          <p style={{ ...muted, fontSize: 20, maxWidth: 980 }}>
            VaultForge maps members by market, capability, execution style, and operational fit so opportunities naturally flow toward the right people.
          </p>

          <div style={{ marginTop: 16 }}>
            <span style={chip}>Signed in: {email || "unknown"}</span>
            <span style={chip}>Members: {counts.total}</span>
            <span style={chip}>Network accepted: {counts.accepted}</span>
            <span style={chip}>State ready: {counts.withStates}</span>
          </div>

          <div className="vf-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 20 }}>
            <button type="button" onClick={load} style={button}>Refresh Members</button>
            <Link href="/profile" style={ghost}>Edit Profile</Link>
            <Link href="/messages" style={ghost}>Messages</Link>
            <Link href="/dashboard" style={ghost}>Dashboard</Link>
          </div>
        </section>

        <section className="vf-four" style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 16, marginBottom: 18 }}>
          <Metric label="Members" value={String(counts.total)} tone="blue" />
          <Metric label="Accepted" value={String(counts.accepted)} tone="green" />
          <Metric label="State Ready" value={String(counts.withStates)} tone="gold" />
          <Metric label="Capabilities" value={String(counts.withCapabilities)} tone="red" />
        </section>

        <section style={card}>
          <div style={eyebrow}>Search Network</div>

          <div className="vf-grid" style={{ display: "grid", gridTemplateColumns: "1.25fr .75fr", gap: 14, marginTop: 16 }}>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search members, markets, roles, strategies..."
              style={{
                width: "100%",
                boxSizing: "border-box",
                borderRadius: 18,
                border: "1px solid rgba(255,255,255,.16)",
                background: "rgba(255,255,255,.08)",
                color: "white",
                padding: 15,
                fontSize: 16,
                outline: "none",
              }}
            />

            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              style={{
                width: "100%",
                boxSizing: "border-box",
                borderRadius: 18,
                border: "1px solid rgba(255,255,255,.16)",
                background: "rgba(255,255,255,.08)",
                color: "white",
                padding: 15,
                fontSize: 16,
                outline: "none",
              }}
            >
              <option value="">All operating states</option>
              {OPERATING_STATES.map((state) => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
          </div>

          <div style={{ marginTop: 14 }}>
            {OPERATING_STATES.map((state) => (
              <button
                key={state}
                type="button"
                onClick={() => setStateFilter(stateFilter === state ? "" : state)}
                style={{
                  ...stateChip,
                  cursor: "pointer",
                  borderColor: stateFilter === state ? "rgba(232,196,107,.70)" : "rgba(56,189,248,.30)",
                  color: stateFilter === state ? "#f8e7b0" : "#8fd3ff",
                }}
              >
                {state}
              </button>
            ))}
          </div>
        </section>

        <section style={card}>
          <div style={eyebrow}>Operator Network</div>
          <h2 style={{ fontSize: 42, lineHeight: 1, margin: "10px 0 18px" }}>Profiles aligned to markets, capabilities, and execution fit.</h2>

          {filtered.length ? (
            <div style={{ display: "grid", gap: 14 }}>
              {filtered.map((item, index) => (
                <MemberCard key={memberId(item) || emailOf(item) || `${nameOf(item)}-${index}`} row={item} viewer={email} />
              ))}
            </div>
          ) : (
            <div style={glass}>
              <h3 style={{ marginTop: 0 }}>No matching members found.</h3>
              <p style={muted}>
                Adjust filters or complete more member profiles so VaultForge can better align opportunities, operators, and execution capacity.
              </p>
              <div className="vf-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
                <Link href="/profile" style={button}>Edit Profile</Link>
                <Link href="/dashboard" style={ghost}>Dashboard</Link>
              </div>
            </div>
          )}
        </section>

        {status ? <section style={card}>{status}</section> : null}
      </div>
    </main>
  );
}