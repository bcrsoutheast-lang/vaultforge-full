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

export async function POST(req: Request) {
  const config = getSupabaseConfig();
  if (!config) return NextResponse.json({ error: "Supabase environment variables are missing." }, { status: 500 });

  const email = getSessionEmailFromRequest(req);
  if (!email) return NextResponse.json({ error: "Not logged in." }, { status: 401 });

  const body = await req.json();
  const dealId = String(body?.deal_id || body?.dealId || "").trim();
  if (!dealId) return NextResponse.json({ error: "Missing deal id." }, { status: 400 });

  const res = await fetch(`${config.url}/rest/v1/vf_deals?id=eq.${encodeURIComponent(dealId)}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      apikey: config.key,
      Authorization: `Bearer ${config.key}`,
      Prefer: "return=minimal",
    },
    body: JSON.stringify({ archived: true, status: "archived" }),
  });

  if (!res.ok) return NextResponse.json({ error: "Failed to archive deal.", details: await res.text() }, { status: 500 });

  return NextResponse.json({ ok: true });
}
