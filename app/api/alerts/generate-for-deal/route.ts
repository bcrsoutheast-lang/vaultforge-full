import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const OWNER_EMAIL = "bcrsoutheast@gmail.com";
const MAX_MEMBERS_SCANNED = 300;
const MAX_ALERTS_PER_DEAL = 80;

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
        return decodeURIComponent(part.replace("vf_email=", "")).trim().toLowerCase();
      } catch {
        return part.replace("vf_email=", "").trim().toLowerCase();
      }
    }
  }

  return "";
}

function getRequestEmail(request: Request, body: any) {
  return (
    emailFromCookie(request.headers.get("cookie") || "") ||
    cleanEmail(request.headers.get("x-vf-email")) ||
    cleanEmail(body?.email)
  );
}

function isOwnerRequest(request: Request, body: any) {
  const email = getRequestEmail(request, body);
  return { email, owner: email === OWNER_EMAIL };
}

function asList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => clean(item)).filter(Boolean);

  const text = clean(value);
  if (!text) return [];

  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return parsed.map((item) => clean(item)).filter(Boolean);
  } catch {
    // continue
  }

  return text.split(",").map((item) => item.trim()).filter(Boolean);
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

function dealTitle(deal: Deal) {
  return clean(deal.title || deal.deal_title || deal.address || deal.city || "VaultForge Deal");
}

function dealState(deal: Deal) {
  return clean(deal.state || deal.property_state || deal.market_state);
}

function dealCity(deal: Deal) {
  return clean(deal.city || deal.market || deal.county);
}

function dealType(deal: Deal) {
  return clean(deal.property_type || deal.deal_type || deal.asset_type || "Deal");
}

function dealStrategy(deal: Deal) {
  return clean(deal.strategy || deal.exit_strategy || "Strategy Needed");
}

function dealNeeds(deal: Deal) {
  return lowerList(deal.deal_needs || deal.needs || deal.routing_needs);
}

function memberEmail(member: Member) {
  return cleanEmail(member.email || member.member_email || member.user_email);
}

function memberName(member: Member) {
  return clean(member.name || member.full_name || member.company || member.email || "Member");
}

function memberRole(member: Member) {
  return clean(member.role || member.member_role || member.type || "Member");
}

function memberRoles(member: Member) {
  return lowerList(member.member_types || member.role || member.member_role);
}

function isDealLive(deal: Deal) {
  if (!deal) return false;
  if (deal.deleted === true) return false;
  if (deal.archived === true) return false;

  const folder = clean(deal.folder).toLowerCase();
  if (folder === "trash" || folder === "archived") return false;

  const status = clean(deal.status || "active").toLowerCase();
  if (["deleted", "trash", "archived", "inactive"].includes(status)) return false;

  return true;
}

function isMemberLive(member: Member) {
  if (!member) return false;
  if (member.is_deleted === true) return false;
  if (member.is_suspended === true) return false;

  const status = clean(member.member_status || member.status || "active").toLowerCase();
  if (["deleted", "removed", "suspended", "locked"].includes(status)) return false;

  const alertFrequency = clean(member.alert_frequency).toLowerCase();
  if (alertFrequency === "off") return false;

  return true;
}

function scoreMatch(deal: Deal, member: Member) {
  let score = 0;
  const reasons: string[] = [];

  const state = dealState(deal).toLowerCase();
  const city = dealCity(deal).toLowerCase();
  const propertyType = dealType(deal).toLowerCase();
  const strategy = dealStrategy(deal).toLowerCase();
  const needs = dealNeeds(deal);
  const role = memberRole(member).toLowerCase();
  const roles = memberRoles(member);

  const memberState = clean(member.state).toLowerCase();
  const markets = lowerList(member.markets);
  const buyStates = lowerList(member.buy_box_states || member.market_states || member.markets);
  const buyTypes = lowerList(member.buy_box_types || member.property_types || member.asset_types);
  const buyStrategies = lowerList(member.buy_box_strategies || member.strategies);
  const memberNeeds = lowerList(member.needs || member.deal_needs || member.what_i_need);
  const canProvide = lowerList(member.can_provide || member.what_i_provide);
  const alertTypes = lowerList(member.alert_types);

  if (state && memberState && state === memberState) {
    score += 25;
    reasons.push(`Same home state: ${dealState(deal)}`);
  }

  if (state && buyStates.includes(state)) {
    score += 40;
    reasons.push(`Inside selected market: ${dealState(deal)}`);
  }

  if (city && markets.some((market) => market.includes(city) || city.includes(market))) {
    score += 30;
    reasons.push(`City/market match: ${dealCity(deal)}`);
  }

  if (propertyType && buyTypes.length && includesAny(buyTypes, [propertyType])) {
    score += 30;
    reasons.push(`Project type match: ${dealType(deal)}`);
  }

  if (strategy && buyStrategies.length && includesAny(buyStrategies, [strategy])) {
    score += 30;
    reasons.push(`Strategy match: ${dealStrategy(deal)}`);
  }

  if (memberNeeds.includes("off-market deals")) {
    score += 10;
    reasons.push("Member wants off-market deal flow");
  }

  if (memberNeeds.includes("funding") && (needs.includes("funding") || needs.includes("lender needed"))) {
    score += 20;
    reasons.push("Funding need detected");
  }

  if (memberNeeds.includes("buyers") || memberNeeds.includes("buyer needed")) {
    if (roles.includes("buyer") || role.includes("buyer")) {
      score += 25;
      reasons.push("Buyer appetite detected");
    }
  }

  if ((needs.includes("buyer needed") || needs.includes("buyer")) && (roles.includes("buyer") || role.includes("buyer") || canProvide.includes("cash buyer"))) {
    score += 45;
    reasons.push("Deal needs a buyer and member can buy");
  }

  if ((needs.includes("funding") || needs.includes("lender needed")) && (roles.includes("lender") || role.includes("lender") || canProvide.includes("private lending") || canProvide.includes("hard money"))) {
    score += 45;
    reasons.push("Deal needs funding and member can fund");
  }

  if ((needs.includes("contractor needed") || needs.includes("contractor")) && (roles.includes("contractor") || role.includes("contractor") || canProvide.includes("contractor crew") || canProvide.includes("construction"))) {
    score += 45;
    reasons.push("Deal needs contractor/operator support");
  }

  if ((needs.includes("jv partner") || needs.includes("partner needed")) && (roles.includes("jv partner") || role.includes("partner") || canProvide.includes("project management"))) {
    score += 40;
    reasons.push("JV/operator alignment");
  }

  if (alertTypes.includes("high-margin deal") || alertTypes.includes("ai opportunity signal")) {
    score += 5;
    reasons.push("Member wants higher-signal alerts");
  }

  const asking = Number(deal.asking_price || deal.price || 0);
  const arv = Number(deal.arv || 0);
  const repairs = Number(deal.repair_estimate || 0);

  if (asking > 0 && arv > 0) {
    const spread = arv - asking - Math.max(repairs, 0);
    if (spread > 0) {
      score += 15;
      reasons.push(`Positive spread: ${money(spread)}`);
    }

    if (arv > 0 && spread / arv >= 0.15) {
      score += 20;
      reasons.push("Strong margin signal");
    }
  }

  if (deal.ai_summary) {
    score += 8;
    reasons.push("AI summary available");
  }

  if (deal.main_photo_url || (Array.isArray(deal.photo_urls) && deal.photo_urls.length > 0)) {
    score += 7;
    reasons.push("Photos attached");
  }

  if (deal.seller_situation) {
    score += 5;
    reasons.push("Seller situation captured");
  }

  if (deal.private_notes || deal.access_notes) {
    score += 5;
    reasons.push("Private deal intelligence available");
  }

  return {
    score,
    reasons: Array.from(new Set(reasons)).slice(0, 8),
  };
}

function alertTitleFor(deal: Deal, score: number) {
  const strength =
    score >= 120 ? "Elite VaultForge Match" :
    score >= 90 ? "High-Confidence Match" :
    score >= 70 ? "Strong Routing Signal" :
    "New Deal Signal";

  return `${strength}: ${dealTitle(deal)}`;
}

function alertMessageFor(deal: Deal, member: Member, reasons: string[], score: number) {
  const city = dealCity(deal);
  const state = dealState(deal);
  const location = [city, state].filter(Boolean).join(", ");
  const price = money(deal.asking_price || deal.price);
  const arv = money(deal.arv);

  const parts = [
    `${dealTitle(deal)} was matched to ${memberName(member)} with a VaultForge intelligence score of ${score}.`,
    location ? `Market: ${location}.` : "",
    dealType(deal) ? `Type: ${dealType(deal)}.` : "",
    dealStrategy(deal) ? `Strategy: ${dealStrategy(deal)}.` : "",
    price ? `Ask: ${price}.` : "",
    arv ? `ARV: ${arv}.` : "",
    reasons.length ? `Why matched: ${reasons.join(" · ")}.` : "",
  ];

  return parts.filter(Boolean).join(" ");
}

async function alreadyExists(supabase: any, member_email: string, deal_id: string) {
  try {
    const { data, error } = await supabase
      .from("vf_match_alerts")
      .select("id")
      .eq("member_email", member_email)
      .eq("deal_id", deal_id)
      .eq("alert_type", "smart_match")
      .maybeSingle();

    if (error) return false;
    return Boolean(data?.id);
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  try {
    const supabase = supabaseClient();
    const body = await request.json().catch(() => ({}));
    const ownerCheck = isOwnerRequest(request, body);

    if (!ownerCheck.owner) {
      return NextResponse.json(
        {
          ok: false,
          error: "Owner access required to auto-generate deal alerts.",
        },
        { status: 403 }
      );
    }

    const dealId = clean(body.deal_id || body.dealId || body.id);
    if (!dealId) {
      return NextResponse.json(
        { ok: false, error: "Missing deal_id." },
        { status: 400 }
      );
    }

    const requestedMinScore = Number(body.min_score || 45);
    const minScore = Math.max(35, Math.min(140, requestedMinScore));

    const { data: deal, error: dealError } = await supabase
      .from("vf_deals")
      .select("*")
      .eq("id", dealId)
      .maybeSingle();

    if (dealError) {
      return NextResponse.json({ ok: false, error: dealError.message, details: dealError }, { status: 500 });
    }

    if (!deal) {
      return NextResponse.json({ ok: false, error: "Deal not found." }, { status: 404 });
    }

    if (!isDealLive(deal)) {
      return NextResponse.json({
        ok: true,
        inserted: 0,
        scanned: { deals: 1, members: 0 },
        minScore,
        message: "Deal is archived, deleted, trashed, or inactive. No alerts generated.",
      });
    }

    const { data: members, error: membersError } = await supabase
      .from("vf_members")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(MAX_MEMBERS_SCANNED);

    if (membersError) {
      return NextResponse.json({ ok: false, error: membersError.message, details: membersError }, { status: 500 });
    }

    const liveMembers = (members || []).filter(isMemberLive).filter((member) => memberEmail(member));
    const inserts: Record<string, any>[] = [];

    for (const member of liveMembers) {
      const member_email = memberEmail(member);
      if (!member_email) continue;

      const match = scoreMatch(deal, member);
      if (match.score < minScore) continue;

      const exists = await alreadyExists(supabase, member_email, dealId);
      if (exists) continue;

      const generatedTitle = alertTitleFor(deal, match.score);
      const message = alertMessageFor(deal, member, match.reasons, match.score);

      inserts.push({
        member_email,
        recipient_email: member_email,
        deal_id: dealId,
        deal_title: dealTitle(deal),

        alert_title: generatedTitle,
        title: generatedTitle,

        alert_message: message,
        message,
        body: message,

        alert_type: "smart_match",
        type: "smart_match",
        status: "active",

        score: match.score,
        match_score: match.score,
        reason: match.reasons.join(" · "),
        match_reason: match.reasons.join(" · "),

        source: "vaultforge_auto_deal_router",
        source_table: "vf_deals",

        is_read: false,
        read: false,
        is_dismissed: false,
        dismissed: false,
        created_at: new Date().toISOString(),
      });

      if (inserts.length >= MAX_ALERTS_PER_DEAL) break;
    }

    if (!inserts.length) {
      return NextResponse.json({
        ok: true,
        inserted: 0,
        scanned: { deals: 1, members: liveMembers.length },
        minScore,
        deal_id: dealId,
        message: "No new alerts created for this deal. Matches may already exist or did not meet the threshold.",
      });
    }

    const { data: inserted, error: insertError } = await supabase
      .from("vf_match_alerts")
      .insert(inserts)
      .select("id,member_email,deal_id,score,title,alert_title");

    if (insertError) {
      return NextResponse.json(
        { ok: false, error: insertError.message, details: insertError, attempted: inserts.length },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      inserted: inserted?.length || 0,
      scanned: { deals: 1, members: liveMembers.length },
      minScore,
      deal_id: dealId,
      alerts: inserted || [],
      message: `Auto-routing complete for ${dealTitle(deal)}.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: "Deal alert generation failed.",
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
