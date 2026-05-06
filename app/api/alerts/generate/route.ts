import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const OWNER_EMAIL = "bcrsoutheast@gmail.com";

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

function asList(value: unknown): string[] {
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
    // continue
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
  return clean(member.role || member.member_type || member.type || "Member");
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

  return true;
}

function scoreMatch(deal: Deal, member: Member) {
  let score = 0;
  const reasons: string[] = [];

  const state = dealState(deal).toLowerCase();
  const city = dealCity(deal);
  const propertyType = dealType(deal).toLowerCase();
  const strategy = dealStrategy(deal).toLowerCase();
  const needs = dealNeeds(deal);
  const role = memberRole(member).toLowerCase();

  const memberState = clean(member.state).toLowerCase();
  const buyStates = lowerList(member.buy_box_states);
  const buyTypes = lowerList(member.buy_box_types);
  const buyStrategies = lowerList(member.buy_box_strategies);

  if (state && memberState && state === memberState) {
    score += 35;
    reasons.push(`Same state: ${dealState(deal)}`);
  }

  if (state && buyStates.includes(state)) {
    score += 35;
    reasons.push(`Inside buy-box state: ${dealState(deal)}`);
  }

  if (propertyType && buyTypes.length && includesAny(buyTypes, [propertyType])) {
    score += 25;
    reasons.push(`Asset type match: ${dealType(deal)}`);
  }

  if (strategy && buyStrategies.length && includesAny(buyStrategies, [strategy])) {
    score += 25;
    reasons.push(`Strategy match: ${dealStrategy(deal)}`);
  }

  if (needs.includes("buyer needed") && role.includes("buyer")) {
    score += 40;
    reasons.push("Deal needs a buyer");
  }

  if (needs.includes("lender needed") && role.includes("lender")) {
    score += 40;
    reasons.push("Deal needs a lender");
  }

  if (needs.includes("contractor needed") && role.includes("contractor")) {
    score += 40;
    reasons.push("Deal needs a contractor");
  }

  if (needs.includes("partner needed") && (role.includes("partner") || role.includes("operator"))) {
    score += 35;
    reasons.push("Deal needs an operating/JV partner");
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
      score += 15;
      reasons.push("Strong margin signal");
    }
  }

  if (deal.ai_summary) {
    score += 5;
    reasons.push("AI summary available");
  }

  if (deal.main_photo_url || (Array.isArray(deal.photo_urls) && deal.photo_urls.length > 0)) {
    score += 5;
    reasons.push("Photos attached");
  }

  if (city) {
    reasons.push(`Market: ${city}`);
  }

  return {
    score,
    reasons: Array.from(new Set(reasons)).slice(0, 7),
  };
}

function alertTitleFor(deal: Deal, score: number) {
  const strength = score >= 100 ? "High-Confidence Match" : score >= 70 ? "Strong Routing Signal" : "New Deal Signal";
  return `${strength}: ${dealTitle(deal)}`;
}

function alertMessageFor(deal: Deal, member: Member, reasons: string[], score: number) {
  const city = dealCity(deal);
  const state = dealState(deal);
  const location = [city, state].filter(Boolean).join(", ");
  const price = money(deal.asking_price || deal.price);
  const arv = money(deal.arv);

  const parts = [
    `${dealTitle(deal)} was matched to ${memberName(member)} with a VaultForge score of ${score}.`,
    location ? `Market: ${location}.` : "",
    dealType(deal) ? `Type: ${dealType(deal)}.` : "",
    dealStrategy(deal) ? `Strategy: ${dealStrategy(deal)}.` : "",
    price ? `Ask: ${price}.` : "",
    arv ? `ARV: ${arv}.` : "",
    reasons.length ? `Why: ${reasons.join(" · ")}.` : "",
  ];

  return parts.filter(Boolean).join(" ");
}

async function alreadyExists(supabase: any, table: string, member_email: string, deal_id: string) {
  try {
    const { data, error } = await supabase
      .from(table)
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

    const url = new URL(request.url);
    const email =
      cleanEmail(request.headers.get("x-vf-email")) ||
      cleanEmail(body.email) ||
      cleanEmail(url.searchParams.get("email")) ||
      emailFromCookie(request.headers.get("cookie") || "");

    const owner =
      email === OWNER_EMAIL ||
      cleanEmail(request.headers.get("x-vf-admin")) === "1" ||
      cleanEmail(body.owner) === "1" ||
      cleanEmail(url.searchParams.get("owner")) === "1";

    if (!owner) {
      return NextResponse.json(
        {
          ok: false,
          error: "Owner access required to generate smart alerts.",
        },
        { status: 403 }
      );
    }

    const minScore = Number(body.min_score || url.searchParams.get("min_score") || 55);
    const limit = Math.min(Number(body.limit || url.searchParams.get("limit") || 300), 500);

    const { data: deals, error: dealsError } = await supabase
      .from("vf_deals")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(120);

    if (dealsError) {
      return NextResponse.json({ ok: false, error: dealsError.message, details: dealsError }, { status: 500 });
    }

    const { data: members, error: membersError } = await supabase
      .from("vf_members")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(250);

    if (membersError) {
      return NextResponse.json({ ok: false, error: membersError.message, details: membersError }, { status: 500 });
    }

    const liveDeals = (deals || []).filter(isDealLive);
    const liveMembers = (members || []).filter(isMemberLive).filter((member) => memberEmail(member));

    const inserts: Record<string, any>[] = [];

    for (const deal of liveDeals) {
      for (const member of liveMembers) {
        const member_email = memberEmail(member);
        const deal_id = clean(deal.id);

        if (!member_email || !deal_id) continue;

        const match = scoreMatch(deal, member);
        if (match.score < minScore) continue;

        const exists = await alreadyExists(supabase, "vf_match_alerts", member_email, deal_id);
        if (exists) continue;

        inserts.push({
          member_email,
          recipient_email: member_email,
          deal_id,
          deal_title: dealTitle(deal),
          title: alertTitleFor(deal, match.score),
          message: alertMessageFor(deal, member, match.reasons, match.score),
          body: alertMessageFor(deal, member, match.reasons, match.score),
          alert_type: "smart_match",
          type: "smart_match",
          status: "active",
          score: match.score,
          match_score: match.score,
          reason: match.reasons.join(" · "),
          match_reason: match.reasons.join(" · "),
          source: "vaultforge_smart_engine",
          source_table: "vf_deals",
          is_read: false,
          read: false,
          is_dismissed: false,
          dismissed: false,
          created_at: new Date().toISOString(),
        });

        if (inserts.length >= limit) break;
      }

      if (inserts.length >= limit) break;
    }

    if (!inserts.length) {
      return NextResponse.json({
        ok: true,
        inserted: 0,
        scanned: {
          deals: liveDeals.length,
          members: liveMembers.length,
        },
        message: "No new smart alerts met the match threshold.",
      });
    }

    const { data: inserted, error: insertError } = await supabase
      .from("vf_match_alerts")
      .insert(inserts)
      .select("id,member_email,deal_id,score,title");

    if (insertError) {
      return NextResponse.json(
        {
          ok: false,
          error: insertError.message,
          details: insertError,
          attempted: inserts.length,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      inserted: inserted?.length || 0,
      scanned: {
        deals: liveDeals.length,
        members: liveMembers.length,
      },
      minScore,
      alerts: inserted || [],
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
