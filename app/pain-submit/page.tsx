"use client";

import { useState } from "react";
import Link from "next/link";

type PainForm = {
  pain_type: string;
  urgency_level: string;
  title: string;
  description: string;
  requested_help: string;
  asset_type: string;
  property_address: string;
  city: string;
  state: string;
  zip_code: string;
  capital_needed: string;
  estimated_value: string;
  estimated_repairs: string;
};

const initialForm: PainForm = {
  pain_type: "Distressed Seller",
  urgency_level: "High",
  title: "",
  description: "",
  requested_help: "",
  asset_type: "",
  property_address: "",
  city: "",
  state: "",
  zip_code: "",
  capital_needed: "",
  estimated_value: "",
  estimated_repairs: "",
};

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(255,120,120,.20), transparent 28%), radial-gradient(circle at top right, rgba(157,243,191,.16), transparent 24%), linear-gradient(180deg,#02040a 0%,#071326 50%,#030509 100%)",
  color: "white",
  padding: "28px 18px 100px",
  fontFamily: "Arial, sans-serif",
};

const wrap: React.CSSProperties = {
  maxWidth: 980,
  margin: "0 auto",
};

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
};

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

export default function PainSubmitPage() {
  const [form, setForm] = useState<PainForm>(initialForm);
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);

  function update(field: keyof PainForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
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
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || data?.ok === false) {
        throw new Error(data?.error || data?.details || "Could not route distress signal.");
      }

      setStatus("Distress signal routed into VaultForge.");
      setForm(initialForm);
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
        <section style={hero}>
          <div style={eyebrow}>Pain Button</div>
          <h1 style={{ fontSize: "clamp(52px,12vw,96px)", lineHeight: 0.9, margin: "0 0 18px" }}>
            Route the problem.
          </h1>
          <p style={{ ...muted, fontSize: 20 }}>
            Submit seller distress, capital gaps, contractor issues, title problems, zoning problems,
            stalled projects, or emergency liquidation signals into VaultForge.
          </p>

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
          <div style={eyebrow}>Property / Market Context</div>
          <div style={grid}>
            <div>
              <label style={label}>Asset Type</label>
              <input
                value={form.asset_type}
                onChange={(event) => update("asset_type", event.target.value)}
                placeholder="Residential, Commercial, Land, Multifamily"
                style={input}
              />
            </div>

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
              <input
                value={form.city}
                onChange={(event) => update("city", event.target.value)}
                placeholder="City"
                style={input}
              />
            </div>

            <div>
              <label style={label}>State</label>
              <input
                value={form.state}
                onChange={(event) => update("state", event.target.value)}
                placeholder="State"
                style={input}
              />
            </div>

            <div>
              <label style={label}>Zip Code</label>
              <input
                value={form.zip_code}
                onChange={(event) => update("zip_code", event.target.value)}
                placeholder="Zip"
                style={input}
              />
            </div>
          </div>
        </section>

        <section style={panel}>
          <div style={eyebrow}>Numbers</div>
          <div style={grid}>
            <div>
              <label style={label}>Capital Needed</label>
              <input
                value={form.capital_needed}
                onChange={(event) => update("capital_needed", event.target.value)}
                placeholder="50000"
                inputMode="numeric"
                style={input}
              />
            </div>

            <div>
              <label style={label}>Estimated Value</label>
              <input
                value={form.estimated_value}
                onChange={(event) => update("estimated_value", event.target.value)}
                placeholder="250000"
                inputMode="numeric"
                style={input}
              />
            </div>

            <div>
              <label style={label}>Estimated Repairs</label>
              <input
                value={form.estimated_repairs}
                onChange={(event) => update("estimated_repairs", event.target.value)}
                placeholder="35000"
                inputMode="numeric"
                style={input}
              />
            </div>
          </div>
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
            <p style={{ color: status.toLowerCase().includes("routed") ? "#9df3bf" : "#ffd0d0", fontWeight: 950 }}>
              {status}
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
