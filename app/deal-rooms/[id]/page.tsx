"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

type RoomState = "active" | "saved" | "archived" | "deleted";

type DealRoom = {
  id?: string;
  kind?: string;
  assetClass?: string;
  title?: string;
  state?: string;
  city?: string;
  county?: string;
  address?: string;
  askingPrice?: string;
  arv?: string;
  repairs?: string;
  equitySpread?: string;
  beds?: string;
  baths?: string;
  sqft?: string;
  acres?: string;
  units?: string;
  buildingSize?: string;
  zoning?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  bestContact?: string;
  submitterRole?: string;
  routeTo?: string[];
  urgency?: string;
  occupancy?: string;
  knownIssues?: string[];
  access?: string;
  docs?: string[];
  assignmentFee?: string;
  deadline?: string;
  notes?: string;
  aiRead?: string;
  photoName?: string;
  photoDataUrl?: string;
  image?: string;
  photo?: string;
  createdAt?: string;
  updatedAt?: string;
  roomState?: RoomState;
};

const DEAL_KEYS = ["vaultforge_clean_deal_rooms", "vaultforge_deal_rooms", "vaultforge_rooms_deals", "vf_deal_rooms", "deal_rooms"];
const STATE_KEY = "vaultforge_clean_room_states";

const page: React.CSSProperties = { minHeight: "100vh", background: "#05070d", color: "#f7f7fb", padding: "18px", fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" };
const wrap: React.CSSProperties = { maxWidth: 1180, margin: "0 auto", paddingBottom: 60 };
const card: React.CSSProperties = { background: "linear-gradient(180deg,#080d19,#050816)", border: "1px solid rgba(245,197,66,.28)", borderRadius: 26, padding: 28, marginBottom: 22, boxShadow: "0 18px 60px rgba(0,0,0,.3)" };
const eyebrow: React.CSSProperties = { color: "#ffd45a", textTransform: "uppercase", letterSpacing: 8, fontWeight: 900, fontSize: 18, marginBottom: 14 };
const h1: React.CSSProperties = { fontSize: "clamp(42px,7vw,76px)", lineHeight: .92, letterSpacing: -4, margin: "0 0 18px", fontWeight: 950 };
const sub: React.CSSProperties = { color: "#c9d0dc", fontSize: "clamp(18px,2.4vw,25px)", lineHeight: 1.35, margin: 0 };
const navBtn: React.CSSProperties = { display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: 999, padding: "13px 17px", background: "#171c29", color: "#f7f7fb", border: "1px solid rgba(207,216,230,.18)", fontWeight: 900, textDecoration: "none" };
const primaryBtn: React.CSSProperties = { ...navBtn, background: "#ffdc68", color: "#111319", borderColor: "#ffdc68" };
const dangerBtn: React.CSSProperties = { ...navBtn, background: "#2b1015", color: "#ffb4b4", borderColor: "rgba(255,88,88,.45)", cursor: "pointer" };
const grid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 18 };

function safeArray(value: unknown): DealRoom[] { return Array.isArray(value) ? value.filter((item) => item && typeof item === "object") as DealRoom[] : []; }
function readJson(key: string): unknown { try { const raw = window.localStorage.getItem(key); return raw ? JSON.parse(raw) : null; } catch { return null; } }
function roomId(deal: DealRoom, index = 0) { return String(deal.id || `deal_${deal.title || "room"}_${deal.city || "market"}_${index}`).replace(/[^a-zA-Z0-9_\-]/g, "_"); }
function money(value?: string) { return String(value || "").trim() || "Not listed"; }
function listText(value?: string[]) { return value && value.length ? value.join(", ") : "Not selected"; }

function readAllDeals(): DealRoom[] {
  const byId = new Map<string, DealRoom>();
  DEAL_KEYS.forEach((key) => safeArray(readJson(key)).forEach((deal, index) => byId.set(roomId(deal, index), { ...deal, id: roomId(deal, index) })));
  for (let i = 0; i < window.localStorage.length; i += 1) {
    const key = window.localStorage.key(i) || "";
    if (key.startsWith("vaultforge_clean_deal_room_") || key.startsWith("vaultforge_deal_room_")) {
      const deal = readJson(key) as DealRoom | null;
      if (deal && typeof deal === "object") byId.set(roomId(deal), { ...deal, id: roomId(deal) });
    }
  }
  return Array.from(byId.values());
}

function writeRoomState(id: string, state: RoomState) {
  const raw = readJson(STATE_KEY);
  const states = raw && typeof raw === "object" && !Array.isArray(raw) ? raw as Record<string, RoomState> : {};
  states[id] = state;
  window.localStorage.setItem(STATE_KEY, JSON.stringify(states));
}

export default function DealRoomDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = decodeURIComponent(String(params?.id || ""));
  const [deal, setDeal] = useState<DealRoom | null>(null);

  useEffect(() => {
    const found = readAllDeals().find((item) => roomId(item) === id || String(item.id || "") === id);
    setDeal(found || null);
  }, [id]);

  const signalSummary = useMemo(() => {
    if (!deal) return "";
    const spread = [deal.arv, deal.askingPrice, deal.repairs].every(Boolean)
      ? `Potential spread should be reviewed from ARV/value ${money(deal.arv)}, ask ${money(deal.askingPrice)}, and repairs/work ${money(deal.repairs)}.`
      : "Numbers are incomplete, so underwriting should be verified before routing.";
    return `${deal.assetClass || "Deal"} signal in ${[deal.city, deal.county, deal.state].filter(Boolean).join(", ") || "an unlisted market"}. ${spread} Route to ${listText(deal.routeTo)}. Urgency is ${deal.urgency || "not listed"}, occupancy is ${deal.occupancy || "not listed"}, access is ${deal.access || "not listed"}. Known issues: ${listText(deal.knownIssues)}.`;
  }, [deal]);

  function move(state: RoomState) {
    writeRoomState(id, state);
    router.push(state === "saved" ? "/saved-rooms" : state === "archived" ? "/archived-rooms" : state === "deleted" ? "/deleted-rooms" : "/deal-rooms");
  }

  if (!deal) {
    return (
      <main style={page}><div style={wrap}>
        <nav style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 18 }}><Link href="/deal-rooms" style={primaryBtn}>Back to Deal Rooms</Link><Link href="/deal-create" style={navBtn}>Create Deal</Link></nav>
        <section style={card}><div style={eyebrow}>Deal Room</div><h1 style={h1}>Room not found.</h1><p style={sub}>This room was not found in local saved Deal Rooms. Go back to Deal Rooms and open a saved card.</p></section>
      </div></main>
    );
  }

  const photo = deal.photoDataUrl || deal.image || deal.photo || "";
  return (
    <main style={page}>
      <div style={wrap}>
        <nav style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 18 }}>
          <Link href="/deal-rooms" style={primaryBtn}>Deal Rooms</Link>
          <Link href="/deal-create" style={navBtn}>Create Deal</Link>
          <Link href="/messages" style={navBtn}>Messages</Link>
          <Link href="/command" style={navBtn}>Command</Link>
          <Link href="/" style={{ ...navBtn, color: "#ffb4b4", borderColor: "rgba(255,88,88,.45)" }}>Exit</Link>
        </nav>

        <section style={card}>
          <div style={eyebrow}>{deal.assetClass || "Deal Room"}</div>
          <h1 style={h1}>{deal.title || "Untitled Deal"}</h1>
          <p style={sub}>{[deal.address, deal.city, deal.county, deal.state].filter(Boolean).join(" • ") || "Location not listed"}</p>
          {photo ? <img src={photo} alt={deal.title || "Deal photo"} style={{ width: "100%", maxHeight: 440, objectFit: "cover", borderRadius: 24, border: "1px solid rgba(207,216,230,.18)", marginTop: 24 }} /> : null}
        </section>

        <section style={card}>
          <div style={eyebrow}>5S Cleanup Controls</div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button type="button" onClick={() => move("saved")} style={primaryBtn}>Save</button>
            <button type="button" onClick={() => move("archived")} style={navBtn}>Archive</button>
            <button type="button" onClick={() => move("deleted")} style={dangerBtn}>Delete</button>
          </div>
        </section>

        <section style={grid}>
          <div style={card}><div style={eyebrow}>Numbers</div><p style={sub}>Ask: {money(deal.askingPrice)}<br />ARV/Value: {money(deal.arv)}<br />Repairs/Work: {money(deal.repairs)}<br />Equity Spread: {money(deal.equitySpread)}<br />Assignment Fee: {money(deal.assignmentFee)}<br />Deadline: {money(deal.deadline)}</p></div>
          <div style={card}><div style={eyebrow}>Contact</div><p style={sub}>Name: {money(deal.contactName)}<br />Phone: {money(deal.contactPhone)}<br />Email: {money(deal.contactEmail)}<br />Best Contact: {money(deal.bestContact)}<br />Submitter: {money(deal.submitterRole)}</p></div>
          <div style={card}><div style={eyebrow}>Asset Detail</div><p style={sub}>Beds: {money(deal.beds)}<br />Baths: {money(deal.baths)}<br />Sqft: {money(deal.sqft)}<br />Units: {money(deal.units)}<br />Building: {money(deal.buildingSize)}<br />Acres: {money(deal.acres)}<br />Zoning: {money(deal.zoning)}</p></div>
          <div style={card}><div style={eyebrow}>Routing</div><p style={sub}>Route To: {listText(deal.routeTo)}<br />Urgency: {money(deal.urgency)}<br />Occupancy: {money(deal.occupancy)}<br />Access: {money(deal.access)}<br />Issues: {listText(deal.knownIssues)}<br />Docs: {listText(deal.docs)}</p></div>
        </section>

        <section style={card}>
          <div style={eyebrow}>Signal Summary</div>
          <p style={sub}>{signalSummary}</p>
        </section>

        <section style={card}>
          <div style={eyebrow}>AI Room Read</div>
          <p style={sub}>{deal.aiRead || signalSummary}</p>
        </section>

        <section style={card}>
          <div style={eyebrow}>Private Notes</div>
          <p style={sub}>{deal.notes || "No private deal notes added yet."}</p>
        </section>
      </div>
    </main>
  );
}
