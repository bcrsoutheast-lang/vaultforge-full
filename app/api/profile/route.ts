import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const TABLES = ["vf_profiles", "profiles", "member_profiles"];

type Payload = Record<string, any>;

function supabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
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
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}

function clean(value: unknown) {
  return String(value || "").trim();
}

function cleanEmail(value: unknown) {
  return clean(value).toLowerCase();
}

function arr(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((v) => String(v || "").trim()).filter(Boolean);
  }

  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value);

      if (Array.isArray(parsed)) {
        return parsed.map((v) => String(v || "").trim()).filter(Boolean);
      }
    } catch {
      // Continue to comma split.
    }

    return value
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
  }

  return [];
}

function join(value: unknown) {
  return arr(value).join(", ");
}

function intValue(value: unknown, fallback: number) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function compactPayload(payload: Payload, allowed: string[]) {
  const next: Payload = {};

  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(payload, key)) {
      next[key] = payload[key];
    }
  }

  return next;
}

function stringifyArrayFields(payload: Payload) {
  const arrayFields = [
    "member_types",
    "buy_box_states",
    "buy_box_types",
    "buy_box_strategies",
    "market_states",
    "property_types",
    "asset_types",
    "strategies",
    "needs",
    "deal_needs",
    "what_i_need",
    "can_provide",
    "what_i_provide",
    "alert_types",
    "distress_signals",
    "pain_signals",
  ];

  const next = { ...payload };

  for (const field of arrayFields) {
    if (Array.isArray(next[field])) {
      next[field] = next[field].join(", ");
    }
  }

  return next;
}

async function getExisting(supabase: any, table: string, email: string) {
  try {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .eq("email", email)
      .maybeSingle();

    if (!error && data) return data;
  } catch {
    // Ignore and return null.
  }

  return null;
}

async function saveToTable(supabase: any, table: string, payload: Payload) {
  const fullAllowed = [
    "email",
    "full_name",
    "phone",
    "company",
    "role",
    "member_role",
    "city",
    "state",
    "markets",
    "market_states",
    "member_types",
    "buy_box",
    "funding_capacity",
    "strategy",
    "profile_photo_url",
    "profile_complete",
    "payment_status",
    "access_status",
    "alert_frequency",
    "max_alerts_per_day",
    "alert_types",
    "buy_box_states",
    "buy_box_types",
    "buy_box_strategies",
    "property_types",
    "asset_types",
    "strategies",
    "needs",
    "deal_needs",
    "what_i_need",
    "can_provide",
    "what_i_provide",
    "distress_signals",
    "pain_signals",
    "updated_at",
  ];

  const legacyAllowed = [
    "email",
    "full_name",
    "phone",
    "company",
    "role",
    "member_role",
    "city",
    "state",
    "markets",
    "member_types",
    "buy_box",
    "funding_capacity",
    "strategy",
    "profile_photo_url",
    "profile_complete",
    "payment_status",
    "access_status",
    "alert_frequency",
    "max_alerts_per_day",
    "alert_types",
    "updated_at",
  ];

  const minimalAllowed = [
    "email",
    "full_name",
    "phone",
    "company",
    "role",
    "city",
    "state",
    "markets",
    "profile_photo_url",
    "profile_complete",
    "payment_status",
    "access_status",
    "updated_at",
  ];

  const variants = [
    compactPayload(payload, fullAllowed),
    stringifyArrayFields(compactPayload(payload, fullAllowed)),
    compactPayload(payload, legacyAllowed),
    stringifyArrayFields(compactPayload(payload, legacyAllowed)),
    compactPayload(payload, minimalAllowed),
  ];

  const errors: string[] = [];

  for (const variant of variants) {
    try {
      const { data, error } = await supabase
        .from(table)
        .upsert(variant, { onConflict: "email" })
        .select("*")
        .single();

      if (!error && data) {
        return {
          ok: true,
          data,
          table,
          keys: Object.keys(variant),
        };
      }

      if (error?.message) errors.push(error.message);
    } catch (error: any) {
      if (error?.message) errors.push(error.message);
    }
  }

  return {
    ok: false,
    data: null,
    table,
    error: errors[0] || `Profile save failed for ${table}.`,
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const email =
      cleanEmail(request.headers.get("x-vf-email")) ||
      cleanEmail(body.email);

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Missing member email." }, { status: 400 });
    }

    const supabase = supabaseClient();

    const existingRows = await Promise.all(
      TABLES.map(async (table) => ({
        table,
        row: await getExisting(supabase, table, email),
      }))
    );

    const existingPhoto =
      clean(body.profile_photo_url || body.profilePhotoUrl) ||
      clean(existingRows.find((item) => item.row?.profile_photo_url)?.row?.profile_photo_url) ||
      clean(existingRows.find((item) => item.row?.profilePhotoUrl)?.row?.profilePhotoUrl);

    const memberTypes = arr(body.member_types || body.memberTypes);
    const buyBoxStates = arr(body.buy_box_states || body.market_states || body.markets || body.state);
    const buyBoxTypes = arr(body.buy_box_types || body.property_types || body.asset_types);
    const buyBoxStrategies = arr(body.buy_box_strategies || body.strategies || body.strategy);
    const needs = arr(body.needs || body.deal_needs || body.what_i_need);
    const canProvide = arr(body.can_provide || body.what_i_provide);
    const alertTypes = arr(body.alert_types);
    const distressSignals = arr(body.distress_signals || body.pain_signals);

    const fullName = clean(body.full_name || body.fullName || body.name);
    const phone = clean(body.phone);
    const company = clean(body.company);
    const primaryRole = clean(body.role || body.member_role || memberTypes[0]);
    const city = clean(body.city);
    const state = clean(body.state || buyBoxStates[0] || "Georgia");

    const profileComplete = Boolean(fullName && phone && primaryRole && city && state);

    const currentPayment = clean(body.payment_status);
    const currentAccess = clean(body.access_status);

    const payload: Payload = {
      email,
      full_name: fullName,
      phone,
      company,
      role: primaryRole,
      member_role: primaryRole,
      city,
      state,

      markets: join(buyBoxStates),
      market_states: buyBoxStates,

      member_types: memberTypes.length ? memberTypes : primaryRole ? [primaryRole] : [],

      buy_box: clean(body.buy_box || body.buyBox),
      funding_capacity: clean(body.funding_capacity || body.fundingCapacity),
      strategy: clean(body.strategy),
      profile_photo_url: existingPhoto,

      buy_box_states: buyBoxStates,
      buy_box_types: buyBoxTypes,
      buy_box_strategies: buyBoxStrategies,

      property_types: buyBoxTypes,
      asset_types: buyBoxTypes,
      strategies: buyBoxStrategies,

      needs,
      deal_needs: needs,
      what_i_need: needs,

      can_provide: canProvide,
      what_i_provide: canProvide,

      distress_signals: distressSignals,
      pain_signals: distressSignals,

      profile_complete: profileComplete,

      payment_status: currentPayment || "unpaid",
      access_status: currentAccess || (profileComplete ? "payment_required" : "locked"),

      alert_frequency: clean(body.alert_frequency) || "daily_digest",
      max_alerts_per_day: intValue(body.max_alerts_per_day, 10),
      alert_types: alertTypes,

      updated_at: new Date().toISOString(),
    };

    let lastError = "";
    let saved: any = null;
    let savedTable = "";
    let savedKeys: string[] = [];

    for (const table of TABLES) {
      const result = await saveToTable(supabase, table, payload);

      if (result.ok) {
        saved = result.data;
        savedTable = result.table;
        savedKeys = result.keys || [];
        lastError = "";
        break;
      }

      lastError = result.error || `Could not save to ${table}.`;
    }

    if (lastError || !saved) {
      return NextResponse.json(
        { error: lastError || "Profile save failed." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      profile: saved,
      profile_complete: profileComplete,
      next_step: profileComplete ? "payment" : "profile",
      saved_table: savedTable,
      saved_keys: savedKeys,
      message: profileComplete
        ? "Profile complete. Smart routing fields saved."
        : "Profile saved. Complete required fields to unlock payment step.",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "Could not save profile.",
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
