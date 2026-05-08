import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const OWNER_EMAIL = "bcrsoutheast@gmail.com";

function supabasePublicClient() {
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
      detectSessionInUrl: false,
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
      detectSessionInUrl: false,
    },
  });
}

function hasServiceRoleKey() {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function clean(value: unknown) {
  return String(value || "").trim();
}

function cleanEmail(value: unknown) {
  return clean(value).toLowerCase();
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

function setVaultForgeCookies(response: NextResponse, args: {
  email: string;
  authUserId: string;
  accessToken?: string;
  refreshToken?: string;
  sessionMaxAge?: number;
}) {
  const maxAge = args.sessionMaxAge || 60 * 60 * 24 * 30;

  if (args.accessToken) {
    response.cookies.set("vf_auth_access_token", args.accessToken, cookieOptions(maxAge));
  }

  if (args.refreshToken) {
    response.cookies.set("vf_auth_refresh_token", args.refreshToken, cookieOptions(60 * 60 * 24 * 30));
  }

  response.cookies.set("vf_auth_user_id", args.authUserId, cookieOptions(maxAge));
  response.cookies.set("vf_email", args.email, publicCookieOptions(maxAge));
  response.cookies.set("vf_member_login", "1", publicCookieOptions(maxAge));

  if (args.email === OWNER_EMAIL) {
    response.cookies.set("vf_admin", "1", publicCookieOptions(maxAge));
    response.cookies.set("vf_admin_email", args.email, publicCookieOptions(maxAge));
    response.cookies.set("isAdmin", "true", publicCookieOptions(maxAge));
  }
}

async function upsertProfile(email: string, authUserId: string, fullName: string) {
  const supabase = supabaseAdminClient();

  const basePayload = {
    email,
    auth_user_id: authUserId,
    profile_complete: false,
    payment_status: "unpaid",
    access_status: email === OWNER_EMAIL ? "active" : "locked",
    updated_at: new Date().toISOString(),
  };

  const namedPayload = {
    ...basePayload,
    full_name: fullName || null,
    name: fullName || null,
  };

  const tables = ["vf_profiles", "profiles", "member_profiles"];

  for (const table of tables) {
    try {
      const { error } = await supabase
        .from(table)
        .upsert(namedPayload, { onConflict: "email" });

      if (!error) return;
    } catch {
      // Try simpler payload next.
    }

    try {
      const { error } = await supabase
        .from(table)
        .upsert(basePayload, { onConflict: "email" });

      if (!error) return;
    } catch {
      // Try next possible profile table.
    }
  }
}

async function createOrLoadUser(email: string, password: string, fullName: string) {
  const admin = supabaseAdminClient();

  if (hasServiceRoleKey()) {
    const created = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
      },
    });

    if (created.data?.user) {
      return {
        user: created.data.user,
        created: true,
        warning: "",
      };
    }

    const message = clean(created.error?.message).toLowerCase();

    if (!message.includes("already") && !message.includes("registered") && !message.includes("exists")) {
      throw new Error(created.error?.message || "Could not create member.");
    }
  }

  const publicClient = supabasePublicClient();

  const signedIn = await publicClient.auth.signInWithPassword({
    email,
    password,
  });

  if (signedIn.data?.user) {
    return {
      user: signedIn.data.user,
      session: signedIn.data.session,
      created: false,
      warning: "",
    };
  }

  if (hasServiceRoleKey()) {
    const updated = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
      },
    });

    if (updated.data?.user) {
      return {
        user: updated.data.user,
        created: true,
        warning: "",
      };
    }
  }

  throw new Error(
    signedIn.error?.message ||
      "Account may already exist. Try Login with the same email and password."
  );
}

async function signInAfterCreate(email: string, password: string) {
  try {
    const supabase = supabasePublicClient();

    const { data } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return data || null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = cleanEmail(body.email);
    const password = String(body.password || "");
    const fullName = clean(body.full_name || body.name);

    if (!email || !email.includes("@")) {
      return NextResponse.json({ ok: false, error: "Enter a valid email." }, { status: 400 });
    }

    if (!password || password.length < 6) {
      return NextResponse.json({ ok: false, error: "Password must be at least 6 characters." }, { status: 400 });
    }

    if (!fullName) {
      return NextResponse.json({ ok: false, error: "Enter your full name." }, { status: 400 });
    }

    const createdOrLoaded = await createOrLoadUser(email, password, fullName);
    const authUserId = createdOrLoaded.user?.id || `member_${email.replace(/[^a-z0-9]/g, "_")}`;

    await upsertProfile(email, authUserId, fullName);

    const signInData =
      createdOrLoaded.session
        ? {
            user: createdOrLoaded.user,
            session: createdOrLoaded.session,
          }
        : await signInAfterCreate(email, password);

    const session = signInData?.session || null;
    const sessionMaxAge = session?.expires_in || 60 * 60 * 24 * 30;

    const response = NextResponse.json({
      ok: true,
      email,
      auth_user_id: authUserId,
      has_session: Boolean(session),
      redirect_to: "/profile",
      message: "Member access created. Continue to profile.",
      warning: session ? "" : "Session was not returned, but VaultForge member cookies were created.",
    });

    setVaultForgeCookies(response, {
      email,
      authUserId,
      accessToken: session?.access_token,
      refreshToken: session?.refresh_token,
      sessionMaxAge,
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Signup route failed.",
      },
      { status: 500 }
    );
  }
}
