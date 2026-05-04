import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function config() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  if (!url || !key) return null;
  return { url, key };
}

export async function GET(req: Request) {
  const c = config();
  if (!c) return NextResponse.json({ error: "Supabase environment variables are missing." }, { status: 500 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id") || "";
  if (!id) return NextResponse.json({ error: "Deal id is required." }, { status: 400 });

  const url = `${c.url}/rest/v1/vf_deals?select=*&id=eq.${encodeURIComponent(id)}&limit=1`;

  const res = await fetch(url, {
    headers: { apikey: c.key, Authorization: `Bearer ${c.key}` },
    cache: "no-store",
  });

  if (!res.ok) return NextResponse.json({ error: "Failed to load deal.", details: await res.text() }, { status: 500 });

  const rows = await res.json();
  return NextResponse.json({ deal: rows?.[0] || null });
}
