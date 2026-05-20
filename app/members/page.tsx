"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type MemberProfile = {
  id?: string;
  name?: string;
  company?: string;
  email?: string;
  phone?: string;
  title?: string;
  memberType?: string;
  basedState?: string;
  basedCity?: string;
  basedCounty?: string;
  statesOperated?: string[] | string;
  countiesServed?: string[] | string;
  assetClasses?: string[] | string;
  strategies?: string[] | string;
  specialties?: string[] | string;
  canProvide?: string[] | string;
  needs?: string[] | string;
  fundingRange?: string;
  capitalPosition?: string;
  buyBox?: string[] | string;
  priceRange?: string;
  dealSize?: string;
  responseSpeed?: string;
  verifiedStatus?: string;
  contactPreference?: string;
  bio?: string;
  profilePhoto?: string;
  companyLogo?: string;
  photoUrl?: string;
  avatar?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
};

const STATES = ["GA", "TN", "AL", "FL", "NC", "SC", "TX"];
const PROFILE_KEYS = ["vaultforge_profile", "vaultforge_member_profile", "vaultforge_clean_profile"];
const DIRECTORY_KEY = "vaultforge_member_directory_v1";
const SAVED_KEY = "vaultforge_saved_member_profiles_v1";

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

function memberId(member: MemberProfile) {
  return txt(member.id) || txt(member.email).toLowerCase() || txt(member.name).toLowerCase().replace(/\s+/g, "_") || "local_member";
}

function normalize(member: MemberProfile): MemberProfile {
  const id = memberId(member);
  return {
    ...member,
    id,
    name: txt(member.name || member.fullName || member.full_name, "VaultForge Member"),
    company: txt(member.company || member.companyName, ""),
    email: txt(member.email, ""),
    phone: txt(member.phone || member.phoneNumber, ""),
    title: txt(member.title || member.roleTitle, ""),
    memberType: txt(member.memberType || member.member_type, "Investor"),
    basedState: txt(member.basedState || member.state || member.homeState, "GA"),
    basedCity: txt(member.basedCity || member.city, ""),
    basedCounty: txt(member.basedCounty || member.county, ""),
    statesOperated: list(member.statesOperated || member.states_served || member.operatingStates).length ? list(member.statesOperated || member.states_served || member.operatingStates) : ["GA"],
    countiesServed: list(member.countiesServed || member.counties_served),
    assetClasses: list(member.assetClasses || member.asset_classes),
    strategies: list(member.strategies),
    specialties: list(member.specialties),
    canProvide: list(member.canProvide || member.provides),
    needs: list(member.needs),
    fundingRange: txt(member.fundingRange || member.capitalRange, "Not listed"),
    capitalPosition: txt(member.capitalPosition, "Not listed"),
    buyBox: list(member.buyBox || member.buy_box),
    priceRange: txt(member.priceRange, ""),
    dealSize: txt(member.dealSize, "Not listed"),
    responseSpeed: txt(member.responseSpeed, "24 Hours"),
    verifiedStatus: txt(member.verifiedStatus, "Unverified"),
    contactPreference: txt(member.contactPreference, "VaultForge Message"),
    bio: txt(member.bio || member.about, ""),
    profilePhoto: txt(member.profilePhoto || member.photoUrl || member.avatar, ""),
    companyLogo: txt(member.companyLogo || member.logoUrl, ""),
    createdAt: txt(member.createdAt, new Date().toISOString()),
    updatedAt: txt(member.updatedAt, new Date().toISOString()),
  };
}

function readCurrentProfile() {
  if (!ok()) return null as MemberProfile | null;
  for (const key of PROFILE_KEYS) {
    const found = j<MemberProfile | null>(localStorage.getItem(key), null);
    if (found && typeof found === "object") return normalize(found);
  }
  return null;
}

function readDirectory() {
  if (!ok()) return [] as MemberProfile[];
  const directory = j<MemberProfile[]>(localStorage.getItem(DIRECTORY_KEY), []).map(normalize);
  const current = readCurrentProfile();
  const merged = current ? [current, ...directory] : directory;
  const seen = new Set<string>();

  return merged.filter((member) => {
    const id = memberId(member);
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

function savedIds() {
  return ok() ? j<string[]>(localStorage.getItem(SAVED_KEY), []) : [];
}

function setSavedIds(ids: string[]) {
  writeJson(SAVED_KEY, Array.from(new Set(ids)));
  window.dispatchEvent(new Event("vaultforge-member-change"));
}

const styleTag = `
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
const pulseGold: React.CSSProperties = { ...panel, borderColor: "rgba(255,220,104,.70)", animation: "vfPulseGold 2.3s ease-in-out infinite" };
const eyebrow: React.CSSProperties = { color: "#ffd45a", textTransform: "uppercase", letterSpacing: 7, fontWeight: 950, fontSize: 15, marginBottom: 12 };
const h1: React.CSSProperties = { fontSize: "clamp(44px,8vw,86px)", lineHeight: 0.9, letterSpacing: -4, margin: "0 0 18px", fontWeight: 950 };
const h2: React.CSSProperties = { fontSize: "clamp(30px,5vw,52px)", lineHeight: 0.95, letterSpacing: -2, margin: "0 0 14px", fontWeight: 950 };
const sub: React.CSSProperties = { color: "#c9d0dc", fontSize: 21, lineHeight: 1.35, margin: 0 };
const muted: React.CSSProperties = { color: "#aeb7c7", margin: "8px 0 0", lineHeight: 1.35 };
const grid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(245px,1fr))", gap: 16 };
const row: React.CSSProperties = { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" };
const img: React.CSSProperties = { width: "100%", height: 170, objectFit: "cover", borderRadius: 18, border: "1px solid rgba(245,197,66,.25)", marginBottom: 12 };

function Nav() {
  return (
    <nav style={nav}>
      <div style={brand}>VAULTFORGE</div>
      <Link href="/command" style={btn}>Command</Link>
      <Link href="/my-rooms" style={btn}>My Rooms</Link>
      <Link href="/members" style={goldBtn}>Members</Link>
      <Link href="/network" style={btn}>Network</Link>
      <Link href="/state-map" style={btn}>State Map</Link>
      <Link href="/alerts" style={btn}>Alerts</Link>
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

function MemberCard({ member, saved, onSave }: { member: MemberProfile; saved: boolean; onSave: () => void }) {
  const photo = txt(member.profilePhoto || member.companyLogo);
  const id = memberId(member);
  const subject = encodeURIComponent(`Member Contact: ${txt(member.name, "VaultForge Member")}`);

  return (
    <div style={saved ? activePanel : panel}>
      {photo ? <img src={photo} alt={txt(member.name)} style={img} /> : null}
      <div style={eyebrow}>{txt(member.memberType, "Member")} • {txt(member.verifiedStatus, "Unverified")}</div>
      <h2 style={h2}>{txt(member.name, "VaultForge Member")}</h2>
      <p style={sub}>{txt(member.company, "Company not listed")}</p>
      <p style={muted}>Based {txt(member.basedCity, "City not listed")}, {txt(member.basedState, "GA")} • Serves {list(member.statesOperated).join(", ") || "Not listed"}</p>
      <p style={muted}>Provides: {list(member.canProvide).join(", ") || "Not listed"}</p>
      <p style={muted}>Needs: {list(member.needs).join(", ") || "Not listed"}</p>
      <p style={muted}>Assets: {list(member.assetClasses).join(", ") || "Not listed"} • Strategies: {list(member.strategies).join(", ") || "Not listed"}</p>
      <p style={muted}>Funding: {txt(member.fundingRange, "Not listed")} • Response: {txt(member.responseSpeed, "Not listed")}</p>
      {txt(member.bio) ? <p style={muted}>{txt(member.bio)}</p> : null}

      <div style={{ ...row, marginTop: 16 }}>
        <Link href={`/messages?type=member&to=${encodeURIComponent(txt(member.email || id))}&subject=${subject}`} style={goldBtn}>Contact</Link>
        <button type="button" style={saved ? goldBtn : btn} onClick={onSave}>{saved ? "Saved" : "Save Profile"}</button>
        {txt(member.email) ? <a href={`mailto:${txt(member.email)}`} style={btn}>Email</a> : null}
        {txt(member.phone) ? <a href={`tel:${txt(member.phone)}`} style={btn}>Call</a> : null}
      </div>
    </div>
  );
}

export default function MembersPage() {
  const [tick, setTick] = useState(0);
  const [openState, setOpenState] = useState("GA");
  const [showSaved, setShowSaved] = useState(false);

  useEffect(() => {
    const refresh = () => setTick((value) => value + 1);
    window.addEventListener("storage", refresh);
    window.addEventListener("vaultforge-profile-change", refresh);
    window.addEventListener("vaultforge-member-change", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("vaultforge-profile-change", refresh);
      window.removeEventListener("vaultforge-member-change", refresh);
    };
  }, []);

  const members = useMemo(() => readDirectory(), [tick]);
  const saved = useMemo(() => savedIds(), [tick]);
  const savedMembers = useMemo(() => members.filter((member) => saved.includes(memberId(member))), [members, saved]);

  const stateMembers = useMemo(() => {
    if (showSaved) return savedMembers;
    return members.filter((member) => txt(member.basedState, "GA") === openState);
  }, [members, openState, showSaved, savedMembers]);

  const stateCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const state of STATES) counts[state] = members.filter((member) => txt(member.basedState, "GA") === state).length;
    return counts;
  }, [members]);

  function toggleSave(member: MemberProfile) {
    const id = memberId(member);
    const current = savedIds();
    const next = current.includes(id) ? current.filter((item) => item !== id) : [id, ...current];
    setSavedIds(next);
    setTick((value) => value + 1);
  }

  return (
    <main style={page}>
      <style>{styleTag}</style>
      <div style={wrap}>
        <Nav />

        <section style={hero}>
          <div style={eyebrow}>Members</div>
          <h1 style={h1}>Member directory by home base.</h1>
          <p style={sub}>Click a state to show only profiles based in that state. States served stay on each profile for routing and network matching.</p>
          <div style={{ ...row, marginTop: 18 }}>
            <Link href="/profile" style={goldBtn}>Edit My Profile</Link>
            <Link href="/network" style={btn}>Open Network</Link>
            <button type="button" style={showSaved ? goldBtn : btn} onClick={() => setShowSaved(!showSaved)}>Saved Profiles ({savedMembers.length})</button>
          </div>
        </section>

        <Section title="Member State Cards">
          <div style={grid}>
            {STATES.map((state) => (
              <button
                key={state}
                type="button"
                style={!showSaved && openState === state ? pulseGold : panel}
                onClick={() => {
                  setShowSaved(false);
                  setOpenState(state);
                }}
              >
                <div style={eyebrow}>{state}</div>
                <h2 style={h2}>{stateCounts[state] || 0}</h2>
                <p style={muted}>member profile(s) based here</p>
              </button>
            ))}
          </div>
        </Section>

        <Section title={showSaved ? "Saved Member Profiles" : `${openState} Member Profiles`}>
          {stateMembers.length ? (
            <div style={grid}>
              {stateMembers.map((member) => (
                <MemberCard
                  key={memberId(member)}
                  member={member}
                  saved={saved.includes(memberId(member))}
                  onSave={() => toggleSave(member)}
                />
              ))}
            </div>
          ) : (
            <div style={panel}>
              <h2 style={h2}>No profiles yet.</h2>
              <p style={sub}>{showSaved ? "No saved profiles." : `No members based in ${openState}. Save your Profile to populate this directory.`}</p>
              <div style={{ ...row, marginTop: 16 }}>
                <Link href="/profile" style={goldBtn}>Create / Edit Profile</Link>
              </div>
            </div>
          )}
        </Section>

        <Section title="Directory Rules">
          <div style={grid}>
            <div style={panel}>
              <div style={eyebrow}>Members</div>
              <p style={sub}>Filtered by based state.</p>
              <p style={muted}>This is where the member is from.</p>
            </div>
            <div style={panel}>
              <div style={eyebrow}>Network</div>
              <p style={sub}>Uses states served, deal rooms, and pain rooms.</p>
              <p style={muted}>This is where the member can operate.</p>
            </div>
            <div style={panel}>
              <div style={eyebrow}>Matching</div>
              <p style={sub}>Rooms use profile tags.</p>
              <p style={muted}>Can Provide, Needs, Strategy, Assets, and States Served power fit scores.</p>
            </div>
          </div>
        </Section>
      </div>
    </main>
  );
}
