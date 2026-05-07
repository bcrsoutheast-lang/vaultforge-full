import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function clean(value: unknown) {
  return String(value || "").trim();
}

function cleanEmail(value: unknown) {
  return clean(value).toLowerCase();
}

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    "";

  if (!url || !key) {
    throw new Error("Missing Supabase environment values.");
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const email = cleanEmail(
      request.headers.get("x-vf-email") ||
        url.searchParams.get("email")
    );

    const supabase = getSupabase();

    let query = supabase
      .from("vf_match_alerts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(150);

    if (email) {
      // Keep broad owner-safe behavior. If columns do not exist, fallback to full list.
      const { data, error } = await query.or(
        `member_email.eq.${email},buyer_email.eq.${email},recipient_email.eq.${email},email.eq.${email}`
      );

      if (!error) {
        return NextResponse.json({ ok: true, alerts: data || [] });
      }
    }

    const { data, error } = await supabase
      .from("vf_match_alerts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(150);

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message, details: error },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, alerts: data || [] });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: "Could not load alerts.",
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
