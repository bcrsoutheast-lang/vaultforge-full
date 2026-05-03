import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return NextResponse.json({ error: "Supabase environment variables are missing." }, { status: 500 });
  }

  const requestUrl = new URL(req.url);
  const email = String(requestUrl.searchParams.get("email") || "").trim().toLowerCase();

  if (!email) {
    return NextResponse.json({ deals: [] });
  }

  const bucketRes = await fetch(
    `${url}/rest/v1/vf_buy_bucket?member_email=eq.${encodeURIComponent(email)}&select=deal_id,created_at&order=created_at.desc`,
    {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
      cache: "no-store",
    }
  );

  if (!bucketRes.ok) {
    const text = await bucketRes.text();
    return NextResponse.json({ error: text || "Failed to load buy bucket." }, { status: 500 });
  }

  const bucketRows = await bucketRes.json();
  const ids = bucketRows.map((row: any) => row.deal_id).filter(Boolean);

  if (!ids.length) {
    return NextResponse.json({ deals: [] });
  }

  const idList = ids.map((id: string) => `"${id}"`).join(",");
  const dealsRes = await fetch(
    `${url}/rest/v1/vf_deals?id=in.(${encodeURIComponent(idList)})&archived=eq.false&select=*`,
    {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
      cache: "no-store",
    }
  );

  if (!dealsRes.ok) {
    const text = await dealsRes.text();
    return NextResponse.json({ error: text || "Failed to load saved deals." }, { status: 500 });
  }

  const deals = await dealsRes.json();
  const order = new Map(ids.map((id: string, index: number) => [id, index]));
  deals.sort((a: any, b: any) => (order.get(a.id) ?? 9999) - (order.get(b.id) ?? 9999));

  return NextResponse.json({ deals });
}
