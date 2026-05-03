import { NextResponse } from "next/server";
import { analyzeDeal } from "../../../lib/vaultforge-ai";
import { matchDealToMembers } from "../../../lib/vaultforge-routing";

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
const ALLOWED_STRATEGIES = ["Fix & Flip", "Rental", "Wholesale", "Development"];

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  if (!url || !key) return null;
  return { url, key };
}

function getCookieValue(cookieHeader: string, name: string) {
  const parts = cookieHeader.split(";").map((part) => part.trim());
  const found = parts.find((part) => part.startsWith(`${name}=`));
  if (!found) return "";
  return decodeURIComponent(found.slice(name.length + 1));
}

function cleanText(value: unknown, max = 700) {
  return String(value || "").trim().slice(0, max);
}

function cleanNumber(value: unknown) {
  const raw = String(value ?? "").replace(/,/g, "").trim();
  if (!raw) return null;
  const num = Number(raw);
  if (Number.isNaN(num)) return null;
  return num;
}

export async function POST(req: Request) {
  const config = getSupabaseConfig();

  if (!config) {
    return NextResponse.json(
      { error: "Supabase environment variables are missing." },
      { status: 500 }
    );
  }

  const cookieHeader = req.headers.get("cookie") || "";
  const ownerEmail =
    getCookieValue(cookieHeader, "vf_user") ||
    getCookieValue(cookieHeader, "vf_email");

  if (!ownerEmail) {
    return NextResponse.json({ error: "Not logged in." }, { status: 401 });
  }

  const body = await req.json();

  const title = cleanText(body?.title, 140);
  const state = cleanText(body?.state, 80);
  const property_type = cleanText(body?.property_type, 80);
  const strategy = cleanText(body?.strategy, 80);
  const price = cleanNumber(body?.price);
  const description = cleanText(body?.description, 900);

  if (!title) return NextResponse.json({ error: "Title is required." }, { status: 400 });
  if (!ALLOWED_STATES.includes(state)) {
    return NextResponse.json({ error: "Valid state is required." }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(property_type)) {
    return NextResponse.json({ error: "Valid property type is required." }, { status: 400 });
  }
  if (strategy && !ALLOWED_STRATEGIES.includes(strategy)) {
    return NextResponse.json({ error: "Valid strategy is required." }, { status: 400 });
  }

  const ai = analyzeDeal({ title, state, property_type, strategy, price, description });

  const payload = {
    owner_email: ownerEmail.toLowerCase(),
    title,
    state,
    property_type,
    strategy,
    price,
    description,
    status: "active",
    archived: false,
    ai_summary: ai.ai_summary,
  };

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
    const details = await res.text();
    return NextResponse.json({ error: "Failed to save deal.", details }, { status: 500 });
  }

  const saved = await res.json();
  const deal = saved?.[0] || null;

  let routing = { ok: true, matched: 0 };
  if (deal?.id) {
    routing = await matchDealToMembers(deal);
  }

  return NextResponse.json({ ok: true, deal, ai, routing });
}
