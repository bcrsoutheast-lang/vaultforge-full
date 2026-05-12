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
  return first(row.title, row.event_title, row.signal_title, row.alert_title, row.subject, m.title, m.event_title, m.signal_title, "VaultForge Activity");
}

function noteOf(row: Row) {
  const m = meta(row);
  return first(row.note, row.notes, row.summary, row.description, row.message, row.body, row.route_summary, m.note, m.notes, m.summary, m.description, m.message, m.route_summary, "Activity record ready for review.");
}

function eventTypeOf(row: Row) {
  const m = meta(row);
  return first(row.event_type, row.type, row.action, row.source, m.event_type, m.type, m.action, "activity");
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

function urgencyOf(row: Row) {
  const m = meta(row);
  return first(row.urgency, row.priority, row.urgency_level, m.urgency, m.priority, m.urgency_level, "Normal");
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

  if (!Number.isFinite(score) || score <= 0) score = 50;

  const urgency = urgencyOf(row).toLowerCase();
  if (urgency.includes("emergency")) score += 22;
  else if (urgency.includes("high") || urgency.includes("urgent")) score += 14;

  if (ownerOf(row)) score += 5;
  if (photosOf(row).length) score += 5;
  if (marketOf(row) !== "Market not listed") score += 5;

  return Math.min(100, Math.max(0, Math.round(score)));
}

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(232,196,107,.14), transparent 28%), radial-gradient(circle at 88% 10%, rgba(74,222,128,.10), transparent 26%), linear-gradient(180deg,#020303,#071326 55%,#020303)",
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

function ActivityCard({ row, viewer }: { row: Row; viewer: string }) {
  const signalId = signalIdOf(row);
  const itemId = itemIdOf(row);
  const photos = photosOf(row);
  const score = scoreOf(row);
  const owner = ownerOf(row);
  const type = eventTypeOf(row);

  const connectHref = signalId
    ? `/connect/${encodeURIComponent(signalId)}?email=${encodeURIComponent(viewer)}${itemId ? `&item_id=${encodeURIComponent(itemId)}` : ""}`
    : "/messages";

  return (
    <article style={glass}>
      <div style={{ display: "grid", gridTemplateColumns: "150px 1fr", gap: 18 }}>
        <div
          style={{
            borderRadius: 20,
            overflow: "hidden",
            border: "1px solid rgba(232,196,107,.18)",
            background: "rgba(0,0,0,.20)",
            minHeight: 138,
          }}
        >
          {photos[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photos[0]} alt="Activity asset" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          ) : (
            <div style={{ height: 138, display: "grid", placeItems: "center", color: "#94a3b8", fontWeight: 850 }}>
              No photo
            </div>
          )}
        </div>

        <div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span style={chip}>{type.replace(/_/g, " ")}</span>
            <span style={{ ...chip, color: "#f8e7b0", borderColor: "rgba(232,196,107,.26)", background: "rgba(232,196,107,.08)" }}>
              Score {score}
            </span>
            <span style={{ ...chip, color: "#8fd3ff", borderColor: "rgba(56,189,248,.28)", background: "rgba(56,189,248,.08)" }}>
              {marketOf(row)}
            </span>
          </div>

          <h3 style={{ fontSize: 30, lineHeight: 1.02, margin: "14px 0 10px" }}>{titleOf(row)}</h3>
          <p style={muted}>{noteOf(row)}</p>

          <div style={{ marginTop: 12 }}>
            {signalId ? <span style={chip}>Signal: {signalId}</span> : null}
            {itemId ? <span style={chip}>Item: {itemId}</span> : null}
            {owner ? <span style={chip}>Owner: {owner}</span> : null}
          </div>

          <div className="vf-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
            <Link href={connectHref} style={button}>Contact Owner</Link>
            {signalId ? <Link href={`/signals/${encodeURIComponent(signalId)}`} style={ghost}>Open Signal</Link> : null}
            {signalId ? <Link href={`/routing-room/${encodeURIComponent(signalId)}`} style={ghost}>Routing Room</Link> : null}
            <Link href="/messages" style={ghost}>Messages</Link>
          </div>
        </div>
      </div>
    </article>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone: "gold" | "green" | "blue" | "red" }) {
  const color = tone === "blue" ? "#38bdf8" : tone === "green" ? "#4ade80" : tone === "red" ? "#f87171" : "#e8c46b";

  return (
    <section style={glass}>
      <div style={{ color, fontWeight: 950, letterSpacing: ".14em", textTransform: "uppercase", fontSize: 12 }}>
        {label}
      </div>
      <div style={{ fontSize: 52, fontWeight: 1000, lineHeight: 1, marginTop: 12 }}>{value}</div>
    </section>
  );
}

export default function ActivityPage() {
  const [email, setEmail] = useState("");
  const [items, setItems] = useState<Row[]>([]);
  const [status, setStatus] = useState("Loading activity...");

  async function load() {
    const viewer = getEmail();
    setEmail(viewer);
    setStatus("Loading activity...");

    try {
      const urls = [
        `/api/pain/feed?email=${encodeURIComponent(viewer)}&owner=0`,
        `/api/routing/actions?email=${encodeURIComponent(viewer)}&owner=0`,
        `/api/routing/introductions?email=${encodeURIComponent(viewer)}&owner=0`,
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
            ...(Array.isArray(data.activity) ? data.activity : []),
            ...(Array.isArray(data.events) ? data.events : []),
            ...(Array.isArray(data.pains) ? data.pains : []),
            ...(Array.isArray(data.actions) ? data.actions : []),
            ...(Array.isArray(data.introductions) ? data.introductions : []),
            ...(Array.isArray(data.data) ? data.data : []),
          ];

          collected.push(...list);
        } catch {
          // Keep loading other feeds.
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
      setStatus(unique.length ? "" : "No activity records connected yet.");
    } catch (error: any) {
      setStatus(error?.message || "Could not load activity.");
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

    const routed = items.filter((item) => eventTypeOf(item).toLowerCase().includes("route") || eventTypeOf(item).toLowerCase().includes("intro")).length;
    const ownerReady = items.filter((item) => ownerOf(item)).length;

    return { total: items.length, urgent, routed, ownerReady };
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
          title="Activity"
          subtitle="Execution tape, signal movement, owner contact, and next-step activity."
          active="activity"
        />

        <section style={card}>
          <div style={eyebrow}>VaultForge Execution Tape</div>
          <h1 style={{ fontSize: "clamp(52px,10vw,96px)", lineHeight: 0.88, letterSpacing: "-.07em", margin: "12px 0 18px" }}>
            Activity intelligence.
          </h1>
          <p style={{ ...muted, fontSize: 20, maxWidth: 980 }}>
            Every pain signal, route, introduction, and follow-up should leave a visible operational trail.
          </p>

          <div style={{ marginTop: 16 }}>
            <span style={chip}>Signed in: {email || "unknown"}</span>
            <span style={chip}>Records: {counts.total}</span>
            <span style={chip}>Urgent: {counts.urgent}</span>
            <span style={chip}>Routed: {counts.routed}</span>
          </div>

          <div className="vf-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 20 }}>
            <Link href="/dashboard" style={ghost}>Dashboard</Link>
            <Link href="/signals" style={ghost}>Signals</Link>
            <Link href="/routing-inbox" style={ghost}>Routing</Link>
            <Link href="/messages" style={ghost}>Messages</Link>
            <button type="button" onClick={load} style={button}>Refresh</button>
          </div>
        </section>

        <section className="vf-four" style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 16, marginBottom: 18 }}>
          <Metric label="Activity" value={String(counts.total)} tone="blue" />
          <Metric label="Urgent" value={String(counts.urgent)} tone="red" />
          <Metric label="Routed" value={String(counts.routed)} tone="gold" />
          <Metric label="Owner Ready" value={String(counts.ownerReady)} tone="green" />
        </section>

        <section style={card}>
          <div style={eyebrow}>Operational Timeline</div>
          <h2 style={{ fontSize: 42, lineHeight: 1, margin: "10px 0 18px" }}>What moved.</h2>

          {items.length ? (
            <div style={{ display: "grid", gap: 14 }}>
              {items.map((item, index) => (
                <ActivityCard key={clean(item.id) || `${signalIdOf(item)}-${index}`} row={item} viewer={email} />
              ))}
            </div>
          ) : (
            <div style={glass}>
              <h3 style={{ marginTop: 0 }}>No activity yet.</h3>
              <p style={muted}>
                When Pain, Signals, Routing, Introductions, or Messages create movement,
                they will show here as a clean execution tape.
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
