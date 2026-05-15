"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import VaultForgeMemberNav from "../components/VaultForgeMemberNav";

type Profile = Record<string, any>;

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
  } catch {
    // Continue.
  }

  return text.split(/[,\n|;]/).map((item) => item.trim()).filter(Boolean);
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
  width: "min(1180px,100%)",
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
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};

const ghost: React.CSSProperties = {
  ...button,
  border: "1px solid rgba(255,255,255,.14)",
  background: "rgba(255,255,255,.060)",
  color: "white",
};

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

function LaneCard({
  href,
  tag,
  title,
  body,
  tone,
}: {
  href: string;
  tag: string;
  title: string;
  body: string;
  tone: string;
}) {
  return (
    <Link
      href={href}
      style={{
        ...glass,
        textDecoration: "none",
        color: "white",
        minHeight: 190,
        display: "flex",
        flexDirection: "column",
        borderColor: `${tone}66`,
      }}
    >
      <div style={{ ...label, color: tone }}>{tag}</div>
      <h3 style={{ fontSize: 30, lineHeight: 1.02, margin: "12px 0 10px" }}>{title}</h3>
      <p style={{ ...muted, margin: 0, flex: 1 }}>{body}</p>
      <div style={{ color: "#f8e7b0", fontWeight: 950, marginTop: 16 }}>Open →</div>
    </Link>
  );
}

export default function ProfileDashboardPage() {
  const [email, setEmail] = useState("");
  const [profile, setProfile] = useState<Profile>({});
  const [status, setStatus] = useState("Loading profile dashboard...");

  useEffect(() => {
    const viewer = getEmail();
    setEmail(viewer);

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
          setStatus("");
          return;
        }

        setStatus("");
      } catch {
        setStatus("");
      }
    }

    load();
  }, []);

  const fullName = first(profile.full_name, profile.name, profile.display_name, profile.member_name, email);
  const memberType = first(profile.member_type, profile.type, profile.role, profile.primary_role, "Member");
  const company = first(profile.company, profile.company_name, profile.business_name);
  const phone = first(profile.phone, profile.phone_number, profile.mobile);
  const market = first(profile.market, profile.city, profile.state, profile.primary_market);
  const access = first(profile.access_status, profile.member_status, profile.status, profile.payment_status, "Member");
  const states = parseList(profile.states || profile.operating_states || profile.markets || profile.service_states);
  const specialties = parseList(profile.specialties || profile.asset_types || profile.services || profile.member_types);

  return (
    <main style={page}>
      <style>{`
        a:hover, button:hover {
          transform: translateY(-1px);
          transition: all .18s ease;
          filter: brightness(1.06);
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
          subtitle="Member identity, access, operating lanes, folders, and next moves."
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
              <div style={label}>VaultForge Member Profile</div>
              <h1 style={{ fontSize: "clamp(48px,9vw,96px)", lineHeight: 0.88, letterSpacing: "-.07em", margin: "12px 0 14px" }}>
                {fullName}
              </h1>
              <p style={{ ...muted, fontSize: 20, maxWidth: 900 }}>
                This is the member command profile: who you are, where you operate, what rooms you belong in, and where your money-flow work should route.
              </p>

              <div className="vf-actions" style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 18 }}>
                <Link href="/profile" style={button}>Edit Profile</Link>
                <Link href="/opportunity-rooms" style={ghost}>Opportunity Rooms</Link>
                <Link href="/pressure-rooms" style={ghost}>Pressure Rooms</Link>
                <Link href="/workstations" style={ghost}>Workstations</Link>
              </div>
            </div>
          </div>

          {status ? <p style={{ ...muted, marginTop: 16 }}>{status}</p> : null}
        </section>

        <section className="vf-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 14, marginBottom: 20 }}>
          <Mini labelText="Email" value={email} />
          <Mini labelText="Member Type" value={memberType} />
          <Mini labelText="Access" value={access} />
          <Mini labelText="Primary Market" value={market} />
        </section>

        <section className="vf-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
          <section style={card}>
            <div style={label}>Operating Identity</div>
            <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
              <Mini labelText="Company" value={company || "Not listed"} />
              <Mini labelText="Phone" value={phone || "Not listed"} />
              <Mini labelText="Profile Status" value={profile.profile_complete ? "Complete" : "Needs review"} />
            </div>
          </section>

          <section style={card}>
            <div style={label}>Markets / Specialties</div>

            <div style={{ marginTop: 14 }}>
              <div style={{ ...label, color: "#9df3bf", fontSize: 10 }}>States / Markets</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                {(states.length ? states : ["No states listed"]).map((item) => (
                  <span key={item} style={{ border: "1px solid rgba(157,243,191,.25)", color: "#9df3bf", background: "rgba(157,243,191,.07)", borderRadius: 999, padding: "8px 11px", fontWeight: 850 }}>
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ marginTop: 18 }}>
              <div style={{ ...label, color: "#f8e7b0", fontSize: 10 }}>Specialties</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                {(specialties.length ? specialties : ["No specialties listed"]).map((item) => (
                  <span key={item} style={{ border: "1px solid rgba(232,196,107,.25)", color: "#f8e7b0", background: "rgba(232,196,107,.07)", borderRadius: 999, padding: "8px 11px", fontWeight: 850 }}>
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </section>
        </section>

        <section style={card}>
          <div style={label}>Your Money Command Lanes</div>
          <h2 style={{ fontSize: "clamp(34px,6vw,64px)", lineHeight: 0.95, letterSpacing: "-.05em", margin: "10px 0 16px" }}>
            Everything has a place.
          </h2>

          <div className="vf-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 16 }}>
            <LaneCard href="/opportunity-rooms" tag="UPSIDE" title="Opportunity Rooms" body="Deals, acquisitions, capital paths, buyer fit, underwriting, exits, saved, archived, and dead folders." tone="#56d8ff" />
            <LaneCard href="/pressure-rooms" tag="FIX" title="Pressure Rooms" body="Funding gaps, urgent issues, contractor failures, distressed sellers, title/legal, operator needs, solved, and archived folders." tone="#fecaca" />
            <LaneCard href="/saved-rooms" tag="CONTROL" title="Saved Rooms" body="The keep pile. Rooms worth tracking without cluttering active flow." tone="#9df3bf" />
            <LaneCard href="/intelligence" tag="KAIZEN" title="Intelligence" body="Resolution Engine: scoring, diagnosis, risk, routing, structure, next move, and warnings." tone="#e8c46b" />
            <LaneCard href="/messages" tag="COMMS" title="Messages" body="Execution communication, source contact, routing requests, and member coordination." tone="#cbd5e1" />
            <LaneCard href="/members" tag="NETWORK" title="Network" body="Operators, buyers, lenders, contractors, capital, and execution partners by lane and market." tone="#9df3bf" />
          </div>
        </section>
      </div>
    </main>
  );
}
