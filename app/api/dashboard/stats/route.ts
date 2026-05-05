import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    "";

  if (!url || !key) {
    return null;
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

async function safeCount(supabase: any, table: string) {
  try {
    const { count, error } = await supabase
      .from(table)
      .select("*", { count: "exact", head: true });

    if (error) return 0;
    return count || 0;
  } catch {
    return 0;
  }
}

export async function GET() {
  const supabase = getSupabase();

  if (!supabase) {
    return NextResponse.json({
      ok: true,
      deals: 0,
      members: 0,
      bucket: 0,
      messages: 0,
      alerts: 0,
      warning: "Supabase environment values are missing.",
    });
  }

  const [deals, members, bucket, messages, alerts] = await Promise.all([
    safeCount(supabase, "vf_deals"),
    safeCount(supabase, "vf_members"),
    safeCount(supabase, "vf_buy_bucket"),
    safeCount(supabase, "vf_messages"),
    safeCount(supabase, "vf_match_alerts"),
  ]);

  return NextResponse.json({
    ok: true,
    deals,
    members,
    bucket,
    messages,
    alerts,
  });
}
