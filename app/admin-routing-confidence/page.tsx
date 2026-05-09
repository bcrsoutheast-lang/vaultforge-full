"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

const OWNER_EMAIL = "bcrsoutheast@gmail.com";

type Action = Record<string, any>;

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(232,196,107,.18), transparent 28%), radial-gradient(circle at top right, rgba(157,243,191,.13), transparent 25%), radial-gradient(circle at bottom right, rgba(181,92,255,.18), transparent 28%), linear-gradient(180deg,#02040a 0%,#071326 48%,#030509 100%)",
  color: "white",
  padding: "28px 18px 100px",
  fontFamily: "Arial, sans-serif",
};

const wrap: React.CSSProperties = { maxWidth: 1280, margin: "0 auto" };

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
  gridTemplateColumns: "repeat(auto-fit,minmax(310px,1fr))",
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
  const text = clean(value || "item").replace(/_/g, " ");
  return text.slice(0, 1).toUpperCase() + text.slice(1);
}

function safeScore(value: unknown) {
  const num = Number(value || 0);
  if (!Number.isFinite(num)) return 0;
  return Math.max(0, Math.min(100, Math.round(num)));
}

function confidenceLevel(score: number) {
  if (score >= 80) return "strong";
  if (score >= 60) return "working";
  return "thin";
}

function levelTone(level: string) {
  const value = clean(level).toLowerCase();
  if (value === "strong") return "#9df3bf";
  if (value === "working") return "#f5d978";
  return "#ffb3b3";
}

function missingContext(action: Action) {
  const gaps: string[] = [];

  if (!clean(action.state_match)) gaps.push("State / market");
  if (!clean(action.strategy_match)) gaps.push("Strategy");
  if (!clean(action.role_match)) gaps.push("Role");
  if (!clean(action.urgency_reason)) gaps.push("Urgency reason");
  if (!safeScore(action.confidence_score)) gaps.push("Confidence score");

  return gaps;
}

function actionScore(action: Action) {
  const explicit = safeScore(action.confidence_score || action.match_score);
  if (explicit) return explicit;

  let score = 35;
  if (clean(action.state_match)) score += 15;
  if (clean(action.strategy_match)) score += 15;
  if (clean(action.role_match)) score += 15;
  if (clean(action.urgency_reason)) score += 10;
  if (clean(action.priority).toLowerCase() === "urgent") score += 10;
  if (clean(action.priority).toLowerCase() === "high") score += 5;

  return Math.min(98, score);
}

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return {};
  }
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
      <div style={{ color: tone || "#9df3bf", letterSpacing: 4, fontWeight: 900, fontSize: 11, marginBottom: 10, textTransform: "uppercase" }}>
        {title}
      </div>
      <div style={{ fontSize: 42, fontWeight: 950, lineHeight: 1 }}>{value}</div>
      <p style={{ color: "rgba(255,255,255,.68)", lineHeight: 1.45, marginBottom: 0 }}>{detail}</p>
    </div>
  );
}

function Locked() {
  return (
    <main style={page}>
      <div style={wrap}>
        <section style={hero}>
          <div style={{ color: "#9df3bf", letterSpacing: 5, fontWeight: 950, fontSize: 12, marginBottom: 12, textTransform: "uppercase" }}>
            Routing Confidence
          </div>
          <h1 style={{ fontSize: "clamp(54px,12vw,100px)", lineHeight: 0.88, margin: "0 0 18px" }}>
            Owner access required.
          </h1>
          <Link href="/admin-login" style={btn}>Admin Login</Link>
          <Link href="/dashboard" style={ghost}>Dashboard</Link>
        </section>
      </div>
    </main>
  );
}

export default function AdminRoutingConfidencePage() {
  const [email, setEmail] = useState("");
  const [owner, setOwner] = useState(false);
  const [actions, setActions] = useState<Action[]>([]);
  const [status, setStatus] = useState("Loading routing confidence...");
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");

  async function load() {
    setStatus("Loading routing confidence...");

    try {
      const currentEmail = getEmail();
      const currentOwner = isOwner(currentEmail);

      setEmail(currentEmail);
      setOwner(currentOwner);

      if (!currentOwner) {
        setStatus("");
        return;
      }

      const res = await fetch(`/api/routing/actions?email=${encodeURIComponent(currentEmail)}&owner=1`, {
        cache: "no-store",
        headers: {
          "x-vf-email": currentEmail,
          "x-vf-admin": "1",
        },
      });

      const data = await safeJson(res);

      if (!res.ok || data?.ok === false) {
        throw new Error(data?.error || data?.details || "Could not load routing actions.");
      }

      setActions(Array.isArray(data?.actions) ? data.actions : []);
      setStatus("");
    } catch (error: any) {
      setStatus(error?.message || "Could not load routing confidence.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  const enriched = useMemo<(Action & {
    _score: number;
    _level: string;
    _gaps: string[];
  })[]>(() => {
    return actions.map((action) => {
      const score = actionScore(action);
      const level = confidenceLevel(score);

      return {
        ...action,
        _score: score,
        _level: level,
        _gaps: missingContext(action),
      };
    });
  }, [actions]);

  const filtered = useMemo<(Action & {
    _score: number;
    _level: string;
    _gaps: string[];
  })[]>(() => {
    let list = [...enriched];

    if (levelFilter !== "all") {
      list = list.filter((action) => action._level === levelFilter);
    }

    const q = search.trim().toLowerCase();

    if (q) {
      list = list.filter((action) =>
        [
          action.title,
          action.note,
          action.action,
          action.priority,
          action.state_match,
          action.strategy_match,
          action.role_match,
          action.urgency_reason,
          action.signal_id,
          action.item_id,
        ]
          .join(" ")
          .toLowerCase()
          .includes(q)
      );
    }

    return list.sort((a, b) => a._score - b._score);
  }, [enriched, levelFilter, search]);

  const stats = useMemo(() => {
    return {
      total: enriched.length,
      strong: enriched.filter((item) => item._level === "strong").length,
      working: enriched.filter((item) => item._level === "working").length,
      thin: enriched.filter((item) => item._level === "thin").length,
      gaps: enriched.reduce((total, item) => total + item._gaps.length, 0),
      urgent: enriched.filter((item) => clean(item.priority).toLowerCase() === "urgent").length,
    };
  }, [enriched]);

  if (!owner && !status) {
    return <Locked />;
  }

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
          .vf-confidence-actions {
            display: grid !important;
            grid-template-columns: 1fr !important;
            gap: 10px !important;
          }

          .vf-confidence-actions > * {
            width: 100%;
            margin: 0 !important;
            box-sizing: border-box;
          }
        }
      `}</style>

      <div style={wrap}>
        <section style={hero}>
          <div style={{ color: "#9df3bf", letterSpacing: 5, fontWeight: 950, fontSize: 12, marginBottom: 12, textTransform: "uppercase" }}>
            VaultForge Routing Confidence Board
          </div>

          <h1 style={{ fontSize: "clamp(56px,11vw,104px)", lineHeight: 0.86, margin: "0 0 18px" }}>
            Routing quality.
          </h1>

          <p style={{ color: "rgba(255,255,255,.72)", fontSize: 22, lineHeight: 1.55 }}>
            Review routing actions by confidence, missing context, and fit quality before heavier automation exists.
          </p>

          <div>
            <span style={chip}>Owner: {email || OWNER_EMAIL}</span>
            <span style={chip}>Actions: {stats.total}</span>
            <span style={chip}>Context Gaps: {stats.gaps}</span>
            <span style={chip}>Urgent: {stats.urgent}</span>
          </div>

          <div className="vf-confidence-actions" style={{ marginTop: 14 }}>
            <button type="button" style={btn} onClick={load}>Refresh Confidence</button>
            <Link href="/admin-routing" style={ghost}>Admin Routing</Link>
            <Link href="/activity" style={ghost}>Activity</Link>
            <Link href="/member-intelligence" style={ghost}>Member Intelligence</Link>
            <Link href="/admin-intelligence" style={ghost}>Owner Intelligence</Link>
            <Link href="/admin" style={ghost}>Admin Home</Link>
          </div>

          {status && (
            <p style={{ color: status.toLowerCase().includes("could not") ? "#ffd0d0" : "#9df3bf", fontWeight: 900 }}>
              {status}
            </p>
          )}
        </section>

        <section style={statGrid}>
          <StatCard title="Strong" value={stats.strong} detail="High-confidence routing entries." tone="#9df3bf" />
          <StatCard title="Working" value={stats.working} detail="Usable but needs more context." tone="#f5d978" />
          <StatCard title="Thin" value={stats.thin} detail="Needs state, strategy, role, reason, or score." tone="#ffb3b3" />
          <StatCard title="Context Gaps" value={stats.gaps} detail="Total missing routing intelligence fields." tone="#ffb3b3" />
        </section>

        <section style={hero}>
          <div style={{ color: "#9df3bf", letterSpacing: 5, fontWeight: 950, fontSize: 12, marginBottom: 12, textTransform: "uppercase" }}>
            Confidence Filters
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 14 }}>
            <input
              style={input}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search routing actions, signal id, item id, role, state..."
            />

            <select
              style={input}
              value={levelFilter}
              onChange={(event) => setLevelFilter(event.target.value)}
            >
              <option value="all" style={{ color: "#111" }}>All Confidence</option>
              <option value="strong" style={{ color: "#111" }}>Strong</option>
              <option value="working" style={{ color: "#111" }}>Working</option>
              <option value="thin" style={{ color: "#111" }}>Thin</option>
            </select>
          </div>
        </section>

        {filtered.length === 0 ? (
          <section style={hero}>
            <strong>No routing actions match this filter.</strong>
          </section>
        ) : (
          <section style={grid}>
            {filtered.map((action, index) => {
              const tone = levelTone(action._level);

              return (
                <article key={action.id || index} style={{ ...card, borderColor: `${tone}66` }}>
                  <div style={{ color: tone, letterSpacing: 4, fontWeight: 900, fontSize: 11, marginBottom: 10, textTransform: "uppercase" }}>
                    {label(action._level)} Confidence · {action._score}
                  </div>

                  <h2 style={{ fontSize: 30, lineHeight: 1.05, margin: "0 0 10px" }}>
                    {action.title || "Routing action"}
                  </h2>

                  <p style={{ color: "rgba(255,255,255,.70)", lineHeight: 1.55, fontSize: 18 }}>
                    {action.urgency_reason || action.note || "No routing explanation recorded."}
                  </p>

                  <div style={{ margin: "12px 0" }}>
                    {action.priority && <span style={chip}>{label(action.priority)}</span>}
                    {action.action && <span style={chip}>{label(action.action)}</span>}
                    {action.state_match && <span style={chip}>State: {action.state_match}</span>}
                    {action.strategy_match && <span style={chip}>Strategy: {action.strategy_match}</span>}
                    {action.role_match && <span style={chip}>Role: {action.role_match}</span>}
                    {action.created_at && <span style={chip}>{action.created_at}</span>}
                  </div>

                  {Array.isArray(action._gaps) && action._gaps.length > 0 && (
                    <section style={{ marginTop: 12 }}>
                      <strong style={{ color: "#ffb3b3", display: "block", marginBottom: 8 }}>Missing context</strong>
                      {action._gaps.map((gap: string) => (
                        <span
                          key={gap}
                          style={{
                            ...chip,
                            color: "#ffb3b3",
                            border: "1px solid rgba(255,179,179,.35)",
                            background: "rgba(255,179,179,.08)",
                          }}
                        >
                          {gap}
                        </span>
                      ))}
                    </section>
                  )}

                  <div style={{ marginTop: 16 }}>
                    {action.signal_id && (
                      <Link href={`/routing-room/${encodeURIComponent(action.signal_id)}`} style={btn}>
                        Routing Room
                      </Link>
                    )}
                    {action.signal_id && (
                      <Link href={`/signals/${encodeURIComponent(action.signal_id)}`} style={ghost}>
                        Signal
                      </Link>
                    )}
                    {action.item_id && (
                      <Link href={`/deal-room/${encodeURIComponent(action.item_id)}`} style={ghost}>
                        Deal Room
                      </Link>
                    )}
                  </div>
                </article>
              );
            })}
          </section>
        )}

        <section style={{ ...hero, marginTop: 22 }}>
          <div style={{ color: "#9df3bf", letterSpacing: 5, fontWeight: 950, fontSize: 12, marginBottom: 12, textTransform: "uppercase" }}>
            Current Safety Mode
          </div>

          <p style={{ color: "rgba(255,255,255,.72)", fontSize: 19, lineHeight: 1.6 }}>
            This board is read-only. It helps clean and deepen routing context before any autonomous routing, dispatch, or notification behavior is enabled.
          </p>
        </section>
      </div>
    </main>
  );
}
