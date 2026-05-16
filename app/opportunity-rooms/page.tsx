"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Room = Record<string, any>;

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

function idOf(row: Room, index = 0) {
  const m = meta(row);
  return first(row.id, row.deal_id, row.project_id, row.item_id, row.room_id, row.signal_id, m.id, m.deal_id, m.item_id, `opportunity-${index}`);
}

function titleOf(row: Room) {
  const m = meta(row);
  return first(row.title, row.deal_title, row.project_title, row.headline, row.name, row.address, m.title, m.deal_title, "Opportunity Room");
}

function summaryOf(row: Room) {
  const m = meta(row);
  return first(row.summary, row.ai_summary, row.description, row.note, row.notes, m.summary, m.ai_summary, "Opportunity is ready for review inside this operating lane.");
}

function folderOf(row: Room) {
  const m = meta(row);
  const text = [
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

function label(value: string) {
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

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(232,196,107,.13), transparent 30%), radial-gradient(circle at 88% 8%, rgba(56,189,248,.12), transparent 26%), linear-gradient(180deg,#020617,#071326 55%,#020617)",
  color: "white",
  padding: "22px 16px 96px",
  fontFamily: "Arial, sans-serif",
};

const wrap: React.CSSProperties = {
  width: "min(1180px,100%)",
  margin: "0 auto",
};

const panel: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.22)",
  borderRadius: 30,
  padding: 24,
  background: "linear-gradient(145deg,rgba(255,255,255,.070),rgba(255,255,255,.030))",
  boxShadow: "0 28px 86px rgba(0,0,0,.30)",
  marginBottom: 20,
};

const labelStyle: React.CSSProperties = {
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
};

const ghost: React.CSSProperties = {
  ...button,
  background: "rgba(255,255,255,.06)",
  border: "1px solid rgba(255,255,255,.16)",
  color: "white",
};

function RoomCard({ row, index }: { row: Room; index: number }) {
  const id = idOf(row, index);

  return (
    <article style={panel}>
      <div style={labelStyle}>{label(folderOf(row))} Opportunity</div>

      <h2
        style={{
          fontSize: "clamp(34px,5vw,56px)",
          lineHeight: 0.95,
          letterSpacing: "-.05em",
          margin: "10px 0 12px",
        }}
      >
        {titleOf(row)}
      </h2>

      <p style={{ color: "#cbd5e1", lineHeight: 1.55, marginTop: 0 }}>
        {summaryOf(row)}
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 16 }}>
        <Link href={`/deal/detail?id=${encodeURIComponent(id)}`} style={button}>
          Open Room
        </Link>

        <Link href="/dashboard" style={ghost}>
          Back To Command
        </Link>
      </div>
    </article>
  );
}

export default function OpportunityRoomsPage() {
  const [folder, setFolder] = useState("active");
  const [rooms, setRooms] = useState<Room[]>([]);
  const [status, setStatus] = useState("Loading opportunity rooms...");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setFolder(clean(params.get("folder")) || "active");
  }, []);

  useEffect(() => {
    async function loadRooms() {
      const email = getEmail();

      const endpoints = [
        `/api/deal/feed?email=${encodeURIComponent(email)}&owner=0`,
        `/api/projects?email=${encodeURIComponent(email)}&owner=0`,
        `/api/deals?email=${encodeURIComponent(email)}&owner=0`,
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
          const rows = normalizeRows(data);

          if (response.ok && rows.length) {
            setRooms(rows);
            setStatus("");
            return;
          }
        } catch {
          // Try next.
        }
      }

      setRooms([]);
      setStatus("No opportunity rooms found yet. Submit an opportunity or check Projects.");
    }

    loadRooms();
  }, []);

  const filtered = useMemo(() => {
    const matches = rooms.filter((row) => {
      if (folder === "active") return !["archived", "deleted"].includes(folderOf(row));
      return folderOf(row) === folder;
    });

    return matches.length ? matches : rooms;
  }, [rooms, folder]);

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
        }
      `}</style>

      <div style={wrap}>
        <section style={panel}>
          <div style={labelStyle}>VaultForge Opportunity Desk</div>

          <h1
            style={{
              fontSize: "clamp(54px,10vw,104px)",
              lineHeight: 0.88,
              letterSpacing: "-.075em",
              margin: "12px 0 18px",
            }}
          >
            Opportunity Rooms.
          </h1>

          <p style={{ color: "#cbd5e1", lineHeight: 1.65, fontSize: 20, marginTop: 0 }}>
            Dedicated opportunity lane. This page does not redirect back to Dashboard. Select a folder or open a room.
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 16 }}>
            <Link href="/dashboard" style={button}>Back To Command</Link>
            <Link href="/submit" style={ghost}>Submit Opportunity</Link>
            <Link href="/projects" style={ghost}>Projects</Link>
          </div>
        </section>

        <section style={panel}>
          <div style={labelStyle}>Opportunity Folders</div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 14 }}>
            {folders.map(([key, name]) => (
              <button
                key={key}
                type="button"
                onClick={() => setFolder(key)}
                style={{
                  ...ghost,
                  background: key === folder ? "linear-gradient(135deg,#f8e7b0,#e8c46b)" : ghost.background,
                  color: key === folder ? "#06100a" : "white",
                  border: key === folder ? 0 : ghost.border,
                }}
              >
                {name}
              </button>
            ))}
          </div>
        </section>

        {status ? (
          <section style={panel}>
            <p style={{ color: "#cbd5e1", lineHeight: 1.55, margin: 0 }}>{status}</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 14 }}>
              <Link href="/submit" style={button}>Submit Opportunity</Link>
              <Link href="/dashboard" style={ghost}>Back To Command</Link>
            </div>
          </section>
        ) : null}

        {!status && !filtered.length ? (
          <section style={panel}>
            <div style={labelStyle}>Folder Empty</div>
            <p style={{ color: "#cbd5e1", lineHeight: 1.55, margin: "8px 0 0" }}>
              No opportunity rooms are staged in {label(folder)} yet.
            </p>
          </section>
        ) : null}

        {!status && filtered.length && filtered.length === rooms.length && folder !== "active" ? (
          <section style={panel}>
            <div style={labelStyle}>Folder Empty / Showing Available Rooms</div>
            <p style={{ color: "#cbd5e1", lineHeight: 1.55, margin: "8px 0 0" }}>
              No rooms are staged in {label(folder)} yet, so available opportunity rooms are shown below.
            </p>
          </section>
        ) : null}

        <section className="vf-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 18 }}>
          {filtered.map((row, index) => (
            <RoomCard key={`${idOf(row, index)}-${index}`} row={row} index={index} />
          ))}
        </section>
      </div>
    </main>
  );
}
