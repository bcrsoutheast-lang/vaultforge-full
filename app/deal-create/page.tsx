"use client";

import React, { ChangeEvent, useMemo, useState } from "react";
import Link from "next/link";

type AssetClass = "Residential" | "Commercial" | "Land";
type ToastKind = "success" | "error" | "info";

type Toast = {
  show: boolean;
  kind: ToastKind;
  title: string;
  message: string;
};

type DealRoom = {
  id: string;
  kind: "deal";
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
  photoName: string;
  photoDataUrl: string;
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

const emptyToast: Toast = { show: false, kind: "info", title: "", message: "" };

function makeId() {
  return `deal_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
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

function safeParseArray(value: string | null): DealRoom[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function trimDataUrl(dataUrl: string) {
  return dataUrl.length > 2200000 ? "" : dataUrl;
}

async function imageFileToCompressedDataUrl(file: File): Promise<string> {
  const rawDataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("The photo could not be read."));
    reader.readAsDataURL(file);
  });

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("The photo could not be compressed."));
      img.src = rawDataUrl;
    });

    const maxSide = 1200;
    const ratio = Math.min(1, maxSide / Math.max(image.width, image.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.width * ratio));
    canvas.height = Math.max(1, Math.round(image.height * ratio));
    const context = canvas.getContext("2d");
    if (!context) return trimDataUrl(rawDataUrl);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const compressed = canvas.toDataURL("image/jpeg", 0.72);
    return trimDataUrl(compressed || rawDataUrl);
  } catch {
    return trimDataUrl(rawDataUrl);
  }
}

const page: React.CSSProperties = {
  minHeight: "100vh",
  background: "#05070d",
  color: "#f7f7fb",
  padding: "18px",
  fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
};

const wrap: React.CSSProperties = { maxWidth: 1180, margin: "0 auto", paddingBottom: 60 };
const card: React.CSSProperties = { background: "linear-gradient(180deg,#080d19,#050816)", border: "1px solid rgba(245,197,66,.28)", borderRadius: 26, padding: 28, marginBottom: 22, boxShadow: "0 18px 60px rgba(0,0,0,.3)" };
const eyebrow: React.CSSProperties = { color: "#ffd45a", textTransform: "uppercase", letterSpacing: 8, fontWeight: 900, fontSize: 20, marginBottom: 14 };
const h1: React.CSSProperties = { fontSize: "clamp(42px,7vw,78px)", lineHeight: 0.92, letterSpacing: -4, margin: "0 0 18px", fontWeight: 950 };
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
    window.setTimeout(() => {
      setToast((current) => (current.title === title && current.message === message ? emptyToast : current));
    }, kind === "success" ? 3000 : 5200);
  }

  async function handlePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("error", "Photo not added", "Choose an image file, then save again.");
      return;
    }

    setPhotoName(file.name);
    showToast("info", "Photo loading", "Compressing photo for local save...");
    try {
      const compressed = await imageFileToCompressedDataUrl(file);
      if (!compressed) {
        setPhotoDataUrl("");
        showToast("error", "Photo too large", "The photo was too large for browser storage. Deal can still save without the photo.");
        return;
      }
      setPhotoDataUrl(compressed);
      showToast("success", "Photo ready", "Photo compressed and ready. Now tap Save Deal Room.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Photo could not be loaded.";
      setPhotoDataUrl("");
      showToast("error", "Photo not added", `${message} Deal can still save without the photo.`);
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
    return {
      id: makeId(),
      kind: "deal",
      assetClass,
      title: form.title.trim(),
      state: form.state,
      city: form.city.trim(),
      county: form.county.trim(),
      address: form.address.trim(),
      askingPrice: form.askingPrice.trim(),
      arv: form.arv.trim(),
      repairs: form.repairs.trim(),
      equitySpread: form.equitySpread.trim(),
      beds: form.beds.trim(),
      baths: form.baths.trim(),
      sqft: form.sqft.trim(),
      acres: form.acres.trim(),
      units: form.units.trim(),
      buildingSize: form.buildingSize.trim(),
      zoning: form.zoning.trim(),
      contactName: form.contactName.trim(),
      contactPhone: form.contactPhone.trim(),
      contactEmail: form.contactEmail.trim(),
      bestContact: form.bestContact,
      submitterRole: form.submitterRole,
      routeTo,
      urgency: form.urgency,
      occupancy: form.occupancy,
      knownIssues,
      access: form.access,
      docs,
      assignmentFee: form.assignmentFee.trim(),
      deadline: form.deadline.trim(),
      notes: form.notes.trim(),
      aiRead,
      photoName,
      photoDataUrl,
      createdAt: now,
      updatedAt: now,
    };
  }

  function validateDeal() {
    if (!form.title.trim()) return "Add a deal name or short title before saving.";
    if (!form.state.trim() || !form.city.trim()) return "Select a state and add a city before saving.";
    if (!form.contactName.trim() && !form.contactPhone.trim() && !form.contactEmail.trim()) return "Add at least one contact field: name, phone, or email.";
    return "";
  }

  function saveDeal() {
    if (saving) return;
    setSaving(true);
    setSavedId("");

    try {
      const validationError = validateDeal();
      if (validationError) {
        showToast("error", "Deal not saved", validationError);
        return;
      }

      const deal = buildDeal();
      const existing = safeParseArray(window.localStorage.getItem("vaultforge_clean_deal_rooms"));
      const nextDeals = [deal, ...existing.filter((item) => item.id !== deal.id)].slice(0, 100);

      try {
        window.localStorage.setItem("vaultforge_clean_deal_rooms", JSON.stringify(nextDeals));
        window.localStorage.setItem(`vaultforge_clean_deal_room_${deal.id}`, JSON.stringify(deal));
      } catch (storageError) {
        if (photoDataUrl) {
          const dealWithoutPhoto: DealRoom = { ...deal, photoDataUrl: "", photoName: photoName ? `${photoName} (not stored locally)` : "" };
          const nextWithoutPhoto = [dealWithoutPhoto, ...existing.filter((item) => item.id !== deal.id)].slice(0, 100);
          window.localStorage.setItem("vaultforge_clean_deal_rooms", JSON.stringify(nextWithoutPhoto));
          window.localStorage.setItem(`vaultforge_clean_deal_room_${deal.id}`, JSON.stringify(dealWithoutPhoto));
          setSavedId(deal.id);
          showToast("success", "Deal saved without photo", "The photo was too large for local storage, but the Deal Room was saved. Open Deal Rooms below.");
          return;
        }
        throw storageError;
      }

      setSavedId(deal.id);
      showToast("success", "Deal saved", "Deal Room created. Use Open New Room or Open Deal Rooms below.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown save error.";
      showToast("error", "Deal not saved", message || "Browser storage blocked the save. Try a smaller photo or refresh and try again.");
    } finally {
      setSaving(false);
    }
  }

  const toastBackground = toast.kind === "success" ? "#102818" : toast.kind === "error" ? "#2b1015" : "#121724";
  const toastBorder = toast.kind === "success" ? "1px solid rgba(101,255,151,.5)" : toast.kind === "error" ? "1px solid rgba(255,88,88,.55)" : "1px solid rgba(255,212,90,.5)";

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
            background: toastBackground,
            color: "#fff",
            border: toastBorder,
            boxShadow: "0 18px 70px rgba(0,0,0,.55)",
          }}>
            <div style={{ fontWeight: 950, fontSize: 18 }}>{toast.title}</div>
            <div style={{ color: "#dce4ef", marginTop: 4 }}>{toast.message}</div>
          </div>
        ) : null}

        <section style={card}>
          <div style={eyebrow}>Deal Opportunity</div>
          <h1 style={h1}>Bloomberg operator intake.</h1>
          <p style={sub}>Residential, Commercial, and Land intake with contact controls, member routing, urgency, access, issues, photo upload, and AI-ready room data.</p>
        </section>

        <section style={card}>
          <div style={eyebrow}>Asset Class</div>
          <div style={chipWrap}>
            {(["Residential", "Commercial", "Land"] as AssetClass[]).map((item) => (
              <button key={item} type="button" onClick={() => setAssetClass(item)} style={assetClass === item ? activeChip : baseChip}>{item}</button>
            ))}
          </div>
        </section>

        <section style={card}>
          <div style={eyebrow}>{assetClass} Form</div>
          {photoDataUrl ? <img src={photoDataUrl} alt="Deal preview" style={{ width: "100%", maxHeight: 360, objectFit: "cover", borderRadius: 22, border: "1px solid rgba(207,216,230,.2)", marginBottom: 12 }} /> : null}
          <input type="file" accept="image/*" onChange={handlePhoto} />
          {photoName ? <span style={{ marginLeft: 10, color: "#cbd3df" }}>{photoName}</span> : null}

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
            {assetClass === "Residential" ? (
              <>
                <Field name="Beds" value={form.beds} onChange={(v) => updateField("beds", v)} />
                <Field name="Baths" value={form.baths} onChange={(v) => updateField("baths", v)} />
                <Field name="Sqft" value={form.sqft} onChange={(v) => updateField("sqft", v)} />
              </>
            ) : null}
            {assetClass === "Commercial" ? (
              <>
                <Field name="Units" value={form.units} onChange={(v) => updateField("units", v)} />
                <Field name="Building Size" value={form.buildingSize} onChange={(v) => updateField("buildingSize", v)} />
                <Field name="Zoning" value={form.zoning} onChange={(v) => updateField("zoning", v)} />
              </>
            ) : null}
            {assetClass === "Land" ? (
              <>
                <Field name="Acres" value={form.acres} onChange={(v) => updateField("acres", v)} />
                <Field name="Zoning" value={form.zoning} onChange={(v) => updateField("zoning", v)} />
                <Field name="Address / Location" value={form.address} onChange={(v) => updateField("address", v)} />
              </>
            ) : null}
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
          <p style={{ ...sub, fontSize: 18 }}>Tap Save Deal Room. This button does not submit a form or reload the page. It writes directly to browser storage and shows a saved/error popup.</p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 18 }}>
            <button type="button" onClick={saveDeal} disabled={saving} style={{ ...primaryButton, opacity: saving ? 0.72 : 1 }}>{saving ? "Saving..." : "Save Deal Room"}</button>
            <Link href="/deal-rooms" style={darkButton}>Open Deal Rooms</Link>
            {savedId ? <Link href={`/deal-rooms/${savedId}`} style={darkButton}>Open New Room</Link> : null}
          </div>
          {savedId ? <p style={{ color: "#9fffc1", fontWeight: 900, marginTop: 16 }}>Saved ID: {savedId}</p> : null}
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
