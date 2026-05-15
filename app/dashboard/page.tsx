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

  return cleanEmail(
    readCookie("vf_email") ||
      readCookie("vf_member_email") ||
      readCookie("vf_admin_email")
  );
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
  admin?: {
    owner?: boolean;
    pendingDeals?: number;
    archivedDeals?: number;
    lockedMembers?: number;
    paymentRequiredMembers?: number;
    activeMembers?: number;
  };
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
      <div
        style={{
          color,
          fontWeight: 950,
          letterSpacing: ".14em",
          textTransform: "uppercase",
          fontSize: 12,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 56, fontWeight: 1000, lineHeight: 1, marginTop: 14 }}>
        {value}
      </div>
      <div style={{ ...muted, marginTop: 10 }}>{sub}</div>
    </div>
  );
}

function QueueCard({
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
      className="vf-queue-card"
      style={{
        ...glass,
        minHeight: 184,
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

      <h3 className="vf-queue-title" style={{ margin: "0 0 10px", fontSize: 26, lineHeight: 1.05 }}>
        {title}
      </h3>

      <p style={{ ...muted, margin: 0, flex: 1 }}>{body}</p>

      <div style={{ marginTop: 18, fontWeight: 950 }}>Open →</div>
    </Link>
  );
}

function Bar({
  label,
  value,
  right,
}: {
  label: string;
  value: number;
  right: string;
}) {
  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, color: "#cbd5e1", fontWeight: 850 }}>
        <span>{label}</span>
        <span>{right}</span>
      </div>

      <div
        style={{
          height: 14,
          borderRadius: 999,
          background: "rgba(255,255,255,.14)",
          overflow: "hidden",
          marginTop: 8,
          border: "1px solid rgba(255,255,255,.08)",
        }}
      >
        <div
          style={{
            width: `${value}%`,
            height: "100%",
            background: "linear-gradient(90deg,#ff4d4d,#e8c46b,#4ade80,#38bdf8)",
          }}
        />
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
    <div
      style={{
        border: `1px solid ${color}55`,
        borderRadius: 20,
        padding: 16,
        background: "rgba(255,255,255,.04)",
      }}
    >
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
        const response = await fetch(
          `/api/dashboard/stats?email=${encodeURIComponent(viewer)}`,
          {
            method: "GET",
            credentials: "include",
            headers: {
              "x-vf-email": viewer,
            },
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (data?.ok) {
          setStats(data);
        }
      } catch (error) {
        console.error("Dashboard stats load failed.", error);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const pressureValue = useMemo(() => {
    const total =
      Number(stats.pain || 0) +
      Number(stats.deals || 0) +
      Number(stats.messages || 0);

    if (total <= 0) return 12;
    if (total >= 100) return 100;

    return total;
  }, [stats]);

  const movementValue = useMemo(() => {
    const total =
      Number(stats.messages || 0) +
      Number(stats.activity || 0) +
      Number(stats.bucket || 0);

    if (total <= 0) return 8;
    if (total >= 100) return 100;

    return total;
  }, [stats]);

  const aiRoutingValue = useMemo(() => {
    const total =
      Number(stats.routing || 0) +
      Number(stats.alerts || 0) +
      Number(stats.activity || 0);

    if (total <= 0) return 18;
    if (total >= 100) return 100;

    return total;
  }, [stats]);

  const openOpportunities = Number(stats.deals || 0);
  const openPain = Number(stats.pain || 0);
  const messages = Number(stats.messages || 0);
  const members = Number(stats.members || 0);

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

        .vf-queue-title {
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

          .vf-queue-card {
            min-height: auto !important;
          }

          .vf-queue-title {
            font-size: 30px !important;
            line-height: 1.02 !important;
          }
        }
      `}</style>

      <div style={wrap}>
        <VaultForgeMemberNav
          title="Dashboard"
          subtitle="AI Market Intelligence · Opportunity Flow · Execution"
          active="dashboard"
        />

        <section style={section}>
          <div className="vf-two" style={{ display: "grid", gridTemplateColumns: "1.22fr .78fr", gap: 20, alignItems: "stretch" }}>
            <div>
              <div style={eyebrow}>VaultForge AI Command Center</div>

              <h1
                style={{
                  fontSize: "clamp(54px,10vw,104px)",
                  lineHeight: 0.88,
                  letterSpacing: "-.07em",
                  margin: "12px 0 18px",
                }}
              >
                Intelligence routes in the background.
              </h1>

              <p style={{ ...muted, fontSize: 20, maxWidth: 900 }}>
                Members work opportunities, pain rooms, messages, and network connections.
                VaultForge watches the pressure, reads the context, and keeps routing logic behind the scenes.
              </p>

              <div style={{ marginTop: 18 }}>
                <span style={pill}>Signed in: {email || "unknown"}</span>
                <span style={pill}>{stats.owner ? "Owner View" : "Member View"}</span>
                <span style={pill}>AI Routing Active</span>
                <span style={pill}>Private Network</span>
              </div>

              <div className="vf-actions" style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 22 }}>
                <Link href="/projects" style={goldButton}>Open Projects</Link>
                <Link href="/smart-ai" style={goldButton}>Smart AI</Link>
                <Link href="/pain-feed" style={ghostButton}>Pain Feed</Link>
                <Link href="/submit" style={ghostButton}>Create Deal</Link>
                <Link href="/pain" style={ghostButton}>Submit Pain</Link>
                <Link href="/messages" style={ghostButton}>Messages</Link>
              </div>
            </div>

            <div style={{ ...glass, background: "rgba(0,0,0,.20)" }}>
              <div style={eyebrow}>AI Operating Tape</div>

              <div style={{ display: "grid", gap: 13, marginTop: 16 }}>
                {[
                  ["Opportunities", `${openOpportunities} active project rooms`],
                  ["Pain Pressure", `${openPain} open pressure records`],
                  ["Messages", `${messages} communication threads`],
                  ["Members", `${members} network members`],
                  ["AI Routing", loading ? "Loading..." : "active in background"],
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
          <Metric
            label="Projects"
            value={String(openOpportunities)}
            sub="Active opportunities and deal command rooms."
            tone="blue"
          />

          <Metric
            label="Pain"
            value={String(openPain)}
            sub="Operational problems, pressure, and rescue signals."
            tone="gold"
          />

          <Metric
            label="Messages"
            value={String(messages)}
            sub="Controlled member and owner conversations."
            tone="green"
          />

          <Metric
            label="Members"
            value={String(members)}
            sub="Private network capacity behind the routing engine."
            tone="red"
          />
        </section>

        <section style={section}>
          <div style={eyebrow}>AI Routing Layer</div>

          <h2 style={{ fontSize: 42, lineHeight: 1, margin: "10px 0 8px", letterSpacing: "-.04em" }}>
            The system works behind the scenes.
          </h2>

          <p style={{ ...muted, fontSize: 18, maxWidth: 960 }}>
            Routing, signals, introductions, activity, and alerts are no longer member-facing workflow buttons.
            They are hidden orchestration signals that help VaultForge recommend where attention should go next.
          </p>

          <Bar
            label="Market pressure"
            value={pressureValue}
            right={`${openPain} pain · ${openOpportunities} projects · ${messages} messages`}
          />

          <Bar
            label="Execution movement"
            value={movementValue}
            right={`${stats.activity || 0} background events · ${messages} messages`}
          />

          <Bar
            label="AI routing activity"
            value={aiRoutingValue}
            right="routing, matching, alerts, and introductions stay background"
          />
        </section>

        <section style={section}>
          <div style={eyebrow}>AI Noticed</div>

          <h2
            style={{
              fontSize: "clamp(42px,7vw,72px)",
              lineHeight: 0.94,
              letterSpacing: "-.06em",
              margin: "10px 0 14px",
            }}
          >
            What matters next.
          </h2>

          <div className="vf-four" style={{ marginTop: 20 }}>
            <Notice
              title="Opportunity Flow"
              body={
                openOpportunities
                  ? "Project rooms are active. Review the best next move inside each deal room instead of chasing manual signal pages."
                  : "No active project rooms yet. Submit a deal to create an AI-read opportunity room."
              }
              tone="blue"
            />

            <Notice
              title="Pressure Detection"
              body={
                openPain
                  ? "Pain records are live. VaultForge uses those records as pressure signals for routing, capital, buyer, and operator fit."
                  : "No open pain records yet. Submit pain when a deal, asset, owner, or project needs resolution."
              }
              tone="red"
            />

            <Notice
              title="Network Execution"
              body={
                messages
                  ? "Messages are active. Keep execution tied to the room so the network context stays clean."
                  : "No active message threads yet. Use room-level contact buttons when a project or pain record needs action."
              }
              tone="green"
            />

            <Notice
              title="Hidden Routing"
              body="Signals, alerts, introductions, and routing activity remain active as infrastructure, not member navigation clutter."
              tone="gold"
            />
          </div>
        </section>

        <section style={section}>
          <div style={eyebrow}>Member Workbench</div>

          <h2
            style={{
              fontSize: "clamp(42px,7vw,72px)",
              lineHeight: 0.94,
              letterSpacing: "-.06em",
              margin: "10px 0 14px",
            }}
          >
            Work the rooms. Let AI route.
          </h2>

          <p style={{ ...muted, fontSize: 18, maxWidth: 980 }}>
            The member experience stays simple: submit, review, message, and execute.
            VaultForge handles matching intelligence in the background.
          </p>

          <div className="vf-four" style={{ marginTop: 22 }}>
            <QueueCard
              tag="AI"
              title="Smart AI"
              body="Rank deals and pain records against your saved profile, needs, markets, and capabilities."
              href="/smart-ai"
              tone="gold"
            />

            <QueueCard
              tag="Deals"
              title="Projects"
              body="Open active deal rooms, review economics, photos, AI summary, and best next move."
              href="/projects"
              tone="blue"
            />

            <QueueCard
              tag="Pain"
              title="Pain Feed"
              body="Review pressure rooms, distressed situations, stalled execution, funding gaps, and rescue opportunities."
              href="/pain-feed"
              tone="red"
            />

            <QueueCard
              tag="Create"
              title="Submit New"
              body="Create a deal room or submit a pain signal. VaultForge turns it into intelligence."
              href="/submit"
              tone="gold"
            />

            <QueueCard
              tag="Message"
              title="Messages"
              body="Coordinate with owners and members without exposing the internal routing engine."
              href="/messages"
              tone="green"
            />

            <QueueCard
              tag="Network"
              title="Members"
              body="Review private network capacity and member context when you need the right operator."
              href="/members"
              tone="gold"
            />
          </div>
        </section>

        <section style={section}>
          <div style={eyebrow}>Operating Model</div>

          <h2 style={{ fontSize: 36, lineHeight: 1, margin: "10px 0 18px", letterSpacing: "-.035em" }}>
            Member-facing simplicity. AI-facing complexity.
          </h2>

          <div className="vf-four">
            {[
              ["1. Submit", "Deals and pain records create intelligence rooms."],
              ["2. Read", "VaultForge interprets numbers, pressure, context, and execution fit."],
              ["3. Route", "The AI routing layer works silently behind the member interface."],
              ["4. Execute", "Members use rooms and messages to move opportunities toward resolution."],
            ].map(([title, text]) => (
              <div key={title} style={glass}>
                <strong style={{ color: "#f8e7b0" }}>{title}</strong>
                <p style={muted}>{text}</p>
              </div>
            ))}
          </div>
        </section>

        <footer
          style={{
            borderTop: "1px solid rgba(255,255,255,.10)",
            color: "#94a3b8",
            padding: "20px 0",
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
            letterSpacing: ".18em",
            fontSize: 12,
            textTransform: "uppercase",
          }}
        >
          <span>VaultForge OS</span>
          <span>AI Routing Hidden · Rooms Visible</span>
          <span>Private Real Estate Intelligence Network</span>
        </footer>
      </div>
    </main>
  );
}