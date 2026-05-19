"use client";
import Link from "next/link";
import {useEffect,useMemo,useState} from "react";

type RoomState = "active" | "saved" | "archived" | "deleted";
type RoomKind = "deal" | "pain";
type Room = { id?: string; roomId?: string; dealId?: string; painId?: string; title?: string; name?: string; state?: string; city?: string; county?: string; roomState?: RoomState; cleanupState?: RoomState; stateStatus?: RoomState; viewedAt?: string; alertRead?: boolean; routeTo?: string[] | string; routedTo?: string[] | string; routingNeeds?: string[] | string; painTypes?: string[] | string; [key:string]: unknown };
type Profile = { id?: string; name?: string; company?: string; email?: string; phone?: string; photoUrl?: string; memberType?: string; statesOperatedIn?: string[] | string; states?: string[] | string; markets?: string[] | string; strategies?: string[] | string; status?: RoomState; [key:string]: unknown };

const STATES = ["GA","TN","AL","FL","NC","SC","TX"];
const DEAL_KEYS = ["vaultforge_clean_deal_rooms","vaultforge_deal_rooms","vaultforge_rooms_deals","vf_deal_rooms"];
const PAIN_KEYS = ["vaultforge_clean_pain_rooms_v1","vaultforge_clean_pain_rooms","vaultforge_pain_rooms","vaultforge_rooms_pain","vf_pain_rooms"];
const STATE_KEYS = ["vaultforge_clean_room_states","vaultforge_room_states","vaultforge_deal_room_states","vaultforge_pain_room_states","vaultforge_5s_room_states"];
const READ_KEY = "vaultforge_room_alert_read_v1";
const PROFILE_KEY = "vaultforge_member_profile_v1";
const NETWORK_KEY = "vaultforge_network_members_v1";

function ok(){ return typeof window !== "undefined" && typeof window.localStorage !== "undefined"; }
function j<T>(raw:string|null, fb:T):T{ try{return raw?JSON.parse(raw) as T:fb}catch{return fb} }
function txt(v:unknown, fb=""){ const s=String(v||"").trim(); return s||fb; }
function list(v:unknown):string[]{ if(Array.isArray(v)) return v.map(x=>String(x).trim()).filter(Boolean); if(typeof v==="string"&&v.trim()) return v.split(",").map(x=>x.trim()).filter(Boolean); return []; }
function rid(r:Room|null|undefined){ return txt(r?.id||r?.roomId||r?.dealId||r?.painId); }
function roomTitle(r:Room,k:RoomKind){ return txt(r.title||r.name,k==="deal"?"Untitled Deal Room":"Untitled Pain Room"); }
function loc(r:Room){ return [txt(r.city),txt(r.county),txt(r.state)].filter(Boolean).join(", ")||"Market not listed"; }
function href(k:RoomKind,r:Room){ return k==="deal"?`/deal-rooms/${encodeURIComponent(rid(r))}`:`/pain-rooms/${encodeURIComponent(rid(r))}`; }
function arr<T>(key:string):T[]{ if(!ok()) return []; const p=j<unknown>(localStorage.getItem(key),[]); return Array.isArray(p)?p as T[]:[]; }
function keys(k:RoomKind){ return k==="deal"?DEAL_KEYS:PAIN_KEYS; }
function statesMap(){ const m:Record<string,RoomState>={}; if(!ok()) return m; STATE_KEYS.forEach(k=>Object.assign(m,j<Record<string,RoomState>>(localStorage.getItem(k),{}))); return m; }
function roomState(r:Room,k:RoomKind):RoomState{ const m=statesMap(); const id=rid(r); const s=m[`${k}:${id}`]||m[id]||r.roomState||r.cleanupState||r.stateStatus||"active"; return s==="saved"||s==="archived"||s==="deleted"?s:"active"; }
function reads(){ return ok()?j<Record<string,string>>(localStorage.getItem(READ_KEY),{}):{}; }
function unread(k:RoomKind,r:Room){ const id=rid(r); const m=reads(); return !(m[id]||m[`${k}:${id}`]||r.viewedAt||r.alertRead); }
function readRooms(k:RoomKind):Room[]{ if(!ok())return[]; const map=new Map<string,Room>(); keys(k).forEach(key=>arr<Room>(key).forEach(r=>{const id=rid(r); if(id&&!map.has(id))map.set(id,{...r,id})})); for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i)||""; const isD=k==="deal"&&(key.startsWith("vaultforge_clean_deal_room_")||key.startsWith("vaultforge_deal_room_")||key.startsWith("vf_deal_room_")); const isP=k==="pain"&&(key.startsWith("vaultforge_clean_pain_room_")||key.startsWith("vaultforge_pain_room_")||key.startsWith("vf_pain_room_")); if(!isD&&!isP)continue; const r=j<Room|null>(localStorage.getItem(key),null); const id=rid(r); if(r&&id&&!map.has(id))map.set(id,{...r,id});} return Array.from(map.values()).map(r=>({...r,roomState:roomState(r,k)})); }
function roomsByState(k:RoomKind,s:string){ return readRooms(k).filter(r=>txt(r.state).toUpperCase()===s.toUpperCase()&&roomState(r,k)==="active"); }
function unreadByState(k:RoomKind,s:string){ return roomsByState(k,s).filter(r=>unread(k,r)); }
function setRoomState(r:Room,k:RoomKind,s:RoomState){ if(!ok())return; const id=rid(r); if(!id)return; const next={...r,id,roomState:s,cleanupState:s,stateStatus:s,updatedAt:new Date().toISOString()}; [`vaultforge_clean_${k}_room_${id}`,`vaultforge_${k}_room_${id}`,`vf_${k}_room_${id}`].forEach(x=>localStorage.setItem(x,JSON.stringify(next))); keys(k).forEach(key=>localStorage.setItem(key,JSON.stringify([next,...arr<Room>(key).filter(x=>rid(x)!==id)]))); const sm=statesMap(); sm[id]=s; sm[`${k}:${id}`]=s; STATE_KEYS.forEach(key=>localStorage.setItem(key,JSON.stringify(sm))); window.dispatchEvent(new Event("vaultforge-room-state-change")); }
function readProfile():Profile{ return ok()?j<Profile>(localStorage.getItem(PROFILE_KEY),{}):{}; }
function profileStates(p:Profile){ const st=list(p.statesOperatedIn||p.states).map(x=>x.toUpperCase()); return st.length?st:["GA"]; }
function memberStatus(p:Profile):RoomState{ const s=p.status||"active"; return s==="saved"||s==="archived"||s==="deleted"?s:"active"; }
function members():Profile[]{ if(!ok())return[]; const cur=readProfile(); const base=arr<Profile>(NETWORK_KEY); const map=new Map<string,Profile>(); base.forEach(m=>map.set(txt(m.id||m.email||m.name||m.company).toLowerCase(),m)); if(txt(cur.name)||txt(cur.company)||txt(cur.email)){ map.set(txt(cur.id||cur.email||"current").toLowerCase(),{...cur,id:txt(cur.id||cur.email||"current"),name:txt(cur.name||cur.company,"Dmoney"),company:txt(cur.company,"VaultForge"),email:txt(cur.email,"bcrsoutheast@gmail.com"),statesOperatedIn:profileStates(cur),memberType:txt(cur.memberType,"Owner / Operator")}); } return Array.from(map.values()); }
function saveMember(m:Profile,s:RoomState){ if(!ok())return; const id=txt(m.id||m.email||m.name||m.company); const rows=members().filter(x=>txt(x.id||x.email||x.name||x.company).toLowerCase()!==id.toLowerCase()); localStorage.setItem(NETWORK_KEY,JSON.stringify([{...m,id,status:s},...rows])); window.dispatchEvent(new Event("vaultforge-network-change")); }
function messageHref(m:Profile){ const n=txt(m.name||m.company,"Member"); return `/messages?type=network&member=${encodeURIComponent(n)}&subject=${encodeURIComponent("Network Contact: "+n)}`; }


function Nav({active}:{active:string}) {
  return <nav style={nav}>
    <div style={brand}>VAULTFORGE</div>
    <Link href="/command" style={active==="command"?goldBtn:btn}>Command</Link>
    <Link href="/deal-rooms" style={btn}>Deal Rooms</Link>
    <Link href="/pain-rooms" style={btn}>Pain Rooms</Link>
    <Link href="/network" style={active==="network"?goldBtn:btn}>Network</Link>
    <Link href="/messages" style={btn}>Messages</Link>
    <Link href="/profile" style={active==="profile"?goldBtn:btn}>Profile</Link>
    <Link href="/logout" style={redBtn}>Logout</Link>
  </nav>
}

export default function NetworkPage(){
 const [state,setState]=useState("GA"); const [folder,setFolder]=useState<RoomState>("active"); const [tick,setTick]=useState(0);
 function load(){setTick(x=>x+1)}
 useEffect(()=>{load(); const ev=["storage","vaultforge-network-change","vaultforge-room-state-change","vaultforge-room-read-change","vaultforge-deal-change","vaultforge-pain-change"]; ev.forEach(e=>window.addEventListener(e,load)); return()=>ev.forEach(e=>window.removeEventListener(e,load));},[]);
 const ms=useMemo(()=>members().filter(m=>profileStates(m).includes(state)&&memberStatus(m)===folder),[tick,state,folder]);
 const d=roomsByState("deal",state), p=roomsByState("pain",state), du=unreadByState("deal",state), pu=unreadByState("pain",state);
 return <main style={page}><style>{`@keyframes vfPulse{0%{box-shadow:0 0 0 0 rgba(255,70,70,.45);transform:translateY(0)}70%{box-shadow:0 0 0 13px rgba(255,70,70,0);transform:translateY(-1px)}100%{box-shadow:0 0 0 0 rgba(255,70,70,0);transform:translateY(0)}}`}</style><div style={wrap}><Nav active="network"/>
 <section style={hero}><div style={eyebrow}>Network Intelligence</div><h1 style={h1}>State network + project routing.</h1><p style={sub}>Click a state to pull members, Deal projects, and Pain projects. Deal and Pain stay split with counts, unread counts, and pulse.</p></section>
 <section style={card}><div style={eyebrow}>State Network</div><div style={row}>{STATES.map(s=><button key={s} type="button" onClick={()=>setState(s)} style={state===s?chipActive:chip}>{s}</button>)}</div></section>
 <section style={card}><div style={eyebrow}>{state} Projects</div><h2 style={h2}>Split project cards.</h2><div style={twoGrid}>
  <Link href={`/network/state/${state}?type=deal`} style={{...splitCard,...(du.length?redPulse:{})}}><div style={smallEyebrow}>Deal Projects</div><h3 style={h3}>{state} Deal Rooms</h3><div style={statNumber}>{d.length}</div><p style={muted}>{du.length} unread • active Deal Rooms</p><span style={{...goldBtn,marginTop:16}}>Open Deal Projects</span></Link>
  <Link href={`/network/state/${state}?type=pain`} style={{...splitCard,...(pu.length?redPulse:{})}}><div style={smallEyebrow}>Pain Projects</div><h3 style={h3}>{state} Pain Rooms</h3><div style={statNumber}>{p.length}</div><p style={muted}>{pu.length} unread • active Pain Rooms</p><span style={{...goldBtn,marginTop:16}}>Open Pain Projects</span></Link>
 </div></section>
 <section style={card}><div style={eyebrow}>Member Directory</div><h2 style={h2}>{state} members.</h2><div style={{...row,marginBottom:18}}>{(["active","saved","archived","deleted"] as RoomState[]).map(f=><button key={f} type="button" onClick={()=>setFolder(f)} style={folder===f?chipActive:chip}>{f.toUpperCase()}</button>)}</div><div style={grid}>{ms.length?ms.map(m=><Member key={txt(m.id||m.email||m.name)} m={m} load={load}/>):<div style={inner}><h3 style={h3}>No members in {state} {folder}.</h3><p style={muted}>Save your profile to populate this state network.</p></div>}</div></section>
 </div></main>
}
function Member({m,load}:{m:Profile;load:()=>void}){ const name=txt(m.name||m.company,"VaultForge Member"); const photo=txt(m.photoUrl); return <article style={inner}><div style={{display:"flex",gap:16,alignItems:"center",marginBottom:14}}>{photo?<img src={photo} alt="" style={avatar}/>:<div style={avatar}/>}<div><div style={smallEyebrow}>{txt(m.memberType,"Member")}</div><h3 style={h3}>{name}</h3><p style={muted}>{txt(m.company,"Independent Operator")}</p></div></div><p style={muted}>States: {profileStates(m).join(", ")}</p><p style={muted}>Markets: {list(m.markets).join(", ")||"Not listed"}</p><p style={muted}>Contact: {[txt(m.phone),txt(m.email)].filter(Boolean).join(" • ")||"Not listed"}</p><div style={{...row,marginTop:16}}><Link href={messageHref(m)} style={goldBtn}>Message</Link>{txt(m.email)?<a href={`mailto:${txt(m.email)}`} style={btn}>Email</a>:null}{txt(m.phone)?<a href={`tel:${txt(m.phone)}`} style={btn}>Call</a>:null}</div><div style={{...row,marginTop:16}}><button onClick={()=>{saveMember(m,"saved");load();}} style={btn}>Save</button><button onClick={()=>{saveMember(m,"archived");load();}} style={btn}>Archive</button><button onClick={()=>{saveMember(m,"deleted");load();}} style={redBtn}>Delete</button></div></article>}

const page:React.CSSProperties={minHeight:"100vh",background:"#05070d",color:"#f7f7fb",padding:18,fontFamily:"Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif"};
const wrap:React.CSSProperties={maxWidth:1280,margin:"0 auto",paddingBottom:90};
const nav:React.CSSProperties={display:"flex",gap:10,flexWrap:"wrap",alignItems:"center",marginBottom:18};
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
const h2:React.CSSProperties={fontSize:"clamp(32px,5vw,54px)",lineHeight:.95,letterSpacing:-2,margin:"0 0 18px",fontWeight:950};
const h3:React.CSSProperties={fontSize:28,lineHeight:1,margin:"0 0 8px",fontWeight:950};
const sub:React.CSSProperties={color:"#c9d0dc",fontSize:21,lineHeight:1.35,margin:0};
const muted:React.CSSProperties={color:"#aeb7c7",margin:"8px 0 0",lineHeight:1.35};
const grid:React.CSSProperties={display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(245px,1fr))",gap:16};
const twoGrid:React.CSSProperties={display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(320px,1fr))",gap:18};
const row:React.CSSProperties={display:"flex",gap:10,flexWrap:"wrap",alignItems:"center"};
const chip:React.CSSProperties={...btn,padding:"11px 16px"};
const chipActive:React.CSSProperties={...chip,background:"#ffdc68",color:"#10131a",border:0};
const statNumber:React.CSSProperties={fontSize:50,fontWeight:950,lineHeight:1};
const splitCard:React.CSSProperties={background:"#121724",border:"1px solid rgba(207,216,230,.16)",borderRadius:22,padding:22,color:"#f7f7fb",textDecoration:"none",display:"block"};
const redPulse:React.CSSProperties={borderColor:"rgba(255,70,70,.75)",animation:"vfPulse 1.8s infinite"};
const avatar:React.CSSProperties={width:76,height:76,borderRadius:18,objectFit:"cover",background:"#0b0f19",border:"1px solid rgba(245,197,66,.28)"};
const input:React.CSSProperties={width:"100%",boxSizing:"border-box",border:"1px solid rgba(207,216,230,.18)",background:"#151b2a",color:"#f8fafc",borderRadius:18,padding:"15px 16px",fontSize:16,outline:"none"};
const label:React.CSSProperties={color:"#ffd45a",textTransform:"uppercase",letterSpacing:4,fontSize:12,fontWeight:950,marginBottom:8};

