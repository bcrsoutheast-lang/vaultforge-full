"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Row = Record<string, any>;

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
  if (Array.isArray(value)) return value.map(clean).filter(Boolean);

  const text = clean(value);
  if (!text) return [];

  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return parsed.map(clean).filter(Boolean);
  } catch {
    // continue
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

function idOf(row: Row) {
  return field(row, "deal_id", "project_id", "item_id", "id", "pain_id", "signal_id");
}

function signalIdOf(row: Row) {
  return field(row, "signal_id", "signalId", "alert_id", "routing_id");
}

function titleOf(row: Row) {
  return field(row, "title", "deal_title", "project_title", "name", "address") || "VaultForge Workstation";
}

function sourceOf(row: Row) {
  const source = first(row.source_kind, row.source_table, row._source_table, row.source, field(row, "canonical_kind")).toLowerCase();

  if (source.includes("deal") || field(row, "deal_id", "asking_price", "price", "arv")) return "deal";
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
      "ai_summary",
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

  return [city, state].filter(Boolean).join(", ") || field(row, "location", "address") || "Market not listed";
}

function ownerOf(row: Row) {
  return cleanEmail(field(row, "owner_email", "member_email", "user_email", "submitted_by_email", "created_by_email"));
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

function detailValue(value: unknown) {
  return clean(value) || "Not listed";
}

function bedsBathsOf(row: Row) {
  const beds = field(row, "beds", "bedrooms");
  const baths = field(row, "baths", "bathrooms");
  return [beds, baths].filter(Boolean).join(" / ") || "Not listed";
}

function sqftAcresOf(row: Row) {
  return (
    field(row, "square_feet", "sqft", "building_sqft", "lot_size") ||
    field(row, "acres", "land_acres") ||
    "Not listed"
  );
}

function smartProjectSummary(row: Row) {
  const supplied = field(row, "ai_route_summary", "route_summary", "routing_summary", "note", "notes", "description");
  if (supplied) return supplied;

  const type = field(row, "property_type", "deal_type", "asset_type") || "deal";
  const strategy = field(row, "strategy", "exit_strategy", "deal_strategy");
  const market = marketOf(row);
  const bedsBaths = bedsBathsOf(row);
  const size = sqftAcresOf(row);
  const needs = field(row, "routing_needs", "deal_needs", "needs", "route_context");

  return [
    `${titleOf(row)} is a ${type} opportunity in ${market}.`,
    strategy ? `Strategy: ${strategy}.` : "",
    bedsBaths !== "Not listed" ? `Beds/Baths: ${bedsBaths}.` : "",
    size !== "Not listed" ? `Size: ${size}.` : "",
    needs ? `Routing need: ${needs}.` : "",
  ].filter(Boolean).join(" ");
}

function canonicalKey(row: Row) {
  return (
    field(row, "canonical_event_id") ||
    field(row, "deal_id") ||
    field(row, "project_id") ||
    field(row, "item_id") ||
    field(row, "signal_id") ||
    field(row, "id") ||
    `${titleOf(row)}-${marketOf(row)}`
  );
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
    "route_summary",
    "ai_route_summary",
    "routing_summary",
  ];

  for (const key of keys) {
    if (field(row, key)) score += 1;
  }

  if (photosOf(row).length) score += 3;

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
  const needs = field(row, "routing_needs", "deal_needs", "needs");
  const signals = field(row, "distress_signals");
  const strategy = field(row, "strategy", "exit_strategy");
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
    : "This deal needs a routing summary. Useful AI context would include buyer type, lender need, contractor scope, timeline, seller pressure, and next best action.";
}

function missingInfo(row: Row) {
  const missing: string[] = [];

  if (!field(row, "routing_needs", "deal_needs", "needs")) missing.push("who should receive this");
  if (!field(row, "distress_signals")) missing.push("urgency or seller pressure");
  if (!field(row, "capital_needed")) missing.push("capital need");
  if (!field(row, "contractor_scope")) missing.push("contractor scope");
  if (!field(row, "operator_scope")) missing.push("operator/JV scope");
  if (!field(row, "target_buyer")) missing.push("target buyer type");

  return missing;
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
    ["Beds/Baths", bedsBathsOf(row)],
    ["Sqft/Acres", sqftAcresOf(row)],
    ["Strategy", detailValue(field(row, "strategy", "exit_strategy", "deal_strategy"))],
    ["Occupancy", detailValue(field(row, "occupancy", "occupancy_status", "tenant_status"))],
    ["Zoning", detailValue(field(row, "zoning", "zoning_type"))],
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

function WorkstationCard({ row, viewer }: { row: Row; viewer: string }) {
  const id = idOf(row);
  const signalId = signalIdOf(row);
  const source = sourceOf(row);
  const photos = photosOf(row);
  const owner = ownerOf(row);
  const missing = missingInfo(row);

  const contactHref = signalId
    ? `/connect/${encodeURIComponent(signalId)}?email=${encodeURIComponent(viewer)}${id ? `&item_id=${encodeURIComponent(id)}` : ""}${owner ? `&to=${encodeURIComponent(owner)}` : ""}&source=project&type=project&folder=projects&folder_key=projects&title=${encodeURIComponent(titleOf(row))}&subject=${encodeURIComponent(titleOf(row))}`
    : `/messages/new?email=${encodeURIComponent(viewer)}${id ? `&item_id=${encodeURIComponent(id)}` : ""}${owner ? `&to=${encodeURIComponent(owner)}` : ""}&source=project&type=project&folder=projects&folder_key=projects&title=${encodeURIComponent(titleOf(row))}&subject=${encodeURIComponent(titleOf(row))}`;

  return (
    <article style={glass}>
      <div style={{ display: "grid", gridTemplateColumns: "170px 1fr", gap: 18 }}>
        <div
          style={{
            borderRadius: 20,
            overflow: "hidden",
            border: "1px solid rgba(232,196,107,.18)",
            background: "rgba(0,0,0,.20)",
            minHeight: 150,
          }}
        >
          {photos[0] ? (
            <img className="vf-safe-project-img" src={photos[0]} alt="Workstation" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          ) : (
            <div style={{ height: 150, display: "grid", placeItems: "center", color: "#94a3b8", fontWeight: 850 }}>No photo</div>
          )}
        </div>

        <div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span style={chip}>{source === "deal" ? "Deal" : source === "pain" ? "Pain" : "Signal"}</span>
            <span style={chip}>{assetOf(row)}</span>
            <span style={chip}>{statusOf(row)}</span>
            {signalId ? <span style={chip}>Signal linked</span> : null}
          </div>

          <h3 style={{ fontSize: 30, lineHeight: 1.02, margin: "14px 0 10px" }}>{titleOf(row)}</h3>
          <p style={muted}>{smartProjectSummary(row)}</p>

          {source === "deal" ? <DetailGrid row={row} /> : null}

          <section style={{ marginTop: 14, border: "1px solid rgba(232,196,107,.16)", borderRadius: 18, padding: 14, background: "rgba(232,196,107,.055)" }}>
            <div style={{ ...label, fontSize: 11 }}>Routing Summary</div>
            <p style={{ ...muted, margin: "8px 0 0" }}>{routingSummary(row)}</p>
            {missing.length ? (
              <p style={{ color: "#f8e7b0", margin: "10px 0 0", fontWeight: 850 }}>
                Add for stronger AI routing: {missing.join(", ")}.
              </p>
            ) : null}
          </section>

          <div style={{ marginTop: 12 }}>
            {id ? <span style={chip}>ID: {id}</span> : null}
            {signalId ? <span style={chip}>Signal: {signalId}</span> : null}
            <span style={chip}>Market: {marketOf(row)}</span>
            {owner ? <span style={chip}>Owner: {owner}</span> : null}
          </div>

          <div style={{ marginTop: 12 }}>
            {field(row, "routing_needs", "deal_needs", "needs") ? <span style={chip}>Needs: {field(row, "routing_needs", "deal_needs", "needs")}</span> : null}
            {field(row, "distress_signals") ? <span style={chip}>Signals: {field(row, "distress_signals")}</span> : null}
          </div>

          <div className="vf-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
            <Link href={contactHref} style={button}>Contact Owner</Link>
            {signalId ? <Link href={`/routing-room/${encodeURIComponent(signalId)}`} style={ghost}>Routing Room</Link> : null}
            {source === "deal" && id ? <Link href={`/deal/detail?id=${encodeURIComponent(id)}`} style={ghost}>Deal Detail</Link> : null}
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

      for (const item of collected) {
        const key = canonicalKey(item);
        if (!key) continue;

        const existing = byKey.get(key);

        if (!existing) {
          byKey.set(key, item);
          continue;
        }

        const itemScore = completenessScore(item);
        const existingScore = completenessScore(existing);

        const primary = itemScore >= existingScore ? item : existing;
        const secondary = itemScore >= existingScore ? existing : item;

        byKey.set(key, mergeRows(primary, secondary));
      }

      const unique = Array.from(byKey.values());

      setItems(unique);
      setStatus(unique.length ? "" : "No deal or pain workstations found yet.");
    } catch (error: any) {
      setStatus(error?.message || "Could not load workstations.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  const counts = useMemo(() => {
    const deals = items.filter((item) => sourceOf(item) === "deal").length;
    const pains = items.filter((item) => sourceOf(item) === "pain").length;
    const withPhotos = items.filter((item) => photosOf(item).length).length;

    return { total: items.length, deals, pains, withPhotos };
  }, [items]);

  return (
    <main style={page}>
      <style>{`
        .vf-safe-project-img {
          width: 100% !important;
          height: 260px !important;
          max-height: 260px !important;
          object-fit: cover !important;
          display: block !important;
          border-radius: 22px !important;
        }
        @media (max-width: 820px) {
          .vf-safe-project-img {
            height: 220px !important;
            max-height: 220px !important;
          }
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

          article > div {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      <div style={wrap}>
        <section style={card}>
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
            <span style={chip}>With Photos: {counts.withPhotos}</span>
          </div>

          <div className="vf-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 20 }}>
            <Link href="/dashboard" style={ghost}>Dashboard</Link>
            <Link href="/submit" style={button}>Create Deal</Link>
            <Link href="/pain" style={ghost}>Submit Pain</Link>
            <button type="button" onClick={load} style={ghost}>Refresh</button>
          </div>
        </section>

        <section className="vf-four" style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 16, marginBottom: 18 }}>
          <Metric label="Workstations" value={String(counts.total)} />
          <Metric label="Deals" value={String(counts.deals)} />
          <Metric label="Pain" value={String(counts.pains)} />
          <Metric label="With Photos" value={String(counts.withPhotos)} />
        </section>

        <section style={card}>
          <div style={label}>Project Queue</div>

          <h2 style={{ fontSize: 42, lineHeight: 1, margin: "10px 0 18px" }}>
            Clean workstations.
          </h2>

          {items.length ? (
            <div style={{ display: "grid", gap: 14 }}>
              {items.map((item, index) => (
                <WorkstationCard key={first(field(item, "canonical_event_id"), idOf(item), signalIdOf(item), String(index))} row={item} viewer={email} />
              ))}
            </div>
          ) : (
            <div style={glass}>
              <h3 style={{ marginTop: 0 }}>No deal or pain workstations connected yet.</h3>

              <p style={muted}>{status}</p>

              <div className="vf-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
                <Link href="/submit" style={button}>Create Deal</Link>
                <Link href="/pain" style={ghost}>Submit Pain</Link>
                <Link href="/dashboard" style={ghost}>Dashboard</Link>
              </div>
            </div>
          )}
        </section>

        {status && items.length ? <section style={card}>{status}</section> : null}
      </div>
    </main>
  );
}