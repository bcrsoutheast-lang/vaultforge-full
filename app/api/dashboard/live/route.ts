import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type SupabaseAny = any;

function clean(value: unknown) {
  return String(value || "").trim();
}

function cleanEmail(value: unknown) {
  return clean(value).toLowerCase();
}

function makeSupabase(): SupabaseAny | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    "";

  if (!url || !key) return null;

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function readCookie(request: Request, name: string) {
  const cookie = request.headers.get("cookie") || "";
  const match = cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));

  if (!match) return "";

  try {
    return decodeURIComponent(match.slice(name.length + 1));
  } catch {
    return match.slice(name.length + 1);
  }
}

function getRequestEmail(request: Request) {
  const url = new URL(request.url);

  return cleanEmail(
    request.headers.get("x-vf-email") ||
      url.searchParams.get("email") ||
      readCookie(request, "vf_email") ||
      readCookie(request, "vf_admin_email")
  );
}

function isOwnerRequest(request: Request, email: string) {
  const url = new URL(request.url);
  const cookie = (request.headers.get("cookie") || "").toLowerCase();

  return (
    email === "bcrsoutheast@gmail.com" ||
    request.headers.get("x-vf-admin") === "1" ||
    url.searchParams.get("owner") === "1" ||
    cookie.includes("vf_admin=1") ||
    cookie.includes("isadmin=true")
  );
}

async function countTable(
  supabase: SupabaseAny,
  table: string,
  email: string,
  owner: boolean,
  emailColumns: string[]
) {
  try {
    let query = supabase.from(table).select("*", {
      count: "exact",
      head: true,
    });

    if (!owner) {
      const orFilter = emailColumns
        .map((column) => `${column}.eq.${email}`)
        .join(",");

      query = query.or(orFilter);
    }

    const { count, error } = await query;

    return {
      ok: !error,
      count: count || 0,
      error: error?.message || null,
    };
  } catch (error: any) {
    return {
      ok: false,
      count: 0,
      error: error?.message || "Count failed.",
    };
  }
}

async function recentTable(
  supabase: SupabaseAny,
  table: string,
  source: string,
  email: string,
  owner: boolean,
  emailColumns: string[]
) {
  try {
    let query = supabase
      .from(table)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(6);

    if (!owner) {
      const orFilter = emailColumns
        .map((column) => `${column}.eq.${email}`)
        .join(",");

      query = query.or(orFilter);
    }

    const { data, error } = await query;

    if (error || !Array.isArray(data)) return [];

    return data.map((row: Record<string, any>) => ({
      source,
      title:
        clean(
          row.title ||
            row.event_title ||
            row.signal_type ||
            row.pain_type ||
            row.name
        ) || `${source} activity`,
      note:
        clean(
          row.description ||
            row.event_description ||
            row.routing_reason ||
            row.ai_explanation ||
            row.ai_summary
        ) || "Live VaultForge activity.",
      priority:
        clean(
          row.priority ||
            row.urgency_level ||
            row.routing_status ||
            row.status
        ) || "normal",
      created_at: clean(row.created_at || row.updated_at),
      href:
        source === "pain"
          ? "/pain"
          : source === "routing"
          ? "/routing"
          : "/activity",
    }));
  } catch {
    return [];
  }
}

function emptyResponse(email: string, reason: string, status = 401) {
  return NextResponse.json(
    {
      ok: false,
      error: reason,
      visibility: {
        owner: false,
        email,
      },
      counts: {
        pain_signals: 0,
        routing_actions: 0,
        total_activity: 0,
        members: 0,
        projects: 0,
        introductions: 0,
        responses: 0,
        urgent_routing: 0,
        high_routing: 0,
      },
      recent: [],
      ticker: ["LOGIN REQUIRED — LIVE DATA LOCKED"],
      health: {
        live_data_ready: false,
        fake_data_allowed: false,
        security_locked: true,
        reason,
      },
      generated_at: new Date().toISOString(),
    },
    { status }
  );
}

export async function GET(request: Request) {
  const supabase = makeSupabase();

  if (!supabase) {
    return NextResponse.json(
      {
        ok: false,
        error: "Missing Supabase configuration.",
      },
      { status: 500 }
    );
  }

  const email = getRequestEmail(request);
  const owner = isOwnerRequest(request, email);

  if (!email) {
    return emptyResponse(
      email,
      "Login email is required before live member data can be shown."
    );
  }

  const painEmailColumns = ["member_email", "email", "owner_email", "created_by_email"];
  const routingEmailColumns = [
    "member_email",
    "target_email",
    "target_member_email",
    "visible_to_email",
    "recipient_email",
    "email",
    "owner_email",
  ];
  const activityEmailColumns = [
    "member_email",
    "target_email",
    "target_member_email",
    "visible_to_email",
    "recipient_email",
    "email",
    "owner_email",
  ];
  const profileEmailColumns = ["email", "member_email"];
  const projectEmailColumns = ["member_email", "email", "owner_email", "created_by_email"];

  const [painCount, routingCount, activityCount, memberCount, projectCount] =
    await Promise.all([
      countTable(supabase, "vf_pain_submissions", email, owner, painEmailColumns),
      countTable(supabase, "vf_routing_actions", email, owner, routingEmailColumns),
      countTable(supabase, "vf_activity_events", email, owner, activityEmailColumns),
      countTable(supabase, "vf_profiles", email, owner, profileEmailColumns),
      countTable(supabase, "projects", email, owner, projectEmailColumns),
    ]);

  const [painRecent, routingRecent, activityRecent] = await Promise.all([
    recentTable(supabase, "vf_pain_submissions", "pain", email, owner, painEmailColumns),
    recentTable(supabase, "vf_routing_actions", "routing", email, owner, routingEmailColumns),
    recentTable(supabase, "vf_activity_events", "activity", email, owner, activityEmailColumns),
  ]);

  const recent = [...painRecent, ...routingRecent, ...activityRecent]
    .sort((a, b) => {
      const aTime = new Date(a.created_at || 0).getTime();
      const bTime = new Date(b.created_at || 0).getTime();
      return bTime - aTime;
    })
    .slice(0, 12);

  const counts = {
    pain_signals: painCount.count,
    routing_actions: routingCount.count,
    total_activity: activityCount.count,
    members: memberCount.count,
    projects: projectCount.count,
    introductions: 0,
    responses: 0,
    urgent_routing: 0,
    high_routing: 0,
  };

  const ticker = recent.length
    ? recent.map((item) => `${String(item.source || "LIVE").toUpperCase()}: ${String(item.title || "Activity").slice(0, 80)}`)
    : ["LIVE DATA CONNECTED — NO MEMBER ACTIVITY YET"];

  return NextResponse.json({
    ok: true,
    visibility: {
      owner,
      email,
    },
    counts,
    recent,
    ticker,
    health: {
      live_data_ready: true,
      fake_data_allowed: false,
      security_locked: false,
      canonical_tables: [
        "vf_pain_submissions",
        "vf_routing_actions",
        "vf_activity_events",
      ],
      tables_ok: [
        painCount.ok,
        routingCount.ok,
        activityCount.ok,
        memberCount.ok,
        projectCount.ok,
      ].filter(Boolean).length,
    },
    generated_at: new Date().toISOString(),
  });
}