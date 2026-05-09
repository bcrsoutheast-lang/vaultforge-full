import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const OWNER_EMAIL = "bcrsoutheast@gmail.com";

type AnyRecord = Record<string, any>;

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

function words(values: unknown[]) {
  return values
    .flatMap((value) => asArray(value))
    .join(" ")
    .toLowerCase();
}

function hasOverlap(memberValues: unknown[], targetValues: unknown[]) {
  const member = asArray(memberValues.flat()).map((item) => item.toLowerCase());
  const target = asArray(targetValues.flat()).map((item) => item.toLowerCase());

  const hits = target.filter((targetItem) =>
    member.some((memberItem) => memberItem.includes(targetItem) || targetItem.includes(memberItem))
  );

  return Array.from(new Set(hits));
}

function detectContext(body: AnyRecord) {
  const state = clean(body.state || body.market || body.state_match || body.market_match);
  const city = clean(body.city);
  const strategy = clean(body.strategy || body.strategy_match || body.asset_strategy);
  const assetType = clean(body.asset_type || body.property_type || body.asset);
  const roleNeeded = clean(body.role_needed || body.role_match || body.target_role);
  const priority = clean(body.priority || "medium").toLowerCase();
  const title = clean(body.title || body.signal_title || body.deal_title);
  const note = clean(body.note || body.message || body.description || body.urgency_reason);

  const source = [title, note, state, city, strategy, assetType, roleNeeded].join(" ").toLowerCase();

  const inferredRoles = new Set<string>();
  if (source.includes("buyer") || source.includes("acquisition")) inferredRoles.add("Buyer");
  if (source.includes("lender") || source.includes("capital") || source.includes("fund")) inferredRoles.add("Lender");
  if (source.includes("operator") || source.includes("jv")) inferredRoles.add("Operator");
  if (source.includes("contractor") || source.includes("repair") || source.includes("construction")) inferredRoles.add("Contractor");
  if (roleNeeded) inferredRoles.add(roleNeeded);

  const inferredStrategies = new Set<string>();
  if (source.includes("flip")) inferredStrategies.add("Fix & Flip");
  if (source.includes("rental") || source.includes("hold")) inferredStrategies.add("Buy & Hold");
  if (source.includes("brrrr")) inferredStrategies.add("BRRRR");
  if (source.includes("private money") || source.includes("loan")) inferredStrategies.add("Private Money");
  if (strategy) inferredStrategies.add(strategy);

  const inferredAssets = new Set<string>();
  if (source.includes("single family") || source.includes("sfh")) inferredAssets.add("Single Family");
  if (source.includes("duplex") || source.includes("multifamily")) inferredAssets.add("Multifamily");
  if (source.includes("commercial")) inferredAssets.add("Commercial");
  if (source.includes("land")) inferredAssets.add("Land");
  if (assetType) inferredAssets.add(assetType);

  return {
    state,
    city,
    market_terms: [state, city].filter(Boolean),
    strategy_terms: Array.from(inferredStrategies),
    asset_terms: Array.from(inferredAssets),
    role_terms: Array.from(inferredRoles),
    priority,
    title,
    note,
  };
}

function scoreMember(member: AnyRecord, context: AnyRecord) {
  let score = 20;
  const reasons: string[] = [];
  const gaps: string[] = [];

  const roles = asArray(member.roles);
  const markets = asArray(member.markets);
  const strategies = asArray(member.strategies);
  const assetTypes = asArray(member.asset_types);
  const needs = asArray(member.needs);
  const provides = asArray(member.provides);

  const roleHits = hasOverlap([roles, provides], context.role_terms);
  if (roleHits.length) {
    score += 25;
    reasons.push(`Role fit: ${roleHits.join(", ")}`);
  } else if (context.role_terms.length) {
    gaps.push(`Missing role fit for ${context.role_terms.join(", ")}`);
  }

  const marketHits = hasOverlap([markets], context.market_terms);
  if (marketHits.length) {
    score += 20;
    reasons.push(`Market fit: ${marketHits.join(", ")}`);
  } else if (context.market_terms.length) {
    gaps.push(`Missing market fit for ${context.market_terms.join(", ")}`);
  }

  const strategyHits = hasOverlap([strategies, needs, provides, member.buy_box], context.strategy_terms);
  if (strategyHits.length) {
    score += 18;
    reasons.push(`Strategy fit: ${strategyHits.join(", ")}`);
  } else if (context.strategy_terms.length) {
    gaps.push(`Missing strategy fit for ${context.strategy_terms.join(", ")}`);
  }

  const assetHits = hasOverlap([assetTypes, member.buy_box], context.asset_terms);
  if (assetHits.length) {
    score += 14;
    reasons.push(`Asset fit: ${assetHits.join(", ")}`);
  } else if (context.asset_terms.length) {
    gaps.push(`Missing asset fit for ${context.asset_terms.join(", ")}`);
  }

  if (clean(member.funding_capacity)) {
    score += 5;
    reasons.push(`Capacity visible: ${member.funding_capacity}`);
  }

  const readiness = clean(member.routing_readiness).toLowerCase();
  if (readiness === "high") score += 10;
  if (readiness === "medium") score += 5;
  if (readiness === "low") gaps.push("Low routing readiness");

  if (context.priority === "urgent" && readiness === "high") {
    score += 5;
    reasons.push("High-readiness member for urgent signal");
  }

  const completeness = Number(member.completeness_score || 0);
  if (completeness < 60) gaps.push("Profile completeness below routing threshold");

  score = Math.max(0, Math.min(100, Math.round(score)));

  return {
    member_id: member.id,
    email: member.email,
    full_name: member.full_name,
    company: member.company,
    roles,
    markets,
    strategies,
    asset_types: assetTypes,
    routing_readiness: member.routing_readiness,
    completeness_score: member.completeness_score,
    fit_score: score,
    fit_level: score >= 80 ? "strong" : score >= 60 ? "possible" : "weak",
    reasons: reasons.length ? reasons : ["Limited match data. More profile/context depth needed."],
    gaps,
    routing_summary: member.routing_summary,
  };
}

async function fetchSpecialization(request: Request, email: string, owner: boolean) {
  const url = new URL(request.url);
  const baseUrl = `${url.protocol}//${url.host}`;

  const res = await fetch(
    `${baseUrl}/api/member/specialization?email=${encodeURIComponent(email)}&owner=${owner ? "1" : "0"}`,
    {
      cache: "no-store",
      headers: {
        "x-vf-email": email,
        "x-vf-admin": owner ? "1" : "0",
      },
    }
  );

  try {
    return await res.json();
  } catch {
    return {};
  }
}

export async function POST(request: Request) {
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
    const body = await request.json().catch(() => ({}));

    const specialization = await fetchSpecialization(request, email, owner);
    const members = Array.isArray(specialization?.members) ? specialization.members : [];
    const context = detectContext(body);

    const scored = members
      .map((member: AnyRecord) => scoreMember(member, context))
      .sort((a: AnyRecord, b: AnyRecord) => b.fit_score - a.fit_score);

    return NextResponse.json({
      ok: true,
      owner,
      email,
      context,
      matches: scored,
      top_matches: scored.slice(0, 12),
      counts: {
        members: scored.length,
        strong: scored.filter((item: AnyRecord) => item.fit_level === "strong").length,
        possible: scored.filter((item: AnyRecord) => item.fit_level === "possible").length,
        weak: scored.filter((item: AnyRecord) => item.fit_level === "weak").length,
      },
      note: "Read-only member match scoring. No routing or notifications were triggered.",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: "Could not score member matches.",
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  return NextResponse.json({
    ok: true,
    message: "Use POST with signal/deal context to score member specialization matches.",
    example: {
      state: "Georgia",
      strategy: "Fix & Flip",
      asset_type: "Single Family",
      role_needed: "Buyer",
      priority: "high",
    },
  });
}
