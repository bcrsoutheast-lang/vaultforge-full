import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

async function countFirstWorkingTable(
  supabase: any,
  tableNames: string[],
  filter?: (query: any) => any
) {
  for (const table of tableNames) {
    try {
      let query = supabase
        .from(table)
        .select("*", { count: "exact", head: true });

      if (filter) {
        query = filter(query);
      }

      const { count, error } = await query;

      if (!error) {
        return Number(count || 0);
      }
    } catch {
      // Try next possible table name.
    }
  }

  return 0;
}

function cleanEmail(value: unknown) {
  return String(value || "").trim().toLowerCase();
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
        warning: "Supabase environment values are missing.",
      });
    }

    const url = new URL(request.url);
    const email =
      cleanEmail(request.headers.get("x-vf-email")) ||
      cleanEmail(url.searchParams.get("email")) ||
      emailFromCookie(request.headers.get("cookie") || "");

    const [deals, members, bucket, messages] = await Promise.all([
      countFirstWorkingTable(supabase, ["vf_deals", "deals", "property_cards"]),
      countFirstWorkingTable(supabase, ["vf_profiles", "profiles", "member_profiles", "members"]),
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
    ]);

    return NextResponse.json({
      ok: true,
      deals,
      members,
      bucket,
      messages,
      alerts: bucket + messages,
    });
  } catch (error: any) {
    return NextResponse.json({
      ok: true,
      deals: 0,
      members: 0,
      bucket: 0,
      messages: 0,
      alerts: 0,
      warning: error?.message || "Dashboard stats failed.",
    });
  }
}
