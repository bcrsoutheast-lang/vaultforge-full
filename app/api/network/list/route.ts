import { NextResponse } from "next/server";

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

  if (!config) {
    return NextResponse.json(
      { error: "Supabase environment variables are missing.", members: [] },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(req.url);
  const state = searchParams.get("state") || "";
  const role = searchParams.get("role") || "";

  let url =
    `${config.url}/rest/v1/vf_members` +
    `?select=id,name,email,state,role,company,bio,buy_box_states,buy_box_types,buy_box_strategies,created_at` +
    `&is_active=eq.true` +
    `&order=created_at.desc`;

  if (state && state !== "All") {
    url += `&state=eq.${encodeURIComponent(state)}`;
  }

  if (role && role !== "All") {
    url += `&role=eq.${encodeURIComponent(role)}`;
  }

  const res = await fetch(url, {
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
      { error: "Failed to load network.", details, members: [] },
      { status: 500 }
    );
  }

  const members = await res.json();

  return NextResponse.json({ members });
}
