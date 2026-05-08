import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const OWNER_EMAIL = "bcrsoutheast@gmail.com";

const DEAL_TABLES = ["vf_deals", "projects", "property_cards"];
const MEMBER_TABLES = ["vf_profiles", "vf_members", "profiles", "member_profiles"];

type Deal = Record<string, any>;
type Member = Record<string, any>;

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

function decodeCookieValue(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function cookieValue(cookieHeader: string, name: string) {
  const parts = cookieHeader.split(";").map((part) => part.trim());

  for (const part of parts) {
    if (!part.startsWith(`${name}=`)) continue;
    return decodeCookieValue(part.slice(name.length + 1));
  }

  return "";
}

function requestEmail(request: Request, body: Record<string, any>) {
  const url = new URL(request.url);
  const cookie = request.headers.get("cookie") || "";

  return cleanEmail(
    request.headers.get("x-vf-email") ||
      body?.email ||
      body?.admin_email ||
      url.searchParams.get("email") ||
      cookieValue(cookie, "vf_email") ||
      cookieValue(cookie, "vf_admin_email")
  );
}

function isOwnerRequest(request: Request, body: Record<string, any>) {
  const url = new URL(request.url);
  const cookie = request.headers.get("cookie") || "";
  const email = requestEmail(request, body);

  const adminFlag =
    clean(request.headers.get("x-vf-admin")) === "1" ||
    clean(body?.owner) === "1" ||
    clean(body?.admin) === "1" ||
    clean(url.searchParams.get("owner")) === "1" ||
    cookie.includes("vf_admin=1") ||
    cookie.includes("isAdmin=true");

  return email === OWNER_EMAIL || adminFlag;
}

function asList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => clean(item)).filter(Boolean);

  const text = clean(value);
  if (!text) return [];

  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return parsed.map((item) => clean(item)).filter(Boolean);
  } catch {
    // Continue and split raw string.
  }

  return text
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function lowerList(value: unknown): string[] {
  return asList(value).map((item) => item.toLowerCase());
}

function includesAny(haystack: string[], needles: string[]) {
  if (!haystack.length || !needles.length) return false;

  return needles.some((needle) =>
    haystack.some((item) => item.includes(needle) || needle.includes(item))
  );
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

function first(...values: unknown[]) {
  for (const value of values) {
    const text = clean(value);
    if (text) return text;
  }

  return "";
}

function normalizedId(row: Record<string, any>) {
  return first(row.id, row.deal_id, row.project_id, row.property_id, row.card_id, row.uuid);
}

function dealTitle(deal: Deal) {
  return first(
    deal.title,
    deal.deal_title,
    deal.project_title,
    deal.property_title,
    deal.address,
    deal.full_address,
    deal.city,
    "VaultForge Deal"
  );
}

function dealState(deal: Deal) {
  return first(deal.state, deal.property_state, deal.market_state, deal.primary_state);
}

function dealCity(deal: Deal) {
  return first(deal.city, deal.market, deal.county, deal.property_city);
}

function dealType(deal: Deal) {
  return first(deal.property_type, deal.deal_type, deal.asset_type, deal.project_type, deal.type, "Deal");
}

function dealStrategy(deal: Deal) {
  return first(deal.strategy, deal.exit_strategy, deal.investment_strategy, deal.deal_strategy, "Strategy Needed");
}

function dealNeeds(deal: Deal) {
  return lowerList(
    deal.deal_needs ||
      deal.needs ||
      deal.routing_needs ||
      deal.help_needed ||
      deal.capital_needs ||
      deal.problem_type
  );
}

function dealStatus(deal: Deal) {
  return first(deal.status, deal.deal_status, deal.project_status, deal.folder, "active").toLowerCase();
}

function memberEmail(member: Member) {
  return cleanEmail(member.email || member.member_email || member.user_email || member.owner_email || member.contact_email);
}

function memberName(member: Member) {
  return first(member.name, member.full_name, member.member_name, member.company, member.email, "Member");
}

function memberRole(member: Member) {
  return first(member.role, member.primary_role, member.member_role, member.member_type, member.type, "Member");
}

function memberRoles(member: Member) {
  return lowerList(member.member_types || member.roles || member.role || member.primary_role || member.member_role || member.member_type);
}

function memberAccessStatus(member: Member) {
  return first(member.access_status, member.member_status, member.account_status, member.status, "locked").toLowerCase();
}

function memberPaymentStatus(member: Member) {
  return first(member.payment_status, member.subscription_status, member.billing_status, "unpaid").toLowerCase();
}

function truthy(value: unknown) {
  if (value === true) return true;
  const text = clean(value).toLowerCase();
  return ["true", "1", "yes", "active", "paid", "complete", "completed"].includes(text);
}

function isDealLive(deal: Deal) {
  if (!deal) return false;
  if (deal.deleted === true || deal.is_deleted === true) return false;
  if (deal.archived === true || deal.is_archived === true) return false;

  const status = dealStatus(deal);
  if (["deleted", "trash", "archived", "inactive", "removed"].includes(status)) return false;

  return Boolean(normalizedId(deal));
}

function isMemberLive(member: Member) {
  if (!member) return false;
  if (!memberEmail(member)) return false;
  if (memberEmail(member).endsWith("@example.com")) return false;

  if (member.is_deleted === true || member.deleted === true) return false;
  if (member.is_suspended === true || member.suspended === true) return false;

  const status = memberAccessStatus(member);
  const paymentStatus = memberPaymentStatus(member);
  const isActive =
    truthy(member.is_active) ||
    truthy(member.active) ||
    status === "active" ||
    status === "approved" ||
    paymentStatus === "paid" ||
    paymentStatus === "active";

  if (["deleted", "removed", "suspended", "disabled"].includes(status)) return false;

  const alertFrequency = first(member.alert_frequency, member.alerts_enabled).toLowerCase();
  if (alertFrequency === "off" || alertFrequency === "false") return false;

  return isActive;
}

function normalizeDeal(row: Deal, table: string) {
  return {
    ...row,
    _source_table: table,
    id: normalizedId(row),
    deal_id: normalizedId(row),
  };
}

function normalizeMember(row: Member, table: string) {
  const email = memberEmail(row);

  return {
    ...row,
    _source_table: table,
    id: first(row.id, row.profile_id, row.member_id, row.auth_user_id, email),
    email,
    member_email: email,
  };
}

function mergeByKey<T extends Record<string, any>>(rows: T[], keyFn: (row: T) => string) {
  const map = new Map<string, T>();

  for (const row of rows) {
    const key = keyFn(row);
    if (!key) continue;

    const existing = map.get(key);
    if (!existing) {
      map.set(key, row);
      continue;
    }

    map.set(key, { ...existing, ...row });
  }

  return Array.from(map.values());
}

async function loadTable(supabase: any, table: string, limit: number) {
  try {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .limit(limit);

    if (error || !data) return [];

    return data;
  } catch {
    return [];
  }
}

async function loadDeals(supabase: any, dealId: string) {
  const results: Deal[] = [];

  for (const table of DEAL_TABLES) {
    try {
      if (dealId) {
        const rows: Deal[] = [];

        for (const col of ["id", "deal_id", "project_id", "property_id", "card_id"]) {
          try {
            const { data, error } = await supabase
              .from(table)
              .select("*")
              .eq(col, dealId)
              .limit(5);

            if (!error && Array.isArray(data)) rows.push(...data);
          } catch {
            // Try next id column.
          }
        }

        results.push(...rows.map((row) => normalizeDeal(row, table)));
      } else {
        const rows = await loadTable(supabase, table, 175);
        results.push(...rows.map((row: Deal) => normalizeDeal(row, table)));
      }
    } catch {
      // Continue to next table.
    }
  }

  return mergeByKey(results, (deal) => clean(deal.id)).filter(isDealLive);
}

async function loadMembers(supabase: any) {
  const results: Member[] = [];

  for (const table of MEMBER_TABLES) {
    const rows = await loadTable(supabase, table, 400);
    results.push(...rows.map((row: Member) => normalizeMember(row, table)));
  }

  return mergeByKey(results, (member) => memberEmail(member)).filter(isMemberLive);
}

function scoreMatch(deal: Deal, member: Member) {
  let score = 0;
  const reasons: string[] = [];
  const categories = new Set<string>();

  const state = dealState(deal).toLowerCase();
  const city = dealCity(deal).toLowerCase();
  const propertyType = dealType(deal).toLowerCase();
  const strategy = dealStrategy(deal).toLowerCase();
  const needs = dealNeeds(deal);

  const role = memberRole(member).toLowerCase();
  const roles = memberRoles(member);

  const memberState = clean(member.state || member.primary_state).toLowerCase();
  const markets = lowerList(member.markets || member.buy_box_states || member.market_states || member.primary_state || member.state);
  const buyStates = lowerList(member.buy_box_states || member.market_states || member.markets || member.primary_state || member.state);
  const buyTypes = lowerList(member.buy_box_types || member.property_types || member.asset_types || member.project_types);
  const buyStrategies = lowerList(member.buy_box_strategies || member.strategies || member.strategy);
  const memberNeeds = lowerList(member.needs || member.deal_needs || member.what_i_need || member.seeking);
  const canProvide = lowerList(member.can_provide || member.what_i_provide || member.provides || member.services);
  const alertTypes = lowerList(member.alert_types || member.alert_preferences);

  if (state && memberState && state === memberState) {
    score += 25;
    reasons.push(`Same home state: ${dealState(deal)}`);
    categories.add("routing_notice");
  }

  if (state && buyStates.includes(state)) {
    score += 40;
    reasons.push(`Inside selected market: ${dealState(deal)}`);
    categories.add("buyer_match");
  }

  if (city && markets.some((market) => market.includes(city) || city.includes(market))) {
    score += 30;
    reasons.push(`City/market match: ${dealCity(deal)}`);
    categories.add("buyer_match");
  }

  if (propertyType && buyTypes.length && includesAny(buyTypes, [propertyType])) {
    score += 30;
    reasons.push(`Project type match: ${dealType(deal)}`);
    categories.add("deal_opportunity");
  }

  if (strategy && buyStrategies.length && includesAny(buyStrategies, [strategy])) {
    score += 30;
    reasons.push(`Strategy match: ${dealStrategy(deal)}`);
    categories.add("deal_opportunity");
  }

  if (memberNeeds.includes("off-market deals")) {
    score += 10;
    reasons.push("Member wants off-market deal flow");
    categories.add("deal_opportunity");
  }

  if (memberNeeds.includes("funding") && (needs.includes("funding") || needs.includes("lender needed") || needs.includes("capital"))) {
    score += 20;
    reasons.push("Funding need detected");
    categories.add("capital_match");
  }

  if (memberNeeds.includes("buyers") || memberNeeds.includes("buyer needed")) {
    if (roles.includes("buyer") || role.includes("buyer")) {
      score += 25;
      reasons.push("Buyer appetite detected");
      categories.add("buyer_match");
    }
  }

  if (
    (needs.includes("buyer needed") || needs.includes("buyer") || needs.includes("cash buyer")) &&
    (roles.includes("buyer") || role.includes("buyer") || canProvide.includes("cash buyer"))
  ) {
    score += 45;
    reasons.push("Deal needs a buyer and member can buy");
    categories.add("buyer_match");
  }

  if (
    (needs.includes("funding") || needs.includes("lender needed") || needs.includes("capital") || needs.includes("money")) &&
    (roles.includes("lender") || role.includes("lender") || canProvide.includes("private lending") || canProvide.includes("hard money") || canProvide.includes("capital"))
  ) {
    score += 45;
    reasons.push("Deal needs funding and member can fund");
    categories.add("capital_match");
  }

  if (
    (needs.includes("contractor needed") || needs.includes("contractor") || needs.includes("construction")) &&
    (roles.includes("contractor") || role.includes("contractor") || canProvide.includes("contractor crew") || canProvide.includes("construction"))
  ) {
    score += 45;
    reasons.push("Deal needs contractor/operator support");
    categories.add("operator_match");
  }

  if (
    (needs.includes("jv partner") || needs.includes("partner needed") || needs.includes("operator")) &&
    (roles.includes("jv partner") || role.includes("partner") || role.includes("operator") || canProvide.includes("project management"))
  ) {
    score += 40;
    reasons.push("JV/operator alignment");
    categories.add("operator_match");
  }

  if (alertTypes.includes("high-margin deal") || alertTypes.includes("ai opportunity signal")) {
    score += 5;
    reasons.push("Member wants higher-signal alerts");
    categories.add("routing_notice");
  }

  const asking = Number(deal.asking_price || deal.price || deal.asking || deal.purchase_price || 0);
  const arv = Number(deal.arv || deal.after_repair_value || 0);
  const repairs = Number(deal.repair_estimate || deal.repairs || deal.estimated_repairs || 0);

  if (asking > 0 && arv > 0) {
    const spread = arv - asking - Math.max(repairs, 0);

    if (spread > 0) {
      score += 15;
      reasons.push(`Positive spread: ${money(spread)}`);
      categories.add("deal_opportunity");
    }

    if (arv > 0 && spread / arv >= 0.15) {
      score += 20;
      reasons.push("Strong margin signal");
      categories.add("deal_opportunity");
    }
  }

  if (deal.ai_summary || deal.analysis_summary || deal.route_summary) {
    score += 8;
    reasons.push("AI summary available");
    categories.add("routing_notice");
  }

  if (deal.main_photo_url || deal.photo_url || (Array.isArray(deal.photo_urls) && deal.photo_urls.length > 0)) {
    score += 7;
    reasons.push("Photos attached");
  }

  if (deal.seller_situation || deal.distress_reason || deal.pain_type || needs.includes("distress")) {
    score += 10;
    reasons.push("Distress/pain signal captured");
    categories.add("pain_signal");
  }

  if (deal.private_notes || deal.access_notes || deal.owner_notes) {
    score += 5;
    reasons.push("Private deal intelligence available");
  }

  if (!categories.size) categories.add("smart_match");

  return {
    score,
    reasons: Array.from(new Set(reasons)).slice(0, 8),
    categories: Array.from(categories),
  };
}

function primaryAlertType(categories: string[]) {
  if (categories.includes("capital_match")) return "capital_match";
  if (categories.includes("buyer_match")) return "buyer_match";
  if (categories.includes("operator_match")) return "operator_match";
  if (categories.includes("pain_signal")) return "pain_signal";
  if (categories.includes("deal_opportunity")) return "deal_opportunity";
  if (categories.includes("routing_notice")) return "routing_notice";
  return "smart_match";
}

function alertTitleFor(deal: Deal, alertType: string, score: number) {
  const label =
    alertType === "capital_match"
      ? "Capital Match"
      : alertType === "buyer_match"
      ? "Buyer Match"
      : alertType === "operator_match"
      ? "Operator Match"
      : alertType === "pain_signal"
      ? "Pain Signal"
      : alertType === "deal_opportunity"
      ? "Deal Opportunity"
      : alertType === "routing_notice"
      ? "Routing Notice"
      : "Smart Match";

  const strength =
    score >= 120
      ? "Elite"
      : score >= 90
      ? "High-Confidence"
      : score >= 70
      ? "Strong"
      : "New";

  return `${strength} ${label}: ${dealTitle(deal)}`;
}

function alertMessageFor(deal: Deal, member: Member, reasons: string[], score: number) {
  const city = dealCity(deal);
  const state = dealState(deal);
  const location = [city, state].filter(Boolean).join(", ");
  const price = money(deal.asking_price || deal.price || deal.asking || deal.purchase_price);
  const arv = money(deal.arv || deal.after_repair_value);

  const parts = [
    `${dealTitle(deal)} was routed to ${memberName(member)} with a VaultForge intelligence score of ${score}.`,
    location ? `Market: ${location}.` : "",
    dealType(deal) ? `Type: ${dealType(deal)}.` : "",
    dealStrategy(deal) ? `Strategy: ${dealStrategy(deal)}.` : "",
    price ? `Ask: ${price}.` : "",
    arv ? `ARV: ${arv}.` : "",
    reasons.length ? `Why matched: ${reasons.join(" · ")}.` : "",
  ];

  return parts.filter(Boolean).join(" ");
}

async function alreadyExists(supabase: any, member_email: string, deal_id: string, alert_type: string) {
  try {
    const { data, error } = await supabase
      .from("vf_match_alerts")
      .select("id")
      .eq("member_email", member_email)
      .eq("deal_id", deal_id)
      .eq("alert_type", alert_type)
      .maybeSingle();

    if (error) return false;
    return Boolean(data?.id);
  } catch {
    return false;
  }
}

function alertInsert(deal: Deal, member: Member, score: number, reasons: string[], alertType: string) {
  const deal_id = clean(deal.id || deal.deal_id);
  const member_email = memberEmail(member);
  const generatedTitle = alertTitleFor(deal, alertType, score);
  const message = alertMessageFor(deal, member, reasons, score);
  const reasonText = reasons.join(" · ");

  return {
    member_email,
    recipient_email: member_email,
    matched_member_email: member_email,

    deal_id,
    project_id: deal_id,
    property_id: deal_id,
    deal_title: dealTitle(deal),
    project_title: dealTitle(deal),

    alert_title: generatedTitle,
    title: generatedTitle,
    match_title: generatedTitle,

    alert_body: message,
    alert_message: message,
    message,
    body: message,
    description: message,
    summary: message,
    reason: reasonText,
    why_matched: reasonText,
    match_reason: reasonText,
    match_reasons: reasonText,

    alert_type: alertType,
    type: alertType,
    category: alertType,
    status: "active",
    alert_status: "active",

    score,
    match_score: score,
    confidence_score: score,
    ai_score: score,

    source: "vaultforge_unified_smart_engine",
    source_table: clean(deal._source_table || "deal_table"),
    route_position: alertType,

    is_read: false,
    read: false,
    is_dismissed: false,
    dismissed: false,
    created_at: new Date().toISOString(),
  };
}

export async function POST(request: Request) {
  try {
    const supabase = supabaseClient();
    const body = await request.json().catch(() => ({}));

    if (!isOwnerRequest(request, body)) {
      return NextResponse.json(
        {
          ok: false,
          error: "Owner access required to generate smart alerts.",
        },
        { status: 403 }
      );
    }

    const url = new URL(request.url);
    const dealId = clean(body.deal_id || body.dealId || body.id || url.searchParams.get("deal_id"));
    const minScore = Math.max(25, Math.min(160, Number(body.min_score || url.searchParams.get("min_score") || 35)));
    const limit = Math.min(Number(body.limit || url.searchParams.get("limit") || 300), 500);

    const [deals, members] = await Promise.all([
      loadDeals(supabase, dealId),
      loadMembers(supabase),
    ]);

    const inserts: Record<string, any>[] = [];
    const scanned = {
      deals: deals.length,
      members: members.length,
      pairs: 0,
    };

    for (const deal of deals) {
      for (const member of members) {
        scanned.pairs += 1;

        const member_email = memberEmail(member);
        const finalDealId = clean(deal.id || deal.deal_id);
        if (!member_email || !finalDealId) continue;

        const match = scoreMatch(deal, member);
        if (match.score < minScore) continue;

        for (const category of match.categories) {
          const alertType = primaryAlertType([category]);

          const exists = await alreadyExists(supabase, member_email, finalDealId, alertType);
          if (exists) continue;

          inserts.push(alertInsert(deal, member, match.score, match.reasons, alertType));

          if (inserts.length >= limit) break;
        }

        if (inserts.length >= limit) break;
      }

      if (inserts.length >= limit) break;
    }

    if (!inserts.length) {
      return NextResponse.json({
        ok: true,
        inserted: 0,
        created: 0,
        alerts_created: 0,
        scanned,
        minScore,
        sources_checked: {
          deals: DEAL_TABLES,
          members: MEMBER_TABLES,
          alerts: "vf_match_alerts",
        },
        message:
          scanned.deals === 0
            ? "No live deals/projects found for routing."
            : scanned.members === 0
            ? "No active real members found for routing."
            : "No new smart alerts met the routing threshold or matches already exist.",
      });
    }

    const { data: inserted, error: insertError } = await supabase
      .from("vf_match_alerts")
      .insert(inserts)
      .select("id,member_email,deal_id,score,match_score,title,alert_title,alert_type,type,route_position");

    if (insertError) {
      return NextResponse.json(
        {
          ok: false,
          error: insertError.message,
          details: insertError,
          attempted: inserts.length,
          sources_checked: {
            deals: DEAL_TABLES,
            members: MEMBER_TABLES,
            alerts: "vf_match_alerts",
          },
        },
        { status: 500 }
      );
    }

    const insertedRows = inserted || [];

    return NextResponse.json({
      ok: true,
      inserted: insertedRows.length,
      created: insertedRows.length,
      alerts_created: insertedRows.length,
      scanned,
      minScore,
      alerts: insertedRows,
      sources_checked: {
        deals: DEAL_TABLES,
        members: MEMBER_TABLES,
        alerts: "vf_match_alerts",
      },
      counts_by_type: insertedRows.reduce((acc: Record<string, number>, row: Record<string, any>) => {
        const type = clean(row.alert_type || row.type || row.route_position || "smart_match");
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {}),
      message: `Smart routing complete. ${insertedRows.length} alerts created and routed to the correct cards.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: "Smart alert generation failed.",
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
