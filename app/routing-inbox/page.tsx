import Link from "next/link";
import VaultForgeRoutingActions from "../components/VaultForgeRoutingActions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type RoutingRoom = Record<string, any>;
type StatusMap = Record<string, string>;

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(232,196,107,.16), transparent 28%), radial-gradient(circle at bottom right, rgba(143,26,26,.22), transparent 30%), linear-gradient(180deg,#030509,#07111f 50%,#030509)",
  color: "#f8f1df",
  padding: "26px 16px 80px",
  fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};

const shell: React.CSSProperties = { maxWidth: 1220, margin: "0 auto" };
const panel: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.22)",
  borderRadius: 26,
  background: "linear-gradient(180deg,rgba(11,18,32,.94),rgba(5,8,15,.96))",
  boxShadow: "0 24px 70px rgba(0,0,0,.45)",
};

function str(value: unknown, fallback = "") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function idOf(item: RoutingRoom) {
  return str(item.signal_id || item.routing_id || item.id || item.item_id || item.room_id || item.thread_key || item.title, "routing-room");
}

function titleOf(item: RoutingRoom) {
  return str(item.title || item.signal_title || item.name || item.summary || item.headline, "Routing execution room");
}

function stageOf(item: RoutingRoom) {
  return str(item.execution_stage || item.stage || item.status || item.routing_stage, "Routing Review");
}

function marketOf(item: RoutingRoom) {
  const city = str(item.city || item.market_city);
  const state = str(item.state || item.market_state);
  const county = str(item.county);
  return [city, county, state].filter(Boolean).join(", ") || "Market pending";
}

function scoreOf(item: RoutingRoom) {
  const raw = item.routing_score ?? item.score ?? item.priority_score ?? item.urgency_score ?? item.match_score;
  const n = Number(raw);
  if (Number.isFinite(n)) return Math.max(0, Math.min(100, Math.round(n)));
  return 72;
}

async function readJson(url: string) {
  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

function baseUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}` ||
    "http://localhost:3000"
  );
}

function normalizeList(payload: any): RoutingRoom[] {
  const candidates = [
    payload?.routing,
    payload?.rooms,
    payload?.actions,
    payload?.items,
    payload?.signals,
    payload?.data,
    Array.isArray(payload) ? payload : null,
  ];
  const found = candidates.find(Array.isArray) || [];
  return found.filter(Boolean).map((item: any) => ({ ...item }));
}

async function loadRoutingRooms() {
  const root = baseUrl();
  const endpoints = [
    `${root}/api/routing/actions`,
    `${root}/api/routing/generate`,
    `${root}/api/intelligence/feed`,
    `${root}/api/signals`,
  ];

  const merged: RoutingRoom[] = [];
  const seen = new Set<string>();

  for (const endpoint of endpoints) {
    const payload = await readJson(endpoint);
    for (const item of normalizeList(payload)) {
      const id = idOf(item);
      if (seen.has(id)) continue;
      seen.add(id);
      merged.push(item);
    }
    if (merged.length >= 18) break;
  }

  if (merged.length) return merged;

  return [
    {
      id: "routing-command-sample",
      title: "Routing command room waiting on live signals",
      summary: "No live routing rows were returned yet. This placeholder keeps the command lane visible while the routing feed is connected.",
      state: "GA",
      county: "Operational",
      execution_stage: "System Ready",
      routing_score: 64,
    },
  ];
}

async function loadStatuses(ids: string[]) {
  if (!ids.length) return {} as StatusMap;
  const root = baseUrl();
  const query = encodeURIComponent(ids.join(","));
  const payload = await readJson(`${root}/api/room/status?room_type=routing&room_ids=${query}`);
  const rows = payload?.statuses || payload?.rooms || payload?.data || [];
  const map: StatusMap = {};
  if (Array.isArray(rows)) {
    for (const row of rows) {
      const id = str(row.room_id || row.id);
      if (id) map[id] = str(row.status, "active");
    }
  } else if (rows && typeof rows === "object") {
    for (const [key, value] of Object.entries(rows)) map[key] = str(value, "active");
  }
  return map;
}

function groupByStatus(items: RoutingRoom[], statuses: StatusMap, wanted: string) {
  return items.filter((item) => (statuses[idOf(item)] || "active") === wanted);
}

function RoomCard({ item, status }: { item: RoutingRoom; status: string }) {
  const id = idOf(item);
  const title = titleOf(item);
  const score = scoreOf(item);
  const stage = stageOf(item);
  const href = `/routing-room/${encodeURIComponent(id)}`;

  return (
    <article
      style={{
        ...panel,
        padding: 18,
        display: "grid",
        gap: 14,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg,rgba(232,196,107,.08),transparent 42%,rgba(142,22,22,.09))", pointerEvents: "none" }} />
      <div style={{ position: "relative", display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start" }}>
        <div>
          <div style={{ color: "#e8c46b", fontSize: 11, fontWeight: 1000, letterSpacing: ".16em", textTransform: "uppercase" }}>
            Routing / Execution Signal
          </div>
          <h2 style={{ margin: "8px 0 6px", fontSize: 24, lineHeight: 1.05 }}>{title}</h2>
          <div style={{ color: "rgba(248,241,223,.72)", fontSize: 13, fontWeight: 800 }}>{marketOf(item)}</div>
        </div>
        <div style={{ minWidth: 86, textAlign: "center", border: "1px solid rgba(232,196,107,.28)", borderRadius: 18, padding: "10px 12px", background: "rgba(0,0,0,.25)" }}>
          <div style={{ fontSize: 28, fontWeight: 1000, color: score >= 80 ? "#ffcf6b" : "#f8f1df" }}>{score}</div>
          <div style={{ fontSize: 10, letterSpacing: ".14em", textTransform: "uppercase", color: "rgba(248,241,223,.58)", fontWeight: 900 }}>Fit</div>
        </div>
      </div>

      <p style={{ position: "relative", margin: 0, color: "rgba(248,241,223,.78)", fontSize: 14, lineHeight: 1.55 }}>
        {str(item.ai_summary || item.summary || item.notes || item.description, "Routing room is ready for owner review, member fit scoring, introduction staging, and execution follow-through.")}
      </p>

      <div style={{ position: "relative", display: "flex", flexWrap: "wrap", gap: 8 }}>
        {[stage, str(item.member_type || item.target_member_type, "Member Fit"), str(item.capital_stage || item.capital_need, "Capital Check"), str(item.operator_stage || item.operator_need, "Operator Check")].map((tag) => (
          <span key={tag} style={{ border: "1px solid rgba(232,196,107,.22)", borderRadius: 999, padding: "7px 10px", background: "rgba(255,255,255,.04)", color: "rgba(248,241,223,.78)", fontSize: 12, fontWeight: 900 }}>
            {tag}
          </span>
        ))}
      </div>

      <div style={{ position: "relative", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <Link href={href} style={{ color: "#05070c", background: "linear-gradient(135deg,#f3d27c,#b98722)", textDecoration: "none", borderRadius: 999, padding: "11px 14px", fontWeight: 1000, fontSize: 12, letterSpacing: ".08em", textTransform: "uppercase" }}>
          Open Routing Room
        </Link>
        <VaultForgeRoutingActions roomId={id} initialStatus={status} compact />
      </div>
    </article>
  );
}

function Folder({ title, subtitle, items, statuses }: { title: string; subtitle: string; items: RoutingRoom[]; statuses: StatusMap }) {
  return (
    <section style={{ marginTop: 22 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "end", marginBottom: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 24 }}>{title}</h2>
          <p style={{ margin: "6px 0 0", color: "rgba(248,241,223,.62)", fontSize: 13 }}>{subtitle}</p>
        </div>
        <div style={{ color: "#e8c46b", fontWeight: 1000, fontSize: 26 }}>{items.length}</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 14 }}>
        {items.length ? items.map((item) => <RoomCard key={idOf(item)} item={item} status={statuses[idOf(item)] || "active"} />) : (
          <div style={{ ...panel, padding: 20, color: "rgba(248,241,223,.62)", fontWeight: 800 }}>No rooms in this folder.</div>
        )}
      </div>
    </section>
  );
}

export default async function RoutingInboxPage() {
  const rooms = await loadRoutingRooms();
  const ids = rooms.map(idOf);
  const statuses = await loadStatuses(ids);

  const active = groupByStatus(rooms, statuses, "active");
  const saved = groupByStatus(rooms, statuses, "saved");
  const archived = groupByStatus(rooms, statuses, "archived");
  const hidden = groupByStatus(rooms, statuses, "deleted");

  return (
    <main style={page}>
      <div style={shell}>
        <nav style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 18 }}>
          {[ ["Dashboard", "/dashboard"], ["Projects", "/projects"], ["Pressure", "/pressure-rooms"], ["Alerts", "/alerts"], ["Intelligence", "/intelligence"], ["Messages", "/message-command"] ].map(([label, href]) => (
            <Link key={href} href={href} style={{ color: "rgba(248,241,223,.82)", textDecoration: "none", border: "1px solid rgba(232,196,107,.18)", borderRadius: 999, padding: "8px 11px", background: "rgba(255,255,255,.04)", fontSize: 12, fontWeight: 900 }}>{label}</Link>
          ))}
        </nav>

        <section style={{ ...panel, padding: 24 }}>
          <div style={{ color: "#e8c46b", fontSize: 12, fontWeight: 1000, letterSpacing: ".18em", textTransform: "uppercase" }}>
            VaultForge Routing Command
          </div>
          <h1 style={{ margin: "10px 0", fontSize: "clamp(34px,7vw,72px)", lineHeight: .9, letterSpacing: "-.06em" }}>
            Execution routing inbox.
          </h1>
          <p style={{ margin: 0, maxWidth: 860, color: "rgba(248,241,223,.72)", lineHeight: 1.6, fontSize: 15 }}>
            Routing rooms now follow the same command-center cleanup model as Opportunities, Pressure, and Alerts: active execution, saved review, archived completion, and hidden clutter control.
          </p>
        </section>

        <Folder title="Active Routing" subtitle="Rooms that still need review, staging, capital, operator, or introduction action." items={active} statuses={statuses} />
        <Folder title="Saved Routing" subtitle="Execution rooms bookmarked for follow-up." items={saved} statuses={statuses} />
        <Folder title="Archived Routing" subtitle="Reviewed or completed routing rooms." items={archived} statuses={statuses} />
        <Folder title="Hidden Routing" subtitle="Clutter removed from active command flow. Restore brings it back." items={hidden} statuses={statuses} />
      </div>
    </main>
  );
}
