import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const OWNER_EMAIL = "bcrsoutheast@gmail.com";

type AnyRecord = Record<string, any>;

const MEMBER_TABLES = [
  "vf_profiles",
  "vf_members",
  "profiles",
  "member_profiles",
];

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

function truthy(value: unknown) {
  if (value === true) return true;

  const text = clean(value).toLowerCase();

  return ["true", "1", "yes", "active", "complete", "completed", "paid"].includes(text);
}

function loweredFirst(...values: unknown[]) {
  for (const value of values) {
    const text = clean(value).toLowerCase();
    if (text) return text;
  }

  return "";
}

async function findByEmail(
  supabase: any,
  table: string,
  email: string,
  columns: string[]
): Promise<AnyRecord | null> {
  if (!email) return null;

  for (const column of columns) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select("*")
        .eq(column, email)
        .maybeSingle();

      if (!error && data) {
        return {
          ...data,
          _source_table: table,
        };
      }
    } catch {
      // Try next possible canonical email column.
    }
  }

  return null;
}

function mergeRecords(records: AnyRecord[]) {
  return records.reduce((acc, record) => {
    return { ...acc, ...record };
  }, {});
}

function memberPaymentStatus(member: AnyRecord | null) {
  return loweredFirst(
    member?.payment_status,
    member?.subscription_status,
    member?.billing_status,
    member?.stripe_status,
    member?.status
  );
}

function memberAccessStatus(member: AnyRecord | null) {
  return loweredFirst(
    member?.access_status,
    member?.member_status,
    member?.account_status,
    member?.status
  );
}

function isMemberPaid(member: AnyRecord | null) {
  const paymentStatus = memberPaymentStatus(member);
  const accessStatus = memberAccessStatus(member);

  return (
    truthy(member?.paid) ||
    truthy(member?.is_paid) ||
    truthy(member?.is_active) ||
    paymentStatus === "paid" ||
    paymentStatus === "active" ||
    paymentStatus === "trialing" ||
    accessStatus === "active" ||
    accessStatus === "approved"
  );
}

function isMemberBlocked(member: AnyRecord | null) {
  const accessStatus = memberAccessStatus(member);

  return (
    truthy(member?.is_suspended) ||
    truthy(member?.suspended) ||
    truthy(member?.locked) ||
    ["locked", "suspended", "removed", "deleted", "inactive"].includes(accessStatus)
  );
}

function isProfileComplete(profile: AnyRecord | null) {
  return (
    truthy(profile?.profile_complete) ||
    truthy(profile?.is_complete) ||
    truthy(profile?.completed) ||
    truthy(profile?.onboarding_complete) ||
    loweredFirst(profile?.profile_status) === "complete"
  );
}

export async function GET(request: Request) {
  try {
    const supabase = supabaseClient();
    const email = requestEmail(request);
    const owner = email === OWNER_EMAIL;

    if (owner) {
      return NextResponse.json({
        ok: true,
        email,
        owner: true,
        profile_complete: true,
        payment_status: "owner",
        access_status: "active",
        paid: true,
        unlocked: true,
        next_step: "owner_access",
        member: {
          email,
          owner: true,
        },
        profile: {
          email,
          owner: true,
          profile_complete: true,
        },
        sources_checked: ["owner_email"],
      });
    }

    if (!email) {
      return NextResponse.json({
        ok: true,
        email: "",
        owner: false,
        profile_complete: false,
        payment_status: "unpaid",
        access_status: "locked",
        paid: false,
        unlocked: false,
        next_step: "login",
        member: null,
        profile: null,
        warning: "No VaultForge email was found in the request.",
        sources_checked: MEMBER_TABLES,
      });
    }

    if (!supabase) {
      return NextResponse.json({
        ok: true,
        email,
        owner: false,
        profile_complete: false,
        payment_status: "unpaid",
        access_status: "locked",
        paid: false,
        unlocked: false,
        next_step: "complete_profile",
        member: null,
        profile: null,
        warning: "Supabase environment values are missing.",
        sources_checked: MEMBER_TABLES,
      });
    }

    const results = await Promise.all(
      MEMBER_TABLES.map((table) =>
        findByEmail(
          supabase,
          table,
          email,
          ["email", "member_email", "user_email", "owner_email"]
        )
      )
    );

    const found = results.filter(Boolean) as AnyRecord[];

    const combined = found.length ? mergeRecords(found) : null;

    const profileComplete = isProfileComplete(combined);
    const blocked = isMemberBlocked(combined);

    const paymentStatus = memberPaymentStatus(combined) || "unpaid";

    const accessStatus = blocked
      ? "locked"
      : memberAccessStatus(combined) || "locked";

    const paid = !blocked && isMemberPaid(combined);

    const unlocked = Boolean(
      profileComplete &&
        paid &&
        !blocked
    );

    return NextResponse.json({
      ok: true,
      email,
      owner: false,
      profile_complete: profileComplete,
      payment_status: paymentStatus,
      access_status: accessStatus,
      paid,
      unlocked,
      next_step: !profileComplete
        ? "complete_profile"
        : !paid
        ? "payment"
        : "unlocked",
      member: combined || null,
      profile: combined || null,
      matched_records: found.length,
      sources_checked: MEMBER_TABLES,
    });
  } catch (error: any) {
    return NextResponse.json({
      ok: true,
      email: "",
      owner: false,
      profile_complete: false,
      payment_status: "unpaid",
      access_status: "locked",
      paid: false,
      unlocked: false,
      next_step: "complete_profile",
      member: null,
      profile: null,
      warning: error?.message || String(error),
      sources_checked: MEMBER_TABLES,
    });
  }
}
