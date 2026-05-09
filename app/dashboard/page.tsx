
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import VaultForgeMemberNav from "../components/VaultForgeMemberNav";
import {
  VaultForgePulseStrip,
  VaultForgeSignalBar,
  VaultForgeCommandFooter,
  VaultForgeLiveTicker,
} from "../components/VaultForgeVisualLayer";

type LiveCounts = {
  routing_actions?: number;
  urgent_routing?: number;
  high_routing?: number;
  introductions?: number;
  responses?: number;
  projects?: number;
  pain_signals?: number;
  members?: number;
  total_activity?: number;
};

type RecentItem = {
  source?: string;
  title?: string;
  note?: string;
  priority?: string;
  created_at?: string;
  href?: string;
};

type LivePayload = {
  ok?: boolean;
  counts?: LiveCounts;
  recent?: RecentItem[];
  ticker?: string[];
  health?: {
    live_data_ready?: boolean;
    fake_data_allowed?: boolean;
    tables_checked?: number;
    tables_ok?: number;
    tables_missing_or_blocked?: unknown[];
  };
  generated_at?: string;
  error?: string;
};

const EMPTY_COUNTS: LiveCounts = {
  routing_actions: 0,
  urgent_routing: 0,
  high_routing: 0,
  introductions: 0,
  responses: 0,
  projects: 0,
  pain_signals: 0,
  members: 0,
  total_activity: 0,
};

function clean(value: unknown) {
  return String(value || "").trim();
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

  return (
    localStorage.getItem("vf_email") ||
    sessionStorage.getItem("vf_email") ||
    readCookie("vf_email") ||
    readCookie("vf_admin_email") ||
    ""
  )
    .trim()
    .toLowerCase();
}

function shortSource(value: unknown) {
  const text = clean(value || "activity").toUpperCase();
  if (text === "INTRODUCTION") return "INTRO";
  return text;
}

function formatDate(value: unknown) {
  const text = clean(value);
  if (!text) return "Live";
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return text;
  return date.toLocaleString();
}

export default function DashboardPage() {
  const [live, setLive] = useState<LivePayload | null>(null);
  const [status, setStatus] = useState("Loading live dashboard...");
  const [loading, setLoading] = useState(true);

  async function loadLiveDashboard() {
    setLoading(true);
    setStatus("Loading live dashboard...");

    try {
      const email = getEmail();

      const isOwner =
        email === "bcrsoutheast@gmail.com" ||
        readCookie("vf_admin") === "1";

      const response = await fetch(
        `/api/dashboard/live?email=${encodeURIComponent(email)}${isOwner ? "&owner=1" : ""}`,
        {
          cache: "no-store",
          headers: {
            "x-vf-email": email,
            ...(isOwner ? { "x-vf-admin": "1" } : {}),
          },
        }
      );

      const data = (await response.json().catch(() => ({}))) as LivePayload;

      if (!response.ok || data?.ok === false) {
        throw new Error(data?.error || "Could not load live dashboard.");
      }

      setLive(data);
      setStatus("");
    } catch (error: any) {
      setLive(null);
      setStatus(error?.message || "Could not load live dashboard.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLiveDashboard();
  }, []);

  const counts = live?.counts || EMPTY_COUNTS;
  const recent = Array.isArray(live?.recent) ? live.recent : [];
  const ticker = Array.isArray(live?.ticker) && live.ticker.length
    ? live.ticker
    : ["LIVE DATA CONNECTED — WAITING FOR MEMBER ACTIVITY"];

  const urgent = Number(counts.urgent_routing || 0);
  const high = Number(counts.high_routing || 0);
  const totalActivity = Number(counts.total_activity || 0);
  const normal = Math.max(0, totalActivity - urgent - high);

  const pulseItems = useMemo(
    () => [
      {
        label: "LIVE DATA",
        value: live?.health?.live_data_ready ? "CONNECTED" : loading ? "LOADING" : "CHECK",
        tone: live?.health?.live_data_ready ? ("green" as const) : ("gold" as const),
      },
      {
        label: "ACTIVITY",
        value: String(totalActivity),
        tone: "gold" as const,
      },
      {
        label: "ROUTING",
        value: String(counts.routing_actions || 0),
        tone: "purple" as const,
      },
      {
        label: "FAKE DATA",
        value: live?.health?.fake_data_allowed === false ? "OFF" : "CHECK",
        tone: live?.health?.fake_data_allowed === false ? ("green" as const) : ("red" as const),
      },
    ],
    [counts.routing_actions, live?.health?.fake_data_allowed, live?.health?.live_data_ready, loading, totalActivity]
  );

  const recentPulse = recent.slice(0, 4);

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, rgba(178,24,24,.22), transparent 28%), radial-gradient(circle at 85% 10%, rgba(232,196,107,.16), transparent 24%), linear-gradient(180deg,#020202 0%,#070707 55%,#020202 100%)",
        color: "white",
        fontFamily: "Arial, sans-serif",
        padding: "24px 18px 90px",
      }}
    >
      <div style={{ maxWidth: 1400, margin: "0 auto" }}>
        <VaultForgeMemberNav
          title="Member Command Center"
          subtitle="Private real estate intelligence network"
        />

        <VaultForgePulseStrip items={pulseItems} />

        <VaultForgeLiveTicker items={ticker} />

        <VaultForgeSignalBar
          urgent={urgent}
          high={high}
          normal={normal}
        />

        {status && (
          <section style={notice}>
            <strong>{status}</strong>
          </section>
        )}

        <section style={hero}>
          <div style={gridBg}></div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))",
              gap: 24,
              position: "relative",
              zIndex: 1,
            }}
          >
            <div>
              <div style={eyebrow}>LIVE INTELLIGENCE NETWORK</div>

              <h2
                style={{
                  fontSize: "clamp(44px,8vw,86px)",
                  lineHeight: .9,
                  letterSpacing: -3,
                  margin: "0 0 20px",
                }}
              >
                Signals. Routes.
                <span style={{ color: "#e8c46b" }}>
                  {" "}Execution.
                </span>
              </h2>

              <p
                style={{
                  color: "rgba(255,255,255,.74)",
                  fontSize: 21,
                  lineHeight: 1.6,
                  maxWidth: 760,
                }}
              >
                Your command center is now pulling live VaultForge operational data:
                routing actions, introductions, responses, projects, pain signals,
                members, and recent activity.
              </p>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
                  gap: 14,
                  marginTop: 26,
                }}
              >
                <StatCard label="TOTAL ACTIVITY" value={String(counts.total_activity || 0)} />
                <StatCard label="LIVE ROUTES" value={String(counts.routing_actions || 0)} />
                <StatCard label="INTRODUCTIONS" value={String(counts.introductions || 0)} />
                <StatCard label="PAIN SIGNALS" value={String(counts.pain_signals || 0)} />
              </div>
            </div>

            <div style={terminal}>
              <div style={terminalHeader}>
                <div>
                  <div style={eyebrow}>LIVE NETWORK</div>
                  <h3 style={{ margin: 0, fontSize: 26 }}>
                    Activity Pulse
                  </h3>
                </div>

                <div style={pill}>{live?.health?.live_data_ready ? "LIVE" : "READY"}</div>
              </div>

              {recentPulse.length > 0 ? (
                recentPulse.map((item, index) => (
                  <Signal
                    key={`${item.source || "activity"}-${item.created_at || index}-${item.title || index}`}
                    title={`${shortSource(item.source)} • ${clean(item.title || "Live activity")}`}
                    text={`${clean(item.note || "Live VaultForge activity recorded.")} ${item.created_at ? `· ${formatDate(item.created_at)}` : ""}`}
                    href={item.href || "/activity"}
                  />
                ))
              ) : (
                <Signal
                  title="LIVE DATA CONNECTED"
                  text="No member activity has been recorded yet. This dashboard will populate from real routing, pain, project, intro, and response records."
                  href="/activity"
                />
              )}
            </div>
          </div>
        </section>

        <section style={section}>
          <div style={eyebrow}>LIVE COMMAND METRICS</div>

          <h2 style={sectionTitle}>
            Real data.
            <span style={{ color: "#e8c46b" }}>
              {" "}No demo activity.
            </span>
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
              gap: 18,
              marginTop: 26,
            }}
          >
            <Panel title="Alerts" desc={`${counts.pain_signals || 0} pain signals and live intelligence inputs ready for routing.`} href="/alerts" />
            <Panel title="Routing Inbox" desc={`${counts.routing_actions || 0} routing actions currently visible from live records.`} href="/routing-inbox" />
            <Panel title="Introductions" desc={`${counts.introductions || 0} controlled introductions loaded from the live network.`} href="/introductions" />
            <Panel title="Activity" desc={`${counts.total_activity || 0} total live operational events across core systems.`} href="/activity" />
            <Panel title="Projects" desc={`${counts.projects || 0} project/deal records available in live data.`} href="/projects" />
            <Panel title="Members" desc={`${counts.members || 0} member profiles visible through live profile data.`} href="/members" />
          </div>
        </section>

        <section style={section}>
          <div style={eyebrow}>LIVE SYSTEM HEALTH</div>

          <h2 style={sectionTitle}>
            Operational readiness.
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
              gap: 14,
              marginTop: 24,
            }}
          >
            <StatCard label="TABLES CHECKED" value={String(live?.health?.tables_checked || 0)} />
            <StatCard label="TABLES OK" value={String(live?.health?.tables_ok || 0)} />
            <StatCard label="FAKE DATA" value={live?.health?.fake_data_allowed === false ? "OFF" : "CHECK"} />
            <StatCard label="LAST UPDATE" value={live?.generated_at ? "LIVE" : "WAITING"} />
          </div>

          <button type="button" style={refreshBtn} onClick={loadLiveDashboard}>
            Refresh Live Data
          </button>
        </section>

        <VaultForgeCommandFooter />
      </div>
    </main>
  );
}

function Panel({ title, desc, href }: { title: string; desc: string; href: string }) {
  return (
    <Link href={href} style={{ textDecoration: "none", color: "white" }}>
      <div
        style={{
          border: "1px solid rgba(232,196,107,.14)",
          borderRadius: 26,
          padding: 22,
          background:
            "linear-gradient(180deg, rgba(255,255,255,.05), rgba(255,255,255,.015))",
          minHeight: 220,
        }}
      >
        <div
          style={{
            color: "#d33a2c",
            letterSpacing: 4,
            fontWeight: 900,
            fontSize: 12,
            marginBottom: 12,
          }}
        >
          LIVE PANEL
        </div>

        <h3 style={{ fontSize: 30, margin: "0 0 12px" }}>{title}</h3>

        <p
          style={{
            color: "rgba(255,255,255,.72)",
            lineHeight: 1.6,
            fontSize: 17,
          }}
        >
          {desc}
        </p>

        <div style={{ marginTop: 18, color: "#e8c46b", fontWeight: 900 }}>
          Open →
        </div>
      </div>
    </Link>
  );
}

function Signal({ title, text, href }: { title: string; text: string; href: string }) {
  return (
    <Link href={href} style={{ textDecoration: "none", color: "white" }}>
      <div
        style={{
          border: "1px solid rgba(255,255,255,.08)",
          borderLeft: "3px solid #d33a2c",
          borderRadius: 18,
          padding: 16,
          background: "rgba(255,255,255,.03)",
          marginTop: 12,
        }}
      >
        <div style={{ color: "#e8c46b", fontWeight: 900, marginBottom: 8 }}>
          {title}
        </div>
        <div style={{ color: "rgba(255,255,255,.70)", lineHeight: 1.5 }}>
          {text}
        </div>
      </div>
    </Link>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        border: "1px solid rgba(232,196,107,.14)",
        borderRadius: 22,
        padding: 18,
        background:
          "linear-gradient(180deg, rgba(255,255,255,.05), rgba(255,255,255,.015))",
      }}
    >
      <div
        style={{
          color: "#d33a2c",
          fontWeight: 900,
          letterSpacing: 3,
          fontSize: 12,
          marginBottom: 8,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 42, fontWeight: 950 }}>{value}</div>
    </div>
  );
}

const notice: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.18)",
  borderRadius: 22,
  padding: 16,
  background: "rgba(232,196,107,.07)",
  marginBottom: 22,
  color: "#e8c46b",
};

const hero: React.CSSProperties = {
  position: "relative",
  overflow: "hidden",
  border: "1px solid rgba(232,196,107,.18)",
  borderRadius: 36,
  padding: "36px 28px",
  background:
    "radial-gradient(circle at top, rgba(232,196,107,.10), transparent 40%), linear-gradient(145deg, rgba(255,255,255,.05), rgba(255,255,255,.015))",
  boxShadow: "0 35px 120px rgba(0,0,0,.7)",
};

const gridBg: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  opacity: .12,
  backgroundImage:
    "linear-gradient(rgba(232,196,107,.16) 1px, transparent 1px), linear-gradient(90deg, rgba(232,196,107,.12) 1px, transparent 1px)",
  backgroundSize: "42px 42px",
};

const eyebrow: React.CSSProperties = {
  color: "#d33a2c",
  letterSpacing: 4,
  fontWeight: 900,
  fontSize: 12,
  marginBottom: 14,
};

const terminal: React.CSSProperties = {
  border: "1px solid rgba(211,58,44,.22)",
  borderRadius: 28,
  padding: 20,
  background:
    "radial-gradient(circle at top right, rgba(232,196,107,.10), transparent 30%), linear-gradient(180deg, rgba(0,0,0,.64), rgba(0,0,0,.34))",
};

const terminalHeader: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 10,
  borderBottom: "1px solid rgba(232,196,107,.12)",
  paddingBottom: 14,
  marginBottom: 14,
};

const pill: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.20)",
  borderRadius: 999,
  padding: "7px 10px",
  color: "#e8c46b",
  fontWeight: 900,
  fontSize: 12,
};

const section: React.CSSProperties = {
  marginTop: 28,
  border: "1px solid rgba(232,196,107,.14)",
  borderRadius: 34,
  padding: 28,
  background:
    "linear-gradient(180deg, rgba(255,255,255,.04), rgba(255,255,255,.015))",
};

const sectionTitle: React.CSSProperties = {
  fontSize: "clamp(34px,6vw,68px)",
  lineHeight: .95,
  letterSpacing: -2,
  margin: 0,
};

const refreshBtn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "linear-gradient(135deg,#f5d978,#9df3bf 55%,#b55cff)",
  color: "#06100a",
  border: "none",
  borderRadius: 999,
  padding: "13px 18px",
  fontWeight: 950,
  textDecoration: "none",
  cursor: "pointer",
  marginTop: 18,
  minHeight: 46,
};