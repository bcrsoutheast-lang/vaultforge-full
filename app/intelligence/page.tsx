"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import VaultForgeMemberNav from "../components/VaultForgeMemberNav";

type Row = Record<string, any>;

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

function signalIdOf(row: Row) {
  const m = meta(row);
  return first(row.signal_id, row.signalId, row.id, m.signal_id);
}

function itemIdOf(row: Row) {
  const m = meta(row);
  return first(row.item_id, row.itemId, row.pain_id, row.deal_id, row.project_id, m.item_id, m.pain_id, m.deal_id, m.project_id);
}

function titleOf(row: Row) {
  const m = meta(row);
  return first(row.title, row.signal_title, row.pain_title, row.alert_title, row.subject, m.title, m.signal_title, m.pain_title, "VaultForge Intelligence");
}

function noteOf(row: Row) {
  const m = meta(row);
  return first(row.ai_summary, row.summary, row.note, row.notes, row.description, row.message, row.route_summary, m.ai_summary, m.summary, m.note, m.notes, m.description, m.message, m.route_summary, "Intelligence record ready for review.");
}

function urgencyOf(row: Row) {
  const m = meta(row);
  return first(row.urgency, row.urgency_level, row.priority, m.urgency, m.urgency_level, m.priority, "Normal");
}

function marketOf(row: Row) {
  const m = meta(row);
  const city = first(row.city, m.city);
  const state = first(row.state, row.operating_state, row.market, m.state, m.operating_state, m.market);
  return [city, state].filter(Boolean).join(", ") || state || first(row.location, m.location, "Market not listed");
}

function assetOf(row: Row) {
  const m = meta(row);
  return first(row.asset_type, row.property_type, m.asset_type, m.property_type, "Asset");
}

function sourceOf(row: Row) {
  const m = meta(row);
  return first(row.source, row.source_table, row.event_type, row.type, m.source, m.source_table, m.event_type, m.type, "Signal");
}

function ownerOf(row: Row) {
  const m = meta(row);
  return cleanEmail(first(row.owner_email, row.member_email, row.submitted_by_email, row.created_by_email, m.owner_email, m.member_email, m.submitted_by_email, m.created_by_email));
}

function photosOf(row: Row) {
  const m = meta(row);
  const values = [
    row.image_url,
    row.photo_url,
    row.primary_photo_url,
    m.image_url,
    m.photo_url,
    ...(Array.isArray(row.photo_urls) ? row.photo_urls : []),
    ...(Array.isArray(row.photos) ? row.photos : []),
    ...(Array.isArray(m.photo_urls) ? m.photo_urls : []),
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
  let score = Number(row.priority_score || row.confidence_score || row.match_score || m.priority_score || m.confidence_score || m.match_score || 0);

  if (!Number.isFinite(score) || score <= 0) score = 56;

  const urgency = urgencyOf(row).toLowerCase();
  if (urgency.includes("emergency")) score += 22;
  else if (urgency.includes("urgent") || urgency.includes("high")) score += 14;

  if (photosOf(row).length) score += 5;
  if (ownerOf(row)) score += 5;
  if (marketOf(row) !== "Market not listed") score += 5;

  return Math.min(100, Math.max(0, Math.round(score)));
}

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(232,196,107,.14), transparent 28%), radial-gradient(circle at 88% 10%, rgba(56,189,248,.12), transparent 26%), radial-gradient(circle at 52% 45%, rgba(157,243,191,.07), transparent 24%), linear-gradient(180deg,#020303,#071326 55%,#020303)",
  color: "white",
  padding: "22px 16px 96px",
  fontFamily: "Arial, sans-serif",
};

const wrap: React.CSSProperties = {
  width: "min(1220px,100%)",
  margin: "0 auto",
};

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

const muted: React.CSSProperties = {
  color: "#cbd5e1",
  lineHeight: 1.55,
};

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

function IntelligenceCard({ row, viewer }: { row: Row; viewer: string }) {
  const signalId = signalIdOf(row);
  const itemId = itemIdOf(row);
  const photos = photosOf(row);
  const owner = ownerOf(row);
  const score = scoreOf(row);

  const messageHref = signalId
    ? `/connect/${encodeURIComponent(signalId)}?email=${encodeURIComponent(viewer)}${itemId ? `&item_id=${encodeURIComponent(itemId)}` : ""}${owner ? `&to=${encodeURIComponent(owner)}` : ""}&source=intelligence`
    : "/messages";

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
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photos[0]} alt="Intelligence asset" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          ) : (
            <div style={{ height: 150, display: "grid", placeItems: "center", color: "#94a3b8", fontWeight: 850, textAlign: "center" }}>
              Intelligence<br />Record
            </div>
          )}
        </div>

        <div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span style={chip}>{sourceOf(row)}</span>
            <span style={{ ...chip, color: "#ffd0d0", borderColor: "rgba(248,113,113,.28)", background: "rgba(248,113,113,.08)" }}>
              {urgencyOf(row)}
            </span>
            <span style={{ ...chip, color: "#f8e7b0", borderColor: "rgba(232,196,107,.26)", background: "rgba(232,196,107,.08)" }}>
              Score {score}
            </span>
            <span style={{ ...chip, color: "#8fd3ff", borderColor: "rgba(56,189,248,.28)", background: "rgba(56,189,248,.08)" }}>
              {assetOf(row)}
            </span>
          </div>

          <h3 style={{ fontSize: 30, lineHeight: 1.02, margin: "14px 0 10px" }}>{titleOf(row)}</h3>
          <p style={muted}>{noteOf(row)}</p>

          <div style={{ marginTop: 12 }}>
            {signalId ? <span style={chip}>Signal: {signalId}</span> : null}
            {itemId ? <span style={chip}>Item: {itemId}</span> : null}
            <span style={chip}>Market: {marketOf(row)}</span>
            {owner ? <span style={chip}>Owner: {owner}</span> : null}
          </div>

          <div className="vf-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
            {signalId ? <Link href={`/signals/${encodeURIComponent(signalId)}`} style={button}>Open Signal</Link> : null}
            {signalId ? <Link href={`/routing-room/${encodeURIComponent(signalId)}`} style={ghost}>Routing Room</Link> : null}
            <Link href={messageHref} style={ghost}>Message Owner</Link>
            <Link href="/activity" style={ghost}>Activity</Link>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function IntelligencePage() {
  const [email, setEmail] = useState("");
  const [items, setItems] = useState<Row[]>([]);
  const [status, setStatus] = useState("Loading intelligence desk...");

  async function load() {
    const viewer = getEmail();
    setEmail(viewer);
    setStatus("Loading intelligence desk...");

    try {
      const urls = [
        `/api/intelligence/feed?email=${encodeURIComponent(viewer)}&owner=0`,
        `/api/pain/feed?email=${encodeURIComponent(viewer)}&owner=0`,
        `/api/routing/actions?email=${encodeURIComponent(viewer)}&owner=0`,
      ];

      const collected: Row[] = [];

      for (const url of urls) {
        try {
          const res = await fetch(url, {
            cache: "no-store",
            headers: { "x-vf-email": viewer || "", "x-vf-admin": "0" },
          });

          const data = await safeJson(res);
          const list = [
            ...(Array.isArray(data.intelligence) ? data.intelligence : []),
            ...(Array.isArray(data.signals) ? data.signals : []),
            ...(Array.isArray(data.pains) ? data.pains : []),
            ...(Array.isArray(data.actions) ? data.actions : []),
            ...(Array.isArray(data.items) ? data.items : []),
            ...(Array.isArray(data.data) ? data.data : []),
          ];

          collected.push(...list);
        } catch {
          // keep other feeds loading
        }
      }

      const seen = new Set<string>();
      const unique = collected.filter((item) => {
        const key = first(signalIdOf(item), itemIdOf(item), item.id, titleOf(item) + noteOf(item));
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      setItems(unique);
      setStatus(unique.length ? "" : "No intelligence records connected yet.");
    } catch (error: any) {
      setStatus(error?.message || "Could not load intelligence desk.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  const counts = useMemo(() => {
    const urgent = items.filter((item) => {
      const u = urgencyOf(item).toLowerCase();
      return u.includes("urgent") || u.includes("high") || u.includes("emergency");
    }).length;

    const routed = items.filter((item) => sourceOf(item).toLowerCase().includes("routing") || sourceOf(item).toLowerCase().includes("route")).length;
    const withPhotos = items.filter((item) => photosOf(item).length).length;

    return { total: items.length, urgent, routed, withPhotos };
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
          .vf-actions,
          article > div {
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
        }
      `}</style>

      <div style={wrap}>
        <VaultForgeMemberNav
          title="Intelligence"
          subtitle="Private real estate intelligence desk for signals, pressure, routing, pain, and execution."
          active="intelligence"
        />

        <section style={card}>
          <div style={eyebrow}>VaultForge Intelligence Desk</div>
          <h1 style={{ fontSize: "clamp(52px,10vw,96px)", lineHeight: 0.88, letterSpacing: "-.07em", margin: "12px 0 18px" }}>
            Market command.
          </h1>
          <p style={{ ...muted, fontSize: 20, maxWidth: 980 }}>
            This is the intelligence layer: active pressure, pain signals, routing movement,
            owner contact, member fit, and execution opportunity.
          </p>

          <div style={{ marginTop: 16 }}>
            <span style={chip}>Signed in: {email || "unknown"}</span>
            <span style={chip}>Records: {counts.total}</span>
            <span style={chip}>Urgent: {counts.urgent}</span>
            <span style={chip}>Routed: {counts.routed}</span>
          </div>

          <div className="vf-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 20 }}>
            <Link href="/dashboard" style={ghost}>Dashboard</Link>
            <Link href="/signals" style={button}>Signals</Link>
            <Link href="/pain-feed" style={ghost}>Pain Feed</Link>
            <Link href="/routing-inbox" style={ghost}>Routing</Link>
            <button type="button" onClick={load} style={ghost}>Refresh</button>
          </div>
        </section>

        <section className="vf-four" style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 16, marginBottom: 18 }}>
          <Metric label="Records" value={String(counts.total)} tone="blue" />
          <Metric label="Urgent" value={String(counts.urgent)} tone="red" />
          <Metric label="Routed" value={String(counts.routed)} tone="gold" />
          <Metric label="With Photos" value={String(counts.withPhotos)} tone="green" />
        </section>

        <section style={card}>
          <div style={eyebrow}>Intelligence Queue</div>
          <h2 style={{ fontSize: 42, lineHeight: 1, margin: "10px 0 18px" }}>What the network should watch.</h2>

          {items.length ? (
            <div style={{ display: "grid", gap: 14 }}>
              {items.map((item, index) => (
                <IntelligenceCard key={clean(item.id) || `${signalIdOf(item)}-${index}`} row={item} viewer={email} />
              ))}
            </div>
          ) : (
            <div style={glass}>
              <h3 style={{ marginTop: 0 }}>No intelligence records yet.</h3>
              <p style={muted}>
                Submit Pain, create signals, route records, or open activity to feed this command layer.
              </p>
              <div className="vf-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
                <Link href="/pain" style={button}>Submit Pain</Link>
                <Link href="/signals" style={ghost}>Signals</Link>
              </div>
            </div>
          )}
        </section>

        {status ? <section style={card}>{status}</section> : null}
      </div>
    </main>
  );
}
