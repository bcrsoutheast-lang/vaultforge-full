"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

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

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  "";

const BUCKETS = ["deal-photos", "deal-photo", "project-images"];

const STATES = [
  "Georgia","Tennessee","Florida","North Carolina","South Carolina","Texas",
  "Alabama","California","New York","Ohio","Pennsylvania","Other"
];

const RESIDENTIAL_STRATEGIES = [
  "Fix & Flip",
  "Buy & Hold",
  "BRRRR",
  "Wholesale",
  "Short-Term Rental",
  "Subto / Seller Finance"
];

const COMMERCIAL_STRATEGIES = [
  "Value Add",
  "Ground Up",
  "Mixed Use",
  "Office Conversion",
  "Retail Redevelopment",
  "Industrial"
];

const LAND_STRATEGIES = [
  "Subdivision",
  "Entitlement",
  "Builder Lot",
  "Mobile Home Park",
  "RV Park",
  "Raw Land Hold"
];

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(157,243,191,.10), transparent 26%), radial-gradient(circle at top right, rgba(232,196,107,.12), transparent 24%), linear-gradient(180deg,#031008,#07180f 55%,#031008)",
  color: "white",
  padding: "28px 18px 90px",
  fontFamily: "Arial, sans-serif"
};

const wrap: React.CSSProperties = {
  maxWidth: 1180,
  margin: "0 auto"
};

const card: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.22)",
  background:
    "linear-gradient(145deg, rgba(255,255,255,.05), rgba(255,255,255,.02))",
  borderRadius: 32,
  padding: 24,
  marginBottom: 22,
  boxShadow: "0 20px 60px rgba(0,0,0,.35)"
};

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))",
  gap: 16
};

const btn: React.CSSProperties = {
  background: "linear-gradient(135deg,#f5d978,#9df3bf)",
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
  cursor: "pointer"
};

const ghost: React.CSSProperties = {
  background: "rgba(255,255,255,.04)",
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
  cursor: "pointer"
};

const input: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  borderRadius: 18,
  border: "1px solid rgba(255,255,255,.18)",
  background: "rgba(255,255,255,.075)",
  color: "white",
  padding: 15,
  fontSize: 16
};

const label: React.CSSProperties = {
  display: "block",
  fontWeight: 900,
  margin: "0 0 8px"
};

const eyebrow: React.CSSProperties = {
  color: "#f5d978",
  letterSpacing: 5,
  fontWeight: 900,
  fontSize: 12,
  marginBottom: 12
};

const greenEyebrow: React.CSSProperties = {
  ...eyebrow,
  color: "#9df3bf"
};

function getEmail() {
  if (typeof window === "undefined") return "";

  return (
    localStorage.getItem("vf_email") ||
    sessionStorage.getItem("vf_email") ||
    ""
  ).trim().toLowerCase();
}

function cleanFileName(file: File) {
  return `${Date.now()}-${Math.random()
    .toString(16)
    .slice(2)}-${file.name.toLowerCase().replace(/[^a-z0-9.]+/g, "-")}`;
}

async function upload(file: File, email: string) {
  const safeEmail = (email || "guest").replace(/[^a-z0-9@._-]+/gi, "-");
  const path = `${safeEmail}/${cleanFileName(file)}`;

  let lastError = "";

  for (const bucket of BUCKETS) {
    const res = await fetch(
      `${SUPABASE_URL}/storage/v1/object/${bucket}/${path}`,
      {
        method: "POST",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          "Content-Type": file.type || "image/jpeg",
          "x-upsert": "true"
        },
        body: file
      }
    );

    if (res.ok) {
      return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
    }

    lastError = await res.text();
  }

  throw new Error(lastError || "Upload failed.");
}

const empty = {
  title:"",
  property_type:"Residential" as DealType,
  strategy:"Fix & Flip",
  city:"",
  state:"Georgia",
  address:"",
  asking_price:"",
  arv:"",
  repair_estimate:"",
  beds:"",
  baths:"",
  square_feet:"",
  year_built:"",
  zoning:"",
  acres:"",
  occupancy:"",
  noi:"",
  cap_rate:"",
  description:"",
  seller_situation:"",
  access_notes:"",
  deal_needs:""
};

function strategyOptions(type: DealType) {
  if (type === "Commercial") return COMMERCIAL_STRATEGIES;
  if (type === "Land") return LAND_STRATEGIES;
  return RESIDENTIAL_STRATEGIES;
}

function LockedScreen({ reason }: { reason: "login" | "profile" | "payment" | "loading"; }) {
  return (
    <main style={page}>
      <div style={wrap}>
        <section style={card}>
          <div style={greenEyebrow}>VAULTFORGE CREATE</div>

          <h1 style={{
            fontSize: "clamp(52px,12vw,94px)",
            lineHeight: .9,
            margin: "0 0 14px"
          }}>
            {reason === "loading"
              ? "Checking access..."
              : reason === "login"
              ? "Create member access first."
              : reason === "profile"
              ? "Complete your profile first."
              : "Activate access first."}
          </h1>

          <p style={{
            color: "rgba(255,255,255,.72)",
            fontSize: 20,
            lineHeight: 1.5
          }}>
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

  const [lockReason, setLockReason] = useState<
    "loading" | "login" | "profile" | "payment" | "open"
  >("loading");

  const [form, setForm] = useState<Record<string, string>>(empty as any);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    async function checkAccess() {
      try {
        const email = getEmail();

        if (!email) {
          setLockReason("login");
          return;
        }

        const res = await fetch(
          `/api/member/access?email=${encodeURIComponent(email)}`,
          {
            cache: "no-store",
            headers: {
              "x-vf-email": email
            }
          }
        );

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
      strategy: strategyOptions(type)[0]
    }));
  }

  function pick(list: FileList | null) {
    const chosen = Array.from(list || [])
      .filter((f) => f.type.startsWith("image/"))
      .slice(0, 10);

    setFiles(chosen);
    setPreviews(chosen.map((f) => URL.createObjectURL(f)));
  }

  async function submit() {
    if (busy) return;

    setBusy(true);
    setMsg("");

    try {
      const email = getEmail();

      if (!form.title.trim() || !form.city.trim()) {
        throw new Error("Deal title and city are required.");
      }

      if (!files.length) {
        throw new Error("Upload at least one photo.");
      }

      setMsg("Uploading photos...");

      const urls = await Promise.all(
        files.map((f) => upload(f, email))
      );

      setMsg("Saving deal room...");

      const res = await fetch("/api/deal/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-vf-email": email
        },
        body: JSON.stringify({
          ...form,
          owner_email: email,
          member_email: email,
          photo_urls: urls,
          main_photo_url: urls[0] || ""
        })
      });

      const data = await res.json();

      if (!res.ok || data?.error) {
        throw new Error(data?.error || "Save failed.");
      }

      setMsg("Deal room saved successfully.");

      setForm(empty as any);
      setFiles([]);
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
        @media (max-width: 760px) {
          .vf-submit-actions {
            display:grid !important;
            grid-template-columns:1fr !important;
            gap:10px !important;
          }

          .vf-submit-actions > * {
            width:100%;
            margin:0 !important;
            box-sizing:border-box;
          }
        }
      `}</style>

      <div style={wrap}>
        <section style={card}>
          <div style={greenEyebrow}>VAULTFORGE CREATE</div>

          <h1 style={{
            fontSize: "clamp(58px,12vw,108px)",
            lineHeight: .88,
            margin: "0 0 14px"
          }}>
            Submit a real deal room.
          </h1>

          <p style={{
            color: "rgba(255,255,255,.72)",
            fontSize: 22,
            lineHeight: 1.45
          }}>
            Residential, commercial, and land opportunities routed through the member intelligence network.
          </p>

          <div className="vf-submit-actions">
            <Link href="/dashboard" style={ghost}>Dashboard</Link>
            <Link href="/projects" style={btn}>Projects</Link>
            <Link href="/buy-bucket" style={ghost}>Buy Bucket</Link>
          </div>
        </section>

        {msg && (
          <section style={card}>
            <strong>{msg}</strong>
          </section>
        )}

        <section style={card}>
          <div style={eyebrow}>DEAL TYPE</div>

          {(["Residential","Commercial","Land"] as DealType[]).map((t) => (
            <button
              key={t}
              type="button"
              style={form.property_type === t ? btn : ghost}
              onClick={() => switchType(t)}
            >
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
              <select
                style={input}
                value={form.state}
                onChange={(e) => set("state", e.target.value)}
              >
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
              <select
                style={input}
                value={form.strategy}
                onChange={(e) => set("strategy", e.target.value)}
              >
                {currentStrategies.map((s) => (
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

        {form.property_type === "Residential" && (
          <section style={card}>
            <div style={eyebrow}>RESIDENTIAL DETAILS</div>

            <div style={grid}>
              <Field label="Bedrooms" value={form.beds} onChange={(v) => set("beds", v)} />
              <Field label="Bathrooms" value={form.baths} onChange={(v) => set("baths", v)} />
              <Field label="Square Feet" value={form.square_feet} onChange={(v) => set("square_feet", v)} />
              <Field label="Year Built" value={form.year_built} onChange={(v) => set("year_built", v)} />
              <Field label="Occupancy" value={form.occupancy} onChange={(v) => set("occupancy", v)} />
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

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: "none" }}
            onChange={(e) => pick(e.target.files)}
          />

          <button
            type="button"
            style={btn}
            onClick={() => fileRef.current?.click()}
          >
            Choose Photos ({files.length}/10)
          </button>

          <div style={{ ...grid, marginTop: 16 }}>
            {previews.map((src) => (
              <img
                key={src}
                src={src}
                style={{
                  width: "100%",
                  height: 220,
                  objectFit: "cover",
                  borderRadius: 20,
                  border: "1px solid rgba(255,255,255,.15)"
                }}
              />
            ))}
          </div>
        </section>

        <section style={card}>
          <div style={eyebrow}>DEAL INTELLIGENCE</div>

          <div style={grid}>
            <Field label="Seller Situation" value={form.seller_situation} onChange={(v) => set("seller_situation", v)} />
            <Field label="Deal Needs" value={form.deal_needs} onChange={(v) => set("deal_needs", v)} />
          </div>

          <div style={{ marginTop: 18 }}>
            <label style={label}>Access / Private Notes</label>

            <textarea
              style={{
                ...input,
                minHeight: 120
              }}
              value={form.access_notes}
              onChange={(e) => set("access_notes", e.target.value)}
            />
          </div>
        </section>

        <section style={card}>
          <div style={eyebrow}>DESCRIPTION</div>

          <textarea
            style={{
              ...input,
              minHeight: 180
            }}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
          />
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
            opacity: busy ? .65 : 1
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
  onChange
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label style={label}>{l}</label>

      <input
        style={input}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
