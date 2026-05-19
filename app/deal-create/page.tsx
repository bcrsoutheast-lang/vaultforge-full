"use client";
import Link from "next/link";
import {useState} from "react";

type RoomState = "active" | "saved" | "archived" | "deleted";
type RoomKind = "deal" | "pain";

type Room = {
  id?: string;
  roomId?: string;
  title?: string;
  name?: string;
  state?: string;
  city?: string;
  county?: string;
  address?: string;
  assetClass?: string;
  propertyType?: string;
  strategy?: string[] | string;
  exitStrategy?: string[] | string;
  routeTo?: string[] | string;
  routedTo?: string[] | string;
  routingNeeds?: string[] | string;
  askingPrice?: string;
  propertyValue?: string;
  arv?: string;
  repairs?: string;
  payoff?: string;
  amountNeeded?: string;
  equitySpread?: string;
  assignmentFee?: string;
  deadline?: string;
  beds?: string;
  baths?: string;
  sqft?: string;
  units?: string;
  buildingSize?: string;
  acres?: string;
  zoning?: string;
  occupancy?: string;
  access?: string;
  knownIssues?: string[] | string;
  docs?: string[] | string;
  availableDocs?: string[] | string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  bestContact?: string;
  submitterRole?: string;
  painTypes?: string[] | string;
  urgency?: string[] | string;
  blockers?: string[] | string;
  rootCause?: string;
  targetOutcome?: string;
  currentState?: string;
  constraints?: string;
  desiredSolution?: string;
  roomState?: RoomState;
  cleanupState?: RoomState;
  stateStatus?: RoomState;
  viewedAt?: string;
  alertRead?: boolean;
  createdAt?: string;
  updatedAt?: string;
  photoUrls?: string[];
  photos?: string[];
  notes?: string;
  analyzer?: string;
  aiRead?: string;
  [key:string]: unknown;
};

type Profile = {
  id?: string;
  name?: string;
  company?: string;
  email?: string;
  phone?: string;
  photoUrl?: string;
  memberType?: string;
  bestContact?: string;
  statesOperatedIn?: string[] | string;
  states?: string[] | string;
  counties?: string[] | string;
  markets?: string[] | string;
  strategies?: string[] | string;
  assetTypes?: string[] | string;
  capitalRole?: string[] | string;
  buyerType?: string[] | string;
  lenderType?: string[] | string;
  operatorType?: string[] | string;
  priceRange?: string;
  capitalAvailable?: string;
  fundingCapacity?: string;
  timeline?: string;
  riskTolerance?: string[] | string;
  dealPreferences?: string[] | string;
  painFit?: string[] | string;
  contactRules?: string[] | string;
  alertsWanted?: string[] | string;
  notes?: string;
  status?: RoomState;
  [key:string]: unknown;
};

const STATES = ["GA","TN","AL","FL","NC","SC","TX"];

const DEAL_KEYS = ["vaultforge_clean_deal_rooms","vaultforge_deal_rooms","vaultforge_rooms_deals","vf_deal_rooms"];
const PAIN_KEYS = ["vaultforge_clean_pain_rooms_v1","vaultforge_clean_pain_rooms","vaultforge_pain_rooms","vaultforge_rooms_pain","vf_pain_rooms"];
const STATE_KEYS = ["vaultforge_clean_room_states","vaultforge_room_states","vaultforge_deal_room_states","vaultforge_pain_room_states","vaultforge_5s_room_states"];

const PROFILE_KEY = "vaultforge_member_profile_v1";
const NETWORK_KEY = "vaultforge_network_members_v1";

function ok(){return typeof window!=="undefined"&&typeof window.localStorage!=="undefined"}
function j<T>(raw:string|null,fb:T):T{try{return raw?JSON.parse(raw) as T:fb}catch{return fb}}
function txt(v:unknown,fb=""){const s=String(v||"").trim();return s||fb}
function list(v:unknown):string[]{if(Array.isArray(v))return v.map(x=>String(x).trim()).filter(Boolean);if(typeof v==="string"&&v.trim())return v.split(",").map(x=>x.trim()).filter(Boolean);return[]}
function rid(r:Room|null|undefined){return txt(r?.id||r?.roomId)}
function arr<T>(key:string):T[]{if(!ok())return[];const p=j<unknown>(localStorage.getItem(key),[]);return Array.isArray(p)?p as T[]:[]}
function keys(kind:RoomKind){return kind==="deal"?DEAL_KEYS:PAIN_KEYS}
function statesMap(){const m:Record<string,RoomState>={};if(!ok())return m;STATE_KEYS.forEach(k=>Object.assign(m,j<Record<string,RoomState>>(localStorage.getItem(k),{})));return m}
function saveStateMap(m:Record<string,RoomState>){if(!ok())return;STATE_KEYS.forEach(k=>localStorage.setItem(k,JSON.stringify(m)))}
function photoDataUrls(files:FileList|null,max=10):Promise<string[]>{return new Promise(resolve=>{const selected=Array.from(files||[]).slice(0,max);if(!selected.length){resolve([]);return}Promise.all(selected.map(file=>new Promise<string>(res=>{const reader=new FileReader();reader.onload=()=>res(String(reader.result||""));reader.onerror=()=>res("");reader.readAsDataURL(file)}))).then(rows=>resolve(rows.filter(Boolean)))})}
function saveRoom(kind:RoomKind,room:Room){if(!ok())return"";const id=rid(room)||`${kind}_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;const now=new Date().toISOString();const next={...room,id,roomId:id,roomState:"active" as RoomState,cleanupState:"active" as RoomState,stateStatus:"active" as RoomState,createdAt:txt(room.createdAt,now),updatedAt:now,alertRead:false,viewedAt:""};[`vaultforge_clean_${kind}_room_${id}`,`vaultforge_${kind}_room_${id}`,`vf_${kind}_room_${id}`].forEach(x=>localStorage.setItem(x,JSON.stringify(next)));keys(kind).forEach(key=>localStorage.setItem(key,JSON.stringify([next,...arr<Room>(key).filter(x=>rid(x)!==id)])));const sm=statesMap();sm[id]="active";sm[`${kind}:${id}`]="active";saveStateMap(sm);window.dispatchEvent(new Event("vaultforge-room-state-change"));window.dispatchEvent(new Event(kind==="deal"?"vaultforge-deal-change":"vaultforge-pain-change"));return id}
function readProfile():Profile{return ok()?j<Profile>(localStorage.getItem(PROFILE_KEY),{}):{}}
function profileStates(p:Profile){const st=list(p.statesOperatedIn||p.states).map(x=>x.toUpperCase());return st.length?st:["GA"]}
function saveProfile(p:Profile){if(!ok())return;const next={...p,id:p.id||txt(p.email,"current-profile"),statesOperatedIn:profileStates(p),updatedAt:new Date().toISOString()};localStorage.setItem(PROFILE_KEY,JSON.stringify(next));const current=j<Profile[]>(localStorage.getItem(NETWORK_KEY),[]);const rows=Array.isArray(current)?current.filter(m=>txt(m.id||m.email||m.name||m.company).toLowerCase()!==txt(next.id||next.email||next.name||next.company).toLowerCase()):[];localStorage.setItem(NETWORK_KEY,JSON.stringify([next,...rows]));window.dispatchEvent(new Event("vaultforge-network-change"))}


function Nav({active}:{active:string}){return <nav style={nav}><div style={brand}>VAULTFORGE</div><Link href="/command" style={active==="command"?goldBtn:btn}>Command</Link><Link href="/deal-rooms" style={btn}>Deal Rooms</Link><Link href="/deal-create" style={active==="deal"?goldBtn:btn}>Create Deal</Link><Link href="/pain-intake" style={active==="pain"?goldBtn:btn}>Pain Intake</Link><Link href="/pain-rooms" style={btn}>Pain Rooms</Link><Link href="/network" style={btn}>Network</Link><Link href="/messages" style={btn}>Messages</Link><Link href="/profile" style={active==="profile"?goldBtn:btn}>Profile</Link><Link href="/logout" style={redBtn}>Logout</Link></nav>}
function Field({l,v,c}:{l:string;v:string;c:(v:string)=>void}){return <label><div style={label}>{l}</div><input style={input} value={v} onChange={e=>c(e.target.value)}/></label>}
function Area({l,v,c}:{l:string;v:string;c:(v:string)=>void}){return <label><div style={label}>{l}</div><textarea style={textArea} value={v} onChange={e=>c(e.target.value)}/></label>}
function Select({l,v,c}:{l:string;v:string;c:(v:string)=>void}){return <label><div style={label}>{l}</div><select style={input} value={v} onChange={e=>c(e.target.value)}>{STATES.map(s=><option key={s} value={s}>{s}</option>)}</select></label>}
function MultiChips({labelName,options,selected,onToggle}:{labelName:string;options:string[];selected:string[];onToggle:(v:string)=>void}){return <div><div style={label}>{labelName}</div><div style={row}>{options.map(o=><button type="button" key={o} onClick={()=>onToggle(o)} style={selected.includes(o)?chipActive:chip}>{o}</button>)}</div></div>}

const ASSETS=["Residential","Commercial","Land"];
const STRATEGIES=["Wholesale","Flip","Buy & Hold","Development","Rental","BRRRR","Assignment","JV","Owner Finance"];
const ROUTES=["Buyer","Investor","Lender","Operator","Contractor","Developer","Wholesaler","Attorney","Property Manager"];
const DOCS=["Photos","Appraisal","Inspection","Survey","Rent Roll","Comps","Title","Tax Bill","Plans","Permits"];
export default function Page(){
 const [f,setF]=useState<Room>({assetClass:"Residential",state:"GA",routeTo:["Buyer"]}); const [files,setFiles]=useState<FileList|null>(null); const [msg,setMsg]=useState("");
 function up(k:string,v:unknown){setF({...f,[k]:v})}
 function tog(k:string,v:string){const s=new Set(list(f[k]));s.has(v)?s.delete(v):s.add(v);up(k,Array.from(s))}
 async function submit(){setMsg("Saving deal...");const urls=await photoDataUrls(files,10);const id=saveRoom("deal",{...f,title:txt(f.title,"Untitled Deal Room"),photoUrls:urls,photos:urls,analyzer:`Deal signal in ${txt(f.city)}, ${txt(f.county)}, ${txt(f.state)}. Ask ${txt(f.askingPrice,"not listed")}, value ${txt(f.propertyValue||f.arv,"not listed")}, repairs ${txt(f.repairs,"not listed")}. Route to ${list(f.routeTo).join(", ")||"matched profiles"}.`});setF({assetClass:"Residential",state:"GA",routeTo:["Buyer"]});setFiles(null);if(id)window.location.href=`/deal-rooms/${encodeURIComponent(id)}`;}
 return <main style={page}><div style={wrap}><Nav active="deal"/>{msg?<section style={card}><p style={sub}>{msg}</p></section>:null}<section style={hero}><div style={eyebrow}>Deal Intake</div><h1 style={h1}>Deal Opportunity.</h1><p style={sub}>Full intake restored: property, numbers, route targets, contact, docs, notes, and up to 10 photos.</p></section>
 <section style={card}><div style={eyebrow}>Asset Class</div><MultiChips labelName="Choose Type" options={ASSETS} selected={[txt(f.assetClass,"Residential") ]} onToggle={v=>up("assetClass",v)}/></section>
 <section style={card}><div style={eyebrow}>Property + Market</div><div style={grid}><Field l="Deal Title *" v={txt(f.title)} c={v=>up("title",v)}/><Select l="State *" v={txt(f.state,"GA")} c={v=>up("state",v)}/><Field l="City *" v={txt(f.city)} c={v=>up("city",v)}/><Field l="County" v={txt(f.county)} c={v=>up("county",v)}/><Field l="Address / Location" v={txt(f.address)} c={v=>up("address",v)}/><Field l="Property Type" v={txt(f.propertyType)} c={v=>up("propertyType",v)}/></div></section>
 <section style={card}><div style={eyebrow}>Numbers</div><div style={grid}><Field l="Ask Price" v={txt(f.askingPrice)} c={v=>up("askingPrice",v)}/><Field l="Property Value / ARV" v={txt(f.propertyValue)} c={v=>up("propertyValue",v)}/><Field l="Repairs / Work" v={txt(f.repairs)} c={v=>up("repairs",v)}/><Field l="Payoff" v={txt(f.payoff)} c={v=>up("payoff",v)}/><Field l="Amount Needed" v={txt(f.amountNeeded)} c={v=>up("amountNeeded",v)}/><Field l="Assignment Fee" v={txt(f.assignmentFee)} c={v=>up("assignmentFee",v)}/><Field l="Deadline" v={txt(f.deadline)} c={v=>up("deadline",v)}/></div></section>
 <section style={card}><div style={eyebrow}>Asset Facts</div><div style={grid}><Field l="Beds" v={txt(f.beds)} c={v=>up("beds",v)}/><Field l="Baths" v={txt(f.baths)} c={v=>up("baths",v)}/><Field l="Sqft" v={txt(f.sqft)} c={v=>up("sqft",v)}/><Field l="Units" v={txt(f.units)} c={v=>up("units",v)}/><Field l="Building Size" v={txt(f.buildingSize)} c={v=>up("buildingSize",v)}/><Field l="Acres" v={txt(f.acres)} c={v=>up("acres",v)}/><Field l="Zoning" v={txt(f.zoning)} c={v=>up("zoning",v)}/></div></section>
 <section style={card}><div style={eyebrow}>Routing + Strategy</div><MultiChips labelName="Strategy" options={STRATEGIES} selected={list(f.strategy)} onToggle={v=>tog("strategy",v)}/><div style={{height:18}}/><MultiChips labelName="Route To" options={ROUTES} selected={list(f.routeTo)} onToggle={v=>tog("routeTo",v)}/></section>
 <section style={card}><div style={eyebrow}>Contact</div><div style={grid}><Field l="Name" v={txt(f.contactName)} c={v=>up("contactName",v)}/><Field l="Phone" v={txt(f.contactPhone)} c={v=>up("contactPhone",v)}/><Field l="Email" v={txt(f.contactEmail)} c={v=>up("contactEmail",v)}/><Field l="Best Contact" v={txt(f.bestContact)} c={v=>up("bestContact",v)}/><Field l="Submitter Role" v={txt(f.submitterRole)} c={v=>up("submitterRole",v)}/></div></section>
 <section style={card}><div style={eyebrow}>Issues / Docs / Access</div><div style={grid}><Field l="Urgency" v={list(f.urgency).join(", ")} c={v=>up("urgency",v)}/><Field l="Occupancy" v={txt(f.occupancy)} c={v=>up("occupancy",v)}/><Field l="Access" v={txt(f.access)} c={v=>up("access",v)}/><Field l="Known Issues" v={list(f.knownIssues).join(", ")} c={v=>up("knownIssues",v)}/></div><div style={{height:18}}/><MultiChips labelName="Docs Available" options={DOCS} selected={list(f.docs)} onToggle={v=>tog("docs",v)}/></section>
 <section style={card}><div style={eyebrow}>Photos Up To 10</div><input type="file" multiple accept="image/*" onChange={e=>setFiles(e.target.files)}/><p style={muted}>{files?files.length:0}/10 selected.</p></section>
 <section style={card}><div style={eyebrow}>Notes</div><Area l="Private Notes / AI Context" v={txt(f.notes)} c={v=>up("notes",v)}/></section>
 <section style={card}><button onClick={submit} style={goldBtn}>Save Deal Room</button></section></div></main>
}

const page:React.CSSProperties={minHeight:"100vh",background:"#05070d",color:"#f7f7fb",padding:18,fontFamily:"Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif"};
const wrap:React.CSSProperties={maxWidth:1280,margin:"0 auto",paddingBottom:90};
const nav:React.CSSProperties={display:"flex",gap:10,flexWrap:"wrap",alignItems:"center",marginBottom:18};
const brand:React.CSSProperties={color:"#ffd45a",fontSize:27,fontWeight:950,letterSpacing:-1,marginRight:10};
const btn:React.CSSProperties={border:"1px solid rgba(207,216,230,.18)",background:"#171c29",color:"#f7f7fb",borderRadius:999,padding:"13px 18px",fontWeight:950,textDecoration:"none",display:"inline-block",cursor:"pointer"};
const goldBtn:React.CSSProperties={...btn,border:0,background:"#ffdc68",color:"#10131a"};
const redBtn:React.CSSProperties={...btn,background:"#271016",borderColor:"rgba(255,70,70,.48)",color:"#ffaaaa"};
const hero:React.CSSProperties={border:"1px solid rgba(245,197,66,.28)",borderRadius:28,padding:30,marginBottom:20,background:"radial-gradient(circle at top right, rgba(245,197,66,.16), transparent 32%), linear-gradient(180deg,#080d19,#050816)"};
const card:React.CSSProperties={background:"linear-gradient(180deg,#080d19,#050816)",border:"1px solid rgba(245,197,66,.28)",borderRadius:26,padding:28,marginBottom:22};
const eyebrow:React.CSSProperties={color:"#ffd45a",textTransform:"uppercase",letterSpacing:7,fontWeight:950,fontSize:15,marginBottom:12};
const h1:React.CSSProperties={fontSize:"clamp(44px,8vw,86px)",lineHeight:.9,letterSpacing:-4,margin:"0 0 18px",fontWeight:950};
const h2:React.CSSProperties={fontSize:"clamp(32px,5vw,54px)",lineHeight:.95,letterSpacing:-2,margin:"0 0 18px",fontWeight:950};
const sub:React.CSSProperties={color:"#c9d0dc",fontSize:21,lineHeight:1.35,margin:0};
const muted:React.CSSProperties={color:"#aeb7c7",margin:"8px 0 0",lineHeight:1.35};
const grid:React.CSSProperties={display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(245px,1fr))",gap:16};
const row:React.CSSProperties={display:"flex",gap:10,flexWrap:"wrap",alignItems:"center"};
const chip:React.CSSProperties={...btn,padding:"11px 16px"};
const chipActive:React.CSSProperties={...chip,background:"#ffdc68",color:"#10131a",border:0};
const input:React.CSSProperties={width:"100%",boxSizing:"border-box",border:"1px solid rgba(207,216,230,.18)",background:"#151b2a",color:"#f8fafc",borderRadius:18,padding:"15px 16px",fontSize:16,outline:"none"};
const textArea:React.CSSProperties={...input,minHeight:110,resize:"vertical"};
const label:React.CSSProperties={color:"#ffd45a",textTransform:"uppercase",letterSpacing:4,fontSize:12,fontWeight:950,marginBottom:8};

