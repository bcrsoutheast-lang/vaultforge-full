"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type DealRoom = Record<string, any>;
const LIST_KEYS = ["vaultforge_clean_deal_rooms", "vaultforge_deal_rooms", "vf_deal_rooms", "deal_rooms"];

function readList(key: string): DealRoom[] {
  try {
    const raw = window.localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveEverywhere(deals: DealRoom[]) {
  for (const key of LIST_KEYS) window.localStorage.setItem(key, JSON.stringify(deals));
}

function normalizeDeal(deal: DealRoom): DealRoom {
  const id = String(deal.id || `deal_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);
  return {
    ...deal,
    id,
    kind: deal.kind || "deal",
    type: deal.type || "deal",
    roomType: deal.roomType || "deal",
    title: deal.title || deal.name || deal.address || "Untitled Deal Room",
    city: deal.city || deal.market || "",
    state: deal.state || "",
    county: deal.county || "",
    assetClass: deal.assetClass || deal.asset_class || deal.propertyType || "Deal",
    askingPrice: deal.askingPrice || deal.askPrice || deal.price || "",
    arv: deal.arv || deal.value || "",
    repairs: deal.repairs || deal.repairCost || "",
    photoDataUrl: deal.photoDataUrl || deal.image || deal.imageUrl || "",
  };
}

function loadAllDeals() {
  const seen = new Set<string>();
  const merged: DealRoom[] = [];
  for (const key of LIST_KEYS) {
    for (const rawDeal of readList(key)) {
      const deal = normalizeDeal(rawDeal);
      if (!deal.id || seen.has(deal.id)) continue;
      seen.add(deal.id);
      merged.push(deal);
    }
  }
  merged.sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
  try { saveEverywhere(merged); } catch {}
  return merged;
}

const shell: React.CSSProperties = { minHeight: "100vh", background: "#05070d", color: "#f7f7fb", padding: 18, fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" };
const wrap: React.CSSProperties = { maxWidth: 1180, margin: "0 auto", paddingBottom: 60 };
const card: React.CSSProperties = { background: "linear-gradient(180deg,#080d19,#050816)", border: "1px solid rgba(245,197,66,.28)", borderRadius: 26, padding: 24, marginBottom: 20, boxShadow: "0 18px 60px rgba(0,0,0,.3)" };
const eyebrow: React.CSSProperties = { color: "#ffd45a", textTransform: "uppercase", letterSpacing: 7, fontWeight: 900, fontSize: 17, marginBottom: 12 };
const h1: React.CSSProperties = { fontSize: "clamp(42px,7vw,74px)", lineHeight: .92, letterSpacing: -4, margin: "0 0 16px", fontWeight: 950 };
const sub: React.CSSProperties = { color: "#c9d0dc", fontSize: "clamp(18px,2.5vw,25px)", lineHeight: 1.35, margin: 0 };
const button: React.CSSProperties = { border: 0, borderRadius: 18, padding: "15px 18px", fontWeight: 950, cursor: "pointer", fontSize: 15, textDecoration: "none", display: "inline-block" };
const goldButton: React.CSSProperties = { ...button, background: "#ffdc68", color: "#111319" };
const darkButton: React.CSSProperties = { ...button, background: "#171c29", color: "#f7f7fb", border: "1px solid rgba(207,216,230,.18)" };
const grid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(270px, 1fr))", gap: 18 };

export default function VaultForgeDealRoomsClient() {
  const [deals, setDeals] = useState<DealRoom[]>([]);
  const [loaded, setLoaded] = useState(false);

  function refresh() {
    setDeals(loadAllDeals());
    setLoaded(true);
  }

  useEffect(() => { refresh(); }, []);

  const counts = useMemo(() => {
    const byState: Record<string, number> = {};
    deals.forEach((deal) => { const state = String(deal.state || "Unknown"); byState[state] = (byState[state] || 0) + 1; });
    return byState;
  }, [deals]);

  return (
    <main style={shell}>
      <div style={wrap}>
        <nav style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 18 }}>
          <Link href="/command" style={darkButton}>Command</Link>
          <Link href="/deal-create" style={goldButton}>Create Deal</Link>
          <Link href="/pain-intake" style={darkButton}>Pain Intake</Link>
          <Link href="/profile" style={darkButton}>Profile</Link>
          <Link href="/" style={{ ...darkButton, borderColor: "rgba(255,78,78,.45)", color: "#ff9b9b" }}>Exit</Link>
        </nav>

        <section style={card}>
          <div style={eyebrow}>Deal Rooms</div>
          <h1 style={h1}>Clean deal room board.</h1>
          <p style={sub}>Reads every local Deal Room save key and resyncs them so new deals show here immediately.</p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
            <button type="button" onClick={refresh} style={darkButton}>Refresh Rooms</button>
            <Link href="/deal-create" style={goldButton}>Create Deal</Link>
          </div>
        </section>

        <section style={card}>
          <div style={eyebrow}>State Count</div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {Object.keys(counts).length ? Object.entries(counts).map(([state, count]) => <span key={state} style={darkButton}>{state}: {count}</span>) : <span style={sub}>No saved deal rooms yet.</span>}
          </div>
        </section>

        {!loaded ? null : deals.length === 0 ? (
          <section style={card}>
            <div style={eyebrow}>No Deal Rooms Found</div>
            <p style={sub}>Create one deal, wait for the saved popup, then tap Open Deal Rooms.</p>
          </section>
        ) : (
          <section style={grid}>
            {deals.map((deal) => (
              <article key={deal.id} style={card}>
                {deal.photoDataUrl ? <img src={deal.photoDataUrl} alt="Deal" style={{ width: "100%", height: 190, objectFit: "cover", borderRadius: 20, border: "1px solid rgba(207,216,230,.18)", marginBottom: 14 }} /> : null}
                <div style={eyebrow}>{deal.assetClass || "Deal"}</div>
                <h2 style={{ fontSize: 32, lineHeight: 1, margin: "0 0 12px", letterSpacing: -1.5 }}>{deal.title || "Untitled Deal Room"}</h2>
                <p style={{ ...sub, fontSize: 17 }}>{[deal.city, deal.county, deal.state].filter(Boolean).join(", ") || "Location not listed"}</p>
                <p style={{ color: "#dce4ef", fontSize: 16, lineHeight: 1.45 }}>
                  Ask: {deal.askingPrice || "Not listed"}<br />
                  ARV/Value: {deal.arv || "Not listed"}<br />
                  Repairs: {deal.repairs || "Not listed"}<br />
                  Route: {Array.isArray(deal.routeTo) ? deal.routeTo.join(", ") : "Not selected"}
                </p>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
                  <Link href={`/deal-rooms/${deal.id}`} style={goldButton}>Open Room</Link>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
