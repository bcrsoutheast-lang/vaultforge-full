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
        title: b.title,
        user_email: b.user_email, // This is the only email column now
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
        image_urls: b.image_urls,
        ai_score: 0,
        status: "active"
      });
      
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    if (b.post_type === "pain") {
      const { error } = await supabase.from("pains").insert({
        user_email: b.user_email,
        property_type: b.property_type,
        city: b.city,
        state: b.state,
        zipcode: b.zipcode,
        address: b.address,
        occupancy_status: b.occupancy_status,
        reason_for_selling: b.reason_for_selling,
        seller_motivation: b.seller_motivation,
        months_behind: b.months_behind,
        back_taxes: b.back_taxes,
        lien_amount: b.lien_amount,
        code_violations: b.code_violations,
        property_condition: b.property_condition,
        vacancy_length_months: b.vacancy_length_months,
        tenant_issues: b.tenant_issues,
        mortgage_balance: b.mortgage_balance,
        monthly_payment: b.monthly_payment,
        interest_rate: b.interest_rate,
        is_foreclosure: b.is_foreclosure,
        auction_date: b.auction_date,
        description: b.description,
        pain_score: b.pain_score,
        pain_level: b.pain_level,
        ai_summary: b.ai_summary,
        root_causes: b.root_causes,
        problem_analysis: b.problem_analysis,
        solution_paths: b.solution_paths,
        next_steps: b.next_steps,
        estimated_timeline: b.estimated_timeline,
        exit_strategies: b.exit_strategies,
        image_urls: b.image_urls,
        status: 'active'
      });
      
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }
    
    return NextResponse.json({ error: "Invalid post_type" }, { status: 400 });
    
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}        
