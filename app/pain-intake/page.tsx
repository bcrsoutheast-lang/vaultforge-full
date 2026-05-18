"use client";

import React, { ChangeEvent, FormEvent, useMemo, useState } from "react";
import Link from "next/link";

type AssetClass = "Residential" | "Commercial" | "Land";
type ToastKind = "success" | "error" | "info";

type Toast = { show: boolean; kind: ToastKind; title: string; message: string };
type UploadedPhoto = { url: string; path?: string; name?: string };

type PainRoom = {
  id: string;
  kind: "pain";
  title: string;
  assetClass: AssetClass;
  state: string;
  city: string;
  county: string;
  address: string;
  photoUrls: string[];
  photos: UploadedPhoto[];
  painTypes: string[];
  urgency: string[];
  blockers: string[];
  routingNeeds: string[];
  solutionLanes: string[];
  processStage: string[];
  rootCause: string[];
  wasteTypes: string[];
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  bestContact: string;
  ownerRole: string;
  amountNeeded: string;
  propertyValue: string;
  payoff: string;
  arrears: string;
  deadline: string;
  authority: string;
  occupancy: string;
  beds: string;
  baths: string;
  sqft: string;
  units: string;
  buildingSize: string;
  businessType: string;
  acres: string;
  zoning: string;
  utilities: string;
  access: string;
  desiredOutcome: string;
  privateAiNotes: string;
  aiRead: string;
  pressureScore: number;
  createdAt: string;
  updatedAt: string;
};

const STORAGE_KEY = "vaultforge_clean_pain_rooms_v1";
const ROOM_KEY_PREFIX = "vaultforge_clean_pain_room_";
const MAX_PHOTOS = 5;

const STATES = ["GA", "TN", "AL", "FL", "NC", "SC", "TX"];
const PAIN_TYPES = ["Funding Gap", "Stalled Project", "Seller Distress", "Contractor Problem", "Permit Problem", "Title Issue", "Probate", "Tenant Problem", "Foreclosure Risk", "Code Violation", "Partnership Dispute", "Buyer Needed", "Operator Needed", "Lender Needed", "Exit Needed"];
const URGENCY = ["Low", "Medium", "High", "Emergency", "Need answer today", "Need funding fast", "Deadline this week"];
const BLOCKERS = ["Capital", "Permits", "Contractor", "Title", "Probate", "Lender", "Buyer", "Operator", "Tenant", "Code", "Insurance", "Utilities", "Access", "Partner", "Unknown Root Cause"];
const ROUTING = ["Investor", "Lender", "Operator", "Contractor", "Broker", "Attorney", "Property Manager", "JV Partner", "Developer", "Buyer", "Capital Partner", "Boots On Ground"];
const SOLUTION_LANES = ["Stabilize", "Fund", "Sell", "Refinance", "Restructure", "Permit", "Repair", "Replace Contractor", "Find Buyer", "Find Operator", "Legal Review", "Title Cure", "Tenant Plan", "Exit Plan"];
const DMAIC = ["Define", "Measure", "Analyze", "Improve", "Control"];
const ROOT_CAUSES = ["Cash Flow", "Bad Scope", "Bad Contractor", "No Buyer", "No Lender", "Bad Numbers", "Bad Timeline", "Permit Delay", "Title Cloud", "Communication Failure", "Wrong Partner", "Market Shift", "Unknown"];
const WASTE = ["Defects", "Waiting", "Overprocessing", "Inventory", "Motion", "Transportation", "Overproduction", "Unused Talent", "Rework", "Bottleneck"];
const CONTACT = ["VaultForge Message", "Phone", "Email", "Text"];
const OWNER_ROLES = ["Owner", "Investor", "Wholesaler", "Agent", "Broker", "Contractor", "Developer", "Operator", "Lender", "Family Member", "Partner"];
const AUTHORITY = ["Decision Maker", "Needs Partner Approval", "Needs Seller Approval", "Under Contract", "Owner Controlled", "Lender Controlled", "Court/Probate", "Unknown"];
const OCCUPANCY = ["Unknown", "Vacant", "Owner Occupied", "Tenant Occupied", "Partially Occupied", "Under Construction", "Raw Land"];
const ACCESS = ["Unknown", "Drive By", "Appointment", "Lockbox", "Owner Access", "Tenant Notice Needed", "No Access Yet"];

const page: React.CSSProperties = { minHeight: "100vh", background: "#05070d", color: "#f7f7fb", padding: 18, fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" };
const wrap: React.CSSProperties = { maxWidth: 1180, margin: "0 auto", paddingBottom: 70 };
const card: React.CSSProperties = { background: "linear-gradient(180deg,#150808,#070810)", border: "1px solid rgba(255,90,90,.30)", borderRadius: 26, padding: 28, marginBottom: 22, boxShadow: "0 18px 60px rgba(0,0,0,.35)" };
const goldCard: React.CSSProperties = { ...card, background: "linear-gradient(180deg,#080d19,#050816)", border: "1px solid rgba(245,197,66,.28)" };
const eyebrow: React.CSSProperties = { color: "#ffaaaa", textTransform: "uppercase", letterSpacing: 7, fontWeight: 950, fontSize: 15, marginBottom: 14 };
const goldEye: React.CSSProperties = { ...eyebrow, color: "#ffd45a" };
const h1: React.CSSProperties = { fontSize: "clamp(42px,7vw,78px)", lineHeight: .92, letterSpacing: -4, margin: "0 0 18px", fontWeight: 950 };
const h2: React.CSSProperties = { fontSize: "clamp(30px,5vw,50px)", lineHeight: 1, letterSpacing: -2, margin: "0 0 16px", fontWeight: 950 };
const sub: React.CSSProperties = { color: "#c9d0dc", fontSize: 20, lineHeight: 1.38, margin: 0 };
const row: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 16, marginTop: 16 };
const input: React.CSSProperties = { width: "100%", boxSizing: "border-box", borderRadius: 18, border: "1px solid rgba(207,216,230,.18)", background: "#121724", color: "#f6f7fb", padding: "17px 18px", fontSize: 16, outline: "none" };
const label: React.CSSProperties = { display: "block", color: "#ffd45a", fontSize: 13, letterSpacing: 2.5, textTransform: "uppercase", fontWeight: 950, marginBottom: 8 };
const chipWrap: React.CSSProperties = { display: "flex", flexWrap: "wrap", gap: 10, marginTop: 12 };
const chip: React.CSSProperties = { border: "1px solid rgba(207,216,230,.18)", background: "#171c29", color: "#f9fbff", borderRadius: 999, padding: "12px 16px", fontWeight: 900, cursor: "pointer" };
const chipActive: React.CSSProperties = { ...chip, background: "#ffdc68", color: "#111319", borderColor: "#ffdc68" };
const redActive: React.CSSProperties = { ...chip, background: "#ff5b5b", color: "#fff", borderColor: "#ff5b5b" };
const btn: React.CSSProperties = { border: "1px solid rgba(207,216,230,.18)", background: "#171c29", color: "#f7f7fb", borderRadius: 999, padding: "14px 18px", fontWeight: 950, textDecoration: "none", display: "inline-block", cursor: "pointer" };
const goldBtn: React.CSSProperties = { ...btn, border: 0, background: "#ffdc68", color: "#10131a" };
const redBtn: React.CSSProperties = { ...btn, background: "#2b1015", borderColor: "rgba(255,88,88,.55)", color: "#ffb4b4" };

function id() { return `pain_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`; }
function toggle(list: string[], value: string) { return list.includes(value) ? list.filter((item) => item !== value) : [...list, value]; }
function money(value: string) { const clean = value.replace(/[^0-9.]/g, ""); if (!clean) return "not listed"; const n = Number(clean); return Number.isFinite(n) ? `$${n.toLocaleString()}` : value; }
function readRooms(): PainRoom[] { try { const raw = window.localStorage.getItem(STORAGE_KEY); const parsed = raw ? JSON.parse(raw) : []; return Array.isArray(parsed) ? parsed : []; } catch { return []; } }
function pressureScore(form: Record<string, string>, urgency: string[], blockers: string[]) { let score = 40; if (urgency.includes("Emergency")) score += 25; if (urgency.includes("Need answer today")) score += 15; if (urgency.includes("Deadline this week")) score += 10; score += Math.min(20, blockers.length * 3); if (form.deadline.trim()) score += 5; if (form.amountNeeded.trim()) score += 5; return Math.min(99, score); }

export default function PainIntakePage() {
  const [assetClass, setAssetClass] = useState<AssetClass>("Residential");
  const [toast, setToast] = useState<Toast>({ show: false, kind: "info", title: "", message: "" });
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploadedPhotos, setUploadedPhotos] = useState<UploadedPhoto[]>([]);
  const [painTypes, setPainTypes] = useState<string[]>(["Funding Gap"]);
  const [urgency, setUrgency] = useState<string[]>(["High"]);
  const [blockers, setBlockers] = useState<string[]>(["Capital"]);
  const [routingNeeds, setRoutingNeeds] = useState<string[]>(["Lender", "Investor"]);
  const [solutionLanes, setSolutionLanes] = useState<string[]>(["Fund", "Stabilize"]);
  const [processStage, setProcessStage] = useState<string[]>(["Define"]);
  const [rootCause, setRootCause] = useState<string[]>(["Cash Flow"]);
  const [wasteTypes, setWasteTypes] = useState<string[]>(["Waiting"]);
  const [form, setForm] = useState({
    title: "", state: "GA", city: "", county: "", address: "", contactName: "", contactPhone: "", contactEmail: "", bestContact: "VaultForge Message", ownerRole: "Owner", amountNeeded: "", propertyValue: "", payoff: "", arrears: "", deadline: "", authority: "Decision Maker", occupancy: "Unknown", beds: "", baths: "", sqft: "", units: "", buildingSize: "", businessType: "", acres: "", zoning: "", utilities: "", access: "Unknown", desiredOutcome: "", privateAiNotes: "",
  });

  function update(name: string, value: string) { setForm((current) => ({ ...current, [name]: value })); }
  function show(kind: ToastKind, title: string, message: string) { setToast({ show: true, kind, title, message }); if (kind === "success") window.setTimeout(() => setToast({ show: false, kind: "info", title: "", message: "" }), 2600); }

  function choosePhotos(event: ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(event.target.files || []).filter((file) => file.type.startsWith("image/")).slice(0, MAX_PHOTOS);
    setFiles(picked);
    setUploadedPhotos([]);
    Promise.all(picked.map((file) => new Promise<string>((resolve) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result || "")); reader.onerror = () => resolve(""); reader.readAsDataURL(file); }))).then((items) => setPreviews(items.filter(Boolean)));
    if ((event.target.files?.length || 0) > MAX_PHOTOS) show("error", "Photo limit", "Pain Intake accepts up to 5 photos. Only the first 5 were selected.");
  }

  async function uploadPhotos(): Promise<UploadedPhoto[]> {
    if (!files.length) return [];
    const formData = new FormData();
    files.forEach((file) => formData.append("photos", file));
    const response = await fetch("/api/uploads/pain", { method: "POST", body: formData });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data?.ok) throw new Error(String(data?.error || "Pain photos could not be uploaded."));
    const photos = Array.isArray(data.photos) ? data.photos.filter((p: UploadedPhoto) => p?.url) : [];
    setUploadedPhotos(photos);
    return photos;
  }

  const aiRead = useMemo(() => {
    const location = [form.city, form.county, form.state].filter(Boolean).join(", ") || "market not listed";
    const p = pressureScore(form, urgency, blockers);
    const assetLine = assetClass === "Residential" ? `${form.beds || "?"} beds / ${form.baths || "?"} baths / ${form.sqft || "?"} sqft` : assetClass === "Commercial" ? `${form.units || "?"} units / ${form.buildingSize || "?"} sqft / ${form.businessType || "business type not listed"}` : `${form.acres || "?"} acres / zoning ${form.zoning || "not listed"} / utilities ${form.utilities || "unknown"}`;
    return `Pressure ${p}/100. ${assetClass} pain in ${location}. Need: ${money(form.amountNeeded)}. Value: ${money(form.propertyValue)}. Payoff: ${money(form.payoff)}. Pain: ${painTypes.join(", ")}. Blockers: ${blockers.join(", ")}. Route to: ${routingNeeds.join(", ")}. DMAIC stage: ${processStage.join(", ")}. Root cause: ${rootCause.join(", ")}. Asset facts: ${assetLine}. Desired outcome: ${form.desiredOutcome || "not listed"}.`;
  }, [assetClass, form, painTypes, urgency, blockers, routingNeeds, processStage, rootCause]);

  async function savePain(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      if (!form.title.trim()) throw new Error("Add a Pain Room title before saving.");
      if (!form.city.trim() || !form.state.trim()) throw new Error("Add city and state before saving.");
      if (!form.contactName.trim() && !form.contactPhone.trim() && !form.contactEmail.trim()) throw new Error("Add at least one owner contact field.");
      let photos = uploadedPhotos;
      if (files.length && !photos.length) photos = await uploadPhotos();
      const now = new Date().toISOString();
      const room: PainRoom = {
        id: id(), kind: "pain", title: form.title.trim(), assetClass, state: form.state, city: form.city.trim(), county: form.county.trim(), address: form.address.trim(), photoUrls: photos.map((p) => p.url), photos, painTypes, urgency, blockers, routingNeeds, solutionLanes, processStage, rootCause, wasteTypes, contactName: form.contactName.trim(), contactPhone: form.contactPhone.trim(), contactEmail: form.contactEmail.trim(), bestContact: form.bestContact, ownerRole: form.ownerRole, amountNeeded: form.amountNeeded.trim(), propertyValue: form.propertyValue.trim(), payoff: form.payoff.trim(), arrears: form.arrears.trim(), deadline: form.deadline.trim(), authority: form.authority, occupancy: form.occupancy, beds: form.beds.trim(), baths: form.baths.trim(), sqft: form.sqft.trim(), units: form.units.trim(), buildingSize: form.buildingSize.trim(), businessType: form.businessType.trim(), acres: form.acres.trim(), zoning: form.zoning.trim(), utilities: form.utilities.trim(), access: form.access, desiredOutcome: form.desiredOutcome.trim(), privateAiNotes: form.privateAiNotes.trim(), aiRead, pressureScore: pressureScore(form, urgency, blockers), createdAt: now, updatedAt: now,
      };
      const rooms = readRooms().filter((item) => item.id !== room.id);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify([room, ...rooms]));
      window.localStorage.setItem(`${ROOM_KEY_PREFIX}${room.id}`, JSON.stringify(room));
      window.dispatchEvent(new Event("vaultforge-pain-change"));
      setSavedId(room.id);
      show("success", "Pain Room saved", "Solution room created. Open Pain Rooms or open the new room below.");
    } catch (error) {
      show("error", "Pain not saved", error instanceof Error ? error.message : "Unknown save error.");
    } finally { setSaving(false); }
  }

  return <main style={page}><div style={wrap}>
    <nav style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 18 }}><Link href="/command" style={btn}>Command</Link><Link href="/pain-rooms" style={goldBtn}>Pain Rooms</Link><Link href="/deal-create" style={btn}>Deal Create</Link><Link href="/profile" style={btn}>Profile</Link><Link href="/" style={redBtn}>Exit</Link></nav>
    {toast.show ? <div style={{ position: "fixed", top: 18, left: "50%", transform: "translateX(-50%)", zIndex: 9999, width: "min(92vw,720px)", borderRadius: 20, padding: 16, background: toast.kind === "success" ? "#102818" : "#2b1015", border: toast.kind === "success" ? "1px solid rgba(101,255,151,.5)" : "1px solid rgba(255,88,88,.55)", boxShadow: "0 18px 70px rgba(0,0,0,.55)" }}><strong style={{ fontSize: 18 }}>{toast.title}</strong><div style={{ color: "#dce4ef", marginTop: 4 }}>{toast.message}</div></div> : null}
    <section style={card}><div style={eyebrow}>Pain Intake</div><h1 style={h1}>Solution room intake.</h1><p style={sub}>Pain is not a complaint form. It is a Six Sigma / Lean Black Belt solution room: define the problem, measure the pressure, analyze root cause, improve with routing, and control the outcome.</p></section>
    <form onSubmit={savePain}>
      <section style={goldCard}><div style={goldEye}>Asset Class</div><div style={chipWrap}>{(["Residential", "Commercial", "Land"] as AssetClass[]).map((item) => <button key={item} type="button" onClick={() => setAssetClass(item)} style={assetClass === item ? chipActive : chip}>{item}</button>)}</div></section>
      <section style={card}><div style={eyebrow}>Photos — up to 5</div><input type="file" accept="image/*" multiple onChange={choosePhotos} /><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12, marginTop: 16 }}>{previews.map((src, index) => <img key={index} src={src} alt={`Pain photo ${index + 1}`} style={{ width: "100%", height: 150, objectFit: "cover", borderRadius: 18, border: "1px solid rgba(255,255,255,.15)" }} />)}</div>{files.length ? <p style={{ ...sub, fontSize: 16, marginTop: 12 }}>{files.length}/5 photos selected. Photos upload to Supabase Storage; only URLs save to the room.</p> : null}</section>
      <section style={goldCard}><div style={goldEye}>{assetClass} Pain Facts</div><div style={row}><Field name="Pain Room Title" value={form.title} onChange={(v) => update("title", v)} /><Select name="State" value={form.state} options={STATES} onChange={(v) => update("state", v)} /><Field name="City" value={form.city} onChange={(v) => update("city", v)} /><Field name="County" value={form.county} onChange={(v) => update("county", v)} /><Field name="Address / Location" value={form.address} onChange={(v) => update("address", v)} /><Field name="Amount Needed" value={form.amountNeeded} onChange={(v) => update("amountNeeded", v)} /><Field name="Property / Project Value" value={form.propertyValue} onChange={(v) => update("propertyValue", v)} /><Field name="Payoff / Debt" value={form.payoff} onChange={(v) => update("payoff", v)} /><Field name="Arrears / Past Due" value={form.arrears} onChange={(v) => update("arrears", v)} /><Field name="Deadline" value={form.deadline} onChange={(v) => update("deadline", v)} />{assetClass === "Residential" ? <><Field name="Beds" value={form.beds} onChange={(v) => update("beds", v)} /><Field name="Baths" value={form.baths} onChange={(v) => update("baths", v)} /><Field name="Sqft" value={form.sqft} onChange={(v) => update("sqft", v)} /></> : null}{assetClass === "Commercial" ? <><Field name="Units" value={form.units} onChange={(v) => update("units", v)} /><Field name="Building Size" value={form.buildingSize} onChange={(v) => update("buildingSize", v)} /><Field name="Business / Asset Type" value={form.businessType} onChange={(v) => update("businessType", v)} /></> : null}{assetClass === "Land" ? <><Field name="Acres" value={form.acres} onChange={(v) => update("acres", v)} /><Field name="Zoning" value={form.zoning} onChange={(v) => update("zoning", v)} /><Field name="Utilities / Access" value={form.utilities} onChange={(v) => update("utilities", v)} /></> : null}</div></section>
      <section style={card}><div style={eyebrow}>Problem + Routing</div><Multi title="Pain Type" options={PAIN_TYPES} values={painTypes} setValues={setPainTypes} red /><Multi title="Urgency" options={URGENCY} values={urgency} setValues={setUrgency} red /><Multi title="Blockers" options={BLOCKERS} values={blockers} setValues={setBlockers} red /><Multi title="Route Solution To" options={ROUTING} values={routingNeeds} setValues={setRoutingNeeds} /><Multi title="Solution Lane" options={SOLUTION_LANES} values={solutionLanes} setValues={setSolutionLanes} /></section>
      <section style={card}><div style={eyebrow}>Lean / Six Sigma Brain</div><Multi title="DMAIC Stage" options={DMAIC} values={processStage} setValues={setProcessStage} /><Multi title="Likely Root Cause" options={ROOT_CAUSES} values={rootCause} setValues={setRootCause} red /><Multi title="Waste / Bottleneck Type" options={WASTE} values={wasteTypes} setValues={setWasteTypes} red /><div style={row}><Text name="Desired Outcome" value={form.desiredOutcome} onChange={(v) => update("desiredOutcome", v)} /><Text name="Private AI Notes" value={form.privateAiNotes} onChange={(v) => update("privateAiNotes", v)} /></div></section>
      <section style={goldCard}><div style={goldEye}>Owner Contact</div><div style={row}><Field name="Owner / Contact Name" value={form.contactName} onChange={(v) => update("contactName", v)} /><Field name="Phone" value={form.contactPhone} onChange={(v) => update("contactPhone", v)} /><Field name="Email" value={form.contactEmail} onChange={(v) => update("contactEmail", v)} /><Select name="Best Contact" value={form.bestContact} options={CONTACT} onChange={(v) => update("bestContact", v)} /><Select name="Owner Role" value={form.ownerRole} options={OWNER_ROLES} onChange={(v) => update("ownerRole", v)} /><Select name="Authority" value={form.authority} options={AUTHORITY} onChange={(v) => update("authority", v)} /><Select name="Occupancy" value={form.occupancy} options={OCCUPANCY} onChange={(v) => update("occupancy", v)} /><Select name="Access" value={form.access} options={ACCESS} onChange={(v) => update("access", v)} /></div></section>
      <section style={card}><div style={eyebrow}>AI Execution Read</div><h2 style={h2}>Pressure Score: {pressureScore(form, urgency, blockers)}/100</h2><p style={sub}>{aiRead}</p></section>
      <section style={goldCard}><div style={goldEye}>Save Solution Room</div><p style={{ ...sub, fontSize: 18 }}>Save once. Photos upload first, then the room saves with photo URLs only.</p><div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 18 }}><button type="submit" disabled={saving} style={goldBtn}>{saving ? "Saving..." : "Save Pain Room"}</button><Link href="/pain-rooms" style={btn}>Open Pain Rooms</Link>{savedId ? <Link href={`/pain-rooms/${savedId}`} style={btn}>Open New Room</Link> : null}</div></section>
    </form>
  </div></main>;
}

function Field({ name, value, onChange }: { name: string; value: string; onChange: (v: string) => void }) { return <label><span style={label}>{name}</span><input style={input} value={value} onChange={(e) => onChange(e.target.value)} placeholder={name} /></label>; }
function Text({ name, value, onChange }: { name: string; value: string; onChange: (v: string) => void }) { return <label><span style={label}>{name}</span><textarea style={{ ...input, minHeight: 130, resize: "vertical" }} value={value} onChange={(e) => onChange(e.target.value)} placeholder={name} /></label>; }
function Select({ name, value, options, onChange }: { name: string; value: string; options: string[]; onChange: (v: string) => void }) { return <label><span style={label}>{name}</span><select style={input} value={value} onChange={(e) => onChange(e.target.value)}>{options.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>; }
function Multi({ title, options, values, setValues, red = false }: { title: string; options: string[]; values: string[]; setValues: (v: string[]) => void; red?: boolean }) { return <section style={{ marginTop: 22 }}><div style={label}>{title}</div><div style={chipWrap}>{options.map((item) => <button key={item} type="button" onClick={() => setValues(toggle(values, item))} style={values.includes(item) ? (red ? redActive : chipActive) : chip}>{item}</button>)}</div></section>; }
