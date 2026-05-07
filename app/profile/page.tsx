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
];

const NEED_OPTIONS = [
  "Funding",
  "Buyer Needed",
  "Seller Leads",
  "Contractor Needed",
  "JV Partner",
  "Operator Needed",
  "Off-Market Deals",
  "Disposition Help",
  "Due Diligence",
  "Property Management",
  "Title/Closing Help",
  "Creative Finance",
];

const CAN_PROVIDE_OPTIONS = [
  "Cash Buyer",
  "Private Lending",
  "Hard Money",
  "Contractor Crew",
  "Deal Sourcing",
  "Disposition",
  "Project Management",
  "Construction",
  "Realtor Access",
  "MLS Access",
  "Wholesaling",
  "Land Development",
  "Commercial Analysis",
  "Local Market Knowledge",
];

const ALERT_TYPE_OPTIONS = [
  "Deal matches my buy box",
  "New deal in my market",
  "Buyer match",
  "Funding match",
  "Contractor/operator match",
  "JV opportunity",
  "Distressed opportunity",
  "High-margin deal",
  "Someone saves my deal",
  "Someone messages me",
  "Price drop or status change",
  "AI opportunity signal",
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
    "radial-gradient(circle at top left, rgba(181,92,255,.24), transparent 28%), radial-gradient(circle at top right, rgba(157,243,191,.18), transparent 24%), radial-gradient(circle at bottom right, rgba(232,196,107,.16), transparent 28%), linear-gradient(180deg,#02040a 0%,#071326 45%,#03110d 100%)",
  color: "white",
  padding: "28px 18px 90px",
  fontFamily: "Arial, sans-serif",
};

const wrap: React.CSSProperties = { maxWidth: 1060, margin: "0 auto" };

const hero: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.30)",
  background: "linear-gradient(135deg, rgba(181,92,255,.18), rgba(157,243,191,.08), rgba(255,255,255,.03))",
  borderRadius: 34,
  padding: 26,
  marginBottom: 22,
  boxShadow: "0 38px 110px rgba(0,0,0,.46)",
};

const pane: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.13)",
  background: "linear-gradient(145deg, rgba(181,92,255,.10), rgba(157,243,191,.06), rgba(255,255,255,.03))",
  borderRadius: 28,
  padding: 22,
  marginBottom: 18,
};

const goldPane: React.CSSProperties = {
  ...pane,
  border: "1px solid rgba(232,196,107,.28)",
  background:
    "linear-gradient(145deg, rgba(232,196,107,.12), rgba(181,92,255,.10), rgba(255,255,255,.03))",
};

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
  gap: 14,
};

const btn: React.CSSProperties = {
  display: "inline-block",
  background: "linear-gradient(135deg,#f5d978,#9df3bf 55%,#b55cff)",
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
  background: "linear-gradient(145deg, rgba(181,92,255,.10), rgba(157,243,191,.06), rgba(255,255,255,.03))",
  margin: "7px 7px 0 0",
};

const input: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  borderRadius: 18,
  border: "1px solid rgba(255,255,255,.18)",
  background: "linear-gradient(135deg, rgba(181,92,255,.14), rgba(255,255,255,.06))",
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

function joinList(value: any) {
  return asArray(value).join(", ");
}

function completionScore(form: Record<string, any>) {
  const required = ["email", "full_name", "phone", "role", "city", "state"];
  const requiredDone = required.filter((key) => String(form[key] || "").trim()).length;

  const intelligenceFields = [
    form.member_types?.length,
    form.buy_box_states?.length,
    form.buy_box_types?.length,
    form.buy_box_strategies?.length,
    form.needs?.length,
    form.can_provide?.length,
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
  if (list.includes(value)) return list.filter((item) => item !== value);
  return [...list, value];
}

export default function ProfilePage() {
  const [form, setForm] = useState<Record<string, any>>({
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
    alert_types: ["Deal matches my buy box", "Someone messages me", "Funding needed"],
    member_types: ["Buyer"],
    buy_box_states: ["Georgia"],
    buy_box_types: [],
    buy_box_strategies: [],
    needs: [],
    can_provide: [],
  });

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
      const res = await fetch(`/api/profile/me?email=${encodeURIComponent(email)}`, {
        cache: "no-store",
        headers: { "x-vf-email": email },
      });

      const data = await res.json();
      const profile = data?.profile || {};

      const loadedMemberTypes = asArray(profile.member_types || profile.memberTypes);
      const loadedStates = asArray(profile.buy_box_states || profile.markets || profile.market_states);
      const loadedTypes = asArray(profile.buy_box_types || profile.property_types || profile.asset_types);
      const loadedStrategies = asArray(profile.buy_box_strategies || profile.strategies);
      const loadedNeeds = asArray(profile.needs || profile.deal_needs || profile.what_i_need);
      const loadedProvide = asArray(profile.can_provide || profile.what_i_provide);

      setForm({
        email: profile.email || email,
        full_name: profile.full_name || profile.fullName || profile.name || "",
        phone: profile.phone || "",
        company: profile.company || "",
        role: profile.role || profile.member_role || loadedMemberTypes[0] || "",
        city: profile.city || "",
        state: profile.state || loadedStates[0] || "Georgia",
        markets: profile.markets || joinList(loadedStates),
        member_types: loadedMemberTypes.length ? loadedMemberTypes : asArray(profile.role || profile.member_role),
        buy_box: profile.buy_box || profile.buyBox || "",
        funding_capacity: profile.funding_capacity || profile.fundingCapacity || "",
        strategy: profile.strategy || "",
        profile_photo_url: profile.profile_photo_url || profile.profilePhotoUrl || "",
        alert_frequency: profile.alert_frequency || "daily_digest",
        max_alerts_per_day: String(profile.max_alerts_per_day || 10),
        alert_types: asArray(profile.alert_types).length
          ? asArray(profile.alert_types)
          : ["Deal matches my buy box", "Someone messages me", "Funding needed"],
        buy_box_states: loadedStates.length ? loadedStates : [profile.state || "Georgia"],
        buy_box_types: loadedTypes,
        buy_box_strategies: loadedStrategies,
        needs: loadedNeeds,
        can_provide: loadedProvide,
      });

      setComplete(Boolean(profile.profile_complete));
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
        member_types: asArray(form.member_types),
        buy_box_states: asArray(form.buy_box_states),
        buy_box_types: asArray(form.buy_box_types),
        buy_box_strategies: asArray(form.buy_box_strategies),
        needs: asArray(form.needs),
        deal_needs: asArray(form.needs),
        what_i_need: asArray(form.needs),
        can_provide: asArray(form.can_provide),
        what_i_provide: asArray(form.can_provide),
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

      setComplete(Boolean(data?.profile_complete));
      setStatus(
        data?.profile_complete
          ? "Profile complete. Smart routing is now stronger."
          : "Profile saved. Complete required fields to unlock payment step."
      );

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

  return (
    <main style={page}>
      <style>{`
        button:hover,
        a:hover {
          transform: translateY(-1px);
          transition: all .18s ease;
          filter: brightness(1.06);
        }

        @media (max-width: 760px) {
          button,
          a,
          input,
          select,
          textarea {
            box-sizing: border-box;
          }
        }
      `}</style>
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
            Your profile now powers smart alerts, member routing, deal matching, buy-box intelligence,
            market signals, and future AI recommendations.
          </p>
          <Link href="/dashboard" style={ghost}>Dashboard</Link>
          <Link href="/alerts" style={ghost}>Alerts</Link>
          <Link href="/payment" style={ghost}>Payment</Link>
          <Link href="/logout" style={ghost}>Logout</Link>
        </section>

        
        <section
          style={{
            ...goldPane,
            border: "1px solid rgba(181,92,255,.36)",
            background:
              "linear-gradient(145deg, rgba(181,92,255,.16), rgba(157,243,191,.08), rgba(255,255,255,.03))",
          }}
        >
          <div style={eyebrow}>VaultForge Intelligence Layer</div>

          <h2 style={{ fontSize: "clamp(38px,8vw,72px)", lineHeight: 0.95, margin: "0 0 14px" }}>
            Your profile powers the routing engine.
          </h2>

          <p style={{ ...muted, fontSize: 19 }}>
            VaultForge uses your markets, buy boxes, strategies, needs, capabilities,
            and alert settings to improve deal routing, member matching, distress signals,
            lender fit, operator fit, and future AI opportunity scoring.
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 16 }}>
            <span style={{
              border:"1px solid rgba(181,92,255,.40)",
              color:"#dcb8ff",
              borderRadius:999,
              padding:"10px 14px",
              fontWeight:900,
              background:"rgba(181,92,255,.12)"
            }}>
              Routing Ready: {progress}%
            </span>

            <span style={{
              border:"1px solid rgba(157,243,191,.40)",
              color:"#9df3bf",
              borderRadius:999,
              padding:"10px 14px",
              fontWeight:900,
              background:"rgba(157,243,191,.12)"
            }}>
              Markets: {asArray(form.buy_box_states).length}
            </span>

            <span style={{
              border:"1px solid rgba(245,217,120,.40)",
              color:"#f5d978",
              borderRadius:999,
              padding:"10px 14px",
              fontWeight:900,
              background:"rgba(245,217,120,.10)"
            }}>
              Roles: {asArray(form.member_types).length}
            </span>

            <span style={{
              border:"1px solid rgba(255,255,255,.20)",
              color:"white",
              borderRadius:999,
              padding:"10px 14px",
              fontWeight:900,
              background:"rgba(255,255,255,.05)"
            }}>
              Strategies: {asArray(form.buy_box_strategies).length}
            </span>
          </div>
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
            options={MEMBER_TYPE_OPTIONS}
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
            options={STATE_OPTIONS}
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
            options={PROPERTY_TYPE_OPTIONS}
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
            options={STRATEGY_OPTIONS}
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
            options={NEED_OPTIONS}
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
            options={CAN_PROVIDE_OPTIONS}
            onToggle={(value) => toggle("can_provide", value)}
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
              options={ALERT_TYPE_OPTIONS}
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
        const active = selected.includes(option);

        return (
          <button
            key={option}
            type="button"
            onClick={() => onToggle(option)}
            style={{
              border: active
                ? "1px solid rgba(157,243,191,.70)"
                : "1px solid rgba(255,255,255,.16)",
              background: active
                ? "rgba(157,243,191,.14)"
                : "rgba(255,255,255,.04)",
              color: active ? "#9df3bf" : "white",
              borderRadius: 999,
              padding: "11px 14px",
              fontWeight: 900,
              cursor: "pointer",
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
