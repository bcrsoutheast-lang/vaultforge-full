"use client";

import Link from "next/link";
import { ChangeEvent, useMemo, useState } from "react";

type AssetClass = "Residential" | "Commercial" | "Land";
type ToastKind = "success" | "error";

type Toast = {
  show: boolean;
  kind: ToastKind;
  title: string;
  message: string;
};

type PainRoom = {
  id: string;
  kind: "pain";
  assetClass: AssetClass;
  title: string;
  state: string;
  city: string;
  county: string;
  address: string;
  askingPrice: string;
  propertyValue: string;
  arv: string;
  repairs: string;
  payoff: string;
  amountNeeded: string;
  equitySpread: string;
  beds: string;
  baths: string;
  sqft: string;
  units: string;
  buildingSize: string;
  acres: string;
  zoning: string;
  occupancy: string;
  access: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  bestContact: string;
  submitterRole: string;
  authority: string;
  timeline: string;
  painTypes: string[];
  urgency: string[];
  blockers: string[];
  routingNeeds: string[];
  solutionLanes: string[];
  riskLevel: string;
  currentState: string;
  rootCause: string;
  targetOutcome: string;
  constraints: string;
  notes: string;
  analyzer: string;
  aiRead: string;
  photoUrls: string[];
  createdAt: string;
  updatedAt: string;
};

const ROOM_KEYS = [
  "vaultforge_clean_pain_rooms_v1",
  "vaultforge_clean_pain_rooms",
  "vaultforge_pain_rooms",
  "vaultforge_rooms_pain",
  "vf_pain_rooms",
];

const STATES = ["GA", "TN", "AL", "FL", "NC", "SC", "TX"];
const CONTACT_OPTIONS = ["VaultForge Message", "Phone", "Email", "Text"];
const ROLE_OPTIONS = ["Owner", "Wholesaler", "Agent", "Broker", "Investor", "Operator", "Lender", "Contractor", "Developer"];
const AUTHORITY_OPTIONS = ["Owner authorized", "Decision maker", "Agent/rep", "Needs approval", "Unknown authority"];
const TIMELINE_OPTIONS = ["Today", "24-48 hours", "This week", "2 weeks", "30 days", "Flexible"];
const OCCUPANCY_OPTIONS = ["Unknown", "Vacant", "Owner Occupied", "Tenant Occupied", "Partially Occupied", "Under Construction"];
const ACCESS_OPTIONS = ["Unknown", "Drive By", "Appointment", "Lockbox", "Owner Access", "Tenant Notice Needed", "No Access Yet"];
const PAIN_TYPES = ["Funding Gap", "Stalled Project", "Distressed Seller", "Contractor Problem", "Permit / City Issue", "Buyer Needed", "Operator Needed", "Lender Needed", "JV Needed", "Tenant / Occupancy", "Title / Probate", "Code Violation", "Emergency Exit", "Capital Stack", "Portfolio Liquidation"];
const URGENCY = ["Low", "Normal", "High", "Critical", "Emergency", "Need answer today", "Need close fast"];
const BLOCKERS = ["Capital", "Buyer", "Lender", "Operator", "Contractor", "Permits", "City", "Title", "Probate", "Tenant", "Access", "Documents", "Pricing", "Timeline", "Legal", "Construction", "Communication"];
const ROUTING = ["Buyer", "Investor", "Lender", "Operator", "Contractor", "Broker", "JV Partner", "Developer", "Property Manager", "Attorney", "Permit Help", "Capital Partner"];
const SOLUTION_LANES = ["Verify owner/control", "Validate numbers", "Underwrite spread", "Find capital", "Find buyer", "Find operator", "Find contractor", "Resolve permit/city", "Resolve title", "Negotiate timeline", "Create execution plan", "Move to messages"];
const RISK = ["Low", "Medium", "High", "Severe", "Unknown"];

const emptyToast: Toast = { show: false, kind: "success", title: "", message: "" };

function makeId() {
  return `pain_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function toggle(list: string[], value: string) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

function money(value: string) {
  const raw = String(value || "").trim();
  if (!raw) return "not listed";
  if (raw.includes("$")) return raw;
  const n = Number(raw.replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(n) || n <= 0) return raw;
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function readRooms(key: string): PainRoom[] {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeRoom(room: PainRoom) {
  window.localStorage.setItem(`vaultforge_clean_pain_room_${room.id}`, JSON.stringify(room));
  window.localStorage.setItem(`vaultforge_pain_room_${room.id}`, JSON.stringify(room));

  for (const key of ROOM_KEYS) {
    const rows = readRooms(key).filter((item) => String(item.id || "") !== room.id);
    window.localStorage.setItem(key, JSON.stringify([room, ...rows]));
  }

  window.dispatchEvent(new Event("vaultforge-pain-change"));
}

export default function PainIntakePage() {
  const [assetClass, setAssetClass] = useState<AssetClass>("Residential");
  const [toast, setToast] = useState<Toast>(emptyToast);
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [painTypes, setPainTypes] = useState<string[]>(["Funding Gap"]);
  const [urgency, setUrgency] = useState<string[]>(["High"]);
  const [blockers, setBlockers] = useState<string[]>(["Capital"]);
  const [routingNeeds, setRoutingNeeds] = useState<string[]>(["Lender"]);
  const [solutionLanes, setSolutionLanes] = useState<string[]>(["Verify owner/control", "Validate numbers", "Find capital", "Move to messages"]);

  const [form, setForm] = useState({
    title: "",
    state: "GA",
    city: "",
    county: "",
    address: "",
    askingPrice: "",
    propertyValue: "",
    arv: "",
    repairs: "",
    payoff: "",
    amountNeeded: "",
    equitySpread: "",
    beds: "",
    baths: "",
    sqft: "",
    units: "",
    buildingSize: "",
    acres: "",
    zoning: "",
    occupancy: "Unknown",
    access: "Unknown",
    contactName: "",
    contactPhone: "",
    contactEmail: "",
    bestContact: "VaultForge Message",
    submitterRole: "Owner",
    authority: "Unknown authority",
    timeline: "This week",
    riskLevel: "Unknown",
    currentState: "",
    rootCause: "",
    targetOutcome: "",
    constraints: "",
    notes: "",
  });

  function update(name: string, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  function showToast(kind: ToastKind, title: string, message: string) {
    setToast({ show: true, kind, title, message });
    if (kind === "success") {
      window.setTimeout(() => setToast(emptyToast), 2600);
    }
  }

  function choosePhotos(event: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files || []).filter((file) => file.type.startsWith("image/")).slice(0, 10);
    setFiles(selected);
    setPreviewUrls((old) => {
      old.forEach((url) => URL.revokeObjectURL(url));
      return selected.map((file) => URL.createObjectURL(file));
    });
  }

  const analyzer = useMemo(() => {
    const location = [form.city, form.county, form.state].filter(Boolean).join(", ") || "market not listed";
    const pressureBits = [
      urgency.includes("Emergency") || urgency.includes("Critical") ? "high-pressure timing" : "",
      blockers.length ? `${blockers.join(", ")} blocker(s)` : "",
      routingNeeds.length ? `route to ${routingNeeds.join(", ")}` : "",
    ].filter(Boolean);

    const assetFacts =
      assetClass === "Residential"
        ? `${form.beds || "?"} beds / ${form.baths || "?"} baths / ${form.sqft || "?"} sqft`
        : assetClass === "Commercial"
          ? `${form.units || "?"} units / ${form.buildingSize || "?"} sqft / zoning ${form.zoning || "not listed"}`
          : `${form.acres || "?"} acres / zoning ${form.zoning || "not listed"}`;

    return `Analyzer: ${assetClass} pain room in ${location}. Problem type: ${painTypes.join(", ") || "not selected"}. Pressure: ${pressureBits.join(" • ") || "needs scoring"}. Numbers: ask ${money(form.askingPrice)}, value ${money(form.propertyValue || form.arv)}, repairs/work ${money(form.repairs)}, payoff ${money(form.payoff)}, amount needed ${money(form.amountNeeded)}. Asset facts: ${assetFacts}. Root issue: ${form.rootCause || "not defined"}. Target outcome: ${form.targetOutcome || "not defined"}. Next path: ${solutionLanes.join(" → ") || "verify, analyze, route, solve"}.`;
  }, [assetClass, form, painTypes, urgency, blockers, routingNeeds, solutionLanes]);

  async function uploadPhotos(): Promise<string[]> {
    if (!files.length) return [];

    const data = new FormData();
    files.slice(0, 10).forEach((file) => data.append("files", file));

    const response = await fetch("/api/uploads/pain", { method: "POST", body: data });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok || !payload?.ok) {
      throw new Error(payload?.error || "Photos could not upload.");
    }

    const urls = Array.isArray(payload.photoUrls) ? payload.photoUrls : Array.isArray(payload.urls) ? payload.urls : [];
    return urls.map(String).filter(Boolean).slice(0, 10);
  }

  function buildRoom(photoUrls: string[]): PainRoom {
    const now = new Date().toISOString();

    return {
      id: makeId(),
      kind: "pain",
      assetClass,
      title: form.title.trim(),
      state: form.state,
      city: form.city.trim(),
      county: form.county.trim(),
      address: form.address.trim(),
      askingPrice: form.askingPrice.trim(),
      propertyValue: form.propertyValue.trim(),
      arv: form.arv.trim(),
      repairs: form.repairs.trim(),
      payoff: form.payoff.trim(),
      amountNeeded: form.amountNeeded.trim(),
      equitySpread: form.equitySpread.trim(),
      beds: form.beds.trim(),
      baths: form.baths.trim(),
      sqft: form.sqft.trim(),
      units: form.units.trim(),
      buildingSize: form.buildingSize.trim(),
      acres: form.acres.trim(),
      zoning: form.zoning.trim(),
      occupancy: form.occupancy,
      access: form.access,
      contactName: form.contactName.trim(),
      contactPhone: form.contactPhone.trim(),
      contactEmail: form.contactEmail.trim(),
      bestContact: form.bestContact,
      submitterRole: form.submitterRole,
      authority: form.authority,
      timeline: form.timeline,
      painTypes,
      urgency,
      blockers,
      routingNeeds,
      solutionLanes,
      riskLevel: form.riskLevel,
      currentState: form.currentState.trim(),
      rootCause: form.rootCause.trim(),
      targetOutcome: form.targetOutcome.trim(),
      constraints: form.constraints.trim(),
      notes: form.notes.trim(),
      analyzer,
      aiRead: analyzer,
      photoUrls,
      createdAt: now,
      updatedAt: now,
    };
  }

  async function savePain() {
    if (saving) return;

    if (!form.title.trim()) {
      showToast("error", "Pain not saved", "Add a pain room title.");
      return;
    }

    if (!form.city.trim() || !form.state.trim()) {
      showToast("error", "Pain not saved", "Add city and state.");
      return;
    }

    if (!form.contactName.trim() && !form.contactPhone.trim() && !form.contactEmail.trim()) {
      showToast("error", "Pain not saved", "Add owner/contact name, phone, or email.");
      return;
    }

    setSaving(true);
    try {
      const photoUrls = await uploadPhotos();
      const room = buildRoom(photoUrls);
      writeRoom(room);
      setSavedId(room.id);
      showToast("success", "Pain Room saved", `Saved with ${photoUrls.length} photo(s). Open Pain Rooms to view it.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown save error.";
      showToast("error", "Pain not saved", message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main style={page}>
      <div style={wrap}>
        <nav style={nav}>
          <Link href="/command" style={btn}>Command</Link>
          <Link href="/deal-rooms" style={btn}>Deal Rooms</Link>
          <Link href="/pain-rooms" style={btn}>Pain Rooms</Link>
          <Link href="/messages" style={btn}>Messages</Link>
          <Link href="/profile" style={btn}>Profile</Link>
          <Link href="/" style={redBtn}>Exit</Link>
        </nav>

        {toast.show ? (
          <div style={{ ...toastBox, ...(toast.kind === "success" ? toastSuccess : toastError) }}>
            <strong>{toast.title}</strong>
            <span>{toast.message}</span>
          </div>
        ) : null}

        <section style={card}>
          <div style={eyebrow}>Pain Intake</div>
          <h1 style={h1}>Problem analyzer intake.</h1>
          <p style={sub}>Residential, Commercial, and Land pain rooms with up to 10 photos, owner contact, numbers, blockers, root cause, routing, and solution path.</p>
        </section>

        <section style={card}>
          <div style={eyebrow}>Asset Class</div>
          <div style={chipWrap}>
            {(["Residential", "Commercial", "Land"] as AssetClass[]).map((item) => (
              <button key={item} type="button" onClick={() => setAssetClass(item)} style={assetClass === item ? activeChip : chip}>{item}</button>
            ))}
          </div>
        </section>

        <section style={card}>
          <div style={eyebrow}>Photos Up To 10</div>
          <input type="file" accept="image/*" multiple onChange={choosePhotos} />
          <p style={{ ...sub, fontSize: 17, marginTop: 10 }}>{files.length}/10 selected. Photos upload to storage and only URLs save to the room.</p>
          <div style={photoGrid}>
            {previewUrls.map((url, index) => <img key={url} src={url} alt={`Preview ${index + 1}`} style={photoPreview} />)}
          </div>
        </section>

        <section style={card}>
          <div style={eyebrow}>Analyzer Preview</div>
          <h2 style={h2}>Live problem read.</h2>
          <p style={sub}>{analyzer}</p>
        </section>

        <section style={card}>
          <div style={eyebrow}>{assetClass} Facts</div>
          <div style={grid}>
            <Field label="Pain Room Title" value={form.title} onChange={(v) => update("title", v)} required />
            <Select label="State" value={form.state} options={STATES} onChange={(v) => update("state", v)} />
            <Field label="City" value={form.city} onChange={(v) => update("city", v)} required />
            <Field label="County" value={form.county} onChange={(v) => update("county", v)} />
            <Field label="Address / Location" value={form.address} onChange={(v) => update("address", v)} />
            <Field label="Ask Price" value={form.askingPrice} onChange={(v) => update("askingPrice", v)} />
            <Field label="Property Value / ARV" value={form.propertyValue} onChange={(v) => update("propertyValue", v)} />
            <Field label="Repairs / Work" value={form.repairs} onChange={(v) => update("repairs", v)} />
            <Field label="Payoff" value={form.payoff} onChange={(v) => update("payoff", v)} />
            <Field label="Amount Needed" value={form.amountNeeded} onChange={(v) => update("amountNeeded", v)} />
            <Field label="Equity Spread" value={form.equitySpread} onChange={(v) => update("equitySpread", v)} />

            {assetClass === "Residential" ? (
              <>
                <Field label="Beds" value={form.beds} onChange={(v) => update("beds", v)} />
                <Field label="Baths" value={form.baths} onChange={(v) => update("baths", v)} />
                <Field label="Sqft" value={form.sqft} onChange={(v) => update("sqft", v)} />
              </>
            ) : null}

            {assetClass === "Commercial" ? (
              <>
                <Field label="Units" value={form.units} onChange={(v) => update("units", v)} />
                <Field label="Building Size" value={form.buildingSize} onChange={(v) => update("buildingSize", v)} />
                <Field label="Zoning" value={form.zoning} onChange={(v) => update("zoning", v)} />
              </>
            ) : null}

            {assetClass === "Land" ? (
              <>
                <Field label="Acres" value={form.acres} onChange={(v) => update("acres", v)} />
                <Field label="Zoning" value={form.zoning} onChange={(v) => update("zoning", v)} />
              </>
            ) : null}
          </div>
        </section>

        <section style={card}>
          <div style={eyebrow}>Owner + Control</div>
          <div style={grid}>
            <Field label="Owner / Contact Name" value={form.contactName} onChange={(v) => update("contactName", v)} required />
            <Field label="Phone" value={form.contactPhone} onChange={(v) => update("contactPhone", v)} />
            <Field label="Email" value={form.contactEmail} onChange={(v) => update("contactEmail", v)} />
            <Select label="Best Contact" value={form.bestContact} options={CONTACT_OPTIONS} onChange={(v) => update("bestContact", v)} />
            <Select label="Submitter Role" value={form.submitterRole} options={ROLE_OPTIONS} onChange={(v) => update("submitterRole", v)} />
            <Select label="Authority" value={form.authority} options={AUTHORITY_OPTIONS} onChange={(v) => update("authority", v)} />
            <Select label="Timeline" value={form.timeline} options={TIMELINE_OPTIONS} onChange={(v) => update("timeline", v)} />
            <Select label="Occupancy" value={form.occupancy} options={OCCUPANCY_OPTIONS} onChange={(v) => update("occupancy", v)} />
            <Select label="Access" value={form.access} options={ACCESS_OPTIONS} onChange={(v) => update("access", v)} />
            <Select label="Risk Level" value={form.riskLevel} options={RISK} onChange={(v) => update("riskLevel", v)} />
          </div>
        </section>

        <section style={card}>
          <div style={eyebrow}>Problem + Routing</div>
          <Multi title="Pain Types" options={PAIN_TYPES} values={painTypes} onToggle={(v) => setPainTypes((cur) => toggle(cur, v))} />
          <Multi title="Urgency" options={URGENCY} values={urgency} onToggle={(v) => setUrgency((cur) => toggle(cur, v))} />
          <Multi title="Blockers" options={BLOCKERS} values={blockers} onToggle={(v) => setBlockers((cur) => toggle(cur, v))} />
          <Multi title="Route Needs" options={ROUTING} values={routingNeeds} onToggle={(v) => setRoutingNeeds((cur) => toggle(cur, v))} />
          <Multi title="Solution Path" options={SOLUTION_LANES} values={solutionLanes} onToggle={(v) => setSolutionLanes((cur) => toggle(cur, v))} />
        </section>

        <section style={card}>
          <div style={eyebrow}>Analyzer Notes</div>
          <div style={grid}>
            <TextArea label="Current State / What is happening now" value={form.currentState} onChange={(v) => update("currentState", v)} />
            <TextArea label="Likely Root Cause" value={form.rootCause} onChange={(v) => update("rootCause", v)} />
            <TextArea label="Target Outcome" value={form.targetOutcome} onChange={(v) => update("targetOutcome", v)} />
            <TextArea label="Constraints / Risk / Context" value={form.constraints} onChange={(v) => update("constraints", v)} />
            <TextArea label="Private Notes" value={form.notes} onChange={(v) => update("notes", v)} />
          </div>
        </section>

        <section style={card}>
          <div style={eyebrow}>Save Pain Room</div>
          <p style={sub}>Save creates a Pain Room with analyzer data, photo URLs, owner contact, routing needs, and message subject.</p>
          <div style={actionRow}>
            <button type="button" disabled={saving} onClick={savePain} style={goldBtn}>{saving ? "Saving..." : "Save Pain Room"}</button>
            <Link href="/pain-rooms" style={btn}>Open Pain Rooms</Link>
            {savedId ? <Link href={`/pain-rooms/${savedId}`} style={btn}>Open New Pain Room</Link> : null}
          </div>
        </section>
      </div>
    </main>
  );
}

function Field({ label, value, onChange, required = false }: { label: string; value: string; onChange: (value: string) => void; required?: boolean }) {
  return <label><span style={fieldLabel}>{label}{required ? " *" : ""}</span><input style={input} value={value} onChange={(event) => onChange(event.target.value)} placeholder={label} /></label>;
}

function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label><span style={fieldLabel}>{label}</span><textarea style={{ ...input, minHeight: 132, resize: "vertical" }} value={value} onChange={(event) => onChange(event.target.value)} placeholder={label} /></label>;
}

function Select({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return <label><span style={fieldLabel}>{label}</span><select style={input} value={value} onChange={(event) => onChange(event.target.value)}>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>;
}

function Multi({ title, options, values, onToggle }: { title: string; options: string[]; values: string[]; onToggle: (value: string) => void }) {
  return (
    <div style={{ marginTop: 22 }}>
      <div style={fieldLabel}>{title}</div>
      <div style={chipWrap}>
        {options.map((option) => <button key={option} type="button" onClick={() => onToggle(option)} style={values.includes(option) ? activeChip : chip}>{option}</button>)}
      </div>
    </div>
  );
}

const page: React.CSSProperties = { minHeight: "100vh", background: "#05070d", color: "#f7f7fb", padding: 18, fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" };
const wrap: React.CSSProperties = { maxWidth: 1180, margin: "0 auto", paddingBottom: 70 };
const nav: React.CSSProperties = { display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 18 };
const card: React.CSSProperties = { background: "linear-gradient(180deg,#080d19,#050816)", border: "1px solid rgba(245,197,66,.28)", borderRadius: 26, padding: 28, marginBottom: 22 };
const eyebrow: React.CSSProperties = { color: "#ffd45a", textTransform: "uppercase", letterSpacing: 8, fontWeight: 900, fontSize: 19, marginBottom: 14 };
const h1: React.CSSProperties = { fontSize: "clamp(42px,7vw,76px)", lineHeight: 0.92, letterSpacing: -4, margin: "0 0 18px", fontWeight: 950 };
const h2: React.CSSProperties = { fontSize: "clamp(30px,5vw,52px)", lineHeight: 1, letterSpacing: -2, margin: "0 0 12px", fontWeight: 950 };
const sub: React.CSSProperties = { color: "#c9d0dc", fontSize: 22, lineHeight: 1.35, margin: 0 };
const btn: React.CSSProperties = { border: "1px solid rgba(207,216,230,.18)", background: "#171c29", color: "#f7f7fb", borderRadius: 999, padding: "13px 18px", fontWeight: 950, textDecoration: "none", display: "inline-block", cursor: "pointer" };
const goldBtn: React.CSSProperties = { ...btn, border: 0, background: "#ffdc68", color: "#10131a" };
const redBtn: React.CSSProperties = { ...btn, background: "#271016", borderColor: "rgba(255,70,70,.48)", color: "#ffaaaa" };
const grid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(245px, 1fr))", gap: 16 };
const input: React.CSSProperties = { width: "100%", boxSizing: "border-box", borderRadius: 18, border: "1px solid rgba(207,216,230,.18)", background: "#121724", color: "#f6f7fb", padding: "17px 18px", fontSize: 16, outline: "none" };
const fieldLabel: React.CSSProperties = { display: "block", color: "#ffd45a", fontSize: 13, letterSpacing: 3, textTransform: "uppercase", fontWeight: 900, marginBottom: 8 };
const chipWrap: React.CSSProperties = { display: "flex", flexWrap: "wrap", gap: 10 };
const chip: React.CSSProperties = { border: "1px solid rgba(207,216,230,.18)", background: "#171c29", color: "#f9fbff", borderRadius: 999, padding: "12px 16px", fontWeight: 900, cursor: "pointer" };
const activeChip: React.CSSProperties = { ...chip, background: "#ffdc68", color: "#111319", borderColor: "#ffdc68" };
const photoGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10, marginTop: 16 };
const photoPreview: React.CSSProperties = { width: "100%", height: 130, objectFit: "cover", borderRadius: 18, border: "1px solid rgba(207,216,230,.2)" };
const actionRow: React.CSSProperties = { display: "flex", flexWrap: "wrap", gap: 12, marginTop: 18 };
const toastBox: React.CSSProperties = { position: "fixed", top: 18, left: "50%", transform: "translateX(-50%)", zIndex: 9999, width: "min(92vw, 720px)", borderRadius: 20, padding: "16px 18px", color: "#fff", boxShadow: "0 18px 70px rgba(0,0,0,.55)", display: "grid", gap: 4 };
const toastSuccess: React.CSSProperties = { background: "#102818", border: "1px solid rgba(101,255,151,.5)" };
const toastError: React.CSSProperties = { background: "#2b1015", border: "1px solid rgba(255,88,88,.55)" };
