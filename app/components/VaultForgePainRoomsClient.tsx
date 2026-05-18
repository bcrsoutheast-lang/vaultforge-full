"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import VaultForgeRoomControls from "./VaultForgeRoomControls";

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
  amountNeeded: string;
  propertyValue: string;
  payoff: string;
  notes: string;
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

function PainCard({ pain }: { pain: Pain }) {
  const pressure = pain.urgency?.includes("Emergency") ? "98" : pain.urgency?.includes("High") ? "88" : pain.urgency?.includes("Medium") ? "66" : "42";

  return (
    <article className="vf-pain-card">
      <div className="vf-pain-line" />

      <div className="vf-pain-photo">
        {pain.photo ? <img src={pain.photo} alt="" /> : <span>!</span>}
      </div>

      <div>
        <div className="vf-pain-top">
          <div>
            <div className="vf-eyebrow" style={{ color: "#fca5a5" }}>Pain Room</div>
            <h2 className="vf-h2" style={{ marginBottom: 6 }}>
              {pain.title || "Untitled Pain Room"}
            </h2>
            <p className="vf-copy" style={{ marginTop: 0 }}>
              {[pain.city, pain.county, pain.state].filter(Boolean).join(", ") || "Market not listed"}
            </p>
          </div>

          <div className="vf-pressure-box">
            <strong>{pressure}</strong>
            <span>Pressure</span>
          </div>
        </div>

        <div className="vf-pills">
          <span>{pain.painTypes?.join(", ") || "Pain type not selected"}</span>
          <span>{pain.urgency?.join(", ") || "Urgency not selected"}</span>
          <span>{money(pain.amountNeeded)}</span>
        </div>

        <section className="vf-read-box">
          <div className="vf-eyebrow" style={{ color: "#fca5a5" }}>AI Execution Read</div>
          <p className="vf-copy">
            {pain.notes ||
              `Blockers: ${pain.blockers?.join(", ") || "not selected"}. Routing: ${pain.routingNeeds?.join(", ") || "not selected"}.`}
          </p>
        </section>

        <div className="vf-btns">
          <Link className="vf-btn" href={`/pain-rooms/${encodeURIComponent(pain.id)}`}>
            Open Room
          </Link>

          <Link className="vf-btn dark" href={`/messages?room=${encodeURIComponent(pain.id)}`}>
            Message
          </Link>
        </div>

        <VaultForgeRoomControls
          roomId={`pain:${pain.id}`}
          roomTitle={pain.title || "Pain Room"}
          roomType="pain"
        />
      </div>
    </article>
  );
}

export default function VaultForgePainRoomsClient() {
  const [rooms, setRooms] = useState<Pain[]>([]);

  function refresh() {
    setRooms(readPain());
  }

  useEffect(() => {
    refresh();
    window.addEventListener("vaultforge-pain-change", refresh);
    return () => window.removeEventListener("vaultforge-pain-change", refresh);
  }, []);

  const metrics = useMemo(() => {
    return {
      active: rooms.length,
      emergency: rooms.filter((room) => room.urgency?.includes("Emergency")).length,
      high: rooms.filter((room) => room.urgency?.includes("High")).length,
      capital: rooms.filter((room) => room.blockers?.includes("Capital")).length,
    };
  }, [rooms]);

  return (
    <>
      <style>{`
        .vf-pain-card {
          border: 1px solid rgba(239,68,68,.30);
          background:
            radial-gradient(circle at top right, rgba(239,68,68,.15), transparent 28%),
            linear-gradient(145deg, rgba(35,8,8,.96), rgba(2,6,23,.99));
          border-radius: 24px;
          padding: 14px;
          display: grid;
          grid-template-columns: 180px minmax(0, 1fr);
          gap: 16px;
        }

        .vf-pain-line {
          grid-column: 1 / -1;
          height: 4px;
          border-radius: 999px;
          background: linear-gradient(90deg,#ef4444,transparent);
        }

        .vf-pain-photo {
          min-height: 160px;
          border-radius: 18px;
          overflow: hidden;
          border: 1px solid rgba(239,68,68,.25);
          background: rgba(127,29,29,.18);
          display: grid;
          place-items: center;
          color: #ef4444;
          font-size: 52px;
          font-weight: 950;
        }

        .vf-pain-photo img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .vf-pain-top {
          display: flex;
          justify-content: space-between;
          gap: 14px;
        }

        .vf-pressure-box {
          text-align: right;
          flex: 0 0 auto;
        }

        .vf-pressure-box strong {
          display: block;
          color: #ef4444;
          font-size: 34px;
          line-height: 1;
          letter-spacing: -.05em;
        }

        .vf-pressure-box span {
          display: block;
          color: #fecaca;
          font-size: 11px;
          letter-spacing: .14em;
          text-transform: uppercase;
          font-weight: 900;
          margin-top: 5px;
        }

        .vf-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 12px;
        }

        .vf-pills span {
          border: 1px solid rgba(239,68,68,.22);
          background: rgba(127,29,29,.18);
          color: #fee2e2;
          border-radius: 999px;
          padding: 7px 10px;
          font-size: 12px;
          font-weight: 850;
        }

        .vf-read-box {
          border: 1px solid rgba(239,68,68,.24);
          background: rgba(255,255,255,.045);
          border-radius: 18px;
          padding: 14px;
          margin-top: 14px;
        }

        @media(max-width:780px){
          .vf-pain-card {
            grid-template-columns: 1fr;
          }

          .vf-pain-photo {
            height: 210px;
          }

          .vf-pain-top {
            display: block;
          }

          .vf-pressure-box {
            text-align: left;
            margin-top: 10px;
          }
        }
      `}</style>

      <section className="vf-grid">
        <div className="vf-metric"><span>Active rooms</span><strong>{metrics.active}</strong></div>
        <div className="vf-metric"><span>Emergency</span><strong>{metrics.emergency}</strong></div>
        <div className="vf-metric"><span>High Urgency</span><strong>{metrics.high}</strong></div>
        <div className="vf-metric"><span>Capital Blockers</span><strong>{metrics.capital}</strong></div>
      </section>

      <section className="vf-card red">
        <div className="vf-eyebrow" style={{ color: "#fca5a5" }}>Active Pain Rooms</div>

        {!rooms.length ? (
          <p className="vf-copy">
            No saved Pain Rooms yet. Use Pain Intake to create the first clean pressure room.
          </p>
        ) : null}

        <div style={{ display: "grid", gap: 14 }}>
          {rooms.map((room) => (
            <PainCard key={room.id} pain={room} />
          ))}
        </div>
      </section>
    </>
  );
}