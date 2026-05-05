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
    throw new Error("Missing Supabase environment values.");
  }

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function cleanEmail(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

function normalizePhotos(value: any): string[] {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);

  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
    } catch {
      return [value.trim()];
    }
    return [value.trim()];
  }

  return [];
}

function normalizeDeal(row: any) {
  if (!row) return null;

  const photos = normalizePhotos(row.photo_urls);
  const main = row.main_photo_url || photos[0] || "";

  return {
    ...row,
    photo_urls: main && !photos.includes(main) ? [main, ...photos] : photos,
    main_photo_url: main,
  };
}

export async function GET(request: Request) {
  try {
    const email =
      cleanEmail(request.headers.get("x-vf-email")) ||
      cleanEmail(new URL(request.url).searchParams.get("email")) ||
      "text@text.com";

    const supabase = supabaseClient();

    const { data: bucketRows, error } = await supabase
      .from("vf_buy_bucket")
      .select("*")
      .or(`buyer_email.eq.${email},member_email.eq.${email}`)
      .eq("archived", false)
      .eq("deleted", false)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      return NextResponse.json({ error: error.message, details: error }, { status: 500 });
    }

    const ids = Array.from(
      new Set((bucketRows || []).map((row: any) => row.deal_id).filter(Boolean))
    );

    if (ids.length === 0) {
      return NextResponse.json({ ok: true, deals: [] });
    }

    const { data: deals, error: dealError } = await supabase
      .from("vf_deals")
      .select("*")
      .in("id", ids);

    if (dealError) {
      return NextResponse.json({ error: dealError.message, details: dealError }, { status: 500 });
    }

    const dealMap = new Map((deals || []).map((deal: any) => [deal.id, normalizeDeal(deal)]));

    const merged = (bucketRows || [])
      .map((row: any) => ({
        ...row,
        deal: dealMap.get(row.deal_id) || null,
      }))
      .filter((row: any) => row.deal);

    return NextResponse.json({ ok: true, deals: merged });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Could not load Buy Bucket.", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}
