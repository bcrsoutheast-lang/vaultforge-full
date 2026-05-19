"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type RoomState = "active" | "saved" | "archived" | "deleted";
type RoomKind = "deal" | "pain";

type Room = {
  id?: string;
  roomId?: string;
  title?: string;
  name?: string;
  state?: string;
  city?: string;
  county?: string;
  address?: string;
  assetClass?: string;
  propertyType?: string;
  askingPrice?: string;
  propertyValue?: string;
  repairs?: string;
  timeline?: string;
  timePressure?: string;
  severity?: string;
  capitalPressure?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  notes?: string;
  routeTo?: string[] | string;
  routingNeeds?: string[] | string;
  painTypes?: string[] | string;
  strategy?: string[] | string;
  motivation?: string[] | string;
  condition?: string;
  occupancy?: string;
  dealStrength?: string;
  beds?: string;
  baths?: string;
  sqft?: string;
  units?: string;
  acres?: string;
  zoning?: string;
  rootCause?: string;
  bestOutcome?: string;
  worstCase?: string;
  desiredSolution?: string;
  blockers?: string[] | string;
  riskTypes?: string[] | string;
  roomState?: RoomState;
  cleanupState?: RoomState;
  stateStatus?: RoomState;
  alertRead?: boolean;
  viewedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  coverPhoto?: string;
  photoUrl?: string;
  imageUrl?: string;
  photos?: string[];
  photoUrls?: string[];
  analyzer?: string;
  [key: string]: unknown;
};

type Profile = {
  name?: string;
  company?: string;
  email?: string;
  phone?: string;
  memberType?: string;
  profilePhoto?: string;
  primaryCity?: string;
  primaryCounty?: string;
  statesOperated?: string[];
  markets?: string[];
  strategies?: string[];
  assetClasses?: string[];
  specialties?: string[];
  needs?: string[];
  canProvide?: string[];
  capitalPosition?: string;
  proofOfFunds?: string;
  fundingRange?: string;
  contactPreference?: string;
  directContact?: string;
  bio?: string;
  [key: string]: unknown;
};

const STATES = ["GA", "TN", "AL", "FL", "NC", "SC", "TX"];
const MARKETS = ["Atlanta", "North Georgia", "Chattanooga", "Nashville", "Knoxville", "Birmingham", "Huntsville", "Montgomery", "Jacksonville", "Tampa", "Orlando", "Miami", "Charlotte", "Raleigh-Durham", "Greenville-Spartanburg", "Charleston", "Dallas-Fort Worth", "Houston", "Austin", "San Antonio"];
const ASSETS = ["Residential", "Commercial", "Land"];
const RES_TYPES = ["Single Family", "Duplex", "Triplex", "Quad", "Townhome", "Condo", "Mobile Home", "Small Multifamily"];
const COM_TYPES = ["Retail", "Office", "Industrial", "Warehouse", "Hotel", "Self Storage", "Mixed Use", "Medical", "Restaurant", "Automotive", "Church / Special Use"];
const LAND_TYPES = ["Infill Lot", "Acreage", "Entitled Land", "Raw Land", "Commercial Pad", "Subdivision", "Timber", "Farm", "Assemblage", "Waterfront"];
const STRATEGIES = ["Wholesale", "Flip", "Buy & Hold", "BRRRR", "Development", "Seller Finance", "JV", "Rental", "Hotel Conversion", "Airbnb"];
const SPECIALTIES = ["Distress", "Funding Gap", "Off Market", "Construction", "Land", "Commercial", "Residential", "Creative Finance", "Insurance", "Permits", "Probate", "Foreclosure", "Tax Sale", "Stalled Project", "Value Add"];
const ROUTES = ["Buyer", "Lender", "Operator", "Contractor", "Developer", "Attorney", "Capital Partner"];
const NEEDS = ["Lender", "Operator", "Contractor", "Buyer", "Attorney", "Insurance Adjuster", "City Expeditor", "Private Capital", "Property Manager", "Developer"];
const CAN_PROVIDE = ["Capital", "Buying", "Lending", "Contractors", "Legal", "Insurance", "Property Management", "Development", "Operations", "Introductions"];
const PAIN_TYPES = ["Funding Gap", "Foreclosure", "Stalled Construction", "Contractor Problem", "Title Problem", "Permit Problem", "City Violation", "Tenant Issue", "Partnership Dispute", "Emergency Exit", "Insurance Claim", "Fire Damage", "Mold", "Structural", "Probate", "Tax Sale Risk", "Squatter Issue", "Burn Rate"];
const MEMBER_TYPES = ["Investor", "Wholesaler", "Lender", "Contractor", "Developer", "Agent", "Attorney", "Operator", "Private Capital", "Property Manager"];
const CONTACT_PREFS = ["VaultForge Message", "Text", "Phone", "Email", "Contact Form"];
const CAPITAL_POSITIONS = ["Unknown", "Cash Buyer", "Private Capital", "Hard Money", "Bank Lending", "JV Capital", "Needs Capital", "Operator With Capital", "Operator Needs Capital"];
const FUNDING_RANGES = ["Unknown", "Under $50k", "$50k-$250k", "$250k-$1M", "$1M-$5M", "$5M+"];
const CONDITION = ["Unknown", "Turnkey", "Light Rehab", "Medium Rehab", "Full Gut", "Fire Damage", "Shell", "Tear Down"];
const OCCUPANCY = ["Unknown", "Vacant", "Owner Occupied", "Tenant Occupied", "Squatter", "Partial Vacancy"];
const SEVERITY = ["Low", "Medium", "High", "Critical", "Emergency"];
const TIME = ["24 Hours", "72 Hours", "7 Days", "14 Days", "30 Days", "Flexible"];
const CAPITAL = ["Unknown", "Under $25k", "$25k-$100k", "$100k-$250k", "$250k-$1M", "$1M+"];
const BLOCKERS = ["Capital", "Timeline", "Title", "Access", "Contractor", "Tenant", "Permit", "City", "Legal", "Partner", "Seller Pressure", "Unknown Numbers", "Insurance", "Utilities"];
const RISK = ["Legal", "Financial", "Structural", "Operational", "City/Permit", "Occupancy", "Environmental"];
const YESNO = ["Unknown", "Yes", "No"];

const CITY_COUNTY: Record<string, string> = {
  atlanta: "Fulton",
  alpharetta: "Fulton",
  roswell: "Fulton",
  marietta: "Cobb",
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

const DEAL_KEYS = ["vaultforge_clean_deal_rooms", "vaultforge_deal_rooms", "vaultforge_rooms_deals", "vf_deal_rooms"];
const PAIN_KEYS = ["vaultforge_clean_pain_rooms_v1", "vaultforge_clean_pain_rooms", "vaultforge_pain_rooms", "vaultforge_rooms_pain", "vf_pain_rooms"];
const STATE_KEYS = ["vaultforge_clean_room_states", "vaultforge_room_states", "vaultforge_deal_room_states", "vaultforge_pain_room_states", "vaultforge_5s_room_states"];
const PROFILE_KEYS = ["vaultforge_profile", "vaultforge_member_profile", "vaultforge_clean_profile"];
const READ_KEY = "vaultforge_room_alert_read_v1";

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

function rid(room: Room | null | undefined) {
  return txt(room?.id || room?.roomId);
}

function titleFor(room: Room, kind: RoomKind) {
  return txt(room.title || room.name, kind === "deal" ? "Untitled Deal Room" : "Untitled Pain Room");
}

function loc(room: Room) {
  return [txt(room.city), txt(room.county), txt(room.state)].filter(Boolean).join(", ") || "Market not listed";
}

function roomState(room: Room): RoomState {
  return txt(room.roomState || room.cleanupState || room.stateStatus, "active") as RoomState;
}

function arr<T>(key: string): T[] {
  if (!ok()) return [];
  const parsed = j<unknown>(localStorage.getItem(key), []);
  return Array.isArray(parsed) ? (parsed as T[]) : [];
}

function keysFor(kind: RoomKind) {
  return kind === "deal" ? DEAL_KEYS : PAIN_KEYS;
}

function singleKeys(kind: RoomKind, id: string) {
  return [`vaultforge_clean_${kind}_room_${id}`, `vaultforge_${kind}_room_${id}`, `vf_${kind}_room_${id}`];
}

function saveSafe(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function stateMap() {
  const map: Record<string, RoomState> = {};
  if (!ok()) return map;
  STATE_KEYS.forEach((key) => Object.assign(map, j<Record<string, RoomState>>(localStorage.getItem(key), {})));
  return map;
}

function allRooms(kind: RoomKind): Room[] {
  if (!ok()) return [];
  const out: Room[] = [];
  const seen = new Set<string>();

  for (const key of keysFor(kind)) {
    for (const row of arr<Room>(key)) {
      const id = rid(row);
      if (!id || seen.has(id)) continue;
      seen.add(id);
      out.push({ ...row, id, roomId: id });
    }
  }

  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i) || "";
    const match = kind === "deal" ? key.includes("deal_room") || key.includes("deal_rooms") : key.includes("pain_room") || key.includes("pain_rooms");
    if (!match) continue;

    const value = j<any>(localStorage.getItem(key), null);
    if (Array.isArray(value)) {
      for (const row of value) {
        const id = rid(row);
        if (!id || seen.has(id)) continue;
        seen.add(id);
        out.push({ ...row, id, roomId: id });
      }
    } else if (value && typeof value === "object") {
      const id = rid(value);
      if (id && !seen.has(id)) {
        seen.add(id);
        out.push({ ...value, id, roomId: id });
      }
    }
  }

  const states = stateMap();
  return out.map((room) => {
    const id = rid(room);
    const state = states[id] || states[`${kind}:${id}`] || roomState(room);
    return { ...room, roomState: state, cleanupState: state, stateStatus: state };
  });
}

function readMap() {
  return ok() ? j<Record<string, string>>(localStorage.getItem(READ_KEY), {}) : {};
}

function unreadRooms(kind: RoomKind, rooms: Room[]) {
  const reads = readMap();
  return rooms.filter((room) => {
    const id = rid(room);
    if (roomState(room) !== "active") return false;
    return !room.alertRead && !room.viewedAt && !reads[id] && !reads[`${kind}:${id}`];
  });
}

function firstPhoto(room: Room) {
  const possible = [
    txt(room.coverPhoto),
    txt(room.photoUrl),
    txt(room.imageUrl),
    ...list(room.photoUrls),
    ...list(room.photos),
  ].filter(Boolean);
  return possible.find((src) => src.startsWith("data:image") || src.startsWith("http") || src.startsWith("/") || src.startsWith("blob:")) || "";
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

async function photosFromFiles(files: FileList | null) {
  const selected = Array.from(files || []).slice(0, 10);
  const output: string[] = [];
  for (const file of selected) {
    const compressed = await compressImage(file);
    if (compressed && compressed.length < 450000) output.push(compressed);
  }
  return output;
}

async function onePhoto(files: FileList | null) {
  const file = Array.from(files || [])[0];
  return file ? compressImage(file) : "";
}

function saveRoom(kind: RoomKind, room: Room) {
  if (!ok()) return "";
  const id = `${kind}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date().toISOString();
  const next: Room = {
    ...room,
    id,
    roomId: id,
    roomState: "active",
    cleanupState: "active",
    stateStatus: "active",
    createdAt: now,
    updatedAt: now,
    alertRead: false,
    viewedAt: "",
  };

  for (const key of singleKeys(kind, id)) {
    const worked = saveSafe(key, next);
    if (!worked) saveSafe(key, { ...next, photos: [], photoUrls: [], coverPhoto: "", photoUrl: "", imageUrl: "" });
  }

  const cover = txt(next.coverPhoto || next.photoUrl || next.imageUrl);
  const slim: Room = { ...next, photos: cover ? [cover] : [], photoUrls: cover ? [cover] : [], coverPhoto: cover, photoUrl: cover, imageUrl: cover };

  for (const key of keysFor(kind)) {
    const existing = arr<Room>(key).filter((row) => rid(row) !== id);
    const worked = saveSafe(key, [slim, ...existing]);
    if (!worked) saveSafe(key, [{ ...slim, photos: [], photoUrls: [], coverPhoto: "", photoUrl: "", imageUrl: "" }, ...existing]);
  }

  const map = stateMap();
  map[id] = "active";
  map[`${kind}:${id}`] = "active";
  STATE_KEYS.forEach((key) => saveSafe(key, map));

  window.dispatchEvent(new Event(kind === "deal" ? "vaultforge-deal-change" : "vaultforge-pain-change"));
  window.dispatchEvent(new Event("vaultforge-room-state-change"));

  return id;
}

function saveProfile(profile: Profile) {
  if (!ok()) return;
  PROFILE_KEYS.forEach((key) => localStorage.setItem(key, JSON.stringify(profile)));
  window.dispatchEvent(new Event("vaultforge-profile-change"));
}

const page: React.CSSProperties = { minHeight: "100vh", background: "#05070d", color: "#f7f7fb", padding: 18, fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" };
const wrap: React.CSSProperties = { maxWidth: 1280, margin: "0 auto", paddingBottom: 90 };
const nav: React.CSSProperties = { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 18 };
const brand: React.CSSProperties = { color: "#ffd45a", fontSize: 27, fontWeight: 950, letterSpacing: -1, marginRight: 10 };
const btn: React.CSSProperties = { border: "1px solid rgba(207,216,230,.18)", background: "#171c29", color: "#f7f7fb", borderRadius: 999, padding: "13px 18px", fontWeight: 950, textDecoration: "none", display: "inline-block", cursor: "pointer" };
const goldBtn: React.CSSProperties = { ...btn, border: 0, background: "#ffdc68", color: "#10131a" };
const redBtn: React.CSSProperties = { ...btn, background: "#271016", borderColor: "rgba(255,70,70,.48)", color: "#ffaaaa" };
const hero: React.CSSProperties = { border: "1px solid rgba(245,197,66,.28)", borderRadius: 28, padding: 30, marginBottom: 20, background: "radial-gradient(circle at top right, rgba(245,197,66,.16), transparent 32%), linear-gradient(180deg,#080d19,#050816)" };
const redHero: React.CSSProperties = { ...hero, borderColor: "rgba(255,70,70,.42)", background: "radial-gradient(circle at top right, rgba(255,50,80,.22), transparent 35%), linear-gradient(180deg,#120611,#050816)" };
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
  return <nav style={nav}><div style={brand}>VAULTFORGE</div>{item("/command","Command","command")}{item("/deal-rooms","Deal Rooms","deals")}{item("/deal-create","Create Deal","deal-create")}{item("/pain-intake","Pain Intake","pain-intake")}{item("/pain-rooms","Pain Rooms","pain")}{item("/network","Network","network")}{item("/messages","Messages","messages")}{item("/profile","Profile","profile")}{item("/saved-rooms","Saved","saved")}{item("/archived-rooms","Archived","archived")}{item("/deleted-rooms","Deleted","deleted")}<Link href="/logout" style={redBtn}>Logout</Link></nav>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section style={card}><div style={eyebrow}>{title}</div>{children}</section>;
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label><div style={labelStyle}>{label}</div><input style={input} value={value} onChange={(event) => onChange(event.target.value)} /></label>;
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

function formCounty(city: string, current: string) {
  return countyFromCity(city) || current;
}

export default function PainIntakePage() {
  const [form, setForm] = useState<Room>({ assetClass: "Residential", state: "GA", propertyType: "Single Family", routingNeeds: ["Lender"], painTypes: ["Funding Gap"], severity: "High", timePressure: "7 Days", capitalPressure: "Unknown" });
  const [files, setFiles] = useState<FileList | null>(null);
  const [saving, setSaving] = useState(false);

  const assetClass = txt(form.assetClass, "Residential");
  const propertyTypes = assetClass === "Commercial" ? COM_TYPES : assetClass === "Land" ? LAND_TYPES : RES_TYPES;

  function up(key: string, value: unknown) { setForm({ ...form, [key]: value }); }
  function updateCity(value: string) { setForm({ ...form, city: value, county: formCounty(value, txt(form.county)) }); }
  function toggle(key: "routingNeeds" | "painTypes" | "blockers" | "riskTypes", value: string) { const set = new Set(list(form[key])); set.has(value) ? set.delete(value) : set.add(value); up(key, Array.from(set)); }
  function setAsset(value: string) { const defaultType = value === "Commercial" ? COM_TYPES[0] : value === "Land" ? LAND_TYPES[0] : RES_TYPES[0]; setForm({ ...form, assetClass: value, propertyType: defaultType }); }

  async function submit() {
    setSaving(true);
    const images = await photosFromFiles(files);
    const cover = images[0] || "";
    const id = saveRoom("pain", { ...form, title: txt(form.title, "Untitled Pain Room"), coverPhoto: cover, photoUrl: cover, imageUrl: cover, photos: images, photoUrls: images, analyzer: `Pain analyzer: ${list(form.painTypes).join(", ") || "Problem"} in ${txt(form.city)}, ${txt(form.county)}, ${txt(form.state)}. Severity ${txt(form.severity)}. Needs ${list(form.routingNeeds).join(", ") || "solver"}.` });
    if (id) window.location.href = `/pain-rooms/${encodeURIComponent(id)}`; else setSaving(false);
  }

  return <main style={page}><div style={wrap}><Nav active="pain-intake" />
    <section style={hero}><div style={eyebrow}>Adaptive Pain Intake</div><h1 style={h1}>Problem Room.</h1><p style={sub}>Typing and space bar fixed. City auto-fills county when recognized.</p></section>
    {saving ? <Section title="Status"><p style={sub}>Saving pain room...</p></Section> : null}
    <Section title="Asset Class"><ChipSet label="Asset Class" options={ASSETS} selected={[assetClass]} onToggle={setAsset} /></Section>
    <Section title="Problem Type"><ChipSet label="Pain Type" options={PAIN_TYPES} selected={list(form.painTypes)} onToggle={(value) => toggle("painTypes", value)} /></Section>
    <Section title="Solution Routing"><ChipSet label="Needs" options={NEEDS} selected={list(form.routingNeeds)} onToggle={(value) => toggle("routingNeeds", value)} /></Section>
    <Section title="Severity + Pressure"><div style={grid}><SelectField label="Severity" value={txt(form.severity, "High")} onChange={(value) => up("severity", value)} options={SEVERITY} /><SelectField label="Time Pressure" value={txt(form.timePressure, "7 Days")} onChange={(value) => up("timePressure", value)} options={TIME} /><SelectField label="Capital Pressure" value={txt(form.capitalPressure, "Unknown")} onChange={(value) => up("capitalPressure", value)} options={CAPITAL} /></div><div style={{ height: 18 }} /><ChipSet label="Current Blockers" options={BLOCKERS} selected={list(form.blockers)} onToggle={(value) => toggle("blockers", value)} /><div style={{ height: 18 }} /><ChipSet label="Risk Types" options={RISK} selected={list(form.riskTypes)} onToggle={(value) => toggle("riskTypes", value)} /></Section>
    <Section title="Property + Market"><div style={grid}><Field label="Pain Room Title" value={txt(form.title)} onChange={(value) => up("title", value)} /><SelectField label="State" value={txt(form.state, "GA")} onChange={(value) => up("state", value)} options={STATES} /><Field label="City" value={txt(form.city)} onChange={updateCity} /><Field label="County" value={txt(form.county)} onChange={(value) => up("county", value)} /><Field label="Address / Location" value={txt(form.address)} onChange={(value) => up("address", value)} /><SelectField label="Property Type" value={txt(form.propertyType, propertyTypes[0])} onChange={(value) => up("propertyType", value)} options={propertyTypes} /></div></Section>
    <Section title="Numbers + Burn"><div style={grid}><Field label="Ask Price" value={txt(form.askingPrice)} onChange={(value) => up("askingPrice", value)} /><Field label="Value / ARV" value={txt(form.propertyValue)} onChange={(value) => up("propertyValue", value)} /><Field label="Repairs / Work" value={txt(form.repairs)} onChange={(value) => up("repairs", value)} /><Field label="Money Needed Now" value={txt(form.moneyNeededNow)} onChange={(value) => up("moneyNeededNow", value)} /></div></Section>
    <Section title="Outcome Logic"><div style={grid}><Field label="Root Cause" value={txt(form.rootCause)} onChange={(value) => up("rootCause", value)} /><Field label="Best Outcome" value={txt(form.bestOutcome)} onChange={(value) => up("bestOutcome", value)} /><Field label="Worst Case" value={txt(form.worstCase)} onChange={(value) => up("worstCase", value)} /><Field label="Desired Solution" value={txt(form.desiredSolution)} onChange={(value) => up("desiredSolution", value)} /></div></Section>
    <Section title="Contact + Notes"><div style={grid}><Field label="Contact Name" value={txt(form.contactName)} onChange={(value) => up("contactName", value)} /><Field label="Phone" value={txt(form.contactPhone)} onChange={(value) => up("contactPhone", value)} /><Field label="Email" value={txt(form.contactEmail)} onChange={(value) => up("contactEmail", value)} /><TextArea label="Notes / AI Context" value={txt(form.notes)} onChange={(value) => up("notes", value)} /></div></Section>
    <Section title="Photos Up To 10"><input type="file" multiple accept="image/*" onChange={(event) => setFiles(event.target.files)} /><p style={muted}>{files ? files.length : 0}/10 selected.</p></Section>
    <Section title="Save"><button type="button" style={goldBtn} onClick={submit}>Save Pain Room</button></Section>
  </div></main>;
}
