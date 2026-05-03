import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function env() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return { url, key };
}

export async function POST(req: Request) {
  try {
    const { url, key } = env();
    if (!url || !key) {
      return NextResponse.json({ error: "Supabase environment variables are missing." }, { status: 500 });
    }

    const body = await req.json();
    const dealId = String(body.deal_id || "").trim();
    const email = String(body.email || "").trim().toLowerCase();

    if (!dealId || !email) {
      return NextResponse.json({ error: "Missing deal_id or email." }, { status: 400 });
    }

    const payload = {
      deal_id: dealId,
      member_email: email,
    };

    const insertRes = await fetch(`${url}/rest/v1/vf_buy_bucket`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: key,
        Authorization: `Bearer ${key}`,
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    if (!insertRes.ok) {
      const text = await insertRes.text();
      return NextResponse.json({ error: text || "Failed to save deal to bucket." }, { status: 500 });
    }

    await fetch(`${url}/rest/v1/vf_deals?id=eq.${encodeURIComponent(dealId)}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        apikey: key,
        Authorization: `Bearer ${key}`,
        Prefer: "return=minimal",
      },
      body: JSON.stringify({}),
      cache: "no-store",
    }).catch(() => null);

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: "Unexpected bucket error." }, { status: 500 });
  }
}
