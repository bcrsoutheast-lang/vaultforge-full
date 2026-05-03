"use client";

import Link from "next/link";
import { useState } from "react";

const STATES = [
  "Georgia",
  "Tennessee",
  "Florida",
  "North Carolina",
  "South Carolina",
  "Texas",
];

const PROPERTY_TYPES = ["Residential", "Commercial", "Land"];
const STRATEGIES = ["Fix & Flip", "Rental", "Wholesale", "Development", "Buy Box"];

export default function SubmitPage() {
  const [title, setTitle] = useState("");
  const [state, setState] = useState("Georgia");
  const [propertyType, setPropertyType] = useState("Residential");
  const [strategy, setStrategy] = useState("Fix & Flip");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function submitDeal() {
    setMessage("");

    if (!title.trim()) {
      setMessage("Add a deal title first.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/deal/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          state,
          property_type: propertyType,
          strategy,
          price,
          description,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        setMessage(result.error || "Deal did not save.");
        return;
      }

      setMessage("Deal saved. Open Projects to confirm it stayed saved.");
      setTitle("");
      setPrice("");
      setDescription("");
    } catch (error: any) {
      setMessage(error?.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main style={page}>
      <nav style={nav}>
        <Link style={link} href="/dashboard">Dashboard</Link>
        <Link style={link} href="/projects">Projects</Link>
        <Link style={link} href="/network">Network</Link>
      </nav>

      <section style={card}>
        <p style={eyebrow}>VaultForge Deal Intake</p>
        <h1 style={titleStyle}>Create Deal</h1>
        <p style={subtext}>
          Submit clean structured deals only. States are locked to Georgia, Tennessee,
          Florida, North Carolina, South Carolina, and Texas.
        </p>

        <label style={label}>Deal Title *</label>
        <input
          style={input}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Example: Atlanta flip opportunity near BeltLine"
        />

        <label style={label}>State *</label>
        <select style={input} value={state} onChange={(event) => setState(event.target.value)}>
          {STATES.map((item) => <option key={item}>{item}</option>)}
        </select>

        <label style={label}>Property Type *</label>
        <select
          style={input}
          value={propertyType}
          onChange={(event) => setPropertyType(event.target.value)}
        >
          {PROPERTY_TYPES.map((item) => <option key={item}>{item}</option>)}
        </select>

        <label style={label}>Strategy / Bucket</label>
        <select style={input} value={strategy} onChange={(event) => setStrategy(event.target.value)}>
          {STRATEGIES.map((item) => <option key={item}>{item}</option>)}
        </select>

        <label style={label}>Price</label>
        <input
          style={input}
          inputMode="numeric"
          value={price}
          onChange={(event) => setPrice(event.target.value)}
          placeholder="250000"
        />

        <label style={label}>Description</label>
        <textarea
          style={{ ...input, minHeight: 130 }}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Add condition, timeline, access notes, funding need, or buyer/lender fit."
        />

        <button style={button} disabled={saving} onClick={submitDeal}>
          {saving ? "Saving..." : "Save Deal"}
        </button>

        {message ? <p style={messageStyle}>{message}</p> : null}
      </section>
    </main>
  );
}

const page = { minHeight: "100vh", padding: 24, background: "#071326", color: "white", fontFamily: "Arial" };
const nav = { display: "flex", gap: 12, flexWrap: "wrap" as const, marginBottom: 24 };
const link = { color: "white", textDecoration: "none", border: "1px solid rgba(255,255,255,.25)", borderRadius: 999, padding: "10px 14px" };
const card = { maxWidth: 760, background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.16)", borderRadius: 22, padding: 24 };
const eyebrow = { color: "#a7f3d0", fontSize: 13, letterSpacing: 1, textTransform: "uppercase" as const };
const titleStyle = { fontSize: 36, margin: "8px 0" };
const subtext = { color: "rgba(255,255,255,.76)", lineHeight: 1.5 };
const label = { display: "block", marginTop: 16, marginBottom: 6, fontWeight: 700 };
const input = { width: "100%", boxSizing: "border-box" as const, borderRadius: 14, padding: 14, border: "1px solid rgba(255,255,255,.22)", background: "rgba(255,255,255,.08)", color: "white", fontSize: 16 };
const button = { marginTop: 18, border: 0, borderRadius: 14, padding: "14px 18px", fontWeight: 800, cursor: "pointer" };
const messageStyle = { marginTop: 14, color: "#a7f3d0", fontWeight: 700 };
