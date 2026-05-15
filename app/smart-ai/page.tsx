"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import VaultForgeMemberNav from "../components/VaultForgeMemberNav";

export const dynamic = "force-dynamic";

type Insight = {
  id: string;
  kind: "deal" | "pain";
  title: string;
  market: string;
  score: number;
  priority: string;
  reasoning: string[];
  best_move: string;
  href: string;
  source_table: string;
};

type SmartData = {
  ok?: boolean;
  error?: string;
  profile?: Record<string, any>;
  counts?: Record<string, number>;
  insights?: Insight[];
  message?: string;
};

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

function currentEmail() {
  if (typeof window === "undefined") return "";

  try {
    return cleanEmail(
      window.localStorage.getItem("vf_email") ||
        window.sessionStorage.getItem("vf_email") ||
        readCookie("vf_email") ||
        readCookie("vf_admin_email")
    );
  } catch {
    return cleanEmail(readCookie("vf_email") || readCookie("vf_admin_email"));
  }
}

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(232,196,107,.16), transparent 28%), radial-gradient(circle at 84% 10%, rgba(74,222,128,.12), transparent 26%), radial-gradient(circle at 55% 70%, rgba(56,189,248,.10), transparent 28%), linear-gradient(180deg,#020303,#071326 55%,#020303)",
  color: "white",
  padding: "22px 16px 96px",
  fontFamily: "Arial, sans-serif",
};

const wrap: React.CSSProperties = {
  width: "min(1240px,100%)",
  margin: "0 auto",
};

const panel: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.24)",
  borderRadius: 30,
  padding: 24,
  background: "linear-gradient(145deg,rgba(255,255,255,.070),rgba(255,255,255,.030))",
  boxShadow: "0 28px 86px rgba(0,0,0,.30)",
  marginBottom: 18,
};

const card: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.12)",
  borderRadius: 24,
  padding: 20,
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
  cursor: "pointer",
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

function tone(score: number) {
  if (score >= 75) return "#9df3bf";
  if (score >= 55) return "#e8c46b";
  return "#8fd3ff";
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <section style={card}>
      <div style={eyebrow}>{label}</div>
      <div style={{ fontSize: 48, fontWeight: 1000, lineHeight: 1, marginTop: 12 }}>
        {value}
      </div>
    </section>
  );
}

function InsightCard({ item }: { item: Insight }) {
  const color = tone(item.score);

  return (
    <article style={{ ...card, borderColor: `${color}77` }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <div style={eyebrow}>{item.kind === "pain" ? "Pain Intelligence" : "Deal Intelligence"}</div>
          <h3 style={{ fontSize: 34, lineHeight: 1.02, margin: "8px 0" }}>{item.title}</h3>
          <p style={{ ...muted, margin: 0 }}>{item.market}</p>
        </div>

        <div style={{ border: `1px solid ${color}88`, borderRadius: 20, minWidth: 88, padding: 14, textAlign: "center", background: "rgba(0,0,0,.18)" }}>
          <div style={{ fontSize: 42, lineHeight: 1, fontWeight: 1000, color }}>{item.score}</div>
          <div style={{ color: "#cbd5e1", fontSize: 12, marginTop: 6, fontWeight: 850 }}>AI fit</div>
        </div>
      </div>

      <div style={{ marginTop: 14 }}>
        <span style={{ ...chip, color, borderColor: `${color}77` }}>{item.priority}</span>
        <span style={chip}>{item.kind}</span>
        {item.source_table ? <span style={chip}>{item.source_table}</span> : null}
      </div>

      <div style={{ marginTop: 16 }}>
        <div style={eyebrow}>Why AI flagged it</div>
        <ul style={{ ...muted, paddingLeft: 18 }}>
          {item.reasoning.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      </div>

      <div style={{ border: "1px solid rgba(232,196,107,.22)", borderRadius: 18, padding: 14, background: "rgba(232,196,107,.06)", marginTop: 14 }}>
        <div style={eyebrow}>Best Next Move</div>
        <p style={{ ...muted, margin: "8px 0 0" }}>{item.best_move}</p>
      </div>

      <div className="vf-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
        <Link href={item.href || "/dashboard"} style={button}>
          Open Room
        </Link>
        <Link href="/messages" style={ghost}>
          Messages
        </Link>
      </div>
    </article>
  );
}

export default function SmartAIPage() {
  const [email, setEmail] = useState("");
  const [data, setData] = useState<SmartData>({});
  const [status, setStatus] = useState("Loading Smart AI...");
  const [filter, setFilter] = useState("all");

  async function load() {
    setStatus("Loading Smart AI...");

    try {
      const viewer = currentEmail();
      setEmail(viewer);

      if (!viewer) {
        setStatus("Log in to view Smart AI.");
        setData({});
        return;
      }

      const response = await fetch(`/api/smart-ai?email=${encodeURIComponent(viewer)}`, {
        cache: "no-store",
        headers: {
          "x-vf-email": viewer,
        },
      });

      const json = await safeJson(response);

      if (!response.ok || json?.ok === false) {
        throw new Error(json?.error || "Smart AI failed to load.");
      }

      setData(json);
      setStatus("");
    } catch (error: any) {
      setStatus(error?.message || "Smart AI failed to load.");
      setData({});
    }
  }

  useEffect(() => {
    load();
  }, []);

  const insights = useMemo(() => {
    const list = Array.isArray(data.insights) ? data.insights : [];

    if (filter === "deal") return list.filter((item) => item.kind === "deal");
    if (filter === "pain") return list.filter((item) => item.kind === "pain");
    if (filter === "high") return list.filter((item) => item.score >= 75);

    return list;
  }, [data.insights, filter]);

  const counts = data.counts || {};

  return (
    <main style={pageStyle}>
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
        }
      `}</style>

      <div style={wrap}>
        <VaultForgeMemberNav
          title="Smart AI"
          subtitle="Read-only opportunity intelligence generated from profile, deals, and pain records."
          active="dashboard"
        />

        <section style={panel}>
          <div style={eyebrow}>VaultForge Smart AI</div>
          <h1 style={{ fontSize: "clamp(54px,10vw,98px)", lineHeight: 0.88, letterSpacing: "-.07em", margin: "12px 0 18px" }}>
            AI routes. You decide.
          </h1>

          <p style={{ ...muted, fontSize: 20, maxWidth: 980 }}>
            This layer reads your saved profile, compares it against live deals and pain records, then ranks the best next moves.
            It does not change records or send messages automatically.
          </p>

          <div style={{ marginTop: 16 }}>
            <span style={chip}>Signed in: {email || "unknown"}</span>
            <span style={chip}>Base: {data.profile?.base_state || "not listed"}</span>
            <span style={chip}>States: {(data.profile?.states || []).join(", ") || "not listed"}</span>
          </div>

          <div className="vf-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 20 }}>
            <button type="button" onClick={load} style={button}>Refresh Smart AI</button>
            <Link href="/dashboard" style={ghost}>Dashboard</Link>
            <Link href="/profile" style={ghost}>Profile</Link>
            <Link href="/projects" style={ghost}>Projects</Link>
            <Link href="/pain-feed" style={ghost}>Pain Feed</Link>
          </div>
        </section>

        <section className="vf-four" style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 16, marginBottom: 18 }}>
          <Metric label="AI Insights" value={counts.insights || 0} />
          <Metric label="High Fit" value={counts.high || 0} />
          <Metric label="Deals Read" value={counts.deals || 0} />
          <Metric label="Pain Read" value={counts.pains || 0} />
        </section>

        <section style={panel}>
          <div style={eyebrow}>Filters</div>
          <div className="vf-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
            {[
              ["all", "All"],
              ["high", "High Fit"],
              ["deal", "Deals"],
              ["pain", "Pain"],
            ].map(([key, label]) => (
              <button key={key} type="button" onClick={() => setFilter(key)} style={filter === key ? button : ghost}>
                {label}
              </button>
            ))}
          </div>
        </section>

        {status ? <section style={panel}>{status}</section> : null}

        {!status && insights.length === 0 ? (
          <section style={panel}>
            <h3 style={{ marginTop: 0 }}>No Smart AI insights yet.</h3>
            <p style={muted}>
              Add profile details, create deals, or submit pain records. Smart AI needs live data to score.
            </p>
          </section>
        ) : null}

        <section style={{ display: "grid", gap: 14 }}>
          {insights.map((item) => (
            <InsightCard key={`${item.kind}-${item.id}-${item.href}`} item={item} />
          ))}
        </section>
      </div>
    </main>
  );
}
