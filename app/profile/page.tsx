"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const PROFILE_BUCKET = "profile-photo";

const STATE_OPTIONS = [
  "Georgia",
  "Florida",
  "Tennessee",
  "North Carolina",
  "South Carolina",
  "Alabama",
  "Texas",
  "Ohio",
  "Pennsylvania",
  "California",
  "New York",
  "National",
];

const MEMBER_TYPE_OPTIONS = [
  "Buyer",
  "Seller",
  "Lender",
  "Private Money",
  "Hard Money Lender",
  "Wholesaler",
  "Contractor",
  "Developer",
  "Operator",
  "Realtor",
  "Broker",
  "Property Manager",
  "JV Partner",
  "Investor",
  "Deal Source",
  "Title / Attorney",
  "Insurance",
  "Builder",
  "Land Specialist",
];

const PROPERTY_TYPE_OPTIONS = [
  "Residential",
  "Commercial",
  "Multifamily",
  "Land",
  "Industrial",
  "Self Storage",
  "Mobile Home Park",
  "Mixed Use",
  "Rental",
  "Short-Term Rental",
  "Builder Lot",
  "RV Park",
  "Raw Land",
  "Office",
  "Retail",
];

const STRATEGY_OPTIONS = [
  "Fix & Flip",
  "Buy & Hold",
  "BRRRR",
  "Wholesale",
  "Development",
  "Lending",
  "Seller Finance",
  "Subject-To",
  "Lease Option",
  "Airbnb",
  "Distressed",
  "Equity Play",
  "Value Add",
  "Ground Up",
  "Subdivision",
  "Entitlement",
  "Builder Lot",
  "Partner / JV",
];

const NEED_OPTIONS = [
  "Funding",
  "Funding needed",
  "Buyer Needed",
  "Lender Needed",
  "Private Capital Needed",
  "Seller Leads",
  "Contractor Needed",
  "Operator Needed",
  "JV Partner",
  "JV Partner Needed",
  "Wholesaler Needed",
  "Realtor Needed",
  "Title / Attorney Needed",
  "Property Manager Needed",
  "Insurance Help Needed",
  "Permit Help Needed",
  "Off-Market Deals",
  "Disposition Help",
  "Due Diligence",
  "Property Management",
  "Title/Closing Help",
  "Creative Finance",
  "Stalled Project Help",
  "Funding Gap Help",
];

const CAN_PROVIDE_OPTIONS = [
  "Cash Buyer",
  "Private Lending",
  "Hard Money",
  "Capital",
  "Contractor Crew",
  "Deal Sourcing",
  "Disposition",
  "Project Management",
  "Construction",
  "Operator Support",
  "JV Equity",
  "Realtor Access",
  "MLS Access",
  "Wholesaling",
  "Land Development",
  "Commercial Analysis",
  "Local Market Knowledge",
  "Title / Attorney Help",
  "Permit Help",
  "Property Management",
  "Insurance Help",
];

const DISTRESS_SIGNAL_OPTIONS = [
  "Behind Payments",
  "Inherited Property",
  "Vacant Property",
  "Tired Landlord",
  "Code Violations",
  "Tax Pressure",
  "Divorce / Probate",
  "Stalled Construction",
  "Contractor Problem",
  "Funding Gap",
  "Permit Delay",
  "Needs Fast Close",
];

const ALERT_TYPE_OPTIONS = [
  "Deal matches my buy box",
  "New deal in my market",
  "Buyer match",
  "Funding match",
  "Capital match",
  "Lender match",
  "Contractor/operator match",
  "JV opportunity",
  "Distressed opportunity",
  "Pain signal",
  "High-margin deal",
  "Someone saves my deal",
  "Someone messages me",
  "Price drop or status change",
  "AI opportunity signal",
  "Routing notice",
];

const ALERT_FREQUENCIES = [
  { label: "Instant", value: "instant" },
  { label: "High Priority Only", value: "high_priority" },
  { label: "Daily Digest", value: "daily_digest" },
  { label: "Weekly Digest", value: "weekly_digest" },
  { label: "Silent Mode", value: "off" },
];

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(232,196,107,.16), transparent 30%), radial-gradient(circle at top right, rgba(157,243,191,.10), transparent 28%), linear-gradient(180deg,#030509,#071326 55%,#030509)",
  color: "white",
  padding: "28px 18px 90px",
  fontFamily: "Arial, sans-serif",
};

const wrap: React.CSSProperties = { maxWidth: 1060, margin: "0 auto" };

const hero: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.30)",
  background: "linear-gradient(135deg, rgba(255,255,255,.075), rgba(255,255,255,.025))",
  borderRadius: 34,
  padding: 26,
  marginBottom: 22,
  boxShadow: "0 30px 90px rgba(0,0,0,.38)",
};

const pane: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.13)",
  background: "rgba(255,255,255,.04)",
  borderRadius: 28,
  padding: 22,
  marginBottom: 18,
};

const goldPane: React.CSSProperties = {
  ...pane,
  border: "1px solid rgba(232,196,107,.28)",
  background:
    "linear-gradient(145deg, rgba(232,196,107,.08), rgba(255,255,255,.035))",
};

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
  gap: 14,
};

const btn: React.CSSProperties = {
  display: "inline-block",
  background: "#f5d978",
  color: "#06100a",
  textDecoration: "none",
  borderRadius: 999,
  padding: "14px 20px",
  fontWeight: 950,
  border: "none",
  margin: "7px 7px 0 0",
  cursor: "pointer",
};

const ghost: React.CSSProperties = {
  display: "inline-block",
  color: "white",
  textDecoration: "none",
  borderRadius: 999,
  padding: "14px 20px",
  fontWeight: 900,
  border: "1px solid rgba(255,255,255,.18)",
  background: "rgba(255,255,255,.04)",
  margin: "7px 7px 0 0",
};

const input: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  borderRadius: 18,
  border: "1px solid rgba(255,255,255,.18)",
  background: "rgba(255,255,255,.075)",
  color: "white",
  padding: 14,
  fontSize: 16,
};

const label: React.CSSProperties = {
  display: "block",
  fontWeight: 900,
  margin: "0 0 8px",
};

const eyebrow: React.CSSProperties = {
  color: "#e8c46b",
  letterSpacing: 5,
  fontWeight: 900,
  fontSize: 12,
  marginBottom: 12,
  textTransform: "uppercase",
};

const muted: React.CSSProperties = {
  color: "rgba(255,255,255,.70)",
  lineHeight: 1.55,
  fontSize: 17,
};

const chipWrap: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 10,
};

function readCookie(name: string) {
  if (typeof document === "undefined") return "";
  const match = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));

  if (!match) return "";

  try {
    return decodeURIComponent(match.slice(name.length + 1));
  } catch {
    return match.slice(name.length + 1);
  }
}

function getEmail() {
  if (typeof window === "undefined") return "";
  return (
    localStorage.getItem("vf_email") ||
    sessionStorage.getItem("vf_email") ||
    readCookie("vf_email") ||
    ""
  )
    .trim()
    .toLowerCase();
}


function localProfileKey(email: string) {
  return `vf_profile_backup_${email.trim().toLowerCase()}`;
}

function loadLocalProfile(email: string) {
  if (typeof window === "undefined" || !email) return null;

  try {
    const raw =
      localStorage.getItem(localProfileKey(email)) ||
      sessionStorage.getItem(localProfileKey(email));

    if (!raw) return null;

    const parsed = JSON.parse(raw);

    if (!parsed || typeof parsed !== "object") return null;

    return parsed;
  } catch {
    return null;
  }
}

function saveLocalProfile(email: string, profile: Record<string, any>) {
  if (typeof window === "undefined" || !email) return;

  try {
    const payload = JSON.stringify({
      ...profile,
      email,
      _local_saved_at: new Date().toISOString(),
    });

    localStorage.setItem(localProfileKey(email), payload);
    sessionStorage.setItem(localProfileKey(email), payload);
  } catch {
    // Local backup is best effort only.
  }
}

function fieldIsBlank(value: any) {
  if (Array.isArray(value)) return value.length === 0;
  return !String(value || "").trim();
}

function mergeNoBlankOverwrite(remote: Record<string, any>, local: Record<string, any>) {
  const next = { ...remote };

  const keysToProtect = [
    "email",
    "full_name",
    "phone",
    "company",
    "role",
    "city",
    "state",
    "markets",
    "buy_box",
    "funding_capacity",
    "strategy",
    "profile_photo_url",
    "member_types",
    "buy_box_states",
    "buy_box_types",
    "buy_box_strategies",
    "needs",
    "can_provide",
    "distress_signals",
    "alert_types",
    "alert_frequency",
    "max_alerts_per_day",
  ];

  for (const key of keysToProtect) {
    if (fieldIsBlank(next[key]) && !fieldIsBlank(local[key])) {
      next[key] = local[key];
    }
  }

  return next;
}


function normalizeChip(value: unknown) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/\s*\/\s*/g, "/")
    .replace(/\s*-\s*/g, "-");
}

function aliasesFor(value: string) {
  const normalized = normalizeChip(value);

  const aliases: Record<string, string[]> = {
    "fix & flip": ["flips", "flip", "fix and flip"],
    flips: ["fix & flip", "flip", "fix and flip"],
    funding: ["funding needed", "lender needed", "private capital needed", "capital match"],
    "funding needed": ["funding", "lender needed", "private capital needed"],
    lending: ["lender", "private lending", "hard money", "funding"],
    lender: ["lending", "private lending", "hard money", "funding"],
    "title/closing help": ["title / attorney needed", "title / attorney help"],
    "title / attorney needed": ["title/closing help", "title / attorney help"],
    "contractor/operator match": ["contractor needed", "operator needed"],
  };

  return [normalized, ...(aliases[normalized] || []).map(normalizeChip)];
}

function chipsMatch(a: string, b: string) {
  const aAliases = aliasesFor(a);
  const bAliases = aliasesFor(b);
  return aAliases.some((item) => bAliases.includes(item));
}

function asArray(value: any): string[] {
  if (Array.isArray(value)) return value.map(String).map((x) => x.trim()).filter(Boolean);

  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.map(String).map((x) => x.trim()).filter(Boolean);
    } catch {
      // continue
    }

    return value
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
  }

  return [];
}

function uniqueList(values: string[]) {
  const map = new Map<string, string>();

  for (const value of values) {
    const cleanValue = String(value || "").trim();
    if (!cleanValue) continue;
    map.set(normalizeChip(cleanValue), cleanValue);
  }

  return Array.from(map.values());
}

function firstNonEmpty(...values: any[]) {
  for (const value of values) {
    if (Array.isArray(value)) {
      if (value.length) return value;
      continue;
    }

    const text = String(value || "").trim();
    if (text) return value;
  }

  return "";
}

function arrayFirstNonEmpty(...values: any[]) {
  for (const value of values) {
    const list = asArray(value);
    if (list.length) return list;
  }

  return [];
}

function joinList(value: any) {
  return asArray(value).join(", ");
}

function completionScore(form: Record<string, any>) {
  const required = ["email", "full_name", "phone", "role", "city", "state"];
  const requiredDone = required.filter((key) => String(form[key] || "").trim()).length;

  const intelligenceFields = [
    asArray(form.member_types).length,
    asArray(form.buy_box_states).length,
    asArray(form.buy_box_types).length,
    asArray(form.buy_box_strategies).length,
    asArray(form.needs).length,
    asArray(form.can_provide).length,
  ];

  const intelligenceDone = intelligenceFields.filter(Boolean).length;
  const base = (requiredDone / required.length) * 70;
  const smart = (intelligenceDone / intelligenceFields.length) * 30;

  return Math.round(base + smart);
}

function safeFileName(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function fileExtension(file: File) {
  const name = file.name || "";
  const ext = name.includes(".") ? name.split(".").pop() || "" : "";

  if (ext) return ext.toLowerCase();
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  if (file.type === "image/gif") return "gif";

  return "jpg";
}

function supabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    "";

  if (!url || !key) {
    throw new Error("Supabase public environment values are missing.");
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function toggleInList(list: string[], value: string) {
  const exists = list.some((item) => chipsMatch(item, value));

  if (exists) return list.filter((item) => !chipsMatch(item, value));
  return uniqueList([...list, value]);
}

function mergeOptions(base: string[], selected: string[]) {
  return uniqueList([...base, ...selected]);
}

const EMPTY_FORM = {
  email: "",
  full_name: "",
  phone: "",
  company: "",
  role: "",
  city: "",
  state: "Georgia",
  markets: "",
  buy_box: "",
  funding_capacity: "",
  strategy: "",
  profile_photo_url: "",
  alert_frequency: "daily_digest",
  max_alerts_per_day: "10",
  alert_types: ["Deal matches my buy box", "Someone messages me", "Funding match"],
  member_types: ["Buyer"],
  buy_box_states: ["Georgia"],
  buy_box_types: [],
  buy_box_strategies: [],
  needs: [],
  can_provide: [],
  distress_signals: [],
};

function profileToForm(profile: Record<string, any>, email: string, current: Record<string, any>) {
  const loadedMemberTypes = arrayFirstNonEmpty(
    profile.member_types,
    profile.memberTypes,
    profile.role,
    profile.member_role
  );

  const loadedStates = arrayFirstNonEmpty(
    profile.buy_box_states,
    profile.market_states,
    profile.markets,
    profile.state
  );

  const loadedTypes = arrayFirstNonEmpty(
    profile.buy_box_types,
    profile.property_types,
    profile.asset_types,
    current.buy_box_types
  );

  const loadedStrategies = arrayFirstNonEmpty(
    profile.buy_box_strategies,
    profile.strategies,
    profile.strategy,
    current.buy_box_strategies
  );

  const loadedNeeds = arrayFirstNonEmpty(
    profile.needs,
    profile.deal_needs,
    profile.what_i_need,
    current.needs
  );

  const loadedProvide = arrayFirstNonEmpty(
    profile.can_provide,
    profile.what_i_provide,
    current.can_provide
  );

  const loadedDistress = arrayFirstNonEmpty(
    profile.distress_signals,
    profile.pain_signals,
    profile.problem_signals,
    current.distress_signals
  );

  const loadedAlerts = arrayFirstNonEmpty(
    profile.alert_types,
    current.alert_types
  );

  const profilePhoto = firstNonEmpty(
    profile.profile_photo_url,
    profile.profilePhotoUrl,
    profile.avatar_url,
    profile.photo_url,
    current.profile_photo_url
  ) as string;

  return {
    email: firstNonEmpty(profile.email, email, current.email) as string,
    full_name: firstNonEmpty(profile.full_name, profile.fullName, profile.name, current.full_name) as string,
    phone: firstNonEmpty(profile.phone, current.phone) as string,
    company: firstNonEmpty(profile.company, current.company) as string,
    role: firstNonEmpty(profile.role, profile.member_role, loadedMemberTypes[0], current.role) as string,
    city: firstNonEmpty(profile.city, current.city) as string,
    state: firstNonEmpty(profile.state, loadedStates[0], current.state, "Georgia") as string,
    markets: firstNonEmpty(profile.markets, joinList(loadedStates), current.markets) as string,
    member_types: loadedMemberTypes.length ? loadedMemberTypes : asArray(current.member_types).length ? asArray(current.member_types) : ["Buyer"],
    buy_box: firstNonEmpty(profile.buy_box, profile.buyBox, current.buy_box) as string,
    funding_capacity: firstNonEmpty(profile.funding_capacity, profile.fundingCapacity, current.funding_capacity) as string,
    strategy: firstNonEmpty(profile.strategy, current.strategy) as string,
    profile_photo_url: profilePhoto || "",
    alert_frequency: firstNonEmpty(profile.alert_frequency, current.alert_frequency, "daily_digest") as string,
    max_alerts_per_day: String(firstNonEmpty(profile.max_alerts_per_day, current.max_alerts_per_day, "10")),
    alert_types: loadedAlerts.length ? loadedAlerts : ["Deal matches my buy box", "Someone messages me", "Funding match"],
    buy_box_states: loadedStates.length ? loadedStates : asArray(current.buy_box_states).length ? asArray(current.buy_box_states) : ["Georgia"],
    buy_box_types: loadedTypes,
    buy_box_strategies: loadedStrategies,
    needs: loadedNeeds,
    can_provide: loadedProvide,
    distress_signals: loadedDistress,
  };
}

export default function ProfilePage() {
  const [form, setForm] = useState<Record<string, any>>(EMPTY_FORM);
  const [status, setStatus] = useState("Loading profile...");
  const [saving, setSaving] = useState(false);
  const [complete, setComplete] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const progress = useMemo(() => completionScore(form), [form]);

  function update(key: string, value: any) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function toggle(key: string, value: string) {
    setForm((current) => {
      const currentList = asArray(current[key]);
      return { ...current, [key]: toggleInList(currentList, value) };
    });
  }

  async function uploadProfilePhoto(file: File) {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setStatus("Choose an image file for your profile photo.");
      return;
    }

    const maxSize = 6 * 1024 * 1024;

    if (file.size > maxSize) {
      setStatus("Profile photo is too large. Use an image under 6MB.");
      return;
    }

    setUploadingPhoto(true);
    setStatus("Uploading profile photo...");

    try {
      const email = form.email || getEmail();

      if (!email || !email.includes("@")) {
        throw new Error("Add your email before uploading a profile photo.");
      }

      const supabase = supabaseBrowserClient();
      const ext = fileExtension(file);
      const cleanBase = safeFileName(email.split("@")[0] || "member");
      const path = `${safeFileName(email)}/${cleanBase}-${Date.now()}.${ext}`;

      const { error } = await supabase.storage
        .from(PROFILE_BUCKET)
        .upload(path, file, {
          cacheControl: "3600",
          upsert: true,
          contentType: file.type || `image/${ext}`,
        });

      if (error) {
        throw new Error(error.message || "Profile photo upload failed.");
      }

      const { data } = supabase.storage.from(PROFILE_BUCKET).getPublicUrl(path);
      const publicUrl = data?.publicUrl || "";

      if (!publicUrl) {
        throw new Error("Could not get public profile photo URL.");
      }

      update("profile_photo_url", publicUrl);
      setStatus("Profile photo uploaded. Click Save Profile to lock it in.");
    } catch (error: any) {
      setStatus(error?.message || "Could not upload profile photo.");
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function loadProfile() {
    setStatus("Loading profile...");

    try {
      const email = getEmail();
      const localBackup = loadLocalProfile(email);

      if (localBackup) {
        setForm((current) => profileToForm(localBackup, email, current));
      }

      const res = await fetch(`/api/profile/me?email=${encodeURIComponent(email)}`, {
        cache: "no-store",
        headers: { "x-vf-email": email },
      });

      const data = await res.json();
      const remoteProfile = data?.profile || {};
      const safeProfile = localBackup
        ? mergeNoBlankOverwrite(remoteProfile, localBackup)
        : remoteProfile;

      setForm((current) => profileToForm(safeProfile, email, current));
      setComplete(Boolean(safeProfile.profile_complete || data?.profile_complete));
      setStatus("");
    } catch (error: any) {
      setStatus(error?.message || "Could not load profile.");
    }
  }

  async function saveProfile() {
    setSaving(true);
    setStatus("Saving profile...");

    try {
      const email = form.email || getEmail();
      const primaryRole = asArray(form.member_types)[0] || form.role;

      const payload = {
        ...form,
        email,
        role: primaryRole,
        member_role: primaryRole,
        state: form.state || asArray(form.buy_box_states)[0] || "Georgia",
        markets: joinList(form.buy_box_states),
        market_states: asArray(form.buy_box_states),
        member_types: asArray(form.member_types),
        buy_box_states: asArray(form.buy_box_states),
        buy_box_types: asArray(form.buy_box_types),
        property_types: asArray(form.buy_box_types),
        asset_types: asArray(form.buy_box_types),
        buy_box_strategies: asArray(form.buy_box_strategies),
        strategies: asArray(form.buy_box_strategies),
        needs: asArray(form.needs),
        deal_needs: asArray(form.needs),
        what_i_need: asArray(form.needs),
        can_provide: asArray(form.can_provide),
        what_i_provide: asArray(form.can_provide),
        distress_signals: asArray(form.distress_signals),
        pain_signals: asArray(form.distress_signals),
        alert_types: asArray(form.alert_types),
        max_alerts_per_day: Number(form.max_alerts_per_day || 10),
      };

      const res = await fetch("/api/profile/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-vf-email": email,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || data?.error) {
        throw new Error(data?.error || data?.details || "Profile save failed.");
      }

      saveLocalProfile(email, {
        ...payload,
        profile_complete: Boolean(data?.profile_complete),
        profile_photo_url: form.profile_photo_url,
      });

      setComplete(Boolean(data?.profile_complete));
      setStatus(
        data?.profile_complete
          ? "Profile complete. Smart routing fields saved."
          : "Profile saved. Complete required fields to unlock payment step."
      );

      await loadProfile();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error: any) {
      setStatus(error?.message || "Could not save profile.");
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    loadProfile();
  }, []);

  const memberTypeOptions = mergeOptions(MEMBER_TYPE_OPTIONS, asArray(form.member_types));
  const stateOptions = mergeOptions(STATE_OPTIONS, asArray(form.buy_box_states));
  const typeOptions = mergeOptions(PROPERTY_TYPE_OPTIONS, asArray(form.buy_box_types));
  const strategyOptions = mergeOptions(STRATEGY_OPTIONS, asArray(form.buy_box_strategies));
  const needOptions = mergeOptions(NEED_OPTIONS, asArray(form.needs));
  const provideOptions = mergeOptions(CAN_PROVIDE_OPTIONS, asArray(form.can_provide));
  const alertOptions = mergeOptions(ALERT_TYPE_OPTIONS, asArray(form.alert_types));
  const distressOptions = mergeOptions(DISTRESS_SIGNAL_OPTIONS, asArray(form.distress_signals));

  return (
    <main style={page}>
      <div style={wrap}>
        <section style={hero}>
          <div style={eyebrow}>Member Intelligence Profile</div>
          <h1
            style={{
              fontSize: "clamp(54px, 12vw, 96px)",
              lineHeight: 0.88,
              margin: "0 0 18px",
            }}
          >
            Train your VaultForge engine.
          </h1>
          <p style={{ ...muted, fontSize: 20 }}>
            Your profile powers smart alerts, member routing, deal matching, buy-box intelligence,
            market signals, pain routing, and future AI recommendations.
          </p>
          <Link href="/dashboard" style={ghost}>Dashboard</Link>
          <Link href="/alerts" style={ghost}>Alerts</Link>
          <Link href="/payment" style={ghost}>Payment</Link>
          <Link href="/logout" style={ghost}>Logout</Link>
        </section>

        <section
          style={{
            ...pane,
            borderColor: complete
              ? "rgba(157,243,191,.45)"
              : "rgba(232,196,107,.35)",
          }}
        >
          <div style={eyebrow}>Profile Progress</div>
          <h2 style={{ fontSize: 34, margin: "0 0 12px" }}>
            {complete ? "Complete ✓" : `${progress}% complete`}
          </h2>
          <div
            style={{
              width: "100%",
              height: 14,
              borderRadius: 999,
              background: "rgba(255,255,255,.08)",
              overflow: "hidden",
              marginBottom: 14,
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: "100%",
                background: complete ? "#9df3bf" : "#f5d978",
              }}
            />
          </div>
          {status && (
            <p
              style={{
                margin: 0,
                color: complete ? "#9df3bf" : "#e8c46b",
                fontWeight: 900,
              }}
            >
              {status}
            </p>
          )}
          {complete && <Link href="/payment" style={btn}>Continue to Payment</Link>}
        </section>

        <section style={pane}>
          <div style={eyebrow}>Required Fields</div>
          <p style={muted}>
            Required to move into payment-ready status: name, phone, role, city, state, and email.
          </p>
          <div style={grid}>
            <Field label="Email" value={form.email} onChange={(v) => update("email", v)} />
            <Field label="Full Name" value={form.full_name} onChange={(v) => update("full_name", v)} />
            <Field label="Phone" value={form.phone} onChange={(v) => update("phone", v)} />
            <Field label="Company" value={form.company} onChange={(v) => update("company", v)} />
            <Field
              label="City"
              value={form.city}
              onChange={(v) => update("city", v)}
              placeholder="Atlanta, Tampa, Nashville..."
            />
            <Select label="Home State" value={form.state} onChange={(v) => update("state", v)} options={STATE_OPTIONS} />
          </div>
        </section>

        <section style={goldPane}>
          <div style={eyebrow}>Who You Are</div>
          <p style={muted}>
            Choose every role that applies. This lets VaultForge route deals, capital, operators,
            buyers, sellers, and opportunities to the right people.
          </p>
          <ChipGroup
            values={form.member_types}
            options={memberTypeOptions}
            onToggle={(value) => toggle("member_types", value)}
          />
        </section>

        <section style={pane}>
          <div style={eyebrow}>Markets / States</div>
          <p style={muted}>
            Select every state or region where you want alerts and routing signals.
          </p>
          <ChipGroup
            values={form.buy_box_states}
            options={stateOptions}
            onToggle={(value) => toggle("buy_box_states", value)}
          />
          <div style={{ marginTop: 16 }}>
            <Field
              label="Specific Markets"
              value={form.markets}
              onChange={(v) => update("markets", v)}
              placeholder="Atlanta, Cartersville, Tampa, Nashville..."
            />
          </div>
        </section>

        <section style={pane}>
          <div style={eyebrow}>Project Types</div>
          <p style={muted}>
            Tell VaultForge what assets you want to see or work on.
          </p>
          <ChipGroup
            values={form.buy_box_types}
            options={typeOptions}
            onToggle={(value) => toggle("buy_box_types", value)}
          />
        </section>

        <section style={pane}>
          <div style={eyebrow}>Strategies</div>
          <p style={muted}>
            Choose all strategies you buy, fund, operate, source, build, or want alerts for.
          </p>
          <ChipGroup
            values={form.buy_box_strategies}
            options={strategyOptions}
            onToggle={(value) => toggle("buy_box_strategies", value)}
          />
        </section>

        <section style={pane}>
          <div style={eyebrow}>What You Need</div>
          <p style={muted}>
            These become routing signals. If a deal or member solves your pain, VaultForge can alert you.
          </p>
          <ChipGroup
            values={form.needs}
            options={needOptions}
            onToggle={(value) => toggle("needs", value)}
          />
        </section>

        <section style={pane}>
          <div style={eyebrow}>What You Can Provide</div>
          <p style={muted}>
            This tells the network where you add value.
          </p>
          <ChipGroup
            values={form.can_provide}
            options={provideOptions}
            onToggle={(value) => toggle("can_provide", value)}
          />
        </section>

        <section style={pane}>
          <div style={eyebrow}>Pain / Distress Signals</div>
          <p style={muted}>
            Choose the pain signals you can help with or want to be alerted about.
          </p>
          <ChipGroup
            values={form.distress_signals}
            options={distressOptions}
            onToggle={(value) => toggle("distress_signals", value)}
          />
        </section>

        <section style={pane}>
          <div style={eyebrow}>Buy Box Details</div>
          <div style={grid}>
            <Field
              label="Buy Box / Focus"
              value={form.buy_box}
              onChange={(v) => update("buy_box", v)}
              placeholder="SFR flips, 70% ARV, vacant land, value-add commercial..."
            />
            <Field
              label="Funding Capacity"
              value={form.funding_capacity}
              onChange={(v) => update("funding_capacity", v)}
              placeholder="$250k cash, $1M private lending, JV equity..."
            />
          </div>
          <div style={{ marginTop: 14 }}>
            <Text label="Strategy / Notes / What You Want VaultForge To Watch For" value={form.strategy} onChange={(v) => update("strategy", v)} />
          </div>
        </section>

        <section style={pane}>
          <div style={eyebrow}>Alert Preferences</div>
          <p style={muted}>
            Control how loud VaultForge gets. The smarter your selections, the smarter your alerts.
          </p>

          <div style={grid}>
            <Select
              label="Alert Frequency"
              value={form.alert_frequency}
              onChange={(v) => update("alert_frequency", v)}
              options={ALERT_FREQUENCIES.map((item) => item.value)}
              labels={Object.fromEntries(ALERT_FREQUENCIES.map((item) => [item.value, item.label]))}
            />
            <Select
              label="Max Alerts Per Day"
              value={String(form.max_alerts_per_day)}
              onChange={(v) => update("max_alerts_per_day", v)}
              options={["0", "3", "5", "10", "25"]}
            />
          </div>

          <div style={{ marginTop: 16 }}>
            <div style={label}>Alert Types</div>
            <ChipGroup
              values={form.alert_types}
              options={alertOptions}
              onToggle={(value) => toggle("alert_types", value)}
            />
          </div>
        </section>

        <section style={pane}>
          <div style={eyebrow}>Profile Photo</div>
          <p style={muted}>
            Upload a profile photo from your device. After upload, click Save Profile to store it with your member profile.
          </p>

          {form.profile_photo_url && (
            <div style={{ marginBottom: 16 }}>
              <img
                src={form.profile_photo_url}
                alt="Profile preview"
                style={{
                  width: 150,
                  height: 150,
                  borderRadius: 999,
                  objectFit: "cover",
                  border: "2px solid rgba(157,243,191,.50)",
                  display: "block",
                  marginBottom: 12,
                }}
              />
            </div>
          )}

          <input
            type="file"
            accept="image/*"
            disabled={uploadingPhoto}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) uploadProfilePhoto(file);
              event.currentTarget.value = "";
            }}
            style={{
              ...input,
              cursor: uploadingPhoto ? "not-allowed" : "pointer",
              opacity: uploadingPhoto ? 0.7 : 1,
            }}
          />

          <p style={{ ...muted, fontSize: 14, marginTop: 10 }}>
            {uploadingPhoto ? "Uploading..." : "Accepted: JPG, PNG, WEBP, GIF under 6MB."}
          </p>
        </section>

        <button
          type="button"
          onClick={saveProfile}
          disabled={saving || uploadingPhoto}
          style={{
            ...btn,
            width: "100%",
            fontSize: 22,
            padding: 18,
            opacity: saving || uploadingPhoto ? 0.65 : 1,
          }}
        >
          {saving ? "Saving Profile..." : uploadingPhoto ? "Uploading Photo..." : "Save Smart Profile"}
        </button>
      </div>
    </main>
  );
}

function ChipGroup({
  values,
  options,
  onToggle,
}: {
  values: string[];
  options: string[];
  onToggle: (value: string) => void;
}) {
  const selected = asArray(values);

  return (
    <div style={chipWrap}>
      {options.map((option) => {
        const active = selected.some((item) => chipsMatch(item, option));

        return (
          <button
            key={option}
            type="button"
            onClick={() => onToggle(option)}
            style={{
              border: active
                ? "1px solid rgba(157,243,191,.85)"
                : "1px solid rgba(255,255,255,.16)",
              background: active
                ? "linear-gradient(135deg, rgba(157,243,191,.22), rgba(181,92,255,.14))"
                : "rgba(255,255,255,.04)",
              color: active ? "#9df3bf" : "white",
              borderRadius: 999,
              padding: "11px 14px",
              fontWeight: 900,
              cursor: "pointer",
              boxShadow: active ? "0 0 0 1px rgba(157,243,191,.18) inset" : "none",
            }}
          >
            {active ? "✓ " : ""}
            {option}
          </button>
        );
      })}
    </div>
  );
}

function Field({
  label: labelText,
  value,
  onChange,
  placeholder = "",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label style={label}>{labelText}</label>
      <input
        style={input}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

function Select({
  label: labelText,
  value,
  onChange,
  options,
  labels = {},
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  labels?: Record<string, string>;
}) {
  return (
    <div>
      <label style={label}>{labelText}</label>
      <select
        style={input}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="" style={{ color: "#111" }}>Select</option>
        {options.map((option) => (
          <option key={option} value={option} style={{ color: "#111" }}>
            {labels[option] || option}
          </option>
        ))}
      </select>
    </div>
  );
}

function Text({
  label: labelText,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label style={label}>{labelText}</label>
      <textarea
        style={{ ...input, minHeight: 150, resize: "vertical" }}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
