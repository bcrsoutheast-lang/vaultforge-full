"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Row = Record<string, any>;
type ViewMode = "active" | "saved" | "deleted";

const OWNER_EMAIL = "bcrsoutheast@gmail.com";

function clean(value: unknown) {
  return String(value || "").trim();
}

function cleanEmail(value: unknown) {
  return clean(value).toLowerCase();
}

function lower(value: unknown) {
  return clean(value).toLowerCase();
}

function compact(value: unknown) {
  return clean(value).replace(/\s+/g, " ");
}

function slug(value: unknown) {
  return compact(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
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

  return cleanEmail(
    readCookie("vf_email") ||
      readCookie("vf_member_email") ||
      readCookie("vf_admin_email")
  );
}

function parseArray(value: unknown): any[] {
  if (Array.isArray(value)) return value;

  const text = clean(value);
  if (!text) return [];

  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // Keep parsing as delimited text.
  }

  return text
    .split(/[,\n|;]/)
    .map((item) => item.trim())
    .filter(Boolean);
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
            return clean(item.url || item.publicUrl || item.public_url || item.photo_url || item.image_url);
          }
          return "";
        })
        .filter((url) => url.startsWith("http"))
    )
  );
}

function photoFingerprint(row: Row) {
  const photo = photosOf(row)[0] || "";
  const bare = photo.split("?")[0];
  const parts = bare.split("/").filter(Boolean);
  return slug(parts.slice(-2).join("-") || bare);
}

function idOf(row: Row) {
  return field(row, "deal_id", "project_id", "item_id", "id");
}

function signalIdOf(row: Row) {
  return field(row, "signal_id", "signalId", "alert_id", "routing_id");
}

function titleOf(row: Row) {
  return field(row, "title", "deal_title", "project_title", "name", "address") || "Untitled Project";
}

function marketOf(row: Row) {
  const city = field(row, "city");
  const state = field(row, "state", "market");
  return [city, state].filter(Boolean).join(", ") || field(row, "market", "location", "address") || "Market not listed";
}

function ownerOf(row: Row) {
  return cleanEmail(field(row, "owner_email", "member_email", "user_email", "submitted_by_email", "created_by_email"));
}

function assetOf(row: Row) {
  return field(row, "asset_type", "property_type", "deal_type") || "Project";
}

function statusOf(row: Row) {
  return field(row, "status", "project_status", "routing_status") || "Open";
}

function noteOf(row: Row) {
  return field(row, "note", "ai_route_summary", "route_summary", "routing_summary", "summary", "description", "notes", "message", "seller_situation") || "Project ready for review.";
}

function numberValue(value: unknown) {
  const text = clean(value);
  if (!text) return NaN;

  const number = Number(text.replace(/[^\d.-]/g, ""));
  return Number.isFinite(number) ? number : NaN;
}

function money(value: unknown) {
  const text = clean(value);
  if (!text) return "Not listed";

  const number = numberValue(text);
  if (!Number.isFinite(number)) return text;

  return number.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function display(value: unknown) {
  return clean(value) || "Not listed";
}

function strongKey(row: Row, index = 0) {
  const title = slug(titleOf(row));
  const market = slug(marketOf(row));
  const owner = slug(ownerOf(row));
  const address = slug(field(row, "address", "property_address", "location"));
  const ask = slug(field(row, "asking_price", "price"));
  const arv = slug(field(row, "arv", "arv_value", "estimated_value"));
  const photo = photoFingerprint(row);
  const backendKey = field(row, "canonical_project_key", "_dedupe_key", "canonical_event_id");

  if (title && (market || address || ask || arv || photo)) {
    return ["project", title, market, owner, address || photo, ask || arv].filter(Boolean).join("|");
  }

  return backendKey || idOf(row) || signalIdOf(row) || `${title || "project"}-${market || "market"}-${index}`;
}

function completenessScore(row: Row) {
  let score = 0;

  const keys = [
    "asking_price",
    "price",
    "arv",
    "arv_value",
    "repair_estimate",
    "repairs_needed",
    "beds",
    "bedrooms",
    "baths",
    "bathrooms",
    "square_feet",
    "sqft",
    "strategy",
    "exit_strategy",
    "routing_needs",
    "deal_needs",
    "distress_signals",
    "seller_situation",
    "contractor_scope",
    "capital_needed",
    "operator_scope",
    "target_buyer",
    "route_summary",
    "ai_route_summary",
    "routing_summary",
  ];

  for (const key of keys) {
    if (field(row, key)) score += 1;
  }

  if (photosOf(row).length) score += 5;

  const source = lower(first(row.source_table, row._source_table, row.source));
  if (source.includes("vf_deals")) score += 100;
  if (source.includes("deal")) score += 10;

  const status = lower(statusOf(row));
  if (status.includes("active") || status.includes("open") || status.includes("new")) score += 3;
  if (status.includes("archive") || status.includes("delete")) score -= 10;

  return score;
}

function mergeText(a: unknown, b: unknown) {
  const firstText = clean(a);
  const secondText = clean(b);
  if (firstText && secondText && firstText !== secondText) {
    return firstText.length >= secondText.length ? firstText : secondText;
  }
  return firstText || secondText;
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

  const textKeys = [
    "note",
    "notes",
    "description",
    "route_summary",
    "routing_summary",
    "ai_route_summary",
    "routing_needs",
    "deal_needs",
    "needs",
    "distress_signals",
    "seller_situation",
    "contractor_scope",
    "operator_scope",
    "capital_needed",
    "target_buyer",
  ];

  for (const key of textKeys) {
    const value = mergeText(primary[key], secondary[key]);
    if (value) merged[key] = value;
  }

  const photos = Array.from(new Set([...photosOf(secondary), ...photosOf(primary)].map(clean).filter(Boolean)));

  if (photos.length) {
    merged.photo_urls = photos;
    merged.photos = photos.map((url) => ({ url }));
    merged.main_photo_url = first(primary.main_photo_url, secondary.main_photo_url, photos[0]);
    merged.image_url = first(primary.image_url, secondary.image_url, merged.main_photo_url);
    merged.photo_url = first(primary.photo_url, secondary.photo_url, merged.main_photo_url);
  }

  return merged;
}

function dedupeRows(rows: Row[]) {
  const byKey = new Map<string, Row>();

  rows.forEach((row, index) => {
    const key = strongKey(row, index);
    const existing = byKey.get(key);

    if (!existing) {
      byKey.set(key, row);
      return;
    }

    const rowScore = completenessScore(row);
    const existingScore = completenessScore(existing);

    const primary = rowScore >= existingScore ? row : existing;
    const secondary = rowScore >= existingScore ? existing : row;

    byKey.set(key, mergeRows(primary, secondary));
  });

  return Array.from(byKey.values());
}

function spreadText(row: Row) {
  const ask = numberValue(field(row, "asking_price", "price"));
  const arv = numberValue(field(row, "arv", "arv_value", "estimated_value"));
  const repairs = numberValue(field(row, "repair_estimate", "repairs_needed", "estimated_repairs"));

  if (!Number.isFinite(ask) || !Number.isFinite(arv)) return "";

  const spread = arv - ask - (Number.isFinite(repairs) ? repairs : 0);
  const formatted = spread.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });

  if (spread > 0) return `Estimated room before soft costs: ${formatted}.`;
  if (spread < 0) return `Pricing pressure before soft costs: ${formatted}.`;
  return "Estimated spread is neutral before soft costs.";
}

function bestFit(row: Row) {
  const asset = lower(assetOf(row));
  const strategy = lower(field(row, "strategy", "exit_strategy"));
  const needs = lower(field(row, "routing_needs", "deal_needs", "needs"));
  const contractor = field(row, "contractor_scope");
  const capital = field(row, "capital_needed");

  if (needs.includes("buyer") || strategy.includes("flip")) {
    return contractor ? "cash buyer or flip operator with contractor capacity" : "cash buyer or flip operator";
  }

  if (capital || needs.includes("capital") || needs.includes("lender")) {
    return "private lender, capital partner, or JV operator";
  }

  if (asset.includes("land")) return "land buyer, builder, or entitlement operator";
  if (asset.includes("commercial")) return "commercial operator or capitalized sponsor";

  return "local operator with execution capacity";
}

function smartSummary(row: Row) {
  const asset = display(assetOf(row)).toLowerCase();
  const strategy = field(row, "strategy", "exit_strategy");
  const market = marketOf(row);
  const ask = money(field(row, "asking_price", "price"));
  const arv = money(field(row, "arv", "arv_value", "estimated_value"));
  const repairs = money(field(row, "repair_estimate", "repairs_needed", "estimated_repairs"));
  const needs = field(row, "routing_needs", "deal_needs", "needs");
  const signals = field(row, "distress_signals", "seller_pressure");
  const urgency = field(row, "urgency", "priority", "urgency_level");
  const contractor = field(row, "contractor_scope");

  const lead = [
    `Route this ${asset}`,
    strategy ? `as a ${strategy} opportunity` : "as an operator-reviewed opportunity",
    market && market !== "Market not listed" ? `in ${market}` : "",
  ]
    .filter(Boolean)
    .join(" ");

  const economics = [
    ask !== "Not listed" ? `${ask} ask` : "",
    arv !== "Not listed" ? `${arv} ARV` : "",
    repairs !== "Not listed" ? `${repairs} repairs` : "",
  ].filter(Boolean);

  const execution = [
    needs ? `needs ${needs}` : "",
    signals ? `pressure signal: ${signals}` : "",
    urgency ? `urgency: ${urgency}` : "",
    contractor ? `contractor scope: ${contractor}` : "",
  ].filter(Boolean);

  return [
    `${lead}.`,
    economics.length ? `Economics: ${economics.join(" / ")}. ${spreadText(row)}`.trim() : "",
    execution.length ? `Execution read: ${execution.join(" / ")}.` : "",
    `Best-fit route: ${bestFit(row)}.`,
  ]
    .filter(Boolean)
    .join(" ");
}

function localKey(email: string, name: string) {
  return `vf_projects_${name}_${email || "unknown"}`;
}

function loadKeySet(email: string, name: string) {
  if (typeof window === "undefined") return new Set<string>();

  try {
    const raw = window.localStorage.getItem(localKey(email, name));
    const parsed = raw ? JSON.parse(raw) : [];
    return new Set<string>(Array.isArray(parsed) ? parsed.map(clean).filter(Boolean) : []);
  } catch {
    return new Set<string>();
  }
}

function saveKeySet(email: string, name: string, keys: Set<string>) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(localKey(email, name), JSON.stringify(Array.from(keys)));
  } catch {
    // Local cleanup controls are non-critical.
  }
}

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(232,196,107,.14), transparent 28%), linear-gradient(180deg,#020303,#071326 52%,#020303)",
  color: "white",
  padding: "22px 16px 96px",
  fontFamily: "Arial, sans-serif",
};

const wrap: React.CSSProperties = {
  width: "min(1220px,100%)",
  margin: "0 auto",
};

const shell: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.24)",
  borderRadius: 30,
  padding: 22,
  background: "rgba(255,255,255,.045)",
  boxShadow: "0 28px 86px rgba(0,0,0,.30)",
  marginBottom: 18,
};

const panel: React.CSSProperties = {
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

const muted: React.CSSProperties = {
  color: "#cbd5e1",
  lineHeight: 1.55,
};

const button: React.CSSProperties = {
  display: "inline-flex",
  justifyContent: "center",
  alignItems: "center",
  minHeight: 46,
  borderRadius: 999,
  padding: "11px 16px",
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
    <section style={panel}>
      <div style={{ fontWeight: 950, letterSpacing: ".14em", textTransform: "uppercase", fontSize: 12, color: "#e8c46b" }}>
        {label}
      </div>
      <div style={{ fontSize: 42, fontWeight: 1000, lineHeight: 1, marginTop: 12 }}>{value}</div>
    </section>
  );
}

function DetailGrid({ row }: { row: Row }) {
  const values = [
    ["Ask", money(field(row, "asking_price", "price"))],
    ["ARV", money(field(row, "arv", "arv_value", "estimated_value"))],
    ["Repairs", money(field(row, "repair_estimate", "repairs_needed", "estimated_repairs"))],
    ["Beds", display(field(row, "beds", "bedrooms"))],
    ["Baths", display(field(row, "baths", "bathrooms"))],
    ["Sqft/Acres", display(field(row, "square_feet", "sqft", "building_sqft", "acres", "land_acres"))],
    ["Strategy", display(field(row, "strategy", "exit_strategy"))],
    ["Occupancy", display(field(row, "occupancy", "occupancy_status", "tenant_status"))],
  ];

  return (
    <div className="vf-detail-grid">
      {values.map(([k, v]) => (
        <div key={k} className="vf-detail-tile">
          <div className="vf-detail-label">{k}</div>
          <div className="vf-detail-value">{v}</div>
        </div>
      ))}
    </div>
  );
}

function ProjectCard({
  row,
  viewer,
  saved,
  deleted,
  onSave,
  onUnsave,
  onHide,
  onRestore,
}: {
  row: Row;
  viewer: string;
  saved: boolean;
  deleted: boolean;
  onSave: (key: string) => void;
  onUnsave: (key: string) => void;
  onHide: (key: string) => void;
  onRestore: (key: string) => void;
}) {
  const id = idOf(row);
  const signalId = signalIdOf(row);
  const photos = photosOf(row);
  const owner = ownerOf(row);
  const key = strongKey(row);

  const contactHref = `/messages/new?email=${encodeURIComponent(viewer)}${
    id ? `&item_id=${encodeURIComponent(id)}` : ""
  }${owner ? `&to=${encodeURIComponent(owner)}` : ""}&source=project&type=project&folder=projects&folder_key=projects&title=${encodeURIComponent(
    titleOf(row)
  )}&subject=${encodeURIComponent(titleOf(row))}`;

  return (
    <article className="vf-project-card">
      <div className="vf-project-photo-box">
        {photos[0] ? (
          <img src={photos[0]} alt={titleOf(row)} className="vf-project-photo" />
        ) : (
          <div className="vf-no-photo">No photo</div>
        )}
        {photos.length > 1 ? <div className="vf-photo-count">{photos.length} photos</div> : null}
      </div>

      <div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <span style={chip}>Project</span>
          <span style={chip}>{assetOf(row)}</span>
          <span style={chip}>{statusOf(row)}</span>
          {signalId ? <span style={chip}>Signal linked</span> : null}
          {saved ? <span style={chip}>Saved</span> : null}
          {deleted ? <span style={chip}>Deleted</span> : null}
        </div>

        <h3 className="vf-card-title">{titleOf(row)}</h3>
        <p className="vf-one-line">{noteOf(row)}</p>

        <DetailGrid row={row} />

        <section className="vf-routing-box">
          <div style={{ ...label, fontSize: 11 }}>Bloomberg AI Brief</div>
          <p style={{ ...muted, margin: "8px 0 0" }}>{smartSummary(row)}</p>
        </section>

        <div style={{ marginTop: 12 }}>
          {id ? <span style={chip}>ID: {id}</span> : null}
          {signalId ? <span style={chip}>Signal: {signalId}</span> : null}
          <span style={chip}>Market: {marketOf(row)}</span>
          {owner ? <span style={chip}>Owner: {owner}</span> : null}
        </div>

        <div className="vf-actions">
          <Link href={contactHref} style={button}>Contact Owner</Link>
          {signalId ? <Link href={`/routing-room/${encodeURIComponent(signalId)}`} style={ghost}>Routing Room</Link> : null}
          {id ? <Link href={`/deal/detail?id=${encodeURIComponent(id)}`} style={ghost}>Deal Detail</Link> : null}

          {saved ? (
            <button type="button" onClick={() => onUnsave(key)} style={ghost}>Remove Saved</button>
          ) : (
            <button type="button" onClick={() => onSave(key)} style={ghost}>Save</button>
          )}

          {deleted ? (
            <button type="button" onClick={() => onRestore(key)} style={ghost}>Restore</button>
          ) : (
            <button type="button" onClick={() => onHide(key)} style={dangerGhost}>Hide</button>
          )}
        </div>
      </div>
    </article>
  );
}

export default function ProjectsPage() {
  const [email, setEmail] = useState("");
  const [items, setItems] = useState<Row[]>([]);
  const [savedKeys, setSavedKeys] = useState<Set<string>>(new Set());
  const [deletedKeys, setDeletedKeys] = useState<Set<string>>(new Set());
  const [view, setView] = useState<ViewMode>("active");
  const [status, setStatus] = useState("Loading projects...");

  async function load() {
    const viewer = getEmail();
    const owner = viewer === OWNER_EMAIL;
    const ownerFlag = owner ? "1" : "0";

    setEmail(viewer);
    setSavedKeys(loadKeySet(viewer, "saved"));
    setDeletedKeys(loadKeySet(viewer, "deleted"));
    setStatus("Loading projects...");

    try {
      const response = await fetch(
        `/api/deal/feed?email=${encodeURIComponent(viewer)}&owner=${ownerFlag}`,
        {
          cache: "no-store",
          credentials: "include",
          headers: {
            "x-vf-email": viewer,
            "x-vf-admin": ownerFlag,
          },
        }
      );

      const data = await response.json().catch(() => ({}));

      const collected: Row[] = [
        ...(Array.isArray(data.deals) ? data.deals : []),
        ...(Array.isArray(data.projects) ? data.projects : []),
        ...(Array.isArray(data.items) ? data.items : []),
        ...(Array.isArray(data.data) ? data.data : []),
      ];

      const unique = dedupeRows(collected);
      setItems(unique);
      setStatus(unique.length ? "" : "No projects found yet.");
    } catch (error: any) {
      setStatus(error?.message || "Could not load projects.");
      setItems([]);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const rowsForView = useMemo(() => {
    return items.filter((item, index) => {
      const key = strongKey(item, index);
      const isSaved = savedKeys.has(key);
      const isDeleted = deletedKeys.has(key);

      if (view === "saved") return isSaved && !isDeleted;
      if (view === "deleted") return isDeleted;
      return !isDeleted;
    });
  }, [items, savedKeys, deletedKeys, view]);

  const counts = useMemo(() => {
    const active = items.filter((item, index) => !deletedKeys.has(strongKey(item, index))).length;
    const saved = items.filter((item, index) => savedKeys.has(strongKey(item, index)) && !deletedKeys.has(strongKey(item, index))).length;
    const deleted = items.filter((item, index) => deletedKeys.has(strongKey(item, index))).length;

    return {
      total: active,
      saved,
      deleted,
      withPhotos: items.filter((item, index) => !deletedKeys.has(strongKey(item, index)) && photosOf(item).length).length,
      routed: items.filter((item, index) => !deletedKeys.has(strongKey(item, index)) && signalIdOf(item)).length,
    };
  }, [items, savedKeys, deletedKeys]);

  function saveProject(key: string) {
    const next = new Set(savedKeys);
    next.add(key);
    setSavedKeys(next);
    saveKeySet(email, "saved", next);
  }

  function unsaveProject(key: string) {
    const next = new Set(savedKeys);
    next.delete(key);
    setSavedKeys(next);
    saveKeySet(email, "saved", next);
  }

  function deleteProject(key: string) {
    const next = new Set(deletedKeys);
    next.add(key);
    setDeletedKeys(next);
    saveKeySet(email, "deleted", next);
  }

  function restoreDeletedProject(key: string) {
    const next = new Set(deletedKeys);
    next.delete(key);
    setDeletedKeys(next);
    saveKeySet(email, "deleted", next);
  }

  function clearLocalCleanup() {
    const emptySet = new Set<string>();
    setSavedKeys(emptySet);
    setDeletedKeys(emptySet);
    saveKeySet(email, "saved", emptySet);
    saveKeySet(email, "deleted", emptySet);
  }

  return (
    <main style={page}>
      <style>{`
        .vf-metrics {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 18px;
        }

        .vf-project-card {
          border: 1px solid rgba(255,255,255,.12);
          border-radius: 24px;
          padding: 18px;
          background: rgba(255,255,255,.045);
          display: grid;
          grid-template-columns: 220px 1fr;
          gap: 18px;
          overflow: deleted;
        }

        .vf-project-photo-box {
          position: relative;
          width: 100%;
          height: 170px;
          border-radius: 20px;
          overflow: deleted;
          border: 1px solid rgba(232,196,107,.18);
          background: rgba(0,0,0,.22);
        }

        .vf-project-photo {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .vf-no-photo {
          height: 100%;
          display: grid;
          place-items: center;
          color: #94a3b8;
          font-weight: 850;
        }

        .vf-photo-count {
          position: absolute;
          left: 10px;
          bottom: 10px;
          border-radius: 999px;
          padding: 6px 9px;
          background: rgba(0,0,0,.70);
          border: 1px solid rgba(255,255,255,.16);
          color: white;
          font-size: 12px;
          font-weight: 850;
        }

        .vf-card-title {
          font-size: clamp(26px, 4vw, 38px);
          line-height: 1;
          margin: 14px 0 10px;
          letter-spacing: -.04em;
        }

        .vf-one-line {
          color: #cbd5e1;
          line-height: 1.45;
          margin-top: 0;
        }

        .vf-detail-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(132px, 1fr));
          gap: 10px;
          margin-top: 14px;
        }

        .vf-detail-tile {
          border: 1px solid rgba(255,255,255,.10);
          border-radius: 16px;
          padding: 12px;
          background: rgba(0,0,0,.14);
        }

        .vf-detail-label {
          color: #94a3b8;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: .12em;
          font-weight: 850;
        }

        .vf-detail-value {
          margin-top: 6px;
          font-weight: 950;
        }

        .vf-routing-box {
          margin-top: 14px;
          border: 1px solid rgba(232,196,107,.16);
          border-radius: 18px;
          padding: 14px;
          background: rgba(232,196,107,.055);
        }

        .vf-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-top: 18px;
        }

        @media (max-width: 1000px) {
          .vf-metrics {
            grid-template-columns: 1fr 1fr;
          }
        }

        @media (max-width: 880px) {
          .vf-project-card {
            grid-template-columns: 1fr;
          }

          .vf-project-photo-box {
            height: 210px;
          }
        }

        @media (max-width: 560px) {
          .vf-metrics {
            grid-template-columns: 1fr;
          }

          .vf-actions {
            display: grid;
            grid-template-columns: 1fr;
          }

          .vf-actions > * {
            width: 100%;
            box-sizing: border-box;
            justify-content: center;
          }
        }
      `}</style>

      <div style={wrap}>
        <section style={shell}>
          <div style={label}>VaultForge Projects</div>

          <h1 style={{ fontSize: "clamp(48px,9vw,92px)", lineHeight: 0.9, letterSpacing: "-.07em", margin: "12px 0 18px" }}>
            Projects.
          </h1>

          <p style={{ ...muted, fontSize: 20, maxWidth: 900 }}>
            Clean opportunity review for submitted projects, deal rooms, photos, pricing, routing context, saved cards, and cleanup controls.
          </p>

          <div style={{ marginTop: 16 }}>
            <span style={chip}>Signed in: {email || "unknown"}</span>
            <span style={chip}>{email === OWNER_EMAIL ? "Owner View" : "Member View"}</span>
            <span style={chip}>Active: {counts.total}</span>
            <span style={chip}>Saved: {counts.saved}</span>
            <span style={chip}>Deleted: {counts.deleted}</span>
          </div>

          <div className="vf-actions">
            <button type="button" onClick={() => setView("active")} style={view === "active" ? button : ghost}>Active</button>
            <button type="button" onClick={() => setView("saved")} style={view === "saved" ? button : ghost}>Saved</button>
            <button type="button" onClick={() => setView("deleted")} style={view === "deleted" ? button : ghost}>Deleted</button>
            <button type="button" onClick={load} style={ghost}>Refresh</button>
            <button type="button" onClick={clearLocalCleanup} style={dangerGhost}>Clear Local Cleanup</button>
          </div>

          <div className="vf-actions">
            <Link href="/dashboard" style={ghost}>Dashboard</Link>
            <Link href="/submit" style={button}>Create Deal</Link>
            <Link href="/pain-feed" style={ghost}>Pain Feed</Link>
          </div>
        </section>

        <section className="vf-metrics">
          <Metric label="Active" value={String(counts.total)} />
          <Metric label="Saved" value={String(counts.saved)} />
          <Metric label="Deleted" value={String(counts.deleted)} />
          <Metric label="Routed" value={String(counts.routed)} />
          <Metric label="With Photos" value={String(counts.withPhotos)} />
        </section>

        <section style={shell}>
          <div style={label}>Project Queue</div>

          <h2 style={{ fontSize: "clamp(34px,6vw,54px)", lineHeight: 1, margin: "10px 0 18px", letterSpacing: "-.05em" }}>
            {view === "active" ? "Active opportunity cards." : view === "saved" ? "Saved opportunities." : "Deleted opportunities."}
          </h2>

          {rowsForView.length ? (
            <div style={{ display: "grid", gap: 14 }}>
              {rowsForView.map((item, index) => {
                const key = strongKey(item, index);
                return (
                  <ProjectCard
                    key={key}
                    row={item}
                    viewer={email}
                    saved={savedKeys.has(key)}
                    deleted={deletedKeys.has(key)}
                    onSave={saveProject}
                    onUnsave={unsaveProject}
                    onHide={deleteProject}
                    onRestore={restoreDeletedProject}
                  />
                );
              })}
            </div>
          ) : (
            <div style={panel}>
              <h3 style={{ marginTop: 0 }}>
                {view === "active" ? "No active projects connected yet." : view === "saved" ? "No saved projects yet." : "No deleted projects."}
              </h3>

              <p style={muted}>{status}</p>

              <div className="vf-actions">
                <Link href="/submit" style={button}>Create Deal</Link>
                <Link href="/pain-feed" style={ghost}>Pain Feed</Link>
                <Link href="/dashboard" style={ghost}>Dashboard</Link>
              </div>
            </div>
          )}
        </section>

        {status && rowsForView.length ? <section style={shell}>{status}</section> : null}
      </div>
    </main>
  );
}
