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
  assetClass?: string;
  askingPrice?: string;
  propertyValue?: string;
  arv?: string;
  repairs?: string;
  amountNeeded?: string;
  urgency?: string[] | string;
  routeTo?: string[] | string;
  routedTo?: string[] | string;
  routingNeeds?: string[] | string;
  painTypes?: string[] | string;
  blockers?: string[] | string;
  knownIssues?: string[] | string;
  createdAt?: string;
  updatedAt?: string;
  viewedAt?: string;
  alertRead?: boolean;
  messagePending?: boolean;
  awaitingResponse?: boolean;
  stalled?: boolean;
  noActivity?: boolean;
  [key: string]: unknown;
};

type MessageRow = {
  id?: string;
  subject?: string;
  body?: string;
  createdAt?: string;
  read?: boolean;
};

const DEAL_KEYS = [
  "vaultforge_clean_deal_rooms",
  "vaultforge_deal_rooms",
  "vaultforge_rooms_deals",
  "vf_deal_rooms",
];

const PAIN_KEYS = [
  "vaultforge_clean_pain_rooms_v1",
  "vaultforge_clean_pain_rooms",
  "vaultforge_pain_rooms",
  "vaultforge_rooms_pain",
  "vf_pain_rooms",
];

const ROOM_STATE_KEYS = [
  "vaultforge_clean_room_states",
  "vaultforge_room_states",
  "vaultforge_deal_room_states",
  "vaultforge_pain_room_states",
  "vaultforge_5s_room_states",
];

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

function asList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  if (typeof value === "string" && value.trim()) {
    return value.split(",").map((item) => item.trim()).filter(Boolean);
  }
  return [];
}

function roomId(room: RoomRecord | null | undefined) {
  return cleanText(room?.id || room?.roomId || room?.dealId || room?.painId, "");
}

function numberValue(value: unknown) {
  const raw = cleanText(value, "");
  const n = Number(raw.replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function money(value: unknown) {
  const raw = cleanText(value, "");
  if (!raw) return "Not listed";
  if (raw.includes("$")) return raw;
  const n = numberValue(raw);
  if (!Number.isFinite(n) || n <= 0) return raw;
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function keysFor(kind: RoomKind) {
  return kind === "deal" ? DEAL_KEYS : PAIN_KEYS;
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
    Object.assign(
      merged,
      parseJson<Record<string, RoomState>>(window.localStorage.getItem(key), {})
    );
  }
  return merged;
}

function getRoomState(room: RoomRecord, kind: RoomKind): RoomState {
  const states = readStates();
  const id = roomId(room);
  const status =
    states[`${kind}:${id}`] ||
    states[id] ||
    room.roomState ||
    room.cleanupState ||
    room.stateStatus ||
    "active";

  if (status === "saved" || status === "archived" || status === "deleted") {
    return status;
  }

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

function readRooms(kind: RoomKind): RoomRecord[] {
  if (!hasBrowser()) return [];
  const map = new Map<string, RoomRecord>();

  for (const key of keysFor(kind)) {
    for (const room of readArray(key)) {
      const id = roomId(room);
      if (id && !map.has(id)) {
        map.set(id, { ...room, id });
      }
    }
  }

  for (let i = 0; i < window.localStorage.length; i += 1) {
    const key = window.localStorage.key(i) || "";

    const isDeal =
      kind === "deal" &&
      (key.startsWith("vaultforge_clean_deal_room_") ||
        key.startsWith("vaultforge_deal_room_") ||
        key.startsWith("vf_deal_room_"));

    const isPain =
      kind === "pain" &&
      (key.startsWith("vaultforge_clean_pain_room_") ||
        key.startsWith("vaultforge_pain_room_") ||
        key.startsWith("vf_pain_room_"));

    if (!isDeal && !isPain) continue;

    const room = parseJson<RoomRecord | null>(
      window.localStorage.getItem(key),
      null
    );

    const id = roomId(room);
    if (room && id && !map.has(id)) {
      map.set(id, { ...room, id });
    }
  }

  return Array.from(map.values()).map((room) => ({
    ...room,
    roomState: getRoomState(room, kind),
  }));
}

function titleFor(room: RoomRecord, kind: RoomKind) {
  return cleanText(
    room.title || room.name,
    kind === "deal" ? "Untitled Deal Room" : "Untitled Pain Room"
  );
}

function locationFor(room: RoomRecord) {
  return [cleanText(room.city), cleanText(room.county), cleanText(room.state)]
    .filter(Boolean)
    .join(", ") || "Market not listed";
}

function hrefFor(kind: RoomKind, room: RoomRecord) {
  const id = encodeURIComponent(roomId(room));
  return kind === "deal" ? `/deal-rooms/${id}` : `/pain-rooms/${id}`;
}

function readMessageRows(key: string): MessageRow[] {
  if (!hasBrowser()) return [];
  const parsed = parseJson<unknown>(window.localStorage.getItem(key), []);
  return Array.isArray(parsed) ? (parsed as MessageRow[]) : [];
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

function riskLabel(room: RoomRecord, kind: RoomKind) {
  const combined = [
    ...asList(room.urgency),
    ...asList(room.knownIssues),
    ...asList(room.blockers),
    ...asList(room.painTypes),
  ].join(" ").toLowerCase();

  if (
    combined.includes("critical") ||
    combined.includes("emergency") ||
    combined.includes("foreclosure") ||
    combined.includes("auction") ||
    combined.includes("tax sale")
  ) {
    return "Critical";
  }

  if (
    combined.includes("high") ||
    combined.includes("funding") ||
    combined.includes("stalled") ||
    combined.includes("tenant")
  ) {
    return "High";
  }

  return kind === "pain" ? "Medium" : "Review";
}

function dealSpread(room: RoomRecord) {
  const value = numberValue(room.propertyValue || room.arv);
  const ask = numberValue(room.askingPrice);
  const repairs = numberValue(room.repairs);
  if (!value || !ask) return 0;
  return value - ask - repairs;
}

function criticalRooms(deals: RoomRecord[], pains: RoomRecord[]) {
  return [...deals, ...pains].filter((room) => {
    const text = JSON.stringify(room).toLowerCase();
    return (
      getRoomState(room, "deal") === "active" ||
      getRoomState(room, "pain") === "active"
    ) && (
      text.includes("foreclosure") ||
      text.includes("auction") ||
      text.includes("emergency") ||
      text.includes("critical") ||
      text.includes("tax sale")
    );
  });
}

function isUnrouted(room: RoomRecord) {
  const routeTo = [
    ...asList(room.routeTo),
    ...asList(room.routedTo),
    ...asList(room.routingNeeds),
  ];
  return routeTo.length === 0;
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

  const activeDeals = deals.filter((room) => getRoomState(room, "deal") === "active");
  const activePains = pains.filter((room) => getRoomState(room, "pain") === "active");

  const unreadDeals = activeDeals.filter((room) => !isRoomRead("deal", room));
  const unreadPains = activePains.filter((room) => !isRoomRead("pain", room));

  const savedDeals = deals.filter((room) => getRoomState(room, "deal") === "saved");
  const archivedDeals = deals.filter((room) => getRoomState(room, "deal") === "archived");
  const deletedDeals = deals.filter((room) => getRoomState(room, "deal") === "deleted");

  const savedPains = pains.filter((room) => getRoomState(room, "pain") === "saved");
  const archivedPains = pains.filter((room) => getRoomState(room, "pain") === "archived");
  const deletedPains = pains.filter((room) => getRoomState(room, "pain") === "deleted");

  const critical = criticalRooms(activeDeals, activePains);
  const allActive = [...activeDeals, ...activePains];

  const unrouted = allActive.filter(isUnrouted).length;
  const pendingResponses = allActive.filter((room) => room.messagePending || room.awaitingResponse).length;
  const stalled = allActive.filter((room) => room.stalled || room.noActivity).length;

  const liveTicker = [
    ...unreadDeals.slice(0, 4).map((room) => `NEW DEAL: ${titleFor(room, "deal")} • ${locationFor(room)}`),
    ...unreadPains.slice(0, 4).map((room) => `NEW PAIN: ${titleFor(room, "pain")} • ${locationFor(room)}`),
    dealMessages.unread ? `DEAL MESSAGES: ${dealMessages.unread} unread` : "",
    painMessages.unread ? `PAIN MESSAGES: ${painMessages.unread} unread` : "",
  ].filter(Boolean);

  return (
    <main style={page}>
      <style>{`
        @keyframes vfPulse {
          0% { box-shadow: 0 0 0 0 rgba(255,70,70,.45); transform: translateY(0); }
          70% { box-shadow: 0 0 0 13px rgba(255,70,70,0); transform: translateY(-1px); }
          100% { box-shadow: 0 0 0 0 rgba(255,70,70,0); transform: translateY(0); }
        }
        @keyframes vfGoldPulse {
          0% { box-shadow: 0 0 0 0 rgba(255,220,104,.40); transform: translateY(0); }
          70% { box-shadow: 0 0 0 13px rgba(255,220,104,0); transform: translateY(-1px); }
          100% { box-shadow: 0 0 0 0 rgba(255,220,104,0); transform: translateY(0); }
        }
        @keyframes vfTicker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>

      <div style={wrap}>
        <nav style={nav}>
          <div style={brand}>VAULTFORGE</div>
          <Link href="/command" style={goldBtn}>Command</Link>
          <Link href="/deal-rooms" style={btn}>Deal Rooms</Link>
          <Link href="/deal-create" style={btn}>Create Deal</Link>
          <Link href="/pain-intake" style={btn}>Pain Intake</Link>
          <Link href="/pain-rooms" style={btn}>Pain Rooms</Link>
          <Link href="/messages" style={btn}>Messages</Link>
          <Link href="/profile" style={btn}>Profile</Link>
          <Link href="/saved-rooms" style={btn}>Saved</Link>
          <Link href="/archived-rooms" style={btn}>Archived</Link>
          <Link href="/deleted-rooms" style={btn}>Deleted</Link>
          <Link href="/logout" style={redBtn}>Logout</Link>
        </nav>

        {critical.length ? (
          <section style={criticalBanner}>
            <span style={criticalDot} />
            <div>
              <div style={eyebrow}>Critical Pressure</div>
              <div style={criticalText}>{critical.length} room(s) require immediate review.</div>
            </div>
          </section>
        ) : null}

        <section style={hero}>
          <div style={eyebrow}>Command Center</div>
          <h1 style={h1}>Live intelligence first.</h1>
          <p style={sub}>
            Alerts pulse first, routing queue shows pressure, rooms carry the work, and messages close the loop.
          </p>
        </section>

        <section style={card}>
          <div style={rowTop}>
            <div>
              <div style={eyebrow}>Live Alert Engine</div>
              <h2 style={h2}>Clean VaultForge Alert Desk.</h2>
              <p style={sub}>
                Unread active work only. Saved, archived, deleted, and read rooms stay out of the pulse deck.
              </p>
            </div>
            <div style={livePill}>LIVE</div>
          </div>

          <div style={summaryGrid}>
            <LiveCard title="New Deals" count={unreadDeals.length} detail={`${activeDeals.length} active total`} href="/deal-rooms" pulse={unreadDeals.length > 0} tone="red" />
            <LiveCard title="New Pain" count={unreadPains.length} detail={`${activePains.length} active total`} href="/pain-rooms" pulse={unreadPains.length > 0} tone="red" />
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
          <div style={eyebrow}>AI Routing Queue</div>
          <h2 style={h2}>Routing + execution oversight.</h2>
          <div style={summaryGrid}>
            <LiveCard title="Unrouted Rooms" count={unrouted} detail="Rooms waiting for routing" href="/command" pulse={unrouted > 0} tone="gold" />
            <LiveCard title="Pending Responses" count={pendingResponses} detail="Rooms waiting for member response" href="/messages" pulse={pendingResponses > 0} tone="gold" />
            <LiveCard title="Stalled Rooms" count={stalled} detail="Rooms needing escalation" href="/command" pulse={stalled > 0} tone="red" />
          </div>
        </section>

        <section style={card}>
          <div style={eyebrow}>5S Room Folders</div>
          <h2 style={h2}>Six clean folders.</h2>
          <div style={folderGrid}>
            <FolderCard title="Saved Deals" count={savedDeals.length} href="/saved-rooms?type=deal" />
            <FolderCard title="Archived Deals" count={archivedDeals.length} href="/archived-rooms?type=deal" />
            <FolderCard title="Deleted Deals" count={deletedDeals.length} href="/deleted-rooms?type=deal" />
            <FolderCard title="Saved Pain" count={savedPains.length} href="/saved-rooms?type=pain" />
            <FolderCard title="Archived Pain" count={archivedPains.length} href="/archived-rooms?type=pain" />
            <FolderCard title="Deleted Pain" count={deletedPains.length} href="/deleted-rooms?type=pain" />
          </div>
        </section>

        <section style={workGrid}>
          <section style={panel}>
            <div style={eyebrow}>Unread Deal Alerts</div>
            {!unreadDeals.length ? <p style={sub}>No unread deal alerts.</p> : null}
            <div style={stack}>
              {unreadDeals.slice(0, 6).map((room) => (
                <RoomAlert key={`deal-${roomId(room)}`} kind="deal" room={room} />
              ))}
            </div>
          </section>

          <section style={panel}>
            <div style={eyebrow}>Execution Tickets</div>
            {[...unreadDeals.slice(0, 3).map((room) => ({ kind: "deal" as RoomKind, room })), ...unreadPains.slice(0, 3).map((room) => ({ kind: "pain" as RoomKind, room }))].length === 0 ? (
              <p style={sub}>No unread execution tickets.</p>
            ) : null}
            <div style={stack}>
              {[...unreadDeals.slice(0, 3).map((room) => ({ kind: "deal" as RoomKind, room })), ...unreadPains.slice(0, 3).map((room) => ({ kind: "pain" as RoomKind, room }))].map((item) => (
                <Link key={`ticket-${item.kind}-${roomId(item.room)}`} href={hrefFor(item.kind, item.room)} style={ticketCard}>
                  <div style={ticketTop}>
                    <span>{riskLabel(item.room, item.kind)}</span>
                    <span>{item.kind.toUpperCase()}</span>
                  </div>
                  <h3 style={roomTitle}>{titleFor(item.room, item.kind)}</h3>
                  <p style={muted}>Open room, review analysis, route to profile, move to messages.</p>
                </Link>
              ))}
            </div>
          </section>
        </section>

        <section style={workGrid}>
          <section style={panel}>
            <div style={eyebrow}>Unread Pain Alerts</div>
            {!unreadPains.length ? <p style={sub}>No unread pain alerts.</p> : null}
            <div style={stack}>
              {unreadPains.slice(0, 6).map((room) => (
                <RoomAlert key={`pain-${roomId(room)}`} kind="pain" room={room} />
              ))}
            </div>
          </section>

          <section style={panel}>
            <div style={eyebrow}>Next Locked Phase</div>
            <h2 style={h2}>Room Hydration Phase</h2>
            <div style={smallBox}>
              <div style={smallEyebrow}>Deal Rooms</div>
              <p style={muted}>Underwriting, spread, buyer/lender/operator fit, risk, execution path, best next move.</p>
            </div>
            <div style={smallBox}>
              <div style={smallEyebrow}>Pain Rooms</div>
              <p style={muted}>Severity, pressure analysis, solver profile, funding pressure, escalation logic.</p>
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}

function LiveCard({
  title,
  count,
  detail,
  href,
  pulse,
  tone,
}: {
  title: string;
  count: number;
  detail: string;
  href: string;
  pulse: boolean;
  tone: "red" | "gold";
}) {
  return (
    <Link
      href={href}
      style={{
        ...liveCard,
        ...(pulse ? (tone === "red" ? redPulse : goldPulse) : {}),
      }}
    >
      <div style={smallEyebrow}>{title}</div>
      <div style={liveNumber}>{count}</div>
      <p style={muted}>{detail}</p>
    </Link>
  );
}

function FolderCard({ title, count, href }: { title: string; count: number; href: string }) {
  return (
    <Link href={href} style={folderCard}>
      <div style={smallEyebrow}>{title}</div>
      <h3 style={folderNumber}>{count} total</h3>
      <span style={miniGold}>Open Folder</span>
    </Link>
  );
}

function RoomAlert({ kind, room }: { kind: RoomKind; room: RoomRecord }) {
  const detail =
    kind === "deal"
      ? `Ask: ${money(room.askingPrice)} • Value: ${money(room.propertyValue || room.arv)} • Repairs: ${money(room.repairs)}`
      : `Pain: ${asList(room.painTypes).join(", ") || "Not selected"} • Urgency: ${asList(room.urgency).join(", ") || "Not selected"}`;

  return (
    <Link href={hrefFor(kind, room)} style={alertCard}>
      <span style={dot} />
      <div>
        <div style={smallEyebrow}>{kind === "deal" ? "New Deal" : "New Pain"}</div>
        <h3 style={roomTitle}>{titleFor(room, kind)}</h3>
        <p style={muted}>{locationFor(room)}</p>
        <p style={muted}>{detail}</p>
      </div>
    </Link>
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
  maxWidth: 1280,
  margin: "0 auto",
  paddingBottom: 90,
};

const nav: React.CSSProperties = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  alignItems: "center",
  marginBottom: 18,
};

const brand: React.CSSProperties = {
  color: "#ffd45a",
  fontSize: 27,
  fontWeight: 950,
  letterSpacing: -1,
  marginRight: 10,
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

const hero: React.CSSProperties = {
  border: "1px solid rgba(245,197,66,.28)",
  borderRadius: 28,
  padding: 30,
  marginBottom: 20,
  background:
    "radial-gradient(circle at top right, rgba(245,197,66,.16), transparent 32%), linear-gradient(180deg,#080d19,#050816)",
};

const card: React.CSSProperties = {
  border: "1px solid rgba(245,197,66,.28)",
  borderRadius: 28,
  padding: 26,
  marginBottom: 20,
  background:
    "radial-gradient(circle at top right, rgba(227,19,33,.10), transparent 34%), linear-gradient(135deg, rgba(9,14,26,.98), rgba(8,6,10,.98))",
};

const panel: React.CSSProperties = {
  border: "1px solid rgba(245,197,66,.24)",
  borderRadius: 26,
  padding: 24,
  background: "linear-gradient(180deg,#080d19,#050816)",
};

const eyebrow: React.CSSProperties = {
  color: "#ffd45a",
  textTransform: "uppercase",
  letterSpacing: 7,
  fontWeight: 950,
  fontSize: 15,
  marginBottom: 12,
};

const smallEyebrow: React.CSSProperties = {
  color: "#ffd45a",
  textTransform: "uppercase",
  letterSpacing: 5,
  fontWeight: 950,
  fontSize: 13,
  marginBottom: 10,
};

const h1: React.CSSProperties = {
  fontSize: "clamp(44px,8vw,86px)",
  lineHeight: 0.9,
  letterSpacing: -4,
  margin: "0 0 18px",
  fontWeight: 950,
};

const h2: React.CSSProperties = {
  fontSize: "clamp(32px,5vw,54px)",
  lineHeight: 0.95,
  letterSpacing: -2,
  margin: "0 0 18px",
  fontWeight: 950,
};

const sub: React.CSSProperties = {
  color: "#c9d0dc",
  fontSize: 21,
  lineHeight: 1.35,
  margin: 0,
};

const muted: React.CSSProperties = {
  color: "#aeb7c7",
  margin: "8px 0 0",
  lineHeight: 1.35,
};

const rowTop: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 20,
  alignItems: "center",
  marginBottom: 18,
};

const summaryGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(215px, 1fr))",
  gap: 16,
};

const folderGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(225px, 1fr))",
  gap: 16,
};

const workGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
  gap: 18,
  marginBottom: 20,
};

const liveCard: React.CSSProperties = {
  background: "#121724",
  border: "1px solid rgba(207,216,230,.16)",
  borderRadius: 22,
  padding: 22,
  color: "#f7f7fb",
  textDecoration: "none",
  display: "block",
};

const redPulse: React.CSSProperties = {
  borderColor: "rgba(255,70,70,.75)",
  animation: "vfPulse 1.8s infinite",
};

const goldPulse: React.CSSProperties = {
  borderColor: "rgba(255,220,104,.70)",
  animation: "vfGoldPulse 1.8s infinite",
};

const liveNumber: React.CSSProperties = {
  fontSize: 52,
  lineHeight: 1,
  fontWeight: 950,
};

const tickerShell: React.CSSProperties = {
  overflow: "hidden",
  border: "1px solid rgba(245,197,66,.20)",
  borderRadius: 18,
  background: "#0b0f19",
  padding: "12px 0",
  marginTop: 18,
};

const tickerTrack: React.CSSProperties = {
  display: "flex",
  gap: 26,
  width: "max-content",
  animation: "vfTicker 35s linear infinite",
};

const tickerItem: React.CSSProperties = {
  whiteSpace: "nowrap",
  color: "#ffd45a",
  fontSize: 14,
  fontWeight: 900,
};

const livePill: React.CSSProperties = {
  background: "#e31321",
  color: "white",
  borderRadius: 999,
  padding: "13px 16px",
  fontWeight: 950,
  boxShadow: "0 0 24px rgba(227,19,33,.55)",
};

const folderCard: React.CSSProperties = {
  background: "#121724",
  border: "1px solid rgba(207,216,230,.16)",
  borderRadius: 22,
  padding: 22,
  color: "#f7f7fb",
  textDecoration: "none",
  display: "block",
};

const folderNumber: React.CSSProperties = {
  fontSize: 30,
  margin: "0 0 10px",
};

const miniGold: React.CSSProperties = {
  ...goldBtn,
  padding: "10px 14px",
  display: "inline-block",
  marginTop: 14,
};

const stack: React.CSSProperties = {
  display: "grid",
  gap: 14,
};

const alertCard: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "18px 1fr",
  gap: 12,
  background: "#121724",
  border: "1px solid rgba(207,216,230,.16)",
  borderRadius: 22,
  padding: 20,
  color: "#f7f7fb",
  textDecoration: "none",
};

const dot: React.CSSProperties = {
  width: 12,
  height: 12,
  borderRadius: 999,
  background: "#ff4d4d",
  boxShadow: "0 0 18px rgba(255,70,70,.8)",
  marginTop: 8,
};

const ticketCard: React.CSSProperties = {
  background: "rgba(55,10,20,.35)",
  border: "1px solid rgba(255,80,80,.24)",
  borderRadius: 20,
  padding: 18,
  color: "#f7f7fb",
  textDecoration: "none",
};

const ticketTop: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  color: "#ffb4b4",
  letterSpacing: 3,
  fontSize: 12,
  fontWeight: 900,
  marginBottom: 10,
};

const roomTitle: React.CSSProperties = {
  fontSize: 28,
  lineHeight: 1,
  margin: "0 0 8px",
};

const smallBox: React.CSSProperties = {
  background: "#121724",
  border: "1px solid rgba(207,216,230,.16)",
  borderRadius: 20,
  padding: 18,
  marginTop: 12,
};

const criticalBanner: React.CSSProperties = {
  display: "flex",
  gap: 16,
  alignItems: "center",
  borderRadius: 20,
  padding: 20,
  marginBottom: 20,
  background: "#2a0f12",
  border: "1px solid rgba(255,70,70,.45)",
  animation: "vfPulse 2s infinite",
};

const criticalDot: React.CSSProperties = {
  width: 18,
  height: 18,
  borderRadius: 999,
  background: "#ff4444",
  boxShadow: "0 0 18px rgba(255,70,70,.8)",
};

const criticalText: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 900,
};
