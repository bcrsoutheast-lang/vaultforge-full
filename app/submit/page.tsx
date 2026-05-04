"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

type PropertyType = "Residential" | "Commercial" | "Land";

type FormState = {
  title: string;
  property_type: PropertyType;
  strategy: string;
  city: string;
  state: string;
  address: string;
  asking_price: string;
  arv: string;
  repairs: string;
  beds: string;
  baths: string;
  sqft: string;
  lot_size: string;
  description: string;
  seller_name: string;
  seller_phone: string;
  seller_email: string;
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  "";

const PHOTO_BUCKET = "deal-photos";

const initialForm: FormState = {
  title: "",
  property_type: "Residential",
  strategy: "Fix & Flip",
  city: "",
  state: "",
  address: "",
  asking_price: "",
  arv: "",
  repairs: "",
  beds: "",
  baths: "",
  sqft: "",
  lot_size: "",
  description: "",
  seller_name: "",
  seller_phone: "",
  seller_email: "",
};

function getStoredEmail() {
  if (typeof window === "undefined") return "";
  return (
    window.localStorage.getItem("vf_email") ||
    window.localStorage.getItem("vf_member_email") ||
    window.localStorage.getItem("email") ||
    ""
  );
}

function cleanNumber(value: string) {
  const cleaned = String(value || "").replace(/[$,\s]/g, "");
  if (!cleaned) return null;
  const number = Number(cleaned);
  return Number.isFinite(number) ? number : null;
}

function safeFileName(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "photo.jpg";
}

function makeSupabase() {
  if (!SUPABASE_URL || !SUPABASE_KEY) return null;
  return createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default function SubmitPage() {
  const supabase = useMemo(() => makeSupabase(), []);
  const [form, setForm] = useState<FormState>(initialForm);
  const [photos, setPhotos] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handlePhotos(files: FileList | null) {
    setError("");
    setMessage("");

    const picked = Array.from(files || []).filter((file) =>
      file.type.startsWith("image/")
    );

    const limited = picked.slice(0, 10);
    setPhotos(limited);

    previewUrls.forEach((url) => URL.revokeObjectURL(url));
    setPreviewUrls(limited.map((file) => URL.createObjectURL(file)));

    if (picked.length > 10) {
      setMessage("Only the first 10 photos were selected.");
    }
  }

  async function uploadPhotos(dealId: string) {
    if (!supabase) throw new Error("Missing Supabase environment variables.");

    const uploadedUrls: string[] = [];

    for (const file of photos) {
      const path = `${dealId}/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}-${safeFileName(file.name)}`;

      const { error: uploadError } = await supabase.storage
        .from(PHOTO_BUCKET)
        .upload(path, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type || "image/jpeg",
        });

      if (uploadError) {
        throw new Error(uploadError.message || "Photo upload failed.");
      }

      const { data } = supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path);
      if (data?.publicUrl) uploadedUrls.push(data.publicUrl);
    }

    return uploadedUrls;
  }

  async function submitDeal(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      if (!supabase) {
        throw new Error("Missing Supabase URL/key in Vercel environment variables.");
      }

      if (!form.title.trim()) throw new Error("Deal title is required.");
      if (!form.property_type) throw new Error("Property type is required.");
      if (!form.city.trim()) throw new Error("City is required.");
      if (!form.state.trim()) throw new Error("State is required.");
      if (photos.length < 1) throw new Error("Upload at least 1 photo to test. Later we can require 5.");

      const dealId = crypto.randomUUID();
      const ownerEmail = getStoredEmail();
      const uploadedPhotoUrls = await uploadPhotos(dealId);

      const payload = {
        id: dealId,
        owner_email: ownerEmail || null,
        title: form.title.trim(),
        property_type: form.property_type,
        strategy: form.strategy || null,
        city: form.city.trim(),
        state: form.state.trim(),
        address: form.address.trim() || null,
        asking_price: cleanNumber(form.asking_price),
        arv: cleanNumber(form.arv),
        repairs: cleanNumber(form.repairs),
        beds: cleanNumber(form.beds),
        baths: cleanNumber(form.baths),
        sqft: cleanNumber(form.sqft),
        lot_size: form.lot_size.trim() || null,
        description: form.description.trim() || null,
        seller_name: form.seller_name.trim() || null,
        seller_phone: form.seller_phone.trim() || null,
        seller_email: form.seller_email.trim() || null,
        status: "active",
        photo_urls: uploadedPhotoUrls,
        main_photo_url: uploadedPhotoUrls[0] || null,
        updated_at: new Date().toISOString(),
      };

      const { error: insertError } = await supabase.from("vf_deals").insert(payload);

      if (insertError) {
        throw new Error(insertError.message || "Deal save failed.");
      }

      setMessage("Deal saved with photos. Check Projects / Deal View now.");
      setForm(initialForm);
      setPhotos([]);
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
      setPreviewUrls([]);
    } catch (err: any) {
      setError(err?.message || "Something went wrong saving the deal.");
    } finally {
      setSaving(false);
    }
  }

  const typeHelp =
    form.property_type === "Residential"
      ? "Single family, condo, duplex, small multifamily."
      : form.property_type === "Commercial"
      ? "Retail, office, industrial, mixed-use, larger multifamily."
      : "Lots, acreage, infill land, development parcels.";

  return (
    <main style={styles.page}>
      <section style={styles.shell}>
        <div style={styles.topBar}>
          <Link href="/dashboard" style={styles.backLink}>← Dashboard</Link>
          <Link href="/projects" style={styles.backLink}>Projects</Link>
        </div>

        <section style={styles.heroCard}>
          <p style={styles.eyebrow}>VaultForge Deal Room</p>
          <h1 style={styles.title}>Create a real opportunity.</h1>
          <p style={styles.subtitle}>
            Submit structured residential, commercial, or land opportunities with real uploaded photos.
          </p>
        </section>

        {error ? <div style={styles.errorBox}>{error}</div> : null}
        {message ? <div style={styles.successBox}>{message}</div> : null}

        <form onSubmit={submitDeal} style={styles.form}>
          <section style={styles.card}>
            <p style={styles.sectionLabel}>Photos</p>
            <h2 style={styles.cardTitle}>Upload deal photos</h2>
            <p style={styles.helpText}>
              Tap the upload field below. It should open your phone photo picker. Current test minimum: 1 photo.
            </p>

            <label style={styles.uploadBox}>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(event) => handlePhotos(event.target.files)}
                style={styles.fileInput}
              />
              <span style={styles.uploadTitle}>Tap to choose photos</span>
              <span style={styles.uploadSub}>Selected photos: {photos.length} / 10</span>
            </label>

            {previewUrls.length ? (
              <div style={styles.previewGrid}>
                {previewUrls.map((url, index) => (
                  <img key={url} src={url} alt={`Selected photo ${index + 1}`} style={styles.previewImage} />
                ))}
              </div>
            ) : null}
          </section>

          <section style={styles.card}>
            <p style={styles.sectionLabel}>Deal Basics</p>

            <label style={styles.label}>Deal Title *</label>
            <input style={styles.input} value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="ATL off-market flip" />

            <label style={styles.label}>Property Type *</label>
            <select style={styles.input} value={form.property_type} onChange={(e) => update("property_type", e.target.value as PropertyType)}>
              <option>Residential</option>
              <option>Commercial</option>
              <option>Land</option>
            </select>
            <p style={styles.helpText}>{typeHelp}</p>

            <label style={styles.label}>Strategy</label>
            <select style={styles.input} value={form.strategy} onChange={(e) => update("strategy", e.target.value)}>
              <option>Fix & Flip</option>
              <option>Buy & Hold</option>
              <option>Wholesale</option>
              <option>Development</option>
              <option>Rental / DSCR</option>
              <option>JV Needed</option>
              <option>Capital Needed</option>
              <option>Disposition</option>
            </select>

            <div style={styles.twoCol}>
              <div>
                <label style={styles.label}>City *</label>
                <input style={styles.input} value={form.city} onChange={(e) => update("city", e.target.value)} placeholder="Atlanta" />
              </div>
              <div>
                <label style={styles.label}>State *</label>
                <input style={styles.input} value={form.state} onChange={(e) => update("state", e.target.value)} placeholder="GA" />
              </div>
            </div>

            <label style={styles.label}>Address</label>
            <input style={styles.input} value={form.address} onChange={(e) => update("address", e.target.value)} placeholder="Private address / optional" />
          </section>

          <section style={styles.card}>
            <p style={styles.sectionLabel}>Numbers</p>

            <div style={styles.twoCol}>
              <div>
                <label style={styles.label}>Asking Price</label>
                <input style={styles.input} inputMode="numeric" value={form.asking_price} onChange={(e) => update("asking_price", e.target.value)} placeholder="250000" />
              </div>
              <div>
                <label style={styles.label}>ARV</label>
                <input style={styles.input} inputMode="numeric" value={form.arv} onChange={(e) => update("arv", e.target.value)} placeholder="390000" />
              </div>
            </div>

            <label style={styles.label}>Repairs</label>
            <input style={styles.input} inputMode="numeric" value={form.repairs} onChange={(e) => update("repairs", e.target.value)} placeholder="65000" />

            {form.property_type === "Residential" ? (
              <div style={styles.twoCol}>
                <div>
                  <label style={styles.label}>Beds</label>
                  <input style={styles.input} inputMode="decimal" value={form.beds} onChange={(e) => update("beds", e.target.value)} />
                </div>
                <div>
                  <label style={styles.label}>Baths</label>
                  <input style={styles.input} inputMode="decimal" value={form.baths} onChange={(e) => update("baths", e.target.value)} />
                </div>
              </div>
            ) : null}

            <div style={styles.twoCol}>
              <div>
                <label style={styles.label}>Sq Ft</label>
                <input style={styles.input} inputMode="numeric" value={form.sqft} onChange={(e) => update("sqft", e.target.value)} />
              </div>
              <div>
                <label style={styles.label}>Lot Size</label>
                <input style={styles.input} value={form.lot_size} onChange={(e) => update("lot_size", e.target.value)} placeholder="0.25 acre" />
              </div>
            </div>
          </section>

          <section style={styles.card}>
            <p style={styles.sectionLabel}>Private Context</p>

            <label style={styles.label}>Description</label>
            <textarea style={styles.textarea} value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="Condition, access notes, timeline, seller motivation, deal help needed." />

            <label style={styles.label}>Seller / Contact Name</label>
            <input style={styles.input} value={form.seller_name} onChange={(e) => update("seller_name", e.target.value)} />

            <div style={styles.twoCol}>
              <div>
                <label style={styles.label}>Seller Phone</label>
                <input style={styles.input} value={form.seller_phone} onChange={(e) => update("seller_phone", e.target.value)} />
              </div>
              <div>
                <label style={styles.label}>Seller Email</label>
                <input style={styles.input} type="email" value={form.seller_email} onChange={(e) => update("seller_email", e.target.value)} />
              </div>
            </div>
          </section>

          <button type="submit" disabled={saving} style={saving ? styles.buttonDisabled : styles.button}>
            {saving ? "Saving deal..." : "Save Deal With Photos"}
          </button>
        </form>
      </section>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "radial-gradient(circle at top, #223225 0%, #111713 48%, #080b09 100%)",
    color: "#f6f3ea",
    fontFamily: "Arial, Helvetica, sans-serif",
    padding: "24px 14px 56px",
  },
  shell: {
    width: "100%",
    maxWidth: 980,
    margin: "0 auto",
  },
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 18,
  },
  backLink: {
    color: "#f2d487",
    textDecoration: "none",
    border: "1px solid rgba(242,212,135,.35)",
    borderRadius: 999,
    padding: "10px 14px",
    fontWeight: 800,
  },
  heroCard: {
    border: "1px solid rgba(255,255,255,.16)",
    background: "rgba(255,255,255,.055)",
    borderRadius: 28,
    padding: "28px 22px",
    marginBottom: 18,
  },
  eyebrow: {
    color: "#f2d487",
    textTransform: "uppercase",
    letterSpacing: 5,
    fontSize: 12,
    fontWeight: 900,
    margin: 0,
  },
  title: {
    fontSize: "clamp(38px, 12vw, 76px)",
    lineHeight: .92,
    margin: "14px 0",
  },
  subtitle: {
    color: "rgba(246,243,234,.72)",
    fontSize: 19,
    lineHeight: 1.55,
    margin: 0,
  },
  form: {
    display: "grid",
    gap: 18,
  },
  card: {
    border: "1px solid rgba(255,255,255,.15)",
    background: "rgba(255,255,255,.06)",
    borderRadius: 24,
    padding: 20,
  },
  sectionLabel: {
    color: "#f2d487",
    textTransform: "uppercase",
    letterSpacing: 5,
    fontSize: 12,
    fontWeight: 900,
    margin: "0 0 12px",
  },
  cardTitle: {
    margin: "0 0 8px",
    fontSize: 24,
  },
  helpText: {
    color: "rgba(246,243,234,.65)",
    fontSize: 14,
    lineHeight: 1.45,
    margin: "8px 0 14px",
  },
  label: {
    display: "block",
    fontWeight: 900,
    margin: "18px 0 8px",
    color: "#f6f3ea",
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid rgba(255,255,255,.18)",
    borderRadius: 18,
    background: "rgba(255,255,255,.1)",
    color: "#fff",
    padding: "16px 16px",
    fontSize: 17,
    outline: "none",
  },
  textarea: {
    width: "100%",
    minHeight: 140,
    boxSizing: "border-box",
    border: "1px solid rgba(255,255,255,.18)",
    borderRadius: 18,
    background: "rgba(255,255,255,.1)",
    color: "#fff",
    padding: "16px 16px",
    fontSize: 17,
    outline: "none",
  },
  twoCol: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 14,
  },
  uploadBox: {
    display: "grid",
    placeItems: "center",
    minHeight: 150,
    border: "2px dashed rgba(242,212,135,.55)",
    borderRadius: 22,
    background: "rgba(242,212,135,.08)",
    cursor: "pointer",
    textAlign: "center",
    padding: 20,
  },
  fileInput: {
    position: "absolute",
    width: 1,
    height: 1,
    opacity: 0,
    pointerEvents: "none",
  },
  uploadTitle: {
    display: "block",
    fontSize: 22,
    fontWeight: 900,
    color: "#f2d487",
  },
  uploadSub: {
    display: "block",
    marginTop: 8,
    color: "rgba(246,243,234,.72)",
    fontWeight: 800,
  },
  previewGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
    gap: 10,
    marginTop: 14,
  },
  previewImage: {
    width: "100%",
    height: 120,
    objectFit: "cover",
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,.15)",
  },
  button: {
    width: "100%",
    border: 0,
    borderRadius: 20,
    background: "linear-gradient(135deg, #f2d487, #d6a735)",
    color: "#151006",
    padding: "18px 18px",
    fontSize: 18,
    fontWeight: 950,
    cursor: "pointer",
  },
  buttonDisabled: {
    width: "100%",
    border: 0,
    borderRadius: 20,
    background: "rgba(255,255,255,.18)",
    color: "rgba(255,255,255,.72)",
    padding: "18px 18px",
    fontSize: 18,
    fontWeight: 950,
  },
  errorBox: {
    border: "1px solid rgba(255,90,90,.45)",
    background: "rgba(255,90,90,.14)",
    color: "#ffd6d6",
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    fontWeight: 800,
  },
  successBox: {
    border: "1px solid rgba(103,255,174,.45)",
    background: "rgba(103,255,174,.12)",
    color: "#baffd6",
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    fontWeight: 800,
  },
};
