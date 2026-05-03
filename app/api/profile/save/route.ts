import { NextResponse } from "next/server";
import { getSessionEmailFromRequest } from "../../../lib/vaultforge-session";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const ALLOWED_STATES = ["Georgia", "Tennessee", "Florida", "North Carolina", "South Carolina", "Texas"];
const ALLOWED_ROLES = ["Buyer", "Lender", "Contractor", "Developer", "Partner"];
const ALLOWED_TYPES = ["Residential", "Commercial", "Land"];
const ALLOWED_STRATEGIES = ["Fix & Flip", "Rental", "Wholesale", "Development"];

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  if (!url || !key) return null;
  return { url, key };
}

function cleanArray(value: unknown, allowed: string[]) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item || "").trim()).filter((item) => allowed.includes(item));
}

function cleanText(value: unknown, max = 500) {
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

  const email = getSessionEmailFromRequest(req);
  if (!email) return NextResponse.json({ error: "Not logged in." }, { status: 401 });

  const body = await req.json();
  const name = cleanText(body?.name, 120);
  const company = cleanText(body?.company, 160);
  const role = cleanText(body?.role, 80);
  const state = cleanText(body?.state, 80);
  const bio = cleanText(body?.bio, 800);
  const buy_box_states = cleanArray(body?.buy_box_states, ALLOWED_STATES);
  const buy_box_types = cleanArray(body?.buy_box_types, ALLOWED_TYPES);
  const buy_box_strategies = cleanArray(body?.buy_box_strategies, ALLOWED_STRATEGIES);
  const min_price = cleanNumber(body?.min_price);
  const max_price = cleanNumber(body?.max_price);

  if (!name) return NextResponse.json({ error: "Name is required." }, { status: 400 });
  if (!ALLOWED_ROLES.includes(role)) return NextResponse.json({ error: "Valid role is required." }, { status: 400 });
  if (!ALLOWED_STATES.includes(state)) return NextResponse.json({ error: "Valid state is required." }, { status: 400 });

  const payload = {
    name,
    email,
    state,
    role,
    company,
    bio,
    buy_box_states: buy_box_states.length ? buy_box_states : [state],
    buy_box_types,
    buy_box_strategies,
    min_price,
    max_price,
    is_active: true,
  };

  const res = await fetch(`${config.url}/rest/v1/vf_members?on_conflict=email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: config.key,
      Authorization: `Bearer ${config.key}`,
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) return NextResponse.json({ error: "Failed to save profile.", details: await res.text() }, { status: 500 });

  return NextResponse.json({ ok: true });
}
