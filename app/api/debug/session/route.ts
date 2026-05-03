import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  return NextResponse.json({
    header_email:
      req.headers.get("x-vf-email") ||
      req.headers.get("x-vf-user-email") ||
      req.headers.get("x-vaultforge-email") ||
      null,
    note: "Direct browser visits cannot send x-vf-email. This endpoint only proves whether a page/API call sends the header.",
  });
}
