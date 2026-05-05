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

  if (!url || !key) return null;

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
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

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const email =
      cleanEmail(request.headers.get("x-vf-email")) ||
      cleanEmail(url.searchParams.get("email")) ||
      emailFromCookie(request.headers.get("cookie") || "");

    if (!email) {
      return NextResponse.json({ ok: true, profile: null, email: "" });
    }

    const supabase = supabaseClient();
    if (!supabase) {
      return NextResponse.json({ ok: true, profile: null, email, warning: "Supabase env missing." });
    }

    const tables = ["vf_profiles", "profiles", "member_profiles"];

    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select("*")
          .eq("email", email)
          .maybeSingle();

        if (!error && data) {
          return NextResponse.json({ ok: true, profile: data, email, table });
        }
      } catch {
        // Try next table.
      }
    }

    return NextResponse.json({ ok: true, profile: null, email });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: "Could not load profile.", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}
