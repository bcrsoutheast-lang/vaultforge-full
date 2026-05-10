
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const COOKIE_NAMES = [
  "vf_email",
  "vf_member_email",
  "vf_login_email",
  "vf_member_login",
  "vf_admin",
  "vf_admin_email",
  "isAdmin",
  "vf_auth_user_id",
  "vf_auth_access_token",
  "vf_auth_refresh_token",
  "test_email",
  "demo_email",
  "vf_demo_email",
  "vf_test_email",
];

function expireCookie(response: NextResponse, name: string) {
  const base = {
    path: "/",
    maxAge: 0,
    expires: new Date(0),
    sameSite: "lax" as const,
  };

  response.cookies.set(name, "", {
    ...base,
    httpOnly: false,
    secure: false,
  });

  response.cookies.set(name, "", {
    ...base,
    httpOnly: false,
    secure: true,
  });

  response.cookies.set(name, "", {
    ...base,
    httpOnly: true,
    secure: false,
  });

  response.cookies.set(name, "", {
    ...base,
    httpOnly: true,
    secure: true,
  });
}

export async function GET(request: Request) {
  const url = new URL("/login?identity_reset=1", request.url);
  const response = NextResponse.redirect(url);

  for (const name of COOKIE_NAMES) {
    expireCookie(response, name);
  }

  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");

  return response;
}
