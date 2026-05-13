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

function arr(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => clean(item)).filter(Boolean);
  }

  if (typeof value === "string") {
    const text = value.trim();

    if (!text) return [];

    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) return parsed.map((item) => clean(item)).filter(Boolean);
    } catch {
      // Continue to delimiter split.
    }

    return text
      .split(/[,\n|;]/)
      .map((item) => clean(item))
      .filter(Boolean);
  }

  return [];
}

function unique(values: string[]) {
  const seen = new Map<string, string>();

  for (const value of values) {
    const text = clean(value);
    if (!text) continue;
    seen.set(text.toLowerCase(), text);
  }

  return Array.from(seen.values());
}

function bool(value: unknown) {
  if (typeof value === "boolean") return value;
  const text = clean(value).toLowerCase();
  return ["1", "true", "yes", "y", "on", "accepted", "active", "paid", "member"].includes(text);
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

function firstText(...values: unknown[]) {
  for (const value of values) {
    const text = clean(value);
    if (text) return text;
  }

  return "";
}

function completion(body: AnyRow, email: string) {
  const fullName = firstText(body.full_name, body.fullName, body.name, body.display_name);
  const phone = firstText(body.phone);
  const role = firstText(body.role, body.member_role, arr(body.member_types)[0], arr(body.member_type)[0]);
  const city = firstText(body.city);
  const state = firstText(body.state, body.home_state, arr(body.buy_box_states)[0], arr(body.market_states)[0], arr(body.states)[0]);

  return Boolean(email && fullName && phone && role && city && state);
}

function profilePayload(email: string, body: AnyRow) {
  const fullName = firstText(body.full_name, body.fullName, body.name, body.display_name);
  const company = firstText(body.company, body.company_name, body.business_name);
  const phone = firstText(body.phone);
  const city = firstText(body.city);
  const state = firstText(body.state, body.home_state, body.market_primary, body.primary_market, arr(body.buy_box_states)[0], arr(body.market_states)[0], arr(body.states)[0]);
  const photo = firstText(body.profile_photo_url, body.profilePhotoUrl, body.photo_url, body.avatar_url, body.image_url);

  const memberTypes = unique([
    ...arr(body.member_types),
    ...arr(body.member_type),
    ...arr(body.roles),
    firstText(body.role, body.member_role),
  ]);

  const marketStates = unique([
    ...arr(body.buy_box_states),
    ...arr(body.market_states),
    ...arr(body.deal_states),
    ...arr(body.markets),
    ...arr(body.states),
    ...arr(body.operating_states),
    state,
  ]);

  const propertyTypes = unique([
    ...arr(body.buy_box_types),
    ...arr(body.property_types),
    ...arr(body.asset_types),
    ...arr(body.asset_focus),
  ]);

  const strategies = unique([
    ...arr(body.buy_box_strategies),
    ...arr(body.strategies),
    ...arr(body.strategy),
  ]);

  const needs = unique([
    ...arr(body.needs),
    ...arr(body.deal_needs),
    ...arr(body.what_i_need),
  ]);

  const canProvide = unique([
    ...arr(body.can_provide),
    ...arr(body.what_i_provide),
    ...arr(body.provides),
    ...arr(body.capabilities),
  ]);

  const painSignals = unique([
    ...arr(body.distress_signals),
    ...arr(body.pain_signals),
    ...arr(body.problem_signals),
  ]);

  const alertTypes = unique([
    ...arr(body.alert_types),
  ]);

  const buyBox = firstText(body.buy_box, body.buyBox, body.buy_box_focus);
  const fundingCapacity = firstText(body.funding_capacity, body.fundingCapacity, body.capital_capacity);
  const strategyNotes = firstText(body.strategy_notes, body.notes, body.strategy, body.buy_box);

  const profileComplete = completion(
    {
      ...body,
      full_name: fullName,
      phone,
      role: memberTypes[0],
      city,
      state,
    },
    email,
  );

  const now = new Date().toISOString();

  const metadata = {
    email,
    full_name: fullName,
    company,
    phone,
    city,
    state,
    profile_photo_url: photo,
    member_types: memberTypes,
    market_states: marketStates,
    buy_box_states: marketStates,
    deal_states: marketStates,
    property_types: propertyTypes,
    asset_types: propertyTypes,
    buy_box_types: propertyTypes,
    strategies,
    buy_box_strategies: strategies,
    needs,
    deal_needs: needs,
    what_i_need: needs,
    can_provide: canProvide,
    what_i_provide: canProvide,
    pain_signals: painSignals,
    distress_signals: painSignals,
    alert_types: alertTypes,
    alert_frequency: firstText(body.alert_frequency, "daily_digest"),
    max_alerts_per_day: Number(body.max_alerts_per_day || 10),
    buy_box: buyBox,
    funding_capacity: fundingCapacity,
    strategy_notes: strategyNotes,
    updated_from: "vaultforge_profile_canonical_api_fix",
    updated_at: now,
  };

  return {
    email,
    auth_user_id: firstText(body.auth_user_id, body.user_id, email),

    full_name: fullName,
    company,
    company_name: company,
    phone,
    city,
    state,

    profile_photo_url: photo,
    photo_url: photo,
    avatar_url: photo,

    home_state: state,
    market_primary: state,
    primary_market: state,

    markets: marketStates,
    market_states: marketStates,
    deal_states: marketStates,
    states: marketStates,
    operating_states: marketStates,
    buy_box_states: marketStates,

    role: memberTypes[0] || firstText(body.role, body.member_role),
    member_role: memberTypes[0] || firstText(body.role, body.member_role),
    member_types: memberTypes,
    member_type: memberTypes,
    roles: memberTypes,

    buy_box_types: propertyTypes,
    property_types: propertyTypes,
    asset_types: propertyTypes,
    asset_focus: propertyTypes,

    buy_box_strategies: strategies,
    strategies,
    strategy: strategies,

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
    alert_frequency: firstText(body.alert_frequency, "daily_digest"),
    max_alerts_per_day: Number(body.max_alerts_per_day || 10),

    buy_box: buyBox,
    buy_box_focus: buyBox,
    funding_capacity: fundingCapacity,
    capital_capacity: fundingCapacity,
    strategy_notes: strategyNotes,
    notes: strategyNotes,

    profile_complete: profileComplete,
    access_status: firstText(body.access_status, "member"),
    payment_status: firstText(body.payment_status, "member"),
    member_status: profileComplete ? "profile_saved" : "profile_started",
    is_active: true,
    is_suspended: false,
    routing_score: Number(body.routing_score || 0),
    metadata,
    updated_at: now,
  };
}

function normalizeProfile(row: AnyRow, email = "") {
  if (!row) return { email };

  const metadata = typeof row.metadata === "object" && row.metadata ? row.metadata : {};

  const marketStates = unique([
    ...arr(row.buy_box_states),
    ...arr(row.market_states),
    ...arr(row.deal_states),
    ...arr(row.markets),
    ...arr(row.states),
    ...arr(row.operating_states),
    ...arr(metadata.buy_box_states),
    ...arr(metadata.market_states),
    ...arr(metadata.deal_states),
    ...arr(metadata.markets),
    ...arr(metadata.states),
    ...arr(metadata.operating_states),
    firstText(row.state, row.home_state, metadata.state, metadata.home_state),
  ]);

  const memberTypes = unique([
    ...arr(row.member_types),
    ...arr(row.member_type),
    ...arr(row.roles),
    ...arr(metadata.member_types),
    ...arr(metadata.member_type),
    ...arr(metadata.roles),
    firstText(row.role, row.member_role, metadata.role, metadata.member_role),
  ]);

  const propertyTypes = unique([
    ...arr(row.buy_box_types),
    ...arr(row.property_types),
    ...arr(row.asset_types),
    ...arr(row.asset_focus),
    ...arr(metadata.buy_box_types),
    ...arr(metadata.property_types),
    ...arr(metadata.asset_types),
    ...arr(metadata.asset_focus),
  ]);

  const strategies = unique([
    ...arr(row.buy_box_strategies),
    ...arr(row.strategies),
    ...arr(row.strategy),
    ...arr(metadata.buy_box_strategies),
    ...arr(metadata.strategies),
    ...arr(metadata.strategy),
  ]);

  const needs = unique([
    ...arr(row.needs),
    ...arr(row.deal_needs),
    ...arr(row.what_i_need),
    ...arr(metadata.needs),
    ...arr(metadata.deal_needs),
    ...arr(metadata.what_i_need),
  ]);

  const canProvide = unique([
    ...arr(row.can_provide),
    ...arr(row.what_i_provide),
    ...arr(row.provides),
    ...arr(row.capabilities),
    ...arr(metadata.can_provide),
    ...arr(metadata.what_i_provide),
    ...arr(metadata.provides),
    ...arr(metadata.capabilities),
  ]);

  const painSignals = unique([
    ...arr(row.distress_signals),
    ...arr(row.pain_signals),
    ...arr(row.problem_signals),
    ...arr(metadata.distress_signals),
    ...arr(metadata.pain_signals),
    ...arr(metadata.problem_signals),
  ]);

  const alertTypes = unique([
    ...arr(row.alert_types),
    ...arr(metadata.alert_types),
  ]);

  return {
    ...metadata,
    ...row,
    email: cleanEmail(row.email || metadata.email || email),
    full_name: firstText(row.full_name, row.name, row.display_name, metadata.full_name, metadata.name),
    company: firstText(row.company, row.company_name, metadata.company),
    phone: firstText(row.phone, metadata.phone),
    city: firstText(row.city, metadata.city),
    state: firstText(row.state, row.home_state, row.market_primary, metadata.state, metadata.home_state, marketStates[0], "Georgia"),
    home_state: firstText(row.home_state, row.state, metadata.home_state, metadata.state, marketStates[0], "Georgia"),
    profile_photo_url: firstText(row.profile_photo_url, row.photo_url, row.avatar_url, metadata.profile_photo_url),
    member_types: memberTypes,
    role: firstText(row.role, row.member_role, memberTypes[0], metadata.role),
    member_role: firstText(row.member_role, row.role, memberTypes[0], metadata.member_role),
    buy_box_states: marketStates,
    market_states: marketStates,
    markets: marketStates,
    deal_states: marketStates,
    buy_box_types: propertyTypes,
    property_types: propertyTypes,
    asset_types: propertyTypes,
    buy_box_strategies: strategies,
    strategies,
    strategy: firstText(row.strategy_notes, row.strategy, metadata.strategy_notes, metadata.strategy),
    needs,
    can_provide: canProvide,
    distress_signals: painSignals,
    pain_signals: painSignals,
    alert_types: alertTypes,
    alert_frequency: firstText(row.alert_frequency, metadata.alert_frequency, "daily_digest"),
    max_alerts_per_day: Number(row.max_alerts_per_day || metadata.max_alerts_per_day || 10),
    buy_box: firstText(row.buy_box, row.buy_box_focus, metadata.buy_box),
    funding_capacity: firstText(row.funding_capacity, row.capital_capacity, metadata.funding_capacity),
    profile_complete: bool(row.profile_complete ?? metadata.profile_complete),
    access_status: firstText(row.access_status, metadata.access_status, "member"),
    payment_status: firstText(row.payment_status, metadata.payment_status, "member"),
    member_status: firstText(row.member_status, metadata.member_status, "profile_saved"),
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
    company: payload.company,
    company_name: payload.company_name,
    phone: payload.phone,
    city: payload.city,
    state: payload.state,
    profile_photo_url: payload.profile_photo_url,
    photo_url: payload.photo_url,
    avatar_url: payload.avatar_url,
    home_state: payload.home_state,
    market_primary: payload.market_primary,
    primary_market: payload.primary_market,
    markets: payload.markets,
    market_states: payload.market_states,
    deal_states: payload.deal_states,
    states: payload.states,
    operating_states: payload.operating_states,
    buy_box_states: payload.buy_box_states,
    member_types: payload.member_types,
    member_type: payload.member_type,
    roles: payload.roles,
    role: payload.role,
    member_role: payload.member_role,
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
    distress_signals: payload.distress_signals,
    pain_signals: payload.pain_signals,
    alert_types: payload.alert_types,
    alert_frequency: payload.alert_frequency,
    max_alerts_per_day: payload.max_alerts_per_day,
    buy_box: payload.buy_box,
    buy_box_focus: payload.buy_box_focus,
    funding_capacity: payload.funding_capacity,
    capital_capacity: payload.capital_capacity,
    strategy_notes: payload.strategy_notes,
    notes: payload.notes,
    profile_complete: payload.profile_complete,
    access_status: payload.access_status,
    payment_status: payload.payment_status,
    member_status: payload.member_status,
    is_active: payload.is_active,
    is_suspended: payload.is_suspended,
    routing_score: payload.routing_score,
    metadata: payload.metadata,
    updated_at: payload.updated_at,
  });

  const safe = cleanUndefined({
    email: payload.email,
    auth_user_id: payload.auth_user_id,
    full_name: payload.full_name,
    phone: payload.phone,
    city: payload.city,
    state: payload.state,
    role: payload.role,
    member_types: payload.member_types,
    markets: payload.markets,
    profile_complete: payload.profile_complete,
    access_status: payload.access_status,
    payment_status: payload.payment_status,
    member_status: payload.member_status,
    is_active: payload.is_active,
    is_suspended: payload.is_suspended,
    routing_score: payload.routing_score,
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
    is_suspended: payload.is_suspended,
    metadata: payload.metadata,
    updated_at: payload.updated_at,
  });

  const minimalNoMetadata = cleanUndefined({
    email: payload.email,
    auth_user_id: payload.auth_user_id,
    full_name: payload.full_name,
    profile_complete: payload.profile_complete,
    access_status: payload.access_status,
    payment_status: payload.payment_status,
    member_status: payload.member_status,
    is_active: payload.is_active,
    is_suspended: payload.is_suspended,
    updated_at: payload.updated_at,
  });

  const bareMinimum = cleanUndefined({
    email: payload.email,
    full_name: payload.full_name,
    profile_complete: payload.profile_complete,
    updated_at: payload.updated_at,
  });

  return [rich, medium, safe, minimalWithMetadata, minimalNoMetadata, bareMinimum];
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
  const attempts: AnyRow[] = [];

  for (const candidate of candidateRows(payload)) {
    const row = existing.data
      ? candidate
      : { ...candidate, created_at: new Date().toISOString() };

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
    const payload = profilePayload(email, body);
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
