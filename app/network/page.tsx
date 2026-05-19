"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type MemberProfile = {
  id?: string;
  name?: string;
  company?: string;
  email?: string;
  phone?: string;
  profilePhoto?: string;
  memberType?: string;
  basedState?: string;
  basedCity?: string;
  basedCounty?: string;
  statesOperated?: string[];
  markets?: string[];
  assetClasses?: string[];
  strategies?: string[];
  specialties?: string[];
  needs?: string[];
  canProvide?: string[];
  capitalPosition?: string;
  proofOfFunds?: string;
  fundingRange?: string;
  contactPreference?: string;
  directContact?: string;
  bio?: string;
  updatedAt?: string;
  [key: string]: unknown;
};

const PROFILE_KEYS = ["vaultforge_profile", "vaultforge_member_profile", "vaultforge_clean_profile"];
const MEMBER_DIRECTORY_KEY = "vaultforge_member_directory_v1";
const SAVED_PROFILES_KEY = "vaultforge_saved_member_profiles_v1";

const STATES = ["GA", "TN", "AL", "FL", "NC", "SC", "TX"];

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

function txt(value: unknown, fallback = "") {
  const clean = String(value || "").trim();
  return clean || fallback;
}

function list(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((x) => String(x).trim()).filter(Boolean);
  if (typeof value === "string" && value.trim()) return value.split(",").map((x) => x.trim()).filter(Boolean);
  return [];
}

function profileId(profile: MemberProfile) {
  return txt(profile.id) || txt(profile.email).toLowerCase() || "local_member";
}

function normalizeProfile(profile: MemberProfile): MemberProfile {
  const id = profileId(profile);
  return {
    ...profile,
    id,
    name: txt(profile.name, "VaultForge Member"),
    basedState: txt(profile.basedState, "GA"),
    statesOperated: list(profile.statesOperated).length ? list(profile.statesOperated) : ["GA"],
    markets: list(profile.markets),
    assetClasses: list(profile.assetClasses),
    strategies: list(profile.strategies),
    specialties: list(profile.specialties),
    needs: list(profile.needs),
    canProvide: list(profile.canProvide),
  };
}

function getProfile(): MemberProfile {
  if (!ok()) return {};
  for (const key of PROFILE_KEYS) {
    const found = j<MemberProfile | null>(localStorage.getItem(key), null);
    if (found && typeof found === "object") return normalizeProfile(found);
  }
  return normalizeProfile({
    id: "local_member",
    name: "VaultForge Member",
    basedState: "GA",
    statesOperated: ["GA"],
    memberType: "Investor",
  });
}

function getDirectory(): MemberProfile[] {
  if (!ok()) return [];
  const directory = j<MemberProfile[]>(localStorage.getItem(MEMBER_DIRECTORY_KEY), []);
  const current = getProfile();
  const currentId = profileId(current);
  const merged = [current, ...directory.filter((member) => profileId(member) !== currentId)];
  const seen = new Set<string>();

  return merged
    .map(normalizeProfile)
    .filter((member) => {
      const id = profileId(member);
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
}

function savedIds() {
  if (!ok()) return [];
  return j<string[]>(localStorage.getItem(SAVED_PROFILES_KEY), []);
}

function saveSavedIds(ids: string[]) {
  if (!ok()) return;
  localStorage.setItem(SAVED_PROFILES_KEY, JSON.stringify(Array.from(new Set(ids))));
  window.dispatchEvent(new Event("vaultforge-saved-profiles-change"));
}

/*
  IMPORTANT:
  Network state cards show where the member is FROM / BASED.
  That uses basedState.

  statesOperated is still displayed on the card and later used for routing,
  alerts, deal matching, pain matching, and AI intelligence.
*/
function membersBasedInState(state: string, members: MemberProfile[]) {
  return members.filter((member) => txt(member.basedState, "GA") === state);
}

const page: React.CSSProperties = {
  minHeight: "100vh",
  background: "#05070d",
  color: "#f7f7fb",
  padding: 18,
  fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
};

const wrap: React.CSSProperties = { maxWidth: 1280, margin: "0 auto", paddingBottom: 90 };
const nav: React.CSSProperties = { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 18 };
const brand: React.CSSProperties = { color: "#ffd45a", fontSize: 27, fontWeight: 950, letterSpacing: -1, marginRight: 10 };
const btn: React.CSSProperties = { border: "1px solid rgba(207,216,230,.18)", background: "#171c29", color: "#f7f7fb", borderRadius: 999, padding: "13px 18px", fontWeight: 950, textDecoration: "none", display: "inline-block", cursor: "pointer" };
const goldBtn: React.CSSProperties = { ...btn, border: 0, background: "#ffdc68", color: "#10131a" };
const redBtn: React.CSSProperties = { ...btn, background: "#271016", borderColor: "rgba(255,70,70,.48)", color: "#ffaaaa" };
const hero: React.CSSProperties = { border: "1px solid rgba(245,197,66,.28)", borderRadius: 28, padding: 30, marginBottom: 20, background: "radial-gradient(circle at top right, rgba(245,197,66,.16), transparent 32%), linear-gradient(180deg,#080d19,#050816)" };
const card: React.CSSProperties = { background: "linear-gradient(180deg,#080d19,#050816)", border: "1px solid rgba(245,197,66,.28)", borderRadius: 26, padding: 26, marginBottom: 22 };
const panel: React.CSSProperties = { background: "#121724", border: "1px solid rgba(207,216,230,.16)", borderRadius: 22, padding: 22 };
const activePanel: React.CSSProperties = { ...panel, borderColor: "rgba(255,70,70,.70)", boxShadow: "0 0 26px rgba(255,50,70,.22)" };
const eyebrow: React.CSSProperties = { color: "#ffd45a", textTransform: "uppercase", letterSpacing: 7, fontWeight: 950, fontSize: 15, marginBottom: 12 };
const h1: React.CSSProperties = { fontSize: "clamp(44px,8vw,86px)", lineHeight: 0.9, letterSpacing: -4, margin: "0 0 18px", fontWeight: 950 };
const h2: React.CSSProperties = { fontSize: "clamp(30px,5vw,52px)", lineHeight: 0.95, letterSpacing: -2, margin: "0 0 14px", fontWeight: 950 };
const sub: React.CSSProperties = { color: "#c9d0dc", fontSize: 21, lineHeight: 1.35, margin: 0 };
const muted: React.CSSProperties = { color: "#aeb7c7", margin: "8px 0 0", lineHeight: 1.35 };
const grid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(245px,1fr))", gap: 16 };
const row: React.CSSProperties = { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" };
const photoStyle: React.CSSProperties = { width: "100%", height: 170, objectFit: "cover", borderRadius: 18, border: "1px solid rgba(245,197,66,.25)", marginBottom: 12 };

function Nav({ active }: { active: string }) {
  const item = (href: string, label: string, key: string) => (
    <Link href={href} style={active === key ? goldBtn : btn}>{label}</Link>
  );

  return (
    <nav style={nav}>
      <div style={brand}>VAULTFORGE</div>
      {item("/command", "Command", "command")}
      {item("/deal-rooms", "Deal Rooms", "deals")}
      {item("/deal-create", "Create Deal", "deal-create")}
      {item("/pain-intake", "Pain Intake", "pain-intake")}
      {item("/pain-rooms", "Pain Rooms", "pain")}
      {item("/network", "Network", "network")}
      {item("/messages", "Messages", "messages")}
      {item("/profile", "Profile", "profile")}
      <Link href="/logout" style={redBtn}>Logout</Link>
    </nav>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={card}>
      <div style={eyebrow}>{title}</div>
      {children}
    </section>
  );
}

function StateCard({
  state,
  count,
  active,
  savedCount,
  onClick,
}: {
  state: string;
  count: number;
  active: boolean;
  savedCount: number;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} style={active ? activePanel : panel}>
      <div style={eyebrow}>{state}</div>
      <h2 style={h2}>{count}</h2>
      <p style={muted}>member profile(s) based here</p>
      <p style={muted}>{savedCount} saved profile(s)</p>
    </button>
  );
}

function MemberCard({
  member,
  saved,
  onSave,
  onUnsave,
}: {
  member: MemberProfile;
  saved: boolean;
  onSave: () => void;
  onUnsave: () => void;
}) {
  const canProvide = list(member.canProvide);
  const needs = list(member.needs);
  const strategies = list(member.strategies);
  const assets = list(member.assetClasses);
  const markets = list(member.markets);
  const operates = list(member.statesOperated);

  return (
    <div style={saved ? activePanel : panel}>
      {txt(member.profilePhoto) ? <img src={txt(member.profilePhoto)} alt={txt(member.name, "Member")} style={photoStyle} /> : null}

      <div style={eyebrow}>{txt(member.memberType, "Member")} • From {txt(member.basedState, "N/A")}</div>
      <h2 style={h2}>{txt(member.name, "VaultForge Member")}</h2>
      <p style={sub}>{txt(member.company, "Company not listed")}</p>

      <p style={muted}>Profile state: {[txt(member.basedCity), txt(member.basedCounty), txt(member.basedState)].filter(Boolean).join(", ") || "Not listed"}</p>
      <p style={muted}>Operates in: {operates.join(", ") || "No operating states selected"}</p>
      <p style={muted}>Markets: {markets.join(", ") || "Not listed"}</p>
      <p style={muted}>Assets: {assets.join(", ") || "Not listed"}</p>
      <p style={muted}>Strategies: {strategies.join(", ") || "Not listed"}</p>
      <p style={muted}>Can provide: {canProvide.join(", ") || "Not listed"}</p>
      <p style={muted}>Needs: {needs.join(", ") || "Not listed"}</p>
      <p style={muted}>Capital: {txt(member.capitalPosition, "Unknown")} • Proof: {txt(member.proofOfFunds, "Unknown")} • Range: {txt(member.fundingRange, "Unknown")}</p>

      <div style={{ ...row, marginTop: 18 }}>
        <Link
          href={`/messages?to=${encodeURIComponent(txt(member.email, profileId(member)))}&subject=${encodeURIComponent("Network Contact: " + txt(member.name, "VaultForge Member"))}`}
          style={goldBtn}
        >
          Contact
        </Link>
        {saved ? (
          <button type="button" style={redBtn} onClick={onUnsave}>Unsave Profile</button>
        ) : (
          <button type="button" style={btn} onClick={onSave}>Save Profile</button>
        )}
        <Link href="/profile" style={btn}>My Profile</Link>
      </div>
    </div>
  );
}

export default function NetworkPage() {
  const [tick, setTick] = useState(0);
  const [openState, setOpenState] = useState("GA");
  const [showSaved, setShowSaved] = useState(false);

  useEffect(() => {
    const refresh = () => setTick((x) => x + 1);
    window.addEventListener("storage", refresh);
    window.addEventListener("vaultforge-network-change", refresh);
    window.addEventListener("vaultforge-profile-change", refresh);
    window.addEventListener("vaultforge-saved-profiles-change", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("vaultforge-network-change", refresh);
      window.removeEventListener("vaultforge-profile-change", refresh);
      window.removeEventListener("vaultforge-saved-profiles-change", refresh);
    };
  }, []);

  const members = useMemo(() => getDirectory(), [tick]);
  const saved = useMemo(() => savedIds(), [tick]);
  const openMembers = useMemo(() => membersBasedInState(openState, members), [openState, members]);
  const savedMembers = useMemo(() => members.filter((member) => saved.includes(profileId(member))), [members, saved]);

  function saveMember(member: MemberProfile) {
    saveSavedIds([...saved, profileId(member)]);
    setTick((x) => x + 1);
  }

  function unsaveMember(member: MemberProfile) {
    saveSavedIds(saved.filter((id) => id !== profileId(member)));
    setTick((x) => x + 1);
  }

  return (
    <main style={page}>
      <div style={wrap}>
        <Nav active="network" />

        <section style={hero}>
          <div style={eyebrow}>Network</div>
          <h1 style={h1}>State member network.</h1>
          <p style={sub}>Click a state to show only member profiles based in that state. Operating states stay on the card for routing and deal/pain matching.</p>
          <div style={{ ...row, marginTop: 22 }}>
            <button type="button" style={!showSaved ? goldBtn : btn} onClick={() => setShowSaved(false)}>State Members</button>
            <button type="button" style={showSaved ? goldBtn : btn} onClick={() => setShowSaved(true)}>Saved Profiles ({savedMembers.length})</button>
          </div>
        </section>

        {!showSaved ? (
          <>
            <Section title="State Buttons">
              <div style={grid}>
                {STATES.map((state) => {
                  const stateMembers = membersBasedInState(state, members);
                  const stateSaved = stateMembers.filter((member) => saved.includes(profileId(member))).length;

                  return (
                    <StateCard
                      key={state}
                      state={state}
                      count={stateMembers.length}
                      savedCount={stateSaved}
                      active={openState === state}
                      onClick={() => setOpenState(state)}
                    />
                  );
                })}
              </div>
            </Section>

            <Section title={`${openState} Based Members`}>
              {openMembers.length ? (
                <div style={grid}>
                  {openMembers.map((member) => (
                    <MemberCard
                      key={profileId(member)}
                      member={member}
                      saved={saved.includes(profileId(member))}
                      onSave={() => saveMember(member)}
                      onUnsave={() => unsaveMember(member)}
                    />
                  ))}
                </div>
              ) : (
                <p style={sub}>No member profiles based in {openState} yet.</p>
              )}
            </Section>
          </>
        ) : (
          <Section title="Saved Profiles">
            {savedMembers.length ? (
              <div style={grid}>
                {savedMembers.map((member) => (
                  <MemberCard
                    key={profileId(member)}
                    member={member}
                    saved
                    onSave={() => saveMember(member)}
                    onUnsave={() => unsaveMember(member)}
                  />
                ))}
              </div>
            ) : (
              <p style={sub}>No saved profiles yet.</p>
            )}
          </Section>
        )}
      </div>
    </main>
  );
}
