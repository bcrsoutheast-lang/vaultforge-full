import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const OWNER_EMAIL = "bcrsoutheast@gmail.com";

type AnyRecord = Record<string, any>;

const MEMBER_TABLES = [
  "vf_profiles",
  "profiles",
  "member_profiles",
  "vf_members",
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

function asArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => clean(item)).filter(Boolean);
  }

  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value);

      if (Array.isArray(parsed)) {
        return parsed.map((item) => clean(item)).filter(Boolean);
      }
    } catch {
      // Continue to comma split.
    }

    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function truthy(value: unknown) {
  if (value === true) return true;

  const text = clean(value).toLowerCase();

  return ["true", "1", "yes", "active", "complete", "completed", "paid", "approved"].includes(text);
}

function loweredFirst(...values: unknown[]) {
  for (const value of values) {
    const text = clean(value).toLowerCase();
    if (text) return text;
  }

  return "";
}

function firstText(...values: unknown[]) {
  for (const value of values) {
    const text = clean(value);
    if (text) return text;
  }

  return "";
}

function rowEmail(row: AnyRecord) {
  return cleanEmail(
    row?.email ||
      row?.member_email ||
      row?.user_email ||
      row?.owner_email ||
      row?.contact_email
  );
}

async function findByEmail(
  supabase: any,
  table: string,
  email: string
): Promise<AnyRecord[]> {
  if (!email) return [];

  const rows: AnyRecord[] = [];

  for (const column of ["email", "member_email", "user_email", "owner_email", "contact_email"]) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select("*")
        .eq(column, email)
        .limit(10);

      if (!error && Array.isArray(data)) {
        rows.push(...data.map((row) => ({ ...row, _source_table: table })));
      }
    } catch {
      // Try next possible email column.
    }
  }

  const seen = new Set<string>();

  return rows.filter((row) => {
    const key = clean(row.id || row.profile_id || row.member_id || row.auth_user_id || `${table}-${rowEmail(row)}-${row.updated_at}`);
    if (!key) return true;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function mergeRows(rows: AnyRecord[]) {
  if (!rows.length) return null;

  const sorted = [...rows].sort((a, b) => {
    const tableScore = (row: AnyRecord) => {
      if (row._source_table === "vf_profiles") return 100;
      if (row._source_table === "profiles") return 80;
      if (row._source_table === "member_profiles") return 70;
      if (row._source_table === "vf_members") return 60;
      return 0;
    };

    const time = (row: AnyRecord) =>
      new Date(row.updated_at || row.modified_at || row.created_at || row.inserted_at || 0).getTime() / 10000000000000;

    return (tableScore(b) + time(b)) - (tableScore(a) + time(a));
  });

  const merged = rows.reduce((acc, row) => ({ ...acc, ...row }), sorted[0] || {});

  const mergedEmail = cleanEmail(
    merged.email ||
      merged.member_email ||
      merged.user_email ||
      merged.owner_email ||
      rows.map(rowEmail).find(Boolean)
  );

  const memberTypes = rows.flatMap((row) =>
    asArray(row.member_types || row.roles || row.role || row.member_role || row.member_type)
  );

  const buyBoxStates = rows.flatMap((row) =>
    asArray(row.buy_box_states || row.market_states || row.markets || row.state)
  );

  const buyBoxTypes = rows.flatMap((row) =>
    asArray(row.buy_box_types || row.property_types || row.asset_types)
  );

  const strategies = rows.flatMap((row) =>
    asArray(row.buy_box_strategies || row.strategies || row.strategy)
  );

  const needs = rows.flatMap((row) =>
    asArray(row.needs || row.deal_needs || row.what_i_need)
  );

  const canProvide = rows.flatMap((row) =>
    asArray(row.can_provide || row.what_i_provide)
  );

  return {
    ...merged,
    email: mergedEmail,
    member_types: Array.from(new Set(memberTypes)),
    buy_box_states: Array.from(new Set(buyBoxStates)),
    buy_box_types: Array.from(new Set(buyBoxTypes)),
    buy_box_strategies: Array.from(new Set(strategies)),
    needs: Array.from(new Set(needs)),
    can_provide: Array.from(new Set(canProvide)),
    _sources_checked: rows.map((row) => row._source_table),
  };
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
    truthy(member?.deleted) ||
    truthy(member?.is_deleted) ||
    ["suspended", "removed", "deleted", "inactive", "disabled"].includes(accessStatus)
  );
}

function hasSmartProfileData(profile: AnyRecord | null) {
  if (!profile) return false;

  const smartCount = [
    asArray(profile.member_types).length,
    asArray(profile.buy_box_states).length,
    asArray(profile.buy_box_types).length,
    asArray(profile.buy_box_strategies).length,
    asArray(profile.needs).length,
    asArray(profile.can_provide).length,
  ].filter(Boolean).length;

  return smartCount >= 2;
}

function isProfileComplete(profile: AnyRecord | null) {
  if (!profile) return false;

  const status = loweredFirst(profile.profile_status, profile.status);

  if (
    truthy(profile.profile_complete) ||
    truthy(profile.is_complete) ||
    truthy(profile.completed) ||
    truthy(profile.onboarding_complete) ||
    status === "complete" ||
    status === "completed"
  ) {
    return true;
  }

  const fullName = firstText(profile.full_name, profile.fullName, profile.name);
  const phone = firstText(profile.phone);
  const role = firstText(profile.role, profile.member_role, asArray(profile.member_types)[0]);
  const city = firstText(profile.city);
  const state = firstText(profile.state, asArray(profile.buy_box_states)[0]);

  if (fullName && phone && role && city && state) return true;

  return hasSmartProfileData(profile) && Boolean(firstText(profile.email));
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
        matched_records: 1,
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
        matched_records: 0,
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
        matched_records: 0,
        sources_checked: MEMBER_TABLES,
      });
    }

    const allRowsNested = await Promise.all(
      MEMBER_TABLES.map((table) => findByEmail(supabase, table, email))
    );

    const rows = allRowsNested.flat();
    const combined = mergeRows(rows);

    const blocked = isMemberBlocked(combined);
    const profileComplete = isProfileComplete(combined);

    const paymentStatus = memberPaymentStatus(combined) || "unpaid";

    const accessStatus = blocked
      ? "locked"
      : memberAccessStatus(combined) || "locked";

    const paid = !blocked && isMemberPaid(combined);

    const unlocked = Boolean(profileComplete && paid && !blocked);

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
      matched_records: rows.length,
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
      matched_records: 0,
      sources_checked: MEMBER_TABLES,
    });
  }
}
