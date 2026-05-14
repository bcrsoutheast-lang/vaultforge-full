"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Row = Record<string, any>;
type FolderMode = "active" | "saved" | "archived";

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

function routingIdOf(row: Row) {
  return field(row, "routing_id", "signal_id", "alert_id", "canonical_event_id");
}

function titleOf(row: Row) {
  return field(row, "title", "deal_title", "project_title", "name", "address") || "VaultForge Workstation";
}

function sourceOf(row: Row) {
  const source = first(row.source_kind, row.source_table, row._source_table, row.source, field(row, "canonical_kind")).toLowerCase();

  if (source.includes("deal") || field(row, "deal_id", "asking_price", "price", "arv", "arv_value", "estimated_value")) return "deal";
  if (source.includes("pain") || field(row, "pain_id", "pain_type")) return "pain";

  return "signal";
}

function noteOf(row: Row) {
  return (
    field(
      row,
      "ai_route_summary",
      "route_summary",
      "routing_summary",
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
    ) || "Workstation ready for review."
  );
}

function assetOf(row: Row) {
  return field(row, "asset_type", "property_type", "deal_type", "pain_type") || "Asset";
}

function statusOf(row: Row) {
  return field(row, "status", "project_status", "stage", "routing_status") || "Open";
}

function marketOf(row: Row) {
  const city = field(row, "city");
  const state = field(row, "state", "market", "operating_state");

  return [city, state].filter(Boolean).join(", ") || field(row, "location", "address", "property_address") || "Market not listed";
}

function ownerOf(row: Row) {
  return cleanEmail(field(row, "owner_email", "member_email", "user_email", "submitted_by_email", "created_by_email", "submitted_by"));
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

  return number.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
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
    field(row, "item_id");

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
  const ask = normalizedKey(field(row, "asking_price", "price", "ask", "purchase_price"));
  const arv = normalizedKey(field(row, "arv", "arv_value", "estimated_value", "after_repair_value"));

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
    new Set([
      ...parseArray(secondary.photo_urls),
      ...parseArray(primary.photo_urls),
      ...parseArray(secondaryMeta.photo_urls),
      ...parseArray(primaryMeta.photo_urls),
      ...photosOf(secondary),
      ...photosOf(primary),
    ].map(clean).filter(Boolean))
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

function routingSummary(row: Row) {
  const summary = noteOf(row);
  const needs = field(row, "routing_needs", "deal_needs", "needs", "route_context");
  const signals = field(row, "distress_signals", "seller_pressure", "pain_signals");
  const strategy = field(row, "strategy", "exit_strategy", "deal_strategy");
  const market = marketOf(row);
  const owner = ownerOf(row);

  const parts = [
    summary && summary !== "Workstation ready for review." ? summary : "",
    needs ? `Needs: ${needs}` : "",
    signals ? `Signal pressure: ${signals}` : "",
    strategy ? `Likely strategy: ${strategy}` : "",
    market && market !== "Market not listed" ? `Market context: ${market}` : "",
    owner ? `Owner/contact connected: ${owner}` : "",
  ].filter(Boolean);

  return parts.length
    ? parts.join(" • ")
    : "AI routing summary pending.";
}

function missingInfo(row: Row) {
  const missing: string[] = [];

  if (!field(row, "routing_needs", "deal_needs", "needs", "route_context")) missing.push("who should receive this");
  if (!field(row, "distress_signals", "seller_pressure", "pain_signals")) missing.push("urgency or seller pressure");
  if (!field(row, "capital_needed")) missing.push("capital need");
  if (!field(row, "contractor_scope")) missing.push("contractor scope");
  if (!field(row, "operator_scope")) missing.push("operator/JV scope");
  if (!field(row, "target_buyer")) missing.push("target buyer type");

  return missing;
}

function signalPressureText(row: Row) {
  return field(row, "distress_signals", "seller_pressure", "pain_signals") || "No pressure signal listed yet.";
}

function signalPressureTone(row: Row) {
  const value = signalPressureText(row).toLowerCase();

  if (
    value.includes("foreclosure") ||
    value.includes("urgent") ||
    value.includes("fast close") ||
    value.includes("funding gap") ||
    value.includes("emergency")
  ) {
    return {
      border: "rgba(248,113,113,.34)",
      background: "rgba(248,113,113,.11)",
      color: "#fecaca",
      label: "High pressure",
    };
  }

  if (value && value !== "no pressure signal listed yet.") {
    return {
      border: "rgba(232,196,107,.30)",
      background: "rgba(232,196,107,.09)",
      color: "#f8e7b0",
      label: "Signal present",
    };
  }

  return {
    border: "rgba(148,163,184,.22)",
    background: "rgba(148,163,184,.06)",
    color: "#cbd5e1",
    label: "No signal",
  };
}

function clampScore(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function operatingScore(row: Row) {
  let score = 42;

  if (field(row, "asking_price", "price", "ask", "purchase_price")) score += 8;
  if (field(row, "arv", "arv_value", "estimated_value", "after_repair_value")) score += 8;
  if (field(row, "repair_estimate", "repairs_needed", "estimated_repairs", "rehab_budget", "repair_budget")) score += 8;
  if (field(row, "routing_needs", "deal_needs", "needs", "route_context")) score += 10;
  if (field(row, "distress_signals", "seller_pressure", "pain_signals")) score += 10;
  if (field(row, "strategy", "exit_strategy", "deal_strategy")) score += 6;
  if (photosOf(row).length) score += 8;

  return clampScore(score);
}

function urgencyScore(row: Row) {
  const pressure = `${field(row, "distress_signals", "seller_pressure", "pain_signals")} ${field(row, "urgency", "urgency_level")} ${field(row, "seller_situation")}`.toLowerCase();
  let score = 38;

  if (pressure.includes("urgent")) score += 28;
  if (pressure.includes("fast close")) score += 22;
  if (pressure.includes("funding gap")) score += 18;
  if (pressure.includes("foreclosure")) score += 25;
  if (pressure.includes("inherited")) score += 10;
  if (field(row, "routing_needs", "deal_needs", "needs", "route_context")) score += 10;

  return clampScore(score);
}

function aiHiveSuggestions(row: Row) {
  const needs = field(row, "routing_needs", "deal_needs", "needs", "route_context").toLowerCase();
  const pressure = field(row, "distress_signals", "seller_pressure", "pain_signals").toLowerCase();
  const strategy = field(row, "strategy", "exit_strategy", "deal_strategy") || "Fix & Flip";

  const suggestions: string[] = [];

  if (needs.includes("buyer")) suggestions.push("Route to cash buyers first; confirm proof of funds before releasing private details.");
  if (needs.includes("contractor")) suggestions.push("Get repair scope priced fast so spread can be verified before buyer intro.");
  if (needs.includes("jv") || needs.includes("partner")) suggestions.push("Package as JV/operator opportunity with role, capital need, and profit split clearly defined.");
  if (needs.includes("lender") || pressure.includes("funding")) suggestions.push("Send to private/hard-money capital with ask, ARV, repairs, and timeline.");
  if (pressure.includes("fast close")) suggestions.push("Prioritize speed: buyer + title readiness matter more than broad exposure.");

  if (!suggestions.length) {
    suggestions.push("Hold for owner review until buyer type, funding need, timeline, and execution role are clarified.");
  }

  suggestions.push(`Best formation: ${strategy} deal room with controlled owner contact and member-by-member routing.`);

  return suggestions.slice(0, 4);
}

function bestDealFormation(row: Row) {
  const needs = field(row, "routing_needs", "deal_needs", "needs", "route_context").toLowerCase();
  const pressure = field(row, "distress_signals", "seller_pressure", "pain_signals").toLowerCase();

  if (needs.includes("jv") || needs.includes("partner")) return "JV / Operator-Led Execution";
  if (needs.includes("lender") || pressure.includes("funding")) return "Capital-Backed Acquisition";
  if (needs.includes("contractor")) return "Contractor-Verified Flip";
  if (needs.includes("buyer")) return "Buyer-First Off-Market Route";

  return "Owner Review / Intelligence Hold";
}

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(232,196,107,.14), transparent 28%), radial-gradient(circle at 88% 10%, rgba(56,189,248,.10), transparent 26%), linear-gradient(180deg,#020303,#071326 55%,#020303)",
  color: "white",
  padding: "22px 16px 96px",
  fontFamily: "Arial, sans-serif",
};

const wrap: React.CSSProperties = { width: "min(1220px,100%)", margin: "0 auto" };

const card: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.24)",
  borderRadius: 30,
  padding: 24,
  background: "rgba(255,255,255,.045)",
  boxShadow: "0 28px 86px rgba(0,0,0,.30)",
  marginBottom: 18,
};

const glass: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.12)",
  borderRadius: 22,
  padding: 18,
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
  minHeight: 50,
  borderRadius: 999,
  padding: "12px 18px",
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

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <section style={glass}>
      <div style={{ fontWeight: 950, letterSpacing: ".14em", textTransform: "uppercase", fontSize: 12, color: "#e8c46b" }}>{label}</div>
      <div style={{ fontSize: 48, fontWeight: 1000, lineHeight: 1, marginTop: 12 }}>{value}</div>
    </section>
  );
}

function DetailGrid({ row }: { row: Row }) {
  const values = [
    ["Ask", money(field(row, "asking_price", "price", "ask", "purchase_price"))],
    ["ARV", money(field(row, "arv", "arv_value", "estimated_value", "after_repair_value"))],
    ["Repairs", money(field(row, "repair_estimate", "repairs_needed", "estimated_repairs", "rehab_budget", "repair_budget"))],
    ["Beds/Baths", [field(row, "beds", "bedrooms"), field(row, "baths", "bathrooms")].filter(Boolean).join(" / ") || "Not listed"],
    ["Sqft/Acres", field(row, "square_feet", "sqft", "building_sqft", "acres", "land_acres") || "Not listed"],
    ["Strategy", field(row, "strategy", "exit_strategy", "deal_strategy") || "Not listed"],
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(135px,1fr))", gap: 10, marginTop: 14 }}>
      {values.map(([k, v]) => (
        <div key={k} style={{ border: "1px solid rgba(255,255,255,.10)", borderRadius: 16, padding: 12, background: "rgba(0,0,0,.14)" }}>
          <div style={{ color: "#94a3b8", fontSize: 11, textTransform: "uppercase", letterSpacing: ".12em", fontWeight: 850 }}>{k}</div>
          <div style={{ marginTop: 6, fontWeight: 950 }}>{v}</div>
        </div>
      ))}
    </div>
  );
}

function ScoreBar({ label: scoreLabel, value, caption }: { label: string; value: number; caption: string }) {
  return (
    <div style={{ border: "1px solid rgba(255,255,255,.10)", borderRadius: 16, padding: 12, background: "rgba(0,0,0,.16)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 12, fontWeight: 950 }}>
        <span>{scoreLabel}</span>
        <span>{value}%</span>
      </div>
      <div style={{ height: 9, borderRadius: 999, background: "rgba(255,255,255,.12)", overflow: "hidden", marginTop: 10 }}>
        <div style={{ width: `${value}%`, height: "100%", borderRadius: 999, background: "linear-gradient(90deg,#ff6b6b,#f8e7b0,#56d8ff)" }} />
      </div>
      <p style={{ ...muted, margin: "8px 0 0", fontSize: 13 }}>{caption}</p>
    </div>
  );
}

function IntelligencePanel({ row }: { row: Row }) {
  const opScore = operatingScore(row);
  const urgScore = urgencyScore(row);
  const suggestions = aiHiveSuggestions(row);

  return (
    <section
      style={{
        marginTop: 14,
        border: "1px solid rgba(232,196,107,.18)",
        borderRadius: 20,
        padding: 14,
        background: "linear-gradient(145deg,rgba(232,196,107,.08),rgba(255,255,255,.025))",
      }}
    >
      <div style={{ ...label, fontSize: 11 }}>VaultForge AI Hive</div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 10, marginTop: 12 }}>
        <ScoreBar label="Operating Score" value={opScore} caption="Completeness, photos, spread, need, and actionability." />
        <ScoreBar label="Urgency" value={urgScore} caption={field(row, "urgency", "urgency_level") || "Calculated from pressure signals."} />
        <ScoreBar label="Asset Context" value={photosOf(row).length ? 76 : 42} caption={`${photosOf(row).length} photo${photosOf(row).length === 1 ? "" : "s"} connected.`} />
      </div>

      <div style={{ marginTop: 14, border: "1px solid rgba(255,255,255,.10)", borderRadius: 16, padding: 12, background: "rgba(0,0,0,.14)" }}>
        <div style={{ ...label, fontSize: 11 }}>Best Deal Formation</div>
        <div style={{ fontSize: 22, fontWeight: 950, marginTop: 6 }}>{bestDealFormation(row)}</div>
      </div>

      <div style={{ marginTop: 14 }}>
        <div style={{ ...label, fontSize: 11 }}>AI Hive Suggestions</div>
        <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
          {suggestions.map((item) => (
            <div key={item} style={{ border: "1px solid rgba(157,243,191,.18)", borderRadius: 14, padding: 10, color: "#dbeafe", background: "rgba(157,243,191,.055)", lineHeight: 1.45 }}>
              {item}
            </div>
          ))}
        </div>
      </div>
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
}) {
  const id = idOf(row);
  const dealId = dealIdOf(row);
  const painId = painIdOf(row);
  const signalId = signalIdOf(row);
  const routingId = routingIdOf(row);
  const source = sourceOf(row);
  const photos = photosOf(row);
  const owner = ownerOf(row);
  const missing = missingInfo(row);
  const pressure = signalPressureTone(row);

  const contactHref = signalId
    ? `/connect/${encodeURIComponent(signalId)}?email=${encodeURIComponent(viewer)}${id ? `&item_id=${encodeURIComponent(id)}` : ""}${owner ? `&to=${encodeURIComponent(owner)}` : ""}&source=project&type=project&folder=projects&folder_key=projects&title=${encodeURIComponent(titleOf(row))}&subject=${encodeURIComponent(titleOf(row))}`
    : `/messages/new?email=${encodeURIComponent(viewer)}${id ? `&item_id=${encodeURIComponent(id)}` : ""}${owner ? `&to=${encodeURIComponent(owner)}` : ""}&source=project&type=project&folder=projects&folder_key=projects&title=${encodeURIComponent(titleOf(row))}&subject=${encodeURIComponent(titleOf(row))}`;

  const detailHref =
    source === "deal" && dealId
      ? `/deal/detail?id=${encodeURIComponent(dealId)}`
      : source === "pain" && painId
      ? `/pain-room/${encodeURIComponent(painId)}`
      : signalId
      ? `/signals/${encodeURIComponent(signalId)}`
      : "/projects";

  return (
    <article className="vf-workstation-card" style={glass}>
      <div className="vf-workstation-layout" style={{ display: "grid", gridTemplateColumns: "170px 1fr", gap: 18 }}>
        <div
          className="vf-photo-wrap"
          style={{
            borderRadius: 20,
            overflow: "hidden",
            border: "1px solid rgba(232,196,107,.18)",
            background: "rgba(0,0,0,.20)",
            minHeight: 150,
            maxHeight: 240,
          }}
        >
          {photos[0] ? (
            <img src={photos[0]} alt="Workstation" style={{ width: "100%", height: "100%", objectFit: "cover", maxHeight: 240, minHeight: 150, display: "block" }} />
          ) : (
            <div style={{ height: 180, display: "grid", placeItems: "center", color: "#94a3b8", fontWeight: 850 }}>No photo</div>
          )}
        </div>

        <div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span style={chip}>{source === "deal" ? "Deal" : source === "pain" ? "Pain" : "Signal"}</span>
            <span style={chip}>{assetOf(row)}</span>
            <span style={chip}>{statusOf(row)}</span>
            {signalId ? <span style={chip}>Signal linked</span> : null}
            {isSaved ? <span style={{ ...chip, color: "#f8e7b0", borderColor: "rgba(232,196,107,.34)", background: "rgba(232,196,107,.10)" }}>Saved</span> : null}
            {isArchived ? <span style={{ ...chip, color: "#cbd5e1", borderColor: "rgba(148,163,184,.24)", background: "rgba(148,163,184,.07)" }}>Archived</span> : null}
          </div>

          <h3 style={{ fontSize: 24, lineHeight: 1.05, margin: "12px 0 8px", letterSpacing: "-.02em" }}>{titleOf(row)}</h3>
          <p style={{ ...muted, fontSize: 14, lineHeight: 1.5 }}>{marketOf(row)} • {field(row, "strategy", "exit_strategy", "deal_strategy") || "Strategy not listed"} • {assetOf(row)}</p>

          {source === "deal" ? <DetailGrid row={row} /> : null}

          <section style={{ marginTop: 14, border: "1px solid rgba(232,196,107,.16)", borderRadius: 18, padding: 14, background: "rgba(232,196,107,.055)" }}>
            <div style={{ ...label, fontSize: 11 }}>AI Routing Insight</div>
            <p style={{ ...muted, margin: "8px 0 0", fontSize: 14, lineHeight: 1.6 }}>
              {routingSummary(row)}
            </p>

            <div style={{ marginTop: 12, border: `1px solid ${pressure.border}`, background: pressure.background, borderRadius: 16, padding: 12 }}>
              <div style={{ color: pressure.color, fontSize: 11, textTransform: "uppercase", letterSpacing: ".14em", fontWeight: 950 }}>
                Signal Pressure · {pressure.label}
              </div>
              <p style={{ color: pressure.color, margin: "7px 0 0", fontWeight: 850 }}>
                {signalPressureText(row)}
              </p>
            </div>

            {missing.length ? (
              <p style={{ color: "#f8e7b0", margin: "10px 0 0", fontWeight: 850 }}>
                Missing intelligence: {missing.join(", ")}.
              </p>
            ) : null}
          </section>

          <IntelligencePanel row={row} />

          <div style={{ marginTop: 12 }}>
            {id ? <span style={chip}>ID: {id}</span> : null}
            {signalId ? <span style={chip}>Signal: {signalId}</span> : null}
            <span style={chip}>Market: {marketOf(row)}</span>
            {owner ? <span style={chip}>Owner: {owner}</span> : null}
          </div>

          <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
            {field(row, "routing_needs", "deal_needs", "needs", "route_context") ? <span style={chip}>Execution: {field(row, "routing_needs", "deal_needs", "needs", "route_context")}</span> : null}
          </div>

          <section
            style={{
              marginTop: 12,
              border: "1px solid rgba(148,163,184,.12)",
              borderRadius: 16,
              padding: 12,
              background: "rgba(255,255,255,.02)",
            }}
          >
            <div style={{ ...label, fontSize: 11 }}>Suggested Operators</div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
              <span style={chip}>Buyer</span>
              <span style={chip}>Contractor</span>
              {field(row, "routing_needs", "deal_needs", "needs", "route_context")?.toLowerCase().includes("jv") ? (
                <span style={chip}>JV Partner</span>
              ) : null}
              {(field(row, "distress_signals", "seller_pressure", "pain_signals") || "").toLowerCase().includes("funding") ? (
                <span style={chip}>Lender</span>
              ) : null}
            </div>
          </section>

          <div className="vf-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
            <Link href={detailHref} style={button}>
              {source === "deal" ? "Open Deal Detail" : source === "pain" ? "Open Pain Room" : "Open Signal"}
            </Link>
            {signalId ? <Link href={`/signals/${encodeURIComponent(signalId)}`} style={ghost}>Open Signal</Link> : null}
            {routingId ? <Link href={`/routing-room/${encodeURIComponent(routingId)}`} style={ghost}>Routing Room</Link> : null}
            <Link href={contactHref} style={ghost}>Contact Owner</Link>
          </div>

          <div className="vf-actions" style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8, opacity: .88 }}>
            {!isSaved ? (
              <button type="button" onClick={onSave} style={ghost}>Save to Project Folder</button>
            ) : (
              <button type="button" onClick={onUnsave} style={ghost}>Remove Saved</button>
            )}

            {!isArchived ? (
              <button type="button" onClick={onArchive} style={ghost}>Archive / Clean Up</button>
            ) : (
              <button type="button" onClick={onRestore} style={ghost}>Restore to Active</button>
            )}

            {(isSaved || isArchived) ? (
              <button type="button" onClick={onDelete} style={dangerGhost}>Delete</button>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}

export default function ProjectsPage() {
  const [email, setEmail] = useState("");
  const [items, setItems] = useState<Row[]>([]);
  const [status, setStatus] = useState("Loading workstations...");
  const [folder, setFolder] = useState<FolderMode>("active");
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
          // Keep page alive.
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
      setStatus(unique.length ? "" : "No deal or pain workstations found yet.");
    } catch (error: any) {
      setStatus(error?.message || "Could not load workstations.");
    }
  }

  useEffect(() => {
    setSavedIds(readSet("vf_project_saved_ids"));
    setArchivedIds(readSet("vf_project_archived_ids"));
    setDeletedIds(readSet("vf_project_deleted_ids"));
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

  const visibleItems = useMemo(() => {
    return items.filter((item) => {
      const key = canonicalKey(item);
      const saved = savedIds.has(key);
      const archived = archivedIds.has(key);
      const deleted = deletedIds.has(key);

      if (deleted) return false;
      if (folder === "saved") return saved && !archived;
      if (folder === "archived") return archived;
      return !archived;
    });
  }, [items, savedIds, archivedIds, deletedIds, folder]);

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

    const deals = visibleItems.filter((item) => sourceOf(item) === "deal").length;
    const pains = visibleItems.filter((item) => sourceOf(item) === "pain").length;
    const signals = visibleItems.filter((item) => sourceOf(item) === "signal" || signalIdOf(item)).length;
    const withPhotos = visibleItems.filter((item) => photosOf(item).length).length;

    return {
      total: visibleItems.length,
      deals,
      pains,
      signals,
      withPhotos,
      saved: activeSavedItems.length,
      archived: archivedItems.length,
    };
  }, [items, visibleItems, savedIds, archivedIds, deletedIds]);

  return (
    <main style={page}>
      <style>{`
        .vf-workstation-card {
          overflow: hidden !important;
        }

        .vf-workstation-card * {
          box-sizing: border-box;
        }

        .vf-workstation-card img {
          max-height: 240px !important;
          object-fit: cover !important;
          width: 100% !important;
          display: block !important;
        }

        a:hover,
        button:hover {
          transform: translateY(-1px);
          transition: all .18s ease;
          filter: brightness(1.06);
        }

        @media (max-width: 820px) {
          .vf-grid,
          .vf-four,
          .vf-actions {
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

          .vf-workstation-layout {
            grid-template-columns: 1fr !important;
          }

          .vf-photo-wrap {
            max-height: 220px !important;
          }
        }
      `}</style>

      <div style={wrap}>
        <section className="vf-project-card" style={card}>
          <div style={label}>VaultForge Project Desk</div>

          <h1 style={{ fontSize: "clamp(52px,10vw,96px)", lineHeight: 0.88, letterSpacing: "-.07em", margin: "12px 0 18px" }}>
            Workstations.
          </h1>

          <p style={{ ...muted, fontSize: 20 }}>
            Deal and pain records share one execution desk. Cards show pricing, routing context, photos, owner, market, and next action.
          </p>

          <div style={{ marginTop: 16 }}>
            <span style={chip}>Signed in: {email || "unknown"}</span>
            <span style={chip}>{email === OWNER_EMAIL ? "Owner View" : "Member View"}</span>
            <span style={chip}>Workstations: {counts.total}</span>
            <span style={chip}>Deals: {counts.deals}</span>
            <span style={chip}>Pain: {counts.pains}</span>
            <span style={chip}>Signals: {counts.signals}</span>
            <span style={chip}>With Photos: {counts.withPhotos}</span>
            <span style={chip}>Saved: {counts.saved}</span>
            <span style={chip}>Archived: {counts.archived}</span>
          </div>

          <div className="vf-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
            <button type="button" onClick={() => setFolder("active")} style={folder === "active" ? button : ghost}>Active</button>
            <button type="button" onClick={() => setFolder("saved")} style={folder === "saved" ? button : ghost}>Saved</button>
            <button type="button" onClick={() => setFolder("archived")} style={folder === "archived" ? button : ghost}>Archive</button>
          </div>

          <div className="vf-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 20 }}>
            <Link href="/dashboard" style={ghost}>Dashboard</Link>
            <Link href="/submit" style={button}>Create Deal</Link>
            <Link href="/pain" style={ghost}>Submit Pain</Link>
            <button type="button" onClick={load} style={ghost}>Refresh</button>
          </div>
        </section>

        <section className="vf-four" style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 16, marginBottom: 18 }}>
          <Metric label="Showing" value={String(counts.total)} />
          <Metric label="Deals" value={String(counts.deals)} />
          <Metric label="Saved" value={String(counts.saved)} />
          <Metric label="Archived" value={String(counts.archived)} />
        </section>

        <section style={card}>
          <div style={label}>Project Queue</div>

          <h2 style={{ fontSize: 42, lineHeight: 1, margin: "10px 0 18px" }}>
            Clean workstations.
          </h2>

          {visibleItems.length ? (
            <div style={{ display: "grid", gap: 14 }}>
              {visibleItems.map((item, index) => {
                const key = canonicalKey(item);

                return (
                  <WorkstationCard
                    key={first(key, String(index))}
                    row={item}
                    viewer={email}
                    isSaved={savedIds.has(key)}
                    isArchived={archivedIds.has(key)}
                    onSave={() => saveProject(item)}
                    onUnsave={() => unsaveProject(item)}
                    onArchive={() => archiveProject(item)}
                    onRestore={() => restoreProject(item)}
                    onDelete={() => deleteProject(item)}
                  />
                );
              })}
            </div>
          ) : (
            <div style={glass}>
              <h3 style={{ marginTop: 0 }}>
                {folder === "saved"
                  ? "No saved projects yet."
                  : folder === "archived"
                  ? "No archived projects yet."
                  : "No deal or pain workstations connected yet."}
              </h3>

              <p style={muted}>{status}</p>

              <div className="vf-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
                <Link href="/submit" style={button}>Create Deal</Link>
                <Link href="/pain" style={ghost}>Submit Pain</Link>
                <Link href="/dashboard" style={ghost}>Dashboard</Link>
              </div>
            </div>
          )}
        </section>

        {status && visibleItems.length ? <section style={card}>{status}</section> : null}
      </div>
    </main>
  );
}
