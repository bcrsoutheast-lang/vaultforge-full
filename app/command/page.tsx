"use client";

import Link from "next/link";
import { useEffect, useState } from "react";


type RoomState = "active" | "saved" | "archived" | "deleted";
type RoomKind = "deal" | "pain";

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
  state?: string;
  city?: string;
  county?: string;
  address?: string;
  assetClass?: string;
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
  acres?: string;
  zoning?: string;
  occupancy?: string;
  access?: string;
  urgency?: string[] | string;
  routeTo?: string[] | string;
  routedTo?: string[] | string;
  routingNeeds?: string[] | string;
  painTypes?: string[] | string;
  blockers?: string[] | string;
  knownIssues?: string[] | string;
  docs?: string[] | string;
  availableDocs?: string[] | string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  bestContact?: string;
  submitterRole?: string;
  analyzer?: string;
  aiRead?: string;
  notes?: string;
  privateNotes?: string;
  photoUrls?: string[];
  photos?: string[];
  photoUrl?: string;
  imageUrl?: string;
  publicUrl?: string;
  createdAt?: string;
  updatedAt?: string;
  viewedAt?: string;
  alertRead?: boolean;
  [key: string]: unknown;
};

const DEAL_KEYS = ["vaultforge_clean_deal_rooms", "vaultforge_deal_rooms", "vaultforge_rooms_deals", "vf_deal_rooms"];
const PAIN_KEYS = ["vaultforge_clean_pain_rooms_v1", "vaultforge_clean_pain_rooms", "vaultforge_pain_rooms", "vaultforge_rooms_pain", "vf_pain_rooms"];
const ROOM_STATE_KEYS = ["vaultforge_clean_room_states", "vaultforge_room_states", "vaultforge_deal_room_states", "vaultforge_pain_room_states", "vaultforge_5s_room_states"];
const READ_KEY = "vaultforge_room_alert_read_v1";

function hasBrowser() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function parseJson<T>(raw: string | null, fallback: T): T {
  try {
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function cleanText(value: unknown, fallback = "") {
  const clean = String(value || "").trim();
  return clean || fallback;
}

function roomId(room: RoomRecord | null | undefined) {
  return cleanText(room?.id || room?.roomId || room?.dealId || room?.painId, "");
}

function asList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  if (typeof value === "string" && value.trim()) return value.split(",").map((item) => item.trim()).filter(Boolean);
  return [];
}

function val(room: RoomRecord | null | undefined, keys: string[], fallback = "Not listed") {
  if (!room) return fallback;
  for (const key of keys) {
    const got = room[key];
    if (got !== undefined && got !== null && String(got).trim()) return String(got);
  }
  return fallback;
}

function money(value: unknown) {
  const raw = cleanText(value, "");
  if (!raw) return "Not listed";
  if (raw.includes("$")) return raw;
  const n = Number(raw.replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(n) || n <= 0) return raw;
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function keysFor(kind: RoomKind) {
  return kind === "deal" ? DEAL_KEYS : PAIN_KEYS;
}

function directKeysFor(kind: RoomKind, id: string) {
  return [`vaultforge_clean_${kind}_room_${id}`, `vaultforge_${kind}_room_${id}`, `vf_${kind}_room_${id}`];
}

function readArray(key: string): RoomRecord[] {
  if (!hasBrowser()) return [];
  const parsed = parseJson<unknown>(window.localStorage.getItem(key), []);
  return Array.isArray(parsed) ? (parsed as RoomRecord[]) : [];
}

function readStates(): Record<string, RoomState> {
  if (!hasBrowser()) return {};
  const merged: Record<string, RoomState> = {};
  for (const key of ROOM_STATE_KEYS) {
    Object.assign(merged, parseJson<Record<string, RoomState>>(window.localStorage.getItem(key), {}));
  }
  return merged;
}

function writeStates(states: Record<string, RoomState>) {
  if (!hasBrowser()) return;
  for (const key of ROOM_STATE_KEYS) window.localStorage.setItem(key, JSON.stringify(states));
}

function getRoomState(room: RoomRecord, kind: RoomKind): RoomState {
  const states = readStates();
  const id = roomId(room);
  const status = states[`${kind}:${id}`] || states[id] || room.roomState || room.cleanupState || room.stateStatus || "active";
  if (status === "saved" || status === "archived" || status === "deleted") return status;
  return "active";
}

function readReadMap(): Record<string, string> {
  if (!hasBrowser()) return {};
  return parseJson<Record<string, string>>(window.localStorage.getItem(READ_KEY), {});
}

function isRoomRead(kind: RoomKind, room: RoomRecord) {
  const id = roomId(room);
  const map = readReadMap();
  return Boolean(map[`${kind}:${id}`] || map[id] || room.alertRead || room.viewedAt);
}

function markRoomRead(kind: RoomKind, room: RoomRecord) {
  if (!hasBrowser()) return;
  const id = roomId(room);
  if (!id) return;

  const now = new Date().toISOString();
  const readMap = readReadMap();
  readMap[id] = now;
  readMap[`${kind}:${id}`] = now;
  window.localStorage.setItem(READ_KEY, JSON.stringify(readMap));

  const next = { ...room, id, alertRead: true, viewedAt: now, updatedAt: room.updatedAt || now };

  for (const key of directKeysFor(kind, id)) window.localStorage.setItem(key, JSON.stringify(next));
  for (const key of keysFor(kind)) {
    const rows = readArray(key).filter((item) => roomId(item) !== id);
    window.localStorage.setItem(key, JSON.stringify([next, ...rows]));
  }

  window.dispatchEvent(new Event("storage"));
  window.dispatchEvent(new Event("vaultforge-room-read-change"));
  window.dispatchEvent(new Event(kind === "deal" ? "vaultforge-deal-change" : "vaultforge-pain-change"));
}

function syncRoomState(room: RoomRecord, kind: RoomKind, state: RoomState) {
  if (!hasBrowser()) return;
  const id = roomId(room);
  if (!id) return;

  const next = { ...room, id, roomState: state, cleanupState: state, stateStatus: state, updatedAt: new Date().toISOString() };

  for (const key of directKeysFor(kind, id)) window.localStorage.setItem(key, JSON.stringify(next));
  for (const key of keysFor(kind)) {
    const rows = readArray(key).filter((item) => roomId(item) !== id);
    window.localStorage.setItem(key, JSON.stringify([next, ...rows]));
  }

  const states = readStates();
  states[id] = state;
  states[`${kind}:${id}`] = state;
  writeStates(states);

  window.dispatchEvent(new Event("storage"));
  window.dispatchEvent(new Event("vaultforge-room-state-change"));
  window.dispatchEvent(new Event(kind === "deal" ? "vaultforge-deal-change" : "vaultforge-pain-change"));
}

function readRooms(kind: RoomKind): RoomRecord[] {
  if (!hasBrowser()) return [];
  const map = new Map<string, RoomRecord>();

  for (const key of keysFor(kind)) {
    for (const room of readArray(key)) {
      const id = roomId(room);
      if (id && !map.has(id)) map.set(id, { ...room, id });
    }
  }

  for (let i = 0; i < window.localStorage.length; i += 1) {
    const key = window.localStorage.key(i) || "";
    const isDeal = kind === "deal" && (key.startsWith("vaultforge_clean_deal_room_") || key.startsWith("vaultforge_deal_room_") || key.startsWith("vf_deal_room_"));
    const isPain = kind === "pain" && (key.startsWith("vaultforge_clean_pain_room_") || key.startsWith("vaultforge_pain_room_") || key.startsWith("vf_pain_room_"));
    if (!isDeal && !isPain) continue;

    const room = parseJson<RoomRecord | null>(window.localStorage.getItem(key), null);
    const id = roomId(room);
    if (room && id && !map.has(id)) map.set(id, { ...room, id });
  }

  return Array.from(map.values()).map((room) => ({ ...room, roomState: getRoomState(room, kind) }));
}

function titleFor(room: RoomRecord, kind: RoomKind) {
  return cleanText(room.title || room.name, kind === "deal" ? "Untitled Deal Room" : "Untitled Pain Room");
}

function locationFor(room: RoomRecord) {
  return [cleanText(room.city), cleanText(room.county), cleanText(room.state)].filter(Boolean).join(", ") || "Market not listed";
}

function hrefFor(kind: RoomKind, room: RoomRecord) {
  const id = encodeURIComponent(roomId(room));
  return kind === "deal" ? `/deal-rooms/${id}` : `/pain-rooms/${id}`;
}

function folderPath(state: RoomState) {
  if (state === "saved") return "/saved-rooms";
  if (state === "archived") return "/archived-rooms";
  if (state === "deleted") return "/deleted-rooms";
  return "/command";
}

function photos(room: RoomRecord | null | undefined) {
  if (!room) return [];
  const all = [
    ...(Array.isArray(room.photoUrls) ? room.photoUrls : []),
    ...(Array.isArray(room.photos) ? room.photos : []),
    room.photoUrl,
    room.imageUrl,
    room.publicUrl,
  ].map((item) => cleanText(item)).filter(Boolean);
  return Array.from(new Set(all)).filter((item) => !item.startsWith("data:")).slice(0, 10);
}

function firstPhoto(room: RoomRecord | null | undefined) {
  return photos(room)[0] || "";
}

function dealSpread(room: RoomRecord) {
  const value = Number(cleanText(room.propertyValue || room.arv, "").replace(/[^0-9.]/g, ""));
  const ask = Number(cleanText(room.askingPrice, "").replace(/[^0-9.]/g, ""));
  const repairs = Number(cleanText(room.repairs, "").replace(/[^0-9.]/g, ""));
  if (!value || !ask) return "Not enough numbers";
  const spread = value - ask - (Number.isFinite(repairs) ? repairs : 0);
  return money(String(spread));
}

function riskLabel(room: RoomRecord, kind: RoomKind) {
  const combined = [...asList(room.urgency), ...asList(room.knownIssues), ...asList(room.blockers), ...asList(room.painTypes)].join(" ").toLowerCase();
  if (combined.includes("critical") || combined.includes("emergency") || combined.includes("foreclosure")) return "Critical";
  if (combined.includes("high") || combined.includes("funding") || combined.includes("stalled") || combined.includes("tenant")) return "High";
  return kind === "pain" ? "Medium" : "Review";
}

function roomSignal(room: RoomRecord, kind: RoomKind) {
  if (kind === "deal") {
    return `${titleFor(room, kind)} is a ${cleanText(room.assetClass, "deal")} signal in ${locationFor(room)}. Ask ${money(room.askingPrice)}, value ${money(room.propertyValue || room.arv)}, repairs/work ${money(room.repairs)}. Estimated spread: ${dealSpread(room)}. Route to ${[...asList(room.routeTo), ...asList(room.routedTo), ...asList(room.routingNeeds)].join(", ") || "matched buyer/operator/lender profiles"}.`;
  }

  return `${titleFor(room, kind)} is a pressure room in ${locationFor(room)}. Pain type: ${asList(room.painTypes).join(", ") || "not selected"}. Urgency: ${asList(room.urgency).join(", ") || "not selected"}. Amount needed: ${money(room.amountNeeded)}. Payoff: ${money(room.payoff)}. Best next step: isolate blocker, verify authority/control, match the right capital/operator/contractor profile, then move the conversation into Messages.`;
}

function nextSteps(room: RoomRecord, kind: RoomKind) {
  if (kind === "deal") {
    return [
      "Verify owner/contact control and best contact method.",
      "Confirm ask, ARV/value, repairs, access, occupancy, and available docs.",
      "Route only to matched profiles by state, asset fit, and member type.",
      "Move qualified buyer/operator/lender conversation into the room message thread.",
    ];
  }

  return [
    "Classify the exact blocker: money, timeline, title, contractor, tenant, permit, or exit pressure.",
    "Verify decision-maker authority and what outcome solves the pain.",
    "Match the room to the member profile that can actually solve the blocker.",
    "Create a room message thread and track the solution conversation there.",
  ];
}

function readMessageRows(key: string): { read?: boolean; createdAt?: string }[] {
  if (!hasBrowser()) return [];
  const parsed = parseJson<unknown>(window.localStorage.getItem(key), []);
  return Array.isArray(parsed) ? parsed as { read?: boolean; createdAt?: string }[] : [];
}

function messageStats(kind: RoomKind) {
  if (!hasBrowser()) return { threads: 0, messages: 0, unread: 0 };
  let threads = 0;
  let messages = 0;
  let unread = 0;
  for (let i = 0; i < window.localStorage.length; i += 1) {
    const key = window.localStorage.key(i) || "";
    if (!key.startsWith(`vaultforge_room_messages_${kind}:`)) continue;
    const rows = readMessageRows(key);
    if (!rows.length) continue;
    threads += 1;
    messages += rows.length;
    unread += rows.filter((row) => !row.read).length;
  }
  return { threads, messages, unread };
}


export default function CommandPage() {
  const [deals, setDeals] = useState<RoomRecord[]>([]);
  const [pains, setPains] = useState<RoomRecord[]>([]);
  const [dealMessages, setDealMessages] = useState({ threads: 0, messages: 0, unread: 0 });
  const [painMessages, setPainMessages] = useState({ threads: 0, messages: 0, unread: 0 });

  function load() {
    setDeals(readRooms("deal"));
    setPains(readRooms("pain"));
    setDealMessages(messageStats("deal"));
    setPainMessages(messageStats("pain"));
  }

  useEffect(() => {
    load();
    const interval = window.setInterval(load, 2500);
    window.addEventListener("storage", load);
    window.addEventListener("vaultforge-room-state-change", load);
    window.addEventListener("vaultforge-room-read-change", load);
    window.addEventListener("vaultforge-deal-change", load);
    window.addEventListener("vaultforge-pain-change", load);
    window.addEventListener("vaultforge-message-change", load);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("storage", load);
      window.removeEventListener("vaultforge-room-state-change", load);
      window.removeEventListener("vaultforge-room-read-change", load);
      window.removeEventListener("vaultforge-deal-change", load);
      window.removeEventListener("vaultforge-pain-change", load);
      window.removeEventListener("vaultforge-message-change", load);
    };
  }, []);

  const dealActiveUnread = deals.filter((room) => getRoomState(room, "deal") === "active" && !isRoomRead("deal", room));
  const painActiveUnread = pains.filter((room) => getRoomState(room, "pain") === "active" && !isRoomRead("pain", room));

  const dealSaved = deals.filter((room) => getRoomState(room, "deal") === "saved");
  const dealArchived = deals.filter((room) => getRoomState(room, "deal") === "archived");
  const dealDeleted = deals.filter((room) => getRoomState(room, "deal") === "deleted");
  const painSaved = pains.filter((room) => getRoomState(room, "pain") === "saved");
  const painArchived = pains.filter((room) => getRoomState(room, "pain") === "archived");
  const painDeleted = pains.filter((room) => getRoomState(room, "pain") === "deleted");

  const liveTicker = [
    ...dealActiveUnread.slice(0, 5).map((room) => `NEW DEAL: ${titleFor(room, "deal")} • ${locationFor(room)}`),
    ...painActiveUnread.slice(0, 5).map((room) => `NEW PAIN: ${titleFor(room, "pain")} • ${locationFor(room)}`),
    dealMessages.unread ? `DEAL MESSAGES: ${dealMessages.unread} unread` : "",
    painMessages.unread ? `PAIN MESSAGES: ${painMessages.unread} unread` : "",
  ].filter(Boolean);

  return (
    <main style={page}>
      <style>{`
        @keyframes vfPulse {
          0% { box-shadow: 0 0 0 0 rgba(255, 70, 70, .45); transform: translateY(0); }
          70% { box-shadow: 0 0 0 13px rgba(255, 70, 70, 0); transform: translateY(-1px); }
          100% { box-shadow: 0 0 0 0 rgba(255, 70, 70, 0); transform: translateY(0); }
        }
        @keyframes vfGoldPulse {
          0% { box-shadow: 0 0 0 0 rgba(255, 220, 104, .40); transform: translateY(0); }
          70% { box-shadow: 0 0 0 13px rgba(255, 220, 104, 0); transform: translateY(-1px); }
          100% { box-shadow: 0 0 0 0 rgba(255, 220, 104, 0); transform: translateY(0); }
        }
        @keyframes vfTicker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>

      <div style={wrap}>
        <Nav />

        <section style={hero}>
          <div style={eyebrow}>Command Center</div>
          <h1 style={h1}>Live intelligence first.</h1>
          <p style={sub}>Unread active Deal/Pain rooms pulse here. Open the room and the alert is marked read, then it leaves this front alert desk.</p>
        </section>

        <section style={card}>
          <div style={row}>
            <div style={{ flex: 1 }}>
              <div style={eyebrow}>Live Alert Engine</div>
              <h2 style={h2}>Clean VaultForge Alert Desk.</h2>
              <p style={sub}>New unread work only. Saved, archived, deleted, and already-read rooms stay out of the pulse deck.</p>
            </div>
            <div style={livePill}>LIVE</div>
          </div>

          <div style={grid}>
            <LiveCard title="New Deals" count={dealActiveUnread.length} detail="Unread active deal alerts" href="/deal-rooms" pulse={dealActiveUnread.length > 0} tone="red" />
            <LiveCard title="New Pain" count={painActiveUnread.length} detail="Unread active pain alerts" href="/pain-rooms" pulse={painActiveUnread.length > 0} tone="red" />
            <LiveCard title="Deal Messages" count={dealMessages.unread} detail={`${dealMessages.messages} messages • ${dealMessages.threads} threads`} href="/messages?lane=deal" pulse={dealMessages.unread > 0} tone="gold" />
            <LiveCard title="Pain Messages" count={painMessages.unread} detail={`${painMessages.messages} messages • ${painMessages.threads} threads`} href="/messages?lane=pain" pulse={painMessages.unread > 0} tone="gold" />
          </div>

          {liveTicker.length ? (
            <div style={tickerShell}>
              <div style={tickerTrack}>
                {[...liveTicker, ...liveTicker].map((item, index) => (
                  <span key={`${item}-${index}`} style={tickerItem}>{item}</span>
                ))}
              </div>
            </div>
          ) : null}
        </section>

        <section style={card}>
          <div style={eyebrow}>5S Room Folders</div>
          <h2 style={h2}>Six separate folders.</h2>
          <div style={grid}>
            <FolderCard title="Saved Deals" count={dealSaved.length} href="/saved-rooms?type=deal" />
            <FolderCard title="Archived Deals" count={dealArchived.length} href="/archived-rooms?type=deal" />
            <FolderCard title="Deleted Deals" count={dealDeleted.length} href="/deleted-rooms?type=deal" />
            <FolderCard title="Saved Pain" count={painSaved.length} href="/saved-rooms?type=pain" />
            <FolderCard title="Archived Pain" count={painArchived.length} href="/archived-rooms?type=pain" />
            <FolderCard title="Deleted Pain" count={painDeleted.length} href="/deleted-rooms?type=pain" />
          </div>
        </section>

        <section style={twoGrid}>
          <AlertLane title="Unread Deal Alerts" kind="deal" rooms={dealActiveUnread.slice(0, 6)} />
          <ExecutionLane dealRooms={dealActiveUnread.slice(0, 3)} painRooms={painActiveUnread.slice(0, 3)} />
        </section>

        <section style={twoGrid}>
          <AlertLane title="Unread Pain Alerts" kind="pain" rooms={painActiveUnread.slice(0, 6)} />
          <section style={panel}>
            <div style={eyebrow}>Message Alerts</div>
            <div style={stack}>
              <LiveCard title="Deal Messages" count={dealMessages.unread} detail={`${dealMessages.messages} messages • ${dealMessages.threads} threads`} href="/messages?lane=deal" pulse={dealMessages.unread > 0} tone="gold" />
              <LiveCard title="Pain Messages" count={painMessages.unread} detail={`${painMessages.messages} messages • ${painMessages.threads} threads`} href="/messages?lane=pain" pulse={painMessages.unread > 0} tone="gold" />
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}

function Nav() {
  return (
    <nav style={nav}>
      <div style={brand}>VAULTFORGE</div>
      <Link href="/command" style={goldBtn}>Command</Link>
      <Link href="/deal-rooms" style={btn}>Deal Rooms</Link>
      <Link href="/deal-create" style={btn}>Create Deal</Link>
      <Link href="/pain-intake" style={btn}>Pain Intake</Link>
      <Link href="/pain-rooms" style={btn}>Pain Rooms</Link>
      <Link href="/messages" style={btn}>Messages</Link>
      <Link href="/profile" style={btn}>Profile</Link>
      <Link href="/logout" style={redBtn}>Logout</Link>
    </nav>
  );
}

function LiveCard({ title, count, detail, href, pulse, tone }: { title: string; count: number; detail: string; href: string; pulse: boolean; tone: "red" | "gold" }) {
  return (
    <Link href={href} style={{ ...liveCard, ...(pulse ? (tone === "red" ? redPulse : goldPulse) : {}) }}>
      <div style={smallEyebrow}>{title}</div>
      <div style={liveNumber}>{count}</div>
      <p style={muted}>{detail}</p>
    </Link>
  );
}

function FolderCard({ title, count, href }: { title: string; count: number; href: string }) {
  return (
    <Link href={href} style={{ ...liveCard, textDecoration: "none" }}>
      <div style={smallEyebrow}>{title}</div>
      <h3 style={h3}>{count} total</h3>
      <span style={goldBtn}>Open Folder</span>
    </Link>
  );
}

function AlertLane({ title, kind, rooms }: { title: string; kind: RoomKind; rooms: RoomRecord[] }) {
  return (
    <section style={panel}>
      <div style={eyebrow}>{title}</div>
      {!rooms.length ? <p style={sub}>No unread active {kind} alerts.</p> : null}
      <div style={stack}>
        {rooms.map((room) => (
          <Link key={`${kind}-${roomId(room)}`} href={hrefFor(kind, room)} style={alertCard}>
            <span style={dot} />
            <div>
              <div style={smallEyebrow}>{kind === "deal" ? "New Deal" : "New Pain"}</div>
              <h3 style={h3}>{titleFor(room, kind)}</h3>
              <p style={muted}>{locationFor(room)}</p>
              <p style={muted}>{kind === "deal" ? `Ask: ${money(room.askingPrice)} • Value: ${money(room.propertyValue || room.arv)} • Repairs: ${money(room.repairs)}` : `Pain: ${asList(room.painTypes).join(", ") || "Not selected"} • Urgency: ${asList(room.urgency).join(", ") || "Not selected"}`}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function ExecutionLane({ dealRooms, painRooms }: { dealRooms: RoomRecord[]; painRooms: RoomRecord[] }) {
  const rows = [...dealRooms.map((room) => ({ kind: "deal" as RoomKind, room })), ...painRooms.map((room) => ({ kind: "pain" as RoomKind, room }))];
  return (
    <section style={panel}>
      <div style={eyebrow}>Execution Tickets</div>
      {!rows.length ? <p style={sub}>No unread execution tickets.</p> : null}
      <div style={stack}>
        {rows.map((item) => (
          <Link key={`${item.kind}-${roomId(item.room)}`} href={hrefFor(item.kind, item.room)} style={note}>
            <div style={smallEyebrow}>{riskLabel(item.room, item.kind)} • {item.kind.toUpperCase()}</div>
            <h3 style={h3}>{titleFor(item.room, item.kind)}</h3>
            <p style={muted}>Open room, review analysis, route to profile, move to messages.</p>
          </Link>
        ))}
      </div>
    </section>
  );
}


const page: React.CSSProperties = { minHeight: "100vh", background: "#05070d", color: "#f7f7fb", padding: 18, fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" };
const wrap: React.CSSProperties = { maxWidth: 1280, margin: "0 auto", paddingBottom: 90 };
const nav: React.CSSProperties = { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 18 };
const brand: React.CSSProperties = { color: "#ffd45a", fontSize: 27, fontWeight: 950, letterSpacing: -1, marginRight: 10 };
const btn: React.CSSProperties = { border: "1px solid rgba(207,216,230,.18)", background: "#171c29", color: "#f7f7fb", borderRadius: 999, padding: "13px 18px", fontWeight: 950, textDecoration: "none", display: "inline-block", cursor: "pointer" };
const goldBtn: React.CSSProperties = { ...btn, border: 0, background: "#ffdc68", color: "#10131a" };
const redBtn: React.CSSProperties = { ...btn, background: "#271016", borderColor: "rgba(255,70,70,.48)", color: "#ffaaaa" };
const hero: React.CSSProperties = { border: "1px solid rgba(245,197,66,.28)", borderRadius: 28, padding: 30, marginBottom: 20, background: "radial-gradient(circle at top right, rgba(245,197,66,.16), transparent 32%), linear-gradient(180deg,#080d19,#050816)" };
const card: React.CSSProperties = { background: "linear-gradient(180deg,#080d19,#050816)", border: "1px solid rgba(245,197,66,.28)", borderRadius: 26, padding: 28, marginBottom: 22 };
const panel: React.CSSProperties = { border: "1px solid rgba(245,197,66,.24)", borderRadius: 26, padding: 24, background: "linear-gradient(180deg,#080d19,#050816)" };
const eyebrow: React.CSSProperties = { color: "#ffd45a", textTransform: "uppercase", letterSpacing: 7, fontWeight: 950, fontSize: 15, marginBottom: 12 };
const smallEyebrow: React.CSSProperties = { color: "#ffd45a", textTransform: "uppercase", letterSpacing: 5, fontWeight: 950, fontSize: 13, marginBottom: 10 };
const h1: React.CSSProperties = { fontSize: "clamp(44px,8vw,86px)", lineHeight: 0.9, letterSpacing: -4, margin: "0 0 18px", fontWeight: 950 };
const h2: React.CSSProperties = { fontSize: "clamp(32px,5vw,54px)", lineHeight: 0.95, letterSpacing: -2, margin: "0 0 12px", fontWeight: 950 };
const h3: React.CSSProperties = { fontSize: 30, lineHeight: 1, margin: "0 0 8px", fontWeight: 950 };
const sub: React.CSSProperties = { color: "#c9d0dc", fontSize: 21, lineHeight: 1.35, margin: 0 };
const muted: React.CSSProperties = { color: "#aeb7c7", margin: "8px 0 0", lineHeight: 1.35 };
const grid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(245px, 1fr))", gap: 16 };
const twoGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 18, marginBottom: 20 };
const factCard: React.CSSProperties = { background: "#121724", border: "1px solid rgba(207,216,230,.16)", borderRadius: 20, padding: 20 };
const factValue: React.CSSProperties = { color: "#f8fafc", fontSize: 22, fontWeight: 900 };
const row: React.CSSProperties = { display: "flex", gap: 10, flexWrap: "wrap" };
const stack: React.CSSProperties = { display: "grid", gap: 14 };
const photoGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 12, marginBottom: 22 };
const photoStyle: React.CSSProperties = { width: "100%", height: 210, objectFit: "cover", borderRadius: 22, border: "1px solid rgba(207,216,230,.22)" };
const alertCard: React.CSSProperties = { display: "grid", gridTemplateColumns: "18px 1fr", gap: 12, background: "#121724", border: "1px solid rgba(207,216,230,.16)", borderRadius: 22, padding: 20, color: "#f7f7fb", textDecoration: "none" };
const dot: React.CSSProperties = { width: 12, height: 12, borderRadius: 999, background: "#ff4d4d", boxShadow: "0 0 18px rgba(255,70,70,.8)", marginTop: 8 };
const note: React.CSSProperties = { background: "#121724", border: "1px solid rgba(207,216,230,.16)", borderRadius: 22, padding: 22 };
const liveCard: React.CSSProperties = { background: "#121724", border: "1px solid rgba(207,216,230,.16)", borderRadius: 22, padding: 22, color: "#f7f7fb", textDecoration: "none", display: "block" };
const redPulse: React.CSSProperties = { borderColor: "rgba(255,70,70,.75)", animation: "vfPulse 1.8s infinite" };
const goldPulse: React.CSSProperties = { borderColor: "rgba(255,220,104,.70)", animation: "vfGoldPulse 1.8s infinite" };
const liveNumber: React.CSSProperties = { fontSize: 52, lineHeight: 1, fontWeight: 950 };
const tickerShell: React.CSSProperties = { overflow: "hidden", border: "1px solid rgba(245,197,66,.20)", borderRadius: 18, background: "#0b0f19", padding: "12px 0", marginTop: 18 };
const tickerTrack: React.CSSProperties = { display: "flex", gap: 26, width: "max-content", animation: "vfTicker 35s linear infinite" };
const tickerItem: React.CSSProperties = { whiteSpace: "nowrap", color: "#ffd45a", fontSize: 14, fontWeight: 900 };
const livePill: React.CSSProperties = { background: "#e31321", color: "white", borderRadius: 999, padding: "13px 16px", fontWeight: 950, boxShadow: "0 0 24px rgba(227,19,33,.55)" };

