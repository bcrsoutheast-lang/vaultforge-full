"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import VaultForgeMemberNav from "../components/VaultForgeMemberNav";

const OWNER_EMAIL = "bcrsoutheast@gmail.com";

type PainType = {
  key: string;
  label: string;
  description: string;
  route: string;
  defaultHelp: string;
  fields: string[];
};

const PAIN_TYPES: PainType[] = [
  {
    key: "distressed_seller",
    label: "Distressed Seller",
    description: "Seller pressure, pre-foreclosure, inherited property, urgent disposition, or owner needs a path out.",
    route: "buyer / operator / capital",
    defaultHelp: "Need buyer, operator, private capital, or structured exit.",
    fields: ["sellerSituation", "timeline", "propertyCondition", "askingPrice", "mortgageBalance"],
  },
  {
    key: "funding_gap",
    label: "Funding Gap",
    description: "Deal works but needs bridge capital, gap funding, transactional funding, private lender, or JV capital.",
    route: "lender / private capital / JV partner",
    defaultHelp: "Need lender, private capital, gap funding, or JV capital partner.",
    fields: ["capitalNeeded", "capitalUse", "timeline", "exitPlan", "collateral"],
  },
  {
    key: "buyer_needed",
    label: "Buyer Needed",
    description: "You have a deal, assignment, listing, off-market asset, or disposition need.",
    route: "buyer / acquisition partner",
    defaultHelp: "Need cash buyer, acquisition partner, or disposition route.",
    fields: ["askingPrice", "arv", "repairEstimate", "timeline", "accessNotes"],
  },
  {
    key: "operator_needed",
    label: "Operator Needed",
    description: "Need boots on ground, GC/operator, project manager, disposition help, or local execution.",
    route: "operator / contractor / local partner",
    defaultHelp: "Need operator, contractor, project manager, or execution partner.",
    fields: ["operatorNeed", "timeline", "budget", "siteStatus", "accessNotes"],
  },
  {
    key: "stalled_construction",
    label: "Stalled Construction",
    description: "Project is stuck because of funding, contractor, permit, scope, inspection, or execution problem.",
    route: "operator / capital / contractor / permit support",
    defaultHelp: "Need capital, operator, contractor, permit help, or project rescue.",
    fields: ["stage", "capitalNeeded", "remainingWork", "permitStatus", "timeline"],
  },
  {
    key: "off_market_opportunity",
    label: "Off-Market Opportunity",
    description: "Potential deal or private opportunity that needs routing before it becomes public.",
    route: "buyer / capital / operator",
    defaultHelp: "Need the right buyer, operator, or capital route.",
    fields: ["askingPrice", "arv", "repairEstimate", "timeline", "sellerSituation"],
  },
  {
    key: "wholesale_assignment",
    label: "Wholesale Assignment",
    description: "Assignment opportunity needing buyer route, diligence help, or fast disposition.",
    route: "buyer / disposition",
    defaultHelp: "Need buyer, dispo help, or transaction path.",
    fields: ["askingPrice", "arv", "repairEstimate", "contractDeadline", "accessNotes"],
  },
  {
    key: "permit_city_issue",
    label: "Permit / City Issue",
    description: "Inspection, zoning, permit, municipality, code, or city issue blocking progress.",
    route: "operator / permit specialist / local partner",
    defaultHelp: "Need city/permit guidance, local operator, or compliance path.",
    fields: ["permitStatus", "cityIssue", "timeline", "siteStatus", "neededDecision"],
  },
  {
    key: "tenant_occupancy",
    label: "Tenant / Occupancy Problem",
    description: "Tenant, squatter, access, occupancy, relocation, or operational issue affecting execution.",
    route: "operator / attorney / buyer",
    defaultHelp: "Need operator, legal path, buyer, or occupancy strategy.",
    fields: ["occupancyStatus", "timeline", "risk", "accessNotes", "neededDecision"],
  },
  {
    key: "emergency_exit",
    label: "Emergency Exit",
    description: "Urgent situation where owner/member needs speed, discretion, and a route immediately.",
    route: "buyer / capital / owner review",
    defaultHelp: "Need urgent buyer, funding, or owner-reviewed execution route.",
    fields: ["deadline", "capitalNeeded", "askingPrice", "risk", "neededDecision"],
  },
  {
    key: "land_opportunity",
    label: "Land Opportunity",
    description: "Land, entitlement, development, builder, rezoning, or site opportunity.",
    route: "developer / builder / land buyer / capital",
    defaultHelp: "Need developer, builder, land buyer, entitlement help, or capital.",
    fields: ["acreage", "zoning", "utilities", "askingPrice", "timeline"],
  },
  {
    key: "commercial_opportunity",
    label: "Commercial Opportunity",
    description: "Commercial, multifamily, mixed-use, retail, office, industrial, or income asset opportunity.",
    route: "commercial buyer / capital / operator",
    defaultHelp: "Need commercial buyer, capital partner, operator, or diligence support.",
    fields: ["assetClass", "noi", "askingPrice", "capitalNeeded", "timeline"],
  },
];

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(232,196,107,.18), transparent 28%), radial-gradient(circle at top right, rgba(181,92,255,.18), transparent 24%), radial-gradient(circle at bottom right, rgba(157,243,191,.13), transparent 28%), linear-gradient(180deg,#02040a 0%,#071326 48%,#030509 100%)",
  color: "white",
  padding: "28px 18px 100px",
  fontFamily: "Arial, sans-serif",
};

const wrap: React.CSSProperties = { maxWidth: 1220, margin: "0 auto" };

const hero: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.34)",
  background:
    "linear-gradient(145deg, rgba(232,196,107,.12), rgba(181,92,255,.10), rgba(255,255,255,.035))",
  borderRadius: 34,
  padding: 26,
  marginBottom: 22,
  boxShadow: "0 30px 90px rgba(0,0,0,.34)",
};

const card: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.13)",
  background:
    "linear-gradient(145deg, rgba(181,92,255,.10), rgba(232,196,107,.055), rgba(255,255,255,.03))",
  borderRadius: 28,
  padding: 22,
  marginBottom: 18,
  boxShadow: "0 26px 80px rgba(0,0,0,.30)",
};

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
  gap: 16,
};

const btn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "linear-gradient(135deg,#f5d978,#9df3bf 55%,#b55cff)",
  color: "#06100a",
  border: "none",
  borderRadius: 999,
  padding: "13px 18px",
  fontWeight: 950,
  textDecoration: "none",
  cursor: "pointer",
  margin: "6px 6px 0 0",
  minHeight: 46,
};

const ghost: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  color: "white",
  border: "1px solid rgba(255,255,255,.18)",
  background: "rgba(255,255,255,.055)",
  borderRadius: 999,
  padding: "13px 18px",
  fontWeight: 900,
  textDecoration: "none",
  cursor: "pointer",
  margin: "6px 6px 0 0",
  minHeight: 46,
};

const danger: React.CSSProperties = {
  ...ghost,
  border: "1px solid rgba(255,120,120,.38)",
  color: "#ffd0d0",
};

const chip: React.CSSProperties = {
  display: "inline-flex",
  border: "1px solid rgba(157,243,191,.25)",
  color: "#9df3bf",
  background: "rgba(157,243,191,.07)",
  borderRadius: 999,
  padding: "8px 11px",
  fontWeight: 850,
  fontSize: 13,
  margin: "0 7px 7px 0",
};

const input: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  borderRadius: 18,
  border: "1px solid rgba(255,255,255,.18)",
  background: "rgba(255,255,255,.075)",
  color: "white",
  padding: 15,
  fontSize: 16,
};

const label: React.CSSProperties = {
  display: "block",
  fontWeight: 950,
  margin: "0 0 8px",
};

const eyebrow: React.CSSProperties = {
  color: "#9df3bf",
  letterSpacing: 5,
  fontWeight: 950,
  fontSize: 12,
  marginBottom: 12,
  textTransform: "uppercase",
};

const muted: React.CSSProperties = {
  color: "rgba(255,255,255,.72)",
  lineHeight: 1.55,
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
  return cleanEmail(
    localStorage.getItem("vf_email") ||
      sessionStorage.getItem("vf_email") ||
      readCookie("vf_email") ||
      readCookie("vf_admin_email") ||
      ""
  );
}

function isOwner(email: string) {
  return email === OWNER_EMAIL || readCookie("vf_admin") === "1" || readCookie("isAdmin") === "true";
}

function money(value: string) {
  const cleanValue = clean(value).replace(/[^\d.]/g, "");
  if (!cleanValue) return "";
  const num = Number(cleanValue);
  if (!Number.isFinite(num)) return value;
  return num.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

function scoreUrgency(urgency: string, deadline: string, capitalNeeded: string) {
  let score = 30;
  if (urgency === "emergency") score += 45;
  if (urgency === "high") score += 30;
  if (urgency === "medium") score += 15;
  if (deadline) score += 10;
  if (clean(capitalNeeded)) score += 10;
  return Math.min(100, score);
}

export default function PainPage() {
  const [email, setEmail] = useState("");
  const [owner, setOwner] = useState(false);
  const [selectedKey, setSelectedKey] = useState(PAIN_TYPES[0].key);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  const [form, setForm] = useState<Record<string, string>>({
    title: "",
    state: "",
    city: "",
    county: "",
    assetType: "Residential",
    address: "",
    confidentiality: "Members only",
    urgency: "high",
    timeline: "",
    capitalNeeded: "",
    askingPrice: "",
    arv: "",
    repairEstimate: "",
    sellerSituation: "",
    mortgageBalance: "",
    propertyCondition: "",
    capitalUse: "",
    exitPlan: "",
    collateral: "",
    operatorNeed: "",
    budget: "",
    siteStatus: "",
    stage: "",
    remainingWork: "",
    permitStatus: "",
    cityIssue: "",
    neededDecision: "",
    contractDeadline: "",
    accessNotes: "",
    occupancyStatus: "",
    risk: "",
    deadline: "",
    acreage: "",
    zoning: "",
    utilities: "",
    assetClass: "",
    noi: "",
    helpRequested: "",
    notes: "",
    photoUrls: "",
  });

  function update(key: string, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function init() {
    const currentEmail = getEmail();
    setEmail(currentEmail);
    setOwner(isOwner(currentEmail));
  }

  useState(() => {
    init();
  });

  const selected = useMemo(() => PAIN_TYPES.find((item) => item.key === selectedKey) || PAIN_TYPES[0], [selectedKey]);

  const urgencyScore = useMemo(() => {
    return scoreUrgency(form.urgency, form.deadline || form.timeline || form.contractDeadline, form.capitalNeeded);
  }, [form.urgency, form.deadline, form.timeline, form.contractDeadline, form.capitalNeeded]);

  const routeSummary = useMemo(() => {
    const market = [form.city, form.state].filter(Boolean).join(", ") || "Unassigned market";
    const capital = form.capitalNeeded ? ` Capital needed: ${money(form.capitalNeeded)}.` : "";
    const price = form.askingPrice ? ` Asking: ${money(form.askingPrice)}.` : "";
    const arv = form.arv ? ` ARV: ${money(form.arv)}.` : "";
    const help = form.helpRequested || selected.defaultHelp;

    return `${selected.label} signal. Market: ${market}. Asset: ${form.assetType || "Unknown"}. Urgency: ${form.urgency}. Help requested: ${help}.${price}${arv}${capital} Best route: ${selected.route}.`;
  }, [form, selected]);

  const canSubmit = useMemo(() => {
    return email.includes("@") && clean(form.title).length > 1 && clean(form.state).length > 0 && clean(form.helpRequested || selected.defaultHelp).length > 0;
  }, [email, form.title, form.state, form.helpRequested, selected.defaultHelp]);

  async function submitPain() {
    if (busy) return;
    setBusy(true);
    setStatus("");

    try {
      const currentEmail = email || getEmail();
      if (!currentEmail.includes("@")) throw new Error("Login email missing. Please log in again.");
      if (!clean(form.title)) throw new Error("Add a short pain/opportunity title.");
      if (!clean(form.state)) throw new Error("Select or enter a state/market.");

      const photoUrls = form.photoUrls
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean);

      const payload = {
        email: currentEmail,
        member_email: currentEmail,
        owner_email: OWNER_EMAIL,
        pain_type: selected.key,
        pain_label: selected.label,
        title: form.title,
        state: form.state,
        city: form.city,
        county: form.county,
        asset_type: form.assetType,
        address: form.address,
        confidentiality: form.confidentiality,
        urgency: form.urgency,
        urgency_score: urgencyScore,
        timeline: form.timeline || form.deadline || form.contractDeadline,
        capital_needed: form.capitalNeeded,
        asking_price: form.askingPrice,
        arv: form.arv,
        repair_estimate: form.repairEstimate,
        help_requested: form.helpRequested || selected.defaultHelp,
        route_summary: routeSummary,
        best_route: selected.route,
        notes: form.notes,
        photo_urls: photoUrls,
        raw_fields: form,
        source: "adaptive_pain_button",
      };

      const res = await fetch("/api/pain/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-vf-email": currentEmail,
          "x-vf-admin": owner ? "1" : "0",
        },
        body: JSON.stringify(payload),
      });

      const data = await safeJson(res);

      if (!res.ok || data?.ok === false) {
        throw new Error(data?.error || data?.details || "Pain submit failed.");
      }

      setStatus(data?.message || "Pain signal submitted and routed into VaultForge intelligence.");
    } catch (error: any) {
      setStatus(error?.message || "Could not submit pain signal.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={page}>
      <style>{`
        a:hover, button:hover { transform: translateY(-1px); transition: all .18s ease; filter: brightness(1.06); }
        textarea::placeholder, input::placeholder { color: rgba(255,255,255,.48); }
        select { appearance: none; }
        @media (max-width: 760px) { a, button { width: 100%; box-sizing: border-box; } }
      `}</style>

      <div style={wrap}>
        <VaultForgeMemberNav title="Pain Button" subtitle="Adaptive real estate intelligence intake" />

        <section style={hero}>
          <div style={eyebrow}>VaultForge Pain Intelligence</div>
          <h1 style={{ fontSize: "clamp(56px,12vw,108px)", lineHeight: 0.86, margin: "0 0 18px" }}>
            Turn pressure into routed opportunity.
          </h1>
          <p style={{ ...muted, fontSize: 22 }}>
            Submit a real estate problem, stalled deal, funding gap, buyer need, city issue, or execution problem. VaultForge turns it into a signal, activity event, and routing candidate.
          </p>

          <div>
            <span style={chip}>Signed in: {email || "unknown"}</span>
            <span style={chip}>Urgency Score: {urgencyScore}</span>
            <span style={chip}>Route: {selected.route}</span>
            <span style={chip}>{owner ? "Owner View" : "Member View"}</span>
          </div>

          <Link href="/dashboard" style={ghost}>Dashboard</Link>
          <Link href="/alerts" style={ghost}>Alerts</Link>
          <Link href="/activity" style={ghost}>Activity</Link>
          <Link href="/routing-inbox" style={ghost}>Routing Inbox</Link>
          <Link href="/members" style={ghost}>Members</Link>
          <Link href="/logout" style={danger}>Logout</Link>
        </section>

        {status && (
          <section
            style={{
              ...hero,
              color: status.toLowerCase().includes("failed") || status.toLowerCase().includes("missing") || status.toLowerCase().includes("could")
                ? "#ffd0d0"
                : "#9df3bf",
            }}
          >
            <strong>{status}</strong>
          </section>
        )}

        <section style={hero}>
          <div style={eyebrow}>Select Pain Type</div>
          <div style={grid}>
            {PAIN_TYPES.map((type) => (
              <button
                key={type.key}
                type="button"
                onClick={() => {
                  setSelectedKey(type.key);
                  update("helpRequested", type.defaultHelp);
                }}
                style={{
                  ...card,
                  textAlign: "left",
                  cursor: "pointer",
                  borderColor: selected.key === type.key ? "rgba(245,217,120,.78)" : "rgba(255,255,255,.13)",
                }}
              >
                <div style={eyebrow}>{type.route}</div>
                <h3 style={{ fontSize: 26, lineHeight: 1.05, margin: "0 0 10px" }}>{type.label}</h3>
                <p style={muted}>{type.description}</p>
              </button>
            ))}
          </div>
        </section>

        <section style={grid}>
          <section style={card}>
            <div style={eyebrow}>Core Signal</div>
            <label style={label}>Title / What is happening?</label>
            <input value={form.title} onChange={(e) => update("title", e.target.value)} style={input} placeholder="Example: Stalled flip needs gap funding" />

            <div style={{ marginTop: 16 }}>
              <label style={label}>Help Requested</label>
              <textarea value={form.helpRequested || selected.defaultHelp} onChange={(e) => update("helpRequested", e.target.value)} style={{ ...input, minHeight: 120 }} />
            </div>

            <div style={{ marginTop: 16 }}>
              <label style={label}>Notes / Situation</label>
              <textarea value={form.notes} onChange={(e) => update("notes", e.target.value)} style={{ ...input, minHeight: 160 }} placeholder="Explain the pressure, opportunity, obstacle, and what needs to happen next." />
            </div>
          </section>

          <section style={card}>
            <div style={eyebrow}>Market / Asset</div>
            <label style={label}>State</label>
            <input value={form.state} onChange={(e) => update("state", e.target.value)} style={input} placeholder="GA, FL, TN, AL, TX, NC, SC..." />

            <div style={{ marginTop: 16 }}>
              <label style={label}>City</label>
              <input value={form.city} onChange={(e) => update("city", e.target.value)} style={input} placeholder="City / market" />
            </div>

            <div style={{ marginTop: 16 }}>
              <label style={label}>County</label>
              <input value={form.county} onChange={(e) => update("county", e.target.value)} style={input} placeholder="County" />
            </div>

            <div style={{ marginTop: 16 }}>
              <label style={label}>Asset Type</label>
              <select value={form.assetType} onChange={(e) => update("assetType", e.target.value)} style={input}>
                <option>Residential</option>
                <option>Commercial</option>
                <option>Land</option>
                <option>Multifamily</option>
                <option>Mixed-use</option>
                <option>Portfolio</option>
              </select>
            </div>

            <div style={{ marginTop: 16 }}>
              <label style={label}>Address / Area</label>
              <input value={form.address} onChange={(e) => update("address", e.target.value)} style={input} placeholder="Exact address or general area if confidential" />
            </div>
          </section>
        </section>

        <section style={grid}>
          <section style={card}>
            <div style={eyebrow}>Pressure / Timeline</div>
            <label style={label}>Urgency</label>
            <select value={form.urgency} onChange={(e) => update("urgency", e.target.value)} style={input}>
              <option value="emergency">Emergency</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="normal">Normal</option>
            </select>

            <div style={{ marginTop: 16 }}>
              <label style={label}>Timeline / Deadline</label>
              <input value={form.timeline} onChange={(e) => update("timeline", e.target.value)} style={input} placeholder="Example: 7 days, 30 days, closing Friday..." />
            </div>

            <div style={{ marginTop: 16 }}>
              <label style={label}>Confidentiality</label>
              <select value={form.confidentiality} onChange={(e) => update("confidentiality", e.target.value)} style={input}>
                <option>Members only</option>
                <option>Owner review first</option>
                <option>Private / sensitive</option>
                <option>Can route to matched members</option>
              </select>
            </div>
          </section>

          <section style={card}>
            <div style={eyebrow}>Numbers</div>
            <label style={label}>Capital Needed</label>
            <input value={form.capitalNeeded} onChange={(e) => update("capitalNeeded", e.target.value)} style={input} placeholder="$125,000" />

            <div style={{ marginTop: 16 }}>
              <label style={label}>Asking Price</label>
              <input value={form.askingPrice} onChange={(e) => update("askingPrice", e.target.value)} style={input} placeholder="$210,000" />
            </div>

            <div style={{ marginTop: 16 }}>
              <label style={label}>ARV / Value</label>
              <input value={form.arv} onChange={(e) => update("arv", e.target.value)} style={input} placeholder="$300,000" />
            </div>

            <div style={{ marginTop: 16 }}>
              <label style={label}>Repairs / Remaining Work</label>
              <input value={form.repairEstimate || form.remainingWork} onChange={(e) => { update("repairEstimate", e.target.value); update("remainingWork", e.target.value); }} style={input} placeholder="$45,000 or scope summary" />
            </div>
          </section>
        </section>

        <section style={card}>
          <div style={eyebrow}>Adaptive Detail Fields · {selected.label}</div>
          <div style={grid}>
            {selected.fields.map((field) => (
              <div key={field}>
                <label style={label}>{field.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase())}</label>
                <input value={form[field] || ""} onChange={(e) => update(field, e.target.value)} style={input} />
              </div>
            ))}
          </div>
        </section>

        <section style={card}>
          <div style={eyebrow}>Photos / Documents</div>
          <p style={muted}>
            Paste photo/document URLs one per line for now. Direct upload can be added next after the Pain save flow is stable.
          </p>
          <textarea value={form.photoUrls} onChange={(e) => update("photoUrls", e.target.value)} style={{ ...input, minHeight: 150 }} placeholder="https://..." />
        </section>

        <section style={hero}>
          <div style={eyebrow}>Route Preview</div>
          <h2 style={{ fontSize: "clamp(34px,7vw,62px)", lineHeight: 0.95, margin: "0 0 14px" }}>
            {selected.label}
          </h2>
          <p style={{ ...muted, fontSize: 20 }}>{routeSummary}</p>
          <div>
            <span style={chip}>Best Route: {selected.route}</span>
            <span style={chip}>Urgency Score: {urgencyScore}</span>
            <span style={chip}>Feeds: Activity / Alerts / Routing</span>
          </div>

          <button type="button" onClick={submitPain} disabled={!canSubmit || busy} style={{ ...btn, width: "100%", marginTop: 18, opacity: !canSubmit || busy ? 0.58 : 1 }}>
            {busy ? "Submitting Pain Signal..." : "Submit Pain Signal"}
          </button>
        </section>

        <section style={{ ...hero, borderColor: "rgba(157,243,191,.22)" }}>
          <div style={eyebrow}>Current Safety Mode</div>
          <p style={muted}>
            Pain submissions create controlled platform records. Private contact details remain gated. No autonomous notifications or contact release occur from this page.
          </p>
        </section>
      </div>
    </main>
  );
}
