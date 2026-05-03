import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

export async function GET(req: Request) {
  const config = getSupabaseConfig();

  if (!config) {
    return NextResponse.json(
      { error: "Supabase environment variables are missing.", deals: [] },
      { status: 500 }
    );
  }

  const cookieHeader = req.headers.get("cookie") || "";
  const memberEmail =
    getCookieValue(cookieHeader, "vf_user") ||
    getCookieValue(cookieHeader, "vf_email");

  if (!memberEmail) {
    return NextResponse.json({ error: "Not logged in.", deals: [] }, { status: 401 });
  }

  const headers = {
    apikey: config.key,
    Authorization: `Bearer ${config.key}`,
  };

  const bucketUrl =
    `${config.url}/rest/v1/vf_buy_bucket` +
    `?select=deal_id,created_at` +
    `&member_email=eq.${encodeURIComponent(memberEmail)}` +
    `&order=created_at.desc`;

  const bucketRes = await fetch(bucketUrl, {
    method: "GET",
    headers,
    cache: "no-store",
  });

  if (!bucketRes.ok) {
    const details = await bucketRes.text();
    return NextResponse.json(
      { error: "Failed to load buy bucket.", details, deals: [] },
      { status: 500 }
    );
  }

  const bucketRows = await bucketRes.json();

  const ids = Array.from(
    new Set(
      bucketRows
        .map((row: any) => String(row.deal_id || "").trim())
        .filter(Boolean)
    )
  );

  if (ids.length === 0) {
    return NextResponse.json({ deals: [] });
  }

  const dealsUrl =
    `${config.url}/rest/v1/vf_deals` +
    `?select=*` +
    `&id=in.(${ids.join(",")})` +
    `&archived=eq.false`;

  const dealsRes = await fetch(dealsUrl, {
    method: "GET",
    headers,
    cache: "no-store",
  });

  if (!dealsRes.ok) {
    const details = await dealsRes.text();
    return NextResponse.json(
      { error: "Failed to load saved deals.", details, deals: [] },
      { status: 500 }
    );
  }

  const deals = await dealsRes.json();

  const order = new Map<string, number>();
  ids.forEach((id: string, index: number) => {
    order.set(id, index);
  });

  deals.sort((a: any, b: any) => {
    const aIndex = order.get(String(a.id)) ?? 9999;
    const bIndex = order.get(String(b.id)) ?? 9999;
    return aIndex - bIndex;
  });

  return NextResponse.json({ deals });
}
