"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import VaultForgeCommandShell from "../components/VaultForgeCommandShell";
import VaultForgeRoomTerminalCard from "../components/VaultForgeRoomTerminalCard";

export const dynamic = "force-dynamic";

type Pain = Record<string, any>;
type Folder = "active" | "saved" | "archived" | "hidden";

function pick(obj: Pain, keys: string[], fallback = "") {
  for (const key of keys) {
    const value = obj?.[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") return String(value);
  }
  return fallback;
}

function firstImage(row: Pain) {
  const fields = [row.image_url, row.photo_url, row.cover_photo, row.primary_photo];
  for (const field of fields) if (typeof field === "string" && field.startsWith("http")) return field;
  const arrays = [row.photo_urls, row.photos, row.images];
  for (const arr of arrays) {
    if (Array.isArray(arr) && typeof arr[0] === "string") return arr[0];
    if (typeof arr === "string" && arr.startsWith("[")) {
      try {
        const parsed = JSON.parse(arr);
        if (Array.isArray(parsed) && typeof parsed[0] === "string") return parsed[0];
      } catch {}
    }
  }
  return "";
}

function statusOf(row: Pain): Folder {
  const raw = pick(row, ["room_status", "status", "folder"], "active").toLowerCase();
  if (raw.includes("save")) return "saved";
  if (raw.includes("archive")) return "archived";
  if (raw.includes("delete") || raw.includes("hide") || raw.includes("hidden")) return "hidden";
  return "active";
}

function urgencyOf(row: Pain) {
  const raw = pick(row, ["urgency", "priority", "severity", "pain_level"], "high").toLowerCase();
  if (raw.includes("critical") || raw.includes("emergency")) return "critical";
  if (raw.includes("medium")) return "medium";
  if (raw.includes("low")) return "low";
  return "high";
}

export default function PressureRoomsPage() {
  const [items, setItems] = useState<Pain[]>([]);
  const [loading, setLoading] = useState(true);
  const [folder, setFolder] = useState<Folder>("active");
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/pain/feed", { cache: "no-store" });
        const json = await res.json().catch(() => ({}));
        const rows = Array.isArray(json) ? json : json.pain || json.items || json.rows || json.data || [];
        if (alive) setItems(Array.isArray(rows) ? rows : []);
      } catch (err: any) {
        if (alive) setError(err?.message || "Pressure feed could not load.");
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => {
      alive = false;
    };
  }, []);

  const filtered = useMemo(() => items.filter((row) => statusOf(row) === folder), [items, folder]);
  const counts = useMemo(() => items.reduce((acc, row) => { acc[statusOf(row)] += 1; return acc; }, { active: 0, saved: 0, archived: 0, hidden: 0 } as Record<Folder, number>), [items]);
  const criticalCount = useMemo(() => items.filter((row) => urgencyOf(row) === "critical").length, [items]);

  return (
    <VaultForgeCommandShell title="Pressure Rooms" subtitle="Pain · distress · execution pressure">
      <main style={page}>
        <section style={hero}>
          <div>
            <div style={eyebrow}>VAULTFORGE PRESSURE COMMAND</div>
            <h1 style={h1}>Pain rooms carry the pressure signals.</h1>
            <p style={lead}>
              Distress, capital gaps, stalled projects, motivated sellers, operator issues, and urgent execution problems live here. Alerts and routing should attach behind the scenes.
            </p>
          </div>
          <div style={heroPanel}>
            <div style={metricLabel}>Critical Pressure</div>
            <div style={metricNumber}>{criticalCount}</div>
            <div style={metricSub}>Active {counts.active} · Saved {counts.saved} · Archived {counts.archived}</div>
          </div>
        </section>

        <section style={toolbar}>
          {(["active", "saved", "archived", "hidden"] as Folder[]).map((key) => (
            <button key={key} onClick={() => setFolder(key)} style={folder === key ? tabActive : tab}>
              {key === "hidden" ? "Hidden / Deleted" : key.toUpperCase()} <span style={{ opacity: .75 }}>{counts[key]}</span>
            </button>
          ))}
          <Link href="/pain" style={primaryLink}>+ New Pain Intake</Link>
        </section>

        {error ? <div style={errorBox}>{error}</div> : null}
        {loading ? <div style={emptyBox}>Loading pressure rooms...</div> : null}
        {!loading && filtered.length === 0 ? <div style={emptyBox}>No {folder} pressure rooms found.</div> : null}

        <section style={grid}>
          {filtered.map((row, index) => {
            const id = pick(row, ["id", "pain_id", "room_id"], String(index));
            const title = pick(row, ["title", "pain_title", "problem_title", "name"], "Untitled Pressure Room");
            const city = pick(row, ["city", "market_city"]);
            const state = pick(row, ["state", "market_state"]);
            const county = pick(row, ["county"]);
            const painType = pick(row, ["pain_type", "problem_type", "category"]);
            const score = pick(row, ["urgency_score", "score", "ai_score"], "");
            const gap = pick(row, ["capital_gap", "funding_gap", "amount_needed"]);
            return (
              <VaultForgeRoomTerminalCard
                key={`${id}-${index}`}
                type="pain"
                title={title}
                subtitle={pick(row, ["ai_summary", "summary", "description", "notes"], painType || "Pressure room")}
                location={[city, county, state].filter(Boolean).join(", ")}
                valueLine={gap ? `Gap ${gap}` : pick(row, ["timeline", "deadline", "time_pressure"])}
                score={score}
                status={statusOf(row)}
                urgency={urgencyOf(row)}
                href={`/pain-room/${encodeURIComponent(id)}`}
                imageUrl={firstImage(row)}
                meta={[painType, pick(row, ["confidentiality"]), pick(row, ["created_at", "inserted_at"])].filter(Boolean)}
              />
            );
          })}
        </section>
      </main>
    </VaultForgeCommandShell>
  );
}

const page: React.CSSProperties = { minHeight: "100vh", padding: "22px", color: "#fff" };
const hero: React.CSSProperties = { display: "grid", gridTemplateColumns: "minmax(0,1fr) 260px", gap: 18, border: "1px solid rgba(255,59,48,.28)", borderRadius: 24, padding: 22, background: "linear-gradient(135deg, rgba(255,59,48,.12), rgba(7,12,16,.92))", boxShadow: "0 0 35px rgba(255,59,48,.08)", marginBottom: 18 };
const eyebrow: React.CSSProperties = { color: "#ff6b61", fontWeight: 950, letterSpacing: ".24em", fontSize: 12, marginBottom: 10 };
const h1: React.CSSProperties = { margin: 0, fontSize: "clamp(32px, 6vw, 72px)", lineHeight: .92, letterSpacing: "-.06em" };
const lead: React.CSSProperties = { maxWidth: 820, color: "#cbd5e1", fontSize: 18, lineHeight: 1.55, margin: "18px 0 0" };
const heroPanel: React.CSSProperties = { border: "1px solid rgba(255,255,255,.12)", background: "rgba(0,0,0,.28)", borderRadius: 20, padding: 18, alignSelf: "stretch", display: "flex", flexDirection: "column", justifyContent: "center" };
const metricLabel: React.CSSProperties = { color: "#9aa4b2", textTransform: "uppercase", letterSpacing: ".16em", fontSize: 11, fontWeight: 900 };
const metricNumber: React.CSSProperties = { color: "#ff3b30", fontSize: 58, fontWeight: 950, lineHeight: 1, marginTop: 8 };
const metricSub: React.CSSProperties = { color: "#cbd5e1", fontSize: 13, marginTop: 10 };
const toolbar: React.CSSProperties = { display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", marginBottom: 16 };
const tab: React.CSSProperties = { border: "1px solid rgba(255,255,255,.13)", background: "rgba(255,255,255,.045)", color: "#cbd5e1", borderRadius: 999, padding: "10px 13px", fontWeight: 900, cursor: "pointer" };
const tabActive: React.CSSProperties = { ...tab, borderColor: "rgba(255,59,48,.65)", color: "#fff", background: "linear-gradient(135deg,#7f1d1d,#ff3b30)" };
const primaryLink: React.CSSProperties = { marginLeft: "auto", border: "1px solid rgba(255,59,48,.45)", background: "rgba(255,59,48,.12)", color: "#ff9a94", borderRadius: 999, padding: "10px 14px", fontWeight: 950, textDecoration: "none" };
const grid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 14 };
const emptyBox: React.CSSProperties = { border: "1px dashed rgba(255,255,255,.18)", borderRadius: 18, padding: 28, color: "#cbd5e1", background: "rgba(255,255,255,.035)", marginBottom: 14 };
const errorBox: React.CSSProperties = { border: "1px solid rgba(255,59,48,.38)", borderRadius: 18, padding: 16, color: "#ffd1ce", background: "rgba(255,59,48,.1)", marginBottom: 14 };
