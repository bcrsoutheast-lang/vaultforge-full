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

function cookieValue(cookieHeader: string, name: string) {
  const found = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));

  if (!found) return "";

  try {
    return decodeURIComponent(found.replace(`${name}=`, ""));
  } catch {
    return found.replace(`${name}=`, "");
  }
}

function requesterEmail(request: Request, body: any) {
  const cookieHeader = request.headers.get("cookie") || "";

  return cleanEmail(
    request.headers.get("x-vf-email") ||
      request.headers.get("x-email") ||
      body?.requester_email ||
      body?.admin_email ||
      cookieValue(cookieHeader, "vf_email")
  );
}

function isOwnerRequest(request: Request, body: any) {
  const email = requesterEmail(request, body);
  const cookieHeader = (request.headers.get("cookie") || "").toLowerCase();

  return (
    email === OWNER_EMAIL ||
    cookieHeader.includes("vf_admin=1") ||
    cookieHeader.includes("isadmin=true") ||
    cookieHeader.includes("bcrsoutheast%40gmail.com")
  );
}

function memberSelectors(memberId: string, email: string) {
  const selectors: { column: string; value: string }[] = [];

  if (memberId) {
    selectors.push({ column: "id", value: memberId });
    selectors.push({ column: "profile_id", value: memberId });
    selectors.push({ column: "member_id", value: memberId });
  }

  if (email) {
    selectors.push({ column: "email", value: email });
    selectors.push({ column: "member_email", value: email });
    selectors.push({ column: "owner_email", value: email });
    selectors.push({ column: "user_email", value: email });
  }

  const seen = new Set<string>();

  return selectors.filter((selector) => {
    const key = `${selector.column}:${selector.value}`;
    if (!selector.value || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function removalPayloads() {
  return [
    {
      member_status: "removed",
      access_status: "removed",
      payment_status: "removed",
      suspended: true,
      is_active: false,
    },
    {
      member_status: "removed",
      access_status: "removed",
      payment_status: "removed",
    },
    {
      member_status: "removed",
      access_status: "removed",
    },
    { member_status: "removed" },
    { access_status: "removed" },
  ];
}

async function tryUpdate(table: string, selector: { column: string; value: string }, payload: Record<string, any>) {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from(table)
    .update(payload)
    .eq(selector.column, selector.value)
    .select("*");

  if (error) {
    return {
      ok: false,
      error: error.message || String(error),
      data: [],
      count: 0,
    };
  }

  const rows = Array.isArray(data) ? data : data ? [data] : [];

  if (!rows.length) {
    return {
      ok: false,
      error: `No row matched ${table}.${selector.column}=${selector.value}`,
      data: [],
      count: 0,
    };
  }

  return {
    ok: true,
    error: "",
    data: rows,
    count: rows.length,
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));

    if (!isOwnerRequest(request, body)) {
      return NextResponse.json(
        {
          ok: false,
          error: "Owner access required.",
        },
        { status: 403 }
      );
    }

    const memberId = clean(body?.id || body?.member_id || body?.profile_id);
    const email = cleanEmail(body?.email || body?.member_email || body?.owner_email || body?.user_email);

    if (!memberId && !email) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing member id or email.",
        },
        { status: 400 }
      );
    }

    const tables = ["vf_members", "vf_profiles", "profiles", "member_profiles"];
    const selectors = memberSelectors(memberId, email);
    const payloads = removalPayloads();
    const attempts: any[] = [];

    for (const table of tables) {
      for (const selector of selectors) {
        for (const payload of payloads) {
          const result = await tryUpdate(table, selector, payload);

          attempts.push({
            table,
            selector,
            payload,
            ok: result.ok,
            count: result.count,
            error: result.error,
          });

          if (result.ok && result.count > 0) {
            return NextResponse.json({
              ok: true,
              action: "removed",
              table,
              selector,
              payload,
              updated_count: result.count,
              member: result.data[0],
              message: "Member removed from active network.",
            });
          }
        }
      }
    }

    return NextResponse.json(
      {
        ok: false,
        error: "No member row was removed. The button sent an id/email that did not match any live row, or the live table uses different status columns.",
        attempts,
      },
      { status: 500 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: "Member remove route failed.",
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
