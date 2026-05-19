"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type PainState = "active" | "saved" | "archived" | "deleted";
type AssetClass = "Residential" | "Commercial" | "Land";

type PainRoom = {
  id: string;
  roomId: string;
  title: string;
  state: string;
  city: string;
  county: string;
  address: string;
  assetClass: AssetClass;
  propertyType: string;
  painTypes: string[];
  needs: string[];
  blockers: string[];
  risks: string[];
  severity: string;
  timePressure: string;
  capitalPressure: string;
  controlStatus: string;
  currentStatus: string;
  ownerSituation: string;
  accessStatus: string;
  titleStatus: string;
  permitStatus: string;
  insuranceStatus: string;
  legalStatus: string;
  askPrice: string;
  value: string;
  repairs: string;
  monthlyBurn: string;
  moneyNeededNow: string;
  deadline: string;
  rootCause: string;
  bestOutcome: string;
  worstCase: string;
  desiredSolution: string;
  contactName: string;
  phone: string;
  email: string;
  bestContact: string;
  notes: string;
  photos: string[];
  photoUrls: string[];
  coverPhoto: string;
  photoUrl: string;
  imageUrl: string;
  roomState: PainState;
  cleanupState: PainState;
  stateStatus: PainState;
  alertRead: boolean;
  viewedAt: string;
  createdAt: string;
  updatedAt: string;
  analyzer: string;
};

const MAIN_KEY = "vaultforge_clean_pain_rooms_v2";
const LEGACY_KEY_ONE = "vaultforge_clean_pain_rooms_v1";
const LEGACY_KEY_TWO = "vaultforge_clean_pain_rooms";
const LEGACY_KEY_THREE = "vaultforge_pain_rooms";
const STATE_KEY = "vaultforge_pain_room_state_v2";

const STATES = ["GA", "TN", "AL", "FL", "NC", "SC", "TX"];
const ASSETS = ["Residential", "Commercial", "Land"];
const RES_TYPES = ["Single Family", "Duplex", "Triplex", "Quad", "Townhome", "Condo", "Mobile Home", "Small Multifamily", "Apartment"];
const COM_TYPES = ["Retail", "Office", "Industrial", "Warehouse", "Hotel", "Self Storage", "Mixed Use", "Medical", "Restaurant", "Automotive", "Special Use"];
const LAND_TYPES = ["Infill Lot", "Acreage", "Entitled Land", "Raw Land", "Commercial Pad", "Subdivision", "Timber", "Farm", "Assemblage"];
const PAIN_TYPES = ["Funding Gap", "Foreclosure", "Stalled Construction", "Contractor Problem", "Title Problem", "Permit Problem", "City Violation", "Tenant Issue", "Partnership Dispute", "Emergency Exit", "Insurance Claim", "Fire Damage", "Mold", "Structural", "Probate", "Tax Sale Risk", "Squatter Issue", "Burn Rate", "Seller Pressure", "Lender Problem", "Failed Closing"];
const NEEDS = ["Lender", "Operator", "Contractor", "Buyer", "Attorney", "Insurance Adjuster", "City Expeditor", "Private Capital", "Property Manager", "Developer"];
const BLOCKERS = ["Capital", "Timeline", "Title", "Access", "Contractor", "Tenant", "Permit", "City", "Legal", "Partner", "Seller Pressure", "Unknown Numbers", "Insurance", "Utilities", "Appraisal", "Inspection"];
const RISKS = ["Legal", "Financial", "Structural", "Operational", "City/Permit", "Occupancy", "Environmental", "Insurance", "Market", "Reputation"];
const SEVERITY = ["Low", "Medium", "High", "Critical", "Emergency"];
const TIME = ["24 Hours", "72 Hours", "7 Days", "14 Days", "30 Days", "Flexible"];
const CAPITAL = ["Unknown", "Under $25k", "$25k-$100k", "$100k-$250k", "$250k-$1M", "$1M+"];
const CONTROL = ["Unknown", "Owner Controlled", "Contract Controlled", "Partner Controlled", "Bank Controlled", "Court / Estate", "No Control Yet"];
const CONTACT = ["VaultForge Message", "Phone", "Text", "Email", "Contact Form"];

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

function browserReady() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function safeText(value: unknown, fallback = "") {
  const clean = String(value || "").trim();
  return clean || fallback;
}

function safeList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  if (typeof value === "string" && value.trim()) return value.split(",").map((item) => item.trim()).filter(Boolean);
  return [];
}

function parseJson<T>(raw: string | null, fallback: T): T {
  try {
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJsonSafe(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function propertyTypesFor(assetClass: string) {
  if (assetClass === "Commercial") return COM_TYPES;
  if (assetClass === "Land") return LAND_TYPES;
  return RES_TYPES;
}

function countyFromCity(city: string) {
  return CITY_COUNTY[city.trim().toLowerCase().replace(/\s+/g, " ")] || "";
}

function moneyNumber(value: unknown) {
  const number = Number(String(value || "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(number) ? number : 0;
}

function locationFor(room: Partial<PainRoom>) {
  return [safeText(room.city), safeText(room.county), safeText(room.state)].filter(Boolean).join(", ") || "Market not listed";
}

function defaultPainRoom(): PainRoom {
  const now = new Date().toISOString();

  return {
    id: "",
    roomId: "",
    title: "",
    state: "GA",
    city: "",
    county: "",
    address: "",
    assetClass: "Residential",
    propertyType: "Single Family",
    painTypes: ["Funding Gap"],
    needs: ["Lender"],
    blockers: [],
    risks: [],
    severity: "High",
    timePressure: "7 Days",
    capitalPressure: "Unknown",
    controlStatus: "Unknown",
    currentStatus: "",
    ownerSituation: "",
    accessStatus: "",
    titleStatus: "",
    permitStatus: "",
    insuranceStatus: "",
    legalStatus: "",
    askPrice: "",
    value: "",
    repairs: "",
    monthlyBurn: "",
    moneyNeededNow: "",
    deadline: "",
    rootCause: "",
    bestOutcome: "",
    worstCase: "",
    desiredSolution: "",
    contactName: "",
    phone: "",
    email: "",
    bestContact: "VaultForge Message",
    notes: "",
    photos: [],
    photoUrls: [],
    coverPhoto: "",
    photoUrl: "",
    imageUrl: "",
    roomState: "active",
    cleanupState: "active",
    stateStatus: "active",
    alertRead: false,
    viewedAt: "",
    createdAt: now,
    updatedAt: now,
    analyzer: "",
  };
}

function normalizePainRoom(value: any): PainRoom {
  const base = defaultPainRoom();
  const id = safeText(value?.id || value?.roomId || value?.painId || value?.signalId);
  const photos = safeList(value?.photos || value?.photoUrls);
  const cover = safeText(value?.coverPhoto || value?.photoUrl || value?.imageUrl || photos[0]);

  return {
    ...base,
    ...value,
    id,
    roomId: id,
    title: safeText(value?.title || value?.name || value?.painTitle || value?.problemTitle, "Untitled Pain Room"),
    state: safeText(value?.state, "GA"),
    city: safeText(value?.city),
    county: safeText(value?.county),
    address: safeText(value?.address || value?.location),
    assetClass: (["Residential", "Commercial", "Land"].includes(safeText(value?.assetClass)) ? safeText(value?.assetClass) : "Residential") as AssetClass,
    propertyType: safeText(value?.propertyType, "Single Family"),
    painTypes: safeList(value?.painTypes || value?.problemTypes).length ? safeList(value?.painTypes || value?.problemTypes) : ["Funding Gap"],
    needs: safeList(value?.needs || value?.routingNeeds).length ? safeList(value?.needs || value?.routingNeeds) : ["Lender"],
    blockers: safeList(value?.blockers),
    risks: safeList(value?.risks || value?.riskTypes),
    photos,
    photoUrls: photos,
    coverPhoto: cover,
    photoUrl: cover,
    imageUrl: cover,
    roomState: (["active", "saved", "archived", "deleted"].includes(safeText(value?.roomState || value?.cleanupState || value?.stateStatus)) ? safeText(value?.roomState || value?.cleanupState || value?.stateStatus) : "active") as PainState,
    cleanupState: (["active", "saved", "archived", "deleted"].includes(safeText(value?.roomState || value?.cleanupState || value?.stateStatus)) ? safeText(value?.roomState || value?.cleanupState || value?.stateStatus) : "active") as PainState,
    stateStatus: (["active", "saved", "archived", "deleted"].includes(safeText(value?.roomState || value?.cleanupState || value?.stateStatus)) ? safeText(value?.roomState || value?.cleanupState || value?.stateStatus) : "active") as PainState,
    createdAt: safeText(value?.createdAt, new Date().toISOString()),
    updatedAt: safeText(value?.updatedAt, new Date().toISOString()),
  };
}

function readStoredPainRooms() {
  if (!browserReady()) return [];
  const seen = new Set<string>();
  const out: PainRoom[] = [];

  for (const key of [MAIN_KEY, LEGACY_KEY_ONE, LEGACY_KEY_TWO, LEGACY_KEY_THREE]) {
    const rows = parseJson<any[]>(localStorage.getItem(key), []);
    if (!Array.isArray(rows)) continue;

    for (const row of rows) {
      const room = normalizePainRoom(row);
      if (!room.id || seen.has(room.id)) continue;
      seen.add(room.id);
      out.push(room);
    }
  }

  const states = parseJson<Record<string, PainState>>(localStorage.getItem(STATE_KEY), {});
  return out.map((room) => ({
    ...room,
    roomState: states[room.id] || room.roomState || "active",
    cleanupState: states[room.id] || room.roomState || "active",
    stateStatus: states[room.id] || room.roomState || "active",
  }));
}

function painIntelligence(room: PainRoom) {
  let severityScore = 40;
  if (room.severity === "Medium") severityScore += 10;
  if (room.severity === "High") severityScore += 25;
  if (room.severity === "Critical") severityScore += 38;
  if (room.severity === "Emergency") severityScore += 48;
  if (room.timePressure === "24 Hours" || room.timePressure === "72 Hours") severityScore += 18;
  if (room.blockers.includes("Capital")) severityScore += 10;
  if (room.blockers.includes("Title") || room.blockers.includes("Legal")) severityScore += 8;
  severityScore = Math.max(0, Math.min(100, severityScore));

  const capitalScore = room.capitalPressure !== "Unknown" || room.painTypes.includes("Funding Gap") ? 78 : 35;
  const blockerScore = Math.max(10, Math.min(100, room.blockers.length * 12 + room.risks.length * 8));
  const difficulty = Math.max(20, Math.min(100, Math.round((severityScore + blockerScore + capitalScore) / 3)));

  const banner =
    severityScore >= 85 ? "Immediate pressure signal"
    : severityScore >= 70 ? "High-priority execution issue"
    : severityScore >= 50 ? "Active problem needing routing"
    : "Monitor until facts are complete";

  const bestNextMove =
    room.controlStatus === "No Control Yet" ? "Secure control or authority first, then route to the solver network."
    : room.blockers.includes("Capital") ? "Confirm numbers, money needed now, and route to private capital or lender fit."
    : room.blockers.includes("Title") ? "Collect title facts and route to attorney/title solver before spending more capital."
    : "Identify the one blocker preventing execution and route to the highest-fit solver profile.";

  return {
    severityScore,
    capitalScore,
    blockerScore,
    difficulty,
    banner,
    bestNextMove,
    consequence: room.worstCase || "Delay, cost increase, failed closing, loss of control, or legal/financial escalation.",
  };
}

function buildAnalyzer(room: PainRoom) {
  const intel = painIntelligence(room);
  return [
    `Pain analyzer: ${room.painTypes.join(", ")} in ${locationFor(room)}.`,
    `Severity ${room.severity}. Time pressure ${room.timePressure}. Capital pressure ${room.capitalPressure}.`,
    `Needs ${room.needs.join(", ")}. Blockers ${room.blockers.join(", ") || "not selected"}.`,
    `Signal: ${intel.banner}. Severity score ${intel.severityScore}%. Difficulty ${intel.difficulty}%.`,
    `Best next move: ${intel.bestNextMove}`,
  ].join(" ");
}

function saveDirectPainRoom(room: PainRoom) {
  if (!browserReady()) {
    return { ok: false, id: "", message: "Browser storage is not available." };
  }

  const id = room.id || `pain_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date().toISOString();
  const cover = room.photos[0] || room.coverPhoto || "";

  const full = normalizePainRoom({
    ...room,
    id,
    roomId: id,
    coverPhoto: cover,
    photoUrl: cover,
    imageUrl: cover,
    photoUrls: room.photos,
    roomState: "active",
    cleanupState: "active",
    stateStatus: "active",
    alertRead: false,
    viewedAt: "",
    createdAt: room.createdAt || now,
    updatedAt: now,
    analyzer: buildAnalyzer(room),
  });

  const existing = readStoredPainRooms().filter((item) => item.id !== id);
  const all = [full, ...existing];

  let saved =
    writeJsonSafe(MAIN_KEY, all) &&
    writeJsonSafe(LEGACY_KEY_ONE, all) &&
    writeJsonSafe(LEGACY_KEY_TWO, all) &&
    writeJsonSafe(`vaultforge_pain_room_${id}`, full);

  if (!saved) {
    const slim = normalizePainRoom({ ...full, photos: [], photoUrls: [], coverPhoto: "", photoUrl: "", imageUrl: "" });
    const slimList = [slim, ...existing.map((item) => ({ ...item, photos: [], photoUrls: [], coverPhoto: "", photoUrl: "", imageUrl: "" }))];
    saved =
      writeJsonSafe(MAIN_KEY, slimList) &&
      writeJsonSafe(LEGACY_KEY_ONE, slimList) &&
      writeJsonSafe(LEGACY_KEY_TWO, slimList) &&
      writeJsonSafe(`vaultforge_pain_room_${id}`, slim);
  }

  if (!saved) {
    return { ok: false, id: "", message: "Pain room could not save. Browser storage is full. Delete old test rooms/photos and try again." };
  }

  const states = parseJson<Record<string, PainState>>(localStorage.getItem(STATE_KEY), {});
  states[id] = "active";
  writeJsonSafe(STATE_KEY, states);

  window.dispatchEvent(new Event("vaultforge-pain-change"));
  window.dispatchEvent(new Event("vaultforge-room-state-change"));
  window.dispatchEvent(new Event("vaultforge-alert-change"));

  return { ok: true, id, message: "Pain room saved." };
}

async function compressImage(file: File, maxWidth = 620, quality = 0.42): Promise<string> {
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
          if (!ctx) return resolve("");
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

async function photosFromFilesLocal(files: FileList | null) {
  const selected = Array.from(files || []).slice(0, 10);
  const output: string[] = [];
  for (const file of selected) {
    const compressed = await compressImage(file);
    if (compressed) output.push(compressed);
  }
  return output;
}

const page: React.CSSProperties = { minHeight: "100vh", background: "#05070d", color: "#f7f7fb", padding: 18, fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" };
const wrap: React.CSSProperties = { maxWidth: 1280, margin: "0 auto", paddingBottom: 120 };
const nav: React.CSSProperties = { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 18 };
const brand: React.CSSProperties = { color: "#ffd45a", fontSize: 27, fontWeight: 950, letterSpacing: -1, marginRight: 10 };
const btn: React.CSSProperties = { border: "1px solid rgba(207,216,230,.18)", background: "#171c29", color: "#f7f7fb", borderRadius: 999, padding: "13px 18px", fontWeight: 950, textDecoration: "none", display: "inline-block", cursor: "pointer" };
const goldBtn: React.CSSProperties = { ...btn, border: 0, background: "#ffdc68", color: "#10131a" };
const redBtn: React.CSSProperties = { ...btn, background: "#271016", borderColor: "rgba(255,70,70,.48)", color: "#ffaaaa" };
const hero: React.CSSProperties = { border: "1px solid rgba(245,197,66,.28)", borderRadius: 28, padding: 30, marginBottom: 20, background: "radial-gradient(circle at top right, rgba(245,197,66,.16), transparent 32%), linear-gradient(180deg,#080d19,#050816)" };
const dangerHero: React.CSSProperties = { ...hero, borderColor: "rgba(255,70,70,.62)", background: "radial-gradient(circle at top right, rgba(255,30,60,.22), transparent 35%), linear-gradient(180deg,#170812,#050816)" };
const card: React.CSSProperties = { background: "linear-gradient(180deg,#080d19,#050816)", border: "1px solid rgba(245,197,66,.28)", borderRadius: 26, padding: 26, marginBottom: 22 };
const panel: React.CSSProperties = { background: "#121724", border: "1px solid rgba(207,216,230,.16)", borderRadius: 22, padding: 22 };
const activePanel: React.CSSProperties = { ...panel, borderColor: "rgba(255,70,70,.70)", boxShadow: "0 0 26px rgba(255,50,70,.22)" };
const sticky: React.CSSProperties = { position: "sticky", top: 10, zIndex: 10, background: "rgba(5,7,13,.92)", backdropFilter: "blur(10px)", border: "1px solid rgba(245,197,66,.28)", borderRadius: 24, padding: 16, marginBottom: 18 };
const eyebrow: React.CSSProperties = { color: "#ffd45a", textTransform: "uppercase", letterSpacing: 7, fontWeight: 950, fontSize: 15, marginBottom: 12 };
const label: React.CSSProperties = { color: "#ffd45a", textTransform: "uppercase", letterSpacing: 4, fontSize: 12, fontWeight: 950, marginBottom: 8 };
const h1: React.CSSProperties = { fontSize: "clamp(44px,8vw,86px)", lineHeight: 0.9, letterSpacing: -4, margin: "0 0 18px", fontWeight: 950 };
const h2: React.CSSProperties = { fontSize: "clamp(30px,5vw,52px)", lineHeight: 0.95, letterSpacing: -2, margin: "0 0 14px", fontWeight: 950 };
const sub: React.CSSProperties = { color: "#c9d0dc", fontSize: 21, lineHeight: 1.35, margin: 0 };
const muted: React.CSSProperties = { color: "#aeb7c7", margin: "8px 0 0", lineHeight: 1.35 };
const grid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(245px,1fr))", gap: 16 };
const row: React.CSSProperties = { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" };
const input: React.CSSProperties = { width: "100%", boxSizing: "border-box", border: "1px solid rgba(207,216,230,.18)", background: "#151b2a", color: "#f8fafc", borderRadius: 18, padding: "15px 16px", fontSize: 16 };
const textarea: React.CSSProperties = { ...input, minHeight: 120, resize: "vertical" };
const photoStyle: React.CSSProperties = { width: "100%", height: 170, objectFit: "cover", borderRadius: 18, border: "1px solid rgba(245,197,66,.25)", marginBottom: 12 };

function Nav() {
  return (
    <nav style={nav}>
      <div style={brand}>VAULTFORGE</div>
      <Link href="/command" style={btn}>Command</Link>
      <Link href="/members" style={btn}>Members</Link>
      <Link href="/network" style={btn}>Network</Link>
      <Link href="/deal-rooms" style={btn}>Deal Rooms</Link>
      <Link href="/pain-rooms" style={btn}>Pain Rooms</Link>
      <Link href="/deal-create" style={btn}>Create Deal</Link>
      <Link href="/pain-intake" style={goldBtn}>Pain Intake</Link>
      <Link href="/messages" style={btn}>Messages</Link>
      <Link href="/profile" style={btn}>Profile</Link>
      <Link href="/logout" style={redBtn}>Logout</Link>
    </nav>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section style={card}><div style={eyebrow}>{title}</div>{children}</section>;
}

function stopKeys(event: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) {
  event.stopPropagation();
}

function Field({ title, value, onChange }: { title: string; value: string; onChange: (value: string) => void }) {
  return <label><div style={label}>{title}</div><input style={input} value={value} onKeyDownCapture={stopKeys} onKeyUpCapture={stopKeys} onChange={(event) => onChange(event.target.value)} /></label>;
}

function TextArea({ title, value, onChange }: { title: string; value: string; onChange: (value: string) => void }) {
  return <label><div style={label}>{title}</div><textarea style={textarea} value={value} onKeyDownCapture={stopKeys} onKeyUpCapture={stopKeys} onChange={(event) => onChange(event.target.value)} /></label>;
}

function SelectField({ title, value, options, onChange }: { title: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return <label><div style={label}>{title}</div><select style={input} value={value} onChange={(event) => onChange(event.target.value)}>{options.map((option) => <option key={option}>{option}</option>)}</select></label>;
}

function ChipSet({ title, options, selected, onToggle }: { title: string; options: string[]; selected: string[]; onToggle: (value: string) => void }) {
  return <div><div style={label}>{title}</div><div style={row}>{options.map((option) => <button key={option} type="button" style={selected.includes(option) ? goldBtn : btn} onClick={() => onToggle(option)}>{option}</button>)}</div></div>;
}

function Meter({ title, value }: { title: string; value: number }) {
  return (
    <div style={panel}>
      <div style={eyebrow}>{title}</div>
      <h2 style={h2}>{value}%</h2>
      <div style={{ height: 10, background: "#070a12", borderRadius: 999, overflow: "hidden" }}>
        <div style={{ width: `${Math.max(0, Math.min(100, value))}%`, height: "100%", background: "#ffdc68" }} />
      </div>
    </div>
  );
}

export default function PainIntakePage() {
  const [form, setForm] = useState<PainRoom>(() => defaultPainRoom());
  const [banner, setBanner] = useState("");
  const [error, setError] = useState("");
  const [savedId, setSavedId] = useState("");
  const [saving, setSaving] = useState(false);

  const propertyTypes = useMemo(() => propertyTypesFor(form.assetClass), [form.assetClass]);
  const intelligence = useMemo(() => painIntelligence(form), [form]);

  function update(key: keyof PainRoom, value: any) {
    setForm({ ...form, [key]: value });
  }

  function toggle(key: keyof PainRoom, value: string) {
    const current = new Set(safeList(form[key]));
    current.has(value) ? current.delete(value) : current.add(value);
    update(key, Array.from(current));
  }

  function setAsset(assetClass: string) {
    const types = propertyTypesFor(assetClass);
    setForm({ ...form, assetClass: assetClass as AssetClass, propertyType: types[0] || "" });
  }

  function setCity(city: string) {
    setForm({ ...form, city, county: countyFromCity(city) || form.county });
  }

  async function addPhotos(files: FileList | null) {
    const next = await photosFromFilesLocal(files);
    setForm({ ...form, photos: [...form.photos, ...next].slice(0, 10), coverPhoto: form.coverPhoto || next[0] || "" });
  }

  function removePhoto(index: number) {
    const next = form.photos.filter((_, photoIndex) => photoIndex !== index);
    setForm({ ...form, photos: next, coverPhoto: next[0] || "" });
  }

  function save() {
    setSaving(true);
    setError("");
    setBanner("");
    setSavedId("");

    try {
      if (!safeText(form.title)) {
        setError("Add a pain room title before saving.");
        return;
      }

      if (!form.painTypes.length) {
        setError("Pick at least one pain type.");
        return;
      }

      const result = saveDirectPainRoom({ ...form, coverPhoto: form.photos[0] || form.coverPhoto });
      if (!result.ok || !result.id) {
        setError(result.message || "Pain room did not save.");
        return;
      }

      setSavedId(result.id);
      setBanner("Pain room saved. Use Open Room to verify it.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Pain save failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main style={page}>
      <div style={wrap}>
        <Nav />

        <section style={sticky}>
          <div style={row}>
            <button type="button" style={goldBtn} onClick={save} disabled={saving}>{saving ? "Saving..." : "Save Pain Room"}</button>
            {savedId ? <Link href={`/pain-rooms/${encodeURIComponent(savedId)}`} style={goldBtn}>Open Saved Room</Link> : null}
            <span style={muted}>{safeText(form.title, "No title yet")} • {form.severity} • {locationFor(form)}</span>
          </div>
        </section>

        {banner ? (
          <section style={activePanel}>
            <div style={eyebrow}>Saved</div>
            <h2 style={h2}>{banner}</h2>
            <div style={{ ...row, marginTop: 18 }}>
              <Link href={`/pain-rooms/${encodeURIComponent(savedId)}`} style={goldBtn}>Open Room</Link>
              <button type="button" style={btn} onClick={() => { setBanner(""); setSavedId(""); setForm(defaultPainRoom()); }}>Create Another</button>
              <Link href="/network" style={btn}>Go Network</Link>
            </div>
          </section>
        ) : null}

        {error ? <section style={activePanel}><div style={eyebrow}>Error</div><h2 style={h2}>{error}</h2></section> : null}

        <section style={intelligence.severityScore >= 80 ? dangerHero : hero}>
          <div style={eyebrow}>Pain Intake</div>
          <h1 style={h1}>Pressure room intake.</h1>
          <p style={sub}>Built for real distress: capital gaps, foreclosure, title issues, city pressure, failed contractors, tenant problems, stalled projects, and urgent execution.</p>
        </section>

        <Section title="AI Pressure Preview">
          <div style={grid}>
            <Meter title="Severity" value={intelligence.severityScore} />
            <Meter title="Capital Need" value={intelligence.capitalScore} />
            <Meter title="Execution Difficulty" value={intelligence.difficulty} />
            <div style={panel}>
              <div style={eyebrow}>Best Next Move</div>
              <p style={sub}>{intelligence.bestNextMove}</p>
              <p style={muted}>{intelligence.banner}</p>
            </div>
          </div>
        </Section>

        <Section title="Live Room Preview">
          <div style={activePanel}>
            {form.coverPhoto || form.photos[0] ? <img src={form.coverPhoto || form.photos[0]} alt="Pain preview" style={photoStyle} /> : null}
            <div style={eyebrow}>{form.severity} • {form.assetClass}</div>
            <h2 style={h2}>{safeText(form.title, "Untitled Pain Room")}</h2>
            <p style={sub}>{locationFor(form)}</p>
            <p style={muted}>{form.painTypes.join(", ")} • Needs {form.needs.join(", ")}</p>
          </div>
        </Section>

        <Section title="Pain Type">
          <ChipSet title="Select all that apply" options={PAIN_TYPES} selected={form.painTypes} onToggle={(value) => toggle("painTypes", value)} />
        </Section>

        <Section title="What Help Is Needed">
          <ChipSet title="Routing Needs" options={NEEDS} selected={form.needs} onToggle={(value) => toggle("needs", value)} />
        </Section>

        <Section title="Asset + Market">
          <ChipSet title="Asset Class" options={ASSETS} selected={[form.assetClass]} onToggle={setAsset} />
          <div style={{ height: 18 }} />
          <div style={grid}>
            <Field title="Pain Room Title" value={form.title} onChange={(value) => update("title", value)} />
            <SelectField title="State" value={form.state} options={STATES} onChange={(value) => update("state", value)} />
            <Field title="City" value={form.city} onChange={setCity} />
            <Field title="County" value={form.county} onChange={(value) => update("county", value)} />
            <Field title="Address / Location" value={form.address} onChange={(value) => update("address", value)} />
            <SelectField title="Property Type" value={form.propertyType} options={propertyTypes} onChange={(value) => update("propertyType", value)} />
          </div>
        </Section>

        <Section title="Severity + Pressure">
          <div style={grid}>
            <SelectField title="Severity" value={form.severity} options={SEVERITY} onChange={(value) => update("severity", value)} />
            <SelectField title="Time Pressure" value={form.timePressure} options={TIME} onChange={(value) => update("timePressure", value)} />
            <SelectField title="Capital Pressure" value={form.capitalPressure} options={CAPITAL} onChange={(value) => update("capitalPressure", value)} />
            <SelectField title="Control Status" value={form.controlStatus} options={CONTROL} onChange={(value) => update("controlStatus", value)} />
            <SelectField title="Best Contact" value={form.bestContact} options={CONTACT} onChange={(value) => update("bestContact", value)} />
          </div>
        </Section>

        <Section title="Blockers">
          <ChipSet title="What is stopping execution" options={BLOCKERS} selected={form.blockers} onToggle={(value) => toggle("blockers", value)} />
        </Section>

        <Section title="Risk">
          <ChipSet title="Risk Types" options={RISKS} selected={form.risks} onToggle={(value) => toggle("risks", value)} />
        </Section>

        <Section title="Control + Status">
          <div style={grid}>
            <Field title="Current Status" value={form.currentStatus} onChange={(value) => update("currentStatus", value)} />
            <Field title="Owner / Seller Situation" value={form.ownerSituation} onChange={(value) => update("ownerSituation", value)} />
            <Field title="Access Status" value={form.accessStatus} onChange={(value) => update("accessStatus", value)} />
            <Field title="Title Status" value={form.titleStatus} onChange={(value) => update("titleStatus", value)} />
            <Field title="Permit / City Status" value={form.permitStatus} onChange={(value) => update("permitStatus", value)} />
            <Field title="Insurance Status" value={form.insuranceStatus} onChange={(value) => update("insuranceStatus", value)} />
            <Field title="Legal Status" value={form.legalStatus} onChange={(value) => update("legalStatus", value)} />
          </div>
        </Section>

        <Section title="Numbers + Deadline">
          <div style={grid}>
            <Field title="Ask Price" value={form.askPrice} onChange={(value) => update("askPrice", value)} />
            <Field title="Value / ARV" value={form.value} onChange={(value) => update("value", value)} />
            <Field title="Repairs / Work" value={form.repairs} onChange={(value) => update("repairs", value)} />
            <Field title="Monthly Burn Rate" value={form.monthlyBurn} onChange={(value) => update("monthlyBurn", value)} />
            <Field title="Money Needed Now" value={form.moneyNeededNow} onChange={(value) => update("moneyNeededNow", value)} />
            <Field title="Deadline / Date Pressure" value={form.deadline} onChange={(value) => update("deadline", value)} />
          </div>
        </Section>

        <Section title="Outcome Logic">
          <div style={grid}>
            <Field title="Root Cause" value={form.rootCause} onChange={(value) => update("rootCause", value)} />
            <Field title="Best Realistic Outcome" value={form.bestOutcome} onChange={(value) => update("bestOutcome", value)} />
            <Field title="Worst Case If No Action" value={form.worstCase} onChange={(value) => update("worstCase", value)} />
            <Field title="Desired Solution" value={form.desiredSolution} onChange={(value) => update("desiredSolution", value)} />
          </div>
        </Section>

        <Section title="Contact + AI Context">
          <div style={grid}>
            <Field title="Contact Name" value={form.contactName} onChange={(value) => update("contactName", value)} />
            <Field title="Phone" value={form.phone} onChange={(value) => update("phone", value)} />
            <Field title="Email" value={form.email} onChange={(value) => update("email", value)} />
            <TextArea title="Problem Notes / AI Context" value={form.notes} onChange={(value) => update("notes", value)} />
          </div>
        </Section>

        <Section title="Photos">
          <input type="file" multiple accept="image/*" onChange={(event) => addPhotos(event.target.files)} />
          <p style={muted}>{form.photos.length}/10 selected. First photo becomes cover.</p>
          {form.photos.length ? (
            <div style={grid}>
              {form.photos.map((photo, index) => (
                <div key={`${photo.slice(0, 20)}-${index}`} style={panel}>
                  <img src={photo} alt={`Pain ${index + 1}`} style={photoStyle} />
                  <button type="button" style={redBtn} onClick={() => removePhoto(index)}>Delete Photo</button>
                </div>
              ))}
            </div>
          ) : null}
        </Section>

        <Section title="Save">
          <button type="button" style={goldBtn} onClick={save} disabled={saving}>
            {saving ? "Saving..." : "Save Pain Room"}
          </button>
        </Section>
      </div>
    </main>
  );
}
