
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

const OWNER_EMAIL = "bcrsoutheast@gmail.com";

type AnyRow = Record<string, any>;

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
  gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))",
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

const danger: React.CSSProperties = {
  ...ghost,
  color: "#ffd0d0",
  border: "1px solid rgba(255,120,120,.38)",
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

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

function label(value: string) {
  const text = clean(value || "item").replace(/_/g, " ");
  return text.slice(0, 1).toUpperCase() + text.slice(1);
}

function first(...values: unknown[]) {
  for (const value of values) {
    const text = clean(value);
    if (text) return text;
  }
  return "";
}

function exactSignalId(item: AnyRow) {
  return first(item.signal_id, item.signalId, item.alert_id, item.alertId, item.id);
}

function exactItemId(item: AnyRow) {
  return first(item.item_id, item.itemId, item.deal_id, item.dealId, item.project_id, item.projectId, item.property_id, item.propertyId, item.pain_id, item.painId);
}

function exactIntroId(item: AnyRow) {
  return first(item.introduction_id, item.intro_id, item.introId, item.id);
}

function exactSignalHref(item: AnyRow) {
  const signalId = exactSignalId(item);
  return signalId ? `/signals/${encodeURIComponent(signalId)}` : "/intelligence";
}

function exactWorkHref(item: AnyRow) {
  const itemId = exactItemId(item);
  if (itemId) return `/deal-room/${encodeURIComponent(itemId)}`;
  return exactSignalHref(item);
}

function exactRoutingHref(item: AnyRow) {
  const signalId = exactSignalId(item);
  return signalId ? `/routing-room/${encodeURIComponent(signalId)}` : "/routing-inbox";
}

function exactIntroHref(item: AnyRow) {
  const introId = exactIntroId(item);
  return introId ? `/introduction/${encodeURIComponent(introId)}` : "/introductions";
}

function exactActivityHref(item: AnyRow) {
  const rawId = clean(item.raw_id || item.id).replace(/^routing-/, "").replace(/^intro-/, "").replace(/^response-/, "");
  const type = clean(item.type || item.event_type || item.kind).toLowerCase();

  if (!rawId) return "/activity";
  if (type.includes("routing") || clean(item.id).startsWith("routing-")) return `/activity/routing/${encodeURIComponent(rawId)}`;
  if (type.includes("response") || clean(item.id).startsWith("response-")) return `/activity/response/${encodeURIComponent(rawId)}`;
  if (type.includes("intro") || clean(item.id).startsWith("intro-")) return `/activity/introduction/${encodeURIComponent(rawId)}`;
  return "/activity";
}

function priorityOf(item: AnyRow) {
  return first(item.priority, item.severity, item.alert_priority, item.urgency, "medium").toLowerCase();
}

function priorityTone(item: AnyRow) {
  const priority = priorityOf(item);
  if (priority === "urgent") return "#ffb3b3";
  if (priority === "high") return "#f5d978";
  return "#9df3bf";
}

function titleOf(item: AnyRow) {
  return first(item.title, item.name, item.headline, item.signal_title, item.alert_title, "VaultForge Item");
}

function messageOf(item: AnyRow) {
  return first(item.note, item.message, item.description, item.summary, item.reason, item.urgency_reason, "Exact operational context ready.");
}

function actionOf(item: AnyRow) {
  return first(item.action, item.routing_action, item.response, item.status, item.type, "activity");
}

function scoreOf(item: AnyRow) {
  const raw = Number(item.confidence_score || item.match_score || item.score || 0);
  if (Number.isFinite(raw) && raw > 0) return Math.max(0, Math.min(100, Math.round(raw)));
  const priority = priorityOf(item);
  if (priority === "urgent") return 84;
  if (priority === "high") return 72;
  return 58;
}

function StatCard({ title, value, detail }: { title: string; value: string | number; detail: string }) {
  return (
    <div style={card}>
      <div style={{ color: "#9df3bf", letterSpacing: 4, fontWeight: 900, fontSize: 11, marginBottom: 10, textTransform: "uppercase" }}>
        {title}
      </div>
      <div style={{ fontSize: 42, fontWeight: 950, lineHeight: 1 }}>{value}</div>
      <p style={{ color: "rgba(255,255,255,.68)", lineHeight: 1.45, marginBottom: 0 }}>{detail}</p>
    </div>
  );
}

export default function RoutingInboxPage() {
  const [email, setEmail] = useState("");
  const [owner, setOwner] = useState(false);
  const [actions, setActions] = useState<AnyRow[]>([]);
  const [status, setStatus] = useState("Loading routed opportunities...");
  const [search, setSearch] = useState("");

  async function load() {
    setStatus("Loading routed opportunities...");

    try {
      const currentEmail = getEmail();
      const currentOwner = isOwner(currentEmail);

      setEmail(currentEmail);
      setOwner(currentOwner);

      if (!currentEmail) {
        setStatus("Login email not found. Please log in again.");
        return;
      }

      const res = await fetch(`/api/routing/actions?email=${encodeURIComponent(currentEmail)}&owner=${currentOwner ? "1" : "0"}`, {
        cache: "no-store",
        headers: {
          "x-vf-email": currentEmail,
          "x-vf-admin": currentOwner ? "1" : "0",
        },
      });

      const data = await safeJson(res);

      if (!res.ok || data?.ok === false) {
        throw new Error(data?.error || data?.details || "Could not load routed opportunities.");
      }

      const rows = Array.isArray(data?.actions) ? data.actions : [];
      setActions(rows);
      setStatus(rows.length ? "" : "No routed opportunities yet.");
    } catch (error: any) {
      setStatus(error?.message || "Could not load routed opportunities.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return actions
      .filter((item) => {
        if (!q) return true;
        return [
          titleOf(item),
          messageOf(item),
          actionOf(item),
          item.target_role,
          item.target_email,
          item.state_match,
          item.strategy_match,
          item.role_match,
          exactSignalId(item),
          exactItemId(item),
        ]
          .join(" ")
          .toLowerCase()
          .includes(q);
      })
      .sort((a, b) => scoreOf(b) - scoreOf(a));
  }, [actions, search]);

  const urgent = actions.filter((item) => priorityOf(item) === "urgent").length;
  const buyer = actions.filter((item) => actionOf(item).includes("buyer")).length;
  const lender = actions.filter((item) => actionOf(item).includes("lender")).length;
  const operator = actions.filter((item) => actionOf(item).includes("operator")).length;

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
          .vf-actions {
            display: grid !important;
            grid-template-columns: 1fr !important;
            gap: 10px !important;
          }

          .vf-actions > * {
            width: 100%;
            margin: 0 !important;
            box-sizing: border-box;
          }
        }
      `}</style>

      <div style={wrap}>
        <section style={hero}>
          <div style={{ color: "#9df3bf", letterSpacing: 5, fontWeight: 950, fontSize: 12, marginBottom: 12, textTransform: "uppercase" }}>
            VaultForge Routed Opportunities
          </div>

          <h1 style={{ fontSize: "clamp(56px,11vw,104px)", lineHeight: 0.86, margin: "0 0 18px" }}>
            Exact routing inbox.
          </h1>

          <p style={{ color: "rgba(255,255,255,.72)", fontSize: 22, lineHeight: 1.55 }}>
            Routed cards now open their exact signal, routing room, or work area instead of a generic page.
          </p>

          <div>
            <span style={chip}>Total Routed: {actions.length}</span>
            <span style={chip}>Urgent: {urgent}</span>
            <span style={chip}>Buyer Routes: {buyer}</span>
            <span style={chip}>Lender Routes: {lender}</span>
            <span style={chip}>Operator Routes: {operator}</span>
            <span style={chip}>{owner ? "Owner View" : "Member View"}</span>
          </div>

          <div className="vf-actions" style={{ marginTop: 14 }}>
            <button type="button" style={btn} onClick={load}>Refresh Routing</button>
            <Link href="/activity" style={ghost}>Activity</Link>
            <Link href="/alerts" style={ghost}>Alerts</Link>
            <Link href="/intelligence" style={ghost}>Intelligence</Link>
            <Link href="/introductions" style={ghost}>Introductions</Link>
            <Link href="/member-intelligence" style={ghost}>Member Intelligence</Link>
            {owner && <Link href="/admin-routing" style={ghost}>Admin Routing</Link>}
            <Link href="/logout" style={danger}>Logout</Link>
          </div>

          {status && (
            <p style={{ color: status.toLowerCase().includes("could not") ? "#ffd0d0" : "#9df3bf", fontWeight: 900 }}>
              {status}
            </p>
          )}
        </section>

        <section style={statGrid}>
          <StatCard title="Total Routed" value={actions.length} detail="Routing actions currently visible to this account." />
          <StatCard title="Urgent" value={urgent} detail="Urgent routing pressure." />
          <StatCard title="Buyer" value={buyer} detail="Buyer-directed routing actions." />
          <StatCard title="Lender" value={lender} detail="Capital/lender-directed routing actions." />
          <StatCard title="Operator" value={operator} detail="Operator-directed routing actions." />
        </section>

        <section style={hero}>
          <div style={{ color: "#9df3bf", letterSpacing: 5, fontWeight: 950, fontSize: 12, marginBottom: 12, textTransform: "uppercase" }}>
            Search
          </div>
          <input
            style={input}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search routed opportunity, role, market, strategy, signal id..."
          />
        </section>

        {filtered.length === 0 ? (
          <section style={hero}>
            <strong>No exact routed cards yet.</strong>
            <p style={{ color: "rgba(255,255,255,.72)", lineHeight: 1.55 }}>
              Routing records will appear after owner/admin logs routing actions.
            </p>
          </section>
        ) : (
          <section style={grid}>
            {filtered.map((item, index) => {
              const tone = priorityTone(item);
              return (
                <article key={item.id || exactSignalId(item) || exactItemId(item) || index} style={{ ...card, borderColor: `${tone}66` }}>
                  <div style={{ color: tone, letterSpacing: 4, fontWeight: 900, fontSize: 11, marginBottom: 10, textTransform: "uppercase" }}>
                    {label(priorityOf(item))} · {label(actionOf(item))}
                  </div>

                  <h2 style={{ fontSize: 30, lineHeight: 1.05, margin: "0 0 10px" }}>
                    {titleOf(item)}
                  </h2>

                  <p style={{ color: "rgba(255,255,255,.72)", lineHeight: 1.55, fontSize: 18 }}>
                    {messageOf(item)}
                  </p>

                  <div style={{ margin: "12px 0" }}>
                    <span style={chip}>Score: {scoreOf(item)}</span>
                    {item.state_match && <span style={chip}>State: {item.state_match}</span>}
                    {item.strategy_match && <span style={chip}>Strategy: {item.strategy_match}</span>}
                    {item.role_match && <span style={chip}>Role: {item.role_match}</span>}
                    {exactSignalId(item) && <span style={chip}>Signal: {exactSignalId(item)}</span>}
                    {exactItemId(item) && <span style={chip}>Item: {exactItemId(item)}</span>}
                  </div>

                  <div className="vf-actions">
                    <Link href={exactRoutingHref(item)} style={btn}>Open Exact Routing Room</Link>
                    <Link href={exactSignalHref(item)} style={ghost}>Open Exact Signal</Link>
                    <Link href={exactWorkHref(item)} style={ghost}>Open Exact Work Area</Link>
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
            This page fixes exact routing links only. It does not create routes, send notifications, or mutate records.
          </p>
        </section>
      </div>
    </main>
  );
}
