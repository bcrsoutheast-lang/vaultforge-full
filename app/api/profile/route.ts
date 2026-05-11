import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type AnyRow = Record<string, any>;

function supabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    "";

  if (!url || !key) throw new Error("Missing Supabase environment values.");

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
}

function clean(value: unknown) {
  return String(value || "").trim();
}

function cleanEmail(value: unknown) {
  return clean(value).toLowerCase();
}

function readCookie(cookieHeader: string, name: string) {
  const parts = cookieHeader.split(";").map((part) => part.trim());

  for (const part of parts) {
    if (!part.startsWith(`${name}=`)) continue;

    try {
      return decodeURIComponent(part.slice(name.length + 1));
    } catch {
      return part.slice(name.length + 1);
    }
  }

  return "";
}

function requestEmail(request: Request, body: AnyRow = {}) {
  const url = new URL(request.url);
  const cookie = request.headers.get("cookie") || "";

  return cleanEmail(
    request.headers.get("x-vf-email") ||
      body.email ||
      body.member_email ||
      url.searchParams.get("email") ||
      readCookie(cookie, "vf_email") ||
      readCookie(cookie, "vf_member_email") ||
      readCookie(cookie, "vf_admin_email")
  );
}

function arrayClean(value: unknown) {
  if (Array.isArray(value)) {
    return value.map(clean).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map(clean)
      .filter(Boolean);
  }

  return [];
}

function bool(value: unknown) {
  if (typeof value === "boolean") return value;
  const text = clean(value).toLowerCase();
  return ["1", "true", "yes", "y", "on", "accepted"].includes(text);
}

function buildProfilePayload(email: string, body: AnyRow) {
  const memberTypes = arrayClean(body.member_types || body.member_type || body.roles);
  const markets = arrayClean(body.markets || body.states || body.operating_states);
  const strategies = arrayClean(body.strategies || body.strategy);
  const assetFocus = arrayClean(body.asset_focus || body.assets);
  const needs = arrayClean(body.needs || body.what_you_need);
  const canProvide = arrayClean(body.can_provide || body.provides || body.provider_abilities);
  const painSignals = arrayClean(body.pain_signals || body.distress_signals);
  const networkAccepted = bool(body.network_accepted || body.accept_network || body.accepted_network || body.available_to_network);
  const profilePhotoUrl = clean(body.profile_photo_url || body.photo_url || body.avatar_url || body.image_url);
  const name = clean(body.name || body.full_name || body.display_name);
  const company = clean(body.company || body.company_name);
  const buyBox = clean(body.buy_box || body.buy_box_focus);
  const fundingCapacity = clean(body.funding_capacity || body.capital_capacity);
  const strategyNotes = clean(body.strategy_notes || body.notes || body.watch_for);
  const phone = clean(body.phone || body.phone_number);
  const marketPrimary = clean(body.market_primary || body.primary_market);
  const memberStatus = networkAccepted ? "network_active" : "profile_saved";

  const metadata = {
    member_types: memberTypes,
    markets,
    strategies,
    asset_focus: assetFocus,
    needs,
    can_provide: canProvide,
    pain_signals: painSignals,
    network_accepted: networkAccepted,
    accepted_to_network: networkAccepted,
    available_to_network: networkAccepted,
    profile_photo_url: profilePhotoUrl,
    buy_box: buyBox,
    funding_capacity: fundingCapacity,
    strategy_notes: strategyNotes,
    phone,
    market_primary: marketPrimary,
    updated_from: "profile_member_network_fix",
  };

  return {
    email,
    member_email: email,
    auth_user_id: clean(body.auth_user_id || email),
    full_name: name,
    name,
    display_name: name,
    company,
    company_name: company,
    phone,
    profile_photo_url: profilePhotoUrl,
    photo_url: profilePhotoUrl,
    avatar_url: profilePhotoUrl,
    member_types: memberTypes,
    member_type: memberTypes,
    roles: memberTypes,
    markets,
    states: markets,
    operating_states: markets,
    strategies,
    strategy: strategies,
    asset_focus: assetFocus,
    needs,
    can_provide: canProvide,
    pain_signals: painSignals,
    buy_box: buyBox,
    buy_box_focus: buyBox,
    funding_capacity: fundingCapacity,
    capital_capacity: fundingCapacity,
    strategy_notes: strategyNotes,
    notes: strategyNotes,
    market_primary: marketPrimary,
    primary_market: marketPrimary,
    network_accepted: networkAccepted,
    accepted_to_network: networkAccepted,
    available_to_network: networkAccepted,
    allow_networking: networkAccepted,
    profile_complete: true,
    payment_status: clean(body.payment_status || "member"),
    access_status: clean(body.access_status || "member"),
    member_status: memberStatus,
    is_active: true,
    is_suspended: false,
    routing_score: Number(body.routing_score || 80),
    metadata,
    updated_at: new Date().toISOString(),
  };
}

function normalizeProfile(row: AnyRow, email: string) {
  const metadata = typeof row?.metadata === "object" && row.metadata ? row.metadata : {};

  return {
    id: row.id || "",
    email: cleanEmail(row.email || row.member_email || email),
    name: clean(row.full_name || row.name || row.display_name || metadata.name),
    company: clean(row.company || row.company_name || metadata.company),
    phone: clean(row.phone || metadata.phone),
    profile_photo_url: clean(row.profile_photo_url || row.photo_url || row.avatar_url || metadata.profile_photo_url),
    member_types: Array.isArray(row.member_types) ? row.member_types : Array.isArray(row.member_type) ? row.member_type : Array.isArray(row.roles) ? row.roles : Array.isArray(metadata.member_types) ? metadata.member_types : [],
    markets: Array.isArray(row.markets) ? row.markets : Array.isArray(row.states) ? row.states : Array.isArray(row.operating_states) ? row.operating_states : Array.isArray(metadata.markets) ? metadata.markets : [],
    strategies: Array.isArray(row.strategies) ? row.strategies : Array.isArray(row.strategy) ? row.strategy : Array.isArray(metadata.strategies) ? metadata.strategies : [],
    asset_focus: Array.isArray(row.asset_focus) ? row.asset_focus : Array.isArray(metadata.asset_focus) ? metadata.asset_focus : [],
    needs: Array.isArray(row.needs) ? row.needs : Array.isArray(metadata.needs) ? metadata.needs : [],
    can_provide: Array.isArray(row.can_provide) ? row.can_provide : Array.isArray(metadata.can_provide) ? metadata.can_provide : [],
    pain_signals: Array.isArray(row.pain_signals) ? row.pain_signals : Array.isArray(metadata.pain_signals) ? metadata.pain_signals : [],
    buy_box: clean(row.buy_box || row.buy_box_focus || metadata.buy_box),
    funding_capacity: clean(row.funding_capacity || row.capital_capacity || metadata.funding_capacity),
    strategy_notes: clean(row.strategy_notes || row.notes || metadata.strategy_notes),
    network_accepted: Boolean(row.network_accepted || row.accepted_to_network || row.available_to_network || metadata.network_accepted || metadata.accepted_to_network),
    member_status: clean(row.member_status || metadata.member_status || "profile_saved"),
    profile_complete: Boolean(row.profile_complete),
    routing_score: Number(row.routing_score || 80),
    metadata,
    raw: row,
  };
}

async function getExistingProfile(supabase: ReturnType<typeof supabaseClient>, email: string) {
  const tables = ["vf_profiles", "profiles", "members", "vf_members"];

  for (const table of tables) {
    try {
      const result = await supabase
        .from(table)
        .select("*")
        .or(`email.eq.${email},member_email.eq.${email}`)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!result.error && result.data) {
        return { table, data: result.data };
      }

      const fallback = await supabase.from(table).select("*").eq("email", email).limit(1).maybeSingle();

      if (!fallback.error && fallback.data) {
        return { table, data: fallback.data };
      }
    } catch {
      // Try next table.
    }
  }

  return { table: "vf_profiles", data: null };
}

function candidatePayloads(payload: AnyRow) {
  const rich = { ...payload };
  const medium = {
    email: payload.email,
    member_email: payload.member_email,
    auth_user_id: payload.auth_user_id,
    full_name: payload.full_name,
    name: payload.name,
    company: payload.company,
    company_name: payload.company_name,
    phone: payload.phone,
    profile_photo_url: payload.profile_photo_url,
    photo_url: payload.photo_url,
    member_types: payload.member_types,
    markets: payload.markets,
    strategies: payload.strategies,
    asset_focus: payload.asset_focus,
    needs: payload.needs,
    can_provide: payload.can_provide,
    pain_signals: payload.pain_signals,
    buy_box: payload.buy_box,
    funding_capacity: payload.funding_capacity,
    strategy_notes: payload.strategy_notes,
    network_accepted: payload.network_accepted,
    accepted_to_network: payload.accepted_to_network,
    available_to_network: payload.available_to_network,
    profile_complete: payload.profile_complete,
    access_status: payload.access_status,
    payment_status: payload.payment_status,
    member_status: payload.member_status,
    is_active: payload.is_active,
    metadata: payload.metadata,
    updated_at: payload.updated_at,
  };

  const safe = {
    email: payload.email,
    auth_user_id: payload.auth_user_id,
    full_name: payload.full_name,
    profile_complete: payload.profile_complete,
    payment_status: payload.payment_status,
    access_status: payload.access_status,
    member_status: payload.member_status,
    is_active: payload.is_active,
    is_suspended: payload.is_suspended,
    updated_at: payload.updated_at,
    metadata: payload.metadata,
  };

  const minimal = {
    email: payload.email,
    full_name: payload.full_name,
    profile_complete: payload.profile_complete,
    updated_at: payload.updated_at,
  };

  return [rich, medium, safe, minimal];
}

export async function GET(request: Request) {
  try {
    const email = requestEmail(request);

    if (!email) {
      return NextResponse.json({ ok: false, error: "Profile email required." }, { status: 400 });
    }

    const supabase = supabaseClient();
    const existing = await getExistingProfile(supabase, email);

    return NextResponse.json({
      ok: true,
      email,
      table: existing.table,
      profile: existing.data ? normalizeProfile(existing.data, email) : null,
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: "Could not load profile.", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as AnyRow;
    const email = requestEmail(request, body);

    if (!email) {
      return NextResponse.json({ ok: false, error: "Profile email required." }, { status: 400 });
    }

    const supabase = supabaseClient();
    const payload = buildProfilePayload(email, body);
    const existing = await getExistingProfile(supabase, email);

    const tablesToTry = existing.table ? [existing.table, "vf_profiles", "profiles", "members", "vf_members"] : ["vf_profiles", "profiles", "members", "vf_members"];
    const uniqueTables = Array.from(new Set(tablesToTry));
    const attempts: AnyRow[] = [];

    for (const table of uniqueTables) {
      for (const candidate of candidatePayloads(payload)) {
        try {
          let result;

          if (existing.data?.id && table === existing.table) {
            result = await supabase.from(table).update(candidate).eq("id", existing.data.id).select("*").single();
          } else {
            result = await supabase.from(table).upsert(candidate, { onConflict: "email" }).select("*").single();
          }

          attempts.push({ table, ok: !result.error, error: result.error?.message || null, keys: Object.keys(candidate) });

          if (!result.error && result.data) {
            return NextResponse.json({
              ok: true,
              saved: true,
              table,
              profile: normalizeProfile(result.data, email),
              network_accepted: payload.network_accepted,
              message: payload.network_accepted ? "Profile saved and marked available for networking." : "Profile saved.",
            });
          }
        } catch (error: any) {
          attempts.push({ table, ok: false, error: error?.message || String(error), keys: Object.keys(candidate) });
        }
      }
    }

    return NextResponse.json(
      {
        ok: false,
        error: "Profile could not be saved to available profile tables.",
        attempts,
      },
      { status: 500 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: "Could not save profile.", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}
