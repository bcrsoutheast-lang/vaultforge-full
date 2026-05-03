import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function clearCookie(response: NextResponse, name: string) {
  response.cookies.set(name, "", {
    path: "/",
    maxAge: 0,
    sameSite: "lax",
  });
}

export async function GET(request: Request) {
  const response = NextResponse.redirect(new URL("/login", request.url));

  clearCookie(response, "vf_user");
  clearCookie(response, "vf_email");
  clearCookie(response, "vf_member_login");
  clearCookie(response, "vf_admin");
  clearCookie(response, "isAdmin");

  return response;
}
