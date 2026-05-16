"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import VaultForgeMemberNav from "../components/VaultForgeMemberNav";

type ProfileForm = {
  photo_url: string;
  full_name: string;
  company: string;
  phone: string;
  email: string;
  website: string;
  bio: string;
  state_from: string;
  city_from: string;
  states_operated: string[];
  counties_operated: string;
  roles: string[];
  buy_box: string[];
  strategies: string[];
  capabilities: string[];
  pressure_solutions: string[];
  needs: string[];
  min_deal_size: string;
  max_deal_size: string;
  max_capital: string;
  bandwidth: string;
  notes: string;
  contact_visibility: string;
};

const STATES = [
  "Georgia",
  "Tennessee",
  "Alabama",
  "Florida",
  "North Carolina",
  "South Carolina",
  "Texas",
];

const ROLES = [
  "Buyer",
  "Investor",
  "Wholesaler",
  "Lender",
  "Private Money",
  "Contractor",
  "Operator",
  "Developer",
  "Realtor",
  "Broker",
  "Property Manager",
  "Capital Partner",
  "JV Partner",
  "Deal Source",
];

const BUY_BOX = [
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

const STRATEGIES = [
  "Fix & Flip",
  "Buy & Hold",
  "BRRRR",
  "Wholesale",
  "Development",
  "Seller Finance",
  "Subject-To",
  "Novation",
  "Creative Finance",
  "Value Add",
  "Distressed",
  "Ground Up",
  "Subdivision",
  "Entitlement",
];

const CAPABILITIES = [
  "Cash Buyer",
  "Private Lending",
  "Hard Money",
  "Full Rehab",
  "Light Rehab",
  "Ground-Up Construction",
  "Permits",
  "City Negotiation",
  "Title Problem Solving",
  "Disposition",
  "Operator Management",
  "Contractor Crew",
  "Property Management",
];

const PRESSURE = [
  "Foreclosure",
  "Probate",
  "Title Issues",
  "Contractor Failure",
  "Funding Gap",
  "Vacant Property",
  "Hoarder House",
  "Tenant Issues",
  "City Violations",
  "Stalled Construction",
  "Partnership Dispute",
  "Emergency Exit",
];

const NEEDS = [
  "Funding",
  "Buyer Needed",
  "Lender Needed",
  "Private Capital Needed",
  "Seller Leads",
  "Contractor Needed",
  "Operator Needed",
  "JV Partner Needed",
  "Title Help",
  "Disposition Help",
  "Permit Help",
  "Deal Flow",
];

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

  const keys = ["memberEmail", "vf_member_email", "email", "vf_email"];

  for (const key of keys) {
    try {
      const localValue = cleanEmail(window.localStorage.getItem(key));
      if (localValue.includes("@")) return localValue;

      const sessionValue = cleanEmail(window.sessionStorage.getItem(key));
      if (sessionValue.includes("@")) return sessionValue;
    } catch {
      // Continue.
    }
  }

  const cookieKeys = ["vf_member_email", "memberEmail", "email", "vf_email"];

  for (const key of cookieKeys) {
    const value = cleanEmail(readCookie(key));
    if (value.includes("@")) return value;
  }

  return "";
}

function initials(nameOrEmail: string) {
  const text = clean(nameOrEmail);
  if (!text) return "VF";

  const name = text.includes("@") ? text.split("@")[0] : text;
  const parts = name.split(/[\s._-]+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0] || "V"}${parts[1][0] || "F"}`.toUpperCase();
  }

  return name.slice(0, 2).toUpperCase();
}

function storageKey(email: string) {
  return `vaultforge_final_member_profile_${email || "guest"}`;
}

function defaultForm(email = ""): ProfileForm {
  return {
    photo_url: "",
    full_name: "",
    company: "",
    phone: "",
    email,
    website: "",
    bio: "",
    state_from: "",
    city_from: "",
    states_operated: [],
    counties_operated: "",
    roles: [],
    buy_box: [],
    strategies: [],
    capabilities: [],
    pressure_solutions: [],
    needs: [],
    min_deal_size: "",
    max_deal_size: "",
    max_capital: "",
    bandwidth: "Available",
    notes: "",
    contact_visibility: "Members can request intro",
  };
}

function loadLocal(email: string): Partial<ProfileForm> {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(storageKey(email));
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function saveLocal(email: string, form: ProfileForm) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(storageKey(email), JSON.stringify(form));
}

function unique(items: string[]) {
  return Array.from(new Set(items.map(clean).filter(Boolean)));
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

function profileScore(form: ProfileForm) {
  let score = 0;

  if (form.photo_url) score += 8;
  if (form.full_name) score += 8;
  if (form.company) score += 6;
  if (form.phone) score += 6;
  if (form.bio) score += 6;
  if (form.state_from) score += 10;
  if (form.states_operated.length) score += 12;
  if (form.counties_operated) score += 8;
  if (form.roles.length) score += 12;
  if (form.buy_box.length) score += 8;
  if (form.strategies.length) score += 8;
  if (form.capabilities.length) score += 8;
  if (form.pressure_solutions.length) score += 6;
  if (form.needs.length) score += 4;

  return Math.min(100, score);
}

function routingRead(form: ProfileForm) {
  if (form.roles.includes("Lender") || form.roles.includes("Private Money") || form.capabilities.includes("Private Lending")) {
    return "Capital-side member. Route funding gaps, bridge needs, private lending requests, and capital-stack opportunities.";
  }

  if (form.roles.includes("Contractor") || form.roles.includes("Operator") || form.capabilities.includes("Contractor Crew")) {
    return "Execution-side member. Route rehab, contractor failure, operator-needed rooms, and stalled project pressure.";
  }

  if (form.roles.includes("Buyer") || form.roles.includes("Investor")) {
    return "Buyer/operator member. Route hot opportunities, distressed seller exits, and acquisition rooms.";
  }

  if (form.pressure_solutions.length) {
    return "Pressure-solving member. Route problem rooms that need structure, speed, negotiation, and cleanup.";
  }

  return "Add role stack, states operated, and capabilities so VaultForge can route rooms intelligently.";
}

function directoryRead(form: ProfileForm) {
  if (!form.state_from) return "Member will not be searchable by home state yet.";
  return `Member appears in the ${form.state_from} member directory${form.city_from ? ` near ${form.city_from}` : ""}.`;
}

function routingMarketRead(form: ProfileForm) {
  if (!form.states_operated.length) return "No routing markets selected yet.";
  return `AI can route rooms in: ${form.states_operated.join(", ")}.`;
}

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(232,196,107,.15), transparent 28%), radial-gradient(circle at 88% 8%, rgba(86,216,255,.10), transparent 26%), linear-gradient(180deg,#020303,#071326 55%,#020303)",
  color: "white",
  padding: "22px 16px 120px",
  fontFamily: "Arial, sans-serif",
};

const wrap: React.CSSProperties = {
  width: "min(1220px,100%)",
  margin: "0 auto",
};

const card: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.22)",
  borderRadius: 28,
  background: "linear-gradient(145deg,rgba(255,255,255,.065),rgba(255,255,255,.025))",
  padding: 20,
  marginBottom: 16,
  boxShadow: "0 22px 70px rgba(0,0,0,.28)",
};

const compactCard: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.12)",
  borderRadius: 20,
  padding: 14,
  background: "rgba(255,255,255,.045)",
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

const input: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  borderRadius: 15,
  border: "1px solid rgba(255,255,255,.14)",
  background: "rgba(0,0,0,.24)",
  color: "white",
  padding: 12,
  fontSize: 14,
  outline: "none",
};

const button: React.CSSProperties = {
  minHeight: 46,
  borderRadius: 999,
  padding: "11px 16px",
  background: "linear-gradient(135deg,#f8e7b0,#e8c46b)",
  color: "#06100a",
  fontWeight: 950,
  textDecoration: "none",
  border: 0,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
};

const ghost: React.CSSProperties = {
  ...button,
  border: "1px solid rgba(255,255,255,.14)",
  background: "rgba(255,255,255,.060)",
  color: "white",
};

function ToggleChip({
  active,
  children,
  onClick,
  tone = "#9df3bf",
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
  tone?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        border: active ? `1px solid ${tone}` : "1px solid rgba(255,255,255,.13)",
        background: active ? "rgba(157,243,191,.10)" : "rgba(255,255,255,.035)",
        color: active ? tone : "#cbd5e1",
        borderRadius: 999,
        padding: "8px 11px",
        fontWeight: 900,
        fontSize: 13,
        cursor: "pointer",
      }}
    >
      {active ? "✓ " : ""}
      {children}
    </button>
  );
}

function Mini({ title, value, tone = "#e8c46b" }: { title: string; value: unknown; tone?: string }) {
  return (
    <section style={{ ...compactCard, borderColor: `${tone}44` }}>
      <div style={{ ...label, color: tone }}>{title}</div>
      <div style={{ fontSize: 19, fontWeight: 1000, marginTop: 8 }}>{clean(value) || "Not set"}</div>
    </section>
  );
}

function ChipGroup({
  title,
  items,
  selected,
  onToggle,
  tone,
}: {
  title: string;
  items: string[];
  selected: string[];
  onToggle: (value: string) => void;
  tone: string;
}) {
  return (
    <section style={card}>
      <div style={label}>{title}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 9, marginTop: 12 }}>
        {items.map((item) => (
          <ToggleChip key={item} active={selected.includes(item)} tone={tone} onClick={() => onToggle(item)}>
            {item}
          </ToggleChip>
        ))}
      </div>
    </section>
  );
}

export default function ProfileDashboardPage() {
  const [email, setEmail] = useState("");
  const [form, setForm] = useState<ProfileForm>(defaultForm());
  const [status, setStatus] = useState("");

  useEffect(() => {
    const activeEmail = getEmail();
    setEmail(activeEmail);

    const local = loadLocal(activeEmail);
    setForm((prev) => ({
      ...prev,
      ...local,
      email: activeEmail,
    }));

    async function loadProfile() {
      try {
        const response = await fetch(`/api/profile?email=${encodeURIComponent(activeEmail)}`, {
          method: "GET",
          credentials: "include",
          headers: { "x-vf-email": activeEmail },
          cache: "no-store",
        });

        const data = await response.json().catch(() => ({}));
        const profile = data?.profile || data?.member || data?.data || data || {};
        const intelligence = profile.profile_intelligence || profile.intelligence_profile || {};

        if (profile && typeof profile === "object") {
          setForm((prev) => ({
            ...prev,
            photo_url: prev.photo_url || clean(intelligence.photo_url) || clean(profile.photo_url) || clean(profile.avatar_url),
            full_name: prev.full_name || clean(intelligence.full_name) || clean(profile.full_name) || clean(profile.name),
            company: prev.company || clean(intelligence.company) || clean(profile.company),
            phone: prev.phone || clean(intelligence.phone) || clean(profile.phone),
            website: prev.website || clean(intelligence.website) || clean(profile.website),
            bio: prev.bio || clean(intelligence.bio) || clean(profile.bio),
            state_from: prev.state_from || clean(intelligence.state_from) || clean(profile.state_from) || clean(profile.home_state),
            city_from: prev.city_from || clean(intelligence.city_from) || clean(profile.city_from) || clean(profile.city),
            states_operated: unique([
              ...(prev.states_operated || []),
              ...parseList(intelligence.states_operated),
              ...parseList(profile.states_operated),
              ...parseList(profile.operating_states),
            ]),
            counties_operated: prev.counties_operated || clean(intelligence.counties_operated) || clean(profile.counties_operated),
            roles: unique([...(prev.roles || []), ...parseList(intelligence.roles), ...parseList(profile.roles), ...parseList(profile.member_type)]),
            buy_box: unique([...(prev.buy_box || []), ...parseList(intelligence.buy_box), ...parseList(profile.buy_box), ...parseList(profile.asset_types)]),
            strategies: unique([...(prev.strategies || []), ...parseList(intelligence.strategies), ...parseList(profile.strategies)]),
            capabilities: unique([...(prev.capabilities || []), ...parseList(intelligence.capabilities), ...parseList(intelligence.execution)]),
            pressure_solutions: unique([...(prev.pressure_solutions || []), ...parseList(intelligence.pressure_solutions), ...parseList(intelligence.pressure)]),
            needs: unique([...(prev.needs || []), ...parseList(intelligence.needs)]),
          }));
        }
      } catch {
        // local still works
      }
    }

    loadProfile();
  }, []);

  function update(key: keyof ProfileForm, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggle(key: keyof ProfileForm, value: string) {
    setForm((prev) => {
      const current = Array.isArray(prev[key]) ? (prev[key] as string[]) : [];
      const exists = current.includes(value);
      const next = exists ? current.filter((item) => item !== value) : [...current, value];
      return { ...prev, [key]: next };
    });
  }

  function onPhotoChange(file: File | null) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setForm((prev) => ({ ...prev, photo_url: String(reader.result || "") }));
      setStatus("Photo loaded. Hit Save Profile to keep it.");
    };
    reader.readAsDataURL(file);
  }

  async function submitProfile() {
    const payload = {
      ...form,
      email,
      profile_intelligence: form,
      profile_complete: true,
      updated_at: new Date().toISOString(),
    };

    saveLocal(email, form);
    setStatus("Saving profile...");

    try {
      const response = await fetch("/api/profile", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "x-vf-email": email,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok && data?.ok !== false) {
        setStatus("Profile saved.");
        return;
      }

      setStatus("Profile saved locally. Backend profile mapping can be hardened later.");
    } catch {
      setStatus("Profile saved locally. Backend save can be hardened later.");
    }
  }

  const score = useMemo(() => profileScore(form), [form]);
  const read = useMemo(() => routingRead(form), [form]);
  const directory = useMemo(() => directoryRead(form), [form]);
  const markets = useMemo(() => routingMarketRead(form), [form]);
  const displayName = form.full_name || email || "Member";

  return (
    <main style={page}>
      <style>{`
        a:hover, button:hover {
          transform: translateY(-1px);
          transition: all .18s ease;
          filter: brightness(1.06);
        }

        input::placeholder,
        textarea::placeholder {
          color: rgba(255,255,255,.45);
        }

        .vf-sticky-save {
          position: sticky;
          bottom: 12px;
          z-index: 30;
          margin-top: 14px;
        }

        @media(max-width:760px) {
          .vf-grid,
          .vf-hero-grid,
          .vf-two {
            grid-template-columns: 1fr !important;
          }

          .vf-actions {
            display: grid !important;
            gap: 9px !important;
          }

          .vf-actions > * {
            width: 100%;
            box-sizing: border-box;
          }

          .vf-photo {
            width: 126px !important;
            height: 126px !important;
            border-radius: 30px !important;
          }

          .vf-title {
            font-size: 44px !important;
          }

          .vf-card {
            padding: 16px !important;
            border-radius: 24px !important;
          }
        }
      `}</style>

      <div style={wrap}>
        <VaultForgeMemberNav
          title="Member Profile"
          subtitle="Profile powers directory lookup, AI routing, network visibility, and room matching."
          active="profile"
        />

        <section className="vf-card" style={card}>
          <div className="vf-hero-grid" style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: 18, alignItems: "center" }}>
            <section style={{ textAlign: "center" }}>
              <div
                className="vf-photo"
                style={{
                  width: 146,
                  height: 146,
                  borderRadius: 36,
                  border: "1px solid rgba(232,196,107,.38)",
                  display: "grid",
                  placeItems: "center",
                  background: "linear-gradient(145deg,rgba(255,255,255,.10),rgba(255,255,255,.03))",
                  boxShadow: "0 22px 64px rgba(0,0,0,.34)",
                  overflow: "hidden",
                  margin: "0 auto 10px",
                }}
              >
                {form.photo_url ? (
                  <img src={form.photo_url} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <span style={{ fontSize: 46, fontWeight: 1000, color: "#f8e7b0" }}>{initials(displayName)}</span>
                )}
              </div>

              <label style={{ ...ghost, cursor: "pointer", width: "100%", boxSizing: "border-box", minHeight: 42 }}>
                Upload Pic
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => onPhotoChange(event.target.files?.[0] || null)}
                  style={{ display: "none" }}
                />
              </label>
            </section>

            <section>
              <div style={label}>Operator Identity</div>
              <h1 className="vf-title" style={{ fontSize: "clamp(50px,9vw,86px)", lineHeight: 0.9, letterSpacing: "-.065em", margin: "10px 0 12px" }}>
                {displayName === "Member" ? "Build your routing profile." : displayName}
              </h1>

              <p style={{ ...muted, fontSize: 18, maxWidth: 880, margin: 0 }}>
                State From controls member lookup. States Operated In controls AI routing. This profile tells VaultForge who to show you to and what rooms to route to you.
              </p>

              <div className="vf-actions" style={{ display: "flex", flexWrap: "wrap", gap: 9, marginTop: 14 }}>
                <button type="button" onClick={submitProfile} style={button}>Save Profile</button>
                <Link href="/dashboard" style={ghost}>Command</Link>
                <Link href="/members" style={ghost}>Network</Link>
              </div>

              {status ? <p style={{ color: status.includes("saved") || status.includes("loaded") ? "#9df3bf" : "#f8e7b0", fontWeight: 900, marginBottom: 0 }}>{status}</p> : null}
            </section>
          </div>
        </section>

        <section className="vf-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 12, marginBottom: 16 }}>
          <Mini title="Routing Strength" value={`${score}%`} tone="#9df3bf" />
          <Mini title="Directory State" value={form.state_from || "Not set"} tone="#56d8ff" />
          <Mini title="AI Markets" value={form.states_operated.length} tone="#e8c46b" />
          <Mini title="Roles" value={form.roles.length} tone="#fecaca" />
        </section>

        <section className="vf-two" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          <section className="vf-card" style={card}>
            <div style={label}>How Members Find You</div>
            <p style={{ ...muted, fontSize: 16, marginBottom: 12 }}>{directory}</p>
            <div style={{ display: "grid", gap: 10 }}>
              <input style={input} value={form.city_from} onChange={(event) => update("city_from", event.target.value)} placeholder="City from / based near" />
              <select style={input} value={form.state_from} onChange={(event) => update("state_from", event.target.value)}>
                <option value="">Select State From</option>
                {STATES.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
            </div>
          </section>

          <section className="vf-card" style={card}>
            <div style={label}>How AI Routes To You</div>
            <p style={{ ...muted, fontSize: 16, marginBottom: 12 }}>{markets}</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {STATES.map((state) => (
                <ToggleChip key={state} active={form.states_operated.includes(state)} tone="#56d8ff" onClick={() => toggle("states_operated", state)}>
                  {state}
                </ToggleChip>
              ))}
            </div>
            <textarea
              style={{ ...input, minHeight: 84, resize: "vertical", marginTop: 12 }}
              value={form.counties_operated}
              onChange={(event) => update("counties_operated", event.target.value)}
              placeholder="Counties / cities / submarkets operated in"
            />
          </section>
        </section>

        <section className="vf-card" style={card}>
          <div style={label}>VaultForge Routing Read</div>
          <p style={{ ...muted, fontSize: 18, margin: "10px 0 0" }}>{read}</p>
        </section>

        <section className="vf-two" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          <section className="vf-card" style={card}>
            <div style={label}>Identity</div>
            <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
              <input style={input} value={form.full_name} onChange={(event) => update("full_name", event.target.value)} placeholder="Full name" />
              <input style={input} value={form.company} onChange={(event) => update("company", event.target.value)} placeholder="Company / business name" />
              <input style={input} value={form.phone} onChange={(event) => update("phone", event.target.value)} placeholder="Phone" />
              <input style={input} value={form.website} onChange={(event) => update("website", event.target.value)} placeholder="Website / social link" />
              <textarea style={{ ...input, minHeight: 90, resize: "vertical" }} value={form.bio} onChange={(event) => update("bio", event.target.value)} placeholder="Short bio / what you do" />
            </div>
          </section>

          <section className="vf-card" style={card}>
            <div style={label}>Capacity</div>
            <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
              <input style={input} value={form.min_deal_size} onChange={(event) => update("min_deal_size", event.target.value)} placeholder="Minimum deal size" />
              <input style={input} value={form.max_deal_size} onChange={(event) => update("max_deal_size", event.target.value)} placeholder="Maximum deal size" />
              <input style={input} value={form.max_capital} onChange={(event) => update("max_capital", event.target.value)} placeholder="Max funding / capital capacity" />
              <select style={input} value={form.bandwidth} onChange={(event) => update("bandwidth", event.target.value)}>
                <option value="Available">Available</option>
                <option value="Selective">Selective</option>
                <option value="Full">Full / Not Taking More</option>
                <option value="Capital Only">Capital Only</option>
                <option value="Buyer Only">Buyer Only</option>
                <option value="Operator Only">Operator Only</option>
              </select>
              <select style={input} value={form.contact_visibility} onChange={(event) => update("contact_visibility", event.target.value)}>
                <option value="Members can request intro">Members can request intro</option>
                <option value="Show contact to matched members">Show contact to matched members</option>
                <option value="Owner-controlled intro only">Owner-controlled intro only</option>
              </select>
            </div>
          </section>
        </section>

        <ChipGroup title="Role Stack" items={ROLES} selected={form.roles} tone="#9df3bf" onToggle={(item) => toggle("roles", item)} />
        <ChipGroup title="Buy Box / Assets" items={BUY_BOX} selected={form.buy_box} tone="#f8e7b0" onToggle={(item) => toggle("buy_box", item)} />
        <ChipGroup title="Strategies" items={STRATEGIES} selected={form.strategies} tone="#f8e7b0" onToggle={(item) => toggle("strategies", item)} />
        <ChipGroup title="Execution Capabilities" items={CAPABILITIES} selected={form.capabilities} tone="#56d8ff" onToggle={(item) => toggle("capabilities", item)} />
        <ChipGroup title="Pressure Problems You Can Solve" items={PRESSURE} selected={form.pressure_solutions} tone="#fecaca" onToggle={(item) => toggle("pressure_solutions", item)} />
        <ChipGroup title="What You Need" items={NEEDS} selected={form.needs} tone="#cbd5e1" onToggle={(item) => toggle("needs", item)} />

        <section className="vf-card" style={card}>
          <div style={label}>Private Routing Notes</div>
          <textarea
            style={{ ...input, minHeight: 110, resize: "vertical", marginTop: 12 }}
            value={form.notes}
            onChange={(event) => update("notes", event.target.value)}
            placeholder="What should VaultForge know before routing rooms to this member?"
          />
        </section>

        <section className="vf-sticky-save">
          <div
            style={{
              border: "1px solid rgba(232,196,107,.34)",
              borderRadius: 999,
              background: "rgba(2,6,23,.92)",
              boxShadow: "0 18px 60px rgba(0,0,0,.38)",
              padding: 10,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 10,
              backdropFilter: "blur(14px)",
            }}
          >
            <div style={{ color: "#cbd5e1", fontSize: 13, paddingLeft: 10 }}>
              Profile strength: <strong style={{ color: "#9df3bf" }}>{score}%</strong>
            </div>
            <button type="button" onClick={submitProfile} style={button}>Save Profile</button>
          </div>
        </section>
      </div>
    </main>
  );
}
