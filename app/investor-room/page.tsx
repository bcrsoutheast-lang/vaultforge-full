"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Lane = "deals" | "pain" | "messages" | "owner" | "saved" | "archived" | "deleted";
type Kind = "deal" | "pain" | "message" | "owner";
type Folder = "active" | "saved" | "archived" | "deleted";

type Item = {
  id: string;
  kind: Kind;
  folder: Folder;
  title: string;
  body: string;
  state: string;
  status: string;
  source: string;
};

const STORE = "vaultforge_investor_signal_cards_v3";
const FOREVER = "vaultforge_investor_signal_deleted_forever_v3";

const wrap: React.CSSProperties = { minHeight: "100vh", background: "radial-gradient(circle at 18% 10%, rgba(245,197,66,.12), transparent 32%), radial-gradient(circle at 86% 8%, rgba(120,0,30,.18), transparent 34%), #05070b", color: "#f7f8ff", padding: "28px 20px 90px", fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' };
const shell: React.CSSProperties = { maxWidth: 1180, margin: "0 auto" };
const nav: React.CSSProperties = { display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", marginBottom: 20 };
const brand: React.CSSProperties = { color: "#ffda5e", fontWeight: 1000, fontSize: 28, letterSpacing: "-.04em" };
const btn: React.CSSProperties = { border: "1px solid rgba(207,216,230,.18)", background: "rgba(18,24,38,.92)", color: "#f7f8ff", borderRadius: 999, padding: "12px 18px", fontWeight: 900, textDecoration: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" };
const goldBtn: React.CSSProperties = { ...btn, background: "linear-gradient(135deg,#ffe16a,#f4bf37)", color: "#080a10" };
const redBtn: React.CSSProperties = { ...btn, background: "rgba(90,10,18,.72)", color: "#ffb2b2", border: "1px solid rgba(255,65,65,.65)" };
const card: React.CSSProperties = { border: "1px solid rgba(207,216,230,.16)", borderRadius: 26, background: "rgba(15,21,34,.88)", padding: 24, marginBottom: 20 };
const goldCard: React.CSSProperties = { ...card, borderColor: "rgba(245,197,66,.42)", background: "linear-gradient(135deg,rgba(22,25,37,.96),rgba(33,31,20,.82))" };
const panel: React.CSSProperties = { border: "1px solid rgba(207,216,230,.15)", borderRadius: 22, background: "rgba(17,23,36,.78)", padding: 20 };
const grid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 14 };
const roomGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 14 };
const eyebrow: React.CSSProperties = { color: "#ffda5e", textTransform: "uppercase", letterSpacing: ".34em", fontSize: 12, fontWeight: 1000 };
const h1: React.CSSProperties = { fontSize: "clamp(42px,7vw,82px)", lineHeight: ".92", letterSpacing: "-.08em", margin: "12px 0", fontWeight: 1000 };
const h2: React.CSSProperties = { fontSize: "clamp(30px,4.5vw,54px)", lineHeight: ".95", letterSpacing: "-.065em", margin: "10px 0", fontWeight: 1000 };
const h3: React.CSSProperties = { fontSize: 28, lineHeight: 1, letterSpacing: "-.05em", margin: "8px 0", fontWeight: 1000 };
const sub: React.CSSProperties = { color: "rgba(235,240,255,.78)", fontSize: 20, lineHeight: 1.45, margin: "8px 0" };
const muted: React.CSSProperties = { color: "rgba(235,240,255,.68)", fontSize: 15, lineHeight: 1.45, margin: "6px 0" };

function parse<T>(raw: string | null, fallback: T): T { if (!raw) return fallback; try { return JSON.parse(raw) as T; } catch { return fallback; } }
function clean(v: unknown, f = "Not listed") { const t = String(v || "").trim(); return t || f; }
function collect(v: unknown): any[] { if (Array.isArray(v)) return v; if (!v || typeof v !== "object") return []; const o = v as Record<string, unknown>; const rows: any[] = []; Object.values(o).forEach((x) => { if (Array.isArray(x)) rows.push(...x); }); if (o.id || o.title || o.name || o.subject || o.message || o.propertyName) rows.push(o); return rows; }
function ignoreKey(key: string) { const k = key.toLowerCase(); return k.includes("activity") || k.includes("history") || k.includes("viewed") || k.includes("audit") || k.includes("log") || k.includes("analytics") || k.includes("deleted_forever") || k.includes("draft"); }
function usefulKey(key: string) { const k = key.toLowerCase(); if (ignoreKey(k)) return false; return k.includes("room") || k.includes("deal") || k.includes("pain") || k.includes("project") || k.includes("property") || k.includes("message") || k.includes("request") || k.includes("clean"); }
function folderFrom(item: any): Folder { const raw = String(item?.investorFolder || item?.folder || item?.status || item?.roomStatus || item?.workspaceStatus || "active").toLowerCase(); if (raw.includes("delete") || raw.includes("trash")) return "deleted"; if (raw.includes("archive")) return "archived"; if (raw.includes("save")) return "saved"; return "active"; }
function kindFrom(key: string, item: any): Kind { const text = `${key} ${JSON.stringify(item || {})}`.toLowerCase(); if (text.includes("pain") || text.includes("problem") || text.includes("distress") || text.includes("pressure") || text.includes("funding gap") || text.includes("foreclosure")) return "pain"; if (text.includes("owner") && (text.includes("reply") || text.includes("message"))) return "owner"; if (text.includes("message") || text.includes("thread") || text.includes("reply")) return "message"; return "deal"; }
function titleFor(item: any, kind: Kind) { return clean(item?.title || item?.name || item?.projectName || item?.propertyName || item?.dealTitle || item?.painTitle || item?.subject || (kind === "pain" ? "Pain Signal" : kind === "deal" ? "Deal Signal" : kind === "owner" ? "Owner Reply" : "Message Request")); }
function bodyFor(item: any, kind: Kind) { return clean(item?.message || item?.summary || item?.notes || item?.description || item?.body || item?.need || item?.problem || (kind === "pain" ? "Member submitted a problem/pain signal for investor review." : kind === "deal" ? "Member submitted a deal opportunity signal for investor review." : "Request thread connected to this investor lane.")); }
function stateFor(item: any) { return clean(item?.state || item?.propertyState || item?.marketState || item?.market || "NA", "NA"); }
function canonical(kind: Kind, item: any, index: number, key: string) { const id = clean(item?.id || item?.roomId || item?.slug || item?.threadId || "", ""); if (id) return `${kind}:${id}`; const title = titleFor(item, kind).toLowerCase().replace(/\s+/g, "-"); const state = stateFor(item).toLowerCase().replace(/\s+/g, "-"); const msg = kind === "message" || kind === "owner" ? index : "room"; return `${kind}:${title}:${state}:${msg}`; }
function foreverIds() { if (typeof window === "undefined") return []; return parse<string[]>(window.localStorage.getItem(FOREVER), []); }
function saveForever(ids: string[]) { window.localStorage.setItem(FOREVER, JSON.stringify(Array.from(new Set(ids)))); }

function loadItems(): Item[] {
  if (typeof window === "undefined") return [];
  const deleted = new Set(foreverIds());
  const map = new Map<string, Item>();
  const saved = parse<Item[]>(window.localStorage.getItem(STORE), []);
  saved.forEach((x) => { if (!deleted.has(x.id)) map.set(x.id, x); });
  const keys = new Set<string>(["vaultforge_rooms_v1", "vaultforge_deal_rooms_v1", "vaultforge_pain_rooms_v1", "vaultforge_clean_deal_rooms", "vaultforge_clean_pain_rooms", "vaultforge_member_rooms_v1", "vaultforge_property_cards_v1", "vaultforge_projects_v1", "vaultforge_deals_v1", "vaultforge_pain_requests_v1", "vaultforge_my_rooms_clean_v2", "vaultforge_command_rooms_v1", "vaultforge_investor_requests_v1", "vaultforge_member_requests_v1", "vaultforge_message_threads_v1", "vaultforge_owner_messages_v1"]);
  for (let i = 0; i < window.localStorage.length; i += 1) { const k = window.localStorage.key(i) || ""; if (usefulKey(k)) keys.add(k); }
  Array.from(keys).forEach((key) => {
    if (ignoreKey(key)) return;
    collect(parse<any>(window.localStorage.getItem(key), null)).forEach((item, index) => {
      if (!item || typeof item !== "object") return;
      const text = `${key} ${JSON.stringify(item)}`.toLowerCase();
      if (text.includes("room opened") || text.includes("status change") || text.includes("viewed room")) return;
      if (!(text.includes("deal") || text.includes("room") || text.includes("pain") || text.includes("project") || text.includes("property") || text.includes("message") || text.includes("request") || text.includes("investor"))) return;
      const kind = kindFrom(key, item);
      const id = canonical(kind, item, index, key);
      if (deleted.has(id)) return;
      const existing = map.get(id);
      const record: Item = { id, kind, folder: existing?.folder || folderFrom(item), title: titleFor(item, kind), body: bodyFor(item, kind), state: stateFor(item), status: clean(item?.status || item?.folder || "active", "active"), source: key };
      map.set(id, { ...record, folder: existing?.folder || record.folder });
    });
  });
  return Array.from(map.values()).sort((a, b) => a.kind.localeCompare(b.kind) || a.title.localeCompare(b.title));
}
function saveItems(items: Item[]) { if (typeof window !== "undefined") window.localStorage.setItem(STORE, JSON.stringify(items)); }

function Tile({ title, count, note, active, onClick }: { title: string; count: number; note: string; active: boolean; onClick: () => void }) { return <button type="button" onClick={onClick} style={{ ...panel, minHeight: 150, textAlign: "left", cursor: "pointer", borderColor: active ? "rgba(245,197,66,.7)" : "rgba(207,216,230,.15)" }}><div style={eyebrow}>{title}</div><h2 style={{ ...h2, color: count ? "#1e90ff" : "#8f99aa" }}>{count}</h2><p style={muted}>{note}</p><p style={{ ...muted, color: "#ffd45a", fontWeight: 950 }}>Tap to open</p></button>; }
function Signal({ item, move, removeForever }: { item: Item; move: (id: string, folder: Folder) => void; removeForever: (id: string) => void }) { return <article style={{ ...panel, borderColor: item.folder === "deleted" ? "rgba(255,65,65,.55)" : "rgba(245,197,66,.35)" }}><div style={eyebrow}>{item.kind} • {item.state} • {item.folder}</div><h3 style={h3}>{item.title}</h3><p style={muted}>{item.body}</p><p style={muted}>Source: {item.source}</p><div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 14 }}><button type="button" style={goldBtn} onClick={() => move(item.id, "active")}>Active</button><button type="button" style={btn} onClick={() => move(item.id, "saved")}>Save</button><button type="button" style={btn} onClick={() => move(item.id, "archived")}>Archive</button><button type="button" style={redBtn} onClick={() => move(item.id, "deleted")}>Delete</button>{item.folder === "deleted" ? <button type="button" style={redBtn} onClick={() => removeForever(item.id)}>Delete Forever</button> : null}</div></article>; }

export default function InvestorRoomPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [lane, setLane] = useState<Lane>("deals");
  useEffect(() => { const loaded = loadItems(); setItems(loaded); saveItems(loaded); }, []);
  const grouped = useMemo(() => ({
    deals: items.filter((i) => i.kind === "deal" && i.folder === "active"),
    pain: items.filter((i) => i.kind === "pain" && i.folder === "active"),
    messages: items.filter((i) => i.kind === "message" && i.folder === "active"),
    owner: items.filter((i) => i.kind === "owner" && i.folder === "active"),
    saved: items.filter((i) => i.folder === "saved"),
    archived: items.filter((i) => i.folder === "archived"),
    deleted: items.filter((i) => i.folder === "deleted"),
  }), [items]);
  const visible = grouped[lane];
  function move(id: string, folder: Folder) { const next = items.map((i) => i.id === id ? { ...i, folder } : i); setItems(next); saveItems(next); setLane(folder === "active" ? (items.find((i) => i.id === id)?.kind === "pain" ? "pain" : "deals") : folder); }
  function removeForever(id: string) { saveForever([...foreverIds(), id]); const next = items.filter((i) => i.id !== id); setItems(next); saveItems(next); setLane("deleted"); }
  return <main style={wrap}><div style={shell}><section style={card}><div style={eyebrow}>Investor Alerts • {grouped.deals.length + grouped.pain.length + grouped.messages.length + grouped.owner.length} Active</div><div style={{ ...grid, marginTop: 16 }}><Tile title="Deals" count={grouped.deals.length} note="deal opportunity cards" active={lane === "deals"} onClick={() => setLane("deals")} /><Tile title="Pain" count={grouped.pain.length} note="problem/pain signals" active={lane === "pain"} onClick={() => setLane("pain")} /><Tile title="Messages" count={grouped.messages.length} note="owner/member/investor requests" active={lane === "messages"} onClick={() => setLane("messages")} /><Tile title="Owner Replies" count={grouped.owner.length} note="owner replies to requests" active={lane === "owner"} onClick={() => setLane("owner")} /></div></section><nav style={nav}><div style={brand}>VAULTFORGE</div><Link href="/" style={btn}>Home</Link><Link href="/investor-room" style={goldBtn}>Investor Access</Link><Link href="/payment" style={btn}>Payment</Link><Link href="/messages" style={goldBtn}>Message Owner</Link><Link href="/logout" style={btn}>Logout</Link><Link href="/admin" style={redBtn}>Owner</Link></nav><section style={goldCard}><div style={eyebrow}>VaultForge Investor Command Room</div><h1 style={h1}>Signals → Requests → Threads → Execution.</h1><p style={sub}>Start with Deal/Pain signals, request controlled information, track replies, then request execution help from the private member network.</p><div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 18 }}><button type="button" onClick={() => setLane("deals")} style={goldBtn}>Open Deal Signals</button><button type="button" onClick={() => setLane("pain")} style={btn}>Open Pain Signals</button><Link href="/messages" style={goldBtn}>Message Owner</Link></div></section><section style={card}><div style={eyebrow}>Cleanup Folders</div><div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 12 }}><button type="button" style={lane === "saved" ? goldBtn : btn} onClick={() => setLane("saved")}>Saved ({grouped.saved.length})</button><button type="button" style={lane === "archived" ? goldBtn : btn} onClick={() => setLane("archived")}>Archived ({grouped.archived.length})</button><button type="button" style={lane === "deleted" ? goldBtn : btn} onClick={() => setLane("deleted")}>Deleted ({grouped.deleted.length})</button></div></section><section style={card}><div style={eyebrow}>{lane}</div><h2 style={h2}>{visible.length ? "Signal Feed" : "No cards in this lane."}</h2>{visible.length ? <div style={roomGrid}>{visible.map((item) => <Signal key={item.id} item={item} move={move} removeForever={removeForever} />)}</div> : <p style={sub}>Create a member Deal or Pain room and it will appear in the correct top alert lane.</p>}</section></div></main>;
}
