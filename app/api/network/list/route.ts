import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    "";

  if (!url || !key) return null;
  return { url, key };
}

function clean(value: unknown) {
  return String(value || "").trim();
}

function encodeFilterValue(value: string) {
  return encodeURIComponent(value);
}

export async function GET(request: Request) {
  try {
    const config = getSupabaseConfig();

    if (!config) {
      return NextResponse.json(
        {
          ok: true,
          members: [],
          warning: "Supabase environment variables are missing.",
        },
        { status: 200 }
      );
    }

    const { searchParams } = new URL(request.url);
    const state = clean(searchParams.get("state"));
    const role = clean(searchParams.get("role"));
    const includeRemoved = clean(searchParams.get("includeRemoved")) === "1";

    const table = "vf_members";

    let queryUrl =
      `${config.url}/rest/v1/${table}` +
      `?select=id,name,email,state,role,company,bio,buy_box_states,buy_box_types,buy_box_strategies,profile_photo_url,is_active,is_suspended,is_deleted,member_status,status,payment_status,created_at,updated_at` +
      `&order=created_at.desc`;

    if (state && state !== "All") {
      queryUrl += `&state=eq.${encodeFilterValue(state)}`;
    }

    if (role && role !== "All") {
      queryUrl += `&role=eq.${encodeFilterValue(role)}`;
    }

    if (!includeRemoved) {
      queryUrl += `&or=(is_deleted.is.null,is_deleted.eq.false)`;
    }

    const response = await fetch(queryUrl, {
      method: "GET",
      headers: {
        apikey: config.key,
        Authorization: `Bearer ${config.key}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const details = await response.text();

      return NextResponse.json(
        {
          ok: false,
          error: "Failed to load network.",
          details,
          members: [],
        },
        { status: 500 }
      );
    }

    const members = await response.json();

    return NextResponse.json({
      ok: true,
      members: Array.isArray(members) ? members : [],
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: "Network route failed.",
        details: error?.message || String(error),
        members: [],
      },
      { status: 500 }
    );
  }
}
