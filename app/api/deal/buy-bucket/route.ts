import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

function getEmail(request: Request, body: any) {
  return (
    request.headers.get("x-vf-email") ||
    request.headers.get("x-email") ||
    body?.buyer_email ||
    body?.member_email ||
    body?.email ||
    ""
  ).trim().toLowerCase();
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const dealId = body?.deal_id || body?.dealId || body?.id;
    const email = getEmail(request, body);

    if (!dealId) return NextResponse.json({ ok: false, error: "Missing deal_id." }, { status: 400 });
    if (!email) return NextResponse.json({ ok: false, error: "Missing member email. Log in again." }, { status: 400 });

    const supabase = getSupabase();

    const { data: existing } = await supabase
      .from("vf_buy_bucket")
      .select("*")
      .eq("deal_id", dealId)
      .or(`buyer_email.eq.${email},member_email.eq.${email}`)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ ok: true, alreadySaved: true, item: existing, message: "Already saved." });
    }

    const payload = {
      deal_id: dealId,
      buyer_email: email,
      member_email: email,
      status: "saved",
    };

    const { data, error } = await supabase.from("vf_buy_bucket").insert(payload).select("*").single();

    if (error) {
      if ((error.message || "").toLowerCase().includes("duplicate")) {
        return NextResponse.json({ ok: true, alreadySaved: true, message: "Already saved." });
      }
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, item: data, message: "Saved to Buy Bucket." });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Failed to save deal." }, { status: 500 });
  }
}
