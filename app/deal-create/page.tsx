"use client";

import React, { ChangeEvent, useMemo, useState } from "react";
import Link from "next/link";

type AssetClass = "Residential" | "Commercial" | "Land";
type ToastKind = "success" | "error";

type Toast = {
  show: boolean;
  kind: ToastKind;
  title: string;
  message: string;
};

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
  aiRead: string;
  signalSummary: string;
  alertedMembers: any[];
  photoName: string;
  photoDataUrl: string;
  imageUrl: string;
  photoUrl: string;
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

const DEAL_LIST_KEYS = [
  "vaultforge_clean_deal_rooms",
  "vaultforge_deal_rooms",
  "vf_deal_rooms",
  "dealRooms",
  "vaultforge_rooms_deal",
];

const emptyToast: Toast = { show: false, kind: "success", title: "", message: "" };

function makeId() {
  return `deal_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function safeText(value: unknown, fallback = "") {
  return String(value || fallback).trim();
}

function moneyLabel(value: string) {
  const cleaned = value.replace(/[^0-9.]/g, "");
  if (!cleaned) return "not listed";
  const num = Number(cleaned);
  if (Number.isNaN(num)) return value;
  return `$${num.toLocaleString()}`;
}

function toggleValue(values: string[], value: string) {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

async function compressImage(file: File): Promise<string> {
  const rawUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Photo could not be read."));
    reader.readAsDataURL(file);
  });

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Photo could not be opened."));
    img.src = rawUrl;
  });

  const maxSide = 900;
  const ratio = Math.min(maxSide / image.width, maxSide / image.height, 1);
  const width = Math.max(1, Math.round(image.width * ratio));
  const height = Math.max(1, Math.round(image.height * ratio));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return rawUrl;
  ctx.drawImage(image, 0, 0, width, height);

  let quality = 0.72;
  let compressed = canvas.toDataURL("image/jpeg", quality);
  while (compressed.length > 650000 && quality > 0.34) {
    quality -= 0.1;
    compressed = canvas.toDataURL("image/jpeg", quality);
  }

  return compressed;
}

function readList(key: string): any[] {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function roomId(value: any) {
  return String(value?.id || value?.roomId || value?.dealId || "");
}

function mergeIntoList(list: any[], deal: DealRoom) {
  const withoutSame = list.filter((item) => roomId(item) !== deal.id);
  return [deal, ...withoutSame].slice(0, 60);
}

function writeDealEverywhere(deal: DealRoom) {
  const compactDeal = { ...deal };
  const individualKeys = [
    `vaultforge_clean_deal_room_${deal.id}`,
    `vaultforge_deal_room_${deal.id}`,
    `vf_deal_room_${deal.id}`,
  ];

  for (const key of DEAL_LIST_KEYS) {
    const next = mergeIntoList(readList(key), compactDeal);
    window.localStorage.setItem(key, JSON.stringify(next));
  }
  for (const key of individualKeys) {
    window.localStorage.setItem(key, JSON.stringify(compactDeal));
  }
}

function writeDealWithoutPhotoEverywhere(deal: DealRoom) {
  const noPhoto = { ...deal, photoDataUrl: "", imageUrl: "", photoUrl: "" };
  for (const key of DEAL_LIST_KEYS) {
    const next = mergeIntoList(readList(key), noPhoto);
    window.localStorage.setItem(key, JSON.stringify(next));
  }
  window.localStorage.setItem(`vaultforge_clean_deal_room_${deal.id}`, JSON.stringify(noPhoto));
}

const page: React.CSSProperties = {
  minHeight: "100vh",
  background: "#05070d",
  color: "#f7f7fb",
  padding: "18px",
  fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
};
const wrap: React.CSSProperties = { maxWidth: 1180, margin: "0 auto", paddingBottom: 80 };
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
const button: React.CSSProperties = { border: 0, borderRadius: 18, padding: "16px 20px", fontWeight: 950, cursor: "pointer", fontSize: 16, textDecoration: "none", display: "inline-flex", alignItems: "center", justifyContent: "center" };
const primaryButton: React.CSSProperties = { ...button, background: "#ffdc68", color: "#111319" };
const darkButton: React.CSSProperties = { ...button, background: "#171c29", color: "#f7f7fb", border: "1px solid rgba(207,216,230,.18)" };

export default function DealCreatePage() {
  const [assetClass, setAssetClass] = useState<AssetClass>("Residential");
  const [toast, setToast] = useState<Toast>(emptyToast);
  const [savedId, setSavedId] = useState("");
  const [saving, setSaving] = useState(false);
  const [photoName, setPhotoName] = useState("");
  const [photoDataUrl, setPhotoDataUrl] = useState("");
  const [photoStatus, setPhotoStatus] = useState("No photo selected.");
  const [routeTo, setRouteTo] = useState<string[]>(["Buyer"]);
  const [knownIssues, setKnownIssues] = useState<string[]>(["None Known"]);
  const [docs, setDocs] = useState<string[]>(["Photos"]);
  const [form, setForm] = useState({
    title: "",
    state: "GA",
    city: "",
    county: "",
    address: "",
    askingPrice: "",
    arv: "",
    repairs: "",
    equitySpread: "",
    beds: "",
    baths: "",
    sqft: "",
    acres: "",
    units: "",
    buildingSize: "",
    zoning: "",
    contactName: "",
    contactPhone: "",
    contactEmail: "",
    bestContact: "VaultForge Message",
    submitterRole: "Owner",
    urgency: "High",
    occupancy: "Unknown",
    access: "Unknown",
    assignmentFee: "",
    deadline: "",
    notes: "",
  });

  function updateField(name: string, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  function showToast(kind: ToastKind, title: string, message: string) {
    setToast({ show: true, kind, title, message });
    window.setTimeout(() => setToast(emptyToast), kind === "success" ? 2600 : 5200);
  }

  async function handlePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("error", "Photo error", "Choose an image file.");
      return;
    }
    setPhotoStatus("Compressing photo for phone-safe save...");
    try {
      const compressed = await compressImage(file);
      setPhotoName(file.name);
      setPhotoDataUrl(compressed);
      setPhotoStatus(`Photo ready: ${file.name}`);
      showToast("success", "Photo ready", "Photo compressed and will be saved into the Deal Room.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Photo could not be prepared.";
      setPhotoStatus(message);
      showToast("error", "Photo error", message);
    }
  }

  const aiRead = useMemo(() => {
    const location = [form.city, form.county, form.state].filter(Boolean).join(", ") || "market not listed";
    const numbers = `ask ${moneyLabel(form.askingPrice)}, ARV/value ${moneyLabel(form.arv)}, repairs/work ${moneyLabel(form.repairs)}`;
    const assetLine = assetClass === "Residential"
      ? `${form.beds || "?"} beds / ${form.baths || "?"} baths / ${form.sqft || "?"} sqft`
      : assetClass === "Commercial"
        ? `${form.units || "?"} units / ${form.buildingSize || "?"} sqft / zoning ${form.zoning || "not listed"}`
        : `${form.acres || "?"} acres / zoning ${form.zoning || "not listed"}`;
    return `Market: ${location}. Numbers: ${numbers}. Best contact: ${form.bestContact}. Submitter role: ${form.submitterRole}. Needs routed to: ${routeTo.join(", ") || "not selected"}. Urgency: ${form.urgency}. Occupancy: ${form.occupancy}. Known issues: ${knownIssues.join(", ") || "None Known"}. ${assetClass} asset: ${assetLine}.`;
  }, [assetClass, form, routeTo, knownIssues]);

  function buildDeal(): DealRoom {
    const now = new Date().toISOString();
    const title = safeText(form.title, `${assetClass} Deal`);
    const signalSummary = `Signal: ${assetClass} in ${[form.city, form.county, form.state].filter(Boolean).join(", ") || "market not listed"}. Ask ${moneyLabel(form.askingPrice)}, value ${moneyLabel(form.arv)}, repairs ${moneyLabel(form.repairs)}. Route to ${routeTo.join(", ") || "not selected"}. Urgency ${form.urgency}. Access ${form.access}. Issues: ${knownIssues.join(", ") || "None Known"}. Docs: ${docs.join(", ") || "not listed"}. AI next step: alert matched member profiles, verify contact/control, confirm numbers, then move qualified buyers/operators/lenders into Messages.`;
    return {
      id: makeId(),
      kind: "deal",
      roomType: "deal",
      assetClass,
      title,
      state: safeText(form.state),
      city: safeText(form.city),
      county: safeText(form.county),
      address: safeText(form.address),
      askingPrice: safeText(form.askingPrice),
      arv: safeText(form.arv),
      repairs: safeText(form.repairs),
      equitySpread: safeText(form.equitySpread),
      beds: safeText(form.beds),
      baths: safeText(form.baths),
      sqft: safeText(form.sqft),
      acres: safeText(form.acres),
      units: safeText(form.units),
      buildingSize: safeText(form.buildingSize),
      zoning: safeText(form.zoning),
      contactName: safeText(form.contactName),
      contactPhone: safeText(form.contactPhone),
      contactEmail: safeText(form.contactEmail),
      bestContact: form.bestContact,
      submitterRole: form.submitterRole,
      routeTo: [...routeTo],
      urgency: form.urgency,
      occupancy: form.occupancy,
      knownIssues: [...knownIssues],
      access: form.access,
      docs: [...docs],
      assignmentFee: safeText(form.assignmentFee),
      deadline: safeText(form.deadline),
      notes: safeText(form.notes),
      aiRead,
      signalSummary,
      alertedMembers: [],
      photoName,
      photoDataUrl,
      imageUrl: photoDataUrl,
      photoUrl: photoDataUrl,
      createdAt: now,
      updatedAt: now,
    };
  }

  function validateDeal() {
    if (!form.title.trim()) return "Add a deal name/title.";
    if (!form.state.trim() || !form.city.trim()) return "Select state and add city.";
    if (!form.contactName.trim() && !form.contactPhone.trim() && !form.contactEmail.trim()) return "Add at least one contact field: name, phone, or email.";
    return "";
  }

  function saveDeal() {
    if (saving) return;
    setSaving(true);
    try {
      const validation = validateDeal();
      if (validation) {
        showToast("error", "Deal not saved", validation);
        return;
      }
      const deal = buildDeal();
      try {
        writeDealEverywhere(deal);
      } catch (error) {
        if (photoDataUrl) {
          writeDealWithoutPhotoEverywhere(deal);
          setSavedId(deal.id);
          showToast("error", "Deal saved without photo", "Browser storage rejected the photo. Deal saved. Open Deal Rooms now. Supabase photo storage is needed for production photos.");
          return;
        }
        throw error;
      }
      setSavedId(deal.id);
      showToast("success", "Deal saved", photoDataUrl ? "Deal Room created with photo. Open Deal Rooms now." : "Deal Room created. No photo was selected.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown save error.";
      showToast("error", "Deal not saved", message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main style={page}>
      <div style={wrap}>
        <nav style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 18 }}>
          <Link href="/command" style={darkButton}>Command</Link>
          <Link href="/deal-rooms" style={darkButton}>Deal Rooms</Link>
          <Link href="/pain-intake" style={darkButton}>Pain Intake</Link>
          <Link href="/profile" style={darkButton}>Profile</Link>
          <Link href="/" style={{ ...darkButton, borderColor: "rgba(255,78,78,.45)", color: "#ff9b9b" }}>Exit</Link>
        </nav>

        {toast.show ? (
          <div style={{
            position: "fixed",
            top: 18,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 9999,
            width: "min(92vw, 720px)",
            borderRadius: 20,
            padding: "16px 18px",
            background: toast.kind === "success" ? "#102818" : "#2b1015",
            color: "#fff",
            border: toast.kind === "success" ? "1px solid rgba(101,255,151,.5)" : "1px solid rgba(255,88,88,.55)",
            boxShadow: "0 18px 70px rgba(0,0,0,.55)",
          }}>
            <div style={{ fontWeight: 950, fontSize: 18 }}>{toast.title}</div>
            <div style={{ color: "#dce4ef", marginTop: 4 }}>{toast.message}</div>
          </div>
        ) : null}

        <section style={card}>
          <div style={eyebrow}>Deal Opportunity</div>
          <h1 style={h1}>Bloomberg operator intake.</h1>
          <p style={sub}>Residential, Commercial, and Land intake with contact controls, member routing, urgency, access, issues, phone-safe photo compression, and AI-ready room data.</p>
        </section>

        <section style={card}>
          <div style={eyebrow}>Asset Class</div>
          <div style={chipWrap}>{(["Residential", "Commercial", "Land"] as AssetClass[]).map((item) => <button key={item} type="button" onClick={() => setAssetClass(item)} style={assetClass === item ? activeChip : baseChip}>{item}</button>)}</div>
        </section>

        <section style={card}>
          <div style={eyebrow}>{assetClass} Form</div>
          {photoDataUrl ? <img src={photoDataUrl} alt="Deal preview" style={{ width: "100%", maxHeight: 360, objectFit: "cover", borderRadius: 22, border: "1px solid rgba(207,216,230,.2)", marginBottom: 12 }} /> : <div style={{ border: "1px dashed rgba(207,216,230,.22)", borderRadius: 22, padding: 34, color: "#cbd3df", marginBottom: 12 }}>No photo selected yet.</div>}
          <input type="file" accept="image/*" onChange={handlePhoto} />
          <div style={{ color: "#cbd3df", marginTop: 10 }}>{photoStatus}</div>

          <div style={{ ...card, marginTop: 20, marginBottom: 0, padding: 20 }}>
            <div style={eyebrow}>AI Room Read</div>
            <p style={{ ...sub, fontSize: 18 }}>{aiRead}</p>
          </div>

          <div style={row}>
            <Field name="Deal Name / Title" value={form.title} onChange={(v) => updateField("title", v)} required />
            <SelectField name="State" value={form.state} options={STATES} onChange={(v) => updateField("state", v)} />
            <Field name="City" value={form.city} onChange={(v) => updateField("city", v)} required />
            <Field name="County" value={form.county} onChange={(v) => updateField("county", v)} />
            <Field name="Ask Price" value={form.askingPrice} onChange={(v) => updateField("askingPrice", v)} />
            <Field name="ARV / Value" value={form.arv} onChange={(v) => updateField("arv", v)} />
            <Field name="Repairs / Work" value={form.repairs} onChange={(v) => updateField("repairs", v)} />
            <Field name="Equity Spread" value={form.equitySpread} onChange={(v) => updateField("equitySpread", v)} />
            {assetClass === "Residential" ? <><Field name="Beds" value={form.beds} onChange={(v) => updateField("beds", v)} /><Field name="Baths" value={form.baths} onChange={(v) => updateField("baths", v)} /><Field name="Sqft" value={form.sqft} onChange={(v) => updateField("sqft", v)} /></> : null}
            {assetClass === "Commercial" ? <><Field name="Units" value={form.units} onChange={(v) => updateField("units", v)} /><Field name="Building Size" value={form.buildingSize} onChange={(v) => updateField("buildingSize", v)} /><Field name="Zoning" value={form.zoning} onChange={(v) => updateField("zoning", v)} /></> : null}
            {assetClass === "Land" ? <><Field name="Acres" value={form.acres} onChange={(v) => updateField("acres", v)} /><Field name="Zoning" value={form.zoning} onChange={(v) => updateField("zoning", v)} /><Field name="Address / Location" value={form.address} onChange={(v) => updateField("address", v)} /></> : null}
            <TextArea name="AI / Deal Notes" value={form.notes} onChange={(v) => updateField("notes", v)} />
          </div>
        </section>

        <section style={card}>
          <div style={eyebrow}>Contact + Control</div>
          <div style={row}>
            <Field name="Contact Name" value={form.contactName} onChange={(v) => updateField("contactName", v)} required />
            <Field name="Phone" value={form.contactPhone} onChange={(v) => updateField("contactPhone", v)} />
            <Field name="Email" value={form.contactEmail} onChange={(v) => updateField("contactEmail", v)} />
            <Field name="Assignment Fee / Spread" value={form.assignmentFee} onChange={(v) => updateField("assignmentFee", v)} />
            <Field name="Deadline / Close Date" value={form.deadline} onChange={(v) => updateField("deadline", v)} />
          </div>
          <ChoiceSection title="Best Contact" options={CONTACT_OPTIONS} value={form.bestContact} onPick={(v) => updateField("bestContact", v)} />
          <ChoiceSection title="Submitter Role" options={ROLE_OPTIONS} value={form.submitterRole} onPick={(v) => updateField("submitterRole", v)} />
          <ChoiceSection title="Urgency" options={URGENCY_OPTIONS} value={form.urgency} onPick={(v) => updateField("urgency", v)} />
          <ChoiceSection title="Occupancy" options={OCCUPANCY_OPTIONS} value={form.occupancy} onPick={(v) => updateField("occupancy", v)} />
          <ChoiceSection title="Access" options={ACCESS_OPTIONS} value={form.access} onPick={(v) => updateField("access", v)} />
          <MultiChoiceSection title="Route This To" options={ROUTE_OPTIONS} values={routeTo} onToggle={(v) => setRouteTo((current) => toggleValue(current, v))} />
          <MultiChoiceSection title="Known Issues" options={ISSUE_OPTIONS} values={knownIssues} onToggle={(v) => setKnownIssues((current) => toggleValue(current, v))} />
          <MultiChoiceSection title="Available Docs" options={DOC_OPTIONS} values={docs} onToggle={(v) => setDocs((current) => toggleValue(current, v))} />
        </section>

        <section style={card}>
          <div style={eyebrow}>Save Deal Room</div>
          <p style={{ ...sub, fontSize: 18 }}>Click Save Deal Room once. It writes the full upgraded Deal Room object to every clean Deal Room key.</p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 18 }}>
            <button type="button" onClick={saveDeal} disabled={saving} style={{ ...primaryButton, opacity: saving ? .7 : 1 }}>{saving ? "Saving..." : "Save Deal Room"}</button>
            <Link href="/deal-rooms" style={darkButton}>Open Deal Rooms</Link>
            {savedId ? <Link href={`/deal-rooms/${savedId}`} style={darkButton}>Open New Room</Link> : null}
          </div>
        </section>
      </div>
    </main>
  );
}

function Field({ name, value, onChange, required = false }: { name: string; value: string; onChange: (value: string) => void; required?: boolean }) {
  return <label><span style={label}>{name}{required ? " *" : ""}</span><input style={input} value={value} onChange={(e) => onChange(e.target.value)} placeholder={name} /></label>;
}

function TextArea({ name, value, onChange }: { name: string; value: string; onChange: (value: string) => void }) {
  return <label><span style={label}>{name}</span><textarea style={{ ...input, minHeight: 132, resize: "vertical" }} value={value} onChange={(e) => onChange(e.target.value)} placeholder={name} /></label>;
}

function SelectField({ name, value, options, onChange }: { name: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return <label><span style={label}>{name}</span><select style={input} value={value} onChange={(e) => onChange(e.target.value)}>{options.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>;
}

function ChoiceSection({ title, options, value, onPick }: { title: string; options: string[]; value: string; onPick: (value: string) => void }) {
  return <div style={{ marginTop: 22 }}><div style={label}>{title}</div><div style={chipWrap}>{options.map((item) => <button key={item} type="button" style={value === item ? activeChip : baseChip} onClick={() => onPick(item)}>{item}</button>)}</div></div>;
}

function MultiChoiceSection({ title, options, values, onToggle }: { title: string; options: string[]; values: string[]; onToggle: (value: string) => void }) {
  return <div style={{ marginTop: 22 }}><div style={label}>{title}</div><div style={chipWrap}>{options.map((item) => <button key={item} type="button" style={values.includes(item) ? activeChip : baseChip} onClick={() => onToggle(item)}>{item}</button>)}</div></div>;
}
