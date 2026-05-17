import { createClient } from "@supabase/supabase-js";

export type CanonicalRoomType = "deal" | "pain";

export type CanonicalRoom = {
  id: string;
  type: CanonicalRoomType;
  source_table: string;
  title: string;
  subtitle: string;
  city: string;
  county: string;
  state: string;
  asset_type: string;
  strategy: string;
  urgency: string;
  status: string;
  asking: string;
  arv: string;
  repairs: string;
  capital_needed: string;
  score: string;
  summary: string;
  notes: string;
  ai_summary: string;
  ai_best_fit: string;
  ai_next_steps: string[];
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

function clean(value: unknown) {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") {
    const text = value.trim();
    if (!text || text.toLowerCase() === "null" || text.toLowerCase() === "undefined") return "";
    return text;
  }
  if (typeof value === "number" || typeof value === "boolean") return String(value).trim();
  return "";
}

function parseObject(value: unknown): Record<string, any> {
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

function flatten(row: Record<string, any>) {
  const merged: Record<string, any> = { ...row };
  const keys = [
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
    "property",
    "pain",
    "pressure",
  ];

  for (const key of keys) {
    const object = parseObject(row[key]);
    if (Object.keys(object).length) Object.assign(merged, object);
  }

  for (const key of keys) {
    const object = parseObject(merged[key]);
    if (Object.keys(object).length) Object.assign(merged, object);
  }

  return merged;
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
    if (text && !text.startsWith("{") && !text.startsWith("[")) return text;
  }

  return "";
}

function firstId(row: Record<string, any>, fallback = "") {
  return firstText(
    row.id,
    row.uuid,
    row.deal_id,
    row.project_id,
    row.property_id,
    row.item_id,
    row.room_id,
    row.pain_id,
    row.pressure_id,
    row.source_id,
    row.source_item_id,
    fallback
  );
}

function textList(...values: unknown[]) {
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
    if (!text || text.startsWith("{") || text.startsWith("[")) return;

    const parts = text
      .split(/\n|•|\d+\.\s+/g)
      .map((part) => part.trim())
      .filter(Boolean);

    if (parts.length > 1) out.push(...parts);
    else out.push(text);
  }

  values.forEach(push);
  return Array.from(new Set(out)).slice(0, 8);
}

function photoList(...values: unknown[]) {
  const out: string[] = [];

  function push(value: unknown) {
    if (!value) return;

    if (Array.isArray(value)) {
      value.forEach(push);
      return;
    }

    if (typeof value === "object") {
      const obj = value as Record<string, any>;
      push(obj.url || obj.publicUrl || obj.public_url || obj.src || obj.image_url || obj.photo_url);
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
      .filter((part) => part.startsWith("http"))
      .forEach((part) => out.push(part));
  }

  values.forEach(push);
  return Array.from(new Set(out)).slice(0, 12);
}

function normalize(rowInput: Record<string, any>, type: CanonicalRoomType, table: string): CanonicalRoom {
  const row = flatten(rowInput || {});
  const city = firstText(row.city, row.market_city, row.property_city, row.location_city);
  const county = firstText(row.county, row.county_name, row.market_county, row.property_county);
  const state = firstText(row.state, row.market_state, row.property_state, row.location_state);
  const subtitle = [city, county, state].filter(Boolean).join(" · ");

  const aiSummary = firstText(
    row.ai_summary,
    row.ai_analysis,
    row.ai_best_summary,
    row.analysis,
    row.executive_summary,
    row.summary_text
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
    row.private_notes
  );

  const title =
    firstText(
      row.title,
      row.name,
      row.project_title,
      row.deal_title,
      row.property_title,
      row.asset_title,
      row.pain_title,
      row.problem_title,
      row.subject,
      row.headline
    ) || (type === "pain" ? "Pain Room" : "Deal Room");

  const assetType = firstText(
    row.asset_type,
    row.property_type,
    row.deal_type,
    row.project_type,
    row.problem_type,
    row.pain_type,
    row.type,
    type === "pain" ? "Pain / Pressure" : "Real Estate Opportunity"
  );

  const strategy = firstText(row.strategy, row.exit_strategy, row.investment_strategy, row.deal_strategy);
  const asking = firstText(row.asking, row.asking_price, row.price, row.purchase_price, row.list_price);
  const arv = firstText(row.arv, row.after_repair_value, row.value, row.estimated_value);
  const repairs = firstText(row.repairs, row.repair_estimate, row.rehab, row.rehab_budget, row.work_needed);
  const capitalNeeded = firstText(row.capital_needed, row.capital, row.funding_needed, row.gap_amount, row.amount_needed);

  const summaryParts = [
    aiSummary,
    notes,
    subtitle ? `Market: ${subtitle}.` : "",
    strategy ? `Strategy: ${strategy}.` : "",
    asking || arv || repairs ? `Numbers: asking ${asking || "not listed"}, ARV/value ${arv || "not listed"}, repairs/work ${repairs || "not listed"}.` : "",
    capitalNeeded ? `Capital need: ${capitalNeeded}.` : "",
  ].filter(Boolean);

  return {
    id: firstId(row, firstId(rowInput, "")) || "missing-id",
    type,
    source_table: table,
    title,
    subtitle: subtitle || firstText(row.market, row.city_state, row.location, "Market not listed"),
    city,
    county,
    state,
    asset_type: assetType,
    strategy,
    urgency: firstText(row.urgency, row.priority, row.severity, row.alert_level, type === "pain" ? "High" : "Review"),
    status: firstText(row.status, row.stage, "active"),
    asking,
    arv,
    repairs,
    capital_needed: capitalNeeded,
    score: firstText(row.fit_score, row.score, row.confidence, row.match_score, type === "pain" ? "88" : "84"),
    summary: summaryParts.join(" ") || (type === "pain" ? "Pain room needs execution details." : "Deal room needs underwriting details."),
    notes,
    ai_summary: aiSummary,
    ai_best_fit: firstText(row.ai_best_fit, row.best_fit, row.member_fit, row.fit_summary, row.match_summary, row.route_reason, row.match_reason),
    ai_next_steps: textList(row.ai_next_steps, row.next_steps, row.recommended_actions),
    photos: photoList(row.photos, row.photo_urls, row.photo_url, row.image_url, row.images, row.media, row.files),
    raw: rowInput || {},
  };
}

async function queryLatest(table: string) {
  const supabase = supabaseClient();
  if (!supabase) return [] as Record<string, any>[];

  for (const column of ["created_at", "updated_at", "inserted_at", "id"]) {
    const { data, error } = await supabase.from(table).select("*").order(column, { ascending: false }).limit(40);
    if (!error && Array.isArray(data)) return data as Record<string, any>[];
  }

  const { data, error } = await supabase.from(table).select("*").limit(40);
  if (!error && Array.isArray(data)) return data as Record<string, any>[];
  return [];
}

async function queryByColumn(table: string, column: string, id: string) {
  const supabase = supabaseClient();
  if (!supabase || !id) return null;

  const { data, error } = await supabase.from(table).select("*").eq(column, id).limit(1).maybeSingle();
  if (!error && data) return data as Record<string, any>;
  return null;
}

async function queryById(table: string, id: string) {
  const columns = [
    "id",
    "uuid",
    "deal_id",
    "project_id",
    "property_id",
    "item_id",
    "room_id",
    "pain_id",
    "pressure_id",
    "source_id",
    "source_item_id",
  ];

  for (const column of columns) {
    const row = await queryByColumn(table, column, id);
    if (row) return row;
  }

  return null;
}

const dealTables = ["vf_deals", "vf_projects", "projects", "deals", "property_cards", "vf_property_cards"];
const painTables = ["vf_pain_requests", "pain_requests", "vf_pain", "pain", "vf_pressure_rooms"];

export async function listCanonicalRooms(type: CanonicalRoomType) {
  const tables = type === "pain" ? painTables : dealTables;
  const rooms: CanonicalRoom[] = [];
  const seen = new Set<string>();

  for (const table of tables) {
    const rows = await queryLatest(table);

    for (const row of rows) {
      const normalized = normalize(row, type, table);
      const key = `${normalized.type}:${normalized.id}`.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      rooms.push(normalized);
    }

    if (rooms.length >= 40) break;
  }

  return rooms.slice(0, 40);
}

export async function getCanonicalRoom(type: CanonicalRoomType, id: string) {
  const tables = type === "pain" ? painTables : dealTables;

  for (const table of tables) {
    const row = await queryById(table, id);
    if (row) return normalize(row, type, table);
  }

  return null;
}