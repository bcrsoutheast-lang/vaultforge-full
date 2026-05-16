"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Row = Record<string, any>;

function clean(value: unknown) {
  return String(value || "").trim();
}

function lower(value: unknown) {
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

  const keys = ["vf_email", "vf_member_email", "memberEmail", "email"];

  for (const key of keys) {
    try {
      const localValue = lower(window.localStorage.getItem(key));
      if (localValue.includes("@")) return localValue;

      const sessionValue = lower(window.sessionStorage.getItem(key));
      if (sessionValue.includes("@")) return sessionValue;
    } catch {
      // Continue.
    }
  }

  const cookieValue = lower(readCookie("vf_email") || readCookie("vf_member_email"));
  return cookieValue.includes("@") ? cookieValue : "";
}

function meta(row: Row) {
  return row && typeof row.metadata === "object" && row.metadata ? row.metadata : {};
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

function idOf(row: Row, index = 0) {
  const m = meta(row);

  return first(
    row.signal_id,
    row.id,
    row.item_id,
    row.deal_id,
    row.pain_id,
    row.room_id,
    m.signal_id,
    m.id,
    m.item_id,
    m.deal_id,
    m.pain_id,
    `route-${index}`
  );
}

function itemIdOf(row: Row, index = 0) {
  const m = meta(row);

  return first(
    row.item_id,
    row.deal_id,
    row.pain_id,
    row.project_id,
    row.id,
    m.item_id,
    m.deal_id,
    m.pain_id,
    m.project_id,
    `item-${index}`
  );
}

function titleOf(row: Row) {
  const m = meta(row);

  return first(
    row.title,
    row.deal_title,
    row.pain_title,
    row.project_title,
    row.signal_title,
    row.headline,
    row.name,
    row.address,
    m.title,
    m.deal_title,
    m.pain_title,
    m.project_title,
    "Routing Path"
  );
}

function roleOf(row: Row) {
  const m = meta(row);
  return first(row.role, row.match_role, row.target_role, row.route_role, m.role, m.match_role, "Buyer");
}

function typeOf(row: Row) {
  const m = meta(row);
  return first(row.asset_type, row.property_type, row.type, row.deal_type, m.asset_type, m.property_type, "Residential");
}

function strategyOf(row: Row) {
  const m = meta(row);
  return first(row.strategy, row.investment_strategy, row.exit_strategy, m.strategy, m.investment_strategy, "Fix & Flip");
}

function exitOf(row: Row) {
  const m = meta(row);
  return first(row.exit_strategy, row.exit, m.exit_strategy, m.exit, "Flip");
}

function marketOf(row: Row) {
  const m = meta(row);
  return first(row.market, row.city_state, row.city, row.state, m.market, m.city_state, m.city, m.state, "Market not listed");
}

function scoreOf(row: Row) {
  const m = meta(row);
  const raw = Number(first(row.score, row.match_score, row.routing_score, m.score, m.match_score, m.routing_score));
  if (Number.isFinite(raw) && raw > 0) return Math.max(0, Math.min(100, Math.round(raw)));
  return 65;
}

function statusOf(row: Row) {
  const m = meta(row);
  return first(row.status, row.routing_status, row.stage, m.status, m.routing_status, "new");
}

function normalizeRows(data: any) {
  const rows = [
    ...(Array.isArray(data.routes) ? data.routes : []),
    ...(Array.isArray(data.actions) ? data.actions : []),
    ...(Array.isArray(data.routing_actions) ? data.routing_actions : []),
    ...(Array.isArray(data.items) ? data.items : []),
    ...(Array.isArray(data.feed) ? data.feed : []),
    ...(Array.isArray(data.results) ? data.results : []),
    ...(Array.isArray(data.rows) ? data.rows : []),
    ...(Array.isArray(data.data) ? data.data : []),
    ...(Array.isArray(data.deals) ? data.deals : []),
    ...(Array.isArray(data.pains) ? data.pains : []),
  ];

  if (!rows.length && data && typeof data === "object" && !Array.isArray(data)) {
    const single = data.route || data.action || data.record || data.item || data.deal || data.pain;
    if (single) rows.push(single);
  }

  const byId = new Map<string, Row>();
  rows.forEach((row: Row, index: number) => {
    byId.set(`${idOf(row, index)}-${itemIdOf(row, index)}-${index}`, row);
  });

  return Array.from(byId.values());
}

async function safeJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(232,196,107,.12), transparent 30%), radial-gradient(circle at 88% 8%, rgba(157,243,191,.10), transparent 26%), linear-gradient(180deg,#020617,#071326 55%,#020617)",
  color: "white",
  padding: "22px 16px 96px",
  fontFamily: "Arial, sans-serif",
  overflowX: "hidden",
};

const wrap: React.CSSProperties = {
  width: "min(1180px,100%)",
  margin: "0 auto",
  overflowX: "hidden",
};

const panel: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.22)",
  borderRadius: 30,
  padding: 24,
  background: "linear-gradient(145deg,rgba(255,255,255,.070),rgba(255,255,255,.030))",
  boxShadow: "0 28px 86px rgba(0,0,0,.30)",
  marginBottom: 20,
  overflow: "hidden",
};

const label: React.CSSProperties = {
  color: "#e8c46b",
  letterSpacing: ".18em",
  textTransform: "uppercase",
  fontWeight: 950,
  fontSize: 12,
};

const button: React.CSSProperties = {
  display: "inline-flex",
  justifyContent: "center",
  alignItems: "center",
  minHeight: 44,
  borderRadius: 999,
  padding: "10px 14px",
  textDecoration: "none",
  fontWeight: 950,
  background: "linear-gradient(135deg,#f8e7b0,#e8c46b)",
  color: "#06100a",
  border: 0,
  cursor: "pointer",
  whiteSpace: "normal",
  textAlign: "center",
};

const ghost: React.CSSProperties = {
  ...button,
  background: "rgba(255,255,255,.06)",
  border: "1px solid rgba(255,255,255,.16)",
  color: "white",
};

function RouteCard({ row, index }: { row: Row; index: number }) {
  const signalId = idOf(row, index);
  const itemId = itemIdOf(row, index);
  const title = titleOf(row);
  const role = roleOf(row);
  const score = scoreOf(row);
  const status = statusOf(row);

  const messageHref =
    `/messages/new?to=${encodeURIComponent("bcrsoutheast@gmail.com")}` +
    `&subject=${encodeURIComponent(title)}` +
    `&room_title=${encodeURIComponent(title)}` +
    `&title=${encodeURIComponent(title)}` +
    `&room_type=${encodeURIComponent("Routing Room")}` +
    `&room_id=${encodeURIComponent(signalId)}` +
    `&signal_id=${encodeURIComponent(signalId)}` +
    `&item_id=${encodeURIComponent(itemId)}` +
    `&source=${encodeURIComponent("routing-inbox")}` +
    `&type=${encodeURIComponent("routing")}` +
    `&folder=${encodeURIComponent("routing")}` +
    `&source_route=${encodeURIComponent(`/routing-room/${signalId}`)}`;

  return (
    <article style={panel}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
        <span style={chip("#9df3bf")}>{role}</span>
        <span style={chip("#f8e7b0")}>Score {score}</span>
        <span style={chip("#56d8ff")}>{status}</span>
      </div>

      <h2
        style={{
          fontSize: "clamp(32px,5vw,56px)",
          lineHeight: 0.95,
          letterSpacing: "-.05em",
          margin: "0 0 12px",
          overflowWrap: "anywhere",
        }}
      >
        {title}
      </h2>

      <p
        style={{
          color: "#cbd5e1",
          fontSize: 18,
          lineHeight: 1.5,
          margin: "0 0 14px",
          overflowWrap: "anywhere",
        }}
      >
        Type: {typeOf(row)} | Strategy: {strategyOf(row)} | Exit: {exitOf(row)} | Market: {marketOf(row)}
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
        <span style={softChip}>Signal: {signalId}</span>
        <span style={softChip}>Item: {itemId}</span>
        <span style={softChip}>Market: {marketOf(row)}</span>
      </div>

      <div className="vf-route-actions" style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 10 }}>
        <Link href={`/routing-room/${encodeURIComponent(signalId)}`} style={button}>
          Open Routing Room
        </Link>

        <Link href={`/deal/detail?id=${encodeURIComponent(itemId)}`} style={ghost}>
          Open Deal Room
        </Link>

        <Link href={messageHref} style={ghost}>
          Request Info / Intro
        </Link>

        <Link href="/dashboard" style={ghost}>
          Command
        </Link>
      </div>
    </article>
  );
}

function chip(color: string): React.CSSProperties {
  return {
    border: `1px solid ${color}55`,
    borderRadius: 999,
    padding: "8px 11px",
    color,
    background: `${color}12`,
    fontWeight: 900,
    fontSize: 13,
    maxWidth: "100%",
    overflowWrap: "anywhere",
  };
}

const softChip: React.CSSProperties = {
  border: "1px solid rgba(157,243,191,.25)",
  borderRadius: 999,
  padding: "8px 11px",
  color: "#9df3bf",
  background: "rgba(157,243,191,.08)",
  fontWeight: 900,
  fontSize: 12,
  maxWidth: "100%",
  overflowWrap: "anywhere",
};

export default function RoutingInboxPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [status, setStatus] = useState("Loading routing queue...");

  useEffect(() => {
    async function load() {
      const email = getEmail();

      const endpoints = [
        `/api/routing/actions?email=${encodeURIComponent(email)}&owner=0`,
        `/api/deal/feed?email=${encodeURIComponent(email)}&owner=0`,
        `/api/pain/feed?email=${encodeURIComponent(email)}&owner=0`,
        `/api/dashboard/live?email=${encodeURIComponent(email)}&owner=0`,
      ];

      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint, {
            cache: "no-store",
            credentials: "include",
            headers: {
              "x-vf-email": email,
              "x-vf-admin": "0",
            },
          });

          const data = await safeJson(response);
          const normalized = normalizeRows(data);

          if (response.ok && normalized.length) {
            setRows(normalized);
            setStatus("");
            return;
          }
        } catch {
          // Try next.
        }
      }

      setRows([]);
      setStatus("No routing paths found yet.");
    }

    load();
  }, []);

  const counts = useMemo(() => {
    return {
      total: rows.length,
      generated: rows.filter((row) => lower(statusOf(row)).includes("generated") || lower(statusOf(row)).includes("new")).length,
      routed: rows.filter((row) => lower(statusOf(row)).includes("routed")).length,
      ownerReady: rows.filter((row) => !lower(statusOf(row)).includes("routed")).length,
    };
  }, [rows]);

  return (
    <main style={page}>
      <style>{`
        html, body {
          overflow-x: hidden;
        }

        a:hover, button:hover {
          transform: translateY(-1px);
          transition: all .18s ease;
          filter: brightness(1.06);
        }

        @media(max-width:760px) {
          .vf-stats {
            grid-template-columns: 1fr !important;
          }

          .vf-route-grid {
            grid-template-columns: 1fr !important;
          }

          .vf-route-actions {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      <div style={wrap}>
        <section style={panel}>
          <div style={label}>VaultForge Routing Center</div>

          <h1
            style={{
              fontSize: "clamp(54px,10vw,104px)",
              lineHeight: 0.88,
              letterSpacing: "-.075em",
              margin: "12px 0 18px",
            }}
          >
            Routing queue.
          </h1>

          <p style={{ color: "#cbd5e1", lineHeight: 1.65, fontSize: 20, marginTop: 0 }}>
            Member-fit paths and owner-ready routes. Cards now stay inside the screen and action buttons are readable.
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 16 }}>
            <Link href="/dashboard" style={button}>Back To Command</Link>
            <Link href="/signals" style={ghost}>Signals</Link>
            <Link href="/introductions" style={ghost}>Introductions</Link>
            <Link href="/message-command" style={ghost}>Messages</Link>
          </div>
        </section>

        <section className="vf-stats" style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 14, marginBottom: 20 }}>
          {[
            ["Routes", counts.total, "#56d8ff"],
            ["Generated", counts.generated, "#f8e7b0"],
            ["Routed", counts.routed, "#9df3bf"],
            ["Owner Ready", counts.ownerReady, "#fb7185"],
          ].map(([name, value, color]) => (
            <section key={String(name)} style={panel}>
              <div style={{ ...label, color: String(color) }}>{name}</div>
              <div style={{ fontSize: 54, fontWeight: 950, marginTop: 10 }}>{String(value)}</div>
            </section>
          ))}
        </section>

        <section style={panel}>
          <div style={label}>Routing Queue</div>
          <h2
            style={{
              fontSize: "clamp(38px,7vw,74px)",
              lineHeight: 0.9,
              letterSpacing: "-.06em",
              margin: "10px 0 0",
            }}
          >
            Member-fit paths.
          </h2>
        </section>

        {status ? (
          <section style={panel}>
            <p style={{ color: "#cbd5e1", lineHeight: 1.55, margin: 0 }}>{status}</p>
          </section>
        ) : null}

        <section className="vf-route-grid" style={{ display: "grid", gridTemplateColumns: "1fr", gap: 18 }}>
          {rows.map((row, index) => (
            <RouteCard key={`${idOf(row, index)}-${itemIdOf(row, index)}-${index}`} row={row} index={index} />
          ))}
        </section>
      </div>
    </main>
  );
}
