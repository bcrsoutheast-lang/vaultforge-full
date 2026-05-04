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
    throw new Error("Missing Supabase environment variables.");
  }

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function GET(request: Request) {
  try {
    const supabase = supabaseClient();
    const url = new URL(request.url);
    const id = String(url.searchParams.get("id") || "").trim();

    if (!id) {
      return NextResponse.json({ ok: false, error: "Missing deal id." }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("vf_deals")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ ok: false, error: "Deal not found." }, { status: 404 });
    }

    return NextResponse.json({ ok: true, deal: data });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: "Failed to load deal.", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}
