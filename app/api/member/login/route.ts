
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const OWNER_EMAIL = "bcrsoutheast@gmail.com";

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

function privateCookieOptions(maxAge: number) {
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

function setCookieSet(
  response: NextResponse,
  email: string,
  authUserId: string,
  accessToken: string,
  refreshToken: string,
  sessionMaxAge: number
) {
  const isOwner = email === OWNER_EMAIL;

  response.cookies.set("vf_auth_access_token", accessToken, privateCookieOptions(sessionMaxAge));
  response.cookies.set("vf_auth_refresh_token", refreshToken, privateCookieOptions(60 * 60 * 24 * 30));
  response.cookies.set("vf_auth_user_id", authUserId, privateCookieOptions(sessionMaxAge));

  response.cookies.set("vf_email", email, publicCookieOptions(sessionMaxAge));
  response.cookies.set("vf_member_email", email, publicCookieOptions(sessionMaxAge));
  response.cookies.set("vf_login_email", email, publicCookieOptions(sessionMaxAge));
  response.cookies.set("vf_member_login", "1", publicCookieOptions(sessionMaxAge));

  if (isOwner) {
    response.cookies.set("vf_admin", "1", publicCookieOptions(sessionMaxAge));
    response.cookies.set("vf_admin_email", email, publicCookieOptions(sessionMaxAge));
    response.cookies.set("isAdmin", "true", publicCookieOptions(sessionMaxAge));
  } else {
    response.cookies.set("vf_admin", "", publicCookieOptions(0));
    response.cookies.set("vf_admin_email", "", publicCookieOptions(0));
    response.cookies.set("isAdmin", "", publicCookieOptions(0));
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = cleanEmail(body.email);
    const password = String(body.password || "");

    if (!email || !email.includes("@")) {
      return NextResponse.json({ ok: false, error: "Enter a valid email." }, { status: 400 });
    }

    if (!password || password.length < 6) {
      return NextResponse.json({ ok: false, error: "Password must be at least 6 characters." }, { status: 400 });
    }

    const supabase = supabaseAuthClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data?.session || !data?.user) {
      return NextResponse.json(
        { ok: false, error: error?.message || "Login failed." },
        { status: 401 }
      );
    }

    await upsertProfile(email, data.user.id);

    const sessionMaxAge = data.session.expires_in || 60 * 60 * 24 * 7;
    const isOwner = email === OWNER_EMAIL;
    const redirectTo = isOwner ? "/admin" : "/dashboard";

    const response = NextResponse.json({
      ok: true,
      email,
      member_email: email,
      auth_user_id: data.user.id,
      is_owner: isOwner,
      is_admin: isOwner,
      redirect_to: redirectTo,
      storage: {
        vf_email: email,
        vf_member_email: email,
        vf_member_login: "1",
        vf_admin: isOwner ? "1" : "",
        vf_redirect_to: redirectTo,
      },
    });

    setCookieSet(
      response,
      email,
      data.user.id,
      data.session.access_token,
      data.session.refresh_token,
      sessionMaxAge
    );

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: "Login route failed.", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}
