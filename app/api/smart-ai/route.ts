import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type AnyRow = Record<string, any>;

const PROFILE_TABLES = ["vf_profiles", "profiles", "member_profiles", "vf_members"];
const DEAL_TABLES = ["vf_deals", "deals", "projects", "property_cards"];
const PAIN_TABLES = ["vf_pain_requests", "pain_requests", "pain", "vf_pain"];

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function cleanEmail(value: unknown) {
  return clean(value).toLowerCase();
}

function valuesOf(value: unknown): string[] {
  if (value === null || value === undefined) return [];

  if (Array.isArray(value)) {
    return value.flatMap((item) => valuesOf(item));
  }

  if (typeof value === "object") return [];

  const raw = clean(value);
  if (!raw) return [];

  if (
    (raw.startsWith("[") && raw.endsWith("]")) ||
    (raw.startsWith("{") && raw.endsWith("}"))
  ) {
    try {
      const parsed = JSON.parse(raw);
      return valuesOf(parsed);
    } catch {
      // Continue to delimiter split.
    }
  }

  return raw
    .replaceAll("\\n", ",")
    .replaceAll("\n", ",")
    .replaceAll("|", ",")
    .replaceAll(";", ",")
    .split(",")
    .map(clean)
    .filter(Boolean);
}

function unique(values: string[]) {
  const map = new Map<string, string>();

  for (const value of values) {
    const text = clean(value);
    if (!text) continue;
    map.set(text.toLowerCase(), text);
  }

  return Array.from(map.values());
}

function firstText(...values: unknown[]) {
  for (const value of values) {
    const list = valuesOf(value);
    if (list.length) return list[0];

    const text = clean(value);
    if (text && typeof value !== "object") return text;
  }

  return "";
}

function metadata(row: AnyRow) {
  return row && typeof row.metadata === "object" && row.metadata ? row.metadata : {};
}

function dbClient() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    "";

  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    "";

  if (!url || !key) {
    throw new Error("Missing Supabase environment values.");
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

async function safeSelect(db: any, table: string, limit = 80) {
  try {
    const { data, error } = await db
      .from(table)
      .select("*")
      .order("updated_at", { ascending: false, nullsFirst: false })
      .limit(limit);

    if (error || !Array.isArray(data)) return [];

    return data.map((row) => ({ ...row, _source_table: table }));
  } catch {
    try {
      const { data, error } = await db.from(table).select("*").limit(limit);
      if (error || !Array.isArray(data)) return [];
      return data.map((row) => ({ ...row, _source_table: table }));
    } catch {
      return [];
    }
  }
}

async function loadFirstProfile(db: any, email: string) {
  for (const table of PROFILE_TABLES) {
    try {
      const { data, error } = await db
        .from(table)
        .select("*")
        .eq("email", email)
        .maybeSingle();

      if (!error && data) return { ...data, _source_table: table };
    } catch {
      // Try next table.
    }
  }

  return { email };
}

function profileIntel(profile: AnyRow) {
  const m = metadata(profile);
  const source = { ...m, ...profile };

  const baseState = firstText(
    source.home_state,
    source.based_state,
    source.base_state,
    source.from_state,
    source.member_state,
    source.primary_state,
    source.location_state,
    source.state
  );

  const states = unique([
    ...valuesOf(source.buy_box_states),
    ...valuesOf(source.market_states),
    ...valuesOf(source.deal_states),
    ...valuesOf(source.states),
    ...valuesOf(source.operating_states),
    ...valuesOf(source.markets),
    baseState,
  ]);

  const roles = unique([
    ...valuesOf(source.member_types),
    ...valuesOf(source.member_type),
    ...valuesOf(source.roles),
    firstText(source.role, source.member_role),
  ]);

  const strategies = unique([
    ...valuesOf(source.buy_box_strategies),
    ...valuesOf(source.strategies),
    ...valuesOf(source.strategy),
    ...valuesOf(source.asset_focus),
  ]);

  const needs = unique([
    ...valuesOf(source.needs),
    ...valuesOf(source.deal_needs),
    ...valuesOf(source.what_i_need),
    ...valuesOf(source.looking_for),
  ]);

  const provides = unique([
    ...valuesOf(source.can_provide),
    ...valuesOf(source.what_i_provide),
    ...valuesOf(source.provides),
    ...valuesOf(source.capabilities),
  ]);

  const distress = unique([
    ...valuesOf(source.distress_signals),
    ...valuesOf(source.pain_signals),
    ...valuesOf(source.problem_signals),
  ]);

  return {
    email: cleanEmail(source.email),
    name: firstText(source.full_name, source.name, source.display_name, source.email),
    company: firstText(source.company, source.company_name, source.business_name),
    base_state: baseState,
    states,
    roles,
    strategies,
    needs,
    provides,
    distress,
    buy_box: firstText(source.buy_box, source.buy_box_focus),
    funding_capacity: firstText(source.funding_capacity, source.capital_capacity),
  };
}

function textPool(row: AnyRow) {
  const m = metadata(row);
  const source = { ...m, ...row };

  return [
    source.title,
    source.name,
    source.headline,
    source.description,
    source.summary,
    source.notes,
    source.city,
    source.state,
    source.market,
    source.asset_type,
    source.property_type,
    source.deal_type,
    source.strategy,
    source.status,
    source.urgency,
    source.pain_type,
    source.problem_type,
    source.help_requested,
    source.requested_help,
    ...valuesOf(source.states),
    ...valuesOf(source.market_states),
    ...valuesOf(source.buy_box_states),
    ...valuesOf(source.operating_states),
    ...valuesOf(source.needs),
    ...valuesOf(source.can_provide),
    ...valuesOf(source.tags),
  ]
    .map(clean)
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function titleOf(row: AnyRow) {
  return firstText(
    row.title,
    row.name,
    row.headline,
    row.property_title,
    row.deal_title,
    row.pain_title,
    row.problem_title,
    "VaultForge opportunity"
  );
}

function cityState(row: AnyRow) {
  const m = metadata(row);
  const city = firstText(row.city, row.market_city, m.city);
  const state = firstText(row.state, row.market_state, row.market, m.state, m.market_state);
  return [city, state].filter(Boolean).join(", ") || "Market not listed";
}

function rowHref(row: AnyRow, kind: "deal" | "pain") {
  const id = firstText(row.id, row.deal_id, row.project_id, row.pain_id, row.request_id);

  if (!id) return kind === "pain" ? "/pain-feed" : "/projects";

  if (kind === "pain") return `/pain-room/${encodeURIComponent(id)}`;

  return `/deal/detail?id=${encodeURIComponent(id)}`;
}

function scoreRow(row: AnyRow, profile: ReturnType<typeof profileIntel>, kind: "deal" | "pain") {
  const pool = textPool(row);
  let score = 25;

  for (const state of profile.states) {
    if (state && pool.includes(state.toLowerCase())) score += 14;
  }

  for (const role of profile.roles) {
    if (role && pool.includes(role.toLowerCase())) score += 5;
  }

  for (const strategy of profile.strategies) {
    if (strategy && pool.includes(strategy.toLowerCase())) score += 8;
  }

  for (const need of profile.needs) {
    if (need && pool.includes(need.toLowerCase())) score += kind === "pain" ? 14 : 8;
  }

  for (const item of profile.provides) {
    if (item && pool.includes(item.toLowerCase())) score += 10;
  }

  for (const item of profile.distress) {
    if (item && pool.includes(item.toLowerCase())) score += kind === "pain" ? 14 : 6;
  }

  const urgency = lowerText(row.urgency || row.priority || row.status || row.pain_type || row.problem_type);
  if (urgency.includes("urgent") || urgency.includes("high") || urgency.includes("emergency")) score += 12;
  if (kind === "pain") score += 8;

  return Math.max(0, Math.min(100, score));
}

function lowerText(value: unknown) {
  return clean(value).toLowerCase();
}

function reasoning(row: AnyRow, profile: ReturnType<typeof profileIntel>, kind: "deal" | "pain") {
  const pool = textPool(row);
  const reasons: string[] = [];

  const stateHits = profile.states.filter((state) => state && pool.includes(state.toLowerCase()));
  if (stateHits.length) reasons.push(`Market match: ${stateHits.slice(0, 3).join(", ")}`);

  const strategyHits = profile.strategies.filter((item) => item && pool.includes(item.toLowerCase()));
  if (strategyHits.length) reasons.push(`Strategy fit: ${strategyHits.slice(0, 3).join(", ")}`);

  const needHits = profile.needs.filter((item) => item && pool.includes(item.toLowerCase()));
  if (needHits.length) reasons.push(`Need match: ${needHits.slice(0, 3).join(", ")}`);

  const provideHits = profile.provides.filter((item) => item && pool.includes(item.toLowerCase()));
  if (provideHits.length) reasons.push(`You can provide: ${provideHits.slice(0, 3).join(", ")}`);

  if (kind === "pain") reasons.push("Pain signal should be reviewed for routing pressure.");

  if (!reasons.length) reasons.push("General VaultForge opportunity. Add more profile detail to improve AI fit.");

  return reasons;
}

function bestMove(row: AnyRow, score: number, kind: "deal" | "pain") {
  if (kind === "pain") {
    if (score >= 75) return "Open the pain room, verify the blocker, then message the owner or route to the best operator/capital fit.";
    if (score >= 55) return "Review pain context and decide if your network can solve the bottleneck.";
    return "Monitor only unless the market, role, or need matches your current profile.";
  }

  if (score >= 75) return "Open the deal room, confirm economics, then message if the fit matches your buy box.";
  if (score >= 55) return "Review the deal room and compare against your market, capital, and strategy criteria.";
  return "Low-priority watch item. Improve profile buy box to sharpen future scoring.";
}

function itemCard(row: AnyRow, profile: ReturnType<typeof profileIntel>, kind: "deal" | "pain") {
  const score = scoreRow(row, profile, kind);
  return {
    id: firstText(row.id, row.deal_id, row.project_id, row.pain_id, row.request_id, `${kind}-${titleOf(row)}`),
    kind,
    title: titleOf(row),
    market: cityState(row),
    score,
    priority: score >= 75 ? "High" : score >= 55 ? "Medium" : "Watch",
    reasoning: reasoning(row, profile, kind),
    best_move: bestMove(row, score, kind),
    href: rowHref(row, kind),
    source_table: row._source_table || "",
  };
}

export async function GET(request: NextRequest) {
  try {
    const email =
      cleanEmail(request.headers.get("x-vf-email")) ||
      cleanEmail(request.nextUrl.searchParams.get("email"));

    if (!email) {
      return NextResponse.json(
        { ok: false, error: "Email required.", profile: null, insights: [] },
        { status: 401 }
      );
    }

    const db = dbClient();
    const profile = profileIntel(await loadFirstProfile(db, email));

    const dealResults = await Promise.all(DEAL_TABLES.map((table) => safeSelect(db, table, 80)));
    const painResults = await Promise.all(PAIN_TABLES.map((table) => safeSelect(db, table, 80)));

    const deals = dealResults.flat();
    const pains = painResults.flat();

    const items = [
      ...deals.map((row) => itemCard(row, profile, "deal")),
      ...pains.map((row) => itemCard(row, profile, "pain")),
    ]
      .sort((a, b) => b.score - a.score)
      .slice(0, 30);

    const high = items.filter((item) => item.score >= 75).length;
    const medium = items.filter((item) => item.score >= 55 && item.score < 75).length;

    return NextResponse.json({
      ok: true,
      profile,
      counts: {
        deals: deals.length,
        pains: pains.length,
        insights: items.length,
        high,
        medium,
        watch: items.length - high - medium,
      },
      insights: items,
      message: "Smart AI read-only intelligence generated from profile, deals, and pain records.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Smart AI failed to load.", profile: null, insights: [] },
      { status: 500 }
    );
  }
}
