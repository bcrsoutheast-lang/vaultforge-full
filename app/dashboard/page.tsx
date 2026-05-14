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
    "radial-gradient(circle at 8% 0%, rgba(232,196,107,.18), transparent 30%), radial-gradient(circle at 92% 8%, rgba(56,189,248,.12), transparent 28%), radial-gradient(circle at 65% 56%, rgba(157,243,191,.08), transparent 30%), linear-gradient(180deg,#020303,#071326 55%,#020303)",
  color: "white",
  padding: "22px 16px 100px",
  fontFamily: "Arial, sans-serif",
};

const wrap: React.CSSProperties = {
  width: "min(1300px,100%)",
  margin: "0 auto",
};

const panel: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.22)",
  borderRadius: 30,
  background:
    "linear-gradient(145deg,rgba(255,255,255,.070),rgba(255,255,255,.026))",
  padding: 24,
  marginBottom: 18,
  boxShadow: "0 28px 86px rgba(0,0,0,.30)",
};

const glass: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.12)",
  borderRadius: 22,
  padding: 18,
  background: "rgba(255,255,255,.045)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,.06)",
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

const chip: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  borderRadius: 999,
  border: "1px solid rgba(157,243,191,.22)",
  background: "rgba(157,243,191,.07)",
  color: "#9df3bf",
  padding: "7px 10px",
  fontWeight: 850,
  margin: "0 7px 7px 0",
  fontSize: 12,
};

const goldButton: React.CSSProperties = {
  minHeight: 52,
  borderRadius: 999,
  padding: "13px 18px",
  background: "linear-gradient(135deg,#f8e7b0,#e8c46b)",
  color: "#06100a",
  fontWeight: 950,
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  border: 0,
};

const ghostButton: React.CSSProperties = {
  ...goldButton,
  border: "1px solid rgba(255,255,255,.14)",
  background: "rgba(255,255,255,.060)",
  color: "white",
};

function clamp(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function CountTile({ labelText, value, caption, tone = "gold" }: { labelText: string; value: number | string; caption: string; tone?: "gold" | "blue" | "green" | "red" }) {
  const color = tone === "blue" ? "#38bdf8" : tone === "green" ? "#4ade80" : tone === "red" ? "#f87171" : "#e8c46b";

  return (
    <div style={{ ...glass, minHeight: 132 }}>
      <div style={{ ...label, color }}>{labelText}</div>
      <div style={{ fontSize: 44, fontWeight: 1000, lineHeight: 1, marginTop: 12 }}>{value}</div>
      <p style={{ ...muted, margin: "9px 0 0", fontSize: 14 }}>{caption}</p>
    </div>
  );
}

function ActionCard({ tag, title, body, href, primary = false }: { tag: string; title: string; body: string; href: string; primary?: boolean }) {
  return (
    <Link
      href={href}
      className="vf-action-card"
      style={{
        ...glass,
        textDecoration: "none",
        color: "white",
        display: "grid",
        gap: 10,
        minHeight: 178,
        borderColor: primary ? "rgba(232,196,107,.42)" : "rgba(255,255,255,.12)",
        background: primary ? "linear-gradient(145deg,rgba(232,196,107,.12),rgba(255,255,255,.035))" : glass.background,
      }}
    >
      <span style={{ ...chip, alignSelf: "start", width: "fit-content" }}>{tag}</span>
      <h3 style={{ margin: 0, fontSize: 27, lineHeight: 1.02, letterSpacing: "-.03em" }}>{title}</h3>
      <p style={{ ...muted, margin: 0 }}>{body}</p>
      <strong style={{ color: "#f8e7b0" }}>Open →</strong>
    </Link>
  );
}

function ScoreLine({ title, value, caption }: { title: string; value: number; caption: string }) {
  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, color: "#e2e8f0", fontWeight: 900 }}>
        <span>{title}</span>
        <span>{value}%</span>
      </div>
      <div style={{ height: 10, borderRadius: 999, background: "rgba(255,255,255,.12)", overflow: "hidden", marginTop: 8 }}>
        <div style={{ width: `${value}%`, height: "100%", background: "linear-gradient(90deg,#f87171,#e8c46b,#4ade80,#38bdf8)" }} />
      </div>
      <p style={{ ...muted, margin: "7px 0 0", fontSize: 13 }}>{caption}</p>
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

        const data = await response.json();
        if (data?.ok) setStats(data);
      } catch (error) {
        console.error("Dashboard stats load failed.", error);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const painCount = Number(stats.pain || 0);
  const dealCount = Number(stats.deals || 0);
  const msgCount = Number(stats.messages || 0);
  const alertCount = Number(stats.alerts || 0);
  const activityCount = Number(stats.activity || 0);
  const routingCount = Number(stats.routing || 0);
  const memberCount = Number(stats.members || 0);

  const pressureScore = useMemo(() => clamp(18 + painCount * 9 + alertCount * 8 + routingCount * 5), [painCount, alertCount, routingCount]);
  const networkScore = useMemo(() => clamp(12 + memberCount * 6 + msgCount * 5 + activityCount * 4), [memberCount, msgCount, activityCount]);
  const opportunityScore = useMemo(() => clamp(20 + dealCount * 8 + painCount * 5), [dealCount, painCount]);

  const aiRead = loading
    ? "VaultForge AI is loading the operating desk."
    : painCount || dealCount || msgCount
    ? `AI is watching ${dealCount} deal rooms, ${painCount} pain records, ${msgCount} message threads, and ${alertCount} active alerts. Routing stays in the background; members only see the rooms, priorities, and next best actions.`
    : "No major pressure detected yet. Create a deal or submit a pain signal to start the intelligence loop.";

  const nextMove = painCount > 0
    ? "Review the highest-pressure Pain Room and let VaultForge suggest the best-fit member path."
    : dealCount > 0
    ? "Open Projects and work the strongest opportunity room first."
    : "Create a Deal or submit a Pain Signal to activate routing intelligence.";

  return (
    <main style={page}>
      <style>{`
        a:hover, button:hover { transform: translateY(-1px); transition: all .18s ease; filter: brightness(1.06); }
        .vf-grid { display: grid; grid-template-columns: repeat(auto-fit,minmax(245px,1fr)); gap: 14px; }
        .vf-two { display: grid; grid-template-columns: 1.15fr .85fr; gap: 18px; }
        .vf-actions { display: flex; flex-wrap: wrap; gap: 10px; }
        @media (max-width: 840px) {
          .vf-two, .vf-grid, .vf-actions { grid-template-columns: 1fr !important; }
          .vf-actions { display: grid !important; }
          .vf-actions > * { width: 100%; box-sizing: border-box; }
          .vf-action-card { min-height: auto !important; }
        }
      `}</style>

      <div style={wrap}>
        <VaultForgeMemberNav
          title="Dashboard"
          subtitle="AI command center for rooms, pressure, messages, and next best action."
          active="dashboard"
        />

        <section style={panel}>
          <div className="vf-two">
            <div>
              <div style={label}>VaultForge AI Operating System</div>
              <h1 style={{ fontSize: "clamp(52px,10vw,102px)", lineHeight: .88, letterSpacing: "-.075em", margin: "12px 0 16px" }}>
                Member intelligence desk.
              </h1>
              <p style={{ ...muted, fontSize: 20, maxWidth: 850 }}>
                VaultForge routes in the background. Members focus on the rooms, the pressure, the opportunity, and the next best move.
              </p>
              <div style={{ marginTop: 16 }}>
                <span style={chip}>Signed in: {email || "unknown"}</span>
                <span style={chip}>{stats.owner ? "Owner intelligence view" : "Member view"}</span>
                <span style={chip}>AI routing hidden behind rooms</span>
              </div>
              <div className="vf-actions" style={{ marginTop: 20 }}>
                <Link href="/projects" style={goldButton}>Open Projects</Link>
                <Link href="/pain-feed" style={ghostButton}>Open Pain Feed</Link>
                <Link href="/submit" style={ghostButton}>Create Deal</Link>
                <Link href="/pain" style={ghostButton}>Submit Pain</Link>
                <Link href="/messages" style={ghostButton}>Messages</Link>
              </div>
            </div>

            <aside style={{ ...glass, background: "rgba(0,0,0,.22)" }}>
              <div style={label}>AI Noticed</div>
              <h2 style={{ margin: "10px 0", fontSize: 30, lineHeight: 1.05 }}>What matters now</h2>
              <p style={{ ...muted, fontSize: 16 }}>{aiRead}</p>
              <div style={{ marginTop: 16, border: "1px solid rgba(232,196,107,.22)", borderRadius: 18, padding: 14, background: "rgba(232,196,107,.07)" }}>
                <div style={{ ...label, fontSize: 11 }}>Best Next Move</div>
                <p style={{ color: "#f8e7b0", fontWeight: 900, margin: "8px 0 0", lineHeight: 1.45 }}>{nextMove}</p>
              </div>
            </aside>
          </div>
        </section>

        <section className="vf-grid" style={{ marginBottom: 18 }}>
          <CountTile labelText="Projects" value={dealCount} caption="Deal rooms and opportunity command files." tone="gold" />
          <CountTile labelText="Pain" value={painCount} caption="Problem rooms and pressure signals." tone="red" />
          <CountTile labelText="Messages" value={msgCount} caption="Controlled member and owner conversations." tone="green" />
          <CountTile labelText="Members" value={memberCount} caption="Network capacity available for routing." tone="blue" />
        </section>

        <section style={panel}>
          <div style={label}>Hidden Routing Engine</div>
          <h2 style={{ fontSize: "clamp(34px,6vw,62px)", lineHeight: .95, letterSpacing: "-.055em", margin: "10px 0 12px" }}>
            AI routing stays behind the curtain.
          </h2>
          <p style={{ ...muted, fontSize: 18, maxWidth: 960 }}>
            Signals, routing paths, introductions, and match scoring should support the experience without becoming the experience. The member sees rooms, recommendations, and action — not internal plumbing.
          </p>
          <div className="vf-two" style={{ marginTop: 18 }}>
            <div style={glass}>
              <div style={label}>Operating Pressure</div>
              <ScoreLine title="Pressure load" value={pressureScore} caption={`${alertCount} alerts · ${painCount} pain rooms · background routing active`} />
              <ScoreLine title="Opportunity heat" value={opportunityScore} caption={`${dealCount} projects and ${painCount} problem signals feeding intelligence`} />
              <ScoreLine title="Network movement" value={networkScore} caption={`${msgCount} messages · ${activityCount} activity · ${memberCount} members`} />
            </div>
            <div style={glass}>
              <div style={label}>AI Routing Premise</div>
              <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
                {[
                  "Read every deal and pain record like an operator.",
                  "Infer buyer, lender, contractor, operator, and partner fit.",
                  "Show the room and next move, not the routing database.",
                  "Escalate pressure only when action is needed.",
                ].map((item) => (
                  <div key={item} style={{ border: "1px solid rgba(157,243,191,.16)", borderRadius: 15, padding: 12, background: "rgba(157,243,191,.055)", color: "#dbeafe", fontWeight: 850 }}>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section style={panel}>
          <div style={label}>Primary Member Paths</div>
          <h2 style={{ fontSize: 42, lineHeight: 1, margin: "10px 0 14px", letterSpacing: "-.045em" }}>
            Simple front door. Smart backend.
          </h2>
          <div className="vf-grid">
            <ActionCard primary tag="Deals" title="Projects" body="Open deal rooms, review economics, photos, summaries, and next-best action." href="/projects" />
            <ActionCard primary tag="Pressure" title="Pain Feed" body="Review operational problems, urgency, bottlenecks, and resolution paths." href="/pain-feed" />
            <ActionCard tag="Create" title="Create Deal" body="Submit an opportunity and let VaultForge build the intelligence room." href="/submit" />
            <ActionCard tag="Einstein Intake" title="Submit Pain" body="Send a real-world problem into the AI routing brain." href="/pain" />
            <ActionCard tag="Communication" title="Messages" body="Keep owner/member communication tied to the opportunity or problem." href="/messages" />
          </div>
        </section>

        <footer style={{ borderTop: "1px solid rgba(255,255,255,.10)", color: "#94a3b8", padding: "20px 0", display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", letterSpacing: ".18em", fontSize: 12, textTransform: "uppercase" }}>
          <span>VaultForge OS</span>
          <span>AI Routing Behind Rooms</span>
          <span>Private Real Estate Intelligence Network</span>
        </footer>
      </div>
    </main>
  );
}
