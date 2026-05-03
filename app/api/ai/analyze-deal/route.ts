import { NextResponse } from "next/server";
import { analyzeDeal } from "../../../lib/vaultforge-ai";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: Request) {
  const body = await req.json();
  return NextResponse.json(analyzeDeal(body));
}
