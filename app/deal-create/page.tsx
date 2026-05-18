"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import VaultForgeCleanShell from "../components/VaultForgeCleanShell";

const STATES = ["GA", "TN", "AL", "FL", "NC", "SC", "TX"];

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

export default function DealCreatePage() {
  const [deal, setDeal] = useState<Deal>(emptyDeal);
  const [saved, setSaved] = useState("");

  function update(key: keyof Deal, value: string) {
    setDeal((current) => ({ ...current, [key]: value }));
    setSaved("");
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
    setSaved("Deal saved locally. It will appear on Deal Rooms after the next Deal Rooms build.");
  }

  const aiRead = useMemo(() => {
    const parts = [
      deal.city || deal.county || deal.state
        ? `Market: ${[deal.city, deal.county, deal.state].filter(Boolean).join(", ")}.`
        : "",
      deal.purchasePrice || deal.arv || deal.repairs
        ? `Numbers: ask ${money(deal.purchasePrice)}, ARV/value ${money(deal.arv)}, repairs/work ${money(deal.repairs)}.`
        : "",
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
    ].filter(Boolean);

    return parts.length
      ? parts.join(" ")
      : "Fill the form to generate the operator read for this opportunity.";
  }, [deal]);

  return (
    <VaultForgeCleanShell
      active="deals"
      eyebrow="DEAL OPPORTUNITY"
      title="Bloomberg operator intake."
      subtitle="Residential, Commercial, and Land opportunity intake with photo upload, structured fields, and AI-ready room data."
    >
      <section className="vf-card">
        <div className="vf-eyebrow">ASSET CLASS</div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {["Residential", "Commercial", "Land"].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setType(item)}
              className={deal.type === item ? "vf-btn" : "vf-btn dark"}
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
          min-height: 120px;
          grid-column: 1 / -1;
          resize: vertical;
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