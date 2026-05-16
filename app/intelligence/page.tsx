"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import VaultForgeMemberNav from "../components/VaultForgeMemberNav";

type Signal = Record<string, any>;

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

async function safeJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

function meta(row: Signal) {
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

function idOf(row: Signal) {
  const m = meta(row);
  return first(row.id, row.signal_id, row.item_id, row.deal_id, row.pain_id, m.id, m.signal_id, m.item_id, m.deal_id, m.pain_id);
}

function titleOf(row: Signal) {
  const m = meta(row);
  return first(row.title, row.signal_title, row.deal_title, row.pain_title, row.project_title, row.headline, row.name, row.address, m.title, m.signal_title, m.deal_title, m.pain_title, "VaultForge Signal");
}

function typeOf(row: Signal) {
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
    meta(row).signal_type,
    meta(row).source,
  ]
    .map(lower)
    .join(" ");

  if (text.includes("pain") || text.includes("pressure")) return "pressure";
  return "opportunity";
}

function strengthOf(row: Signal) {
  const m = meta(row);
  const raw = Number(first(row.opportunity_strength, row.strength, row.score, row.confidence_score, m.opportunity_strength, m.strength, m.score, m.confidence_score));
  if (Number.isFinite(raw) && raw > 0) return Math.max(0, Math.min(100, Math.round(raw)));
  return typeOf(row) === "pressure" ? 70 : 40;
}

function labelOf(row: Signal) {
  const m = meta(row);
  return first(row.ai_label, row.label, row.classification, row.risk_label, m.ai_label, m.label, m.classification, typeOf(row) === "pressure" ? "Pressure Signal" : "Trap Risk");
}

function strategyOf(row: Signal) {
  const m = meta(row);
  return first(row.strategy, row.recommendation, row.ai_recommendation, m.strategy, m.recommendation, m.ai_recommendation, "Rewrite pricing or terms");
}

function summaryOf(row: Signal) {
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
    m.description,
    m.route_summary,
    "VaultForge Intelligence Room classified this signal and prepared it for controlled room routing."
  );
}

function bestMove(row: Signal) {
  const m = meta(row);
  return first(row.best_move, row.next_best_move, m.best_move, m.next_best_move, "Rewrite structure before broad exposure.");
}

function worstMove(row: Signal) {
  const m = meta(row);
  return first(row.worst_move, row.risk_warning, m.worst_move, m.risk_warning, "Publicly blasting weak or unverified opportunity data.");
}

function roomHref(row: Signal) {
  const id = idOf(row);
  if (!id) return "/dashboard";

  if (typeOf(row) === "pressure") return `/pain-room/${encodeURIComponent(id)}`;
  return `/signals/${encodeURIComponent(id)}`;
}

function normalizeSignals(data: any) {
  const rows = [
    ...(Array.isArray(data.signals) ? data.signals : []),
    ...(Array.isArray(data.items) ? data.items : []),
    ...(Array.isArray(data.feed) ? data.feed : []),
    ...(Array.isArray(data.results) ? data.results : []),
    ...(Array.isArray(data.rows) ? data.rows : []),
    ...(Array.isArray(data.data) ? data.data : []),
    ...(Array.isArray(data.opportunities) ? data.opportunities : []),
    ...(Array.isArray(data.pains) ? data.pains : []),
    ...(Array.isArray(data.deals) ? data.deals : []),
  ];

  if (!rows.length && data && typeof data === "object" && !Array.isArray(data)) {
    const single = data.signal || data.item || data.record || data.deal || data.pain;
    if (single) rows.push(single);
  }

  const byKey = new Map<string, Signal>();
  rows.forEach((row: Signal, index: number) => {
    const key = idOf(row) || `${titleOf(row)}-${index}`;
    byKey.set(key, row);
  });

  return Array.from(byKey.values());
}

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(232,196,107,.14), transparent 28%), radial-gradient(circle at 86% 12%, rgba(168,85,247,.14), transparent 30%), linear-gradient(180deg,#020303,#071326 55%,#020303)",
  color: "white",
  padding: "22px 16px 96px",
  fontFamily: "Arial, sans-serif",
};

const wrap: React.CSSProperties = {
  width: "min(1180px,100%)",
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
};

const ghost: React.CSSProperties = {
  ...button,
  background: "rgba(255,255,255,.06)",
  border: "1px solid rgba(255,255,255,.16)",
  color: "white",
};

const pill: React.CSSProperties = {
  border: "1px solid rgba(86,216,255,.24)",
  borderRadius: 999,
  padding: "8px 11px",
  color: "#56d8ff",
  background: "rgba(86,216,255,.07)",
  fontWeight: 900,
  fontSize: 13,
  display: "inline-flex",
};

function SignalCard({ row }: { row: Signal }) {
  const strength = strengthOf(row);
  const type = typeOf(row);
  const barColor = type === "pressure" ? "#fca5a5" : "#56d8ff";

  return (
    <article style={card}>
      <div style={label}>{type === "pressure" ? "Pressure Intelligence" : "Opportunity Intelligence"}</div>

      <h2 style={{ fontSize: "clamp(34px,5vw,54px)", lineHeight: .95, letterSpacing: "-.045em", margin: "10px 0 10px" }}>
        {titleOf(row)}
      </h2>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
        <span style={{ ...pill, color: type === "pressure" ? "#fecaca" : "#9df3bf", borderColor: type === "pressure" ? "rgba(248,113,113,.24)" : "rgba(157,243,191,.24)", background: type === "pressure" ? "rgba(248,113,113,.06)" : "rgba(157,243,191,.06)" }}>
          {labelOf(row)}
        </span>
        <span style={{ ...pill, color: "#f8e7b0", borderColor: "rgba(232,196,107,.24)", background: "rgba(232,196,107,.06)" }}>
          Strategy: {strategyOf(row)}
        </span>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", marginBottom: 6 }}>
        <strong style={{ fontSize: 13 }}>{type === "pressure" ? "Pressure Strength" : "Opportunity Strength"}</strong>
        <strong style={{ fontSize: 13 }}>{strength}%</strong>
      </div>

      <div style={{ height: 10, borderRadius: 999, background: "rgba(255,255,255,.12)", overflow: "hidden", marginBottom: 14 }}>
        <div style={{ width: `${strength}%`, height: "100%", borderRadius: 999, background: `linear-gradient(90deg,#fb7185,${barColor})` }} />
      </div>

      <p style={{ ...muted, marginTop: 0 }}>
        {summaryOf(row)}
      </p>

      <section
        style={{
          border: "1px solid rgba(255,255,255,.10)",
          borderRadius: 18,
          padding: 14,
          background: "rgba(255,255,255,.035)",
          marginTop: 14,
        }}
      >
        <strong style={{ color: "#9df3bf" }}>Best Move</strong>
        <p style={{ ...muted, margin: "6px 0 12px" }}>{bestMove(row)}</p>

        <strong style={{ color: "#fecaca" }}>Worst Move</strong>
        <p style={{ ...muted, margin: "6px 0 0" }}>{worstMove(row)}</p>
      </section>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 16 }}>
        <Link href={roomHref(row)} style={button}>Open Room</Link>
        <Link href="/dashboard" style={ghost}>Exit</Link>
      </div>
    </article>
  );
}

export default function IntelligencePage() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [desk, setDesk] = useState("active");
  const [status, setStatus] = useState("Loading intelligence desk...");

  useEffect(() => {
    async function loadSignals() {
      const email = getEmail();

      const endpoints = [
        `/api/intelligence/feed?email=${encodeURIComponent(email)}&owner=0`,
        `/api/signals?email=${encodeURIComponent(email)}&owner=0`,
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
          const rows = normalizeSignals(data);

          if (response.ok && rows.length) {
            setSignals(rows);
            setStatus("");
            return;
          }
        } catch {
          // Try next.
        }
      }

      setSignals([]);
      setStatus("No intelligence signals found yet. Submit an opportunity or pain item to generate intelligence.");
    }

    loadSignals();
  }, []);

  const counts = useMemo(() => {
    const pressure = signals.filter((row) => typeOf(row) === "pressure").length;
    const opportunity = signals.filter((row) => typeOf(row) !== "pressure").length;
    return { pressure, opportunity, total: signals.length };
  }, [signals]);

  const filtered = useMemo(() => {
    if (desk === "removed") return [];
    if (desk === "pressure") return signals.filter((row) => typeOf(row) === "pressure");
    if (desk === "opportunity") return signals.filter((row) => typeOf(row) !== "pressure");
    return signals;
  }, [signals, desk]);

  return (
    <main style={page}>
      <style>{`
        a:hover, button:hover {
          transform: translateY(-1px);
          transition: all .18s ease;
          filter: brightness(1.06);
        }

        @media(max-width:760px) {
          .vf-grid {
            grid-template-columns: 1fr !important;
          }

          .vf-actions {
            display: grid !important;
            grid-template-columns: 1fr !important;
          }

          .vf-actions > * {
            width: 100%;
            box-sizing: border-box;
          }
        }
      `}</style>

      <div style={wrap}>
        <VaultForgeMemberNav
          title="Intelligence"
          subtitle="Institutional intelligence layer for pressure, opportunity, signal, and routing review."
          active="intelligence"
        />

        <section style={card}>
          <div style={label}>VaultForge Intelligence Room</div>
          <h1
            style={{
              fontSize: "clamp(56px,11vw,116px)",
              lineHeight: 0.86,
              letterSpacing: "-.075em",
              margin: "12px 0 18px",
            }}
          >
            Intelligence.
          </h1>

          <p style={{ ...muted, fontSize: 20, marginTop: 0 }}>
            This is the institutional intelligence layer. VaultForge classifies pressure, rewrites opportunities, diagnoses weak structures, scores risk, and routes operator intelligence into one command layer.
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 14, margin: "18px 0" }}>
            <strong style={{ color: "#9df3bf", fontSize: 22 }}>Pressure Signals: {counts.pressure}</strong>
            <strong style={{ color: "#f8e7b0", fontSize: 22 }}>Opportunity Signals: {counts.opportunity}</strong>
          </div>

          <div className="vf-actions" style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            <button type="button" onClick={() => setDesk("active")} style={desk === "active" ? button : ghost}>Active Desk ({counts.total})</button>
            <button type="button" onClick={() => setDesk("removed")} style={desk === "removed" ? button : ghost}>Removed (0)</button>
            <Link href="/dashboard" style={ghost}>Command</Link>
            <Link href="/opportunity-rooms" style={ghost}>Opportunity Rooms</Link>
            <Link href="/pressure-rooms" style={ghost}>Pressure Rooms</Link>
            <Link href="/dashboard" style={button}>Exit</Link>
          </div>
        </section>

        {status ? (
          <section style={card}>
            <p style={{ ...muted, margin: 0 }}>{status}</p>
            <div className="vf-actions" style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 14 }}>
              <Link href="/submit" style={button}>Submit Opportunity</Link>
              <Link href="/pain" style={button}>Submit Pain</Link>
              <Link href="/dashboard" style={ghost}>Exit</Link>
            </div>
          </section>
        ) : null}

        <section className="vf-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 18 }}>
          {filtered.map((row, index) => (
            <SignalCard key={`${idOf(row) || titleOf(row)}-${index}`} row={row} />
          ))}
        </section>
      </div>
    </main>
  );
}
