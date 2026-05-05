"use client";

import { useRef, useState } from "react";
import Link from "next/link";

type DealType = "Residential" | "Commercial" | "Land";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  "";

const BUCKET = "deal-photos";

const states = [
  "Georgia","Tennessee","Florida","North Carolina","South Carolina","Texas",
  "Alabama","California","New York","Ohio","Pennsylvania","Other"
];

const page: React.CSSProperties = {
  minHeight: "100vh",
  background: "linear-gradient(180deg,#06100a,#102015,#06100a)",
  color: "white",
  padding: "28px 18px 90px",
  fontFamily: "Arial"
};

const wrap = { maxWidth: 1100, margin: "0 auto" };
const card = {
  border: "1px solid rgba(232,196,107,.28)",
  background: "rgba(255,255,255,.045)",
  borderRadius: 30,
  padding: 22,
  marginBottom: 20
};

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))",
  gap: 14
};

const btn = {
  background: "#f5d978",
  color: "#06100a",
  border: "none",
  borderRadius: 999,
  padding: "13px 18px",
  fontWeight: 900,
  cursor: "pointer"
};

const ghost = {
  background: "rgba(255,255,255,.04)",
  color: "white",
  border: "1px solid rgba(255,255,255,.18)",
  borderRadius: 999,
  padding: "13px 18px",
  fontWeight: 900,
  cursor: "pointer"
};

const input = {
  width: "100%",
  borderRadius: 18,
  border: "1px solid rgba(255,255,255,.18)",
  background: "rgba(255,255,255,.075)",
  color: "white",
  padding: 14
};

const label = { fontWeight: 900, marginBottom: 8 };

function getEmail() {
  return (
    localStorage.getItem("vf_email") ||
    sessionStorage.getItem("vf_email") ||
    ""
  );
}

function cleanFileName(file: File) {
  return `${Date.now()}-${file.name}`;
}

async function upload(file: File, email: string) {
  const path = `${email}/${cleanFileName(file)}`;

  const res = await fetch(
    `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`,
    {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": file.type,
        "x-upsert": "true"
      },
      body: file
    }
  );

  if (!res.ok) throw new Error("Upload failed");

  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;
}

const empty: any = {
  title: "",
  property_type: "Residential",
  city: "",
  state: "Georgia",
  asking_price: "",
  arv: "",
  description: ""
};

export default function SubmitPage() {
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState(empty);
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  function set(k: string, v: string) {
    setForm((x: any) => ({ ...x, [k]: v }));
  }

  async function submit() {
    if (busy) return;

    setBusy(true);
    setMsg("");

    try {
      const email = getEmail();

      const urls = await Promise.all(
        files.map((f) => upload(f, email))
      );

      const payload = {
        ...form,
        photo_urls: urls,
        main_photo_url: urls[0] || ""
      };

      const res = await fetch("/api/deal/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Save failed");

      setMsg("Deal saved");
      setForm(empty);
      setFiles([]);

    } catch (e: any) {
      setMsg(e.message);
    }

    setBusy(false);
  }

  return (
    <main style={page}>
      <div style={wrap}>

        <section style={card}>
          <h1>Create Deal</h1>
        </section>

        {msg && <section style={card}>{msg}</section>}

        <section style={card}>
          <div style={grid}>
            <Field label="Title" value={form.title} onChange={(v)=>set("title",v)} />
            <Field label="City" value={form.city} onChange={(v)=>set("city",v)} />
            <Field label="Price" value={form.asking_price} onChange={(v)=>set("asking_price",v)} />
          </div>
        </section>

        <section style={card}>
          <TextAreaField
            label="Description"
            value={form.description}
            onChange={(v)=>set("description",v)}
          />
        </section>

        <input
          ref={fileRef}
          type="file"
          multiple
          style={{ display: "none" }}
          onChange={(e)=>setFiles(Array.from(e.target.files||[]))}
        />

        <button onClick={()=>fileRef.current?.click()} style={btn}>
          Upload Photos
        </button>

        <button onClick={submit} disabled={busy} style={btn}>
          {busy ? "Saving..." : "Submit"}
        </button>

      </div>
    </main>
  );
}

function Field({ label: l, value, onChange }: any) {
  return (
    <div>
      <div style={label}>{l}</div>
      <input style={input} value={value} onChange={(e)=>onChange(e.target.value)} />
    </div>
  );
}

function TextAreaField({ label: l, value, onChange }: any) {
  return (
    <div>
      <div style={label}>{l}</div>
      <textarea style={input} value={value} onChange={(e)=>onChange(e.target.value)} />
    </div>
  );
}
