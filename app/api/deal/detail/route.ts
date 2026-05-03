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
      { error: "Supabase environment variables are missing.", deal: null },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(req.url);
  const dealId = String(searchParams.get("deal_id") || "").trim();

  if (!dealId) {
    return NextResponse.json({ error: "Missing deal id.", deal: null }, { status: 400 });
  }

  const cookieHeader = req.headers.get("cookie") || "";
  const memberEmail =
    getCookieValue(cookieHeader, "vf_user") ||
    getCookieValue(cookieHeader, "vf_email");

  if (!memberEmail) {
    return NextResponse.json({ error: "Not logged in.", deal: null }, { status: 401 });
  }

  const dealUrl =
    `${config.url}/rest/v1/vf_deals` +
    `?select=*` +
    `&id=eq.${encodeURIComponent(dealId)}` +
    `&limit=1`;

  const res = await fetch(dealUrl, {
    method: "GET",
    headers: {
      apikey: config.key,
      Authorization: `Bearer ${config.key}`,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const details = await res.text();
    return NextResponse.json(
      { error: "Failed to load deal.", details, deal: null },
      { status: 500 }
    );
  }

  const rows = await res.json();
  const deal = rows?.[0] || null;

  if (!deal) {
    return NextResponse.json({ error: "Deal not found.", deal: null }, { status: 404 });
  }

  return NextResponse.json({
    deal,
    viewer_email: memberEmail.toLowerCase(),
    is_owner: String(deal.owner_email || "").toLowerCase() === memberEmail.toLowerCase(),
  });
}
