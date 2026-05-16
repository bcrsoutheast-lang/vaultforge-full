"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import VaultForgeMemberNav from "../components/VaultForgeMemberNav";

type Row = Record<string, any>;

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
      const localValue = clean(window.localStorage.getItem(key)).toLowerCase();
      if (localValue.includes("@")) return localValue;

      const sessionValue = clean(window.sessionStorage.getItem(key)).toLowerCase();
      if (sessionValue.includes("@")) return sessionValue;
    } catch {
      // Continue.
    }
  }

  const cookieValue = clean(readCookie("vf_email") || readCookie("vf_member_email")).toLowerCase();
  return cookieValue.includes("@") ? cookieValue : "";
}

function withEmail(url: string, email: string, folder: string) {
  const joiner = url.includes("?") ? "&" : "?";
  return `${url}${joiner}email=${encodeURIComponent(email)}&member_email=${encodeURIComponent(email)}&owner=0&folder=${encodeURIComponent(folder)}`;
}


function label(value: string) {
  return clean(value || "active")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getQueryFolder() {
  if (typeof window === "undefined") return "active";
  return clean(new URLSearchParams(window.location.search).get("folder")) || "active";
}

function valueOf(row: Row, keys: string[]) {
  const meta = row?.metadata && typeof row.metadata === "object" ? row.metadata : {};
  for (const key of keys) {
    const value = row?.[key] ?? meta?.[key];
    if (value !== null && value !== undefined && value !== "") return value;
  }
  return "";
}

function titleOf(row: Row) {
  return clean(valueOf(row, ["title", "pain_title", "problem_title", "headline", "name", "address"])) || "Pressure Room";
}

function idOf(row: Row) {
  return clean(valueOf(row, ["id", "pain_id", "request_id", "item_id", "room_id", "signal_id"]));
}

function stateOf(row: Row) {
  return clean(valueOf(row, ["state", "property_state", "market_state", "location_state", "operating_state"]));
}

function cityOf(row: Row) {
  return clean(valueOf(row, ["city", "market_city", "location_city"]));
}

function textOf(row: Row) {
  return [
    row.folder,
    row.stage,
    row.status,
    row.routing_status,
    row.room_status,
    row.pain_status,
    row.title,
    row.pain_title,
    row.problem_title,
    row.summary,
    row.description,
    row.notes,
    row.needs,
    row.routing_needs,
    row.help_requested,
    row.problem_type,
    row.pain_type,
    row.urgency,
  ]
    .map(lower)
    .join(" ");
}

function folderOf(row: Row) {
  const text = textOf(row);

  if (text.includes("deleted") || text.includes("trash")) return "deleted";
  if (text.includes("archived")) return "archived";
  if (text.includes("saved")) return "saved";
  if (text.includes("solved") || text.includes("closed")) return "solved";
  if (text.includes("routed")) return "routed";
  if (text.includes("operator") || text.includes("contractor")) return "needs-operator";
  if (text.includes("capital") || text.includes("fund") || text.includes("lender") || text.includes("gap")) return "funding-gap";
  if (text.includes("buyer")) return "needs-buyer";
  if (text.includes("urgent") || text.includes("critical") || text.includes("foreclosure") || text.includes("emergency")) return "urgent";
  return "active";
}

function matchesFolder(row: Row, folder: string) {
  const f = clean(folder || "active");
  if (f === "active") return !["deleted", "archived", "solved"].includes(folderOf(row));
  if (f === "needs-capital") return ["needs-capital", "funding-gap"].includes(folderOf(row));
  return folderOf(row) === f;
}

async function safeJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

function normalizeRows(data: any) {
  const rows = [
    ...(Array.isArray(data.pains) ? data.pains : []),
    ...(Array.isArray(data.pain_requests) ? data.pain_requests : []),
    ...(Array.isArray(data.items) ? data.items : []),
    ...(Array.isArray(data.rooms) ? data.rooms : []),
    ...(Array.isArray(data.pressure_rooms) ? data.pressure_rooms : []),
    ...(Array.isArray(data.requests) ? data.requests : []),
    ...(Array.isArray(data.cards) ? data.cards : []),
    ...(Array.isArray(data.data) ? data.data : []),
    ...(Array.isArray(data.feed) ? data.feed : []),
    ...(Array.isArray(data.results) ? data.results : []),
    ...(Array.isArray(data.rows) ? data.rows : []),
  ];

  if (!rows.length && data && typeof data === "object" && !Array.isArray(data)) {
    const single = data.pain || data.record || data.item || data.room;
    if (single) rows.push(single);
  }

  const byId = new Map<string, Row>();
  rows.forEach((row: Row, index: number) => {
    const id = idOf(row) || `${titleOf(row)}-${index}`;
    byId.set(id, row);
  });

  return Array.from(byId.values());
}

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(232,196,107,.14), transparent 28%), radial-gradient(circle at 88% 10%, rgba(248,113,113,.10), transparent 26%), linear-gradient(180deg,#020303,#071326 55%,#020303)",
  color: "white",
  padding: "22px 16px 96px",
  fontFamily: "Arial, sans-serif",
};

const wrap: React.CSSProperties = { width: "min(1180px,100%)", margin: "0 auto" };

const card: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.24)",
  borderRadius: 28,
  padding: 22,
  background: "linear-gradient(145deg,rgba(255,255,255,.070),rgba(255,255,255,.030))",
  boxShadow: "0 28px 86px rgba(0,0,0,.30)",
  marginBottom: 18,
};

const labelStyle: React.CSSProperties = {
  color: "#e8c46b",
  letterSpacing: ".16em",
  textTransform: "uppercase",
  fontWeight: 950,
  fontSize: 11,
};

const muted: React.CSSProperties = { color: "#cbd5e1", lineHeight: 1.55 };

const pill: React.CSSProperties = {
  border: "1px solid rgba(248,113,113,.24)",
  borderRadius: 999,
  padding: "8px 11px",
  color: "#fecaca",
  textDecoration: "none",
  background: "rgba(248,113,113,.06)",
  fontWeight: 900,
  fontSize: 13,
};

const button: React.CSSProperties = {
  minHeight: 44,
  borderRadius: 999,
  padding: "10px 14px",
  background: "linear-gradient(135deg,#f8e7b0,#e8c46b)",
  color: "#06100a",
  fontWeight: 950,
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};

function RoomCard({ row }: { row: Row }) {
  const id = idOf(row);
  const folder = folderOf(row);

  return (
    <article style={card}>
      <div style={labelStyle}>{label(folder)} Pressure</div>
      <h2 style={{ fontSize: 34, margin: "8px 0 8px", lineHeight: 1 }}>{titleOf(row)}</h2>
      <p style={{ ...muted, marginTop: 0 }}>
        {[cityOf(row), stateOf(row)].filter(Boolean).join(", ") || "Market not listed"} · {clean(valueOf(row, ["urgency", "priority", "timeline_pressure"])) || "Open"}
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "12px 0" }}>
        <span style={pill}>{label(folder)}</span>
        {stateOf(row) ? <span style={pill}>{stateOf(row)}</span> : null}
        {clean(valueOf(row, ["problem_type", "pain_type", "asset_type", "property_type"])) ? (
          <span style={pill}>{clean(valueOf(row, ["problem_type", "pain_type", "asset_type", "property_type"]))}</span>
        ) : null}
      </div>
      <Link href={id ? `/pain-room/${encodeURIComponent(id)}` : "/pain-feed"} style={button}>
        Open Room
      </Link>
    </article>
  );
}

export default function PressureRoomsPage() {
  const [folder, setFolder] = useState("active");
  const [rows, setRows] = useState<Row[]>([]);
  const [status, setStatus] = useState("Loading pressure rooms...");

  useEffect(() => {
    const current = getQueryFolder();
    setFolder(current);

    async function load() {
      setStatus("Loading pressure rooms...");

      const viewer = getEmail();

      const endpoints = [
        withEmail(`/api/pain/feed`, viewer, current),
        withEmail(`/api/pressure/feed`, viewer, current),
        withEmail(`/api/dashboard/live`, viewer, current),
        `/api/pain/feed?folder=${encodeURIComponent(current)}&email=${encodeURIComponent(viewer)}&owner=0`,
        `/api/pain/feed?email=${encodeURIComponent(viewer)}&owner=0`,
        `/api/pain/feed?folder=${encodeURIComponent(current)}`,
        `/api/pain/feed`,
        `/api/pressure/feed?folder=${encodeURIComponent(current)}`,
        `/api/pressure/feed`,
      ];

      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint, {
            cache: "no-store",
            credentials: "include",
            headers: {
              "x-vf-email": getEmail(),
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
      setStatus("No pressure rooms found from the room feeds yet. Open Pain Feed to view existing pressure cards while feed mapping is finalized.");
    }

    load();
  }, []);

  const filtered = useMemo(() => rows.filter((row) => matchesFolder(row, folder)), [rows, folder]);
  const shown = filtered.length ? filtered : rows;

  return (
    <main style={page}>
      <style>{`
        a:hover { transform: translateY(-1px); transition: all .18s ease; filter: brightness(1.06); }
        @media(max-width:760px){ .vf-grid { grid-template-columns:1fr !important; } }
      `}</style>

      <div style={wrap}>
        <VaultForgeMemberNav
          title="Pressure Rooms"
          subtitle={`Filtered by folder: ${label(folder)}`}
          active="pressure"
        />

        <section style={card}>
          <div style={labelStyle}>Pressure Folder</div>
          <h1 style={{ fontSize: "clamp(52px,10vw,96px)", lineHeight: .88, letterSpacing: "-.07em", margin: "10px 0 14px" }}>
            {label(folder)}.
          </h1>
          <p style={{ ...muted, fontSize: 18, margin: 0 }}>
            Showing pressure rooms that match this folder lane.
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
            {folders.map(([key, name]) => (
              <a
                key={key}
                href={`/pressure-rooms?folder=${encodeURIComponent(key)}`}
                style={{
                  ...pill,
                  color: key === folder ? "#06100a" : "#fecaca",
                  background: key === folder ? "linear-gradient(135deg,#f8e7b0,#e8c46b)" : "rgba(248,113,113,.06)",
                  borderColor: key === folder ? "rgba(232,196,107,.8)" : "rgba(248,113,113,.24)",
                }}
              >
                {name}
              </a>
            ))}
          </div>
        </section>

        {status ? (
          <section style={card}>
            <p style={{ ...muted, margin: 0 }}>{status}</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 14 }}>
              <Link href="/pain-feed" style={button}>Open Pain Feed</Link>
              <Link href="/pain" style={button}>Submit Pain</Link>
            </div>
          </section>
        ) : null}

        {!status && !filtered.length && rows.length ? (
          <section style={card}>
            <div style={labelStyle}>Folder Empty / Showing Unstaged Rooms</div>
            <p style={{ ...muted, margin: 0 }}>
              No rooms are staged in {label(folder)} yet, so VaultForge is showing available pressure rooms. Use room stage buttons to move rooms into folders.
            </p>
          </section>
        ) : null}

        <section className="vf-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 16 }}>
          {shown.map((row, index) => (
            <RoomCard key={`${idOf(row) || titleOf(row)}-${index}`} row={row} />
          ))}
        </section>
      </div>
    </main>
  );
}
