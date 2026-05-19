
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

export default function CommandPage(){
  const [tick,setTick]=useState(0);
  useEffect(()=>{
    const refresh=()=>setTick(x=>x+1);
    ["storage","vaultforge-room-state-change","vaultforge-deal-change","vaultforge-pain-change","vaultforge-room-read-change"].forEach(e=>window.addEventListener(e,refresh));
    return()=>["storage","vaultforge-room-state-change","vaultforge-deal-change","vaultforge-pain-change","vaultforge-room-read-change"].forEach(e=>window.removeEventListener(e,refresh));
  },[]);

  const deals=useMemo(()=>allRooms("deal"),[tick]);
  const pains=useMemo(()=>allRooms("pain"),[tick]);
  const activeDeals=deals.filter(r=>roomState(r)==="active");
  const activePains=pains.filter(r=>roomState(r)==="active");
  const unreadDeals=unreadRooms("deal",deals);
  const unreadPains=unreadRooms("pain",pains);

  return <main style={page}><div style={wrap}>
    <Nav active="command"/>

    <section style={hero}>
      <div style={eyebrow}>Command Center</div>
      <h1 style={h1}>Live intelligence first.</h1>
      <p style={sub}>Rescue build: Create Deal, Pain Intake, active rooms, and folders are back on one member-side system.</p>
      <div style={{...row,marginTop:22}}>
        <Link href="/deal-create" style={goldBtn}>Create Deal</Link>
        <Link href="/pain-intake" style={goldBtn}>Submit Pain</Link>
        <Link href="/deal-rooms" style={btn}>Open Deals</Link>
        <Link href="/pain-rooms" style={btn}>Open Pain</Link>
      </div>
    </section>

    <section style={card}>
      <div style={eyebrow}>Live Alert Desk</div>
      <h2 style={h2}>Active work only.</h2>
      <div style={grid}>
        <div style={stat}><div style={eyebrow}>Unread Deals</div><h2 style={h2}>{unreadDeals.length}</h2><p style={muted}>{activeDeals.length} active total</p></div>
        <div style={stat}><div style={eyebrow}>Unread Pain</div><h2 style={h2}>{unreadPains.length}</h2><p style={muted}>{activePains.length} active total</p></div>
        <div style={stat}><div style={eyebrow}>All Deals</div><h2 style={h2}>{deals.length}</h2><p style={muted}>All states/folders</p></div>
        <div style={stat}><div style={eyebrow}>All Pain</div><h2 style={h2}>{pains.length}</h2><p style={muted}>All states/folders</p></div>
      </div>
    </section>

    <section style={card}>
      <div style={eyebrow}>5S Room Folders</div>
      <h2 style={h2}>Six clean folders.</h2>
      <div style={grid}>
        <Folder label="Saved Deals" count={deals.filter(r=>roomState(r)==="saved").length} href="/saved-rooms"/>
        <Folder label="Archived Deals" count={deals.filter(r=>roomState(r)==="archived").length} href="/archived-rooms"/>
        <Folder label="Deleted Deals" count={deals.filter(r=>roomState(r)==="deleted").length} href="/deleted-rooms"/>
        <Folder label="Saved Pain" count={pains.filter(r=>roomState(r)==="saved").length} href="/saved-rooms"/>
        <Folder label="Archived Pain" count={pains.filter(r=>roomState(r)==="archived").length} href="/archived-rooms"/>
        <Folder label="Deleted Pain" count={pains.filter(r=>roomState(r)==="deleted").length} href="/deleted-rooms"/>
      </div>
    </section>

    <section style={card}>
      <div style={eyebrow}>Active Deal Rooms</div>
      {activeDeals.length?<div style={grid}>{activeDeals.slice(0,6).map(r=><RoomCard key={rid(r)} room={r} kind="deal"/>)}</div>:<p style={sub}>No active deal rooms. Use Create Deal.</p>}
    </section>

    <section style={card}>
      <div style={eyebrow}>Active Pain Rooms</div>
      {activePains.length?<div style={grid}>{activePains.slice(0,6).map(r=><RoomCard key={rid(r)} room={r} kind="pain"/>)}</div>:<p style={sub}>No active pain rooms. Use Pain Intake.</p>}
    </section>
  </div></main>
}

function Folder({label,count,href}:{label:string;count:number;href:string}){
  return <div style={stat}><div style={eyebrow}>{label}</div><h2 style={h2}>{count} total</h2><Link href={href} style={goldBtn}>Open Folder</Link></div>
}
