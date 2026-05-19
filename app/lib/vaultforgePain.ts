"use client";

export type PainState = "active" | "saved" | "archived" | "deleted";

export type PainRoom = {
  id: string;
  title: string;
  state: string;
  city: string;
  county: string;
  address: string;
  assetClass: "Residential" | "Commercial" | "Land";
  propertyType: string;
  painTypes: string[];
  needs: string[];
  blockers: string[];
  risks: string[];
  severity: string;
  timePressure: string;
  capitalPressure: string;
  controlStatus: string;
  currentStatus: string;
  ownerSituation: string;
  accessStatus: string;
  titleStatus: string;
  permitStatus: string;
  insuranceStatus: string;
  legalStatus: string;
  askPrice: string;
  value: string;
  repairs: string;
  monthlyBurn: string;
  moneyNeededNow: string;
  deadline: string;
  rootCause: string;
  bestOutcome: string;
  worstCase: string;
  desiredSolution: string;
  contactName: string;
  phone: string;
  email: string;
  bestContact: string;
  notes: string;
  photos: string[];
  coverPhoto: string;
  roomState: PainState;
  alertRead: boolean;
  viewedAt: string;
  createdAt: string;
  updatedAt: string;
};

export const PAIN_STORE_KEY = "vaultforge_clean_pain_rooms_v2";
export const PAIN_LEGACY_KEYS = [
  "vaultforge_clean_pain_rooms_v1",
  "vaultforge_clean_pain_rooms",
  "vaultforge_pain_rooms",
  "vaultforge_rooms_pain",
  "vf_pain_rooms",
];
export const PAIN_STATE_KEY = "vaultforge_pain_room_state_v2";

export const STATES = ["GA", "TN", "AL", "FL", "NC", "SC", "TX"];
export const ASSETS = ["Residential", "Commercial", "Land"];
export const RES_TYPES = ["Single Family", "Duplex", "Triplex", "Quad", "Townhome", "Condo", "Mobile Home", "Small Multifamily", "Apartment"];
export const COM_TYPES = ["Retail", "Office", "Industrial", "Warehouse", "Hotel", "Self Storage", "Mixed Use", "Medical", "Restaurant", "Automotive", "Special Use"];
export const LAND_TYPES = ["Infill Lot", "Acreage", "Entitled Land", "Raw Land", "Commercial Pad", "Subdivision", "Timber", "Farm", "Assemblage"];
export const PAIN_TYPES = ["Funding Gap", "Foreclosure", "Stalled Construction", "Contractor Problem", "Title Problem", "Permit Problem", "City Violation", "Tenant Issue", "Partnership Dispute", "Emergency Exit", "Insurance Claim", "Fire Damage", "Mold", "Structural", "Probate", "Tax Sale Risk", "Squatter Issue", "Burn Rate", "Seller Pressure", "Lender Problem", "Failed Closing"];
export const NEEDS = ["Lender", "Operator", "Contractor", "Buyer", "Attorney", "Insurance Adjuster", "City Expeditor", "Private Capital", "Property Manager", "Developer"];
export const BLOCKERS = ["Capital", "Timeline", "Title", "Access", "Contractor", "Tenant", "Permit", "City", "Legal", "Partner", "Seller Pressure", "Unknown Numbers", "Insurance", "Utilities", "Appraisal", "Inspection"];
export const RISKS = ["Legal", "Financial", "Structural", "Operational", "City/Permit", "Occupancy", "Environmental", "Insurance", "Market", "Reputation"];
export const SEVERITY = ["Low", "Medium", "High", "Critical", "Emergency"];
export const TIME = ["24 Hours", "72 Hours", "7 Days", "14 Days", "30 Days", "Flexible"];
export const CAPITAL = ["Unknown", "Under $25k", "$25k-$100k", "$100k-$250k", "$250k-$1M", "$1M+"];
export const CONTROL_STATUS = ["Unknown", "Owner Controlled", "Contract Controlled", "Partner Controlled", "Bank Controlled", "Court / Estate", "No Control Yet"];
export const CONTACT = ["VaultForge Message", "Phone", "Text", "Email", "Contact Form"];

export const CITY_COUNTY: Record<string, string> = {
  atlanta: "Fulton",
  alpharetta: "Fulton",
  roswell: "Fulton",
  marietta: "Cobb",
  smyrna: "Cobb",
  kennesaw: "Cobb",
  cartersville: "Bartow",
  cville: "Bartow",
  cvile: "Bartow",
  adairsville: "Bartow",
  rome: "Floyd",
  gainesville: "Hall",
  savannah: "Chatham",
  augusta: "Richmond",
  columbus: "Muscogee",
  macon: "Bibb",
  chattanooga: "Hamilton",
  nashville: "Davidson",
  knoxville: "Knox",
  birmingham: "Jefferson",
  huntsville: "Madison",
  charlotte: "Mecklenburg",
  raleigh: "Wake",
  greenville: "Greenville",
  charleston: "Charleston",
  dallas: "Dallas",
  houston: "Harris",
  austin: "Travis",
  "san antonio": "Bexar",
  sanantonio: "Bexar",
};

export function isBrowser() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function safeText(value: unknown, fallback = "") {
  const clean = String(value || "").trim();
  return clean || fallback;
}

export function safeList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  if (typeof value === "string" && value.trim()) return value.split(",").map((item) => item.trim()).filter(Boolean);
  return [];
}

export function parseJson<T>(raw: string | null, fallback: T): T {
  try {
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function propertyTypesFor(assetClass: string) {
  if (assetClass === "Commercial") return COM_TYPES;
  if (assetClass === "Land") return LAND_TYPES;
  return RES_TYPES;
}

export function countyFromCity(city: string) {
  return CITY_COUNTY[city.trim().toLowerCase().replace(/\s+/g, " ")] || "";
}

export function moneyNumber(value: unknown) {
  const number = Number(String(value || "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(number) ? number : 0;
}

export function locationFor(room: Partial<PainRoom>) {
  return [safeText(room.city), safeText(room.county), safeText(room.state)].filter(Boolean).join(", ") || "Market not listed";
}

export function defaultPainRoom(): PainRoom {
  const now = new Date().toISOString();

  return {
    id: "",
    title: "",
    state: "GA",
    city: "",
    county: "",
    address: "",
    assetClass: "Residential",
    propertyType: "Single Family",
    painTypes: ["Funding Gap"],
    needs: ["Lender"],
    blockers: [],
    risks: [],
    severity: "High",
    timePressure: "7 Days",
    capitalPressure: "Unknown",
    controlStatus: "Unknown",
    currentStatus: "",
    ownerSituation: "",
    accessStatus: "",
    titleStatus: "",
    permitStatus: "",
    insuranceStatus: "",
    legalStatus: "",
    askPrice: "",
    value: "",
    repairs: "",
    monthlyBurn: "",
    moneyNeededNow: "",
    deadline: "",
    rootCause: "",
    bestOutcome: "",
    worstCase: "",
    desiredSolution: "",
    contactName: "",
    phone: "",
    email: "",
    bestContact: "VaultForge Message",
    notes: "",
    photos: [],
    coverPhoto: "",
    roomState: "active",
    alertRead: false,
    viewedAt: "",
    createdAt: now,
    updatedAt: now,
  };
}

export function normalizePainRoom(value: any): PainRoom {
  const base = defaultPainRoom();
  const id = safeText(value?.id || value?.roomId || value?.painId || value?.signalId || "");
  const photos = safeList(value?.photos || value?.photoUrls);
  const coverPhoto = safeText(value?.coverPhoto || value?.photoUrl || value?.imageUrl || photos[0] || "");

  return {
    ...base,
    ...value,
    id,
    title: safeText(value?.title || value?.name || value?.painTitle || value?.problemTitle, "Untitled Pain Room"),
    state: safeText(value?.state, "GA"),
    city: safeText(value?.city),
    county: safeText(value?.county),
    address: safeText(value?.address || value?.location),
    assetClass: (["Residential", "Commercial", "Land"].includes(safeText(value?.assetClass)) ? safeText(value?.assetClass) : "Residential") as PainRoom["assetClass"],
    propertyType: safeText(value?.propertyType, "Single Family"),
    painTypes: safeList(value?.painTypes || value?.pain_type || value?.problemTypes).length ? safeList(value?.painTypes || value?.pain_type || value?.problemTypes) : ["Funding Gap"],
    needs: safeList(value?.needs || value?.routingNeeds).length ? safeList(value?.needs || value?.routingNeeds) : ["Lender"],
    blockers: safeList(value?.blockers),
    risks: safeList(value?.risks || value?.riskTypes),
    photos,
    coverPhoto,
    roomState: (["active", "saved", "archived", "deleted"].includes(safeText(value?.roomState || value?.cleanupState || value?.stateStatus)) ? safeText(value?.roomState || value?.cleanupState || value?.stateStatus) : "active") as PainState,
    createdAt: safeText(value?.createdAt, new Date().toISOString()),
    updatedAt: safeText(value?.updatedAt, new Date().toISOString()),
  };
}

export function readPainRooms(): PainRoom[] {
  if (!isBrowser()) return [];

  const rooms: PainRoom[] = [];
  const seen = new Set<string>();

  const main = parseJson<any[]>(localStorage.getItem(PAIN_STORE_KEY), []);
  for (const row of main) {
    const room = normalizePainRoom(row);
    if (!room.id || seen.has(room.id)) continue;
    seen.add(room.id);
    rooms.push(room);
  }

  for (const key of PAIN_LEGACY_KEYS) {
    const legacy = parseJson<any[]>(localStorage.getItem(key), []);
    for (const row of legacy) {
      const room = normalizePainRoom(row);
      if (!room.id || seen.has(room.id)) continue;
      seen.add(room.id);
      rooms.push(room);
    }
  }

  const states = parseJson<Record<string, PainState>>(localStorage.getItem(PAIN_STATE_KEY), {});
  return rooms
    .map((room) => ({
      ...room,
      roomState: states[room.id] || room.roomState || "active",
    }))
    .sort((a, b) => String(b.createdAt || b.updatedAt).localeCompare(String(a.createdAt || a.updatedAt)));
}

export function readPainRoom(id: string): PainRoom | null {
  if (!isBrowser()) return null;
  const direct = parseJson<any | null>(localStorage.getItem(`vaultforge_pain_room_${id}`), null);
  if (direct) return normalizePainRoom(direct);
  return readPainRooms().find((room) => room.id === id) || null;
}

export function savePainRoom(room: PainRoom) {
  if (!isBrowser()) return "";

  const id = room.id || `pain_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date().toISOString();
  const next = normalizePainRoom({
    ...room,
    id,
    roomId: id,
    roomState: "active",
    createdAt: room.createdAt || now,
    updatedAt: now,
    alertRead: false,
    viewedAt: "",
  });

  const existing = readPainRooms().filter((item) => item.id !== id);
  const all = [next, ...existing];

  localStorage.setItem(PAIN_STORE_KEY, JSON.stringify(all));
  localStorage.setItem(`vaultforge_pain_room_${id}`, JSON.stringify(next));

  const states = parseJson<Record<string, PainState>>(localStorage.getItem(PAIN_STATE_KEY), {});
  states[id] = "active";
  localStorage.setItem(PAIN_STATE_KEY, JSON.stringify(states));

  window.dispatchEvent(new Event("vaultforge-pain-change"));
  window.dispatchEvent(new Event("vaultforge-room-state-change"));
  return id;
}

export function setPainRoomState(id: string, state: PainState) {
  if (!isBrowser()) return;
  const rooms = readPainRooms().map((room) => room.id === id ? { ...room, roomState: state, updatedAt: new Date().toISOString() } : room);
  localStorage.setItem(PAIN_STORE_KEY, JSON.stringify(rooms));
  const found = rooms.find((room) => room.id === id);
  if (found) localStorage.setItem(`vaultforge_pain_room_${id}`, JSON.stringify(found));
  const states = parseJson<Record<string, PainState>>(localStorage.getItem(PAIN_STATE_KEY), {});
  states[id] = state;
  localStorage.setItem(PAIN_STATE_KEY, JSON.stringify(states));
  window.dispatchEvent(new Event("vaultforge-pain-change"));
  window.dispatchEvent(new Event("vaultforge-room-state-change"));
}

export function markPainRoomRead(id: string) {
  if (!isBrowser()) return;
  const room = readPainRoom(id);
  if (!room) return;
  const next = { ...room, alertRead: true, viewedAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  localStorage.setItem(`vaultforge_pain_room_${id}`, JSON.stringify(next));
  const rooms = readPainRooms().map((item) => item.id === id ? next : item);
  localStorage.setItem(PAIN_STORE_KEY, JSON.stringify(rooms));
  window.dispatchEvent(new Event("vaultforge-room-read-change"));
}

export async function compressImage(file: File, maxWidth = 620, quality = 0.42): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onerror = () => resolve("");
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => resolve("");
      img.onload = () => {
        try {
          const scale = Math.min(1, maxWidth / img.width);
          const canvas = document.createElement("canvas");
          canvas.width = Math.max(1, Math.round(img.width * scale));
          canvas.height = Math.max(1, Math.round(img.height * scale));
          const ctx = canvas.getContext("2d");
          if (!ctx) return resolve("");
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", quality));
        } catch {
          resolve("");
        }
      };
      img.src = String(reader.result || "");
    };
    reader.readAsDataURL(file);
  });
}

export async function photosFromFiles(files: FileList | null) {
  const selected = Array.from(files || []).slice(0, 10);
  const output: string[] = [];
  for (const file of selected) {
    const compressed = await compressImage(file);
    if (compressed) output.push(compressed);
  }
  return output;
}

export function painIntelligence(room: PainRoom) {
  let severityScore = 40;
  if (room.severity === "Medium") severityScore += 10;
  if (room.severity === "High") severityScore += 25;
  if (room.severity === "Critical") severityScore += 38;
  if (room.severity === "Emergency") severityScore += 48;
  if (room.timePressure === "24 Hours" || room.timePressure === "72 Hours") severityScore += 18;
  if (room.blockers.includes("Capital")) severityScore += 10;
  if (room.blockers.includes("Title") || room.blockers.includes("Legal")) severityScore += 8;
  severityScore = Math.max(0, Math.min(100, severityScore));

  const capitalScore = room.capitalPressure !== "Unknown" || room.painTypes.includes("Funding Gap") ? 78 : 35;
  const blockerScore = Math.max(10, Math.min(100, room.blockers.length * 12 + room.risks.length * 8));
  const difficulty = Math.max(20, Math.min(100, Math.round((severityScore + blockerScore + capitalScore) / 3)));

  const banner = severityScore >= 85
    ? "Immediate pressure signal"
    : severityScore >= 70
      ? "High-priority execution issue"
      : severityScore >= 50
        ? "Active problem needing routing"
        : "Monitor until facts are complete";

  const bestNextMove = room.controlStatus === "No Control Yet"
    ? "Secure control or authority first, then route to the solver network."
    : room.blockers.includes("Capital")
      ? "Confirm numbers, money needed now, and route to private capital or lender fit."
      : room.blockers.includes("Title")
        ? "Collect title facts and route to attorney/title solver before spending more capital."
        : "Identify the one blocker preventing execution and route to the highest-fit solver profile.";

  return {
    severityScore,
    capitalScore,
    blockerScore,
    difficulty,
    banner,
    bestNextMove,
    consequence: room.worstCase || "Delay, cost increase, failed closing, loss of control, or legal/financial escalation.",
  };
}
