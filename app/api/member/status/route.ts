import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const OWNER_EMAIL = "bcrsoutheast@gmail.com";

function clean(value: unknown) {
  return String(value || "").trim();
}

function cleanEmail(value: unknown) {
  return clean(value).toLowerCase();
}

function getSupabase() {
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
    },
  });
}

function getRequesterEmail(request: Request, body: any) {
  const cookieHeader = request.headers.get("cookie") || "";
  const cookieEmail =
    cookieHeader
      .split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith("vf_email="))
      ?.replace("vf_email=", "") || "";

  return cleanEmail(
    request.headers.get("x-vf-email") ||
      request.headers.get("x-email") ||
      body?.requester_email ||
      body?.admin_email ||
      cookieEmail
  );
}

function isOwnerRequest(request: Request, body: any) {
  const requesterEmail = getRequesterEmail(request, body);
  const cookieHeader = (request.headers.get("cookie") || "").toLowerCase();

  return (
    requesterEmail === OWNER_EMAIL ||
    cookieHeader.includes("vf_admin=1") ||
    cookieHeader.includes("isadmin=true") ||
    cookieHeader.includes("bcrsoutheast%40gmail.com")
  );
}

function normalizeAction(value: unknown) {
  const action = clean(value).toLowerCase();

  if (["activate", "active", "unlock", "approve"].includes(action)) return "active";
  if (["suspend", "suspended", "lock", "locked", "disable"].includes(action)) return "suspended";
  if (["payment_required", "unpaid", "payment"].includes(action)) return "payment_required";
  if (["profile_required", "incomplete", "profile"].includes(action)) return "profile_required";

  return action || "active";
}

function statusPayloadFor(action: string) {
  if (action === "active") {
    return [
      { access_status: "active", member_status: "active", payment_status: "active", suspended: false, is_active: true },
      { access_status: "active", member_status: "active", payment_status: "active" },
      { access_status: "active", member_status: "active" },
      { member_status: "active" },
      { access_status: "active" },
    ];
  }

  if (action === "suspended") {
    return [
      { access_status: "suspended", member_status: "suspended", suspended: true, is_active: false },
      { access_status: "suspended", member_status: "suspended" },
      { member_status: "suspended" },
      { access_status: "suspended" },
    ];
  }

  if (action === "payment_required") {
    return [
      { access_status: "payment_required", member_status: "payment_required", payment_status: "unpaid", suspended: false, is_active: false },
      { access_status: "payment_required", member_status: "payment_required", payment_status: "unpaid" },
      { access_status: "payment_required", member_status: "payment_required" },
      { member_status: "payment_required" },
      { access_status: "payment_required" },
    ];
  }

  if (action === "profile_required") {
    return [
      { access_status: "profile_required", member_status: "profile_required", suspended: false, is_active: false },
      { access_status: "profile_required", member_status: "profile_required" },
      { member_status: "profile_required" },
      { access_status: "profile_required" },
    ];
  }

  return [
    { access_status: action, member_status: action },
    { member_status: action },
    { access_status: action },
  ];
}

async function updateMember(table: string, memberId: string, memberEmail: string, action: string) {
  const supabase = getSupabase();
  const attempts = statusPayloadFor(action);
  let lastError = "";

  for (const payload of attempts) {
    let query = supabase.from(table).update(payload).select("*");

    if (memberId) {
      query = query.eq("id", memberId);
    } else {
      query = query.eq("email", memberEmail);
    }

    const { data, error } = await query;

    if (!error) {
      return {
        ok: true,
        table,
        member: Array.isArray(data) ? data[0] || null : data,
        payload,
      };
    }

    lastError = error.message || String(error);
  }

  return { ok: false, table, error: lastError || "Member update failed." };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!isOwnerRequest(request, body)) {
      return NextResponse.json({ ok: false, error: "Owner access required." }, { status: 403 });
    }

    const memberId = clean(body?.id || body?.member_id || body?.profile_id);
    const memberEmail = cleanEmail(body?.email || body?.member_email);
    const action = normalizeAction(body?.action || body?.status || body?.member_status);

    if (!memberId && !memberEmail) {
      return NextResponse.json({ ok: false, error: "Missing member id or email." }, { status: 400 });
    }

    const tables = ["vf_members", "vf_profiles", "profiles", "member_profiles"];
    const results = [];

    for (const table of tables) {
      const result = await updateMember(table, memberId, memberEmail, action);
      results.push(result);

      if (result.ok) {
        return NextResponse.json({
          ok: true,
          action,
          table,
          member: result.member,
          payload: result.payload,
          message:
            action === "active"
              ? "Member activated."
              : action === "suspended"
              ? "Member suspended."
              : "Member status updated.",
        });
      }
    }

    return NextResponse.json(
      { ok: false, error: "Could not update member status.", details: results },
      { status: 500 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: "Member status route failed.", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}
