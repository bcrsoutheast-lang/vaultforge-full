"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import VaultForgeCommandShell from "../components/VaultForgeCommandShell";
import VaultForgeRoomTerminalCard from "../components/VaultForgeRoomTerminalCard";

export const dynamic = "force-dynamic";

type Deal = Record<string, any>;

type Folder = "active" | "saved" | "archived" | "hidden";

function pick(obj: Deal, keys: string[], fallback = "") {
  for (const key of keys) {
    const value = obj?.[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") return String(value);
  }
  return fallback;
}

function money(value: string) {
  if (!value) return "";
  if (value.includes("$")) return value;
  const n = Number(String(value).replace(/[^0-9.-]/g, ""));
  if (!Number.isFinite(n) || n <= 0) return value;
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${Math.round(n / 1000)}K`;
  return `$${n.toLocaleString()}`;
}

function firstImage(row: Deal) {
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

function statusOf(row: Deal): Folder {
  const raw = pick(row, ["room_status", "status", "folder"], "active").toLowerCase();
  if (raw.includes("save")) return "saved";
  if (raw.includes("archive")) return "archived";
  if (raw.includes("delete") || raw.includes("hide") || raw.includes("hidden")) return "hidden";
  return "active";
}

export default function OpportunityRoomsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [folder, setFolder] = useState<Folder>("active");
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/deal/feed", { cache: "no-store" });
        const json = await res.json().catch(() => ({}));
        const rows = Array.isArray(json) ? json : json.deals || json.items || json.rows || json.data || [];
        if (alive) setDeals(Array.isArray(rows) ? rows : []);
      } catch (err: any) {
        if (alive) setError(err?.message || "Opportunity feed could not load.");
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => {
      alive = false;
    };
  }, []);

  const filtered = useMemo(() => deals.filter((row) => statusOf(row) === folder), [deals, folder]);

  const counts = useMemo(() => {
    return deals.reduce(
      (acc, row) => {
        acc[statusOf(row)] += 1;
        return acc;
      },
      { active: 0, saved: 0, archived: 0, hidden: 0 } as Record<Folder, number>,
    );
  }, [deals]);

  return (
    <VaultForgeCommandShell title="Opportunity Rooms" subtitle="Deal flow · acquisition targets · execution pipeline">
      <main style={page}>
        <section style={hero}>
          <div>
            <div style={eyebrow}>VAULTFORGE OPPORTUNITY COMMAND</div>
            <h1 style={h1}>Opportunity rooms are the only deal rooms.</h1>
            <p style={lead}>
              Alerts, routing, intelligence, and messages should attach behind the scenes to these rooms. This page is the consolidated deal-side command lane.
            </p>
          </div>
          <div style={heroPanel}>
            <div style={metricLabel}>Active Opportunities</div>
            <div style={metricNumber}>{counts.active}</div>
            <div style={metricSub}>Saved {counts.saved} · Archived {counts.archived} · Hidden {counts.hidden}</div>
          </div>
        </section>

        <section style={toolbar}>
          {(["active", "saved", "archived", "hidden"] as Folder[]).map((key) => (
            <button key={key} onClick={() => setFolder(key)} style={folder === key ? tabActive : tab}>
              {key === "hidden" ? "Hidden / Deleted" : key.toUpperCase()} <span style={{ opacity: .75 }}>{counts[key]}</span>
            </button>
          ))}
          <Link href="/submit" style={primaryLink}>+ New Opportunity</Link>
        </section>

        {error ? <div style={errorBox}>{error}</div> : null}
        {loading ? <div style={emptyBox}>Loading opportunity rooms...</div> : null}
        {!loading && filtered.length === 0 ? <div style={emptyBox}>No {folder} opportunity rooms found.</div> : null}

        <section style={grid}>
          {filtered.map((row, index) => {
            const id = pick(row, ["id", "deal_id", "room_id"], String(index));
            const title = pick(row, ["title", "deal_title", "property_title", "name"], "Untitled Opportunity");
            const city = pick(row, ["city", "market_city"]);
            const state = pick(row, ["state", "market_state"]);
            const county = pick(row, ["county"]);
            const asset = pick(row, ["asset_type", "property_type", "type"]);
            const asking = money(pick(row, ["asking_price", "price", "purchase_price"]));
            const arv = money(pick(row, ["arv", "after_repair_value"]));
            const score = pick(row, ["score", "ai_score", "fit_score"], "");
            return (
              <VaultForgeRoomTerminalCard
                key={`${id}-${index}`}
                type="opportunity"
                title={title}
                subtitle={pick(row, ["ai_summary", "summary", "description", "notes"], asset || "Opportunity room")}
                location={[city, county, state].filter(Boolean).join(", ")}
                valueLine={[asking && `Ask ${asking}`, arv && `ARV ${arv}`].filter(Boolean).join(" · ")}
                score={score}
                status={statusOf(row)}
                urgency={pick(row, ["urgency", "priority", "severity"], "active")}
                href={`/deal/detail?id=${encodeURIComponent(id)}`}
                imageUrl={firstImage(row)}
                meta={[asset, pick(row, ["strategy"]), pick(row, ["created_at", "inserted_at"])].filter(Boolean)}
              />
            );
          })}
        </section>
      </main>
    </VaultForgeCommandShell>
  );
}

const page: React.CSSProperties = { minHeight: "100vh", padding: "22px", color: "#fff" };
const hero: React.CSSProperties = { display: "grid", gridTemplateColumns: "minmax(0,1fr) 260px", gap: 18, border: "1px solid rgba(245,200,76,.26)", borderRadius: 24, padding: 22, background: "linear-gradient(135deg, rgba(245,200,76,.1), rgba(7,12,16,.92))", boxShadow: "0 0 35px rgba(245,200,76,.08)", marginBottom: 18 };
const eyebrow: React.CSSProperties = { color: "#f5c84c", fontWeight: 950, letterSpacing: ".24em", fontSize: 12, marginBottom: 10 };
const h1: React.CSSProperties = { margin: 0, fontSize: "clamp(32px, 6vw, 72px)", lineHeight: .92, letterSpacing: "-.06em" };
const lead: React.CSSProperties = { maxWidth: 820, color: "#cbd5e1", fontSize: 18, lineHeight: 1.55, margin: "18px 0 0" };
const heroPanel: React.CSSProperties = { border: "1px solid rgba(255,255,255,.12)", background: "rgba(0,0,0,.28)", borderRadius: 20, padding: 18, alignSelf: "stretch", display: "flex", flexDirection: "column", justifyContent: "center" };
const metricLabel: React.CSSProperties = { color: "#9aa4b2", textTransform: "uppercase", letterSpacing: ".16em", fontSize: 11, fontWeight: 900 };
const metricNumber: React.CSSProperties = { color: "#f5c84c", fontSize: 58, fontWeight: 950, lineHeight: 1, marginTop: 8 };
const metricSub: React.CSSProperties = { color: "#cbd5e1", fontSize: 13, marginTop: 10 };
const toolbar: React.CSSProperties = { display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", marginBottom: 16 };
const tab: React.CSSProperties = { border: "1px solid rgba(255,255,255,.13)", background: "rgba(255,255,255,.045)", color: "#cbd5e1", borderRadius: 999, padding: "10px 13px", fontWeight: 900, cursor: "pointer" };
const tabActive: React.CSSProperties = { ...tab, borderColor: "rgba(245,200,76,.65)", color: "#111827", background: "linear-gradient(135deg,#f5c84c,#fff2a8)" };
const primaryLink: React.CSSProperties = { marginLeft: "auto", border: "1px solid rgba(245,200,76,.45)", background: "rgba(245,200,76,.12)", color: "#f5c84c", borderRadius: 999, padding: "10px 14px", fontWeight: 950, textDecoration: "none" };
const grid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 14 };
const emptyBox: React.CSSProperties = { border: "1px dashed rgba(255,255,255,.18)", borderRadius: 18, padding: 28, color: "#cbd5e1", background: "rgba(255,255,255,.035)", marginBottom: 14 };
const errorBox: React.CSSProperties = { border: "1px solid rgba(255,59,48,.38)", borderRadius: 18, padding: 16, color: "#ffd1ce", background: "rgba(255,59,48,.1)", marginBottom: 14 };
