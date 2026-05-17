import Link from "next/link";
import { cookies, headers } from "next/headers";
import VaultForgeDealActions from "../../components/VaultForgeDealActions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type AnyRow = Record<string, any>;
type SearchParams = Record<string, string | string[] | undefined>;

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
  const metadata = metadataOf(row);
  const values: unknown[] = [];

  for (const key of keys) {
    values.push(row?.[key], metadata?.[key]);
  }

  return first(...values);
}

function parseArray(value: unknown): any[] {
  if (Array.isArray(value)) return value;

  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return value.split(/[,\n|;]/).map((item) => item.trim()).filter(Boolean);
    }
  }

  return [];
}

function photoUrl(item: any) {
  if (typeof item === "string") return clean(item);

  if (item && typeof item === "object") {
    return clean(item.url || item.publicUrl || item.public_url || item.photo_url || item.image_url || item.src || item.href);
  }

  return "";
}

function photosFrom(row: AnyRow) {
  const metadata = metadataOf(row);

  const raw = [
    row?.main_photo_url,
    row?.primary_photo_url,
    row?.photo_url,
    row?.image_url,
    metadata?.main_photo_url,
    metadata?.primary_photo_url,
    metadata?.photo_url,
    metadata?.image_url,
    ...parseArray(row?.photo_urls),
    ...parseArray(row?.photos),
    ...parseArray(row?.images),
    ...parseArray(row?.files),
    ...parseArray(metadata?.photo_urls),
    ...parseArray(metadata?.photos),
    ...parseArray(metadata?.images),
    ...parseArray(metadata?.files),
  ];

  return Array.from(new Set(raw.map(photoUrl).filter((url) => url.startsWith("http"))));
}

function firstParam(searchParams: SearchParams) {
  const keys = ["id", "deal_id", "project_id", "item_id", "room_id", "property_id", "signal_id"];

  for (const key of keys) {
    const value = searchParams[key];
    const text = Array.isArray(value) ? value[0] : value;
    if (text) return String(text).trim();
  }

  return "";
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
    const response = await fetch(
      `${origin}/api/room/status?room_type=opportunity&email=${encodeURIComponent(email)}`,
      {
        cache: "no-store",
        headers: { "x-vf-email": email },
      }
    );

    const data = await response.json().catch(() => ({}));
    const status = String(data?.rooms?.[roomId]?.status || "active");

    if (status === "saved" || status === "archived" || status === "deleted") return status;
  } catch {
    // Ignore.
  }

  return "active";
}

async function loadDeal(id: string) {
  const origin = await baseUrl();
  const email = await requestEmail();

  if (!origin || !id) return { row: null as AnyRow | null, error: "Missing origin or room id." };

  const urls = [
    `${origin}/api/deal/feed?id=${encodeURIComponent(id)}&email=${encodeURIComponent(email)}&owner=1`,
    `${origin}/api/deal/detail?id=${encodeURIComponent(id)}&email=${encodeURIComponent(email)}&owner=1`,
    `${origin}/api/projects?id=${encodeURIComponent(id)}&email=${encodeURIComponent(email)}&owner=1`,
  ];

  for (const url of urls) {
    try {
      const response = await fetch(url, {
        cache: "no-store",
        headers: {
          "x-vf-email": email,
          "x-vf-admin": email === "bcrsoutheast@gmail.com" ? "1" : "0",
        },
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok && data?.ok !== false) {
        const row =
          data?.deal ||
          data?.project ||
          data?.deals?.[0] ||
          data?.projects?.[0] ||
          data?.items?.[0] ||
          data?.rows?.[0] ||
          data?.data?.[0] ||
          null;

        if (row) return { row, error: "" };
      }
    } catch {
      // Try next endpoint.
    }
  }

  return { row: null, error: "No matching opportunity room returned from deal APIs." };
}

function money(value: string) {
  const n = Number(String(value).replace(/[$,\s]/g, ""));

  if (Number.isFinite(n) && n > 0) {
    return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  }

  return value || "Not listed";
}

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(232,196,107,.16), transparent 30%), linear-gradient(180deg,#020814,#071326 52%,#020814)",
  color: "white",
  padding: "24px 16px 90px",
  fontFamily:
    "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
};

const wrap: React.CSSProperties = { maxWidth: 1180, margin: "0 auto", display: "grid", gap: 18 };

const card: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.26)",
  background:
    "radial-gradient(circle at top left, rgba(232,196,107,.12), transparent 34%), linear-gradient(135deg,rgba(18,24,42,.97),rgba(8,19,35,.98))",
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
  color: "#f4d477",
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

const goldPill: React.CSSProperties = {
  ...pill,
  background: "linear-gradient(135deg,#fde68a,#e8c46b)",
  color: "#111827",
  border: "0",
};

function Metric({ label, value }: { label: string; value: string }) {
  if (!clean(value)) return null;

  return (
    <div style={softCard}>
      <div style={eyebrow}>{label}</div>
      <div style={{ color: "white", fontSize: 20, fontWeight: 900, marginTop: 8, overflowWrap: "anywhere" }}>
        {value}
      </div>
    </div>
  );
}

export default async function DealDetailPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const id = firstParam(params);
  const { row, error } = await loadDeal(id);
  const photos = row ? photosFrom(row) : [];

  const title = row
    ? field(row, "title", "deal_title", "project_title", "headline", "name", "address") || "Opportunity Room"
    : "Opportunity room not loaded";

  const summary = row
    ? field(row, "ai_summary", "summary", "route_summary", "ai_route_summary", "routing_summary", "description", "note", "notes")
    : "";

  const roomId = row ? field(row, "id", "deal_id", "project_id", "item_id", "canonical_event_id") || id : id;
  const roomStatus = (await loadRoomStatus(roomId)) as "active" | "saved" | "archived" | "deleted";
  const sourceRoute = `/deal/detail?id=${encodeURIComponent(roomId)}`;

  return (
    <main style={page}>
      <div style={wrap}>
        <section style={card}>
          <div style={eyebrow}>VaultForge Deal Command Room</div>

          <h1
            style={{
              fontSize: "clamp(48px,10vw,104px)",
              lineHeight: 0.82,
              letterSpacing: "-.08em",
              margin: "12px 0 18px",
              overflowWrap: "anywhere",
            }}
          >
            {title}
          </h1>

          <div style={{ color: "#f8e7b0", fontSize: 38, fontWeight: 1000, letterSpacing: "-.05em", marginBottom: 14 }}>
            {money(field(row || {}, "asking_price", "price", "ask", "purchase_price", "target_price"))}
          </div>

          <p style={{ ...muted, fontSize: 20, maxWidth: 980 }}>
            {summary || error || "This room is connected to the unified command system."}
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 22 }}>
            <Link href="/projects" style={goldPill}>Projects</Link>
            <Link href="/projects?folder=saved" style={pill}>Saved</Link>
            <Link href="/projects?folder=archived" style={pill}>Archived</Link>
            <Link href="/projects?folder=deleted" style={pill}>Hidden</Link>
            <Link href="/dashboard" style={pill}>Dashboard</Link>
          </div>
        </section>

        <section style={card}>
          <div style={eyebrow}>Room Controls</div>
          <h2 style={{ fontSize: "clamp(34px,7vw,70px)", lineHeight: 0.88, letterSpacing: "-.06em", margin: "10px 0 14px" }}>
            Work it. Save it. Archive it. Hide it.
          </h2>
          <p style={{ color: "#cbd5e1", lineHeight: 1.6 }}>
            These controls are database-backed. The room moves into the matching Projects folder.
          </p>
          <VaultForgeDealActions roomId={roomId} roomTitle={title} sourceRoute={sourceRoute} status={roomStatus} variant="room" />
        </section>

        {photos.length ? (
          <section style={card}>
            <div style={eyebrow}>Visual Evidence</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12, marginTop: 14 }}>
              {photos.map((src, index) => (
                <img
                  key={src + index}
                  src={src}
                  alt={`${title} photo ${index + 1}`}
                  style={{
                    width: "100%",
                    height: index === 0 ? 360 : 240,
                    objectFit: "cover",
                    borderRadius: 22,
                    border: "1px solid rgba(148,163,184,.18)",
                  }}
                />
              ))}
            </div>
          </section>
        ) : null}

        <section style={card}>
          <div style={eyebrow}>Opportunity Intelligence Brief</div>

          <h2
            style={{
              fontSize: "clamp(34px,7vw,66px)",
              lineHeight: 0.9,
              letterSpacing: "-.06em",
              margin: "10px 0 16px",
            }}
          >
            Data, routing, and execution context.
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 10, marginTop: 16 }}>
            <Metric label="Market" value={field(row || {}, "market", "city_state", "location") || [field(row || {}, "city", "area"), field(row || {}, "county"), field(row || {}, "state")].filter(Boolean).join(", ")} />
            <Metric label="Asset" value={field(row || {}, "asset_type", "property_type", "deal_type")} />
            <Metric label="Strategy" value={field(row || {}, "strategy", "exit_strategy", "investment_strategy")} />
            <Metric label="Status" value={field(row || {}, "status", "routing_status", "stage")} />
            <Metric label="Asking" value={money(field(row || {}, "asking_price", "price", "ask", "purchase_price"))} />
            <Metric label="ARV / Value" value={money(field(row || {}, "arv", "arv_value", "estimated_value", "after_repair_value"))} />
            <Metric label="Repairs / Work" value={money(field(row || {}, "repair_estimate", "repairs_needed", "estimated_repairs", "rehab_budget"))} />
            <Metric label="Capital Need" value={field(row || {}, "capital_needed", "funding_needed", "gap_amount")} />
            <Metric label="Beds / Baths" value={[field(row || {}, "beds", "bedrooms"), field(row || {}, "baths", "bathrooms")].filter(Boolean).join(" / ")} />
            <Metric label="Sq Ft" value={field(row || {}, "square_feet", "sqft", "building_sqft")} />
            <Metric label="Occupancy" value={field(row || {}, "occupancy", "occupancy_status", "tenant_status")} />
            <Metric label="Contact" value={field(row || {}, "owner_email", "member_email", "contact_email", "seller_email", "owner_phone", "seller_phone")} />
          </div>
        </section>
      </div>
    </main>
  );
}
