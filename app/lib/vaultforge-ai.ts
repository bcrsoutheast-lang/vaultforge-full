function cleanText(value: unknown) {
  return String(value || "").trim();
}

function cleanNumber(value: unknown) {
  const raw = String(value ?? "").replace(/,/g, "").trim();
  if (!raw) return null;
  const num = Number(raw);
  if (Number.isNaN(num)) return null;
  return num;
}

export function analyzeDeal(input: any) {
  const title = cleanText(input?.title);
  const state = cleanText(input?.state);
  const propertyType = cleanText(input?.property_type);
  const strategy = cleanText(input?.strategy);
  const description = cleanText(input?.description).toLowerCase();
  const price = cleanNumber(input?.price);

  const routing: string[] = [];
  const risk: string[] = [];
  const buyerTypes: string[] = [];

  if (strategy === "Fix & Flip") {
    buyerTypes.push("fix-and-flip buyers");
    routing.push("buyers, contractors, and hard-money lenders");
  }

  if (strategy === "Rental") {
    buyerTypes.push("rental buyers");
    routing.push("buy-and-hold investors, lenders, and property managers");
  }

  if (strategy === "Wholesale") {
    buyerTypes.push("cash buyers");
    routing.push("cash buyers and investor partners");
  }

  if (strategy === "Development") {
    buyerTypes.push("developers");
    routing.push("developers, capital partners, and lenders");
  }

  if (propertyType === "Land") routing.push("developers and land buyers");
  if (propertyType === "Commercial") routing.push("commercial buyers and private lenders");

  if (price !== null) {
    if (price <= 150000) risk.push("lower entry price may attract faster buyer interest");
    else if (price <= 500000) risk.push("mid-range deal needs clear numbers and exit strategy");
    else risk.push("higher price point may require stronger capital or lender match");
  }

  if (
    description.includes("bad") ||
    description.includes("repair") ||
    description.includes("rehab") ||
    description.includes("horrible")
  ) {
    risk.push("description suggests condition risk or repair scope");
    routing.push("contractors and experienced operators");
  }

  if (description.includes("cash")) routing.push("cash buyers");
  if (
    description.includes("fund") ||
    description.includes("loan") ||
    description.includes("lender")
  ) {
    routing.push("lenders");
  }

  const buyerSummary = buyerTypes.length ? buyerTypes.join(", ") : "general investors";
  const routingSummary = Array.from(new Set(routing)).join("; ") || "matched buyers and lenders";
  const riskSummary =
    Array.from(new Set(risk)).join("; ") || "standard underwriting needed before commitment";

  const ai_summary =
    `${title || "This deal"} in ${state || "the selected market"} is a ${propertyType || "property"} opportunity` +
    `${strategy ? ` built around a ${strategy} strategy` : ""}. ` +
    `Likely audience: ${buyerSummary}. ` +
    `Lender relevance: ${
      price
        ? `price point at $${Number(price).toLocaleString()} should be reviewed for funding fit`
        : "funding fit depends on final price and terms"
    }. ` +
    `Risk note: ${riskSummary}. ` +
    `Routing suggestion: ${routingSummary}.`;

  return {
    ai_summary,
    buyer_type: buyerSummary,
    lender_relevance: price ? "Relevant" : "Needs price",
    routing_suggestion: routingSummary,
    risk_note: riskSummary,
  };
}
