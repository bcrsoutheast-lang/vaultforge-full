"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import VaultForgeCleanShell from "../../components/VaultForgeCleanShell";
import VaultForgeRoomControls from "../../components/VaultForgeRoomControls";

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

function readPain(): Pain[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function money(value: string | undefined) {
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

function num(value: string | undefined) {
  const n = Number(String(value || "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function list(value?: string[]) {
  return value && value.length ? value.join(", ") : "Not selected";
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="vf-room-metric">
      <span>{label}</span>
      <strong>{value || "Not listed"}</strong>
    </div>
  );
}

export default function PainRoomDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [pain, setPain] = useState<Pain | null>(null);

  useEffect(() => {
    const found = readPain().find((item) => item.id === decodeURIComponent(params.id));
    setPain(found || null);
  }, [params.id]);

  const pressure = useMemo(() => {
    if (!pain) return null;

    let score = 35;

    if (pain.urgency?.includes("Emergency")) score += 35;
    else if (pain.urgency?.includes("High")) score += 25;
    else if (pain.urgency?.includes("Medium")) score += 12;

    if (pain.blockers?.includes("Capital")) score += 10;
    if (pain.blockers?.includes("Deadline")) score += 10;
    if (pain.blockers?.includes("Title")) score += 7;
    if (pain.blockers?.includes("Tenant")) score += 6;
    if (pain.deadline) score += 5;

    score = Math.min(99, score);

    const amountNeeded = num(pain.amountNeeded);
    const value = num(pain.propertyValue);
    const payoff = num(pain.payoff);
    const equity = value ? value - payoff : 0;

    const risk =
      score >= 85
        ? "Critical execution pressure"
        : score >= 70
          ? "High pressure"
          : score >= 50
            ? "Medium pressure"
            : "Monitor";

    return {
      score,
      amountNeeded,
      value,
      payoff,
      equity,
      risk,
    };
  }, [pain]);

  if (!pain) {
    return (
      <VaultForgeCleanShell
        active="pain-rooms"
        eyebrow="PAIN ROOM"
        title="Room not found."
        subtitle="This room was not found in local saved Pain Rooms. Go back to Pain Rooms and open a saved card."
      >
        <section className="vf-card red">
          <div className="vf-btns">
            <Link className="vf-btn" href="/pain-rooms">Back to Pain Rooms</Link>
            <Link className="vf-btn dark" href="/pain-intake">Submit Pain</Link>
          </div>
        </section>
      </VaultForgeCleanShell>
    );
  }

  return (
    <VaultForgeCleanShell
      active="pain-rooms"
      eyebrow="PAIN COMMAND ROOM"
      title={pain.title || "Pain Room"}
      subtitle="Execution pressure, contact controls, blockers, routing context, AI diagnosis, next steps, and room controls."
    >
      <style>{`
        .vf-room-hero-grid {
          display: grid;
          grid-template-columns: 360px minmax(0,1fr);
          gap: 18px;
        }

        .vf-room-photo {
          min-height: 320px;
          border-radius: 22px;
          overflow: hidden;
          border: 1px solid rgba(239,68,68,.30);
          background: rgba(127,29,29,.18);
          display: grid;
          place-items: center;
          color: #ef4444;
          font-weight: 950;
          font-size: 54px;
          text-align: center;
        }

        .vf-room-photo img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .vf-room-metrics {
          display: grid;
          grid-template-columns: repeat(auto-fit,minmax(170px,1fr));
          gap: 10px;
        }

        .vf-room-metric {
          border: 1px solid rgba(148,163,184,.16);
          background: rgba(255,255,255,.045);
          border-radius: 18px;
          padding: 14px;
        }

        .vf-room-metric span {
          display: block;
          color: #94a3b8;
          font-size: 11px;
          letter-spacing: .13em;
          text-transform: uppercase;
          font-weight: 900;
        }

        .vf-room-metric strong {
          display: block;
          color: #fff;
          font-size: 20px;
          margin-top: 6px;
          overflow-wrap: anywhere;
        }

        .vf-pressure-score {
          color: #ef4444;
          font-size: clamp(50px, 11vw, 104px);
          line-height: .85;
          letter-spacing: -.08em;
          margin: 0;
        }

        .vf-ai-panel {
          border: 1px solid rgba(239,68,68,.24);
          background: rgba(255,255,255,.045);
          border-radius: 20px;
          padding: 16px;
        }

        .vf-ai-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit,minmax(230px,1fr));
          gap: 12px;
        }

        @media(max-width:860px){
          .vf-room-hero-grid {
            grid-template-columns: 1fr;
          }

          .vf-room-photo {
            min-height: 230px;
          }
        }
      `}</style>

      <section className="vf-card red">
        <div className="vf-room-hero-grid">
          <div className="vf-room-photo">
            {pain.photo ? <img src={pain.photo} alt="" /> : "!"}
          </div>

          <div>
            <div className="vf-eyebrow" style={{ color: "#fca5a5" }}>
              {list(pain.painTypes)}
            </div>

            <h2 className="vf-h2">
              {[pain.city, pain.county, pain.state].filter(Boolean).join(", ") || "Market not listed"}
            </h2>

            <p className="vf-copy">
              {pain.notes ||
                "No situation notes listed yet. Add notes in Pain Intake to improve the execution read."}
            </p>

            <p className="vf-pressure-score">{pressure?.score || 0}</p>
            <p className="vf-copy" style={{ marginTop: 0 }}>{pressure?.risk}</p>

            <div className="vf-room-metrics">
              <Metric label="Amount Needed" value={money(pain.amountNeeded)} />
              <Metric label="Property Value" value={money(pain.propertyValue)} />
              <Metric label="Payoff / Debt" value={money(pain.payoff)} />
              <Metric label="Estimated Equity" value={pressure?.equity ? money(String(pressure.equity)) : "Not enough data"} />
              <Metric label="Deadline" value={pain.deadline || "Not listed"} />
              <Metric label="Urgency" value={list(pain.urgency)} />
            </div>

            <div className="vf-btns">
              <Link className="vf-btn" href={`/messages?room=${encodeURIComponent(pain.id)}`}>
                Message Room
              </Link>
              <Link className="vf-btn dark" href="/pain-rooms">
                Back to Pain Rooms
              </Link>
            </div>
          </div>
        </div>

        <VaultForgeRoomControls
          roomId={`pain:${pain.id}`}
          roomTitle={pain.title || "Pain Room"}
          roomType="pain"
        />
      </section>

      <section className="vf-card red">
        <div className="vf-eyebrow" style={{ color: "#fca5a5" }}>Contact + Authority</div>

        <div className="vf-room-metrics">
          <Metric label="Contact Name" value={pain.contactName || "Not listed"} />
          <Metric label="Phone" value={pain.contactPhone || "Not listed"} />
          <Metric label="Email" value={pain.contactEmail || "Not listed"} />
          <Metric label="Best Contact" value={list(pain.contactMethods)} />
          <Metric label="Best Time" value={list(pain.contactTimes)} />
          <Metric label="Authority" value={list(pain.authority)} />
          <Metric label="VaultForge Contact Matched Members" value={pain.canContactMatchedMembers || "Not selected"} />
        </div>
      </section>

      <section className="vf-card red">
        <div className="vf-eyebrow" style={{ color: "#fca5a5" }}>Blockers + Routing</div>

        <div className="vf-room-metrics">
          <Metric label="Pain Type" value={list(pain.painTypes)} />
          <Metric label="Blockers" value={list(pain.blockers)} />
          <Metric label="Routing Needs" value={list(pain.routingNeeds)} />
          <Metric label="Urgency" value={list(pain.urgency)} />
        </div>
      </section>

      <section className="vf-card red">
        <div className="vf-eyebrow" style={{ color: "#fca5a5" }}>AI Execution Read</div>

        <div className="vf-ai-grid">
          <div className="vf-ai-panel">
            <div className="vf-eyebrow" style={{ color: "#fca5a5" }}>What can be solved</div>
            <p className="vf-copy">
              {pain.routingNeeds?.length
                ? `This room should be routed to: ${pain.routingNeeds.join(", ")}.`
                : "Select routing needs in Pain Intake so VaultForge can match the right people."}
            </p>
          </div>

          <div className="vf-ai-panel">
            <div className="vf-eyebrow" style={{ color: "#fca5a5" }}>Execution risk</div>
            <p className="vf-copy">
              {pain.blockers?.length
                ? `Main blockers: ${pain.blockers.join(", ")}. These should be verified before promising a solution.`
                : "No blockers selected yet. Add blockers to improve AI routing and execution diagnosis."}
            </p>
          </div>

          <div className="vf-ai-panel">
            <div className="vf-eyebrow" style={{ color: "#fca5a5" }}>Next steps</div>
            <p className="vf-copy">
              Confirm authority, deadline, contact method, amount needed, property value, payoff, and who should be contacted. Keep follow-up inside the room thread.
            </p>
          </div>

          <div className="vf-ai-panel">
            <div className="vf-eyebrow" style={{ color: "#fca5a5" }}>Private AI Notes</div>
            <p className="vf-copy">{pain.privateAiNotes || "No private AI notes yet."}</p>
          </div>
        </div>
      </section>

      <section className="vf-card red">
        <div className="vf-eyebrow" style={{ color: "#fca5a5" }}>Matched Execution Profiles</div>

        <div className="vf-ai-grid">
          <div className="vf-ai-panel">
            <div className="vf-eyebrow" style={{ color: "#fca5a5" }}>Capital Fit</div>
            <p className="vf-copy">Match lenders, bridge capital, JV partners, or rescue funding based on gap amount, equity, timeline, and authority.</p>
          </div>

          <div className="vf-ai-panel">
            <div className="vf-eyebrow" style={{ color: "#fca5a5" }}>Operator Fit</div>
            <p className="vf-copy">Match operator, PM, contractor, city/permitting help, or boots-on-ground support based on blockers and location.</p>
          </div>

          <div className="vf-ai-panel">
            <div className="vf-eyebrow" style={{ color: "#fca5a5" }}>Buyer / Exit Fit</div>
            <p className="vf-copy">Match buyers or exit partners when the fastest solution is sale, assignment, refinance, or emergency exit.</p>
          </div>
        </div>
      </section>
    </VaultForgeCleanShell>
  );
}
