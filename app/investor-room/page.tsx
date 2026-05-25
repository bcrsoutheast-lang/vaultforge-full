
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Kind = "deal" | "pain" | "message" | "owner";
type Folder = "active" | "saved" | "archived" | "deleted";

type Card = {
  id: string;
  kind: Kind;
  folder: Folder;
  title: string;
  subtitle: string;
  state: string;
  body: string;
  source: string;
};

const STATE_KEY = "vaultforge_investor_room_card_state_v3";
const FOREVER_KEY = "vaultforge_investor_room_deleted_forever_v3";

const wrap: React.CSSProperties = { minHeight:"100vh", background:"radial-gradient(circle at 18% 10%, rgba(245,197,66,.12), transparent 32%), radial-gradient(circle at 86% 8%, rgba(120,0,30,.18), transparent 34%), #05070b", color:"#f7f8ff", padding:"28px 20px 90px", fontFamily:'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' };
const shell: React.CSSProperties = { maxWidth:1180, margin:"0 auto" };
const nav: React.CSSProperties = { display:"flex", flexWrap:"wrap", gap:12, alignItems:"center", marginBottom:20 };
const brand: React.CSSProperties = { color:"#ffda5e", fontWeight:1000, fontSize:28, letterSpacing:"-.04em" };
const btn: React.CSSProperties = { border:"1px solid rgba(207,216,230,.18)", background:"rgba(18,24,38,.92)", color:"#f7f8ff", borderRadius:999, padding:"12px 18px", fontWeight:900, textDecoration:"none", cursor:"pointer", display:"inline-flex", alignItems:"center", justifyContent:"center" };
const goldBtn: React.CSSProperties = { ...btn, background:"linear-gradient(135deg,#ffe16a,#f4bf37)", color:"#080a10" };
const redBtn: React.CSSProperties = { ...btn, background:"rgba(90,10,18,.72)", color:"#ffb2b2", border:"1px solid rgba(255,65,65,.65)" };
const card: React.CSSProperties = { border:"1px solid rgba(207,216,230,.16)", borderRadius:26, background:"rgba(15,21,34,.88)", padding:24, marginBottom:20 };
const goldCard: React.CSSProperties = { ...card, borderColor:"rgba(245,197,66,.42)", background:"linear-gradient(135deg,rgba(22,25,37,.96),rgba(33,31,20,.82))" };
const panel: React.CSSProperties = { border:"1px solid rgba(207,216,230,.15)", borderRadius:22, background:"rgba(17,23,36,.78)", padding:20 };
const grid: React.CSSProperties = { display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:14 };
const roomGrid: React.CSSProperties = { display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))", gap:14 };
const row: React.CSSProperties = { display:"flex", flexWrap:"wrap", gap:10, alignItems:"center" };
const eyebrow: React.CSSProperties = { color:"#ffda5e", textTransform:"uppercase", letterSpacing:".34em", fontSize:12, fontWeight:1000 };
const h1: React.CSSProperties = { fontSize:"clamp(42px,7vw,82px)", lineHeight:".92", letterSpacing:"-.08em", margin:"12px 0", fontWeight:1000 };
const h2: React.CSSProperties = { fontSize:"clamp(30px,4.5vw,54px)", lineHeight:".95", letterSpacing:"-.065em", margin:"10px 0", fontWeight:1000 };
const h3: React.CSSProperties = { fontSize:28, lineHeight:1, letterSpacing:"-.05em", margin:"8px 0", fontWeight:1000 };
const sub: React.CSSProperties = { color:"rgba(235,240,255,.78)", fontSize:20, lineHeight:1.45, margin:"8px 0" };
const muted: React.CSSProperties = { color:"rgba(235,240,255,.68)", fontSize:15, lineHeight:1.45, margin:"6px 0" };

function parseAny(raw: string | null, fallback: any) { try { return raw ? JSON.parse(raw) : fallback; } catch { return fallback; } }
function clean(v: any, fb = "Not listed") { const t = String(v ?? "").trim(); return t || fb; }
function collect(v: any): any[] { if (Array.isArray(v)) return v; if (!v || typeof v !== "object") return []; const out:any[]=[]; Object.values(v).forEach((x:any)=>{ if(Array.isArray(x)) out.push(...x); }); if (v.id || v.title || v.name || v.propertyName || v.projectName || v.subject || v.message) out.push(v); return out; }
function savedStates(): Record<string, Folder> { if (typeof window === "undefined") return {}; return parseAny(localStorage.getItem(STATE_KEY), {}); }
function saveStates(v: Record<string, Folder>) { if (typeof window !== "undefined") localStorage.setItem(STATE_KEY, JSON.stringify(v)); }
function foreverIds(): string[] { if (typeof window === "undefined") return []; return parseAny(localStorage.getItem(FOREVER_KEY), []); }
function saveForever(v: string[]) { if (typeof window !== "undefined") localStorage.setItem(FOREVER_KEY, JSON.stringify(Array.from(new Set(v)))); }
function badKey(k: string) { const x=k.toLowerCase(); return x.includes("activity") || x.includes("history") || x.includes("viewed") || x.includes("audit") || x.includes("log") || x.includes("analytics") || x.includes("deleted_forever"); }
function usefulKey(k: string) { const x=k.toLowerCase(); if (badKey(x)) return false; return x.includes("room") || x.includes("deal") || x.includes("pain") || x.includes("project") || x.includes("property") || x.includes("message") || x.includes("request") || x.includes("clean_"); }
function kindFor(key:string,item:any): Kind { const t=(key+" "+JSON.stringify(item||{})).toLowerCase(); if(t.includes("pain")||t.includes("problem")||t.includes("foreclosure")||t.includes("funding gap")) return "pain"; if(t.includes("owner") && (t.includes("reply")||t.includes("message"))) return "owner"; if(t.includes("message")||t.includes("thread")||t.includes("reply")) return "message"; return "deal"; }
function folderFor(item:any, id:string): Folder { const override = savedStates()[id]; if (override) return override; const raw=String(item?.folder || item?.status || item?.roomStatus || item?.workspaceStatus || "active").toLowerCase(); if(raw.includes("delete")||raw.includes("trash")) return "deleted"; if(raw.includes("archive")) return "archived"; if(raw.includes("save")) return "saved"; return "active"; }
function realTitle(item:any, kind:Kind) { return clean(item?.title || item?.name || item?.projectName || item?.propertyName || item?.dealTitle || item?.painTitle || item?.subject || (kind === "pain" ? "Pain Signal" : kind === "deal" ? "Deal Signal" : "Message")); }
function cardId(kind:Kind, item:any, key:string, index:number) { const raw=clean(item?.id || item?.roomId || item?.slug || item?.threadId || "", ""); if(raw) return `${kind}:${raw}`; const title=realTitle(item,kind).toLowerCase().replace(/[^a-z0-9]+/g,"-"); const state=clean(item?.state || item?.propertyState || item?.marketState || item?.market || "na").toLowerCase().replace(/[^a-z0-9]+/g,"-"); return `${kind}:${title}:${state}:${key}`; }
function loadCards(): Card[] { if (typeof window === "undefined") return []; const keys=new Set<string>(["vaultforge_rooms_v1","vaultforge_deal_rooms_v1","vaultforge_clean_deal_rooms","vaultforge_pain_rooms_v1","vaultforge_clean_pain_rooms","vaultforge_member_rooms_v1","vaultforge_property_cards_v1","vaultforge_projects_v1","vaultforge_deals_v1","vaultforge_pain_requests_v1","vaultforge_my_rooms_clean_v2","vaultforge_command_rooms_v1","vaultforge_investor_requests_v1","vaultforge_member_requests_v1","vaultforge_message_threads_v1","vaultforge_owner_messages_v1"]); for(let i=0;i<localStorage.length;i++){ const k=localStorage.key(i)||""; if(usefulKey(k)) keys.add(k); } const dead=new Set(foreverIds()); const map=new Map<string,Card>(); Array.from(keys).forEach((key)=>{ if(badKey(key)) return; const parsed=parseAny(localStorage.getItem(key),null); collect(parsed).forEach((item,index)=>{ if(!item || typeof item!=="object") return; const text=(key+" "+JSON.stringify(item)).toLowerCase(); if(text.includes("room opened")||text.includes("status change")||text.includes("viewed room")) return; if(!(text.includes("deal")||text.includes("room")||text.includes("pain")||text.includes("project")||text.includes("property")||text.includes("message")||text.includes("request")||item.title||item.name||item.propertyName||item.projectName)) return; const kind=kindFor(key,item); const id=cardId(kind,item,key,index); if(dead.has(id)) return; const folder=folderFor(item,id); const state=clean(item?.state || item?.propertyState || item?.marketState || item?.market || "NA", "NA"); const title=realTitle(item,kind); const subtitle=clean(item?.city || item?.propertyCity || item?.county || item?.propertyCounty || item?.strategy || item?.assetType || item?.propertyType || "Member submitted", "Member submitted"); const body=clean(item?.message || item?.summary || item?.notes || item?.description || item?.body || item?.problem || item?.need || (kind==="pain"?"Member submitted a problem/pain signal for investor review.":"Member submitted a deal opportunity signal for investor review.")); const record={id,kind,folder,title,subtitle,state,body,source:key}; const old=map.get(id); if(!old || old.title.includes("Signal")) map.set(id,record); }); }); return Array.from(map.values()).sort((a,b)=>a.kind.localeCompare(b.kind)||a.title.localeCompare(b.title)); }

function Tile({title,count,note,active,onClick}:{title:string;count:number;note:string;active:boolean;onClick:()=>void}) { return <button type="button" onClick={onClick} style={{...panel,minHeight:150,textAlign:"left",cursor:"pointer",borderColor:active?"rgba(245,197,66,.7)":"rgba(207,216,230,.15)"}}><div style={eyebrow}>{title}</div><h2 style={{...h2,color:count?"#1e90ff":"#8f99aa"}}>{count}</h2><p style={muted}>{note}</p><p style={{...muted,color:"#ffd45a",fontWeight:950}}>Tap to open</p></button>; }
function CardView({item,onOpen}:{item:Card;onOpen:(x:Card)=>void}) { return <button type="button" onClick={()=>onOpen(item)} style={{...panel,textAlign:"left",cursor:"pointer",borderColor:item.folder==="deleted"?"rgba(255,65,65,.65)":"rgba(245,197,66,.42)"}}><div style={eyebrow}>{item.kind} • {item.state} • {item.folder}</div><h3 style={h3}>{item.title}</h3><p style={muted}>{item.subtitle}</p><p style={muted}>{item.body}</p><p style={{...muted,color:"#ffd45a",fontWeight:950}}>Open details</p></button>; }

export default function InvestorRoomPage() {
  const [cards,setCards]=useState<Card[]>([]);
  const [lane,setLane]=useState<Kind | Folder>("deal");
  const [selected,setSelected]=useState<Card | null>(null);
  useEffect(()=>{ setCards(loadCards()); },[]);
  const grouped=useMemo(()=>({
    deals: cards.filter(x=>x.kind==="deal" && x.folder==="active"),
    pain: cards.filter(x=>x.kind==="pain" && x.folder==="active"),
    messages: cards.filter(x=>x.kind==="message" && x.folder==="active"),
    owner: cards.filter(x=>x.kind==="owner" && x.folder==="active"),
    saved: cards.filter(x=>x.folder==="saved"),
    archived: cards.filter(x=>x.folder==="archived"),
    deleted: cards.filter(x=>x.folder==="deleted"),
  }),[cards]);
  const visible = lane==="deal"?grouped.deals:lane==="pain"?grouped.pain:lane==="message"?grouped.messages:lane==="owner"?grouped.owner:lane==="saved"?grouped.saved:lane==="archived"?grouped.archived:grouped.deleted;
  function move(id:string,folder:Folder){ const states=savedStates(); states[id]=folder; saveStates(states); const next=cards.map(c=>c.id===id?{...c,folder}:c); setCards(next); setSelected(s=>s&&s.id===id?{...s,folder}:s); setLane(folder); }
  function forever(id:string){ saveForever([...foreverIds(),id]); const next=cards.filter(c=>c.id!==id); setCards(next); setSelected(null); setLane("deleted"); }
  return <main style={wrap}><div style={shell}>
    <section style={card}><div style={eyebrow}>Investor Alerts • {grouped.deals.length+grouped.pain.length+grouped.messages.length+grouped.owner.length} Active</div><div style={{...grid,marginTop:16}}><Tile title="Deals" count={grouped.deals.length} note="deal opportunity cards" active={lane==="deal"} onClick={()=>setLane("deal")} /><Tile title="Pain" count={grouped.pain.length} note="problem/pain signals" active={lane==="pain"} onClick={()=>setLane("pain")} /><Tile title="Messages" count={grouped.messages.length} note="owner/member/investor requests" active={lane==="message"} onClick={()=>setLane("message")} /><Tile title="Owner Replies" count={grouped.owner.length} note="owner replies to requests" active={lane==="owner"} onClick={()=>setLane("owner")} /></div></section>
    <nav style={nav}><div style={brand}>VAULTFORGE</div><Link href="/" style={btn}>Home</Link><Link href="/investor-room" style={goldBtn}>Investor Access</Link><Link href="/payment" style={btn}>Payment</Link><Link href="/messages" style={goldBtn}>Message Owner</Link><Link href="/logout" style={btn}>Logout</Link><Link href="/admin" style={redBtn}>Owner</Link></nav>
    <section style={goldCard}><div style={eyebrow}>VaultForge Investor Command Room</div><h1 style={h1}>Signals → Requests → Threads → Execution.</h1><p style={sub}>Start with Deal/Pain signals, request controlled information, track replies, then request execution help from the private member network.</p><div style={{...row,marginTop:18}}><button type="button" onClick={()=>setLane("deal")} style={goldBtn}>Open Deal Signals</button><button type="button" onClick={()=>setLane("pain")} style={btn}>Open Pain Signals</button><Link href="/messages" style={goldBtn}>Message Owner</Link></div></section>
    <section style={card}><div style={eyebrow}>Folders</div><h2 style={h2}>Clean signal control.</h2><div style={row}><button type="button" style={lane==="saved"?goldBtn:btn} onClick={()=>setLane("saved")}>Saved ({grouped.saved.length})</button><button type="button" style={lane==="archived"?goldBtn:btn} onClick={()=>setLane("archived")}>Archived ({grouped.archived.length})</button><button type="button" style={lane==="deleted"?goldBtn:redBtn} onClick={()=>setLane("deleted")}>Deleted ({grouped.deleted.length})</button></div></section>
    {selected ? <section style={card}><div style={eyebrow}>{selected.kind} detail • {selected.folder}</div><h2 style={h2}>{selected.title}</h2><p style={sub}>{selected.subtitle} • {selected.state}</p><p style={muted}>{selected.body}</p><p style={muted}>Source: {selected.source}</p><div style={row}><button type="button" style={goldBtn} onClick={()=>move(selected.id,"active")}>Active</button><button type="button" style={btn} onClick={()=>move(selected.id,"saved")}>Save</button><button type="button" style={btn} onClick={()=>move(selected.id,"archived")}>Archive</button><button type="button" style={redBtn} onClick={()=>move(selected.id,"deleted")}>Delete</button>{selected.folder==="deleted"?<button type="button" style={redBtn} onClick={()=>forever(selected.id)}>Delete Forever</button>:null}<button type="button" style={btn} onClick={()=>setSelected(null)}>Close</button></div></section> : null}
    <section style={card}><div style={eyebrow}>{String(lane)}</div><h2 style={h2}>{visible.length ? "Signal Feed" : "No cards in this lane."}</h2>{visible.length?<div style={roomGrid}>{visible.map(item=><CardView key={item.id} item={item} onOpen={setSelected} />)}</div>:<p style={sub}>Create a member Deal or Pain room and it will appear in the correct lane.</p>}</section>
  </div></main>;
}
