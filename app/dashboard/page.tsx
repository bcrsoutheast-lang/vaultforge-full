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
  warning?: string;
  admin?: {
    owner: boolean;
    pendingDeals: number;
    archivedDeals: number;
    lockedMembers: number;
    paymentRequiredMembers: number;
    activeMembers: number;
  };
  sources?: Record<string, string>;
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
  background: "linear-gradient(145deg, rgba(181,92,255,.10), rgba(157,243,191,.07), rgba(255,255,255,.04))",
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
  gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
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
  border: "1px solid rgba(157,243,191,.22)",
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

function FounderCountdown() {
  const launchDate = new Date("2026-05-15T23:59:59-04:00").getTime();
  const [remaining, setRemaining] = useState(launchDate - Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setRemaining(launchDate - Date.now());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  if (remaining <= 0) return null;

  const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
  const hours = Math.floor((remaining / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((remaining / (1000 * 60)) % 60);
  const seconds = Math.floor((remaining / 1000) % 60);

  return (
    <section style={{ ...hero, borderColor: "rgba(157,243,191,.35)" }}>
      <div style={greenEyebrow}>Founding Member Window</div>
      <h2 style={{ fontSize: "clamp(36px,8vw,70px)", lineHeight: 0.95, margin: "0 0 14px" }}>
        {days}d {hours}h {minutes}m {seconds}s
      </h2>
      <p style={{ ...muted, fontSize: 18 }}>
        First 50 founders or May 15 — whichever comes first. Founding access is $49 for the first month,
        then $199/month. After founder access closes, standard access is $99 to join, then $199/month.
      </p>
    </section>
  );
}

function StatPane({ label, value, detail }: { label: string; value: number; detail: string }) {
  return (
    <div style={pane}>
      <div style={eyebrow}>{label}</div>
      <div style={{ fontSize: 54, fontWeight: 950, lineHeight: 1 }}>{value}</div>
      <p style={muted}>{detail}</p>
    </div>
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
            <span key={item} style={chip}>{item}</span>
          ))}
        </div>
      )}

      <Link href={href} style={primary ? btn : ghost}>
        {button}
      </Link>
    </article>
  );
}


function ActivityFeed({ owner, stats }: { owner: boolean; stats: Stats }) {
  const feed = [
    {
      code: "LIVE",
      label: "Network Pulse",
      title: "Member intelligence engine active",
      text: "VaultForge is watching deals, profiles, buy buckets, messages, and routing signals from one command center.",
      tone: "#9df3bf",
    },
    {
      code: "DEAL",
      label: "Deal Flow",
      title: `${stats.deals || 0} active deal rooms tracked`,
      text: "Submitted Residential, Commercial, and Land opportunities can be opened from Projects and Deal Rooms.",
      tone: "#f5d978",
    },
    {
      code: "BUCKET",
      label: "Demand Signal",
      title: `${stats.bucket || 0} saved acquisition targets`,
      text: "Buy Bucket activity helps show what members are watching, underwriting, or preparing to pursue.",
      tone: "#b55cff",
    },
    {
      code: "MSG",
      label: "Communication",
      title: `${stats.messages || 0} deal-tied messages`,
      text: "Messages keep opportunity conversations attached to the platform instead of scattered across texts and calls.",
      tone: "#9df3bf",
    },
    {
      code: "ALERT",
      label: "Smart Routing",
      title: `${stats.alerts || 0} routing signals available`,
      text: "Smart Alerts will become the private intelligence feed for match scores, buyer fit, lender fit, and operator fit.",
      tone: "#f5d978",
    },
    {
      code: owner ? "ADMIN" : "MEMBER",
      label: owner ? "Owner Desk" : "Member Desk",
      title: owner ? "Owner command controls online" : "Member command center online",
      text: owner
        ? "Admin controls should stay concentrated here while core auth and API security are hardened."
        : "Complete profile and buy-box data improves future routing accuracy and alert quality.",
      tone: owner ? "#b55cff" : "#9df3bf",
    },
  ];

  return (
    <section style={{ ...hero, marginTop: 22, borderColor: "rgba(181,92,255,.36)" }}>
      <div style={greenEyebrow}>Live Intelligence Feed</div>
      <h2 style={{ fontSize: "clamp(38px,8vw,76px)", lineHeight: 0.95, margin: "0 0 14px" }}>
        Network activity, deal signals, and command alerts.
      </h2>
      <p style={{ ...muted, fontSize: 19 }}>
        A Bloomberg-style readout for what matters now. This is display-only for stability and can later connect to real events, alerts, matches, and member actions.
      </p>

      <div style={{ display: "grid", gap: 12, marginTop: 18 }}>
        {feed.map((item) => (
          <div
            key={`${item.code}-${item.title}`}
            style={{
              display: "grid",
              gridTemplateColumns: "88px 1fr",
              gap: 14,
              alignItems: "start",
              border: "1px solid rgba(255,255,255,.13)",
              background: "linear-gradient(135deg, rgba(0,0,0,.24), rgba(255,255,255,.035))",
              borderRadius: 22,
              padding: 14,
              boxShadow: "0 18px 55px rgba(0,0,0,.24)",
            }}
          >
            <div
              style={{
                border: `1px solid ${item.tone}`,
                color: item.tone,
                borderRadius: 16,
                padding: "10px 8px",
                textAlign: "center",
                fontWeight: 950,
                letterSpacing: 1.5,
                background: "rgba(0,0,0,.24)",
              }}
            >
              {item.code}
            </div>

            <div>
              <div style={{ ...eyebrow, color: item.tone, marginBottom: 6 }}>{item.label}</div>
              <div style={{ fontSize: 22, fontWeight: 950, marginBottom: 4 }}>{item.title}</div>
              <p style={{ ...muted, margin: 0 }}>{item.text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
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
      <div style={eyebrow}>Owner / Soft Admin Controls</div>
      <h2 style={{ fontSize: 40, lineHeight: 1, margin: "0 0 12px" }}>
        Owner Control Center
      </h2>
      <p style={muted}>
        These controls are for you only. Normal members should not see delete, archive, approval, member status,
        or global review tools.
      </p>

      <section style={grid}>
        <StatPane label="Pending Deals" value={admin.pendingDeals} detail="Deals that may need review." />
        <StatPane label="Archived Deals" value={admin.archivedDeals} detail="Deals hidden from active flow." />
        <StatPane label="Active Members" value={admin.activeMembers} detail="Members currently marked active." />
        <StatPane label="Locked Members" value={admin.lockedMembers} detail="Members locked or incomplete." />
        <StatPane label="Payment Required" value={admin.paymentRequiredMembers} detail="Members waiting on payment." />
      </section>

      <div style={{ marginTop: 16 }}>
        <div style={{ ...eyebrow, marginBottom: 6 }}>Admin Navigation</div>
        <Link href="/admin" style={btn}>Admin Home</Link>
        <Link href="/projects" style={ghost}>Review Deals</Link>
        <Link href="/network" style={ghost}>Manage Members</Link>
        <Link href="/messages" style={ghost}>All Messages</Link>
        <Link href="/buy-bucket" style={ghost}>Buy Buckets</Link>
        <Link href="/alerts" style={ghost}>Alerts Control</Link>
      </div>

      <div style={{ marginTop: 16 }}>
        <div style={{ ...eyebrow, marginBottom: 6 }}>Soft Admin Actions</div>
        <Link href="/projects" style={danger}>Delete / Archive Deals</Link>
        <Link href="/network" style={danger}>Lock / Activate Members</Link>
        <Link href="/payment" style={ghost}>Payment Status Control</Link>
      </div>
    </section>
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

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    deals: 0,
    members: 0,
    bucket: 0,
    messages: 0,
    alerts: 0,
  });
  const [access, setAccess] = useState<Access | null>(null);
  const [status, setStatus] = useState("Checking access...");
  const [email, setEmail] = useState("");
  const [lockReason, setLockReason] = useState<"loading" | "login" | "profile" | "payment" | "open">("loading");

  async function loadDashboard() {
    setStatus("Checking access...");

    try {
      const email = getEmail();
      setEmail(email);

      if (!email) {
        setLockReason("login");
        setStatus("");
        return;
      }

      const accessRes = await fetch(`/api/member/access?email=${encodeURIComponent(email)}`, {
        cache: "no-store",
        headers: { "x-vf-email": email },
      });

      const accessData = await accessRes.json();
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

      const owner = isOwnerEmail(email) || Boolean(accessData?.owner);

      const statsRes = await fetch(`/api/dashboard/stats?email=${encodeURIComponent(email)}&owner=${owner ? "1" : "0"}`, {
        cache: "no-store",
        headers: {
          "x-vf-email": email,
          "x-vf-admin": owner ? "1" : "0",
        },
      });

      const statsData = await statsRes.json();
      const statsPayload = statsData?.stats || statsData || {};

      setStats({
        deals: Number(statsPayload?.deals || 0),
        members: Number(statsPayload?.members || 0),
        bucket: Number(statsPayload?.bucket || 0),
        messages: Number(statsPayload?.messages || 0),
        alerts: Number(statsPayload?.alerts || 0),
        warning: statsPayload?.warning || statsData?.warning || "",
        admin: statsPayload?.admin || statsData?.admin,
        sources: statsPayload?.sources || statsData?.sources,
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

        a:hover {
          transform: translateY(-1px);
          transition: all .18s ease;
        }
      `}</style>


      <div style={wrap}>
        <div style={topAccount}>
          <div style={{ ...eyebrow, marginBottom: 0 }}>VaultForge</div>
          <div>
            <Link href="/profile" style={ghost}>Profile</Link>
            <Link href="/payment" style={ghost}>Payment</Link>
            <Link href="/logout" style={ghost}>Logout</Link>
          </div>
        </div>

        <section style={hero}>
          <div style={greenEyebrow}>Member Command Center</div>
          <h1 style={{ fontSize: "clamp(56px,12vw,104px)", lineHeight: 0.88, margin: "0 0 18px" }}>
            {owner ? "Owner command center." : "Your real estate intelligence desk."}
          </h1>
          <p style={{ ...muted, fontSize: 21 }}>
            VaultForge turns deals, members, buy boxes, alerts, messages, and routing signals into one operating system.
            Each section below explains what it does and where to go next.
          </p>

          <div className="vf-command-actions" style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
            <Link href="/submit" style={btn}>Create Deal</Link>
            <Link href="/alerts" style={ghost}>Smart Alerts</Link>
            <Link href="/projects" style={ghost}>Deal Rooms</Link>
            <Link href="/network" style={ghost}>Member Network</Link>
          </div>
        </section>

        {owner && <OwnerAdminPanel stats={stats} />}
        <FounderCountdown />

        {status && <section style={hero}>{status}</section>}

        {stats.warning && (
          <section style={{ ...hero, color: "#ffd0d0" }}>
            {stats.warning}
          </section>
        )}

        <ActivityFeed owner={owner} stats={stats} />

        <section style={grid}>
          <StatPane label="Active Deals" value={stats.deals} detail="Total deal rooms in the system." />
          <StatPane label="Members" value={stats.members} detail="Member records tracked." />
          <StatPane label="Buy Bucket" value={stats.bucket} detail="Saved acquisition targets." />
          <StatPane label="Messages" value={stats.messages} detail="Deal-tied conversations." />
          <StatPane label="Alerts" value={stats.alerts} detail="Routing and match signals." />
        </section>

        <section style={{ ...hero, marginTop: 22 }}>
          <div style={greenEyebrow}>Command Tools</div>
          <h2 style={{ fontSize: "clamp(38px,8vw,76px)", lineHeight: 0.95, margin: "0 0 14px" }}>
            What each section does.
          </h2>
          <p style={{ ...muted, fontSize: 19 }}>
            Use this as your operating map. The more complete your profile and deal data are,
            the smarter the routing engine gets.
          </p>
        </section>

        <section style={toolGrid}>
          <ToolCard
            primary
            label="Create"
            title="Create Deal"
            text="Submit residential, commercial, or land opportunities with structured numbers, photos, strategy, seller situation, access notes, repair estimates, and routing fields."
            href="/submit"
            button="Create Opportunity"
            tags={["Residential", "Commercial", "Land", "Photos", "AI Summary"]}
          />

          <ToolCard
            primary
            label="Intelligence"
            title="Smart Alerts"
            text="Your AI-style routing feed. VaultForge scores deals against member profiles, markets, roles, buy boxes, strategies, needs, and provider abilities, then explains why each match surfaced."
            href="/alerts"
            button="Open Smart Alerts"
            tags={["Match Score", "Why Matched", "Deal Routing", "Buyer/Lender Fit"]}
          />

          <ToolCard
            label="Deal Rooms"
            title="Projects"
            text="Your live deal room list. Review active opportunities, open deal details, move deals into folders, archive stale opportunities, delete trash, and save strong targets."
            href="/projects"
            button="Review Deal Rooms"
            tags={["Deal Room", "Archive", "Folders", "Delete", "Save"]}
          />

          <ToolCard
            label="Acquisition"
            title="Buy Bucket"
            text="Your saved acquisition targets. This is where members collect opportunities they want to watch, revisit, underwrite, or pursue."
            href="/buy-bucket"
            button="Open Buy Bucket"
            tags={["Saved Targets", "Demand Signal", "Watchlist"]}
          />

          <ToolCard
            label="Network"
            title="Member Network"
            text="The private member directory. See buyers, lenders, contractors, sellers, operators, developers, wholesalers, and partners by role, state, strategy, and what they can provide."
            href="/network"
            button="Open Network"
            tags={["Buyers", "Lenders", "Operators", "Contractors", "Partners"]}
          />

          <ToolCard
            label="Communication"
            title="Messages"
            text="Deal-tied conversations and member communications. Keep opportunity conversations organized instead of buried in texts, DMs, and random call notes."
            href="/messages"
            button="Open Messages"
            tags={["Threads", "Deal Talk", "Member Contact"]}
          />

          <ToolCard
            label="Profile"
            title="Profile / Alert Preferences"
            text="This trains the VaultForge engine. Set member roles, markets, project types, strategies, what you need, what you provide, alert types, and profile photo."
            href="/profile"
            button="Train Profile"
            tags={["Buy Box", "Markets", "Roles", "Needs", "Can Provide"]}
          />

          <ToolCard
            label="Access"
            title="Payment / Membership"
            text="Membership access status and future billing controls. Stripe goes last so the product stays stable before money flow is turned on."
            href="/payment"
            button="View Access"
            tags={["Founder Access", "$49 First Month", "$199/mo", "Billing"]}
          />
        </section>

        <section style={{ ...hero, marginTop: 22, borderColor: "rgba(157,243,191,.30)" }}>
          <div style={greenEyebrow}>How The Engine Works</div>
          <h2 style={{ fontSize: "clamp(38px,8vw,72px)", lineHeight: 0.95, margin: "0 0 14px" }}>
            Deal data + member profiles = routing intelligence.
          </h2>
          <p style={{ ...muted, fontSize: 19 }}>
            VaultForge compares opportunity data against member profiles. It looks at states, markets,
            property types, strategies, needs, provider abilities, photos, summaries, pricing, spreads,
            and member roles. Then it creates explainable routing alerts so members can move faster.
          </p>

          <div style={grid}>
            <div style={pane}>
              <div style={greenEyebrow}>Step 1</div>
              <h3 style={{ fontSize: 28, margin: "0 0 10px" }}>Members train the system.</h3>
              <p style={muted}>Profiles define what each member wants, where they operate, and what they can provide.</p>
            </div>
            <div style={pane}>
              <div style={greenEyebrow}>Step 2</div>
              <h3 style={{ fontSize: 28, margin: "0 0 10px" }}>Deals enter the engine.</h3>
              <p style={muted}>Structured deal rooms give the system enough data to route, score, and explain.</p>
            </div>
            <div style={pane}>
              <div style={greenEyebrow}>Step 3</div>
              <h3 style={{ fontSize: 28, margin: "0 0 10px" }}>Alerts surface matches.</h3>
              <p style={muted}>The command center shows what matched, why it matched, and where to take action.</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}