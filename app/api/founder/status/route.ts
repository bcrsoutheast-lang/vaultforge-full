import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const FOUNDER_LIMIT = 50;
const FOUNDER_DEADLINE_ISO = "2026-05-15T23:59:59-04:00";

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

function founderDeadline() {
  return new Date(FOUNDER_DEADLINE_ISO);
}

function nowDate() {
  return new Date();
}

function msParts(ms: number) {
  const safe = Math.max(0, ms);
  const totalSeconds = Math.floor(safe / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { days, hours, minutes, seconds, totalSeconds };
}

async function countFounders() {
  const supabase = supabaseClient();

  const attempts = [
    async () =>
      supabase
        .from("vf_members")
        .select("id", { count: "exact", head: true })
        .eq("founder_member", true),
    async () =>
      supabase
        .from("vf_members")
        .select("id", { count: "exact", head: true })
        .eq("is_founder", true),
    async () =>
      supabase
        .from("vf_members")
        .select("id", { count: "exact", head: true })
        .eq("pricing_tier", "founder"),
  ];

  for (const attempt of attempts) {
    const { count, error } = await attempt();

    if (!error && typeof count === "number") {
      return count;
    }
  }

  return 0;
}

export async function GET() {
  try {
    const deadline = founderDeadline();
    const now = nowDate();
    const remainingMs = deadline.getTime() - now.getTime();
    const remaining = msParts(remainingMs);
    const founderCount = await countFounders();
    const founderSlotsRemaining = Math.max(0, FOUNDER_LIMIT - founderCount);

    const founderWindowOpen =
      remaining.totalSeconds > 0 && founderCount < FOUNDER_LIMIT;

    const closeReason = founderWindowOpen
      ? ""
      : founderCount >= FOUNDER_LIMIT
      ? "founder_limit_reached"
      : "deadline_passed";

    return NextResponse.json({
      ok: true,
      founder: {
        window_open: founderWindowOpen,
        limit: FOUNDER_LIMIT,
        count: founderCount,
        slots_remaining: founderSlotsRemaining,
        deadline_iso: FOUNDER_DEADLINE_ISO,
        deadline_label: "May 15",
        close_reason: closeReason,
        countdown: remaining,
      },
      pricing: founderWindowOpen
        ? {
            tier: "founder",
            headline: "Founding Member Access",
            first_month: 49,
            onboarding_fee: 0,
            monthly: 199,
            copy: "$49 first month, then $199/month.",
          }
        : {
            tier: "standard",
            headline: "Standard Member Access",
            first_month: 99,
            onboarding_fee: 99,
            monthly: 199,
            copy: "$99 to join, then $199/month.",
          },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: "Could not load founder status.",
        details: error?.message || String(error),
        founder: {
          window_open: false,
          limit: FOUNDER_LIMIT,
          count: 0,
          slots_remaining: 0,
          deadline_iso: FOUNDER_DEADLINE_ISO,
          deadline_label: "May 15",
          close_reason: "status_error",
          countdown: msParts(0),
        },
        pricing: {
          tier: "standard",
          headline: "Standard Member Access",
          first_month: 99,
          onboarding_fee: 99,
          monthly: 199,
          copy: "$99 to join, then $199/month.",
        },
      },
      { status: 200 }
    );
  }
}
