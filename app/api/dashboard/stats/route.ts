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

  if (!url || !key) return null;

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

function requestOwner(request: Request, email: string) {
  const url = new URL(request.url);

  return (
    email === OWNER_EMAIL ||
    cleanEmail(request.headers.get("x-vf-admin")) === "1" ||
    cleanEmail(url.searchParams.get("owner")) === "1"
  );
}

async function countRows(supabase: any, table: string, filter?: (query: any) => any) {
  try {
    let query = supabase.from(table).select("*", { count: "exact", head: true });

    if (filter) {
      query = filter(query);
    }

    const { count, error } = await query;

    if (error) {
      return 0;
    }

    return Number(count || 0);
  } catch {
    return 0;
  }
}

function activeDealsFilter(query: any) {
  return query
    .or("archived.is.null,archived.eq.false")
    .or("deleted.is.null,deleted.eq.false")
    .not("status", "eq", "archived")
    .not("status", "eq", "deleted");
}

function activeBucketFilter(query: any, email: string) {
  let next = query
    .or("deleted.is.null,deleted.eq.false")
    .or("archived.is.null,archived.eq.false");

  if (email) {
    next = next.or(`member_email.eq.${email},buyer_email.eq.${email}`);
  }

  return next;
}

function activeMessagesFilter(query: any, email: string) {
  let next = query.or("archived.is.null,archived.eq.false");

  if (email) {
    next = next.or(`sender_email.eq.${email},recipient_email.eq.${email}`);
  }

  return next;
}

function activeAlertsFilter(query: any, email: string, owner: boolean) {
  let next = query
    .or("dismissed.is.null,dismissed.eq.false,is_dismissed.is.null,is_dismissed.eq.false")
    .or("read.is.null,read.eq.false,is_read.is.null,is_read.eq.false");

  if (email && !owner) {
    next = next.or(`member_email.eq.${email},recipient_email.eq.${email}`);
  }

  return next;
}

function activePainFilter(query: any, email: string, owner: boolean) {
  let next = query
    .or("archived.is.null,archived.eq.false")
    .or("resolved.is.null,resolved.eq.false")
    .not("routing_status", "eq", "archived")
    .not("routing_status", "eq", "resolved");

  if (email && !owner) {
    next = next.eq("member_email", email);
  }

  return next;
}

function activeRoutingFilter(query: any, email: string, owner: boolean) {
  let next = query
    .or("routing_status.is.null,routing_status.eq.pending,routing_status.eq.interested,routing_status.eq.active")
    .not("routing_status", "eq", "archived")
    .not("routing_status", "eq", "resolved");

  if (email && !owner) {
    next = next.eq("member_email", email);
  }

  return next;
}

function recentActivityFilter(query: any, email: string, owner: boolean) {
  const since = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString();

  let next = query.gte("created_at", since);

  if (email && !owner) {
    next = next.eq("member_email", email);
  }

  return next;
}

export async function GET(request: Request) {
  try {
    const supabase = supabaseClient();

    if (!supabase) {
      return NextResponse.json({
        ok: true,
        deals: 0,
        members: 0,
        bucket: 0,
        messages: 0,
        alerts: 0,
        pain: 0,
        routing: 0,
        activity: 0,
        warning: "Supabase environment values are missing.",
      });
    }

    const email = requestEmail(request);
    const owner = requestOwner(request, email);

    const [
      deals,
      members,
      bucket,
      messages,
      alerts,
      pain,
      routing,
      activity,
      pendingDeals,
      archivedDeals,
      lockedMembers,
      unpaidMembers,
      activeMembers,
    ] = await Promise.all([
      countRows(supabase, "vf_deals", activeDealsFilter),
      countRows(supabase, "vf_members"),
      countRows(supabase, "vf_buy_bucket", (query) => activeBucketFilter(query, email)),
      countRows(supabase, "vf_messages", (query) => activeMessagesFilter(query, email)),
      countRows(supabase, "vf_match_alerts", (query) => activeAlertsFilter(query, email, owner)),
      countRows(supabase, "vf_pain_submissions", (query) => activePainFilter(query, email, owner)),
      countRows(supabase, "vf_routing_signals", (query) => activeRoutingFilter(query, email, owner)),
      countRows(supabase, "vf_activity_events", (query) => recentActivityFilter(query, email, owner)),
      countRows(
        supabase,
        "vf_deals",
        (query) =>
          query
            .or("status.eq.pending,status.eq.review,status.eq.submitted")
            .or("archived.is.null,archived.eq.false")
            .or("deleted.is.null,deleted.eq.false")
      ),
      countRows(
        supabase,
        "vf_deals",
        (query) => query.or("archived.eq.true,status.eq.archived")
      ),
      countRows(
        supabase,
        "vf_members",
        (query) => query.or("member_status.eq.locked,is_suspended.eq.true")
      ),
      countRows(
        supabase,
        "vf_members",
        (query) => query.or("payment_status.eq.unpaid,payment_status.eq.inactive")
      ),
      countRows(
        supabase,
        "vf_members",
        (query) => query.or("member_status.eq.active,is_active.eq.true")
      ),
    ]);

    return NextResponse.json({
      ok: true,
      email,
      owner,
      deals,
      members,
      bucket,
      messages,
      alerts,
      pain,
      routing,
      activity,
      admin: {
        owner,
        pendingDeals,
        archivedDeals,
        lockedMembers,
        paymentRequiredMembers: unpaidMembers,
        activeMembers,
      },
      definitions: {
        deals: "active, not archived, not deleted",
        bucket: "saved, not archived, not deleted",
        messages: "not archived",
        alerts: "unread/undismissed match alerts",
        pain: "open, unresolved, unarchived pain signals",
        routing: "pending/interested/active routing signals",
        activity: "last 30 days of activity events",
      },
      sources: {
        deals: "vf_deals",
        members: "vf_members",
        bucket: "vf_buy_bucket",
        messages: "vf_messages",
        alerts: "vf_match_alerts",
        pain: "vf_pain_submissions",
        routing: "vf_routing_signals",
        activity: "vf_activity_events",
      },
    });
  } catch (error: any) {
    return NextResponse.json({
      ok: false,
      error: error?.message || "Dashboard stats failed.",
    });
  }
}
