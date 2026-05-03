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
      { error: "Supabase environment variables are missing.", profile: null },
      { status: 500 }
    );
  }

  const cookieHeader = req.headers.get("cookie") || "";
  const email =
    getCookieValue(cookieHeader, "vf_user") ||
    getCookieValue(cookieHeader, "vf_email");

  if (!email) {
    return NextResponse.json({ error: "Not logged in.", profile: null }, { status: 401 });
  }

  const url =
    `${config.url}/rest/v1/vf_members` +
    `?select=*` +
    `&email=eq.${encodeURIComponent(email.toLowerCase())}` +
    `&limit=1`;

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
      { error: "Failed to load profile.", details, profile: null },
      { status: 500 }
    );
  }

  const rows = await res.json();
  return NextResponse.json({ profile: rows?.[0] || null, email });
}
