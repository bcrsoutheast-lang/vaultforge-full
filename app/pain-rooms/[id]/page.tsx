"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

type RoomState = "active" | "saved" | "archived" | "deleted";
type PainRoom = Record<string, any> & { id: string; roomState?: RoomState };
type Profile = Record<string, any>;

const STORAGE_KEYS = ["vaultforge_clean_pain_rooms_v1", "vaultforge_pain_rooms", "vf_pain_rooms"];
const STATE_KEY = "vaultforge_clean_room_states";
const PROFILE_KEY = "vaultforge_profile_v2";

function readArray(key: string): any[] { try { const parsed = JSON.parse(window.localStorage.getItem(key) || "[]"); return Array.isArray(parsed) ? parsed : []; } catch { return []; } }
function writeArray(key: string, rows: any[]) { window.localStorage.setItem(key, JSON.stringify(rows)); }
function idOf(row: any) { return String(row?.id || row?.painId || row?.roomId || ""); }
function readStates(): Record<string, RoomState> { try { return JSON.parse(window.localStorage.getItem(STATE_KEY) || "{}"); } catch { return {}; } }
function writeStates(states: Record<string, RoomState>) { window.localStorage.setItem(STATE_KEY, JSON.stringify(states)); }
function val(row: any, keys: string[], fallback = "Not listed") { for (const key of keys) { const value = row?.[key]; if (value !== undefined && value !== null && String(value).trim()) return String(value); } return fallback; }
function arr(row: any, key: string) { const value = row?.[key]; if (Array.isArray(value)) return value.map(String); if (typeof value === "string" && value.trim()) return value.split(",").map((x) => x.trim()).filter(Boolean); return []; }
function money(value: any) { const clean = String(value || "").replace(/[^0-9.]/g, ""); if (!clean) return "Not listed"; const n = Number(clean); return Number.isNaN(n) ? String(value) : `$${n.toLocaleString()}`; }
function photos(room: any) { const list = Array.isArray(room?.photoUrls) ? room.photoUrls : []; const single = val(room, ["photoUrl", "photo", "imageUrl"], ""); return [single, ...list].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i); }
function findRoom(id: string): PainRoom | null { const states = readStates(); for (const key of STORAGE_KEYS) { const hit = readArray(key).find((row) => idOf(row) === id); if (hit) return { ...hit, id, roomState: states[`pain:${id}`] || states[id] || hit.roomState || "active" }; } for (const key of [`vaultforge_clean_pain_room_${id}`, `vaultforge_pain_room_${id}`]) { try { const raw = window.localStorage.getItem(key); if (raw) { const hit = JSON.parse(raw); return { ...hit, id, roomState: states[`pain:${id}`] || states[id] || hit.roomState || "active" }; } } catch {} } return null; }
function syncRoom(room: PainRoom) { const id = room.id; STORAGE_KEYS.forEach((key) => { const rows = readArray(key).filter((item) => idOf(item) !== id); writeArray(key, [room, ...rows]); }); window.localStorage.setItem(`vaultforge_clean_pain_room_${id}`, JSON.stringify(room)); window.localStorage.setItem(`vaultforge_pain_room_${id}`, JSON.stringify(room)); window.dispatchEvent(new Event("vaultforge-pain-change")); }
function readProfile(): Profile | null { try { const raw = window.localStorage.getItem(PROFILE_KEY); return raw ? JSON.parse(raw) : null; } catch { return null; } }

function scoreProfile(room: PainRoom, profile: Profile | null) {
  if (!profile) return { score: 0, reasons: ["No saved profile found yet."], matched: false };
  let score = 0;
  const reasons: string[] = [];
  const state = val(room, ["state"], "");
  const asset = val(room, ["assetClass"], "");
  const needs = arr(room, "routingNeeds");
  const blockers = arr(room, "blockers");
  const allStates = [...(profile.buyStates || []), ...(profile.operateStates || []), ...(profile.alertStates || []), ...(profile.contactStates || [])];
  if (state && allStates.includes(state)) { score += 25; reasons.push(`State fit: ${state}`); }
  if (asset && (profile.assetTypes || []).some((x: string) => x.toLowerCase().includes(asset.toLowerCase()) || asset.toLowerCase().includes(x.toLowerCase()))) { score += 20; reasons.push(`Asset fit: ${asset}`); }
  if (needs.some((need) => (profile.memberTypes || []).includes(need) || (profile.capitalRoles || []).includes(need) || (profile.executionCapabilities || []).includes(need))) { score += 25; reasons.push(`Routing need fit: ${needs.join(", ")}`); }
  if (blockers.some((b) => String(profile.painPreferences || []).toLowerCase().includes(b.toLowerCase()) || String(profile.executionCapabilities || []).toLowerCase().includes(b.toLowerCase()))) { score += 15; reasons.push("Blocker preference/capability fit"); }
  if ((profile.routingRules || []).includes("Allow AI Routing")) { score += 15; reasons.push("AI routing allowed"); }
  return { score: Math.min(100, score), reasons: reasons.length ? reasons : ["Profile exists, but fit signals are weak. Add states/assets/capabilities to profile."], matched: score > 0 };
}

export default function PainRoomDetailPage() {
  const params = useParams();
  const id = decodeURIComponent(String(params?.id || ""));
  const [room, setRoom] = useState<PainRoom | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  function load() { setRoom(findRoom(id)); setProfile(readProfile()); }
  useEffect(() => { load(); }, [id]);

  function setRoomState(state: RoomState) {
    if (!room) return;
    const next = { ...room, roomState: state, updatedAt: new Date().toISOString() };
    const states = readStates(); states[`pain:${id}`] = state; writeStates(states); syncRoom(next); setRoom(next);
  }

  const photoList = photos(room);
  const routingNeeds = arr(room, "routingNeeds");
  const blockers = arr(room, "blockers");
  const painTypes = arr(room, "painTypes");
  const urgency = arr(room, "urgency");
  const fit = useMemo(() => scoreProfile(room || {}, profile), [room, profile]);
  const messageHref = room ? `/messages?type=pain&room=${encodeURIComponent(room.id)}&subject=${encodeURIComponent(`Pain: ${val(room,["title"],"Pain Room")}`)}` : "/messages";
  const analysis = room ? `This room is showing ${painTypes.join(", ") || "an unresolved problem"} in ${[room.city, room.county, room.state].filter(Boolean).join(", ") || "an unknown market"}. Current blockers are ${blockers.join(", ") || "not listed"}. The practical next step is to confirm ownership/control, verify numbers, identify the root cause, route to ${routingNeeds.join(", ") || "best-fit members"}, and move communication into the room thread.` : "";

  if (!room) return <main style={page}><div style={wrap}><nav style={nav}><Link href="/pain-rooms" style={goldBtn}>Back to Pain Rooms</Link><Link href="/pain-intake" style={navBtn}>Pain Intake</Link></nav><section style={card}><div style={eyebrow}>Pain Room</div><h1 style={h1}>Room not found.</h1><p style={sub}>This pain room was not found in saved local rooms.</p></section></div></main>;

  return <main style={page}><div style={wrap}>
    <nav style={nav}><Link href="/command" style={navBtn}>Command</Link><Link href="/pain-rooms" style={goldBtn}>Pain Rooms</Link><Link href="/pain-intake" style={navBtn}>Pain Intake</Link><Link href={messageHref} style={goldBtn}>Message Owner</Link><Link href="/profile" style={navBtn}>Profile</Link><Link href="/" style={redBtn}>Exit</Link></nav>
    <section style={card}>{photoList.length?<div style={photoGrid}>{photoList.map((url)=><img key={url} src={url} alt={val(room,["title"],"Pain room")} style={photo}/>)}</div>:<div style={photoEmpty}>No photo saved for this room</div>}<div style={eyebrow}>{val(room,["assetClass"],"Pain Room")}</div><h1 style={h1}>{val(room,["title"],"Untitled Pain Room")}</h1><p style={sub}>{[room.city, room.county, room.state].filter(Boolean).join(" • ")}</p></section>
    <section style={card}><div style={eyebrow}>Cleanup Controls</div><div style={actions}><button type="button" onClick={()=>setRoomState("saved")} style={goldBtn}>Save</button><button type="button" onClick={()=>setRoomState("archived")} style={navBtn}>Archive</button><button type="button" onClick={()=>setRoomState("deleted")} style={redBtn}>Delete</button><span style={navBtn}>Current: {room.roomState || "active"}</span></div></section>
    <section style={card}><div style={eyebrow}>Analyze + Solve</div><h2 style={h2}>What is wrong and what happens next.</h2><p style={sub}>{analysis}</p></section>
    <section style={card}><div style={eyebrow}>Pressure + Numbers</div><div style={grid}><Fact label="Amount Needed" value={money(room.amountNeeded)}/><Fact label="Value / ARV" value={money(room.propertyValue||room.arv)}/><Fact label="Payoff / Debt" value={money(room.payoff)}/><Fact label="Repairs / Work" value={money(room.repairs)}/><Fact label="Deadline" value={val(room,["deadline"])}/><Fact label="Occupancy" value={val(room,["occupancy"])}/><Fact label="Access" value={val(room,["access"])}/><Fact label="Authority" value={val(room,["authority"])}/></div></section>
    <section style={card}><div style={eyebrow}>Property Facts</div><div style={grid}><Fact label="Beds" value={val(room,["beds"])}/><Fact label="Baths" value={val(room,["baths"])}/><Fact label="Sqft" value={val(room,["sqft"])}/><Fact label="Units" value={val(room,["units"])}/><Fact label="Building" value={val(room,["buildingSize"])}/><Fact label="Acres" value={val(room,["acres"])}/><Fact label="Zoning" value={val(room,["zoning"])}/><Fact label="Address" value={val(room,["address"])}/></div></section>
    <section style={card}><div style={eyebrow}>Owner Contact</div><div style={grid}><Fact label="Name" value={val(room,["contactName"])}/><Fact label="Phone" value={val(room,["contactPhone"])}/><Fact label="Email" value={val(room,["contactEmail"])}/><Fact label="Best Contact" value={val(room,["bestContact"])}/></div><Link href={messageHref} style={{...goldBtn,marginTop:18}}>Message Owner About: {val(room,["title"],"Pain Room")}</Link></section>
    <section style={card}><div style={eyebrow}>Routing + Member Fit</div><h2 style={h2}>AI routed profile.</h2>{profile?<div style={profileCard}>{profile.profilePhoto?<img src={profile.profilePhoto} alt="Profile" style={avatar}/>:<div style={avatarEmpty}>No profile photo</div>}<div><h3 style={profileName}>{profile.fullName || profile.company || "Saved Profile"}</h3><p style={subSmall}>{profile.company || "Company not listed"}</p><p style={subSmall}>Contact: {(profile.preferredContact||[]).join(", ") || "VaultForge Message"} • {profile.phone || profile.email || "No contact listed"}</p><p style={subSmall}>Fit score: {fit.score}%</p><p style={subSmall}>Why: {fit.reasons.join(" • ")}</p></div></div>:<p style={sub}>No saved member profile found. Save a profile first so rooms can route automatically.</p>}<div style={grid}><Fact label="Pain Types" value={painTypes.join(", ")||"Not selected"}/><Fact label="Blockers" value={blockers.join(", ")||"Not selected"}/><Fact label="Route Needs" value={routingNeeds.join(", ")||"Not selected"}/><Fact label="Urgency" value={urgency.join(", ")||"Not selected"}/></div></section>
    <section style={card}><div style={eyebrow}>Execution Notes</div><div style={grid}><Fact label="Desired Outcome" value={val(room,["desiredOutcome"])}/><Fact label="Attempted Fixes" value={val(room,["attemptedFixes"])}/><Fact label="Likely Root Cause" value={val(room,["rootCauseGuess"])}/><Fact label="Private AI Notes" value={val(room,["privateAiNotes","notes"])}/></div><div style={{...factBox,marginTop:18}}><div style={factLabel}>Room Read</div><p style={subSmall}>{val(room,["solutionRead"],"No solution read saved.")}</p></div></section>
  </div></main>;
}
function Fact({label,value}:{label:string;value:string}){return <div style={factBox}><div style={factLabel}>{label}</div><div style={factValue}>{value||"Not listed"}</div></div>}

const page:React.CSSProperties={minHeight:"100vh",background:"#05070d",color:"#f7f7fb",padding:18,fontFamily:"Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"}; const wrap:React.CSSProperties={maxWidth:1180,margin:"0 auto",paddingBottom:70}; const nav:React.CSSProperties={display:"flex",gap:10,flexWrap:"wrap",marginBottom:18}; const navBtn:React.CSSProperties={border:"1px solid rgba(207,216,230,.18)",background:"#171c29",color:"#f7f7fb",borderRadius:999,padding:"13px 18px",fontWeight:950,textDecoration:"none",display:"inline-block",cursor:"pointer"}; const goldBtn:React.CSSProperties={...navBtn,border:0,background:"#ffdc68",color:"#10131a"}; const redBtn:React.CSSProperties={...navBtn,background:"#271016",borderColor:"rgba(255,70,70,.48)",color:"#ffaaaa"}; const card:React.CSSProperties={background:"linear-gradient(180deg,#080d19,#050816)",border:"1px solid rgba(245,197,66,.28)",borderRadius:26,padding:28,marginBottom:22}; const eyebrow:React.CSSProperties={color:"#ffd45a",textTransform:"uppercase",letterSpacing:8,fontWeight:900,fontSize:18,marginBottom:14}; const h1:React.CSSProperties={fontSize:"clamp(42px,7vw,72px)",lineHeight:.92,letterSpacing:-4,margin:"0 0 18px",fontWeight:950}; const h2:React.CSSProperties={fontSize:"clamp(30px,5vw,48px)",lineHeight:.96,letterSpacing:-2,margin:"0 0 18px",fontWeight:950}; const sub:React.CSSProperties={color:"#c9d0dc",fontSize:21,lineHeight:1.35,margin:0}; const subSmall:React.CSSProperties={color:"#c9d0dc",fontSize:18,lineHeight:1.35,margin:"0 0 8px"}; const photoGrid:React.CSSProperties={display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:12,marginBottom:24}; const photo:React.CSSProperties={width:"100%",height:260,objectFit:"cover",borderRadius:20,border:"1px solid rgba(207,216,230,.18)"}; const photoEmpty:React.CSSProperties={height:260,borderRadius:20,border:"1px dashed rgba(207,216,230,.25)",display:"grid",placeItems:"center",color:"#c9d0dc",marginBottom:24}; const actions:React.CSSProperties={display:"flex",gap:10,flexWrap:"wrap"}; const grid:React.CSSProperties={display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(230px,1fr))",gap:16,marginTop:16}; const factBox:React.CSSProperties={background:"#121724",border:"1px solid rgba(207,216,230,.14)",borderRadius:20,padding:22}; const factLabel:React.CSSProperties={color:"#ffd45a",textTransform:"uppercase",letterSpacing:5,fontWeight:900,fontSize:13,marginBottom:10}; const factValue:React.CSSProperties={fontSize:22,fontWeight:850,color:"#f7f7fb"}; const profileCard:React.CSSProperties={display:"grid",gridTemplateColumns:"120px 1fr",gap:18,alignItems:"center",border:"1px solid rgba(245,197,66,.24)",background:"rgba(255,220,104,.05)",borderRadius:22,padding:18,marginBottom:18}; const avatar:React.CSSProperties={width:120,height:120,borderRadius:22,objectFit:"cover",border:"1px solid rgba(207,216,230,.18)"}; const avatarEmpty:React.CSSProperties={width:120,height:120,borderRadius:22,display:"grid",placeItems:"center",border:"1px dashed rgba(207,216,230,.25)",color:"#c9d0dc",textAlign:"center"}; const profileName:React.CSSProperties={fontSize:30,margin:"0 0 8px",fontWeight:950};
