"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type RoomType = "deal" | "pain";
type ViewMode = "home" | "deal" | "pain" | "thread";
type ThreadState = "active" | "saved" | "archived" | "deleted";
type FilterState = ThreadState | "all";

type SavedProfile = {
  profilePhoto?: string;
  fullName?: string;
  company?: string;
  email?: string;
  phone?: string;
  preferredContact?: string[];
};

type RoomRecord = {
  id?: string;
  roomId?: string;
  dealId?: string;
  painId?: string;
  title?: string;
  name?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  bestContact?: string;
  ownerName?: string;
  ownerPhone?: string;
  ownerEmail?: string;
  sellerName?: string;
  sellerPhone?: string;
  sellerEmail?: string;
  assetClass?: string;
  city?: string;
  county?: string;
  state?: string;
  [key: string]: unknown;
};

type MessageRow = {
  id: string;
  threadKey: string;
  roomType: RoomType;
  roomId: string;
  subject: string;
  fromName: string;
  fromContact: string;
  fromRole: "profile" | "owner";
  toName: string;
  toContact: string;
  toRole: "profile" | "owner";
  body: string;
  createdAt: string;
  read: boolean;
};

type RoomMessageCard = {
  threadKey: string;
  roomType: RoomType;
  roomId: string;
  roomTitle: string;
  subject: string;
  location: string;
  ownerName: string;
  ownerContact: string;
  senderName: string;
  senderContact: string;
  count: number;
  unread: number;
  lastMessage: string;
  lastAt: string;
  state: ThreadState;
};

const PROFILE_KEY = "vaultforge_profile_v2";
const THREAD_STATE_KEY = "vaultforge_message_thread_states_v3";

const DEAL_KEYS = ["vaultforge_clean_deal_rooms", "vaultforge_deal_rooms", "vaultforge_rooms_deals", "vf_deal_rooms"];
const PAIN_KEYS = ["vaultforge_clean_pain_rooms_v1", "vaultforge_clean_pain_rooms", "vaultforge_pain_rooms", "vaultforge_rooms_pain", "vf_pain_rooms"];

function makeThreadKey(type: RoomType, id: string) {
  return `${type}:${id}`;
}

function messagesKey(key: string) {
  return `vaultforge_room_messages_${key}`;
}

function parseJson<T>(raw: string | null, fallback: T): T {
  try {
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function text(value: unknown, fallback = "") {
  if (value === undefined || value === null) return fallback;
  const cleaned = String(value).trim();
  return cleaned || fallback;
}

function roomId(room: RoomRecord | null | undefined) {
  if (!room) return "";
  return text(room.id || room.roomId || room.dealId || room.painId, "");
}

function first(room: RoomRecord | null, keys: string[], fallback = "") {
  if (!room) return fallback;
  for (const key of keys) {
    const got = text(room[key], "");
    if (got) return got;
  }
  return fallback;
}

function readArray(key: string): RoomRecord[] {
  if (typeof window === "undefined") return [];
  const parsed = parseJson<unknown>(window.localStorage.getItem(key), []);
  return Array.isArray(parsed) ? (parsed as RoomRecord[]) : [];
}

function uniqueRooms(type: RoomType): RoomRecord[] {
  if (typeof window === "undefined") return [];

  const keys = type === "deal" ? DEAL_KEYS : PAIN_KEYS;
  const map = new Map<string, RoomRecord>();

  for (const key of keys) {
    for (const room of readArray(key)) {
      const id = roomId(room);
      if (id && !map.has(id)) map.set(id, { ...room, id });
    }
  }

  for (let i = 0; i < window.localStorage.length; i += 1) {
    const key = window.localStorage.key(i) || "";
    const isDealDirect = type === "deal" && (key.startsWith("vaultforge_clean_deal_room_") || key.startsWith("vaultforge_deal_room_"));
    const isPainDirect = type === "pain" && (key.startsWith("vaultforge_clean_pain_room_") || key.startsWith("vaultforge_pain_room_"));

    if (!isDealDirect && !isPainDirect) continue;

    const room = parseJson<RoomRecord | null>(window.localStorage.getItem(key), null);
    const id = roomId(room);
    if (room && id && !map.has(id)) map.set(id, { ...room, id });
  }

  return Array.from(map.values());
}

function readProfile(): SavedProfile | null {
  if (typeof window === "undefined") return null;
  return parseJson<SavedProfile | null>(window.localStorage.getItem(PROFILE_KEY), null);
}

function profileName(profile: SavedProfile | null) {
  return text(profile?.fullName, "") || text(profile?.company, "") || "Saved Profile";
}

function profileContact(profile: SavedProfile | null) {
  const methods = Array.isArray(profile?.preferredContact) ? profile.preferredContact.join(", ") : "";
  const phone = text(profile?.phone, "");
  const email = text(profile?.email, "");
  const base = [phone, email].filter(Boolean).join(" / ");
  return methods ? `${base || "No phone/email"} • Prefers ${methods}` : base || "No profile contact saved";
}

function ownerName(room: RoomRecord | null) {
  return first(room, ["contactName", "ownerName", "sellerName"], "Room Owner");
}

function ownerContact(room: RoomRecord | null) {
  const phone = first(room, ["contactPhone", "ownerPhone", "sellerPhone"], "");
  const email = first(room, ["contactEmail", "ownerEmail", "sellerEmail"], "");
  const best = first(room, ["bestContact"], "");
  const base = [phone, email].filter(Boolean).join(" / ");
  return best ? `${base || "No phone/email"} • Best: ${best}` : base || "No owner contact saved";
}

function roomTitle(type: RoomType, room: RoomRecord) {
  return first(room, ["title", "name"], type === "deal" ? "Untitled Deal Room" : "Untitled Pain Room");
}

function roomSubject(type: RoomType, room: RoomRecord) {
  return `${type === "deal" ? "Deal Room" : "Pain Room"}: ${roomTitle(type, room)}`;
}

function location(room: RoomRecord) {
  return [first(room, ["city"], ""), first(room, ["county"], ""), first(room, ["state"], "")]
    .filter(Boolean)
    .join(", ");
}

function readMessages(key: string): MessageRow[] {
  if (typeof window === "undefined") return [];
  const parsed = parseJson<unknown>(window.localStorage.getItem(messagesKey(key)), []);
  return Array.isArray(parsed) ? (parsed as MessageRow[]) : [];
}

function writeMessages(key: string, rows: MessageRow[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(messagesKey(key), JSON.stringify(rows));
}

function readStates(): Record<string, ThreadState> {
  if (typeof window === "undefined") return {};
  return parseJson<Record<string, ThreadState>>(window.localStorage.getItem(THREAD_STATE_KEY), {});
}

function writeStates(states: Record<string, ThreadState>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(THREAD_STATE_KEY, JSON.stringify(states));
}

function buildCards(profile: SavedProfile | null): RoomMessageCard[] {
  const states = readStates();
  const rows: RoomMessageCard[] = [];

  const build = (type: RoomType, room: RoomRecord) => {
    const id = roomId(room);
    if (!id) return;

    const key = makeThreadKey(type, id);
    const messages = readMessages(key);
    const latest = messages[0];

    rows.push({
      threadKey: key,
      roomType: type,
      roomId: id,
      roomTitle: roomTitle(type, room),
      subject: roomSubject(type, room),
      location: location(room),
      ownerName: ownerName(room),
      ownerContact: ownerContact(room),
      senderName: profileName(profile),
      senderContact: profileContact(profile),
      count: messages.length,
      unread: messages.filter((message) => !message.read).length,
      lastMessage: latest?.body || "No messages yet.",
      lastAt: latest?.createdAt || "",
      state: states[key] || "active",
    });
  };

  uniqueRooms("deal").forEach((room) => build("deal", room));
  uniqueRooms("pain").forEach((room) => build("pain", room));

  return rows.sort((a, b) => {
    const aTime = a.lastAt || "0";
    const bTime = b.lastAt || "0";
    return bTime.localeCompare(aTime);
  });
}

function readSearchParams(): { view: ViewMode; type: "" | RoomType; roomId: string } {
  if (typeof window === "undefined") return { view: "home", type: "", roomId: "" };

  const params = new URLSearchParams(window.location.search);
  const rawBox = params.get("box") || "";
  const rawType = params.get("type") || "";
  const roomIdValue = params.get("room") || "";

  if (rawType === "deal" && roomIdValue) return { view: "thread", type: "deal", roomId: roomIdValue };
  if (rawType === "pain" && roomIdValue) return { view: "thread", type: "pain", roomId: roomIdValue };
  if (rawBox === "deal") return { view: "deal", type: "deal", roomId: "" };
  if (rawBox === "pain") return { view: "pain", type: "pain", roomId: "" };

  return { view: "home", type: "", roomId: "" };
}

function niceDate(value: string) {
  if (!value) return "No messages yet";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function roomHref(type: RoomType, id: string) {
  return type === "deal" ? `/deal-rooms/${encodeURIComponent(id)}` : `/pain-rooms/${encodeURIComponent(id)}`;
}

function messagesBoxHref(type: RoomType) {
  return `/messages?box=${type}`;
}

function threadHref(card: RoomMessageCard) {
  return `/messages?type=${encodeURIComponent(card.roomType)}&room=${encodeURIComponent(card.roomId)}`;
}

function stateLabel(state: ThreadState) {
  if (state === "saved") return "Saved";
  if (state === "archived") return "Archived";
  if (state === "deleted") return "Deleted";
  return "Active";
}

export default function MessagesPage() {
  const [profile, setProfile] = useState<SavedProfile | null>(null);
  const [cards, setCards] = useState<RoomMessageCard[]>([]);
  const [view, setView] = useState<ViewMode>("home");
  const [openType, setOpenType] = useState<"" | RoomType>("");
  const [openId, setOpenId] = useState("");
  const [filter, setFilter] = useState<FilterState>("active");
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [body, setBody] = useState("");
  const [replyMode, setReplyMode] = useState<"profileToOwner" | "ownerToProfile">("profileToOwner");

  function load() {
    const savedProfile = readProfile();
    const route = readSearchParams();
    const builtCards = buildCards(savedProfile);

    setProfile(savedProfile);
    setCards(builtCards);
    setView(route.view);
    setOpenType(route.type);
    setOpenId(route.roomId);

    if (route.view === "thread" && route.type && route.roomId) {
      const key = makeThreadKey(route.type, route.roomId);
      const markedRead = readMessages(key).map((item) => ({ ...item, read: true }));
      writeMessages(key, markedRead);
      setMessages(markedRead);
    } else {
      setMessages([]);
    }
  }

  useEffect(() => {
    load();
    window.addEventListener("storage", load);
    window.addEventListener("vaultforge-message-change", load);

    return () => {
      window.removeEventListener("storage", load);
      window.removeEventListener("vaultforge-message-change", load);
    };
  }, []);

  const currentCard = useMemo(() => {
    if (!openType || !openId) return null;
    return cards.find((card) => card.roomType === openType && card.roomId === openId) || null;
  }, [cards, openType, openId]);

  const counts = useMemo(() => {
    return {
      active: cards.filter((card) => card.state === "active").length,
      saved: cards.filter((card) => card.state === "saved").length,
      archived: cards.filter((card) => card.state === "archived").length,
      deleted: cards.filter((card) => card.state === "deleted").length,
      all: cards.length,
    };
  }, [cards]);

  const dealCards = cards.filter((card) => card.roomType === "deal");
  const painCards = cards.filter((card) => card.roomType === "pain");

  const dealMessageCount = dealCards.reduce((sum, card) => sum + card.count, 0);
  const painMessageCount = painCards.reduce((sum, card) => sum + card.count, 0);

  const visibleCards = useMemo(() => {
    const typeFiltered = view === "deal" ? dealCards : view === "pain" ? painCards : [];
    if (filter === "all") return typeFiltered;
    return typeFiltered.filter((card) => card.state === filter);
  }, [view, dealCards, painCards, filter]);

  function refreshCards() {
    setCards(buildCards(profile));
    window.dispatchEvent(new Event("vaultforge-message-change"));
  }

  function setCardState(card: RoomMessageCard, state: ThreadState) {
    const states = readStates();
    states[card.threadKey] = state;
    writeStates(states);
    refreshCards();
  }

  function deleteForever(card: RoomMessageCard) {
    const ok = window.confirm(`Delete messages forever for "${card.subject}"?`);
    if (!ok) return;

    window.localStorage.removeItem(messagesKey(card.threadKey));

    const states = readStates();
    delete states[card.threadKey];
    writeStates(states);

    setMessages([]);
    refreshCards();
  }

  function sendMessage() {
    if (!currentCard) return;

    const cleaned = body.trim();
    if (!cleaned) return;

    const fromName = replyMode === "profileToOwner" ? currentCard.senderName : currentCard.ownerName;
    const fromContact = replyMode === "profileToOwner" ? currentCard.senderContact : currentCard.ownerContact;
    const toName = replyMode === "profileToOwner" ? currentCard.ownerName : currentCard.senderName;
    const toContact = replyMode === "profileToOwner" ? currentCard.ownerContact : currentCard.senderContact;

    const nextMessage: MessageRow = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      threadKey: currentCard.threadKey,
      roomType: currentCard.roomType,
      roomId: currentCard.roomId,
      subject: currentCard.subject,
      fromName,
      fromContact,
      fromRole: replyMode === "profileToOwner" ? "profile" : "owner",
      toName,
      toContact,
      toRole: replyMode === "profileToOwner" ? "owner" : "profile",
      body: cleaned,
      createdAt: new Date().toISOString(),
      read: true,
    };

    const next = [nextMessage, ...readMessages(currentCard.threadKey)];
    writeMessages(currentCard.threadKey, next);
    setMessages(next);
    setBody("");

    setCards(buildCards(profile));
    window.dispatchEvent(new Event("vaultforge-message-change"));

    window.history.pushState(null, "", messagesBoxHref(currentCard.roomType));
    setView(currentCard.roomType);
    setOpenType("");
    setOpenId("");
  }

  if (view === "thread" && currentCard) {
    const fromName = replyMode === "profileToOwner" ? currentCard.senderName : currentCard.ownerName;
    const toName = replyMode === "profileToOwner" ? currentCard.ownerName : currentCard.senderName;

    return (
      <main style={page}>
        <div style={wrap}>
          <TopNav />

          <section style={card}>
            <div style={eyebrow}>{currentCard.roomType === "deal" ? "Deal Message Thread" : "Pain Message Thread"}</div>
            <h1 style={h1}>{currentCard.subject}</h1>
            <p style={sub}>{currentCard.location || "Location not listed"}</p>
            <div style={actionRow}>
              <a href={messagesBoxHref(currentCard.roomType)} style={goldBtn}>Back To {currentCard.roomType === "deal" ? "Deal Messages" : "Pain Messages"}</a>
              <Link href={roomHref(currentCard.roomType, currentCard.roomId)} style={btn}>Open Room</Link>
            </div>
          </section>

          <section style={card}>
            <div style={eyebrow}>Thread Cleanup</div>
            <CleanupControls card={currentCard} onState={setCardState} onDeleteForever={deleteForever} />
          </section>

          <section style={card}>
            <div style={eyebrow}>Route</div>
            <div style={routeGrid}>
              <RouteBox label="Saved Profile" name={currentCard.senderName} contact={currentCard.senderContact} />
              <RouteBox label="Room Owner / Contact" name={currentCard.ownerName} contact={currentCard.ownerContact} />
            </div>
          </section>

          <section style={card}>
            <div style={eyebrow}>Reply</div>
            <div style={toggleRow}>
              <button type="button" onClick={() => setReplyMode("profileToOwner")} style={replyMode === "profileToOwner" ? goldBtn : btn}>Profile → Owner</button>
              <button type="button" onClick={() => setReplyMode("ownerToProfile")} style={replyMode === "ownerToProfile" ? goldBtn : btn}>Owner → Profile</button>
            </div>
            <div style={messageRoute}><strong>{fromName}</strong><span>→</span><strong>{toName}</strong></div>
            <textarea style={textarea} value={body} onChange={(event) => setBody(event.target.value)} placeholder={`Reply in: ${currentCard.subject}`} />
            <button type="button" onClick={sendMessage} style={goldBtn}>Send Reply</button>
            <p style={muted}>After sending, VaultForge returns you to the {currentCard.roomType === "deal" ? "Deal Messages" : "Pain Messages"} card area.</p>
          </section>

          <section style={card}>
            <div style={eyebrow}>This Thread ({messages.length})</div>
            {!messages.length ? <p style={sub}>No messages in this thread yet.</p> : null}
            <div style={threadList}>
              {messages.map((message) => (
                <article key={message.id} style={messageCard}>
                  <div style={messageTop}>
                    <strong>{message.fromName} → {message.toName}</strong>
                    <span>{niceDate(message.createdAt)}</span>
                  </div>
                  <p style={muted}>From: {message.fromContact}</p>
                  <p style={muted}>To: {message.toContact}</p>
                  <p style={messageBody}>{message.body}</p>
                </article>
              ))}
            </div>
          </section>
        </div>
      </main>
    );
  }

  if (view === "deal" || view === "pain") {
    const label = view === "deal" ? "Deal Messages" : "Pain Messages";

    return (
      <main style={page}>
        <div style={wrap}>
          <TopNav />

          <section style={card}>
            <div style={eyebrow}>{label}</div>
            <h1 style={h1}>{label} card area.</h1>
            <p style={sub}>
              Click a room communication card to open that one thread. Cleanup moves the card into the selected folder.
            </p>
            <div style={actionRow}>
              <a href="/messages" style={goldBtn}>Back To Communication Cards</a>
            </div>
          </section>

          <section style={card}>
            <div style={eyebrow}>Folders</div>
            <div style={filterRow}>
              {(["active", "saved", "archived", "deleted", "all"] as FilterState[]).map((item) => (
                <button key={item} type="button" onClick={() => setFilter(item)} style={filter === item ? goldBtn : btn}>
                  {item.toUpperCase()} ({counts[item]})
                </button>
              ))}
            </div>
          </section>

          <section style={card}>
            <div style={eyebrow}>{label} Threads</div>
            {!visibleCards.length ? <p style={sub}>No {label} cards in this folder.</p> : null}
            <div style={cardGrid}>
              {visibleCards.map((item) => (
                <MessageRoomCard key={item.threadKey} card={item} onState={setCardState} onDeleteForever={deleteForever} />
              ))}
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main style={page}>
      <div style={wrap}>
        <TopNav />

        <section style={card}>
          <div style={eyebrow}>Messages</div>
          <h1 style={h1}>Communication cards.</h1>
          <p style={sub}>
            Two clean work areas: Deal Messages and Pain Messages. Each opens to its own room-thread cards.
          </p>
        </section>

        <section style={twoCardGrid}>
          <CommunicationBox
            title="Deal Messages"
            subtitle="Deal Room communication threads."
            roomCount={dealCards.length}
            messageCount={dealMessageCount}
            onOpen={() => {
              window.history.pushState(null, "", "/messages?box=deal");
              setView("deal");
              setFilter("active");
            }}
          />
          <CommunicationBox
            title="Pain Messages"
            subtitle="Pain Room communication threads."
            roomCount={painCards.length}
            messageCount={painMessageCount}
            onOpen={() => {
              window.history.pushState(null, "", "/messages?box=pain");
              setView("pain");
              setFilter("active");
            }}
          />
        </section>
      </div>
    </main>
  );
}

function TopNav() {
  return (
    <nav style={nav}>
      <Link href="/command" style={btn}>Command</Link>
      <Link href="/deal-rooms" style={btn}>Deal Rooms</Link>
      <Link href="/pain-rooms" style={btn}>Pain Rooms</Link>
      <a href="/messages" style={goldBtn}>Messages</a>
      <Link href="/profile" style={btn}>Profile</Link>
      <Link href="/" style={redBtn}>Exit</Link>
    </nav>
  );
}

function CommunicationBox({
  title,
  subtitle,
  roomCount,
  messageCount,
  onOpen,
}: {
  title: string;
  subtitle: string;
  roomCount: number;
  messageCount: number;
  onOpen: () => void;
}) {
  return (
    <button type="button" onClick={onOpen} style={communicationCardButton}>
      <div style={eyebrow}>{title}</div>
      <h2 style={commTitle}>{title}</h2>
      <p style={sub}>{subtitle}</p>
      <div style={countBox}>
        <strong>{roomCount}</strong>
        <span>room cards</span>
        <strong>{messageCount}</strong>
        <span>messages</span>
      </div>
      <span style={goldBtn}>Open {title}</span>
    </button>
  );
}

function RouteBox({ label, name, contact }: { label: string; name: string; contact: string }) {
  return (
    <div style={routeBox}>
      <div style={miniEyebrow}>{label}</div>
      <h3 style={routeTitle}>{name}</h3>
      <p style={muted}>{contact}</p>
    </div>
  );
}

function MessageRoomCard({
  card,
  onState,
  onDeleteForever,
}: {
  card: RoomMessageCard;
  onState: (card: RoomMessageCard, state: ThreadState) => void;
  onDeleteForever: (card: RoomMessageCard) => void;
}) {
  return (
    <article style={threadCard}>
      <div style={threadHeader}>
        <div>
          <div style={miniEyebrow}>{card.roomType === "deal" ? "Deal Communication Card" : "Pain Communication Card"}</div>
          <h3 style={threadTitle}>{card.roomTitle}</h3>
        </div>
        <span style={statePill}>{stateLabel(card.state)}</span>
      </div>

      <p style={muted}>{card.location || "Location not listed"}</p>

      <div style={countBox}>
        <strong>{card.count}</strong>
        <span>messages</span>
        <strong>{card.unread}</strong>
        <span>unread</span>
      </div>

      <p style={muted}>Recipient: {card.ownerName}</p>
      <p style={threadPreview}>{card.lastMessage}</p>
      <p style={muted}>{niceDate(card.lastAt)}</p>

      <div style={actionRowCompact}>
        <a href={threadHref(card)} style={goldBtn}>Open Thread</a>
        <Link href={roomHref(card.roomType, card.roomId)} style={btn}>Open Room</Link>
      </div>

      <CleanupControls card={card} onState={onState} onDeleteForever={onDeleteForever} />
    </article>
  );
}

function CleanupControls({
  card,
  onState,
  onDeleteForever,
}: {
  card: RoomMessageCard;
  onState: (card: RoomMessageCard, state: ThreadState) => void;
  onDeleteForever: (card: RoomMessageCard) => void;
}) {
  return (
    <div style={cleanupBox}>
      <div style={miniEyebrow}>Current: {stateLabel(card.state)}</div>
      <div style={actionRowCompact}>
        <button type="button" onClick={() => onState(card, "saved")} style={goldBtn}>Save</button>
        <button type="button" onClick={() => onState(card, "archived")} style={btn}>Archive</button>
        <button type="button" onClick={() => onState(card, "deleted")} style={redBtn}>Delete</button>
        {card.state === "deleted" ? (
          <>
            <button type="button" onClick={() => onState(card, "active")} style={btn}>Restore</button>
            <button type="button" onClick={() => onDeleteForever(card)} style={dangerBtn}>Delete Forever</button>
          </>
        ) : null}
      </div>
    </div>
  );
}

const page: React.CSSProperties = { minHeight: "100vh", background: "#05070d", color: "#f7f7fb", padding: 18, fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" };
const wrap: React.CSSProperties = { maxWidth: 1180, margin: "0 auto", paddingBottom: 70 };
const nav: React.CSSProperties = { display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 18 };
const card: React.CSSProperties = { background: "linear-gradient(180deg,#080d19,#050816)", border: "1px solid rgba(245,197,66,.28)", borderRadius: 26, padding: 28, marginBottom: 22 };
const twoCardGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(310px, 1fr))", gap: 18 };
const communicationCard: React.CSSProperties = { ...card, minHeight: 260, textDecoration: "none", color: "#f7f7fb", display: "block" };
const communicationCardButton: React.CSSProperties = { ...card, minHeight: 260, color: "#f7f7fb", display: "block", width: "100%", textAlign: "left", cursor: "pointer" };
const eyebrow: React.CSSProperties = { color: "#ffd45a", textTransform: "uppercase", letterSpacing: 8, fontWeight: 900, fontSize: 19, marginBottom: 14 };
const miniEyebrow: React.CSSProperties = { color: "#ffd45a", textTransform: "uppercase", letterSpacing: 5, fontWeight: 900, fontSize: 13, marginBottom: 10 };
const h1: React.CSSProperties = { fontSize: "clamp(42px,7vw,76px)", lineHeight: 0.92, letterSpacing: -4, margin: "0 0 18px", fontWeight: 950 };
const commTitle: React.CSSProperties = { fontSize: "clamp(36px,6vw,60px)", lineHeight: 0.95, letterSpacing: -3, margin: "0 0 14px", fontWeight: 950 };
const sub: React.CSSProperties = { color: "#c9d0dc", fontSize: 22, lineHeight: 1.35, margin: 0 };
const btn: React.CSSProperties = { border: "1px solid rgba(207,216,230,.18)", background: "#171c29", color: "#f7f7fb", borderRadius: 999, padding: "13px 18px", fontWeight: 950, textDecoration: "none", display: "inline-block", cursor: "pointer" };
const goldBtn: React.CSSProperties = { ...btn, border: 0, background: "#ffdc68", color: "#10131a" };
const redBtn: React.CSSProperties = { ...btn, background: "#271016", borderColor: "rgba(255,70,70,.48)", color: "#ffaaaa" };
const dangerBtn: React.CSSProperties = { ...btn, background: "#3a080d", borderColor: "rgba(255,30,30,.75)", color: "#ffc9c9" };
const actionRow: React.CSSProperties = { display: "flex", gap: 12, flexWrap: "wrap", marginTop: 16 };
const actionRowCompact: React.CSSProperties = { display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 };
const filterRow: React.CSSProperties = { display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 };
const routeGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 };
const routeBox: React.CSSProperties = { background: "#121724", border: "1px solid rgba(207,216,230,.14)", borderRadius: 22, padding: 20 };
const routeTitle: React.CSSProperties = { fontSize: 28, margin: "0 0 8px", lineHeight: 1 };
const toggleRow: React.CSSProperties = { display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 };
const messageRoute: React.CSSProperties = { display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", marginBottom: 14, fontSize: 22 };
const textarea: React.CSSProperties = { width: "100%", boxSizing: "border-box", borderRadius: 18, border: "1px solid rgba(207,216,230,.18)", background: "#121724", color: "#f6f7fb", padding: "17px 18px", fontSize: 16, outline: "none", minHeight: 140, resize: "vertical", marginBottom: 14 };
const threadList: React.CSSProperties = { display: "grid", gap: 14 };
const cardGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(310px, 1fr))", gap: 16 };
const threadCard: React.CSSProperties = { background: "#121724", border: "1px solid rgba(207,216,230,.14)", borderRadius: 22, padding: 22 };
const cleanupBox: React.CSSProperties = { marginTop: 16, padding: 16, border: "1px solid rgba(245,197,66,.18)", borderRadius: 18, background: "rgba(245,197,66,.045)" };
const messageCard: React.CSSProperties = { background: "#121724", border: "1px solid rgba(207,216,230,.14)", borderRadius: 22, padding: 22 };
const messageTop: React.CSSProperties = { display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", color: "#f7f7fb" };
const threadHeader: React.CSSProperties = { display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" };
const threadTitle: React.CSSProperties = { fontSize: 28, margin: "0 0 10px" };
const threadPreview: React.CSSProperties = { color: "#e7edf7", fontSize: 18, lineHeight: 1.35, margin: "10px 0" };
const muted: React.CSSProperties = { color: "#aeb7c7", margin: "6px 0" };
const messageBody: React.CSSProperties = { color: "#f7f7fb", fontSize: 20, lineHeight: 1.4, margin: "12px 0 0" };
const statePill: React.CSSProperties = { borderRadius: 999, padding: "8px 12px", background: "#ffdc68", color: "#10131a", fontWeight: 950, fontSize: 12 };
const countBox: React.CSSProperties = { display: "grid", gridTemplateColumns: "auto 1fr auto 1fr", gap: 8, alignItems: "center", margin: "16px 0", padding: 16, borderRadius: 18, background: "rgba(255,220,104,.08)", border: "1px solid rgba(255,220,104,.22)" };
