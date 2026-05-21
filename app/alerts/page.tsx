"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type RoomKind = "deal" | "pain";
type AlertFilter = "all" | "deal" | "pain" | "urgent" | "routed" | "resolved" | "closed";

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
  needs?: string[] | string;
  routingNeeds?: string[] | string;
  routeTo?: string[] | string;
  strategy?: string[] | string;
  blockers?: string[] | string;
  risks?: string[] | string;
  riskTypes?: string[] | string;
  roomState?: string;
  cleanupState?: string;
  stateStatus?: string;
  memberRoomStatus?: string;
  executionStage?: string;
  dealStage?: string;
  painStage?: string;
  askingPrice?: string;
  askPrice?: string;
  propertyValue?: string;
  value?: string;
  repairs?: string;
  capitalPressure?: string;
  moneyNeededNow?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
};

type AlertItem = {
  id: string;
  kind: RoomKind;
  room: Room;
  title: string;
  lane: string;
  severity: number;
  status: "active" | "routed" | "resolved" | "closed";
  signal: string;
  nextMove: string;
  requiredParty: string;
  pressure: string;
};

const DEAL_KEYS = ["vaultforge_clean_deal_rooms", "vaultforge_deal_rooms", "vaultforge_rooms_deals", "vf_deal_rooms"];
const PAIN_KEYS = ["vaultforge_clean_pain_rooms_v2", "vaultforge_clean_pain_rooms_v1", "vaultforge_clean_pain_rooms", "vaultforge_pain_rooms", "vaultforge_rooms_pain", "vf_pain_rooms"];
const STATE_KEYS = ["vaultforge_deal_room_state_v2", "vaultforge_pain_room_state_v2", "vaultforge_clean_room_states", "vaultforge_room_states", "vaultforge_deal_room_states", "vaultforge_pain_room_states"];
const MEMBER_STATE_KEY = "vaultforge_my_room_status_v1";
const ROUTE_STATUS_KEY = "vaultforge_route_status_v1";
const ALERT_ACK_KEY = "vaultforge_alert_ack_v1";

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
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  if (typeof value === "string" && value.trim()) return value.split(",").map((item) => item.trim()).filter(Boolean);
  return [];
}

function num(value: unknown) {
  const parsed = Number(String(value || "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function arr<T>(key: string): T[] {
  if (!ok()) return [];
  const parsed = j<unknown>(localStorage.getItem(key), []);
  return Array.isArray(parsed) ? (parsed as T[]) : [];
}

function rid(room: Room | null | undefined) {
  return txt(room?.id || room?.roomId);
}

function keysFor(kind: RoomKind) {
  return kind === "deal" ? DEAL_KEYS : PAIN_KEYS;
}

function roomTitle(room: Room, kind: RoomKind) {
  return txt(room.title || room.name, kind === "deal" ? "Untitled Deal Room" : "Untitled Pain Room");
}

function loc(room: Room) {
  return [txt(room.city), txt(room.county), txt(room.state)].filter(Boolean).join(", ") || "Market not listed";
}

function normalizeRoom(row: any, kind: RoomKind): Room {
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

function stateMap() {
  const map: Record<string, string> = {};
  if (!ok()) return map;
  STATE_KEYS.forEach((key) => Object.assign(map, j<Record<string, string>>(localStorage.getItem(key), {})));
  Object.assign(map, j<Record<string, string>>(localStorage.getItem(MEMBER_STATE_KEY), {}));
  return map;
}

function rawStatus(room: Room) {
  const state = txt(room.memberRoomStatus || room.roomState || room.cleanupState || room.stateStatus, "active");
  if (state === "saved" || state === "archived" || state === "deleted" || state === "sold" || state === "resolved") return state;
  return "active";
}

function allRooms(kind: RoomKind): Room[] {
  if (!ok()) return [];
  const out: Room[] = [];
  const seen = new Set<string>();

  for (const key of keysFor(kind)) {
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

  const states = stateMap();

  return out
    .map((room) => {
      const id = rid(room);
      const status = states[id] || states[`${kind}:${id}`] || rawStatus(room);
      return { ...room, memberRoomStatus: status, roomState: status, cleanupState: status, stateStatus: status };
    })
    .filter((room) => rawStatus(room) !== "deleted")
    .sort((a, b) => String(b.updatedAt || b.createdAt || "").localeCompare(String(a.updatedAt || a.createdAt || "")));
}

function routeStatusMap() {
  return ok() ? j<Record<string, { status: string; at: string; memberName: string; memberEmail: string; roomId: string; kind: string }>>(localStorage.getItem(ROUTE_STATUS_KEY), {}) : {};
}

function routeStatusFor(kind: RoomKind, room: Room) {
  const id = rid(room);
  const map = routeStatusMap();
  const matches = Object.values(map).filter((value) => value.kind === kind && value.roomId === id);
  if (matches.some((value) => value.status === "claimed")) return "routed";
  if (matches.some((value) => value.status === "accepted")) return "routed";
  if (matches.some((value) => value.status === "pending")) return "routed";
  const status = rawStatus(room);
  if (status === "sold" || status === "resolved" || status === "archived") return "closed";
  return "active";
}

function dealSeverity(room: Room) {
  let score = 32;
  const ask = num(room.askingPrice || room.askPrice);
  const value = num(room.propertyValue || room.value);
  const repairs = num(room.repairs);
  const spread = value && ask ? value - ask - repairs : 0;
  if (!ask || !value) score += 24;
  if (spread <= 0 && ask && value) score += 32;
  if (spread > 50000) score += 10;
  if (spread > 150000) score += 10;
  if (list(room.routeTo).length) score += 12;
  if (txt(room.timePressure).includes("24") || txt(room.timePressure).includes("72")) score += 18;
  return Math.max(0, Math.min(100, score));
}

function painSeverity(room: Room) {
  let score = 42;
  const severity = txt(room.severity).toLowerCase();
  const time = txt(room.timePressure).toLowerCase();
  if (severity.includes("medium")) score += 8;
  if (severity.includes("high")) score += 24;
  if (severity.includes("critical")) score += 34;
  if (severity.includes("emergency")) score += 46;
  if (time.includes("24")) score += 18;
  if (time.includes("72")) score += 14;
  if (list(room.blockers).length) score += 8;
  if (list(room.needs || room.routingNeeds).length) score += 8;
  return Math.max(0, Math.min(100, score));
}

function requiredParty(kind: RoomKind, room: Room) {
  const combined = [
    ...list(room.routeTo),
    ...list(room.needs),
    ...list(room.routingNeeds),
    ...list(room.blockers),
    ...list(room.painTypes),
    txt(room.assetClass),
    txt(room.propertyType),
  ].join(" ").toLowerCase();

  if (combined.includes("capital") || combined.includes("lender") || combined.includes("money") || combined.includes("fund")) return "Capital / Lender";
  if (combined.includes("buyer") || combined.includes("dispo")) return "Buyer / Disposition";
  if (combined.includes("legal") || combined.includes("title") || combined.includes("attorney")) return "Legal / Title";
  if (combined.includes("contractor") || combined.includes("operator") || combined.includes("rehab") || combined.includes("construction")) return "Operator / Contractor";
  if (combined.includes("developer") || combined.includes("land") || combined.includes("zoning")) return "Developer / Land";
  return kind === "deal" ? "Buyer / Capital / Operator" : "Solver / Operator / Capital";
}

function signalFor(kind: RoomKind, room: Room, severity: number) {
  if (kind === "deal") {
    const ask = num(room.askingPrice || room.askPrice);
    const value = num(room.propertyValue || room.value);
    if (!ask || !value) return "Deal alert: underwriting fields are incomplete. Collect ask, ARV/value, repairs, access, photos, and control status.";
    if (severity >= 70) return "Deal alert: execution pressure is high. Validate spread, control, buyer fit, and capital path before pushing.";
    return "Deal alert: opportunity needs review and routing discipline.";
  }

  if (severity >= 80) return "Pain alert: critical blocker risk. Identify responsible party, deadline, missing authority, and capital/solver requirement.";
  if (severity >= 65) return "Pain alert: active problem likely needs routing and accountability loop.";
  return "Pain alert: classify blocker and assign next movement.";
}

function nextMoveFor(kind: RoomKind, room: Room, severity: number) {
  const party = requiredParty(kind, room);
  if (kind === "deal") {
    if (severity >= 70) return `Route to ${party}. Ask for decision window, proof review, and execution condition.`;
    return "Complete field snapshot, verify numbers, then route to the smallest qualified lane.";
  }
  if (severity >= 70) return `Route to ${party}. Confirm root cause, deadline, required fix, and escalation trigger.`;
  return "Name the blocker, assign owner, and create a 24/72-hour follow-up loop.";
}

function pressureFor(kind: RoomKind, room: Room) {
  if (kind === "pain") return `${txt(room.severity, "Severity open")} • ${txt(room.timePressure, "Timeline open")}`;
  const ask = num(room.askingPrice || room.askPrice);
  const value = num(room.propertyValue || room.value);
  const repairs = num(room.repairs);
  if (!ask || !value) return "Underwriting incomplete";
  const spread = value - ask - repairs;
  if (spread > 150000) return "High spread";
  if (spread > 50000) return "Working spread";
  if (spread <= 0) return "Margin weak";
  return "Verify spread";
}

function buildAlerts(deals: Room[], pains: Room[]): AlertItem[] {
  return [
    ...deals.map((room) => {
      const severity = dealSeverity(room);
      const status = routeStatusFor("deal", room) as AlertItem["status"];
      return {
        id: `deal:${rid(room)}`,
        kind: "deal" as RoomKind,
        room,
        title: roomTitle(room, "deal"),
        lane: "Deal Alert",
        severity,
        status,
        signal: signalFor("deal", room, severity),
        nextMove: nextMoveFor("deal", room, severity),
        requiredParty: requiredParty("deal", room),
        pressure: pressureFor("deal", room),
      };
    }),
    ...pains.map((room) => {
      const severity = painSeverity(room);
      const status = routeStatusFor("pain", room) as AlertItem["status"];
      return {
        id: `pain:${rid(room)}`,
        kind: "pain" as RoomKind,
        room,
        title: roomTitle(room, "pain"),
        lane: "Pain Alert",
        severity,
        status: rawStatus(room) === "resolved" ? "resolved" : status,
        signal: signalFor("pain", room, severity),
        nextMove: nextMoveFor("pain", room, severity),
        requiredParty: requiredParty("pain", room),
        pressure: pressureFor("pain", room),
      };
    }),
  ].sort((a, b) => b.severity - a.severity);
}

function filterAlerts(alerts: AlertItem[], filter: AlertFilter) {
  if (filter === "all") return alerts.filter((alert) => alert.status !== "closed");
  if (filter === "deal") return alerts.filter((alert) => alert.kind === "deal" && alert.status !== "closed");
  if (filter === "pain") return alerts.filter((alert) => alert.kind === "pain" && alert.status !== "closed");
  if (filter === "urgent") return alerts.filter((alert) => alert.severity >= 70 && alert.status !== "closed");
  if (filter === "routed") return alerts.filter((alert) => alert.status === "routed");
  if (filter === "resolved") return alerts.filter((alert) => alert.status === "resolved");
  if (filter === "closed") return alerts.filter((alert) => alert.status === "closed" || alert.status === "resolved");
  return alerts;
}

function ackMap() {
  return ok() ? j<Record<string, string>>(localStorage.getItem(ALERT_ACK_KEY), {}) : {};
}

function acknowledge(alert: AlertItem) {
  if (!ok()) return;
  const map = ackMap();
  map[alert.id] = new Date().toISOString();
  writeJson(ALERT_ACK_KEY, map);
  window.dispatchEvent(new Event("vaultforge-alert-change"));
}

function isAcknowledged(alert: AlertItem) {
  return Boolean(ackMap()[alert.id]);
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
const wrap: React.CSSProperties = { maxWidth: 1320, margin: "0 auto", paddingBottom: 90 };
const nav: React.CSSProperties = { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 18 };
const brand: React.CSSProperties = { color: "#ffd45a", fontSize: 27, fontWeight: 950, letterSpacing: -1, marginRight: 10 };
const btn: React.CSSProperties = { border: "1px solid rgba(207,216,230,.18)", background: "#171c29", color: "#f7f7fb", borderRadius: 999, padding: "13px 18px", fontWeight: 950, textDecoration: "none", display: "inline-block", cursor: "pointer" };
const goldBtn: React.CSSProperties = { ...btn, border: 0, background: "#ffdc68", color: "#10131a" };
const redBtn: React.CSSProperties = { ...btn, background: "#271016", borderColor: "rgba(255,70,70,.48)", color: "#ffaaaa" };
const hero: React.CSSProperties = { border: "1px solid rgba(245,197,66,.28)", borderRadius: 30, padding: 30, marginBottom: 20, background: "radial-gradient(circle at top right, rgba(245,197,66,.16), transparent 32%), linear-gradient(180deg,#080d19,#050816)" };
const card: React.CSSProperties = { background: "linear-gradient(180deg,#080d19,#050816)", border: "1px solid rgba(245,197,66,.28)", borderRadius: 26, padding: 26, marginBottom: 22 };
const panel: React.CSSProperties = { background: "#121724", border: "1px solid rgba(207,216,230,.16)", borderRadius: 22, padding: 22, color: "#f7f7fb", textDecoration: "none", display: "block" };
const activePanel: React.CSSProperties = { ...panel, borderColor: "rgba(245,197,66,.75)", boxShadow: "0 0 26px rgba(245,197,66,.18)" };
const pulseRed: React.CSSProperties = { ...panel, borderColor: "rgba(255,70,70,.70)", animation: "vfPulseRed 2.1s ease-in-out infinite" };
const pulseGold: React.CSSProperties = { ...panel, borderColor: "rgba(255,220,104,.70)", animation: "vfPulseGold 2.3s ease-in-out infinite" };
const eyebrow: React.CSSProperties = { color: "#ffd45a", textTransform: "uppercase", letterSpacing: 7, fontWeight: 950, fontSize: 14, marginBottom: 12 };
const h1: React.CSSProperties = { fontSize: "clamp(44px,8vw,86px)", lineHeight: 0.9, letterSpacing: -4, margin: "0 0 18px", fontWeight: 950 };
const h2: React.CSSProperties = { fontSize: "clamp(30px,5vw,52px)", lineHeight: 0.95, letterSpacing: -2, margin: "0 0 14px", fontWeight: 950 };
const sub: React.CSSProperties = { color: "#c9d0dc", fontSize: 20, lineHeight: 1.35, margin: 0 };
const muted: React.CSSProperties = { color: "#aeb7c7", margin: "8px 0 0", lineHeight: 1.35 };
const grid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))", gap: 16 };
const row: React.CSSProperties = { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" };
const meterBg: React.CSSProperties = { height: 11, background: "#070a12", borderRadius: 999, overflow: "hidden", border: "1px solid rgba(207,216,230,.12)" };

function Nav() {
  return (
    <nav style={nav}>
      <div style={brand}>VAULTFORGE</div>
      <Link href="/command" style={btn}>Command</Link>
      <Link href="/my-rooms" style={btn}>My Rooms</Link>
      <Link href="/routing" style={btn}>Routing</Link>
      <Link href="/members" style={btn}>Members</Link>
      <Link href="/network" style={btn}>Network</Link>
      <Link href="/state-map" style={btn}>State Map</Link>
      <Link href="/alerts" style={goldBtn}>Alerts</Link>
      <Link href="/messages" style={btn}>Messages</Link>
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

function MetricCard({ title, count, note, danger }: { title: string; count: number; note: string; danger?: boolean }) {
  return (
    <div style={danger && count ? pulseRed : count ? pulseGold : panel}>
      <div style={eyebrow}>{title}</div>
      <h2 style={h2}>{count}</h2>
      <p style={muted}>{note}</p>
    </div>
  );
}

function FilterButton({ filter, current, title, count, onClick }: { filter: AlertFilter; current: AlertFilter; title: string; count: number; onClick: () => void }) {
  return (
    <button type="button" style={current === filter ? activePanel : count ? pulseGold : panel} onClick={onClick}>
      <div style={eyebrow}>{title}</div>
      <h2 style={h2}>{count}</h2>
      <p style={muted}>alert(s)</p>
    </button>
  );
}

function AlertCard({ alert, refresh }: { alert: AlertItem; refresh: () => void }) {
  const id = rid(alert.room);
  const href = alert.kind === "deal" ? `/deal-rooms/${encodeURIComponent(id)}` : `/pain-rooms/${encodeURIComponent(id)}`;
  const ack = isAcknowledged(alert);
  const style = alert.severity >= 75 && !ack ? pulseRed : alert.severity >= 55 && !ack ? pulseGold : panel;
  const meterColor = alert.severity >= 75 ? "#ff4b5c" : alert.severity >= 55 ? "#ffdc68" : "#f5a742";

  return (
    <div style={style}>
      <div style={eyebrow}>{alert.lane} • {alert.status}{ack ? " • Acknowledged" : ""}</div>
      <h2 style={h2}>{alert.title}</h2>
      <p style={sub}>{loc(alert.room)}</p>
      <p style={muted}>
        {alert.kind === "deal"
          ? `${txt(alert.room.assetClass, "Asset")} • ${txt(alert.room.propertyType, "Type")} • ${list(alert.room.strategy).join(", ") || "Strategy open"}`
          : `${list(alert.room.painTypes).join(", ") || "Pain"} • ${txt(alert.room.severity, "Severity open")} • ${txt(alert.room.timePressure, "Timeline open")}`}
      </p>

      <div style={{ ...panel, marginTop: 16 }}>
        <div style={eyebrow}>Signal Severity</div>
        <h2 style={{ ...h2, fontSize: "clamp(28px,4vw,42px)" }}>{alert.severity}%</h2>
        <div style={meterBg}>
          <div style={{ width: `${alert.severity}%`, height: "100%", background: meterColor }} />
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <div style={eyebrow}>VaultForge Alert Read</div>
        <p style={sub}>{alert.signal}</p>
        <p style={muted}>Next move: {alert.nextMove}</p>
        <p style={muted}>Required party: {alert.requiredParty}</p>
        <p style={muted}>Pressure: {alert.pressure}</p>
      </div>

      <div style={{ ...row, marginTop: 18 }}>
        <Link href={href} style={goldBtn}>Open Room</Link>
        <Link href={`/messages?type=${alert.kind}&room=${encodeURIComponent(id)}&subject=${encodeURIComponent((alert.kind === "deal" ? "Deal Alert: " : "Pain Alert: ") + alert.title)}`} style={btn}>Message</Link>
        <Link href="/routing" style={btn}>Routing</Link>
        <button type="button" style={ack ? btn : goldBtn} onClick={() => { acknowledge(alert); refresh(); }}>
          {ack ? "Acknowledged" : "Acknowledge"}
        </button>
      </div>
    </div>
  );
}

export default function AlertsPage() {
  const [tick, setTick] = useState(0);
  const [filter, setFilter] = useState<AlertFilter>("all");

  useEffect(() => {
    const refresh = () => setTick((value) => value + 1);
    window.addEventListener("storage", refresh);
    window.addEventListener("vaultforge-alert-change", refresh);
    window.addEventListener("vaultforge-route-status-change", refresh);
    window.addEventListener("vaultforge-my-rooms-change", refresh);
    window.addEventListener("vaultforge-deal-change", refresh);
    window.addEventListener("vaultforge-pain-change", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("vaultforge-alert-change", refresh);
      window.removeEventListener("vaultforge-route-status-change", refresh);
      window.removeEventListener("vaultforge-my-rooms-change", refresh);
      window.removeEventListener("vaultforge-deal-change", refresh);
      window.removeEventListener("vaultforge-pain-change", refresh);
    };
  }, []);

  const deals = useMemo(() => allRooms("deal"), [tick]);
  const pains = useMemo(() => allRooms("pain"), [tick]);
  const alerts = useMemo(() => buildAlerts(deals, pains), [deals, pains]);
  const visible = useMemo(() => filterAlerts(alerts, filter), [alerts, filter]);
  const refresh = () => setTick((value) => value + 1);

  const urgent = alerts.filter((alert) => alert.severity >= 70 && alert.status !== "closed").length;
  const dealAlerts = alerts.filter((alert) => alert.kind === "deal" && alert.status !== "closed").length;
  const painAlerts = alerts.filter((alert) => alert.kind === "pain" && alert.status !== "closed").length;
  const routed = alerts.filter((alert) => alert.status === "routed").length;
  const unresolved = alerts.filter((alert) => alert.status !== "closed" && alert.status !== "resolved").length;

  const filters: { key: AlertFilter; title: string; count: number }[] = [
    { key: "all", title: "All Active", count: filterAlerts(alerts, "all").length },
    { key: "deal", title: "Deal Alerts", count: dealAlerts },
    { key: "pain", title: "Pain Alerts", count: painAlerts },
    { key: "urgent", title: "Urgent", count: urgent },
    { key: "routed", title: "Routed", count: routed },
    { key: "resolved", title: "Resolved", count: filterAlerts(alerts, "resolved").length },
    { key: "closed", title: "Closed", count: filterAlerts(alerts, "closed").length },
  ];

  return (
    <main style={page}>
      <style>{styleTag}</style>
      <div style={wrap}>
        <Nav />

        <section style={hero}>
          <div style={eyebrow}>VaultForge Alerts</div>
          <h1 style={h1}>Signal pressure desk.</h1>
          <p style={sub}>
            Alerts separate Deal pressure from Pain pressure. Open the exact room, route the signal, message the operator, or acknowledge the alert.
          </p>
          <div style={{ ...row, marginTop: 18 }}>
            <Link href="/my-rooms" style={goldBtn}>My Rooms</Link>
            <Link href="/routing" style={btn}>Routing</Link>
            <Link href="/messages" style={btn}>Messages</Link>
            <Link href="/command" style={btn}>Command</Link>
          </div>
        </section>

        <section style={{ marginBottom: 20 }}>
          <div style={grid}>
            <MetricCard title="Active Signals" count={unresolved} note="open alerts needing review" danger={unresolved > 0} />
            <MetricCard title="Urgent" count={urgent} note="high pressure signal alerts" danger />
            <MetricCard title="Deal Alerts" count={dealAlerts} note="opportunity-side alert queue" />
            <MetricCard title="Pain Alerts" count={painAlerts} note="problem-solving alert queue" danger={painAlerts > 0} />
          </div>
        </section>

        <Section title="Alert Lanes">
          <div style={grid}>
            {filters.map((item) => (
              <FilterButton key={item.key} filter={item.key} current={filter} title={item.title} count={item.count} onClick={() => setFilter(item.key)} />
            ))}
          </div>
        </Section>

        <Section title={`${filters.find((item) => item.key === filter)?.title || "Active"} Alert Queue`}>
          {visible.length ? (
            <div style={grid}>
              {visible.map((alert) => (
                <AlertCard key={alert.id} alert={alert} refresh={refresh} />
              ))}
            </div>
          ) : (
            <div style={panel}>
              <h2 style={h2}>No alerts here.</h2>
              <p style={sub}>Create Deal or Pain rooms, route rooms, or open another alert lane.</p>
              <div style={{ ...row, marginTop: 16 }}>
                <Link href="/deal-create" style={goldBtn}>Create Deal</Link>
                <Link href="/pain-intake" style={goldBtn}>Create Pain</Link>
                <Link href="/my-rooms" style={btn}>My Rooms</Link>
              </div>
            </div>
          )}
        </Section>

        <Section title="Alert Doctrine">
          <div style={grid}>
            <div style={panel}>
              <div style={eyebrow}>Deal Alerts</div>
              <p style={sub}>Detect weak numbers, missing fields, high-spread opportunities, and routing gaps.</p>
              <p style={muted}>A deal alert should lead to underwriting, buyer/capital/operator routing, or cleanup.</p>
            </div>
            <div style={panel}>
              <div style={eyebrow}>Pain Alerts</div>
              <p style={sub}>Detect blockers, time pressure, capital needs, city/legal risk, and solver gaps.</p>
              <p style={muted}>A pain alert should lead to root cause, responsible party, deadline, and solver routing.</p>
            </div>
            <div style={panel}>
              <div style={eyebrow}>Execution Rule</div>
              <p style={sub}>Every alert needs movement.</p>
              <p style={muted}>Open the room, message the owner, route the signal, acknowledge, or close it later through the room state.</p>
            </div>
          </div>
        </Section>
      </div>
    </main>
  );
}
