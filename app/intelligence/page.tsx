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

type MarketWindow = {
  code: string;
  title: string;
  region: string;
  thesis: string;
  signal: string;
  feeds: string[];
  memberUse: string;
  adminUse: string;
  href: string;
  tone: "gold" | "green" | "purple" | "red";
};

const MARKETS: MarketWindow[] = [
  {
    code: "GA-FLIP",
    title: "Georgia Flip Demand",
    region: "Georgia / Atlanta Metro / Northwest GA",
    thesis:
      "Tracks rehab demand, distressed inventory, buyer appetite, contractor need, and lender pressure in Georgia flip corridors.",
    signal: "Flip pressure, buyer demand, rehab execution, capital need",
    feeds: ["Fix & Flip", "Buyer Match", "Contractor Need", "Funding Gap", "Pain Signal"],
    memberUse: "Members see Georgia opportunities, buyer/lender/operator fits, and saved deal intelligence.",
    adminUse: "Owner monitors demand spikes, stuck deals, capital gaps, and high-priority routing.",
    href: "/alerts",
    tone: "green",
  },
  {
    code: "TN-LAND",
    title: "Tennessee Land Watch",
    region: "Tennessee / Growth Corridors / Builder Markets",
    thesis:
      "Tracks acreage, builder lots, entitlement opportunities, zoning signals, and development pressure.",
    signal: "Land absorption, builder demand, entitlement pressure",
    feeds: ["Land", "Builder Lot", "Entitlement", "Development", "Capital Match"],
    memberUse: "Members see land/development signals tied to their buy box and role.",
    adminUse: "Owner watches zoning, builder demand, and development partner gaps.",
    href: "/projects",
    tone: "purple",
  },
  {
    code: "AL-DISTRESS",
    title: "Alabama Distress Corridor",
    region: "Alabama / Secondary Markets / Pain Signals",
    thesis:
      "Tracks distressed sellers, stalled rehabs, funding gaps, contractor problems, and rescue opportunities.",
    signal: "Pain, urgency, lender need, contractor shortage",
    feeds: ["Pain Button", "Funding Gap", "Contractor Needed", "JV Needed", "Urgent"],
    memberUse: "Members see rescue opportunities only when their profile says they can help.",
    adminUse: "Owner identifies high-friction opportunities and routes support fast.",
    href: "/pain-submit",
    tone: "red",
  },
  {
    code: "FL-BUYER",
    title: "Florida Buyer Demand",
    region: "Florida / Investor Demand / High Velocity",
    thesis:
      "Tracks buyer appetite, rental demand, capital movement, short-term rental interest, and disposition pressure.",
    signal: "Buyer surge, rental demand, disposition opportunity",
    feeds: ["Buyer Match", "Short-Term Rental", "Cash Buyer", "Disposition", "Funding"],
    memberUse: "Members see matched Florida opportunities and buyer demand signals.",
    adminUse: "Owner watches buyer demand and routes deals to active capital/buyers.",
    href: "/buy-bucket",
    tone: "gold",
  },
  {
    code: "CAR-MF",
    title: "Carolinas Multifamily Value Add",
    region: "North Carolina / South Carolina / Multifamily",
    thesis:
      "Tracks multifamily value-add demand, operator gaps, lender appetite, and rent-growth corridors.",
    signal: "Multifamily, operator demand, capital fit",
    feeds: ["Multifamily", "Value Add", "Operator Match", "Capital Match", "Messages"],
    memberUse: "Members see larger deal signals based on capital, market, and operator profile.",
    adminUse: "Owner sees where operators, lenders, and buyers need to be connected.",
    href: "/network",
    tone: "green",
  },
  {
    code: "TX-CAP",
    title: "Texas Capital & Land Flow",
    region: "Texas / Land / Capital / Scale",
    thesis:
      "Tracks larger capital needs, land plays, development demand, private money, and investor flow.",
    signal: "Capital demand, land flow, scale opportunities",
    feeds: ["Private Money", "Land", "Development", "JV Equity", "Investor Demand"],
    memberUse: "Members see opportunities matching their capital, strategy, and state preferences.",
    adminUse: "Owner monitors larger capital gaps, scale plays, and partnership opportunities.",
    href: "/alerts",
    tone: "purple",
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

const wrap: React.CSSProperties = {
  maxWidth: 1240,
  margin: "0 auto",
};

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

function toneColor(tone: MarketWindow["tone"]) {
  if (tone === "green") return "#9df3bf";
  if (tone === "purple") return "#d8b5ff";
  if (tone === "red") return "#ff9f9f";
  return "#f5d978";
}

function StatCard({
  label,
  value,
  detail,
  href,
}: {
  label: string;
  value: number | string;
  detail: string;
  href: string;
}) {
  return (
    <Link href={href} style={{ ...card, color: "white", textDecoration: "none", display: "block" }}>
      <div style={greenEyebrow}>{label}</div>
      <div style={{ fontSize: 46, fontWeight: 950, lineHeight: 1 }}>{value}</div>
      <p style={{ ...muted, marginBottom: 0 }}>{detail}</p>
    </Link>
  );
}

function MarketWindowCard({ window, owner }: { window: MarketWindow; owner: boolean }) {
  const tone = toneColor(window.tone);

  return (
    <article
      style={{
        ...terminal,
        borderColor: `${tone}66`,
      }}
    >
      <div style={{ ...greenEyebrow, color: tone }}>{window.code}</div>

      <h2 style={{ fontSize: 36, lineHeight: 1, margin: "0 0 10px" }}>
        {window.title}
      </h2>

      <p style={{ ...muted, fontSize: 18, marginTop: 0 }}>
        <strong style={{ color: tone }}>{window.region}</strong>
      </p>

      <p style={{ ...muted, fontSize: 17 }}>{window.thesis}</p>

      <div
        style={{
          border: `1px solid ${tone}66`,
          background: "rgba(0,0,0,.22)",
          borderRadius: 20,
          padding: 14,
          margin: "16px 0",
        }}
      >
        <div style={{ ...eyebrow, color: tone, marginBottom: 8 }}>Live Signal Purpose</div>
        <strong>{window.signal}</strong>
      </div>

      <div style={{ margin: "16px 0" }}>
        {window.feeds.map((feed) => (
          <span key={feed} style={{ ...chip, borderColor: `${tone}88`, color: tone }}>
            {feed}
          </span>
        ))}
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        <div>
          <div style={greenEyebrow}>Member View</div>
          <p style={{ ...muted, marginTop: 0 }}>{window.memberUse}</p>
        </div>

        <div>
          <div style={{ ...greenEyebrow, color: "#e8c46b" }}>Owner View</div>
          <p style={{ ...muted, marginTop: 0 }}>
            {owner
              ? window.adminUse
              : "Owner controls are hidden. Members only see safe matched intelligence."}
          </p>
        </div>
      </div>

      <Link href={window.href} style={btn}>
        Open Intelligence Feed
      </Link>
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
            The Intelligence Map uses profile, market, role, strategy, and alert data to create the member-facing terminal.
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

      const statsRes = await fetch(
        `/api/dashboard/stats?email=${encodeURIComponent(currentEmail)}&owner=${owner ? "1" : "0"}`,
        {
          cache: "no-store",
          headers: {
            "x-vf-email": currentEmail,
            "x-vf-admin": owner ? "1" : "0",
          },
        }
      );

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
            Bloomberg-style real estate signal map.
          </h1>

          <p style={{ ...muted, fontSize: 22 }}>
            This is the member-facing intelligence terminal. It turns markets, profiles, deal rooms,
            pain signals, buy buckets, and alerts into opportunity windows instead of static property cards.
          </p>

          <div className="vf-intel-actions" style={{ marginTop: 18 }}>
            <Link href="/dashboard" style={ghost}>Dashboard</Link>
            <Link href="/alerts" style={btn}>Smart Alerts</Link>
            <Link href="/submit" style={ghost}>Create Deal</Link>
            <Link href="/pain-submit" style={ghost}>Pain Button</Link>
            <Link href="/projects" style={ghost}>Deal Rooms</Link>
            <Link href="/buy-bucket" style={ghost}>Buy Bucket</Link>
            <Link href="/network" style={ghost}>Network</Link>
            {owner && <Link href="/admin" style={btn}>Admin Control</Link>}
            <Link href="/logout" style={danger}>Logout</Link>
          </div>

          {status && <p style={{ ...muted, marginTop: 16 }}>{status}</p>}
        </section>

        <section style={statGrid}>
          <StatCard label="Deal Rooms" value={stats.deals} detail="Live opportunities available for routing." href="/projects" />
          <StatCard label="Members" value={stats.members} detail="Network intelligence nodes." href="/network" />
          <StatCard label="Smart Alerts" value={stats.alerts} detail="AI/routing signals waiting for review." href="/alerts" />
          <StatCard label="Pain Signals" value={stats.pain} detail="Friction that can become opportunity." href="/pain-submit" />
          <StatCard label="Buy Bucket" value={stats.bucket} detail="Saved demand and acquisition targets." href="/buy-bucket" />
          <StatCard label="Messages" value={stats.messages} detail="Deal and member communication activity." href="/messages" />
        </section>

        <section style={hero}>
          <div style={greenEyebrow}>How This Works</div>
          <h2 style={{ fontSize: 42, lineHeight: 1, margin: "0 0 14px" }}>
            These are not simple state cards.
          </h2>
          <p style={{ ...muted, fontSize: 19 }}>
            Each window represents a live intelligence thesis: market pressure, buyer demand,
            capital gaps, contractor/operator need, pain signals, and strategy fit. Members see
            safe matched signals. Owner/admin sees system-wide controls and network health.
          </p>
        </section>

        <section style={grid}>
          {MARKETS.map((window) => (
            <MarketWindowCard key={window.code} window={window} owner={owner} />
          ))}
        </section>

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
                review their own alerts, and train their profile/buy box.
              </p>
            </div>
            <div style={card}>
              <div style={greenEyebrow}>Owner/Admin Can</div>
              <p style={muted}>
                Generate global scans, tune routing, moderate members, activate/lock accounts,
                review system-wide signals, and override high-value routing.
              </p>
            </div>
            <div style={card}>
              <div style={greenEyebrow}>Automation Direction</div>
              <p style={muted}>
                Admin should supervise intelligence, not manually match everything. Smart Alerts
                should detect, score, route, and prioritize automatically as the data layer stabilizes.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
