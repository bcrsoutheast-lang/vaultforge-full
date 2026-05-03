import { NextResponse } from "next/server";
import { getSessionEmailFromRequest } from "../../../lib/vaultforge-session";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  return NextResponse.json({
    resolved_email: getSessionEmailFromRequest(req) || null,
    header_email:
      req.headers.get("x-vf-email") ||
      req.headers.get("x-vf-user-email") ||
      req.headers.get("x-vaultforge-email") ||
      null,
    cookie_header_seen: Boolean(req.headers.get("cookie")),
    note:
      "Direct browser visits usually show null header_email. Real page button calls send x-vf-email from localStorage.",
  });
}
