
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
  assetClass?: string;
  propertyType?: string;
  roomState?: RoomState;
  cleanupState?: RoomState;
  stateStatus?: RoomState;
  viewedAt?: string;
  alertRead?: boolean;
  createdAt?: string;
  updatedAt?: string;
  coverPhoto?: string;
  photoUrl?: string;
  imageUrl?: string;
  photoUrls?: string[];
  photos?: string[];
  analyzer?: string;
  notes?: string;
  severity?: string;
  timePressure?: string;
  capitalPressure?: string;
  dealStrength?: string;
  routeTo?: string[] | string;
  routingNeeds?: string[] | string;
  painTypes?: string[] | string;
  [key:string]: unknown;
};

const DEAL_KEYS = [
  "vaultforge_clean_deal_rooms",
  "vaultforge_deal_rooms",
  "vaultforge_rooms_deals",
  "vf_deal_rooms",
];

const PAIN_KEYS = [
  "vaultforge_clean_pain_rooms_v1",
  "vaultforge_clean_pain_rooms",
  "vaultforge_pain_rooms",
  "vaultforge_rooms_pain",
  "vf_pain_rooms",
];

const STATE_KEYS = [
  "vaultforge_clean_room_states",
  "vaultforge_room_states",
  "vaultforge_deal_room_states",
  "vaultforge_pain_room_states",
  "vaultforge_5s_room_states",
];

const READ_KEY = "vaultforge_room_alert_read_v1";

function ok(){return typeof window !== "undefined" && typeof window.localStorage !== "undefined";}
function j<T>(raw:string|null,fb:T):T{try{return raw?JSON.parse(raw) as T:fb}catch{return fb}}
function txt(v:unknown,fb=""){const s=String(v||"").trim();return s||fb}
function list(v:unknown):string[]{if(Array.isArray(v))return v.map(x=>String(x).trim()).filter(Boolean);if(typeof v==="string"&&v.trim())return v.split(",").map(x=>x.trim()).filter(Boolean);return[]}
function rid(r:Room|null|undefined){return txt(r?.id||r?.roomId)}
function title(r:Room,kind:RoomKind){return txt(r.title||r.name,kind==="deal"?"Untitled Deal Room":"Untitled Pain Room")}
function loc(r:Room){return [txt(r.city),txt(r.county),txt(r.state)].filter(Boolean).join(", ") || "Market not listed"}
function roomState(r:Room):RoomState{return (txt(r.roomState||r.cleanupState||r.stateStatus,"active") as RoomState)}
function arr<T>(key:string):T[]{if(!ok())return[];const p=j<unknown>(localStorage.getItem(key),[]);return Array.isArray(p)?p as T[]:[]}
function stateMap(){const m:Record<string,RoomState>={};if(!ok())return m;STATE_KEYS.forEach(k=>Object.assign(m,j<Record<string,RoomState>>(localStorage.getItem(k),{})));return m}
function keys(kind:RoomKind){return kind==="deal"?DEAL_KEYS:PAIN_KEYS}

function allRooms(kind:RoomKind):Room[]{
  if(!ok()) return [];
  const out:Room[]=[];
  const seen=new Set<string>();

  for(const key of keys(kind)){
    for(const row of arr<Room>(key)){
      const id=rid(row);
      if(!id || seen.has(id)) continue;
      seen.add(id);
      out.push({...row,id,roomId:id});
    }
  }

  for(let i=0;i<localStorage.length;i++){
    const key=localStorage.key(i)||"";
    const match = kind==="deal"
      ? (key.includes("deal_room") || key.includes("deal_rooms"))
      : (key.includes("pain_room") || key.includes("pain_rooms"));
    if(!match) continue;
    const value=j<any>(localStorage.getItem(key),null);
    if(Array.isArray(value)){
      for(const row of value){
        const id=rid(row);
        if(!id || seen.has(id)) continue;
        seen.add(id);
        out.push({...row,id,roomId:id});
      }
    }else if(value && typeof value==="object"){
      const id=rid(value);
      if(id && !seen.has(id)){
        seen.add(id);
        out.push({...value,id,roomId:id});
      }
    }
  }

  const sm=stateMap();
  return out.map(r=>{
    const id=rid(r);
    const s=sm[id] || sm[`${kind}:${id}`] || roomState(r);
    return {...r,roomState:s,cleanupState:s,stateStatus:s};
  }).sort((a,b)=>String(b.createdAt||b.updatedAt||"").localeCompare(String(a.createdAt||a.updatedAt||"")));
}

function readMap(){return ok()?j<Record<string,string>>(localStorage.getItem(READ_KEY),{}):{}}
function unreadRooms(kind:RoomKind,rooms:Room[]){
  const reads=readMap();
  return rooms.filter(r=>{
    const id=rid(r);
    if(roomState(r)!=="active") return false;
    return !r.alertRead && !r.viewedAt && !reads[id] && !reads[`${kind}:${id}`];
  });
}

const page:React.CSSProperties={minHeight:"100vh",background:"#05070d",color:"#f7f7fb",padding:18,fontFamily:"Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif"};
const wrap:React.CSSProperties={maxWidth:1280,margin:"0 auto",paddingBottom:90};
const nav:React.CSSProperties={display:"flex",gap:10,flexWrap:"wrap",alignItems:"center",marginBottom:18};
const brand:React.CSSProperties={color:"#ffd45a",fontSize:27,fontWeight:950,letterSpacing:-1,marginRight:10};
const btn:React.CSSProperties={border:"1px solid rgba(207,216,230,.18)",background:"#171c29",color:"#f7f7fb",borderRadius:999,padding:"13px 18px",fontWeight:950,textDecoration:"none",display:"inline-block",cursor:"pointer"};
const goldBtn:React.CSSProperties={...btn,border:0,background:"#ffdc68",color:"#10131a"};
const redBtn:React.CSSProperties={...btn,background:"#271016",borderColor:"rgba(255,70,70,.48)",color:"#ffaaaa"};
const hero:React.CSSProperties={border:"1px solid rgba(245,197,66,.28)",borderRadius:28,padding:30,marginBottom:20,background:"radial-gradient(circle at top right, rgba(245,197,66,.16), transparent 32%), linear-gradient(180deg,#080d19,#050816)"};
const card:React.CSSProperties={background:"linear-gradient(180deg,#080d19,#050816)",border:"1px solid rgba(245,197,66,.28)",borderRadius:26,padding:26,marginBottom:22};
const panel:React.CSSProperties={background:"#121724",border:"1px solid rgba(207,216,230,.16)",borderRadius:22,padding:22};
const eyebrow:React.CSSProperties={color:"#ffd45a",textTransform:"uppercase",letterSpacing:7,fontWeight:950,fontSize:15,marginBottom:12};
const h1:React.CSSProperties={fontSize:"clamp(44px,8vw,86px)",lineHeight:.9,letterSpacing:-4,margin:"0 0 18px",fontWeight:950};
const h2:React.CSSProperties={fontSize:"clamp(30px,5vw,52px)",lineHeight:.95,letterSpacing:-2,margin:"0 0 14px",fontWeight:950};
const sub:React.CSSProperties={color:"#c9d0dc",fontSize:21,lineHeight:1.35,margin:0};
const muted:React.CSSProperties={color:"#aeb7c7",margin:"8px 0 0",lineHeight:1.35};
const grid:React.CSSProperties={display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(245px,1fr))",gap:16};
const row:React.CSSProperties={display:"flex",gap:10,flexWrap:"wrap",alignItems:"center"};
const stat:React.CSSProperties={background:"#121724",border:"1px solid rgba(207,216,230,.16)",borderRadius:20,padding:20};
const photo:React.CSSProperties={width:"100%",height:170,objectFit:"cover",borderRadius:18,marginBottom:14,border:"1px solid rgba(255,220,104,.18)"};

function Nav({active}:{active:string}){
  const item=(href:string,label:string,key:string)=><Link href={href} style={active===key?goldBtn:btn}>{label}</Link>;
  return <nav style={nav}>
    <div style={brand}>VAULTFORGE</div>
    {item("/command","Command","command")}
    {item("/deal-rooms","Deal Rooms","deals")}
    {item("/deal-create","Create Deal","create")}
    {item("/pain-intake","Pain Intake","pain-create")}
    {item("/pain-rooms","Pain Rooms","pain")}
    {item("/network","Network","network")}
    {item("/messages","Messages","messages")}
    {item("/profile","Profile","profile")}
    {item("/saved-rooms","Saved","saved")}
    {item("/archived-rooms","Archived","archived")}
    {item("/deleted-rooms","Deleted","deleted")}
    <Link href="/logout" style={redBtn}>Logout</Link>
  </nav>
}

function cover(r:Room){
  const possible=[
    txt(r.coverPhoto),
    txt(r.photoUrl),
    txt(r.imageUrl),
    ...list(r.photoUrls),
    ...list(r.photos)
  ].filter(Boolean);
  return possible.find(x=>x.startsWith("data:image")||x.startsWith("http")||x.startsWith("/")||x.startsWith("blob:")) || "";
}

function RoomCard({room,kind}:{room:Room;kind:RoomKind}){
  const id=rid(room);
  const img=cover(room);
  return <div style={panel}>
    {img?<img src={img} style={photo} alt={title(room,kind)}/>:null}
    <div style={eyebrow}>{kind==="deal"?"Deal Room":"Pain Room"} • {roomState(room)}</div>
    <h2 style={h2}>{title(room,kind)}</h2>
    <p style={sub}>{loc(room)}</p>
    <p style={muted}>
      {kind==="deal"
        ? `${txt(room.assetClass,"Deal")} • ${txt(room.propertyType,"Property")} • Route: ${list(room.routeTo).join(", ")||"Not routed"}`
        : `${txt(room.assetClass,"Pain")} • ${list(room.painTypes).join(", ")||"Problem"} • Needs: ${list(room.routingNeeds).join(", ")||"Not routed"}`}
    </p>
    <div style={{...row,marginTop:18}}>
      <Link href={kind==="deal"?`/deal-rooms/${encodeURIComponent(id)}`:`/pain-rooms/${encodeURIComponent(id)}`} style={goldBtn}>Open Room</Link>
      <Link href={`/messages?type=${kind}&room=${encodeURIComponent(id)}&subject=${encodeURIComponent((kind==="deal"?"Deal Room: ":"Pain Room: ")+title(room,kind))}`} style={btn}>Messages</Link>
    </div>
  </div>
}

const KIND:RoomKind="deal";
const ASSETS=["Residential","Commercial","Land"];
const STATES_SIMPLE=["GA","TN","AL","FL","NC","SC","TX"];
const ROUTES=KIND==="deal"?["Buyer","Lender","Operator","Contractor","Developer","Attorney","Capital Partner"]:["Lender","Operator","Contractor","Buyer","Attorney","Insurance Adjuster","City Expeditor","Private Capital"];
const PAINS=["Funding Gap","Foreclosure","Stalled Construction","Contractor Problem","Title Problem","Permit Problem","City Violation","Tenant Issue","Partnership Dispute","Emergency Exit","Insurance Claim","Fire Damage","Mold","Structural"];

function compressImage(file:File,maxWidth=850,quality=.52):Promise<string>{
  return new Promise(resolve=>{
    const reader=new FileReader();
    reader.onerror=()=>resolve("");
    reader.onload=()=>{
      const img=new Image();
      img.onerror=()=>resolve("");
      img.onload=()=>{
        try{
          const canvas=document.createElement("canvas");
          const scale=Math.min(1,maxWidth/img.width);
          canvas.width=Math.max(1,Math.round(img.width*scale));
          canvas.height=Math.max(1,Math.round(img.height*scale));
          const ctx=canvas.getContext("2d");
          if(!ctx){resolve("");return;}
          ctx.drawImage(img,0,0,canvas.width,canvas.height);
          resolve(canvas.toDataURL("image/jpeg",quality));
        }catch{resolve("")}
      };
      img.src=String(reader.result||"");
    };
    reader.readAsDataURL(file);
  })
}
async function photoData(files:FileList|null){
  const selected=Array.from(files||[]).slice(0,10);
  const out:string[]=[];
  for(const f of selected){
    const x=await compressImage(f);
    if(x && x.length<450000) out.push(x);
  }
  return out;
}
function saveRoom(kind:RoomKind,room:Room){
  if(!ok())return"";
  const id=`${kind}_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
  const now=new Date().toISOString();
  const next={...room,id,roomId:id,roomState:"active" as RoomState,cleanupState:"active" as RoomState,stateStatus:"active" as RoomState,createdAt:now,updatedAt:now,alertRead:false,viewedAt:""};
  const singleKeys=[`vaultforge_clean_${kind}_room_${id}`,`vaultforge_${kind}_room_${id}`,`vf_${kind}_room_${id}`];
  singleKeys.forEach(k=>{try{localStorage.setItem(k,JSON.stringify(next))}catch{localStorage.setItem(k,JSON.stringify({...next,photos:[],photoUrls:[],coverPhoto:""}))}});
  keys(kind).forEach(k=>{
    const rows=arr<Room>(k).filter(r=>rid(r)!==id);
    const slim={...next,photos:next.coverPhoto?[next.coverPhoto]:[],photoUrls:next.coverPhoto?[next.coverPhoto]:[]};
    try{localStorage.setItem(k,JSON.stringify([slim,...rows]))}catch{localStorage.setItem(k,JSON.stringify([{...slim,photos:[],photoUrls:[],coverPhoto:""},...rows]))}
  });
  const sm=stateMap();sm[id]="active";sm[`${kind}:${id}`]="active";STATE_KEYS.forEach(k=>localStorage.setItem(k,JSON.stringify(sm)));
  window.dispatchEvent(new Event(kind==="deal"?"vaultforge-deal-change":"vaultforge-pain-change"));
  window.dispatchEvent(new Event("vaultforge-room-state-change"));
  return id;
}
function Field({label,value,onChange}:{label:string;value:string;onChange:(v:string)=>void}){return <label><div style={eyebrow}>{label}</div><input style={{width:"100%",boxSizing:"border-box",border:"1px solid rgba(207,216,230,.18)",background:"#151b2a",color:"#f8fafc",borderRadius:18,padding:"15px 16px",fontSize:16}} value={value} onChange={e=>onChange(e.target.value)}/></label>}
function Select({label,value,onChange,options}:{label:string;value:string;onChange:(v:string)=>void;options:string[]}){return <label><div style={eyebrow}>{label}</div><select style={{width:"100%",boxSizing:"border-box",border:"1px solid rgba(207,216,230,.18)",background:"#151b2a",color:"#f8fafc",borderRadius:18,padding:"15px 16px",fontSize:16}} value={value} onChange={e=>onChange(e.target.value)}>{options.map(o=><option key={o}>{o}</option>)}</select></label>}
function ChipSet({label,options,selected,onToggle}:{label:string;options:string[];selected:string[];onToggle:(v:string)=>void}){return <div><div style={eyebrow}>{label}</div><div style={row}>{options.map(o=><button key={o} style={selected.includes(o)?goldBtn:btn} onClick={()=>onToggle(o)} type="button">{o}</button>)}</div></div>}

export default function FormPage(){
  const [form,setForm]=useState<Room>({assetClass:"Residential",state:"GA",routeTo:["Buyer"],routingNeeds:["Lender"],painTypes:["Funding Gap"]});
  const [files,setFiles]=useState<FileList|null>(null);
  const [saving,setSaving]=useState(false);
  function up(k:string,v:unknown){setForm({...form,[k]:v})}
  function tog(k:string,v:string){const s=new Set(list(form[k]));s.has(v)?s.delete(v):s.add(v);up(k,Array.from(s))}
  async function submit(){
    setSaving(true);
    const imgs=await photoData(files);
    const id=saveRoom(KIND,{...form,title:txt(form.title,KIND==="deal"?"Untitled Deal Room":"Untitled Pain Room"),coverPhoto:imgs[0]||"",photoUrl:imgs[0]||"",imageUrl:imgs[0]||"",photos:imgs,photoUrls:imgs,analyzer:KIND==="deal"?`Deal analyzer: ${txt(form.assetClass)} in ${loc(form)}. Route to ${list(form.routeTo).join(", ")||"Buyer"}.`:`Pain analyzer: ${list(form.painTypes).join(", ")||"Problem"} in ${loc(form)}. Needs ${list(form.routingNeeds).join(", ")||"solver"}.`});
    if(id) window.location.href=KIND==="deal"?`/deal-rooms/${encodeURIComponent(id)}`:`/pain-rooms/${encodeURIComponent(id)}`;
    else setSaving(false);
  }
  return <main style={page}><div style={wrap}>
    <Nav active={KIND==="deal"?"create":"pain-create"}/>
    <section style={hero}>
      <div style={eyebrow}>{KIND==="deal"?"Deal Intake":"Pain Intake"}</div>
      <h1 style={h1}>{KIND==="deal"?"Deal Opportunity.":"Problem Room."}</h1>
      <p style={sub}>Rescue form. Saves active room, cover photo, and opens the new room.</p>
    </section>
    {saving?<section style={card}><p style={sub}>Saving room...</p></section>:null}
    <section style={card}><div style={grid}>
      <Field label={KIND==="deal"?"Deal Title":"Pain Room Title"} value={txt(form.title)} onChange={v=>up("title",v)}/>
      <Select label="State" value={txt(form.state,"GA")} onChange={v=>up("state",v)} options={STATES_SIMPLE}/>
      <Field label="City" value={txt(form.city)} onChange={v=>up("city",v)}/>
      <Field label="County" value={txt(form.county)} onChange={v=>up("county",v)}/>
      <Select label="Asset Class" value={txt(form.assetClass,"Residential")} onChange={v=>up("assetClass",v)} options={ASSETS}/>
      <Field label="Property Type" value={txt(form.propertyType)} onChange={v=>up("propertyType",v)}/>
    </div></section>
    {KIND==="pain"?<section style={card}><ChipSet label="Pain Type" options={PAINS} selected={list(form.painTypes)} onToggle={v=>tog("painTypes",v)}/></section>:null}
    <section style={card}><ChipSet label={KIND==="deal"?"Route To":"Needs"} options={ROUTES} selected={KIND==="deal"?list(form.routeTo):list(form.routingNeeds)} onToggle={v=>tog(KIND==="deal"?"routeTo":"routingNeeds",v)}/></section>
    <section style={card}><div style={grid}>
      <Field label="Ask Price" value={txt(form.askingPrice)} onChange={v=>up("askingPrice",v)}/>
      <Field label="Value / ARV" value={txt(form.propertyValue)} onChange={v=>up("propertyValue",v)}/>
      <Field label="Repairs / Work" value={txt(form.repairs)} onChange={v=>up("repairs",v)}/>
      <Field label={KIND==="deal"?"Timeline":"Time Pressure"} value={txt(form.timeline||form.timePressure)} onChange={v=>up(KIND==="deal"?"timeline":"timePressure",v)}/>
    </div></section>
    <section style={card}><div style={grid}>
      <Field label="Contact Name" value={txt(form.contactName)} onChange={v=>up("contactName",v)}/>
      <Field label="Phone" value={txt(form.contactPhone)} onChange={v=>up("contactPhone",v)}/>
      <Field label="Email" value={txt(form.contactEmail)} onChange={v=>up("contactEmail",v)}/>
      <Field label="Notes / AI Context" value={txt(form.notes)} onChange={v=>up("notes",v)}/>
    </div></section>
    <section style={card}><div style={eyebrow}>Photos Up To 10</div><input type="file" multiple accept="image/*" onChange={e=>setFiles(e.target.files)}/><p style={muted}>{files?files.length:0}/10 selected. First photo becomes cover.</p></section>
    <section style={card}><button style={goldBtn} onClick={submit}>{KIND==="deal"?"Save Deal Room":"Save Pain Room"}</button></section>
  </div></main>
}
