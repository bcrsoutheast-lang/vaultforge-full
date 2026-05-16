"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Lane = "opportunity" | "pressure";
type MemberProfile = Record<string, any>;

function clean(value: unknown) {
  return String(value || "").trim();
}

function cleanEmail(value: unknown) {
  return clean(value).toLowerCase();
}

function parseList(value: unknown) {
  if (Array.isArray(value)) return value.map(clean).filter(Boolean);

  const text = clean(value);
  if (!text) return [];

  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return parsed.map(clean).filter(Boolean);
  } catch {
    // Continue.
  }

  return text
    .split(/[,\n|;]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function uniq(items: string[]) {
  return Array.from(new Set(items.map(clean).filter(Boolean)));
}

function readAllLocalProfiles() {
  if (typeof window === "undefined") return [];

  const profiles: MemberProfile[] = [];

  try {
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index) || "";

      if (!key.startsWith("vaultforge_final_member_profile_")) continue;

      const raw = window.localStorage.getItem(key);
      if (!raw) continue;

      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        profiles.push(parsed);
      }
    }
  } catch {
    // Ignore.
  }

  return profiles;
}

function normalizeProfile(row: MemberProfile): MemberProfile {
  const intelligence = row.profile_intelligence || row.intelligence_profile || row.metadata || {};

  const email = cleanEmail(
    row.email ||
      row.member_email ||
      row.user_email ||
      intelligence.email ||
      intelligence.member_email
  );

  return {
    ...row,
    email,
    photo_url: clean(row.photo_url || row.avatar_url || intelligence.photo_url || intelligence.avatar_url),
    full_name: clean(row.full_name || row.name || row.display_name || intelligence.full_name || intelligence.name || email),
    company: clean(row.company || row.company_name || intelligence.company || intelligence.company_name),
    state_from: clean(row.state_from || row.home_state || row.based_state || intelligence.state_from || intelligence.home_state),
    city_from: clean(row.city_from || row.city || intelligence.city_from || intelligence.city),
    states_operated: uniq([
      ...parseList(row.states_operated),
      ...parseList(row.operating_states),
      ...parseList(row.service_states),
      ...parseList(intelligence.states_operated),
      ...parseList(intelligence.operating_states),
    ]),
    counties_operated: clean(row.counties_operated || intelligence.counties_operated || row.counties || row.markets),
    roles: uniq([...parseList(row.roles), ...parseList(row.member_type), ...parseList(intelligence.roles)]),
    buy_box: uniq([...parseList(row.buy_box), ...parseList(row.asset_types), ...parseList(intelligence.buy_box)]),
    strategies: uniq([...parseList(row.strategies), ...parseList(row.strategy), ...parseList(intelligence.strategies)]),
    capabilities: uniq([...parseList(row.capabilities), ...parseList(row.execution), ...parseList(intelligence.capabilities), ...parseList(intelligence.execution)]),
    pressure_solutions: uniq([...parseList(row.pressure_solutions), ...parseList(row.pressure), ...parseList(intelligence.pressure_solutions), ...parseList(intelligence.pressure)]),
  };
}

function initials(value: string) {
  const text = clean(value);
  if (!text) return "VF";

  const name = text.includes("@") ? text.split("@")[0] : text;
  const parts = name.split(/[\s._-]+/).filter(Boolean);

  if (parts.length >= 2) return `${parts[0][0] || "V"}${parts[1][0] || "F"}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function textFromRoom(room: Record<string, any>) {
  return [
    room.title,
    room.name,
    room.address,
    room.city,
    room.state,
    room.county,
    room.asset_type,
    room.property_type,
    room.strategy,
    room.status,
    room.stage,
    room.summary,
    room.description,
    room.notes,
    room.problem_type,
    room.pain_type,
    room.urgency,
  ]
    .map(clean)
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function roomState(room: Record<string, any>) {
  return clean(
    room.state ||
      room.property_state ||
      room.market_state ||
      room.location_state ||
      room.region ||
      ""
  );
}

function roomTitle(room: Record<string, any>, fallback: string) {
  return clean(
    room.title ||
      room.deal_title ||
      room.pain_title ||
      room.project_title ||
      room.headline ||
      room.name ||
      room.address ||
      fallback
  );
}

function sourceRouteForRoom(lane: Lane, roomId: string) {
  if (lane === "pressure") return `/pain-room/${encodeURIComponent(roomId)}`;
  return `/deal/detail?id=${encodeURIComponent(roomId)}`;
}

function roomNeeds(room: Record<string, any>, lane: Lane) {
  const hay = textFromRoom(room);
  const needs = new Set<string>();

  if (lane === "opportunity") needs.add("Buyer");
  if (lane === "pressure") needs.add("Pressure Solver");

  if (hay.includes("capital") || hay.includes("fund") || hay.includes("lender") || hay.includes("loan")) needs.add("Capital");
  if (hay.includes("buyer") || hay.includes("exit") || hay.includes("disposition")) needs.add("Buyer");
  if (hay.includes("contractor") || hay.includes("operator") || hay.includes("rehab") || hay.includes("construction")) needs.add("Operator");
  if (hay.includes("title") || hay.includes("probate") || hay.includes("foreclosure") || hay.includes("tenant") || hay.includes("city") || hay.includes("permit")) needs.add("Pressure Solver");

  return Array.from(needs);
}

function memberLane(profile: MemberProfile) {
  const roles = profile.roles || [];
  const capabilities = profile.capabilities || [];
  const pressure = profile.pressure_solutions || [];

  if (roles.includes("Lender") || roles.includes("Private Money") || roles.includes("Capital Partner") || capabilities.includes("Private Lending") || capabilities.includes("Hard Money")) return "Capital";
  if (roles.includes("Contractor") || roles.includes("Operator") || capabilities.includes("Contractor Crew") || capabilities.includes("Full Rehab")) return "Operator";
  if (roles.includes("Buyer") || roles.includes("Investor")) return "Buyer";
  if (pressure.length) return "Pressure Solver";
  return "Network";
}

function scoreMatch(profile: MemberProfile, room: Record<string, any>, lane: Lane) {
  const roles = profile.roles || [];
  const states = profile.states_operated || [];
  const capabilities = profile.capabilities || [];
  const pressure = profile.pressure_solutions || [];
  const buyBox = profile.buy_box || [];
  const strategies = profile.strategies || [];
  const needs = roomNeeds(room, lane);
  const state = roomState(room);
  const hay = textFromRoom(room);

  let score = 0;
  const reasons: string[] = [];
  const warnings: string[] = [];

  if (state && states.includes(state)) {
    score += 26;
    reasons.push(`operates in ${state}`);
  } else if (state && states.length) {
    warnings.push(`does not list ${state}`);
  } else if (!states.length) {
    warnings.push("no operated states listed");
  }

  if (needs.includes("Capital") && (roles.includes("Lender") || roles.includes("Private Money") || capabilities.includes("Private Lending") || capabilities.includes("Hard Money"))) {
    score += 24;
    reasons.push("capital fit");
  }

  if (needs.includes("Buyer") && (roles.includes("Buyer") || roles.includes("Investor"))) {
    score += 22;
    reasons.push("buyer/investor fit");
  }

  if (needs.includes("Operator") && (roles.includes("Contractor") || roles.includes("Operator") || capabilities.includes("Contractor Crew") || capabilities.includes("Full Rehab"))) {
    score += 22;
    reasons.push("operator/execution fit");
  }

  if (needs.includes("Pressure Solver") && pressure.length) {
    score += 18;
    reasons.push(`pressure fit: ${pressure.slice(0, 2).join(", ")}`);
  }

  if (hay.includes("residential") && buyBox.includes("Residential")) {
    score += 8;
    reasons.push("residential buy-box fit");
  }

  if (hay.includes("commercial") && buyBox.includes("Commercial")) {
    score += 8;
    reasons.push("commercial buy-box fit");
  }

  if (hay.includes("land") && buyBox.includes("Land")) {
    score += 8;
    reasons.push("land buy-box fit");
  }

  if ((hay.includes("distress") || hay.includes("distressed")) && (strategies.includes("Distressed") || pressure.length)) {
    score += 10;
    reasons.push("distress strategy fit");
  }

  if (!roles.length) warnings.push("role stack missing");
  if (!capabilities.length) warnings.push("capabilities missing");
  if (!reasons.length) reasons.push("limited profile data for this room");

  return {
    score: Math.min(100, score),
    reasons,
    warnings,
    lane: memberLane(profile),
    needs,
  };
}

function fitLabel(score: number) {
  if (score >= 80) return "Strong Match";
  if (score >= 60) return "Good Match";
  if (score >= 40) return "Possible Match";
  return "Needs Review";
}

function slotPriority(lane: string, needs: string[]) {
  if (needs.includes(lane)) return 1;
  if (lane === "Capital" && needs.includes("Capital")) return 1;
  if (lane === "Operator" && needs.includes("Operator")) return 1;
  if (lane === "Buyer" && needs.includes("Buyer")) return 1;
  if (lane === "Pressure Solver" && needs.includes("Pressure Solver")) return 1;
  return 2;
}

function chooseCommandStack(members: MemberProfile[], room: Record<string, any>, lane: Lane) {
  const ranked = members
    .map((profile) => ({
      profile,
      match: scoreMatch(profile, room, lane),
    }))
    .sort((a, b) => {
      const aPriority = slotPriority(a.match.lane, a.match.needs);
      const bPriority = slotPriority(b.match.lane, b.match.needs);
      if (aPriority !== bPriority) return aPriority - bPriority;
      return b.match.score - a.match.score;
    });

  const used = new Set<string>();
  const byLane = (targetLane: string) => {
    const found = ranked.find((item) => item.match.lane === targetLane && !used.has(cleanEmail(item.profile.email || item.profile.full_name)));
    if (!found) return null;
    used.add(cleanEmail(found.profile.email || found.profile.full_name));
    return found;
  };

  const primary = ranked[0] || null;
  if (primary) used.add(cleanEmail(primary.profile.email || primary.profile.full_name));

  const slots = [
    { slot: "Primary Match", item: primary },
    { slot: "Capital Fit", item: byLane("Capital") },
    { slot: "Operator Fit", item: byLane("Operator") },
    { slot: "Buyer Fit", item: byLane("Buyer") },
    { slot: "Pressure Specialist", item: byLane("Pressure Solver") },
  ].filter((slot) => slot.item);

  const overflow = ranked.filter((item) => !used.has(cleanEmail(item.profile.email || item.profile.full_name)));

  return { ranked, slots, overflow };
}

const shell: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.24)",
  borderRadius: 26,
  padding: 18,
  background: "linear-gradient(145deg,rgba(232,196,107,.065),rgba(255,255,255,.025))",
  marginTop: 16,
  marginBottom: 16,
};

const label: React.CSSProperties = {
  color: "#e8c46b",
  letterSpacing: ".16em",
  textTransform: "uppercase",
  fontWeight: 950,
  fontSize: 11,
};

const muted: React.CSSProperties = {
  color: "#cbd5e1",
  lineHeight: 1.5,
};

const button: React.CSSProperties = {
  minHeight: 40,
  borderRadius: 999,
  padding: "9px 12px",
  background: "linear-gradient(135deg,#f8e7b0,#e8c46b)",
  color: "#06100a",
  fontWeight: 950,
  textDecoration: "none",
  border: 0,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};

const ghost: React.CSSProperties = {
  ...button,
  border: "1px solid rgba(255,255,255,.14)",
  background: "rgba(255,255,255,.060)",
  color: "white",
};

function MemberMatchCard({
  profile,
  room,
  lane,
  roomId,
  slot,
}: {
  profile: MemberProfile;
  room: Record<string, any>;
  lane: Lane;
  roomId: string;
  slot: string;
}) {
  const match = scoreMatch(profile, room, lane);
  const name = clean(profile.full_name) || clean(profile.email) || "VaultForge Member";
  const email = clean(profile.email);
  const state = clean(profile.state_from) || "State not listed";
  const currentRoomTitle = roomTitle(room, roomId);
  const currentRoomType = lane === "pressure" ? "Pressure Room" : "Opportunity Room";
  const currentSourceRoute = sourceRouteForRoom(lane, roomId);
  const matchReason = `${match.lane} · ${match.score}% · ${match.reasons.slice(0, 3).join(" · ")}`;

  const messageHref =
    `/messages/new?to=${encodeURIComponent(email)}` +
    `&subject=${encodeURIComponent(currentRoomTitle)}` +
    `&room_title=${encodeURIComponent(currentRoomTitle)}` +
    `&title=${encodeURIComponent(currentRoomTitle)}` +
    `&room_type=${encodeURIComponent(currentRoomType)}` +
    `&room_id=${encodeURIComponent(roomId)}` +
    `&item_id=${encodeURIComponent(roomId)}` +
    `&source=${encodeURIComponent("room-match")}` +
    `&type=${encodeURIComponent(lane)}` +
    `&folder=${encodeURIComponent(lane === "pressure" ? "pain" : "deals")}` +
    `&source_route=${encodeURIComponent(currentSourceRoute)}` +
    `&match_reason=${encodeURIComponent(matchReason)}`;

  return (
    <article
      style={{
        border: "1px solid rgba(255,255,255,.12)",
        borderRadius: 22,
        padding: 14,
        background: "rgba(255,255,255,.04)",
      }}
    >
      <div style={{ display: "grid", gridTemplateColumns: "60px 1fr auto", gap: 10, alignItems: "start" }}>
        <div
          style={{
            width: 54,
            height: 54,
            borderRadius: 18,
            border: "1px solid rgba(232,196,107,.30)",
            display: "grid",
            placeItems: "center",
            overflow: "hidden",
            color: "#f8e7b0",
            background: "rgba(0,0,0,.20)",
            fontWeight: 1000,
          }}
        >
          {profile.photo_url ? (
            <img src={profile.photo_url} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            initials(name)
          )}
        </div>

        <div>
          <div style={label}>{slot}</div>
          <h3 style={{ fontSize: 20, margin: "5px 0 4px", lineHeight: 1 }}>{name}</h3>
          <p style={{ ...muted, margin: 0, fontSize: 13 }}>
            {match.lane} · {fitLabel(match.score)} · Based in {state}
          </p>
        </div>

        <div
          style={{
            width: 50,
            height: 48,
            borderRadius: 16,
            border: "1px solid rgba(232,196,107,.28)",
            display: "grid",
            placeItems: "center",
            color: "#f8e7b0",
            fontWeight: 1000,
            background: "rgba(232,196,107,.06)",
          }}
        >
          {match.score}%
        </div>
      </div>

      <section
        style={{
          border: "1px solid rgba(232,196,107,.16)",
          borderRadius: 14,
          padding: 10,
          marginTop: 10,
          background: "rgba(232,196,107,.035)",
        }}
      >
        <div style={{ ...label, color: "#f8e7b0", fontSize: 10 }}>Why This Fit Is Shown</div>
        <p style={{ ...muted, margin: "5px 0 0", fontSize: 13 }}>
          {match.reasons.slice(0, 4).join(" · ")}
        </p>

        {match.warnings.length ? (
          <p style={{ color: "#fecaca", margin: "7px 0 0", fontSize: 12, lineHeight: 1.45 }}>
            Check: {match.warnings.slice(0, 2).join(" · ")}
          </p>
        ) : null}
      </section>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 11 }}>
        <Link href={messageHref} style={button}>Request Intro</Link>
        <Link href="/members" style={ghost}>Network</Link>
      </div>
    </article>
  );
}

export default function VaultForgeRoomMemberMatch({
  lane,
  room,
  roomId,
  title = "AI Member Matches",
}: {
  lane: Lane;
  room: Record<string, any>;
  roomId: string;
  title?: string;
}) {
  const [members, setMembers] = useState<MemberProfile[]>([]);
  const [status, setStatus] = useState("Loading member matches...");
  const [showOverflow, setShowOverflow] = useState(false);

  useEffect(() => {
    async function loadMembers() {
      const local = readAllLocalProfiles().map(normalizeProfile);

      try {
        const response = await fetch("/api/admin/members", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        const data = await response.json().catch(() => ({}));
        const rows = [
          ...(Array.isArray(data.members) ? data.members : []),
          ...(Array.isArray(data.profiles) ? data.profiles : []),
          ...(Array.isArray(data.items) ? data.items : []),
          ...(Array.isArray(data.data) ? data.data : []),
        ].map(normalizeProfile);

        const byEmail = new Map<string, MemberProfile>();

        [...rows, ...local].forEach((profile) => {
          const key = cleanEmail(profile.email) || `${profile.full_name}-${profile.state_from}-${Math.random()}`;
          if (!key) return;
          byEmail.set(key, { ...(byEmail.get(key) || {}), ...profile });
        });

        const finalMembers = Array.from(byEmail.values()).filter((profile) => clean(profile.full_name) || clean(profile.email));

        setMembers(finalMembers);
        setStatus(finalMembers.length ? "" : "No member profiles found yet. Fill out Profile to power AI matches.");
      } catch {
        setMembers(local);
        setStatus(local.length ? "" : "No member profiles found yet. Fill out Profile to power AI matches.");
      }
    }

    loadMembers();
  }, []);

  const commandStack = useMemo(() => chooseCommandStack(members, room || {}, lane), [members, room, lane]);
  const needs = roomNeeds(room || {}, lane);
  const hiddenCount = Math.max(0, commandStack.overflow.length);
  const avgScore = commandStack.slots.length
    ? Math.round(commandStack.slots.reduce((sum, slot) => sum + (slot.item?.match.score || 0), 0) / commandStack.slots.length)
    : 0;

  return (
    <section style={shell}>
      <style>{`
        .vf-room-match-grid {
          display: grid;
          grid-template-columns: repeat(2,minmax(0,1fr));
          gap: 12px;
        }

        a:hover {
          transform: translateY(-1px);
          transition: all .18s ease;
          filter: brightness(1.06);
        }

        @media(max-width:760px) {
          .vf-room-match-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      <div style={label}>{title}</div>
      <h2 style={{ fontSize: "clamp(30px,5vw,50px)", lineHeight: 0.95, letterSpacing: "-.045em", margin: "8px 0 10px" }}>
        Match command stack.
      </h2>

      <p style={{ ...muted, fontSize: 15, marginTop: 0 }}>
        VaultForge detected needs ({needs.join(", ") || "general network"}) and shows only the highest-value role slots to prevent match clutter.
      </p>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          marginBottom: 12,
        }}
      >
        <span style={{ border: "1px solid rgba(157,243,191,.24)", borderRadius: 999, padding: "7px 10px", color: "#9df3bf", fontWeight: 900 }}>
          {commandStack.slots.length} visible matches
        </span>
        <span style={{ border: "1px solid rgba(232,196,107,.24)", borderRadius: 999, padding: "7px 10px", color: "#f8e7b0", fontWeight: 900 }}>
          {avgScore}% average fit
        </span>
        <span style={{ border: "1px solid rgba(255,255,255,.14)", borderRadius: 999, padding: "7px 10px", color: "#cbd5e1", fontWeight: 900 }}>
          +{hiddenCount} overflow hidden
        </span>
      </div>

      {status ? (
        <p style={{ ...muted }}>{status}</p>
      ) : (
        <>
          <div className="vf-room-match-grid">
            {commandStack.slots.map((slot) => (
              <MemberMatchCard
                key={`${slot.slot}-${slot.item?.profile.email || slot.item?.profile.full_name}`}
                slot={slot.slot}
                profile={slot.item!.profile}
                room={room || {}}
                lane={lane}
                roomId={roomId}
              />
            ))}
          </div>

          {hiddenCount ? (
            <section
              style={{
                border: "1px solid rgba(255,255,255,.12)",
                borderRadius: 18,
                padding: 13,
                background: "rgba(255,255,255,.035)",
                marginTop: 12,
              }}
            >
              <div style={label}>Overflow Matches Controlled</div>
              <p style={{ ...muted, margin: "7px 0 10px", fontSize: 14 }}>
                {hiddenCount} additional compatible member{hiddenCount === 1 ? "" : "s"} are hidden to keep this room clean. Expand only when you need deeper routing options.
              </p>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setShowOverflow((value) => !value)}
                  style={{ ...button, background: showOverflow ? "rgba(255,255,255,.075)" : button.background, color: showOverflow ? "white" : button.color, border: showOverflow ? "1px solid rgba(255,255,255,.16)" : 0 }}
                >
                  {showOverflow ? "Hide Overflow" : `Show ${hiddenCount} More`}
                </button>
                <Link href="/members" style={ghost}>Open Full Network</Link>
              </div>

              {showOverflow ? (
                <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
                  {commandStack.overflow.slice(0, 8).map((item, index) => {
                    const profile = item.profile;
                    const match = item.match;
                    const name = clean(profile.full_name) || clean(profile.email) || "VaultForge Member";
                    const email = clean(profile.email);
                    const overflowRoomTitle = roomTitle(room || {}, roomId);
                    const overflowRoomType = lane === "pressure" ? "Pressure Room" : "Opportunity Room";
                    const overflowSourceRoute = sourceRouteForRoom(lane, roomId);
                    const overflowReason = `${match.lane} · ${match.score}% · ${match.reasons.slice(0, 3).join(" · ")}`;

                    const messageHref =
                      `/messages/new?to=${encodeURIComponent(email)}` +
                      `&subject=${encodeURIComponent(overflowRoomTitle)}` +
                      `&room_title=${encodeURIComponent(overflowRoomTitle)}` +
                      `&title=${encodeURIComponent(overflowRoomTitle)}` +
                      `&room_type=${encodeURIComponent(overflowRoomType)}` +
                      `&room_id=${encodeURIComponent(roomId)}` +
                      `&item_id=${encodeURIComponent(roomId)}` +
                      `&source=${encodeURIComponent("room-match-overflow")}` +
                      `&type=${encodeURIComponent(lane)}` +
                      `&folder=${encodeURIComponent(lane === "pressure" ? "pain" : "deals")}` +
                      `&source_route=${encodeURIComponent(overflowSourceRoute)}` +
                      `&match_reason=${encodeURIComponent(overflowReason)}`;

                    return (
                      <article
                        key={`${email || name}-${index}`}
                        style={{
                          border: "1px solid rgba(255,255,255,.10)",
                          borderRadius: 16,
                          padding: 11,
                          background: "rgba(0,0,0,.12)",
                          display: "grid",
                          gridTemplateColumns: "1fr auto",
                          gap: 10,
                          alignItems: "center",
                        }}
                      >
                        <div>
                          <strong>{name}</strong>
                          <p style={{ ...muted, margin: "4px 0 0", fontSize: 13 }}>
                            {match.lane} · {match.score}% · {match.reasons.slice(0, 2).join(" · ")}
                          </p>
                        </div>
                        <Link href={messageHref} style={{ ...ghost, minHeight: 36, padding: "8px 10px", fontSize: 12 }}>Intro</Link>
                      </article>
                    );
                  })}

                  {hiddenCount > 8 ? (
                    <p style={{ ...muted, margin: 0, fontSize: 13 }}>
                      Showing 8 overflow matches. Open the full Network for the rest.
                    </p>
                  ) : null}
                </div>
              ) : null}
            </section>
          ) : null}
        </>
      )}
    </section>
  );
}
