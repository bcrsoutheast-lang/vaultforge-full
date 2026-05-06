import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const OWNER_EMAIL = "bcrsoutheast@gmail.com";

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

function normalizeAlert(item: any) {
  const title =
    item.alert_title ||
    item.title ||
    item.deal_title ||
    item.match_title ||
    "VaultForge Match Alert";

  const message =
    item.alert_message ||
    item.message ||
    item.body ||
    item.reason ||
    item.match_reason ||
    "VaultForge found a routing signal.";

  return {
    ...item,
    id: item.id,
    source_table: "vf_match_alerts",
    title,
    alert_title: title,
    message,
    body: message,
    alert_type: item.alert_type || item.type || "smart_match",
    type: item.type || item.alert_type || "smart_match",
    score: Number(item.score || item.match_score || 0),
    match_score: Number(item.match_score || item.score || 0),
    reason: item.reason || item.match_reason || "",
    match_reason: item.match_reason || item.reason || "",
    is_read: Boolean(item.is_read || item.read || item.read_at),
    read: Boolean(item.read || item.is_read || item.read_at),
    is_dismissed: Boolean(item.is_dismissed || item.dismissed || item.dismissed_at),
    dismissed: Boolean(item.dismissed || item.is_dismissed || item.dismissed_at),
  };
}

export async function GET(request: Request) {
  try {
    const supabase = supabaseClient();
    const url = new URL(request.url);

    const email =
      cleanEmail(request.headers.get("x-vf-email")) ||
      cleanEmail(url.searchParams.get("email")) ||
      emailFromCookie(request.headers.get("cookie") || "");

    const owner =
      email === OWNER_EMAIL ||
      cleanEmail(request.headers.get("x-vf-admin")) === "1" ||
      cleanEmail(url.searchParams.get("owner")) === "1";

    let query = supabase
      .from("vf_match_alerts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);

    if (!owner && email) {
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
      return NextResponse.json(
        {
          ok: false,
          error: error.message,
          details: error,
          alerts: [],
        },
        { status: 500 }
      );
    }

    const alerts = (data || [])
      .map(normalizeAlert)
      .filter((item: any) => !item.is_dismissed && !item.dismissed);

    return NextResponse.json({
      ok: true,
      email,
      owner,
      alerts,
      count: alerts.length,
      source: "vf_match_alerts",
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
