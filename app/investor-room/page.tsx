"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Lane = "deals" | "pain" | "saved" | "archived" | "deleted";
type Status = "active" | "saved" | "archived" | "deleted";
type Kind = "deal" | "pain";

type CanonicalInvestorRoom = {
  id: string;
  roomId: string;
  kind: Kind;
  roomType: Kind;
  workspace: "investor";
  visibility: "investor";
  title: string;
  status: Status;
  investorStatus: Status;
  city: string;
  county: string;
  state: string;
  address: string;
  assetClass: string;
  propertyType: string;
  strategy: string[];
  routeTo: string[];
  askingPrice: string;
  propertyValue: string;
  repairs: string;
  summary: string;
  analyzer: string;
  notes: string;
  ownerName: string;
  ownerEmail: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  photoUrl: string;
  imageUrl: string;
  coverPhoto: string;
  photos: string[];
  source: string;
  createdAt: string;
  updatedAt: string;
  raw: Record<string, any>;
};

const INVESTOR_DEAL_ROOMS_KEY = "vaultforge_investor_deal_rooms_v1";
const INVESTOR_PAIN_ROOMS_KEY = "vaultforge_investor_pain_rooms_v1";
const STATUS_KEY = "vf_investor_room_status_v4";
const DELETED_FOREVER_KEY = "vf_investor_deleted_forever_v4";

const OWNER_NAME = "VaultForge Owner";
const OWNER_EMAIL = "bcrsoutheast@gmail.com";

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
const brand: React.CSSProperties = { color: "#ffda5e", fontWeight: 1000, fontSize: 28, letterSpacing: "-.04em" };
const button: React.CSSProperties = { border: "1px solid rgba(207,216,230,.18)", background: "rgba(18,24,38,.92)", color: "#f7f8ff", borderRadius: 999, padding: "12px 18px", fontWeight: 900, textDecoration: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" };
const goldButton: React.CSSProperties = { ...button, background: "linear-gradient(135deg,#ffe16a,#f4bf37)", color: "#080a10", border: "1px solid rgba(255,220,90,.65)" };
const redButton: React.CSSProperties = { ...button, background: "rgba(90,10,18,.72)", color: "#ffb2b2", border: "1px solid rgba(255,65,65,.65)" };
const card: React.CSSProperties = { border: "1px solid rgba(207,216,230,.16)", borderRadius: 26, background: "rgba(15,21,34,.88)", padding: 24, marginBottom: 20 };
const goldCard: React.CSSProperties = { ...card, borderColor: "rgba(245,197,66,.42)", background: "linear-gradient(135deg,rgba(22,25,37,.96),rgba(33,31,20,.82))" };
const tile: React.CSSProperties = { border: "1px solid rgba(245,197,66,.35)", borderRadius: 22, background: "rgba(17,23,36,.78)", padding: 20, color: "#f7f8ff", textAlign: "left" };
const grid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 14 };
const feedGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 14 };
const row: React.CSSProperties = { display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" };
const eyebrow: React.CSSProperties = { color: "#ffda5e", textTransform: "uppercase", letterSpacing: ".34em", fontSize: 12, fontWeight: 1000 };
const h1: React.CSSProperties = { fontSize: "clamp(42px,7vw,82px)", lineHeight: ".92", letterSpacing: "-.08em", margin: "12px 0", fontWeight: 1000 };
const h2: React.CSSProperties = { fontSize: "clamp(30px,4.5vw,54px)", lineHeight: ".95", letterSpacing: "-.065em", margin: "10px 0", fontWeight: 1000 };
const h3: React.CSSProperties = { fontSize: 28, lineHeight: 1, letterSpacing: "-.05em", margin: "8px 0", fontWeight: 1000 };
const sub: React.CSSProperties = { color: "rgba(235,240,255,.78)", fontSize: 20, lineHeight: 1.45, margin: "8px 0" };
const muted: React.CSSProperties = { color: "rgba(235,240,255,.68)", fontSize: 15, lineHeight: 1.45, margin: "6px 0" };
const imageStyle: React.CSSProperties = { width: "100%", height: 185, objectFit: "cover", borderRadius: 18, border: "1px solid rgba(245,197,66,.22)", marginBottom: 12, background: "rgba(0,0,0,.35)" };

function parseJson<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function clean(value: unknown, fallback = "") {
  const text = String(value || "")
    .replace(/\\n/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return text || fallback;
}

function cleanLower(value: unknown) {
  return clean(value).toLowerCase();
}

function isBadText(value: unknown) {
  const text = cleanLower(value);
  return !text || text === "na" || text === "n/a" || text === "not listed" || text === "untitled" || text === "untitled room" || text === "undefined" || text === "null";
}

function list(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => clean(item)).filter(Boolean);
  if (typeof value === "string" && value.trim()) return value.split(",").map((item) => item.trim()).filter(Boolean);
  return [];
}

function readStatusOverrides(): Record<string, Status> {
  if (typeof window === "undefined") return {};
  return parseJson<Record<string, Status>>(window.localStorage.getItem(STATUS_KEY), {});
}

function writeStatusOverride(id: string, status: Status) {
  if (typeof window === "undefined") return;
  const current = readStatusOverrides();
  current[id] = status;
  window.localStorage.setItem(STATUS_KEY, JSON.stringify(current));
}

function deletedForeverIds(): string[] {
  if (typeof window === "undefined") return [];
  return parseJson<string[]>(window.localStorage.getItem(DELETED_FOREVER_KEY), []);
}

function writeDeletedForever(id: string) {
  if (typeof window === "undefined") return;
  const next = Array.from(new Set([...deletedForeverIds(), id]));
  window.localStorage.setItem(DELETED_FOREVER_KEY, JSON.stringify(next));
}

function statusFrom(row: any): Status {
  const raw = cleanLower(row?.investorStatus || row?.status || row?.folder || "active");
  if (raw.includes("delete") || raw.includes("trash")) return "deleted";
  if (raw.includes("archive")) return "archived";
  if (raw.includes("save")) return "saved";
  return "active";
}

function isValidInvestorRoom(row: any, kind: Kind) {
  if (!row || typeof row !== "object") return false;

  const id = clean(row.id || row.roomId);
  const title = clean(row.title || row.dealTitle || row.painTitle || row.propertyName || row.address);
  const city = clean(row.city || row.propertyCity || row.marketCity);
  const state = clean(row.state || row.propertyState || row.marketState);
  const summary = clean(row.summary || row.analyzer || row.notes || row.message || row.problem || row.description);
  const hasMoney = Boolean(clean(row.askingPrice || row.asking || row.price || row.propertyValue || row.arv));
  const hasAsset = Boolean(clean(row.assetClass || row.asset || row.propertyType || row.problemType));
  const hasOwner = Boolean(clean(row.ownerEmail || row.createdByEmail || row.contactEmail || row.ownerName || row.contactName));
  const correctWorkspace =
    cleanLower(row.workspace) === "investor" ||
    cleanLower(row.visibility) === "investor" ||
    cleanLower(row.source) === "deal-create" ||
    cleanLower(row.source) === "pain-intake" ||
    cleanLower(row.kind) === kind ||
    cleanLower(row.roomType) === kind;

  if (!id) return false;
  if (isBadText(title)) return false;
  if (!correctWorkspace) return false;
  if (!hasOwner) return false;
  if (kind === "deal" && !hasMoney && !hasAsset && !summary) return false;
  if (kind === "pain" && !summary && !hasAsset) return false;
  if (isBadText(city) && isBadText(state) && !summary) return false;

  return true;
}

function normalizeRoom(row: any, kind: Kind, overrides: Record<string, Status>): CanonicalInvestorRoom | null {
  const id = clean(row.id || row.roomId);
  const title = clean(row.title || row.dealTitle || row.painTitle || row.propertyName || row.address);
  if (!id || isBadText(title)) return null;

  const photos = list(row.photos || row.photoUrls);
  const status = overrides[id] || statusFrom(row);
  const ownerEmail = clean(row.ownerEmail || row.createdByEmail || row.contactEmail || row.submittedByEmail || OWNER_EMAIL, OWNER_EMAIL);
  const ownerName = clean(row.ownerName || row.contactName || row.submittedByName || "VaultForge Member", "VaultForge Member");

  return {
    id,
    roomId: id,
    kind,
    roomType: kind,
    workspace: "investor",
    visibility: "investor",
    title,
    status,
    investorStatus: status,
    city: clean(row.city || row.propertyCity || row.marketCity),
    county: clean(row.county || row.propertyCounty || row.marketCounty),
    state: clean(row.state || row.propertyState || row.marketState),
    address: clean(row.address || row.propertyAddress || row.location),
    assetClass: clean(row.assetClass || row.asset || row.assetType || row.problemType),
    propertyType: clean(row.propertyType || row.category),
    strategy: list(row.strategy || row.strategies),
    routeTo: list(row.routeTo || row.routes),
    askingPrice: clean(row.askingPrice || row.asking || row.price),
    propertyValue: clean(row.propertyValue || row.arv || row.value),
    repairs: clean(row.repairs || row.repairEstimate),
    summary: clean(row.summary || row.analyzer || row.notes || row.message || row.problem || row.description, kind === "deal" ? "Deal opportunity submitted for investor review." : "Pain/problem submitted for investor review."),
    analyzer: clean(row.analyzer),
    notes: clean(row.notes),
    ownerName,
    ownerEmail,
    contactName: clean(row.contactName || ownerName),
    contactEmail: clean(row.contactEmail || ownerEmail),
    contactPhone: clean(row.contactPhone || row.phone),
    photoUrl: clean(row.photoUrl || photos[0]),
    imageUrl: clean(row.imageUrl || row.coverPhoto || row.photoUrl || photos[0]),
    coverPhoto: clean(row.coverPhoto || row.imageUrl || row.photoUrl || photos[0]),
    photos,
    source: clean(row.source || (kind === "deal" ? INVESTOR_DEAL_ROOMS_KEY : INVESTOR_PAIN_ROOMS_KEY)),
    createdAt: clean(row.createdAt || row.created_at),
    updatedAt: clean(row.updatedAt || row.updated_at || row.createdAt || row.created_at || new Date().toISOString()),
    raw: row,
  };
}

function cleanCanonicalStore(key: string, kind: Kind, forever: Set<string>, overrides: Record<string, Status>) {
  if (typeof window === "undefined") return [] as CanonicalInvestorRoom[];

  const rows = parseJson<any[]>(window.localStorage.getItem(key), []);
  if (!Array.isArray(rows)) return [];

  const validRows = rows.filter((row) => {
    const id = clean(row?.id || row?.roomId);
    return id && !forever.has(id) && isValidInvestorRoom(row, kind);
  });

  if (validRows.length !== rows.length) {
    window.localStorage.setItem(key, JSON.stringify(validRows));
  }

  return validRows
    .map((row) => normalizeRoom(row, kind, overrides))
    .filter((row): row is CanonicalInvestorRoom => Boolean(row));
}

function loadInvestorRooms() {
  if (typeof window === "undefined") return [] as CanonicalInvestorRoom[];

  const forever = new Set(deletedForeverIds());
  const overrides = readStatusOverrides();

  const dealRooms = cleanCanonicalStore(INVESTOR_DEAL_ROOMS_KEY, "deal", forever, overrides);
  const painRooms = cleanCanonicalStore(INVESTOR_PAIN_ROOMS_KEY, "pain", forever, overrides);

  const map = new Map<string, CanonicalInvestorRoom>();
  [...dealRooms, ...painRooms].forEach((room) => {
    const old = map.get(room.id);
    if (!old || old.updatedAt < room.updatedAt) map.set(room.id, room);
  });

  return Array.from(map.values()).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

function saveRoomBack(room: CanonicalInvestorRoom) {
  if (typeof window === "undefined") return;

  const key = room.kind === "deal" ? INVESTOR_DEAL_ROOMS_KEY : INVESTOR_PAIN_ROOMS_KEY;
  const rows = parseJson<any[]>(window.localStorage.getItem(key), []);
  const next = rows.map((row) => {
    const id = clean(row?.id || row?.roomId);
    if (id !== room.id) return row;
    return { ...row, status: room.status, investorStatus: room.status, updatedAt: new Date().toISOString() };
  });

  window.localStorage.setItem(key, JSON.stringify(next));
}

function messageHref(room?: CanonicalInvestorRoom | null) {
  if (!room) return "/messages";

  const params = new URLSearchParams();
  params.set("kind", room.kind);
  params.set("room", room.title);
  params.set("title", room.title);
  params.set("recipient", room.ownerEmail || OWNER_EMAIL);
  params.set("owner", room.ownerName || OWNER_NAME);
  params.set("roomId", room.id);
  params.set("origin", "investor-room");
  params.set("senderWorkspace", "investor");
  params.set("recipientWorkspace", "member-owner");

  return `/messages?${params.toString()}`;
}

function moneyLine(room: CanonicalInvestorRoom) {
  const ask = room.askingPrice ? `${room.askingPrice} Asking` : "";
  const value = room.propertyValue ? `${room.propertyValue} Value/ARV` : "";
  return [ask, value].filter(Boolean).join(" • ");
}

function locationLine(room: CanonicalInvestorRoom) {
  return [room.city, room.county, room.state].filter(Boolean).join(", ") || "Location not listed";
}

function assetLine(room: CanonicalInvestorRoom) {
  return [room.assetClass, room.propertyType, ...room.strategy].filter(Boolean).join(" • ") || "Details not listed";
}

function StatCard({ label, count, help, active, onClick }: { label: string; count: number; help: string; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} style={{ ...tile, cursor: "pointer", minHeight: 150, borderColor: active ? "rgba(245,197,66,.75)" : "rgba(245,197,66,.35)" }}>
      <div style={eyebrow}>{label}</div>
      <div style={{ color: "#1e90ff", fontSize: 44, fontWeight: 1000, margin: "8px 0" }}>{count}</div>
      <p style={muted}>{help}</p>
      <p style={{ ...muted, color: "#ffda5e", fontWeight: 950 }}>Tap to open</p>
    </button>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return <p style={muted}><strong style={{ color: "#f7f8ff" }}>{label}:</strong> {value}</p>;
}

export default function InvestorRoomPage() {
  const [rooms, setRooms] = useState<CanonicalInvestorRoom[]>([]);
  const [lane, setLane] = useState<Lane>("deals");
  const [selected, setSelected] = useState<CanonicalInvestorRoom | null>(null);

  useEffect(() => {
    setRooms(loadInvestorRooms());

    function refresh() {
      setRooms(loadInvestorRooms());
    }

    window.addEventListener("storage", refresh);
    window.addEventListener("vaultforge-investor-room-change", refresh);
    window.addEventListener("vaultforge-deal-change", refresh);
    window.addEventListener("vaultforge-pain-change", refresh);

    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("vaultforge-investor-room-change", refresh);
      window.removeEventListener("vaultforge-deal-change", refresh);
      window.removeEventListener("vaultforge-pain-change", refresh);
    };
  }, []);

  const grouped = useMemo(() => ({
    deals: rooms.filter((room) => room.kind === "deal" && room.status === "active"),
    pain: rooms.filter((room) => room.kind === "pain" && room.status === "active"),
    saved: rooms.filter((room) => room.status === "saved"),
    archived: rooms.filter((room) => room.status === "archived"),
    deleted: rooms.filter((room) => room.status === "deleted"),
  }), [rooms]);

  const visible = grouped[lane];

  function refreshRooms() {
    setSelected(null);
    setRooms(loadInvestorRooms());
  }

  function moveRoom(id: string, status: Status) {
    writeStatusOverride(id, status);

    const currentRoom = rooms.find((room) => room.id === id);
    const nextLane: Lane = status === "active" ? (currentRoom?.kind === "pain" ? "pain" : "deals") : status;

    const next = rooms.map((room) => {
      if (room.id !== id) return room;
      const updated = { ...room, status, investorStatus: status, updatedAt: new Date().toISOString() };
      saveRoomBack(updated);
      return updated;
    });

    setRooms(next);
    setSelected((current) => current && current.id === id ? { ...current, status, investorStatus: status } : current);
    setLane(nextLane);
  }

  function deleteForever(id: string) {
    writeDeletedForever(id);

    const next = rooms.filter((room) => room.id !== id);
    setRooms(next);
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
          <Link href="/deal-create" style={button}>Create Deal</Link>
          <Link href="/messages" style={button}>Messages</Link>
        </nav>

        <section style={card}>
          <div style={eyebrow}>Investor Alerts</div>
          <div style={{ ...grid, marginTop: 16 }}>
            <StatCard label="Deals" count={grouped.deals.length} help="active investor deal rooms" active={lane === "deals"} onClick={() => setLane("deals")} />
            <StatCard label="Pain" count={grouped.pain.length} help="active investor pain rooms" active={lane === "pain"} onClick={() => setLane("pain")} />
            <StatCard label="Saved" count={grouped.saved.length} help="saved investor rooms" active={lane === "saved"} onClick={() => setLane("saved")} />
            <StatCard label="Archived" count={grouped.archived.length} help="hidden but preserved" active={lane === "archived"} onClick={() => setLane("archived")} />
            <StatCard label="Deleted" count={grouped.deleted.length} help="restore or delete forever" active={lane === "deleted"} onClick={() => setLane("deleted")} />
          </div>
        </section>

        <section style={goldCard}>
          <div style={eyebrow}>VaultForge Investor Command Room</div>
          <h1 style={h1}>Canonical investor opportunities only.</h1>
          <p style={sub}>
            This page reads only investor-facing canonical Deal and Pain records. Invalid Untitled Room / NA rows are automatically ignored and removed from the investor stores.
          </p>
          <div style={{ ...row, marginTop: 18 }}>
            <button type="button" style={goldButton} onClick={() => setLane("deals")}>Open Deal Signals</button>
            <button type="button" style={button} onClick={() => setLane("pain")}>Open Pain Signals</button>
            <button type="button" style={button} onClick={refreshRooms}>Refresh Canonical Rooms</button>
            <Link href={messageHref(selected)} style={goldButton}>Message Owner</Link>
          </div>
        </section>

        {selected ? (
          <section style={card}>
            <div style={eyebrow}>{selected.kind} detail • {selected.status}</div>
            <h2 style={h2}>{selected.title}</h2>
            <p style={sub}>{locationLine(selected)}</p>
            <p style={sub}>{assetLine(selected)}</p>
            {moneyLine(selected) ? <p style={{ ...sub, color: "#ffda5e", fontWeight: 900 }}>{moneyLine(selected)}</p> : null}

            <div style={{ ...feedGrid, marginTop: 14 }}>
              <div style={tile}>
                <div style={eyebrow}>Room Snapshot</div>
                {(selected.imageUrl || selected.coverPhoto || selected.photoUrl) ? (
                  <img src={selected.imageUrl || selected.coverPhoto || selected.photoUrl} alt={selected.title} style={imageStyle} />
                ) : null}
                <InfoLine label="City" value={selected.city} />
                <InfoLine label="County" value={selected.county} />
                <InfoLine label="State" value={selected.state} />
                <InfoLine label="Address" value={selected.address} />
              </div>

              <div style={tile}>
                <div style={eyebrow}>Owner / Routing</div>
                <InfoLine label="Owner" value={selected.ownerName} />
                <InfoLine label="Owner Email" value={selected.ownerEmail} />
                <InfoLine label="Contact" value={selected.contactName} />
                <InfoLine label="Contact Email" value={selected.contactEmail} />
                <InfoLine label="Contact Phone" value={selected.contactPhone} />
                <InfoLine label="Route To" value={selected.routeTo.join(", ")} />
              </div>
            </div>

            <div style={{ ...tile, marginTop: 14 }}>
              <div style={eyebrow}>Intelligence Summary</div>
              <p style={sub}>{selected.summary}</p>
            </div>

            <div style={{ ...tile, marginTop: 14 }}>
              <div style={eyebrow}>Investor Action</div>
              <p style={sub}>Review the opportunity, save it for later, archive it, or message the owner directly from this room.</p>
            </div>

            <div style={{ ...row, marginTop: 18 }}>
              <button type="button" style={goldButton} onClick={() => moveRoom(selected.id, "active")}>Active / Restore</button>
              <button type="button" style={button} onClick={() => moveRoom(selected.id, "saved")}>Save</button>
              <button type="button" style={button} onClick={() => moveRoom(selected.id, "archived")}>Archive</button>
              <button type="button" style={redButton} onClick={() => moveRoom(selected.id, "deleted")}>Delete</button>
              {selected.status === "deleted" ? <button type="button" style={redButton} onClick={() => deleteForever(selected.id)}>Delete Forever</button> : null}
              <Link href={messageHref(selected)} style={goldButton}>Message Owner</Link>
              <button type="button" style={button} onClick={() => setSelected(null)}>Close</button>
            </div>
          </section>
        ) : null}

        <section style={card}>
          <div style={eyebrow}>{lane}</div>
          <h2 style={h2}>
            {lane === "deals"
              ? "Investor Deal Opportunities"
              : lane === "pain"
                ? "Investor Pain Opportunities"
                : `${lane.charAt(0).toUpperCase()}${lane.slice(1)} Investor Rooms`}
          </h2>

          {visible.length ? (
            <div style={feedGrid}>
              {visible.map((room) => (
                <button key={room.id} type="button" onClick={() => setSelected(room)} style={{ ...tile, cursor: "pointer", minHeight: 270, borderColor: room.status === "deleted" ? "rgba(255,65,65,.58)" : "rgba(245,197,66,.38)" }}>
                  {(room.imageUrl || room.coverPhoto || room.photoUrl) ? (
                    <img src={room.imageUrl || room.coverPhoto || room.photoUrl} alt={room.title} style={imageStyle} />
                  ) : null}
                  <div style={eyebrow}>{room.kind} • {room.state || "State not listed"} • {room.status}</div>
                  <h3 style={{ ...h3, color: "#1e90ff" }}>{room.title}</h3>
                  <p style={muted}>{locationLine(room)}</p>
                  <p style={muted}>{assetLine(room)}</p>
                  {moneyLine(room) ? <p style={{ ...muted, color: "#ffda5e", fontWeight: 900 }}>{moneyLine(room)}</p> : null}
                  <p style={muted}>{room.summary}</p>
                  <p style={{ ...muted, color: "#ffda5e", fontWeight: 950 }}>Open Details</p>
                </button>
              ))}
            </div>
          ) : (
            <div style={tile}>
              <h3 style={h3}>No canonical investor rooms in this folder.</h3>
              <p style={sub}>Create a real Deal/Pain opportunity with title, owner, and details. Old Untitled Room / NA rows are intentionally ignored.</p>
              <div style={{ ...row, marginTop: 14 }}>
                <Link href="/deal-create" style={goldButton}>Create Deal</Link>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
