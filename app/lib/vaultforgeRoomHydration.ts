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
  ai_best_fit: string;
  ai_next_steps: string[];
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
  if (value === null || value === undefined) return "";
  if (typeof value === "string") {
    const text = value.trim();
    if (!text || text.toLowerCase() === "null" || text.toLowerCase() === "undefined") return "";
    return text;
  }
  if (typeof value === "number" || typeof value === "boolean") return String(value).trim();
  return "";
}

function lower(value: unknown) {
  return clean(value).toLowerCase();
}

function parseJsonObject(value: unknown): Record<string, any> {
  if (!value) return {};
  if (typeof value === "object" && !Array.isArray(value)) return value as Record<string, any>;
  if (typeof value !== "string") return {};

  const text = value.trim();
  if (!text || (!text.startsWith("{") && !text.startsWith("["))) return {};

  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed as Record<string, any>;
  } catch {
    return {};
  }

  return {};
}

function readPath(source: Record<string, any>, path: string) {
  const parts = path.split(".");
  let current: any = source;

  for (const part of parts) {
    if (!current || typeof current !== "object") return "";
    current = current[part];
  }

  return current;
}

function flattenPayload(row: Record<string, any>) {
  const merged: Record<string, any> = { ...row };

  const wrapperKeys = [
    "metadata",
    "meta",
    "payload",
    "details",
    "asset_specific",
    "ai_payload",
    "analysis_payload",
    "room_payload",
    "source_payload",
    "data",
    "record",
    "item",
    "deal",
    "project",
    "pain",
    "pressure",
    "signal",
    "alert",
    "routing",
  ];

  for (const key of wrapperKeys) {
    const objectValue = parseJsonObject(row[key]);
    if (Object.keys(objectValue).length) Object.assign(merged, objectValue);
  }

  for (const key of wrapperKeys) {
    const objectValue = parseJsonObject(merged[key]);
    if (Object.keys(objectValue).length) Object.assign(merged, objectValue);
  }

  return merged;
}

function looksRaw(text: string) {
  const trimmed = text.trim();
  if (!trimmed) return true;
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) return true;
  if (trimmed.includes("\":") && trimmed.includes("{")) return true;
  if (trimmed.length > 2200) return true;
  return false;
}

function firstText(...values: unknown[]) {
  for (const value of values) {
    if (Array.isArray(value)) {
      for (const item of value) {
        const text = firstText(item);
        if (text) return text;
      }
      continue;
    }

    if (value && typeof value === "object") continue;

    const text = clean(value);
    if (text && !looksRaw(text)) return text;
  }

  return "";
}

function moneyText(...values: unknown[]) {
  const text = firstText(...values);
  if (!text) return "";
  return text;
}

function collectTextList(...values: unknown[]) {
  const out: string[] = [];

  function push(value: unknown) {
    if (!value) return;
    if (Array.isArray(value)) {
      value.forEach(push);
      return;
    }
    if (typeof value === "object") {
      const obj = value as Record<string, any>;
      push(obj.text || obj.title || obj.label || obj.step || obj.action || obj.value);
      return;
    }

    const text = clean(value);
    if (!text || looksRaw(text)) return;

    const split = text
      .split(/\n|•|\d+\.\s+/g)
      .map((part) => part.trim())
      .filter(Boolean);

    if (split.length > 1) out.push(...split);
    else out.push(text);
  }

  values.forEach(push);
  return Array.from(new Set(out)).slice(0, 8);
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
      push(objectValue.url || objectValue.publicUrl || objectValue.public_url || objectValue.src || objectValue.image_url || objectValue.photo_url);
      return;
    }

    const text = clean(value);
    if (!text) return;

    if (text.startsWith("[") || text.startsWith("{")) {
      try {
        push(JSON.parse(text));
        return;
      } catch {
        return;
      }
    }

    text
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean)
      .forEach((part) => {
        if (part.startsWith("http")) out.push(part);
      });
  }

  values.forEach(push);
  return Array.from(new Set(out)).slice(0, 12);
}

function titleFrom(row: Record<string, any>, kind: VaultForgeRoomKind) {
  return firstText(
    row.title,
    row.name,
    row.project_title,
    row.deal_title,
    row.property_title,
    row.asset_title,
    row.pain_title,
    row.problem_title,
    row.signal_title,
    row.alert_title,
    row.subject,
    row.headline,
    readPath(row, "ai.title"),
    readPath(row, "analysis.title"),
    kind === "pressure" ? "Pressure Room" : kind === "routing" ? "Routing Room" : kind === "signal" ? "Signal Room" : kind === "alert" ? "Alert Room" : "Opportunity Room"
  );
}

function kindFromTable(table: string, requested: VaultForgeRoomKind): VaultForgeRoomKind {
  const t = table.toLowerCase();
  if (t.includes("pain") || t.includes("pressure")) return "pressure";
  if (t.includes("routing") || t.includes("route")) return "routing";
  if (t.includes("signal") || t.includes("intelligence")) return "signal";
  if (t.includes("alert")) return "alert";
  if (t.includes("deal") || t.includes("project") || t.includes("property")) return "opportunity";
  return requested;
}

function roomId(row: Record<string, any>, fallback = "") {
  return firstText(
    row.id,
    row.uuid,
    row.deal_id,
    row.project_id,
    row.property_id,
    row.item_id,
    row.room_id,
    row.signal_id,
    row.alert_id,
    row.routing_id,
    row.pain_id,
    row.pressure_id,
    row.source_id,
    row.source_item_id,
    row.source_room_id,
    fallback
  );
}

function linkedIds(row: Record<string, any>) {
  return Array.from(
    new Set(
      [
        row.id,
        row.uuid,
        row.deal_id,
        row.project_id,
        row.property_id,
        row.item_id,
        row.room_id,
        row.signal_id,
        row.alert_id,
        row.routing_id,
        row.pain_id,
        row.pressure_id,
        row.source_id,
        row.source_item_id,
        row.source_room_id,
        row.related_id,
        row.related_room_id,
      ]
        .map(clean)
        .filter(Boolean)
    )
  );
}

export function normalizeRoom(rowInput: Record<string, any>, requestedKind: VaultForgeRoomKind, sourceTable: string): VaultForgeRoomRecord {
  const row = flattenPayload(rowInput || {});
  const actualKind = kindFromTable(sourceTable, requestedKind);
  const city = firstText(row.city, row.market_city, row.property_city, row.location_city, readPath(row, "location.city"));
  const county = firstText(row.county, row.county_name, row.market_county, row.property_county, readPath(row, "location.county"));
  const state = firstText(row.state, row.market_state, row.property_state, row.location_state, readPath(row, "location.state"));
  const location = [city, county, state].filter(Boolean).join(" · ");

  const aiSummary = firstText(
    row.ai_summary,
    row.ai_analysis,
    row.ai_best_summary,
    row.analysis,
    row.executive_summary,
    row.summary_text,
    readPath(row, "ai.summary"),
    readPath(row, "ai.analysis"),
    readPath(row, "analysis.summary"),
    readPath(row, "intelligence.summary")
  );

  const notes = firstText(
    row.notes,
    row.note,
    row.description,
    row.body,
    row.message,
    row.problem,
    row.situation,
    row.context,
    row.private_notes,
    readPath(row, "details.notes"),
    readPath(row, "details.description")
  );

  const aiBestFit = firstText(
    row.ai_best_fit,
    row.best_fit,
    row.member_fit,
    row.fit_summary,
    row.match_summary,
    row.route_reason,
    row.match_reason,
    readPath(row, "ai.best_fit"),
    readPath(row, "routing.best_fit"),
    readPath(row, "analysis.best_fit")
  );

  const strategy = firstText(row.strategy, row.exit_strategy, row.investment_strategy, row.deal_strategy, readPath(row, "deal.strategy"));
  const assetType = firstText(row.asset_type, row.property_type, row.deal_type, row.project_type, row.problem_type, row.pain_type, row.type, actualKind === "pressure" ? "Pain / Pressure" : "Real Estate Opportunity");

  const asking = moneyText(row.asking, row.asking_price, row.price, row.purchase_price, row.list_price);
  const arv = moneyText(row.arv, row.after_repair_value, row.value, row.estimated_value);
  const repairs = moneyText(row.repairs, row.repair_estimate, row.rehab, row.rehab_budget, row.work_needed);
  const capitalNeeded = moneyText(row.capital_needed, row.capital, row.funding_needed, row.gap_amount, row.amount_needed);

  const summaryParts = [
    aiSummary,
    notes,
    aiBestFit ? `Best fit: ${aiBestFit}.` : "",
    location ? `Market: ${location}.` : "",
    strategy ? `Strategy: ${strategy}.` : "",
    asking || arv || repairs ? `Numbers: asking ${asking || "not listed"}, ARV/value ${arv || "not listed"}, repairs/work ${repairs || "not listed"}.` : "",
    capitalNeeded ? `Capital need: ${capitalNeeded}.` : "",
  ].filter(Boolean);

  const id = roomId(row, roomId(rowInput, ""));

  return {
    id: id || "missing-room-id",
    kind: actualKind,
    source_table: sourceTable,
    title: titleFrom(row, actualKind),
    subtitle: location || firstText(row.market, row.city_state, row.location, readPath(row, "location.label"), "Market not listed"),
    city,
    county,
    state,
    address: firstText(row.address, row.property_address, row.street_address, readPath(row, "location.address")),
    asset_type: assetType,
    strategy,
    urgency: firstText(row.urgency, row.priority, row.severity, row.alert_level, actualKind === "alert" ? "Trigger" : "Review"),
    status: firstText(row.status, row.stage, row.access_status, row.member_status, "active"),
    summary: summaryParts.join(" ") || "VaultForge found this room, but the saved row is missing the details needed for a complete intelligence brief.",
    notes,
    ai_summary: aiSummary,
    ai_best_fit: aiBestFit,
    ai_next_steps: collectTextList(row.ai_next_steps, row.next_steps, row.recommended_actions, readPath(row, "ai.next_steps"), readPath(row, "analysis.next_steps")),
    route_reason: firstText(row.route_reason, row.reason, row.match_reason, row.routing_reason, readPath(row, "routing.reason")),
    fit_score: firstText(row.fit_score, row.score, row.confidence, row.match_score, readPath(row, "routing.score")),
    asking,
    arv,
    repairs,
    capital_needed: capitalNeeded,
    photos: photoArray(row.photos, row.photo_urls, row.photo_url, row.image_url, row.images, row.media, row.files),
    raw: rowInput || {},
  };
}

async function queryByColumn(table: string, column: string, value: string) {
  const supabase = supabaseClient();
  if (!supabase || !value) return null;

  const { data, error } = await supabase.from(table).select("*").eq(column, value).limit(1).maybeSingle();
  if (!error && data) return data as Record<string, any>;
  return null;
}

async function queryById(table: string, id: string) {
  if (!id) return null;

  const columns = ["id", "uuid", "deal_id", "project_id", "property_id", "item_id", "room_id", "signal_id", "alert_id", "routing_id", "pain_id", "pressure_id", "source_id", "source_item_id", "source_room_id"];

  for (const column of columns) {
    const row = await queryByColumn(table, column, id);
    if (row) return row;
  }

  return null;
}

async function queryLatest(table: string) {
  const supabase = supabaseClient();
  if (!supabase) return [] as Record<string, any>[];

  const orderColumns = ["created_at", "updated_at", "inserted_at", "id"];

  for (const column of orderColumns) {
    const { data, error } = await supabase.from(table).select("*").order(column, { ascending: false }).limit(30);
    if (!error && Array.isArray(data)) return data as Record<string, any>[];
  }

  const { data, error } = await supabase.from(table).select("*").limit(30);
  if (!error && Array.isArray(data)) return data as Record<string, any>[];
  return [];
}

const opportunityTables = ["vf_deals", "vf_projects", "projects", "deals", "property_cards", "vf_property_cards"];
const pressureTables = ["vf_pain_requests", "pain_requests", "vf_pain", "pain", "vf_pressure_rooms"];
const routingTables = ["vf_routing_actions", "routing_actions", "vf_routes", "routes", "vf_signals", "signals", "vf_intelligence_signals"];
const signalTables = ["vf_signals", "signals", "vf_intelligence_signals", "intelligence_signals", "vf_alerts", "alerts"];
const alertTables = ["vf_alerts", "alerts", "vf_signals", "signals", "vf_routing_actions", "routing_actions"];

function tablesFor(kind: VaultForgeRoomKind) {
  if (kind === "pressure") return pressureTables;
  if (kind === "routing") return routingTables;
  if (kind === "signal") return signalTables;
  if (kind === "alert") return alertTables;
  return opportunityTables;
}

async function findSourceRoom(row: Record<string, any>, requestedKind: VaultForgeRoomKind) {
  const ids = linkedIds(flattenPayload(row));
  const sourceTables = requestedKind === "pressure" ? pressureTables : [...opportunityTables, ...pressureTables];

  for (const id of ids) {
    for (const table of sourceTables) {
      const source = await queryById(table, id);
      if (source) return { row: source, table };
    }
  }

  return null;
}

export async function hydrateRoom(kind: VaultForgeRoomKind, id: string) {
  const cleanId = clean(id);
  const primaryTables = tablesFor(kind);

  for (const table of primaryTables) {
    const row = await queryById(table, cleanId);
    if (!row) continue;

    if (kind === "routing" || kind === "signal" || kind === "alert") {
      const source = await findSourceRoom(row, kind);
      if (source) return normalizeRoom(source.row, kindFromTable(source.table, kind), source.table);
    }

    return normalizeRoom(row, kind, table);
  }

  for (const table of [...opportunityTables, ...pressureTables, ...signalTables, ...routingTables, ...alertTables]) {
    const row = await queryById(table, cleanId);
    if (row) return normalizeRoom(row, kindFromTable(table, kind), table);
  }

  return null;
}

export async function listRooms(kind?: VaultForgeRoomKind) {
  const requestedKinds: VaultForgeRoomKind[] = kind && kind !== "unknown" ? [kind] : ["opportunity", "pressure", "routing", "signal", "alert"];
  const rooms: VaultForgeRoomRecord[] = [];
  const seen = new Set<string>();

  for (const requestedKind of requestedKinds) {
    for (const table of tablesFor(requestedKind)) {
      const rows = await queryLatest(table);

      for (const row of rows) {
        let normalized = normalizeRoom(row, requestedKind, table);

        if (requestedKind === "routing" || requestedKind === "signal" || requestedKind === "alert") {
          const source = await findSourceRoom(row, requestedKind);
          if (source) normalized = normalizeRoom(source.row, kindFromTable(source.table, requestedKind), source.table);
        }

        const key = `${normalized.kind}:${normalized.id}`.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        rooms.push(normalized);
      }

      if (rooms.length >= 40) break;
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
