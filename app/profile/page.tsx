"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const PROFILE_BUCKET = "profile-photo";

const states = [
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

const memberTypes = [
  "Buyer",
  "Lender",
  "Contractor",
  "Wholesaler",
  "Developer",
  "Operator",
  "Deal Source",
  "Investor",
];

const alertTypeOptions = [
  "New deal in my market",
  "Deal matches my buy box",
  "Someone saves my deal",
  "Someone messages me",
  "Funding needed",
  "JV needed",
  "Contractor/operator needed",
  "Price drop or status change",
];

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(232,196,107,.16), transparent 30%), radial-gradient(circle at top right, rgba(157,243,191,.10), transparent 28%), linear-gradient(180deg,#030509,#071326 55%,#030509)",
  color: "white",
  padding: "28px 18px 90px",
  fontFamily: "Arial, sans-serif",
};

const wrap: React.CSSProperties = { maxWidth: 980, margin: "0 auto" };

const hero: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.30)",
  background: "linear-gradient(135deg, rgba(255,255,255,.075), rgba(255,255,255,.025))",
  borderRadius: 34,
  padding: 26,
  marginBottom: 22,
  boxShadow: "0 30px 90px rgba(0,0,0,.38)",
};

const pane: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.13)",
  background: "rgba(255,255,255,.04)",
  borderRadius: 28,
  padding: 22,
  marginBottom: 18,
};

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
  gap: 14,
};

const btn: React.CSSProperties = {
  display: "inline-block",
  background: "#f5d978",
  color: "#06100a",
  textDecoration: "none",
  borderRadius: 999,
  padding: "14px 20px",
  fontWeight: 950,
  border: "none",
  margin: "7px 7px 0 0",
  cursor: "pointer",
};

const ghost: React.CSSProperties = {
  display: "inline-block",
  color: "white",
  textDecoration: "none",
  borderRadius: 999,
  padding: "14px 20px",
  fontWeight: 900,
  border: "1px solid rgba(255,255,255,.18)",
  background: "rgba(255,255,255,.04)",
  margin: "7px 7px 0 0",
};

const input: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  borderRadius: 18,
  border: "1px solid rgba(255,255,255,.18)",
  background: "rgba(255,255,255,.075)",
  color: "white",
  padding: 14,
  fontSize: 16,
};

const label: React.CSSProperties = {
  display: "block",
  fontWeight: 900,
  margin: "0 0 8px",
};

const eyebrow: React.CSSProperties = {
  color: "#e8c46b",
  letterSpacing: 5,
  fontWeight: 900,
  fontSize: 12,
  marginBottom: 12,
  textTransform: "uppercase",
};

const muted: React.CSSProperties = {
  color: "rgba(255,255,255,.70)",
  lineHeight: 1.55,
  fontSize: 17,
};

function getEmail() {
  if (typeof window === "undefined") return "";
  return (
    localStorage.getItem("vf_email") ||
    sessionStorage.getItem("vf_email") ||
    ""
  )
    .trim()
    .toLowerCase();
}

function splitList(value: any) {
  if (Array.isArray(value)) return value.join(", ");
  return String(value || "");
}

function arrayValue(value: any): string[] {
  if (Array.isArray(value)) return value.map(String);

  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch {}

    return value
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
  }

  return [];
}

function completionScore(form: Record<string, any>) {
  const required = ["email", "full_name", "phone", "role", "city", "state"];
  const done = required.filter((key) => String(form[key] || "").trim()).length;
  return Math.round((done / required.length) * 100);
}

function safeFileName(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function fileExtension(file: File) {
  const name = file.name || "";
  const ext = name.includes(".") ? name.split(".").pop() || "" : "";

  if (ext) return ext.toLowerCase();
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  if (file.type === "image/gif") return "gif";

  return "jpg";
}

function supabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    "";

  if (!url || !key) {
    throw new Error("Supabase public environment values are missing.");
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export default function ProfilePage() {
  const [form, setForm] = useState<Record<string, any>>({
    email: "",
    full_name: "",
    phone: "",
    company: "",
    role: "",
    city: "",
    state: "Georgia",
    markets: "",
    member_types: "",
    buy_box: "",
    funding_capacity: "",
    strategy: "",
    profile_photo_url: "",
    alert_frequency: "daily_digest",
    max_alerts_per_day: "10",
    alert_types: [
      "Deal matches my buy box",
      "Someone messages me",
      "Funding needed",
    ],
  });

  const [status, setStatus] = useState("Loading profile...");
  const [saving, setSaving] = useState(false);
  const [complete, setComplete] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const progress = useMemo(() => completionScore(form), [form]);

  function update(key: string, value: any) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function toggleAlertType(type: string) {
    const current: string[] = Array.isArray(form.alert_types)
      ? form.alert_types
      : [];

    if (current.includes(type)) {
      update(
        "alert_types",
        current.filter((item) => item !== type)
      );
    } else {
      update("alert_types", [...current, type]);
    }
  }

  async function uploadProfilePhoto(file: File) {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setStatus("Choose an image file for your profile photo.");
      return;
    }

    const maxSize = 6 * 1024 * 1024;

    if (file.size > maxSize) {
      setStatus("Profile photo is too large. Use an image under 6MB.");
      return;
    }

    setUploadingPhoto(true);
    setStatus("Uploading profile photo...");

    try {
      const email = form.email || getEmail();

      if (!email || !email.includes("@")) {
        throw new Error("Add your email before uploading a profile photo.");
      }

      const supabase = supabaseBrowserClient();
      const ext = fileExtension(file);
      const cleanBase = safeFileName(email.split("@")[0] || "member");
      const path = `${safeFileName(email)}/${cleanBase}-${Date.now()}.${ext}`;

      const { error } = await supabase.storage
        .from(PROFILE_BUCKET)
        .upload(path, file, {
          cacheControl: "3600",
          upsert: true,
          contentType: file.type || `image/${ext}`,
        });

      if (error) {
        throw new Error(error.message || "Profile photo upload failed.");
      }

      const { data } = supabase.storage.from(PROFILE_BUCKET).getPublicUrl(path);
      const publicUrl = data?.publicUrl || "";

      if (!publicUrl) {
        throw new Error("Could not get public profile photo URL.");
      }

      update("profile_photo_url", publicUrl);
      setStatus("Profile photo uploaded. Click Save Profile to lock it in.");
    } catch (error: any) {
      setStatus(error?.message || "Could not upload profile photo.");
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function loadProfile() {
    setStatus("Loading profile...");

    try {
      const email = getEmail();
      const res = await fetch(`/api/profile/me?email=${encodeURIComponent(email)}`, {
        cache: "no-store",
        headers: { "x-vf-email": email },
      });

      const data = await res.json();
      const profile = data?.profile || {};

      setForm({
        email: profile.email || email,
        full_name: profile.full_name || profile.fullName || profile.name || "",
        phone: profile.phone || "",
        company: profile.company || "",
        role: profile.role || profile.member_role || "",
        city: profile.city || "",
        state: profile.state || "Georgia",
        markets: splitList(profile.markets),
        member_types: splitList(profile.member_types || profile.memberTypes),
        buy_box: profile.buy_box || profile.buyBox || "",
        funding_capacity: profile.funding_capacity || profile.fundingCapacity || "",
        strategy: profile.strategy || "",
        profile_photo_url: profile.profile_photo_url || profile.profilePhotoUrl || "",
        alert_frequency: profile.alert_frequency || "daily_digest",
        max_alerts_per_day: String(profile.max_alerts_per_day || 10),
        alert_types: arrayValue(profile.alert_types).length
          ? arrayValue(profile.alert_types)
          : ["Deal matches my buy box", "Someone messages me", "Funding needed"],
      });

      setComplete(Boolean(profile.profile_complete));
      setStatus("");
    } catch (error: any) {
      setStatus(error?.message || "Could not load profile.");
    }
  }

  async function saveProfile() {
    setSaving(true);
    setStatus("Saving profile...");

    try {
      const email = form.email || getEmail();
      const res = await fetch("/api/profile/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-vf-email": email,
        },
        body: JSON.stringify({
          ...form,
          email,
          markets: form.markets,
          member_types: form.member_types,
          alert_types: form.alert_types,
          max_alerts_per_day: Number(form.max_alerts_per_day || 10),
        }),
      });

      const data = await res.json();

      if (!res.ok || data?.error) {
        throw new Error(data?.error || data?.details || "Profile save failed.");
      }

      setComplete(Boolean(data?.profile_complete));
      setStatus(
        data?.profile_complete
          ? "Profile complete. Payment step is ready."
          : "Profile saved. Complete required fields to unlock payment step."
      );

      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error: any) {
      setStatus(error?.message || "Could not save profile.");
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    loadProfile();
  }, []);

  return (
    <main style={page}>
      <div style={wrap}>
        <section style={hero}>
          <div style={eyebrow}>Member Profile</div>
          <h1
            style={{
              fontSize: "clamp(54px, 12vw, 96px)",
              lineHeight: 0.88,
              margin: "0 0 18px",
            }}
          >
            Profile, routing, alerts.
          </h1>
          <p style={{ ...muted, fontSize: 20 }}>
            Your profile controls member type, markets, buy box, routing, and alert volume.
          </p>
          <Link href="/dashboard" style={ghost}>Dashboard</Link>
          <Link href="/payment" style={ghost}>Payment</Link>
          <Link href="/logout" style={ghost}>Logout</Link>
        </section>

        <section
          style={{
            ...pane,
            borderColor: complete
              ? "rgba(157,243,191,.45)"
              : "rgba(232,196,107,.35)",
          }}
        >
          <div style={eyebrow}>Profile Progress</div>
          <h2 style={{ fontSize: 34, margin: "0 0 12px" }}>
            {complete ? "Complete ✓" : `${progress}% complete`}
          </h2>
          <div
            style={{
              width: "100%",
              height: 14,
              borderRadius: 999,
              background: "rgba(255,255,255,.08)",
              overflow: "hidden",
              marginBottom: 14,
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: "100%",
                background: complete ? "#9df3bf" : "#f5d978",
              }}
            />
          </div>
          {status && (
            <p
              style={{
                margin: 0,
                color: complete ? "#9df3bf" : "#e8c46b",
                fontWeight: 900,
              }}
            >
              {status}
            </p>
          )}
          {complete && <Link href="/payment" style={btn}>Continue to Payment</Link>}
        </section>

        <section style={pane}>
          <div style={eyebrow}>Required Fields</div>
          <p style={muted}>
            Required to move into payment-ready status: name, phone, role, city, state, and email.
          </p>
          <div style={grid}>
            <Field label="Email" value={form.email} onChange={(v) => update("email", v)} />
            <Field label="Full Name" value={form.full_name} onChange={(v) => update("full_name", v)} />
            <Field label="Phone" value={form.phone} onChange={(v) => update("phone", v)} />
            <Field label="Company" value={form.company} onChange={(v) => update("company", v)} />
            <Field
              label="Primary Role"
              value={form.role}
              onChange={(v) => update("role", v)}
              placeholder="Buyer, lender, investor, contractor..."
            />
            <Field label="City" value={form.city} onChange={(v) => update("city", v)} />
            <Select label="State" value={form.state} onChange={(v) => update("state", v)} options={states} />
          </div>
        </section>

        <section style={pane}>
          <div style={eyebrow}>Network Fit</div>
          <div style={grid}>
            <Select
              label="Primary Member Type"
              value={form.member_types}
              onChange={(v) => update("member_types", v)}
              options={memberTypes}
            />
            <Field
              label="Markets"
              value={form.markets}
              onChange={(v) => update("markets", v)}
              placeholder="Atlanta, Nashville, Tampa..."
            />
            <Field
              label="Buy Box / Focus"
              value={form.buy_box}
              onChange={(v) => update("buy_box", v)}
              placeholder="SFR flips, land, commercial..."
            />
            <Field
              label="Funding Capacity"
              value={form.funding_capacity}
              onChange={(v) => update("funding_capacity", v)}
              placeholder="$250k, $1M+, private lending..."
            />
          </div>
          <div style={{ marginTop: 14 }}>
            <Text label="Strategy / What You Need" value={form.strategy} onChange={(v) => update("strategy", v)} />
          </div>
        </section>

        <section style={pane}>
          <div style={eyebrow}>Alert Preferences</div>
          <p style={muted}>
            Control how loud VaultForge gets. Messages stay important, but deal/match alerts should match your appetite.
          </p>

          <div style={grid}>
            <Select
              label="Alert Frequency"
              value={form.alert_frequency}
              onChange={(v) => update("alert_frequency", v)}
              options={["instant", "daily_digest", "weekly_digest", "off"]}
            />
            <Select
              label="Max Alerts Per Day"
              value={String(form.max_alerts_per_day)}
              onChange={(v) => update("max_alerts_per_day", v)}
              options={["0", "3", "5", "10", "25"]}
            />
          </div>

          <div style={{ marginTop: 16 }}>
            <div style={label}>Alert Types</div>
            <div style={{ display: "grid", gap: 10 }}>
              {alertTypeOptions.map((type) => {
                const checked =
                  Array.isArray(form.alert_types) && form.alert_types.includes(type);

                return (
                  <label
                    key={type}
                    style={{
                      border: checked
                        ? "1px solid rgba(157,243,191,.45)"
                        : "1px solid rgba(255,255,255,.13)",
                      background: checked
                        ? "rgba(157,243,191,.08)"
                        : "rgba(255,255,255,.035)",
                      borderRadius: 18,
                      padding: 14,
                      cursor: "pointer",
                      fontWeight: 800,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleAlertType(type)}
                      style={{ marginRight: 10 }}
                    />
                    {type}
                  </label>
                );
              })}
            </div>
          </div>
        </section>

        <section style={pane}>
          <div style={eyebrow}>Profile Photo</div>
          <p style={muted}>
            Upload a profile photo from your device. After upload, click Save Profile to store it with your member profile.
          </p>

          {form.profile_photo_url && (
            <div style={{ marginBottom: 16 }}>
              <img
                src={form.profile_photo_url}
                alt="Profile preview"
                style={{
                  width: 150,
                  height: 150,
                  borderRadius: 999,
                  objectFit: "cover",
                  border: "2px solid rgba(157,243,191,.50)",
                  display: "block",
                  marginBottom: 12,
                }}
              />
            </div>
          )}

          <input
            type="file"
            accept="image/*"
            disabled={uploadingPhoto}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) uploadProfilePhoto(file);
              event.currentTarget.value = "";
            }}
            style={{
              ...input,
              cursor: uploadingPhoto ? "not-allowed" : "pointer",
              opacity: uploadingPhoto ? 0.7 : 1,
            }}
          />

          <p style={{ ...muted, fontSize: 14, marginTop: 10 }}>
            {uploadingPhoto ? "Uploading..." : "Accepted: JPG, PNG, WEBP, GIF under 6MB."}
          </p>
        </section>

        <button
          type="button"
          onClick={saveProfile}
          disabled={saving || uploadingPhoto}
          style={{
            ...btn,
            width: "100%",
            fontSize: 22,
            padding: 18,
            opacity: saving || uploadingPhoto ? 0.65 : 1,
          }}
        >
          {saving ? "Saving Profile..." : uploadingPhoto ? "Uploading Photo..." : "Save Profile"}
        </button>
      </div>
    </main>
  );
}

function Field({
  label: labelText,
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
      <label style={label}>{labelText}</label>
      <input
        style={input}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

function Select({
  label: labelText,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div>
      <label style={label}>{labelText}</label>
      <select
        style={input}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="" style={{ color: "#111" }}>Select</option>
        {options.map((option) => (
          <option key={option} value={option} style={{ color: "#111" }}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

function Text({
  label: labelText,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label style={label}>{labelText}</label>
      <textarea
        style={{ ...input, minHeight: 130, resize: "vertical" }}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
