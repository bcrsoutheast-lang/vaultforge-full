"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type DealRoom = {
  id: string;
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
  acres: string;
  zoning: string;
  roadFrontage: string;
  utilities: string;
  entitlementStatus: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  bestContact: string;
  notes: string;
  photos: string[];
  coverPhoto: string;
  roomState: "active" | "saved" | "archived" | "deleted";
  alertRead: boolean;
  viewedAt: string;
  createdAt: string;
  updatedAt: string;
};

const STORE_KEY = "vaultforge_clean_deal_rooms";
const LEGACY_KEYS = ["vaultforge_deal_rooms", "vaultforge_rooms_deals", "vf_deal_rooms"];
const STATES = ["GA", "TN", "AL", "FL", "NC", "SC", "TX"];
const ASSETS = ["Residential", "Commercial", "Land"];
const RES_TYPES = ["Single Family", "Duplex", "Triplex", "Quad", "Townhome", "Condo", "Mobile Home", "Small Multifamily", "Apartment"];
const COM_TYPES = ["Retail", "Office", "Industrial", "Warehouse", "Hotel", "Self Storage", "Mixed Use", "Medical", "Restaurant", "Automotive", "Special Use"];
const LAND_TYPES = ["Infill Lot", "Acreage", "Entitled Land", "Raw Land", "Commercial Pad", "Subdivision", "Timber", "Farm", "Assemblage"];
const STRATEGIES = ["Wholesale", "Flip", "Buy & Hold", "BRRRR", "Development", "Seller Finance", "JV", "Rental", "Hotel Conversion", "Airbnb"];
const ROUTES = ["Buyer", "Lender", "Operator", "Contractor", "Developer", "Attorney", "Capital Partner", "Property Manager"];
const CONDITION = ["Unknown", "Turnkey", "Light Rehab", "Medium Rehab", "Full Gut", "Fire Damage", "Shell", "Tear Down"];
const OCCUPANCY = ["Unknown", "Vacant", "Owner Occupied", "Tenant Occupied", "Squatter", "Partial Vacancy"];
const CONTROL_STATUS = ["Unknown", "Owner Controlled", "Contract Controlled", "Partner Controlled", "Bank Controlled", "Court / Estate", "No Control Yet"];
const TIMELINE = ["24 Hours", "72 Hours", "7 Days", "14 Days", "30 Days", "Flexible"];
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

function ok() {
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

function locationFor(room: Partial<DealRoom>) {
  return [safeText(room.city), safeText(room.county), safeText(room.state)].filter(Boolean).join(", ") || "Market not listed";
}

function defaultDealRoom(): DealRoom {
  const now = new Date().toISOString();
  return {
    id: "",
    title: "",
    state: "GA",
    city: "",
    county: "",
    address: "",
    assetClass: "Residential",
    propertyType: "Single Family",
    strategy: ["Wholesale"],
    routeTo: ["Buyer"],
    condition: "Unknown",
    occupancy: "Unknown",
    controlStatus: "Unknown",
    timeline: "14 Days",
    askingPrice: "",
    propertyValue: "",
    repairs: "",
    beds: "",
    baths: "",
    sqft: "",
    units: "",
    noi: "",
    capRate: "",
    acres: "",
    zoning: "",
    roadFrontage: "",
    utilities: "",
    entitlementStatus: "",
    contactName: "",
    contactPhone: "",
    contactEmail: "",
    bestContact: "VaultForge Message",
    notes: "",
    photos: [],
    coverPhoto: "",
    roomState: "active",
    alertRead: false,
    viewedAt: "",
    createdAt: now,
    updatedAt: now,
  };
}

function readDealRooms(): DealRoom[] {
  if (!ok()) return [];
  const rooms: DealRoom[] = [];
  const seen = new Set<string>();

  for (const key of [STORE_KEY, ...LEGACY_KEYS]) {
    const rows = parseJson<any[]>(localStorage.getItem(key), []);
    for (const row of rows) {
      const id = safeText(row?.id || row?.roomId);
      if (!id || seen.has(id)) continue;
      seen.add(id);
      rooms.push({
        ...defaultDealRoom(),
        ...row,
        id,
        title: safeText(row?.title || row?.name, "Untitled Deal Room"),
        strategy: safeList(row?.strategy).length ? safeList(row?.strategy) : ["Wholesale"],
        routeTo: safeList(row?.routeTo).length ? safeList(row?.routeTo) : ["Buyer"],
        photos: safeList(row?.photos || row?.photoUrls),
        coverPhoto: safeText(row?.coverPhoto || row?.photoUrl || row?.imageUrl || safeList(row?.photos || row?.photoUrls)[0]),
        roomState: safeText(row?.roomState || row?.cleanupState || row?.stateStatus, "active") as DealRoom["roomState"],
      });
    }
  }

  return rooms;
}

function saveDealRoom(room: DealRoom) {
  if (!ok()) return "";
  const id = room.id || `deal_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date().toISOString();
  const coverPhoto = room.photos[0] || room.coverPhoto || "";

  const next: DealRoom = {
    ...room,
    id,
    coverPhoto,
    roomState: "active",
    alertRead: false,
    viewedAt: "",
    createdAt: room.createdAt || now,
    updatedAt: now,
  };

  const existing = readDealRooms().filter((item) => item.id !== id);
  const all = [next, ...existing];

  localStorage.setItem(STORE_KEY, JSON.stringify(all));
  localStorage.setItem(`vaultforge_deal_room_${id}`, JSON.stringify(next));
  window.dispatchEvent(new Event("vaultforge-deal-change"));
  window.dispatchEvent(new Event("vaultforge-room-state-change"));
  return id;
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

async function photosFromFiles(files: FileList | null) {
  const selected = Array.from(files || []).slice(0, 10);
  const output: string[] = [];
  for (const file of selected) {
    const compressed = await compressImage(file);
    if (compressed) output.push(compressed);
  }
  return output;
}

function dealIntelligence(room: DealRoom) {
  const arv = moneyNumber(room.propertyValue);
  const ask = moneyNumber(room.askingPrice);
  const repairs = moneyNumber(room.repairs);
  const spread = arv && ask ? arv - ask - repairs : 0;

  let strength = 40;
  if (spread > 25000) strength += 15;
  if (spread > 75000) strength += 18;
  if (spread > 150000) strength += 15;
  if (room.controlStatus.includes("Controlled")) strength += 10;
  if (room.routeTo.length) strength += 8;
  strength = Math.max(0, Math.min(100, strength));

  const urgency = room.timeline === "24 Hours" || room.timeline === "72 Hours" ? 90 : room.timeline === "7 Days" ? 75 : 45;

  return {
    strength,
    spread,
    urgency,
    banner: strength >= 75 ? "Strong routing opportunity" : strength >= 55 ? "Workable opportunity with missing proof" : "Needs verification before routing",
  };
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
const activePanel: React.CSSProperties = { ...panel, borderColor: "rgba(255,70,70,.70)", boxShadow: "0 0 26px rgba(255,50,70,.22)" };
const eyebrow: React.CSSProperties = { color: "#ffd45a", textTransform: "uppercase", letterSpacing: 7, fontWeight: 950, fontSize: 15, marginBottom: 12 };
const label: React.CSSProperties = { color: "#ffd45a", textTransform: "uppercase", letterSpacing: 4, fontSize: 12, fontWeight: 950, marginBottom: 8 };
const h1: React.CSSProperties = { fontSize: "clamp(44px,8vw,86px)", lineHeight: 0.9, letterSpacing: -4, margin: "0 0 18px", fontWeight: 950 };
const h2: React.CSSProperties = { fontSize: "clamp(30px,5vw,52px)", lineHeight: 0.95, letterSpacing: -2, margin: "0 0 14px", fontWeight: 950 };
const sub: React.CSSProperties = { color: "#c9d0dc", fontSize: 21, lineHeight: 1.35, margin: 0 };
const muted: React.CSSProperties = { color: "#aeb7c7", margin: "8px 0 0", lineHeight: 1.35 };
const grid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(245px,1fr))", gap: 16 };
const row: React.CSSProperties = { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" };
const input: React.CSSProperties = { width: "100%", boxSizing: "border-box", border: "1px solid rgba(207,216,230,.18)", background: "#151b2a", color: "#f8fafc", borderRadius: 18, padding: "15px 16px", fontSize: 16 };
const textarea: React.CSSProperties = { ...input, minHeight: 110, resize: "vertical" };
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
      <Link href="/deal-create" style={goldBtn}>Create Deal</Link>
      <Link href="/pain-intake" style={btn}>Pain Intake</Link>
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

export default function DealCreatePage() {
  const [form, setForm] = useState<DealRoom>(() => defaultDealRoom());
  const [banner, setBanner] = useState("");
  const [error, setError] = useState("");
  const [savedId, setSavedId] = useState("");

  const propertyTypes = useMemo(() => propertyTypesFor(form.assetClass), [form.assetClass]);
  const intelligence = useMemo(() => dealIntelligence(form), [form]);

  function update(key: keyof DealRoom, value: any) {
    setForm({ ...form, [key]: value });
  }

  function toggle(key: keyof DealRoom, value: string) {
    const current = new Set(safeList(form[key]));
    current.has(value) ? current.delete(value) : current.add(value);
    update(key, Array.from(current));
  }

  function setAsset(assetClass: string) {
    const types = propertyTypesFor(assetClass);
    setForm({ ...form, assetClass: assetClass as DealRoom["assetClass"], propertyType: types[0] || "" });
  }

  function setCity(city: string) {
    setForm({ ...form, city, county: countyFromCity(city) || form.county });
  }

  async function addPhotos(files: FileList | null) {
    const next = await photosFromFiles(files);
    setForm({ ...form, photos: [...form.photos, ...next].slice(0, 10), coverPhoto: form.coverPhoto || next[0] || "" });
  }

  function removePhoto(index: number) {
    const next = form.photos.filter((_, photoIndex) => photoIndex !== index);
    setForm({ ...form, photos: next, coverPhoto: next[0] || "" });
  }

  function save() {
    setError("");
    setBanner("");
    setSavedId("");

    if (!safeText(form.title)) {
      setError("Add a deal title before saving.");
      return;
    }

    const id = saveDealRoom({ ...form, coverPhoto: form.photos[0] || form.coverPhoto });
    setSavedId(id);
    setBanner("Deal room saved. Open Room will now go to the real saved deal room.");
  }

  return (
    <main style={page}>
      <div style={wrap}>
        <Nav />

        {banner ? <section style={activePanel}><div style={eyebrow}>Saved</div><h2 style={h2}>{banner}</h2><div style={{ ...row, marginTop: 18 }}><Link href={`/deal-rooms/${encodeURIComponent(savedId)}`} style={goldBtn}>Open Room</Link><button type="button" style={btn} onClick={() => { setBanner(""); setSavedId(""); setForm(defaultDealRoom()); }}>Create Another</button><Link href="/network" style={btn}>Go Network</Link></div></section> : null}
        {error ? <section style={activePanel}><div style={eyebrow}>Error</div><h2 style={h2}>{error}</h2></section> : null}

        <section style={hero}>
          <div style={eyebrow}>Deal Opportunity</div>
          <h1 style={h1}>Create Deal Room</h1>
          <p style={sub}>Adaptive deal intake for Residential, Commercial, and Land with routing, photos, numbers, and AI preview.</p>
        </section>

        <Section title="Live Preview">
          <div style={activePanel}>
            {form.coverPhoto || form.photos[0] ? <img src={form.coverPhoto || form.photos[0]} alt="Deal preview" style={photoStyle} /> : null}
            <div style={eyebrow}>{form.assetClass} • {form.propertyType}</div>
            <h2 style={h2}>{safeText(form.title, "Untitled Deal Room")}</h2>
            <p style={sub}>{locationFor(form)}</p>
            <p style={muted}>AI: {intelligence.banner} • Strength {intelligence.strength}% • Urgency {intelligence.urgency}%</p>
          </div>
        </Section>

        <Section title="Asset + Strategy">
          <ChipSet title="Asset Class" options={ASSETS} selected={[form.assetClass]} onToggle={setAsset} />
          <div style={{ height: 18 }} />
          <ChipSet title="Strategy" options={STRATEGIES} selected={form.strategy} onToggle={(value) => toggle("strategy", value)} />
          <div style={{ height: 18 }} />
          <ChipSet title="Route To" options={ROUTES} selected={form.routeTo} onToggle={(value) => toggle("routeTo", value)} />
        </Section>

        <Section title="Property + Market">
          <div style={grid}>
            <Field title="Deal Title" value={form.title} onChange={(value) => update("title", value)} />
            <SelectField title="State" value={form.state} options={STATES} onChange={(value) => update("state", value)} />
            <Field title="City" value={form.city} onChange={setCity} />
            <Field title="County" value={form.county} onChange={(value) => update("county", value)} />
            <Field title="Address / Location" value={form.address} onChange={(value) => update("address", value)} />
            <SelectField title="Property Type" value={form.propertyType} options={propertyTypes} onChange={(value) => update("propertyType", value)} />
          </div>
        </Section>

        <Section title="Deal Intelligence">
          <div style={grid}>
            <SelectField title="Condition" value={form.condition} options={CONDITION} onChange={(value) => update("condition", value)} />
            <SelectField title="Occupancy" value={form.occupancy} options={OCCUPANCY} onChange={(value) => update("occupancy", value)} />
            <SelectField title="Control Status" value={form.controlStatus} options={CONTROL_STATUS} onChange={(value) => update("controlStatus", value)} />
            <SelectField title="Timeline" value={form.timeline} options={TIMELINE} onChange={(value) => update("timeline", value)} />
            <SelectField title="Best Contact" value={form.bestContact} options={CONTACT} onChange={(value) => update("bestContact", value)} />
          </div>
        </Section>

        <Section title="Numbers">
          <div style={grid}>
            <Field title="Ask Price" value={form.askingPrice} onChange={(value) => update("askingPrice", value)} />
            <Field title="Value / ARV" value={form.propertyValue} onChange={(value) => update("propertyValue", value)} />
            <Field title="Repairs / Work" value={form.repairs} onChange={(value) => update("repairs", value)} />
            {form.assetClass === "Commercial" ? (
              <>
                <Field title="NOI / Income" value={form.noi} onChange={(value) => update("noi", value)} />
                <Field title="Units / Tenants" value={form.units} onChange={(value) => update("units", value)} />
                <Field title="Cap Rate" value={form.capRate} onChange={(value) => update("capRate", value)} />
              </>
            ) : form.assetClass === "Land" ? (
              <>
                <Field title="Acres" value={form.acres} onChange={(value) => update("acres", value)} />
                <Field title="Zoning" value={form.zoning} onChange={(value) => update("zoning", value)} />
                <Field title="Road Frontage" value={form.roadFrontage} onChange={(value) => update("roadFrontage", value)} />
                <Field title="Utilities" value={form.utilities} onChange={(value) => update("utilities", value)} />
                <Field title="Entitlement Status" value={form.entitlementStatus} onChange={(value) => update("entitlementStatus", value)} />
              </>
            ) : (
              <>
                <Field title="Beds" value={form.beds} onChange={(value) => update("beds", value)} />
                <Field title="Baths" value={form.baths} onChange={(value) => update("baths", value)} />
                <Field title="Sqft" value={form.sqft} onChange={(value) => update("sqft", value)} />
              </>
            )}
          </div>
        </Section>

        <Section title="Contact + AI Notes">
          <div style={grid}>
            <Field title="Contact Name" value={form.contactName} onChange={(value) => update("contactName", value)} />
            <Field title="Phone" value={form.contactPhone} onChange={(value) => update("contactPhone", value)} />
            <Field title="Email" value={form.contactEmail} onChange={(value) => update("contactEmail", value)} />
            <TextArea title="Notes / AI Context" value={form.notes} onChange={(value) => update("notes", value)} />
          </div>
        </Section>

        <Section title="Photos">
          <input type="file" multiple accept="image/*" onChange={(event) => addPhotos(event.target.files)} />
          <p style={muted}>{form.photos.length}/10 selected. First photo becomes cover.</p>
          {form.photos.length ? <div style={grid}>{form.photos.map((photo, index) => <div key={`${photo.slice(0, 20)}-${index}`} style={panel}><img src={photo} alt={`Deal ${index + 1}`} style={photoStyle} /><button type="button" style={redBtn} onClick={() => removePhoto(index)}>Delete Photo</button></div>)}</div> : null}
        </Section>

        <Section title="Save">
          <button type="button" style={goldBtn} onClick={save}>Save Deal Room</button>
        </Section>
      </div>
    </main>
  );
}
