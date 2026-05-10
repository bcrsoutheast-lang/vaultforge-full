import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const OWNER_EMAIL = "bcrsoutheast@gmail.com";

type Row = Record<string, any>;

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
    request.headers.get("x-vf-admin") === "1" ||
    url.searchParams.get("owner") === "1" ||
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

function priorityFrom(row: Row) {
  const value = first(row.priority, row.urgency_level, row.routing_status, row.status, "normal").toLowerCase();

  if (value.includes("emergency") || value.includes("urgent")) return "urgent";
  if (value.includes("high")) return "high";
  if (value.includes("medium") || value.includes("pending")) return "medium";

  return "normal";
}

function rowTitle(row: Row, source: string) {
  return first(
    row.title,
    row.event_title,
    row.signal_type,
    row.pain_type,
    row.name,
    `${source} activity`
  );
}

function rowNote(row: Row) {
  return first(
    row.description,
    row.event_description,
    row.routing_reason,
    row.ai_explanation,
    row.ai_summary,
    row.requested_help,
    "Live VaultForge operational record."
  );
}

function rowId(row: Row) {
  return first(row.id, row.source_id, row.deal_id, row.project_id, row.property_id, row.pain_id);
}

function rowMarket(row: Row) {
  return first(row.market, row.city, row.state, row.location);
}

function rowType(row: Row, source: string) {
  return first(row.signal_type, row.event_type, row.pain_type, row.asset_type, source);
}

function signalHref(row: Row, source: string) {
  const id = rowId(row);

  if (source === "pain") return "/pain";
  if (source === "routing" && id) return `/routing-room/${encodeURIComponent(id)}`;
  if (source === "activity") return "/activity";

  return "/intelligence";
}

function toAlert(row: Row, source: "pain" | "routing" | "activity") {
  const id = rowId(row);

  return {
    id: `${source}-${id || clean(row.created_at) || Math.random()}`,
    source,
    alert_type: rowType(row, source),
    type: rowType(row, source),
    priority: priorityFrom(row),
    score: Number(row.match_score || row.urgency_score || 0) || 0,
    title: rowTitle(row, source),
    message: rowNote(row),
    member_email: cleanEmail(row.member_email || row.email || row.owner_email),
    item_id: first(row.source_id, row.deal_id, row.project_id, row.property_id, row.pain_id),
    signal_id: first(row.id, row.source_id),
    state: clean(row.state),
    market: rowMarket(row),
    source_table:
      source === "pain"
        ? "vf_pain_submissions"
        : source === "routing"
        ? "vf_routing_actions"
        : "vf_activity_events",
    safe_href: signalHref(row, source),
    created_at: clean(row.created_at || row.updated_at),
  };
}

async function loadCanonicalRows({
  supabase,
  table,
  source,
  email,
  owner,
  emailColumns,
}: {
  supabase: any;
  table: string;
  source: "pain" | "routing" | "activity";
  email: string;
  owner: boolean;
  emailColumns: string[];
}) {
  try {
    let query = supabase
      .from(table)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(80);

    if (!owner && email) {
      const orFilter = emailColumns
        .map((column) => `${column}.eq.${email}`)
        .join(",");

      query = query.or(orFilter);
    }

    const { data, error } = await query;

    if (error || !Array.isArray(data)) {
      return {
        ok: false,
        alerts: [],
        error: error?.message || null,
      };
    }

    return {
      ok: true,
      alerts: data.map((row: Row) => toAlert(row, source)),
      error: null,
    };
  } catch (error: any) {
    return {
      ok: false,
      alerts: [],
      error: error?.message || "Could not load canonical rows.",
    };
  }
}

export async function GET(request: Request) {
  try {
    const email = requestEmail(request);

    if (!email) {
      return NextResponse.json(
        {
          ok: false,
          error: "Login email required.",
          alerts: [],
          counts: {
            pain: 0,
            routing: 0,
            activity: 0,
            live_alerts: 0,
          },
        },
        { status: 401 }
      );
    }

    const owner = isOwnerRequest(request, email);
    const supabase = supabaseClient();

    const [pain, routing, activity] = await Promise.all([
      loadCanonicalRows({
        supabase,
        table: "vf_pain_submissions",
        source: "pain",
        email,
        owner,
        emailColumns: ["member_email", "email", "owner_email", "created_by_email"],
      }),
      loadCanonicalRows({
        supabase,
        table: "vf_routing_actions",
        source: "routing",
        email,
        owner,
        emailColumns: ["member_email", "target_email", "target_member_email", "visible_to_email", "recipient_email", "email", "owner_email"],
      }),
      loadCanonicalRows({
        supabase,
        table: "vf_activity_events",
        source: "activity",
        email,
        owner,
        emailColumns: ["member_email", "target_email", "target_member_email", "visible_to_email", "recipient_email", "email", "owner_email"],
      }),
    ]);

    const alerts = [...pain.alerts, ...routing.alerts, ...activity.alerts]
      .sort((a, b) => {
        const aTime = new Date(a.created_at || 0).getTime();
        const bTime = new Date(b.created_at || 0).getTime();
        return bTime - aTime;
      })
      .slice(0, 120);

    return NextResponse.json({
      ok: true,
      mode: owner ? "owner_canonical_live_intelligence" : "member_canonical_live_intelligence",
      email,
      owner,
      alerts,
      signals: alerts,
      counts: {
        pain: pain.alerts.length,
        routing: routing.alerts.length,
        activity: activity.alerts.length,
        live_alerts: alerts.length,
        generated_alerts: 0,
      },
      health: {
        fake_data_allowed: false,
        synthetic_generation: false,
        canonical_tables: [
          "vf_pain_submissions",
          "vf_routing_actions",
          "vf_activity_events",
        ],
        sources: {
          pain: { ok: pain.ok, error: pain.error },
          routing: { ok: routing.ok, error: routing.error },
          activity: { ok: activity.ok, error: activity.error },
        },
      },
      market_windows: [],
      note: "Canonical live intelligence feed only. No synthetic alerts, no fake market windows, no generated 40-card fallback.",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: "Could not load canonical live intelligence feed.",
        details: error?.message || String(error),
        alerts: [],
      },
      { status: 500 }
    );
  }
}