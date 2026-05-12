"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import VaultForgeMemberNav from "../../components/VaultForgeMemberNav";

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

function arr(value: unknown) {
  if (Array.isArray(value)) return value.map(clean).filter(Boolean);
  if (typeof value === "string") return value.split(/[,\n|]/).map(clean).filter(Boolean);
  return [];
}

function signalIdOf(row: Row, fallback = "") {
  const m = meta(row);
  return first(row.signal_id, row.signalId, row.id, m.signal_id, fallback);
}

function itemIdOf(row: Row) {
  const m = meta(row);
  return first(row.item_id, row.itemId, row.pain_id, row.deal_id, row.project_id, m.item_id, m.pain_id, m.deal_id, m.project_id);
}

function titleOf(row: Row) {
  const m = meta(row);
  return first(row.title, row.signal_title, row.event_title, row.alert_title, row.subject, m.title, m.signal_title, "Routing Room");
}

function summaryOf(row: Row) {
  const m = meta(row);
  return first(
    row.route_summary,
    row.routing_summary,
    row.summary,
    row.note,
    row.notes,
    row.description,
    m.route_summary,
    m.routing_summary,
    m.ai_summary,
    m.summary,
    m.note,
    "Routing room is ready for owner/member review."
  );
}

function ownerEmailOf(row: Row) {
  const m = meta(row);
  return cleanEmail(
    first(
      row.owner_email,
      row.submitted_by_email,
      row.created_by_email,
      row.member_email,
      row.target_email,
      row.recipient_email,
      m.owner_email,
      m.submitted_by_email,
      m.created_by_email,
      m.member_email,
      m.target_email,
      m.recipient_email
    )
  );
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

function derive(row: Row, fallbackSignalId: string) {
  const m = meta(row);
  const signalId = signalIdOf(row, fallbackSignalId);
  const itemId = itemIdOf(row);
  const assetType = first(row.asset_type, m.asset_type, "Asset");
  const state = first(row.state, row.market, row.operating_state, m.state, m.market, m.operating_state);
  const city = first(row.city, m.city);
  const urgency = first(row.priority, row.urgency, m.urgency, m.urgency_level, "Normal");
  const roleNeeded = first(row.role_needed, row.target_role, m.role_needed, m.target_role);
  const suggestedRoutes = arr(row.suggested_routes || m.suggested_routes || row.ai_tags || m.ai_tags || roleNeeded);
  const owner = ownerEmailOf(row);
  const scoreRaw = Number(row.confidence_score || row.match_score || row.priority_score || m.confidence_score || m.priority_score || 0);
  let score = Number.isFinite(scoreRaw) && scoreRaw > 0 ? scoreRaw : 62;

  if (urgency.toLowerCase().includes("high")) score += 12;
  if (urgency.toLowerCase().includes("emergency")) score += 20;
  if (owner) score += 5;
  if (state) score += 5;
  score = Math.min(100, Math.max(0, Math.round(score)));

  const lower = `${titleOf(row)} ${summaryOf(row)} ${roleNeeded} ${suggestedRoutes.join(" ")}`.toLowerCase();
  const routes = new Set(suggestedRoutes);

  if (lower.includes("buyer")) routes.add("Buyer");
  if (lower.includes("capital") || lower.includes("fund") || lower.includes("lender")) routes.add("Lender / Capital");
  if (lower.includes("contractor") || lower.includes("repair")) routes.add("Contractor / Operator");
  if (assetType.toLowerCase().includes("commercial")) routes.add("Commercial Buyer / Operator");
  if (assetType.toLowerCase().includes("land")) routes.add("Builder / Land Buyer");
  if (!routes.size) routes.add("Owner Review");

  const nextSteps = [
    "Confirm the signal details before exposing private contact information.",
    "Route only to members who match state, asset type, need, and execution capacity.",
    "Use controlled message first; release direct contact only after owner review.",
  ];

  if (routes.has("Buyer")) nextSteps.push("Send to buyer-fit members for acquisition interest.");
  if (routes.has("Lender / Capital")) nextSteps.push("Send to capital/lender members for funding review.");
  if (routes.has("Contractor / Operator")) nextSteps.push("Send to contractor/operator members for scope and execution review.");

  return {
    signalId,
    itemId,
    title: titleOf(row),
    summary: summaryOf(row),
    owner,
    assetType,
    state,
    city,
    location: [city, state].filter(Boolean).join(", ") || state || "Market not listed",
    urgency,
    score,
    status: first(row.routing_status, row.status, m.routing_status, m.status, "Generated"),
    roleNeeded: roleNeeded || Array.from(routes).join(", "),
    routes: Array.from(routes).slice(0, 7),
    nextSteps: Array.from(new Set(nextSteps)).slice(0, 7),
    photos: photosOf(row),
  };
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

function Info({ label, value }: { label: string; value: unknown }) {
  const text = clean(value);
  if (!text) return null;

  return (
    <div style={{ borderBottom: "1px solid rgba(255,255,255,.08)", padding: "10px 0" }}>
      <div style={{ color: "#94a3b8", fontSize: 12, textTransform: "uppercase", letterSpacing: ".12em", fontWeight: 900 }}>{label}</div>
      <div style={{ marginTop: 4, fontSize: 17, fontWeight: 850, overflowWrap: "anywhere" }}>{text}</div>
    </div>
  );
}

function Gauge({ score }: { score: number }) {
  return (
    <div>
      <div style={{ height: 14, borderRadius: 999, background: "rgba(255,255,255,.14)", overflow: "hidden", border: "1px solid rgba(255,255,255,.10)" }}>
        <div style={{ width: `${score}%`, height: "100%", background: "linear-gradient(90deg,#ff4d4d,#f8e7b0,#9df3bf,#38bdf8)" }} />
      </div>
    </div>
  );
}

export default function RoutingRoomPage({ params }: { params: { signalId: string } }) {
  const [email, setEmail] = useState("");
  const [row, setRow] = useState<Row | null>(null);
  const [status, setStatus] = useState("Loading routing room...");

  const signalId = decodeURIComponent(params.signalId || "");

  async function load() {
    const viewer = getEmail();
    setEmail(viewer);
    setStatus("Loading routing room...");

    try {
      const urls = [
        `/api/routing/actions?email=${encodeURIComponent(viewer)}&owner=0`,
        `/api/signals/${encodeURIComponent(signalId)}?email=${encodeURIComponent(viewer)}`,
        `/api/pain/feed?email=${encodeURIComponent(viewer)}&owner=0`,
      ];

      for (const url of urls) {
        try {
          const res = await fetch(url, {
            cache: "no-store",
            headers: { "x-vf-email": viewer || "", "x-vf-admin": "0" },
          });
          const data = await safeJson(res);

          const direct = data.action || data.signal || data.pain || data.record || data.data;
          const lists = [
            ...(Array.isArray(data.actions) ? data.actions : []),
            ...(Array.isArray(data.signals) ? data.signals : []),
            ...(Array.isArray(data.pains) ? data.pains : []),
            ...(Array.isArray(data.data) ? data.data : []),
          ];

          const candidates = direct && !Array.isArray(direct) ? [direct, ...lists] : lists;

          const match = candidates.find((item: Row) => {
            return (
              signalIdOf(item) === signalId ||
              itemIdOf(item) === signalId ||
              clean(item.id) === signalId ||
              clean(meta(item).signal_id) === signalId
            );
          });

          if (match) {
            setRow(match);
            setStatus("");
            return;
          }
        } catch {
          // Try next source.
        }
      }

      setRow({
        signal_id: signalId,
        title: "Routing Room",
        route_summary: "Routing room is open, but the connected routing record was not returned yet.",
        status: "pending",
        metadata: {},
      });
      setStatus("Routing source not found yet.");
    } catch (error: any) {
      setStatus(error?.message || "Could not load routing room.");
    }
  }

  useEffect(() => {
    load();
  }, [signalId]);

  const data = useMemo(() => derive(row || { signal_id: signalId }, signalId), [row, signalId]);

  const connectHref = data.signalId
    ? `/connect/${encodeURIComponent(data.signalId)}?email=${encodeURIComponent(email)}${data.itemId ? `&item_id=${encodeURIComponent(data.itemId)}` : ""}`
    : "/messages";

  return (
    <main style={page}>
      <style>{`
        a:hover, button:hover {
          transform: translateY(-1px);
          transition: all .18s ease;
          filter: brightness(1.06);
        }

        @media (max-width: 760px) {
          .vf-grid,
          .vf-two,
          .vf-three,
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
        }
      `}</style>

      <div style={wrap}>
        <VaultForgeMemberNav
          title="Routing Room"
          subtitle="Member-fit routing, controlled communication, and next execution step."
          active="routing"
        />

        <section style={card}>
          <div className="vf-two" style={{ display: "grid", gridTemplateColumns: "1.25fr .75fr", gap: 20, alignItems: "start" }}>
            <div>
              <div style={eyebrow}>VaultForge Routing Intelligence</div>
              <h1 style={{ fontSize: "clamp(50px,10vw,96px)", lineHeight: 0.88, letterSpacing: "-.07em", margin: "12px 0 18px" }}>
                Route with control.
              </h1>
              <h2 style={{ margin: "0 0 12px", fontSize: 34 }}>{data.title}</h2>
              <p style={{ ...muted, fontSize: 20 }}>{data.summary}</p>

              <div style={{ marginTop: 16 }}>
                <span style={chip}>Signal: {data.signalId || "pending"}</span>
                {data.itemId ? <span style={chip}>Item: {data.itemId}</span> : null}
                <span style={chip}>Status: {data.status}</span>
                <span style={chip}>Market: {data.location}</span>
              </div>
            </div>

            <div style={{ ...glass, background: "rgba(0,0,0,.20)" }}>
              <div style={eyebrow}>Routing Confidence</div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 10, marginTop: 14 }}>
                <div style={{ fontSize: 72, lineHeight: 1, fontWeight: 1000, color: "#f8e7b0" }}>{data.score}</div>
                <div style={{ color: "#cbd5e1", marginBottom: 10, fontWeight: 850 }}>/ 100</div>
              </div>
              <Gauge score={data.score} />
              <p style={{ ...muted, marginBottom: 0 }}>Based on urgency, route context, owner connection, market, and record completeness.</p>
            </div>
          </div>

          <div className="vf-actions" style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 20 }}>
            <Link href="/dashboard" style={ghost}>Dashboard</Link>
            <Link href={connectHref} style={button}>Message Owner</Link>
            <Link href={`/signals/${encodeURIComponent(data.signalId || signalId)}`} style={ghost}>Open Signal</Link>
            <Link href="/routing-inbox" style={ghost}>Routing Inbox</Link>
            <button type="button" onClick={load} style={ghost}>Refresh</button>
          </div>
        </section>

        <section className="vf-three" style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 18 }}>
          <section style={card}>
            <h2 style={{ marginTop: 0 }}>Suggested Member Type</h2>
            <div style={{ display: "grid", gap: 10 }}>
              {data.routes.map((route) => (
                <div key={route} style={{ ...glass, color: "#9df3bf", borderColor: "rgba(157,243,191,.22)" }}>
                  {route}
                </div>
              ))}
            </div>
          </section>

          <section style={card}>
            <h2 style={{ marginTop: 0 }}>Routing Reason</h2>
            <p style={{ ...muted, fontSize: 18 }}>
              Route is based on asset type, urgency, requested help, state/market fit, and member execution capability.
            </p>
            <Info label="Role Needed" value={data.roleNeeded} />
            <Info label="Urgency" value={data.urgency} />
            <Info label="Asset" value={data.assetType} />
          </section>

          <section style={card}>
            <h2 style={{ marginTop: 0 }}>Route Status</h2>
            <Info label="Current Status" value={data.status} />
            <Info label="Owner" value={data.owner || "Owner/submitter fallback"} />
            <Info label="Location" value={data.location} />
          </section>
        </section>

        <section style={card}>
          <div style={eyebrow}>Execution Next Step</div>
          <h2 style={{ fontSize: 42, lineHeight: 1, margin: "10px 0 16px" }}>Move without exposing private contact too early.</h2>

          <div className="vf-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 14 }}>
            {data.nextSteps.map((step, index) => (
              <div key={step} style={glass}>
                <strong style={{ color: "#f8e7b0" }}>{index + 1}. Step</strong>
                <p style={muted}>{step}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="vf-two" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
          <section style={card}>
            <h2 style={{ marginTop: 0 }}>Signal Context</h2>
            <Info label="Signal ID" value={data.signalId} />
            <Info label="Item ID" value={data.itemId} />
            <Info label="Asset Type" value={data.assetType} />
            <Info label="Market" value={data.location} />
          </section>

          <section style={card}>
            <h2 style={{ marginTop: 0 }}>Photos</h2>
            {data.photos.length ? (
              <div style={{ display: "grid", gap: 12 }}>
                {data.photos.slice(0, 2).map((url, index) => (
                  <div key={url} style={{ borderRadius: 20, overflow: "hidden", border: "1px solid rgba(232,196,107,.22)" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`Routing asset ${index + 1}`} style={{ width: "100%", height: 220, objectFit: "cover", display: "block" }} />
                  </div>
                ))}
              </div>
            ) : (
              <p style={muted}>No valid photos connected yet.</p>
            )}
          </section>
        </section>

        {status ? <section style={card}>{status}</section> : null}
      </div>
    </main>
  );
}
