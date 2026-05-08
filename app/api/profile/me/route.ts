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

function timestamp(row: Row) {
  return new Date(row?.updated_at || row?.modified_at || row?.created_at || row?.inserted_at || 0).getTime();
}

function pickBest(rows: Row[]) {
  const scored = [...rows].sort((a, b) => {
    const tableScore = (row: Row) => {
      if (row._source_table === "vf_profiles") return 100;
      if (row._source_table === "profiles") return 80;
      if (row._source_table === "member_profiles") return 60;
      return 0;
    };

    const aScore = tableScore(a) + (a.profile_complete ? 10 : 0) + timestamp(a) / 10000000000000;
    const bScore = tableScore(b) + (b.profile_complete ? 10 : 0) + timestamp(b) / 10000000000000;

    return bScore - aScore;
  });

  return scored[0] || {};
}

function mergeProfiles(rows: Row[]) {
  if (!rows.length) return null;

  const best = pickBest(rows);

  const merged = rows.reduce((acc, row) => {
    return { ...acc, ...row };
  }, best);

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

  return {
    ...merged,
    email: cleanEmail(merged.email || rows[0]?.email),
    full_name: clean(merged.full_name || merged.fullName || merged.name),
    role: clean(merged.role || merged.member_role || memberTypes[0]),
    member_role: clean(merged.member_role || merged.role || memberTypes[0]),
    state: clean(merged.state || buyBoxStates[0] || "Georgia"),
    markets: clean(merged.markets) || buyBoxStates.join(", "),
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
        rows.push(...data.map((row) => ({ ...row, _source_table: table })));
      }
    } catch {
      // Try next column.
    }
  }

  const seen = new Set<string>();

  return rows.filter((row) => {
    const key = clean(row.id || row.profile_id || row.auth_user_id || `${table}-${row.email}-${row.updated_at}`);
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
      return NextResponse.json({ ok: true, profile: null, email: "" });
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

    const allRowsNested = await Promise.all(TABLES.map((table) => findRows(supabase, table, email)));
    const rows = allRowsNested.flat();
    const profile = mergeProfiles(rows);

    if (profile) {
      return NextResponse.json({
        ok: true,
        profile,
        email,
        table: profile._source_table || "merged",
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
