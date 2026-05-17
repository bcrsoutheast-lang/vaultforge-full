"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import VaultForgeCommandShell from "../components/VaultForgeCommandShell";
import { roomActionStatus } from "../lib/vaultforgeRoomState";

type Room = Record<string, any>;

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

function meta(row: Room) {
  return row && typeof row.metadata === "object" && row.metadata ? row.metadata : {};
}

function idOf(row: Room, index = 0) {
  const m = meta(row);

  return first(
    row.id,
    row.deal_id,
    row.project_id,
    row.item_id,
    row.room_id,
    m.id,
    m.deal_id,
    m.project_id,
    m.item_id,
    `opportunity-${index}`
  );
}

function titleOf(row: Room) {
  const m = meta(row);

  return first(
    row.title,
    row.deal_title,
    row.project_title,
    row.headline,
    row.name,
    row.address,
    m.title,
    m.deal_title,
    m.project_title,
    m.address,
    "Opportunity Room"
  );
}

function summaryOf(row: Room) {
  const m = meta(row);

  return first(
    row.summary,
    row.ai_summary,
    row.description,
    row.note,
    row.notes,
    m.summary,
    m.ai_summary,
    m.description,
    "Opportunity is staged for review, routing, underwriting, buyer demand, capital fit, or operator execution."
  );
}

function marketOf(row: Room) {
  const m = meta(row);

  const city = first(row.city, m.city);
  const state = first(row.state, m.state);
  const market = first(row.market, row.city_state, m.market, m.city_state);

  if (market) return market;
  if (city && state) return `${city}, ${state}`;
  return first(city, state, "Market not listed");
}

function assetOf(row: Room) {
  const m = meta(row);
  return first(row.asset_type, row.property_type, row.type, row.deal_type, m.asset_type, m.property_type, "Asset not listed");
}

function strategyOf(row: Room) {
  const m = meta(row);
  return first(row.strategy, row.investment_strategy, row.exit_strategy, m.strategy, m.investment_strategy, "Strategy not listed");
}

function dataFolderOf(row: Room) {
  const m = meta(row);
  const text = [
    row.folder,
    row.stage,
    row.status,
    row.room_status,
    row.deal_status,
    row.project_status,
    row.needs,
    row.routing_needs,
    row.strategy,
    m.folder,
    m.stage,
    m.status,
    m.needs,
  ]
    .map(lower)
    .join(" ");

  if (text.includes("funded") || text.includes("closed")) return "closed";
  if (text.includes("routed") || text.includes("assigned")) return "routed";
  if (text.includes("operator")) return "needs-operator";
  if (text.includes("capital") || text.includes("fund") || text.includes("lender")) return "needs-capital";
  if (text.includes("buyer")) return "needs-buyer";
  if (text.includes("underwrite") || text.includes("review")) return "underwrite";
  if (text.includes("hot" ) || text.includes("urgent")) return "hot";
  return "active";
}

function folderOf(row: Room, index = 0) {
  const id = idOf(row, index);
  const action = roomActionStatus("opportunity", id);

  if (action === "saved") return "saved";
  if (action === "archived") return "archived";
  if (action === "deleted") return "deleted";

  return dataFolderOf(row);
}

function labelFor(value: string) {
  return clean(value || "active")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function normalizeRows(data: any) {
  const rows = [
    ...(Array.isArray(data.deals) ? data.deals : []),
    ...(Array.isArray(data.projects) ? data.projects : []),
    ...(Array.isArray(data.opportunities) ? data.opportunities : []),
    ...(Array.isArray(data.rooms) ? data.rooms : []),
    ...(Array.isArray(data.items) ? data.items : []),
    ...(Array.isArray(data.feed) ? data.feed : []),
    ...(Array.isArray(data.results) ? data.results : []),
    ...(Array.isArray(data.rows) ? data.rows : []),
    ...(Array.isArray(data.data) ? data.data : []),
  ];

  if (!rows.length && data && typeof data === "object" && !Array.isArray(data)) {
    const single = data.deal || data.project || data.opportunity || data.room || data.item || data.record;
    if (single) rows.push(single);
  }

  const byId = new Map<string, Room>();
  rows.forEach((row: Room, index: number) => {
    byId.set(idOf(row, index), row);
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

const panel: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.28)",
  borderRadius: 30,
  padding: 24,
  background:
    "radial-gradient(circle at top left, rgba(232,196,107,.12), transparent 36%), linear-gradient(145deg,rgba(15,23,42,.94),rgba(2,6,23,.94))",
  boxShadow: "0 24px 80px rgba(0,0,0,.34)",
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

function OpportunityCard({ row, index }: { row: Room; index: number }) {
  const id = idOf(row, index);
  const title = titleOf(row);
  const stage = folderOf(row, index);

  const messageHref =
    `/messages/new?to=${encodeURIComponent("bcrsoutheast@gmail.com")}` +
    `&subject=${encodeURIComponent(title)}` +
    `&room_title=${encodeURIComponent(title)}` +
    `&title=${encodeURIComponent(title)}` +
    `&room_type=${encodeURIComponent("Opportunity Room")}` +
    `&room_id=${encodeURIComponent(id)}` +
    `&item_id=${encodeURIComponent(id)}` +
    `&source=${encodeURIComponent("opportunity-rooms")}` +
    `&type=${encodeURIComponent("opportunity")}` +
    `&folder=${encodeURIComponent("opportunity")}` +
    `&source_route=${encodeURIComponent(`/deal/detail?id=${id}`)}`;

  return (
    <article style={panel}>
      <div style={label}>{labelFor(stage)} Opportunity</div>

      <h2
        style={{
          fontSize: "clamp(36px,7vw,72px)",
          lineHeight: 0.88,
          letterSpacing: "-.06em",
          margin: "10px 0 12px",
          overflowWrap: "anywhere",
        }}
      >
        {title}
      </h2>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
        <span style={chip}>{marketOf(row)}</span>
        <span style={chip}>{assetOf(row)}</span>
        <span style={chip}>{strategyOf(row)}</span>
        <span style={chip}>5S: {labelFor(stage)}</span>
      </div>

      <p style={{ color: "#cbd5e1", lineHeight: 1.58, marginTop: 0, fontSize: 17 }}>
        {summaryOf(row)}
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 16 }}>
        <Link href={`/deal/detail?id=${encodeURIComponent(id)}`} style={button}>
          Open Opportunity Room
        </Link>

        <Link href={messageHref} style={ghost}>
          Request Info / Intro
        </Link>

        <Link href="/routing-inbox" style={ghost}>
          Routing
        </Link>
      </div>
    </article>
  );
}

export default function OpportunityRoomsPage() {
  const [folder, setFolder] = useState("active");
  const [rooms, setRooms] = useState<Room[]>([]);
  const [status, setStatus] = useState("Loading opportunity rooms...");
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requested = clean(params.get("folder"));
    if (requested) setFolder(requested);
  }, []);

  useEffect(() => {
    const refresh = () => setRefreshTick((value) => value + 1);
    window.addEventListener("vaultforge-5s-room-change", refresh);
    return () => window.removeEventListener("vaultforge-5s-room-change", refresh);
  }, []);

  useEffect(() => {
    async function loadRooms() {
      const email = getEmail();

      const endpoints = [
        `/api/deal/feed?email=${encodeURIComponent(email)}&owner=0`,
        `/api/projects?email=${encodeURIComponent(email)}&owner=0`,
        `/api/deals?email=${encodeURIComponent(email)}&owner=0`,
      ];

      const collected: Room[] = [];

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
          const rows = normalizeRows(data);

          if (response.ok && rows.length) collected.push(...rows);
        } catch {
          // Try next endpoint.
        }
      }

      const byId = new Map<string, Room>();
      collected.forEach((row, index) => byId.set(idOf(row, index), row));
      const finalRows = Array.from(byId.values());

      setRooms(finalRows);
      setStatus(finalRows.length ? "" : "No opportunity rooms found yet. Submit an opportunity or check Projects.");
    }

    loadRooms();
  }, []);

  const filtered = useMemo(() => {
    if (folder === "active") {
      return rooms.filter((row, index) => !["saved", "archived", "deleted"].includes(folderOf(row, index)));
    }

    return rooms.filter((row, index) => folderOf(row, index) === folder);
  }, [rooms, folder, refreshTick]);

  function countFor(key: string) {
    if (key === "active") {
      return rooms.filter((row, index) => !["saved", "archived", "deleted"].includes(folderOf(row, index))).length;
    }

    return rooms.filter((row, index) => folderOf(row, index) === key).length;
  }

  return (
    <VaultForgeCommandShell
      active="opportunity"
      title="Opportunity Rooms."
      subtitle="Deal flow, upside, buyer fit, capital paths, and operator execution live here."
    >
      <section style={panel}>
        <div style={label}>VaultForge Opportunity Desk</div>

        <h2
          style={{
            fontSize: "clamp(44px,9vw,92px)",
            lineHeight: 0.85,
            letterSpacing: "-.07em",
            margin: "12px 0 16px",
          }}
        >
          5S deal-side operating lane.
        </h2>

        <p style={{ color: "#cbd5e1", lineHeight: 1.65, fontSize: 19, marginTop: 0, maxWidth: 920 }}>
          Active rooms stay in front. Saved, archived, and deleted rooms leave the main workflow so the command center stays clean.
        </p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 16 }}>
          <Link href="/submit" style={button}>Submit Opportunity</Link>
          <Link href="/projects" style={ghost}>Projects</Link>
          <Link href="/saved-rooms" style={ghost}>Saved Rooms</Link>
          <Link href="/dashboard" style={ghost}>Command</Link>
        </div>
      </section>

      <section style={panel}>
        <div style={label}>Opportunity 5S Folders</div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 14 }}>
          {folders.map(([key, name]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFolder(key)}
              style={{
                ...ghost,
                background: folder === key ? "linear-gradient(135deg,#f8e7b0,#e8c46b)" : ghost.background,
                color: folder === key ? "#06100a" : "white",
                border: folder === key ? 0 : ghost.border,
              }}
            >
              {name} ({countFor(key)})
            </button>
          ))}
        </div>
      </section>

      {status ? (
        <section style={panel}>
          <div style={label}>Empty Lane</div>
          <p style={{ color: "#cbd5e1", lineHeight: 1.55, margin: "10px 0 0" }}>{status}</p>
        </section>
      ) : null}

      {!status && !filtered.length ? (
        <section style={panel}>
          <div style={label}>Folder Empty</div>
          <p style={{ color: "#cbd5e1", lineHeight: 1.55, margin: "10px 0 0" }}>
            No opportunity rooms are staged in {labelFor(folder)}.
          </p>
        </section>
      ) : null}

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 18 }}>
        {filtered.map((row, index) => (
          <OpportunityCard key={`${idOf(row, index)}-${index}`} row={row} index={index} />
        ))}
      </section>
    </VaultForgeCommandShell>
  );
}
