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
        user_email: b.user_email,
        property_type: b.property_type,
        city: b.city,
        state: b.state,
        address: b.address,
        zipcode: b.zipcode,
        asking_price: b.asking_price,
        arv: b.arv,
        deal_type: b.deal_type,
        description: b.description,
        beds: b.beds,
        baths: b.baths,
        sqft: b.sqft,
        year_built: b.year_built,
        repair_estimate: b.repair_estimate,
        units: b.units,
        cap_rate: b.cap_rate,
        noi: b.noi,
        tenant_type: b.tenant_type,
        acreage: b.acreage,
        zoning: b.zoning,
        utilities: b.utilities,
        target_buyer: b.target_buyer,
        min_cash_required: b.min_cash_required,
        timeline: b.timeline,
        assignment_fee: b.assignment_fee,
        seller_financing: b.seller_financing,
        existing_mortgage: b.existing_mortgage,
        mortgage_balance: b.mortgage_balance,
        ai_score: 0, // Still fake. Real AI comes next.
        status: "active"
      });
      
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }
    
    return NextResponse.json({ error: "Invalid post_type" }, { status: 400 });
    
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
