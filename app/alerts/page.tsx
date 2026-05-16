"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import VaultForgeMemberNav from "../components/VaultForgeMemberNav";

type AlertItem = Record<string, any>;

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

  const keys = ["vf_email", "vf_member_email", "memberEmail", "email"];

  for (const key of keys) {
    try {
      const localValue = cleanEmail(window.localStorage.getItem(key));
      if (localValue.includes("@")) return localValue;

      const sessionValue = cleanEmail(window.sessionStorage.getItem(key));
      if (sessionValue.includes("@")) return sessionValue;
    } catch {
      // Continue.
    }
  }

  const cookieValue = cleanEmail(readCookie("vf_email") || readCookie("vf_member_email"));
  return cookieValue.includes("@") ? cookieValue : "";
}

function seenKey(email: string) {
  return `vaultforge_seen_alerts_${email || "guest"}`;
}

function getSeen(email: string) {
  if (typeof window === "undefined") return new Set<string>();

  try {
    const parsed = JSON.parse(window.localStorage.getItem(seenKey(email)) || "[]");
    if (Array.isArray(parsed)) return new Set(parsed.map(clean).filter(Boolean));
  } catch {
    // Continue.
  }

  return new Set<string>();
}

function saveSeen(email: string, ids: string[]) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(seenKey(email), JSON.stringify(Array.from(new Set(ids.map(clean).filter(Boolean)))));
  } catch {
    // Ignore.
  }
}

function meta(row: AlertItem) {
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

function alertId(row: AlertItem, index: number) {
  const m = meta(row);
  return first(
    row.alert_id,
    row.id,
    row.signal_id,
    row.item_id,
    row.deal_id,
    row.pain_id,
    row.room_id,
    row.project_id,
    m.alert_id,
    m.signal_id,
    m.item_id,
    m.deal_id,
    m.pain_id,
    row.title,
    row.deal_title,
    row.pain_title,
    `alert-${index}`
  );
}

function titleOf(row: AlertItem) {
  const m = meta(row);
  return first(row.title, row.alert_title, row.deal_title, row.pain_title, row.signal_title, row.project_title, row.headline, row.name, row.address, m.title, m.deal_title, m.pain_title, "VaultForge Alert");
}

function summaryOf(row: AlertItem) {
  const m = meta(row);
  return first(
    row.summary,
    row.alert_summary,
    row.ai_summary,
    row.description,
    row.note,
    row.notes,
    row.route_summary,
    m.summary,
    m.alert_summary,
    m.ai_summary,
    m.route_summary,
    "VaultForge found a possible match based on your states, role, strategy, capability, or pressure-solving profile."
  );
}

function typeOf(row: AlertItem) {
  const text = [
    row.type,
    row.alert_type,
    row.signal_type,
    row.source,
    row.folder,
    row.room_type,
    row.problem_type,
    row.pain_type,
    row.category,
    meta(row).type,
    meta(row).source,
  ]
    .map((value) => clean(value).toLowerCase())
    .join(" ");

  if (text.includes("pain") || text.includes("pressure")) return "pressure";
  if (text.includes("routing")) return "routing";
  if (text.includes("signal")) return "signal";
  return "opportunity";
}

function scoreOf(row: AlertItem) {
  const m = meta(row);
  const raw = Number(first(row.match_score, row.score, row.confidence_score, row.priority_score, m.match_score, m.score, m.confidence_score, m.priority_score));
  if (Number.isFinite(raw) && raw > 0) return Math.max(0, Math.min(100, Math.round(raw)));
  if (typeOf(row) === "pressure") return 84;
  return 76;
}

function roomHref(row: AlertItem) {
  const id = alertId(row, 0);
  const type = typeOf(row);

  if (!id) return "/dashboard";
  if (type === "pressure") return `/pain-room/${encodeURIComponent(id)}`;
  if (type === "routing") return `/routing-room/${encodeURIComponent(id)}`;
  if (type === "signal") return `/signals/${encodeURIComponent(id)}`;
  return `/deal/detail?id=${encodeURIComponent(id)}`;
}

function normalizeRows(data: any) {
  const rows = [
    ...(Array.isArray(data.alerts) ? data.alerts : []),
    ...(Array.isArray(data.signals) ? data.signals : []),
    ...(Array.isArray(data.items) ? data.items : []),
    ...(Array.isArray(data.feed) ? data.feed : []),
    ...(Array.isArray(data.results) ? data.results : []),
    ...(Array.isArray(data.rows) ? data.rows : []),
    ...(Array.isArray(data.data) ? data.data : []),
    ...(Array.isArray(data.deals) ? data.deals : []),
    ...(Array.isArray(data.pains) ? data.pains : []),
  ];

  const byId = new Map<string, AlertItem>();
  rows.forEach((row: AlertItem, index: number) => {
    const id = alertId(row, index);
    byId.set(id, row);
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
    "radial-gradient(circle at top left, rgba(232,196,107,.14), transparent 28%), radial-gradient(circle at 86% 12%, rgba(248,113,113,.12), transparent 30%), linear-gradient(180deg,#020303,#071326 55%,#020303)",
  color: "white",
  padding: "22px 16px 96px",
  fontFamily: "Arial, sans-serif",
};

const wrap: React.CSSProperties = {
  width: "min(1180px,100%)",
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

const label: React.CSSProperties = {
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
  minHeight: 46,
  borderRadius: 999,
  padding: "11px 16px",
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

const pill: React.CSSProperties = {
  border: "1px solid rgba(248,113,113,.24)",
  borderRadius: 999,
  padding: "8px 11px",
  color: "#fecaca",
  background: "rgba(248,113,113,.07)",
  fontWeight: 900,
  fontSize: 13,
  display: "inline-flex",
};

function AlertCard({
  row,
  index,
  email,
  seen,
  onMarkSeen,
}: {
  row: AlertItem;
  index: number;
  email: string;
  seen: boolean;
  onMarkSeen: (id: string) => void;
}) {
  const id = alertId(row, index);
  const href = roomHref(row);
  const score = scoreOf(row);
  const type = typeOf(row);

  return (
    <article
      style={{
        ...card,
        borderColor: seen ? "rgba(255,255,255,.14)" : "rgba(248,113,113,.45)",
        boxShadow: seen ? card.boxShadow : "0 0 0 0 rgba(248,113,113,.45), 0 28px 86px rgba(0,0,0,.30)",
        animation: seen ? "none" : "vfAlertCardPulse 1.45s ease-in-out infinite",
      }}
    >
      <style>{`
        @keyframes vfAlertCardPulse {
          0% { box-shadow: 0 0 0 0 rgba(248,113,113,.45), 0 28px 86px rgba(0,0,0,.30); }
          55% { box-shadow: 0 0 0 9px rgba(248,113,113,0), 0 28px 86px rgba(0,0,0,.30); }
          100% { box-shadow: 0 0 0 0 rgba(248,113,113,0), 0 28px 86px rgba(0,0,0,.30); }
        }
      `}</style>

      <div style={label}>{seen ? "Viewed Alert" : "New Match Alert"}</div>

      <h2
        style={{
          fontSize: "clamp(34px,5vw,54px)",
          lineHeight: 0.95,
          letterSpacing: "-.045em",
          margin: "10px 0 10px",
        }}
      >
        {titleOf(row)}
      </h2>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
        <span style={pill}>{type}</span>
        <span style={{ ...pill, color: "#f8e7b0", borderColor: "rgba(232,196,107,.24)", background: "rgba(232,196,107,.06)" }}>
          {score}% fit
        </span>
        {!seen ? <span style={{ ...pill, color: "#9df3bf", borderColor: "rgba(157,243,191,.24)", background: "rgba(157,243,191,.06)" }}>unread</span> : null}
      </div>

      <p style={{ ...muted, marginTop: 0 }}>{summaryOf(row)}</p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 16 }}>
        <Link
          href={href}
          onClick={() => onMarkSeen(id)}
          style={button}
        >
          Open Alert
        </Link>

        <button
          type="button"
          onClick={() => onMarkSeen(id)}
          style={ghost}
        >
          Mark Seen
        </button>
      </div>
    </article>
  );
}

export default function AlertsPage() {
  const [email, setEmail] = useState("");
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [seenIds, setSeenIds] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState("Loading alerts...");

  function markSeen(id: string) {
    const next = new Set(seenIds);
    next.add(id);
    setSeenIds(next);
    saveSeen(email, Array.from(next));
  }

  function markAllSeen() {
    const ids = alerts.map((row, index) => alertId(row, index));
    const next = new Set([...Array.from(seenIds), ...ids]);
    setSeenIds(next);
    saveSeen(email, Array.from(next));
  }

  useEffect(() => {
    async function loadAlerts() {
      const viewer = getEmail();
      setEmail(viewer);
      setSeenIds(getSeen(viewer));

      const endpoints = [
        `/api/alerts/feed?email=${encodeURIComponent(viewer)}&owner=0`,
        `/api/deal/feed?email=${encodeURIComponent(viewer)}&owner=0`,
        `/api/pain/feed?email=${encodeURIComponent(viewer)}&owner=0`,
        `/api/dashboard/live?email=${encodeURIComponent(viewer)}&owner=0`,
      ];

      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint, {
            cache: "no-store",
            credentials: "include",
            headers: {
              "x-vf-email": viewer,
              "x-vf-admin": "0",
            },
          });

          const data = await safeJson(response);
          const rows = normalizeRows(data);

          if (response.ok && rows.length) {
            setAlerts(rows);
            setStatus("");
            return;
          }
        } catch {
          // Try next.
        }
      }

      setAlerts([]);
      setStatus("No live alerts found yet. New alerts will appear when VaultForge finds matching deals, pain rooms, signals, or routing opportunities.");
    }

    loadAlerts();
  }, []);

  const unseen = useMemo(() => {
    return alerts.filter((row, index) => !seenIds.has(alertId(row, index)));
  }, [alerts, seenIds]);

  return (
    <main style={page}>
      <style>{`
        a:hover, button:hover {
          transform: translateY(-1px);
          transition: all .18s ease;
          filter: brightness(1.06);
        }

        @media(max-width:760px) {
          .vf-grid {
            grid-template-columns: 1fr !important;
          }

          .vf-actions {
            display: grid !important;
            grid-template-columns: 1fr !important;
          }

          .vf-actions > * {
            width: 100%;
            box-sizing: border-box;
          }
        }
      `}</style>

      <div style={wrap}>
        <VaultForgeMemberNav
          title="Alerts"
          subtitle="New match alerts pulse until viewed, then stop."
          active="alerts"
        />

        <section style={card}>
          <div style={label}>VaultForge Alert Trigger Layer</div>

          <h1
            style={{
              fontSize: "clamp(54px,10vw,104px)",
              lineHeight: 0.88,
              letterSpacing: "-.075em",
              margin: "12px 0 18px",
            }}
          >
            {unseen.length ? `${unseen.length} new alert${unseen.length === 1 ? "" : "s"}.` : "Alerts clear."}
          </h1>

          <p style={{ ...muted, fontSize: 20, marginTop: 0 }}>
            Alerts pulse only while they are new. Once a member clicks Open Alert or Mark Seen, VaultForge remembers it and the flashing stops.
          </p>

          <div className="vf-actions" style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 16 }}>
            <button type="button" onClick={markAllSeen} style={button}>Mark All Seen</button>
            <Link href="/dashboard" style={ghost}>Command</Link>
            <Link href="/opportunity-rooms" style={ghost}>Opportunity Rooms</Link>
            <Link href="/pressure-rooms" style={ghost}>Pressure Rooms</Link>
          </div>
        </section>

        {status ? (
          <section style={card}>
            <p style={{ ...muted, margin: 0 }}>{status}</p>
          </section>
        ) : null}

        <section className="vf-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 18 }}>
          {alerts.map((row, index) => {
            const id = alertId(row, index);
            const seen = seenIds.has(id);

            return (
              <AlertCard
                key={`${id}-${index}`}
                row={row}
                index={index}
                email={email}
                seen={seen}
                onMarkSeen={markSeen}
              />
            );
          })}
        </section>
      </div>
    </main>
  );
}
