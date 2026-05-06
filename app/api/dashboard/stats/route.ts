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
      deals,
      members,
      bucket,
      messages,
      pendingDeals,
      archivedDeals,
      lockedMembers,
      unpaidMembers,
      activeMembers,
    ] = await Promise.all([
      countRows(supabase, "vf_deals"),
      countRows(supabase, "vf_members"),
      countRows(
        supabase,
        "vf_buy_bucket",
        email
          ? (query) =>
              query.or(
                `member_email.eq.${email},buyer_email.eq.${email}`
              )
          : undefined
      ),
      countRows(
        supabase,
        "vf_messages",
        email
          ? (query) =>
              query.or(
                `sender_email.eq.${email},recipient_email.eq.${email}`
              )
          : undefined
      ),
      countRows(
        supabase,
        "vf_deals",
        (query) =>
          query.or("status.eq.pending,status.eq.review,status.eq.submitted")
      ),
      countRows(
        supabase,
        "vf_deals",
        (query) =>
          query.or("archived.eq.true,status.eq.archived")
      ),
      countRows(
        supabase,
        "vf_members",
        (query) =>
          query.or("member_status.eq.locked,is_suspended.eq.true")
      ),
      countRows(
        supabase,
        "vf_members",
        (query) =>
          query.or("payment_status.eq.unpaid,payment_status.eq.inactive")
      ),
      countRows(
        supabase,
        "vf_members",
        (query) =>
          query.or("member_status.eq.active,is_active.eq.true")
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
      alerts: bucket + messages,
      admin: {
        owner,
        pendingDeals,
        archivedDeals,
        lockedMembers,
        paymentRequiredMembers: unpaidMembers,
        activeMembers,
      },
      sources: {
        deals: "vf_deals",
        members: "vf_members",
        bucket: "vf_buy_bucket",
        messages: "vf_messages",
      },
    });
  } catch (error: any) {
    return NextResponse.json({
      ok: false,
      error: error?.message || "Dashboard stats failed.",
    });
  }
}
