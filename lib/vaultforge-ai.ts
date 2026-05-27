export type Deal = {
  id: number;
  title: string;
  state: string;
  propertyType: string;
  dealType: string;
  askPrice: string;
  arv: string;
  repair?: string;
  notes?: string;
  status: string;
  postedBy: string;
  postedAt: number;
  vaultForgeAnalysis: { profit: number; roi: string };
  savedBy: string[];
};

export type Pain = {
  id: number;
  title: string;
  state: string;
  propertyType: string;
  painType: string;
  urgency: string;
  budget?: string;
  description?: string;
  status: string;
  postedBy: string;
  postedAt: number;
  assignedTo: string | null;
};

export type Profile = {
  email: string;
  name?: string;
  investorType?: string;
  states?: string[];
  propertyTypes?: string[];
  minArv?: number;
  maxAsk?: number;
  dmaicSkills?: string[];
};

export type Alert = {
  id: number;
  for: string;
  type: "deal" | "pain" | "message" | "system";
  title: string;
  message: string;
  targetId: number;
  createdAt: number;
  read: boolean;
};

// MATCH DEAL TO MEMBER BUY BOX
export function matchDealToMembers(deal: Deal): string[] {
  const profiles: Profile[] = JSON.parse(localStorage.getItem("vaultforge_profiles") || "[]");
  const matched: string[] = [];

  profiles.forEach(profile => {
    if (profile.email === deal.postedBy) return; // Don't match to self

    const stateMatch = !profile.states || profile.states.length === 0 || profile.states.includes(deal.state);
    const propTypeMatch = !profile.propertyTypes || profile.propertyTypes.length === 0 || profile.propertyTypes.includes(deal.propertyType);
    
    const ask = parseFloat(deal.askPrice) || 0;
    const arv = parseFloat(deal.arv) || 0;
    const askMatch = !profile.maxAsk || ask <= profile.maxAsk;
    const arvMatch = !profile.minArv || arv >= profile.minArv;

    if (stateMatch && propTypeMatch && askMatch && arvMatch) {
      matched.push(profile.email);
    }
  });

  return matched;
}

// MATCH PAIN TO CONTRACTOR DMAIC SKILLS
export function matchPainToContractors(pain: Pain): string[] {
  const profiles: Profile[] = JSON.parse(localStorage.getItem("vaultforge_profiles") || "[]");
  const matched: string[] = [];

  profiles.forEach(profile => {
    if (profile.email === pain.postedBy) return; // Don't match to self
    if (profile.investorType !== "contractor") return; // Only contractors

    const stateMatch = !profile.states || profile.states.length === 0 || profile.states.includes(pain.state);
    const skillMatch = !profile.dmaicSkills || profile.dmaicSkills.length === 0 || profile.dmaicSkills.includes(pain.painType);

    if (stateMatch && skillMatch) {
      matched.push(profile.email);
    }
  });

  return matched;
}

// CREATE ALERTS FOR MATCHED MEMBERS
export function createAlerts(emails: string[], type: "deal" | "pain", item: Deal | Pain) {
  const alerts: Alert[] = JSON.parse(localStorage.getItem("vaultforge_alerts") || "[]");
  
  emails.forEach(email => {
    const alert: Alert = {
      id: Date.now() + Math.random(),
      for: email,
      type,
      title: type === "deal" ? `New Deal Match: ${item.title}` : `New Pain Match: ${item.title}`,
      message: type === "deal" 
        ? `${(item as Deal).state} ${(item as Deal).propertyType} - $${parseInt((item as Deal).askPrice).toLocaleString()} ask, $${parseInt((item as Deal).arv).toLocaleString()} ARV`
        : `${(item as Pain).state} ${(item as Pain).painType} - ${(item as Pain).urgency.toUpperCase()} priority`,
      targetId: item.id,
      createdAt: Date.now(),
      read: false
    };
    alerts.push(alert);
  });

  localStorage.setItem("vaultforge_alerts", JSON.stringify(alerts));
}

// MAIN ROUTING FUNCTIONS - CALL THESE ON PUBLISH

export function routeDealToMembers(dealId: number) {
  const deals: Deal[] = JSON.parse(localStorage.getItem("vaultforge_deals") || "[]");
  const deal = deals.find(d => d.id === dealId);
  if (!deal || deal.status !== "active") return;

  const matchedMembers = matchDealToMembers(deal);
  createAlerts(matchedMembers, "deal", deal);
  
  return matchedMembers.length;
}

export function routePainToContractors(painId: number) {
  const pains: Pain[] = JSON.parse(localStorage.getItem("vaultforge_pains") || "[]");
  const pain = pains.find(p => p.id === painId);
  if (!pain || pain.status !== "active") return;

  const matchedContractors = matchPainToContractors(pain);
  createAlerts(matchedContractors, "pain", pain);
  
  return matchedContractors.length;
}

// HELPER: UPDATE EXISTING PUBLISH FUNCTIONS

export function publishDealWithRouting(dealData: Omit<Deal, "id" | "postedAt" | "savedBy">) {
  const deals: Deal[] = JSON.parse(localStorage.getItem("vaultforge_deals") || "[]");
  const newDeal: Deal = {
    ...dealData,
    id: Date.now(),
    postedAt: Date.now(),
    savedBy: []
  };
  
  deals.push(newDeal);
  localStorage.setItem("vaultforge_deals", JSON.stringify(deals));
  
  const matchCount = routeDealToMembers(newDeal.id);
  return { deal: newDeal, matchCount };
}

export function publishPainWithRouting(painData: Omit<Pain, "id" | "postedAt" | "assignedTo">) {
  const pains: Pain[] = JSON.parse(localStorage.getItem("vaultforge_pains") || "[]");
  const newPain: Pain = {
    ...painData,
    id: Date.now(),
    postedAt: Date.now(),
    assignedTo: null
  };
  
  pains.push(newPain);
  localStorage.setItem("vaultforge_pains", JSON.stringify(pains));
  
  const matchCount = routePainToContractors(newPain.id);
  return { pain: newPain, matchCount };
}
