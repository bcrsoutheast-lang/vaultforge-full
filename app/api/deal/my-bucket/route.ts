import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function supabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";
  if (!url || !key) throw new Error("Missing Supabase environment variables.");
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

function emailFromRequest(request: Request, body: any) {
  return request.headers.get("x-vf-email") || body?.buyer_email || body?.email || "member@vaultforge.local";
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const dealId = body?.deal_id || body?.dealId || body?.id || "";
    const buyerEmail = emailFromRequest(request, body);
    if (!dealId) return NextResponse.json({ error: "Missing deal id." }, { status: 400 });

    const db = supabase();

    const { data: existing, error: existingError } = await db
      .from("vf_buy_bucket")
      .select("*")
      .eq("deal_id", dealId)
      .eq("buyer_email", buyerEmail)
      .maybeSingle();

    if (existingError && existingError.code !== "PGRST116") {
      return NextResponse.json({ error: existingError.message }, { status: 500 });
    }

    if (existing) return NextResponse.json({ ok: true, item: existing, already_saved: true });

    const { data, error } = await db
      .from("vf_buy_bucket")
      .insert({ deal_id: dealId, buyer_email: buyerEmail, status: "saved" })
      .select("*")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, item: data });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Buy Bucket save failed." }, { status: 500 });
  }
}
