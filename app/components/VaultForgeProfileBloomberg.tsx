"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type ProfileData = {
  profilePhoto: string;
  companyLogo: string;
  fullName: string;
  company: string;
  email: string;
  phone: string;
  website: string;
  bio: string;
  preferredContact: string[];
  memberTypes: string[];
  buyStates: string[];
  operateStates: string[];
  alertStates: string[];
  contactStates: string[];
  countiesByState: Record<string, string[]>;
  markets: string[];
  assetTypes: string[];
  dealTypes: string[];
  painPreferences: string[];
  executionCapabilities: string[];
  capitalRoles: string[];
  dealSize: string;
  capitalAvailable: string;
  fundingSpeed: string;
  proofOfFunds: string;
  closeStyle: string[];
  routingRules: string[];
  visibility: string[];
  privateAiNotes: string;
};

const STORAGE_KEY = "vaultforge_profile_v2";

const EMPTY_PROFILE: ProfileData = {
  profilePhoto: "",
  companyLogo: "",
  fullName: "",
  company: "",
  email: "",
  phone: "",
  website: "",
  bio: "",
  preferredContact: [],
  memberTypes: [],
  buyStates: [],
  operateStates: [],
  alertStates: [],
  contactStates: [],
  countiesByState: {},
  markets: [],
  assetTypes: [],
  dealTypes: [],
  painPreferences: [],
  executionCapabilities: [],
  capitalRoles: [],
  dealSize: "",
  capitalAvailable: "",
  fundingSpeed: "",
  proofOfFunds: "",
  closeStyle: [],
  routingRules: [],
  visibility: [],
  privateAiNotes: "",
};

const STATES = ["GA", "TN", "AL", "FL", "NC", "SC", "TX"];

const COUNTY_MAP: Record<string, string[]> = {
  GA: ["Fulton", "Cobb", "Cherokee", "Bartow", "Paulding", "Gwinnett", "DeKalb", "Clayton", "Henry", "Chatham", "Richmond", "Muscogee", "Bibb", "Hall"],
  TN: ["Davidson", "Shelby", "Knox", "Hamilton", "Rutherford", "Williamson", "Sumner", "Wilson", "Sevier", "Blount"],
  AL: ["Jefferson", "Madison", "Mobile", "Montgomery", "Tuscaloosa", "Baldwin", "Shelby", "Lee", "Morgan", "Calhoun"],
  FL: ["Miami-Dade", "Broward", "Palm Beach", "Orange", "Hillsborough", "Duval", "Pinellas", "Lee", "Polk", "Volusia", "Osceola"],
  NC: ["Mecklenburg", "Wake", "Guilford", "Forsyth", "Durham", "Buncombe", "New Hanover", "Union", "Cabarrus", "Johnston"],
  SC: ["Greenville", "Richland", "Charleston", "Horry", "Spartanburg", "Lexington", "York", "Beaufort", "Berkeley", "Anderson"],
  TX: ["Harris", "Dallas", "Tarrant", "Bexar", "Travis", "Collin", "Denton", "Fort Bend", "Montgomery", "Williamson"],
};

const MARKETS = [
  "Atlanta", "North Georgia", "Chattanooga", "Nashville", "Knoxville", "Birmingham", "Huntsville", "Montgomery",
  "Jacksonville", "Tampa", "Orlando", "Miami", "Charlotte", "Raleigh-Durham", "Greenville-Spartanburg",
  "Charleston", "Dallas-Fort Worth", "Houston", "Austin", "San Antonio",
];

const MEMBER_TYPES = ["Investor", "Lender", "Operator", "Wholesaler", "Contractor", "Broker", "Developer", "Agent", "Attorney", "Architect", "Property Manager", "Fund", "Family Office", "Private Equity"];
const CONTACT_METHODS = ["Phone", "Email", "Text", "VaultForge Message", "Intro Request Only"];
const ASSETS = ["SFR", "Multifamily", "Commercial", "Land", "Industrial", "Retail", "Office", "Mixed Use", "Self Storage", "Mobile Home Park", "Hospitality", "RV Park", "Warehouse", "Medical", "Senior Living"];
const DEAL_TYPES = ["Flip", "Buy & Hold", "Wholesale", "JV", "Development", "Debt", "Equity", "Distressed", "Ground Up", "Value Add", "Notes", "STR", "Build To Rent", "Entitlement"];
const PAIN_PREFS = ["Distressed Seller", "Funding Gap", "Stalled Project", "Contractor Issue", "Permit Problem", "Off-Market Deal", "Emergency Exit", "JV Needed", "Land Opportunity", "Capital Stack", "Operator Needed", "Buyer Needed", "Tenant Issue", "Portfolio Liquidation"];
const EXECUTION = ["Acquisitions", "Dispositions", "Underwriting", "Construction", "Property Management", "Leasing", "Entitlements", "Permitting", "Capital Raising", "Brokerage", "Asset Management", "Legal", "Tax", "Design", "Engineering", "Boots On Ground"];
const CAPITAL = ["Cash Buyer", "Private Lender", "Hard Money", "DSCR", "Bridge", "Equity Partner", "JV Partner", "Debt Partner", "Can Raise Capital", "Needs Capital", "Can Sponsor Debt", "Can Close Fast"];
const CLOSE_STYLE = ["Can Close Cash", "Needs Financing", "Can JV", "Needs Operator", "Needs Lender", "Needs Buyer", "Can Bring Crew", "Can Bring Permits Help", "Can Bring Property Manager"];
const ROUTING = ["Allow AI Routing", "Allow Direct Intros", "Urgent Alerts", "Daily Digest", "Only High-Fit Matches", "Member Messages Allowed", "Lender Visibility", "Investor Visibility", "Operator Visibility"];
const VISIBILITY = ["Visible To Members", "Private Contact Info", "Show Company", "Show Profile Photo", "Show Buy Box", "Hide Capital Range", "Owner/Admin Only Notes"];
const DEAL_SIZE = ["Under $100K", "$100K-$250K", "$250K-$500K", "$500K-$1M", "$1M-$3M", "$3M-$10M", "$10M+"];
const CAPITAL_AVAILABLE = ["Under $50K", "$50K-$100K", "$100K-$250K", "$250K-$500K", "$500K-$1M", "$1M-$5M", "$5M+", "Need Capital"];
const SPEED = ["Same Day", "24-48 Hours", "3-7 Days", "1-2 Weeks", "30 Days", "Depends On Deal"];
const POF = ["Available Now", "Available On Request", "Partner Provides", "Not Available Yet", "Not Applicable"];

function toggle(list: string[], value: string) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} style={{ ...chip, ...(active ? chipActive : {}) }}>
      {label}
    </button>
  );
}

function ChipGroup({ title, options, selected, onChange }: { title: string; options: string[]; selected: string[]; onChange: (next: string[]) => void }) {
  return (
    <section style={block}>
      <div style={sectionTitle}>{title}</div>
      <div style={chipWrap}>
        {options.map((option) => (
          <Chip key={option} label={option} active={selected.includes(option)} onClick={() => onChange(toggle(selected, option))} />
        ))}
      </div>
    </section>
  );
}

function SingleSelect({ title, options, value, onChange }: { title: string; options: string[]; value: string; onChange: (next: string) => void }) {
  return (
    <section style={block}>
      <div style={sectionTitle}>{title}</div>
      <div style={chipWrap}>
        {options.map((option) => (
          <Chip key={option} label={option} active={value === option} onClick={() => onChange(value === option ? "" : option)} />
        ))}
      </div>
    </section>
  );
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function VaultForgeProfileBloomberg() {
  const [profile, setProfile] = useState<ProfileData>(EMPTY_PROFILE);
  const [saved, setSaved] = useState(false);
  const [countyState, setCountyState] = useState("GA");
  const profileInputRef = useRef<HTMLInputElement | null>(null);
  const logoInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setProfile({ ...EMPTY_PROFILE, ...JSON.parse(raw) });
    } catch {
      setProfile(EMPTY_PROFILE);
    }
  }, []);

  const aiScore = useMemo(() => {
    const count =
      profile.memberTypes.length +
      profile.buyStates.length +
      profile.operateStates.length +
      profile.assetTypes.length +
      profile.dealTypes.length +
      profile.painPreferences.length +
      profile.executionCapabilities.length +
      profile.capitalRoles.length +
      profile.routingRules.length;
    return Math.min(100, Math.round((count / 45) * 100));
  }, [profile]);

  function update<K extends keyof ProfileData>(key: K, value: ProfileData[K]) {
    setSaved(false);
    setProfile((current) => ({ ...current, [key]: value }));
  }

  async function uploadImage(kind: "profilePhoto" | "companyLogo", file?: File) {
    if (!file) return;
    const dataUrl = await readFileAsDataUrl(file);
    update(kind, dataUrl);
  }

  function toggleCounty(state: string, county: string) {
    const current = profile.countiesByState[state] || [];
    const next = toggle(current, county);
    update("countiesByState", { ...profile.countiesByState, [state]: next });
  }

  function saveProfile() {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...profile, updatedAt: new Date().toISOString() }));
    setSaved(true);
  }

  function clearProfile() {
    const ok = window.confirm("Clear this local profile draft? This does not touch Supabase.");
    if (!ok) return;
    window.localStorage.removeItem(STORAGE_KEY);
    setProfile(EMPTY_PROFILE);
    setSaved(false);
  }

  const selectedCountyCount = Object.values(profile.countiesByState).reduce((sum, list) => sum + list.length, 0);

  return (
    <div style={pageShell}>
      <section style={heroCard}>
        <div style={eyebrow}>MEMBER INTELLIGENCE PROFILE</div>
        <h1 style={heroTitle}>AI routing profile.</h1>
        <p style={heroText}>
          Build the member buy box, capital stack, execution profile, contact rules, and routing intelligence VaultForge needs to match deals, pain, alerts, messages, and introductions.
        </p>
      </section>

      <section style={panel}>
        <div style={eyebrow}>IDENTITY + CREDIBILITY</div>
        <h2 style={panelTitle}>Member identity.</h2>

        <div style={uploadGrid}>
          <div style={uploadBox} onClick={() => profileInputRef.current?.click()}>
            {profile.profilePhoto ? <img src={profile.profilePhoto} alt="Profile preview" style={uploadImageStyle} /> : <div style={uploadPlaceholder}>Upload Profile Photo</div>}
            <input ref={profileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(event) => uploadImage("profilePhoto", event.target.files?.[0])} />
          </div>
          <div style={uploadBox} onClick={() => logoInputRef.current?.click()}>
            {profile.companyLogo ? <img src={profile.companyLogo} alt="Company logo preview" style={uploadImageStyle} /> : <div style={uploadPlaceholder}>Upload Company Logo</div>}
            <input ref={logoInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(event) => uploadImage("companyLogo", event.target.files?.[0])} />
          </div>
        </div>

        <div style={inputGrid}>
          <input style={input} placeholder="Full Name" value={profile.fullName} onChange={(event) => update("fullName", event.target.value)} />
          <input style={input} placeholder="Company" value={profile.company} onChange={(event) => update("company", event.target.value)} />
          <input style={input} placeholder="Email" value={profile.email} onChange={(event) => update("email", event.target.value)} />
          <input style={input} placeholder="Phone" value={profile.phone} onChange={(event) => update("phone", event.target.value)} />
          <input style={wideInput} placeholder="Website / Social / Credibility Link" value={profile.website} onChange={(event) => update("website", event.target.value)} />
        </div>

        <ChipGroup title="Preferred Contact" options={CONTACT_METHODS} selected={profile.preferredContact} onChange={(next) => update("preferredContact", next)} />
        <ChipGroup title="Member Type" options={MEMBER_TYPES} selected={profile.memberTypes} onChange={(next) => update("memberTypes", next)} />
      </section>

      <section style={panel}>
        <div style={eyebrow}>GEOGRAPHY INTELLIGENCE</div>
        <h2 style={panelTitle}>Markets, states, counties.</h2>
        <ChipGroup title="States You Buy In" options={STATES} selected={profile.buyStates} onChange={(next) => update("buyStates", next)} />
        <ChipGroup title="States You Operate In" options={STATES} selected={profile.operateStates} onChange={(next) => update("operateStates", next)} />
        <ChipGroup title="States To Route Alerts / Deals From" options={STATES} selected={profile.alertStates} onChange={(next) => update("alertStates", next)} />
        <ChipGroup title="States Members Can Contact You From" options={STATES} selected={profile.contactStates} onChange={(next) => update("contactStates", next)} />

        <section style={block}>
          <div style={sectionTitle}>County Popup Selector</div>
          <div style={chipWrap}>{STATES.map((state) => <Chip key={state} label={`${state} ${profile.countiesByState[state]?.length ? `(${profile.countiesByState[state].length})` : ""}`} active={countyState === state} onClick={() => setCountyState(state)} />)}</div>
          <div style={countyPanel}>
            <div style={smallMuted}>Select counties in {countyState}. Selected county total: {selectedCountyCount}</div>
            <div style={chipWrap}>{(COUNTY_MAP[countyState] || []).map((county) => <Chip key={county} label={county} active={(profile.countiesByState[countyState] || []).includes(county)} onClick={() => toggleCounty(countyState, county)} />)}</div>
          </div>
        </section>

        <ChipGroup title="Markets / Submarkets" options={MARKETS} selected={profile.markets} onChange={(next) => update("markets", next)} />
      </section>

      <section style={panel}>
        <div style={eyebrow}>BUY BOX + STRATEGY</div>
        <h2 style={panelTitle}>Deal fit profile.</h2>
        <ChipGroup title="Asset Types" options={ASSETS} selected={profile.assetTypes} onChange={(next) => update("assetTypes", next)} />
        <ChipGroup title="Deal Types" options={DEAL_TYPES} selected={profile.dealTypes} onChange={(next) => update("dealTypes", next)} />
        <ChipGroup title="Pain / Opportunity Alerts Wanted" options={PAIN_PREFS} selected={profile.painPreferences} onChange={(next) => update("painPreferences", next)} />
        <SingleSelect title="Typical Deal Size" options={DEAL_SIZE} value={profile.dealSize} onChange={(next) => update("dealSize", next)} />
      </section>

      <section style={panel}>
        <div style={eyebrow}>CAPITAL + EXECUTION POWER</div>
        <h2 style={panelTitle}>What can this member actually do?</h2>
        <ChipGroup title="Capital Role" options={CAPITAL} selected={profile.capitalRoles} onChange={(next) => update("capitalRoles", next)} />
        <SingleSelect title="Capital Available / Needed" options={CAPITAL_AVAILABLE} value={profile.capitalAvailable} onChange={(next) => update("capitalAvailable", next)} />
        <SingleSelect title="Funding / Decision Speed" options={SPEED} value={profile.fundingSpeed} onChange={(next) => update("fundingSpeed", next)} />
        <SingleSelect title="Proof Of Funds" options={POF} value={profile.proofOfFunds} onChange={(next) => update("proofOfFunds", next)} />
        <ChipGroup title="Close / Partner Style" options={CLOSE_STYLE} selected={profile.closeStyle} onChange={(next) => update("closeStyle", next)} />
        <ChipGroup title="Execution Capabilities" options={EXECUTION} selected={profile.executionCapabilities} onChange={(next) => update("executionCapabilities", next)} />
      </section>

      <section style={panel}>
        <div style={eyebrow}>AI ROUTING CONTROLS</div>
        <h2 style={panelTitle}>Matching rules.</h2>
        <ChipGroup title="Routing Rules" options={ROUTING} selected={profile.routingRules} onChange={(next) => update("routingRules", next)} />
        <ChipGroup title="Visibility Rules" options={VISIBILITY} selected={profile.visibility} onChange={(next) => update("visibility", next)} />

        <div style={scoreCard}>
          <div>
            <div style={sectionTitle}>AI Profile Completion</div>
            <div style={smallMuted}>More chips selected = better routing, alerts, member matching, and intro confidence.</div>
          </div>
          <div style={scoreNumber}>{aiScore}%</div>
        </div>

        <textarea style={textarea} placeholder="Private AI notes: exact buy box, no-go deals, preferred partners, underwriting rules, relationship context, special routing instructions..." value={profile.privateAiNotes} onChange={(event) => update("privateAiNotes", event.target.value)} />
        <textarea style={textarea} placeholder="Short member bio / credibility summary..." value={profile.bio} onChange={(event) => update("bio", event.target.value)} />
      </section>

      <section style={panel}>
        <div style={eyebrow}>PROFILE SAVE</div>
        <h2 style={panelTitle}>Local profile control.</h2>
        <p style={heroText}>This saves the clean profile locally right now. Next build wires this exact structure to Supabase without touching auth, middleware, payment, Stripe, or RLS.</p>
        <div style={actions}>
          <button type="button" style={goldButton} onClick={saveProfile}>Save Profile</button>
          <button type="button" style={darkButton} onClick={clearProfile}>Clear Local Draft</button>
        </div>
        {saved ? <div style={success}>Profile saved locally.</div> : null}
      </section>
    </div>
  );
}

const pageShell: React.CSSProperties = { display: "grid", gap: 22 };
const heroCard: React.CSSProperties = { border: "1px solid rgba(244,197,66,.28)", borderRadius: 26, padding: 32, background: "linear-gradient(135deg, rgba(8,13,28,.98), rgba(3,7,18,.98))" };
const panel: React.CSSProperties = { border: "1px solid rgba(244,197,66,.24)", borderRadius: 26, padding: 32, background: "rgba(3,7,18,.96)", boxShadow: "0 24px 80px rgba(0,0,0,.28)" };
const eyebrow: React.CSSProperties = { color: "#f4c542", letterSpacing: 6, fontWeight: 900, fontSize: 13, marginBottom: 16 };
const heroTitle: React.CSSProperties = { color: "#fff", fontSize: "clamp(42px, 9vw, 76px)", lineHeight: .9, margin: 0, letterSpacing: -4, fontWeight: 950 };
const panelTitle: React.CSSProperties = { color: "#fff", fontSize: "clamp(32px, 6vw, 50px)", lineHeight: .95, margin: "0 0 22px", letterSpacing: -3, fontWeight: 950 };
const heroText: React.CSSProperties = { color: "rgba(255,255,255,.72)", fontSize: 18, lineHeight: 1.45, margin: "18px 0 0" };
const block: React.CSSProperties = { marginTop: 22 };
const sectionTitle: React.CSSProperties = { color: "#f4c542", fontWeight: 950, letterSpacing: 4, fontSize: 16, marginBottom: 12 };
const chipWrap: React.CSSProperties = { display: "flex", flexWrap: "wrap", gap: 10 };
const chip: React.CSSProperties = { border: "1px solid rgba(255,255,255,.16)", background: "rgba(255,255,255,.07)", color: "#fff", borderRadius: 999, padding: "12px 16px", fontWeight: 900, fontSize: 14, cursor: "pointer" };
const chipActive: React.CSSProperties = { background: "linear-gradient(135deg, #ffe78a, #f4c542)", color: "#080d1c", borderColor: "rgba(244,197,66,.9)", boxShadow: "0 12px 34px rgba(244,197,66,.18)" };
const inputGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14, marginTop: 20 };
const input: React.CSSProperties = { border: "1px solid rgba(255,255,255,.14)", background: "rgba(255,255,255,.06)", color: "#fff", borderRadius: 18, padding: "17px 18px", fontSize: 15, outline: "none" };
const wideInput: React.CSSProperties = { ...input, gridColumn: "1 / -1" };
const textarea: React.CSSProperties = { ...input, width: "100%", minHeight: 120, marginTop: 18, resize: "vertical", boxSizing: "border-box" };
const uploadGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 };
const uploadBox: React.CSSProperties = { minHeight: 190, border: "1px dashed rgba(244,197,66,.42)", borderRadius: 22, background: "rgba(255,255,255,.04)", display: "grid", placeItems: "center", overflow: "hidden", cursor: "pointer" };
const uploadPlaceholder: React.CSSProperties = { color: "rgba(255,255,255,.78)", fontWeight: 950, letterSpacing: 2, textAlign: "center", padding: 20 };
const uploadImageStyle: React.CSSProperties = { width: "100%", height: "100%", objectFit: "cover" };
const countyPanel: React.CSSProperties = { marginTop: 14, padding: 16, borderRadius: 20, border: "1px solid rgba(255,255,255,.1)", background: "rgba(255,255,255,.035)" };
const smallMuted: React.CSSProperties = { color: "rgba(255,255,255,.62)", fontSize: 14, lineHeight: 1.35, marginBottom: 12 };
const scoreCard: React.CSSProperties = { marginTop: 24, padding: 20, borderRadius: 22, border: "1px solid rgba(244,197,66,.28)", background: "rgba(244,197,66,.06)", display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center" };
const scoreNumber: React.CSSProperties = { color: "#f4c542", fontSize: 48, fontWeight: 950, letterSpacing: -2 };
const actions: React.CSSProperties = { display: "flex", flexWrap: "wrap", gap: 12, marginTop: 22 };
const goldButton: React.CSSProperties = { border: 0, background: "linear-gradient(135deg, #ffe78a, #f4c542)", color: "#070b16", borderRadius: 999, padding: "15px 22px", fontWeight: 950, cursor: "pointer" };
const darkButton: React.CSSProperties = { border: "1px solid rgba(255,255,255,.16)", background: "rgba(255,255,255,.07)", color: "#fff", borderRadius: 999, padding: "15px 22px", fontWeight: 950, cursor: "pointer" };
const success: React.CSSProperties = { marginTop: 16, color: "#91f0b2", fontWeight: 900 };
