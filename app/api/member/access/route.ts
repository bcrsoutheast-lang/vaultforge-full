import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  if (!url || !key) return null;
  return { url, key };
}

function getEmail(req: Request) {
  const headerEmail =
    req.headers.get("x-vf-email") ||
    req.headers.get("x-vf-user-email") ||
    req.headers.get("x-vaultforge-email") ||
    "";

  if (headerEmail && headerEmail.includes("@")) {
    return headerEmail.trim().toLowerCase();
  }

  return "";
}

export async function GET(req: Request) {
  const config = getSupabaseConfig();

  if (!config) {
    return NextResponse.json(
      { error: "Supabase environment variables are missing." },
      { status: 500 }
    );
  }

  const email = getEmail(req);

  if (!email) {
    return NextResponse.json({ error: "Not logged in." }, { status: 401 });
  }

  const url =
    `${config.url}/rest/v1/vf_member_access_view` +
    `?select=*` +
    `&email=eq.${encodeURIComponent(email)}` +
    `&limit=1`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      apikey: config.key,
      Authorization: `Bearer ${config.key}`,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    return NextResponse.json(
      { error: "Failed to load access status.", details: await res.text() },
      { status: 500 }
    );
  }

  const rows = await res.json();
  const row = rows?.[0] || null;

  if (!row) {
    return NextResponse.json({
      email,
      profileComplete: false,
      paymentStatus: "unpaid",
      memberStatus: "profile_required",
      accessLevel: "locked",
      hasFullAccess: false,
      nextRequiredStep: "profile_required",
    });
  }

  return NextResponse.json({
    email,
    profileComplete: Boolean(row.profile_complete),
    paymentStatus: row.payment_status || "unpaid",
    memberStatus: row.member_status || "profile_required",
    accessLevel: row.access_level || "locked",
    hasFullAccess: Boolean(row.has_full_access),
    nextRequiredStep: row.next_required_step || "profile_required",
  });
}
