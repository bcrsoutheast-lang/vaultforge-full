import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const OWNER_EMAIL = "bcrsoutheast@gmail.com";
const ALERT_TABLE = "vf_match_alerts";

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
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}

function clean(value: unknown) {
  return String(value || "").trim();
}

function cleanEmail(value: unknown) {
  return clean(value).toLowerCase();
}

function readCookie(cookieHeader: string, name: string) {
  const parts = cookieHeader.split(";").map((part) => part.trim());

  for (const part of parts) {
    if (!part.startsWith(`${name}=`)) continue;

    try {
      return decodeURIComponent(part.slice(name.length + 1));
    } catch {
      return part.slice(name.length + 1);
    }
  }

  return "";
}

function requestEmail(request: Request) {
  const url = new URL(request.url);
  const cookie = request.headers.get("cookie") || "";

  return cleanEmail(
    request.headers.get("x-vf-email") ||
      url.searchParams.get("email") ||
      readCookie(cookie, "vf_email") ||
      readCookie(cookie, "vf_admin_email")
  );
}

function isOwnerRequest(request: Request, email: string) {
  const url = new URL(request.url);
  const cookie = request.headers.get("cookie") || "";

  return (
    email === OWNER_EMAIL ||
    clean(request.headers.get("x-vf-admin")) === "1" ||
    clean(url.searchParams.get("owner")) === "1" ||
    cookie.includes("vf_admin=1") ||
    cookie.includes("isAdmin=true")
  );
}

function first(...values: unknown[]) {
  for (const value of values) {
    const text = clean(value);
    if (text) return text;
  }

  return "";
}

function normalizeAlert(row: Record<string, any>) {
  const title = first(
    row.title,
    row.alert_title,
    row.match_title,
    row.deal_title,
    row.project_title,
    row.item_title,
    "Stored VaultForge Signal"
  );

  const message = first(
    row.message,
    row.alert_message,
    row.alert_body,
    row.body,
    row.description,
    row.summary,
    row.reason,
    "Stored intelligence signal."
  );

  const alertType = first(
    row.alert_type,
    row.type,
    row.category,
    row.route_position,
    "opportunity"
  );

  const priority = first(row.priority, row.alert_priority, "medium");

  return {
    id: row.id,
    title,
    message,
    alert_type: alertType,
    priority,
    score: Number(row.score || row.match_score || row.confidence_score || row.ai_score || 0),
    member_email: first(row.member_email, row.recipient_email, row.matched_member_email),
    deal_id: first(row.deal_id, row.project_id, row.property_id),
    deal_title: first(row.deal_title, row.project_title, row.item_title),
    state: first(row.state, row.market_state),
    market: first(row.market, row.city, row.county),
    source: first(row.source, "stored_signal"),
    source_table: first(row.source_table),
    safe_href: first(row.safe_href) || "/projects",
    status: first(row.status, row.alert_status, "stored"),
    review_status: first(row.review_status, "approved"),
    stored_by: first(row.stored_by, row.created_by),
    created_at: first(row.created_at),
    updated_at: first(row.updated_at),
    raw: row,
  };
}

export async function GET(request: Request) {
  try {
    const email = requestEmail(request);

    if (!email) {
      return NextResponse.json(
        {
          ok: false,
          error: "Login email required.",
        },
        { status: 401 }
      );
    }

    const owner = isOwnerRequest(request, email);
    const supabase = supabaseClient();

    let query = supabase
      .from(ALERT_TABLE)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(owner ? 200 : 75);

    if (!owner) {
      query = query.or(
        `member_email.eq.${email},recipient_email.eq.${email},matched_member_email.eq.${email}`
      );
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        {
          ok: false,
          error: error.message,
          details: error,
          table: ALERT_TABLE,
        },
        { status: 500 }
      );
    }

    const alerts = Array.isArray(data) ? data.map(normalizeAlert) : [];

    return NextResponse.json({
      ok: true,
      owner,
      email,
      table: ALERT_TABLE,
      alerts,
      counts: {
        stored_alerts: alerts.length,
        urgent: alerts.filter((item) => String(item.priority).toLowerCase() === "urgent").length,
        high: alerts.filter((item) => String(item.priority).toLowerCase() === "high").length,
        medium: alerts.filter((item) => String(item.priority).toLowerCase() === "medium").length,
      },
      note: owner
        ? "Owner global stored intelligence signals."
        : "Member-safe stored intelligence signals.",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: "Could not load stored intelligence signals.",
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
