"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

const OWNER_EMAIL = "bcrsoutheast@gmail.com";

type Stats = {
  deals: number;
  members: number;
  bucket: number;
  messages: number;
  alerts: number;
  pain: number;
  routing: number;
  activity: number;
  admin?: {
    owner?: boolean;
    pendingDeals?: number;
    archivedDeals?: number;
    lockedMembers?: number;
    paymentRequiredMembers?: number;
    activeMembers?: number;
  };
};

type FeedAlert = {
  id: string;
  source: string;
  alert_type: string;
  priority: string;
  score: number;
  title: string;
  message: string;
  member_email?: string;
  member_name?: string;
  item_id?: string;
  item_title?: string;
  state?: string;
  market?: string;
  source_table?: string;
  safe_href?: string;
  created_at?: string;
};

type MarketWindow = {
  state: string;
  total_signals: number;
  pain_signals: number;
  capital_needed: number;
  buyer_needed: number;
  operator_needed: number;
  status: string;
};

type Feed = {
  ok?: boolean;
  mode?: string;
  owner?: boolean;
  alerts?: FeedAlert[];
  counts?: {
    profiles?: number;
    target_profiles?: number;
    deals?: number;
    pain?: number;
    generated_alerts?: number;
  };
  market_windows?: MarketWindow[];
  note?: string;
  error?: string;
};

type StoredFeed = {
  ok?: boolean;
  owner?: boolean;
  email?: string;
  table?: string;
  alerts?: FeedAlert[];
  counts?: {
    stored_alerts?: number;
    urgent?: number;
    high?: number;
    medium?: number;
  };
  note?: string;
  error?: string;
};

type ControlWindow = {
  code: string;
  title: string;
  purpose: string;
  automatedJob: string;
  adminJob: string;
  risk: string;
  href: string;
  tone: "gold" | "green" | "purple" | "red";
};

const WINDOWS: ControlWindow[] = [
  {
    code: "ROUTE",
    title: "Smart Routing Engine",
    purpose: "Scores deals, members, pain signals, markets, roles, needs, and can-provide fields.",
    automatedJob: "Auto-create buyer, lender, operator, contractor, JV, pain, and deal-opportunity alerts.",
    adminJob: "Tune thresholds, review edge cases, and boost high-value opportunities.",
    risk: "Should never expose private member contact details unless access is authorized.",
    href: "/alerts",
    tone: "green",
  },
  {
    code: "ACTIONS",
    title: "Routing Action Log",
    purpose: "Shows owner/admin decisions logged from routing rooms: buyer, lender, operator, contractor, watch, and needs review.",
    automatedJob: "No automatic dispatch yet. This is a safe audit trail before automation.",
    adminJob: "Review logged routing decisions and open the exact routing room, signal, or deal room.",
    risk: "Must remain owner-only until member-specific action visibility is finalized.",
    href: "/admin-routing",
    tone: "gold",
  },
  {
    code: "RESPONSES",
    title: "Member Response Monitor",
    purpose: "Shows how members responded to routed opportunities: Interested, Need More Info, Request Call, Request Intro, or Pass.",
    automatedJob: "No automatic introductions yet. This safely captures member intent before dispatch.",
    adminJob: "Review who is interested and decide when to move to controlled introductions.",
    risk: "Do not expose private contact details or auto-introduce members until controlled intro workflow is built.",
    href: "/admin-routing-responses",
    tone: "green",
  },
  {
    code: "INTRO",
    title: "Controlled Introductions",
    purpose: "Shows drafted introductions created from member responses before anything is sent or exposed.",
    automatedJob: "No automatic sending yet. This is the controlled intro staging area.",
    adminJob: "Review drafted introductions and decide what should be approved, paused, or prepared for dispatch later.",
    risk: "Introductions must stay owner-controlled until a safe approval and dispatch workflow exists.",
    href: "/admin-introductions",
    tone: "gold",
  },
  {
    code: "DISPATCH",
    title: "Controlled Dispatch Queue",
    purpose: "Shows approved/ready introductions staged for future controlled dispatch.",
    automatedJob: "No sending yet. This queue only shows what is ready for future dispatch.",
    adminJob: "Review ready introductions before any notification or intro send layer is built.",
    risk: "Must remain read-only until safe notification and send controls are added.",
    href: "/admin-dispatch-queue",
    tone: "purple",
  },
  {
    code: "INTRO RESP",
    title: "Introduction Response Monitor",
    purpose: "Shows how members respond to exact controlled introductions after they are staged.",
    automatedJob: "No automatic follow-up yet. This is response intelligence only.",
    adminJob: "Review interest, need-details, request-call, and pass responses before any manual outreach.",
    risk: "Must remain read-only until controlled follow-up workflow is built.",
    href: "/admin-introduction-responses",
    tone: "green",
  },
  {
    code: "ACTIVITY",
    title: "Global Activity Stream",
    purpose: "Unifies routing actions, controlled introductions, and member responses into one Bloomberg-style operational feed.",
    automatedJob: "Read-only stream only. No automation or notifications are triggered.",
    adminJob: "Monitor platform movement and open the exact deal, signal, intro, or routing room from one place.",
    risk: "Must remain read-only until automation permissions are hardened.",
    href: "/activity",
    tone: "purple",
  },
  {
    code: "MEMBERS",
    title: "Member Intelligence Graph",
    purpose: "Tracks buyers, lenders, sellers, contractors, operators, developers, and deal sources.",
    automatedJob: "Detect useful member-to-member and member-to-deal fits from profile and activity data.",
    adminJob: "Activate, suspend, verify, and monitor quality of members.",
    risk: "Admin controls must remain owner-only. Members should only see safe summaries.",
    href: "/network",
    tone: "purple",
  },
  {
    code: "PAIN",
    title: "Pain Signal Router",
    purpose: "Converts problems into opportunity: funding gaps, stalled jobs, seller pain, contractor problems.",
    automatedJob: "Route pain to members who can provide capital, buyers, operators, contractors, or JV support.",
    adminJob: "Review urgent/high-dollar pain events and manually intervene when needed.",
    risk: "Urgent cases need clear status and message trails.",
    href: "/pain-submit",
    tone: "red",
  },
  {
    code: "DEALS",
    title: "Deal Room Intelligence",
    purpose: "Turns submitted deals into routeable data: asset, market, spread, photos, strategy, seller situation.",
    automatedJob: "Score opportunity quality and push matched alerts into member feeds.",
    adminJob: "Moderate spam, archive stale opportunities, and review high-value deals.",
    risk: "Exact address/private notes should stay protected behind correct access.",
    href: "/projects",
    tone: "gold",
  },
  {
    code: "CAPITAL",
    title: "Capital Gap Monitor",
    purpose: "Finds where deals need lenders, private money, JV equity, or bridge funding.",
    automatedJob: "Auto-route capital-needed events to lender/private money profiles.",
    adminJob: "Watch capital shortages by market and flag high-value matches.",
    risk: "Do not represent funding as guaranteed. Route introductions only.",
    href: "/alerts",
    tone: "green",
  },
  {
    code: "HEALTH",
    title: "Network Health Control",
    purpose: "Tracks active members, inactive members, dead zones, alert volume, and message velocity.",
    automatedJob: "Surface dead markets, demand spikes, and missing supply/provider roles.",
    adminJob: "Decide where to recruit more buyers, lenders, contractors, or operators.",
    risk: "Metrics must be real; fake counts must be removed over time.",
    href: "/admin",
    tone: "purple",
  },
];

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(232,196,107,.18), transparent 28%), radial-gradient(circle at top right, rgba(181,92,255,.18), transparent 27%), radial-gradient(circle at bottom right, rgba(157,243,191,.13), transparent 28%), linear-gradient(180deg,#02040a 0%,#071326 48%,#030509 100%)",
  color: "white",
  padding: "28px 18px 100px",
  fontFamily: "Arial, sans-serif",
};

const wrap: React.CSSProperties = { maxWidth: 1240, margin: "0 auto" };

const hero: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.34)",
  background:
    "linear-gradient(145deg, rgba(232,196,107,.12), rgba(181,92,255,.10), rgba(255,255,255,.035))",
  borderRadius: 34,
  padding: 26,
  marginBottom: 22,
  boxShadow: "0 30px 90px rgba(0,0,0,.34)",
};

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))",
  gap: 18,
};

const statGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
  gap: 14,
  marginBottom: 22,
};

const card: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.13)",
  background:
    "linear-gradient(145deg, rgba(181,92,255,.10), rgba(232,196,107,.055), rgba(255,255,255,.03))",
  borderRadius: 28,
  padding: 22,
  boxShadow: "0 26px 80px rgba(0,0,0,.34)",
};

const terminal: React.CSSProperties = {
  ...card,
  background: "linear-gradient(145deg, rgba(0,0,0,.38), rgba(255,255,255,.045))",
};

const btn: React.CSSProperties = {
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
  margin: "6px 6px 0 0",
  minHeight: 46,
};

const ghost: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  color: "white",
  border: "1px solid rgba(255,255,255,.18)",
  background: "rgba(255,255,255,.055)",
  borderRadius: 999,
  padding: "13px 18px",
  fontWeight: 900,
  textDecoration: "none",
  cursor: "pointer",
  margin: "6px 6px 0 0",
  minHeight: 46,
};

const danger: React.CSSProperties = {
  ...ghost,
  color: "#ffd0d0",
  border: "1px solid rgba(255,120,120,.38)",
};

const eyebrow: React.CSSProperties = {
  color: "#e8c46b",
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

function cleanEmail(value: unknown) {
  return String(value || "").trim().toLowerCase();
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

function hasAdminCookie() {
  return (
    readCookie("vf_admin") === "1" ||
    readCookie("isAdmin") === "true" ||
    readCookie("vf_email").toLowerCase() === OWNER_EMAIL ||
    readCookie("vf_admin_email").toLowerCase() === OWNER_EMAIL
  );
}

function isOwner(email: string) {
  return cleanEmail(email) === OWNER_EMAIL || hasAdminCookie();
}

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

function toneColor(tone: ControlWindow["tone"]) {
  if (tone === "green") return "#9df3bf";
  if (tone === "purple") return "#d8b5ff";
  if (tone === "red") return "#ff9f9f";
  return "#f5d978";
}

function priorityTone(priority: string) {
  const p = String(priority || "").toLowerCase();
  if (p === "urgent") return "#ff9f9f";
  if (p === "high") return "#f5d978";
  if (p === "medium") return "#9df3bf";
  return "#d8b5ff";
}

function statusTone(status: string) {
  const s = String(status || "").toLowerCase();
  if (s === "active") return "#9df3bf";
  if (s === "watching") return "#f5d978";
  return "#d8b5ff";
}

function StatCard({ label, value, detail, href }: { label: string; value: number | string; detail: string; href: string }) {
  return (
    <Link href={href} style={{ ...card, color: "white", textDecoration: "none", display: "block" }}>
      <div style={greenEyebrow}>{label}</div>
      <div style={{ fontSize: 46, fontWeight: 950, lineHeight: 1 }}>{value}</div>
      <p style={{ ...muted, marginBottom: 0 }}>{detail}</p>
    </Link>
  );
}

function ControlCard({ window }: { window: ControlWindow }) {
  const tone = toneColor(window.tone);

  return (
    <article style={{ ...terminal, borderColor: `${tone}66` }}>
      <div style={{ ...greenEyebrow, color: tone }}>{window.code}</div>
      <h2 style={{ fontSize: 34, lineHeight: 1, margin: "0 0 12px" }}>{window.title}</h2>
      <p style={{ ...muted, fontSize: 17 }}>{window.purpose}</p>

      <div style={{ display: "grid", gap: 12, margin: "16px 0" }}>
        <div style={{ border: `1px solid ${tone}55`, borderRadius: 18, padding: 14, background: "rgba(0,0,0,.20)" }}>
          <div style={{ ...eyebrow, color: tone, marginBottom: 8 }}>Automation Should Do</div>
          <strong>{window.automatedJob}</strong>
        </div>

        <div style={{ border: "1px solid rgba(232,196,107,.26)", borderRadius: 18, padding: 14, background: "rgba(232,196,107,.06)" }}>
          <div style={eyebrow}>Admin Should Do</div>
          <strong>{window.adminJob}</strong>
        </div>

        <div style={{ border: "1px solid rgba(255,120,120,.26)", borderRadius: 18, padding: 14, background: "rgba(255,120,120,.06)" }}>
          <div style={{ ...eyebrow, color: "#ffb3b3" }}>Security Rule</div>
          <strong>{window.risk}</strong>
        </div>
      </div>

      <Link href={window.href} style={btn}>Open Work Area</Link>
    </article>
  );
}

function AlertCard({
  alert,
  email,
  storingId,
  onStore,
}: {
  alert: FeedAlert;
  email: string;
  storingId: string;
  onStore: (alert: FeedAlert) => void;
}) {
  const tone = priorityTone(alert.priority);

  return (
    <article style={{ ...terminal, borderColor: `${tone}66` }}>
      <div style={{ ...greenEyebrow, color: tone }}>
        {alert.priority || "signal"} · {alert.alert_type || "opportunity"} · score {alert.score || 0}
      </div>
      <h3 style={{ fontSize: 30, lineHeight: 1.05, margin: "0 0 10px" }}>{alert.title}</h3>
      <p style={{ ...muted, fontSize: 17 }}>{alert.message}</p>

      <div style={{ margin: "14px 0" }}>
        {alert.member_name && <span style={chip}>{alert.member_name}</span>}
        {alert.member_email && <span style={chip}>{alert.member_email}</span>}
        {alert.state && <span style={chip}>{alert.state}</span>}
        {alert.market && <span style={chip}>{alert.market}</span>}
        {alert.source && <span style={chip}>{alert.source}</span>}
        {alert.source_table && <span style={chip}>{alert.source_table}</span>}
      </div>

      <Link href={alert.safe_href || "/projects"} style={btn}>Open Work Area</Link>

      <button
        type="button"
        style={ghost}
        disabled={storingId === alert.id}
        onClick={() => onStore(alert)}
      >
        {storingId === alert.id ? "Storing..." : "Store Approved Signal"}
      </button>
    </article>
  );
}

function MarketRow({ item }: { item: MarketWindow }) {
  const tone = statusTone(item.status);

  return (
    <div style={{ ...card, borderColor: `${tone}66` }}>
      <div style={{ ...greenEyebrow, color: tone }}>{item.state} · {item.status}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <span style={chip}>{item.total_signals} total</span>
        <span style={chip}>{item.pain_signals} pain</span>
        <span style={chip}>{item.capital_needed} capital</span>
        <span style={chip}>{item.buyer_needed} buyer</span>
        <span style={chip}>{item.operator_needed} operator</span>
      </div>
    </div>
  );
}


async function storeSignal(alert: FeedAlert, email: string) {
  const res = await fetch("/api/intelligence/store", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-vf-email": email,
      "x-vf-admin": "1",
    },
    body: JSON.stringify({
      email,
      owner: "1",
      admin_email: email,
      alert,
    }),
  });

  const data = await safeJson(res);

  if (!res.ok || data?.ok === false) {
    throw new Error(data?.error || data?.details || "Could not store signal.");
  }

  return data;
}

function Locked() {
  return (
    <main style={page}>
      <div style={wrap}>
        <section style={hero}>
          <div style={greenEyebrow}>Owner Intelligence Control</div>
          <h1 style={{ fontSize: "clamp(54px,12vw,100px)", lineHeight: 0.88, margin: "0 0 18px" }}>
            Owner access required.
          </h1>
          <p style={{ ...muted, fontSize: 21 }}>
            This page is the owner control map for routing, automation, moderation, and network health.
            Members should use the regular Intelligence Map instead.
          </p>
          <Link href="/intelligence" style={btn}>Member Intelligence Map</Link>
          <Link href="/dashboard" style={ghost}>Dashboard</Link>
          <Link href="/admin-login" style={ghost}>Admin Login</Link>
        </section>
      </div>
    </main>
  );
}

export default function AdminIntelligencePage() {
  const [email, setEmail] = useState("");
  const [owner, setOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    deals: 0,
    members: 0,
    bucket: 0,
    messages: 0,
    alerts: 0,
    pain: 0,
    routing: 0,
    activity: 0,
  });
  const [feed, setFeed] = useState<Feed>({});
  const [storedFeed, setStoredFeed] = useState<StoredFeed>({});
  const [storingId, setStoringId] = useState("");
  const [storeMessage, setStoreMessage] = useState("");

  async function load() {
    setLoading(true);

    try {
      const currentEmail = getEmail();
      const currentOwner = isOwner(currentEmail);
      setEmail(currentEmail);
      setOwner(currentOwner);

      if (!currentOwner) {
        setLoading(false);
        return;
      }

      const [statsRes, feedRes, storedRes] = await Promise.all([
        fetch(`/api/dashboard/stats?email=${encodeURIComponent(currentEmail)}&owner=1`, {
          cache: "no-store",
          headers: {
            "x-vf-email": currentEmail,
            "x-vf-admin": "1",
          },
        }),
        fetch(`/api/intelligence/feed?email=${encodeURIComponent(currentEmail)}&owner=1`, {
          cache: "no-store",
          headers: {
            "x-vf-email": currentEmail,
            "x-vf-admin": "1",
          },
        }),
        fetch(`/api/intelligence/stored?email=${encodeURIComponent(currentEmail)}&owner=1`, {
          cache: "no-store",
          headers: {
            "x-vf-email": currentEmail,
            "x-vf-admin": "1",
          },
        }),
      ]);

      const data = await safeJson(statsRes);
      const payload = data?.stats || data || {};

      setStats({
        deals: Number(payload.deals || 0),
        members: Number(payload.members || 0),
        bucket: Number(payload.bucket || 0),
        messages: Number(payload.messages || 0),
        alerts: Number(payload.alerts || 0),
        pain: Number(payload.pain || 0),
        routing: Number(payload.routing || 0),
        activity: Number(payload.activity || 0),
        admin: payload.admin || data?.admin,
      });

      const feedData = await safeJson(feedRes);
      const storedData = await safeJson(storedRes);
      setFeed(feedData || {});
      setStoredFeed(storedData || {});
    } finally {
      setLoading(false);
    }
  }

  async function handleStore(alert: FeedAlert) {
    if (!owner) {
      setStoreMessage("Only owner/admin can store approved signals.");
      return;
    }

    setStoringId(alert.id);
    setStoreMessage("Storing approved signal...");

    try {
      const result = await storeSignal(alert, email);
      setStoreMessage(result?.message || "Signal stored safely.");

      const storedRes = await fetch(`/api/intelligence/stored?email=${encodeURIComponent(email)}&owner=1`, {
        cache: "no-store",
        headers: {
          "x-vf-email": email,
          "x-vf-admin": "1",
        },
      });
      const storedData = await safeJson(storedRes);
      setStoredFeed(storedData || {});
    } catch (error: any) {
      setStoreMessage(error?.message || "Could not store signal.");
    } finally {
      setStoringId("");
    }
  }

  useEffect(() => {
    load();
  }, []);

  const admin = useMemo(() => stats.admin || {}, [stats.admin]);
  const alerts = feed.alerts || [];
  const urgentAlerts = alerts.filter((alert) => String(alert.priority).toLowerCase() === "urgent");
  const highAlerts = alerts.filter((alert) => String(alert.priority).toLowerCase() === "high");

  if (!loading && !owner) {
    return <Locked />;
  }

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
          .vf-admin-intel-actions {
            display: grid !important;
            grid-template-columns: 1fr !important;
            gap: 10px !important;
          }

          .vf-admin-intel-actions > * {
            width: 100%;
            margin: 0 !important;
            box-sizing: border-box;
          }
        }
      `}</style>

      <div style={wrap}>
        <section style={hero}>
          <div style={greenEyebrow}>VaultForge Owner Intelligence Control</div>

          <h1 style={{ fontSize: "clamp(58px,12vw,108px)", lineHeight: 0.86, margin: "0 0 18px" }}>
            Global signal supervision.
          </h1>

          <p style={{ ...muted, fontSize: 22 }}>
            This now reads the same read-only intelligence feed in owner mode. It gives admin global visibility
            without writing alerts, changing members, or touching auth.
          </p>

          <div className="vf-admin-intel-actions" style={{ marginTop: 18 }}>
            <button type="button" onClick={load} style={btn}>Refresh Owner Signals</button>
            <Link href="/admin" style={btn}>Admin Home</Link>
            <Link href="/activity" style={btn}>Activity Stream</Link>
            <Link href="/member-intelligence" style={btn}>Member Intelligence</Link>
            <Link href="/admin-routing" style={btn}>Admin Routing</Link>
            <Link href="/admin-routing-responses" style={btn}>Response Monitor</Link>
            <Link href="/admin-introductions" style={btn}>Admin Introductions</Link>
            <Link href="/admin-introduction-responses" style={btn}>Intro Responses</Link>
            <Link href="/admin-dispatch-queue" style={btn}>Dispatch Queue</Link>
            <Link href="/intelligence" style={ghost}>Member Intelligence Map</Link>
            <Link href="/alerts" style={ghost}>Smart Alerts</Link>
            <Link href="/network" style={ghost}>Network</Link>
            <Link href="/projects" style={ghost}>Deal Rooms</Link>
            <Link href="/pain-submit" style={ghost}>Pain Button</Link>
            <Link href="/dashboard" style={ghost}>Dashboard</Link>
            <Link href="/logout" style={danger}>Logout</Link>
          </div>

          <div style={{ marginTop: 16 }}>
            <span style={chip}>Owner: {email || OWNER_EMAIL}</span>
            <span style={chip}>Admin Controls: Active</span>
            <span style={chip}>Mode: Read-Only Intelligence Supervision</span>
            {feed.error && <span style={{ ...chip, color: "#ffd0d0", borderColor: "rgba(255,120,120,.4)" }}>{feed.error}</span>}
          </div>

          {storeMessage && (
            <p
              style={{
                color:
                  storeMessage.toLowerCase().includes("could not") ||
                  storeMessage.toLowerCase().includes("only")
                    ? "#ffd0d0"
                    : "#9df3bf",
                fontWeight: 900,
              }}
            >
              {storeMessage}
            </p>
          )}
        </section>

        <section style={statGrid}>
          <StatCard label="Deals" value={stats.deals} detail="Active deal rooms to score and route." href="/projects" />
          <StatCard label="Members" value={stats.members} detail="Network nodes and routing targets." href="/network" />
          <StatCard label="Generated Signals" value={feed.counts?.generated_alerts || 0} detail="Read-only global intelligence feed." href="/admin-intelligence" />
          <StatCard label="Stored Approved" value={storedFeed.counts?.stored_alerts || 0} detail="Saved into vf_match_alerts." href="/admin-intelligence" />
          <StatCard label="Urgent Signals" value={urgentAlerts.length} detail="Highest priority review candidates." href="/admin-intelligence" />
          <StatCard label="High Signals" value={highAlerts.length} detail="Strong opportunity or capital signals." href="/admin-intelligence" />
          <StatCard label="Pain Inputs" value={feed.counts?.pain || stats.pain} detail="Distress/friction opportunity source." href="/pain-submit" />
          <StatCard label="Locked Members" value={Number(admin.lockedMembers || 0)} detail="Members needing admin/payment/profile action." href="/network" />
          <StatCard label="Active Members" value={Number(admin.activeMembers || 0)} detail="Members currently available to route." href="/network" />
        </section>

        <section style={hero}>
          <div style={greenEyebrow}>Operating Rule</div>
          <h2 style={{ fontSize: 42, lineHeight: 1, margin: "0 0 14px" }}>
            Automation handles volume. Admin handles judgment.
          </h2>
          <p style={{ ...muted, fontSize: 19 }}>
            Smart Alerts should detect, score, route, and prioritize. Admin should approve edge cases,
            tune thresholds, moderate bad actors, and intervene only where human judgment adds value.
          </p>
        </section>

        <section style={hero}>
          <div style={greenEyebrow}>Market Window Health</div>
          <h2 style={{ fontSize: 42, lineHeight: 1, margin: "0 0 14px" }}>
            Core state signal map.
          </h2>
          <p style={{ ...muted, fontSize: 19 }}>
            This is based on existing deals and pain records only. Quiet windows mean more data is needed,
            not that the page is broken.
          </p>
        </section>

        <section style={grid}>
          {(feed.market_windows || []).map((item) => (
            <MarketRow key={item.state} item={item} />
          ))}
        </section>

        <section style={{ ...hero, marginTop: 22 }}>
          <div style={greenEyebrow}>Global Read-Only Signal Feed</div>
          <h2 style={{ fontSize: 42, lineHeight: 1, margin: "0 0 14px" }}>
            What the intelligence layer sees.
          </h2>
          <p style={{ ...muted, fontSize: 19 }}>
            These are not stored alerts yet. They are generated safely from existing data to prove the signal logic first.
          </p>
        </section>

        {alerts.length === 0 ? (
          <section style={hero}>
            <strong>No generated owner signals yet.</strong>
            <p style={muted}>
              Complete more member profiles, add deal rooms with routing needs, or submit pain signals.
            </p>
          </section>
        ) : (
          <section style={grid}>
            {alerts.slice(0, 24).map((alert) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                email={email}
                storingId={storingId}
                onStore={handleStore}
              />
            ))}
          </section>
        )}

        <section style={{ ...hero, marginTop: 22 }}>
          <div style={greenEyebrow}>Stored Approved Signals</div>
          <h2 style={{ fontSize: 42, lineHeight: 1, margin: "0 0 14px" }}>
            Approved intelligence saved to vf_match_alerts.
          </h2>
          <p style={{ ...muted, fontSize: 19 }}>
            This confirms the store pipeline is working. These are no longer temporary generated signals;
            they are saved approved signals.
          </p>
          {storedFeed.error && <p style={{ color: "#ffd0d0", fontWeight: 900 }}>{storedFeed.error}</p>}
        </section>

        {(storedFeed.alerts || []).length === 0 ? (
          <section style={hero}>
            <strong>No stored approved signals yet.</strong>
            <p style={muted}>Use “Store Approved Signal” on a generated signal to save it here.</p>
          </section>
        ) : (
          <section style={grid}>
            {(storedFeed.alerts || []).slice(0, 24).map((alert) => (
              <AlertCard
                key={`stored-${alert.id}`}
                alert={alert}
                email={email}
                storingId={storingId}
                onStore={handleStore}
              />
            ))}
          </section>
        )}

        <section style={{ ...hero, marginTop: 22 }}>
          <div style={greenEyebrow}>Control Map</div>
          <h2 style={{ fontSize: 42, lineHeight: 1, margin: "0 0 14px" }}>
            What each intelligence system is supposed to do.
          </h2>
        </section>

        <section style={grid}>
          {WINDOWS.map((window) => (
            <ControlCard key={window.code} window={window} />
          ))}
        </section>
      </div>
    </main>
  );
}
