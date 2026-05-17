import { createClient } from "@supabase/supabase-js";

export type VaultForgeRoomKind = "opportunity" | "pressure" | "routing" | "signal" | "alert" | "unknown";

export type VaultForgeRoomRecord = {
  id: string;
  kind: VaultForgeRoomKind;
  source_table: string;
  title: string;
  subtitle: string;
  city: string;
  county: string;
  state: string;
  address: string;
  asset_type: string;
  strategy: string;
  urgency: string;
  status: string;
  summary: string;
  notes: string;
  ai_summary: string;
  route_reason: string;
  fit_score: string;
  asking: string;
  arv: string;
  repairs: string;
  capital_needed: string;
  photos: string[];
  raw: Record<string, any>;
};

function supabaseClient() {
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

export function clean(value: unknown) {
  return String(value ?? "").trim();
}

function lower(value: unknown) {
  return clean(value).toLowerCase();
}

function firstText(...values: unknown[]) {
  for (const value of values) {
    const text = clean(value);
    if (text && text.toLowerCase() !== "null" && text.toLowerCase() !== "undefined") return text;
  }
  return "";
}

function firstMoney(...values: unknown[]) {
  const text = firstText(...values);
  if (!text) return "";
  return text.startsWith("$") ? text : text;
}

function readMeta(row: Record<string, any>) {
  const candidates = [row.metadata, row.meta, row.payload, row.details, row.asset_specific, row.ai_payload];
  const merged: Record<string, any> = {};

  for (const value of candidates) {
    if (!value) continue;
    if (typeof value === "object" && !Array.isArray(value)) Object.assign(merged, value);
    if (typeof value === "string") {
      try {
        const parsed = JSON.parse(value);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) Object.assign(merged, parsed);
      } catch {}
    }
  }

  return merged;
}

function photoArray(...values: unknown[]) {
  const out: string[] = [];

  function push(value: unknown) {
    if (!value) return;
    if (Array.isArray(value)) {
      value.forEach(push);
      return;
    }
    if (typeof value === "object") {
      const objectValue = value as Record<string, any>;
      push(objectValue.url || objectValue.publicUrl || objectValue.public_url || objectValue.src);
      return;
    }
    const text = clean(value);
    if (!text) return;
    if (text.startsWith("[") || text.startsWith("{")) {
      try {
        push(JSON.parse(text));
        return;
      } catch {}
    }
    if (text.startsWith("http")) out.push(text);
  }

  values.forEach(push);
  return Array.from(new Set(out)).slice(0, 12);
}

function titleFrom(row: Record<string, any>, meta: Record<string, any>, fallback: string) {
  return firstText(
    row.title,
    row.name,
    row.project_title,
    row.deal_title,
    row.property_title,
    row.pain_title,
    row.signal_title,
    row.alert_title,
    row.subject,
    meta.title,
    meta.name,
    meta.project_title,
    meta.deal_title,
    meta.property_title,
    meta.pain_title,
    meta.signal_title,
    meta.context_title,
    fallback
  );
}

export function normalizeRoom(row: Record<string, any>, kind: VaultForgeRoomKind, sourceTable: string): VaultForgeRoomRecord {
  const meta = readMeta(row);
  const title = titleFrom(row, meta, kind === "pressure" ? "Pressure Room" : kind === "routing" ? "Routing Room" : kind === "signal" ? "Signal Room" : "Opportunity Room");
  const city = firstText(row.city, row.market_city, row.property_city, meta.city, meta.market_city, meta.property_city);
  const county = firstText(row.county, row.county_name, row.market_county, meta.county, meta.county_name, meta.market_county);
  const state = firstText(row.state, row.market_state, row.property_state, meta.state, meta.market_state, meta.property_state);
  const location = [city, county, state].filter(Boolean).join(" · ");
  const assetType = firstText(row.asset_type, row.property_type, row.deal_type, row.type, meta.asset_type, meta.property_type, meta.deal_type, meta.type, kind === "pressure" ? "Pain" : "Deal");
  const strategy = firstText(row.strategy, row.exit_strategy, row.investment_strategy, meta.strategy, meta.exit_strategy, meta.investment_strategy);
  const notes = firstText(row.notes, row.description, row.body, row.message, row.problem, row.situation, meta.notes, meta.description, meta.body, meta.problem, meta.situation);
  const aiSummary = firstText(row.ai_summary, row.ai_analysis, row.summary, row.analysis, meta.ai_summary, meta.ai_analysis, meta.summary, meta.analysis);
  const asking = firstMoney(row.asking, row.asking_price, row.price, meta.asking, meta.asking_price, meta.price);
  const arv = firstMoney(row.arv, row.after_repair_value, row.value, meta.arv, meta.after_repair_value, meta.value);
  const repairs = firstMoney(row.repairs, row.repair_estimate, row.rehab, meta.repairs, meta.repair_estimate, meta.rehab);
  const capitalNeeded = firstMoney(row.capital_needed, row.capital, row.funding_needed, meta.capital_needed, meta.capital, meta.funding_needed);
  const urgency = firstText(row.urgency, row.priority, row.severity, meta.urgency, meta.priority, meta.severity, kind === "alert" ? "Trigger" : "Review");
  const status = firstText(row.status, row.stage, row.access_status, meta.status, meta.stage, "active");
  const routeReason = firstText(row.route_reason, row.reason, row.match_reason, meta.route_reason, meta.reason, meta.match_reason);
  const fitScore = firstText(row.fit_score, row.score, row.confidence, meta.fit_score, meta.score, meta.confidence);
  const photos = photoArray(row.photos, row.photo_urls, row.photo_url, row.image_url, row.images, meta.photos, meta.photo_urls, meta.photo_url, meta.image_url, meta.images);

  const summaryParts = [
    aiSummary,
    notes,
    location ? `Market: ${location}.` : "",
    strategy ? `Strategy: ${strategy}.` : "",
    asking || arv || repairs ? `Numbers: asking ${asking || "not listed"}, ARV/value ${arv || "not listed"}, repairs ${repairs || "not listed"}.` : "",
    capitalNeeded ? `Capital need: ${capitalNeeded}.` : "",
  ].filter(Boolean);

  return {
    id: firstText(row.id, row.deal_id, row.project_id, row.item_id, row.signal_id, row.alert_id, row.routing_id, meta.id, meta.deal_id, meta.project_id, meta.item_id, meta.signal_id) || "unknown-room",
    kind,
    source_table: sourceTable,
    title,
    subtitle: location || firstText(row.market, meta.market, "Market not listed"),
    city,
    county,
    state,
    address: firstText(row.address, row.property_address, meta.address, meta.property_address),
    asset_type: assetType,
    strategy,
    urgency,
    status,
    summary: summaryParts.join(" ") || "VaultForge found this room, but the saved row is missing several detail fields. Open the source workflow and confirm title, city, state, strategy, numbers, and notes are saving into the database row.",
    notes,
    ai_summary: aiSummary,
    route_reason: routeReason,
    fit_score: fitScore,
    asking,
    arv,
    repairs,
    capital_needed: capitalNeeded,
    photos,
    raw: row,
  };
}

async function queryById(table: string, id: string) {
  const supabase = supabaseClient();
  if (!supabase || !id) return null;

  const idColumns = ["id", "deal_id", "project_id", "item_id", "signal_id", "alert_id", "routing_id"];

  for (const column of idColumns) {
    const { data, error } = await supabase.from(table).select("*").eq(column, id).limit(1).maybeSingle();
    if (!error && data) return data as Record<string, any>;
  }

  return null;
}

async function queryLatest(table: string) {
  const supabase = supabaseClient();
  if (!supabase) return [] as Record<string, any>[];

  const attempts = [
    supabase.from(table).select("*").order("created_at", { ascending: false }).limit(25),
    supabase.from(table).select("*").order("updated_at", { ascending: false }).limit(25),
    supabase.from(table).select("*").limit(25),
  ];

  for (const attempt of attempts) {
    const { data, error } = await attempt;
    if (!error && Array.isArray(data)) return data as Record<string, any>[];
  }

  return [];
}

const opportunityTables = ["vf_deals", "deals", "projects", "property_cards", "vf_projects"];
const pressureTables = ["vf_pain_requests", "pain_requests", "vf_pain", "pain", "vf_pressure_rooms"];
const signalTables = ["vf_signals", "signals", "vf_intelligence_signals", "intelligence_signals", "vf_alerts", "alerts"];
const routingTables = ["vf_routing_actions", "routing_actions", "vf_routes", "routes", "vf_signals", "signals"];
const alertTables = ["vf_alerts", "alerts", "vf_signals", "signals", "vf_routing_actions"];

export async function hydrateRoom(kind: VaultForgeRoomKind, id: string) {
  const tables =
    kind === "pressure" ? pressureTables :
    kind === "routing" ? routingTables :
    kind === "signal" ? signalTables :
    kind === "alert" ? alertTables :
    opportunityTables;

  for (const table of tables) {
    const row = await queryById(table, id);
    if (row) return normalizeRoom(row, kind, table);
  }

  if (kind === "routing" || kind === "signal" || kind === "alert") {
    for (const table of [...opportunityTables, ...pressureTables]) {
      const row = await queryById(table, id);
      if (row) return normalizeRoom(row, table.includes("pain") ? "pressure" : "opportunity", table);
    }
  }

  return null;
}

export async function listRooms(kind?: VaultForgeRoomKind) {
  const roomKinds: VaultForgeRoomKind[] = kind && kind !== "unknown" ? [kind] : ["opportunity", "pressure", "routing", "signal", "alert"];
  const rooms: VaultForgeRoomRecord[] = [];
  const seen = new Set<string>();

  for (const roomKind of roomKinds) {
    const tables =
      roomKind === "pressure" ? pressureTables :
      roomKind === "routing" ? routingTables :
      roomKind === "signal" ? signalTables :
      roomKind === "alert" ? alertTables :
      opportunityTables;

    for (const table of tables) {
      const rows = await queryLatest(table);
      for (const row of rows) {
        const normalized = normalizeRoom(row, roomKind, table);
        const key = `${normalized.kind}:${normalized.id}:${normalized.title}`.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        rooms.push(normalized);
      }
      if (rooms.length >= 25) break;
    }
  }

  return rooms.slice(0, 40);
}

export function roomPath(room: VaultForgeRoomRecord) {
  if (room.kind === "pressure") return `/pain-room/${encodeURIComponent(room.id)}`;
  if (room.kind === "routing") return `/routing-room/${encodeURIComponent(room.id)}`;
  if (room.kind === "signal" || room.kind === "alert") return `/signals/${encodeURIComponent(room.id)}`;
  return `/deal/detail?id=${encodeURIComponent(room.id)}`;
}
