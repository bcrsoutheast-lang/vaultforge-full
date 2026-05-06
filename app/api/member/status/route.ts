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

  if (!url || !key) {
    throw new Error("Missing Supabase environment values.");
  }

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function clean(value: unknown) {
  return String(value || "").trim();
}

function getRequestEmail(request: Request, body: any) {
  return (
    request.headers.get("x-vf-email") ||
    request.headers.get("x-email") ||
    body?.owner_email ||
    body?.admin_email ||
    body?.email ||
    ""
  )
    .trim()
    .toLowerCase();
}

function allowedAction(value: string) {
  return [
    "activate",
    "lock",
    "suspend",
    "restore",
    "mark_paid",
    "mark_unpaid",
  ].includes(value);
}

function payloadForAction(action: string) {
  const now = new Date().toISOString();

  if (action === "activate") {
    return {
      is_active: true,
      is_suspended: false,
      is_deleted: false,
      member_status: "active",
      status: "active",
      updated_at: now,
    };
  }

  if (action === "lock" || action === "suspend") {
    return {
      is_active: false,
      is_suspended: true,
      member_status: "suspended",
      status: "suspended",
      updated_at: now,
    };
  }

  if (action === "restore") {
    return {
      is_active: true,
      is_suspended: false,
      is_deleted: false,
      member_status: "active",
      status: "active",
      updated_at: now,
    };
  }

  if (action === "mark_paid") {
    return {
      payment_status: "paid",
      member_status: "active",
      is_active: true,
      is_suspended: false,
      updated_at: now,
    };
  }

  if (action === "mark_unpaid") {
    return {
      payment_status: "unpaid",
      updated_at: now,
    };
  }

  return { updated_at: now };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const id = clean(body?.id || body?.member_id);
    const action = clean(body?.action).toLowerCase();
    const requestEmail = getRequestEmail(request, body);

    if (requestEmail !== OWNER_EMAIL) {
      return NextResponse.json(
        { ok: false, error: "Owner access required." },
        { status: 403 }
      );
    }

    if (!id) {
      return NextResponse.json(
        { ok: false, error: "Missing member id." },
        { status: 400 }
      );
    }

    if (!allowedAction(action)) {
      return NextResponse.json(
        { ok: false, error: "Invalid member action." },
        { status: 400 }
      );
    }

    const updatePayload = payloadForAction(action);

    const { data, error } = await supabaseClient()
      .from("vf_members")
      .update(updatePayload)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message, details: error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      member: data,
      action,
      message: `Member ${action.replace("_", " ")} complete.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: "Could not update member.",
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
