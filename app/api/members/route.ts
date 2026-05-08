import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const OWNER_EMAIL = "bcrsoutheast@gmail.com";
const TABLES = ["vf_profiles", "profiles", "member_profiles", "vf_members"];

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

function isAdminRequest(request: Request, body?: any) {
  const url = new URL(request.url);
  const cookie = request.headers.get("cookie") || "";
  const email =
    cleanEmail(request.headers.get("x-vf-email")) ||
    cleanEmail(url.searchParams.get("email")) ||
    cleanEmail(body?.admin_email) ||
    emailFromCookie(cookie);

  const adminFlag =
    clean(request.headers.get("x-vf-admin")) === "1" ||
    clean(url.searchParams.get("owner")) === "1" ||
    cookie.includes("vf_admin=1") ||
    cookie.includes("isAdmin=true");

  return email === OWNER_EMAIL || adminFlag;
}

function firstText(row: any, columns: string[], fallback = "") {
  for (const column of columns) {
    const text = clean(row?.[column]);
    if (text) return text;
  }

  return fallback;
}

function firstBool(row: any, columns: string[]) {
  for (const column of columns) {
    const value = row?.[column];

    if (value === true) return true;
    if (value === false) return false;

    const text = clean(value).toLowerCase();
    if (text === "true" || text === "1" || text === "yes") return true;
    if (text === "false" || text === "0" || text === "no") return false;
  }

  return false;
}

function normalizeMember(row: any, table: string) {
  const email = cleanEmail(
    firstText(row, ["email", "member_email", "user_email", "owner_email", "contact_email"])
  );

  const fullName = firstText(row, ["full_name", "name", "member_name", "display_name", "first_name"]);

  const profileComplete =
    firstBool(row, ["profile_complete", "is_profile_complete"]) ||
    clean(row?.profile_status).toLowerCase() === "complete";

  const paymentStatus = firstText(
    row,
    ["payment_status", "subscription_status", "billing_status"],
    "unpaid"
  ).toLowerCase();

  const accessStatus = firstText(
    row,
    ["access_status", "member_status", "status"],
    "locked"
  ).toLowerCase();

  const suspended =
    firstBool(row, ["is_suspended", "suspended"]) ||
    accessStatus === "suspended" ||
    accessStatus === "disabled";

  const deleted =
    firstBool(row, ["deleted", "is_deleted"]) ||
    accessStatus === "deleted";

  const active =
    !deleted &&
    !suspended &&
    (firstBool(row, ["is_active", "active"]) ||
      accessStatus === "active" ||
      paymentStatus === "paid" ||
      email === OWNER_EMAIL);

  const pending =
    !active &&
    !suspended &&
    !deleted &&
    (profileComplete ||
      accessStatus === "pending" ||
      accessStatus === "locked" ||
      paymentStatus === "unpaid");

  return {
    ...row,
    _source_table: table,
    _source_id: row?.id || row?.auth_user_id || email,
    id: row?.id || row?.auth_user_id || email,
    email,
    full_name: fullName,
    profile_complete: profileComplete,
    payment_status: paymentStatus,
    access_status: email === OWNER_EMAIL ? "active" : accessStatus,
    is_active: email === OWNER_EMAIL ? true : active,
    is_suspended: suspended,
    is_deleted: deleted,
    admin_bucket: deleted
      ? "deleted"
      : suspended
      ? "suspended"
      : active
      ? "active"
      : pending
      ? "pending"
      : "locked",
    created_at: row?.created_at || row?.inserted_at || row?.created || null,
    updated_at: row?.updated_at || row?.modified_at || null,
  };
}

function mergeMembers(rows: any[]) {
  const map = new Map<string, any>();

  for (const row of rows) {
    const email = cleanEmail(row.email);
    const key = email || clean(row.id);
    if (!key) continue;

    const existing = map.get(key);
    if (!existing) {
      map.set(key, row);
      continue;
    }

    const score = (member: any) => {
      let points = 0;
      if (member._source_table === "vf_profiles") points += 5;
      if (member._source_table === "profiles") points += 4;
      if (member.profile_complete) points += 3;
      if (member.created_at) points += 1;
      if (member.updated_at) points += 1;
      return points;
    };

    if (score(row) >= score(existing)) {
      map.set(key, { ...existing, ...row });
    }
  }

  return Array.from(map.values()).sort((a, b) => {
    const aTime = new Date(a.updated_at || a.created_at || 0).getTime();
    const bTime = new Date(b.updated_at || b.created_at || 0).getTime();
    return bTime - aTime;
  });
}

async function loadFromTable(supabase: any, table: string) {
  try {
    const { data, error } = await supabase.from(table).select("*").limit(500);
    if (error || !data) return [];
    return data.map((row: any) => normalizeMember(row, table)).filter((row: any) => row.email);
  } catch {
    return [];
  }
}

async function loadMembers(supabase: any) {
  const results = await Promise.all(TABLES.map((table) => loadFromTable(supabase, table)));
  return mergeMembers(results.flat());
}

function patchForAction(action: string) {
  const now = new Date().toISOString();

  if (action === "activate") {
    return {
      access_status: "active",
      member_status: "active",
      is_active: true,
      is_suspended: false,
      payment_status: "paid",
      profile_complete: true,
      updated_at: now,
    };
  }

  if (action === "mark_paid" || action === "paid") {
    return {
      payment_status: "paid",
      subscription_status: "active",
      access_status: "active",
      member_status: "active",
      is_active: true,
      is_suspended: false,
      updated_at: now,
    };
  }

  if (action === "mark_unpaid" || action === "unpaid") {
    return {
      payment_status: "unpaid",
      subscription_status: "inactive",
      access_status: "locked",
      member_status: "locked",
      is_active: false,
      updated_at: now,
    };
  }

  if (action === "lock") {
    return {
      access_status: "locked",
      member_status: "locked",
      is_active: false,
      updated_at: now,
    };
  }

  if (action === "suspend") {
    return {
      access_status: "suspended",
      member_status: "suspended",
      is_active: false,
      is_suspended: true,
      updated_at: now,
    };
  }

  if (action === "delete") {
    return {
      access_status: "deleted",
      member_status: "deleted",
      is_active: false,
      is_suspended: true,
      deleted: true,
      updated_at: now,
    };
  }

  if (action === "restore") {
    return {
      access_status: "locked",
      member_status: "locked",
      is_active: false,
      is_suspended: false,
      deleted: false,
      updated_at: now,
    };
  }

  return null;
}

async function tryUpdateTable(supabase: any, table: string, email: string, id: string, patch: Record<string, any>) {
  const attempts = [];

  if (email) {
    attempts.push(supabase.from(table).update(patch).eq("email", email).select("*").maybeSingle());
    attempts.push(supabase.from(table).update(patch).eq("member_email", email).select("*").maybeSingle());
  }

  if (id) {
    attempts.push(supabase.from(table).update(patch).eq("id", id).select("*").maybeSingle());
    attempts.push(supabase.from(table).update(patch).eq("auth_user_id", id).select("*").maybeSingle());
  }

  for (const attempt of attempts) {
    try {
      const { data, error } = await attempt;
      if (!error && data) return { ok: true, data, table };
    } catch {
      // Try next attempt.
    }
  }

  return { ok: false, data: null, table };
}

async function updateMember(supabase: any, email: string, id: string, action: string) {
  const patch = patchForAction(action);

  if (!patch) throw new Error("Unknown member action.");

  if (email === OWNER_EMAIL && ["delete", "suspend", "lock"].includes(action)) {
    throw new Error("Owner account cannot be locked, suspended, or deleted.");
  }

  for (const table of TABLES) {
    const result = await tryUpdateTable(supabase, table, email, id, patch);
    if (result.ok) {
      return {
        table,
        row: normalizeMember(result.data, table),
      };
    }
  }

  const fallbackTable = "vf_profiles";
  const fallbackPayload = { email, ...patch };

  try {
    const { data, error } = await supabase
      .from(fallbackTable)
      .upsert(fallbackPayload, { onConflict: "email" })
      .select("*")
      .single();

    if (!error && data) {
      return {
        table: fallbackTable,
        row: normalizeMember(data, fallbackTable),
      };
    }
  } catch {
    // Continue to error.
  }

  throw new Error("Could not update member in known member/profile tables.");
}

async function logActivity(supabase: any, payload: Record<string, any>) {
  try {
    await supabase.from("vf_activity_events").insert(payload);
  } catch {
    // Best effort only.
  }
}

export async function GET(request: Request) {
  try {
    if (!isAdminRequest(request)) {
      return NextResponse.json({ ok: false, error: "Admin access required." }, { status: 403 });
    }

    const supabase = supabaseClient();
    const members = await loadMembers(supabase);

    return NextResponse.json({
      ok: true,
      members,
      counts: {
        total: members.length,
        pending: members.filter((member) => member.admin_bucket === "pending").length,
        active: members.filter((member) => member.admin_bucket === "active").length,
        suspended: members.filter((member) => member.admin_bucket === "suspended").length,
        deleted: members.filter((member) => member.admin_bucket === "deleted").length,
        locked: members.filter((member) => member.admin_bucket === "locked").length,
      },
      sources_checked: TABLES,
      source: "admin_members_unified",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: "Could not load admin members.",
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));

    if (!isAdminRequest(request, body)) {
      return NextResponse.json({ ok: false, error: "Admin access required." }, { status: 403 });
    }

    const email = cleanEmail(body?.email || body?.member_email);
    const id = clean(body?.id || body?.member_id || body?.auth_user_id);
    const action = clean(body?.action).toLowerCase();

    if (!email && !id) return NextResponse.json({ ok: false, error: "Missing member email or id." }, { status: 400 });
    if (!action) return NextResponse.json({ ok: false, error: "Missing member action." }, { status: 400 });

    const supabase = supabaseClient();
    const result = await updateMember(supabase, email, id, action);

    await logActivity(supabase, {
      event_type: `admin_member_${action}`,
      event_title: `Admin member ${action}`,
      event_description: `Admin performed ${action} on ${email || id}.`,
      member_email: email || null,
      visibility: "admin",
      metadata: {
        action,
        email,
        id,
        table: result.table,
      },
    });

    return NextResponse.json({
      ok: true,
      action,
      updated: result.row,
      table: result.table,
      message: `Member ${action} complete.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: "Admin member action failed.",
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
