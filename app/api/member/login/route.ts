import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function cleanEmail(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

export async function POST(req: Request) {
  let body: any = {};

  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const email = cleanEmail(
    body?.email ||
    req.headers.get("x-vf-email") ||
    req.headers.get("x-vf-user-email")
  );

  if (!email || !email.includes("@")) {
    return NextResponse.json(
      { ok: false, error: "Enter a valid email." },
      { status: 400 }
    );
  }

  const response = NextResponse.json({
    ok: true,
    email,
    redirectTo: "/dashboard",
  });

  // Keep cookies as optional fallback only. The app now uses x-vf-email headers.
  const secure = process.env.NODE_ENV === "production";
  response.cookies.set("vf_email", email, {
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    sameSite: "lax",
    secure,
  });
  response.cookies.set("vf_user", email, {
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    sameSite: "lax",
    secure,
  });

  return response;
}
