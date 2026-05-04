import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const STATES = ["Georgia", "Tennessee", "Florida", "North Carolina", "South Carolina", "Texas"];
const MEMBER_TYPES = ["Buyer", "Lender", "Contractor", "Developer", "Wholesaler", "Operator", "Partner", "Agent", "Seller"];
const ASSET_TYPES = ["Residential", "Commercial", "Land", "Multifamily", "Industrial", "Mixed Use"];
const STRATEGIES = ["Fix & Flip", "Rental", "Wholesale", "Development", "BRRRR", "Buy & Hold", "Creative Finance", "Private Lending"];
const SERVICES = ["Capital", "Hard Money", "Private Lending", "Construction", "Development", "Disposition", "Acquisition", "Property Management", "Legal", "Title", "Insurance", "Appraisal", "Project Management"];
const NEEDS = ["Deals", "Capital", "Lenders", "Buyers", "Contractors", "JV Partners", "Disposition", "Acquisition Help", "Due Diligence", "Project Management", "Off-Market Supply"];

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

function cleanText(value: unknown, max = 600) {
  return String(value || "").trim().slice(0, max);
}

function cleanArray(value: unknown, allowed: string[]) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => String(item || "").trim())
    .filter((item) => allowed.includes(item));
}

function cleanNumber(value: unknown) {
  const raw = String(value ?? "").replace(/,/g, "").trim();
  if (!raw) return null;
  const num = Number(raw);
  if (Number.isNaN(num)) return null;
  return num;
}

function isComplete(payload: any) {
  return Boolean(
    payload.full_name &&
    payload.primary_role &&
    Array.isArray(payload.member_types) &&
    payload.member_types.length > 0 &&
    Array.isArray(payload.states) &&
    payload.states.length > 0 &&
    Array.isArray(payload.asset_types) &&
    payload.asset_types.length > 0 &&
    Array.isArray(payload.strategies) &&
    payload.strategies.length > 0
  );
}

export async function POST(req: Request) {
  const config = getSupabaseConfig();

  if (!config) {
    return NextResponse.json(
      { error: "Supabase environment variables are missing." },
      { status: 500 }
    );
  }

  const email = getEmail(req);

  if (!email) {
    return NextResponse.json({ error: "Not logged in." }, { status: 401 });
  }

  const body = await req.json();

  const payload: any = {
    email,
    full_name: cleanText(body.full_name, 120),
    display_name: cleanText(body.display_name, 120),
    company_name: cleanText(body.company_name, 160),
    phone: cleanText(body.phone, 80),
    website_url: cleanText(body.website_url, 250),
    profile_photo_url: cleanText(body.profile_photo_url, 500),
    logo_url: cleanText(body.logo_url, 500),
    bio: cleanText(body.bio, 1200),
    contact_preference: cleanText(body.contact_preference, 120),
    primary_role: cleanText(body.primary_role, 80),
    member_type: cleanText(body.primary_role, 80),
    member_types: cleanArray(body.member_types, MEMBER_TYPES),
    states: cleanArray(body.states, STATES),
    markets: cleanArray(body.markets, STATES),
    preferred_markets: cleanArray(body.preferred_markets, STATES),
    asset_types: cleanArray(body.asset_types, ASSET_TYPES),
    strategies: cleanArray(body.strategies, STRATEGIES),
    buy_box_states: cleanArray(body.buy_box_states, STATES),
    buy_box_types: cleanArray(body.buy_box_types, ASSET_TYPES),
    buy_box_strategies: cleanArray(body.buy_box_strategies, STRATEGIES),
    sell_box_types: cleanArray(body.sell_box_types, ASSET_TYPES),
    services_offered: cleanArray(body.services_offered, SERVICES),
    needs: cleanArray(body.needs, NEEDS),
    funding_sources: Array.isArray(body.funding_sources)
      ? body.funding_sources.map((item: unknown) => cleanText(item, 80)).filter(Boolean)
      : [],
    capital_available: cleanNumber(body.capital_available),
    capital_needed: cleanNumber(body.capital_needed),
    min_price: cleanNumber(body.min_price),
    max_price: cleanNumber(body.max_price),
    min_arv: cleanNumber(body.min_arv),
    max_arv: cleanNumber(body.max_arv),
    experience_level: cleanText(body.experience_level, 80),
    deals_done: cleanNumber(body.deals_done) || 0,
    proof_of_funds_available: Boolean(body.proof_of_funds_available),
    licensed_agent: Boolean(body.licensed_agent),
    contractor_license: cleanText(body.contractor_license, 120),
    notes: cleanText(body.notes, 1200),
    updated_at: new Date().toISOString(),
  };

  payload.profile_complete = isComplete(payload);

  if (payload.profile_complete) {
    payload.profile_completed_at = new Date().toISOString();
    payload.member_status = "pending_payment";
    payload.access_level = "profile_only";
    payload.payment_status = payload.payment_status || "unpaid";
  } else {
    payload.member_status = "profile_required";
    payload.access_level = "locked";
    payload.payment_status = "unpaid";
  }

  const res = await fetch(`${config.url}/rest/v1/vf_members?on_conflict=email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: config.key,
      Authorization: `Bearer ${config.key}`,
      Prefer: "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    return NextResponse.json(
      { error: "Failed to save profile.", details: await res.text() },
      { status: 500 }
    );
  }

  const saved = await res.json();

  return NextResponse.json({
    ok: true,
    profile: saved?.[0] || null,
    profile_complete: payload.profile_complete,
    next_required_step: payload.profile_complete ? "payment_required" : "profile_required",
  });
}
