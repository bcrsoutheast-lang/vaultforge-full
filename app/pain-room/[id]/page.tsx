"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import VaultForgeRoomCommandBar from "../../components/VaultForgeRoomCommandBar";

type Row = Record<string, any>;

const PAYLOAD_START = "VF_PAIN_PAYLOAD_START";
const PAYLOAD_END = "VF_PAIN_PAYLOAD_END";

function clean(value: unknown) {
  return String(value || "").trim();
}

function cleanEmail(value: unknown) {
  return clean(value).toLowerCase();
}

function first(...values: unknown[]) {
  for (const value of values) {
    if (Array.isArray(value)) {
      const found = value.find((item) => clean(item));
      if (found !== undefined) return clean(found);
      continue;
    }

    const text = clean(value);
    if (text) return text;
  }

  return "";
}

function photoUrl(item: any) {
  if (typeof item === "string") return clean(item);

  if (item && typeof item === "object") {
    return clean(item.url || item.publicUrl || item.public_url || item.photo_url || item.image_url || item.main_photo_url || item.src);
  }

  return "";
}

function parseArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => photoUrl(item) || clean(item)).filter(Boolean);

  const text = clean(value);
  if (!text) return [];

  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return parsed.map(photoUrl).filter(Boolean);
  } catch {
    // Continue.
  }

  return text.split(/[,\n|;]/).map((item) => item.trim()).filter(Boolean);
}

function extractEmbeddedPayload(row: Row | null) {
  if (!row) return {};

  const sources = [
    row.summary,
    row.description,
    row.notes,
    row.ai_summary,
    row.route_summary,
    row.routing_summary,
    row.metadata?.summary,
    row.metadata?.description,
    row.metadata?.notes,
  ].map(clean);

  for (const source of sources) {
    const start = source.indexOf(PAYLOAD_START);
    const end = source.indexOf(PAYLOAD_END);

    if (start === -1 || end === -1 || end <= start) continue;

    const raw = source.slice(start + PAYLOAD_START.length, end).trim();

    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") return parsed as Row;
    } catch {
      // Try next source.
    }
  }

  return {};
}

function meta(row: Row | null) {
  const m = row && typeof row.metadata === "object" && row.metadata ? row.metadata : {};
  const embedded = extractEmbeddedPayload(row);
  return { ...m, ...embedded };
}

function field(row: Row | null, ...keys: string[]) {
  if (!row) return "";

  const m = meta(row);
  const values: unknown[] = [];

  for (const key of keys) {
    values.push(m[key]);
    values.push(row[key]);
  }

  return first(...values);
}

function stripPayload(value: unknown) {
  let text = clean(value);

  const start = text.indexOf(PAYLOAD_START);
  if (start !== -1) text = text.slice(0, start).trim();

  const jsonStart = text.indexOf('{"pain_id"');
  if (jsonStart !== -1) text = text.slice(0, jsonStart).trim();

  return text;
}

function cleanDisplayText(value: unknown) {
  return stripPayload(value) || "";
}

function money(value: unknown) {
  const text = clean(value);
  if (!text) return "Not listed";

  const number = Number(text.replace(/[^\d.-]/g, ""));
  if (!Number.isFinite(number)) return text;

  return number.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function numberValue(value: unknown) {
  const text = clean(value);
  const number = Number(text.replace(/[^\d.-]/g, ""));
  return Number.isFinite(number) ? number : 0;
}

function photosOf(row: Row | null) {
  if (!row) return [];

  const m = meta(row);

  const values = [
    row.main_photo_url,
    row.image_url,
    row.photo_url,
    row.primary_photo_url,
    m.main_photo_url,
    m.image_url,
    m.photo_url,
    m.primary_photo_url,
    ...parseArray(row.photo_urls),
    ...parseArray(row.photos),
    ...parseArray(row.files),
    ...parseArray(m.photo_urls),
    ...parseArray(m.photos),
    ...parseArray(m.files),
  ];

  return Array.from(new Set(values.map(photoUrl).filter((url) => url.startsWith("http"))));
}

function readCookie(name: string) {
  if (typeof document === "undefined") return "";

  const match = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));

  if (!match) return "";

  try {
    return decodeURIComponent(match.slice(name.length + 1));
  } catch {
    return match.slice(name.length + 1);
  }
}

function getEmail() {
  if (typeof window === "undefined") return "";

  const keys = ["vf_email", "vf_member_email", "vf_admin_email", "email", "memberEmail"];

  for (const key of keys) {
    const localValue = cleanEmail(window.localStorage.getItem(key));
    if (localValue.includes("@")) return localValue;

    const sessionValue = cleanEmail(window.sessionStorage.getItem(key));
    if (sessionValue.includes("@")) return sessionValue;
  }

  return cleanEmail(readCookie("vf_email") || readCookie("vf_member_email") || readCookie("vf_admin_email"));
}

function idOf(row: Row | null) {
  return field(row, "id", "pain_id", "request_id", "item_id", "signal_id", "alert_id");
}

function signalIdOf(row: Row | null) {
  return field(row, "signal_id", "signalId", "alert_id", "routing_id");
}

function titleOf(row: Row | null) {
  return field(row, "title", "pain_title", "problem_title", "headline", "name", "address") || "Pressure Room";
}

function ownerOf(row: Row | null) {
  return cleanEmail(field(row, "owner_email", "member_email", "user_email", "submitted_by_email", "created_by_email", "email"));
}

function contactNameOf(row: Row | null) {
  return field(row, "contact_name", "owner_name", "seller_name", "source_name", "best_contact_name");
}

function contactPhoneOf(row: Row | null) {
  return field(row, "contact_phone", "owner_phone", "seller_phone", "source_phone", "phone", "best_contact_phone");
}

function contactEmailOf(row: Row | null) {
  return field(row, "contact_email", "owner_contact_email", "seller_email", "source_email", "best_contact_email");
}

function preferredContactOf(row: Row | null) {
  return field(row, "preferred_contact", "best_contact_method", "contact_method");
}

function contactNotesOf(row: Row | null) {
  return field(row, "contact_notes", "seller_contact_notes", "source_notes", "best_contact_notes");
}

function marketOf(row: Row | null) {
  const city = field(row, "city");
  const county = field(row, "county", "county_name", "market_county");
  const state = field(row, "state", "operating_state");

  return [city, county, state].filter(Boolean).join(", ") || field(row, "location", "address") || "Market not listed";
}

function assetClass(row: Row | null) {
  const raw = field(row, "asset_class", "asset_type", "property_type", "deal_type", "pain_type", "problem_type");
  const lower = raw.toLowerCase();

  if (lower.includes("multi")) return "Multifamily";
  if (lower.includes("commercial")) return "Commercial";
  if (lower.includes("land") || lower.includes("acre")) return "Land";
  if (lower.includes("residential") || lower.includes("house") || lower.includes("single")) return "Residential";

  return raw || "Not listed";
}

function pressureType(row: Row | null) {
  return field(row, "pain_type", "problem_type", "asset_type", "property_type", "deal_type") || "Pressure Signal";
}

function urgencyOf(row: Row | null) {
  return field(row, "urgency", "urgency_level", "priority", "timeline_pressure") || "Not listed";
}

function statusOf(row: Row | null) {
  return field(row, "status", "pain_status", "routing_status", "stage") || "Open";
}

function ownerGoal(row: Row | null) {
  return field(row, "owner_goal", "goal", "desired_outcome", "exit_strategy", "strategy", "what_do_you_want", "requested_help", "help_requested") || "Not listed";
}

function problemText(row: Row | null) {
  return cleanDisplayText(
    field(
      row,
      "problem_description",
      "pain_description",
      "description",
      "summary",
      "ai_summary",
      "note",
      "notes",
      "message",
      "help_requested",
      "requested_help",
      "route_summary",
      "ai_route_summary",
      "routing_summary"
    )
  ) || "Pressure details are pending.";
}

function clamp(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function lowerContext(row: Row | null) {
  return [
    titleOf(row),
    problemText(row),
    urgencyOf(row),
    pressureType(row),
    field(row, "distress_signals", "pressure_signals", "seller_situation"),
    field(row, "capital_needed", "funding_needed", "gap_amount"),
    field(row, "timeline", "deadline", "desired_timeline"),
    field(row, "repairs_needed", "repair_estimate", "repair_scope"),
    field(row, "requested_help", "help_requested", "routing_needs", "needs"),
    field(row, "occupancy", "tenant_status", "access_status"),
    field(row, "title_issue", "probate", "liens"),
  ]
    .map(clean)
    .join(" ")
    .toLowerCase();
}

function askValue(row: Row | null) {
  return numberValue(field(row, "asking_price", "price", "target_price"));
}

function arvValue(row: Row | null) {
  return numberValue(field(row, "arv", "arv_value", "estimated_value", "property_value"));
}

function repairValue(row: Row | null) {
  return numberValue(field(row, "repair_estimate", "repairs_needed", "estimated_repairs", "repair_budget"));
}

function spreadValue(row: Row | null) {
  const ask = askValue(row);
  const arv = arvValue(row);
  const repairs = repairValue(row);
  if (!ask || !arv) return 0;
  return arv - ask - repairs;
}

function pressureScore(row: Row | null) {
  const text = lowerContext(row);
  let score = 34;

  if (text.includes("emergency")) score += 30;
  if (text.includes("urgent")) score += 25;
  if (text.includes("foreclosure")) score += 28;
  if (text.includes("deadline")) score += 20;
  if (text.includes("fast close")) score += 20;
  if (text.includes("funding gap") || text.includes("capital")) score += 22;
  if (text.includes("stalled")) score += 18;
  if (text.includes("contractor")) score += 12;
  if (text.includes("tenant") || text.includes("occupied")) score += 12;
  if (text.includes("permit") || text.includes("city") || text.includes("code")) score += 15;
  if (!contactPhoneOf(row) && !contactEmailOf(row)) score += 6;

  return clamp(score);
}

function resolutionScore(row: Row | null) {
  let score = 30;

  if (field(row, "city", "state", "market")) score += 10;
  if (field(row, "asset_type", "property_type", "pain_type", "problem_type")) score += 10;
  if (field(row, "requested_help", "help_requested", "routing_needs", "needs")) score += 12;
  if (photosOf(row).length) score += 12;
  if (contactPhoneOf(row) || contactEmailOf(row)) score += 10;
  if (askValue(row) || arvValue(row) || repairValue(row)) score += 10;
  if (problemText(row) && problemText(row) !== "Pressure details are pending.") score += 14;

  return clamp(score);
}

function primaryBottleneck(row: Row | null) {
  const direct = field(row, "primary_bottleneck");
  if (direct) return direct;

  const text = lowerContext(row);

  if (text.includes("foreclosure") || text.includes("deadline") || text.includes("fast close")) return "Timeline Compression";
  if (text.includes("capital") || text.includes("funding") || text.includes("lender") || text.includes("gap")) return "Capital / Funding Gap";
  if (text.includes("contractor") || text.includes("repair") || text.includes("construction") || text.includes("roof")) return "Contractor / Execution Gap";
  if (text.includes("buyer") || text.includes("sell") || text.includes("exit")) return "Buyer / Exit Gap";
  if (text.includes("permit") || text.includes("city") || text.includes("code")) return "Permit / City Issue";
  if (text.includes("tenant") || text.includes("lease") || text.includes("occupancy")) return "Tenant / Occupancy Issue";
  if (text.includes("title") || text.includes("probate") || text.includes("lien")) return "Title / Legal Constraint";
  return "Owner Review Needed";
}

function rootCause(row: Row | null) {
  const bottleneck = primaryBottleneck(row);

  if (bottleneck.includes("Timeline")) return "The situation is being compressed by time. Certainty, authority, access, and close-path speed matter more than perfect pricing.";
  if (bottleneck.includes("Capital")) return "The situation is constrained by funding, payoff, repair capital, or liquidity. Resolution depends on confirming the gap and matching the right capital stack.";
  if (bottleneck.includes("Contractor")) return "Execution is blocked by scope, repair pricing, labor capacity, access, or project control. Contractor/operator verification comes before broad exposure.";
  if (bottleneck.includes("Buyer")) return "The pressure is tied to disposition. The asset needs the right buyer path, private routing, and controlled positioning before public marketing.";
  if (bottleneck.includes("Permit")) return "Municipal or code friction is blocking forward motion. Local knowledge and approval-path clarity matter before underwriting.";
  if (bottleneck.includes("Tenant")) return "Occupancy or lease uncertainty is creating risk. Access, rights, timing, and legal constraints must be clarified first.";
  if (bottleneck.includes("Title")) return "Legal/title uncertainty is limiting routeability. Documentation and ownership authority must be verified before operators invest time.";

  return "The signal has enough pressure to require triage, but the exact failure point needs more evidence before routing hard.";
}

function severityLabel(row: Row | null) {
  const score = pressureScore(row);
  if (score >= 85) return "Critical";
  if (score >= 70) return "Severe";
  if (score >= 55) return "Actionable";
  if (score >= 40) return "Manageable";
  return "Monitor";
}

function collapseRisk(row: Row | null) {
  const text = lowerContext(row);
  let score = 28;

  if (text.includes("foreclosure") || text.includes("deadline")) score += 28;
  if (text.includes("title") || text.includes("probate") || text.includes("lien")) score += 22;
  if (text.includes("tenant") || text.includes("occupied")) score += 15;
  if (text.includes("funding") || text.includes("capital")) score += 14;
  if (text.includes("contractor") || text.includes("stalled")) score += 12;
  if (!contactPhoneOf(row) && !contactEmailOf(row)) score += 8;

  return clamp(score);
}

function liquidityPressure(row: Row | null) {
  const text = lowerContext(row);
  let score = 25;

  if (text.includes("cash") || text.includes("funding") || text.includes("payoff") || text.includes("capital")) score += 28;
  if (text.includes("foreclosure") || text.includes("tax") || text.includes("lien")) score += 18;
  if (askValue(row) && arvValue(row) && askValue(row) >= arvValue(row) * 0.82) score += 12;

  return clamp(score);
}

function legalOperationalRisk(row: Row | null) {
  const text = lowerContext(row);
  let score = 25;

  if (text.includes("title") || text.includes("probate") || text.includes("lien")) score += 28;
  if (text.includes("tenant") || text.includes("lease") || text.includes("occupied")) score += 18;
  if (text.includes("permit") || text.includes("code") || text.includes("city")) score += 18;
  if (text.includes("access") || text.includes("drive-by")) score += 10;

  return clamp(score);
}

function timelinePressure(row: Row | null) {
  const text = lowerContext(row);
  let score = 25;

  if (text.includes("today") || text.includes("tomorrow") || text.includes("friday")) score += 24;
  if (text.includes("urgent") || text.includes("emergency")) score += 24;
  if (text.includes("deadline") || text.includes("foreclosure") || text.includes("auction")) score += 30;
  if (field(row, "timeline", "deadline", "desired_timeline")) score += 8;

  return clamp(score);
}

function fastestPath(row: Row | null) {
  const direct = field(row, "fastest_path");
  if (direct) return direct;

  const bottleneck = primaryBottleneck(row);

  if (bottleneck.includes("Timeline")) return "Confirm decision-maker, title authority, access, and close deadline. Route only to operators who can move immediately.";
  if (bottleneck.includes("Capital")) return "Verify numbers, confirm the funding gap, then route to lender, JV capital, or creative finance operator.";
  if (bottleneck.includes("Contractor")) return "Confirm scope/photos, price the repair work, then route to contractor or hands-on local operator.";
  if (bottleneck.includes("Buyer")) return "Package asset facts, confirm seller timeline, then route privately to qualified buyer/operator fit.";
  if (bottleneck.includes("Permit")) return "Identify municipality, permit/code issue, and timeline before routing to local operator.";
  if (bottleneck.includes("Tenant")) return "Clarify lease, occupancy, access, and legal constraints before intro or public exposure.";
  if (bottleneck.includes("Title")) return "Confirm ownership, payoff, liens, probate/title status, then decide whether to pause or route.";

  return "Clarify missing decision details, then route to the best operator stack.";
}

function strategicStructure(row: Row | null) {
  const text = lowerContext(row);
  const ask = askValue(row);
  const arv = arvValue(row);
  const repairs = repairValue(row);
  const spread = spreadValue(row);
  const asset = assetClass(row).toLowerCase();

  if (text.includes("foreclosure") || text.includes("fast close") || text.includes("deadline")) {
    return "Fast cash-close or bridge-capital rescue first. If equity exists, keep a novation or seller-finance backup path open after title/timeline verification.";
  }

  if (text.includes("contractor") || text.includes("repair") || text.includes("stalled")) {
    return "Contractor-led stabilization. Lock scope and access first, then decide whether to wholesale, novate, JV, or hold.";
  }

  if (text.includes("capital") || text.includes("funding") || text.includes("lender")) {
    return "Capital-stack rewrite: private lender, JV equity, seller carry, staged draws, or bridge financing depending on collateral and timeline.";
  }

  if (asset.includes("land")) {
    return "Land/developer routing. Confirm zoning, utilities, frontage, entitlement path, and builder demand before pricing the exit.";
  }

  if (asset.includes("commercial")) {
    return "Commercial operator path. Underwrite NOI, tenant risk, cap rate, repositioning cost, and local operator demand.";
  }

  if (spread > 0 && arv && spread / arv >= 0.2) return "Traditional investor path is viable: private buyer route, fix/flip or rental operator, with contractor quote before final pricing.";

  if (ask && arv && spread <= 0) return "Current numbers are not investable as-is. Rewrite toward seller finance, price reduction, novation, JV, or abandon.";

  return "Hold multiple structures open until missing facts are clarified: cash close, wholesale, novation, seller finance, JV, or operator rescue.";
}

function failurePrediction(row: Row | null) {
  const bottleneck = primaryBottleneck(row);

  if (bottleneck.includes("Timeline")) return "If ignored, the situation may lose optionality quickly. Seller control, price flexibility, and closing certainty can deteriorate.";
  if (bottleneck.includes("Capital")) return "If ignored, funding gap likely widens, timeline pressure increases, and operator confidence drops.";
  if (bottleneck.includes("Contractor")) return "If ignored, scope uncertainty will scare buyers, inflate discounts, and slow execution.";
  if (bottleneck.includes("Buyer")) return "If ignored, seller fatigue or public exposure may damage leverage and reduce route control.";
  if (bottleneck.includes("Permit")) return "If ignored, municipal friction can expand into delay, fines, or deal collapse.";
  if (bottleneck.includes("Tenant")) return "If ignored, access and occupancy risk can block inspections, financing, and closing.";
  if (bottleneck.includes("Title")) return "If ignored, time and money can be wasted before authority to sell or clear title is proven.";

  return "If ignored, the situation remains unresolved and will likely require stronger discounting or rerouting later.";
}

function bestMove(row: Row | null) {
  const bottleneck = primaryBottleneck(row);
  if (bottleneck.includes("Title")) return "Verify title/authority before spending operator time.";
  if (bottleneck.includes("Timeline")) return "Confirm deadline and route only to operators who can perform now.";
  if (bottleneck.includes("Contractor")) return "Get contractor scope and access before buyer exposure.";
  if (bottleneck.includes("Capital")) return "Package numbers and route capital stack before promising execution.";
  if (bottleneck.includes("Buyer")) return "Route privately to qualified buyers; do not blast publicly yet.";
  return "Clarify missing data, then route through the operator stack.";
}

function worstMove(row: Row | null) {
  const bottleneck = primaryBottleneck(row);
  if (bottleneck.includes("Title")) return "Do not blast to buyers before confirming ownership and title path.";
  if (bottleneck.includes("Timeline")) return "Do not wait for perfect information if the deadline is real.";
  if (bottleneck.includes("Contractor")) return "Do not quote pricing to buyers without repair/scope confidence.";
  if (bottleneck.includes("Capital")) return "Do not assume traditional financing solves a pressure event.";
  if (bottleneck.includes("Buyer")) return "Do not publicly expose before the source, price, and timeline are controlled.";
  return "Do not treat this like a generic listing; it needs triage first.";
}

function riskScanner(row: Row | null) {
  const text = lowerContext(row);
  const risks: string[] = [];
  const ask = askValue(row);
  const arv = arvValue(row);
  const repairs = repairValue(row);

  if (ask && arv && ask >= arv * 0.82) risks.push("Thin spread / pricing risk");
  if (repairs && arv && repairs >= arv * 0.18) risks.push("Heavy rehab exposure");
  if (text.includes("tenant") || text.includes("occupied")) risks.push("Occupancy/access risk");
  if (text.includes("permit") || text.includes("code") || text.includes("city")) risks.push("Municipal/code risk");
  if (text.includes("title") || text.includes("probate") || text.includes("lien")) risks.push("Title/legal risk");
  if (text.includes("foreclosure") || text.includes("deadline")) risks.push("Timeline collapse risk");
  if (!photosOf(row).length) risks.push("No photo verification");
  if (!contactPhoneOf(row) && !contactEmailOf(row)) risks.push("Contact path incomplete");
  if (!field(row, "timeline", "deadline", "desired_timeline")) risks.push("Timeline unknown");

  if (!risks.length) risks.push("No severe hidden risk detected from current data");

  return risks.slice(0, 7);
}

function whoShouldSee(row: Row | null) {
  const raw = meta(row).who_should_see || meta(row).suggested_resolution_stack;

  if (Array.isArray(raw)) return raw.map(clean).filter(Boolean);

  const text = lowerContext(row);
  const stack: string[] = [];

  if (text.includes("buyer") || text.includes("sell") || text.includes("fast close")) stack.push("Buyer");
  if (text.includes("funding") || text.includes("capital") || text.includes("lender")) stack.push("Lender");
  if (text.includes("contractor") || text.includes("repair") || text.includes("construction")) stack.push("Contractor");
  if (text.includes("jv") || text.includes("partner") || text.includes("operator")) stack.push("Operator / JV Partner");
  if (text.includes("tenant") || text.includes("permit") || text.includes("city") || text.includes("code")) stack.push("Local Operator");
  if (text.includes("attorney") || text.includes("probate") || text.includes("title")) stack.push("Attorney / Title");
  if (assetClass(row).toLowerCase().includes("land")) stack.push("Builder / Developer");
  if (assetClass(row).toLowerCase().includes("commercial")) stack.push("Commercial Operator");

  if (!stack.length) stack.push("Owner Review", "Operator", "Buyer");

  return Array.from(new Set(stack));
}

function missingInfo(row: Row | null) {
  const missing: string[] = [];

  if (!field(row, "timeline", "deadline", "desired_timeline")) missing.push("timeline");
  if (!contactPhoneOf(row) && !contactEmailOf(row)) missing.push("best contact");
  if (!field(row, "requested_help", "help_requested", "routing_needs", "needs")) missing.push("exact ask");
  if (!photosOf(row).length) missing.push("photos");
  if (!field(row, "asking_price", "price", "target_price")) missing.push("target price");
  if (!field(row, "address", "location", "property_address")) missing.push("location/address");
  if (!field(row, "occupancy", "tenant_status", "access_status")) missing.push("occupancy/access");

  return missing.slice(0, 7);
}

function spreadText(row: Row | null) {
  const ask = askValue(row);
  const arv = arvValue(row);
  const repairs = repairValue(row);

  if (!ask || !arv) return "Not enough pricing data";

  return money(arv - ask - repairs);
}

function commandRecommendation(row: Row | null) {
  const score = pressureScore(row);
  const bottleneck = primaryBottleneck(row);

  if (score >= 85) return `PRIORITY: CRITICAL. Route immediately. ${fastestPath(row)} Do not publicly expose until core facts are verified.`;
  if (score >= 70) return `PRIORITY: HIGH. ${fastestPath(row)} Keep routing controlled and verify missing intelligence.`;
  if (bottleneck.includes("Title")) return "PRIORITY: HOLD / VERIFY. Confirm title, ownership authority, liens, and decision-maker before routing operators.";
  if (bottleneck.includes("Contractor")) return "PRIORITY: CONTRACTOR FIRST. Lock photos, access, and repair scope before buyer/lender route.";
  if (bottleneck.includes("Capital")) return "PRIORITY: CAPITAL STACK. Package numbers and gap amount, then route to lender/JV/creative finance operator.";
  if (bottleneck.includes("Buyer")) return "PRIORITY: PRIVATE BUYER ROUTE. Confirm seller timeline and buyer fit before public blast.";

  return "PRIORITY: TRIAGE. Capture missing facts, then route to the strongest operator stack.";
}

function aiRewrite(row: Row | null) {
  return `Rewrite this from raw pressure into a controlled resolution path. Structure: ${strategicStructure(row)} Sequence: ${fastestPath(row)} Control point: ${primaryBottleneck(row)}.`;
}

function leveragePoints(row: Row | null) {
  const text = lowerContext(row);
  const points: string[] = [];

  if (text.includes("urgent") || text.includes("deadline") || text.includes("fast close")) points.push("Certainty and speed may matter more than top-dollar price.");
  if (text.includes("repair") || text.includes("contractor") || text.includes("roof")) points.push("Repair complexity can reduce competition and create operator advantage.");
  if (text.includes("capital") || text.includes("funding")) points.push("Capital access can become the controlling advantage if the numbers are real.");
  if (text.includes("vacant") || text.includes("occupied") || text.includes("tenant")) points.push("Occupancy facts can change value, access, and buyer fit quickly.");
  if (text.includes("title") || text.includes("probate")) points.push("Title clarity creates leverage because most buyers avoid uncertainty.");
  if (!points.length) points.push("Leverage depends on verifying timeline, decision-maker, condition, and price flexibility.");

  return points.slice(0, 5);
}

function monetizationPath(row: Row | null) {
  const text = lowerContext(row);
  const spread = spreadValue(row);
  const arv = arvValue(row);
  const asset = assetClass(row).toLowerCase();

  if (text.includes("foreclosure") || text.includes("deadline")) return "Fast close fee, bridge-capital rescue, or private operator assignment.";
  if (text.includes("capital") || text.includes("funding")) return "Private lending, JV equity, bridge finance, or structured capital placement.";
  if (text.includes("contractor") || text.includes("repair")) return "Contractor-led rescue, operator takeover, wholetail, novation, or rehab JV.";
  if (asset.includes("land")) return "Builder/developer route, entitlement spread, land assignment, or development JV.";
  if (asset.includes("commercial")) return "Operator route, reposition, lease-up, capital placement, or income-asset acquisition.";
  if (spread > 0 && arv && spread / arv >= 0.2) return "Wholesale, fix/flip, rental buyer route, or wholetail.";
  return "Monetization path depends on price rewrite, seller terms, or missing data verification.";
}

function capitalStack(row: Row | null) {
  const text = lowerContext(row);

  if (text.includes("foreclosure") || text.includes("deadline")) return "Bridge capital or cash operator first; seller finance only if deadline allows paperwork.";
  if (text.includes("capital") || text.includes("funding")) return "Private lender + JV equity + staged draw schedule. Consider seller carry if seller wants certainty over cash.";
  if (text.includes("repair") || text.includes("contractor")) return "Hard money/private money plus contractor scope. Avoid loose rehab assumptions.";
  if (text.includes("seller finance") || text.includes("creative")) return "Seller carry, subject-to, wrap, or hybrid seller-finance structure after legal review.";
  return "Cash close, private lender, seller carry, JV equity, or hybrid depending on timeline, title, and spread.";
}

function exitRoute(row: Row | null) {
  const text = lowerContext(row);
  const asset = assetClass(row).toLowerCase();

  if (text.includes("buyer") || text.includes("sell") || text.includes("exit")) return "Private buyer route first; avoid public blast until source and price are controlled.";
  if (text.includes("foreclosure") || text.includes("deadline")) return "Fast close or bridge rescue first, resale/novation second.";
  if (asset.includes("land")) return "Builder/developer route or entitlement play.";
  if (asset.includes("commercial")) return "Commercial operator, owner-user, or income buyer route.";
  if (spreadValue(row) > 0) return "Fix/flip buyer, rental buyer, wholetail, or wholesale route.";
  return "Price rewrite, seller-finance route, or abandon if structure cannot be improved.";
}

function stabilizationDifficulty(row: Row | null) {
  const risk = Math.round((collapseRisk(row) + legalOperationalRisk(row) + liquidityPressure(row)) / 3);
  if (risk >= 75) return "Hard";
  if (risk >= 55) return "Medium";
  return "Manageable";
}

function signalTone(row: Row | null) {
  const score = pressureScore(row);

  if (score >= 75) return { label: "High pressure", color: "#fecaca", border: "rgba(248,113,113,.34)", bg: "rgba(248,113,113,.10)" };
  if (score >= 55) return { label: "Active pressure", color: "#f8e7b0", border: "rgba(232,196,107,.34)", bg: "rgba(232,196,107,.09)" };

  return { label: "Monitor", color: "#cbd5e1", border: "rgba(148,163,184,.22)", bg: "rgba(148,163,184,.06)" };
}

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at 16% 0%, rgba(232,196,107,.16), transparent 30%), radial-gradient(circle at 92% 9%, rgba(248,113,113,.12), transparent 26%), linear-gradient(180deg,#020303,#071326 55%,#020303)",
  color: "white",
  padding: "18px 14px 90px",
  fontFamily: "Arial, sans-serif",
};

const wrap: React.CSSProperties = {
  width: "min(1220px,100%)",
  margin: "0 auto",
};

const panel: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.22)",
  borderRadius: 26,
  padding: 20,
  background: "linear-gradient(145deg,rgba(255,255,255,.060),rgba(255,255,255,.025))",
  boxShadow: "0 24px 78px rgba(0,0,0,.28)",
};

const tightPanel: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.12)",
  borderRadius: 18,
  padding: 14,
  background: "rgba(0,0,0,.16)",
};

const label: React.CSSProperties = {
  color: "#e8c46b",
  letterSpacing: ".17em",
  textTransform: "uppercase",
  fontWeight: 950,
  fontSize: 11,
};

const muted: React.CSSProperties = {
  color: "#cbd5e1",
  lineHeight: 1.55,
};

const button: React.CSSProperties = {
  display: "inline-flex",
  justifyContent: "center",
  alignItems: "center",
  minHeight: 48,
  borderRadius: 999,
  padding: "11px 17px",
  border: 0,
  background: "linear-gradient(135deg,#f8e7b0,#e8c46b)",
  color: "#06100a",
  fontWeight: 950,
  textDecoration: "none",
};

const ghost: React.CSSProperties = {
  ...button,
  background: "rgba(255,255,255,.06)",
  border: "1px solid rgba(255,255,255,.16)",
  color: "white",
};

const chip: React.CSSProperties = {
  border: "1px solid rgba(157,243,191,.22)",
  borderRadius: 999,
  padding: "7px 10px",
  color: "#9df3bf",
  background: "rgba(157,243,191,.07)",
  fontSize: 12,
  fontWeight: 850,
  display: "inline-flex",
};

function MiniMetric({ labelText, value, emphasis = false }: { labelText: string; value: unknown; emphasis?: boolean }) {
  return (
    <div style={tightPanel}>
      <div style={label}>{labelText}</div>
      <div style={{ fontSize: emphasis ? 28 : 20, fontWeight: 950, marginTop: 8, lineHeight: 1.05 }}>
        {clean(value) || "Not listed"}
      </div>
    </div>
  );
}

function ScoreStrip({ labelText, value }: { labelText: string; value: number }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, fontWeight: 950, fontSize: 12 }}>
        <span>{labelText}</span>
        <span>{value}%</span>
      </div>
      <div style={{ height: 8, borderRadius: 999, background: "rgba(255,255,255,.12)", overflow: "hidden", marginTop: 8 }}>
        <div style={{ width: `${value}%`, height: "100%", borderRadius: 999, background: "linear-gradient(90deg,#ff6b6b,#f8e7b0,#56d8ff)" }} />
      </div>
    </div>
  );
}

function DetailLine({ labelText, value }: { labelText: string; value: unknown }) {
  return (
    <div style={{ borderBottom: "1px solid rgba(255,255,255,.08)", padding: "11px 0" }}>
      <div style={{ ...label, fontSize: 10 }}>{labelText}</div>
      <div style={{ ...muted, marginTop: 5, fontWeight: 750 }}>{clean(value) || "Not listed"}</div>
    </div>
  );
}

function IntelligencePanel({ title, children, tone = "gold" }: { title: string; children: React.ReactNode; tone?: "gold" | "red" | "green" | "blue" }) {
  const color = tone === "red" ? "#fecaca" : tone === "green" ? "#9df3bf" : tone === "blue" ? "#56d8ff" : "#e8c46b";

  return (
    <div style={{ ...tightPanel, borderColor: `${color}55` }}>
      <div style={{ ...label, color }}>{title}</div>
      <div style={{ ...muted, marginTop: 9, fontSize: 16 }}>{children}</div>
    </div>
  );
}

export default function PainRoomPage() {
  const [email, setEmail] = useState("");
  const [pain, setPain] = useState<Row | null>(null);
  const [status, setStatus] = useState("Loading Pressure Room...");

  async function load() {
    const viewer = getEmail();
    setEmail(viewer);

    const pathParts = window.location.pathname.split("/").filter(Boolean);
    const id = decodeURIComponent(pathParts[pathParts.length - 1] || "");

    if (!id) {
      setStatus("Missing Pressure Room ID.");
      return;
    }

    try {
      const owner = viewer === "bcrsoutheast@gmail.com";
      const ownerFlag = owner ? "1" : "0";

      const response = await fetch(`/api/pain/feed?id=${encodeURIComponent(id)}&email=${encodeURIComponent(viewer)}&owner=${ownerFlag}`, {
        cache: "no-store",
        credentials: "include",
        headers: {
          "x-vf-email": viewer,
          "x-vf-admin": ownerFlag,
        },
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || data?.ok === false) {
        throw new Error(data?.error || "Pressure record not found.");
      }

      const found = data.pain || (Array.isArray(data.pains) ? data.pains[0] : null) || null;

      if (!found) {
        setStatus("Pressure record not found.");
        return;
      }

      setPain(found);
      setStatus("");
    } catch (error: any) {
      setStatus(error?.message || "Could not load Pressure Room.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  const photos = useMemo(() => photosOf(pain), [pain]);
  const heroPhoto = photos[0] || "";
  const signalId = signalIdOf(pain);
  const owner = ownerOf(pain);
  const contactName = contactNameOf(pain);
  const contactPhone = contactPhoneOf(pain);
  const contactEmail = contactEmailOf(pain);
  const preferredContact = preferredContactOf(pain);
  const contactNotes = contactNotesOf(pain);
  const contactTarget = cleanEmail(contactEmail || owner);
  const tone = signalTone(pain);
  const phoneHref = contactPhone ? `tel:${contactPhone.replace(/[^0-9+]/g, "")}` : "";
  const emailHref = contactEmail ? `mailto:${contactEmail}` : "";
  const contactHref = signalId
    ? `/connect/${encodeURIComponent(signalId)}?email=${encodeURIComponent(email)}${contactTarget ? `&to=${encodeURIComponent(contactTarget)}` : ""}&source=pressure&type=pressure&folder=pressure&folder_key=pressure&title=${encodeURIComponent(titleOf(pain))}&subject=${encodeURIComponent(titleOf(pain))}`
    : `/messages/new?email=${encodeURIComponent(email)}${contactTarget ? `&to=${encodeURIComponent(contactTarget)}` : ""}&source=pressure&type=pressure&folder=pressure&folder_key=pressure&title=${encodeURIComponent(titleOf(pain))}&subject=${encodeURIComponent(titleOf(pain))}`;

  const risks = riskScanner(pain);
  const leverage = leveragePoints(pain);
  const missing = missingInfo(pain);
  const stack = whoShouldSee(pain);

  return (
    <main style={page}>
      <style>{`
        @media (max-width: 860px) {
          .vf-main-grid,
          .vf-metric-grid,
          .vf-detail-grid,
          .vf-actions,
          .vf-lower-grid,
          .vf-intel-grid {
            grid-template-columns: 1fr !important;
          }

          .vf-actions {
            display: grid !important;
            gap: 10px !important;
          }

          .vf-actions > * {
            width: 100%;
            box-sizing: border-box;
            justify-content: center;
          }

          .vf-hero-title {
            font-size: 54px !important;
          }
        }
      `}</style>

      <div style={wrap}>
        {pain ? (
          <VaultForgeRoomCommandBar
            lane="pressure"
            roomId={idOf(pain)}
            title={titleOf(pain)}
            ownerEmail={contactEmailOf(pain) || ownerOf(pain)}
          />
        ) : null}

        <section className="vf-main-grid" style={{ display: "grid", gridTemplateColumns: "1.05fr .95fr", gap: 16, marginBottom: 16 }}>
          <div style={{ ...panel, padding: 0, overflow: "hidden" }}>
            {heroPhoto ? (
              <img src={heroPhoto} alt="Pressure context" style={{ width: "100%", height: 330, objectFit: "cover", display: "block" }} />
            ) : (
              <div style={{ height: 260, display: "grid", placeItems: "center", color: "#94a3b8", fontWeight: 900 }}>No photo attached</div>
            )}

            <div style={{ padding: 20 }}>
              <div style={label}>VaultForge Surgeon AI · Pressure Room</div>
              <h1 className="vf-hero-title" style={{ fontSize: "clamp(52px,8vw,88px)", lineHeight: .88, letterSpacing: "-.07em", margin: "10px 0 12px" }}>
                {pain ? titleOf(pain) : "Pressure Room"}
              </h1>

              {status ? <p style={{ ...muted, fontSize: 18 }}>{status}</p> : null}

              {pain ? (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
                  <span style={chip}>{statusOf(pain)}</span>
                  <span style={chip}>Severity: {severityLabel(pain)}</span>
                  <span style={chip}>{assetClass(pain)}</span>
                  <span style={chip}>{marketOf(pain)}</span>
                </div>
              ) : null}
            </div>
          </div>

          <aside style={{ ...panel, display: "grid", gap: 14 }}>
            <div>
              <div style={label}>Situation Diagnosis</div>
              <p style={{ ...muted, fontSize: 19, margin: "9px 0 0" }}>
                {pain
                  ? `${assetClass(pain)} ${pressureType(pain).toLowerCase()} in ${marketOf(pain)}. Core failure point: ${primaryBottleneck(pain)}. ${rootCause(pain)}`
                  : "Loading pressure intelligence..."}
              </p>
            </div>

            <div style={{ border: `1px solid ${tone.border}`, background: tone.bg, borderRadius: 18, padding: 14 }}>
              <div style={{ ...label, color: tone.color }}>Pressure Signal · {tone.label}</div>
              <div style={{ color: tone.color, fontSize: 24, fontWeight: 950, marginTop: 8 }}>{primaryBottleneck(pain)}</div>
            </div>

            <div style={tightPanel}>
              <div style={label}>AI Command Recommendation</div>
              <div style={{ fontSize: 22, lineHeight: 1.25, fontWeight: 950, marginTop: 8 }}>{commandRecommendation(pain)}</div>
            </div>

            <div style={tightPanel}>
              <div style={label}>Operator Deployment Stack</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                {stack.map((item) => (
                  <span key={item} style={chip}>{item}</span>
                ))}
              </div>
            </div>

            <div className="vf-actions" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <Link href={contactHref} style={button}>Message Source</Link>
              <Link href="/pain-feed" style={ghost}>Pressure Feed</Link>
              <Link href="/dashboard" style={ghost}>Command</Link>
              <button type="button" onClick={load} style={ghost}>Refresh</button>
            </div>
          </aside>
        </section>

        {pain ? (
          <>
            <section style={{ ...panel, marginBottom: 16 }}>
              <div style={label}>Institutional Surgeon Read</div>

              <div className="vf-metric-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 14, marginTop: 14 }}>
                <ScoreStrip labelText="Pressure Severity" value={pressureScore(pain)} />
                <ScoreStrip labelText="Collapse Risk" value={collapseRisk(pain)} />
                <ScoreStrip labelText="Timeline Pressure" value={timelinePressure(pain)} />
                <ScoreStrip labelText="Liquidity Pressure" value={liquidityPressure(pain)} />
              </div>

              <div className="vf-metric-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 14, marginTop: 14 }}>
                <ScoreStrip labelText="Resolution Readiness" value={resolutionScore(pain)} />
                <ScoreStrip labelText="Legal / Operational Risk" value={legalOperationalRisk(pain)} />
                <ScoreStrip labelText="Data Confidence" value={resolutionScore(pain)} />
                <ScoreStrip labelText="Execution Difficulty" value={stabilizationDifficulty(pain) === "Hard" ? 78 : stabilizationDifficulty(pain) === "Medium" ? 56 : 34} />
              </div>

              <div className="vf-intel-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 14, marginTop: 18 }}>
                <IntelligencePanel title="Root Cause Analysis" tone="red">{rootCause(pain)}</IntelligencePanel>
                <IntelligencePanel title="Likely Outcome If Ignored" tone="red">{failurePrediction(pain)}</IntelligencePanel>
                <IntelligencePanel title="Recommended Structure" tone="gold">{strategicStructure(pain)}</IntelligencePanel>
                <IntelligencePanel title="AI Rewrite The Fix" tone="blue">{aiRewrite(pain)}</IntelligencePanel>
                <IntelligencePanel title="Best Move Now" tone="green">{bestMove(pain)}</IntelligencePanel>
                <IntelligencePanel title="Worst Move Now" tone="red">{worstMove(pain)}</IntelligencePanel>
                <IntelligencePanel title="Potential Monetization Path" tone="gold">{monetizationPath(pain)}</IntelligencePanel>
                <IntelligencePanel title="Capital Stack Recommendation" tone="blue">{capitalStack(pain)}</IntelligencePanel>
                <IntelligencePanel title="Exit Route Recommendation" tone="green">{exitRoute(pain)}</IntelligencePanel>
              </div>
            </section>

            <section className="vf-lower-grid" style={{ display: "grid", gridTemplateColumns: "1.15fr .85fr", gap: 16, marginBottom: 16 }}>
              <div style={panel}>
                <div style={label}>Situation Brief</div>
                <p style={{ ...muted, fontSize: 18, marginTop: 10 }}>{problemText(pain)}</p>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12, marginTop: 16 }}>
                  <MiniMetric labelText="Pressure Type" value={pressureType(pain)} />
                  <MiniMetric labelText="Market / Address" value={field(pain, "address", "property_address", "location") || marketOf(pain)} />
                  <MiniMetric labelText="Owner Goal" value={ownerGoal(pain)} />
                  <MiniMetric labelText="Stabilization Difficulty" value={stabilizationDifficulty(pain)} />
                </div>
              </div>

              <div style={panel}>
                <div style={label}>Source Contact</div>
                <div style={{ marginTop: 12 }}>
                  <DetailLine labelText="Name" value={contactName || "Not listed"} />
                  <DetailLine labelText="Phone" value={contactPhone || "Not listed"} />
                  <DetailLine labelText="Email" value={contactEmail || owner || "Not listed"} />
                  <DetailLine labelText="Preferred Contact" value={preferredContact || "Not listed"} />
                  <DetailLine labelText="Notes" value={contactNotes || "Not listed"} />
                </div>

                <div className="vf-actions" style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
                  {phoneHref ? <a href={phoneHref} style={button}>Call</a> : null}
                  {emailHref ? <a href={emailHref} style={ghost}>Email</a> : null}
                  <Link href={contactHref} style={ghost}>Message</Link>
                </div>
              </div>
            </section>

            <section className="vf-lower-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div style={panel}>
                <div style={label}>Risk Scanner</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
                  {risks.map((item) => (
                    <span key={item} style={{ ...chip, color: "#fecaca", borderColor: "rgba(248,113,113,.32)", background: "rgba(248,113,113,.08)" }}>{item}</span>
                  ))}
                </div>
              </div>

              <div style={panel}>
                <div style={label}>Leverage Points</div>
                <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
                  {leverage.map((item) => (
                    <div key={item} style={tightPanel}>{item}</div>
                  ))}
                </div>
              </div>
            </section>

            <section style={{ ...panel, marginBottom: 16 }}>
              <div style={label}>Missing Intelligence Blocking Full Resolution</div>
              {missing.length ? (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
                  {missing.map((item) => (
                    <span key={item} style={{ ...chip, color: "#f8e7b0", borderColor: "rgba(232,196,107,.32)", background: "rgba(232,196,107,.08)" }}>{item}</span>
                  ))}
                </div>
              ) : (
                <p style={{ ...muted, marginTop: 10 }}>Ready for first-pass routing.</p>
              )}
            </section>

            <section style={{ ...panel, marginBottom: 16 }}>
              <div style={label}>Asset Snapshot</div>
              <div className="vf-detail-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 12, marginTop: 14 }}>
                <MiniMetric labelText="Ask / Target" value={money(field(pain, "asking_price", "price", "target_price"))} emphasis />
                <MiniMetric labelText="ARV / Value" value={money(field(pain, "arv", "arv_value", "estimated_value", "property_value"))} emphasis />
                <MiniMetric labelText="Repairs / Scope" value={money(field(pain, "repair_estimate", "repairs_needed", "estimated_repairs", "repair_budget"))} emphasis />
                <MiniMetric labelText="Spread Read" value={spreadText(pain)} emphasis />
                <MiniMetric labelText="Beds / Baths" value={[field(pain, "beds", "bedrooms"), field(pain, "baths", "bathrooms")].filter(Boolean).join(" / ") || "Not listed"} />
                <MiniMetric labelText="Sqft / Acres" value={field(pain, "square_feet", "sqft", "building_sqft", "acres", "land_acres")} />
                <MiniMetric labelText="Occupancy" value={field(pain, "occupancy", "tenant_status", "vacancy_status")} />
                <MiniMetric labelText="Timeline" value={field(pain, "timeline", "deadline", "desired_timeline")} />
              </div>
            </section>

            {photos.length > 1 ? (
              <section style={{ ...panel, marginBottom: 16 }}>
                <div style={label}>Additional Photos</div>
                <div className="vf-photo-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12, marginTop: 14 }}>
                  {photos.slice(1).map((url) => (
                    <img key={url} src={url} alt="Pressure context" style={{ width: "100%", height: 180, objectFit: "cover", borderRadius: 18, border: "1px solid rgba(232,196,107,.18)" }} />
                  ))}
                </div>
              </section>
            ) : null}

            <details style={{ ...panel, marginBottom: 16 }}>
              <summary style={{ cursor: "pointer", fontWeight: 950, color: "#e8c46b", letterSpacing: ".12em", textTransform: "uppercase" }}>
                System IDs / Routing Trace
              </summary>
              <div style={{ marginTop: 14 }}>
                <DetailLine labelText="Pressure ID" value={idOf(pain)} />
                <DetailLine labelText="Signal ID" value={signalId || "Not linked"} />
                <DetailLine labelText="Submitted By" value={owner || email || "Not listed"} />
              </div>
            </details>
          </>
        ) : null}
      </div>
    </main>
  );
}
