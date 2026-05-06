import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const OWNER_EMAIL = "bcrsoutheast@gmail.com";

function clean(value: unknown) {
  return String(value || "").trim();
}

function cleanEmail(value: unknown) {
  return clean(value).toLowerCase();
}

function supabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key =
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

function cookieOptions(maxAge: number, httpOnly = false) {
  return {
    path: "/",
    maxAge,
    httpOnly,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const email = cleanEmail(formData.get("email"));
    const password = clean(formData.get("password"));

    if (!email || !password) {
      return NextResponse.redirect(
        new URL("/login?error=missing", request.url),
        303
      );
    }

    const supabase = supabaseClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data?.session || !data?.user) {
      return NextResponse.redirect(
        new URL("/login?error=invalid", request.url),
        303
      );
    }

    const response = NextResponse.redirect(
      new URL("/dashboard", request.url),
      303
    );

    const sessionMaxAge = data.session.expires_in || 60 * 60 * 24 * 7;

    response.cookies.set(
      "vf_auth_access_token",
      data.session.access_token,
      cookieOptions(sessionMaxAge, true)
    );

    response.cookies.set(
      "vf_auth_refresh_token",
      data.session.refresh_token,
      cookieOptions(60 * 60 * 24 * 30, true)
    );

    response.cookies.set(
      "vf_auth_user_id",
      data.user.id,
      cookieOptions(sessionMaxAge, true)
    );

    response.cookies.set(
      "vf_email",
      email,
      cookieOptions(sessionMaxAge)
    );

    response.cookies.set(
      "vf_member_login",
      "1",
      cookieOptions(sessionMaxAge)
    );

    if (email === OWNER_EMAIL) {
      response.cookies.set(
        "vf_admin",
        "1",
        cookieOptions(sessionMaxAge)
      );

      response.cookies.set(
        "vf_admin_email",
        email,
        cookieOptions(sessionMaxAge)
      );

      response.cookies.set(
        "isAdmin",
        "true",
        cookieOptions(sessionMaxAge)
      );
    }

    return response;
  } catch (error) {
    return NextResponse.redirect(
      new URL("/login?error=server", request.url),
      303
    );
  }
}
