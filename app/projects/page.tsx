"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Row = Record<string, any>;
type FolderMode = "active" | "opportunity" | "pressure" | "saved" | "archived" | "deleted";

const OWNER_EMAIL = "bcrsoutheast@gmail.com";

function clean(value: unknown) {
  return String(value || "").trim();
}

function cleanEmail(value: unknown) {
  return clean(value).toLowerCase();
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

function parseArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item: any) => {
        if (typeof item === "string") return clean(item);
        if (item && typeof item === "object") {
          return clean(item.url || item.publicUrl || item.public_url || item.photo_url || item.image_url || item.main_photo_url);
        }
        return "";
      })
      .filter(Boolean);
  }

  const text = clean(value);
  if (!text) return [];

  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return parseArray(parsed);
  } catch {
    // Continue as delimited text.
  }

  return text
    .split(/[,\n|;]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function readSet(key: string) {
  if (typeof window === "undefined") return new Set<string>();

  try {
    const raw = window.localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(parsed) ? parsed.map(clean).filter(Boolean) : []);
  } catch {
    return new Set<string>();
  }
}

function writeSet(key: string, value: Set<string>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(Array.from(value)));
}

function meta(row: Row) {
  return typeof row?.metadata === "object" && row.metadata ? row.metadata : {};
}

function field(row: Row, ...keys: string[]) {
  const m = meta(row);
  const values: unknown[] = [];

  for (const key of keys) {
    values.push(row[key]);
    values.push(m[key]);
  }

  return first(...values);
}

function sourceOf(row: Row) {
  const source = first(row.source_kind, row.source_table, row._source_table, row.source, field(row, "canonical_kind")).toLowerCase();

  if (source.includes("deal") || field(row, "deal_id", "asking_price", "price", "arv", "arv_value", "estimated_value")) return "deal";
  if (source.includes("pain") || field(row, "pain_id", "pain_type", "problem_type")) return "pain";

  return "signal";
}

function idOf(row: Row) {
  return field(row, "deal_id", "project_id", "item_id", "id", "pain_id", "signal_id");
}

function dealIdOf(row: Row) {
  return field(row, "deal_id", "project_id", "item_id", "related_deal_id", "id");
}

function painIdOf(row: Row) {
  return field(row, "pain_id", "id", "item_id", "signal_id");
}

function signalIdOf(row: Row) {
  return field(row, "signal_id", "signalId", "alert_id", "routing_id", "canonical_event_id");
}

function titleOf(row: Row) {
  return field(row, "title", "deal_title", "project_title", "pain_title", "problem_title", "headline", "name", "address") || "VaultForge Workstation";
}

function assetOf(row: Row) {
  return field(row, "asset_type", "property_type", "deal_type", "pain_type", "problem_type") || "Asset";
}

function statusOf(row: Row) {
  return field(row, "status", "project_status", "stage", "routing_status", "pain_status") || "Open";
}

function marketOf(row: Row) {
  const city = field(row, "city");
  const state = field(row, "state", "market", "operating_state");
  return [city, state].filter(Boolean).join(", ") || field(row, "location", "address", "property_address") || "Market not listed";
}

const CORE_STATES = ["Georgia", "Tennessee", "Alabama", "Florida", "North Carolina", "South Carolina", "Texas"];

const STATE_ALIASES: Record<string, string> = {
  ga: "Georgia",
  georgia: "Georgia",
  fl: "Florida",
  florida: "Florida",
  tn: "Tennessee",
  tennessee: "Tennessee",
  al: "Alabama",
  alabama: "Alabama",
  nc: "North Carolina",
  "north carolina": "North Carolina",
  "north-carolina": "North Carolina",
  sc: "South Carolina",
  "south carolina": "South Carolina",
  "south-carolina": "South Carolina",
  tx: "Texas",
  texas: "Texas",
};

function normalizeStateName(value: unknown) {
  const raw = clean(value);
  if (!raw) return "";

  const lower = raw.toLowerCase().replace(/[^a-z]+/g, " ").trim();
  const dash = lower.replace(/\s+/g, "-");

  return STATE_ALIASES[raw.toLowerCase()] || STATE_ALIASES[lower] || STATE_ALIASES[dash] || "";
}

function stateOf(row: Row) {
  const direct = normalizeStateName(field(row, "state", "market_state", "property_state", "deal_state", "operating_state", "location_state"));
  if (direct) return direct;

  const market = marketOf(row);
  const parts = market.split(",").map((part) => clean(part)).filter(Boolean);

  for (let index = parts.length - 1; index >= 0; index -= 1) {
    const state = normalizeStateName(parts[index]);
    if (state) return state;
  }

  const combined = market.toLowerCase();
  for (const state of CORE_STATES) {
    if (combined.includes(state.toLowerCase())) return state;
  }

  return "Unlisted";
}

function countyOf(row: Row) {
  const direct = field(row, "county", "county_name", "market_county", "submarket", "area", "city");
  if (direct) return direct;

  const market = marketOf(row);
  const parts = market.split(",").map((part) => clean(part)).filter(Boolean);

  if (parts.length >= 2) return parts[0];

  return field(row, "location", "address", "property_address") || "Unlisted";
}

function ownerOf(row: Row) {
  return cleanEmail(field(row, "owner_email", "member_email", "user_email", "submitted_by_email", "created_by_email", "submitted_by", "email"));
}

function photosOf(row: Row) {
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
    ...parseArray(m.photo_urls),
    ...parseArray(m.photos),
  ];

  return Array.from(
    new Set(
      values
        .map((item: any) => {
          if (typeof item === "string") return clean(item);
          if (item && typeof item === "object") {
            return clean(item.url || item.publicUrl || item.public_url || item.photo_url || item.image_url || item.main_photo_url);
          }
          return "";
        })
        .filter((url) => url.startsWith("http"))
    )
  );
}

function money(value: unknown) {
  const text = clean(value);
  if (!text) return "Not listed";

  const number = Number(text.replace(/[^\d.-]/g, ""));
  if (!Number.isFinite(number)) return text;

  return number.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function numberValue(value: unknown) {
  const text = clean(value);
  if (!text) return NaN;
  const number = Number(text.replace(/[^\d.-]/g, ""));
  return Number.isFinite(number) ? number : NaN;
}

function normalizedKey(value: unknown) {
  return clean(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function canonicalKey(row: Row) {
  const direct =
    field(row, "canonical_project_key") ||
    field(row, "canonical_event_id") ||
    field(row, "deal_id") ||
    field(row, "project_id") ||
    field(row, "pain_id") ||
    field(row, "item_id") ||
    field(row, "id");

  if (direct) return `id:${normalizedKey(direct)}`;

  const signal = field(row, "signal_id", "alert_id", "routing_id");
  if (signal) return `signal:${normalizedKey(signal)}`;

  const title = normalizedKey(titleOf(row));
  const market = normalizedKey(marketOf(row));
  const owner = normalizedKey(ownerOf(row));
  const asset = normalizedKey(assetOf(row));

  return `fuzzy:${[title, market, owner, asset].filter(Boolean).join(":")}`;
}

function duplicateFamilyKey(row: Row) {
  const source = sourceOf(row);
  const title = normalizedKey(titleOf(row));
  const market = normalizedKey(marketOf(row));
  const owner = normalizedKey(ownerOf(row));
  const asset = normalizedKey(assetOf(row));
  const ask = normalizedKey(field(row, "asking_price", "price", "ask", "purchase_price", "target_price"));
  const arv = normalizedKey(field(row, "arv", "arv_value", "estimated_value", "after_repair_value", "property_value"));

  return `family:${[source, title, market, owner, asset, ask, arv].filter(Boolean).join(":")}`;
}

function completenessScore(row: Row) {
  let score = 0;
  const keys = [
    "asking_price",
    "price",
    "arv",
    "arv_value",
    "estimated_value",
    "repair_estimate",
    "repairs_needed",
    "estimated_repairs",
    "beds",
    "bedrooms",
    "baths",
    "bathrooms",
    "square_feet",
    "sqft",
    "building_sqft",
    "strategy",
    "exit_strategy",
    "routing_needs",
    "deal_needs",
    "distress_signals",
    "route_summary",
    "ai_route_summary",
    "routing_summary",
    "summary",
  ];

  for (const key of keys) {
    if (field(row, key)) score += 1;
  }

  if (photosOf(row).length) score += 5;

  const source = first(row.source_table, row._source_table, row.source).toLowerCase();
  if (source.includes("vf_deals")) score += 100;
  if (source.includes("deal")) score += 20;

  return score;
}

function mergeRows(primary: Row, secondary: Row) {
  const primaryMeta = meta(primary);
  const secondaryMeta = meta(secondary);
  const merged: Row = {
    ...secondary,
    ...primary,
    metadata: {
      ...secondaryMeta,
      ...primaryMeta,
    },
  };

  const photos = Array.from(
    new Set(
      [
        ...parseArray(secondary.photo_urls),
        ...parseArray(primary.photo_urls),
        ...parseArray(secondaryMeta.photo_urls),
        ...parseArray(primaryMeta.photo_urls),
        ...photosOf(secondary),
        ...photosOf(primary),
      ]
        .map(clean)
        .filter(Boolean)
    )
  );

  if (photos.length) {
    merged.photo_urls = photos;
    merged.photos = photos.map((url) => ({ url }));
    merged.main_photo_url = first(primary.main_photo_url, secondary.main_photo_url, photos[0]);
    merged.image_url = first(primary.image_url, secondary.image_url, merged.main_photo_url);
    merged.photo_url = first(primary.photo_url, secondary.photo_url, merged.main_photo_url);
  }

  return merged;
}

function stripPayload(value: unknown) {
  let text = clean(value);
  const start = text.indexOf("VF_PAIN_PAYLOAD_START");
  if (start !== -1) text = text.slice(0, start).trim();
  const jsonStart = text.indexOf('{"pain_id"');
  if (jsonStart !== -1) text = text.slice(0, jsonStart).trim();
  return text;
}

function noteOf(row: Row) {
  return stripPayload(
    field(
      row,
      "ai_route_summary",
      "route_summary",
      "routing_summary",
      "ai_summary",
      "summary",
      "description",
      "notes",
      "note",
      "strategy_notes",
      "urgency_reason",
      "routing_reason",
      "message",
      "help_requested",
      "requested_help"
    )
  );
}

function askOf(row: Row) {
  return field(row, "asking_price", "price", "ask", "purchase_price", "target_price");
}

function arvOf(row: Row) {
  return field(row, "arv", "arv_value", "estimated_value", "after_repair_value", "property_value");
}

function repairsOf(row: Row) {
  return field(row, "repair_estimate", "repairs_needed", "estimated_repairs", "rehab_budget", "repair_budget", "repair_scope");
}

function spreadNumber(row: Row) {
  const ask = numberValue(askOf(row));
  const arv = numberValue(arvOf(row));
  const repairs = numberValue(repairsOf(row));

  if (!Number.isFinite(arv) || !Number.isFinite(ask)) return NaN;
  return arv - ask - (Number.isFinite(repairs) ? repairs : 0);
}

function spreadText(row: Row) {
  const spread = spreadNumber(row);
  if (!Number.isFinite(spread)) return "Needs numbers";
  return money(spread);
}

function marginScore(row: Row) {
  const spread = spreadNumber(row);
  const arv = numberValue(arvOf(row));
  if (!Number.isFinite(spread) || !Number.isFinite(arv) || !arv) return 0;
  return Math.round((spread / arv) * 100);
}

function routingNeed(row: Row) {
  return field(row, "routing_needs", "deal_needs", "needs", "route_context", "requested_help", "help_requested");
}

function pressureText(row: Row) {
  return field(row, "distress_signals", "seller_pressure", "pain_signals", "urgency", "urgency_level") || "No pressure signal listed";
}

function likelyRoute(row: Row) {
  const text = `${routingNeed(row)} ${pressureText(row)} ${field(row, "strategy", "exit_strategy", "deal_strategy")} ${assetOf(row)} ${noteOf(row)}`.toLowerCase();
  const source = sourceOf(row);

  if (text.includes("lender") || text.includes("fund") || text.includes("capital")) return "Capital / Lender Route";
  if (text.includes("contractor") || text.includes("repair") || text.includes("scope")) return "Contractor / Operator Route";
  if (text.includes("jv") || text.includes("partner")) return "JV / Operator Route";
  if (text.includes("buyer") || text.includes("sell") || text.includes("disposition") || text.includes("wholesale")) return "Buyer / Disposition Route";
  if (source === "pain") return "Problem Solver Route";
  if (text.includes("land") || text.includes("zoning") || text.includes("entitlement")) return "Builder / Developer Route";
  if (text.includes("commercial") || text.includes("noi") || text.includes("cap")) return "Investor / Operator Route";

  return "Owner-Controlled Review";
}

function situationDiagnosis(row: Row) {
  const source = sourceOf(row);
  const text = `${pressureText(row)} ${routingNeed(row)} ${noteOf(row)} ${assetOf(row)}`.toLowerCase();

  if (text.includes("foreclosure") || text.includes("deadline")) return "Timeline compression / distressed exit";
  if (text.includes("capital") || text.includes("funding") || text.includes("lender")) return "Capital stack or liquidity gap";
  if (text.includes("contractor") || text.includes("repair") || text.includes("scope")) return "Execution or contractor bottleneck";
  if (text.includes("tenant") || text.includes("occupied")) return "Occupancy/access risk";
  if (text.includes("permit") || text.includes("code") || text.includes("city")) return "Municipal/code execution issue";
  if (text.includes("title") || text.includes("probate") || text.includes("lien")) return "Title/legal constraint";
  if (source === "deal" && Number.isFinite(spreadNumber(row)) && spreadNumber(row) > 0) return "Opportunity with monetizable spread";
  if (source === "deal") return "Opportunity requiring underwriting";
  if (source === "pain") return "Pressure signal requiring triage";
  return "Signal requiring owner review";
}

function rootCause(row: Row) {
  const diagnosis = situationDiagnosis(row);

  if (diagnosis.includes("Timeline")) return "Time is the main enemy. Certainty, authority, and speed matter more than perfect pricing.";
  if (diagnosis.includes("Capital")) return "The current path is undercapitalized or blocked by liquidity/debt constraints.";
  if (diagnosis.includes("Execution")) return "The work cannot move until scope, labor, access, and operator responsibility are clarified.";
  if (diagnosis.includes("Occupancy")) return "Access, lease status, or occupant control can block inspection, lending, and closing.";
  if (diagnosis.includes("Municipal")) return "Local approval or code friction must be solved before underwriting is reliable.";
  if (diagnosis.includes("Title")) return "Authority, lien, or legal uncertainty can kill the route if not verified first.";
  if (diagnosis.includes("spread")) return "There may be enough economics to justify controlled routing after verification.";
  return "The signal is incomplete. More intelligence is needed before hard routing.";
}

function solutionPaths(row: Row) {
  const text = `${situationDiagnosis(row)} ${likelyRoute(row)} ${noteOf(row)} ${assetOf(row)}`.toLowerCase();
  const paths: string[] = [];

  if (sourceOf(row) === "deal") {
    paths.push("Private buyer/operator route");
    if (marginScore(row) >= 20) paths.push("Fix/flip or rental buyer execution");
    if (marginScore(row) > 0 && marginScore(row) < 20) paths.push("Renegotiate or buyer-specific disposition");
    if (text.includes("seller") || text.includes("creative")) paths.push("Seller finance / creative structure");
    if (text.includes("land")) paths.push("Builder/developer route");
  } else {
    paths.push("Triage and stabilize pressure");
    if (text.includes("capital")) paths.push("Bridge capital / JV rescue");
    if (text.includes("contractor")) paths.push("Contractor-led stabilization");
    if (text.includes("buyer")) paths.push("Private buyer/disposition route");
    if (text.includes("title")) paths.push("Title/legal verification first");
  }

  paths.push("Abandon or pause if risk blockers cannot be cleared");
  return Array.from(new Set(paths)).slice(0, 4);
}

function capitalStack(row: Row) {
  const text = `${situationDiagnosis(row)} ${noteOf(row)} ${assetOf(row)}`.toLowerCase();

  if (text.includes("capital") || text.includes("funding")) return "Private lender + JV equity + staged draw plan";
  if (text.includes("foreclosure") || text.includes("deadline")) return "Cash operator or bridge rescue first";
  if (text.includes("contractor") || text.includes("repair")) return "Hard money/private money after contractor scope";
  if (text.includes("land")) return "Cash, seller carry, builder deposit, or entitlement JV";
  if (text.includes("commercial")) return "Commercial debt, bridge, seller carry, or operator equity";
  return "Cash, private lending, seller carry, JV equity, or hybrid after verification";
}

function failureIndex(row: Row) {
  let score = 25;
  const text = `${pressureText(row)} ${noteOf(row)} ${routingNeed(row)}`.toLowerCase();

  if (text.includes("urgent")) score += 20;
  if (text.includes("foreclosure")) score += 28;
  if (text.includes("deadline")) score += 18;
  if (text.includes("title") || text.includes("probate") || text.includes("lien")) score += 20;
  if (text.includes("tenant") || text.includes("occupied")) score += 12;
  if (text.includes("permit") || text.includes("code")) score += 12;
  if (sourceOf(row) === "deal" && Number.isFinite(spreadNumber(row)) && spreadNumber(row) <= 0) score += 18;
  if (!photosOf(row).length) score += 6;
  if (!routingNeed(row)) score += 6;

  return Math.max(0, Math.min(100, Math.round(score)));
}

function bestNextMove(row: Row) {
  const diagnosis = situationDiagnosis(row);
  const route = likelyRoute(row);
  const need = routingNeed(row);

  if (diagnosis.includes("Title")) return "Verify title, ownership authority, payoff, and decision-maker before routing operators.";
  if (diagnosis.includes("Timeline")) return "Confirm the deadline and route only to operators who can perform immediately.";
  if (diagnosis.includes("Capital")) return "Package numbers and gap amount, then route to lender/JV/creative finance operator.";
  if (diagnosis.includes("Execution")) return "Get photos, access, and contractor scope before buyer or lender exposure.";
  if (need) return `Route first to ${route.replace(" Route", "").toLowerCase()} and verify: ${need}.`;
  if (sourceOf(row) === "deal") return "Package key numbers, verify spread, then route privately through the best operator lane.";
  if (sourceOf(row) === "pain") return "Clarify blocker, timeline, and owner goal, then open the problem-solver route.";
  return "Review the signal, confirm owner context, then choose controlled routing.";
}

function worstMove(row: Row) {
  const diagnosis = situationDiagnosis(row);
  if (diagnosis.includes("Title")) return "Do not blast to buyers before authority/title is verified.";
  if (diagnosis.includes("Timeline")) return "Do not wait for perfect data if the deadline is real.";
  if (diagnosis.includes("Execution")) return "Do not quote or route hard without repair/scope confidence.";
  if (sourceOf(row) === "deal" && Number.isFinite(spreadNumber(row)) && spreadNumber(row) <= 0) return "Do not market as a normal deal; rewrite pricing or terms first.";
  return "Do not treat this like a public listing. Keep routing controlled until strategy is clear.";
}

function operatingScore(row: Row) {
  let score = 44;
  if (askOf(row)) score += 8;
  if (arvOf(row)) score += 8;
  if (repairsOf(row)) score += 7;
  if (routingNeed(row)) score += 10;
  if (pressureText(row) !== "No pressure signal listed") score += 8;
  if (field(row, "strategy", "exit_strategy", "deal_strategy")) score += 6;
  if (photosOf(row).length) score += 9;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function urgencyScore(row: Row) {
  const text = `${pressureText(row)} ${field(row, "seller_situation", "timeline", "deadline")} ${noteOf(row)}`.toLowerCase();
  let score = 36;
  if (text.includes("urgent")) score += 28;
  if (text.includes("fast close")) score += 24;
  if (text.includes("funding gap")) score += 18;
  if (text.includes("foreclosure")) score += 28;
  if (text.includes("deadline")) score += 18;
  if (routingNeed(row)) score += 8;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function missingInfo(row: Row) {
  const missing: string[] = [];
  if (!routingNeed(row)) missing.push("route target");
  if (!pressureText(row) || pressureText(row) === "No pressure signal listed") missing.push("pressure/timeline");
  if (sourceOf(row) === "deal" && !askOf(row)) missing.push("ask");
  if (sourceOf(row) === "deal" && !arvOf(row)) missing.push("ARV/value");
  if (!photosOf(row).length) missing.push("photos");
  if (!field(row, "owner_email", "member_email", "contact_email", "owner_contact_email")) missing.push("source contact");
  return missing.slice(0, 5);
}

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(232,196,107,.14), transparent 28%), radial-gradient(circle at 88% 10%, rgba(56,189,248,.10), transparent 26%), radial-gradient(circle at bottom right, rgba(181,92,255,.10), transparent 24%), linear-gradient(180deg,#020303,#071326 55%,#020303)",
  color: "white",
  padding: "22px 16px 96px",
  fontFamily: "Arial, sans-serif",
};

const wrap: React.CSSProperties = { width: "min(1280px,100%)", margin: "0 auto" };

const card: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.22)",
  borderRadius: 28,
  padding: 22,
  background: "linear-gradient(145deg,rgba(255,255,255,.060),rgba(255,255,255,.028))",
  boxShadow: "0 28px 86px rgba(0,0,0,.30)",
  marginBottom: 18,
};

const glass: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.12)",
  borderRadius: 22,
  padding: 16,
  background: "rgba(255,255,255,.045)",
};

const label: React.CSSProperties = {
  color: "#e8c46b",
  letterSpacing: ".18em",
  textTransform: "uppercase",
  fontWeight: 950,
  fontSize: 12,
};

const muted: React.CSSProperties = { color: "#cbd5e1", lineHeight: 1.55 };

const button: React.CSSProperties = {
  display: "inline-flex",
  justifyContent: "center",
  alignItems: "center",
  minHeight: 48,
  borderRadius: 999,
  padding: "12px 17px",
  border: 0,
  background: "linear-gradient(135deg,#f8e7b0,#e8c46b)",
  color: "#06100a",
  fontWeight: 950,
  textDecoration: "none",
  cursor: "pointer",
};

const ghost: React.CSSProperties = {
  ...button,
  background: "rgba(255,255,255,.06)",
  border: "1px solid rgba(255,255,255,.16)",
  color: "white",
};

const dangerGhost: React.CSSProperties = {
  ...ghost,
  border: "1px solid rgba(248,113,113,.34)",
  color: "#fecaca",
  background: "rgba(248,113,113,.08)",
};

const commandBar: React.CSSProperties = {
  position: "sticky",
  top: 10,
  zIndex: 40,
  border: "1px solid rgba(232,196,107,.28)",
  borderRadius: 24,
  padding: 12,
  background: "linear-gradient(145deg,rgba(2,6,23,.92),rgba(7,19,38,.86))",
  boxShadow: "0 18px 70px rgba(0,0,0,.42)",
  backdropFilter: "blur(14px)",
  marginBottom: 16,
};

const smallButton: React.CSSProperties = {
  ...button,
  minHeight: 40,
  padding: "9px 12px",
  fontSize: 13,
};

const smallGhost: React.CSSProperties = {
  ...ghost,
  minHeight: 40,
  padding: "9px 12px",
  fontSize: 13,
};

const closeButton: React.CSSProperties = {
  ...smallGhost,
  color: "#fecaca",
  border: "1px solid rgba(248,113,113,.34)",
  background: "rgba(248,113,113,.10)",
};

const chip: React.CSSProperties = {
  border: "1px solid rgba(157,243,191,.22)",
  borderRadius: 999,
  padding: "7px 10px",
  color: "#9df3bf",
  background: "rgba(157,243,191,.07)",
  margin: "0 7px 7px 0",
  fontSize: 12,
  fontWeight: 850,
  display: "inline-flex",
};

function Mini({ labelText, value }: { labelText: string; value: unknown }) {
  return (
    <div style={{ border: "1px solid rgba(255,255,255,.10)", borderRadius: 15, padding: 11, background: "rgba(0,0,0,.15)" }}>
      <div style={{ color: "#94a3b8", fontSize: 10, textTransform: "uppercase", letterSpacing: ".12em", fontWeight: 900 }}>{labelText}</div>
      <div style={{ marginTop: 5, fontWeight: 950, fontSize: 14 }}>{clean(value) || "Not listed"}</div>
    </div>
  );
}

function Bar({ labelText, value }: { labelText: string; value: number }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 950, color: "#cbd5e1" }}>
        <span>{labelText}</span>
        <span>{value}%</span>
      </div>
      <div style={{ height: 8, borderRadius: 999, background: "rgba(255,255,255,.12)", overflow: "hidden", marginTop: 7 }}>
        <div style={{ width: `${value}%`, height: "100%", borderRadius: 999, background: "linear-gradient(90deg,#ff6b6b,#f8e7b0,#56d8ff)" }} />
      </div>
    </div>
  );
}

function IntelligenceBox({ title, value, tone = "gold" }: { title: string; value: string; tone?: "gold" | "green" | "red" | "blue" }) {
  const color = tone === "green" ? "#9df3bf" : tone === "red" ? "#fecaca" : tone === "blue" ? "#56d8ff" : "#e8c46b";

  return (
    <section style={{ border: `1px solid ${color}55`, borderRadius: 16, padding: 12, background: "rgba(255,255,255,.025)" }}>
      <div style={{ ...label, color, fontSize: 10 }}>{title}</div>
      <p style={{ ...muted, margin: "7px 0 0", fontSize: 14, lineHeight: 1.5 }}>{value}</p>
    </section>
  );
}

function WorkstationCard({
  row,
  viewer,
  isSaved,
  isArchived,
  onSave,
  onUnsave,
  onArchive,
  onRestore,
  onDelete,
  onRestoreDeleted,
  isDeleted,
}: {
  row: Row;
  viewer: string;
  isSaved: boolean;
  isArchived: boolean;
  onSave: () => void;
  onUnsave: () => void;
  onArchive: () => void;
  onRestore: () => void;
  onDelete: () => void;
  onRestoreDeleted: () => void;
  isDeleted: boolean;
}) {
  const id = idOf(row);
  const dealId = dealIdOf(row);
  const painId = painIdOf(row);
  const signalId = signalIdOf(row);
  const source = sourceOf(row);
  const photos = photosOf(row);
  const owner = ownerOf(row);
  const missing = missingInfo(row);
  const route = likelyRoute(row);
  const diagnosis = situationDiagnosis(row);
  const paths = solutionPaths(row);

  const contactHref = signalId
    ? `/connect/${encodeURIComponent(signalId)}?email=${encodeURIComponent(viewer)}${id ? `&item_id=${encodeURIComponent(id)}` : ""}${owner ? `&to=${encodeURIComponent(owner)}` : ""}&source=project&type=project&folder=projects&folder_key=projects&title=${encodeURIComponent(titleOf(row))}&subject=${encodeURIComponent(titleOf(row))}`
    : `/messages/new?email=${encodeURIComponent(viewer)}${id ? `&item_id=${encodeURIComponent(id)}` : ""}${owner ? `&to=${encodeURIComponent(owner)}` : ""}&source=project&type=project&folder=projects&folder_key=projects&title=${encodeURIComponent(titleOf(row))}&subject=${encodeURIComponent(titleOf(row))}`;

  const detailHref =
    source === "deal" && dealId
      ? `/opportunity-room/${encodeURIComponent(dealId)}`
      : source === "pain" && painId
      ? `/pressure-room/${encodeURIComponent(painId)}`
      : signalId
      ? `/signals/${encodeURIComponent(signalId)}`
      : "/projects";

  return (
    <article className="vf-workstation-card" style={{ ...glass, padding: 0, overflow: "hidden" }}>
      <div className="vf-workstation-layout" style={{ display: "grid", gridTemplateColumns: "230px 1fr", gap: 0 }}>
        <div className="vf-photo-wrap" style={{ background: "rgba(0,0,0,.24)", minHeight: 240, borderRight: "1px solid rgba(255,255,255,.10)" }}>
          {photos[0] ? (
            <img src={photos[0]} alt="Workstation" style={{ width: "100%", height: "100%", objectFit: "cover", minHeight: 240, display: "block" }} />
          ) : (
            <div style={{ height: "100%", minHeight: 240, display: "grid", placeItems: "center", color: "#94a3b8", fontWeight: 900 }}>No photo</div>
          )}
        </div>

        <div style={{ padding: 18 }}>
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
            <span style={chip}>{source === "deal" ? "Opportunity" : source === "pain" ? "Pressure" : "Signal"}</span>
            <span style={chip}>{assetOf(row)}</span>
            <span style={chip}>{statusOf(row)}</span>
            <span style={{ ...chip, color: "#f8e7b0", borderColor: "rgba(232,196,107,.34)", background: "rgba(232,196,107,.10)" }}>Failure {failureIndex(row)}%</span>
            {isSaved ? <span style={{ ...chip, color: "#f8e7b0", borderColor: "rgba(232,196,107,.34)", background: "rgba(232,196,107,.10)" }}>Saved</span> : null}
            {isArchived ? <span style={{ ...chip, color: "#cbd5e1", borderColor: "rgba(148,163,184,.24)", background: "rgba(148,163,184,.07)" }}>Archived</span> : null}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr minmax(220px,320px)", gap: 16, marginTop: 8 }} className="vf-card-top">
            <div>
              <h3 style={{ fontSize: 28, lineHeight: 1.02, margin: "8px 0 8px", letterSpacing: "-.03em" }}>{titleOf(row)}</h3>
              <p style={{ ...muted, fontSize: 14, margin: 0 }}>{marketOf(row)} • {field(row, "strategy", "exit_strategy", "deal_strategy") || route} • {owner ? `Owner: ${owner}` : "Owner not listed"}</p>

              <section style={{ marginTop: 12, border: "1px solid rgba(232,196,107,.18)", borderRadius: 18, padding: 13, background: "rgba(232,196,107,.060)" }}>
                <div style={{ ...label, fontSize: 10 }}>Best Next Move</div>
                <p style={{ ...muted, margin: "7px 0 0", fontSize: 15, lineHeight: 1.5 }}>{bestNextMove(row)}</p>
              </section>
            </div>

            <div style={{ border: "1px solid rgba(255,255,255,.10)", borderRadius: 18, padding: 13, background: "rgba(0,0,0,.18)" }}>
              <div style={{ ...label, fontSize: 10 }}>Route Stack</div>
              <div style={{ fontSize: 20, fontWeight: 1000, marginTop: 7 }}>{route}</div>
              <div style={{ display: "grid", gap: 10, marginTop: 13 }}>
                <Bar labelText="Operating" value={operatingScore(row)} />
                <Bar labelText="Urgency" value={urgencyScore(row)} />
                <Bar labelText="Failure" value={failureIndex(row)} />
              </div>
            </div>
          </div>

          <div className="vf-metrics" style={{ display: "grid", gridTemplateColumns: "repeat(6,minmax(0,1fr))", gap: 8, marginTop: 14 }}>
            <Mini labelText="Ask/Target" value={money(askOf(row))} />
            <Mini labelText="ARV/Value" value={money(arvOf(row))} />
            <Mini labelText="Repairs" value={money(repairsOf(row))} />
            <Mini labelText="Spread" value={spreadText(row)} />
            <Mini labelText="Margin" value={marginScore(row) ? `${marginScore(row)}%` : "Needs data"} />
            <Mini labelText="Capital" value={capitalStack(row)} />
          </div>

          <div className="vf-card-bottom" style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 12, marginTop: 12 }}>
            <IntelligenceBox title="Situation Diagnosis" value={diagnosis} tone={source === "pain" ? "red" : "blue"} />
            <IntelligenceBox title="Root Cause" value={rootCause(row)} tone="gold" />
            <IntelligenceBox title="Worst Move" value={worstMove(row)} tone="red" />
            <IntelligenceBox title="Solution Paths" value={paths.join(" • ")} tone="green" />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1.4fr .8fr", gap: 12, marginTop: 12 }} className="vf-card-bottom">
            <section style={{ border: "1px solid rgba(255,255,255,.10)", borderRadius: 16, padding: 12, background: "rgba(255,255,255,.025)" }}>
              <div style={{ ...label, fontSize: 10 }}>Intelligence Brief</div>
              <p style={{ ...muted, margin: "7px 0 0", fontSize: 14, lineHeight: 1.5 }}>{noteOf(row) || "Workstation ready for owner review."}</p>
            </section>

            <section style={{ border: "1px solid rgba(255,255,255,.10)", borderRadius: 16, padding: 12, background: "rgba(255,255,255,.025)" }}>
              <div style={{ ...label, fontSize: 10 }}>Clarify</div>
              <p style={{ ...muted, margin: "7px 0 0", fontSize: 13 }}>{missing.length ? missing.join(" • ") : "Ready for first-pass routing."}</p>
            </section>
          </div>

          <div className="vf-actions" style={{ display: "flex", gap: 9, flexWrap: "wrap", marginTop: 14 }}>
            <Link href={detailHref} style={button}>{source === "deal" ? "Open Opportunity Room" : source === "pain" ? "Open Pressure Room" : "Open Workstation"}</Link>
            <Link href={contactHref} style={ghost}>Contact Source</Link>
            {isDeleted ? (
              <button type="button" onClick={onRestoreDeleted} style={button}>Restore From Deleted</button>
            ) : (
              <>
                {!isSaved ? <button type="button" onClick={onSave} style={ghost}>Save</button> : <button type="button" onClick={onUnsave} style={ghost}>Unsave</button>}
                {!isArchived ? <button type="button" onClick={onArchive} style={ghost}>Archive</button> : <button type="button" onClick={onRestore} style={ghost}>Restore From Archive</button>}
                <button type="button" onClick={onDelete} style={dangerGhost}>Delete</button>
              </>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

function StateButton({
  bucket,
  active,
  onClick,
}: {
  bucket: { state: string; total: number; deals: number; pains: number; signals: number };
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        textAlign: "left",
        border: active ? "1px solid rgba(232,196,107,.72)" : "1px solid rgba(255,255,255,.12)",
        borderRadius: 24,
        padding: 18,
        background: active
          ? "linear-gradient(145deg,rgba(232,196,107,.22),rgba(157,243,191,.08))"
          : "linear-gradient(145deg,rgba(255,255,255,.055),rgba(255,255,255,.025))",
        color: "white",
        cursor: "pointer",
        boxShadow: active ? "0 0 38px rgba(232,196,107,.18)" : "0 18px 54px rgba(0,0,0,.22)",
      }}
    >
      <div style={{ ...label, color: active ? "#f8e7b0" : "#9df3bf" }}>State Market</div>
      <div style={{ fontSize: 30, lineHeight: 1, fontWeight: 1000, marginTop: 10 }}>{bucket.state}</div>
      <div style={{ fontSize: 48, lineHeight: 1, fontWeight: 1000, marginTop: 14, color: "#f8e7b0" }}>{bucket.total}</div>
      <div style={{ ...muted, fontSize: 13, marginTop: 5 }}>total workstations</div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginTop: 14 }}>
        <Mini labelText="Opp" value={bucket.deals} />
        <Mini labelText="Pressure" value={bucket.pains} />
        <Mini labelText="Signals" value={bucket.signals} />
      </div>
    </button>
  );
}

function CountyButton({
  bucket,
  active,
  onClick,
}: {
  bucket: { county: string; total: number; deals: number; pains: number; signals: number };
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        textAlign: "left",
        border: active ? "1px solid rgba(157,243,191,.60)" : "1px solid rgba(255,255,255,.12)",
        borderRadius: 20,
        padding: 15,
        background: active ? "rgba(157,243,191,.13)" : "rgba(255,255,255,.045)",
        color: "white",
        cursor: "pointer",
      }}
    >
      <div style={{ ...label, color: "#9df3bf", fontSize: 10 }}>County / Market</div>
      <div style={{ fontSize: 24, fontWeight: 1000, marginTop: 8 }}>{bucket.county}</div>
      <div style={{ fontSize: 32, fontWeight: 1000, color: "#f8e7b0", marginTop: 8 }}>{bucket.total}</div>
      <div style={{ ...muted, fontSize: 12 }}>{bucket.deals} opp · {bucket.pains} pressure · {bucket.signals} signals</div>
    </button>
  );
}

function CommandExitBar() {
  function goBack() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      window.history.back();
      return;
    }

    if (typeof window !== "undefined") window.location.href = "/dashboard";
  }

  return (
    <section style={commandBar}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
        <div>
          <div style={{ color: "#e8c46b", letterSpacing: ".18em", textTransform: "uppercase", fontWeight: 950, fontSize: 11 }}>
            VaultForge Workstation Exit
          </div>
          <div style={{ color: "rgba(255,255,255,.70)", fontSize: 13, marginTop: 4 }}>
            Workstations are open. Use this command bar to move without getting trapped.
          </div>
        </div>

        <div className="vf-command-actions" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="button" onClick={goBack} style={closeButton}>Back</button>
          <Link href="/dashboard" style={smallButton}>Dashboard</Link>
          <Link href="/submit" style={smallGhost}>Submit Opportunity</Link>
          <Link href="/pain" style={smallGhost}>Submit Pressure</Link>
          <Link href="/pain-feed" style={smallGhost}>Pressure Feed</Link>
          <Link href="/intelligence" style={smallGhost}>Intelligence</Link>
          <Link href="/messages" style={smallGhost}>Messages</Link>
        </div>
      </div>
    </section>
  );
}

export default function ProjectsPage() {
  const [email, setEmail] = useState("");
  const [items, setItems] = useState<Row[]>([]);
  const [status, setStatus] = useState("Loading workstations...");
  const [folder, setFolder] = useState<FolderMode>("active");
  const [selectedState, setSelectedState] = useState("All");
  const [selectedCounty, setSelectedCounty] = useState("All");
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [archivedIds, setArchivedIds] = useState<Set<string>>(new Set());
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());

  async function load() {
    const viewer = getEmail();
    const owner = viewer === OWNER_EMAIL;
    const ownerFlag = owner ? "1" : "0";

    setEmail(viewer);
    setStatus("Loading workstations...");

    try {
      const urls = [
        `/api/deal/feed?email=${encodeURIComponent(viewer)}&owner=${ownerFlag}`,
        `/api/pain/feed?email=${encodeURIComponent(viewer)}&owner=${ownerFlag}`,
      ];

      const collected: Row[] = [];

      for (const url of urls) {
        try {
          const response = await fetch(url, {
            cache: "no-store",
            credentials: "include",
            headers: {
              "x-vf-email": viewer,
              "x-vf-admin": ownerFlag,
            },
          });

          const data = await response.json().catch(() => ({}));
          collected.push(
            ...(Array.isArray(data.deals) ? data.deals : []),
            ...(Array.isArray(data.projects) ? data.projects : []),
            ...(Array.isArray(data.items) ? data.items : []),
            ...(Array.isArray(data.pains) ? data.pains : []),
            ...(Array.isArray(data.signals) ? data.signals : []),
            ...(Array.isArray(data.data) ? data.data : [])
          );
        } catch {
          // Keep page alive if one feed is unavailable.
        }
      }

      const byKey = new Map<string, Row>();
      const familyToKey = new Map<string, string>();

      for (const item of collected) {
        const directKey = canonicalKey(item);
        const familyKey = duplicateFamilyKey(item);
        const knownKey = familyToKey.get(familyKey);
        const key = knownKey || directKey;

        if (!key) continue;

        const existing = byKey.get(key);
        if (!existing) {
          byKey.set(key, item);
          familyToKey.set(familyKey, key);
          continue;
        }

        const itemScore = completenessScore(item);
        const existingScore = completenessScore(existing);
        const primary = itemScore >= existingScore ? item : existing;
        const secondary = itemScore >= existingScore ? existing : item;
        byKey.set(key, mergeRows(primary, secondary));
        familyToKey.set(familyKey, key);
      }

      const secondPass = new Map<string, Row>();

      for (const item of Array.from(byKey.values())) {
        const key = duplicateFamilyKey(item);
        const existing = secondPass.get(key);

        if (!existing) {
          secondPass.set(key, item);
          continue;
        }

        const itemScore = completenessScore(item);
        const existingScore = completenessScore(existing);
        const primary = itemScore >= existingScore ? item : existing;
        const secondary = itemScore >= existingScore ? existing : item;
        secondPass.set(key, mergeRows(primary, secondary));
      }

      const unique = Array.from(secondPass.values());
      setItems(unique);
      setStatus(unique.length ? "" : "No opportunity or pressure workstations found yet.");
    } catch (error: any) {
      setStatus(error?.message || "Could not load workstations.");
    }
  }

  useEffect(() => {
    setSavedIds(readSet("vf_project_saved_ids"));
    setArchivedIds(readSet("vf_project_archived_ids"));
    setDeletedIds(readSet("vf_project_deleted_ids"));

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const requestedFolder = clean(params.get("folder")).toLowerCase();
      const requestedState = clean(params.get("state"));
      const requestedCounty = clean(params.get("county"));

      if (
        requestedFolder === "active" ||
        requestedFolder === "opportunity" ||
        requestedFolder === "pressure" ||
        requestedFolder === "saved" ||
        requestedFolder === "archived" ||
        requestedFolder === "deleted"
      ) {
        setFolder(requestedFolder as FolderMode);
      }

      if (requestedState) setSelectedState(requestedState);
      if (requestedCounty) setSelectedCounty(requestedCounty);
    }

    load();
  }, []);

  function persistSaved(next: Set<string>) {
    setSavedIds(new Set(next));
    writeSet("vf_project_saved_ids", next);
  }

  function persistArchived(next: Set<string>) {
    setArchivedIds(new Set(next));
    writeSet("vf_project_archived_ids", next);
  }

  function persistDeleted(next: Set<string>) {
    setDeletedIds(new Set(next));
    writeSet("vf_project_deleted_ids", next);
  }

  function selectFolder(nextFolder: FolderMode) {
    setFolder(nextFolder);
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      params.set("folder", nextFolder);
      const nextUrl = `${window.location.pathname}?${params.toString()}`;
      window.history.replaceState({}, "", nextUrl);
    }
  }

  function saveProject(row: Row) {
    const key = canonicalKey(row);
    if (!key) return;
    const next = new Set(savedIds);
    next.add(key);
    persistSaved(next);
  }

  function unsaveProject(row: Row) {
    const key = canonicalKey(row);
    if (!key) return;
    const next = new Set(savedIds);
    next.delete(key);
    persistSaved(next);
  }

  function archiveProject(row: Row) {
    const key = canonicalKey(row);
    if (!key) return;
    const nextArchived = new Set(archivedIds);
    nextArchived.add(key);
    persistArchived(nextArchived);
    const nextSaved = new Set(savedIds);
    nextSaved.delete(key);
    persistSaved(nextSaved);
  }

  function restoreProject(row: Row) {
    const key = canonicalKey(row);
    if (!key) return;
    const next = new Set(archivedIds);
    next.delete(key);
    persistArchived(next);
  }

  function deleteProject(row: Row) {
    const key = canonicalKey(row);
    if (!key) return;
    const nextDeleted = new Set(deletedIds);
    nextDeleted.add(key);
    persistDeleted(nextDeleted);
    const nextSaved = new Set(savedIds);
    nextSaved.delete(key);
    persistSaved(nextSaved);
    const nextArchived = new Set(archivedIds);
    nextArchived.delete(key);
    persistArchived(nextArchived);
  }

  function restoreDeletedProject(row: Row) {
    const key = canonicalKey(row);
    if (!key) return;
    const nextDeleted = new Set(deletedIds);
    nextDeleted.delete(key);
    persistDeleted(nextDeleted);
  }

  function emptyDeletedFolder() {
    persistDeleted(new Set());
    selectFolder("active");
  }

  const visibleItems = useMemo(() => {
    return items.filter((item) => {
      const key = canonicalKey(item);
      if (!key) return false;

      const deleted = deletedIds.has(key);
      const saved = savedIds.has(key);
      const archived = archivedIds.has(key);
      const source = sourceOf(item);

      if (folder === "deleted") {
        if (!deleted) return false;
      } else {
        if (deleted) return false;
      }

      if (selectedState !== "All" && stateOf(item) !== selectedState) return false;
      if (selectedCounty !== "All" && countyOf(item) !== selectedCounty) return false;

      if (folder === "opportunity") return source === "deal" && !archived;
      if (folder === "pressure") return source === "pain" && !archived;
      if (folder === "saved") return saved && !archived;
      if (folder === "archived") return archived;
      if (folder === "deleted") return deleted;

      return !archived;
    });
  }, [items, savedIds, archivedIds, deletedIds, folder, selectedState, selectedCounty]);

  const bucketBaseItems = useMemo(() => {
    return items.filter((item) => {
      const key = canonicalKey(item);
      if (!key) return false;

      const deleted = deletedIds.has(key);
      const saved = savedIds.has(key);
      const archived = archivedIds.has(key);
      const source = sourceOf(item);

      if (folder === "deleted") {
        if (!deleted) return false;
      } else {
        if (deleted) return false;
      }

      if (folder === "opportunity") return source === "deal" && !archived;
      if (folder === "pressure") return source === "pain" && !archived;
      if (folder === "saved") return saved && !archived;
      if (folder === "archived") return archived;
      if (folder === "deleted") return deleted;

      return !archived;
    });
  }, [items, savedIds, archivedIds, deletedIds, folder]);

  const stateBuckets = useMemo(() => {
    return CORE_STATES.map((state) => {
      const stateItems = bucketBaseItems.filter((item) => stateOf(item) === state);

      return {
        state,
        total: stateItems.length,
        deals: stateItems.filter((item) => sourceOf(item) === "deal").length,
        pains: stateItems.filter((item) => sourceOf(item) === "pain").length,
        signals: stateItems.filter((item) => sourceOf(item) === "signal" || signalIdOf(item)).length,
      };
    });
  }, [bucketBaseItems]);

  const countyBuckets = useMemo(() => {
    if (selectedState === "All") return [];

    const map = new Map<string, { county: string; total: number; deals: number; pains: number; signals: number }>();

    for (const item of bucketBaseItems) {
      if (stateOf(item) !== selectedState) continue;

      const county = countyOf(item) || "Unlisted";
      const current = map.get(county) || { county, total: 0, deals: 0, pains: 0, signals: 0 };

      current.total += 1;

      const source = sourceOf(item);
      if (source === "deal") current.deals += 1;
      else if (source === "pain") current.pains += 1;
      else current.signals += 1;

      map.set(county, current);
    }

    return Array.from(map.values()).sort((a, b) => {
      if (a.county === "Unlisted") return 1;
      if (b.county === "Unlisted") return -1;
      return b.total - a.total || a.county.localeCompare(b.county);
    });
  }, [bucketBaseItems, selectedState]);

  const counts = useMemo(() => {
    const allLiveItems = items.filter((item) => {
      const key = canonicalKey(item);
      return key && !deletedIds.has(key);
    });

    const activeSavedItems = allLiveItems.filter((item) => {
      const key = canonicalKey(item);
      return savedIds.has(key) && !archivedIds.has(key);
    });

    const archivedItems = allLiveItems.filter((item) => {
      const key = canonicalKey(item);
      return archivedIds.has(key);
    });

    return {
      total: visibleItems.length,
      deals: visibleItems.filter((item) => sourceOf(item) === "deal").length,
      pains: visibleItems.filter((item) => sourceOf(item) === "pain").length,
      signals: visibleItems.filter((item) => sourceOf(item) === "signal" || signalIdOf(item)).length,
      withPhotos: visibleItems.filter((item) => photosOf(item).length).length,
      saved: activeSavedItems.length,
      archived: archivedItems.length,
      deleted: items.filter((item) => {
        const key = canonicalKey(item);
        return key && deletedIds.has(key);
      }).length,
      avgFailure: visibleItems.length ? Math.round(visibleItems.reduce((sum, item) => sum + failureIndex(item), 0) / visibleItems.length) : 0,
    };
  }, [items, visibleItems, savedIds, archivedIds, deletedIds]);

  return (
    <main style={page}>
      <style>{`
        .vf-workstation-card { overflow: hidden !important; }
        .vf-workstation-card * { box-sizing: border-box; }
        a:hover, button:hover { transform: translateY(-1px); transition: all .18s ease; filter: brightness(1.06); }
        @media (max-width: 900px) {
          .vf-grid, .vf-actions, .vf-card-top, .vf-card-bottom, .vf-workstation-layout, .vf-state-grid, .vf-county-grid { grid-template-columns: 1fr !important; }

          .vf-command-actions {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 8px !important;
          }

          .vf-command-actions > * {
            width: 100%;
            box-sizing: border-box;
            justify-content: center;
          }
          .vf-actions { display: grid !important; gap: 10px !important; }
          .vf-actions > * { width: 100%; box-sizing: border-box; justify-content: center; }
          .vf-metrics { grid-template-columns: repeat(2,minmax(0,1fr)) !important; }
          .vf-photo-wrap { border-right: 0 !important; border-bottom: 1px solid rgba(255,255,255,.10) !important; }
        }
      `}</style>

      <div style={wrap}>
        <CommandExitBar />

        <section style={card}>
          <div style={label}>VaultForge Operating Workstations</div>
          <h1 style={{ fontSize: "clamp(52px,10vw,96px)", lineHeight: 0.88, letterSpacing: "-.07em", margin: "12px 0 18px" }}>
            Workstations.
          </h1>
          <p style={{ ...muted, fontSize: 20 }}>
            Opportunity and Pressure records share one execution desk. Each card now reads like a decision engine: diagnosis, root cause, failure index, capital stack, solution paths, best move, worst move, and route stack.
          </p>

          <div className="vf-grid" style={{ display: "grid", gridTemplateColumns: "repeat(7,minmax(0,1fr))", gap: 10, marginTop: 18 }}>
            <Mini labelText="Showing" value={counts.total} />
            <Mini labelText="Opportunity" value={counts.deals} />
            <Mini labelText="Pressure" value={counts.pains} />
            <Mini labelText="Signals" value={counts.signals} />
            <Mini labelText="Photos" value={counts.withPhotos} />
            <Mini labelText="Saved" value={counts.saved} />
            <Mini labelText="Avg Failure" value={`${counts.avgFailure}%`} />
          </div>

          <div className="vf-actions" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 10, marginTop: 16 }}>
            <button type="button" onClick={() => selectFolder("active")} style={folder === "active" ? button : ghost}>Active ({items.filter((item) => { const key = canonicalKey(item); return key && !deletedIds.has(key) && !archivedIds.has(key); }).length})</button>
            <button type="button" onClick={() => selectFolder("opportunity")} style={folder === "opportunity" ? button : ghost}>Opportunity Rooms ({items.filter((item) => { const key = canonicalKey(item); return key && !deletedIds.has(key) && !archivedIds.has(key) && sourceOf(item) === "deal"; }).length})</button>
            <button type="button" onClick={() => selectFolder("pressure")} style={folder === "pressure" ? button : ghost}>Pressure Rooms ({items.filter((item) => { const key = canonicalKey(item); return key && !deletedIds.has(key) && !archivedIds.has(key) && sourceOf(item) === "pain"; }).length})</button>
            <button type="button" onClick={() => selectFolder("saved")} style={folder === "saved" ? button : ghost}>Saved ({counts.saved})</button>
            <button type="button" onClick={() => selectFolder("archived")} style={folder === "archived" ? button : ghost}>Archived ({counts.archived})</button>
            <button type="button" onClick={() => selectFolder("deleted")} style={folder === "deleted" ? dangerGhost : ghost}>Deleted ({counts.deleted})</button>
            <button type="button" onClick={load} style={ghost}>Refresh</button>
            {folder === "deleted" ? <button type="button" onClick={emptyDeletedFolder} style={dangerGhost}>Empty Deleted</button> : null}
            <Link href="/submit" style={ghost}>Submit Opportunity</Link>
            <Link href="/pain" style={ghost}>Submit Pressure</Link>
          </div>

          <p style={{ ...muted, marginTop: 14, fontSize: 14 }}>
            Signed in: {email || "unknown"} · Archived: {counts.archived} · State: {selectedState} · Market: {selectedCounty}
          </p>
        </section>

        <section style={card}>
          <div style={label}>State Buckets</div>
          <h2 style={{ fontSize: "clamp(34px,6vw,62px)", lineHeight: 0.95, letterSpacing: "-.05em", margin: "10px 0 10px" }}>
            Pick a state. Open the pressure.
          </h2>
          <p style={{ ...muted, fontSize: 18 }}>
            Workstations are grouped by operating state first. Choose a state, then drill into county/city buckets.
          </p>

          <div className="vf-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14, marginBottom: 16 }}>
            <button
              type="button"
              onClick={() => {
                setSelectedState("All");
                setSelectedCounty("All");
              }}
              style={selectedState === "All" ? button : ghost}
            >
              All States ({stateBuckets.reduce((sum, bucket) => sum + bucket.total, 0)})
            </button>
          </div>

          <div className="vf-state-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 }}>
            {stateBuckets.map((bucket) => (
              <StateButton
                key={bucket.state}
                bucket={bucket}
                active={selectedState === bucket.state}
                onClick={() => {
                  setSelectedState(bucket.state);
                  setSelectedCounty("All");
                }}
              />
            ))}
          </div>
        </section>

        {selectedState !== "All" ? (
          <section style={card}>
            <div style={label}>{selectedState} County / Market Buckets</div>
            <h2 style={{ fontSize: "clamp(30px,5vw,54px)", lineHeight: 0.95, letterSpacing: "-.05em", margin: "10px 0 10px" }}>
              Drill into the local market.
            </h2>

            <div className="vf-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14, marginBottom: 16 }}>
              <button type="button" onClick={() => setSelectedCounty("All")} style={selectedCounty === "All" ? button : ghost}>
                All {selectedState} ({countyBuckets.reduce((sum, bucket) => sum + bucket.total, 0)})
              </button>
            </div>

            {countyBuckets.length ? (
              <div className="vf-county-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 12 }}>
                {countyBuckets.map((bucket) => (
                  <CountyButton
                    key={bucket.county}
                    bucket={bucket}
                    active={selectedCounty === bucket.county}
                    onClick={() => setSelectedCounty(bucket.county)}
                  />
                ))}
              </div>
            ) : (
              <div style={{ ...glass, color: "#f8e7b0" }}>No county/city buckets for this state yet.</div>
            )}
          </section>
        ) : null}

        {status ? <section style={{ ...card, color: "#f8e7b0" }}>{status}</section> : null}

        <section style={{ display: "grid", gap: 16 }}>
          {visibleItems.map((item, index) => {
            const key = canonicalKey(item) || `${index}`;
            return (
              <WorkstationCard
                key={`${key}-${index}`}
                row={item}
                viewer={email}
                isSaved={savedIds.has(key)}
                isArchived={archivedIds.has(key)}
                isDeleted={deletedIds.has(key)}
                onSave={() => saveProject(item)}
                onUnsave={() => unsaveProject(item)}
                onArchive={() => archiveProject(item)}
                onRestore={() => restoreProject(item)}
                onDelete={() => deleteProject(item)}
                onRestoreDeleted={() => restoreDeletedProject(item)}
              />
            );
          })}
        </section>
      </div>
    </main>
  );
}
