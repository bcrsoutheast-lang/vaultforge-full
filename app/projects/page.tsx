"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import VaultForgeMemberNav from "../components/VaultForgeMemberNav";

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

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

function meta(row: Row) {
  return typeof row?.metadata === "object" && row.metadata ? row.metadata : {};
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

function list(value: unknown) {
  if (Array.isArray(value)) return value.map(clean).filter(Boolean);

  const text = clean(value);
  if (!text) return [];

  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return parsed.map(clean).filter(Boolean);
  } catch {
    // Continue.
  }

  return text
    .split(/[,\n|;]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function money(value: unknown) {
  const text = clean(value);
  if (!text) return "Not listed";

  const n = Number(text.replace(/[^\d.-]/g, ""));
  if (!Number.isFinite(n)) return text;

  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function idOf(row: Row) {
  const m = meta(row);
  return first(row.id, row.deal_id, row.project_id, row.item_id, row.itemId, m.id, m.deal_id, m.project_id, m.item_id);
}

function signalIdOf(row: Row) {
  const m = meta(row);
  return first(row.signal_id, row.signalId, m.signal_id);
}

function titleOf(row: Row) {
  const m = meta(row);
  return first(row.title, row.project_title, row.deal_title, row.name, row.address, m.title, m.project_title, m.name, m.address, "VaultForge Workstation");
}

function noteOf(row: Row) {
  const m = meta(row);
  return first(
    row.ai_route_summary,
    row.route_summary,
    row.routing_summary,
    row.summary,
    row.description,
    row.notes,
    row.note,
    row.strategy_notes,
    row.message,
    m.ai_route_summary,
    m.route_summary,
    m.summary,
    m.description,
    m.notes,
    m.note,
    m.strategy_notes,
    "Workstation ready for review."
  );
}

function statusOf(row: Row) {
  const m = meta(row);
  return first(row.status, row.project_status, row.stage, row.routing_status, m.status, m.project_status, m.stage, "Open");
}

function assetOf(row: Row) {
  const m = meta(row);
  return first(row.asset_type, row.property_type, row.deal_type, m.asset_type, m.property_type, "Asset");
}

function marketOf(row: Row) {
  const m = meta(row);
  const city = first(row.city, m.city);
  const state = first(row.state, row.market, row.operating_state, m.state, m.market, m.operating_state);
  return [city, state].filter(Boolean).join(", ") || state || first(row.location, m.location, "Market not listed");
}

function ownerOf(row: Row) {
  const m = meta(row);
  return cleanEmail(first(row.owner_email, row.member_email, row.user_email, row.submitted_by_email, row.created_by_email, m.owner_email, m.member_email, m.user_email, m.submitted_by_email, m.created_by_email));
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
    ...(Array.isArray(row.photo_urls) ? row.photo_urls : list(row.photo_urls)),
    ...(Array.isArray(row.photos) ? row.photos : []),
    ...(Array.isArray(m.photo_urls) ? m.photo_urls : list(m.photo_urls)),
    ...(Array.isArray(m.photos) ? m.photos : []),
  ];

  return Array.from(
    new Set(
      values
        .map((item: any) => {
          if (typeof item === "string") return clean(item);
          if (item && typeof item === "object") return clean(item.url || item.publicUrl || item.photo_url || item.image_url);
          return "";
        })
        .filter((url) => url.startsWith("http"))
    )
  );
}

function scoreOf(row: Row) {
  const m = meta(row);
  let score = Number(row.priority_score || row.execution_score || row.confidence_score || m.priority_score || m.execution_score || m.confidence_score || 0);

  if (!Number.isFinite(score) || score <= 0) score = 55;
  if (photosOf(row).length) score += 5;
  if (ownerOf(row)) score += 5;
  if (marketOf(row) !== "Market not listed") score += 5;
  if (statusOf(row).toLowerCase().includes("active")) score += 8;

  return Math.min(100, Math.max(0, Math.round(score)));
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
  background: "linear-gradient(145deg,rgba(255,255,255,.070),rgba(255,255,255,.030))",
  boxShadow: "0 28px 86px rgba(0,0,0,.30)",
  marginBottom: 18,
};

const glass: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.12)",
  borderRadius: 22,
  padding: 18,
  background: "rgba(255,255,255,.045)",
};

const eyebrow: React.CSSProperties = {
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

function Metric({ label, value, tone }: { label: string; value: string; tone: "blue" | "green" | "gold" | "red" }) {
  const color = tone === "blue" ? "#38bdf8" : tone === "green" ? "#4ade80" : tone === "red" ? "#f87171" : "#e8c46b";

  return (
    <section style={glass}>
      <div style={{ color, fontWeight: 950, letterSpacing: ".14em", textTransform: "uppercase", fontSize: 12 }}>{label}</div>
      <div style={{ fontSize: 52, fontWeight: 1000, lineHeight: 1, marginTop: 12 }}>{value}</div>
    </section>
  );
}

function ProjectCard({ row, viewer }: { row: Row; viewer: string }) {
  const projectId = idOf(row);
  const signalId = signalIdOf(row);
  const photos = photosOf(row);
  const owner = ownerOf(row);
  const score = scoreOf(row);
  const sourceTable = first(row.source_table, row._source_table, row.source);

  const isDeal = sourceTable === "vf_deals" || sourceTable === "api/deal/feed" || first(row.deal_id, row.price, row.asking_price, row.arv);
  const openHref = isDeal && projectId ? `/deal/detail?id=${encodeURIComponent(projectId)}` : signalId ? `/signals/${encodeURIComponent(signalId)}` : "/projects";

  const contactHref = signalId
    ? `/connect/${encodeURIComponent(signalId)}?email=${encodeURIComponent(viewer)}${projectId ? `&item_id=${encodeURIComponent(projectId)}` : ""}`
    : `/messages/new?email=${encodeURIComponent(viewer)}${projectId ? `&item_id=${encodeURIComponent(projectId)}` : ""}`;

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
            <img src={photos[0]} alt="Project asset" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          ) : (
            <div style={{ height: 150, display: "grid", placeItems: "center", color: "#94a3b8", fontWeight: 850 }}>
              No photo
            </div>
          )}
        </div>

        <div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span style={chip}>{assetOf(row)}</span>
            <span style={{ ...chip, color: "#f8e7b0", borderColor: "rgba(232,196,107,.26)", background: "rgba(232,196,107,.08)" }}>
              Score {score}
            </span>
            <span style={{ ...chip, color: "#8fd3ff", borderColor: "rgba(56,189,248,.28)", background: "rgba(56,189,248,.08)" }}>
              {statusOf(row)}
            </span>
            {isDeal ? <span style={{ ...chip, color: "#fca5a5", borderColor: "rgba(248,113,113,.28)", background: "rgba(248,113,113,.08)" }}>Deal</span> : <span style={chip}>Pain / Signal</span>}
          </div>

          <h3 style={{ fontSize: 30, lineHeight: 1.02, margin: "14px 0 10px" }}>{titleOf(row)}</h3>
          <p style={muted}>{noteOf(row)}</p>

          {isDeal ? (
            <div style={{ marginTop: 12 }}>
              <span style={chip}>Ask: {money(first(row.asking_price, row.price))}</span>
              <span style={chip}>ARV: {money(first(row.arv, row.arv_value, row.estimated_value))}</span>
              <span style={chip}>Repairs: {money(first(row.repair_estimate, row.repairs_needed, row.estimated_repairs))}</span>
            </div>
          ) : null}

          <div style={{ marginTop: 12 }}>
            {projectId ? <span style={chip}>ID: {projectId}</span> : null}
            {signalId ? <span style={chip}>Signal: {signalId}</span> : null}
            <span style={chip}>Market: {marketOf(row)}</span>
            {owner ? <span style={chip}>Owner: {owner}</span> : null}
          </div>

          <div className="vf-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
            <Link href={openHref} style={button}>{isDeal ? "Open Deal Detail" : "Open Signal"}</Link>
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
    setEmail(viewer);
    setStatus("Loading workstations...");

    try {
      const owner = viewer === OWNER_EMAIL;
      const ownerFlag = owner ? "1" : "0";

      const urls = [
        `/api/deal/feed?email=${encodeURIComponent(viewer)}&owner=${ownerFlag}`,
        `/api/pain/feed?email=${encodeURIComponent(viewer)}&owner=${ownerFlag}`,
      ];

      const collected: Row[] = [];

      for (const url of urls) {
        try {
          const res = await fetch(url, {
            cache: "no-store",
            credentials: "include",
            headers: {
              "x-vf-email": viewer || "",
              "x-vf-admin": ownerFlag,
            },
          });

          const data = await safeJson(res);
          const listItems = [
            ...(Array.isArray(data.deals) ? data.deals : []),
            ...(Array.isArray(data.projects) ? data.projects : []),
            ...(Array.isArray(data.items) ? data.items : []),
            ...(Array.isArray(data.pains) ? data.pains : []),
            ...(Array.isArray(data.signals) ? data.signals : []),
            ...(Array.isArray(data.data) ? data.data : []),
          ];

          collected.push(...listItems);
        } catch {
          // Keep fallback page alive.
        }
      }

      const seen = new Set<string>();
      const unique = collected.filter((item) => {
        const key = first(idOf(item), signalIdOf(item), titleOf(item) + noteOf(item));
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      setItems(unique);
      setStatus(unique.length ? "" : "No deal/pain workstations connected yet.");
    } catch (error: any) {
      setStatus(error?.message || "Could not load workstations.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  const counts = useMemo(() => {
    const active = items.filter((item) => !statusOf(item).toLowerCase().includes("archive") && !statusOf(item).toLowerCase().includes("closed")).length;
    const withPhotos = items.filter((item) => photosOf(item).length).length;
    const signalLinked = items.filter((item) => signalIdOf(item)).length;
    const deals = items.filter((item) => first(item.source_table, item._source_table, item.source) === "vf_deals" || first(item.deal_id, item.price, item.asking_price)).length;

    return { total: items.length, active, withPhotos, signalLinked, deals };
  }, [items]);

  return (
    <main style={page}>
      <style>{`
        a:hover, button:hover {
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

          article > div {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      <div style={wrap}>
        <VaultForgeMemberNav
          title="Projects"
          subtitle="Deal workstations, pain signals, routing context, execution status, and owner communication."
          active="projects"
        />

        <section style={card}>
          <div style={eyebrow}>VaultForge Project Desk</div>
          <h1 style={{ fontSize: "clamp(52px,10vw,96px)", lineHeight: 0.88, letterSpacing: "-.07em", margin: "12px 0 18px" }}>
            Workstations.
          </h1>
          <p style={{ ...muted, fontSize: 20, maxWidth: 980 }}>
            Deal and pain records now share one execution desk. Each card should show why it matters, pricing, routing context, photos, and next action.
          </p>

          <div style={{ marginTop: 16 }}>
            <span style={chip}>Signed in: {email || "unknown"}</span>
            <span style={chip}>{email === OWNER_EMAIL ? "Owner View" : "Member View"}</span>
            <span style={chip}>Workstations: {counts.total}</span>
            <span style={chip}>Deals: {counts.deals}</span>
            <span style={chip}>Active: {counts.active}</span>
            <span style={chip}>Signal Linked: {counts.signalLinked}</span>
          </div>

          <div className="vf-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 20 }}>
            <Link href="/dashboard" style={ghost}>Dashboard</Link>
            <Link href="/submit" style={button}>Create Deal</Link>
            <Link href="/pain" style={ghost}>Submit Pain</Link>
            <Link href="/signals" style={ghost}>Signals</Link>
            <Link href="/messages" style={ghost}>Messages</Link>
            <button type="button" onClick={load} style={ghost}>Refresh</button>
          </div>
        </section>

        <section className="vf-four" style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 16, marginBottom: 18 }}>
          <Metric label="Workstations" value={String(counts.total)} tone="blue" />
          <Metric label="Deals" value={String(counts.deals)} tone="green" />
          <Metric label="Signal Linked" value={String(counts.signalLinked)} tone="gold" />
          <Metric label="With Photos" value={String(counts.withPhotos)} tone="red" />
        </section>

        <section style={card}>
          <div style={eyebrow}>Project Queue</div>
          <h2 style={{ fontSize: 42, lineHeight: 1, margin: "10px 0 18px" }}>Clean workstations.</h2>

          {items.length ? (
            <div style={{ display: "grid", gap: 14 }}>
              {items.map((item, index) => (
                <ProjectCard key={clean(item.id) || `${idOf(item)}-${index}`} row={item} viewer={email} />
              ))}
            </div>
          ) : (
            <div style={glass}>
              <h3 style={{ marginTop: 0 }}>No deal/pain workstations connected yet.</h3>
              <p style={muted}>
                Workstations will appear here when Create Deal or Pain Button creates deal, pain, signal, routing, or intelligence records.
              </p>
              <div className="vf-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
                <Link href="/submit" style={button}>Create Deal</Link>
                <Link href="/pain" style={ghost}>Submit Pain</Link>
                <Link href="/signals" style={ghost}>Open Signals</Link>
              </div>
            </div>
          )}
        </section>

        {status ? <section style={card}>{status}</section> : null}
      </div>
    </main>
  );
}
