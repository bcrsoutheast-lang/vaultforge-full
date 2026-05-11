
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function clean(value: unknown) {
  return String(value || "").trim();
}

function cleanEmail(value: unknown) {
  return clean(value).toLowerCase();
}

function arr(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => clean(item)).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => clean(item))
      .filter(Boolean);
  }

  return [];
}

function supabase() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    "";

  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    "";

  if (!url || !key) {
    throw new Error("Missing Supabase environment variables.");
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function GET(request: NextRequest) {
  try {
    const email =
      cleanEmail(request.nextUrl.searchParams.get("email")) ||
      cleanEmail(request.headers.get("x-vf-email"));

    if (!email) {
      return NextResponse.json(
        {
          ok: false,
          error: "Email required.",
        },
        { status: 400 }
      );
    }

    const db = supabase();

    const { data, error } = await db
      .from("vf_profiles")
      .select("*")
      .eq("email", email)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        {
          ok: false,
          error: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      profile: data || {},
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Could not load profile.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const email =
      cleanEmail(body?.email) ||
      cleanEmail(request.headers.get("x-vf-email"));

    if (!email) {
      return NextResponse.json(
        {
          ok: false,
          error: "Email required.",
        },
        { status: 400 }
      );
    }

    const payload = {
      email,
      name: clean(body?.name || body?.full_name),
      full_name: clean(body?.full_name || body?.name),
      company: clean(body?.company || body?.company_name),
      company_name: clean(body?.company_name || body?.company),
      phone: clean(body?.phone),

      profile_photo_url: clean(body?.profile_photo_url || body?.photo_url),
      photo_url: clean(body?.profile_photo_url || body?.photo_url),
      avatar_url: clean(body?.profile_photo_url || body?.photo_url),

      member_types: arr(body?.member_types),
      markets: arr(body?.markets),
      strategies: arr(body?.strategies),
      asset_focus: arr(body?.asset_focus),
      needs: arr(body?.needs),
      can_provide: arr(body?.can_provide),
      pain_signals: arr(body?.pain_signals),

      buy_box: clean(body?.buy_box),
      funding_capacity: clean(body?.funding_capacity),
      strategy_notes: clean(body?.strategy_notes),

      network_accepted: Boolean(body?.network_accepted),
      accepted_to_network: Boolean(body?.accepted_to_network ?? body?.network_accepted),
      available_to_network: Boolean(body?.available_to_network ?? body?.network_accepted),

      routing_score: Number(body?.routing_score || 0),

      updated_at: new Date().toISOString(),
    };

    const db = supabase();

    const { data: existing } = await db
      .from("vf_profiles")
      .select("id,email")
      .eq("email", email)
      .maybeSingle();

    if (existing?.email) {
      const { data, error } = await db
        .from("vf_profiles")
        .update(payload)
        .eq("email", email)
        .select()
        .single();

      if (error) {
        return NextResponse.json(
          {
            ok: false,
            error: error.message,
            details: error.details || null,
            hint: error.hint || null,
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        ok: true,
        message: "Profile updated.",
        profile: data,
      });
    }

    const { data, error } = await db
      .from("vf_profiles")
      .insert({
        ...payload,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        {
          ok: false,
          error: error.message,
          details: error.details || null,
          hint: error.hint || null,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Profile created.",
      profile: data,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Profile could not be saved.",
      },
      { status: 500 }
    );
  }
}
