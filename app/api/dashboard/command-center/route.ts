import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const OWNER_EMAIL = "bcrsoutheast@gmail.com";

type AnyRow = Record<string, any>;

type CountCard = {
  key: string;
  label: string;
  count: number;
  href: string;
  description: string;
  status: "live" | "empty" | "needs-review";
};

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
      readCookie(cookie, "vf_member_email") ||
      readCookie(cookie, "vf_admin_email") ||
      readCookie(cookie, "email")
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

function supabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    "";

  if (!url || !key) return null;

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}

function rowEmailCandidates(row: AnyRow) {
  const metadata = typeof row.metadata === "object" && row.metadata ? row.metadata : {};

  return [
    row.email,
    row.member_email,
    row.sender_email,
    row.from_email,
    row.owner_email,
    row.submitted_by,
    row.user_email,
    metadata.email,
    metadata.member_email,
    metadata.sender_email,
    metadata.from_email,
    metadata.owner_email,
    metadata.submitted_by,
    metadata.user_email,
  ]
    .map(cleanEmail)
    .filter(Boolean);
}

function canSee(row: AnyRow, email: string, owner: boolean) {
  if (owner) return true;

  const candidates = rowEmailCandidates(row);
  if (!candidates.length) return true;

  return candidates.includes(email);
}

async function selectRows(supabase: any, table: string, email: string, owner: boolean, limit = 200) {
  const orderColumns = ["created_at", "updated_at", "id"];

  for (const column of orderColumns) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select("*")
        .order(column, { ascending: false })
        .limit(limit);

      if (!error && Array.isArray(data)) {
        return data.filter((row) => canSee(row, email, owner));
      }
    } catch {
      // Try next strategy.
    }
  }

  try {
    const { data, error } = await supabase.from(table).select("*").limit(limit);
    if (!error && Array.isArray(data)) return data.filter((row) => canSee(row, email, owner));
  } catch {
    // Table probably does not exist yet.
  }

  return [];
}

function uniqueById(rows: AnyRow[]) {
  const seen = new Set<string>();

  return rows.filter((row, index) => {
    const key = clean(row.id || row.signal_id || row.pain_id || row.thread_id || row.project_id || row.title || index);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function countFromTables(supabase: any, tables: string[], email: string, owner: boolean) {
  const allRows: AnyRow[] = [];

  for (const table of tables) {
    const rows = await selectRows(supabase, table, email, owner);
    allRows.push(...rows.map((row) => ({ ...row, _table: table })));
  }

  return uniqueById(allRows).length;
}

function card(key: string, label: string, count: number, href: string, description: string): CountCard {
  return {
    key,
    label,
    count,
    href,
    description,
    status: count > 0 ? "live" : "empty",
  };
}

export async function GET(request: Request) {
  try {
    const email = requestEmail(request);
    const owner = isOwnerRequest(request, email);

    if (!email) {
      return NextResponse.json({ ok: false, error: "Login email required." }, { status: 401 });
    }

    const supabase = supabaseClient();

    if (!supabase) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing Supabase environment values.",
        },
        { status: 500 }
      );
    }

    const [
      painCount,
      projectCount,
      signalCount,
      messageCount,
      routingCount,
      alertCount,
      memberCount,
      introCount,
    ] = await Promise.all([
      countFromTables(supabase, ["vf_pain_submissions"], email, owner),
      countFromTables(supabase, ["projects", "property_cards", "deals"], email, owner),
      countFromTables(supabase, ["vf_intelligence_signals", "signals"], email, owner),
      countFromTables(supabase, ["vf_messages", "messages", "message_threads"], email, owner),
      countFromTables(supabase, ["vf_routing_actions", "routing_actions"], email, owner),
      countFromTables(supabase, ["vf_alerts", "alerts", "vf_activity_events"], email, owner),
      countFromTables(supabase, ["profiles", "members", "applications"], email, true),
      countFromTables(supabase, ["vf_introductions", "introductions", "intro_responses"], email, owner),
    ]);

    const cards: CountCard[] = [
      card("pain", "Pain Requests", painCount, "/pain-feed", "Submitted problems and pressure signals."),
      card("projects", "Projects", projectCount, "/projects", "Deals, properties, and execution rooms."),
      card("signals", "Signals", signalCount + painCount, "/pain-feed", "Live intelligence created from pain, deals, and projects."),
      card("messages", "Messages", messageCount, "/messages", "Requests, replies, and owner/member communication."),
      card("routing", "Routing", routingCount, "/routing-inbox", "AI/operator routing actions and member-fit paths."),
      card("alerts", "Alerts", alertCount, "/alerts", "Urgent updates, signal movement, and required action."),
      card("members", "Member Network", memberCount, "/members", "Network by state, profile, need, and capability."),
      card("intros", "Introductions", introCount, "/introductions", "Controlled intros and routing responses."),
    ];

    const totalActive = painCount + projectCount + signalCount + messageCount + routingCount + alertCount + introCount;

    return NextResponse.json({
      ok: true,
      email,
      owner,
      cards,
      summary: {
        total_active: totalActive,
        pain: painCount,
        projects: projectCount,
        signals: signalCount + painCount,
        messages: messageCount,
        routing: routingCount,
        alerts: alertCount,
        members: memberCount,
        introductions: introCount,
      },
      source: "api/dashboard/command-center",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: "Could not load command center.",
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
