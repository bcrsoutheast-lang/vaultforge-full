"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type PainState = "active" | "saved" | "archived" | "deleted";
type AssetClass = "Residential" | "Commercial" | "Land";
type PainRoom = {
  id: string; roomId: string; title: string; state: string; city: string; county: string; address: string;
  assetClass: AssetClass; propertyType: string; painTypes: string[]; needs: string[]; blockers: string[]; risks: string[];
  severity: string; timePressure: string; capitalPressure: string; controlStatus: string; currentStatus: string;
  ownerSituation: string; accessStatus: string; titleStatus: string; permitStatus: string; insuranceStatus: string; legalStatus: string;
  askPrice: string; value: string; repairs: string; monthlyBurn: string; moneyNeededNow: string; deadline: string;
  rootCause: string; bestOutcome: string; worstCase: string; desiredSolution: string; contactName: string; phone: string; email: string; bestContact: string; notes: string;
  foreclosureAuctionDate: string; reinstatementAmount: string; payoffAmount: string; lenderName: string; bankruptcyFiled: string;
  fundingAmountNeeded: string; useOfFunds: string; collateralAvailable: string; currentDebt: string;
  completionPercent: string; contractorStatus: string; permitsExpired: string; inspectionFailed: string; moneyLeftInBudget: string;
  titleIssueType: string; lienAmount: string; probateStatus: string; missingHeirs: string; ownershipDispute: string;
  violationType: string; cityDeadline: string; fineAmount: string; expeditorNeeded: string;
  tenantStatusDetail: string; rentOwed: string; evictionFiled: string; accessProblem: string;
  claimNumber: string; adjusterStatus: string; damageType: string; photos: string[]; photoUrls: string[]; coverPhoto: string; photoUrl: string; imageUrl: string;
  roomState: PainState; cleanupState: PainState; stateStatus: PainState; alertRead: boolean; viewedAt: string; createdAt: string; updatedAt: string; analyzer: string;
};

const MAIN_KEY = "vaultforge_clean_pain_rooms_v2";
const LEGACY_ONE = "vaultforge_clean_pain_rooms_v1";
const LEGACY_TWO = "vaultforge_clean_pain_rooms";
const STATE_KEY = "vaultforge_pain_room_state_v2";
const STATES = ["GA", "TN", "AL", "FL", "NC", "SC", "TX"];
const ASSETS = ["Residential", "Commercial", "Land"];
const RES_TYPES = ["Single Family", "Duplex", "Triplex", "Quad", "Townhome", "Condo", "Mobile Home", "Small Multifamily", "Apartment"];
const COM_TYPES = ["Retail", "Office", "Industrial", "Warehouse", "Hotel", "Self Storage", "Mixed Use", "Medical", "Restaurant", "Automotive", "Special Use"];
const LAND_TYPES = ["Infill Lot", "Acreage", "Entitled Land", "Raw Land", "Commercial Pad", "Subdivision", "Timber", "Farm", "Assemblage"];
const PAIN_TYPES = ["Funding Gap", "Foreclosure", "Stalled Construction", "Contractor Problem", "Title Problem", "Permit Problem", "City Violation", "Tenant Issue", "Squatter Issue", "Partnership Dispute", "Emergency Exit", "Insurance Claim", "Fire Damage", "Probate", "Tax Sale Risk", "Burn Rate", "Seller Pressure", "Lender Problem", "Failed Closing"];
const NEEDS = ["Lender", "Operator", "Contractor", "Buyer", "Attorney", "Insurance Adjuster", "City Expeditor", "Private Capital", "Property Manager", "Developer"];
const BLOCKERS = ["Capital", "Timeline", "Title", "Access", "Contractor", "Tenant", "Permit", "City", "Legal", "Partner", "Seller Pressure", "Unknown Numbers", "Insurance", "Utilities", "Appraisal", "Inspection"];
const RISKS = ["Legal", "Financial", "Structural", "Operational", "City/Permit", "Occupancy", "Environmental", "Insurance", "Market", "Reputation"];
const SEVERITY = ["Low", "Medium", "High", "Critical", "Emergency"];
const TIME = ["24 Hours", "72 Hours", "7 Days", "14 Days", "30 Days", "Flexible"];
const CAPITAL = ["Unknown", "Under $25k", "$25k-$100k", "$100k-$250k", "$250k-$1M", "$1M+"];
const CONTROL = ["Unknown", "Owner Controlled", "Contract Controlled", "Partner Controlled", "Bank Controlled", "Court / Estate", "No Control Yet"];
const CONTACT = ["VaultForge Message", "Phone", "Text", "Email", "Contact Form"];
const YESNO = ["Unknown", "Yes", "No"];
const CITY_COUNTY: Record<string, string> = {
  atlanta: "Fulton", alpharetta: "Fulton", roswell: "Fulton", marietta: "Cobb", smyrna: "Cobb", kennesaw: "Cobb",
  cartersville: "Bartow", cville: "Bartow", cvile: "Bartow", adairsville: "Bartow", rome: "Floyd", gainesville: "Hall",
  savannah: "Chatham", augusta: "Richmond", columbus: "Muscogee", macon: "Bibb", chattanooga: "Hamilton",
  nashville: "Davidson", knoxville: "Knox", birmingham: "Jefferson", huntsville: "Madison", charlotte: "Mecklenburg",
  raleigh: "Wake", greenville: "Greenville", charleston: "Charleston", dallas: "Dallas", houston: "Harris",
  austin: "Travis", "san antonio": "Bexar", sanantonio: "Bexar",
};

function browserReady() { return typeof window !== "undefined" && typeof window.localStorage !== "undefined"; }
function safeText(v: unknown, fallback = "") { const clean = String(v || "").trim(); return clean || fallback; }
function safeList(v: unknown): string[] { if (Array.isArray(v)) return v.map((x) => String(x).trim()).filter(Boolean); if (typeof v === "string" && v.trim()) return v.split(",").map((x) => x.trim()).filter(Boolean); return []; }
function parseJson<T>(raw: string | null, fallback: T): T { try { return raw ? JSON.parse(raw) as T : fallback; } catch { return fallback; } }
function writeJson(key: string, value: unknown) { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; } }
function propertyTypesFor(asset: string) { if (asset === "Commercial") return COM_TYPES; if (asset === "Land") return LAND_TYPES; return RES_TYPES; }
function countyFromCity(city: string) { return CITY_COUNTY[city.trim().toLowerCase().replace(/\s+/g, " ")] || ""; }
function locationFor(room: Partial<PainRoom>) { return [safeText(room.city), safeText(room.county), safeText(room.state)].filter(Boolean).join(", ") || "Market not listed"; }

function defaultPain(): PainRoom {
  const now = new Date().toISOString();
  return { id: "", roomId: "", title: "", state: "GA", city: "", county: "", address: "", assetClass: "Residential", propertyType: "Single Family",
    painTypes: ["Funding Gap"], needs: ["Lender"], blockers: [], risks: [], severity: "High", timePressure: "7 Days", capitalPressure: "Unknown", controlStatus: "Unknown",
    currentStatus: "", ownerSituation: "", accessStatus: "", titleStatus: "", permitStatus: "", insuranceStatus: "", legalStatus: "",
    askPrice: "", value: "", repairs: "", monthlyBurn: "", moneyNeededNow: "", deadline: "", rootCause: "", bestOutcome: "", worstCase: "", desiredSolution: "",
    contactName: "", phone: "", email: "", bestContact: "VaultForge Message", notes: "",
    foreclosureAuctionDate: "", reinstatementAmount: "", payoffAmount: "", lenderName: "", bankruptcyFiled: "Unknown",
    fundingAmountNeeded: "", useOfFunds: "", collateralAvailable: "Unknown", currentDebt: "",
    completionPercent: "", contractorStatus: "Unknown", permitsExpired: "Unknown", inspectionFailed: "Unknown", moneyLeftInBudget: "",
    titleIssueType: "Unknown", lienAmount: "", probateStatus: "Unknown", missingHeirs: "Unknown", ownershipDispute: "Unknown",
    violationType: "", cityDeadline: "", fineAmount: "", expeditorNeeded: "Unknown",
    tenantStatusDetail: "Unknown", rentOwed: "", evictionFiled: "Unknown", accessProblem: "Unknown",
    claimNumber: "", adjusterStatus: "Unknown", damageType: "",
    photos: [], photoUrls: [], coverPhoto: "", photoUrl: "", imageUrl: "", roomState: "active", cleanupState: "active", stateStatus: "active", alertRead: false, viewedAt: "", createdAt: now, updatedAt: now, analyzer: "" };
}

function readPain() {
  if (!browserReady()) return [] as PainRoom[];
  const out: PainRoom[] = [];
  const seen = new Set<string>();
  for (const key of [MAIN_KEY, LEGACY_ONE, LEGACY_TWO]) {
    const rows = parseJson<any[]>(localStorage.getItem(key), []);
    for (const row of rows) {
      const id = safeText(row?.id || row?.roomId);
      if (!id || seen.has(id)) continue;
      seen.add(id);
      out.push({ ...defaultPain(), ...row, id, roomId: id, photos: safeList(row?.photos || row?.photoUrls), photoUrls: safeList(row?.photos || row?.photoUrls) });
    }
  }
  return out;
}

function painIntel(room: PainRoom) {
  let severity = 40;
  if (room.severity === "Medium") severity += 10;
  if (room.severity === "High") severity += 25;
  if (room.severity === "Critical") severity += 38;
  if (room.severity === "Emergency") severity += 48;
  if (room.timePressure === "24 Hours" || room.timePressure === "72 Hours") severity += 18;
  if (room.painTypes.includes("Foreclosure") && room.foreclosureAuctionDate) severity += 12;
  if (room.painTypes.includes("Funding Gap") && room.fundingAmountNeeded) severity += 10;
  if (room.painTypes.includes("Stalled Construction") && room.contractorStatus !== "Unknown") severity += 8;
  if ((room.painTypes.includes("Title Problem") || room.painTypes.includes("Probate")) && room.titleIssueType !== "Unknown") severity += 10;
  if ((room.painTypes.includes("Tenant Issue") || room.painTypes.includes("Squatter Issue")) && room.accessProblem !== "Unknown") severity += 8;
  if (room.blockers.includes("Capital")) severity += 10;
  severity = Math.max(0, Math.min(100, severity));
  const capitalScore = room.capitalPressure !== "Unknown" || room.painTypes.includes("Funding Gap") ? 80 : 35;
  const difficulty = Math.max(20, Math.min(100, Math.round((severity + capitalScore + room.blockers.length * 12 + room.risks.length * 8) / 2)));
  const signal = severity >= 85 ? "Immediate pressure signal" : severity >= 70 ? "High-priority execution problem" : severity >= 50 ? "Active problem needing routing" : "Monitor until facts improve";
  const next = room.controlStatus === "No Control Yet" ? "Secure control or authority first, then route to solver network." : room.painTypes.includes("Foreclosure") ? "Confirm auction date, reinstatement, payoff, and lender, then route to capital/legal." : room.painTypes.includes("Funding Gap") ? "Confirm amount needed, use of funds, collateral, and timeline, then route to capital/lender." : room.painTypes.includes("Title Problem") ? "Collect title facts and route to attorney/title solver." : "Identify the blocker stopping execution and route to best-fit solver.";
  const analyzer = `Pain analyzer: ${room.painTypes.join(", ")} in ${locationFor(room)}. Severity ${severity}%. Capital ${capitalScore}%. Difficulty ${difficulty}%. Signal: ${signal}. Next move: ${next}`;
  return { severity, capitalScore, difficulty, signal, next, analyzer };
}

function savePain(room: PainRoom) {
  if (!browserReady()) return { ok: false, id: "", message: "Browser storage unavailable." };
  const id = room.id || `pain_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date().toISOString();
  const intel = painIntel(room);
  const cover = room.photos[0] || room.coverPhoto || "";
  const next: PainRoom = { ...room, id, roomId: id, coverPhoto: cover, photoUrl: cover, imageUrl: cover, photoUrls: room.photos, roomState: "active", cleanupState: "active", stateStatus: "active", alertRead: false, viewedAt: "", createdAt: room.createdAt || now, updatedAt: now, analyzer: intel.analyzer };
  const existing = readPain().filter((x) => x.id !== id);
  let saved = writeJson(MAIN_KEY, [next, ...existing]) && writeJson(LEGACY_ONE, [next, ...existing]) && writeJson(LEGACY_TWO, [next, ...existing]) && writeJson(`vaultforge_pain_room_${id}`, next);
  if (!saved) {
    const slim = { ...next, photos: [], photoUrls: [], coverPhoto: "", photoUrl: "", imageUrl: "" };
    const list = [slim, ...existing.map((x) => ({ ...x, photos: [], photoUrls: [], coverPhoto: "", photoUrl: "", imageUrl: "" }))];
    saved = writeJson(MAIN_KEY, list) && writeJson(LEGACY_ONE, list) && writeJson(LEGACY_TWO, list) && writeJson(`vaultforge_pain_room_${id}`, slim);
  }
  if (!saved) return { ok: false, id: "", message: "Browser storage full. Delete old test photos/rooms." };
  const states = parseJson<Record<string, PainState>>(localStorage.getItem(STATE_KEY), {});
  states[id] = "active";
  writeJson(STATE_KEY, states);
  window.dispatchEvent(new Event("vaultforge-pain-change"));
  window.dispatchEvent(new Event("vaultforge-room-state-change"));
  window.dispatchEvent(new Event("vaultforge-alert-change"));
  return { ok: true, id, message: "Pain saved." };
}

async function compressImage(file: File, maxWidth = 620, quality = 0.42): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader(); reader.onerror = () => resolve("");
    reader.onload = () => { const img = new Image(); img.onerror = () => resolve(""); img.onload = () => { try { const scale = Math.min(1, maxWidth / img.width); const canvas = document.createElement("canvas"); canvas.width = Math.max(1, Math.round(img.width * scale)); canvas.height = Math.max(1, Math.round(img.height * scale)); const ctx = canvas.getContext("2d"); if (!ctx) return resolve(""); ctx.drawImage(img, 0, 0, canvas.width, canvas.height); resolve(canvas.toDataURL("image/jpeg", quality)); } catch { resolve(""); } }; img.src = String(reader.result || ""); };
    reader.readAsDataURL(file);
  });
}
async function photosFromFiles(files: FileList | null) { const out: string[] = []; for (const file of Array.from(files || []).slice(0, 10)) { const img = await compressImage(file); if (img) out.push(img); } return out; }

const page: React.CSSProperties = { minHeight: "100vh", background: "#05070d", color: "#f7f7fb", padding: 18, fontFamily: "Inter, ui-sans-serif, system-ui" };
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

function Nav() { return <nav style={nav}><div style={brand}>VAULTFORGE</div><Link href="/command" style={btn}>Command</Link>
      <Link href="/my-rooms" style={btn}>My Rooms</Link><Link href="/state-map" style={btn}>State Map</Link><Link href="/network" style={btn}>Network</Link><Link href="/deal-rooms" style={btn}>Deal Rooms</Link><Link href="/pain-rooms" style={btn}>Pain Rooms</Link><Link href="/deal-create" style={btn}>Create Deal</Link><Link href="/pain-intake" style={goldBtn}>Pain Intake</Link><Link href="/messages" style={btn}>Messages</Link><Link href="/profile" style={btn}>Profile</Link><Link href="/logout" style={redBtn}>Logout</Link></nav>; }
function Section({ title, children }: { title: string; children: React.ReactNode }) { return <section style={card}><div style={eyebrow}>{title}</div>{children}</section>; }
function stopKeys(e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) { e.stopPropagation(); }
function Field({ title, value, onChange }: { title: string; value: string; onChange: (value: string) => void }) { return <label><div style={label}>{title}</div><input style={input} value={value} onKeyDownCapture={stopKeys} onKeyUpCapture={stopKeys} onChange={(e) => onChange(e.target.value)} /></label>; }
function TextArea({ title, value, onChange }: { title: string; value: string; onChange: (value: string) => void }) { return <label><div style={label}>{title}</div><textarea style={textarea} value={value} onKeyDownCapture={stopKeys} onKeyUpCapture={stopKeys} onChange={(e) => onChange(e.target.value)} /></label>; }
function SelectField({ title, value, options, onChange }: { title: string; value: string; options: string[]; onChange: (value: string) => void }) { return <label><div style={label}>{title}</div><select style={input} value={value} onChange={(e) => onChange(e.target.value)}>{options.map((o) => <option key={o}>{o}</option>)}</select></label>; }
function ChipSet({ title, options, selected, onToggle }: { title: string; options: string[]; selected: string[]; onToggle: (value: string) => void }) { return <div><div style={label}>{title}</div><div style={row}>{options.map((o) => <button key={o} type="button" style={selected.includes(o) ? goldBtn : btn} onClick={() => onToggle(o)}>{o}</button>)}</div></div>; }
function Meter({ title, value }: { title: string; value: number }) { return <div style={panel}><div style={eyebrow}>{title}</div><h2 style={h2}>{value}%</h2><div style={{ height: 10, background: "#070a12", borderRadius: 999, overflow: "hidden" }}><div style={{ width: `${value}%`, height: "100%", background: "#ffdc68" }} /></div></div>; }

export default function PainIntakePage() {
  const [form, setForm] = useState<PainRoom>(() => defaultPain());
  const [banner, setBanner] = useState(""); const [error, setError] = useState(""); const [savedId, setSavedId] = useState(""); const [saving, setSaving] = useState(false);
  const propertyTypes = useMemo(() => propertyTypesFor(form.assetClass), [form.assetClass]);
  const intel = useMemo(() => painIntel(form), [form]);
  function update(key: keyof PainRoom, value: any) { setForm({ ...form, [key]: value }); }
  function toggle(key: keyof PainRoom, value: string) { const set = new Set(safeList(form[key])); set.has(value) ? set.delete(value) : set.add(value); update(key, Array.from(set)); }
  function setAsset(asset: string) { const types = propertyTypesFor(asset); setForm({ ...form, assetClass: asset as AssetClass, propertyType: types[0] || "" }); }
  function setCity(city: string) { setForm({ ...form, city, county: countyFromCity(city) || form.county }); }
  async function addPhotos(files: FileList | null) { const next = await photosFromFiles(files); setForm({ ...form, photos: [...form.photos, ...next].slice(0, 10), coverPhoto: form.coverPhoto || next[0] || "" }); }
  function removePhoto(index: number) { const next = form.photos.filter((_, i) => i !== index); setForm({ ...form, photos: next, coverPhoto: next[0] || "" }); }
  function save() {
    setSaving(true); setError(""); setBanner(""); setSavedId("");
    try {
      if (!safeText(form.title)) { setError("Add a pain room title before saving."); return; }
      if (!form.painTypes.length) { setError("Pick at least one pain type."); return; }
      const result = savePain(form);
      if (!result.ok) { setError(result.message); return; }
      setSavedId(result.id); setBanner("Pain room saved. Open Room verifies the pressure room.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally { setSaving(false); }
  }
  const has = (name: string) => form.painTypes.includes(name);

  return (
    <main style={page}><div style={wrap}><Nav />
      <section style={sticky}><div style={row}><button type="button" style={goldBtn} onClick={save} disabled={saving}>{saving ? "Saving..." : "Save Pain Room"}</button>{savedId ? <Link href={`/pain-rooms/${encodeURIComponent(savedId)}`} style={goldBtn}>Open Saved Room</Link> : null}<span style={muted}>{safeText(form.title, "No title yet")} • {form.severity} • {locationFor(form)}</span></div></section>
      {banner ? <section style={activePanel}><div style={eyebrow}>Saved</div><h2 style={h2}>{banner}</h2><div style={{ ...row, marginTop: 18 }}><Link href={`/pain-rooms/${encodeURIComponent(savedId)}`} style={goldBtn}>Open Room</Link><button type="button" style={btn} onClick={() => { setBanner(""); setSavedId(""); setForm(defaultPain()); }}>Create Another</button></div></section> : null}
      {error ? <section style={activePanel}><div style={eyebrow}>Error</div><h2 style={h2}>{error}</h2></section> : null}
      <section style={intel.severity >= 80 ? dangerHero : hero}><div style={eyebrow}>Smart Pain Intake</div><h1 style={h1}>Adaptive pressure form.</h1><p style={sub}>Select the pain type and the form reveals the facts needed to route the problem intelligently.</p></section>
      <Section title="AI Pressure Preview"><div style={grid}><Meter title="Severity" value={intel.severity} /><Meter title="Capital Need" value={intel.capitalScore} /><Meter title="Difficulty" value={intel.difficulty} /><div style={panel}><div style={eyebrow}>Next Move</div><p style={sub}>{intel.next}</p><p style={muted}>{intel.signal}</p></div></div></Section>
      <Section title="Pain Type"><ChipSet title="Select all that apply" options={PAIN_TYPES} selected={form.painTypes} onToggle={(v) => toggle("painTypes", v)} /></Section>
      <Section title="Routing Needs"><ChipSet title="Who is needed" options={NEEDS} selected={form.needs} onToggle={(v) => toggle("needs", v)} /></Section>
      <Section title="Asset + Market"><ChipSet title="Asset Class" options={ASSETS} selected={[form.assetClass]} onToggle={setAsset} /><div style={{ height: 18 }} /><div style={grid}><Field title="Pain Room Title" value={form.title} onChange={(v) => update("title", v)} /><SelectField title="State" value={form.state} options={STATES} onChange={(v) => update("state", v)} /><Field title="City" value={form.city} onChange={setCity} /><Field title="County" value={form.county} onChange={(v) => update("county", v)} /><Field title="Address / Location" value={form.address} onChange={(v) => update("address", v)} /><SelectField title="Property Type" value={form.propertyType} options={propertyTypes} onChange={(v) => update("propertyType", v)} /></div></Section>
      <Section title="Severity + Pressure"><div style={grid}><SelectField title="Severity" value={form.severity} options={SEVERITY} onChange={(v) => update("severity", v)} /><SelectField title="Time Pressure" value={form.timePressure} options={TIME} onChange={(v) => update("timePressure", v)} /><SelectField title="Capital Pressure" value={form.capitalPressure} options={CAPITAL} onChange={(v) => update("capitalPressure", v)} /><SelectField title="Control Status" value={form.controlStatus} options={CONTROL} onChange={(v) => update("controlStatus", v)} /><SelectField title="Best Contact" value={form.bestContact} options={CONTACT} onChange={(v) => update("bestContact", v)} /></div></Section>
      <Section title="Blockers + Risk"><ChipSet title="Blockers" options={BLOCKERS} selected={form.blockers} onToggle={(v) => toggle("blockers", v)} /><div style={{ height: 18 }} /><ChipSet title="Risk" options={RISKS} selected={form.risks} onToggle={(v) => toggle("risks", v)} /></Section>
      {has("Foreclosure") || has("Tax Sale Risk") ? <Section title="Foreclosure / Tax Sale Facts"><div style={grid}><Field title="Auction / Sale Date" value={form.foreclosureAuctionDate} onChange={(v) => update("foreclosureAuctionDate", v)} /><Field title="Reinstatement Amount" value={form.reinstatementAmount} onChange={(v) => update("reinstatementAmount", v)} /><Field title="Payoff Amount" value={form.payoffAmount} onChange={(v) => update("payoffAmount", v)} /><Field title="Lender / Servicer" value={form.lenderName} onChange={(v) => update("lenderName", v)} /><SelectField title="Bankruptcy Filed" value={form.bankruptcyFiled} options={YESNO} onChange={(v) => update("bankruptcyFiled", v)} /></div></Section> : null}
      {has("Funding Gap") || has("Burn Rate") || has("Lender Problem") ? <Section title="Funding Gap Facts"><div style={grid}><Field title="Amount Needed" value={form.fundingAmountNeeded} onChange={(v) => update("fundingAmountNeeded", v)} /><Field title="Use Of Funds" value={form.useOfFunds} onChange={(v) => update("useOfFunds", v)} /><SelectField title="Collateral Available" value={form.collateralAvailable} options={YESNO} onChange={(v) => update("collateralAvailable", v)} /><Field title="Current Debt" value={form.currentDebt} onChange={(v) => update("currentDebt", v)} /></div></Section> : null}
      {has("Stalled Construction") || has("Contractor Problem") ? <Section title="Construction Facts"><div style={grid}><Field title="Completion Percent" value={form.completionPercent} onChange={(v) => update("completionPercent", v)} /><SelectField title="Contractor Status" value={form.contractorStatus} options={["Unknown", "Active", "Fired", "Walked Off", "Dispute", "Need Replacement"]} onChange={(v) => update("contractorStatus", v)} /><SelectField title="Permits Expired" value={form.permitsExpired} options={YESNO} onChange={(v) => update("permitsExpired", v)} /><SelectField title="Inspection Failed" value={form.inspectionFailed} options={YESNO} onChange={(v) => update("inspectionFailed", v)} /><Field title="Money Left In Budget" value={form.moneyLeftInBudget} onChange={(v) => update("moneyLeftInBudget", v)} /></div></Section> : null}
      {has("Title Problem") || has("Probate") ? <Section title="Title / Legal Facts"><div style={grid}><SelectField title="Title Issue Type" value={form.titleIssueType} options={["Unknown", "Lien", "Probate", "Missing Heirs", "Ownership Dispute", "Judgment", "Tax Lien"]} onChange={(v) => update("titleIssueType", v)} /><Field title="Lien Amount" value={form.lienAmount} onChange={(v) => update("lienAmount", v)} /><SelectField title="Probate Status" value={form.probateStatus} options={["Unknown", "Not Opened", "Opened", "Needs Attorney", "Ready"]} onChange={(v) => update("probateStatus", v)} /><SelectField title="Missing Heirs" value={form.missingHeirs} options={YESNO} onChange={(v) => update("missingHeirs", v)} /><SelectField title="Ownership Dispute" value={form.ownershipDispute} options={YESNO} onChange={(v) => update("ownershipDispute", v)} /></div></Section> : null}
      {has("Permit Problem") || has("City Violation") ? <Section title="Permit / City Facts"><div style={grid}><Field title="Violation Type" value={form.violationType} onChange={(v) => update("violationType", v)} /><Field title="City Deadline" value={form.cityDeadline} onChange={(v) => update("cityDeadline", v)} /><Field title="Fine Amount" value={form.fineAmount} onChange={(v) => update("fineAmount", v)} /><SelectField title="Expeditor Needed" value={form.expeditorNeeded} options={YESNO} onChange={(v) => update("expeditorNeeded", v)} /></div></Section> : null}
      {has("Tenant Issue") || has("Squatter Issue") ? <Section title="Tenant / Squatter Facts"><div style={grid}><SelectField title="Tenant Status" value={form.tenantStatusDetail} options={["Unknown", "Paying", "Nonpaying", "Eviction Needed", "Squatter", "Partial Occupancy"]} onChange={(v) => update("tenantStatusDetail", v)} /><Field title="Rent Owed" value={form.rentOwed} onChange={(v) => update("rentOwed", v)} /><SelectField title="Eviction Filed" value={form.evictionFiled} options={YESNO} onChange={(v) => update("evictionFiled", v)} /><SelectField title="Access Problem" value={form.accessProblem} options={YESNO} onChange={(v) => update("accessProblem", v)} /></div></Section> : null}
      {has("Insurance Claim") || has("Fire Damage") ? <Section title="Insurance / Damage Facts"><div style={grid}><Field title="Claim Number" value={form.claimNumber} onChange={(v) => update("claimNumber", v)} /><SelectField title="Adjuster Status" value={form.adjusterStatus} options={["Unknown", "Not Assigned", "Assigned", "Denied", "Approved", "Supplement Needed"]} onChange={(v) => update("adjusterStatus", v)} /><Field title="Damage Type" value={form.damageType} onChange={(v) => update("damageType", v)} /></div></Section> : null}
      <Section title="General Status + Numbers"><div style={grid}><Field title="Current Status" value={form.currentStatus} onChange={(v) => update("currentStatus", v)} /><Field title="Owner / Seller Situation" value={form.ownerSituation} onChange={(v) => update("ownerSituation", v)} /><Field title="Ask Price" value={form.askPrice} onChange={(v) => update("askPrice", v)} /><Field title="Value / ARV" value={form.value} onChange={(v) => update("value", v)} /><Field title="Repairs / Work" value={form.repairs} onChange={(v) => update("repairs", v)} /><Field title="Monthly Burn" value={form.monthlyBurn} onChange={(v) => update("monthlyBurn", v)} /><Field title="Money Needed Now" value={form.moneyNeededNow} onChange={(v) => update("moneyNeededNow", v)} /><Field title="Deadline" value={form.deadline} onChange={(v) => update("deadline", v)} /></div></Section>
      <Section title="Outcome Logic"><div style={grid}><Field title="Root Cause" value={form.rootCause} onChange={(v) => update("rootCause", v)} /><Field title="Best Realistic Outcome" value={form.bestOutcome} onChange={(v) => update("bestOutcome", v)} /><Field title="Worst Case If No Action" value={form.worstCase} onChange={(v) => update("worstCase", v)} /><Field title="Desired Solution" value={form.desiredSolution} onChange={(v) => update("desiredSolution", v)} /></div></Section>
      <Section title="Contact + AI Context"><div style={grid}><Field title="Contact Name" value={form.contactName} onChange={(v) => update("contactName", v)} /><Field title="Phone" value={form.phone} onChange={(v) => update("phone", v)} /><Field title="Email" value={form.email} onChange={(v) => update("email", v)} /><TextArea title="Problem Notes / AI Context" value={form.notes} onChange={(v) => update("notes", v)} /></div></Section>
      <Section title="Photos"><input type="file" multiple accept="image/*" onChange={(e) => addPhotos(e.target.files)} /><p style={muted}>{form.photos.length}/10 selected. First photo becomes cover.</p>{form.photos.length ? <div style={grid}>{form.photos.map((p, i) => <div key={`${p.slice(0, 20)}-${i}`} style={panel}><img src={p} alt={`Pain ${i + 1}`} style={photoStyle} /><button type="button" style={redBtn} onClick={() => removePhoto(i)}>Delete Photo</button></div>)}</div> : null}</Section>
      <Section title="Save"><button type="button" style={goldBtn} onClick={save} disabled={saving}>{saving ? "Saving..." : "Save Pain Room"}</button></Section>
    </div></main>
  );
}
