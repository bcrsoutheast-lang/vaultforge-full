"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type MemberProfile = {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  title: string;
  memberType: string;
  basedState: string;
  basedCity: string;
  basedCounty: string;
  statesOperated: string[];
  countiesServed: string[];
  assetClasses: string[];
  strategies: string[];
  specialties: string[];
  canProvide: string[];
  needs: string[];
  fundingRange: string;
  capitalPosition: string;
  buyBox: string[];
  priceRange: string;
  dealSize: string;
  responseSpeed: string;
  verifiedStatus: string;
  contactPreference: string;
  bio: string;
  profilePhoto: string;
  companyLogo: string;
  createdAt: string;
  updatedAt: string;
};

const PROFILE_KEYS = ["vaultforge_profile", "vaultforge_member_profile", "vaultforge_clean_profile"];
const DIRECTORY_KEY = "vaultforge_member_directory_v1";
const PROFILE_PHOTO_BACKUP_KEY = "vaultforge_member_profile_photo_v1";
const COMPANY_LOGO_BACKUP_KEY = "vaultforge_member_company_logo_v1";

const STATES = ["GA", "TN", "AL", "FL", "NC", "SC", "TX"];
const MEMBER_TYPES = ["Investor", "Cash Buyer", "Private Lender", "Hard Money Lender", "Contractor", "Developer", "Wholesaler", "Realtor", "Attorney", "Title", "Property Manager", "Operator", "Insurance", "City / Permit", "Other"];
const ASSET_CLASSES = ["Residential", "Commercial", "Land", "Multifamily", "Industrial", "Retail", "Office", "Storage", "Hotel", "Mobile Home", "Mixed Use"];
const STRATEGIES = ["Wholesale", "Flip", "Buy & Hold", "BRRRR", "Development", "Seller Finance", "JV", "Rental", "Airbnb", "Note / Debt", "Ground Up", "Value Add"];
const SPECIALTIES = ["Distress", "Foreclosure", "Probate", "Fire Damage", "Title Issues", "Permits", "City Violations", "Funding Gap", "Tenant Issues", "Stalled Construction", "Off Market", "Fast Close", "Heavy Rehab", "Land Entitlement"];
const PROVIDE = ["Capital", "Lending", "Buying", "Contractor", "Legal", "Title", "Insurance", "Property Management", "Development", "Disposition", "Operations", "City Expediting", "Deal Review", "Introductions"];
const NEEDS = ["Deals", "Capital", "Lender", "Contractor", "Buyer", "Attorney", "Title", "Private Capital", "Property Manager", "City Expeditor", "Operator", "Developer", "Insurance Adjuster"];
const FUNDING = ["Not listed", "Under $100k", "$100k-$250k", "$250k-$500k", "$500k-$1M", "$1M-$5M", "$5M+"];
const DEAL_SIZE = ["Not listed", "Small", "Mid", "Large", "Institutional"];
const RESPONSE = ["Same Day", "24 Hours", "48 Hours", "Weekly", "By Intro Only"];
const CONTACT = ["VaultForge Message", "Phone", "Text", "Email", "Contact Form"];
const VERIFIED = ["Unverified", "VaultForge Reviewed", "Verified Capital", "Verified Operator", "Preferred Partner"];

const CITY_COUNTY: Record<string, string> = {
  atlanta: "Fulton",
  alpharetta: "Fulton",
  roswell: "Fulton",
  marietta: "Cobb",
  smyrna: "Cobb",
  kennesaw: "Cobb",
  cartersville: "Bartow",
  cville: "Bartow",
  cvile: "Bartow",
  adairsville: "Bartow",
  rome: "Floyd",
  gainesville: "Hall",
  savannah: "Chatham",
  augusta: "Richmond",
  columbus: "Muscogee",
  macon: "Bibb",
  chattanooga: "Hamilton",
  nashville: "Davidson",
  knoxville: "Knox",
  birmingham: "Jefferson",
  huntsville: "Madison",
  charlotte: "Mecklenburg",
  raleigh: "Wake",
  greenville: "Greenville",
  charleston: "Charleston",
  dallas: "Dallas",
  houston: "Harris",
  austin: "Travis",
  "san antonio": "Bexar",
  sanantonio: "Bexar",
};

function ok() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
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

function countyFromCity(city: string) {
  return CITY_COUNTY[city.trim().toLowerCase().replace(/\s+/g, " ")] || "";
}

function defaultProfile(): MemberProfile {
  const now = new Date().toISOString();
  return {
    id: "local_member",
    name: "",
    company: "",
    email: "",
    phone: "",
    title: "",
    memberType: "Investor",
    basedState: "GA",
    basedCity: "",
    basedCounty: "",
    statesOperated: ["GA"],
    countiesServed: [],
    assetClasses: ["Residential"],
    strategies: ["Wholesale"],
    specialties: [],
    canProvide: ["Buying"],
    needs: ["Deals"],
    fundingRange: "Not listed",
    capitalPosition: "Not listed",
    buyBox: [],
    priceRange: "",
    dealSize: "Not listed",
    responseSpeed: "24 Hours",
    verifiedStatus: "Unverified",
    contactPreference: "VaultForge Message",
    bio: "",
    profilePhoto: "",
    companyLogo: "",
    createdAt: now,
    updatedAt: now,
  };
}

function normalizeProfile(row: any): MemberProfile {
  const base = defaultProfile();
  const email = txt(row?.email || base.email);
  const id = txt(row?.id || email.toLowerCase() || "local_member");
  return {
    ...base,
    ...row,
    id,
    name: txt(row?.name || row?.fullName || row?.full_name, base.name),
    company: txt(row?.company || row?.companyName, base.company),
    email,
    phone: txt(row?.phone || row?.phoneNumber, base.phone),
    title: txt(row?.title || row?.roleTitle, base.title),
    memberType: txt(row?.memberType || row?.member_type, base.memberType),
    basedState: txt(row?.basedState || row?.state || row?.homeState, base.basedState),
    basedCity: txt(row?.basedCity || row?.city, base.basedCity),
    basedCounty: txt(row?.basedCounty || row?.county, base.basedCounty),
    statesOperated: list(row?.statesOperated || row?.states_served || row?.operatingStates).length ? list(row?.statesOperated || row?.states_served || row?.operatingStates) : base.statesOperated,
    countiesServed: list(row?.countiesServed || row?.counties_served),
    assetClasses: list(row?.assetClasses || row?.asset_classes).length ? list(row?.assetClasses || row?.asset_classes) : base.assetClasses,
    strategies: list(row?.strategies).length ? list(row?.strategies) : base.strategies,
    specialties: list(row?.specialties),
    canProvide: list(row?.canProvide || row?.provides).length ? list(row?.canProvide || row?.provides) : base.canProvide,
    needs: list(row?.needs).length ? list(row?.needs) : base.needs,
    fundingRange: txt(row?.fundingRange || row?.capitalRange, base.fundingRange),
    capitalPosition: txt(row?.capitalPosition, base.capitalPosition),
    buyBox: list(row?.buyBox || row?.buy_box),
    priceRange: txt(row?.priceRange, base.priceRange),
    dealSize: txt(row?.dealSize, base.dealSize),
    responseSpeed: txt(row?.responseSpeed, base.responseSpeed),
    verifiedStatus: txt(row?.verifiedStatus, base.verifiedStatus),
    contactPreference: txt(row?.contactPreference, base.contactPreference),
    bio: txt(row?.bio || row?.about, base.bio),
    profilePhoto: txt(row?.profilePhoto || row?.photoUrl || row?.avatar, base.profilePhoto),
    companyLogo: txt(row?.companyLogo || row?.logoUrl, base.companyLogo),
    createdAt: txt(row?.createdAt, base.createdAt),
    updatedAt: txt(row?.updatedAt, base.updatedAt),
  };
}

function readProfile() {
  if (!ok()) return defaultProfile();

  const backupPhoto = txt(localStorage.getItem(PROFILE_PHOTO_BACKUP_KEY));
  const backupLogo = txt(localStorage.getItem(COMPANY_LOGO_BACKUP_KEY));

  for (const key of PROFILE_KEYS) {
    const found = j<any | null>(localStorage.getItem(key), null);
    if (found && typeof found === "object") {
      return normalizeProfile({
        ...found,
        profilePhoto: txt(found.profilePhoto || found.photoUrl || found.avatar || backupPhoto),
        companyLogo: txt(found.companyLogo || found.logoUrl || backupLogo),
      });
    }
  }

  return normalizeProfile({
    ...defaultProfile(),
    profilePhoto: backupPhoto,
    companyLogo: backupLogo,
  });
}

function readDirectory() {
  if (!ok()) return [] as MemberProfile[];
  return j<any[]>(localStorage.getItem(DIRECTORY_KEY), []).map(normalizeProfile);
}

function saveProfile(profile: MemberProfile) {
  if (!ok()) return { ok: false, message: "Browser storage unavailable." };

  const now = new Date().toISOString();
  const photo = txt(profile.profilePhoto || localStorage.getItem(PROFILE_PHOTO_BACKUP_KEY));
  const logo = txt(profile.companyLogo || localStorage.getItem(COMPANY_LOGO_BACKUP_KEY));

  if (photo) writeJson(PROFILE_PHOTO_BACKUP_KEY, photo);
  if (logo) writeJson(COMPANY_LOGO_BACKUP_KEY, logo);

  const next = normalizeProfile({
    ...profile,
    profilePhoto: photo,
    companyLogo: logo,
    updatedAt: now,
    createdAt: profile.createdAt || now,
  });

  const directory = readDirectory().filter((member) => member.id !== next.id && member.email !== next.email);

  const slimDirectory = directory.map((member) => ({
    ...member,
    profilePhoto: "",
    companyLogo: "",
  }));

  const slimForDirectory = {
    ...next,
    profilePhoto: photo ? "__vaultforge_member_profile_photo_v1__" : "",
    companyLogo: logo ? "__vaultforge_member_company_logo_v1__" : "",
  };

  let saved = true;

  for (const key of PROFILE_KEYS) {
    saved = writeJson(key, next) && saved;
  }

  saved = writeJson(DIRECTORY_KEY, [slimForDirectory, ...slimDirectory]) && saved;

  if (!saved) {
    const slim = { ...next, profilePhoto: "", companyLogo: "" };
    for (const key of PROFILE_KEYS) writeJson(key, slim);
    writeJson(DIRECTORY_KEY, [slimForDirectory, ...slimDirectory]);
  }

  window.dispatchEvent(new Event("vaultforge-profile-change"));
  window.dispatchEvent(new Event("vaultforge-member-change"));
  window.dispatchEvent(new Event("vaultforge-room-state-change"));
  return { ok: true, message: "Profile saved." };
}

async function compressImage(file: File, maxWidth = 360, quality = 0.28): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onerror = () => resolve("");
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => resolve("");
      img.onload = () => {
        try {
          const scale = Math.min(1, maxWidth / img.width);
          const canvas = document.createElement("canvas");
          canvas.width = Math.max(1, Math.round(img.width * scale));
          canvas.height = Math.max(1, Math.round(img.height * scale));
          const ctx = canvas.getContext("2d");
          if (!ctx) return resolve("");
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", quality));
        } catch {
          resolve("");
        }
      };
      img.src = String(reader.result || "");
    };
    reader.readAsDataURL(file);
  });
}

const page: React.CSSProperties = { minHeight: "100vh", background: "#05070d", color: "#f7f7fb", padding: 18, fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" };
const wrap: React.CSSProperties = { maxWidth: 1280, margin: "0 auto", paddingBottom: 120 };
const nav: React.CSSProperties = { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 18 };
const brand: React.CSSProperties = { color: "#ffd45a", fontSize: 27, fontWeight: 950, letterSpacing: -1, marginRight: 10 };
const btn: React.CSSProperties = { border: "1px solid rgba(207,216,230,.18)", background: "#171c29", color: "#f7f7fb", borderRadius: 999, padding: "13px 18px", fontWeight: 950, textDecoration: "none", display: "inline-block", cursor: "pointer" };
const goldBtn: React.CSSProperties = { ...btn, border: 0, background: "#ffdc68", color: "#10131a" };
const redBtn: React.CSSProperties = { ...btn, background: "#271016", borderColor: "rgba(255,70,70,.48)", color: "#ffaaaa" };
const hero: React.CSSProperties = { border: "1px solid rgba(245,197,66,.28)", borderRadius: 28, padding: 30, marginBottom: 20, background: "radial-gradient(circle at top right, rgba(245,197,66,.16), transparent 32%), linear-gradient(180deg,#080d19,#050816)" };
const card: React.CSSProperties = { background: "linear-gradient(180deg,#080d19,#050816)", border: "1px solid rgba(245,197,66,.28)", borderRadius: 26, padding: 26, marginBottom: 22 };
const panel: React.CSSProperties = { background: "#121724", border: "1px solid rgba(207,216,230,.16)", borderRadius: 22, padding: 22 };
const activePanel: React.CSSProperties = { ...panel, borderColor: "rgba(245,197,66,.75)", boxShadow: "0 0 26px rgba(245,197,66,.18)" };
const sticky: React.CSSProperties = { position: "sticky", top: 10, zIndex: 10, background: "rgba(5,7,13,.92)", backdropFilter: "blur(10px)", border: "1px solid rgba(245,197,66,.28)", borderRadius: 24, padding: 16, marginBottom: 18 };
const eyebrow: React.CSSProperties = { color: "#ffd45a", textTransform: "uppercase", letterSpacing: 7, fontWeight: 950, fontSize: 15, marginBottom: 12 };
const label: React.CSSProperties = { color: "#ffd45a", textTransform: "uppercase", letterSpacing: 4, fontSize: 12, fontWeight: 950, marginBottom: 8 };
const h1: React.CSSProperties = { fontSize: "clamp(44px,8vw,86px)", lineHeight: 0.9, letterSpacing: -4, margin: "0 0 18px", fontWeight: 950 };
const h2: React.CSSProperties = { fontSize: "clamp(30px,5vw,52px)", lineHeight: 0.95, letterSpacing: -2, margin: "0 0 14px", fontWeight: 950 };
const sub: React.CSSProperties = { color: "#c9d0dc", fontSize: 21, lineHeight: 1.35, margin: 0 };
const muted: React.CSSProperties = { color: "#aeb7c7", margin: "8px 0 0", lineHeight: 1.35 };
const grid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(245px,1fr))", gap: 16 };
const row: React.CSSProperties = { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" };
const input: React.CSSProperties = { width: "100%", boxSizing: "border-box", border: "1px solid rgba(207,216,230,.18)", background: "#151b2a", color: "#f8fafc", borderRadius: 18, padding: "15px 16px", fontSize: 16 };
const textarea: React.CSSProperties = { ...input, minHeight: 130, resize: "vertical" };
const imageStyle: React.CSSProperties = { width: "100%", height: 180, objectFit: "cover", borderRadius: 18, border: "1px solid rgba(245,197,66,.25)", marginBottom: 12 };

function Nav() {
  return (
    <nav style={nav}>
      <div style={brand}>VAULTFORGE</div>
      <Link href="/command" style={btn}>Command</Link>
      <Link href="/my-rooms" style={btn}>My Rooms</Link>
      <Link href="/members" style={btn}>Members</Link>
      <Link href="/network" style={btn}>Network</Link>
      <Link href="/state-map" style={btn}>State Map</Link>
      <Link href="/deal-rooms" style={btn}>Deal Rooms</Link>
      <Link href="/pain-rooms" style={btn}>Pain Rooms</Link>
      <Link href="/messages" style={btn}>Messages</Link>
      <Link href="/profile" style={goldBtn}>Profile</Link>
      <Link href="/logout" style={redBtn}>Logout</Link>
    </nav>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section style={card}><div style={eyebrow}>{title}</div>{children}</section>;
}

function stopKeys(event: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) {
  event.stopPropagation();
}

function Field({ title, value, onChange }: { title: string; value: string; onChange: (value: string) => void }) {
  return <label><div style={label}>{title}</div><input style={input} value={value} onKeyDownCapture={stopKeys} onKeyUpCapture={stopKeys} onChange={(event) => onChange(event.target.value)} /></label>;
}

function TextArea({ title, value, onChange }: { title: string; value: string; onChange: (value: string) => void }) {
  return <label><div style={label}>{title}</div><textarea style={textarea} value={value} onKeyDownCapture={stopKeys} onKeyUpCapture={stopKeys} onChange={(event) => onChange(event.target.value)} /></label>;
}

function SelectField({ title, value, options, onChange }: { title: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return <label><div style={label}>{title}</div><select style={input} value={value} onChange={(event) => onChange(event.target.value)}>{options.map((option) => <option key={option}>{option}</option>)}</select></label>;
}

function ChipSet({ title, options, selected, onToggle }: { title: string; options: string[]; selected: string[]; onToggle: (value: string) => void }) {
  return (
    <div>
      <div style={label}>{title}</div>
      <div style={row}>
        {options.map((option) => (
          <button key={option} type="button" style={selected.includes(option) ? goldBtn : btn} onClick={() => onToggle(option)}>
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

function ScoreCard({ title, value, note }: { title: string; value: number | string; note: string }) {
  return <div style={panel}><div style={eyebrow}>{title}</div><h2 style={h2}>{value}</h2><p style={muted}>{note}</p></div>;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<MemberProfile>(() => defaultProfile());
  const [banner, setBanner] = useState("");
  const [error, setError] = useState("");
  const directoryCount = useMemo(() => readDirectory().length, [profile.updatedAt]);

  useEffect(() => {
    setProfile(readProfile());
  }, []);

  const completion = useMemo(() => {
    let score = 0;
    if (profile.name) score += 10;
    if (profile.email || profile.phone) score += 10;
    if (profile.basedCity && profile.basedState) score += 10;
    if (profile.statesOperated.length) score += 10;
    if (profile.assetClasses.length) score += 10;
    if (profile.strategies.length) score += 10;
    if (profile.canProvide.length) score += 12;
    if (profile.needs.length) score += 8;
    if (profile.fundingRange !== "Not listed") score += 10;
    if (profile.bio) score += 10;
    return Math.min(100, score);
  }, [profile]);

  function update(key: keyof MemberProfile, value: any) {
    setProfile({ ...profile, [key]: value });
  }

  function toggle(key: keyof MemberProfile, value: string) {
    const current = new Set(list(profile[key]));
    current.has(value) ? current.delete(value) : current.add(value);
    update(key, Array.from(current));
  }

  function setBasedCity(city: string) {
    setProfile({ ...profile, basedCity: city, basedCounty: countyFromCity(city) || profile.basedCounty });
  }

  async function setImage(key: "profilePhoto" | "companyLogo", files: FileList | null) {
    const file = Array.from(files || [])[0];
    if (!file) return;

    setError("");
    setBanner("Compressing and saving image...");

    const image = await compressImage(file);
    if (!image) {
      setError("Image could not be loaded. Try a smaller JPG/PNG.");
      setBanner("");
      return;
    }

    const backupKey = key === "profilePhoto" ? PROFILE_PHOTO_BACKUP_KEY : COMPANY_LOGO_BACKUP_KEY;
    const backupSaved = writeJson(backupKey, image);

    const next = { ...profile, [key]: image, updatedAt: new Date().toISOString() } as MemberProfile;
    setProfile(next);

    for (const storageKey of PROFILE_KEYS) {
      const current = j<any | null>(localStorage.getItem(storageKey), null);
      if (current && typeof current === "object") writeJson(storageKey, { ...current, [key]: image, updatedAt: next.updatedAt });
    }

    if (!backupSaved) {
      setError("Image preview loaded, but browser storage is full. Delete old saved/archived items or clear site data before final launch.");
      setBanner("");
      return;
    }

    setBanner(key === "profilePhoto" ? "Profile photo saved." : "Company logo saved.");
  }

  function save() {
    setBanner("");
    setError("");

    if (!txt(profile.name)) {
      setError("Add member name before saving.");
      return;
    }

    const result = saveProfile(profile);
    if (!result.ok) {
      setError(result.message);
      return;
    }

    setBanner("Profile saved. Member matching, Network, and Room intelligence can now use this profile.");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <main style={page}>
      <div style={wrap}>
        <Nav />

        <section style={sticky}>
          <div style={row}>
            <button type="button" style={goldBtn} onClick={save}>Save Profile</button>
            <Link href="/members" style={btn}>Open Members</Link>
            <Link href="/network" style={btn}>Open Network</Link>
            <span style={muted}>{txt(profile.name, "No name yet")} • Based {profile.basedCity || "City not set"}, {profile.basedState} • Serves {profile.statesOperated.join(", ")}</span>
          </div>
        </section>

        {banner ? <section style={activePanel}><div style={eyebrow}>Saved</div><h2 style={h2}>{banner}</h2></section> : null}
        {error ? <section style={activePanel}><div style={eyebrow}>Error</div><h2 style={h2}>{error}</h2></section> : null}

        <section style={hero}>
          <div style={eyebrow}>Member Profile Intelligence</div>
          <h1 style={h1}>Profile powers the network.</h1>
          <p style={sub}>Based state controls member cards. States served controls routing, matching, deal/pain fit, and state network intelligence.</p>
        </section>

        <Section title="Profile Preview">
          <div style={grid}>
            <div style={activePanel}>
              {profile.profilePhoto ? <img src={profile.profilePhoto} alt="Profile" style={imageStyle} /> : null}
              <div style={eyebrow}>{profile.memberType}</div>
              <h2 style={h2}>{txt(profile.name, "VaultForge Member")}</h2>
              <p style={sub}>{txt(profile.company, "Company not listed")}</p>
              <p style={muted}>Based {profile.basedCity || "City not set"}, {profile.basedState} • Serves {profile.statesOperated.join(", ")}</p>
            </div>
            <ScoreCard title="Completion" value={`${completion}%`} note="used for trust and matching" />
            <ScoreCard title="Directory" value={directoryCount} note="profiles in local member directory" />
            <ScoreCard title="Routing Identity" value={profile.canProvide.length + profile.needs.length} note="provide/need tags" />
          </div>
        </Section>

        <Section title="Photos">
          <p style={muted}>Photos are compressed and backed up separately so they do not disappear when member directory data is cleaned or storage gets tight.</p>
          <div style={{ height: 14 }} />
          <div style={grid}>
            <div style={panel}>
              {profile.profilePhoto ? <img src={profile.profilePhoto} alt="Profile" style={imageStyle} /> : null}
              <div style={eyebrow}>Profile Photo</div>
              <input type="file" accept="image/*" onChange={(event) => setImage("profilePhoto", event.target.files)} />
              <div style={{ ...row, marginTop: 12 }}>
                <button type="button" style={redBtn} onClick={() => { localStorage.removeItem(PROFILE_PHOTO_BACKUP_KEY); update("profilePhoto", ""); }}>Delete Photo</button>
              </div>
            </div>
            <div style={panel}>
              {profile.companyLogo ? <img src={profile.companyLogo} alt="Company logo" style={imageStyle} /> : null}
              <div style={eyebrow}>Company Logo</div>
              <input type="file" accept="image/*" onChange={(event) => setImage("companyLogo", event.target.files)} />
              <div style={{ ...row, marginTop: 12 }}>
                <button type="button" style={redBtn} onClick={() => { localStorage.removeItem(COMPANY_LOGO_BACKUP_KEY); update("companyLogo", ""); }}>Delete Logo</button>
              </div>
            </div>
          </div>
        </Section>

        <Section title="Identity">
          <div style={grid}>
            <Field title="Name" value={profile.name} onChange={(value) => update("name", value)} />
            <Field title="Company" value={profile.company} onChange={(value) => update("company", value)} />
            <Field title="Title" value={profile.title} onChange={(value) => update("title", value)} />
            <Field title="Email" value={profile.email} onChange={(value) => update("email", value)} />
            <Field title="Phone" value={profile.phone} onChange={(value) => update("phone", value)} />
            <SelectField title="Member Type" value={profile.memberType} options={MEMBER_TYPES} onChange={(value) => update("memberType", value)} />
            <SelectField title="Verified Status" value={profile.verifiedStatus} options={VERIFIED} onChange={(value) => update("verifiedStatus", value)} />
            <SelectField title="Contact Preference" value={profile.contactPreference} options={CONTACT} onChange={(value) => update("contactPreference", value)} />
            <SelectField title="Response Speed" value={profile.responseSpeed} options={RESPONSE} onChange={(value) => update("responseSpeed", value)} />
          </div>
        </Section>

        <Section title="Based Location">
          <div style={grid}>
            <SelectField title="Based State" value={profile.basedState} options={STATES} onChange={(value) => update("basedState", value)} />
            <Field title="Based City" value={profile.basedCity} onChange={setBasedCity} />
            <Field title="Based County" value={profile.basedCounty} onChange={(value) => update("basedCounty", value)} />
          </div>
        </Section>

        <Section title="States Served">
          <ChipSet title="States Operated / Served" options={STATES} selected={profile.statesOperated} onToggle={(value) => toggle("statesOperated", value)} />
          <div style={{ height: 18 }} />
          <TextArea title="Counties Served" value={profile.countiesServed.join(", ")} onChange={(value) => update("countiesServed", list(value))} />
        </Section>

        <Section title="Asset + Strategy Fit">
          <ChipSet title="Asset Classes" options={ASSET_CLASSES} selected={profile.assetClasses} onToggle={(value) => toggle("assetClasses", value)} />
          <div style={{ height: 18 }} />
          <ChipSet title="Strategies" options={STRATEGIES} selected={profile.strategies} onToggle={(value) => toggle("strategies", value)} />
          <div style={{ height: 18 }} />
          <ChipSet title="Specialties" options={SPECIALTIES} selected={profile.specialties} onToggle={(value) => toggle("specialties", value)} />
        </Section>

        <Section title="Routing Tags">
          <ChipSet title="Can Provide" options={PROVIDE} selected={profile.canProvide} onToggle={(value) => toggle("canProvide", value)} />
          <div style={{ height: 18 }} />
          <ChipSet title="Needs" options={NEEDS} selected={profile.needs} onToggle={(value) => toggle("needs", value)} />
        </Section>

        <Section title="Capital + Buy Box">
          <div style={grid}>
            <SelectField title="Funding Range" value={profile.fundingRange} options={FUNDING} onChange={(value) => update("fundingRange", value)} />
            <SelectField title="Deal Size" value={profile.dealSize} options={DEAL_SIZE} onChange={(value) => update("dealSize", value)} />
            <Field title="Capital Position" value={profile.capitalPosition} onChange={(value) => update("capitalPosition", value)} />
            <Field title="Price Range" value={profile.priceRange} onChange={(value) => update("priceRange", value)} />
          </div>
          <div style={{ height: 18 }} />
          <ChipSet title="Buy Box / Target Deals" options={["Off Market", "Distressed", "Light Rehab", "Heavy Rehab", "Rental", "Land", "Commercial", "Multifamily", "Quick Close", "Seller Finance", "JV", "High Equity"]} selected={profile.buyBox} onToggle={(value) => toggle("buyBox", value)} />
        </Section>

        <Section title="Bio">
          <TextArea title="Member Bio / AI Context" value={profile.bio} onChange={(value) => update("bio", value)} />
        </Section>

        <Section title="Save">
          <button type="button" style={goldBtn} onClick={save}>Save Profile</button>
        </Section>
      </div>
    </main>
  );
}