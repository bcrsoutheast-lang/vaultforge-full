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

  return cleanEmail(
    readCookie("vf_email") ||
      readCookie("vf_member_email") ||
      readCookie("vf_admin_email")
  );
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

function idOf(row: Row) {
  return field(row, "deal_id", "project_id", "item_id", "id");
}

function signalIdOf(row: Row) {
  return field(row, "signal_id", "signalId", "alert_id", "routing_id");
}

function titleOf(row: Row) {
  return (
    field(row, "title", "deal_title", "project_title", "name", "address") ||
    "Untitled Project"
  );
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
      "message"
    ) || "Project ready for review."
  );
}

function assetOf(row: Row) {
  return field(row, "asset_type", "property_type", "deal_type") || "Project";
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
  return cleanEmail(
    field(row, "owner_email", "member_email", "user_email", "submitted_by_email", "created_by_email")
  );
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

function canonicalKey(row: Row) {
  return (
    field(row, "canonical_event_id") ||
    field(row, "deal_id") ||
    field(row, "project_id") ||
    field(row, "item_id") ||
    field(row, "id") ||
    `${titleOf(row)}-${marketOf(row)}-${money(field(row, "asking_price", "price"))}`
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

function routingSummary(row: Row) {
  const summary = noteOf(row);
  const needs = field(row, "routing_needs", "deal_needs", "needs");
  const signals = field(row, "distress_signals");
  const strategy = field(row, "strategy", "exit_strategy");
  const market = marketOf(row);
  const owner = ownerOf(row);

  const parts = [
    summary && summary !== "Project ready for review." ? summary : "",
    needs ? `Needs: ${needs}` : "",
    signals ? `Signal pressure: ${signals}` : "",
    strategy ? `Likely strategy: ${strategy}` : "",
    market && market !== "Market not listed" ? `Market context: ${market}` : "",
    owner ? `Owner/contact: ${owner}` : "",
  ].filter(Boolean);

  return parts.length
    ? parts.join(" • ")
    : "Routing context is light. Add buyer type, lender need, contractor scope, timeline, seller pressure, or next action to improve matching.";
}

function missingInfo(row: Row) {
  const missing: string[] = [];

  if (!field(row, "routing_needs", "deal_needs", "needs")) missing.push("routing need");
  if (!field(row, "distress_signals")) missing.push("urgency/seller pressure");
  if (!field(row, "capital_needed")) missing.push("capital need");
  if (!field(row, "contractor_scope")) missing.push("contractor scope");
  if (!field(row, "operator_scope")) missing.push("operator/JV scope");
  if (!field(row, "target_buyer")) missing.push("target buyer");

  return missing;
}

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(232,196,107,.14), transparent 28%), radial-gradient(circle at 88% 10%, rgba(148,163,184,.10), transparent 24%), linear-gradient(180deg,#020303,#071326 52%,#020303)",
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
      <div
        style={{
          fontWeight: 950,
          letterSpacing: ".14em",
          textTransform: "uppercase",
          fontSize: 12,
          color: "#e8c46b",
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 42, fontWeight: 1000, lineHeight: 1, marginTop: 12 }}>
        {value}
      </div>
    </section>
  );
}

function DetailGrid({ row }: { row: Row }) {
  const values = [
    ["Ask", money(field(row, "asking_price", "price"))],
    ["ARV", money(field(row, "arv", "arv_value", "estimated_value"))],
    ["Repairs", money(field(row, "repair_estimate", "repairs_needed", "estimated_repairs"))],
    [
      "Beds/Baths",
      [field(row, "beds", "bedrooms"), field(row, "baths", "bathrooms")]
        .filter(Boolean)
        .join(" / ") || "Not listed",
    ],
    [
      "Sqft/Acres",
      field(row, "square_feet", "sqft", "building_sqft", "acres", "land_acres") ||
        "Not listed",
    ],
    ["Strategy", field(row, "strategy", "exit_strategy") || "Not listed"],
  ];

  return (
    <div className="vf-detail-grid">
      {values.map(([k, v]) => (
        <div key={k} style={{ border: "1px solid rgba(255,255,255,.10)", borderRadius: 16, padding: 12, background: "rgba(0,0,0,.14)" }}>
          <div style={{ color: "#94a3b8", fontSize: 11, textTransform: "uppercase", letterSpacing: ".12em", fontWeight: 850 }}>{k}</div>
          <div style={{ marginTop: 6, fontWeight: 950 }}>{v}</div>
        </div>
      ))}
    </div>
  );
}

function ProjectCard({
  row,
  viewer,
  onHide,
}: {
  row: Row;
  viewer: string;
  onHide: (key: string) => void;
}) {
  const id = idOf(row);
  const signalId = signalIdOf(row);
  const photos = photosOf(row);
  const owner = ownerOf(row);
  const missing = missingInfo(row);
  const key = canonicalKey(row);

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

        {photos.length > 1 ? (
          <div className="vf-photo-count">{photos.length} photos</div>
        ) : null}
      </div>

      <div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <span style={chip}>Project</span>
          <span style={chip}>{assetOf(row)}</span>
          <span style={chip}>{statusOf(row)}</span>
          {signalId ? <span style={chip}>Signal linked</span> : null}
        </div>

        <h3 className="vf-card-title">{titleOf(row)}</h3>
        <p style={{ ...muted, marginTop: 0 }}>{noteOf(row)}</p>

        <DetailGrid row={row} />

        <section className="vf-routing-box">
          <div style={{ ...label, fontSize: 11 }}>AI Routing Context</div>
          <p style={{ ...muted, margin: "8px 0 0" }}>{routingSummary(row)}</p>
          {missing.length ? (
            <p style={{ color: "#f8e7b0", margin: "10px 0 0", fontWeight: 850 }}>
              Missing for stronger routing: {missing.join(", ")}.
            </p>
          ) : null}
        </section>

        <div style={{ marginTop: 12 }}>
          {id ? <span style={chip}>ID: {id}</span> : null}
          {signalId ? <span style={chip}>Signal: {signalId}</span> : null}
          <span style={chip}>Market: {marketOf(row)}</span>
          {owner ? <span style={chip}>Owner: {owner}</span> : null}
        </div>

        <div className="vf-actions">
          <Link href={contactHref} style={button}>
            Contact Owner
          </Link>
          {signalId ? (
            <Link href={`/routing-room/${encodeURIComponent(signalId)}`} style={ghost}>
              Routing Room
            </Link>
          ) : null}
          {id ? (
            <Link href={`/deal/detail?id=${encodeURIComponent(id)}`} style={ghost}>
              Deal Detail
            </Link>
          ) : null}
          <button type="button" onClick={() => onHide(key)} style={dangerGhost}>
            Hide From View
          </button>
        </div>
      </div>
    </article>
  );
}

function loadHiddenKeys(email: string) {
  if (typeof window === "undefined") return new Set<string>();

  try {
    const raw = window.localStorage.getItem(`vf_projects_hidden_${email || "unknown"}`);
    const parsed = raw ? JSON.parse(raw) : [];
    return new Set<string>(Array.isArray(parsed) ? parsed.map(clean).filter(Boolean) : []);
  } catch {
    return new Set<string>();
  }
}

function saveHiddenKeys(email: string, keys: Set<string>) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(
      `vf_projects_hidden_${email || "unknown"}`,
      JSON.stringify(Array.from(keys))
    );
  } catch {
    // Non-critical local preference only.
  }
}

export default function ProjectsPage() {
  const [email, setEmail] = useState("");
  const [items, setItems] = useState<Row[]>([]);
  const [hiddenKeys, setHiddenKeys] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState("Loading projects...");

  async function load() {
    const viewer = getEmail();
    const owner = viewer === OWNER_EMAIL;
    const ownerFlag = owner ? "1" : "0";

    setEmail(viewer);
    setHiddenKeys(loadHiddenKeys(viewer));
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
      setStatus(unique.length ? "" : "No projects found yet.");
    } catch (error: any) {
      setStatus(error?.message || "Could not load projects.");
      setItems([]);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const visibleItems = useMemo(() => {
    return items.filter((item) => !hiddenKeys.has(canonicalKey(item)));
  }, [items, hiddenKeys]);

  const counts = useMemo(() => {
    const withPhotos = visibleItems.filter((item) => photosOf(item).length).length;
    const routed = visibleItems.filter((item) => signalIdOf(item)).length;
    const hidden = items.length - visibleItems.length;

    return {
      total: visibleItems.length,
      withPhotos,
      routed,
      hidden,
    };
  }, [items, visibleItems]);

  function hideProject(key: string) {
    const next = new Set(hiddenKeys);
    next.add(key);
    setHiddenKeys(next);
    saveHiddenKeys(email, next);
  }

  function restoreHidden() {
    const next = new Set<string>();
    setHiddenKeys(next);
    saveHiddenKeys(email, next);
  }

  return (
    <main style={page}>
      <style>{`
        .vf-metrics {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
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
          overflow: hidden;
        }

        .vf-project-photo-box {
          position: relative;
          width: 100%;
          height: 170px;
          border-radius: 20px;
          overflow: hidden;
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

        .vf-detail-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(132px, 1fr));
          gap: 10px;
          margin-top: 14px;
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

        @media (max-width: 880px) {
          .vf-metrics {
            grid-template-columns: 1fr 1fr;
          }

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

          <h1
            style={{
              fontSize: "clamp(48px,9vw,92px)",
              lineHeight: 0.9,
              letterSpacing: "-.07em",
              margin: "12px 0 18px",
            }}
          >
            Projects.
          </h1>

          <p style={{ ...muted, fontSize: 20, maxWidth: 900 }}>
            Clean opportunity review for submitted projects, deal rooms, photos, pricing,
            routing context, and owner contact. Pain records stay out of this page.
          </p>

          <div style={{ marginTop: 16 }}>
            <span style={chip}>Signed in: {email || "unknown"}</span>
            <span style={chip}>{email === OWNER_EMAIL ? "Owner View" : "Member View"}</span>
            <span style={chip}>Visible Projects: {counts.total}</span>
            <span style={chip}>Routed: {counts.routed}</span>
            <span style={chip}>With Photos: {counts.withPhotos}</span>
            {counts.hidden ? <span style={chip}>Hidden Locally: {counts.hidden}</span> : null}
          </div>

          <div className="vf-actions">
            <Link href="/dashboard" style={ghost}>
              Dashboard
            </Link>
            <Link href="/submit" style={button}>
              Create Deal
            </Link>
            <Link href="/pain-feed" style={ghost}>
              Pain Feed
            </Link>
            <button type="button" onClick={load} style={ghost}>
              Refresh
            </button>
            {counts.hidden ? (
              <button type="button" onClick={restoreHidden} style={ghost}>
                Restore Hidden
              </button>
            ) : null}
          </div>
        </section>

        <section className="vf-metrics">
          <Metric label="Projects" value={String(counts.total)} />
          <Metric label="Routed" value={String(counts.routed)} />
          <Metric label="With Photos" value={String(counts.withPhotos)} />
          <Metric label="Hidden" value={String(counts.hidden)} />
        </section>

        <section style={shell}>
          <div style={label}>Project Queue</div>

          <h2 style={{ fontSize: "clamp(34px,6vw,54px)", lineHeight: 1, margin: "10px 0 18px", letterSpacing: "-.05em" }}>
            Opportunity cards.
          </h2>

          {visibleItems.length ? (
            <div style={{ display: "grid", gap: 14 }}>
              {visibleItems.map((item, index) => (
                <ProjectCard
                  key={first(field(item, "canonical_event_id"), idOf(item), signalIdOf(item), String(index))}
                  row={item}
                  viewer={email}
                  onHide={hideProject}
                />
              ))}
            </div>
          ) : (
            <div style={panel}>
              <h3 style={{ marginTop: 0 }}>No projects connected yet.</h3>

              <p style={muted}>{status}</p>

              <div className="vf-actions">
                <Link href="/submit" style={button}>
                  Create Deal
                </Link>
                <Link href="/pain-feed" style={ghost}>
                  Pain Feed
                </Link>
                <Link href="/dashboard" style={ghost}>
                  Dashboard
                </Link>
                {counts.hidden ? (
                  <button type="button" onClick={restoreHidden} style={ghost}>
                    Restore Hidden
                  </button>
                ) : null}
              </div>
            </div>
          )}
        </section>

        {status && visibleItems.length ? <section style={shell}>{status}</section> : null}
      </div>
    </main>
  );
}
