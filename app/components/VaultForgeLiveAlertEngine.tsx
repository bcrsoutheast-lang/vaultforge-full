"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type AlertType = "deal" | "pain" | "message";
type Severity = "critical" | "high" | "medium" | "low";

type RoomRecord = {
  id?: string;
  roomId?: string;
  dealId?: string;
  painId?: string;
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
  type: AlertType;
  title: string;
  subtitle: string;
  severity: Severity;
  count: number;
  timestamp: string;
  href: string;
  lane: string;
  pulse: boolean;
};

type MessageRow = {
  id?: string;
  threadKey?: string;
  roomType?: "deal" | "pain";
  roomId?: string;
  subject?: string;
  body?: string;
  createdAt?: string;
  read?: boolean;
};

const DEAL_KEYS = ["vaultforge_clean_deal_rooms", "vaultforge_deal_rooms", "vaultforge_rooms_deals", "vf_deal_rooms"];
const PAIN_KEYS = ["vaultforge_clean_pain_rooms_v1", "vaultforge_clean_pain_rooms", "vaultforge_pain_rooms", "vaultforge_rooms_pain", "vf_pain_rooms"];
const SEEN_KEY = "vaultforge_live_alert_seen_v1";

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
  const clean = String(value).trim();
  return clean || fallback;
}

function list(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  if (typeof value === "string" && value.trim()) return value.split(",").map((item) => item.trim()).filter(Boolean);
  return [];
}

function roomId(room: RoomRecord | null | undefined) {
  return text(room?.id || room?.roomId || room?.dealId || room?.painId, "");
}

function readArray(key: string): RoomRecord[] {
  if (typeof window === "undefined") return [];
  const parsed = parseJson<unknown>(window.localStorage.getItem(key), []);
  return Array.isArray(parsed) ? (parsed as RoomRecord[]) : [];
}

function uniqueRooms(keys: string[], type: "deal" | "pain"): RoomRecord[] {
  if (typeof window === "undefined") return [];

  const map = new Map<string, RoomRecord>();

  for (const key of keys) {
    for (const room of readArray(key)) {
      const id = roomId(room);
      if (id && !map.has(id)) map.set(id, { ...room, id });
    }
  }

  for (let i = 0; i < window.localStorage.length; i += 1) {
    const key = window.localStorage.key(i) || "";
    const isDeal = type === "deal" && (key.startsWith("vaultforge_clean_deal_room_") || key.startsWith("vaultforge_deal_room_"));
    const isPain = type === "pain" && (key.startsWith("vaultforge_clean_pain_room_") || key.startsWith("vaultforge_pain_room_"));

    if (!isDeal && !isPain) continue;

    const room = parseJson<RoomRecord | null>(window.localStorage.getItem(key), null);
    const id = roomId(room);
    if (room && id && !map.has(id)) map.set(id, { ...room, id });
  }

  return Array.from(map.values());
}

function readMessagesForThread(threadKey: string): MessageRow[] {
  if (typeof window === "undefined") return [];
  const parsed = parseJson<unknown>(window.localStorage.getItem(`vaultforge_room_messages_${threadKey}`), []);
  return Array.isArray(parsed) ? (parsed as MessageRow[]) : [];
}

function messageThreads(): AlertRow[] {
  if (typeof window === "undefined") return [];

  const rows: AlertRow[] = [];

  for (let i = 0; i < window.localStorage.length; i += 1) {
    const key = window.localStorage.key(i) || "";
    if (!key.startsWith("vaultforge_room_messages_")) continue;

    const threadKey = key.replace("vaultforge_room_messages_", "");
    const [rawType, ...idParts] = threadKey.split(":");
    const type = rawType === "pain" ? "pain" : rawType === "deal" ? "deal" : "";
    const roomIdValue = idParts.join(":");
    if (!type || !roomIdValue) continue;

    const messages = readMessagesForThread(threadKey);
    const latest = messages[0];
    const unread = messages.filter((message) => !message.read).length;

    rows.push({
      id: `message:${threadKey}`,
      type: "message",
      title: latest?.subject || `${type === "deal" ? "Deal" : "Pain"} message thread`,
      subtitle: latest?.body || "Room thread has no messages yet.",
      severity: unread > 0 ? "high" : "low",
      count: messages.length,
      timestamp: latest?.createdAt || "",
      href: `/messages?type=${encodeURIComponent(type)}&room=${encodeURIComponent(roomIdValue)}`,
      lane: type === "deal" ? "Deal Message" : "Pain Message",
      pulse: false,
    });
  }

  return rows;
}

function location(room: RoomRecord) {
  return [text(room.city, ""), text(room.county, ""), text(room.state, "")].filter(Boolean).join(", ");
}

function titleFor(room: RoomRecord, fallback: string) {
  return text(room.title || room.name, fallback);
}

function timestamp(room: RoomRecord) {
  return text(room.updatedAt || room.createdAt, "");
}

function severityFor(room: RoomRecord, type: "deal" | "pain"): Severity {
  const urgency = list(room.urgency).join(" ").toLowerCase();
  const pain = list(room.painTypes).join(" ").toLowerCase();

  if (urgency.includes("emergency") || urgency.includes("critical")) return "critical";
  if (urgency.includes("high") || pain.includes("funding") || pain.includes("stalled")) return "high";
  if (type === "pain") return "medium";
  return "low";
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
  if (!value) return "not opened";
  try {
    const diff = Date.now() - new Date(value).getTime();
    const min = Math.max(0, Math.floor(diff / 60000));
    if (min < 1) return "just now";
    if (min < 60) return `${min}m ago`;
    const hours = Math.floor(min / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  } catch {
    return value;
  }
}

function alertRows(): AlertRow[] {
  const dealRooms = uniqueRooms(DEAL_KEYS, "deal");
  const painRooms = uniqueRooms(PAIN_KEYS, "pain");

  const dealAlerts: AlertRow[] = dealRooms.map((room) => {
    const id = roomId(room);
    const routes = [...list(room.routeTo), ...list(room.routedTo)];
    return {
      id: `deal:${id}`,
      type: "deal",
      title: titleFor(room, "Untitled Deal Room"),
      subtitle: `${location(room) || "Market not listed"}${routes.length ? ` • Route: ${routes.join(", ")}` : ""}`,
      severity: severityFor(room, "deal"),
      count: 1,
      timestamp: timestamp(room),
      href: `/deal-rooms/${encodeURIComponent(id)}`,
      lane: "New Deal",
      pulse: false,
    };
  });

  const painAlerts: AlertRow[] = painRooms.map((room) => {
    const id = roomId(room);
    const routes = list(room.routingNeeds);
    return {
      id: `pain:${id}`,
      type: "pain",
      title: titleFor(room, "Untitled Pain Room"),
      subtitle: `${location(room) || "Market not listed"}${routes.length ? ` • Needs: ${routes.join(", ")}` : ""}`,
      severity: severityFor(room, "pain"),
      count: 1,
      timestamp: timestamp(room),
      href: `/pain-rooms/${encodeURIComponent(id)}`,
      lane: "New Pain",
      pulse: false,
    };
  });

  const messages = messageThreads();

  return [...dealAlerts, ...painAlerts, ...messages].sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp)));
}

type SummaryCard = {
  key: AlertType;
  label: string;
  href: string;
  count: number;
  unread: number;
  newest: string;
  pulse: boolean;
  severity: Severity;
};

function summaryCards(rows: AlertRow[], seen: Record<string, string>): SummaryCard[] {
  const lanes: Array<{ key: AlertType; label: string; href: string }> = [
    { key: "deal", label: "New Deals", href: "/deal-rooms" },
    { key: "pain", label: "New Pain", href: "/pain-rooms" },
    { key: "message", label: "Messages", href: "/messages" },
  ];

  return lanes.map((lane): SummaryCard => {
    const laneRows = rows.filter((row) => row.type === lane.key);
    const newest = newestTime(laneRows);
    const seenTime = seen[`lane:${lane.key}`] || "";
    const unread = laneRows.filter((row) => !seen[row.id] || (row.timestamp && row.timestamp > seen[row.id])).length;
    const pulse = Boolean(newest && (!seenTime || newest > seenTime));

    let severity: Severity = "low";
    if (laneRows.some((row) => row.severity === "critical")) {
      severity = "critical";
    } else if (laneRows.some((row) => row.severity === "high")) {
      severity = "high";
    } else if (laneRows.length) {
      severity = "medium";
    }

    return {
      key: lane.key,
      label: lane.label,
      href: lane.href,
      count: laneRows.length,
      unread,
      newest,
      pulse,
      severity,
    };
  });
}

export default function VaultForgeLiveAlertEngine() {
  const [rows, setRows] = useState<AlertRow[]>([]);
  const [seen, setSeen] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<AlertType | "all">("all");

  function load() {
    setRows(alertRows());
    setSeen(readSeen());
  }

  useEffect(() => {
    load();
    const interval = window.setInterval(load, 2500);
    window.addEventListener("storage", load);
    window.addEventListener("vaultforge-message-change", load);
    window.addEventListener("vaultforge-pain-change", load);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("storage", load);
      window.removeEventListener("vaultforge-message-change", load);
      window.removeEventListener("vaultforge-pain-change", load);
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

  const summaries = useMemo(() => summaryCards(rows, seen), [rows, seen]);
  const filteredRows = useMemo(() => (selected === "all" ? rows : rows.filter((row) => row.type === selected)), [rows, selected]);
  const criticalRows = rows.filter((row) => row.severity === "critical" || row.severity === "high").slice(0, 6);

  return (
    <section style={shell}>
      <style>{`
        @keyframes vfPulse {
          0% { box-shadow: 0 0 0 0 rgba(255, 65, 65, .45); transform: translateY(0); }
          70% { box-shadow: 0 0 0 14px rgba(255, 65, 65, 0); transform: translateY(-1px); }
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
          <h2 style={title}>Bloomberg alert deck.</h2>
        </div>
        <div style={livePill}>LIVE</div>
      </div>

      <div style={summaryGrid}>
        {summaries.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => markLane(item.key)}
            style={{
              ...summaryCard,
              ...(item.pulse ? pulseStyle(item.severity) : {}),
            }}
          >
            <span style={summaryLabel}>{item.label}</span>
            <strong style={summaryNumber}>{item.unread}</strong>
            <span style={summarySub}>{item.count} total • {timeAgo(item.newest)}</span>
          </button>
        ))}
      </div>

      <div style={tickerShell}>
        <div style={tickerTrack}>
          {[...rows.slice(0, 8), ...rows.slice(0, 8)].map((row, index) => (
            <span key={`${row.id}-${index}`} style={tickerItem}>
              {row.lane}: {row.title} · {row.subtitle}
            </span>
          ))}
        </div>
      </div>

      <div style={actionRow}>
        <button type="button" onClick={() => setSelected("all")} style={selected === "all" ? goldBtn : btn}>All Alerts</button>
        <button type="button" onClick={() => markLane("deal")} style={selected === "deal" ? goldBtn : btn}>Deal Alerts</button>
        <button type="button" onClick={() => markLane("pain")} style={selected === "pain" ? goldBtn : btn}>Pain Alerts</button>
        <button type="button" onClick={() => markLane("message")} style={selected === "message" ? goldBtn : btn}>Message Alerts</button>
      </div>

      <div style={grid}>
        <div style={panel}>
          <div style={eyebrow}>Alert Cards</div>
          {!filteredRows.length ? <p style={copy}>No alert cards in this lane yet.</p> : null}
          <div style={stack}>
            {filteredRows.slice(0, 8).map((row) => {
              const isUnseen = !seen[row.id] || (row.timestamp && row.timestamp > seen[row.id]);
              return (
                <button
                  key={row.id}
                  type="button"
                  onClick={() => openAlert(row)}
                  style={{
                    ...alertCard,
                    ...(isUnseen ? pulseStyle(row.severity) : {}),
                  }}
                >
                  <span style={severityDot(row.severity)} />
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
        </div>

        <div style={panel}>
          <div style={eyebrow}>Execution Tickets</div>
          <div style={stack}>
            {(criticalRows.length ? criticalRows : rows.slice(0, 4)).map((row) => (
              <div key={`ticket-${row.id}`} style={ticketCard}>
                <div style={ticketHead}>
                  <strong>{row.severity.toUpperCase()}</strong>
                  <span>{row.type.toUpperCase()}</span>
                </div>
                <p style={ticketText}>{row.title}</p>
                <p style={alertSub}>{row.type === "message" ? "Open thread and respond." : "Open room, verify facts, route to profile, move to messages."}</p>
              </div>
            ))}
            {!rows.length ? <p style={copy}>No tickets yet. New rooms and messages will appear here.</p> : null}
          </div>
        </div>
      </div>
    </section>
  );
}

function pulseStyle(severity: Severity): React.CSSProperties {
  const border = severity === "critical" ? "rgba(255,45,45,.85)" : severity === "high" ? "rgba(255,80,80,.65)" : "rgba(255,220,104,.55)";
  return {
    borderColor: border,
    animation: "vfPulse 1.8s infinite",
  };
}

function severityDot(severity: Severity): React.CSSProperties {
  const color = severity === "critical" ? "#ff3030" : severity === "high" ? "#ff4d4d" : severity === "medium" ? "#ffdc68" : "#8ca0bd";
  return {
    width: 12,
    height: 12,
    borderRadius: 999,
    background: color,
    flex: "0 0 auto",
    marginTop: 6,
    boxShadow: `0 0 18px ${color}`,
  };
}

const shell: React.CSSProperties = {
  display: "grid",
  gap: 18,
};

const topBar: React.CSSProperties = {
  border: "1px solid rgba(245,197,66,.28)",
  borderRadius: 26,
  padding: 24,
  background: "linear-gradient(135deg, rgba(9,14,26,.98), rgba(8,6,10,.98))",
  display: "flex",
  justifyContent: "space-between",
  gap: 20,
  alignItems: "center",
};

const eyebrow: React.CSSProperties = {
  color: "#ffd45a",
  textTransform: "uppercase",
  letterSpacing: 6,
  fontWeight: 950,
  fontSize: 13,
};

const title: React.CSSProperties = {
  color: "#f8fafc",
  fontSize: "clamp(30px,5vw,54px)",
  lineHeight: 1,
  letterSpacing: -2,
  margin: "8px 0 0",
};

const livePill: React.CSSProperties = {
  background: "#e31321",
  color: "white",
  borderRadius: 999,
  padding: "10px 14px",
  fontWeight: 950,
  boxShadow: "0 0 24px rgba(227,19,33,.55)",
};

const summaryGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
  gap: 14,
};

const summaryCard: React.CSSProperties = {
  textAlign: "left",
  border: "1px solid rgba(207,216,230,.16)",
  borderRadius: 22,
  padding: 18,
  background: "#121724",
  color: "#f8fafc",
  cursor: "pointer",
};

const summaryLabel: React.CSSProperties = {
  display: "block",
  color: "#ffd45a",
  textTransform: "uppercase",
  letterSpacing: 3,
  fontSize: 12,
  fontWeight: 950,
};

const summaryNumber: React.CSSProperties = {
  display: "block",
  fontSize: 44,
  lineHeight: 1,
  marginTop: 8,
};

const summarySub: React.CSSProperties = {
  display: "block",
  color: "#aeb7c7",
  marginTop: 8,
};

const tickerShell: React.CSSProperties = {
  overflow: "hidden",
  border: "1px solid rgba(245,197,66,.20)",
  borderRadius: 18,
  background: "#0b0f19",
  padding: "12px 0",
};

const tickerTrack: React.CSSProperties = {
  display: "flex",
  gap: 24,
  width: "max-content",
  animation: "vfTicker 35s linear infinite",
};

const tickerItem: React.CSSProperties = {
  whiteSpace: "nowrap",
  color: "#ffd45a",
  fontSize: 14,
  fontWeight: 850,
};

const actionRow: React.CSSProperties = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
};

const btn: React.CSSProperties = {
  border: "1px solid rgba(207,216,230,.18)",
  background: "#171c29",
  color: "#f7f7fb",
  borderRadius: 999,
  padding: "12px 16px",
  fontWeight: 950,
  cursor: "pointer",
};

const goldBtn: React.CSSProperties = {
  ...btn,
  background: "#ffdc68",
  color: "#10131a",
  borderColor: "#ffdc68",
};

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0,1.35fr) minmax(300px,.65fr)",
  gap: 18,
};

const panel: React.CSSProperties = {
  border: "1px solid rgba(245,197,66,.24)",
  borderRadius: 24,
  padding: 22,
  background: "linear-gradient(180deg,#080d19,#050816)",
};

const stack: React.CSSProperties = {
  display: "grid",
  gap: 12,
  marginTop: 16,
};

const alertCard: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "18px 1fr",
  gap: 12,
  width: "100%",
  textAlign: "left",
  border: "1px solid rgba(207,216,230,.14)",
  borderRadius: 20,
  padding: 16,
  background: "#121724",
  color: "#f8fafc",
  cursor: "pointer",
};

const alertTop: React.CSSProperties = {
  color: "#ffd45a",
  textTransform: "uppercase",
  letterSpacing: 3,
  fontSize: 11,
  fontWeight: 950,
};

const alertTitle: React.CSSProperties = {
  display: "block",
  fontSize: 21,
  marginTop: 5,
};

const alertSub: React.CSSProperties = {
  color: "#aeb7c7",
  margin: "6px 0",
  lineHeight: 1.35,
};

const meta: React.CSSProperties = {
  color: "#7e8aa0",
  fontSize: 13,
};

const ticketCard: React.CSSProperties = {
  border: "1px solid rgba(255,80,80,.24)",
  background: "rgba(55,10,20,.35)",
  borderRadius: 18,
  padding: 16,
};

const ticketHead: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  color: "#ffb4b4",
  fontSize: 12,
  letterSpacing: 2,
};

const ticketText: React.CSSProperties = {
  color: "#f8fafc",
  fontSize: 18,
  fontWeight: 850,
  margin: "10px 0 4px",
};

const copy: React.CSSProperties = {
  color: "#c9d0dc",
  fontSize: 18,
  lineHeight: 1.4,
};

