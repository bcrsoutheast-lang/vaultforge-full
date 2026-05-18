"use client";

import React, { ChangeEvent, FormEvent, useMemo, useState } from "react";
import Link from "next/link";

type AssetClass = "Residential" | "Commercial" | "Land";
type ToastKind = "success" | "error" | "info";

type Toast = { show: boolean; kind: ToastKind; title: string; message: string };

type DealRoom = {
  id: string;
  kind: "deal";
  roomType: "deal";
  assetClass: AssetClass;
  title: string;
  state: string;
  city: string;
  county: string;
  address: string;
  askingPrice: string;
  arv: string;
  repairs: string;
  equitySpread: string;
  beds: string;
  baths: string;
  sqft: string;
  acres: string;
  units: string;
  buildingSize: string;
  zoning: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  bestContact: string;
  submitterRole: string;
  routeTo: string[];
  urgency: string;
  occupancy: string;
  knownIssues: string[];
  access: string;
  docs: string[];
  assignmentFee: string;
  deadline: string;
  notes: string;
  privateAiNotes: string;
  signalSummary: string;
  aiRead: string;
  capitalNeed: string;
  exitStrategy: string[];
  riskFlags: string[];
  executionNeeds: string[];
  photoUrl: string;
  imageUrl: string;
  photoName: string;
  createdAt: string;
  updatedAt: string;
};

const STATES = ["GA", "TN", "AL", "FL", "NC", "SC", "TX"];
const CONTACT_OPTIONS = ["VaultForge Message", "Phone", "Email", "Text"];
const ROLE_OPTIONS = ["Owner", "Wholesaler", "Agent", "Broker", "Investor", "Operator", "Lender", "Contractor", "Developer"];
const ROUTE_OPTIONS = ["Buyer", "Investor", "Lender", "Operator", "Contractor", "Broker", "JV Partner", "Developer", "Property Manager"];
const URGENCY_OPTIONS = ["Low", "Normal", "High", "Critical", "Need answer today", "Need close fast"];
const OCCUPANCY_OPTIONS = ["Unknown", "Vacant", "Owner Occupied", "Tenant Occupied", "Partially Occupied", "Under Construction"];
const ISSUE_OPTIONS = ["None Known", "Title", "Probate", "Code", "Permits", "Tenant", "Foundation", "Roof", "Fire Damage", "Water Damage", "Funding Gap", "Contractor Problem"];
const ACCESS_OPTIONS = ["Unknown", "Drive By", "Appointment", "Lockbox", "Owner Access", "Tenant Notice Needed", "No Access Yet"];
const DOC_OPTIONS = ["Photos", "CMA", "Appraisal", "Inspection", "Survey", "Lease", "Rent Roll", "Plans", "Permits", "Title Work", "Seller Disclosure"];
const EXIT_OPTIONS = ["Flip", "Buy Hold", "Wholesale", "JV", "Development", "Refinance", "Disposition", "Entitlement", "Rental", "Operator Needed"];
const RISK_OPTIONS = ["Bad Title", "Probate", "Tenant Risk", "No Access", "Permit Issue", "Heavy Rehab", "Funding Gap", "Low Comps", "Fast Deadline", "Unknown Seller Motivation"];
const EXECUTION_OPTIONS = ["Cash Buyer", "Private Lender", "Operator", "Contractor", "Broker", "Property Manager", "Attorney", "Permit Help", "Capital Partner", "Boots On Ground"];

const ROOM_KEYS = ["vaultforge_clean_deal_rooms", "vaultforge_deal_rooms", "vaultforge_rooms_deals", "vf_deal_rooms"];
const emptyToast: Toast = { show: false, kind: "info", title: "", message: "" };

function makeId() {
  return `deal_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function moneyLabel(value: string) {
  const cleaned = String(value || "").replace(/[^0-9.]/g, "");
  if (!cleaned) return "not listed";
  const num = Number(cleaned);
  if (Number.isNaN(num)) return value;
  return `$${num.toLocaleString()}`;
}

function toggleValue(values: string[], value: string) {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

function readArray(key: string): any[] {
  try {
    const raw = window.localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function stripHugePhotoFields(item: any) {
  if (!item || typeof item !== "object") return item;
  const next = { ...item };
  for (const key of ["photoDataUrl", "photo", "imageData", "base64", "previewDataUrl"]) {
    if (typeof next[key] === "string" && next[key].startsWith("data:image/")) next[key] = "";
  }
  return next;
}

function purgeLegacyPhotoPayloads() {
  for (const key of ROOM_KEYS) {
    const rows = readArray(key).map(stripHugePhotoFields);
    try { window.localStorage.setItem(key, JSON.stringify(rows)); } catch {}
  }

  const toFix: string[] = [];
  for (let i = 0; i < window.localStorage.length; i += 1) {
    const key = window.localStorage.key(i) || "";
    if (key.includes("deal_room") || key.includes("deal-room")) toFix.push(key);
  }
  for (const key of toFix) {
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      window.localStorage.setItem(key, JSON.stringify(stripHugePhotoFields(parsed)));
    } catch {}
  }
}

const page: React.CSSProperties = { minHeight: "100vh", background: "#05070d", color: "#f7f7fb", padding: "18px", fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" };
const wrap: React.CSSProperties = { maxWidth: 1180, margin: "0 auto", paddingBottom: 60 };
const card: React.CSSProperties = { background: "linear-gradient(180deg,#080d19,#050816)", border: "1px solid rgba(245,197,66,.28)", borderRadius: 26, padding: 28, marginBottom: 22, boxShadow: "0 18px 60px rgba(0,0,0,.3)" };
const eyebrow: React.CSSProperties = { color: "#ffd45a", textTransform: "uppercase", letterSpacing: 8, fontWeight: 900, fontSize: 20, marginBottom: 14 };
const h1: React.CSSProperties = { fontSize: "clamp(42px,7vw,78px)", lineHeight: .92, letterSpacing: -4, margin: "0 0 18px", fontWeight: 950 };
const sub: React.CSSProperties = { color: "#c9d0dc", fontSize: "clamp(18px,2.6vw,27px)", lineHeight: 1.35, margin: 0 };
const row: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 16, marginTop: 16 };
const input: React.CSSProperties = { width: "100%", boxSizing: "border-box", borderRadius: 18, border: "1px solid rgba(207,216,230,.18)", background: "#121724", color: "#f6f7fb", padding: "17px 18px", fontSize: 16, outline: "none" };
const label: React.CSSProperties = { display: "block", color: "#ffd45a", fontSize: 14, letterSpacing: 2.5, textTransform: "uppercase", fontWeight: 900, marginBottom: 8 };
const chipWrap: React.CSSProperties = { display: "flex", flexWrap: "wrap", gap: 10, marginTop: 12 };
const baseChip: React.CSSProperties = { border: "1px solid rgba(207,216,230,.18)", background: "#171c29", color: "#f9fbff", borderRadius: 999, padding: "12px 16px", fontWeight: 900, cursor: "pointer" };
const activeChip: React.CSSProperties = { ...baseChip, background: "#ffdc68", color: "#111319", borderColor: "#ffdc68" };
const button: React.CSSProperties = { border: 0, borderRadius: 18, padding: "16px 20px", fontWeight: 950, cursor: "pointer", fontSize: 16 };
const primaryButton: React.CSSProperties = { ...button, background: "#ffdc68", color: "#111319" };
const darkButton: React.CSSProperties = { ...button, background: "#171c29", color: "#f7f7fb", border: "1px solid rgba(207,216,230,.18)", textDecoration: "none", display: "inline-block" };

export default function DealCreatePage() {
  const [assetClass, setAssetClass] = useState<AssetClass>("Residential");
  const [toast, setToast] = useState<Toast>(emptyToast);
  const [savedId, setSavedId] = useState("");
  const [saving, setSaving] = useState(false);
  const [photoName, setPhotoName] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [photoUploading, setPhotoUploading] = useState(false);
  const [routeTo, setRouteTo] = useState<string[]>(["Buyer"]);
  const [knownIssues, setKnownIssues] = useState<string[]>(["None Known"]);
  const [docs, setDocs] = useState<string[]>(["Photos"]);
  const [exitStrategy, setExitStrategy] = useState<string[]>(["Flip"]);
  const [riskFlags, setRiskFlags] = useState<string[]>([]);
  const [executionNeeds, setExecutionNeeds] = useState<string[]>(["Cash Buyer"]);

  const [form, setForm] = useState({
    title: "", state: "GA", city: "", county: "", address: "", askingPrice: "", arv: "", repairs: "", equitySpread: "", beds: "", baths: "", sqft: "", acres: "", units: "", buildingSize: "", zoning: "", contactName: "", contactPhone: "", contactEmail: "", bestContact: "VaultForge Message", submitterRole: "Owner", urgency: "High", occupancy: "Unknown", access: "Unknown", assignmentFee: "", deadline: "", capitalNeed: "", notes: "", privateAiNotes: "",
  });

  function updateField(name: string, value: string) { setForm((current) => ({ ...current, [name]: value })); }

  function showToast(kind: ToastKind, title: string, message: string, auto = true) {
    setToast({ show: true, kind, title, message });
    if (auto) window.setTimeout(() => setToast(emptyToast), kind === "success" ? 2600 : 4200);
  }

  async function handlePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { showToast("error", "Photo error", "Please choose an image file."); return; }
    setPhotoUploading(true);
    setPhotoName(file.name);
    setPhotoUrl("");
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/uploads/deal", { method: "POST", body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok || !data?.photoUrl) throw new Error(data?.error || "Photo upload failed.");
      setPhotoUrl(String(data.photoUrl));
      showToast("success", "Photo uploaded", "Photo URL saved for this deal room.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Photo upload failed.";
      showToast("error", "Photo not uploaded", `${message} Deal can still save, but no photo will show until storage is fixed.`, false);
    } finally {
      setPhotoUploading(false);
    }
  }

  const signalSummary = useMemo(() => {
    const location = [form.city, form.county, form.state].filter(Boolean).join(", ") || "market not listed";
    return `${assetClass} deal signal in ${location}. Ask ${moneyLabel(form.askingPrice)}, ARV/value ${moneyLabel(form.arv)}, repairs/work ${moneyLabel(form.repairs)}, urgency ${form.urgency}. Route to ${routeTo.join(", ") || "best-fit members"}.`;
  }, [assetClass, form.city, form.county, form.state, form.askingPrice, form.arv, form.repairs, form.urgency, routeTo]);

  const aiRead = useMemo(() => {
    const assetLine = assetClass === "Residential" ? `${form.beds || "?"} beds / ${form.baths || "?"} baths / ${form.sqft || "?"} sqft` : assetClass === "Commercial" ? `${form.units || "?"} units / ${form.buildingSize || "?"} sqft / zoning ${form.zoning || "not listed"}` : `${form.acres || "?"} acres / zoning ${form.zoning || "not listed"}`;
    return `${signalSummary} Asset facts: ${assetLine}. Exit strategy: ${exitStrategy.join(", ") || "not selected"}. Execution needs: ${executionNeeds.join(", ") || "not selected"}. Risk flags: ${riskFlags.join(", ") || "none selected"}. Known issues: ${knownIssues.join(", ") || "None Known"}. Best contact: ${form.bestContact}.`;
  }, [assetClass, form, signalSummary, exitStrategy, executionNeeds, riskFlags, knownIssues]);

  function buildDeal(): DealRoom {
    const now = new Date().toISOString();
    return {
      id: makeId(), kind: "deal", roomType: "deal", assetClass, title: form.title.trim(), state: form.state, city: form.city.trim(), county: form.county.trim(), address: form.address.trim(), askingPrice: form.askingPrice.trim(), arv: form.arv.trim(), repairs: form.repairs.trim(), equitySpread: form.equitySpread.trim(), beds: form.beds.trim(), baths: form.baths.trim(), sqft: form.sqft.trim(), acres: form.acres.trim(), units: form.units.trim(), buildingSize: form.buildingSize.trim(), zoning: form.zoning.trim(), contactName: form.contactName.trim(), contactPhone: form.contactPhone.trim(), contactEmail: form.contactEmail.trim(), bestContact: form.bestContact, submitterRole: form.submitterRole, routeTo, urgency: form.urgency, occupancy: form.occupancy, knownIssues, access: form.access, docs, assignmentFee: form.assignmentFee.trim(), deadline: form.deadline.trim(), notes: form.notes.trim(), privateAiNotes: form.privateAiNotes.trim(), signalSummary, aiRead, capitalNeed: form.capitalNeed.trim(), exitStrategy, riskFlags, executionNeeds, photoUrl, imageUrl: photoUrl, photoName, createdAt: now, updatedAt: now,
    };
  }

  function writeDealEverywhere(deal: DealRoom) {
    purgeLegacyPhotoPayloads();
    const lightDeal = stripHugePhotoFields(deal);
    for (const key of ROOM_KEYS) {
      const existing = readArray(key).filter((item) => String(item?.id || item?.roomId || item?.dealId || "") !== deal.id).map(stripHugePhotoFields);
      const next = [lightDeal, ...existing].slice(0, 75);
      window.localStorage.setItem(key, JSON.stringify(next));
    }
    window.localStorage.setItem(`vaultforge_clean_deal_room_${deal.id}`, JSON.stringify(lightDeal));
    window.localStorage.setItem(`vaultforge_deal_room_${deal.id}`, JSON.stringify(lightDeal));
    window.dispatchEvent(new Event("vaultforge-deal-change"));
  }

  function saveDeal(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    if (saving || photoUploading) return;
    setSaving(true);
    try {
      if (!form.title.trim()) { showToast("error", "Deal not saved", "Add a deal name or short title before saving."); return; }
      if (!form.state.trim() || !form.city.trim()) { showToast("error", "Deal not saved", "Select a state and add a city before saving."); return; }
      if (!form.contactName.trim() && !form.contactPhone.trim() && !form.contactEmail.trim()) { showToast("error", "Deal not saved", "Add at least one contact field: name, phone, or email."); return; }
      const deal = buildDeal();
      writeDealEverywhere(deal);
      setSavedId(deal.id);
      showToast("success", "Deal saved", photoUrl ? "Deal Room created with photo URL." : "Deal Room created. No photo URL was uploaded.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown save error.";
      showToast("error", "Deal not saved", message.includes("quota") ? "Browser storage was full. Old image blobs were stripped. Try Save again now." : message, false);
      purgeLegacyPhotoPayloads();
    } finally { setSaving(false); }
  }

  return <main style={page}><div style={wrap}>
    <nav style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 18 }}><Link href="/command" style={darkButton}>Command</Link><Link href="/deal-rooms" style={darkButton}>Deal Rooms</Link><Link href="/pain-intake" style={darkButton}>Pain Intake</Link><Link href="/profile" style={darkButton}>Profile</Link><Link href="/" style={{ ...darkButton, borderColor: "rgba(255,78,78,.45)", color: "#ff9b9b" }}>Exit</Link></nav>
    {toast.show ? <div style={{ position: "fixed", top: 18, left: "50%", transform: "translateX(-50%)", zIndex: 9999, width: "min(92vw, 760px)", borderRadius: 20, padding: "16px 18px", background: toast.kind === "success" ? "#102818" : toast.kind === "error" ? "#2b1015" : "#111827", color: "#fff", border: toast.kind === "success" ? "1px solid rgba(101,255,151,.5)" : toast.kind === "error" ? "1px solid rgba(255,88,88,.55)" : "1px solid rgba(255,220,104,.45)", boxShadow: "0 18px 70px rgba(0,0,0,.55)" }}><div style={{ fontWeight: 950, fontSize: 18 }}>{toast.title}</div><div style={{ color: "#dce4ef", marginTop: 4 }}>{toast.message}</div></div> : null}
    <section style={card}><div style={eyebrow}>Deal Opportunity Brain</div><h1 style={h1}>Signal intake that routes capital, operators, and buyers.</h1><p style={sub}>Photos upload to Supabase Storage only. LocalStorage stores metadata and URL only, so quota errors stop.</p></section>
    <form onSubmit={saveDeal}>
      <section style={card}><div style={eyebrow}>Asset Class</div><div style={chipWrap}>{(["Residential", "Commercial", "Land"] as AssetClass[]).map((item) => <button key={item} type="button" onClick={() => setAssetClass(item)} style={assetClass === item ? activeChip : baseChip}>{item}</button>)}</div></section>
      <section style={card}><div style={eyebrow}>{assetClass} Data</div>{photoUrl ? <img src={photoUrl} alt="Deal preview" style={{ width:"100%", maxHeight:360, objectFit:"cover", borderRadius:22, border:"1px solid rgba(207,216,230,.2)", marginBottom:12 }} /> : null}<input type="file" accept="image/*" onChange={handlePhoto} />{photoName ? <span style={{ marginLeft: 10, color: "#cbd3df" }}>{photoUploading ? "Uploading..." : photoUrl ? `Uploaded: ${photoName}` : `Selected: ${photoName}`}</span> : null}<div style={{ ...card, marginTop: 20, marginBottom: 0, padding: 20 }}><div style={eyebrow}>AI Signal Read</div><p style={{ ...sub, fontSize: 18 }}>{aiRead}</p></div><div style={row}><Field name="Deal Name / Title" value={form.title} onChange={(v) => updateField("title", v)} required /><SelectField name="State" value={form.state} options={STATES} onChange={(v) => updateField("state", v)} /><Field name="City" value={form.city} onChange={(v) => updateField("city", v)} required /><Field name="County" value={form.county} onChange={(v) => updateField("county", v)} /><Field name="Address / Location" value={form.address} onChange={(v) => updateField("address", v)} /><Field name="Ask Price" value={form.askingPrice} onChange={(v) => updateField("askingPrice", v)} /><Field name="ARV / Value" value={form.arv} onChange={(v) => updateField("arv", v)} /><Field name="Repairs / Work" value={form.repairs} onChange={(v) => updateField("repairs", v)} /><Field name="Equity Spread" value={form.equitySpread} onChange={(v) => updateField("equitySpread", v)} /><Field name="Capital Need / Gap" value={form.capitalNeed} onChange={(v) => updateField("capitalNeed", v)} />{assetClass === "Residential" ? <><Field name="Beds" value={form.beds} onChange={(v) => updateField("beds", v)} /><Field name="Baths" value={form.baths} onChange={(v) => updateField("baths", v)} /><Field name="Sqft" value={form.sqft} onChange={(v) => updateField("sqft", v)} /></> : null}{assetClass === "Commercial" ? <><Field name="Units" value={form.units} onChange={(v) => updateField("units", v)} /><Field name="Building Size" value={form.buildingSize} onChange={(v) => updateField("buildingSize", v)} /><Field name="Zoning" value={form.zoning} onChange={(v) => updateField("zoning", v)} /></> : null}{assetClass === "Land" ? <><Field name="Acres" value={form.acres} onChange={(v) => updateField("acres", v)} /><Field name="Zoning" value={form.zoning} onChange={(v) => updateField("zoning", v)} /></> : null}<TextArea name="Deal Notes" value={form.notes} onChange={(v) => updateField("notes", v)} /><TextArea name="Private AI Routing Notes" value={form.privateAiNotes} onChange={(v) => updateField("privateAiNotes", v)} /></div></section>
      <section style={card}><div style={eyebrow}>Contact + Routing Brain</div><div style={row}><Field name="Contact Name" value={form.contactName} onChange={(v) => updateField("contactName", v)} required /><Field name="Phone" value={form.contactPhone} onChange={(v) => updateField("contactPhone", v)} /><Field name="Email" value={form.contactEmail} onChange={(v) => updateField("contactEmail", v)} /><Field name="Assignment Fee / Spread" value={form.assignmentFee} onChange={(v) => updateField("assignmentFee", v)} /><Field name="Deadline / Close Date" value={form.deadline} onChange={(v) => updateField("deadline", v)} /></div><ChoiceSection title="Best Contact" options={CONTACT_OPTIONS} value={form.bestContact} onPick={(v) => updateField("bestContact", v)} /><ChoiceSection title="Submitter Role" options={ROLE_OPTIONS} value={form.submitterRole} onPick={(v) => updateField("submitterRole", v)} /><ChoiceSection title="Urgency" options={URGENCY_OPTIONS} value={form.urgency} onPick={(v) => updateField("urgency", v)} /><ChoiceSection title="Occupancy" options={OCCUPANCY_OPTIONS} value={form.occupancy} onPick={(v) => updateField("occupancy", v)} /><ChoiceSection title="Access" options={ACCESS_OPTIONS} value={form.access} onPick={(v) => updateField("access", v)} /><MultiChoiceSection title="Route This To" options={ROUTE_OPTIONS} values={routeTo} onToggle={(v) => setRouteTo((current) => toggleValue(current, v))} /><MultiChoiceSection title="Exit Strategy" options={EXIT_OPTIONS} values={exitStrategy} onToggle={(v) => setExitStrategy((current) => toggleValue(current, v))} /><MultiChoiceSection title="Execution Needs" options={EXECUTION_OPTIONS} values={executionNeeds} onToggle={(v) => setExecutionNeeds((current) => toggleValue(current, v))} /><MultiChoiceSection title="Risk Flags" options={RISK_OPTIONS} values={riskFlags} onToggle={(v) => setRiskFlags((current) => toggleValue(current, v))} /><MultiChoiceSection title="Known Issues" options={ISSUE_OPTIONS} values={knownIssues} onToggle={(v) => setKnownIssues((current) => toggleValue(current, v))} /><MultiChoiceSection title="Available Docs" options={DOC_OPTIONS} values={docs} onToggle={(v) => setDocs((current) => toggleValue(current, v))} /></section>
      <section style={card}><div style={eyebrow}>Save Deal Room</div><p style={{ ...sub, fontSize: 18 }}>This saves URL metadata only. It strips old base64 photos from localStorage before save to prevent quota errors.</p><div style={{ display:"flex", gap:12, flexWrap:"wrap", marginTop:18 }}><button type="submit" disabled={saving || photoUploading} style={primaryButton}>{photoUploading ? "Photo Uploading..." : saving ? "Saving..." : "Save Deal Room"}</button><Link href="/deal-rooms" style={darkButton}>Open Deal Rooms</Link>{savedId ? <Link href={`/deal-rooms/${savedId}`} style={darkButton}>Open New Room</Link> : null}</div></section>
    </form>
  </div></main>;
}

function Field({ name, value, onChange, required = false }: { name: string; value: string; onChange: (value: string) => void; required?: boolean }) { return <label><span style={label}>{name}{required ? " *" : ""}</span><input style={input} value={value} onChange={(e) => onChange(e.target.value)} placeholder={name} /></label>; }
function TextArea({ name, value, onChange }: { name: string; value: string; onChange: (value: string) => void }) { return <label><span style={label}>{name}</span><textarea style={{ ...input, minHeight: 132, resize: "vertical" }} value={value} onChange={(e) => onChange(e.target.value)} placeholder={name} /></label>; }
function SelectField({ name, value, options, onChange }: { name: string; value: string; options: string[]; onChange: (value: string) => void }) { return <label><span style={label}>{name}</span><select style={input} value={value} onChange={(e) => onChange(e.target.value)}>{options.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>; }
function ChoiceSection({ title, options, value, onPick }: { title: string; options: string[]; value: string; onPick: (value: string) => void }) { return <div style={{ marginTop: 22 }}><div style={label}>{title}</div><div style={chipWrap}>{options.map((item) => <button key={item} type="button" style={value === item ? activeChip : baseChip} onClick={() => onPick(item)}>{item}</button>)}</div></div>; }
function MultiChoiceSection({ title, options, values, onToggle }: { title: string; options: string[]; values: string[]; onToggle: (value: string) => void }) { return <div style={{ marginTop: 22 }}><div style={label}>{title}</div><div style={chipWrap}>{options.map((item) => <button key={item} type="button" style={values.includes(item) ? activeChip : baseChip} onClick={() => onToggle(item)}>{item}</button>)}</div></div>; }
