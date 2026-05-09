
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type CountResult = {
  table: string;
  count: number;
  ok: boolean;
  error?: string;
};

type RecentItem = {
  source: string;
  title: string;
  note: string;
  priority: string;
  created_at: string;
  href: string;
};

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

function readCookieEmail(request: Request) {
  const cookie = request.headers.get("cookie") || "";
  const parts = cookie.split(";").map((part) => part.trim());

  for (const name of ["vf_email", "vf_admin_email"]) {
    const found = parts.find((part) => part.startsWith(`${name}=`));
    if (found) {
      try {
        return decodeURIComponent(found.slice(name.length + 1)).toLowerCase();
      } catch {
        return found.slice(name.length + 1).toLowerCase();
      }
    }
  }

  return "";
}

function getRequestEmail(request: Request) {
  const url = new URL(request.url);

  return cleanEmail(
    request.headers.get("x-vf-email") ||
      url.searchParams.get("email") ||
      readCookieEmail(request)
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

async function safeCount(
  supabase: SupabaseAny,
  table: string,
  options?: {
    owner?: boolean;
    email?: string;
    emailColumns?: string[];
    priorityColumn?: string;
    priorityValue?: string;
  }
): Promise<CountResult> {
  try {
    let query = supabase.from(table).select("*", {
      count: "exact",
      head: true,
    });

    if (options?.priorityColumn && options?.priorityValue) {
      query = query.eq(options.priorityColumn, options.priorityValue);
    }

    if (!options?.owner && options?.email && options?.emailColumns?.length) {
      const orFilter = options.emailColumns
        .map((column) => `${column}.eq.${options.email}`)
        .join(",");

      query = query.or(orFilter);
    }

    const { count, error } = await query;

    if (error) {
      return {
        table,
        count: 0,
        ok: false,
        error: error.message,
      };
    }

    return {
      table,
      count: count || 0,
      ok: true,
    };
  } catch (error: any) {
    return {
      table,
      count: 0,
      ok: false,
      error: error?.message || "Count failed.",
    };
  }
}

async function safeRecent(
  supabase: SupabaseAny,
  table: string,
  source: string,
  options?: {
    owner?: boolean;
    email?: string;
    emailColumns?: string[];
    limit?: number;
  }
): Promise<RecentItem[]> {
  try {
    let query = supabase
      .from(table)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(options?.limit || 5);

    if (!options?.owner && options?.email && options?.emailColumns?.length) {
      const orFilter = options.emailColumns
        .map((column) => `${column}.eq.${options.email}`)
        .join(",");

      query = query.or(orFilter);
    }

    const { data, error } = await query;

    if (error || !Array.isArray(data)) return [];

    return data.map((row: Record<string, any>) => {
      const id = clean(row.id || row.signal_id || row.item_id || row.introduction_id);
      const title = clean(
        row.title ||
          row.name ||
          row.headline ||
          row.signal_title ||
          row.alert_title ||
          `${source} activity`
      );

      const note = clean(
        row.note ||
          row.message ||
          row.description ||
          row.summary ||
          row.reason ||
          row.ai_route_summary ||
          "Live VaultForge activity recorded."
      );

      const priority = clean(row.priority || row.urgency || row.urgency_level || row.status || "normal");

      let href = "/activity";

      if (source === "routing" && clean(row.signal_id)) {
        href = `/routing-room/${encodeURIComponent(clean(row.signal_id))}`;
      } else if (source === "introduction" && id) {
        href = `/introduction/${encodeURIComponent(id)}`;
      } else if (source === "response" && clean(row.introduction_id)) {
        href = `/introduction/${encodeURIComponent(clean(row.introduction_id))}`;
      } else if (source === "pain" && id) {
        href = `/pain-message/${encodeURIComponent(id)}`;
      } else if ((source === "project" || source === "deal") && id) {
        href = `/deal-room/${encodeURIComponent(id)}`;
      }

      return {
        source,
        title,
        note,
        priority,
        created_at: clean(row.created_at || row.updated_at || ""),
        href,
      };
    });
  } catch {
    return [];
  }
}

export async function GET(request: Request) {
  const supabase = makeSupabase();

  if (!supabase) {
    return NextResponse.json(
      {
        ok: false,
        error: "Supabase environment variables are missing.",
        counts: {},
        recent: [],
        health: {
          live_data_ready: false,
          fake_data_allowed: false,
        },
      },
      { status: 500 }
    );
  }

  const email = getRequestEmail(request);
  const owner = isOwnerRequest(request, email);

  const routingEmailColumns = ["member_email", "target_email", "visible_to_email", "owner_email", "email"];
  const introEmailColumns = [
    "visible_to_email",
    "member_email",
    "recipient_email",
    "intro_to_email",
    "responding_member_email",
    "counterparty_email",
    "owner_email",
  ];
  const responseEmailColumns = ["member_email", "responding_member_email", "email", "visible_to_email"];
  const projectEmailColumns = ["owner_email", "member_email", "email", "created_by_email"];
  const painEmailColumns = ["member_email", "owner_email", "email", "created_by_email"];
  const memberEmailColumns = ["email", "member_email"];

  const [
    routingCount,
    urgentRoutingCount,
    highRoutingCount,
    introCount,
    responseCount,
    projectCount,
    painCount,
    memberCount,
  ] = await Promise.all([
    safeCount(supabase, "routing_actions", { owner, email, emailColumns: routingEmailColumns }),
    safeCount(supabase, "routing_actions", {
      owner,
      email,
      emailColumns: routingEmailColumns,
      priorityColumn: "priority",
      priorityValue: "urgent",
    }),
    safeCount(supabase, "routing_actions", {
      owner,
      email,
      emailColumns: routingEmailColumns,
      priorityColumn: "priority",
      priorityValue: "high",
    }),
    safeCount(supabase, "routing_introductions", { owner, email, emailColumns: introEmailColumns }),
    safeCount(supabase, "routing_introduction_responses", { owner, email, emailColumns: responseEmailColumns }),
    safeCount(supabase, "projects", { owner, email, emailColumns: projectEmailColumns }),
    safeCount(supabase, "vf_pain_submissions", { owner, email, emailColumns: painEmailColumns }),
    safeCount(supabase, "vf_profiles", { owner, email, emailColumns: memberEmailColumns }),
  ]);

  const countResults = [
    routingCount,
    urgentRoutingCount,
    highRoutingCount,
    introCount,
    responseCount,
    projectCount,
    painCount,
    memberCount,
  ];

  const [routingRecent, introRecent, responseRecent, painRecent, projectRecent] = await Promise.all([
    safeRecent(supabase, "routing_actions", "routing", { owner, email, emailColumns: routingEmailColumns }),
    safeRecent(supabase, "routing_introductions", "introduction", { owner, email, emailColumns: introEmailColumns }),
    safeRecent(supabase, "routing_introduction_responses", "response", { owner, email, emailColumns: responseEmailColumns }),
    safeRecent(supabase, "vf_pain_submissions", "pain", { owner, email, emailColumns: painEmailColumns }),
    safeRecent(supabase, "projects", "project", { owner, email, emailColumns: projectEmailColumns }),
  ]);

  const recent = [...routingRecent, ...introRecent, ...responseRecent, ...painRecent, ...projectRecent]
    .sort((a, b) => {
      const aTime = new Date(a.created_at || 0).getTime();
      const bTime = new Date(b.created_at || 0).getTime();
      return bTime - aTime;
    })
    .slice(0, 12);

  const counts = {
    routing_actions: routingCount.count,
    urgent_routing: urgentRoutingCount.count,
    high_routing: highRoutingCount.count,
    introductions: introCount.count,
    responses: responseCount.count,
    projects: projectCount.count,
    pain_signals: painCount.count,
    members: memberCount.count,
    total_activity:
      routingCount.count +
      introCount.count +
      responseCount.count +
      painCount.count +
      projectCount.count,
  };

  const ticker = recent.length
    ? recent.map((item) => `${item.source.toUpperCase()}: ${item.title.slice(0, 80)}`)
    : [
        "LIVE DATA CONNECTED — WAITING FOR MEMBER ACTIVITY",
        "NO FAKE DASHBOARD ACTIVITY ACTIVE",
        "ROUTING ENGINE READY FOR REAL SIGNALS",
      ];

  const health = {
    live_data_ready: true,
    fake_data_allowed: false,
    tables_checked: countResults.length,
    tables_ok: countResults.filter((item) => item.ok).length,
    tables_missing_or_blocked: countResults
      .filter((item) => !item.ok)
      .map((item) => ({
        table: item.table,
        error: item.error,
      })),
  };

  return NextResponse.json({
    ok: true,
    visibility: {
      owner,
      email,
    },
    counts,
    recent,
    ticker,
    health,
    generated_at: new Date().toISOString(),
  });
}
