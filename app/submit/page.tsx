"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import VaultForgeMemberNav from "../components/VaultForgeMemberNav";

type Access = {
  email: string;
  owner: boolean;
  profile_complete: boolean;
  payment_status: string;
  access_status: string;
  paid: boolean;
  unlocked: boolean;
  next_step: string;
};

type DealType = "Residential" | "Commercial" | "Land";

const STATES = [
  "Georgia",
  "Tennessee",
  "Florida",
  "North Carolina",
  "South Carolina",
  "Texas",
  "Alabama",
  "California",
  "New York",
  "Ohio",
  "Pennsylvania",
  "Other",
];

const RESIDENTIAL_STRATEGIES = [
  "Fix & Flip",
  "Buy & Hold",
  "BRRRR",
  "Wholesale",
  "Short-Term Rental",
  "Subto / Seller Finance",
];

const COMMERCIAL_STRATEGIES = [
  "Value Add",
  "Ground Up",
  "Mixed Use",
  "Office Conversion",
  "Retail Redevelopment",
  "Industrial",
];

const LAND_STRATEGIES = [
  "Subdivision",
  "Entitlement",
  "Builder Lot",
  "Mobile Home Park",
  "RV Park",
  "Raw Land Hold",
];

const ROUTING_NEEDS = [
  "Buyer Needed",
  "Lender Needed",
  "Private Capital Needed",
  "Contractor Needed",
  "Operator Needed",
  "JV Partner Needed",
  "Wholesaler Needed",
  "Realtor Needed",
  "Title / Attorney Needed",
  "Property Manager Needed",
  "Insurance Help Needed",
  "Permit Help Needed",
];

const DISTRESS_SIGNALS = [
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

const URGENCY_LEVELS = [
  "Normal",
  "Needs Review This Week",
  "Urgent",
  "Emergency / Pain Button",
];

const EXIT_OPTIONS = [
  "Flip",
  "Wholesale",
  "Rental",
  "BRRRR",
  "Seller Finance",
  "Subto",
  "Develop",
  "Entitle",
  "Hold",
  "Partner / JV",
];

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(181,92,255,.20), transparent 26%), radial-gradient(circle at top right, rgba(157,243,191,.16), transparent 24%), radial-gradient(circle at bottom right, rgba(232,196,107,.16), transparent 26%), linear-gradient(180deg,#02040a 0%,#07180f 40%,#031008 100%)",
  color: "white",
  padding: "28px 18px 90px",
  fontFamily: "Arial, sans-serif",
};

const wrap: React.CSSProperties = {
  maxWidth: 1180,
  margin: "0 auto",
};

const card: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.22)",
  background:
    "linear-gradient(145deg, rgba(181,92,255,.12), rgba(157,243,191,.08), rgba(255,255,255,.03))",
  borderRadius: 32,
  padding: 24,
  marginBottom: 22,
  boxShadow: "0 30px 90px rgba(0,0,0,.42)",
};

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))",
  gap: 16,
};

const btn: React.CSSProperties = {
  background: "linear-gradient(135deg,#f5d978,#9df3bf 55%,#b55cff)",
  color: "#06100a",
  border: "none",
  borderRadius: 999,
  padding: "14px 18px",
  fontWeight: 900,
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  margin: "6px 6px 0 0",
  cursor: "pointer",
};

const ghost: React.CSSProperties = {
  background: "linear-gradient(135deg, rgba(181,92,255,.20), rgba(255,255,255,.05))",
  color: "white",
  border: "1px solid rgba(255,255,255,.18)",
  borderRadius: 999,
  padding: "14px 18px",
  fontWeight: 900,
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  margin: "6px 6px 0 0",
  cursor: "pointer",
};

const input: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  borderRadius: 18,
  border: "1px solid rgba(255,255,255,.18)",
  background: "linear-gradient(135deg, rgba(181,92,255,.16), rgba(255,255,255,.07))",
  color: "white",
  padding: 15,
  fontSize: 16,
};

const label: React.CSSProperties = {
  display: "block",
  fontWeight: 900,
  margin: "0 0 8px",
};

const eyebrow: React.CSSProperties = {
  color: "#f5d978",
  letterSpacing: 5,
  fontWeight: 900,
  fontSize: 12,
  marginBottom: 12,
};

const greenEyebrow: React.CSSProperties = {
  ...eyebrow,
  color: "#9df3bf",
};

const chipBase: React.CSSProperties = {
  borderRadius: 999,
  padding: "11px 14px",
  fontWeight: 900,
  cursor: "pointer",
  margin: "6px 6px 0 0",
  border: "1px solid rgba(255,255,255,.18)",
};

const empty = {
  title: "",
  property_type: "Residential" as DealType,
  strategy: "Fix & Flip",
  city: "",
  state: "Georgia",
  address: "",
  asking_price: "",
  arv: "",
  repair_estimate: "",
  beds: "",
  baths: "",
  square_feet: "",
  year_built: "",
  zoning: "",
  acres: "",
  occupancy: "",
  noi: "",
  cap_rate: "",
  description: "",
  seller_situation: "",
  access_notes: "",
  deal_needs: "",
  routing_needs: "",
  distress_signals: "",
  urgency_level: "Normal",
  exit_strategy: "Flip",
  target_buyer: "",
  capital_needed: "",
  ideal_lender: "",
  contractor_scope: "",
  operator_scope: "",
  jv_structure: "",
  title_issue: "",
  ai_route_summary: "",
};

function getEmail() {
  if (typeof window === "undefined") return "";

  return (
    localStorage.getItem("vf_email") ||
    sessionStorage.getItem("vf_email") ||
    ""
  ).trim().toLowerCase();
}

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

function extractUploadUrl(data: any) {
  return String(
    data?.url ||
      data?.publicUrl ||
      data?.public_url ||
      data?.photo_url ||
      data?.image_url ||
      data?.main_photo_url ||
      data?.file_url ||
      data?.path_url ||
      ""
  ).trim();
}

async function upload(file: File, email: string) {
  const endpoints = [
    "/api/deal/upload-photo",
    "/api/uploads/deal",
    "/api/uploads/project",
    "/api/uploads/pain",
  ];

  const errors: string[] = [];

  for (const endpoint of endpoints) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("photo", file);
    formData.append("image", file);
    formData.append("email", email);
    formData.append("owner_email", email);
    formData.append("member_email", email);
    formData.append("source", "deal");
    formData.append("folder", "deals");

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "x-vf-email": email,
        },
        body: formData,
      });

      const data = await safeJson(res);
      const url = extractUploadUrl(data);

      if (res.ok && data?.ok !== false && url) {
        return url;
      }

      errors.push(`${endpoint}: ${data?.error || data?.details || res.statusText || "upload failed"}`);
    } catch (error: any) {
      errors.push(`${endpoint}: ${error?.message || String(error)}`);
    }
  }

  throw new Error(`Photo upload failed. Tried ${endpoints.length} upload routes. ${errors.slice(0, 3).join(" | ")}`);
}

function strategyOptions(type: DealType) {
  if (type === "Commercial") return COMMERCIAL_STRATEGIES;
  if (type === "Land") return LAND_STRATEGIES;
  return RESIDENTIAL_STRATEGIES;
}

function splitList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function toggleCsv(value: string, item: string) {
  const list = splitList(value);
  const exists = list.includes(item);
  const next = exists ? list.filter((x) => x !== item) : [...list, item];
  return next.join(", ");
}

function hasCsv(value: string, item: string) {
  return splitList(value).includes(item);
}

function LockedScreen({ reason }: { reason: "login" | "profile" | "payment" | "loading" }) {
  return (
    <main style={page}>
      <div style={wrap}>
        <VaultForgeMemberNav
          title="Create Deal Room"
          subtitle="Submit routed opportunities into the VaultForge intelligence network"
        />

        <section style={card}>
          <div style={greenEyebrow}>VAULTFORGE CREATE</div>

          <h1
            style={{
              fontSize: "clamp(52px,12vw,94px)",
              lineHeight: 0.9,
              margin: "0 0 14px",
            }}
          >
            {reason === "loading"
              ? "Checking access..."
              : reason === "login"
              ? "Create member access first."
              : reason === "profile"
              ? "Complete your profile first."
              : "Activate access first."}
          </h1>

          <p
            style={{
              color: "rgba(255,255,255,.72)",
              fontSize: 20,
              lineHeight: 1.5,
            }}
          >
            VaultForge gates live deal creation behind member access, profile completion, and activation.
          </p>

          {reason === "login" && <Link href="/login" style={btn}>Login / Create Access</Link>}
          {reason === "profile" && <Link href="/profile" style={btn}>Complete Profile</Link>}
          {reason === "payment" && <Link href="/payment" style={btn}>Activate Access</Link>}

          <Link href="/dashboard" style={ghost}>Dashboard</Link>
        </section>
      </div>
    </main>
  );
}

export default function SubmitPage() {
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [lockReason, setLockReason] = useState<"loading" | "login" | "profile" | "payment" | "open">("loading");
  const [form, setForm] = useState<Record<string, string>>(empty as any);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [successLinks, setSuccessLinks] = useState<Record<string, string>>({});

  useEffect(() => {
    async function checkAccess() {
      try {
        const email = getEmail();

        if (!email) {
          setLockReason("login");
          return;
        }

        const res = await fetch(`/api/member/access?email=${encodeURIComponent(email)}`, {
          cache: "no-store",
          headers: {
            "x-vf-email": email,
          },
        });

        const data: Access = await res.json();

        if (!data?.owner && !data?.profile_complete) {
          setLockReason("profile");
          return;
        }

        if (!data?.owner && !data?.paid && !data?.unlocked) {
          setLockReason("payment");
          return;
        }

        setLockReason("open");
      } catch {
        setLockReason("login");
      }
    }

    checkAccess();
  }, []);

  function set(k: string, v: string) {
    setForm((x) => ({ ...x, [k]: v }));
  }

  function switchType(type: DealType) {
    setForm((x) => ({
      ...x,
      property_type: type,
      strategy: strategyOptions(type)[0],
      exit_strategy:
        type === "Land"
          ? "Entitle"
          : type === "Commercial"
          ? "Hold"
          : "Flip",
    }));
  }

  function pick(list: FileList | null) {
    const chosen = Array.from(list || [])
      .filter((f) => f.type.startsWith("image/"))
      .slice(0, 10);

    previews.forEach((src) => URL.revokeObjectURL(src));

    setFiles(chosen);
    setPreviews(chosen.map((f) => URL.createObjectURL(f)));
  }

  function buildRouteSummary(nextForm = form) {
    const parts = [
      `Type: ${nextForm.property_type}`,
      `Strategy: ${nextForm.strategy}`,
      `Exit: ${nextForm.exit_strategy}`,
      `Market: ${nextForm.city}, ${nextForm.state}`,
      nextForm.routing_needs ? `Needs: ${nextForm.routing_needs}` : "",
      nextForm.distress_signals ? `Signals: ${nextForm.distress_signals}` : "",
      nextForm.urgency_level ? `Urgency: ${nextForm.urgency_level}` : "",
      nextForm.capital_needed ? `Capital: ${nextForm.capital_needed}` : "",
      nextForm.contractor_scope ? `Contractor Scope: ${nextForm.contractor_scope}` : "",
      nextForm.operator_scope ? `Operator Scope: ${nextForm.operator_scope}` : "",
    ];

    return parts.filter(Boolean).join(" | ");
  }

  async function submit() {
    if (busy) return;

    setBusy(true);
    setMsg("");
    setSuccessLinks({});

    try {
      const email = getEmail();

      if (!email) {
        throw new Error("Login expired. Log in again before submitting.");
      }

      if (!form.title.trim() || !form.city.trim()) {
        throw new Error("Deal title and city are required.");
      }

      if (!files.length) {
        throw new Error("Upload at least one photo.");
      }

      const urls: string[] = [];

      for (let index = 0; index < files.length; index += 1) {
        setMsg(`Uploading photo ${index + 1} of ${files.length}...`);
        const url = await upload(files[index], email);
        urls.push(url);
      }

      setMsg("Saving deal room...");

      const aiRouteSummary = buildRouteSummary();

      const res = await fetch("/api/deal/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-vf-email": email,
        },
        body: JSON.stringify({
          ...form,
          ai_route_summary: aiRouteSummary,
          route_summary: aiRouteSummary,
          routing_needs: form.routing_needs,
          deal_needs: form.routing_needs || form.deal_needs,
          needs: form.routing_needs || form.deal_needs,
          distress_signals: form.distress_signals,
          seller_situation: [form.seller_situation, form.distress_signals].filter(Boolean).join(" | "),
          urgency_level: form.urgency_level,
          exit_strategy: form.exit_strategy,
          owner_email: email,
          member_email: email,
          photo_urls: urls,
          photos: urls,
          image_url: urls[0] || "",
          photo_url: urls[0] || "",
          main_photo_url: urls[0] || "",
        }),
      });

      const data = await safeJson(res);

      if (!res.ok || data?.ok === false || data?.error) {
        throw new Error(data?.error || data?.details || "Deal save failed.");
      }

      const savedId = String(data?.deal_id || data?.deal?.id || data?.id || data?.item_id || "").trim();

      setMsg("Saved. Deal created in VaultForge. Open Deal Detail or Projects to review the saved record.");

      setSuccessLinks({
        deal_detail: data?.direct_links?.deal_detail || (savedId ? `/deal/detail?id=${encodeURIComponent(savedId)}` : ""),
        projects: data?.direct_links?.projects || "/projects",
        dashboard: data?.direct_links?.dashboard || "/dashboard",
        routing_room: data?.direct_links?.routing_room || "",
        activity: data?.direct_links?.activity || "",
      });

      setForm(empty as any);
      setFiles([]);
      previews.forEach((src) => URL.revokeObjectURL(src));
      setPreviews([]);

      if (fileRef.current) {
        fileRef.current.value = "";
      }
    } catch (e: any) {
      setMsg(e?.message || "Could not save.");
    } finally {
      setBusy(false);
    }
  }

  const currentStrategies = useMemo(
    () => strategyOptions(form.property_type as DealType),
    [form.property_type]
  );

  if (lockReason !== "open") {
    return <LockedScreen reason={lockReason} />;
  }

  return (
    <main style={page}>
      <style>{`
        a:hover,
        button:hover {
          transform: translateY(-1px);
          transition: all .18s ease;
          filter: brightness(1.06);
        }

        @media (max-width: 760px) {
          .vf-submit-actions,
          .vf-chip-grid {
            display:grid !important;
            grid-template-columns:1fr !important;
            gap:10px !important;
          }

          .vf-submit-actions > *,
          .vf-chip-grid > * {
            width:100%;
            margin:0 !important;
            box-sizing:border-box;
          }
        }
      `}</style>

      <div style={wrap}>
        <VaultForgeMemberNav
          title="Create Deal Room"
          subtitle="Submit routed opportunities into the VaultForge intelligence network"
        />

        <section style={card}>
          <div style={greenEyebrow}>VAULTFORGE CREATE</div>

          <h1
            style={{
              fontSize: "clamp(58px,12vw,108px)",
              lineHeight: 0.88,
              margin: "0 0 14px",
            }}
          >
            Submit a routed deal room.
          </h1>

          <p
            style={{
              color: "rgba(255,255,255,.72)",
              fontSize: 22,
              lineHeight: 1.45,
            }}
          >
            Use guided routing chips so VaultForge knows whether to send this to buyers, lenders,
            contractors, operators, JV partners, title help, or distress/pain workflows.
          </p>

          <div className="vf-submit-actions">
            <Link href="/dashboard" style={ghost}>Dashboard</Link>
            <Link href="/projects" style={btn}>Projects</Link>
            <Link href="/buy-bucket" style={ghost}>Buy Bucket</Link>
            <Link href="/alerts" style={ghost}>Alerts</Link>
          </div>
        </section>

        {msg && (
          <section style={card}>
            <div style={greenEyebrow}>SAVE STATUS</div>
            <h2 style={{ margin: "0 0 12px", fontSize: 34, lineHeight: 1 }}>{msg}</h2>
            {Object.keys(successLinks).length ? (
              <div className="vf-submit-actions">
                {successLinks.deal_detail ? <Link href={successLinks.deal_detail} style={btn}>Open Deal Detail</Link> : null}
                <Link href={successLinks.projects || "/projects"} style={ghost}>Projects</Link>
                {successLinks.routing_room ? <Link href={successLinks.routing_room} style={ghost}>Routing Room</Link> : null}
                {successLinks.activity ? <Link href={successLinks.activity} style={ghost}>Activity</Link> : null}
                <Link href={successLinks.dashboard || "/dashboard"} style={ghost}>Dashboard</Link>
              </div>
            ) : null}
          </section>
        )}

        <section style={card}>
          <div style={greenEyebrow}>DEAL TYPE</div>

          <p style={{ color: "rgba(255,255,255,.72)", fontSize: 18, lineHeight: 1.5, marginBottom: 18 }}>
            Choose the opportunity type. The selected type changes the strategy menu and routing context.
          </p>

          {(["Residential", "Commercial", "Land"] as DealType[]).map((t) => (
            <button key={t} type="button" style={form.property_type === t ? btn : ghost} onClick={() => switchType(t)}>
              {t}
            </button>
          ))}
        </section>

        <section style={card}>
          <div style={eyebrow}>BASICS</div>

          <div style={grid}>
            <Field label="Deal Title" value={form.title} onChange={(v) => set("title", v)} />
            <Field label="City" value={form.city} onChange={(v) => set("city", v)} />

            <div>
              <label style={label}>State</label>
              <select style={input} value={form.state} onChange={(e) => set("state", e.target.value)}>
                {STATES.map((s) => (
                  <option key={s} value={s} style={{ color: "#111" }}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <Field label="Address" value={form.address} onChange={(v) => set("address", v)} />

            <div>
              <label style={label}>Strategy</label>
              <select style={input} value={form.strategy} onChange={(e) => set("strategy", e.target.value)}>
                {currentStrategies.map((s) => (
                  <option key={s} value={s} style={{ color: "#111" }}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={label}>Exit Strategy</label>
              <select style={input} value={form.exit_strategy} onChange={(e) => set("exit_strategy", e.target.value)}>
                {EXIT_OPTIONS.map((s) => (
                  <option key={s} value={s} style={{ color: "#111" }}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <Field label="Asking Price" value={form.asking_price} onChange={(v) => set("asking_price", v)} />
            <Field label="ARV / Value" value={form.arv} onChange={(v) => set("arv", v)} />
            <Field label="Repair Estimate" value={form.repair_estimate} onChange={(v) => set("repair_estimate", v)} />
          </div>
        </section>

        <section style={card}>
          <div style={greenEyebrow}>ROUTING NEEDS</div>
          <h2 style={{ fontSize: 34, lineHeight: 1, margin: "0 0 10px" }}>
            Who should VaultForge route this to?
          </h2>
          <p style={{ color: "rgba(255,255,255,.72)", fontSize: 18, lineHeight: 1.5 }}>
            Tap every role needed. These values feed the Smart Alerts engine and determine the right alert cards.
          </p>

          <div className="vf-chip-grid" style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {ROUTING_NEEDS.map((need) => (
              <button
                key={need}
                type="button"
                style={hasCsv(form.routing_needs, need) ? btn : { ...ghost, ...chipBase }}
                onClick={() => set("routing_needs", toggleCsv(form.routing_needs, need))}
              >
                {need}
              </button>
            ))}
          </div>

          <div style={{ marginTop: 18 }}>
            <strong>Selected:</strong>{" "}
            <span style={{ color: "#9df3bf" }}>{form.routing_needs || "None selected yet"}</span>
          </div>
        </section>

        <section style={card}>
          <div style={greenEyebrow}>PAIN / DISTRESS SIGNALS</div>
          <h2 style={{ fontSize: 34, lineHeight: 1, margin: "0 0 10px" }}>
            What problem is creating the opportunity?
          </h2>

          <div className="vf-chip-grid" style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {DISTRESS_SIGNALS.map((signal) => (
              <button
                key={signal}
                type="button"
                style={hasCsv(form.distress_signals, signal) ? btn : { ...ghost, ...chipBase }}
                onClick={() => set("distress_signals", toggleCsv(form.distress_signals, signal))}
              >
                {signal}
              </button>
            ))}
          </div>

          <div style={{ marginTop: 18 }}>
            <label style={label}>Urgency Level</label>
            <select style={input} value={form.urgency_level} onChange={(e) => set("urgency_level", e.target.value)}>
              {URGENCY_LEVELS.map((level) => (
                <option key={level} value={level} style={{ color: "#111" }}>
                  {level}
                </option>
              ))}
            </select>
          </div>
        </section>

        <section style={card}>
          <div style={eyebrow}>ROLE-SPECIFIC ROUTING FIELDS</div>

          <div style={grid}>
            <Field label="Target Buyer Type" value={form.target_buyer} onChange={(v) => set("target_buyer", v)} placeholder="Cash buyer, landlord, developer, builder, multifamily buyer..." />
            <Field label="Capital Needed" value={form.capital_needed} onChange={(v) => set("capital_needed", v)} placeholder="Bridge loan, hard money, private capital, JV equity..." />
            <Field label="Ideal Lender Fit" value={form.ideal_lender} onChange={(v) => set("ideal_lender", v)} placeholder="Fast close, construction draws, land loan, DSCR..." />
            <Field label="Contractor Scope" value={form.contractor_scope} onChange={(v) => set("contractor_scope", v)} placeholder="Roof, full rehab, foundation, site work, permits..." />
            <Field label="Operator Scope" value={form.operator_scope} onChange={(v) => set("operator_scope", v)} placeholder="Project manager, boots on ground, property manager..." />
            <Field label="JV Structure" value={form.jv_structure} onChange={(v) => set("jv_structure", v)} placeholder="Equity partner, profit split, capital + operator..." />
            <Field label="Title / Attorney Issue" value={form.title_issue} onChange={(v) => set("title_issue", v)} placeholder="Probate, liens, title cloud, closing help..." />
          </div>
        </section>

        {form.property_type === "Residential" && (
          <section style={card}>
            <div style={eyebrow}>RESIDENTIAL DETAILS</div>

            <div style={grid}>
              <Field label="Bedrooms" value={form.beds} onChange={(v) => set("beds", v)} />
              <Field label="Bathrooms" value={form.baths} onChange={(v) => set("baths", v)} />
              <Field label="Square Feet" value={form.square_feet} onChange={(v) => set("square_feet", v)} />
              <Field label="Year Built" value={form.year_built} onChange={(v) => set("year_built", v)} />
              <Field label="Occupancy" value={form.occupancy} onChange={(v) => set("occupancy", v)} placeholder="Vacant, tenant occupied, owner occupied..." />
            </div>
          </section>
        )}

        {form.property_type === "Commercial" && (
          <section style={card}>
            <div style={eyebrow}>COMMERCIAL DETAILS</div>

            <div style={grid}>
              <Field label="Square Feet" value={form.square_feet} onChange={(v) => set("square_feet", v)} />
              <Field label="NOI" value={form.noi} onChange={(v) => set("noi", v)} />
              <Field label="Cap Rate" value={form.cap_rate} onChange={(v) => set("cap_rate", v)} />
              <Field label="Occupancy" value={form.occupancy} onChange={(v) => set("occupancy", v)} />
              <Field label="Zoning" value={form.zoning} onChange={(v) => set("zoning", v)} />
            </div>
          </section>
        )}

        {form.property_type === "Land" && (
          <section style={card}>
            <div style={eyebrow}>LAND DETAILS</div>

            <div style={grid}>
              <Field label="Acres" value={form.acres} onChange={(v) => set("acres", v)} />
              <Field label="Zoning" value={form.zoning} onChange={(v) => set("zoning", v)} />
              <Field label="Utilities" value={form.access_notes} onChange={(v) => set("access_notes", v)} />
              <Field label="Road Access" value={form.occupancy} onChange={(v) => set("occupancy", v)} />
            </div>
          </section>
        )}

        <section style={card}>
          <div style={eyebrow}>PHOTOS</div>

          <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={(e) => pick(e.target.files)} />

          <button type="button" style={btn} onClick={() => fileRef.current?.click()}>
            Choose Photos ({files.length}/10)
          </button>

          <p style={{ color: "rgba(255,255,255,.66)", lineHeight: 1.5 }}>
            Upload actual property photos. VaultForge saves them through the server so mobile browsers do not block upload.
          </p>

          <div style={{ ...grid, marginTop: 16 }}>
            {previews.map((src) => (
              <img
                key={src}
                src={src}
                alt="Selected property preview"
                style={{
                  width: "100%",
                  height: 220,
                  objectFit: "cover",
                  borderRadius: 20,
                  border: "1px solid rgba(255,255,255,.15)",
                }}
              />
            ))}
          </div>
        </section>

        <section style={card}>
          <div style={eyebrow}>DEAL INTELLIGENCE</div>

          <div style={grid}>
            <Field label="Seller Situation" value={form.seller_situation} onChange={(v) => set("seller_situation", v)} placeholder="Why is this available? Motivation, pressure, timeline..." />
            <Field label="Manual Deal Notes" value={form.deal_needs} onChange={(v) => set("deal_needs", v)} placeholder="Optional extra needs not covered above..." />
          </div>

          <div style={{ marginTop: 18 }}>
            <label style={label}>Access / Private Notes</label>

            <textarea style={{ ...input, minHeight: 120 }} value={form.access_notes} onChange={(e) => set("access_notes", e.target.value)} />
          </div>
        </section>

        <section style={card}>
          <div style={greenEyebrow}>AI ROUTE SUMMARY</div>
          <p style={{ color: "rgba(255,255,255,.72)", lineHeight: 1.5 }}>
            This is the machine-readable routing summary that goes into the deal record.
          </p>
          <div
            style={{
              border: "1px solid rgba(157,243,191,.25)",
              background: "rgba(157,243,191,.07)",
              borderRadius: 22,
              padding: 16,
              color: "#9df3bf",
              fontWeight: 850,
              lineHeight: 1.5,
            }}
          >
            {buildRouteSummary() || "Start selecting routing fields above."}
          </div>
        </section>

        <section style={card}>
          <div style={eyebrow}>DESCRIPTION</div>

          <textarea style={{ ...input, minHeight: 180 }} value={form.description} onChange={(e) => set("description", e.target.value)} />
        </section>

        <button
          type="button"
          onClick={submit}
          disabled={busy}
          style={{
            ...btn,
            width: "100%",
            fontSize: 24,
            padding: 20,
            opacity: busy ? 0.65 : 1,
          }}
        >
          {busy ? "Saving..." : "Submit Deal"}
        </button>
      </div>
    </main>
  );
}

function Field({
  label: l,
  value,
  onChange,
  placeholder = "",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label style={label}>{l}</label>

      <input style={input} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
