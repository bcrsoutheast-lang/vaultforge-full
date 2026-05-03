"use client";

import { useState } from "react";
import Link from "next/link";
import { getVaultForgeEmail, vaultForgeHeaders } from "../lib/vaultforge-client-auth";

const STATES = ["Georgia", "Tennessee", "Florida", "North Carolina", "South Carolina", "Texas"];
const PROPERTY_TYPES = ["Residential", "Commercial", "Land"];
const STRATEGIES = ["Fix & Flip", "Rental", "Wholesale", "Development"];

const shellStyle: React.CSSProperties = { minHeight: "100vh", background: "#071326", color: "white", padding: "36px 22px 80px", fontFamily: "Arial, sans-serif" };
const navStyle: React.CSSProperties = { display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 24 };
const navLinkStyle: React.CSSProperties = { color: "white", textDecoration: "none", border: "1px solid rgba(255,255,255,.25)", borderRadius: 999, padding: "11px 15px", fontSize: 15 };
const heroStyle: React.CSSProperties = { border: "1px solid rgba(255,255,255,.2)", background: "rgba(255,255,255,.05)", borderRadius: 28, padding: 28, marginBottom: 22 };
const cardStyle: React.CSSProperties = { border: "1px solid rgba(255,255,255,.18)", background: "rgba(255,255,255,.04)", borderRadius: 24, padding: 22, marginBottom: 16 };
const inputStyle: React.CSSProperties = { width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,.08)", color: "white", border: "1px solid rgba(255,255,255,.25)", borderRadius: 16, padding: "14px 16px", fontSize: 18, marginBottom: 14 };
const buttonStyle: React.CSSProperties = { border: 0, background: "#9df3bf", color: "#071326", borderRadius: 999, padding: "14px 18px", fontWeight: 800, cursor: "pointer" };

function Nav() {
  return <nav style={navStyle}><Link href="/dashboard" style={navLinkStyle}>Dashboard</Link><Link href="/profile" style={navLinkStyle}>Profile</Link><Link href="/projects" style={navLinkStyle}>Projects</Link><Link href="/buy-bucket" style={navLinkStyle}>Buy Bucket</Link><Link href="/alerts" style={navLinkStyle}>Alerts</Link><Link href="/messages" style={navLinkStyle}>Messages</Link><Link href="/network" style={navLinkStyle}>Network</Link></nav>;
}

export default function SubmitPage() {
  const [title, setTitle] = useState("");
  const [state, setState] = useState("Georgia");
  const [propertyType, setPropertyType] = useState("Residential");
  const [strategy, setStrategy] = useState("Fix & Flip");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("");
  const [aiSummary, setAiSummary] = useState("");
  const [routingMessage, setRoutingMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function saveDeal() {
    setStatus("");
    setAiSummary("");
    setRoutingMessage("");

    if (!getVaultForgeEmail()) {
      setStatus("Session missing. Go to Login and enter your email again.");
      return;
    }

    setSaving(true);

    try {
      const res = await fetch("/api/deal/create", {
        method: "POST",
        headers: vaultForgeHeaders(),
        body: JSON.stringify({ title, state, property_type: propertyType, strategy, price, description }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus(data?.error || "Could not save deal.");
      } else {
        setStatus("Deal saved with AI analysis.");
        setAiSummary(data?.ai?.ai_summary || "");
        setRoutingMessage(`Routing complete: ${data?.routing?.matched || 0} matching member alert(s) created.`);
        setTitle(""); setPrice(""); setDescription("");
      }
    } catch {
      setStatus("Could not save deal. Refresh and try again.");
    }

    setSaving(false);
  }

  return (
    <main style={shellStyle}>
      <Nav />
      <section style={heroStyle}><p style={{ color: "#9df3bf", letterSpacing: 4, fontWeight: 800 }}>VAULTFORGE CREATE</p><h1 style={{ fontSize: 54, lineHeight: 1, margin: "10px 0 18px" }}>Submit Deal</h1><p style={{ color: "rgba(255,255,255,.72)", fontSize: 22, lineHeight: 1.45 }}>Structured deal entry with AI analysis and automatic match alerts.</p></section>
      <section style={cardStyle}>
        <label style={{ display: "block", fontWeight: 800, marginBottom: 8 }}>Title *</label><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Example: ATL Flip" style={inputStyle} />
        <label style={{ display: "block", fontWeight: 800, marginBottom: 8 }}>State *</label><select value={state} onChange={(e) => setState(e.target.value)} style={inputStyle}>{STATES.map((item) => <option key={item}>{item}</option>)}</select>
        <label style={{ display: "block", fontWeight: 800, marginBottom: 8 }}>Property Type *</label><select value={propertyType} onChange={(e) => setPropertyType(e.target.value)} style={inputStyle}>{PROPERTY_TYPES.map((item) => <option key={item}>{item}</option>)}</select>
        <label style={{ display: "block", fontWeight: 800, marginBottom: 8 }}>Strategy / Bucket</label><select value={strategy} onChange={(e) => setStrategy(e.target.value)} style={inputStyle}>{STRATEGIES.map((item) => <option key={item}>{item}</option>)}</select>
        <label style={{ display: "block", fontWeight: 800, marginBottom: 8 }}>Price</label><input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Example: 250000" style={inputStyle} />
        <label style={{ display: "block", fontWeight: 800, marginBottom: 8 }}>Description</label><textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={6} placeholder="Condition, numbers, notes, what help is needed..." style={inputStyle} />
        <button style={buttonStyle} onClick={saveDeal} disabled={saving}>{saving ? "Saving..." : "Save Deal + Route"}</button>
      </section>
      {status && <section style={{ ...cardStyle, color: status.toLowerCase().includes("missing") || status.toLowerCase().includes("could") || status.toLowerCase().includes("not logged") ? "#ffd0d0" : "#9df3bf" }}>{status}</section>}
      {routingMessage && <section style={{ ...cardStyle, color: "#9df3bf" }}>{routingMessage}</section>}
      {aiSummary && <section style={cardStyle}><p style={{ color: "#9df3bf", letterSpacing: 4, fontWeight: 800 }}>AI DEAL ANALYSIS</p><p style={{ color: "rgba(255,255,255,.78)", fontSize: 20, lineHeight: 1.5 }}>{aiSummary}</p></section>}
    </main>
  );
}
