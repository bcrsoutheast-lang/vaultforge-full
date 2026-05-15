"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import VaultForgeMemberNav from "../components/VaultForgeMemberNav";

type Profile = Record<string, any>;

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
  "Investor",
  "Buyer",
  "Wholesaler",
  "Contractor",
  "Operator",
  "Lender",
  "Realtor",
  "Developer",
  "Capital Partner",
  "Property Manager",
];

const BUY_BOX_OPTIONS = [
  "Single Family",
  "Multifamily",
  "Commercial",
  "Land",
  "Fix and Flip",
  "Buy and Hold",
  "Creative Finance",
  "Seller Finance",
  "Novation",
  "Wholesale",
  "Distressed Seller",
  "Rental Portfolio",
];

const EXECUTION_OPTIONS = [
  "Cash Buyer",
  "Hard Money",
  "Private Lending",
  "Full Rehab",
  "Light Rehab",
  "Construction",
  "Subdivision",
  "Permits",
  "City Negotiation",
  "Title Problem Solving",
  "Operator Management",
  "Disposition",
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

function initials(nameOrEmail: string) {
  const text = clean(nameOrEmail);
  if (!text) return "VF";
  const name = text.includes("@") ? text.split("@")[0] : text;
  const parts = name.split(/[\s._-]+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0] || "V"}${parts[1][0] || "F"}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function parseList(value: unknown) {
  if (Array.isArray(value)) return value.map(clean).filter(Boolean);
  const text = clean(value);
  if (!text) return [];
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return parsed.map(clean).filter(Boolean);
  } catch {}
  return text.split(/[,\n|;]/).map((item) => item.trim()).filter(Boolean);
}

function unique(items: string[]) {
  return Array.from(new Set(items.map(clean).filter(Boolean)));
}

function storageKey(email: string) {
  return `vf_profile_intelligence_${email || "guest"}`;
}

function loadLocal(email: string) {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(storageKey(email));
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function saveLocal(email: string, payload: Record<string, any>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(storageKey(email), JSON.stringify(payload));
}

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(232,196,107,.16), transparent 28%), radial-gradient(circle at 88% 8%, rgba(56,189,248,.11), transparent 26%), radial-gradient(circle at 62% 54%, rgba(157,243,191,.075), transparent 28%), linear-gradient(180deg,#020303,#071326 55%,#020303)",
  color: "white",
  padding: "22px 16px 100px",
  fontFamily: "Arial, sans-serif",
};

const wrap: React.CSSProperties = { width: "min(1280px,100%)", margin: "0 auto" };

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

const muted: React.CSSProperties = { color: "#cbd5e1", lineHeight: 1.55 };

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
  label,
  onClick,
  tone = "#9df3bf",
}: {
  active: boolean;
  label: string;
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
      {label}
    </button>
  );
}

function Mini({ labelText, value }: { labelText: string; value: unknown }) {
  return (
    <section style={glass}>
      <div style={label}>{labelText}</div>
      <div style={{ fontSize: 24, lineHeight: 1.05, marginTop: 9, fontWeight: 1000 }}>
        {clean(value) || "Not listed"}
      </div>
    </section>
  );
}

function scoreProfile(data: Record<string, any>) {
  let score = 0;
  if (clean(data.full_name)) score += 10;
  if (clean(data.phone)) score += 10;
  if (clean(data.company)) score += 8;
  if ((data.roles || []).length) score += 14;
  if ((data.states || []).length) score += 14;
  if (clean(data.counties)) score += 8;
  if ((data.buy_box || []).length) score += 14;
  if ((data.execution || []).length) score += 12;
  if ((data.pressure || []).length) score += 10;
  return Math.min(100, score);
}

function routingRead(data: Record<string, any>) {
  const roles = data.roles || [];
  const pressure = data.pressure || [];
  const execution = data.execution || [];

  if (roles.includes("Lender") || roles.includes("Capital Partner") || execution.includes("Private Lending")) {
    return "Strong fit for Needs Capital, funding gaps, bridge rescue, and private lender routing.";
  }

  if (roles.includes("Contractor") || roles.includes("Operator") || execution.includes("Full Rehab")) {
    return "Strong fit for Needs Operator, contractor failure, rehab execution, and stalled project rescue.";
  }

  if (roles.includes("Buyer") || roles.includes("Investor") || execution.includes("Cash Buyer")) {
    return "Strong fit for buyer routing, hot opportunities, distressed exits, and acquisition flow.";
  }

  if (pressure.length) {
    return "Pressure-solving profile detected. Add execution capabilities and market coverage to improve AI matching.";
  }

  return "Profile needs more routing intelligence before AI can confidently match rooms.";
}

export default function ProfileDashboardPage() {
  const [email, setEmail] = useState("");
  const [profile, setProfile] = useState<Profile>({});
  const [status, setStatus] = useState("");
  const [form, setForm] = useState<Record<string, any>>({
    full_name: "",
    company: "",
    phone: "",
    roles: [],
    states: [],
    counties: "",
    buy_box: [],
    execution: [],
    pressure: [],
    min_price: "",
    max_price: "",
    max_funding: "",
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

    async function load() {
      try {
        const response = await fetch(`/api/profile?email=${encodeURIComponent(viewer)}`, {
          method: "GET",
          credentials: "include",
          headers: { "x-vf-email": viewer },
          cache: "no-store",
        });

        const data = await response.json().catch(() => ({}));
        const found = data?.profile || data?.member || data?.data || data || {};

        if (found && typeof found === "object") {
          setProfile(found);

          setForm((prev) => ({
            ...prev,
            full_name: prev.full_name || first(found.full_name, found.name, found.display_name, found.member_name),
            company: prev.company || first(found.company, found.company_name, found.business_name),
            phone: prev.phone || first(found.phone, found.phone_number, found.mobile),
            roles: unique([...(prev.roles || []), ...parseList(found.member_type || found.role || found.roles)]),
            states: unique([...(prev.states || []), ...parseList(found.states || found.operating_states || found.markets || found.service_states)]),
            buy_box: unique([...(prev.buy_box || []), ...parseList(found.buy_box || found.asset_types || found.strategy)]),
          }));
        }
      } catch {
        // Keep local profile alive.
      }
    }

    load();
  }, []);

  function toggleList(key: string, value: string) {
    setForm((prev) => {
      const current = Array.isArray(prev[key]) ? prev[key] : [];
      const exists = current.includes(value);
      const next = exists ? current.filter((item: string) => item !== value) : [...current, value];
      return { ...prev, [key]: next };
    });
  }

  function update(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function saveProfile() {
    saveLocal(email, form);
    setStatus("Profile intelligence saved locally.");

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
          ...form,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok && data?.ok !== false) {
        setStatus("Profile intelligence saved.");
        return;
      }

      setStatus("Saved locally. Profile API did not accept every field yet.");
    } catch {
      setStatus("Saved locally. Backend profile save can be wired after launch hardening.");
    }
  }

  const fullName = first(form.full_name, profile.full_name, profile.name, email);
  const score = useMemo(() => scoreProfile(form), [form]);
  const aiRead = useMemo(() => routingRead(form), [form]);

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
          title="Profile Intelligence"
          subtitle="States, counties, roles, buy box, execution capabilities, and pressure-solving profile."
          active="profile"
        />

        <section style={card}>
          <div className="vf-hero-grid" style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: 22, alignItems: "center" }}>
            <div
              style={{
                width: 160,
                height: 160,
                borderRadius: 38,
                border: "1px solid rgba(232,196,107,.34)",
                display: "grid",
                placeItems: "center",
                background:
                  "radial-gradient(circle at top left, rgba(232,196,107,.30), transparent 45%), linear-gradient(145deg,rgba(255,255,255,.10),rgba(255,255,255,.03))",
                boxShadow: "0 28px 80px rgba(0,0,0,.36)",
                fontSize: 54,
                fontWeight: 1000,
                color: "#f8e7b0",
              }}
            >
              {initials(fullName)}
            </div>

            <div>
              <div style={label}>VaultForge Member Routing Identity</div>
              <h1 style={{ fontSize: "clamp(48px,9vw,96px)", lineHeight: 0.88, letterSpacing: "-.07em", margin: "12px 0 14px" }}>
                {fullName || "Profile Intelligence"}
              </h1>
              <p style={{ ...muted, fontSize: 20, maxWidth: 940 }}>
                This is the AI matching backbone. VaultForge needs to know where you operate, what you buy, what problems you solve,
                and what capacity you have before it can route Opportunity and Pressure rooms intelligently.
              </p>

              <div className="vf-actions" style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 18 }}>
                <button type="button" onClick={saveProfile} style={button}>Save Profile Intelligence</button>
                <Link href="/opportunity-rooms" style={ghost}>Opportunity Rooms</Link>
                <Link href="/pressure-rooms" style={ghost}>Pressure Rooms</Link>
                <Link href="/workstations" style={ghost}>Workstations</Link>
              </div>

              {status ? <p style={{ color: status.includes("saved") ? "#9df3bf" : "#f8e7b0", fontWeight: 900 }}>{status}</p> : null}
            </div>
          </div>
        </section>

        <section className="vf-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 14, marginBottom: 20 }}>
          <Mini labelText="Profile Strength" value={`${score}%`} />
          <Mini labelText="States Selected" value={(form.states || []).length} />
          <Mini labelText="Roles" value={(form.roles || []).length} />
          <Mini labelText="Bandwidth" value={form.bandwidth} />
        </section>

        <section style={card}>
          <div style={label}>Resolution Engine Read</div>
          <h2 style={{ fontSize: "clamp(32px,6vw,60px)", lineHeight: 0.95, letterSpacing: "-.05em", margin: "10px 0 12px" }}>
            {aiRead}
          </h2>
          <p style={{ ...muted, fontSize: 18 }}>
            The stronger this profile is, the better VaultForge can match rooms to the right buyer, capital source, operator, contractor,
            lender, or pressure solver.
          </p>
        </section>

        <section className="vf-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
          <section style={card}>
            <div style={label}>Basic Identity</div>
            <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
              <input style={input} value={form.full_name} onChange={(e) => update("full_name", e.target.value)} placeholder="Full name" />
              <input style={input} value={form.company} onChange={(e) => update("company", e.target.value)} placeholder="Company / business name" />
              <input style={input} value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="Phone" />
            </div>
          </section>

          <section style={card}>
            <div style={label}>Capacity</div>
            <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
              <input style={input} value={form.min_price} onChange={(e) => update("min_price", e.target.value)} placeholder="Minimum deal size / price" />
              <input style={input} value={form.max_price} onChange={(e) => update("max_price", e.target.value)} placeholder="Maximum deal size / price" />
              <input style={input} value={form.max_funding} onChange={(e) => update("max_funding", e.target.value)} placeholder="Max funding / capital capacity" />
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
          <div style={label}>Operating States</div>
          <h2 style={{ fontSize: "clamp(32px,6vw,62px)", lineHeight: 0.95, letterSpacing: "-.05em", margin: "10px 0 12px" }}>
            Your seven-state command map.
          </h2>
          <p style={{ ...muted, fontSize: 18 }}>
            These are your core VaultForge states. Select where this member operates so rooms can route by geography.
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 16 }}>
            {CORE_STATES.map((state) => (
              <ToggleChip
                key={state.code}
                active={(form.states || []).includes(state.name)}
                label={`${state.code} · ${state.name}`}
                tone="#56d8ff"
                onClick={() => toggleList("states", state.name)}
              />
            ))}
          </div>

          <div style={{ marginTop: 16 }}>
            <textarea
              style={{ ...input, minHeight: 95, resize: "vertical" }}
              value={form.counties}
              onChange={(e) => update("counties", e.target.value)}
              placeholder="Counties / cities / submarkets, example: Bartow, Cobb, Fulton, Hamilton, Hillsborough..."
            />
          </div>
        </section>

        <section className="vf-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
          <section style={card}>
            <div style={label}>Roles</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 14 }}>
              {ROLE_OPTIONS.map((item) => (
                <ToggleChip
                  key={item}
                  active={(form.roles || []).includes(item)}
                  label={item}
                  tone="#9df3bf"
                  onClick={() => toggleList("roles", item)}
                />
              ))}
            </div>
          </section>

          <section style={card}>
            <div style={label}>Buy Box / Strategy</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 14 }}>
              {BUY_BOX_OPTIONS.map((item) => (
                <ToggleChip
                  key={item}
                  active={(form.buy_box || []).includes(item)}
                  label={item}
                  tone="#f8e7b0"
                  onClick={() => toggleList("buy_box", item)}
                />
              ))}
            </div>
          </section>
        </section>

        <section className="vf-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
          <section style={card}>
            <div style={label}>Execution Capabilities</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 14 }}>
              {EXECUTION_OPTIONS.map((item) => (
                <ToggleChip
                  key={item}
                  active={(form.execution || []).includes(item)}
                  label={item}
                  tone="#56d8ff"
                  onClick={() => toggleList("execution", item)}
                />
              ))}
            </div>
          </section>

          <section style={card}>
            <div style={label}>Pressure Problems You Can Solve</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 14 }}>
              {PRESSURE_OPTIONS.map((item) => (
                <ToggleChip
                  key={item}
                  active={(form.pressure || []).includes(item)}
                  label={item}
                  tone="#fecaca"
                  onClick={() => toggleList("pressure", item)}
                />
              ))}
            </div>
          </section>
        </section>

        <section style={card}>
          <div style={label}>Private Routing Notes</div>
          <textarea
            style={{ ...input, minHeight: 130, resize: "vertical" }}
            value={form.notes}
            onChange={(e) => update("notes", e.target.value)}
            placeholder="What should VaultForge know before routing rooms to this member? Example: prefers North GA flips under $350k, can fund fast, avoids occupied properties..."
          />
        </section>
      </div>
    </main>
  );
}
