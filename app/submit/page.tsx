"use client";

import { useEffect, useRef, useState } from "react";
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

const states = [
  "Georgia","Tennessee","Florida","North Carolina","South Carolina","Texas",
  "Alabama","California","New York","Ohio","Pennsylvania","Other"
];

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "linear-gradient(180deg,#06100a,#102015,#06100a)",
  color: "white",
  padding: "28px 18px 90px",
  fontFamily: "Arial, sans-serif"
};

const wrap: React.CSSProperties = {
  maxWidth: 1100,
  margin: "0 auto"
};

const card: React.CSSProperties = {
  border: "1px solid rgba(232,196,107,.28)",
  background: "rgba(255,255,255,.045)",
  borderRadius: 30,
  padding: 22,
  marginBottom: 20
};

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))",
  gap: 14
};

const btn: React.CSSProperties = {
  background: "#f5d978",
  color: "#06100a",
  border: "none",
  borderRadius: 999,
  padding: "13px 18px",
  fontWeight: 900,
  textDecoration: "none",
  display: "inline-block",
  margin: "6px 6px 0 0",
  cursor: "pointer"
};

const ghost: React.CSSProperties = {
  background: "rgba(255,255,255,.04)",
  color: "white",
  border: "1px solid rgba(255,255,255,.18)",
  borderRadius: 999,
  padding: "13px 18px",
  fontWeight: 900,
  textDecoration: "none",
  display: "inline-block",
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
  padding: 14,
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
  description:""
};

function LockedScreen({
  reason
}: {
  reason: "login" | "profile" | "payment" | "loading";
}) {
  return (
    <main style={page}>
      <div style={wrap}>
        <section style={card}>
          <div style={greenEyebrow}>VAULTFORGE CREATE</div>

          <h1 style={{
            fontSize: "clamp(54px,12vw,96px)",
            lineHeight: .9,
            margin: "0 0 14px"
          }}>
            {reason === "loading"
              ? "Checking access..."
              : reason === "login"
              ? "Create member access first."
              : reason === "profile"
              ? "Complete your profile first."
              : "Activate member access first."}
          </h1>

          <p style={{
            color: "rgba(255,255,255,.7)",
            fontSize: 20,
            lineHeight: 1.5
          }}>
            {reason === "login"
              ? "Login or create member access before submitting opportunities."
              : reason === "profile"
              ? "Your profile trains the routing engine before deal creation is unlocked."
              : reason === "payment"
              ? "Profile complete. Activate member access to unlock live deal creation."
              : "VaultForge is checking your member access."}
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

  const [access, setAccess] = useState<Access | null>(null);
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

        const data = await res.json();

        setAccess(data);

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
        throw new Error("Title and city are required.");
      }

      if (!files.length) {
        throw new Error("Upload at least one photo.");
      }

      setMsg("Uploading photos...");

      const urls = await Promise.all(
        files.map((f) => upload(f, email))
      );

      setMsg("Saving deal...");

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

      setMsg("Deal saved successfully.");

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

  if (lockReason !== "open") {
    return <LockedScreen reason={lockReason} />;
  }

  return (
    <main style={page}>
      <div style={wrap}>
        <section style={card}>
          <div style={greenEyebrow}>VAULTFORGE CREATE</div>

          <h1 style={{
            fontSize: "clamp(52px,12vw,96px)",
            lineHeight: .9,
            margin: "0 0 14px"
          }}>
            Submit a real deal room.
          </h1>

          <p style={{
            color: "rgba(255,255,255,.7)",
            fontSize: 19
          }}>
            Residential, commercial, and land opportunities routed through the member intelligence network.
          </p>

          <Link href="/dashboard" style={ghost}>Dashboard</Link>
          <Link href="/projects" style={btn}>Projects</Link>
          <Link href="/buy-bucket" style={ghost}>Buy Bucket</Link>
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
              onClick={() => set("property_type", t)}
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
                {states.map((s) => (
                  <option key={s} value={s} style={{ color: "#111" }}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <Field label="Address" value={form.address} onChange={(v) => set("address", v)} />
            <Field label="Asking Price" value={form.asking_price} onChange={(v) => set("asking_price", v)} />
            <Field label="ARV / Value" value={form.arv} onChange={(v) => set("arv", v)} />
          </div>
        </section>

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
                  height: 180,
                  objectFit: "cover",
                  borderRadius: 20
                }}
              />
            ))}
          </div>
        </section>

        <section style={card}>
          <div style={eyebrow}>DESCRIPTION</div>

          <textarea
            style={{
              ...input,
              minHeight: 140
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
            fontSize: 22,
            padding: 18,
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
