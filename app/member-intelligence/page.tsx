"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

const OWNER_EMAIL = "bcrsoutheast@gmail.com";

type Member = Record<string, any>;

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(232,196,107,.18), transparent 28%), radial-gradient(circle at top right, rgba(157,243,191,.13), transparent 25%), radial-gradient(circle at bottom right, rgba(181,92,255,.18), transparent 28%), linear-gradient(180deg,#02040a 0%,#071326 48%,#030509 100%)",
  color: "white",
  padding: "28px 18px 100px",
  fontFamily: "Arial, sans-serif",
};

const wrap: React.CSSProperties = {
  maxWidth: 1280,
  margin: "0 auto",
};

const hero: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.34)",
  background:
    "linear-gradient(145deg, rgba(232,196,107,.12), rgba(181,92,255,.10), rgba(255,255,255,.035))",
  borderRadius: 34,
  padding: 26,
  marginBottom: 22,
  boxShadow: "0 30px 90px rgba(0,0,0,.34)",
};

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(330px,1fr))",
  gap: 18,
};

const card: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.13)",
  background:
    "linear-gradient(145deg, rgba(181,92,255,.10), rgba(232,196,107,.055), rgba(255,255,255,.03))",
  borderRadius: 28,
  padding: 22,
  boxShadow: "0 26px 80px rgba(0,0,0,.34)",
};

const statGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))",
  gap: 14,
  marginBottom: 22,
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

const input: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  borderRadius: 18,
  border: "1px solid rgba(255,255,255,.18)",
  background: "rgba(255,255,255,.075)",
  color: "white",
  padding: 14,
  fontSize: 15,
};

function clean(value: unknown) {
  return String(value || "").trim();
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

  return (
    localStorage.getItem("vf_email") ||
    sessionStorage.getItem("vf_email") ||
    readCookie("vf_email") ||
    readCookie("vf_admin_email") ||
    ""
  ).trim().toLowerCase();
}

function isOwner(email: string) {
  return email === OWNER_EMAIL || readCookie("vf_admin") === "1" || readCookie("isAdmin") === "true";
}

function label(value: string) {
  const text = clean(value || "").replace(/_/g, " ");
  return text.slice(0, 1).toUpperCase() + text.slice(1);
}

function readinessTone(value: string) {
  const v = clean(value).toLowerCase();

  if (v === "high") return "#9df3bf";
  if (v === "medium") return "#f5d978";
  return "#ffb3b3";
}

function safeJson(res: Response) {
  return res.json().catch(() => ({}));
}

function StatCard({
  title,
  value,
  detail,
  tone,
}: {
  title: string;
  value: string | number;
  detail: string;
  tone?: string;
}) {
  return (
    <div style={{ ...card, borderColor: `${tone || "#9df3bf"}66` }}>
      <div
        style={{
          color: tone || "#9df3bf",
          letterSpacing: 4,
          fontWeight: 900,
          fontSize: 11,
          marginBottom: 10,
          textTransform: "uppercase",
        }}
      >
        {title}
      </div>

      <div style={{ fontSize: 42, fontWeight: 950, lineHeight: 1 }}>
        {value}
      </div>

      <p
        style={{
          color: "rgba(255,255,255,.68)",
          lineHeight: 1.45,
          marginBottom: 0,
        }}
      >
        {detail}
      </p>
    </div>
  );
}

export default function MemberIntelligencePage() {
  const [email, setEmail] = useState("");
  const [owner, setOwner] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [counts, setCounts] = useState<Record<string, any>>({});
  const [status, setStatus] = useState("Loading member intelligence...");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [readinessFilter, setReadinessFilter] = useState("all");

  async function load() {
    setStatus("Loading member intelligence...");

    try {
      const currentEmail = getEmail();
      const currentOwner = isOwner(currentEmail);

      setEmail(currentEmail);
      setOwner(currentOwner);

      const res = await fetch(
        `/api/member/specialization?email=${encodeURIComponent(currentEmail)}&owner=${currentOwner ? "1" : "0"}`,
        {
          cache: "no-store",
          headers: {
            "x-vf-email": currentEmail,
            "x-vf-admin": currentOwner ? "1" : "0",
          },
        }
      );

      const data = await safeJson(res);

      if (!res.ok || data?.ok === false) {
        throw new Error(data?.error || "Could not load member intelligence.");
      }

      setMembers(Array.isArray(data?.members) ? data.members : []);
      setCounts(data?.counts || {});
      setStatus(data?.members?.length ? "" : "No member intelligence profiles found.");
    } catch (error: any) {
      setStatus(error?.message || "Could not load member intelligence.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    let list = [...members];

    if (roleFilter !== "all") {
      list = list.filter((item) =>
        Array.isArray(item.roles) &&
        item.roles.some((role: string) => clean(role).toLowerCase() === roleFilter)
      );
    }

    if (readinessFilter !== "all") {
      list = list.filter(
        (item) => clean(item.routing_readiness).toLowerCase() === readinessFilter
      );
    }

    const q = search.trim().toLowerCase();

    if (q) {
      list = list.filter((item) =>
        [
          item.full_name,
          item.email,
          item.company,
          item.buy_box,
          ...(item.roles || []),
          ...(item.markets || []),
          ...(item.strategies || []),
          ...(item.asset_types || []),
        ]
          .join(" ")
          .toLowerCase()
          .includes(q)
      );
    }

    return list;
  }, [members, roleFilter, readinessFilter, search]);

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
          .vf-member-actions {
            display: grid !important;
            grid-template-columns: 1fr !important;
            gap: 10px !important;
          }

          .vf-member-actions > * {
            width: 100%;
            margin: 0 !important;
            box-sizing: border-box;
          }
        }
      `}</style>

      <div style={wrap}>
        <section style={hero}>
          <div
            style={{
              color: "#9df3bf",
              letterSpacing: 5,
              fontWeight: 950,
              fontSize: 12,
              marginBottom: 12,
              textTransform: "uppercase",
            }}
          >
            VaultForge Member Intelligence
          </div>

          <h1
            style={{
              fontSize: "clamp(56px,11vw,104px)",
              lineHeight: 0.86,
              margin: "0 0 18px",
            }}
          >
            Member network.
          </h1>

          <p
            style={{
              color: "rgba(255,255,255,.72)",
              fontSize: 22,
              lineHeight: 1.55,
            }}
          >
            Operational member specialization intelligence used for future routing,
            matching, capital alignment, and execution coordination.
          </p>

          <div>
            <span style={chip}>Profiles: {members.length}</span>
            <span style={chip}>High Readiness: {counts.routing_ready_high || 0}</span>
            <span style={chip}>Buyers: {counts.buyers || 0}</span>
            <span style={chip}>Lenders: {counts.lenders || 0}</span>
            <span style={chip}>{owner ? "Owner View" : "Member View"}</span>
          </div>

          <div className="vf-member-actions" style={{ marginTop: 14 }}>
            <button type="button" style={btn} onClick={load}>
              Refresh Intelligence
            </button>

            <Link href="/activity" style={ghost}>Activity</Link>
            <Link href="/routing-inbox" style={ghost}>Routing Inbox</Link>
            <Link href="/intelligence" style={ghost}>Intelligence</Link>
            <Link href="/alerts" style={ghost}>Alerts</Link>
            {owner && <Link href="/admin" style={ghost}>Admin</Link>}
          </div>

          {status && (
            <p
              style={{
                color: status.toLowerCase().includes("could not")
                  ? "#ffd0d0"
                  : "#9df3bf",
                fontWeight: 900,
              }}
            >
              {status}
            </p>
          )}
        </section>

        <section style={statGrid}>
          <StatCard
            title="Members"
            value={counts.members || members.length}
            detail="Operational member profiles loaded into intelligence layer."
          />
          <StatCard
            title="Routing Ready"
            value={counts.routing_ready_high || 0}
            detail="Profiles with strong routing context and specialization."
            tone="#9df3bf"
          />
          <StatCard
            title="Medium Readiness"
            value={counts.routing_ready_medium || 0}
            detail="Profiles needing additional market/strategy detail."
            tone="#f5d978"
          />
          <StatCard
            title="Low Readiness"
            value={counts.routing_ready_low || 0}
            detail="Profiles missing specialization depth."
            tone="#ffb3b3"
          />
        </section>

        <section style={hero}>
          <div
            style={{
              color: "#9df3bf",
              letterSpacing: 5,
              fontWeight: 950,
              fontSize: 12,
              marginBottom: 12,
              textTransform: "uppercase",
            }}
          >
            Intelligence Filters
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
              gap: 14,
            }}
          >
            <input
              style={input}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search members, markets, strategies..."
            />

            <select
              style={input}
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value)}
            >
              <option value="all" style={{ color: "#111" }}>All Roles</option>
              <option value="buyer" style={{ color: "#111" }}>Buyer</option>
              <option value="lender" style={{ color: "#111" }}>Lender</option>
              <option value="operator" style={{ color: "#111" }}>Operator</option>
              <option value="contractor" style={{ color: "#111" }}>Contractor</option>
              <option value="wholesaler" style={{ color: "#111" }}>Wholesaler</option>
            </select>

            <select
              style={input}
              value={readinessFilter}
              onChange={(event) => setReadinessFilter(event.target.value)}
            >
              <option value="all" style={{ color: "#111" }}>All Readiness</option>
              <option value="high" style={{ color: "#111" }}>High</option>
              <option value="medium" style={{ color: "#111" }}>Medium</option>
              <option value="low" style={{ color: "#111" }}>Low</option>
            </select>
          </div>
        </section>

        <section style={grid}>
          {filtered.map((member, index) => {
            const tone = readinessTone(member.routing_readiness);

            return (
              <article
                key={member.id || member.email || index}
                style={{
                  ...card,
                  borderColor: `${tone}66`,
                }}
              >
                <div
                  style={{
                    color: tone,
                    letterSpacing: 4,
                    fontWeight: 900,
                    fontSize: 11,
                    marginBottom: 10,
                    textTransform: "uppercase",
                  }}
                >
                  {label(member.routing_readiness || "low")} Routing Readiness
                </div>

                <h2
                  style={{
                    fontSize: 32,
                    lineHeight: 1.05,
                    margin: "0 0 10px",
                  }}
                >
                  {member.full_name || member.email || "Member"}
                </h2>

                <p
                  style={{
                    color: "rgba(255,255,255,.70)",
                    lineHeight: 1.55,
                    fontSize: 18,
                  }}
                >
                  {member.routing_summary || "Specialization intelligence incomplete."}
                </p>

                <div style={{ margin: "12px 0" }}>
                  <span style={chip}>
                    Score: {member.completeness_score || 0}
                  </span>

                  {member.company && (
                    <span style={chip}>{member.company}</span>
                  )}

                  {member.funding_capacity && (
                    <span style={chip}>
                      Capital: {member.funding_capacity}
                    </span>
                  )}
                </div>

                {Array.isArray(member.roles) && member.roles.length > 0 && (
                  <section style={{ marginBottom: 14 }}>
                    <div
                      style={{
                        color: "#9df3bf",
                        letterSpacing: 3,
                        fontWeight: 900,
                        fontSize: 11,
                        marginBottom: 8,
                        textTransform: "uppercase",
                      }}
                    >
                      Roles
                    </div>

                    {member.roles.map((role: string) => (
                      <span key={role} style={chip}>{role}</span>
                    ))}
                  </section>
                )}

                {Array.isArray(member.markets) && member.markets.length > 0 && (
                  <section style={{ marginBottom: 14 }}>
                    <div
                      style={{
                        color: "#9df3bf",
                        letterSpacing: 3,
                        fontWeight: 900,
                        fontSize: 11,
                        marginBottom: 8,
                        textTransform: "uppercase",
                      }}
                    >
                      Markets
                    </div>

                    {member.markets.map((market: string) => (
                      <span key={market} style={chip}>{market}</span>
                    ))}
                  </section>
                )}

                {Array.isArray(member.strategies) && member.strategies.length > 0 && (
                  <section style={{ marginBottom: 14 }}>
                    <div
                      style={{
                        color: "#9df3bf",
                        letterSpacing: 3,
                        fontWeight: 900,
                        fontSize: 11,
                        marginBottom: 8,
                        textTransform: "uppercase",
                      }}
                    >
                      Strategies
                    </div>

                    {member.strategies.map((strategy: string) => (
                      <span key={strategy} style={chip}>{strategy}</span>
                    ))}
                  </section>
                )}

                {Array.isArray(member.asset_types) && member.asset_types.length > 0 && (
                  <section style={{ marginBottom: 14 }}>
                    <div
                      style={{
                        color: "#9df3bf",
                        letterSpacing: 3,
                        fontWeight: 900,
                        fontSize: 11,
                        marginBottom: 8,
                        textTransform: "uppercase",
                      }}
                    >
                      Asset Types
                    </div>

                    {member.asset_types.map((type: string) => (
                      <span key={type} style={chip}>{type}</span>
                    ))}
                  </section>
                )}

                {member.buy_box && (
                  <section style={{ marginBottom: 14 }}>
                    <div
                      style={{
                        color: "#9df3bf",
                        letterSpacing: 3,
                        fontWeight: 900,
                        fontSize: 11,
                        marginBottom: 8,
                        textTransform: "uppercase",
                      }}
                    >
                      Buy Box
                    </div>

                    <p
                      style={{
                        color: "rgba(255,255,255,.70)",
                        lineHeight: 1.55,
                        marginBottom: 0,
                      }}
                    >
                      {member.buy_box}
                    </p>
                  </section>
                )}

                {Array.isArray(member.completeness_gaps) &&
                  member.completeness_gaps.length > 0 && (
                    <section style={{ marginBottom: 14 }}>
                      <div
                        style={{
                          color: "#ffb3b3",
                          letterSpacing: 3,
                          fontWeight: 900,
                          fontSize: 11,
                          marginBottom: 8,
                          textTransform: "uppercase",
                        }}
                      >
                        Missing Intelligence
                      </div>

                      {member.completeness_gaps.map((gap: string) => (
                        <span
                          key={gap}
                          style={{
                            ...chip,
                            color: "#ffb3b3",
                            border: "1px solid rgba(255,179,179,.35)",
                            background: "rgba(255,179,179,.08)",
                          }}
                        >
                          {label(gap)}
                        </span>
                      ))}
                    </section>
                  )}

                <div style={{ marginTop: 16 }}>
                  <Link href={`/member-intelligence/${encodeURIComponent(member.id || member.email || "")}`} style={btn}>
                    Open Intelligence Detail
                  </Link>

                  <Link href="/routing-inbox" style={ghost}>
                    Routing Context
                  </Link>

                  <Link href="/activity" style={ghost}>
                    Activity
                  </Link>

                  {owner && (
                    <Link href="/admin" style={ghost}>
                      Admin Review
                    </Link>
                  )}
                </div>
              </article>
            );
          })}
        </section>

        <section style={{ ...hero, marginTop: 22 }}>
          <div
            style={{
              color: "#9df3bf",
              letterSpacing: 5,
              fontWeight: 950,
              fontSize: 12,
              marginBottom: 12,
              textTransform: "uppercase",
            }}
          >
            Current Safety Mode
          </div>

          <p
            style={{
              color: "rgba(255,255,255,.72)",
              fontSize: 19,
              lineHeight: 1.6,
            }}
          >
            Member intelligence is currently read-only and observational. The platform
            is preparing routing, specialization, and coordination depth before
            autonomous execution behavior is enabled.
          </p>
        </section>
      </div>
    </main>
  );
}
