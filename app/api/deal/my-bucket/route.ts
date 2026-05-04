import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function supabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";
  if (!url || !key) throw new Error("Missing Supabase environment variables.");
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = request.headers.get("x-vf-email") || searchParams.get("email") || "member@vaultforge.local";
    const db = supabase();

    const { data: bucketRows, error } = await db
      .from("vf_buy_bucket")
      .select("*")
      .eq("buyer_email", email)
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const rows = bucketRows || [];
    const ids = rows.map((r: any) => r.deal_id).filter(Boolean);
    let dealsById: Record<string, any> = {};

    if (ids.length) {
      const { data: deals, error: dealError } = await db.from("vf_deals").select("*").in("id", ids);
      if (dealError) return NextResponse.json({ error: dealError.message }, { status: 500 });
      dealsById = Object.fromEntries((deals || []).map((d: any) => [d.id, d]));
    }

    const items = rows.map((row: any) => ({ ...row, deal: dealsById[row.deal_id] || null }));
    return NextResponse.json({ ok: true, items });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Could not load Buy Bucket." }, { status: 500 });
  }
}
