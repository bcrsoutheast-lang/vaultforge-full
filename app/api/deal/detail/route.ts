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

function photoUrls(row: Row) {
  const values = [
    row.main_photo_url,
    row.image_url,
    row.photo_url,
    row.primary_photo_url,
    ...parseArray(row.photo_urls),
    ...parseArray(row.photos),
  ];

  return Array.from(new Set(values.map(clean).filter((url) => url.startsWith("http"))));
}

function normalizeDeal(row: Row) {
  const photos = photoUrls(row);
  const id = first(row.id, row.deal_id, row.project_id, row.item_id);
  const asking = first(row.asking_price, row.price);
  const arv = first(row.arv, row.arv_value, row.estimated_value);
  const repairs = first(row.repair_estimate, row.repairs_needed, row.estimated_repairs);
  const propertyType = first(row.property_type, row.deal_type, row.asset_type, "Deal");
  const strategy = first(row.strategy, row.exit_strategy);
  const routingNeeds = first(row.routing_needs, row.deal_needs, row.needs);
  const distress = first(row.distress_signals, row.seller_situation);
  const routeSummary = first(
    row.ai_route_summary,
    row.route_summary,
    row.routing_summary,
    row.urgency_reason,
    row.routing_reason,
    row.description,
    row.seller_situation
  );

  return {
    ...row,
    id,
    deal_id: first(row.deal_id, id),
    item_id: first(row.item_id, id),
    project_id: first(row.project_id, id),

    title: first(row.title, row.deal_title, row.name, row.address, "VaultForge Deal"),
    status: first(row.status, row.project_status, row.routing_status, "active"),

    property_type: propertyType,
    deal_type: first(row.deal_type, propertyType),
    asset_type: first(row.asset_type, propertyType),

    city: first(row.city),
    state: first(row.state, row.market),
    market: [first(row.city), first(row.state, row.market)].filter(Boolean).join(", ") || first(row.location, row.address),

    asking_price: asking,
    price: first(row.price, asking),
    arv,
    arv_value: first(row.arv_value, arv),
    repair_estimate: repairs,
    repairs_needed: first(row.repairs_needed, repairs),

    strategy,
    exit_strategy: first(row.exit_strategy, strategy),

    routing_needs: routingNeeds,
    deal_needs: first(row.deal_needs, routingNeeds),
    needs: first(row.needs, routingNeeds),

    distress_signals: first(row.distress_signals, distress),
    seller_situation: first(row.seller_situation, distress),

    ai_route_summary: first(row.ai_route_summary, routeSummary),
    route_summary: first(row.route_summary, routeSummary),
    routing_summary: first(row.routing_summary, routeSummary),

    beds: first(row.beds, row.bedrooms),
    bedrooms: first(row.bedrooms, row.beds),
    baths: first(row.baths, row.bathrooms),
    bathrooms: first(row.bathrooms, row.baths),
    square_feet: first(row.square_feet, row.sqft, row.building_sqft),
    sqft: first(row.sqft, row.square_feet, row.building_sqft),
    building_sqft: first(row.building_sqft, row.square_feet, row.sqft),

    photo_urls: photos,
    main_photo_url: first(row.main_photo_url, photos[0]),
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
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .limit(250);

    if (!error && Array.isArray(data)) {
      return data.find((row: Row) =>
        [row.id, row.deal_id, row.project_id, row.item_id].map(clean).includes(id)
      ) || null;
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
