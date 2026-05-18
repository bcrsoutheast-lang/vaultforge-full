"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Message = {
  id: string;
  roomId: string;
  roomType: string;
  roomTitle: string;
  subject: string;
  fromName: string;
  fromContact: string;
  toName: string;
  toContact: string;
  body: string;
  status: "active" | "saved" | "archived" | "deleted";
  createdAt: string;
};

type RoomLite = { id: string; type: "deal" | "pain"; title: string; owner: string; contact: string; subject: string };

const MESSAGE_KEY = "vaultforge_room_messages_v1";
const DEAL_KEYS = ["vaultforge_clean_deal_rooms", "vaultforge_deal_rooms", "vaultforge_rooms_deals", "vf_deal_rooms"];
const PAIN_KEYS = ["vaultforge_clean_pain_rooms_v1", "vaultforge_pain_rooms", "vf_pain_rooms"];

function readArray(key: string): any[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeMessages(messages: Message[]) {
  window.localStorage.setItem(MESSAGE_KEY, JSON.stringify(messages));
  window.dispatchEvent(new Event("vaultforge-messages-change"));
}

function readMessages(): Message[] {
  return readArray(MESSAGE_KEY).filter(Boolean) as Message[];
}

function safeText(value: any, fallback = "Not listed") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function roomId(row: any) {
  return String(row?.id || row?.roomId || row?.dealId || row?.painId || "");
}

function uniqueRooms(rows: any[], type: "deal" | "pain"): RoomLite[] {
  const map = new Map<string, RoomLite>();
  rows.forEach((row) => {
    const id = roomId(row);
    if (!id || map.has(`${type}:${id}`)) return;
    const title = safeText(row.title || row.name, type === "deal" ? "Untitled Deal Room" : "Untitled Pain Room");
    const owner = safeText(row.contactName || row.ownerName || row.submittedBy, "Owner / Submitter");
    const contact = safeText(row.contactEmail || row.contactPhone || row.ownerEmail || row.ownerPhone, "VaultForge Message");
    map.set(`${type}:${id}`, {
      id,
      type,
      title,
      owner,
      contact,
      subject: `${type === "deal" ? "Deal" : "Pain"}: ${title}`,
    });
  });
  return Array.from(map.values());
}

function readRooms(): RoomLite[] {
  const deals = DEAL_KEYS.flatMap(readArray);
  const pains = PAIN_KEYS.flatMap(readArray);
  return [...uniqueRooms(deals, "deal"), ...uniqueRooms(pains, "pain")];
}

function makeId() {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [rooms, setRooms] = useState<RoomLite[]>([]);
  const [selectedRoomKey, setSelectedRoomKey] = useState("");
  const [fromName, setFromName] = useState("");
  const [fromContact, setFromContact] = useState("");
  const [body, setBody] = useState("");
  const [toast, setToast] = useState("");

  function refresh() {
    const nextRooms = readRooms();
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get("room") || "";
    const typeParam = params.get("type") || "";
    const subjectParam = params.get("subject") || "";
    setRooms(nextRooms);
    setMessages(readMessages());

    if (roomParam) {
      const normalized = roomParam.includes(":") ? roomParam : typeParam ? `${typeParam}:${roomParam}` : roomParam;
      const found = nextRooms.find((room) => `${room.type}:${room.id}` === normalized || room.id === roomParam);
      if (found) setSelectedRoomKey(`${found.type}:${found.id}`);
      else if (subjectParam) {
        setSelectedRoomKey(`custom:${roomParam}`);
      }
    } else if (!selectedRoomKey && nextRooms[0]) {
      setSelectedRoomKey(`${nextRooms[0].type}:${nextRooms[0].id}`);
    }
  }

  useEffect(() => {
    refresh();
    window.addEventListener("vaultforge-messages-change", refresh);
    return () => window.removeEventListener("vaultforge-messages-change", refresh);
  }, []);

  const selectedRoom = useMemo(() => {
    return rooms.find((room) => `${room.type}:${room.id}` === selectedRoomKey) || null;
  }, [rooms, selectedRoomKey]);

  const visibleMessages = useMemo(() => {
    if (!selectedRoom) return messages.filter((message) => message.status !== "deleted");
    return messages.filter((message) => message.roomId === selectedRoom.id && message.roomType === selectedRoom.type && message.status !== "deleted");
  }, [messages, selectedRoom]);

  const counts = useMemo(() => ({
    active: messages.filter((m) => m.status === "active").length,
    saved: messages.filter((m) => m.status === "saved").length,
    archived: messages.filter((m) => m.status === "archived").length,
  }), [messages]);

  function submitMessage() {
    if (!selectedRoom) {
      setToast("Pick a Deal Room or Pain Room first.");
      return;
    }
    if (!body.trim()) {
      setToast("Add a message before sending.");
      return;
    }
    const next: Message = {
      id: makeId(),
      roomId: selectedRoom.id,
      roomType: selectedRoom.type,
      roomTitle: selectedRoom.title,
      subject: selectedRoom.subject,
      fromName: fromName.trim() || "VaultForge Member",
      fromContact: fromContact.trim() || "VaultForge Message",
      toName: selectedRoom.owner,
      toContact: selectedRoom.contact,
      body: body.trim(),
      status: "active",
      createdAt: new Date().toISOString(),
    };
    const nextMessages = [next, ...messages];
    setMessages(nextMessages);
    writeMessages(nextMessages);
    setBody("");
    setToast("Message saved to this room thread.");
    window.setTimeout(() => setToast(""), 2200);
  }

  function setMessageStatus(id: string, status: Message["status"]) {
    const next = messages.map((message) => (message.id === id ? { ...message, status } : message));
    setMessages(next);
    writeMessages(next);
  }

  return (
    <main style={page}>
      <div style={wrap}>
        <nav style={nav}>
          <Link href="/command" style={navBtn}>Command</Link>
          <Link href="/deal-rooms" style={navBtn}>Deal Rooms</Link>
          <Link href="/pain-intake" style={navBtn}>Pain Intake</Link>
          <Link href="/pain-rooms" style={navBtn}>Pain Rooms</Link>
          <Link href="/messages" style={goldBtn}>Messages</Link>
          <Link href="/profile" style={navBtn}>Profile</Link>
          <Link href="/" style={redBtn}>Exit</Link>
        </nav>

        {toast ? <div style={toastBox}>{toast}</div> : null}

        <section style={card}>
          <div style={eyebrow}>Messages</div>
          <h1 style={h1}>Room communication command.</h1>
          <p style={sub}>Every message attaches to a Deal Room or Pain Room. Subject lines match the room, so owner contact, member routing, and room context stay together.</p>
        </section>

        <section style={metricGrid}>
          <div style={metric}><span>Active</span><strong>{counts.active}</strong></div>
          <div style={metric}><span>Saved</span><strong>{counts.saved}</strong></div>
          <div style={metric}><span>Archived</span><strong>{counts.archived}</strong></div>
          <div style={metric}><span>Rooms</span><strong>{rooms.length}</strong></div>
        </section>

        <section style={twoCol}>
          <div style={card}>
            <div style={eyebrow}>Room Threads</div>
            <h2 style={h2}>Pick a room.</h2>
            {!rooms.length ? <p style={sub}>No Deal Rooms or Pain Rooms found yet.</p> : null}
            <div style={{ display: "grid", gap: 10 }}>
              {rooms.map((room) => {
                const key = `${room.type}:${room.id}`;
                const count = messages.filter((m) => m.roomId === room.id && m.roomType === room.type && m.status !== "deleted").length;
                return (
                  <button key={key} type="button" onClick={() => setSelectedRoomKey(key)} style={selectedRoomKey === key ? roomBtnActive : roomBtn}>
                    <strong>{room.title}</strong>
                    <span>{room.type.toUpperCase()} • {room.owner} • {count} messages</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div style={card}>
            <div style={eyebrow}>Compose</div>
            <h2 style={h2}>Message owner.</h2>
            <div style={subjectBox}>
              <strong>Subject:</strong> {selectedRoom ? selectedRoom.subject : "Pick a room"}<br />
              <strong>To:</strong> {selectedRoom ? `${selectedRoom.owner} • ${selectedRoom.contact}` : "No room selected"}
            </div>
            <div style={formGrid}>
              <input style={input} value={fromName} onChange={(e) => setFromName(e.target.value)} placeholder="Your name / company" />
              <input style={input} value={fromContact} onChange={(e) => setFromContact(e.target.value)} placeholder="Your phone / email" />
            </div>
            <textarea style={textarea} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write message tied to this room..." />
            <button type="button" style={goldButton} onClick={submitMessage}>Send / Save Room Message</button>
          </div>
        </section>

        <section style={card}>
          <div style={eyebrow}>Thread</div>
          <h2 style={h2}>{selectedRoom ? selectedRoom.title : "All messages"}</h2>
          <div style={{ display: "grid", gap: 14 }}>
            {!visibleMessages.length ? <p style={sub}>No messages in this room yet.</p> : null}
            {visibleMessages.map((message) => (
              <article key={message.id} style={messageCard}>
                <div style={eyebrow}>{message.subject}</div>
                <p style={sub}>{message.body}</p>
                <div style={small}>From: {message.fromName} • {message.fromContact}</div>
                <div style={small}>To: {message.toName} • {message.toContact}</div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
                  <button type="button" style={miniBtn} onClick={() => setMessageStatus(message.id, "saved")}>Save</button>
                  <button type="button" style={miniBtn} onClick={() => setMessageStatus(message.id, "archived")}>Archive</button>
                  <button type="button" style={miniRed} onClick={() => setMessageStatus(message.id, "deleted")}>Delete</button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

const page: React.CSSProperties = { minHeight: "100vh", background: "#05070d", color: "#f7f7fb", padding: 18, fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" };
const wrap: React.CSSProperties = { maxWidth: 1180, margin: "0 auto", paddingBottom: 70 };
const nav: React.CSSProperties = { display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 18 };
const navBtn: React.CSSProperties = { border: "1px solid rgba(207,216,230,.18)", background: "#171c29", color: "#f7f7fb", borderRadius: 999, padding: "13px 18px", fontWeight: 950, textDecoration: "none", display: "inline-block" };
const goldBtn: React.CSSProperties = { ...navBtn, border: 0, background: "#ffdc68", color: "#10131a" };
const redBtn: React.CSSProperties = { ...navBtn, background: "#271016", borderColor: "rgba(255,70,70,.48)", color: "#ffaaaa" };
const card: React.CSSProperties = { background: "linear-gradient(180deg,#080d19,#050816)", border: "1px solid rgba(245,197,66,.28)", borderRadius: 26, padding: 28, marginBottom: 22 };
const eyebrow: React.CSSProperties = { color: "#ffd45a", textTransform: "uppercase", letterSpacing: 8, fontWeight: 900, fontSize: 16, marginBottom: 14 };
const h1: React.CSSProperties = { fontSize: "clamp(42px,7vw,72px)", lineHeight: .92, letterSpacing: -4, margin: "0 0 18px", fontWeight: 950 };
const h2: React.CSSProperties = { fontSize: "clamp(30px,5vw,48px)", lineHeight: .96, letterSpacing: -2, margin: "0 0 18px", fontWeight: 950 };
const sub: React.CSSProperties = { color: "#c9d0dc", fontSize: 21, lineHeight: 1.35, margin: 0 };
const metricGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 14, marginBottom: 22 };
const metric: React.CSSProperties = { ...card, marginBottom: 0, padding: 20 };
const twoCol: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(310px,1fr))", gap: 22 };
const roomBtn: React.CSSProperties = { textAlign: "left", border: "1px solid rgba(207,216,230,.18)", background: "#121724", color: "#f7f7fb", borderRadius: 18, padding: 16, cursor: "pointer" };
const roomBtnActive: React.CSSProperties = { ...roomBtn, borderColor: "#ffdc68", boxShadow: "0 0 0 1px rgba(255,220,104,.4)" };
const subjectBox: React.CSSProperties = { border: "1px solid rgba(245,197,66,.28)", background: "rgba(255,220,104,.06)", borderRadius: 18, padding: 16, color: "#dce4ef", lineHeight: 1.5, marginBottom: 16 };
const formGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 };
const input: React.CSSProperties = { width: "100%", boxSizing: "border-box", borderRadius: 16, border: "1px solid rgba(207,216,230,.18)", background: "#121724", color: "#f6f7fb", padding: "15px 16px", fontSize: 16, outline: "none" };
const textarea: React.CSSProperties = { ...input, minHeight: 160, marginTop: 12, resize: "vertical" };
const goldButton: React.CSSProperties = { border: 0, background: "#ffdc68", color: "#10131a", borderRadius: 999, padding: "15px 22px", fontWeight: 950, cursor: "pointer", marginTop: 14 };
const messageCard: React.CSSProperties = { border: "1px solid rgba(207,216,230,.18)", background: "#101622", borderRadius: 22, padding: 20 };
const miniBtn: React.CSSProperties = { ...navBtn, padding: "10px 14px", cursor: "pointer" };
const miniRed: React.CSSProperties = { ...redBtn, padding: "10px 14px", cursor: "pointer" };
const small: React.CSSProperties = { color: "#9ca8ba", fontSize: 14, marginTop: 6 };
const toastBox: React.CSSProperties = { position: "fixed", top: 18, left: "50%", transform: "translateX(-50%)", zIndex: 9999, background: "#102818", color: "#fff", border: "1px solid rgba(101,255,151,.5)", borderRadius: 18, padding: "14px 18px", boxShadow: "0 18px 70px rgba(0,0,0,.55)", fontWeight: 900 };
