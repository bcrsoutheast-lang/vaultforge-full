import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type AnyRow = Record<string, any>;

const DEAL_TABLES = ["vf_deals"];
const PAIN_TABLES = ["vf_pain_requests", "pain_requests"];

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function cleanEmail(value: unknown) {
  return clean(value).toLowerCase();
}

function valuesOf(value: unknown): string[] {
  if (value === null || value === undefined) return [];
  if (Array.isArray(value)) return value.flatMap((item) => valuesOf(item));
  if (typeof value === "object") return [];

  const raw = clean(value);
  if (!raw) return [];

  if ((raw.startsWith("[") && raw.endsWith("]")) || (raw.startsWith("{") && raw.endsWith("}"))) {
    try {
      return valuesOf(JSON.parse(raw));
    } catch {
      // split below
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
    if (text) map.set(text.toLowerCase(), text);
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

function meta(row: AnyRow) {
  return row && typeof row.metadata === "object" && row.metadata ? row.metadata : {};
}

function dbClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    "";

  if (!url || !key) throw new Error("Missing Supabase environment values.");

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

async function loadProfile(db: any, email: string) {
  const tables = ["vf_profiles", "profiles", "member_profiles", "vf_members"];

  for (const table of tables) {
    try {
      const { data, error } = await db.from(table).select("*").eq("email", email).maybeSingle();
      if (!error && data) return { ...data, _source_table: table };
    } catch {
      // try next
    }
  }

  return { email };
}

function profileIntel(profile: AnyRow) {
  const source = { ...meta(profile), ...profile };

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

  return {
    email: cleanEmail(source.email),
    name: firstText(source.full_name, source.name, source.display_name, source.email),
    company: firstText(source.company, source.company_name, source.business_name),
    base_state: baseState,
    states,
    roles: unique([...valuesOf(source.member_types), ...valuesOf(source.member_type), ...valuesOf(source.roles), firstText(source.role, source.member_role)]),
    strategies: unique([...valuesOf(source.buy_box_strategies), ...valuesOf(source.strategies), ...valuesOf(source.strategy), ...valuesOf(source.asset_focus)]),
    needs: unique([...valuesOf(source.needs), ...valuesOf(source.deal_needs), ...valuesOf(source.what_i_need), ...valuesOf(source.looking_for)]),
    provides: unique([...valuesOf(source.can_provide), ...valuesOf(source.what_i_provide), ...valuesOf(source.provides), ...valuesOf(source.capabilities)]),
    distress: unique([...valuesOf(source.distress_signals), ...valuesOf(source.pain_signals), ...valuesOf(source.problem_signals)]),
  };
}

function source(row: AnyRow) {
  return { ...meta(row), ...row };
}

function titleOf(row: AnyRow) {
  const r = source(row);
  return firstText(
    r.title,
    r.name,
    r.headline,
    r.property_title,
    r.deal_title,
    r.pain_title,
    r.problem_title,
    "VaultForge opportunity"
  );
}

function marketOf(row: AnyRow) {
  const r = source(row);
  const city = firstText(r.city, r.market_city, r.area);
  const state = firstText(r.state, r.market_state, r.market);
  return [city, state].filter(Boolean).join(", ") || "Market not listed";
}

function photoOf(row: AnyRow) {
  const r = source(row);
  const photos = Array.isArray(r.photos) ? r.photos : [];
  const photoUrls = Array.isArray(r.photo_urls) ? r.photo_urls : [];

  return firstText(
    r.image_url,
    r.photo_url,
    r.primary_photo_url,
    r.main_photo_url,
    photoUrls[0],
    photos[0]?.url,
    photos[0]
  );
}

function textPool(row: AnyRow) {
  const r = source(row);

  return [
    titleOf(row),
    marketOf(row),
    r.description,
    r.summary,
    r.notes,
    r.asset_type,
    r.property_type,
    r.deal_type,
    r.strategy,
    r.status,
    r.urgency,
    r.pain_type,
    r.problem_type,
    r.help_requested,
    r.requested_help,
    ...valuesOf(r.states),
    ...valuesOf(r.market_states),
    ...valuesOf(r.buy_box_states),
    ...valuesOf(r.operating_states),
    ...valuesOf(r.needs),
    ...valuesOf(r.can_provide),
    ...valuesOf(r.tags),
  ]
    .map(clean)
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function scoreRow(row: AnyRow, profile: ReturnType<typeof profileIntel>, kind: "deal" | "pain") {
  const pool = textPool(row);
  let score = kind === "pain" ? 35 : 30;

  for (const state of profile.states) if (state && pool.includes(state.toLowerCase())) score += 14;
  for (const strategy of profile.strategies) if (strategy && pool.includes(strategy.toLowerCase())) score += 8;
  for (const need of profile.needs) if (need && pool.includes(need.toLowerCase())) score += kind === "pain" ? 14 : 8;
  for (const item of profile.provides) if (item && pool.includes(item.toLowerCase())) score += 10;
  for (const item of profile.distress) if (item && pool.includes(item.toLowerCase())) score += kind === "pain" ? 14 : 6;

  const urgency = firstText(row.urgency, row.priority, row.status).toLowerCase();
  if (urgency.includes("urgent") || urgency.includes("high") || urgency.includes("emergency")) score += 12;

  return Math.max(0, Math.min(100, score));
}

function directHref(row: AnyRow, kind: "deal" | "pain") {
  const r = source(row);
  const links = r.direct_links && typeof r.direct_links === "object" ? r.direct_links : {};

  if (kind === "pain") {
    const direct = firstText(links.pain_room, r.pain_room_url, r.pain_room);
    if (direct) {
      try {
        const url = new URL(direct);
        return `${url.pathname}${url.search || ""}`;
      } catch {
        if (direct.startsWith("/")) return direct;
      }
    }

    const painId = firstText(r.id, r.pain_id, r.request_id, r.item_id);
    return painId ? `/pain-room/${encodeURIComponent(painId)}` : "/pain-feed";
  }

  const dealId = firstText(r.id, r.deal_id);
  return dealId ? `/deal/detail?id=${encodeURIComponent(dealId)}` : "";
}

function reasons(row: AnyRow, profile: ReturnType<typeof profileIntel>, kind: "deal" | "pain") {
  const pool = textPool(row);
  const result: string[] = [];

  const stateHits = profile.states.filter((item) => item && pool.includes(item.toLowerCase()));
  if (stateHits.length) result.push(`Market fit: ${stateHits.slice(0, 3).join(", ")}`);

  const strategyHits = profile.strategies.filter((item) => item && pool.includes(item.toLowerCase()));
  if (strategyHits.length) result.push(`Strategy fit: ${strategyHits.slice(0, 3).join(", ")}`);

  const needHits = profile.needs.filter((item) => item && pool.includes(item.toLowerCase()));
  if (needHits.length) result.push(`Need fit: ${needHits.slice(0, 3).join(", ")}`);

  const provideHits = profile.provides.filter((item) => item && pool.includes(item.toLowerCase()));
  if (provideHits.length) result.push(`Provider fit: ${provideHits.slice(0, 3).join(", ")}`);

  if (kind === "pain") result.push("Pain record should be reviewed for operator/capital/buyer routing.");

  if (!result.length) result.push("General opportunity. Add more profile detail to sharpen Smart AI routing.");

  return result;
}

function bestMove(score: number, kind: "deal" | "pain") {
  if (kind === "pain") {
    if (score >= 75) return "Open the pain room, verify the blocker, then message or route to the best operator/capital fit.";
    if (score >= 55) return "Review the pain room and decide if you can solve the bottleneck.";
    return "Watch only unless the problem matches your current profile.";
  }

  if (score >= 75) return "Open the deal room, confirm economics, then message if the fit matches your buy box.";
  if (score >= 55) return "Review the deal room and compare against your market, capital, and strategy criteria.";
  return "Low-priority watch item. Improve profile buy box to sharpen future scoring.";
}

function card(row: AnyRow, profile: ReturnType<typeof profileIntel>, kind: "deal" | "pain") {
  const href = directHref(row, kind);
  const score = scoreRow(row, profile, kind);

  return {
    id: firstText(row.id, row.deal_id, row.pain_id, row.request_id),
    kind,
    title: titleOf(row),
    market: marketOf(row),
    photo: photoOf(row),
    score,
    priority: score >= 75 ? "High" : score >= 55 ? "Medium" : "Watch",
    reasoning: reasons(row, profile, kind),
    best_move: bestMove(score, kind),
    summary: bestMove(score, kind),
    href,
    source_table: row._source_table || "",
  };
}

function dedupe(items: AnyRow[]) {
  const map = new Map<string, AnyRow>();

  for (const item of items) {
    const key = `${item.kind}|${clean(item.title).toLowerCase()}|${clean(item.market).toLowerCase()}`;
    const existing = map.get(key);

    if (!existing || Number(item.score || 0) > Number(existing.score || 0)) {
      map.set(key, item);
    }
  }

  return Array.from(map.values());
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
    const profile = profileIntel(await loadProfile(db, email));

    const dealRows = (await Promise.all(DEAL_TABLES.map((table) => safeSelect(db, table, 80)))).flat();
    const painRows = (await Promise.all(PAIN_TABLES.map((table) => safeSelect(db, table, 80)))).flat();

    const raw = [
      ...dealRows.map((row) => card(row, profile, "deal")).filter((item) => item.href),
      ...painRows.map((row) => card(row, profile, "pain")).filter((item) => item.href),
    ];

    const insights = dedupe(raw)
      .sort((a, b) => Number(b.score || 0) - Number(a.score || 0))
      .slice(0, 40);

    const high = insights.filter((item) => item.score >= 75).length;
    const medium = insights.filter((item) => item.score >= 55 && item.score < 75).length;

    return NextResponse.json({
      ok: true,
      profile,
      counts: {
        deals: dealRows.length,
        pains: painRows.length,
        insights: insights.length,
        high,
        medium,
        watch: insights.length - high - medium,
      },
      insights,
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Smart AI failed to load.", profile: null, insights: [] },
      { status: 500 }
    );
  }
}
