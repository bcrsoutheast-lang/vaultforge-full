"use client";

import { useRef, useState } from "react";
import Link from "next/link";

type AssetType = "Residential" | "Commercial" | "Land";

type PainForm = {
  asset_type: AssetType;
  pain_type: string;
  urgency_level: string;
  title: string;
  description: string;
  requested_help: string;
  property_address: string;
  city: string;
  state: string;
  zip_code: string;
  capital_needed: string;
  estimated_value: string;
  estimated_repairs: string;
  bedrooms: string;
  bathrooms: string;
  sqft: string;
  units: string;
  noi: string;
  cap_rate: string;
  acres: string;
  zoning: string;
  road_access: string;
};

const initialForm: PainForm = {
  asset_type: "Residential",
  pain_type: "Distressed Seller",
  urgency_level: "High",
  title: "",
  description: "",
  requested_help: "",
  property_address: "",
  city: "",
  state: "",
  zip_code: "",
  capital_needed: "",
  estimated_value: "",
  estimated_repairs: "",
  bedrooms: "",
  bathrooms: "",
  sqft: "",
  units: "",
  noi: "",
  cap_rate: "",
  acres: "",
  zoning: "",
  road_access: "",
};

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(255,120,120,.20), transparent 28%), radial-gradient(circle at top right, rgba(157,243,191,.16), transparent 24%), linear-gradient(180deg,#02040a 0%,#071326 50%,#030509 100%)",
  color: "white",
  padding: "28px 18px 100px",
  fontFamily: "Arial, sans-serif",
};

const wrap: React.CSSProperties = { maxWidth: 1020, margin: "0 auto" };

const panel: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.14)",
  background:
    "linear-gradient(145deg, rgba(255,120,120,.10), rgba(181,92,255,.08), rgba(255,255,255,.035))",
  borderRadius: 28,
  padding: 22,
  marginBottom: 18,
};

const hero: React.CSSProperties = {
  ...panel,
  border: "1px solid rgba(255,120,120,.32)",
  padding: 26,
};

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))",
  gap: 14,
};

const label: React.CSSProperties = {
  display: "block",
  color: "#9df3bf",
  fontWeight: 950,
  letterSpacing: 2,
  fontSize: 12,
  textTransform: "uppercase",
  margin: "0 0 8px",
};

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

const btn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "linear-gradient(135deg,#f5d978,#9df3bf 55%,#b55cff)",
  color: "#06100a",
  textDecoration: "none",
  borderRadius: 999,
  padding: "13px 18px",
  fontWeight: 950,
  border: "none",
  margin: "7px 7px 0 0",
  minHeight: 46,
  cursor: "pointer",
};

const ghost: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  color: "white",
  textDecoration: "none",
  borderRadius: 999,
  padding: "13px 18px",
  fontWeight: 900,
  border: "1px solid rgba(255,255,255,.18)",
  background: "rgba(255,255,255,.06)",
  margin: "7px 7px 0 0",
  minHeight: 46,
  cursor: "pointer",
};

const activeChoice: React.CSSProperties = { ...btn, width: "100%", margin: 0 };
const inactiveChoice: React.CSSProperties = { ...ghost, width: "100%", margin: 0 };

const eyebrow: React.CSSProperties = {
  color: "#ff9f9f",
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

const thumb: React.CSSProperties = {
  width: "100%",
  height: 150,
  objectFit: "cover",
  borderRadius: 18,
  border: "1px solid rgba(255,255,255,.14)",
};

function getEmail() {
  if (typeof window === "undefined") return "";
  try {
    return (
      window.localStorage.getItem("vf_email") ||
      window.sessionStorage.getItem("vf_email") ||
      ""
    )
      .trim()
      .toLowerCase();
  } catch {
    return "";
  }
}

function compressImage(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error("Could not read image file."));

    reader.onload = () => {
      const img = new Image();

      img.onerror = () => reject(new Error("Could not process image file."));

      img.onload = () => {
        const maxSide = 900;
        const ratio = Math.min(1, maxSide / Math.max(img.width, img.height));
        const width = Math.max(1, Math.round(img.width * ratio));
        const height = Math.max(1, Math.round(img.height * ratio));

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not prepare image upload."));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.72));
      };

      img.src = String(reader.result || "");
    };

    reader.readAsDataURL(file);
  });
}

function choiceDefaults(assetType: AssetType): Partial<PainForm> {
  if (assetType === "Commercial") {
    return {
      asset_type: assetType,
      pain_type: "Capital Needed",
      requested_help: "Need lender, operator, buyer, tenant solution, or JV partner.",
    };
  }

  if (assetType === "Land") {
    return {
      asset_type: assetType,
      pain_type: "Zoning / Permit Issue",
      requested_help: "Need builder, developer, entitlement help, zoning support, or land buyer.",
    };
  }

  return {
    asset_type: assetType,
    pain_type: "Distressed Seller",
    requested_help: "Need buyer, lender, contractor, title help, or emergency exit.",
  };
}

export default function PainSubmitPage() {
  const [form, setForm] = useState<PainForm>(initialForm);
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [choiceOpen, setChoiceOpen] = useState(true);
  const [photos, setPhotos] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement | null>(null);

  function update(field: keyof PainForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function chooseAsset(assetType: AssetType) {
    setForm((current) => ({
      ...current,
      ...choiceDefaults(assetType),
    }));
    setChoiceOpen(false);
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;

    const next = Array.from(files).slice(0, Math.max(0, 6 - photos.length));

    try {
      setStatus("Compressing photos...");
      const urls = await Promise.all(next.map(compressImage));
      setPhotos((current) => [...current, ...urls].slice(0, 6));
      setStatus(`${urls.length} photo${urls.length === 1 ? "" : "s"} ready.`);
    } catch (error: any) {
      setStatus(error?.message || "Could not upload image preview.");
    }
  }

  async function submitSignal() {
    setStatus("");

    if (!form.description.trim()) {
      setStatus("Describe the problem before routing it.");
      return;
    }

    setSaving(true);

    try {
      const email = getEmail();

      const response = await fetch("/api/pain/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-vf-email": email,
        },
        body: JSON.stringify({
          ...form,
          member_email: email,
          photo_urls: photos,
          photos,
          image_urls: photos,
          ai_summary: [
            `${form.asset_type} pain signal.`,
            form.bedrooms ? `${form.bedrooms} bedrooms.` : "",
            form.bathrooms ? `${form.bathrooms} bathrooms.` : "",
            form.sqft ? `${form.sqft} sqft.` : "",
            form.units ? `${form.units} units.` : "",
            form.acres ? `${form.acres} acres.` : "",
            form.zoning ? `Zoning: ${form.zoning}.` : "",
            form.road_access ? `Road access: ${form.road_access}.` : "",
          ].filter(Boolean).join(" "),
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || data?.ok === false) {
        throw new Error(data?.error || data?.details || "Could not route distress signal.");
      }

      setStatus("Distress signal routed into VaultForge.");
      setForm(initialForm);
      setPhotos([]);
      setChoiceOpen(true);
    } catch (error: any) {
      setStatus(error?.message || "Could not route distress signal.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main style={page}>
      <style>{`
        input::placeholder,
        textarea::placeholder {
          color: rgba(255,255,255,.42);
        }

        a:hover,
        button:hover {
          transform: translateY(-1px);
          transition: all .18s ease;
          filter: brightness(1.06);
        }

        @media (max-width: 760px) {
          a,
          button {
            width: 100%;
            box-sizing: border-box;
          }
        }
      `}</style>

      <div style={wrap}>
        {choiceOpen && (
          <section style={{ ...hero, borderColor: "rgba(157,243,191,.45)" }}>
            <div style={eyebrow}>Choose Signal Type</div>
            <h1 style={{ fontSize: "clamp(44px,10vw,78px)", lineHeight: 0.92, margin: "0 0 16px" }}>
              What kind of problem are we routing?
            </h1>
            <p style={muted}>
              Pick Residential, Commercial, or Land. The Pain Button will open the right fields for that asset class.
            </p>

            <section style={grid}>
              <button type="button" onClick={() => chooseAsset("Residential")} style={activeChoice}>
                Residential
              </button>
              <button type="button" onClick={() => chooseAsset("Commercial")} style={inactiveChoice}>
                Commercial
              </button>
              <button type="button" onClick={() => chooseAsset("Land")} style={inactiveChoice}>
                Land
              </button>
            </section>
          </section>
        )}

        <section style={hero}>
          <div style={eyebrow}>Pain Button · {form.asset_type}</div>
          <h1 style={{ fontSize: "clamp(52px,12vw,96px)", lineHeight: 0.9, margin: "0 0 18px" }}>
            Route the problem.
          </h1>
          <p style={{ ...muted, fontSize: 20 }}>
            Submit seller distress, capital gaps, contractor issues, title problems, zoning problems,
            stalled projects, or emergency liquidation signals into VaultForge.
          </p>

          <button type="button" style={ghost} onClick={() => setChoiceOpen(true)}>
            Change Type
          </button>
          <Link href="/dashboard" style={ghost}>Dashboard</Link>
          <Link href="/pain" style={ghost}>Pain Feed</Link>
          <Link href="/routing" style={ghost}>Routing</Link>
        </section>

        <section style={panel}>
          <div style={eyebrow}>Signal Type</div>
          <div style={grid}>
            <div>
              <label style={label}>Pain Type</label>
              <select
                value={form.pain_type}
                onChange={(event) => update("pain_type", event.target.value)}
                style={input}
              >
                <option style={{ color: "#111" }}>Distressed Seller</option>
                <option style={{ color: "#111" }}>Capital Needed</option>
                <option style={{ color: "#111" }}>Stalled Project</option>
                <option style={{ color: "#111" }}>Contractor Issue</option>
                <option style={{ color: "#111" }}>Title Problem</option>
                <option style={{ color: "#111" }}>Zoning / Permit Issue</option>
                <option style={{ color: "#111" }}>Need Operator Match</option>
                <option style={{ color: "#111" }}>Emergency Liquidation</option>
                <option style={{ color: "#111" }}>Dead Wholesale Deal</option>
              </select>
            </div>

            <div>
              <label style={label}>Urgency</label>
              <select
                value={form.urgency_level}
                onChange={(event) => update("urgency_level", event.target.value)}
                style={input}
              >
                <option style={{ color: "#111" }}>Normal</option>
                <option style={{ color: "#111" }}>Medium</option>
                <option style={{ color: "#111" }}>High</option>
                <option style={{ color: "#111" }}>Urgent</option>
                <option style={{ color: "#111" }}>Emergency</option>
              </select>
            </div>
          </div>
        </section>

        <section style={panel}>
          <div style={eyebrow}>Problem Details</div>

          <div style={{ marginBottom: 14 }}>
            <label style={label}>Title</label>
            <input
              value={form.title}
              onChange={(event) => update("title", event.target.value)}
              placeholder="Example: Stalled flip needs capital"
              style={input}
            />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={label}>What is happening?</label>
            <textarea
              value={form.description}
              onChange={(event) => update("description", event.target.value)}
              placeholder="Explain the pressure, timeline, and problem."
              style={{ ...input, minHeight: 150, resize: "vertical" }}
            />
          </div>

          <div>
            <label style={label}>Requested Help</label>
            <textarea
              value={form.requested_help}
              onChange={(event) => update("requested_help", event.target.value)}
              placeholder="Need lender, buyer, operator, contractor, title help, JV partner, or emergency exit."
              style={{ ...input, minHeight: 100, resize: "vertical" }}
            />
          </div>
        </section>

        <section style={panel}>
          <div style={eyebrow}>{form.asset_type} Fields</div>

          <div style={grid}>
            {form.asset_type === "Residential" && (
              <>
                <div>
                  <label style={label}>Bedrooms</label>
                  <input value={form.bedrooms} onChange={(event) => update("bedrooms", event.target.value)} style={input} />
                </div>
                <div>
                  <label style={label}>Bathrooms</label>
                  <input value={form.bathrooms} onChange={(event) => update("bathrooms", event.target.value)} style={input} />
                </div>
                <div>
                  <label style={label}>Sqft</label>
                  <input value={form.sqft} onChange={(event) => update("sqft", event.target.value)} style={input} />
                </div>
              </>
            )}

            {form.asset_type === "Commercial" && (
              <>
                <div>
                  <label style={label}>Units / Suites</label>
                  <input value={form.units} onChange={(event) => update("units", event.target.value)} style={input} />
                </div>
                <div>
                  <label style={label}>NOI</label>
                  <input value={form.noi} onChange={(event) => update("noi", event.target.value)} style={input} />
                </div>
                <div>
                  <label style={label}>Cap Rate</label>
                  <input value={form.cap_rate} onChange={(event) => update("cap_rate", event.target.value)} style={input} />
                </div>
              </>
            )}

            {form.asset_type === "Land" && (
              <>
                <div>
                  <label style={label}>Acres</label>
                  <input value={form.acres} onChange={(event) => update("acres", event.target.value)} style={input} />
                </div>
                <div>
                  <label style={label}>Zoning</label>
                  <input value={form.zoning} onChange={(event) => update("zoning", event.target.value)} style={input} />
                </div>
                <div>
                  <label style={label}>Road Access</label>
                  <input value={form.road_access} onChange={(event) => update("road_access", event.target.value)} style={input} />
                </div>
              </>
            )}
          </div>
        </section>

        <section style={panel}>
          <div style={eyebrow}>Property / Market Context</div>
          <div style={grid}>
            <div>
              <label style={label}>Address / Area</label>
              <input
                value={form.property_address}
                onChange={(event) => update("property_address", event.target.value)}
                placeholder="Address or area"
                style={input}
              />
            </div>

            <div>
              <label style={label}>City</label>
              <input value={form.city} onChange={(event) => update("city", event.target.value)} placeholder="City" style={input} />
            </div>

            <div>
              <label style={label}>State</label>
              <input value={form.state} onChange={(event) => update("state", event.target.value)} placeholder="State" style={input} />
            </div>

            <div>
              <label style={label}>Zip Code</label>
              <input value={form.zip_code} onChange={(event) => update("zip_code", event.target.value)} placeholder="Zip" style={input} />
            </div>
          </div>
        </section>

        <section style={panel}>
          <div style={eyebrow}>Numbers</div>
          <div style={grid}>
            <div>
              <label style={label}>Capital Needed</label>
              <input value={form.capital_needed} onChange={(event) => update("capital_needed", event.target.value)} placeholder="50000" inputMode="numeric" style={input} />
            </div>

            <div>
              <label style={label}>Estimated Value</label>
              <input value={form.estimated_value} onChange={(event) => update("estimated_value", event.target.value)} placeholder="250000" inputMode="numeric" style={input} />
            </div>

            <div>
              <label style={label}>Estimated Repairs</label>
              <input value={form.estimated_repairs} onChange={(event) => update("estimated_repairs", event.target.value)} placeholder="35000" inputMode="numeric" style={input} />
            </div>
          </div>
        </section>

        <section style={panel}>
          <div style={eyebrow}>Photo Upload</div>
          <p style={muted}>
            Add up to 6 photos. Photos are compressed before saving so they can display in the Pain Feed.
          </p>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(event) => handleFiles(event.target.files)}
            style={{ display: "none" }}
          />

          <button type="button" onClick={() => fileRef.current?.click()} style={btn}>
            Upload Photos
          </button>

          {photos.length > 0 && (
            <section style={{ ...grid, marginTop: 14 }}>
              {photos.map((src, index) => (
                <div key={`${src.slice(0, 20)}-${index}`}>
                  <img src={src} alt={`Pain upload ${index + 1}`} style={{ width: "100%", height: 150, objectFit: "cover", borderRadius: 18, border: "1px solid rgba(255,255,255,.14)" }} />
                  <button
                    type="button"
                    onClick={() => setPhotos((current) => current.filter((_, i) => i !== index))}
                    style={ghost}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </section>
          )}
        </section>

        <section style={panel}>
          <div style={eyebrow}>Submit</div>
          <p style={muted}>
            This creates a live record in vf_pain_submissions and also creates routing/activity records when possible.
          </p>

          <button type="button" onClick={submitSignal} disabled={saving} style={btn}>
            {saving ? "Routing..." : "Route Distress Signal"}
          </button>

          {status && (
            <p style={{ color: status.toLowerCase().includes("routed") || status.toLowerCase().includes("ready") ? "#9df3bf" : "#ffd0d0", fontWeight: 950 }}>
              {status}
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
