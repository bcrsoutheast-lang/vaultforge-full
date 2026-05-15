import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function clean(v:any){ return String(v ?? "").trim(); }
function cleanEmail(v:any){ return clean(v).toLowerCase(); }

function client(){
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    "",
    {
      auth:{
        persistSession:false,
        autoRefreshToken:false,
      }
    }
  );
}

function first(...values:any[]){
  for(const value of values){
    if(value === null || value === undefined) continue;

    if(Array.isArray(value)){
      for(const item of value){
        const text = clean(item);
        if(text) return text;
      }
    }

    const text = clean(value);
    if(text) return text;
  }

  return "";
}

function makeHref(row:any){
  const type = clean(row._smart_type);

  if(type === "pain"){
    const painId =
      first(
        row.pain_id,
        row.request_id,
        row.item_id,
        row.id
      );

    return painId
      ? `/pain-room/${encodeURIComponent(painId)}`
      : "/pain-feed";
  }

  const dealId =
    first(
      row.deal_id,
      row.id,
      row.item_id
    );

  return dealId
    ? `/deal/detail?id=${encodeURIComponent(dealId)}`
    : "/projects";
}

export async function GET(request:NextRequest){
  try{
    const email =
      cleanEmail(request.headers.get("x-vf-email")) ||
      cleanEmail(request.nextUrl.searchParams.get("email"));

    if(!email){
      return NextResponse.json({
        ok:false,
        insights:[],
        error:"Missing email"
      });
    }

    const db = client();

    const dealRes = await db
      .from("vf_deals")
      .select("*")
      .limit(50);

    const painRes = await db
      .from("vf_pain_requests")
      .select("*")
      .limit(50);

    const deals = Array.isArray(dealRes.data)
      ? dealRes.data.map((r:any)=>({ ...r, _smart_type:"deal" }))
      : [];

    const pains = Array.isArray(painRes.data)
      ? painRes.data.map((r:any)=>({ ...r, _smart_type:"pain" }))
      : [];

    const rows = [...deals, ...pains];

    const insights = rows.map((row:any, index:number)=>{
      const title =
        first(
          row.title,
          row.deal_title,
          row.property_title,
          row.pain_title,
          row.problem_title,
          `VaultForge Item ${index + 1}`
        );

      const state =
        first(
          row.state,
          row.market_state,
          row.market
        );

      const city =
        first(
          row.city,
          row.area
        );

      const market =
        [city, state].filter(Boolean).join(", ");

      const photo =
        first(
          row.image_url,
          row.photo_url,
          row.main_photo_url
        );

      return {
        id:first(row.id,row.deal_id,row.pain_id,row.request_id),
        kind:row._smart_type,
        title,
        market,
        href:makeHref(row),
        photo,
        score: row._smart_type === "pain" ? 82 : 73,
        priority: row._smart_type === "pain" ? "High" : "Medium",
        summary:
          row._smart_type === "pain"
            ? "Pain signal routed for operator/capital review."
            : "Deal routed against your profile, strategy, and markets.",
        best_move:
          row._smart_type === "pain"
            ? "Open the pain room and verify the blocker."
            : "Open the deal room and compare against buy box.",
      };
    });

    return NextResponse.json({
      ok:true,
      insights,
      counts:{
        total:insights.length
      }
    });

  }catch(error:any){
    return NextResponse.json({
      ok:false,
      insights:[],
      error:error?.message || "Smart AI failed"
    });
  }
}
