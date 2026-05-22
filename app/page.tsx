"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Countdown = {
  expired: boolean;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

const OWNER_EMAIL = "bcrsoutheast@gmail.com";
const FOUNDER_DEADLINE = new Date("2026-06-01T23:59:59-04:00").getTime();

const founderRoles = [
  { key: "buyers", title: "Buyers / Acquisitions", cap: 20, aliases: ["buyer", "buyers", "acquisition", "acquisitions"] },
  { key: "lenders", title: "Lenders / Debt Capital", cap: 12, aliases: ["lender", "lenders", "debt", "private lender", "hard money"] },
  { key: "operators", title: "Operators / Execution", cap: 15, aliases: ["operator", "operators", "asset manager", "execution"] },
  { key: "contractors", title: "Contractors / Construction", cap: 15, aliases: ["contractor", "contractors", "construction", "builder", "rehab"] },
  { key: "developers", title: "Developers", cap: 10, aliases: ["developer", "developers", "development"] },
  { key: "wholesalers", title: "Wholesalers / Deal Sourcers", cap: 15, aliases: ["wholesaler", "wholesalers", "deal sourcer", "sourcer"] },
  { key: "capital", title: "Capital Partners / Equity", cap: 8, aliases: ["capital", "equity", "partner", "lp", "private capital"] },
  { key: "realtors", title: "Disposition / Realtors", cap: 8, aliases: ["realtor", "agent", "disposition", "brokerage"] },
  { key: "legal", title: "Legal / Title", cap: 5, aliases: ["legal", "title", "attorney", "lawyer", "closing"] },
  { key: "specialists", title: "Specialists / Wildcard", cap: 12, aliases: ["specialist", "insurance", "architect", "engineer", "surveyor", "permit", "property manager"] },
];

const tickerItems = [
  "PRIVATE INTELLIGENCE NETWORK",
  "PAIN → SIGNAL → ROUTING → EXECUTION",
  "APPROVED MEMBERS ONLY",
  "DEALS ROUTED BY FIT",
  "PAIN SIGNALS ROUTED BY NEED",
  "PROFILE DEPTH IMPROVES ROUTING",
  "MEMBER-TO-MEMBER EXECUTION",
  "INVESTOR ACCESS IS SEPARATE",
  "NOT A LISTINGS SITE",
  "FOUNDING ALLOCATIONS CLOSE JUNE 1",
];

const painExamples = [
  "Distressed seller pressure",
  "Capital gap",
  "Stalled construction",
  "Operator needed",
  "Contractor failure",
  "Title / legal issue",
  "Permit or city issue",
  "Lender exit",
  "Emergency sale",
  "Partnership breakdown",
  "Vacant property pressure",
  "Portfolio liquidation",
];

const OPERATING_STATES = ["GA", "TN", "AL", "FL", "NC", "SC", "TX"];

const sampleDealPostings = [
  {
    state: "GA",
    city: "Cartersville",
    type: "Deal Opportunity",
    headline: "Residential value-add near strong contractor demand",
    teaser: "Limited teaser: residential opportunity, buyer/operator fit, execution help may be needed.",
    need: "Buyer, lender, contractor review",
  },
  {
    state: "TN",
    city: "Chattanooga",
    type: "Deal Opportunity",
    headline: "Small-balance opportunity with fast-close angle",
    teaser: "Limited teaser: potential acquisition target with private details locked inside.",
    need: "Capital partner or buyer review",
  },
  {
    state: "FL",
    city: "Jacksonville",
    type: "Deal Opportunity",
    headline: "Rental / flip candidate needing underwriting",
    teaser: "Limited teaser: deal room shows strategy, market, and request lane after access.",
    need: "Investor review and title/closing support",
  },
  {
    state: "TX",
    city: "Dallas",
    type: "Deal Opportunity",
    headline: "Operator-heavy opportunity needing execution team",
    teaser: "Limited teaser: project needs people who can move fast and coordinate execution.",
    need: "Operator, lender, contractor",
  },
];

const samplePainPostings = [
  {
    state: "GA",
    city: "Atlanta",
    type: "Pain Signal",
    headline: "Capital gap before closing window",
    teaser: "Limited teaser: investor/member may solve with funding, JV, or structured terms.",
    need: "Private capital or hard money",
  },
  {
    state: "NC",
    city: "Charlotte",
    type: "Pain Signal",
    headline: "Contractor stalled rehab timeline",
    teaser: "Limited teaser: project needs execution help before pressure turns into loss.",
    need: "Contractor / operator",
  },
  {
    state: "SC",
    city: "Greenville",
    type: "Pain Signal",
    headline: "Title/closing issue blocking deal movement",
    teaser: "Limited teaser: closing problem requires the right member lane.",
    need: "Title / attorney / closing help",
  },
  {
    state: "AL",
    city: "Birmingham",
    type: "Pain Signal",
    headline: "Owner needs fast disposition path",
    teaser: "Limited teaser: problem may turn into acquisition, referral, or buyer match.",
    need: "Buyer / disposition partner",
  },
];

function stateCounts(rows: any[]) {
  return OPERATING_STATES.map((state) => ({
    state,
    count: rows.filter((row) => row.state === state).length,
  }));
}

function liveMemberCounts() {
  const profiles = allProfiles();
  return OPERATING_STATES.map((state) => {
    const count = profiles.filter((profile: any) => {
      const based = String(profile?.basedState || profile?.state || profile?.homeState || "").toUpperCase();
      const states = Array.isArray(profile?.statesOperated || profile?.states_served || profile?.operatingStates)
        ? (profile?.statesOperated || profile?.states_served || profile?.operatingStates)
        : [];
      return based === state || states.map((x: any) => String(x).toUpperCase()).includes(state);
    }).length;

    return { state, count };
  });
}

function liveInvestorCounts() {
  const rows: any[] = [];
  const keys = ["vaultforge_investor_application_v1", "vaultforge_investor_applications_v1", "vaultforge_investors_v1", "vf_investors"];
  for (const key of keys) {
    const parsed = readJson<any>(key, []);
    if (Array.isArray(parsed)) rows.push(...parsed.filter(Boolean));
    else if (parsed && typeof parsed === "object") rows.push(parsed);
  }

  return OPERATING_STATES.map((state) => {
    const count = rows.filter((profile: any) => {
      const states = Array.isArray(profile?.statesInterested || profile?.states || profile?.markets)
        ? (profile?.statesInterested || profile?.states || profile?.markets)
        : String(profile?.state || "").split(",");
      return states.map((x: any) => String(x).trim().toUpperCase()).includes(state);
    }).length;
    return { state, count };
  });
}

const logoCandidates = [
  "/vaultforge-logo.png",
  "/VaultForge-logo.png",
  "/vaultforge-logo.jpg",
  "/vaultforge-logo.jpeg",
  "/logo.png",
  "/logo.jpg",
  "/vf-logo.png",
  "/VF-logo.png",
  "/vaultforge.png",
  "/VaultForge.png",
];

function ok() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readJson<T>(key: string, fallback: T): T {
  if (!ok()) return fallback;

  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function clean(value: unknown) {
  return String(value || "").trim();
}

function lower(value: unknown) {
  return clean(value).toLowerCase();
}

function allProfiles() {
  if (!ok()) return [];

  const keys = [
    "vaultforge_profiles",
    "vaultforge_member_profiles",
    "vaultforge_admin_members_v1",
    "vf_profiles",
    "members",
    "profiles",
  ];

  const rows: any[] = [];

  for (const key of keys) {
    const parsed = readJson<unknown>(key, []);
    if (Array.isArray(parsed)) rows.push(...parsed.filter(Boolean));
    else if (parsed && typeof parsed === "object") rows.push(...Object.values(parsed as Record<string, unknown>).filter(Boolean));
  }

  const single = readJson<any>("vaultforge_profile", null);
  if (single && typeof single === "object" && !Array.isArray(single)) rows.push(single);

  const seen = new Set<string>();
  return rows.filter((profile: any, index) => {
    const id = lower(profile?.email || profile?.memberEmail || profile?.id || `profile-${index}`);
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

function roleText(profile: any) {
  return [
    profile?.memberType,
    profile?.member_type,
    profile?.role,
    profile?.category,
    profile?.type,
    profile?.businessType,
    profile?.business_type,
    profile?.strategy,
    profile?.strategies,
    profile?.services,
    profile?.serviceType,
    profile?.service_type,
  ]
    .flat()
    .map((item) => String(item || "").toLowerCase())
    .join(" ");
}

function founderCounts() {
  const profiles = allProfiles();

  return founderRoles.map((role) => {
    const filled = profiles.filter((profile) => {
      const text = roleText(profile);
      return role.aliases.some((alias) => text.includes(alias));
    }).length;

    return {
      ...role,
      filled,
      remaining: Math.max(role.cap - filled, 0),
      full: filled >= role.cap,
    };
  });
}

function countdown(): Countdown {
  const diff = FOUNDER_DEADLINE - Date.now();

  if (diff <= 0) {
    return { expired: true, days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  return {
    expired: false,
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

function currentEmail() {
  if (!ok()) return "";

  const profile = readJson<any>("vaultforge_profile", {});
  return lower(profile?.email || localStorage.getItem("vf_email") || localStorage.getItem("member_email") || localStorage.getItem("email"));
}

const page: React.CSSProperties = {
  minHeight: "100vh",
  background: "#05070d",
  color: "#f7f7fb",
  fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
  overflowX: "hidden",
};

const wrap: React.CSSProperties = { maxWidth: 1420, margin: "0 auto", padding: "18px 18px 100px" };
const nav: React.CSSProperties = { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", marginBottom: 18 };
const navSide: React.CSSProperties = { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" };
const brand: React.CSSProperties = { color: "#ffd45a", fontSize: 28, fontWeight: 950, letterSpacing: -1 };
const btn: React.CSSProperties = { border: "1px solid rgba(207,216,230,.18)", background: "#171c29", color: "#f7f7fb", borderRadius: 999, padding: "13px 18px", fontWeight: 950, textDecoration: "none", display: "inline-block", cursor: "pointer" };
const goldBtn: React.CSSProperties = { ...btn, border: 0, background: "#ffdc68", color: "#10131a" };
const redBtn: React.CSSProperties = { ...btn, background: "#271016", borderColor: "rgba(255,70,70,.48)", color: "#ffaaaa" };

const hero: React.CSSProperties = {
  border: "1px solid rgba(245,197,66,.28)",
  borderRadius: 34,
  padding: "clamp(28px,5vw,58px)",
  marginBottom: 20,
  background:
    "radial-gradient(circle at top right, rgba(245,197,66,.18), transparent 34%), radial-gradient(circle at bottom left, rgba(255,45,60,.12), transparent 32%), linear-gradient(180deg,#080d19,#050816)",
  boxShadow: "0 0 55px rgba(245,197,66,.08)",
};

const tickerWrap: React.CSSProperties = { borderTop: "1px solid rgba(245,197,66,.25)", borderBottom: "1px solid rgba(245,197,66,.25)", background: "#090d14", overflow: "hidden", marginBottom: 20 };
const tickerTrack: React.CSSProperties = { display: "flex", gap: 40, width: "max-content", padding: "14px 0", animation: "tickerMove 38s linear infinite" };
const card: React.CSSProperties = { background: "linear-gradient(180deg,#080d19,#050816)", border: "1px solid rgba(245,197,66,.28)", borderRadius: 30, padding: 28, marginBottom: 22 };
const panel: React.CSSProperties = { background: "#121724", border: "1px solid rgba(207,216,230,.16)", borderRadius: 24, padding: 22, color: "#f7f7fb", textDecoration: "none", display: "block" };
const goldPanel: React.CSSProperties = { ...panel, borderColor: "rgba(245,197,66,.55)", boxShadow: "0 0 28px rgba(245,197,66,.12)" };
const redPanel: React.CSSProperties = { ...panel, borderColor: "rgba(255,70,70,.56)", boxShadow: "0 0 28px rgba(255,70,70,.10)" };
const eyebrow: React.CSSProperties = { color: "#ffd45a", textTransform: "uppercase", letterSpacing: 7, fontWeight: 950, fontSize: 13, marginBottom: 12 };
const h1: React.CSSProperties = { fontSize: "clamp(42px,8vw,96px)", lineHeight: 0.92, letterSpacing: -3, margin: "0 0 22px", fontWeight: 950 };
const h2: React.CSSProperties = { fontSize: "clamp(30px,5vw,56px)", lineHeight: 1, letterSpacing: -2, margin: "0 0 16px", fontWeight: 950 };
const h3: React.CSSProperties = { fontSize: "clamp(23px,3.5vw,36px)", lineHeight: 1.05, letterSpacing: -1, margin: "0 0 12px", fontWeight: 950 };
const sub: React.CSSProperties = { color: "#c9d0dc", fontSize: "clamp(19px,2.5vw,26px)", lineHeight: 1.28, margin: 0 };
const muted: React.CSSProperties = { color: "#aeb7c7", margin: "8px 0 0", lineHeight: 1.35 };
const grid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: 16 };
const wideGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 18 };
const row: React.CSSProperties = { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" };
const badge: React.CSSProperties = { display: "inline-flex", border: "1px solid rgba(245,197,66,.32)", borderRadius: 999, padding: "9px 13px", color: "#ffd45a", background: "rgba(245,197,66,.07)", fontWeight: 900, margin: "6px 6px 0 0" };

function Nav({ owner }: { owner: boolean }) {
  return (
    <nav style={nav}>
      <div style={navSide}>
        <div style={brand}>VAULTFORGE</div>
        <span style={badge}>PRIVATE APPROVED ACCESS ONLY</span>
      </div>

      <div style={navSide}>
        <Link href="/member-access" style={goldBtn}>Request Member Access</Link>
        <Link href="/investor-access" style={goldBtn}>Investor Room Access</Link>
        <Link href="/create-login" style={btn}>Create Login</Link>
        <Link href="/login" style={btn}>Members Login</Link>
        <Link href="/investor-login" style={btn}>Investor Room Login</Link>
        <Link href="/admin" style={owner ? redBtn : btn}>Admin Login</Link>
      </div>
    </nav>
  );
}

function LogoHero() {
  const [index, setIndex] = useState(0);
  const current = logoCandidates[index];

  return (
    <div style={{ display: "flex", justifyContent: "center", margin: "0 0 28px" }}>
      <div style={{ width: "min(420px, 84vw)", border: "1px solid rgba(245,197,66,.28)", borderRadius: 30, padding: 18, background: "radial-gradient(circle, rgba(245,197,66,.13), transparent 68%), #070b14", boxShadow: "0 0 55px rgba(245,197,66,.16)" }}>
        {current ? (
          <img
            src={current}
            alt="VaultForge"
            style={{ width: "100%", height: "auto", display: "block", borderRadius: 18 }}
            onError={() => setIndex((value) => (value + 1 < logoCandidates.length ? value + 1 : logoCandidates.length))}
          />
        ) : (
          <div style={{ minHeight: 170, display: "grid", placeItems: "center", color: "#ffd45a", fontSize: 56, fontWeight: 950, letterSpacing: -2 }}>VAULTFORGE</div>
        )}
      </div>
    </div>
  );
}

function Ticker() {
  return (
    <div style={tickerWrap}>
      <div style={tickerTrack}>
        {[...tickerItems, ...tickerItems].map((item, index) => (
          <div key={`${item}-${index}`} style={{ whiteSpace: "nowrap", color: "#ffd45a", fontWeight: 950, letterSpacing: 3 }}>{item}</div>
        ))}
      </div>
    </div>
  );
}

function Section({ label, title, children }: { label: string; title: string; children: React.ReactNode }) {
  return (
    <section style={card}>
      <div style={eyebrow}>{label}</div>
      <h2 style={h2}>{title}</h2>
      {children}
    </section>
  );
}

function CountdownCards({ timer }: { timer: Countdown }) {
  return (
    <div style={grid}>
      {[
        ["Days", timer.days],
        ["Hours", timer.hours],
        ["Minutes", timer.minutes],
        ["Seconds", timer.seconds],
      ].map(([label, value]) => (
        <div key={label} style={goldPanel}>
          <div style={eyebrow}>{label}</div>
          <h2 style={h2}>{String(value).padStart(2, "0")}</h2>
          <p style={muted}>until founding allocations close</p>
        </div>
      ))}
    </div>
  );
}

function FounderAllocationCard({ item }: { item: any }) {
  const percent = item.cap ? Math.min(100, Math.round((item.filled / item.cap) * 100)) : 0;

  return (
    <div style={item.full ? redPanel : goldPanel}>
      <div style={eyebrow}>{item.title}</div>
      <h3 style={h3}>{item.filled} / {item.cap} Filled</h3>
      <p style={sub}>{item.remaining} founder allocations remaining</p>
      <div style={{ height: 10, borderRadius: 999, background: "rgba(255,255,255,.08)", overflow: "hidden", marginTop: 14 }}>
        <div style={{ height: "100%", width: `${percent}%`, background: item.full ? "#ff4d5e" : "#ffdc68" }} />
      </div>
      <p style={muted}>{item.full ? "Founder allocation closed." : item.remaining <= 2 ? "Almost full." : "Founder allocation open."}</p>
    </div>
  );
}


function LivePostingCard({ item }: { item: any }) {
  return (
    <div style={goldPanel}>
      <div style={eyebrow}>{item.type} • {item.state}</div>
      <h3 style={h3}>{item.headline}</h3>
      <p style={sub}>{item.city}, {item.state}</p>
      <p style={muted}>{item.teaser}</p>
      <p style={muted}>Need: {item.need}</p>
      <div style={{ ...row, marginTop: 14 }}>
        <Link href="/investor-access" style={goldBtn}>Enter To Request Info</Link>
        <Link href="/member-access" style={btn}>Apply As Member</Link>
      </div>
    </div>
  );
}

function StateCountCard({ state, memberCount, investorCount, dealCount, painCount }: { state: string; memberCount: number; investorCount: number; dealCount: number; painCount: number }) {
  return (
    <div style={panel}>
      <div style={eyebrow}>{state}</div>
      <h3 style={h3}>{dealCount + painCount} live signals</h3>
      <p style={muted}>Members: {memberCount}</p>
      <p style={muted}>Investors: {investorCount}</p>
      <p style={muted}>Deal teasers: {dealCount} • Pain teasers: {painCount}</p>
    </div>
  );
}

export default function HomePage() {
  const [tick, setTick] = useState(0);
  const [owner, setOwner] = useState(false);

  useEffect(() => {
    const refresh = () => {
      setOwner(currentEmail() === OWNER_EMAIL);
      setTick((value) => value + 1);
    };

    refresh();

    const interval = window.setInterval(() => setTick((value) => value + 1), 1000);

    window.addEventListener("storage", refresh);
    window.addEventListener("vaultforge-access-change", refresh);
    window.addEventListener("vaultforge-admin-members-change", refresh);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("storage", refresh);
      window.removeEventListener("vaultforge-access-change", refresh);
      window.removeEventListener("vaultforge-admin-members-change", refresh);
    };
  }, []);

  const timer = useMemo(() => countdown(), [tick]);
  const counts = useMemo(() => founderCounts(), [tick]);
  const founderClosed = timer.expired || counts.every((item) => item.full);
  const totalFilled = counts.reduce((sum, item) => sum + item.filled, 0);
  const totalCap = counts.reduce((sum, item) => sum + item.cap, 0);
  const memberStateCounts = useMemo(() => liveMemberCounts(), [tick]);
  const investorStateCounts = useMemo(() => liveInvestorCounts(), [tick]);
  const dealStateCounts = useMemo(() => stateCounts(sampleDealPostings), []);
  const painStateCounts = useMemo(() => stateCounts(samplePainPostings), []);

  return (
    <main style={page}>
      <style>{`@keyframes tickerMove { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }`}</style>

      <div style={wrap}>
        <Nav owner={owner} />

        <section style={hero}>
          <LogoHero />
          <div style={eyebrow}>VaultForge Intelligence</div>
          <h1 style={h1}>Pain becomes signal.</h1>
          <p style={sub}>VaultForge is not a listings site. It is a private approved-member intelligence, routing, and execution network for real estate operators, buyers, lenders, partners, and problem solvers.</p>
          <p style={{ ...sub, marginTop: 16 }}>Members submit opportunities, deals, pain, capital needs, operator requests, and execution problems. VaultForge Intelligence analyzes the signal and routes it to members best positioned to execute.</p>

          <div style={{ ...row, marginTop: 24 }}>
            <Link href="/member-access" style={goldBtn}>Request Member Access</Link>
            <Link href="/investor-access" style={goldBtn}>Investor Room Access</Link>
            <Link href="/create-login" style={btn}>Create Login + Password</Link>
            <Link href="/login" style={btn}>Members Login</Link>
            <Link href="/investor-login" style={btn}>Investor Room Login</Link>
            <Link href="/admin" style={btn}>Admin Login</Link>
          </div>

          <div style={{ marginTop: 22 }}>
            <span style={badge}>PRIVATE NETWORK</span>
            <span style={badge}>APPROVED MEMBERS ONLY</span>
            <span style={badge}>PAIN → SIGNAL → ROUTING → EXECUTION</span>
          </div>
        </section>

        <Ticker />

        <Section label="Two Controlled Access Lanes" title="Members build the network. Investors access the signal room.">
          <p style={sub}>VaultForge now runs two separate experiences: a private member command center for operators and an investor room for approved capital, buyers, and deal reviewers. The investor room can see controlled Deal Opportunities and Pain submissions, but it does not expose the private member directory.</p>

          <div style={{ ...wideGrid, marginTop: 22 }}>
            <div style={goldPanel}>
              <div style={eyebrow}>Investor Room</div>
              <h3 style={h3}>Controlled access to deal and pain signals.</h3>
              <p style={muted}>Investors can review limited Deal Opportunity cards, Pain submissions, state signals, request more information, message through controlled threads, and request execution help.</p>
              <p style={muted}>Investor price: $79 first month, then $149/month.</p>
              <div style={{ ...row, marginTop: 16 }}>
                <Link href="/investor-access" style={goldBtn}>Get Investor Room Access</Link>
                <Link href="/investor-login" style={btn}>Investor Room Login</Link>
              </div>
            </div>

            <div style={goldPanel}>
              <div style={eyebrow}>Private Members Site</div>
              <h3 style={h3}>Approved operators, capital, buyers, and problem solvers.</h3>
              <p style={muted}>Members operate inside the private command center: routed requests, Deal/Pain rooms, messages, alerts, profile-based routing, state intelligence, and execution lanes.</p>
              <p style={muted}>Members are not publicly browsed. The network is protected by profile review, admin approval, payment unlock, and controlled contact release.</p>
              <div style={{ ...row, marginTop: 16 }}>
                <Link href="/member-access" style={goldBtn}>Request Member Access</Link>
                <Link href="/login" style={btn}>Members Login</Link>
              </div>
            </div>
          </div>
        </Section>

        <Section label="One-Stop Real Estate Execution Shop" title="Deals, problems, people, and next moves in one private system.">
          <p style={sub}>VaultForge is built for the messy real estate work that happens before, during, and after a deal: finding capital, locating buyers, solving title/closing problems, finding contractors, routing operators, reviewing Pain signals, requesting boots on ground, and turning pressure into execution.</p>

          <div style={{ ...grid, marginTop: 20 }}>
            <div style={panel}><div style={eyebrow}>Capital</div><p style={sub}>Private lenders, hard money, equity partners, JV capital, proof-of-funds context, and funding gap routing.</p></div>
            <div style={panel}><div style={eyebrow}>Execution</div><p style={sub}>Contractors, operators, boots on ground, property management, disposition, insurance, and transaction support.</p></div>
            <div style={panel}><div style={eyebrow}>Deal Intelligence</div><p style={sub}>Deal Opportunities, Pain submissions, market pressure, state filters, routed requests, and controlled message threads.</p></div>
            <div style={panel}><div style={eyebrow}>Protection</div><p style={sub}>Profiles attached, contact hidden, member data private, admin approval, payment unlock, and release-only introductions.</p></div>
          </div>
        </Section>

        <Section label="Access Sequence" title="Profile first. Approval next. Payment unlocks the room.">
          <div style={wideGrid}>
            <div style={panel}><div style={eyebrow}>01 Create Login</div><p style={sub}>Members and investors both create login/password access first so the profile, locked room preview, messages, approval status, payment button, and final room unlock stay tied together.</p></div>
            <div style={panel}><div style={eyebrow}>02 Submit Profile</div><p style={sub}>Investor or member profile goes to admin with your market, role, strategy, capital/execution ability, and contact preference.</p></div>
            <div style={panel}><div style={eyebrow}>03 Locked Room Preview</div><p style={sub}>After submission, you can see the locked Investor Room or Member Room preview while admin reviews your profile.</p></div>
            <div style={panel}><div style={eyebrow}>04 Admin Approval</div><p style={sub}>When approved, the payment button lights up. After payment, the room unlocks automatically.</p></div>
          </div>
        </Section>

        <Section label="Why People Will Want In" title="This is where off-market pressure gets organized before it becomes public noise.">
          <div style={wideGrid}>
            <div style={goldPanel}><div style={eyebrow}>Signal Before Listing</div><h3 style={h3}>Problems become opportunities.</h3><p style={muted}>Capital gaps, stalled rehabs, title problems, partner issues, insurance trouble, and urgent exits can become routed execution signals.</p></div>
            <div style={goldPanel}><div style={eyebrow}>No Public Member Exposure</div><h3 style={h3}>Private by design.</h3><p style={muted}>Investors request through VaultForge. Members decide what to accept, pass, message, or release.</p></div>
            <div style={goldPanel}><div style={eyebrow}>Command Center Feel</div><h3 style={h3}>Not another dashboard.</h3><p style={muted}>Profiles, rooms, replies, requests, cleanup folders, and execution lanes work together instead of scattered texts and spreadsheets.</p></div>
          </div>
        </Section>


        <section style={{ marginBottom: 22 }}>
          <div style={grid}>
            <div style={goldPanel}><div style={eyebrow}>Founder Network</div><h2 style={h2}>{totalFilled} / {totalCap}</h2><p style={muted}>real filled founder allocations</p></div>
            <div style={goldPanel}><div style={eyebrow}>Member Founder Pricing</div><h2 style={h2}>{founderClosed ? "$99" : "$49"}</h2><p style={muted}>{founderClosed ? "$99 activation, then $299/month" : "$49 activation, $49 second month, then $299/month"}</p></div>
            <div style={goldPanel}><div style={eyebrow}>Investor Access</div><h2 style={h2}>$79</h2><p style={muted}>first month, then $149/month</p></div>
            <div style={redPanel}><div style={eyebrow}>Pain Signals</div><h2 style={h2}>Live</h2><p style={muted}>problem pressure routed by profile fit</p></div>
          </div>
        </section>

        <Section label="Founder Access Countdown" title={founderClosed ? "Founding allocations closed." : "Founding allocations close June 1."}>
          <CountdownCards timer={timer} />
          <div style={{ ...panel, marginTop: 18 }}>
            <p style={sub}>{founderClosed ? "Standard member access is now active: $99 activation, then $299/month." : "Member founder access: $49 activation, $49 second month, then $299/month. Founder allocations close June 1 or when strategic categories reach capacity."}</p>
          </div>
        </Section>

        <Section label="Founding Network Allocations" title="Balanced network. Limited seats by role.">
          <p style={sub}>VaultForge intentionally limits member categories so the network does not become overloaded with only buyers, only wholesalers, or only operators. The goal is a functioning execution ecosystem.</p>
          <div style={{ ...grid, marginTop: 20 }}>
            {counts.map((item) => <FounderAllocationCard key={item.key} item={item} />)}
          </div>
        </Section>

        <Section label="Investor Room" title="Investors do business inside without seeing the private directory.">
          <p style={sub}>Investor Room is not empty access and it is not just a preview. Approved investors can work inside VaultForge through controlled Deal Opportunities, Pain submissions, request cards, structured replies, and execution lanes. They do not browse the private member directory, but they can still contact a Deal owner, Pain owner, or routed member through VaultForge when a card fits what they want.</p>
          <p style={{ ...muted, marginTop: 12 }}>Example: an investor sees a Deal Opportunity and needs funding. They can request lender routing. They see a Pain submission that needs a contractor, operator, or capital solution. They can request contact through the controlled thread. Member personal info stays protected until approval, but business can still move.</p>
          <div style={{ ...grid, marginTop: 20 }}>
            <div style={goldPanel}><div style={eyebrow}>Investor Pricing</div><h3 style={h3}>$79 first month</h3><p style={muted}>Then $149/month.</p></div>
            <div style={panel}><div style={eyebrow}>Investor Sees</div><p style={sub}>Limited Deal Opportunity cards, Pain submissions, state filters, request cards, structured replies, and execution request lanes.</p></div>
            <div style={panel}><div style={eyebrow}>Investor Protection</div><p style={sub}>Investors do not see the private member directory or personal contact data, but they can request routed contact, funding, deal details, Pain solutions, and execution help through VaultForge.</p></div>
          </div>
          <div style={{ ...row, marginTop: 22 }}>
            <Link href="/investor-access" style={goldBtn}>Investor Access</Link>
            <Link href="/investor-login" style={btn}>Investor Login</Link>
            <Link href="/investor-application" style={btn}>Investor Application</Link>
          </div>
        </Section>


        <Section label="Live Inside Preview" title="Deal and Pain postings from operating states.">
          <p style={sub}>These are limited public teasers. Full details, owner contact, member routing, messages, documents, and next moves stay inside approved Investor Room or Member Room access.</p>

          <div style={{ ...wideGrid, marginTop: 22 }}>
            {sampleDealPostings.slice(0, 4).map((item) => <LivePostingCard key={`${item.state}-${item.city}-${item.headline}`} item={item} />)}
          </div>

          <div style={{ ...wideGrid, marginTop: 18 }}>
            {samplePainPostings.slice(0, 4).map((item) => <LivePostingCard key={`${item.state}-${item.city}-${item.headline}`} item={item} />)}
          </div>

          <div style={{ ...row, marginTop: 22 }}>
            <Link href="/investor-access" style={goldBtn}>Enter Investor Room</Link>
            <Link href="/member-access" style={btn}>Apply For Member Access</Link>
          </div>
        </Section>

        <Section label="State Network Snapshot" title="Where VaultForge is operating.">
          <p style={sub}>State cards show operating lanes, available teaser signals, and live local profile counts where browser data exists. This gives investors and members a reason to get inside the room instead of guessing what is active.</p>
          <div style={{ ...grid, marginTop: 20 }}>
            {OPERATING_STATES.map((state) => (
              <StateCountCard
                key={state}
                state={state}
                memberCount={memberStateCounts.find((item) => item.state === state)?.count || 0}
                investorCount={investorStateCounts.find((item) => item.state === state)?.count || 0}
                dealCount={dealStateCounts.find((item) => item.state === state)?.count || 0}
                painCount={painStateCounts.find((item) => item.state === state)?.count || 0}
              />
            ))}
          </div>
        </Section>

        <Section label="Profile Intelligence" title="More profile intelligence creates smarter routing.">
          <p style={sub}>VaultForge Intelligence routes alerts, signals, opportunities, pain requests, operator matches, capital needs, and execution opportunities using profile intelligence.</p>
          <p style={{ ...muted, marginTop: 12 }}>The more complete your profile becomes, the smarter VaultForge gets at routing the right signals, markets, opportunities, and member connections to you.</p>
        </Section>

        <Section label="Not Real Estate Listings" title="This is private execution infrastructure.">
          <p style={sub}>Most platforms show finished listings after the market already sees them. VaultForge surfaces real-world pressure, routes the signal, and connects approved members before the opportunity becomes public noise.</p>
          <div style={{ ...grid, marginTop: 20 }}>
            <div style={panel}><div style={eyebrow}>Not A Marketplace</div><p style={sub}>VaultForge is not built for public browsing, mass posting, or open listings.</p></div>
            <div style={panel}><div style={eyebrow}>Not Social Media</div><p style={sub}>Members connect through routed intelligence, not random feeds or public chatter.</p></div>
            <div style={panel}><div style={eyebrow}>Not Lead Lists</div><p style={sub}>Signals are routed by fit, execution need, capital, pressure, and member capability.</p></div>
          </div>
        </Section>

        <Section label="Pain Intelligence" title="Pain is where opportunity begins.">
          <p style={sub}>Pain means a real-world problem requiring execution: capital gaps, stalled construction, distressed sellers, lender pressure, permit issues, tenant problems, operator needs, emergency exits, off-market opportunities, or partnership breakdowns.</p>
          <div style={{ marginTop: 18 }}>
            {painExamples.map((item) => <span key={item} style={badge}>{item}</span>)}
          </div>
        </Section>

        <Section label="Core Engine" title="Pain → Signal → Routing → Execution">
          <div style={wideGrid}>
            <div style={panel}><div style={eyebrow}>01</div><h3 style={h3}>Pain / Opportunity</h3><p style={muted}>A member submits a deal, opportunity, pressure point, capital need, operator request, or execution problem.</p></div>
            <div style={panel}><div style={eyebrow}>02</div><h3 style={h3}>VaultForge Signal</h3><p style={muted}>VaultForge Intelligence classifies the situation, identifies risk, urgency, service need, and execution path.</p></div>
            <div style={panel}><div style={eyebrow}>03</div><h3 style={h3}>Private Routing</h3><p style={muted}>The signal is routed to members, buyers, lenders, contractors, operators, or partners positioned to help.</p></div>
            <div style={panel}><div style={eyebrow}>04</div><h3 style={h3}>Execution</h3><p style={muted}>Members connect directly through rooms, messages, alerts, and route queues to move the situation forward.</p></div>
          </div>
        </Section>

        <Section label="Access Flow" title="Private access is controlled.">
          <div style={wideGrid}>
            <div style={panel}><div style={eyebrow}>Create Login</div><p style={sub}>Email, password, and recovery path create the member identity.</p></div>
            <div style={panel}><div style={eyebrow}>Complete Profile</div><p style={sub}>Profile intelligence tells VaultForge what you do, where you operate, and how you execute.</p></div>
            <div style={panel}><div style={eyebrow}>Admin Approval</div><p style={sub}>Owner approval activates the payment button for the right room.</p></div>
            <div style={panel}><div style={eyebrow}>Payment Unlock</div><p style={sub}>After payment, Investor Room or Member Room access unlocks automatically.</p></div>
          </div>
        </Section>

        <Section label="Legal / Disclaimers" title="Private network. Independent decisions.">
          <div style={wideGrid}>
            <div style={panel}><div style={eyebrow}>Not Broker / Lender</div><p style={muted}>VaultForge is not a broker, lender, attorney, investment advisor, securities dealer, or fiduciary.</p></div>
            <div style={panel}><div style={eyebrow}>No Guarantees</div><p style={muted}>VaultForge does not guarantee profits, funding, deals, introductions, closings, returns, or execution outcomes.</p></div>
            <div style={panel}><div style={eyebrow}>Due Diligence</div><p style={muted}>Members and investors are responsible for independent underwriting, legal review, compliance, verification, negotiations, and transaction decisions.</p></div>
            <div style={panel}><div style={eyebrow}>Cancellation Policy</div><p style={muted}>Memberships renew monthly until canceled. Cancellation stops future renewals. Activation payments and started billing cycles are not prorated or refunded.</p></div>
            <div style={panel}><div style={eyebrow}>Founder Status</div><p style={muted}>Founder pricing is limited and promotional. Founder status may be lost if membership is canceled and later restarted.</p></div>
            <div style={panel}><div style={eyebrow}>Approval Rights</div><p style={muted}>VaultForge may approve, deny, suspend, or remove access to protect network quality and execution balance.</p></div>
          </div>
        </Section>

        <section style={hero}>
          <div style={eyebrow}>VaultForge Intelligence</div>
          <h2 style={h2}>See pressure before the market does.</h2>
          <p style={sub}>Not every opportunity should become public. Not every problem belongs on the open market. VaultForge exists to coordinate execution before the rest of the market sees the pressure.</p>
          <div style={{ ...row, marginTop: 22 }}>
            <Link href="/member-access" style={goldBtn}>Request Member Access</Link>
            <Link href="/investor-access" style={btn}>Investor Room Access</Link>
            <Link href="/contact-admin" style={btn}>Contact Admin</Link>
          </div>
        </section>
      </div>
    </main>
  );
}