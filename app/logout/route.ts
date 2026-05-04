import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const COOKIE_NAMES = [
  "vf_auth_access_token",
  "vf_auth_refresh_token",
  "vf_auth_user_id",
  "vf_email",
  "vf_member_login",
  "vf_admin",
  "vf_admin_email",
  "isAdmin",
];

function clearCookieOptions() {
  return {
    path: "/",
    maxAge: 0,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };
}

export async function GET(request: Request) {
  const response = NextResponse.redirect(new URL("/login", request.url));

  for (const name of COOKIE_NAMES) {
    response.cookies.set(name, "", clearCookieOptions());
  }

  return response;
}
