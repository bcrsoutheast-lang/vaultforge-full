import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function supabaseClient() {
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
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function clean(value: unknown) {
  return String(value || "").trim();
}

function cleanEmail(value: unknown) {
  return clean(value).toLowerCase();
}

function arr(value: unknown) {
  if (Array.isArray(value)) return value.map((v) => String(v || "").trim()).filter(Boolean);
  if (typeof value === "string" && value.trim()) {
    return value.split(",").map((v) => v.trim()).filter(Boolean);
  }
  return [];
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const email =
      cleanEmail(request.headers.get("x-vf-email")) ||
      cleanEmail(body.email);

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Missing member email." }, { status: 400 });
    }

    const fullName = clean(body.full_name || body.fullName || body.name);
    const phone = clean(body.phone);
    const company = clean(body.company);
    const role = clean(body.role || body.member_role);
    const city = clean(body.city);
    const state = clean(body.state);

    const profileComplete = Boolean(fullName && phone && role && city && state);

    const payload: Record<string, any> = {
      email,
      full_name: fullName,
      phone,
      company,
      role,
      city,
      state,
      markets: arr(body.markets),
      member_types: arr(body.member_types || body.memberTypes),
      buy_box: clean(body.buy_box || body.buyBox),
      funding_capacity: clean(body.funding_capacity || body.fundingCapacity),
      strategy: clean(body.strategy),
      profile_photo_url: clean(body.profile_photo_url || body.profilePhotoUrl),
      profile_complete: profileComplete,
      payment_status: clean(body.payment_status) || "unpaid",
      access_status: profileComplete ? "payment_required" : "locked",
      updated_at: new Date().toISOString(),
    };

    const supabase = supabaseClient();

    const tables = ["vf_profiles", "profiles", "member_profiles"];
    let lastError: any = null;
    let saved: any = null;

    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .upsert(payload, { onConflict: "email" })
        .select("*")
        .single();

      if (!error) {
        saved = data;
        lastError = null;
        break;
      }

      lastError = error;
    }

    if (lastError) {
      return NextResponse.json({ error: lastError.message, details: lastError }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      profile: saved,
      profile_complete: profileComplete,
      next_step: profileComplete ? "payment" : "profile",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Could not save profile.", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}
