import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const OWNER_EMAIL = "bcrsoutheast@gmail.com";
const TABLES = ["vf_profiles", "profiles", "member_profiles", "vf_members"];

type AnyRow = Record<string, any>;

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

function decodeCookieValue(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function cookieValue(cookieHeader: string, name: string) {
  const parts = cookieHeader.split(";").map((part) => part.trim());

  for (const part of parts) {
    if (!part.startsWith(`${name}=`)) continue;
    return decodeCookieValue(part.slice(name.length + 1));
  }

  return "";
}

function emailFromRequest(request: Request, body?: AnyRow) {
  const url = new URL(request.url);
  const cookie = request.headers.get("cookie") || "";

  return cleanEmail(
    request.headers.get("x-vf-email") ||
      url.searchParams.get("email") ||
      body?.admin_email ||
      body?.owner_email ||
      cookieValue(cookie, "vf_email") ||
      cookieValue(cookie, "vf_admin_email")
  );
}

function isAdminRequest(request: Request, body?: AnyRow) {
  const url = new URL(request.url);
  const cookie = request.headers.get("cookie") || "";
  const email = emailFromRequest(request, body);

  const adminFlag =
    clean(request.headers.get("x-vf-admin")) === "1" ||
    clean(url.searchParams.get("owner")) === "1" ||
    cookie.includes("vf_admin=1") ||
    cookie.includes("isAdmin=true");

  return email === OWNER_EMAIL || adminFlag;
}

function firstText(row: AnyRow, columns: string[], fallback = "") {
  for (const column of columns) {
    const text = clean(row?.[column]);
    if (text) return text;
  }

  return fallback;
}

function firstBool(row: AnyRow, columns: string[]) {
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

function normalizeMember(row: AnyRow, table: string) {
  const email = cleanEmail(
    firstText(row, [
      "email",
      "member_email",
      "user_email",
      "owner_email",
      "contact_email",
    ])
  );

  const fullName = firstText(row, [
    "full_name",
    "name",
    "member_name",
    "display_name",
    "first_name",
  ]);

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
    accessStatus === "deleted" ||
    accessStatus === "removed";

  const active =
    !deleted &&
    !suspended &&
    (firstBool(row, ["is_active", "active"]) ||
      accessStatus === "active" ||
      paymentStatus === "paid" ||
      paymentStatus === "active" ||
      email === OWNER_EMAIL);

  const pending =
    !active &&
    !suspended &&
    !deleted &&
    (profileComplete ||
      accessStatus === "pending" ||
      accessStatus === "locked" ||
      paymentStatus === "unpaid" ||
      paymentStatus === "inactive" ||
      paymentStatus === "past_due");

  return {
    ...row,
    _source_table: table,
    _source_id: row?.id || row?.profile_id || row?.member_id || row?.auth_user_id || email,
    id: row?.id || row?.profile_id || row?.member_id || row?.auth_user_id || email,
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

function mergeMembers(rows: AnyRow[]) {
  const map = new Map<string, AnyRow>();

  for (const row of rows) {
    const email = cleanEmail(row.email);
    const key = email || clean(row.id) || clean(row._source_id);

    if (!key) continue;

    const existing = map.get(key);

    if (!existing) {
      map.set(key, row);
      continue;
    }

    const score = (member: AnyRow) => {
      let points = 0;
      if (member._source_table === "vf_profiles") points += 7;
      if (member._source_table === "profiles") points += 5;
      if (member._source_table === "member_profiles") points += 4;
      if (member.profile_complete) points += 3;
      if (member.email && !String(member.email).endsWith("@example.com")) points += 2;
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

    return data
      .map((row: AnyRow) => normalizeMember(row, table))
      .filter((row: AnyRow) => row.email);
  } catch {
    return [];
  }
}

async function loadMembers(supabase: any) {
  const results = await Promise.all(TABLES.map((table) => loadFromTable(supabase, table)));
  return mergeMembers(results.flat());
}

function actionMessage(action: string) {
  if (action === "activate") return "Member activated.";
  if (action === "mark_paid" || action === "paid") return "Member marked paid and activated.";
  if (action === "mark_unpaid" || action === "unpaid") return "Member marked unpaid and locked.";
  if (action === "lock") return "Member locked.";
  if (action === "suspend") return "Member suspended.";
  if (action === "delete") return "Member deleted.";
  if (action === "restore") return "Member restored to locked status.";
  return "Member action complete.";
}

function fullPatchForAction(action: string) {
  const now = new Date().toISOString();

  if (action === "activate") {
    return {
      access_status: "active",
      member_status: "active",
      status: "active",
      is_active: true,
      active: true,
      is_suspended: false,
      suspended: false,
      payment_status: "paid",
      subscription_status: "active",
      billing_status: "active",
      profile_complete: true,
      profile_status: "complete",
      updated_at: now,
    };
  }

  if (action === "mark_paid" || action === "paid") {
    return {
      payment_status: "paid",
      subscription_status: "active",
      billing_status: "active",
      access_status: "active",
      member_status: "active",
      status: "active",
      is_active: true,
      active: true,
      is_suspended: false,
      suspended: false,
      updated_at: now,
    };
  }

  if (action === "mark_unpaid" || action === "unpaid") {
    return {
      payment_status: "unpaid",
      subscription_status: "inactive",
      billing_status: "inactive",
      access_status: "locked",
      member_status: "locked",
      status: "locked",
      is_active: false,
      active: false,
      updated_at: now,
    };
  }

  if (action === "lock") {
    return {
      access_status: "locked",
      member_status: "locked",
      status: "locked",
      is_active: false,
      active: false,
      updated_at: now,
    };
  }

  if (action === "suspend") {
    return {
      access_status: "suspended",
      member_status: "suspended",
      status: "suspended",
      is_active: false,
      active: false,
      is_suspended: true,
      suspended: true,
      updated_at: now,
    };
  }

  if (action === "delete") {
    return {
      access_status: "deleted",
      member_status: "deleted",
      status: "deleted",
      is_active: false,
      active: false,
      is_suspended: true,
      suspended: true,
      deleted: true,
      is_deleted: true,
      updated_at: now,
    };
  }

  if (action === "restore") {
    return {
      access_status: "locked",
      member_status: "locked",
      status: "locked",
      is_active: false,
      active: false,
      is_suspended: false,
      suspended: false,
      deleted: false,
      is_deleted: false,
      updated_at: now,
    };
  }

  return null;
}

function compactPatch(patch: AnyRow, allowed: string[]) {
  const next: AnyRow = {};

  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(patch, key)) {
      next[key] = patch[key];
    }
  }

  return next;
}

function patchVariants(action: string) {
  const full = fullPatchForAction(action);

  if (!full) return [];

  return [
    full,
    compactPatch(full, [
      "access_status",
      "payment_status",
      "profile_complete",
      "is_active",
      "is_suspended",
      "deleted",
      "updated_at",
    ]),
    compactPatch(full, [
      "member_status",
      "payment_status",
      "profile_complete",
      "is_active",
      "is_suspended",
      "deleted",
      "updated_at",
    ]),
    compactPatch(full, [
      "status",
      "payment_status",
      "active",
      "suspended",
      "deleted",
      "updated_at",
    ]),
    compactPatch(full, [
      "access_status",
      "payment_status",
      "updated_at",
    ]),
    compactPatch(full, [
      "member_status",
      "payment_status",
      "updated_at",
    ]),
    compactPatch(full, [
      "status",
      "payment_status",
      "updated_at",
    ]),
    compactPatch(full, [
      "payment_status",
      "updated_at",
    ]),
    compactPatch(full, [
      "payment_status",
    ]),
  ].filter((patch) => Object.keys(patch).length > 0);
}

function matchColumns(email: string, id: string) {
  const matches: { column: string; value: string }[] = [];

  if (email) {
    matches.push({ column: "email", value: email });
    matches.push({ column: "member_email", value: email });
    matches.push({ column: "user_email", value: email });
    matches.push({ column: "owner_email", value: email });
    matches.push({ column: "contact_email", value: email });
  }

  if (id) {
    matches.push({ column: "id", value: id });
    matches.push({ column: "profile_id", value: id });
    matches.push({ column: "member_id", value: id });
    matches.push({ column: "auth_user_id", value: id });
  }

  return matches;
}

async function tryUpdateOne(
  supabase: any,
  table: string,
  match: { column: string; value: string },
  patch: AnyRow
) {
  try {
    const { data, error } = await supabase
      .from(table)
      .update(patch)
      .eq(match.column, match.value)
      .select("*")
      .maybeSingle();

    if (!error && data) {
      return { ok: true, data, error: "" };
    }

    return { ok: false, data: null, error: error?.message || "No matching row." };
  } catch (error: any) {
    return { ok: false, data: null, error: error?.message || String(error) };
  }
}

async function updateMember(supabase: any, email: string, id: string, action: string) {
  const variants = patchVariants(action);

  if (!variants.length) {
    throw new Error("Unknown member action.");
  }

  if (email === OWNER_EMAIL && ["delete", "suspend", "lock", "mark_unpaid", "unpaid"].includes(action)) {
    throw new Error("Owner account cannot be locked, suspended, marked unpaid, or deleted.");
  }

  const matches = matchColumns(email, id);
  const errors: string[] = [];

  for (const table of TABLES) {
    for (const match of matches) {
      for (const patch of variants) {
        const result = await tryUpdateOne(supabase, table, match, patch);

        if (result.ok) {
          return {
            table,
            row: normalizeMember(result.data, table),
            patch_keys: Object.keys(patch),
            matched_on: match.column,
          };
        }

        if (result.error && errors.length < 12) {
          errors.push(`${table}.${match.column}: ${result.error}`);
        }
      }
    }
  }

  throw new Error(
    errors.length
      ? `No member row updated. Last checked: ${errors.join(" | ")}`
      : "No member row updated."
  );
}

async function logActivity(supabase: any, payload: AnyRow) {
  try {
    await supabase.from("vf_activity_events").insert(payload);
  } catch {
    // Best effort only. Do not block member actions because logging failed.
  }
}


function hasRealEmail(row: AnyRow) {
  const email = cleanEmail(row.email || row.member_email);
  return email.includes("@") && !email.endsWith("@example.com") && email !== "test@test.com";
}

function safeNetworkMember(member: AnyRow) {
  const metadata =
    member && typeof member.metadata === "object" && member.metadata ? member.metadata : {};

  const baseState =
    member.home_state ||
    member.based_state ||
    member.base_state ||
    member.from_state ||
    member.member_state ||
    member.primary_state ||
    member.location_state ||
    member.state ||
    member.market_primary ||
    member.primary_market ||
    metadata.home_state ||
    metadata.based_state ||
    metadata.base_state ||
    metadata.from_state ||
    metadata.member_state ||
    metadata.primary_state ||
    metadata.location_state ||
    metadata.state ||
    metadata.market_primary ||
    metadata.primary_market ||
    "";

  return {
    id: member.id || member._source_id || member.email,
    email: member.email,
    full_name: member.full_name || member.name || member.member_name || member.display_name || "",
    name: member.full_name || member.name || member.member_name || member.display_name || "",
    company: member.company || member.company_name || member.business_name || member.organization || member.firm || "",
    company_name: member.company_name || member.company || member.business_name || member.organization || member.firm || "",
    headline: member.headline || member.tagline || member.bio || member.about || member.summary || "",
    bio: member.bio || member.about || member.summary || member.notes || "",

    home_state: baseState,
    based_state: baseState,
    base_state: baseState,
    from_state: baseState,
    member_state: baseState,
    primary_state: baseState,
    location_state: baseState,
    state: baseState,

    member_type: member.member_type || member.member_types || member.roles || member.role || member.primary_role || "",
    member_types: member.member_types || member.member_type || member.roles || member.role || member.primary_role || "",
    roles: member.roles || member.member_types || member.member_type || member.role || member.primary_role || "",

    markets: member.markets || member.market_states || member.buy_box_states || member.states || member.state || "",
    states: member.states || member.market_states || member.buy_box_states || member.markets || member.state || "",
    buy_box_states: member.buy_box_states || member.market_states || member.markets || member.states || member.state || "",

    strategies: member.strategies || member.strategy || member.buy_box_strategies || member.exit_strategy || "",
    buy_box_strategies: member.buy_box_strategies || member.strategies || member.strategy || member.exit_strategy || "",

    asset_types: member.asset_types || member.property_types || member.buy_box_types || member.property_type || member.deal_type || "",
    property_types: member.property_types || member.asset_types || member.buy_box_types || member.property_type || member.deal_type || "",
    buy_box_types: member.buy_box_types || member.asset_types || member.property_types || member.property_type || member.deal_type || "",

    needs: member.needs || member.deal_needs || member.what_i_need || member.routing_needs || member.help_needed || "",
    provides: member.provides || member.can_provide || member.what_i_provide || member.services || member.capabilities || "",
    can_provide: member.can_provide || member.provides || member.what_i_provide || member.services || member.capabilities || "",

    profile_complete: Boolean(member.profile_complete),
    access_status: member.access_status === "active" ? "active" : "member",
    admin_bucket: member.admin_bucket === "active" ? "active" : "network",
    is_active: Boolean(member.is_active),
    created_at: member.created_at || null,
    updated_at: member.updated_at || null,
    _source_table: member._source_table || "member_directory",
  };
}

function directoryMembersForRequester(members: AnyRow[], requesterEmail: string) {
  return members
    .filter(hasRealEmail)
    .filter((member) => {
      if (member.email === OWNER_EMAIL) return false;
      if (member.is_deleted || member.is_suspended) return false;
      if (member.admin_bucket === "deleted" || member.admin_bucket === "suspended") return false;

      // Show active/profile-complete network records, plus the requester so their directory does not look empty.
      return (
        member.email === requesterEmail ||
        member.admin_bucket === "active" ||
        member.is_active ||
        member.profile_complete
      );
    })
    .map(safeNetworkMember);
}


export async function GET(request: Request) {
  try {
    const requesterEmail = emailFromRequest(request);
    const admin = isAdminRequest(request);

    if (!requesterEmail) {
      return NextResponse.json(
        { ok: false, error: "Login email required.", members: [] },
        { status: 401 }
      );
    }

    const supabase = supabaseClient();
    const members = await loadMembers(supabase);

    if (!admin) {
      const safeMembers = directoryMembersForRequester(members, requesterEmail);

      return NextResponse.json({
        ok: true,
        owner: false,
        mode: "member_network_directory",
        members: safeMembers,
        counts: {
          total: safeMembers.length,
          pending: 0,
          active: safeMembers.filter((member) => member.admin_bucket === "active").length,
          suspended: 0,
          deleted: 0,
          locked: 0,
        },
        sources_checked: TABLES,
        source: "member_network_directory",
        message: "Member-safe network directory loaded. Admin controls and destructive fields are hidden.",
      });
    }

    return NextResponse.json({
      ok: true,
      owner: true,
      mode: "owner_admin_members",
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
      message: "Real members loaded from admin member tables.",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: "Could not load members.",
        details: error?.message || String(error),
        members: [],
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));

    if (!isAdminRequest(request, body)) {
      return NextResponse.json({ ok: false, error: "Owner admin access required." }, { status: 403 });
    }

    const email = cleanEmail(body?.email || body?.member_email);
    const id = clean(body?.id || body?.member_id || body?.auth_user_id);
    const action = clean(body?.action).toLowerCase();

    if (!email && !id) {
      return NextResponse.json({ ok: false, error: "Missing member email or id." }, { status: 400 });
    }

    if (!action) {
      return NextResponse.json({ ok: false, error: "Missing member action." }, { status: 400 });
    }

    const supabase = supabaseClient();
    const result = await updateMember(supabase, email, id, action);

    await logActivity(supabase, {
      event_type: `admin_member_${action}`,
      event_title: `Admin member ${action}`,
      event_description: `Owner admin performed ${action} on ${email || id}.`,
      member_email: email || null,
      visibility: "admin",
      metadata: {
        action,
        email,
        id,
        table: result.table,
        matched_on: result.matched_on,
        patch_keys: result.patch_keys,
      },
    });

    return NextResponse.json({
      ok: true,
      action,
      updated: result.row,
      table: result.table,
      matched_on: result.matched_on,
      patch_keys: result.patch_keys,
      message: actionMessage(action),
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