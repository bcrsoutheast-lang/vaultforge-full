"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import VaultForgeCleanShell from "../components/VaultForgeCleanShell";

const STATES = ["GA", "TN", "AL", "FL", "NC", "SC", "TX"];

const CONTACT_METHODS = ["Call", "Text", "Email", "VaultForge Message"];
const CONTACT_TIMES = ["Morning", "Midday", "Afternoon", "Evening", "Anytime"];
const SUBMITTER_ROLES = ["Owner", "Wholesaler", "Agent", "Partner", "Lender", "Operator", "Other"];
const CONTRACT_STATUS = ["Under Contract", "Direct to Seller", "Listed", "Verbal Agreement", "Researching", "Unknown"];
const OCCUPANCY = ["Vacant", "Tenant Occupied", "Owner Occupied", "Partially Occupied", "Unknown"];
const ACCESS = ["Lockbox", "By Appointment", "Drive By Only", "Tenant Notice Needed", "Owner Must Approve", "Unknown"];
const ADDRESS_VISIBILITY = ["Private Only", "Public Teaser", "Show After Approval", "Show After Unlock"];
const ROUTING_NEEDS = ["Buyer", "Lender", "JV Partner", "Contractor", "Operator", "Property Manager", "Attorney/Title", "Advice"];
const URGENCY = ["Low", "Medium", "High", "Emergency"];
const ISSUES = ["Title Issue", "Lien", "Probate", "Code Violation", "Tax Issue", "Tenant Issue", "Permit Issue", "Structural Concern", "None Known"];
const DOCS = ["More Photos Available", "Inspection Available", "Comps Available", "Repair Bid Available", "Title Work Available", "Contract Available", "Survey Available"];

type Deal = {
  id: string;
  type: string;
  photo: string;
  title: string;
  state: string;
  city: string;
  county: string;
  purchasePrice: string;
  arv: string;
  repairs: string;
  equitySpread: string;
  beds: string;
  baths: string;
  sqft: string;
  noi: string;
  capRate: string;
  tenantStatus: string;
  acres: string;
  zoning: string;
  utilities: string;
  notes: string;

  contactName: string;
  contactPhone: string;
  contactEmail: string;
  contactMethods: string[];
  contactTimes: string[];
  submitterRoles: string[];
  contractStatus: string[];
  assignmentFee: string;
  closeDate: string;
  occupancy: string[];
  access: string[];
  accessNotes: string;
  addressVisibility: string[];
  routingNeeds: string[];
  urgency: string[];
  canContactMatchedMembers: string;
  issues: string[];
  docs: string[];
  repairNotes: string;
  privateAiNotes: string;

  createdAt: string;
};

const STORAGE_KEY = "vaultforge_clean_deal_rooms_v1";

const emptyDeal: Deal = {
  id: "",
  type: "Residential",
  photo: "",
  title: "",
  state: "GA",
  city: "",
  county: "",
  purchasePrice: "",
  arv: "",
  repairs: "",
  equitySpread: "",
  beds: "",
  baths: "",
  sqft: "",
  noi: "",
  capRate: "",
  tenantStatus: "",
  acres: "",
  zoning: "",
  utilities: "",
  notes: "",

  contactName: "",
  contactPhone: "",
  contactEmail: "",
  contactMethods: [],
  contactTimes: [],
  submitterRoles: [],
  contractStatus: [],
  assignmentFee: "",
  closeDate: "",
  occupancy: [],
  access: [],
  accessNotes: "",
  addressVisibility: ["Private Only"],
  routingNeeds: [],
  urgency: [],
  canContactMatchedMembers: "Yes",
  issues: [],
  docs: [],
  repairNotes: "",
  privateAiNotes: "",

  createdAt: "",
};

function readDeals(): Deal[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeDeal(deal: Deal) {
  const deals = readDeals();
  const next = [deal, ...deals.filter((item) => item.id !== deal.id)];
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("vaultforge-deals-change"));
}

function money(value: string) {
  const clean = String(value || "").trim();
  if (!clean) return "Not listed";
  if (clean.includes("$")) return clean;

  const n = Number(clean.replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(n) || n <= 0) return clean;

  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function ChipGroup({
  label,
  items,
  selected,
  onToggle,
  note,
}: {
  label: string;
  items: string[];
  selected: string[];
  onToggle: (item: string) => void;
  note?: string;
}) {
  return (
    <section className="vf-chip-section">
      <div className="vf-chip-label">{label}</div>
      {note ? <p className="vf-chip-note">{note}</p> : null}
      <div className="vf-chip-row">
        {items.map((item) => {
          const active = selected.includes(item);

          return (
            <button
              key={item}
              type="button"
              onClick={() => onToggle(item)}
              className={active ? "vf-chip active" : "vf-chip"}
            >
              {item}
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default function DealCreatePage() {
  const [deal, setDeal] = useState<Deal>(emptyDeal);
  const [saved, setSaved] = useState("");

  function update<K extends keyof Deal>(key: K, value: Deal[K]) {
    setDeal((current) => ({ ...current, [key]: value }));
    setSaved("");
  }

  function toggle(key: keyof Deal, item: string) {
    const current = Array.isArray(deal[key]) ? (deal[key] as string[]) : [];
    const next = current.includes(item)
      ? current.filter((value) => value !== item)
      : [...current, item];

    update(key as any, next as any);
  }

  function setType(type: string) {
    setDeal((current) => ({ ...current, type }));
    setSaved("");
  }

  function photoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        update("photo", reader.result);
      }
    };

    reader.readAsDataURL(file);
  }

  function saveDeal() {
    const now = new Date().toISOString();
    const next: Deal = {
      ...deal,
      id: deal.id || `deal-${Date.now()}`,
      title: deal.title || `${deal.type} Opportunity`,
      createdAt: deal.createdAt || now,
    };

    writeDeal(next);
    setDeal(next);
    setSaved("Deal saved locally. It now has contact/routing data for members and smart AI matching.");
  }

  const aiRead = useMemo(() => {
    const parts = [
      deal.city || deal.county || deal.state
        ? `Market: ${[deal.city, deal.county, deal.state].filter(Boolean).join(", ")}.`
        : "",
      deal.purchasePrice || deal.arv || deal.repairs
        ? `Numbers: ask ${money(deal.purchasePrice)}, ARV/value ${money(deal.arv)}, repairs/work ${money(deal.repairs)}.`
        : "",
      deal.contactMethods.length
        ? `Best contact: ${deal.contactMethods.join(", ")}${deal.contactTimes.length ? ` during ${deal.contactTimes.join(", ")}` : ""}.`
        : "",
      deal.submitterRoles.length ? `Submitter role: ${deal.submitterRoles.join(", ")}.` : "",
      deal.routingNeeds.length ? `Needs routed to: ${deal.routingNeeds.join(", ")}.` : "",
      deal.urgency.length ? `Urgency: ${deal.urgency.join(", ")}.` : "",
      deal.occupancy.length ? `Occupancy: ${deal.occupancy.join(", ")}.` : "",
      deal.issues.length ? `Known issues: ${deal.issues.join(", ")}.` : "",
      deal.type === "Residential" && (deal.beds || deal.baths || deal.sqft)
        ? `Residential asset: ${deal.beds || "?"} beds / ${deal.baths || "?"} baths / ${deal.sqft || "?"} sqft.`
        : "",
      deal.type === "Commercial" && (deal.noi || deal.capRate || deal.tenantStatus)
        ? `Commercial read: NOI ${deal.noi || "not listed"}, cap ${deal.capRate || "not listed"}, tenant status ${deal.tenantStatus || "not listed"}.`
        : "",
      deal.type === "Land" && (deal.acres || deal.zoning || deal.utilities)
        ? `Land read: ${deal.acres || "?"} acres, zoning ${deal.zoning || "not listed"}, utilities ${deal.utilities || "not listed"}.`
        : "",
      deal.notes ? `Operator notes: ${deal.notes}` : "",
      deal.privateAiNotes ? `Private AI notes: ${deal.privateAiNotes}` : "",
    ].filter(Boolean);

    return parts.length
      ? parts.join(" ")
      : "Fill the form and click routing fields to generate the operator read for this opportunity.";
  }, [deal]);

  return (
    <VaultForgeCleanShell
      active="deals"
      eyebrow="DEAL OPPORTUNITY"
      title="Bloomberg operator intake."
      subtitle="Residential, Commercial, and Land intake with contact controls, member routing, urgency, access, issues, photo upload, and AI-ready room data."
    >
      <section className="vf-card">
        <div className="vf-eyebrow">ASSET CLASS</div>

        <div className="vf-chip-row">
          {["Residential", "Commercial", "Land"].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setType(item)}
              className={deal.type === item ? "vf-chip active" : "vf-chip"}
            >
              {item}
            </button>
          ))}
        </div>
      </section>

      <section className="vf-card">
        <div className="vf-eyebrow">{deal.type.toUpperCase()} FORM</div>

        <div className="vf-deal-grid">
          <div>
            <div className="vf-photo-box">
              {deal.photo ? (
                <img src={deal.photo} alt="" />
              ) : (
                <div>Upload property image</div>
              )}
            </div>

            <input
              type="file"
              accept="image/*"
              onChange={photoUpload}
              style={{ marginTop: 12, color: "#fff", width: "100%" }}
            />

            <section className="vf-preview">
              <div className="vf-eyebrow">AI ROOM READ</div>
              <p className="vf-copy">{aiRead}</p>
            </section>
          </div>

          <div className="vf-fields">
            <input placeholder="Deal Title" value={deal.title} onChange={(e) => update("title", e.target.value)} />

            <select value={deal.state} onChange={(e) => update("state", e.target.value)}>
              {STATES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>

            <input placeholder="City" value={deal.city} onChange={(e) => update("city", e.target.value)} />
            <input placeholder="County" value={deal.county} onChange={(e) => update("county", e.target.value)} />
            <input placeholder="Purchase Price" value={deal.purchasePrice} onChange={(e) => update("purchasePrice", e.target.value)} />
            <input placeholder="ARV / Exit Value" value={deal.arv} onChange={(e) => update("arv", e.target.value)} />
            <input placeholder="Repair Estimate" value={deal.repairs} onChange={(e) => update("repairs", e.target.value)} />
            <input placeholder="Equity Spread" value={deal.equitySpread} onChange={(e) => update("equitySpread", e.target.value)} />

            {deal.type === "Residential" && (
              <>
                <input placeholder="Beds" value={deal.beds} onChange={(e) => update("beds", e.target.value)} />
                <input placeholder="Baths" value={deal.baths} onChange={(e) => update("baths", e.target.value)} />
                <input placeholder="SQFT" value={deal.sqft} onChange={(e) => update("sqft", e.target.value)} />
              </>
            )}

            {deal.type === "Commercial" && (
              <>
                <input placeholder="NOI" value={deal.noi} onChange={(e) => update("noi", e.target.value)} />
                <input placeholder="Cap Rate" value={deal.capRate} onChange={(e) => update("capRate", e.target.value)} />
                <input placeholder="Tenant Status" value={deal.tenantStatus} onChange={(e) => update("tenantStatus", e.target.value)} />
              </>
            )}

            {deal.type === "Land" && (
              <>
                <input placeholder="Acres" value={deal.acres} onChange={(e) => update("acres", e.target.value)} />
                <input placeholder="Zoning" value={deal.zoning} onChange={(e) => update("zoning", e.target.value)} />
                <input placeholder="Utilities" value={deal.utilities} onChange={(e) => update("utilities", e.target.value)} />
              </>
            )}

            <textarea
              placeholder="AI / Deal Notes"
              rows={5}
              value={deal.notes}
              onChange={(e) => update("notes", e.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="vf-card">
        <div className="vf-eyebrow">CONTACT + CONTROL</div>

        <div className="vf-fields">
          <input placeholder="Contact Name" value={deal.contactName} onChange={(e) => update("contactName", e.target.value)} />
          <input placeholder="Contact Phone" value={deal.contactPhone} onChange={(e) => update("contactPhone", e.target.value)} />
          <input placeholder="Contact Email" value={deal.contactEmail} onChange={(e) => update("contactEmail", e.target.value)} />
          <input placeholder="Assignment Fee / Spread" value={deal.assignmentFee} onChange={(e) => update("assignmentFee", e.target.value)} />
          <input placeholder="Deadline / Close Date" value={deal.closeDate} onChange={(e) => update("closeDate", e.target.value)} />
        </div>

        <ChipGroup label="Best Way To Be Contacted" items={CONTACT_METHODS} selected={deal.contactMethods} onToggle={(item) => toggle("contactMethods", item)} />
        <ChipGroup label="Best Time To Contact" items={CONTACT_TIMES} selected={deal.contactTimes} onToggle={(item) => toggle("contactTimes", item)} />
        <ChipGroup label="Submitter Role" items={SUBMITTER_ROLES} selected={deal.submitterRoles} onToggle={(item) => toggle("submitterRoles", item)} />
        <ChipGroup label="Contract / Control Status" items={CONTRACT_STATUS} selected={deal.contractStatus} onToggle={(item) => toggle("contractStatus", item)} />
        <ChipGroup label="Occupancy" items={OCCUPANCY} selected={deal.occupancy} onToggle={(item) => toggle("occupancy", item)} />
        <ChipGroup label="Access" items={ACCESS} selected={deal.access} onToggle={(item) => toggle("access", item)} />
        <ChipGroup label="Address Visibility" items={ADDRESS_VISIBILITY} selected={deal.addressVisibility} onToggle={(item) => toggle("addressVisibility", item)} />
      </section>

      <section className="vf-card">
        <div className="vf-eyebrow">MEMBER ROUTING + SMART AI</div>

        <ChipGroup
          label="Who Should VaultForge Route This To?"
          items={ROUTING_NEEDS}
          selected={deal.routingNeeds}
          onToggle={(item) => toggle("routingNeeds", item)}
          note="Members need enough information to know if they are buyer, capital, contractor, operator, title/legal, or advice fit."
        />

        <ChipGroup label="Urgency" items={URGENCY} selected={deal.urgency} onToggle={(item) => toggle("urgency", item)} />
        <ChipGroup label="Known Issues" items={ISSUES} selected={deal.issues} onToggle={(item) => toggle("issues", item)} />
        <ChipGroup label="Available Documents / Proof" items={DOCS} selected={deal.docs} onToggle={(item) => toggle("docs", item)} />

        <div className="vf-chip-section">
          <div className="vf-chip-label">Can VaultForge Contact Matched Members?</div>
          <div className="vf-chip-row">
            {["Yes", "No", "Ask Me First"].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => update("canContactMatchedMembers", item)}
                className={deal.canContactMatchedMembers === item ? "vf-chip active" : "vf-chip"}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="vf-fields">
          <textarea
            placeholder="Access Instructions"
            rows={4}
            value={deal.accessNotes}
            onChange={(e) => update("accessNotes", e.target.value)}
          />
          <textarea
            placeholder="Repair Notes / Scope"
            rows={4}
            value={deal.repairNotes}
            onChange={(e) => update("repairNotes", e.target.value)}
          />
          <textarea
            placeholder="Private AI Matching Notes"
            rows={4}
            value={deal.privateAiNotes}
            onChange={(e) => update("privateAiNotes", e.target.value)}
          />
        </div>

        <div className="vf-btns">
          <button type="button" className="vf-btn" onClick={saveDeal}>
            Save Deal Opportunity
          </button>

          <Link className="vf-btn dark" href="/deal-rooms">
            Back to Deal Rooms
          </Link>
        </div>

        {saved ? <p className="vf-copy" style={{ color: "#86efac" }}>{saved}</p> : null}
      </section>

      <style>{`
        .vf-deal-grid {
          display: grid;
          grid-template-columns: 320px minmax(0, 1fr);
          gap: 18px;
        }

        .vf-photo-box {
          height: 260px;
          border-radius: 20px;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,.14);
          background: rgba(255,255,255,.05);
          display: grid;
          place-items: center;
          color: #cbd5e1;
          font-weight: 900;
          text-align: center;
        }

        .vf-photo-box img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .vf-preview {
          border: 1px solid rgba(245,200,76,.18);
          background: rgba(255,255,255,.045);
          border-radius: 18px;
          padding: 14px;
          margin-top: 14px;
        }

        .vf-fields {
          display: grid;
          grid-template-columns: repeat(auto-fit,minmax(220px,1fr));
          gap: 12px;
          margin-top: 12px;
        }

        .vf-fields input,
        .vf-fields select,
        .vf-fields textarea {
          width: 100%;
          box-sizing: border-box;
          border: 1px solid rgba(255,255,255,.15);
          background: rgba(255,255,255,.05);
          color: #fff;
          border-radius: 16px;
          padding: 14px;
          font-size: 15px;
        }

        .vf-fields textarea {
          min-height: 110px;
          resize: vertical;
        }

        .vf-chip-section {
          margin-top: 18px;
        }

        .vf-chip-label {
          color: #f5c84c;
          font-size: 12px;
          font-weight: 950;
          letter-spacing: .14em;
          text-transform: uppercase;
          margin-bottom: 8px;
        }

        .vf-chip-note {
          color: #cbd5e1;
          font-size: 13px;
          line-height: 1.4;
          margin: -2px 0 10px;
        }

        .vf-chip-row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .vf-chip {
          border: 1px solid rgba(255,255,255,.15);
          background: rgba(255,255,255,.05);
          color: #fff;
          border-radius: 999px;
          padding: 10px 12px;
          font-weight: 900;
          cursor: pointer;
        }

        .vf-chip.active {
          border-color: #f5c84c;
          background: linear-gradient(135deg,#fde68a,#e8c46b);
          color: #111827;
        }

        @media (max-width: 820px) {
          .vf-deal-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </VaultForgeCleanShell>
  );
}