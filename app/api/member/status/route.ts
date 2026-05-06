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

function cleanEmail(value: unknown) {
  return clean(value).toLowerCase();
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

function requestEmail(request: Request, body: any) {
  return (
    emailFromCookie(request.headers.get("cookie") || "") ||
    cleanEmail(request.headers.get("x-vf-email")) ||
    cleanEmail(body?.email)
  );
}

function isOwnerRequest(request: Request, body: any) {
  return requestEmail(request, body) === OWNER_EMAIL;
}

function payloadForAction(action: string) {
  const normalized = clean(action).toLowerCase();

  if (["activate", "active", "approve", "unlock"].includes(normalized)) {
    return {
      member_status: "active",
      is_active: true,
      is_suspended: false,
      is_deleted: false,
      updated_at: new Date().toISOString(),
    };
  }

  if (["suspend", "lock", "locked", "inactive"].includes(normalized)) {
    return {
      member_status: "suspended",
      is_active: false,
      is_suspended: true,
      updated_at: new Date().toISOString(),
    };
  }

  if (["payment_required", "unpaid", "mark_unpaid"].includes(normalized)) {
    return {
      payment_status: "unpaid",
      member_status: "profile_required",
      is_active: false,
      updated_at: new Date().toISOString(),
    };
  }

  if (["paid", "mark_paid"].includes(normalized)) {
    return {
      payment_status: "paid",
      member_status: "active",
      is_active: true,
      is_suspended: false,
      is_deleted: false,
      updated_at: new Date().toISOString(),
    };
  }

  return null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));

    if (!isOwnerRequest(request, body)) {
      return NextResponse.json(
        {
          ok: false,
          error: "Owner access required for member status controls.",
        },
        { status: 403 }
      );
    }

    const id = clean(body.id || body.member_id);
    const action = clean(body.action || body.status);

    if (!id) {
      return NextResponse.json({ ok: false, error: "Missing member id." }, { status: 400 });
    }

    const payload = payloadForAction(action);

    if (!payload) {
      return NextResponse.json({ ok: false, error: "Invalid member action." }, { status: 400 });
    }

    const { data, error } = await supabaseClient()
      .from("vf_members")
      .update(payload)
      .eq("id", id)
      .select("*")
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        {
          ok: false,
          error: error.message,
          details: error,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      member: data,
      action,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: "Could not update member status.",
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
