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
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
};

type MessageRow = {
  id?: string;
  subject?: string;
  body?: string;
  createdAt?: string;
  read?: boolean;
};

type MessageStats = {
  threads: number;
  messages: number;
  unread: number;
  newest: string;
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
    if (room && id && !map.has(id)) map.set(id, { ...room, id });
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

function messageStats(kind: RoomKind): MessageStats {
  if (!hasBrowser()) return { threads: 0, messages: 0, unread: 0, newest: "" };

  let threads = 0;
  let messages = 0;
  let unread = 0;
  let newest = "";

  for (let i = 0; i < window.localStorage.length; i += 1) {
    const key = window.localStorage.key(i) || "";
    if (!key.startsWith(`vaultforge_room_messages_${kind}:`)) continue;

    const rows = readMessageRows(key);
    if (!rows.length) continue;

    threads += 1;
    messages += rows.length;
    unread += rows.filter((row) => !row.read).length;

    for (const row of rows) {
      const createdAt = cleanText(row.createdAt, "");
      if (createdAt && (!newest || createdAt > newest)) newest = createdAt;
    }
  }

  return { threads, messages, unread, newest };
}

function newestRoomTime(rooms: RoomRecord[]) {
  const times = rooms
    .map((room) => cleanText(room.updatedAt || room.createdAt, ""))
    .filter(Boolean)
    .sort();

  return times[times.length - 1] || "";
}

function timeAgo(value: string) {
  if (!value) return "no activity";
  try {
    const diff = Date.now() - new Date(value).getTime();
    const minutes = Math.max(0, Math.floor(diff / 60000));
    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  } catch {
    return value;
  }
}

export default function CommandPage() {
  const [deals, setDeals] = useState<RoomRecord[]>([]);
  const [pains, setPains] = useState<RoomRecord[]>([]);
  const [dealMessages, setDealMessages] = useState<MessageStats>({
    threads: 0,
    messages: 0,
    unread: 0,
    newest: "",
  });
  const [painMessages, setPainMessages] = useState<MessageStats>({
    threads: 0,
    messages: 0,
    unread: 0,
    newest: "",
  });

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
    window.addEventListener("vaultforge-deal-change", load);
    window.addEventListener("vaultforge-pain-change", load);
    window.addEventListener("vaultforge-message-change", load);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("storage", load);
      window.removeEventListener("vaultforge-room-state-change", load);
      window.removeEventListener("vaultforge-deal-change", load);
      window.removeEventListener("vaultforge-pain-change", load);
      window.removeEventListener("vaultforge-message-change", load);
    };
  }, []);

  const dealActive = deals.filter((room) => getRoomState(room, "deal") === "active");
  const painActive = pains.filter((room) => getRoomState(room, "pain") === "active");

  const dealSaved = deals.filter((room) => getRoomState(room, "deal") === "saved");
  const dealArchived = deals.filter((room) => getRoomState(room, "deal") === "archived");
  const dealDeleted = deals.filter((room) => getRoomState(room, "deal") === "deleted");

  const painSaved = pains.filter((room) => getRoomState(room, "pain") === "saved");
  const painArchived = pains.filter((room) => getRoomState(room, "pain") === "archived");
  const painDeleted = pains.filter((room) => getRoomState(room, "pain") === "deleted");

  const liveTicker = [
    ...dealActive.slice(0, 5).map((room) => `NEW DEAL: ${titleFor(room, "deal")} • ${locationFor(room)}`),
    ...painActive.slice(0, 5).map((room) => `NEW PAIN: ${titleFor(room, "pain")} • ${locationFor(room)}`),
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

        <section style={hero}>
          <div>
            <div style={eyebrow}>Command Center</div>
            <h1 style={h1}>Live intelligence first.</h1>
            <p style={sub}>
              Active rooms pulse on the desk. Saved, archived, and deleted rooms move into separate Deal and Pain folders.
            </p>
          </div>
        </section>

        <section style={alertShell}>
          <div style={alertHeader}>
            <div>
              <div style={eyebrow}>Live Alert Engine</div>
              <h2 style={h2}>Clean VaultForge Alert Desk.</h2>
              <p style={sub}>
                Active work only. Deal, Pain, and Message lanes stay separated.
              </p>
            </div>
            <div style={livePill}>LIVE</div>
          </div>

          <div style={summaryGrid}>
            <LiveCard
              title="New Deals"
              count={dealActive.length}
              detail={`${dealActive.length} active total • ${timeAgo(newestRoomTime(dealActive))}`}
              href="/deal-rooms"
              pulse={dealActive.length > 0}
              tone="red"
            />
            <LiveCard
              title="New Pain"
              count={painActive.length}
              detail={`${painActive.length} active total • ${timeAgo(newestRoomTime(painActive))}`}
              href="/pain-rooms"
              pulse={painActive.length > 0}
              tone="red"
            />
            <LiveCard
              title="Deal Messages"
              count={dealMessages.unread}
              detail={`${dealMessages.messages} messages • ${dealMessages.threads} threads`}
              href="/messages?lane=deal"
              pulse={dealMessages.unread > 0}
              tone="gold"
            />
            <LiveCard
              title="Pain Messages"
              count={painMessages.unread}
              detail={`${painMessages.messages} messages • ${painMessages.threads} threads`}
              href="/messages?lane=pain"
              pulse={painMessages.unread > 0}
              tone="gold"
            />
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

        <section style={folderShell}>
          <div style={eyebrow}>5S Room Folders</div>
          <h2 style={h2}>Six clean folders.</h2>
          <p style={{ ...sub, marginBottom: 20 }}>
            Deal folders and Pain folders do not merge. Click any card to open that lane.
          </p>

          <div style={sixGrid}>
            <FolderCard title="Saved Deals" count={dealSaved.length} href="/saved-rooms?type=deal" kind="deal" state="saved" />
            <FolderCard title="Archived Deals" count={dealArchived.length} href="/archived-rooms?type=deal" kind="deal" state="archived" />
            <FolderCard title="Deleted Deals" count={dealDeleted.length} href="/deleted-rooms?type=deal" kind="deal" state="deleted" />
            <FolderCard title="Saved Pain" count={painSaved.length} href="/saved-rooms?type=pain" kind="pain" state="saved" />
            <FolderCard title="Archived Pain" count={painArchived.length} href="/archived-rooms?type=pain" kind="pain" state="archived" />
            <FolderCard title="Deleted Pain" count={painDeleted.length} href="/deleted-rooms?type=pain" kind="pain" state="deleted" />
          </div>
        </section>

        <section style={workGrid}>
          <AlertLane
            title="Active Deal Alerts"
            kind="deal"
            rooms={dealActive.slice(0, 6)}
          />
          <ExecutionLane
            dealRooms={dealActive.slice(0, 4)}
            painRooms={painActive.slice(0, 4)}
          />
        </section>

        <section style={workGrid}>
          <AlertLane
            title="Active Pain Alerts"
            kind="pain"
            rooms={painActive.slice(0, 6)}
          />
          <MessageLane
            dealMessages={dealMessages}
            painMessages={painMessages}
          />
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

function FolderCard({
  title,
  count,
  href,
  kind,
  state,
}: {
  title: string;
  count: number;
  href: string;
  kind: RoomKind;
  state: RoomState;
}) {
  return (
    <Link href={href} style={folderCard}>
      <div style={smallEyebrow}>{title}</div>
      <h3 style={folderNumber}>{count} total</h3>
      <p style={muted}>
        {kind === "deal" ? "Deal" : "Pain"} rooms marked {state}.
      </p>
      <span style={miniGold}>Open Folder</span>
    </Link>
  );
}

function AlertLane({
  title,
  kind,
  rooms,
}: {
  title: string;
  kind: RoomKind;
  rooms: RoomRecord[];
}) {
  return (
    <section style={panel}>
      <div style={eyebrow}>{title}</div>
      <p style={smallCopy}>Newest active {kind === "deal" ? "deal" : "pain"} rooms only. Foldered rooms stay out.</p>

      {!rooms.length ? (
        <p style={sub}>No active {kind === "deal" ? "deal" : "pain"} alerts.</p>
      ) : null}

      <div style={stack}>
        {rooms.map((room) => (
          <Link key={`${kind}-${roomId(room)}`} href={hrefFor(kind, room)} style={alertCard}>
            <span style={dot} />
            <div>
              <div style={smallEyebrow}>{kind === "deal" ? "New Deal" : "New Pain"}</div>
              <h3 style={roomTitle}>{titleFor(room, kind)}</h3>
              <p style={muted}>{locationFor(room)}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function ExecutionLane({
  dealRooms,
  painRooms,
}: {
  dealRooms: RoomRecord[];
  painRooms: RoomRecord[];
}) {
  const rows = [
    ...dealRooms.map((room) => ({ kind: "deal" as RoomKind, room })),
    ...painRooms.map((room) => ({ kind: "pain" as RoomKind, room })),
  ].slice(0, 6);

  return (
    <section style={panel}>
      <div style={eyebrow}>Execution Tickets</div>
      <p style={smallCopy}>Only active rooms create tickets.</p>

      {!rows.length ? <p style={sub}>No active execution tickets.</p> : null}

      <div style={stack}>
        {rows.map(({ kind, room }) => (
          <Link key={`ticket-${kind}-${roomId(room)}`} href={hrefFor(kind, room)} style={ticketCard}>
            <div style={ticketTop}>
              <span>HIGH</span>
              <span>{kind.toUpperCase()}</span>
            </div>
            <h3 style={ticketTitle}>{titleFor(room, kind)}</h3>
            <p style={muted}>Open room, verify facts, route to profile, move to messages.</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

function MessageLane({
  dealMessages,
  painMessages,
}: {
  dealMessages: MessageStats;
  painMessages: MessageStats;
}) {
  return (
    <section style={panel}>
      <div style={eyebrow}>Message Alerts</div>
      <p style={smallCopy}>Deal threads and Pain threads stay separate.</p>

      <div style={stack}>
        <Link
          href="/messages?lane=deal"
          style={{
            ...messageCard,
            ...(dealMessages.unread > 0 ? goldPulse : {}),
          }}
        >
          <div style={smallEyebrow}>Deal Messages</div>
          <h3 style={roomTitle}>{dealMessages.unread} unread</h3>
          <p style={muted}>{dealMessages.messages} messages • {dealMessages.threads} threads</p>
        </Link>

        <Link
          href="/messages?lane=pain"
          style={{
            ...messageCard,
            ...(painMessages.unread > 0 ? goldPulse : {}),
          }}
        >
          <div style={smallEyebrow}>Pain Messages</div>
          <h3 style={roomTitle}>{painMessages.unread} unread</h3>
          <p style={muted}>{painMessages.messages} messages • {painMessages.threads} threads</p>
        </Link>
      </div>
    </section>
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

const alertShell: React.CSSProperties = {
  border: "1px solid rgba(245,197,66,.28)",
  borderRadius: 28,
  padding: 26,
  marginBottom: 20,
  background:
    "radial-gradient(circle at top right, rgba(227,19,33,.16), transparent 34%), linear-gradient(135deg, rgba(9,14,26,.98), rgba(8,6,10,.98))",
};

const alertHeader: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 20,
  alignItems: "center",
  marginBottom: 18,
};

const folderShell: React.CSSProperties = {
  border: "1px solid rgba(245,197,66,.28)",
  borderRadius: 28,
  padding: 26,
  marginBottom: 20,
  background: "linear-gradient(180deg,#080d19,#050816)",
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
  margin: "0 0 12px",
  fontWeight: 950,
};

const sub: React.CSSProperties = {
  color: "#c9d0dc",
  fontSize: 21,
  lineHeight: 1.35,
  margin: 0,
};

const smallCopy: React.CSSProperties = {
  color: "#9ca8ba",
  fontSize: 15,
  lineHeight: 1.35,
  margin: "0 0 16px",
};

const livePill: React.CSSProperties = {
  background: "#e31321",
  color: "white",
  borderRadius: 999,
  padding: "13px 16px",
  fontWeight: 950,
  boxShadow: "0 0 24px rgba(227,19,33,.55)",
};

const summaryGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(215px, 1fr))",
  gap: 16,
};

const sixGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(225px, 1fr))",
  gap: 16,
};

const workGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0,1.25fr) minmax(320px,.75fr)",
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

const muted: React.CSSProperties = {
  color: "#aeb7c7",
  margin: "8px 0 0",
  lineHeight: 1.35,
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

const messageCard: React.CSSProperties = {
  background: "#121724",
  border: "1px solid rgba(207,216,230,.16)",
  borderRadius: 22,
  padding: 20,
  color: "#f7f7fb",
  textDecoration: "none",
  display: "block",
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

const ticketTitle: React.CSSProperties = {
  fontSize: 24,
  margin: "0 0 6px",
};

const roomTitle: React.CSSProperties = {
  fontSize: 28,
  lineHeight: 1,
  margin: "0 0 8px",
};

