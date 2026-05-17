import Link from "next/link";
import { cookies, headers } from "next/headers";

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
    values.push(row?.[key]);
    values.push(metadata?.[key]);
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
      return value
        .split(/[,\n|;]/)
        .map((item) => item.trim())
        .filter(Boolean);
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
    row?.image_url,
    row?.photo_url,
    row?.main_photo_url,
    row?.primary_photo_url,
    metadata?.image_url,
    metadata?.photo_url,
    metadata?.main_photo_url,
    metadata?.primary_photo_url,
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
      "bcrsoutheast@gmail.com"
  ).toLowerCase();
}

async function loadDeal(id: string) {
  const origin = await baseUrl();
  const email = await requestEmail();
  if (!origin || !id) return { row: null as AnyRow | null, error: "Missing origin or room id." };

  const url = `${origin}/api/deal/feed?id=${encodeURIComponent(id)}&email=${encodeURIComponent(email)}&owner=1`;

  try {
    const response = await fetch(url, {
      cache: "no-store",
      headers: {
        "x-vf-email": email,
        "x-vf-admin": email === "bcrsoutheast@gmail.com" ? "1" : "0",
      },
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || data?.ok === false) {
      return { row: null, error: clean(data?.error || data?.details || `Deal feed failed with ${response.status}.`) };
    }

    const row = data?.deal || data?.deals?.[0] || data?.projects?.[0] || data?.items?.[0] || null;
    return { row, error: row ? "" : "No matching opportunity room returned from /api/deal/feed." };
  } catch (error: any) {
    return { row: null, error: error?.message || "Could not load opportunity room." };
  }
}

const page: React.CSSProperties = {
  minHeight: "100vh",
  background: "radial-gradient(circle at top left, rgba(232,196,107,.16), transparent 30%), linear-gradient(180deg,#020814,#071326 52%,#020814)",
  color: "white",
  padding: "24px 16px 90px",
  fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
};

const wrap: React.CSSProperties = { maxWidth: 1180, margin: "0 auto", display: "grid", gap: 18 };
const card: React.CSSProperties = { border: "1px solid rgba(232,196,107,.22)", background: "linear-gradient(135deg,rgba(18,24,42,.96),rgba(8,19,35,.96))", borderRadius: 24, padding: 24, boxShadow: "0 24px 70px rgba(0,0,0,.28)" };
const softCard: React.CSSProperties = { border: "1px solid rgba(148,163,184,.18)", background: "rgba(15,23,42,.78)", borderRadius: 22, padding: 18 };
const eyebrow: React.CSSProperties = { color: "#f4d477", textTransform: "uppercase", letterSpacing: ".18em", fontWeight: 900, fontSize: 13 };
const muted: React.CSSProperties = { color: "#cbd5e1", lineHeight: 1.55 };
const pill: React.CSSProperties = { display: "inline-flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(148,163,184,.24)", background: "rgba(255,255,255,.06)", borderRadius: 999, padding: "11px 14px", color: "white", textDecoration: "none", fontWeight: 900, fontSize: 14 };
const goldPill: React.CSSProperties = { ...pill, background: "linear-gradient(135deg,#fde68a,#e8c46b)", color: "#111827", border: "0" };

function display(value: string, fallback = "Not listed") {
  return clean(value) || fallback;
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ border: "1px solid rgba(148,163,184,.16)", background: "rgba(2,6,23,.38)", borderRadius: 16, padding: 12 }}>
      <div style={{ color: "#94a3b8", fontSize: 11, textTransform: "uppercase", letterSpacing: ".12em", fontWeight: 900 }}>{label}</div>
      <div style={{ color: "white", fontSize: 16, fontWeight: 900, marginTop: 4, overflowWrap: "anywhere" }}>{display(value)}</div>
    </div>
  );
}

function splitList(...values: unknown[]) {
  const text = first(...values);
  if (!text) return [] as string[];
  return text
    .split(/\n|•|\d+\.\s+|;/g)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 10);
}

export default async function DealDetailPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const id = firstParam(params);
  const { row, error } = await loadDeal(id);
  const photos = row ? photosFrom(row) : [];

  const title = row ? field(row, "title", "deal_title", "project_title", "headline", "name", "address") || "Opportunity Room" : "Opportunity room not loaded";
  const summary = row ? field(row, "ai_summary", "summary", "route_summary", "ai_route_summary", "routing_summary", "description", "note", "notes") : "";
  const bestFit = row ? field(row, "ai_best_fit", "best_fit", "route_summary", "ai_route_summary", "routing_summary", "routing_needs", "deal_needs", "needs") : "";
  const nextMoves = row ? splitList(row.best_actions, row.ai_next_steps, row.next_steps, row.recommended_actions, metadataOf(row).best_actions, metadataOf(row).suggested_routes) : [];
  const roomId = row ? field(row, "id", "deal_id", "project_id", "item_id", "canonical_event_id") || id : id;
  const sourceTable = row ? field(row, "source_table", "_source_table") || "api/deal/feed" : "api/deal/feed";

  return (
    <main style={page}>
      <div style={wrap}>
        <section style={card}>
          <div style={eyebrow}>VaultForge Opportunity Execution Room</div>
          <h1 style={{ fontSize: "clamp(42px,9vw,84px)", lineHeight: 0.88, letterSpacing: "-.06em", margin: "12px 0 18px", overflowWrap: "anywhere" }}>{title}</h1>
          <p style={{ ...muted, fontSize: 20, maxWidth: 980 }}>{summary || error || "This opportunity room opened, but the source API did not return a full payload for this id."}</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 22 }}>
            <Link href="/opportunity-rooms" style={pill}>Back To Opportunity Lane</Link>
            <Link href="/projects" style={pill}>Projects</Link>
            <Link href="/dashboard" style={pill}>Command</Link>
            <Link href={`/message-command/${encodeURIComponent("opportunity:" + roomId)}`} style={goldPill}>Internal Thread</Link>
          </div>
        </section>

        <section style={card}>
          <div style={eyebrow}>Live Source Payload</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
            <span style={{ ...pill, color: "#86efac", padding: "7px 10px", fontSize: 12 }}>Room: {roomId || "missing-id"}</span>
            <span style={{ ...pill, color: "#93c5fd", padding: "7px 10px", fontSize: 12 }}>Source: {sourceTable}</span>
            <span style={{ ...pill, color: error ? "#fecaca" : "#86efac", padding: "7px 10px", fontSize: 12 }}>{error ? "Needs API match" : "Loaded from /api/deal/feed"}</span>
          </div>
        </section>

        <section style={card}>
          <div style={eyebrow}>Opportunity Intelligence Brief</div>
          <h2 style={{ fontSize: "clamp(32px,7vw,58px)", lineHeight: 0.95, letterSpacing: "-.05em", margin: "10px 0 16px" }}>Deal data, AI summary, and routing context.</h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 14 }}>
            <div style={softCard}>
              <h3 style={{ margin: "0 0 10px", fontSize: 24 }}>AI / Deal Summary</h3>
              <p style={muted}>{summary || "No AI/deal summary resolved from this saved row yet."}</p>
            </div>
            <div style={softCard}>
              <h3 style={{ margin: "0 0 10px", fontSize: 24 }}>Best Fit / Routing Need</h3>
              <p style={muted}>{bestFit || "No best-fit or routing need resolved from this saved row yet."}</p>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 10, marginTop: 16 }}>
            <Metric label="Market" value={field(row || {}, "market", "city_state") || [field(row || {}, "city"), field(row || {}, "state")].filter(Boolean).join(", ")} />
            <Metric label="Asset" value={field(row || {}, "asset_type", "property_type", "deal_type")} />
            <Metric label="Strategy" value={field(row || {}, "strategy", "exit_strategy", "investment_strategy")} />
            <Metric label="Status" value={field(row || {}, "status", "routing_status", "stage")} />
            <Metric label="Asking" value={field(row || {}, "asking_price", "price", "ask", "purchase_price")} />
            <Metric label="ARV / Value" value={field(row || {}, "arv", "arv_value", "estimated_value", "after_repair_value")} />
            <Metric label="Repairs / Work" value={field(row || {}, "repair_estimate", "repairs_needed", "estimated_repairs", "rehab_budget")} />
            <Metric label="Capital Need" value={field(row || {}, "capital_needed", "funding_needed", "gap_amount")} />
            <Metric label="Beds / Baths" value={[field(row || {}, "beds", "bedrooms"), field(row || {}, "baths", "bathrooms")].filter(Boolean).join(" / ")} />
            <Metric label="Sq Ft" value={field(row || {}, "square_feet", "sqft", "building_sqft")} />
            <Metric label="Occupancy" value={field(row || {}, "occupancy", "occupancy_status", "tenant_status")} />
            <Metric label="Zoning / Acres" value={[field(row || {}, "zoning", "zoning_type"), field(row || {}, "acres", "land_acres")].filter(Boolean).join(" / ")} />
          </div>

          {nextMoves.length ? (
            <div style={{ ...softCard, marginTop: 16 }}>
              <h3 style={{ margin: "0 0 10px", fontSize: 24 }}>AI Next Moves</h3>
              <ol style={{ margin: 0, paddingLeft: 22, color: "#cbd5e1", lineHeight: 1.7 }}>
                {nextMoves.map((step) => <li key={step}>{step}</li>)}
              </ol>
            </div>
          ) : null}

          {photos.length ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12, marginTop: 16 }}>
              {photos.map((src, index) => (
                <img key={src + index} src={src} alt={`${title} photo ${index + 1}`} style={{ width: "100%", height: 190, objectFit: "cover", borderRadius: 18, border: "1px solid rgba(148,163,184,.18)" }} />
              ))}
            </div>
          ) : (
            <div style={{ ...softCard, marginTop: 16, color: "#cbd5e1" }}>No photos resolved from this opportunity payload.</div>
          )}
        </section>
      </div>
    </main>
  );
}
