"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type DealType = "Residential" | "Commercial" | "Land";

type FormState = {
  property_type: DealType;
  title: string;
  city: string;
  county: string;
  state: string;
  address: string;
  strategy: string;
  exit_strategy: string;
  asking_price: string;
  arv: string;
  repair_estimate: string;
  beds: string;
  baths: string;
  sqft: string;
  square_feet: string;
  year_built: string;
  occupancy: string;
  zoning: string;
  utilities: string;
  road_access: string;
  noi: string;
  cap_rate: string;
  lot_size: string;
  building_sqft: string;
  land_acres: string;
  units: string;
  bedrooms: string;
  bathrooms: string;
  condition: string;
  timeline: string;
  seller_situation: string;
  access_notes: string;
  private_notes: string;
  deal_needs: string;
  routing_needs: string;
  distress_signals: string;
  urgency_level: string;
  capital_needed: string;
  target_buyer: string;
  ideal_lender: string;
  contractor_scope: string;
  operator_scope: string;
  jv_structure: string;
  title_issue: string;
  description: string;
};

const initialForm: FormState = {
  property_type: "Residential",
  title: "",
  city: "",
  county: "",
  state: "Georgia",
  address: "",
  strategy: "Fix & Flip",
  exit_strategy: "Flip",
  asking_price: "",
  arv: "",
  repair_estimate: "",
  beds: "",
  baths: "",
  sqft: "",
  square_feet: "",
  year_built: "",
  occupancy: "",
  zoning: "",
  utilities: "",
  road_access: "",
  noi: "",
  cap_rate: "",
  lot_size: "",
  building_sqft: "",
  land_acres: "",
  units: "",
  bedrooms: "",
  bathrooms: "",
  condition: "",
  timeline: "",
  seller_situation: "",
  access_notes: "",
  private_notes: "",
  deal_needs: "",
  routing_needs: "",
  distress_signals: "",
  urgency_level: "Normal",
  capital_needed: "",
  target_buyer: "",
  ideal_lender: "",
  contractor_scope: "",
  operator_scope: "",
  jv_structure: "",
  title_issue: "",
  description: "",
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

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at 12% 0%, rgba(232,196,107,.18), transparent 26%), radial-gradient(circle at 88% 12%, rgba(56,189,248,.12), transparent 28%), linear-gradient(180deg,#020409,#06151d 52%,#020409)",
  color: "white",
  padding: "26px 16px 96px",
  fontFamily: "Arial, sans-serif",
};

const wrap: React.CSSProperties = {
  width: "min(1120px,100%)",
  margin: "0 auto",
};

const card: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.24)",
  borderRadius: 28,
  padding: 24,
  background: "rgba(255,255,255,.045)",
  boxShadow: "0 26px 90px rgba(0,0,0,.32)",
  marginBottom: 18,
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
  minHeight: 50,
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,.16)",
  background: "rgba(255,255,255,.07)",
  color: "white",
  padding: "12px 14px",
  outline: "none",
  fontSize: 16,
  boxSizing: "border-box",
};

const textarea: React.CSSProperties = {
  ...input,
  minHeight: 112,
  resize: "vertical",
};

const button: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 52,
  borderRadius: 999,
  border: 0,
  padding: "13px 18px",
  background: "linear-gradient(135deg,#f8e7b0,#e8c46b)",
  color: "#06100a",
  fontWeight: 950,
  cursor: "pointer",
  textDecoration: "none",
};

const ghost: React.CSSProperties = {
  ...button,
  background: "rgba(255,255,255,.06)",
  color: "white",
  border: "1px solid rgba(255,255,255,.16)",
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

const pill: React.CSSProperties = {
  border: "1px solid rgba(157,243,191,.25)",
  background: "rgba(157,243,191,.075)",
  color: "#9df3bf",
  borderRadius: 999,
  padding: "8px 11px",
  fontWeight: 850,
  fontSize: 12,
  display: "inline-flex",
};

function clean(value: unknown) {
  return String(value || "").trim();
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

function currentEmail() {
  if (typeof window === "undefined") return "";

  const keys = ["vf_email", "vf_member_email", "vf_admin_email", "email", "memberEmail"];

  for (const key of keys) {
    const local = clean(window.localStorage.getItem(key)).toLowerCase();
    if (local.includes("@")) return local;

    const session = clean(window.sessionStorage.getItem(key)).toLowerCase();
    if (session.includes("@")) return session;
  }

  return clean(readCookie("vf_email") || readCookie("vf_member_email") || readCookie("vf_admin_email")).toLowerCase();
}

function moneyText(value: string) {
  const text = clean(value);
  if (!text) return "Not listed";

  const number = Number(text.replace(/[^\d.-]/g, ""));
  if (!Number.isFinite(number)) return text;

  return number.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function shortJson(value: unknown) {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value || "");
  }
}

function backendErrorText(data: Record<string, any>, fallback: string) {
  const parts = [
    data?.error ? `Error: ${data.error}` : "",
    data?.supabase_error ? `Supabase: ${data.supabase_error}` : "",
    data?.code ? `Code: ${data.code}` : "",
    data?.details ? `Details: ${data.details}` : "",
    data?.hint ? `Hint: ${data.hint}` : "",
  ].filter(Boolean);

  return parts.length ? parts.join(" | ") : fallback;
}

function debugPayload(data: Record<string, any> | null) {
  if (!data) return null;

  return {
    ok: data.ok,
    error: data.error,
    supabase_error: data.supabase_error,
    code: data.code,
    details: data.details,
    hint: data.hint,
    payload_preview: data.payload_preview,
    field_check: data.field_check,
    attempts: Array.isArray(data.attempts)
      ? data.attempts.map((attempt: any) => ({
          table: attempt.table,
          ok: attempt.ok,
          code: attempt.code,
          error: attempt.error,
          details: attempt.details,
          hint: attempt.hint,
          removed_columns: attempt.removed_columns,
          kept_columns: attempt.kept_columns,
        }))
      : undefined,
  };
}

function Field({
  labelText,
  name,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  labelText: string;
  name: keyof FormState;
  value: string;
  onChange: (name: keyof FormState, value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label style={{ display: "grid", gap: 8 }}>
      <span style={{ fontWeight: 850 }}>{labelText}</span>
      <input
        name={name}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(name, event.target.value)}
        style={input}
      />
    </label>
  );
}

function SelectField({
  labelText,
  name,
  value,
  onChange,
  options,
}: {
  labelText: string;
  name: keyof FormState;
  value: string;
  onChange: (name: keyof FormState, value: string) => void;
  options: string[];
}) {
  return (
    <label style={{ display: "grid", gap: 8 }}>
      <span style={{ fontWeight: 850 }}>{labelText}</span>
      <select
        name={name}
        value={value}
        onChange={(event) => onChange(name, event.target.value)}
        style={input}
      >
        {options.map((item) => (
          <option key={item} value={item} style={{ color: "#06100a" }}>
            {item}
          </option>
        ))}
      </select>
    </label>
  );
}

function TextAreaField({
  labelText,
  name,
  value,
  onChange,
  placeholder,
}: {
  labelText: string;
  name: keyof FormState;
  value: string;
  onChange: (name: keyof FormState, value: string) => void;
  placeholder?: string;
}) {
  return (
    <label style={{ display: "grid", gap: 8 }}>
      <span style={{ fontWeight: 850 }}>{labelText}</span>
      <textarea
        name={name}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(name, event.target.value)}
        style={textarea}
      />
    </label>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="vf-form-grid"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(2,minmax(0,1fr))",
        gap: 16,
      }}
    >
      {children}
    </div>
  );
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
            VaultForge Create Room Exit
          </div>
          <div style={{ color: "rgba(255,255,255,.70)", fontSize: 13, marginTop: 4 }}>
            Create Deal room is open. Save the deal or exit back to the command center.
          </div>
        </div>

        <div className="vf-command-actions" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="button" onClick={goBack} style={closeButton}>Back</button>
          <Link href="/dashboard" style={smallButton}>Dashboard</Link>
          <Link href="/projects" style={smallGhost}>Workstations</Link>
          <Link href="/pain" style={smallGhost}>Submit Pain</Link>
          <Link href="/messages" style={smallGhost}>Messages</Link>
          <Link href="/smart-ai" style={smallGhost}>Smart AI</Link>
        </div>
      </div>
    </section>
  );
}

export default function SubmitDealPage() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [lastResponse, setLastResponse] = useState<Record<string, any> | null>(null);

  function update(name: keyof FormState, value: string) {
    setForm((prev) => {
      const next = { ...prev, [name]: value };

      if (name === "property_type") {
        const nextType = value as DealType;

        next.property_type = nextType;

        if (nextType === "Residential") {
          next.strategy = next.strategy || "Fix & Flip";
          next.exit_strategy = next.exit_strategy || "Flip";
        }

        if (nextType === "Commercial") {
          next.strategy = next.strategy || "Hold";
          next.exit_strategy = next.exit_strategy || "Lease / Reposition";
        }

        if (nextType === "Land") {
          next.strategy = next.strategy || "Entitlement";
          next.exit_strategy = next.exit_strategy || "Assign / Develop";
        }
      }

      if (name === "beds") next.bedrooms = value;
      if (name === "bedrooms") next.beds = value;
      if (name === "baths") next.bathrooms = value;
      if (name === "bathrooms") next.baths = value;
      if (name === "sqft") {
        next.square_feet = value;
        next.building_sqft = value;
      }
      if (name === "building_sqft") {
        next.sqft = value;
        next.square_feet = value;
      }
      if (name === "square_feet") {
        next.sqft = value;
        next.building_sqft = value;
      }
      if (name === "deal_needs") next.routing_needs = value;
      if (name === "routing_needs") next.deal_needs = value;

      return next;
    });
  }

  const photoPreviews = useMemo(() => {
    return files.map((file) => ({
      name: file.name,
      url: URL.createObjectURL(file),
    }));
  }, [files]);

  function buildRouteSummary(nextForm = form) {
    const market = [nextForm.city, nextForm.county, nextForm.state].filter(Boolean).join(", ") || "Market not listed";
    const numbers = [
      nextForm.asking_price ? `Ask ${moneyText(nextForm.asking_price)}` : "",
      nextForm.arv ? `ARV ${moneyText(nextForm.arv)}` : "",
      nextForm.repair_estimate ? `Repairs ${moneyText(nextForm.repair_estimate)}` : "",
    ].filter(Boolean);

    const physical = [
      nextForm.beds ? `${nextForm.beds} beds` : "",
      nextForm.baths ? `${nextForm.baths} baths` : "",
      nextForm.sqft ? `${nextForm.sqft} sqft` : "",
      nextForm.year_built ? `Built ${nextForm.year_built}` : "",
    ].filter(Boolean);

    const routing = [
      nextForm.routing_needs ? `Needs ${nextForm.routing_needs}` : "",
      nextForm.distress_signals ? `Pressure ${nextForm.distress_signals}` : "",
      nextForm.capital_needed ? `Capital ${nextForm.capital_needed}` : "",
      nextForm.contractor_scope ? `Contractor ${nextForm.contractor_scope}` : "",
      nextForm.operator_scope ? `Operator/JV ${nextForm.operator_scope}` : "",
      nextForm.target_buyer ? `Target ${nextForm.target_buyer}` : "",
    ].filter(Boolean);

    return [
      `${nextForm.property_type} opportunity in ${market}`,
      nextForm.strategy ? `Strategy: ${nextForm.strategy}` : "",
      nextForm.exit_strategy ? `Exit: ${nextForm.exit_strategy}` : "",
      numbers.length ? `Economics: ${numbers.join(" / ")}` : "",
      physical.length ? `Asset: ${physical.join(" / ")}` : "",
      routing.length ? `Routing: ${routing.join(" / ")}` : "",
      nextForm.description ? `Notes: ${nextForm.description}` : "",
    ]
      .filter(Boolean)
      .join(" | ");
  }

  function buildPayload(photoUrls: string[], email: string) {
    const summary = buildRouteSummary(form);
    const market = [form.city, form.county, form.state].filter(Boolean).join(", ");

    return {
      // Direct live vf_deals columns
      owner_email: email,
      title: form.title,
      state: form.state,
      property_type: form.property_type,
      strategy: form.strategy,
      price: form.asking_price,
      description: form.description,
      status: "active",
      archived: false,
      city: form.city,
      county: form.county,
      county_name: form.county,
      market_county: form.county,
      address: form.address,
      asking_price: form.asking_price,
      arv: form.arv,
      repair_estimate: form.repair_estimate,
      equity: "",
      debt_balance: "",
      rent_estimate: "",
      noi: form.noi,
      cap_rate: form.cap_rate,
      lot_size: form.lot_size,
      building_sqft: form.building_sqft || form.sqft,
      land_acres: form.land_acres || form.lot_size,
      units: form.units,
      bedrooms: form.bedrooms || form.beds,
      bathrooms: form.bathrooms || form.baths,
      year_built: form.year_built,
      occupancy: form.occupancy,
      condition: form.condition,
      timeline: form.timeline,
      seller_situation: form.seller_situation,
      access_notes: form.access_notes,
      private_notes: form.private_notes,
      deal_needs: form.deal_needs || form.routing_needs,
      photo_urls: photoUrls,
      main_photo_url: photoUrls[0] || "",
      zoning: form.zoning,
      utilities: form.utilities,
      road_frontage: form.road_access,
      parcel_id: "",
      in_buy_bucket: false,
      member_email: email,
      commercial_type: form.property_type === "Commercial" ? form.deal_needs : "",
      tenant_status: form.occupancy,
      frontage: form.road_access,
      road_access: form.road_access,
      topography: "",
      owner_name: "",
      owner_phone: "",
      owner_contact_email: "",
      preferred_contact: "",
      deleted: false,
      folder: "Active",
      deal_type: form.property_type,
      beds: form.beds || form.bedrooms,
      baths: form.baths || form.bathrooms,
      sqft: form.sqft || form.building_sqft,

      // Extra aliases for API/feed/detail fallback
      submitted_by: email,
      submitted_by_email: email,
      user_email: email,
      created_by_email: email,
      deal_title: form.title,
      project_title: form.title,
      asset_type: form.property_type,
      exit_strategy: form.exit_strategy,
      ask: form.asking_price,
      purchase_price: form.asking_price,
      arv_value: form.arv,
      estimated_value: form.arv,
      after_repair_value: form.arv,
      repairs_needed: form.repair_estimate,
      estimated_repairs: form.repair_estimate,
      rehab_budget: form.repair_estimate,
      repair_budget: form.repair_estimate,
      square_feet: form.sqft || form.building_sqft,
      occupancy_status: form.occupancy,
      tenant_status_alias: form.occupancy,
      zoning_type: form.zoning,
      utility_access: form.utilities || form.access_notes,
      routing_needs: form.routing_needs || form.deal_needs,
      needs: form.routing_needs || form.deal_needs,
      route_context: form.routing_needs || form.deal_needs,
      distress_signals: form.distress_signals,
      seller_pressure: form.distress_signals,
      pain_signals: form.distress_signals,
      urgency: form.urgency_level,
      urgency_level: form.urgency_level,
      target_buyer: form.target_buyer,
      capital_needed: form.capital_needed,
      ideal_lender: form.ideal_lender,
      contractor_scope: form.contractor_scope,
      operator_scope: form.operator_scope,
      jv_structure: form.jv_structure,
      title_issue: form.title_issue,
      ai_summary: summary,
      ai_route_summary: summary,
      route_summary: summary,
      routing_summary: summary,
      photos: photoUrls,
      image_url: photoUrls[0] || "",
      photo_url: photoUrls[0] || "",
      primary_photo_url: photoUrls[0] || "",
      market,
      raw_form_snapshot: { ...form },
    };
  }

  async function uploadPhotos(email: string) {
    const urls: string[] = [];

    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("email", email);
      formData.append("folder", "deal");

      const routes = ["/api/deal/upload-photo", "/api/uploads/deal", "/api/uploads/project", "/api/uploads/pain"];

      let uploaded = "";

      for (const route of routes) {
        try {
          const response = await fetch(route, {
            method: "POST",
            body: formData,
            credentials: "include",
          });

          const data = await response.json().catch(() => ({}));

          uploaded = clean(data.url || data.publicUrl || data.public_url || data.photo_url || data.image_url || data.main_photo_url);

          if (uploaded) break;
        } catch {
          // Try next route.
        }
      }

      if (!uploaded) {
        throw new Error(`Photo upload failed for ${file.name}.`);
      }

      urls.push(uploaded);
    }

    return urls;
  }

  async function submitDeal(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const email = currentEmail() || "dm2107137@gmail.com";

    if (!clean(form.title)) {
      setStatus("Deal title is required.");
      return;
    }

    if (!clean(form.state)) {
      setStatus("State is required.");
      return;
    }

    if (!clean(form.county)) {
      setStatus("County is required.");
      return;
    }

    if (!clean(form.city)) {
      setStatus("City is required.");
      return;
    }

    setSaving(true);
    setStatus("Saving deal...");
    setLastResponse(null);

    try {
      const urls = await uploadPhotos(email);
      const payload = buildPayload(urls, email);

      const response = await fetch("/api/deal/create", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "x-vf-email": email,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));
      setLastResponse(data);

      if (!response.ok || data?.ok === false) {
        throw new Error(backendErrorText(data, "Deal save failed."));
      }

      const check = data?.field_check || {};

      setStatus(
        [
          "Saved.",
          check.asking_price ? `Ask: ${check.asking_price}` : "",
          check.arv ? `ARV: ${check.arv}` : "",
          check.beds ? `Beds: ${check.beds}` : "",
          check.square_feet ? `Sqft: ${check.square_feet}` : "",
        ]
          .filter(Boolean)
          .join(" ")
      );
    } catch (error: any) {
      setStatus(error?.message || "Deal save failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main style={page}>
      <style>{`
        input::placeholder, textarea::placeholder {
          color: rgba(203,213,225,.58);
        }

        option {
          color: #06100a;
        }

        @media (max-width: 760px) {
          .vf-form-grid {
            grid-template-columns: 1fr !important;
          }

          .vf-actions {
            display: grid !important;
            grid-template-columns: 1fr !important;
          }

          .vf-actions > *,
          .vf-command-actions > * {
            width: 100%;
            box-sizing: border-box;
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

        <section style={card}>
          <div style={label}>Submit Deal</div>
          <h1 style={{ fontSize: "clamp(48px,9vw,92px)", lineHeight: 0.9, letterSpacing: "-.07em", margin: "12px 0 14px" }}>
            Submit a routed deal room.
          </h1>

          <p style={{ ...muted, fontSize: 20 }}>
            This form saves directly into the live `vf_deals` columns. State, county, and city are required so Projects can group workstations by market buckets.
          </p>

          <div className="vf-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
            <Link href="/dashboard" style={ghost}>Dashboard</Link>
            <Link href="/projects" style={ghost}>Projects</Link>
            <Link href="/buy-bucket" style={ghost}>Buy Bucket</Link>

          </div>
        </section>

        {status ? (
          <section style={card}>
            <div style={label}>Save Status</div>
            <h2 style={{ margin: "10px 0 0", fontSize: 30 }}>{status}</h2>
            {lastResponse && lastResponse.ok === false ? (
              <div style={{ marginTop: 14 }}>
                <div style={{ ...label, fontSize: 11 }}>Backend Debug</div>
                <pre
                  style={{
                    whiteSpace: "pre-wrap",
                    color: "#cbd5e1",
                    fontSize: 13,
                    marginTop: 10,
                    padding: 14,
                    borderRadius: 16,
                    border: "1px solid rgba(255,255,255,.12)",
                    background: "rgba(0,0,0,.26)",
                    overflowX: "auto",
                  }}
                >
                  {shortJson(debugPayload(lastResponse))}
                </pre>
              </div>
            ) : null}
          </section>
        ) : null}

        <form onSubmit={submitDeal}>
          <section style={card}>
            <div style={label}>Deal Type</div>
            <p style={muted}>Choose the opportunity type. The selected type changes the fields and routing context.</p>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
              {(["Residential", "Commercial", "Land"] as DealType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => update("property_type", type)}
                  style={form.property_type === type ? button : ghost}
                >
                  {type}
                </button>
              ))}
            </div>
          </section>

          <section style={card}>
            <div style={label}>Basics</div>

            <Grid>
              <Field labelText="Deal Title" name="title" value={form.title} onChange={update} placeholder="123 Maple deal, off-market duplex, etc." />
              <SelectField labelText="State" name="state" value={form.state} onChange={update} options={STATES} />
              <Field labelText="County" name="county" value={form.county} onChange={update} placeholder="Bartow County" />
              <Field labelText="City" name="city" value={form.city} onChange={update} placeholder="Cartersville" />
              <Field labelText="Address" name="address" value={form.address} onChange={update} placeholder="Optional private location" />
              <SelectField
                labelText="Strategy"
                name="strategy"
                value={form.strategy}
                onChange={update}
                options={
                  form.property_type === "Land"
                    ? ["Entitlement", "Buy & Hold", "Assign", "Develop", "Land Bank"]
                    : form.property_type === "Commercial"
                    ? ["Hold", "Value Add", "Lease Up", "Reposition", "Owner User", "Flip"]
                    : ["Fix & Flip", "Buy & Hold", "BRRRR", "Wholesale", "Rental", "Owner Finance"]
                }
              />
              <SelectField
                labelText="Exit Strategy"
                name="exit_strategy"
                value={form.exit_strategy}
                onChange={update}
                options={["Flip", "Hold", "Wholesale", "Assign", "Refinance", "Lease / Reposition", "Develop", "Sell"]}
              />
              <Field labelText="Asking Price" name="asking_price" value={form.asking_price} onChange={update} placeholder="250000" />
              <Field labelText="ARV / Value" name="arv" value={form.arv} onChange={update} placeholder="325000" />
              <Field labelText="Repair Estimate" name="repair_estimate" value={form.repair_estimate} onChange={update} placeholder="45000" />
            </Grid>
          </section>

          {form.property_type === "Residential" ? (
            <section style={card}>
              <div style={label}>Residential Fields</div>
              <Grid>
                <Field labelText="Beds" name="beds" value={form.beds} onChange={update} placeholder="3" />
                <Field labelText="Baths" name="baths" value={form.baths} onChange={update} placeholder="2" />
                <Field labelText="Sqft" name="sqft" value={form.sqft} onChange={update} placeholder="1250" />
                <Field labelText="Year Built" name="year_built" value={form.year_built} onChange={update} placeholder="1985" />
                <Field labelText="Occupancy" name="occupancy" value={form.occupancy} onChange={update} placeholder="Vacant, tenant occupied, owner occupied" />
                <Field labelText="Condition" name="condition" value={form.condition} onChange={update} placeholder="Light rehab, heavy rehab, rent ready" />
              </Grid>
            </section>
          ) : null}

          {form.property_type === "Commercial" ? (
            <section style={card}>
              <div style={label}>Commercial Fields</div>
              <Grid>
                <Field labelText="Building Sqft" name="building_sqft" value={form.building_sqft} onChange={update} placeholder="5800" />
                <Field labelText="Units" name="units" value={form.units} onChange={update} placeholder="4 units / suites" />
                <Field labelText="NOI" name="noi" value={form.noi} onChange={update} placeholder="78000" />
                <Field labelText="Cap Rate" name="cap_rate" value={form.cap_rate} onChange={update} placeholder="7.8%" />
                <Field labelText="Tenant Status" name="occupancy" value={form.occupancy} onChange={update} placeholder="Vacant, leased, partial occupancy" />
                <Field labelText="Commercial Type" name="deal_needs" value={form.deal_needs} onChange={update} placeholder="Retail, flex, office, multifamily" />
              </Grid>
            </section>
          ) : null}

          {form.property_type === "Land" ? (
            <section style={card}>
              <div style={label}>Land Fields</div>
              <Grid>
                <Field labelText="Acres" name="land_acres" value={form.land_acres} onChange={update} placeholder="3.5" />
                <Field labelText="Zoning" name="zoning" value={form.zoning} onChange={update} placeholder="R3, commercial, agricultural" />
                <Field labelText="Utilities" name="utilities" value={form.utilities} onChange={update} placeholder="Water, sewer, power nearby" />
                <Field labelText="Road Access" name="road_access" value={form.road_access} onChange={update} placeholder="Paved frontage, easement, corner lot" />
                <Field labelText="Lot Size" name="lot_size" value={form.lot_size} onChange={update} placeholder="152460 sqft" />
                <Field labelText="Timeline" name="timeline" value={form.timeline} onChange={update} placeholder="Ready now, 30 days, flexible" />
              </Grid>
            </section>
          ) : null}

          <section style={card}>
            <div style={label}>Routing Needs</div>
            <h2 style={{ fontSize: 34, lineHeight: 1, margin: "10px 0" }}>
              Who should VaultForge route this to?
            </h2>

            <Grid>
              <Field labelText="Deal Needs / Routing Need" name="routing_needs" value={form.routing_needs} onChange={update} placeholder="Buyer needed, contractor needed, lender needed, JV partner needed" />
              <Field labelText="Distress / Signal Pressure" name="distress_signals" value={form.distress_signals} onChange={update} placeholder="Fast close, funding gap, foreclosure, vacant, stalled construction" />
              <SelectField labelText="Urgency" name="urgency_level" value={form.urgency_level} onChange={update} options={["Low", "Normal", "High", "Urgent", "Emergency"]} />
              <Field labelText="Capital Needed" name="capital_needed" value={form.capital_needed} onChange={update} placeholder="$50k gap, acquisition capital, repairs" />
              <Field labelText="Target Buyer Type" name="target_buyer" value={form.target_buyer} onChange={update} placeholder="Cash buyer, landlord, builder, owner-user" />
              <Field labelText="Ideal Lender" name="ideal_lender" value={form.ideal_lender} onChange={update} placeholder="Hard money, DSCR, private capital" />
              <Field labelText="Contractor Scope" name="contractor_scope" value={form.contractor_scope} onChange={update} placeholder="Roof, HVAC, siding, full rehab" />
              <Field labelText="Operator / JV Scope" name="operator_scope" value={form.operator_scope} onChange={update} placeholder="Manage rehab, take lead, capital partner" />
              <Field labelText="JV Structure" name="jv_structure" value={form.jv_structure} onChange={update} placeholder="50/50, capital partner, operator split" />
              <Field labelText="Title Issue" name="title_issue" value={form.title_issue} onChange={update} placeholder="Probate, lien, unclear owner, no issue" />
            </Grid>
          </section>

          <section style={card}>
            <div style={label}>Situation / Notes</div>

            <Grid>
              <TextAreaField labelText="Seller / Situation" name="seller_situation" value={form.seller_situation} onChange={update} placeholder="Why the owner may move, timeline, access, pressure, special context." />
              <TextAreaField labelText="Access Notes" name="access_notes" value={form.access_notes} onChange={update} placeholder="Showing info, lockbox, access instructions, utility context." />
              <TextAreaField labelText="Description / Deal Notes" name="description" value={form.description} onChange={update} placeholder="Anything the workstation should know." />
              <TextAreaField labelText="Private Notes" name="private_notes" value={form.private_notes} onChange={update} placeholder="Private owner/internal notes." />
            </Grid>
          </section>

          <section style={card}>
            <div style={label}>Photos</div>
            <p style={muted}>Upload photos from your phone. Photos are saved first, then the returned URLs are attached to the deal row.</p>

            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(event) => setFiles(Array.from(event.target.files || []))}
              style={input}
            />

            {photoPreviews.length ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 12, marginTop: 14 }}>
                {photoPreviews.map((photo) => (
                  <div key={photo.url} style={{ borderRadius: 16, overflow: "hidden", border: "1px solid rgba(255,255,255,.12)" }}>
                    <img src={photo.url} alt={photo.name} style={{ width: "100%", height: 130, objectFit: "cover", display: "block" }} />
                  </div>
                ))}
              </div>
            ) : null}
          </section>

          <section style={card}>
            <div style={label}>AI Smart Summary Preview</div>
            <p style={{ ...muted, fontSize: 18 }}>{buildRouteSummary(form)}</p>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
              <span style={pill}>Ask: {moneyText(form.asking_price)}</span>
              <span style={pill}>ARV: {moneyText(form.arv)}</span>
              <span style={pill}>Repairs: {moneyText(form.repair_estimate)}</span>
              <span style={pill}>Beds/Baths: {[form.beds, form.baths].filter(Boolean).join(" / ") || "Not listed"}</span>
              <span style={pill}>Sqft: {form.sqft || form.building_sqft || "Not listed"}</span>
              <span style={pill}>Strategy: {form.strategy || "Not listed"}</span>
            </div>

            <div className="vf-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 20 }}>
              <button type="submit" disabled={saving} style={{ ...button, opacity: saving ? 0.65 : 1 }}>
                {saving ? "Saving..." : "Submit Deal Room"}
              </button>
              <Link href="/projects" style={ghost}>Back to Projects</Link>
            </div>
          </section>
        </form>
      </div>
    </main>
  );
}