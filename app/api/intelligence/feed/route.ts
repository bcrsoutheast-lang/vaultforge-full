import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const OWNER_EMAIL = "bcrsoutheast@gmail.com";

const PROFILE_TABLES = ["vf_profiles", "profiles", "member_profiles", "vf_members"];
const DEAL_TABLES = ["vf_deals", "projects", "property_cards"];
const PAIN_TABLES = ["pain_requests", "vf_pain_requests", "pain_submissions"];

type Row = Record<string, any>;

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
    request.headers.get("x-vf-admin") === "1" ||
    url.searchParams.get("owner") === "1" ||
    cookie.includes("vf_admin=1") ||
    cookie.includes("isAdmin=true")
  );
}

function asArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => clean(item)).filter(Boolean);
  }

  const text = clean(value);

  if (!text) return [];

  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => clean(item)).filter(Boolean);
    }
  } catch {
    // Continue to comma split.
  }

  return text
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function lowerList(value: unknown) {
  return asArray(value).map((item) => item.toLowerCase());
}

function first(...values: unknown[]) {
  for (const value of values) {
    const text = clean(value);
    if (text) return text;
  }

  return "";
}

function money(value: unknown) {
  const n = Number(value || 0);

  if (!Number.isFinite(n) || n <= 0) return "";

  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function rowEmail(row: Row) {
  return cleanEmail(row.email || row.member_email || row.user_email || row.owner_email || row.contact_email);
}

function rowId(row: Row) {
  return first(row.id, row.profile_id, row.member_id, row.auth_user_id, row.deal_id, row.project_id, row.property_id);
}

function stateOf(row: Row) {
  return first(
    row.state,
    row.property_state,
    row.market_state,
    asArray(row.buy_box_states)[0],
    asArray(row.market_states)[0],
    asArray(row.markets)[0]
  );
}

function marketOf(row: Row) {
  return first(row.city, row.market, row.county, row.property_city, row.location);
}

function dealTitle(row: Row) {
  return first(
    row.title,
    row.deal_title,
    row.project_title,
    row.property_title,
    row.address,
    row.full_address,
    "VaultForge Opportunity"
  );
}

function memberName(row: Row) {
  return first(row.full_name, row.name, row.company, row.member_name, row.email, "VaultForge Member");
}

function roleList(row: Row) {
  return lowerList(row.member_types || row.roles || row.role || row.member_role || row.member_type);
}

function strategyList(row: Row) {
  return lowerList(row.buy_box_strategies || row.strategies || row.strategy || row.exit_strategy);
}

function typeList(row: Row) {
  return lowerList(row.buy_box_types || row.property_types || row.asset_types || row.property_type || row.deal_type || row.asset_type);
}

function needList(row: Row) {
  return lowerList(row.needs || row.deal_needs || row.what_i_need || row.routing_needs || row.help_needed || row.capital_needs);
}

function provideList(row: Row) {
  return lowerList(row.can_provide || row.what_i_provide || row.provides || row.services);
}

function includesAny(a: string[], b: string[]) {
  if (!a.length || !b.length) return false;

  return a.some((x) => b.some((y) => x.includes(y) || y.includes(x)));
}

function isProfileLive(row: Row) {
  const email = rowEmail(row);
  if (!email || email.endsWith("@example.com")) return false;

  const status = first(row.access_status, row.member_status, row.status).toLowerCase();

  if (["deleted", "removed", "suspended", "disabled"].includes(status)) return false;

  return true;
}

function isDealLive(row: Row) {
  const status = first(row.status, row.deal_status, row.project_status).toLowerCase();

  if (["deleted", "removed", "archived", "inactive", "trash"].includes(status)) return false;

  return Boolean(rowId(row) || dealTitle(row));
}

async function loadTable(supabase: any, table: string, limit: number) {
  try {
    const { data, error } = await supabase.from(table).select("*").limit(limit);

    if (error || !Array.isArray(data)) return [];

    return data.map((row) => ({
      ...row,
      _source_table: table,
    }));
  } catch {
    return [];
  }
}

function uniqueBy(rows: Row[], keyFn: (row: Row) => string) {
  const map = new Map<string, Row>();

  for (const row of rows) {
    const key = keyFn(row);
    if (!key) continue;

    const existing = map.get(key);
    map.set(key, existing ? { ...existing, ...row } : row);
  }

  return Array.from(map.values());
}

async function loadProfiles(supabase: any) {
  const nested = await Promise.all(PROFILE_TABLES.map((table) => loadTable(supabase, table, 350)));
  return uniqueBy(nested.flat(), (row) => rowEmail(row) || rowId(row)).filter(isProfileLive);
}

async function loadDeals(supabase: any) {
  const nested = await Promise.all(DEAL_TABLES.map((table) => loadTable(supabase, table, 250)));
  return uniqueBy(nested.flat(), (row) => rowId(row) || `${dealTitle(row)}-${stateOf(row)}-${marketOf(row)}`).filter(isDealLive);
}

async function loadPain(supabase: any) {
  const nested = await Promise.all(PAIN_TABLES.map((table) => loadTable(supabase, table, 200)));
  return uniqueBy(nested.flat(), (row) => rowId(row) || `${row.email || row.member_email}-${row.created_at}-${row.title || row.problem}`).filter(Boolean);
}

function matchScore(profile: Row, item: Row) {
  let score = 0;
  const reasons: string[] = [];

  const profileStates = lowerList(profile.buy_box_states || profile.market_states || profile.markets || profile.state);
  const itemState = stateOf(item).toLowerCase();
  const profileTypes = typeList(profile);
  const itemTypes = typeList(item);
  const profileStrategies = strategyList(profile);
  const itemStrategies = strategyList(item);
  const profileNeeds = needList(profile);
  const profileProvides = provideList(profile);
  const itemNeeds = needList(item);
  const roles = roleList(profile);

  if (itemState && profileStates.includes(itemState)) {
    score += 35;
    reasons.push(`market overlap: ${stateOf(item)}`);
  }

  if (includesAny(profileTypes, itemTypes)) {
    score += 25;
    reasons.push("asset type fit");
  }

  if (includesAny(profileStrategies, itemStrategies)) {
    score += 25;
    reasons.push("strategy fit");
  }

  if (
    (itemNeeds.includes("buyer needed") || itemNeeds.includes("buyer") || itemNeeds.includes("cash buyer")) &&
    (roles.includes("buyer") || profileProvides.includes("cash buyer"))
  ) {
    score += 40;
    reasons.push("buyer needed and member can buy");
  }

  if (
    (itemNeeds.includes("funding") || itemNeeds.includes("lender needed") || itemNeeds.includes("capital") || itemNeeds.includes("private capital needed")) &&
    (roles.includes("lender") || roles.includes("private money") || profileProvides.includes("private lending") || profileProvides.includes("hard money") || profileProvides.includes("capital"))
  ) {
    score += 45;
    reasons.push("capital needed and member can fund");
  }

  if (
    (itemNeeds.includes("contractor needed") || itemNeeds.includes("contractor")) &&
    (roles.includes("contractor") || profileProvides.includes("contractor crew") || profileProvides.includes("construction"))
  ) {
    score += 40;
    reasons.push("contractor need fit");
  }

  if (
    (itemNeeds.includes("operator needed") || itemNeeds.includes("operator") || itemNeeds.includes("jv partner needed")) &&
    (roles.includes("operator") || roles.includes("jv partner") || profileProvides.includes("operator support") || profileProvides.includes("project management"))
  ) {
    score += 35;
    reasons.push("operator/JV support fit");
  }

  if (includesAny(profileNeeds, itemNeeds)) {
    score += 10;
    reasons.push("shared need category");
  }

  const asking = Number(item.asking_price || item.price || item.asking || item.purchase_price || 0);
  const arv = Number(item.arv || item.after_repair_value || 0);
  const repairs = Number(item.repair_estimate || item.repairs || item.estimated_repairs || 0);

  if (asking > 0 && arv > 0) {
    const spread = arv - asking - Math.max(repairs, 0);

    if (spread > 0) {
      score += 12;
      reasons.push(`positive spread ${money(spread)}`);
    }

    if (arv > 0 && spread / arv >= 0.15) {
      score += 18;
      reasons.push("strong margin signal");
    }
  }

  return {
    score,
    reasons: Array.from(new Set(reasons)).slice(0, 6),
  };
}

function alertTypeFrom(profile: Row, item: Row, score: number) {
  const roles = roleList(profile);
  const itemNeeds = needList(item);
  const itemTypes = typeList(item);
  const itemStrategies = strategyList(item);

  if (
    itemNeeds.includes("funding") ||
    itemNeeds.includes("lender needed") ||
    itemNeeds.includes("capital") ||
    itemNeeds.includes("private capital needed")
  ) {
    return "capital_needed";
  }

  if (
    itemNeeds.includes("buyer needed") ||
    itemNeeds.includes("buyer") ||
    roles.includes("buyer")
  ) {
    return "buyer_match";
  }

  if (
    itemNeeds.includes("contractor needed") ||
    itemNeeds.includes("operator needed") ||
    itemNeeds.includes("jv partner needed")
  ) {
    return "operator_needed";
  }

  if (
    itemNeeds.includes("funding gap") ||
    itemNeeds.includes("stalled project help") ||
    itemNeeds.includes("permit help needed") ||
    item.distress_signals ||
    item.pain_signals ||
    item.problem_type
  ) {
    return "distress_signal";
  }

  if (itemTypes.includes("land") || itemStrategies.includes("entitlement") || itemStrategies.includes("development")) {
    return "market_window";
  }

  if (score >= 80) return "high_confidence";

  return "opportunity";
}

function titleFor(type: string, item: Row) {
  const location = [marketOf(item), stateOf(item)].filter(Boolean).join(", ");
  const base = dealTitle(item);

  if (type === "capital_needed") return `Capital needed: ${base}`;
  if (type === "buyer_match") return `Buyer match: ${base}`;
  if (type === "operator_needed") return `Operator support needed: ${base}`;
  if (type === "distress_signal") return `Distress signal: ${base}`;
  if (type === "market_window") return `Market window: ${location || base}`;
  if (type === "high_confidence") return `High-confidence match: ${base}`;

  return `Opportunity signal: ${base}`;
}

function priority(score: number, type: string) {
  if (score >= 100 || type === "distress_signal") return "urgent";
  if (score >= 75 || type === "capital_needed") return "high";
  if (score >= 45) return "medium";
  return "low";
}

function makeAlert(profile: Row, item: Row, source: "deal" | "pain", owner: boolean) {
  const match = matchScore(profile, item);
  const type = alertTypeFrom(profile, item, match.score);
  const itemState = stateOf(item);
  const itemMarket = marketOf(item);

  return {
    id: `${source}-${rowId(item) || dealTitle(item)}-${rowEmail(profile)}`,
    source,
    alert_type: type,
    priority: priority(match.score, type),
    score: match.score,
    title: titleFor(type, item),
    message: [
      `${dealTitle(item)} matched ${owner ? memberName(profile) : "your profile"} with score ${match.score}.`,
      itemMarket || itemState ? `Market: ${[itemMarket, itemState].filter(Boolean).join(", ")}.` : "",
      match.reasons.length ? `Why: ${match.reasons.join(" · ")}.` : "",
    ].filter(Boolean).join(" "),
    member_email: owner ? rowEmail(profile) : undefined,
    member_name: owner ? memberName(profile) : undefined,
    item_id: rowId(item),
    item_title: dealTitle(item),
    state: itemState,
    market: itemMarket,
    source_table: item._source_table,
    safe_href: source === "pain" ? "/pain-submit" : "/projects",
    created_at: first(item.created_at, item.updated_at, new Date().toISOString()),
  };
}

function marketWindowsFromData(deals: Row[], pain: Row[]) {
  const all = [...deals, ...pain];
  const states = ["Georgia", "Tennessee", "Alabama", "Florida", "North Carolina", "South Carolina", "Texas"];

  return states.map((state) => {
    const stateRows = all.filter((row) => stateOf(row).toLowerCase() === state.toLowerCase());
    const painRows = stateRows.filter((row) => row._source_table?.toLowerCase().includes("pain") || row.problem_type || row.pain_type);
    const capitalRows = stateRows.filter((row) => needList(row).some((n) => n.includes("funding") || n.includes("capital") || n.includes("lender")));
    const buyerRows = stateRows.filter((row) => needList(row).some((n) => n.includes("buyer")));
    const operatorRows = stateRows.filter((row) => needList(row).some((n) => n.includes("contractor") || n.includes("operator") || n.includes("jv")));

    return {
      state,
      total_signals: stateRows.length,
      pain_signals: painRows.length,
      capital_needed: capitalRows.length,
      buyer_needed: buyerRows.length,
      operator_needed: operatorRows.length,
      status:
        painRows.length || capitalRows.length || buyerRows.length || operatorRows.length
          ? "active"
          : stateRows.length
          ? "watching"
          : "quiet",
    };
  });
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

    const [profiles, deals, pain] = await Promise.all([
      loadProfiles(supabase),
      loadDeals(supabase),
      loadPain(supabase),
    ]);

    const targetProfiles = owner
      ? profiles
      : profiles.filter((profile) => rowEmail(profile) === email);

    const alerts = targetProfiles.flatMap((profile) => {
      const dealAlerts = deals.map((deal) => makeAlert(profile, deal, "deal", owner));
      const painAlerts = pain.map((item) => makeAlert(profile, item, "pain", owner));

      return [...dealAlerts, ...painAlerts].filter((alert) => alert.score >= 30);
    });

    const sorted = alerts.sort((a, b) => {
      const priorityScore = (p: string) => {
        if (p === "urgent") return 4;
        if (p === "high") return 3;
        if (p === "medium") return 2;
        return 1;
      };

      return priorityScore(b.priority) - priorityScore(a.priority) || b.score - a.score;
    });

    const capped = sorted.slice(0, owner ? 100 : 40);

    return NextResponse.json({
      ok: true,
      mode: owner ? "owner_global_intelligence" : "member_safe_intelligence",
      email,
      owner,
      alerts: capped,
      counts: {
        profiles: profiles.length,
        target_profiles: targetProfiles.length,
        deals: deals.length,
        pain: pain.length,
        generated_alerts: capped.length,
      },
      market_windows: marketWindowsFromData(deals, pain),
      sources_checked: {
        profiles: PROFILE_TABLES,
        deals: DEAL_TABLES,
        pain: PAIN_TABLES,
      },
      note: "Read-only intelligence feed. No database writes performed.",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: "Could not generate read-only intelligence feed.",
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
