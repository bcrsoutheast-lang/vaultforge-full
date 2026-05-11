"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import VaultForgeMemberNav from "../components/VaultForgeMemberNav";

const STATES = [
  "Georgia",
  "Florida",
  "North Carolina",
  "South Carolina",
  "Tennessee",
  "Alabama",
  "Texas",
];

const MEMBER_TYPES = ["Buyer", "Seller", "Lender", "Wholesaler", "Realtor", "Contractor", "Operator", "Attorney", "Property Manager", "Investor"];

const STRATEGIES = ["Flips", "BRRRR", "Buy & Hold", "Funding", "Land", "Residential", "Commercial", "Creative Finance", "JV Equity", "Disposition"];

const ASSET_FOCUS = ["SFR", "Multifamily", "Commercial", "Land", "Mobile Home Park", "Storage", "Mixed Use", "Distressed Property"];

const NEEDS = [
  "Buyer Needed",
  "Capital Needed",
  "Private Lender Needed",
  "Contractor Needed",
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

const CAN_PROVIDE = [
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

const PAIN_SIGNALS = [
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

type FormState = {
  full_name: string;
  company: string;
  phone: string;
  profile_photo_url: string;
  home_state: string;
  deal_states: string[];
  member_types: string[];
  strategies: string[];
  asset_focus: string[];
  needs: string[];
  can_provide: string[];
  pain_signals: string[];
  buy_box: string;
  funding_capacity: string;
  strategy_notes: string;
  network_accepted: boolean;
};

function clean(value: unknown) {
  return String(value || "").trim();
}

function cleanEmail(value: unknown) {
  return clean(value).toLowerCase();
}

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

  const keys = ["vf_email", "vf_member_email", "vf_admin_email", "email", "memberEmail"];

  for (const key of keys) {
    const localValue = cleanEmail(window.localStorage.getItem(key));
    if (localValue.includes("@")) return localValue;

    const sessionValue = cleanEmail(window.sessionStorage.getItem(key));
    if (sessionValue.includes("@")) return sessionValue;
  }

  return cleanEmail(readCookie("vf_email") || readCookie("vf_member_email") || readCookie("vf_admin_email"));
}

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

function arr(value: unknown) {
  if (Array.isArray(value)) return value.map(clean).filter(Boolean);
  if (typeof value === "string") return value.split(",").map(clean).filter(Boolean);
  return [];
}

function toggle(list: string[], value: string) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

function onlyAllowedStates(values: unknown) {
  const incoming = arr(values);
  const filtered = incoming.filter((state) => STATES.includes(state));
  return filtered.length ? filtered : ["Georgia"];
}

function uniq(values: string[]) {
  return Array.from(new Set(values.map(clean).filter(Boolean)));
}

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(232,196,107,.15), transparent 30%), radial-gradient(circle at 85% 10%, rgba(157,243,191,.10), transparent 28%), linear-gradient(180deg,#020303,#071326 55%,#020303)",
  color: "white",
  padding: "20px 16px 100px",
  fontFamily: "Arial, sans-serif",
};

const wrap: React.CSSProperties = { width: "min(1100px,100%)", margin: "0 auto" };

const card: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.24)",
  borderRadius: 28,
  padding: 24,
  background: "rgba(255,255,255,.05)",
  marginBottom: 18,
  boxShadow: "0 24px 80px rgba(0,0,0,.25)",
};

const input: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  borderRadius: 18,
  border: "1px solid rgba(255,255,255,.16)",
  background: "rgba(255,255,255,.08)",
  color: "white",
  padding: 14,
  fontSize: 16,
  outline: "none",
};

const sectionTitle: React.CSSProperties = {
  color: "#e8c46b",
  fontWeight: 950,
  fontSize: 18,
  letterSpacing: ".22em",
  marginBottom: 16,
  textTransform: "uppercase",
};

const label: React.CSSProperties = {
  color: "#e8c46b",
  fontWeight: 950,
  fontSize: 12,
  letterSpacing: ".16em",
  marginBottom: 8,
  textTransform: "uppercase",
};

const button: React.CSSProperties = {
  borderRadius: 999,
  padding: "14px 20px",
  border: 0,
  background: "linear-gradient(135deg,#f8e7b0,#e8c46b)",
  color: "#06100a",
  fontWeight: 950,
  cursor: "pointer",
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};

const ghost: React.CSSProperties = {
  ...button,
  border: "1px solid rgba(255,255,255,.14)",
  background: "rgba(255,255,255,.06)",
  color: "white",
};

const chipBase: React.CSSProperties = {
  borderRadius: 999,
  padding: "10px 14px",
  border: "1px solid rgba(255,255,255,.16)",
  background: "rgba(255,255,255,.06)",
  color: "white",
  cursor: "pointer",
  fontWeight: 900,
  margin: "0 8px 8px 0",
};

function Chip({
  value,
  selected,
  onClick,
}: {
  value: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...chipBase,
        border: selected ? "1px solid rgba(157,243,191,.42)" : chipBase.border,
        background: selected ? "rgba(157,243,191,.14)" : chipBase.background,
        color: selected ? "#9df3bf" : "white",
      }}
    >
      {value}
    </button>
  );
}

const defaultForm: FormState = {
  full_name: "",
  company: "",
  phone: "",
  profile_photo_url: "",
  home_state: "Georgia",
  deal_states: ["Georgia"],
  member_types: [],
  strategies: [],
  asset_focus: [],
  needs: [],
  can_provide: [],
  pain_signals: [],
  buy_box: "",
  funding_capacity: "",
  strategy_notes: "",
  network_accepted: true,
};

export default function ProfilePage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("Loading profile...");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(defaultForm);

  const routingScore = useMemo(() => {
    let score = 40;
    if (form.full_name) score += 5;
    if (form.company) score += 5;
    if (form.profile_photo_url) score += 8;
    if (form.home_state) score += 5;
    if (form.deal_states.length) score += 8;
    if (form.member_types.length) score += 8;
    if (form.strategies.length) score += 8;
    if (form.asset_focus.length) score += 6;
    if (form.needs.length) score += 6;
    if (form.can_provide.length) score += 8;
    if (form.pain_signals.length) score += 5;
    if (form.buy_box) score += 5;
    if (form.network_accepted) score += 4;
    return Math.min(100, score);
  }, [form]);

  async function loadProfile() {
    const currentEmail = getEmail();
    setEmail(currentEmail);

    if (!currentEmail) {
      setStatus("Login email not found. Please log in again.");
      return;
    }

    try {
      const res = await fetch(`/api/profile?email=${encodeURIComponent(currentEmail)}`, {
        cache: "no-store",
        headers: { "x-vf-email": currentEmail },
      });

      const data = await safeJson(res);
      const profile = data.profile || data.data || {};
      const metadata = typeof profile.metadata === "object" && profile.metadata ? profile.metadata : {};

      const loadedStates = onlyAllowedStates(
        profile.deal_states ||
          profile.markets ||
          profile.states ||
          profile.operating_states ||
          metadata.deal_states ||
          metadata.markets
      );

      const loadedHome = clean(
        profile.home_state ||
          profile.market_primary ||
          profile.primary_market ||
          metadata.home_state ||
          metadata.market_primary ||
          loadedStates[0] ||
          "Georgia"
      );

      setForm({
        full_name: clean(profile.full_name || metadata.full_name),
        company: clean(profile.company || profile.company_name || metadata.company),
        phone: clean(profile.phone || metadata.phone),
        profile_photo_url: clean(profile.profile_photo_url || profile.photo_url || profile.avatar_url || metadata.profile_photo_url),
        home_state: STATES.includes(loadedHome) ? loadedHome : "Georgia",
        deal_states: loadedStates,
        member_types: arr(profile.member_types || profile.member_type || profile.roles || metadata.member_types),
        strategies: arr(profile.strategies || profile.strategy || metadata.strategies),
        asset_focus: arr(profile.asset_focus || metadata.asset_focus),
        needs: arr(profile.needs || metadata.needs),
        can_provide: arr(profile.can_provide || metadata.can_provide),
        pain_signals: arr(profile.pain_signals || metadata.pain_signals),
        buy_box: clean(profile.buy_box || profile.buy_box_focus || metadata.buy_box),
        funding_capacity: clean(profile.funding_capacity || profile.capital_capacity || metadata.funding_capacity),
        strategy_notes: clean(profile.strategy_notes || profile.notes || metadata.strategy_notes),
        network_accepted: Boolean(profile.network_accepted ?? profile.accepted_to_network ?? profile.available_to_network ?? metadata.network_accepted ?? true),
      });

      setStatus(data.ok === false ? clean(data.error || "Profile loaded with warnings.") : "Profile loaded.");
    } catch (error: any) {
      setStatus(clean(error?.message || "Could not load profile."));
    }
  }

  useEffect(() => {
    loadProfile();
  }, []);

  async function uploadFile(file: File) {
    const body = new FormData();
    body.append("file", file);
    body.append("email", email);

    const res = await fetch("/api/uploads/profile", {
      method: "POST",
      headers: { "x-vf-email": email },
      body,
    });

    const data = await safeJson(res);

    if (!res.ok || data.ok === false) {
      throw new Error(clean(data.error || data.details || "Upload failed."));
    }

    return clean(data.profile_photo_url || data.photo_url || data.url || data.publicUrl || data.image_url);
  }

  async function saveProfile() {
    setSaving(true);
    setStatus("Saving profile...");

    try {
      const dealStates = onlyAllowedStates(form.deal_states);

      const res = await fetch("/api/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-vf-email": email,
        },
        body: JSON.stringify({
          email,
          full_name: form.full_name,
          company: form.company,
          company_name: form.company,
          phone: form.phone,
          profile_photo_url: form.profile_photo_url,
          photo_url: form.profile_photo_url,
          home_state: form.home_state,
          market_primary: form.home_state,
          primary_market: form.home_state,
          deal_states: dealStates,
          markets: uniq([form.home_state, ...dealStates]),
          states: uniq([form.home_state, ...dealStates]),
          operating_states: dealStates,
          member_types: form.member_types,
          roles: form.member_types,
          strategies: form.strategies,
          asset_focus: form.asset_focus,
          needs: form.needs,
          can_provide: form.can_provide,
          pain_signals: form.pain_signals,
          buy_box: form.buy_box,
          funding_capacity: form.funding_capacity,
          strategy_notes: form.strategy_notes,
          network_accepted: form.network_accepted,
          accepted_to_network: form.network_accepted,
          available_to_network: form.network_accepted,
          routing_score: routingScore,
        }),
      });

      const data = await safeJson(res);

      if (!res.ok || data.ok === false) {
        throw new Error(clean(data.error || data.message || "Profile save failed."));
      }

      setStatus("Profile saved.");
      await loadProfile();
    } catch (error: any) {
      setStatus(clean(error?.message || "Could not save profile."));
    } finally {
      setSaving(false);
    }
  }

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function chipSection(title: string, values: string[], selected: string[], key: keyof FormState) {
    return (
      <section style={card}>
        <div style={sectionTitle}>{title}</div>
        <div>
          {values.map((value) => (
            <Chip
              key={value}
              value={value}
              selected={selected.includes(value)}
              onClick={() => update(key as any, toggle(selected, value) as any)}
            />
          ))}
        </div>
      </section>
    );
  }

  return (
    <main style={page}>
      <style>{`
        button:hover, a:hover {
          transform: translateY(-1px);
          transition: all .18s ease;
          filter: brightness(1.06);
        }

        input::placeholder, textarea::placeholder {
          color: rgba(255,255,255,.42);
        }

        @media (max-width: 760px) {
          .vf-grid {
            grid-template-columns: 1fr !important;
          }

          .vf-actions {
            display: grid !important;
            grid-template-columns: 1fr !important;
            gap: 10px !important;
          }

          .vf-actions > * {
            width: 100%;
            box-sizing: border-box;
            justify-content: center;
          }
        }
      `}</style>

      <div style={wrap}>
        <VaultForgeMemberNav
          title="Profile"
          subtitle="Network identity, state intelligence, and execution profile."
          active="profile"
        />

        <section style={card}>
          <div style={sectionTitle}>Member Profile</div>

          <h1 style={{ fontSize: "clamp(52px,9vw,96px)", lineHeight: .92, margin: "10px 0 18px", letterSpacing: "-.06em" }}>
            Network identity.
          </h1>

          <p style={{ color: "#cbd5e1", fontSize: 18, lineHeight: 1.5 }}>
            Upload a real profile photo, set your home state, select where you deal, and keep your routing profile clean.
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 18 }}>
            <div style={{ border: "1px solid rgba(255,255,255,.14)", borderRadius: 999, padding: "8px 14px" }}>
              Email: {email || "unknown"}
            </div>

            <div style={{ border: "1px solid rgba(255,255,255,.14)", borderRadius: 999, padding: "8px 14px" }}>
              Routing score: {routingScore}
            </div>

            <div style={{ border: "1px solid rgba(157,243,191,.22)", color: "#9df3bf", borderRadius: 999, padding: "8px 14px" }}>
              Network: {form.network_accepted ? "Accepted" : "Not accepted"}
            </div>
          </div>
        </section>

        <section style={card}>
          <h2 style={{ marginTop: 0 }}>{status}</h2>
        </section>

        <section style={card}>
          <div style={sectionTitle}>Profile Basics</div>

          <div className="vf-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 16 }}>
            <div>
              <div style={label}>Name</div>
              <input style={input} value={form.full_name} onChange={(e) => update("full_name", e.target.value)} />
            </div>

            <div>
              <div style={label}>Company</div>
              <input style={input} value={form.company} onChange={(e) => update("company", e.target.value)} />
            </div>

            <div>
              <div style={label}>Phone</div>
              <input style={input} value={form.phone} onChange={(e) => update("phone", e.target.value)} />
            </div>

            <div>
              <div style={label}>Profile Photo</div>

              <input
                type="file"
                accept="image/*"
                style={input}
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;

                  setStatus("Uploading profile photo...");

                  try {
                    const url = await uploadFile(file);
                    if (!url) throw new Error("Upload failed.");

                    update("profile_photo_url", url);
                    setStatus("Photo uploaded. Hit Save Profile to lock it in.");
                  } catch (error: any) {
                    setStatus(error?.message || "Upload failed.");
                  }
                }}
              />

              <div style={{ color: "#cbd5e1", marginTop: 8 }}>
                Use phone pictures or upload a file. No URL needed.
              </div>
            </div>
          </div>

          {form.profile_photo_url ? (
            <div style={{ marginTop: 20 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={form.profile_photo_url}
                alt="Profile"
                style={{
                  width: "100%",
                  maxHeight: 420,
                  objectFit: "cover",
                  borderRadius: 22,
                  border: "1px solid rgba(232,196,107,.20)",
                }}
              />
            </div>
          ) : null}
        </section>

        <section style={card}>
          <div style={sectionTitle}>State Intelligence</div>

          <div className="vf-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 16 }}>
            <div>
              <div style={label}>Where are you from?</div>

              <select style={input} value={form.home_state} onChange={(e) => update("home_state", e.target.value)}>
                {STATES.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div style={label}>Where do you deal?</div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {STATES.map((state) => (
                  <Chip
                    key={state}
                    value={state}
                    selected={form.deal_states.includes(state)}
                    onClick={() => update("deal_states", toggle(form.deal_states, state))}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {chipSection("I Am", MEMBER_TYPES, form.member_types, "member_types")}
        {chipSection("Strategies", STRATEGIES, form.strategies, "strategies")}
        {chipSection("Asset Focus", ASSET_FOCUS, form.asset_focus, "asset_focus")}
        {chipSection("What You Need", NEEDS, form.needs, "needs")}
        {chipSection("What You Can Provide", CAN_PROVIDE, form.can_provide, "can_provide")}
        {chipSection("Pain / Distress Signals", PAIN_SIGNALS, form.pain_signals, "pain_signals")}

        <section style={card}>
          <div style={sectionTitle}>Buy Box Details</div>

          <div className="vf-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 16 }}>
            <div>
              <div style={label}>Buy Box / Focus</div>
              <input style={input} value={form.buy_box} onChange={(e) => update("buy_box", e.target.value)} placeholder="SFR flips, 70% ARV, land, commercial..." />
            </div>

            <div>
              <div style={label}>Funding Capacity</div>
              <input style={input} value={form.funding_capacity} onChange={(e) => update("funding_capacity", e.target.value)} placeholder="5,000,000" />
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <div style={label}>Strategy / Notes / What You Want VaultForge To Watch For</div>
            <textarea
              style={{ ...input, minHeight: 160 }}
              value={form.strategy_notes}
              onChange={(e) => update("strategy_notes", e.target.value)}
              placeholder="Flips, funding, land, residential, commercial..."
            />
          </div>
        </section>

        <section style={card}>
          <div style={sectionTitle}>Network Acceptance</div>
          <label style={{ display: "flex", gap: 12, alignItems: "flex-start", color: "#cbd5e1", lineHeight: 1.5 }}>
            <input
              type="checkbox"
              checked={form.network_accepted}
              onChange={(e) => update("network_accepted", e.target.checked)}
              style={{ width: 22, height: 22, marginTop: 4 }}
            />
            I agree to be visible inside the VaultForge member network for controlled routing, introductions, and connection requests.
          </label>
        </section>

        <section style={{ ...card, position: "sticky", bottom: 12, zIndex: 20, backdropFilter: "blur(16px)" }}>
          <div className="vf-actions" style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            <button type="button" style={button} disabled={saving} onClick={saveProfile}>
              {saving ? "Saving..." : "Save Profile"}
            </button>

            <Link href="/members" style={ghost}>
              Back to Members
            </Link>

            <button type="button" style={ghost} onClick={loadProfile}>
              Reload Profile
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
