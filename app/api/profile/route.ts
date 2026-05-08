import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const TABLES = ["vf_profiles", "profiles", "member_profiles"];

type Row = Record<string, any>;

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
  return String(value || "").trim();
}

function cleanEmail(value: unknown) {
  return clean(value).toLowerCase();
}

function emailFromCookie(cookieHeader: string) {
  const parts = cookieHeader.split(";").map((part) => part.trim());

  for (const part of parts) {
    if (part.startsWith("vf_email=")) {
      try {
        return decodeURIComponent(part.replace("vf_email=", "")).toLowerCase();
      } catch {
        return part.replace("vf_email=", "").toLowerCase();
      }
    }
  }

  return "";
}

function asArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => clean(item)).filter(Boolean);
  }

  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value);

      if (Array.isArray(parsed)) {
        return parsed.map((item) => clean(item)).filter(Boolean);
      }
    } catch {
      // Continue to comma split.
    }

    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
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

function mergeArrays(...values: unknown[]) {
  return unique(values.flatMap((value) => asArray(value)));
}

function firstText(...values: unknown[]) {
  for (const value of values) {
    const text = clean(value);

    if (text) return text;
  }

  return "";
}

function timestamp(row: Row) {
  return new Date(
    row?.updated_at ||
      row?.modified_at ||
      row?.created_at ||
      row?.inserted_at ||
      0
  ).getTime();
}

function tableScore(row: Row) {
  if (row._source_table === "vf_profiles") return 100;
  if (row._source_table === "profiles") return 80;
  if (row._source_table === "member_profiles") return 60;
  return 0;
}

function score(row: Row) {
  return tableScore(row) + (row.profile_complete ? 10 : 0) + timestamp(row) / 10000000000000;
}

function newestNonEmpty(rows: Row[], key: string) {
  const sorted = [...rows].sort((a, b) => score(b) - score(a));

  for (const row of sorted) {
    const value = clean(row?.[key]);

    if (value) return value;
  }

  return "";
}

function bestRow(rows: Row[]) {
  return [...rows].sort((a, b) => score(b) - score(a))[0] || {};
}

function mergeProfiles(rows: Row[]) {
  if (!rows.length) return null;

  const best = bestRow(rows);

  const memberTypes = mergeArrays(
    ...rows.map((row) => row.member_types),
    ...rows.map((row) => row.memberTypes),
    ...rows.map((row) => row.role),
    ...rows.map((row) => row.member_role)
  );

  const buyBoxStates = mergeArrays(
    ...rows.map((row) => row.buy_box_states),
    ...rows.map((row) => row.market_states),
    ...rows.map((row) => row.markets),
    ...rows.map((row) => row.state)
  );

  const buyBoxTypes = mergeArrays(
    ...rows.map((row) => row.buy_box_types),
    ...rows.map((row) => row.property_types),
    ...rows.map((row) => row.asset_types)
  );

  const buyBoxStrategies = mergeArrays(
    ...rows.map((row) => row.buy_box_strategies),
    ...rows.map((row) => row.strategies),
    ...rows.map((row) => row.strategy)
  );

  const needs = mergeArrays(
    ...rows.map((row) => row.needs),
    ...rows.map((row) => row.deal_needs),
    ...rows.map((row) => row.what_i_need)
  );

  const canProvide = mergeArrays(
    ...rows.map((row) => row.can_provide),
    ...rows.map((row) => row.what_i_provide)
  );

  const alertTypes = mergeArrays(
    ...rows.map((row) => row.alert_types)
  );

  const distressSignals = mergeArrays(
    ...rows.map((row) => row.distress_signals),
    ...rows.map((row) => row.pain_signals),
    ...rows.map((row) => row.problem_signals)
  );

  const email = cleanEmail(
    newestNonEmpty(rows, "email") ||
      newestNonEmpty(rows, "member_email") ||
      newestNonEmpty(rows, "user_email")
  );

  const fullName = firstText(
    newestNonEmpty(rows, "full_name"),
    newestNonEmpty(rows, "fullName"),
    newestNonEmpty(rows, "name")
  );

  const memberRole = firstText(
    newestNonEmpty(rows, "member_role"),
    newestNonEmpty(rows, "role"),
    memberTypes[0]
  );

  const state = firstText(
    newestNonEmpty(rows, "state"),
    buyBoxStates[0],
    "Georgia"
  );

  const profilePhotoUrl = firstText(
    newestNonEmpty(rows, "profile_photo_url"),
    newestNonEmpty(rows, "profilePhotoUrl"),
    newestNonEmpty(rows, "avatar_url"),
    newestNonEmpty(rows, "photo_url")
  );

  const profileComplete =
    rows.some((row) => row.profile_complete === true || String(row.profile_complete).toLowerCase() === "true") ||
    Boolean(fullName && firstText(newestNonEmpty(rows, "phone")) && memberRole && newestNonEmpty(rows, "city") && state);

  return {
    ...best,

    email,
    full_name: fullName,
    phone: newestNonEmpty(rows, "phone"),
    company: newestNonEmpty(rows, "company"),
    role: memberRole,
    member_role: memberRole,
    city: newestNonEmpty(rows, "city"),
    state,
    markets: newestNonEmpty(rows, "markets") || buyBoxStates.join(", "),
    buy_box: newestNonEmpty(rows, "buy_box") || newestNonEmpty(rows, "buyBox"),
    funding_capacity:
      newestNonEmpty(rows, "funding_capacity") ||
      newestNonEmpty(rows, "fundingCapacity"),
    strategy: newestNonEmpty(rows, "strategy"),
    profile_photo_url: profilePhotoUrl,

    member_types: memberTypes,
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
    alert_types: alertTypes,
    distress_signals: distressSignals,
    pain_signals: distressSignals,

    alert_frequency: newestNonEmpty(rows, "alert_frequency") || "daily_digest",
    max_alerts_per_day: newestNonEmpty(rows, "max_alerts_per_day") || "10",

    payment_status: newestNonEmpty(rows, "payment_status") || "unpaid",
    access_status: newestNonEmpty(rows, "access_status") || "locked",
    profile_complete: profileComplete,

    _source_table: best._source_table,
    _sources_checked: rows.map((row) => row._source_table),
  };
}

async function findRows(supabase: any, table: string, email: string) {
  const rows: Row[] = [];

  for (const column of ["email", "member_email", "user_email", "owner_email"]) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select("*")
        .eq(column, email)
        .limit(10);

      if (!error && Array.isArray(data)) {
        rows.push(
          ...data.map((row) => ({
            ...row,
            _source_table: table,
          }))
        );
      }
    } catch {
      // Try next column.
    }
  }

  const seen = new Set<string>();

  return rows.filter((row) => {
    const key = clean(
      row.id ||
        row.profile_id ||
        row.auth_user_id ||
        `${table}-${row.email}-${row.updated_at}`
    );

    if (!key) return true;

    if (seen.has(key)) return false;

    seen.add(key);

    return true;
  });
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);

    const email =
      cleanEmail(request.headers.get("x-vf-email")) ||
      cleanEmail(url.searchParams.get("email")) ||
      emailFromCookie(request.headers.get("cookie") || "");

    if (!email) {
      return NextResponse.json({
        ok: true,
        profile: null,
        email: "",
      });
    }

    const supabase = supabaseClient();

    if (!supabase) {
      return NextResponse.json({
        ok: true,
        profile: null,
        email,
        warning: "Supabase env missing.",
      });
    }

    const allRowsNested = await Promise.all(
      TABLES.map((table) => findRows(supabase, table, email))
    );

    const rows = allRowsNested.flat();
    const profile = mergeProfiles(rows);

    if (profile) {
      return NextResponse.json({
        ok: true,
        profile,
        email,
        table: (profile as any)._source_table || "merged",
        sources_checked: TABLES,
        rows_found: rows.length,
      });
    }

    return NextResponse.json({
      ok: true,
      profile: null,
      email,
      sources_checked: TABLES,
      rows_found: 0,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: "Could not load profile.",
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
