"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

type RoomState = "active" | "saved" | "archived" | "deleted";
type AlertedMember = { id: string; name: string; lane: string; contact: string; note: string; createdAt: string };
type DealRoom = Record<string, any> & { id: string; alertedMembers?: AlertedMember[]; roomState?: RoomState };

const ROOM_KEYS = ["vaultforge_clean_deal_rooms", "vaultforge_deal_rooms", "vaultforge_rooms_deals", "vf_deal_rooms"];
const STATE_KEY = "vaultforge_clean_room_states";

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
const input: React.CSSProperties = { width: "100%", boxSizing: "border-box", borderRadius: 16, border: "1px solid rgba(207,216,230,.18)", background: "#121724", color: "#f6f7fb", padding: "15px 16px", fontSize: 16, outline: "none" };

function getStates(): Record<string, RoomState> { try { return JSON.parse(window.localStorage.getItem(STATE_KEY) || "{}"); } catch { return {}; } }
function writeStates(states: Record<string, RoomState>) { window.localStorage.setItem(STATE_KEY, JSON.stringify(states)); }
function readArray(key: string): DealRoom[] { try { const raw = window.localStorage.getItem(key); const parsed = raw ? JSON.parse(raw) : []; return Array.isArray(parsed) ? parsed : []; } catch { return []; } }
function dealId(deal: DealRoom) { return String(deal.id || deal.roomId || deal.dealId || ""); }
function val(deal: DealRoom | null, keys: string[], fallback = "Not listed") { for (const k of keys) { const v = deal?.[k]; if (v !== undefined && v !== null && String(v).trim()) return String(v); } return fallback; }
function arr(deal: DealRoom | null, keys: string[]) { for (const k of keys) { const v = deal?.[k]; if (Array.isArray(v)) return v.map(String); if (typeof v === "string" && v.trim()) return v.split(",").map((x) => x.trim()).filter(Boolean); } return []; }
function money(v: string) { const clean = String(v || "").replace(/[^0-9.]/g, ""); if (!clean) return "Not listed"; const n = Number(clean); return Number.isNaN(n) ? v : `$${n.toLocaleString()}`; }
function photo(deal: DealRoom | null) { return val(deal, ["photoUrl", "imageUrl", "publicUrl", "photo", "photoDataUrl"], ""); }
function findDeal(id: string): DealRoom | null { const states = getStates(); for (const key of ROOM_KEYS) { const hit = readArray(key).find((deal) => dealId(deal) === id); if (hit) return { ...hit, id, roomState: states[id] || hit.roomState || "active" }; } for (const key of [`vaultforge_clean_deal_room_${id}`, `vaultforge_deal_room_${id}`, `vf_deal_room_${id}`]) { try { const raw = window.localStorage.getItem(key); if (raw) { const hit = JSON.parse(raw); return { ...hit, id, roomState: states[id] || hit.roomState || "active" }; } } catch {} } return null; }
function syncDeal(deal: DealRoom) { const id = dealId(deal); if (!id) return; window.localStorage.setItem(`vaultforge_clean_deal_room_${id}`, JSON.stringify(deal)); window.localStorage.setItem(`vaultforge_deal_room_${id}`, JSON.stringify(deal)); ROOM_KEYS.forEach((key) => { const rows = readArray(key).filter((item) => dealId(item) !== id); window.localStorage.setItem(key, JSON.stringify([deal, ...rows])); }); }

function Fact({ label, value }: { label: string; value: string }) { return <div style={{ background: "#121724", border: "1px solid rgba(207,216,230,.14)", borderRadius: 20, padding: 22 }}><div style={{ ...eyebrow, fontSize: 14, letterSpacing: 5 }}>{label}</div><div style={{ fontSize: 24, fontWeight: 850 }}>{value || "Not listed"}</div></div>; }

export default function DealRoomDetailPage() {
  const params = useParams();
  const id = decodeURIComponent(String(params?.id || ""));
  const [deal, setDeal] = useState<DealRoom | null>(null);
  const [memberName, setMemberName] = useState("");
  const [memberLane, setMemberLane] = useState("Buyer");
  const [memberContact, setMemberContact] = useState("");
  const [memberNote, setMemberNote] = useState("");

  function load() { setDeal(findDeal(id)); }
  useEffect(() => { load(); }, [id]);

  function setRoomState(state: RoomState) {
    if (!deal) return;
    const next = { ...deal, roomState: state, updatedAt: new Date().toISOString() };
    const states = getStates(); states[id] = state; writeStates(states); syncDeal(next); setDeal(next);
  }

  function addAlertedMember() {
    if (!deal || !memberName.trim()) return;
    const nextMember: AlertedMember = { id: `alert_${Date.now()}`, name: memberName.trim(), lane: memberLane, contact: memberContact.trim(), note: memberNote.trim(), createdAt: new Date().toISOString() };
    const next = { ...deal, alertedMembers: [...(Array.isArray(deal.alertedMembers) ? deal.alertedMembers : []), nextMember], updatedAt: new Date().toISOString() };
    syncDeal(next); setDeal(next); setMemberName(""); setMemberContact(""); setMemberNote("");
  }

  const routeTargets = arr(deal, ["routeTo", "routedTo"]);
  const knownIssues = arr(deal, ["knownIssues", "issues"]);
  const docs = arr(deal, ["docs"]);
  const img = photo(deal);
  const signalSummary = useMemo(() => deal ? val(deal, ["signalSummary"], `${val(deal,["assetClass"],"Deal")} signal in ${[val(deal,["city"],""), val(deal,["county"],""), val(deal,["state"],"")].filter(Boolean).join(", ")}. Ask ${money(val(deal,["askingPrice","ask"],""))}, value ${money(val(deal,["arv","value"],""))}, repairs ${money(val(deal,["repairs"],""))}. Route to ${routeTargets.join(", ") || "selected member profiles"}.`) : "", [deal, routeTargets]);

  if (!deal) return <main style={page}><div style={wrap}><nav style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:18 }}><Link href="/deal-rooms" style={goldBtn}>Back to Deal Rooms</Link><Link href="/deal-create" style={btn}>Create Deal</Link></nav><section style={card}><div style={eyebrow}>Deal Room</div><h1 style={h1}>Room not found.</h1><p style={sub}>This room was not found in local saved Deal Rooms. Go back and open a saved card.</p></section></div></main>;

  return <main style={page}><div style={wrap}>
    <nav style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:18 }}><Link href="/command" style={btn}>Command</Link><Link href="/deal-rooms" style={goldBtn}>Deal Rooms</Link><Link href="/messages" style={btn}>Messages</Link><Link href="/profile" style={btn}>Profile</Link><Link href="/" style={redBtn}>Exit</Link></nav>
    <section style={card}>{img ? <img src={img} alt={val(deal,["title"])} style={{width:"100%",maxHeight:430,objectFit:"cover",borderRadius:24,marginBottom:24,border:"1px solid rgba(207,216,230,.2)"}} /> : <div style={{border:"1px dashed rgba(207,216,230,.25)",borderRadius:24,padding:70,textAlign:"center",color:"#c9d0dc",marginBottom:24}}>No photo URL saved for this room</div>}<div style={eyebrow}>{val(deal,["assetClass","asset_class"],"Deal Room")}</div><h1 style={h1}>{val(deal,["title","name"],"Untitled Deal")}</h1><p style={sub}>{[val(deal,["city"],""), val(deal,["county"],""), val(deal,["state"],"")].filter(Boolean).join(" • ")}</p></section>
    <section style={card}><div style={eyebrow}>5S Cleanup Controls</div><div style={{display:"flex",gap:12,flexWrap:"wrap"}}><button type="button" onClick={() => setRoomState("saved")} style={goldBtn}>Save</button><button type="button" onClick={() => setRoomState("archived")} style={btn}>Archive</button><button type="button" onClick={() => setRoomState("deleted")} style={redBtn}>Delete</button><span style={btn}>Current: {deal.roomState || "active"}</span></div></section>
    <section style={card}><div style={eyebrow}>Signal Summary</div><p style={sub}>{signalSummary}</p></section>
    <section style={card}><div style={eyebrow}>Numbers + Asset Facts</div><div style={grid}><Fact label="Ask" value={money(val(deal,["askingPrice","ask"],""))}/><Fact label="ARV / Value" value={money(val(deal,["arv","value"],""))}/><Fact label="Repairs / Work" value={money(val(deal,["repairs"],""))}/><Fact label="Equity Spread" value={val(deal,["equitySpread"])}/><Fact label="Beds" value={val(deal,["beds"])}/><Fact label="Baths" value={val(deal,["baths"])}/><Fact label="Sqft" value={val(deal,["sqft"])}/><Fact label="Units" value={val(deal,["units"])}/><Fact label="Acres" value={val(deal,["acres"])}/><Fact label="Zoning" value={val(deal,["zoning"])}/></div></section>
    <section style={card}><div style={eyebrow}>Contact</div><div style={grid}><Fact label="Name" value={val(deal,["contactName"])}/><Fact label="Phone" value={val(deal,["contactPhone"])}/><Fact label="Email" value={val(deal,["contactEmail"])}/><Fact label="Best Contact" value={val(deal,["bestContact"])}/><Fact label="Submitter Role" value={val(deal,["submitterRole"])}/><Fact label="Deadline" value={val(deal,["deadline"])}/></div></section>
    <section style={card}><div style={eyebrow}>Routing Profile</div><h2 style={{fontSize:34,margin:"0 0 16px"}}>Who this should alert.</h2><p style={sub}>Route targets: {routeTargets.join(", ") || "Not selected"}. Match by state, county, asset type, capital profile, execution profile, urgency, and contact rules.</p><div style={grid}>{routeTargets.map((target) => <div key={target} style={{...card,marginBottom:0,padding:22}}><div style={{...eyebrow,fontSize:16}}>{target}</div><p style={{...sub,fontSize:18}}>Best-fit member lane for this room. AI should match member profile, market, capital/execution strength, and alert preferences.</p></div>)}</div></section>
    <section style={card}><div style={eyebrow}>Alerted Members</div><h2 style={{fontSize:34,margin:"0 0 16px"}}>+ Add who was routed.</h2><p style={sub}>Track each member/profile this deal was sent to or should be sent to.</p><div style={{...grid,marginTop:20}}><input style={input} value={memberName} onChange={(e)=>setMemberName(e.target.value)} placeholder="Member / Company"/><select style={input} value={memberLane} onChange={(e)=>setMemberLane(e.target.value)}>{["Buyer","Investor","Lender","Operator","Contractor","Broker","JV Partner","Developer","Property Manager"].map(x=><option key={x} value={x}>{x}</option>)}</select><input style={input} value={memberContact} onChange={(e)=>setMemberContact(e.target.value)} placeholder="Email / phone"/><input style={input} value={memberNote} onChange={(e)=>setMemberNote(e.target.value)} placeholder="Routing note"/></div><button type="button" onClick={addAlertedMember} style={{...goldBtn,marginTop:16}}>+ Add Alerted Member</button><div style={{marginTop:24}}>{Array.isArray(deal.alertedMembers) && deal.alertedMembers.length ? deal.alertedMembers.map((m)=><div key={m.id} style={{...card,padding:18,marginBottom:12}}><strong>{m.name}</strong> — {m.lane}<br/><span style={{color:"#c9d0dc"}}>{m.contact || "No contact"} {m.note ? `• ${m.note}` : ""}</span></div>) : <p style={sub}>No alerted members added yet.</p>}</div></section>
    <section style={card}><div style={eyebrow}>Issues / Docs / Notes</div><div style={grid}><Fact label="Urgency" value={val(deal,["urgency"])}/><Fact label="Occupancy" value={val(deal,["occupancy"])}/><Fact label="Access" value={val(deal,["access"])}/><Fact label="Issues" value={knownIssues.join(", ") || "None listed"}/><Fact label="Docs" value={docs.join(", ") || "None listed"}/><Fact label="Assignment Fee" value={val(deal,["assignmentFee"])}/></div><div style={{...card,marginTop:20,marginBottom:0,padding:22}}><div style={eyebrow}>AI Room Read</div><p style={sub}>{val(deal,["aiRead"],"No AI read saved.")}</p></div><div style={{...card,marginTop:20,marginBottom:0,padding:22}}><div style={eyebrow}>Private Notes</div><p style={sub}>{val(deal,["notes"],"No notes saved.")}</p></div></section>
  </div></main>;
}
