import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const { postId, type } = await req.json(); // type = "deal" | "pain"

    if (!postId || !type) {
      return NextResponse.json({ error: "Missing postId or type" }, { status: 400 });
    }

    // 1. Get the post details
    const table = type === "deal" ? "deals" : "pains";
    const { data: post, error: postErr } = await supabase
      .from(table)
      .select("*")
      .eq("id", postId)
      .single();

    if (postErr || !post) throw postErr || new Error("Post not found");

    // 2. Find matching alert subscriptions
    // Match on: state, property_type, and for pains also pain_type
    let alertQuery = supabase
      .from("alerts")
      .select("user_email, filters")
      .eq("active", true);

    const { data: allAlerts, error: alertErr } = await alertQuery;
    if (alertErr) throw alertErr;

    // 3. Filter alerts in code - Supabase JSON queries are messy
    const matches = allAlerts?.filter(alert => {
      const f = alert.filters || {};
      const stateMatch = !f.state || f.state === post.state || f.state === "ALL";
      const typeMatch = !f.property_type || f.property_type === post.property_type || f.property_type === "ALL";
      
      if (type === "pain") {
        const tradeMatch = !f.pain_type || f.pain_type === post.pain_type || f.pain_type === "ALL";
        return stateMatch && typeMatch && tradeMatch;
      }
      
      return stateMatch && typeMatch;
    }) || [];

    // 4. Create notifications for each match
    if (matches.length > 0) {
      const notifications = matches.map(m => ({
        user_email: m.user_email,
        type: type,
        post_id: postId,
        title: post.title,
        state: post.state,
        property_type: post.property_type,
        urgency: type === "pain" ? post.urgency : null,
        score: post.vaultforge_analysis?.score || null,
        read: false
      }));

      const { error: notifErr } = await supabase
        .from("notifications")
        .insert(notifications);

      if (notifErr) throw notifErr;
    }

    return NextResponse.json({ 
      routed: matches.length,
      message: `Routed to ${matches.length} users`
    });

  } catch (err: any) {
    console.error("Routing error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
