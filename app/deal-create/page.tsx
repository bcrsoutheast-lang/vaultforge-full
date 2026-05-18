"use client";

import React, { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";

type AssetClass = "Residential" | "Commercial" | "Land";
type ToastKind = "success" | "error";

type ToastState = {
  show: boolean;
  kind: ToastKind;
  title: string;
  message: string;
};

type DealRoom = {
  id: string;
  type: "deal";
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
  units: string;
  acres: string;
  zoning: string;
  propertyUse: string;
  sellerName: string;
  sellerPhone: string;
  sellerEmail: string;
  preferredContact: string;
  bestTime: string;
  role: string;
  urgency: string;
  occupancy: string;
  access: string;
  knownIssues: string;
  routeTo: string[];
  documents: string[];
  aiNotes: string;
  photoName: string;
  photoUrl: string;
  createdAt: string;
  updatedAt: string;
};

const STATES = ["GA", "TN", "AL", "FL", "NC", "SC", "TX"];
const CONTACT_METHODS = ["VaultForge Message", "Phone", "Email", "Text"];
const BEST_TIMES = ["Anytime", "Morning", "Afternoon", "Evening", "Weekdays", "Weekends"];
const ROLES = ["Owner", "Wholesaler", "Agent", "Broker", "Operator", "Lender", "Developer", "Contractor"];
const URGENCY = ["Low", "Medium", "High", "Critical", "Need closed now"];
const OCCUPANCY = ["Unknown", "Vacant", "Owner occupied", "Tenant occupied", "Partially occupied"];
const ACCESS = ["Unknown", "Easy access", "Appointment only", "Drive-by only", "Do not disturb", "Lockbox"];
const ROUTE_TO = ["Buyer", "Lender", "Operator", "Contractor", "Broker", "Developer", "JV Partner", "Attorney"];
const DOCUMENTS = ["Photos", "Rent roll", "P&L", "Survey", "Title", "Tax card", "Repair bid", "Contract", "Appraisal"];
const PROPERTY_USE = ["Vacant", "Rental", "Owner use", "Redevelopment", "Flip", "Hold", "Wholesale", "Mixed use"];

const blankDeal: Omit<DealRoom, "id" | "type" | "assetClass" | "createdAt" | "updatedAt"> = {
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
  units: "",
  acres: "",
  zoning: "",
  propertyUse: "",
  sellerName: "",
  sellerPhone: "",
  sellerEmail: "",
  preferredContact: "VaultForge Message",
  bestTime: "Anytime",
  role: "Owner",
  urgency: "High",
  occupancy: "Unknown",
  access: "Unknown",
  knownIssues: "",
  routeTo: ["Buyer"],
  documents: [],
  aiNotes: "",
  photoName: "",
  photoUrl: "",
};

function money(value: string) {
  const clean = value.replace(/[^0-9.]/g, "");
  if (!clean) return "";
  const parts = clean.split(".");
  const whole = parts[0] || "";
  const decimal = parts[1] ? `.${parts[1].slice(0, 2)}` : "";
  return whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + decimal;
}

function readRooms(): DealRoom[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem("vaultforge_deal_rooms");
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeRooms(rooms: DealRoom[]) {
  window.localStorage.setItem("vaultforge_deal_rooms", JSON.stringify(rooms));
}

function Chip({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} style={active ? styles.chipActive : styles.chip}>
      {children}
    </button>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label style={styles.fieldWrap}>
      <span style={styles.fieldLabel}>{label}</span>
      <input
        value={value}
        type={type}
        placeholder={placeholder || label}
        onChange={(event) => onChange(event.target.value)}
        style={styles.input}
      />
    </label>
  );
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) {
  return (
    <label style={styles.fieldWrap}>
      <span style={styles.fieldLabel}>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} style={styles.input}>
        {options.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
    </label>
  );
}

function ToggleGroup({ title, items, selected, setSelected }: { title: string; items: string[]; selected: string[]; setSelected: (items: string[]) => void }) {
  function toggle(item: string) {
    if (selected.includes(item)) setSelected(selected.filter((entry) => entry !== item));
    else setSelected([...selected, item]);
  }

  return (
    <section style={styles.miniSection}>
      <div style={styles.sectionLabel}>{title}</div>
      <div style={styles.chipRow}>
        {items.map((item) => (
          <Chip key={item} active={selected.includes(item)} onClick={() => toggle(item)}>
            {item}
          </Chip>
        ))}
      </div>
    </section>
  );
}

export default function DealCreatePage() {
  const [assetClass, setAssetClass] = useState<AssetClass>("Residential");
  const [deal, setDeal] = useState({ ...blankDeal });
  const [toast, setToast] = useState<ToastState>({ show: false, kind: "success", title: "", message: "" });
  const [lastSavedId, setLastSavedId] = useState("");

  useEffect(() => {
    if (!toast.show) return;
    const timer = window.setTimeout(() => {
      setToast((current) => ({ ...current, show: false }));
    }, toast.kind === "success" ? 2800 : 5200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const aiRoomRead = useMemo(() => {
    const numbers = [deal.askingPrice && `ask $${deal.askingPrice}`, deal.arv && `ARV/value $${deal.arv}`, deal.repairs && `repairs/work $${deal.repairs}`]
      .filter(Boolean)
      .join(", ");
    const assetLine =
      assetClass === "Residential"
        ? `${deal.beds || "?"} beds / ${deal.baths || "?"} baths / ${deal.sqft || "?"} sqft`
        : assetClass === "Commercial"
          ? `${deal.units || "?"} units / ${deal.sqft || "?"} sqft / ${deal.propertyUse || "use not set"}`
          : `${deal.acres || "?"} acres / zoning ${deal.zoning || "not set"}`;

    return `Market: ${deal.city || "city needed"}, ${deal.county || "county needed"}, ${deal.state}. Numbers: ${numbers || "numbers needed"}. Best contact: ${deal.preferredContact} during ${deal.bestTime}. Submitter role: ${deal.role}. Needs routed to: ${deal.routeTo.join(", ") || "not selected"}. Urgency: ${deal.urgency}. Occupancy: ${deal.occupancy}. Known issues: ${deal.knownIssues || "None listed"}. ${assetClass} asset: ${assetLine}.`;
  }, [assetClass, deal]);

  function update(key: keyof typeof blankDeal, value: string | string[]) {
    setDeal((current) => ({ ...current, [key]: value }));
  }

  function showToast(kind: ToastKind, title: string, message: string) {
    setToast({ show: true, kind, title, message });
  }

  function handlePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("error", "Photo not accepted", "Please choose a photo file only.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setDeal((current) => ({ ...current, photoName: file.name, photoUrl: String(reader.result || "") }));
    };
    reader.onerror = () => showToast("error", "Photo error", "The photo could not be read. Try a smaller image.");
    reader.readAsDataURL(file);
  }

  function validate() {
    const missing: string[] = [];
    if (!deal.title.trim()) missing.push("Deal title");
    if (!deal.state.trim()) missing.push("State");
    if (!deal.city.trim()) missing.push("City");
    if (!deal.sellerName.trim()) missing.push("Contact name");
    if (!deal.sellerPhone.trim() && !deal.sellerEmail.trim()) missing.push("Phone or email");
    if (!deal.routeTo.length) missing.push("Route-to member type");
    return missing;
  }

  function saveDeal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const missing = validate();
    if (missing.length) {
      showToast("error", "Deal not saved", `Missing: ${missing.join(", ")}.`);
      return;
    }

    try {
      const now = new Date().toISOString();
      const room: DealRoom = {
        id: `deal-${Date.now()}`,
        type: "deal",
        assetClass,
        ...deal,
        aiNotes: deal.aiNotes || aiRoomRead,
        createdAt: now,
        updatedAt: now,
      };
      const rooms = readRooms();
      writeRooms([room, ...rooms]);
      setLastSavedId(room.id);
      showToast("success", "Deal saved", "Deal Room created. Open Deal Rooms to view it.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown browser save error.";
      showToast("error", "Save failed", message);
    }
  }

  return (
    <main style={styles.page}>
      <nav style={styles.nav}>
        <Link href="/command" style={styles.navLink}>Command</Link>
        <Link href="/deal-rooms" style={styles.navLink}>Deal Rooms</Link>
        <Link href="/pain-intake" style={styles.navLink}>Pain Intake</Link>
        <Link href="/pain-rooms" style={styles.navLink}>Pain Rooms</Link>
        <Link href="/messages" style={styles.navLink}>Messages</Link>
        <Link href="/profile" style={styles.navLink}>Profile</Link>
        <Link href="/saved-rooms" style={styles.navLink}>Saved</Link>
        <Link href="/archived-rooms" style={styles.navLink}>Archived</Link>
        <Link href="/deleted-rooms" style={styles.navLink}>Deleted</Link>
        <Link href="/" style={styles.exitLink}>Exit</Link>
      </nav>

      {toast.show ? (
        <div style={toast.kind === "success" ? styles.toastSuccess : styles.toastError}>
          <strong>{toast.title}</strong>
          <span>{toast.message}</span>
        </div>
      ) : null}

      <section style={styles.hero}>
        <div style={styles.eyebrow}>DEAL OPPORTUNITY</div>
        <h1 style={styles.title}>Bloomberg operator intake.</h1>
        <p style={styles.subtitle}>Residential, Commercial, and Land intake with contact controls, member routing, urgency, access, issues, photo upload, and AI-ready room data.</p>
      </section>

      <form onSubmit={saveDeal}>
        <section style={styles.card}>
          <div style={styles.sectionLabel}>ASSET CLASS</div>
          <div style={styles.chipRow}>
            {(["Residential", "Commercial", "Land"] as AssetClass[]).map((item) => (
              <Chip key={item} active={assetClass === item} onClick={() => setAssetClass(item)}>
                {item}
              </Chip>
            ))}
          </div>
        </section>

        <section style={styles.card}>
          <div style={styles.sectionLabel}>{assetClass.toUpperCase()} FORM</div>
          <div style={styles.photoBox}>
            {deal.photoUrl ? <img src={deal.photoUrl} alt="Deal preview" style={styles.photo} /> : <div style={styles.photoEmpty}>Upload deal photo</div>}
          </div>
          <input type="file" accept="image/*" onChange={handlePhoto} style={styles.fileInput} />

          <div style={styles.aiBox}>
            <div style={styles.sectionLabel}>AI ROOM READ</div>
            <p style={styles.aiText}>{aiRoomRead}</p>
          </div>

          <div style={styles.grid}>
            <Field label="Deal Title" value={deal.title} onChange={(value) => update("title", value)} placeholder="Adairsville Ho House" />
            <SelectField label="State" value={deal.state} onChange={(value) => update("state", value)} options={STATES} />
            <Field label="City" value={deal.city} onChange={(value) => update("city", value)} />
            <Field label="County" value={deal.county} onChange={(value) => update("county", value)} />
            <Field label="Asking Price" value={deal.askingPrice} onChange={(value) => update("askingPrice", money(value))} />
            <Field label="ARV / Value" value={deal.arv} onChange={(value) => update("arv", money(value))} />
            <Field label="Repairs / Work" value={deal.repairs} onChange={(value) => update("repairs", money(value))} />
            <Field label="Equity Spread" value={deal.equitySpread} onChange={(value) => update("equitySpread", money(value))} />
            {assetClass === "Residential" ? (
              <>
                <Field label="Beds" value={deal.beds} onChange={(value) => update("beds", value)} />
                <Field label="Baths" value={deal.baths} onChange={(value) => update("baths", value)} />
                <Field label="Sqft" value={deal.sqft} onChange={(value) => update("sqft", value)} />
              </>
            ) : null}
            {assetClass === "Commercial" ? (
              <>
                <Field label="Units" value={deal.units} onChange={(value) => update("units", value)} />
                <Field label="Sqft" value={deal.sqft} onChange={(value) => update("sqft", value)} />
                <SelectField label="Property Use" value={deal.propertyUse} onChange={(value) => update("propertyUse", value)} options={["", ...PROPERTY_USE]} />
              </>
            ) : null}
            {assetClass === "Land" ? (
              <>
                <Field label="Acres" value={deal.acres} onChange={(value) => update("acres", value)} />
                <Field label="Zoning" value={deal.zoning} onChange={(value) => update("zoning", value)} />
                <SelectField label="Property Use" value={deal.propertyUse} onChange={(value) => update("propertyUse", value)} options={["", ...PROPERTY_USE]} />
              </>
            ) : null}
            <Field label="Address / Location" value={deal.address} onChange={(value) => update("address", value)} />
            <Field label="Known Issues" value={deal.knownIssues} onChange={(value) => update("knownIssues", value)} />
            <Field label="AI / Deal Notes" value={deal.aiNotes} onChange={(value) => update("aiNotes", value)} />
          </div>
        </section>

        <section style={styles.card}>
          <div style={styles.sectionLabel}>CONTACT + CONTROL</div>
          <div style={styles.grid}>
            <Field label="Contact Name" value={deal.sellerName} onChange={(value) => update("sellerName", value)} />
            <Field label="Phone" value={deal.sellerPhone} onChange={(value) => update("sellerPhone", value)} />
            <Field label="Email" value={deal.sellerEmail} onChange={(value) => update("sellerEmail", value)} type="email" />
            <Field label="Assignment Fee / Spread" value={deal.equitySpread} onChange={(value) => update("equitySpread", money(value))} />
            <SelectField label="Best Contact" value={deal.preferredContact} onChange={(value) => update("preferredContact", value)} options={CONTACT_METHODS} />
            <SelectField label="Best Time" value={deal.bestTime} onChange={(value) => update("bestTime", value)} options={BEST_TIMES} />
            <SelectField label="Submitter Role" value={deal.role} onChange={(value) => update("role", value)} options={ROLES} />
            <SelectField label="Urgency" value={deal.urgency} onChange={(value) => update("urgency", value)} options={URGENCY} />
            <SelectField label="Occupancy" value={deal.occupancy} onChange={(value) => update("occupancy", value)} options={OCCUPANCY} />
            <SelectField label="Access" value={deal.access} onChange={(value) => update("access", value)} options={ACCESS} />
          </div>
        </section>

        <section style={styles.card}>
          <ToggleGroup title="ROUTE TO MEMBERS" items={ROUTE_TO} selected={deal.routeTo} setSelected={(items) => update("routeTo", items)} />
          <ToggleGroup title="AVAILABLE DOCUMENTS" items={DOCUMENTS} selected={deal.documents} setSelected={(items) => update("documents", items)} />
        </section>

        <section style={styles.saveCard}>
          <button type="submit" style={styles.saveButton}>Save Deal Room</button>
          <Link href="/deal-rooms" style={styles.secondaryButton}>Open Deal Rooms</Link>
          {lastSavedId ? <Link href={`/deal-rooms/${lastSavedId}`} style={styles.secondaryButton}>Open Last Saved Room</Link> : null}
        </section>
      </form>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#070a10",
    color: "#f8fafc",
    padding: "18px 20px 70px",
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
  },
  nav: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    padding: 12,
    margin: "0 auto 18px",
    maxWidth: 1180,
    border: "1px solid rgba(250, 204, 21, 0.18)",
    borderRadius: 24,
    background: "#090d1a",
  },
  navLink: {
    color: "#e5e7eb",
    textDecoration: "none",
    border: "1px solid rgba(148, 163, 184, 0.22)",
    borderRadius: 999,
    padding: "8px 12px",
    fontSize: 13,
    fontWeight: 800,
    background: "rgba(15, 23, 42, 0.95)",
  },
  exitLink: {
    color: "#fecaca",
    textDecoration: "none",
    border: "1px solid rgba(239, 68, 68, 0.45)",
    borderRadius: 999,
    padding: "8px 12px",
    fontSize: 13,
    fontWeight: 900,
    background: "rgba(127, 29, 29, 0.28)",
  },
  hero: {
    maxWidth: 1180,
    margin: "0 auto 22px",
    padding: "34px 36px",
    borderRadius: 28,
    border: "1px solid rgba(250, 204, 21, 0.20)",
    background: "linear-gradient(135deg, #0b1220, #050816)",
    boxShadow: "0 30px 80px rgba(0,0,0,0.35)",
  },
  eyebrow: {
    letterSpacing: 8,
    color: "#facc15",
    fontWeight: 950,
    fontSize: 14,
    marginBottom: 12,
  },
  title: {
    fontSize: "clamp(42px, 7vw, 86px)",
    lineHeight: 0.9,
    margin: 0,
    letterSpacing: -5,
    color: "#ffffff",
  },
  subtitle: {
    maxWidth: 900,
    color: "#cbd5e1",
    fontSize: 21,
    lineHeight: 1.45,
    marginTop: 22,
  },
  card: {
    maxWidth: 1180,
    margin: "0 auto 22px",
    padding: "28px 36px",
    borderRadius: 28,
    border: "1px solid rgba(250, 204, 21, 0.20)",
    background: "linear-gradient(135deg, #0b1220, #050816)",
  },
  saveCard: {
    maxWidth: 1180,
    margin: "0 auto 22px",
    padding: "28px 36px",
    borderRadius: 28,
    border: "1px solid rgba(250, 204, 21, 0.28)",
    background: "linear-gradient(135deg, rgba(250,204,21,0.08), #050816)",
    display: "flex",
    flexWrap: "wrap",
    gap: 12,
    alignItems: "center",
  },
  sectionLabel: {
    letterSpacing: 7,
    color: "#facc15",
    fontWeight: 950,
    fontSize: 14,
    marginBottom: 18,
  },
  miniSection: {
    marginBottom: 26,
  },
  chipRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
  },
  chip: {
    border: "1px solid rgba(148, 163, 184, 0.28)",
    background: "rgba(15, 23, 42, 0.98)",
    color: "#f8fafc",
    borderRadius: 999,
    padding: "11px 17px",
    fontWeight: 900,
  },
  chipActive: {
    border: "1px solid rgba(250, 204, 21, 0.80)",
    background: "linear-gradient(135deg, #fde68a, #facc15)",
    color: "#111827",
    borderRadius: 999,
    padding: "11px 17px",
    fontWeight: 950,
  },
  photoBox: {
    width: "100%",
    minHeight: 240,
    borderRadius: 24,
    border: "1px solid rgba(148, 163, 184, 0.26)",
    overflow: "hidden",
    background: "#111827",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  photo: {
    width: "100%",
    maxHeight: 420,
    objectFit: "cover",
    display: "block",
  },
  photoEmpty: {
    color: "#94a3b8",
    fontWeight: 900,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  fileInput: {
    marginBottom: 22,
    color: "#e5e7eb",
  },
  aiBox: {
    padding: 22,
    borderRadius: 22,
    border: "1px solid rgba(250, 204, 21, 0.18)",
    background: "rgba(15, 23, 42, 0.88)",
    marginBottom: 26,
  },
  aiText: {
    margin: 0,
    color: "#cbd5e1",
    fontSize: 17,
    lineHeight: 1.55,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: 14,
  },
  fieldWrap: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  fieldLabel: {
    color: "#facc15",
    fontWeight: 900,
    fontSize: 11,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  input: {
    width: "100%",
    minHeight: 54,
    borderRadius: 18,
    border: "1px solid rgba(148, 163, 184, 0.25)",
    background: "rgba(15, 23, 42, 0.90)",
    color: "#f8fafc",
    padding: "0 18px",
    fontSize: 16,
    outline: "none",
  },
  saveButton: {
    border: "0",
    borderRadius: 999,
    background: "linear-gradient(135deg, #fde68a, #facc15)",
    color: "#111827",
    padding: "14px 22px",
    fontWeight: 950,
    fontSize: 15,
  },
  secondaryButton: {
    border: "1px solid rgba(148, 163, 184, 0.30)",
    borderRadius: 999,
    background: "rgba(15, 23, 42, 0.95)",
    color: "#f8fafc",
    padding: "14px 22px",
    fontWeight: 900,
    fontSize: 15,
    textDecoration: "none",
  },
  toastSuccess: {
    position: "fixed",
    top: 18,
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 1000,
    display: "flex",
    flexDirection: "column",
    gap: 4,
    minWidth: 280,
    maxWidth: "calc(100vw - 32px)",
    padding: "14px 18px",
    borderRadius: 18,
    border: "1px solid rgba(34, 197, 94, 0.45)",
    background: "rgba(20, 83, 45, 0.96)",
    color: "#dcfce7",
    boxShadow: "0 24px 70px rgba(0,0,0,0.40)",
  },
  toastError: {
    position: "fixed",
    top: 18,
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 1000,
    display: "flex",
    flexDirection: "column",
    gap: 4,
    minWidth: 280,
    maxWidth: "calc(100vw - 32px)",
    padding: "14px 18px",
    borderRadius: 18,
    border: "1px solid rgba(239, 68, 68, 0.55)",
    background: "rgba(127, 29, 29, 0.96)",
    color: "#fee2e2",
    boxShadow: "0 24px 70px rgba(0,0,0,0.40)",
  },
};
