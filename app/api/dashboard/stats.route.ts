import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic"; // 🔥 IMPORTANT
export const revalidate = 0;

function supabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    "";

  if (!url || !key) {
    // 🚨 DO NOT CRASH BUILD
    return null;
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
    const supabase = supabaseClient();

    if (!supabase) {
      // ✅ prevents build crash
      return NextResponse.json({
        ok: true,
        stats: {
          deals: 0,
          members: 0,
          messages: 0,
        },
      });
    }

    const [{ count: deals }, { count: messages }] = await Promise.all([
      supabase.from("vf_deals").select("*", { count: "exact", head: true }),
      supabase.from("vf_messages").select("*", { count: "exact", head: true }),
    ]);

    return NextResponse.json({
      ok: true,
      stats: {
        deals: deals || 0,
        messages: messages || 0,
      },
    });
  } catch (error: any) {
    return NextResponse.json({
      ok: true,
      stats: {
        deals: 0,
        messages: 0,
      },
    });
  }
}
