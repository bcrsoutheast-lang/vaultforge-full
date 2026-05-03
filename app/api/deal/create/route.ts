import { NextResponse } from "next/server";
import { analyzeDeal } from "../../../lib/vaultforge-ai";
import { matchDealToMembers } from "../../../lib/vaultforge-routing";
import { getSessionEmailFromRequest } from "../../../lib/vaultforge-session";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const ALLOWED_STATES = ["Georgia", "Tennessee", "Florida", "North Carolina", "South Carolina", "Texas"];
const ALLOWED_TYPES = ["Residential", "Commercial", "Land"];
const ALLOWED_STRATEGIES = ["Fix & Flip", "Rental", "Wholesale", "Development"];

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  if (!url || !key) return null;
  return { url, key };
}

function cleanText(value: unknown, max = 700) {
  return String(value || "").trim().slice(0, max);
}

function cleanNumber(value: unknown) {
  const raw = String(value ?? "").replace(/,/g, "").trim();
  if (!raw) return null;
  const num = Number(raw);
  return Number.isNaN(num) ? null : num;
}

export async function POST(req: Request) {
  const config = getSupabaseConfig();
  if (!config) return NextResponse.json({ error: "Supabase environment variables are missing." }, { status: 500 });

  const ownerEmail = getSessionEmailFromRequest(req);
  if (!ownerEmail) return NextResponse.json({ error: "Not logged in." }, { status: 401 });

  const body = await req.json();
  const title = cleanText(body?.title, 140);
  const state = cleanText(body?.state, 80);
  const property_type = cleanText(body?.property_type, 80);
  const strategy = cleanText(body?.strategy, 80);
  const price = cleanNumber(body?.price);
  const description = cleanText(body?.description, 900);

  if (!title) return NextResponse.json({ error: "Title is required." }, { status: 400 });
  if (!ALLOWED_STATES.includes(state)) return NextResponse.json({ error: "Valid state is required." }, { status: 400 });
  if (!ALLOWED_TYPES.includes(property_type)) return NextResponse.json({ error: "Valid property type is required." }, { status: 400 });
  if (strategy && !ALLOWED_STRATEGIES.includes(strategy)) return NextResponse.json({ error: "Valid strategy is required." }, { status: 400 });

  const ai = analyzeDeal({ title, state, property_type, strategy, price, description });
  const payload = {
    owner_email: ownerEmail,
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

  if (!res.ok) return NextResponse.json({ error: "Failed to save deal.", details: await res.text() }, { status: 500 });

  const saved = await res.json();
  const deal = saved?.[0] || null;
  const routing = deal?.id ? await matchDealToMembers(deal) : { ok: true, matched: 0 };

  return NextResponse.json({ ok: true, deal, ai, routing });
}
