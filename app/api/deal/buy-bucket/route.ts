import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const deal_id = body.deal_id;

    const email =
      request.headers.get("x-vf-email") ||
      request.headers.get("x-email") ||
      "";

    if (!deal_id) {
      return NextResponse.json({ error: "Missing deal_id" }, { status: 400 });
    }

    if (!email) {
      return NextResponse.json({ error: "Missing email" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("vf_buy_bucket")
      .insert([
        {
          deal_id,
          buyer_email: email,
          member_email: email,
          status: "saved",
        },
      ])
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, data });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Failed to save", details: e.message },
      { status: 500 }
    );
  }
}
