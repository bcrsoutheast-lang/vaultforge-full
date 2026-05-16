"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import VaultForgeMemberNav from "../components/VaultForgeMemberNav";
import VaultForgeAlertBadge from "../components/VaultForgeAlertBadge";

type Item = Record<string, any>;

function clean(value: unknown) {
  return String(value || "").trim();
}

function lower(value: unknown) {
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

  const keys = ["vf_email", "vf_member_email", "memberEmail", "email"];

  for (const key of keys) {
    try {
      const localValue = clean(window.localStorage.getItem(key)).toLowerCase();
      if (localValue.includes("@")) return localValue;

      const sessionValue = clean(window.sessionStorage.getItem(key)).toLowerCase();
      if (sessionValue.includes("@")) return sessionValue;
    } catch {
      // Continue.
    }
  }

  const cookieValue = clean(readCookie("vf_email") || readCookie("vf_member_email")).toLowerCase();
  return cookieValue.includes("@") ? cookieValue : "";
}

function meta(row: Item) {
  return row && typeof row.metadata === "object" && row.metadata ? row.metadata : {};
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

function idOf(row: Item, index: number) {
  const m = meta(row);

  return first(
    row.id,
    row.signal_id,
    row.item_id,
    row.deal_id,
    row.pain_id,
    row.project_id,
    row.room_id,
    m.id,
    m.signal_id,
    m.item_id,
    m.deal_id,
    m.pain_id,
    `row-${index}`
  );
}

function titleOf(row: Item) {
  const m = meta(row);

  return first(
    row.title,
    row.signal_title,
    row.deal_title,
    row.pain_title,
    row.project_title,
    row.headline,
    row.address,
    row.name,
    m.title,
    m.signal_title,
    m.deal_title,
    m.pain_title,
    "VaultForge Match"
  );
}

function summaryOf(row: Item) {
  const m = meta(row);

  return first(
    row.summary,
    row.ai_summary,
    row.description,
    row.note,
    row.notes,
    row.route_summary,
    m.summary,
    m.ai_summary,
    m.route_summary,
    "VaultForge found a new routing or opportunity match for your member profile."
  );
}

function typeOf(row: Item) {
  const text = [
    row.type,
    row.signal_type,
    row.source,
    row.folder,
    row.room_type,
    row.problem_type,
    row.pain_type,
    row.category,
    meta(row).type,
    meta(row).source,
  ]
    .map(lower)
    .join(" ");

  if (text.includes("pain") || text.includes("pressure")) return "pressure";
  if (text.includes("routing") || text.includes("signal")) return "routing";
  return "opportunity";
}

function scoreOf(row: Item) {
  const m = meta(row);

  const raw = Number(
    first(
      row.match_score,
      row.score,
      row.confidence_score,
      row.priority_score,
      m.match_score,
      m.score,
      m.confidence_score,
      m.priority_score
    )
  );

  if (Number.isFinite(raw) && raw > 0) return Math.max(0, Math.min(100, Math.round(raw)));
  if (typeOf(row) === "pressure") return 84;
  return 76;
}

function roomHref(row: Item, index: number) {
  const id = idOf(row, index);
  const type = typeOf(row);

  if (!id) return "/dashboard";
  if (type === "pressure") return `/pain-room/${encodeURIComponent(id)}`;
  if (type === "routing") return `/routing-room/${encodeURIComponent(id)}`;
  return `/deal/detail?id=${encodeURIComponent(id)}`;
}

function normalizeRows(data: any) {
  const rows = [
    ...(Array.isArray(data.alerts) ? data.alerts : []),
    ...(Array.isArray(data.signals) ? data.signals : []),
    ...(Array.isArray(data.items) ? data.items : []),
    ...(Array.isArray(data.feed) ? data.feed : []),
    ...(Array.isArray(data.results) ? data.results : []),
    ...(Array.isArray(data.rows) ? data.rows : []),
    ...(Array.isArray(data.data) ? data.data : []),
    ...(Array.isArray(data.deals) ? data.deals : []),
    ...(Array.isArray(data.pains) ? data.pains : []),
  ];

  const byId = new Map<string, Item>();
  rows.forEach((row: Item, index: number) => byId.set(idOf(row, index), row));
  return Array.from(byId.values());
}

async function safeJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(232,196,107,.14), transparent 28%), radial-gradient(circle at 86% 12%, rgba(86,216,255,.10), transparent 30%), linear-gradient(180deg,#020303,#071326 55%,#020303)",
  color: "white",
  padding: "22px 16px 96px",
  fontFamily: "Arial, sans-serif",
};

const wrap: React.CSSProperties = {
  width: "min(1180px,100%)",
  margin: "0 auto",
};

const panel: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.22)",
  borderRadius: 30,
  padding: 22,
  background: "linear-gradient(145deg,rgba(255,255,255,.070),rgba(255,255,255,.030))",
  boxShadow: "0 28px 86px rgba(0,0,0,.30)",
};

const navCard: React.CSSProperties = {
  display: "block",
  border: "1px solid rgba(255,255,255,.10)",
  borderRadius: 24,
  padding: 22,
  minHeight: 126,
  textDecoration: "none",
  color: "white",
  background: "linear-gradient(145deg,rgba(255,255,255,.05),rgba(255,255,255,.025))",
};

const liveCard: React.CSSProperties = {
  border: "1px solid rgba(248,113,113,.22)",
  borderRadius: 24,
  padding: 20,
  background: "linear-gradient(145deg,rgba(248,113,113,.09),rgba(255,255,255,.025))",
  boxShadow: "0 0 0 0 rgba(248,113,113,.30)",
  animation: "vfPulse 1.5s ease-in-out infinite",
};

export default function DashboardPage() {
  const [alerts, setAlerts] = useState<Item[]>([]);
  const [status, setStatus] = useState("Loading live command feed...");

  useEffect(() => {
    async function loadFeed() {
      const email = getEmail();

      const endpoints = [
        `/api/alerts/feed?email=${encodeURIComponent(email)}&owner=0`,
        `/api/deal/feed?email=${encodeURIComponent(email)}&owner=0`,
        `/api/pain/feed?email=${encodeURIComponent(email)}&owner=0`,
        `/api/dashboard/live?email=${encodeURIComponent(email)}&owner=0`,
      ];

      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint, {
            cache: "no-store",
            credentials: "include",
            headers: {
              "x-vf-email": email,
              "x-vf-admin": "0",
            },
          });

          const data = await safeJson(response);
          const rows = normalizeRows(data);

          if (response.ok && rows.length) {
            setAlerts(rows.slice(0, 6));
            setStatus("");
            return;
          }
        } catch {
          // Try next.
        }
      }

      setAlerts([]);
      setStatus("No live operational alerts yet.");
    }

    loadFeed();
  }, []);

  const counts = useMemo(() => {
    return {
      total: alerts.length,
      pressure: alerts.filter((row) => typeOf(row) === "pressure").length,
      opportunity: alerts.filter((row) => typeOf(row) === "opportunity").length,
      routing: alerts.filter((row) => typeOf(row) === "routing").length,
    };
  }, [alerts]);

  return (
    <main style={page}>
      <style>{`
        @keyframes vfPulse {
          0% { box-shadow: 0 0 0 0 rgba(248,113,113,.35); }
          55% { box-shadow: 0 0 0 10px rgba(248,113,113,0); }
          100% { box-shadow: 0 0 0 0 rgba(248,113,113,0); }
        }

        a:hover, button:hover {
          transform: translateY(-1px);
          transition: all .18s ease;
          filter: brightness(1.05);
        }

        @media(max-width:760px) {
          .vf-grid,
          .vf-live-grid,
          .vf-alert-rooms {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      <div style={wrap}>
        <VaultForgeMemberNav
          title="Command Center"
          subtitle="Rooms, intelligence, routing, messaging, and live operational alerts."
          active="dashboard"
        />

        <section style={{ ...panel, marginBottom: 20 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 14,
              flexWrap: "wrap",
              marginBottom: 18,
            }}
          >
            <div>
              <div
                style={{
                  color: "#e8c46b",
                  letterSpacing: ".18em",
                  textTransform: "uppercase",
                  fontWeight: 950,
                  fontSize: 12,
                  marginBottom: 8,
                }}
              >
                VaultForge Command
              </div>

              <h1
                style={{
                  fontSize: "clamp(52px,10vw,104px)",
                  lineHeight: 0.88,
                  letterSpacing: "-.075em",
                  margin: 0,
                }}
              >
                Private market operating system.
              </h1>
            </div>

            <VaultForgeAlertBadge />
          </div>

          <p
            style={{
              color: "#cbd5e1",
              lineHeight: 1.6,
              fontSize: 20,
              marginTop: 0,
            }}
          >
            Opportunity Rooms, Pressure Rooms, intelligence routing, workstations,
            messaging, network, alert rooms, and live operational triggers operate inside one clean system.
          </p>

          <div
            className="vf-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2,minmax(0,1fr))",
              gap: 16,
              marginTop: 20,
            }}
          >
            <Link href="/opportunity-rooms" style={navCard}>
              <div style={{ color: "#e8c46b", letterSpacing: ".18em", textTransform: "uppercase", fontWeight: 950, fontSize: 12 }}>
                Upside
              </div>
              <div style={{ fontSize: 36, fontWeight: 900, marginTop: 12 }}>
                Opportunity Rooms
              </div>
            </Link>

            <Link href="/pressure-rooms" style={navCard}>
              <div style={{ color: "#fca5a5", letterSpacing: ".18em", textTransform: "uppercase", fontWeight: 950, fontSize: 12 }}>
                Fix
              </div>
              <div style={{ fontSize: 36, fontWeight: 900, marginTop: 12 }}>
                Pressure Rooms
              </div>
            </Link>

            <Link href="/intelligence" style={navCard}>
              <div style={{ color: "#56d8ff", letterSpacing: ".18em", textTransform: "uppercase", fontWeight: 950, fontSize: 12 }}>
                AI
              </div>
              <div style={{ fontSize: 36, fontWeight: 900, marginTop: 12 }}>
                Intelligence
              </div>
            </Link>

            <Link href="/message-command" style={navCard}>
              <div style={{ color: "#9df3bf", letterSpacing: ".18em", textTransform: "uppercase", fontWeight: 950, fontSize: 12 }}>
                Comms
              </div>
              <div style={{ fontSize: 36, fontWeight: 900, marginTop: 12 }}>
                Messages
              </div>
            </Link>
          </div>
        </section>

        <section style={{ ...panel, marginBottom: 20 }}>
          <div
            style={{
              color: "#e8c46b",
              letterSpacing: ".18em",
              textTransform: "uppercase",
              fontWeight: 950,
              fontSize: 12,
              marginBottom: 10,
            }}
          >
            Alert Rooms
          </div>

          <h2
            style={{
              fontSize: "clamp(42px,8vw,82px)",
              lineHeight: 0.9,
              letterSpacing: "-.06em",
              margin: "0 0 18px",
            }}
          >
            Alert command lanes.
          </h2>

          <div className="vf-alert-rooms" style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 12 }}>
            <Link href="/alerts?lane=new" style={navCard}>
              <strong>New Matches</strong>
              <p style={{ color: "#cbd5e1" }}>Unread triggers and fresh fits.</p>
            </Link>
            <Link href="/alerts?lane=opportunity" style={navCard}>
              <strong>Opportunity Alerts</strong>
              <p style={{ color: "#cbd5e1" }}>Buyer, capital, and deal matches.</p>
            </Link>
            <Link href="/alerts?lane=pressure" style={navCard}>
              <strong>Pressure Alerts</strong>
              <p style={{ color: "#cbd5e1" }}>Urgent pain and problem rooms.</p>
            </Link>
            <Link href="/alerts?lane=saved" style={navCard}>
              <strong>Saved Alerts</strong>
              <p style={{ color: "#cbd5e1" }}>Kept for later review.</p>
            </Link>
          </div>
        </section>

        <section style={panel}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
              marginBottom: 18,
            }}
          >
            <div>
              <div
                style={{
                  color: "#e8c46b",
                  letterSpacing: ".18em",
                  textTransform: "uppercase",
                  fontWeight: 950,
                  fontSize: 12,
                  marginBottom: 8,
                }}
              >
                Live Operational Alerts
              </div>

              <h2
                style={{
                  fontSize: "clamp(42px,8vw,82px)",
                  lineHeight: 0.9,
                  letterSpacing: "-.06em",
                  margin: 0,
                }}
              >
                Active matches.
              </h2>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <div style={{ border: "1px solid rgba(157,243,191,.22)", borderRadius: 999, padding: "10px 14px", color: "#9df3bf", background: "rgba(157,243,191,.06)", fontWeight: 900 }}>
                Opportunity: {counts.opportunity}
              </div>
              <div style={{ border: "1px solid rgba(248,113,113,.22)", borderRadius: 999, padding: "10px 14px", color: "#fecaca", background: "rgba(248,113,113,.06)", fontWeight: 900 }}>
                Pressure: {counts.pressure}
              </div>
              <div style={{ border: "1px solid rgba(86,216,255,.22)", borderRadius: 999, padding: "10px 14px", color: "#56d8ff", background: "rgba(86,216,255,.06)", fontWeight: 900 }}>
                Routing: {counts.routing}
              </div>
            </div>
          </div>

          {status ? (
            <div style={{ border: "1px solid rgba(255,255,255,.10)", borderRadius: 22, padding: 18, color: "#cbd5e1" }}>
              {status}
            </div>
          ) : null}

          <div className="vf-live-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 16 }}>
            {alerts.map((row, index) => {
              const score = scoreOf(row);
              return (
                <article key={`${idOf(row, index)}-${index}`} style={liveCard}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
                    <div style={{ border: "1px solid rgba(248,113,113,.22)", borderRadius: 999, padding: "8px 12px", color: "#fecaca", background: "rgba(248,113,113,.06)", fontWeight: 900, textTransform: "uppercase", fontSize: 12, letterSpacing: ".08em" }}>
                      {typeOf(row)}
                    </div>
                    <div style={{ border: "1px solid rgba(232,196,107,.22)", borderRadius: 999, padding: "8px 12px", color: "#f8e7b0", background: "rgba(232,196,107,.06)", fontWeight: 900 }}>
                      {score}% fit
                    </div>
                  </div>

                  <h3 style={{ fontSize: "clamp(28px,5vw,48px)", lineHeight: 0.95, letterSpacing: "-.04em", margin: "0 0 12px" }}>
                    {titleOf(row)}
                  </h3>

                  <p style={{ color: "#cbd5e1", lineHeight: 1.55, marginTop: 0 }}>
                    {summaryOf(row)}
                  </p>

                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
                    <Link href={roomHref(row, index)} style={{ display: "inline-flex", justifyContent: "center", alignItems: "center", minHeight: 44, borderRadius: 999, padding: "10px 16px", textDecoration: "none", fontWeight: 900, background: "linear-gradient(135deg,#f8e7b0,#e8c46b)", color: "#06100a" }}>
                      Open Room
                    </Link>

                    <Link href={`/alerts?lane=${encodeURIComponent(typeOf(row))}`} style={{ display: "inline-flex", justifyContent: "center", alignItems: "center", minHeight: 44, borderRadius: 999, padding: "10px 16px", textDecoration: "none", fontWeight: 900, background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.14)", color: "white" }}>
                      Alert Room
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
