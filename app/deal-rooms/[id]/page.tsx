"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

type RoomState = "active" | "saved" | "archived" | "deleted";
type DealRoom = Record<string, any> & { id: string; roomState?: RoomState };
type ProfileData = Record<string, any> & {
  profilePhoto?: string;
  companyLogo?: string;
  fullName?: string;
  company?: string;
  email?: string;
  phone?: string;
  preferredContact?: string[];
  memberTypes?: string[];
  buyStates?: string[];
  operateStates?: string[];
  alertStates?: string[];
  contactStates?: string[];
  countiesByState?: Record<string, string[]>;
  markets?: string[];
  assetTypes?: string[];
  dealTypes?: string[];
  executionCapabilities?: string[];
  capitalRoles?: string[];
  routingRules?: string[];
  privateAiNotes?: string;
};

const ROOM_KEYS = ["vaultforge_clean_deal_rooms", "vaultforge_deal_rooms", "vaultforge_rooms_deals", "vf_deal_rooms"];
const DETAIL_PREFIXES = ["vaultforge_clean_deal_room_", "vaultforge_deal_room_", "vf_deal_room_"];
const STATE_KEY = "vaultforge_clean_room_states";
const PROFILE_KEY = "vaultforge_profile_v2";
const HIDDEN_ROUTE_KEY = "vaultforge_hidden_ai_routes";

const page: React.CSSProperties = { minHeight: "100vh", background: "#05070d", color: "#f7f7fb", padding: 18, fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" };
const wrap: React.CSSProperties = { maxWidth: 1180, margin: "0 auto", paddingBottom: 70 };
const card: React.CSSProperties = { background: "linear-gradient(180deg,#080d19,#050816)", border: "1px solid rgba(245,197,66,.28)", borderRadius: 26, padding: 28, marginBottom: 22 };
const eyebrow: React.CSSProperties = { color: "#ffd45a", textTransform: "uppercase", letterSpacing: 8, fontWeight: 900, fontSize: 20, marginBottom: 14 };
const h1: React.CSSProperties = { fontSize: "clamp(42px,7vw,72px)", lineHeight: .92, letterSpacing: -4, margin: "0 0 18px", fontWeight: 950 };
const sub: React.CSSProperties = { color: "#c9d0dc", fontSize: 23, lineHeight: 1.35, margin: 0 };
const grid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 18 };
const btn: React.CSSProperties = { border: "1px solid rgba(207,216,230,.18)", background: "#171c29", color: "#f7f7fb", borderRadius: 999, padding: "13px 18px", fontWeight: 950, textDecoration: "none", display: "inline-block", cursor: "pointer" };
const goldBtn: React.CSSProperties = { ...btn, border: 0, background: "#ffdc68", color: "#10131a" };
const redBtn: React.CSSProperties = { ...btn, background: "#271016", borderColor: "rgba(255,70,70,.48)", color: "#ffaaaa" };

function readArray(key: string): DealRoom[] { try { const raw = window.localStorage.getItem(key); const parsed = raw ? JSON.parse(raw) : []; return Array.isArray(parsed) ? parsed : []; } catch { return []; } }
function getStates(): Record<string, RoomState> { try { return JSON.parse(window.localStorage.getItem(STATE_KEY) || "{}"); } catch { return {}; } }
function writeStates(states: Record<string, RoomState>) { window.localStorage.setItem(STATE_KEY, JSON.stringify(states)); }
function dealId(deal: DealRoom | null | undefined) { return String(deal?.id || deal?.roomId || deal?.dealId || ""); }
function val(deal: DealRoom | null, keys: string[], fallback = "Not listed") { for (const key of keys) { const raw = deal?.[key]; if (raw !== undefined && raw !== null && String(raw).trim()) return String(raw); } return fallback; }
function arr(deal: DealRoom | null, keys: string[]) { for (const key of keys) { const raw = deal?.[key]; if (Array.isArray(raw)) return raw.map(String).filter(Boolean); if (typeof raw === "string" && raw.trim()) return raw.split(",").map((item) => item.trim()).filter(Boolean); } return []; }
function money(raw: string) { const clean = String(raw || "").replace(/[^0-9.]/g, ""); if (!clean) return "Not listed"; const num = Number(clean); return Number.isNaN(num) ? raw : `$${num.toLocaleString()}`; }
function photo(deal: DealRoom | null) { return val(deal, ["photoUrl", "imageUrl", "publicUrl", "photo", "photoDataUrl", "image", "url"], ""); }
function readProfile(): ProfileData | null { try { const raw = window.localStorage.getItem(PROFILE_KEY); return raw ? JSON.parse(raw) : null; } catch { return null; } }
function readHidden(): Record<string, boolean> { try { return JSON.parse(window.localStorage.getItem(HIDDEN_ROUTE_KEY) || "{}"); } catch { return {}; } }
function writeHidden(hidden: Record<string, boolean>) { window.localStorage.setItem(HIDDEN_ROUTE_KEY, JSON.stringify(hidden)); }

function findDeal(id: string): DealRoom | null {
  const states = getStates();
  let found: DealRoom | null = null;
  for (const prefix of DETAIL_PREFIXES) {
    try {
      const raw = window.localStorage.getItem(`${prefix}${id}`);
      if (raw) found = { ...(found || {}), ...JSON.parse(raw), id };
    } catch {}
  }
  for (const key of ROOM_KEYS) {
    const hit = readArray(key).find((deal) => dealId(deal) === id);
    if (hit) found = { ...(found || {}), ...hit, id };
  }
  return found ? { ...found, id, roomState: states[id] || found.roomState || "active" } : null;
}

function syncDeal(deal: DealRoom) {
  const id = dealId(deal);
  if (!id) return;
  DETAIL_PREFIXES.forEach((prefix) => window.localStorage.setItem(`${prefix}${id}`, JSON.stringify({ ...deal, id })));
  ROOM_KEYS.forEach((key) => {
    const rows = readArray(key).filter((item) => dealId(item) !== id);
    window.localStorage.setItem(key, JSON.stringify([{ ...deal, id }, ...rows]));
  });
  window.dispatchEvent(new Event("vaultforge-deals-change"));
}

function normalizeAsset(assetClass: string) {
  const value = String(assetClass || "").toLowerCase();
  if (value.includes("residential")) return "SFR";
  if (value.includes("commercial")) return "Commercial";
  if (value.includes("land")) return "Land";
  return assetClass;
}

function profileFit(deal: DealRoom, profile: ProfileData | null) {
  if (!profile) return null;
  const routeTargets = arr(deal, ["routeTo", "routedTo"]);
  const state = val(deal, ["state"], "");
  const county = val(deal, ["county"], "");
  const asset = normalizeAsset(val(deal, ["assetClass", "asset_class"], ""));
  const memberTypes = Array.isArray(profile.memberTypes) ? profile.memberTypes.map(String) : [];
  const profileStates = [profile.buyStates, profile.operateStates, profile.alertStates, profile.contactStates].flat().filter(Boolean).map(String);
  const counties = state && profile.countiesByState ? profile.countiesByState[state] || [] : [];
  const assetTypes = Array.isArray(profile.assetTypes) ? profile.assetTypes.map(String) : [];
  const roleFit = routeTargets.some((target) => memberTypes.map((x) => x.toLowerCase()).includes(target.toLowerCase())) || routeTargets.some((target) => target === "Buyer" && memberTypes.includes("Investor"));
  const stateFit = state ? profileStates.includes(state) : false;
  const countyFit = county ? counties.includes(county) : false;
  const assetFit = asset ? assetTypes.map((x) => x.toLowerCase()).includes(String(asset).toLowerCase()) || (asset === "SFR" && assetTypes.includes("Residential")) : false;
  const routingAllowed = !Array.isArray(profile.routingRules) || !profile.routingRules.length || profile.routingRules.includes("Allow AI Routing") || profile.routingRules.includes("Only High-Fit Matches");
  const score = [roleFit, stateFit, countyFit, assetFit, routingAllowed].filter(Boolean).length * 20;
  const reasons = [roleFit ? "member type fits route target" : "member type needs review", stateFit ? "state match" : "state not selected", countyFit ? "county match" : "county not selected", assetFit ? "asset fit" : "asset not selected", routingAllowed ? "AI routing allowed" : "routing rule not open"];
  return { score, roleFit, stateFit, countyFit, assetFit, routingAllowed, reasons };
}

function Fact({ label, value }: { label: string; value: string }) {
  return <div style={{ background: "#121724", border: "1px solid rgba(207,216,230,.14)", borderRadius: 20, padding: 22 }}><div style={{ ...eyebrow, fontSize: 14, letterSpacing: 5 }}>{label}</div><div style={{ fontSize: 24, fontWeight: 850 }}>{value || "Not listed"}</div></div>;
}

function ProfileRouteCard({ deal, profile, onHide }: { deal: DealRoom; profile: ProfileData; onHide: () => void }) {
  const fit = profileFit(deal, profile);
  const profileName = String(profile.company || profile.fullName || "Saved Member Profile");
  const photoUrl = String(profile.profilePhoto || profile.companyLogo || "");
  const preferred = Array.isArray(profile.preferredContact) && profile.preferredContact.length ? profile.preferredContact.join(", ") : "VaultForge Message";
  const types = Array.isArray(profile.memberTypes) && profile.memberTypes.length ? profile.memberTypes.join(", ") : "Member type not selected";
  const execution = Array.isArray(profile.executionCapabilities) && profile.executionCapabilities.length ? profile.executionCapabilities.slice(0, 6).join(", ") : "Execution not selected";
  const capital = Array.isArray(profile.capitalRoles) && profile.capitalRoles.length ? profile.capitalRoles.slice(0, 6).join(", ") : "Capital role not selected";

  return (
    <div style={{ ...card, padding: 22, marginBottom: 0, background: "linear-gradient(135deg, rgba(245,197,66,.08), rgba(8,13,25,.98))" }}>
      <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 18, alignItems: "center" }}>
        <div style={{ width: 120, height: 120, borderRadius: 24, overflow: "hidden", border: "1px solid rgba(245,197,66,.32)", background: "#121724", display: "grid", placeItems: "center", color: "#ffd45a", fontWeight: 950 }}>
          {photoUrl ? <img src={photoUrl} alt={profileName} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "AI"}
        </div>
        <div>
          <div style={{ ...eyebrow, fontSize: 15, letterSpacing: 5 }}>AI Routed Profile</div>
          <h2 style={{ fontSize: 34, margin: "0 0 8px", letterSpacing: -2 }}>{profileName}</h2>
          <p style={{ ...sub, fontSize: 18 }}>Fit Score: {fit?.score || 0}% • {types}</p>
        </div>
      </div>
      <div style={{ ...grid, marginTop: 18 }}>
        <Fact label="Best Contact" value={preferred} />
        <Fact label="Phone" value={String(profile.phone || "Not listed")} />
        <Fact label="Email" value={String(profile.email || "Not listed")} />
        <Fact label="Capital" value={capital} />
        <Fact label="Execution" value={execution} />
        <Fact label="AI Match Reason" value={fit?.reasons.join(" • ") || "Profile not complete"} />
      </div>
      <div style={{ marginTop: 18, display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Link href={`/messages?room=${encodeURIComponent(deal.id)}&to=${encodeURIComponent(profile.email || profile.phone || profileName)}`} style={goldBtn}>Message Routed Profile</Link>
        <button type="button" onClick={onHide} style={redBtn}>Remove From This Room</button>
      </div>
    </div>
  );
}

export default function DealRoomDetailPage() {
  const params = useParams();
  const id = decodeURIComponent(String(params?.id || ""));
  const [deal, setDeal] = useState<DealRoom | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [hidden, setHidden] = useState<Record<string, boolean>>({});

  function load() {
    setDeal(findDeal(id));
    setProfile(readProfile());
    setHidden(readHidden());
  }

  useEffect(() => { load(); }, [id]);

  function setRoomState(state: RoomState) {
    if (!deal) return;
    const next = { ...deal, roomState: state, updatedAt: new Date().toISOString() };
    const states = getStates();
    states[id] = state;
    writeStates(states);
    syncDeal(next);
    setDeal(next);
  }

  function hideProfileRoute() {
    const key = `${id}:profile`;
    const next = { ...hidden, [key]: true };
    writeHidden(next);
    setHidden(next);
  }

  const routeTargets = arr(deal, ["routeTo", "routedTo"]);
  const knownIssues = arr(deal, ["knownIssues", "issues"]);
  const docs = arr(deal, ["docs"]);
  const img = photo(deal);
  const hiddenKey = `${id}:profile`;
  const shouldShowProfile = Boolean(profile && !hidden[hiddenKey]);
  const signalSummary = useMemo(() => {
    if (!deal) return "";
    return val(deal, ["signalSummary"], `${val(deal,["assetClass"],"Deal")} signal in ${[val(deal,["city"],""), val(deal,["county"],""), val(deal,["state"],"")].filter(Boolean).join(", ")}. Ask ${money(val(deal,["askingPrice","ask"],""))}, value ${money(val(deal,["arv","value"],""))}, repairs ${money(val(deal,["repairs"],""))}. Route to ${routeTargets.join(", ") || "selected member profiles"}. AI should match saved profiles by role, market, asset fit, capital, execution, and contact rules.`);
  }, [deal, routeTargets]);

  if (!deal) {
    return <main style={page}><div style={wrap}><nav style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:18 }}><Link href="/deal-rooms" style={goldBtn}>Back to Deal Rooms</Link><Link href="/deal-create" style={btn}>Create Deal</Link></nav><section style={card}><div style={eyebrow}>Deal Room</div><h1 style={h1}>Room not found.</h1><p style={sub}>This room was not found in local saved Deal Rooms. Go back and open a saved card.</p></section></div></main>;
  }

  return (
    <main style={page}>
      <div style={wrap}>
        <nav style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:18 }}><Link href="/command" style={btn}>Command</Link><Link href="/deal-rooms" style={goldBtn}>Deal Rooms</Link><Link href="/messages" style={btn}>Messages</Link><Link href="/profile" style={btn}>Profile</Link><Link href="/" style={redBtn}>Exit</Link></nav>

        <section style={card}>
          {img ? <img src={img} alt={val(deal,["title"], "Deal photo")} style={{ width:"100%", maxHeight:430, objectFit:"cover", borderRadius:24, marginBottom:24, border:"1px solid rgba(207,216,230,.2)" }} /> : <div style={{ border:"1px dashed rgba(207,216,230,.25)", borderRadius:24, padding:70, textAlign:"center", color:"#c9d0dc", marginBottom:24 }}>No photo URL saved for this room</div>}
          <div style={eyebrow}>{val(deal,["assetClass","asset_class"],"Deal Room")}</div>
          <h1 style={h1}>{val(deal,["title","name"],"Untitled Deal")}</h1>
          <p style={sub}>{[val(deal,["city"],""), val(deal,["county"],""), val(deal,["state"],"")].filter(Boolean).join(" • ")}</p>
        </section>

        <section style={card}><div style={eyebrow}>5S Cleanup Controls</div><div style={{ display:"flex", gap:12, flexWrap:"wrap" }}><button type="button" onClick={() => setRoomState("saved")} style={goldBtn}>Save</button><button type="button" onClick={() => setRoomState("archived")} style={btn}>Archive</button><button type="button" onClick={() => setRoomState("deleted")} style={redBtn}>Delete</button><span style={btn}>Current: {deal.roomState || "active"}</span></div></section>

        <section style={card}><div style={eyebrow}>Signal Summary</div><p style={sub}>{signalSummary}</p></section>

        <section style={card}><div style={eyebrow}>Numbers + Asset Facts</div><div style={grid}><Fact label="Ask" value={money(val(deal,["askingPrice","ask"],""))}/><Fact label="ARV / Value" value={money(val(deal,["arv","value"],""))}/><Fact label="Repairs / Work" value={money(val(deal,["repairs"],""))}/><Fact label="Equity Spread" value={val(deal,["equitySpread"])}/><Fact label="Beds" value={val(deal,["beds"])}/><Fact label="Baths" value={val(deal,["baths"])}/><Fact label="Sqft" value={val(deal,["sqft"])}/><Fact label="Units" value={val(deal,["units"])}/><Fact label="Acres" value={val(deal,["acres"])}/><Fact label="Zoning" value={val(deal,["zoning"])}/></div></section>

        <section style={card}><div style={eyebrow}>Contact</div><div style={grid}><Fact label="Name" value={val(deal,["contactName"])}/><Fact label="Phone" value={val(deal,["contactPhone"])}/><Fact label="Email" value={val(deal,["contactEmail"])}/><Fact label="Best Contact" value={val(deal,["bestContact"])}/><Fact label="Submitter Role" value={val(deal,["submitterRole"])}/><Fact label="Deadline" value={val(deal,["deadline"])}/></div></section>

        <section style={card}>
          <div style={eyebrow}>AI Routing Profile</div>
          <h2 style={{ fontSize:34, margin:"0 0 16px" }}>Who this should alert.</h2>
          <p style={sub}>Route targets: {routeTargets.join(", ") || "Not selected"}. VaultForge matches saved profile data by member type, state, county, asset type, capital/execution capability, urgency, and contact rules.</p>
          <div style={{ marginTop: 22 }}>
            {shouldShowProfile && profile ? <ProfileRouteCard deal={deal} profile={profile} onHide={hideProfileRoute} /> : <div style={{ ...card, marginBottom:0, padding:22 }}><p style={sub}>{profile ? "Profile route removed from this room." : "No saved profile found. Save Profile first so AI can route member cards here."}</p><Link href="/profile" style={{ ...goldBtn, marginTop: 16 }}>Open Profile</Link></div>}
          </div>
        </section>

        <section style={card}><div style={eyebrow}>Issues / Docs / Notes</div><div style={grid}><Fact label="Urgency" value={val(deal,["urgency"])}/><Fact label="Occupancy" value={val(deal,["occupancy"])}/><Fact label="Access" value={val(deal,["access"])}/><Fact label="Issues" value={knownIssues.join(", ") || "None listed"}/><Fact label="Docs" value={docs.join(", ") || "None listed"}/><Fact label="Assignment Fee" value={val(deal,["assignmentFee"])}/></div><div style={{ ...card, marginTop:20, marginBottom:0, padding:22 }}><div style={eyebrow}>AI Room Read</div><p style={sub}>{val(deal,["aiRead"],"No AI read saved.")}</p></div><div style={{ ...card, marginTop:20, marginBottom:0, padding:22 }}><div style={eyebrow}>Private Notes</div><p style={sub}>{val(deal,["notes"],"No notes saved.")}</p></div></section>
      </div>
    </main>
  );
}
