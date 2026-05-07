import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const OWNER_EMAIL = "bcrsoutheast@gmail.com";
const ALERT_TABLE = "vf_match_alerts";
const MAX_ALERTS = 150;

type AlertRow = Record<string, any>;

function clean(value: unknown) {
  return String(value || "").trim();
}

function cleanEmail(value: unknown) {
  return clean(value).toLowerCase();
}

function getSupabase() {
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

function emailFromCookie(cookieHeader: string) {
  const parts = cookieHeader.split(";").map((part) => part.trim());

  for (const part of parts) {
    if (!part.startsWith("vf_email=")) continue;

    const raw = part.replace("vf_email=", "");

    try {
      return cleanEmail(decodeURIComponent(raw));
    } catch {
      return cleanEmail(raw);
    }
  }

  return "";
}

function requestEmail(request: Request) {
  const url = new URL(request.url);

  return (
    cleanEmail(request.headers.get("x-vf-email")) ||
    cleanEmail(url.searchParams.get("email")) ||
    emailFromCookie(request.headers.get("cookie") || "")
  );
}

function isOwnerEmail(email: string) {
  return cleanEmail(email) === OWNER_EMAIL;
}

function isMissingColumnError(error: any) {
  const text = `${error?.code || ""} ${error?.message || ""} ${error?.details || ""}`.toLowerCase();

  return (
    error?.code === "42703" ||
    text.includes("column") && text.includes("does not exist") ||
    text.includes("could not find")
  );
}

function sortAlerts(alerts: AlertRow[]) {
  return [...alerts].sort((a, b) => {
    const aTime = new Date(clean(a.created_at || a.inserted_at || a.updated_at)).getTime() || 0;
    const bTime = new Date(clean(b.created_at || b.inserted_at || b.updated_at)).getTime() || 0;

    return bTime - aTime;
  });
}

function dedupeAlerts(alerts: AlertRow[]) {
  const seen = new Set<string>();
  const rows: AlertRow[] = [];

  for (const alert of alerts) {
    const key = clean(alert.id || alert.alert_id || alert.match_alert_id);

    if (key) {
      if (seen.has(key)) continue;
      seen.add(key);
    } else {
      const fallbackKey = JSON.stringify({
        deal_id: alert.deal_id || alert.project_id || "",
        member_email: alert.member_email || alert.recipient_email || alert.email || "",
        title: alert.title || alert.alert_title || "",
        created_at: alert.created_at || "",
      });

      if (seen.has(fallbackKey)) continue;
      seen.add(fallbackKey);
    }

    rows.push(alert);
  }

  return rows;
}

async function loadOwnerAlerts(supabase: any) {
  const { data, error } = await supabase
    .from(ALERT_TABLE)
    .select("*")
    .order("created_at", { ascending: false })
    .limit(MAX_ALERTS);

  if (error) {
    return { data: [], error };
  }

  return { data: data || [], error: null };
}

async function loadAlertsForEmail(supabase: any, email: string) {
  const emailColumns = [
    "member_email",
    "buyer_email",
    "recipient_email",
    "matched_member_email",
    "email",
    "owner_email",
    "user_email",
  ];

  const collected: AlertRow[] = [];
  const ignoredMissingColumns: string[] = [];
  const hardErrors: string[] = [];

  for (const column of emailColumns) {
    const { data, error } = await supabase
      .from(ALERT_TABLE)
      .select("*")
      .eq(column, email)
      .order("created_at", { ascending: false })
      .limit(MAX_ALERTS);

    if (error) {
      if (isMissingColumnError(error)) {
        ignoredMissingColumns.push(column);
        continue;
      }

      hardErrors.push(`${column}: ${error.message || "Unknown Supabase error"}`);
      continue;
    }

    if (Array.isArray(data) && data.length > 0) {
      collected.push(...data);
    }
  }

  return {
    alerts: sortAlerts(dedupeAlerts(collected)).slice(0, MAX_ALERTS),
    ignoredMissingColumns,
    hardErrors,
  };
}

export async function GET(request: Request) {
  try {
    const email = requestEmail(request);

    if (!email) {
      return NextResponse.json(
        {
          ok: false,
          error: "Login required to load alerts.",
          details: "No VaultForge email was found in the request.",
        },
        { status: 401 }
      );
    }

    const supabase = getSupabase();

    if (isOwnerEmail(email)) {
      const { data, error } = await loadOwnerAlerts(supabase);

      if (error) {
        return NextResponse.json(
          { ok: false, error: error.message, details: error },
          { status: 500 }
        );
      }

      return NextResponse.json({
        ok: true,
        owner: true,
        alerts: data || [],
        count: Array.isArray(data) ? data.length : 0,
      });
    }

    const result = await loadAlertsForEmail(supabase, email);

    if (result.hardErrors.length > 0 && result.alerts.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          error: "Could not load alerts for this member.",
          details: result.hardErrors,
          ignored_missing_columns: result.ignoredMissingColumns,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      owner: false,
      email,
      alerts: result.alerts,
      count: result.alerts.length,
      ignored_missing_columns: result.ignoredMissingColumns,
      warnings: result.hardErrors,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: "Could not load alerts.",
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
