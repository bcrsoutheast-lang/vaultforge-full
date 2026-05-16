"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import VaultForgeMemberNav from "../components/VaultForgeMemberNav";

type ProfileData = Record<string, any>;

const CORE_STATES = [
  { code: "GA", name: "Georgia" },
  { code: "TN", name: "Tennessee" },
  { code: "AL", name: "Alabama" },
  { code: "FL", name: "Florida" },
  { code: "NC", name: "North Carolina" },
  { code: "SC", name: "South Carolina" },
  { code: "TX", name: "Texas" },
];

const ROLE_OPTIONS = [
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

const BUY_BOX_OPTIONS = [
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

const EXECUTION_OPTIONS = [
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
  "Insurance Claim",
  "Tenant Turnover",
  "Property Management",
];

const PRESSURE_OPTIONS = [
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
  "Code Enforcement",
  "Tax Sale",
  "Owner Burnout",
];

const NEED_OPTIONS = [
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

  const keys = ["vf_email", "vf_member_email", "vf_admin_email", "email", "memberEmail"];

  for (const key of keys) {
    const localValue = cleanEmail(window.localStorage.getItem(key));
    if (localValue.includes("@")) return localValue;

    const sessionValue = cleanEmail(window.sessionStorage.getItem(key));
    if (sessionValue.includes("@")) return sessionValue;
  }

  return cleanEmail(readCookie("vf_email") || readCookie("vf_member_email") || readCookie("vf_admin_email"));
}

function first(...values: unknown[]) {
  for (const value of values) {
    const text = clean(value);
    if (text) return text;
  }

  return "";
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

function unique(items: string[]) {
  return Array.from(new Set(items.map(clean).filter(Boolean)));
}

function initials(nameOrEmail: string) {
  const text = clean(nameOrEmail);
  if (!text) return "VF";

  const name = text.includes("@") ? text.split("@")[0] : text;
  const parts = name.split(/[\s._-]+/).filter(Boolean);

  if (parts.length >= 2) return `${parts[0][0] || "V"}${parts[1][0] || "F"}`.toUpperCase();

  return name.slice(0, 2).toUpperCase();
}

function localKey(email: string) {
  return `vf_one_profile_${email || "guest"}`;
}

function loadLocal(email: string) {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(localKey(email));
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function saveLocal(email: string, data: ProfileData) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(localKey(email), JSON.stringify(data));
}

function profileScore(data: ProfileData) {
  let score = 0;

  if (clean(data.photo_url)) score += 8;
  if (clean(data.full_name)) score += 10;
  if (clean(data.company)) score += 8;
  if (clean(data.phone)) score += 8;
  if (clean(data.bio)) score += 8;
  if ((data.states || []).length) score += 12;
  if (clean(data.counties)) score += 8;
  if ((data.roles || []).length) score += 12;
  if ((data.buy_box || []).length) score += 10;
  if ((data.strategies || []).length) score += 8;
  if ((data.execution || []).length) score += 10;
  if ((data.pressure || []).length) score += 8;
  if (clean(data.bandwidth)) score += 4;
  if (clean(data.max_capital) || clean(data.max_deal_size)) score += 4;

  return Math.min(100, score);
}

function aiRead(data: ProfileData) {
  const roles = data.roles || [];
  const execution = data.execution || [];
  const pressure = data.pressure || [];
  const strategies = data.strategies || [];

  if (roles.includes("Lender") || roles.includes("Private Money") || roles.includes("Hard Money Lender") || execution.includes("Private Lending")) {
    return "Capital-side profile. Best routed to Needs Capital, funding gaps, bridge rescue, lender requests, and capital-stack opportunities.";
  }

  if (roles.includes("Contractor") || roles.includes("Operator") || execution.includes("Full Rehab") || execution.includes("Contractor Crew")) {
    return "Execution-side profile. Best routed to Needs Operator, contractor failure, rehab execution, stalled construction, and field rescue rooms.";
  }

  if (roles.includes("Buyer") || roles.includes("Investor") || strategies.includes("Fix & Flip") || strategies.includes("Buy & Hold")) {
    return "Acquisition-side profile. Best routed to Hot Opportunities, Needs Buyer, distressed seller exits, and private deal flow.";
  }

  if (pressure.length >= 3) {
    return "Pressure-solving profile. Best routed to problem rooms where speed, structure, negotiation, or rescue strategy is needed.";
  }

  return "Profile needs more intelligence. Add roles, markets, buy box, capabilities, and pressure-solving strengths so VaultForge can route better.";
}

function bestLane(data: ProfileData) {
  const roles = data.roles || [];
  const pressure = data.pressure || [];

  if (roles.includes("Lender") || roles.includes("Private Money") || roles.includes("Hard Money Lender")) return "Capital Desk";
  if (roles.includes("Contractor") || roles.includes("Operator")) return "Operator Desk";
  if (roles.includes("Buyer") || roles.includes("Investor")) return "Opportunity Desk";
  if (pressure.length) return "Pressure Desk";

  return "Needs Training Data";
}

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(232,196,107,.16), transparent 28%), radial-gradient(circle at 88% 8%, rgba(56,189,248,.11), transparent 26%), radial-gradient(circle at 62% 54%, rgba(157,243,191,.075), transparent 28%), linear-gradient(180deg,#020303,#071326 55%,#020303)",
  color: "white",
  padding: "22px 16px 100px",
  fontFamily: "Arial, sans-serif",
};

const wrap: React.CSSProperties = {
  width: "min(1280px,100%)",
  margin: "0 auto",
};

const card: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.24)",
  borderRadius: 30,
  background: "linear-gradient(145deg,rgba(255,255,255,.070),rgba(255,255,255,.030))",
  padding: 24,
  marginBottom: 20,
  boxShadow: "0 28px 86px rgba(0,0,0,.30)",
};

const glass: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.12)",
  borderRadius: 22,
  padding: 18,
  background: "rgba(255,255,255,.045)",
};

const label: React.CSSProperties = {
  color: "#e8c46b",
  letterSpacing: ".18em",
  textTransform: "uppercase",
  fontWeight: 950,
  fontSize: 12,
};

const muted: React.CSSProperties = {
  color: "#cbd5e1",
  lineHeight: 1.55,
};

const button: React.CSSProperties = {
  minHeight: 50,
  borderRadius: 999,
  padding: "13px 18px",
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

const input: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  borderRadius: 18,
  border: "1px solid rgba(255,255,255,.14)",
  background: "rgba(0,0,0,.22)",
  color: "white",
  padding: 14,
  fontSize: 15,
  outline: "none",
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
        border: active ? `1px solid ${tone}` : "1px solid rgba(255,255,255,.14)",
        background: active ? "rgba(157,243,191,.10)" : "rgba(255,255,255,.040)",
        color: active ? tone : "#cbd5e1",
        borderRadius: 999,
        padding: "9px 12px",
        fontWeight: 900,
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
    <section style={{ ...glass, borderColor: `${tone}44` }}>
      <div style={{ ...label, color: tone }}>{title}</div>
      <div style={{ fontSize: 24, lineHeight: 1.05, marginTop: 9, fontWeight: 1000 }}>
        {clean(value) || "Not listed"}
      </div>
    </section>
  );
}

export default function ProfileDashboardPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [form, setForm] = useState<ProfileData>({
    photo_url: "",
    full_name: "",
    company: "",
    phone: "",
    website: "",
    bio: "",
    states: [],
    counties: "",
    roles: [],
    buy_box: [],
    strategies: [],
    execution: [],
    pressure: [],
    needs: [],
    min_deal_size: "",
    max_deal_size: "",
    max_capital: "",
    bandwidth: "Available",
    notes: "",
  });

  useEffect(() => {
    const viewer = getEmail();
    setEmail(viewer);

    const local = loadLocal(viewer);
    if (Object.keys(local).length) {
      setForm((prev) => ({ ...prev, ...local }));
    }

    async function loadProfile() {
      try {
        const response = await fetch(`/api/profile?email=${encodeURIComponent(viewer)}`, {
          method: "GET",
          credentials: "include",
          headers: { "x-vf-email": viewer },
          cache: "no-store",
        });

        const data = await response.json().catch(() => ({}));
        const found = data?.profile || data?.member || data?.data || data || {};
        const intelligence = found.profile_intelligence || found.intelligence_profile || {};

        if (found && typeof found === "object") {
          setForm((prev) => ({
            ...prev,
            ...intelligence,
            photo_url: prev.photo_url || first(intelligence.photo_url, found.photo_url, found.avatar_url, found.profile_photo_url),
            full_name: prev.full_name || first(intelligence.full_name, found.full_name, found.name, found.display_name, found.member_name),
            company: prev.company || first(intelligence.company, found.company, found.company_name, found.business_name),
            phone: prev.phone || first(intelligence.phone, found.phone, found.phone_number, found.mobile),
            website: prev.website || first(intelligence.website, found.website, found.url),
            bio: prev.bio || first(intelligence.bio, found.bio, found.description, found.about),
            states: unique([...(prev.states || []), ...parseList(intelligence.states), ...parseList(found.states || found.operating_states || found.markets || found.service_states)]),
            roles: unique([...(prev.roles || []), ...parseList(intelligence.roles), ...parseList(found.roles || found.member_type || found.role)]),
            buy_box: unique([...(prev.buy_box || []), ...parseList(intelligence.buy_box), ...parseList(found.buy_box || found.asset_types)]),
            strategies: unique([...(prev.strategies || []), ...parseList(intelligence.strategies), ...parseList(found.strategies || found.strategy)]),
            execution: unique([...(prev.execution || []), ...parseList(intelligence.execution)]),
            pressure: unique([...(prev.pressure || []), ...parseList(intelligence.pressure)]),
            needs: unique([...(prev.needs || []), ...parseList(intelligence.needs)]),
          }));
        }
      } catch {
        // Local profile still works.
      }
    }

    loadProfile();
  }, []);

  function update(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggle(key: string, value: string) {
    setForm((prev) => {
      const current = Array.isArray(prev[key]) ? prev[key] : [];
      const exists = current.includes(value);
      const next = exists ? current.filter((item: string) => item !== value) : [...current, value];
      return { ...prev, [key]: next };
    });
  }

  function onPhotoChange(file: File | null) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setForm((prev) => ({ ...prev, photo_url: String(reader.result || "") }));
    };
    reader.readAsDataURL(file);
  }

  async function saveProfile() {
    saveLocal(email, form);
    setStatus("Profile saved locally.");

    try {
      const response = await fetch("/api/profile", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "x-vf-email": email,
        },
        body: JSON.stringify({
          email,
          profile_intelligence: form,
          full_name: form.full_name,
          company: form.company,
          phone: form.phone,
          photo_url: form.photo_url,
          states: form.states,
          roles: form.roles,
          buy_box: form.buy_box,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok && data?.ok !== false) {
        setStatus("Profile saved.");
        return;
      }

      setStatus("Profile saved locally. Backend profile fields may need final mapping.");
    } catch {
      setStatus("Profile saved locally. Backend save can be hardened later.");
    }
  }

  const score = useMemo(() => profileScore(form), [form]);
  const read = useMemo(() => aiRead(form), [form]);
  const lane = useMemo(() => bestLane(form), [form]);
  const displayName = first(form.full_name, email, "VaultForge Member");

  return (
    <main style={page}>
      <style>{`
        a:hover, button:hover {
          transform: translateY(-1px);
          transition: all .18s ease;
          filter: brightness(1.06);
        }

        input::placeholder, textarea::placeholder {
          color: rgba(255,255,255,.45);
        }

        @media(max-width:760px) {
          .vf-grid,
          .vf-actions,
          .vf-hero-grid {
            grid-template-columns: 1fr !important;
          }

          .vf-actions {
            display: grid !important;
            gap: 10px !important;
          }

          .vf-actions > * {
            width: 100%;
            box-sizing: border-box;
          }
        }
      `}</style>

      <div style={wrap}>
        <VaultForgeMemberNav
          title="Profile Dashboard"
          subtitle="One member identity system: photo, states, counties, roles, buy box, capabilities, pressure solving, and AI match."
          active="profile"
        />

        <section style={card}>
          <div className="vf-hero-grid" style={{ display: "grid", gridTemplateColumns: "190px 1fr", gap: 22, alignItems: "center" }}>
            <section style={{ textAlign: "center" }}>
              <div
                style={{
                  width: 170,
                  height: 170,
                  borderRadius: 42,
                  border: "1px solid rgba(232,196,107,.38)",
                  display: "grid",
                  placeItems: "center",
                  background:
                    "radial-gradient(circle at top left, rgba(232,196,107,.30), transparent 45%), linear-gradient(145deg,rgba(255,255,255,.10),rgba(255,255,255,.03))",
                  boxShadow: "0 28px 80px rgba(0,0,0,.36)",
                  overflow: "hidden",
                  margin: "0 auto 12px",
                }}
              >
                {form.photo_url ? (
                  <img src={form.photo_url} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <span style={{ fontSize: 54, fontWeight: 1000, color: "#f8e7b0" }}>{initials(displayName)}</span>
                )}
              </div>

              <label style={{ ...ghost, cursor: "pointer", width: "100%", boxSizing: "border-box" }}>
                Upload Photo
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => onPhotoChange(e.target.files?.[0] || null)}
                  style={{ display: "none" }}
                />
              </label>
            </section>

            <section>
              <div style={label}>One Member Identity System</div>

              <h1 style={{ fontSize: "clamp(48px,9vw,96px)", lineHeight: 0.88, letterSpacing: "-.07em", margin: "12px 0 14px" }}>
                Train your VaultForge engine.
              </h1>

              <p style={{ ...muted, fontSize: 20, maxWidth: 940 }}>
                This replaces the duplicate profile/onboarding confusion. This is the only member identity command center.
                VaultForge uses this to understand who you are, where you operate, what you buy, what you solve, and what rooms to route to you.
              </p>

              <div className="vf-actions" style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 18 }}>
                <button type="button" onClick={saveProfile} style={button}>Save Profile</button>
                <Link href="/dashboard" style={ghost}>Dashboard</Link>
                <Link href="/opportunity-rooms" style={ghost}>Opportunity Rooms</Link>
                <Link href="/pressure-rooms" style={ghost}>Pressure Rooms</Link>
              </div>

              {status ? <p style={{ color: status.includes("saved") ? "#9df3bf" : "#f8e7b0", fontWeight: 900 }}>{status}</p> : null}
            </section>
          </div>
        </section>

        <section className="vf-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 14, marginBottom: 20 }}>
          <Mini title="Profile Strength" value={`${score}%`} tone="#9df3bf" />
          <Mini title="Best Lane" value={lane} tone="#56d8ff" />
          <Mini title="States" value={(form.states || []).length} tone="#e8c46b" />
          <Mini title="Roles" value={(form.roles || []).length} tone="#fecaca" />
        </section>

        <section style={card}>
          <div style={label}>VaultForge AI Read</div>
          <h2 style={{ fontSize: "clamp(32px,6vw,60px)", lineHeight: 0.95, letterSpacing: "-.05em", margin: "10px 0 12px" }}>
            {read}
          </h2>
          <p style={{ ...muted, fontSize: 18 }}>
            This read gets stronger as your profile gets cleaner. This is what later powers buyer matching, lender matching, operator matching, pressure routing, and alerts.
          </p>
        </section>

        <section className="vf-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
          <section style={card}>
            <div style={label}>Identity</div>
            <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
              <input style={input} value={form.full_name} onChange={(e) => update("full_name", e.target.value)} placeholder="Full name" />
              <input style={input} value={form.company} onChange={(e) => update("company", e.target.value)} placeholder="Company / business name" />
              <input style={input} value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="Phone" />
              <input style={input} value={form.website} onChange={(e) => update("website", e.target.value)} placeholder="Website / social link" />
              <textarea style={{ ...input, minHeight: 110, resize: "vertical" }} value={form.bio} onChange={(e) => update("bio", e.target.value)} placeholder="Short bio / what you do" />
            </div>
          </section>

          <section style={card}>
            <div style={label}>Capacity</div>
            <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
              <input style={input} value={form.min_deal_size} onChange={(e) => update("min_deal_size", e.target.value)} placeholder="Minimum deal size / price" />
              <input style={input} value={form.max_deal_size} onChange={(e) => update("max_deal_size", e.target.value)} placeholder="Maximum deal size / price" />
              <input style={input} value={form.max_capital} onChange={(e) => update("max_capital", e.target.value)} placeholder="Max funding / capital capacity" />
              <select style={input} value={form.bandwidth} onChange={(e) => update("bandwidth", e.target.value)}>
                <option value="Available">Available</option>
                <option value="Selective">Selective</option>
                <option value="Full">Full / Not Taking More</option>
                <option value="Capital Only">Capital Only</option>
                <option value="Buyer Only">Buyer Only</option>
                <option value="Operator Only">Operator Only</option>
              </select>
            </div>
          </section>
        </section>

        <section style={card}>
          <div style={label}>Markets / States</div>
          <p style={{ ...muted, fontSize: 20 }}>Select every state or region where you want alerts, routing signals, and member matching.</p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 14 }}>
            {CORE_STATES.map((state) => (
              <ToggleChip
                key={state.code}
                active={(form.states || []).includes(state.name)}
                tone="#56d8ff"
                onClick={() => toggle("states", state.name)}
              >
                {state.code} · {state.name}
              </ToggleChip>
            ))}
          </div>

          <div style={{ marginTop: 16 }}>
            <textarea
              style={{ ...input, minHeight: 100, resize: "vertical" }}
              value={form.counties}
              onChange={(e) => update("counties", e.target.value)}
              placeholder="Counties / cities / submarkets, example: Bartow, Cobb, Fulton, Hamilton, Hillsborough..."
            />
          </div>
        </section>

        <section style={card}>
          <div style={label}>Role Stack</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 14 }}>
            {ROLE_OPTIONS.map((item) => (
              <ToggleChip key={item} active={(form.roles || []).includes(item)} tone="#9df3bf" onClick={() => toggle("roles", item)}>
                {item}
              </ToggleChip>
            ))}
          </div>
        </section>

        <section className="vf-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
          <section style={card}>
            <div style={label}>Buy Box / Assets</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 14 }}>
              {BUY_BOX_OPTIONS.map((item) => (
                <ToggleChip key={item} active={(form.buy_box || []).includes(item)} tone="#f8e7b0" onClick={() => toggle("buy_box", item)}>
                  {item}
                </ToggleChip>
              ))}
            </div>
          </section>

          <section style={card}>
            <div style={label}>Strategies</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 14 }}>
              {STRATEGY_OPTIONS.map((item) => (
                <ToggleChip key={item} active={(form.strategies || []).includes(item)} tone="#f8e7b0" onClick={() => toggle("strategies", item)}>
                  {item}
                </ToggleChip>
              ))}
            </div>
          </section>
        </section>

        <section className="vf-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
          <section style={card}>
            <div style={label}>Execution Capabilities</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 14 }}>
              {EXECUTION_OPTIONS.map((item) => (
                <ToggleChip key={item} active={(form.execution || []).includes(item)} tone="#56d8ff" onClick={() => toggle("execution", item)}>
                  {item}
                </ToggleChip>
              ))}
            </div>
          </section>

          <section style={card}>
            <div style={label}>Pressure Problems You Can Solve</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 14 }}>
              {PRESSURE_OPTIONS.map((item) => (
                <ToggleChip key={item} active={(form.pressure || []).includes(item)} tone="#fecaca" onClick={() => toggle("pressure", item)}>
                  {item}
                </ToggleChip>
              ))}
            </div>
          </section>
        </section>

        <section style={card}>
          <div style={label}>What You Need</div>
          <p style={{ ...muted, fontSize: 20 }}>These become routing signals. If a deal or member solves your pain, VaultForge can alert you later.</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 14 }}>
            {NEED_OPTIONS.map((item) => (
              <ToggleChip key={item} active={(form.needs || []).includes(item)} tone="#cbd5e1" onClick={() => toggle("needs", item)}>
                {item}
              </ToggleChip>
            ))}
          </div>
        </section>

        <section style={card}>
          <div style={label}>Private Routing Notes</div>
          <textarea
            style={{ ...input, minHeight: 130, resize: "vertical" }}
            value={form.notes}
            onChange={(e) => update("notes", e.target.value)}
            placeholder="What should VaultForge know before routing rooms to you? Example: prefers North GA flips under $350k, can fund fast, avoids occupied properties..."
          />
        </section>
      </div>
    </main>
  );
}
