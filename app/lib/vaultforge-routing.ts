function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  if (!url || !key) return null;
  return { url, key };
}

function arrayContains(values: unknown, target: string) {
  if (!Array.isArray(values)) return false;
  return values.map((value) => String(value || "")).includes(target);
}

function priceMatches(member: any, dealPrice: number | null) {
  if (dealPrice === null || Number.isNaN(dealPrice)) return true;

  const min =
    member.min_price === null || member.min_price === undefined
      ? null
      : Number(member.min_price);

  const max =
    member.max_price === null || member.max_price === undefined
      ? null
      : Number(member.max_price);

  if (min !== null && !Number.isNaN(min) && dealPrice < min) return false;
  if (max !== null && !Number.isNaN(max) && dealPrice > max) return false;

  return true;
}

function roleIsRelevant(role: string, deal: any) {
  const strategy = String(deal.strategy || "");
  const propertyType = String(deal.property_type || "");
  const description = String(deal.description || "").toLowerCase();

  if (role === "Lender") return true;
  if (role === "Buyer") return true;
  if (role === "Partner") return true;

  if (role === "Contractor") {
    return (
      strategy === "Fix & Flip" ||
      description.includes("repair") ||
      description.includes("rehab")
    );
  }

  if (role === "Developer") {
    return strategy === "Development" || propertyType === "Land" || propertyType === "Commercial";
  }

  return false;
}

export async function matchDealToMembers(deal: any) {
  const config = getSupabaseConfig();

  if (!config) {
    return { ok: false, matched: 0, error: "Supabase environment variables are missing." };
  }

  const membersUrl =
    `${config.url}/rest/v1/vf_members` +
    `?select=id,name,email,state,role,buy_box_states,buy_box_types,buy_box_strategies,min_price,max_price,is_active` +
    `&is_active=eq.true`;

  const headers = {
    apikey: config.key,
    Authorization: `Bearer ${config.key}`,
  };

  const membersRes = await fetch(membersUrl, {
    method: "GET",
    headers,
    cache: "no-store",
  });

  if (!membersRes.ok) {
    const details = await membersRes.text();
    return { ok: false, matched: 0, error: details };
  }

  const members = await membersRes.json();

  const dealPrice =
    deal.price === null || deal.price === undefined || deal.price === ""
      ? null
      : Number(deal.price);

  const matches = members.filter((member: any) => {
    const memberEmail = String(member.email || "").toLowerCase();
    const ownerEmail = String(deal.owner_email || "").toLowerCase();

    if (memberEmail && ownerEmail && memberEmail === ownerEmail) return false;

    const stateMatch =
      arrayContains(member.buy_box_states, deal.state) ||
      String(member.state || "") === String(deal.state || "");

    const typeMatch =
      arrayContains(member.buy_box_types, deal.property_type) ||
      !Array.isArray(member.buy_box_types) ||
      member.buy_box_types.length === 0;

    const strategyMatch =
      arrayContains(member.buy_box_strategies, deal.strategy) ||
      !Array.isArray(member.buy_box_strategies) ||
      member.buy_box_strategies.length === 0 ||
      String(member.role || "") === "Lender" ||
      String(member.role || "") === "Partner";

    const priceMatch = priceMatches(member, dealPrice);
    const relevantRole = roleIsRelevant(String(member.role || ""), deal);

    return stateMatch && typeMatch && strategyMatch && priceMatch && relevantRole;
  });

  if (matches.length === 0) {
    return { ok: true, matched: 0 };
  }

  const alertRows = matches.map((member: any) => ({
    member_email: String(member.email || "").toLowerCase(),
    deal_id: deal.id,
    deal_title: deal.title,
    deal_state: deal.state,
    deal_property_type: deal.property_type,
    deal_strategy: deal.strategy,
    match_role: member.role,
    alert_title: `Matched deal: ${deal.title}`,
    alert_message:
      `${deal.property_type || "Deal"} in ${deal.state || "your market"} matched your ${member.role || "member"} profile. ` +
      `${deal.strategy ? `Strategy: ${deal.strategy}. ` : ""}` +
      `Review the opportunity and message the deal owner if interested.`,
    read: false,
  }));

  const insertRes = await fetch(`${config.url}/rest/v1/vf_match_alerts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
      Prefer: "return=minimal",
    },
    body: JSON.stringify(alertRows),
  });

  if (!insertRes.ok) {
    const details = await insertRes.text();
    return { ok: false, matched: 0, error: details };
  }

  return { ok: true, matched: matches.length };
}
