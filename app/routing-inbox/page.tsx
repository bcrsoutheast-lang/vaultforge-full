"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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


type RouteRow = Record<string, any>;

function idOf(row: RouteRow, index = 0) {
  const m = meta(row);
  return first(row.signal_id, row.id, row.routing_id, row.action_id, row.item_id, m.signal_id, m.id, m.routing_id, `route-${index}`);
}

function itemIdOf(row: RouteRow, index = 0) {
  const m = meta(row);
  return first(row.item_id, row.deal_id, row.pain_id, row.project_id, m.item_id, m.deal_id, m.pain_id, `item-${index}`);
}

function titleOf(row: RouteRow) {
  const m = meta(row);
  return first(row.title, row.deal_title, row.pain_title, row.project_title, row.signal_title, row.headline, m.title, m.deal_title, m.pain_title, "Routing Path");
}

function roleOf(row: RouteRow) {
  const m = meta(row);
  return first(row.role, row.match_role, row.target_role, row.route_role, m.role, m.match_role, "Member Fit");
}

function scoreOf(row: RouteRow) {
  const m = meta(row);
  const raw = Number(first(row.score, row.match_score, row.routing_score, m.score, m.match_score));
  return Number.isFinite(raw) && raw > 0 ? Math.max(0, Math.min(100, Math.round(raw))) : 65;
}

function normalizeRows(data: any) {
  const rows = [
    ...(Array.isArray(data.routes) ? data.routes : []),
    ...(Array.isArray(data.actions) ? data.actions : []),
    ...(Array.isArray(data.routing_actions) ? data.routing_actions : []),
    ...(Array.isArray(data.items) ? data.items : []),
    ...(Array.isArray(data.rows) ? data.rows : []),
    ...(Array.isArray(data.data) ? data.data : []),
  ];

  if (!rows.length && data && typeof data === "object" && !Array.isArray(data)) {
    const single = data.route || data.action || data.record || data.item;
    if (single) rows.push(single);
  }

  return rows;
}

function RouteCard({ row, index }: { row: RouteRow; index: number }) {
  const signalId = idOf(row, index);
  const itemId = itemIdOf(row, index);
  const title = titleOf(row);

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
      <div style={label}>Member-Fit Path</div>
      <h2 style={{ fontSize: "clamp(34px,6vw,64px)", lineHeight: 0.92, letterSpacing: "-.055em", margin: "10px 0 12px", overflowWrap: "anywhere" }}>{title}</h2>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
        <span style={chip}>{roleOf(row)}</span>
        <span style={chip}>Score {scoreOf(row)}</span>
        <span style={chip}>Item: {itemId}</span>
      </div>
      <p style={{ color: "#cbd5e1", lineHeight: 1.55, marginTop: 0 }}>Routing shows who fits, why they fit, and what intro path should happen next.</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 16 }}>
        <Link href={`/routing-room/${encodeURIComponent(signalId)}`} style={button}>Open Routing Room</Link>
        <Link href={`/deal/detail?id=${encodeURIComponent(itemId)}`} style={ghost}>Open Source Room</Link>
        <Link href={messageHref} style={ghost}>Request Info / Intro</Link>
      </div>
    </article>
  );
}

export default function RoutingInboxPage() {
  const [routes, setRoutes] = useState<RouteRow[]>([]);
  const [status, setStatus] = useState("Loading routing paths...");

  useEffect(() => {
    async function loadRoutes() {
      const email = getEmail();
      const endpoints = [
        `/api/routing/actions?email=${encodeURIComponent(email)}&owner=0`,
        `/api/routing/generate?email=${encodeURIComponent(email)}&owner=0`,
      ];

      const collected: RouteRow[] = [];

      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint, { cache: "no-store", credentials: "include", headers: { "x-vf-email": email, "x-vf-admin": "0" } });
          const data = await safeJson(response);
          const rows = normalizeRows(data);
          if (response.ok && rows.length) collected.push(...rows);
        } catch {}
      }

      setRoutes(collected);
      setStatus(collected.length ? "" : "No routing paths found yet. Routing will populate when opportunities or pressure rooms generate member-fit paths.");
    }

    loadRoutes();
  }, []);

  return (
    <VaultForgeCommandShell active="routing" title="Routing Queue." subtitle="Member-fit paths, intro opportunities, and execution lanes live here.">
      <section style={panel}>
        <div style={label}>VaultForge Routing Center</div>
        <h2 style={{ fontSize: "clamp(42px,8vw,82px)", lineHeight: 0.9, letterSpacing: "-.06em", margin: "12px 0 16px" }}>Execution coordination lane.</h2>
        <p style={{ color: "#cbd5e1", lineHeight: 1.65, fontSize: 19, marginTop: 0, maxWidth: 920 }}>Routing is not the deal room. Routing shows member-fit paths and intro logic.</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 16 }}>
          <Link href="/introductions" style={button}>Introductions</Link>
          <Link href="/message-command" style={ghost}>Messages</Link>
          <Link href="/dashboard" style={ghost}>Command</Link>
        </div>
      </section>

      {status ? <section style={panel}><div style={label}>Empty Routing Queue</div><p style={{ color: "#cbd5e1" }}>{status}</p></section> : null}

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 18 }}>
        {routes.map((row, index) => <RouteCard key={`${idOf(row, index)}-${index}`} row={row} index={index} />)}
      </section>
    </VaultForgeCommandShell>
  );
}
