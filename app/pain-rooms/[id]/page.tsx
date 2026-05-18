"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

type RoomState = "active" | "saved" | "archived" | "deleted";

type ProfileData = {
  profilePhoto?: string;
  companyLogo?: string;
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
  markets?: string[];
  assetTypes?: string[];
  dealTypes?: string[];
  painPreferences?: string[];
  executionCapabilities?: string[];
  capitalRoles?: string[];
  routingRules?: string[];
  visibility?: string[];
  privateAiNotes?: string;
};

type PainRoom = {
  id: string;
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
  aiRead?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
};

const ROOM_KEYS = [
  "vaultforge_clean_pain_rooms_v1",
  "vaultforge_clean_pain_rooms",
  "vaultforge_pain_rooms",
  "vaultforge_rooms_pain",
  "vf_pain_rooms",
];

const PROFILE_KEY = "vaultforge_profile_v2";
const STATE_KEY = "vaultforge_clean_room_states";

function safeParse<T>(raw: string | null, fallback: T): T {
  try {
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function readArray(key: string): PainRoom[] {
  if (typeof window === "undefined") return [];
  const parsed = safeParse<unknown>(window.localStorage.getItem(key), []);
  return Array.isArray(parsed) ? (parsed as PainRoom[]) : [];
}

function getRoomId(room: Partial<PainRoom> | null | undefined): string {
  if (!room) return "";
  return String(room.id || room.roomId || room.painId || "");
}

function readStates(): Record<string, RoomState> {
  if (typeof window === "undefined") return {};
  return safeParse<Record<string, RoomState>>(window.localStorage.getItem(STATE_KEY), {});
}

function writeStates(states: Record<string, RoomState>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STATE_KEY, JSON.stringify(states));
}

function readProfile(): ProfileData | null {
  if (typeof window === "undefined") return null;
  return safeParse<ProfileData | null>(window.localStorage.getItem(PROFILE_KEY), null);
}

function syncRoom(room: PainRoom) {
  if (typeof window === "undefined") return;

  const id = getRoomId(room);
  if (!id) return;

  const cleanRoom: PainRoom = stripOversizedLocalImages({ ...room, id, updatedAt: new Date().toISOString() });

  window.localStorage.setItem(`vaultforge_clean_pain_room_${id}`, JSON.stringify(cleanRoom));
  window.localStorage.setItem(`vaultforge_pain_room_${id}`, JSON.stringify(cleanRoom));

  for (const key of ROOM_KEYS) {
    const rows = readArray(key).filter((item) => getRoomId(item) !== id);
    window.localStorage.setItem(key, JSON.stringify([cleanRoom, ...rows]));
  }

  window.dispatchEvent(new Event("vaultforge-pain-change"));
}

function stripOversizedLocalImages(room: PainRoom): PainRoom {
  const next: PainRoom = { ...room };

  const urls = normalizePhotos(next);
  next.photoUrls = urls.filter((item) => !item.startsWith("data:"));
  delete next.photo;
  delete next.photoDataUrl;

  return next;
}

function findRoom(id: string): PainRoom | null {
  if (typeof window === "undefined") return null;

  const states = readStates();

  const directKeys = [`vaultforge_clean_pain_room_${id}`, `vaultforge_pain_room_${id}`, `vf_pain_room_${id}`];

  for (const key of directKeys) {
    const parsed = safeParse<PainRoom | null>(window.localStorage.getItem(key), null);
    if (parsed && getRoomId(parsed)) {
      const foundId = getRoomId(parsed);
      return { ...parsed, id: foundId, roomState: states[foundId] || parsed.roomState || "active" };
    }
  }

  for (const key of ROOM_KEYS) {
    const hit = readArray(key).find((room) => getRoomId(room) === id);
    if (hit) {
      const foundId = getRoomId(hit);
      return { ...hit, id: foundId, roomState: states[foundId] || hit.roomState || "active" };
    }
  }

  return null;
}

function text(value: unknown, fallback = "Not listed"): string {
  if (value === undefined || value === null) return fallback;
  const cleaned = String(value).trim();
  return cleaned ? cleaned : fallback;
}

function value(room: PainRoom | null, keys: string[], fallback = "Not listed"): string {
  if (!room) return fallback;

  for (const key of keys) {
    const candidate = room[key];
    if (candidate !== undefined && candidate !== null && String(candidate).trim()) {
      return String(candidate);
    }
  }

  return fallback;
}

function normalizeList(input: unknown): string[] {
  if (Array.isArray(input)) return input.map((item) => String(item).trim()).filter(Boolean);
  if (typeof input === "string" && input.trim()) {
    return input.split(",").map((item) => item.trim()).filter(Boolean);
  }
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

function normalizePhotos(room: PainRoom | null): string[] {
  if (!room) return [];

  const candidates: unknown[] = [
    room.photoUrls,
    room.photos,
    room.photoUrl,
    room.photo,
    room.imageUrl,
    room.publicUrl,
  ];

  const output: string[] = [];

  for (const candidate of candidates) {
    const items = normalizeList(candidate);
    for (const item of items) {
      if (item && !output.includes(item)) output.push(item);
    }
  }

  return output;
}

function money(value: unknown): string {
  const raw = String(value || "").trim();
  if (!raw) return "Not listed";
  if (raw.includes("$")) return raw;

  const number = Number(raw.replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(number) || number <= 0) return raw;

  return number.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function roomLocation(room: PainRoom | null): string {
  return [value(room, ["city"], ""), value(room, ["county"], ""), value(room, ["state"], "")]
    .filter(Boolean)
    .join(", ") || "Market not listed";
}

function pressureScore(room: PainRoom | null): number {
  if (!room) return 0;

  const urgency = arr(room, ["urgency"]).join(" ").toLowerCase();
  const blockers = arr(room, ["blockers"]).length;
  const amount = Number(value(room, ["amountNeeded"], "0").replace(/[^0-9.]/g, "")) || 0;
  const timeline = value(room, ["timeline"], "").toLowerCase();

  let score = 42;
  if (urgency.includes("emergency")) score += 35;
  if (urgency.includes("critical")) score += 30;
  if (urgency.includes("high")) score += 22;
  if (timeline.includes("today")) score += 14;
  if (timeline.includes("48")) score += 10;
  score += Math.min(18, blockers * 4);
  if (amount >= 250000) score += 10;
  if (amount >= 50000) score += 6;

  return Math.max(1, Math.min(99, score));
}

function scoreProfile(room: PainRoom | null, profile: ProfileData | null): number {
  if (!room || !profile) return 0;

  let score = 0;
  const state = value(room, ["state"], "");
  const county = value(room, ["county"], "");
  const assetClass = value(room, ["assetClass"], "").toLowerCase();
  const routingNeeds = arr(room, ["routingNeeds"]).join(" ").toLowerCase();
  const painTypes = arr(room, ["painTypes"]).join(" ").toLowerCase();

  if (state && profile.alertStates?.includes(state)) score += 20;
  if (state && profile.buyStates?.includes(state)) score += 12;
  if (state && profile.operateStates?.includes(state)) score += 12;
  if (state && profile.contactStates?.includes(state)) score += 8;
  if (county && state && profile.countiesByState?.[state]?.includes(county)) score += 15;

  for (const asset of profile.assetTypes || []) {
    if (assetClass && asset.toLowerCase().includes(assetClass.toLowerCase())) score += 10;
    if (assetClass === "residential" && ["sfr", "multifamily"].includes(asset.toLowerCase())) score += 6;
    if (assetClass === "commercial" && ["commercial", "retail", "office", "industrial", "mixed use"].includes(asset.toLowerCase())) score += 6;
    if (assetClass === "land" && asset.toLowerCase().includes("land")) score += 8;
  }

  for (const role of profile.memberTypes || []) {
    const lower = role.toLowerCase();
    if (routingNeeds.includes(lower)) score += 10;
    if (painTypes.includes("funding") && lower.includes("lender")) score += 12;
    if (painTypes.includes("operator") && lower.includes("operator")) score += 12;
    if (painTypes.includes("contractor") && lower.includes("contractor")) score += 12;
  }

  for (const capability of profile.executionCapabilities || []) {
    const lower = capability.toLowerCase();
    if (routingNeeds.includes(lower)) score += 6;
    if (painTypes.includes("permit") && lower.includes("permitting")) score += 8;
    if (painTypes.includes("construction") && lower.includes("construction")) score += 8;
  }

  for (const capital of profile.capitalRoles || []) {
    const lower = capital.toLowerCase();
    if (routingNeeds.includes("capital") && (lower.includes("lender") || lower.includes("cash") || lower.includes("capital"))) score += 10;
  }

  if (profile.routingRules?.includes("Allow AI Routing")) score += 8;
  if (profile.routingRules?.includes("Urgent Alerts")) score += 5;

  return Math.min(100, score);
}

function matchReason(room: PainRoom | null, profile: ProfileData | null): string {
  if (!room || !profile) return "No saved member profile found. Save a profile first so VaultForge can route this room.";

  const reasons: string[] = [];
  const state = value(room, ["state"], "");
  const county = value(room, ["county"], "");
  const assetClass = value(room, ["assetClass"], "");

  if (state && profile.alertStates?.includes(state)) reasons.push(`alert state ${state}`);
  if (state && profile.buyStates?.includes(state)) reasons.push(`buy state ${state}`);
  if (state && profile.operateStates?.includes(state)) reasons.push(`operates in ${state}`);
  if (county && state && profile.countiesByState?.[state]?.includes(county)) reasons.push(`${county} County selected`);
  if (assetClass && (profile.assetTypes || []).some((asset) => asset.toLowerCase().includes(assetClass.toLowerCase()))) reasons.push(`${assetClass} asset fit`);

  const routeNeeds = arr(room, ["routingNeeds"]);
  if (routeNeeds.length) reasons.push(`routing need: ${routeNeeds.slice(0, 3).join(", ")}`);

  return reasons.length ? reasons.join(" • ") : "Profile exists, but more profile chips are needed for a stronger route match.";
}

function solutionRead(room: PainRoom | null): string {
  if (!room) return "";

  const pain = arr(room, ["painTypes"]).join(", ") || "problem";
  const blockers = arr(room, ["blockers"]).join(", ") || "blockers not selected";
  const routing = arr(room, ["routingNeeds"]).join(", ") || "routing not selected";
  const pressure = pressureScore(room);
  const location = roomLocation(room);
  const ask = money(value(room, ["askingPrice"], ""));
  const valueText = money(value(room, ["propertyValue", "arv"], ""));
  const amount = money(value(room, ["amountNeeded"], ""));

  return `This room is showing ${pain} in ${location}. Pressure score is ${pressure}/99. The current blockers are ${blockers}. The room should route toward ${routing}. Property/value context: ask ${ask}, value ${valueText}, amount needed ${amount}. Next move: confirm contact authority, verify numbers, identify the blocking constraint, match the right member profile, and move the cleanest solution path into Messages.`;
}

function createMessageHref(room: PainRoom | null): string {
  if (!room) return "/messages";
  const id = getRoomId(room);
  const title = value(room, ["title"], "Pain Room");
  const subject = `Pain Room: ${title}`;
  return `/messages?type=pain&room=${encodeURIComponent(id)}&subject=${encodeURIComponent(subject)}`;
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div style={factCard}>
      <div style={miniEyebrow}>{label}</div>
      <div style={factValue}>{value || "Not listed"}</div>
    </div>
  );
}

function PhotoGrid({ photos }: { photos: string[] }) {
  if (!photos.length) {
    return <div style={emptyPhoto}>No photo URL saved for this room</div>;
  }

  return (
    <div style={photoGrid}>
      {photos.slice(0, 5).map((photo, index) => (
        <img key={`${photo}-${index}`} src={photo} alt={`Pain room photo ${index + 1}`} style={photoStyle} />
      ))}
    </div>
  );
}

export default function PainRoomDetailPage() {
  const params = useParams();
  const id = decodeURIComponent(String(params?.id || ""));

  const [room, setRoom] = useState<PainRoom | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);

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

    const roomId = getRoomId(room);
    const next: PainRoom = { ...room, id: roomId, roomState: state, updatedAt: new Date().toISOString() };

    const states = readStates();
    states[roomId] = state;
    writeStates(states);

    syncRoom(next);
    setRoom(next);
  }

  const photos = useMemo(() => normalizePhotos(room), [room]);
  const painTypes = useMemo(() => arr(room, ["painTypes"]), [room]);
  const urgency = useMemo(() => arr(room, ["urgency"]), [room]);
  const blockers = useMemo(() => arr(room, ["blockers"]), [room]);
  const routingNeeds = useMemo(() => arr(room, ["routingNeeds"]), [room]);
  const solutionLanes = useMemo(() => arr(room, ["solutionLanes"]), [room]);
  const fit = useMemo(() => scoreProfile(room, profile), [room, profile]);
  const messageHref = useMemo(() => createMessageHref(room), [room]);
  const analysis = useMemo(() => solutionRead(room), [room]);

  if (!room) {
    return (
      <main style={page}>
        <div style={wrap}>
          <nav style={nav}>
            <Link href="/pain-rooms" style={goldBtn}>Back to Pain Rooms</Link>
            <Link href="/pain-intake" style={btn}>Create Pain Room</Link>
            <Link href="/command" style={btn}>Command</Link>
          </nav>

          <section style={card}>
            <div style={eyebrow}>Pain Room</div>
            <h1 style={h1}>Room not found.</h1>
            <p style={sub}>This room was not found in local saved Pain Rooms. Go back to Pain Rooms and open a saved room.</p>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main style={page}>
      <div style={wrap}>
        <nav style={nav}>
          <Link href="/command" style={btn}>Command</Link>
          <Link href="/deal-rooms" style={btn}>Deal Rooms</Link>
          <Link href="/pain-rooms" style={goldBtn}>Pain Rooms</Link>
          <Link href={messageHref} style={btn}>Message Owner</Link>
          <Link href="/profile" style={btn}>Profile</Link>
          <Link href="/" style={redBtn}>Exit</Link>
        </nav>

        <section style={card}>
          <PhotoGrid photos={photos} />
          <div style={eyebrow}>{value(room, ["assetClass"], "Pain Room")}</div>
          <h1 style={h1}>{value(room, ["title"], "Untitled Pain Room")}</h1>
          <p style={sub}>{roomLocation(room)}</p>
          <div style={pressureBadge}>{pressureScore(room)}/99 Pressure</div>
        </section>

        <section style={card}>
          <div style={eyebrow}>Room Controls</div>
          <div style={actionRow}>
            <button type="button" onClick={() => setRoomState("saved")} style={goldBtn}>Save</button>
            <button type="button" onClick={() => setRoomState("archived")} style={btn}>Archive</button>
            <button type="button" onClick={() => setRoomState("deleted")} style={redBtn}>Delete</button>
            <Link href={messageHref} style={goldBtn}>Message Owner</Link>
            <span style={btn}>Current: {room.roomState || "active"}</span>
          </div>
        </section>

        <section style={card}>
          <div style={eyebrow}>Problem Analysis</div>
          <h2 style={h2}>What is broken, what blocks it, and who can solve it.</h2>
          <p style={sub}>{analysis}</p>
        </section>

        <section style={card}>
          <div style={eyebrow}>Solution Path</div>
          <div style={grid}>
            <Fact label="Problem Type" value={painTypes.join(", ") || "Not selected"} />
            <Fact label="Urgency" value={urgency.join(", ") || "Not selected"} />
            <Fact label="Blockers" value={blockers.join(", ") || "Not selected"} />
            <Fact label="Route To" value={routingNeeds.join(", ") || "Not selected"} />
            <Fact label="Solution Lanes" value={solutionLanes.join(", ") || "Analyze, Verify, Route, Message, Execute"} />
            <Fact label="Target Outcome" value={value(room, ["targetOutcome"])} />
          </div>
        </section>

        <section style={card}>
          <div style={eyebrow}>Property / Asset Facts</div>
          <div style={grid}>
            <Fact label="Asset Class" value={value(room, ["assetClass"])} />
            <Fact label="Address" value={value(room, ["address"])} />
            <Fact label="Ask" value={money(value(room, ["askingPrice"], ""))} />
            <Fact label="Value / ARV" value={money(value(room, ["propertyValue", "arv"], ""))} />
            <Fact label="Repairs / Work" value={money(value(room, ["repairs"], ""))} />
            <Fact label="Amount Needed" value={money(value(room, ["amountNeeded"], ""))} />
            <Fact label="Payoff" value={money(value(room, ["payoff"], ""))} />
            <Fact label="Beds" value={value(room, ["beds"])} />
            <Fact label="Baths" value={value(room, ["baths"])} />
            <Fact label="Sqft" value={value(room, ["sqft"])} />
            <Fact label="Units" value={value(room, ["units"])} />
            <Fact label="Building" value={value(room, ["buildingSize"])} />
            <Fact label="Acres" value={value(room, ["acres"])} />
            <Fact label="Zoning" value={value(room, ["zoning"])} />
            <Fact label="Occupancy" value={value(room, ["occupancy"])} />
            <Fact label="Access" value={value(room, ["access"])} />
          </div>
        </section>

        <section style={card}>
          <div style={eyebrow}>Owner / Contact</div>
          <div style={grid}>
            <Fact label="Name" value={value(room, ["contactName"])} />
            <Fact label="Phone" value={value(room, ["contactPhone"])} />
            <Fact label="Email" value={value(room, ["contactEmail"])} />
            <Fact label="Best Contact" value={value(room, ["bestContact"])} />
            <Fact label="Authority" value={value(room, ["authority"])} />
            <Fact label="Timeline" value={value(room, ["timeline"])} />
          </div>
        </section>

        <section style={card}>
          <div style={eyebrow}>AI Routed Profile</div>
          <h2 style={h2}>Best saved member/profile fit.</h2>

          {profile ? (
            <div style={profileCard}>
              {profile.profilePhoto ? <img src={profile.profilePhoto} alt="Profile" style={profilePhoto} /> : <div style={profileMissing}>No profile photo</div>}
              <div>
                <h3 style={profileTitle}>{profile.fullName || profile.company || "Saved Profile"}</h3>
                <p style={sub}>{profile.company || "Company not listed"}</p>
                <div style={pillWrap}>
                  <span style={pill}>Fit score: {fit}%</span>
                  <span style={pill}>Types: {(profile.memberTypes || []).join(", ") || "Not selected"}</span>
                  <span style={pill}>Contact: {(profile.preferredContact || []).join(", ") || "Not selected"}</span>
                  <span style={pill}>Phone: {profile.phone || "Not listed"}</span>
                  <span style={pill}>Email: {profile.email || "Not listed"}</span>
                </div>
                <p style={{ ...sub, fontSize: 18, marginTop: 16 }}>{matchReason(room, profile)}</p>
              </div>
            </div>
          ) : (
            <p style={sub}>No saved profile found. Save a profile so VaultForge can route Pain Rooms automatically.</p>
          )}
        </section>

        <section style={card}>
          <div style={eyebrow}>Notes / Current State</div>
          <div style={grid}>
            <Fact label="Current State" value={value(room, ["currentState"])} />
            <Fact label="Root Cause" value={value(room, ["rootCause"])} />
            <Fact label="Constraints" value={value(room, ["constraints"])} />
            <Fact label="Risk Level" value={value(room, ["riskLevel"])} />
          </div>

          <div style={noteBox}>
            <div style={miniEyebrow}>AI Room Read</div>
            <p style={sub}>{value(room, ["aiRead"], analysis)}</p>
          </div>

          <div style={noteBox}>
            <div style={miniEyebrow}>Private Notes</div>
            <p style={sub}>{value(room, ["notes"], "No notes saved.")}</p>
          </div>
        </section>
      </div>
    </main>
  );
}

const page: React.CSSProperties = {
  minHeight: "100vh",
  background: "#05070d",
  color: "#f7f7fb",
  padding: 18,
  fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
};

const wrap: React.CSSProperties = {
  maxWidth: 1180,
  margin: "0 auto",
  paddingBottom: 70,
};

const nav: React.CSSProperties = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  marginBottom: 18,
};

const card: React.CSSProperties = {
  background: "linear-gradient(180deg,#080d19,#050816)",
  border: "1px solid rgba(245,197,66,.28)",
  borderRadius: 26,
  padding: 28,
  marginBottom: 22,
};

const eyebrow: React.CSSProperties = {
  color: "#ffd45a",
  textTransform: "uppercase",
  letterSpacing: 8,
  fontWeight: 900,
  fontSize: 19,
  marginBottom: 14,
};

const miniEyebrow: React.CSSProperties = {
  color: "#ffd45a",
  textTransform: "uppercase",
  letterSpacing: 5,
  fontWeight: 900,
  fontSize: 13,
  marginBottom: 10,
};

const h1: React.CSSProperties = {
  fontSize: "clamp(42px,7vw,76px)",
  lineHeight: 0.92,
  letterSpacing: -4,
  margin: "0 0 18px",
  fontWeight: 950,
};

const h2: React.CSSProperties = {
  fontSize: "clamp(30px,5vw,48px)",
  lineHeight: 1,
  letterSpacing: -2,
  margin: "0 0 16px",
  fontWeight: 950,
};

const sub: React.CSSProperties = {
  color: "#c9d0dc",
  fontSize: 22,
  lineHeight: 1.35,
  margin: 0,
};

const btn: React.CSSProperties = {
  border: "1px solid rgba(207,216,230,.18)",
  background: "#171c29",
  color: "#f7f7fb",
  borderRadius: 999,
  padding: "13px 18px",
  fontWeight: 950,
  textDecoration: "none",
  display: "inline-block",
  cursor: "pointer",
};

const goldBtn: React.CSSProperties = {
  ...btn,
  border: 0,
  background: "#ffdc68",
  color: "#10131a",
};

const redBtn: React.CSSProperties = {
  ...btn,
  background: "#271016",
  borderColor: "rgba(255,70,70,.48)",
  color: "#ffaaaa",
};

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(245px, 1fr))",
  gap: 18,
};

const factCard: React.CSSProperties = {
  background: "#121724",
  border: "1px solid rgba(207,216,230,.14)",
  borderRadius: 20,
  padding: 22,
};

const factValue: React.CSSProperties = {
  fontSize: 23,
  fontWeight: 850,
  color: "#f7f7fb",
};

const photoGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
  gap: 12,
  marginBottom: 24,
};

const photoStyle: React.CSSProperties = {
  width: "100%",
  height: 240,
  objectFit: "cover",
  borderRadius: 22,
  border: "1px solid rgba(207,216,230,.2)",
};

const emptyPhoto: React.CSSProperties = {
  border: "1px dashed rgba(207,216,230,.25)",
  borderRadius: 24,
  padding: 70,
  textAlign: "center",
  color: "#c9d0dc",
  marginBottom: 24,
  fontSize: 22,
};

const pressureBadge: React.CSSProperties = {
  marginTop: 18,
  display: "inline-block",
  borderRadius: 999,
  padding: "12px 16px",
  background: "#ffdc68",
  color: "#10131a",
  fontWeight: 950,
};

const actionRow: React.CSSProperties = {
  display: "flex",
  gap: 12,
  flexWrap: "wrap",
};

const profileCard: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "160px 1fr",
  gap: 20,
  alignItems: "start",
};

const profilePhoto: React.CSSProperties = {
  width: 160,
  height: 160,
  objectFit: "cover",
  borderRadius: 24,
  border: "1px solid rgba(245,197,66,.34)",
};

const profileMissing: React.CSSProperties = {
  width: 160,
  height: 160,
  borderRadius: 24,
  border: "1px dashed rgba(245,197,66,.34)",
  display: "grid",
  placeItems: "center",
  color: "#c9d0dc",
  textAlign: "center",
};

const profileTitle: React.CSSProperties = {
  fontSize: 34,
  margin: "0 0 8px",
  lineHeight: 1,
};

const pillWrap: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 10,
  marginTop: 16,
};

const pill: React.CSSProperties = {
  border: "1px solid rgba(207,216,230,.18)",
  background: "#171c29",
  color: "#f7f7fb",
  borderRadius: 999,
  padding: "9px 12px",
  fontWeight: 850,
  fontSize: 13,
};

const noteBox: React.CSSProperties = {
  marginTop: 18,
  padding: 22,
  borderRadius: 22,
  border: "1px solid rgba(207,216,230,.14)",
  background: "#121724",
};

