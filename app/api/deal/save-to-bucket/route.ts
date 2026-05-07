import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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
      detectSessionInUrl: false,
    },
  });
}

function clean(value: unknown) {
  return String(value || "").trim();
}

function cleanEmail(value: unknown) {
  return clean(value).toLowerCase();
}

function emailFromCookie(cookieHeader: string) {
  const parts = cookieHeader.split(";").map((part) => part.trim());

  for (const part of parts) {
    if (!part.startsWith("vf_email=")) continue;

    const raw = part.replace("vf_email=", "");

    try {
      return cleanEmail(decodeURIComponent(raw));
    } catch {
      return cleanEmail(raw);
    }
  }

  return "";
}

function requestEmail(request: Request, body: Record<string, any>) {
  return (
    cleanEmail(request.headers.get("x-vf-email")) ||
    cleanEmail(request.headers.get("x-email")) ||
    cleanEmail(body?.buyer_email) ||
    cleanEmail(body?.member_email) ||
    cleanEmail(body?.email) ||
    emailFromCookie(request.headers.get("cookie") || "")
  );
}

function requestDealId(body: Record<string, any>) {
  return clean(
    body?.deal_id ||
      body?.dealId ||
      body?.id ||
      body?.project_id ||
      body?.property_id
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const dealId = requestDealId(body);
    const email = requestEmail(request, body);

    if (!dealId) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing deal_id.",
          details: "VaultForge could not save this item because no deal id was provided.",
        },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing member email.",
          details: "Log in again so VaultForge can attach this saved deal to your account.",
        },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    const { data: existing, error: existingError } = await supabase
      .from("vf_buy_bucket")
      .select("*")
      .eq("deal_id", dealId)
      .or(`buyer_email.eq.${email},member_email.eq.${email}`)
      .maybeSingle();

    if (existingError && existingError.code !== "PGRST116") {
      return NextResponse.json(
        {
          ok: false,
          error: existingError.message || "Could not check Buy Bucket.",
          details: existingError,
        },
        { status: 500 }
      );
    }

    if (existing) {
      return NextResponse.json({
        ok: true,
        alreadySaved: true,
        item: existing,
        message: "Already saved.",
        source: "vf_buy_bucket",
      });
    }

    const payload = {
      deal_id: dealId,
      buyer_email: email,
      member_email: email,
      status: "saved",
    };

    const { data, error } = await supabase
      .from("vf_buy_bucket")
      .insert(payload)
      .select("*")
      .single();

    if (error) {
      const message = String(error.message || "").toLowerCase();

      if (message.includes("duplicate") || error.code === "23505") {
        return NextResponse.json({
          ok: true,
          alreadySaved: true,
          message: "Already saved.",
          source: "vf_buy_bucket",
        });
      }

      return NextResponse.json(
        {
          ok: false,
          error: error.message || "Could not save to Buy Bucket.",
          details: error,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      item: data,
      message: "Saved to Buy Bucket.",
      source: "vf_buy_bucket",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Failed to save deal.",
      },
      { status: 500 }
    );
  }
}
