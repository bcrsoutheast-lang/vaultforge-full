"use client";

import Link from "next/link";
import { ChangeEvent, useMemo, useState } from "react";

type AssetClass = "Residential" | "Commercial" | "Land";
type PainRoom = Record<string, any> & { id: string; type: "pain"; photoUrls: string[] };

const STORAGE_KEYS = ["vaultforge_clean_pain_rooms_v1", "vaultforge_pain_rooms", "vf_pain_rooms"];
const STATES = ["GA", "TN", "AL", "FL", "NC", "SC", "TX"];
const PAIN_TYPES = ["Capital Gap", "Buyer Needed", "Lender Needed", "Operator Needed", "Contractor Problem", "Permit / Code", "Title / Probate", "Tenant Issue", "Stalled Rehab", "Seller Distress", "Time Pressure", "Unknown Problem"];
const BLOCKERS = ["Cash Short", "Bad Contractor", "No Buyer", "No Lender", "No Operator", "Title Issue", "Code Violation", "Permit Hold", "Inspection Fail", "Tenant Problem", "Access Problem", "Bad Numbers", "Timeline Risk"];
const ROUTING_NEEDS = ["Buyer", "Investor", "Lender", "Operator", "Contractor", "Broker", "Attorney", "Property Manager", "JV Partner", "Developer", "Permitting Help", "Disposition Help"];
const URGENCY = ["Low", "Medium", "High", "Emergency", "Today", "This Week", "Before Closing"];
const CONTACT = ["VaultForge Message", "Phone", "Email", "Text"];
const AUTHORITY = ["Owner", "Wholesaler", "Agent", "Broker", "Investor", "Operator", "Lender", "Contractor", "Decision Maker", "Helper / Representative"];
const ACCESS = ["Unknown", "Drive By", "Appointment", "Lockbox", "Owner Access", "Tenant Notice Needed", "No Access Yet"];
const OCCUPANCY = ["Unknown", "Vacant", "Owner Occupied", "Tenant Occupied", "Partially Occupied", "Under Construction"];

function makeId() { return `pain_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`; }
function toggle(list: string[], value: string) { return list.includes(value) ? list.filter((item) => item !== value) : [...list, value]; }
function readArray(key: string): any[] { try { const parsed = JSON.parse(window.localStorage.getItem(key) || "[]"); return Array.isArray(parsed) ? parsed : []; } catch { return []; } }
function money(value: string) { const clean = String(value || "").replace(/[^0-9.]/g, ""); if (!clean) return "not listed"; const n = Number(clean); return Number.isNaN(n) ? value : `$${n.toLocaleString()}`; }

function savePainEverywhere(room: PainRoom) {
  STORAGE_KEYS.forEach((key) => {
    const existing = readArray(key).filter((item) => String(item?.id || item?.painId || item?.roomId || "") !== room.id);
    window.localStorage.setItem(key, JSON.stringify([room, ...existing]));
  });
  window.localStorage.setItem(`vaultforge_clean_pain_room_${room.id}`, JSON.stringify(room));
  window.localStorage.setItem(`vaultforge_pain_room_${room.id}`, JSON.stringify(room));
  window.dispatchEvent(new Event("vaultforge-pain-change"));
}

export default function PainIntakePage() {
  const [assetClass, setAssetClass] = useState<AssetClass>("Residential");
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [savedId, setSavedId] = useState("");
  const [painTypes, setPainTypes] = useState<string[]>(["Capital Gap"]);
  const [blockers, setBlockers] = useState<string[]>([]);
  const [routingNeeds, setRoutingNeeds] = useState<string[]>(["Lender", "Operator"]);
  const [urgency, setUrgency] = useState<string[]>(["High"]);
  const [form, setForm] = useState({
    title: "", state: "GA", city: "", county: "", address: "", contactName: "", contactPhone: "", contactEmail: "", bestContact: "VaultForge Message", authority: "Owner",
    amountNeeded: "", propertyValue: "", payoff: "", askingPrice: "", arv: "", repairs: "", beds: "", baths: "", sqft: "", units: "", buildingSize: "", acres: "", zoning: "",
    occupancy: "Unknown", access: "Unknown", deadline: "", desiredOutcome: "", attemptedFixes: "", rootCauseGuess: "", notes: "", privateAiNotes: ""
  });

  function update(name: string, value: string) { setForm((current) => ({ ...current, [name]: value })); }
  function flash(message: string) { setToast(message); window.setTimeout(() => setToast(""), 2600); }

  async function uploadPhotos(event: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files || []).slice(0, 5 - photoUrls.length);
    if (!selected.length) return;
    setUploading(true);
    try {
      const data = new FormData();
      selected.forEach((file) => data.append("files", file));
      const res = await fetch("/api/uploads/pain", { method: "POST", body: data });
      const json = await res.json().catch(() => ({}));
      const urls = Array.isArray(json.urls) ? json.urls : Array.isArray(json.photoUrls) ? json.photoUrls : [];
      if (!res.ok || !urls.length) throw new Error(json.error || json.errors?.[0] || "Photos could not upload.");
      setPhotoUrls((current) => [...current, ...urls].slice(0, 5));
      flash(`${urls.length} photo${urls.length === 1 ? "" : "s"} uploaded.`);
    } catch (error) {
      flash(error instanceof Error ? error.message : "Photo upload failed.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  const solutionRead = useMemo(() => {
    const where = [form.city, form.county, form.state].filter(Boolean).join(", ") || "market not listed";
    const numbers = `need ${money(form.amountNeeded)}, value ${money(form.propertyValue || form.arv)}, payoff ${money(form.payoff)}, repairs ${money(form.repairs)}`;
    return `Problem room in ${where}. ${numbers}. Main pressure: ${painTypes.join(", ") || "not selected"}. Blockers: ${blockers.join(", ") || "not selected"}. Route to ${routingNeeds.join(", ") || "not selected"}. Desired outcome: ${form.desiredOutcome || "not listed"}. Next move: verify contact/control, confirm numbers, identify root cause, route to best-fit members, then move execution into Messages.`;
  }, [form, painTypes, blockers, routingNeeds]);

  function buildRoom(): PainRoom {
    const now = new Date().toISOString();
    return {
      id: makeId(), type: "pain", kind: "pain", assetClass, title: form.title.trim(), state: form.state, city: form.city.trim(), county: form.county.trim(), address: form.address.trim(),
      contactName: form.contactName.trim(), contactPhone: form.contactPhone.trim(), contactEmail: form.contactEmail.trim(), bestContact: form.bestContact, authority: form.authority,
      amountNeeded: form.amountNeeded.trim(), propertyValue: form.propertyValue.trim(), payoff: form.payoff.trim(), askingPrice: form.askingPrice.trim(), arv: form.arv.trim(), repairs: form.repairs.trim(),
      beds: form.beds.trim(), baths: form.baths.trim(), sqft: form.sqft.trim(), units: form.units.trim(), buildingSize: form.buildingSize.trim(), acres: form.acres.trim(), zoning: form.zoning.trim(),
      occupancy: form.occupancy, access: form.access, deadline: form.deadline.trim(), desiredOutcome: form.desiredOutcome.trim(), attemptedFixes: form.attemptedFixes.trim(), rootCauseGuess: form.rootCauseGuess.trim(), notes: form.notes.trim(), privateAiNotes: form.privateAiNotes.trim(),
      painTypes, blockers, routingNeeds, urgency, photoUrls, photoUrl: photoUrls[0] || "", solutionRead, createdAt: now, updatedAt: now, roomState: "active"
    };
  }

  function saveRoom() {
    if (saving) return;
    setSaving(true);
    try {
      if (!form.title.trim()) return flash("Add a pain room title before saving."), setSaving(false);
      if (!form.city.trim() || !form.state.trim()) return flash("Add city and state before saving."), setSaving(false);
      if (!form.contactName.trim() && !form.contactPhone.trim() && !form.contactEmail.trim()) return flash("Add owner/contact name, phone, or email."), setSaving(false);
      const room = buildRoom();
      savePainEverywhere(room);
      setSavedId(room.id);
      flash("Pain Solution Room saved.");
    } catch (error) {
      flash(error instanceof Error ? error.message : "Pain room could not save.");
    } finally {
      setSaving(false);
    }
  }

  return <main style={page}><div style={wrap}>
    <nav style={nav}><Link href="/command" style={navBtn}>Command</Link><Link href="/pain-rooms" style={goldBtn}>Pain Rooms</Link><Link href="/deal-rooms" style={navBtn}>Deal Rooms</Link><Link href="/messages" style={navBtn}>Messages</Link><Link href="/profile" style={navBtn}>Profile</Link><Link href="/" style={redBtn}>Exit</Link></nav>
    {toast ? <div style={toastBox}>{toast}</div> : null}
    <section style={card}><div style={eyebrow}>Pain Intake</div><h1 style={h1}>Solution room intake.</h1><p style={sub}>Capture the problem, property facts, photos, owner contact, blockers, root cause clues, desired outcome, and routing lanes. The room analyzes what is wrong and what has to happen next.</p></section>
    <section style={card}><div style={eyebrow}>Asset Class</div><div style={chips}>{(["Residential","Commercial","Land"] as AssetClass[]).map((x)=><button key={x} type="button" onClick={()=>setAssetClass(x)} style={assetClass===x?chipActive:chip}>{x}</button>)}</div></section>
    <section style={card}><div style={eyebrow}>Photos</div><p style={sub}>Upload up to 5 photos. Stored by URL, not browser blob.</p><input type="file" accept="image/*" multiple onChange={uploadPhotos} disabled={uploading || photoUrls.length >= 5} style={{marginTop:16}} /> <span style={{color:"#c9d0dc"}}>{uploading ? "Uploading..." : `${photoUrls.length}/5 uploaded`}</span><div style={photoGrid}>{photoUrls.map((url,i)=><div key={url} style={photoBox}><img src={url} alt={`Pain photo ${i+1}`} style={photoImg}/><button type="button" onClick={()=>setPhotoUrls(photoUrls.filter((x)=>x!==url))} style={removeBtn}>Remove</button></div>)}</div></section>
    <section style={card}><div style={eyebrow}>{assetClass} Problem Form</div><div style={grid}><Field label="Pain Room Title" value={form.title} onChange={(v)=>update("title",v)}/><Select label="State" value={form.state} options={STATES} onChange={(v)=>update("state",v)}/><Field label="City" value={form.city} onChange={(v)=>update("city",v)}/><Field label="County" value={form.county} onChange={(v)=>update("county",v)}/><Field label="Address / Location" value={form.address} onChange={(v)=>update("address",v)}/><Field label="Amount Needed" value={form.amountNeeded} onChange={(v)=>update("amountNeeded",v)}/><Field label="Property Value / ARV" value={form.propertyValue} onChange={(v)=>update("propertyValue",v)}/><Field label="Payoff / Debt" value={form.payoff} onChange={(v)=>update("payoff",v)}/><Field label="Repairs / Work" value={form.repairs} onChange={(v)=>update("repairs",v)}/>{assetClass==="Residential"?<><Field label="Beds" value={form.beds} onChange={(v)=>update("beds",v)}/><Field label="Baths" value={form.baths} onChange={(v)=>update("baths",v)}/><Field label="Sqft" value={form.sqft} onChange={(v)=>update("sqft",v)}/></>:null}{assetClass==="Commercial"?<><Field label="Units" value={form.units} onChange={(v)=>update("units",v)}/><Field label="Building Size" value={form.buildingSize} onChange={(v)=>update("buildingSize",v)}/><Field label="Zoning" value={form.zoning} onChange={(v)=>update("zoning",v)}/></>:null}{assetClass==="Land"?<><Field label="Acres" value={form.acres} onChange={(v)=>update("acres",v)}/><Field label="Zoning" value={form.zoning} onChange={(v)=>update("zoning",v)}/></>:null}</div></section>
    <section style={card}><div style={eyebrow}>Contact + Control</div><div style={grid}><Field label="Owner / Contact Name" value={form.contactName} onChange={(v)=>update("contactName",v)}/><Field label="Phone" value={form.contactPhone} onChange={(v)=>update("contactPhone",v)}/><Field label="Email" value={form.contactEmail} onChange={(v)=>update("contactEmail",v)}/><Field label="Deadline / Critical Date" value={form.deadline} onChange={(v)=>update("deadline",v)}/><Select label="Best Contact" value={form.bestContact} options={CONTACT} onChange={(v)=>update("bestContact",v)}/><Select label="Authority" value={form.authority} options={AUTHORITY} onChange={(v)=>update("authority",v)}/><Select label="Occupancy" value={form.occupancy} options={OCCUPANCY} onChange={(v)=>update("occupancy",v)}/><Select label="Access" value={form.access} options={ACCESS} onChange={(v)=>update("access",v)}/></div></section>
    <Choice title="Pain Types" options={PAIN_TYPES} values={painTypes} onToggle={(v)=>setPainTypes(toggle(painTypes,v))}/><Choice title="Blockers" options={BLOCKERS} values={blockers} onToggle={(v)=>setBlockers(toggle(blockers,v))}/><Choice title="Route To" options={ROUTING_NEEDS} values={routingNeeds} onToggle={(v)=>setRoutingNeeds(toggle(routingNeeds,v))}/><Choice title="Urgency" options={URGENCY} values={urgency} onToggle={(v)=>setUrgency(toggle(urgency,v))}/>
    <section style={card}><div style={eyebrow}>Analyze + Solve</div><p style={sub}>{solutionRead}</p><div style={grid}><Text label="Desired Outcome" value={form.desiredOutcome} onChange={(v)=>update("desiredOutcome",v)}/><Text label="Attempted Fixes" value={form.attemptedFixes} onChange={(v)=>update("attemptedFixes",v)}/><Text label="Likely Root Cause" value={form.rootCauseGuess} onChange={(v)=>update("rootCauseGuess",v)}/><Text label="Private AI Notes" value={form.privateAiNotes} onChange={(v)=>update("privateAiNotes",v)}/></div></section>
    <section style={card}><div style={eyebrow}>Save Solution Room</div><button type="button" onClick={saveRoom} style={goldButton}>{saving?"Saving...":"Save Pain Solution Room"}</button><Link href="/pain-rooms" style={{...navBtn,marginLeft:12}}>Open Pain Rooms</Link>{savedId?<Link href={`/pain-rooms/${savedId}`} style={{...navBtn,marginLeft:12}}>Open New Room</Link>:null}</section>
  </div></main>;
}

function Field({label,value,onChange}:{label:string;value:string;onChange:(v:string)=>void}){return <label><span style={labelStyle}>{label}</span><input style={input} value={value} onChange={(e)=>onChange(e.target.value)} placeholder={label}/></label>}
function Select({label,value,options,onChange}:{label:string;value:string;options:string[];onChange:(v:string)=>void}){return <label><span style={labelStyle}>{label}</span><select style={input} value={value} onChange={(e)=>onChange(e.target.value)}>{options.map(x=><option key={x} value={x}>{x}</option>)}</select></label>}
function Text({label,value,onChange}:{label:string;value:string;onChange:(v:string)=>void}){return <label><span style={labelStyle}>{label}</span><textarea style={{...input,minHeight:120,resize:"vertical"}} value={value} onChange={(e)=>onChange(e.target.value)} placeholder={label}/></label>}
function Choice({title,options,values,onToggle}:{title:string;options:string[];values:string[];onToggle:(v:string)=>void}){return <section style={card}><div style={eyebrow}>{title}</div><div style={chips}>{options.map(x=><button key={x} type="button" onClick={()=>onToggle(x)} style={values.includes(x)?chipActive:chip}>{x}</button>)}</div></section>}

const page:React.CSSProperties={minHeight:"100vh",background:"#05070d",color:"#f7f7fb",padding:18,fontFamily:"Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"};
const wrap:React.CSSProperties={maxWidth:1180,margin:"0 auto",paddingBottom:70}; const nav:React.CSSProperties={display:"flex",gap:10,flexWrap:"wrap",marginBottom:18};
const navBtn:React.CSSProperties={border:"1px solid rgba(207,216,230,.18)",background:"#171c29",color:"#f7f7fb",borderRadius:999,padding:"13px 18px",fontWeight:950,textDecoration:"none",display:"inline-block"}; const goldBtn:React.CSSProperties={...navBtn,border:0,background:"#ffdc68",color:"#10131a"}; const redBtn:React.CSSProperties={...navBtn,background:"#271016",borderColor:"rgba(255,70,70,.48)",color:"#ffaaaa"};
const card:React.CSSProperties={background:"linear-gradient(180deg,#080d19,#050816)",border:"1px solid rgba(245,197,66,.28)",borderRadius:26,padding:28,marginBottom:22}; const eyebrow:React.CSSProperties={color:"#ffd45a",textTransform:"uppercase",letterSpacing:8,fontWeight:900,fontSize:18,marginBottom:14}; const h1:React.CSSProperties={fontSize:"clamp(42px,7vw,72px)",lineHeight:.92,letterSpacing:-4,margin:"0 0 18px",fontWeight:950}; const sub:React.CSSProperties={color:"#c9d0dc",fontSize:21,lineHeight:1.35,margin:0};
const grid:React.CSSProperties={display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(230px,1fr))",gap:16,marginTop:16}; const input:React.CSSProperties={width:"100%",boxSizing:"border-box",borderRadius:16,border:"1px solid rgba(207,216,230,.18)",background:"#121724",color:"#f6f7fb",padding:"15px 16px",fontSize:16,outline:"none"}; const labelStyle:React.CSSProperties={display:"block",color:"#ffd45a",fontSize:13,letterSpacing:2.8,textTransform:"uppercase",fontWeight:900,marginBottom:8}; const chips:React.CSSProperties={display:"flex",flexWrap:"wrap",gap:10}; const chip:React.CSSProperties={border:"1px solid rgba(207,216,230,.18)",background:"#171c29",color:"#f7f7fb",borderRadius:999,padding:"12px 16px",fontWeight:900,cursor:"pointer"}; const chipActive:React.CSSProperties={...chip,background:"#ffdc68",borderColor:"#ffdc68",color:"#10131a"}; const goldButton:React.CSSProperties={border:0,background:"#ffdc68",color:"#10131a",borderRadius:999,padding:"15px 22px",fontWeight:950,cursor:"pointer"}; const toastBox:React.CSSProperties={position:"fixed",top:18,left:"50%",transform:"translateX(-50%)",zIndex:9999,background:"#102818",color:"#fff",border:"1px solid rgba(101,255,151,.5)",borderRadius:18,padding:"14px 18px",boxShadow:"0 18px 70px rgba(0,0,0,.55)",fontWeight:900}; const photoGrid:React.CSSProperties={display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:12,marginTop:16}; const photoBox:React.CSSProperties={position:"relative",borderRadius:18,overflow:"hidden",border:"1px solid rgba(207,216,230,.18)",minHeight:150,background:"#101622"}; const photoImg:React.CSSProperties={width:"100%",height:"100%",objectFit:"cover",display:"block"}; const removeBtn:React.CSSProperties={position:"absolute",right:8,bottom:8,border:0,borderRadius:999,padding:"8px 10px",background:"#271016",color:"#ffaaaa",fontWeight:900};
