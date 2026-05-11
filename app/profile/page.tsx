"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Profile = Record<string, any>;

const MEMBER_TYPES = ["Buyer", "Seller", "Lender", "Wholesaler", "Realtor", "Contractor", "Operator", "Attorney", "Property Manager", "Investor"];
const MARKETS = ["Georgia", "Florida", "Tennessee", "North Carolina", "South Carolina", "Texas", "Alabama", "National"];
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

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(232,196,107,.16), transparent 30%), radial-gradient(circle at 85% 10%, rgba(157,243,191,.10), transparent 28%), linear-gradient(180deg,#020303,#071326 55%,#020303)",
  color: "white",
  padding: "22px 16px 92px",
  fontFamily: "Arial, sans-serif",
};

const wrap: React.CSSProperties = { width: "min(1080px,100%)", margin: "0 auto" };

const card: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.28)",
  borderRadius: 28,
  padding: 24,
  background: "rgba(255,255,255,.06)",
  marginBottom: 16,
  boxShadow: "0 24px 80px rgba(0,0,0,.26)",
};

const eyebrow: React.CSSProperties = {
  color: "#e8c46b",
  letterSpacing: ".18em",
  textTransform: "uppercase",
  fontWeight: 950,
  fontSize: 12,
};

const muted: React.CSSProperties = { color: "#cbd5e1", lineHeight: 1.55 };

const input: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,.18)",
  background: "rgba(255,255,255,.08)",
  color: "white",
  padding: 14,
  fontSize: 16,
  outline: "none",
};

const button: React.CSSProperties = {
  display: "inline-flex",
  justifyContent: "center",
  alignItems: "center",
  minHeight: 48,
  borderRadius: 999,
  padding: "12px 18px",
  border: 0,
  background: "linear-gradient(135deg,#f8e7b0,#e8c46b)",
  color: "#06100a",
  fontWeight: 950,
  textDecoration: "none",
  cursor: "pointer",
};

const ghost: React.CSSProperties = {
  ...button,
  background: "rgba(255,255,255,.06)",
  border: "1px solid rgba(255,255,255,.16)",
  color: "white",
};

function ToggleChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        border: active ? "1px solid rgba(232,196,107,.85)" : "1px solid rgba(255,255,255,.15)",
        background: active ? "linear-gradient(135deg,#f8e7b0,#9df3bf,#b55cff)" : "rgba(255,255,255,.055)",
        color: active ? "#06100a" : "white",
        borderRadius: 999,
        padding: "10px 14px",
        fontWeight: 950,
        cursor: "pointer",
        margin: "0 8px 8px 0",
      }}
    >
      {label}
    </button>
  );
}

function toggle(list: string[], value: string) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

export default function ProfilePage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("Loading profile...");
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [memberTypes, setMemberTypes] = useState<string[]>([]);
  const [markets, setMarkets] = useState<string[]>([]);
  const [strategies, setStrategies] = useState<string[]>([]);
  const [assetFocus, setAssetFocus] = useState<string[]>([]);
  const [needs, setNeeds] = useState<string[]>([]);
  const [canProvide, setCanProvide] = useState<string[]>([]);
  const [painSignals, setPainSignals] = useState<string[]>([]);
  const [buyBox, setBuyBox] = useState("");
  const [fundingCapacity, setFundingCapacity] = useState("");
  const [strategyNotes, setStrategyNotes] = useState("");
  const [networkAccepted, setNetworkAccepted] = useState(false);

  const routingScore = useMemo(() => {
    let score = 40;
    if (memberTypes.length) score += 8;
    if (markets.length) score += 8;
    if (strategies.length) score += 8;
    if (assetFocus.length) score += 6;
    if (needs.length) score += 6;
    if (canProvide.length) score += 8;
    if (painSignals.length) score += 5;
    if (buyBox) score += 4;
    if (photoUrl) score += 4;
    if (networkAccepted) score += 3;
    return Math.min(100, score);
  }, [memberTypes, markets, strategies, assetFocus, needs, canProvide, painSignals, buyBox, photoUrl, networkAccepted]);

  async function load() {
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

      if (!res.ok || data?.ok === false) throw new Error(data?.error || "Could not load profile.");

      const profile: Profile = data.profile || {};
      setName(clean(profile.name));
      setCompany(clean(profile.company));
      setPhone(clean(profile.phone));
      setPhotoUrl(clean(profile.profile_photo_url));
      setMemberTypes(arr(profile.member_types));
      setMarkets(arr(profile.markets));
      setStrategies(arr(profile.strategies));
      setAssetFocus(arr(profile.asset_focus));
      setNeeds(arr(profile.needs));
      setCanProvide(arr(profile.can_provide));
      setPainSignals(arr(profile.pain_signals));
      setBuyBox(clean(profile.buy_box));
      setFundingCapacity(clean(profile.funding_capacity));
      setStrategyNotes(clean(profile.strategy_notes));
      setNetworkAccepted(Boolean(profile.network_accepted));
      setStatus(profile ? "Profile loaded." : "New profile ready.");
    } catch (error: any) {
      setStatus(error?.message || "Could not load profile.");
    }
  }

  async function save() {
    setSaving(true);
    setStatus("Saving profile...");

    try {
      const body = {
        email,
        name,
        full_name: name,
        company,
        company_name: company,
        phone,
        profile_photo_url: photoUrl,
        member_types: memberTypes,
        markets,
        strategies,
        asset_focus: assetFocus,
        needs,
        can_provide: canProvide,
        pain_signals: painSignals,
        buy_box: buyBox,
        funding_capacity: fundingCapacity,
        strategy_notes: strategyNotes,
        network_accepted: networkAccepted,
        accepted_to_network: networkAccepted,
        available_to_network: networkAccepted,
        routing_score: routingScore,
      };

      const res = await fetch("/api/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-vf-email": email,
        },
        body: JSON.stringify(body),
      });

      const data = await safeJson(res);

      if (!res.ok || data?.ok === false) {
        throw new Error(data?.error || data?.details || "Profile could not be saved.");
      }

      setStatus(data.message || "Profile saved.");
      await load();
    } catch (error: any) {
      setStatus(error?.message || "Profile could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

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
        <nav style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
          <Link href="/dashboard" style={{ color: "#f8e7b0", textDecoration: "none", fontWeight: 950, letterSpacing: ".12em" }}>
            VAULTFORGE
          </Link>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Link href="/members" style={ghost}>Members</Link>
            <Link href="/messages" style={ghost}>Messages</Link>
            <Link href="/dashboard" style={ghost}>Dashboard</Link>
          </div>
        </nav>

        <section style={card}>
          <p style={eyebrow}>Member Profile</p>
          <h1 style={{ fontSize: "clamp(50px,10vw,92px)", lineHeight: 0.88, margin: "10px 0 18px", letterSpacing: "-.06em" }}>
            Network identity.
          </h1>
          <p style={{ ...muted, fontSize: 18 }}>
            Your highlighted chips, photo, buy box, and network acceptance now save together.
          </p>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
            <span style={{ ...ghost, minHeight: 34, padding: "8px 12px" }}>Email: {email || "unknown"}</span>
            <span style={{ ...ghost, minHeight: 34, padding: "8px 12px" }}>Routing score: {routingScore}</span>
            <span style={{ ...ghost, minHeight: 34, padding: "8px 12px" }}>
              Network: {networkAccepted ? "Accepted" : "Not accepted"}
            </span>
          </div>
        </section>

        {status ? (
          <section style={card}>
            <strong>{status}</strong>
          </section>
        ) : null}

        <section style={card}>
          <p style={eyebrow}>Profile Basics</p>
          <div className="vf-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <label>
              <strong>Name</strong>
              <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Dmoney" style={{ ...input, marginTop: 8 }} />
            </label>
            <label>
              <strong>Company</strong>
              <input value={company} onChange={(event) => setCompany(event.target.value)} placeholder="DMoney Capital" style={{ ...input, marginTop: 8 }} />
            </label>
            <label>
              <strong>Phone</strong>
              <input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Phone number" style={{ ...input, marginTop: 8 }} />
            </label>
            <label>
              <strong>Profile Photo URL</strong>
              <input value={photoUrl} onChange={(event) => setPhotoUrl(event.target.value)} placeholder="https://..." style={{ ...input, marginTop: 8 }} />
            </label>
          </div>

          {photoUrl ? (
            <div style={{ marginTop: 18, border: "1px solid rgba(232,196,107,.22)", borderRadius: 22, overflow: "hidden" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photoUrl} alt="Profile preview" style={{ width: "100%", maxHeight: 320, objectFit: "cover", display: "block" }} />
            </div>
          ) : null}
        </section>

        <section style={card}>
          <p style={eyebrow}>I Am</p>
          {MEMBER_TYPES.map((item) => (
            <ToggleChip key={item} label={item} active={memberTypes.includes(item)} onClick={() => setMemberTypes(toggle(memberTypes, item))} />
          ))}
        </section>

        <section style={card}>
          <p style={eyebrow}>Markets</p>
          {MARKETS.map((item) => (
            <ToggleChip key={item} label={item} active={markets.includes(item)} onClick={() => setMarkets(toggle(markets, item))} />
          ))}
        </section>

        <section style={card}>
          <p style={eyebrow}>Strategies</p>
          {STRATEGIES.map((item) => (
            <ToggleChip key={item} label={item} active={strategies.includes(item)} onClick={() => setStrategies(toggle(strategies, item))} />
          ))}
        </section>

        <section style={card}>
          <p style={eyebrow}>Asset Focus</p>
          {ASSET_FOCUS.map((item) => (
            <ToggleChip key={item} label={item} active={assetFocus.includes(item)} onClick={() => setAssetFocus(toggle(assetFocus, item))} />
          ))}
        </section>

        <section style={card}>
          <p style={eyebrow}>What You Need</p>
          {NEEDS.map((item) => (
            <ToggleChip key={item} label={item} active={needs.includes(item)} onClick={() => setNeeds(toggle(needs, item))} />
          ))}
        </section>

        <section style={card}>
          <p style={eyebrow}>What You Can Provide</p>
          <p style={{ ...muted, fontSize: 18 }}>This tells the network where you add value.</p>
          {CAN_PROVIDE.map((item) => (
            <ToggleChip key={item} label={item} active={canProvide.includes(item)} onClick={() => setCanProvide(toggle(canProvide, item))} />
          ))}
        </section>

        <section style={card}>
          <p style={eyebrow}>Pain / Distress Signals</p>
          <p style={{ ...muted, fontSize: 18 }}>Choose the pain signals you can help with or want to be alerted about.</p>
          {PAIN_SIGNALS.map((item) => (
            <ToggleChip key={item} label={item} active={painSignals.includes(item)} onClick={() => setPainSignals(toggle(painSignals, item))} />
          ))}
        </section>

        <section style={card}>
          <p style={eyebrow}>Buy Box Details</p>
          <div className="vf-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <label>
              <strong>Buy Box / Focus</strong>
              <input value={buyBox} onChange={(event) => setBuyBox(event.target.value)} placeholder="SFR flips, 70% ARV, vacant land..." style={{ ...input, marginTop: 8 }} />
            </label>
            <label>
              <strong>Funding Capacity</strong>
              <input value={fundingCapacity} onChange={(event) => setFundingCapacity(event.target.value)} placeholder="5,000,000" style={{ ...input, marginTop: 8 }} />
            </label>
          </div>

          <label style={{ display: "block", marginTop: 14 }}>
            <strong>Strategy / Notes / What You Want VaultForge To Watch For</strong>
            <textarea value={strategyNotes} onChange={(event) => setStrategyNotes(event.target.value)} placeholder="Flips, funding, land, residential, commercial..." style={{ ...input, minHeight: 150, marginTop: 8 }} />
          </label>
        </section>

        <section style={card}>
          <p style={eyebrow}>Network Acceptance</p>
          <label style={{ display: "flex", gap: 12, alignItems: "flex-start", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={networkAccepted}
              onChange={(event) => setNetworkAccepted(event.target.checked)}
              style={{ width: 22, height: 22, marginTop: 4 }}
            />
            <span style={{ ...muted, fontSize: 18 }}>
              I agree to be visible inside the VaultForge member network for controlled routing, introductions, and connection requests.
            </span>
          </label>
        </section>

        <section style={{ ...card, position: "sticky", bottom: 12, zIndex: 10, backdropFilter: "blur(16px)" }}>
          <div className="vf-actions" style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button type="button" disabled={saving || !email} onClick={save} style={{ ...button, opacity: saving || !email ? 0.55 : 1 }}>
              {saving ? "Saving..." : "Save Profile"}
            </button>
            <Link href="/members" style={ghost}>Back to Members</Link>
            <button type="button" onClick={load} style={ghost}>Reload Profile</button>
          </div>
        </section>
      </div>
    </main>
  );
}
