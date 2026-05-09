"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

const OWNER_EMAIL = "bcrsoutheast@gmail.com";

type Access = {
  email?: string;
  owner?: boolean;
  profile_complete?: boolean;
  payment_status?: string;
  access_status?: string;
  paid?: boolean;
  unlocked?: boolean;
  next_step?: string;
};

type Stats = {
  deals: number;
  members: number;
  bucket: number;
  messages: number;
  alerts: number;
  pain: number;
  routing: number;
  activity: number;
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

const STATIC_WINDOWS = [
  {
    state: "Georgia",
    code: "GA-FLIP",
    title: "Georgia Flip Demand",
    thesis: "Rehab demand, distressed inventory, buyer appetite, contractor need, and lender pressure.",
    href: "/alerts",
  },
  {
    state: "Tennessee",
    code: "TN-LAND",
    title: "Tennessee Land Watch",
    thesis: "Acreage, builder lots, entitlement opportunities, zoning signals, and development pressure.",
    href: "/projects",
  },
  {
    state: "Alabama",
    code: "AL-DISTRESS",
    title: "Alabama Distress Corridor",
    thesis: "Distressed sellers, stalled rehabs, funding gaps, contractor problems, and rescue opportunities.",
    href: "/pain-submit",
  },
  {
    state: "Florida",
    code: "FL-BUYER",
    title: "Florida Buyer Demand",
    thesis: "Buyer appetite, rental demand, capital movement, short-term rental interest, and disposition pressure.",
    href: "/buy-bucket",
  },
  {
    state: "North Carolina",
    code: "NC-SC-MF",
    title: "Carolinas Multifamily Value Add",
    thesis: "Multifamily value-add demand, operator gaps, lender appetite, and rent-growth corridors.",
    href: "/network",
  },
  {
    state: "Texas",
    code: "TX-CAP",
    title: "Texas Capital & Land Flow",
    thesis: "Larger capital needs, land plays, development demand, private money, and investor flow.",
    href: "/alerts",
  },
];

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(232,196,107,.18), transparent 28%), radial-gradient(circle at top right, rgba(157,243,191,.13), transparent 25%), radial-gradient(circle at bottom right, rgba(181,92,255,.18), transparent 28%), linear-gradient(180deg,#02040a 0%,#071326 48%,#030509 100%)",
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
  background:
    "linear-gradient(145deg, rgba(0,0,0,.38), rgba(255,255,255,.045))",
  border: "1px solid rgba(157,243,191,.24)",
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

const greenEyebrow: React.CSSProperties = { ...eyebrow, color: "#9df3bf" };

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

function isOwner(email: string, access: Access | null) {
  return cleanEmail(email) === OWNER_EMAIL || access?.owner === true;
}

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return {};
  }
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

function dealRoomHref(alert: FeedAlert) {
  const itemId = String(alert.item_id || "").trim();
  if (!itemId) return "";
  return `/deal-room/${encodeURIComponent(itemId)}`;
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

function MarketWindowCard({
  base,
  live,
}: {
  base: typeof STATIC_WINDOWS[number];
  live?: MarketWindow;
}) {
  const tone = statusTone(live?.status || "quiet");

  return (
    <article style={{ ...terminal, borderColor: `${tone}66` }}>
      <div style={{ ...greenEyebrow, color: tone }}>{base.code}</div>
      <h2 style={{ fontSize: 34, lineHeight: 1, margin: "0 0 10px" }}>{base.title}</h2>
      <p style={{ ...muted, fontSize: 17 }}>{base.thesis}</p>

      <div style={{ margin: "16px 0" }}>
        <span style={{ ...chip, color: tone, borderColor: `${tone}88` }}>
          {live?.status || "quiet"}
        </span>
        <span style={chip}>{live?.total_signals || 0} total signals</span>
        <span style={chip}>{live?.pain_signals || 0} pain</span>
        <span style={chip}>{live?.capital_needed || 0} capital</span>
        <span style={chip}>{live?.buyer_needed || 0} buyer</span>
        <span style={chip}>{live?.operator_needed || 0} operator</span>
      </div>

      <Link href={base.href} style={btn}>Open Window</Link>
    </article>
  );
}

function AlertCard({ alert }: { alert: FeedAlert }) {
  const tone = priorityTone(alert.priority);

  return (
    <article style={{ ...terminal, borderColor: `${tone}66` }}>
      <div style={{ ...greenEyebrow, color: tone }}>
        {alert.priority || "signal"} · {alert.alert_type || "opportunity"} · score {alert.score || 0}
      </div>
      <h3 style={{ fontSize: 30, lineHeight: 1.05, margin: "0 0 10px" }}>
        {alert.title || "Intelligence Signal"}
      </h3>
      <p style={{ ...muted, fontSize: 17 }}>{alert.message}</p>

      <div style={{ margin: "14px 0" }}>
        {alert.state && <span style={chip}>{alert.state}</span>}
        {alert.market && <span style={chip}>{alert.market}</span>}
        {alert.source && <span style={chip}>{alert.source}</span>}
        {alert.source_table && <span style={chip}>{alert.source_table}</span>}
        {alert.member_name && <span style={chip}>{alert.member_name}</span>}
      </div>

      <Link href={`/signals/${encodeURIComponent(alert.id)}`} style={btn}>Open Exact Signal</Link>

      {dealRoomHref(alert) && (
        <Link href={dealRoomHref(alert)} style={ghost}>Open Exact Deal Room</Link>
      )}

      <Link href={alert.safe_href || "/projects"} style={ghost}>Open Work Area</Link>
    </article>
  );
}

function LockedScreen({ reason }: { reason: "login" | "profile" | "payment" | "loading" }) {
  return (
    <main style={page}>
      <div style={wrap}>
        <section style={hero}>
          <div style={greenEyebrow}>VaultForge Intelligence Map</div>

          <h1 style={{ fontSize: "clamp(54px,12vw,100px)", lineHeight: 0.88, margin: "0 0 18px" }}>
            {reason === "loading"
              ? "Checking intelligence access..."
              : reason === "login"
              ? "Login required."
              : reason === "profile"
              ? "Complete your profile first."
              : "Activate access first."}
          </h1>

          <p style={{ ...muted, fontSize: 21 }}>
            The Intelligence Map uses profile, market, role, strategy, deal, and pain data to create the member-facing terminal.
          </p>

          {reason === "login" && <Link href="/login" style={btn}>Login / Create Access</Link>}
          {reason === "profile" && <Link href="/profile" style={btn}>Complete Profile</Link>}
          {reason === "payment" && <Link href="/payment" style={btn}>Activate Access</Link>}
          <Link href="/dashboard" style={ghost}>Dashboard</Link>
        </section>
      </div>
    </main>
  );
}

export default function IntelligencePage() {
  const [email, setEmail] = useState("");
  const [access, setAccess] = useState<Access | null>(null);
  const [lockReason, setLockReason] = useState<"loading" | "login" | "profile" | "payment" | "open">("loading");
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
  const [status, setStatus] = useState("Loading intelligence map...");

  async function load() {
    setStatus("Loading intelligence map...");

    try {
      const currentEmail = getEmail();
      setEmail(currentEmail);

      if (!currentEmail) {
        setLockReason("login");
        setStatus("");
        return;
      }

      const accessRes = await fetch(`/api/member/access?email=${encodeURIComponent(currentEmail)}`, {
        cache: "no-store",
        headers: { "x-vf-email": currentEmail },
      });

      const accessData = await safeJson(accessRes);
      setAccess(accessData);

      if (!accessData?.owner && !accessData?.profile_complete) {
        setLockReason("profile");
        setStatus("");
        return;
      }

      if (!accessData?.owner && !accessData?.paid && !accessData?.unlocked) {
        setLockReason("payment");
        setStatus("");
        return;
      }

      const owner = isOwner(currentEmail, accessData);

      const [statsRes, feedRes] = await Promise.all([
        fetch(`/api/dashboard/stats?email=${encodeURIComponent(currentEmail)}&owner=${owner ? "1" : "0"}`, {
          cache: "no-store",
          headers: {
            "x-vf-email": currentEmail,
            "x-vf-admin": owner ? "1" : "0",
          },
        }),
        fetch(`/api/intelligence/feed?email=${encodeURIComponent(currentEmail)}&owner=${owner ? "1" : "0"}`, {
          cache: "no-store",
          headers: {
            "x-vf-email": currentEmail,
            "x-vf-admin": owner ? "1" : "0",
          },
        }),
      ]);

      const statsData = await safeJson(statsRes);
      const payload = statsData?.stats || statsData || {};
      setStats({
        deals: Number(payload.deals || 0),
        members: Number(payload.members || 0),
        bucket: Number(payload.bucket || 0),
        messages: Number(payload.messages || 0),
        alerts: Number(payload.alerts || 0),
        pain: Number(payload.pain || 0),
        routing: Number(payload.routing || 0),
        activity: Number(payload.activity || 0),
      });

      const feedData = await safeJson(feedRes);
      setFeed(feedData || {});

      setLockReason("open");
      setStatus("");
    } catch (error: any) {
      setLockReason("login");
      setStatus(error?.message || "");
    }
  }

  useEffect(() => {
    load();
  }, []);

  const owner = useMemo(() => isOwner(email, access), [email, access]);

  const liveWindowByState = useMemo(() => {
    const map = new Map<string, MarketWindow>();
    for (const item of feed.market_windows || []) {
      map.set(String(item.state || "").toLowerCase(), item);
    }
    return map;
  }, [feed.market_windows]);

  const alerts = feed.alerts || [];

  if (lockReason !== "open") {
    return <LockedScreen reason={lockReason} />;
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
          .vf-intel-actions {
            display: grid !important;
            grid-template-columns: 1fr !important;
            gap: 10px !important;
          }

          .vf-intel-actions > * {
            width: 100%;
            margin: 0 !important;
            box-sizing: border-box;
          }
        }
      `}</style>

      <div style={wrap}>
        <section style={hero}>
          <div style={greenEyebrow}>VaultForge Intelligence Map · {owner ? "Owner + Member View" : "Member View"}</div>

          <h1 style={{ fontSize: "clamp(58px,12vw,108px)", lineHeight: 0.86, margin: "0 0 18px" }}>
            Live real estate signal map.
          </h1>

          <p style={{ ...muted, fontSize: 22 }}>
            This now reads the read-only intelligence feed. It turns profiles, deals, pain, markets,
            buy boxes, and roles into safe opportunity signals without writing to the database.
          </p>

          <div className="vf-intel-actions" style={{ marginTop: 18 }}>
            <Link href="/dashboard" style={ghost}>Dashboard</Link>
            <button type="button" onClick={load} style={btn}>Refresh Intelligence</button>
            <Link href="/alerts" style={ghost}>Smart Alerts</Link>
            <Link href="/routing-inbox" style={ghost}>Routing Inbox</Link>
            <Link href="/introductions" style={ghost}>Introductions</Link>
            <Link href="/submit" style={ghost}>Create Deal</Link>
            <Link href="/pain-submit" style={ghost}>Pain Button</Link>
            <Link href="/projects" style={ghost}>Deal Rooms</Link>
            <Link href="/buy-bucket" style={ghost}>Buy Bucket</Link>
            <Link href="/network" style={ghost}>Network</Link>
            {owner && <Link href="/admin-intelligence" style={btn}>Owner Control</Link>}
            <Link href="/logout" style={danger}>Logout</Link>
          </div>

          {status && <p style={{ ...muted, marginTop: 16 }}>{status}</p>}
          {feed.error && <p style={{ color: "#ffd0d0", fontWeight: 900 }}>{feed.error}</p>}
        </section>

        <section style={statGrid}>
          <StatCard label="Deal Rooms" value={stats.deals} detail="Live opportunities available for routing." href="/projects" />
          <StatCard label="Members" value={stats.members} detail="Network intelligence nodes." href="/network" />
          <StatCard label="Feed Alerts" value={feed.counts?.generated_alerts || 0} detail="Read-only generated intelligence signals." href="/intelligence" />
          <StatCard label="Pain Signals" value={feed.counts?.pain || stats.pain} detail="Friction that can become opportunity." href="/pain-submit" />
          <StatCard label="Buy Bucket" value={stats.bucket} detail="Saved demand and acquisition targets." href="/buy-bucket" />
          <StatCard label="Profiles Scanned" value={feed.counts?.target_profiles || 0} detail={owner ? "Owner global scan." : "Your member profile."} href="/profile" />
        </section>

        <section style={hero}>
          <div style={greenEyebrow}>Market Windows</div>
          <h2 style={{ fontSize: 42, lineHeight: 1, margin: "0 0 14px" }}>
            Core launch-market intelligence windows.
          </h2>
          <p style={{ ...muted, fontSize: 19 }}>
            These windows now show live signal counts from the read-only feed. Quiet does not mean broken;
            it means there are not enough matching records in that category yet.
          </p>
        </section>

        <section style={grid}>
          {STATIC_WINDOWS.map((window) => (
            <MarketWindowCard
              key={window.code}
              base={window}
              live={liveWindowByState.get(window.state.toLowerCase())}
            />
          ))}
        </section>

        <section style={{ ...hero, marginTop: 22 }}>
          <div style={greenEyebrow}>Generated Intelligence Feed</div>
          <h2 style={{ fontSize: 42, lineHeight: 1, margin: "0 0 14px" }}>
            Read-only smart signals.
          </h2>
          <p style={{ ...muted, fontSize: 19 }}>
            These are generated from existing data only. No database writes. No automatic member actions.
            This is the safe first step before real stored alerts and automation.
          </p>
        </section>

        {alerts.length === 0 ? (
          <section style={hero}>
            <strong>No generated signals yet.</strong>
            <p style={muted}>
              Add or complete more profile buy-box fields, create deal rooms with routing needs, or submit pain signals.
              The feed will begin showing matches once there is enough overlap.
            </p>
          </section>
        ) : (
          <section style={grid}>
            {alerts.map((alert) => (
              <AlertCard key={alert.id} alert={alert} />
            ))}
          </section>
        )}

        <section style={{ ...hero, marginTop: 22 }}>
          <div style={greenEyebrow}>Security Model</div>
          <h2 style={{ fontSize: 42, lineHeight: 1, margin: "0 0 14px" }}>
            Member intelligence, owner control.
          </h2>
          <div style={grid}>
            <div style={card}>
              <div style={greenEyebrow}>Members Can</div>
              <p style={muted}>
                View safe intelligence windows, submit deals, submit pain signals, save deals, message,
                review their own generated signals, and train their profile/buy box.
              </p>
            </div>
            <div style={card}>
              <div style={greenEyebrow}>Owner/Admin Can</div>
              <p style={muted}>
                View global signals, tune routing, moderate members, activate/lock accounts,
                review system-wide signals, and later approve stored automation.
              </p>
            </div>
            <div style={card}>
              <div style={greenEyebrow}>Routing Inbox</div>
              <p style={muted}>
                Members can review routed opportunities that admin has logged toward their role/email.
              </p>
              <Link href="/routing-inbox" style={btn}>Open Routing Inbox</Link>
            </div>

            <div style={card}>
              <div style={greenEyebrow}>Introductions</div>
              <p style={muted}>
                Members can review controlled introductions staged by owner/admin after response review.
              </p>
              <Link href="/introductions" style={btn}>Open Introductions</Link>
            </div>

            <div style={card}>
              <div style={greenEyebrow}>Current Build Mode</div>
              <p style={muted}>
                Read-only generation plus owner-approved routing logs. No automatic dispatch yet.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
