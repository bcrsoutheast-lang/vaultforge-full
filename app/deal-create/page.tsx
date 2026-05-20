"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type RoomState = "active" | "saved" | "archived" | "deleted";

type DealRoom = {
  id: string;
  roomId: string;
  title: string;
  state: string;
  city: string;
  county: string;
  address: string;
  assetClass: "Residential" | "Commercial" | "Land";
  propertyType: string;
  strategy: string[];
  routeTo: string[];
  condition: string;
  occupancy: string;
  controlStatus: string;
  timeline: string;
  askingPrice: string;
  propertyValue: string;
  repairs: string;
  beds: string;
  baths: string;
  sqft: string;
  units: string;
  noi: string;
  capRate: string;
  monthlyRent: string;
  leasesInPlace: string;
  tenantQuality: string;
  acres: string;
  zoning: string;
  roadFrontage: string;
  utilities: string;
  entitlementStatus: string;
  surveyAvailable: string;
  soilTest: string;
  topoAvailable: string;
  accessRoad: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  bestContact: string;
  proofStatus: string;
  accessStatus: string;
  titleStatus: string;
  notes: string;
  photos: string[];
  photoUrls: string[];
  coverPhoto: string;
  photoUrl: string;
  imageUrl: string;
  roomState: "active" | "saved" | "archived" | "deleted";
  cleanupState: "active" | "saved" | "archived" | "deleted";
  stateStatus: "active" | "saved" | "archived" | "deleted";
  alertRead: boolean;
  viewedAt: string;
  createdAt: string;
  updatedAt: string;
  analyzer: string;
};

const STORE_KEY = "vaultforge_clean_deal_rooms";
const STATE_KEY = "vaultforge_deal_room_state_v2";
const STATES = ["GA", "TN", "AL", "FL", "NC", "SC", "TX"];
const ASSETS = ["Residential", "Commercial", "Land"];
const RES_TYPES = ["Single Family", "Duplex", "Triplex", "Quad", "Townhome", "Condo", "Mobile Home", "Small Multifamily", "Apartment"];
const COM_TYPES = ["Retail", "Office", "Industrial", "Warehouse", "Hotel", "Self Storage", "Mixed Use", "Medical", "Restaurant", "Automotive", "Special Use"];
const LAND_TYPES = ["Infill Lot", "Acreage", "Entitled Land", "Raw Land", "Commercial Pad", "Subdivision", "Timber", "Farm", "Assemblage"];
const STRATEGIES = ["Wholesale", "Flip", "Buy & Hold", "BRRRR", "Development", "Seller Finance", "JV", "Rental", "Hotel Conversion", "Airbnb"];
const ROUTES = ["Buyer", "Lender", "Operator", "Contractor", "Developer", "Attorney", "Capital Partner", "Property Manager"];
const CONDITION = ["Unknown", "Turnkey", "Light Rehab", "Medium Rehab", "Full Gut", "Fire Damage", "Shell", "Tear Down"];
const OCCUPANCY = ["Unknown", "Vacant", "Owner Occupied", "Tenant Occupied", "Squatter", "Partial Vacancy"];
const CONTROL = ["Unknown", "Owner Controlled", "Contract Controlled", "Partner Controlled", "Bank Controlled", "Court / Estate", "No Control Yet"];
const TIMELINE = ["24 Hours", "72 Hours", "7 Days", "14 Days", "30 Days", "Flexible"];
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
function safeText(value: unknown, fallback = "") { const clean = String(value || "").trim(); return clean || fallback; }
function safeList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  if (typeof value === "string" && value.trim()) return value.split(",").map((item) => item.trim()).filter(Boolean);
  return [];
}
function parseJson<T>(raw: string | null, fallback: T): T { try { return raw ? (JSON.parse(raw) as T) : fallback; } catch { return fallback; } }
function writeJson(key: string, value: unknown) { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; } }
function propertyTypesFor(assetClass: string) { if (assetClass === "Commercial") return COM_TYPES; if (assetClass === "Land") return LAND_TYPES; return RES_TYPES; }
function countyFromCity(city: string) { return CITY_COUNTY[city.trim().toLowerCase().replace(/\s+/g, " ")] || ""; }
function moneyNumber(value: unknown) { const n = Number(String(value || "").replace(/[^0-9.-]/g, "")); return Number.isFinite(n) ? n : 0; }
function locationFor(room: Partial<DealRoom>) { return [safeText(room.city), safeText(room.county), safeText(room.state)].filter(Boolean).join(", ") || "Market not listed"; }

function defaultDeal(): DealRoom {
  const now = new Date().toISOString();
  return {
    id: "", roomId: "", title: "", state: "GA", city: "", county: "", address: "",
    assetClass: "Residential", propertyType: "Single Family", strategy: ["Wholesale"], routeTo: ["Buyer"],
    condition: "Unknown", occupancy: "Unknown", controlStatus: "Unknown", timeline: "14 Days",
    askingPrice: "", propertyValue: "", repairs: "", beds: "", baths: "", sqft: "", units: "", noi: "", capRate: "", monthlyRent: "",
    leasesInPlace: "Unknown", tenantQuality: "Unknown", acres: "", zoning: "", roadFrontage: "", utilities: "Unknown",
    entitlementStatus: "Unknown", surveyAvailable: "Unknown", soilTest: "Unknown", topoAvailable: "Unknown", accessRoad: "Unknown",
    contactName: "", contactPhone: "", contactEmail: "", bestContact: "VaultForge Message", proofStatus: "Unknown",
    accessStatus: "Unknown", titleStatus: "Unknown", notes: "", photos: [], photoUrls: [], coverPhoto: "", photoUrl: "", imageUrl: "",
    roomState: "active", cleanupState: "active", stateStatus: "active", alertRead: false, viewedAt: "", createdAt: now, updatedAt: now, analyzer: "",
  };
}

function readDeals() {
  if (!browserReady()) return [] as DealRoom[];
  const rows = parseJson<any[]>(localStorage.getItem(STORE_KEY), []);
  return rows.map((row) => ({ ...defaultDeal(), ...row, id: safeText(row?.id || row?.roomId), roomId: safeText(row?.id || row?.roomId) })).filter((row) => row.id);
}

function dealIntel(room: DealRoom) {
  const ask = moneyNumber(room.askingPrice);
  const value = moneyNumber(room.propertyValue);
  const repairs = moneyNumber(room.repairs);
  const spread = value && ask ? value - ask - repairs : 0;
  let score = 40;
  if (spread > 25000) score += 12;
  if (spread > 75000) score += 18;
  if (spread > 150000) score += 15;
  if (room.controlStatus.includes("Controlled")) score += 10;
  if (room.proofStatus === "Yes") score += 8;
  if (room.titleStatus === "Clear") score += 8;
  if (room.accessStatus === "Yes") score += 5;
  if (room.assetClass === "Commercial" && moneyNumber(room.noi) > 0) score += 8;
  if (room.assetClass === "Land" && room.entitlementStatus === "Approved") score += 12;
  if (room.condition.includes("Fire") || room.condition.includes("Full Gut")) score -= 10;
  score = Math.max(0, Math.min(100, score));
  const risk = room.condition.includes("Fire") || room.occupancy.includes("Squatter") || room.controlStatus === "No Control Yet" ? 78 : 42;
  const urgency = room.timeline === "24 Hours" || room.timeline === "72 Hours" ? 90 : room.timeline === "7 Days" ? 75 : 45;
  const signal = score >= 75 ? "Strong routing opportunity" : score >= 55 ? "Workable opportunity with missing proof" : "Needs verification before routing";
  const analyzer = `Deal analyzer: ${room.assetClass} ${room.propertyType} in ${locationFor(room)}. Ask ${room.askingPrice || "N/A"}, value ${room.propertyValue || "N/A"}, repairs ${room.repairs || "N/A"}. Signal: ${signal}. Strength ${score}%. Risk ${risk}%. Urgency ${urgency}%. Next move: verify control, title, access, proof, photos, and route to ${room.routeTo.join(", ")}.`;
  return { score, risk, urgency, spread, signal, analyzer };
}

function saveDeal(room: DealRoom) {
  if (!browserReady()) return { ok: false, id: "", message: "Browser storage unavailable." };
  const id = room.id || `deal_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date().toISOString();
  const intel = dealIntel(room);
  const cover = room.photos[0] || room.coverPhoto || "";
  const next: DealRoom = { ...room, id, roomId: id, coverPhoto: cover, photoUrl: cover, imageUrl: cover, photoUrls: room.photos, roomState: "active", cleanupState: "active", stateStatus: "active", alertRead: false, viewedAt: "", createdAt: room.createdAt || now, updatedAt: now, analyzer: intel.analyzer };
  const existing = readDeals().filter((item) => item.id !== id);
  const saved = writeJson(STORE_KEY, [next, ...existing]) && writeJson(`vaultforge_deal_room_${id}`, next);
  if (!saved) {
    const slim = { ...next, photos: [], photoUrls: [], coverPhoto: "", photoUrl: "", imageUrl: "" };
    if (!writeJson(STORE_KEY, [slim, ...existing.map((x) => ({ ...x, photos: [], photoUrls: [], coverPhoto: "", photoUrl: "", imageUrl: "" }))]) || !writeJson(`vaultforge_deal_room_${id}`, slim)) return { ok: false, id: "", message: "Browser storage full. Delete old test photos/rooms." };
  }
  const states = parseJson<Record<string, RoomState>>(localStorage.getItem(STATE_KEY), {});
  states[id] = "active";
  writeJson(STATE_KEY, states);
  window.dispatchEvent(new Event("vaultforge-deal-change"));
  window.dispatchEvent(new Event("vaultforge-room-state-change"));
  return { ok: true, id, message: "Deal saved." };
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
        } catch { resolve(""); }
      };
      img.src = String(reader.result || "");
    };
    reader.readAsDataURL(file);
  });
}
async function photosFromFiles(files: FileList | null) {
  const out: string[] = [];
  for (const file of Array.from(files || []).slice(0, 10)) {
    const img = await compressImage(file);
    if (img) out.push(img);
  }
  return out;
}

const page: React.CSSProperties = { minHeight: "100vh", background: "#05070d", color: "#f7f7fb", padding: 18, fontFamily: "Inter, ui-sans-serif, system-ui" };
const wrap: React.CSSProperties = { maxWidth: 1280, margin: "0 auto", paddingBottom: 120 };
const nav: React.CSSProperties = { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 18 };
const brand: React.CSSProperties = { color: "#ffd45a", fontSize: 27, fontWeight: 950, letterSpacing: -1, marginRight: 10 };
const btn: React.CSSProperties = { border: "1px solid rgba(207,216,230,.18)", background: "#171c29", color: "#f7f7fb", borderRadius: 999, padding: "13px 18px", fontWeight: 950, textDecoration: "none", display: "inline-block", cursor: "pointer" };
const goldBtn: React.CSSProperties = { ...btn, border: 0, background: "#ffdc68", color: "#10131a" };
const redBtn: React.CSSProperties = { ...btn, background: "#271016", borderColor: "rgba(255,70,70,.48)", color: "#ffaaaa" };
const hero: React.CSSProperties = { border: "1px solid rgba(245,197,66,.28)", borderRadius: 28, padding: 30, marginBottom: 20, background: "radial-gradient(circle at top right, rgba(245,197,66,.16), transparent 32%), linear-gradient(180deg,#080d19,#050816)" };
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
  return <nav style={nav}><div style={brand}>VAULTFORGE</div><Link href="/command" style={btn}>Command</Link>
      <Link href="/my-rooms" style={btn}>My Rooms</Link><Link href="/state-map" style={btn}>State Map</Link><Link href="/network" style={btn}>Network</Link><Link href="/deal-rooms" style={btn}>Deal Rooms</Link><Link href="/pain-rooms" style={btn}>Pain Rooms</Link><Link href="/deal-create" style={goldBtn}>Create Deal</Link><Link href="/pain-intake" style={btn}>Pain Intake</Link><Link href="/messages" style={btn}>Messages</Link><Link href="/profile" style={btn}>Profile</Link><Link href="/logout" style={redBtn}>Logout</Link></nav>;
}
function Section({ title, children }: { title: string; children: React.ReactNode }) { return <section style={card}><div style={eyebrow}>{title}</div>{children}</section>; }
function stopKeys(e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) { e.stopPropagation(); }
function Field({ title, value, onChange }: { title: string; value: string; onChange: (value: string) => void }) { return <label><div style={label}>{title}</div><input style={input} value={value} onKeyDownCapture={stopKeys} onKeyUpCapture={stopKeys} onChange={(e) => onChange(e.target.value)} /></label>; }
function TextArea({ title, value, onChange }: { title: string; value: string; onChange: (value: string) => void }) { return <label><div style={label}>{title}</div><textarea style={textarea} value={value} onKeyDownCapture={stopKeys} onKeyUpCapture={stopKeys} onChange={(e) => onChange(e.target.value)} /></label>; }
function SelectField({ title, value, options, onChange }: { title: string; value: string; options: string[]; onChange: (value: string) => void }) { return <label><div style={label}>{title}</div><select style={input} value={value} onChange={(e) => onChange(e.target.value)}>{options.map((o) => <option key={o}>{o}</option>)}</select></label>; }
function ChipSet({ title, options, selected, onToggle }: { title: string; options: string[]; selected: string[]; onToggle: (value: string) => void }) { return <div><div style={label}>{title}</div><div style={row}>{options.map((o) => <button key={o} type="button" style={selected.includes(o) ? goldBtn : btn} onClick={() => onToggle(o)}>{o}</button>)}</div></div>; }
function Meter({ title, value }: { title: string; value: number }) { return <div style={panel}><div style={eyebrow}>{title}</div><h2 style={h2}>{value}%</h2><div style={{ height: 10, background: "#070a12", borderRadius: 999, overflow: "hidden" }}><div style={{ width: `${value}%`, height: "100%", background: "#ffdc68" }} /></div></div>; }

export default function DealCreatePage() {
  const [form, setForm] = useState<DealRoom>(() => defaultDeal());
  const [banner, setBanner] = useState("");
  const [error, setError] = useState("");
  const [savedId, setSavedId] = useState("");
  const [saving, setSaving] = useState(false);
  const propertyTypes = useMemo(() => propertyTypesFor(form.assetClass), [form.assetClass]);
  const intel = useMemo(() => dealIntel(form), [form]);

  function update(key: keyof DealRoom, value: any) { setForm({ ...form, [key]: value }); }
  function toggle(key: keyof DealRoom, value: string) { const set = new Set(safeList(form[key])); set.has(value) ? set.delete(value) : set.add(value); update(key, Array.from(set)); }
  function setAsset(assetClass: string) { const types = propertyTypesFor(assetClass); setForm({ ...form, assetClass: assetClass as DealRoom["assetClass"], propertyType: types[0] || "" }); }
  function setCity(city: string) { setForm({ ...form, city, county: countyFromCity(city) || form.county }); }
  async function addPhotos(files: FileList | null) { const next = await photosFromFiles(files); setForm({ ...form, photos: [...form.photos, ...next].slice(0, 10), coverPhoto: form.coverPhoto || next[0] || "" }); }
  function removePhoto(index: number) { const next = form.photos.filter((_, i) => i !== index); setForm({ ...form, photos: next, coverPhoto: next[0] || "" }); }
  function save() {
    setSaving(true); setError(""); setBanner(""); setSavedId("");
    try {
      if (!safeText(form.title)) { setError("Add a deal title before saving."); return; }
      const result = saveDeal(form);
      if (!result.ok) { setError(result.message); return; }
      setSavedId(result.id); setBanner("Deal room saved. Open Room verifies the saved opportunity.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally { setSaving(false); }
  }

  return (
    <main style={page}>
      <div style={wrap}>
        <Nav />
        <section style={sticky}><div style={row}><button type="button" style={goldBtn} onClick={save} disabled={saving}>{saving ? "Saving..." : "Save Deal Room"}</button>{savedId ? <Link href={`/deal-rooms/${encodeURIComponent(savedId)}`} style={goldBtn}>Open Saved Room</Link> : null}<span style={muted}>{safeText(form.title, "No title yet")} • {form.assetClass} • {locationFor(form)}</span></div></section>
        {banner ? <section style={activePanel}><div style={eyebrow}>Saved</div><h2 style={h2}>{banner}</h2><div style={{ ...row, marginTop: 18 }}><Link href={`/deal-rooms/${encodeURIComponent(savedId)}`} style={goldBtn}>Open Room</Link><button type="button" style={btn} onClick={() => { setBanner(""); setSavedId(""); setForm(defaultDeal()); }}>Create Another</button></div></section> : null}
        {error ? <section style={activePanel}><div style={eyebrow}>Error</div><h2 style={h2}>{error}</h2></section> : null}
        <section style={hero}><div style={eyebrow}>Smart Deal Intake</div><h1 style={h1}>Adaptive opportunity form.</h1><p style={sub}>Residential, Commercial, and Land now reveal different fields and power the AI deal score.</p></section>
        <Section title="AI Deal Preview"><div style={grid}><Meter title="Deal Strength" value={intel.score} /><Meter title="Risk" value={intel.risk} /><Meter title="Urgency" value={intel.urgency} /><div style={panel}><div style={eyebrow}>Signal</div><p style={sub}>{intel.signal}</p><p style={muted}>Estimated spread: {intel.spread ? `$${intel.spread.toLocaleString()}` : "needs ask/value/repairs"}</p></div></div></Section>
        <Section title="Asset + Strategy"><ChipSet title="Asset Class" options={ASSETS} selected={[form.assetClass]} onToggle={setAsset} /><div style={{ height: 18 }} /><ChipSet title="Strategy" options={STRATEGIES} selected={form.strategy} onToggle={(v) => toggle("strategy", v)} /><div style={{ height: 18 }} /><ChipSet title="Route To" options={ROUTES} selected={form.routeTo} onToggle={(v) => toggle("routeTo", v)} /></Section>
        <Section title="Property + Market"><div style={grid}><Field title="Deal Title" value={form.title} onChange={(v) => update("title", v)} /><SelectField title="State" value={form.state} options={STATES} onChange={(v) => update("state", v)} /><Field title="City" value={form.city} onChange={setCity} /><Field title="County" value={form.county} onChange={(v) => update("county", v)} /><Field title="Address / Location" value={form.address} onChange={(v) => update("address", v)} /><SelectField title="Property Type" value={form.propertyType} options={propertyTypes} onChange={(v) => update("propertyType", v)} /></div></Section>
        <Section title="Deal Control + Proof"><div style={grid}><SelectField title="Condition" value={form.condition} options={CONDITION} onChange={(v) => update("condition", v)} /><SelectField title="Occupancy" value={form.occupancy} options={OCCUPANCY} onChange={(v) => update("occupancy", v)} /><SelectField title="Control Status" value={form.controlStatus} options={CONTROL} onChange={(v) => update("controlStatus", v)} /><SelectField title="Timeline" value={form.timeline} options={TIMELINE} onChange={(v) => update("timeline", v)} /><SelectField title="Proof Available" value={form.proofStatus} options={YESNO} onChange={(v) => update("proofStatus", v)} /><SelectField title="Access Available" value={form.accessStatus} options={YESNO} onChange={(v) => update("accessStatus", v)} /><SelectField title="Title Status" value={form.titleStatus} options={["Unknown", "Clear", "Lien", "Probate", "Dispute", "Needs Review"]} onChange={(v) => update("titleStatus", v)} /></div></Section>
        <Section title="Numbers"><div style={grid}><Field title="Ask Price" value={form.askingPrice} onChange={(v) => update("askingPrice", v)} /><Field title="Value / ARV" value={form.propertyValue} onChange={(v) => update("propertyValue", v)} /><Field title="Repairs / Work" value={form.repairs} onChange={(v) => update("repairs", v)} /></div></Section>
        {form.assetClass === "Residential" ? <Section title="Residential Details"><div style={grid}><Field title="Beds" value={form.beds} onChange={(v) => update("beds", v)} /><Field title="Baths" value={form.baths} onChange={(v) => update("baths", v)} /><Field title="Sqft" value={form.sqft} onChange={(v) => update("sqft", v)} /><Field title="Monthly Rent Estimate" value={form.monthlyRent} onChange={(v) => update("monthlyRent", v)} /></div></Section> : null}
        {form.assetClass === "Commercial" ? <Section title="Commercial Details"><div style={grid}><Field title="NOI / Income" value={form.noi} onChange={(v) => update("noi", v)} /><Field title="Units / Tenants" value={form.units} onChange={(v) => update("units", v)} /><Field title="Cap Rate" value={form.capRate} onChange={(v) => update("capRate", v)} /><SelectField title="Leases In Place" value={form.leasesInPlace} options={YESNO} onChange={(v) => update("leasesInPlace", v)} /><SelectField title="Tenant Quality" value={form.tenantQuality} options={["Unknown", "Strong", "Average", "Weak", "Vacant"]} onChange={(v) => update("tenantQuality", v)} /></div></Section> : null}
        {form.assetClass === "Land" ? <Section title="Land Details"><div style={grid}><Field title="Acres" value={form.acres} onChange={(v) => update("acres", v)} /><Field title="Zoning" value={form.zoning} onChange={(v) => update("zoning", v)} /><Field title="Road Frontage" value={form.roadFrontage} onChange={(v) => update("roadFrontage", v)} /><SelectField title="Utilities" value={form.utilities} options={["Unknown", "Available", "Nearby", "Not Available"]} onChange={(v) => update("utilities", v)} /><SelectField title="Entitlement Status" value={form.entitlementStatus} options={["Unknown", "None", "In Process", "Approved", "Denied"]} onChange={(v) => update("entitlementStatus", v)} /><SelectField title="Survey Available" value={form.surveyAvailable} options={YESNO} onChange={(v) => update("surveyAvailable", v)} /><SelectField title="Soil Test" value={form.soilTest} options={YESNO} onChange={(v) => update("soilTest", v)} /><SelectField title="Topo Available" value={form.topoAvailable} options={YESNO} onChange={(v) => update("topoAvailable", v)} /><SelectField title="Access Road" value={form.accessRoad} options={YESNO} onChange={(v) => update("accessRoad", v)} /></div></Section> : null}
        <Section title="Contact + AI Notes"><div style={grid}><Field title="Contact Name" value={form.contactName} onChange={(v) => update("contactName", v)} /><Field title="Phone" value={form.contactPhone} onChange={(v) => update("contactPhone", v)} /><Field title="Email" value={form.contactEmail} onChange={(v) => update("contactEmail", v)} /><SelectField title="Best Contact" value={form.bestContact} options={CONTACT} onChange={(v) => update("bestContact", v)} /><TextArea title="Notes / AI Context" value={form.notes} onChange={(v) => update("notes", v)} /></div></Section>
        <Section title="Photos"><input type="file" multiple accept="image/*" onChange={(e) => addPhotos(e.target.files)} /><p style={muted}>{form.photos.length}/10 selected. First photo becomes cover.</p>{form.photos.length ? <div style={grid}>{form.photos.map((p, i) => <div key={`${p.slice(0, 20)}-${i}`} style={panel}><img src={p} alt={`Deal ${i + 1}`} style={photoStyle} /><button type="button" style={redBtn} onClick={() => removePhoto(i)}>Delete Photo</button></div>)}</div> : null}</Section>
        <Section title="Save"><button type="button" style={goldBtn} onClick={save} disabled={saving}>{saving ? "Saving..." : "Save Deal Room"}</button></Section>
      </div>
    </main>
  );
}
