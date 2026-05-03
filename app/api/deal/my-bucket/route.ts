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

export async function GET(req: Request) {
  const config = getSupabaseConfig();
  if (!config) return NextResponse.json({ error: "Supabase environment variables are missing.", deals: [] }, { status: 500 });

  const memberEmail = getSessionEmailFromRequest(req);
  if (!memberEmail) return NextResponse.json({ error: "Not logged in.", deals: [] }, { status: 401 });

  const headers = { apikey: config.key, Authorization: `Bearer ${config.key}` };
  const bucketRes = await fetch(`${config.url}/rest/v1/vf_buy_bucket?select=deal_id,created_at&member_email=eq.${encodeURIComponent(memberEmail)}&order=created_at.desc`, {
    headers,
    cache: "no-store",
  });

  if (!bucketRes.ok) return NextResponse.json({ error: "Failed to load buy bucket.", details: await bucketRes.text(), deals: [] }, { status: 500 });

  const bucketRows = await bucketRes.json();
  const ids = Array.from(new Set(bucketRows.map((row: any) => String(row.deal_id || "").trim()).filter(Boolean)));
  if (ids.length === 0) return NextResponse.json({ deals: [] });

  const dealsRes = await fetch(`${config.url}/rest/v1/vf_deals?select=*&id=in.(${ids.join(",")})&archived=eq.false`, {
    headers,
    cache: "no-store",
  });

  if (!dealsRes.ok) return NextResponse.json({ error: "Failed to load saved deals.", details: await dealsRes.text(), deals: [] }, { status: 500 });

  const deals = await dealsRes.json();
  const order = new Map<string, number>();
  ids.forEach((id: any, index) => order.set(String(id), index));
  deals.sort((a: any, b: any) => (order.get(String(a.id)) ?? 9999) - (order.get(String(b.id)) ?? 9999));

  return NextResponse.json({ deals });
}
