"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import VaultForgeCommandShell from "../components/VaultForgeCommandShell";
import VaultForgePressureActions from "../components/VaultForgePressureActions";

type Pain = Record<string, any>;
type Folder = "active" | "saved" | "archived" | "deleted";

const folders: Array<[Folder, string]> = [
  ["active", "Active"],
  ["saved", "Saved"],
  ["archived", "Archived"],
  ["deleted", "Hidden"],
];

function clean(value: unknown) {
  return String(value || "").trim();
}

function first(...values: unknown[]) {
  for (const value of values) {
    if (Array.isArray(value)) {
      const found = value.find((item) => clean(item));
      if (found !== undefined) return clean(found);
      continue;
    }
    if (value && typeof value === "object") continue;
    const text = clean(value);
    if (text) return text;
  }
  return "";
}

function meta(row: Pain) {
  return row && typeof row.metadata === "object" && row.metadata ? row.metadata : {};
}

function field(row: Pain, ...keys: string[]) {
  const m = meta(row);
  const values: unknown[] = [];
  for (const key of keys) values.push(row?.[key], m?.[key]);
  return first(...values);
}

function idOf(row: Pain, index = 0) {
  return field(row, "id", "pain_id", "request_id", "signal_id", "item_id", "room_id", "canonical_event_id") || `pressure-${index}`;
}

function titleOf(row: Pain) {
  return field(row, "title", "pain_title", "problem_title", "headline", "name", "address") || "Pressure Room";
}

function summaryOf(row: Pain) {
  return (
    field(row, "ai_summary", "summary", "route_summary", "routing_summary", "description", "note", "notes", "seller_situation") ||
    "Pressure room staged for problem solving, routing, capital, operator help, or rescue execution."
  );
}

function market(row: Pain) {
  const city = field(row, "city", "area");
  const county = field(row, "county");
  const state = field(row, "state");
  const direct = field(row, "market", "city_state", "location");
  if (direct) return direct;
  return [city, county, state].filter(Boolean).join(", ") || "Market not listed";
}

function pressureType(row: Pain) {
  return field(row, "pain_type", "problem_type", "asset_type", "property_type", "deal_type", "type") || "Pressure";
}

function urgency(row: Pain) {
  return field(row, "urgency", "priority", "timeline", "status", "stage") || "Review";
}

function readEmail() {
  if (typeof window === "undefined") return "";
  for (const key of ["vf_email", "vf_member_email", "memberEmail", "email"]) {
    try {
      const value = clean(window.localStorage.getItem(key));
      if (value.includes("@")) return value.toLowerCase();
    } catch {}
  }
  const match =
    document.cookie.match(/(?:^|;\s*)vf_email=([^;]+)/) ||
    document.cookie.match(/(?:^|;\s*)vf_member_email=([^;]+)/);
  if (match) {
    try { return decodeURIComponent(match[1] || "").toLowerCase(); } catch { return String(match[1] || "").toLowerCase(); }
  }
  return "guest@vaultforge.local";
}

async function safeJson(response: Response) {
  try { return await response.json(); } catch { return {}; }
}

const panel: React.CSSProperties = {
  border: "1px solid rgba(248,113,113,.30)",
  borderRadius: 34,
  padding: 24,
  background: "radial-gradient(circle at top left, rgba(248,113,113,.13), transparent 34%), linear-gradient(145deg,rgba(15,23,42,.97),rgba(2,6,23,.98))",
  boxShadow: "0 28px 90px rgba(0,0,0,.36)",
};

const label: React.CSSProperties = {
  color: "#fb7185",
  letterSpacing: ".2em",
  textTransform: "uppercase",
  fontWeight: 950,
  fontSize: 12,
};

const chip: React.CSSProperties = {
  border: "1px solid rgba(248,113,113,.28)",
  borderRadius: 999,
  padding: "7px 10px",
  color: "#fecaca",
  background: "rgba(248,113,113,.08)",
  fontWeight: 900,
  fontSize: 12,
};

const btn: React.CSSProperties = {
  minHeight: 48,
  borderRadius: 999,
  padding: "12px 16px",
  border: 0,
  background: "linear-gradient(135deg,#fecaca,#fb7185)",
  color: "#21070a",
  fontWeight: 950,
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
};

const ghost: React.CSSProperties = {
  ...btn,
  background: "rgba(255,255,255,.06)",
  color: "white",
  border: "1px solid rgba(255,255,255,.16)",
};

function PressureCard({ row, index, status, onChanged }: { row: Pain; index: number; status: Folder; onChanged: () => void }) {
  const id = idOf(row, index);
  const title = titleOf(row);
  const route = `/pain-room/${encodeURIComponent(id)}`;

  return (
    <article style={panel}>
      <div style={label}>Pressure Command Room</div>
      <h2 style={{ fontSize: "clamp(36px,7vw,70px)", lineHeight: 0.86, letterSpacing: "-.065em", margin: "10px 0", overflowWrap: "anywhere" }}>
        {title}
      </h2>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
        <span style={chip}>{market(row)}</span>
        <span style={chip}>{pressureType(row)}</span>
        <span style={chip}>{urgency(row)}</span>
        <span style={chip}>Status: {status === "deleted" ? "Hidden" : status}</span>
      </div>
      <p style={{ color: "#cbd5e1", lineHeight: 1.6, fontSize: 16 }}>{summaryOf(row)}</p>
      <VaultForgePressureActions roomId={id} roomTitle={title} sourceRoute={route} status={status} variant="card" onChanged={onChanged} />
    </article>
  );
}

export default function PressureRoomsPage() {
  const [rows, setRows] = useState<Pain[]>([]);
  const [folder, setFolder] = useState<Folder>("active");
  const [roomStatus, setRoomStatus] = useState<Record<string, Folder>>({});
  const [status, setStatus] = useState("Loading pressure rooms...");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requested = params.get("folder") as Folder | null;
    if (requested && ["active", "saved", "archived", "deleted"].includes(requested)) setFolder(requested);
  }, []);

  useEffect(() => {
    async function loadStatuses() {
      const email = readEmail();
      const response = await fetch(`/api/room/status?room_type=pressure&email=${encodeURIComponent(email)}`, {
        cache: "no-store",
        headers: { "x-vf-email": email },
      });
      const data = await safeJson(response);
      const next: Record<string, Folder> = {};
      if (data?.rooms && typeof data.rooms === "object") {
        for (const [id, row] of Object.entries<any>(data.rooms)) {
          const value = String(row?.status || "active") as Folder;
          if (["active", "saved", "archived", "deleted"].includes(value)) next[id] = value;
        }
      }
      setRoomStatus(next);
    }
    loadStatuses();
  }, [reloadKey]);

  useEffect(() => {
    async function load() {
      const endpoints = ["/api/pain/feed", "/api/pain/rooms"];
      const collected: Pain[] = [];
      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint, { cache: "no-store", credentials: "include" });
          const data = await safeJson(response);
          collected.push(
            ...(Array.isArray(data.pains) ? data.pains : []),
            ...(Array.isArray(data.pressures) ? data.pressures : []),
            ...(Array.isArray(data.pain_requests) ? data.pain_requests : []),
            ...(Array.isArray(data.rooms) ? data.rooms : []),
            ...(Array.isArray(data.feed) ? data.feed : []),
            ...(Array.isArray(data.items) ? data.items : []),
            ...(Array.isArray(data.rows) ? data.rows : []),
            ...(Array.isArray(data.data) ? data.data : [])
          );
        } catch {}
      }
      const map = new Map<string, Pain>();
      collected.forEach((row, index) => {
        const id = idOf(row, index);
        if (!map.has(id)) map.set(id, row);
      });
      const finalRows = Array.from(map.values());
      setRows(finalRows);
      setStatus(finalRows.length ? "" : "No pressure rooms found yet.");
    }
    load();
  }, []);

  function statusFor(row: Pain, index: number): Folder {
    return roomStatus[idOf(row, index)] || "active";
  }

  const filtered = useMemo(() => rows.filter((row, index) => statusFor(row, index) === folder), [rows, folder, roomStatus]);

  function countFor(nextFolder: Folder) {
    return rows.filter((row, index) => statusFor(row, index) === nextFolder).length;
  }

  const folderTitle = folder === "deleted" ? "Hidden" : folder[0].toUpperCase() + folder.slice(1);

  return (
    <VaultForgeCommandShell active="pressure" title="Pressure command rooms." subtitle="Problems, distress, gaps, and execution pressure routed into clean operating rooms.">
      <section style={panel}>
        <div style={label}>VaultForge Pressure Workstation</div>
        <h1 style={{ fontSize: "clamp(50px,10vw,108px)", lineHeight: 0.82, letterSpacing: "-.08em", margin: "12px 0" }}>
          {folderTitle} pressure rooms.
        </h1>
        <p style={{ color: "#cbd5e1", fontSize: 20, lineHeight: 1.6, maxWidth: 950 }}>
          Pressure rooms are database-backed. Save, archive, or hide a pressure room and it moves out of Active.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 18 }}>
          {folders.map(([key, name]) => (
            <button key={key} type="button" onClick={() => setFolder(key)} style={{ ...(folder === key ? btn : ghost), minWidth: 128 }}>
              {name} ({countFor(key)})
            </button>
          ))}
          <button type="button" onClick={() => setReloadKey((value) => value + 1)} style={ghost}>Refresh</button>
          <Link href="/pain" style={ghost}>Submit Pain</Link>
          <Link href="/dashboard" style={ghost}>Dashboard</Link>
        </div>
      </section>

      {status ? <section style={panel}><div style={label}>Status</div><p style={{ color: "#cbd5e1", lineHeight: 1.6, fontSize: 18 }}>{status}</p></section> : null}

      {!status && !filtered.length ? (
        <section style={panel}>
          <div style={label}>{folderTitle} Folder Clean</div>
          <h2 style={{ fontSize: "clamp(34px,7vw,70px)", lineHeight: 0.9, letterSpacing: "-.06em", margin: "10px 0" }}>Nothing here.</h2>
          <p style={{ color: "#cbd5e1", lineHeight: 1.6 }}>This folder is clean. Active pressure rooms are not shown inside Saved, Archived, or Hidden.</p>
        </section>
      ) : null}

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 18 }}>
        {filtered.map((row, index) => (
          <PressureCard key={`${idOf(row, index)}-${index}`} row={row} index={index} status={statusFor(row, index)} onChanged={() => setReloadKey((value) => value + 1)} />
        ))}
      </section>
    </VaultForgeCommandShell>
  );
}
