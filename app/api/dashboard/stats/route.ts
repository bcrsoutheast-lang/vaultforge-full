import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { count: deals } = await supabase
    .from("vf_deals")
    .select("*", { count: "exact", head: true });

  const { count: members } = await supabase
    .from("vf_members")
    .select("*", { count: "exact", head: true });

  const { count: bucket } = await supabase
    .from("vf_buy_bucket")
    .select("*", { count: "exact", head: true });

  return NextResponse.json({
    deals: deals || 0,
    members: members || 0,
    bucket: bucket || 0
  });
}
