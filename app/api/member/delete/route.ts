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

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));

    if (!isOwnerRequest(request, body)) {
      return NextResponse.json(
        {
          ok: false,
          error: "Owner access required for member removal.",
        },
        { status: 403 }
      );
    }

    const id = clean(body.id || body.member_id);

    if (!id) {
      return NextResponse.json({ ok: false, error: "Missing member id." }, { status: 400 });
    }

    const { data, error } = await supabaseClient()
      .from("vf_members")
      .update({
        member_status: "removed",
        is_active: false,
        is_suspended: true,
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
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
