"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type RoomState = "active" | "saved" | "archived" | "deleted";
type RoomKind = "deal" | "pain";
type Room = { id?: string; roomId?: string; title?: string; name?: string; state?: string; city?: string; county?: string; assetClass?: string; propertyType?: string; routeTo?: string[] | string; routingNeeds?: string[] | string; painTypes?: string[] | string; severity?: string; timePressure?: string; timeline?: string; roomState?: RoomState; cleanupState?: RoomState; stateStatus?: RoomState; alertRead?: boolean; viewedAt?: string; coverPhoto?: string; photoUrl?: string; imageUrl?: string; photos?: string[]; photoUrls?: string[]; [key: string]: unknown; };
type Profile = { name?: string; company?: string; email?: string; phone?: string; memberType?: string; profilePhoto?: string; primaryCity?: string; primaryCounty?: string; statesOperated?: string[]; markets?: string[]; strategies?: string[]; assetClasses?: string[]; specialties?: string[]; needs?: string[]; canProvide?: string[]; capitalPosition?: string; proofOfFunds?: string; fundingRange?: string; contactPreference?: string; directContact?: string; bio?: string; [key: string]: unknown; };

const STATES=["GA","TN","AL","FL","NC","SC","TX"];
const MARKETS=["Atlanta","North Georgia","Chattanooga","Nashville","Knoxville","Birmingham","Huntsville","Montgomery","Jacksonville","Tampa","Orlando","Miami","Charlotte","Raleigh-Durham","Greenville-Spartanburg","Charleston","Dallas-Fort Worth","Houston","Austin","San Antonio"];
const ASSETS=["Residential","Commercial","Land"];
const STRATEGIES=["Wholesale","Flip","Buy & Hold","BRRRR","Development","Seller Finance","JV","Rental","Hotel Conversion","Airbnb"];
const SPECIALTIES=["Distress","Funding Gap","Off Market","Construction","Land","Commercial","Residential","Creative Finance","Insurance","Permits","Probate","Foreclosure","Tax Sale","Stalled Project","Value Add"];
const NEEDS=["Lender","Operator","Contractor","Buyer","Attorney","Insurance Adjuster","City Expeditor","Private Capital","Property Manager","Developer"];
const CAN_PROVIDE=["Capital","Buying","Lending","Contractors","Legal","Insurance","Property Management","Development","Operations","Introductions"];
const MEMBER_TYPES=["Investor","Wholesaler","Lender","Contractor","Developer","Agent","Attorney","Operator","Private Capital","Property Manager"];
const CONTACT_PREFS=["VaultForge Message","Text","Phone","Email","Contact Form"];
const CAPITAL_POSITIONS=["Unknown","Cash Buyer","Private Capital","Hard Money","Bank Lending","JV Capital","Needs Capital","Operator With Capital","Operator Needs Capital"];
const FUNDING_RANGES=["Unknown","Under $50k","$50k-$250k","$250k-$1M","$1M-$5M","$5M+"];
const YESNO=["Unknown","Yes","No"];
const CITY_COUNTY:Record<string,string>={atlanta:"Fulton",alpharetta:"Fulton",roswell:"Fulton",marietta:"Cobb",cartersville:"Bartow",cville:"Bartow",cvile:"Bartow",adairsville:"Bartow",rome:"Floyd",gainesville:"Hall",savannah:"Chatham",augusta:"Richmond",columbus:"Muscogee",macon:"Bibb",chattanooga:"Hamilton",nashville:"Davidson",knoxville:"Knox",birmingham:"Jefferson",huntsville:"Madison",charlotte:"Mecklenburg",raleigh:"Wake",greenville:"Greenville",charleston:"Charleston",dallas:"Dallas",houston:"Harris",austin:"Travis","san antonio":"Bexar",sanantonio:"Bexar"};

const DEAL_KEYS=["vaultforge_clean_deal_rooms","vaultforge_deal_rooms","vaultforge_rooms_deals","vf_deal_rooms"];
const PAIN_KEYS=["vaultforge_clean_pain_rooms_v1","vaultforge_clean_pain_rooms","vaultforge_pain_rooms","vaultforge_rooms_pain","vf_pain_rooms"];
const STATE_KEYS=["vaultforge_clean_room_states","vaultforge_room_states","vaultforge_deal_room_states","vaultforge_pain_room_states","vaultforge_5s_room_states"];
const PROFILE_KEYS=["vaultforge_profile","vaultforge_member_profile","vaultforge_clean_profile"];
const READ_KEY="vaultforge_room_alert_read_v1";

function ok(){return typeof window!=="undefined"&&typeof window.localStorage!=="undefined";}
function j<T>(raw:string|null,fb:T):T{try{return raw?JSON.parse(raw) as T:fb}catch{return fb}}
function txt(v:unknown,fb=""){const s=String(v||"").trim();return s||fb}
function list(v:unknown):string[]{if(Array.isArray(v))return v.map(x=>String(x).trim()).filter(Boolean);if(typeof v==="string"&&v.trim())return v.split(",").map(x=>x.trim()).filter(Boolean);return[]}
function rid(r:Room|null|undefined){return txt(r?.id||r?.roomId)}
function titleFor(r:Room,k:RoomKind){return txt(r.title||r.name,k==="deal"?"Untitled Deal Room":"Untitled Pain Room")}
function loc(r:Room){return [txt(r.city),txt(r.county),txt(r.state)].filter(Boolean).join(", ")||"Market not listed"}
function roomState(r:Room):RoomState{return txt(r.roomState||r.cleanupState||r.stateStatus,"active") as RoomState}
function arr<T>(key:string):T[]{if(!ok())return[];const parsed=j<unknown>(localStorage.getItem(key),[]);return Array.isArray(parsed)?parsed as T[]:[]}
function stateMap(){const m:Record<string,RoomState>={};if(!ok())return m;STATE_KEYS.forEach(k=>Object.assign(m,j<Record<string,RoomState>>(localStorage.getItem(k),{})));return m}
function allRooms(kind:RoomKind):Room[]{if(!ok())return[];const keys=kind==="deal"?DEAL_KEYS:PAIN_KEYS;const out:Room[]=[];const seen=new Set<string>();for(const key of keys){for(const row of arr<Room>(key)){const id=rid(row);if(!id||seen.has(id))continue;seen.add(id);out.push({...row,id,roomId:id});}}for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i)||"";const match=kind==="deal"?(key.includes("deal_room")||key.includes("deal_rooms")):(key.includes("pain_room")||key.includes("pain_rooms"));if(!match)continue;const value=j<any>(localStorage.getItem(key),null);if(Array.isArray(value)){for(const row of value){const id=rid(row);if(!id||seen.has(id))continue;seen.add(id);out.push({...row,id,roomId:id});}}else if(value&&typeof value==="object"){const id=rid(value);if(id&&!seen.has(id)){seen.add(id);out.push({...value,id,roomId:id});}}}const sm=stateMap();return out.map(r=>{const id=rid(r);const s=sm[id]||sm[`${kind}:${id}`]||roomState(r);return{...r,roomState:s,cleanupState:s,stateStatus:s};});}
function unreadRooms(kind:RoomKind,rooms:Room[]){const reads=ok()?j<Record<string,string>>(localStorage.getItem(READ_KEY),{}):{};return rooms.filter(r=>{const id=rid(r);return roomState(r)==="active"&&!r.alertRead&&!r.viewedAt&&!reads[id]&&!reads[`${kind}:${id}`];});}
function firstPhoto(r:Room){const possible=[txt(r.coverPhoto),txt(r.photoUrl),txt(r.imageUrl),...list(r.photoUrls),...list(r.photos)].filter(Boolean);return possible.find(src=>src.startsWith("data:image")||src.startsWith("http")||src.startsWith("/")||src.startsWith("blob:"))||""}
function countyFromCity(city:string){return CITY_COUNTY[city.trim().toLowerCase().replace(/\s+/g," ")]||""}
async function compressImage(file:File,maxWidth=850,quality=.52):Promise<string>{return new Promise(resolve=>{const reader=new FileReader();reader.onerror=()=>resolve("");reader.onload=()=>{const img=new Image();img.onerror=()=>resolve("");img.onload=()=>{try{const scale=Math.min(1,maxWidth/img.width);const canvas=document.createElement("canvas");canvas.width=Math.max(1,Math.round(img.width*scale));canvas.height=Math.max(1,Math.round(img.height*scale));const ctx=canvas.getContext("2d");if(!ctx){resolve("");return;}ctx.drawImage(img,0,0,canvas.width,canvas.height);resolve(canvas.toDataURL("image/jpeg",quality));}catch{resolve("");}};img.src=String(reader.result||"");};reader.readAsDataURL(file);});}
async function onePhoto(files:FileList|null){const file=Array.from(files||[])[0];return file?compressImage(file):""}
function saveProfile(profile:Profile){if(!ok())return;PROFILE_KEYS.forEach(k=>localStorage.setItem(k,JSON.stringify(profile)));window.dispatchEvent(new Event("vaultforge-profile-change"));}

const page:React.CSSProperties={minHeight:"100vh",background:"#05070d",color:"#f7f7fb",padding:18,fontFamily:"Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif"};
const wrap:React.CSSProperties={maxWidth:1280,margin:"0 auto",paddingBottom:90};
const nav:React.CSSProperties={display:"flex",gap:10,flexWrap:"wrap",alignItems:"center",marginBottom:18};
const brand:React.CSSProperties={color:"#ffd45a",fontSize:27,fontWeight:950,letterSpacing:-1,marginRight:10};
const btn:React.CSSProperties={border:"1px solid rgba(207,216,230,.18)",background:"#171c29",color:"#f7f7fb",borderRadius:999,padding:"13px 18px",fontWeight:950,textDecoration:"none",display:"inline-block",cursor:"pointer"};
const goldBtn:React.CSSProperties={...btn,border:0,background:"#ffdc68",color:"#10131a"};
const redBtn:React.CSSProperties={...btn,background:"#271016",borderColor:"rgba(255,70,70,.48)",color:"#ffaaaa"};
const hero:React.CSSProperties={border:"1px solid rgba(245,197,66,.28)",borderRadius:28,padding:30,marginBottom:20,background:"radial-gradient(circle at top right, rgba(245,197,66,.16), transparent 32%), linear-gradient(180deg,#080d19,#050816)"};
const redHero:React.CSSProperties={...hero,borderColor:"rgba(255,70,70,.42)",background:"radial-gradient(circle at top right, rgba(255,50,80,.22), transparent 35%), linear-gradient(180deg,#120611,#050816)"};
const card:React.CSSProperties={background:"linear-gradient(180deg,#080d19,#050816)",border:"1px solid rgba(245,197,66,.28)",borderRadius:26,padding:26,marginBottom:22};
const panel:React.CSSProperties={background:"#121724",border:"1px solid rgba(207,216,230,.16)",borderRadius:22,padding:22};
const pulsePanel:React.CSSProperties={...panel,borderColor:"rgba(255,70,70,.65)",boxShadow:"0 0 26px rgba(255,50,70,.22)"};
const eyebrow:React.CSSProperties={color:"#ffd45a",textTransform:"uppercase",letterSpacing:7,fontWeight:950,fontSize:15,marginBottom:12};
const labelStyle:React.CSSProperties={color:"#ffd45a",textTransform:"uppercase",letterSpacing:4,fontSize:12,fontWeight:950,marginBottom:8};
const h1:React.CSSProperties={fontSize:"clamp(44px,8vw,86px)",lineHeight:.9,letterSpacing:-4,margin:"0 0 18px",fontWeight:950};
const h2:React.CSSProperties={fontSize:"clamp(30px,5vw,52px)",lineHeight:.95,letterSpacing:-2,margin:"0 0 14px",fontWeight:950};
const sub:React.CSSProperties={color:"#c9d0dc",fontSize:21,lineHeight:1.35,margin:0};
const muted:React.CSSProperties={color:"#aeb7c7",margin:"8px 0 0",lineHeight:1.35};
const grid:React.CSSProperties={display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(245px,1fr))",gap:16};
const row:React.CSSProperties={display:"flex",gap:10,flexWrap:"wrap",alignItems:"center"};
const input:React.CSSProperties={width:"100%",boxSizing:"border-box",border:"1px solid rgba(207,216,230,.18)",background:"#151b2a",color:"#f8fafc",borderRadius:18,padding:"15px 16px",fontSize:16};
const textarea:React.CSSProperties={...input,minHeight:110,resize:"vertical"};
const photoStyle:React.CSSProperties={width:"100%",height:160,objectFit:"cover",borderRadius:18,border:"1px solid rgba(245,197,66,.25)",marginBottom:12};

function Nav({active}:{active:string}){const item=(href:string,label:string,key:string)=><Link href={href} style={active===key?goldBtn:btn}>{label}</Link>;return <nav style={nav}><div style={brand}>VAULTFORGE</div>{item("/command","Command","command")}{item("/deal-rooms","Deal Rooms","deals")}{item("/deal-create","Create Deal","deal-create")}{item("/pain-intake","Pain Intake","pain-intake")}{item("/pain-rooms","Pain Rooms","pain")}{item("/network","Network","network")}{item("/messages","Messages","messages")}{item("/profile","Profile","profile")}{item("/saved-rooms","Saved","saved")}{item("/archived-rooms","Archived","archived")}{item("/deleted-rooms","Deleted","deleted")}<Link href="/logout" style={redBtn}>Logout</Link></nav>}
function Section({title,children}:{title:string;children:React.ReactNode}){return <section style={card}><div style={eyebrow}>{title}</div>{children}</section>}
function Field({label,value,onChange}:{label:string;value:string;onChange:(v:string)=>void}){return <label><div style={labelStyle}>{label}</div><input style={input} value={value} onChange={e=>onChange(e.target.value)}/></label>}
function TextArea({label,value,onChange}:{label:string;value:string;onChange:(v:string)=>void}){return <label><div style={labelStyle}>{label}</div><textarea style={textarea} value={value} onChange={e=>onChange(e.target.value)}/></label>}
function SelectField({label,value,onChange,options}:{label:string;value:string;onChange:(v:string)=>void;options:string[]}){return <label><div style={labelStyle}>{label}</div><select style={input} value={value} onChange={e=>onChange(e.target.value)}>{options.map(o=><option key={o}>{o}</option>)}</select></label>}
function ChipSet({label,options,selected,onToggle}:{label:string;options:string[];selected:string[];onToggle:(v:string)=>void}){return <div><div style={labelStyle}>{label}</div><div style={row}>{options.map(o=><button key={o} type="button" style={selected.includes(o)?goldBtn:btn} onClick={()=>onToggle(o)}>{o}</button>)}</div></div>}
function RoomMiniCard({room,kind,pulse}:{room:Room;kind:RoomKind;pulse?:boolean}){const img=firstPhoto(room);const href=kind==="deal"?`/deal-rooms/${encodeURIComponent(rid(room))}`:`/pain-rooms/${encodeURIComponent(rid(room))}`;return <div style={pulse?pulsePanel:panel}>{img?<img src={img} alt={titleFor(room,kind)} style={photoStyle}/>:null}<div style={eyebrow}>{kind==="deal"?"Deal Alert":"Pain Alert"}</div><h2 style={h2}>{titleFor(room,kind)}</h2><p style={sub}>{loc(room)}</p><p style={muted}>{kind==="deal"?`Route: ${list(room.routeTo).join(", ")||"Buyer"}`:`Needs: ${list(room.routingNeeds).join(", ")||"Solver"}`}</p><div style={{...row,marginTop:16}}><Link href={href} style={goldBtn}>Open Room</Link><Link href={`/messages?type=${kind}&room=${encodeURIComponent(rid(room))}`} style={btn}>Messages</Link></div></div>}

export default function ProfilePage(){
  const [profile,setProfile]=useState<Profile>({statesOperated:["GA"],markets:[],memberType:"Investor",contactPreference:"VaultForge Message",directContact:"Unknown",capitalPosition:"Unknown",proofOfFunds:"Unknown",fundingRange:"Unknown"});
  const [saved,setSaved]=useState("");
  useEffect(()=>{if(!ok())return;const found=PROFILE_KEYS.map(k=>j<Profile|null>(localStorage.getItem(k),null)).find(r=>r&&typeof r==="object");if(found)setProfile(found);},[]);
  function up(k:string,v:unknown){setProfile({...profile,[k]:v});}
  function toggle(k:keyof Profile,v:string){const s=new Set(list(profile[k]));s.has(v)?s.delete(v):s.add(v);up(String(k),Array.from(s));}
  function updateCity(v:string){const county=countyFromCity(v);setProfile({...profile,primaryCity:v,primaryCounty:county||profile.primaryCounty||""});}
  async function handlePhoto(files:FileList|null){const photo=await onePhoto(files);if(photo)setProfile({...profile,profilePhoto:photo});}
  function save(){saveProfile(profile);setSaved("Profile saved.");}
  return <main style={page}><div style={wrap}><Nav active="profile"/>
    <section style={hero}><div style={eyebrow}>Profile</div><h1 style={h1}>AI matching data.</h1><p style={sub}>Automatic county fill from city, stronger buy box, strategy, network routing, capital, proof, contact, and photo upload.</p></section>
    {saved?<Section title="Status"><p style={sub}>{saved}</p></Section>:null}
    <Section title="Identity"><div style={grid}><Field label="Name" value={txt(profile.name)} onChange={v=>up("name",v)}/><Field label="Company" value={txt(profile.company)} onChange={v=>up("company",v)}/><Field label="Email" value={txt(profile.email)} onChange={v=>up("email",v)}/><Field label="Phone" value={txt(profile.phone)} onChange={v=>up("phone",v)}/><SelectField label="Member Type" value={txt(profile.memberType,"Investor")} onChange={v=>up("memberType",v)} options={MEMBER_TYPES}/><SelectField label="Contact Preference" value={txt(profile.contactPreference,"VaultForge Message")} onChange={v=>up("contactPreference",v)} options={CONTACT_PREFS}/></div></Section>
    <Section title="Profile Photo">{txt(profile.profilePhoto)?<img src={txt(profile.profilePhoto)} alt="Profile" style={{width:150,height:150,objectFit:"cover",borderRadius:24,border:"1px solid rgba(245,197,66,.3)",display:"block",marginBottom:14}}/>:null}<input type="file" accept="image/*" onChange={e=>handlePhoto(e.target.files)}/><p style={muted}>Photo saves locally for now.</p></Section>
    <Section title="Geography Intelligence"><div style={grid}><Field label="Primary City" value={txt(profile.primaryCity)} onChange={updateCity}/><Field label="Auto County" value={txt(profile.primaryCounty)} onChange={v=>up("primaryCounty",v)}/></div><div style={{height:18}}/><ChipSet label="States Operated In" options={STATES} selected={list(profile.statesOperated)} onToggle={v=>toggle("statesOperated",v)}/><div style={{height:18}}/><ChipSet label="Markets / Submarkets" options={MARKETS} selected={list(profile.markets)} onToggle={v=>toggle("markets",v)}/></Section>
    <Section title="Buy Box + Strategy"><ChipSet label="Asset Classes" options={ASSETS} selected={list(profile.assetClasses)} onToggle={v=>toggle("assetClasses",v)}/><div style={{height:18}}/><ChipSet label="Strategies" options={STRATEGIES} selected={list(profile.strategies)} onToggle={v=>toggle("strategies",v)}/><div style={{height:18}}/><ChipSet label="Specialties" options={SPECIALTIES} selected={list(profile.specialties)} onToggle={v=>toggle("specialties",v)}/></Section>
    <Section title="Network Routing"><ChipSet label="Needs" options={NEEDS} selected={list(profile.needs)} onToggle={v=>toggle("needs",v)}/><div style={{height:18}}/><ChipSet label="Can Provide" options={CAN_PROVIDE} selected={list(profile.canProvide)} onToggle={v=>toggle("canProvide",v)}/></Section>
    <Section title="Capital + Contact"><div style={grid}><SelectField label="Capital Position" value={txt(profile.capitalPosition,"Unknown")} onChange={v=>up("capitalPosition",v)} options={CAPITAL_POSITIONS}/><SelectField label="Proof / POF Available" value={txt(profile.proofOfFunds,"Unknown")} onChange={v=>up("proofOfFunds",v)} options={YESNO}/><SelectField label="Funding Range" value={txt(profile.fundingRange,"Unknown")} onChange={v=>up("fundingRange",v)} options={FUNDING_RANGES}/><SelectField label="Direct Contact Allowed" value={txt(profile.directContact,"Unknown")} onChange={v=>up("directContact",v)} options={YESNO}/></div></Section>
    <Section title="AI Bio / Routing Notes"><TextArea label="Bio / Routing Notes" value={txt(profile.bio)} onChange={v=>up("bio",v)}/></Section>
    <Section title="Save"><button style={goldBtn} onClick={save}>Save Profile</button>{" "}<Link href="/network" style={btn}>Open Network</Link></Section>
  </div></main>
}
