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
    // continue
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
    // ignore
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
    phone: clean(row.phone || row.phone_number || intelligence.phone),
    website: clean(row.website || intelligence.website),
    bio: clean(row.bio || row.description || intelligence.bio),
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

function roomNeeds(room: Record<string, any>, lane: Lane) {
  const hay = textFromRoom(room);
  const needs = new Set<string>();

  if (lane === "opportunity") {
    needs.add("Buyer");
  }

  if (lane === "pressure") {
    needs.add("Pressure Solver");
  }

  if (hay.includes("capital") || hay.includes("fund") || hay.includes("lender") || hay.includes("loan")) {
    needs.add("Capital");
  }

  if (hay.includes("buyer") || hay.includes("exit") || hay.includes("disposition")) {
    needs.add("Buyer");
  }

  if (hay.includes("contractor") || hay.includes("operator") || hay.includes("rehab") || hay.includes("construction")) {
    needs.add("Operator");
  }

  if (hay.includes("title") || hay.includes("probate") || hay.includes("foreclosure") || hay.includes("tenant") || hay.includes("city") || hay.includes("permit")) {
    needs.add("Pressure Solver");
  }

  return Array.from(needs);
}

function memberLane(profile: MemberProfile) {
  const roles = profile.roles || [];
  const capabilities = profile.capabilities || [];
  const pressure = profile.pressure_solutions || [];

  if (roles.includes("Lender") || roles.includes("Private Money") || roles.includes("Capital Partner") || capabilities.includes("Private Lending") || capabilities.includes("Hard Money")) {
    return "Capital";
  }

  if (roles.includes("Contractor") || roles.includes("Operator") || capabilities.includes("Contractor Crew") || capabilities.includes("Full Rehab")) {
    return "Operator";
  }

  if (roles.includes("Buyer") || roles.includes("Investor")) {
    return "Buyer";
  }

  if (pressure.length) {
    return "Pressure Solver";
  }

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
    warnings.push(`does not list ${state} as operated market`);
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

  if (score < 30 && reasons.length === 0) {
    reasons.push("limited profile data for this room");
  }

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
  return "Weak / Needs Review";
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
}: {
  profile: MemberProfile;
  room: Record<string, any>;
  lane: Lane;
  roomId: string;
}) {
  const match = scoreMatch(profile, room, lane);
  const name = clean(profile.full_name) || clean(profile.email) || "VaultForge Member";
  const email = clean(profile.email);
  const state = clean(profile.state_from) || "State not listed";
  const messageHref = `/messages/new?to=${encodeURIComponent(email)}&subject=${encodeURIComponent(`Room Match: ${clean(room.title || room.name || roomId)}`)}&source=room-match&type=${encodeURIComponent(lane)}&item_id=${encodeURIComponent(roomId)}&title=${encodeURIComponent(name)}`;

  return (
    <article
      style={{
        border: "1px solid rgba(255,255,255,.12)",
        borderRadius: 22,
        padding: 14,
        background: "rgba(255,255,255,.04)",
      }}
    >
      <div style={{ display: "grid", gridTemplateColumns: "70px 1fr", gap: 12, alignItems: "start" }}>
        <div
          style={{
            width: 62,
            height: 62,
            borderRadius: 20,
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
          <div style={label}>{match.lane} · {fitLabel(match.score)}</div>
          <h3 style={{ fontSize: 22, margin: "6px 0 4px", lineHeight: 1 }}>{name}</h3>
          <p style={{ ...muted, margin: 0, fontSize: 13 }}>
            {profile.company ? `${profile.company} · ` : ""}Based in {state}
          </p>
        </div>
      </div>

      <section
        style={{
          border: "1px solid rgba(232,196,107,.18)",
          borderRadius: 16,
          padding: 11,
          marginTop: 12,
          background: "rgba(232,196,107,.045)",
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "54px 1fr", gap: 10, alignItems: "center" }}>
          <div
            style={{
              height: 48,
              borderRadius: 16,
              border: "1px solid rgba(232,196,107,.28)",
              display: "grid",
              placeItems: "center",
              color: "#f8e7b0",
              fontWeight: 1000,
            }}
          >
            {match.score}%
          </div>

          <div>
            <div style={{ ...label, color: "#f8e7b0" }}>Why this member fits</div>
            <p style={{ ...muted, margin: "5px 0 0", fontSize: 13 }}>
              {match.reasons.join(" · ")}
            </p>
          </div>
        </div>

        {match.warnings.length ? (
          <p style={{ color: "#fecaca", margin: "8px 0 0", fontSize: 12, lineHeight: 1.45 }}>
            Warning: {match.warnings.slice(0, 2).join(" · ")}
          </p>
        ) : null}
      </section>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
        <Link href={messageHref} style={button}>Request Intro</Link>
        <Link href="/members" style={ghost}>Open Network</Link>
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

  const ranked = useMemo(() => {
    return members
      .map((profile) => ({
        profile,
        match: scoreMatch(profile, room || {}, lane),
      }))
      .sort((a, b) => b.match.score - a.match.score)
      .slice(0, 6)
      .map((item) => item.profile);
  }, [members, room, lane]);

  const needs = roomNeeds(room || {}, lane);

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
        Suggested members for this room.
      </h2>

      <p style={{ ...muted, fontSize: 15, marginTop: 0 }}>
        VaultForge reads this room, detects needs ({needs.join(", ") || "general network"}), then compares member state coverage, role stack, capabilities, and pressure-solving tags.
      </p>

      {status ? (
        <p style={{ ...muted }}>{status}</p>
      ) : (
        <div className="vf-room-match-grid">
          {ranked.map((profile, index) => (
            <MemberMatchCard
              key={`${profile.email || profile.full_name || "member"}-${index}`}
              profile={profile}
              room={room || {}}
              lane={lane}
              roomId={roomId}
            />
          ))}
        </div>
      )}
    </section>
  );
}
