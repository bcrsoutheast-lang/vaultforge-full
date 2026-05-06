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
    throw new Error("Missing Supabase environment values.");
  }

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function clean(value: unknown) {
  return String(value || "").trim();
}

function cleanEmail(value: unknown) {
  return clean(value).toLowerCase();
}

function emailFromCookie(cookieHeader: string) {
  const parts = cookieHeader.split(";").map((part) => part.trim());

  for (const part of parts) {
    if (part.startsWith("vf_email=")) {
      try {
        return decodeURIComponent(part.replace("vf_email=", "")).trim().toLowerCase();
      } catch {
        return part.replace("vf_email=", "").trim().toLowerCase();
      }
    }
  }

  return "";
}

async function readTable(supabase: any, table: string, email: string) {
  try {
    let query = supabase
      .from(table)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (email) {
      query = query.or(
        [
          `member_email.eq.${email}`,
          `recipient_email.eq.${email}`,
          `email.eq.${email}`,
          `user_email.eq.${email}`,
          `owner_email.eq.${email}`,
          `buyer_email.eq.${email}`,
        ].join(",")
      );
    }

    const { data, error } = await query;

    if (error) {
      return [];
    }

    return (data || []).map((item: any) => ({
      ...item,
      source_table: table,
    }));
  } catch {
    return [];
  }
}

export async function GET(request: Request) {
  try {
    const supabase = supabaseClient();
    const url = new URL(request.url);

    const email =
      cleanEmail(request.headers.get("x-vf-email")) ||
      cleanEmail(url.searchParams.get("email")) ||
      emailFromCookie(request.headers.get("cookie") || "");

    const [vfAlerts, memberAlerts, matchAlerts] = await Promise.all([
      readTable(supabase, "vf_match_alerts", email),
      readTable(supabase, "member_alerts", email),
      readTable(supabase, "matches", email),
    ]);

    const alerts = [...vfAlerts, ...memberAlerts, ...matchAlerts]
      .filter((item) => !item.is_dismissed && !item.dismissed)
      .sort((a, b) => {
        const aTime = new Date(a.created_at || a.updated_at || 0).getTime();
        const bTime = new Date(b.created_at || b.updated_at || 0).getTime();
        return bTime - aTime;
      });

    return NextResponse.json({
      ok: true,
      email,
      alerts,
      sources: {
        primary: "vf_match_alerts",
        secondary: "member_alerts",
        fallback: "matches",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: "Could not load alerts.",
        details: error?.message || String(error),
        alerts: [],
      },
      { status: 500 }
    );
  }
}
