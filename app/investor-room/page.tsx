"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Lane = "deals" | "pain" | "saved" | "archived" | "deleted";
type Status = "active" | "saved" | "archived" | "deleted";
type Kind = "deal" | "pain";

type InvestorCard = {
  id: string;
  kind: Kind;
  title: string;
  status: Status;
  city: string;
  county: string;
  state: string;
  summary: string;
  source: string;
  ownerName: string;
  ownerEmail: string;
  raw: Record<string, any>;
};

const STATUS_KEY = "vf_investor_room_status_v3";
const DELETED_FOREVER_KEY = "vf_investor_deleted_forever_v3";
const OWNER_NAME = "VaultForge Owner";
const OWNER_EMAIL = "bcrsoutheast@gmail.com";

const BLOCKED_KEY_PARTS = [
  "activity",
  "history",
  "analytics",
  "viewed",
  "audit",
  "log",
  "deleted_forever",
  "message",
  "thread",
  "profile",
  "directory",
  "approval",
  "admin",
  "status_v3",
  "mock",
  "session",
  "cookie",
];

const STRONG_ROOM_KEYS = [
  "vaultforge_command_rooms_v1",
  "vaultforge_rooms_v1",
  "vaultforge_deal_rooms_v1",
  "vaultforge_pain_rooms_v1",
  "vaultforge_member_rooms_v1",
  "vaultforge_property_cards_v1",
  "vaultforge_projects_v1",
  "vaultforge_deals_v1",
  "vaultforge_pain_requests_v1",
  "vaultforge_my_rooms_clean_v2",
  "vf_deals",
  "vf_pain",
  "vf_rooms",
  "vf_projects",
  "vf_property_cards",
];

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at 18% 10%, rgba(245,197,66,.12), transparent 32%), radial-gradient(circle at 86% 8%, rgba(120,0,30,.18), transparent 34%), #05070b",
  color: "#f7f8ff",
  padding: "28px 20px 90px",
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
};

const shell: React.CSSProperties = { maxWidth: 1180, margin: "0 auto" };
const nav: React.CSSProperties = { display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", marginBottom: 20 };
const button: React.CSSProperties = { border: "1px solid rgba(207,216,230,.18)", background: "rgba(18,24,38,.92)", color: "#f7f8ff", borderRadius: 999, padding: "12px 18px", fontWeight: 900, textDecoration: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" };
const goldButton: React.CSSProperties = { ...button, background: "linear-gradient(135deg,#ffe16a,#f4bf37)", color: "#080a10", border: "1px solid rgba(255,220,90,.65)" };
const redButton: React.CSSProperties = { ...button, background: "rgba(90,10,18,.72)", color: "#ffb2b2", border: "1px solid rgba(255,65,65,.65)" };
const card: React.CSSProperties = { border: "1px solid rgba(207,216,230,.16)", borderRadius: 26, background: "rgba(15,21,34,.88)", padding: 24, marginBottom: 20 };
const goldCard: React.CSSProperties = { ...card, borderColor: "rgba(245,197,66,.42)", background: "linear-gradient(135deg,rgba(22,25,37,.96),rgba(33,31,20,.82))" };
const tile: React.CSSProperties = { border: "1px solid rgba(245,197,66,.35)", borderRadius: 22, background: "rgba(17,23,36,.78)", padding: 20, color: "#f7f8ff", textAlign: "left", cursor: "pointer" };
const grid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 14 };
const feedGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 14 };
const row: React.CSSProperties = { display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" };
const brand: React.CSSProperties = { color: "#ffda5e", fontWeight: 1000, fontSize: 28, letterSpacing: "-.04em" };
const eyebrow: React.CSSProperties = { color: "#ffda5e", textTransform: "uppercase", letterSpacing: ".34em", fontSize: 12, fontWeight: 1000 };
const h1: React.CSSProperties = { fontSize: "clamp(42px,7vw,82px)", lineHeight: ".92", letterSpacing: "-.08em", margin: "12px 0", fontWeight: 1000 };
const h2: React.CSSProperties = { fontSize: "clamp(30px,4.5vw,54px)", lineHeight: ".95", letterSpacing: "-.065em", margin: "10px 0", fontWeight: 1000 };
const h3: React.CSSProperties = { fontSize: 28, lineHeight: 1, letterSpacing: "-.05em", margin: "8px 0", fontWeight: 1000 };
const sub: React.CSSProperties = { color: "rgba(235,240,255,.78)", fontSize: 20, lineHeight: 1.45, margin: "8px 0" };
const muted: React.CSSProperties = { color: "rgba(235,240,255,.68)", fontSize: 15, lineHeight: 1.45, margin: "6px 0" };

function parse(raw: string | null): any {
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

function clean(value: unknown, fallback = "") {
  const text = String(value || "").replace(/\\n/g, " ").replace(/\s+/g, " ").trim();
  return text || fallback;
}

function isBadText(value: string) {
  const text = clean(value).toLowerCase();
  return !text || text === "na" || text === "n/a" || text === "not listed" || text === "untitled" || text === "untitled room" || text === "undefined" || text === "null";
}

function getStatus(item: any): Status {
  const raw = clean(item?.investorStatus || item?.workspaceStatus || item?.roomStatus || item?.folder || item?.status || "active", "active").toLowerCase();
  if (raw.includes("delete") || raw.includes("trash")) return "deleted";
  if (raw.includes("archive")) return "archived";
  if (raw.includes("save")) return "saved";
  return "active";
}

function collectRows(data: any): any[] {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== "object") return [];
  const rows: any[] = [];
  Object.values(data).forEach((value) => { if (Array.isArray(value)) rows.push(...value); });
  if (data.id || data.roomId || data.title || data.name || data.projectName || data.propertyName || data.painTitle || data.dealTitle || data.address || data.city || data.state || data.message || data.summary) rows.push(data);
  return rows;
}

function isBlockedKey(key: string) {
  const lower = key.toLowerCase();
  return BLOCKED_KEY_PARTS.some((part) => lower.includes(part));
}

function shouldReadKey(key: string) {
  const lower = key.toLowerCase();
  if (isBlockedKey(lower)) return false;
  return STRONG_ROOM_KEYS.some((strong) => lower === strong || lower.includes(strong)) || lower.includes("deal") || lower.includes("pain") || lower.includes("project") || lower.includes("property") || lower.includes("room");
}

function kindFrom(source: string, item: any): Kind {
  const blob = `${source} ${JSON.stringify(item || {})}`.toLowerCase();
  if (blob.includes("pain") || blob.includes("problem") || blob.includes("distress") || blob.includes("foreclosure") || blob.includes("funding gap") || blob.includes("pressure")) return "pain";
  return "deal";
}

function titleFrom(item: any, kind: Kind) {
  return clean(item?.title || item?.propertyName || item?.projectName || item?.dealTitle || item?.painTitle || item?.name || item?.subject || item?.address || item?.propertyAddress || "") || (kind === "pain" ? "Pain Signal" : "Deal Opportunity");
}

function summaryFrom(item: any, kind: Kind) {
  return clean(item?.summary || item?.message || item?.notes || item?.description || item?.body || item?.need || item?.problem || item?.aiSummary || item?.details || "") || (kind === "pain" ? "Pain/problem submitted for investor review." : "Deal opportunity submitted for investor review.");
}

function firstOwnerName(item: any) {
  return clean(item?.ownerName || item?.submittedByName || item?.memberName || item?.sellerName || item?.contactName || item?.name || OWNER_NAME, OWNER_NAME);
}

function firstOwnerEmail(item: any) {
  return clean(item?.ownerEmail || item?.submittedByEmail || item?.memberEmail || item?.sellerEmail || item?.contactEmail || item?.email || OWNER_EMAIL, OWNER_EMAIL);
}

function stableId(source: string, item: any, kind: Kind, index: number) {
  const directId = clean(item?.id || item?.roomId || item?.slug || item?.uuid || item?.dealId || item?.painId || "");
  if (directId) return `${kind}:${directId}`;
  const title = titleFrom(item, kind).toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const state = clean(item?.state || item?.propertyState || item?.marketState || "na").toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return `${kind}:${title}:${state}:${source}:${index}`;
}

function hasRealLocation(item: any) {
  const city = clean(item?.city || item?.propertyCity || item?.marketCity || item?.basedCity || "");
  const state = clean(item?.state || item?.propertyState || item?.marketState || item?.market || item?.basedState || "");
  const county = clean(item?.county || item?.propertyCounty || item?.marketCounty || "");
  return Boolean(!isBadText(city) || !isBadText(state) || !isBadText(county));
}

function hasRealCardData(item: any, source: string, kind: Kind) {
  if (!item || typeof item !== "object") return false;
  if (isBlockedKey(source)) return false;

  const blob = `${source} ${JSON.stringify(item)}`.toLowerCase();
  if (blob.includes("room opened") || blob.includes("viewed room") || blob.includes("status change") || blob.includes("open details") || blob.includes("tap to open")) return false;

  const title = titleFrom(item, kind);
  const summary = summaryFrom(item, kind);
  const strongTitle = !isBadText(title) && title !== "Deal Opportunity" && title !== "Pain Signal";
  const strongSummary = !summary.toLowerCase().includes("review numbers, photos, routing, and next action") && !summary.toLowerCase().includes("submitted for investor review");
  const strongFields = Boolean(item.address || item.propertyAddress || item.arv || item.asking || item.price || item.beds || item.baths || item.assetType || item.propertyType || item.problemType || item.urgency || item.timeline || item.photos || item.photoUrls);

  return Boolean((strongTitle && (hasRealLocation(item) || strongSummary || strongFields)) || (hasRealLocation(item) && (strongSummary || strongFields)));
}

function loadCards(): InvestorCard[] {
  if (typeof window === "undefined") return [];
  const overrides = parse(window.localStorage.getItem(STATUS_KEY)) || {};
  const forever = new Set<string>(parse(window.localStorage.getItem(DELETED_FOREVER_KEY)) || []);
  const keys = new Set<string>();

  STRONG_ROOM_KEYS.forEach((key) => keys.add(key));
  for (let i = 0; i < window.localStorage.length; i += 1) {
    const key = window.localStorage.key(i) || "";
    if (shouldReadKey(key)) keys.add(key);
  }

  const map = new Map<string, InvestorCard>();
  Array.from(keys).forEach((source) => {
    const data = parse(window.localStorage.getItem(source));
    collectRows(data).forEach((item, index) => {
      const kind = kindFrom(source, item);
      if (!hasRealCardData(item, source, kind)) return;

      const id = stableId(source, item, kind, index);
      if (forever.has(id)) return;

      const city = clean(item?.city || item?.propertyCity || item?.marketCity || "");
      const county = clean(item?.county || item?.propertyCounty || item?.marketCounty || "");
      const state = clean(item?.state || item?.propertyState || item?.marketState || item?.market || "");

      const card: InvestorCard = {
        id,
        kind,
        title: titleFrom(item, kind),
        status: overrides[id] || getStatus(item),
        city,
        county,
        state,
        summary: summaryFrom(item, kind),
        source,
        ownerName: firstOwnerName(item),
        ownerEmail: firstOwnerEmail(item),
        raw: item,
      };

      const old = map.get(id);
      if (!old || JSON.stringify(old.raw).length < JSON.stringify(card.raw).length) map.set(id, card);
    });
  });

  return Array.from(map.values()).sort((a, b) => {
    if (a.kind !== b.kind) return a.kind.localeCompare(b.kind);
    return a.title.localeCompare(b.title);
  });
}

function saveStatus(id: string, status: Status) {
  const overrides = parse(window.localStorage.getItem(STATUS_KEY)) || {};
  overrides[id] = status;
  window.localStorage.setItem(STATUS_KEY, JSON.stringify(overrides));
}

function saveDeletedForever(id: string) {
  const current = parse(window.localStorage.getItem(DELETED_FOREVER_KEY)) || [];
  window.localStorage.setItem(DELETED_FOREVER_KEY, JSON.stringify(Array.from(new Set([...current, id]))));
}

function messageHref(card?: InvestorCard | null) {
  if (!card) return "/messages";
  const params = new URLSearchParams();
  params.set("kind", card.kind);
  params.set("room", card.title);
  params.set("title", card.title);
  params.set("recipient", card.ownerEmail || card.ownerName || OWNER_EMAIL);
  params.set("owner", card.ownerName || OWNER_NAME);
  params.set("roomId", card.id);
  return `/messages?${params.toString()}`;
}

function StatCard({ label, count, help, active, onClick }: { label: string; count: number; help: string; active: boolean; onClick: () => void }) {
  return <button type="button" onClick={onClick} style={{ ...tile, borderColor: active ? "rgba(245,197,66,.75)" : "rgba(245,197,66,.35)" }}><div style={eyebrow}>{label}</div><div style={{ color: "#1e90ff", fontSize: 44, fontWeight: 1000, margin: "8px 0" }}>{count}</div><p style={muted}>{help}</p><p style={{ ...muted, color: "#ffda5e", fontWeight: 950 }}>Tap to open</p></button>;
}

function InfoLine({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return <p style={muted}><strong style={{ color: "#f7f8ff" }}>{label}:</strong> {value}</p>;
}

export default function InvestorRoomPage() {
  const [cards, setCards] = useState<InvestorCard[]>([]);
  const [lane, setLane] = useState<Lane>("deals");
  const [selected, setSelected] = useState<InvestorCard | null>(null);

  useEffect(() => { setCards(loadCards()); }, []);

  const grouped = useMemo(() => ({
    deals: cards.filter((card) => card.kind === "deal" && card.status === "active"),
    pain: cards.filter((card) => card.kind === "pain" && card.status === "active"),
    saved: cards.filter((card) => card.status === "saved"),
    archived: cards.filter((card) => card.status === "archived"),
    deleted: cards.filter((card) => card.status === "deleted"),
  }), [cards]);

  const visible = grouped[lane];

  function refreshCards() { setCards(loadCards()); setSelected(null); }

  function moveCard(id: string, status: Status) {
    saveStatus(id, status);

    const foundCard = cards.find((card) => card.id === id);
    const nextLane: Lane = status === "active" ? (foundCard?.kind === "pain" ? "pain" : "deals") : status;

    setCards((current) =>
      current.map((card) => (card.id === id ? { ...card, status } : card))
    );

    setSelected((current) => (current && current.id === id ? { ...current, status } : current));
    setLane(nextLane);
  }

  function deleteForever(id: string) {
    saveDeletedForever(id);
    setCards((current) => current.filter((card) => card.id !== id));
    setSelected(null);
    setLane("deleted");
  }

  return (
    <main style={page}>
      <div style={shell}>
        <nav style={nav}>
          <div style={brand}>VAULTFORGE</div>
          <Link href="/" style={button}>Home</Link>
          <Link href="/investor-room" style={goldButton}>Investor Room</Link>
          <Link href="/messages" style={button}>Messages</Link>
        </nav>

        <section style={card}>
          <div style={eyebrow}>Investor Alerts</div>
          <div style={{ ...grid, marginTop: 16 }}>
            <StatCard label="Deals" count={grouped.deals.length} help="active deal opportunities" active={lane === "deals"} onClick={() => setLane("deals")} />
            <StatCard label="Pain" count={grouped.pain.length} help="active pain/problem cards" active={lane === "pain"} onClick={() => setLane("pain")} />
            <StatCard label="Saved" count={grouped.saved.length} help="saved deal and pain cards" active={lane === "saved"} onClick={() => setLane("saved")} />
            <StatCard label="Archived" count={grouped.archived.length} help="hidden but preserved cards" active={lane === "archived"} onClick={() => setLane("archived")} />
            <StatCard label="Deleted" count={grouped.deleted.length} help="restore or delete forever" active={lane === "deleted"} onClick={() => setLane("deleted")} />
          </div>
        </section>

        <section style={goldCard}>
          <div style={eyebrow}>VaultForge Investor Command Room</div>
          <h1 style={h1}>Signals → Requests → Threads → Execution.</h1>
          <p style={sub}>Deal and Pain cards are now filtered to real room records only. Empty Untitled Room / NA placeholder rows are suppressed.</p>
          <div style={{ ...row, marginTop: 18 }}>
            <button type="button" style={goldButton} onClick={() => setLane("deals")}>Open Deal Signals</button>
            <button type="button" style={button} onClick={() => setLane("pain")}>Open Pain Signals</button>
            <button type="button" style={button} onClick={refreshCards}>Refresh Cards</button>
            <Link href={messageHref(selected)} style={goldButton}>Message Owner</Link>
          </div>
        </section>

        {selected ? (
          <section style={card}>
            <div style={eyebrow}>{selected.kind} detail • {selected.status}</div>
            <h2 style={h2}>{selected.title}</h2>
            <p style={sub}>{[selected.city, selected.county, selected.state].filter(Boolean).join(", ") || "Location not listed"}</p>
            <p style={sub}>{selected.summary}</p>

            <div style={{ ...feedGrid, marginTop: 14 }}>
              <div style={tile}>
                <div style={eyebrow}>Location</div>
                <InfoLine label="City" value={selected.city} />
                <InfoLine label="County" value={selected.county} />
                <InfoLine label="State" value={selected.state} />
              </div>
              <div style={tile}>
                <div style={eyebrow}>Owner / Source</div>
                <InfoLine label="Owner" value={selected.ownerName} />
                <InfoLine label="Email" value={selected.ownerEmail} />
                <InfoLine label="Storage" value={selected.source} />
                <InfoLine label="Kind" value={selected.kind} />
                <InfoLine label="Status" value={selected.status} />
              </div>
            </div>

            <details style={{ marginTop: 16 }}>
              <summary style={{ ...muted, color: "#ffda5e", cursor: "pointer", fontWeight: 900 }}>Show full stored card data</summary>
              <pre style={{ whiteSpace: "pre-wrap", overflowX: "auto", background: "rgba(0,0,0,.35)", border: "1px solid rgba(207,216,230,.14)", borderRadius: 16, padding: 16, marginTop: 12, color: "rgba(235,240,255,.82)", fontSize: 12 }}>{JSON.stringify(selected.raw, null, 2)}</pre>
            </details>

            <div style={{ ...row, marginTop: 18 }}>
              <button type="button" style={goldButton} onClick={() => moveCard(selected.id, "active")}>Active / Restore</button>
              <button type="button" style={button} onClick={() => moveCard(selected.id, "saved")}>Save</button>
              <button type="button" style={button} onClick={() => moveCard(selected.id, "archived")}>Archive</button>
              <button type="button" style={redButton} onClick={() => moveCard(selected.id, "deleted")}>Delete</button>
              {selected.status === "deleted" ? <button type="button" style={redButton} onClick={() => deleteForever(selected.id)}>Delete Forever</button> : null}
              <Link href={messageHref(selected)} style={goldButton}>Message Owner</Link>
              <button type="button" style={button} onClick={() => setSelected(null)}>Close</button>
            </div>
          </section>
        ) : null}

        <section style={card}>
          <div style={eyebrow}>{lane}</div>
          <h2 style={h2}>{lane === "deals" ? "Deal Opportunity Cards" : lane === "pain" ? "Pain Intake Cards" : `${lane.charAt(0).toUpperCase()}${lane.slice(1)} Cards`}</h2>

          {visible.length ? (
            <div style={feedGrid}>
              {visible.map((item) => (
                <button type="button" key={item.id} onClick={() => setSelected(item)} style={{ ...tile, minHeight: 230, borderColor: item.status === "deleted" ? "rgba(255,65,65,.58)" : "rgba(245,197,66,.38)" }}>
                  <div style={eyebrow}>{item.kind} • {item.state || "State not listed"} • {item.status}</div>
                  <h3 style={{ ...h3, color: "#1e90ff" }}>{item.title}</h3>
                  <p style={muted}>{[item.city, item.county, item.state].filter(Boolean).join(", ") || "Location not listed"}</p>
                  <p style={muted}>{item.summary}</p>
                  <p style={{ ...muted, color: "#ffda5e", fontWeight: 950 }}>Open Details</p>
                </button>
              ))}
            </div>
          ) : (
            <div style={tile}>
              <h3 style={h3}>No real cards in this folder.</h3>
              <p style={sub}>Empty placeholder rows are now hidden. Create or submit a real Deal/Pain room with title and location/details and it will show here.</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
