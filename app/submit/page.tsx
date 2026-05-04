"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";

type DealType = "Residential" | "Commercial" | "Land";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  "";
const PHOTO_BUCKET = "deal-photos";

const states = [
  "Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut","Delaware","Florida","Georgia",
  "Hawaii","Idaho","Illinois","Indiana","Iowa","Kansas","Kentucky","Louisiana","Maine","Maryland",
  "Massachusetts","Michigan","Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire",
  "New Jersey","New Mexico","New York","North Carolina","North Dakota","Ohio","Oklahoma","Oregon","Pennsylvania",
  "Rhode Island","South Carolina","South Dakota","Tennessee","Texas","Utah","Vermont","Virginia","Washington",
  "West Virginia","Wisconsin","Wyoming"
];

const shell: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(232,196,107,.16), transparent 30%), radial-gradient(circle at top right, rgba(157,243,191,.10), transparent 28%), linear-gradient(180deg, #06100a 0%, #102015 58%, #06100a 100%)",
  color: "#fff",
  padding: "28px 18px 90px",
  fontFamily: "Arial, sans-serif",
};

const wrap: React.CSSProperties = { maxWidth: 1100, margin: "0 auto" };
const card: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.28)",
  background: "linear-gradient(135deg, rgba(255,255,255,.075), rgba(255,255,255,.025))",
  borderRadius: 34,
  padding: "26px 22px",
  marginBottom: 22,
  boxShadow: "0 24px 70px rgba(0,0,0,.30)",
};
const nav: React.CSSProperties = { display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 20 };
const navLink: React.CSSProperties = {
  color: "#06100a",
  background: "#f5d978",
  textDecoration: "none",
  borderRadius: 999,
  padding: "13px 18px",
  fontWeight: 900,
  border: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};
const ghostButton: React.CSSProperties = {
  color: "#f5d978",
  background: "rgba(255,255,255,.035)",
  textDecoration: "none",
  borderRadius: 999,
  padding: "13px 18px",
  fontWeight: 900,
  border: "1px solid rgba(245,217,120,.35)",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};
const label: React.CSSProperties = { display: "block", fontWeight: 900, margin: "0 0 9px", color: "rgba(255,255,255,.86)", fontSize: 15 };
const input: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  borderRadius: 18,
  border: "1px solid rgba(255,255,255,.18)",
  background: "rgba(255,255,255,.075)",
  color: "white",
  padding: "15px 15px",
  fontSize: 16,
  outline: "none",
};
const grid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 14 };
const eyebrow: React.CSSProperties = { color: "#f5d978", letterSpacing: 5, fontSize: 12, fontWeight: 900, marginBottom: 12 };
const muted: React.CSSProperties = { color: "rgba(255,255,255,.67)", lineHeight: 1.5, fontSize: 18 };
const uploadBox: React.CSSProperties = {
  border: "2px dashed rgba(245,217,120,.55)",
  borderRadius: 28,
  padding: "34px 16px",
  textAlign: "center",
  cursor: "pointer",
  background: "rgba(245,217,120,.06)",
};

function getEmail() {
  if (typeof window === "undefined") return "";
  return (
    window.localStorage.getItem("vf_email") ||
    window.sessionStorage.getItem("vf_email") ||
    "text@text.com"
  ).trim().toLowerCase();
}

function moneyOnly(value: string) {
  return value.replace(/[^\d.]/g, "");
}

function safeFileName(file: File) {
  const clean = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, "-").replace(/-+/g, "-");
  return `${Date.now()}-${Math.random().toString(16).slice(2)}-${clean}`;
}

async function uploadPhoto(file: File, email: string) {
  if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error("Missing Supabase environment values.");
  const path = `${email || "member"}/${safeFileName(file)}`;
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${PHOTO_BUCKET}/${path}`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": file.type || "image/jpeg",
      "x-upsert": "true",
    },
    body: file,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Photo upload failed.");
  }

  return `${SUPABASE_URL}/storage/v1/object/public/${PHOTO_BUCKET}/${path}`;
}

export default function SubmitPage() {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [dealType, setDealType] = useState<DealType>("Residential");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [form, setForm] = useState<Record<string, string>>({
    title: "",
    strategy: "Fix & Flip",
    city: "",
    state: "Georgia",
    address: "",
    asking_price: "",
    arv: "",
    repair_estimate: "",
    description: "",
    bedrooms: "",
    bathrooms: "",
    building_sqft: "",
    year_built: "",
    occupancy: "",
    condition: "",
    commercial_type: "",
    units: "",
    noi: "",
    cap_rate: "",
    zoning: "",
    tenant_status: "",
    land_acres: "",
    frontage: "",
    utilities: "",
    road_access: "",
    topography: "",
    parcel_id: "",
    seller_situation: "",
    access_notes: "",
    private_notes: "",
  });

  const typeHelp = useMemo(() => {
    if (dealType === "Residential") return "Single-family, small multifamily, flips, rentals, creative finance, or distressed residential opportunities.";
    if (dealType === "Commercial") return "Retail, industrial, office, mixed-use, multifamily, self-storage, hospitality, and income-producing assets.";
    return "Lots, acreage, infill parcels, development land, entitled land, timber, agricultural, or recreational land.";
  }, [dealType]);

  function update(key: string, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function chooseFiles(nextFiles: FileList | null) {
    const selected = Array.from(nextFiles || []).filter((file) => file.type.startsWith("image/")).slice(0, 10);
    setFiles(selected);
    previews.forEach((url) => URL.revokeObjectURL(url));
    setPreviews(selected.map((file) => URL.createObjectURL(file)));
  }

  async function submitDeal() {
    setError("");
    setStatus("");
    setBusy(true);

    try {
      const email = getEmail();
      if (!form.title.trim()) throw new Error("Deal title is required.");
      if (!form.city.trim()) throw new Error("City is required.");
      if (!form.state.trim()) throw new Error("State is required.");
      if (files.length < 1) throw new Error("Upload at least 1 photo for testing.");

      setStatus(`Uploading ${files.length} photo${files.length === 1 ? "" : "s"}...`);
      const photo_urls = [];
      for (const file of files) {
        photo_urls.push(await uploadPhoto(file, email));
      }

      setStatus("Saving deal...");
      const payload = {
        owner_email: email,
        member_email: email,
        title: form.title.trim(),
        property_type: dealType,
        strategy: form.strategy,
        city: form.city.trim(),
        state: form.state.trim(),
        address: form.address.trim(),
        asking_price: moneyOnly(form.asking_price),
        arv: moneyOnly(form.arv),
        repair_estimate: moneyOnly(form.repair_estimate),
        description: form.description.trim(),
        status: "active",
        photo_urls,
        main_photo_url: photo_urls[0] || "",
        bedrooms: form.bedrooms,
        bathrooms: form.bathrooms,
        building_sqft: form.building_sqft,
        year_built: form.year_built,
        occupancy: form.occupancy,
        condition: form.condition,
        commercial_type: form.commercial_type,
        units: form.units,
        noi: form.noi,
        cap_rate: form.cap_rate,
        zoning: form.zoning,
        tenant_status: form.tenant_status,
        land_acres: form.land_acres,
        frontage: form.frontage,
        utilities: form.utilities,
        road_access: form.road_access,
        topography: form.topography,
        parcel_id: form.parcel_id,
        seller_situation: form.seller_situation,
        access_notes: form.access_notes,
        private_notes: form.private_notes,
      };

      const res = await fetch("/api/deal/create", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-vf-email": email },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || data?.details || "Deal save failed.");

      setStatus("Deal saved. Open Projects or Buy Bucket to view it.");
      setForm((current) => ({ ...current, title: "", city: "", address: "", description: "" }));
    } catch (err: any) {
      setError(err?.message || "Could not submit deal.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={shell}>
      <div style={wrap}>
        <nav style={nav}>
          <Link href="/dashboard" style={navLink}>Dashboard</Link>
          <Link href="/projects" style={navLink}>Projects</Link>
          <Link href="/buy-bucket" style={navLink}>Buy Bucket</Link>
          <Link href="/alerts" style={ghostButton}>Alerts</Link>
        </nav>

        <section style={card}>
          <div style={eyebrow}>VAULTFORGE CREATE</div>
          <h1 style={{ fontSize: "clamp(54px, 12vw, 104px)", lineHeight: .88, margin: "0 0 18px", letterSpacing: -4 }}>
            Submit a real deal room.
          </h1>
          <p style={muted}>
            Choose Residential, Commercial, or Land. Each type now opens its own field set and saves with real uploaded photos.
          </p>
        </section>

        {(error || status) && (
          <section style={{ ...card, borderColor: error ? "rgba(255,90,90,.65)" : "rgba(157,243,191,.35)" }}>
            <p style={{ margin: 0, color: error ? "#ffd0d0" : "#9df3bf", fontWeight: 900, fontSize: 18 }}>
              {error || status}
            </p>
          </section>
        )}

        <section style={card}>
          <div style={eyebrow}>DEAL TYPE</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            {(["Residential", "Commercial", "Land"] as DealType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setDealType(type)}
                style={dealType === type ? navLink : ghostButton}
              >
                {type}
              </button>
            ))}
          </div>
          <p style={muted}>{typeHelp}</p>
        </section>

        <section style={card}>
          <div style={eyebrow}>DEAL BASICS</div>
          <div style={grid}>
            <Field label="Deal Title *" value={form.title} onChange={(v) => update("title", v)} placeholder="Cartersville flip, Atlanta retail strip, 12-acre infill parcel..." />
            <SelectField label="Strategy" value={form.strategy} onChange={(v) => update("strategy", v)} options={["Fix & Flip", "Rental", "Wholesale", "Creative Finance", "Buy & Hold", "Development", "JV Needed", "Lender Needed", "Buyer Needed"]} />
            <Field label="City *" value={form.city} onChange={(v) => update("city", v)} />
            <SelectField label="State *" value={form.state} onChange={(v) => update("state", v)} options={states} />
            <Field label="Address / Area" value={form.address} onChange={(v) => update("address", v)} />
            <Field label="Asking Price" value={form.asking_price} onChange={(v) => update("asking_price", v)} placeholder="$" />
            <Field label="ARV / Value" value={form.arv} onChange={(v) => update("arv", v)} placeholder="$" />
            <Field label="Repair Estimate" value={form.repair_estimate} onChange={(v) => update("repair_estimate", v)} placeholder="$" />
          </div>
        </section>

        {dealType === "Residential" && (
          <section style={card}>
            <div style={eyebrow}>RESIDENTIAL FIELDS</div>
            <div style={grid}>
              <Field label="Bedrooms" value={form.bedrooms} onChange={(v) => update("bedrooms", v)} />
              <Field label="Bathrooms" value={form.bathrooms} onChange={(v) => update("bathrooms", v)} />
              <Field label="Building Sqft" value={form.building_sqft} onChange={(v) => update("building_sqft", v)} />
              <Field label="Year Built" value={form.year_built} onChange={(v) => update("year_built", v)} />
              <SelectField label="Occupancy" value={form.occupancy} onChange={(v) => update("occupancy", v)} options={["Vacant", "Owner Occupied", "Tenant Occupied", "Unknown"]} />
              <SelectField label="Condition" value={form.condition} onChange={(v) => update("condition", v)} options={["Light Cosmetic", "Medium Rehab", "Heavy Rehab", "Fire/Flood", "Tear Down", "Unknown"]} />
            </div>
          </section>
        )}

        {dealType === "Commercial" && (
          <section style={card}>
            <div style={eyebrow}>COMMERCIAL FIELDS</div>
            <div style={grid}>
              <SelectField label="Commercial Type" value={form.commercial_type} onChange={(v) => update("commercial_type", v)} options={["Retail", "Office", "Industrial", "Mixed Use", "Multifamily", "Self Storage", "Hospitality", "Mobile Home Park", "Other"]} />
              <Field label="Units / Suites" value={form.units} onChange={(v) => update("units", v)} />
              <Field label="Building Sqft" value={form.building_sqft} onChange={(v) => update("building_sqft", v)} />
              <Field label="NOI" value={form.noi} onChange={(v) => update("noi", v)} placeholder="$" />
              <Field label="Cap Rate" value={form.cap_rate} onChange={(v) => update("cap_rate", v)} placeholder="%" />
              <Field label="Zoning" value={form.zoning} onChange={(v) => update("zoning", v)} />
              <SelectField label="Tenant Status" value={form.tenant_status} onChange={(v) => update("tenant_status", v)} options={["Vacant", "Partially Occupied", "Fully Occupied", "Owner User", "Unknown"]} />
            </div>
          </section>
        )}

        {dealType === "Land" && (
          <section style={card}>
            <div style={eyebrow}>LAND FIELDS</div>
            <div style={grid}>
              <Field label="Acres" value={form.land_acres} onChange={(v) => update("land_acres", v)} />
              <Field label="Parcel ID" value={form.parcel_id} onChange={(v) => update("parcel_id", v)} />
              <Field label="Zoning" value={form.zoning} onChange={(v) => update("zoning", v)} />
              <Field label="Road Frontage" value={form.frontage} onChange={(v) => update("frontage", v)} />
              <SelectField label="Utilities" value={form.utilities} onChange={(v) => update("utilities", v)} options={["At Site", "Nearby", "Septic/Well", "Unknown", "None"]} />
              <SelectField label="Road Access" value={form.road_access} onChange={(v) => update("road_access", v)} options={["Public Road", "Private Road", "Easement", "Landlocked", "Unknown"]} />
              <SelectField label="Topography" value={form.topography} onChange={(v) => update("topography", v)} options={["Flat", "Rolling", "Sloped", "Wooded", "Cleared", "Mixed", "Unknown"]} />
            </div>
          </section>
        )}

        <section style={card}>
          <div style={eyebrow}>PHOTOS</div>
          <h2 style={{ fontSize: 42, margin: "0 0 10px" }}>Upload deal photos</h2>
          <p style={muted}>Tap the upload field. Select at least 1 photo for testing. Later we can enforce 5 minimum.</p>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: "none" }}
            onChange={(event) => chooseFiles(event.target.files)}
          />
          <div style={uploadBox} onClick={() => fileRef.current?.click()}>
            <h3 style={{ color: "#f5d978", fontSize: 30, margin: "0 0 18px" }}>Tap to choose photos</h3>
            <p style={{ ...muted, margin: 0, fontWeight: 900 }}>Selected photos: {files.length} / 10</p>
          </div>
          {previews.length > 0 && (
            <div style={{ ...grid, marginTop: 18 }}>
              {previews.map((src, i) => (
                <img key={src} src={src} alt={`Selected ${i + 1}`} style={{ width: "100%", height: 190, objectFit: "cover", borderRadius: 22, border: "1px solid rgba(255,255,255,.16)" }} />
              ))}
            </div>
          )}
        </section>

        <section style={card}>
          <div style={eyebrow}>CONTEXT</div>
          <Textarea label="Description / Deal Summary" value={form.description} onChange={(v) => update("description", v)} />
          <Textarea label="Seller Situation" value={form.seller_situation} onChange={(v) => update("seller_situation", v)} />
          <Textarea label="Access Notes" value={form.access_notes} onChange={(v) => update("access_notes", v)} />
          <Textarea label="Private Notes" value={form.private_notes} onChange={(v) => update("private_notes", v)} />
        </section>

        <button
          type="button"
          onClick={submitDeal}
          disabled={busy}
          style={{
            ...navLink,
            width: "100%",
            fontSize: 22,
            padding: "18px 22px",
            opacity: busy ? .65 : 1,
          }}
        >
          {busy ? "Saving Deal..." : "Submit Deal"}
        </button>
      </div>
    </main>
  );
}

function Field({ label: labelText, value, onChange, placeholder = "" }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label style={label}>{labelText}</label>
      <input style={input} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}

function SelectField({ label: labelText, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div>
      <label style={label}>{labelText}</label>
      <select style={input} value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => <option key={option} value={option} style={{ color: "#111" }}>{option}</option>)}
      </select>
    </div>
  );
}

function Textarea({ label: labelText, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={label}>{labelText}</label>
      <textarea style={{ ...input, minHeight: 130, resize: "vertical" }} value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}
