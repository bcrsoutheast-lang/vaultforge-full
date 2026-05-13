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
  return first(row.title, row.alert_title, row.signal_title, row.subject, m.title, m.alert_title, m.signal_title, "VaultForge Alert");
}

function noteOf(row: Row) {
  const m = meta(row);
  return first(row.note, row.notes, row.summary, row.description, row.message, row.route_summary, m.note, m.notes, m.summary, m.description, m.message, m.route_summary, "Alert ready for review.");
}

function urgencyOf(row: Row) {
  const m = meta(row);
  return first(row.urgency, row.priority, row.urgency_level, m.urgency, m.priority, m.urgency_level, "Normal");
}

function statusOf(row: Row) {
  const m = meta(row);
  return first(row.status, row.alert_status, row.routing_status, m.status, m.alert_status, m.routing_status, "Active");
}

function ownerOf(row: Row) {
  const m = meta(row);
  return cleanEmail(first(row.owner_email, row.member_email, row.submitted_by_email, row.created_by_email, row.recipient_email, row.target_email, m.owner_email, m.member_email, m.submitted_by_email, m.created_by_email, m.recipient_email, m.target_email));
}

function marketOf(row: Row) {
  const m = meta(row);
  const city = first(row.city, m.city);
  const state = first(row.state, row.market, row.operating_state, m.state, m.market, m.operating_state);
  return [city, state].filter(Boolean).join(", ") || state || first(row.location, m.location, "Market not listed");
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
  let score = Number(row.priority_score || row.confidence_score || row.match_score || m.priority_score || m.confidence_score || 0);

  if (!Number.isFinite(score) || score <= 0) score = 55;

  const urgency = urgencyOf(row).toLowerCase();
  if (urgency.includes("emergency")) score += 20;
  else if (urgency.includes("high") || urgency.includes("urgent")) score += 14;

  if (ownerOf(row)) score += 5;
  if (photosOf(row).length) score += 5;
  if (marketOf(row) !== "Market not listed") score += 5;

  return Math.min(100, Math.max(0, Math.round(score)));
}

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(232,196,107,.14), transparent 28%), radial-gradient(circle at 88% 10%, rgba(248,113,113,.10), transparent 26%), linear-gradient(180deg,#020303,#071326 55%,#020303)",
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

function Metric({ label, value, tone }: { label: string; value: string; tone: "red" | "gold" | "green" | "blue" }) {
  const color = tone === "red" ? "#f87171" : tone === "green" ? "#4ade80" : tone === "blue" ? "#38bdf8" : "#e8c46b";

  return (
    <div style={glass}>
      <div style={{ color, fontWeight: 950, letterSpacing: ".14em", textTransform: "uppercase", fontSize: 12 }}>
        {label}
      </div>
      <div style={{ fontSize: 52, fontWeight: 1000, lineHeight: 1, marginTop: 12 }}>{value}</div>
    </div>
  );
}

function AlertCard({ row, viewer }: { row: Row; viewer: string }) {
  const signalId = signalIdOf(row);
  const itemId = itemIdOf(row);
  const owner = ownerOf(row);
  const score = scoreOf(row);
  const photos = photosOf(row);
  const urgency = urgencyOf(row);
  const alertIdentity = signalId || itemId || titleOf(row);

  /*
    Critical fix:
    Alert messages must pass source/folder/type/thread_key into the messaging pipeline.
    Without these params, the message saves as general and never lands in the Alerts inbox lane.
  */
  const connectHref = signalId
    ? `/connect/${encodeURIComponent(signalId)}?source=alert&type=alert&folder=alerts&folder_key=alerts&email=${encodeURIComponent(viewer)}${owner ? `&to=${encodeURIComponent(owner)}` : ""}${itemId ? `&item_id=${encodeURIComponent(itemId)}` : ""}&title=${encodeURIComponent(titleOf(row))}&subject=${encodeURIComponent(titleOf(row))}&thread_key=${encodeURIComponent(`alert:${alertIdentity}__${owner || "bcrsoutheast@gmail.com"}__${viewer || "member@vaultforge.local"}`)}`
    : `/messages/new?source=alert&type=alert&folder=alerts&folder_key=alerts&email=${encodeURIComponent(viewer)}${owner ? `&to=${encodeURIComponent(owner)}` : ""}&title=${encodeURIComponent(titleOf(row))}&subject=${encodeURIComponent(titleOf(row))}&thread_key=${encodeURIComponent(`alert:${alertIdentity}__${owner || "bcrsoutheast@gmail.com"}__${viewer || "member@vaultforge.local"}`)}`;

  return (
    <article style={glass}>
      <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: 18 }}>
        <div
          style={{
            borderRadius: 20,
            overflow: "hidden",
            border: "1px solid rgba(232,196,107,.18)",
            background: "rgba(0,0,0,.20)",
            minHeight: 140,
          }}
        >
          {photos[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photos[0]} alt="Alert asset" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          ) : (
            <div style={{ height: 140, display: "grid", placeItems: "center", color: "#94a3b8", fontWeight: 850 }}>
              No photo
            </div>
          )}
        </div>

        <div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span style={{ ...chip, color: "#ffd0d0", borderColor: "rgba(248,113,113,.28)", background: "rgba(248,113,113,.08)" }}>
              {urgency}
            </span>
            <span style={chip}>Score {score}</span>
            <span style={{ ...chip, color: "#f8e7b0", borderColor: "rgba(232,196,107,.26)", background: "rgba(232,196,107,.08)" }}>
              {statusOf(row)}
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
            <Link href={connectHref} style={button}>Message Owner</Link>
            {signalId ? <Link href={`/signals/${encodeURIComponent(signalId)}`} style={ghost}>Open Signal</Link> : null}
            {signalId ? <Link href={`/routing-room/${encodeURIComponent(signalId)}`} style={ghost}>Routing Room</Link> : null}
            <Link
              href={`/alert-action/need-more-info?source=alert&type=alert&folder=alerts&folder_key=alerts&signal=${encodeURIComponent(signalId || itemId || titleOf(row))}&title=${encodeURIComponent(titleOf(row))}&thread_key=${encodeURIComponent(`alert:${alertIdentity}__${owner || "bcrsoutheast@gmail.com"}__${viewer || "member@vaultforge.local"}`)}`}
              style={ghost}
            >
              Need More Info
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function AlertsPage() {
  const [email, setEmail] = useState("");
  const [items, setItems] = useState<Row[]>([]);
  const [status, setStatus] = useState("Loading alerts...");

  async function load() {
    const viewer = getEmail();
    const owner = viewer === "bcrsoutheast@gmail.com";
    const ownerFlag = owner ? "1" : "0";

    setEmail(viewer);
    setStatus("Loading alerts...");

    try {
      const urls = [
        `/api/deal/feed?email=${encodeURIComponent(viewer)}&owner=${ownerFlag}`,
        `/api/pain/feed?email=${encodeURIComponent(viewer)}&owner=${ownerFlag}`,
        `/api/routing/actions?email=${encodeURIComponent(viewer)}&owner=${ownerFlag}`,
      ];

      const collected: Row[] = [];

      for (const url of urls) {
        try {
          const res = await fetch(url, {
            cache: "no-store",
            credentials: "include",
            headers: { "x-vf-email": viewer || "", "x-vf-admin": ownerFlag },
          });

          const data = await safeJson(res);
          collected.push(
            ...(Array.isArray(data.deals) ? data.deals : []),
            ...(Array.isArray(data.projects) ? data.projects : []),
            ...(Array.isArray(data.items) ? data.items : []),
            ...(Array.isArray(data.alerts) ? data.alerts : []),
            ...(Array.isArray(data.signals) ? data.signals : []),
            ...(Array.isArray(data.pains) ? data.pains : []),
            ...(Array.isArray(data.actions) ? data.actions : []),
            ...(Array.isArray(data.data) ? data.data : [])
          );
        } catch {
          // Try next source.
        }
      }

      const byKey = new Map<string, Row>();

      for (const item of collected) {
        const m = meta(item);
        const canonical =
          first(
            item.canonical_event_id,
            m.canonical_event_id,
            item.signal_id,
            m.signal_id,
            item.deal_id,
            m.deal_id,
            item.pain_id,
            m.pain_id,
            item.item_id,
            m.item_id,
            titleOf(item)
          ) || titleOf(item);

        const existing = byKey.get(canonical);

        if (!existing) {
          byKey.set(canonical, item);
          continue;
        }

        const existingScore =
          (existing.source_table === "vf_deals" || existing._source_table === "vf_deals" ? 100 : 0) +
          (noteOf(existing) !== "Alert ready for review." ? 10 : 0) +
          (photosOf(existing).length ? 5 : 0);

        const itemScore =
          (item.source_table === "vf_deals" || item._source_table === "vf_deals" ? 100 : 0) +
          (noteOf(item) !== "Alert ready for review." ? 10 : 0) +
          (photosOf(item).length ? 5 : 0);

        byKey.set(canonical, itemScore > existingScore ? item : existing);
      }

      const unique = Array.from(byKey.values());

      setItems(unique);
      setStatus(unique.length ? "" : "No alerts connected yet.");
    } catch (error: any) {
      setStatus(error?.message || "Could not load alerts.");
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

    const routed = items.filter((item) => statusOf(item).toLowerCase().includes("route")).length;
    const withOwner = items.filter((item) => ownerOf(item)).length;

    return {
      total: items.length,
      urgent,
      routed,
      withOwner,
    };
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
          title="Alerts"
          subtitle="Urgent opportunities, signal pressure, next actions, and controlled owner follow-up."
          active="alerts"
        />

        <section style={card}>
          <div style={eyebrow}>VaultForge Alert Desk</div>
          <h1 style={{ fontSize: "clamp(52px,10vw,96px)", lineHeight: 0.88, letterSpacing: "-.07em", margin: "12px 0 18px" }}>
            Alert intelligence.
          </h1>
          <p style={{ ...muted, fontSize: 20, maxWidth: 980 }}>
            Alerts surface the records that need attention: urgent pain, buyer/capital requests,
            routing movement, and owner/member follow-up.
          </p>

          <div style={{ marginTop: 16 }}>
            <span style={chip}>Signed in: {email || "unknown"}</span>
            <span style={chip}>Live Alerts: {counts.total}</span>
            <span style={chip}>Urgent: {counts.urgent}</span>
            <span style={chip}>Owner Ready: {counts.withOwner}</span>
          </div>

          <div className="vf-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 20 }}>
            <Link href="/dashboard" style={ghost}>Dashboard</Link>
            <Link href="/pain-feed" style={ghost}>Pain Feed</Link>
            <Link href="/signals" style={ghost}>Signals</Link>
            <Link href="/messages" style={ghost}>Messages</Link>
            <button type="button" onClick={load} style={button}>Refresh</button>
          </div>
        </section>

        <section className="vf-four" style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 16, marginBottom: 18 }}>
          <Metric label="Active Alerts" value={String(counts.total)} tone="blue" />
          <Metric label="Urgent" value={String(counts.urgent)} tone="red" />
          <Metric label="Routed" value={String(counts.routed)} tone="gold" />
          <Metric label="Owner Ready" value={String(counts.withOwner)} tone="green" />
        </section>

        <section style={card}>
          <div style={eyebrow}>Priority Queue</div>
          <h2 style={{ fontSize: 42, lineHeight: 1, margin: "10px 0 18px" }}>Alerts needing action.</h2>

          {items.length ? (
            <div style={{ display: "grid", gap: 14 }}>
              {items.map((item, index) => (
                <AlertCard key={clean(item.id) || `${signalIdOf(item)}-${index}`} row={item} viewer={email} />
              ))}
            </div>
          ) : (
            <div style={glass}>
              <h3 style={{ marginTop: 0 }}>No live alerts yet.</h3>
              <p style={muted}>
                When pain submissions, signals, or routing pressure need action, they will appear here.
              </p>
              <div className="vf-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
                <Link href="/pain" style={button}>Submit Pain</Link>
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
