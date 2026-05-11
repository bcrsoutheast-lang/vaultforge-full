import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function clean(value: unknown) {
  return String(value || "").trim();
}

function cleanEmail(value: unknown) {
  return clean(value).toLowerCase();
}

function arr(value: unknown) {
  if (Array.isArray(value)) return value.map(clean).filter(Boolean);
  if (typeof value === "string") return value.split(",").map(clean).filter(Boolean);
  return [];
}

function safeId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function db() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    "";

  if (!url || !key) throw new Error("Missing Supabase environment variables.");

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

function moneyPresent(value: unknown) {
  return clean(value).replace(/[$,\s]/g, "").length > 0;
}

function intelligence(body: any, photos: string[]) {
  const title = clean(body.title) || `${clean(body.asset_type) || "Asset"} signal`;
  const painType = clean(body.pain_type).replace(/_/g, " ") || "pain signal";
  const assetType = clean(body.asset_type) || "Unknown asset";
  const state = clean(body.operating_state || body.state);
  const city = clean(body.city);
  const urgency = clean(body.urgency) || "Normal";
  const timeline = clean(body.timeline);
  const help = clean(body.help_requested || body.requested_help);
  const notes = clean(body.notes || body.description);
  const capital = clean(body.capital_needed);
  const asking = clean(body.asking_price);
  const arv = clean(body.arv_value);
  const repairs = clean(body.repairs_needed);

  const location = [city, state].filter(Boolean).join(", ") || "market not provided";

  const summaryParts = [
    `${title} is a ${assetType.toLowerCase()} ${painType} in ${location}.`,
    help ? `The stated need is: ${help}.` : "",
    notes ? `Situation notes: ${notes}.` : "",
    urgency ? `Urgency is marked ${urgency}${timeline ? ` with timeline ${timeline}` : ""}.` : "",
    moneyPresent(capital) ? `Capital needed is listed as ${capital}.` : "",
    moneyPresent(asking) || moneyPresent(arv) || moneyPresent(repairs)
      ? `Numbers provided: asking ${asking || "not listed"}, ARV/value ${arv || "not listed"}, repairs/work ${repairs || "not listed"}.`
      : "",
    photos.length ? `${photos.length} photo(s) are attached for asset context.` : "No photos are attached yet.",
  ].filter(Boolean);

  const bestActions: string[] = [];
  const riskFlags: string[] = [];
  const suggestedRoutes: string[] = [];

  if (help.toLowerCase().includes("buyer") || body.pain_type === "buyer_needed") suggestedRoutes.push("Buyer");
  if (help.toLowerCase().includes("capital") || help.toLowerCase().includes("fund") || moneyPresent(capital)) suggestedRoutes.push("Lender / Capital");
  if (help.toLowerCase().includes("contractor") || body.pain_type === "contractor_needed") suggestedRoutes.push("Contractor");
  if (assetType === "Land" || body.pain_type === "land_opportunity") suggestedRoutes.push("Builder / Developer / Land Buyer");
  if (assetType === "Commercial" || body.pain_type === "commercial_opportunity") suggestedRoutes.push("Commercial Buyer / Operator");
  if (body.pain_type === "permit_city_issue") suggestedRoutes.push("Permit / City / Attorney");
  if (!suggestedRoutes.length) suggestedRoutes.push("Owner Review", "Buyer", "Capital");

  bestActions.push("Verify seller/deal authority and confirm who controls the opportunity.");
  if (!photos.length) bestActions.push("Request photos before broad routing.");
  if (!clean(body.address)) bestActions.push("Request exact address or tighter location before underwriting.");
  if (!moneyPresent(asking) && !moneyPresent(arv)) bestActions.push("Request asking price and ARV/value before routing capital.");
  if (suggestedRoutes.includes("Buyer")) bestActions.push("Route to matching buyers in the operating state.");
  if (suggestedRoutes.includes("Lender / Capital")) bestActions.push("Route to lenders/private capital with funding capacity.");
  if (assetType === "Residential") bestActions.push("Check repair scope, occupancy, beds/baths, and comparable exit strategy.");
  if (assetType === "Commercial") bestActions.push("Request rent roll, NOI, lease status, occupancy, and tenant details.");
  if (assetType === "Land") bestActions.push("Verify zoning, utilities, road access, entitlement status, and builder demand.");
  bestActions.push("Keep contact controlled inside VaultForge until owner review approves release.");

  if (!photos.length) riskFlags.push("No photos attached");
  if (!clean(body.address)) riskFlags.push("Address/location incomplete");
  if (!moneyPresent(asking)) riskFlags.push("Asking price missing");
  if (!moneyPresent(arv)) riskFlags.push("ARV/value missing");
  if (urgency.toLowerCase() === "emergency" || urgency.toLowerCase() === "high") riskFlags.push("High urgency");
  if (!timeline) riskFlags.push("Timeline/deadline missing");
  if (!help) riskFlags.push("Help requested is unclear");
  if (!riskFlags.length) riskFlags.push("No major missing-data flags detected");

  let priorityScore = 45;
  if (urgency.toLowerCase() === "emergency") priorityScore += 25;
  if (urgency.toLowerCase() === "high") priorityScore += 18;
  if (timeline) priorityScore += 8;
  if (photos.length) priorityScore += 8;
  if (moneyPresent(asking) || moneyPresent(arv)) priorityScore += 8;
  if (moneyPresent(capital)) priorityScore += 8;
  if (clean(body.address)) priorityScore += 6;
  priorityScore = Math.min(100, priorityScore);

  const routeSummary = `Suggested route: ${Array.from(new Set(suggestedRoutes)).join(", ")}. Priority score: ${priorityScore}.`;

  return {
    ai_summary: summaryParts.join(" "),
    best_actions: bestActions,
    risk_flags: riskFlags,
    suggested_routes: Array.from(new Set(suggestedRoutes)),
    priority_score: priorityScore,
    route_summary: routeSummary,
  };
}

async function tryInsert(client: ReturnType<typeof db>, table: string, candidates: Record<string, any>[]) {
  const attempts: any[] = [];

  for (const payload of candidates) {
    const cleaned = Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined));

    const result = await client.from(table).insert(cleaned).select("*").maybeSingle();

    attempts.push({
      table,
      ok: !result.error,
      error: result.error?.message || null,
      keys: Object.keys(cleaned),
    });

    if (!result.error) return { ok: true, table, data: result.data, attempts };
  }

  return { ok: false, table, data: null, attempts };
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const client = db();

    const email = cleanEmail(body.email || body.member_email || body.submitted_by || request.headers.get("x-vf-email"));
    const painId = safeId("pain");
    const signalId = safeId("signal");
    const routingId = safeId("routing");
    const title = clean(body.title) || `${clean(body.asset_type) || "Asset"} signal`;
    const photos = arr(body.photo_urls || body.photos).filter((url) => url.startsWith("http"));
    const intel = intelligence(body, photos);

    const assetSpecific = typeof body.asset_specific === "object" && body.asset_specific ? body.asset_specific : {};

    const metadata = {
      ...body,
      pain_id: painId,
      signal_id: signalId,
      routing_id: routingId,
      member_email: email,
      owner_email: email,
      photo_urls: photos,
      photos,
      asset_specific: assetSpecific,
      ai_summary: intel.ai_summary,
      best_actions: intel.best_actions,
      risk_flags: intel.risk_flags,
      suggested_routes: intel.suggested_routes,
      priority_score: intel.priority_score,
      route_summary: intel.route_summary,
      created_by: "vaultforge_pain_intelligence_upgrade",
    };

    const painCandidates = [
      {
        id: painId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        member_email: email,
        user_email: email,
        submitted_by: email,
        title,
        pain_type: body.pain_type,
        urgency_level: body.urgency,
        urgency: body.urgency,
        description: body.notes,
        notes: body.notes,
        requested_help: body.help_requested,
        help_requested: body.help_requested,
        asset_type: body.asset_type,
        operating_state: body.operating_state,
        state: body.operating_state,
        city: body.city,
        area: body.area,
        submarket: body.area,
        address: body.address,
        property_address: body.address,
        capital_needed: body.capital_needed,
        asking_price: body.asking_price,
        arv_value: body.arv_value,
        estimated_value: body.arv_value,
        estimated_repairs: body.repairs_needed,
        repairs_needed: body.repairs_needed,
        route_context: intel.suggested_routes.join(" / "),
        routing_status: "new",
        ai_summary: intel.ai_summary,
        ai_tags: intel.suggested_routes,
        photo_urls: photos,
        photos,
        image_url: photos[0] || null,
        photo_url: photos[0] || null,
        signal_id: signalId,
        routing_id: routingId,
        status: "new",
        metadata,
      },
      {
        email,
        title,
        notes: body.notes,
        metadata,
        created_at: new Date().toISOString(),
      },
    ];

    const signalCandidates = [
      {
        id: signalId,
        created_at: new Date().toISOString(),
        signal_id: signalId,
        item_id: painId,
        title,
        note: body.notes,
        summary: intel.ai_summary,
        route_summary: intel.route_summary,
        action: body.pain_type,
        priority: body.urgency,
        urgency_reason: `${clean(body.urgency) || "Normal"} routing review generated from Pain Button.`,
        status: "new",
        routing_status: "generated",
        member_email: email,
        owner_email: email,
        submitted_by_email: email,
        created_by_email: email,
        target_email: email,
        recipient_email: email,
        visible_to_email: email,
        source_table: "pain_requests",
        source: "vf_pain_submissions",
        photos,
        photo_urls: photos,
        image_url: photos[0] || null,
        photo_url: photos[0] || null,
        asset_type: body.asset_type,
        market: body.operating_state,
        city: body.city,
        state: body.operating_state,
        strategy: "Review",
        confidence_score: intel.priority_score,
        match_score: 0,
        metadata,
      },
      {
        signal_id: signalId,
        item_id: painId,
        title,
        summary: intel.ai_summary,
        metadata,
        created_at: new Date().toISOString(),
      },
    ];

    const activityCandidates = [
      {
        id: safeId("activity"),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        event_type: "pain_signal_created",
        type: "pain_signal_created",
        title,
        event_title: title,
        note: intel.ai_summary,
        event_description: intel.route_summary,
        message: body.help_requested,
        priority: body.urgency,
        status: "new",
        member_email: email,
        sender_email: email,
        from_email: email,
        recipient_email: email,
        to_email: email,
        target_email: email,
        owner_email: email,
        visible_to_email: email,
        signal_id: signalId,
        item_id: painId,
        source: "pain_create",
        metadata,
      },
      {
        event_type: "pain_signal_created",
        title,
        note: intel.ai_summary,
        member_email: email,
        signal_id: signalId,
        metadata,
        created_at: new Date().toISOString(),
      },
    ];

    const routingCandidates = [
      {
        id: routingId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        signal_id: signalId,
        item_id: painId,
        title,
        note: body.help_requested,
        route_summary: intel.route_summary,
        role_needed: intel.suggested_routes.join(", "),
        action: "route_review",
        priority: body.urgency,
        status: "generated",
        routing_status: "generated",
        member_email: email,
        owner_email: email,
        submitted_by_email: email,
        created_by_email: email,
        target_email: email,
        recipient_email: email,
        visible_to_email: email,
        confidence_score: intel.priority_score,
        metadata,
      },
      {
        signal_id: signalId,
        item_id: painId,
        title,
        route_summary: intel.route_summary,
        member_email: email,
        metadata,
        created_at: new Date().toISOString(),
      },
    ];

    const painTables = ["pain_requests", "vf_pain_requests", "vf_pain_signals", "pain_signals"];
    const signalTables = ["vf_routing_signals", "vf_intelligence_signals", "intelligence_signals"];
    const activityTables = ["vf_activity_events", "activity_events"];
    const routingTables = ["vf_routing_actions", "routing_actions"];

    const attempts: any[] = [];
    let savedPain: any = null;
    let savedSignal: any = null;
    let savedActivity: any = null;
    let savedRouting: any = null;

    for (const table of painTables) {
      const result = await tryInsert(client, table, painCandidates);
      attempts.push(...result.attempts);
      if (result.ok) {
        savedPain = { table, data: result.data };
        break;
      }
    }

    for (const table of signalTables) {
      const result = await tryInsert(client, table, signalCandidates);
      attempts.push(...result.attempts);
      if (result.ok) {
        savedSignal = { table, data: result.data };
        break;
      }
    }

    for (const table of activityTables) {
      const result = await tryInsert(client, table, activityCandidates);
      attempts.push(...result.attempts);
      if (result.ok) {
        savedActivity = { table, data: result.data };
        break;
      }
    }

    for (const table of routingTables) {
      const result = await tryInsert(client, table, routingCandidates);
      attempts.push(...result.attempts);
      if (result.ok) {
        savedRouting = { table, data: result.data };
        break;
      }
    }

    if (!savedPain && !savedSignal) {
      return NextResponse.json(
        {
          ok: false,
          error: "Pain signal could not be saved to available tables.",
          attempts,
        },
        { status: 500 }
      );
    }

    const direct_links = {
      dashboard: "/dashboard",
      pain_feed: "/pain-feed",
      pain_room: `/pain-room/${encodeURIComponent(painId)}`,
      signal_room: `/signals/${encodeURIComponent(signalId)}`,
      routing_room: `/routing-room/${encodeURIComponent(signalId)}`,
      activity_room: `/activity/pain_signal_created/${encodeURIComponent(signalId)}`,
      message_owner: `/connect/${encodeURIComponent(signalId)}?email=${encodeURIComponent(email)}&item_id=${encodeURIComponent(painId)}`,
      messages: "/messages",
      alerts: "/alerts",
    };

    return NextResponse.json({
      ok: true,
      pain_id: painId,
      signal_id: signalId,
      routing_id: routingId,
      saved: {
        pain: savedPain,
        signal: savedSignal,
        activity: savedActivity,
        routing: savedRouting,
      },
      intelligence: intel,
      direct_links,
      attempts,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Pain signal could not be created.",
      },
      { status: 500 }
    );
  }
}
