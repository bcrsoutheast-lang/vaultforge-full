import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function supabaseAuthClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    "";

  if (!url || !key) {
    throw new Error("Missing Supabase public environment values.");
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function supabaseAdminClient() {
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

function cleanEmail(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

function cookieOptions(maxAge: number) {
  return {
    path: "/",
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    maxAge,
  };
}

function publicCookieOptions(maxAge: number) {
  return {
    path: "/",
    httpOnly: false,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    maxAge,
  };
}

async function upsertProfile(email: string, authUserId: string) {
  const supabase = supabaseAdminClient();

  const payload = {
    email,
    auth_user_id: authUserId,
    profile_complete: false,
    payment_status: "unpaid",
    access_status: "locked",
    updated_at: new Date().toISOString(),
  };

  const tables = ["vf_profiles", "profiles", "member_profiles"];

  for (const table of tables) {
    try {
      const { error } = await supabase
        .from(table)
        .upsert(payload, { onConflict: "email" });

      if (!error) return;
    } catch {
      // Try next known profile table.
    }
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = cleanEmail(body.email);
    const password = String(body.password || "");
    const fullName = String(body.full_name || "").trim();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ ok: false, error: "Enter a valid email." }, { status: 400 });
    }

    if (!password || password.length < 6) {
      return NextResponse.json({ ok: false, error: "Password must be at least 6 characters." }, { status: 400 });
    }

    const supabase = supabaseAuthClient();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error || !data?.user) {
      return NextResponse.json(
        { ok: false, error: error?.message || "Signup failed." },
        { status: 400 }
      );
    }

    await upsertProfile(email, data.user.id);

    const response = NextResponse.json({
      ok: true,
      email,
      auth_user_id: data.user.id,
      has_session: Boolean(data.session),
      redirect_to: data.session ? "/profile" : "/login?created=1",
      message: data.session
        ? "Account created."
        : "Account created. Check your email if confirmation is enabled, then log in.",
    });

    if (data.session) {
      const sessionMaxAge = data.session.expires_in || 60 * 60 * 24 * 7;
      response.cookies.set("vf_auth_access_token", data.session.access_token, cookieOptions(sessionMaxAge));
      response.cookies.set("vf_auth_refresh_token", data.session.refresh_token, cookieOptions(60 * 60 * 24 * 30));
      response.cookies.set("vf_auth_user_id", data.user.id, cookieOptions(sessionMaxAge));
      response.cookies.set("vf_email", email, publicCookieOptions(sessionMaxAge));
      response.cookies.set("vf_member_login", "1", publicCookieOptions(sessionMaxAge));
    }

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: "Signup route failed.", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}
