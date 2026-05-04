import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  if (!url || !key) return null;
  return { url, key };
}

function getEmail(req: Request) {
  const headerEmail =
    req.headers.get("x-vf-email") ||
    req.headers.get("x-vf-user-email") ||
    req.headers.get("x-vaultforge-email") ||
    "";

  if (headerEmail && headerEmail.includes("@")) {
    return headerEmail.trim().toLowerCase();
  }

  return "";
}

export async function GET(req: Request) {
  const config = getSupabaseConfig();

  if (!config) {
    return NextResponse.json(
      { error: "Supabase environment variables are missing.", profile: null },
      { status: 500 }
    );
  }

  const email = getEmail(req);

  if (!email) {
    return NextResponse.json(
      { error: "Not logged in.", profile: null },
      { status: 401 }
    );
  }

  const url =
    `${config.url}/rest/v1/vf_members` +
    `?select=*` +
    `&email=eq.${encodeURIComponent(email)}` +
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
    return NextResponse.json(
      { error: "Failed to load profile.", details: await res.text(), profile: null },
      { status: 500 }
    );
  }

  const rows = await res.json();

  return NextResponse.json({
    email,
    profile: rows?.[0] || null,
  });
}
