"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type RoomType = "deal" | "pain" | "general";

type MessageRow = {
  id: string;
  threadKey: string;
  roomType: RoomType;
  roomId: string;
  subject: string;
  senderName: string;
  senderContact: string;
  body: string;
  createdAt: string;
  read: boolean;
};

type ThreadIndex = {
  threadKey: string;
  roomType: RoomType;
  roomId: string;
  subject: string;
  lastMessage: string;
  lastAt: string;
  count: number;
  unread: number;
};

const INDEX_KEY = "vaultforge_room_message_threads_v1";

function makeThreadKey(roomType: string, roomId: string) {
  const safeType = roomType === "pain" ? "pain" : roomType === "deal" ? "deal" : "general";
  const safeRoom = String(roomId || "general").trim() || "general";
  return `${safeType}:${safeRoom}`;
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

function readMessages(threadKey: string): MessageRow[] {
  if (typeof window === "undefined") return [];
  const parsed = parseJson<unknown>(window.localStorage.getItem(messagesKey(threadKey)), []);
  return Array.isArray(parsed) ? (parsed as MessageRow[]) : [];
}

function writeMessages(threadKey: string, rows: MessageRow[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(messagesKey(threadKey), JSON.stringify(rows));
}

function readIndex(): ThreadIndex[] {
  if (typeof window === "undefined") return [];
  const parsed = parseJson<unknown>(window.localStorage.getItem(INDEX_KEY), []);
  return Array.isArray(parsed) ? (parsed as ThreadIndex[]) : [];
}

function writeIndex(rows: ThreadIndex[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(INDEX_KEY, JSON.stringify(rows));
}

function rebuildIndexForThread(threadKey: string, roomType: RoomType, roomId: string, subject: string) {
  const messages = readMessages(threadKey);
  const latest = messages[0];

  const existing = readIndex().filter((item) => item.threadKey !== threadKey);

  const next: ThreadIndex = {
    threadKey,
    roomType,
    roomId,
    subject: subject || latest?.subject || `${roomType.toUpperCase()} Room Message`,
    lastMessage: latest?.body || "No messages yet.",
    lastAt: latest?.createdAt || new Date().toISOString(),
    count: messages.length,
    unread: messages.filter((item) => !item.read).length,
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
  const roomId = params.get("room") || "";
  const subject = params.get("subject") || "";

  return { roomType, roomId, subject };
}

function niceDate(value: string) {
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function backHref(roomType: RoomType, roomId: string) {
  if (roomType === "deal" && roomId) return `/deal-rooms/${encodeURIComponent(roomId)}`;
  if (roomType === "pain" && roomId) return `/pain-rooms/${encodeURIComponent(roomId)}`;
  return "/command";
}

export default function MessagesPage() {
  const [roomType, setRoomType] = useState<RoomType>("general");
  const [roomId, setRoomId] = useState("");
  const [subject, setSubject] = useState("");
  const [threads, setThreads] = useState<ThreadIndex[]>([]);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [senderName, setSenderName] = useState("");
  const [senderContact, setSenderContact] = useState("");
  const [body, setBody] = useState("");

  const threadKey = useMemo(() => makeThreadKey(roomType, roomId), [roomType, roomId]);
  const isRoomThread = roomType !== "general" && !!roomId;

  function load() {
    const route = readSearchParams();
    setRoomType(route.roomType);
    setRoomId(route.roomId);
    setSubject(route.subject);

    const key = makeThreadKey(route.roomType, route.roomId);

    if (route.roomType !== "general" && route.roomId) {
      const existingMessages = readMessages(key).map((item) => ({ ...item, read: true }));
      writeMessages(key, existingMessages);
      rebuildIndexForThread(key, route.roomType, route.roomId, route.subject);
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

  function sendMessage() {
    if (!isRoomThread) return;

    const cleanedBody = body.trim();
    if (!cleanedBody) return;

    const finalSubject = subject || `${roomType === "deal" ? "Deal Room" : "Pain Room"}: ${roomId}`;

    const nextMessage: MessageRow = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      threadKey,
      roomType,
      roomId,
      subject: finalSubject,
      senderName: senderName.trim() || "VaultForge Member",
      senderContact: senderContact.trim(),
      body: cleanedBody,
      createdAt: new Date().toISOString(),
      read: true,
    };

    const nextMessages = [nextMessage, ...readMessages(threadKey)];
    writeMessages(threadKey, nextMessages);
    rebuildIndexForThread(threadKey, roomType, roomId, finalSubject);

    setMessages(nextMessages);
    setThreads(readIndex());
    setBody("");
    window.dispatchEvent(new Event("vaultforge-message-change"));
  }

  function deleteThread(target: ThreadIndex) {
    const ok = window.confirm(`Delete message thread "${target.subject}"?`);
    if (!ok) return;

    window.localStorage.removeItem(messagesKey(target.threadKey));
    writeIndex(readIndex().filter((item) => item.threadKey !== target.threadKey));

    if (target.threadKey === threadKey) setMessages([]);
    setThreads(readIndex());
    window.dispatchEvent(new Event("vaultforge-message-change"));
  }

  const dealThreads = threads.filter((thread) => thread.roomType === "deal");
  const painThreads = threads.filter((thread) => thread.roomType === "pain");

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
          <h1 style={h1}>Room-specific communication.</h1>
          <p style={sub}>
            Deal Rooms and Pain Rooms keep separate message threads. No single mixed message bucket.
          </p>
        </section>

        {isRoomThread ? (
          <>
            <section style={card}>
              <div style={eyebrow}>{roomType === "deal" ? "Deal Room Thread" : "Pain Room Thread"}</div>
              <h2 style={h2}>{subject || `${roomType === "deal" ? "Deal Room" : "Pain Room"} message`}</h2>
              <p style={sub}>Room ID: {roomId}</p>
              <div style={actionRow}>
                <Link href={backHref(roomType, roomId)} style={goldBtn}>Back To Room</Link>
                <Link href="/messages" style={btn}>All Threads</Link>
              </div>
            </section>

            <section style={card}>
              <div style={eyebrow}>Send Message</div>
              <div style={formGrid}>
                <input style={input} value={senderName} onChange={(event) => setSenderName(event.target.value)} placeholder="Your name / company" />
                <input style={input} value={senderContact} onChange={(event) => setSenderContact(event.target.value)} placeholder="Phone / email / best contact" />
              </div>
              <textarea style={textarea} value={body} onChange={(event) => setBody(event.target.value)} placeholder={`Message about: ${subject || roomId}`} />
              <button type="button" onClick={sendMessage} style={goldBtn}>Send Room Message</button>
            </section>

            <section style={card}>
              <div style={eyebrow}>This Room Thread</div>
              {!messages.length ? <p style={sub}>No messages in this room yet.</p> : null}
              <div style={threadList}>
                {messages.map((message) => (
                  <article key={message.id} style={messageCard}>
                    <div style={messageTop}>
                      <strong>{message.senderName}</strong>
                      <span>{niceDate(message.createdAt)}</span>
                    </div>
                    {message.senderContact ? <p style={muted}>{message.senderContact}</p> : null}
                    <p style={messageBody}>{message.body}</p>
                  </article>
                ))}
              </div>
            </section>
          </>
        ) : (
          <>
            <section style={card}>
              <div style={eyebrow}>Deal Message Threads</div>
              {!dealThreads.length ? <p style={sub}>No Deal Room messages yet. Open a Deal Room and click Message Owner.</p> : null}
              <div style={threadList}>
                {dealThreads.map((thread) => (
                  <ThreadCard key={thread.threadKey} thread={thread} onDelete={() => deleteThread(thread)} />
                ))}
              </div>
            </section>

            <section style={card}>
              <div style={eyebrow}>Pain Message Threads</div>
              {!painThreads.length ? <p style={sub}>No Pain Room messages yet. Open a Pain Room and click Message Owner.</p> : null}
              <div style={threadList}>
                {painThreads.map((thread) => (
                  <ThreadCard key={thread.threadKey} thread={thread} onDelete={() => deleteThread(thread)} />
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function ThreadCard({ thread, onDelete }: { thread: ThreadIndex; onDelete: () => void }) {
  const href = `/messages?type=${encodeURIComponent(thread.roomType)}&room=${encodeURIComponent(thread.roomId)}&subject=${encodeURIComponent(thread.subject)}`;

  return (
    <article style={threadCard}>
      <div>
        <div style={miniEyebrow}>{thread.roomType === "deal" ? "Deal Thread" : "Pain Thread"}</div>
        <h3 style={threadTitle}>{thread.subject}</h3>
        <p style={muted}>Room ID: {thread.roomId}</p>
        <p style={threadPreview}>{thread.lastMessage}</p>
        <p style={muted}>{thread.count} messages • {thread.unread} unread • {niceDate(thread.lastAt)}</p>
      </div>
      <div style={actionRow}>
        <Link href={href} style={goldBtn}>Open Thread</Link>
        <button type="button" onClick={onDelete} style={redBtn}>Delete</button>
      </div>
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
  fontSize: "clamp(30px,5vw,52px)",
  lineHeight: 1,
  letterSpacing: -2,
  margin: "0 0 12px",
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

const actionRow: React.CSSProperties = {
  display: "flex",
  gap: 12,
  flexWrap: "wrap",
  marginTop: 16,
};

const formGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: 14,
  marginBottom: 14,
};

const input: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  borderRadius: 18,
  border: "1px solid rgba(207,216,230,.18)",
  background: "#121724",
  color: "#f6f7fb",
  padding: "17px 18px",
  fontSize: 16,
  outline: "none",
};

const textarea: React.CSSProperties = {
  ...input,
  minHeight: 140,
  resize: "vertical",
  marginBottom: 14,
};

const threadList: React.CSSProperties = {
  display: "grid",
  gap: 14,
};

const threadCard: React.CSSProperties = {
  background: "#121724",
  border: "1px solid rgba(207,216,230,.14)",
  borderRadius: 22,
  padding: 22,
};

const messageCard: React.CSSProperties = {
  background: "#121724",
  border: "1px solid rgba(207,216,230,.14)",
  borderRadius: 22,
  padding: 22,
};

const messageTop: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  flexWrap: "wrap",
  color: "#f7f7fb",
};

const threadTitle: React.CSSProperties = {
  fontSize: 28,
  margin: "0 0 10px",
};

const threadPreview: React.CSSProperties = {
  color: "#e7edf7",
  fontSize: 18,
  lineHeight: 1.35,
  margin: "10px 0",
};

const muted: React.CSSProperties = {
  color: "#aeb7c7",
  margin: "6px 0",
};

const messageBody: React.CSSProperties = {
  color: "#f7f7fb",
  fontSize: 20,
  lineHeight: 1.4,
  margin: "12px 0 0",
};
