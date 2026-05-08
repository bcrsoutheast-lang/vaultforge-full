import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

function asNumberOrNull(value: unknown) {
  const text = clean(value);
  if (!text) return null;

  const n = Number(text.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function asStringArray(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => clean(item)).filter(Boolean).slice(0, 8);
  }

  const text = clean(value);
  if (!text) return [];

  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => clean(item)).filter(Boolean).slice(0, 8);
    }
  } catch {
    // Continue.
  }

  return [text].filter(Boolean);
}

function createTags(body: any) {
  const tags = new Set<string>();

  const inputs = [
    body?.pain_type,
    body?.requested_help,
    body?.description,
    body?.urgency_level,
    body?.asset_type,
    body?.property_type,
    body?.strategy,
    body?.ai_summary,
  ]
    .map((v) => clean(v).toLowerCase())
    .join(" ");

  const rules: Array<[string, string[]]> = [
    ["capital", ["capital", "funding", "loan", "lender", "cash", "refinance"]],
    ["title", ["title", "lien", "probate", "heir"]],
    ["zoning", ["zoning", "permit", "city", "entitlement"]],
    ["contractor", ["contractor", "rehab", "repair", "construction"]],
    ["operator", ["operator", "partner", "joint venture", "jv", "manage"]],
    ["seller_distress", ["foreclosure", "distress", "urgent", "liquidation", "behind", "tax", "vacant"]],
    ["multifamily", ["multifamily", "apartment", "units"]],
    ["commercial", ["commercial", "retail", "office", "industrial", "noi", "cap rate"]],
    ["residential", ["house", "single family", "duplex", "residential", "bedroom", "bathroom"]],
    ["land", ["land", "acre", "zoning", "entitlement", "road access"]],
    ["deal_rescue", ["stalled", "dead", "stuck", "rescue", "gap"]],
  ];

  for (const [tag, words] of rules) {
    if (words.some((word) => inputs.includes(word))) {
      tags.add(tag);
    }
  }

  return Array.from(tags);
}

function urgencyScore(level: unknown, body: any) {
  const text = `${clean(level)} ${clean(body?.description)} ${clean(body?.requested_help)}`.toLowerCase();

  if (text.includes("emergency") || text.includes("critical") || text.includes("foreclosure")) return 95;
  if (text.includes("urgent") || text.includes("auction") || text.includes("deadline")) return 85;
  if (text.includes("high") || text.includes("behind") || text.includes("stalled")) return 75;
  if (text.includes("medium")) return 50;

  return 25;
}

function routingFits(tags: string[]) {
  const lower = tags.map((tag) => tag.toLowerCase());

  return {
    investor_fit:
      lower.includes("seller_distress") ||
      lower.includes("residential") ||
      lower.includes("commercial") ||
      lower.includes("multifamily") ||
      lower.includes("land") ||
      lower.includes("deal_rescue"),
    lender_fit: lower.includes("capital"),
    operator_fit:
      lower.includes("operator") ||
      lower.includes("seller_distress") ||
      lower.includes("commercial") ||
      lower.includes("multifamily") ||
      lower.includes("deal_rescue"),
    contractor_fit: lower.includes("contractor"),
  };
}

function moneyText(value: unknown) {
  const n = Number(value || 0);
  if (!Number.isFinite(n) || n <= 0) return "";
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function buildAnalyzer(body: any, tags: string[]) {
  const assetType = clean(body?.asset_type || "Unknown asset");
  const painType = clean(body?.pain_type || "General distress");
  const urgencyLevel = clean(body?.urgency_level || "Normal");
  const capitalNeeded = asNumberOrNull(body?.capital_needed);
  const estimatedValue = asNumberOrNull(body?.estimated_value);
  const estimatedRepairs = asNumberOrNull(body?.estimated_repairs);
  const city = clean(body?.city);
  const state = clean(body?.state);
  const requestedHelp = clean(body?.requested_help);
  const description = clean(body?.description);
  const photos = asStringArray(body?.photo_urls);

  const spread =
    estimatedValue !== null && estimatedRepairs !== null && capitalNeeded !== null
      ? estimatedValue - estimatedRepairs - capitalNeeded
      : null;

  const primaryRoutes: string[] = [];

  if (tags.includes("capital")) primaryRoutes.push("lender / private capital");
  if (tags.includes("contractor")) primaryRoutes.push("contractor / rehab operator");
  if (tags.includes("operator") || tags.includes("deal_rescue")) primaryRoutes.push("operator / JV partner");
  if (tags.includes("seller_distress")) primaryRoutes.push("cash buyer / acquisition partner");
  if (tags.includes("title")) primaryRoutes.push("title / legal specialist");
  if (tags.includes("zoning") || tags.includes("land")) primaryRoutes.push("developer / entitlement specialist");

  if (primaryRoutes.length === 0) {
    primaryRoutes.push("investor review", "operator review");
  }

  const risks: string[] = [];

  if (!city || !state) risks.push("market location is incomplete");
  if (!estimatedValue) risks.push("estimated value is missing");
  if (!requestedHelp) risks.push("requested help is not specific enough");
  if (photos.length === 0) risks.push("no photos attached");
  if (tags.includes("title")) risks.push("title/legal issue may delay execution");
  if (tags.includes("contractor")) risks.push("repair execution risk");
  if (tags.includes("capital")) risks.push("capital gap must be solved before execution");

  const nextActions = [
    "Confirm ownership/control and decision-maker authority.",
    "Verify numbers: current payoff, repair gap, ARV/value, deadline, and access.",
    `Route first to ${primaryRoutes.slice(0, 2).join(" + ")}.`,
    photos.length > 0 ? "Use attached photos for quick condition review." : "Request photos before serious underwriting.",
    "Create follow-up conversation with the best-fit member/operator.",
  ];

  const shortSummary = [
    `${assetType} ${painType} signal.`,
    city || state ? `Market: ${[city, state].filter(Boolean).join(", ")}.` : "Market not fully provided.",
    `Urgency: ${urgencyLevel}.`,
    requestedHelp ? `Help requested: ${requestedHelp}.` : "",
    capitalNeeded ? `Capital needed: ${moneyText(capitalNeeded)}.` : "",
    estimatedValue ? `Estimated value: ${moneyText(estimatedValue)}.` : "",
    estimatedRepairs ? `Estimated repairs: ${moneyText(estimatedRepairs)}.` : "",
    spread !== null ? `Rough remaining spread after capital/repairs: ${moneyText(spread)}.` : "",
  ]
    .filter(Boolean)
    .join(" ");

  const fullAnalysis = [
    `ANALYSIS: ${shortSummary}`,
    `BEST ROUTE: ${primaryRoutes.join(", ")}.`,
    `RISK FLAGS: ${risks.length ? risks.join("; ") : "No major missing data flags detected from submitted fields."}.`,
    `BEST NEXT ACTION: ${nextActions[0]} Then ${nextActions[2].toLowerCase()}`,
    `ACTION PLAN: ${nextActions.join(" ")}`,
    description ? `ORIGINAL PROBLEM: ${description}` : "",
  ]
    .filter(Boolean)
    .join("\\n\\n");

  return {
    shortSummary,
    fullAnalysis,
    primaryRoutes,
    risks,
    nextActions,
    spread,
  };
}

function buildRoutingReason({
  painType,
  assetType,
  urgencyLevel,
  requestedHelp,
  tags,
}: {
  painType: string;
  assetType: string;
  urgencyLevel: string;
  requestedHelp: string;
  tags: string[];
}) {
  const parts = [
    `Pain type: ${painType}.`,
    assetType ? `Asset type: ${assetType}.` : "",
    `Urgency: ${urgencyLevel}.`,
    requestedHelp ? `Requested help: ${requestedHelp}.` : "",
    tags.length ? `Routing tags: ${tags.join(", ")}.` : "",
  ];

  return parts.filter(Boolean).join(" ");
}

async function insertRoutingSignal(supabase: any, signal: any, tags: string[], analyzer: any, score: number) {
  const fits = routingFits(tags);
  const reason = buildRoutingReason({
    painType: signal.pain_type,
    assetType: signal.asset_type || "",
    urgencyLevel: signal.urgency_level,
    requestedHelp: signal.requested_help || "",
    tags,
  });

  try {
    const { error } = await supabase.from("vf_routing_signals").insert({
      source_type: "pain_submission",
      source_id: signal.id,

      deal_id: signal.deal_id || null,
      member_email: signal.member_email || null,

      signal_type: signal.pain_type || "pain_submission",

      match_score: Math.min(100, score + Math.min(tags.length * 5, 20)),
      urgency_score: score,
      market_score: signal.city || signal.state ? 25 : 0,

      routing_reason: `${reason} Best route: ${analyzer.primaryRoutes.join(", ")}.`,
      ai_explanation:
        analyzer.fullAnalysis ||
        signal.ai_summary ||
        "VaultForge created this routing signal from a Pain Button submission.",

      investor_fit: fits.investor_fit,
      lender_fit: fits.lender_fit,
      operator_fit: fits.operator_fit,
      contractor_fit: fits.contractor_fit,

      tags,

      routed_to: analyzer.primaryRoutes.join(", "),
      routing_status: "pending",
    });

    return !error;
  } catch {
    return false;
  }
}

async function insertActivityEvent(supabase: any, signal: any, tags: string[], analyzer: any) {
  try {
    const { error } = await supabase.from("vf_activity_events").insert({
      event_type: "pain_submitted",
      event_title: signal.title || "Pain Button signal submitted",
      event_description:
        analyzer.shortSummary ||
        signal.description ||
        "A new distress signal was submitted into VaultForge.",

      member_email: signal.member_email || null,

      related_deal_id: signal.deal_id || null,
      related_message_id: null,
      related_alert_id: null,

      visibility: "member",

      metadata: {
        pain_id: signal.id,
        pain_type: signal.pain_type,
        asset_type: signal.asset_type,
        urgency_level: signal.urgency_level,
        routing_status: signal.routing_status,
        best_routes: analyzer.primaryRoutes,
        risk_flags: analyzer.risks,
        action_plan: analyzer.nextActions,
        photo_count: Array.isArray(signal.photo_urls) ? signal.photo_urls.length : 0,
        tags,
      },
    });

    return !error;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));

    const email =
      cleanEmail(request.headers.get("x-vf-email")) ||
      cleanEmail(body?.member_email) ||
      cleanEmail(body?.email);

    const assetType = clean(body?.asset_type || "Residential");
    const painType = clean(body?.pain_type || body?.type || "General Distress");
    const title = clean(body?.title || `${assetType} ${painType}`);
    const description = clean(body?.description);
    const requestedHelp = clean(body?.requested_help);
    const urgencyLevel = clean(body?.urgency_level || "Normal");
    const photoUrls = asStringArray(body?.photo_urls);

    if (!description) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing distress description.",
        },
        { status: 400 }
      );
    }

    const aiTags = createTags({
      ...body,
      asset_type: assetType,
    });

    const score = urgencyScore(urgencyLevel, body);
    const analyzer = buildAnalyzer(
      {
        ...body,
        asset_type: assetType,
        pain_type: painType,
        urgency_level: urgencyLevel,
        description,
        requested_help: requestedHelp,
        photo_urls: photoUrls,
      },
      aiTags
    );

    const payload = {
      member_email: email || null,
      member_name: clean(body?.member_name) || null,

      pain_type: painType,
      urgency_level: urgencyLevel,

      title,
      description,

      asset_type: assetType || null,
      property_address: clean(body?.property_address) || null,
      city: clean(body?.city) || null,
      state: clean(body?.state) || null,
      zip_code: clean(body?.zip_code) || null,

      deal_id: clean(body?.deal_id) || null,

      capital_needed: asNumberOrNull(body?.capital_needed),
      estimated_value: asNumberOrNull(body?.estimated_value),
      estimated_repairs: asNumberOrNull(body?.estimated_repairs),

      requested_help: requestedHelp || null,
      routing_status: "pending",

      ai_summary: analyzer.fullAnalysis,
      ai_tags: aiTags,

      photo_urls: photoUrls,

      assigned_to: null,
      resolved: false,
    };

    const supabase = supabaseClient();

    const { data, error } = await supabase
      .from("vf_pain_submissions")
      .insert(payload)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json(
        {
          ok: false,
          error: error.message || "Could not create distress signal.",
          details: error,
        },
        { status: 500 }
      );
    }

    const [routingInserted, activityInserted] = await Promise.all([
      insertRoutingSignal(supabase, data, aiTags, analyzer, score),
      insertActivityEvent(supabase, data, aiTags, analyzer),
    ]);

    return NextResponse.json({
      ok: true,
      signal: data,
      analysis: analyzer,
      message: "Distress signal analyzed and routed into VaultForge.",
      source: "vf_pain_submissions",
      routing: {
        created: routingInserted,
        source: "vf_routing_signals",
      },
      activity: {
        created: activityInserted,
        source: "vf_activity_events",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: "Could not create distress signal.",
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
