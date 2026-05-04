import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

export async function GET(request: Request) {
  try {
    const email =
      request.headers.get("x-vf-email") ||
      request.headers.get("x-email") ||
      "";

    if (!email) {
      return NextResponse.json({ error: "Missing email" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("vf_buy_bucket")
      .select("*, vf_deals(*)")
      .or(`buyer_email.eq.${email},member_email.eq.${email}`)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, deals: data });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Failed to load bucket", details: e.message },
      { status: 500 }
    );
  }
}
