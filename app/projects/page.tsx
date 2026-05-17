"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import VaultForgeCommandShell from "../components/VaultForgeCommandShell";
import VaultForgeDealActions from "../components/VaultForgeDealActions";

type Deal = Record<string, any>;
type Folder = "active" | "saved" | "archived" | "deleted";

const folders: Array<[Folder, string, string]> = [
  ["active", "Active", "Live deal work"],
  ["saved", "Saved", "Follow-up"],
  ["archived", "Archived", "Parked/done"],
  ["deleted", "Hidden", "Removed"],
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

function meta(row: Deal) {
  return row && typeof row.metadata === "object" && row.metadata ? row.metadata : {};
}

function field(row: Deal, ...keys: string[]) {
  const m = meta(row);
  const values: unknown[] = [];

  for (const key of keys) {
    values.push(row?.[key], m?.[key]);
  }

  return first(...values);
}

function idOf(row: Deal, index = 0) {
  return field(row, "id", "deal_id", "project_id", "item_id", "room_id", "canonical_event_id") || `deal-${index}`;
}

function titleOf(row: Deal) {
  return field(row, "title", "deal_title", "project_title", "headline", "name", "address") || "Opportunity Room";
}

function summaryOf(row: Deal) {
  return (
    field(row, "ai_summary", "summary", "route_summary", "ai_route_summary", "routing_summary", "description", "note", "notes") ||
    "Opportunity staged for review, routing, capital fit, buyer demand, or operator execution."
  );
}

function money(row: Deal) {
  const raw = field(row, "asking_price", "price", "ask", "purchase_price", "target_price");
  const n = Number(String(raw).replace(/[$,\s]/g, ""));

  if (Number.isFinite(n) && n > 0) return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

  return "Price not listed";
}

function market(row: Deal) {
  const city = field(row, "city", "area");
  const county = field(row, "county");
  const state = field(row, "state");
  const direct = field(row, "market", "city_state", "location");

  if (direct) return direct;

  return [city, county, state].filter(Boolean).join(", ") || "Market not listed";
}

function asset(row: Deal) {
  return field(row, "asset_type", "property_type", "deal_type", "type") || "Asset not listed";
}

function strategy(row: Deal) {
  return field(row, "strategy", "exit_strategy", "investment_strategy") || "Strategy not listed";
}

function photo(row: Deal) {
  const direct = field(row, "main_photo_url", "primary_photo_url", "photo_url", "image_url");
  if (direct.startsWith("http")) return direct;

  const raw = row.photo_urls || row.photos || row.images || meta(row).photo_urls || meta(row).photos || [];
  if (Array.isArray(raw)) {
    for (const item of raw) {
      if (typeof item === "string" && item.startsWith("http")) return item;
      if (item && typeof item === "object") {
        const url = clean(item.url || item.publicUrl || item.public_url || item.photo_url || item.image_url);
        if (url.startsWith("http")) return url;
      }
    }
  }

  return "";
}

function readEmail() {
  if (typeof window === "undefined") return "";

  for (const key of ["vf_email", "vf_member_email", "memberEmail", "email"]) {
    try {
      const value = clean(window.localStorage.getItem(key));
      if (value.includes("@")) return value.toLowerCase();
    } catch {
      // Continue.
    }
  }

  const match =
    document.cookie.match(/(?:^|;\s*)vf_email=([^;]+)/) ||
    document.cookie.match(/(?:^|;\s*)vf_member_email=([^;]+)/);

  if (match) {
    try {
      return decodeURIComponent(match[1] || "").toLowerCase();
    } catch {
      return String(match[1] || "").toLowerCase();
    }
  }

  return "guest@vaultforge.local";
}

async function safeJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

const panel: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.28)",
  borderRadius: 34,
  padding: 24,
  background:
    "radial-gradient(circle at top left, rgba(232,196,107,.12), transparent 34%), linear-gradient(145deg,rgba(15,23,42,.97),rgba(2,6,23,.98))",
  boxShadow: "0 28px 90px rgba(0,0,0,.36)",
};

const label: React.CSSProperties = {
  color: "#e8c46b",
  letterSpacing: ".2em",
  textTransform: "uppercase",
  fontWeight: 950,
  fontSize: 12,
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

const btn: React.CSSProperties = {
  minHeight: 48,
  borderRadius: 999,
  padding: "12px 16px",
  border: 0,
  background: "linear-gradient(135deg,#f8e7b0,#e8c46b)",
  color: "#06100a",
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

function DealCard({
  row,
  index,
  status,
  onChanged,
}: {
  row: Deal;
  index: number;
  status: Folder;
  onChanged: () => void;
}) {
  const id = idOf(row, index);
  const title = titleOf(row);
  const img = photo(row);
  const route = `/deal/detail?id=${encodeURIComponent(id)}`;

  return (
    <article style={{ ...panel, padding: 0, overflow: "hidden" }}>
      {img ? (
        <div style={{ height: 260, background: "#020617", overflow: "hidden" }}>
          <img src={img} alt={title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        </div>
      ) : (
        <div
          style={{
            height: 220,
            display: "grid",
            placeItems: "center",
            background:
              "radial-gradient(circle at center,rgba(232,196,107,.22),transparent 44%),linear-gradient(145deg,#0f172a,#020617)",
          }}
        >
          <div style={{ color: "#e8c46b", fontWeight: 1000, fontSize: 58, letterSpacing: "-.08em" }}>VF</div>
        </div>
      )}

      <div style={{ padding: 22 }}>
        <div style={label}>Opportunity Command Room</div>

        <h2
          style={{
            fontSize: "clamp(36px,7vw,70px)",
            lineHeight: 0.86,
            letterSpacing: "-.065em",
            margin: "10px 0",
            overflowWrap: "anywhere",
          }}
        >
          {title}
        </h2>

        <div style={{ color: "#f8e7b0", fontSize: 34, fontWeight: 1000, letterSpacing: "-.05em", marginBottom: 12 }}>
          {money(row)}
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
          <span style={chip}>{market(row)}</span>
          <span style={chip}>{asset(row)}</span>
          <span style={chip}>{strategy(row)}</span>
          <span style={chip}>Status: {status === "deleted" ? "Hidden" : status}</span>
        </div>

        <p style={{ color: "#cbd5e1", lineHeight: 1.6, fontSize: 16 }}>{summaryOf(row)}</p>

        <VaultForgeDealActions roomId={id} roomTitle={title} sourceRoute={route} status={status} variant="card" onChanged={onChanged} />
      </div>
    </article>
  );
}

export default function ProjectsPage() {
  const [rows, setRows] = useState<Deal[]>([]);
  const [folder, setFolder] = useState<Folder>("active");
  const [roomStatus, setRoomStatus] = useState<Record<string, Folder>>({});
  const [status, setStatus] = useState("Loading deal rooms...");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requested = params.get("folder") as Folder | null;
    if (requested && ["active", "saved", "archived", "deleted"].includes(requested)) setFolder(requested);
  }, []);

  useEffect(() => {
    async function loadStatuses() {
      const email = readEmail();
      const response = await fetch(`/api/room/status?room_type=opportunity&email=${encodeURIComponent(email)}`, {
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
      const endpoints = ["/api/deal/feed", "/api/projects", "/api/deals"];
      const collected: Deal[] = [];

      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint, { cache: "no-store", credentials: "include" });
          const data = await safeJson(response);

          collected.push(
            ...(Array.isArray(data.deals) ? data.deals : []),
            ...(Array.isArray(data.projects) ? data.projects : []),
            ...(Array.isArray(data.feed) ? data.feed : []),
            ...(Array.isArray(data.items) ? data.items : []),
            ...(Array.isArray(data.rows) ? data.rows : []),
            ...(Array.isArray(data.data) ? data.data : [])
          );
        } catch {
          // Continue.
        }
      }

      const map = new Map<string, Deal>();

      collected.forEach((row, index) => {
        const id = idOf(row, index);
        if (!map.has(id)) map.set(id, row);
      });

      const finalRows = Array.from(map.values());
      setRows(finalRows);
      setStatus(finalRows.length ? "" : "No deal rooms found yet.");
    }

    load();
  }, []);

  function statusFor(row: Deal, index: number): Folder {
    const id = idOf(row, index);
    return roomStatus[id] || "active";
  }

  const filtered = useMemo(() => {
    return rows.filter((row, index) => statusFor(row, index) === folder);
  }, [rows, folder, roomStatus]);

  function countFor(nextFolder: Folder) {
    return rows.filter((row, index) => statusFor(row, index) === nextFolder).length;
  }

  const folderTitle = folder === "deleted" ? "Hidden" : folder[0].toUpperCase() + folder.slice(1);

  return (
    <VaultForgeCommandShell
      active="opportunity"
      title="Deal command rooms."
      subtitle="Active rooms stay visible. Saved, archived, and hidden rooms move out of the live deal flow."
    >
      <section style={panel}>
        <div style={label}>VaultForge Opportunity Workstation</div>

        <h1 style={{ fontSize: "clamp(50px,10vw,108px)", lineHeight: 0.82, letterSpacing: "-.08em", margin: "12px 0" }}>
          {folderTitle} deal rooms.
        </h1>

        <p style={{ color: "#cbd5e1", fontSize: 20, lineHeight: 1.6, maxWidth: 950 }}>
          This board is now database-backed. Save, archive, or hide a room and it moves out of Active.
        </p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 18 }}>
          {folders.map(([key, name, desc]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFolder(key)}
              style={{ ...(folder === key ? btn : ghost), minWidth: 128 }}
              title={desc}
            >
              {name} ({countFor(key)})
            </button>
          ))}

          <button type="button" onClick={() => setReloadKey((value) => value + 1)} style={ghost}>
            Refresh
          </button>

          <Link href="/submit" style={ghost}>Create Deal</Link>
          <Link href="/dashboard" style={ghost}>Dashboard</Link>
        </div>
      </section>

      {status ? (
        <section style={panel}>
          <div style={label}>Status</div>
          <p style={{ color: "#cbd5e1", lineHeight: 1.6, fontSize: 18 }}>{status}</p>
        </section>
      ) : null}

      {!status && !filtered.length ? (
        <section style={panel}>
          <div style={label}>{folderTitle} Folder Clean</div>
          <h2 style={{ fontSize: "clamp(34px,7vw,70px)", lineHeight: 0.9, letterSpacing: "-.06em", margin: "10px 0" }}>
            Nothing here.
          </h2>
          <p style={{ color: "#cbd5e1", lineHeight: 1.6 }}>
            This folder is clean. Active rooms are not shown inside Saved, Archived, or Hidden.
          </p>
        </section>
      ) : null}

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 18 }}>
        {filtered.map((row, index) => (
          <DealCard
            key={`${idOf(row, index)}-${index}`}
            row={row}
            index={index}
            status={statusFor(row, index)}
            onChanged={() => setReloadKey((value) => value + 1)}
          />
        ))}
      </section>
    </VaultForgeCommandShell>
  );
}
