import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function config() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  if (!url || !key) return null;
  return { url, key };
}

export async function GET() {
  const c = config();
  if (!c) return NextResponse.json({ error: "Supabase environment variables are missing." }, { status: 500 });

  const url = `${c.url}/rest/v1/vf_deals?select=*&or=(archived.is.null,archived.eq.false)&order=created_at.desc`;

  const res = await fetch(url, {
    headers: { apikey: c.key, Authorization: `Bearer ${c.key}` },
    cache: "no-store",
  });

  if (!res.ok) return NextResponse.json({ error: "Failed to load deals.", details: await res.text() }, { status: 500 });

  return NextResponse.json({ deals: await res.json() });
}
