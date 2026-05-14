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

function sourceOf(row: Row) {
  const source = first(row.source_kind, row.source_table, row._source_table, row.source, field(row, "canonical_kind")).toLowerCase();

  if (source.includes("deal") || field(row, "deal_id", "asking_price", "price", "arv", "arv_value", "estimated_value")) return "deal";
  if (source.includes("pain") || field(row, "pain_id", "pain_type")) return "pain";

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

  return number.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
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

function spreadText(row: Row) {
  const ask = numberValue(askOf(row));
  const arv = numberValue(arvOf(row));
  const repairs = numberValue(repairsOf(row));

  if (!Number.isFinite(arv) || !Number.isFinite(ask)) return "Needs numbers";
  const spread = arv - ask - (Number.isFinite(repairs) ? repairs : 0);
  return money(spread);
}

function routingNeed(row: Row) {
  return field(row, "routing_needs", "deal_needs", "needs", "route_context", "requested_help", "help_requested");
}

function pressureText(row: Row) {
  return field(row, "distress_signals", "seller_pressure", "pain_signals", "urgency", "urgency_level") || "No pressure signal listed";
}

function likelyRoute(row: Row) {
  const text = `${routingNeed(row)} ${pressureText(row)} ${field(row, "strategy", "exit_strategy", "deal_strategy")} ${assetOf(row)}`.toLowerCase();
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

function bestNextMove(row: Row) {
  const route = likelyRoute(row);
  const need = routingNeed(row);
  const source = sourceOf(row);

  if (need) return `Route first to ${route.replace(" Route", "").toLowerCase()} and verify: ${need}.`;
  if (source === "deal") return `Package key numbers, verify spread, then route through ${route.toLowerCase()}.`;
  if (source === "pain") return `Clarify blocker, timeline, and owner goal, then open the ${route.toLowerCase()}.`;
  return `Review the signal, confirm owner context, then choose controlled routing.`;
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
  const text = `${pressureText(row)} ${field(row, "seller_situation", "timeline", "deadline")}`.toLowerCase();
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
  return missing.slice(0, 4);
}

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(232,196,107,.14), transparent 28%), radial-gradient(circle at 88% 10%, rgba(56,189,248,.10), transparent 26%), linear-gradient(180deg,#020303,#071326 55%,#020303)",
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
  const source = sourceOf(row);
  const photos = photosOf(row);
  const owner = ownerOf(row);
  const missing = missingInfo(row);
  const route = likelyRoute(row);

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
            <span style={chip}>{source === "deal" ? "Deal" : source === "pain" ? "Pain" : "Signal"}</span>
            <span style={chip}>{assetOf(row)}</span>
            <span style={chip}>{statusOf(row)}</span>
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
              </div>
            </div>
          </div>

          <div className="vf-metrics" style={{ display: "grid", gridTemplateColumns: "repeat(6,minmax(0,1fr))", gap: 8, marginTop: 14 }}>
            <Mini labelText="Ask/Target" value={money(askOf(row))} />
            <Mini labelText="ARV/Value" value={money(arvOf(row))} />
            <Mini labelText="Repairs" value={money(repairsOf(row))} />
            <Mini labelText="Spread" value={spreadText(row)} />
            <Mini labelText="Beds/Baths" value={[field(row, "beds", "bedrooms"), field(row, "baths", "bathrooms")].filter(Boolean).join(" / ") || "Not listed"} />
            <Mini labelText="Size" value={field(row, "square_feet", "sqft", "building_sqft", "acres", "land_acres") || "Not listed"} />
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
            <Link href={detailHref} style={button}>{source === "deal" ? "Open Deal" : source === "pain" ? "Open Pain Room" : "Open Workstation"}</Link>
            <Link href={contactHref} style={ghost}>Contact Owner</Link>
            {!isSaved ? <button type="button" onClick={onSave} style={ghost}>Save</button> : <button type="button" onClick={onUnsave} style={ghost}>Unsave</button>}
            {!isArchived ? <button type="button" onClick={onArchive} style={ghost}>Archive</button> : <button type="button" onClick={onRestore} style={ghost}>Restore</button>}
            {(isSaved || isArchived) ? <button type="button" onClick={onDelete} style={dangerGhost}>Delete</button> : null}
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
      if (!key) return false;
      if (deletedIds.has(key)) return false;

      const saved = savedIds.has(key);
      const archived = archivedIds.has(key);

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

    return {
      total: visibleItems.length,
      deals: visibleItems.filter((item) => sourceOf(item) === "deal").length,
      pains: visibleItems.filter((item) => sourceOf(item) === "pain").length,
      signals: visibleItems.filter((item) => sourceOf(item) === "signal" || signalIdOf(item)).length,
      withPhotos: visibleItems.filter((item) => photosOf(item).length).length,
      saved: activeSavedItems.length,
      archived: archivedItems.length,
    };
  }, [items, visibleItems, savedIds, archivedIds, deletedIds]);

  return (
    <main style={page}>
      <style>{`
        .vf-workstation-card { overflow: hidden !important; }
        .vf-workstation-card * { box-sizing: border-box; }
        a:hover, button:hover { transform: translateY(-1px); transition: all .18s ease; filter: brightness(1.06); }
        @media (max-width: 900px) {
          .vf-grid, .vf-actions, .vf-card-top, .vf-card-bottom, .vf-workstation-layout { grid-template-columns: 1fr !important; }
          .vf-actions { display: grid !important; gap: 10px !important; }
          .vf-actions > * { width: 100%; box-sizing: border-box; justify-content: center; }
          .vf-metrics { grid-template-columns: repeat(2,minmax(0,1fr)) !important; }
          .vf-photo-wrap { border-right: 0 !important; border-bottom: 1px solid rgba(255,255,255,.10) !important; }
        }
      `}</style>

      <div style={wrap}>
        <section style={card}>
          <div style={label}>VaultForge Project Desk</div>
          <h1 style={{ fontSize: "clamp(52px,10vw,96px)", lineHeight: 0.88, letterSpacing: "-.07em", margin: "12px 0 18px" }}>
            Workstations.
          </h1>
          <p style={{ ...muted, fontSize: 20 }}>
            Deal and pain records share one execution desk. Each card keeps the important facts visible: photo, route, best next move, ask, ARV, repairs, spread, owner, market, and action buttons.
          </p>

          <div className="vf-grid" style={{ display: "grid", gridTemplateColumns: "repeat(6,minmax(0,1fr))", gap: 10, marginTop: 18 }}>
            <Mini labelText="Showing" value={counts.total} />
            <Mini labelText="Deals" value={counts.deals} />
            <Mini labelText="Pain" value={counts.pains} />
            <Mini labelText="Signals" value={counts.signals} />
            <Mini labelText="Photos" value={counts.withPhotos} />
            <Mini labelText="Saved" value={counts.saved} />
          </div>

          <div className="vf-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
            <button type="button" onClick={() => setFolder("active")} style={folder === "active" ? button : ghost}>Active</button>
            <button type="button" onClick={() => setFolder("saved")} style={folder === "saved" ? button : ghost}>Saved</button>
            <button type="button" onClick={() => setFolder("archived")} style={folder === "archived" ? button : ghost}>Archived</button>
            <button type="button" onClick={load} style={ghost}>Refresh</button>
            <Link href="/submit" style={ghost}>Create Deal</Link>
            <Link href="/pain" style={ghost}>Submit Pain</Link>
          </div>

          <p style={{ ...muted, marginTop: 14, fontSize: 14 }}>
            Signed in: {email || "unknown"} · Archived: {counts.archived}
          </p>
        </section>

        {status ? (
          <section style={{ ...card, color: "#f8e7b0" }}>
            {status}
          </section>
        ) : null}

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
                onSave={() => saveProject(item)}
                onUnsave={() => unsaveProject(item)}
                onArchive={() => archiveProject(item)}
                onRestore={() => restoreProject(item)}
                onDelete={() => deleteProject(item)}
              />
            );
          })}
        </section>
      </div>
    </main>
  );
}
