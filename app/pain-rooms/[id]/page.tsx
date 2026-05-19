"use client";
import Link from "next/link";
import {useEffect,useMemo,useState} from "react";

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
  coverPhoto?: string;
  photoUrls?: string[];
  photos?: string[];
  photoUrl?: string;
  imageUrl?: string;
  photoSaveWarning?: string;
  photoCount?: number;
  notes?: string;
  analyzer?: string;
  aiRead?: string;
  [key:string]: unknown;
};

const STATES = ["GA","TN","AL","FL","NC","SC","TX"];
const DEAL_KEYS = ["vaultforge_clean_deal_rooms","vaultforge_deal_rooms","vaultforge_rooms_deals","vf_deal_rooms"];
const PAIN_KEYS = ["vaultforge_clean_pain_rooms_v1","vaultforge_clean_pain_rooms","vaultforge_pain_rooms","vaultforge_rooms_pain","vf_pain_rooms"];
const STATE_KEYS = ["vaultforge_clean_room_states","vaultforge_room_states","vaultforge_deal_room_states","vaultforge_pain_room_states","vaultforge_5s_room_states"];
const READ_KEY = "vaultforge_room_alert_read_v1";

function ok(){ return typeof window !== "undefined" && typeof window.localStorage !== "undefined"; }
function j<T>(raw:string|null,fb:T):T{ try{return raw?JSON.parse(raw) as T:fb}catch{return fb} }
function txt(v:unknown,fb=""){ const s=String(v||"").trim(); return s||fb; }
function list(v:unknown):string[]{ if(Array.isArray(v)) return v.map(x=>String(x).trim()).filter(Boolean); if(typeof v==="string"&&v.trim()) return v.split(",").map(x=>x.trim()).filter(Boolean); return []; }
function rid(r:Room|null|undefined){ return txt(r?.id||r?.roomId); }
function titleFor(r:Room|null|undefined,kind:RoomKind){ return txt(r?.title||r?.name,kind==="deal"?"Untitled Deal Room":"Untitled Pain Room"); }
function loc(r:Room|null|undefined){ return [txt(r?.city),txt(r?.county),txt(r?.state)].filter(Boolean).join(", ")||"Market not listed"; }
function arr<T>(key:string):T[]{ if(!ok()) return []; const p=j<unknown>(localStorage.getItem(key),[]); return Array.isArray(p)?p as T[]:[]; }
function keys(kind:RoomKind){ return kind==="deal"?DEAL_KEYS:PAIN_KEYS; }
function roomKeys(kind:RoomKind,id:string){ return [`vaultforge_clean_${kind}_room_${id}`,`vaultforge_${kind}_room_${id}`,`vf_${kind}_room_${id}`]; }
function statesMap(){ const m:Record<string,RoomState>={}; if(!ok()) return m; STATE_KEYS.forEach(k=>Object.assign(m,j<Record<string,RoomState>>(localStorage.getItem(k),{}))); return m; }
function saveStateMap(m:Record<string,RoomState>){ if(!ok()) return; STATE_KEYS.forEach(k=>{try{localStorage.setItem(k,JSON.stringify(m));}catch{}}); }
function safeSet(key:string,value:unknown){ try{localStorage.setItem(key,JSON.stringify(value));return true;}catch{return false;} }

function compressImage(file:File,maxWidth=850,quality=.52):Promise<string>{
  return new Promise(resolve=>{
    const reader=new FileReader();
    reader.onerror=()=>resolve("");
    reader.onload=()=>{
      const img=new Image();
      img.onerror=()=>resolve("");
      img.onload=()=>{
        try{
          const scale=Math.min(1,maxWidth/img.width);
          const canvas=document.createElement("canvas");
          canvas.width=Math.max(1,Math.round(img.width*scale));
          canvas.height=Math.max(1,Math.round(img.height*scale));
          const ctx=canvas.getContext("2d");
          if(!ctx){resolve("");return;}
          ctx.drawImage(img,0,0,canvas.width,canvas.height);
          resolve(canvas.toDataURL("image/jpeg",quality));
        }catch{ resolve(""); }
      };
      img.src=String(reader.result||"");
    };
    reader.readAsDataURL(file);
  });
}

async function photoDataUrls(files:FileList|null,max=10):Promise<string[]>{
  const selected=Array.from(files||[]).slice(0,max);
  const out:string[]=[];
  for(const file of selected){
    const compressed=await compressImage(file,850,.52);
    if(compressed && compressed.length < 450000) out.push(compressed);
    if(out.length >= 10) break;
  }
  return out;
}

function photoFields(urls:string[], attemptedCount=0):Partial<Room>{
  const safe = urls.filter(Boolean).slice(0,10);
  const cover = safe[0] || "";
  return {
    coverPhoto: cover,
    photoUrl: cover,
    imageUrl: cover,
    photoUrls: safe,
    photos: safe,
    photoCount: attemptedCount || safe.length,
    photoSaveWarning: attemptedCount && !safe.length ? "Photos were too large for browser storage. Room saved without photos." : ""
  };
}

function slimForList(room:Room):Room{
  return {
    ...room,
    photos: room.coverPhoto ? [room.coverPhoto] : [],
    photoUrls: room.coverPhoto ? [room.coverPhoto] : [],
    photoUrl: room.coverPhoto || "",
    imageUrl: room.coverPhoto || ""
  };
}

function saveRoom(kind:RoomKind,room:Room){
  if(!ok()) return "";
  const id=rid(room)||`${kind}_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
  const now=new Date().toISOString();
  let next:Room={...room,id,roomId:id,roomState:"active",cleanupState:"active",stateStatus:"active",createdAt:txt(room.createdAt,now),updatedAt:now,alertRead:false,viewedAt:""};

  let fullWorked=true;
  for(const key of roomKeys(kind,id)){
    if(!safeSet(key,next)) fullWorked=false;
  }

  if(!fullWorked){
    const cover=txt(next.coverPhoto||next.photoUrl||next.imageUrl);
    next={...next,coverPhoto:cover,photoUrl:cover,imageUrl:cover,photoUrls:cover?[cover]:[],photos:cover?[cover]:[],photoSaveWarning:"Only the cover photo was saved because browser storage rejected the full gallery."};
    for(const key of roomKeys(kind,id)) safeSet(key,next);
  }

  const listRoom=slimForList(next);
  for(const key of keys(kind)){
    const existing=arr<Room>(key).filter(x=>rid(x)!==id);
    if(!safeSet(key,[listRoom,...existing])){
      safeSet(key,[{...listRoom,photos:[],photoUrls:[],photoUrl:"",imageUrl:"",coverPhoto:"",photoSaveWarning:"Photos were too large for list storage."},...existing.map(x=>({...x,photos:[],photoUrls:[]}))]);
    }
  }

  const sm=statesMap();
  sm[id]="active";
  sm[`${kind}:${id}`]="active";
  saveStateMap(sm);
  window.dispatchEvent(new Event("vaultforge-room-state-change"));
  window.dispatchEvent(new Event(kind==="deal"?"vaultforge-deal-change":"vaultforge-pain-change"));
  return id;
}

function getRoom(kind:RoomKind,id:string):Room|null{
  if(!ok()) return null;
  for(const key of roomKeys(kind,id)){
    const direct=j<Room|null>(localStorage.getItem(key),null);
    if(direct && rid(direct)) return {...direct,id:rid(direct),roomId:rid(direct)};
  }
  for(const key of keys(kind)){
    const found=arr<Room>(key).find(r=>rid(r)===id);
    if(found) return {...found,id:rid(found),roomId:rid(found)};
  }
  return null;
}

function photos(room:Room|null):string[]{
  if(!room) return [];
  const output:string[]=[];
  const push=(v:unknown)=>{
    if(typeof v==="string"){
      const s=v.trim();
      if(s && !output.includes(s)) output.push(s);
    }
  };
  push(room.coverPhoto);
  push(room.photoUrl);
  push(room.imageUrl);
  list(room.photoUrls).forEach(push);
  list(room.photos).forEach(push);
  Object.keys(room).forEach(k=>{
    if(k.toLowerCase().includes("photo") || k.toLowerCase().includes("image")){
      const v=room[k];
      if(Array.isArray(v)) v.forEach(push);
      else push(v);
    }
  });
  return output.filter(src=>src.startsWith("data:image") || src.startsWith("http") || src.startsWith("/") || src.startsWith("blob:"));
}

function markRead(kind:RoomKind,room:Room){
  if(!ok()) return;
  const id=rid(room);
  if(!id) return;
  const reads=j<Record<string,string>>(localStorage.getItem(READ_KEY),{});
  reads[id]=new Date().toISOString();
  reads[`${kind}:${id}`]=new Date().toISOString();
  safeSet(READ_KEY,reads);
  const next={...room,viewedAt:new Date().toISOString(),alertRead:true};
  roomKeys(kind,id).forEach(key=>safeSet(key,next));
  keys(kind).forEach(key=>{
    const rows=arr<Room>(key);
    if(rows.length) safeSet(key,rows.map(r=>rid(r)===id?{...r,...slimForList(next)}:r));
  });
  window.dispatchEvent(new Event("vaultforge-room-read-change"));
}

function setRoomState(kind:RoomKind,room:Room,state:RoomState){
  if(!ok()) return;
  const id=rid(room);
  if(!id) return;
  const next:Room={...room,roomState:state,cleanupState:state,stateStatus:state,updatedAt:new Date().toISOString()};
  roomKeys(kind,id).forEach(key=>safeSet(key,next));
  keys(kind).forEach(key=>{
    const rows=arr<Room>(key);
    if(rows.length) safeSet(key,[slimForList(next),...rows.filter(r=>rid(r)!==id)]);
  });
  const sm=statesMap();
  sm[id]=state;
  sm[`${kind}:${id}`]=state;
  saveStateMap(sm);
  window.dispatchEvent(new Event("vaultforge-room-state-change"));
}

function money(v:unknown){ const n=Number(String(v||"").replace(/[^0-9.-]/g,"")); return Number.isFinite(n)&&n!==0?n.toLocaleString("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}):"Not listed"; }
function fmt(n:number){ return n? n.toLocaleString("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}):"Not enough data"; }
function moneyNumber(value:unknown){ const n=Number(String(value||"").replace(/[^0-9.-]/g,"")); return Number.isFinite(n)?n:0; }


function Nav({active}:{active:string}){
  return <nav style={navStyle}>
    <div style={brand}>VAULTFORGE</div>
    <Link href="/command" style={btn}>Command</Link>
    <Link href="/deal-rooms" style={active==="deal"?goldBtn:btn}>Deal Rooms</Link>
    <Link href="/deal-create" style={btn}>Create Deal</Link>
    <Link href="/pain-intake" style={btn}>Pain Intake</Link>
    <Link href="/pain-rooms" style={active==="pain"?goldBtn:btn}>Pain Rooms</Link>
    <Link href="/network" style={btn}>Network</Link>
    <Link href="/messages" style={btn}>Messages</Link>
    <Link href="/profile" style={btn}>Profile</Link>
    <Link href="/logout" style={redBtn}>Logout</Link>
  </nav>
}
function Section({title,children}:{title:string;children:React.ReactNode}){return <section style={card}><div style={eyebrow}>{title}</div>{children}</section>}
function Detail({label,value}:{label:string;value:unknown}){const v=Array.isArray(value)?value.join(", "):txt(value,"Not listed");return <div style={stat}><div style={smallEyebrow}>{label}</div><p style={muted}>{v}</p></div>}


const KIND: RoomKind = "pain";

export default function Page({params}:{params:{id:string}}){
  const [room,setRoom]=useState<Room|null>(null);
  const [loaded,setLoaded]=useState(false);
  const id=decodeURIComponent(params.id||"");

  function load(){
    const found=getRoom(KIND,id);
    setRoom(found);
    setLoaded(true);
    if(found) markRead(KIND,found);
  }

  useEffect(()=>{load(); const ev=["storage","vaultforge-room-state-change","vaultforge-room-read-change"]; ev.forEach(e=>window.addEventListener(e,load)); return()=>ev.forEach(e=>window.removeEventListener(e,load));},[id]);

  const roomPhotos=useMemo(()=>photos(room),[room]);

  if(!loaded){
    return <main style={page}><div style={wrap}><Nav active={KIND}/><section style={hero}><h1 style={h1}>Loading room...</h1></section></div></main>
  }

  if(!room){
    return <main style={page}><div style={wrap}><Nav active={KIND}/><section style={hero}><div style={eyebrow}>Room Missing</div><h1 style={h1}>Room not found.</h1><p style={sub}>This room id was not found in browser storage.</p></section></div></main>
  }

  const state=txt(room.roomState||room.cleanupState||room.stateStatus,"active");
  const messageHref=`/messages?type=${KIND}&room=${encodeURIComponent(id)}&subject=${encodeURIComponent((KIND==="deal"?"Deal Room: ":"Pain Room: ")+titleFor(room,KIND))}`;

  return <main style={page}>
    <div style={wrap}>
      <Nav active={KIND}/>

      <section style={hero}>
        <div style={eyebrow}>{KIND==="deal"?"Deal Room":"Pain Room"}</div>
        <h1 style={h1}>{titleFor(room,KIND)}</h1>
        <p style={sub}>{loc(room)}</p>
        <p style={muted}>Room ID: {id} • Current: {state}</p>
      </section>

      <Section title="Room Photos">
        {roomPhotos.length ? (
          <div style={photoGrid}>
            {roomPhotos.map((src,index)=><img key={`${index}-${src.length}`} src={src} alt={`Room photo ${index+1}`} style={photoStyle}/>)}
          </div>
        ) : (
          <div style={inner}>
            <h3 style={h3}>No photo saved for this room.</h3>
            <p style={muted}>{txt(room.photoSaveWarning,"Photos are being saved locally for now. If a phone image is too large, the room saves without blocking.")}</p>
          </div>
        )}
      </Section>

      <Section title="5S Controls">
        <p style={sub}>Save, Archive, or Delete moves this room out of active boards and into its folder.</p>
        <div style={{...row,marginTop:18}}>
          <button style={goldBtn} onClick={()=>{setRoomState(KIND,room,"saved"); setRoom({...room,roomState:"saved",cleanupState:"saved",stateStatus:"saved"});}}>Save</button>
          <button style={btn} onClick={()=>{setRoomState(KIND,room,"archived"); setRoom({...room,roomState:"archived",cleanupState:"archived",stateStatus:"archived"});}}>Archive</button>
          <button style={redBtn} onClick={()=>{setRoomState(KIND,room,"deleted"); setRoom({...room,roomState:"deleted",cleanupState:"deleted",stateStatus:"deleted"});}}>Delete</button>
        </div>
      </Section>

      <Section title="Owner Message">
        <h2 style={h2}>Contact owner with this room attached.</h2>
        <p style={sub}>Message subject is locked to this {KIND} room.</p>
        <div style={{...row,marginTop:18}}>
          <Link href={messageHref} style={goldBtn}>Message Owner</Link>
          {txt(room.contactEmail)?<a href={`mailto:${txt(room.contactEmail)}?subject=${encodeURIComponent((KIND==="deal"?"Deal Room: ":"Pain Room: ")+titleFor(room,KIND))}`} style={btn}>Email Owner</a>:null}
        </div>
      </Section>

      <Section title="VaultForge Signal Summary">
        <p style={sub}>{txt(room.analyzer||room.aiRead, KIND==="deal" ? `Deal room in ${loc(room)}. Verify facts, route to profile, and move qualified conversation into Messages.` : `Pain room in ${loc(room)}. Verify problem, route solver profile, and move qualified conversation into Messages.`)}</p>
      </Section>

      {KIND==="deal" ? <DealDetails room={room}/> : <PainDetails room={room}/>}

      <Section title="Notes">
        <p style={sub}>{txt(room.notes,"No notes saved.")}</p>
      </Section>
    </div>
  </main>
}

function DealDetails({room}:{room:Room}){
  return <>
    <Section title="Deal Intelligence"><div style={grid}><Detail label="Asset Class" value={room.assetClass}/><Detail label="Property Type" value={room.propertyType}/><Detail label="Strategy" value={room.strategy}/><Detail label="Route To" value={room.routeTo}/><Detail label="Condition" value={room.condition}/><Detail label="Occupancy" value={room.occupancy}/><Detail label="Timeline" value={room.timeline}/><Detail label="Deal Strength" value={room.dealStrength}/></div></Section>
    <Section title="Deal Numbers"><div style={grid}><Detail label="Ask Price" value={money(room.askingPrice)}/><Detail label="Value / ARV" value={money(room.propertyValue)}/><Detail label="Repairs / Work" value={money(room.repairs)}/><Detail label="Exit Value" value={money(room.exitValue)}/><Detail label="Assignment Fee" value={money(room.assignmentFee)}/><Detail label="Monthly Rent" value={money(room.monthlyRent)}/><Detail label="NOI" value={money(room.noi)}/><Detail label="Cap Rate" value={room.capRate}/></div></Section>
    <Section title="Asset Facts"><div style={grid}><Detail label="Beds" value={room.beds}/><Detail label="Baths" value={room.baths}/><Detail label="Sqft" value={room.sqft}/><Detail label="Units" value={room.units}/><Detail label="Building Size" value={room.buildingSize}/><Detail label="Acres" value={room.acres}/><Detail label="Zoning" value={room.zoning}/><Detail label="Access" value={room.access}/></div></Section>
  </>
}

function PainDetails({room}:{room:Room}){
  return <>
    <Section title="Pain Intelligence"><div style={grid}><Detail label="Asset Class" value={room.assetClass}/><Detail label="Property Type" value={room.propertyType}/><Detail label="Pain Type" value={room.painTypes}/><Detail label="Severity" value={room.severity}/><Detail label="Time Pressure" value={room.timePressure}/><Detail label="Capital Pressure" value={room.capitalPressure}/><Detail label="Risk Types" value={room.riskTypes}/><Detail label="Current Blockers" value={room.blockers}/><Detail label="Needs" value={room.routingNeeds}/></div></Section>
    <Section title="Pain Numbers"><div style={grid}><Detail label="Ask Price" value={money(room.askingPrice)}/><Detail label="Value / ARV" value={money(room.propertyValue)}/><Detail label="Repairs / Work" value={money(room.repairs)}/><Detail label="Existing Loan" value={money(room.existingLoanAmount||room.loanBalance)}/><Detail label="Monthly Burn Rate" value={money(room.monthlyBurnRate)}/><Detail label="Money Needed Now" value={money(room.moneyNeededNow)}/><Detail label="Deadline" value={room.deadline}/><Detail label="Control Status" value={room.controlStatus}/></div></Section>
    <Section title="Solution Logic"><div style={grid}><Detail label="Root Cause" value={room.rootCause}/><Detail label="Best Outcome" value={room.bestOutcome}/><Detail label="Worst Case" value={room.worstCase}/><Detail label="If Nothing Is Done" value={room.nothingDoneOutcome}/><Detail label="Desired Solution" value={room.desiredSolution}/><Detail label="Direct Contact" value={room.directContactAllowed}/><Detail label="Confidential" value={room.confidential}/><Detail label="Title Clear" value={room.titleClear}/></div></Section>
  </>
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
const inner:React.CSSProperties={background:"#121724",border:"1px solid rgba(207,216,230,.16)",borderRadius:22,padding:22};
const eyebrow:React.CSSProperties={color:"#ffd45a",textTransform:"uppercase",letterSpacing:7,fontWeight:950,fontSize:15,marginBottom:12};
const smallEyebrow:React.CSSProperties={color:"#ffd45a",textTransform:"uppercase",letterSpacing:5,fontWeight:950,fontSize:13,marginBottom:10};
const h1:React.CSSProperties={fontSize:"clamp(44px,8vw,86px)",lineHeight:.9,letterSpacing:-4,margin:"0 0 18px",fontWeight:950};
const h2:React.CSSProperties={fontSize:"clamp(30px,5vw,52px)",lineHeight:.95,letterSpacing:-2,margin:"0 0 18px",fontWeight:950};
const h3:React.CSSProperties={fontSize:28,lineHeight:1,margin:"0 0 8px",fontWeight:950};
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
const photoGrid:React.CSSProperties={display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:14};
const photoStyle:React.CSSProperties={width:"100%",height:220,objectFit:"cover",borderRadius:20,border:"1px solid rgba(255,220,104,.25)",background:"#05070d"};
const stat:React.CSSProperties={background:"#121724",border:"1px solid rgba(207,216,230,.16)",borderRadius:18,padding:16};

