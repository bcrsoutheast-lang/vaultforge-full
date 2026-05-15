import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type AnyRow = Record<string, any>;

const PROFILE_TABLES = ["vf_profiles", "profiles", "member_profiles", "vf_members"];

function clean(value: unknown) {
  return String(value || "").trim();
}

function cleanEmail(value: unknown) {
  return clean(value).toLowerCase();
}

function valuesOf(value: unknown): string[] {
  if (value === null || value === undefined) return [];

  if (Array.isArray(value)) {
    return value.flatMap((item) => valuesOf(item));
  }

  if (typeof value === "object") {
    return [];
  }

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

function bool(value: unknown) {
  if (typeof value === "boolean") return value;
  const text = clean(value).toLowerCase();
  return ["1", "true", "yes", "y", "on", "accepted", "active", "paid", "member"].includes(text);
}

function fieldBlank(value: unknown) {
  if (Array.isArray(value)) return value.length === 0;
  if (value && typeof value === "object") return Object.keys(value as AnyRow).length === 0;
  return !clean(value);
}

function mergeNoBlank(existing: AnyRow, incoming: AnyRow) {
  const next: AnyRow = { ...existing };

  for (const [key, value] of Object.entries(incoming)) {
    if (value === undefined) continue;

    const existingValue = next[key];

    if (fieldBlank(value) && !fieldBlank(existingValue)) {
      continue;
    }

    next[key] = value;
  }

  return next;
}

function metadataOf(row: AnyRow) {
  return row && typeof row.metadata === "object" && row.metadata ? row.metadata : {};
}

function supabase() {
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
    throw new Error("Missing Supabase environment variables.");
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

function selectEmail(request: NextRequest, body: AnyRow = {}) {
  return (
    cleanEmail(body?.email) ||
    cleanEmail(request.headers.get("x-vf-email")) ||
    cleanEmail(request.nextUrl.searchParams.get("email"))
  );
}

function profileCompleteFrom(payload: AnyRow, email: string) {
  const fullName = firstText(payload.full_name, payload.fullName, payload.name, payload.display_name);
  const phone = firstText(payload.phone);
  const role = firstText(payload.role, payload.member_role, valuesOf(payload.member_types)[0], valuesOf(payload.member_type)[0], valuesOf(payload.roles)[0]);
  const city = firstText(payload.city);
  const state = firstText(payload.state, payload.home_state, payload.based_state, valuesOf(payload.buy_box_states)[0], valuesOf(payload.market_states)[0], valuesOf(payload.states)[0]);

  return Boolean(email && fullName && phone && role && city && state);
}

function canonicalPayload(email: string, body: AnyRow, existing: AnyRow = {}) {
  const existingMeta = metadataOf(existing);

  const mergedInput = mergeNoBlank(
    {
      ...existingMeta,
      ...existing,
    },
    body
  );

  const fullName = firstText(
    mergedInput.full_name,
    mergedInput.fullName,
    mergedInput.name,
    mergedInput.display_name
  );

  const company = firstText(
    mergedInput.company,
    mergedInput.company_name,
    mergedInput.business_name
  );

  const phone = firstText(mergedInput.phone);
  const city = firstText(mergedInput.city);

  const homeState = firstText(
    mergedInput.home_state,
    mergedInput.based_state,
    mergedInput.base_state,
    mergedInput.from_state,
    mergedInput.member_state,
    mergedInput.primary_state,
    mergedInput.location_state,
    mergedInput.state,
    mergedInput.market_primary,
    mergedInput.primary_market,
    valuesOf(mergedInput.buy_box_states)[0],
    valuesOf(mergedInput.market_states)[0],
    valuesOf(mergedInput.states)[0],
    "Georgia"
  );

  const selectedStates = unique([
    ...valuesOf(mergedInput.buy_box_states),
    ...valuesOf(mergedInput.market_states),
    ...valuesOf(mergedInput.deal_states),
    ...valuesOf(mergedInput.states),
    ...valuesOf(mergedInput.operating_states),
    ...valuesOf(mergedInput.service_states),
    ...valuesOf(mergedInput.target_states),
    homeState,
  ]);

  const specificMarkets = firstText(
    mergedInput.specific_markets,
    mergedInput.market_notes,
    mergedInput.markets_text,
    typeof mergedInput.markets === "string" && !mergedInput.markets.trim().startsWith("[")
      ? mergedInput.markets
      : "",
    selectedStates.join(",")
  );

  const memberTypes = unique([
    ...valuesOf(mergedInput.member_types),
    ...valuesOf(mergedInput.member_type),
    ...valuesOf(mergedInput.roles),
    firstText(mergedInput.role, mergedInput.member_role),
  ]);

  const propertyTypes = unique([
    ...valuesOf(mergedInput.buy_box_types),
    ...valuesOf(mergedInput.property_types),
    ...valuesOf(mergedInput.asset_types),
    ...valuesOf(mergedInput.asset_focus),
  ]);

  const strategies = unique([
    ...valuesOf(mergedInput.buy_box_strategies),
    ...valuesOf(mergedInput.strategies),
    ...valuesOf(mergedInput.strategy),
  ]);

  const needs = unique([
    ...valuesOf(mergedInput.needs),
    ...valuesOf(mergedInput.deal_needs),
    ...valuesOf(mergedInput.what_i_need),
    ...valuesOf(mergedInput.looking_for),
  ]);

  const canProvide = unique([
    ...valuesOf(mergedInput.can_provide),
    ...valuesOf(mergedInput.what_i_provide),
    ...valuesOf(mergedInput.provides),
    ...valuesOf(mergedInput.capabilities),
  ]);

  const painSignals = unique([
    ...valuesOf(mergedInput.distress_signals),
    ...valuesOf(mergedInput.pain_signals),
    ...valuesOf(mergedInput.problem_signals),
  ]);

  const alertTypes = unique([
    ...valuesOf(mergedInput.alert_types),
  ]);

  const buyBox = firstText(mergedInput.buy_box, mergedInput.buyBox, mergedInput.buy_box_focus);
  const fundingCapacity = firstText(
    mergedInput.funding_capacity,
    mergedInput.fundingCapacity,
    mergedInput.capital_capacity
  );

  const strategyNotes = firstText(
    mergedInput.strategy_notes,
    mergedInput.notes,
    typeof mergedInput.strategy === "string" ? mergedInput.strategy : "",
    buyBox
  );

  const photo = firstText(
    mergedInput.profile_photo_url,
    mergedInput.profilePhotoUrl,
    mergedInput.photo_url,
    mergedInput.avatar_url,
    mergedInput.image_url
  );

  const now = new Date().toISOString();

  const profileComplete = profileCompleteFrom(
    {
      email,
      full_name: fullName,
      phone,
      role: memberTypes[0],
      city,
      state: homeState,
    },
    email
  );

  const metadata = mergeNoBlank(existingMeta, {
    email,
    full_name: fullName,
    company,
    company_name: company,
    phone,
    city,

    state: homeState,
    home_state: homeState,
    based_state: homeState,
    base_state: homeState,
    from_state: homeState,
    member_state: homeState,
    primary_state: homeState,
    location_state: homeState,
    market_primary: homeState,
    primary_market: homeState,

    markets: specificMarkets,
    specific_markets: specificMarkets,
    market_notes: specificMarkets,
    market_states: selectedStates,
    buy_box_states: selectedStates,
    deal_states: selectedStates,
    states: selectedStates,
    operating_states: selectedStates,

    profile_photo_url: photo,
    photo_url: photo,
    avatar_url: photo,
    image_url: photo,

    member_types: memberTypes,
    member_type: memberTypes,
    roles: memberTypes,
    role: memberTypes[0] || firstText(mergedInput.role, mergedInput.member_role),
    member_role: memberTypes[0] || firstText(mergedInput.role, mergedInput.member_role),

    property_types: propertyTypes,
    asset_types: propertyTypes,
    buy_box_types: propertyTypes,
    asset_focus: propertyTypes,

    strategies,
    buy_box_strategies: strategies,

    needs,
    deal_needs: needs,
    what_i_need: needs,

    can_provide: canProvide,
    what_i_provide: canProvide,
    provides: canProvide,
    capabilities: canProvide,

    pain_signals: painSignals,
    distress_signals: painSignals,
    problem_signals: painSignals,

    alert_types: alertTypes,
    alert_frequency: firstText(mergedInput.alert_frequency, "daily_digest"),
    max_alerts_per_day: Number(mergedInput.max_alerts_per_day || 10),

    buy_box: buyBox,
    buy_box_focus: buyBox,
    funding_capacity: fundingCapacity,
    capital_capacity: fundingCapacity,
    strategy_notes: strategyNotes,
    notes: strategyNotes,

    profile_complete: profileComplete,
    updated_from: "vaultforge_profile_non_destructive_persistence",
    updated_at: now,
  });

  return mergeNoBlank(existing, {
    email,
    auth_user_id: firstText(mergedInput.auth_user_id, mergedInput.user_id, existing.auth_user_id, email),

    full_name: fullName,
    name: fullName,
    display_name: fullName,

    company,
    company_name: company,
    business_name: company,
    phone,
    city,

    state: homeState,
    home_state: homeState,
    based_state: homeState,
    base_state: homeState,
    from_state: homeState,
    member_state: homeState,
    primary_state: homeState,
    location_state: homeState,
    market_primary: homeState,
    primary_market: homeState,

    markets: specificMarkets,
    specific_markets: specificMarkets,
    market_notes: specificMarkets,
    market_states: selectedStates,
    deal_states: selectedStates,
    states: selectedStates,
    operating_states: selectedStates,
    buy_box_states: selectedStates,

    profile_photo_url: photo,
    photo_url: photo,
    avatar_url: photo,
    image_url: photo,

    role: memberTypes[0] || firstText(mergedInput.role, mergedInput.member_role),
    member_role: memberTypes[0] || firstText(mergedInput.role, mergedInput.member_role),
    member_types: memberTypes,
    member_type: memberTypes,
    roles: memberTypes,

    buy_box_types: propertyTypes,
    property_types: propertyTypes,
    asset_types: propertyTypes,
    asset_focus: propertyTypes,

    buy_box_strategies: strategies,
    strategies,
    strategy: strategyNotes,
    strategy_notes: strategyNotes,
    notes: strategyNotes,

    needs,
    deal_needs: needs,
    what_i_need: needs,

    can_provide: canProvide,
    what_i_provide: canProvide,
    provides: canProvide,
    capabilities: canProvide,

    distress_signals: painSignals,
    pain_signals: painSignals,
    problem_signals: painSignals,

    alert_types: alertTypes,
    alert_frequency: firstText(mergedInput.alert_frequency, "daily_digest"),
    max_alerts_per_day: Number(mergedInput.max_alerts_per_day || 10),

    buy_box: buyBox,
    buy_box_focus: buyBox,
    funding_capacity: fundingCapacity,
    capital_capacity: fundingCapacity,

    profile_complete: profileComplete,
    access_status: firstText(mergedInput.access_status, existing.access_status, "member"),
    payment_status: firstText(mergedInput.payment_status, existing.payment_status, "member"),
    member_status: firstText(
      mergedInput.member_status,
      existing.member_status,
      profileComplete ? "profile_saved" : "profile_started"
    ),
    is_active: existing.is_active ?? true,
    is_suspended: existing.is_suspended ?? false,
    routing_score: Number(mergedInput.routing_score || existing.routing_score || 0),
    metadata,
    updated_at: now,
  });
}

function normalizeProfile(row: AnyRow, email = "") {
  if (!row) return { email };

  const metadata = metadataOf(row);
  const source = { ...metadata, ...row };

  const homeState = firstText(
    source.home_state,
    source.based_state,
    source.base_state,
    source.from_state,
    source.member_state,
    source.primary_state,
    source.location_state,
    source.state,
    source.market_primary,
    source.primary_market,
    "Georgia"
  );

  const marketStates = unique([
    ...valuesOf(source.buy_box_states),
    ...valuesOf(source.market_states),
    ...valuesOf(source.deal_states),
    ...valuesOf(source.states),
    ...valuesOf(source.operating_states),
    homeState,
  ]);

  const memberTypes = unique([
    ...valuesOf(source.member_types),
    ...valuesOf(source.member_type),
    ...valuesOf(source.roles),
    firstText(source.role, source.member_role),
  ]);

  const propertyTypes = unique([
    ...valuesOf(source.buy_box_types),
    ...valuesOf(source.property_types),
    ...valuesOf(source.asset_types),
    ...valuesOf(source.asset_focus),
  ]);

  const strategies = unique([
    ...valuesOf(source.buy_box_strategies),
    ...valuesOf(source.strategies),
    ...valuesOf(source.strategy),
  ]);

  const needs = unique([
    ...valuesOf(source.needs),
    ...valuesOf(source.deal_needs),
    ...valuesOf(source.what_i_need),
  ]);

  const canProvide = unique([
    ...valuesOf(source.can_provide),
    ...valuesOf(source.what_i_provide),
    ...valuesOf(source.provides),
    ...valuesOf(source.capabilities),
  ]);

  const painSignals = unique([
    ...valuesOf(source.distress_signals),
    ...valuesOf(source.pain_signals),
    ...valuesOf(source.problem_signals),
  ]);

  const alertTypes = unique([
    ...valuesOf(source.alert_types),
  ]);

  const marketsText = firstText(
    source.specific_markets,
    source.market_notes,
    typeof source.markets === "string" ? source.markets : "",
    marketStates.join(",")
  );

  const photo = firstText(
    source.profile_photo_url,
    source.photo_url,
    source.avatar_url,
    source.image_url
  );

  return {
    ...source,
    email: cleanEmail(source.email || email),
    full_name: firstText(source.full_name, source.name, source.display_name),
    company: firstText(source.company, source.company_name, source.business_name),
    phone: firstText(source.phone),
    city: firstText(source.city),

    state: homeState,
    home_state: homeState,
    based_state: homeState,
    base_state: homeState,
    from_state: homeState,
    member_state: homeState,
    primary_state: homeState,
    location_state: homeState,

    markets: marketsText,
    specific_markets: marketsText,
    market_notes: marketsText,
    buy_box_states: marketStates,
    market_states: marketStates,
    deal_states: marketStates,
    states: marketStates,
    operating_states: marketStates,

    profile_photo_url: photo,
    photo_url: photo,
    avatar_url: photo,
    image_url: photo,

    member_types: memberTypes,
    member_type: memberTypes,
    roles: memberTypes,
    role: firstText(source.role, source.member_role, memberTypes[0]),
    member_role: firstText(source.member_role, source.role, memberTypes[0]),

    buy_box_types: propertyTypes,
    property_types: propertyTypes,
    asset_types: propertyTypes,

    buy_box_strategies: strategies,
    strategies,
    strategy: firstText(source.strategy_notes, source.notes, typeof source.strategy === "string" ? source.strategy : ""),
    strategy_notes: firstText(source.strategy_notes, source.notes, typeof source.strategy === "string" ? source.strategy : ""),

    needs,
    deal_needs: needs,
    what_i_need: needs,

    can_provide: canProvide,
    what_i_provide: canProvide,
    provides: canProvide,
    capabilities: canProvide,

    distress_signals: painSignals,
    pain_signals: painSignals,
    problem_signals: painSignals,

    alert_types: alertTypes,
    alert_frequency: firstText(source.alert_frequency, "daily_digest"),
    max_alerts_per_day: Number(source.max_alerts_per_day || 10),

    buy_box: firstText(source.buy_box, source.buy_box_focus),
    funding_capacity: firstText(source.funding_capacity, source.capital_capacity),
    profile_complete: bool(source.profile_complete),
    access_status: firstText(source.access_status, "member"),
    payment_status: firstText(source.payment_status, "member"),
    member_status: firstText(source.member_status, "profile_saved"),
  };
}

function cleanUndefined(row: AnyRow) {
  return Object.fromEntries(
    Object.entries(row).filter(([, value]) => value !== undefined)
  );
}

function candidateRows(payload: AnyRow) {
  const rich = cleanUndefined({ ...payload });

  const medium = cleanUndefined({
    email: payload.email,
    auth_user_id: payload.auth_user_id,
    full_name: payload.full_name,
    name: payload.name,
    display_name: payload.display_name,
    company: payload.company,
    company_name: payload.company_name,
    phone: payload.phone,
    city: payload.city,
    state: payload.state,
    home_state: payload.home_state,
    markets: payload.markets,
    market_states: payload.market_states,
    states: payload.states,
    operating_states: payload.operating_states,
    buy_box_states: payload.buy_box_states,
    role: payload.role,
    member_role: payload.member_role,
    member_types: payload.member_types,
    roles: payload.roles,
    buy_box_types: payload.buy_box_types,
    property_types: payload.property_types,
    asset_types: payload.asset_types,
    strategies: payload.strategies,
    strategy: payload.strategy,
    buy_box_strategies: payload.buy_box_strategies,
    needs: payload.needs,
    deal_needs: payload.deal_needs,
    can_provide: payload.can_provide,
    what_i_provide: payload.what_i_provide,
    profile_photo_url: payload.profile_photo_url,
    photo_url: payload.photo_url,
    avatar_url: payload.avatar_url,
    buy_box: payload.buy_box,
    funding_capacity: payload.funding_capacity,
    strategy_notes: payload.strategy_notes,
    notes: payload.notes,
    profile_complete: payload.profile_complete,
    access_status: payload.access_status,
    payment_status: payload.payment_status,
    member_status: payload.member_status,
    is_active: payload.is_active,
    is_suspended: payload.is_suspended,
    metadata: payload.metadata,
    updated_at: payload.updated_at,
  });

  const safe = cleanUndefined({
    email: payload.email,
    auth_user_id: payload.auth_user_id,
    full_name: payload.full_name,
    state: payload.state,
    home_state: payload.home_state,
    markets: payload.markets,
    member_types: payload.member_types,
    role: payload.role,
    profile_complete: payload.profile_complete,
    access_status: payload.access_status,
    payment_status: payload.payment_status,
    member_status: payload.member_status,
    is_active: payload.is_active,
    metadata: payload.metadata,
    updated_at: payload.updated_at,
  });

  const minimalWithMetadata = cleanUndefined({
    email: payload.email,
    auth_user_id: payload.auth_user_id,
    full_name: payload.full_name,
    profile_complete: payload.profile_complete,
    access_status: payload.access_status,
    payment_status: payload.payment_status,
    member_status: payload.member_status,
    is_active: payload.is_active,
    metadata: payload.metadata,
    updated_at: payload.updated_at,
  });

  const bareMinimum = cleanUndefined({
    email: payload.email,
    full_name: payload.full_name,
    profile_complete: payload.profile_complete,
    metadata: payload.metadata,
    updated_at: payload.updated_at,
  });

  return [rich, medium, safe, minimalWithMetadata, bareMinimum];
}

async function findExisting(db: any, table: string, email: string) {
  try {
    const { data, error } = await db
      .from(table)
      .select("*")
      .eq("email", email)
      .maybeSingle();

    if (error) return { data: null, error };
    return { data, error: null };
  } catch (error: any) {
    return { data: null, error };
  }
}

async function loadProfile(db: any, email: string) {
  const attempts: AnyRow[] = [];

  for (const table of PROFILE_TABLES) {
    const result = await findExisting(db, table, email);

    attempts.push({
      table,
      ok: Boolean(result.data),
      error: result.error?.message || null,
    });

    if (result.data) {
      return {
        table,
        row: result.data,
        attempts,
      };
    }
  }

  return { table: "vf_profiles", row: null, attempts };
}

async function saveIntoTable(db: any, table: string, email: string, payload: AnyRow) {
  const existing = await findExisting(db, table, email);
  const existingRow = existing.data || {};
  const attempts: AnyRow[] = [];

  for (const candidate of candidateRows(payload)) {
    const nonDestructiveCandidate = existing.data
      ? mergeNoBlank(existingRow, candidate)
      : candidate;

    const row = existing.data
      ? nonDestructiveCandidate
      : { ...nonDestructiveCandidate, created_at: new Date().toISOString() };

    const result = existing.data
      ? await db.from(table).update(row).eq("email", email).select("*").single()
      : await db.from(table).insert(row).select("*").single();

    attempts.push({
      table,
      ok: !result.error,
      error: result.error?.message || null,
      keys: Object.keys(row),
      mode: existing.data ? "update" : "insert",
    });

    if (!result.error && result.data) {
      return {
        ok: true,
        table,
        row: result.data,
        attempts,
      };
    }
  }

  return {
    ok: false,
    table,
    row: null,
    attempts,
  };
}

async function saveProfile(db: any, email: string, payload: AnyRow) {
  const allAttempts: AnyRow[] = [];

  for (const table of PROFILE_TABLES) {
    const result = await saveIntoTable(db, table, email, payload);

    allAttempts.push(...result.attempts);

    if (result.ok) return result;
  }

  return {
    ok: false,
    table: "",
    row: null,
    attempts: allAttempts,
  };
}

export async function GET(request: NextRequest) {
  try {
    const email = selectEmail(request);

    if (!email) {
      return NextResponse.json({ ok: false, error: "Email required." }, { status: 400 });
    }

    const db = supabase();
    const result = await loadProfile(db, email);
    const profile = normalizeProfile(result.row || { email }, email);

    return NextResponse.json({
      ok: true,
      profile,
      profile_complete: Boolean(profile.profile_complete),
      source_table: result.table,
      attempts: result.attempts,
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Could not load profile." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = selectEmail(request, body);

    if (!email) {
      return NextResponse.json({ ok: false, error: "Email required." }, { status: 400 });
    }

    const db = supabase();
    const existing = await loadProfile(db, email);
    const payload = canonicalPayload(email, body, existing.row || {});
    const result = await saveProfile(db, email, payload);

    if (!result.ok || !result.row) {
      return NextResponse.json(
        {
          ok: false,
          error: "Profile save failed after compatible table/column attempts.",
          attempts: result.attempts.slice(-20),
        },
        { status: 500 }
      );
    }

    const profile = normalizeProfile(result.row, email);

    return NextResponse.json({
      ok: true,
      message: "Profile saved.",
      profile,
      profile_complete: Boolean(profile.profile_complete),
      source_table: result.table,
      attempts: result.attempts.slice(-8),
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Profile could not be saved." },
      { status: 500 }
    );
  }
}
