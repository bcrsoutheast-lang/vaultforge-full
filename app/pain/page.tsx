"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import VaultForgeMemberNav from "../components/VaultForgeMemberNav";

const STATES = ["Georgia", "Florida", "North Carolina", "South Carolina", "Tennessee", "Alabama", "Texas"];

const PAIN_TYPES = [
  { key: "distressed_seller", eyebrow: "SELLER / EXIT", title: "Distressed Seller", note: "Owner needs a fast, clean, or private path out." },
  { key: "buyer_needed", eyebrow: "DISPOSITION", title: "Buyer Needed", note: "Deal needs an end buyer, investor, or acquisition path." },
  { key: "capital_needed", eyebrow: "FUNDING", title: "Capital Needed", note: "Bridge, gap, private money, JV, or acquisition capital needed." },
  { key: "contractor_needed", eyebrow: "EXECUTION", title: "Contractor Needed", note: "Project needs labor, repair, buildout, inspection, or bid help." },
  { key: "stalled_project", eyebrow: "PROJECT RESCUE", title: "Stalled Project", note: "Delay, money gap, permit, contractor, or execution issue." },
  { key: "permit_city_issue", eyebrow: "MUNICIPAL", title: "Permit / City Issue", note: "Inspection, zoning, permit, municipal, code, or city issue blocking progress." },
  { key: "emergency_exit", eyebrow: "URGENT", title: "Emergency Exit", note: "Urgent situation where speed, discretion, and routing are needed immediately." },
  { key: "land_opportunity", eyebrow: "DEVELOPER / BUILDER / LAND BUYER", title: "Land Opportunity", note: "Land, entitlement, development, builder, rezoning, or site opportunity." },
  { key: "commercial_opportunity", eyebrow: "COMMERCIAL BUYER / CAPITAL / OPERATOR", title: "Commercial Opportunity", note: "Commercial, multifamily, mixed-use, retail, office, industrial, or income asset." },
];

const FIELD_SETS: Record<string, Array<[string, string, string]>> = {
  Residential: [
    ["beds", "Beds", "3"],
    ["baths", "Baths", "2"],
    ["sqft", "Square Feet", "1,650"],
    ["year_built", "Year Built", "1998"],
    ["occupancy", "Occupancy", "Vacant / Owner occupied / Tenant occupied"],
    ["repair_scope", "Repair Scope", "Roof, HVAC, cosmetic, foundation, full rehab..."],
    ["exit_strategy", "Likely Exit Strategy", "Flip / rental / wholesale / creative finance"],
    ["access_status", "Access Status", "Can show / drive-by only / needs appointment"],
  ],
  Commercial: [
    ["commercial_property_type", "Commercial Property Type", "Retail, office, industrial, mixed-use, multifamily..."],
    ["units_or_sqft", "Units / Square Feet", "12 units / 18,000 sqft"],
    ["tenant_status", "Tenant Status", "Vacant / occupied / partially leased"],
    ["noi_or_rent", "NOI / Rent", "$8,500 monthly rent / $72k NOI"],
    ["lease_status", "Lease Status", "Month-to-month / long-term / expiring"],
    ["cap_rate", "Cap Rate / Yield", "7.5% / unknown"],
    ["parking_access", "Parking / Access", "On-site parking, frontage, access notes"],
    ["commercial_notes", "Commercial Notes", "Tenant mix, zoning, traffic, condition..."],
  ],
  Land: [
    ["acres", "Acres", "5.2"],
    ["zoning", "Zoning", "R-3 / commercial / agricultural / unknown"],
    ["utilities", "Utilities", "Water, sewer, power available?"],
    ["road_access", "Road Access", "Paved road / easement / landlocked"],
    ["entitlement_status", "Entitlement Status", "Raw, entitled, rezoning, permits pending"],
    ["topography", "Topography", "Flat, wooded, slope, floodplain concerns"],
    ["frontage", "Frontage", "Road frontage / corner lot / access notes"],
    ["land_notes", "Land Notes", "Nearby development, builder fit, subdivision potential..."],
  ],
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

function firstSavedLink(data: Record<string, any>) {
  const links = data?.direct_links || data?.links || {};
  const painId = clean(data?.pain_id || data?.id || data?.item_id || data?.pain?.id || "");

  return {
    pain_room:
      clean(links.pain_room) ||
      clean(data?.pain_room) ||
      (painId ? `/pain-room/${encodeURIComponent(painId)}` : ""),
    dashboard: clean(links.dashboard) || "/dashboard",
    pain_feed: clean(links.pain_feed) || "/pain-feed",
  };
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

const commandBar: React.CSSProperties = {
  position: "sticky",
  top: 10,
  zIndex: 40,
  border: "1px solid rgba(232,196,107,.28)",
  borderRadius: 24,
  padding: 12,
  background: "linear-gradient(145deg,rgba(2,6,23,.92),rgba(7,19,38,.86))",
  boxShadow: "0 18px 70px rgba(0,0,0,.42)",
  backdropFilter: "blur(14px)",
  marginBottom: 16,
};

const smallButton: React.CSSProperties = {
  ...button,
  minHeight: 40,
  padding: "9px 12px",
  fontSize: 13,
};

const smallGhost: React.CSSProperties = {
  ...ghost,
  minHeight: 40,
  padding: "9px 12px",
  fontSize: 13,
};

const closeButton: React.CSSProperties = {
  ...smallGhost,
  color: "#fecaca",
  border: "1px solid rgba(248,113,113,.34)",
  background: "rgba(248,113,113,.10)",
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
  county: "",
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
  contact_name: "",
  contact_phone: "",
  contact_email: "",
  preferred_contact: "Call first",
  contact_notes: "",
};


function numberValue(value: unknown) {
  const text = clean(value).replace(/[^0-9.-]/g, "");
  const number = Number(text);
  return Number.isFinite(number) ? number : 0;
}

function moneyText(value: unknown) {
  const number = numberValue(value);
  if (!number) return "Not listed";

  return number.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function hasText(value: unknown) {
  return clean(value).length > 0;
}

function lowerText(...values: unknown[]) {
  return values.map(clean).join(" ").toLowerCase();
}

function clampScore(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function bestBottleneck(form: Record<string, any>) {
  const text = lowerText(
    form.pain_type,
    form.help_requested,
    form.notes,
    form.capital_needed,
    form.repairs_needed,
    form.timeline,
    form.contractor_scope,
    form.repair_scope,
    form.commercial_notes,
    form.land_notes
  );

  if (text.includes("foreclosure") || text.includes("deadline") || text.includes("emergency") || text.includes("fast close")) return "Time Pressure";
  if (text.includes("capital") || text.includes("fund") || text.includes("lender") || text.includes("gap") || text.includes("money")) return "Capital Gap";
  if (text.includes("contractor") || text.includes("repair") || text.includes("roof") || text.includes("hvac") || text.includes("buildout")) return "Execution / Contractor Gap";
  if (text.includes("permit") || text.includes("city") || text.includes("zoning") || text.includes("code")) return "Municipal / Approval Blocker";
  if (text.includes("buyer") || text.includes("sell") || text.includes("exit") || text.includes("disposition")) return "Buyer / Exit Gap";
  if (text.includes("tenant") || text.includes("lease") || text.includes("occupancy")) return "Occupancy / Lease Issue";

  if (form.pain_type === "capital_needed") return "Capital Gap";
  if (form.pain_type === "contractor_needed" || form.pain_type === "stalled_project") return "Execution / Contractor Gap";
  if (form.pain_type === "permit_city_issue") return "Municipal / Approval Blocker";
  if (form.pain_type === "buyer_needed" || form.pain_type === "distressed_seller" || form.pain_type === "emergency_exit") return "Buyer / Exit Gap";

  return "Owner Review / Triage";
}

function bestStack(form: Record<string, any>) {
  const text = lowerText(form.pain_type, form.help_requested, form.notes, form.capital_needed, form.repairs_needed, form.asset_type);
  const stack: string[] = [];

  if (text.includes("buyer") || text.includes("sell") || text.includes("exit") || form.pain_type === "buyer_needed" || form.pain_type === "distressed_seller") stack.push("Buyer");
  if (text.includes("capital") || text.includes("fund") || text.includes("lender") || form.pain_type === "capital_needed") stack.push("Private Lender");
  if (text.includes("contractor") || text.includes("repair") || form.pain_type === "contractor_needed" || form.pain_type === "stalled_project") stack.push("Contractor");
  if (text.includes("jv") || text.includes("partner") || text.includes("operator") || form.pain_type === "stalled_project") stack.push("Operator / JV Partner");
  if (text.includes("permit") || text.includes("city") || text.includes("zoning") || form.pain_type === "permit_city_issue") stack.push("Local Operator");
  if (text.includes("title") || text.includes("probate") || text.includes("lien")) stack.push("Attorney / Title");
  if (form.asset_type === "Land" && !stack.includes("Builder / Developer")) stack.push("Builder / Developer");
  if (form.asset_type === "Commercial" && !stack.includes("Commercial Investor")) stack.push("Commercial Investor");

  if (!stack.length) stack.push("Owner Review", "Operator", "Buyer");

  return Array.from(new Set(stack)).slice(0, 5);
}

function bestNextMove(form: Record<string, any>) {
  const bottleneck = bestBottleneck(form);
  const stack = bestStack(form);
  const market = [clean(form.city), clean(form.county), clean(form.operating_state)].filter(Boolean).join(", ") || "the target market";

  if (bottleneck === "Time Pressure") return `Escalate as urgent: confirm deadline, access, seller contact, and route to ${stack.slice(0, 2).join(" + ")} in ${market}.`;
  if (bottleneck === "Capital Gap") return `Package the numbers, confirm exact funding gap, then route to ${stack.includes("Private Lender") ? "private lender / capital partner" : "capital partner"}.`;
  if (bottleneck === "Execution / Contractor Gap") return "Get photos, scope, access, and timeline tight; route to contractor/operator before buyer exposure.";
  if (bottleneck === "Municipal / Approval Blocker") return "Clarify municipality, permit/code issue, timeline, and zoning facts before routing to local operator.";
  if (bottleneck === "Buyer / Exit Gap") return "Package the asset, owner timeline, and price target; route first to buyer/operator fit instead of broad exposure.";
  if (bottleneck === "Occupancy / Lease Issue") return "Clarify lease, tenant status, access rights, and legal constraints before any intro.";

  return "Capture the missing facts, then route to the highest-fit operator stack.";
}

function pressureRead(form: Record<string, any>) {
  const text = lowerText(form.urgency, form.timeline, form.notes, form.help_requested, form.pain_type);
  let score = 35;

  if (form.urgency === "Emergency") score += 35;
  if (form.urgency === "High") score += 24;
  if (form.urgency === "Medium") score += 12;
  if (text.includes("foreclosure")) score += 24;
  if (text.includes("deadline") || text.includes("closing") || text.includes("friday")) score += 18;
  if (text.includes("fast close") || text.includes("urgent")) score += 18;
  if (hasText(form.timeline)) score += 8;

  return clampScore(score);
}

function readinessRead(form: Record<string, any>, photoCount: number) {
  let score = 24;

  if (hasText(form.title)) score += 10;
  if (hasText(form.help_requested)) score += 12;
  if (hasText(form.notes)) score += 12;
  if (hasText(form.city) && hasText(form.county) && hasText(form.operating_state)) score += 10;
  if (hasText(form.address) || hasText(form.area)) score += 6;
  if (hasText(form.timeline)) score += 8;
  if (hasText(form.asking_price) || hasText(form.arv_value) || hasText(form.capital_needed)) score += 12;
  if (photoCount) score += 12;

  return clampScore(score);
}

function capitalRiskRead(form: Record<string, any>) {
  const ask = numberValue(form.asking_price);
  const arv = numberValue(form.arv_value);
  const repairs = numberValue(form.repairs_needed);
  const capital = numberValue(form.capital_needed);
  let score = 28;

  if (capital) score += 26;
  if (ask && arv && ask >= arv * 0.82) score += 18;
  if (repairs && arv && repairs >= arv * 0.18) score += 14;
  if (lowerText(form.help_requested, form.notes).includes("gap")) score += 18;
  if (lowerText(form.help_requested, form.notes).includes("lender")) score += 10;

  return clampScore(score);
}

function intelligenceRead(form: Record<string, any>, selectedPain: { title: string }, photoCount: number) {
  const market = [clean(form.city), clean(form.county), clean(form.operating_state)].filter(Boolean).join(", ") || "market not listed";
  const bottleneck = bestBottleneck(form);
  const stack = bestStack(form);
  const ask = moneyText(form.asking_price);
  const arv = moneyText(form.arv_value);
  const repairs = moneyText(form.repairs_needed);
  const capital = moneyText(form.capital_needed);

  return {
    bottleneck,
    stack,
    bestMove: bestNextMove(form),
    pressure: pressureRead(form),
    readiness: readinessRead(form, photoCount),
    capitalRisk: capitalRiskRead(form),
    headline: `${selectedPain.title} · ${form.asset_type} · ${market}`,
    summary: `VaultForge reads this as a ${form.asset_type} ${selectedPain.title.toLowerCase()} case in ${market}. Primary bottleneck: ${bottleneck}. Stack to consider: ${stack.join(", ")}. Numbers: ask ${ask}, ARV/value ${arv}, repairs/scope ${repairs}, capital need ${capital}.`,
  };
}

function missingEinsteinPrompts(form: Record<string, any>, photoCount: number) {
  const missing: string[] = [];

  if (!hasText(form.title)) missing.push("title the problem clearly");
  if (!hasText(form.help_requested)) missing.push("say exactly what help is needed");
  if (!hasText(form.timeline)) missing.push("add timeline or deadline");
  if (!hasText(form.operating_state)) missing.push("select state");
  if (!hasText(form.county)) missing.push("add county");
  if (!hasText(form.city)) missing.push("add city/market");
  if (!hasText(form.notes)) missing.push("add the real situation/context");
  if (!photoCount) missing.push("add photos if possible");

  return missing.slice(0, 5);
}


function CommandExitBar() {
  function goBack() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      window.history.back();
      return;
    }

    if (typeof window !== "undefined") window.location.href = "/dashboard";
  }

  return (
    <section style={commandBar}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
        <div>
          <div style={{ color: "#e8c46b", letterSpacing: ".18em", textTransform: "uppercase", fontWeight: 950, fontSize: 11 }}>
            VaultForge Pain Room Exit
          </div>
          <div style={{ color: "rgba(255,255,255,.70)", fontSize: 13, marginTop: 4 }}>
            Pain Button is open. Save the signal or exit back to the command center.
          </div>
        </div>

        <div className="vf-command-actions" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="button" onClick={goBack} style={closeButton}>Back</button>
          <Link href="/dashboard" style={smallButton}>Dashboard</Link>
          <Link href="/pain-feed" style={smallGhost}>Pain Feed</Link>
          <Link href="/projects" style={smallGhost}>Workstations</Link>
          <Link href="/submit" style={smallGhost}>Create Deal</Link>
          <Link href="/messages" style={smallGhost}>Messages</Link>
          <Link href="/smart-ai" style={smallGhost}>Smart AI</Link>
        </div>
      </div>
    </section>
  );
}

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

  const assetFields = FIELD_SETS[form.asset_type] || FIELD_SETS.Residential;

  const einstein = useMemo(() => intelligenceRead(form, selectedPain, previewUrls.length), [form, selectedPain, previewUrls.length]);
  const missingPrompts = useMemo(() => missingEinsteinPrompts(form, previewUrls.length), [form, previewUrls.length]);

  function update(key: string, value: any) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function selectAsset(assetType: "Residential" | "Commercial" | "Land") {
    setForm((prev) => ({
      ...prev,
      asset_type: assetType,
      pain_type:
        assetType === "Commercial"
          ? "commercial_opportunity"
          : assetType === "Land"
          ? "land_opportunity"
          : prev.pain_type,
    }));
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

    try {
      const res = await fetch("/api/uploads/pain", {
        method: "POST",
        headers: { "x-vf-email": email },
        body,
      });

      const data = await safeJson(res);

      if (!res.ok || data.ok === false) {
        return {
          url: "",
          error: clean(data.error || data.details || "Photo upload failed."),
        };
      }

      return {
        url: clean(data.url || data.publicUrl || data.public_url || data.photo_url || data.image_url || data.main_photo_url || data.profile_photo_url),
        error: "",
      };
    } catch (error: any) {
      return {
        url: "",
        error: error?.message || "Photo upload failed.",
      };
    }
  }

  async function submitPain() {
    setSubmitting(true);
    setStatus("Saving Pain Room...");
    setLinks({});

    try {
      if (!clean(form.operating_state)) {
        throw new Error("State is required.");
      }

      if (!clean(form.county)) {
        throw new Error("County is required.");
      }

      if (!clean(form.city)) {
        throw new Error("City is required.");
      }

      const photoUrls: string[] = [];
      const photoWarnings: string[] = [];

      for (const file of files) {
        const uploaded = await uploadPhoto(file);

        if (uploaded.url && uploaded.url.startsWith("http")) {
          photoUrls.push(uploaded.url);
        } else if (uploaded.error) {
          photoWarnings.push(`${file.name}: ${uploaded.error}`);
        }
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
          state: form.operating_state,
          county: form.county,
          county_name: form.county,
          market_county: form.county,
          email,
          member_email: email,
          submitted_by: email,
          owner_name: form.contact_name,
          owner_phone: form.contact_phone,
          owner_contact_email: form.contact_email,
          seller_name: form.contact_name,
          seller_phone: form.contact_phone,
          seller_email: form.contact_email,
          contact_name: form.contact_name,
          contact_phone: form.contact_phone,
          contact_email: form.contact_email,
          preferred_contact: form.preferred_contact,
          contact_notes: form.contact_notes,
          seller_contact_notes: form.contact_notes,
          photo_urls: photoUrls,
          photos: photoUrls,
          photo_upload_warning: photoWarnings.join(" | "),
          photo_upload_failed_count: photoWarnings.length,
          asset_specific,
        }),
      });

      const data = await safeJson(res);

      if (!res.ok || data.ok === false) {
        throw new Error(clean(data.error || data.details || "Pain signal could not be created."));
      }

      const savedLinks = firstSavedLink(data);

      setLinks(savedLinks);
      setStatus(
        photoWarnings.length
          ? `Saved to Pain Room. ${photoWarnings.length} photo upload did not save, but the Pain record was not blocked. We can fix Storage next.`
          : "Saved to Pain Room. VaultForge will use this pain record to alert and match the right members in the background."
      );

      previewUrls.forEach((url) => URL.revokeObjectURL(url));
      setForm(defaultForm);
      setFiles([]);
      setPreviewUrls([]);
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
          .vf-actions > *,
          .vf-command-actions > * {
            width: 100%;
            box-sizing: border-box;
            justify-content: center;
          }

          .vf-command-actions {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 8px !important;
          }
        }
      `}</style>

      <div style={wrap}>
        <CommandExitBar />

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
            This creates one visible Pain Room. VaultForge uses the problem details to alert and match the right members in the background.
          </p>
          <div style={{ marginTop: 14 }}>
            <span style={chip}>Signed in: {email || "unknown"}</span>
            <span style={chip}>Asset: {form.asset_type}</span>
            <span style={chip}>State: {form.operating_state}</span>
            <span style={chip}>County: {form.county || "needed"}</span>
            <span style={chip}>Einstein Mode: Live intake intelligence</span>
          </div>
        </section>

        <section style={{ ...card, borderColor: "rgba(157,243,191,.34)", background: "linear-gradient(145deg,rgba(157,243,191,.075),rgba(232,196,107,.055),rgba(255,255,255,.035))" }}>
          <p style={goldEyebrow}>Einstein Live Read</p>
          <h2 style={{ fontSize: "clamp(34px,6vw,64px)", lineHeight: .95, letterSpacing: "-.045em", margin: "8px 0 12px" }}>
            {einstein.headline}
          </h2>
          <p style={{ color: "#dbeafe", fontSize: 18, lineHeight: 1.55, maxWidth: 980 }}>
            {einstein.summary}
          </p>

          <div className="vf-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 12, marginTop: 16 }}>
            <div style={{ border: "1px solid rgba(255,255,255,.12)", borderRadius: 18, padding: 14, background: "rgba(0,0,0,.16)" }}>
              <div style={goldEyebrow}>Primary Bottleneck</div>
              <div style={{ fontSize: 24, fontWeight: 950, marginTop: 8 }}>{einstein.bottleneck}</div>
            </div>
            <div style={{ border: "1px solid rgba(255,255,255,.12)", borderRadius: 18, padding: 14, background: "rgba(0,0,0,.16)" }}>
              <div style={goldEyebrow}>Best Operator Stack</div>
              <div style={{ fontSize: 20, fontWeight: 900, marginTop: 8 }}>{einstein.stack.join(" → ")}</div>
            </div>
            <div style={{ border: "1px solid rgba(255,255,255,.12)", borderRadius: 18, padding: 14, background: "rgba(0,0,0,.16)" }}>
              <div style={goldEyebrow}>Best Next Move</div>
              <div style={{ fontSize: 18, fontWeight: 850, marginTop: 8, lineHeight: 1.45 }}>{einstein.bestMove}</div>
            </div>
          </div>

          <div className="vf-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 12, marginTop: 12 }}>
            {[
              ["Pressure", einstein.pressure, "Timeline, urgency, distress, and escalation signals."],
              ["Routing Readiness", einstein.readiness, "How complete the case is for first-pass routing."],
              ["Capital Risk", einstein.capitalRisk, "Funding gap, numbers, spread, and execution exposure."],
            ].map(([name, score, caption]) => (
              <div key={String(name)} style={{ border: "1px solid rgba(255,255,255,.12)", borderRadius: 18, padding: 14, background: "rgba(0,0,0,.16)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, fontWeight: 950 }}>
                  <span>{name}</span>
                  <span>{score}%</span>
                </div>
                <div style={{ height: 8, borderRadius: 999, background: "rgba(255,255,255,.12)", overflow: "hidden", marginTop: 10 }}>
                  <div style={{ width: `${score}%`, height: "100%", borderRadius: 999, background: "linear-gradient(90deg,#ff6b6b,#f8e7b0,#9df3bf)" }} />
                </div>
                <p style={{ color: "#cbd5e1", margin: "8px 0 0", fontSize: 13, lineHeight: 1.45 }}>{caption}</p>
              </div>
            ))}
          </div>

          {missingPrompts.length ? (
            <div style={{ marginTop: 14, border: "1px solid rgba(232,196,107,.22)", borderRadius: 18, padding: 14, background: "rgba(232,196,107,.075)" }}>
              <div style={goldEyebrow}>Einstein Wants</div>
              <p style={{ color: "#f8e7b0", margin: "8px 0 0", fontWeight: 850, lineHeight: 1.45 }}>
                To make routing sharper: {missingPrompts.join(", ")}. This does not block saving.
              </p>
            </div>
          ) : null}
        </section>

        {status ? (
          <section style={card}>
            <p style={goldEyebrow}>Saved Destination</p>
            <h2 style={{ marginTop: 0 }}>{status}</h2>
            <p style={{ color: "#cbd5e1", fontSize: 17, lineHeight: 1.5 }}>
              Pain is the visible source of truth. Alerts/member matching can happen behind the scenes,
              but the owner should open the Pain Room to review and work the problem.
            </p>
            <div className="vf-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {links.pain_room ? <Link href={links.pain_room} style={button}>Open Pain Room</Link> : null}
              <Link href={links.dashboard || "/dashboard"} style={ghost}>Dashboard</Link>
              <Link href={links.pain_feed || "/pain-feed"} style={ghost}>Pain Feed</Link>
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

        <section style={card}>
          <p style={goldEyebrow}>Asset Form Type</p>
          <h2 style={{ fontSize: "clamp(32px,6vw,58px)", margin: "8px 0 14px", letterSpacing: "-.04em" }}>
            {form.asset_type} fields are active.
          </h2>
          <p style={{ color: "#cbd5e1", fontSize: 18, lineHeight: 1.5 }}>
            Click Residential, Commercial, or Land. The exact field card below changes immediately.
          </p>

          <div className="vf-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 12, marginTop: 18 }}>
            {(["Residential", "Commercial", "Land"] as const).map((assetType) => {
              const active = form.asset_type === assetType;
              return (
                <button
                  key={assetType}
                  type="button"
                  onClick={() => selectAsset(assetType)}
                  style={{
                    minHeight: 86,
                    borderRadius: 22,
                    border: active ? "1px solid rgba(232,196,107,.80)" : "1px solid rgba(255,255,255,.16)",
                    background: active ? "linear-gradient(135deg,#f8e7b0,#9df3bf,#b55cff)" : "rgba(255,255,255,.06)",
                    color: active ? "#06100a" : "white",
                    fontSize: 22,
                    fontWeight: 950,
                    cursor: "pointer",
                  }}
                >
                  {assetType}
                </button>
              );
            })}
          </div>
        </section>

        <section style={{ ...card, borderColor: "rgba(157,243,191,.38)" }}>
          <p style={goldEyebrow}>{form.asset_type} Specific Fields</p>
          <h2 style={{ marginTop: 0 }}>
            {form.asset_type === "Residential"
              ? "Beds, baths, sqft, occupancy, repair scope, and exit strategy."
              : form.asset_type === "Commercial"
              ? "Property type, units/sqft, tenant status, NOI/rent, lease status, and cap rate."
              : "Acres, zoning, utilities, road access, entitlement status, and land notes."}
          </h2>

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

            <label style={{ ...label, marginTop: 18 }}>County</label>
            <input style={input} value={form.county || ""} onChange={(e) => update("county", e.target.value)} placeholder="County, parish, or local market bucket" />

            <label style={{ ...label, marginTop: 18 }}>City</label>
            <input style={input} value={form.city} onChange={(e) => update("city", e.target.value)} placeholder="City / market" />

            <label style={{ ...label, marginTop: 18 }}>Area / Submarket</label>
            <input style={input} value={form.area} onChange={(e) => update("area", e.target.value)} placeholder="Example: Buckhead, East Atlanta, North..." />

            <label style={{ ...label, marginTop: 18 }}>Address or General Location</label>
            <input style={input} value={form.address} onChange={(e) => update("address", e.target.value)} placeholder="Exact address if safe, or general location" />
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
          <p style={goldEyebrow}>Contact / Source</p>
          <p style={{ color: "#cbd5e1", fontSize: 18, lineHeight: 1.5 }}>
            Capture who should be contacted from inside the Pain Room. Keep this private to the execution workflow.
          </p>

          <section className="vf-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginTop: 16 }}>
            <div>
              <label style={label}>Contact Name</label>
              <input style={input} value={form.contact_name || ""} onChange={(e) => update("contact_name", e.target.value)} placeholder="Owner, seller, agent, source, or operator" />
            </div>
            <div>
              <label style={label}>Contact Phone</label>
              <input style={input} type="tel" value={form.contact_phone || ""} onChange={(e) => update("contact_phone", e.target.value)} placeholder="Phone number" />
            </div>
            <div>
              <label style={label}>Contact Email</label>
              <input style={input} type="email" value={form.contact_email || ""} onChange={(e) => update("contact_email", e.target.value)} placeholder="Email address" />
            </div>
            <div>
              <label style={label}>Preferred Contact</label>
              <select style={input} value={form.preferred_contact || "Call first"} onChange={(e) => update("preferred_contact", e.target.value)}>
                <option>Call first</option>
                <option>Text first</option>
                <option>Email first</option>
                <option>Message through VaultForge</option>
                <option>Owner review before contact</option>
              </select>
            </div>
          </section>

          <label style={{ ...label, marginTop: 18 }}>Contact Notes</label>
          <textarea
            style={{ ...input, minHeight: 110 }}
            value={form.contact_notes || ""}
            onChange={(e) => update("contact_notes", e.target.value)}
            placeholder="Best time to call, access instructions, sensitivity, who controls the property, referral source, or special instructions."
          />
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
              {submitting ? "Saving Pain Room..." : "Create Einstein Pain Room"}
            </button>
            <Link href="/dashboard" style={ghost}>Dashboard</Link>
          </div>
        </section>
      </div>
    </main>
  );
}