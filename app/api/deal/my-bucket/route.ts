import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

function getEmail(request: Request) {
  const u = new URL(request.url);
  return (
    request.headers.get("x-vf-email") ||
    request.headers.get("x-email") ||
    u.searchParams.get("email") ||
    ""
  ).trim().toLowerCase();
}

function photosFrom(deal: any): string[] {
  const raw = deal?.photo_urls ?? deal?.photos ?? deal?.image_urls ?? [];
  let arr: string[] = [];
  if (Array.isArray(raw)) arr = raw;
  else if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      arr = Array.isArray(parsed) ? parsed : raw ? [raw] : [];
    } catch {
      arr = raw ? [raw] : [];
    }
  }
  if (deal?.main_photo_url && !arr.includes(deal.main_photo_url)) arr.unshift(deal.main_photo_url);
  return arr.filter(Boolean);
}

export async function GET(request: Request) {
  try {
    const supabase = getSupabase();
    const email = getEmail(request);

    let bucketQuery = supabase
      .from("vf_buy_bucket")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (email) {
      bucketQuery = bucketQuery.or(`buyer_email.eq.${email},member_email.eq.${email}`);
    }

    const { data: bucketRows, error: bucketError } = await bucketQuery;
    if (bucketError) {
      return NextResponse.json({ ok: false, error: bucketError.message }, { status: 500 });
    }

    const rows = Array.isArray(bucketRows) ? bucketRows : [];
    const ids = Array.from(new Set(rows.map((r: any) => r.deal_id).filter(Boolean)));

    let dealsById: Record<string, any> = {};
    if (ids.length) {
      const { data: deals, error: dealsError } = await supabase
        .from("vf_deals")
        .select("*")
        .in("id", ids);

      if (dealsError) {
        return NextResponse.json({ ok: false, error: dealsError.message }, { status: 500 });
      }

      dealsById = Object.fromEntries((deals || []).map((d: any) => [String(d.id), d]));
    }

    const items = rows.map((row: any) => {
      const deal = dealsById[String(row.deal_id)] || {};
      return {
        ...row,
        deal_id: row.deal_id,
        deal: { ...deal, photo_urls: photosFrom(deal) },
        id: deal.id || row.deal_id || row.id,
        title: deal.title || deal.deal_title || "Untitled Deal",
        city: deal.city || "Unknown City",
        state: deal.state || "Unknown State",
        property_type: deal.property_type || "Deal",
        strategy: deal.strategy || "Strategy Needed",
        asking_price: deal.asking_price || deal.price || null,
        arv: deal.arv || null,
        repairs: deal.repairs || deal.repair_estimate || null,
        photo_urls: photosFrom(deal),
        main_photo_url: deal.main_photo_url || photosFrom(deal)[0] || "",
        created_at: row.created_at,
      };
    });

    return NextResponse.json({ ok: true, items, deals: items });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Failed to load buy bucket." }, { status: 500 });
  }
}
