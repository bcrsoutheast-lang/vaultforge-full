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

function cookieHeader(
  name: string,
  value: string,
  maxAge: number,
  options: { httpOnly?: boolean } = {}
) {
  const encodedName = encodeURIComponent(name);
  const encodedValue = encodeURIComponent(value);
  const parts = [
    `${encodedName}=${encodedValue}`,
    "Path=/",
    `Max-Age=${maxAge}`,
    "SameSite=Lax",
  ];

  if (process.env.NODE_ENV === "production") {
    parts.push("Secure");
  }

  if (options.httpOnly) {
    parts.push("HttpOnly");
  }

  return parts.join("; ");
}

function setSessionCookie(
  response: NextResponse,
  name: string,
  value: string,
  maxAge: number,
  options: { httpOnly?: boolean } = {}
) {
  response.headers.append("Set-Cookie", cookieHeader(name, value, maxAge, options));
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
    const refreshMaxAge = 60 * 60 * 24 * 30;
    const isOwner = email === OWNER_EMAIL;

    const response = NextResponse.json({
      ok: true,
      email,
      auth_user_id: data.user.id,
      redirect_to: "/dashboard",
      cookies_set: true,
    });

    setSessionCookie(response, "vf_auth_access_token", data.session.access_token, sessionMaxAge, { httpOnly: true });
    setSessionCookie(response, "vf_auth_refresh_token", data.session.refresh_token, refreshMaxAge, { httpOnly: true });
    setSessionCookie(response, "vf_auth_user_id", data.user.id, sessionMaxAge, { httpOnly: true });

    setSessionCookie(response, "vf_email", email, sessionMaxAge);
    setSessionCookie(response, "vf_member_login", "1", sessionMaxAge);

    if (isOwner) {
      setSessionCookie(response, "vf_admin", "1", sessionMaxAge);
      setSessionCookie(response, "vf_admin_email", email, sessionMaxAge);
      setSessionCookie(response, "isAdmin", "true", sessionMaxAge);
    } else {
      setSessionCookie(response, "vf_admin", "", 0);
      setSessionCookie(response, "vf_admin_email", "", 0);
      setSessionCookie(response, "isAdmin", "", 0);
    }

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: "Login route failed.", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}
