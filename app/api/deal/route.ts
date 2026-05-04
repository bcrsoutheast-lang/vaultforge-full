import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function supabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    "";

  if (!url || !key) throw new Error("Missing Supabase environment variables.");

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function emailFromRequest(request: Request, body: any) {
  const headerEmail = request.headers.get("x-vf-email") || "";
  const bodyEmail = body?.buyer_email || body?.email || "";
  const fallback = "guest@vaultforge.local";
  return String(headerEmail || bodyEmail || fallback).trim().toLowerCase();
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const dealId = String(body?.deal_id || body?.dealId || body?.id || "").trim();
    const buyerEmail = emailFromRequest(request, body);

    if (!dealId) {
      return NextResponse.json({ ok: false, error: "Missing deal id." }, { status: 400 });
    }

    const db = supabase();

    const { data: deal, error: dealError } = await db
      .from("vf_deals")
      .select("id")
      .eq("id", dealId)
      .maybeSingle();

    if (dealError) {
      return NextResponse.json({ ok: false, error: dealError.message }, { status: 500 });
    }

    if (!deal) {
      return NextResponse.json({ ok: false, error: "Deal not found." }, { status: 404 });
    }

    const { data: existing, error: existingError } = await db
      .from("vf_buy_bucket")
      .select("id")
      .eq("deal_id", dealId)
      .eq("buyer_email", buyerEmail)
      .maybeSingle();

    if (existingError) {
      return NextResponse.json({ ok: false, error: existingError.message }, { status: 500 });
    }

    if (existing?.id) {
      return NextResponse.json({ ok: true, saved: true, existing: true, id: existing.id });
    }

    const { data, error } = await db
      .from("vf_buy_bucket")
      .insert({ buyer_email: buyerEmail, deal_id: dealId, status: "saved" })
      .select("id, buyer_email, deal_id, status, created_at")
      .single();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, saved: true, item: data });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || "Could not save deal." }, { status: 500 });
  }
}
