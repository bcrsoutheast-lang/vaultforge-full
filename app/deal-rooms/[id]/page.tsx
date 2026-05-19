
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
function saveState(kind:RoomKind,room:Room,state:RoomState){
  if(!ok())return;
  const id=rid(room);
  const next={...room,roomState:state,cleanupState:state,stateStatus:state,updatedAt:new Date().toISOString()};
  [`vaultforge_clean_${kind}_room_${id}`,`vaultforge_${kind}_room_${id}`,`vf_${kind}_room_${id}`].forEach(k=>localStorage.setItem(k,JSON.stringify(next)));
  keys(kind).forEach(k=>localStorage.setItem(k,JSON.stringify([next,...arr<Room>(k).filter(r=>rid(r)!==id)])));
  const sm=stateMap();sm[id]=state;sm[`${kind}:${id}`]=state;STATE_KEYS.forEach(k=>localStorage.setItem(k,JSON.stringify(sm)));
  window.dispatchEvent(new Event("vaultforge-room-state-change"));
}
function markRead(kind:RoomKind,room:Room){
  const id=rid(room); if(!ok()||!id)return;
  const reads=j<Record<string,string>>(localStorage.getItem(READ_KEY),{});
  reads[id]=new Date().toISOString(); reads[`${kind}:${id}`]=new Date().toISOString();
  localStorage.setItem(READ_KEY,JSON.stringify(reads));
  const next={...room,alertRead:true,viewedAt:new Date().toISOString()};
  [`vaultforge_clean_${kind}_room_${id}`,`vaultforge_${kind}_room_${id}`,`vf_${kind}_room_${id}`].forEach(k=>localStorage.setItem(k,JSON.stringify(next)));
}
function getRoom(kind:RoomKind,id:string){
  const rooms=allRooms(kind);
  return rooms.find(r=>rid(r)===id)||null;
}
export default function DetailPage({params}:{params:{id:string}}){
  const id=decodeURIComponent(params.id||"");
  const [room,setRoom]=useState<Room|null>(null);
  useEffect(()=>{const r=getRoom(KIND,id);setRoom(r);if(r)markRead(KIND,r)},[id]);
  if(!room)return <main style={page}><div style={wrap}><Nav active={KIND==="deal"?"deals":"pain"}/><section style={hero}><h1 style={h1}>Room not found.</h1></section></div></main>
  const img=cover(room);
  return <main style={page}><div style={wrap}>
    <Nav active={KIND==="deal"?"deals":"pain"}/>
    <section style={hero}>{img?<img src={img} alt={title(room,KIND)} style={{...photo,height:260}}/>:null}<div style={eyebrow}>{KIND==="deal"?"Deal Room":"Pain Room"}</div><h1 style={h1}>{title(room,KIND)}</h1><p style={sub}>{loc(room)}</p><p style={muted}>Current: {roomState(room)}</p></section>
    <section style={card}><div style={eyebrow}>5S Controls</div><div style={row}><button style={goldBtn} onClick={()=>{saveState(KIND,room,"saved");setRoom({...room,roomState:"saved",cleanupState:"saved",stateStatus:"saved"})}}>Save</button><button style={btn} onClick={()=>{saveState(KIND,room,"archived");setRoom({...room,roomState:"archived",cleanupState:"archived",stateStatus:"archived"})}}>Archive</button><button style={redBtn} onClick={()=>{saveState(KIND,room,"deleted");setRoom({...room,roomState:"deleted",cleanupState:"deleted",stateStatus:"deleted"})}}>Delete</button></div></section>
    <section style={card}><div style={eyebrow}>Room Summary</div><p style={sub}>{txt(room.analyzer, KIND==="deal"?"Deal room saved. Verify facts and route to profile.":"Pain room saved. Verify problem and route solution profile.")}</p></section>
    <section style={card}><div style={grid}>
      <div style={stat}><div style={eyebrow}>Asset</div><p style={sub}>{txt(room.assetClass)} {txt(room.propertyType)}</p></div>
      <div style={stat}><div style={eyebrow}>Numbers</div><p style={sub}>Ask {txt(room.askingPrice,"N/A")} • Value {txt(room.propertyValue,"N/A")} • Repairs {txt(room.repairs,"N/A")}</p></div>
      <div style={stat}><div style={eyebrow}>{KIND==="deal"?"Route To":"Needs"}</div><p style={sub}>{KIND==="deal"?list(room.routeTo).join(", "):list(room.routingNeeds).join(", ")}</p></div>
      <div style={stat}><div style={eyebrow}>Notes</div><p style={sub}>{txt(room.notes,"No notes.")}</p></div>
    </div></section>
    <section style={card}><div style={eyebrow}>Owner Message</div><Link href={`/messages?type=${KIND}&room=${encodeURIComponent(id)}&subject=${encodeURIComponent((KIND==="deal"?"Deal Room: ":"Pain Room: ")+title(room,KIND))}`} style={goldBtn}>Message Owner</Link></section>
  </div></main>
}
