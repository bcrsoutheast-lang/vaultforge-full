"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import VaultForgeMemberNav from "../components/VaultForgeMemberNav";

type Row = Record<string, any>;

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

function signalIdOf(row: Row) {
  const m = meta(row);
  return first(row.signal_id, row.signalId, row.routing_signal_id, row.id, m.signal_id, m.routing_signal_id);
}

function itemIdOf(row: Row) {
  const m = meta(row);
  return first(row.item_id, row.itemId, row.pain_id, row.deal_id, row.project_id, m.item_id, m.pain_id, m.deal_id, m.project_id);
}

function titleOf(row: Row) {
  const m = meta(row);
  return first(row.title, row.routing_title, row.signal_title, row.subject, m.title, m.routing_title, m.signal_title, "VaultForge Routing Action");
}

function noteOf(row: Row) {
  const m = meta(row);
  return first(row.routing_summary, row.route_summary, row.summary, row.note, row.notes, row.description, row.message, m.routing_summary, m.route_summary, m.summary, m.note, m.notes, m.description, m.message, "Routing action ready for review.");
}

function roleOf(row: Row) {
  const m = meta(row);
  return first(row.role_needed, row.target_role, row.member_role, row.action, m.role_needed, m.target_role, m.member_role, "Member Fit");
}

function statusOf(row: Row) {
  const m = meta(row);
  return first(row.routing_status, row.status, row.action_status, m.routing_status, m.status, m.action_status, "Generated");
}

function ownerOf(row: Row) {
  const m = meta(row);
  return cleanEmail(first(row.owner_email, row.member_email, row.submitted_by_email, row.created_by_email, row.recipient_email, row.target_email, m.owner_email, m.member_email, m.submitted_by_email, m.created_by_email, m.recipient_email, m.target_email));
}

function marketOf(row: Row) {
  const m = meta(row);
  const city = first(row.city, m.city);
  const state = first(row.state, row.market, row.operating_state, m.state, m.market, m.operating_state);
  return [city, state].filter(Boolean).join(", ") || state || first(row.location, m.location, "Market not listed");
}

function scoreOf(row: Row) {
  const m = meta(row);
  let score = Number(row.confidence_score || row.match_score || row.priority_score || m.confidence_score || m.match_score || m.priority_score || 0);

  if (!Number.isFinite(score) || score <= 0) score = 58;

  const status = statusOf(row).toLowerCase();
  if (status.includes("routed")) score += 15;
  if (ownerOf(row)) score += 7;
  if (marketOf(row) !== "Market not listed") score += 5;

  return Math.min(100, Math.max(0, Math.round(score)));
}

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(232,196,107,.14), transparent 28%), radial-gradient(circle at 88% 10%, rgba(56,189,248,.10), transparent 26%), linear-gradient(180deg,#020303,#071326 55%,#020303)",
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

function RoutingCard({ row, viewer }: { row: Row; viewer: string }) {
  const signalId = signalIdOf(row);
  const itemId = itemIdOf(row);
  const owner = ownerOf(row);
  const score = scoreOf(row);

  const connectHref = signalId
    ? `/connect/${encodeURIComponent(signalId)}?email=${encodeURIComponent(viewer)}${itemId ? `&item_id=${encodeURIComponent(itemId)}` : ""}${owner ? `&to=${encodeURIComponent(owner)}` : ""}&source=routing`
    : "/messages";

  return (
    <article style={glass}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <span style={chip}>{roleOf(row)}</span>
        <span style={{ ...chip, color: "#f8e7b0", borderColor: "rgba(232,196,107,.26)", background: "rgba(232,196,107,.08)" }}>
          Score {score}
        </span>
        <span style={{ ...chip, color: "#8fd3ff", borderColor: "rgba(56,189,248,.28)", background: "rgba(56,189,248,.08)" }}>
          {statusOf(row)}
        </span>
      </div>

      <h3 style={{ fontSize: 30, lineHeight: 1.02, margin: "14px 0 10px" }}>{titleOf(row)}</h3>
      <p style={muted}>{noteOf(row)}</p>

      <div style={{ marginTop: 12 }}>
        {signalId ? <span style={chip}>Signal: {signalId}</span> : null}
        {itemId ? <span style={chip}>Item: {itemId}</span> : null}
        <span style={chip}>Market: {marketOf(row)}</span>
        {owner ? <span style={chip}>Owner: {owner}</span> : null}
      </div>

      <div className="vf-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
        {signalId ? <Link href={`/routing-room/${encodeURIComponent(signalId)}`} style={button}>Open Routing Room</Link> : null}
        {signalId ? <Link href={`/signals/${encodeURIComponent(signalId)}`} style={ghost}>Open Signal</Link> : null}
        <Link href={connectHref} style={ghost}>Message Owner</Link>
        <Link href="/introductions" style={ghost}>Introductions</Link>
      </div>
    </article>
  );
}

export default function RoutingInboxPage() {
  const [email, setEmail] = useState("");
  const [items, setItems] = useState<Row[]>([]);
  const [status, setStatus] = useState("Loading routing inbox...");

  async function load() {
    const viewer = getEmail();
    setEmail(viewer);
    setStatus("Loading routing inbox...");

    try {
      const urls = [
        `/api/routing/actions?email=${encodeURIComponent(viewer)}&owner=0`,
        `/api/pain/feed?email=${encodeURIComponent(viewer)}&owner=0`,
      ];

      const collected: Row[] = [];

      for (const url of urls) {
        try {
          const res = await fetch(url, {
            cache: "no-store",
            headers: { "x-vf-email": viewer || "", "x-vf-admin": "0" },
          });

          const data = await safeJson(res);
          const list = [
            ...(Array.isArray(data.actions) ? data.actions : []),
            ...(Array.isArray(data.routing) ? data.routing : []),
            ...(Array.isArray(data.items) ? data.items : []),
            ...(Array.isArray(data.pains) ? data.pains : []),
            ...(Array.isArray(data.data) ? data.data : []),
          ];

          collected.push(...list);
        } catch {
          // Keep fallback page alive.
        }
      }

      const seen = new Set<string>();
      const unique = collected.filter((item) => {
        const key = first(signalIdOf(item), itemIdOf(item), item.id, titleOf(item) + noteOf(item));
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      setItems(unique);
      setStatus(unique.length ? "" : "No routing actions connected yet.");
    } catch (error: any) {
      setStatus(error?.message || "Could not load routing inbox.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  const counts = useMemo(() => {
    const generated = items.filter((item) => statusOf(item).toLowerCase().includes("generated")).length;
    const routed = items.filter((item) => statusOf(item).toLowerCase().includes("routed")).length;
    const ownerReady = items.filter((item) => ownerOf(item)).length;

    return { total: items.length, generated, routed, ownerReady };
  }, [items]);

  return (
    <main style={page}>
      <style>{`
        a:hover, button:hover {
          transform: translateY(-1px);
          transition: all .18s ease;
          filter: brightness(1.06);
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
          title="Routing"
          subtitle="Routing actions, member-fit paths, owner contact, and controlled introductions."
          active="routing"
        />

        <section style={card}>
          <div style={eyebrow}>VaultForge Routing Inbox</div>
          <h1 style={{ fontSize: "clamp(52px,10vw,96px)", lineHeight: 0.88, letterSpacing: "-.07em", margin: "12px 0 18px" }}>
            Route queue.
          </h1>
          <p style={{ ...muted, fontSize: 20, maxWidth: 980 }}>
            Routing connects signals to the right member type without exposing private contact information too early.
          </p>

          <div style={{ marginTop: 16 }}>
            <span style={chip}>Signed in: {email || "unknown"}</span>
            <span style={chip}>Routes: {counts.total}</span>
            <span style={chip}>Generated: {counts.generated}</span>
            <span style={chip}>Owner Ready: {counts.ownerReady}</span>
          </div>

          <div className="vf-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 20 }}>
            <Link href="/dashboard" style={ghost}>Dashboard</Link>
            <Link href="/signals" style={ghost}>Signals</Link>
            <Link href="/introductions" style={ghost}>Introductions</Link>
            <Link href="/messages" style={ghost}>Messages</Link>
            <button type="button" onClick={load} style={button}>Refresh</button>
          </div>
        </section>

        <section className="vf-four" style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 16, marginBottom: 18 }}>
          <Metric label="Routes" value={String(counts.total)} tone="blue" />
          <Metric label="Generated" value={String(counts.generated)} tone="gold" />
          <Metric label="Routed" value={String(counts.routed)} tone="green" />
          <Metric label="Owner Ready" value={String(counts.ownerReady)} tone="red" />
        </section>

        <section style={card}>
          <div style={eyebrow}>Routing Queue</div>
          <h2 style={{ fontSize: 42, lineHeight: 1, margin: "10px 0 18px" }}>Member-fit paths.</h2>

          {items.length ? (
            <div style={{ display: "grid", gap: 14 }}>
              {items.map((item, index) => (
                <RoutingCard key={clean(item.id) || `${signalIdOf(item)}-${index}`} row={item} viewer={email} />
              ))}
            </div>
          ) : (
            <div style={glass}>
              <h3 style={{ marginTop: 0 }}>No routing actions yet.</h3>
              <p style={muted}>
                Routing actions appear here after Pain, Signals, or owner review create member-fit paths.
              </p>
              <div className="vf-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
                <Link href="/signals" style={button}>Open Signals</Link>
                <Link href="/pain-feed" style={ghost}>Pain Feed</Link>
              </div>
            </div>
          )}
        </section>

        {status ? <section style={card}>{status}</section> : null}
      </div>
    </main>
  );
}
