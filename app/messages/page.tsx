"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Lane = "deal" | "pain" | "member" | "general";
type ThreadStatus = "active" | "saved" | "archived" | "deleted";

type Message = {
  id: string;
  body: string;
  from: string;
  at: string;
};

type Thread = {
  id: string;
  lane: Lane;
  roomId: string;
  roomType: "deal" | "pain" | "member" | "general";
  subject: string;
  state: string;
  roomTitle: string;
  roomSubtitle: string;
  status: ThreadStatus;
  unread: boolean;
  saved: boolean;
  createdAt: string;
  updatedAt: string;
  messages: Message[];
};

type Room = {
  id?: string;
  roomId?: string;
  title?: string;
  name?: string;
  state?: string;
  city?: string;
  county?: string;
  assetClass?: string;
  propertyType?: string;
  severity?: string;
  timePressure?: string;
  painTypes?: string[] | string;
  routeTo?: string[] | string;
  needs?: string[] | string;
  routingNeeds?: string[] | string;
  roomState?: string;
  cleanupState?: string;
  stateStatus?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
};

const THREAD_KEY = "vaultforge_message_threads_v2";
const LEGACY_KEYS = ["vaultforge_message_command_messages", "vf_message_threads"];
const DEAL_KEYS = ["vaultforge_clean_deal_rooms", "vaultforge_deal_rooms", "vaultforge_rooms_deals", "vf_deal_rooms"];
const PAIN_KEYS = ["vaultforge_clean_pain_rooms_v2", "vaultforge_clean_pain_rooms_v1", "vaultforge_clean_pain_rooms", "vaultforge_pain_rooms", "vaultforge_rooms_pain", "vf_pain_rooms"];

function ok() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function j<T>(raw: string | null, fallback: T): T {
  try {
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function txt(value: unknown, fallback = "") {
  const clean = String(value || "").trim();
  return clean || fallback;
}

function list(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((x) => String(x).trim()).filter(Boolean);
  if (typeof value === "string" && value.trim()) return value.split(",").map((x) => x.trim()).filter(Boolean);
  return [];
}

function arr<T>(key: string): T[] {
  if (!ok()) return [];
  const parsed = j<unknown>(localStorage.getItem(key), []);
  return Array.isArray(parsed) ? (parsed as T[]) : [];
}

function rid(room: Room | null | undefined) {
  return txt(room?.id || room?.roomId);
}

function loc(room: Room) {
  return [txt(room.city), txt(room.county), txt(room.state)].filter(Boolean).join(", ") || "Market not listed";
}

function titleFor(room: Room, kind: "deal" | "pain") {
  return txt(room.title || room.name, kind === "deal" ? "Untitled Deal Room" : "Untitled Pain Room");
}

function normalizeRoom(row: any, kind: "deal" | "pain"): Room {
  const id = txt(row?.id || row?.roomId || row?.dealId || row?.painId || row?.signalId);
  return {
    ...row,
    id,
    roomId: id,
    title: txt(row?.title || row?.name || row?.dealTitle || row?.painTitle || row?.problemTitle, kind === "deal" ? "Untitled Deal Room" : "Untitled Pain Room"),
    state: txt(row?.state, "GA"),
    city: txt(row?.city),
    county: txt(row?.county),
  };
}

function allRooms(kind: "deal" | "pain"): Room[] {
  if (!ok()) return [];
  const out: Room[] = [];
  const seen = new Set<string>();
  const keys = kind === "deal" ? DEAL_KEYS : PAIN_KEYS;

  for (const key of keys) {
    for (const row of arr<any>(key)) {
      const room = normalizeRoom(row, kind);
      const id = rid(room);
      if (!id || seen.has(id)) continue;
      seen.add(id);
      out.push(room);
    }
  }

  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i) || "";
    const match = kind === "deal" ? key.includes("deal_room") || key.includes("deal_rooms") : key.includes("pain_room") || key.includes("pain_rooms");
    if (!match) continue;

    const value = j<any>(localStorage.getItem(key), null);
    if (Array.isArray(value)) {
      for (const row of value) {
        const room = normalizeRoom(row, kind);
        const id = rid(room);
        if (!id || seen.has(id)) continue;
        seen.add(id);
        out.push(room);
      }
    } else if (value && typeof value === "object") {
      const room = normalizeRoom(value, kind);
      const id = rid(room);
      if (id && !seen.has(id)) {
        seen.add(id);
        out.push(room);
      }
    }
  }

  return out;
}

function getRoom(kind: "deal" | "pain", id: string) {
  return allRooms(kind).find((room) => rid(room) === id) || null;
}

function roomContext(kind: "deal" | "pain", roomId: string) {
  const room = getRoom(kind, roomId);
  if (!room) {
    return {
      state: "",
      roomTitle: roomId ? `${kind.toUpperCase()} ROOM ${roomId.slice(0, 8)}` : "Room Context",
      roomSubtitle: "Room data not found",
    };
  }

  if (kind === "deal") {
    return {
      state: txt(room.state),
      roomTitle: titleFor(room, "deal"),
      roomSubtitle: `${loc(room)} • ${txt(room.assetClass, "Deal")} • ${txt(room.propertyType, "Type")} • Route ${list(room.routeTo).join(", ") || "open"}`,
    };
  }

  return {
    state: txt(room.state),
    roomTitle: titleFor(room, "pain"),
    roomSubtitle: `${loc(room)} • ${list(room.painTypes).join(", ") || "Pain"} • ${txt(room.severity, "High")} • Needs ${list(room.needs || room.routingNeeds).join(", ") || "solver"}`,
  };
}

function normalizeThread(raw: any): Thread {
  const now = new Date().toISOString();
  const rawLane = txt(raw?.lane || raw?.type || raw?.roomType, "general").toLowerCase();
  const lane: Lane = rawLane.includes("deal") ? "deal" : rawLane.includes("pain") ? "pain" : rawLane.includes("member") ? "member" : "general";
  const roomType: Thread["roomType"] = lane === "deal" || lane === "pain" ? lane : lane === "member" ? "member" : "general";
  const roomId = txt(raw?.roomId || raw?.room_id || raw?.room || raw?.itemId || raw?.id_ref);
  const context = lane === "deal" || lane === "pain" ? roomContext(lane, roomId) : { state: txt(raw?.state), roomTitle: txt(raw?.roomTitle || raw?.subject, "General Message"), roomSubtitle: txt(raw?.roomSubtitle || raw?.lane, "General") };
  const id = txt(raw?.id || raw?.threadKey || raw?.thread_id || raw?.message_id) || `${lane}_${roomId || "general"}_${Date.now()}`;

  let messages: Message[] = [];
  if (Array.isArray(raw?.messages)) {
    messages = raw.messages.map((msg: any, index: number) => ({
      id: txt(msg?.id, `${id}_msg_${index}`),
      body: txt(msg?.body || msg?.text || msg?.message, ""),
      from: txt(msg?.from || msg?.sender || msg?.author, "VaultForge"),
      at: txt(msg?.at || msg?.createdAt || msg?.updatedAt, now),
    })).filter((msg: Message) => msg.body);
  } else if (txt(raw?.body || raw?.text || raw?.message)) {
    messages = [{
      id: `${id}_msg_0`,
      body: txt(raw?.body || raw?.text || raw?.message),
      from: txt(raw?.from || raw?.sender || raw?.author, "VaultForge"),
      at: txt(raw?.createdAt || raw?.updatedAt, now),
    }];
  }

  return {
    id,
    lane,
    roomId,
    roomType,
    subject: txt(raw?.subject || raw?.title || context.roomTitle, context.roomTitle),
    state: txt(raw?.state || context.state),
    roomTitle: context.roomTitle,
    roomSubtitle: context.roomSubtitle,
    status: (["active", "saved", "archived", "deleted"].includes(txt(raw?.status)) ? txt(raw?.status) : "active") as ThreadStatus,
    unread: Boolean(raw?.unread || raw?.isUnread),
    saved: Boolean(raw?.saved),
    createdAt: txt(raw?.createdAt, now),
    updatedAt: txt(raw?.updatedAt || raw?.createdAt, now),
    messages,
  };
}

function readThreads(): Thread[] {
  if (!ok()) return [];
  const out: Thread[] = [];
  const seen = new Set<string>();

  for (const key of [THREAD_KEY, ...LEGACY_KEYS]) {
    for (const raw of arr<any>(key)) {
      const thread = normalizeThread(raw);
      if (!thread.id || seen.has(thread.id)) continue;
      seen.add(thread.id);
      out.push(thread);
    }
  }

  return out.sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
}

function writeThreads(threads: Thread[]) {
  writeJson(THREAD_KEY, threads);
  window.dispatchEvent(new Event("vaultforge-messages-change"));
  window.dispatchEvent(new Event("vaultforge-alert-change"));
}

function makeSeedThread(lane: Lane, subject: string, roomId = ""): Thread {
  const now = new Date().toISOString();
  const context = lane === "deal" || lane === "pain" ? roomContext(lane, roomId) : { state: "", roomTitle: subject, roomSubtitle: lane };
  return {
    id: `${lane}_${roomId || "general"}_${Date.now()}`,
    lane,
    roomId,
    roomType: lane === "deal" || lane === "pain" ? lane : lane === "member" ? "member" : "general",
    subject,
    state: context.state,
    roomTitle: context.roomTitle,
    roomSubtitle: context.roomSubtitle,
    status: "active",
    unread: false,
    saved: false,
    createdAt: now,
    updatedAt: now,
    messages: [],
  };
}

function seedFromUrl() {
  if (!ok()) return null as Thread | null;
  const url = new URL(window.location.href);
  const type = txt(url.searchParams.get("type") || url.searchParams.get("lane") || "general").toLowerCase();
  const lane: Lane = type.includes("deal") ? "deal" : type.includes("pain") ? "pain" : type.includes("member") ? "member" : "general";
  const roomId = txt(url.searchParams.get("room") || url.searchParams.get("roomId") || "");
  const subject = txt(url.searchParams.get("subject"), lane === "deal" ? "Deal Room Message" : lane === "pain" ? "Pain Room Message" : "General Message");

  if (!roomId && !url.searchParams.get("subject")) return null;
  return makeSeedThread(lane, subject, roomId);
}

const styleTag = `
@keyframes vfPulseRed {
  0% { box-shadow: 0 0 0 rgba(255,60,70,.0); transform: translateY(0); }
  50% { box-shadow: 0 0 34px rgba(255,60,70,.34); transform: translateY(-1px); }
  100% { box-shadow: 0 0 0 rgba(255,60,70,.0); transform: translateY(0); }
}
@keyframes vfPulseGold {
  0% { box-shadow: 0 0 0 rgba(255,220,104,.0); transform: translateY(0); }
  50% { box-shadow: 0 0 34px rgba(255,220,104,.28); transform: translateY(-1px); }
  100% { box-shadow: 0 0 0 rgba(255,220,104,.0); transform: translateY(0); }
}
`;

const page: React.CSSProperties = { minHeight: "100vh", background: "#05070d", color: "#f7f7fb", padding: 18, fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" };
const wrap: React.CSSProperties = { maxWidth: 1280, margin: "0 auto", paddingBottom: 90 };
const nav: React.CSSProperties = { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 18 };
const brand: React.CSSProperties = { color: "#ffd45a", fontSize: 27, fontWeight: 950, letterSpacing: -1, marginRight: 10 };
const btn: React.CSSProperties = { border: "1px solid rgba(207,216,230,.18)", background: "#171c29", color: "#f7f7fb", borderRadius: 999, padding: "13px 18px", fontWeight: 950, textDecoration: "none", display: "inline-block", cursor: "pointer" };
const goldBtn: React.CSSProperties = { ...btn, border: 0, background: "#ffdc68", color: "#10131a" };
const redBtn: React.CSSProperties = { ...btn, background: "#271016", borderColor: "rgba(255,70,70,.48)", color: "#ffaaaa" };
const hero: React.CSSProperties = { border: "1px solid rgba(245,197,66,.28)", borderRadius: 28, padding: 30, marginBottom: 20, background: "radial-gradient(circle at top right, rgba(245,197,66,.16), transparent 32%), linear-gradient(180deg,#080d19,#050816)" };
const card: React.CSSProperties = { background: "linear-gradient(180deg,#080d19,#050816)", border: "1px solid rgba(245,197,66,.28)", borderRadius: 26, padding: 26, marginBottom: 22 };
const panel: React.CSSProperties = { background: "#121724", border: "1px solid rgba(207,216,230,.16)", borderRadius: 22, padding: 22, color: "#f7f7fb", textDecoration: "none", display: "block" };
const activePanel: React.CSSProperties = { ...panel, borderColor: "rgba(245,197,66,.75)", boxShadow: "0 0 26px rgba(245,197,66,.18)" };
const pulseRed: React.CSSProperties = { ...panel, borderColor: "rgba(255,70,70,.70)", animation: "vfPulseRed 2.1s ease-in-out infinite" };
const pulseGold: React.CSSProperties = { ...panel, borderColor: "rgba(255,220,104,.70)", animation: "vfPulseGold 2.3s ease-in-out infinite" };
const eyebrow: React.CSSProperties = { color: "#ffd45a", textTransform: "uppercase", letterSpacing: 7, fontWeight: 950, fontSize: 15, marginBottom: 12 };
const h1: React.CSSProperties = { fontSize: "clamp(44px,8vw,86px)", lineHeight: 0.9, letterSpacing: -4, margin: "0 0 18px", fontWeight: 950 };
const h2: React.CSSProperties = { fontSize: "clamp(30px,5vw,52px)", lineHeight: 0.95, letterSpacing: -2, margin: "0 0 14px", fontWeight: 950 };
const sub: React.CSSProperties = { color: "#c9d0dc", fontSize: 21, lineHeight: 1.35, margin: 0 };
const muted: React.CSSProperties = { color: "#aeb7c7", margin: "8px 0 0", lineHeight: 1.35 };
const grid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(245px,1fr))", gap: 16 };
const row: React.CSSProperties = { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" };
const input: React.CSSProperties = { width: "100%", boxSizing: "border-box", border: "1px solid rgba(207,216,230,.18)", background: "#151b2a", color: "#f8fafc", borderRadius: 18, padding: "15px 16px", fontSize: 16 };
const textarea: React.CSSProperties = { ...input, minHeight: 120, resize: "vertical" };

function Nav() {
  return (
    <nav style={nav}>
      <div style={brand}>VAULTFORGE</div>
      <Link href="/command" style={btn}>Command</Link>
      <Link href="/state-map" style={btn}>State Map</Link>
      <Link href="/network" style={btn}>Network</Link>
      <Link href="/alerts" style={btn}>Alerts</Link>
      <Link href="/messages" style={goldBtn}>Messages</Link>
      <Link href="/deal-create" style={btn}>Create Deal</Link>
      <Link href="/pain-intake" style={btn}>Pain Intake</Link>
      <Link href="/profile" style={btn}>Profile</Link>
      <Link href="/logout" style={redBtn}>Logout</Link>
    </nav>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section style={card}><div style={eyebrow}>{title}</div>{children}</section>;
}

function laneLabel(lane: Lane) {
  if (lane === "deal") return "Deal";
  if (lane === "pain") return "Pain";
  if (lane === "member") return "Member";
  return "General";
}

function ThreadCard({ thread, active, onOpen }: { thread: Thread; active: boolean; onOpen: () => void }) {
  const style = active ? activePanel : thread.unread ? (thread.lane === "pain" ? pulseRed : pulseGold) : panel;
  return (
    <button type="button" style={{ ...style, textAlign: "left", cursor: "pointer" }} onClick={onOpen}>
      <div style={eyebrow}>{laneLabel(thread.lane)} Message {thread.unread ? "• Unread" : ""}</div>
      <h2 style={h2}>{thread.subject}</h2>
      <p style={sub}>{thread.roomTitle}</p>
      <p style={muted}>{thread.roomSubtitle}</p>
      <p style={muted}>{thread.messages.length} message(s) • {new Date(thread.updatedAt).toLocaleString()}</p>
    </button>
  );
}

function MessageBubble({ message }: { message: Message }) {
  return (
    <div style={panel}>
      <div style={eyebrow}>{message.from} • {new Date(message.at).toLocaleString()}</div>
      <p style={sub}>{message.body}</p>
    </div>
  );
}

export default function MessagesPage() {
  const [tick, setTick] = useState(0);
  const [lane, setLane] = useState<Lane | "all">("all");
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeId, setActiveId] = useState("");
  const [reply, setReply] = useState("");
  const [newGeneral, setNewGeneral] = useState("");

  useEffect(() => {
    const refresh = () => setTick((x) => x + 1);
    window.addEventListener("storage", refresh);
    window.addEventListener("vaultforge-messages-change", refresh);
    window.addEventListener("vaultforge-alert-change", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("vaultforge-messages-change", refresh);
      window.removeEventListener("vaultforge-alert-change", refresh);
    };
  }, []);

  useEffect(() => {
    let current = readThreads();
    const seeded = seedFromUrl();

    if (seeded) {
      const exists = current.find((thread) =>
        thread.lane === seeded.lane &&
        thread.roomId === seeded.roomId &&
        thread.subject === seeded.subject
      );

      if (!exists) {
        current = [seeded, ...current];
        writeThreads(current);
      }
    }

    setThreads(current);
  }, [tick]);

  const counts = useMemo(() => ({
    all: threads.filter((thread) => thread.status === "active").length,
    deal: threads.filter((thread) => thread.status === "active" && thread.lane === "deal").length,
    pain: threads.filter((thread) => thread.status === "active" && thread.lane === "pain").length,
    member: threads.filter((thread) => thread.status === "active" && thread.lane === "member").length,
    general: threads.filter((thread) => thread.status === "active" && thread.lane === "general").length,
    unread: threads.filter((thread) => thread.status === "active" && thread.unread).length,
    saved: threads.filter((thread) => thread.saved || thread.status === "saved").length,
    archived: threads.filter((thread) => thread.status === "archived").length,
    deleted: threads.filter((thread) => thread.status === "deleted").length,
  }), [threads]);

  const visible = useMemo(() => {
    const active = threads.filter((thread) => thread.status === "active");
    return lane === "all" ? active : active.filter((thread) => thread.lane === lane);
  }, [threads, lane]);

  const activeThread = threads.find((thread) => thread.id === activeId) || null;

  function persist(next: Thread[]) {
    setThreads(next);
    writeThreads(next);
  }

  function openThread(id: string) {
    const next = threads.map((thread) => thread.id === id ? { ...thread, unread: false, updatedAt: new Date().toISOString() } : thread);
    persist(next);
    setActiveId(id);
  }

  function updateThread(id: string, changes: Partial<Thread>) {
    persist(threads.map((thread) => thread.id === id ? { ...thread, ...changes, updatedAt: new Date().toISOString() } : thread));
  }

  function sendReply() {
    if (!activeThread || !reply.trim()) return;
    const message: Message = {
      id: `${activeThread.id}_msg_${Date.now()}`,
      body: reply.trim(),
      from: "Me",
      at: new Date().toISOString(),
    };

    persist(threads.map((thread) =>
      thread.id === activeThread.id
        ? { ...thread, messages: [...thread.messages, message], unread: false, updatedAt: message.at }
        : thread
    ));
    setReply("");
  }

  function createGeneral() {
    if (!newGeneral.trim()) return;
    const thread = makeSeedThread("general", newGeneral.trim());
    thread.messages = [{
      id: `${thread.id}_msg_0`,
      body: "General message thread created.",
      from: "VaultForge",
      at: new Date().toISOString(),
    }];
    persist([thread, ...threads]);
    setActiveId(thread.id);
    setNewGeneral("");
  }

  function laneButton(value: Lane | "all", label: string, count: number) {
    const unread = value === "all"
      ? counts.unread
      : threads.filter((thread) => thread.status === "active" && thread.lane === value && thread.unread).length;

    return (
      <button type="button" style={lane === value ? activePanel : unread ? pulseRed : panel} onClick={() => { setLane(value); setActiveId(""); }}>
        <div style={eyebrow}>{label}</div>
        <h2 style={h2}>{count}</h2>
        <p style={muted}>{unread} unread</p>
      </button>
    );
  }

  return (
    <main style={page}>
      <style>{styleTag}</style>
      <div style={wrap}>
        <Nav />

        <section style={hero}>
          <div style={eyebrow}>Message Command</div>
          <h1 style={h1}>Message cards first.</h1>
          <p style={sub}>Deal, Pain, Member, and General messages stay separated. Click a card to read or reply.</p>
        </section>

        <Section title="Message Lanes">
          <div style={grid}>
            {laneButton("all", "All Cards", counts.all)}
            {laneButton("deal", "Deal Messages", counts.deal)}
            {laneButton("pain", "Pain Messages", counts.pain)}
            {laneButton("member", "Member Messages", counts.member)}
            {laneButton("general", "General Messages", counts.general)}
          </div>
        </Section>

        <Section title="Folders">
          <div style={grid}>
            <div style={counts.saved ? pulseGold : panel}><div style={eyebrow}>Saved</div><h2 style={h2}>{counts.saved}</h2><p style={muted}>saved message threads</p></div>
            <div style={panel}><div style={eyebrow}>Archived</div><h2 style={h2}>{counts.archived}</h2><p style={muted}>archived threads</p></div>
            <div style={panel}><div style={eyebrow}>Deleted</div><h2 style={h2}>{counts.deleted}</h2><p style={muted}>deleted threads</p></div>
          </div>
        </Section>

        <Section title="Create General Message">
          <div style={row}>
            <input
              style={{ ...input, flex: "1 1 320px" }}
              placeholder="Start a general/member message thread"
              value={newGeneral}
              onChange={(event) => setNewGeneral(event.target.value)}
              onKeyDownCapture={(event) => event.stopPropagation()}
            />
            <button type="button" style={goldBtn} onClick={createGeneral}>Create Thread</button>
          </div>
        </Section>

        <Section title={activeThread ? "Selected Thread" : "Message Cards"}>
          {!activeThread ? (
            visible.length ? (
              <div style={grid}>
                {visible.map((thread) => (
                  <ThreadCard key={thread.id} thread={thread} active={activeId === thread.id} onOpen={() => openThread(thread.id)} />
                ))}
              </div>
            ) : <p style={sub}>No message cards in this lane.</p>
          ) : (
            <div style={{ display: "grid", gap: 16 }}>
              <div style={activeThread.unread ? pulseRed : activePanel}>
                <div style={eyebrow}>{laneLabel(activeThread.lane)} Thread</div>
                <h2 style={h2}>{activeThread.subject}</h2>
                <p style={sub}>{activeThread.roomTitle}</p>
                <p style={muted}>{activeThread.roomSubtitle}</p>
                <div style={{ ...row, marginTop: 16 }}>
                  <button type="button" style={btn} onClick={() => setActiveId("")}>Back to Cards</button>
                  <button type="button" style={activeThread.saved ? goldBtn : btn} onClick={() => updateThread(activeThread.id, { saved: !activeThread.saved })}>{activeThread.saved ? "Saved" : "Save"}</button>
                  <button type="button" style={btn} onClick={() => updateThread(activeThread.id, { unread: !activeThread.unread })}>{activeThread.unread ? "Mark Read" : "Mark Unread"}</button>
                  <button type="button" style={btn} onClick={() => updateThread(activeThread.id, { status: "archived" })}>Archive</button>
                  <button type="button" style={redBtn} onClick={() => updateThread(activeThread.id, { status: "deleted" })}>Delete</button>
                  {activeThread.roomType === "deal" && activeThread.roomId ? <Link href={`/deal-rooms/${encodeURIComponent(activeThread.roomId)}`} style={goldBtn}>Open Deal Room</Link> : null}
                  {activeThread.roomType === "pain" && activeThread.roomId ? <Link href={`/pain-rooms/${encodeURIComponent(activeThread.roomId)}`} style={goldBtn}>Open Pain Room</Link> : null}
                </div>
              </div>

              <div style={{ display: "grid", gap: 12 }}>
                {activeThread.messages.length ? activeThread.messages.map((message) => <MessageBubble key={message.id} message={message} />) : <p style={sub}>No messages yet. Reply below to start this thread.</p>}
              </div>

              <div style={panel}>
                <div style={eyebrow}>Reply</div>
                <textarea
                  style={textarea}
                  placeholder="Type reply..."
                  value={reply}
                  onChange={(event) => setReply(event.target.value)}
                  onKeyDownCapture={(event) => event.stopPropagation()}
                />
                <div style={{ ...row, marginTop: 14 }}>
                  <button type="button" style={goldBtn} onClick={sendReply}>Send Reply</button>
                </div>
              </div>
            </div>
          )}
        </Section>
      </div>
    </main>
  );
}
