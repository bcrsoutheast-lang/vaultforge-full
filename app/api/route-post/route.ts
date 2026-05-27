import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const b = await req.json();
  try {
    if (b.post_type === "deal") {
      const { error } = await supabase.from("deals").insert({
        user_email: b.user_email, city: b.city, state: b.state,
        property_type: b.property_type, asking_price: b.asking_price,
        arv: b.arv, description: b.description, ai_score: 78, status: "active"
      });
      if (error) throw error;
    }
    if (b.post_type === "job") {
      const { error } = await supabase.from("jobs").insert({
        user_email: b.user_email, city: b.city, state: b.state,
        property_type: b.property_type, pain_type: b.pain_type,
        urgency: b.urgency, budget_range: b.budget_range,
        description: b.description, ai_score: 82, status: "active"
      });
      if (error) throw error;
    }
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
