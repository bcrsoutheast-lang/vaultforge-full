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

async function softRemoveFromTable(table: string, memberId: string, memberEmail: string) {
  const supabase = getSupabase();

  // Do NOT use deleted_at. Live vf_members does not have that column.
  const attempts: Record<string, any>[] = [
    { access_status: "removed", member_status: "removed", payment_status: "removed", suspended: true, is_active: false },
    { access_status: "removed", member_status: "removed", payment_status: "removed" },
    { access_status: "removed", member_status: "removed" },
    { member_status: "removed" },
    { access_status: "removed" },
  ];

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

  return { ok: false, table, error: lastError || "Member remove failed." };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!isOwnerRequest(request, body)) {
      return NextResponse.json({ ok: false, error: "Owner access required." }, { status: 403 });
    }

    const memberId = clean(body?.id || body?.member_id || body?.profile_id);
    const memberEmail = cleanEmail(body?.email || body?.member_email);

    if (!memberId && !memberEmail) {
      return NextResponse.json({ ok: false, error: "Missing member id or email." }, { status: 400 });
    }

    const tables = ["vf_members", "vf_profiles", "profiles", "member_profiles"];
    const results = [];

    for (const table of tables) {
      const result = await softRemoveFromTable(table, memberId, memberEmail);
      results.push(result);

      if (result.ok) {
        return NextResponse.json({
          ok: true,
          action: "removed",
          table,
          member: result.member,
          payload: result.payload,
          message: "Member removed from active network.",
        });
      }
    }

    return NextResponse.json(
      { ok: false, error: "Could not remove member.", details: results },
      { status: 500 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: "Member remove route failed.", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}
