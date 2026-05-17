import Link from "next/link";
import { headers, cookies } from "next/headers";
import VaultForgePressureActions from "../../components/VaultForgePressureActions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type AnyRow = Record<string, any>;

function clean(value: unknown) {
  return String(value || "").trim();
}

function first(...values: unknown[]) {
  for (const value of values) {
    if (Array.isArray(value)) {
      for (const item of value) {
        const text = first(item);
        if (text) return text;
      }
      continue;
    }
    if (value && typeof value === "object") continue;
    const text = clean(value);
    if (text && text.toLowerCase() !== "null" && text.toLowerCase() !== "undefined") return text;
  }
  return "";
}

function metadataOf(row: AnyRow) {
  return row && typeof row.metadata === "object" && row.metadata ? row.metadata : {};
}

function field(row: AnyRow, ...keys: string[]) {
  const m = metadataOf(row);
  const values: unknown[] = [];
  for (const key of keys) values.push(row?.[key], m?.[key]);
  return first(...values);
}

async function baseUrl() {
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host") || "";
  const proto = h.get("x-forwarded-proto") || "https";
  return host ? `${proto}://${host}` : "";
}

async function requestEmail() {
  const cookieStore = await cookies();
  return clean(
    cookieStore.get("vf_email")?.value ||
      cookieStore.get("vf_member_email")?.value ||
      cookieStore.get("vf_admin_email")?.value ||
      "guest@vaultforge.local"
  ).toLowerCase();
}

async function loadRoomStatus(roomId: string) {
  const origin = await baseUrl();
  const email = await requestEmail();
  if (!origin || !roomId) return "active";
  try {
    const response = await fetch(`${origin}/api/room/status?room_type=pressure&email=${encodeURIComponent(email)}`, {
      cache: "no-store",
      headers: { "x-vf-email": email },
    });
    const data = await response.json().catch(() => ({}));
    const status = String(data?.rooms?.[roomId]?.status || "active");
    if (status === "saved" || status === "archived" || status === "deleted") return status;
  } catch {}
  return "active";
}

async function loadPressure(id: string) {
  const origin = await baseUrl();
  const email = await requestEmail();
  if (!origin || !id) return { row: null as AnyRow | null, error: "Missing origin or pressure id." };

  const urls = [
    `${origin}/api/pain/feed?id=${encodeURIComponent(id)}&email=${encodeURIComponent(email)}&owner=1`,
    `${origin}/api/pain/rooms?id=${encodeURIComponent(id)}&email=${encodeURIComponent(email)}&owner=1`,
  ];

  for (const url of urls) {
    try {
      const response = await fetch(url, { cache: "no-store", headers: { "x-vf-email": email, "x-vf-admin": email === "bcrsoutheast@gmail.com" ? "1" : "0" } });
      const data = await response.json().catch(() => ({}));
      if (response.ok && data?.ok !== false) {
        const rows = [
          ...(Array.isArray(data.pains) ? data.pains : []),
          ...(Array.isArray(data.pressures) ? data.pressures : []),
          ...(Array.isArray(data.pain_requests) ? data.pain_requests : []),
          ...(Array.isArray(data.rooms) ? data.rooms : []),
          ...(Array.isArray(data.feed) ? data.feed : []),
          ...(Array.isArray(data.items) ? data.items : []),
          ...(Array.isArray(data.rows) ? data.rows : []),
          ...(Array.isArray(data.data) ? data.data : []),
        ];
        const direct =
          data?.pain ||
          data?.pressure ||
          data?.room ||
          data?.item ||
          data?.record ||
          rows.find((row: AnyRow) => field(row, "id", "pain_id", "request_id", "signal_id", "item_id", "room_id", "canonical_event_id") === id) ||
          rows[0] ||
          null;
        if (direct) return { row: direct, error: "" };
      }
    } catch {}
  }
  return { row: null, error: "No matching pressure room returned from pressure APIs." };
}

const page: React.CSSProperties = {
  minHeight: "100vh",
  background: "radial-gradient(circle at top left, rgba(248,113,113,.16), transparent 30%), linear-gradient(180deg,#020814,#071326 52%,#020814)",
  color: "white",
  padding: "24px 16px 90px",
  fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
};

const wrap: React.CSSProperties = { maxWidth: 1180, margin: "0 auto", display: "grid", gap: 18 };

const card: React.CSSProperties = {
  border: "1px solid rgba(248,113,113,.30)",
  background: "radial-gradient(circle at top left, rgba(248,113,113,.13), transparent 34%), linear-gradient(135deg,rgba(18,24,42,.97),rgba(8,19,35,.98))",
  borderRadius: 32,
  padding: 24,
  boxShadow: "0 28px 90px rgba(0,0,0,.36)",
};

const softCard: React.CSSProperties = {
  border: "1px solid rgba(148,163,184,.18)",
  background: "rgba(15,23,42,.78)",
  borderRadius: 22,
  padding: 18,
};

const eyebrow: React.CSSProperties = {
  color: "#fb7185",
  textTransform: "uppercase",
  letterSpacing: ".18em",
  fontWeight: 900,
  fontSize: 13,
};

const muted: React.CSSProperties = { color: "#cbd5e1", lineHeight: 1.55 };

const pill: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  border: "1px solid rgba(148,163,184,.24)",
  background: "rgba(255,255,255,.06)",
  borderRadius: 999,
  padding: "11px 14px",
  color: "white",
  textDecoration: "none",
  fontWeight: 900,
  fontSize: 14,
};

const redPill: React.CSSProperties = {
  ...pill,
  background: "linear-gradient(135deg,#fecaca,#fb7185)",
  color: "#21070a",
  border: "0",
};

function Metric({ label, value }: { label: string; value: string }) {
  if (!clean(value)) return null;
  return (
    <div style={softCard}>
      <div style={eyebrow}>{label}</div>
      <div style={{ color: "white", fontSize: 20, fontWeight: 900, marginTop: 8, overflowWrap: "anywhere" }}>{value}</div>
    </div>
  );
}

export default async function PainRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const roomId = clean(id);
  const { row, error } = await loadPressure(roomId);

  const title = row ? field(row, "title", "pain_title", "problem_title", "headline", "name", "address") || "Pressure Room" : "Pressure room not loaded";
  const summary = row ? field(row, "ai_summary", "summary", "route_summary", "routing_summary", "description", "note", "notes", "seller_situation") : "";
  const status = (await loadRoomStatus(roomId)) as "active" | "saved" | "archived" | "deleted";
  const sourceRoute = `/pain-room/${encodeURIComponent(roomId)}`;

  return (
    <main style={page}>
      <div style={wrap}>
        <section style={card}>
          <div style={eyebrow}>VaultForge Pressure Command Room</div>
          <h1 style={{ fontSize: "clamp(48px,10vw,104px)", lineHeight: 0.82, letterSpacing: "-.08em", margin: "12px 0 18px", overflowWrap: "anywhere" }}>
            {title}
          </h1>
          <p style={{ ...muted, fontSize: 20, maxWidth: 980 }}>{summary || error || "This pressure room is connected to the unified command system."}</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 22 }}>
            <Link href="/pressure-rooms" style={redPill}>Pressure Rooms</Link>
            <Link href="/pressure-rooms?folder=saved" style={pill}>Saved</Link>
            <Link href="/pressure-rooms?folder=archived" style={pill}>Archived</Link>
            <Link href="/pressure-rooms?folder=deleted" style={pill}>Hidden</Link>
            <Link href="/dashboard" style={pill}>Dashboard</Link>
          </div>
        </section>

        <section style={card}>
          <div style={eyebrow}>Room Controls</div>
          <h2 style={{ fontSize: "clamp(34px,7vw,70px)", lineHeight: 0.88, letterSpacing: "-.06em", margin: "10px 0 14px" }}>
            Work it. Save it. Archive it. Hide it.
          </h2>
          <p style={{ color: "#cbd5e1", lineHeight: 1.6 }}>These controls are database-backed. The pressure room moves into the matching Pressure folder.</p>
          <VaultForgePressureActions roomId={roomId} roomTitle={title} sourceRoute={sourceRoute} status={status} variant="room" />
        </section>

        <section style={card}>
          <div style={eyebrow}>Pressure Intelligence Brief</div>
          <h2 style={{ fontSize: "clamp(34px,7vw,66px)", lineHeight: 0.9, letterSpacing: "-.06em", margin: "10px 0 16px" }}>
            Problem, urgency, and execution context.
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 10, marginTop: 16 }}>
            <Metric label="Market" value={field(row || {}, "market", "city_state", "location") || [field(row || {}, "city", "area"), field(row || {}, "county"), field(row || {}, "state")].filter(Boolean).join(", ")} />
            <Metric label="Pressure Type" value={field(row || {}, "pain_type", "problem_type", "asset_type", "property_type", "deal_type")} />
            <Metric label="Urgency" value={field(row || {}, "urgency", "priority", "timeline")} />
            <Metric label="Status" value={field(row || {}, "status", "routing_status", "stage")} />
            <Metric label="Capital Need" value={field(row || {}, "capital_needed", "funding_needed", "gap_amount")} />
            <Metric label="Operator Need" value={field(row || {}, "operator_needed", "contractor_needed", "routing_needs", "deal_needs")} />
            <Metric label="Contact" value={field(row || {}, "owner_email", "member_email", "contact_email", "seller_email", "owner_phone", "seller_phone")} />
            <Metric label="Address / Area" value={field(row || {}, "address", "area", "submarket")} />
          </div>
        </section>
      </div>
    </main>
  );
}
