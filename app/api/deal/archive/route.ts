import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  const body = await req.json();
  const id = body.id;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error } = await supabase
    .from("vf_deals")
    .update({ archived: true })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message });

  return NextResponse.json({ ok: true });
}
