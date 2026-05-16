"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import VaultForgeMemberNav from "../components/VaultForgeMemberNav";

type AlertItem = Record<string, any>;

type AlertAction = "seen" | "saved" | "archived" | "hidden";

const lanes = [
  ["new", "New Matches"],
  ["opportunity", "Opportunity"],
  ["pressure", "Pressure"],
  ["routing", "Routing"],
  ["messages", "Messages"],
  ["saved", "Saved"],
  ["archived", "Archived"],
  ["hidden", "Hidden"],
];

function clean(value: unknown) {
  return String(value || "").trim();
}

function cleanEmail(value: unknown) {
  return clean(value).toLowerCase();
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

function storeKey(email: string, action: AlertAction) {
  return `vaultforge_${action}_alerts_${email || "guest"}`;
}

function readSet(email: string, action: AlertAction) {
  if (typeof window === "undefined") return new Set<string>();

  try {
    const parsed = JSON.parse(window.localStorage.getItem(storeKey(email, action)) || "[]");
    if (Array.isArray(parsed)) return new Set(parsed.map(clean).filter(Boolean));
  } catch {
    // Continue.
  }

  return new Set<string>();
}

function writeSet(email: string, action: AlertAction, set: Set<string>) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(storeKey(email, action), JSON.stringify(Array.from(set)));
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

  return first(
    row.title,
    row.alert_title,
    row.deal_title,
    row.pain_title,
    row.signal_title,
    row.project_title,
    row.headline,
    row.name,
    row.address,
    m.title,
    m.deal_title,
    m.pain_title,
    "VaultForge Alert"
  );
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
    "VaultForge found a possible match based on your states, roles, strategy, capability, or pressure-solving profile."
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
    row.thread_key,
    meta(row).type,
    meta(row).source,
  ]
    .map(lower)
    .join(" ");

  if (text.includes("message") || text.includes("thread")) return "messages";
  if (text.includes("pain") || text.includes("pressure")) return "pressure";
  if (text.includes("routing")) return "routing";
  if (text.includes("signal")) return "routing";
  return "opportunity";
}

function scoreOf(row: AlertItem) {
  const m = meta(row);

  const raw = Number(
    first(
      row.match_score,
      row.score,
      row.confidence_score,
      row.priority_score,
      m.match_score,
      m.score,
      m.confidence_score,
      m.priority_score
    )
  );

  if (Number.isFinite(raw) && raw > 0) return Math.max(0, Math.min(100, Math.round(raw)));
  if (typeOf(row) === "pressure") return 84;
  if (typeOf(row) === "routing") return 80;
  if (typeOf(row) === "messages") return 100;
  return 76;
}

function roomHref(row: AlertItem, index: number) {
  const id = alertId(row, index);
  const type = typeOf(row);

  if (!id) return "/dashboard";
  if (type === "pressure") return `/pain-room/${encodeURIComponent(id)}`;
  if (type === "routing") return `/routing-room/${encodeURIComponent(id)}`;
  if (type === "messages") return "/message-command";
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
    ...(Array.isArray(data.messages) ? data.messages : []),
    ...(Array.isArray(data.threads) ? data.threads : []),
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
  minHeight: 44,
  borderRadius: 999,
  padding: "10px 14px",
  border: 0,
  background: "linear-gradient(135deg,#f8e7b0,#e8c46b)",
  color: "#06100a",
  fontWeight: 950,
  textDecoration: "none",
  cursor: "pointer",
};

const ghost: React.CSSProperties = {
  ...button,
  background: "rgba(255,255,255,.06)",
  border: "1px solid rgba(255,255,255,.16)",
  color: "white",
};

const danger: React.CSSProperties = {
  ...ghost,
  border: "1px solid rgba(248,113,113,.30)",
  color: "#fecaca",
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

function laneTitle(lane: string) {
  return lanes.find(([key]) => key === lane)?.[1] || "New Matches";
}

function AlertCard({
  row,
  index,
  status,
  onAction,
}: {
  row: AlertItem;
  index: number;
  status: {
    seen: boolean;
    saved: boolean;
    archived: boolean;
    hidden: boolean;
  };
  onAction: (id: string, action: AlertAction) => void;
}) {
  const id = alertId(row, index);
  const href = roomHref(row, index);
  const score = scoreOf(row);
  const type = typeOf(row);
  const shouldPulse = !status.seen && !status.archived && !status.hidden;

  return (
    <article
      style={{
        ...card,
        borderColor: shouldPulse ? "rgba(248,113,113,.45)" : "rgba(255,255,255,.14)",
        animation: shouldPulse ? "vfAlertCardPulse 1.45s ease-in-out infinite" : "none",
      }}
    >
      <style>{`
        @keyframes vfAlertCardPulse {
          0% { box-shadow: 0 0 0 0 rgba(248,113,113,.45), 0 28px 86px rgba(0,0,0,.30); }
          55% { box-shadow: 0 0 0 9px rgba(248,113,113,0), 0 28px 86px rgba(0,0,0,.30); }
          100% { box-shadow: 0 0 0 0 rgba(248,113,113,0), 0 28px 86px rgba(0,0,0,.30); }
        }
      `}</style>

      <div style={label}>{shouldPulse ? "New Alert" : status.saved ? "Saved Alert" : status.archived ? "Archived Alert" : status.hidden ? "Hidden Alert" : "Viewed Alert"}</div>

      <h2
        style={{
          fontSize: "clamp(32px,5vw,52px)",
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
        {status.saved ? <span style={{ ...pill, color: "#9df3bf", borderColor: "rgba(157,243,191,.24)", background: "rgba(157,243,191,.06)" }}>saved</span> : null}
        {!status.seen ? <span style={{ ...pill, color: "#9df3bf", borderColor: "rgba(157,243,191,.24)", background: "rgba(157,243,191,.06)" }}>unread</span> : null}
      </div>

      <p style={{ ...muted, marginTop: 0 }}>{summaryOf(row)}</p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 16 }}>
        <Link
          href={href}
          onClick={() => onAction(id, "seen")}
          style={button}
        >
          Open Room
        </Link>

        <button type="button" onClick={() => onAction(id, "seen")} style={ghost}>
          Mark Seen
        </button>

        <button type="button" onClick={() => onAction(id, "saved")} style={ghost}>
          {status.saved ? "Unsave" : "Save"}
        </button>

        <button type="button" onClick={() => onAction(id, "archived")} style={ghost}>
          {status.archived ? "Unarchive" : "Archive"}
        </button>

        <button type="button" onClick={() => onAction(id, "hidden")} style={danger}>
          {status.hidden ? "Unhide" : "Hide"}
        </button>
      </div>
    </article>
  );
}

export default function AlertsPage() {
  const [email, setEmail] = useState("");
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [lane, setLane] = useState("new");
  const [seenIds, setSeenIds] = useState<Set<string>>(new Set());
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [archivedIds, setArchivedIds] = useState<Set<string>>(new Set());
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState("Loading alert room...");

  function getStatus(id: string) {
    return {
      seen: seenIds.has(id),
      saved: savedIds.has(id),
      archived: archivedIds.has(id),
      hidden: hiddenIds.has(id),
    };
  }

  function toggleSet(current: Set<string>, id: string) {
    const next = new Set(current);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  }

  function onAction(id: string, action: AlertAction) {
    if (action === "seen") {
      const next = new Set(seenIds);
      next.add(id);
      setSeenIds(next);
      writeSet(email, "seen", next);
      return;
    }

    if (action === "saved") {
      const next = toggleSet(savedIds, id);
      setSavedIds(next);
      writeSet(email, "saved", next);

      const seenNext = new Set(seenIds);
      seenNext.add(id);
      setSeenIds(seenNext);
      writeSet(email, "seen", seenNext);
      return;
    }

    if (action === "archived") {
      const next = toggleSet(archivedIds, id);
      setArchivedIds(next);
      writeSet(email, "archived", next);

      const seenNext = new Set(seenIds);
      seenNext.add(id);
      setSeenIds(seenNext);
      writeSet(email, "seen", seenNext);
      return;
    }

    if (action === "hidden") {
      const next = toggleSet(hiddenIds, id);
      setHiddenIds(next);
      writeSet(email, "hidden", next);

      const seenNext = new Set(seenIds);
      seenNext.add(id);
      setSeenIds(seenNext);
      writeSet(email, "seen", seenNext);
    }
  }

  function markAllSeen() {
    const ids = alerts.map((row, index) => alertId(row, index));
    const next = new Set([...Array.from(seenIds), ...ids]);
    setSeenIds(next);
    writeSet(email, "seen", next);
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const startLane = clean(params.get("lane")) || clean(params.get("folder")) || "new";
    setLane(startLane);
  }, []);

  useEffect(() => {
    async function loadAlerts() {
      const viewer = getEmail();
      setEmail(viewer);
      setSeenIds(readSet(viewer, "seen"));
      setSavedIds(readSet(viewer, "saved"));
      setArchivedIds(readSet(viewer, "archived"));
      setHiddenIds(readSet(viewer, "hidden"));

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
      setStatus("No live alerts found yet. New alerts will appear when VaultForge finds matching deals, pain rooms, signals, routing activity, or messages.");
    }

    loadAlerts();
  }, []);

  const laneCounts = useMemo(() => {
    const counts: Record<string, number> = {
      new: 0,
      opportunity: 0,
      pressure: 0,
      routing: 0,
      messages: 0,
      saved: 0,
      archived: 0,
      hidden: 0,
    };

    alerts.forEach((row, index) => {
      const id = alertId(row, index);
      const type = typeOf(row);

      if (!seenIds.has(id) && !archivedIds.has(id) && !hiddenIds.has(id)) counts.new += 1;
      if (!archivedIds.has(id) && !hiddenIds.has(id)) counts[type] = (counts[type] || 0) + 1;
      if (savedIds.has(id)) counts.saved += 1;
      if (archivedIds.has(id)) counts.archived += 1;
      if (hiddenIds.has(id)) counts.hidden += 1;
    });

    return counts;
  }, [alerts, seenIds, savedIds, archivedIds, hiddenIds]);

  const filtered = useMemo(() => {
    return alerts.filter((row, index) => {
      const id = alertId(row, index);
      const type = typeOf(row);
      const rowStatus = getStatus(id);

      if (lane === "new") return !rowStatus.seen && !rowStatus.archived && !rowStatus.hidden;
      if (lane === "saved") return rowStatus.saved;
      if (lane === "archived") return rowStatus.archived;
      if (lane === "hidden") return rowStatus.hidden;
      return type === lane && !rowStatus.archived && !rowStatus.hidden;
    });
  }, [alerts, lane, seenIds, savedIds, archivedIds, hiddenIds]);

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
          title="Alert Room"
          subtitle="Alerts have their own room, folders, cleanup controls, and viewed/saved/archive state."
          active="alerts"
        />

        <section style={card}>
          <div style={label}>VaultForge Alert Room</div>

          <h1
            style={{
              fontSize: "clamp(54px,10vw,104px)",
              lineHeight: 0.88,
              letterSpacing: "-.075em",
              margin: "12px 0 18px",
            }}
          >
            {laneTitle(lane)}.
          </h1>

          <p style={{ ...muted, fontSize: 20, marginTop: 0 }}>
            Alerts are separated into rooms/folders. New alerts pulse until opened, marked seen, saved, archived, or hidden.
          </p>

          <div className="vf-actions" style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 16 }}>
            <button type="button" onClick={markAllSeen} style={button}>Mark All Seen</button>
            <Link href="/dashboard" style={ghost}>Command</Link>
            <Link href="/opportunity-rooms" style={ghost}>Opportunity Rooms</Link>
            <Link href="/pressure-rooms" style={ghost}>Pressure Rooms</Link>
          </div>
        </section>

        <section style={card}>
          <div style={label}>Alert Folders</div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 14 }}>
            {lanes.map(([key, name]) => (
              <button
                key={key}
                type="button"
                onClick={() => setLane(key)}
                style={{
                  ...ghost,
                  background: key === lane ? "linear-gradient(135deg,#f8e7b0,#e8c46b)" : ghost.background,
                  color: key === lane ? "#06100a" : "white",
                  border: key === lane ? "0" : ghost.border,
                }}
              >
                {name} ({laneCounts[key] || 0})
              </button>
            ))}
          </div>
        </section>

        {status ? (
          <section style={card}>
            <p style={{ ...muted, margin: 0 }}>{status}</p>
          </section>
        ) : null}

        {!status && !filtered.length ? (
          <section style={card}>
            <div style={label}>Folder Empty</div>
            <p style={{ ...muted, margin: "8px 0 0" }}>
              No alerts are currently in {laneTitle(lane)}. Use the folders above or wait for a new match trigger.
            </p>
          </section>
        ) : null}

        <section className="vf-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 18 }}>
          {filtered.map((row, index) => {
            const id = alertId(row, index);

            return (
              <AlertCard
                key={`${id}-${index}`}
                row={row}
                index={index}
                status={getStatus(id)}
                onAction={onAction}
              />
            );
          })}
        </section>
      </div>
    </main>
  );
}
