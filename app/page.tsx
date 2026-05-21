"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type FounderRole = {
  key: string;
  title: string;
  cap: number;
  aliases: string[];
};

type FounderCount = FounderRole & {
  filled: number;
  remaining: number;
  full: boolean;
};

type Countdown = {
  expired: boolean;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

const OWNER_EMAIL = "bcrsoutheast@gmail.com";
const PROFILE_KEY = "vaultforge_profile";
const LOGIN_KEY = "vaultforge_member_login_v1";
const FOUNDER_DEADLINE = new Date("2026-05-30T23:59:59-04:00").getTime();

const founderRoles: FounderRole[] = [
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
  "NOT A LISTINGS SITE",
  "FOUNDING ALLOCATIONS CLOSE MAY 30",
  "VAULTFORGE INTELLIGENCE ONLINE",
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

function safeJson<T>(raw: string | null, fallback: T): T {
  try {
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function clean(value: unknown) {
  return String(value || "").trim();
}

function cleanLower(value: unknown) {
  return clean(value).toLowerCase();
}

function allStoredProfiles(): any[] {
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
    const parsed = safeJson<unknown>(localStorage.getItem(key), []);
    if (Array.isArray(parsed)) rows.push(...parsed.filter(Boolean));
    else if (parsed && typeof parsed === "object") rows.push(...Object.values(parsed as Record<string, unknown>).filter(Boolean));
  }

  const singleProfile = safeJson<any>(localStorage.getItem(PROFILE_KEY), null);
  if (singleProfile && typeof singleProfile === "object") rows.push(singleProfile);

  const seen = new Set<string>();
  return rows.filter((profile: any, index) => {
    const id = cleanLower(profile?.email || profile?.memberEmail || profile?.id || `profile-${index}`);
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

function founderCounts(): FounderCount[] {
  const profiles = allStoredProfiles();

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

function deadlineCountdown(): Countdown {
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

function saveLogin(email: string, password: string) {
  const existing = safeJson<any>(localStorage.getItem(PROFILE_KEY), {});
  const isOwner = cleanLower(email) === OWNER_EMAIL;

  const patch = {
    email: cleanLower(email),
    passwordSet: Boolean(password),
    profileComplete: Boolean(existing.profileComplete),
    approvedForPayment: isOwner || Boolean(existing.approvedForPayment),
    paymentStatus: isOwner ? "comped" : existing.paymentStatus || "unpaid",
    accessStatus: isOwner ? "active" : existing.accessStatus || "profile_required",
    updatedAt: new Date().toISOString(),
  };

  localStorage.setItem(LOGIN_KEY, JSON.stringify({ ...patch, createdAt: existing.createdAt || new Date().toISOString() }));
  localStorage.setItem(PROFILE_KEY, JSON.stringify({ ...existing, ...patch }));
  localStorage.setItem("vf_email", cleanLower(email));
  localStorage.setItem("member_email", cleanLower(email));
  window.dispatchEvent(new Event("vaultforge-access-change"));
}

function recoverPassword(email: string) {
  if (!ok()) return;
  localStorage.setItem(
    "vaultforge_password_recovery_v1",
    JSON.stringify({
      email: cleanLower(email),
      requestedAt: new Date().toISOString(),
      status: "requested",
    })
  );
  window.dispatchEvent(new Event("vaultforge-password-recovery"));
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
const h1: React.CSSProperties = { fontSize: "clamp(52px,11vw,128px)", lineHeight: 0.82, letterSpacing: -6, margin: "0 0 20px", fontWeight: 950 };
const h2: React.CSSProperties = { fontSize: "clamp(34px,6vw,70px)", lineHeight: 0.92, letterSpacing: -3, margin: "0 0 16px", fontWeight: 950 };
const h3: React.CSSProperties = { fontSize: "clamp(25px,4vw,42px)", lineHeight: 1, letterSpacing: -1.5, margin: "0 0 12px", fontWeight: 950 };
const sub: React.CSSProperties = { color: "#c9d0dc", fontSize: "clamp(19px,2.5vw,26px)", lineHeight: 1.28, margin: 0 };
const muted: React.CSSProperties = { color: "#aeb7c7", margin: "8px 0 0", lineHeight: 1.35 };
const grid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: 16 };
const wideGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 18 };
const row: React.CSSProperties = { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" };
const badge: React.CSSProperties = { display: "inline-flex", border: "1px solid rgba(245,197,66,.32)", borderRadius: 999, padding: "9px 13px", color: "#ffd45a", background: "rgba(245,197,66,.07)", fontWeight: 900, margin: "6px 6px 0 0" };
const input: React.CSSProperties = { width: "100%", boxSizing: "border-box", border: "1px solid rgba(207,216,230,.18)", background: "#111823", color: "#f8fafc", borderRadius: 16, padding: "14px 15px", fontSize: 16 };
const field: React.CSSProperties = { display: "grid", gap: 8, marginTop: 14 };

function Nav() {
  return (
    <nav style={nav}>
      <div style={navSide}>
        <div style={brand}>VAULTFORGE</div>
        <span style={badge}>PRIVATE APPROVED ACCESS ONLY</span>
      </div>
      <div style={navSide}>
        <Link href="/member-access" style={goldBtn}>Member Access</Link>
        <Link href="/create-login" style={btn}>Create Login</Link>
        <Link href="/command" style={btn}>Member Command</Link>
        <Link href="/admin" style={redBtn}>Admin Command</Link>
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
            onError={() => setIndex((value) => value + 1 < logoCandidates.length ? value + 1 : logoCandidates.length)}
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
        <div key={label} style={redPanel}>
          <div style={eyebrow}>{label}</div>
          <h2 style={h2}>{String(value).padStart(2, "0")}</h2>
          <p style={muted}>until founding allocations close</p>
        </div>
      ))}
    </div>
  );
}

function LoginPanel() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [notice, setNotice] = useState("");

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!email.trim()) {
      setNotice("Enter an email first.");
      return;
    }
    if (!password.trim() || password !== confirm) {
      setNotice("Passwords must match.");
      return;
    }
    saveLogin(email, password);
    setNotice("Login created. Next step: complete your profile.");
  }

  function recover() {
    if (!email.trim()) {
      setNotice("Enter your email, then tap recover password.");
      return;
    }
    recoverPassword(email);
    setNotice("Password recovery request saved. Full email recovery will connect later.");
  }

  return (
    <section style={card}>
      <div style={eyebrow}>Create Login / Member Access</div>
      <h2 style={h2}>Start private access.</h2>
      <p style={sub}>Create your login first. Then complete your profile. Admin approval unlocks payment. Payment unlocks full member access.</p>

      <form onSubmit={submit} style={{ marginTop: 18 }}>
        <div style={wideGrid}>
          <label style={field}>
            <span style={eyebrow}>Email</span>
            <input style={input} type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="member@email.com" />
          </label>
          <label style={field}>
            <span style={eyebrow}>Password</span>
            <input style={input} type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Create password" />
          </label>
          <label style={field}>
            <span style={eyebrow}>Confirm Password</span>
            <input style={input} type="password" value={confirm} onChange={(event) => setConfirm(event.target.value)} placeholder="Confirm password" />
          </label>
        </div>

        <div style={{ ...row, marginTop: 18 }}>
          <button type="submit" style={goldBtn}>Make Login</button>
          <Link href="/profile" style={btn}>Complete Profile</Link>
          <button type="button" style={btn} onClick={recover}>Forgot / Recover Password</button>
          <Link href="/contact-admin" style={btn}>Contact Admin</Link>
        </div>
      </form>

      {notice ? <p style={{ ...sub, marginTop: 18 }}>{notice}</p> : null}

      <div style={{ ...goldPanel, marginTop: 22 }}>
        <div style={eyebrow}>VaultForge Intelligence Notice</div>
        <h3 style={h3}>More profile intelligence creates smarter routing.</h3>
        <p style={sub}>VaultForge Intelligence routes alerts, signals, opportunities, pain requests, operator matches, capital needs, and execution opportunities using profile intelligence.</p>
        <p style={{ ...muted, marginTop: 12 }}>The more complete your profile becomes, the smarter VaultForge gets at routing the right signals, markets, opportunities, and member connections to you.</p>
      </div>
    </section>
  );
}

function FounderAllocationCard({ item }: { item: FounderCount }) {
  const percent = Math.min(100, Math.round((item.filled / item.cap) * 100));

  return (
    <div style={item.full || item.remaining <= 2 ? redPanel : goldPanel}>
      <div style={eyebrow}>{item.title}</div>
      <h3 style={h3}>{item.filled} / {item.cap} Filled</h3>
      <p style={sub}>{item.remaining} founder allocations remaining</p>
      <div style={{ height: 10, borderRadius: 999, background: "rgba(255,255,255,.08)", overflow: "hidden", marginTop: 14 }}>
        <div style={{ height: "100%", width: `${percent}%`, background: item.full || item.remaining <= 2 ? "#ff4d5e" : "#ffdc68" }} />
      </div>
      <p style={muted}>{item.full ? "Founder allocation closed." : item.remaining <= 2 ? "Almost full." : "Founder allocation open."}</p>
    </div>
  );
}

export default function HomePage() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => setTick((value) => value + 1), 1000);
    const refresh = () => setTick((value) => value + 1);
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

  const timer = useMemo(() => deadlineCountdown(), [tick]);
  const counts = useMemo(() => founderCounts(), [tick]);
  const founderClosed = timer.expired || counts.every((item) => item.full);
  const totalFilled = counts.reduce((sum, item) => sum + item.filled, 0);
  const totalCap = counts.reduce((sum, item) => sum + item.cap, 0);

  return (
    <main style={page}>
      <style>{`@keyframes tickerMove { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }`}</style>
      <div style={wrap}>
        <Nav />

        <section style={hero}>
          <LogoHero />
          <div style={eyebrow}>VaultForge Intelligence</div>
          <h1 style={h1}>Pain becomes signal.</h1>
          <p style={sub}>VaultForge is not a listings site. It is a private approved-member intelligence, routing, and execution network for real estate operators, buyers, lenders, partners, and problem solvers.</p>
          <p style={{ ...sub, marginTop: 16 }}>Members submit opportunities, deals, pain, capital needs, operator requests, and execution problems. VaultForge Intelligence analyzes the signal and routes it to members best positioned to execute.</p>
          <div style={{ ...row, marginTop: 24 }}>
            <Link href="/member-access" style={goldBtn}>Request Member Access</Link>
            <Link href="/create-login" style={btn}>Create Login</Link>
            <Link href="/profile" style={btn}>Build Profile</Link>
            <Link href="/contact-admin" style={btn}>Contact Admin</Link>
          </div>
          <div style={{ marginTop: 22 }}>
            <span style={badge}>PRIVATE NETWORK</span>
            <span style={badge}>APPROVED MEMBERS ONLY</span>
            <span style={badge}>PAIN → SIGNAL → ROUTING → EXECUTION</span>
          </div>
        </section>

        <Ticker />

        <section style={{ marginBottom: 22 }}>
          <div style={grid}>
            <div style={goldPanel}><div style={eyebrow}>Founder Network</div><h2 style={h2}>{totalFilled} / {totalCap}</h2><p style={muted}>real filled founder allocations</p></div>
            <div style={goldPanel}><div style={eyebrow}>Founder Pricing</div><h2 style={h2}>{founderClosed ? "$99" : "$49"}</h2><p style={muted}>{founderClosed ? "$99 activation, then $299/month" : "$49 activation, $49 second month, then $299/month"}</p></div>
            <div style={redPanel}><div style={eyebrow}>Pain Signals</div><h2 style={h2}>Live</h2><p style={muted}>problem pressure routed by profile fit</p></div>
            <div style={goldPanel}><div style={eyebrow}>Access</div><h2 style={h2}>Private</h2><p style={muted}>approved-member access only</p></div>
          </div>
        </section>

        <Section label="Founder Access Countdown" title={founderClosed ? "Founding allocations closed." : "Founding allocations close May 30."}>
          <CountdownCards timer={timer} />
          <div style={{ ...panel, marginTop: 18 }}>
            <p style={sub}>{founderClosed ? "Standard access is now active: $99 activation, then $299/month." : "Founder access: $49 activation, $49 second month, then $299/month. Founder allocations close May 30 or when strategic categories reach capacity."}</p>
          </div>
        </Section>

        <Section label="Founding Network Allocations" title="Balanced network. Limited seats by role.">
          <p style={sub}>VaultForge intentionally limits member categories so the network does not become overloaded with only buyers, only wholesalers, or only operators. The goal is a functioning execution ecosystem.</p>
          <div style={{ ...grid, marginTop: 20 }}>
            {counts.map((item) => <FounderAllocationCard key={item.key} item={item} />)}
          </div>
        </Section>

        <LoginPanel />

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
            <div style={panel}><div style={eyebrow}>Admin Approval</div><p style={sub}>Owner approval unlocks the payment step.</p></div>
            <div style={panel}><div style={eyebrow}>Payment Unlock</div><p style={sub}>After payment, the full member execution network unlocks.</p></div>
          </div>
        </Section>

        <Section label="Legal / Disclaimers" title="Private network. Independent decisions.">
          <div style={wideGrid}>
            <div style={panel}><div style={eyebrow}>Not Broker / Lender</div><p style={muted}>VaultForge is not a broker, lender, attorney, investment advisor, securities dealer, or fiduciary.</p></div>
            <div style={panel}><div style={eyebrow}>No Guarantees</div><p style={muted}>VaultForge does not guarantee profits, funding, deals, introductions, closings, returns, or execution outcomes.</p></div>
            <div style={panel}><div style={eyebrow}>Due Diligence</div><p style={muted}>Members are responsible for independent underwriting, legal review, compliance, verification, negotiations, and transaction decisions.</p></div>
            <div style={panel}><div style={eyebrow}>Cancellation Policy</div><p style={muted}>Memberships renew monthly until canceled. Cancellation stops future renewals. Activation payments and started billing cycles are not prorated or refunded.</p></div>
            <div style={panel}><div style={eyebrow}>Founder Status</div><p style={muted}>Founder pricing is limited and promotional. Founder status may be lost if membership is canceled and later restarted.</p></div>
            <div style={panel}><div style={eyebrow}>Approval Rights</div><p style={muted}>VaultForge may approve, deny, suspend, or remove member access to protect network quality and execution balance.</p></div>
          </div>
        </Section>

        <section style={hero}>
          <div style={eyebrow}>VaultForge Intelligence</div>
          <h2 style={h2}>See pressure before the market does.</h2>
          <p style={sub}>Not every opportunity should become public. Not every problem belongs on the open market. VaultForge exists to coordinate execution before the rest of the market sees the pressure.</p>
          <div style={{ ...row, marginTop: 22 }}>
            <Link href="/member-access" style={goldBtn}>Request Access</Link>
            <Link href="/create-login" style={btn}>Create Login</Link>
            <Link href="/contact-admin" style={btn}>Contact Admin</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
