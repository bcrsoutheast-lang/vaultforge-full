"use client";

import React, { ChangeEvent, useMemo, useState } from "react";
import Link from "next/link";

type AssetClass = "Residential" | "Commercial" | "Land";
type ToastKind = "success" | "error" | "info";

type DealRoom = {
  id: string;
  kind: "deal";
  roomState: "active" | "saved" | "archived" | "deleted";
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
  routedProfiles: RoutedProfile[];
  urgency: string;
  occupancy: string;
  knownIssues: string[];
  access: string;
  docs: string[];
  assignmentFee: string;
  deadline: string;
  notes: string;
  aiRead: string;
  signalSummary: string;
  photoName: string;
  photoUrl: string;
  photoDataUrl: string;
  createdAt: string;
  updatedAt: string;
};

type RoutedProfile = {
  lane: string;
  label: string;
  contactMethod: string;
  reason: string;
  priority: string;
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
const DEAL_KEYS = ["vaultforge_clean_deal_rooms", "vaultforge_deal_rooms", "vaultforge_rooms_deals", "vf_deal_rooms"];

const page: React.CSSProperties = { minHeight: "100vh", background: "#05070d", color: "#f7f7fb", padding: 18, fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" };
const wrap: React.CSSProperties = { maxWidth: 1180, margin: "0 auto", paddingBottom: 80 };
const card: React.CSSProperties = { background: "linear-gradient(180deg,#080d19,#050816)", border: "1px solid rgba(245,197,66,.28)", borderRadius: 26, padding: 28, marginBottom: 22, boxShadow: "0 18px 60px rgba(0,0,0,.3)" };
const eyebrow: React.CSSProperties = { color: "#ffd45a", textTransform: "uppercase", letterSpacing: 8, fontWeight: 950, fontSize: 18, marginBottom: 14 };
const h1: React.CSSProperties = { fontSize: "clamp(40px,7vw,78px)", lineHeight: .92, letterSpacing: -4, margin: "0 0 18px", fontWeight: 950 };
const h2: React.CSSProperties = { fontSize: "clamp(30px,5vw,54px)", lineHeight: 1, letterSpacing: -2, margin: "0 0 18px", fontWeight: 950 };
const sub: React.CSSProperties = { color: "#c9d0dc", fontSize: "clamp(18px,2.6vw,27px)", lineHeight: 1.35, margin: 0 };
const row: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 16, marginTop: 16 };
const input: React.CSSProperties = { width: "100%", boxSizing: "border-box", borderRadius: 18, border: "1px solid rgba(207,216,230,.18)", background: "#121724", color: "#f6f7fb", padding: "17px 18px", fontSize: 16, outline: "none" };
const label: React.CSSProperties = { display: "block", color: "#ffd45a", fontSize: 14, letterSpacing: 2.5, textTransform: "uppercase", fontWeight: 900, marginBottom: 8 };
const chipWrap: React.CSSProperties = { display: "flex", flexWrap: "wrap", gap: 10, marginTop: 12 };
const baseChip: React.CSSProperties = { border: "1px solid rgba(207,216,230,.18)", background: "#171c29", color: "#f9fbff", borderRadius: 999, padding: "12px 16px", fontWeight: 900, cursor: "pointer" };
const activeChip: React.CSSProperties = { ...baseChip, background: "#ffdc68", color: "#111319", borderColor: "#ffdc68" };
const button: React.CSSProperties = { border: 0, borderRadius: 18, padding: "16px 20px", fontWeight: 950, cursor: "pointer", fontSize: 16, textDecoration: "none", display: "inline-flex", alignItems: "center", justifyContent: "center" };
const primaryButton: React.CSSProperties = { ...button, background: "#ffdc68", color: "#111319" };
const darkButton: React.CSSProperties = { ...button, background: "#171c29", color: "#f7f7fb", border: "1px solid rgba(207,216,230,.18)" };

function makeId() {
  return `deal_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function moneyLabel(value: string) {
  const cleaned = String(value || "").replace(/[^0-9.]/g, "");
  if (!cleaned) return "not listed";
  const num = Number(cleaned);
  return Number.isNaN(num) ? value : `$${num.toLocaleString()}`;
}

function toggleValue(values: string[], value: string) {
  const next = values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
  if (value !== "None Known" && next.includes("None Known") && next.length > 1) return next.filter((item) => item !== "None Known");
  return next;
}

async function compressImage(file: File): Promise<{ dataUrl: string; blob: Blob; name: string }> {
  const bitmap = await createImageBitmap(file);
  const maxSide = 950;
  const ratio = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * ratio));
  canvas.height = Math.max(1, Math.round(bitmap.height * ratio));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Photo canvas could not be created.");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => result ? resolve(result) : reject(new Error("Photo compression failed.")), "image/jpeg", 0.66);
  });
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Compressed photo could not be read."));
    reader.readAsDataURL(blob);
  });
  return { dataUrl, blob, name: file.name || "deal-photo.jpg" };
}

async function uploadDealPhoto(blob: Blob, fileName: string, dealId: string): Promise<string> {
  const body = new FormData();
  body.append("file", new File([blob], fileName.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" }));
  body.append("dealId", dealId);
  const response = await fetch("/api/uploads/deal", { method: "POST", body });
  const result = await response.json().catch(() => ({}));
  return result?.ok && result?.url ? String(result.url) : "";
}

function makeRoutedProfiles(routeTo: string[], form: any, assetClass: AssetClass): RoutedProfile[] {
  return routeTo.map((lane) => ({
    lane,
    label: `${lane} profiles in ${form.city || "selected market"}, ${form.state || "state"}`,
    contactMethod: form.bestContact || "VaultForge Message",
    priority: form.urgency === "Critical" || form.urgency.includes("today") || form.urgency.includes("fast") ? "Priority alert" : "Standard alert",
    reason: `AI route: ${assetClass} ${form.city || "market"} deal, ${moneyLabel(form.askingPrice)} ask, ${moneyLabel(form.arv)} value, ${form.urgency || "normal"} urgency, contact by ${form.bestContact || "VaultForge Message"}.`,
  }));
}

export default function DealCreatePage() {
  const [assetClass, setAssetClass] = useState<AssetClass>("Residential");
  const [toast, setToast] = useState({ show: false, kind: "success" as ToastKind, title: "", message: "" });
  const [savedId, setSavedId] = useState("");
  const [saving, setSaving] = useState(false);
  const [photoName, setPhotoName] = useState("");
  const [photoDataUrl, setPhotoDataUrl] = useState("");
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [routeTo, setRouteTo] = useState<string[]>(["Buyer"]);
  const [knownIssues, setKnownIssues] = useState<string[]>(["None Known"]);
  const [docs, setDocs] = useState<string[]>(["Photos"]);
  const [form, setForm] = useState({ title: "", state: "GA", city: "", county: "", address: "", askingPrice: "", arv: "", repairs: "", equitySpread: "", beds: "", baths: "", sqft: "", acres: "", units: "", buildingSize: "", zoning: "", contactName: "", contactPhone: "", contactEmail: "", bestContact: "VaultForge Message", submitterRole: "Owner", urgency: "High", occupancy: "Unknown", access: "Unknown", assignmentFee: "", deadline: "", notes: "" });

  function updateField(name: string, value: string) { setForm((current) => ({ ...current, [name]: value })); }
  function showToast(kind: ToastKind, title: string, message: string) {
    setToast({ show: true, kind, title, message });
    window.setTimeout(() => setToast({ show: false, kind: "success", title: "", message: "" }), kind === "success" ? 2600 : 5200);
  }

  async function handlePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return showToast("error", "Photo error", "Choose a real image file.");
    try {
      showToast("info", "Preparing photo", "Compressing photo so it can show on the card and inside the room.");
      const compressed = await compressImage(file);
      setPhotoName(compressed.name);
      setPhotoDataUrl(compressed.dataUrl);
      setPhotoBlob(compressed.blob);
      showToast("success", "Photo ready", "Photo is attached. Now save the Deal Room.");
    } catch (error) {
      showToast("error", "Photo error", error instanceof Error ? error.message : "Photo could not be prepared.");
    }
  }

  const aiRead = useMemo(() => {
    const location = [form.city, form.county, form.state].filter(Boolean).join(", ") || "market not listed";
    const assetLine = assetClass === "Residential" ? `${form.beds || "?"} beds / ${form.baths || "?"} baths / ${form.sqft || "?"} sqft` : assetClass === "Commercial" ? `${form.units || "?"} units / ${form.buildingSize || "?"} sqft / zoning ${form.zoning || "not listed"}` : `${form.acres || "?"} acres / zoning ${form.zoning || "not listed"}`;
    return `Market: ${location}. Numbers: ask ${moneyLabel(form.askingPrice)}, ARV/value ${moneyLabel(form.arv)}, repairs/work ${moneyLabel(form.repairs)}. Best contact: ${form.bestContact}. Submitter role: ${form.submitterRole}. Needs routed to: ${routeTo.join(", ") || "not selected"}. Urgency: ${form.urgency}. Occupancy: ${form.occupancy}. Known issues: ${knownIssues.join(", ") || "None Known"}. ${assetClass} asset: ${assetLine}.`;
  }, [assetClass, form, routeTo, knownIssues]);

  function signalSummary() {
    return `${assetClass} signal in ${form.city || "market"}, ${form.county || "county"}, ${form.state}. Potential spread should be reviewed from ARV/value ${moneyLabel(form.arv)}, ask ${moneyLabel(form.askingPrice)}, and repairs/work ${moneyLabel(form.repairs)}. Route to ${routeTo.join(", ") || "selected members"}. Urgency is ${form.urgency}, occupancy is ${form.occupancy}, access is ${form.access}. Known issues: ${knownIssues.join(", ") || "None Known"}. AI next step: automatically alert matched member profiles by state, county, asset fit, contact rules, capital/execution power, and urgency.`;
  }

  function upsertDealEverywhere(deal: DealRoom) {
    for (const key of DEAL_KEYS) {
      const raw = window.localStorage.getItem(key);
      const parsed = raw ? JSON.parse(raw) : [];
      const array = Array.isArray(parsed) ? parsed : [];
      const without = array.filter((item: any) => item?.id !== deal.id);
      window.localStorage.setItem(key, JSON.stringify([deal, ...without]));
    }
    window.localStorage.setItem(`vaultforge_clean_deal_room_${deal.id}`, JSON.stringify(deal));
    window.localStorage.setItem(`vaultforge_deal_room_${deal.id}`, JSON.stringify(deal));
    window.localStorage.setItem(`vf_deal_room_${deal.id}`, JSON.stringify(deal));
  }

  async function saveDeal() {
    if (saving) return;
    if (!form.title.trim()) return showToast("error", "Deal not saved", "Add a deal name/title.");
    if (!form.state.trim() || !form.city.trim()) return showToast("error", "Deal not saved", "Select state and city.");
    if (!form.contactName.trim() && !form.contactPhone.trim() && !form.contactEmail.trim()) return showToast("error", "Deal not saved", "Add at least one contact: name, phone, or email.");
    setSaving(true);
    const id = makeId();
    try {
      let photoUrl = "";
      if (photoBlob) photoUrl = await uploadDealPhoto(photoBlob, photoName || "deal-photo.jpg", id);
      const now = new Date().toISOString();
      const deal: DealRoom = { id, kind: "deal", roomState: "active", assetClass, title: form.title.trim(), state: form.state, city: form.city.trim(), county: form.county.trim(), address: form.address.trim(), askingPrice: form.askingPrice.trim(), arv: form.arv.trim(), repairs: form.repairs.trim(), equitySpread: form.equitySpread.trim(), beds: form.beds.trim(), baths: form.baths.trim(), sqft: form.sqft.trim(), acres: form.acres.trim(), units: form.units.trim(), buildingSize: form.buildingSize.trim(), zoning: form.zoning.trim(), contactName: form.contactName.trim(), contactPhone: form.contactPhone.trim(), contactEmail: form.contactEmail.trim(), bestContact: form.bestContact, submitterRole: form.submitterRole, routeTo, routedProfiles: makeRoutedProfiles(routeTo, form, assetClass), urgency: form.urgency, occupancy: form.occupancy, knownIssues, access: form.access, docs, assignmentFee: form.assignmentFee.trim(), deadline: form.deadline.trim(), notes: form.notes.trim(), aiRead, signalSummary: signalSummary(), photoName, photoUrl, photoDataUrl, createdAt: now, updatedAt: now };
      upsertDealEverywhere(deal);
      setSavedId(id);
      showToast("success", photoUrl || photoDataUrl ? "Deal saved with photo" : "Deal saved", photoUrl ? "Photo uploaded to storage and Deal Room created." : photoDataUrl ? "Photo saved as compressed fallback and Deal Room created." : "Deal Room created. No photo was attached.");
    } catch (error) {
      showToast("error", "Deal not saved", error instanceof Error ? error.message : "Unknown save error.");
    } finally {
      setSaving(false);
    }
  }

  return <main style={page}><div style={wrap}>
    <nav style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 18 }}><Link href="/command" style={darkButton}>Command</Link><Link href="/deal-rooms" style={darkButton}>Deal Rooms</Link><Link href="/pain-intake" style={darkButton}>Pain Intake</Link><Link href="/profile" style={darkButton}>Profile</Link><Link href="/" style={{ ...darkButton, borderColor: "rgba(255,78,78,.45)", color: "#ff9b9b" }}>Exit</Link></nav>
    {toast.show ? <div style={{ position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)", zIndex: 9999, width: "min(92vw,720px)", borderRadius: 20, padding: 16, background: toast.kind === "success" ? "#102818" : toast.kind === "info" ? "#101e34" : "#2b1015", border: toast.kind === "success" ? "1px solid rgba(101,255,151,.5)" : toast.kind === "info" ? "1px solid rgba(116,178,255,.55)" : "1px solid rgba(255,88,88,.55)", boxShadow: "0 18px 70px rgba(0,0,0,.55)" }}><b>{toast.title}</b><div style={{ color: "#dce4ef", marginTop: 4 }}>{toast.message}</div></div> : null}
    <section style={card}><div style={eyebrow}>Deal Opportunity</div><h1 style={h1}>Bloomberg operator intake.</h1><p style={sub}>One clean save creates the card, inside room, signal summary, AI routing profile, and photo display.</p></section>
    <section style={card}><div style={eyebrow}>Asset Class</div><div style={chipWrap}>{(["Residential", "Commercial", "Land"] as AssetClass[]).map((item) => <button key={item} type="button" onClick={() => setAssetClass(item)} style={assetClass === item ? activeChip : baseChip}>{item}</button>)}</div></section>
    <section style={card}><div style={eyebrow}>{assetClass} Form</div>{photoDataUrl ? <img src={photoDataUrl} alt="Deal preview" style={{ width: "100%", maxHeight: 360, objectFit: "cover", borderRadius: 22, border: "1px solid rgba(207,216,230,.2)", marginBottom: 12 }} /> : <div style={{ border: "1px dashed rgba(207,216,230,.25)", borderRadius: 22, padding: 36, color: "#cbd3df", marginBottom: 12 }}>No photo selected yet</div>}<input type="file" accept="image/*" onChange={handlePhoto} />{photoName ? <span style={{ marginLeft: 10, color: "#cbd3df" }}>{photoName}</span> : null}<div style={{ ...card, marginTop: 20, marginBottom: 0, padding: 20 }}><div style={eyebrow}>AI Room Read</div><p style={{ ...sub, fontSize: 18 }}>{aiRead}</p></div><div style={row}><Field name="Deal Name / Title" value={form.title} onChange={(v) => updateField("title", v)} required /><SelectField name="State" value={form.state} options={STATES} onChange={(v) => updateField("state", v)} /><Field name="City" value={form.city} onChange={(v) => updateField("city", v)} required /><Field name="County" value={form.county} onChange={(v) => updateField("county", v)} /><Field name="Ask Price" value={form.askingPrice} onChange={(v) => updateField("askingPrice", v)} /><Field name="ARV / Value" value={form.arv} onChange={(v) => updateField("arv", v)} /><Field name="Repairs / Work" value={form.repairs} onChange={(v) => updateField("repairs", v)} /><Field name="Equity Spread" value={form.equitySpread} onChange={(v) => updateField("equitySpread", v)} />{assetClass === "Residential" ? <><Field name="Beds" value={form.beds} onChange={(v) => updateField("beds", v)} /><Field name="Baths" value={form.baths} onChange={(v) => updateField("baths", v)} /><Field name="Sqft" value={form.sqft} onChange={(v) => updateField("sqft", v)} /></> : null}{assetClass === "Commercial" ? <><Field name="Units" value={form.units} onChange={(v) => updateField("units", v)} /><Field name="Building Size" value={form.buildingSize} onChange={(v) => updateField("buildingSize", v)} /><Field name="Zoning" value={form.zoning} onChange={(v) => updateField("zoning", v)} /></> : null}{assetClass === "Land" ? <><Field name="Acres" value={form.acres} onChange={(v) => updateField("acres", v)} /><Field name="Zoning" value={form.zoning} onChange={(v) => updateField("zoning", v)} /><Field name="Address / Location" value={form.address} onChange={(v) => updateField("address", v)} /></> : null}<TextArea name="AI / Deal Notes" value={form.notes} onChange={(v) => updateField("notes", v)} /></div></section>
    <section style={card}><div style={eyebrow}>Contact + Control</div><div style={row}><Field name="Contact Name" value={form.contactName} onChange={(v) => updateField("contactName", v)} required /><Field name="Phone" value={form.contactPhone} onChange={(v) => updateField("contactPhone", v)} /><Field name="Email" value={form.contactEmail} onChange={(v) => updateField("contactEmail", v)} /><Field name="Assignment Fee / Spread" value={form.assignmentFee} onChange={(v) => updateField("assignmentFee", v)} /><Field name="Deadline / Close Date" value={form.deadline} onChange={(v) => updateField("deadline", v)} /></div><ChoiceSection title="Best Contact" options={CONTACT_OPTIONS} value={form.bestContact} onPick={(v) => updateField("bestContact", v)} /><ChoiceSection title="Submitter Role" options={ROLE_OPTIONS} value={form.submitterRole} onPick={(v) => updateField("submitterRole", v)} /><ChoiceSection title="Urgency" options={URGENCY_OPTIONS} value={form.urgency} onPick={(v) => updateField("urgency", v)} /><ChoiceSection title="Occupancy" options={OCCUPANCY_OPTIONS} value={form.occupancy} onPick={(v) => updateField("occupancy", v)} /><ChoiceSection title="Access" options={ACCESS_OPTIONS} value={form.access} onPick={(v) => updateField("access", v)} /><MultiChoiceSection title="AI Route This To" options={ROUTE_OPTIONS} values={routeTo} onToggle={(v) => setRouteTo((current) => toggleValue(current, v))} /><MultiChoiceSection title="Known Issues" options={ISSUE_OPTIONS} values={knownIssues} onToggle={(v) => setKnownIssues((current) => toggleValue(current, v))} /><MultiChoiceSection title="Available Docs" options={DOC_OPTIONS} values={docs} onToggle={(v) => setDocs((current) => toggleValue(current, v))} /></section>
    <section style={card}><div style={eyebrow}>Save Deal Room</div><h2 style={h2}>Save once. Open once.</h2><p style={{ ...sub, fontSize: 18 }}>Photo is uploaded to storage when available, with compressed fallback if storage is not ready.</p><div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 18 }}><button type="button" onClick={saveDeal} disabled={saving} style={primaryButton}>{saving ? "Saving..." : "Save Deal Room"}</button><Link href="/deal-rooms" style={darkButton}>Open Deal Rooms</Link>{savedId ? <Link href={`/deal-rooms/${savedId}`} style={darkButton}>Open New Room</Link> : null}</div></section>
  </div></main>;
}

function Field({ name, value, onChange, required = false }: { name: string; value: string; onChange: (value: string) => void; required?: boolean }) { return <label><span style={label}>{name}{required ? " *" : ""}</span><input style={input} value={value} onChange={(e) => onChange(e.target.value)} placeholder={name} /></label>; }
function TextArea({ name, value, onChange }: { name: string; value: string; onChange: (value: string) => void }) { return <label><span style={label}>{name}</span><textarea style={{ ...input, minHeight: 132, resize: "vertical" }} value={value} onChange={(e) => onChange(e.target.value)} placeholder={name} /></label>; }
function SelectField({ name, value, options, onChange }: { name: string; value: string; options: string[]; onChange: (value: string) => void }) { return <label><span style={label}>{name}</span><select style={input} value={value} onChange={(e) => onChange(e.target.value)}>{options.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>; }
function ChoiceSection({ title, options, value, onPick }: { title: string; options: string[]; value: string; onPick: (value: string) => void }) { return <div style={{ marginTop: 22 }}><div style={label}>{title}</div><div style={chipWrap}>{options.map((item) => <button key={item} type="button" style={value === item ? activeChip : baseChip} onClick={() => onPick(item)}>{item}</button>)}</div></div>; }
function MultiChoiceSection({ title, options, values, onToggle }: { title: string; options: string[]; values: string[]; onToggle: (value: string) => void }) { return <div style={{ marginTop: 22 }}><div style={label}>{title}</div><div style={chipWrap}>{options.map((item) => <button key={item} type="button" style={values.includes(item) ? activeChip : baseChip} onClick={() => onToggle(item)}>{item}</button>)}</div></div>; }
