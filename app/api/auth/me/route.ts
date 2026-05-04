import { cookies } from "next/headers";
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

export async function GET() {
  try {
    const store = await cookies();
    const accessToken = store.get("vf_auth_access_token")?.value || "";
    const fallbackEmail = store.get("vf_email")?.value || "";

    if (!accessToken) {
      return NextResponse.json({
        ok: false,
        authenticated: false,
        email: fallbackEmail,
        auth_user_id: "",
      });
    }

    const supabase = supabaseAuthClient();
    const { data, error } = await supabase.auth.getUser(accessToken);

    if (error || !data?.user) {
      return NextResponse.json({
        ok: false,
        authenticated: false,
        email: fallbackEmail,
        auth_user_id: "",
        error: error?.message || "No verified user.",
      });
    }

    return NextResponse.json({
      ok: true,
      authenticated: true,
      email: data.user.email || fallbackEmail,
      auth_user_id: data.user.id,
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, authenticated: false, error: error?.message || String(error) },
      { status: 500 }
    );
  }
}
