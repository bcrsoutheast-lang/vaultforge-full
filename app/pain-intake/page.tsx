"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import VaultForgeCleanShell from "../components/VaultForgeCleanShell";

const STATES = ["GA", "TN", "AL", "FL", "NC", "SC", "TX"];
const PAIN_TYPES = ["Distressed Seller", "Funding Gap", "Stalled Construction", "Operator Needed", "Emergency Exit", "Permit / City Issue", "Tenant / Occupancy Issue", "Partnership Issue", "Contractor Problem", "Lender Problem"];
const CONTACT_METHODS = ["Call", "Text", "Email", "VaultForge Message"];
const CONTACT_TIMES = ["Morning", "Midday", "Afternoon", "Evening", "Anytime"];
const URGENCY = ["Low", "Medium", "High", "Emergency"];
const ROUTING_NEEDS = ["Buyer", "Lender", "JV Partner", "Contractor", "Operator", "Property Manager", "Attorney/Title", "Advice"];
const BLOCKERS = ["Capital", "Construction", "Title", "Tenant", "City / Permit", "Insurance", "Partner", "Deadline", "Unknown"];
const AUTHORITY = ["Owner", "Agent", "Wholesaler", "Partner", "Family", "Lender", "Other"];

type Pain = {
  id: string;
  photo: string;
  title: string;
  state: string;
  city: string;
  county: string;
  painTypes: string[];
  urgency: string[];
  blockers: string[];
  routingNeeds: string[];
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  contactMethods: string[];
  contactTimes: string[];
  authority: string[];
  deadline: string;
  amountNeeded: string;
  propertyValue: string;
  payoff: string;
  notes: string;
  privateAiNotes: string;
  canContactMatchedMembers: string;
  createdAt: string;
};

const STORAGE_KEY = "vaultforge_clean_pain_rooms_v1";

const emptyPain: Pain = {
  id: "",
  photo: "",
  title: "",
  state: "GA",
  city: "",
  county: "",
  painTypes: [],
  urgency: [],
  blockers: [],
  routingNeeds: [],
  contactName: "",
  contactPhone: "",
  contactEmail: "",
  contactMethods: [],
  contactTimes: [],
  authority: [],
  deadline: "",
  amountNeeded: "",
  propertyValue: "",
  payoff: "",
  notes: "",
  privateAiNotes: "",
  canContactMatchedMembers: "Yes",
  createdAt: "",
};

function readPain(): Pain[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writePain(pain: Pain) {
  const rooms = readPain();
  const next = [pain, ...rooms.filter((item) => item.id !== pain.id)];
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("vaultforge-pain-change"));
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

export default function PainIntakePage() {
  const [pain, setPain] = useState<Pain>(emptyPain);
  const [saved, setSaved] = useState("");

  function update<K extends keyof Pain>(key: K, value: Pain[K]) {
    setPain((current) => ({ ...current, [key]: value }));
    setSaved("");
  }

  function toggle(key: keyof Pain, item: string) {
    const current = Array.isArray(pain[key]) ? (pain[key] as string[]) : [];
    const next = current.includes(item)
      ? current.filter((value) => value !== item)
      : [...current, item];

    update(key as any, next as any);
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

  function savePain() {
    const now = new Date().toISOString();
    const next: Pain = {
      ...pain,
      id: pain.id || `pain-${Date.now()}`,
      title: pain.title || `${pain.painTypes[0] || "Pain"} Room`,
      createdAt: pain.createdAt || now,
    };

    writePain(next);
    setPain(next);
    setSaved("Pain Room saved locally. It now has contact, urgency, blockers, routing, and smart AI data.");
  }

  const aiRead = useMemo(() => {
    const parts = [
      pain.city || pain.county || pain.state ? `Market: ${[pain.city, pain.county, pain.state].filter(Boolean).join(", ")}.` : "",
      pain.painTypes.length ? `Pain type: ${pain.painTypes.join(", ")}.` : "",
      pain.urgency.length ? `Urgency: ${pain.urgency.join(", ")}.` : "",
      pain.blockers.length ? `Blockers: ${pain.blockers.join(", ")}.` : "",
      pain.routingNeeds.length ? `Needs routed to: ${pain.routingNeeds.join(", ")}.` : "",
      pain.amountNeeded ? `Amount needed: ${money(pain.amountNeeded)}.` : "",
      pain.deadline ? `Deadline: ${pain.deadline}.` : "",
      pain.contactMethods.length ? `Best contact: ${pain.contactMethods.join(", ")}.` : "",
      pain.notes ? `Situation: ${pain.notes}` : "",
      pain.privateAiNotes ? `Private AI notes: ${pain.privateAiNotes}` : "",
    ].filter(Boolean);

    return parts.length
      ? parts.join(" ")
      : "Fill the pain intake and click routing fields to generate the execution read.";
  }, [pain]);

  return (
    <VaultForgeCleanShell
      active="pain-intake"
      eyebrow="PAIN INTAKE"
      title="Submit the pressure."
      subtitle="Pain Intake creates Pain Rooms with contact, urgency, blockers, routing needs, and AI-ready execution data."
    >
      <section className="vf-card red">
        <div className="vf-eyebrow" style={{ color: "#fca5a5" }}>PAIN ROOM BASICS</div>

        <div className="vf-pain-grid">
          <div>
            <div className="vf-photo-box">
              {pain.photo ? <img src={pain.photo} alt="" /> : <div>Upload pain / property image</div>}
            </div>

            <input
              type="file"
              accept="image/*"
              onChange={photoUpload}
              style={{ marginTop: 12, color: "#fff", width: "100%" }}
            />

            <section className="vf-preview">
              <div className="vf-eyebrow" style={{ color: "#fca5a5" }}>AI EXECUTION READ</div>
              <p className="vf-copy">{aiRead}</p>
            </section>
          </div>

          <div className="vf-fields">
            <input placeholder="Pain Room Title" value={pain.title} onChange={(e) => update("title", e.target.value)} />

            <select value={pain.state} onChange={(e) => update("state", e.target.value)}>
              {STATES.map((s) => <option key={s}>{s}</option>)}
            </select>

            <input placeholder="City" value={pain.city} onChange={(e) => update("city", e.target.value)} />
            <input placeholder="County" value={pain.county} onChange={(e) => update("county", e.target.value)} />
            <input placeholder="Amount Needed / Gap" value={pain.amountNeeded} onChange={(e) => update("amountNeeded", e.target.value)} />
            <input placeholder="Property Value / ARV" value={pain.propertyValue} onChange={(e) => update("propertyValue", e.target.value)} />
            <input placeholder="Payoff / Debt" value={pain.payoff} onChange={(e) => update("payoff", e.target.value)} />
            <input placeholder="Deadline / Date Pressure" value={pain.deadline} onChange={(e) => update("deadline", e.target.value)} />

            <textarea placeholder="What is happening?" rows={5} value={pain.notes} onChange={(e) => update("notes", e.target.value)} />
          </div>
        </div>
      </section>

      <section className="vf-card red">
        <div className="vf-eyebrow" style={{ color: "#fca5a5" }}>CONTACT + AUTHORITY</div>

        <div className="vf-fields">
          <input placeholder="Contact Name" value={pain.contactName} onChange={(e) => update("contactName", e.target.value)} />
          <input placeholder="Contact Phone" value={pain.contactPhone} onChange={(e) => update("contactPhone", e.target.value)} />
          <input placeholder="Contact Email" value={pain.contactEmail} onChange={(e) => update("contactEmail", e.target.value)} />
        </div>

        <ChipGroup label="Best Way To Be Contacted" items={CONTACT_METHODS} selected={pain.contactMethods} onToggle={(item) => toggle("contactMethods", item)} />
        <ChipGroup label="Best Time To Contact" items={CONTACT_TIMES} selected={pain.contactTimes} onToggle={(item) => toggle("contactTimes", item)} />
        <ChipGroup label="Authority / Relationship" items={AUTHORITY} selected={pain.authority} onToggle={(item) => toggle("authority", item)} />
      </section>

      <section className="vf-card red">
        <div className="vf-eyebrow" style={{ color: "#fca5a5" }}>ROUTING + SMART AI</div>

        <ChipGroup label="Pain Type" items={PAIN_TYPES} selected={pain.painTypes} onToggle={(item) => toggle("painTypes", item)} />
        <ChipGroup label="Urgency" items={URGENCY} selected={pain.urgency} onToggle={(item) => toggle("urgency", item)} />
        <ChipGroup label="Main Blockers" items={BLOCKERS} selected={pain.blockers} onToggle={(item) => toggle("blockers", item)} />
        <ChipGroup label="Who Should VaultForge Route This To?" items={ROUTING_NEEDS} selected={pain.routingNeeds} onToggle={(item) => toggle("routingNeeds", item)} />

        <div className="vf-chip-section">
          <div className="vf-chip-label">Can VaultForge Contact Matched Members?</div>
          <div className="vf-chip-row">
            {["Yes", "No", "Ask Me First"].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => update("canContactMatchedMembers", item)}
                className={pain.canContactMatchedMembers === item ? "vf-chip active" : "vf-chip"}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="vf-fields">
          <textarea
            placeholder="Private AI Matching Notes"
            rows={4}
            value={pain.privateAiNotes}
            onChange={(e) => update("privateAiNotes", e.target.value)}
          />
        </div>

        <div className="vf-btns">
          <button type="button" className="vf-btn" onClick={savePain}>
            Save Pain Room
          </button>

          <Link className="vf-btn dark" href="/pain-rooms">
            Back to Pain Rooms
          </Link>
        </div>

        {saved ? <p className="vf-copy" style={{ color: "#86efac" }}>{saved}</p> : null}
      </section>

      <style>{`
        .vf-pain-grid {
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
          border: 1px solid rgba(239,68,68,.24);
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
          grid-column: 1 / -1;
        }

        .vf-chip-section {
          margin-top: 18px;
        }

        .vf-chip-label {
          color: #fca5a5;
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
          border-color: #fca5a5;
          background: linear-gradient(135deg,#fecaca,#ef4444);
          color: #111827;
        }

        @media (max-width: 820px) {
          .vf-pain-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </VaultForgeCleanShell>
  );
}