import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const ALLOWED_TABLES = new Set(["vf_match_alerts", "member_alerts", "matches"]);

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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const id = clean(body.id || body.alert_id);
    const sourceTable = clean(body.source_table || "vf_match_alerts");

    if (!id) {
      return NextResponse.json({ ok: false, error: "Missing alert id." }, { status: 400 });
    }

    if (!ALLOWED_TABLES.has(sourceTable)) {
      return NextResponse.json({ ok: false, error: "Invalid alert source." }, { status: 400 });
    }

    const { error } = await supabaseClient()
      .from(sourceTable)
      .update({
        is_dismissed: true,
        dismissed: true,
        is_read: true,
        read: true,
        dismissed_at: new Date().toISOString(),
        read_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ ok: false, error: error.message, details: error }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: "Could not dismiss alert.", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}
