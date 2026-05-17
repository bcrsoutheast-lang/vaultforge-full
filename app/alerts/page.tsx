"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import VaultForgeCommandShell from "../components/VaultForgeCommandShell";

function clean(value: unknown) {
  return String(value || "").trim();
}

function lower(value: unknown) {
  return clean(value).toLowerCase();
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

function meta(row: Record<string, any>) {
  return row && typeof row.metadata === "object" && row.metadata ? row.metadata : {};
}

async function safeJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

const panel: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.22)",
  borderRadius: 30,
  padding: 24,
  background: "linear-gradient(145deg,rgba(255,255,255,.070),rgba(255,255,255,.030))",
  boxShadow: "0 24px 80px rgba(0,0,0,.30)",
  marginBottom: 18,
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
  minHeight: 46,
  borderRadius: 999,
  padding: "11px 16px",
  textDecoration: "none",
  fontWeight: 950,
  background: "linear-gradient(135deg,#f8e7b0,#e8c46b)",
  color: "#06100a",
  border: 0,
  cursor: "pointer",
};

const ghost: React.CSSProperties = {
  ...button,
  background: "rgba(255,255,255,.06)",
  border: "1px solid rgba(255,255,255,.16)",
  color: "white",
};

const chip: React.CSSProperties = {
  border: "1px solid rgba(157,243,191,.24)",
  borderRadius: 999,
  padding: "7px 10px",
  color: "#9df3bf",
  background: "rgba(157,243,191,.08)",
  fontWeight: 900,
  fontSize: 12,
};


type AlertRow = Record<string, any>;

const lanes = [
  ["new", "New"],
  ["opportunity", "Opportunity"],
  ["pressure", "Pressure"],
  ["routing", "Routing"],
  ["messages", "Messages"],
  ["saved", "Saved"],
  ["archived", "Archived"],
  ["hidden", "Hidden"],
];

function idOf(row: AlertRow, index = 0) {
  const m = meta(row);
  return first(row.alert_id, row.id, row.signal_id, row.item_id, row.deal_id, row.pain_id, m.alert_id, m.id, m.signal_id, m.item_id, `alert-${index}`);
}

function titleOf(row: AlertRow) {
  const m = meta(row);
  return first(row.title, row.alert_title, row.deal_title, row.pain_title, row.signal_title, row.headline, m.title, m.alert_title, "VaultForge Alert");
}

function summaryOf(row: AlertRow) {
  const m = meta(row);
  return first(row.summary, row.alert_summary, row.ai_summary, row.description, m.summary, m.alert_summary, "VaultForge found a possible trigger based on fit, pressure, routing, or message activity.");
}

function typeOf(row: AlertRow) {
  const text = [row.type, row.alert_type, row.signal_type, row.source, row.folder, row.room_type, row.problem_type, row.pain_type, row.category, meta(row).type, meta(row).source].map(lower).join(" ");
  if (text.includes("message") || text.includes("thread")) return "messages";
  if (text.includes("pain") || text.includes("pressure")) return "pressure";
  if (text.includes("routing") || text.includes("signal")) return "routing";
  return "opportunity";
}

function hrefOf(row: AlertRow, index = 0) {
  const id = idOf(row, index);
  const type = typeOf(row);
  if (type === "pressure") return `/pain-room/${encodeURIComponent(id)}`;
  if (type === "routing") return `/routing-room/${encodeURIComponent(id)}`;
  if (type === "messages") return "/message-command";
  return `/deal/detail?id=${encodeURIComponent(id)}`;
}

function normalizeRows(data: any) {
  const rows = [
    ...(Array.isArray(data.alerts) ? data.alerts : []),
    ...(Array.isArray(data.triggers) ? data.triggers : []),
    ...(Array.isArray(data.items) ? data.items : []),
    ...(Array.isArray(data.feed) ? data.feed : []),
    ...(Array.isArray(data.results) ? data.results : []),
    ...(Array.isArray(data.rows) ? data.rows : []),
    ...(Array.isArray(data.data) ? data.data : []),
  ];

  if (!rows.length && data && typeof data === "object" && !Array.isArray(data)) {
    const single = data.alert || data.trigger || data.record || data.item;
    if (single) rows.push(single);
  }

  return rows;
}

function AlertCard({ row, index }: { row: AlertRow; index: number }) {
  const id = idOf(row, index);
  const title = titleOf(row);
  return (
    <article style={panel}>
      <div style={label}>{typeOf(row)} Alert</div>
      <h2 style={{ fontSize: "clamp(34px,6vw,64px)", lineHeight: 0.92, letterSpacing: "-.055em", margin: "10px 0 12px", overflowWrap: "anywhere" }}>{title}</h2>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
        <span style={chip}>Trigger</span>
        <span style={chip}>{id}</span>
      </div>
      <p style={{ color: "#cbd5e1", lineHeight: 1.55, marginTop: 0 }}>{summaryOf(row)}</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 16 }}>
        <Link href={hrefOf(row, index)} style={button}>Open Correct Room</Link>
        <Link href="/dashboard" style={ghost}>Command</Link>
      </div>
    </article>
  );
}

export default function AlertsPage() {
  const [lane, setLane] = useState("new");
  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [status, setStatus] = useState("Loading alerts...");

  useEffect(() => {
    const requested = clean(new URLSearchParams(window.location.search).get("lane"));
    if (requested) setLane(requested);
  }, []);

  useEffect(() => {
    async function loadAlerts() {
      const email = getEmail();
      const endpoints = [
        `/api/alerts/feed?email=${encodeURIComponent(email)}&owner=0`,
        `/api/alerts?email=${encodeURIComponent(email)}&owner=0`,
      ];

      const collected: AlertRow[] = [];

      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint, { cache: "no-store", credentials: "include", headers: { "x-vf-email": email, "x-vf-admin": "0" } });
          const data = await safeJson(response);
          const rows = normalizeRows(data);
          if (response.ok && rows.length) collected.push(...rows);
        } catch {}
      }

      setAlerts(collected);
      setStatus(collected.length ? "" : "No live alerts found yet. Alerts will appear when VaultForge detects matches, pressure, routing, or messages.");
    }

    loadAlerts();
  }, []);

  const filtered = useMemo(() => {
    if (lane === "new") return alerts;
    return alerts.filter((row) => typeOf(row) === lane);
  }, [alerts, lane]);

  return (
    <VaultForgeCommandShell active="alerts" title="Alert Room." subtitle="Unread triggers, new matches, pressure warnings, routing notices, and message signals live here.">
      <section style={panel}>
        <div style={label}>VaultForge Alert Room</div>
        <h2 style={{ fontSize: "clamp(42px,8vw,82px)", lineHeight: 0.9, letterSpacing: "-.06em", margin: "12px 0 16px" }}>Trigger lane.</h2>
        <p style={{ color: "#cbd5e1", lineHeight: 1.65, fontSize: 19, marginTop: 0, maxWidth: 920 }}>Alerts are not storage. They open the correct room, then the room cleanup controls keep the workspace clean.</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 16 }}>
          {lanes.map(([key, name]) => (
            <button key={key} type="button" onClick={() => setLane(key)} style={{ ...ghost, background: lane === key ? "linear-gradient(135deg,#f8e7b0,#e8c46b)" : ghost.background, color: lane === key ? "#06100a" : "white", border: lane === key ? 0 : ghost.border }}>
              {name}
            </button>
          ))}
        </div>
      </section>

      {status ? <section style={panel}><div style={label}>No Active Triggers</div><p style={{ color: "#cbd5e1" }}>{status}</p></section> : null}
      {!status && !filtered.length ? <section style={panel}><div style={label}>Lane Empty</div><p style={{ color: "#cbd5e1" }}>No alerts in this lane.</p></section> : null}

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 18 }}>
        {filtered.map((row, index) => <AlertCard key={`${idOf(row, index)}-${index}`} row={row} index={index} />)}
      </section>
    </VaultForgeCommandShell>
  );
}
