"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type RoomState = "active" | "saved" | "archived" | "deleted";
type AnyDeal = Record<string, any>;
type Profile = Record<string, any>;

const ROOM_KEYS = ["vaultforge_clean_deal_rooms", "vaultforge_deal_rooms", "vaultforge_rooms_deals", "vf_deal_rooms"];
const STATE_KEY = "vaultforge_clean_room_states";
const PROFILE_KEY = "vaultforge_profile_v2";

function readJson<T>(key: string, fallback: T): T { try { const raw = window.localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch { return fallback; } }
function writeJson(key: string, value: any) { window.localStorage.setItem(key, JSON.stringify(value)); }
function idOf(d: AnyDeal) { return String(d.id || d.roomId || d.dealId || ""); }
function first(d: AnyDeal, keys: string[], fallback = "") { for (const k of keys) { const v = d?.[k]; if (v !== undefined && v !== null && String(v).trim()) return String(v); } return fallback; }
function list(d: AnyDeal, keys: string[]) { for (const k of keys) { const v = d?.[k]; if (Array.isArray(v)) return v.map(String); if (typeof v === "string" && v.trim()) return v.split(",").map((x) => x.trim()).filter(Boolean); } return []; }
function photo(d: AnyDeal) { return first(d, ["photoUrl", "photoURL", "imageUrl", "publicUrl", "photo", "photoDataUrl", "image", "thumbnailUrl"]); }
function money(v: string) { const clean = String(v || "").replace(/[^0-9.]/g, ""); if (!clean) return "Not listed"; const n = Number(clean); return Number.isFinite(n) ? `$${n.toLocaleString()}` : v; }
function roomStates(): Record<string, RoomState> { return readJson(STATE_KEY, {} as Record<string, RoomState>); }
function stateFor(id: string, d: AnyDeal): RoomState { return roomStates()[id] || d.roomState || "active"; }
function readDeals(): AnyDeal[] {
  const map = new Map<string, AnyDeal>();
  const states = roomStates();
  ROOM_KEYS.forEach((key) => readJson<AnyDeal[]>(key, []).forEach((d) => { const id = idOf(d); if (id && !map.has(id)) map.set(id, { ...d, id, roomState: states[id] || d.roomState || "active" }); }));
  Object.keys(localStorage).filter((key) => key.startsWith("vaultforge_clean_deal_room_") || key.startsWith("vaultforge_deal_room_") || key.startsWith("vf_deal_room_")).forEach((key) => {
    const d = readJson<AnyDeal | null>(key, null); const id = d ? idOf(d) : ""; if (id && !map.has(id)) map.set(id, { ...d, id, roomState: states[id] || d?.roomState || "active" });
  });
  return Array.from(map.values()).sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
}
function syncDeal(deal: AnyDeal) {
  const id = idOf(deal); if (!id) return;
  writeJson(`vaultforge_clean_deal_room_${id}`, deal); writeJson(`vaultforge_deal_room_${id}`, deal); writeJson(`vf_deal_room_${id}`, deal);
  ROOM_KEYS.forEach((key) => { const rows = readJson<AnyDeal[]>(key, []).filter((item) => idOf(item) !== id); writeJson(key, [deal, ...rows]); });
  window.dispatchEvent(new Event("vaultforge-deal-change"));
}
function setState(deal: AnyDeal, state: RoomState) { const states = roomStates(); const id = idOf(deal); states[id] = state; writeJson(STATE_KEY, states); syncDeal({ ...deal, roomState: state, updatedAt: new Date().toISOString() }); }
function profile() { return readJson<Profile>(PROFILE_KEY, {}); }
function matchReasons(deal: AnyDeal, p: Profile) {
  const reasons: string[] = [];
  const state = first(deal, ["state"]); const county = first(deal, ["county"]); const asset = first(deal, ["assetClass", "assetType"]);
  const states = [...(p.buyStates || []), ...(p.operateStates || []), ...(p.alertStates || []), ...(p.contactStates || [])];
  if (state && states.includes(state)) reasons.push(`${state} market fit`);
  if (county && p.countiesByState?.[state]?.includes?.(county)) reasons.push(`${county} County fit`);
  if (asset && (p.assetTypes || []).some((x: string) => asset.toLowerCase().includes(String(x).toLowerCase()) || String(x).toLowerCase().includes(asset.toLowerCase()))) reasons.push(`${asset} asset fit`);
  list(deal, ["routeTo", "routedTo"]).forEach((r) => { if ((p.memberTypes || []).includes(r) || (p.capitalRoles || []).includes(r)) reasons.push(`${r} route lane`); });
  if ((p.routingRules || []).includes("Allow AI Routing")) reasons.push("AI routing allowed");
  return reasons.length ? reasons : ["Profile saved for routing", "Review exact buy box", "Needs deeper Supabase member graph later"];
}

function DealCard({ deal }: { deal: AnyDeal }) {
  const [tick, setTick] = useState(0); const p = profile(); const id = idOf(deal); const img = photo(deal); const routes = list(deal, ["routeTo", "routedTo"]); const reasons = matchReasons(deal, p);
  const currentState = stateFor(id, deal);
  return <article className="vf-deal-card">
    <div className="vf-photo">{img ? <img src={img} alt={first(deal,["title"],"Deal photo")} /> : <span>No photo</span>}</div>
    <div className="vf-deal-body">
      <div className="vf-eyebrow">{first(deal,["assetClass","asset_class"],"Deal Room")}</div>
      <h2>{first(deal,["title","name"],"Untitled Deal")}</h2>
      <p>{[first(deal,["city"]), first(deal,["county"]), first(deal,["state"])].filter(Boolean).join(" • ") || "Market not listed"}</p>
      <div className="vf-pills"><span>{money(first(deal,["askingPrice","ask"]))}</span><span>ARV {money(first(deal,["arv","value"]))}</span><span>{routes.length || 1} AI route lane{routes.length === 1 ? "" : "s"}</span><span>{reasons[0]}</span></div>
      <div className="vf-signal"><strong>Signal:</strong> {first(deal,["signalSummary"], `${first(deal,["urgency"],"Active")} opportunity with ${money(first(deal,["askingPrice","ask"]))} ask, ${money(first(deal,["arv","value"]))} value, ${list(deal,["knownIssues","issues"]).join(", ") || "no listed blockers"}.`)}</div>
      <div className="vf-actions"><Link href={`/deal-rooms/${encodeURIComponent(id)}`} className="vf-btn vf-gold">Open Room</Link><button onClick={()=>{setState(deal,"saved");setTick(tick+1)}} className="vf-btn">Save</button><button onClick={()=>{setState(deal,"archived");setTick(tick+1)}} className="vf-btn">Archive</button><button onClick={()=>{setState(deal,"deleted");setTick(tick+1)}} className="vf-btn vf-red">Delete</button><span className="vf-state">{currentState}</span></div>
    </div>
  </article>;
}

export default function VaultForgeDealRoomsClient() {
  const [rooms, setRooms] = useState<AnyDeal[]>([]);
  function refresh() { setRooms(readDeals()); }
  useEffect(() => { refresh(); window.addEventListener("vaultforge-deal-change", refresh); window.addEventListener("storage", refresh); return () => { window.removeEventListener("vaultforge-deal-change", refresh); window.removeEventListener("storage", refresh); }; }, []);
  const metrics = useMemo(() => ({ active: rooms.filter((r)=>stateFor(idOf(r),r)==="active").length, saved: rooms.filter((r)=>stateFor(idOf(r),r)==="saved").length, archived: rooms.filter((r)=>stateFor(idOf(r),r)==="archived").length, photos: rooms.filter(photo).length }), [rooms]);
  return <>
    <style>{`.vf-deal-card{display:grid;grid-template-columns:220px minmax(0,1fr);gap:16px;border:1px solid rgba(245,197,66,.24);border-radius:26px;background:linear-gradient(145deg,#08101e,#050816);padding:14px;margin-bottom:14px}.vf-photo{height:190px;border-radius:20px;border:1px solid rgba(245,197,66,.18);background:#111827;display:grid;place-items:center;overflow:hidden;color:#c9d0dc;font-weight:950}.vf-photo img{width:100%;height:100%;object-fit:cover;display:block}.vf-deal-body h2{font-size:34px;line-height:1;margin:0 0 8px}.vf-deal-body p{color:#c9d0dc;margin:0 0 12px;font-size:18px}.vf-pills{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0}.vf-pills span{border:1px solid rgba(245,197,66,.18);background:rgba(245,197,66,.07);color:#ffe99a;border-radius:999px;padding:8px 11px;font-size:12px;font-weight:900}.vf-signal{border:1px solid rgba(255,255,255,.1);border-radius:18px;padding:13px;color:#c9d0dc;background:rgba(255,255,255,.04);line-height:1.35}.vf-actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:14px;align-items:center}.vf-state{font-size:12px;text-transform:uppercase;letter-spacing:2px;color:#c9d0dc;font-weight:900}@media(max-width:760px){.vf-deal-card{grid-template-columns:1fr}.vf-photo{height:240px}}`}</style>
    <section className="vf-grid"><div className="vf-metric"><span>Active</span><strong>{metrics.active}</strong></div><div className="vf-metric"><span>Saved</span><strong>{metrics.saved}</strong></div><div className="vf-metric"><span>Archived</span><strong>{metrics.archived}</strong></div><div className="vf-metric"><span>Photos</span><strong>{metrics.photos}</strong></div></section>
    <section className="vf-card"><div className="vf-eyebrow">Active Intelligence Rooms</div>{rooms.length ? rooms.filter((r)=>stateFor(idOf(r),r)!=="deleted").map((room)=><DealCard key={idOf(room)} deal={room}/>) : <p className="vf-copy">No Deal Rooms yet. Create a deal to start the VaultForge brain.</p>}</section>
  </>;
}
