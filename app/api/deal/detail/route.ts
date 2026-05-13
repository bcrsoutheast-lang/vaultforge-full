import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const TABLE = "vf_deals";

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

function first(...values: unknown[]) {
  for (const value of values) {
    if (Array.isArray(value)) {
      const found = value.find((item) => clean(item));
      if (found !== undefined) return clean(found);
      continue;
    }

    const text = clean(value);
    if (text) return text;
  }

  return "";
}

function parseArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(clean).filter(Boolean);

  const text = clean(value);
  if (!text) return [];

  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return parsed.map(clean).filter(Boolean);
  } catch {
    // Continue.
  }

  return text
    .split(/[,\n|;]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function metadataOf(row: Row) {
  return typeof row?.metadata === "object" && row.metadata ? row.metadata : {};
}

function photoUrls(row: Row) {
  const m = metadataOf(row);

  const values = [
    row.main_photo_url,
    row.image_url,
    row.photo_url,
    row.primary_photo_url,
    m.main_photo_url,
    m.image_url,
    m.photo_url,
    m.primary_photo_url,
    ...parseArray(row.photo_urls),
    ...parseArray(row.photos),
    ...parseArray(m.photo_urls),
    ...parseArray(m.photos),
  ];

  return Array.from(new Set(values.map(clean).filter((url) => url.startsWith("http"))));
}

function normalizeDeal(row: Row) {
  const m = metadataOf(row);
  const photos = photoUrls(row);
  const id = first(row.id, row.deal_id, row.project_id, row.item_id, m.id, m.deal_id, m.project_id, m.item_id);
  const asking = first(row.asking_price, row.price, m.asking_price, m.price);
  const arv = first(row.arv, row.arv_value, row.estimated_value, m.arv, m.arv_value, m.estimated_value);
  const repairs = first(row.repair_estimate, row.repairs_needed, row.estimated_repairs, m.repair_estimate, m.repairs_needed, m.estimated_repairs);
  const propertyType = first(row.property_type, row.deal_type, row.asset_type, m.property_type, m.deal_type, m.asset_type, "Deal");
  const strategy = first(row.strategy, row.exit_strategy, m.strategy, m.exit_strategy);
  const routingNeeds = first(row.routing_needs, row.deal_needs, row.needs, m.routing_needs, m.deal_needs, m.needs);
  const distress = first(row.distress_signals, row.seller_situation, m.distress_signals, m.seller_situation);
  const routeSummary = first(
    row.ai_route_summary,
    row.route_summary,
    row.routing_summary,
    row.urgency_reason,
    row.routing_reason,
    row.description,
    row.seller_situation,
    m.ai_route_summary,
    m.route_summary,
    m.routing_summary,
    m.urgency_reason,
    m.routing_reason,
    m.description,
    m.seller_situation
  );

  return {
    ...m,
    ...row,
    id,
    deal_id: first(row.deal_id, m.deal_id, id),
    item_id: first(row.item_id, m.item_id, id),
    project_id: first(row.project_id, m.project_id, id),

    title: first(row.title, row.deal_title, row.name, row.address, m.title, m.deal_title, m.name, m.address, "VaultForge Deal"),
    status: first(row.status, row.project_status, row.routing_status, m.status, m.project_status, m.routing_status, "active"),

    property_type: propertyType,
    deal_type: first(row.deal_type, m.deal_type, propertyType),
    asset_type: first(row.asset_type, m.asset_type, propertyType),

    city: first(row.city, m.city),
    state: first(row.state, row.market, m.state, m.market),
    market: [first(row.city, m.city), first(row.state, row.market, m.state, m.market)].filter(Boolean).join(", ") || first(row.location, row.address, m.location, m.address),

    asking_price: asking,
    price: first(row.price, m.price, asking),
    arv,
    arv_value: first(row.arv_value, m.arv_value, arv),
    repair_estimate: repairs,
    repairs_needed: first(row.repairs_needed, m.repairs_needed, repairs),

    strategy,
    exit_strategy: first(row.exit_strategy, m.exit_strategy, strategy),

    routing_needs: routingNeeds,
    deal_needs: first(row.deal_needs, m.deal_needs, routingNeeds),
    needs: first(row.needs, m.needs, routingNeeds),

    distress_signals: first(row.distress_signals, m.distress_signals, distress),
    seller_situation: first(row.seller_situation, m.seller_situation, distress),

    ai_route_summary: first(row.ai_route_summary, m.ai_route_summary, routeSummary),
    route_summary: first(row.route_summary, m.route_summary, routeSummary),
    routing_summary: first(row.routing_summary, m.routing_summary, routeSummary),

    beds: first(row.beds, row.bedrooms, m.beds, m.bedrooms),
    bedrooms: first(row.bedrooms, row.beds, m.bedrooms, m.beds),
    baths: first(row.baths, row.bathrooms, m.baths, m.bathrooms),
    bathrooms: first(row.bathrooms, row.baths, m.bathrooms, m.baths),
    square_feet: first(row.square_feet, row.sqft, row.building_sqft, m.square_feet, m.sqft, m.building_sqft),
    sqft: first(row.sqft, row.square_feet, row.building_sqft, m.sqft, m.square_feet, m.building_sqft),
    building_sqft: first(row.building_sqft, row.square_feet, row.sqft, m.building_sqft, m.square_feet, m.sqft),

    year_built: first(row.year_built, m.year_built),
    occupancy: first(row.occupancy, m.occupancy),
    zoning: first(row.zoning, m.zoning),
    acres: first(row.acres, row.land_acres, m.acres, m.land_acres),
    land_acres: first(row.land_acres, row.acres, m.land_acres, m.acres),
    utilities: first(row.utilities, m.utilities),
    road_access: first(row.road_access, m.road_access),
    noi: first(row.noi, m.noi),
    cap_rate: first(row.cap_rate, m.cap_rate),

    target_buyer: first(row.target_buyer, m.target_buyer),
    capital_needed: first(row.capital_needed, m.capital_needed),
    ideal_lender: first(row.ideal_lender, m.ideal_lender),
    contractor_scope: first(row.contractor_scope, m.contractor_scope),
    operator_scope: first(row.operator_scope, m.operator_scope),
    jv_structure: first(row.jv_structure, m.jv_structure),
    title_issue: first(row.title_issue, m.title_issue),

    photo_urls: photos,
    main_photo_url: first(row.main_photo_url, m.main_photo_url, photos[0]),
    source_table: TABLE,
  };
}

async function findDeal(supabase: any, id: string) {
  const columns = ["id", "deal_id", "project_id", "item_id"];

  for (const column of columns) {
    try {
      const { data, error } = await supabase
        .from(TABLE)
        .select("*")
        .eq(column, id)
        .maybeSingle();

      if (!error && data) return data;
    } catch {
      // Column may not exist.
    }
  }

  try {
    const { data, error } = await supabase.from(TABLE).select("*").limit(250);

    if (!error && Array.isArray(data)) {
      return (
        data.find((row: Row) =>
          [row.id, row.deal_id, row.project_id, row.item_id, metadataOf(row).id, metadataOf(row).deal_id, metadataOf(row).project_id, metadataOf(row).item_id]
            .map(clean)
            .includes(id)
        ) || null
      );
    }
  } catch {
    // Fail below.
  }

  return null;
}

export async function GET(request: Request) {
  try {
    const id = clean(new URL(request.url).searchParams.get("id") || "");

    if (!id) {
      return NextResponse.json({ ok: false, error: "Missing deal id." }, { status: 400 });
    }

    const supabase = supabaseClient();
    const deal = await findDeal(supabase, id);

    if (!deal) {
      return NextResponse.json({ ok: false, error: "Deal not found." }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      deal: normalizeDeal(deal),
      source: "api/deal/detail",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: "Could not load deal.",
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
