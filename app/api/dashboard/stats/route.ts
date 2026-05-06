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

async function countRows(supabase: any, table: string, filter?: (query: any) => any) {
  try {
    let query = supabase.from(table).select("*", { count: "exact", head: true });
    if (filter) query = filter(query);

    const { count, error } = await query;
    if (error) return { count: 0, ok: false, error: error.message };

    return { count: Number(count || 0), ok: true, error: "" };
  } catch (error: any) {
    return { count: 0, ok: false, error: error?.message || String(error) };
  }
}

async function countFirstWorkingTable(supabase: any, tableNames: string[], filter?: (query: any) => any) {
  const tried: Record<string, string> = {};

  for (const table of tableNames) {
    const result = await countRows(supabase, table, filter);

    if (result.ok) {
      return { count: result.count, table, tried };
    }

    tried[table] = result.error;
  }

  return { count: 0, table: "", tried };
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
        admin: {
          owner: false,
          pendingDeals: 0,
          archivedDeals: 0,
          lockedMembers: 0,
          paymentRequiredMembers: 0,
          activeMembers: 0,
        },
        warning: "Supabase environment values are missing.",
      });
    }

    const url = new URL(request.url);
    const email =
      cleanEmail(request.headers.get("x-vf-email")) ||
      cleanEmail(url.searchParams.get("email")) ||
      emailFromCookie(request.headers.get("cookie") || "");

    const owner =
      email === OWNER_EMAIL ||
      cleanEmail(request.headers.get("x-vf-admin")) === "1" ||
      cleanEmail(url.searchParams.get("owner")) === "1";

    const [
      dealsResult,
      membersResult,
      bucketResult,
      messagesResult,
      pendingDealsResult,
      archivedDealsResult,
      lockedMembersResult,
      paymentMembersResult,
      activeMembersResult,
    ] = await Promise.all([
      countFirstWorkingTable(supabase, ["vf_deals", "deals", "property_cards"]),
      countFirstWorkingTable(supabase, ["vf_members", "vf_profiles", "profiles", "member_profiles", "members"]),
      countFirstWorkingTable(
        supabase,
        ["vf_buy_bucket", "buy_bucket", "vf_saved_deals", "saved_deals"],
        email
          ? (query) =>
              query.or(
                `member_email.eq.${email},email.eq.${email},user_email.eq.${email},owner_email.eq.${email}`
              )
          : undefined
      ),
      countFirstWorkingTable(
        supabase,
        ["vf_messages", "messages"],
        email
          ? (query) =>
              query.or(
                `sender_email.eq.${email},recipient_email.eq.${email},email.eq.${email}`
              )
          : undefined
      ),
      countFirstWorkingTable(
        supabase,
        ["vf_deals", "deals", "property_cards"],
        (query) => query.or("status.eq.pending,status.eq.review,status.eq.submitted")
      ),
      countFirstWorkingTable(
        supabase,
        ["vf_deals", "deals", "property_cards"],
        (query) => query.or("archived.eq.true,status.eq.archived")
      ),
      countFirstWorkingTable(
        supabase,
        ["vf_members", "vf_profiles", "profiles", "member_profiles", "members"],
        (query) => query.or("access_status.eq.locked,member_status.eq.locked,status.eq.locked")
      ),
      countFirstWorkingTable(
        supabase,
        ["vf_members", "vf_profiles", "profiles", "member_profiles", "members"],
        (query) => query.or("access_status.eq.payment_required,payment_status.eq.unpaid,subscription_status.eq.unpaid")
      ),
      countFirstWorkingTable(
        supabase,
        ["vf_members", "vf_profiles", "profiles", "member_profiles", "members"],
        (query) => query.or("access_status.eq.active,member_status.eq.active,status.eq.active,payment_status.eq.active,subscription_status.eq.active")
      ),
    ]);

    return NextResponse.json({
      ok: true,
      email,
      owner,
      deals: dealsResult.count,
      members: membersResult.count,
      bucket: bucketResult.count,
      messages: messagesResult.count,
      alerts: bucketResult.count + messagesResult.count,
      admin: {
        owner,
        pendingDeals: pendingDealsResult.count,
        archivedDeals: archivedDealsResult.count,
        lockedMembers: lockedMembersResult.count,
        paymentRequiredMembers: paymentMembersResult.count,
        activeMembers: activeMembersResult.count,
      },
      sources: {
        deals: dealsResult.table,
        members: membersResult.table,
        bucket: bucketResult.table,
        messages: messagesResult.table,
      },
    });
  } catch (error: any) {
    return NextResponse.json({
      ok: true,
      deals: 0,
      members: 0,
      bucket: 0,
      messages: 0,
      alerts: 0,
      admin: {
        owner: false,
        pendingDeals: 0,
        archivedDeals: 0,
        lockedMembers: 0,
        paymentRequiredMembers: 0,
        activeMembers: 0,
      },
      warning: error?.message || "Dashboard stats failed.",
    });
  }
}
