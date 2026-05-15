"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import VaultForgeMemberNav from "../components/VaultForgeMemberNav";

export const dynamic = "force-dynamic";

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

type DashboardStats = {
  ok?: boolean;
  email?: string;
  owner?: boolean;
  deals?: number;
  members?: number;
  bucket?: number;
  messages?: number;
  alerts?: number;
  pain?: number;
  routing?: number;
  activity?: number;
};

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(232,196,107,.16), transparent 28%), radial-gradient(circle at 88% 8%, rgba(56,189,248,.11), transparent 26%), radial-gradient(circle at 62% 54%, rgba(157,243,191,.075), transparent 28%), linear-gradient(180deg,#020303,#071326 55%,#020303)",
  color: "white",
  padding: "22px 16px 100px",
  fontFamily: "Arial, sans-serif",
};

const wrap: React.CSSProperties = {
  width: "min(1280px,100%)",
  margin: "0 auto",
};

const section: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.24)",
  borderRadius: 30,
  background:
    "linear-gradient(145deg,rgba(255,255,255,.070),rgba(255,255,255,.030))",
  padding: 24,
  marginBottom: 20,
  boxShadow: "0 28px 86px rgba(0,0,0,.30)",
};

const glass: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.12)",
  borderRadius: 24,
  padding: 20,
  background:
    "linear-gradient(180deg,rgba(255,255,255,.052),rgba(255,255,255,.020))",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,.06)",
};

const muted: React.CSSProperties = {
  color: "#cbd5e1",
  lineHeight: 1.55,
};

const pill: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,.14)",
  background: "rgba(255,255,255,.055)",
  color: "#cbd5e1",
  padding: "8px 12px",
  fontWeight: 850,
  margin: "0 8px 8px 0",
};

const goldButton: React.CSSProperties = {
  minHeight: 54,
  borderRadius: 999,
  padding: "14px 20px",
  background: "linear-gradient(135deg,#f8e7b0,#e8c46b)",
  color: "#06100a",
  fontWeight: 950,
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};

const ghostButton: React.CSSProperties = {
  ...goldButton,
  border: "1px solid rgba(255,255,255,.14)",
  background: "rgba(255,255,255,.060)",
  color: "white",
};

const eyebrow: React.CSSProperties = {
  color: "#e8c46b",
  letterSpacing: ".18em",
  textTransform: "uppercase",
  fontWeight: 950,
  fontSize: 12,
};

function Metric({
  label,
  value,
  sub,
  tone = "gold",
}: {
  label: string;
  value: string;
  sub: string;
  tone?: "gold" | "blue" | "green" | "red";
}) {
  const color =
    tone === "blue" ? "#38bdf8" : tone === "green" ? "#4ade80" : tone === "red" ? "#f87171" : "#e8c46b";

  return (
    <div style={glass}>
      <div style={{ color, fontWeight: 950, letterSpacing: ".14em", textTransform: "uppercase", fontSize: 12 }}>
        {label}
      </div>
      <div style={{ fontSize: 56, fontWeight: 1000, lineHeight: 1, marginTop: 14 }}>{value}</div>
      <div style={{ ...muted, marginTop: 10 }}>{sub}</div>
    </div>
  );
}

function CommandCard({
  title,
  body,
  href,
  tag,
  tone = "gold",
}: {
  title: string;
  body: string;
  href: string;
  tag: string;
  tone?: "gold" | "blue" | "green" | "red";
}) {
  const color =
    tone === "blue" ? "#38bdf8" : tone === "green" ? "#4ade80" : tone === "red" ? "#f87171" : "#e8c46b";

  return (
    <Link
      href={href}
      className="vf-command-card"
      style={{
        ...glass,
        minHeight: 206,
        textDecoration: "none",
        color: "white",
        display: "flex",
        flexDirection: "column",
        borderColor:
          tone === "blue"
            ? "rgba(56,189,248,.40)"
            : tone === "green"
            ? "rgba(74,222,128,.40)"
            : tone === "red"
            ? "rgba(248,113,113,.40)"
            : "rgba(232,196,107,.40)",
      }}
    >
      <div
        style={{
          display: "inline-flex",
          alignSelf: "flex-start",
          border: `1px solid ${color}`,
          color,
          background: "rgba(255,255,255,.04)",
          borderRadius: 999,
          padding: "6px 10px",
          fontSize: 11,
          fontWeight: 950,
          letterSpacing: ".10em",
          textTransform: "uppercase",
          marginBottom: 14,
          whiteSpace: "nowrap",
        }}
      >
        {tag}
      </div>

      <h3 className="vf-card-title" style={{ margin: "0 0 10px", fontSize: 30, lineHeight: 1.02 }}>{title}</h3>
      <p style={{ ...muted, margin: 0, flex: 1 }}>{body}</p>
      <div style={{ marginTop: 18, fontWeight: 950 }}>Open →</div>
    </Link>
  );
}

function Bar({ label, value, right }: { label: string; value: number; right: string }) {
  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, color: "#cbd5e1", fontWeight: 850 }}>
        <span>{label}</span>
        <span>{right}</span>
      </div>

      <div style={{ height: 14, borderRadius: 999, background: "rgba(255,255,255,.14)", overflow: "hidden", marginTop: 8, border: "1px solid rgba(255,255,255,.08)" }}>
        <div style={{ width: `${value}%`, height: "100%", background: "linear-gradient(90deg,#ff4d4d,#e8c46b,#4ade80,#38bdf8)" }} />
      </div>
    </div>
  );
}

function Notice({
  title,
  body,
  tone = "gold",
}: {
  title: string;
  body: string;
  tone?: "gold" | "blue" | "green" | "red";
}) {
  const color =
    tone === "blue" ? "#38bdf8" : tone === "green" ? "#4ade80" : tone === "red" ? "#f87171" : "#e8c46b";

  return (
    <div style={{ border: `1px solid ${color}55`, borderRadius: 20, padding: 16, background: "rgba(255,255,255,.04)" }}>
      <div style={{ color, fontWeight: 950, letterSpacing: ".12em", textTransform: "uppercase", fontSize: 11 }}>
        {title}
      </div>
      <p style={{ ...muted, margin: "8px 0 0" }}>{body}</p>
    </div>
  );
}

export default function DashboardPage() {
  const [email, setEmail] = useState("");
  const [stats, setStats] = useState<DashboardStats>({
    deals: 0,
    members: 0,
    bucket: 0,
    messages: 0,
    alerts: 0,
    pain: 0,
    routing: 0,
    activity: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const viewer = getEmail();
    setEmail(viewer);

    async function load() {
      try {
        const response = await fetch(`/api/dashboard/stats?email=${encodeURIComponent(viewer)}`, {
          method: "GET",
          credentials: "include",
          headers: { "x-vf-email": viewer },
          cache: "no-store",
        });

        const data = await response.json().catch(() => ({}));
        if (data?.ok) setStats(data);
      } catch (error) {
        console.error("Dashboard stats load failed.", error);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const opportunities = Number(stats.deals || 0);
  const pressure = Number(stats.pain || 0);
  const messages = Number(stats.messages || 0);
  const members = Number(stats.members || 0);

  const commandLoad = useMemo(() => {
    const total = opportunities + pressure + messages + Number(stats.routing || 0);
    if (total <= 0) return 16;
    return Math.min(100, total);
  }, [opportunities, pressure, messages, stats.routing]);

  const pressureLoad = useMemo(() => {
    const total = pressure + Number(stats.alerts || 0) + Number(stats.activity || 0);
    if (total <= 0) return 18;
    return Math.min(100, total);
  }, [pressure, stats.alerts, stats.activity]);

  const executionLoad = useMemo(() => {
    const total = messages + Number(stats.bucket || 0) + Number(stats.routing || 0);
    if (total <= 0) return 20;
    return Math.min(100, total);
  }, [messages, stats.bucket, stats.routing]);

  return (
    <main style={page}>
      <style>{`
        a:hover, button:hover {
          transform: translateY(-1px);
          transition: all .18s ease;
          filter: brightness(1.06);
        }

        .vf-four {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(255px, 1fr));
          gap: 16px;
        }

        .vf-card-title {
          overflow-wrap: normal;
          word-break: normal;
          hyphens: none;
        }

        @media (max-width: 980px) {
          .vf-four {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
        }

        @media (max-width: 620px) {
          .vf-grid,
          .vf-two,
          .vf-three,
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
          }

          .vf-command-card {
            min-height: auto !important;
          }

          .vf-card-title {
            font-size: 30px !important;
            line-height: 1.02 !important;
          }
        }
      `}</style>

      <div style={wrap}>
        <VaultForgeMemberNav
          title="Command Center"
          subtitle="Clean command folders: opportunity, pressure, workstations, intelligence, messages, network."
          active="dashboard"
        />

        <section style={section}>
          <div className="vf-two" style={{ display: "grid", gridTemplateColumns: "1.18fr .82fr", gap: 20, alignItems: "stretch" }}>
            <div>
              <div style={eyebrow}>VaultForge Command Center</div>

              <h1 style={{ fontSize: "clamp(54px,10vw,104px)", lineHeight: 0.88, letterSpacing: "-.07em", margin: "12px 0 18px" }}>
                Clean lanes. Smart rooms. One operating brain.
              </h1>

              <p style={{ ...muted, fontSize: 20, maxWidth: 900 }}>
                Opportunity and Pressure are not dumped into one messy feed anymore. The command center routes members into clean folders, dedicated rooms, and the intelligence layer that decides what is good, broken, fixable, risky, or worth routing.
              </p>

              <div style={{ marginTop: 18 }}>
                <span style={pill}>Signed in: {email || "unknown"}</span>
                <span style={pill}>{stats.owner ? "Owner View" : "Member View"}</span>
                <span style={pill}>Intelligence Active</span>
                <span style={pill}>Folder-Based Workstations</span>
              </div>

              <div className="vf-actions" style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 22 }}>
                <Link href="/projects" style={goldButton}>Open Workstation Folders</Link>
                <Link href="/submit" style={ghostButton}>Submit Opportunity</Link>
                <Link href="/pain" style={ghostButton}>Submit Pressure</Link>
                <Link href="/intelligence" style={ghostButton}>Intelligence</Link>
                <Link href="/messages" style={ghostButton}>Messages</Link>
              </div>
            </div>

            <div style={{ ...glass, background: "rgba(0,0,0,.20)" }}>
              <div style={eyebrow}>Operating Tape</div>

              <div style={{ display: "grid", gap: 13, marginTop: 16 }}>
                {[
                  ["Opportunity Rooms", `${opportunities} active rooms`],
                  ["Pressure Rooms", `${pressure} pressure signals`],
                  ["Execution Messages", `${messages} conversations`],
                  ["Network Capacity", `${members} operators/members`],
                  ["Engine", loading ? "Loading..." : "online"],
                ].map(([left, right]) => (
                  <div
                    key={left}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 10,
                      borderBottom: "1px solid rgba(255,255,255,.08)",
                      paddingBottom: 12,
                      color: "#cbd5e1",
                      fontWeight: 850,
                    }}
                  >
                    <span style={{ color: "white" }}>{left}</span>
                    <span>{loading ? "Loading..." : right}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="vf-four" style={{ marginBottom: 20 }}>
          <Metric label="Opportunity Rooms" value={String(opportunities)} sub="Upside, acquisition, monetization, and strategic asset rooms." tone="blue" />
          <Metric label="Pressure Rooms" value={String(pressure)} sub="Distress, bottlenecks, instability, and situations needing intervention." tone="red" />
          <Metric label="Messages" value={String(messages)} sub="Controlled conversations for routing, source contact, and execution." tone="green" />
          <Metric label="Network" value={String(members)} sub="Private operator capacity behind the command layer." tone="gold" />
        </section>

        <section style={section}>
          <div style={eyebrow}>Command Folders</div>

          <h2 style={{ fontSize: 42, lineHeight: 1, margin: "10px 0 8px" }}>
            Pick the lane. Then open the right room.
          </h2>

          <p style={{ ...muted, maxWidth: 960, fontSize: 18 }}>
            Workstations are now folder based: Opportunity Rooms, Pressure Rooms, Saved, Archived, and Deleted. This keeps the platform clean while the intelligence engine still connects everything underneath.
          </p>

          <div className="vf-four" style={{ marginTop: 16 }}>
            <CommandCard
              title="Opportunity Rooms"
              body="Open the upside lane: deal rooms, acquisition intelligence, structure, capital path, exit strategy, buyer/operator fit, and opportunity scoring."
              href="/projects"
              tag="UPSIDE"
              tone="blue"
            />

            <CommandCard
              title="Pressure Rooms"
              body="Open the problem-solving lane: distress, urgency, funding gaps, contractor breakdowns, seller pressure, timeline collapse, and resolution strategy."
              href="/projects"
              tag="FIX"
              tone="red"
            />

            <CommandCard
              title="Intelligence"
              body="Open the intelligence desk that classifies pressure, rewrites weak structures, diagnoses risk, and recommends the next operator move."
              href="/intelligence"
              tag="AI"
              tone="gold"
            />

            <CommandCard
              title="Messages"
              body="Open execution communications for source contact, route coordination, member requests, and operator follow-up."
              href="/messages"
              tag="COMMS"
              tone="green"
            />
          </div>
        </section>

        <section style={section}>
          <div style={eyebrow}>System Pressure</div>

          <div className="vf-three" style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 16, marginTop: 18 }}>
            <div style={glass}>
              <div style={eyebrow}>Command Load</div>
              <Bar label="Total active operating load" value={commandLoad} right={`${commandLoad}%`} />
              <p style={{ ...muted, marginTop: 14 }}>Combines opportunity rooms, pressure rooms, messages, and routing activity.</p>
            </div>

            <div style={glass}>
              <div style={eyebrow}>Pressure Load</div>
              <Bar label="Unresolved instability" value={pressureLoad} right={`${pressureLoad}%`} />
              <p style={{ ...muted, marginTop: 14 }}>Measures problems, urgency, pressure, and background intelligence signals.</p>
            </div>

            <div style={glass}>
              <div style={eyebrow}>Execution Movement</div>
              <Bar label="Routing and communication movement" value={executionLoad} right={`${executionLoad}%`} />
              <p style={{ ...muted, marginTop: 14 }}>Measures work moving toward action, messaging, routing, or resolution.</p>
            </div>
          </div>
        </section>

        <section style={section}>
          <div style={eyebrow}>Operating Doctrine</div>

          <div className="vf-three" style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 14, marginTop: 16 }}>
            <Notice title="Diagnose" body="Identify what is actually happening: opportunity, pressure, weak structure, execution failure, capital gap, or hidden risk." tone="red" />
            <Notice title="Rewrite" body="Restructure the path: wholesale, novation, seller finance, contractor stabilization, bridge capital, JV, hold, reroute, or abandon." tone="gold" />
            <Notice title="Resolve" body="Route the right people, sequence the work, monitor blockers, and move the situation toward execution." tone="green" />
          </div>
        </section>
      </div>
    </main>
  );
}
