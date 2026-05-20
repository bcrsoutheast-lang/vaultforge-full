"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Member = {
  id: string;
  name: string;
  email: string;
  company: string;
  state: string;
  states: string[];
  counties: string[];
  memberType: string;
  strategies: string[];
  painFocus: string[];
  capitalRange: string;
  score: number;
};

type Room = {
  id?: string;
  roomId?: string;
  title?: string;
  state?: string;
  city?: string;
  county?: string;
  assetClass?: string;
  propertyType?: string;
  strategy?: string[] | string;
  routeTo?: string[] | string;
  severity?: string;
  painTypes?: string[] | string;
  needs?: string[] | string;
  routingNeeds?: string[] | string;
  roomState?: string;
  cleanupState?: string;
  stateStatus?: string;
  ownerEmail?: string;
  ownerId?: string;
  routedToIds?: string[] | string;
  routedToEmails?: string[] | string;
  assignedToIds?: string[] | string;
  assignedToEmails?: string[] | string;
  updatedAt?: string;
  createdAt?: string;
  [key: string]: unknown;
};

const PROFILE_KEYS = ["vaultforge_profile", "vaultforge_member_profile", "vaultforge_clean_profile"];
const MEMBER_DIRECTORY_KEYS = ["vaultforge_member_directory", "vaultforge_members", "vf_members"];
const DEAL_KEYS = ["vaultforge_clean_deal_rooms", "vaultforge_deal_rooms", "vaultforge_rooms_deals", "vf_deal_rooms"];
const PAIN_KEYS = ["vaultforge_clean_pain_rooms_v2", "vaultforge_clean_pain_rooms_v1", "vaultforge_clean_pain_rooms", "vaultforge_pain_rooms", "vaultforge_rooms_pain", "vf_pain_rooms"];
const THREAD_KEY = "vaultforge_message_threads_v2";
const ACTIVITY_KEY = "vaultforge_room_activity_v2";

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

function rid(room: Room) {
  return txt(room.id || room.roomId);
}

function loc(room: Room) {
  return [txt(room.city), txt(room.county), txt(room.state)].filter(Boolean).join(", ") || "Market not listed";
}

function roomTitle(room: Room, kind: "deal" | "pain") {
  return txt(room.title, kind === "deal" ? "Untitled Deal Room" : "Untitled Pain Room");
}

function normalizeRoom(raw: any): Room {
  const id = txt(raw?.id || raw?.roomId || raw?.dealId || raw?.painId || raw?.signalId);
  return {
    ...raw,
    id,
    roomId: id,
    title: txt(raw?.title || raw?.name || raw?.dealTitle || raw?.painTitle || raw?.problemTitle),
  };
}

function readRooms(kind: "deal" | "pain") {
  if (!ok()) return [];
  const keys = kind === "deal" ? DEAL_KEYS : PAIN_KEYS;
  const out: Room[] = [];
  const seen = new Set<string>();

  for (const key of keys) {
    for (const row of arr<any>(key)) {
      const room = normalizeRoom(row);
      const id = rid(room);
      if (!id || seen.has(id)) continue;
      seen.add(id);
      out.push(room);
    }
  }

  return out.filter((room) => {
    const status = txt(room.roomState || room.cleanupState || room.stateStatus, "active");
    return !["deleted", "archived"].includes(status);
  });
}

function defaultMembers(): Member[] {
  return [
    {
      id: "ga_buyer",
      name: "Georgia Buyer Group",
      email: "ga@vaultforge.local",
      company: "Atlanta Acquisitions",
      state: "GA",
      states: ["GA", "TN"],
      counties: ["Cobb", "Fulton", "Cherokee"],
      memberType: "Buyer",
      strategies: ["Fix & Flip", "Rental"],
      painFocus: ["Distress", "Foreclosure"],
      capitalRange: "$500k-$5M",
      score: 91,
    },
    {
      id: "fl_operator",
      name: "Florida Operator",
      email: "fl@vaultforge.local",
      company: "Sunbelt Operations",
      state: "FL",
      states: ["FL", "GA"],
      counties: ["Miami-Dade", "Orange"],
      memberType: "Operator",
      strategies: ["Multifamily", "Value Add"],
      painFocus: ["Construction", "Capital"],
      capitalRange: "$1M-$10M",
      score: 87,
    },
    {
      id: "capital_partner",
      name: "Capital Partner",
      email: "capital@vaultforge.local",
      company: "Forge Capital",
      state: "TX",
      states: ["TX", "GA", "FL"],
      counties: [],
      memberType: "Lender",
      strategies: ["Bridge", "Equity"],
      painFocus: ["Capital", "Liquidity"],
      capitalRange: "$5M-$50M",
      score: 94,
    },
  ];
}

function readMembers(): Member[] {
  if (!ok()) return defaultMembers();

  const out: Member[] = [];
  const seen = new Set<string>();

  for (const key of MEMBER_DIRECTORY_KEYS) {
    for (const raw of arr<any>(key)) {
      const email = txt(raw?.email).toLowerCase();
      const id = txt(raw?.id || email || raw?.name);
      if (!id || seen.has(id)) continue;
      seen.add(id);

      out.push({
        id,
        name: txt(raw?.name || raw?.fullName || raw?.full_name || raw?.company, "VaultForge Member"),
        email,
        company: txt(raw?.company || raw?.businessName || raw?.name, "VaultForge"),
        state: txt(raw?.state, "GA"),
        states: list(raw?.states || raw?.statesOperatedIn || raw?.markets || raw?.operatingStates),
        counties: list(raw?.counties || raw?.markets),
        memberType: txt(raw?.memberType || raw?.role || raw?.type, "Operator"),
        strategies: list(raw?.strategies || raw?.buyBox || raw?.focus),
        painFocus: list(raw?.painFocus || raw?.painTypes || raw?.problemsSolved),
        capitalRange: txt(raw?.capitalRange || raw?.capital || raw?.fundSize, "Not listed"),
        score: Number(raw?.score || 70),
      });
    }
  }

  for (const key of PROFILE_KEYS) {
    const raw = j<any | null>(localStorage.getItem(key), null);
    if (!raw || typeof raw !== "object") continue;

    const email = txt(raw?.email).toLowerCase();
    const id = txt(raw?.id || email || raw?.name);
    if (!id || seen.has(id)) continue;
    seen.add(id);

    out.push({
      id,
      name: txt(raw?.name || raw?.fullName || raw?.full_name || raw?.company, "Me"),
      email,
      company: txt(raw?.company || raw?.businessName || raw?.name, "VaultForge"),
      state: txt(raw?.state, "GA"),
      states: list(raw?.states || raw?.statesOperatedIn || raw?.markets || raw?.operatingStates),
      counties: list(raw?.counties || raw?.markets),
      memberType: txt(raw?.memberType || raw?.role || raw?.type, "Operator"),
      strategies: list(raw?.strategies || raw?.buyBox || raw?.focus),
      painFocus: list(raw?.painFocus || raw?.painTypes || raw?.problemsSolved),
      capitalRange: txt(raw?.capitalRange || raw?.capital || raw?.fundSize, "Not listed"),
      score: Number(raw?.score || 88),
    });
  }

  return out.length ? out : defaultMembers();
}

function scoreDeal(room: Room, member: Member) {
  let score = member.score;

  if (member.states.includes(txt(room.state))) score += 18;
  if (member.counties.includes(txt(room.county))) score += 12;

  const strategies = list(room.strategy);
  for (const strat of strategies) {
    if (member.strategies.some((item) => item.toLowerCase().includes(strat.toLowerCase()))) score += 10;
  }

  if (member.memberType.toLowerCase().includes("buyer")) score += 8;
  if (member.memberType.toLowerCase().includes("lender")) score += 4;

  return Math.min(99, score);
}

function scorePain(room: Room, member: Member) {
  let score = member.score;

  if (member.states.includes(txt(room.state))) score += 18;
  if (member.counties.includes(txt(room.county))) score += 10;

  const pain = list(room.painTypes);
  for (const p of pain) {
    if (member.painFocus.some((item) => item.toLowerCase().includes(p.toLowerCase()))) score += 12;
  }

  if (member.memberType.toLowerCase().includes("operator")) score += 7;
  if (member.memberType.toLowerCase().includes("lender") && txt(room.severity).includes("Capital")) score += 6;

  return Math.min(99, score);
}

function routeRoom(kind: "deal" | "pain", roomId: string, member: Member) {
  if (!ok()) return;

  const keys = kind === "deal" ? DEAL_KEYS : PAIN_KEYS;

  for (const key of keys) {
    const rooms = arr<any>(key);
    const next = rooms.map((raw) => {
      const room = normalizeRoom(raw);
      if (rid(room) !== roomId) return raw;

      const ids = new Set(list(room.routedToIds).concat(list(room.assignedToIds)));
      const emails = new Set(list(room.routedToEmails).concat(list(room.assignedToEmails)));

      ids.add(member.id);
      emails.add(member.email);

      return {
        ...room,
        routedToIds: Array.from(ids),
        assignedToIds: Array.from(ids),
        routedToEmails: Array.from(emails),
        assignedToEmails: Array.from(emails),
        updatedAt: new Date().toISOString(),
      };
    });

    writeJson(key, next);
  }

  const activity = j<Record<string, { at: string; action: string; note: string }[]>>(localStorage.getItem(ACTIVITY_KEY), {});
  const activityKey = `${kind}:${roomId}`;
  activity[activityKey] = [
    {
      at: new Date().toISOString(),
      action: "Routed",
      note: `Room routed to ${member.name}.`,
    },
    ...(activity[activityKey] || []),
  ].slice(0, 75);

  writeJson(ACTIVITY_KEY, activity);

  window.dispatchEvent(new Event("vaultforge-room-activity-change"));
  window.dispatchEvent(new Event("vaultforge-my-rooms-change"));
  window.dispatchEvent(new Event("vaultforge-alert-change"));
}

function messageMember(kind: "deal" | "pain", roomId: string, member: Member) {
  if (!ok()) return;

  const room = kind === "deal"
    ? readRooms("deal").find((item) => rid(item) === roomId)
    : readRooms("pain").find((item) => rid(item) === roomId);

  const threads = arr<any>(THREAD_KEY);

  threads.unshift({
    id: `route_${kind}_${roomId}_${Date.now()}`,
    lane: kind,
    roomId,
    roomType: kind,
    subject: `${kind === "deal" ? "Deal Route" : "Pain Route"} • ${roomTitle(room || {}, kind)}`,
    state: txt(room?.state),
    roomTitle: roomTitle(room || {}, kind),
    roomSubtitle: loc(room || {}),
    participants: [member.email],
    toEmail: member.email,
    status: "active",
    unread: true,
    saved: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messages: [
      {
        id: `msg_${Date.now()}`,
        body: `VaultForge routing request sent to ${member.name}.`,
        from: "VaultForge",
        fromEmail: "",
        at: new Date().toISOString(),
        read: false,
        attachments: [],
      },
    ],
  });

  writeJson(THREAD_KEY, threads);

  window.dispatchEvent(new Event("vaultforge-messages-change"));
  window.dispatchEvent(new Event("vaultforge-alert-change"));
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
const wrap: React.CSSProperties = { maxWidth: 1400, margin: "0 auto", paddingBottom: 90 };
const nav: React.CSSProperties = { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 18 };
const brand: React.CSSProperties = { color: "#ffd45a", fontSize: 27, fontWeight: 950, letterSpacing: -1, marginRight: 10 };
const btn: React.CSSProperties = { border: "1px solid rgba(207,216,230,.18)", background: "#171c29", color: "#f7f7fb", borderRadius: 999, padding: "13px 18px", fontWeight: 950, textDecoration: "none", display: "inline-block", cursor: "pointer" };
const goldBtn: React.CSSProperties = { ...btn, border: 0, background: "#ffdc68", color: "#10131a" };
const redBtn: React.CSSProperties = { ...btn, background: "#271016", borderColor: "rgba(255,70,70,.48)", color: "#ffaaaa" };
const hero: React.CSSProperties = { border: "1px solid rgba(245,197,66,.28)", borderRadius: 28, padding: 30, marginBottom: 20, background: "radial-gradient(circle at top right, rgba(245,197,66,.16), transparent 32%), linear-gradient(180deg,#080d19,#050816)" };
const card: React.CSSProperties = { background: "linear-gradient(180deg,#080d19,#050816)", border: "1px solid rgba(245,197,66,.28)", borderRadius: 26, padding: 26, marginBottom: 22 };
const panel: React.CSSProperties = { background: "#121724", border: "1px solid rgba(207,216,230,.16)", borderRadius: 22, padding: 22 };
const activePanel: React.CSSProperties = { ...panel, borderColor: "rgba(245,197,66,.75)", boxShadow: "0 0 26px rgba(245,197,66,.18)" };
const pulseRed: React.CSSProperties = { ...panel, borderColor: "rgba(255,70,70,.70)", animation: "vfPulseRed 2.1s ease-in-out infinite" };
const pulseGold: React.CSSProperties = { ...panel, borderColor: "rgba(255,220,104,.70)", animation: "vfPulseGold 2.3s ease-in-out infinite" };
const eyebrow: React.CSSProperties = { color: "#ffd45a", textTransform: "uppercase", letterSpacing: 7, fontWeight: 950, fontSize: 15, marginBottom: 12 };
const h1: React.CSSProperties = { fontSize: "clamp(44px,8vw,86px)", lineHeight: 0.9, letterSpacing: -4, margin: "0 0 18px", fontWeight: 950 };
const h2: React.CSSProperties = { fontSize: "clamp(26px,5vw,44px)", lineHeight: 0.95, letterSpacing: -2, margin: "0 0 14px", fontWeight: 950 };
const sub: React.CSSProperties = { color: "#c9d0dc", fontSize: 18, lineHeight: 1.35, margin: 0 };
const muted: React.CSSProperties = { color: "#aeb7c7", margin: "8px 0 0", lineHeight: 1.35 };
const grid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 16 };
const row: React.CSSProperties = { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" };

function Nav() {
  return (
    <nav style={nav}>
      <div style={brand}>VAULTFORGE</div>
      <Link href="/command" style={btn}>Command</Link>
      <Link href="/my-rooms" style={btn}>My Rooms</Link>
      <Link href="/state-map" style={btn}>State Map</Link>
      <Link href="/alerts" style={btn}>Alerts</Link>
      <Link href="/messages" style={btn}>Messages</Link>
      <Link href="/routing" style={goldBtn}>Routing</Link>
      <Link href="/network" style={btn}>Network</Link>
      <Link href="/logout" style={redBtn}>Logout</Link>
    </nav>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section style={card}><div style={eyebrow}>{title}</div>{children}</section>;
}

function MemberCard({ member, score, onRoute, onMessage }: { member: Member; score: number; onRoute: () => void; onMessage: () => void }) {
  return (
    <div style={score >= 92 ? pulseGold : activePanel}>
      <div style={eyebrow}>Match Score • {score}</div>
      <h2 style={h2}>{member.name}</h2>
      <p style={sub}>{member.company}</p>
      <p style={muted}>{member.memberType} • {member.capitalRange}</p>
      <p style={muted}>States: {member.states.join(", ") || member.state}</p>
      <p style={muted}>Strategies: {member.strategies.join(", ") || "Not listed"}</p>
      <p style={muted}>Pain Focus: {member.painFocus.join(", ") || "Not listed"}</p>

      <div style={{ ...row, marginTop: 16 }}>
        <button type="button" style={goldBtn} onClick={onRoute}>Route</button>
        <button type="button" style={btn} onClick={onMessage}>Message</button>
      </div>
    </div>
  );
}

export default function RoutingPage() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const refresh = () => setTick((value) => value + 1);

    window.addEventListener("storage", refresh);
    window.addEventListener("vaultforge-room-activity-change", refresh);
    window.addEventListener("vaultforge-messages-change", refresh);

    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("vaultforge-room-activity-change", refresh);
      window.removeEventListener("vaultforge-messages-change", refresh);
    };
  }, []);

  const deals = useMemo(() => readRooms("deal"), [tick]);
  const pains = useMemo(() => readRooms("pain"), [tick]);
  const members = useMemo(() => readMembers(), [tick]);

  return (
    <main style={page}>
      <style>{styleTag}</style>

      <div style={wrap}>
        <Nav />

        <section style={hero}>
          <div style={eyebrow}>Routing Engine</div>
          <h1 style={h1}>AI member matching.</h1>
          <p style={sub}>Best fit members, operators, lenders, and buyers for each room. Route directly into their workspace.</p>
        </section>

        <Section title="Deal Routing Lane">
          {deals.length ? (
            <div style={{ display: "grid", gap: 24 }}>
              {deals.map((room) => {
                const ranked = members
                  .map((member) => ({ member, score: scoreDeal(room, member) }))
                  .sort((a, b) => b.score - a.score)
                  .slice(0, 3);

                return (
                  <div key={rid(room)} style={activePanel}>
                    <div style={eyebrow}>Deal Room</div>
                    <h2 style={h2}>{roomTitle(room, "deal")}</h2>
                    <p style={sub}>{loc(room)}</p>
                    <p style={muted}>
                      {txt(room.assetClass, "Deal")} • {txt(room.propertyType, "Type")} • Strategy {list(room.strategy).join(", ") || "open"}
                    </p>
                    <p style={muted}>
                      Routed: {list(room.routedToIds).length} • Assigned: {list(room.assignedToIds).length}
                    </p>

                    <div style={{ ...row, marginTop: 14, marginBottom: 18 }}>
                      <Link href={`/deal-rooms/${encodeURIComponent(rid(room))}`} style={goldBtn}>Open Deal Room</Link>
                    </div>

                    <div style={grid}>
                      {ranked.map(({ member, score }) => (
                        <MemberCard
                          key={`${rid(room)}_${member.id}`}
                          member={member}
                          score={score}
                          onRoute={() => {
                            routeRoom("deal", rid(room), member);
                            setTick((value) => value + 1);
                          }}
                          onMessage={() => {
                            messageMember("deal", rid(room), member);
                            setTick((value) => value + 1);
                          }}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={panel}>
              <h2 style={h2}>No active deal rooms.</h2>
              <p style={sub}>Create deal rooms to generate routing matches.</p>
            </div>
          )}
        </Section>

        <Section title="Pain Solver Lane">
          {pains.length ? (
            <div style={{ display: "grid", gap: 24 }}>
              {pains.map((room) => {
                const ranked = members
                  .map((member) => ({ member, score: scorePain(room, member) }))
                  .sort((a, b) => b.score - a.score)
                  .slice(0, 3);

                return (
                  <div key={rid(room)} style={txt(room.severity).includes("Critical") || txt(room.severity).includes("Emergency") ? pulseRed : activePanel}>
                    <div style={eyebrow}>Pain Room</div>
                    <h2 style={h2}>{roomTitle(room, "pain")}</h2>
                    <p style={sub}>{loc(room)}</p>
                    <p style={muted}>
                      {list(room.painTypes).join(", ") || "Pain"} • {txt(room.severity, "High")} • Needs {list(room.needs || room.routingNeeds).join(", ") || "solver"}
                    </p>
                    <p style={muted}>
                      Routed: {list(room.routedToIds).length} • Assigned: {list(room.assignedToIds).length}
                    </p>

                    <div style={{ ...row, marginTop: 14, marginBottom: 18 }}>
                      <Link href={`/pain-rooms/${encodeURIComponent(rid(room))}`} style={goldBtn}>Open Pain Room</Link>
                    </div>

                    <div style={grid}>
                      {ranked.map(({ member, score }) => (
                        <MemberCard
                          key={`${rid(room)}_${member.id}`}
                          member={member}
                          score={score}
                          onRoute={() => {
                            routeRoom("pain", rid(room), member);
                            setTick((value) => value + 1);
                          }}
                          onMessage={() => {
                            messageMember("pain", rid(room), member);
                            setTick((value) => value + 1);
                          }}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={panel}>
              <h2 style={h2}>No active pain rooms.</h2>
              <p style={sub}>Create pain rooms to generate solver matches.</p>
            </div>
          )}
        </Section>
      </div>
    </main>
  );
}
