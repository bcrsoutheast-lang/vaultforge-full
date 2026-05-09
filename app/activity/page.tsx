
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

export default function ActivityPage() {
  const [email, setEmail] = useState("");
  const [owner, setOwner] = useState(false);
  const [events, setEvents] = useState<AnyRow[]>([]);
  const [status, setStatus] = useState("Loading activity stream...");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  async function load() {
    setStatus("Loading activity stream...");

    try {
      const currentEmail = getEmail();
      const currentOwner = isOwner(currentEmail);

      setEmail(currentEmail);
      setOwner(currentOwner);

      if (!currentEmail) {
        setStatus("Login email not found. Please log in again.");
        return;
      }

      const headers = {
        "x-vf-email": currentEmail,
        "x-vf-admin": currentOwner ? "1" : "0",
      };

      const [routingRes, introRes, responseRes] = await Promise.all([
        fetch(`/api/routing/actions?email=${encodeURIComponent(currentEmail)}&owner=${currentOwner ? "1" : "0"}`, {
          cache: "no-store",
          headers,
        }),
        fetch(`/api/routing/introductions?email=${encodeURIComponent(currentEmail)}&owner=${currentOwner ? "1" : "0"}`, {
          cache: "no-store",
          headers,
        }),
        fetch(`/api/routing/introduction-responses?email=${encodeURIComponent(currentEmail)}&owner=${currentOwner ? "1" : "0"}`, {
          cache: "no-store",
          headers,
        }),
      ]);

      const routingData = await safeJson(routingRes);
      const introData = await safeJson(introRes);
      const responseData = await safeJson(responseRes);

      const routing = Array.isArray(routingData?.actions)
        ? routingData.actions.map((item: AnyRow) => ({
            ...item,
            id: `routing-${item.id}`,
            raw_id: item.id,
            type: "routing_action",
            title: item.title || "Routing action",
          }))
        : [];

      const introductions = Array.isArray(introData?.introductions)
        ? introData.introductions.map((item: AnyRow) => ({
            ...item,
            id: `intro-${item.id}`,
            raw_id: item.id,
            type: "controlled_introduction",
            title: item.title || "Controlled introduction",
            introduction_id: item.id,
          }))
        : [];

      const responses = Array.isArray(responseData?.responses)
        ? responseData.responses.map((item: AnyRow) => ({
            ...item,
            id: `response-${item.id}`,
            raw_id: item.id,
            type: `introduction_response_${item.response || "activity"}`,
            title: item.title || "Introduction response",
          }))
        : [];

      const merged = [...routing, ...introductions, ...responses].sort((a, b) => {
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      });

      setEvents(merged);
      setStatus(merged.length ? "" : "No activity events yet.");
    } catch (error: any) {
      setStatus(error?.message || "Could not load activity stream.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return events.filter((item) => {
      if (typeFilter !== "all") {
        const type = clean(item.type).toLowerCase();
        if (typeFilter === "routing" && !type.includes("routing")) return false;
        if (typeFilter === "introduction" && (!type.includes("intro") || type.includes("response"))) return false;
        if (typeFilter === "response" && !type.includes("response")) return false;
      }

      if (!q) return true;

      return [
        titleOf(item),
        messageOf(item),
        actionOf(item),
        item.type,
        item.member_email,
        item.target_email,
        exactSignalId(item),
        exactItemId(item),
        exactIntroId(item),
      ]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [events, search, typeFilter]);

  const routingCount = events.filter((item) => clean(item.type).includes("routing")).length;
  const introCount = events.filter((item) => clean(item.type).includes("intro") && !clean(item.type).includes("response")).length;
  const responseCount = events.filter((item) => clean(item.type).includes("response")).length;
  const urgent = events.filter((item) => priorityOf(item) === "urgent").length;

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
            VaultForge Activity Stream
          </div>

          <h1 style={{ fontSize: "clamp(56px,11vw,104px)", lineHeight: 0.86, margin: "0 0 18px" }}>
            Exact activity.
          </h1>

          <p style={{ color: "rgba(255,255,255,.72)", fontSize: 22, lineHeight: 1.55 }}>
            Activity cards now open exact events, exact signals, exact introductions, and exact work areas.
          </p>

          <div>
            <span style={chip}>Events: {events.length}</span>
            <span style={chip}>Routing: {routingCount}</span>
            <span style={chip}>Introductions: {introCount}</span>
            <span style={chip}>Responses: {responseCount}</span>
            <span style={chip}>Urgent: {urgent}</span>
            <span style={chip}>{owner ? "Owner View" : "Member View"}</span>
          </div>

          <div className="vf-actions" style={{ marginTop: 14 }}>
            <button type="button" style={btn} onClick={load}>Refresh Activity</button>
            <Link href="/routing-inbox" style={ghost}>Routing Inbox</Link>
            <Link href="/alerts" style={ghost}>Alerts</Link>
            <Link href="/intelligence" style={ghost}>Intelligence</Link>
            <Link href="/introductions" style={ghost}>Introductions</Link>
            <Link href="/member-intelligence" style={ghost}>Member Intelligence</Link>
            {owner && <Link href="/admin-intelligence" style={ghost}>Owner Intelligence</Link>}
            <Link href="/logout" style={danger}>Logout</Link>
          </div>

          {status && (
            <p style={{ color: status.toLowerCase().includes("could not") ? "#ffd0d0" : "#9df3bf", fontWeight: 900 }}>
              {status}
            </p>
          )}
        </section>

        <section style={statGrid}>
          <StatCard title="Events" value={events.length} detail="Total activity records visible." />
          <StatCard title="Routing" value={routingCount} detail="Routing action events." />
          <StatCard title="Intros" value={introCount} detail="Controlled introduction events." />
          <StatCard title="Responses" value={responseCount} detail="Member response events." />
          <StatCard title="Urgent" value={urgent} detail="Urgent operational pressure." />
        </section>

        <section style={hero}>
          <div style={{ color: "#9df3bf", letterSpacing: 5, fontWeight: 950, fontSize: 12, marginBottom: 12, textTransform: "uppercase" }}>
            Filters
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 14 }}>
            <input
              style={input}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search activity, member email, signal id, item id..."
            />
            <select
              style={input}
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
            >
              <option value="all" style={{ color: "#111" }}>All Activity</option>
              <option value="routing" style={{ color: "#111" }}>Routing</option>
              <option value="introduction" style={{ color: "#111" }}>Introductions</option>
              <option value="response" style={{ color: "#111" }}>Responses</option>
            </select>
          </div>
        </section>

        {filtered.length === 0 ? (
          <section style={hero}>
            <strong>No exact activity cards yet.</strong>
            <p style={{ color: "rgba(255,255,255,.72)", lineHeight: 1.55 }}>
              Activity will populate after routing actions, introductions, and member responses exist.
            </p>
          </section>
        ) : (
          <section style={grid}>
            {filtered.map((item, index) => {
              const tone = priorityTone(item);
              return (
                <article key={item.id || index} style={{ ...card, borderColor: `${tone}66` }}>
                  <div style={{ color: tone, letterSpacing: 4, fontWeight: 900, fontSize: 11, marginBottom: 10, textTransform: "uppercase" }}>
                    {label(actionOf(item))}
                  </div>

                  <h2 style={{ fontSize: 30, lineHeight: 1.05, margin: "0 0 10px" }}>
                    {titleOf(item)}
                  </h2>

                  <p style={{ color: "rgba(255,255,255,.72)", lineHeight: 1.55, fontSize: 18 }}>
                    {messageOf(item)}
                  </p>

                  <div style={{ margin: "12px 0" }}>
                    <span style={chip}>Score: {scoreOf(item)}</span>
                    {item.member_email && <span style={chip}>{item.member_email}</span>}
                    {exactSignalId(item) && <span style={chip}>Signal: {exactSignalId(item)}</span>}
                    {exactItemId(item) && <span style={chip}>Item: {exactItemId(item)}</span>}
                    {exactIntroId(item) && <span style={chip}>Intro: {exactIntroId(item)}</span>}
                  </div>

                  <div className="vf-actions">
                    <Link href={exactActivityHref(item)} style={btn}>Open Exact Event</Link>
                    {exactIntroId(item) && <Link href={exactIntroHref(item)} style={ghost}>Introduction</Link>}
                    {exactSignalId(item) && <Link href={exactSignalHref(item)} style={ghost}>Signal</Link>}
                    {exactSignalId(item) && <Link href={exactRoutingHref(item)} style={ghost}>Routing Room</Link>}
                    {exactItemId(item) && <Link href={exactWorkHref(item)} style={ghost}>Work Area</Link>}
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
            This page fixes exact activity navigation only. It does not create routes, send notifications, or mutate records.
          </p>
        </section>
      </div>
    </main>
  );
}
