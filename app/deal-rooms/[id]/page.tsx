"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import VaultForgeCleanShell from "../../components/VaultForgeCleanShell";
import VaultForgeRoomControls from "../../components/VaultForgeRoomControls";

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

function num(value: string) {
  const n = Number(String(value || "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="vf-room-metric">
      <span>{label}</span>
      <strong>{value || "Not listed"}</strong>
    </div>
  );
}

export default function DealRoomDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [deal, setDeal] = useState<Deal | null>(null);

  useEffect(() => {
    const found = readDeals().find((item) => item.id === decodeURIComponent(params.id));
    setDeal(found || null);
  }, [params.id]);

  const underwriting = useMemo(() => {
    if (!deal) return null;

    const ask = num(deal.purchasePrice);
    const arv = num(deal.arv);
    const repairs = num(deal.repairs);
    const spread = arv && ask ? arv - ask - repairs : 0;
    const spreadPct = arv && spread ? Math.round((spread / arv) * 100) : 0;
    const risk =
      !ask || !arv
        ? "Missing key economics"
        : spreadPct >= 25
          ? "Strong spread"
          : spreadPct >= 15
            ? "Reviewable spread"
            : "Thin spread";

    return {
      spread,
      spreadPct,
      risk,
    };
  }, [deal]);

  if (!deal) {
    return (
      <VaultForgeCleanShell
        active="deals"
        eyebrow="DEAL ROOM"
        title="Room not found."
        subtitle="This room was not found in local saved Deal Rooms. Go back to Deal Rooms and open a saved card."
      >
        <section className="vf-card">
          <div className="vf-btns">
            <Link className="vf-btn" href="/deal-rooms">Back to Deal Rooms</Link>
            <Link className="vf-btn dark" href="/deal-create">Create Deal</Link>
          </div>
        </section>
      </VaultForgeCleanShell>
    );
  }

  return (
    <VaultForgeCleanShell
      active="deals"
      eyebrow="DEAL COMMAND ROOM"
      title={deal.title || "Deal Room"}
      subtitle="Full deal intelligence, underwriting, routing context, AI good/bad/next steps, and room controls."
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
          border: 1px solid rgba(255,255,255,.14);
          background: rgba(255,255,255,.05);
          display: grid;
          place-items: center;
          color: #94a3b8;
          font-weight: 900;
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

        .vf-ai-panel {
          border: 1px solid rgba(245,200,76,.18);
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

      <section className="vf-card">
        <div className="vf-room-hero-grid">
          <div className="vf-room-photo">
            {deal.photo ? <img src={deal.photo} alt="" /> : "No image uploaded"}
          </div>

          <div>
            <div className="vf-eyebrow">{deal.type} Opportunity</div>
            <h2 className="vf-h2">
              {[deal.city, deal.county, deal.state].filter(Boolean).join(", ") || "Market not listed"}
            </h2>

            <p className="vf-copy">
              {deal.notes ||
                "No operator notes listed yet. Add notes in the Deal Opportunity form to improve the AI room read."}
            </p>

            <div className="vf-room-metrics">
              <Metric label="Ask" value={money(deal.purchasePrice)} />
              <Metric label="ARV / Value" value={money(deal.arv)} />
              <Metric label="Repairs / Work" value={money(deal.repairs)} />
              <Metric
                label="Calculated Spread"
                value={underwriting?.spread ? money(String(underwriting.spread)) : "Not enough data"}
              />
              <Metric
                label="Spread Percent"
                value={underwriting?.spreadPct ? `${underwriting.spreadPct}%` : "Not enough data"}
              />
              <Metric label="Risk Read" value={underwriting?.risk || "Not enough data"} />
            </div>

            <div className="vf-btns">
              <Link className="vf-btn" href={`/messages?room=${encodeURIComponent(deal.id)}`}>
                Message Room
              </Link>
              <Link className="vf-btn dark" href="/deal-rooms">
                Back to Deal Rooms
              </Link>
            </div>
          </div>
        </div>

        <VaultForgeRoomControls
          roomId={`deal:${deal.id}`}
          roomTitle={deal.title || "Deal Room"}
          roomType="deal"
        />
      </section>

      <section className="vf-card">
        <div className="vf-eyebrow">Submitted Asset Data</div>

        <div className="vf-room-metrics">
          <Metric label="Asset Type" value={deal.type} />
          <Metric label="City" value={deal.city} />
          <Metric label="County" value={deal.county} />
          <Metric label="State" value={deal.state} />

          {deal.type === "Residential" ? (
            <>
              <Metric label="Beds" value={deal.beds} />
              <Metric label="Baths" value={deal.baths} />
              <Metric label="SQFT" value={deal.sqft} />
            </>
          ) : null}

          {deal.type === "Commercial" ? (
            <>
              <Metric label="NOI" value={deal.noi} />
              <Metric label="Cap Rate" value={deal.capRate} />
              <Metric label="Tenant Status" value={deal.tenantStatus} />
            </>
          ) : null}

          {deal.type === "Land" ? (
            <>
              <Metric label="Acres" value={deal.acres} />
              <Metric label="Zoning" value={deal.zoning} />
              <Metric label="Utilities" value={deal.utilities} />
            </>
          ) : null}
        </div>
      </section>

      <section className="vf-card">
        <div className="vf-eyebrow">AI Deal Read</div>

        <div className="vf-ai-grid">
          <div className="vf-ai-panel">
            <div className="vf-eyebrow">Good</div>
            <p className="vf-copy">
              {underwriting?.spreadPct && underwriting.spreadPct >= 15
                ? "The spread may support routing to buyers, lenders, and operators if the condition, title, occupancy, and exit assumptions check out."
                : "The room needs stronger economics or more complete data before heavy routing."}
            </p>
          </div>

          <div className="vf-ai-panel">
            <div className="vf-eyebrow">Caution</div>
            <p className="vf-copy">
              Verify purchase price, ARV, repair estimate, occupancy, title, access, seller authority, and timeline before presenting as a high-confidence room.
            </p>
          </div>

          <div className="vf-ai-panel">
            <div className="vf-eyebrow">Next Steps</div>
            <p className="vf-copy">
              Add documents/photos, confirm numbers, assign the right buyer/capital/operator profile, then move communication into the room thread.
            </p>
          </div>
        </div>
      </section>

      <section className="vf-card">
        <div className="vf-eyebrow">Matched Profiles</div>

        <div className="vf-ai-grid">
          <div className="vf-ai-panel">
            <div className="vf-eyebrow">Buyer Fit</div>
            <p className="vf-copy">Match by state, city, asset type, strategy, price range, exit type, and urgency.</p>
          </div>

          <div className="vf-ai-panel">
            <div className="vf-eyebrow">Capital Fit</div>
            <p className="vf-copy">Match private lenders, JV capital, bridge, hard money, or DSCR based on deal shape and timeline.</p>
          </div>

          <div className="vf-ai-panel">
            <div className="vf-eyebrow">Operator Fit</div>
            <p className="vf-copy">Match GC, PM, boots-on-ground, asset manager, or local execution partner by market and scope.</p>
          </div>
        </div>
      </section>
    </VaultForgeCleanShell>
  );
}