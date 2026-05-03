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
  if (!config) return NextResponse.json({ error: "Supabase environment variables are missing.", deal: null }, { status: 500 });

  const viewerEmail = getSessionEmailFromRequest(req);
  if (!viewerEmail) return NextResponse.json({ error: "Not logged in.", deal: null }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const dealId = String(searchParams.get("deal_id") || "").trim();
  if (!dealId) return NextResponse.json({ error: "Missing deal id.", deal: null }, { status: 400 });

  const res = await fetch(`${config.url}/rest/v1/vf_deals?select=*&id=eq.${encodeURIComponent(dealId)}&limit=1`, {
    headers: { apikey: config.key, Authorization: `Bearer ${config.key}` },
    cache: "no-store",
  });

  if (!res.ok) return NextResponse.json({ error: "Failed to load deal.", details: await res.text(), deal: null }, { status: 500 });

  const rows = await res.json();
  const deal = rows?.[0] || null;
  if (!deal) return NextResponse.json({ error: "Deal not found.", deal: null }, { status: 404 });

  return NextResponse.json({
    deal,
    viewer_email: viewerEmail,
    is_owner: String(deal.owner_email || "").toLowerCase() === viewerEmail,
  });
}
