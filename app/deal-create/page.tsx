"use client";

import { useEffect, useMemo, useState } from "react";
import VaultForgeCleanShell from "../components/VaultForgeCleanShell";

type AssetClass = "Residential" | "Commercial" | "Land";
type ToastKind = "success" | "error";

type ToastState = {
  show: boolean;
  kind: ToastKind;
  title: string;
  message: string;
};

type DealDraft = {
  id: string;
  assetClass: AssetClass;
  title: string;
  state: string;
  city: string;
  county: string;
  askingPrice: string;
  arvValue: string;
  repairsWork: string;
  equitySpread: string;
  beds: string;
  baths: string;
  sqft: string;
  units: string;
  acreage: string;
  zoning: string;
  lotType: string;
  sellerName: string;
  sellerPhone: string;
  sellerEmail: string;
  assignmentFee: string;
  deadline: string;
  bestContact: string;
  submitterRole: string;
  routeTo: string[];
  urgency: string;
  occupancy: string;
  access: string;
  knownIssues: string[];
  docsAvailable: string[];
  aiNotes: string;
  photoDataUrl: string;
  photoName: string;
  createdAt: string;
  updatedAt: string;
};

const STORAGE_KEY = "vaultforge_deal_rooms";

const assetClasses: AssetClass[] = ["Residential", "Commercial", "Land"];
const states = ["GA", "TN", "AL", "FL", "NC", "SC", "TX"];
const contactOptions = ["VaultForge Message", "Phone", "Email", "Text"];
const roles = ["Owner", "Wholesaler", "Broker", "Agent", "Investor", "Operator", "Lender", "Contractor"];
const routeOptions = ["Buyer", "Capital", "Lender", "Operator", "Contractor", "Broker", "Attorney", "Title", "Property Manager"];
const urgencyOptions = ["Low", "Medium", "High", "Emergency"];
const occupancyOptions = ["Vacant", "Owner Occupied", "Tenant Occupied", "Unknown", "Raw Land", "N/A"];
const accessOptions = ["Drive By", "Lockbox", "Appointment", "Owner Access", "Tenant Notice", "Unknown"];
const issueOptions = ["None Known", "Title", "Probate", "Foreclosure", "Taxes", "Liens", "Permit", "Tenant", "Construction", "Environmental", "Survey", "Access"];
const docOptions = ["Photos", "Rent Roll", "Survey", "Title Work", "POF Needed", "Inspection", "Plans", "Permits", "ARV Comps", "Repair Bid"];

function safeText(value: unknown) {
  return String(value || "").trim();
}

function moneyLabel(value: string) {
  const cleaned = safeText(value).replace(/[^0-9.]/g, "");
  if (!cleaned) return "not entered";
  const number = Number(cleaned);
  if (!Number.isFinite(number)) return value;
  return `$${number.toLocaleString()}`;
}

function makeId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `deal_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function readDeals(): DealDraft[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeDeals(deals: DealDraft[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(deals));
}

const blankDeal: DealDraft = {
  id: "",
  assetClass: "Residential",
  title: "",
  state: "GA",
  city: "",
  county: "",
  askingPrice: "",
  arvValue: "",
  repairsWork: "",
  equitySpread: "",
  beds: "",
  baths: "",
  sqft: "",
  units: "",
  acreage: "",
  zoning: "",
  lotType: "",
  sellerName: "",
  sellerPhone: "",
  sellerEmail: "",
  assignmentFee: "",
  deadline: "",
  bestContact: "VaultForge Message",
  submitterRole: "Owner",
  routeTo: ["Buyer"],
  urgency: "High",
  occupancy: "Vacant",
  access: "Appointment",
  knownIssues: ["None Known"],
  docsAvailable: ["Photos"],
  aiNotes: "",
  photoDataUrl: "",
  photoName: "",
  createdAt: "",
  updatedAt: "",
};

function Chip({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} style={active ? chipActive : chip}>
      {children}
    </button>
  );
}

function Field({ value, onChange, placeholder, type = "text" }: { value: string; onChange: (value: string) => void; placeholder: string; type?: string }) {
  return <input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} style={input} />;
}

function TextBox({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return <textarea value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} style={textarea} />;
}

export default function DealCreatePage() {
  const [deal, setDeal] = useState<DealDraft>(blankDeal);
  const [toast, setToast] = useState<ToastState>({ show: false, kind: "success", title: "", message: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!toast.show) return;
    const timer = window.setTimeout(() => {
      setToast((current) => ({ ...current, show: false }));
    }, toast.kind === "success" ? 2600 : 4200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const aiRead = useMemo(() => {
    const assetDetail = deal.assetClass === "Residential"
      ? `${deal.beds || "?"} beds / ${deal.baths || "?"} baths / ${deal.sqft || "?"} sqft`
      : deal.assetClass === "Commercial"
        ? `${deal.units || "?"} units / ${deal.sqft || "?"} sqft / zoning ${deal.zoning || "?"}`
        : `${deal.acreage || "?"} acres / ${deal.lotType || "land"} / zoning ${deal.zoning || "?"}`;

    return `Market: ${deal.city || "City"}, ${deal.county || "County"}, ${deal.state || "State"}. Numbers: ask ${moneyLabel(deal.askingPrice)}, ARV/value ${moneyLabel(deal.arvValue)}, repairs/work ${moneyLabel(deal.repairsWork)}. Best contact: ${deal.bestContact}. Submitter role: ${deal.submitterRole}. Needs routed to: ${deal.routeTo.length ? deal.routeTo.join(", ") : "not selected"}. Urgency: ${deal.urgency}. Occupancy: ${deal.occupancy}. Known issues: ${deal.knownIssues.length ? deal.knownIssues.join(", ") : "none selected"}. ${deal.assetClass} asset: ${assetDetail}.`;
  }, [deal]);

  function update<K extends keyof DealDraft>(key: K, value: DealDraft[K]) {
    setDeal((current) => ({ ...current, [key]: value }));
  }

  function toggleArray(key: "routeTo" | "knownIssues" | "docsAvailable", value: string) {
    setDeal((current) => {
      const set = new Set(current[key]);
      if (set.has(value)) set.delete(value);
      else set.add(value);
      return { ...current, [key]: Array.from(set) };
    });
  }

  function showToast(kind: ToastKind, title: string, message: string) {
    setToast({ show: true, kind, title, message });
  }

  function validateDeal() {
    if (!safeText(deal.title)) return "Add a deal name/title before saving.";
    if (!safeText(deal.state)) return "Select a state before saving.";
    if (!safeText(deal.city)) return "Add the city before saving.";
    if (!safeText(deal.sellerName) && !safeText(deal.sellerPhone) && !safeText(deal.sellerEmail)) {
      return "Add at least one contact detail: name, phone, or email.";
    }
    return "";
  }

  async function handlePhoto(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("error", "Photo not saved", "Please choose an image file only.");
      return;
    }
    if (file.size > 6 * 1024 * 1024) {
      showToast("error", "Photo too large", "Use an image under 6MB for the local test build.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      update("photoDataUrl", String(reader.result || ""));
      update("photoName", file.name);
    };
    reader.onerror = () => showToast("error", "Photo error", "The image could not be read on this device.");
    reader.readAsDataURL(file);
  }

  function handleSave() {
    const error = validateDeal();
    if (error) {
      showToast("error", "Deal not saved", error);
      return;
    }

    setSaving(true);
    try {
      const now = new Date().toISOString();
      const id = deal.id || makeId();
      const savedDeal: DealDraft = {
        ...deal,
        id,
        title: safeText(deal.title),
        city: safeText(deal.city),
        county: safeText(deal.county),
        sellerName: safeText(deal.sellerName),
        sellerPhone: safeText(deal.sellerPhone),
        sellerEmail: safeText(deal.sellerEmail),
        updatedAt: now,
        createdAt: deal.createdAt || now,
      };

      const existing = readDeals();
      const withoutCurrent = existing.filter((item) => item.id !== id);
      writeDeals([savedDeal, ...withoutCurrent]);
      setDeal(savedDeal);
      showToast("success", "Deal saved", "Saved to Deal Rooms. This message will disappear automatically.");
    } catch (saveError) {
      console.error(saveError);
      showToast("error", "Save failed", "This browser could not save the deal locally. Try removing large photos or refreshing.");
    } finally {
      setSaving(false);
    }
  }

  function handleClear() {
    setDeal({ ...blankDeal, assetClass: deal.assetClass });
    showToast("success", "Form reset", "The form was cleared for a new deal.");
  }

  return (
    <VaultForgeCleanShell
      title="Deal Opportunity"
      subtitle="Bloomberg operator intake."
    >
      {toast.show ? (
        <div style={toast.kind === "success" ? toastSuccess : toastError} role="status" aria-live="polite">
          <strong>{toast.title}</strong>
          <span>{toast.message}</span>
        </div>
      ) : null}

      <section style={panel}>
        <div style={eyebrow}>Asset Class</div>
        <div style={chipRow}>
          {assetClasses.map((option) => (
            <Chip key={option} active={deal.assetClass === option} onClick={() => update("assetClass", option)}>
              {option}
            </Chip>
          ))}
        </div>
      </section>

      <section style={panel}>
        <div style={eyebrow}>{deal.assetClass} Form</div>

        <div style={photoBox}>
          {deal.photoDataUrl ? <img src={deal.photoDataUrl} alt="Deal preview" style={photo} /> : <div style={photoEmpty}>Upload deal photo</div>}
          <input type="file" accept="image/*" onChange={(event) => handlePhoto(event.target.files?.[0] || null)} style={fileInput} />
          {deal.photoName ? <div style={smallText}>{deal.photoName}</div> : null}
        </div>

        <div style={aiBox}>
          <div style={eyebrow}>AI Room Read</div>
          <p style={bodyText}>{aiRead}</p>
        </div>

        <div style={grid3}>
          <Field value={deal.title} onChange={(value) => update("title", value)} placeholder="Deal Name / Headline" />
          <select value={deal.state} onChange={(event) => update("state", event.target.value)} style={input}>
            {states.map((state) => <option key={state} value={state}>{state}</option>)}
          </select>
          <Field value={deal.city} onChange={(value) => update("city", value)} placeholder="City" />
          <Field value={deal.county} onChange={(value) => update("county", value)} placeholder="County" />
          <Field value={deal.askingPrice} onChange={(value) => update("askingPrice", value)} placeholder="Asking Price" />
          <Field value={deal.arvValue} onChange={(value) => update("arvValue", value)} placeholder="ARV / Value" />
          <Field value={deal.repairsWork} onChange={(value) => update("repairsWork", value)} placeholder="Repairs / Work" />
          <Field value={deal.equitySpread} onChange={(value) => update("equitySpread", value)} placeholder="Equity Spread" />

          {deal.assetClass === "Residential" ? (
            <>
              <Field value={deal.beds} onChange={(value) => update("beds", value)} placeholder="Beds" />
              <Field value={deal.baths} onChange={(value) => update("baths", value)} placeholder="Baths" />
              <Field value={deal.sqft} onChange={(value) => update("sqft", value)} placeholder="Sqft" />
            </>
          ) : null}

          {deal.assetClass === "Commercial" ? (
            <>
              <Field value={deal.units} onChange={(value) => update("units", value)} placeholder="Units / Bays / Keys" />
              <Field value={deal.sqft} onChange={(value) => update("sqft", value)} placeholder="Building Sqft" />
              <Field value={deal.zoning} onChange={(value) => update("zoning", value)} placeholder="Zoning" />
            </>
          ) : null}

          {deal.assetClass === "Land" ? (
            <>
              <Field value={deal.acreage} onChange={(value) => update("acreage", value)} placeholder="Acreage" />
              <Field value={deal.lotType} onChange={(value) => update("lotType", value)} placeholder="Lot Type" />
              <Field value={deal.zoning} onChange={(value) => update("zoning", value)} placeholder="Zoning" />
            </>
          ) : null}

          <TextBox value={deal.aiNotes} onChange={(value) => update("aiNotes", value)} placeholder="AI / Deal Notes" />
        </div>
      </section>

      <section style={panel}>
        <div style={eyebrow}>Contact + Control</div>
        <div style={grid3}>
          <Field value={deal.sellerName} onChange={(value) => update("sellerName", value)} placeholder="Name" />
          <Field value={deal.sellerPhone} onChange={(value) => update("sellerPhone", value)} placeholder="Phone" />
          <Field value={deal.sellerEmail} onChange={(value) => update("sellerEmail", value)} placeholder="Email" type="email" />
          <Field value={deal.assignmentFee} onChange={(value) => update("assignmentFee", value)} placeholder="Assignment Fee / Spread" />
          <Field value={deal.deadline} onChange={(value) => update("deadline", value)} placeholder="Deadline / Close Date" />
        </div>

        <div style={subhead}>Best Way To Contact</div>
        <div style={chipRow}>{contactOptions.map((option) => <Chip key={option} active={deal.bestContact === option} onClick={() => update("bestContact", option)}>{option}</Chip>)}</div>

        <div style={subhead}>Submitter Role</div>
        <div style={chipRow}>{roles.map((option) => <Chip key={option} active={deal.submitterRole === option} onClick={() => update("submitterRole", option)}>{option}</Chip>)}</div>
      </section>

      <section style={panel}>
        <div style={eyebrow}>Routing Intelligence</div>
        <div style={subhead}>Route This Deal To</div>
        <div style={chipRow}>{routeOptions.map((option) => <Chip key={option} active={deal.routeTo.includes(option)} onClick={() => toggleArray("routeTo", option)}>{option}</Chip>)}</div>

        <div style={subhead}>Urgency</div>
        <div style={chipRow}>{urgencyOptions.map((option) => <Chip key={option} active={deal.urgency === option} onClick={() => update("urgency", option)}>{option}</Chip>)}</div>

        <div style={subhead}>Occupancy</div>
        <div style={chipRow}>{occupancyOptions.map((option) => <Chip key={option} active={deal.occupancy === option} onClick={() => update("occupancy", option)}>{option}</Chip>)}</div>

        <div style={subhead}>Access</div>
        <div style={chipRow}>{accessOptions.map((option) => <Chip key={option} active={deal.access === option} onClick={() => update("access", option)}>{option}</Chip>)}</div>

        <div style={subhead}>Known Issues</div>
        <div style={chipRow}>{issueOptions.map((option) => <Chip key={option} active={deal.knownIssues.includes(option)} onClick={() => toggleArray("knownIssues", option)}>{option}</Chip>)}</div>

        <div style={subhead}>Docs Available</div>
        <div style={chipRow}>{docOptions.map((option) => <Chip key={option} active={deal.docsAvailable.includes(option)} onClick={() => toggleArray("docsAvailable", option)}>{option}</Chip>)}</div>
      </section>

      <section style={savePanel}>
        <div>
          <div style={eyebrow}>Save Control</div>
          <h2 style={sectionTitle}>Create Deal Room.</h2>
          <p style={bodyText}>Tap save once. A confirmation banner will appear and disappear after the deal is saved. Then open Deal Rooms.</p>
        </div>
        <div style={buttonRow}>
          <button type="button" onClick={handleSave} disabled={saving} style={primaryButton}>{saving ? "Saving..." : "Save Deal"}</button>
          <a href="/deal-rooms" style={secondaryButton}>Open Deal Rooms</a>
          <button type="button" onClick={handleClear} style={dangerButton}>Clear Form</button>
        </div>
      </section>
    </VaultForgeCleanShell>
  );
}

const panel: React.CSSProperties = {
  border: "1px solid rgba(248, 204, 74, 0.22)",
  borderRadius: 24,
  background: "linear-gradient(180deg, rgba(9, 15, 31, 0.98), rgba(5, 9, 20, 0.98))",
  padding: 28,
  marginBottom: 26,
  boxShadow: "0 22px 80px rgba(0,0,0,0.35)",
};

const savePanel: React.CSSProperties = {
  ...panel,
  display: "flex",
  justifyContent: "space-between",
  gap: 20,
  alignItems: "flex-start",
  flexWrap: "wrap",
};

const eyebrow: React.CSSProperties = {
  color: "#ffd966",
  textTransform: "uppercase",
  letterSpacing: 6,
  fontWeight: 900,
  fontSize: 18,
  marginBottom: 16,
};

const sectionTitle: React.CSSProperties = {
  color: "#ffffff",
  fontSize: "clamp(34px, 6vw, 56px)",
  lineHeight: 0.95,
  margin: "0 0 18px",
  letterSpacing: -3,
};

const bodyText: React.CSSProperties = {
  color: "rgba(235,241,255,0.78)",
  fontSize: 20,
  lineHeight: 1.45,
  margin: 0,
};

const chipRow: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 10,
  marginBottom: 18,
};

const chip: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,0.16)",
  background: "rgba(255,255,255,0.07)",
  color: "#f7f8fb",
  borderRadius: 999,
  padding: "12px 18px",
  fontWeight: 900,
  cursor: "pointer",
};

const chipActive: React.CSSProperties = {
  ...chip,
  border: "1px solid rgba(255,221,109,0.95)",
  background: "linear-gradient(135deg, #ffe57a, #f8c94a)",
  color: "#111522",
};

const grid3: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 16,
};

const input: React.CSSProperties = {
  width: "100%",
  minHeight: 58,
  borderRadius: 18,
  border: "1px solid rgba(255,255,255,0.15)",
  background: "rgba(255,255,255,0.08)",
  color: "#ffffff",
  padding: "0 18px",
  fontSize: 16,
  outline: "none",
};

const textarea: React.CSSProperties = {
  ...input,
  minHeight: 138,
  padding: 18,
  resize: "vertical",
  fontFamily: "inherit",
};

const photoBox: React.CSSProperties = {
  marginBottom: 22,
};

const photo: React.CSSProperties = {
  width: "100%",
  maxHeight: 360,
  objectFit: "cover",
  borderRadius: 22,
  border: "1px solid rgba(255,255,255,0.16)",
  display: "block",
  marginBottom: 10,
};

const photoEmpty: React.CSSProperties = {
  minHeight: 220,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 22,
  border: "1px dashed rgba(255,255,255,0.24)",
  background: "rgba(255,255,255,0.05)",
  color: "rgba(235,241,255,0.65)",
  fontWeight: 900,
  marginBottom: 10,
};

const fileInput: React.CSSProperties = {
  color: "rgba(235,241,255,0.82)",
  maxWidth: "100%",
};

const smallText: React.CSSProperties = {
  color: "rgba(235,241,255,0.65)",
  fontSize: 13,
  marginTop: 6,
};

const aiBox: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.055)",
  borderRadius: 22,
  padding: 20,
  marginBottom: 22,
};

const subhead: React.CSSProperties = {
  color: "#ffd966",
  fontWeight: 900,
  letterSpacing: 2,
  fontSize: 18,
  margin: "22px 0 12px",
};

const buttonRow: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 12,
  alignItems: "center",
};

const primaryButton: React.CSSProperties = {
  border: "1px solid rgba(255,221,109,0.85)",
  borderRadius: 999,
  padding: "15px 22px",
  background: "linear-gradient(135deg, #ffe57a, #f8c94a)",
  color: "#111522",
  fontWeight: 950,
  cursor: "pointer",
  textDecoration: "none",
};

const secondaryButton: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,0.16)",
  borderRadius: 999,
  padding: "15px 22px",
  background: "rgba(255,255,255,0.08)",
  color: "#ffffff",
  fontWeight: 900,
  cursor: "pointer",
  textDecoration: "none",
};

const dangerButton: React.CSSProperties = {
  ...secondaryButton,
  border: "1px solid rgba(255,74,94,0.42)",
  color: "#ffb8c0",
};

const toastBase: React.CSSProperties = {
  position: "fixed",
  top: 18,
  left: "50%",
  transform: "translateX(-50%)",
  zIndex: 9999,
  width: "min(92vw, 560px)",
  borderRadius: 18,
  padding: "16px 18px",
  boxShadow: "0 24px 80px rgba(0,0,0,0.55)",
  display: "grid",
  gap: 6,
  fontWeight: 800,
};

const toastSuccess: React.CSSProperties = {
  ...toastBase,
  border: "1px solid rgba(75, 255, 165, 0.38)",
  background: "linear-gradient(135deg, rgba(6, 48, 34, 0.98), rgba(8, 20, 18, 0.98))",
  color: "#eafff4",
};

const toastError: React.CSSProperties = {
  ...toastBase,
  border: "1px solid rgba(255, 82, 104, 0.45)",
  background: "linear-gradient(135deg, rgba(67, 12, 20, 0.98), rgba(18, 8, 13, 0.98))",
  color: "#fff0f2",
};
