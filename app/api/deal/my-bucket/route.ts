import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function supabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    "";

  if (!url || !key) {
    throw new Error("Missing Supabase environment variables.");
  }

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function cleanEmail(value: string | null) {
  return String(value || "").trim().toLowerCase();
}

export async function GET(request: Request) {
  try {
    const supabase = supabaseClient();
    const email = cleanEmail(
      request.headers.get("x-vf-email") ||
        request.headers.get("x-email") ||
        request.headers.get("x-member-email")
    );

    let bucketQuery = supabase
      .from("vf_buy_bucket")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (email) {
      bucketQuery = bucketQuery.or(`buyer_email.eq.${email},member_email.eq.${email},owner_email.eq.${email}`);
    }

    const { data: bucketRows, error: bucketError } = await bucketQuery;

    if (bucketError) {
      return NextResponse.json({ ok: false, error: bucketError.message }, { status: 500 });
    }

    const rows = Array.isArray(bucketRows) ? bucketRows : [];
    const dealIds = Array.from(
      new Set(rows.map((row: any) => String(row.deal_id || "").trim()).filter(Boolean))
    );

    let dealsById: Record<string, any> = {};

    if (dealIds.length > 0) {
      const { data: deals, error: dealsError } = await supabase
        .from("vf_deals")
        .select("*")
        .in("id", dealIds);

      if (dealsError) {
        return NextResponse.json({ ok: false, error: dealsError.message }, { status: 500 });
      }

      for (const deal of deals || []) {
        dealsById[String((deal as any).id)] = deal;
      }
    }

    const merged = rows.map((row: any) => {
      const dealId = String(row.deal_id || "");
      const deal = dealsById[dealId] || null;
      return {
        ...row,
        bucket_id: row.id,
        deal_id: dealId,
        deal,
      };
    });

    return NextResponse.json({ ok: true, email, items: merged, deals: merged, count: merged.length });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: "Failed to load Buy Bucket.", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}
