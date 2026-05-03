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

export async function POST(req: Request) {
  const config = getSupabaseConfig();

  if (!config) {
    return NextResponse.json(
      { error: "Supabase environment variables are missing." },
      { status: 500 }
    );
  }

  const body = await req.json();
  const dealId = String(body?.deal_id || body?.dealId || "").trim();

  if (!dealId) {
    return NextResponse.json({ error: "Missing deal id." }, { status: 400 });
  }

  const cookieHeader = req.headers.get("cookie") || "";
  const memberEmail =
    getCookieValue(cookieHeader, "vf_user") ||
    getCookieValue(cookieHeader, "vf_email");

  if (!memberEmail) {
    return NextResponse.json({ error: "Not logged in." }, { status: 401 });
  }

  const res = await fetch(`${config.url}/rest/v1/vf_buy_bucket`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: config.key,
      Authorization: `Bearer ${config.key}`,
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      member_email: memberEmail,
      deal_id: dealId,
    }),
  });

  if (res.ok) {
    return NextResponse.json({ ok: true, status: "saved" });
  }

  const details = await res.text();

  if (details.includes("23505") || details.toLowerCase().includes("duplicate key")) {
    return NextResponse.json({ ok: true, status: "already_saved" });
  }

  return NextResponse.json(
    { error: "Failed to add to Buy Bucket.", details },
    { status: 500 }
  );
}
