"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import VaultForgeRoomControls from "./VaultForgeRoomControls";

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
  createdAt: string;
};

const STORAGE_KEY = "vaultforge_clean_deal_rooms_v1";

function readDeals(): Deal[] {
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

function buildRead(deal: Deal) {
  const parts = [
    deal.city || deal.county || deal.state
      ? `Market: ${[deal.city, deal.county, deal.state].filter(Boolean).join(", ")}.`
      : "",
    deal.purchasePrice || deal.arv || deal.repairs
      ? `Numbers: ask ${money(deal.purchasePrice)}, ARV/value ${money(deal.arv)}, repairs/work ${money(deal.repairs)}.`
      : "",
    deal.type === "Residential" && (deal.beds || deal.baths || deal.sqft)
      ? `Residential: ${deal.beds || "?"} beds / ${deal.baths || "?"} baths / ${deal.sqft || "?"} sqft.`
      : "",
    deal.type === "Commercial" && (deal.noi || deal.capRate || deal.tenantStatus)
      ? `Commercial: NOI ${deal.noi || "not listed"}, cap ${deal.capRate || "not listed"}, tenant ${deal.tenantStatus || "not listed"}.`
      : "",
    deal.type === "Land" && (deal.acres || deal.zoning || deal.utilities)
      ? `Land: ${deal.acres || "?"} acres, zoning ${deal.zoning || "not listed"}, utilities ${deal.utilities || "not listed"}.`
      : "",
    deal.notes ? `Operator notes: ${deal.notes}` : "",
  ].filter(Boolean);

  return parts.length ? parts.join(" ") : "Open this room to add numbers, AI analysis, routing context, and profiles.";
}

function DealCard({ deal }: { deal: Deal }) {
  const spread = deal.equitySpread || "";
  const read = buildRead(deal);

  return (
    <article className="vf-deal-card">
      <div className="vf-deal-line" />

      <div className="vf-deal-photo">
        {deal.photo ? <img src={deal.photo} alt="" /> : <span>No image</span>}
      </div>

      <div>
        <div className="vf-deal-top">
          <div>
            <div className="vf-eyebrow">Deal Room · {deal.type}</div>
            <h2 className="vf-h2" style={{ marginBottom: 6 }}>
              {deal.title || "Untitled Deal Room"}
            </h2>
            <p className="vf-copy" style={{ marginTop: 0 }}>
              {[deal.city, deal.county, deal.state].filter(Boolean).join(", ") || "Market not listed"}
            </p>
          </div>

          <div className="vf-score-box">
            <strong>{spread || "84"}</strong>
            <span>{spread ? "Spread" : "Score"}</span>
          </div>
        </div>

        <div className="vf-pills">
          <span>Ask {money(deal.purchasePrice)}</span>
          <span>ARV {money(deal.arv)}</span>
          <span>Repairs {money(deal.repairs)}</span>
          <span>{deal.type}</span>
        </div>

        <section className="vf-read-box">
          <div className="vf-eyebrow">AI Best-Fit Read</div>
          <p className="vf-copy">{read}</p>
        </section>

        <div className="vf-btns">
          <Link className="vf-btn" href={`/deal-rooms/${encodeURIComponent(deal.id)}`}>
            Open Room
          </Link>

          <Link className="vf-btn dark" href={`/messages?room=${encodeURIComponent(deal.id)}`}>
            Message
          </Link>
        </div>

        <VaultForgeRoomControls
          roomId={`deal:${deal.id}`}
          roomTitle={deal.title || "Deal Room"}
          roomType="deal"
        />
      </div>
    </article>
  );
}

export default function VaultForgeDealRoomsClient() {
  const [deals, setDeals] = useState<Deal[]>([]);

  function refresh() {
    setDeals(readDeals());
  }

  useEffect(() => {
    refresh();
    window.addEventListener("vaultforge-deals-change", refresh);
    return () => window.removeEventListener("vaultforge-deals-change", refresh);
  }, []);

  const metrics = useMemo(() => {
    return {
      active: deals.length,
      residential: deals.filter((deal) => deal.type === "Residential").length,
      commercial: deals.filter((deal) => deal.type === "Commercial").length,
      land: deals.filter((deal) => deal.type === "Land").length,
    };
  }, [deals]);

  return (
    <>
      <style>{`
        .vf-deal-card {
          border: 1px solid rgba(245,200,76,.22);
          background:
            radial-gradient(circle at top right, rgba(245,200,76,.10), transparent 28%),
            linear-gradient(145deg, rgba(12,16,25,.96), rgba(2,6,23,.99));
          border-radius: 24px;
          padding: 14px;
          display: grid;
          grid-template-columns: 180px minmax(0, 1fr);
          gap: 16px;
        }

        .vf-deal-line {
          grid-column: 1 / -1;
          height: 4px;
          border-radius: 999px;
          background: linear-gradient(90deg,#f5c84c,transparent);
        }

        .vf-deal-photo {
          min-height: 160px;
          border-radius: 18px;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,.14);
          background: rgba(255,255,255,.05);
          display: grid;
          place-items: center;
          color: #94a3b8;
          font-weight: 900;
        }

        .vf-deal-photo img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .vf-deal-top {
          display: flex;
          justify-content: space-between;
          gap: 14px;
        }

        .vf-score-box {
          text-align: right;
          flex: 0 0 auto;
        }

        .vf-score-box strong {
          display: block;
          color: #f5c84c;
          font-size: 34px;
          line-height: 1;
          letter-spacing: -.05em;
        }

        .vf-score-box span {
          display: block;
          color: #94a3b8;
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
          border: 1px solid rgba(255,255,255,.13);
          background: rgba(255,255,255,.045);
          color: #cbd5e1;
          border-radius: 999px;
          padding: 7px 10px;
          font-size: 12px;
          font-weight: 850;
        }

        .vf-read-box {
          border: 1px solid rgba(245,200,76,.18);
          background: rgba(255,255,255,.045);
          border-radius: 18px;
          padding: 14px;
          margin-top: 14px;
        }

        @media(max-width:780px){
          .vf-deal-card {
            grid-template-columns: 1fr;
          }

          .vf-deal-photo {
            height: 210px;
          }

          .vf-deal-top {
            display: block;
          }

          .vf-score-box {
            text-align: left;
            margin-top: 10px;
          }
        }
      `}</style>

      <section className="vf-grid">
        <div className="vf-metric"><span>Active rooms</span><strong>{metrics.active}</strong></div>
        <div className="vf-metric"><span>Residential</span><strong>{metrics.residential}</strong></div>
        <div className="vf-metric"><span>Commercial</span><strong>{metrics.commercial}</strong></div>
        <div className="vf-metric"><span>Land</span><strong>{metrics.land}</strong></div>
      </section>

      <section className="vf-card">
        <div className="vf-eyebrow">Active Deal Rooms</div>

        {!deals.length ? (
          <p className="vf-copy">
            No saved Deal Rooms yet. Use Create Deal Opportunity to add the first clean room.
          </p>
        ) : null}

        <div style={{ display: "grid", gap: 14 }}>
          {deals.map((deal) => (
            <DealCard key={deal.id} deal={deal} />
          ))}
        </div>
      </section>
    </>
  );
}