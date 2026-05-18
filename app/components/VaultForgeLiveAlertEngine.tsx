"use client";

import { useEffect, useMemo, useState } from "react";

type AlertType = "deal" | "pain" | "message";
type Severity = "critical" | "high" | "medium" | "low";
type RoomState = "active" | "saved" | "archived" | "deleted";

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
  county?: string;
  city?: string;
  urgency?: string[] | string;
  painTypes?: string[] | string;
  routeTo?: string[] | string;
  routedTo?: string[] | string;
  routingNeeds?: string[] | string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
};

type AlertRow = {
  id: string;
  roomKey: string;
  type: AlertType;
  title: string;
  subtitle: string;
  severity: Severity;
  timestamp: string;
  href: string;
  lane: string;
};

type MessageRow = {
  subject?: string;
  body?: string;
  createdAt?: string;
  read?: boolean;
};

type SummaryCard = {
  key: AlertType;
  label: string;
  count: number;
  unread: number;
  newest: string;
  pulse: boolean;
  severity: Severity;
};

const DEAL_KEYS = ["vaultforge_clean_deal_rooms", "vaultforge_deal_rooms", "vaultforge_rooms_deals", "vf_deal_rooms"];
const PAIN_KEYS = ["vaultforge_clean_pain_rooms_v1", "vaultforge_clean_pain_rooms", "vaultforge_pain_rooms", "vaultforge_rooms_pain", "vf_pain_rooms"];

const ROOM_STATE_KEYS = [
  "vaultforge_clean_room_states",
  "vaultforge_room_states",
  "vaultforge_deal_room_states",
  "vaultforge_pain_room_states",
  "vaultforge_5s_room_states",
];

const SEEN_KEY = "vaultforge_live_alert_seen_v4";
const MAX_PULSE_CARDS = 5;
const MAX_VISIBLE_ALERTS = 8;
const MAX_VISIBLE_TICKETS = 5;

function parseJson<T>(raw: string | null, fallback: T): T {
  try {
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function cleanText(value: unknown, fallback = "") {
  if (value === undefined || value === null) return fallback;
  const clean = String(value).trim();
  return clean || fallback;
}

function asList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  if (typeof value === "string" && value.trim()) return value.split(",").map((item) => item.trim()).filter(Boolean);
  return [];
}

function getRoomId(room: RoomRecord | null | undefined) {
  return cleanText(room?.id || room?.roomId || room?.dealId || room?.painId, "");
}

function readRoomStates(): Record<string, RoomState> {
  if (typeof window === "undefined") return {};
  const merged: Record<string, RoomState> = {};

  for (const key of ROOM_STATE_KEYS) {
    const parsed = parseJson<Record<string, RoomState>>(window.localStorage.getItem(key), {});
    Object.assign(merged, parsed);
  }

  return merged;
}

function roomCurrentState(room: RoomRecord, type: "deal" | "pain"): RoomState {
  const states = readRoomStates();
  const id = getRoomId(room);
  const compound = `${type}:${id}`;
  const state = states[compound] || states[id] || room.roomState || room.cleanupState || room.stateStatus || "active";
  if (state === "saved" || state === "archived" || state === "deleted") return state;
  return "active";
}

function isActiveRoom(room: RoomRecord, type: "deal" | "pain") {
  return roomCurrentState(room, type) === "active";
}

function readRoomArray(key: string): RoomRecord[] {
  if (typeof window === "undefined") return [];
  const parsed = parseJson<unknown>(window.localStorage.getItem(key), []);
  return Array.isArray(parsed) ? (parsed as RoomRecord[]) : [];
}

function uniqueRooms(keys: string[], type: "deal" | "pain"): RoomRecord[] {
  if (typeof window === "undefined") return [];

  const map = new Map<string, RoomRecord>();

  for (const key of keys) {
    for (const room of readRoomArray(key)) {
      const id = getRoomId(room);
      if (id && !map.has(id)) map.set(id, { ...room, id });
    }
  }

  for (let i = 0; i < window.localStorage.length; i += 1) {
    const key = window.localStorage.key(i) || "";
    const isDeal = type === "deal" && (key.startsWith("vaultforge_clean_deal_room_") || key.startsWith("vaultforge_deal_room_"));
    const isPain = type === "pain" && (key.startsWith("vaultforge_clean_pain_room_") || key.startsWith("vaultforge_pain_room_"));

    if (!isDeal && !isPain) continue;

    const room = parseJson<RoomRecord | null>(window.localStorage.getItem(key), null);
    const id = getRoomId(room);
    if (room && id && !map.has(id)) map.set(id, { ...room, id });
  }

  return Array.from(map.values()).filter((room) => isActiveRoom(room, type));
}

function readMessagesForThread(threadKey: string): MessageRow[] {
  if (typeof window === "undefined") return [];
  const parsed = parseJson<unknown>(window.localStorage.getItem(`vaultforge_room_messages_${threadKey}`), []);
  return Array.isArray(parsed) ? (parsed as MessageRow[]) : [];
}

function locationFor(room: RoomRecord) {
  return [cleanText(room.city, ""), cleanText(room.county, ""), cleanText(room.state, "")].filter(Boolean).join(", ");
}

function titleFor(room: RoomRecord, fallback: string) {
  return cleanText(room.title || room.name, fallback);
}

function timestampFor(room: RoomRecord) {
  return cleanText(room.updatedAt || room.createdAt, "");
}

function severityFor(room: RoomRecord, type: "deal" | "pain"): Severity {
  const urgency = asList(room.urgency).join(" ").toLowerCase();
  const pain = asList(room.painTypes).join(" ").toLowerCase();

  if (urgency.includes("emergency") || urgency.includes("critical")) return "critical";
  if (urgency.includes("high") || pain.includes("funding") || pain.includes("stalled")) return "high";
  if (type === "pain") return "medium";
  return "low";
}

function messageThreads(activeDealIds: Set<string>, activePainIds: Set<string>): AlertRow[] {
  if (typeof window === "undefined") return [];

  const rows: AlertRow[] = [];

  for (let i = 0; i < window.localStorage.length; i += 1) {
    const key = window.localStorage.key(i) || "";
    if (!key.startsWith("vaultforge_room_messages_")) continue;

    const threadKey = key.replace("vaultforge_room_messages_", "");
    const [rawType, ...idParts] = threadKey.split(":");
    const roomType = rawType === "pain" ? "pain" : rawType === "deal" ? "deal" : "";
    const roomIdValue = idParts.join(":");

    if (!roomType || !roomIdValue) continue;
    if (roomType === "deal" && !activeDealIds.has(roomIdValue)) continue;
    if (roomType === "pain" && !activePainIds.has(roomIdValue)) continue;

    const messages = readMessagesForThread(threadKey);
    const latest = messages[0];
    const unread = messages.filter((message) => !message.read).length;
    if (!messages.length) continue;

    const severity: Severity = unread > 0 ? "high" : "low";

    rows.push({
      id: `message:${threadKey}`,
      roomKey: `${roomType}:${roomIdValue}`,
      type: "message",
      title: latest?.subject || `${roomType === "deal" ? "Deal" : "Pain"} message thread`,
      subtitle: latest?.body || "Room message thread updated.",
      severity,
      timestamp: latest?.createdAt || "",
      href: `/messages?type=${encodeURIComponent(roomType)}&room=${encodeURIComponent(roomIdValue)}`,
      lane: roomType === "deal" ? "Deal Message" : "Pain Message",
    });
  }

  return rows;
}

function readSeen(): Record<string, string> {
  if (typeof window === "undefined") return {};
  return parseJson<Record<string, string>>(window.localStorage.getItem(SEEN_KEY), {});
}

function writeSeen(seen: Record<string, string>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SEEN_KEY, JSON.stringify(seen));
}

function newestTime(rows: AlertRow[]) {
  const times = rows.map((row) => row.timestamp).filter(Boolean).sort();
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

function buildAlertRows(): AlertRow[] {
  const dealRooms = uniqueRooms(DEAL_KEYS, "deal");
  const painRooms = uniqueRooms(PAIN_KEYS, "pain");

  const activeDealIds = new Set(dealRooms.map(getRoomId).filter(Boolean));
  const activePainIds = new Set(painRooms.map(getRoomId).filter(Boolean));

  const dealAlerts: AlertRow[] = dealRooms.map((room) => {
    const id = getRoomId(room);
    const routes = [...asList(room.routeTo), ...asList(room.routedTo)];
    return {
      id: `deal:${id}`,
      roomKey: `deal:${id}`,
      type: "deal",
      title: titleFor(room, "Untitled Deal Room"),
      subtitle: `${locationFor(room) || "Market not listed"}${routes.length ? ` • Route: ${routes.join(", ")}` : ""}`,
      severity: severityFor(room, "deal"),
      timestamp: timestampFor(room),
      href: `/deal-rooms/${encodeURIComponent(id)}`,
      lane: "New Deal",
    };
  });

  const painAlerts: AlertRow[] = painRooms.map((room) => {
    const id = getRoomId(room);
    const routes = asList(room.routingNeeds);
    return {
      id: `pain:${id}`,
      roomKey: `pain:${id}`,
      type: "pain",
      title: titleFor(room, "Untitled Pain Room"),
      subtitle: `${locationFor(room) || "Market not listed"}${routes.length ? ` • Needs: ${routes.join(", ")}` : ""}`,
      severity: severityFor(room, "pain"),
      timestamp: timestampFor(room),
      href: `/pain-rooms/${encodeURIComponent(id)}`,
      lane: "New Pain",
    };
  });

  const messages = messageThreads(activeDealIds, activePainIds);

  return [...dealAlerts, ...painAlerts, ...messages].sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp)));
}

function buildSummaryCards(rows: AlertRow[], seen: Record<string, string>): SummaryCard[] {
  const lanes: Array<{ key: AlertType; label: string }> = [
    { key: "deal", label: "New Deals" },
    { key: "pain", label: "New Pain" },
    { key: "message", label: "Messages" },
  ];

  return lanes.map((lane): SummaryCard => {
    const laneRows = rows.filter((row) => row.type === lane.key);
    const newest = newestTime(laneRows);
    const seenTime = seen[`lane:${lane.key}`] || "";
    const unread = laneRows.filter((row) => !seen[row.id] || (row.timestamp && row.timestamp > seen[row.id])).length;
    const pulse = Boolean(unread > 0 && newest && (!seenTime || newest > seenTime));

    let severity: Severity = "low";
    if (laneRows.some((row) => row.severity === "critical")) severity = "critical";
    else if (laneRows.some((row) => row.severity === "high")) severity = "high";
    else if (laneRows.length) severity = "medium";

    return {
      key: lane.key,
      label: lane.label,
      count: laneRows.length,
      unread,
      newest,
      pulse,
      severity,
    };
  });
}

function isUnseen(row: AlertRow, seen: Record<string, string>) {
  return !seen[row.id] || Boolean(row.timestamp && row.timestamp > seen[row.id]);
}

function priorityWeight(row: AlertRow) {
  const severityWeight = row.severity === "critical" ? 4 : row.severity === "high" ? 3 : row.severity === "medium" ? 2 : 1;
  const timeWeight = row.timestamp ? new Date(row.timestamp).getTime() / 10000000000000 : 0;
  return severityWeight + timeWeight;
}

export default function VaultForgeLiveAlertEngine() {
  const [rows, setRows] = useState<AlertRow[]>([]);
  const [seen, setSeen] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<AlertType | "all">("all");

  function load() {
    setRows(buildAlertRows());
    setSeen(readSeen());
  }

  useEffect(() => {
    load();
    const interval = window.setInterval(load, 2000);

    window.addEventListener("storage", load);
    window.addEventListener("vaultforge-message-change", load);
    window.addEventListener("vaultforge-pain-change", load);
    window.addEventListener("vaultforge-room-state-change", load);
    window.addEventListener("vaultforge-deal-change", load);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("storage", load);
      window.removeEventListener("vaultforge-message-change", load);
      window.removeEventListener("vaultforge-pain-change", load);
      window.removeEventListener("vaultforge-room-state-change", load);
      window.removeEventListener("vaultforge-deal-change", load);
    };
  }, []);

  function markLane(type: AlertType) {
    const laneRows = rows.filter((row) => row.type === type);
    const next = { ...seen, [`lane:${type}`]: new Date().toISOString() };
    laneRows.forEach((row) => {
      next[row.id] = row.timestamp || new Date().toISOString();
    });
    writeSeen(next);
    setSeen(next);
    setSelected(type);
  }

  function openAlert(row: AlertRow) {
    const next = { ...seen, [row.id]: row.timestamp || new Date().toISOString() };
    writeSeen(next);
    setSeen(next);
    window.location.href = row.href;
  }

  const summaries = useMemo(() => buildSummaryCards(rows, seen), [rows, seen]);
  const unseenRows = rows.filter((row) => isUnseen(row, seen)).sort((a, b) => priorityWeight(b) - priorityWeight(a));
  const pulsingIds = new Set(unseenRows.slice(0, MAX_PULSE_CARDS).map((row) => row.id));
  const baseRows = selected === "all" ? rows : rows.filter((row) => row.type === selected);
  const filteredRows = baseRows.slice(0, MAX_VISIBLE_ALERTS);
  const ticketRows = rows.filter((row) => row.severity === "critical" || row.severity === "high").slice(0, MAX_VISIBLE_TICKETS);
  const overflowCount = Math.max(0, baseRows.length - MAX_VISIBLE_ALERTS);

  return (
    <section style={shell}>
      <style>{`
        @keyframes vfPulse {
          0% { box-shadow: 0 0 0 0 rgba(255, 65, 65, .42); transform: translateY(0); }
          70% { box-shadow: 0 0 0 12px rgba(255, 65, 65, 0); transform: translateY(-1px); }
          100% { box-shadow: 0 0 0 0 rgba(255, 65, 65, 0); transform: translateY(0); }
        }
        @keyframes vfTicker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>

      <div style={topBar}>
        <div>
          <div style={eyebrow}>Live Alert Engine</div>
          <h2 style={title}>Clean VaultForge Alert Desk.</h2>
          <p style={copy}>Active work only. Saved, archived, and deleted rooms disappear from live alerts and stay in folders.</p>
        </div>
        <div style={livePill}>LIVE</div>
      </div>

      <div style={summaryGrid}>
        {summaries.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => markLane(item.key)}
            style={{ ...summaryCard, ...(item.pulse ? pulseStyle(item.severity) : {}) }}
          >
            <span style={summaryLabel}>{item.label}</span>
            <strong style={summaryNumber}>{item.unread}</strong>
            <span style={summarySub}>{item.count} active total • {timeAgo(item.newest)}</span>
          </button>
        ))}
      </div>

      {rows.length ? (
        <div style={tickerShell}>
          <div style={tickerTrack}>
            {[...rows.slice(0, 8), ...rows.slice(0, 8)].map((row, index) => (
              <span key={`${row.id}-${index}`} style={tickerItem}>{row.lane}: {row.title} · {row.subtitle}</span>
            ))}
          </div>
        </div>
      ) : null}

      <div style={actionRow}>
        <button type="button" onClick={() => setSelected("all")} style={selected === "all" ? goldBtn : btn}>All Alerts</button>
        <button type="button" onClick={() => markLane("deal")} style={selected === "deal" ? goldBtn : btn}>Deal Alerts</button>
        <button type="button" onClick={() => markLane("pain")} style={selected === "pain" ? goldBtn : btn}>Pain Alerts</button>
        <button type="button" onClick={() => markLane("message")} style={selected === "message" ? goldBtn : btn}>Message Alerts</button>
      </div>

      <div style={grid}>
        <div style={panel}>
          <div style={eyebrow}>Alert Cards</div>
          <p style={miniCopy}>Showing newest {MAX_VISIBLE_ALERTS}. Older active items are summarized to stop clutter.</p>
          {!filteredRows.length ? <p style={copy}>No active alert cards in this lane.</p> : null}
          <div style={stack}>
            {filteredRows.map((row) => {
              const shouldPulse = pulsingIds.has(row.id);
              return (
                <button key={row.id} type="button" onClick={() => openAlert(row)} style={{ ...alertCard, ...(shouldPulse ? pulseStyle(row.severity) : {}) }}>
                  <span style={severityDot(row.severity, shouldPulse)} />
                  <div>
                    <div style={alertTop}>{row.lane}</div>
                    <strong style={alertTitle}>{row.title}</strong>
                    <p style={alertSub}>{row.subtitle}</p>
                    <span style={meta}>{timeAgo(row.timestamp)}</span>
                  </div>
                </button>
              );
            })}
          </div>
          {overflowCount > 0 ? <div style={overflowBox}>+{overflowCount} more active items summarized. Open Deal Rooms, Pain Rooms, or Messages for the full lane.</div> : null}
        </div>

        <div style={panel}>
          <div style={eyebrow}>Execution Tickets</div>
          <p style={miniCopy}>Only active high-pressure tickets show here.</p>
          <div style={stack}>
            {ticketRows.map((row) => (
              <div key={`ticket-${row.id}`} style={ticketCard}>
                <div style={ticketHead}><strong>{row.severity.toUpperCase()}</strong><span>{row.type.toUpperCase()}</span></div>
                <p style={ticketText}>{row.title}</p>
                <p style={alertSub}>{row.type === "message" ? "Open thread and respond." : "Open room, verify facts, route to profile, move to messages."}</p>
              </div>
            ))}
            {!ticketRows.length ? <p style={copy}>No urgent active tickets.</p> : null}
          </div>
        </div>
      </div>
    </section>
  );
}

function pulseStyle(severity: Severity): React.CSSProperties {
  const border = severity === "critical" ? "rgba(255,45,45,.85)" : severity === "high" ? "rgba(255,80,80,.65)" : "rgba(255,220,104,.55)";
  return { borderColor: border, animation: "vfPulse 1.8s infinite" };
}

function severityDot(severity: Severity, active: boolean): React.CSSProperties {
  const color = severity === "critical" ? "#ff3030" : severity === "high" ? "#ff4d4d" : severity === "medium" ? "#ffdc68" : "#8ca0bd";
  return { width: 12, height: 12, borderRadius: 999, background: active ? color : "#8ca0bd", flex: "0 0 auto", marginTop: 6, boxShadow: active ? `0 0 18px ${color}` : "none" };
}

const shell: React.CSSProperties = { display: "grid", gap: 18 };
const topBar: React.CSSProperties = { border: "1px solid rgba(245,197,66,.28)", borderRadius: 26, padding: 24, background: "linear-gradient(135deg, rgba(9,14,26,.98), rgba(8,6,10,.98))", display: "flex", justifyContent: "space-between", gap: 20, alignItems: "center" };
const eyebrow: React.CSSProperties = { color: "#ffd45a", textTransform: "uppercase", letterSpacing: 6, fontWeight: 950, fontSize: 13 };
const title: React.CSSProperties = { color: "#f8fafc", fontSize: "clamp(30px,5vw,54px)", lineHeight: 1, letterSpacing: -2, margin: "8px 0 10px" };
const livePill: React.CSSProperties = { background: "#e31321", color: "white", borderRadius: 999, padding: "10px 14px", fontWeight: 950, boxShadow: "0 0 24px rgba(227,19,33,.55)" };
const summaryGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 14 };
const summaryCard: React.CSSProperties = { textAlign: "left", border: "1px solid rgba(207,216,230,.16)", borderRadius: 22, padding: 18, background: "#121724", color: "#f8fafc", cursor: "pointer" };
const summaryLabel: React.CSSProperties = { display: "block", color: "#ffd45a", textTransform: "uppercase", letterSpacing: 3, fontSize: 12, fontWeight: 950 };
const summaryNumber: React.CSSProperties = { display: "block", fontSize: 44, lineHeight: 1, marginTop: 8 };
const summarySub: React.CSSProperties = { display: "block", color: "#aeb7c7", marginTop: 8 };
const tickerShell: React.CSSProperties = { overflow: "hidden", border: "1px solid rgba(245,197,66,.20)", borderRadius: 18, background: "#0b0f19", padding: "12px 0" };
const tickerTrack: React.CSSProperties = { display: "flex", gap: 24, width: "max-content", animation: "vfTicker 35s linear infinite" };
const tickerItem: React.CSSProperties = { whiteSpace: "nowrap", color: "#ffd45a", fontSize: 14, fontWeight: 850 };
const actionRow: React.CSSProperties = { display: "flex", gap: 10, flexWrap: "wrap" };
const btn: React.CSSProperties = { border: "1px solid rgba(207,216,230,.18)", background: "#171c29", color: "#f7f7fb", borderRadius: 999, padding: "12px 16px", fontWeight: 950, cursor: "pointer" };
const goldBtn: React.CSSProperties = { ...btn, background: "#ffdc68", color: "#10131a", borderColor: "#ffdc68" };
const grid: React.CSSProperties = { display: "grid", gridTemplateColumns: "minmax(0,1.35fr) minmax(300px,.65fr)", gap: 18 };
const panel: React.CSSProperties = { border: "1px solid rgba(245,197,66,.24)", borderRadius: 24, padding: 22, background: "linear-gradient(180deg,#080d19,#050816)" };
const stack: React.CSSProperties = { display: "grid", gap: 12, marginTop: 16 };
const alertCard: React.CSSProperties = { display: "grid", gridTemplateColumns: "18px 1fr", gap: 12, width: "100%", textAlign: "left", border: "1px solid rgba(207,216,230,.14)", borderRadius: 20, padding: 16, background: "#121724", color: "#f8fafc", cursor: "pointer" };
const alertTop: React.CSSProperties = { color: "#ffd45a", textTransform: "uppercase", letterSpacing: 3, fontSize: 11, fontWeight: 950 };
const alertTitle: React.CSSProperties = { display: "block", fontSize: 21, marginTop: 5 };
const alertSub: React.CSSProperties = { color: "#aeb7c7", margin: "6px 0", lineHeight: 1.35 };
const meta: React.CSSProperties = { color: "#7e8aa0", fontSize: 13 };
const ticketCard: React.CSSProperties = { border: "1px solid rgba(255,80,80,.24)", background: "rgba(55,10,20,.35)", borderRadius: 18, padding: 16 };
const ticketHead: React.CSSProperties = { display: "flex", justifyContent: "space-between", gap: 12, color: "#ffb4b4", fontSize: 12, letterSpacing: 2 };
const ticketText: React.CSSProperties = { color: "#f8fafc", fontSize: 18, fontWeight: 850, margin: "10px 0 4px" };
const copy: React.CSSProperties = { color: "#c9d0dc", fontSize: 18, lineHeight: 1.4, margin: 0 };
const miniCopy: React.CSSProperties = { color: "#9ca8ba", fontSize: 14, lineHeight: 1.35, margin: "10px 0 0" };
const overflowBox: React.CSSProperties = { marginTop: 14, border: "1px solid rgba(245,197,66,.18)", borderRadius: 18, padding: 14, color: "#ffd45a", background: "rgba(245,197,66,.06)", fontWeight: 850 };
