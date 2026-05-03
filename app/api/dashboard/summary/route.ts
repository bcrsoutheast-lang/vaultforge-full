import { NextResponse } from "next/server";
import { getSessionEmailFromRequest } from "../../../lib/vaultforge-session";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  if (!url || !key) return null;
  return { url, key };
}

async function safeCount(url: string, key: string) {
  const res = await fetch(url, {
    method: "GET",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Prefer: "count=exact",
    },
    cache: "no-store",
  });

  if (!res.ok) return 0;

  const range = res.headers.get("content-range") || "";
  const total = range.split("/")[1];
  const num = Number(total);
  return Number.isNaN(num) ? 0 : num;
}

export async function GET(req: Request) {
  const config = getSupabaseConfig();

  if (!config) {
    return NextResponse.json(
      { error: "Supabase environment variables are missing." },
      { status: 500 }
    );
  }

  const email = getSessionEmailFromRequest(req);

  if (!email) {
    return NextResponse.json({ error: "Not logged in." }, { status: 401 });
  }

  const headers = {
    apikey: config.key,
    Authorization: `Bearer ${config.key}`,
  };

  const profileUrl =
    `${config.url}/rest/v1/vf_members?select=id,email&email=eq.${encodeURIComponent(email)}&limit=1`;

  const profileRes = await fetch(profileUrl, { headers, cache: "no-store" });
  const profileRows = profileRes.ok ? await profileRes.json() : [];
  const profileComplete = Array.isArray(profileRows) && profileRows.length > 0;

  const activeDealsUrl = `${config.url}/rest/v1/vf_deals?select=id&archived=eq.false`;
  const myDealsUrl = `${config.url}/rest/v1/vf_deals?select=id&owner_email=eq.${encodeURIComponent(email)}&archived=eq.false`;
  const bucketUrl = `${config.url}/rest/v1/vf_buy_bucket?select=id&member_email=eq.${encodeURIComponent(email)}`;
  const matchAlertsUrl = `${config.url}/rest/v1/vf_match_alerts?select=id&member_email=eq.${encodeURIComponent(email)}&read=eq.false`;
  const messagesUrl = `${config.url}/rest/v1/vf_messages?select=id&or=(sender_email.eq.${encodeURIComponent(email)},recipient_email.eq.${encodeURIComponent(email)})&archived=eq.false`;
  const membersUrl = `${config.url}/rest/v1/vf_members?select=id&is_active=eq.true`;

  const [activeDeals, myDeals, buyBucket, alerts, messages, members] = await Promise.all([
    safeCount(activeDealsUrl, config.key),
    safeCount(myDealsUrl, config.key),
    safeCount(bucketUrl, config.key),
    safeCount(matchAlertsUrl, config.key),
    safeCount(messagesUrl, config.key),
    safeCount(membersUrl, config.key),
  ]);

  return NextResponse.json({
    email,
    profileComplete,
    counts: { activeDeals, myDeals, buyBucket, alerts, messages, members },
  });
}
