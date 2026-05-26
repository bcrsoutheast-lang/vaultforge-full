"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type SignalCard = {
  id: string;
  type: "Deal" | "Pain";
  state: string;
  city: string;
  title: string;
  assetType: string;
  urgency?: string;
  price?: string;
  fix?: string;
  arv?: string;
  need?: string;
  summary: string;
  photo?: string;
};

const OWNER_EMAIL = "bcrsoutheast@gmail.com";
const STATES = ["GA", "TN", "AL", "FL", "NC", "SC", "TX"];
const FOUNDER_DEADLINE = new Date("2026-06-01T23:59:59-04:00").getTime();

const fallbackDeals: SignalCard[] = [
  {
    id: "deal-ga-1",
    type: "Deal",
    state: "GA",
    city: "Cartersville",
    title: "Residential value-add near job growth corridor",
    assetType: "Residential",
    price: "$184,000",
    fix: "$38,000",
    arv: "$285,000",
    need: "Buyer • lender • contractor review",
    summary: "Limited outside view. Full address, owner/member contact, documents, photos, and route thread unlock inside.",
    photo: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "deal-ga-2",
    type: "Deal",
    state: "GA",
    city: "Atlanta",
    title: "Small commercial reposition with tenant upside",
    assetType: "Commercial",
    price: "$610,000",
    fix: "$95,000",
    arv: "$850,000",
    need: "Capital • operator • title support",
    summary: "Limited outside view. Full rent roll, member notes, owner route, and execution lane unlock inside.",
    photo: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "deal-tn-1",
    type: "Deal",
    state: "TN",
    city: "Chattanooga",
    title: "Fast-close residential opportunity",
    assetType: "Residential",
    price: "$215,000",
    fix: "$42,000",
    arv: "$335,000",
    need: "Cash buyer • private lender",
    summary: "Buyer/lender lane available inside after approved access.",
    photo: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "deal-fl-1",
    type: "Deal",
    state: "FL",
    city: "Jacksonville",
    title: "Infill land opportunity needing entitlement review",
    assetType: "Land",
    price: "$129,000",
    fix: "Entitlement",
    arv: "$235,000",
    need: "Developer • capital partner",
    summary: "Zoning, member notes, and route thread hidden outside.",
    photo: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "deal-tx-1",
    type: "Deal",
    state: "TX",
    city: "Dallas",
    title: "Development pad needing capital partner",
    assetType: "Land",
    price: "$325,000",
    fix: "Site work",
    arv: "$540,000",
    need: "Equity • JV • operator",
    summary: "Capital/JV route hidden until approved access.",
    photo: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80",
  },
];

const fallbackPain: SignalCard[] = [
  {
    id: "pain-ga-1",
    type: "Pain",
    state: "GA",
    city: "Atlanta",
    title: "Capital gap before closing window",
    assetType: "Residential",
    urgency: "Closing Risk",
    need: "Private lender • hard money • JV capital",
    summary: "Borrower needs a fast capital lane before contract pressure turns into a lost opportunity.",
    photo: "https://images.unsplash.com/photo-1582407947304-fd86f028f716?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "pain-nc-1",
    type: "Pain",
    state: "NC",
    city: "Charlotte",
    title: "Contractor stalled rehab schedule",
    assetType: "Residential",
    urgency: "Time Sensitive",
    need: "Contractor • boots on ground • operator",
    summary: "Project is behind schedule and needs a reliable contractor/operator lane.",
    photo: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "pain-tn-1",
    type: "Pain",
    state: "TN",
    city: "Nashville",
    title: "Seller deadline creating fast-close pressure",
    assetType: "Residential",
    urgency: "Urgent",
    need: "Cash buyer • lender • disposition partner",
    summary: "Owner needs a fast close or creative structure before the window closes.",
    photo: "https://images.unsplash.com/photo-1605146769289-440113cc3d00?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "pain-sc-1",
    type: "Pain",
    state: "SC",
    city: "Charleston",
    title: "Title issue blocking closing movement",
    assetType: "Land",
    urgency: "Closing Risk",
    need: "Attorney • title • closing help",
    summary: "Closing cannot move until the title issue is reviewed by the right lane.",
    photo: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "pain-al-1",
    type: "Pain",
    state: "AL",
    city: "Birmingham",
    title: "Owner needs fast disposition path",
    assetType: "Residential",
    urgency: "Urgent",
    need: "Buyer • disposition partner",
    summary: "Owner pressure may turn into a buyer match, wholesale lane, or referral route.",
    photo: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=900&q=80",
  },
];

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function clean(value: unknown, fallback = "") {
  const text = String(value || "").trim();
  return text || fallback;
}

function lower(value: unknown) {
  return clean(value).toLowerCase();
}

function currentEmail() {
  if (typeof window === "undefined") return "";
  const profile = readJson<any>("vaultforge_profile", {});
  return lower(profile?.email || localStorage.getItem("vf_email") || localStorage.getItem("member_email") || localStorage.getItem("email"));
}

function countdown() {
  const diff = FOUNDER_DEADLINE - Date.now();
  if (diff <= 0) return { expired: true, days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    expired: false,
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

function normalizeDeal(row: any, index: number): SignalCard {
  const rawState =
    row?.state ||
    row?.dealState ||
    row?.propertyState ||
    row?.marketState ||
    row?.selectedState ||
    row?.addressState ||
    row?.locationState ||
    "GA";

  return {
    id: clean(row?.id || row?.roomId || row?.dealId || row?.projectId, `live-deal-${index}`),
    type: "Deal",
    state: clean(rawState, "GA").toUpperCase(),
    city: clean(row?.city || row?.market || row?.area || row?.submarket || row?.county, "Market"),
    title: clean(row?.title || row?.headline || row?.name || row?.dealTitle || row?.projectName || row?.propertyName || row?.strategy, "Live Deal Opportunity"),
    assetType: clean(row?.assetType || row?.asset_type || row?.propertyType || row?.type || row?.dealType, "Real Estate"),
    price: clean(row?.askingPrice || row?.asking_price || row?.asking || row?.ask || row?.price || row?.purchasePrice || row?.amount, "Request inside"),
    fix: clean(row?.repairs || row?.repairEstimate || row?.repair_estimate || row?.fixAmount || row?.rehab || row?.rehabBudget, "Review inside"),
    arv: clean(row?.arv || row?.afterRepairValue || row?.after_repair_value || row?.value || row?.projectedValue, "Review inside"),
    need: clean(row?.need || row?.requestNeed || row?.routeNeed || row?.helpNeeded || row?.capitalNeed, "Investor/member review"),
    summary: clean(row?.teaser || row?.summary || row?.notes || row?.description || row?.privateNotes, "Live deal room available inside VaultForge."),
    photo: clean(row?.photo || row?.image || row?.imageUrl || row?.photoUrl || row?.coverPhoto || row?.photos?.[0] || row?.photoUrls?.[0] || row?.photo_urls?.[0]),
  };
}

function normalizePain(row: any, index: number): SignalCard {
  return {
    id: clean(row?.id || row?.roomId || row?.painId || row?.signalId, `live-pain-${index}`),
    type: "Pain",
    state: clean(row?.state || row?.painState || row?.propertyState || row?.marketState, "GA").toUpperCase(),
    city: clean(row?.city || row?.market || row?.area, "Market"),
    title: clean(row?.title || row?.headline || row?.problemTitle, "Live Pain Signal"),
    assetType: clean(row?.assetType || row?.asset_type || row?.propertyType, "Real Estate"),
    urgency: clean(row?.urgency || row?.priority || row?.timeline, "Live"),
    need: clean(row?.need || row?.helpNeeded || row?.routeNeed, "Problem solver / capital / execution"),
    summary: clean(row?.summary || row?.problem || row?.notes || row?.description, "Live problem signal available inside VaultForge."),
    photo: clean(row?.photo || row?.image || row?.imageUrl || row?.photoUrl || row?.photos?.[0] || row?.photoUrls?.[0]),
  };
}

function readLiveDeals() {
  const keys = [
    "vaultforge_deal_rooms_v1",
    "vaultforge_clean_deal_rooms_v1",
    "vaultforge_investor_deal_cards_v1",
    "vaultforge_investor_deals_v1",
    "vaultforge_deal_cards_v1",
    "vaultforge_deals_v1",
    "vaultforge_projects_v1",
    "vaultforge_property_cards_v1",
    "vaultforge_submitted_deals_v1",
    "vf_deals",
    "vf_deal_rooms",
    "vf_projects",
  ];
  const rows: any[] = [];
  keys.forEach((key) => {
    const parsed = readJson<any>(key, []);
    if (Array.isArray(parsed)) rows.push(...parsed);
    else if (parsed && typeof parsed === "object") rows.push(...Object.values(parsed));
  });
  const live = rows.filter(Boolean).map(normalizeDeal);
  const seen = new Set<string>();
  const deduped = live.filter((item) => {
    const key = `${item.id}|${item.title}|${item.city}|${item.state}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return deduped.length ? deduped : fallbackDeals;
}

function readLivePain() {
  const keys = [
    "vaultforge_pain_rooms_v1",
    "vaultforge_clean_pain_rooms_v1",
    "vaultforge_pain_requests_v1",
    "vaultforge_investor_pain_cards_v1",
    "vaultforge_pain_cards_v1",
    "vf_pain_requests",
    "vf_pain_rooms",
  ];
  const rows: any[] = [];
  keys.forEach((key) => {
    const parsed = readJson<any>(key, []);
    if (Array.isArray(parsed)) rows.push(...parsed);
    else if (parsed && typeof parsed === "object") rows.push(...Object.values(parsed));
  });
  const live = rows.filter(Boolean).map(normalizePain);
  return live.length ? live : fallbackPain;
}

const css = `
@keyframes vfTicker { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
@keyframes vfPulse { 0%,100% { box-shadow: 0 0 0 rgba(255,220,104,0); } 50% { box-shadow: 0 0 42px rgba(255,220,104,.26); } }
.vf-page { min-height: 100vh; background: radial-gradient(circle at top left, rgba(245,200,76,.16), transparent 30%), radial-gradient(circle at top right, rgba(190,18,60,.18), transparent 26%), linear-gradient(180deg,#02040a,#071018 48%,#02040a); color:#f8fafc; font-family: Inter, Arial, system-ui, sans-serif; overflow-x:hidden; }
.vf-wrap { max-width: 1440px; margin:0 auto; padding:18px 18px 110px; }
.vf-nav { display:flex; justify-content:space-between; align-items:center; gap:14px; flex-wrap:wrap; margin-bottom:18px; }
.vf-brand { color:#ffdc68; font-weight:950; font-size:30px; letter-spacing:-1.5px; }
.vf-navlinks { display:flex; gap:10px; flex-wrap:wrap; align-items:center; }
.vf-btn { border:1px solid rgba(207,216,230,.18); background:#171c29; color:#f7f7fb; border-radius:999px; padding:13px 17px; font-weight:950; text-decoration:none; display:inline-block; cursor:pointer; }
.vf-gold { border:0; background:#ffdc68; color:#10131a; }
.vf-red { background:#271016; border-color:rgba(255,70,70,.50); color:#ffb3b3; }
.vf-hero { border:1px solid rgba(245,197,66,.30); border-radius:36px; padding:clamp(28px,5vw,62px); background: radial-gradient(circle at 74% 10%, rgba(245,197,66,.22), transparent 30%), radial-gradient(circle at 10% 90%, rgba(255,45,60,.15), transparent 34%), linear-gradient(180deg,#0b101b,#050816); box-shadow:0 0 70px rgba(245,197,66,.12); margin-bottom:20px; }
.vf-logoWrap { display:flex; justify-content:center; margin:0 0 34px; }
.vf-logo { width:100%; max-width:540px; height:auto; object-fit:contain; display:block; filter:drop-shadow(0 0 30px rgba(245,197,66,.25)); }
.vf-eyebrow { color:#ffdc68; text-transform:uppercase; letter-spacing:6px; font-weight:950; font-size:12px; margin-bottom:12px; }
.vf-h1 { font-size:clamp(46px,8vw,104px); line-height:.88; letter-spacing:-5px; margin:0 0 22px; font-weight:950; max-width:1120px; }
.vf-h2 { font-size:clamp(31px,5vw,58px); line-height:.96; letter-spacing:-2px; margin:0 0 16px; font-weight:950; }
.vf-h3 { font-size:clamp(23px,3vw,34px); line-height:1.04; letter-spacing:-1px; margin:0 0 12px; font-weight:950; }
.vf-sub { color:#cbd5e1; font-size:clamp(19px,2.3vw,26px); line-height:1.32; margin:0; max-width:1120px; }
.vf-muted { color:#aeb7c7; margin:8px 0 0; line-height:1.38; }
.vf-row { display:flex; gap:10px; flex-wrap:wrap; align-items:center; }
.vf-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(250px,1fr)); gap:16px; }
.vf-wide { display:grid; grid-template-columns:repeat(auto-fit,minmax(330px,1fr)); gap:18px; }
.vf-section { border:1px solid rgba(245,197,66,.24); background:linear-gradient(180deg,#080d19,#050816); border-radius:32px; padding:clamp(22px,4vw,34px); margin-bottom:22px; }
.vf-panel { background:#121724; border:1px solid rgba(207,216,230,.16); border-radius:24px; padding:22px; color:#f7f7fb; text-decoration:none; }
.vf-goldPanel { border-color:rgba(245,197,66,.55); box-shadow:0 0 28px rgba(245,197,66,.12); }
.vf-redPanel { border-color:rgba(255,70,70,.55); box-shadow:0 0 28px rgba(255,70,70,.10); }
.vf-badge { display:inline-flex; border:1px solid rgba(245,197,66,.32); border-radius:999px; padding:9px 13px; color:#ffdc68; background:rgba(245,197,66,.07); font-weight:900; margin:6px 6px 0 0; }
.vf-ticker { border-top:1px solid rgba(245,197,66,.25); border-bottom:1px solid rgba(245,197,66,.25); background:#090d14; overflow:hidden; margin-bottom:22px; }
.vf-track { display:flex; gap:40px; width:max-content; padding:14px 0; animation:vfTicker 38s linear infinite; }
.vf-cardImg { width:100%; height:190px; object-fit:cover; border-radius:22px; border:1px solid rgba(245,197,66,.25); margin-bottom:14px; background:#090d14; }
.vf-liveDot { width:10px; height:10px; border-radius:999px; background:#30ff87; display:inline-block; margin-right:8px; box-shadow:0 0 18px rgba(48,255,135,.8); }
.vf-signal { animation:vfPulse 1.8s ease-in-out infinite; }
@media(max-width:720px){ .vf-wrap{padding:12px 12px 90px}.vf-navlinks{overflow-x:auto; flex-wrap:nowrap; width:100%; padding-bottom:4px}.vf-btn{white-space:nowrap}.vf-h1{letter-spacing:-3px}.vf-section,.vf-hero{border-radius:26px}.vf-wide{grid-template-columns:1fr} }
`;

function Nav({ owner }: { owner: boolean }) {
  return (
    <nav className="vf-nav">
      <div className="vf-row">
        <div className="vf-brand">VAULTFORGE</div>
        <span className="vf-badge">PRIVATE APPROVED ACCESS ONLY</span>
      </div>
      <div className="vf-navlinks">
        <Link href="/member-access" className="vf-btn vf-gold">Request Member Access</Link>
        <Link href="/investor-access" className="vf-btn vf-gold">Investor Room Access</Link>
        <Link href="/create-login" className="vf-btn">Create Login</Link>
        <Link href="/login" className="vf-btn">Members Login</Link>
        <Link href="/investor-login" className="vf-btn">Investor Login</Link>
        <Link href="/admin" className={owner ? "vf-btn vf-red" : "vf-btn"}>Admin</Link>
      </div>
    </nav>
  );
}

function Ticker() {
  const items = [
    "PRIVATE INTELLIGENCE NETWORK",
    "PAIN → SIGNAL → ROUTING → EXECUTION",
    "APPROVED MEMBERS ONLY",
    "DEALS ROUTED BY FIT",
    "PAIN SIGNALS ROUTED BY NEED",
    "INVESTOR ACCESS IS SEPARATE",
    "NOT A LISTINGS SITE",
    "FOUNDER ALLOCATIONS CLOSE JUNE 1",
  ];
  return (
    <div className="vf-ticker">
      <div className="vf-track">
        {[...items, ...items].map((item, index) => (
          <div key={`${item}-${index}`} style={{ whiteSpace: "nowrap", color: "#ffdc68", fontWeight: 950, letterSpacing: 3 }}>{item}</div>
        ))}
      </div>
    </div>
  );
}

function SignalCard({ item }: { item: SignalCard }) {
  const isPain = item.type === "Pain";
  return (
    <div className={`vf-panel ${isPain ? "vf-redPanel" : "vf-goldPanel"} vf-signal`}>
      {item.photo ? <img className="vf-cardImg" src={item.photo} alt={item.title} /> : null}
      <div className="vf-eyebrow"><span className="vf-liveDot" />LIVE {item.type} • {item.city}, {item.state}</div>
      <h3 className="vf-h3">{item.title}</h3>
      <p className="vf-sub" style={{ fontSize: 18 }}>{item.summary}</p>
      <div className="vf-grid" style={{ marginTop: 14 }}>
        <div className="vf-panel"><div className="vf-eyebrow">Asset</div><p className="vf-muted">{item.assetType}</p></div>
        <div className="vf-panel"><div className="vf-eyebrow">{isPain ? "Urgency" : "Price"}</div><p className="vf-muted">{isPain ? item.urgency || "Live" : item.price || "Inside"}</p></div>
        {!isPain ? <div className="vf-panel"><div className="vf-eyebrow">Fix / ARV</div><p className="vf-muted">{item.fix || "Inside"} / {item.arv || "Inside"}</p></div> : null}
        <div className="vf-panel"><div className="vf-eyebrow">Need</div><p className="vf-muted">{item.need || "Review inside"}</p></div>
      </div>
      <div className="vf-row" style={{ marginTop: 16 }}>
        <Link href="/investor-access" className="vf-btn vf-gold">Enter To See Inside</Link>
        <Link href="/member-access" className="vf-btn">{isPain ? "Apply To Solve Pain" : "Apply To Work Deals"}</Link>
      </div>
    </div>
  );
}

function StateCard({ state, deals, pain }: { state: string; deals: number; pain: number }) {
  return (
    <div className="vf-panel">
      <div className="vf-eyebrow">{state}</div>
      <h3 className="vf-h3">{deals + pain} live signals</h3>
      <p className="vf-muted">Deal windows: {deals}</p>
      <p className="vf-muted">Pain signals: {pain}</p>
    </div>
  );
}

function Section({ label, title, children }: { label: string; title: string; children: React.ReactNode }) {
  return (
    <section className="vf-section">
      <div className="vf-eyebrow">{label}</div>
      <h2 className="vf-h2">{title}</h2>
      {children}
    </section>
  );
}

export default function HomePage() {
  const [tick, setTick] = useState(0);
  const [selectedState, setSelectedState] = useState("GA");
  const [owner, setOwner] = useState(false);

  useEffect(() => {
    const refresh = () => {
      setOwner(currentEmail() === OWNER_EMAIL);
      setTick((v) => v + 1);
    };
    refresh();
    const interval = window.setInterval(() => setTick((v) => v + 1), 1000);
    window.addEventListener("storage", refresh);
    window.addEventListener("vaultforge-admin-action-change", refresh);
    window.addEventListener("vaultforge-investor-change", refresh);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("storage", refresh);
      window.removeEventListener("vaultforge-admin-action-change", refresh);
      window.removeEventListener("vaultforge-investor-change", refresh);
    };
  }, []);

  const timer = useMemo(() => countdown(), [tick]);
  const deals = useMemo(() => readLiveDeals(), [tick]);
  const pain = useMemo(() => readLivePain(), [tick]);
  const shownDeals = deals.filter((d) => d.state === selectedState).slice(0, 2);
  const shownPain = pain.filter((p) => p.state === selectedState).slice(0, 2);

  return (
    <main className="vf-page">
      <style>{css}</style>
      <div className="vf-wrap">
        <Nav owner={owner} />

        <section className="vf-hero">
          <div className="vf-logoWrap">
            <img src="/vaultforge-logo.png" alt="VaultForge" className="vf-logo" />
          </div>
          <div className="vf-eyebrow">VaultForge Intelligence</div>
          <h1 className="vf-h1">Private real estate intelligence.</h1>
          <p className="vf-sub">
            VaultForge is a private real estate execution network where approved members post Deal Opportunities and Pain Signals, and approved investors can request information, funding help, owner contact, or routed execution without seeing the private member directory.
          </p>
          <p className="vf-sub" style={{ marginTop: 16 }}>
            Deals, capital, contractors, title/closing, operators, insurance, buyers, and problem solvers in one controlled system.
          </p>
          <div className="vf-row" style={{ marginTop: 24 }}>
            <Link href="/member-access" className="vf-btn vf-gold">Request Member Access</Link>
            <Link href="/investor-access" className="vf-btn vf-gold">Investor Room Access</Link>
            <Link href="/create-login" className="vf-btn">Create Login + Password</Link>
            <Link href="/login" className="vf-btn">Members Login</Link>
            <Link href="/investor-login" className="vf-btn">Investor Room Login</Link>
          </div>
          <div style={{ marginTop: 22 }}>
            <span className="vf-badge">BUILT BY OPERATORS</span>
            <span className="vf-badge">PRIVATE NETWORK</span>
            <span className="vf-badge">PAIN → SIGNAL → ROUTING → EXECUTION</span>
          </div>
        </section>

        <Ticker />

        <Section label="Live VaultForge Market Preview" title="Click a state. See Deals and Pain split.">
          <p className="vf-sub">
            This is the outside window into VaultForge. Public visitors see limited teaser information only. Approved Investor Room or Member Room access unlocks the full request thread, owner contact workflow, routing, documents, messages, and execution lanes.
          </p>
          <div className="vf-row" style={{ marginTop: 22 }}>
            {STATES.map((state) => (
              <button key={state} type="button" className={state === selectedState ? "vf-btn vf-gold" : "vf-btn"} onClick={() => setSelectedState(state)}>
                {state}
              </button>
            ))}
          </div>
          <div className="vf-grid" style={{ marginTop: 22 }}>
            {STATES.map((state) => (
              <StateCard
                key={state}
                state={state}
                deals={deals.filter((d) => d.state === state).length}
                pain={pain.filter((p) => p.state === state).length}
              />
            ))}
          </div>
        </Section>

        <Section label={`${selectedState} Deal Opportunities`} title="Live deal windows. Limited outside info.">
          <p className="vf-sub">Residential shows beds, baths, price, fix amount, ARV, and state where available. Commercial and Land show matching fields. Full location, owner/member contact, documents, and thread are inside.</p>
          <div className="vf-wide" style={{ marginTop: 22 }}>
            {(shownDeals.length ? shownDeals : deals.slice(0, 2)).map((item) => <SignalCard key={item.id} item={item} />)}
          </div>
        </Section>

        <Section label={`${selectedState} Pain Signals`} title="Live pain windows. No member info outside.">
          <p className="vf-sub">Pain cards show the problem type, urgency, asset, state, and what help is needed. They do not reveal member identity or personal contact outside the room.</p>
          <div className="vf-wide" style={{ marginTop: 22 }}>
            {(shownPain.length ? shownPain : pain.slice(0, 2)).map((item) => <SignalCard key={item.id} item={item} />)}
          </div>
        </Section>

        <section className="vf-grid" style={{ marginBottom: 22 }}>
          <div className="vf-panel vf-goldPanel"><div className="vf-eyebrow">Founder Network</div><h2 className="vf-h2">Private</h2><p className="vf-muted">approved access and balanced role allocations</p></div>
          <div className="vf-panel vf-goldPanel"><div className="vf-eyebrow">Member Founder Pricing</div><h2 className="vf-h2">{timer.expired ? "$99" : "$49"}</h2><p className="vf-muted">{timer.expired ? "$99 activation, then $299/month" : "$49 activation, $49 second month, then $299/month"}</p></div>
          <div className="vf-panel vf-goldPanel"><div className="vf-eyebrow">Investor Access</div><h2 className="vf-h2">$79</h2><p className="vf-muted">first month, then $149/month</p></div>
          <div className="vf-panel vf-redPanel"><div className="vf-eyebrow">Founder Countdown</div><h2 className="vf-h2">{String(timer.days).padStart(2, "0")}d {String(timer.hours).padStart(2, "0")}h</h2><p className="vf-muted">founding allocations close June 1</p></div>
        </section>

        <Section label="Two Controlled Access Lanes" title="Members build the network. Investors access the signal room.">
          <div className="vf-wide" style={{ marginTop: 22 }}>
            <div className="vf-panel vf-goldPanel">
              <div className="vf-eyebrow">Investor Room</div>
              <h3 className="vf-h3">Controlled access to deal and pain signals.</h3>
              <p className="vf-muted">Investors can review Deal Opportunity cards, Pain submissions, state signals, request more information, message through controlled threads, and request execution help.</p>
              <p className="vf-muted">Investor price: $79 first month, then $149/month.</p>
              <div className="vf-row" style={{ marginTop: 16 }}>
                <Link href="/investor-access" className="vf-btn vf-gold">Get Investor Room Access</Link>
                <Link href="/investor-login" className="vf-btn">Investor Room Login</Link>
              </div>
            </div>
            <div className="vf-panel vf-goldPanel">
              <div className="vf-eyebrow">Private Members Site</div>
              <h3 className="vf-h3">Approved operators, capital, buyers, and problem solvers.</h3>
              <p className="vf-muted">Members operate inside the private command center: routed requests, Deal/Pain rooms, messages, alerts, profile-based routing, state intelligence, and execution lanes.</p>
              <p className="vf-muted">Members are not publicly browsed. The network is protected by profile review, admin approval, payment unlock, and controlled contact release.</p>
              <div className="vf-row" style={{ marginTop: 16 }}>
                <Link href="/member-access" className="vf-btn vf-gold">Request Member Access</Link>
                <Link href="/login" className="vf-btn">Members Login</Link>
              </div>
            </div>
          </div>
        </Section>

        <Section label="One-Stop Real Estate Execution Shop" title="Deals, problems, people, and next moves in one private system.">
          <p className="vf-sub">VaultForge is built for the messy real estate work that happens before, during, and after a deal: finding capital, locating buyers, solving title/closing problems, finding contractors, routing operators, reviewing Pain signals, requesting boots on ground, and turning pressure into execution.</p>
          <div className="vf-grid" style={{ marginTop: 20 }}>
            <div className="vf-panel"><div className="vf-eyebrow">Capital</div><p className="vf-sub" style={{ fontSize: 18 }}>Private lenders, hard money, equity partners, JV capital, proof-of-funds context, and funding gap routing.</p></div>
            <div className="vf-panel"><div className="vf-eyebrow">Execution</div><p className="vf-sub" style={{ fontSize: 18 }}>Contractors, operators, boots on ground, property management, disposition, insurance, and transaction support.</p></div>
            <div className="vf-panel"><div className="vf-eyebrow">Deal Intelligence</div><p className="vf-sub" style={{ fontSize: 18 }}>Deal Opportunities, Pain submissions, market pressure, state filters, routed requests, and controlled message threads.</p></div>
            <div className="vf-panel"><div className="vf-eyebrow">Protection</div><p className="vf-sub" style={{ fontSize: 18 }}>Profiles attached, contact hidden, member data private, admin approval, payment unlock, and release-only introductions.</p></div>
          </div>
        </Section>

        <Section label="Not Real Estate Listings" title="This is private execution infrastructure.">
          <p className="vf-sub">Most platforms show finished listings after the market already sees them. VaultForge surfaces real-world pressure, routes the signal, and connects approved members before the opportunity becomes public noise.</p>
        </Section>

        <Section label="Legal / Disclaimers" title="Private network. Independent decisions.">
          <div className="vf-wide">
            <div className="vf-panel"><div className="vf-eyebrow">Not Broker / Lender</div><p className="vf-muted">VaultForge is not a broker, lender, attorney, investment advisor, securities dealer, or fiduciary.</p></div>
            <div className="vf-panel"><div className="vf-eyebrow">No Guarantees</div><p className="vf-muted">VaultForge does not guarantee profits, funding, deals, introductions, closings, returns, or execution outcomes.</p></div>
            <div className="vf-panel"><div className="vf-eyebrow">Due Diligence</div><p className="vf-muted">Members and investors are responsible for independent underwriting, legal review, compliance, verification, negotiations, and transaction decisions.</p></div>
          </div>
        </Section>

        <section className="vf-hero">
          <div className="vf-eyebrow">VaultForge Intelligence</div>
          <h2 className="vf-h2">See pressure before the market does.</h2>
          <p className="vf-sub">Not every opportunity should become public. Not every problem belongs on the open market. VaultForge exists to coordinate execution before the rest of the market sees the pressure.</p>
          <div className="vf-row" style={{ marginTop: 22 }}>
            <Link href="/member-access" className="vf-btn vf-gold">Request Member Access</Link>
            <Link href="/investor-access" className="vf-btn">Investor Room Access</Link>
            <Link href="/contact-admin" className="vf-btn">Contact Admin</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
