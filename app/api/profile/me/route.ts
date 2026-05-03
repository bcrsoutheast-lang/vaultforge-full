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
  if (!config) return NextResponse.json({ error: "Supabase environment variables are missing.", profile: null }, { status: 500 });

  const email = getSessionEmailFromRequest(req);
  if (!email) return NextResponse.json({ error: "Not logged in.", profile: null }, { status: 401 });

  const res = await fetch(`${config.url}/rest/v1/vf_members?select=*&email=eq.${encodeURIComponent(email)}&limit=1`, {
    headers: { apikey: config.key, Authorization: `Bearer ${config.key}` },
    cache: "no-store",
  });

  if (!res.ok) return NextResponse.json({ error: "Failed to load profile.", details: await res.text(), profile: null }, { status: 500 });

  const rows = await res.json();
  return NextResponse.json({ profile: rows?.[0] || null, email });
}
