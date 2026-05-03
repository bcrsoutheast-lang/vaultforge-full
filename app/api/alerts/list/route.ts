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
      { error: "Supabase environment variables are missing.", alerts: [] },
      { status: 500 }
    );
  }

  const cookieHeader = req.headers.get("cookie") || "";
  const memberEmail =
    getCookieValue(cookieHeader, "vf_user") ||
    getCookieValue(cookieHeader, "vf_email");

  if (!memberEmail) {
    return NextResponse.json({ error: "Not logged in.", alerts: [] }, { status: 401 });
  }

  const headers = {
    apikey: config.key,
    Authorization: `Bearer ${config.key}`,
  };

  const matchUrl =
    `${config.url}/rest/v1/vf_match_alerts` +
    `?select=id,deal_id,deal_title,deal_state,deal_property_type,deal_strategy,match_role,alert_title,alert_message,read,created_at` +
    `&member_email=eq.${encodeURIComponent(memberEmail.toLowerCase())}` +
    `&order=created_at.desc` +
    `&limit=25`;

  const bucketUrl =
    `${config.url}/rest/v1/vf_buy_bucket` +
    `?select=deal_id,created_at` +
    `&member_email=eq.${encodeURIComponent(memberEmail)}` +
    `&order=created_at.desc` +
    `&limit=10`;

  const [matchRes, bucketRes] = await Promise.all([
    fetch(matchUrl, { method: "GET", headers, cache: "no-store" }),
    fetch(bucketUrl, { method: "GET", headers, cache: "no-store" }),
  ]);

  const alerts: any[] = [];

  if (matchRes.ok) {
    const rows = await matchRes.json();
    for (const row of rows) {
      alerts.push({
        id: `match-${row.id}`,
        type: "Match Alert",
        title: row.alert_title || `Matched deal: ${row.deal_title}`,
        message: row.alert_message || "A deal matched your buy box.",
        href: "/projects",
        created_at: row.created_at,
      });
    }
  }

  if (bucketRes.ok) {
    const rows = await bucketRes.json();
    for (const row of rows) {
      alerts.push({
        id: `bucket-${row.deal_id}-${row.created_at}`,
        type: "Buy Bucket",
        title: "Deal saved to Buy Bucket",
        message: "You added an opportunity to your Buy Bucket for tracking.",
        href: "/buy-bucket",
        created_at: row.created_at,
      });
    }
  }

  alerts.sort((a, b) => {
    const aTime = new Date(a.created_at || 0).getTime();
    const bTime = new Date(b.created_at || 0).getTime();
    return bTime - aTime;
  });

  return NextResponse.json({ alerts: alerts.slice(0, 30) });
}
