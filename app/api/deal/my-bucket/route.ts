import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function supabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    "";

  if (!url || !key) throw new Error("Missing Supabase environment variables.");

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function getEmail(request: Request) {
  const url = new URL(request.url);
  return String(
    request.headers.get("x-vf-email") ||
      url.searchParams.get("email") ||
      ""
  ).trim().toLowerCase();
}

export async function GET(request: Request) {
  try {
    const db = supabase();
    const email = getEmail(request);

    let bucketQuery = db
      .from("vf_buy_bucket")
      .select("id, buyer_email, deal_id, status, created_at")
      .order("created_at", { ascending: false });

    if (email) {
      bucketQuery = bucketQuery.eq("buyer_email", email);
    }

    const { data: bucketRows, error: bucketError } = await bucketQuery;

    if (bucketError) {
      return NextResponse.json({ ok: false, error: bucketError.message }, { status: 500 });
    }

    const rows = bucketRows || [];
    const ids = Array.from(new Set(rows.map((row: any) => row.deal_id).filter(Boolean)));

    if (ids.length === 0) {
      return NextResponse.json({ ok: true, items: [] });
    }

    const { data: deals, error: dealsError } = await db
      .from("vf_deals")
      .select("*")
      .in("id", ids);

    if (dealsError) {
      return NextResponse.json({ ok: false, error: dealsError.message }, { status: 500 });
    }

    const dealById = new Map((deals || []).map((deal: any) => [deal.id, deal]));
    const items = rows.map((row: any) => ({ ...row, deal: dealById.get(row.deal_id) || null }));

    return NextResponse.json({ ok: true, items });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || "Could not load buy bucket." }, { status: 500 });
  }
}
