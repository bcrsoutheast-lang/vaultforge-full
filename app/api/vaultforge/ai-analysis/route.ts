import { NextResponse } from "next/server";

type DealData = {
  askPrice: number;
  arv: number;
  repair: number;
  state: string;
  propertyType: string;
  dealType: string;
  description: string;
};

type PainData = {
  urgency: string;
  state: string;
  propertyType: string;
  painType: string;
  description: string;
  budget: string;
};

function analyzeDeal(data: DealData) {
  const { askPrice, arv, repair, state, propertyType, dealType } = data;
  
  // Core metrics
  const profit = arv - askPrice - repair;
  const roi = askPrice > 0 ? (profit / askPrice) * 100 : 0;
  const spread = arv - askPrice;
  const rule70 = arv * 0.7 - repair; // MAO formula
  
  let score = 50; // Base score
  const flags: string[] = [];
  const insights: string[] = [];

  // 1. ROI SCORING
  if (roi >= 40) {
    score += 25;
    flags.push("HIGH_ROI");
    insights.push(`Exceptional ROI at ${roi.toFixed(1)}%`);
  } else if (roi >= 25) {
    score += 15;
    flags.push("GOOD_ROI");
    insights.push(`Strong ROI at ${roi.toFixed(1)}%`);
  } else if (roi >= 15) {
    score += 5;
    insights.push(`Decent ROI at ${roi.toFixed(1)}%`);
  } else {
    score -= 10;
    flags.push("LOW_ROI");
    insights.push(`Low ROI at ${roi.toFixed(1)}% - thin margins`);
  }

  // 2. 70% RULE CHECK
  if (askPrice <= rule70) {
    score += 15;
    flags.push("PASSES_70_RULE");
    insights.push(`Passes 70% rule. MAO: $${rule70.toLocaleString()}`);
  } else {
    score -= 5;
    flags.push("FAILS_70_RULE");
    insights.push(`Above 70% rule. MAO: $${rule70.toLocaleString()}`);
  }

  // 3. SPREAD ANALYSIS
  if (spread >= 100000) {
    score += 10;
    flags.push("BIG_SPREAD");
    insights.push(`$${spread.toLocaleString()} spread - lots of room`);
  } else if (spread < 50000) {
    score -= 10;
    flags.push("TIGHT_SPREAD");
    insights.push(`Only $${spread.toLocaleString()} spread - tight`);
  }

  // 4. PROPERTY TYPE BONUS
  if (propertyType === "SFR") {
    score += 5;
    flags.push("SFR_LIQUID");
  }
  if (propertyType === "MF" && profit > 150000) {
    score += 10;
    flags.push("MF_CASHFLOW");
    insights.push("Multi-family with strong profit = cashflow play");
  }

  // 5. STATE MARKET BOOST
  const hotStates = ["FL", "TX", "GA", "NC", "TN"];
  if (hotStates.includes(state)) {
    score += 5;
    flags.push("HOT_MARKET");
  }

  // 6. DEAL TYPE SCORING
  if (dealType === "Wholesale" && roi > 30) {
    score += 5;
    flags.push("WHOLESALE_READY");
  }

  // Clamp score 0-100
  score = Math.max(0, Math.min(100, score));

  // Risk assessment
  let risk = "Medium";
  if (score >= 80) risk = "Low";
  if (score < 50) risk = "High";
  if (repair > arv * 0.4) {
    risk = "High";
    flags.push("HEAVY_REPAIR");
    insights.push("Repair > 40% of ARV - high risk");
  }

  return {
    score,
    profit,
    roi: parseFloat(roi.toFixed(1)),
    spread,
    mao: Math.round(rule70),
    risk,
    flags,
    insights,
    recommendation: score >= 75 ? "HOT DEAL - Route immediately" : score >= 60 ? "Good deal - Route to active buyers" : "Marginal - Needs review"
  };
}

function analyzePain(data: PainData) {
  const { urgency, state, propertyType, painType, budget } = data;
  
  let score = 50;
  const flags: string[] = [];
  const insights: string[] = [];

  // 1. URGENCY SCORING
  if (urgency === "emergency") {
    score += 30;
    flags.push("EMERGENCY");
    insights.push("Emergency job - contractors pay premium for speed");
  } else if (urgency === "high") {
    score += 20;
    flags.push("HIGH_URGENCY");
    insights.push("High urgency - fast close likely");
  } else if (urgency === "medium") {
    score += 10;
  } else {
    score -= 5;
    flags.push("LOW_URGENCY");
  }

  // 2. BUDGET ANALYSIS
  if (budget === "15k+") {
    score += 15;
    flags.push("HIGH_BUDGET");
    insights.push("$15k+ budget attracts top contractors");
  } else if (budget === "5k-15k") {
    score += 10;
    flags.push("GOOD_BUDGET");
  } else if (budget === "1k-5k") {
    score += 5;
  } else {
    score -= 5;
    flags.push("LOW_BUDGET");
    insights.push("Sub-$1k budget - limited contractor interest");
  }

  // 3. PAIN TYPE SCORING
  const highValuePains = ["Roof", "Foundation", "HVAC", "Electrical"];
  if (highValuePains.includes(painType)) {
    score += 10;
    flags.push("HIGH_VALUE_TRADE");
    insights.push(`${painType} work = high ticket, high demand`);
  }

  // 4. STATE BOOST
  const hotStates = ["FL", "TX", "GA", "NC", "TN"];
  if (hotStates.includes(state)) {
    score += 5;
    flags.push("HOT_MARKET");
  }

  // 5. PROPERTY TYPE
  if (propertyType === "SFR") {
    score += 5;
    flags.push("SFR_STANDARD");
  }

  score = Math.max(0, Math.min(100, score));

  let priority = "Medium";
  if (score >= 80) priority = "Critical";
  if (score < 50) priority = "Low";

  return {
    score,
    priority,
    flags,
    insights,
    recommendation: score >= 75 ? "HOT LEAD - Route to top contractors now" : score >= 60 ? "Quality lead - Route to matched contractors" : "Low priority - Batch route"
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, data } = body;

    if (!type || !data) {
      return NextResponse.json({ error: "Missing type or data" }, { status: 400 });
    }

    let analysis;
    if (type === "deal") {
      analysis = analyzeDeal(data as DealData);
    } else if (type === "pain") {
      analysis = analyzePain(data as PainData);
    } else {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    return NextResponse.json({ analysis });
  } catch (error: any) {
    console.error("AI Analysis error:", error);
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}
