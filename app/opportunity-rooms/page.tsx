"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import VaultForgeMemberNav from "../components/VaultForgeMemberNav";

type Row = Record<string, any>;

const folders = [
  ["active", "Active"],
  ["hot", "Hot"],
  ["underwrite", "Underwrite"],
  ["needs-buyer", "Needs Buyer"],
  ["needs-capital", "Needs Capital"],
  ["needs-operator", "Needs Operator"],
  ["routed", "Routed"],
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
  for (const key of keys) {
    const value = row?.[key];
    if (value !== null && value !== undefined && value !== "") return value;
  }
  return "";
}

function titleOf(row: Row) {
  return clean(valueOf(row, ["title", "deal_title", "project_title", "headline", "name", "address"])) || "Opportunity Room";
}

function idOf(row: Row) {
  return clean(valueOf(row, ["id", "deal_id", "project_id", "item_id", "room_id", "signal_id"]));
}

function stateOf(row: Row) {
  return clean(valueOf(row, ["state", "property_state", "market_state", "location_state"]));
}

function cityOf(row: Row) {
  return clean(valueOf(row, ["city", "market_city", "location_city"]));
}

function priceOf(row: Row) {
  const raw = clean(valueOf(row, ["asking_price", "price", "purchase_price", "target_price"]));
  const number = Number(raw.replace(/[^0-9.-]/g, ""));
  if (!Number.isFinite(number) || !number) return raw || "Not listed";
  return number.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function textOf(row: Row) {
  return [
    row.folder,
    row.stage,
    row.status,
    row.routing_status,
    row.room_status,
    row.deal_status,
    row.title,
    row.deal_title,
    row.summary,
    row.description,
    row.notes,
    row.needs,
    row.routing_needs,
    row.ai_summary,
    row.strategy,
  ]
    .map(lower)
    .join(" ");
}

function folderOf(row: Row) {
  const text = textOf(row);

  if (text.includes("deleted") || text.includes("trash")) return "deleted";
  if (text.includes("archived")) return "archived";
  if (text.includes("saved")) return "saved";
  if (text.includes("routed")) return "routed";
  if (text.includes("operator")) return "needs-operator";
  if (text.includes("capital") || text.includes("fund") || text.includes("lender")) return "needs-capital";
  if (text.includes("buyer")) return "needs-buyer";
  if (text.includes("underwrite") || text.includes("review")) return "underwrite";
  if (text.includes("hot") || text.includes("urgent")) return "hot";
  return "active";
}

function matchesFolder(row: Row, folder: string) {
  const f = clean(folder || "active");
  if (f === "active") return !["deleted", "archived"].includes(folderOf(row));
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
    ...(Array.isArray(data.deals) ? data.deals : []),
    ...(Array.isArray(data.projects) ? data.projects : []),
    ...(Array.isArray(data.items) ? data.items : []),
    ...(Array.isArray(data.rooms) ? data.rooms : []),
    ...(Array.isArray(data.opportunities) ? data.opportunities : []),
    ...(Array.isArray(data.saved) ? data.saved : []),
    ...(Array.isArray(data.cards) ? data.cards : []),
    ...(Array.isArray(data.data) ? data.data : []),
  ];

  if (!rows.length && data && typeof data === "object" && !Array.isArray(data)) {
    const single = data.deal || data.project || data.item || data.room || data.record;
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
    "radial-gradient(circle at top left, rgba(232,196,107,.14), transparent 28%), radial-gradient(circle at 88% 10%, rgba(56,189,248,.10), transparent 26%), linear-gradient(180deg,#020303,#071326 55%,#020303)",
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
  border: "1px solid rgba(86,216,255,.24)",
  borderRadius: 999,
  padding: "8px 11px",
  color: "#56d8ff",
  textDecoration: "none",
  background: "rgba(86,216,255,.06)",
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
      <div style={labelStyle}>{label(folder)} Opportunity</div>
      <h2 style={{ fontSize: 34, margin: "8px 0 8px", lineHeight: 1 }}>{titleOf(row)}</h2>
      <p style={{ ...muted, marginTop: 0 }}>
        {[cityOf(row), stateOf(row)].filter(Boolean).join(", ") || "Market not listed"} · {priceOf(row)}
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "12px 0" }}>
        <span style={pill}>{label(folder)}</span>
        {stateOf(row) ? <span style={pill}>{stateOf(row)}</span> : null}
        {clean(valueOf(row, ["property_type", "asset_type", "deal_type"])) ? (
          <span style={pill}>{clean(valueOf(row, ["property_type", "asset_type", "deal_type"]))}</span>
        ) : null}
      </div>
      <Link href={id ? `/deal/detail?id=${encodeURIComponent(id)}` : "/projects"} style={button}>
        Open Room
      </Link>
    </article>
  );
}

export default function OpportunityRoomsPage() {
  const [folder, setFolder] = useState("active");
  const [rows, setRows] = useState<Row[]>([]);
  const [status, setStatus] = useState("Loading opportunity rooms...");

  useEffect(() => {
    const current = getQueryFolder();
    setFolder(current);

    async function load() {
      setStatus("Loading opportunity rooms...");

      const endpoints = [
        `/api/deal/feed?folder=${encodeURIComponent(current)}`,
        `/api/deal/feed`,
        `/api/projects?folder=${encodeURIComponent(current)}`,
        `/api/projects`,
        `/api/deals?folder=${encodeURIComponent(current)}`,
        `/api/deals`,
        `/api/dashboard/live`,
      ];

      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint, { cache: "no-store", credentials: "include" });
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
      setStatus("No opportunity rooms found yet. Open Projects or Submit Opportunity to create one.");
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
          title="Opportunity Rooms"
          subtitle={`Filtered by folder: ${label(folder)}`}
          active="opportunity"
        />

        <section style={card}>
          <div style={labelStyle}>Opportunity Folder</div>
          <h1 style={{ fontSize: "clamp(52px,10vw,96px)", lineHeight: .88, letterSpacing: "-.07em", margin: "10px 0 14px" }}>
            {label(folder)}.
          </h1>
          <p style={{ ...muted, fontSize: 18, margin: 0 }}>
            Showing opportunity rooms that match this folder lane.
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
            {folders.map(([key, name]) => (
              <Link
                key={key}
                href={`/opportunity-rooms?folder=${encodeURIComponent(key)}`}
                style={{
                  ...pill,
                  color: key === folder ? "#06100a" : "#56d8ff",
                  background: key === folder ? "linear-gradient(135deg,#f8e7b0,#e8c46b)" : "rgba(86,216,255,.06)",
                  borderColor: key === folder ? "rgba(232,196,107,.8)" : "rgba(86,216,255,.24)",
                }}
              >
                {name}
              </Link>
            ))}
          </div>
        </section>

        {status ? <section style={card}><p style={{ ...muted, margin: 0 }}>{status}</p></section> : null}

        {!status && !filtered.length && rows.length ? (
          <section style={card}>
            <div style={labelStyle}>Folder Empty / Showing Unstaged Rooms</div>
            <p style={{ ...muted, margin: 0 }}>
              No rooms are staged in {label(folder)} yet, so VaultForge is showing available opportunity rooms. Use room stage buttons to move rooms into folders.
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
