import Link from "next/link";
import VaultForgeRoutingActions from "../../components/VaultForgeRoutingActions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Room = Record<string, any>;

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(232,196,107,.18), transparent 28%), radial-gradient(circle at bottom right, rgba(142,22,22,.26), transparent 32%), linear-gradient(180deg,#030509,#07111f 52%,#030509)",
  color: "#f8f1df",
  padding: "26px 16px 90px",
  fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};

const shell: React.CSSProperties = { maxWidth: 1180, margin: "0 auto" };
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

function baseUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}` ||
    "http://localhost:3000"
  );
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

function normalizeList(payload: any): Room[] {
  const candidates = [payload?.routing, payload?.rooms, payload?.actions, payload?.items, payload?.signals, payload?.data, Array.isArray(payload) ? payload : null];
  return (candidates.find(Array.isArray) || []).filter(Boolean);
}

function idOf(item: Room) {
  return str(item.signal_id || item.routing_id || item.id || item.item_id || item.room_id || item.thread_key || item.title);
}

async function loadRoom(signalId: string) {
  const root = baseUrl();
  const encoded = encodeURIComponent(signalId);
  const endpoints = [
    `${root}/api/intelligence/item/${encoded}`,
    `${root}/api/routing/actions`,
    `${root}/api/intelligence/feed`,
    `${root}/api/signals`,
  ];

  for (const endpoint of endpoints) {
    const payload = await readJson(endpoint);
    if (!payload) continue;
    if (!Array.isArray(payload) && (payload?.id || payload?.signal_id || payload?.room_id)) {
      const candidate = payload?.item || payload?.room || payload?.data || payload;
      if (idOf(candidate) === signalId || endpoint.includes("/item/")) return candidate;
    }
    for (const item of normalizeList(payload)) {
      if (idOf(item) === signalId) return item;
    }
  }

  return {
    id: signalId,
    title: "Routing execution room",
    summary: "This routing room is ready for execution review. Live source details were not returned by the current APIs yet, but the room-state controls are active.",
    execution_stage: "Execution Review",
    state: "Pending",
    county: "Pending",
    routing_score: 72,
  };
}

async function loadStatus(signalId: string) {
  const root = baseUrl();
  const payload = await readJson(`${root}/api/room/status?room_type=routing&room_ids=${encodeURIComponent(signalId)}`);
  const rows = payload?.statuses || payload?.rooms || payload?.data || [];
  if (Array.isArray(rows)) {
    const row = rows.find((r: any) => str(r.room_id || r.id) === signalId);
    return str(row?.status, "active");
  }
  if (rows && typeof rows === "object") return str(rows[signalId], "active");
  return "active";
}

function titleOf(room: Room) {
  return str(room.title || room.signal_title || room.name || room.summary || room.headline, "Routing execution room");
}

function scoreOf(room: Room) {
  const raw = room.routing_score ?? room.score ?? room.priority_score ?? room.urgency_score ?? room.match_score;
  const n = Number(raw);
  if (Number.isFinite(n)) return Math.max(0, Math.min(100, Math.round(n)));
  return 72;
}

function DetailBlock({ title, value }: { title: string; value: string }) {
  return (
    <div style={{ ...panel, padding: 16 }}>
      <div style={{ color: "rgba(232,196,107,.75)", fontSize: 11, fontWeight: 1000, letterSpacing: ".14em", textTransform: "uppercase" }}>{title}</div>
      <div style={{ marginTop: 8, color: "#f8f1df", fontSize: 16, fontWeight: 900, lineHeight: 1.35 }}>{value}</div>
    </div>
  );
}

export default async function RoutingRoomPage({ params }: { params: Promise<{ signalId: string }> }) {
  const { signalId } = await params;
  const room = await loadRoom(signalId);
  const status = await loadStatus(signalId);
  const title = titleOf(room);
  const score = scoreOf(room);
  const market = [str(room.city || room.market_city), str(room.county), str(room.state || room.market_state)].filter(Boolean).join(", ") || "Market pending";

  return (
    <main style={page}>
      <div style={shell}>
        <nav style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 18 }}>
          {[ ["Routing Inbox", "/routing-inbox"], ["Alerts", "/alerts"], ["Intelligence", "/intelligence"], ["Projects", "/projects"], ["Pressure", "/pressure-rooms"], ["Messages", "/message-command"] ].map(([label, href]) => (
            <Link key={href} href={href} style={{ color: "rgba(248,241,223,.82)", textDecoration: "none", border: "1px solid rgba(232,196,107,.18)", borderRadius: 999, padding: "8px 11px", background: "rgba(255,255,255,.04)", fontSize: 12, fontWeight: 900 }}>{label}</Link>
          ))}
        </nav>

        <section style={{ ...panel, padding: 24, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg,rgba(232,196,107,.09),transparent 45%,rgba(142,22,22,.13))", pointerEvents: "none" }} />
          <div style={{ position: "relative", display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: 18, alignItems: "start" }}>
            <div>
              <div style={{ color: "#e8c46b", fontSize: 12, fontWeight: 1000, letterSpacing: ".18em", textTransform: "uppercase" }}>
                Routing Room / Execution Command
              </div>
              <h1 style={{ margin: "10px 0", fontSize: "clamp(34px,7vw,68px)", lineHeight: .9, letterSpacing: "-.06em" }}>{title}</h1>
              <p style={{ margin: 0, maxWidth: 820, color: "rgba(248,241,223,.72)", lineHeight: 1.6, fontSize: 15 }}>
                {str(room.ai_summary || room.summary || room.notes || room.description, "Review member fit, capital path, operator need, introduction readiness, and execution stage from this room.")}
              </p>
            </div>
            <div style={{ minWidth: 112, textAlign: "center", border: "1px solid rgba(232,196,107,.30)", borderRadius: 22, padding: "14px 16px", background: "rgba(0,0,0,.28)" }}>
              <div style={{ fontSize: 42, fontWeight: 1000, color: score >= 80 ? "#ffcf6b" : "#f8f1df" }}>{score}</div>
              <div style={{ fontSize: 11, letterSpacing: ".16em", textTransform: "uppercase", color: "rgba(248,241,223,.58)", fontWeight: 1000 }}>Routing Fit</div>
            </div>
          </div>

          <div style={{ position: "relative", marginTop: 18 }}>
            <VaultForgeRoutingActions roomId={signalId} initialStatus={status} />
          </div>
        </section>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 14, marginTop: 18 }}>
          <DetailBlock title="Market" value={market} />
          <DetailBlock title="Execution Stage" value={str(room.execution_stage || room.stage || room.status || room.routing_stage, "Routing Review")} />
          <DetailBlock title="Capital Lane" value={str(room.capital_stage || room.capital_need || room.funding_need, "Capital check pending")} />
          <DetailBlock title="Operator Lane" value={str(room.operator_stage || room.operator_need || room.contractor_need, "Operator check pending")} />
        </section>

        <section style={{ ...panel, padding: 20, marginTop: 18 }}>
          <div style={{ color: "#e8c46b", fontSize: 12, fontWeight: 1000, letterSpacing: ".16em", textTransform: "uppercase" }}>Execution Checklist</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12, marginTop: 14 }}>
            {["Confirm signal source", "Score member fit", "Check capital need", "Check operator need", "Stage introduction", "Move to execution"].map((step, index) => (
              <div key={step} style={{ border: "1px solid rgba(232,196,107,.16)", borderRadius: 18, padding: 14, background: "rgba(255,255,255,.04)" }}>
                <div style={{ color: "rgba(232,196,107,.75)", fontSize: 11, fontWeight: 1000, letterSpacing: ".14em", textTransform: "uppercase" }}>Step {index + 1}</div>
                <div style={{ marginTop: 7, fontWeight: 950 }}>{step}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
