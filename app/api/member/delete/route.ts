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

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const id = clean(body?.id || body?.member_id);
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

    const now = new Date().toISOString();

    const { data, error } = await supabaseClient()
      .from("vf_members")
      .update({
        is_active: false,
        is_suspended: true,
        is_deleted: true,
        member_status: "removed",
        status: "removed",
        updated_at: now,
      })
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
      message: "Member moved to removed.",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: "Could not remove member.",
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
