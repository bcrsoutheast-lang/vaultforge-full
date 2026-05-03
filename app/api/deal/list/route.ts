import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type DealRow = {
  id: string;
  owner_email: string;
  title: string;
  state: string;
  property_type: string;
  strategy: string | null;
  price: number | null;
  description: string | null;
  status: string;
  archived: boolean;
  buy_bucket_count: number | null;
  ai_summary: string | null;
  created_at: string;
};

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return null;
  }

  return { url, key };
}

export async function GET() {
  const userEmail = cookies().get("vf_user")?.value || "";

  if (!userEmail) {
    return NextResponse.json({ error: "Not logged in", deals: [] }, { status: 401 });
  }

  const config = getSupabaseConfig();

  if (!config) {
    return NextResponse.json(
      { error: "Supabase keys are missing in Vercel.", deals: [] },
      { status: 500 }
    );
  }

  const query = new URL(`${config.url}/rest/v1/vf_deals`);
  query.searchParams.set("select", "*");
  query.searchParams.set("owner_email", `eq.${userEmail}`);
  query.searchParams.set("archived", "eq.false");
  query.searchParams.set("order", "created_at.desc");

  const response = await fetch(query.toString(), {
    method: "GET",
    headers: {
      apikey: config.key,
      Authorization: `Bearer ${config.key}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    return NextResponse.json(
      { error: errorText || "Failed to load deals.", deals: [] },
      { status: response.status }
    );
  }

  const deals = (await response.json()) as DealRow[];

  return NextResponse.json({ deals });
}
