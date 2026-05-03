import { NextResponse } from "next/server";
import { matchDealToMembers } from "../../../lib/vaultforge-routing";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: Request) {
  const body = await req.json();
  const result = await matchDealToMembers(body?.deal || body);
  return NextResponse.json(result);
}
