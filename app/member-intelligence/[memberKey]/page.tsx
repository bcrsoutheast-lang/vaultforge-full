"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

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

const wrap: React.CSSProperties = { maxWidth: 1240, margin: "0 auto" };

const hero: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.34)",
  background:
    "linear-gradient(145deg, rgba(232,196,107,.12), rgba(181,92,255,.10), rgba(255,255,255,.035))",
  borderRadius: 34,
  padding: 26,
  marginBottom: 22,
  boxShadow: "0 30px 90px rgba(0,0,0,.34)",
};

const card: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.13)",
  background:
    "linear-gradient(145deg, rgba(181,92,255,.10), rgba(232,196,107,.055), rgba(255,255,255,.03))",
  borderRadius: 28,
  padding: 22,
  boxShadow: "0 26px 80px rgba(0,0,0,.34)",
};

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
  gap: 18,
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

function hasRole(member: Member, role: string) {
  return Array.isArray(member.roles) && member.roles.some((item: string) => clean(item).toLowerCase() === role.toLowerCase());
}

function routingRecommendations(member: Member) {
  const recs: string[] = [];

  if (hasRole(member, "Buyer")) {
    recs.push("Route acquisition, seller pain, and deal-flow signals when market and asset type match.");
  }

  if (hasRole(member, "Lender")) {
    recs.push("Route capital-needed signals, funding gaps, and private money opportunities.");
  }

  if (hasRole(member, "Operator")) {
    recs.push("Route execution-heavy deals, JV needs, stabilization issues, and operator-needed pain.");
  }

  if (hasRole(member, "Contractor")) {
    recs.push("Route repair, construction, renovation, and scope-of-work signals.");
  }

  if (hasRole(member, "Wholesaler")) {
    recs.push("Route disposition, buyer demand, assignment, and seller lead opportunities.");
  }

  if (recs.length === 0) {
    recs.push("Profile needs stronger role and market data before confident routing.");
  }

  if (Array.isArray(member.completeness_gaps) && member.completeness_gaps.length > 0) {
    recs.push(`Before heavier routing, fill gaps: ${member.completeness_gaps.map((gap: string) => label(gap)).join(", ")}.`);
  }

  return recs;
}

function fitScore(member: Member) {
  const base = Number(member.completeness_score || 0);
  let score = base;

  if (Array.isArray(member.roles) && member.roles.length > 0) score += 5;
  if (Array.isArray(member.markets) && member.markets.length > 0) score += 5;
  if (Array.isArray(member.strategies) && member.strategies.length > 0) score += 5;
  if (Array.isArray(member.asset_types) && member.asset_types.length > 0) score += 5;
  if (clean(member.funding_capacity)) score += 3;

  return Math.max(0, Math.min(100, Math.round(score)));
}

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

function StatCard({ title, value, detail, tone }: { title: string; value: string | number; detail: string; tone?: string }) {
  return (
    <div style={{ ...card, borderColor: `${tone || "#9df3bf"}66` }}>
      <div style={{ color: tone || "#9df3bf", letterSpacing: 4, fontWeight: 900, fontSize: 11, marginBottom: 10, textTransform: "uppercase" }}>
        {title}
      </div>
      <div style={{ fontSize: 42, fontWeight: 950, lineHeight: 1 }}>{value}</div>
      <p style={{ color: "rgba(255,255,255,.68)", lineHeight: 1.45, marginBottom: 0 }}>{detail}</p>
    </div>
  );
}

function TagSection({ title, values }: { title: string; values: string[] }) {
  if (!Array.isArray(values) || values.length === 0) return null;

  return (
    <section style={card}>
      <div style={{ color: "#9df3bf", letterSpacing: 4, fontWeight: 900, fontSize: 11, marginBottom: 10, textTransform: "uppercase" }}>
        {title}
      </div>
      {values.map((value) => (
        <span key={value} style={chip}>{value}</span>
      ))}
    </section>
  );
}

export default function MemberIntelligenceDetailPage() {
  const params = useParams();
  const memberKey = decodeURIComponent(String(params?.memberKey || ""));

  const [email, setEmail] = useState("");
  const [owner, setOwner] = useState(false);
  const [member, setMember] = useState<Member | null>(null);
  const [status, setStatus] = useState("Loading member intelligence detail...");

  async function load() {
    setStatus("Loading member intelligence detail...");

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

      const rows = Array.isArray(data?.members) ? data.members : [];
      const found =
        rows.find((item: Member) => clean(item.id) === memberKey) ||
        rows.find((item: Member) => clean(item.email).toLowerCase() === memberKey.toLowerCase()) ||
        rows.find((item: Member) => encodeURIComponent(clean(item.email).toLowerCase()) === memberKey) ||
        null;

      setMember(found);
      setStatus(found ? "" : "Member intelligence profile not found.");
    } catch (error: any) {
      setStatus(error?.message || "Could not load member intelligence detail.");
    }
  }

  useEffect(() => {
    load();
  }, [memberKey]);

  const tone = readinessTone(member?.routing_readiness || "low");
  const score = member ? fitScore(member) : 0;
  const recs = member ? routingRecommendations(member) : [];

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
          .vf-member-detail-actions {
            display: grid !important;
            grid-template-columns: 1fr !important;
            gap: 10px !important;
          }

          .vf-member-detail-actions > * {
            width: 100%;
            margin: 0 !important;
            box-sizing: border-box;
          }
        }
      `}</style>

      <div style={wrap}>
        <section style={{ ...hero, borderColor: `${tone}66` }}>
          <div style={{ color: tone, letterSpacing: 5, fontWeight: 950, fontSize: 12, marginBottom: 12, textTransform: "uppercase" }}>
            VaultForge Member Intelligence Detail · {owner ? "Owner View" : "Member View"}
          </div>

          <h1 style={{ fontSize: "clamp(54px,11vw,104px)", lineHeight: 0.86, margin: "0 0 18px" }}>
            {member?.full_name || member?.email || "Member profile"}
          </h1>

          <p style={{ color: "rgba(255,255,255,.72)", fontSize: 22, lineHeight: 1.55 }}>
            {member?.routing_summary || "Member specialization, market fit, and routing readiness details."}
          </p>

          <div>
            <span style={chip}>Readiness: {label(member?.routing_readiness || "low")}</span>
            <span style={chip}>Fit Score: {score}</span>
            {member?.email && <span style={chip}>{member.email}</span>}
            {member?.company && <span style={chip}>{member.company}</span>}
          </div>

          <div className="vf-member-detail-actions" style={{ marginTop: 14 }}>
            <button type="button" style={btn} onClick={load}>Refresh Detail</button>
            <Link href="/member-intelligence" style={ghost}>Back to Member Intelligence</Link>
            <Link href="/activity" style={ghost}>Activity</Link>
            <Link href="/routing-inbox" style={ghost}>Routing Inbox</Link>
            <Link href="/intelligence" style={ghost}>Intelligence</Link>
            {owner && <Link href="/admin" style={ghost}>Admin</Link>}
          </div>

          {status && (
            <p style={{ color: status.toLowerCase().includes("could not") || status.toLowerCase().includes("not found") ? "#ffd0d0" : "#9df3bf", fontWeight: 900 }}>
              {status}
            </p>
          )}
        </section>

        {member && (
          <>
            <section style={statGrid}>
              <StatCard title="Fit Score" value={score} detail="Composite specialization depth and routing usefulness." tone={tone} />
              <StatCard title="Completeness" value={member.completeness_score || 0} detail="Profile data completeness for routing intelligence." tone={tone} />
              <StatCard title="Roles" value={Array.isArray(member.roles) ? member.roles.length : 0} detail="Declared or inferred role categories." />
              <StatCard title="Markets" value={Array.isArray(member.markets) ? member.markets.length : 0} detail="States and markets available for routing." />
              <StatCard title="Strategies" value={Array.isArray(member.strategies) ? member.strategies.length : 0} detail="Investment or service strategies." />
            </section>

            <section style={grid}>
              <TagSection title="Roles" values={member.roles || []} />
              <TagSection title="Markets" values={member.markets || []} />
              <TagSection title="Strategies" values={member.strategies || []} />
              <TagSection title="Asset Types" values={member.asset_types || []} />
              <TagSection title="Needs" values={member.needs || []} />
              <TagSection title="Provides" values={member.provides || []} />
            </section>

            <section style={{ ...hero, marginTop: 22 }}>
              <div style={{ color: "#9df3bf", letterSpacing: 5, fontWeight: 950, fontSize: 12, marginBottom: 12, textTransform: "uppercase" }}>
                Routing Recommendations
              </div>

              <h2 style={{ fontSize: 42, lineHeight: 1, margin: "0 0 14px" }}>
                Where this member fits.
              </h2>

              <section style={grid}>
                {recs.map((rec, index) => (
                  <article key={index} style={card}>
                    <p style={{ color: "rgba(255,255,255,.72)", lineHeight: 1.6, fontSize: 18, margin: 0 }}>
                      {rec}
                    </p>
                  </article>
                ))}
              </section>
            </section>

            {member.buy_box && (
              <section style={{ ...hero, marginTop: 22 }}>
                <div style={{ color: "#9df3bf", letterSpacing: 5, fontWeight: 950, fontSize: 12, marginBottom: 12, textTransform: "uppercase" }}>
                  Buy Box
                </div>
                <p style={{ color: "rgba(255,255,255,.72)", lineHeight: 1.6, fontSize: 19 }}>
                  {member.buy_box}
                </p>
              </section>
            )}

            {Array.isArray(member.completeness_gaps) && member.completeness_gaps.length > 0 && (
              <section style={{ ...hero, marginTop: 22 }}>
                <div style={{ color: "#ffb3b3", letterSpacing: 5, fontWeight: 950, fontSize: 12, marginBottom: 12, textTransform: "uppercase" }}>
                  Missing Intelligence
                </div>

                <p style={{ color: "rgba(255,255,255,.72)", fontSize: 19, lineHeight: 1.6 }}>
                  These gaps reduce routing confidence and should be completed before heavier automation.
                </p>

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

            <section style={{ ...hero, marginTop: 22 }}>
              <div style={{ color: "#9df3bf", letterSpacing: 5, fontWeight: 950, fontSize: 12, marginBottom: 12, textTransform: "uppercase" }}>
                Current Safety Mode
              </div>

              <p style={{ color: "rgba(255,255,255,.72)", fontSize: 19, lineHeight: 1.6 }}>
                This detail page is read-only. It does not edit profiles, route automatically, notify members,
                or trigger autonomous decisions.
              </p>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
