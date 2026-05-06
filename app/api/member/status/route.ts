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

function normalizeAction(value: unknown) {
  const action = clean(value).toLowerCase();

  if (["active", "activate", "unlock", "approve"].includes(action)) return "active";
  if (["suspended", "suspend", "lock", "locked", "disable"].includes(action)) return "suspended";
  if (["removed", "remove", "deleted", "delete"].includes(action)) return "removed";
  if (["payment_required", "payment", "unpaid"].includes(action)) return "payment_required";
  if (["profile_required", "profile", "incomplete"].includes(action)) return "profile_required";

  return action || "active";
}

function payloadsFor(action: string) {
  if (action === "active") {
    return [
      {
        member_status: "active",
        access_status: "active",
        payment_status: "active",
        suspended: false,
        is_active: true,
      },
      {
        member_status: "active",
        access_status: "active",
        payment_status: "active",
      },
      {
        member_status: "active",
        access_status: "active",
      },
      { member_status: "active" },
      { access_status: "active" },
    ];
  }

  if (action === "suspended") {
    return [
      {
        member_status: "suspended",
        access_status: "suspended",
        suspended: true,
        is_active: false,
      },
      {
        member_status: "suspended",
        access_status: "suspended",
      },
      { member_status: "suspended" },
      { access_status: "suspended" },
    ];
  }

  if (action === "payment_required") {
    return [
      {
        member_status: "payment_required",
        access_status: "payment_required",
        payment_status: "unpaid",
        suspended: false,
        is_active: false,
      },
      {
        member_status: "payment_required",
        access_status: "payment_required",
        payment_status: "unpaid",
      },
      {
        member_status: "payment_required",
        access_status: "payment_required",
      },
      { member_status: "payment_required" },
      { access_status: "payment_required" },
    ];
  }

  if (action === "profile_required") {
    return [
      {
        member_status: "profile_required",
        access_status: "profile_required",
        suspended: false,
        is_active: false,
      },
      {
        member_status: "profile_required",
        access_status: "profile_required",
      },
      { member_status: "profile_required" },
      { access_status: "profile_required" },
    ];
  }

  return [
    {
      member_status: action,
      access_status: action,
    },
    { member_status: action },
    { access_status: action },
  ];
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
    const action = normalizeAction(body?.action || body?.status || body?.member_status);

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
    const payloads = payloadsFor(action);
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
              action,
              table,
              selector,
              payload,
              updated_count: result.count,
              member: result.data[0],
              message:
                action === "active"
                  ? "Member activated."
                  : action === "suspended"
                  ? "Member suspended."
                  : action === "payment_required"
                  ? "Member marked payment required."
                  : action === "profile_required"
                  ? "Member marked profile required."
                  : "Member status updated.",
            });
          }
        }
      }
    }

    return NextResponse.json(
      {
        ok: false,
        error: "No member row was updated. The button sent an id/email that did not match any live row, or the live table uses different status columns.",
        attempts,
      },
      { status: 500 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: "Member status route failed.",
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
