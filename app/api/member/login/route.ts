import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function cleanEmail(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

function setSessionCookie(response: NextResponse, name: string, value: string) {
  const isProduction = process.env.NODE_ENV === "production";

  response.cookies.set(name, value, {
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    sameSite: "lax",
    secure: isProduction,
    httpOnly: false,
  });
}

export async function POST(req: Request) {
  let body: any = {};

  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const headerEmail =
    req.headers.get("x-vf-user-email") ||
    req.headers.get("x-vaultforge-email") ||
    "";

  const email = cleanEmail(body?.email || headerEmail);

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

  setSessionCookie(response, "vf_user", email);
  setSessionCookie(response, "vf_email", email);
  setSessionCookie(response, "vf_member_login", "1");

  response.cookies.set("vf_admin", "", { path: "/", maxAge: 0 });
  response.cookies.set("isAdmin", "", { path: "/", maxAge: 0 });

  return response;
}
