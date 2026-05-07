"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type RoutingRow = Record<string, any>;

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(181,92,255,.26), transparent 28%), radial-gradient(circle at top right, rgba(157,243,191,.18), transparent 24%), radial-gradient(circle at bottom right, rgba(232,196,107,.16), transparent 28%), linear-gradient(180deg,#02040a 0%,#071326 45%,#030509 100%)",
  color: "white",
  padding: "28px 18px 100px",
  fontFamily: "Arial, sans-serif",
};

const wrap: React.CSSProperties = { maxWidth: 1180, margin: "0 auto" };

const hero: React.CSSProperties = {
  border: "1px solid rgba(181,92,255,.34)",
  background:
    "linear-gradient(145deg, rgba(181,92,255,.16), rgba(157,243,191,.08), rgba(255,255,255,.03))",
  borderRadius: 34,
  padding: 26,
  marginBottom: 22,
};

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))",
  gap: 16,
};

const card: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.13)",
  background:
    "linear-gradient(145deg, rgba(181,92,255,.14), rgba(157,243,191,.06), rgba(255,255,255,.03))",
  borderRadius: 28,
  padding: 22,
  boxShadow: "0 26px 80px rgba(0,0,0,.34)",
};

const btn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "linear-gradient(135deg,#f5d978,#9df3bf 55%,#b55cff)",
  color: "#06100a",
  textDecoration: "none",
  borderRadius: 999,
  padding: "13px 18px",
  fontWeight: 950,
  border: "none",
  margin: "7px 7px 0 0",
  minHeight: 46,
  cursor: "pointer",
};

const ghost: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  color: "white",
  textDecoration: "none",
  borderRadius: 999,
  padding: "13px 18px",
  fontWeight: 900,
  border: "1px solid rgba(255,255,255,.16)",
  background: "linear-gradient(135deg, rgba(181,92,255,.18), rgba(255,255,255,.05))",
  margin: "7px 7px 0 0",
  minHeight: 46,
};

const eyebrow: React.CSSProperties = {
  color: "#b55cff",
  letterSpacing: 5,
  fontWeight: 950,
  fontSize: 12,
  marginBottom: 12,
  textTransform: "uppercase",
};

const greenEyebrow: React.CSSProperties = {
  ...eyebrow,
  color: "#9df3bf",
};

const muted: React.CSSProperties = {
  color: "rgba(255,255,255,.70)",
  lineHeight: 1.55,
};

const chip: React.CSSProperties = {
  display: "inline-flex",
  border: "1px solid rgba(157,243,191,.25)",
  color: "#9df3bf",
  background: "rgba(157,243,191,.07)",
  borderRadius: 999,
  padding: "8px 11px",
  fontWeight: 850,
  fontSize: 13,
  margin: "0 7px 7px 0",
};

function getEmail() {
  if (typeof window === "undefined") return "";
  return (
    localStorage.getItem("vf_email") ||
    sessionStorage.getItem("vf_email") ||
    ""
  )
    .trim()
    .toLowerCase();
}

function asText(value: unknown, fallback = "") {
  const text = String(value || "").trim();
  return text || fallback;
}

function asNumber(value: unknown) {
  const n = Number(value || 0);
  return Number.isFinite(n) ? n : 0;
}

function formatDate(value: unknown) {
  const text = asText(value);
  if (!text) return "";
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return text;
  return date.toLocaleString();
}

function boolLabel(value: unknown) {
  return value === true || String(value || "").toLowerCase() === "true";
}

function tagsList(row: RoutingRow) {
  if (Array.isArray(row.tags)) return row.tags.map(String).filter(Boolean);

  const raw = asText(row.tags);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
  } catch {
    // continue
  }

  return raw.split(",").map((item) => item.trim()).filter(Boolean);
}

function StatCard({ label, value, detail }: { label: string; value: number; detail: string }) {
  return (
    <div style={card}>
      <div style={greenEyebrow}>{label}</div>
      <div style={{ fontSize: 54, fontWeight: 950, lineHeight: 1 }}>{value}</div>
      <p style={muted}>{detail}</p>
    </div>
  );
}

function ScoreBar({ score }: { score: number }) {
  const width = Math.max(4, Math.min(100, score));

  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
        <strong style={{ color: "#9df3bf", letterSpacing: 3 }}>SCORE</strong>
        <strong style={{ color: "#f5d978" }}>{score}</strong>
      </div>
      <div style={{ height: 13, borderRadius: 999, background: "rgba(255,255,255,.10)", overflow: "hidden" }}>
        <div
          style={{
            height: "100%",
            width: `${width}%`,
            background: "linear-gradient(90deg,#9df3bf,#f5d978,#b55cff)",
          }}
        />
      </div>
    </div>
  );
}

export default function RoutingPage() {
  const [rows, setRows] = useState<RoutingRow[]>([]);
  const [status, setStatus] = useState("Loading routing signals...");

  async function load() {
    setStatus("Loading routing signals...");

    try {
      const email = getEmail();
      const res = await fetch(`/api/routing/list?email=${encodeURIComponent(email)}`, {
        cache: "no-store",
        headers: {
          "x-vf-email": email,
        },
      });

      const data = await res.json();

      if (!res.ok || data?.ok === false) {
        throw new Error(data?.error || data?.details || "Could not load routing signals.");
      }

      setRows(Array.isArray(data?.routing) ? data.routing : []);
      setStatus("");
    } catch (error: any) {
      setStatus(error?.message || "Could not load routing signals.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  const highScore = useMemo(
    () => rows.filter((row) => asNumber(row.match_score) >= 70).length,
    [rows]
  );

  const urgent = useMemo(
    () => rows.filter((row) => asNumber(row.urgency_score) >= 70).length,
    [rows]
  );

  const pending = useMemo(
    () => rows.filter((row) => asText(row.routing_status, "pending").toLowerCase() === "pending").length,
    [rows]
  );

  return (
    <main style={page}>
      <style>{`
        a:hover,
        button:hover {
          transform: translateY(-1px);
          transition: all .18s ease;
          filter: brightness(1.06);
        }

        @media (max-width: 760px) {
          a,
          button {
            width: 100%;
            box-sizing: border-box;
          }
        }
      `}</style>

      <div style={wrap}>
        <section style={hero}>
          <div style={eyebrow}>VaultForge Routing Brain</div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
            <span style={chip}>AI Routing</span>
            <span style={chip}>Match Logic</span>
            <span style={chip}>Urgency Score</span>
            <span style={chip}>Fit Detection</span>
          </div>

          <h1 style={{ fontSize: "clamp(56px,12vw,104px)", lineHeight: 0.88, margin: "0 0 18px" }}>
            Explainable routing signals.
          </h1>

          <p style={{ ...muted, fontSize: 21 }}>
            This feed reads from <strong>vf_routing_signals</strong>. It shows why VaultForge believes a deal,
            pain signal, member, lender, operator, investor, or contractor should be routed.
          </p>

          <Link href="/dashboard" style={ghost}>Dashboard</Link>
          <Link href="/pain" style={ghost}>Pain Feed</Link>
          <Link href="/pain-submit" style={btn}>Pain Button</Link>
          <Link href="/alerts" style={ghost}>Smart Alerts</Link>
          <button type="button" onClick={load} style={btn}>Refresh</button>
        </section>

        <section style={{ ...grid, marginBottom: 22 }}>
          <StatCard label="Total Signals" value={rows.length} detail="All routing records loaded." />
          <StatCard label="High Score" value={highScore} detail="Signals with match score 70+." />
          <StatCard label="Urgent" value={urgent} detail="Signals with urgency score 70+." />
          <StatCard label="Pending" value={pending} detail="Signals waiting to be routed." />
        </section>

        {status && <section style={hero}>{status}</section>}

        {!status && rows.length === 0 && (
          <section style={hero}>
            <strong>No routing signals yet.</strong>
            <p style={muted}>
              Submit a Pain Button signal or generate alerts to start creating routing intelligence.
            </p>
          </section>
        )}

        <section style={{ display: "grid", gap: 16 }}>
          {rows.map((row, index) => {
            const id = asText(row.id) || String(index);
            const tags = tagsList(row);
            const score = asNumber(row.match_score);
            const urgencyScore = asNumber(row.urgency_score);
            const marketScore = asNumber(row.market_score);
            const sourceType = asText(row.source_type, "routing_signal");
            const signalType = asText(row.signal_type, "Signal");
            const statusLabel = asText(row.routing_status, "pending");

            return (
              <article key={id} style={card}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                  <span style={{ ...chip, borderColor: "rgba(181,92,255,.45)", color: "#d9b8ff" }}>{sourceType}</span>
                  <span style={chip}>{signalType}</span>
                  <span style={chip}>{statusLabel}</span>
                  {boolLabel(row.investor_fit) && <span style={chip}>Investor Fit</span>}
                  {boolLabel(row.lender_fit) && <span style={chip}>Lender Fit</span>}
                  {boolLabel(row.operator_fit) && <span style={chip}>Operator Fit</span>}
                  {boolLabel(row.contractor_fit) && <span style={chip}>Contractor Fit</span>}
                </div>

                <div style={eyebrow}>Routing Explanation</div>
                <h2 style={{ fontSize: "clamp(32px,7vw,56px)", lineHeight: 1, margin: "0 0 12px" }}>
                  {asText(row.routing_reason, "VaultForge routing signal")}
                </h2>

                <p style={{ ...muted, fontSize: 20 }}>
                  {asText(row.ai_explanation, "No AI explanation saved yet.")}
                </p>

                <ScoreBar score={score} />

                <section style={{ ...grid, marginTop: 16 }}>
                  <StatCard label="Match Score" value={score} detail="Overall routing confidence." />
                  <StatCard label="Urgency" value={urgencyScore} detail="Time sensitivity / pressure level." />
                  <StatCard label="Market" value={marketScore} detail="Market or location fit score." />
                </section>

                {tags.length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <div style={greenEyebrow}>Routing Tags</div>
                    {tags.map((tag) => (
                      <span key={tag} style={chip}>{tag}</span>
                    ))}
                  </div>
                )}

                <div style={{ marginTop: 14 }}>
                  {row.deal_id && (
                    <Link href={`/deal/${encodeURIComponent(String(row.deal_id))}`} style={btn}>
                      Open Deal Room
                    </Link>
                  )}
                  <Link href="/pain" style={ghost}>Pain Feed</Link>
                  <Link href="/alerts" style={ghost}>Smart Alerts</Link>
                </div>

                <p style={{ ...muted, marginTop: 14 }}>
                  {formatDate(row.created_at)}
                </p>
              </article>
            );
          })}
        </section>
      </div>
    </main>
  );
}
