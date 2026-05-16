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
  states: string[];
  counties: string;
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
};

const CORE_STATES = [
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
      // continue
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
  return `vaultforge_member_profile_${email || "guest"}`;
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
    states: [],
    counties: "",
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
    // continue
  }

  return text
    .split(/[,\n|;]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function profileScore(form: ProfileForm) {
  let score = 0;

  if (form.photo_url) score += 10;
  if (form.full_name) score += 10;
  if (form.company) score += 8;
  if (form.phone) score += 8;
  if (form.bio) score += 8;
  if (form.states.length) score += 12;
  if (form.counties) score += 8;
  if (form.roles.length) score += 12;
  if (form.buy_box.length) score += 10;
  if (form.strategies.length) score += 8;
  if (form.capabilities.length) score += 8;
  if (form.pressure_solutions.length) score += 8;
  if (form.needs.length) score += 4;

  return Math.min(100, score);
}

function aiRead(form: ProfileForm) {
  if (form.roles.includes("Lender") || form.roles.includes("Private Money") || form.capabilities.includes("Private Lending")) {
    return "Capital profile: best matched to Needs Capital, funding gaps, lender requests, bridge rescue, and capital-stack rooms.";
  }

  if (form.roles.includes("Contractor") || form.roles.includes("Operator") || form.capabilities.includes("Contractor Crew")) {
    return "Execution profile: best matched to Needs Operator, contractor failure, rehab, stalled construction, and rescue rooms.";
  }

  if (form.roles.includes("Buyer") || form.roles.includes("Investor")) {
    return "Buyer profile: best matched to Hot Opportunities, Needs Buyer, distressed exits, and acquisition rooms.";
  }

  if (form.pressure_solutions.length) {
    return "Pressure-solving profile: best matched to problem rooms that need structure, speed, negotiation, and operational cleanup.";
  }

  return "Profile needs more data before VaultForge can route rooms intelligently.";
}

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(232,196,107,.16), transparent 28%), radial-gradient(circle at 88% 8%, rgba(56,189,248,.11), transparent 26%), linear-gradient(180deg,#020303,#071326 55%,#020303)",
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

const input: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  borderRadius: 18,
  border: "1px solid rgba(255,255,255,.14)",
  background: "rgba(0,0,0,.24)",
  color: "white",
  padding: 14,
  fontSize: 15,
  outline: "none",
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

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section style={card}>
      <div style={label}>{title}</div>
      <div style={{ marginTop: 14 }}>{children}</div>
    </section>
  );
}

function Mini({ title, value }: { title: string; value: unknown }) {
  return (
    <section
      style={{
        border: "1px solid rgba(255,255,255,.12)",
        borderRadius: 22,
        padding: 18,
        background: "rgba(255,255,255,.045)",
      }}
    >
      <div style={label}>{title}</div>
      <div style={{ fontSize: 26, fontWeight: 1000, marginTop: 10 }}>{clean(value) || "Not listed"}</div>
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
            photo_url:
              prev.photo_url ||
              clean(intelligence.photo_url) ||
              clean(profile.photo_url) ||
              clean(profile.avatar_url) ||
              clean(profile.profile_photo_url),
            full_name:
              prev.full_name ||
              clean(intelligence.full_name) ||
              clean(profile.full_name) ||
              clean(profile.name) ||
              clean(profile.display_name),
            company:
              prev.company ||
              clean(intelligence.company) ||
              clean(profile.company) ||
              clean(profile.company_name),
            phone:
              prev.phone ||
              clean(intelligence.phone) ||
              clean(profile.phone) ||
              clean(profile.phone_number),
            website:
              prev.website ||
              clean(intelligence.website) ||
              clean(profile.website),
            bio:
              prev.bio ||
              clean(intelligence.bio) ||
              clean(profile.bio) ||
              clean(profile.description),
            states: unique([
              ...(prev.states || []),
              ...parseList(intelligence.states),
              ...parseList(profile.states),
              ...parseList(profile.operating_states),
              ...parseList(profile.markets),
            ]),
            roles: unique([
              ...(prev.roles || []),
              ...parseList(intelligence.roles),
              ...parseList(profile.roles),
              ...parseList(profile.member_type),
              ...parseList(profile.role),
            ]),
            buy_box: unique([
              ...(prev.buy_box || []),
              ...parseList(intelligence.buy_box),
              ...parseList(profile.buy_box),
              ...parseList(profile.asset_types),
            ]),
            strategies: unique([
              ...(prev.strategies || []),
              ...parseList(intelligence.strategies),
              ...parseList(profile.strategies),
            ]),
            capabilities: unique([
              ...(prev.capabilities || []),
              ...parseList(intelligence.capabilities),
              ...parseList(intelligence.execution),
            ]),
            pressure_solutions: unique([
              ...(prev.pressure_solutions || []),
              ...parseList(intelligence.pressure_solutions),
              ...parseList(intelligence.pressure),
            ]),
            needs: unique([
              ...(prev.needs || []),
              ...parseList(intelligence.needs),
            ]),
          }));
        }
      } catch {
        // Local profile still works.
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

      return {
        ...prev,
        [key]: next,
      };
    });
  }

  function onPhotoChange(file: File | null) {
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      setForm((prev) => ({
        ...prev,
        photo_url: String(reader.result || ""),
      }));
      setStatus("Photo loaded. Hit Submit Profile to save it.");
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
        setStatus("Profile submitted and saved.");
        return;
      }

      setStatus("Profile saved locally. Backend profile fields may need mapping later.");
    } catch {
      setStatus("Profile saved locally. Backend save can be hardened later.");
    }
  }

  const score = useMemo(() => profileScore(form), [form]);
  const read = useMemo(() => aiRead(form), [form]);
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

        @media(max-width:760px) {
          .vf-grid,
          .vf-hero-grid,
          .vf-actions {
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
          title="Member Profile"
          subtitle="Full member profile powers AI routing, matching, alerts, rooms, and network intelligence."
          active="profile"
        />

        <section style={card}>
          <div className="vf-hero-grid" style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 22, alignItems: "center" }}>
            <section style={{ textAlign: "center" }}>
              <div
                style={{
                  width: 180,
                  height: 180,
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
                Upload Profile Pic
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => onPhotoChange(event.target.files?.[0] || null)}
                  style={{ display: "none" }}
                />
              </label>
            </section>

            <section>
              <div style={label}>VaultForge Member Profile</div>

              <h1 style={{ fontSize: "clamp(52px,10vw,104px)", lineHeight: 0.88, letterSpacing: "-.07em", margin: "12px 0 18px" }}>
                Train the routing brain.
              </h1>

              <p style={{ ...muted, fontSize: 20, maxWidth: 940 }}>
                This profile powers AI routing, member matching, state/county filtering, buyer/lender/operator recommendations, and pressure-room intelligence.
              </p>

              <div className="vf-actions" style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 18 }}>
                <button type="button" onClick={submitProfile} style={button}>Submit Profile</button>
                <Link href="/dashboard" style={ghost}>Back to Command</Link>
                <Link href="/opportunity-rooms" style={ghost}>Opportunity Rooms</Link>
                <Link href="/pressure-rooms" style={ghost}>Pressure Rooms</Link>
              </div>

              {status ? (
                <p style={{ color: status.includes("saved") || status.includes("submitted") ? "#9df3bf" : "#f8e7b0", fontWeight: 900 }}>
                  {status}
                </p>
              ) : null}
            </section>
          </div>
        </section>

        <section className="vf-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 14, marginBottom: 20 }}>
          <Mini title="Profile Strength" value={`${score}%`} />
          <Mini title="States" value={form.states.length} />
          <Mini title="Roles" value={form.roles.length} />
          <Mini title="Email" value={email} />
        </section>

        <section style={card}>
          <div style={label}>VaultForge AI Read</div>
          <h2 style={{ fontSize: "clamp(32px,6vw,60px)", lineHeight: 0.95, letterSpacing: "-.05em", margin: "10px 0 12px" }}>
            {read}
          </h2>
          <p style={{ ...muted, fontSize: 18 }}>
            The stronger this profile is, the smarter VaultForge can route opportunities, pressure rooms, messages, and network matches.
          </p>
        </section>

        <section className="vf-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
          <Section title="Identity">
            <div style={{ display: "grid", gap: 12 }}>
              <input style={input} value={form.full_name} onChange={(event) => update("full_name", event.target.value)} placeholder="Full name" />
              <input style={input} value={form.company} onChange={(event) => update("company", event.target.value)} placeholder="Company / business name" />
              <input style={input} value={form.phone} onChange={(event) => update("phone", event.target.value)} placeholder="Phone" />
              <input style={input} value={form.website} onChange={(event) => update("website", event.target.value)} placeholder="Website / social link" />
              <textarea style={{ ...input, minHeight: 110, resize: "vertical" }} value={form.bio} onChange={(event) => update("bio", event.target.value)} placeholder="Bio / what you do" />
            </div>
          </Section>

          <Section title="Capacity">
            <div style={{ display: "grid", gap: 12 }}>
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
            </div>
          </Section>
        </section>

        <Section title="Operating States">
          <p style={{ ...muted, fontSize: 18 }}>
            Pick your markets. These are used for AI matching and room routing.
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 14 }}>
            {CORE_STATES.map((state) => (
              <ToggleChip key={state} active={form.states.includes(state)} tone="#56d8ff" onClick={() => toggle("states", state)}>
                {state}
              </ToggleChip>
            ))}
          </div>

          <textarea
            style={{ ...input, minHeight: 100, resize: "vertical", marginTop: 16 }}
            value={form.counties}
            onChange={(event) => update("counties", event.target.value)}
            placeholder="Counties / cities / submarkets, example: Bartow, Cobb, Fulton, Hamilton, Hillsborough..."
          />
        </Section>

        <Section title="Role Stack">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {ROLES.map((item) => (
              <ToggleChip key={item} active={form.roles.includes(item)} tone="#9df3bf" onClick={() => toggle("roles", item)}>
                {item}
              </ToggleChip>
            ))}
          </div>
        </Section>

        <section className="vf-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
          <Section title="Buy Box / Assets">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {BUY_BOX.map((item) => (
                <ToggleChip key={item} active={form.buy_box.includes(item)} tone="#f8e7b0" onClick={() => toggle("buy_box", item)}>
                  {item}
                </ToggleChip>
              ))}
            </div>
          </Section>

          <Section title="Strategies">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {STRATEGIES.map((item) => (
                <ToggleChip key={item} active={form.strategies.includes(item)} tone="#f8e7b0" onClick={() => toggle("strategies", item)}>
                  {item}
                </ToggleChip>
              ))}
            </div>
          </Section>
        </section>

        <section className="vf-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
          <Section title="Execution Capabilities">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {CAPABILITIES.map((item) => (
                <ToggleChip key={item} active={form.capabilities.includes(item)} tone="#56d8ff" onClick={() => toggle("capabilities", item)}>
                  {item}
                </ToggleChip>
              ))}
            </div>
          </Section>

          <Section title="Pressure Problems You Can Solve">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {PRESSURE.map((item) => (
                <ToggleChip key={item} active={form.pressure_solutions.includes(item)} tone="#fecaca" onClick={() => toggle("pressure_solutions", item)}>
                  {item}
                </ToggleChip>
              ))}
            </div>
          </Section>
        </section>

        <Section title="What You Need">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {NEEDS.map((item) => (
              <ToggleChip key={item} active={form.needs.includes(item)} tone="#cbd5e1" onClick={() => toggle("needs", item)}>
                {item}
              </ToggleChip>
            ))}
          </div>
        </Section>

        <Section title="Private Routing Notes">
          <textarea
            style={{ ...input, minHeight: 130, resize: "vertical" }}
            value={form.notes}
            onChange={(event) => update("notes", event.target.value)}
            placeholder="What should VaultForge know before routing rooms to this member?"
          />
        </Section>

        <section style={{ ...card, textAlign: "center" }}>
          <button type="button" onClick={submitProfile} style={{ ...button, minWidth: 240 }}>
            Submit Profile
          </button>
        </section>
      </div>
    </main>
  );
}
