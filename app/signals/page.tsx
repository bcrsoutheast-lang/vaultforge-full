"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

export const dynamic = "force-dynamic";

type Signal = {
  id: string;
  signal_id: string;
  source_type: string;
  title: string;
  summary: string;
  owner_email: string;
  member_email: string;
  city: string;
  state: string;
  market: string;
  asset_type: string;
  urgency: string;
  status: string;
  created_at: string;
  photo_url: string;
  photo_urls: string[];
  route_href: string;
  message_href: string;
};

type ApiState = {
  ok: boolean;
  signals: Signal[];
  counts: Record<string, number>;
  error?: string;
  details?: string;
};

const shell: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at 78% 0%, rgba(212,175,55,.20), transparent 28%), radial-gradient(circle at 0% 25%, rgba(150,112,28,.16), transparent 26%), linear-gradient(180deg,#020202 0%,#070707 48%,#020202 100%)",
  color: "#f7f3ea",
  fontFamily:
    "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};

const wrap: React.CSSProperties = {
  maxWidth: 1240,
  margin: "0 auto",
  padding: "28px 18px 80px",
};

const panel: React.CSSProperties = {
  border: "1px solid rgba(212,175,55,.30)",
  background: "linear-gradient(135deg, rgba(19,19,19,.96), rgba(8,8,8,.94))",
  borderRadius: 24,
  boxShadow: "0 22px 80px rgba(0,0,0,.42)",
};

const navGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
  gap: 12,
};

const navButton: React.CSSProperties = {
  border: "1px solid rgba(212,175,55,.24)",
  borderRadius: 14,
  padding: "15px 16px",
  color: "#f7f3ea",
  textDecoration: "none",
  background: "linear-gradient(135deg, rgba(255,255,255,.055), rgba(255,255,255,.018))",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  fontWeight: 800,
};

const goldText: React.CSSProperties = {
  color: "#d4af37",
  letterSpacing: ".22em",
  textTransform: "uppercase",
  fontSize: 13,
  fontWeight: 900,
};

const card: React.CSSProperties = {
  ...panel,
  padding: 18,
};

const pill: React.CSSProperties = {
  border: "1px solid rgba(212,175,55,.30)",
  borderRadius: 999,
  padding: "8px 12px",
  background: "rgba(212,175,55,.08)",
  color: "#f6df98",
  fontSize: 13,
  fontWeight: 900,
};

function getEmail() {
  if (typeof window === "undefined") return "";
  const params = new URLSearchParams(window.location.search);
  const paramEmail = params.get("email") || "";
  const localEmail = window.localStorage.getItem("vf_email") || window.localStorage.getItem("vf_member_email") || "";
  return (paramEmail || localEmail || "").trim().toLowerCase();
}

function formatDate(value: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function urgencyLabel(value: string) {
  const text = (value || "normal").trim();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export default function SignalsPage() {
  const [email, setEmail] = useState("");
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const [state, setState] = useState<ApiState>({ ok: false, signals: [], counts: {} });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setEmail(getEmail());
  }, []);

  async function loadSignals(nextFilter = filter) {
    setLoading(true);
    try {
      const activeEmail = getEmail();
      const params = new URLSearchParams();
      if (activeEmail) params.set("email", activeEmail);
      if (nextFilter !== "all") params.set("type", nextFilter);
      if (q.trim()) params.set("q", q.trim());

      const response = await fetch(`/api/signals?${params.toString()}`, { cache: "no-store" });
      const json = await response.json();
      setState(json);
    } catch (error: any) {
      setState({ ok: false, signals: [], counts: {}, error: "Could not load signals.", details: error?.message || String(error) });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSignals("all");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredSignals = useMemo(() => state.signals || [], [state.signals]);

  const navItems = [
    ["Dashboard", "/dashboard"],
    ["Pain Button", "/pain"],
    ["Pain Feed", "/pain-feed"],
    ["Create", "/submit"],
    ["Projects", "/projects"],
    ["Messages", "/messages"],
    ["Routing", "/routing-inbox"],
    ["Members", "/members"],
  ];

  return (
    <main style={shell}>
      <div style={wrap}>
        <section style={{ ...panel, padding: 18, marginBottom: 22 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap", marginBottom: 16 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: "linear-gradient(135deg,#d4af37,#f7f3ea 45%,#303030)", boxShadow: "0 0 26px rgba(212,175,55,.25)" }} />
                <div>
                  <div style={{ fontSize: 21, fontWeight: 950, letterSpacing: ".04em" }}>VaultForge Signals</div>
                  <div style={{ color: "#aaa39a", fontSize: 13 }}>Private deal flow. Real execution. Routed intelligence.</div>
                </div>
              </div>
            </div>
            <span style={pill}>Signed in: {email || "member"}</span>
          </div>
          <div style={navGrid}>
            {navItems.map(([label, href]) => (
              <Link key={href} href={href} style={navButton}>
                <span>{label}</span>
                <span style={{ color: "#d4af37" }}>→</span>
              </Link>
            ))}
          </div>
        </section>

        <section style={{ ...panel, padding: "34px 28px", marginBottom: 22 }}>
          <div style={goldText}>Unified Signal Feed</div>
          <h1 style={{ fontSize: "clamp(46px, 9vw, 92px)", lineHeight: ".92", margin: "14px 0", letterSpacing: "-.065em" }}>
            One feed for pain, projects, and routed opportunity.
          </h1>
          <p style={{ maxWidth: 760, color: "#c8c1b8", fontSize: 18, lineHeight: 1.55 }}>
            This is the clean operating layer. Every card should lead to the exact work item, owner contact flow, and routing path.
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 20 }}>
            <span style={pill}>Signals: {state.counts?.total || 0}</span>
            <span style={pill}>Pain: {state.counts?.pain || 0}</span>
            <span style={pill}>Projects: {state.counts?.projects || 0}</span>
            <span style={pill}>Urgent: {state.counts?.urgent || 0}</span>
          </div>
        </section>

        <section style={{ ...panel, padding: 18, marginBottom: 22 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12 }}>
            <input
              value={q}
              onChange={(event) => setQ(event.target.value)}
              placeholder="Search title, market, owner, asset type, status..."
              style={{ width: "100%", border: "1px solid rgba(212,175,55,.22)", borderRadius: 14, padding: "15px 16px", color: "#f7f3ea", background: "rgba(255,255,255,.055)", fontSize: 15, outline: "none" }}
            />
            <button onClick={() => loadSignals(filter)} style={{ border: "1px solid rgba(212,175,55,.55)", borderRadius: 14, padding: "0 18px", background: "linear-gradient(135deg,#d4af37,#f3d77b)", color: "#0b0b0b", fontWeight: 950 }}>
              Search
            </button>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
            {[
              ["all", "All"],
              ["pain", "Pain"],
              ["project", "Projects"],
            ].map(([key, label]) => (
              <button
                key={key}
                onClick={() => {
                  setFilter(key);
                  loadSignals(key);
                }}
                style={{ ...pill, cursor: "pointer", background: filter === key ? "linear-gradient(135deg,#d4af37,#f3d77b)" : "rgba(212,175,55,.08)", color: filter === key ? "#080808" : "#f6df98" }}
              >
                {label}
              </button>
            ))}
            <button onClick={() => loadSignals(filter)} style={{ ...pill, cursor: "pointer" }}>Refresh</button>
          </div>
        </section>

        {loading ? (
          <section style={{ ...panel, padding: 22 }}>Loading signals…</section>
        ) : !state.ok ? (
          <section style={{ ...panel, padding: 22, borderColor: "rgba(255,204,204,.35)" }}>
            <strong>Signals could not load.</strong>
            <p style={{ color: "#c8c1b8" }}>{state.error || state.details || "Unknown error."}</p>
          </section>
        ) : filteredSignals.length === 0 ? (
          <section style={{ ...panel, padding: 22 }}>
            No signals found yet. Submit Pain or create a Project first.
          </section>
        ) : (
          <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))", gap: 16 }}>
            {filteredSignals.map((signal) => (
              <article key={`${signal.source_type}-${signal.id}`} style={card}>
                {signal.photo_url ? (
                  <div style={{ height: 180, borderRadius: 16, overflow: "hidden", border: "1px solid rgba(212,175,55,.22)", marginBottom: 14, background: "#111" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={signal.photo_url} alt="Signal" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                ) : null}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                  <span style={pill}>{signal.source_type}</span>
                  <span style={pill}>{urgencyLabel(signal.urgency)}</span>
                  <span style={pill}>{signal.status || "new"}</span>
                </div>
                <h2 style={{ fontSize: 25, margin: "0 0 10px", lineHeight: 1.05 }}>{signal.title}</h2>
                <p style={{ color: "#c8c1b8", lineHeight: 1.45, minHeight: 62 }}>{signal.summary}</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, margin: "14px 0", color: "#aaa39a", fontSize: 13 }}>
                  <div><strong style={{ color: "#f7f3ea" }}>Market</strong><br />{signal.market || "—"}</div>
                  <div><strong style={{ color: "#f7f3ea" }}>Asset</strong><br />{signal.asset_type || "—"}</div>
                  <div><strong style={{ color: "#f7f3ea" }}>Owner</strong><br />{signal.owner_email || "—"}</div>
                  <div><strong style={{ color: "#f7f3ea" }}>Created</strong><br />{formatDate(signal.created_at)}</div>
                </div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
                  <Link href={signal.route_href || `/signals/${signal.id}`} style={{ ...navButton, flex: "1 1 160px", justifyContent: "center", background: "linear-gradient(135deg,#d4af37,#f3d77b)", color: "#090909" }}>
                    Open Signal
                  </Link>
                  <Link href={signal.message_href || "/messages/new"} style={{ ...navButton, flex: "1 1 160px", justifyContent: "center" }}>
                    Message Owner
                  </Link>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
