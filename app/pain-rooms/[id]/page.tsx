"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

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
  countiesByState?: Record<string, string[]>;
  assetTypes?: string[];
  executionCapabilities?: string[];
  capitalRoles?: string[];
  routingRules?: string[];
};

type PainRoom = {
  id?: string;
  roomId?: string;
  painId?: string;
  roomState?: RoomState;
  title?: string;
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
  painTypes?: string[];
  urgency?: string[];
  blockers?: string[];
  routingNeeds?: string[];
  solutionLanes?: string[];
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  bestContact?: string;
  submitterRole?: string;
  amountNeeded?: string;
  propertyValue?: string;
  payoff?: string;
  askingPrice?: string;
  arv?: string;
  repairs?: string;
  beds?: string;
  baths?: string;
  sqft?: string;
  units?: string;
  buildingSize?: string;
  acres?: string;
  zoning?: string;
  access?: string;
  occupancy?: string;
  authority?: string;
  timeline?: string;
  rootCause?: string;
  currentState?: string;
  targetOutcome?: string;
  constraints?: string;
  riskLevel?: string;
  notes?: string;
  analyzer?: string;
  aiRead?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
};

const ROOM_KEYS = ["vaultforge_clean_pain_rooms_v1", "vaultforge_clean_pain_rooms", "vaultforge_pain_rooms", "vaultforge_rooms_pain", "vf_pain_rooms"];
const PROFILE_KEY = "vaultforge_profile_v2";
const STATE_KEY = "vaultforge_clean_room_states";

function parseJson<T>(raw: string | null, fallback: T): T { try { return raw ? JSON.parse(raw) as T : fallback; } catch { return fallback; } }
function roomId(room: PainRoom | null | undefined) { return String(room?.id || room?.roomId || room?.painId || ""); }
function readArray(key: string): PainRoom[] { const parsed = parseJson<unknown>(window.localStorage.getItem(key), []); return Array.isArray(parsed) ? parsed as PainRoom[] : []; }
function readStates(): Record<string, RoomState> { return parseJson<Record<string, RoomState>>(window.localStorage.getItem(STATE_KEY), {}); }
function writeStates(states: Record<string, RoomState>) { window.localStorage.setItem(STATE_KEY, JSON.stringify(states)); }
function readProfile(): SavedProfile | null { return parseJson<SavedProfile | null>(window.localStorage.getItem(PROFILE_KEY), null); }

function findRoom(id: string): PainRoom | null {
  const states = readStates();
  const directKeys = [`vaultforge_clean_pain_room_${id}`, `vaultforge_pain_room_${id}`, `vf_pain_room_${id}`];

  for (const key of directKeys) {
    const direct = parseJson<PainRoom | null>(window.localStorage.getItem(key), null);
    const directId = roomId(direct);
    if (direct && directId) return { ...direct, id: directId, roomState: states[directId] || direct.roomState || "active" };
  }

  for (const key of ROOM_KEYS) {
    const hit = readArray(key).find((item) => roomId(item) === id);
    const hitId = roomId(hit);
    if (hit && hitId) return { ...hit, id: hitId, roomState: states[hitId] || hit.roomState || "active" };
  }

  return null;
}

function normalizeList(input: unknown): string[] {
  if (Array.isArray(input)) return input.map((item) => String(item).trim()).filter(Boolean);
  if (typeof input === "string" && input.trim()) return input.split(",").map((item) => item.trim()).filter(Boolean);
  return [];
}

function arr(room: PainRoom | null, keys: string[]): string[] {
  if (!room) return [];
  for (const key of keys) {
    const list = normalizeList(room[key]);
    if (list.length) return list;
  }
  return [];
}

function val(room: PainRoom | null, keys: string[], fallback = "Not listed") {
  if (!room) return fallback;
  for (const key of keys) {
    const v = room[key];
    if (v !== undefined && v !== null && String(v).trim()) return String(v);
  }
  return fallback;
}

function photos(room: PainRoom | null) {
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

function location(room: PainRoom | null) {
  return [val(room, ["city"], ""), val(room, ["county"], ""), val(room, ["state"], "")].filter(Boolean).join(", ") || "Market not listed";
}

function pressure(room: PainRoom | null) {
  const urgency = arr(room, ["urgency"]).join(" ").toLowerCase();
  const blockers = arr(room, ["blockers"]).length;
  const amount = Number(val(room, ["amountNeeded"], "0").replace(/[^0-9.]/g, "")) || 0;
  let score = 42;
  if (urgency.includes("emergency")) score += 35;
  if (urgency.includes("critical")) score += 30;
  if (urgency.includes("high")) score += 22;
  score += Math.min(20, blockers * 4);
  if (amount >= 50000) score += 6;
  if (amount >= 250000) score += 10;
  return Math.max(1, Math.min(99, score));
}

function syncRoom(room: PainRoom) {
  const id = roomId(room);
  if (!id) return;
  const clean = { ...room, id, photoUrls: photos(room), updatedAt: new Date().toISOString() };
  window.localStorage.setItem(`vaultforge_clean_pain_room_${id}`, JSON.stringify(clean));
  window.localStorage.setItem(`vaultforge_pain_room_${id}`, JSON.stringify(clean));
  for (const key of ROOM_KEYS) {
    const rows = readArray(key).filter((item) => roomId(item) !== id);
    window.localStorage.setItem(key, JSON.stringify([clean, ...rows]));
  }
  window.dispatchEvent(new Event("vaultforge-pain-change"));
}

function fitScore(room: PainRoom | null, profile: SavedProfile | null) {
  if (!room || !profile) return 0;
  let score = 0;
  const state = val(room, ["state"], "");
  const county = val(room, ["county"], "");
  const asset = val(room, ["assetClass"], "").toLowerCase();
  const routing = arr(room, ["routingNeeds"]).join(" ").toLowerCase();

  if (state && profile.alertStates?.includes(state)) score += 20;
  if (state && profile.buyStates?.includes(state)) score += 12;
  if (state && profile.operateStates?.includes(state)) score += 12;
  if (county && state && profile.countiesByState?.[state]?.includes(county)) score += 15;
  if ((profile.assetTypes || []).some((item) => item.toLowerCase().includes(asset))) score += 12;
  for (const type of profile.memberTypes || []) if (routing.includes(type.toLowerCase())) score += 10;
  if (profile.routingRules?.includes("Allow AI Routing")) score += 8;
  return Math.min(100, score);
}

function messageHref(room: PainRoom | null) {
  if (!room) return "/messages";
  const id = roomId(room);
  const title = val(room, ["title"], "Pain Room");
  return `/messages?type=pain&room=${encodeURIComponent(id)}&subject=${encodeURIComponent(`Pain Room: ${title}`)}`;
}

function Fact({ label, value }: { label: string; value: string }) {
  return <div style={factCard}><div style={miniEyebrow}>{label}</div><div style={factValue}>{value}</div></div>;
}

export default function PainRoomDetailPage() {
  const params = useParams();
  const id = decodeURIComponent(String(params?.id || ""));
  const [room, setRoom] = useState<PainRoom | null>(null);
  const [profile, setProfile] = useState<SavedProfile | null>(null);

  function load() {
    setRoom(findRoom(id));
    setProfile(readProfile());
  }

  useEffect(() => {
    load();
    window.addEventListener("vaultforge-pain-change", load);
    window.addEventListener("storage", load);
    return () => {
      window.removeEventListener("vaultforge-pain-change", load);
      window.removeEventListener("storage", load);
    };
  }, [id]);

  function setRoomState(state: RoomState) {
    if (!room) return;
    const currentId = roomId(room);
    const states = readStates();
    states[currentId] = state;
    writeStates(states);
    const next = { ...room, id: currentId, roomState: state };
    syncRoom(next);
    setRoom(next);
  }

  const roomPhotos = useMemo(() => photos(room), [room]);
  const analyzer = val(room, ["analyzer", "aiRead"], `This Pain Room needs analysis. Confirm owner control, verify numbers, isolate blockers, route to the right member, and move execution into Messages.`);
  const profileFit = fitScore(room, profile);

  if (!room) {
    return <main style={page}><div style={wrap}><nav style={nav}><Link href="/pain-rooms" style={goldBtn}>Back to Pain Rooms</Link><Link href="/pain-intake" style={btn}>Create Pain</Link></nav><section style={card}><div style={eyebrow}>Pain Room</div><h1 style={h1}>Room not found.</h1><p style={sub}>This room was not found in local saved Pain Rooms.</p></section></div></main>;
  }

  return (
    <main style={page}>
      <div style={wrap}>
        <nav style={nav}>
          <Link href="/command" style={btn}>Command</Link>
          <Link href="/pain-rooms" style={goldBtn}>Pain Rooms</Link>
          <Link href={messageHref(room)} style={btn}>Message Owner</Link>
          <Link href="/profile" style={btn}>Profile</Link>
          <Link href="/" style={redBtn}>Exit</Link>
        </nav>

        <section style={card}>
          {roomPhotos.length ? <div style={photoGrid}>{roomPhotos.map((url, index) => <img key={`${url}-${index}`} src={url} alt={`Pain photo ${index + 1}`} style={photoStyle} />)}</div> : <div style={emptyPhoto}>No photo URL saved for this room</div>}
          <div style={eyebrow}>{val(room, ["assetClass"], "Pain Room")}</div>
          <h1 style={h1}>{val(room, ["title"], "Untitled Pain Room")}</h1>
          <p style={sub}>{location(room)}</p>
          <div style={pressureBadge}>{pressure(room)}/99 Pressure</div>
        </section>

        <section style={card}>
          <div style={eyebrow}>Room Controls</div>
          <div style={actionRow}>
            <button type="button" onClick={() => setRoomState("saved")} style={goldBtn}>Save</button>
            <button type="button" onClick={() => setRoomState("archived")} style={btn}>Archive</button>
            <button type="button" onClick={() => setRoomState("deleted")} style={redBtn}>Delete</button>
            <Link href={messageHref(room)} style={goldBtn}>Message Owner</Link>
            <span style={btn}>Current: {room.roomState || "active"}</span>
          </div>
        </section>

        <section style={card}>
          <div style={eyebrow}>Analyzer</div>
          <h2 style={h2}>What is broken, what blocks it, and how to route the solution.</h2>
          <p style={sub}>{analyzer}</p>
        </section>

        <section style={card}>
          <div style={eyebrow}>Solution Path</div>
          <div style={grid}>
            <Fact label="Problem Type" value={arr(room, ["painTypes"]).join(", ") || "Not selected"} />
            <Fact label="Urgency" value={arr(room, ["urgency"]).join(", ") || "Not selected"} />
            <Fact label="Blockers" value={arr(room, ["blockers"]).join(", ") || "Not selected"} />
            <Fact label="Route To" value={arr(room, ["routingNeeds"]).join(", ") || "Not selected"} />
            <Fact label="Solution Steps" value={arr(room, ["solutionLanes"]).join(" → ") || "Analyze → Route → Execute"} />
            <Fact label="Risk Level" value={val(room, ["riskLevel"])} />
          </div>
        </section>

        <section style={card}>
          <div style={eyebrow}>Asset + Numbers</div>
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
          <div style={eyebrow}>Owner / Contact</div>
          <div style={grid}>
            <Fact label="Name" value={val(room, ["contactName"])} />
            <Fact label="Phone" value={val(room, ["contactPhone"])} />
            <Fact label="Email" value={val(room, ["contactEmail"])} />
            <Fact label="Best Contact" value={val(room, ["bestContact"])} />
            <Fact label="Authority" value={val(room, ["authority"])} />
            <Fact label="Timeline" value={val(room, ["timeline"])} />
          </div>
        </section>

        <section style={card}>
          <div style={eyebrow}>AI Routed Profile</div>
          {profile ? (
            <div style={profileCard}>
              {profile.profilePhoto ? <img src={profile.profilePhoto} alt="Profile" style={profilePhoto} /> : <div style={profileMissing}>No profile photo</div>}
              <div>
                <h2 style={h2}>{profile.fullName || profile.company || "Saved Profile"}</h2>
                <p style={sub}>Fit score: {profileFit}%</p>
                <p style={{ ...sub, fontSize: 18 }}>Contact: {(profile.preferredContact || []).join(", ") || "Not selected"} • {profile.phone || "No phone"} • {profile.email || "No email"}</p>
              </div>
            </div>
          ) : <p style={sub}>No saved profile found. Save a profile so VaultForge can route this room.</p>}
        </section>

        <section style={card}>
          <div style={eyebrow}>Current State / Root Cause / Outcome</div>
          <div style={grid}>
            <Fact label="Current State" value={val(room, ["currentState"])} />
            <Fact label="Root Cause" value={val(room, ["rootCause"])} />
            <Fact label="Target Outcome" value={val(room, ["targetOutcome"])} />
            <Fact label="Constraints" value={val(room, ["constraints"])} />
          </div>
          <div style={noteBox}><div style={miniEyebrow}>Private Notes</div><p style={sub}>{val(room, ["notes"], "No notes saved.")}</p></div>
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
const factValue: React.CSSProperties = { fontSize: 23, fontWeight: 850, color: "#f7f7fb" };
const photoGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 24 };
const photoStyle: React.CSSProperties = { width: "100%", height: 180, objectFit: "cover", borderRadius: 22, border: "1px solid rgba(207,216,230,.2)" };
const emptyPhoto: React.CSSProperties = { border: "1px dashed rgba(207,216,230,.25)", borderRadius: 24, padding: 70, textAlign: "center", color: "#c9d0dc", marginBottom: 24, fontSize: 22 };
const pressureBadge: React.CSSProperties = { marginTop: 18, display: "inline-block", borderRadius: 999, padding: "12px 16px", background: "#ffdc68", color: "#10131a", fontWeight: 950 };
const profileCard: React.CSSProperties = { display: "grid", gridTemplateColumns: "160px 1fr", gap: 20, alignItems: "start" };
const profilePhoto: React.CSSProperties = { width: 160, height: 160, objectFit: "cover", borderRadius: 24, border: "1px solid rgba(245,197,66,.34)" };
const profileMissing: React.CSSProperties = { width: 160, height: 160, borderRadius: 24, border: "1px dashed rgba(245,197,66,.34)", display: "grid", placeItems: "center", color: "#c9d0dc", textAlign: "center" };
const noteBox: React.CSSProperties = { marginTop: 18, padding: 22, borderRadius: 22, border: "1px solid rgba(207,216,230,.14)", background: "#121724" };
