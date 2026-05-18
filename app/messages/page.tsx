"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type RoomType = "deal" | "pain" | "general";
type ThreadState = "active" | "saved" | "archived" | "deleted";
type FilterState = "active" | "saved" | "archived" | "deleted" | "all";

type SavedProfile = {
  profilePhoto?: string;
  companyLogo?: string;
  fullName?: string;
  company?: string;
  email?: string;
  phone?: string;
  preferredContact?: string[];
  memberTypes?: string[];
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
  submitterRole?: string;
  assetClass?: string;
  city?: string;
  county?: string;
  state?: string;
  photoUrl?: string;
  photoUrls?: string[];
  photos?: string[];
  photo?: string;
  imageUrl?: string;
  publicUrl?: string;
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
  fromRole: "profile" | "owner" | "system";
  toName: string;
  toContact: string;
  toRole: "profile" | "owner" | "system";
  body: string;
  createdAt: string;
  read: boolean;
};

type ThreadIndex = {
  threadKey: string;
  roomType: RoomType;
  roomId: string;
  subject: string;
  roomTitle: string;
  recipientName: string;
  recipientContact: string;
  senderName: string;
  senderContact: string;
  lastMessage: string;
  lastAt: string;
  count: number;
  unread: number;
  state?: ThreadState;
};

const PROFILE_KEY = "vaultforge_profile_v2";
const INDEX_KEY = "vaultforge_room_message_threads_v3";
const OLD_INDEX_KEYS = ["vaultforge_room_message_threads_v2", "vaultforge_room_message_threads_v1"];
const THREAD_STATE_KEY = "vaultforge_message_thread_states_v1";

const DEAL_KEYS = ["vaultforge_clean_deal_rooms", "vaultforge_deal_rooms", "vaultforge_rooms_deals", "vf_deal_rooms"];
const PAIN_KEYS = ["vaultforge_clean_pain_rooms_v1", "vaultforge_clean_pain_rooms", "vaultforge_pain_rooms", "vaultforge_rooms_pain", "vf_pain_rooms"];

function makeThreadKey(roomType: RoomType, roomId: string) {
  const safeRoom = String(roomId || "general").trim() || "general";
  return `${roomType}:${safeRoom}`;
}

function messagesKey(threadKey: string) {
  return `vaultforge_room_messages_${threadKey}`;
}

function parseJson<T>(raw: string | null, fallback: T): T {
  try {
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function readProfile(): SavedProfile | null {
  if (typeof window === "undefined") return null;
  return parseJson<SavedProfile | null>(window.localStorage.getItem(PROFILE_KEY), null);
}

function readThreadStates(): Record<string, ThreadState> {
  if (typeof window === "undefined") return {};
  return parseJson<Record<string, ThreadState>>(window.localStorage.getItem(THREAD_STATE_KEY), {});
}

function writeThreadStates(states: Record<string, ThreadState>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(THREAD_STATE_KEY, JSON.stringify(states));
}

function readArray(key: string): RoomRecord[] {
  if (typeof window === "undefined") return [];
  const parsed = parseJson<unknown>(window.localStorage.getItem(key), []);
  return Array.isArray(parsed) ? (parsed as RoomRecord[]) : [];
}

function roomId(room: RoomRecord | null | undefined): string {
  if (!room) return "";
  return String(room.id || room.roomId || room.dealId || room.painId || "");
}

function findRoom(roomType: RoomType, id: string): RoomRecord | null {
  if (typeof window === "undefined" || !id || roomType === "general") return null;

  const directKeys =
    roomType === "deal"
      ? [`vaultforge_clean_deal_room_${id}`, `vaultforge_deal_room_${id}`, `vf_deal_room_${id}`]
      : [`vaultforge_clean_pain_room_${id}`, `vaultforge_pain_room_${id}`, `vf_pain_room_${id}`];

  for (const key of directKeys) {
    const direct = parseJson<RoomRecord | null>(window.localStorage.getItem(key), null);
    if (direct && roomId(direct)) return { ...direct, id: roomId(direct) };
  }

  const keys = roomType === "deal" ? DEAL_KEYS : PAIN_KEYS;
  for (const key of keys) {
    const found = readArray(key).find((item) => roomId(item) === id);
    if (found) return { ...found, id: roomId(found) };
  }

  return null;
}

function text(value: unknown, fallback = "") {
  if (value === undefined || value === null) return fallback;
  const cleaned = String(value).trim();
  return cleaned ? cleaned : fallback;
}

function first(room: RoomRecord | null, keys: string[], fallback = "") {
  if (!room) return fallback;
  for (const key of keys) {
    const got = text(room[key], "");
    if (got) return got;
  }
  return fallback;
}

function roomTitle(roomType: RoomType, room: RoomRecord | null, roomIdValue: string) {
  const title = first(room, ["title", "name"], "");
  if (title) return title;
  if (roomType === "deal") return `Deal Room ${roomIdValue}`;
  if (roomType === "pain") return `Pain Room ${roomIdValue}`;
  return "General Thread";
}

function roomSubject(roomType: RoomType, room: RoomRecord | null, roomIdValue: string, urlSubject: string) {
  if (urlSubject) return urlSubject;
  const title = roomTitle(roomType, room, roomIdValue);
  if (roomType === "deal") return `Deal Room: ${title}`;
  if (roomType === "pain") return `Pain Room: ${title}`;
  return title;
}

function profileName(profile: SavedProfile | null) {
  return text(profile?.fullName, "") || text(profile?.company, "") || "Saved Profile";
}

function profileContact(profile: SavedProfile | null) {
  const methods = Array.isArray(profile?.preferredContact) ? profile?.preferredContact?.join(", ") : "";
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

function roomLocation(room: RoomRecord | null) {
  return [first(room, ["city"], ""), first(room, ["county"], ""), first(room, ["state"], "")]
    .filter(Boolean)
    .join(", ");
}

function readMessages(threadKey: string): MessageRow[] {
  if (typeof window === "undefined") return [];
  const parsed = parseJson<unknown>(window.localStorage.getItem(messagesKey(threadKey)), []);
  return Array.isArray(parsed) ? (parsed as MessageRow[]) : [];
}

function writeMessages(threadKey: string, rows: MessageRow[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(messagesKey(threadKey), JSON.stringify(rows));
}

function normalizeThread(item: Partial<ThreadIndex>, states: Record<string, ThreadState>): ThreadIndex | null {
  const threadKey = text(item.threadKey, "");
  if (!threadKey) return null;

  const parts = threadKey.split(":");
  const fallbackType: RoomType = parts[0] === "pain" ? "pain" : parts[0] === "deal" ? "deal" : "general";
  const fallbackRoom = parts.slice(1).join(":");

  const roomType: RoomType = item.roomType === "pain" ? "pain" : item.roomType === "deal" ? "deal" : fallbackType;
  const roomIdValue = text(item.roomId, fallbackRoom);
  const messages = readMessages(threadKey);
  const latest = messages[0];

  return {
    threadKey,
    roomType,
    roomId: roomIdValue,
    subject: text(item.subject, latest?.subject || `${roomType.toUpperCase()} Room Message`),
    roomTitle: text(item.roomTitle, text(item.subject, "Room Thread")),
    recipientName: text(item.recipientName, "Room Owner"),
    recipientContact: text(item.recipientContact, "No owner contact saved"),
    senderName: text(item.senderName, "Saved Profile"),
    senderContact: text(item.senderContact, "No profile contact saved"),
    lastMessage: text(item.lastMessage, latest?.body || "No messages yet."),
    lastAt: text(item.lastAt, latest?.createdAt || new Date().toISOString()),
    count: Number(item.count || messages.length || 0),
    unread: Number(item.unread || messages.filter((message) => !message.read).length || 0),
    state: states[threadKey] || item.state || "active",
  };
}

function readIndex(): ThreadIndex[] {
  if (typeof window === "undefined") return [];
  const states = readThreadStates();

  const current = parseJson<unknown>(window.localStorage.getItem(INDEX_KEY), []);
  if (Array.isArray(current)) {
    return current
      .map((item) => normalizeThread(item as Partial<ThreadIndex>, states))
      .filter((item): item is ThreadIndex => Boolean(item));
  }

  for (const key of OLD_INDEX_KEYS) {
    const old = parseJson<unknown>(window.localStorage.getItem(key), []);
    if (Array.isArray(old) && old.length) {
      return old
        .map((item) => normalizeThread(item as Partial<ThreadIndex>, states))
        .filter((item): item is ThreadIndex => Boolean(item));
    }
  }

  return [];
}

function writeIndex(rows: ThreadIndex[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(INDEX_KEY, JSON.stringify(rows));
}

function rebuildIndexForThread(args: {
  threadKey: string;
  roomType: RoomType;
  roomId: string;
  subject: string;
  roomTitleValue: string;
  recipientName: string;
  recipientContact: string;
  senderName: string;
  senderContact: string;
}) {
  const states = readThreadStates();
  const messages = readMessages(args.threadKey);
  const latest = messages[0];
  const existing = readIndex().filter((item) => item.threadKey !== args.threadKey);

  const next: ThreadIndex = {
    threadKey: args.threadKey,
    roomType: args.roomType,
    roomId: args.roomId,
    subject: args.subject || latest?.subject || `${args.roomType.toUpperCase()} Room Message`,
    roomTitle: args.roomTitleValue,
    recipientName: args.recipientName,
    recipientContact: args.recipientContact,
    senderName: args.senderName,
    senderContact: args.senderContact,
    lastMessage: latest?.body || "No messages yet.",
    lastAt: latest?.createdAt || new Date().toISOString(),
    count: messages.length,
    unread: messages.filter((item) => !item.read).length,
    state: states[args.threadKey] || "active",
  };

  writeIndex([next, ...existing].sort((a, b) => String(b.lastAt).localeCompare(String(a.lastAt))));
}

function readSearchParams() {
  if (typeof window === "undefined") {
    return { roomType: "general" as RoomType, roomId: "", subject: "" };
  }

  const params = new URLSearchParams(window.location.search);
  const rawType = params.get("type") || "";
  const roomType: RoomType = rawType === "pain" ? "pain" : rawType === "deal" ? "deal" : "general";
  const roomIdValue = params.get("room") || "";
  const subject = params.get("subject") || "";

  return { roomType, roomId: roomIdValue, subject };
}

function niceDate(value: string) {
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function backHref(roomType: RoomType, roomIdValue: string) {
  if (roomType === "deal" && roomIdValue) return `/deal-rooms/${encodeURIComponent(roomIdValue)}`;
  if (roomType === "pain" && roomIdValue) return `/pain-rooms/${encodeURIComponent(roomIdValue)}`;
  return "/command";
}

function stateLabel(state: ThreadState) {
  if (state === "saved") return "Saved";
  if (state === "archived") return "Archived";
  if (state === "deleted") return "Deleted";
  return "Active";
}

export default function MessagesPage() {
  const [roomType, setRoomType] = useState<RoomType>("general");
  const [roomIdValue, setRoomIdValue] = useState("");
  const [subject, setSubject] = useState("");
  const [room, setRoom] = useState<RoomRecord | null>(null);
  const [profile, setProfile] = useState<SavedProfile | null>(null);
  const [threads, setThreads] = useState<ThreadIndex[]>([]);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [body, setBody] = useState("");
  const [replyMode, setReplyMode] = useState<"profileToOwner" | "ownerToProfile">("profileToOwner");
  const [filter, setFilter] = useState<FilterState>("active");

  const threadKey = useMemo(() => makeThreadKey(roomType, roomIdValue), [roomType, roomIdValue]);
  const isRoomThread = roomType !== "general" && !!roomIdValue;

  const title = useMemo(() => roomTitle(roomType, room, roomIdValue), [roomType, room, roomIdValue]);
  const finalSubject = useMemo(() => roomSubject(roomType, room, roomIdValue, subject), [roomType, room, roomIdValue, subject]);

  const savedProfileName = useMemo(() => profileName(profile), [profile]);
  const savedProfileContact = useMemo(() => profileContact(profile), [profile]);
  const savedOwnerName = useMemo(() => ownerName(room), [room]);
  const savedOwnerContact = useMemo(() => ownerContact(room), [room]);

  const senderName = replyMode === "profileToOwner" ? savedProfileName : savedOwnerName;
  const senderContact = replyMode === "profileToOwner" ? savedProfileContact : savedOwnerContact;
  const recipientName = replyMode === "profileToOwner" ? savedOwnerName : savedProfileName;
  const recipientContact = replyMode === "profileToOwner" ? savedOwnerContact : savedProfileContact;

  function load() {
    const route = readSearchParams();
    const foundRoom = findRoom(route.roomType, route.roomId);
    const foundProfile = readProfile();

    const computedTitle = roomTitle(route.roomType, foundRoom, route.roomId);
    const computedSubject = roomSubject(route.roomType, foundRoom, route.roomId, route.subject);
    const key = makeThreadKey(route.roomType, route.roomId);

    setRoomType(route.roomType);
    setRoomIdValue(route.roomId);
    setSubject(computedSubject);
    setRoom(foundRoom);
    setProfile(foundProfile);

    if (route.roomType !== "general" && route.roomId) {
      const existingMessages = readMessages(key).map((item) => ({ ...item, read: true }));
      writeMessages(key, existingMessages);
      rebuildIndexForThread({
        threadKey: key,
        roomType: route.roomType,
        roomId: route.roomId,
        subject: computedSubject,
        roomTitleValue: computedTitle,
        recipientName: ownerName(foundRoom),
        recipientContact: ownerContact(foundRoom),
        senderName: profileName(foundProfile),
        senderContact: profileContact(foundProfile),
      });
      setMessages(existingMessages);
    } else {
      setMessages([]);
    }

    setThreads(readIndex());
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

  function refreshThreads() {
    setThreads(readIndex());
    window.dispatchEvent(new Event("vaultforge-message-change"));
  }

  function setThreadState(target: ThreadIndex, state: ThreadState) {
    const states = readThreadStates();
    states[target.threadKey] = state;
    writeThreadStates(states);

    const next = readIndex().map((item) => (item.threadKey === target.threadKey ? { ...item, state } : item));
    writeIndex(next);
    setThreads(next);

    window.dispatchEvent(new Event("vaultforge-message-change"));
  }

  function deleteForever(target: ThreadIndex) {
    const ok = window.confirm(`Delete message thread forever: "${target.subject}"?`);
    if (!ok) return;

    window.localStorage.removeItem(messagesKey(target.threadKey));

    const states = readThreadStates();
    delete states[target.threadKey];
    writeThreadStates(states);

    const next = readIndex().filter((item) => item.threadKey !== target.threadKey);
    writeIndex(next);
    setThreads(next);

    if (target.threadKey === threadKey) setMessages([]);
    window.dispatchEvent(new Event("vaultforge-message-change"));
  }

  function sendMessage() {
    if (!isRoomThread) return;

    const cleanedBody = body.trim();
    if (!cleanedBody) return;

    const nextMessage: MessageRow = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      threadKey,
      roomType,
      roomId: roomIdValue,
      subject: finalSubject,
      fromName: senderName,
      fromContact: senderContact,
      fromRole: replyMode === "profileToOwner" ? "profile" : "owner",
      toName: recipientName,
      toContact: recipientContact,
      toRole: replyMode === "profileToOwner" ? "owner" : "profile",
      body: cleanedBody,
      createdAt: new Date().toISOString(),
      read: true,
    };

    const states = readThreadStates();
    if (!states[threadKey]) {
      states[threadKey] = "active";
      writeThreadStates(states);
    }

    const nextMessages = [nextMessage, ...readMessages(threadKey)];
    writeMessages(threadKey, nextMessages);
    rebuildIndexForThread({
      threadKey,
      roomType,
      roomId: roomIdValue,
      subject: finalSubject,
      roomTitleValue: title,
      recipientName,
      recipientContact,
      senderName,
      senderContact,
    });

    setMessages(nextMessages);
    setThreads(readIndex());
    setBody("");
    window.dispatchEvent(new Event("vaultforge-message-change"));
  }

  const filteredThreads = useMemo(() => {
    const rows = readIndex();
    if (filter === "all") return rows;
    return rows.filter((thread) => (thread.state || "active") === filter);
  }, [threads, filter]);

  const dealThreads = filteredThreads.filter((thread) => thread.roomType === "deal");
  const painThreads = filteredThreads.filter((thread) => thread.roomType === "pain");

  const counts = useMemo(() => {
    const rows = readIndex();
    return {
      active: rows.filter((thread) => (thread.state || "active") === "active").length,
      saved: rows.filter((thread) => thread.state === "saved").length,
      archived: rows.filter((thread) => thread.state === "archived").length,
      deleted: rows.filter((thread) => thread.state === "deleted").length,
      all: rows.length,
    };
  }, [threads]);

  return (
    <main style={page}>
      <div style={wrap}>
        <nav style={nav}>
          <Link href="/command" style={btn}>Command</Link>
          <Link href="/deal-rooms" style={btn}>Deal Rooms</Link>
          <Link href="/pain-rooms" style={btn}>Pain Rooms</Link>
          <Link href="/messages" style={goldBtn}>Messages</Link>
          <Link href="/profile" style={btn}>Profile</Link>
          <Link href="/" style={redBtn}>Exit</Link>
        </nav>

        <section style={card}>
          <div style={eyebrow}>Messages</div>
          <h1 style={h1}>Clean room communication.</h1>
          <p style={sub}>
            Deal Room threads and Pain Room threads stay separated, auto-route sender/recipient, and include cleanup controls so the work area stays clean.
          </p>
        </section>

        {isRoomThread ? (
          <>
            <section style={card}>
              <div style={eyebrow}>{roomType === "deal" ? "Deal Room Thread" : "Pain Room Thread"}</div>
              <h2 style={h2}>{finalSubject}</h2>
              <p style={sub}>Room: {title}</p>
              {roomLocation(room) ? <p style={mutedBig}>{roomLocation(room)}</p> : null}

              <div style={actionRow}>
                <Link href={backHref(roomType, roomIdValue)} style={goldBtn}>Back To Room</Link>
                <Link href="/messages" style={btn}>All Threads</Link>
              </div>
            </section>

            <section style={card}>
              <div style={eyebrow}>Thread Cleanup</div>
              <ThreadCleanupButtons
                thread={{
                  threadKey,
                  roomType,
                  roomId: roomIdValue,
                  subject: finalSubject,
                  roomTitle: title,
                  recipientName,
                  recipientContact,
                  senderName,
                  senderContact,
                  lastMessage: messages[0]?.body || "No messages yet.",
                  lastAt: messages[0]?.createdAt || new Date().toISOString(),
                  count: messages.length,
                  unread: 0,
                  state: readThreadStates()[threadKey] || "active",
                }}
                onState={setThreadState}
                onDeleteForever={deleteForever}
              />
            </section>

            <section style={card}>
              <div style={eyebrow}>Auto Routing Block</div>
              <div style={routeGrid}>
                <div style={routeBox}>
                  <div style={miniEyebrow}>From Saved Profile</div>
                  <h3 style={routeTitle}>{savedProfileName}</h3>
                  <p style={muted}>{savedProfileContact}</p>
                  {profile?.profilePhoto ? <img src={profile.profilePhoto} alt="Profile" style={avatar} /> : null}
                </div>
                <div style={routeBox}>
                  <div style={miniEyebrow}>To Room Owner / Contact</div>
                  <h3 style={routeTitle}>{savedOwnerName}</h3>
                  <p style={muted}>{savedOwnerContact}</p>
                </div>
              </div>
            </section>

            <section style={card}>
              <div style={eyebrow}>Send / Reply</div>
              <div style={toggleRow}>
                <button type="button" onClick={() => setReplyMode("profileToOwner")} style={replyMode === "profileToOwner" ? goldBtn : btn}>
                  Profile → Owner
                </button>
                <button type="button" onClick={() => setReplyMode("ownerToProfile")} style={replyMode === "ownerToProfile" ? goldBtn : btn}>
                  Owner → Profile
                </button>
              </div>

              <div style={messageRoute}>
                <strong>{senderName}</strong>
                <span>→</span>
                <strong>{recipientName}</strong>
              </div>

              <textarea
                style={textarea}
                value={body}
                onChange={(event) => setBody(event.target.value)}
                placeholder={`Reply in thread: ${finalSubject}`}
              />

              <button type="button" onClick={sendMessage} style={goldBtn}>Send Room Message</button>
            </section>

            <section style={card}>
              <div style={eyebrow}>This Room Thread</div>
              {!messages.length ? <p style={sub}>No messages in this room yet.</p> : null}
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
          </>
        ) : (
          <>
            <section style={card}>
              <div style={eyebrow}>Message Work Area</div>
              <h2 style={h2}>Active, saved, archived, deleted.</h2>
              <div style={filterRow}>
                {(["active", "saved", "archived", "deleted", "all"] as FilterState[]).map((item) => (
                  <button key={item} type="button" onClick={() => { setFilter(item); refreshThreads(); }} style={filter === item ? goldBtn : btn}>
                    {item.toUpperCase()} ({counts[item]})
                  </button>
                ))}
              </div>
            </section>

            <section style={card}>
              <div style={eyebrow}>Deal Room Message Cards</div>
              {!dealThreads.length ? <p style={sub}>No Deal Room threads in this folder.</p> : null}
              <div style={cardGrid}>
                {dealThreads.map((thread) => (
                  <ThreadCard key={thread.threadKey} thread={thread} onState={setThreadState} onDeleteForever={deleteForever} />
                ))}
              </div>
            </section>

            <section style={card}>
              <div style={eyebrow}>Pain Room Message Cards</div>
              {!painThreads.length ? <p style={sub}>No Pain Room threads in this folder.</p> : null}
              <div style={cardGrid}>
                {painThreads.map((thread) => (
                  <ThreadCard key={thread.threadKey} thread={thread} onState={setThreadState} onDeleteForever={deleteForever} />
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function ThreadCleanupButtons({
  thread,
  onState,
  onDeleteForever,
}: {
  thread: ThreadIndex;
  onState: (thread: ThreadIndex, state: ThreadState) => void;
  onDeleteForever: (thread: ThreadIndex) => void;
}) {
  return (
    <div style={cleanupBox}>
      <div style={miniEyebrow}>Current: {stateLabel(thread.state || "active")}</div>
      <div style={actionRowCompact}>
        <button type="button" onClick={() => onState(thread, "saved")} style={goldBtn}>Save</button>
        <button type="button" onClick={() => onState(thread, "archived")} style={btn}>Archive</button>
        <button type="button" onClick={() => onState(thread, "deleted")} style={redBtn}>Delete</button>
        {(thread.state || "active") === "deleted" ? (
          <>
            <button type="button" onClick={() => onState(thread, "active")} style={btn}>Restore</button>
            <button type="button" onClick={() => onDeleteForever(thread)} style={dangerBtn}>Delete Forever</button>
          </>
        ) : null}
      </div>
    </div>
  );
}

function ThreadCard({
  thread,
  onState,
  onDeleteForever,
}: {
  thread: ThreadIndex;
  onState: (thread: ThreadIndex, state: ThreadState) => void;
  onDeleteForever: (thread: ThreadIndex) => void;
}) {
  const href = `/messages?type=${encodeURIComponent(thread.roomType)}&room=${encodeURIComponent(thread.roomId)}&subject=${encodeURIComponent(thread.subject)}`;
  const roomHref = backHref(thread.roomType, thread.roomId);

  return (
    <article style={threadCard}>
      <div style={threadHeader}>
        <div>
          <div style={miniEyebrow}>{thread.roomType === "deal" ? "Deal Message Card" : "Pain Message Card"}</div>
          <h3 style={threadTitle}>{thread.subject}</h3>
        </div>
        <span style={statePill}>{stateLabel(thread.state || "active")}</span>
      </div>

      <p style={muted}>Room ID: {thread.roomId}</p>
      <p style={muted}>Sender: {thread.senderName || "Saved Profile"}</p>
      <p style={muted}>Recipient: {thread.recipientName || "Room Owner"}</p>
      <p style={threadPreview}>{thread.lastMessage}</p>
      <p style={muted}>{thread.count} messages • {thread.unread} unread • {niceDate(thread.lastAt)}</p>

      <div style={actionRowCompact}>
        <Link href={href} style={goldBtn}>Open Thread</Link>
        <Link href={roomHref} style={btn}>Open Room</Link>
      </div>

      <ThreadCleanupButtons thread={thread} onState={onState} onDeleteForever={onDeleteForever} />
    </article>
  );
}

const page: React.CSSProperties = {
  minHeight: "100vh",
  background: "#05070d",
  color: "#f7f7fb",
  padding: 18,
  fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
};

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
const dangerBtn: React.CSSProperties = { ...btn, background: "#3a080d", borderColor: "rgba(255,30,30,.75)", color: "#ffc9c9" };
const actionRow: React.CSSProperties = { display: "flex", gap: 12, flexWrap: "wrap", marginTop: 16 };
const actionRowCompact: React.CSSProperties = { display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 };
const filterRow: React.CSSProperties = { display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 };
const routeGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 };
const routeBox: React.CSSProperties = { background: "#121724", border: "1px solid rgba(207,216,230,.14)", borderRadius: 22, padding: 20 };
const routeTitle: React.CSSProperties = { fontSize: 28, margin: "0 0 8px", lineHeight: 1 };
const avatar: React.CSSProperties = { width: 92, height: 92, borderRadius: 18, objectFit: "cover", marginTop: 12, border: "1px solid rgba(245,197,66,.34)" };
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
const mutedBig: React.CSSProperties = { color: "#aeb7c7", margin: "8px 0 0", fontSize: 19 };
const messageBody: React.CSSProperties = { color: "#f7f7fb", fontSize: 20, lineHeight: 1.4, margin: "12px 0 0" };
const statePill: React.CSSProperties = { borderRadius: 999, padding: "8px 12px", background: "#ffdc68", color: "#10131a", fontWeight: 950, fontSize: 12 };
