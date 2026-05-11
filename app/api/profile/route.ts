import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function clean(value: unknown) {
  return String(value || "").trim();
}

function cleanEmail(value: unknown) {
  return clean(value).toLowerCase();
}

function arr(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => clean(item)).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => clean(item))
      .filter(Boolean);
  }

  return [];
}

function bool(value: unknown) {
  if (typeof value === "boolean") return value;
  const text = clean(value).toLowerCase();
  return ["1", "true", "yes", "y", "on", "accepted"].includes(text);
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

function selectEmail(request: NextRequest, body: any = {}) {
  return (
    cleanEmail(body?.email) ||
    cleanEmail(request.headers.get("x-vf-email")) ||
    cleanEmail(request.nextUrl.searchParams.get("email"))
  );
}

function profilePayload(email: string, body: any) {
  const fullName = clean(body?.full_name || body?.name || body?.display_name);
  const company = clean(body?.company || body?.company_name);
  const photo = clean(body?.profile_photo_url || body?.photo_url || body?.avatar_url || body?.image_url);
  const homeState = clean(body?.home_state || body?.market_primary || body?.primary_market);
  const dealStates = arr(body?.deal_states || body?.markets || body?.states || body?.operating_states);

  const metadata = {
    full_name: fullName,
    company,
    phone: clean(body?.phone),
    profile_photo_url: photo,
    home_state: homeState,
    deal_states: dealStates,
    member_types: arr(body?.member_types || body?.member_type || body?.roles),
    strategies: arr(body?.strategies || body?.strategy),
    asset_focus: arr(body?.asset_focus),
    needs: arr(body?.needs),
    can_provide: arr(body?.can_provide),
    pain_signals: arr(body?.pain_signals),
    buy_box: clean(body?.buy_box || body?.buy_box_focus),
    funding_capacity: clean(body?.funding_capacity || body?.capital_capacity),
    strategy_notes: clean(body?.strategy_notes || body?.notes),
    network_accepted: bool(body?.network_accepted ?? body?.accepted_to_network ?? body?.available_to_network),
    updated_from: "vaultforge_profile_full_cards_no_name_fix",
  };

  return {
    email,
    auth_user_id: clean(body?.auth_user_id || email),

    // IMPORTANT: no "name" field here. The live vf_profiles table does not have name.
    full_name: fullName,

    company,
    company_name: company,
    phone: clean(body?.phone),

    profile_photo_url: photo,
    photo_url: photo,
    avatar_url: photo,

    home_state: homeState,
    market_primary: homeState,
    primary_market: homeState,

    deal_states: dealStates,
    markets: arr(body?.markets || body?.states || body?.operating_states || dealStates),
    states: arr(body?.states || body?.markets || dealStates),
    operating_states: arr(body?.operating_states || dealStates),

    member_types: arr(body?.member_types || body?.member_type || body?.roles),
    member_type: arr(body?.member_type || body?.member_types || body?.roles),
    roles: arr(body?.roles || body?.member_types),

    strategies: arr(body?.strategies || body?.strategy),
    strategy: arr(body?.strategy || body?.strategies),

    asset_focus: arr(body?.asset_focus),
    needs: arr(body?.needs),
    can_provide: arr(body?.can_provide),
    pain_signals: arr(body?.pain_signals),

    buy_box: clean(body?.buy_box || body?.buy_box_focus),
    buy_box_focus: clean(body?.buy_box_focus || body?.buy_box),
    funding_capacity: clean(body?.funding_capacity || body?.capital_capacity),
    capital_capacity: clean(body?.capital_capacity || body?.funding_capacity),
    strategy_notes: clean(body?.strategy_notes || body?.notes),
    notes: clean(body?.notes || body?.strategy_notes),

    network_accepted: bool(body?.network_accepted ?? body?.accepted_to_network ?? body?.available_to_network),
    accepted_to_network: bool(body?.accepted_to_network ?? body?.network_accepted),
    available_to_network: bool(body?.available_to_network ?? body?.network_accepted),
    allow_networking: bool(body?.allow_networking ?? body?.network_accepted),

    profile_complete: true,
    access_status: clean(body?.access_status || "member"),
    payment_status: clean(body?.payment_status || "member"),
    member_status: bool(body?.network_accepted ?? body?.accepted_to_network ?? body?.available_to_network) ? "network_active" : "profile_saved",
    is_active: true,
    is_suspended: false,
    routing_score: Number(body?.routing_score || 0),
    metadata,
    updated_at: new Date().toISOString(),
  };
}

function candidates(payload: Record<string, any>) {
  const rich = { ...payload };

  const medium = {
    email: payload.email,
    auth_user_id: payload.auth_user_id,
    full_name: payload.full_name,
    company: payload.company,
    company_name: payload.company_name,
    phone: payload.phone,
    profile_photo_url: payload.profile_photo_url,
    photo_url: payload.photo_url,
    avatar_url: payload.avatar_url,
    home_state: payload.home_state,
    market_primary: payload.market_primary,
    primary_market: payload.primary_market,
    deal_states: payload.deal_states,
    markets: payload.markets,
    states: payload.states,
    operating_states: payload.operating_states,
    member_types: payload.member_types,
    member_type: payload.member_type,
    roles: payload.roles,
    strategies: payload.strategies,
    strategy: payload.strategy,
    asset_focus: payload.asset_focus,
    needs: payload.needs,
    can_provide: payload.can_provide,
    pain_signals: payload.pain_signals,
    buy_box: payload.buy_box,
    buy_box_focus: payload.buy_box_focus,
    funding_capacity: payload.funding_capacity,
    capital_capacity: payload.capital_capacity,
    strategy_notes: payload.strategy_notes,
    notes: payload.notes,
    network_accepted: payload.network_accepted,
    accepted_to_network: payload.accepted_to_network,
    available_to_network: payload.available_to_network,
    allow_networking: payload.allow_networking,
    profile_complete: payload.profile_complete,
    access_status: payload.access_status,
    payment_status: payload.payment_status,
    member_status: payload.member_status,
    is_active: payload.is_active,
    is_suspended: payload.is_suspended,
    routing_score: payload.routing_score,
    metadata: payload.metadata,
    updated_at: payload.updated_at,
  };

  const safe = {
    email: payload.email,
    auth_user_id: payload.auth_user_id,
    full_name: payload.full_name,
    profile_complete: payload.profile_complete,
    access_status: payload.access_status,
    payment_status: payload.payment_status,
    member_status: payload.member_status,
    is_active: payload.is_active,
    is_suspended: payload.is_suspended,
    routing_score: payload.routing_score,
    metadata: payload.metadata,
    updated_at: payload.updated_at,
  };

  const minimal = {
    email: payload.email,
    full_name: payload.full_name,
    profile_complete: payload.profile_complete,
    metadata: payload.metadata,
    updated_at: payload.updated_at,
  };

  return [rich, medium, safe, minimal];
}

function normalizeProfile(row: any) {
  if (!row) return {};

  const metadata = typeof row.metadata === "object" && row.metadata ? row.metadata : {};

  return {
    ...metadata,
    ...row,
    full_name: clean(row.full_name || metadata.full_name),
    company: clean(row.company || row.company_name || metadata.company),
    phone: clean(row.phone || metadata.phone),
    profile_photo_url: clean(row.profile_photo_url || row.photo_url || row.avatar_url || metadata.profile_photo_url),
    home_state: clean(row.home_state || row.market_primary || row.primary_market || metadata.home_state),
    deal_states: arr(row.deal_states || row.markets || row.states || row.operating_states || metadata.deal_states || metadata.markets),
    member_types: arr(row.member_types || row.member_type || row.roles || metadata.member_types),
    strategies: arr(row.strategies || row.strategy || metadata.strategies),
    asset_focus: arr(row.asset_focus || metadata.asset_focus),
    needs: arr(row.needs || metadata.needs),
    can_provide: arr(row.can_provide || metadata.can_provide),
    pain_signals: arr(row.pain_signals || metadata.pain_signals),
    buy_box: clean(row.buy_box || row.buy_box_focus || metadata.buy_box),
    funding_capacity: clean(row.funding_capacity || row.capital_capacity || metadata.funding_capacity),
    strategy_notes: clean(row.strategy_notes || row.notes || metadata.strategy_notes),
    network_accepted: Boolean(row.network_accepted ?? row.accepted_to_network ?? row.available_to_network ?? metadata.network_accepted),
  };
}

export async function GET(request: NextRequest) {
  try {
    const email = selectEmail(request);

    if (!email) {
      return NextResponse.json({ ok: false, error: "Email required." }, { status: 400 });
    }

    const db = supabase();

    const { data, error } = await db
      .from("vf_profiles")
      .select("*")
      .eq("email", email)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      profile: normalizeProfile(data || { email }),
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

    const existing = await db
      .from("vf_profiles")
      .select("id,email")
      .eq("email", email)
      .maybeSingle();

    const attempts: any[] = [];

    for (const candidate of candidates(payload)) {
      const cleaned = Object.fromEntries(
        Object.entries(candidate).filter(([_, value]) => value !== undefined)
      );

      let result;

      if (existing.data?.email) {
        result = await db
          .from("vf_profiles")
          .update(cleaned)
          .eq("email", email)
          .select("*")
          .single();
      } else {
        result = await db
          .from("vf_profiles")
          .insert({
            ...cleaned,
            created_at: new Date().toISOString(),
          })
          .select("*")
          .single();
      }

      attempts.push({
        ok: !result.error,
        error: result.error?.message || null,
        keys: Object.keys(cleaned),
      });

      if (!result.error && result.data) {
        return NextResponse.json({
          ok: true,
          message: existing.data?.email ? "Profile updated." : "Profile created.",
          profile: normalizeProfile(result.data),
        });
      }
    }

    return NextResponse.json(
      {
        ok: false,
        error: "Profile save failed after compatible attempts.",
        attempts,
      },
      { status: 500 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Profile could not be saved." },
      { status: 500 }
    );
  }
}
