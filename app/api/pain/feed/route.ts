import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const OWNER_EMAIL = "bcrsoutheast@gmail.com";
type R = Record<string, any>;

function sb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";
  if (!url || !key) throw new Error("Missing Supabase environment values.");
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } });
}
function c(v: unknown) { return String(v || "").trim(); }
function ce(v: unknown) { return c(v).toLowerCase(); }
function first(...xs: unknown[]) { for (const x of xs) { if (Array.isArray(x)) { const f = x.find((i) => c(i)); if (f) return c(f); } else { const t = c(x); if (t) return t; } } return ""; }
function cookie(header: string, name: string) { const f = header.split(";").map((x) => x.trim()).find((x) => x.startsWith(`${name}=`)); if (!f) return ""; try { return decodeURIComponent(f.slice(name.length + 1)); } catch { return f.slice(name.length + 1); } }
function meta(r: R) { return typeof r?.metadata === "object" && r.metadata ? r.metadata : {}; }
function field(r: R, ...keys: string[]) { const m = meta(r); const vals: unknown[] = []; for (const k of keys) { vals.push(r[k], m[k]); } return first(...vals); }
function arr(v: unknown): any[] { if (Array.isArray(v)) return v; const s = c(v); if (!s) return []; try { const p = JSON.parse(s); if (Array.isArray(p)) return p; } catch {} return s.split(/[,\n|;]/).map((x) => x.trim()).filter(Boolean); }
function requestEmail(req: Request) { const u = new URL(req.url); const h = req.headers.get("cookie") || ""; return ce(req.headers.get("x-vf-email") || u.searchParams.get("email") || cookie(h, "vf_email") || cookie(h, "vf_member_email") || cookie(h, "vf_admin_email")); }
function isOwner(req: Request, email: string) { const u = new URL(req.url); const h = req.headers.get("cookie") || ""; return email === OWNER_EMAIL || c(req.headers.get("x-vf-admin")) === "1" || c(u.searchParams.get("owner")) === "1" || h.includes("vf_admin=1") || h.includes("isAdmin=true"); }

function photos(r: R) {
  const m = meta(r);
  const urls = [r.image_url, r.photo_url, r.main_photo_url, m.image_url, m.photo_url, m.main_photo_url, ...arr(r.photo_urls), ...arr(r.photos), ...arr(m.photo_urls), ...arr(m.photos)]
    .map((x: any) => typeof x === "string" ? c(x) : c(x?.url || x?.publicUrl || x?.public_url || x?.photo_url || x?.image_url))
    .filter((x) => x.startsWith("http"));
  const unique = Array.from(new Set(urls));
  return { image_url: unique[0] || "", photo_url: unique[0] || "", main_photo_url: unique[0] || "", photo_urls: unique, photos: unique.map((url) => ({ url })) };
}

function ownerEmail(r: R) { return ce(field(r, "owner_email", "member_email", "user_email", "submitted_by", "submitted_by_email", "email")); }
function canSee(r: R, email: string, owner: boolean) {
  if (owner) return true;
  if (!email) return false;
  const visible = [ownerEmail(r), ce(field(r, "visible_to_email", "recipient_email", "target_email", "assigned_to_email"))].filter(Boolean);
  return visible.length ? visible.includes(email) : false;
}
function idOf(r: R) { return field(r, "pain_id", "request_id", "item_id", "id", "signal_id", "alert_id"); }
function sigOf(r: R) { return field(r, "signal_id", "signalId", "alert_id", "routing_id"); }
function keyOf(r: R) { return field(r, "canonical_event_id", "signal_id", "pain_id", "request_id", "item_id", "id"); }
function titleOf(r: R) { return field(r, "title", "pain_title", "problem_title", "headline", "name", "address") || "Pain Request"; }
function summaryOf(r: R) { return field(r, "problem_description", "pain_description", "description", "summary", "ai_summary", "note", "notes", "message", "help_requested", "requested_help", "route_summary", "ai_route_summary", "routing_summary"); }
function marketOf(r: R) { const city = field(r, "city"); const state = field(r, "state", "market", "operating_state"); return [city, state].filter(Boolean).join(", ") || field(r, "location", "address") || "Market not listed"; }

function normalize(r: R, table: string) {
  const m = meta(r), ph = photos(r), id = idOf(r), sig = sigOf(r), key = keyOf(r) || sig || id;
  const summary = summaryOf(r);
  return {
    ...m, ...r,
    id, pain_id: field(r, "pain_id") || id, request_id: field(r, "request_id") || id, item_id: field(r, "item_id") || id,
    signal_id: sig || key, canonical_event_id: key,
    title: titleOf(r), pain_title: field(r, "pain_title") || titleOf(r), problem_title: field(r, "problem_title") || titleOf(r),
    summary, description: field(r, "description", "problem_description", "pain_description") || summary,
    route_summary: field(r, "route_summary", "ai_route_summary", "routing_summary") || summary,
    ai_route_summary: field(r, "ai_route_summary", "route_summary", "routing_summary") || summary,
    routing_summary: field(r, "routing_summary", "route_summary", "ai_route_summary") || summary,
    owner_email: ownerEmail(r), member_email: field(r, "member_email") || ownerEmail(r), user_email: field(r, "user_email") || ownerEmail(r),
    status: field(r, "status", "pain_status", "routing_status") || "new",
    pain_status: field(r, "pain_status", "status", "routing_status") || "new",
    urgency: field(r, "urgency", "urgency_level", "priority"), urgency_level: field(r, "urgency_level", "urgency", "priority"), priority: field(r, "priority", "urgency", "urgency_level"),
    pain_type: field(r, "pain_type", "problem_type", "asset_type", "property_type"), problem_type: field(r, "problem_type", "pain_type", "asset_type", "property_type"), asset_type: field(r, "asset_type", "property_type", "pain_type", "problem_type"), property_type: field(r, "property_type", "asset_type", "pain_type", "problem_type"),
    requested_help: field(r, "requested_help", "help_requested", "routing_needs", "needs"), help_requested: field(r, "help_requested", "requested_help", "routing_needs", "needs"), routing_needs: field(r, "routing_needs", "needs", "requested_help", "help_requested"), needs: field(r, "needs", "routing_needs", "requested_help", "help_requested"),
    city: field(r, "city"), state: field(r, "state"), market: marketOf(r), address: field(r, "address", "property_address", "location"), location: field(r, "location", "address", "property_address"),
    asking_price: field(r, "asking_price", "price", "target_price"), price: field(r, "price", "asking_price", "target_price"),
    arv: field(r, "arv", "arv_value", "estimated_value", "property_value"), arv_value: field(r, "arv_value", "arv", "estimated_value", "property_value"),
    repair_estimate: field(r, "repair_estimate", "repairs_needed", "estimated_repairs", "repair_budget"), repairs_needed: field(r, "repairs_needed", "repair_estimate", "estimated_repairs", "repair_budget"),
    capital_needed: field(r, "capital_needed", "funding_needed", "gap_amount"), funding_needed: field(r, "funding_needed", "capital_needed", "gap_amount"), gap_amount: field(r, "gap_amount", "capital_needed", "funding_needed"),
    beds: field(r, "beds", "bedrooms"), bedrooms: field(r, "bedrooms", "beds"), baths: field(r, "baths", "bathrooms"), bathrooms: field(r, "bathrooms", "baths"), sqft: field(r, "sqft", "square_feet", "building_sqft"), square_feet: field(r, "square_feet", "sqft", "building_sqft"), acres: field(r, "acres", "land_acres"), land_acres: field(r, "land_acres", "acres"),
    occupancy: field(r, "occupancy", "tenant_status", "vacancy_status"), zoning: field(r, "zoning", "land_use"), timeline: field(r, "timeline", "deadline", "desired_timeline"), owner_goal: field(r, "owner_goal", "goal", "desired_outcome", "exit_strategy", "strategy"),
    detail_href: id ? `/pain-room/${encodeURIComponent(id)}` : "/pain-feed",
    direct_links: m.direct_links || r.direct_links || {}, created_at: field(r, "created_at", "updated_at") || new Date().toISOString(), updated_at: field(r, "updated_at", "created_at") || new Date().toISOString(),
    source_table: table, _source_table: table, ...ph, metadata: m,
  };
}

function painish(r: R, table: string) {
  const source = field(r, "source", "source_table").toLowerCase();
  const type = field(r, "signal_type", "type").toLowerCase();
  return table.includes("pain") || source.includes("pain") || type.includes("pain") || Boolean(field(r, "pain_id", "request_id"));
}

async function selectRecent(client: any, table: string) {
  for (const col of ["created_at", "updated_at", "id"]) {
    try { const { data, error } = await client.from(table).select("*").order(col, { ascending: false }).limit(250); if (!error && Array.isArray(data)) return data; } catch {}
  }
  try { const { data, error } = await client.from(table).select("*").limit(250); if (!error && Array.isArray(data)) return data; } catch {}
  return [];
}

function score(r: R) {
  let n = 0;
  for (const k of ["title","summary","description","requested_help","urgency","city","state","pain_type","asset_type","photo_urls","main_photo_url"]) if (field(r,k)) n++;
  if (r._source_table === "vf_pain_submissions") n += 100;
  if (String(r._source_table || "").includes("pain")) n += 20;
  return n;
}
function merge(primary: R, secondary: R) { return normalize({ ...secondary, ...primary, metadata: { ...meta(secondary), ...meta(primary) } }, first(primary._source_table, secondary._source_table, "merged")); }

export async function GET(request: Request) {
  try {
    const url = new URL(request.url), email = requestEmail(request), owner = isOwner(request, email), id = c(url.searchParams.get("id") || "");
    if (!email) return NextResponse.json({ ok: false, error: "Login email required." }, { status: 401 });
    const client = sb();
    const tables = ["vf_pain_submissions","vf_pain_requests","pain_requests","vf_pain_signals","pain_signals","vf_routing_signals","vf_routing_actions","vf_activity_events"];
    const rows: R[] = [];
    for (const table of tables) {
      const data = await selectRecent(client, table);
      for (const row of data) {
        if (!painish(row, table) || !canSee(row, email, owner)) continue;
        const n = normalize(row, table);
        if (id) {
          const ids = [n.id,n.pain_id,n.request_id,n.item_id,n.signal_id,n.canonical_event_id].map(c);
          if (!ids.includes(id)) continue;
        }
        rows.push(n);
      }
    }
    const by = new Map<string, R>();
    for (const row of rows) {
      const key = first(row.canonical_event_id, row.pain_id, row.request_id, row.item_id, row.signal_id, row.id, row.title);
      if (!key) continue;
      const existing = by.get(key);
      if (!existing) { by.set(key, row); continue; }
      const better = score(row) >= score(existing);
      by.set(key, merge(better ? row : existing, better ? existing : row));
    }
    const pains = Array.from(by.values()).sort((a,b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    return NextResponse.json({ ok: true, pains, items: pains, signals: pains, data: pains, pain: id ? pains[0] || null : null, count: pains.length, source: "api/pain/feed" });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: "Could not load pain feed.", details: error?.message || String(error) }, { status: 500 });
  }
}
