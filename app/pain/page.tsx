"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import VaultForgeMemberNav from "../components/VaultForgeMemberNav";

const STATES = ["Georgia", "Florida", "North Carolina", "South Carolina", "Tennessee", "Alabama", "Texas"];

const PAIN_TYPES = [
  {
    key: "distressed_seller",
    eyebrow: "SELLER / EXIT",
    title: "Distressed Seller",
    note: "Owner needs a fast, clean, or private path out.",
  },
  {
    key: "buyer_needed",
    eyebrow: "DISPOSITION",
    title: "Buyer Needed",
    note: "Deal needs an end buyer, investor, or acquisition path.",
  },
  {
    key: "capital_needed",
    eyebrow: "FUNDING",
    title: "Capital Needed",
    note: "Bridge, gap, private money, JV, or acquisition capital needed.",
  },
  {
    key: "contractor_needed",
    eyebrow: "EXECUTION",
    title: "Contractor Needed",
    note: "Project needs labor, repair, buildout, inspection, or bid help.",
  },
  {
    key: "stalled_project",
    eyebrow: "PROJECT RESCUE",
    title: "Stalled Project",
    note: "Delay, money gap, permit, contractor, or execution issue.",
  },
  {
    key: "permit_city_issue",
    eyebrow: "MUNICIPAL",
    title: "Permit / City Issue",
    note: "Inspection, zoning, permit, municipal, code, or city issue blocking progress.",
  },
  {
    key: "emergency_exit",
    eyebrow: "URGENT",
    title: "Emergency Exit",
    note: "Urgent situation where speed, discretion, and routing are needed immediately.",
  },
  {
    key: "land_opportunity",
    eyebrow: "DEVELOPER / BUILDER / LAND BUYER",
    title: "Land Opportunity",
    note: "Land, entitlement, development, builder, rezoning, or site opportunity.",
  },
  {
    key: "commercial_opportunity",
    eyebrow: "COMMERCIAL BUYER / CAPITAL / OPERATOR",
    title: "Commercial Opportunity",
    note: "Commercial, multifamily, mixed-use, retail, office, industrial, or income asset.",
  },
];

const RESIDENTIAL_FIELDS = [
  ["beds", "Beds", "3"],
  ["baths", "Baths", "2"],
  ["sqft", "Square Feet", "1,650"],
  ["year_built", "Year Built", "1998"],
  ["occupancy", "Occupancy", "Vacant / Owner occupied / Tenant"],
  ["repairs_scope", "Repair Scope", "Roof, HVAC, cosmetic, foundation..."],
];

const COMMERCIAL_FIELDS = [
  ["commercial_property_type", "Commercial Property Type", "Retail, office, industrial, mixed-use..."],
  ["units_or_sqft", "Units / Square Feet", "12 units / 18,000 sqft"],
  ["tenant_status", "Tenant Status", "Vacant / occupied / partially leased"],
  ["noi_or_rent", "NOI / Rent", "$8,500 monthly rent / $72k NOI"],
  ["lease_status", "Lease Status", "Month-to-month / long-term / expiring"],
  ["commercial_notes", "Commercial Notes", "Parking, zoning, traffic, tenant mix..."],
];

const LAND_FIELDS = [
  ["acres", "Acres", "5.2"],
  ["zoning", "Zoning", "R-3 / commercial / agricultural / unknown"],
  ["utilities", "Utilities", "Water, sewer, power available?"],
  ["road_access", "Road Access", "Paved road / easement / landlocked"],
  ["entitlement_status", "Entitlement Status", "Raw, entitled, rezoning, permits pending"],
  ["land_notes", "Land Notes", "Topography, frontage, nearby development..."],
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

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(232,196,107,.16), transparent 30%), radial-gradient(circle at 85% 10%, rgba(157,243,191,.10), transparent 28%), linear-gradient(180deg,#020303,#071326 55%,#020303)",
  color: "white",
  padding: "22px 16px 100px",
  fontFamily: "Arial, sans-serif",
};

const wrap: React.CSSProperties = { width: "min(1180px,100%)", margin: "0 auto" };

const card: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.26)",
  borderRadius: 28,
  padding: 24,
  background: "rgba(255,255,255,.055)",
  marginBottom: 18,
  boxShadow: "0 24px 80px rgba(0,0,0,.28)",
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

const label: React.CSSProperties = {
  display: "block",
  color: "white",
  fontWeight: 850,
  marginBottom: 8,
};

const eyebrow: React.CSSProperties = {
  color: "#9df3bf",
  letterSpacing: ".22em",
  textTransform: "uppercase",
  fontWeight: 950,
  fontSize: 12,
};

const goldEyebrow: React.CSSProperties = {
  color: "#e8c46b",
  letterSpacing: ".22em",
  textTransform: "uppercase",
  fontWeight: 950,
  fontSize: 12,
};

const button: React.CSSProperties = {
  display: "inline-flex",
  justifyContent: "center",
  alignItems: "center",
  minHeight: 52,
  borderRadius: 999,
  padding: "13px 18px",
  border: 0,
  background: "linear-gradient(135deg,#f8e7b0,#9df3bf,#b55cff)",
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

const chip: React.CSSProperties = {
  display: "inline-flex",
  border: "1px solid rgba(157,243,191,.25)",
  background: "rgba(157,243,191,.08)",
  color: "#9df3bf",
  borderRadius: 999,
  padding: "8px 11px",
  fontWeight: 850,
  margin: "0 7px 7px 0",
  fontSize: 12,
};

const defaultForm: Record<string, any> = {
  pain_type: "distressed_seller",
  title: "",
  help_requested: "Need buyer, private capital, operator, or structured exit.",
  notes: "",
  operating_state: "Georgia",
  city: "",
  area: "",
  asset_type: "Residential",
  address: "",
  urgency: "High",
  timeline: "",
  confidentiality: "Members only",
  capital_needed: "",
  asking_price: "",
  arv_value: "",
  repairs_needed: "",
};

export default function PainPage() {
  const [email, setEmail] = useState("");
  const [form, setForm] = useState<Record<string, any>>(defaultForm);
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [links, setLinks] = useState<Record<string, string>>({});

  useEffect(() => {
    setEmail(getEmail());
  }, []);

  const selectedPain = useMemo(() => {
    return PAIN_TYPES.find((item) => item.key === form.pain_type) || PAIN_TYPES[0];
  }, [form.pain_type]);

  const assetFields = useMemo(() => {
    if (form.asset_type === "Commercial") return COMMERCIAL_FIELDS;
    if (form.asset_type === "Land") return LAND_FIELDS;
    return RESIDENTIAL_FIELDS;
  }, [form.asset_type]);

  function update(key: string, value: any) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function selectFiles(nextFiles: FileList | null) {
    const list = Array.from(nextFiles || []).slice(0, 8);
    setFiles(list);
    setPreviewUrls(list.map((file) => URL.createObjectURL(file)));
  }

  async function uploadPhoto(file: File) {
    const body = new FormData();
    body.append("file", file);
    body.append("email", email);

    const res = await fetch("/api/uploads/pain", {
      method: "POST",
      headers: { "x-vf-email": email },
      body,
    });

    const data = await safeJson(res);

    if (!res.ok || data.ok === false) {
      throw new Error(clean(data.error || data.details || "Photo upload failed."));
    }

    return clean(data.url || data.publicUrl || data.photo_url || data.image_url || data.profile_photo_url);
  }

  async function submitPain() {
    setSubmitting(true);
    setStatus("Building VaultForge signal...");
    setLinks({});

    try {
      const photoUrls: string[] = [];

      for (const file of files) {
        const url = await uploadPhoto(file);
        if (url && url.startsWith("http")) photoUrls.push(url);
      }

      const asset_specific: Record<string, any> = {};
      for (const [key] of assetFields) {
        asset_specific[key] = clean(form[key]);
      }

      const res = await fetch("/api/pain/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-vf-email": email,
        },
        body: JSON.stringify({
          ...form,
          email,
          member_email: email,
          submitted_by: email,
          photo_urls: photoUrls,
          photos: photoUrls,
          asset_specific,
        }),
      });

      const data = await safeJson(res);

      if (!res.ok || data.ok === false) {
        throw new Error(clean(data.error || data.details || "Pain signal could not be created."));
      }

      setLinks(data.direct_links || data.links || {});
      setStatus("Pain signal created. Signal room, routing context, and AI-style summary are ready.");
    } catch (error: any) {
      setStatus(error?.message || "Pain signal could not be created.");
    } finally {
      setSubmitting(false);
    }
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
          title="Pain Button"
          subtitle="Submit a real estate problem, deal, capital gap, or execution signal."
          active="pain"
        />

        <section style={card}>
          <p style={goldEyebrow}>VaultForge Pain Intelligence</p>
          <h1 style={{ fontSize: "clamp(52px,10vw,96px)", lineHeight: 0.88, margin: "10px 0 18px", letterSpacing: "-.06em" }}>
            Signal the network.
          </h1>
          <p style={{ color: "#cbd5e1", fontSize: 18, lineHeight: 1.5 }}>
            This creates a structured Pain record, a Signal Room, AI-style summary, best actions, risk flags, and routing context.
          </p>
          <div style={{ marginTop: 14 }}>
            <span style={chip}>Signed in: {email || "unknown"}</span>
            <span style={chip}>Asset: {form.asset_type}</span>
            <span style={chip}>State: {form.operating_state}</span>
          </div>
        </section>

        {status ? (
          <section style={card}>
            <h2 style={{ marginTop: 0 }}>{status}</h2>
            <div className="vf-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {links.signal_room ? <Link href={links.signal_room} style={button}>Open Signal Room</Link> : null}
              {links.pain_feed ? <Link href={links.pain_feed} style={ghost}>Pain Feed</Link> : null}
              {links.routing_room ? <Link href={links.routing_room} style={ghost}>Routing Room</Link> : null}
              <Link href="/dashboard" style={ghost}>Dashboard</Link>
            </div>
          </section>
        ) : null}

        <section style={card}>
          <p style={goldEyebrow}>Choose Signal Type</p>
          <div className="vf-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 14 }}>
            {PAIN_TYPES.map((item) => {
              const active = form.pain_type === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => update("pain_type", item.key)}
                  style={{
                    textAlign: "left",
                    borderRadius: 24,
                    padding: 20,
                    border: active ? "1px solid rgba(232,196,107,.70)" : "1px solid rgba(255,255,255,.14)",
                    background: active ? "rgba(232,196,107,.12)" : "rgba(255,255,255,.05)",
                    color: "white",
                    cursor: "pointer",
                  }}
                >
                  <div style={eyebrow}>{item.eyebrow}</div>
                  <h3 style={{ color: active ? "#e8c46b" : "#5aa2ff", fontSize: 26, lineHeight: 1, margin: "14px 0 8px" }}>
                    {item.title}
                  </h3>
                  <p style={{ color: "#cbd5e1", lineHeight: 1.45 }}>{item.note}</p>
                </button>
              );
            })}
          </div>
        </section>

        <section className="vf-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
          <div style={card}>
            <p style={eyebrow}>Core Signal</p>
            <label style={label}>Title / What is happening?</label>
            <input style={input} value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="Example: Stalled flip needs gap funding" />

            <label style={{ ...label, marginTop: 18 }}>Help Requested</label>
            <textarea style={{ ...input, minHeight: 110 }} value={form.help_requested} onChange={(e) => update("help_requested", e.target.value)} />

            <label style={{ ...label, marginTop: 18 }}>Notes / Situation</label>
            <textarea style={{ ...input, minHeight: 140 }} value={form.notes} onChange={(e) => update("notes", e.target.value)} placeholder="Explain the pressure, opportunity, obstacle, and what needs to happen next." />
          </div>

          <div style={card}>
            <p style={eyebrow}>Market / Asset</p>

            <label style={label}>Operating State</label>
            <select style={input} value={form.operating_state} onChange={(e) => update("operating_state", e.target.value)}>
              {STATES.map((state) => <option key={state}>{state}</option>)}
            </select>

            <label style={{ ...label, marginTop: 18 }}>City</label>
            <input style={input} value={form.city} onChange={(e) => update("city", e.target.value)} placeholder="City / market" />

            <label style={{ ...label, marginTop: 18 }}>Area / Submarket</label>
            <input style={input} value={form.area} onChange={(e) => update("area", e.target.value)} placeholder="Example: Buckhead, East Atlanta, North..." />

            <label style={{ ...label, marginTop: 18 }}>Asset Type</label>
            <select style={input} value={form.asset_type} onChange={(e) => update("asset_type", e.target.value)}>
              <option>Residential</option>
              <option>Commercial</option>
              <option>Land</option>
            </select>

            <label style={{ ...label, marginTop: 18 }}>Address or General Location</label>
            <input style={input} value={form.address} onChange={(e) => update("address", e.target.value)} placeholder="Exact address if safe, or general location" />
          </div>
        </section>

        <section style={card}>
          <p style={goldEyebrow}>{form.asset_type} Details</p>
          <p style={{ color: "#cbd5e1", fontSize: 18 }}>
            These fields change based on Residential, Commercial, or Land.
          </p>
          <div className="vf-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 14 }}>
            {assetFields.map(([key, fieldLabel, placeholder]) => (
              <div key={key}>
                <label style={label}>{fieldLabel}</label>
                <input
                  style={input}
                  value={form[key] || ""}
                  onChange={(e) => update(key, e.target.value)}
                  placeholder={placeholder}
                />
              </div>
            ))}
          </div>
        </section>

        <section className="vf-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
          <div style={card}>
            <p style={eyebrow}>Pressure / Timeline</p>

            <label style={label}>Urgency</label>
            <select style={input} value={form.urgency} onChange={(e) => update("urgency", e.target.value)}>
              <option>Emergency</option>
              <option>High</option>
              <option>Medium</option>
              <option>Normal</option>
            </select>

            <label style={{ ...label, marginTop: 18 }}>Timeline / Deadline</label>
            <input style={input} value={form.timeline} onChange={(e) => update("timeline", e.target.value)} placeholder="Example: 7 days, 30 days, closing Friday..." />

            <label style={{ ...label, marginTop: 18 }}>Confidentiality</label>
            <select style={input} value={form.confidentiality} onChange={(e) => update("confidentiality", e.target.value)}>
              <option>Members only</option>
              <option>Owner review first</option>
              <option>Private / sensitive</option>
            </select>
          </div>

          <div style={card}>
            <p style={eyebrow}>Numbers</p>

            <label style={label}>Capital Needed</label>
            <input style={input} value={form.capital_needed} onChange={(e) => update("capital_needed", e.target.value)} placeholder="$125,000" />

            <label style={{ ...label, marginTop: 18 }}>Asking Price</label>
            <input style={input} value={form.asking_price} onChange={(e) => update("asking_price", e.target.value)} placeholder="$210,000" />

            <label style={{ ...label, marginTop: 18 }}>ARV / Value</label>
            <input style={input} value={form.arv_value} onChange={(e) => update("arv_value", e.target.value)} placeholder="$300,000" />

            <label style={{ ...label, marginTop: 18 }}>Repairs / Remaining Work</label>
            <input style={input} value={form.repairs_needed} onChange={(e) => update("repairs_needed", e.target.value)} placeholder="$45,000 or scope summary" />
          </div>
        </section>

        <section style={card}>
          <p style={goldEyebrow}>Photos / Files</p>
          <p style={{ color: "#cbd5e1", fontSize: 18 }}>
            Select photos from your phone or upload files from your device.
          </p>
          <input type="file" accept="image/*" multiple style={input} onChange={(e) => selectFiles(e.target.files)} />

          {previewUrls.length ? (
            <div className="vf-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12, marginTop: 16 }}>
              {previewUrls.map((url, index) => (
                <div key={url} style={{ borderRadius: 18, overflow: "hidden", border: "1px solid rgba(232,196,107,.22)" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`Preview ${index + 1}`} style={{ width: "100%", height: 160, objectFit: "cover", display: "block" }} />
                </div>
              ))}
            </div>
          ) : null}
        </section>

        <section style={{ ...card, position: "sticky", bottom: 12, zIndex: 20, backdropFilter: "blur(16px)" }}>
          <div className="vf-actions" style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button type="button" disabled={submitting} onClick={submitPain} style={{ ...button, opacity: submitting ? 0.6 : 1 }}>
              {submitting ? "Creating Signal..." : "Submit Pain Signal"}
            </button>
            <Link href="/pain-feed" style={ghost}>Pain Feed</Link>
            <Link href="/dashboard" style={ghost}>Dashboard</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
