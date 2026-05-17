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


type Pressure = Record<string, any>;

const folders = [
  ["active", "Active"],
  ["urgent", "Urgent"],
  ["funding-gap", "Funding Gap"],
  ["needs-buyer", "Needs Buyer"],
  ["needs-capital", "Needs Capital"],
  ["needs-operator", "Needs Operator"],
  ["routed", "Routed"],
  ["solved", "Solved"],
  ["saved", "Saved"],
  ["archived", "Archived"],
  ["deleted", "Deleted"],
];

function idOf(row: Pressure, index = 0) {
  const m = meta(row);
  return first(row.id, row.pain_id, row.item_id, row.room_id, m.id, m.pain_id, m.item_id, `pressure-${index}`);
}

function titleOf(row: Pressure) {
  const m = meta(row);
  return first(row.title, row.pain_title, row.problem_title, row.headline, row.address, m.title, m.pain_title, m.address, "Pressure Room");
}

function summaryOf(row: Pressure) {
  const m = meta(row);
  return first(row.summary, row.ai_summary, row.description, row.note, row.notes, m.summary, m.ai_summary, "Pressure is staged for problem-solving, routing, capital, buyer demand, operator help, or owner review.");
}

function marketOf(row: Pressure) {
  const m = meta(row);
  const city = first(row.city, m.city);
  const state = first(row.state, m.state);
  const market = first(row.market, row.city_state, m.market, m.city_state);
  if (market) return market;
  if (city && state) return `${city}, ${state}`;
  return first(city, state, "Market not listed");
}

function typeOf(row: Pressure) {
  const m = meta(row);
  return first(row.problem_type, row.pain_type, row.asset_type, row.property_type, row.type, m.problem_type, m.pain_type, "Pressure type not listed");
}

function folderOf(row: Pressure) {
  const m = meta(row);
  const text = [
    row.folder, row.stage, row.status, row.problem_type, row.pain_type, row.urgency,
    row.needs, row.routing_needs, m.folder, m.stage, m.status, m.needs
  ].map(lower).join(" ");

  if (text.includes("deleted") || text.includes("trash")) return "deleted";
  if (text.includes("archived")) return "archived";
  if (text.includes("saved")) return "saved";
  if (text.includes("solved") || text.includes("resolved")) return "solved";
  if (text.includes("routed")) return "routed";
  if (text.includes("operator")) return "needs-operator";
  if (text.includes("capital") || text.includes("fund") || text.includes("lender")) return "needs-capital";
  if (text.includes("buyer")) return "needs-buyer";
  if (text.includes("funding gap")) return "funding-gap";
  if (text.includes("urgent") || text.includes("critical")) return "urgent";
  return "active";
}

function labelFor(value: string) {
  return clean(value || "active").replace(/[-_]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function normalizeRows(data: any) {
  const rows = [
    ...(Array.isArray(data.pains) ? data.pains : []),
    ...(Array.isArray(data.pressures) ? data.pressures : []),
    ...(Array.isArray(data.pain_requests) ? data.pain_requests : []),
    ...(Array.isArray(data.items) ? data.items : []),
    ...(Array.isArray(data.feed) ? data.feed : []),
    ...(Array.isArray(data.results) ? data.results : []),
    ...(Array.isArray(data.rows) ? data.rows : []),
    ...(Array.isArray(data.data) ? data.data : []),
  ];

  if (!rows.length && data && typeof data === "object" && !Array.isArray(data)) {
    const single = data.pain || data.pressure || data.record || data.item;
    if (single) rows.push(single);
  }

  const byId = new Map<string, Pressure>();
  rows.forEach((row: Pressure, index: number) => byId.set(idOf(row, index), row));
  return Array.from(byId.values());
}

function PressureCard({ row, index }: { row: Pressure; index: number }) {
  const id = idOf(row, index);
  const title = titleOf(row);

  const messageHref =
    `/messages/new?to=${encodeURIComponent("bcrsoutheast@gmail.com")}` +
    `&subject=${encodeURIComponent(title)}` +
    `&room_title=${encodeURIComponent(title)}` +
    `&title=${encodeURIComponent(title)}` +
    `&room_type=${encodeURIComponent("Pressure Room")}` +
    `&room_id=${encodeURIComponent(id)}` +
    `&item_id=${encodeURIComponent(id)}` +
    `&source=${encodeURIComponent("pressure-rooms")}` +
    `&type=${encodeURIComponent("pressure")}` +
    `&folder=${encodeURIComponent("pressure")}` +
    `&source_route=${encodeURIComponent(`/pain-room/${id}`)}`;

  return (
    <article style={panel}>
      <div style={label}>{labelFor(folderOf(row))} Pressure</div>
      <h2 style={{ fontSize: "clamp(34px,6vw,64px)", lineHeight: 0.92, letterSpacing: "-.055em", margin: "10px 0 12px", overflowWrap: "anywhere" }}>
        {title}
      </h2>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
        <span style={chip}>{marketOf(row)}</span>
        <span style={chip}>{typeOf(row)}</span>
      </div>
      <p style={{ color: "#cbd5e1", lineHeight: 1.55, marginTop: 0 }}>{summaryOf(row)}</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 16 }}>
        <Link href={`/pain-room/${encodeURIComponent(id)}`} style={button}>Open Pressure Room</Link>
        <Link href={messageHref} style={ghost}>Request Info / Intro</Link>
        <Link href="/routing-inbox" style={ghost}>Routing</Link>
      </div>
    </article>
  );
}

export default function PressureRoomsPage() {
  const [folder, setFolder] = useState("active");
  const [rooms, setRooms] = useState<Pressure[]>([]);
  const [status, setStatus] = useState("Loading pressure rooms...");

  useEffect(() => {
    const requested = clean(new URLSearchParams(window.location.search).get("folder"));
    if (requested) setFolder(requested);
  }, []);

  useEffect(() => {
    async function loadRooms() {
      const email = getEmail();
      const endpoints = [
        `/api/pain/feed?email=${encodeURIComponent(email)}&owner=0`,
        `/api/pain/rooms?email=${encodeURIComponent(email)}&owner=0`,
      ];

      const collected: Pressure[] = [];

      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint, { cache: "no-store", credentials: "include", headers: { "x-vf-email": email, "x-vf-admin": "0" } });
          const data = await safeJson(response);
          const rows = normalizeRows(data);
          if (response.ok && rows.length) collected.push(...rows);
        } catch {}
      }

      const byId = new Map<string, Pressure>();
      collected.forEach((row, index) => byId.set(idOf(row, index), row));
      const finalRows = Array.from(byId.values());

      setRooms(finalRows);
      setStatus(finalRows.length ? "" : "No pressure rooms found yet. Submit Pain or check Pain Feed.");
    }

    loadRooms();
  }, []);

  const filtered = useMemo(() => {
    if (folder === "active") return rooms.filter((row) => !["archived", "deleted"].includes(folderOf(row)));
    return rooms.filter((row) => folderOf(row) === folder);
  }, [rooms, folder]);

  return (
    <VaultForgeCommandShell active="pressure" title="Pressure Rooms." subtitle="Pain, problems, funding gaps, stalled projects, and urgent execution signals live here.">
      <section style={panel}>
        <div style={label}>VaultForge Pressure Desk</div>
        <h2 style={{ fontSize: "clamp(42px,8vw,82px)", lineHeight: 0.9, letterSpacing: "-.06em", margin: "12px 0 16px" }}>
          Problem-solving operating lane.
        </h2>
        <p style={{ color: "#cbd5e1", lineHeight: 1.65, fontSize: 19, marginTop: 0, maxWidth: 920 }}>
          Pain and pressure submissions live here as Pressure Rooms. Dashboard stays clean; the problem cards sit inside this lane.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 16 }}>
          <Link href="/pain" style={button}>Submit Pain</Link>
          <Link href="/pain-feed" style={ghost}>Pain Feed</Link>
          <Link href="/archived-rooms" style={ghost}>Archived Rooms</Link>
          <Link href="/dashboard" style={ghost}>Command</Link>
        </div>
      </section>

      <section style={panel}>
        <div style={label}>Pressure Folders</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 14 }}>
          {folders.map(([key, name]) => (
            <button key={key} type="button" onClick={() => setFolder(key)} style={{ ...ghost, background: folder === key ? "linear-gradient(135deg,#f8e7b0,#e8c46b)" : ghost.background, color: folder === key ? "#06100a" : "white", border: folder === key ? 0 : ghost.border }}>
              {name} ({key === "active" ? rooms.filter((row) => !["archived", "deleted"].includes(folderOf(row))).length : rooms.filter((row) => folderOf(row) === key).length})
            </button>
          ))}
        </div>
      </section>

      {status ? <section style={panel}><div style={label}>Empty Lane</div><p style={{ color: "#cbd5e1" }}>{status}</p></section> : null}
      {!status && !filtered.length ? <section style={panel}><div style={label}>Folder Empty</div><p style={{ color: "#cbd5e1" }}>No pressure rooms are staged in {labelFor(folder)} yet.</p></section> : null}

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 18 }}>
        {filtered.map((row, index) => <PressureCard key={`${idOf(row, index)}-${index}`} row={row} index={index} />)}
      </section>
    </VaultForgeCommandShell>
  );
}
