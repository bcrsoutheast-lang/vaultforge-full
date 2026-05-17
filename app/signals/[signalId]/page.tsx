import Link from "next/link";
import { cookies, headers } from "next/headers";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type AnyRow = Record<string, any>;

function clean(value: unknown) { return String(value || "").trim(); }
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
function metadataOf(row: AnyRow) { return row && typeof row.metadata === "object" && row.metadata ? row.metadata : {}; }
function field(row: AnyRow, ...keys: string[]) { const m = metadataOf(row); const values: unknown[] = []; for (const key of keys) { values.push(row?.[key]); values.push(m?.[key]); } return first(...values); }
async function baseUrl() { const h = await headers(); const host = h.get("x-forwarded-host") || h.get("host") || ""; const proto = h.get("x-forwarded-proto") || "https"; return host ? `${proto}://${host}` : ""; }
async function requestEmail() { const cookieStore = await cookies(); return clean(cookieStore.get("vf_email")?.value || cookieStore.get("vf_member_email")?.value || cookieStore.get("vf_admin_email")?.value || "bcrsoutheast@gmail.com").toLowerCase(); }
async function getJson(path: string) { const origin = await baseUrl(); const email = await requestEmail(); if (!origin) return { ok: false, error: "Missing origin." }; const join = path.includes("?") ? "&" : "?"; const response = await fetch(`${origin}${path}${join}email=${encodeURIComponent(email)}&owner=1`, { cache: "no-store", headers: { "x-vf-email": email, "x-vf-admin": email === "bcrsoutheast@gmail.com" ? "1" : "0" } }); const data = await response.json().catch(() => ({})); if (!response.ok || data?.ok === false) return { ok: false, error: clean(data?.error || data?.details || `Request failed with ${response.status}.`), data }; return { ok: true, data }; }
async function loadSignal(signalId: string) {
  const pain = await getJson(`/api/pain/feed?id=${encodeURIComponent(signalId)}`);
  const painRow = pain.data?.pain || pain.data?.pains?.[0] || pain.data?.items?.[0] || pain.data?.signals?.[0] || pain.data?.data?.[0] || null;
  if (painRow) return { row: painRow, sourceType: "pressure", error: "" };

  const deal = await getJson(`/api/deal/feed?id=${encodeURIComponent(signalId)}`);
  const dealRow = deal.data?.deal || deal.data?.deals?.[0] || deal.data?.projects?.[0] || deal.data?.items?.[0] || null;
  if (dealRow) return { row: dealRow, sourceType: "opportunity", error: "" };

  const routing = await getJson(`/api/routing/actions?signal_id=${encodeURIComponent(signalId)}`);
  const action = Array.isArray(routing.data?.actions) ? routing.data.actions[0] : null;
  return { row: action || null, sourceType: action ? "routing" : "signal", error: pain.error || deal.error || routing.error || "No matching signal payload resolved." };
}
function parseArray(value: unknown): any[] { if (Array.isArray(value)) return value; if (typeof value === "string" && value.trim()) { try { const parsed = JSON.parse(value); return Array.isArray(parsed) ? parsed : []; } catch { return value.split(/[,\n|;]/).map((x) => x.trim()).filter(Boolean); } } return []; }
function photosFrom(row: AnyRow) { const m = metadataOf(row); const raw = [row?.image_url, row?.photo_url, row?.main_photo_url, m?.image_url, m?.photo_url, m?.main_photo_url, ...parseArray(row?.photo_urls), ...parseArray(row?.photos), ...parseArray(m?.photo_urls), ...parseArray(m?.photos)]; return Array.from(new Set(raw.map((item: any) => typeof item === "string" ? clean(item) : clean(item?.url || item?.publicUrl || item?.public_url || item?.photo_url || item?.image_url)).filter((url) => url.startsWith("http")))); }
function textList(...values: unknown[]) { const out: string[] = []; values.forEach((value) => { if (Array.isArray(value)) value.forEach((item) => out.push(clean(item))); else out.push(...clean(value).split(/\n|•|\d+\.\s+|;/g)); }); return Array.from(new Set(out.map(clean).filter(Boolean))).slice(0, 10); }
const page: React.CSSProperties = { minHeight: "100vh", background: "radial-gradient(circle at top left, rgba(232,196,107,.16), transparent 30%), linear-gradient(180deg,#020814,#071326 52%,#020814)", color: "white", padding: "24px 16px 90px", fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" };
const wrap: React.CSSProperties = { maxWidth: 1180, margin: "0 auto", display: "grid", gap: 18 };
const card: React.CSSProperties = { border: "1px solid rgba(232,196,107,.22)", background: "linear-gradient(135deg,rgba(18,24,42,.96),rgba(8,19,35,.96))", borderRadius: 24, padding: 24, boxShadow: "0 24px 70px rgba(0,0,0,.28)" };
const softCard: React.CSSProperties = { border: "1px solid rgba(148,163,184,.18)", background: "rgba(15,23,42,.78)", borderRadius: 22, padding: 18 };
const eyebrow: React.CSSProperties = { color: "#f4d477", textTransform: "uppercase", letterSpacing: ".18em", fontWeight: 900, fontSize: 13 };
const muted: React.CSSProperties = { color: "#cbd5e1", lineHeight: 1.55 };
const pill: React.CSSProperties = { display: "inline-flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(148,163,184,.24)", background: "rgba(255,255,255,.06)", borderRadius: 999, padding: "11px 14px", color: "white", textDecoration: "none", fontWeight: 900, fontSize: 14 };
const goldPill: React.CSSProperties = { ...pill, background: "linear-gradient(135deg,#fde68a,#e8c46b)", color: "#111827", border: "0" };
function display(value: string, fallback = "Not listed") { return clean(value) || fallback; }
function Metric({ label, value }: { label: string; value: string }) { return <div style={{ border: "1px solid rgba(148,163,184,.16)", background: "rgba(2,6,23,.38)", borderRadius: 16, padding: 12 }}><div style={{ color: "#94a3b8", fontSize: 11, textTransform: "uppercase", letterSpacing: ".12em", fontWeight: 900 }}>{label}</div><div style={{ color: "white", fontSize: 16, fontWeight: 900, marginTop: 4, overflowWrap: "anywhere" }}>{display(value)}</div></div>; }
export default async function SignalRoomPage({ params }: { params: Promise<{ signalId: string }> }) {
  const { signalId } = await params;
  const { row, sourceType, error } = await loadSignal(signalId);
  const title = row ? field(row, "title", "deal_title", "project_title", "pain_title", "problem_title", "headline", "name", "address") || "Signal Room" : "Signal room not loaded";
  const summary = row ? field(row, "ai_summary", "summary", "route_summary", "ai_route_summary", "routing_summary", "description", "note", "notes", "requested_help", "help_requested") : "";
  const roomId = row ? field(row, "id", "signal_id", "deal_id", "project_id", "pain_id", "item_id", "canonical_event_id") || signalId : signalId;
  const sourceId = row ? field(row, "deal_id", "project_id", "pain_id", "item_id", "id") || signalId : signalId;
  const sourceHref = sourceType === "pressure" ? `/pain-room/${encodeURIComponent(sourceId)}` : sourceType === "opportunity" ? `/deal/detail?id=${encodeURIComponent(sourceId)}` : sourceType === "routing" ? `/routing-room/${encodeURIComponent(signalId)}` : "";
  const photos = row ? photosFrom(row) : [];
  const nextMoves = row ? textList(metadataOf(row).best_actions, row.best_actions, metadataOf(row).suggested_routes, row.suggested_routes, row.recommended_actions, row.ai_next_steps) : [];
  return <main style={page}><div style={wrap}><section style={card}><div style={eyebrow}>VaultForge Signal Intelligence Room</div><h1 style={{ fontSize: "clamp(42px,9vw,84px)", lineHeight: .88, letterSpacing: "-.06em", margin: "12px 0 18px", overflowWrap: "anywhere" }}>{title}</h1><p style={{ ...muted, fontSize: 20, maxWidth: 980 }}>{summary || error || "Signal room opened, but no source intelligence resolved yet."}</p><div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 22 }}><Link href="/intelligence" style={pill}>Back To Intelligence</Link><Link href="/alerts" style={pill}>Alerts</Link><Link href="/dashboard" style={pill}>Command</Link><Link href={`/routing-room/${encodeURIComponent(signalId)}`} style={pill}>Routing Room</Link>{sourceHref ? <Link href={sourceHref} style={pill}>Open Source Room</Link> : null}<Link href={`/message-command/${encodeURIComponent("signal:" + roomId)}`} style={goldPill}>Internal Thread</Link></div></section><section style={card}><div style={eyebrow}>Signal Source</div><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 10, marginTop: 16 }}><Metric label="Signal ID" value={signalId} /><Metric label="Resolved Type" value={sourceType} /><Metric label="Room ID" value={roomId} /><Metric label="Source Table" value={field(row || {}, "source_table", "_source_table") || "direct API lookup"} /><Metric label="Market" value={field(row || {}, "market") || [field(row || {}, "city"), field(row || {}, "state", "operating_state")].filter(Boolean).join(", ")} /><Metric label="Asset / Type" value={field(row || {}, "asset_type", "property_type", "deal_type", "pain_type", "problem_type", "signal_type")} /><Metric label="Priority" value={field(row || {}, "priority", "urgency", "urgency_level")} /><Metric label="Status" value={field(row || {}, "status", "routing_status", "pain_status")} /></div></section><section style={card}><div style={eyebrow}>Signal Intelligence Brief</div><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 14 }}><div style={softCard}><h3 style={{ margin: "0 0 10px", fontSize: 24 }}>AI / Signal Summary</h3><p style={muted}>{summary || "No signal summary resolved from this source payload yet."}</p></div><div style={softCard}><h3 style={{ margin: "0 0 10px", fontSize: 24 }}>Route Context</h3><p style={muted}>{field(row || {}, "routing_needs", "deal_needs", "needs", "requested_help", "help_requested", "route_context") || "No route context resolved yet."}</p></div></div>{nextMoves.length ? <div style={{ ...softCard, marginTop: 16 }}><h3 style={{ margin: "0 0 10px", fontSize: 24 }}>AI Next Moves / Suggested Routes</h3><ol style={{ margin: 0, paddingLeft: 22, color: "#cbd5e1", lineHeight: 1.7 }}>{nextMoves.map((step) => <li key={step}>{step}</li>)}</ol></div> : null}{photos.length ? <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12, marginTop: 16 }}>{photos.map((src, index) => <img key={src + index} src={src} alt={`${title} photo ${index + 1}`} style={{ width: "100%", height: 190, objectFit: "cover", borderRadius: 18, border: "1px solid rgba(148,163,184,.18)" }} />)}</div> : <div style={{ ...softCard, marginTop: 16, color: "#cbd5e1" }}>No photos resolved from this signal payload.</div>}</section></div></main>;
}
