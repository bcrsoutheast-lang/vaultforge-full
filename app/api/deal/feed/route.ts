import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const OWNER_EMAIL = "bcrsoutheast@gmail.com";
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

function cleanEmail(value: unknown) {
  return clean(value).toLowerCase();
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
      readCookie(cookie, "vf_member_email") ||
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

function toNumber(value: unknown) {
  const text = clean(value);
  if (!text) return null;

  const n = Number(text.replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : null;
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

function ownerEmail(row: Row) {
  return cleanEmail(first(row.owner_email, row.member_email, row.created_by_email, row.submitted_by_email, row.user_email, row.email));
}

function canSee(row: Row, email: string, owner: boolean) {
  if (owner) return true;
  if (!email) return false;

  const visible = [
    row.owner_email,
    row.member_email,
    row.created_by_email,
    row.submitted_by_email,
    row.user_email,
    row.email,
    row.visible_to_email,
    row.target_email,
    row.recipient_email,
  ]
    .map(cleanEmail)
    .filter(Boolean);

  if (!visible.length) return false;

  return visible.includes(email);
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

    owner_email: ownerEmail(row),
    member_email: cleanEmail(first(row.member_email, row.owner_email, row.created_by_email, row.submitted_by_email)),

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

    detail_href: id ? `/deal/detail?id=${encodeURIComponent(id)}` : "/projects",
    created_at: first(row.created_at, row.updated_at, new Date().toISOString()),
    source_table: TABLE,
    source: "deal_feed",
  };
}

async function selectDeals(supabase: any) {
  const orderColumns = ["created_at", "updated_at", "id"];

  for (const column of orderColumns) {
    try {
      const { data, error } = await supabase
        .from(TABLE)
        .select("*")
        .or("archived.is.null,archived.eq.false")
        .or("deleted.is.null,deleted.eq.false")
        .order(column, { ascending: false })
        .limit(200);

      if (!error && Array.isArray(data)) return data;
    } catch {
      // Try next.
    }
  }

  try {
    const { data, error } = await supabase.from(TABLE).select("*").limit(200);
    if (!error && Array.isArray(data)) return data;
  } catch {
    // Fail below.
  }

  return [];
}

export async function GET(request: Request) {
  try {
    const email = requestEmail(request);
    const owner = isOwnerRequest(request, email);

    if (!email) {
      return NextResponse.json({ ok: false, error: "Login email required." }, { status: 401 });
    }

    const supabase = supabaseClient();
    const rows = await selectDeals(supabase);

    const deals = rows
      .filter((row) => canSee(row, email, owner))
      .map(normalizeDeal)
      .filter((row) => row.id)
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());

    return NextResponse.json({
      ok: true,
      deals,
      projects: deals,
      items: deals,
      count: deals.length,
      email,
      owner,
      source: "api/deal/feed",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: "Could not load deal feed.",
        details: error?.message || String(error),
        source: "api/deal/feed",
      },
      { status: 500 }
    );
  }
}
