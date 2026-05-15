import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function client() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    "";

  if (!url || !key) return null;

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

async function countTable(db: any, table: string) {
  try {
    const { count, error } = await db
      .from(table)
      .select("*", { count: "exact", head: true });

    if (error || typeof count !== "number") return 0;
    return count;
  } catch {
    return 0;
  }
}

export async function GET() {
  try {
    const db = client();

    if (!db) {
      return NextResponse.json({
        ok: true,
        stats: {
          members: 0,
          deals: 0,
          pain: 0,
          signals: 0,
          routes: 0,
          markets: 7,
          founders: 0,
        },
        source: "fallback",
      });
    }

    const [
      vfProfiles,
      profiles,
      members,
      vfDeals,
      deals,
      projects,
      painA,
      painB,
      signalsA,
      routingA,
    ] = await Promise.all([
      countTable(db, "vf_profiles"),
      countTable(db, "profiles"),
      countTable(db, "vf_members"),
      countTable(db, "vf_deals"),
      countTable(db, "deals"),
      countTable(db, "projects"),
      countTable(db, "vf_pain_requests"),
      countTable(db, "pain_requests"),
      countTable(db, "vf_intelligence_signals"),
      countTable(db, "vf_routing_actions"),
    ]);

    const memberCount = Math.max(vfProfiles, profiles, members);

    return NextResponse.json({
      ok: true,
      stats: {
        members: memberCount,
        founders: memberCount,
        deals: vfDeals + deals + projects,
        pain: painA + painB,
        signals: signalsA + routingA + painA + painB,
        routes: routingA,
        markets: 7,
      },
      source: "supabase",
    });
  } catch (error: any) {
    return NextResponse.json({
      ok: true,
      stats: {
        members: 0,
        deals: 0,
        pain: 0,
        signals: 0,
        routes: 0,
        markets: 7,
        founders: 0,
      },
      error: error?.message || "stats unavailable",
      source: "fallback",
    });
  }
}
