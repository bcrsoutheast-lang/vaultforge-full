"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type MemberProfile = Record<string, any>;
type Signal = Record<string, any>;

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

  const email = cleanEmail(row.email || row.member_email || row.user_email || intelligence.email || intelligence.member_email);

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

function signalTitle(signal: Signal, signalId: string) {
  return clean(signal.title || signal.signal_title || signal.headline || signal.name || signal.pain_label || `Signal ${signalId}`);
}

function signalState(signal: Signal) {
  const market = clean(signal.market || signal.location);
  const direct = clean(signal.state || signal.market_state || signal.property_state || signal.operating_state);
  if (direct) return direct;

  const parts = market.split(",").map((part) => part.trim()).filter(Boolean);
  return parts.length > 1 ? parts[parts.length - 1] : "";
}

function signalText(signal: Signal) {
  return [
    signal.title,
    signal.signal_title,
    signal.headline,
    signal.note,
    signal.notes,
    signal.summary,
    signal.description,
    signal.message,
    signal.route_summary,
    signal.priority,
    signal.urgency,
    signal.asset_type,
    signal.property_type,
    signal.strategy,
    signal.market,
    signal.state,
  ]
    .map(clean)
    .join(" ")
    .toLowerCase();
}

function memberLane(profile: MemberProfile) {
  const roles = profile.roles || [];
  const capabilities = profile.capabilities || [];
  const pressure = profile.pressure_solutions || [];

  if (roles.includes("Lender") || roles.includes("Private Money") || roles.includes("Capital Partner") || capabilities.includes("Private Lending") || capabilities.includes("Hard Money")) return "Capital";
  if (roles.includes("Contractor") || roles.includes("Operator") || capabilities.includes("Contractor Crew") || capabilities.includes("Full Rehab")) return "Execution";
  if (roles.includes("Buyer") || roles.includes("Investor")) return "Buyer";
  if (pressure.length) return "Pressure";
  return "Network";
}

function scoreSignal(profile: MemberProfile, signal: Signal) {
  const text = signalText(signal);
  const state = signalState(signal);
  const roles = profile.roles || [];
  const states = profile.states_operated || [];
  const capabilities = profile.capabilities || [];
  const pressure = profile.pressure_solutions || [];
  const strategies = profile.strategies || [];
  const buyBox = profile.buy_box || [];

  let score = 0;
  const reasons: string[] = [];
  const warnings: string[] = [];

  if (state && states.includes(state)) {
    score += 24;
    reasons.push(`operates in ${state}`);
  } else if (state && states.length) {
    warnings.push(`does not list ${state}`);
  }

  if ((text.includes("capital") || text.includes("fund") || text.includes("lender") || text.includes("loan")) && (roles.includes("Lender") || roles.includes("Private Money") || capabilities.includes("Private Lending") || capabilities.includes("Hard Money"))) {
    score += 24;
    reasons.push("capital signal fit");
  }

  if ((text.includes("buyer") || text.includes("exit") || text.includes("disposition")) && (roles.includes("Buyer") || roles.includes("Investor"))) {
    score += 22;
    reasons.push("buyer signal fit");
  }

  if ((text.includes("contractor") || text.includes("operator") || text.includes("rehab") || text.includes("construction")) && (roles.includes("Contractor") || roles.includes("Operator") || capabilities.includes("Contractor Crew") || capabilities.includes("Full Rehab"))) {
    score += 22;
    reasons.push("execution signal fit");
  }

  if ((text.includes("foreclosure") || text.includes("title") || text.includes("probate") || text.includes("tenant") || text.includes("permit") || text.includes("city")) && pressure.length) {
    score += 20;
    reasons.push(`pressure fit: ${pressure.slice(0, 2).join(", ")}`);
  }

  if (text.includes("residential") && buyBox.includes("Residential")) {
    score += 7;
    reasons.push("residential fit");
  }

  if (text.includes("commercial") && buyBox.includes("Commercial")) {
    score += 7;
    reasons.push("commercial fit");
  }

  if (text.includes("land") && buyBox.includes("Land")) {
    score += 7;
    reasons.push("land fit");
  }

  if ((text.includes("distress") || text.includes("urgent")) && (strategies.includes("Distressed") || pressure.length)) {
    score += 9;
    reasons.push("distress/urgency fit");
  }

  if (!reasons.length) reasons.push("limited signal/profile overlap");
  if (!roles.length) warnings.push("role stack missing");
  if (!states.length) warnings.push("operating states missing");

  return {
    score: Math.min(100, score),
    lane: memberLane(profile),
    reasons,
    warnings,
  };
}

function chooseStack(members: MemberProfile[], signal: Signal) {
  const ranked = members
    .map((profile) => ({ profile, match: scoreSignal(profile, signal) }))
    .sort((a, b) => b.match.score - a.match.score);

  const used = new Set<string>();

  const takeLane = (lane: string) => {
    const item = ranked.find((entry) => entry.match.lane === lane && !used.has(cleanEmail(entry.profile.email || entry.profile.full_name)));
    if (!item) return null;
    used.add(cleanEmail(item.profile.email || item.profile.full_name));
    return item;
  };

  const primary = ranked[0] || null;
  if (primary) used.add(cleanEmail(primary.profile.email || primary.profile.full_name));

  const slots = [
    { slot: "Primary Signal Match", item: primary },
    { slot: "Execution Fit", item: takeLane("Execution") },
    { slot: "Capital Fit", item: takeLane("Capital") },
    { slot: "Buyer Fit", item: takeLane("Buyer") },
    { slot: "Pressure Specialist", item: takeLane("Pressure") },
  ].filter((slot) => slot.item);

  const overflow = ranked.filter((entry) => !used.has(cleanEmail(entry.profile.email || entry.profile.full_name)));

  return { ranked, slots, overflow };
}

const shell: React.CSSProperties = {
  border: "1px solid rgba(86,216,255,.24)",
  borderRadius: 26,
  padding: 18,
  background: "linear-gradient(145deg,rgba(86,216,255,.065),rgba(255,255,255,.025))",
  marginTop: 16,
  marginBottom: 16,
};

const label: React.CSSProperties = {
  color: "#56d8ff",
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
  background: "linear-gradient(135deg,#8fe8ff,#56d8ff)",
  color: "#031118",
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

function SignalMatchCard({
  slot,
  profile,
  match,
  signal,
  signalId,
}: {
  slot: string;
  profile: MemberProfile;
  match: ReturnType<typeof scoreSignal>;
  signal: Signal;
  signalId: string;
}) {
  const name = clean(profile.full_name) || clean(profile.email) || "VaultForge Member";
  const email = clean(profile.email);
  const title = signalTitle(signal, signalId);
  const reason = `${match.lane} · ${match.score}% · ${match.reasons.slice(0, 3).join(" · ")}`;

  const messageHref =
    `/messages/new?to=${encodeURIComponent(email)}` +
    `&subject=${encodeURIComponent(title)}` +
    `&room_title=${encodeURIComponent(title)}` +
    `&title=${encodeURIComponent(title)}` +
    `&room_type=${encodeURIComponent("Signal Room")}` +
    `&room_id=${encodeURIComponent(signalId)}` +
    `&signal_id=${encodeURIComponent(signalId)}` +
    `&source=${encodeURIComponent("signal-room")}` +
    `&type=${encodeURIComponent("signal")}` +
    `&folder=${encodeURIComponent("signals")}` +
    `&source_route=${encodeURIComponent(`/signals/${signalId}`)}` +
    `&match_reason=${encodeURIComponent(reason)}`;

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
            border: "1px solid rgba(86,216,255,.30)",
            display: "grid",
            placeItems: "center",
            overflow: "hidden",
            color: "#a7ecff",
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
            {match.lane} · {match.reasons.slice(0, 3).join(" · ")}
          </p>
        </div>

        <div
          style={{
            width: 50,
            height: 48,
            borderRadius: 16,
            border: "1px solid rgba(86,216,255,.28)",
            display: "grid",
            placeItems: "center",
            color: "#a7ecff",
            fontWeight: 1000,
            background: "rgba(86,216,255,.06)",
          }}
        >
          {match.score}%
        </div>
      </div>

      {match.warnings.length ? (
        <p style={{ color: "#fecaca", margin: "8px 0 0", fontSize: 12, lineHeight: 1.45 }}>
          Check: {match.warnings.slice(0, 2).join(" · ")}
        </p>
      ) : null}

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 11 }}>
        <Link href={messageHref} style={button}>Route Intro</Link>
        <Link href="/members" style={ghost}>Network</Link>
      </div>
    </article>
  );
}

export default function VaultForgeSignalCommandStack({
  signal = {},
  signalId = "",
}: {
  signal?: Signal | null;
  signalId?: string;
}) {
  const [members, setMembers] = useState<MemberProfile[]>([]);
  const [status, setStatus] = useState("Loading signal matches...");
  const safeSignal = signal || {};

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
        setStatus(finalMembers.length ? "" : "No member profiles found yet. Fill out Profile to power signal matches.");
      } catch {
        setMembers(local);
        setStatus(local.length ? "" : "No member profiles found yet. Fill out Profile to power signal matches.");
      }
    }

    loadMembers();
  }, []);

  const stack = useMemo(() => chooseStack(members, safeSignal), [members, safeSignal]);
  const hiddenCount = Math.max(0, stack.overflow.length);
  const avgScore = stack.slots.length
    ? Math.round(stack.slots.reduce((sum, slot) => sum + (slot.item?.match.score || 0), 0) / stack.slots.length)
    : 0;

  return (
    <section style={shell}>
      <style>{`
        .vf-signal-match-grid {
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
          .vf-signal-match-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      <div style={label}>Signal Intelligence Command Stack</div>
      <h2 style={{ fontSize: "clamp(30px,5vw,50px)", lineHeight: 0.95, letterSpacing: "-.045em", margin: "8px 0 10px" }}>
        Signal routing intelligence.
      </h2>

      <p style={{ ...muted, fontSize: 15, marginTop: 0 }}>
        Signal Rooms now inherit the same member matching hierarchy as Opportunity and Pressure Rooms.
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
        <span style={{ border: "1px solid rgba(157,243,191,.24)", borderRadius: 999, padding: "7px 10px", color: "#9df3bf", fontWeight: 900 }}>
          {stack.slots.length} visible matches
        </span>
        <span style={{ border: "1px solid rgba(86,216,255,.24)", borderRadius: 999, padding: "7px 10px", color: "#56d8ff", fontWeight: 900 }}>
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
          <div className="vf-signal-match-grid">
            {stack.slots.map((slot) => (
              <SignalMatchCard
                key={`${slot.slot}-${slot.item?.profile.email || slot.item?.profile.full_name}`}
                slot={slot.slot}
                profile={slot.item!.profile}
                match={slot.item!.match}
                signal={safeSignal}
                signalId={signalId}
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
              <div style={label}>Signal Overflow Hidden</div>
              <p style={{ ...muted, margin: "7px 0 0", fontSize: 14 }}>
                {hiddenCount} additional compatible member{hiddenCount === 1 ? "" : "s"} were not shown to keep this signal room clean.
              </p>
              <Link href="/members" style={{ ...ghost, marginTop: 10 }}>Open Full Network</Link>
            </section>
          ) : null}
        </>
      )}
    </section>
  );
}
