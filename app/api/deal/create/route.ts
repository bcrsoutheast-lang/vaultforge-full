import { NextResponse } from "next/server";
import { analyzeDeal } from "../../../lib/vaultforge-ai";
import { matchDealToMembers } from "../../../lib/vaultforge-routing";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const STATES = ["Georgia", "Tennessee", "Florida", "North Carolina", "South Carolina", "Texas"];
const PROPERTY_TYPES = ["Residential", "Commercial", "Land"];
const STRATEGIES = [
  "Fix & Flip",
  "Rental",
  "Wholesale",
  "Development",
  "BRRRR",
  "Buy & Hold",
  "Creative Finance",
  "Private Lending",
];

const DEAL_NEEDS = [
  "Buyer Needed",
  "Capital Needed",
  "Lender Needed",
  "Contractor Needed",
  "JV Partner Needed",
  "Disposition Help",
  "Due Diligence Help",
  "Project Management Needed",
];

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  if (!url || !key) return null;
  return { url, key };
}

function getEmail(req: Request) {
  const headerEmail =
    req.headers.get("x-vf-email") ||
    req.headers.get("x-vf-user-email") ||
    req.headers.get("x-vaultforge-email") ||
    "";

  if (headerEmail && headerEmail.includes("@")) {
    return headerEmail.trim().toLowerCase();
  }

  return "";
}

function cleanText(value: unknown, max = 900) {
  return String(value || "").trim().slice(0, max);
}

function cleanNumber(value: unknown) {
  const raw = String(value ?? "").replace(/,/g, "").trim();
  if (!raw) return null;
  const num = Number(raw);
  if (Number.isNaN(num)) return null;
  return num;
}

function cleanArray(value: unknown, allowed?: string[], max = 20) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => String(item || "").trim())
    .filter(Boolean)
    .filter((item) => (allowed ? allowed.includes(item) : true))
    .slice(0, max);
}

function cleanPhotoUrls(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => String(item || "").trim())
    .filter(Boolean)
    .slice(0, 5);
}

export async function POST(req: Request) {
  const config = getSupabaseConfig();

  if (!config) {
    return NextResponse.json(
      { error: "Supabase environment variables are missing." },
      { status: 500 }
    );
  }

  const ownerEmail = getEmail(req);

  if (!ownerEmail) {
    return NextResponse.json({ error: "Not logged in." }, { status: 401 });
  }

  const body = await req.json();

  const title = cleanText(body.title, 160);
  const state = cleanText(body.state, 80);
  const city = cleanText(body.city, 120);
  const county = cleanText(body.county, 120);
  const address = cleanText(body.address, 240);
  const property_type = cleanText(body.property_type, 80);
  const strategy = cleanText(body.strategy, 80);
  const description = cleanText(body.description, 1400);

  if (!title) return NextResponse.json({ error: "Deal title is required." }, { status: 400 });
  if (!STATES.includes(state)) return NextResponse.json({ error: "Valid state is required." }, { status: 400 });
  if (!city) return NextResponse.json({ error: "City is required." }, { status: 400 });
  if (!PROPERTY_TYPES.includes(property_type)) return NextResponse.json({ error: "Valid property type is required." }, { status: 400 });
  if (strategy && !STRATEGIES.includes(strategy)) return NextResponse.json({ error: "Valid strategy is required." }, { status: 400 });

  const payload: any = {
    owner_email: ownerEmail,
    title,
    state,
    city,
    county,
    address,
    property_type,
    strategy,
    description,
    status: "active",
    archived: false,

    price: cleanNumber(body.price),
    asking_price: cleanNumber(body.asking_price),
    arv: cleanNumber(body.arv),
    repair_estimate: cleanNumber(body.repair_estimate),
    equity: cleanNumber(body.equity),
    debt_balance: cleanNumber(body.debt_balance),
    rent_estimate: cleanNumber(body.rent_estimate),
    noi: cleanNumber(body.noi),
    cap_rate: cleanNumber(body.cap_rate),
    lot_size: cleanText(body.lot_size, 120),
    building_sqft: cleanNumber(body.building_sqft),
    land_acres: cleanNumber(body.land_acres),
    units: cleanNumber(body.units),
    bedrooms: cleanNumber(body.bedrooms),
    bathrooms: cleanNumber(body.bathrooms),
    year_built: cleanNumber(body.year_built),

    occupancy: cleanText(body.occupancy, 120),
    condition: cleanText(body.condition, 160),
    timeline: cleanText(body.timeline, 180),
    seller_situation: cleanText(body.seller_situation, 500),
    access_notes: cleanText(body.access_notes, 500),
    private_notes: cleanText(body.private_notes, 900),

    deal_needs: cleanArray(body.deal_needs, DEAL_NEEDS),
    photo_urls: cleanPhotoUrls(body.photo_urls),
    main_photo_url: cleanPhotoUrls(body.photo_urls)[0] || "",

    zoning: cleanText(body.zoning, 160),
    utilities: cleanText(body.utilities, 240),
    road_frontage: cleanText(body.road_frontage, 160),
    parcel_id: cleanText(body.parcel_id, 160),
  };

  const ai = analyzeDeal({
    title,
    state,
    property_type,
    strategy,
    price: payload.price || payload.asking_price,
    description,
  });

  payload.ai_summary = ai.ai_summary;

  const res = await fetch(`${config.url}/rest/v1/vf_deals`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: config.key,
      Authorization: `Bearer ${config.key}`,
      Prefer: "return=representation",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    return NextResponse.json(
      { error: "Failed to save deal.", details: await res.text() },
      { status: 500 }
    );
  }

  const saved = await res.json();
  const deal = saved?.[0] || null;
  const routing = deal?.id ? await matchDealToMembers(deal) : { ok: true, matched: 0 };

  return NextResponse.json({
    ok: true,
    deal,
    ai,
    routing,
  });
}
