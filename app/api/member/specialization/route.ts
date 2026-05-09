import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const OWNER_EMAIL = "bcrsoutheast@gmail.com";

type AnyRecord = Record<string, any>;

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

function requestEmail(request: Request) {
  const url = new URL(request.url);
  const cookie = request.headers.get("cookie") || "";

  return cleanEmail(
    request.headers.get("x-vf-email") ||
      url.searchParams.get("email") ||
      readCookie(cookie, "vf_email") ||
      readCookie(cookie, "vf_admin_email")
  );
}

function isOwnerRequest(request: Request, email: string) {
  const url = new URL(request.url);
  const cookie = request.headers.get("cookie") || "";

  return (
    email === OWNER_EMAIL ||
    clean(request.headers.get("x-vf-admin")) === "1" ||
    clean(url.searchParams.get("owner")) === "1" ||
    cookie.includes("vf_admin=1") ||
    cookie.includes("isAdmin=true")
  );
}

function asArray(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => clean(item)).filter(Boolean);
  }

  const text = clean(value);
  if (!text) return [];

  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return parsed.map((item) => clean(item)).filter(Boolean);
  } catch {}

  return text
    .split(",")
    .map((item) => clean(item))
    .filter(Boolean);
}

function first(...values: unknown[]) {
  for (const value of values) {
    const text = clean(value);
    if (text) return text;
  }

  return "";
}

function includesAny(source: string, words: string[]) {
  const lower = source.toLowerCase();
  return words.some((word) => lower.includes(word));
}

function inferRoles(profile: AnyRecord) {
  const explicit = [
    ...asArray(profile.member_types),
    ...asArray(profile.member_type),
    ...asArray(profile.roles),
    ...asArray(profile.role),
    ...asArray(profile.user_roles),
  ];

  const source = [
    ...explicit,
    profile.buy_box,
    profile.strategy,
    profile.what_you_do,
    profile.can_provide,
    profile.needs,
    profile.company,
  ]
    .join(" ")
    .toLowerCase();

  const roles = new Set<string>();

  for (const role of explicit) {
    roles.add(role);
  }

  if (includesAny(source, ["buyer", "acquire", "acquisition", "rental", "buy box"])) roles.add("Buyer");
  if (includesAny(source, ["lender", "capital", "private money", "fund", "loan"])) roles.add("Lender");
  if (includesAny(source, ["operator", "asset manager", "manage", "stabilize"])) roles.add("Operator");
  if (includesAny(source, ["contractor", "construction", "repair", "renovation", "build"])) roles.add("Contractor");
  if (includesAny(source, ["wholesale", "disposition", "seller lead"])) roles.add("Wholesaler");
  if (includesAny(source, ["joint venture", "jv", "partner"])) roles.add("JV Partner");

  if (roles.size === 0 && clean(profile.role)) roles.add(clean(profile.role));

  return Array.from(roles);
}

function inferMarkets(profile: AnyRecord) {
  const markets = new Set<string>();

  for (const value of [
    ...asArray(profile.markets),
    ...asArray(profile.states),
    ...asArray(profile.service_states),
    ...asArray(profile.target_markets),
  ]) {
    markets.add(value);
  }

  for (const value of [profile.state, profile.city]) {
    if (clean(value)) markets.add(clean(value));
  }

  return Array.from(markets);
}

function inferStrategies(profile: AnyRecord) {
  const strategies = new Set<string>();

  for (const value of [
    ...asArray(profile.strategies),
    ...asArray(profile.strategy),
    ...asArray(profile.asset_strategy),
    ...asArray(profile.investment_strategy),
  ]) {
    strategies.add(value);
  }

  const source = [
    profile.buy_box,
    profile.strategy,
    profile.needs,
    profile.can_provide,
    profile.asset_types,
  ]
    .join(" ")
    .toLowerCase();

  if (includesAny(source, ["fix", "flip", "renovation"])) strategies.add("Fix & Flip");
  if (includesAny(source, ["rental", "buy and hold", "hold"])) strategies.add("Buy & Hold");
  if (includesAny(source, ["brrrr", "brrrr"])) strategies.add("BRRRR");
  if (includesAny(source, ["private money", "lend", "loan"])) strategies.add("Private Money");
  if (includesAny(source, ["land"])) strategies.add("Land");
  if (includesAny(source, ["commercial", "retail", "office", "industrial"])) strategies.add("Commercial");

  return Array.from(strategies);
}

function inferAssetTypes(profile: AnyRecord) {
  const types = new Set<string>();

  for (const value of [
    ...asArray(profile.asset_types),
    ...asArray(profile.property_types),
    ...asArray(profile.property_type),
    ...asArray(profile.buy_box_asset_types),
  ]) {
    types.add(value);
  }

  const source = [
    profile.buy_box,
    profile.strategy,
    profile.needs,
    profile.can_provide,
  ]
    .join(" ")
    .toLowerCase();

  if (includesAny(source, ["single family", "sfh", "house"])) types.add("Single Family");
  if (includesAny(source, ["multifamily", "multi family", "duplex", "triplex", "quad"])) types.add("Multifamily");
  if (includesAny(source, ["commercial"])) types.add("Commercial");
  if (includesAny(source, ["land", "lot", "acre"])) types.add("Land");
  if (includesAny(source, ["mobile home", "manufactured"])) types.add("Mobile Home");

  return Array.from(types);
}

function inferCapacity(profile: AnyRecord) {
  return first(
    profile.funding_capacity,
    profile.capital_capacity,
    profile.lending_capacity,
    profile.buying_power,
    profile.budget,
    profile.price_range,
    profile.capital_range
  );
}

function inferNeeds(profile: AnyRecord) {
  const needs = new Set<string>();

  for (const value of [
    ...asArray(profile.needs),
    ...asArray(profile.looking_for),
    ...asArray(profile.seeking),
    ...asArray(profile.need_help_with),
  ]) {
    needs.add(value);
  }

  const source = [profile.needs, profile.looking_for, profile.buy_box].join(" ").toLowerCase();

  if (includesAny(source, ["deal", "property", "opportunity"])) needs.add("Deal Flow");
  if (includesAny(source, ["capital", "funding", "loan"])) needs.add("Capital");
  if (includesAny(source, ["operator", "partner", "jv"])) needs.add("Operating Partner");
  if (includesAny(source, ["contractor", "repair", "construction"])) needs.add("Contractor");
  if (includesAny(source, ["buyer"])) needs.add("Buyer");

  return Array.from(needs);
}

function inferProvides(profile: AnyRecord) {
  const provides = new Set<string>();

  for (const value of [
    ...asArray(profile.provides),
    ...asArray(profile.can_provide),
    ...asArray(profile.offers),
    ...asArray(profile.services),
  ]) {
    provides.add(value);
  }

  const source = [profile.can_provide, profile.services, profile.role, profile.member_types].join(" ").toLowerCase();

  if (includesAny(source, ["capital", "funding", "lender", "loan"])) provides.add("Capital");
  if (includesAny(source, ["buyer", "acquisition"])) provides.add("Buying Demand");
  if (includesAny(source, ["contractor", "repair", "construction"])) provides.add("Execution");
  if (includesAny(source, ["operator", "asset manage", "manage"])) provides.add("Operations");
  if (includesAny(source, ["deal", "wholesale", "seller lead"])) provides.add("Deal Flow");

  return Array.from(provides);
}

function completenessScore(specialization: AnyRecord, profile: AnyRecord) {
  const required = [
    ["email", clean(profile.email)],
    ["name", first(profile.full_name, profile.name)],
    ["roles", specialization.roles.length],
    ["markets", specialization.markets.length],
    ["strategies", specialization.strategies.length],
    ["asset_types", specialization.asset_types.length],
    ["buy_box", clean(profile.buy_box)],
    ["needs_or_provides", specialization.needs.length || specialization.provides.length],
  ];

  const filled = required.filter(([, value]) => Boolean(value)).length;
  const score = Math.round((filled / required.length) * 100);
  const gaps = required.filter(([, value]) => !value).map(([key]) => key);

  return {
    score,
    gaps,
  };
}

function routingReadiness(score: number) {
  if (score >= 85) return "high";
  if (score >= 60) return "medium";
  return "low";
}

function normalizeProfile(profile: AnyRecord) {
  const specialization = {
    id: profile.id,
    email: cleanEmail(profile.email),
    full_name: first(profile.full_name, profile.name),
    company: first(profile.company, profile.company_name),
    phone: first(profile.phone, profile.mobile),
    city: first(profile.city),
    state: first(profile.state),
    roles: inferRoles(profile),
    markets: inferMarkets(profile),
    strategies: inferStrategies(profile),
    asset_types: inferAssetTypes(profile),
    buy_box: first(profile.buy_box, profile.buyBox),
    funding_capacity: inferCapacity(profile),
    needs: inferNeeds(profile),
    provides: inferProvides(profile),
    profile_complete: Boolean(profile.profile_complete),
    payment_status: first(profile.payment_status),
    access_status: first(profile.access_status),
    member_status: first(profile.member_status),
    is_active: Boolean(profile.is_active),
    is_suspended: Boolean(profile.is_suspended),
    updated_at: first(profile.updated_at),
  };

  const completeness = completenessScore(specialization, profile);

  return {
    ...specialization,
    completeness_score: completeness.score,
    completeness_gaps: completeness.gaps,
    routing_readiness: routingReadiness(completeness.score),
    routing_summary: [
      specialization.roles.length ? `Roles: ${specialization.roles.join(", ")}` : "",
      specialization.markets.length ? `Markets: ${specialization.markets.join(", ")}` : "",
      specialization.strategies.length ? `Strategies: ${specialization.strategies.join(", ")}` : "",
      specialization.asset_types.length ? `Assets: ${specialization.asset_types.join(", ")}` : "",
    ]
      .filter(Boolean)
      .join(" · ") || "Specialization data incomplete.",
  };
}

async function readProfiles(supabase: any, owner: boolean, email: string) {
  const tables = ["vf_profiles", "profiles", "member_profiles"];
  const errors: string[] = [];

  for (const table of tables) {
    try {
      let query = supabase
        .from(table)
        .select("*")
        .limit(owner ? 500 : 1);

      if (!owner) {
        query = query.eq("email", email);
      }

      const { data, error } = await query;

      if (!error && Array.isArray(data)) {
        return {
          table,
          profiles: data,
        };
      }

      if (error?.message) errors.push(`${table}: ${error.message}`);
    } catch (error: any) {
      if (error?.message) errors.push(`${table}: ${error.message}`);
    }
  }

  return {
    table: "",
    profiles: [],
    error: errors[0] || "No readable profile table found.",
  };
}

export async function GET(request: Request) {
  try {
    const email = requestEmail(request);

    if (!email) {
      return NextResponse.json(
        {
          ok: false,
          error: "Login email required.",
        },
        { status: 401 }
      );
    }

    const owner = isOwnerRequest(request, email);
    const supabase = supabaseClient();

    const result = await readProfiles(supabase, owner, email);
    const members = result.profiles.map(normalizeProfile);

    return NextResponse.json({
      ok: true,
      owner,
      email,
      table: result.table,
      members,
      member: owner ? null : members[0] || null,
      counts: {
        members: members.length,
        routing_ready_high: members.filter((item: AnyRecord) => item.routing_readiness === "high").length,
        routing_ready_medium: members.filter((item: AnyRecord) => item.routing_readiness === "medium").length,
        routing_ready_low: members.filter((item: AnyRecord) => item.routing_readiness === "low").length,
        buyers: members.filter((item: AnyRecord) => item.roles.includes("Buyer")).length,
        lenders: members.filter((item: AnyRecord) => item.roles.includes("Lender")).length,
        operators: members.filter((item: AnyRecord) => item.roles.includes("Operator")).length,
        contractors: members.filter((item: AnyRecord) => item.roles.includes("Contractor")).length,
      },
      warning: result.error || "",
      note: owner
        ? "Owner/global member specialization intelligence."
        : "Member-safe specialization intelligence for this account.",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: "Could not load member specialization intelligence.",
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
