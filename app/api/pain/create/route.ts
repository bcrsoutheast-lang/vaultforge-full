import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type R = Record<string, any>;
const PAIN_TABLES = ["vf_pain_submissions", "vf_pain_requests", "pain_requests", "vf_pain_signals", "pain_signals"];

function sb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    "";
  if (!url || !key) throw new Error("Missing Supabase environment values.");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
}

function c(v: unknown) { return String(v ?? "").trim(); }
function ce(v: unknown) { return c(v).toLowerCase(); }
function first(...xs: unknown[]) { for (const x of xs) { const t = c(x); if (t) return t; } return ""; }
function id(prefix: string) { return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`; }

function arr(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(c).filter(Boolean);
  const s = c(v);
  if (!s) return [];
  try { const p = JSON.parse(s); if (Array.isArray(p)) return p.map(c).filter(Boolean); } catch {}
  return s.split(/[,\n|;]/).map((x) => x.trim()).filter(Boolean);
}

function cookie(header: string, name: string) {
  const found = header.split(";").map((x) => x.trim()).find((x) => x.startsWith(`${name}=`));
  if (!found) return "";
  try { return decodeURIComponent(found.slice(name.length + 1)); } catch { return found.slice(name.length + 1); }
}

function json(data: R, status = 200) {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

function missingCol(e: any) {
  const text = `${e?.message || ""} ${e?.details || ""} ${e?.hint || ""}`;
  return (
    text.match(/column ["']?([a-zA-Z0-9_]+)["']? of relation/i)?.[1] ||
    text.match(/Could not find the ["']?([a-zA-Z0-9_]+)["']? column/i)?.[1] ||
    ""
  );
}

function isMissingCol(e: any) {
  const text = `${e?.code || ""} ${e?.message || ""} ${e?.details || ""}`.toLowerCase();
  return e?.code === "42703" || (text.includes("column") && text.includes("does not exist")) || text.includes("schema cache") || text.includes("could not find");
}

async function insertAdaptive(client: any, table: string, row: R) {
  let payload = { ...row };
  const attempts: R[] = [];
  for (let i = 0; i < 30; i++) {
    const { data, error } = await client.from(table).insert(payload).select("*").single();
    attempts.push({ table, ok: !error, error: error?.message || null, keys: Object.keys(payload) });
    if (!error && data) return { ok: true, table, data, attempts };
    if (!isMissingCol(error)) return { ok: false, table, error: error?.message || "Insert failed", attempts };
    const m = missingCol(error);
    if (!m || !(m in payload)) return { ok: false, table, error: error?.message || "Insert failed", attempts };
    delete payload[m];
  }
  return { ok: false, table, error: "Insert failed after schema retries.", attempts };
}

async function insertAny(client: any, rows: R[]) {
  const attempts: R[] = [];
  for (const table of PAIN_TABLES) {
    for (const row of rows) {
      const result = await insertAdaptive(client, table, row);
      attempts.push(...result.attempts);
      if (result.ok) return { ...result, attempts };
    }
  }
  return { ok: false, table: "", data: null, error: "Could not save pain into any known pain table.", attempts };
}

function summary(body: R) {
  const supplied = first(body.ai_summary, body.ai_route_summary, body.route_summary, body.routing_summary, body.summary);
  if (supplied) return supplied;
  return [
    `Pain: ${first(body.title, body.pain_title, body.problem_title, "Pain Request")}`,
    `Type: ${first(body.pain_type, body.problem_type, body.asset_type, body.property_type, "Problem")}`,
    `Market: ${[first(body.city), first(body.state)].filter(Boolean).join(", ") || first(body.market, "Not listed")}`,
    `Urgency: ${first(body.urgency, body.urgency_level, body.priority, "Not listed")}`,
    first(body.requested_help, body.help_requested, body.routing_needs, body.needs) ? `Help: ${first(body.requested_help, body.help_requested, body.routing_needs, body.needs)}` : "",
    first(body.capital_needed, body.funding_needed, body.gap_amount) ? `Capital: ${first(body.capital_needed, body.funding_needed, body.gap_amount)}` : "",
    first(body.problem_description, body.pain_description, body.description, body.note, body.notes) ? `Details: ${first(body.problem_description, body.pain_description, body.description, body.note, body.notes)}` : "",
  ].filter(Boolean).join(" | ");
}

function build(body: R, email: string, base: string) {
  const painId = first(body.pain_id, body.id, body.item_id) || id("pain");
  const signalId = first(body.signal_id, body.signalId) || `pain_signal_${painId}`;
  const title = first(body.title, body.pain_title, body.problem_title, body.headline, "Pain Request");
  const photos = Array.from(new Set([...arr(body.photo_urls), ...arr(body.photos), ...arr(body.files), ...arr(body.photoUrls)].filter(Boolean)));
  const sum = summary(body);
  const links = { pain_room: `${base}/pain-room/${encodeURIComponent(painId)}`, pain_feed: `${base}/pain-feed`, dashboard: `${base}/dashboard` };
  const now = new Date().toISOString();
  const common: R = {
    ...body,
    pain_id: painId,
    request_id: painId,
    item_id: painId,
    signal_id: signalId,
    canonical_event_id: signalId,
    owner_email: email,
    member_email: email,
    user_email: email,
    submitted_by: email,
    submitted_by_email: email,
    title,
    pain_title: title,
    problem_title: title,
    description: first(body.problem_description, body.pain_description, body.description, body.note, body.notes, sum),
    summary: sum,
    ai_summary: sum,
    route_summary: sum,
    ai_route_summary: sum,
    routing_summary: sum,
    status: "new",
    pain_status: "new",
    priority: first(body.priority, body.urgency, body.urgency_level, "new"),
    urgency: first(body.urgency, body.urgency_level, body.priority),
    urgency_level: first(body.urgency_level, body.urgency, body.priority),
    pain_type: first(body.pain_type, body.problem_type, body.asset_type, body.property_type),
    problem_type: first(body.problem_type, body.pain_type, body.asset_type, body.property_type),
    asset_type: first(body.asset_type, body.property_type, body.pain_type, body.problem_type),
    property_type: first(body.property_type, body.asset_type, body.pain_type, body.problem_type),
    requested_help: first(body.requested_help, body.help_requested, body.routing_needs, body.needs),
    help_requested: first(body.help_requested, body.requested_help, body.routing_needs, body.needs),
    routing_needs: first(body.routing_needs, body.needs, body.requested_help, body.help_requested),
    needs: first(body.needs, body.routing_needs, body.requested_help, body.help_requested),
    city: first(body.city),
    state: first(body.state),
    market: [first(body.city), first(body.state)].filter(Boolean).join(", ") || first(body.market),
    address: first(body.address, body.property_address, body.location),
    location: first(body.location, body.address, body.property_address),
    asking_price: first(body.asking_price, body.price, body.target_price),
    price: first(body.price, body.asking_price, body.target_price),
    arv: first(body.arv, body.arv_value, body.estimated_value, body.property_value),
    arv_value: first(body.arv_value, body.arv, body.estimated_value, body.property_value),
    repair_estimate: first(body.repair_estimate, body.repairs_needed, body.estimated_repairs, body.repair_budget),
    repairs_needed: first(body.repairs_needed, body.repair_estimate, body.estimated_repairs, body.repair_budget),
    capital_needed: first(body.capital_needed, body.funding_needed, body.gap_amount),
    beds: first(body.beds, body.bedrooms),
    bedrooms: first(body.bedrooms, body.beds),
    baths: first(body.baths, body.bathrooms),
    bathrooms: first(body.bathrooms, body.baths),
    sqft: first(body.sqft, body.square_feet, body.building_sqft),
    square_feet: first(body.square_feet, body.sqft, body.building_sqft),
    acres: first(body.acres, body.land_acres),
    land_acres: first(body.land_acres, body.acres),
    occupancy: first(body.occupancy, body.tenant_status, body.vacancy_status),
    zoning: first(body.zoning, body.land_use),
    timeline: first(body.timeline, body.deadline, body.desired_timeline),
    owner_goal: first(body.owner_goal, body.goal, body.desired_outcome, body.exit_strategy, body.strategy),
    main_photo_url: first(body.main_photo_url, body.image_url, body.photo_url, photos[0]),
    image_url: first(body.image_url, body.photo_url, body.main_photo_url, photos[0]),
    photo_url: first(body.photo_url, body.image_url, body.main_photo_url, photos[0]),
    photo_urls: photos,
    photos,
    direct_links: links,
    archived: false,
    deleted: false,
    created_at: now,
    updated_at: now,
  };
  const full = { ...common, metadata: { ...common, source: "pain_create_visible_room", source_table: "vf_pain_submissions" } };
  const core = { pain_id: painId, item_id: painId, signal_id: signalId, owner_email: email, member_email: email, title, description: common.description, summary: sum, status: "new", pain_type: common.pain_type, asset_type: common.asset_type, urgency: common.urgency, requested_help: common.requested_help, city: common.city, state: common.state, main_photo_url: common.main_photo_url, photo_urls: photos, metadata: full.metadata, created_at: now, updated_at: now };
  const minimal = { pain_id: painId, item_id: painId, signal_id: signalId, owner_email: email, member_email: email, title, summary: sum, status: "new", metadata: full.metadata, created_at: now, updated_at: now };
  return { painId, signalId, links, full, core, minimal, summary: sum };
}

async function background(client: any, p: ReturnType<typeof build>, email: string) {
  const now = new Date().toISOString();
  const meta = { ...p.full.metadata, pain_id: p.painId, item_id: p.painId, signal_id: p.signalId, direct_links: p.links };
  const signal = await insertAdaptive(client, "vf_routing_signals", { signal_id: p.signalId, item_id: p.painId, pain_id: p.painId, owner_email: email, member_email: email, title: p.full.title, signal_type: "pain", type: "pain", status: "new", priority: p.full.priority, urgency: p.full.urgency, note: p.summary, description: p.summary, route_summary: p.summary, source: "pain", source_table: "vf_pain_submissions", metadata: meta, created_at: now, updated_at: now });
  const routing = await insertAdaptive(client, "vf_routing_actions", { signal_id: p.signalId, item_id: p.painId, pain_id: p.painId, owner_email: email, member_email: email, title: p.full.title, note: p.summary, reason: p.summary, route_summary: p.summary, action: "pain_review_needed", status: "new", priority: p.full.priority, source: "pain", source_table: "vf_pain_submissions", metadata: meta, created_at: now, updated_at: now });
  const activity = await insertAdaptive(client, "vf_activity_events", { event_type: "pain_created", item_id: p.painId, pain_id: p.painId, signal_id: p.signalId, owner_email: email, member_email: email, title: p.full.title, event_title: p.full.title, description: p.summary, event_description: p.summary, status: "new", source: "pain", metadata: meta, created_at: now, updated_at: now });
  return { signal, routing, activity };
}

export async function GET() {
  return json({ ok: true, route: "/api/pain/create", writes_to: PAIN_TABLES });
}

export async function POST(request: Request) {
  try {
    const client = sb();
    const body = await request.json().catch(() => ({}));
    const url = new URL(request.url);
    const base = `${url.protocol}//${url.host}`;
    const cookieHeader = request.headers.get("cookie") || "";
    const email =
      ce(request.headers.get("x-vf-email")) ||
      ce(first(body.owner_email, body.member_email, body.user_email, body.email, body.submitted_by, body.submitted_by_email)) ||
      ce(cookie(cookieHeader, "vf_email")) ||
      "unknown";

    const title = first(body.title, body.pain_title, body.problem_title, body.headline);
    if (!title) return json({ ok: false, error: "Pain title is required." }, 400);

    const p = build(body, email, base);
    const result = await insertAny(client, [p.full, p.core, p.minimal]);
    if (!result.ok || !result.data) return json({ ok: false, error: "Pain could not be saved.", supabase_error: result.error, attempts: result.attempts }, 500);

    const savedId = c(result.data.id || result.data.pain_id || result.data.item_id || p.painId);
    p.links.pain_room = `${base}/pain-room/${encodeURIComponent(savedId)}`;
    const bg = await background(client, p, email);

    return json({
      ok: true,
      saved: true,
      table: result.table,
      id: savedId,
      pain_id: savedId,
      item_id: savedId,
      signal_id: p.signalId,
      direct_links: p.links,
      saved_to: { pain_record: true, routing_signal: Boolean(bg.signal.ok), routing_action: Boolean(bg.routing.ok), activity_event: Boolean(bg.activity.ok) },
      background_errors: { routing_signal: bg.signal.ok ? null : bg.signal.error, routing_action: bg.routing.ok ? null : bg.routing.error, activity_event: bg.activity.ok ? null : bg.activity.error },
      message: "Pain saved to Pain Room.",
      record: result.data,
    });
  } catch (error: any) {
    return json({ ok: false, error: "Could not save pain.", details: error?.message || String(error) }, 500);
  }
}
