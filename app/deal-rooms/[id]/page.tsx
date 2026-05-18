"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

type RoomKind = "deal";
type RoomState = "active" | "saved" | "archived" | "deleted";

type SavedProfile = {
  profilePhoto?: string;
  fullName?: string;
  company?: string;
  email?: string;
  phone?: string;
  preferredContact?: string[];
  memberTypes?: string[];
  buyStates?: string[];
  operateStates?: string[];
  alertStates?: string[];
  contactStates?: string[];
  assetTypes?: string[];
};

type RoomRecord = {
  id?: string;
  roomId?: string;
  dealId?: string;
  painId?: string;
  roomState?: RoomState;
  cleanupState?: RoomState;
  stateStatus?: RoomState;
  title?: string;
  name?: string;
  assetClass?: string;
  state?: string;
  city?: string;
  county?: string;
  address?: string;
  photoUrls?: string[];
  photos?: string[];
  photoUrl?: string;
  photo?: string;
  imageUrl?: string;
  publicUrl?: string;
  routeTo?: string[];
  routedTo?: string[];
  routingNeeds?: string[];
  painTypes?: string[];
  urgency?: string[] | string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  bestContact?: string;
  submitterRole?: string;
  askingPrice?: string;
  propertyValue?: string;
  arv?: string;
  repairs?: string;
  payoff?: string;
  amountNeeded?: string;
  equitySpread?: string;
  beds?: string;
  baths?: string;
  sqft?: string;
  units?: string;
  buildingSize?: string;
  acres?: string;
  zoning?: string;
  occupancy?: string;
  access?: string;
  authority?: string;
  timeline?: string;
  riskLevel?: string;
  analyzer?: string;
  aiRead?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
};

const KIND: RoomKind = "deal";
const ROOM_KEYS = ["vaultforge_clean_deal_rooms", "vaultforge_deal_rooms", "vaultforge_rooms_deals", "vf_deal_rooms"];
const PROFILE_KEY = "vaultforge_profile_v2";
const ROOM_STATE_KEYS = ["vaultforge_clean_room_states", "vaultforge_room_states", "vaultforge_deal_room_states", "vaultforge_pain_room_states", "vaultforge_5s_room_states"];

function parseJson<T>(raw: string | null, fallback: T): T { try { return raw ? JSON.parse(raw) as T : fallback; } catch { return fallback; } }
function idOf(room: RoomRecord | null | undefined) { return String(room?.id || room?.roomId || room?.dealId || room?.painId || ""); }
function readRooms(key: string): RoomRecord[] { const parsed = parseJson<unknown>(window.localStorage.getItem(key), []); return Array.isArray(parsed) ? parsed as RoomRecord[] : []; }
function readProfile(): SavedProfile | null { return parseJson<SavedProfile | null>(window.localStorage.getItem(PROFILE_KEY), null); }

function readStates(): Record<string, RoomState> {
  const merged: Record<string, RoomState> = {};
  for (const key of ROOM_STATE_KEYS) Object.assign(merged, parseJson<Record<string, RoomState>>(window.localStorage.getItem(key), {}));
  return merged;
}

function writeStates(states: Record<string, RoomState>) {
  for (const key of ROOM_STATE_KEYS) window.localStorage.setItem(key, JSON.stringify(states));
}

function roomState(room: RoomRecord | null): RoomState {
  if (!room) return "active";
  const states = readStates();
  const id = idOf(room);
  const compound = `${KIND}:${id}`;
  const status = states[compound] || states[id] || room.roomState || room.cleanupState || room.stateStatus || "active";
  if (status === "saved" || status === "archived" || status === "deleted") return status;
  return "active";
}

function findRoom(id: string): RoomRecord | null {
  const directKeys = [
    `vaultforge_clean_${KIND}_room_${id}`,
    `vaultforge_${KIND}_room_${id}`,
    `vf_${KIND}_room_${id}`,
  ];

  for (const key of directKeys) {
    const hit = parseJson<RoomRecord | null>(window.localStorage.getItem(key), null);
    const hitId = idOf(hit);
    if (hit && hitId) return { ...hit, id: hitId, roomState: roomState(hit) };
  }

  for (const key of ROOM_KEYS) {
    const hit = readRooms(key).find((room) => idOf(room) === id);
    const hitId = idOf(hit);
    if (hit && hitId) return { ...hit, id: hitId, roomState: roomState(hit) };
  }

  return null;
}

function syncRoom(room: RoomRecord, state: RoomState) {
  const id = idOf(room);
  if (!id) return;

  const next = { ...room, id, roomState: state, cleanupState: state, stateStatus: state, updatedAt: new Date().toISOString() };

  window.localStorage.setItem(`vaultforge_clean_${KIND}_room_${id}`, JSON.stringify(next));
  window.localStorage.setItem(`vaultforge_${KIND}_room_${id}`, JSON.stringify(next));

  for (const key of ROOM_KEYS) {
    const rows = readRooms(key).filter((item) => idOf(item) !== id);
    window.localStorage.setItem(key, JSON.stringify([next, ...rows]));
  }

  const states = readStates();
  states[id] = state;
  states[`${KIND}:${id}`] = state;
  writeStates(states);

  window.dispatchEvent(new Event("storage"));
  window.dispatchEvent(new Event("vaultforge-room-state-change"));
  window.dispatchEvent(new Event(KIND === "deal" ? "vaultforge-deal-change" : "vaultforge-pain-change"));
}

function normalizeList(input: unknown): string[] {
  if (Array.isArray(input)) return input.map((item) => String(item).trim()).filter(Boolean);
  if (typeof input === "string" && input.trim()) return input.split(",").map((item) => item.trim()).filter(Boolean);
  return [];
}

function arr(room: RoomRecord | null, keys: string[]) {
  if (!room) return [];
  for (const key of keys) {
    const list = normalizeList(room[key]);
    if (list.length) return list;
  }
  return [];
}

function val(room: RoomRecord | null, keys: string[], fallback = "Not listed") {
  if (!room) return fallback;
  for (const key of keys) {
    const got = room[key];
    if (got !== undefined && got !== null && String(got).trim()) return String(got);
  }
  return fallback;
}

function photos(room: RoomRecord | null) {
  if (!room) return [];
  const all = [room.photoUrls, room.photos, room.photoUrl, room.photo, room.imageUrl, room.publicUrl].flatMap(normalizeList);
  return Array.from(new Set(all)).filter((item) => item && !item.startsWith("data:")).slice(0, 10);
}

function money(value: unknown) {
  const raw = String(value || "").trim();
  if (!raw) return "Not listed";
  if (raw.includes("$")) return raw;
  const number = Number(raw.replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(number) || number <= 0) return raw;
  return number.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function location(room: RoomRecord | null) {
  return [val(room, ["city"], ""), val(room, ["county"], ""), val(room, ["state"], "")].filter(Boolean).join(", ") || "Market not listed";
}

function messageHref(room: RoomRecord | null) {
  if (!room) return "/messages";
  const id = idOf(room);
  const title = val(room, ["title", "name"], KIND === "deal" ? "Deal Room" : "Pain Room");
  return `/messages?type=${KIND}&room=${encodeURIComponent(id)}&subject=${encodeURIComponent(`${KIND === "deal" ? "Deal Room" : "Pain Room"}: ${title}`)}`;
}

function folderPath(state: RoomState) {
  if (state === "saved") return "/saved-rooms";
  if (state === "archived") return "/archived-rooms";
  if (state === "deleted") return "/deleted-rooms";
  return KIND === "deal" ? "/deal-rooms" : "/pain-rooms";
}

function fitScore(room: RoomRecord | null, profile: SavedProfile | null) {
  if (!room || !profile) return 0;
  let score = 0;
  const state = val(room, ["state"], "");
  const asset = val(room, ["assetClass"], "").toLowerCase();
  const route = arr(room, ["routeTo", "routedTo", "routingNeeds"]).join(" ").toLowerCase();
  if (state && profile.alertStates?.includes(state)) score += 20;
  if (state && profile.buyStates?.includes(state)) score += 12;
  if (state && profile.operateStates?.includes(state)) score += 12;
  if ((profile.assetTypes || []).some((item) => item.toLowerCase().includes(asset))) score += 12;
  for (const type of profile.memberTypes || []) if (route.includes(type.toLowerCase())) score += 10;
  return Math.min(100, score || 62);
}

function Fact({ label, value }: { label: string; value: string }) {
  return <div style={factCard}><div style={miniEyebrow}>{label}</div><div style={factValue}>{value}</div></div>;
}

export default function RoomDetailPage() {
  const params = useParams();
  const id = decodeURIComponent(String(params?.id || ""));
  const [room, setRoom] = useState<RoomRecord | null>(null);
  const [profile, setProfile] = useState<SavedProfile | null>(null);

  function load() {
    setRoom(findRoom(id));
    setProfile(readProfile());
  }

  useEffect(() => {
    load();
    window.addEventListener("storage", load);
    window.addEventListener("vaultforge-room-state-change", load);
    window.addEventListener(KIND === "deal" ? "vaultforge-deal-change" : "vaultforge-pain-change", load);
    return () => {
      window.removeEventListener("storage", load);
      window.removeEventListener("vaultforge-room-state-change", load);
      window.removeEventListener(KIND === "deal" ? "vaultforge-deal-change" : "vaultforge-pain-change", load);
    };
  }, [id]);

  function moveTo(state: RoomState) {
    if (!room) return;
    syncRoom(room, state);
    window.location.href = folderPath(state);
  }

  const roomPhotos = useMemo(() => photos(room), [room]);
  const status = roomState(room);
  const routeValues = arr(room, ["routeTo", "routedTo", "routingNeeds"]);
  const title = val(room, ["title", "name"], KIND === "deal" ? "Untitled Deal Room" : "Untitled Pain Room");
  const signal = val(room, ["analyzer", "aiRead"], `${KIND === "deal" ? "Deal" : "Pain"} signal in ${location(room)}. Verify facts, route to matched profile, move qualified conversation into Messages.`);

  if (!room) {
    return (
      <main style={page}>
        <div style={wrap}>
          <nav style={nav}><Link href={KIND === "deal" ? "/deal-rooms" : "/pain-rooms"} style={goldBtn}>Back</Link><Link href="/command" style={btn}>Command</Link></nav>
          <section style={card}><div style={eyebrow}>{KIND === "deal" ? "Deal Room" : "Pain Room"}</div><h1 style={h1}>Room not found.</h1><p style={sub}>This room was not found in local saved rooms.</p></section>
        </div>
      </main>
    );
  }

  return (
    <main style={page}>
      <div style={wrap}>
        <nav style={nav}>
          <Link href="/command" style={btn}>Command</Link>
          <Link href={KIND === "deal" ? "/deal-rooms" : "/pain-rooms"} style={goldBtn}>{KIND === "deal" ? "Deal Rooms" : "Pain Rooms"}</Link>
          <Link href="/messages" style={btn}>Messages</Link>
          <Link href="/profile" style={btn}>Profile</Link>
          <Link href="/" style={redBtn}>Exit</Link>
        </nav>

        <section style={card}>
          {roomPhotos.length ? <div style={photoGrid}>{roomPhotos.map((url, index) => <img key={`${url}-${index}`} src={url} alt={`Room photo ${index + 1}`} style={photoStyle} />)}</div> : <div style={emptyPhoto}>No photo URL saved for this room</div>}
          <div style={eyebrow}>{val(room, ["assetClass"], KIND === "deal" ? "Deal Room" : "Pain Room")}</div>
          <h1 style={h1}>{title}</h1>
          <p style={sub}>{location(room)}</p>
        </section>

        <section style={card}>
          <div style={eyebrow}>5S Controls</div>
          <p style={{ ...sub, marginBottom: 18 }}>Current: {status}. Save, Archive, or Delete moves this room out of the active command surface and into the matching folder.</p>
          <div style={actionRow}>
            <button type="button" onClick={() => moveTo("saved")} style={goldBtn}>Save</button>
            <button type="button" onClick={() => moveTo("archived")} style={btn}>Archive</button>
            <button type="button" onClick={() => moveTo("deleted")} style={redBtn}>Delete</button>
            <span style={btn}>Current: {status}</span>
          </div>
        </section>

        <section style={card}>
          <div style={eyebrow}>Owner Message</div>
          <h2 style={h2}>Contact owner with this {KIND} attached.</h2>
          <p style={sub}>Message subject is locked to this room so the thread matches the {KIND}.</p>
          <div style={{ ...actionRow, marginTop: 18 }}>
            <Link href={messageHref(room)} style={goldBtn}>Message Owner</Link>
            <a href={`mailto:${val(room, ["contactEmail"], "")}?subject=${encodeURIComponent(`${KIND === "deal" ? "Deal Room" : "Pain Room"}: ${title}`)}`} style={btn}>Email Owner</a>
          </div>
        </section>

        <section style={card}>
          <div style={eyebrow}>VaultForge Signal Summary</div>
          <p style={sub}>{signal}</p>
        </section>

        <section style={card}>
          <div style={eyebrow}>AI Routed Profile</div>
          {profile ? (
            <div style={profileCard}>
              {profile.profilePhoto ? <img src={profile.profilePhoto} alt="Profile" style={profilePhoto} /> : <div style={emptyPhoto}>No profile photo</div>}
              <div>
                <h2 style={h2}>{profile.fullName || profile.company || "Saved Profile"}</h2>
                <p style={sub}>Fit score: {fitScore(room, profile)}%. Contact: {(profile.preferredContact || []).join(", ") || "Not selected"}. Phone: {profile.phone || "Not listed"}. Email: {profile.email || "Not listed"}.</p>
              </div>
            </div>
          ) : <p style={sub}>No saved profile found. Save a profile so VaultForge can route this room.</p>}
        </section>

        <section style={card}>
          <div style={eyebrow}>Numbers + Facts</div>
          <div style={grid}>
            <Fact label="Ask" value={money(val(room, ["askingPrice"], ""))} />
            <Fact label="Value / ARV" value={money(val(room, ["propertyValue", "arv"], ""))} />
            <Fact label="Repairs / Work" value={money(val(room, ["repairs"], ""))} />
            <Fact label="Payoff" value={money(val(room, ["payoff"], ""))} />
            <Fact label="Amount Needed" value={money(val(room, ["amountNeeded"], ""))} />
            <Fact label="Equity Spread" value={val(room, ["equitySpread"])} />
            <Fact label="Beds" value={val(room, ["beds"])} />
            <Fact label="Baths" value={val(room, ["baths"])} />
            <Fact label="Sqft" value={val(room, ["sqft"])} />
            <Fact label="Units" value={val(room, ["units"])} />
            <Fact label="Building" value={val(room, ["buildingSize"])} />
            <Fact label="Acres" value={val(room, ["acres"])} />
            <Fact label="Zoning" value={val(room, ["zoning"])} />
            <Fact label="Occupancy" value={val(room, ["occupancy"])} />
            <Fact label="Access" value={val(room, ["access"])} />
          </div>
        </section>

        <section style={card}>
          <div style={eyebrow}>Contact + Routing</div>
          <div style={grid}>
            <Fact label="Name" value={val(room, ["contactName"])} />
            <Fact label="Phone" value={val(room, ["contactPhone"])} />
            <Fact label="Email" value={val(room, ["contactEmail"])} />
            <Fact label="Best Contact" value={val(room, ["bestContact"])} />
            <Fact label="Role" value={val(room, ["submitterRole"])} />
            <Fact label="Route To" value={routeValues.join(", ") || "Not selected"} />
            <Fact label="Urgency" value={arr(room, ["urgency"]).join(", ") || "Not selected"} />
            <Fact label="Pain Types" value={arr(room, ["painTypes"]).join(", ") || "Not selected"} />
          </div>
        </section>

        <section style={card}>
          <div style={eyebrow}>Notes</div>
          <div style={noteBox}><p style={sub}>{val(room, ["notes"], "No notes saved.")}</p></div>
        </section>
      </div>
    </main>
  );
}


const page: React.CSSProperties = { minHeight: "100vh", background: "#05070d", color: "#f7f7fb", padding: 18, fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" };
const wrap: React.CSSProperties = { maxWidth: 1180, margin: "0 auto", paddingBottom: 70 };
const nav: React.CSSProperties = { display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 18 };
const card: React.CSSProperties = { background: "linear-gradient(180deg,#080d19,#050816)", border: "1px solid rgba(245,197,66,.28)", borderRadius: 26, padding: 28, marginBottom: 22 };
const eyebrow: React.CSSProperties = { color: "#ffd45a", textTransform: "uppercase", letterSpacing: 8, fontWeight: 900, fontSize: 19, marginBottom: 14 };
const miniEyebrow: React.CSSProperties = { color: "#ffd45a", textTransform: "uppercase", letterSpacing: 5, fontWeight: 900, fontSize: 13, marginBottom: 10 };
const h1: React.CSSProperties = { fontSize: "clamp(42px,7vw,76px)", lineHeight: 0.92, letterSpacing: -4, margin: "0 0 18px", fontWeight: 950 };
const h2: React.CSSProperties = { fontSize: "clamp(30px,5vw,52px)", lineHeight: 1, letterSpacing: -2, margin: "0 0 12px", fontWeight: 950 };
const sub: React.CSSProperties = { color: "#c9d0dc", fontSize: 22, lineHeight: 1.35, margin: 0 };
const btn: React.CSSProperties = { border: "1px solid rgba(207,216,230,.18)", background: "#171c29", color: "#f7f7fb", borderRadius: 999, padding: "13px 18px", fontWeight: 950, textDecoration: "none", display: "inline-block", cursor: "pointer" };
const goldBtn: React.CSSProperties = { ...btn, border: 0, background: "#ffdc68", color: "#10131a" };
const redBtn: React.CSSProperties = { ...btn, background: "#271016", borderColor: "rgba(255,70,70,.48)", color: "#ffaaaa" };
const actionRow: React.CSSProperties = { display: "flex", flexWrap: "wrap", gap: 12 };
const grid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(245px, 1fr))", gap: 16 };
const factCard: React.CSSProperties = { background: "#121724", border: "1px solid rgba(207,216,230,.14)", borderRadius: 20, padding: 22 };
const factValue: React.CSSProperties = { fontSize: 22, fontWeight: 850, color: "#f7f7fb" };
const photoGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 24 };
const photoStyle: React.CSSProperties = { width: "100%", height: 190, objectFit: "cover", borderRadius: 22, border: "1px solid rgba(207,216,230,.2)" };
const emptyPhoto: React.CSSProperties = { border: "1px dashed rgba(207,216,230,.25)", borderRadius: 24, padding: 70, textAlign: "center", color: "#c9d0dc", marginBottom: 24, fontSize: 22 };
const profileCard: React.CSSProperties = { display: "grid", gridTemplateColumns: "130px 1fr", gap: 20, alignItems: "start" };
const profilePhoto: React.CSSProperties = { width: 130, height: 130, objectFit: "cover", borderRadius: 24, border: "1px solid rgba(245,197,66,.34)" };
const noteBox: React.CSSProperties = { marginTop: 18, padding: 22, borderRadius: 22, border: "1px solid rgba(207,216,230,.14)", background: "#121724" };
