import Link from "next/link";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import VaultForgeAlertActions from "../components/VaultForgeAlertActions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type RoomStatus = "active" | "saved" | "archived" | "deleted";
type AlertRoom = Record<string, any> & {
  id: string;
  title: string;
  summary: string;
  severity: "critical" | "high" | "medium" | "low";
  lane: string;
  state: string;
  county: string;
  city: string;
  score: number;
  status: RoomStatus;
  source: string;
  href: string;
  created_at: string;
};

const OWNER_EMAIL = "bcrsoutheast@gmail.com";

function supabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    "";

  if (!url || !key) return null;

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function clean(value: unknown) {
  return String(value || "").trim();
}

function lower(value: unknown) {
  return clean(value).toLowerCase();
}

function pick(row: Record<string, any>, keys: string[], fallback = "") {
  for (const key of keys) {
    const value = row?.[key];
    if (value !== null && value !== undefined && clean(value) !== "") return clean(value);
  }
  return fallback;
}

function scoreFrom(row: Record<string, any>) {
  const raw = Number(
    row?.urgency_score ??
      row?.score ??
      row?.priority_score ??
      row?.routing_score ??
      row?.heat_score ??
      row?.severity_score ??
      0
  );

  if (Number.isFinite(raw) && raw > 0) return Math.max(1, Math.min(100, Math.round(raw)));

  const urgency = lower(row?.urgency || row?.priority || row?.severity || row?.status);
  if (urgency.includes("critical") || urgency.includes("urgent")) return 94;
  if (urgency.includes("high")) return 82;
  if (urgency.includes("medium")) return 61;
  return 38;
}

function severityFrom(score: number, row: Record<string, any>): AlertRoom["severity"] {
  const raw = lower(row?.severity || row?.urgency || row?.priority || row?.alert_level);
  if (raw.includes("critical") || raw.includes("urgent")) return "critical";
  if (raw.includes("high")) return "high";
  if (raw.includes("medium")) return "medium";
  if (raw.includes("low")) return "low";

  if (score >= 88) return "critical";
  if (score >= 72) return "high";
  if (score >= 45) return "medium";
  return "low";
}

function laneFrom(row: Record<string, any>) {
  const raw = lower(
    row?.lane || row?.category || row?.alert_type || row?.signal_type || row?.type || row?.source_type
  );
  const text = lower(JSON.stringify(row || {}));

  if (raw.includes("capital") || text.includes("lender") || text.includes("funding")) return "Capital";
  if (raw.includes("route") || raw.includes("intro") || text.includes("operator")) return "Routing";
  if (raw.includes("pain") || raw.includes("pressure") || text.includes("distress")) return "Pressure";
  if (raw.includes("market") || raw.includes("signal") || raw.includes("intelligence")) return "Market Signal";
  if (raw.includes("deal") || raw.includes("opportunity") || text.includes("acquisition")) return "Opportunity";
  return "Urgent";
}

function hrefFor(row: Record<string, any>, id: string, lane: string) {
  const explicit = pick(row, ["href", "url", "room_url", "source_url"], "");
  if (explicit.startsWith("/")) return explicit;

  const signalId = pick(row, ["signal_id", "routing_signal_id", "alert_signal_id"], "");
  const dealId = pick(row, ["deal_id", "project_id", "item_id", "opportunity_id"], "");
  const painId = pick(row, ["pain_id", "pain_request_id", "pressure_id"], "");

  if (signalId) return `/signals/${encodeURIComponent(signalId)}`;
  if (painId || lane === "Pressure") return `/pain-room/${encodeURIComponent(painId || id)}`;
  if (dealId || lane === "Opportunity") return `/deal/detail?id=${encodeURIComponent(dealId || id)}`;
  return `/signals/${encodeURIComponent(id)}`;
}

function normalizeAlert(row: Record<string, any>, source: string, status: RoomStatus = "active"): AlertRoom {
  const id = pick(row, ["id", "alert_id", "signal_id", "room_id", "item_id", "deal_id"], `${source}-${Math.random()}`);
  const score = scoreFrom(row);
  const lane = laneFrom(row);
  const title = pick(
    row,
    ["title", "alert_title", "signal_title", "name", "headline", "subject", "deal_title"],
    `${lane} Alert`
  );

  return {
    ...row,
    id,
    title,
    summary: pick(
      row,
      ["summary", "ai_summary", "description", "notes", "message", "details", "analysis"],
      "VaultForge detected a room-level signal that may require review, routing, or execution action."
    ),
    severity: severityFrom(score, row),
    lane,
    state: pick(row, ["state", "market_state", "property_state"], "—"),
    county: pick(row, ["county", "market_county", "property_county"], "—"),
    city: pick(row, ["city", "market_city", "property_city"], "—"),
    score,
    status,
    source,
    href: hrefFor(row, id, lane),
    created_at: pick(row, ["created_at", "updated_at", "timestamp", "inserted_at"], ""),
  };
}

async function getUserEmail() {
  const cookieStore = await cookies();
  return lower(
    cookieStore.get("vf_email")?.value ||
      cookieStore.get("email")?.value ||
      cookieStore.get("vaultforge_email")?.value ||
      OWNER_EMAIL
  );
}

async function fetchRoomStates(userEmail: string) {
  const db = supabase();
  if (!db) return new Map<string, RoomStatus>();

  const { data } = await db
    .from("vf_room_states")
    .select("room_id,room_type,status,user_email")
    .eq("room_type", "alert")
    .eq("user_email", userEmail);

  const map = new Map<string, RoomStatus>();
  for (const row of data || []) {
    const id = clean((row as any).room_id);
    const status = lower((row as any).status) as RoomStatus;
    if (id && ["active", "saved", "archived", "deleted"].includes(status)) map.set(id, status);
  }
  return map;
}

async function tryTable(table: string, limit = 80) {
  const db = supabase();
  if (!db) return [] as Record<string, any>[];

  const { data, error } = await db.from(table).select("*").order("created_at", { ascending: false }).limit(limit);
  if (error || !Array.isArray(data)) return [];
  return data as Record<string, any>[];
}

async function loadAlerts(userEmail: string) {
  const states = await fetchRoomStates(userEmail);

  const directTables = [
    "vf_alerts",
    "alerts",
    "vf_smart_alerts",
    "vf_member_alerts",
    "vf_intelligence_alerts",
  ];

  let rows: AlertRoom[] = [];

  for (const table of directTables) {
    const data = await tryTable(table, 70);
    if (data.length) {
      rows = data.map((row) => {
        const base = normalizeAlert(row, table);
        return { ...base, status: states.get(base.id) || base.status };
      });
      break;
    }
  }

  if (!rows.length) {
    const signalRows = await tryTable("vf_intelligence_signals", 60);
    const painRows = await tryTable("vf_pain_signals", 35);
    const routingRows = await tryTable("vf_routing_actions", 35);

    rows = [
      ...signalRows.map((row) => normalizeAlert(row, "vf_intelligence_signals")),
      ...painRows.map((row) => normalizeAlert({ ...row, lane: "Pressure" }, "vf_pain_signals")),
      ...routingRows.map((row) => normalizeAlert({ ...row, lane: "Routing" }, "vf_routing_actions")),
    ].map((alert) => ({ ...alert, status: states.get(alert.id) || alert.status }));
  }

  const seen = new Set<string>();
  return rows
    .filter((alert) => {
      const key = `${alert.id}:${alert.source}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => b.score - a.score);
}

const page: React.CSSProperties = {
  minHeight: "100vh",
  color: "#fff7df",
  background:
    "radial-gradient(circle at top left, rgba(214,44,44,.22), transparent 28%), radial-gradient(circle at top right, rgba(232,196,107,.16), transparent 30%), linear-gradient(180deg,#030406,#07111f 52%,#030406)",
  padding: "24px 16px 80px",
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
};

const shell: React.CSSProperties = {
  maxWidth: 1180,
  margin: "0 auto",
};

const topNav: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  alignItems: "center",
  marginBottom: 18,
  flexWrap: "wrap",
};

const navLinks: React.CSSProperties = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
};

const navButton: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.25)",
  color: "#f8e7a7",
  background: "rgba(255,255,255,.04)",
  borderRadius: 999,
  padding: "9px 12px",
  textDecoration: "none",
  fontSize: 12,
  fontWeight: 850,
};

const hero: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.22)",
  background:
    "linear-gradient(135deg,rgba(255,255,255,.075),rgba(255,255,255,.025)), radial-gradient(circle at top right,rgba(255,63,63,.16),transparent 32%)",
  borderRadius: 28,
  padding: 24,
  boxShadow: "0 24px 80px rgba(0,0,0,.38)",
  marginBottom: 18,
};

const eyebrow: React.CSSProperties = {
  color: "#e8c46b",
  fontSize: 12,
  letterSpacing: ".18em",
  fontWeight: 950,
  textTransform: "uppercase",
};

const h1: React.CSSProperties = {
  fontSize: "clamp(34px, 7vw, 78px)",
  lineHeight: ".9",
  letterSpacing: "-.07em",
  margin: "10px 0 12px",
};

const ticker: React.CSSProperties = {
  border: "1px solid rgba(255,92,92,.28)",
  background: "rgba(255,45,45,.075)",
  borderRadius: 18,
  padding: "12px 14px",
  color: "#ffd4b8",
  fontWeight: 850,
  fontSize: 13,
  letterSpacing: ".03em",
  marginTop: 16,
};

const statGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))",
  gap: 10,
  margin: "18px 0",
};

const statCard: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.18)",
  background: "rgba(0,0,0,.26)",
  borderRadius: 18,
  padding: 14,
};

const tabs: React.CSSProperties = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
  margin: "16px 0",
};

const sectionTitle: React.CSSProperties = {
  fontSize: 20,
  margin: "22px 0 10px",
  letterSpacing: "-.03em",
};

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(285px,1fr))",
  gap: 12,
};

function severityStyle(severity: AlertRoom["severity"]): React.CSSProperties {
  if (severity === "critical") return { borderColor: "rgba(255,68,68,.55)", boxShadow: "0 0 0 1px rgba(255,68,68,.12), 0 18px 60px rgba(255,0,0,.12)" };
  if (severity === "high") return { borderColor: "rgba(255,151,74,.45)" };
  if (severity === "medium") return { borderColor: "rgba(232,196,107,.35)" };
  return { borderColor: "rgba(255,255,255,.16)" };
}

function AlertCard({ alert, userEmail }: { alert: AlertRoom; userEmail: string }) {
  return (
    <article
      style={{
        border: "1px solid rgba(232,196,107,.2)",
        background:
          "linear-gradient(180deg,rgba(255,255,255,.07),rgba(255,255,255,.025)), rgba(0,0,0,.34)",
        borderRadius: 22,
        padding: 16,
        ...severityStyle(alert.severity),
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 10 }}>
        <span
          style={{
            border: "1px solid rgba(232,196,107,.24)",
            borderRadius: 999,
            padding: "6px 9px",
            fontSize: 11,
            fontWeight: 950,
            color: "#f4d986",
            textTransform: "uppercase",
          }}
        >
          {alert.lane}
        </span>
        <span
          style={{
            color: alert.severity === "critical" ? "#ffb0b0" : "#f5d889",
            fontWeight: 950,
            fontSize: 12,
            textTransform: "uppercase",
          }}
        >
          {alert.severity} · {alert.score}
        </span>
      </div>

      <h2 style={{ margin: "0 0 8px", fontSize: 21, letterSpacing: "-.04em" }}>{alert.title}</h2>
      <p style={{ color: "rgba(255,247,223,.72)", margin: "0 0 13px", lineHeight: 1.45, fontSize: 14 }}>
        {alert.summary}
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3,1fr)",
          gap: 8,
          marginBottom: 14,
        }}
      >
        <Mini label="State" value={alert.state} />
        <Mini label="County" value={alert.county} />
        <Mini label="City" value={alert.city} />
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        <Link href={alert.href} style={navButton}>
          Open Room
        </Link>
        <Link href={`/messages/new?room_type=alert&room_id=${encodeURIComponent(alert.id)}&title=${encodeURIComponent(alert.title)}`} style={navButton}>
          Message
        </Link>
      </div>

      <VaultForgeAlertActions
        roomId={alert.id}
        roomType="alert"
        sourceRoute="/alerts"
        initialStatus={alert.status}
        userEmail={userEmail}
        compact
      />
    </article>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ border: "1px solid rgba(255,255,255,.1)", borderRadius: 14, padding: 9, background: "rgba(0,0,0,.2)" }}>
      <div style={{ color: "rgba(255,247,223,.48)", fontSize: 10, textTransform: "uppercase", fontWeight: 900 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 850 }}>{value || "—"}</div>
    </div>
  );
}

function FolderLink({ href, label, active }: { href: string; label: string; active?: boolean }) {
  return (
    <Link
      href={href}
      style={{
        ...navButton,
        background: active ? "rgba(232,196,107,.16)" : "rgba(255,255,255,.04)",
        borderColor: active ? "rgba(232,196,107,.5)" : "rgba(232,196,107,.22)",
      }}
    >
      {label}
    </Link>
  );
}

export default async function AlertsPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const params = searchParams ? await searchParams : {};
  const folderRaw = lower(Array.isArray(params?.folder) ? params?.folder[0] : params?.folder || "active");
  const folder: RoomStatus = ["active", "saved", "archived", "deleted"].includes(folderRaw)
    ? (folderRaw as RoomStatus)
    : "active";

  const userEmail = await getUserEmail();
  const alerts = await loadAlerts(userEmail);
  const visible = alerts.filter((alert) => alert.status === folder);

  const counts = {
    active: alerts.filter((a) => a.status === "active").length,
    saved: alerts.filter((a) => a.status === "saved").length,
    archived: alerts.filter((a) => a.status === "archived").length,
    deleted: alerts.filter((a) => a.status === "deleted").length,
    critical: alerts.filter((a) => a.status === "active" && a.severity === "critical").length,
    high: alerts.filter((a) => a.status === "active" && a.severity === "high").length,
  };

  return (
    <main style={page}>
      <div style={shell}>
        <nav style={topNav}>
          <div style={{ fontWeight: 950, letterSpacing: ".08em", color: "#e8c46b" }}>VAULTFORGE</div>
          <div style={navLinks}>
            <Link href="/dashboard" style={navButton}>Dashboard</Link>
            <Link href="/projects" style={navButton}>Opportunities</Link>
            <Link href="/pressure-rooms" style={navButton}>Pressure</Link>
            <Link href="/routing-inbox" style={navButton}>Routing</Link>
            <Link href="/intelligence" style={navButton}>Intelligence</Link>
          </div>
        </nav>

        <section style={hero}>
          <div style={eyebrow}>Live Alert Command Lane</div>
          <h1 style={h1}>Alerts Terminal</h1>
          <p style={{ maxWidth: 820, color: "rgba(255,247,223,.74)", fontSize: 16, lineHeight: 1.55, margin: 0 }}>
            Active market pressure, opportunity movement, capital needs, routing triggers, and execution alerts now live inside the same VaultForge room-state engine.
          </p>
          <div style={ticker}>
            URGENCY TICKER · {counts.critical} CRITICAL · {counts.high} HIGH · {counts.active} ACTIVE ALERTS · ROOM CLEANUP ENGINE ONLINE
          </div>
        </section>

        <section style={statGrid}>
          <Stat label="Active" value={counts.active} />
          <Stat label="Saved" value={counts.saved} />
          <Stat label="Archived" value={counts.archived} />
          <Stat label="Hidden" value={counts.deleted} />
        </section>

        <div style={tabs}>
          <FolderLink href="/alerts?folder=active" label={`Active ${counts.active}`} active={folder === "active"} />
          <FolderLink href="/alerts?folder=saved" label={`Saved ${counts.saved}`} active={folder === "saved"} />
          <FolderLink href="/alerts?folder=archived" label={`Archived ${counts.archived}`} active={folder === "archived"} />
          <FolderLink href="/alerts?folder=deleted" label={`Hidden ${counts.deleted}`} active={folder === "deleted"} />
        </div>

        <h2 style={sectionTitle}>
          {folder === "active" ? "Active Alerts" : folder === "saved" ? "Saved Alerts" : folder === "archived" ? "Archived Alerts" : "Hidden Alerts"}
        </h2>

        {visible.length ? (
          <section style={grid}>
            {visible.map((alert) => (
              <AlertCard key={`${alert.source}-${alert.id}`} alert={alert} userEmail={userEmail} />
            ))}
          </section>
        ) : (
          <section
            style={{
              border: "1px dashed rgba(232,196,107,.25)",
              background: "rgba(0,0,0,.22)",
              borderRadius: 22,
              padding: 24,
              color: "rgba(255,247,223,.7)",
            }}
          >
            No {folder} alerts found. If this is the first deploy, create or generate a signal/pain/routing item and refresh this terminal.
          </section>
        )}
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div style={statCard}>
      <div style={{ color: "rgba(255,247,223,.52)", fontSize: 11, fontWeight: 900, textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontSize: 34, fontWeight: 950, letterSpacing: "-.05em" }}>{value}</div>
    </div>
  );
}
