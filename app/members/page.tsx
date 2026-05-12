"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import VaultForgeMemberNav from "../components/VaultForgeMemberNav";

type Row = Record<string, any>;

const ALLOWED_STATES = [
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

function list(value: unknown) {
  if (Array.isArray(value)) return value.map(clean).filter(Boolean);
  if (typeof value === "string") {
    return value
      .split(/[,\n|]/)
      .map(clean)
      .filter(Boolean);
  }
  return [];
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
  return first(row.full_name, row.name, row.display_name, row.username, row.company_name, m.full_name, m.name, m.display_name, m.company_name, emailOf(row), "VaultForge Member");
}

function companyOf(row: Row) {
  const m = meta(row);
  return first(row.company, row.company_name, row.business_name, m.company, m.company_name, m.business_name, "Independent Operator");
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
  const values = [
    ...list(row.states),
    ...list(row.operating_states),
    ...list(row.markets),
    ...list(row.deal_states),
    ...list(m.states),
    ...list(m.operating_states),
    ...list(m.markets),
    ...list(m.deal_states),
    first(row.state, row.home_state, m.state, m.home_state),
  ].filter(Boolean);

  const filtered = values.filter((state) =>
    ALLOWED_STATES.some((allowed) => allowed.toLowerCase() === state.toLowerCase())
  );

  return Array.from(new Set(filtered.length ? filtered : values)).slice(0, 7);
}

function rolesOf(row: Row) {
  const m = meta(row);
  const values = [
    ...list(row.member_types),
    ...list(row.member_type),
    ...list(row.roles),
    ...list(row.role),
    ...list(m.member_types),
    ...list(m.member_type),
    ...list(m.roles),
    ...list(m.role),
  ].filter(Boolean);

  return Array.from(new Set(values.length ? values : ["Member"])).slice(0, 8);
}

function capabilitiesOf(row: Row) {
  const m = meta(row);
  const values = [
    ...list(row.can_provide),
    ...list(row.provides),
    ...list(row.capabilities),
    ...list(row.skills),
    ...list(m.can_provide),
    ...list(m.provides),
    ...list(m.capabilities),
    ...list(m.skills),
  ].filter(Boolean);

  return Array.from(new Set(values)).slice(0, 10);
}

function needsOf(row: Row) {
  const m = meta(row);
  const values = [
    ...list(row.needs),
    ...list(row.looking_for),
    ...list(row.pain_signals),
    ...list(m.needs),
    ...list(m.looking_for),
    ...list(m.pain_signals),
  ].filter(Boolean);

  return Array.from(new Set(values)).slice(0, 10);
}

function strategyOf(row: Row) {
  const m = meta(row);
  return first(row.strategy_notes, row.buy_box, row.notes, row.description, m.strategy_notes, m.buy_box, m.notes, "Network profile ready for routing.");
}

function scoreOf(row: Row) {
  const m = meta(row);
  let score = Number(row.routing_score || row.match_score || row.score || m.routing_score || m.match_score || 0);

  if (!Number.isFinite(score) || score <= 0) score = 50;
  if (statesOf(row).length) score += 10;
  if (rolesOf(row).length) score += 8;
  if (capabilitiesOf(row).length) score += 12;
  if (needsOf(row).length) score += 6;
  if (photoOf(row)) score += 4;

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
  const connectHref = `/connect/member-${encodeURIComponent(id || email || nameOf(row))}?email=${encodeURIComponent(viewer)}${email ? `&to=${encodeURIComponent(email)}` : ""}&source=member&subject=${encodeURIComponent("VaultForge member connection request")}`;

  return (
    <article style={glass}>
      <div style={{ display: "grid", gridTemplateColumns: "150px 1fr", gap: 18 }}>
        <div
          style={{
            borderRadius: 22,
            overflow: "hidden",
            border: "1px solid rgba(232,196,107,.18)",
            background: "rgba(0,0,0,.20)",
            minHeight: 150,
          }}
        >
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt="Member profile" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          ) : (
            <div style={{ height: 150, display: "grid", placeItems: "center", color: "#94a3b8", fontWeight: 850, textAlign: "center" }}>
              Network<br />Profile
            </div>
          )}
        </div>

        <div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 14, flexWrap: "wrap", alignItems: "flex-start" }}>
            <div>
              <h3 style={{ fontSize: 34, lineHeight: 1.02, margin: "0 0 8px" }}>{nameOf(row)}</h3>
              <p style={{ ...muted, margin: "0 0 8px" }}>{companyOf(row)}</p>
              {email ? <p style={{ color: "white", fontWeight: 900, margin: 0 }}>{email}</p> : null}
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
              <div style={{ fontSize: 40, lineHeight: 1, fontWeight: 1000, color: "#f8e7b0" }}>{score}</div>
              <div style={{ color: "#cbd5e1", fontSize: 12, marginTop: 6, fontWeight: 850 }}>Routing score</div>
            </div>
          </div>

          <div style={{ marginTop: 14 }}>
            <span style={{ ...chip, color: "#f8e7b0", borderColor: "rgba(232,196,107,.26)", background: "rgba(232,196,107,.08)" }}>
              {statusOf(row)}
            </span>
            {roles.map((role) => <span key={role} style={chip}>{role}</span>)}
          </div>

          <div style={{ marginTop: 12 }}>
            {states.map((state) => (
              <span key={state} style={{ ...chip, color: "#8fd3ff", borderColor: "rgba(56,189,248,.28)", background: "rgba(56,189,248,.08)" }}>
                {state}
              </span>
            ))}
          </div>

          <p style={{ ...muted, marginTop: 14 }}>{strategyOf(row)}</p>

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
            <Link href="/signals" style={ghost}>Find Signals</Link>
            <Link href="/routing-inbox" style={ghost}>Route / Match</Link>
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
        strategyOf(item),
        ...rolesOf(item),
        ...statesOf(item),
        ...capabilitiesOf(item),
        ...needsOf(item),
      ].join(" ").toLowerCase();

      const matchesQuery = !q || searchable.includes(q);
      const matchesState = !stateFilter || statesOf(item).some((state) => state.toLowerCase() === stateFilter.toLowerCase());

      return matchesQuery && matchesState;
    });
  }, [items, query, stateFilter]);

  const counts = useMemo(() => {
    const active = items.filter((item) => statusOf(item).toLowerCase().includes("active") || statusOf(item).toLowerCase().includes("member")).length;
    const withStates = items.filter((item) => statesOf(item).length).length;
    const withCapabilities = items.filter((item) => capabilitiesOf(item).length).length;

    return { total: items.length, active, withStates, withCapabilities };
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
          subtitle="Private network directory by state, profile, need, capability, and routing fit."
          active="members"
        />

        <section style={card}>
          <div style={eyebrow}>VaultForge Member Network</div>
          <h1 style={{ fontSize: "clamp(52px,10vw,96px)", lineHeight: 0.88, letterSpacing: "-.07em", margin: "12px 0 18px" }}>
            Network command.
          </h1>
          <p style={{ ...muted, fontSize: 20, maxWidth: 980 }}>
            Search members by state, role, capability, capital, operator fit, pain signals, and routing profile.
          </p>

          <div style={{ marginTop: 16 }}>
            <span style={chip}>Signed in: {email || "unknown"}</span>
            <span style={chip}>Members: {counts.total}</span>
            <span style={chip}>Active: {counts.active}</span>
            <span style={chip}>Routable: {counts.withCapabilities}</span>
          </div>

          <div className="vf-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 20 }}>
            <Link href="/dashboard" style={ghost}>Dashboard</Link>
            <Link href="/messages" style={ghost}>Messages</Link>
            <Link href="/routing-inbox" style={ghost}>Routing</Link>
            <Link href="/profile" style={button}>Edit Profile</Link>
            <button type="button" onClick={load} style={ghost}>Refresh</button>
          </div>
        </section>

        <section className="vf-four" style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 16, marginBottom: 18 }}>
          <Metric label="Members" value={String(counts.total)} tone="blue" />
          <Metric label="Active" value={String(counts.active)} tone="green" />
          <Metric label="State Ready" value={String(counts.withStates)} tone="gold" />
          <Metric label="Capabilities" value={String(counts.withCapabilities)} tone="red" />
        </section>

        <section style={card}>
          <div style={eyebrow}>Network Filter</div>

          <div className="vf-grid" style={{ display: "grid", gridTemplateColumns: "1.25fr .75fr", gap: 14, marginTop: 16 }}>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search member, role, state, capital, buyer, contractor, lender..."
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
              {ALLOWED_STATES.map((state) => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
          </div>
        </section>

        <section style={card}>
          <div style={eyebrow}>Member Queue</div>
          <h2 style={{ fontSize: 42, lineHeight: 1, margin: "10px 0 18px" }}>Routable network profiles.</h2>

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
                Adjust filters or complete more member profiles so the network can route by state, need, and capability.
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
