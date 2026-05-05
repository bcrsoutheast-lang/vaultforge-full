"use client";

import { useRef, useState } from "react";
import Link from "next/link";

const page: React.CSSProperties = {
  minHeight: "100vh",
  background: "linear-gradient(180deg,#06100a,#102015,#06100a)",
  color: "white",
  padding: "28px 18px 90px",
  fontFamily: "Arial",
};

const wrap = { maxWidth: 1100, margin: "0 auto" };

const card = {
  border: "1px solid rgba(232,196,107,.28)",
  background: "rgba(255,255,255,.045)",
  borderRadius: 30,
  padding: 22,
  marginBottom: 20,
};

const btn = {
  background: "#f5d978",
  color: "#06100a",
  border: "none",
  borderRadius: 999,
  padding: "14px 20px",
  fontWeight: 900,
  cursor: "pointer",
};

const ghost = {
  background: "rgba(255,255,255,.04)",
  color: "white",
  border: "1px solid rgba(255,255,255,.18)",
  borderRadius: 999,
  padding: "14px 20px",
  fontWeight: 900,
  cursor: "pointer",
};

const input = {
  width: "100%",
  borderRadius: 18,
  border: "1px solid rgba(255,255,255,.18)",
  background: "rgba(255,255,255,.075)",
  color: "white",
  padding: 14,
};

function getEmail() {
  return (
    localStorage.getItem("vf_email") ||
    sessionStorage.getItem("vf_email") ||
    ""
  );
}

export default function SubmitPage() {
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    title: "",
    city: "",
  });

  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);

  const [success, setSuccess] = useState(false);
  const [dealId, setDealId] = useState("");

  function set(k: string, v: string) {
    setForm((x: any) => ({ ...x, [k]: v }));
  }

  async function submit() {
    if (busy) return;

    setBusy(true);
    setSuccess(false);

    try {
      const email = getEmail();

      if (!form.title || !form.city) {
        throw new Error("Missing fields");
      }

      const payload = {
        ...form,
        owner_email: email,
      };

      const res = await fetch("/api/deal/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) throw new Error("Save failed");

      // ✅ SUCCESS STATE
      setSuccess(true);
      setDealId(data?.deal?.id || "");

      // clear form AFTER success is set
      setForm({ title: "", city: "" });
      setFiles([]);

      window.scrollTo({ top: 0, behavior: "smooth" });

    } catch (e) {
      alert("Save failed");
    }

    setBusy(false);
  }

  return (
    <main style={page}>
      <div style={wrap}>

        {/* ✅ SUCCESS CARD (PERSISTENT) */}
        {success && (
          <section style={card}>
            <h2 style={{ color: "#9df3bf" }}>Deal Saved Successfully</h2>

            <div style={{ marginTop: 10 }}>
              {dealId && (
                <Link href={`/deal/${dealId}`} style={btn}>
                  Open Deal Room
                </Link>
              )}

              <button
                type="button"
                style={{ ...ghost, marginLeft: 10 }}
                onClick={() => setSuccess(false)}
              >
                Create Another
              </button>
            </div>
          </section>
        )}

        <section style={card}>
          <h1>Create Deal</h1>

          <div style={{ marginTop: 20 }}>
            <input
              style={input}
              placeholder="Deal Title"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
            />
          </div>

          <div style={{ marginTop: 10 }}>
            <input
              style={input}
              placeholder="City"
              value={form.city}
              onChange={(e) => set("city", e.target.value)}
            />
          </div>

          <div style={{ marginTop: 20 }}>
            <button
              type="button"
              style={{ ...btn, opacity: busy ? 0.6 : 1 }}
              onClick={submit}
              disabled={busy}
            >
              {busy ? "Saving..." : "Submit Deal"}
            </button>
          </div>
        </section>

      </div>
    </main>
  );
}
