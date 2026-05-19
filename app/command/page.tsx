"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type MemberProfile = {
  id?: string;
  name?: string;
  company?: string;
  email?: string;
  phone?: string;
  profilePhoto?: string;
  memberType?: string;
  basedState?: string;
  basedCity?: string;
  basedCounty?: string;
  statesOperated?: string[];
  markets?: string[];
  assetClasses?: string[];
  strategies?: string[];
  specialties?: string[];
  needs?: string[];
  canProvide?: string[];
  capitalPosition?: string;
  proofOfFunds?: string;
  fundingRange?: string;
  contactPreference?: string;
  directContact?: string;
  bio?: string;
  updatedAt?: string;
  [key: string]: unknown;
};

const PROFILE_KEYS = ["vaultforge_profile", "vaultforge_member_profile", "vaultforge_clean_profile"];
const MEMBER_DIRECTORY_KEY = "vaultforge_member_directory_v1";

const STATES = ["GA", "TN", "AL", "FL", "NC", "SC", "TX"];
const MARKETS = ["Atlanta", "North Georgia", "Chattanooga", "Nashville", "Knoxville", "Birmingham", "Huntsville", "Montgomery", "Jacksonville", "Tampa", "Orlando", "Miami", "Charlotte", "Raleigh-Durham", "Greenville-Spartanburg", "Charleston", "Dallas-Fort Worth", "Houston", "Austin", "San Antonio"];
const ASSETS = ["Residential", "Commercial", "Land"];
const STRATEGIES = ["Wholesale", "Flip", "Buy & Hold", "BRRRR", "Development", "Seller Finance", "JV", "Rental", "Hotel Conversion", "Airbnb"];
const SPECIALTIES = ["Distress", "Funding Gap", "Off Market", "Construction", "Land", "Commercial", "Residential", "Creative Finance", "Insurance", "Permits", "Probate", "Foreclosure", "Tax Sale", "Stalled Project", "Value Add"];
const NEEDS = ["Lender", "Operator", "Contractor", "Buyer", "Attorney", "Insurance Adjuster", "City Expeditor", "Private Capital", "Property Manager", "Developer"];
const CAN_PROVIDE = ["Capital", "Buying", "Lending", "Contractors", "Legal", "Insurance", "Property Management", "Development", "Operations", "Introductions"];
const MEMBER_TYPES = ["Investor", "Wholesaler", "Lender", "Contractor", "Developer", "Agent", "Attorney", "Operator", "Private Capital", "Property Manager"];
const CONTACT_PREFS = ["VaultForge Message", "Text", "Phone", "Email", "Contact Form"];
const CAPITAL_POSITIONS = ["Unknown", "Cash Buyer", "Private Capital", "Hard Money", "Bank Lending", "JV Capital", "Needs Capital", "Operator With Capital", "Operator Needs Capital"];
const FUNDING_RANGES = ["Unknown", "Under $50k", "$50k-$250k", "$250k-$1M", "$1M-$5M", "$5M+"];
const YESNO = ["Unknown", "Yes", "No"];

const CITY_COUNTY: Record<string, string> = {
  atlanta: "Fulton",
  alpharetta: "Fulton",
  roswell: "Fulton",
  marietta: "Cobb",
  smyrna: "Cobb",
  kennesaw: "Cobb",
  cartersville: "Bartow",
  cville: "Bartow",
  cvile: "Bartow",
  adairsville: "Bartow",
  rome: "Floyd",
  gainesville: "Hall",
  savannah: "Chatham",
  augusta: "Richmond",
  columbus: "Muscogee",
  macon: "Bibb",
  chattanooga: "Hamilton",
  nashville: "Davidson",
  knoxville: "Knox",
  birmingham: "Jefferson",
  huntsville: "Madison",
  charlotte: "Mecklenburg",
  raleigh: "Wake",
  greenville: "Greenville",
  charleston: "Charleston",
  dallas: "Dallas",
  houston: "Harris",
  austin: "Travis",
  "san antonio": "Bexar",
  sanantonio: "Bexar",
};

function ok() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function j<T>(raw: string | null, fallback: T): T {
  try {
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function txt(value: unknown, fallback = "") {
  const clean = String(value || "").trim();
  return clean || fallback;
}

function list(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((x) => String(x).trim()).filter(Boolean);
  if (typeof value === "string" && value.trim()) return value.split(",").map((x) => x.trim()).filter(Boolean);
  return [];
}

function safeSet(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function profileId(profile: MemberProfile) {
  return txt(profile.id) || txt(profile.email).toLowerCase() || "local_member";
}

function normalizeProfile(profile: MemberProfile): MemberProfile {
  const now = new Date().toISOString();
  const id = profileId(profile);
  return {
    ...profile,
    id,
    basedState: txt(profile.basedState, "GA"),
    statesOperated: list(profile.statesOperated).length ? list(profile.statesOperated) : ["GA"],
    assetClasses: list(profile.assetClasses),
    strategies: list(profile.strategies),
    specialties: list(profile.specialties),
    needs: list(profile.needs),
    canProvide: list(profile.canProvide),
    updatedAt: now,
  };
}

function getProfile(): MemberProfile {
  if (!ok()) return {};
  for (const key of PROFILE_KEYS) {
    const found = j<MemberProfile | null>(localStorage.getItem(key), null);
    if (found && typeof found === "object") return normalizeProfile(found);
  }
  return normalizeProfile({
    id: "local_member",
    basedState: "GA",
    statesOperated: ["GA"],
    memberType: "Investor",
    contactPreference: "VaultForge Message",
    directContact: "Unknown",
    capitalPosition: "Unknown",
    proofOfFunds: "Unknown",
    fundingRange: "Unknown",
  });
}

function getDirectory(): MemberProfile[] {
  if (!ok()) return [];
  const directory = j<MemberProfile[]>(localStorage.getItem(MEMBER_DIRECTORY_KEY), []);
  const current = getProfile();
  const currentId = profileId(current);
  const merged = [current, ...directory.filter((member) => profileId(member) !== currentId)];
  const seen = new Set<string>();
  return merged.filter((member) => {
    const id = profileId(member);
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  }).map(normalizeProfile);
}

function saveProfile(profile: MemberProfile) {
  if (!ok()) return;
  const next = normalizeProfile(profile);
  PROFILE_KEYS.forEach((key) => safeSet(key, next));

  const directory = j<MemberProfile[]>(localStorage.getItem(MEMBER_DIRECTORY_KEY), []);
  const nextId = profileId(next);
  const merged = [next, ...directory.filter((member) => profileId(member) !== nextId)];
  safeSet(MEMBER_DIRECTORY_KEY, merged);

  window.dispatchEvent(new Event("vaultforge-profile-change"));
  window.dispatchEvent(new Event("vaultforge-network-change"));
}

function membersForState(state: string) {
  return getDirectory().filter((member) => list(member.statesOperated).includes(state));
}

function countyFromCity(city: string) {
  return CITY_COUNTY[city.trim().toLowerCase().replace(/\s+/g, " ")] || "";
}

async function compressImage(file: File, maxWidth = 850, quality = 0.52): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onerror = () => resolve("");
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => resolve("");
      img.onload = () => {
        try {
          const scale = Math.min(1, maxWidth / img.width);
          const canvas = document.createElement("canvas");
          canvas.width = Math.max(1, Math.round(img.width * scale));
          canvas.height = Math.max(1, Math.round(img.height * scale));
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve("");
            return;
          }
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", quality));
        } catch {
          resolve("");
        }
      };
      img.src = String(reader.result || "");
    };
    reader.readAsDataURL(file);
  });
}

async function onePhoto(files: FileList | null) {
  const file = Array.from(files || [])[0];
  return file ? compressImage(file) : "";
}

const page: React.CSSProperties = { minHeight: "100vh", background: "#05070d", color: "#f7f7fb", padding: 18, fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" };
const wrap: React.CSSProperties = { maxWidth: 1280, margin: "0 auto", paddingBottom: 90 };
const nav: React.CSSProperties = { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 18 };
const brand: React.CSSProperties = { color: "#ffd45a", fontSize: 27, fontWeight: 950, letterSpacing: -1, marginRight: 10 };
const btn: React.CSSProperties = { border: "1px solid rgba(207,216,230,.18)", background: "#171c29", color: "#f7f7fb", borderRadius: 999, padding: "13px 18px", fontWeight: 950, textDecoration: "none", display: "inline-block", cursor: "pointer" };
const goldBtn: React.CSSProperties = { ...btn, border: 0, background: "#ffdc68", color: "#10131a" };
const redBtn: React.CSSProperties = { ...btn, background: "#271016", borderColor: "rgba(255,70,70,.48)", color: "#ffaaaa" };
const hero: React.CSSProperties = { border: "1px solid rgba(245,197,66,.28)", borderRadius: 28, padding: 30, marginBottom: 20, background: "radial-gradient(circle at top right, rgba(245,197,66,.16), transparent 32%), linear-gradient(180deg,#080d19,#050816)" };
const card: React.CSSProperties = { background: "linear-gradient(180deg,#080d19,#050816)", border: "1px solid rgba(245,197,66,.28)", borderRadius: 26, padding: 26, marginBottom: 22 };
const panel: React.CSSProperties = { background: "#121724", border: "1px solid rgba(207,216,230,.16)", borderRadius: 22, padding: 22 };
const pulsePanel: React.CSSProperties = { ...panel, borderColor: "rgba(255,70,70,.65)", boxShadow: "0 0 26px rgba(255,50,70,.22)" };
const eyebrow: React.CSSProperties = { color: "#ffd45a", textTransform: "uppercase", letterSpacing: 7, fontWeight: 950, fontSize: 15, marginBottom: 12 };
const labelStyle: React.CSSProperties = { color: "#ffd45a", textTransform: "uppercase", letterSpacing: 4, fontSize: 12, fontWeight: 950, marginBottom: 8 };
const h1: React.CSSProperties = { fontSize: "clamp(44px,8vw,86px)", lineHeight: 0.9, letterSpacing: -4, margin: "0 0 18px", fontWeight: 950 };
const h2: React.CSSProperties = { fontSize: "clamp(30px,5vw,52px)", lineHeight: 0.95, letterSpacing: -2, margin: "0 0 14px", fontWeight: 950 };
const sub: React.CSSProperties = { color: "#c9d0dc", fontSize: 21, lineHeight: 1.35, margin: 0 };
const muted: React.CSSProperties = { color: "#aeb7c7", margin: "8px 0 0", lineHeight: 1.35 };
const grid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(245px,1fr))", gap: 16 };
const row: React.CSSProperties = { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" };
const input: React.CSSProperties = { width: "100%", boxSizing: "border-box", border: "1px solid rgba(207,216,230,.18)", background: "#151b2a", color: "#f8fafc", borderRadius: 18, padding: "15px 16px", fontSize: 16 };
const textarea: React.CSSProperties = { ...input, minHeight: 110, resize: "vertical" };
const photoStyle: React.CSSProperties = { width: "100%", height: 160, objectFit: "cover", borderRadius: 18, border: "1px solid rgba(245,197,66,.25)", marginBottom: 12 };

function Nav({ active }: { active: string }) {
  const item = (href: string, label: string, key: string) => <Link href={href} style={active === key ? goldBtn : btn}>{label}</Link>;
  return <nav style={nav}><div style={brand}>VAULTFORGE</div>{item("/command","Command","command")}{item("/deal-rooms","Deal Rooms","deals")}{item("/deal-create","Create Deal","deal-create")}{item("/pain-intake","Pain Intake","pain-intake")}{item("/pain-rooms","Pain Rooms","pain")}{item("/network","Network","network")}{item("/messages","Messages","messages")}{item("/profile","Profile","profile")}<Link href="/logout" style={redBtn}>Logout</Link></nav>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section style={card}><div style={eyebrow}>{title}</div>{children}</section>;
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label><div style={labelStyle}>{label}</div><input type="text" style={input} value={value} onChange={(event) => onChange(event.target.value)} /></label>;
}

function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label><div style={labelStyle}>{label}</div><textarea style={textarea} value={value} onChange={(event) => onChange(event.target.value)} /></label>;
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) {
  return <label><div style={labelStyle}>{label}</div><select style={input} value={value} onChange={(event) => onChange(event.target.value)}>{options.map((option) => <option key={option}>{option}</option>)}</select></label>;
}

function ChipSet({ label, options, selected, onToggle }: { label: string; options: string[]; selected: string[]; onToggle: (value: string) => void }) {
  return <div><div style={labelStyle}>{label}</div><div style={row}>{options.map((option) => <button key={option} type="button" style={selected.includes(option) ? goldBtn : btn} onClick={() => onToggle(option)}>{option}</button>)}</div></div>;
}

function MemberCard({ member }: { member: MemberProfile }) {
  return <div style={panel}>
    {txt(member.profilePhoto) ? <img src={txt(member.profilePhoto)} alt={txt(member.name, "Member")} style={photoStyle} /> : null}
    <div style={eyebrow}>{txt(member.memberType, "Member")} • Based {txt(member.basedState, "N/A")}</div>
    <h2 style={h2}>{txt(member.name, "VaultForge Member")}</h2>
    <p style={sub}>{txt(member.company, "Company not listed")}</p>
    <p style={muted}>From: {[txt(member.basedCity), txt(member.basedCounty), txt(member.basedState)].filter(Boolean).join(", ") || "Not listed"}</p>
    <p style={muted}>Operates: {list(member.statesOperated).join(", ") || "No states selected"}</p>
    <p style={muted}>Can provide: {list(member.canProvide).join(", ") || "Not listed"}</p>
    <p style={muted}>Needs: {list(member.needs).join(", ") || "Not listed"}</p>
    <div style={{ ...row, marginTop: 18 }}><Link href="/messages" style={goldBtn}>Message</Link><Link href="/profile" style={btn}>Profile</Link></div>
  </div>;
}

export default function CommandPage() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const refresh = () => setTick((x) => x + 1);
    ["storage", "vaultforge-profile-change", "vaultforge-network-change"].forEach((event) => window.addEventListener(event, refresh));
    return () => ["storage", "vaultforge-profile-change", "vaultforge-network-change"].forEach((event) => window.removeEventListener(event, refresh));
  }, []);

  const profile = useMemo(() => getProfile(), [tick]);
  const directory = useMemo(() => getDirectory(), [tick]);
  const stateCounts = STATES.map((state) => ({ state, count: directory.filter((member) => list(member.statesOperated).includes(state)).length }));

  return <main style={page}><div style={wrap}><Nav active="command" />

    <section style={hero}>
      <div style={eyebrow}>Member Command Center</div>
      <h1 style={h1}>Profile controls the network.</h1>
      <p style={sub}>{txt(profile.name, "Member")} • Based {txt(profile.basedCity, "City not set")}, {txt(profile.basedState, "GA")} • Operates {list(profile.statesOperated).join(", ") || "No states selected"}</p>
      <div style={{ ...row, marginTop: 22 }}>
        <Link href="/profile" style={goldBtn}>Edit Profile</Link>
        <Link href="/network" style={goldBtn}>Open Network</Link>
        <Link href="/deal-create" style={btn}>Create Deal</Link>
        <Link href="/pain-intake" style={btn}>Submit Pain</Link>
      </div>
    </section>

    <Section title="Network State Cards">
      <div style={grid}>
        {stateCounts.map(({ state, count }) => (
          <Link href="/network" key={state} style={count ? pulsePanel : panel}>
            <div style={eyebrow}>{state}</div>
            <h2 style={h2}>{count}</h2>
            <p style={muted}>member(s) serving</p>
          </Link>
        ))}
      </div>
    </Section>

    <Section title="Profile Routing Tags">
      <div style={grid}>
        <div style={panel}><div style={eyebrow}>Can Provide</div><p style={sub}>{list(profile.canProvide).join(", ") || "Not set"}</p></div>
        <div style={panel}><div style={eyebrow}>Needs</div><p style={sub}>{list(profile.needs).join(", ") || "Not set"}</p></div>
        <div style={panel}><div style={eyebrow}>Strategies</div><p style={sub}>{list(profile.strategies).join(", ") || "Not set"}</p></div>
        <div style={panel}><div style={eyebrow}>Capital</div><p style={sub}>{txt(profile.capitalPosition, "Unknown")} • {txt(profile.fundingRange, "Unknown")}</p></div>
      </div>
    </Section>

  </div></main>;
}
