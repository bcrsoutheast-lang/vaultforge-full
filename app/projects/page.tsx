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

  if (source.includes("deal") || field(row, "deal_id", "asking_price", "price", "arv", "arv_value", "repair_estimate", "repairs_needed")) return "deal";
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
    ["Ask", money(field(row, "asking_price", "price"))],
    ["ARV", money(field(row, "arv", "arv_value", "estimated_value"))],
    ["Repairs", money(field(row, "repair_estimate", "repairs_needed", "estimated_repairs"))],
    ["Beds/Baths", [field(row, "beds", "bedrooms"), field(row, "baths", "bathrooms")].filter(Boolean).join(" / ") || "Not listed"],
    ["Sqft/Acres", field(row, "square_feet", "sqft", "building_sqft", "acres", "land_acres") || "Not listed"],
    ["Strategy", field(row, "strategy", "exit_strategy") || "Not listed"],
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

  const openHref =
    source === "deal" && id
      ? `/deal/detail?id=${encodeURIComponent(id)}`
      : signalId
      ? `/signals/${encodeURIComponent(signalId)}`
      : id
      ? `/pain-room/${encodeURIComponent(id)}`
      : "/projects";

  const contactHref = signalId
    ? `/connect/${encodeURIComponent(signalId)}?email=${encodeURIComponent(viewer)}${id ? `&item_id=${encodeURIComponent(id)}` : ""}`
    : `/messages/new?email=${encodeURIComponent(viewer)}${id ? `&item_id=${encodeURIComponent(id)}` : ""}`;

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
            <img src={photos[0]} alt="Workstation" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
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
          <p style={muted}>{noteOf(row)}</p>

          {source === "deal" ? <DetailGrid row={row} /> : null}

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
            <Link href={openHref} style={button}>{source === "deal" ? "Open Deal Detail" : source === "pain" ? "Open Pain Room" : "Open Signal"}</Link>

            {signalId ? <Link href={`/routing-room/${encodeURIComponent(signalId)}`} style={ghost}>Routing Room</Link> : null}

            <Link href={contactHref} style={ghost}>Message Owner</Link>
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

      const seen = new Set<string>();
      const unique = collected.filter((item) => {
        const key = first(field(item, "canonical_event_id"), idOf(item), signalIdOf(item), titleOf(item) + noteOf(item));
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      });

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