"use client";

import { useEffect, useState } from "react";
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
  warning?: string;
  admin?: {
    owner: boolean;
    pendingDeals: number;
    archivedDeals: number;
    lockedMembers: number;
    paymentRequiredMembers: number;
    activeMembers: number;
  };
};

type Access = {
  email: string;
  owner: boolean;
  profile_complete: boolean;
  payment_status: string;
  access_status: string;
  paid: boolean;
  unlocked: boolean;
  next_step: string;
};

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(181,92,255,.22), transparent 28%), radial-gradient(circle at top right, rgba(157,243,191,.18), transparent 24%), radial-gradient(circle at bottom right, rgba(232,196,107,.18), transparent 28%), linear-gradient(180deg,#02040a 0%,#071326 40%,#03110d 100%)",
  color: "white",
  padding: "28px 18px 90px",
  fontFamily: "Arial, sans-serif",
};

const wrap: React.CSSProperties = { maxWidth: 1200, margin: "0 auto" };

const hero: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.28)",
  background:
    "linear-gradient(145deg, rgba(181,92,255,.10), rgba(157,243,191,.07), rgba(255,255,255,.04))",
  borderRadius: 34,
  padding: 24,
  marginBottom: 22,
};

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))",
  gap: 16,
};

const toolGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(270px,1fr))",
  gap: 18,
};

const pane: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.13)",
  background:
    "linear-gradient(145deg, rgba(181,92,255,.10), rgba(157,243,191,.06), rgba(255,255,255,.03))",
  borderRadius: 28,
  padding: 22,
  boxShadow: "0 30px 90px rgba(0,0,0,.35)",
};

const commandPane: React.CSSProperties = {
  ...pane,
  border: "1px solid rgba(157,243,191,.28)",
  background:
    "linear-gradient(145deg, rgba(157,243,191,.12), rgba(181,92,255,.12), rgba(255,255,255,.03))",
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
  fontWeight: 900,
  border: "none",
  margin: "6px 6px 0 0",
  minHeight: 46,
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
  margin: "6px 6px 0 0",
  minHeight: 46,
};

const danger: React.CSSProperties = {
  ...ghost,
  border: "1px solid rgba(255,120,120,.38)",
  color: "#ffd0d0",
};

const topAccount: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap",
  marginBottom: 18,
};

const eyebrow: React.CSSProperties = {
  color: "#e8c46b",
  letterSpacing: 5,
  fontWeight: 900,
  fontSize: 12,
  marginBottom: 12,
  textTransform: "uppercase",
};

const greenEyebrow: React.CSSProperties = {
  ...eyebrow,
  color: "#9df3bf",
};

const muted: React.CSSProperties = {
  color: "rgba(255,255,255,.68)",
  lineHeight: 1.5,
};

const chip: React.CSSProperties = {
  display: "inline-flex",
  border: "1px solid rgba(157,243,191,.25)",
  color: "#9df3bf",
  background: "rgba(157,243,191,.07)",
  borderRadius: 999,
  padding: "8px 11px",
  fontWeight: 800,
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

function isOwnerEmail(email: string) {
  return email.trim().toLowerCase() === OWNER_EMAIL;
}

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

function StatPane({ label, value, detail, href }: { label: string; value: number; detail: string; href: string }) {
  return (
    <Link
      href={href}
      style={{
        ...pane,
        display: "block",
        color: "white",
        textDecoration: "none",
        minHeight: 168,
      }}
    >
      <div style={eyebrow}>{label}</div>
      <div style={{ fontSize: 54, fontWeight: 950, lineHeight: 1 }}>{value}</div>
      <p style={muted}>{detail}</p>
      <div style={{ ...chip, marginTop: 8 }}>Open</div>
    </Link>
  );
}

function ToolCard({
  label,
  title,
  text,
  href,
  button,
  tags = [],
  primary = false,
}: {
  label: string;
  title: string;
  text: string;
  href: string;
  button: string;
  tags?: string[];
  primary?: boolean;
}) {
  return (
    <article style={primary ? commandPane : pane}>
      <div style={primary ? greenEyebrow : eyebrow}>{label}</div>
      <h3 style={{ fontSize: 30, lineHeight: 1.05, margin: "0 0 12px" }}>{title}</h3>
      <p style={{ ...muted, fontSize: 17 }}>{text}</p>

      {tags.length > 0 && (
        <div style={{ margin: "14px 0 8px" }}>
          {tags.map((item) => (
            <span key={item} style={chip}>
              {item}
            </span>
          ))}
        </div>
      )}

      <Link href={href} style={primary ? btn : ghost}>
        {button}
      </Link>
    </article>
  );
}

function LockedScreen({ reason }: { reason: "profile" | "payment" | "login" | "loading" }) {
  const isProfile = reason === "profile";
  const isPayment = reason === "payment";
  const isLogin = reason === "login";

  return (
    <main style={page}>
      <div style={wrap}>
        <section style={hero}>
          <div style={greenEyebrow}>MEMBER COMMAND CENTER</div>
          <h1 style={{ fontSize: "clamp(54px,12vw,96px)", lineHeight: 0.88, margin: "0 0 18px" }}>
            {reason === "loading"
              ? "Checking access..."
              : isLogin
              ? "Create member access first."
              : isProfile
              ? "Train your profile first."
              : "Payment unlock is next."}
          </h1>

          <p style={{ ...muted, fontSize: 21 }}>
            {reason === "loading"
              ? "VaultForge is checking your profile and payment status."
              : isLogin
              ? "Log in or create member access before entering the command center."
              : isProfile
              ? "Your AI profile tells VaultForge what markets, strategies, roles, needs, and alerts matter to you."
              : "Your profile is complete. Activate membership to unlock the full command center."}
          </p>

          {isLogin && <Link href="/login" style={btn}>Create / Login</Link>}
          {isProfile && <Link href="/profile" style={btn}>Complete Profile</Link>}
          {isPayment && <Link href="/payment" style={btn}>Go To Payment</Link>}
          <Link href="/" style={ghost}>Home</Link>
        </section>
      </div>
    </main>
  );
}

function OwnerAdminPanel({ stats }: { stats: Stats }) {
  const admin = stats.admin || {
    owner: false,
    pendingDeals: 0,
    archivedDeals: 0,
    lockedMembers: 0,
    paymentRequiredMembers: 0,
    activeMembers: 0,
  };

  return (
    <section style={{ ...hero, borderColor: "rgba(232,196,107,.42)" }}>
      <div style={eyebrow}>Owner / Admin Controls</div>
      <h2 style={{ fontSize: 40, lineHeight: 1, margin: "0 0 12px" }}>Owner Control Center</h2>
      <p style={muted}>
        Admin controls stay separated from member tools. Use these buttons for member activation, deal review, messages, alerts, and buy-bucket oversight.
      </p>

      <section style={grid}>
        <StatPane label="Pending Deals" value={admin.pendingDeals} detail="Deals that may need review." href="/projects" />
        <StatPane label="Archived Deals" value={admin.archivedDeals} detail="Deals hidden from active flow." href="/projects" />
        <StatPane label="Active Members" value={admin.activeMembers} detail="Members currently marked active." href="/network" />
        <StatPane label="Locked Members" value={admin.lockedMembers} detail="Members locked or incomplete." href="/network" />
        <StatPane label="Payment Required" value={admin.paymentRequiredMembers} detail="Members waiting on payment." href="/network" />
      </section>

      <div style={{ marginTop: 16 }}>
        <Link href="/admin" style={btn}>Admin Home</Link>
        <Link href="/network" style={ghost}>Manage Members</Link>
        <Link href="/projects" style={ghost}>Review Deals</Link>
        <Link href="/alerts" style={ghost}>Generate Alerts</Link>
        <Link href="/messages" style={ghost}>Messages</Link>
      </div>
    </section>
  );
}

function MemberBadgePanel({ email, owner, access }: { email: string; owner: boolean; access: Access | null }) {
  const paid = Boolean(access?.paid || access?.unlocked || owner);
  const profileComplete = Boolean(access?.profile_complete || owner);

  const badges = [
    {
      href: "/profile",
      label: owner ? "OWNER" : "MEMBER",
      title: owner ? "VaultForge Owner" : "Private Member",
      text: owner
        ? "Full command access for admin review, deal routing, network controls, and launch monitoring."
        : "Member workspace for deal rooms, buy boxes, saved targets, messages, and routing intelligence.",
      tone: owner ? "#b55cff" : "#9df3bf",
      action: "Edit Profile",
    },
    {
      href: "/profile",
      label: profileComplete ? "PROFILE" : "TRAIN",
      title: profileComplete ? "Profile Trained" : "Profile Needs Training",
      text: profileComplete
        ? "Your profile can feed markets, roles, strategies, needs, and routing preferences into the intelligence layer."
        : "Complete your profile to improve future routing, alerts, matching, and member visibility.",
      tone: profileComplete ? "#9df3bf" : "#f5d978",
      action: "Open Profile",
    },
    {
      href: paid ? "/dashboard" : "/payment",
      label: paid ? "ACCESS" : "LOCKED",
      title: paid ? "Command Access Active" : "Payment Step Pending",
      text: paid
        ? "Member command tools are available from this dashboard."
        : "Payment activation unlocks the full member command center when billing is active.",
      tone: paid ? "#9df3bf" : "#f5d978",
      action: paid ? "Command Active" : "Open Payment",
    },
    {
      href: "/network",
      label: "FOUNDER",
      title: owner ? "Founder Seat: Owner" : "Founder Window Candidate",
      text: "Founder positioning is part of the private network identity layer and can later connect to actual founder numbers.",
      tone: "#b55cff",
      action: "Open Network",
    },
  ];

  return (
    <section style={{ ...hero, marginTop: 22, borderColor: "rgba(157,243,191,.34)" }}>
      <div style={greenEyebrow}>Member Identity Layer</div>
      <h2 style={{ fontSize: "clamp(38px,8vw,74px)", lineHeight: 0.95, margin: "0 0 14px" }}>
        Badges, access status, and network role.
      </h2>
      <p style={{ ...muted, fontSize: 19 }}>
        These badges now open the correct areas instead of sitting as read-only cards.
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, margin: "16px 0" }}>
        <span style={{ ...chip, borderColor: "rgba(181,92,255,.45)", color: "#d9b8ff", background: "rgba(181,92,255,.12)" }}>
          {email || "member"}
        </span>
        <span style={chip}>{owner ? "Owner/Admin" : "Member"}</span>
        <span style={chip}>{profileComplete ? "Profile Complete" : "Profile Pending"}</span>
        <span style={chip}>{paid ? "Access Active" : "Payment Pending"}</span>
      </div>

      <section style={grid}>
        {badges.map((badge) => (
          <Link
            key={badge.label}
            href={badge.href}
            style={{
              ...pane,
              display: "block",
              color: "white",
              textDecoration: "none",
              border: `1px solid ${badge.tone}`,
              background: "linear-gradient(145deg, rgba(0,0,0,.24), rgba(255,255,255,.045))",
            }}
          >
            <div
              style={{
                display: "inline-flex",
                color: badge.tone,
                border: `1px solid ${badge.tone}`,
                borderRadius: 999,
                padding: "7px 11px",
                fontWeight: 950,
                letterSpacing: 2,
                fontSize: 12,
                marginBottom: 12,
                background: "rgba(0,0,0,.20)",
              }}
            >
              {badge.label}
            </div>
            <h3 style={{ fontSize: 26, lineHeight: 1.05, margin: "0 0 10px" }}>{badge.title}</h3>
            <p style={muted}>{badge.text}</p>
            <div style={{ ...chip, marginTop: 8 }}>{badge.action}</div>
          </Link>
        ))}
      </section>
    </section>
  );
}

function BuyBoxPanel() {
  const buyBoxes = [
    {
      href: "/alerts",
      code: "ATL-FLIP",
      title: "Atlanta Metro Flip Box",
      market: "Georgia",
      target: "Residential · Fix & Flip",
      range: "$150k - $425k",
      signal: "Open matching alerts",
      tone: "#9df3bf",
    },
    {
      href: "/alerts",
      code: "TN-LAND",
      title: "Tennessee Land Watch",
      market: "Tennessee",
      target: "Land · Builder Lots · Entitlement",
      range: "2 - 50 acres",
      signal: "Open land alerts",
      tone: "#b55cff",
    },
    {
      href: "/buy-bucket",
      code: "SE-MF",
      title: "Southeast Multifamily Value Add",
      market: "GA / TN / Carolinas",
      target: "Commercial · Value Add",
      range: "5+ units",
      signal: "Open saved targets",
      tone: "#f5d978",
    },
    {
      href: "/pain-submit",
      code: "DISTRESS",
      title: "Stuck Project / Pain Watch",
      market: "Regional",
      target: "Needs lender, operator, contractor, buyer",
      range: "Any size",
      signal: "Route a pain signal",
      tone: "#9df3bf",
    },
  ];

  return (
    <section style={{ ...hero, marginTop: 22, borderColor: "rgba(245,217,120,.34)" }}>
      <div style={greenEyebrow}>Buy Boxes / Saved Searches</div>
      <h2 style={{ fontSize: "clamp(38px,8vw,74px)", lineHeight: 0.95, margin: "0 0 14px" }}>
        Watchlists that turn demand into routing intelligence.
      </h2>
      <p style={{ ...muted, fontSize: 19 }}>
        These cards now act as launch points into alerts, saved targets, and pain routing.
      </p>

      <section style={grid}>
        {buyBoxes.map((box) => (
          <Link
            key={box.code}
            href={box.href}
            style={{
              ...pane,
              display: "block",
              color: "white",
              textDecoration: "none",
              border: `1px solid ${box.tone}`,
              background: "linear-gradient(145deg, rgba(0,0,0,.26), rgba(255,255,255,.045))",
            }}
          >
            <div style={{ ...eyebrow, color: box.tone }}>{box.code}</div>
            <h3 style={{ fontSize: 27, lineHeight: 1.05, margin: "0 0 10px" }}>{box.title}</h3>
            <div style={{ display: "grid", gap: 8 }}>
              <span style={{ ...chip, borderColor: box.tone, color: box.tone }}>{box.market}</span>
              <span style={chip}>{box.target}</span>
              <span style={chip}>{box.range}</span>
              <span style={{ ...chip, borderColor: "rgba(255,255,255,.26)", color: "white" }}>{box.signal}</span>
            </div>
          </Link>
        ))}
      </section>
    </section>
  );
}

function NotificationCenter({ owner, stats, access }: { owner: boolean; stats: Stats; access: Access | null }) {
  const notices = [
    {
      level: "DEAL",
      title: stats.deals > 0 ? "Review active deal rooms" : "Create the first live opportunity",
      text: stats.deals > 0
        ? `${stats.deals} active deal rooms are available for review, routing, or save-to-bucket actions.`
        : "Create the first live opportunity to start routing demand through the network.",
      href: stats.deals > 0 ? "/projects" : "/submit",
      action: stats.deals > 0 ? "Open Projects" : "Create Deal",
      tone: "#f5d978",
    },
    {
      level: "ALERT",
      title: `${stats.alerts || 0} smart alerts`,
      text: access?.profile_complete
        ? "Open Smart Alerts to generate or review routing matches."
        : "Complete profile fields to improve future saved-search and smart-alert accuracy.",
      href: "/alerts",
      action: "Open Alerts",
      tone: "#9df3bf",
    },
    {
      level: "PAIN",
      title: `${stats.pain || 0} distress signals`,
      text: "Pain Button submissions become routing input for capital needs, stalled projects, seller pressure, and urgent deal rescue.",
      href: "/pain-submit",
      action: "Route Pain Signal",
      tone: "#ff8b8b",
    },
    {
      level: "BUCKET",
      title: `${stats.bucket || 0} saved target signals`,
      text: "Buy Bucket activity can become a demand map showing what members are watching, pursuing, and underwriting.",
      href: "/buy-bucket",
      action: "Open Buy Bucket",
      tone: "#b55cff",
    },
    {
      level: "COMMS",
      title: `${stats.messages || 0} deal communication records`,
      text: "Message volume should become part of deal heat, urgency, and engagement scoring later.",
      href: "/messages",
      action: "Open Messages",
      tone: "#9df3bf",
    },
    {
      level: owner ? "ADMIN" : "ACCESS",
      title: owner ? "Admin launch review" : "Membership status check",
      text: owner
        ? "Audit admin actions, API protection, member locks, Stripe, and RLS before public launch."
        : "Membership access and payment status control what tools unlock inside the command center.",
      href: owner ? "/admin" : "/payment",
      action: owner ? "Open Admin" : "Open Payment",
      tone: owner ? "#b55cff" : "#f5d978",
    },
  ];

  return (
    <section style={{ ...hero, marginTop: 22, borderColor: "rgba(157,243,191,.34)" }}>
      <div style={greenEyebrow}>Notifications Center</div>
      <h2 style={{ fontSize: "clamp(38px,8vw,74px)", lineHeight: 0.95, margin: "0 0 14px" }}>
        Priority signals, actions, and command alerts.
      </h2>
      <p style={{ ...muted, fontSize: 19 }}>
        These rows now open the correct action pages instead of sitting as read-only notices.
      </p>

      <div style={{ display: "grid", gap: 12, marginTop: 18 }}>
        {notices.map((notice) => (
          <Link
            key={`${notice.level}-${notice.title}`}
            href={notice.href}
            style={{
              display: "grid",
              gridTemplateColumns: "92px 1fr auto",
              gap: 14,
              alignItems: "center",
              border: "1px solid rgba(255,255,255,.13)",
              background: "linear-gradient(135deg, rgba(0,0,0,.26), rgba(255,255,255,.04))",
              borderRadius: 22,
              padding: 14,
              boxShadow: "0 18px 55px rgba(0,0,0,.24)",
              color: "white",
              textDecoration: "none",
            }}
          >
            <div
              style={{
                border: `1px solid ${notice.tone}`,
                color: notice.tone,
                borderRadius: 16,
                padding: "10px 8px",
                textAlign: "center",
                fontWeight: 950,
                letterSpacing: 1.5,
                background: "rgba(0,0,0,.24)",
              }}
            >
              {notice.level}
            </div>

            <div>
              <div style={{ fontSize: 22, fontWeight: 950, marginBottom: 4 }}>{notice.title}</div>
              <p style={{ ...muted, margin: 0 }}>{notice.text}</p>
            </div>

            <span style={ghost}>{notice.action}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function PipelinePanel({ stats }: { stats: Stats }) {
  const pipeline = [
    ["New Intake", stats.deals, "/projects", "Fresh deal rooms submitted into VaultForge."],
    ["Matched / Routed", stats.alerts, "/alerts", "Real match alerts and routing intelligence."],
    ["Saved / Watched", stats.bucket, "/buy-bucket", "Deals saved into Buy Buckets as demand signals."],
    ["Conversation", stats.messages, "/messages", "Deal messages and member follow-up."],
    ["Distress", stats.pain, "/pain-submit", "Pain Button and problem-routing submissions."],
    ["Routing Activity", stats.routing, "/alerts", "Machine-readable routing signals for AI matching."],
  ] as const;

  return (
    <section style={{ ...hero, marginTop: 22, borderColor: "rgba(181,92,255,.38)" }}>
      <div style={greenEyebrow}>Deal Status Pipeline</div>
      <h2 style={{ fontSize: "clamp(38px,8vw,74px)", lineHeight: 0.95, margin: "0 0 14px" }}>
        From intake to routing to execution.
      </h2>
      <p style={{ ...muted, fontSize: 19 }}>Each pipeline card now opens the right work area.</p>

      <section style={grid}>
        {pipeline.map(([label, value, href, text]) => (
          <StatPane key={label} label={label} value={Number(value || 0)} detail={text} href={href} />
        ))}
      </section>
    </section>
  );
}

export default function DashboardPage() {
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
  const [access, setAccess] = useState<Access | null>(null);
  const [status, setStatus] = useState("Checking access...");
  const [email, setEmail] = useState("");
  const [lockReason, setLockReason] = useState<"loading" | "login" | "profile" | "payment" | "open">("loading");

  async function loadDashboard() {
    setStatus("Checking access...");

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

      setLockReason("open");

      const owner = isOwnerEmail(currentEmail) || Boolean(accessData?.owner);

      const statsRes = await fetch(`/api/dashboard/stats?email=${encodeURIComponent(currentEmail)}&owner=${owner ? "1" : "0"}`, {
        cache: "no-store",
        headers: {
          "x-vf-email": currentEmail,
          "x-vf-admin": owner ? "1" : "0",
        },
      });

      const statsData = await safeJson(statsRes);
      const statsPayload = statsData?.stats || statsData || {};

      setStats({
        deals: Number(statsPayload?.deals || 0),
        members: Number(statsPayload?.members || 0),
        bucket: Number(statsPayload?.bucket || 0),
        messages: Number(statsPayload?.messages || 0),
        alerts: Number(statsPayload?.alerts || 0),
        pain: Number(statsPayload?.pain || 0),
        routing: Number(statsPayload?.routing || 0),
        activity: Number(statsPayload?.activity || 0),
        warning: statsPayload?.warning || statsData?.warning || "",
        admin: statsPayload?.admin || statsData?.admin,
      });

      setStatus("");
    } catch {
      setLockReason("login");
      setStatus("");
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  if (lockReason !== "open") {
    return <LockedScreen reason={lockReason} />;
  }

  const owner = isOwnerEmail(email) || Boolean(access?.owner);

  return (
    <main style={page}>
      <style>{`
        @media (max-width: 760px) {
          .vf-command-actions {
            display: grid !important;
            grid-template-columns: 1fr !important;
            gap: 10px !important;
          }

          .vf-command-actions > * {
            width: 100%;
            margin: 0 !important;
            box-sizing: border-box;
          }
        }

        a:hover,
        button:hover {
          transform: translateY(-1px);
          transition: all .18s ease;
          filter: brightness(1.06);
        }
      `}</style>

      <div style={wrap}>
        <div style={topAccount}>
          <div style={{ ...eyebrow, marginBottom: 0 }}>VaultForge</div>
          <div>
            <Link href="/profile" style={ghost}>Profile</Link>
            <Link href="/payment" style={ghost}>Payment</Link>
            <Link href="/logout" style={danger}>Logout</Link>
          </div>
        </div>

        <section style={hero}>
          <div style={greenEyebrow}>Member Command Center</div>
          <h1 style={{ fontSize: "clamp(56px,12vw,104px)", lineHeight: 0.88, margin: "0 0 18px" }}>
            {owner ? "Owner command center." : "Your real estate intelligence desk."}
          </h1>
          <p style={{ ...muted, fontSize: 21 }}>
            Use this as the operating map. The command cards now route into the right live work areas.
          </p>

          <div className="vf-command-actions" style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
            <Link href="/intelligence" style={btn}>Intelligence Map</Link>
            <Link href="/submit" style={ghost}>Create Deal</Link>
            <Link href="/pain-submit" style={ghost}>Pain Button</Link>
            <Link href="/alerts" style={ghost}>Smart Alerts</Link>
            <Link href="/routing-inbox" style={ghost}>Routing Inbox</Link>
            <Link href="/projects" style={ghost}>Deal Rooms</Link>
            <Link href="/network" style={ghost}>Member Network</Link>
            <Link href="/buy-bucket" style={ghost}>Buy Bucket</Link>
            <Link href="/messages" style={ghost}>Messages</Link>
            {owner && <Link href="/admin" style={btn}>Admin Home</Link>}
          </div>
        </section>

        {owner && <OwnerAdminPanel stats={stats} />}

        {status && <section style={hero}>{status}</section>}

        {stats.warning && (
          <section style={{ ...hero, color: "#ffd0d0" }}>
            {stats.warning}
          </section>
        )}

        <section style={grid}>
          <StatPane label="Active Deals" value={stats.deals} detail="Total active deal rooms in the system." href="/projects" />
          <StatPane label="Members" value={stats.members} detail="Canonical member records tracked." href="/network" />
          <StatPane label="Buy Bucket" value={stats.bucket} detail="Saved acquisition targets." href="/buy-bucket" />
          <StatPane label="Messages" value={stats.messages} detail="Deal-tied conversations." href="/messages" />
          <StatPane label="Alerts" value={stats.alerts} detail="Smart routing alerts." href="/alerts" />
          <StatPane label="Distress Signals" value={stats.pain} detail="Pain Button submissions." href="/pain-submit" />
          <StatPane label="Routing Activity" value={stats.routing} detail="AI routing signals and match logic records." href="/alerts" />
          <StatPane label="Activity Events" value={stats.activity} detail="Telemetry and engagement records." href="/dashboard" />
        </section>

        <MemberBadgePanel email={email} owner={owner} access={access} />

        <BuyBoxPanel />

        <NotificationCenter owner={owner} stats={stats} access={access} />

        <PipelinePanel stats={stats} />

        <section style={{ ...hero, marginTop: 22 }}>
          <div style={greenEyebrow}>Command Tools</div>
          <h2 style={{ fontSize: "clamp(38px,8vw,76px)", lineHeight: 0.95, margin: "0 0 14px" }}>
            What each section does.
          </h2>
          <p style={{ ...muted, fontSize: 19 }}>
            Use this as your operating map. Each tool opens the live page where the work happens.
          </p>
        </section>

        <section style={toolGrid}>
          <ToolCard
            primary
            label="Bloomberg Layer"
            title="Intelligence Map"
            text="Open the market-signal terminal for Georgia, Tennessee, Alabama, Florida, Carolinas, and Texas intelligence windows."
            href="/intelligence"
            button="Open Intelligence Map"
            tags={["Market Signals", "Pain", "Capital", "Buyer Demand", "Routing"]}
          />

          <ToolCard
            primary
            label="Create"
            title="Create Deal"
            text="Submit residential, commercial, or land opportunities with routing fields, photos, strategy, seller situation, access notes, and AI summary."
            href="/submit"
            button="Create Opportunity"
            tags={["Residential", "Commercial", "Land", "Photos", "AI Summary"]}
          />

          <ToolCard
            primary
            label="Intelligence"
            title="Smart Alerts"
            text="Open routing alerts and generate matches against active members, markets, roles, buy boxes, strategies, needs, and provider abilities."
            href="/alerts"
            button="Open Smart Alerts"
            tags={["Capital Match", "Buyer Match", "Operator Match", "Pain Signal"]}
          />

          <ToolCard
            label="Deal Rooms"
            title="Projects"
            text="Review active opportunities, open deal details, archive stale deals, delete trash, and save strong targets."
            href="/projects"
            button="Review Deal Rooms"
            tags={["Deal Room", "Archive", "Folders", "Delete", "Save"]}
          />

          <ToolCard
            label="Acquisition"
            title="Buy Bucket"
            text="Saved acquisition targets and demand signals."
            href="/buy-bucket"
            button="Open Buy Bucket"
            tags={["Saved Targets", "Demand Signal", "Watchlist"]}
          />

          <ToolCard
            label="Network"
            title="Member Network"
            text="Private member network with buyers, lenders, contractors, sellers, operators, developers, wholesalers, and partners."
            href="/network"
            button="Open Network"
            tags={["Buyers", "Lenders", "Operators", "Contractors", "Partners"]}
          />

          <ToolCard
            label="Communication"
            title="Messages"
            text="Deal-tied conversations and member communications."
            href="/messages"
            button="Open Messages"
            tags={["Threads", "Deal Talk", "Member Contact"]}
          />

          <ToolCard
            label="Pain"
            title="Pain Button"
            text="Route distressed sellers, stuck projects, funding gaps, contractor problems, and urgent execution issues."
            href="/pain-submit"
            button="Route Pain Signal"
            tags={["Distress", "Funding Gap", "Operator", "Contractor"]}
          />

          <ToolCard
            label="Profile"
            title="Profile / Alert Preferences"
            text="Train the VaultForge engine with roles, markets, project types, strategies, needs, what you provide, and alert types."
            href="/profile"
            button="Train Profile"
            tags={["Buy Box", "Markets", "Roles", "Needs", "Can Provide"]}
          />
        </section>
      </div>
    </main>
  );
}
