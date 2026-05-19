"use client";
import Link from "next/link";
import {useMemo,useState} from "react";

type RoomState = "active" | "saved" | "archived" | "deleted";
type RoomKind = "deal" | "pain";

type Room = {
  id?: string;
  roomId?: string;
  title?: string;
  state?: string;
  city?: string;
  county?: string;
  address?: string;
  assetClass?: string;
  propertyType?: string;
  condition?: string;
  occupancy?: string;
  timeline?: string;
  dealStrength?: string;
  strategy?: string[] | string;
  motivation?: string[] | string;
  routeTo?: string[] | string;
  routingNeeds?: string[] | string;
  askingPrice?: string;
  propertyValue?: string;
  repairs?: string;
  monthlyRent?: string;
  taxes?: string;
  insurance?: string;
  utilities?: string;
  hoa?: string;
  noi?: string;
  capRate?: string;
  exitValue?: string;
  assignmentFee?: string;
  loanBalance?: string;
  interestRate?: string;
  sellerFlexibility?: string;
  titleStatus?: string;
  environmentalIssues?: string;
  floodZone?: string;
  permitsNeeded?: string;
  cityIssues?: string;
  contractorBids?: string;
  beds?: string;
  baths?: string;
  sqft?: string;
  units?: string;
  buildingSize?: string;
  acres?: string;
  zoning?: string;
  frontage?: string;
  utilitiesAvailable?: string;
  access?: string;
  docs?: string[] | string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  bestContact?: string;
  submitterRole?: string;
  painTypes?: string[] | string;
  severity?: string;
  blockers?: string[] | string;
  timePressure?: string;
  capitalPressure?: string;
  riskTypes?: string[] | string;
  controlStatus?: string;
  foreclosureFiled?: string;
  auctionDate?: string;
  activeLitigation?: string;
  insuranceActive?: string;
  utilitiesStatus?: string;
  contractorStatus?: string;
  accessStatus?: string;
  titleClear?: string;
  existingLoanAmount?: string;
  monthlyBurnRate?: string;
  moneyNeededNow?: string;
  amountNeeded?: string;
  nothingDoneOutcome?: string;
  bestOutcome?: string;
  worstCase?: string;
  contactedOthers?: string;
  confidential?: string;
  directContactAllowed?: string;
  rootCause?: string;
  desiredSolution?: string;
  completionPercent?: string;
  permitStatus?: string;
  inspectionStatus?: string;
  claimNumber?: string;
  structuralStatus?: string;
  cityInvolvement?: string;
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
  [key:string]: unknown;
};

const STATES = ["GA","TN","AL","FL","NC","SC","TX"];
const DEAL_KEYS = ["vaultforge_clean_deal_rooms","vaultforge_deal_rooms","vaultforge_rooms_deals","vf_deal_rooms"];
const PAIN_KEYS = ["vaultforge_clean_pain_rooms_v1","vaultforge_clean_pain_rooms","vaultforge_pain_rooms","vaultforge_rooms_pain","vf_pain_rooms"];
const STATE_KEYS = ["vaultforge_clean_room_states","vaultforge_room_states","vaultforge_deal_room_states","vaultforge_pain_room_states","vaultforge_5s_room_states"];

function ok(){ return typeof window !== "undefined" && typeof window.localStorage !== "undefined"; }
function j<T>(raw:string|null,fb:T):T{ try{return raw?JSON.parse(raw) as T:fb}catch{return fb} }
function txt(v:unknown,fb=""){ const s=String(v||"").trim(); return s||fb; }
function list(v:unknown):string[]{ if(Array.isArray(v)) return v.map(x=>String(x).trim()).filter(Boolean); if(typeof v==="string"&&v.trim()) return v.split(",").map(x=>x.trim()).filter(Boolean); return []; }
function rid(r:Room|null|undefined){ return txt(r?.id||r?.roomId); }
function arr<T>(key:string):T[]{ if(!ok()) return []; const p=j<unknown>(localStorage.getItem(key),[]); return Array.isArray(p)?p as T[]:[]; }
function keys(kind:RoomKind){ return kind==="deal"?DEAL_KEYS:PAIN_KEYS; }
function statesMap(){ const m:Record<string,RoomState>={}; if(!ok()) return m; STATE_KEYS.forEach(k=>Object.assign(m,j<Record<string,RoomState>>(localStorage.getItem(k),{}))); return m; }
function saveStateMap(m:Record<string,RoomState>){ if(!ok()) return; STATE_KEYS.forEach(k=>localStorage.setItem(k,JSON.stringify(m))); }
function photoDataUrls(files:FileList|null,max=10):Promise<string[]>{ return new Promise(resolve=>{ const selected=Array.from(files||[]).slice(0,max); if(!selected.length){resolve([]);return;} Promise.all(selected.map(file=>new Promise<string>(res=>{ const reader=new FileReader(); reader.onload=()=>res(String(reader.result||"")); reader.onerror=()=>res(""); reader.readAsDataURL(file); }))).then(rows=>resolve(rows.filter(Boolean))); }); }
function saveRoom(kind:RoomKind,room:Room){ if(!ok()) return ""; const id=rid(room)||`${kind}_${Date.now()}_${Math.random().toString(36).slice(2,8)}`; const now=new Date().toISOString(); const next={...room,id,roomId:id,roomState:"active" as RoomState,cleanupState:"active" as RoomState,stateStatus:"active" as RoomState,createdAt:txt(room.createdAt,now),updatedAt:now,alertRead:false,viewedAt:""}; [`vaultforge_clean_${kind}_room_${id}`,`vaultforge_${kind}_room_${id}`,`vf_${kind}_room_${id}`].forEach(x=>localStorage.setItem(x,JSON.stringify(next))); keys(kind).forEach(key=>localStorage.setItem(key,JSON.stringify([next,...arr<Room>(key).filter(x=>rid(x)!==id)]))); const sm=statesMap(); sm[id]="active"; sm[`${kind}:${id}`]="active"; saveStateMap(sm); window.dispatchEvent(new Event("vaultforge-room-state-change")); window.dispatchEvent(new Event(kind==="deal"?"vaultforge-deal-change":"vaultforge-pain-change")); return id; }
function moneyNumber(value:unknown){ const n=Number(String(value||"").replace(/[^0-9.-]/g,"")); return Number.isFinite(n)?n:0; }
function fmt(n:number){ return n? n.toLocaleString("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}):"Not enough data"; }


function Nav({active}:{active:string}){return <nav style={navStyle}><div style={brand}>VAULTFORGE</div><Link href="/command" style={active==="command"?goldBtn:btn}>Command</Link><Link href="/deal-rooms" style={btn}>Deal Rooms</Link><Link href="/deal-create" style={active==="deal"?goldBtn:btn}>Create Deal</Link><Link href="/pain-intake" style={active==="pain"?goldBtn:btn}>Pain Intake</Link><Link href="/pain-rooms" style={btn}>Pain Rooms</Link><Link href="/network" style={btn}>Network</Link><Link href="/messages" style={btn}>Messages</Link><Link href="/profile" style={btn}>Profile</Link><Link href="/logout" style={redBtn}>Logout</Link></nav>}
function Field({l,v,c,placeholder=""}:{l:string;v:string;c:(v:string)=>void;placeholder?:string}){return <label><div style={label}>{l}</div><input style={input} placeholder={placeholder} value={v} onChange={e=>c(e.target.value)}/></label>}
function Area({l,v,c}:{l:string;v:string;c:(v:string)=>void}){return <label><div style={label}>{l}</div><textarea style={textArea} value={v} onChange={e=>c(e.target.value)}/></label>}
function SelectBox({l,v,c,options}:{l:string;v:string;c:(v:string)=>void;options:string[]}){return <label><div style={label}>{l}</div><select style={input} value={v} onChange={e=>c(e.target.value)}>{options.map(o=><option key={o} value={o}>{o}</option>)}</select></label>}
function MultiChips({labelName,options,selected,onToggle}:{labelName:string;options:string[];selected:string[];onToggle:(v:string)=>void}){return <div><div style={label}>{labelName}</div><div style={row}>{options.map(o=><button type="button" key={o} onClick={()=>onToggle(o)} style={selected.includes(o)?chipActive:chip}>{o}</button>)}</div></div>}
function SingleChips({labelName,options,value,onChange}:{labelName:string;options:string[];value:string;onChange:(v:string)=>void}){return <div><div style={label}>{labelName}</div><div style={row}>{options.map(o=><button type="button" key={o} onClick={()=>onChange(o)} style={value===o?chipActive:chip}>{o}</button>)}</div></div>}
function Section({title,children}:{title:string;children:React.ReactNode}){return <section style={card}><div style={eyebrow}>{title}</div>{children}</section>}


const ASSET=["Residential","Commercial","Land"];
const RES_TYPES=["Single Family","Duplex","Triplex","Quad","Townhome","Condo","Mobile Home","Small Multifamily"];
const COM_TYPES=["Retail","Office","Industrial","Warehouse","Hotel","Self Storage","Mixed Use","Medical","Restaurant","Automotive","Church / Special Use"];
const LAND_TYPES=["Infill Lot","Acreage","Entitled Land","Raw Land","Commercial Pad","Subdivision","Timber","Farm","Assemblage","Waterfront"];
const STRATEGIES=["Wholesale","Flip","Buy & Hold","BRRRR","Development","Seller Finance","JV","Rental","Hotel Conversion","Airbnb"];
const CONDITION=["Turnkey","Light Rehab","Medium Rehab","Full Gut","Fire Damage","Shell","Tear Down"];
const OCCUPANCY=["Vacant","Owner Occupied","Tenant Occupied","Squatter","Partial Vacancy"];
const MOTIVATION=["Distressed","Fast Close","Portfolio Sale","Partnership Split","Divorce","Tax Problem","Foreclosure","Inherited","Burned Out Landlord"];
const ROUTE=["Buyer","Lender","Operator","Contractor","Developer","Attorney","Capital Partner"];
const STRENGTH=["Weak","Moderate","Strong","Institutional"];
const TIMELINE=["Immediate","7 Days","14 Days","30 Days","Flexible"];
const YESNO=["Unknown","Yes","No"];
const DOCS=["Photos","Appraisal","Inspection","Survey","Rent Roll","Comps","Title","Tax Bill","Plans","Permits","Contractor Bid","Insurance Claim"];

export default function Page(){
 const [f,setF]=useState<Room>({assetClass:"Residential",state:"GA",propertyType:"Single Family",condition:"Medium Rehab",occupancy:"Vacant",timeline:"14 Days",dealStrength:"Moderate",routeTo:["Buyer"],strategy:["Wholesale"]});
 const [files,setFiles]=useState<FileList|null>(null);
 const [msg,setMsg]=useState("");
 const asset=txt(f.assetClass,"Residential");
 const typeOptions=asset==="Commercial"?COM_TYPES:asset==="Land"?LAND_TYPES:RES_TYPES;

 function up(k:string,v:unknown){setF({...f,[k]:v})}
 function setAsset(v:string){setF({...f,assetClass:v,propertyType:(v==="Commercial"?COM_TYPES:v==="Land"?LAND_TYPES:RES_TYPES)[0]})}
 function tog(k:string,v:string){const s=new Set(list(f[k]));s.has(v)?s.delete(v):s.add(v);up(k,Array.from(s))}
 const spread=useMemo(()=>moneyNumber(f.propertyValue)-moneyNumber(f.askingPrice)-moneyNumber(f.repairs),[f.propertyValue,f.askingPrice,f.repairs]);
 const profit=useMemo(()=>moneyNumber(f.exitValue||f.propertyValue)-moneyNumber(f.askingPrice)-moneyNumber(f.repairs)-moneyNumber(f.assignmentFee),[f.exitValue,f.propertyValue,f.askingPrice,f.repairs,f.assignmentFee]);

 async function submit(){
   setMsg("Saving deal room...");
   const urls=await photoDataUrls(files,10);
   const id=saveRoom("deal",{...f,title:txt(f.title,"Untitled Deal Room"),photoUrls:urls,photos:urls,analyzer:`Deal analyzer: ${asset} ${txt(f.propertyType)} in ${txt(f.city)}, ${txt(f.county)}, ${txt(f.state)}. Condition ${txt(f.condition)}. Occupancy ${txt(f.occupancy)}. Spread estimate ${fmt(spread)}. Route to ${list(f.routeTo).join(", ")||"matched members"}. Timeline ${txt(f.timeline)}.`});
   setF({assetClass:"Residential",state:"GA",propertyType:"Single Family",condition:"Medium Rehab",occupancy:"Vacant",timeline:"14 Days",dealStrength:"Moderate",routeTo:["Buyer"],strategy:["Wholesale"]});
   setFiles(null);
   if(id) window.location.href=`/deal-rooms/${encodeURIComponent(id)}`;
 }

 return <main style={page}><div style={wrap}><Nav active="deal"/>{msg?<Section title="Status"><p style={sub}>{msg}</p></Section>:null}
 <section style={hero}><div style={eyebrow}>Adaptive Deal Intake</div><h1 style={h1}>Deal Opportunity.</h1><p style={sub}>Residential, Commercial, and Land now switch fields correctly.</p></section>

 <Section title="Asset + Strategy">
   <SingleChips labelName="Asset Type" options={ASSET} value={asset} onChange={setAsset}/>
   <div style={{height:18}}/>
   <MultiChips labelName="Strategy" options={STRATEGIES} selected={list(f.strategy)} onToggle={v=>tog("strategy",v)}/>
   <div style={{height:18}}/>
   <MultiChips labelName="Route To" options={ROUTE} selected={list(f.routeTo)} onToggle={v=>tog("routeTo",v)}/>
 </Section>

 <Section title={`${asset} Property + Market`}>
   <div style={grid}>
     <Field l="Deal Title" v={txt(f.title)} c={v=>up("title",v)}/>
     <SelectBox l="State" v={txt(f.state,"GA")} c={v=>up("state",v)} options={STATES}/>
     <Field l="City" v={txt(f.city)} c={v=>up("city",v)}/>
     <Field l="County" v={txt(f.county)} c={v=>up("county",v)}/>
     <Field l="Address / Location" v={txt(f.address)} c={v=>up("address",v)}/>
     <SelectBox l={`${asset} Type`} v={txt(f.propertyType,typeOptions[0])} c={v=>up("propertyType",v)} options={typeOptions}/>
   </div>
 </Section>

 <Section title="Deal Intelligence Selectors">
   <div style={grid}>
     {asset!=="Land"?<SelectBox l="Condition" v={txt(f.condition,"Medium Rehab")} c={v=>up("condition",v)} options={CONDITION}/>:<SelectBox l="Land Status" v={txt(f.condition,"Raw Land")} c={v=>up("condition",v)} options={["Raw Land","Cleared","Wooded","Entitled","Needs Rezoning","Approved Plans","Tear Down"]}/>}
     {asset!=="Land"?<SelectBox l="Occupancy" v={txt(f.occupancy,"Vacant")} c={v=>up("occupancy",v)} options={OCCUPANCY}/>:<SelectBox l="Access" v={txt(f.access,"Unknown")} c={v=>up("access",v)} options={["Unknown","Road Frontage","Easement","Landlocked","Private Road","No Access"]}/>}
     <SelectBox l="Deal Strength" v={txt(f.dealStrength,"Moderate")} c={v=>up("dealStrength",v)} options={STRENGTH}/>
     <SelectBox l="Timeline" v={txt(f.timeline,"14 Days")} c={v=>up("timeline",v)} options={TIMELINE}/>
     <SelectBox l="Title Status" v={txt(f.titleStatus,"Unknown")} c={v=>up("titleStatus",v)} options={["Unknown","Clear","Clouded","Probate","Lien Issue","Needs Attorney"]}/>
     <SelectBox l="Flood Zone" v={txt(f.floodZone,"Unknown")} c={v=>up("floodZone",v)} options={YESNO}/>
   </div>
   <div style={{height:18}}/>
   <MultiChips labelName="Seller Motivation" options={MOTIVATION} selected={list(f.motivation)} onToggle={v=>tog("motivation",v)}/>
 </Section>

 <Section title="Numbers">
   <div style={grid}>
     <Field l="Ask Price" v={txt(f.askingPrice)} c={v=>up("askingPrice",v)}/>
     <Field l="Property Value / ARV" v={txt(f.propertyValue)} c={v=>up("propertyValue",v)}/>
     {asset!=="Land"?<Field l="Repairs / Work" v={txt(f.repairs)} c={v=>up("repairs",v)}/>:<Field l="Site Work / Development Cost" v={txt(f.repairs)} c={v=>up("repairs",v)}/>}
     <Field l="Exit Value" v={txt(f.exitValue)} c={v=>up("exitValue",v)}/>
     <Field l="Assignment Fee" v={txt(f.assignmentFee)} c={v=>up("assignmentFee",v)}/>
     {asset!=="Land"?<Field l="Monthly Rent" v={txt(f.monthlyRent)} c={v=>up("monthlyRent",v)}/>:<Field l="Projected Lot / Pad Value" v={txt(f.monthlyRent)} c={v=>up("monthlyRent",v)}/>}
     <Field l="Taxes" v={txt(f.taxes)} c={v=>up("taxes",v)}/>
     <Field l="Insurance" v={txt(f.insurance)} c={v=>up("insurance",v)}/>
     {asset==="Commercial"?<Field l="NOI" v={txt(f.noi)} c={v=>up("noi",v)}/>:null}
     {asset==="Commercial"?<Field l="Cap Rate" v={txt(f.capRate)} c={v=>up("capRate",v)}/>:null}
   </div>
   <div style={{...grid,marginTop:16}}>
     <div style={calcBox}>Equity Spread: {fmt(spread)}</div>
     <div style={calcBox}>Estimated Profit: {fmt(profit)}</div>
   </div>
 </Section>

 <Section title={`${asset} Facts`}>
   <div style={grid}>
     {asset==="Residential"?<><Field l="Beds" v={txt(f.beds)} c={v=>up("beds",v)}/><Field l="Baths" v={txt(f.baths)} c={v=>up("baths",v)}/><Field l="Sqft" v={txt(f.sqft)} c={v=>up("sqft",v)}/><Field l="Units" v={txt(f.units)} c={v=>up("units",v)}/></>:null}
     {asset==="Commercial"?<><Field l="Building Size" v={txt(f.buildingSize)} c={v=>up("buildingSize",v)}/><Field l="Units / Suites" v={txt(f.units)} c={v=>up("units",v)}/><Field l="NOI" v={txt(f.noi)} c={v=>up("noi",v)}/><Field l="Cap Rate" v={txt(f.capRate)} c={v=>up("capRate",v)}/></>:null}
     {asset==="Land"?<><Field l="Acres" v={txt(f.acres)} c={v=>up("acres",v)}/><Field l="Zoning" v={txt(f.zoning)} c={v=>up("zoning",v)}/><Field l="Frontage" v={txt(f.frontage)} c={v=>up("frontage",v)}/><SelectBox l="Utilities Available" v={txt(f.utilitiesAvailable,"Unknown")} c={v=>up("utilitiesAvailable",v)} options={["Unknown","Water","Sewer","Power","All Utilities","None","Needs Extension"]}/></>:null}
   </div>
 </Section>

 <Section title="Risk + Docs">
   <div style={grid}>
     <Field l="Existing Loan Balance" v={txt(f.loanBalance)} c={v=>up("loanBalance",v)}/>
     <Field l="Interest Rate" v={txt(f.interestRate)} c={v=>up("interestRate",v)}/>
     <SelectBox l="Seller Flexibility" v={txt(f.sellerFlexibility,"Unknown")} c={v=>up("sellerFlexibility",v)} options={["Unknown","Low","Medium","High","Creative Terms Available"]}/>
     <SelectBox l="Environmental Issues" v={txt(f.environmentalIssues,"Unknown")} c={v=>up("environmentalIssues",v)} options={["Unknown","None Known","Possible","Confirmed","Needs Report"]}/>
     <SelectBox l="Permits Needed" v={txt(f.permitsNeeded,"Unknown")} c={v=>up("permitsNeeded",v)} options={["Unknown","None","Minor","Major","Stop Work / City Issue"]}/>
     <SelectBox l="City / Code Issues" v={txt(f.cityIssues,"Unknown")} c={v=>up("cityIssues",v)} options={["Unknown","None Known","Violation","Condemned","Inspection Required"]}/>
   </div>
   <div style={{height:18}}/>
   <MultiChips labelName="Attached Docs Checklist" options={DOCS} selected={list(f.docs)} onToggle={v=>tog("docs",v)}/>
 </Section>

 <Section title="Contact">
   <div style={grid}>
     <Field l="Contact Name" v={txt(f.contactName)} c={v=>up("contactName",v)}/>
     <Field l="Phone" v={txt(f.contactPhone)} c={v=>up("contactPhone",v)}/>
     <Field l="Email" v={txt(f.contactEmail)} c={v=>up("contactEmail",v)}/>
     <SelectBox l="Best Contact" v={txt(f.bestContact,"VaultForge Message")} c={v=>up("bestContact",v)} options={["VaultForge Message","Text","Phone","Email","Contact Form"]}/>
     <SelectBox l="Submitter Role" v={txt(f.submitterRole,"Owner")} c={v=>up("submitterRole",v)} options={["Owner","Wholesaler","Agent","Investor","Lender","Operator","Partner"]}/>
   </div>
 </Section>

 <Section title="Photos Up To 10"><input type="file" multiple accept="image/*" onChange={e=>setFiles(e.target.files)}/><p style={muted}>{files?files.length:0}/10 selected.</p></Section>
 <Section title="Notes"><Area l="Private Notes / AI Context" v={txt(f.notes)} c={v=>up("notes",v)}/></Section>
 <Section title="Save"><button onClick={submit} style={goldBtn}>Save Deal Room</button></Section>
 </div></main>
}

const page:React.CSSProperties={minHeight:"100vh",background:"#05070d",color:"#f7f7fb",padding:18,fontFamily:"Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif"};
const wrap:React.CSSProperties={maxWidth:1280,margin:"0 auto",paddingBottom:90};
const navStyle:React.CSSProperties={display:"flex",gap:10,flexWrap:"wrap",alignItems:"center",marginBottom:18};
const brand:React.CSSProperties={color:"#ffd45a",fontSize:27,fontWeight:950,letterSpacing:-1,marginRight:10};
const btn:React.CSSProperties={border:"1px solid rgba(207,216,230,.18)",background:"#171c29",color:"#f7f7fb",borderRadius:999,padding:"13px 18px",fontWeight:950,textDecoration:"none",display:"inline-block",cursor:"pointer"};
const goldBtn:React.CSSProperties={...btn,border:0,background:"#ffdc68",color:"#10131a"};
const redBtn:React.CSSProperties={...btn,background:"#271016",borderColor:"rgba(255,70,70,.48)",color:"#ffaaaa"};
const hero:React.CSSProperties={border:"1px solid rgba(245,197,66,.28)",borderRadius:28,padding:30,marginBottom:20,background:"radial-gradient(circle at top right, rgba(245,197,66,.16), transparent 32%), linear-gradient(180deg,#080d19,#050816)"};
const card:React.CSSProperties={background:"linear-gradient(180deg,#080d19,#050816)",border:"1px solid rgba(245,197,66,.28)",borderRadius:26,padding:28,marginBottom:22};
const eyebrow:React.CSSProperties={color:"#ffd45a",textTransform:"uppercase",letterSpacing:7,fontWeight:950,fontSize:15,marginBottom:12};
const h1:React.CSSProperties={fontSize:"clamp(44px,8vw,86px)",lineHeight:.9,letterSpacing:-4,margin:"0 0 18px",fontWeight:950};
const sub:React.CSSProperties={color:"#c9d0dc",fontSize:21,lineHeight:1.35,margin:0};
const muted:React.CSSProperties={color:"#aeb7c7",margin:"8px 0 0",lineHeight:1.35};
const grid:React.CSSProperties={display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(245px,1fr))",gap:16};
const row:React.CSSProperties={display:"flex",gap:10,flexWrap:"wrap",alignItems:"center"};
const chip:React.CSSProperties={...btn,padding:"11px 16px"};
const chipActive:React.CSSProperties={...chip,background:"#ffdc68",color:"#10131a",border:0};
const input:React.CSSProperties={width:"100%",boxSizing:"border-box",border:"1px solid rgba(207,216,230,.18)",background:"#151b2a",color:"#f8fafc",borderRadius:18,padding:"15px 16px",fontSize:16,outline:"none"};
const textArea:React.CSSProperties={...input,minHeight:110,resize:"vertical"};
const label:React.CSSProperties={color:"#ffd45a",textTransform:"uppercase",letterSpacing:4,fontSize:12,fontWeight:950,marginBottom:8};
const calcBox:React.CSSProperties={background:"rgba(255,220,104,.08)",border:"1px solid rgba(255,220,104,.22)",borderRadius:18,padding:18,color:"#ffd45a",fontWeight:950};

