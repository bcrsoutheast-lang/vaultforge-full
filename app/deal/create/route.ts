import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const ALLOWED_STATES = [
  "Georgia",
  "Tennessee",
  "Florida",
  "North Carolina",
  "South Carolina",
  "Texas",
];

const ALLOWED_TYPES = ["Residential", "Commercial", "Land"];
const ALLOWED_STRATEGIES = ["Fix & Flip", "Rental", "Wholesale", "Development", "Buy Box"];

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  if (!url || !key) return null;

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function cleanText(value: unknown, max = 500) {
  return String(value || "").trim().slice(0, max);
}

export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const ownerEmail = cookieStore.get("vf_user")?.value || "";

    if (!ownerEmail) {
      return NextResponse.json({ ok: false, error: "Not logged in." }, { status: 401 });
    }

    const body = await request.json();

    const title = cleanText(body.title, 120);
    const state = cleanText(body.state, 40);
    const propertyType = cleanText(body.property_type, 40);
    const strategy = cleanText(body.strategy, 40);
    const description = cleanText(body.description, 1200);
    const rawPrice = String(body.price || "").replace(/[^0-9.]/g, "");
    const price = rawPrice ? Number(rawPrice) : null;

    if (!title) {
      return NextResponse.json({ ok: false, error: "Title is required." }, { status: 400 });
    }

    if (!ALLOWED_STATES.includes(state)) {
      return NextResponse.json({ ok: false, error: "Choose a valid state." }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(propertyType)) {
      return NextResponse.json({ ok: false, error: "Choose a valid property type." }, { status: 400 });
    }

    if (strategy && !ALLOWED_STRATEGIES.includes(strategy)) {
      return NextResponse.json({ ok: false, error: "Choose a valid strategy." }, { status: 400 });
    }

    if (price !== null && (!Number.isFinite(price) || price < 0)) {
      return NextResponse.json({ ok: false, error: "Enter a valid price." }, { status: 400 });
    }

    const supabase = getSupabase();

    if (!supabase) {
      return NextResponse.json(
        { ok: false, error: "Supabase environment variables are missing." },
        { status: 500 }
      );
    }

    const aiSummaryParts = [
      `${propertyType} opportunity in ${state}`,
      strategy ? `strategy: ${strategy}` : "strategy: needs review",
      price ? `listed around $${price.toLocaleString()}` : "price not provided",
    ];

    const { data, error } = await supabase
      .from("vf_deals")
      .insert({
        owner_email: ownerEmail,
        title,
        state,
        property_type: propertyType,
        strategy: strategy || null,
        price,
        description: description || null,
        status: "active",
        archived: false,
        ai_summary: aiSummaryParts.join(" • "),
      })
      .select("id")
      .single();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, id: data?.id });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Unknown server error." },
      { status: 500 }
    );
  }
}
