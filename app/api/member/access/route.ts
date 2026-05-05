import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const OWNER_EMAIL = "bcrsoutheast@gmail.com";

function supabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    "";

  if (!url || !key) return null;

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function cleanEmail(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

function emailFromCookie(cookieHeader: string) {
  const parts = cookieHeader.split(";").map((part) => part.trim());
  for (const part of parts) {
    if (part.startsWith("vf_email=")) {
      return decodeURIComponent(part.replace("vf_email=", "")).toLowerCase();
    }
  }
  return "";
}

async function loadProfile(email: string) {
  const supabase = supabaseClient();
  if (!supabase || !email) return null;

  const tables = ["vf_profiles", "profiles", "member_profiles"];

  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select("*")
        .eq("email", email)
        .maybeSingle();

      if (!error && data) return data;
    } catch {
      // Try next possible profile table.
    }
  }

  return null;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const headerEmail =
      cleanEmail(request.headers.get("x-vf-email")) ||
      cleanEmail(url.searchParams.get("email"));

    const cookieEmail = emailFromCookie(request.headers.get("cookie") || "");
    const email = headerEmail || cookieEmail;

    const owner = email === OWNER_EMAIL;
    const profile = await loadProfile(email);

    const profileComplete =
      owner ||
      Boolean(profile?.profile_complete) ||
      String(profile?.profile_complete || "").toLowerCase() === "true";

    const paymentStatus = owner
      ? "owner"
      : String(profile?.payment_status || profile?.subscription_status || "unpaid").toLowerCase();

    const accessStatus = owner
      ? "active"
      : String(profile?.access_status || profile?.member_status || "locked").toLowerCase();

    const paid =
      owner ||
      paymentStatus === "paid" ||
      paymentStatus === "active" ||
      accessStatus === "active";

    const unlocked = owner || (profileComplete && paid);

    return NextResponse.json({
      ok: true,
      email,
      owner,
      profile_complete: profileComplete,
      payment_status: paymentStatus,
      access_status: accessStatus,
      paid,
      unlocked,
      next_step: owner
        ? "owner_access"
        : !profileComplete
        ? "complete_profile"
        : !paid
        ? "payment"
        : "unlocked",
      profile: profile || null,
    });
  } catch (error: any) {
    return NextResponse.json({
      ok: true,
      email: "",
      owner: false,
      profile_complete: false,
      payment_status: "unpaid",
      access_status: "locked",
      paid: false,
      unlocked: false,
      next_step: "complete_profile",
      warning: error?.message || String(error),
    });
  }
}
