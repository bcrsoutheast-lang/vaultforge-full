import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { post_type, user_email, ...data } = body;

    if (post_type === "deal") {
      const { error } = await supabase.from("deals").insert({
        user_email,
        city: data.city,
        state: data.state,
        property_type: data.property_type,
        asking_price: data.asking_price,
        arv: data.arv,
        description: data.description,
        ai_score: 75,
        status: "active"
      });
      if (error) throw error;
    }

    if (post_type === "job") {
      const { error } = await supabase.from("jobs").insert({
        user_email,
        city: data.city,
        state: data.state,
        property_type: data.property_type,
        pain_type: data.pain_type,
        urgency: data.urgency,
        budget_range: data.budget_range,
        description: data.description,
        ai_score: 75,
        status: "active"
      });
      if (error) throw error;
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
