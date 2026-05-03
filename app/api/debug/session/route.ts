import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  const store = cookies();

  return NextResponse.json({
    header_email:
      req.headers.get("x-vf-user-email") ||
      req.headers.get("x-vaultforge-email") ||
      null,
    vf_user: store.get("vf_user")?.value || null,
    vf_email: store.get("vf_email")?.value || null,
    vf_member_login: store.get("vf_member_login")?.value || null,
    vf_admin: store.get("vf_admin")?.value || null,
    isAdmin: store.get("isAdmin")?.value || null,
  });
}
